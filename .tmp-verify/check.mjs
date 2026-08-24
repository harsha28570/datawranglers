import puppeteer from 'puppeteer';
import fs from 'node:fs';

const URL = 'http://localhost:4173/index.html';
const OUT = 'shots';
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP_MQ = () => {
  const real = window.matchMedia.bind(window);
  const mk = (m, q) => ({ matches: m, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent() { return false; } });
  window.matchMedia = q => {
    if (/\(\s*hover\s*:\s*hover\s*\)/.test(q) && !/none/.test(q)) return mk(true, q);
    if (/\(\s*pointer\s*:\s*fine\s*\)/.test(q) && !/coarse/.test(q)) return mk(true, q);
    if (/\(\s*hover\s*:\s*none\s*\)/.test(q)) return mk(false, q);
    if (/\(\s*pointer\s*:\s*coarse\s*\)/.test(q)) return mk(false, q);
    return real(q);
  };
};

const errors = [], failed = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'] });

/* ══════════ DESKTOP ══════════ */
const page = await browser.newPage();
await page.evaluateOnNewDocument(DESKTOP_MQ);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', r => failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(5500);

console.log('── DESKTOP BOOT ──');
console.log(JSON.stringify(await page.evaluate(() => ({
  fine: Kaleido.util.fine, light: Kaleido.util.light(),
  cursorOn: document.documentElement.classList.contains('is-cursor-on'),
  cursorDotVisible: getComputedStyle(document.querySelector('.cursor__dot')).display,
  scrollTriggersLive: ScrollTrigger.getAll().length,
  pinSpacer: !!document.querySelector('.pin-spacer'),
  tiltBound: !!document.querySelector('[data-tilt]')?.vanillaTilt,
  splitLines: document.querySelectorAll('.split-line').length,
  scrollcue: (()=>{ const el=document.querySelector('.scrollcue'); const r=el.getBoundingClientRect(); return {op:getComputedStyle(el).opacity, x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width)}; })(),
  workMeta: getComputedStyle(document.querySelector('.work__titleMeta')).fontSize,
  ghostNums: document.querySelectorAll('.card__ghost').length,
  statPctInline: (()=>{ const b=document.querySelectorAll('.hero__stat b')[2]; const r=b.getBoundingClientRect(); return Math.round(r.height); })(),
  splitInners: document.querySelectorAll('.split-inner').length,
  marqueeGroups: document.querySelector('.marquee__track').children.length,
  preloaderGone: getComputedStyle(document.getElementById('preloader')).display === 'none',
  heroRevealed: getComputedStyle(document.querySelector('.hero__lineIn')).opacity === '1'
})), null, 1));
await page.screenshot({ path: `${OUT}/01-hero.png` });

/* cursor follows */
await page.mouse.move(700, 400); await sleep(500);
await page.mouse.move(980, 620); await sleep(700);
const cursorPos = await page.evaluate(() => document.querySelector('.cursor__ring').style.transform);
await page.mouse.move(700, 500); await sleep(300);
await page.hover('.nav__cta'); await sleep(700);
const cursorHover = await page.evaluate(() => ({
  cls: document.getElementById('cursor').className,
  label: document.querySelector('.cursor__label').textContent,
  ringW: getComputedStyle(document.querySelector('.cursor__ring')).width
}));
console.log('── CURSOR ── ring=' + cursorPos + ' | hover=' + JSON.stringify(cursorHover));
await page.screenshot({ path: `${OUT}/02-cursor.png` });

/* about */
await page.evaluate(() => Kaleido.SmoothScroll.to(document.querySelector('#about')));
await sleep(2500);
console.log('── ABOUT ── ' + JSON.stringify(await page.evaluate(() => ({
  lit: document.querySelectorAll('.word.is-lit, .word.is-hot').length,
  total: document.querySelectorAll('.word').length,
  hotRed: getComputedStyle(document.querySelector('.word.is-hot') || document.body).color,
  serviceY: getComputedStyle(document.querySelector('.service')).transform,
  serviceOpacity: getComputedStyle(document.querySelector('.service')).opacity
}))));
await page.screenshot({ path: `${OUT}/03-about.png` });

