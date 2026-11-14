(function () {
  const S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = S.links || {};

  // ---- theme toggle (remembered per browser) ----
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("theme").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  // ---- header / hero ----
  document.title = S.name ? `${S.name} · Portfolio` : "Portfolio";
  $("brand").textContent = S.name || "";
  $("name").textContent = S.name || "";
  $("role").textContent = S.role || "";
  $("bio").textContent = S.bio || "";
  const av = $("avatar");
  if (S.photo) av.style.backgroundImage = `url("${S.photo}")`;
  else av.textContent = (S.name || "?").trim().charAt(0);

  const heroLinks = [
    L.email && [`mailto:${L.email}`, "Email"],
    L.github && [L.github, "GitHub"],
    L.scholar && [L.scholar, "Google Scholar"],
    L.cv && [L.cv, "CV"],
  ].filter(Boolean);
  $("hero-links").innerHTML = heroLinks
    .map(([href, label]) => `<a class="chip" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`)
    .join("");

  const tagsHtml = (tags) => tags && tags.length
    ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : "";
  const linkBtn = (href, label, primary) => href
    ? `<a class="btn${primary ? " primary" : ""}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>` : "";

  // ---- papers (newest first) ----
  const papers = [...(S.papers || [])].sort((a, b) => (b.year || 0) - (a.year || 0));
  $("paper-count").textContent = papers.length ? `${papers.length}편` : "";
  $("paper-list").innerHTML = papers.length ? papers.map((p, i) => `
    <li class="paper">
      <p class="paper-title">${esc(p.title)}</p>
      <p class="paper-meta">${esc(p.authors)}${p.venue ? ` · <span class="venue">${esc(p.venue)}</span>` : ""}${p.year ? ` · ${esc(p.year)}` : ""}</p>
      <div class="actions">
        ${linkBtn(p.pdf, "PDF", true)}
        ${p.abstract ? `<button class="btn" data-abs="${i}">초록</button>` : ""}
        ${linkBtn(p.link, "Link")}
        ${linkBtn(p.code, "Code")}
      </div>
      ${p.abstract ? `<p class="abstract" id="abs-${i}">${esc(p.abstract)}</p>` : ""}
      ${tagsHtml(p.tags)}
    </li>`).join("") : `<li class="empty">아직 등록된 논문이 없습니다.</li>`;
  $("paper-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-abs]");
    if (b) $("abs-" + b.dataset.abs).classList.toggle("open");
  });

  // ---- projects with tag filter ----
  const projects = [...(S.projects || [])].sort((a, b) => (b.year || 0) - (a.year || 0));
  const allTags = [...new Set(projects.flatMap((p) => p.tags || []))];
  let active = "All";

  function renderProjects() {
    const list = active === "All" ? projects : projects.filter((p) => (p.tags || []).includes(active));
    $("project-grid").innerHTML = list.length ? list.map((p) => `
      <article class="card">
        <div class="thumb" ${p.image ? `style="background-image:url('${esc(p.image)}')"` : ""}>${p.image ? "" : esc((p.title || "?").charAt(0))}</div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          ${p.year ? `<span class="year">${esc(p.year)}</span>` : ""}
          <p>${esc(p.description)}</p>
          ${tagsHtml(p.tags)}
          <div class="actions">${linkBtn(p.demo, "Demo", true)}${linkBtn(p.code, "Code")}</div>
        </div>
      </article>`).join("") : `<p class="empty">아직 등록된 작업물이 없습니다.</p>`;
    $("filters").innerHTML = allTags.length > 1
      ? ["All", ...allTags].map((t) => `<button class="btn${t === active ? " active" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`).join("")
      : "";
  }
  $("filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]");
    if (b) { active = b.dataset.tag; renderProjects(); }
  });
  renderProjects();

  // ---- contact / footer ----
  $("contact-line").innerHTML = L.email
    ? `연락은 <a href="mailto:${esc(L.email)}">${esc(L.email)}</a> 로 주세요.`
    : "연락처를 data.js에 추가하세요.";
  $("foot").textContent = `© ${new Date().getFullYear()} ${S.name || ""}`;
})();
