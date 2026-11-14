(function () {
  const S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE_LABEL = { paper: "Paper", project: "Project" };
  const hasKorean = (s) => /[가-힣]/.test(s || "");

  const works = [...(S.works || [])].sort((a, b) => (b.year || 0) - (a.year || 0));
  const types = [...new Set(works.map((w) => w.type).filter(Boolean))];
  let filter = "all";

  document.title = S.title || "Works";
  $("title").textContent = S.title || "Works";
  $("subtitle").textContent = S.subtitle || "";
  $("foot").textContent = `© ${new Date().getFullYear()} ${S.title || ""}`;

  function renderFilters() {
    const opts = [["all", "All"], ...types.map((t) => [t, (TYPE_LABEL[t] || t) + "s"])];
    $("filters").innerHTML = types.length > 1
      ? opts.map(([k, label]) => `<button data-f="${esc(k)}" class="${k === filter ? "active" : ""}">${esc(label)}</button>`).join("")
      : "";
  }

  function renderWorks() {
    const list = filter === "all" ? works : works.filter((w) => w.type === filter);
    $("count").textContent = `${list.length} ${list.length === 1 ? "item" : "items"}`;
    if (!list.length) { $("works").innerHTML = `<li class="empty">Nothing here yet.</li>`; return; }

    $("works").innerHTML = list.map((w, i) => {
      const no = String(list.length - i).padStart(2, "0");
      const links = [
        w.file && [w.file, w.type === "paper" ? "PDF" : "File"],
        w.link && [w.link, "Open"],
        w.code && [w.code, "Code"],
      ].filter(Boolean);
      return `<li>
        <button class="row" aria-expanded="false">
          <span class="no">${no}</span>
          <span class="ttl${hasKorean(w.title) ? " ko" : ""}">${esc(w.title)}</span>
          <span class="type ${esc(w.type)}">${esc(TYPE_LABEL[w.type] || w.type || "")}</span>
          <span class="yr">${esc(w.year || "")}</span>
        </button>
        <div class="detail">
          <div class="body">
            ${w.description ? `<p>${esc(w.description)}</p>` : ""}
            ${w.tags && w.tags.length ? `<div class="tags">${w.tags.map((t) => "#" + esc(t)).join("  ")}</div>` : ""}
            ${links.length ? `<div class="actions">${links.map(([h, l]) => `<a href="${esc(h)}" target="_blank" rel="noopener">${l}</a>`).join("")}</div>` : ""}
          </div>
          ${w.image ? `<div class="img" style="background-image:url('${esc(w.image)}')"></div>` : ""}
        </div>
      </li>`;
    }).join("");
  }

  $("filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    renderFilters(); renderWorks();
  });
  $("works").addEventListener("click", (e) => {
    const row = e.target.closest(".row");
    if (!row) return;
    const li = row.parentElement;
    const open = li.classList.toggle("open");
    row.setAttribute("aria-expanded", open);
  });

  renderFilters();
  renderWorks();
})();
