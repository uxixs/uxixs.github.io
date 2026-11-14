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
  };

  const attrs = (h) => `href="${esc(h)}" target="_blank" rel="noopener"`;

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

  function renderFilters() {
    if (types.length < 2) { $("filters").hidden = true; return; }
    const opts = [["all", "All", works.length],
      ...types.map((t) => [t, label(t, true), works.filter((w) => w.type === t).length])];
    $("filters").innerHTML = opts.map(([k, text, n]) =>
      `<button type="button" data-f="${esc(k)}" aria-pressed="${k === filter}">${esc(text)}<span>${n}</span></button>`
    ).join("");
  }

  function actionsOf(w) {
    const paper = w.type === "paper";
    return [
      w.file && [w.file, paper ? "PDF" : "File"],
      w.link && [w.link, paper ? "Link" : "Demo"],
      w.code && [w.code, "Code"],
    ].filter(Boolean);
  }

  function item(w) {
    const acts = actionsOf(w);
    const primary = acts[0];
    const tags = (Array.isArray(w.tags) ? w.tags : []).filter(Boolean);
    const icon = ICON[w.type] || ICON.other;
    const title = esc(w.title || "Untitled");
    const thumbTag = primary ? `a ${attrs(primary[0])} tabindex="-1" aria-hidden="true"` : "div";
    return `<article class="work${w.image ? " has-image" : ""}" data-type="${esc(w.type || "")}">
      <div class="body">
        <p class="kind"><span class="glyph">${icon}</span>${esc(label(w.type))}${w.venue ? `<span class="venue">${esc(w.venue)}</span>` : ""}</p>
        <h3>${primary ? `<a ${attrs(primary[0])}>${title}</a>` : title}</h3>
        ${w.description ? `<p class="desc">${esc(w.description)}</p>` : ""}
        ${acts.length || tags.length ? `<div class="meta">
          ${acts.length ? `<div class="actions">${acts.map(([h, l], i) =>
            `<a class="btn${i === 0 ? " primary" : ""}" ${attrs(h)}>${l}${ICON.arrow}</a>`).join("")}</div>` : ""}
          ${tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        </div>` : ""}
      </div>
      ${w.image ? `<${thumbTag} class="thumb"><img src="${esc(w.image)}" alt="" loading="lazy"></${primary ? "a" : "div"}>` : ""}
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
        <div class="items">${g.items.map(item).join("")}</div>
      </section>`).join("");
  }

  $("filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b || b.dataset.f === filter) return;
    filter = b.dataset.f;
    renderFilters(); renderWorks();
  });

  renderFilters();
  renderWorks();
})();
