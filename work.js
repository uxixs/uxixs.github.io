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
    up: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3.5M4 7.5l4-4 4 4"/></svg>',
    chat: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.75 3.75a1 1 0 0 1 1-1h8.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2.5v-2.5h-.25a1 1 0 0 1-1-1v-6Z"/></svg>',
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
  const mo = Number(w.month) >= 1 && Number(w.month) <= 12 ? String(Number(w.month)).padStart(2, "0") : "";
  const when = w.year ? `${w.year}${mo ? ". " + mo : ""}` : "";
  $("crumb").innerHTML = `<a href="./">${esc(t[1])}</a><span>/</span><span>${esc(when)}</span>`;

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
    [mo ? "발행일" : "발행연도", esc(when)],
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
      <p class="kind" data-type="${esc(w.type || "")}"><span class="glyph">${ICON[w.type] || ICON.paper}</span>${esc(t[0])}<span class="venue">${esc(when)}</span></p>
      <h1>${esc(w.title)}</h1>
      ${w.subheading ? `<p class="d-sub">${esc(w.subheading)}</p>` : ""}
      ${w.subtitle ? `<p class="d-en"><span>${esc(w.subtitle)}</span>${w.subheading_en ? `<br><span class="d-en-sub">${esc(w.subheading_en)}</span>` : ""}</p>` : ""}
      <div class="d-actions">
        ${cur ? `<a class="btn primary" href="#read">${ICON.book}<span>본문 보기</span></a>` : ""}
        ${dlBtns}${extBtns}
        ${S.comments ? `<a class="btn" href="#comments">${ICON.chat}<span>댓글</span></a>` : ""}
        <button type="button" class="btn" id="copy">${ICON.link}<span>링크 복사</span></button>
      </div>
    </div></section>

    <div class="d-wrap d-grid">
      <section class="d-abs">
        ${hasKoAbs || hasEnAbs ? `<div class="d-h"><h2>${w.type === "paper" ? "초록" : "소개"}</h2>${absTabs}</div>
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
          <button type="button" class="btn to-top" id="to-top" title="맨 위로">${ICON.up}<span>맨 위로</span></button>
        </div>
      </div></div>
      <div class="d-reader">
        <aside class="d-toc" id="toc"><p class="d-toc-h">목차</p><ol id="toc-list"></ol></aside>
        <div class="d-pages" id="pages"></div>
      </div>
    </section>` : ""}

    ${S.comments ? `<section class="d-comments" id="comments"><div class="d-wrap">
      <div class="d-h"><h2>댓글</h2><a class="d-cm-manage" id="cm-manage" href="#" target="_blank" rel="noopener" hidden>수정·삭제는 GitHub에서${ICON.arrow}</a></div>
      <div class="giscus"><p class="d-cm-note">댓글을 불러오는 중…</p></div>
    </div></section>` : ""}
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

  // ---- 댓글 (giscus) : 화면 가까이 오면 그때 불러옴 ----
  (function comments() {
    const C = S.comments, box = document.querySelector("#comments .giscus");
    if (!C || !box) return;
    const dark = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : { matches: false };
    // 사이트 색에 맞춘 테마 (giscus-light.css / giscus-dark.css)
    const theme = () => new URL(`giscus-${dark.matches ? "dark" : "light"}.css?v=1`, location.href).href;
    let started = false;
    function start() {
      if (started) return; started = true;
      const s = document.createElement("script");
      s.src = "https://giscus.app/client.js";
      s.async = true; s.crossOrigin = "anonymous";
      const cfg = {
        repo: C.repo, "repo-id": C.repoId, category: C.category, "category-id": C.categoryId,
        mapping: "specific", term: `work:${w.id}`, strict: "1",
        "reactions-enabled": "1", "emit-metadata": "1", "input-position": "top",
        theme: theme(), lang: "ko", loading: "lazy",
      };
      Object.entries(cfg).forEach(([k, v]) => s.setAttribute(`data-${k}`, v));
      s.onerror = () => { box.innerHTML = `<p class="d-cm-note">댓글을 불러오지 못했습니다.</p>`; };
      box.appendChild(s);
    }
    // 기기의 밝기 모드가 바뀌면 댓글 창도 따라 바꿈
    const onScheme = () => {
      const f = document.querySelector("iframe.giscus-frame");
      if (f) f.contentWindow.postMessage({ giscus: { setConfig: { theme: theme() } } }, "https://giscus.app");
    };
    if (dark.addEventListener) dark.addEventListener("change", onScheme);
    // 댓글 창 안에서는 지울 수 없어서(giscus 제약), 이 글의 GitHub 토론 페이지로 가는 링크를 띄움.
    // 거기서 본인 댓글은 본인이, 모든 댓글은 저장소 주인이 수정·삭제할 수 있음.
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://giscus.app" || !e.data || !e.data.giscus) return;
      const d = e.data.giscus.discussion, a = $("cm-manage");
      if (!a) return;
      if (d && /^https:\/\/github\.com\//.test(d.url || "")) { a.href = d.url; a.hidden = false; }
    });
    // 로그인하고 돌아왔거나 #comments 로 들어왔으면 바로 불러옴
    if (location.hash === "#comments" || params.has("giscus") || !("IntersectionObserver" in window)) { start(); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: "800px 0px" });
    io.observe(box);
    document.querySelectorAll('a[href="#comments"]').forEach((a) => a.addEventListener("click", start));
  })();

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
  let activeIdx = -1, picked = -1, lockUntil = 0;

  // 목차 항목·읽는 위치를 "문서 전체에서의 쪽 단위 위치"로: 3쪽 위에서 40% 지점 = 2.4
  const absOf = (it) => it.page - 1 + (it.y || 0);
  const absPos = (pos) => pos.page - 1 + pos.frac;

  function setOn(idx) {
    const changed = idx !== activeIdx;
    activeIdx = idx;
    tocList.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === idx));
    if (changed) revealActive(true);
  }

  // 강조된 목차 항목이 목차 창 밖에 있으면 목차를 스크롤해서 가운데쯤 보이게 함.
  // 사용자가 목차 위에 마우스를 올리고 보는 중이면 건드리지 않음.
  const tocEl = $("toc");
  function revealActive(smooth) {
    if (!tocEl || activeIdx < 0) return;
    if (smooth && tocEl.matches(":hover")) return;
    if (tocEl.scrollHeight <= tocEl.clientHeight + 1 || !tocEl.offsetParent) return; // 스크롤할 게 없거나 숨겨짐
    const btn = tocList.querySelectorAll("button")[activeIdx];
    if (!btn) return;
    const box = tocEl.getBoundingClientRect(), r = btn.getBoundingClientRect();
    const pad = Math.min(56, box.height / 4);
    if (r.top >= box.top + pad && r.bottom <= box.bottom - pad) return; // 이미 잘 보임
    const top = tocEl.scrollTop + r.top - box.top - (box.height - r.height) / 2;
    if (smooth && window.SmoothScroll) window.SmoothScroll.to(tocEl, top, { duration: 380 });
    else tocEl.scrollTop = top;
  }

  // 읽는 위치보다 앞에서 시작한 마지막 목차 항목
  function indexAt(a) {
    let idx = -1;
    toc.forEach((it, i) => { if (it.page && absOf(it) <= a + 0.004) idx = i; });
    return idx;
  }

  // 스크롤 위치 → 쪽 번호, 목차 강조
  function sync() {
    if (!view) return;
    const pos = view.position();
    pageno.textContent = `${pos.page} / ${view.pages}`;
    if (picked >= 0 && Date.now() < lockUntil) { setOn(picked); return; } // 목차 클릭 후 부드럽게 이동하는 중
    let idx = indexAt(absPos(pos));
    // 목차에서 직접 누른 항목이 같은 위치의 다른 항목과 겹치면 누른 항목을 유지
    if (picked >= 0 && toc[idx] && Math.abs(absOf(toc[idx]) - absOf(toc[picked])) < 1e-6) idx = picked;
    else picked = -1;
    setOn(idx);
  }
  let syncTimer = 0;
  window.addEventListener("scroll", () => {
    if (syncTimer) return;
    syncTimer = setTimeout(() => { syncTimer = 0; sync(); }, 60);
  }, { passive: true });

  // 목차 i 번째 항목의 범위 [시작, 다음 항목 시작) — 쪽 단위 위치
  function sectionRange(i, total) {
    const start = absOf(toc[i]);
    let next = total;
    for (let j = i + 1; j < toc.length; j++) {
      if (toc[j].page && absOf(toc[j]) > start) { next = absOf(toc[j]); break; }
    }
    return [start, next];
  }

  function goTo(abs, smooth) {
    const total = view.pages;
    const a = Math.min(Math.max(abs, 0), total - 0.001);
    view.scrollTo(Math.floor(a) + 1, smooth, a - Math.floor(a));
  }

  // keep: { idx, frac } 이면 새 언어 문서에서 같은 목차 항목(같은 순번)의 같은 비율 위치로 이동
  async function load(f, keep) {
    const my = ++token;
    cur = f;
    document.querySelectorAll("#lang-tabs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.path === f.path));
    const dl = $("bar-dl"); dl.href = f.path; dl.setAttribute("download", fileName(f.path));
    if (view) { view.destroy(); view = null; }
    if (cancel) { cancel(); cancel = null; }
    if (keep) pagesEl.style.minHeight = pagesEl.offsetHeight + "px"; // 다시 그리는 동안 스크롤 위치 유지
    pagesEl.innerHTML = `<p class="v-status">불러오는 중…</p>`;
    tocList.innerHTML = ""; pageno.textContent = ""; toc = []; activeIdx = -1; picked = -1;
    try {
      const r = await PdfView.open(f.path);
      if (my !== token) { r.cancel(); return; }
      cancel = r.cancel;
      const total = r.doc.numPages;
      pageno.textContent = `1 / ${total}`;
      view = await PdfView.mount(pagesEl, r.doc);
      if (my !== token) return;
      const outline = await PdfView.outline(r.doc);
      if (my !== token) return;
      toc = outline;
      tocList.innerHTML = toc.length
        ? toc.map((it, i) => `<li class="l${Math.min(it.level, 3)}"><button type="button" data-i="${i}"${it.page ? "" : " disabled"}>
            <span class="t">${esc(it.title)}</span>${it.page ? `<span class="p">${it.page}</span>` : ""}</button></li>`).join("")
        : `<li class="d-toc-none">목차 정보가 없습니다.</li>`;
      const idx = keep ? Math.min(keep.idx, toc.length - 1) : -1;
      if (idx >= 0 && toc[idx].page) {
        const [start, next] = sectionRange(idx, total);
        goTo(start + keep.frac * (next - start), false);
        picked = idx;
      }
      pagesEl.style.minHeight = "";
      sync();
    } catch (err) {
      pagesEl.style.minHeight = "";
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
      view.scrollTo(it.page, true, it.y || 0);
      picked = i; setOn(i); lockUntil = Date.now() + 1000;
    }
    $("toc").classList.remove("open"); $("toc-toggle").setAttribute("aria-expanded", "false");
  });
  $("to-top").addEventListener("click", () => {
    if (window.SmoothScroll) window.SmoothScroll.to(window, 0);
    else window.scrollTo(0, 0);
    $("toc").classList.remove("open"); $("toc-toggle").setAttribute("aria-expanded", "false");
  });
  $("toc-toggle").addEventListener("click", () => {
    const open = $("toc").classList.toggle("open");
    $("toc-toggle").setAttribute("aria-expanded", open);
    if (open) revealActive(false); // 휴대폰 목차 메뉴를 열면 지금 읽는 항목이 보이게
  });
  const lt = $("lang-tabs");
  if (lt) lt.addEventListener("click", (e) => {
    const b = e.target.closest("[data-path]");
    if (!b || b.dataset.path === cur.path) return;
    const f = pdfs.find((x) => x.path === b.dataset.path);
    if (!f) return;
    // 본문을 읽는 중이면 지금 목차 항목과 그 안에서의 위치를 기억해 두었다가 새 언어에서 이어서 보여 줌
    let keep = null;
    if (view && $("read").getBoundingClientRect().top < 80) {
      const a = absPos(view.position());
      const idx = picked >= 0 ? picked : indexAt(a);
      if (idx >= 0) {
        const [start, next] = sectionRange(idx, view.pages);
        keep = { idx, frac: Math.min(Math.max((a - start) / Math.max(next - start, 0.001), 0), 0.999) };
      }
    }
    load(f, keep);
    const u = new URL(location.href);
    if (f.label) u.searchParams.set("lang", f.label); else u.searchParams.delete("lang");
    history.replaceState(null, "", u);
    if (!keep) $("read").scrollIntoView({ block: "start" });
  });

  load(cur);
})();
