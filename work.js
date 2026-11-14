(function () {
  const S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isPdf = (p) => /\.pdf(\?|#|$)/i.test(p || "");
  const fileName = (p) => String(p || "").split("/").pop();
  const filesOf = (w) => Array.isArray(w.files) ? w.files.filter((f) => f && f.path)
    : (w.file ? [{ label: "", path: w.file }] : []);
  const TYPE = { paper: ["Paper", "Papers", "논문"], project: ["Project", "Projects", "프로젝트"] };

  const ICON = {
    paper: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.25 1.75H9L12.5 5.25v8.25a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-11a.75.75 0 0 1 .75-.75Z"/><path d="M9 2v3.25h3.25M6 8.5h4M6 11h4"/></svg>',
    project: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5.5 4.75-3.25 3.25 3.25 3.25M10.5 4.75l3.25 3.25-3.25 3.25"/></svg>',
    back: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
    down: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.75 7.5 8 10.75l3.25-3.25M3 13.5h10"/></svg>',
    book: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4.25C6.75 3.25 4.75 2.75 2 2.75v9.5c2.75 0 4.75.5 6 1.5 1.25-1 3.25-1.5 6-1.5v-9.5c-2.75 0-4.75.5-6 1.5ZM8 4.25v9.5"/></svg>',
    link: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.75 9.25a2.75 2.75 0 0 0 4 .1l2-2a2.75 2.75 0 0 0-3.9-3.9l-.85.85M9.25 6.75a2.75 2.75 0 0 0-4-.1l-2 2a2.75 2.75 0 0 0 3.9 3.9l.85-.85"/></svg>',
    arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>',
    list: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"/></svg>',
  };

  const site = S.title || "uxixs";
  $("brand").innerHTML = `${ICON.back}<span>${esc(site)}</span>`;
  $("foot").textContent = `© ${new Date().getFullYear()} ${site}`;

  const params = new URLSearchParams(location.search);
  const w = (S.works || []).find((x) => x.id && x.id === params.get("id"));
  if (!w) {
    document.title = site;
    $("detail").innerHTML = `<div class="d-wrap d-missing"><h1>작업을 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 삭제된 작업입니다.</p><a class="btn primary" href="./">목록으로</a></div>`;
    return;
  }

  const t = TYPE[w.type] || [w.type || "", w.type || "", w.type || ""];
  document.title = `${w.title} · ${site}`;
  $("crumb").innerHTML = `<a href="./">${esc(t[1])}</a><span>/</span><span>${esc(w.year || "")}</span>`;

  const pdfs = filesOf(w).filter((f) => isPdf(f.path));
  const others = filesOf(w).filter((f) => !isPdf(f.path));
  const want = params.get("lang");
  let cur = pdfs.find((f) => f.label === want) || pdfs[0] || null;

  // 언어 판별: 라벨에 English/영문이 있으면 영문 초록을 먼저 보여 줌
  const isEn = (f) => !!f && /^(en|english|영문)/i.test(f.label || "");
  const hasKoAbs = !!w.abstract, hasEnAbs = !!w.abstract_en;
  let absLang = isEn(cur) && hasEnAbs ? "en" : (hasKoAbs ? "ko" : "en");

  const paras = (s) => String(s || "").split(/\n\s*\n/).map((p) => `<p>${Tex.html(p.trim(), esc)}</p>`).join("");
  const chips = (arr) => (arr || []).filter(Boolean).map((k) => `<li>${esc(k)}</li>`).join("");

  const dlBtns = [...pdfs, ...others].map((f) =>
    `<a class="btn" href="${esc(f.path)}" download="${esc(fileName(f.path))}">${ICON.down}<span>다운로드${f.label ? ` <span class="lang">${esc(f.label)}</span>` : ""}</span></a>`).join("");
  const extBtns = [
    w.link && `<a class="btn" href="${esc(w.link)}" target="_blank" rel="noopener">${w.type === "paper" ? "Link" : "Demo"}${ICON.arrow}</a>`,
    w.code && `<a class="btn" href="${esc(w.code)}" target="_blank" rel="noopener">Code${ICON.arrow}</a>`,
  ].filter(Boolean).join("");

  const rows = [
    ["유형", esc(t[2] || t[0])],
    ["발행연도", esc(w.year || "")],
    w.venue && ["구분", esc(w.venue)],
    pdfs.length && ["언어", pdfs.map((f) => esc(f.label || "PDF")).join(" · ")],
    pdfs.length && ["분량", `<span id="pagecounts">${pdfs.map((f) => `${esc(f.label || "PDF")} <span data-count="${esc(f.path)}">…</span>`).join(" · ")}</span>`],
    w.keywords && w.keywords.length && ["주제어", `<ul class="d-kw">${chips(w.keywords)}</ul>`],
    w.keywords_en && w.keywords_en.length && ["Keywords", `<ul class="d-kw">${chips(w.keywords_en)}</ul>`],
    !w.keywords && w.tags && w.tags.length && ["태그", `<ul class="d-kw">${chips(w.tags)}</ul>`],
  ].filter(Boolean);

  const absTabs = hasKoAbs && hasEnAbs
    ? `<div class="seg" id="abs-tabs" role="group" aria-label="초록 언어">
        <button type="button" data-l="ko" aria-pressed="${absLang === "ko"}">국문 초록</button>
        <button type="button" data-l="en" aria-pressed="${absLang === "en"}">Abstract</button></div>` : "";

  $("detail").innerHTML = `
    <section class="d-hero"><div class="d-wrap">
      <p class="kind" data-type="${esc(w.type || "")}"><span class="glyph">${ICON[w.type] || ICON.paper}</span>${esc(t[0])}<span class="venue">${esc(w.year || "")}</span></p>
      <h1>${esc(w.title)}</h1>
      ${w.subheading ? `<p class="d-sub">${esc(w.subheading)}</p>` : ""}
      ${w.subtitle ? `<p class="d-en"><span>${esc(w.subtitle)}</span>${w.subheading_en ? `<br><span class="d-en-sub">${esc(w.subheading_en)}</span>` : ""}</p>` : ""}
      <div class="d-actions">
        ${cur ? `<a class="btn primary" href="#read">${ICON.book}<span>본문 보기</span></a>` : ""}
        ${dlBtns}${extBtns}
        <button type="button" class="btn" id="copy">${ICON.link}<span>링크 복사</span></button>
      </div>
    </div></section>

    <div class="d-wrap d-grid">
      <section class="d-abs">
        ${hasKoAbs || hasEnAbs ? `<div class="d-h"><h2>초록</h2>${absTabs}</div>
          <div class="d-abs-body" id="abs-body"></div>` :
          (w.description ? `<div class="d-h"><h2>소개</h2></div><div class="d-abs-body">${paras(w.description)}</div>` : "")}
      </section>
      <aside class="d-info">
        <div class="d-h"><h2>${w.type === "paper" ? "논문 정보" : "정보"}</h2></div>
        <dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      </aside>
    </div>

    ${cur ? `<section class="d-read" id="read">
      <div class="d-bar"><div class="d-bar-in">
        <div class="d-bar-l">
          <button type="button" class="d-toc-toggle" id="toc-toggle" aria-expanded="false">${ICON.list}<span>목차</span></button>
          <h2>본문</h2>
          ${pdfs.length > 1 ? `<div class="seg" id="lang-tabs" role="group" aria-label="본문 언어">
            ${pdfs.map((f) => `<button type="button" data-path="${esc(f.path)}" aria-pressed="${f === cur}">${esc(f.label || fileName(f.path))}</button>`).join("")}</div>` : ""}
        </div>
        <div class="d-bar-r">
          <span class="d-pageno" id="pageno"></span>
          <a class="btn icon" id="bar-dl" href="#" download aria-label="다운로드" title="다운로드">${ICON.down}</a>
        </div>
      </div></div>
      <div class="d-reader">
        <aside class="d-toc" id="toc"><p class="d-toc-h">목차</p><ol id="toc-list"></ol></aside>
        <div class="d-pages" id="pages"></div>
      </div>
    </section>` : ""}
  `;

  // ---- 초록 ----
  function renderAbs() {
    const body = $("abs-body");
    if (!body) return;
    body.lang = absLang === "en" ? "en" : "ko";
    body.innerHTML = paras(absLang === "en" ? w.abstract_en : w.abstract);
    Tex.run(body);
    document.querySelectorAll("#abs-tabs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === absLang));
  }
  renderAbs();
  Tex.run($("detail"));
  const absTabsEl = $("abs-tabs");
  if (absTabsEl) absTabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-l]");
    if (b) { absLang = b.dataset.l; renderAbs(); }
  });

  // ---- 링크 복사 ----
  $("copy").addEventListener("click", async (e) => {
    const b = e.currentTarget, span = b.querySelector("span");
    try { await navigator.clipboard.writeText(location.href); span.textContent = "복사됨"; }
    catch (err) { span.textContent = "복사 실패"; }
    setTimeout(() => { span.textContent = "링크 복사"; }, 1600);
  });

  // ---- 쪽수 (정보 표) ----
  pdfs.forEach(async (f) => {
    try {
      const lib = await PdfView.loadLib();
      const d = await lib.getDocument({ url: f.path }).promise;
      const el = document.querySelector(`[data-count="${CSS.escape(f.path)}"]`);
      if (el) el.textContent = `${d.numPages}쪽`;
      d.destroy();
    } catch (e) {}
  });

  if (!cur) return;

  // ---- 본문 ----
  const pagesEl = $("pages"), tocList = $("toc-list"), pageno = $("pageno");
  let view = null, cancel = null, token = 0, toc = [];

  // 지금 쪽에 해당하는 목차 항목 강조. 같은 쪽에서 시작하는 항목이 여럿이면 첫 항목.
  // 목차를 눌러 이동했으면 그 쪽을 벗어날 때까지 누른 항목을 유지.
  let shownPage = 0, picked = -1;
  function setOn(idx) {
    tocList.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === idx));
  }
  function markToc(n) {
    if (n === shownPage && picked >= 0) return;
    shownPage = n; picked = -1;
    let best = 0;
    toc.forEach((it) => { if (it.page && it.page <= n && it.page > best) best = it.page; });
    setOn(toc.findIndex((it) => it.page === best));
  }

  async function load(f) {
    const my = ++token;
    cur = f;
    document.querySelectorAll("#lang-tabs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.path === f.path));
    const dl = $("bar-dl"); dl.href = f.path; dl.setAttribute("download", fileName(f.path));
    if (view) { view.destroy(); view = null; }
    if (cancel) { cancel(); cancel = null; }
    pagesEl.innerHTML = `<p class="v-status">불러오는 중…</p>`;
    tocList.innerHTML = ""; pageno.textContent = ""; toc = []; shownPage = 0; picked = -1;
    try {
      const r = await PdfView.open(f.path);
      if (my !== token) { r.cancel(); return; }
      cancel = r.cancel;
      const total = r.doc.numPages;
      pageno.textContent = `1 / ${total}`;
      view = await PdfView.mount(pagesEl, r.doc, {
        onPage: (n) => { pageno.textContent = `${n} / ${total}`; markToc(n); },
      });
      toc = await PdfView.outline(r.doc);
      if (my !== token) return;
      tocList.innerHTML = toc.length
        ? toc.map((it, i) => `<li class="l${Math.min(it.level, 3)}"><button type="button" data-i="${i}"${it.page ? "" : " disabled"}>
            <span class="t">${esc(it.title)}</span>${it.page ? `<span class="p">${it.page}</span>` : ""}</button></li>`).join("")
        : `<li class="d-toc-none">목차 정보가 없습니다.</li>`;
      markToc(1);
    } catch (err) {
      if (my !== token) return;
      pagesEl.innerHTML = `<p class="v-status">본문을 불러오지 못했습니다.<br>
        <a href="${esc(f.path)}" target="_blank" rel="noopener">새 탭에서 열기</a> 또는 <a href="${esc(f.path)}" download>다운로드</a>를 이용해 주세요.</p>`;
    }
  }

  tocList.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (!b || !view) return;
    const i = Number(b.dataset.i), it = toc[i];
    if (it && it.page) {
      view.scrollTo(it.page, true);
      shownPage = it.page; picked = i; setOn(i);
    }
    $("toc").classList.remove("open"); $("toc-toggle").setAttribute("aria-expanded", "false");
  });
  $("toc-toggle").addEventListener("click", () => {
    const open = $("toc").classList.toggle("open");
    $("toc-toggle").setAttribute("aria-expanded", open);
  });
  const lt = $("lang-tabs");
  if (lt) lt.addEventListener("click", (e) => {
    const b = e.target.closest("[data-path]");
    if (!b || b.dataset.path === cur.path) return;
    const f = pdfs.find((x) => x.path === b.dataset.path);
    if (!f) return;
    load(f);
    const u = new URL(location.href);
    if (f.label) u.searchParams.set("lang", f.label); else u.searchParams.delete("lang");
    history.replaceState(null, "", u);
    $("read").scrollIntoView({ block: "start" });
  });

  load(cur);
})();
