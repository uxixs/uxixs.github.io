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
  };

  const attrs = (h) => `href="${esc(h)}" target="_blank" rel="noopener"`;
  const isPdf = (p) => /\.pdf(\?|#|$)/i.test(p || "");
  const fileName = (p) => String(p || "").split("/").pop();

  // 연도 내림차순. 같은 해에서는 data.js 에 적은 순서 유지.
  const works = (S.works || []).map((w, i) => ({ w, i }))
    .sort((a, b) => (Number(b.w.year) || 0) - (Number(a.w.year) || 0) || a.i - b.i)
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
    const firstPdf = files.findIndex((f) => isPdf(f.path));
    const titleHtml = firstPdf >= 0
      ? `<button type="button" class="title-btn" data-view="${wi}:${firstPdf}">${title}</button>`
      : (links[0] ? `<a ${attrs(links[0][0])}>${title}</a>` : title);
    const thumbOpen = firstPdf >= 0 ? `button type="button" data-view="${wi}:${firstPdf}" tabindex="-1" aria-hidden="true"`
      : (links[0] ? `a ${attrs(links[0][0])} tabindex="-1" aria-hidden="true"` : "div");
    const thumbClose = thumbOpen.split(" ")[0];

    return `<article class="work${w.image ? " has-image" : ""}" data-type="${esc(w.type || "")}">
      <div class="body">
        <p class="kind"><span class="glyph">${icon}</span>${esc(label(w.type))}${w.venue ? `<span class="venue">${esc(w.venue)}</span>` : ""}</p>
        <h3>${titleHtml}</h3>
        ${w.subtitle ? `<p class="alt">${esc(w.subtitle)}</p>` : ""}
        ${w.description ? `<p class="desc">${esc(w.description)}</p>` : ""}
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
      const g = groups[groups.length - 1];
      if (g && g.year === y) g.items.push(w); else groups.push({ year: y, items: [w] });
    });
    $("works").innerHTML = groups.map((g) =>
      `<section class="year">
        <h2>${esc(g.year || "—")}</h2>
        <div class="items">${g.items.map((w) => item(w, works.indexOf(w))).join("")}</div>
      </section>`).join("");
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
    Viewer.open(works[wi], fi, true);
  });

  renderFilters();
  renderWorks();

  // =============================================================
  //  PDF 뷰어 (PDF.js). 처음 열 때만 라이브러리를 불러옵니다.
  // =============================================================
  const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/";
  const Viewer = (() => {
    const el = $("viewer");
    const pagesEl = el.querySelector(".v-pages");
    const titleEl = el.querySelector(".v-title");
    const tabsEl = el.querySelector(".v-tabs");
    const infoEl = el.querySelector(".v-info");
    const dlEl = el.querySelector(".v-download");
    const extEl = el.querySelector(".v-external");
    let libPromise = null, doc = null, task = null, observer = null, token = 0;
    let current = null, lastFocus = null, pushed = false;

    el.querySelector(".v-close").innerHTML = ICON.close;
    dlEl.innerHTML = ICON.down + "<span>다운로드</span>";
    extEl.innerHTML = ICON.ext;

    function loadLib() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (!libPromise) {
        libPromise = new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = PDFJS + "build/pdf.min.js";
          s.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "build/pdf.worker.min.js";
            res(window.pdfjsLib);
          };
          s.onerror = () => { libPromise = null; rej(new Error("lib")); };
          document.head.appendChild(s);
        });
      }
      return libPromise;
    }

    function setStatus(text) { pagesEl.innerHTML = `<p class="v-status">${text}</p>`; }

    async function show(w, fi) {
      const files = filesOf(w).filter((f) => isPdf(f.path));
      const f = files.find((x) => x === filesOf(w)[fi]) || files[0];
      current = { w, f };
      const my = ++token;

      titleEl.textContent = w.title || "";
      tabsEl.innerHTML = files.length > 1
        ? files.map((x) => `<button type="button" aria-pressed="${x === f}" data-path="${esc(x.path)}">${esc(x.label || fileName(x.path))}</button>`).join("")
        : "";
      tabsEl.hidden = files.length < 2;
      dlEl.href = f.path; dlEl.setAttribute("download", fileName(f.path));
      extEl.href = f.path;
      infoEl.textContent = "";
      setStatus("불러오는 중…");
      pagesEl.scrollTop = 0;

      cleanup();
      try {
        const lib = await loadLib();
        if (my !== token) return;
        task = lib.getDocument({
          url: f.path,
          cMapUrl: PDFJS + "cmaps/", cMapPacked: true,
          standardFontDataUrl: PDFJS + "standard_fonts/",
        });
        doc = await task.promise;
        if (my !== token) return;
        await layout(my);
      } catch (err) {
        if (my !== token) return;
        pagesEl.innerHTML = `<p class="v-status">미리보기를 불러오지 못했습니다.<br>
          <a href="${esc(f.path)}" target="_blank" rel="noopener">새 탭에서 열기</a> 또는 <a href="${esc(f.path)}" download>다운로드</a>를 이용해 주세요.</p>`;
      }
    }

    async function layout(my) {
      const first = await doc.getPage(1);
      if (my !== token) return;
      const vp = first.getViewport({ scale: 1 });
      const ratio = vp.height / vp.width;
      infoEl.textContent = `${doc.numPages}쪽`;
      pagesEl.innerHTML = "";
      const frag = document.createDocumentFragment();
      for (let n = 1; n <= doc.numPages; n++) {
        const p = document.createElement("div");
        p.className = "v-page";
        p.dataset.n = n;
        p.style.aspectRatio = `1 / ${ratio}`;
        frag.appendChild(p);
      }
      pagesEl.appendChild(frag);
      const boxes = [...pagesEl.querySelectorAll(".v-page")];
      const want = (box) => {
        if (box.dataset.done) return;
        box.dataset.done = "1";
        renderPage(box, my);
      };
      // 첫 두 쪽은 바로 그리고, 나머지는 스크롤해서 가까워지면 그립니다.
      boxes.slice(0, 2).forEach(want);
      observer = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) want(en.target); });
      }, { root: pagesEl, rootMargin: "1200px 0px" });
      boxes.forEach((p) => observer.observe(p));
    }

    async function renderPage(box, my) {
      try {
        const page = await doc.getPage(Number(box.dataset.n));
        if (my !== token) return;
        const base = page.getViewport({ scale: 1 });
        box.style.aspectRatio = `${base.width} / ${base.height}`;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const scale = (box.clientWidth / base.width) * dpr;
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        if (my !== token) return;
        box.appendChild(canvas);
      } catch (e) { box.dataset.done = ""; }
    }

    function cleanup() {
      if (observer) { observer.disconnect(); observer = null; }
      if (task) { try { task.destroy(); } catch (e) {} task = null; }
      doc = null;
    }

    function open(w, fi, fromClick) {
      lastFocus = document.activeElement;
      el.hidden = false;
      document.documentElement.classList.add("v-lock");
      requestAnimationFrame(() => el.classList.add("on"));
      el.querySelector(".v-close").focus();
      if (fromClick && !pushed) { history.pushState({ viewer: 1 }, ""); pushed = true; }
      show(w, fi);
    }

    function close(fromPop) {
      if (el.hidden) return;
      token++;
      cleanup();
      el.classList.remove("on");
      el.hidden = true;
      pagesEl.innerHTML = "";
      document.documentElement.classList.remove("v-lock");
      if (pushed && !fromPop) { pushed = false; history.back(); }
      pushed = false;
      if (lastFocus) lastFocus.focus();
    }

    el.querySelector(".v-close").addEventListener("click", () => close());
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    tabsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-path]");
      if (!b || !current || b.dataset.path === current.f.path) return;
      const fi = filesOf(current.w).findIndex((x) => x.path === b.dataset.path);
      show(current.w, fi);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("popstate", () => close(true));

    return { open, close };
  })();
})();
