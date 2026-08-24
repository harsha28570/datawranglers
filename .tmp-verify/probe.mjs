import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
const p = await b.newPage();
const cdp = await p.createCDPSession();
await cdp.send('Emulation.setEmulatedMedia', { features:[
  {name:'hover',value:'hover'},{name:'pointer',value:'fine'},
  {name:'any-hover',value:'hover'},{name:'any-pointer',value:'fine'}]});
await p.setViewport({width:1440,height:900});
await p.goto('http://localhost:4173/index.html',{waitUntil:'domcontentloaded'});
console.log(await p.evaluate(()=>({
  hoverHover: matchMedia('(hover: hover)').matches,
  pointerFine: matchMedia('(pointer: fine)').matches,
  hoverNone: matchMedia('(hover: none)').matches,
  coarse: matchMedia('(pointer: coarse)').matches,
  fine: Kaleido.util.fine, touch: Kaleido.util.touch, reduced: Kaleido.util.reduced, light: Kaleido.util.light()
})));
await b.close();
