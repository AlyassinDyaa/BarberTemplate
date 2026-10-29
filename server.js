/* =========================================================
   Barber template server — zero dependencies (Node 18+).
   Serves the site and a password-protected admin API that
   writes js/config.js, so changes go live for every visitor.

     node server.js            (PORT env var optional, default 5173)

   First visit to /admin.html asks you to create the admin password.
   To reset it, delete data/admin.json and restart.
   ========================================================= */
"use strict";

const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const CONFIG_FILE = path.join(ROOT, "js", "config.js");
const DATA_DIR = path.join(ROOT, "data");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const UPLOAD_DIR = path.join(ROOT, "assets", "uploads");

const SESSION_HOURS = 12;
const MAX_JSON = 2 * 1024 * 1024;     // 2 MB config
const MAX_UPLOAD = 10 * 1024 * 1024;  // 10 MB image

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".md": "text/plain; charset=utf-8",
};
const UPLOAD_TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif" };

/* ---------- Sessions & login throttling ---------- */
const sessions = new Map(); // token -> expiry ms
const failures = new Map(); // ip -> { count, until }

function newSession(res) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_HOURS * 3600e3);
  res.setHeader("Set-Cookie", `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`);
}
function sessionToken(req) {
  const m = /(?:^|;\s*)admin_session=([a-f0-9]{64})/.exec(req.headers.cookie || "");
  return m ? m[1] : null;
}
function isAuthed(req) {
  const t = sessionToken(req);
  if (!t || !sessions.has(t)) return false;
  if (sessions.get(t) < Date.now()) { sessions.delete(t); return false; }
  return true;
}
function throttled(ip) {
  const f = failures.get(ip);
  return f && f.count >= 5 && f.until > Date.now();
}
function recordFailure(ip) {
  const f = failures.get(ip) || { count: 0, until: 0 };
  f.count = f.until < Date.now() ? 1 : f.count + 1;
  f.until = Date.now() + 60e3;
  failures.set(ip, f);
}

/* ---------- Password hashing (scrypt) ---------- */
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve({ salt, hash: key.toString("hex") })));
  });
}
async function readAdmin() {
  try { return JSON.parse(await fs.readFile(ADMIN_FILE, "utf8")); } catch { return null; }
}

/* ---------- Config file (js/config.js) ---------- */
async function readConfig() {
  const src = await fs.readFile(CONFIG_FILE, "utf8");
  const start = src.indexOf("{", src.indexOf("window.SITE_CONFIG"));
  const end = src.lastIndexOf("}");
  return JSON.parse(src.slice(start, end + 1));
}
async function writeConfig(cfg) {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.copyFile(CONFIG_FILE, path.join(BACKUP_DIR, `config-${stamp}.js`));
    const backups = (await fs.readdir(BACKUP_DIR)).filter((f) => f.startsWith("config-")).sort();
    for (const old of backups.slice(0, -20)) await fs.unlink(path.join(BACKUP_DIR, old));
  } catch { /* first save: nothing to back up */ }

  const body =
    "/* =========================================================\n" +
    "   SITE CONFIG — edit with the admin panel (/admin.html)\n" +
    "   or by hand. Must stay valid JSON inside the braces.\n" +
    "   ========================================================= */\n" +
    "window.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  const tmp = CONFIG_FILE + ".tmp";
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, CONFIG_FILE);
}
function validConfig(cfg) {
  const required = ["barber", "theme", "hero", "about", "shop", "hours", "services", "cuts", "gallery", "reviews"];
  return cfg && typeof cfg === "object" && !Array.isArray(cfg) && required.every((k) => k in cfg);
}

