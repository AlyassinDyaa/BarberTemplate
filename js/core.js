/* Runs in <head> before paint: applies the theme from SITE_CONFIG so there's
   no flash of the wrong look. In admin preview mode (?preview=1) it uses the
   admin panel's unsaved draft instead of the published config. */
(function () {
  "use strict";

  const DRAFT_KEY = "barber-admin-draft";
  const root = document.documentElement;
  const preview = /[?&]preview=1/.test(location.search);
  if (preview) {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (draft && draft.barber) window.SITE_CONFIG = draft;
    } catch (e) { /* fall back to published config */ }
  }
  const cfg = window.SITE_CONFIG;

  const FONTS = {
    studio: { label: "Studio", sample: "Schibsted Grotesk", display: '"Schibsted Grotesk"', body: '"Schibsted Grotesk"', transform: "none", weight: 600, tracking: "-0.025em",
      query: "family=Schibsted+Grotesk:ital,wght@0,400..700;1,400..600" },
    editorial: { label: "Editorial", sample: "Fraunces + Manrope", display: '"Fraunces"', body: '"Manrope"', transform: "none", weight: 450, tracking: "-0.02em",
      query: "family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Manrope:wght@400;500;600;700" },
    classic: { label: "Classic", sample: "Oswald + Inter", display: '"Oswald"', body: '"Inter"', transform: "uppercase", weight: 700, tracking: "0.01em",
      query: "family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600" },
    bold: { label: "Bold", sample: "Bebas Neue + DM Sans", display: '"Bebas Neue"', body: '"DM Sans"', transform: "uppercase", weight: 400, tracking: "0.02em",
      query: "family=Bebas+Neue&family=DM+Sans:wght@400;500;600" },
    vintage: { label: "Vintage", sample: "Playfair + Source Sans", display: '"Playfair Display"', body: '"Source Sans 3"', transform: "none", weight: 700, tracking: "0",
      query: "family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600" },
    modern: { label: "Modern", sample: "Space Grotesk + Inter", display: '"Space Grotesk"', body: '"Inter"', transform: "none", weight: 700, tracking: "-0.02em",
      query: "family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600" },
  };

  const CORNERS = {
    // arch = shape of the hero/about photo frames
    rounded: { label: "Rounded + arches", r: "14px", sm: "8px", btn: "999px", arch: "999px 999px 14px 14px" },
    soft: { label: "Soft", r: "6px", sm: "4px", btn: "6px", arch: "6px" },
    sharp: { label: "Sharp", r: "0px", sm: "0px", btn: "0px", arch: "0px" },
  };

  const ACCENTS = [
    { name: "Barber red", value: "#b4372b" },
    { name: "Brass", value: "#c8963e" },
    { name: "Navy", value: "#2f4b7c" },
    { name: "Forest", value: "#2f6b4f" },
    { name: "Plum", value: "#74457f" },
    { name: "Ink", value: "#2a2522" },
  ];

  /* ---------- Colour maths (WCAG relative luminance) ---------- */
  const DARK_BG = "#0d1626";
  const LIGHT_BG = "#f7f2e8";
  // Accent text must read on every surface: walnut, leather, chalkboard and navy (dark),
  // porcelain and mint tile (light). The first entry is the one the admin reports against.
  const DARK_SURFACES = ["#213a60", "#1d3253", "#182b48", "#16253d"];
  const LIGHT_SURFACES = ["#e6dac5", "#efe6d6", "#f7f2e8"];
  const DARK_SURFACE = DARK_SURFACES[0];
  const LIGHT_SURFACE = LIGHT_SURFACES[0];

  function rgb(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  function toHex(c) { return "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""); }
  function luminance(hex) {
    const [r, g, b] = rgb(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  }
  function mix(a, b, t) {
    const [x, y] = [rgb(a), rgb(b)];
    return toHex(x.map((v, i) => v + (y[i] - v) * t));
  }
  // Nudge a colour toward white/black until it reaches the target contrast on bg
  function ensureContrast(hex, bg, min) {
    const target = luminance(bg) < 0.5 ? "#ffffff" : "#000000";
    let out = hex;
    for (let t = 0.05; contrast(out, bg) < min && t <= 1; t += 0.05) out = mix(hex, target, t);
    return out;
  }
  function accentTokens(accent) {
    const onAccent = contrast(accent, "#17110d") >= contrast(accent, "#ffffff") ? "#17110d" : "#ffffff";
    return {
      accent,
      onAccent,
      onDark: DARK_SURFACES.reduce((c, bg) => ensureContrast(c, bg, 4.5), accent),
      onLight: LIGHT_SURFACES.reduce((c, bg) => ensureContrast(c, bg, 4.5), accent),
    };
  }

  /* ---------- Visitor light/dark preference (header toggle) ---------- */
  const VISITOR_KEY = "barber-template-mode";
  function saveVisitorMode(mode) {
    if (preview) return;
    try {
      if (mode) localStorage.setItem(VISITOR_KEY, mode);
      else localStorage.removeItem(VISITOR_KEY);
    } catch (e) { /* ignore */ }
  }
  // The site default set in the admin panel ("auto" = follow the system)
  const ownerMode = cfg.theme.mode;
  if (!preview) {
    try {
      const visitorMode = localStorage.getItem(VISITOR_KEY);
      if (visitorMode === "light" || visitorMode === "dark") cfg.theme.mode = visitorMode;
    } catch (e) { /* ignore */ }
  }

  /* ---------- Apply theme ---------- */
  const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
  function resolveMode(mode) {
    if (mode === "auto") return lightQuery.matches ? "light" : "dark";
    return mode === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    const mode = resolveMode(theme.mode);
    root.dataset.theme = mode;

    const a = accentTokens(/^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : "#b4372b");
    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--on-accent", a.onAccent);
    root.style.setProperty("--accent-on-dark", a.onDark);
    root.style.setProperty("--accent-on-light", a.onLight);

    const f = FONTS[theme.font] || FONTS.studio;
    root.style.setProperty("--font-display", f.display + ', Georgia, "Times New Roman", serif');
    root.style.setProperty("--font-body", f.body + ', system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif');
    root.style.setProperty("--heading-transform", f.transform);
    root.style.setProperty("--heading-weight", String(f.weight));
    root.style.setProperty("--heading-tracking", f.tracking);
    const link = document.getElementById("font-css");
    const href = "https://fonts.googleapis.com/css2?" + f.query + "&display=swap";
    if (link && link.href !== href) link.href = href;

    const c = CORNERS[theme.corners] || CORNERS.rounded;
    root.style.setProperty("--radius", c.r);
    root.style.setProperty("--radius-sm", c.sm);
    root.style.setProperty("--radius-btn", c.btn);
    root.style.setProperty("--arch", c.arch);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = mode === "light" ? LIGHT_BG : DARK_BG;
  }

  // When the system setting changes, drop the visitor's header-toggle choice and go back to the site default
  lightQuery.addEventListener("change", () => {
    let saved = null;
    try { saved = localStorage.getItem(VISITOR_KEY); } catch (e) { /* ignore */ }
    if (!preview && saved) { saveVisitorMode(null); cfg.theme.mode = ownerMode; }
    applyTheme(cfg.theme);
  });

  root.classList.add("js");
  applyTheme(cfg.theme);

  window.BarberCore = { ownerMode, DARK_SURFACE, LIGHT_SURFACE, DRAFT_KEY, preview, FONTS, CORNERS, ACCENTS, saveVisitorMode, applyTheme, contrast, accentTokens, resolveMode };
})();
