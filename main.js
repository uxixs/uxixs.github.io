(function () {
  const S = window.SITE || {};
  const L = S.links || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const a = (href, label) => `<a href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
  const byYear = (list) => [...(list || [])].sort((x, y) => (y.year || 0) - (x.year || 0));

  // ---- profile ----
  document.title = S.name || "Portfolio";
  $("name").textContent = S.name || "";
  $("role").textContent = S.role || "";
  $("bio").textContent = S.bio || "";
  const av = $("avatar");
  if (S.photo) av.style.backgroundImage = `url("${S.photo}")`;
  else av.textContent = (S.name || "?").trim().charAt(0);

  const links = [
    L.email && ["Email", `mailto:${L.email}`, L.email],
    L.github && ["GitHub", L.github, L.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")],
    L.scholar && ["Scholar", L.scholar, "Google Scholar"],
    L.cv && ["CV", L.cv, "PDF"],
  ].filter(Boolean);
  $("links").innerHTML = links
    .map(([k, href, label]) => `<li><span class="k">${k}</span>${a(href, esc(label))}</li>`)
    .join("");

  // ---- publications ----
  const papers = byYear(S.papers);
  $("paper-list").innerHTML = papers.length ? papers.map((p, i) => {
    const btns = [
      p.pdf && a(p.pdf, "PDF"),
      p.abstract && `<button data-abs="${i}">Abstract</button>`,
      p.link && a(p.link, "Link"),
      p.code && a(p.code, "Code"),
    ].filter(Boolean).join("");
    return `<li>
      <div class="pub-title">${esc(p.title)}</div>
      <div class="pub-meta">${esc(p.authors)}${p.venue ? `. <em>${esc(p.venue)}</em>` : ""}${p.year ? `, ${esc(p.year)}` : ""}.</div>
      ${btns ? `<div class="pub-links">${btns}</div>` : ""}
      ${p.abstract ? `<p class="abstract" id="abs-${i}">${esc(p.abstract)}</p>` : ""}
    </li>`;
  }).join("") : `<li class="empty">준비 중입니다.</li>`;
  $("paper-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-abs]");
    if (b) $("abs-" + b.dataset.abs).classList.toggle("open");
  });

  // ---- projects ----
  const projects = byYear(S.projects);
  $("project-list").innerHTML = projects.length ? projects.map((p) => {
    const btns = [p.demo && a(p.demo, "Demo"), p.code && a(p.code, "Code")].filter(Boolean).join("");
    return `<li>
      ${p.image ? `<div class="thumb" style="background-image:url('${esc(p.image)}')"></div>` : ""}
      <div>
        <span class="proj-title">${esc(p.title)}</span>${p.year ? `<span class="proj-year">${esc(p.year)}</span>` : ""}
        <p class="proj-desc">${esc(p.description)}</p>
        ${btns ? `<div class="pub-links">${btns}</div>` : ""}
      </div>
    </li>`;
  }).join("") : `<li class="empty">준비 중입니다.</li>`;

  $("foot").textContent = `© ${new Date().getFullYear()} ${S.name || ""}`;
})();
