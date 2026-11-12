/* Admin panel — edits every part of SITE_CONFIG, previews unsaved
   changes live, and publishes through server.js. */
(function () {
  "use strict";

  const Core = window.BarberCore;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  const clone = (o) => JSON.parse(JSON.stringify(o));

  let draft = null;      // working copy being edited
  let published = "";    // JSON of the last published config
  let current = "look";  // open panel
  const openItems = new Set();

  /* ---------- Path helpers ("cuts.2.match.hair") ---------- */
  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] == null ? (o[k] = {}) : o[k]), obj);
    target[last] = value;
  }

  /* ---------- Server calls ---------- */
  async function api(method, url, body, contentType) {
    const opts = { method, credentials: "same-origin", headers: {} };
    if (body instanceof Blob) { opts.body = body; opts.headers["Content-Type"] = contentType; }
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers["Content-Type"] = "application/json"; }
    const res = await fetch(url, opts);
    let data = {};
    try { data = await res.json(); } catch (e) { /* non-JSON */ }
    if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
    return data;
  }

  const announcer = $("#announcer");
  function announce(msg) {
    announcer.textContent = "";
    setTimeout(() => { announcer.textContent = msg; }, 50);
  }

  /* =========================================================
     FIELD OPTIONS
     ========================================================= */
  const OPT = {
    mode: [["auto", "System — follows each visitor's device"], ["dark", "Always dark"], ["light", "Always light"]],
    font: () => Object.entries(Core.FONTS).map(([k, f]) => [k, `${f.label} (${f.sample})`]),
    corners: () => Object.entries(Core.CORNERS).map(([k, c]) => [k, c.label]),
    maintenance: [["1", "Low"], ["2", "Medium"], ["3", "High"]],
    rating: [5, 4, 3, 2, 1].map((n) => [String(n), `${n} star${n > 1 ? "s" : ""}`]),
    hair: [["straight", "Straight"], ["wavy", "Wavy"], ["curly", "Curly"], ["coily", "Coily"]],
    effort: [["low", "Wash & go"], ["medium", "About 5 min"], ["high", "Enjoys styling"]],
    vibe: [["sharp", "Clean & sharp"], ["natural", "Natural & textured"], ["classic", "Classic & polished"], ["bold", "Bold statement"]],
    visits: [["often", "Every 2–3 weeks"], ["monthly", "About monthly"], ["rarely", "Every couple of months"]],
    services: () => [["", "None"]].concat((draft.services || []).map((s) => [s.id, s.name || s.id])),
    categories: () => Object.entries(draft.galleryCategories || {}),
  };

  /* =========================================================
     PANELS — what can be edited
     ========================================================= */
  const SECTION_TEXT = (key, label, withIntro = true, extra = []) => ({
    legend: label,
    fields: [
      { key: `text.${key}.eyebrow`, label: "Small label above the heading" },
      { key: `text.${key}.title`, label: "Heading", required: true },
      ...(withIntro ? [{ key: `text.${key}.intro`, label: "Intro text", type: "textarea", rows: 2 }] : []),
      ...extra,
    ],
  });

  const PANELS = [
    { id: "look", title: "Look & feel", anchor: "top", intro: "Colours, fonts and the default light/dark mode for every visitor." },
    {
      id: "profile", title: "Profile & contact", anchor: "find-me",
      groups: [
        { legend: "About you", fields: [
          { key: "barber.firstName", label: "First name", required: true },
          { key: "barber.lastName", label: "Last name" },
          { key: "barber.title", label: "Title", hint: "Shown under your name, e.g. “Independent barber” or “Master barber”." },
          { key: "barber.city", label: "City", hint: "Used in the page title and hero, e.g. “Brooklyn, NY”." },
        ] },
        { legend: "Numbers in the hero", fields: [
          { key: "barber.yearsCutting", label: "Years cutting", type: "number", min: 0 },
          { key: "barber.rating", label: "Average rating", hint: "e.g. 4.9" },
          { key: "barber.reviewCount", label: "Number of reviews", hint: "e.g. 300+" },
        ] },
        { legend: "Contact", fields: [
          { key: "barber.phoneDisplay", label: "Phone (as shown)", hint: "e.g. (718) 555-0142" },
          { key: "barber.phone", label: "Phone (for tap-to-call)", type: "tel", hint: "Digits with country code, e.g. +17185550142" },
          { key: "barber.email", label: "Email", type: "email" },
          { key: "barber.bookingUrl", label: "Online booking link", type: "url", hint: "Booksy, Squire, Fresha, Calendly… Leave blank to hide the button." },
        ] },
        { legend: "Social links", fields: [
          { key: "barber.social.instagram", label: "Instagram", type: "url" },
          { key: "barber.social.tiktok", label: "TikTok", type: "url" },
          { key: "barber.social.facebook", label: "Facebook", type: "url" },
        ] },
      ],
    },
    {
      id: "hero", title: "Hero (top of page)", anchor: "top",
      groups: [
        { legend: "Headline", fields: [
          { key: "hero.headline", label: "Motto", type: "lines", rows: 3, hint: "One line per row, shown beside your name. The second line uses your accent colour." },
          { key: "hero.intro", label: "Intro sentence", type: "textarea", rows: 3, hint: "Follows “I'm [first name] —”." },
          { key: "hero.available", label: "Availability note", hint: "e.g. Taking new clients" },
        ] },
        { legend: "Your photo", fields: [{ key: "hero.image", label: "Photo of you", type: "image", required: true }] },
        { legend: "Third stat", fields: [
          { key: "hero.statValue", label: "Value", hint: "e.g. 40 min" },
          { key: "hero.statLabel", label: "Label", hint: "e.g. per appointment, minimum" },
        ] },
      ],
    },
    {
      id: "about", title: "About", anchor: "about",
      groups: [
        { legend: "Text", fields: [
          { key: "about.heading", label: "Heading", required: true },
          { key: "about.paragraphs", label: "Paragraphs", type: "paras", hint: "Leave a blank line between paragraphs." },
          { key: "about.highlights", label: "Highlights (tick list)", type: "lines", rows: 4, hint: "One per line." },
        ] },
        { legend: "Photo", fields: [{ key: "about.image", label: "About photo", type: "image", required: true }] },
      ],
    },
    {
      id: "text", title: "Section headings", anchor: "cuts",
      groups: [
        SECTION_TEXT("cuts", "Cut explorer"),
        SECTION_TEXT("finder", "Cut finder quiz"),
        SECTION_TEXT("guards", "Clipper guard guide"),
        SECTION_TEXT("services", "Services & prices"),
        SECTION_TEXT("work", "Portfolio"),
        SECTION_TEXT("find", "Find me", false),
        SECTION_TEXT("reviews", "Reviews", false),
        SECTION_TEXT("book", "Booking", true, [{ key: "text.book.policy", label: "Cancellation policy", type: "textarea", rows: 2 }]),
      ],
    },
    {
      id: "shop", title: "Shop & hours", anchor: "find-me",
      intro: "Moving chairs? This is the only part you need to change.",
      groups: [
        { legend: "Current shop", fields: [
          { key: "shop.name", label: "Shop name", required: true },
          { key: "shop.timezone", label: "Time zone", hint: "Used for the Open now / Closed sign, e.g. America/New_York, Europe/London, Australia/Sydney." },
          { key: "shop.address", label: "Address", type: "lines", rows: 3, hint: "One line per row." },
          { key: "shop.mapUrl", label: "Directions link", type: "url", hint: "Paste a Google or Apple Maps link." },
          { key: "shop.accessNote", label: "Access information", type: "textarea", rows: 2, hint: "Step-free entry, parking, quiet appointments…" },
        ] },
      ],
      collection: {
        path: "hours", legend: "Opening hours", itemName: "day",
        label: (h) => h[0] || "New day",
        fields: [{ key: "0", label: "Day", required: true }, { key: "1", label: "Hours", hint: "e.g. 10:00 am – 7:00 pm, or Closed" }],
        newItem: () => ["New day", "Closed"],
      },
    },
    {
      id: "services", title: "Services & prices", anchor: "services",
      collection: {
        path: "services", legend: "Services", itemName: "service",
        label: (s) => s.name ? `${s.name} — $${s.price}` : "New service",
        fields: [
          { key: "name", label: "Name", required: true },
          { key: "id", label: "ID", hint: "Short code used to link cuts to this service. Updates automatically from the name." },
          { key: "desc", label: "Description", type: "textarea", rows: 2 },
          { key: "price", label: "Price ($)", type: "number", min: 0, required: true },
          { key: "duration", label: "Duration (minutes)", type: "number", min: 0 },
          { key: "note", label: "Small note", hint: "e.g. under 12" },
          { key: "featured", label: "Highlight tag", hint: "e.g. Most booked. Leave blank for no highlight." },
        ],
        newItem: () => ({ id: "new-service-" + Date.now().toString(36), name: "", desc: "", price: 0, duration: 30 }),
      },
    },
    {
      id: "cuts", title: "Cuts", anchor: "cuts",
      intro: "These power the cut explorer and the cut finder quiz.",
      collection: {
        path: "cuts", legend: "Cuts", itemName: "cut",
        label: (c) => c.name || "New cut",
        thumb: (c) => c.image,
        fields: [
          { key: "name", label: "Name", required: true },
          { key: "id", label: "ID", hint: "Updates automatically from the name." },
          { key: "image", label: "Photo", type: "image", altKey: "alt", required: true },
          { key: "summary", label: "Summary", type: "textarea", rows: 2 },
          { key: "askFor", label: "What to ask for", type: "textarea", rows: 2, hint: "Exactly what a client should say to get this cut." },
          { key: "service", label: "Book as service", type: "select", options: "services" },
          { key: "maintenance", label: "Upkeep level", type: "select", options: "maintenance", numeric: true },
          { key: "upkeep", label: "Trim every", hint: "e.g. 2–3 weeks" },
          { key: "styling", label: "Daily styling time", hint: "e.g. 5 min" },
          { key: "product", label: "Product", hint: "e.g. Matte clay" },
          { key: "match.hair", label: "Suits hair types", type: "checks", options: "hair" },
          { key: "match.effort", label: "Suits styling time", type: "checks", options: "effort" },
          { key: "match.vibe", label: "Suits looks", type: "checks", options: "vibe" },
          { key: "match.visits", label: "Suits visit frequency", type: "checks", options: "visits" },
        ],
        newItem: () => ({ id: "new-cut-" + Date.now().toString(36), name: "", service: "", image: "", alt: "", summary: "", askFor: "",
          maintenance: 2, upkeep: "", styling: "", product: "", match: { hair: [], effort: [], vibe: [], visits: [] } }),
      },
    },
    {
      id: "portfolio", title: "Portfolio", anchor: "work",
      custom: "categories",
      collection: {
        path: "gallery", legend: "Photos", itemName: "photo",
        label: (g) => g.caption || "New photo",
        thumb: (g) => g.src,
        fields: [
          { key: "src", label: "Photo", type: "image", altKey: "alt", required: true },
          { key: "caption", label: "Caption", hint: "Short label shown on the photo." },
          { key: "category", label: "Category", type: "select", options: "categories" },
        ],
        newItem: () => ({ src: "", alt: "", caption: "", category: Object.keys(draft.galleryCategories || {})[0] || "" }),
      },
    },
    {
      id: "reviews", title: "Reviews", anchor: "reviews",
      collection: {
        path: "reviews", legend: "Reviews", itemName: "review",
        label: (r) => r.name || "New review",
        fields: [
          { key: "name", label: "Client name", required: true, hint: "First name and initial is plenty." },
          { key: "rating", label: "Rating", type: "select", options: "rating", numeric: true },
          { key: "text", label: "Review", type: "textarea", rows: 3, required: true },
        ],
        newItem: () => ({ name: "", rating: 5, text: "" }),
      },
    },
    {
      id: "sections", title: "Show / hide sections", anchor: "top",
      groups: [{ legend: "Sections on the page", fields: [
        { key: "sections.about", label: "About", type: "checkbox" },
        { key: "sections.finder", label: "Cut finder quiz", type: "checkbox" },
        { key: "sections.guards", label: "Clipper guard guide", type: "checkbox" },
        { key: "sections.portfolio", label: "Portfolio", type: "checkbox" },
        { key: "sections.reviews", label: "Reviews", type: "checkbox" },
      ] }],
    },
    { id: "account", title: "Account & backup", anchor: null, custom: "account" },
  ];

  /* =========================================================
     RENDERING
     ========================================================= */
  const fid = (path) => "fld-" + path.replace(/[^\w]/g, "-");
  const optionsFor = (f) => (typeof f.options === "string" ? (typeof OPT[f.options] === "function" ? OPT[f.options]() : OPT[f.options]) : f.options || []);

  function imageThumb(src) {
    if (!src) return `<div class="thumb thumb-empty" aria-hidden="true">No photo</div>`;
    const url = /images\.unsplash\.com/.test(src) ? src.split("?")[0] + "?auto=format&fit=crop&w=240&h=300&q=60" : src;
    return `<img class="thumb" src="${esc(url)}" alt="" width="120" height="150">`;
  }

  function fieldHTML(f, base) {
    const path = base ? `${base}.${f.key}` : f.key;
    const id = fid(path);
    const val = getPath(draft, path);
    const hintId = f.hint ? id + "-hint" : "";
    const errId = id + "-error";
    const describedBy = `aria-describedby="${[hintId, errId].filter(Boolean).join(" ")}"`;
    const req = f.required ? '<span class="req" aria-hidden="true"> *</span>' : "";
    const reqAttr = f.required ? " required" : "";
    const hint = f.hint ? `<p class="hint" id="${hintId}">${esc(f.hint)}</p>` : "";
    const err = `<p class="error" id="${errId}" hidden></p>`;

    if (f.type === "checkbox") {
      return `<div class="field"><label class="check"><input type="checkbox" id="${id}" data-path="${path}" ${val !== false ? "checked" : ""}> ${esc(f.label)}</label></div>`;
    }
    if (f.type === "checks") {
      const chosen = val || [];
      return `<fieldset class="field checks"><legend>${esc(f.label)}</legend><div class="check-row">` +
        optionsFor(f).map(([v, l]) => `<label class="check"><input type="checkbox" data-path="${path}" data-kind="checks" value="${esc(v)}" ${chosen.includes(v) ? "checked" : ""}> ${esc(l)}</label>`).join("") +
        `</div></fieldset>`;
    }
    if (f.type === "image") {
      // Image fields store either {src, alt} or a src string with a sibling alt key
      const isObj = !f.altKey;
      const srcPath = isObj ? `${path}.src` : path;
      const altPath = isObj ? `${path}.alt` : `${base}.${f.altKey}`;
      const src = getPath(draft, srcPath) || "";
      const alt = getPath(draft, altPath) || "";
      return `<div class="field image-field" data-image="${srcPath}">
        <p class="label">${esc(f.label)}${req}</p>
        <div class="image-row">
          <div class="thumb-wrap">${imageThumb(src)}</div>
          <div class="image-controls">
            <label class="btn btn-ghost btn-sm upload-btn">Upload photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" class="sr-only" data-upload="${srcPath}"></label>
            <div class="field"><label for="${fid(srcPath)}">…or image URL</label><input id="${fid(srcPath)}" type="url" data-path="${srcPath}" value="${esc(src)}" aria-describedby="${fid(srcPath)}-error"${reqAttr}><p class="error" id="${fid(srcPath)}-error" hidden></p></div>
          </div>
        </div>
        <div class="field"><label for="${fid(altPath)}">Image description (alt text)${req}</label>
          <p class="hint" id="${fid(altPath)}-hint">Describe what's in the photo for people using screen readers, e.g. “Mid skin fade with a textured crop on top”.</p>
          <textarea id="${fid(altPath)}" rows="2" data-path="${altPath}" aria-describedby="${fid(altPath)}-hint ${fid(altPath)}-error"${reqAttr}>${esc(alt)}</textarea>
          <p class="error" id="${fid(altPath)}-error" hidden></p></div>
      </div>`;
    }

    let control;
    if (f.type === "textarea") {
      control = `<textarea id="${id}" rows="${f.rows || 3}" data-path="${path}" ${describedBy}${reqAttr}>${esc(val)}</textarea>`;
    } else if (f.type === "lines") {
      control = `<textarea id="${id}" rows="${f.rows || 3}" data-path="${path}" data-kind="lines" ${describedBy}>${esc((val || []).join("\n"))}</textarea>`;
    } else if (f.type === "paras") {
      control = `<textarea id="${id}" rows="8" data-path="${path}" data-kind="paras" ${describedBy}>${esc((val || []).join("\n\n"))}</textarea>`;
    } else if (f.type === "select") {
      control = `<select id="${id}" data-path="${path}"${f.numeric ? ' data-kind="number"' : ""} ${describedBy}>` +
        optionsFor(f).map(([v, l]) => `<option value="${esc(v)}" ${String(val ?? "") === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("") + `</select>`;
    } else if (f.type === "number") {
      control = `<input id="${id}" type="number" inputmode="decimal" min="${f.min ?? ""}" step="any" data-path="${path}" data-kind="number" value="${esc(val)}" ${describedBy}${reqAttr}>`;
    } else {
      control = `<input id="${id}" type="${f.type || "text"}" data-path="${path}" value="${esc(val)}" ${describedBy}${reqAttr}>`;
    }
    return `<div class="field"><label for="${id}">${esc(f.label)}${req}</label>${hint}${control}${err}</div>`;
  }

  const groupHTML = (g, base) =>
    `<fieldset class="group"><legend>${esc(g.legend)}</legend>${g.fields.map((f) => fieldHTML(f, base)).join("")}</fieldset>`;

  function collectionHTML(c) {
    const arr = getPath(draft, c.path) || [];
    const items = arr.map((item, i) => {
      const key = `${c.path}.${i}`;
      const open = openItems.has(key);
      const label = c.label(item, i);
      return `<li class="item" data-key="${key}">
        <div class="item-head">
          <button type="button" class="item-toggle" aria-expanded="${open}" aria-controls="body-${fid(key)}" data-toggle="${key}">
            <span class="chev" aria-hidden="true"></span>
            ${c.thumb ? `<span class="item-thumb">${imageThumb(c.thumb(item))}</span>` : ""}
            <span class="item-title" data-title="${key}">${esc(label)}</span>
          </button>
          <div class="item-tools">
            <button type="button" class="icon-btn sm" data-move="${c.path}" data-index="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""}>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
              <span class="sr-only">Move ${esc(label)} up</span></button>
            <button type="button" class="icon-btn sm" data-move="${c.path}" data-index="${i}" data-dir="1" ${i === arr.length - 1 ? "disabled" : ""}>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
              <span class="sr-only">Move ${esc(label)} down</span></button>
            <button type="button" class="icon-btn sm danger" data-remove="${c.path}" data-index="${i}">
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M5 7h14M10 11v6M14 11v6M7 7l1 12h8l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span class="sr-only">Remove ${esc(label)}</span></button>
          </div>
        </div>
        <div class="item-body" id="body-${fid(key)}" ${open ? "" : "hidden"}>${c.fields.map((f) => fieldHTML(f, key)).join("")}</div>
      </li>`;
    }).join("");
    return `<section class="group collection" aria-labelledby="coll-${c.path}">
      <div class="collection-head"><h3 id="coll-${c.path}">${esc(c.legend)} <span class="count">(${arr.length})</span></h3>
        <button type="button" class="btn btn-primary btn-sm" data-add="${c.path}">+ Add ${esc(c.itemName)}</button></div>
      <ol class="items" role="list">${items}</ol>
      ${arr.length ? "" : `<p class="muted">Nothing here yet.</p>`}
    </section>`;
  }

  function lookHTML() {
    const t = draft.theme;
    return `
      <fieldset class="group"><legend>Default colour mode</legend>
        ${fieldHTML({ key: "theme.mode", label: "Mode", type: "select", options: "mode", hint: "Visitors can still switch with the sun/moon button in the header." })}
      </fieldset>
      <fieldset class="group"><legend>Accent colour</legend>
        <div class="swatches" role="radiogroup" aria-label="Preset colours">
          ${Core.ACCENTS.map((a) => `<label class="swatch"><input type="radio" name="accent" data-path="theme.accent" value="${a.value}" ${t.accent.toLowerCase() === a.value ? "checked" : ""}>
            <span class="swatch-dot" style="--sw:${a.value}" aria-hidden="true"></span><span class="sr-only">${esc(a.name)}</span></label>`).join("")}
        </div>
        <div class="field custom-colour"><label for="fld-accent-custom">Custom colour</label>
          <input type="color" id="fld-accent-custom" data-path="theme.accent" value="${esc(t.accent)}" aria-describedby="contrast-note"></div>
        <p class="hint" id="contrast-note"></p>
      </fieldset>
      <fieldset class="group"><legend>Typography & shape</legend>
        ${fieldHTML({ key: "theme.font", label: "Font style", type: "select", options: "font" })}
        ${fieldHTML({ key: "theme.corners", label: "Corners", type: "select", options: "corners" })}
      </fieldset>`;
  }

  function categoriesHTML() {
    const cats = draft.galleryCategories || {};
    const used = new Set((draft.gallery || []).map((g) => g.category));
    return `<fieldset class="group"><legend>Filter categories</legend>
      <ul class="cat-list" role="list">
        ${Object.entries(cats).map(([k, label]) => `<li class="cat-row">
          <div class="field"><label for="${fid("galleryCategories." + k)}">Label for “${esc(k)}”</label>
            <input id="${fid("galleryCategories." + k)}" data-path="galleryCategories.${k}" value="${esc(label)}"></div>
          <button type="button" class="btn btn-ghost btn-sm" data-remove-cat="${esc(k)}" ${used.has(k) ? `disabled aria-describedby="cat-used-${esc(k)}"` : ""}>Remove<span class="sr-only"> ${esc(label)}</span></button>
          ${used.has(k) ? `<p class="hint" id="cat-used-${esc(k)}">In use by photos</p>` : ""}
        </li>`).join("")}
      </ul>
      <div class="add-cat"><div class="field"><label for="new-cat">New category</label><input id="new-cat" placeholder="e.g. Kids cuts"></div>
        <button type="button" class="btn btn-ghost btn-sm" id="add-cat">Add category</button></div>
    </fieldset>`;
  }

  function accountHTML() {
    return `
      <fieldset class="group"><legend>Change password</legend>
        <div class="field"><label for="pw-current">Current password</label><input id="pw-current" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pw-new">New password</label><p class="hint" id="pw-new-hint">At least 10 characters.</p><input id="pw-new" type="password" autocomplete="new-password" aria-describedby="pw-new-hint"></div>
        <div class="field"><label for="pw-confirm">Confirm new password</label><input id="pw-confirm" type="password" autocomplete="new-password"></div>
        <button type="button" class="btn btn-primary btn-sm" id="pw-save">Change password</button>
        <p class="small" id="pw-status" role="status"></p>
      </fieldset>
      <fieldset class="group"><legend>Backup & restore</legend>
        <p class="muted">Every publish also keeps an automatic backup in <code>data/backups/</code> on the server (last 20).</p>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost btn-sm" id="download-config">Download config file</button>
          <label class="btn btn-ghost btn-sm upload-btn">Restore from file<input type="file" accept=".js,.json,application/json,text/javascript" class="sr-only" id="restore-config"></label>
          <button type="button" class="btn btn-ghost btn-sm" id="discard">Discard unsaved changes</button>
        </div>
        <p class="small" id="backup-status" role="status"></p>
      </fieldset>`;
  }

  function renderNav() {
    $("#admin-nav-list").innerHTML = PANELS.map((p) => `<li><button type="button" data-panel="${p.id}" ${p.id === current ? 'aria-current="true"' : ""}>${esc(p.title)}<span class="nav-err" data-err-for="${p.id}" hidden> <span aria-hidden="true">●</span><span class="sr-only">(has problems)</span></span></button></li>`).join("");
  }

  function renderPanel(focusHeading) {
    const p = PANELS.find((x) => x.id === current);
    let html = `<h2 class="panel-title" tabindex="-1">${esc(p.title)}</h2>${p.intro ? `<p class="muted panel-intro">${esc(p.intro)}</p>` : ""}`;
    if (p.id === "look") html += lookHTML();
    if (p.groups) html += p.groups.map((g) => groupHTML(g)).join("");
    if (p.custom === "categories") html += categoriesHTML();
    if (p.collection) html += collectionHTML(p.collection);
    if (p.custom === "account") html += accountHTML();
    $("#editor").innerHTML = html;
    $$("#admin-nav-list [data-panel]").forEach((b) => {
      if (b.dataset.panel === current) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    if (p.id === "look") updateContrastNote();
    if (focusHeading) $(".panel-title").focus();
    if (p.anchor) scrollPreviewTo(p.anchor);
    markErrors(lastErrors, false);
  }

  /* =========================================================
     EDITING
     ========================================================= */
  const editor = $("#editor");

  function readValue(el) {
    const kind = el.dataset.kind;
    if (kind === "number") return el.value === "" ? "" : Number(el.value);
    if (kind === "lines") return el.value.split("\n").map((s) => s.trim()).filter(Boolean);
    if (kind === "paras") return el.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    if (kind === "checks") return $$(`input[data-path="${el.dataset.path}"]:checked`, editor).map((i) => i.value);
    if (el.type === "checkbox") return el.checked;
    return el.value;
  }

  function onEdit(el) {
    const path = el.dataset.path;
    const value = readValue(el);
    const parts = path.split(".");

    // Keep IDs in sync with names for services and cuts (and fix references to renamed services)
    if ((parts[0] === "services" || parts[0] === "cuts") && parts[2] === "name") {
      const item = draft[parts[0]][parts[1]];
      if (!item.id || item.id === slug(item.name) || /^new-(service|cut)-/.test(item.id)) {
        const oldId = item.id;
        const newId = slug(value) || oldId;
        item.id = newId;
        const idInput = $(`[data-path="${parts[0]}.${parts[1]}.id"]`, editor);
        if (idInput) idInput.value = newId;
        if (parts[0] === "services") draft.cuts.forEach((c) => { if (c.service === oldId) c.service = newId; });
      }
    }
    if (parts[0] === "services" && parts[2] === "id") {
      const oldId = draft.services[parts[1]].id;
      draft.cuts.forEach((c) => { if (c.service === oldId) c.service = value; });
    }

    setPath(draft, path, value);

    if (path === "theme.accent") {
      $$('[data-path="theme.accent"]', editor).forEach((i) => {
        if (i.type === "radio") i.checked = i.value.toLowerCase() === String(value).toLowerCase();
        else if (i !== el) i.value = value;
      });
      updateContrastNote();
    }

    // Live-update item headings and thumbnails in collections
    const coll = PANELS.find((p) => p.collection && p.collection.path === parts[0])?.collection;
    if (coll && parts.length > 2) {
      const key = `${parts[0]}.${parts[1]}`;
      const title = $(`[data-title="${key}"]`, editor);
      if (title) title.textContent = coll.label(getPath(draft, key));
    }
    if (el.closest("[data-image]")) {
      const wrap = el.closest("[data-image]");
      $(".thumb-wrap", wrap).innerHTML = imageThumb(getPath(draft, wrap.dataset.image));
    }

    if (el.getAttribute("aria-invalid") === "true") validate(false);
    changed();
  }

  editor.addEventListener("input", (e) => {
    const el = e.target.closest("[data-path]");
    if (el && !(el.type === "radio" && !el.checked)) onEdit(el);
  });
  editor.addEventListener("change", (e) => {
    if (e.target.matches('select[data-path], input[type="checkbox"][data-path]')) onEdit(e.target);
  });
  editor.addEventListener("submit", (e) => e.preventDefault());

  editor.addEventListener("click", async (e) => {
    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const key = toggle.dataset.toggle;
      const body = document.getElementById(toggle.getAttribute("aria-controls"));
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      body.hidden = !open;
      if (open) openItems.add(key); else openItems.delete(key);
      return;
    }

    const add = e.target.closest("[data-add]");
    if (add) {
      const path = add.dataset.add;
      const coll = PANELS.find((p) => p.collection && p.collection.path === path).collection;
      const arr = getPath(draft, path);
      arr.push(coll.newItem());
      const key = `${path}.${arr.length - 1}`;
      openItems.add(key);
      changed();
      renderPanel(false);
      const first = $(`#body-${fid(key)} input, #body-${fid(key)} textarea`, editor);
      if (first) first.focus();
      announce(`New ${coll.itemName} added.`);
      return;
    }

    const move = e.target.closest("[data-move]");
    if (move && !move.disabled) {
      const path = move.dataset.move;
      const i = Number(move.dataset.index);
      const j = i + Number(move.dataset.dir);
      const arr = getPath(draft, path);
      [arr[i], arr[j]] = [arr[j], arr[i]];
      const wasOpen = [openItems.has(`${path}.${i}`), openItems.has(`${path}.${j}`)];
      openItems.delete(`${path}.${i}`); openItems.delete(`${path}.${j}`);
      if (wasOpen[0]) openItems.add(`${path}.${j}`);
      if (wasOpen[1]) openItems.add(`${path}.${i}`);
      changed();
      renderPanel(false);
      const btn = $(`[data-move="${path}"][data-index="${j}"][data-dir="${move.dataset.dir}"]`, editor);
      (btn && !btn.disabled ? btn : $(`[data-move="${path}"][data-index="${j}"]:not([disabled])`, editor))?.focus();
      announce(`Moved to position ${j + 1}.`);
      return;
    }

    const remove = e.target.closest("[data-remove]");
    if (remove) {
      const path = remove.dataset.remove;
      const i = Number(remove.dataset.index);
      const coll = PANELS.find((p) => p.collection && p.collection.path === path).collection;
      const label = coll.label(getPath(draft, `${path}.${i}`));
      if (!(await confirmDialog(`Remove “${label}”?`, "You can undo this by choosing “Discard unsaved changes” before you publish."))) return;
      getPath(draft, path).splice(i, 1);
      // Re-key open items after the removed one
      const reopened = [...openItems].filter((k) => k.startsWith(path + ".")).map((k) => Number(k.split(".")[1]));
      reopened.forEach((n) => openItems.delete(`${path}.${n}`));
      reopened.filter((n) => n !== i).forEach((n) => openItems.add(`${path}.${n > i ? n - 1 : n}`));
      changed();
      renderPanel(false);
      ($(`[data-remove="${path}"][data-index="${Math.min(i, getPath(draft, path).length - 1)}"]`, editor) || $(`[data-add="${path}"]`, editor)).focus();
      announce(`${label} removed.`);
      return;
    }

    const removeCat = e.target.closest("[data-remove-cat]");
    if (removeCat) {
      delete draft.galleryCategories[removeCat.dataset.removeCat];
      changed();
      renderPanel(false);
      $("#new-cat").focus();
      announce("Category removed.");
      return;
    }

    if (e.target.id === "add-cat") {
      const input = $("#new-cat");
      const label = input.value.trim();
      const key = slug(label);
      if (!key) { input.focus(); return; }
      draft.galleryCategories = draft.galleryCategories || {};
      if (!draft.galleryCategories[key]) draft.galleryCategories[key] = label;
      changed();
      renderPanel(false);
      $("#new-cat").focus();
      announce(`Category ${label} added.`);
      return;
    }

    if (e.target.id === "pw-save") return changePassword();
    if (e.target.id === "download-config") return downloadConfig();
    if (e.target.id === "discard") return discardChanges();
  });

  /* Image uploads */
  editor.addEventListener("change", async (e) => {
    const input = e.target.closest("[data-upload]");
    if (input && input.files[0]) {
      const file = input.files[0];
      const wrap = input.closest("[data-image]");
      const label = input.closest(".upload-btn");
      label.classList.add("is-busy");
      announce("Uploading photo…");
      try {
        const { path } = await api("POST", "/api/upload", file, file.type);
        const urlInput = $(`[data-path="${input.dataset.upload}"]`, wrap);
        urlInput.value = path;
        onEdit(urlInput);
        announce("Photo uploaded. Remember to describe it in the alt text field.");
        $("textarea", wrap)?.focus();
      } catch (err) {
        announce("Upload failed: " + err.message);
        showToast("Upload failed: " + err.message, true);
      } finally {
        label.classList.remove("is-busy");
        input.value = "";
      }
    }
    if (e.target.id === "restore-config" && e.target.files[0]) restoreConfig(e.target.files[0]);
  });

  function updateContrastNote() {
    const note = $("#contrast-note");
    if (!note) return;
    const t = Core.accentTokens(draft.theme.accent);
    const r = (a, b) => Core.contrast(a, b).toFixed(1);
    const adjusted = t.onDark !== t.accent || t.onLight !== t.accent;
    note.textContent = `Text contrast: ${r(t.onDark, Core.DARK_SURFACE)}:1 on dark, ${r(t.onLight, Core.LIGHT_SURFACE)}:1 on light, ${r(t.onAccent, t.accent)}:1 on buttons. ` +
      (adjusted ? "The site lightens or darkens this colour for text where needed so it always meets WCAG AA (4.5:1)." : "Meets WCAG AA everywhere.");
  }

  /* =========================================================
     DIRTY STATE, PREVIEW, PUBLISH
     ========================================================= */
  const saveState = $("#save-state");
  const isDirty = () => JSON.stringify(draft) !== published;
  let previewTimer = null;

  function changed() {
    try { localStorage.setItem(Core.DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* storage full */ }
    const dirty = isDirty();
    saveState.textContent = dirty ? "Unsaved changes" : "All changes published";
    saveState.classList.toggle("is-dirty", dirty);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(reloadPreview, 450);
  }

  const frame = $("#preview");
  function reloadPreview() {
    if (frame.src.endsWith("about:blank")) frame.src = "index.html?preview=1";
    else frame.contentWindow.location.reload();
  }
  function scrollPreviewTo(anchor) {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      if (anchor === "top") frame.contentWindow.scrollTo({ top: 0, behavior: "auto" });
      else doc.getElementById(anchor)?.scrollIntoView({ block: "start" });
    } catch (e) { /* preview not ready */ }
  }

  $$(".preview-devices [data-device]").forEach((b) => b.addEventListener("click", () => {
    $$(".preview-devices [data-device]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#preview-wrap").classList.toggle("is-mobile", b.dataset.device === "mobile");
  }));
  $("#preview-toggle").addEventListener("click", (e) => {
    const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
    e.currentTarget.setAttribute("aria-pressed", String(on));
    e.currentTarget.textContent = on ? "Hide preview" : "Show preview";
    document.body.classList.toggle("preview-open", on);
  });

  /* ---------- Validation ---------- */
  let lastErrors = [];
  function validate() {
    const errs = [];
    const need = (panel, path, msg) => { if (!String(getPath(draft, path) ?? "").trim()) errs.push({ panel, path, msg }); };
    need("profile", "barber.firstName", "Enter your first name.");
    need("hero", "hero.image.src", "Add a photo of yourself.");
    need("hero", "hero.image.alt", "Describe your hero photo (alt text).");
    need("about", "about.heading", "Enter an About heading.");
    need("about", "about.image.src", "Add an About photo.");
    need("about", "about.image.alt", "Describe the About photo (alt text).");
    need("shop", "shop.name", "Enter the shop name.");

    const ids = new Set();
    draft.services.forEach((s, i) => {
      need("services", `services.${i}.name`, `Service ${i + 1}: enter a name.`);
      if (!s.id) errs.push({ panel: "services", path: `services.${i}.id`, msg: `Service ${i + 1}: enter an ID.` });
      else if (ids.has(s.id)) errs.push({ panel: "services", path: `services.${i}.id`, msg: `Service “${s.name}”: ID “${s.id}” is used twice.` });
      ids.add(s.id);
      if (typeof s.price !== "number" || s.price < 0) errs.push({ panel: "services", path: `services.${i}.price`, msg: `Service “${s.name || i + 1}”: enter a price.` });
    });
    const cutIds = new Set();
    draft.cuts.forEach((c, i) => {
      const n = c.name || `Cut ${i + 1}`;
      need("cuts", `cuts.${i}.name`, `Cut ${i + 1}: enter a name.`);
      need("cuts", `cuts.${i}.image`, `${n}: add a photo.`);
      need("cuts", `cuts.${i}.alt`, `${n}: describe the photo (alt text).`);
      if (cutIds.has(c.id)) errs.push({ panel: "cuts", path: `cuts.${i}.id`, msg: `${n}: ID “${c.id}” is used twice.` });
      cutIds.add(c.id);
      if (c.service && !ids.has(c.service)) errs.push({ panel: "cuts", path: `cuts.${i}.service`, msg: `${n}: its service no longer exists. Pick another.` });
    });
    if (!draft.cuts.length) errs.push({ panel: "cuts", path: "cuts", msg: "Add at least one cut — the cut explorer needs one." });
    draft.gallery.forEach((g, i) => {
      need("portfolio", `gallery.${i}.src`, `Photo ${i + 1}: add an image.`);
      need("portfolio", `gallery.${i}.alt`, `Photo ${i + 1}: describe the image (alt text).`);
    });
    draft.reviews.forEach((r, i) => {
      need("reviews", `reviews.${i}.name`, `Review ${i + 1}: enter the client's name.`);
      need("reviews", `reviews.${i}.text`, `Review ${i + 1}: enter the review text.`);
    });
    lastErrors = errs;
    markErrors(errs, false);
    return errs;
  }

  function markErrors(errs) {
    $$("[aria-invalid]", editor).forEach((el) => el.removeAttribute("aria-invalid"));
    $$(".error", editor).forEach((p) => { p.hidden = true; p.textContent = ""; });
    errs.forEach((er) => {
      const el = $(`[data-path="${er.path}"]`, editor);
      if (!el) return;
      el.setAttribute("aria-invalid", "true");
      const msg = document.getElementById(el.id + "-error");
      if (msg) { msg.textContent = er.msg; msg.hidden = false; }
    });
    $$("[data-err-for]").forEach((dot) => { dot.hidden = !errs.some((er) => er.panel === dot.dataset.errFor); });
  }

  function showErrorSummary(errs) {
    const box = $("#error-summary");
    if (!errs.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.innerHTML = `<h2>Fix ${errs.length} ${errs.length === 1 ? "problem" : "problems"} before publishing</h2>
      <ul>${errs.map((er, i) => `<li><button type="button" class="link-btn" data-goto="${i}">${esc(er.msg)}</button></li>`).join("")}</ul>`;
    box.hidden = false;
    box.focus();
  }
  $("#error-summary").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goto]");
    if (!b) return;
    const er = lastErrors[Number(b.dataset.goto)];
    current = er.panel;
    const m = /^(\w+)\.(\d+)\./.exec(er.path);
    if (m) openItems.add(`${m[1]}.${m[2]}`);
    renderPanel(false);
    const el = $(`[data-path="${er.path}"]`, editor) || $(".panel-title");
    el.focus();
  });

  async function publish() {
    const errs = validate();
    showErrorSummary(errs);
    if (errs.length) return;
    const btn = $("#publish");
    btn.disabled = true;
    saveState.textContent = "Publishing…";
    try {
      await api("PUT", "/api/config", draft);
      published = JSON.stringify(draft);
      changed();
      const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      saveState.textContent = `Published at ${time}`;
      showToast("Published — your site is updated for every visitor.");
    } catch (err) {
      if (err.status === 401) return showAuth(false, "Your session expired. Log in again — your unsaved changes are kept.");
      saveState.textContent = "Publish failed";
      showToast("Couldn't publish: " + err.message, true);
    } finally {
      btn.disabled = false;
    }
  }
  $("#publish").addEventListener("click", publish);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("#app").hidden) { e.preventDefault(); publish(); }
  });
  window.addEventListener("beforeunload", (e) => { if (draft && isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Toast + confirm ---------- */
  function showToast(msg, isError) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", isError ? "alert" : "status"); document.body.appendChild(t); }
    t.setAttribute("role", isError ? "alert" : "status");
    t.textContent = msg;
    t.classList.toggle("is-error", !!isError);
    t.classList.add("is-shown");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("is-shown"), 5000);
  }
  function confirmDialog(title, text) {
    const d = $("#confirm");
    $("#confirm-title").textContent = title;
    $("#confirm-text").textContent = text;
    d.returnValue = "";
    d.showModal();
    $("#confirm-ok").focus();
    return new Promise((resolve) => d.addEventListener("close", () => resolve(d.returnValue === "ok"), { once: true }));
  }

  /* ---------- Account & backup ---------- */
  async function changePassword() {
    const status = $("#pw-status");
    const next = $("#pw-new").value;
    if (next.length < 10) { status.textContent = "New password needs at least 10 characters."; $("#pw-new").focus(); return; }
    if (next !== $("#pw-confirm").value) { status.textContent = "The new passwords don't match."; $("#pw-confirm").focus(); return; }
    try {
      await api("POST", "/api/password", { current: $("#pw-current").value, next });
      status.textContent = "Password changed.";
      $$("#pw-current, #pw-new, #pw-confirm").forEach((i) => { i.value = ""; });
    } catch (err) {
      status.textContent = err.message;
    }
  }
  function downloadConfig() {
    const text = "window.SITE_CONFIG = " + JSON.stringify(draft, null, 2) + ";\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    a.download = "config.js";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $("#backup-status").textContent = "Downloaded config.js.";
  }
  async function restoreConfig(file) {
    const status = $("#backup-status");
    try {
      const text = await file.text();
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const cfg = JSON.parse(json);
      if (!cfg.barber || !cfg.services || !cfg.cuts) throw new Error("This doesn't look like a site config file.");
      draft = normalise(cfg);
      changed();
      renderPanel(false);
      status.textContent = "Restored. Review it in the preview, then publish to make it live.";
    } catch (err) {
      status.textContent = "Couldn't restore: " + err.message;
    }
  }
  async function discardChanges() {
    if (!isDirty()) { $("#backup-status").textContent = "There are no unsaved changes."; return; }
    if (!(await confirmDialog("Discard unsaved changes?", "This brings back the version that's currently live."))) return;
    draft = JSON.parse(published);
    changed();
    renderPanel(false);
    $("#backup-status").textContent = "Unsaved changes discarded.";
  }

  /* =========================================================
     AUTH + BOOT
     ========================================================= */
  function normalise(cfg) {
    // Fill in anything an older config might be missing, so every field has a home
    const d = clone(cfg);
    d.theme = Object.assign({ mode: "auto", accent: "#b4372b", font: "editorial", corners: "rounded" }, d.theme);
    d.sections = Object.assign({ about: true, finder: true, guards: true, portfolio: true, reviews: true }, d.sections);
    d.barber.social = d.barber.social || {};
    d.text = d.text || {};
    ["cuts", "finder", "guards", "services", "work", "find", "reviews", "book"].forEach((k) => { d.text[k] = d.text[k] || {}; });
    ["services", "cuts", "gallery", "reviews", "hours"].forEach((k) => { d[k] = d[k] || []; });
    d.galleryCategories = d.galleryCategories || {};
    d.cuts.forEach((c) => { c.match = Object.assign({ hair: [], effort: [], vibe: [], visits: [] }, c.match); });
    return d;
  }

  let authMode = "login";
  function showAuth(setup, message) {
    authMode = setup ? "setup" : "login";
    $("#app").hidden = true;
    $("#auth").hidden = false;
    $("#auth-title").textContent = setup ? "Create your admin password" : "Log in";
    $("#auth-intro").textContent = message || (setup
      ? "First time here. Choose a password — you'll use it to edit your site. Keep it somewhere safe."
      : "Enter your admin password to edit the site.");
    $("#auth-password").autocomplete = setup ? "new-password" : "current-password";
    $("#auth-hint").hidden = !setup;
    $("#auth-confirm-field").hidden = !setup;
    $("#auth-submit").textContent = setup ? "Create password" : "Log in";
    $("#auth-error").hidden = true;
    $("#auth-password").value = "";
    $("#auth-confirm").value = "";
    $("#auth-password").focus();
  }

  $("#auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#auth-error");
    const pw = $("#auth-password").value;
    const fail = (msg, field) => { err.textContent = msg; err.hidden = false; $("#auth-password").setAttribute("aria-invalid", "true"); (field || $("#auth-password")).focus(); };
    $("#auth-password").removeAttribute("aria-invalid");
    if (authMode === "setup") {
      if (pw.length < 10) return fail("Use at least 10 characters.");
      if (pw !== $("#auth-confirm").value) return fail("The passwords don't match.", $("#auth-confirm"));
    } else if (!pw) {
      return fail("Enter your password.");
    }
    try {
      await api("POST", authMode === "setup" ? "/api/setup" : "/api/login", { password: pw });
      await openApp();
    } catch (ex) {
      fail(ex.message);
    }
  });

  $("#logout").addEventListener("click", async () => {
    if (isDirty() && !(await confirmDialog("Log out with unsaved changes?", "Your changes are kept in this browser's draft, but they aren't live until you publish."))) return;
    await api("POST", "/api/logout").catch(() => {});
    draft = null;
    showAuth(false, "You've logged out.");
  });

  $("#admin-nav-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-panel]");
    if (!b) return;
    current = b.dataset.panel;
    history.replaceState(null, "", "#" + current);
    renderPanel(true);
  });

  async function openApp() {
    const cfg = normalise(await api("GET", "/api/config"));
    published = JSON.stringify(cfg);
    // Pick up an unsaved draft from an earlier session if there is one
    let restored = false;
    try {
      const saved = JSON.parse(localStorage.getItem(Core.DRAFT_KEY));
      if (saved && saved.barber && JSON.stringify(normalise(saved)) !== published) { draft = normalise(saved); restored = true; }
    } catch (e) { /* ignore */ }
    if (!draft || !restored) draft = cfg;

    const hash = location.hash.slice(1);
    if (PANELS.some((p) => p.id === hash)) current = hash;
    $("#auth").hidden = true;
    $("#app").hidden = false;
    renderNav();
    changed();
    renderPanel(false);
    $(".admin-title").focus?.();
    if (restored) showToast("Restored your unsaved changes from last time.");
  }

  (async function boot() {
    try {
      const status = await api("GET", "/api/status");
      if (status.authed) await openApp();
      else showAuth(status.setup);
    } catch (e) {
      $("#no-server").hidden = false;
    }
  })();
})();
