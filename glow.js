// =============================================================
//  메인 화면 배경: 커서를 부드럽게 따라오는 빛 + 점 격자
//  - 커서 근처 점들이 밝아지고 커지며 바깥으로 살짝 밀려나 볼록 렌즈처럼 입체적으로 보임
//  - 마우스가 있는 PC 에서만. 터치 기기, "동작 줄이기" 설정에서는 켜지지 않음
//  - 움직임이 멈추면 그리기도 멈춤 (배터리·성능)
// =============================================================
(function () {
  const mm = (q) => (window.matchMedia ? matchMedia(q) : { matches: false });
  if (!mm("(hover: hover) and (pointer: fine)").matches) return;
  if (mm("(prefers-reduced-motion: reduce)").matches) return;

  const GAP = 24;        // 점 간격(px)
  const DOT = 1;         // 기본 점 반지름
  const R = 230;         // 커서 영향 반경
  const SIGMA = 105;     // 영향이 줄어드는 정도
  const PUSH = 11;       // 점이 바깥으로 밀려나는 최대 거리 (볼록함)
  const GROW = 1.5;      // 커서 바로 아래 점이 커지는 정도
  const GLOW = 360;      // 빛 반경
  const FOLLOW = 0.13;   // 커서를 따라가는 속도 (작을수록 더 늦게 미끄러지듯)

  const cv = document.createElement("canvas");
  cv.className = "glow-bg";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  const base = document.createElement("canvas"); // 바탕 점 격자 (한 번만 그려 둠)
  const bctx = base.getContext("2d");

  let W = 0, H = 0, dpr = 1, col = null;
  const pos = { x: -9999, y: -9999 }, tgt = { x: -9999, y: -9999 };
  let level = 0, want = 0;   // 전체 효과 세기 (창 밖으로 나가면 0 으로 사라짐)
  let raf = 0, last = 0, seen = false;

  function rgb(v) {
    v = v.trim();
    if (v[0] === "#") {
      const h = v.length === 4 ? v.slice(1).split("").map((c) => c + c).join("") : v.slice(1, 7);
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }
    const m = v.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
  }
  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const dark = mm("(prefers-color-scheme: dark)").matches;
    col = {
      accent: rgb(cs.getPropertyValue("--accent") || "#3b4eff"),
      dot: rgb(cs.getPropertyValue("--text-3") || "#8b8c93"),
      baseA: dark ? 0.16 : 0.2,   // 평소 점 진하기
      glowA: dark ? 0.16 : 0.1,   // 빛 진하기
    };
  }

  function drawBase() {
    base.width = cv.width; base.height = cv.height;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.fillStyle = `rgba(${col.dot.join(",")},${col.baseA})`;
    bctx.beginPath();
    for (let y = GAP / 2; y < H + GAP; y += GAP)
      for (let x = GAP / 2; x < W + GAP; x += GAP) { bctx.moveTo(x + DOT, y); bctx.arc(x, y, DOT, 0, 6.2832); }
    bctx.fill();
    // 바깥쪽으로 갈수록 점이 옅어지게 (가장자리가 덜 답답하도록)
    const g = bctx.createRadialGradient(W / 2, H * 0.35, Math.min(W, H) * 0.2, W / 2, H * 0.35, Math.max(W, H) * 0.85);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
    bctx.globalCompositeOperation = "destination-out";
    bctx.fillStyle = g; bctx.fillRect(0, 0, W, H);
    bctx.globalCompositeOperation = "source-over";
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    colors(); drawBase(); paint();
  }

  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    if (level < 0.005) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { x, y } = pos, [ar, ag, ab] = col.accent, [dr, dg, db] = col.dot;

    // 1) 빛
    const g = ctx.createRadialGradient(x, y, 0, x, y, GLOW);
    g.addColorStop(0, `rgba(${ar},${ag},${ab},${col.glowA * level})`);
    g.addColorStop(0.45, `rgba(${ar},${ag},${ab},${col.glowA * 0.35 * level})`);
    g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - GLOW, y - GLOW, GLOW * 2, GLOW * 2);

    // 2) 커서 근처의 바탕 점을 지우고, 그 자리에 움직인 점을 다시 그림
    const e = ctx.createRadialGradient(x, y, 0, x, y, R);
    e.addColorStop(0, `rgba(0,0,0,${level})`);
    e.addColorStop(0.75, `rgba(0,0,0,${level * 0.6})`);
    e.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = e; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.globalCompositeOperation = "source-over";

    const s2 = 2 * SIGMA * SIGMA;
    const x0 = Math.floor((x - R - GAP / 2) / GAP) * GAP + GAP / 2;
    const y0 = Math.floor((y - R - GAP / 2) / GAP) * GAP + GAP / 2;
    for (let gy = y0; gy <= y + R; gy += GAP) {
      for (let gx = x0; gx <= x + R; gx += GAP) {
        const dx = gx - x, dy = gy - y, d2 = dx * dx + dy * dy;
        if (d2 > R * R) continue;
        const d = Math.sqrt(d2) || 1;
        const t = Math.exp(-d2 / s2) * level;            // 0(멀리) ~ 1(커서 바로 아래)
        const push = PUSH * t * Math.min(1, d / 40);     // 중심은 덜 밀어서 가운데가 비지 않게
        const px = gx + (dx / d) * push, py = gy + (dy / d) * push;
        const r = DOT + GROW * t;
        // 가까울수록 강조색, 멀수록 평소 점 색
        const k = Math.min(1, t * 1.25);
        const cr = Math.round(dr + (ar - dr) * k), cg = Math.round(dg + (ag - dg) * k), cb = Math.round(db + (ab - db) * k);
        const a = col.baseA + (0.62 - col.baseA) * t;
        // 입체감: 아래쪽에 옅은 그림자, 위쪽에 밝은 점
        if (t > 0.18) {
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${a * 0.22})`;
          ctx.beginPath(); ctx.arc(px + 0.6 * t, py + 1.4 * t, r * 1.35, 0, 6.2832); ctx.fill();
        }
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
        ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
      }
    }
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    const a = 1 - Math.pow(1 - FOLLOW, dt / 16.67);
    pos.x += (tgt.x - pos.x) * a; pos.y += (tgt.y - pos.y) * a;
    level += (want - level) * (1 - Math.pow(1 - 0.08, dt / 16.67));
    paint();
    const moving = Math.abs(tgt.x - pos.x) > 0.3 || Math.abs(tgt.y - pos.y) > 0.3 || Math.abs(want - level) > 0.004;
    if (moving) start(); else { last = 0; if (want === 0) { level = 0; paint(); } }
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }

  const viewer = document.getElementById("viewer");
  const blocked = () => viewer && !viewer.hidden; // PDF 팝업이 열려 있으면 쉬기

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (blocked()) return;
    tgt.x = e.clientX; tgt.y = e.clientY;
    if (!seen) { seen = true; pos.x = tgt.x; pos.y = tgt.y; } // 처음엔 그 자리에서 피어나게
    want = 1; start();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { want = 0; start(); });
  window.addEventListener("blur", () => { want = 0; start(); });
  if (viewer) new MutationObserver(() => { if (blocked()) { want = 0; start(); } })
    .observe(viewer, { attributes: true, attributeFilter: ["hidden"] });

  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  const scheme = mm("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) scheme.addEventListener("change", () => { colors(); drawBase(); paint(); });

  resize();
})();
