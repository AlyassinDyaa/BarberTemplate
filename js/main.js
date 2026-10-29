/* Barber portfolio template — renders content from SITE_CONFIG
   and wires up the interactive parts. */
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG;
  const Core = window.BarberCore;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), cfg);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

  /* Screen-reader announcements for actions that don't move focus */
  const announcer = document.createElement("p");
  announcer.className = "sr-only";
  announcer.setAttribute("role", "status");
  document.body.appendChild(announcer);
  function announce(msg) {
    announcer.textContent = "";
    setTimeout(() => { announcer.textContent = msg; }, 50);
  }

  /* Unsplash URLs get responsive sizes; local paths are used as-is */
  function photo(src, w, h) {
    if (!/images\.unsplash\.com/.test(src)) return { src, srcset: "" };
    const base = src.split("?")[0];
    const url = (W) => `${base}?auto=format&fit=crop&w=${W}&h=${Math.round((W * h) / w)}&q=70`;
    return { src: url(w), srcset: [320, 480, 640, 800, 1200].map((W) => `${url(W)} ${W}w`).join(", ") };
  }
  function imgTag(src, alt, w, h, sizes, extra = "") {
    const p = photo(src, w, h);
    return `<img src="${esc(p.src)}"${p.srcset ? ` srcset="${esc(p.srcset)}" sizes="${esc(sizes)}"` : ""} alt="${esc(alt)}" width="${w}" height="${h}" ${extra}>`;
  }
  function setImg(img, src, alt, w, h, sizes) {
    const p = photo(src, w, h);
    img.src = p.src;
    if (p.srcset) { img.srcset = p.srcset; img.sizes = sizes; }
    img.alt = alt;
  }

  /* ---------- Text bindings ---------- */
  function applyBindings() {
    $$("[data-bind]").forEach((el) => {
      const v = get(el.dataset.bind);
      if (v != null) el.textContent = v;
    });
    $$("[data-href]").forEach((el) => {
      let empty = false;
      el.href = el.dataset.href.replace(/\{([\w.]+)\}/g, (_, p) => {
        const v = get(p);
        if (!v) empty = true;
        return v || "";
      });
      // A blank link in the config hides it (e.g. no TikTok, no online booking page)
      const wrapper = el.closest("li, p");
      if (wrapper && !wrapper.querySelector("[data-bind]")) wrapper.hidden = empty;
    });
    const name = `${cfg.barber.firstName} ${cfg.barber.lastName}`.trim();
    document.title = document.body.dataset.page === "a11y"
      ? `Accessibility statement — ${name}, Barber`
      : `${name} — Barber in ${cfg.barber.city.split(",")[0]} | Fades, Cuts & Beard Work`;
  }

  function applySections() {
    $$("[data-section]").forEach((s) => {
      s.hidden = cfg.sections[s.dataset.section] === false;
      // Hide menu and footer links that point at a hidden section
      $$(`a[href="#${s.id}"]`).forEach((a) => {
        const li = a.closest("li");
        if (li && !a.closest(".hero-actions")) li.hidden = s.hidden;
      });
    });
    const finderBtn = $('.hero-actions a[href="#finder"], .hero-actions a[href="#cuts"]');
    if (finderBtn) {
      const on = cfg.sections.finder !== false;
      finderBtn.href = on ? "#finder" : "#cuts";
      finderBtn.textContent = on ? "Find my cut" : "Explore the cuts";
    }
  }

  /* ---------- Render content ---------- */
  const R = (name) => $(`[data-render="${name}"]`);
  const money = (n) => "$" + n;

  function renderStatic() {
    const h1 = R("headline");
    if (h1) {
      h1.innerHTML = cfg.hero.headline
        .map((line, i) => `<span class="line${i === 1 ? " accent" : ""}">${esc(line)}</span>`)
        .join(" ");
    }
    if (R("hero-image")) setImg(R("hero-image"), cfg.hero.image.src, cfg.hero.image.alt, 800, 1000, "(min-width: 860px) 40vw, 92vw");
    if (R("about-image")) setImg(R("about-image"), cfg.about.image.src, cfg.about.image.alt, 800, 1000, "(min-width: 900px) 40vw, 92vw");
    if (R("about-text")) R("about-text").innerHTML = cfg.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
    if (R("about-highlights")) R("about-highlights").innerHTML = cfg.about.highlights.map((h) => `<li>${esc(h)}</li>`).join("");

    // Services as a classic barbershop menu board: name ...... price
    if (R("services")) {
      R("services").innerHTML = cfg.services.map((s) => `
        <li class="menu-item">
          <div class="menu-line">
            <h3>${esc(s.name)}${s.note ? ` <small>(${esc(s.note)})</small>` : ""}</h3>
            <span class="leader" aria-hidden="true"></span>
            <span class="price">${money(s.price)}</span>
          </div>
          <p class="menu-desc">${s.featured ? `<span class="tag">${esc(s.featured)}</span> ` : ""}${esc(s.desc)}${s.duration ? ` <span class="duration">· ${s.duration} min</span>` : ""}</p>
        </li>`).join("");
    }

    const select = $("#f-service");
    if (select) {
      cfg.services.forEach((s) => select.add(new Option(`${s.name} — ${money(s.price)}`, s.id)));
    }

    if (R("shop-address")) R("shop-address").innerHTML = cfg.shop.address.map(esc).join("<br>");
    if (R("hours")) R("hours").innerHTML = cfg.hours.map(([d, h]) => `<tr><th scope="row">${esc(d)}</th><td>${esc(h)}</td></tr>`).join("");

    if (R("reviews")) {
      R("reviews").innerHTML = cfg.reviews.map((r) => `
        <li><figure class="review">
          <p class="stars"><span aria-hidden="true">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span><span class="sr-only">${r.rating} out of 5 stars</span></p>
          <blockquote><p>${esc(r.text)}</p></blockquote>
          <figcaption>— ${esc(r.name)}</figcaption>
        </figure></li>`).join("");
    }
  }

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Open / closed sign, worked out from the opening hours ---------- */
  const sign = $("#open-sign");
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const RANGE = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–—-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
  const toMin = (h, m, ap) => ((Number(h) % 12) + (ap.toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(m || 0);
  const timeLabel = (h, m, ap) => `${Number(h)}${m && m !== "00" ? ":" + m : ""} ${ap.toLowerCase()}`;

  function hoursFor(dayIndex) {
    const key = DAYS[dayIndex].slice(0, 3).toLowerCase();
    const row = (cfg.hours || []).find(([d]) => String(d).trim().toLowerCase().startsWith(key));
    if (!row) return null;
    const m = RANGE.exec(row[1] || "");
    if (!m) return { text: row[1] };
    return { open: toMin(m[1], m[2], m[3]), close: toMin(m[4], m[5], m[6]), openLabel: timeLabel(m[1], m[2], m[3]), closeLabel: timeLabel(m[4], m[5], m[6]) };
  }

  // "Now" in the shop's time zone (shop.timezone), so visitors elsewhere see the right status
  function shopNow() {
    const now = new Date();
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: cfg.shop.timezone || undefined, weekday: "long", hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(now).reduce((o, p) => ((o[p.type] = p.value), o), {});
      return { day: DAYS.indexOf(parts.weekday), mins: Number(parts.hour) * 60 + Number(parts.minute) };
    } catch (e) {
      return { day: now.getDay(), mins: now.getHours() * 60 + now.getMinutes() };
    }
  }

  function updateSign() {
    if (!sign) return;
    const { day, mins } = shopNow();
    const today = hoursFor(day);
    if (!today) { sign.textContent = ""; return; }
    let open = false;
    let text;
    if (today.open != null && mins >= today.open && mins < today.close) {
      open = true;
      text = `Open now · till ${today.closeLabel}`;
    } else if (today.open != null && mins < today.open) {
      text = `Closed · opens ${today.openLabel}`;
    } else if (today.text && !/closed/i.test(today.text)) {
      text = today.text; // e.g. "By appointment"
    } else {
      text = "Closed";
      for (let i = 1; i <= 7; i++) {
        const next = hoursFor((day + i) % 7);
        if (next && next.open != null) {
          text = `Closed · opens ${i === 1 ? "tomorrow" : DAYS[(day + i) % 7].slice(0, 3)} ${next.openLabel}`;
          break;
        }
      }
    }
    sign.textContent = text;
    sign.classList.toggle("is-closed", !open);
  }
  updateSign();
  setInterval(updateSign, 60000);

  /* ---------- Mobile navigation ---------- */
  const toggle = $(".nav-toggle");
  const menu = $("#nav-menu");
  const desktop = window.matchMedia("(min-width: 960px)");

  function setMenu(open, focusToggle) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    if (!open && focusToggle) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a") && !desktop.matches) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false, true);
    });
    document.addEventListener("click", (e) => { if (!desktop.matches && !e.target.closest(".site-header")) setMenu(false); });
    desktop.addEventListener("change", () => setMenu(false));
  }

  /* ---------- Theme toggle (visitor preference) ---------- */
  const themeBtn = $(".theme-toggle");
  function syncThemeButton() {
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-pressed", String(document.documentElement.dataset.theme === "light"));
  }
  // Keep the toggle in sync when following the system setting and it changes
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => setTimeout(syncThemeButton, 0));
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      // Picking the same mode as the site default (usually the system setting) clears the saved choice
      const isDefault = next === Core.resolveMode(Core.ownerMode);
      cfg.theme.mode = isDefault ? Core.ownerMode : next;
      Core.applyTheme(cfg.theme);
      Core.saveVisitorMode(isDefault ? null : next);
      syncThemeButton();
    });
  }

  /* ---------- Current section in nav ---------- */
  const navLinks = $$('.nav-menu a[href^="#"]:not(.btn)');
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute("href") === "#" + entry.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach((a) => { const s = document.getElementById(a.getAttribute("href").slice(1)); if (s) observer.observe(s); });
    const hero = $(".hero");
    if (hero) observer.observe(hero); // clears the highlight when back at the top
  }

  /* =========================================================
     CUT EXPLORER (ARIA tabs with roving tabindex)
     ========================================================= */
  const tabsEl = R("cut-tabs");
  const panelEl = R("cut-panel");
  const levels = ["", "Low", "Medium", "High"];

  function serviceFor(cut) { return cfg.services.find((s) => s.id === cut.service); }

  function renderCutPanel(cut) {
    const s = serviceFor(cut);
    panelEl.setAttribute("aria-labelledby", "cut-tab-" + cut.id);
    panelEl.innerHTML = `
      <div class="cut-media">${imgTag(cut.image, cut.alt, 800, 1000, "(min-width: 1100px) 32vw, (min-width: 720px) 45vw, 92vw")}</div>
      <div class="cut-info">
        <h3 class="cut-name">${esc(cut.name)}</h3>
        <p class="cut-summary">${esc(cut.summary)}</p>
        <dl class="cut-stats">
          <div><dt>Upkeep</dt><dd><span class="meter" data-level="${cut.maintenance}" aria-hidden="true"><i></i><i></i><i></i></span>${levels[cut.maintenance]} <span class="muted">· trim ${esc(cut.upkeep)}</span></dd></div>
          <div><dt>Daily styling</dt><dd>${esc(cut.styling)}</dd></div>
          <div><dt>Product</dt><dd>${esc(cut.product)}</dd></div>
          ${s ? `<div><dt>Book as</dt><dd>${esc(s.name)} · ${money(s.price)} · ${s.duration} min</dd></div>` : ""}
        </dl>
        <div class="ask-for">
          <p class="ask-label">What to ask for</p>
          <p class="ask-text">“${esc(cut.askFor)}”</p>
          <button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(cut.askFor)}">Copy text</button>
        </div>
        <button type="button" class="btn btn-primary" data-book-cut="${esc(cut.id)}">Book this cut</button>
      </div>`;
    if (!reducedMotion.matches) {
      panelEl.classList.remove("is-swapping");
      void panelEl.offsetWidth; // restart animation
      panelEl.classList.add("is-swapping");
    }
  }

  function selectCut(id, focus) {
    const tabs = $$('[role="tab"]', tabsEl);
    tabs.forEach((t) => {
      const on = t.dataset.cut === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
      if (on) t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: scrollBehavior() });
    });
    renderCutPanel(cfg.cuts.find((c) => c.id === id));
  }

  if (tabsEl && panelEl) {
    tabsEl.innerHTML = cfg.cuts.map((c, i) => `
      <button type="button" role="tab" class="cut-tab" id="cut-tab-${esc(c.id)}" data-cut="${esc(c.id)}"
        aria-selected="${i === 0}" aria-controls="cut-panel" tabindex="${i === 0 ? 0 : -1}">
        ${imgTag(c.image, "", 96, 96, "48px", 'loading="lazy"')}
        <span>${esc(c.name)}</span>
      </button>`).join("");

    const vertical = window.matchMedia("(min-width: 960px)");
    const setOrientation = () => tabsEl.setAttribute("aria-orientation", vertical.matches ? "vertical" : "horizontal");
    setOrientation();
    vertical.addEventListener("change", setOrientation);

    tabsEl.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) selectCut(tab.dataset.cut, false);
    });
    tabsEl.addEventListener("keydown", (e) => {
      const tabs = $$('[role="tab"]', tabsEl);
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); selectCut(tabs[n].dataset.cut, true); }
    });
    selectCut(cfg.cuts[0].id, false);
  }

  /* Copy "what to ask for" + "Book this cut" (delegated: also used by finder results) */
  document.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        copyBtn.textContent = "Copied!";
        announce("Copied to clipboard. Show it to your barber or paste it into your booking.");
        setTimeout(() => { copyBtn.textContent = "Copy text"; }, 2000);
      } catch (err) {
        announce("Couldn't copy automatically — select the text to copy it.");
      }
    }
    const bookBtn = e.target.closest("[data-book-cut]");
    if (bookBtn) bookCut(bookBtn.dataset.bookCut);
    const viewBtn = e.target.closest("[data-view-cut]");
    if (viewBtn) {
      document.getElementById("cuts").scrollIntoView({ behavior: scrollBehavior() });
      selectCut(viewBtn.dataset.viewCut, true);
    }
  });

  function bookCut(id) {
    const cut = cfg.cuts.find((c) => c.id === id);
    if (!cut) return;
    const select = $("#f-service");
    const notes = $("#f-notes");
    if (select && cut.service) {
      select.value = cut.service;
      select.dispatchEvent(new Event("input"));
    }
    if (notes && (!notes.value.trim() || notes.value.startsWith("Cut: "))) {
      notes.value = `Cut: ${cut.name} — ${cut.askFor}`;
    }
    document.getElementById("book").scrollIntoView({ behavior: scrollBehavior() });
    const name = $("#f-name");
    if (name) name.focus({ preventScroll: true });
    announce(`${cut.name} added to your booking request. Fill in your details below.`);
  }

  /* =========================================================
     CUT FINDER QUIZ
     ========================================================= */
  const finder = $("#finder-form");
  const results = $("#finder-results");
  const QUESTIONS = { hair: "hair type", effort: "styling time", vibe: "look", visits: "how often you'll come in" };
  const REASONS = {
    hair: "Works with your hair type",
    effort: "Fits your morning routine",
    vibe: "Matches the look you want",
    visits: "Suits how often you'll visit",
  };

  if (finder && results) {
    finder.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(finder);
      const missing = Object.keys(QUESTIONS).filter((k) => !data.get(k));
      const err = $("#finder-error");
      if (missing.length) {
        err.textContent = "Please answer: " + missing.map((k) => QUESTIONS[k]).join(", ") + ".";
        err.hidden = false;
        $(`input[name="${missing[0]}"]`, finder).focus();
        return;
      }
      err.hidden = true;

      const ranked = cfg.cuts.map((cut) => {
        const hits = Object.keys(QUESTIONS).filter((k) => cut.match[k] && cut.match[k].includes(data.get(k)));
        let score = hits.length;
        if (!hits.includes("hair")) score -= 2; // hair type matters most
        return { cut, hits, score };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      results.innerHTML = `
        <h3 class="results-title" tabindex="-1">Your top ${ranked.length} cuts</h3>
        <ol class="results-list" role="list">
          ${ranked.map(({ cut, hits }, i) => `
            <li class="result">
              ${imgTag(cut.image, cut.alt, 400, 500, "120px", 'loading="lazy"')}
              <div>
                <p class="result-rank">${i === 0 ? "Best match" : `Match ${i + 1}`} · ${Math.max(0, Math.round((hits.length / 4) * 100))}% fit</p>
                <h4>${esc(cut.name)}</h4>
                <ul class="result-why">${hits.map((h) => `<li>${REASONS[h]}</li>`).join("")}</ul>
                <div class="result-actions">
                  <button type="button" class="btn btn-ghost btn-sm" data-view-cut="${esc(cut.id)}">See details<span class="sr-only"> for ${esc(cut.name)}</span></button>
                  <button type="button" class="btn btn-primary btn-sm" data-book-cut="${esc(cut.id)}">Book<span class="sr-only"> ${esc(cut.name)}</span></button>
                </div>
              </div>
            </li>`).join("")}
        </ol>`;
      $(".results-title", results).focus();
    });
    finder.addEventListener("reset", () => {
      results.innerHTML = "";
      $("#finder-error").hidden = true;
    });
  }

  /* =========================================================
     CLIPPER GUARD GUIDE
     ========================================================= */
  const GUARDS = [
    { n: "#0", mm: 0.8, inch: "1/32″", desc: "No guard, lever closed. The shortest line of a skin fade." },
    { n: "#0.5", mm: 1.5, inch: "1/16″", desc: "Stubble length. Blends a skin fade into the first guard." },
    { n: "#1", mm: 3, inch: "1/8″", desc: "Very short buzz. Most low fades start here." },
    { n: "#1.5", mm: 4.5, inch: "3/16″", desc: "Half-step that makes a fade look smoother." },
    { n: "#2", mm: 6, inch: "1/4″", desc: "Classic short back and sides — the most-asked-for number." },
    { n: "#3", mm: 10, inch: "3/8″", desc: "Short but soft. The scalp barely shows through." },
    { n: "#4", mm: 13, inch: "1/2″", desc: "Longer crew-cut length that fully covers the scalp." },
    { n: "#5", mm: 16, inch: "5/8″", desc: "A soft taper — good for thick or curly hair." },
    { n: "#6", mm: 19, inch: "3/4″", desc: "Neat, grown-out length on the sides." },
    { n: "#8", mm: 25, inch: "1″", desc: "Longest standard guard for a full, natural look." },
  ];
  const range = $("#guard-range");
  if (range) {
    R("guard-scale").innerHTML = GUARDS.map((g) => `<span>${g.n.replace("#", "")}</span>`).join("");
    const update = () => {
      const g = GUARDS[Number(range.value)];
      $("#guard-number").innerHTML = `<strong>${g.n}</strong> <span>${g.mm} mm · ${g.inch}</span>`;
      $("#guard-desc").textContent = g.desc;
      range.setAttribute("aria-valuetext", `Guard ${g.n.replace("#", "number ")}, ${g.mm} millimetres`);
      range.style.setProperty("--fill", (Number(range.value) / (GUARDS.length - 1)) * 100 + "%");
      $(".guard-hair").style.setProperty("--len", (g.mm / 25) * 100 + "%");
    };
    range.addEventListener("input", update);
    update();
  }

  /* =========================================================
     PORTFOLIO + LIGHTBOX
     ========================================================= */
  const galleryEl = R("gallery");
  const filtersEl = R("filters");
  if (galleryEl) {
    galleryEl.innerHTML = cfg.gallery.map((g) => `
      <li class="gallery-item" data-category="${esc(g.category)}">
        <button type="button" class="gallery-btn" data-full="${esc(photo(g.src, 1200, 1500).src)}" aria-label="View larger: ${esc(g.alt)}">
          ${imgTag(g.src, g.alt, 600, 750, "(min-width: 1100px) 23vw, (min-width: 720px) 31vw, 46vw", 'loading="lazy"')}
          <span class="gallery-caption" aria-hidden="true">${esc(g.caption)}</span>
        </button>
      </li>`).join("");

    const used = [...new Set(cfg.gallery.map((g) => g.category))];
    filtersEl.innerHTML = [`<button type="button" class="filter" data-filter="all" aria-pressed="true">All</button>`]
      .concat(used.map((c) => `<button type="button" class="filter" data-filter="${esc(c)}" aria-pressed="false">${esc(cfg.galleryCategories[c] || c)}</button>`))
      .join("");
  }

  const items = $$(".gallery-item");
  const galleryStatus = $("#gallery-status");
  $$(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.filter;
      $$(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      let shown = 0;
      items.forEach((item) => {
        const visible = value === "all" || item.dataset.category === value;
        item.hidden = !visible;
        if (visible) shown++;
      });
      galleryStatus.textContent = `Showing ${shown} ${shown === 1 ? "photo" : "photos"}` + (value === "all" ? "." : `: ${btn.textContent.trim()}.`);
    });
  });

  const dialog = $("#lightbox");
  if (dialog) {
    const lbImg = $("#lightbox-img");
    const lbCaption = $("#lightbox-caption");
    const lbCount = $("#lightbox-count");
    let current = 0;
    let opener = null;
    const visibleButtons = () => items.filter((i) => !i.hidden).map((i) => $(".gallery-btn", i));

    const show = (index) => {
      const list = visibleButtons();
      current = (index + list.length) % list.length;
      const btn = list[current];
      const img = $("img", btn);
      lbImg.src = btn.dataset.full;
      lbImg.alt = img.alt;
      lbCaption.textContent = img.alt;
      lbCount.textContent = `Photo ${current + 1} of ${list.length}`;
    };

    $$(".gallery-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        opener = btn;
        show(visibleButtons().indexOf(btn));
        dialog.showModal();
        document.body.classList.add("no-scroll");
        $(".lightbox-close", dialog).focus();
      });
    });
    dialog.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action === "close" || e.target === dialog) dialog.close();
      else if (action === "prev") show(current - 1);
      else if (action === "next") show(current + 1);
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("no-scroll");
      if (opener) opener.focus();
    });
  }

  /* =========================================================
     BOOKING FORM
     ========================================================= */
  const form = $("#book-form");
  if (form) {
    const status = $("#form-status");
    const dateInput = $("#f-date");
    const todayISO = (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 10);
    })();
    dateInput.min = todayISO;

    const rules = {
      name: (v) => (v.trim().length >= 2 ? "" : "Enter your full name."),
      phone: (v) => {
        if (!v.trim()) return "Enter your mobile number so I can confirm by text.";
        return v.replace(/\D/g, "").length >= 7 ? "" : "Enter a valid phone number, for example (718) 555-0142.";
      },
      email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter an email address in the format name@example.com, or leave it blank."),
      service: (v) => (v ? "" : "Choose a service."),
      date: (v) => (!v ? "Choose a preferred date." : v < todayISO ? "Choose a date from today onwards." : ""),
    };

    const validateField = (field) => {
      const message = rules[field.name](field.value);
      const error = document.getElementById(field.id + "-error");
      if (message) {
        field.setAttribute("aria-invalid", "true");
        error.textContent = message;
        error.hidden = false;
        return false;
      }
      field.removeAttribute("aria-invalid");
      error.textContent = "";
      error.hidden = true;
      return true;
    };

    const fields = $$("input, select, textarea", form).filter((f) => rules[f.name]);
    fields.forEach((field) => {
      field.addEventListener("blur", () => { if (field.value || field.dataset.touched) validateField(field); field.dataset.touched = "1"; });
      field.addEventListener("input", () => { if (field.getAttribute("aria-invalid") === "true") validateField(field); });
      field.addEventListener("change", () => { if (field.getAttribute("aria-invalid") === "true") validateField(field); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = fields.filter((f) => !validateField(f));
      status.className = "form-status";
      if (invalid.length) {
        status.classList.add("is-error");
        status.textContent = `Please fix ${invalid.length} ${invalid.length === 1 ? "problem" : "problems"} in the form.`;
        invalid[0].focus();
        return;
      }
      // Replace this block with a fetch() to your form service.
      const first = $("#f-name").value.trim().split(" ")[0];
      status.classList.add("is-success");
      status.textContent = `Thanks ${first}! Your request is in — I'll text you to confirm your appointment.`;
      form.reset();
      dateInput.min = todayISO;
      fields.forEach((f) => delete f.dataset.touched);
      status.focus();
    });
  }

  /* ---------- Boot ---------- */
  renderStatic();
  applyBindings();
  applySections();
  syncThemeButton();

  // Admin preview reloads on every edit: keep the scroll position between reloads
  if (Core.preview) {
    const KEY = "barber-preview-scroll";
    const y = Number(sessionStorage.getItem(KEY));
    if (y) requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
    window.addEventListener("pagehide", () => sessionStorage.setItem(KEY, String(window.scrollY)));
  } else {
    // Always open on the hero: no remembered scroll position on load or reload.
    // A #section link from another page (e.g. "Book a chair") still jumps there, but not on reload.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const nav = performance.getEntriesByType("navigation")[0];
    const isReload = nav && nav.type === "reload";
    if (location.hash && isReload) history.replaceState(null, "", location.pathname + location.search);
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      window.addEventListener("load", () => window.scrollTo({ top: 0, behavior: "instant" }), { once: true });
    }
  }
})();
