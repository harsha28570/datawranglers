/* ═══════════════════════════════════════════════════════════════════
   config.js — everything you will ever need to edit lives here
   ═══════════════════════════════════════════════════════════════════ */

window.DataWranglers = window.DataWranglers || {};

DataWranglers.CONFIG = {
  /* ▸▸▸ 1. THE REGISTRATION LINK — put your form URL here ◂◂◂
        Google Form / Luma / Eventbrite / Razorpay — anything.
        It is applied automatically to every [data-register] button. */
  REGISTER_URL:
    "https://docs.google.com/forms/d/e/REPLACE-WITH-YOUR-FORM/viewform",

  /* ▸▸▸ 2. CONTACT EMAIL — shown in the footer + click-to-copy ◂◂◂ */
  EMAIL: "hello@datawranglers.com",

  /* ▸▸▸ 3. NEXT EVENT — drives the countdown + the date label ◂◂◂
        Give a string like '2026-09-14T18:00:00' (local time),
        or leave null to auto-roll to the next 14th of a month. */
  EVENT_DATE: null,
  EVENT_AUTO_DAY: 14, // used only when EVENT_DATE is null
  EVENT_AUTO_HOUR: 18, // 24h

  /* ▸▸▸ 4. Browser tab title when the visitor switches away ◂◂◂ */
  TAB_TITLE_AWAY: "← Seats are filling up",

  /* ▸▸▸ 5. Motion budget — set true to kill parallax/tilt everywhere ◂◂◂ */
  LIGHT_MOTION: false,
};

/* ─── helpers shared across modules ─────────────────────────────────── */

DataWranglers.util = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  fine: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  touch: window.matchMedia("(hover: none), (pointer: coarse)").matches,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, n) => a + (b - a) * n,

  /* Heavy motion is dropped for reduced-motion users, explicit opt-out,
     and touch-only devices. Hybrid touch laptops keep the full experience. */
  light() {
    return DataWranglers.CONFIG.LIGHT_MOTION || this.reduced || !this.fine;
  },

  toast(msg, ms = 2200) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove("is-on"), ms);
  },

  /** Copy text with a graceful pre-clipboard-API fallback. */
  copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (e) {
        reject(e);
      } finally {
        ta.remove();
      }
    });
  },
};

/* ─── inject config into the DOM ────────────────────────────────────── */

DataWranglers.applyConfig = function () {
  const C = DataWranglers.CONFIG;

  document.querySelectorAll("[data-register]").forEach((a) => {
    a.setAttribute("href", C.REGISTER_URL);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });

  document.querySelectorAll("[data-mail]").forEach((el) => {
    el.textContent = C.EMAIL;
  });

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
};

/* ─── next-event date resolution ────────────────────────────────────── */

DataWranglers.nextEventDate = function () {
  const C = DataWranglers.CONFIG;
  if (C.EVENT_DATE) {
    const d = new Date(C.EVENT_DATE);
    if (!isNaN(d)) return d;
  }
  const now = new Date();
  let d = new Date(
    now.getFullYear(),
    now.getMonth(),
    C.EVENT_AUTO_DAY,
    C.EVENT_AUTO_HOUR,
    0,
    0,
  );
  if (d.getTime() <= now.getTime()) {
    d = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      C.EVENT_AUTO_DAY,
      C.EVENT_AUTO_HOUR,
      0,
      0,
    );
  }
  return d;
};

/* ─── attention-grabbing tab title ──────────────────────────────────── */

DataWranglers.tabTitle = function () {
  const original = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden
      ? DataWranglers.CONFIG.TAB_TITLE_AWAY
      : original;
  });
  window.addEventListener("blur", () => {
    document.title = DataWranglers.CONFIG.TAB_TITLE_AWAY;
  });
  window.addEventListener("focus", () => {
    document.title = original;
  });
};