/* marquee */
const m1 = await page.evaluate(() => getComputedStyle(document.querySelector('.marquee__track')).transform);
await sleep(700);
const m2 = await page.evaluate(() => getComputedStyle(document.querySelector('.marquee__track')).transform);
console.log('── MARQUEE ── moved=' + (m1 !== m2) + '  ' + m1 + ' → ' + m2);

/* work + tilt */
await page.evaluate(() => Kaleido.SmoothScroll.to(document.querySelector('#work')));
await sleep(2500);
const cardBox = await page.$eval('.card--xl', el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await page.mouse.move(cardBox.x, cardBox.y); await sleep(900);
console.log('── TILT ── ' + JSON.stringify(await page.$eval('.card--xl', el => ({
  style: el.getAttribute('style'),
  border: getComputedStyle(el).borderTopColor,
  innerZ: getComputedStyle(el.querySelector('.card__inner')).transform
}))));
await page.screenshot({ path: `${OUT}/04-work-tilt.png` });
await page.mouse.move(20, 20);
await page.evaluate(() => Kaleido.SmoothScroll.to(document.querySelector('#work')));
await sleep(1200);
await page.screenshot({ path: `${OUT}/05-work.png` });

/* archive pin */
await page.evaluate(() => Kaleido.SmoothScroll.to(document.querySelector('#archive')));
await sleep(1800);
const p1 = await page.evaluate(() => ({ y: window.scrollY, x: getComputedStyle(document.querySelector('.rail__track')).transform, pinned: !!document.querySelector('.pin-spacer') }));
await page.evaluate(() => { const l = Kaleido.SmoothScroll.instance; l.scrollTo(l.scroll + 1400); });
await sleep(2600);
const p2 = await page.evaluate(() => ({ y: window.scrollY, x: getComputedStyle(document.querySelector('.rail__track')).transform }));
console.log('── ARCHIVE PIN ── ' + JSON.stringify({ ...p1, after: p2, railMoved: p1.x !== p2.x }));
console.log('   archive fill: ' + JSON.stringify(await page.evaluate(() => {
  const a = document.querySelector('.archive').getBoundingClientRect();
  return { top: Math.round(a.top), h: Math.round(a.height), vh: innerHeight };
})));
await page.screenshot({ path: `${OUT}/06-archive-pinned.png` });

/* cta + magnetic + liquid fill */
await page.evaluate(() => Kaleido.SmoothScroll.to(document.querySelector('#register')));
await sleep(2000);
const bb = await page.$eval('.btnMagnet', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.mouse.move(bb.x + bb.w * 0.8, bb.y + bb.h * 0.7); await sleep(900);
console.log('── MAGNETIC ── ' + JSON.stringify(await page.evaluate(() => ({
  btnTransform: document.querySelector('.btnMagnet').style.transform,
  fillTransform: getComputedStyle(document.querySelector('.btnMagnet__fill')).transform,
  borderColor: getComputedStyle(document.querySelector('.btnMagnet')).borderTopColor,
  textColor: getComputedStyle(document.querySelector('.btnMagnet__label')).color
}))));
await page.screenshot({ path: `${OUT}/07-cta-magnet.png` });
await page.mouse.move(30, 30); await sleep(1400);
console.log('   after leave → ' + await page.$eval('.btnMagnet', el => el.style.transform));
await page.screenshot({ path: `${OUT}/08-cta.png` });

/* footer */
await page.evaluate(() => Kaleido.SmoothScroll.to(document.querySelector('.footer')));
await sleep(2000);
await page.screenshot({ path: `${OUT}/09-footer.png` });

/* scroll progress at bottom */
console.log('── PROGRESS ── ' + await page.evaluate(() => getComputedStyle(document.querySelector('.progress__fill')).transform));

/* full page */
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(1500);
await page.screenshot({ path: `${OUT}/10-full.png`, fullPage: true });

/* ══════════ REDUCED MOTION ══════════ */
const rm = await browser.newPage();
await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await rm.setViewport({ width: 1440, height: 900 });
const rmErr = [];
rm.on('pageerror', e => rmErr.push(e.message));
await rm.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3000);
console.log('\n── REDUCED MOTION ── ' + JSON.stringify(await rm.evaluate(() => ({
  preloaderGone: getComputedStyle(document.getElementById('preloader')).display === 'none',
  heroVisible: getComputedStyle(document.querySelector('.hero__lineIn')).opacity,
  heroTransform: getComputedStyle(document.querySelector('.hero__lineIn')).transform,
  cardVisible: getComputedStyle(document.querySelector('.bento .card')).opacity,
  cursorHidden: getComputedStyle(document.getElementById('cursor')).display,
  litWords: document.querySelectorAll('.word.is-lit, .word.is-hot').length,
  scrollTriggers: ScrollTrigger.getAll().length,
  scrollable: document.documentElement.scrollHeight > window.innerHeight
}))) + ' errors=' + JSON.stringify(rmErr));
await rm.screenshot({ path: `${OUT}/11-reduced.png` });

/* ══════════ NO-JS ══════════ */
const nj = await browser.newPage();
await nj.setJavaScriptEnabled(false);
await nj.setViewport({ width: 1440, height: 900 });
await nj.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(1200);
console.log('\n── NO JS ── ' + JSON.stringify(await nj.evaluate(() => ({
  preloaderBlocking: getComputedStyle(document.getElementById('preloader')).display !== 'none',
  heroTitleVisible: getComputedStyle(document.querySelector('.hero__title')).opacity,
  cardsVisible: getComputedStyle(document.querySelector('.bento .card')).opacity
}))));
await nj.screenshot({ path: `${OUT}/12-nojs.png` });

/* ══════════ MOBILE ══════════ */
const mob = await browser.newPage();
const mobErr = [];
mob.on('pageerror', e => mobErr.push(e.message));
mob.on('console', c => { if (c.type() === 'error') mobErr.push(c.text()); });
await mob.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await mob.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(5500);
console.log('\n── MOBILE 390 ── ' + JSON.stringify(await mob.evaluate(() => ({
  hOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  cursor: getComputedStyle(document.getElementById('cursor')).display,
  btnTapH: Math.round(document.querySelector('.btnMagnet').getBoundingClientRect().height),
  navTapH: Math.round(document.querySelector('.nav__cta').getBoundingClientRect().height),
  bentoCols: getComputedStyle(document.querySelector('.bento')).gridTemplateColumns.split(' ').length,
  railScrollable: document.querySelector('.rail').scrollWidth > document.querySelector('.rail').clientWidth,
  railPinned: !!document.querySelector('.pin-spacer'),
  heroRevealed: getComputedStyle(document.querySelector('.hero__lineIn')).opacity,
  tiltBound: !!document.querySelector('[data-tilt]')?.vanillaTilt
}))) + ' errors=' + JSON.stringify(mobErr));
await mob.screenshot({ path: `${OUT}/m1-hero.png` });
await mob.evaluate(() => document.querySelector('#work').scrollIntoView());
await sleep(2000);
await mob.screenshot({ path: `${OUT}/m2-work.png` });
await mob.evaluate(() => document.querySelector('#register').scrollIntoView());
await sleep(2000);
await mob.screenshot({ path: `${OUT}/m3-cta.png` });

/* ══════════ TABLET ══════════ */
const tab = await browser.newPage();
await tab.evaluateOnNewDocument(DESKTOP_MQ);
await tab.setViewport({ width: 768, height: 1024 });
await tab.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(5000);
console.log('\n── TABLET 768 ── ' + JSON.stringify(await tab.evaluate(() => ({
  hOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  railPinned: !!document.querySelector('.pin-spacer')
}))));
await tab.screenshot({ path: `${OUT}/t1-hero.png` });

console.log('\n════ ERRORS (' + errors.length + ') ════');
errors.forEach(e => console.log('  ✗ ' + e));
console.log('════ FAILED REQUESTS (' + failed.length + ') ════');
failed.forEach(f => console.log('  ✗ ' + f));

await browser.close();
