/* Cold cost of technique C with the wall pass T3 / T2 / Off on the real map (whole), 5 and 12 terraces, per Curves preset: E.render with an empty contour cache (S.cache = {}), single technique, median of the runs, ms.
   Chromium headless (software rasteriser, +-30 %), 1500 x 800 window. The ratio column is T3 / Off.
     NODE_PATH=$(npm root -g) node tools/ui/measure_wall.js [runs=3] */
const path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const runs = +(process.argv[2] || 3), a = await open({ w: 1500, h: 800 }), page = a.page, med = (v) => v.slice().sort((x, y) => x - y)[(v.length / 2) | 0];
  await page.setInputFiles('#file', [IMG]); await page.waitForFunction(() => { const S = window.__evo.S(); return S && S.mapW === 256; }, null, { timeout: 90000 }); await a.idle(); await page.click('#mode'); await a.idle(); await a.tech('C');
  const cold = (pr, mode) => page.evaluate(([p, m, n]) => { const e = window.__evo, E = window.EVO, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), v = e.view(), res = []; P.curves = p; P.wallPass = m; for (let k = 0; k < n; k++) { S.cache = {}; const t0 = performance.now(); E.render(cv, S, P, 'C', v, e.O); res.push(performance.now() - t0); } return res; }, [pr, mode, runs]);
  console.log('| terraces | preset | Off | T3 | T2 | T3 / Off |\n|---:|---|---:|---:|---:|---:|');
  for (const terr of [5, 12]) {
    await a.slider('terraces', terr); await a.idle(); await a.tech('C');
    for (const pr of ['ordered', 'balanced', 'natural']) { const o = med(await cold(pr, 'off')), t3 = med(await cold(pr, 't3')), t2 = med(await cold(pr, 't2')); console.log(`| ${terr} | ${pr} | ${o.toFixed(0)} | ${t3.toFixed(0)} | ${t2.toFixed(0)} | ${(t3 / o).toFixed(2)} |`); }
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
