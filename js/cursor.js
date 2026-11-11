/* ═══════════════════════════════════════════════════════════════════
   cursor.js — dot (instant) + ring (lagged), contextual labels
   Desktop pointer devices only.
   ═══════════════════════════════════════════════════════════════════ */

DataWranglers.Cursor = (function () {
  const state = {
    mx: window.innerWidth / 2,
    my: window.innerHeight / 2,
    dx: window.innerWidth / 2,
    dy: window.innerHeight / 2,
    rx: window.innerWidth / 2,
    ry: window.innerHeight / 2,
    active: false,
  };

  let root,
    dot,
    ring,
    label,
    raf = null,
    running = false;

  function init() {
    root = document.getElementById("cursor");
    dot = root && root.querySelector(".cursor__dot");
    ring = root && root.querySelector(".cursor__ring");
    label = root && root.querySelector(".cursor__label");

    if (!root || !dot || !ring) return;

    /* only for real pointers — touch devices keep the native cursor */
    if (!DataWranglers.util.fine || DataWranglers.util.reduced) return;

    document.documentElement.classList.add("is-cursor-on");

    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch") return;
        state.mx = e.clientX;
        state.my = e.clientY;
        if (!running) start();
      },
      { passive: true },
    );

    window.addEventListener("pointerdown", () => ring.classList.add("is-down"));
    window.addEventListener("pointerup", () =>
      ring.classList.remove("is-down"),
    );

    document.addEventListener("mouseleave", () =>
      root.classList.add("is-hidden"),
    );
    document.addEventListener("mouseenter", () =>
      root.classList.remove("is-hidden"),
    );

    /* hover targets: anything interactive or flagged with data-cursor */
    const SEL =
      'a, button, [data-cursor], [tabindex]:not([tabindex="-1"]), input, select, textarea, label';

    document.addEventListener("pointerover", (e) => {
      if (e.pointerType === "touch") return;
      const el = e.target.closest(SEL);
      if (!el) return;
      state.active = true;
      root.classList.add("is-active");
      label.textContent = el.getAttribute("data-cursor") || "";
    });

    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest(SEL);
      if (!el) return;
      if (
        e.relatedTarget &&
        e.relatedTarget.closest &&
        e.relatedTarget.closest(SEL)
      )
        return;
      state.active = false;
      root.classList.remove("is-active");
      label.textContent = "";
    });

    start();
  }

  function start() {
    if (running) return;
    running = true;
    gsap.ticker.add(tick);
  }

  function tick() {
    /* dot: near-instant (≈0.1s response) — ring: lagged (≈0.25s) */
    state.dx = DataWranglers.util.lerp(state.dx, state.mx, 0.42);
    state.dy = DataWranglers.util.lerp(state.dy, state.my, 0.42);
    state.rx = DataWranglers.util.lerp(state.rx, state.mx, 0.17);
    state.ry = DataWranglers.util.lerp(state.ry, state.my, 0.17);

    dot.style.transform = `translate3d(${state.dx}px, ${state.dy}px, 0)`;
    ring.style.transform = `translate3d(${state.rx}px, ${state.ry}px, 0)`;
  }

  function destroy() {
    if (!running) return;
    running = false;
    if (window.gsap) gsap.ticker.remove(tick);
    document.documentElement.classList.remove("is-cursor-on");
  }

  return { init, destroy };
})();
