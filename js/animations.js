/* ═══════════════════════════════════════════════════════════════════
   animations.js — every scroll, hover and entrance behaviour
   Degrades to a fully readable static page if GSAP is unavailable.
   ═══════════════════════════════════════════════════════════════════ */

DataWranglers.Animations = (function () {
  const HAS_GSAP = typeof window.gsap !== "undefined";
  let HAS_ST = false,
    HAS_SPLIT = false,
    HAS_TILT = false;

  if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    if (window.SplitText) {
      gsap.registerPlugin(SplitText);
      HAS_SPLIT = true;
    }
    HAS_ST = !!window.ScrollTrigger;
  }
  HAS_TILT = typeof window.VanillaTilt !== "undefined";

  const off = () => DataWranglers.util.light() || !HAS_GSAP;

  /* ────────────────────────────────────────────────────────────────
     text splitting — SplitText when present, hand-rolled fallback
     ──────────────────────────────────────────────────────────────── */

  function splitWords(el) {
    if (el.dataset.wordsSplit) return [...el.querySelectorAll(".word")];
    el.dataset.wordsSplit = "1";

    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const txt = child.textContent;
          if (!txt) return;
          const frag = document.createDocumentFragment();
          txt.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const s = document.createElement("span");
            s.className = "word";
            s.style.display = "inline";
            s.textContent = part;
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return [...el.querySelectorAll(".word")];
  }

  function splitLines(el) {
    if (el.dataset.linesSplit)
      return [...el.querySelectorAll(".split-line > .split-inner")];
    el.dataset.linesSplit = "1";

    if (HAS_SPLIT) {
      try {
        const st = new SplitText(el, {
          type: "lines",
          linesClass: "split-line",
          autoSplit: true,
        });
        st.lines.forEach((line) => {
          const inner = document.createElement("span");
          inner.className = "split-inner";
          while (line.firstChild) inner.appendChild(line.firstChild);
          line.appendChild(inner);
        });
        return [...el.querySelectorAll(".split-line > .split-inner")];
      } catch (err) {
        /* fall through to the manual splitter */
      }
    }

    const words = splitWords(el);
    const rootRect = el.getBoundingClientRect();
    const groups = [];
    let current = null,
      prevTop = null;

    words.forEach((w) => {
      const r = w.getBoundingClientRect();
      const top = Math.round(r.top - rootRect.top);
      if (
        prevTop === null ||
        Math.abs(top - prevTop) > Math.max(4, r.height * 0.5)
      ) {
        current = [];
        groups.push(current);
        prevTop = top;
      }
      current.push(w);
    });

    groups.forEach((g) => {
      if (!g.length) return;
      const line = document.createElement("span");
      line.className = "split-line";
      const inner = document.createElement("span");
      inner.className = "split-inner";
      g[0].before(line);
      line.appendChild(inner);
      g.forEach((w) => inner.appendChild(w));
    });

    /* re-join the words that were visually separated by spaces */
    el.querySelectorAll(".split-inner").forEach((inner) => {
      [...inner.childNodes].forEach((n) => {
        if (n.nodeType === 1 && n.classList && n.classList.contains("word")) {
          n.style.display = "inline-block";
        }
      });
    });

    return [...el.querySelectorAll(".split-line > .split-inner")];
  }

  /* ────────────────────────────────────────────────────────────────
     generic reveals
     ──────────────────────────────────────────────────────────────── */

  function setupReveals() {
    const lines = [
      ...document.querySelectorAll('[data-split="lines"]'),
    ].flatMap((el) => splitLines(el));

    if (off()) {
      gsap && gsap.set(lines, { yPercent: 0, opacity: 1 });
      document.querySelectorAll(".reveal-up, .reveal-line").forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
      return;
    }

    if (lines.length) {
      gsap.set(lines, { yPercent: 118, opacity: 0 });
      lines.forEach((inner) => {
        const host =
          inner.closest(".hero__title, .work__title, .cta__title") || inner;
        ScrollTrigger.create({
          trigger: host,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.to(inner, {
              yPercent: 0,
              opacity: 1,
              duration: 1.15,
              ease: "expo.out",
            }),
        });
      });
    }

    gsap.utils.toArray(".reveal-up").forEach((el) => {
      gsap.from(el, {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     hero
     ──────────────────────────────────────────────────────────────── */

  function heroReveal() {
    const inLines = gsap.utils.toArray(".hero__lineIn");
    const meta = gsap.utils.toArray(".hero__meta");
    const foot = gsap.utils.toArray(".hero__foot, .hero__side, .scrollcue");

    if (off()) {
      gsap.set([...inLines, ...meta, ...foot], {
        y: 0,
        yPercent: 0,
        opacity: 1,
      });
      runCounters(true);
      return;
    }

    /* refresh mid-page (e.g. browser restores scroll position) */
    if (window.scrollY > window.innerHeight * 0.6) {
      gsap.set([...inLines, ...meta, ...foot], {
        y: 0,
        yPercent: 0,
        opacity: 1,
      });
      runCounters(true);
      return;
    }

    gsap.set(inLines, { yPercent: 118 });
    gsap.set(meta, { y: 26, opacity: 0 });
    gsap.set(foot, { y: 44, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(meta, { y: 0, opacity: 1, duration: 0.9 })
      .to(inLines, { yPercent: 0, duration: 1.35, stagger: 0.11 }, "-=.55")
      .to(foot, { y: 0, opacity: 1, duration: 1, stagger: 0.09 }, "-=.95");

    tl.add(() => runCounters(false), "-=1");

    gsap.to(".hero__ghost", {
      yPercent: -26,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });

    gsap.to(".hero__arcs", {
      rotate: 22,
      transformOrigin: "50% 50%",
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  function runCounters(instant) {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count) || 0;
      if (instant || !HAS_GSAP) {
        el.textContent = target;
        return;
      }
      const o = { v: 0 };
      gsap.to(o, {
        v: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(o.v);
        },
      });
    });
  }

  /* mouse-follow glow inside the hero */
  function heroGlow() {
    const hero = document.querySelector(".hero");
    const glow = document.getElementById("heroGlow");
    if (!hero || !glow || !HAS_GSAP || DataWranglers.util.reduced) return;

    gsap.set(glow, {
      x: window.innerWidth * 0.7,
      y: window.innerHeight * 0.4,
      autoAlpha: 0,
    });

    hero.addEventListener("pointerenter", () =>
      gsap.to(glow, { autoAlpha: 1, duration: 0.6 }),
    );
    hero.addEventListener("pointerleave", () =>
      gsap.to(glow, { autoAlpha: 0, duration: 0.8 }),
    );
    hero.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch") return;
        gsap.to(glow, {
          x: e.clientX,
          y: e.clientY,
          duration: 1.1,
          ease: "power3.out",
          overwrite: "auto",
        });
      },
      { passive: true },
    );
  }

  /* ────────────────────────────────────────────────────────────────
     generative particle field
     ──────────────────────────────────────────────────────────────── */

  function heroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");

    let w = 0,
      h = 0,
      dpr = 1,
      parts = [],
      raf = null;
    const pointer = { x: -9999, y: -9999 };
    const COUNT = DataWranglers.util.light() ? 42 : 96;
    const LINK = DataWranglers.util.light() ? 90 : 132;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      parts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.5,
        hot: Math.random() > 0.82,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;

        /* gentle repulsion from the cursor */
        const dx = p.x - pointer.x,
          dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 26000 && d2 > 1) {
          const f = (1 - d2 / 26000) * 0.9;
          const d = Math.sqrt(d2);
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }

        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const lx = p.x - q.x,
            ly = p.y - q.y;
          const ld = Math.hypot(lx, ly);
          if (ld < LINK) {
            const a = (1 - ld / LINK) * 0.28;
            ctx.strokeStyle =
              p.hot || q.hot
                ? `rgba(230,57,70,${a})`
                : `rgba(241,241,241,${a * 0.55})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = p.hot ? "rgba(230,57,70,.85)" : "rgba(241,241,241,.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      size();
      seed();
      cancelAnimationFrame(raf);
      frame();
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      },
      { passive: true },
    );
    window.addEventListener("pointerleave", () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(start, 220);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) frame();
    });

    start();
  }

  /* ────────────────────────────────────────────────────────────────
     word-by-word scroll highlight
     ──────────────────────────────────────────────────────────────── */

  function wordHighlight() {
    document.querySelectorAll("[data-word-highlight]").forEach((el) => {
      const words = splitWords(el);
      const hotIdx = new Set();
      words.forEach((w, i) => {
        if (w.closest(".hl")) hotIdx.add(i);
        w.style.display = "inline-block";
      });

      /* reduced motion / touch / no-GSAP: everything readable immediately */
      if (!HAS_ST || DataWranglers.util.light()) {
        words.forEach((w, i) =>
          w.classList.add(hotIdx.has(i) ? "is-hot" : "is-lit"),
        );
        return;
      }

      let last = -1;
      ScrollTrigger.create({
        trigger: el,
        start: "top 82%",
        end: "bottom 46%",
        scrub: true,
        onUpdate: (self) => {
          const lit = Math.floor(self.progress * (words.length + 3));
          if (lit === last) return;
          last = lit;
          words.forEach((w, i) => {
            const on = i < lit;
            w.classList.toggle("is-lit", on && !hotIdx.has(i));
            w.classList.toggle("is-hot", on && hotIdx.has(i));
          });
        },
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     velocity-reactive marquee
     ──────────────────────────────────────────────────────────────── */

  function marquee() {
    const track = document.querySelector("[data-marquee]");
    if (!track) return;
    const group = track.querySelector(".marquee__group");
    if (!group) return;

    const clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);

    let distance = group.getBoundingClientRect().width || 1;
    let x = 0,
      last = performance.now(),
      hover = false,
      raf = null;

    const measure = () => {
      x = 0;
      distance = group.getBoundingClientRect().width || 1;
      track.style.transform = "translate3d(0,0,0)";
    };

    const tick = (now) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      let speed = hover ? 8 : 58;
      const vel =
        (DataWranglers.SmoothScroll.instance &&
          DataWranglers.SmoothScroll.instance.velocity) ||
        0;
      speed +=
        DataWranglers.util.clamp(Math.abs(vel) * 0.16, 0, 260) *
        (vel < 0 ? -1 : 1);

      x -= speed * dt;
      if (x <= -distance) x += distance;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };

    document.querySelector(".marquee").addEventListener("pointerenter", () => {
      hover = true;
    });
    document.querySelector(".marquee").addEventListener("pointerleave", () => {
      hover = false;
    });

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(measure, 200);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });

    /* measure once type is ready, then run */
    requestAnimationFrame(() => {
      measure();
      last = performance.now();
      raf = requestAnimationFrame(tick);
    });
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(measure);
  }

  /* ────────────────────────────────────────────────────────────────
     bento cards — entrance + 3D tilt
     ──────────────────────────────────────────────────────────────── */

  function cards() {
    const items = gsap.utils.toArray(".bento .card");

    /* oversized ghost numerals */
    items.forEach((card) => {
      if (card.querySelector(".card__ghost")) return;
      const idx = card.querySelector(".card__idx");
      if (!idx) return;
      const g = document.createElement("span");
      g.className = "card__ghost";
      g.setAttribute("aria-hidden", "true");
      g.textContent = idx.textContent;
      card.appendChild(g);
    });

    if (off()) {
      gsap && gsap.set(items, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" });
      return;
    }

    gsap.set(items, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
    items.forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.05,
        ease: "expo.out",
        delay: (i % 3) * 0.09,
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      });
    });

    initTilt();
  }

  function initTilt() {
    if (!HAS_TILT || DataWranglers.util.light() || window.innerWidth < 769)
      return;
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 8,
      speed: 400,
      glare: true,
      "max-glare": 0.12,
      scale: 1.02,
      perspective: 900,
      gyroscope: false,
      easing: "cubic-bezier(.16,1,.3,1)",
    });
  }

  /* ────────────────────────────────────────────────────────────────
     archive rail — pinned horizontal scroll
     ──────────────────────────────────────────────────────────────── */

  function rail() {
    const section = document.querySelector(".archive");
    const track = document.querySelector(".rail__track");
    if (!section || !track || !HAS_ST || !HAS_GSAP) return;

    const build = () => {
      ScrollTrigger.getAll()
        .filter((st) => st.vars.id === "rail")
        .forEach((st) => st.kill());
      gsap.set(track, { x: 0 });

      const distance =
        track.scrollWidth -
        window.innerWidth +
        (parseFloat(getComputedStyle(track).paddingLeft) || 0);
      if (
        distance <= 40 ||
        window.innerWidth < 769 ||
        DataWranglers.util.light()
      )
        return;

      gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          id: "rail",
          trigger: section,
          start: "top top",
          end: () => `+=${distance + window.innerHeight * 0.4}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    };

    build();
    window.addEventListener("resize", debounce(build, 300));
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(build);
  }

  /* ────────────────────────────────────────────────────────────────
     CTA — countdown, magnetic button, ghost parallax
     ──────────────────────────────────────────────────────────────── */

  function cta() {
    const d = DataWranglers.nextEventDate();
    const label = document.querySelector("[data-next-event-date]");
    if (label) {
      label.textContent =
        d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " · " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }

    const cells = {
      d: document.querySelector('[data-cd="d"]'),
      h: document.querySelector('[data-cd="h"]'),
      m: document.querySelector('[data-cd="m"]'),
      s: document.querySelector('[data-cd="s"]'),
    };
    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

    const tick = () => {
      let diff = d - Date.now();
      const live = diff <= 0;
      diff = Math.max(0, diff);
      const sec = Math.floor(diff / 1000);
      if (cells.d) cells.d.textContent = pad(Math.floor(sec / 86400));
      if (cells.h) cells.h.textContent = pad(Math.floor(sec / 3600) % 24);
      if (cells.m) cells.m.textContent = pad(Math.floor(sec / 60) % 60);
      if (cells.s) cells.s.textContent = pad(sec % 60);
      if (live && label) label.textContent = "Live now";
    };
    tick();
    setInterval(tick, 1000);

    if (HAS_GSAP && !DataWranglers.util.light()) {
      gsap.to(".cta__ghost", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: ".cta",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }

    magnetic();
  }

  function magnetic() {
    if (!HAS_GSAP || !DataWranglers.util.fine || DataWranglers.util.reduced)
      return;

    document.querySelectorAll(".btnMagnet").forEach((btn) => {
      const strength = 0.34;

      btn.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * (strength * 0.6);
        gsap.to(btn, {
          x,
          y,
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      btn.addEventListener("pointerleave", () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 1.05,
          ease: "elastic.out(1, 0.42)",
          overwrite: "auto",
        });
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     scroll progress
     ──────────────────────────────────────────────────────────────── */

  function progress() {
    const fill = document.querySelector(".progress__fill");
    if (!fill) return;
    if (!HAS_ST || !HAS_GSAP) return;

    gsap.to(fill, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.25,
      },
    });
  }

  /* ──────────────────────────────────────────────────────────────── */

  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function initAll() {
    progress();
    setupReveals();
    heroGlow();
    heroCanvas();
    wordHighlight();
    marquee();
    cards();
    rail();
    cta();
  }

  function initHero() {
    heroReveal();
  }

  function refresh() {
    if (HAS_ST) ScrollTrigger.refresh();
  }

  return { initAll, initHero, refresh, splitLines, splitWords };
})();
