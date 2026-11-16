(function () {
  const S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const TYPES = {
    paper:   { one: "Paper",   many: "Papers" },
    project: { one: "Project", many: "Projects" },
  };
  const label = (t, many) => (TYPES[t] ? TYPES[t][many ? "many" : "one"] : String(t || ""));

  const ICON = {
    paper: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 1.75H9L12.5 5.25v8.25a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-11a.75.75 0 0 1 .75-.75Z"/><path d="M9 2v3.25h3.25M6 8.5h4M6 11h4"/></svg>',
    project: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5.5 4.75-3.25 3.25 3.25 3.25M10.5 4.75l3.25 3.25-3.25 3.25"/></svg>',
    other: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3"/></svg>',
    arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>',
    eye: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8S4 3.25 8 3.25 14.5 8 14.5 8 12 12.75 8 12.75 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2"/></svg>',
    down: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.75 7.5 8 10.75l3.25-3.25M3 13.5h10"/></svg>',
    close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>',
    ext: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M11.5 9.5v3.25a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75H6.5"/></svg>',
    full: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
  };

  const attrs = (h) => `href="${esc(h)}" target="_blank" rel="noopener"`;
  const isPdf = (p) => /\.pdf(\?|#|$)/i.test(p || "");
  const fileName = (p) => String(p || "").split("/").pop();
  const detailUrl = (w) => `work.html?id=${encodeURIComponent(w.id)}`;

  // 연도·달 내림차순. 같은 달(또는 달이 없는 같은 해)에서는 data.js 에 적은 순서 유지.
  const mon = (w) => { const m = Number(w.month); return m >= 1 && m <= 12 ? m : 0; };
  const works = (S.works || []).map((w, i) => ({ w, i }))
    .sort((a, b) => (Number(b.w.year) || 0) - (Number(a.w.year) || 0) || mon(b.w) - mon(a.w) || a.i - b.i)
    .map((x) => x.w);
  const types = [...new Set(works.map((w) => w.type).filter(Boolean))];
  let filter = "all";

  document.title = S.title || "Works";
  $("title").textContent = S.title || "Works";
  if (S.subtitle) $("subtitle").textContent = S.subtitle; else $("subtitle").remove();
  $("foot").textContent = `© ${new Date().getFullYear()} ${S.title || ""}`.trim();

  // files: [{label, path}] 또는 file: "경로" 둘 다 지원
  function filesOf(w) {
    if (Array.isArray(w.files)) return w.files.filter((f) => f && f.path);
    return w.file ? [{ label: "", path: w.file }] : [];
  }

  function renderFilters() {
    if (types.length < 2) { $("filters").hidden = true; return; }
    const opts = [["all", "All", works.length],
      ...types.map((t) => [t, label(t, true), works.filter((w) => w.type === t).length])];
    $("filters").innerHTML = opts.map(([k, text, n]) =>
      `<button type="button" data-f="${esc(k)}" aria-pressed="${k === filter}">${esc(text)}<span>${n}</span></button>`
    ).join("");
  }

  function item(w, wi) {
    const paper = w.type === "paper";
    const files = filesOf(w);
    const links = [
      w.link && [w.link, paper ? "Link" : "Demo"],
      w.code && [w.code, "Code"],
    ].filter(Boolean);

    let first = true;
    const fileBtns = files.map((f, fi) => {
      const lang = f.label ? ` <span class="lang">${esc(f.label)}</span>` : "";
      const cls = first ? " primary" : ""; first = false;
      if (!isPdf(f.path)) {
        return `<a class="btn${cls}" ${attrs(f.path)} download>${ICON.down}File${lang}</a>`;
      }
      return `<span class="split">
        <button type="button" class="btn${cls}" data-view="${wi}:${fi}">${ICON.eye}읽기${lang}</button>
        <a class="btn icon${cls}" href="${esc(f.path)}" download="${esc(fileName(f.path))}" aria-label="다운로드${f.label ? " (" + esc(f.label) + ")" : ""}" title="다운로드">${ICON.down}</a>
      </span>`;
    });
    const linkBtns = links.map(([h, l]) => {
      const cls = first ? " primary" : ""; first = false;
      return `<a class="btn${cls}" ${attrs(h)}>${l}${ICON.arrow}</a>`;
    });
    const acts = [...fileBtns, ...linkBtns];

    const tags = (Array.isArray(w.tags) ? w.tags : []).filter(Boolean);
    const icon = ICON[w.type] || ICON.other;
    const title = esc(w.title || "Untitled");
    // 제목: id 가 있으면 상세 페이지, 없으면 첫 PDF 팝업, 그것도 없으면 첫 링크
    const firstPdf = files.findIndex((f) => isPdf(f.path));
    let titleHtml = title, thumbOpen = "div";
    if (w.id) {
      titleHtml = `<a href="${detailUrl(w)}">${title}</a>`;
      thumbOpen = `a href="${detailUrl(w)}" tabindex="-1" aria-hidden="true"`;
    } else if (firstPdf >= 0) {
      titleHtml = `<button type="button" class="title-btn" data-view="${wi}:${firstPdf}">${title}</button>`;
      thumbOpen = `button type="button" data-view="${wi}:${firstPdf}" tabindex="-1" aria-hidden="true"`;
    } else if (links[0]) {
      titleHtml = `<a ${attrs(links[0][0])}>${title}</a>`;
      thumbOpen = `a ${attrs(links[0][0])} tabindex="-1" aria-hidden="true"`;
    }
    const thumbClose = thumbOpen.split(" ")[0];

    return `<article class="work${w.image ? " has-image" : ""}" data-type="${esc(w.type || "")}">
      <div class="body">
        <p class="kind"><span class="glyph">${icon}</span>${esc(label(w.type))}${w.venue ? `<span class="venue">${esc(w.venue)}</span>` : ""}</p>
        <h3>${titleHtml}</h3>
        ${w.subtitle ? `<p class="alt">${esc(w.subtitle)}</p>` : ""}
        ${w.description ? `<p class="desc">${Tex.html(w.description, esc)}</p>` : ""}
        ${acts.length || tags.length ? `<div class="meta">
          ${acts.length ? `<div class="actions">${acts.join("")}</div>` : ""}
          ${tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        </div>` : ""}
      </div>
      ${w.image ? `<${thumbOpen} class="thumb"><img src="${esc(w.image)}" alt="" loading="lazy"></${thumbClose}>` : ""}
    </article>`;
  }

  function renderWorks() {
    const list = filter === "all" ? works : works.filter((w) => w.type === filter);
    if (!list.length) { $("works").innerHTML = `<p class="empty">아직 올린 작업이 없습니다.</p>`; return; }
    const groups = [];
    list.forEach((w) => {
      const y = w.year ? String(w.year) : "";
      const m = y && mon(w) ? String(mon(w)).padStart(2, "0") : "";
      const g = groups[groups.length - 1];
      if (g && g.year === y && g.month === m) g.items.push(w); else groups.push({ year: y, month: m, items: [w] });
    });
    $("works").innerHTML = groups.map((g) =>
      `<section class="year">
        <h2>${esc(g.year || "—")}${g.month ? ` <span class="mo">${g.month}</span>` : ""}</h2>
        <div class="items">${g.items.map((w) => item(w, works.indexOf(w))).join("")}</div>
      </section>`).join("");
    Tex.run($("works"));
  }

  $("filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b || b.dataset.f === filter) return;
    filter = b.dataset.f;
    renderFilters(); renderWorks();
  });

  $("works").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b) return;
    const [wi, fi] = b.dataset.view.split(":").map(Number);
    Popup.open(works[wi], fi);
  });

  renderFilters();
  renderWorks();

  // =============================================================
  //  읽기 팝업
  // =============================================================
  const Popup = (() => {
    const el = $("viewer");
    const pagesEl = el.querySelector(".v-pages");
    const titleEl = el.querySelector(".v-title");
    const tabsEl = el.querySelector(".v-tabs");
    const infoEl = el.querySelector(".v-info");
    const dlEl = el.querySelector(".v-download");
    const extEl = el.querySelector(".v-external");
    const fullEl = el.querySelector(".v-full");
    let token = 0, cur = null, view = null, cancel = null, lastFocus = null, pushed = false;

    el.querySelector(".v-close").innerHTML = ICON.close;
    dlEl.innerHTML = ICON.down + "<span>다운로드</span>";
    extEl.innerHTML = ICON.ext;
    fullEl.innerHTML = ICON.full + "<span>상세 페이지</span>";

    function teardown() {
      if (view) { view.destroy(); view = null; }
      if (cancel) { cancel(); cancel = null; }
    }

    async function show(w, f) {
      const my = ++token;
      const pdfs = filesOf(w).filter((x) => isPdf(x.path));
      cur = { w, f };
      titleEl.textContent = w.title || "";
      tabsEl.innerHTML = pdfs.length > 1
        ? pdfs.map((x) => `<button type="button" aria-pressed="${x.path === f.path}" data-path="${esc(x.path)}">${esc(x.label || fileName(x.path))}</button>`).join("")
        : "";
      tabsEl.hidden = pdfs.length < 2;
      dlEl.href = f.path; dlEl.setAttribute("download", fileName(f.path));
      extEl.href = f.path;
      fullEl.hidden = !w.id;
      if (w.id) fullEl.href = detailUrl(w) + (f.label ? "&lang=" + encodeURIComponent(f.label) : "");
      infoEl.textContent = "";
      pagesEl.innerHTML = `<p class="v-status">불러오는 중…</p>`;
      pagesEl.scrollTop = 0;
      teardown();
      try {
        const r = await PdfView.open(f.path);
        if (my !== token) { r.cancel(); return; }
        cancel = r.cancel;
        infoEl.textContent = `${r.doc.numPages}쪽`;
        view = await PdfView.mount(pagesEl, r.doc, { root: pagesEl });
      } catch (err) {
        if (my !== token) return;
        pagesEl.innerHTML = `<p class="v-status">미리보기를 불러오지 못했습니다.<br>
          <a href="${esc(f.path)}" target="_blank" rel="noopener">새 탭에서 열기</a> 또는 <a href="${esc(f.path)}" download>다운로드</a>를 이용해 주세요.</p>`;
      }
    }

    function open(w, fi) {
      const f = filesOf(w)[fi];
      if (!f) return;
      lastFocus = document.activeElement;
      el.hidden = false;
      document.documentElement.classList.add("v-lock");
      requestAnimationFrame(() => el.classList.add("on"));
      el.querySelector(".v-close").focus();
      if (!pushed) { history.pushState({ popup: 1 }, ""); pushed = true; }
      show(w, f);
    }

    function close(fromPop) {
      if (el.hidden) return;
      token++;
      teardown();
      el.classList.remove("on");
      el.hidden = true;
      pagesEl.innerHTML = "";
      document.documentElement.classList.remove("v-lock");
      if (pushed && !fromPop) history.back();
      pushed = false;
      if (lastFocus) lastFocus.focus();
    }

    el.querySelector(".v-close").addEventListener("click", () => close());
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    tabsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-path]");
      if (!b || !cur || b.dataset.path === cur.f.path) return;
      const f = filesOf(cur.w).find((x) => x.path === b.dataset.path);
      if (f) show(cur.w, f);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("popstate", () => close(true));

    return { open, close };
  })();
})();
