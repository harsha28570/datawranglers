import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox',
  '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'] });
const p = await b.newPage();
await p.setViewport({width:1440,height:900});
await p.goto('http://localhost:4173/index.html',{waitUntil:'domcontentloaded'});
console.log(await p.evaluate(()=>({
  hH:matchMedia('(hover: hover)').matches, pF:matchMedia('(pointer: fine)').matches,
  hN:matchMedia('(hover: none)').matches,
  fine:Kaleido.util.fine, touch:Kaleido.util.touch, light:Kaleido.util.light()
})));
await b.close();
