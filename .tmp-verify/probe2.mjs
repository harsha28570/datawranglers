import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({width:1440,height:900});
const cdp = await p.createCDPSession();
const setF = async () => cdp.send('Emulation.setEmulatedMedia', { features:[
  {name:'hover',value:'hover'},{name:'pointer',value:'fine'},
  {name:'any-hover',value:'hover'},{name:'any-pointer',value:'fine'}]});
await setF();
await p.goto('http://localhost:4173/index.html',{waitUntil:'domcontentloaded'});
console.log('after setViewport-then-cdp:', await p.evaluate(()=>({fine:Kaleido.util.fine, touch:Kaleido.util.touch, hH:matchMedia('(hover: hover)').matches, pF:matchMedia('(pointer: fine)').matches})));
await setF();
console.log('re-applied after nav      :', await p.evaluate(()=>({hH:matchMedia('(hover: hover)').matches, pF:matchMedia('(pointer: fine)').matches})));
await b.close();
