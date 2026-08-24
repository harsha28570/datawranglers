/* ═══════════════════════════════════════════════════════════════════
   main.js — boot order + small utilities
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');

  /* If anything throws, never leave the visitor staring at a black screen. */
  let unlocked = false;
  function forceShow() {
    if (unlocked) return;
    unlocked = true;
    const pre = document.getElementById('preloader');
    if (pre) pre.style.display = 'none';
    document.querySelectorAll('.hero__lineIn, .reveal-up, .reveal-line, .split-inner, .card')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; el.style.clipPath = 'none'; });
    if (Kaleido.SmoothScroll && Kaleido.SmoothScroll.instance) Kaleido.SmoothScroll.instance.start();
  }
  window.addEventListener('error', e => {
    console.warn('[kaleido]', e.message);
    forceShow();
  });
  setTimeout(forceShow, 9000); // hard safety net

  function boot() {
    try { Kaleido.applyConfig(); } catch (e) { console.warn('[kaleido] config', e); }
    try { Kaleido.tabTitle(); }   catch (e) { console.warn('[kaleido] tab', e); }

    Kaleido.SmoothScroll.init();
    if (Kaleido.SmoothScroll.instance) Kaleido.SmoothScroll.stop(); // hold scroll during the intro

    try { Kaleido.Cursor.init(); } catch (e) { console.warn('[kaleido] cursor', e); }

    const reveal = () => {
      unlocked = true;
      try { Kaleido.Animations.initAll(); } catch (e) { console.warn('[kaleido] animations', e); forceShow(); }
      try { Kaleido.Animations.initHero(); } catch (e) { console.warn('[kaleido] hero', e); }
      if (Kaleido.SmoothScroll.instance) Kaleido.SmoothScroll.start();
      setTimeout(() => Kaleido.Animations.refresh(), 400);
      setTimeout(() => Kaleido.Animations.refresh(), 1600);
    };

    Kaleido.Preloader.run()
      .then(reveal)
      .catch(err => { console.warn('[kaleido] preloader', err); forceShow(); reveal(); });

    wireCopyMail();
    wireToTop();
    wireRevealOnFontLoad();
  }

  /* re-measure split lines once the real type has landed */
  function wireRevealOnFontLoad() {
    if (!document.fonts || !document.fonts.ready) return;
    document.fonts.ready.then(() => {
      setTimeout(() => {
        try { Kaleido.Animations.refresh(); } catch (e) { /* noop */ }
      }, 120);
    });
  }

  /* ── footer email → clipboard ────────────────────────────────────── */
  function wireCopyMail() {
    const btn = document.getElementById('copyMail');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const mail = Kaleido.CONFIG.EMAIL;
      try {
        await Kaleido.util.copy(mail);
        btn.classList.add('is-copied');
        Kaleido.util.toast('Email copied — ' + mail);
        setTimeout(() => btn.classList.remove('is-copied'), 2000);
      } catch (e) {
        Kaleido.util.toast('Copy failed — ' + mail, 3200);
      }
    });
  }

  /* ── back to top ─────────────────────────────────────────────────── */
  function wireToTop() {
    const btn = document.getElementById('toTop');
    if (!btn) return;
    btn.addEventListener('click', () => Kaleido.SmoothScroll.top());
  }

  /* ── go ──────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
