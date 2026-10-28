process.env.EVO_ROOT = process.env.EVO_ROOT || '/home/user/EvoDun-Landmaker';
const { open } = require('../ui/common.js');
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_chain5"]'); await a.idle();
  const info = () => ev(() => { const e = window.__evo, cv = document.querySelector('#stage canvas'); return { cap: document.querySelector('#stage figcaption').textContent.slice(-40), zoom: +e.st.zoom.toFixed(3), fit: +e.st.fitSc.toFixed(3), cache: Object.keys(e.S().cache).length, css: [cv.clientWidth, cv.clientHeight], px: [cv.width, cv.height], dpr: devicePixelRatio, ctxAttr: JSON.stringify(cv.getContext('2d').getContextAttributes && cv.getContext('2d').getContextAttributes()) }; });
  console.log('start', JSON.stringify(await info()));
  const b = await (await page.$('#stage canvas')).boundingBox(); for (let i = 0; i < 6; i++) { const n = await ev(() => window.__evo.st.draws); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.wheel(0, -100); await page.waitForFunction((n0) => window.__evo.st.draws > n0, n); await a.idle(); }
  console.log('zoomed', JSON.stringify(await info()));
  for (const [name, f] of [['blur+focus events', () => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); }], ['resize event', () => window.dispatchEvent(new Event('resize'))]]) {
    const n = await ev(() => window.__evo.st.draws); await ev(f); await page.waitForTimeout(1500); await a.idle(); console.log(name, 'draws +', (await ev(() => window.__evo.st.draws)) - n, JSON.stringify(await info())); }
  // a real viewport resize (what an un-focus can cause: a scrollbar / dock change) 
  const n = await ev(() => window.__evo.st.draws); await page.setViewportSize({ width: 1490, height: 900 }); await page.waitForTimeout(2000); await a.idle(); console.log('viewport 1490', 'draws +', (await ev(() => window.__evo.st.draws)) - n, JSON.stringify(await info()));
  await a.browser.close();
})();
