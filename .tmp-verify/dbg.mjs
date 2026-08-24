import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.evaluateOnNewDocument(() => {
  const real = window.matchMedia.bind(window);
  const mk=(m,q)=>({matches:m,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},onchange:null,dispatchEvent(){return false}});
  window.matchMedia = q => {
    if (/\(\s*hover\s*:\s*hover\s*\)/.test(q) && !/none/.test(q)) return mk(true,q);
    if (/\(\s*pointer\s*:\s*fine\s*\)/.test(q) && !/coarse/.test(q)) return mk(true,q);
    if (/\(\s*hover\s*:\s*none\s*\)/.test(q)) return mk(false,q);
    if (/\(\s*pointer\s*:\s*coarse\s*\)/.test(q)) return mk(false,q);
    return real(q);
  };
});
p.on('pageerror', e=>console.log('PAGEERROR', e.message));
p.on('console', c=>{ if(c.type()==='error') console.log('CONSOLE-ERR', c.text()); });
await p.setViewport({width:1440,height:900});
await p.goto('http://localhost:4173/index.html',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,5500));

// dump every reveal-up ScrollTrigger BEFORE scrolling
console.log('reveal-up triggers:', JSON.stringify(await p.evaluate(()=>{
  return gsap.utils.toArray('.reveal-up').map(el=>{
    const st = ScrollTrigger.getAll().find(s => s.animation && s.animation.targets().includes(el));
    const r = el.getBoundingClientRect();
    return { cls: el.className, top: Math.round(r.top), hasST: !!st, stStart: st?Math.round(st.start):null, stEnd: st?Math.round(st.end):null, progress: st?st.progress:null, opacity: getComputedStyle(el).opacity };
  });
})));

console.log('\ntotal STs:', await p.evaluate(()=>ScrollTrigger.getAll().length));
console.log('ST list:', JSON.stringify(await p.evaluate(()=>ScrollTrigger.getAll().map((s,i)=>({
  i, trigger: s.trigger ? (s.trigger.className||s.trigger.tagName) : null,
  start: Math.round(s.start), end: Math.round(s.end), once: !!s.vars.once, pin: !!s.vars.pin
})))));

await p.evaluate(()=>Kaleido.SmoothScroll.to(document.querySelector('#about')));
await new Promise(r=>setTimeout(r,3000));
console.log('\nAFTER scroll y=' + await p.evaluate(()=>Math.round(window.scrollY)));
console.log('reveal-up after:', JSON.stringify(await p.evaluate(()=>gsap.utils.toArray('.reveal-up').map(el=>({
  top: Math.round(el.getBoundingClientRect().top), op: getComputedStyle(el).opacity, y: getComputedStyle(el).transform
})))));
await b.close();
