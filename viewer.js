// =============================================================
//  PDF 렌더링 공용 코드 (PDF.js). index.html 팝업과 work.html 본문이 같이 씁니다.
// =============================================================
(function () {
  const BASE = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/";
  let libPromise = null;

  function loadLib() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!libPromise) {
      libPromise = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = BASE + "build/pdf.min.js";
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "build/pdf.worker.min.js";
          res(window.pdfjsLib);
        };
        s.onerror = () => { libPromise = null; rej(new Error("pdf.js load failed")); };
        document.head.appendChild(s);
      });
    }
    return libPromise;
  }

  // 문서 열기. 반환값의 cancel() 로 중간에 취소할 수 있습니다.
  async function open(url) {
    const lib = await loadLib();
    const task = lib.getDocument({
      url,
      cMapUrl: BASE + "cmaps/", cMapPacked: true,
      standardFontDataUrl: BASE + "standard_fonts/",
    });
    const doc = await task.promise;
    return { doc, cancel: () => { try { task.destroy(); } catch (e) {} } };
  }

  // container 안에 쪽마다 상자를 만들고, 보이는 근처만 그립니다.
  //   opts.root   : 스크롤되는 요소 (없으면 화면 전체)
  //   opts.onPage : 지금 보고 있는 쪽 번호가 바뀔 때 호출
  async function mount(container, doc, opts = {}) {
    let alive = true;
    const first = await doc.getPage(1);
    if (!alive) return null;
    const v1 = first.getViewport({ scale: 1 });

    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    const boxes = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const box = document.createElement("div");
      box.className = "v-page";
      box.dataset.n = n;
      box.style.aspectRatio = `${v1.width} / ${v1.height}`;
      boxes.push(box);
      frag.appendChild(box);
    }
    container.appendChild(frag);

    async function draw(box) {
      if (box.dataset.done) return;
      box.dataset.done = "1";
      try {
        const page = await doc.getPage(Number(box.dataset.n));
        if (!alive) return;
        const base = page.getViewport({ scale: 1 });
        box.style.aspectRatio = `${base.width} / ${base.height}`;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const vp = page.getViewport({ scale: (box.clientWidth / base.width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        if (!alive) return;
        box.appendChild(canvas);
      } catch (e) { box.dataset.done = ""; }
    }

    boxes.slice(0, 2).forEach(draw);
    const near = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && draw(e.target)),
      { root: opts.root || null, rootMargin: "1400px 0px" });
    boxes.forEach((b) => near.observe(b));

    let tracker = null;
    if (opts.onPage) {
      tracker = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) opts.onPage(Number(e.target.dataset.n));
      }), { root: opts.root || null, rootMargin: "-45% 0px -54% 0px" });
      boxes.forEach((b) => tracker.observe(b));
    }

    const marginTop = () => parseFloat(getComputedStyle(boxes[0]).scrollMarginTop) || 0;
    const rootTop = () => (opts.root ? opts.root.getBoundingClientRect().top : 0);

    return {
      pages: doc.numPages,
      // n 쪽의 위에서 frac(0~1) 지점이 화면 위쪽(고정 막대 바로 아래)에 오도록 이동
      scrollTo(n, smooth, frac = 0) {
        const b = boxes[n - 1];
        if (!b) return;
        const r = b.getBoundingClientRect();
        const delta = r.top - rootTop() + frac * r.height - marginTop();
        const behavior = smooth ? "smooth" : "auto";
        if (opts.root) opts.root.scrollTo({ top: opts.root.scrollTop + delta, behavior });
        else window.scrollTo({ top: window.scrollY + delta, behavior });
      },
      // 지금 읽는 위치 (화면 위쪽 기준선이 걸친 쪽과 그 쪽 안에서의 비율)
      position() {
        const line = rootTop() + marginTop() + 6;
        for (let i = 0; i < boxes.length; i++) {
          const r = boxes[i].getBoundingClientRect();
          if (r.bottom > line) {
            return { page: i + 1, frac: Math.min(Math.max((line - r.top) / r.height, 0), 1) };
          }
        }
        return { page: boxes.length, frac: 1 };
      },
      destroy() {
        alive = false;
        near.disconnect();
        if (tracker) tracker.disconnect();
      },
    };
  }

  const norm = (s) => String(s || "").normalize("NFC").replace(/\s+/g, "").toLowerCase();

  // 쪽의 위에서부터의 비율(0~1)로 바꾼 목적지 높이. 알 수 없으면 0(쪽 맨 위).
  async function destY(doc, page, dest) {
    const kind = dest[1] && dest[1].name;
    let top = null;
    if (kind === "XYZ") top = dest[3];
    else if (kind === "FitH" || kind === "FitBH") top = dest[2];
    else if (kind === "FitR") top = dest[5];
    if (top == null) return 0;
    const pg = await doc.getPage(page);
    const [, y0, , y1] = pg.view;
    return Math.min(Math.max((y1 - top) / (y1 - y0), 0), 1);
  }

  // 본문에서 제목 줄(본문보다 큰 글씨)을 찾아 위치를 돌려줌. (page, y) 이후만 찾음.
  async function findHeading(doc, title, page, y) {
    const want = norm(title);
    if (!want) return null;
    for (let p = page; p <= Math.min(doc.numPages, page + 12); p++) {
      const pg = await doc.getPage(p);
      const [, y0, , y1] = pg.view;
      const items = (await pg.getTextContent()).items.filter((it) => it.str && it.str.trim());
      const hs = items.map((it) => it.height || Math.abs(it.transform[3])).sort((a, b) => a - b);
      const body = hs[Math.floor(hs.length / 2)] || 10;
      const lines = new Map(); // 기준선 높이 → 그 줄의 글자 조각들
      for (const it of items) {
        const h = it.height || Math.abs(it.transform[3]);
        const key = Math.round(it.transform[5]);
        if (!lines.has(key)) lines.set(key, { base: it.transform[5], h, text: "" });
        const l = lines.get(key);
        l.text += it.str; l.h = Math.max(l.h, h);
      }
      // 제목 줄: 본문보다 조금이라도 큰 글씨로 제목을 담고 있거나, 줄이 제목으로 시작
      const isHeading = (l) => {
        const t = norm(l.text);
        return (l.h >= body * 1.05 && t.includes(want)) || t.startsWith(want);
      };
      const hits = [...lines.values()]
        .map((l) => ({ ...l, top: (y1 - (l.base + l.h)) / (y1 - y0) }))
        .filter((l) => isHeading(l) && (p > page || l.top > y + 0.005))
        .sort((a, b) => a.top - b.top);
      if (hits.length) return { page: p, y: Math.max(hits[0].top - 0.012, 0) };
    }
    return null;
  }

  // PDF 목차(북마크)를 [{title, page, y, level}] 로 펼칩니다. y 는 쪽 안에서의 위치(0~1).
  async function outline(doc) {
    const out = [];
    let items;
    try { items = await doc.getOutline(); } catch (e) { return out; }
    async function walk(list, level) {
      for (const it of list || []) {
        let page = null, y = 0;
        try {
          const dest = typeof it.dest === "string" ? await doc.getDestination(it.dest) : it.dest;
          if (dest && dest[0] != null) {
            page = (typeof dest[0] === "object" ? await doc.getPageIndex(dest[0]) : dest[0]) + 1;
            y = await destY(doc, page, dest);
          }
        } catch (e) {}
        out.push({ title: it.title, page, y, level });
        if (it.items && it.items.length) await walk(it.items, level + 1);
      }
    }
    await walk(items, 1);
    // 북마크가 앞 항목과 똑같은 곳을 가리키면(LaTeX 에서 흔한 실수) 본문에서 제목을 찾아 바로잡음
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1], b = out[i];
      if (b.page && a.page === b.page && Math.abs(a.y - b.y) < 1e-4) {
        try {
          const hit = await findHeading(doc, b.title, b.page, b.y);
          if (hit) { b.page = hit.page; b.y = hit.y; }
        } catch (e) {}
      }
    }
    return out;
  }

  window.PdfView = { loadLib, open, mount, outline };
})();
