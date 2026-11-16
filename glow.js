// =============================================================
//  메인 화면 배경: 촘촘한 점 격자 + 커서를 따라오는 빛과 볼록한 "언덕"
//  - 커서 아래 표면이 둥글게 솟아오른 것처럼 보이게 함
//      · 솟은 곳의 점은 가까워진 것처럼 커지고 간격이 벌어짐 (원근)
//      · 빛은 왼쪽 위에서 비춤 → 빛을 받는 쪽은 밝고, 반대쪽은 어둡고, 아래로 그림자가 짐
//      · 점 하나하나도 작은 구슬처럼 밝은 면이 있음
//  - 언덕은 스프링으로, 빛은 조금 더 느리게 따라와서 미끄러지듯 움직임
//  - 커서가 작업 목록 위에 있으면 배경 효과는 부드럽게 잦아들어 글을 방해하지 않음
//  - 목록의 글 하나하나는 커서 쪽으로 자석처럼 살짝 끌려옴 (transform 만 사용 → 배치는 그대로)
//  - 마우스가 있는 PC 에서만. 터치 기기, "동작 줄이기" 설정에서는 켜지지 않음
//  - 움직임이 멈추면 그리기도 멈춤 (배터리·성능)
// =============================================================
(function () {
  const mm = (q) => (window.matchMedia ? matchMedia(q) : { matches: false });
  if (!mm("(hover: hover) and (pointer: fine)").matches) return;
  if (mm("(prefers-reduced-motion: reduce)").matches) return;

  const GAP = 14;          // 점 간격(px)
  const DOT = 0.8;         // 기본 점 반지름
  const R = 220;           // 언덕이 영향을 주는 반경 (이 밖은 평평)
  const SIGMA = 80;        // 언덕의 너비
  const MAG = 0.24;        // 원근: 솟은 곳이 확대되는 정도
  const GROW = 1.9;        // 꼭대기 점이 커지는 정도 (반지름 배수에 더해짐)
  const LIFT = 5;          // 솟은 점이 위로 떠 보이는 거리(px)
  const SHADOW = 7;        // 그림자가 떨어지는 거리(px)
  const GLOW = 360;        // 빛 반경
  const LX = -0.64, LY = -0.77; // 빛이 오는 방향 (왼쪽 위)
  const STIFF = 170, DAMP = 20; // 언덕 스프링 (세기, 감쇠) — 살짝 지나쳤다 돌아옴
  const GLOW_FOLLOW = 0.075;    // 빛이 따라오는 속도 (작을수록 늦게)
  const DIM = 0.3;         // 커서가 작업 목록 위에 있을 때 배경 효과 세기 (1 = 그대로)
  const PULL_X = 7, PULL_Y = 5; // 글이 커서 쪽으로 끌려오는 최대 거리(px)
  const PULL_RANGE = 190;  // 이 거리 안에 있는 글만 끌려옴 (멀수록 약하게)
  const PULL_EASE = 0.13;  // 끌려오는 속도 (작을수록 느긋하게)
  const STEPS = 16;        // 점 색 단계 수 (평소 색 → 강조색)

  const cv = document.createElement("canvas");
  cv.className = "glow-bg";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  const mk = () => document.createElement("canvas");
  const base = mk(), bctx = base.getContext("2d");   // 평소 점 격자 (한 번만 그려 둠)
  const atlas = mk(), actx = atlas.getContext("2d"); // 점 도장: 색 단계별 구슬 + 그림자
  const glow = mk(), gctx = glow.getContext("2d");   // 빛 도장

  let W = 0, H = 0, dpr = 1, col = null;
  let CELL = 16, SR = 6;      // 도장 한 칸 크기, 도장 속 점 반지름 (기기 픽셀)
  const pos = { x: -9999, y: -9999 }, vel = { x: 0, y: 0 }; // 언덕 위치·속도
  const gl = { x: -9999, y: -9999 };                         // 빛 위치
  const tgt = { x: -9999, y: -9999 };                        // 실제 커서
  let lv = 0, want = 0;    // 전체 효과 세기 (창 밖으로 나가면 0 으로 사라짐)
  let dim = 1, dimWant = 1;   // 작업 목록 위에서는 DIM 까지 줄어듦
  let held = false;           // 마우스 버튼을 누른 채(글자 선택 등) 움직이는 중
  let raf = 0, last = 0, seen = false;
  let dirty = null;           // 지난번에 그린 영역 (다음에 이만큼만 지우고 다시 그림)

  // 한 프레임에 다시 그리는 점들 (매번 새로 만들지 않도록 미리 잡아 둠)
  const SIDE = Math.ceil((R * 2) / GAP) + 3, MAXN = SIDE * SIDE;
  const bx = new Float32Array(MAXN), by = new Float32Array(MAXN);
  const br = new Float32Array(MAXN), ba = new Float32Array(MAXN);
  const bc = new Uint8Array(MAXN);

  function rgb(v) {
    v = v.trim();
    if (v[0] === "#") {
      const h = v.length === 4 ? v.slice(1).split("").map((c) => c + c).join("") : v.slice(1, 7);
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }
    const m = v.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const css = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const dark = mm("(prefers-color-scheme: dark)").matches;
    col = {
      dark,
      accent: rgb(cs.getPropertyValue("--accent") || "#3b4eff"),
      dot: rgb(cs.getPropertyValue("--text-3") || "#8b8c93"),
      baseA: dark ? 0.22 : 0.3,    // 평소 점 진하기
      peakA: dark ? 0.95 : 0.9,    // 꼭대기 점 진하기
      glowA: dark ? 0.2 : 0.16,    // 빛 진하기
      shadowA: dark ? 0.55 : 0.2,  // 그림자 진하기
    };
  }

  // 점 도장 만들기: 0번 칸 = 평소 점, 뒤로 갈수록 강조색 구슬. 마지막 칸 = 그림자
  function buildSprites() {
    SR = Math.max(3, Math.round(3 * dpr)); CELL = SR * 2 + 4;
    atlas.width = CELL * (STEPS + 1); atlas.height = CELL;
    const white = [255, 255, 255], deep = col.dark ? [10, 12, 40] : [18, 24, 110];
    for (let i = 0; i < STEPS; i++) {
      const k = i / (STEPS - 1), cx = i * CELL + CELL / 2, cy = CELL / 2;
      const c = mix(col.dot, col.accent, Math.min(1, k * 1.35));
      // 밝은 면은 빛 쪽(왼쪽 위)에, 반대쪽 가장자리는 살짝 어둡게
      const g = actx.createRadialGradient(cx + LX * SR * 0.45, cy + LY * SR * 0.45, 0, cx, cy, SR);
      g.addColorStop(0, css(mix(c, white, (col.dark ? 0.75 : 0.6) * k), 1));
      g.addColorStop(0.55, css(c, 1));
      g.addColorStop(1, css(mix(c, deep, 0.3 * k), 1));
      actx.fillStyle = g;
      actx.beginPath(); actx.arc(cx, cy, SR, 0, 6.2832); actx.fill();
    }
    const sx = STEPS * CELL + CELL / 2, sc = col.dark ? [0, 0, 0] : [22, 28, 90];
    const s = actx.createRadialGradient(sx, CELL / 2, 0, sx, CELL / 2, CELL / 2);
    s.addColorStop(0, css(sc, 1)); s.addColorStop(0.45, css(sc, 0.55)); s.addColorStop(1, css(sc, 0));
    actx.fillStyle = s; actx.fillRect(STEPS * CELL, 0, CELL, CELL);

    // 빛 도장 (작게 만들어 두고 늘려서 찍음)
    const G = 256; glow.width = glow.height = G;
    const gg = gctx.createRadialGradient(G / 2, G / 2, 0, G / 2, G / 2, G / 2);
    gg.addColorStop(0, css(col.accent, 1)); gg.addColorStop(0.18, css(col.accent, 0.72));
    gg.addColorStop(0.42, css(col.accent, 0.3)); gg.addColorStop(0.72, css(col.accent, 0.07));
    gg.addColorStop(1, css(col.accent, 0));
    gctx.fillStyle = gg; gctx.fillRect(0, 0, G, G);
  }

  // 화면 바깥쪽으로 갈수록 점이 옅어지게 (가장자리가 덜 답답하도록)
  let fcx = 0, fcy = 0, fr0 = 0, fk = 0;
  function fade(x, y) {
    const dx = x - fcx, dy = y - fcy, t = (Math.sqrt(dx * dx + dy * dy) - fr0) * fk;
    return t <= 0 ? 1 : t >= 1 ? 0 : 1 - t;
  }

  // 도장 찍기: i 번 칸을 (x, y) 에 반지름 r 로
  function stamp(c, i, x, y, r) {
    const s = (r / SR) * CELL;
    c.drawImage(atlas, i * CELL, 0, CELL, CELL, x - s / 2, y - s / 2, s, s);
  }

  function drawBase() {
    base.width = cv.width; base.height = cv.height;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.imageSmoothingQuality = "high";
    for (let y = GAP / 2; y < H + GAP; y += GAP)
      for (let x = GAP / 2; x < W + GAP; x += GAP) {
        const a = col.baseA * fade(x, y);
        if (a < 0.004) continue;
        bctx.globalAlpha = a; stamp(bctx, 0, x, y, DOT);
      }
    bctx.globalAlpha = 1;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    fcx = W / 2; fcy = H * 0.35; fr0 = Math.min(W, H) * 0.2;
    fk = 1 / (Math.max(W, H) * 0.85 - fr0);
    rebuild();
  }
  function rebuild() {
    colors(); buildSprites(); drawBase();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    dirty = null; paint();
  }

  // 지난번에 그린 영역을 평소 상태로 되돌림
  function restore() {
    if (!dirty) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(dirty.x, dirty.y, dirty.w, dirty.h);
    ctx.drawImage(base, dirty.x, dirty.y, dirty.w, dirty.h, dirty.x, dirty.y, dirty.w, dirty.h);
    dirty = null;
  }

  function paint() {
    restore();
    const level = lv * dim;   // 실제로 그릴 세기
    if (level < 0.005) return;
    const x = pos.x, y = pos.y;

    // 다시 그릴 격자 칸 범위 (칸 경계는 점과 점 사이라서 점이 잘리지 않음)
    const i0 = Math.floor((x - R) / GAP), i1 = Math.ceil((x + R) / GAP);
    const j0 = Math.floor((y - R) / GAP), j1 = Math.ceil((y + R) / GAP);
    const cx0 = i0 * GAP, cy0 = j0 * GAP, cx1 = i1 * GAP, cy1 = j1 * GAP;

    // 이번에 건드리는 영역 (빛 + 격자 칸) 을 기억해 둠
    const ax = Math.max(0, Math.floor((Math.min(gl.x - GLOW, cx0) - 2) * dpr));
    const ay = Math.max(0, Math.floor((Math.min(gl.y - GLOW, cy0) - 2) * dpr));
    const axe = Math.min(cv.width, Math.ceil((Math.max(gl.x + GLOW, cx1) + 2) * dpr));
    const aye = Math.min(cv.height, Math.ceil((Math.max(gl.y + GLOW, cy1) + 2) * dpr));
    if (axe <= ax || aye <= ay) return;
    dirty = { x: ax, y: ay, w: axe - ax, h: aye - ay };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(cx0, cy0, cx1 - cx0, cy1 - cy0); // 이 칸들의 평소 점은 지우고 아래에서 새로 그림

    // 1) 빛
    ctx.globalAlpha = col.glowA * level;
    ctx.drawImage(glow, gl.x - GLOW, gl.y - GLOW, GLOW * 2, GLOW * 2);

    // 2) 점 위치·크기·밝기 계산 + 그림자 먼저 찍기
    const s2 = 2 * SIGMA * SIGMA, R2 = R * R, shade = 1.65 / SIGMA;
    const { baseA, peakA, shadowA } = col;
    let n = 0;
    for (let j = j0; j < j1; j++) {
      const gy = (j + 0.5) * GAP, dy = gy - y;
      if (gy < -GAP || gy > H + GAP) continue;
      for (let i = i0; i < i1; i++) {
        const gx = (i + 0.5) * GAP, dx = gx - x;
        if (gx < -GAP || gx > W + GAP) continue;
        const f = fade(gx, gy);
        const d2 = dx * dx + dy * dy;
        let h = 0;                                  // 높이: 0(평평) ~ 1(꼭대기)
        if (d2 < R2) { const w = 1 - d2 / R2; h = Math.exp(-d2 / s2) * w * w * level; }
        // 경사면이 빛을 얼마나 마주보는지: +1(빛 쪽) ~ -1(반대쪽)
        let s = (dx * LX + dy * LY) * shade * h;
        s = s > 1 ? 1 : s < -1 ? -1 : s;
        const m = MAG * h;                          // 높을수록 가까워 보임 → 바깥으로 벌어짐
        const px = gx + dx * m, py = gy + dy * m - LIFT * h;
        const r = DOT * (1 + GROW * h) * (1 + 0.12 * s);
        let k = h * 1.15 * (1 + 0.45 * s); k = k > 1 ? 1 : k;
        let a = (baseA + (peakA - baseA) * (h > 0.9 ? 1 : h * 1.11)) * (1 + 0.42 * s);
        a = (a > 1 ? 1 : a) * f;
        if (a < 0.004) continue;
        if (h > 0.06) {
          ctx.globalAlpha = shadowA * h * f;
          stamp(ctx, STEPS, px - LX * SHADOW * h, py - LY * SHADOW * h, r * 1.9);
        }
        bx[n] = px; by[n] = py; br[n] = r; ba[n] = a; bc[n] = (k * (STEPS - 1) + 0.5) | 0; n++;
      }
    }
    // 3) 점
    for (let q = 0; q < n; q++) { ctx.globalAlpha = ba[q]; stamp(ctx, bc[q], bx[q], by[q], br[q]); }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    // 언덕: 스프링 (프레임 간격이 길어도 안정적이도록 잘게 나눠 계산)
    const sub = Math.max(1, Math.ceil(dt / 8)), h = dt / sub / 1000;
    for (let i = 0; i < sub; i++) {
      vel.x += ((tgt.x - pos.x) * STIFF - vel.x * DAMP) * h;
      vel.y += ((tgt.y - pos.y) * STIFF - vel.y * DAMP) * h;
      pos.x += vel.x * h; pos.y += vel.y * h;
    }
    // 빛: 더 느리게 뒤따라옴
    const a = 1 - Math.pow(1 - GLOW_FOLLOW, dt / 16.67);
    gl.x += (tgt.x - gl.x) * a; gl.y += (tgt.y - gl.y) * a;
    lv += (want - lv) * (1 - Math.pow(1 - 0.085, dt / 16.67));
    dim += (dimWant - dim) * (1 - Math.pow(1 - 0.07, dt / 16.67));
    paint();
    const pulling = pull(dt);
    const moving = Math.abs(tgt.x - pos.x) > 0.15 || Math.abs(tgt.y - pos.y) > 0.15
      || Math.abs(vel.x) > 4 || Math.abs(vel.y) > 4
      || Math.abs(tgt.x - gl.x) > 0.4 || Math.abs(tgt.y - gl.y) > 0.4
      || Math.abs(want - lv) > 0.004 || Math.abs(dimWant - dim) > 0.004 || pulling;
    if (moving) start();
    else { last = 0; vel.x = vel.y = 0; dim = dimWant; if (want === 0) lv = 0; paint(); }
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }

  const viewer = document.getElementById("viewer");
  const blocked = () => viewer && !viewer.hidden; // PDF 팝업이 열려 있으면 쉬기

  // ---------- 작업 목록: 커서 쪽으로 끌려오는 글 ----------
  const works = document.getElementById("works");
  const pulled = new Map();   // 글(article) → 지금 옮겨져 있는 거리 {x, y}
  const over = (el) => { dimWant = el && el.closest && el.closest("#works") ? DIM : 1; };

  // 한 프레임만큼 글들을 움직임. 아직 움직이는 글이 있으면 true
  function pull(dt) {
    if (!works) return false;
    const on = want === 1 && !held && !blocked();
    const ease = 1 - Math.pow(1 - PULL_EASE, dt / 16.67);
    // 목록은 필터를 누를 때마다 새로 그려지므로 매번 다시 찾음 (끌어당길 때만)
    const list = on ? works.querySelectorAll(".work") : pulled.keys();
    const jobs = [];
    for (const el of list) {
      let p = pulled.get(el);
      if (!el.isConnected) { pulled.delete(el); continue; }
      let tx = 0, ty = 0;
      if (on) {
        const b = el.getBoundingClientRect();
        if (b.bottom < -PULL_RANGE || b.top > H + PULL_RANGE) { if (!p) continue; }
        else {
          // 옮기기 전 원래 자리 기준으로 계산
          const l = b.left - (p ? p.x : 0), t = b.top - (p ? p.y : 0);
          const ox = tgt.x - (l + b.width / 2), oy = tgt.y - (t + b.height / 2);
          const gx = Math.max(0, Math.abs(ox) - b.width / 2), gy = Math.max(0, Math.abs(oy) - b.height / 2);
          const far = Math.sqrt(gx * gx + gy * gy);           // 커서와 글 사이 거리 (글 위면 0)
          if (far < PULL_RANGE) {
            const f = 1 - far / PULL_RANGE, nx = ox / (b.width / 2), ny = oy / (b.height / 2);
            tx = PULL_X * f * f * (nx > 1 ? 1 : nx < -1 ? -1 : nx);
            ty = PULL_Y * f * f * (ny > 1 ? 1 : ny < -1 ? -1 : ny);
          }
        }
      }
      if (!p) { if (!tx && !ty) continue; p = { x: 0, y: 0 }; pulled.set(el, p); }
      jobs.push(el, p, tx, ty);
    }
    // 위치를 다 읽은 뒤에 한꺼번에 옮김
    let busy = false;
    for (let i = 0; i < jobs.length; i += 4) {
      const el = jobs[i], p = jobs[i + 1], tx = jobs[i + 2], ty = jobs[i + 3];
      p.x += (tx - p.x) * ease; p.y += (ty - p.y) * ease;
      if (Math.abs(tx - p.x) < 0.04 && Math.abs(ty - p.y) < 0.04) {
        if (!tx && !ty) { el.style.transform = ""; pulled.delete(el); continue; } // 제자리로 돌아오면 흔적을 지움
        // 멈출 때는 화면 픽셀에 맞춰 글자가 흐려지지 않게
        p.x = Math.round(tx * dpr) / dpr; p.y = Math.round(ty * dpr) / dpr;
      } else busy = true;
      el.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0)`;
    }
    return busy;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (blocked()) return;
    tgt.x = e.clientX; tgt.y = e.clientY;
    held = e.buttons !== 0;
    over(e.target);
    if (!seen || lv < 0.02) {               // 처음(또는 사라진 뒤)엔 그 자리에서 피어나게
      seen = true; pos.x = gl.x = tgt.x; pos.y = gl.y = tgt.y; vel.x = vel.y = 0;
    }
    want = 1; start();
  }, { passive: true });
  window.addEventListener("pointerup", () => { if (held) { held = false; start(); } }, { passive: true });
  // 스크롤하면 커서 아래 내용이 바뀌므로 다시 확인
  window.addEventListener("scroll", () => {
    if (want !== 1 || blocked()) return;
    over(document.elementFromPoint(tgt.x, tgt.y)); start();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { want = 0; dimWant = 1; start(); });
  window.addEventListener("blur", () => { want = 0; start(); });
  if (viewer) new MutationObserver(() => { if (blocked()) { want = 0; start(); } })
    .observe(viewer, { attributes: true, attributeFilter: ["hidden"] });

  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  const scheme = mm("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) scheme.addEventListener("change", rebuild);

  resize();
})();
