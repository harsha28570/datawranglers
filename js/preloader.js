/* ═══════════════════════════════════════════════════════════════════
   preloader.js — counter, progress bar, wipe-out reveal
   Resolves its promise when the site should start animating.
   ═══════════════════════════════════════════════════════════════════ */

DataWranglers.Preloader = (function () {
  const MIN_TIME = 1500; // ms — keeps the intro from feeling like a flash
  const ASSET_CAP = 2600; // ms — never wait longer than this for assets
  const HARD_CAP = 6000; // ms — absolute safety net

  function splitChars(el) {
    const txt = el.textContent.trim();
    el.textContent = "";
    [...txt].forEach((ch) => {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch;
      el.appendChild(s);
    });
    return [...el.querySelectorAll(".char")];
  }

  function revealNow() {
    const pre = document.getElementById("preloader");
    if (!pre) return;
    pre.style.display = "none";
  }

  function run() {
    return new Promise((resolve) => {
      const pre = document.getElementById("preloader");
      const count = document.getElementById("preloadCount");
      const bar = document.querySelector(".preloader__barFill");
      const word = document.querySelector(".preloader__word");

      if (!pre) {
        resolve();
        return;
      }

      /* Reduced motion / no GSAP: skip straight through. */
      if (DataWranglers.util.reduced || typeof window.gsap === "undefined") {
        revealNow();
        resolve();
        return;
      }

      const chars = word
        ? [...word.querySelectorAll(".preloader__brand")].flatMap(splitChars)
        : [];
      const proxy = { n: 0 };
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;

        const tl = gsap.timeline({
          onComplete: () => {
            revealNow();
            resolve();
          },
        });

        tl.to(proxy, {
          n: 100,
          duration: 0.22,
          ease: "none",
          onUpdate: () => {
            if (count) count.textContent = "100";
          },
        })
          .to(bar, { scaleX: 1, duration: 0.22, ease: "none" }, "<")
          .to(
            chars,
            {
              yPercent: -115,
              opacity: 0,
              stagger: 0.022,
              duration: 0.6,
              ease: "expo.in",
            },
            "-=.1",
          )
          .to(
            ".preloader__top, .preloader__bottom",
            {
              opacity: 0,
              y: -18,
              duration: 0.4,
              ease: "power2.in",
            },
            "<",
          )
          .to(
            pre,
            {
              yPercent: -100,
              duration: 1.05,
              ease: "expo.inOut",
            },
            "-=.28",
          );
      };

      /* count 0 → 96 while assets settle */
      gsap.to(proxy, {
        n: 96,
        duration: MIN_TIME / 1000,
        ease: "power2.inOut",
        onUpdate: () => {
          const v = Math.round(proxy.n);
          if (count) count.textContent = v;
          if (bar) gsap.set(bar, { scaleX: v / 100 });
        },
      });

      /* wait for real assets, but never longer than the caps */
      const start = performance.now();
      const ready = new Promise((res) => {
        if (document.readyState === "complete") return res();
        window.addEventListener("load", res, { once: true });
      });

      Promise.race([
        ready,
        new Promise((res) => setTimeout(res, ASSET_CAP)),
      ]).then(() => {
        const wait = Math.max(0, MIN_TIME - (performance.now() - start));
        setTimeout(finish, wait);
      });

      setTimeout(finish, HARD_CAP);
    });
  }

  return { run };
})();
