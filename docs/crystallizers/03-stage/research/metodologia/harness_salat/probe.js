const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('file:///home/claude/salat/wt/index.html');
  await p.waitForFunction(() => window.__evo);
  console.log(await p.evaluate(() => ({ modes: window.EVO.modes.list ? window.EVO.modes.list.map(m=>m.id) : Object.keys(window.EVO.modes), cv: [...document.querySelectorAll('#stage canvas')].map(c=>[c.width,c.height,c.clientWidth,c.clientHeight]) })));
  console.log(errs);
  await b.close();
})();
