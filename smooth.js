// =============================================================
//  부드러운 스크롤
//  1) SmoothScroll.to(요소, 위치): 코드에서 하는 이동(맨 위로, 목차 클릭 등)을 직접 애니메이션.
//     브라우저의 behavior:"smooth" 는 다른 영역(목차)이 동시에 부드럽게 스크롤되면
//     서로 끊기는 문제가 있어서, 위치를 프레임마다 직접 바꿉니다.
//  2) 마우스 휠: 휠을 굴리면 목표 위치만 옮기고 화면이 그 위치까지 미끄러지듯 따라갑니다.
//     - 마우스가 있는 데스크톱에서만 (휴대폰·태블릿 터치는 기본 그대로)
//     - 터치패드처럼 원래 부드러운 입력, Ctrl+휠(확대), 가로 스크롤은 건드리지 않음
//  "동작 줄이기" 설정을 켠 사용자에게는 애니메이션 없이 바로 이동합니다.
// =============================================================
(function () {
  const reduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const root = document.scrollingElement || document.documentElement;
  const state = new WeakMap(); // 요소 → 진행 중인 애니메이션

  const isRoot = (el) => el === root || el === window || el === document.documentElement || el === document.body;
  const norm = (el) => (isRoot(el) ? root : el);
  const getY = (el) => (el === root ? window.scrollY : el.scrollTop);
  const setY = (el, y) => { if (el === root) window.scrollTo(0, y); else el.scrollTop = y; };
  const maxY = (el) => (el === root
    ? Math.max(0, root.scrollHeight - window.innerHeight)
    : Math.max(0, el.scrollHeight - el.clientHeight));
  const S = (el) => { let s = state.get(el); if (!s) { s = { mode: null }; state.set(el, s); } return s; };

  function frame(el, s, run) {
    s.raf = requestAnimationFrame((t) => run(el, s, t));
    // 화면 갱신이 멈춘 환경(백그라운드 등)에서 막히지 않도록: 프레임이 안 오면 바로 도착
    clearTimeout(s.watch);
    s.watch = setTimeout(() => {
      if (s.mode && performance.now() - s.last > 150) { setY(el, s.target); stop(s); }
    }, 200);
  }
  function stop(s) { s.mode = null; cancelAnimationFrame(s.raf); clearTimeout(s.watch); }

  // ---- 1) 코드에서 하는 이동: 시간 기반 ease-out ----
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function tween(el, s, now) {
    if (s.mode !== "tween") return;
    if (Math.abs(getY(el) - s.pos) > 3) { stop(s); return; } // 사용자가 다른 방식으로 스크롤함
    s.last = now;
    const t = Math.min(1, (now - s.t0) / s.dur);
    s.pos = s.from + (s.target - s.from) * easeOut(t);
    setY(el, s.pos);
    s.pos = getY(el);
    if (t < 1) frame(el, s, tween); else stop(s);
  }
  function to(el, y, opts = {}) {
    el = norm(el);
    const s = S(el);
    stop(s);
    const target = Math.max(0, Math.min(maxY(el), y));
    if (reduce.matches || opts.instant) { setY(el, target); return; }
    s.from = s.pos = getY(el);
    s.target = target;
    const dist = Math.abs(target - s.from);
    if (dist < 1) return;
    s.dur = opts.duration || Math.min(900, 280 + Math.sqrt(dist) * 5);
    s.t0 = s.last = performance.now();
    s.mode = "tween";
    frame(el, s, tween);
  }
  window.SmoothScroll = { to };

  // ---- 2) 마우스 휠 ----
  if (!window.matchMedia || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const EASE = 0.12;     // 한 프레임(60fps 기준)에 남은 거리의 몇 %를 따라갈지. 작을수록 더 미끄러짐
  const MIN_WHEEL = 20;  // 이보다 작은 움직임은 터치패드로 보고 기본 스크롤에 맡김

  const targetOf = (el) => { const s = state.get(el); return s && s.mode ? s.target : getY(el); };

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

  function glide(el, s, now) {
    if (s.mode !== "wheel") return;
    if (Math.abs(getY(el) - s.pos) > 3) { stop(s); return; } // 스크롤바 끌기·키보드 등
    const dt = Math.min(64, now - s.last);
    s.last = now;
    const a = 1 - Math.pow(1 - EASE, dt / 16.67);
    s.pos += (s.target - s.pos) * a;
    if (Math.abs(s.target - s.pos) < 0.5) s.pos = s.target;
    setY(el, s.pos);
    s.pos = getY(el);
    if (Math.abs(s.target - s.pos) >= 0.5) frame(el, s, glide); else stop(s);
  }

  window.addEventListener("wheel", (e) => {
    if (reduce.matches || e.ctrlKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (e.deltaMode === 0 && Math.abs(dy) < MIN_WHEEL) return;

    const el = pick(e.target, dy);
    e.preventDefault();
    if (!el) return;

    const s = S(el);
    if (s.mode !== "wheel") { stop(s); s.pos = getY(el); s.target = s.pos; } // 진행 중인 코드 이동은 휠이 이김
    s.target = Math.max(0, Math.min(maxY(el), s.target + dy));
    if (s.mode !== "wheel" && Math.abs(s.target - s.pos) >= 0.5) {
      s.mode = "wheel";
      s.last = performance.now();
      frame(el, s, glide);
    }
  }, { passive: false });
})();