/* ---------- Helpers ---------- */
function send(res, status, data, headers = {}) {
  const body = typeof data === "string" || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, { "Content-Type": typeof data === "object" && !Buffer.isBuffer(data) ? "application/json; charset=utf-8" : "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error("Too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
async function readJson(req) {
  try { return JSON.parse((await readBody(req, MAX_JSON)).toString("utf8")); }
  catch (e) { throw Object.assign(new Error(e.status ? e.message : "Invalid JSON"), { status: e.status || 400 }); }
}
// Mutating requests must come from this same site (blocks cross-site form posts)
function sameOrigin(req) {
  const origin = req.headers.origin;
  return !origin || origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`;
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const ip = req.socket.remoteAddress;
  const route = `${req.method} ${url.pathname}`;
  if (req.method !== "GET" && !sameOrigin(req)) return send(res, 403, { error: "Cross-origin request blocked" });

  if (route === "GET /api/status") {
    return send(res, 200, { setup: !(await readAdmin()), authed: isAuthed(req) });
  }

  if (route === "POST /api/setup") {
    if (await readAdmin()) return send(res, 409, { error: "Admin password already set." });
    const { password } = await readJson(req);
    if (typeof password !== "string" || password.length < 10) return send(res, 400, { error: "Use at least 10 characters." });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(ADMIN_FILE, JSON.stringify(await hashPassword(password)), "utf8");
    newSession(res);
    return send(res, 200, { ok: true });
  }

  if (route === "POST /api/login") {
    if (throttled(ip)) return send(res, 429, { error: "Too many attempts. Wait a minute and try again." });
    const admin = await readAdmin();
    const { password } = await readJson(req);
    if (!admin || typeof password !== "string") return send(res, 400, { error: "Not set up yet." });
    const { hash } = await hashPassword(password, admin.salt);
    const ok = crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(admin.hash, "hex"));
    if (!ok) { recordFailure(ip); return send(res, 401, { error: "That password isn't right." }); }
    failures.delete(ip);
    newSession(res);
    return send(res, 200, { ok: true });
  }

  if (route === "POST /api/logout") {
    const t = sessionToken(req);
    if (t) sessions.delete(t);
    return send(res, 200, { ok: true }, { "Set-Cookie": "admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
  }

  if (!isAuthed(req)) return send(res, 401, { error: "Please log in." });

  if (route === "GET /api/config") return send(res, 200, await readConfig());

  if (route === "PUT /api/config") {
    const cfg = await readJson(req);
    if (!validConfig(cfg)) return send(res, 400, { error: "Config is missing required sections." });
    await writeConfig(cfg);
    return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
  }

  if (route === "POST /api/password") {
    const { current, next } = await readJson(req);
    const admin = await readAdmin();
    const { hash } = await hashPassword(String(current || ""), admin.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(admin.hash, "hex"))) return send(res, 401, { error: "Current password isn't right." });
    if (typeof next !== "string" || next.length < 10) return send(res, 400, { error: "Use at least 10 characters." });
    await fs.writeFile(ADMIN_FILE, JSON.stringify(await hashPassword(next)), "utf8");
    return send(res, 200, { ok: true });
  }

  if (route === "POST /api/upload") {
    const type = (req.headers["content-type"] || "").split(";")[0].trim();
    const ext = UPLOAD_TYPES[type];
    if (!ext) return send(res, 415, { error: "Upload a JPG, PNG, WebP, AVIF or GIF image." });
    const data = await readBody(req, MAX_UPLOAD);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), data);
    return send(res, 200, { path: `assets/uploads/${name}` });
  }

  return send(res, 404, { error: "Not found" });
}

/* ---------- Static files ---------- */
async function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  const relToRoot = path.relative(ROOT, file);
  // Never serve outside the project, dotfiles, server code, or private data
  if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot) || /(^|[\\/])\./.test(relToRoot) ||
      /^(data|node_modules)([\\/]|$)/.test(relToRoot) || relToRoot === "server.js" || relToRoot.endsWith(".tmp")) {
    return send(res, 404, "Not found");
  }
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      // Pages, scripts and styles always revalidate so published edits show immediately
      "Cache-Control": [".html", ".js", ".css"].includes(ext) ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    send(res, 404, "Not found");
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) await api(req, res, url);
    else await serveStatic(req, res, url);
  } catch (err) {
    send(res, err.status || 500, { error: err.status ? err.message : "Server error" });
    if (!err.status) console.error(err);
  }
}).listen(PORT, () => {
  console.log(`Site:  http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin.html`);
});
