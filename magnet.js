// =============================================================
//  메인 화면 작업 카드: 커서 쪽으로 살짝 끌려오는 효과
//  - 마우스가 있는 PC 에서만. 터치 기기, "동작 줄이기" 설정에서는 켜지지 않음
//  - transform 만 바꿔서 레이아웃은 밀리지 않음. 움직임이 멈추면 계산도 멈춤
//  - 마우스 버튼을 누르고 있는 동안(글자 선택)·PDF 팝업이 열린 동안에는 제자리
// =============================================================
(function () {
  const mm = (q) => (window.matchMedia ? matchMedia(q) : { matches: false });
  if (!mm("(hover: hover) and (pointer: fine)").matches) return;
  if (mm("(prefers-reduced-motion: reduce)").matches) return;

  const PULL_X = 7, PULL_Y = 5; // 카드가 커서 쪽으로 끌려오는 최대 거리(px)
  const PULL_RANGE = 190;       // 이 거리 안에 있는 카드만 끌려옴 (멀수록 약하게)
  const PULL_EASE = 0.13;       // 끌려오는 속도 (작을수록 느긋하게)

  const works = document.getElementById("works");
  const viewer = document.getElementById("viewer");
  if (!works) return;
  const blocked = () => viewer && !viewer.hidden;

  const pulled = new Map();     // 카드 → 지금 옮겨져 있는 거리 {x, y}
  const tgt = { x: -1e4, y: -1e4 };
  let active = false, held = false, raf = 0, last = 0;

  // 한 프레임만큼 카드를 움직임. 아직 움직이는 카드가 있으면 true
  function pull(dt) {
    const on = active && !held && !blocked();
    const ease = 1 - Math.pow(1 - PULL_EASE, dt / 16.67);
    const dpr = window.devicePixelRatio || 1, H = window.innerHeight;
    // 목록은 필터를 누를 때마다 새로 그려지므로 매번 다시 찾음
    const list = on ? works.querySelectorAll(".work") : [...pulled.keys()];
    const jobs = [];
    let best = -1, bestFar = Infinity; // 한 번에 하나만: 커서와 가장 가까운 카드
    for (const el of list) {
      let p = pulled.get(el);
      if (!el.isConnected) { pulled.delete(el); continue; }
      let tx = 0, ty = 0, far = Infinity;
      if (on) {
        const b = el.getBoundingClientRect();
        if (b.bottom < -PULL_RANGE || b.top > H + PULL_RANGE) { if (!p) continue; }
        else {
          // 옮기기 전 원래 자리 기준으로 계산
          const l = b.left - (p ? p.x : 0), t = b.top - (p ? p.y : 0);
          const ox = tgt.x - (l + b.width / 2), oy = tgt.y - (t + b.height / 2);
          const gx = Math.max(0, Math.abs(ox) - b.width / 2), gy = Math.max(0, Math.abs(oy) - b.height / 2);
          far = Math.sqrt(gx * gx + gy * gy); // 커서와 카드 사이 거리 (카드 위면 0)
          if (far < PULL_RANGE) {
            const f = 1 - far / PULL_RANGE, nx = ox / (b.width / 2), ny = oy / (b.height / 2);
            tx = PULL_X * f * f * Math.max(-1, Math.min(1, nx));
            ty = PULL_Y * f * f * Math.max(-1, Math.min(1, ny));
          }
        }
      }
      if ((tx || ty) && far < bestFar) { bestFar = far; best = jobs.length; }
      if (!p && !tx && !ty) continue;
      jobs.push(el, p, tx, ty);
    }
    // 가장 가까운 카드만 끌고, 나머지는 제자리로
    for (let i = 0; i < jobs.length; i += 4) {
      if (i !== best) { jobs[i + 2] = 0; jobs[i + 3] = 0; }
      if (!jobs[i + 1]) {
        if (i !== best) { jobs[i] = null; continue; }
        jobs[i + 1] = { x: 0, y: 0 }; pulled.set(jobs[i], jobs[i + 1]);
      }
    }
    // 위치를 다 읽은 뒤에 한꺼번에 옮김
    let busy = false;
    for (let i = 0; i < jobs.length; i += 4) {
      const el = jobs[i], p = jobs[i + 1], tx = jobs[i + 2], ty = jobs[i + 3];
      if (!el) continue;
      p.x += (tx - p.x) * ease; p.y += (ty - p.y) * ease;
      if (Math.abs(tx - p.x) < 0.04 && Math.abs(ty - p.y) < 0.04) {
        if (!tx && !ty) { el.style.transform = ""; pulled.delete(el); continue; } // 제자리로 오면 흔적을 지움
        p.x = Math.round(tx * dpr) / dpr; p.y = Math.round(ty * dpr) / dpr;      // 멈출 땐 픽셀에 맞춰 글자가 또렷하게
      } else busy = true;
      el.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0)`;
    }
    return busy;
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    if (pull(dt)) start(); else last = 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    tgt.x = e.clientX; tgt.y = e.clientY;
    held = e.buttons !== 0;
    active = true; start();
  }, { passive: true });
  window.addEventListener("pointerup", () => { if (held) { held = false; start(); } }, { passive: true });
  window.addEventListener("scroll", () => { if (active) start(); }, { passive: true }); // 스크롤하면 커서 아래 카드가 바뀜
  document.documentElement.addEventListener("pointerleave", () => { active = false; start(); });
  window.addEventListener("blur", () => { active = false; start(); });
  if (viewer) new MutationObserver(start).observe(viewer, { attributes: true, attributeFilter: ["hidden"] });
})();
