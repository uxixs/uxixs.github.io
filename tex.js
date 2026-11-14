// =============================================================
//  글 속 수식: $...$ 사이를 LaTeX 로 보고 KaTeX 로 그립니다.
//  수식이 있는 화면에서만 KaTeX 를 불러옵니다.
//  글자 그대로의 달러 기호는 \$ 로 씁니다. (data.js 문자열 안에서는 \\$)
// =============================================================
(function () {
  const BASE = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/";
  let loading = null;

  function load() {
    if (window.katex) return Promise.resolve();
    if (!loading) {
      loading = new Promise((res, rej) => {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = BASE + "katex.min.css";
        document.head.appendChild(css);
        const s = document.createElement("script");
        s.src = BASE + "katex.min.js";
        s.onload = res;
        s.onerror = () => { loading = null; rej(new Error("katex load failed")); };
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  // 글 → HTML. 수식 부분은 나중에 run() 이 그릴 자리로 남겨 둡니다.
  function html(text, esc) {
    const parts = String(text ?? "").split(/(?<!\\)\$(.+?)(?<!\\)\$/);
    return parts.map((t, i) => i % 2
      ? `<span class="tex" data-tex="${esc(t)}">${esc(t)}</span>`
      : esc(t.replace(/\\\$/g, "$"))
    ).join("");
  }

  async function run(root) {
    const els = (root || document).querySelectorAll(".tex:not([data-done])");
    if (!els.length) return;
    try { await load(); } catch (e) { return; }
    els.forEach((el) => {
      try {
        window.katex.render(el.dataset.tex, el, { throwOnError: false });
        el.dataset.done = "1";
      } catch (e) {}
    });
  }

  window.Tex = { html, run };
})();
