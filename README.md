# KALEIDO® — single-page experience studio site

A dark, editorial, motion-heavy one-pager: **black canvas · red display type · white body · electric-blue accents.**
Built with vanilla HTML/CSS/JS + GSAP (ScrollTrigger, SplitText) + Lenis + vanilla-tilt, all from CDN.

Open `index.html` in a browser and it just works. No build step.

## Make it yours — one file to edit

Everything personal lives in **`js/config.js`**:

| Key | What it controls |
|---|---|
| `REGISTER_URL` | Your registration form (Google Forms / Luma / Eventbrite…). Applied to every REGISTER button automatically. |
| `EMAIL` | Footer email + click-to-copy. |
| `EVENT_DATE` | Countdown target (`'2026-09-14T18:00:00'`). Leave `null` to auto-roll to the next 14th of a month. |
| `TAB_TITLE_AWAY` | The "come back" tab title when visitors switch tabs. |
| `LIGHT_MOTION` | Set `true` to disable parallax / tilt / pin everywhere. |

Text, services, work cards and archive entries are plain HTML in `index.html` — edit the words, keep the classes.

## Before going live

1. **OG image** — `assets/images/og-cover.jpg` exists; change `example.com` in the `og:url` / `og:image` meta tags to your real domain.
2. **Socials** — swap the three `href`s in the footer.
3. **Analytics** — uncomment the Plausible/Umami snippet in the `<head>` of `index.html`.
4. **Favicon** — currently an inline SVG data-URI (red K mark). Replace the `rel="icon"` href with your own file if you prefer.
5. Brand rename: search-replace `KALEIDO` in `index.html` (+ the preloader word).

## What's inside (the fun parts)

- Preloader: 0→100 counter, blue progress hairline, expo wipe reveal.
- Lenis smooth scroll bridged to GSAP ScrollTrigger; top scroll-progress bar with blue glow.
- Custom cursor (8px difference dot + lagged ring, red ring + label on interactive elements; auto-disabled on touch).
- Hero: split-line staggered headline, outlined word, generative particle canvas with cursor repulsion, rotating circular type, mouse-follow blue glow, giant parallax ghost wordmark.
- About: scroll-scrubbed word-by-word highlight (muted → white, `.hl` words → red), numbered service rows with blue accent sweep.
- Velocity-reactive infinite marquee.
- Bento showcase: asymmetric grid, film-grain cards, 3D tilt (max 8°) + glare, clip-path reveals, ghost numerals.
- Pinned horizontal archive rail (ScrollTrigger pin + scrub; native snap-scroll on touch).
- Registration CTA: magnetic button with elastic snap-back + blue liquid fill, live countdown, breathing red glow.
- Footer: click-to-copy email with toast, underline-slide socials, back-to-top.
- Film-grain overlay, `::selection` red, custom thin scrollbar, attention tab title.
- Accessibility: semantic sections, aria-labels, skip link, focus-visible rings, full `prefers-reduced-motion` fallback, readable without JS.

## File map

```
index.html
css/   reset · variables · global · hero · about · showcase · cta · footer
js/    config · preloader · smooth-scroll · cursor · animations · main
assets/images/og-cover.jpg
```

## Verify locally

The ` .tmp-verify/` folder contains the headless-browser test harness used during
development (`node check.mjs` against a local static server) — delete it before shipping.
