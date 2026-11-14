// =============================================================
//  마우스 휠 부드러운 스크롤
//  휠을 굴리면 목표 위치만 옮기고, 화면(과 스크롤바)은 그 위치까지 미끄러지듯 따라갑니다.
//  - 마우스가 있는 데스크톱에서만 동작 (휴대폰·태블릿 터치는 기본 그대로)
//  - 터치패드처럼 원래 부드러운 입력, Ctrl+휠(확대), 가로 스크롤은 건드리지 않음
//  - "동작 줄이기" 설정을 켠 사용자에게는 적용하지 않음
// =============================================================
(function () {
  if (!window.matchMedia || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const EASE = 0.12;          // 한 프레임(60fps 기준)에 남은 거리의 몇 %를 따라갈지. 작을수록 더 미끄러짐
  const MIN_WHEEL = 20;       // 이보다 작은 움직임은 터치패드로 보고 기본 스크롤에 맡김
  const root = document.scrollingElement || document.documentElement;
  const state = new WeakMap();

  const isRoot = (el) => el === root;
  const getY = (el) => (isRoot(el) ? window.scrollY : el.scrollTop);
  const setY = (el, y) => { if (isRoot(el)) window.scrollTo(0, y); else el.scrollTop = y; };
  const maxY = (el) => (isRoot(el)
    ? Math.max(0, root.scrollHeight - window.innerHeight)
    : Math.max(0, el.scrollHeight - el.clientHeight));
  const targetOf = (el) => { const s = state.get(el); return s && s.running ? s.target : getY(el); };

  // 휠이 움직일 대상: 이 방향으로 더 움직일 수 있는 가장 가까운 스크롤 영역
  function pick(start, dy) {
    for (let el = start; el && el.nodeType === 1 && el !== document.body && el !== root; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      const y = targetOf(el);
      if ((dy < 0 && y > 0.5) || (dy > 0 && y < maxY(el) - 0.5)) return el;
      if (cs.overscrollBehaviorY === "contain" || cs.overscrollBehaviorY === "none") return null; // 바깥으로 넘기지 않음
    }
    const rs = getComputedStyle(root), bs = getComputedStyle(document.body);
    if (rs.overflowY === "hidden" || bs.overflowY === "hidden") return null; // 팝업이 열려 페이지가 잠긴 상태
    return root;
  }

  function step(el, s, now) {
    // 스크롤바 끌기·키보드·다른 코드가 위치를 바꿨으면 그쪽을 따르고 멈춤
    if (Math.abs(getY(el) - s.pos) > 3) { s.running = false; return; }
    const dt = Math.min(64, now - s.last);
    s.last = now;
    const a = 1 - Math.pow(1 - EASE, dt / 16.67);
    s.pos += (s.target - s.pos) * a;
    if (Math.abs(s.target - s.pos) < 0.5) s.pos = s.target;
    setY(el, s.pos);
    s.pos = getY(el); // 브라우저가 반올림한 실제 위치로 맞춤
    if (Math.abs(s.target - s.pos) >= 0.5) requestAnimationFrame((t) => step(el, s, t));
    else s.running = false;
  }

  window.addEventListener("wheel", (e) => {
    if (reduce.matches || e.ctrlKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (e.deltaMode === 0 && Math.abs(dy) < MIN_WHEEL) return;

    const el = pick(e.target, dy);
    e.preventDefault();
    if (!el) return;

    let s = state.get(el);
    if (!s) { s = { running: false }; state.set(el, s); }
    if (!s.running) { s.pos = getY(el); s.target = s.pos; }
    s.target = Math.max(0, Math.min(maxY(el), s.target + dy));
    if (!s.running && Math.abs(s.target - s.pos) >= 0.5) {
      s.running = true;
      s.last = performance.now();
      requestAnimationFrame((t) => step(el, s, t));
      // 화면 갱신이 멈춘 환경(백그라운드 등)에서 스크롤이 막히지 않도록: 프레임이 안 오면 바로 이동
      clearTimeout(s.watch);
      s.watch = setTimeout(() => {
        if (s.running && performance.now() - s.last > 150) { setY(el, s.target); s.pos = getY(el); s.running = false; }
      }, 200);
    }
  }, { passive: false });
})();
