import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.evaluateOnNewDocument(() => {
  const real = window.matchMedia.bind(window);
  window.matchMedia = q => {
    if (/\(\s*hover\s*:\s*hover\s*\)/.test(q) && !/none/.test(q)) return { matches:true, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null, dispatchEvent(){return false} };
    if (/\(\s*pointer\s*:\s*fine\s*\)/.test(q) && !/coarse/.test(q)) return { matches:true, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null, dispatchEvent(){return false} };
    if (/\(\s*hover\s*:\s*none\s*\)/.test(q)) return { matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null, dispatchEvent(){return false} };
    if (/\(\s*pointer\s*:\s*coarse\s*\)/.test(q)) return { matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null, dispatchEvent(){return false} };
    return real(q);
  };
});
await p.setViewport({width:1440,height:900});
await p.goto('http://localhost:4173/index.html',{waitUntil:'domcontentloaded'});
console.log(await p.evaluate(()=>({ fine:Kaleido.util.fine, touch:Kaleido.util.touch, light:Kaleido.util.light() })));
await b.close();
