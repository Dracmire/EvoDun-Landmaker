const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('file:///home/claude/salat/wt/index.html');
  await p.waitForFunction(() => window.__evo);
  await p.evaluate(() => window.__evo.setMode('stage'));
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const b=[...document.querySelectorAll('#examples button')].find(x=>x.dataset.id==='throne_aliahan'); b.click(); });
  await p.waitForFunction(() => document.querySelector('#busy').hidden && !(window.__evo.slStats().pending), null, {timeout:120000});
  await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => ({ cv: [...document.querySelectorAll('#stage canvas')].map(c=>[c.width,c.height,c.clientWidth,c.clientHeight, c.getBoundingClientRect().toJSON()]), info: document.querySelector('#info').textContent.slice(0,400), ex: window.__evo.st.exampleId, stage: window.__evo.st.stage.tilesPerH })));
  await p.screenshot({path:'/home/claude/salat/out/probe.png'});
  console.log(errs);
  await b.close();
})();
