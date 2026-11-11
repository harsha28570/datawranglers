/* ═══════════════════════════════════════════════════════════════════
   main.js — boot order + small utilities
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const doc = document.documentElement;
  doc.classList.add("js");

  /* If anything throws, never leave the visitor staring at a black screen. */
  let unlocked = false;
  function forceShow() {
    if (unlocked) return;
    unlocked = true;
    const pre = document.getElementById("preloader");
    if (pre) pre.style.display = "none";
    document
      .querySelectorAll(
        ".hero__lineIn, .reveal-up, .reveal-line, .split-inner, .card",
      )
      .forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = "none";
        el.style.clipPath = "none";
      });
    if (DataWranglers.SmoothScroll && DataWranglers.SmoothScroll.instance)
      DataWranglers.SmoothScroll.instance.start();
  }
  window.addEventListener("error", (e) => {
    console.warn("[data-wranglers]", e.message);
    forceShow();
  });
  setTimeout(forceShow, 9000); // hard safety net

  function boot() {
    try {
      DataWranglers.applyConfig();
    } catch (e) {
      console.warn("[data-wranglers] config", e);
    }
    try {
      DataWranglers.tabTitle();
    } catch (e) {
      console.warn("[data-wranglers] tab", e);
    }

    DataWranglers.SmoothScroll.init();
    if (DataWranglers.SmoothScroll.instance) DataWranglers.SmoothScroll.stop(); // hold scroll during the intro

    const reveal = () => {
      unlocked = true;
      try {
        DataWranglers.Animations.initAll();
      } catch (e) {
        console.warn("[data-wranglers] animations", e);
        forceShow();
      }
      try {
        DataWranglers.Animations.initHero();
      } catch (e) {
        console.warn("[data-wranglers] hero", e);
      }
      if (DataWranglers.SmoothScroll.instance)
        DataWranglers.SmoothScroll.start();
      setTimeout(() => DataWranglers.Animations.refresh(), 400);
      setTimeout(() => DataWranglers.Animations.refresh(), 1600);
    };

    DataWranglers.Preloader.run()
      .then(reveal)
      .catch((err) => {
        console.warn("[data-wranglers] preloader", err);
        forceShow();
        reveal();
      });

    wireCopyMail();
    wireToTop();
    wireRevealOnFontLoad();
  }

  /* re-measure split lines once the real type has landed */
  function wireRevealOnFontLoad() {
    if (!document.fonts || !document.fonts.ready) return;
    document.fonts.ready.then(() => {
      setTimeout(() => {
        try {
          DataWranglers.Animations.refresh();
        } catch (e) {
          /* noop */
        }
      }, 120);
    });
  }

  /* ── footer email → clipboard ────────────────────────────────────── */
  function wireCopyMail() {
    const btn = document.getElementById("copyMail");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const mail = DataWranglers.CONFIG.EMAIL;
      try {
        await DataWranglers.util.copy(mail);
        btn.classList.add("is-copied");
        DataWranglers.util.toast("Email copied — " + mail);
        setTimeout(() => btn.classList.remove("is-copied"), 2000);
      } catch (e) {
        DataWranglers.util.toast("Copy failed — " + mail, 3200);
      }
    });
  }

  /* ── back to top ─────────────────────────────────────────────────── */
  function wireToTop() {
    const btn = document.getElementById("toTop");
    if (!btn) return;
    btn.addEventListener("click", () => DataWranglers.SmoothScroll.top());
  }

  /* ── go ──────────────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
