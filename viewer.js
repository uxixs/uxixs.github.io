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

    return {
      pages: doc.numPages,
      scrollTo(n, smooth) {
        const b = boxes[n - 1];
        if (b) b.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" });
      },
      destroy() {
        alive = false;
        near.disconnect();
        if (tracker) tracker.disconnect();
      },
    };
  }

  // PDF 목차(북마크)를 [{title, page, level}] 로 펼칩니다.
  async function outline(doc) {
    const out = [];
    let items;
    try { items = await doc.getOutline(); } catch (e) { return out; }
    async function walk(list, level) {
      for (const it of list || []) {
        let page = null;
        try {
          const dest = typeof it.dest === "string" ? await doc.getDestination(it.dest) : it.dest;
          if (dest && dest[0]) page = (typeof dest[0] === "object" ? await doc.getPageIndex(dest[0]) : dest[0]) + 1;
        } catch (e) {}
        out.push({ title: it.title, page, level });
        if (it.items && it.items.length) await walk(it.items, level + 1);
      }
    }
    await walk(items, 1);
    return out;
  }

  window.PdfView = { loadLib, open, mount, outline };
})();
