/* ═══════════════════════════════════════════════════════════════════
   smooth-scroll.js — Lenis ↔ GSAP ScrollTrigger bridge + anchors
   ═══════════════════════════════════════════════════════════════════ */

Kaleido.SmoothScroll = (function () {

  let lenis = null;

  function init() {
    if (typeof window.Lenis === 'undefined') return null;

    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      lerp: Kaleido.util.reduced ? 1 : null
    });

    /* drive Lenis from GSAP's ticker so both share one rAF */
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    /* in-page anchors */
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      Kaleido.SmoothScroll.to(target);
    });

    window.addEventListener('resize', () => lenis.resize());
    return lenis;
  }

  function to(target, opts = {}) {
    if (lenis) {
      lenis.scrollTo(target, { offset: -10, duration: opts.duration || 1.4, ...opts });
    } else if (window.gsap && window.ScrollToPlugin) {
      gsap.to(window, { duration: 1.1, ease: 'power3.inOut', scrollTo: { y: target, offsetY: 10 } });
    } else if (target === 0 || target === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function top() { to(0); }

  function stop()  { if (lenis) lenis.stop(); }
  function start() { if (lenis) lenis.start(); }

  return {
    init, to, top, stop, start,
    get instance() { return lenis; }
  };
})();
