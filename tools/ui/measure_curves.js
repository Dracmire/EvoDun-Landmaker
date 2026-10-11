/* Cold cost of technique C (and A / B for comparison): E.render with an empty contour cache (S.cache = {}), single technique, per Curves preset. Sources: the synthetic 256 x 256 maps (zone 6 and the whole map, 12 zones)
   and the real map (whole), 5 and 12 terraces. Chromium headless (software rasteriser, +-30 %), 1500 x 800 window. Then the cold compare timings (first panels / all four) from the slider release.
     NODE_PATH=$(npm root -g) node tools/ui/measure_curves.js [runs=3] */
const path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const runs = +(process.argv[2] || 3), a = await open({ w: 1500, h: 800 }), page = a.page;
  const med = (v) => v.slice().sort((x, y) => x - y)[(v.length / 2) | 0];
  const cold = (tech, preset) => page.evaluate(([t, pr, n]) => { const e = window.__evo, E = window.EVO, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), v = e.view(), O = e.O, res = []; P.curves = pr; for (let k = 0; k < n; k++) { S.cache = {}; const t0 = performance.now(); E.render(cv, S, P, t, v, O); res.push(performance.now() - t0); } return res; }, [tech, preset, runs]);
  const rows = [];
  const sources = [['synthetic maps, zone 6', async () => { await a.load('maps'); await a.zone(6); }], ['synthetic maps, whole map', async () => { await page.click('#wholeMap'); await a.idle(); }], ['real map, whole', async () => { await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle(); }]];
  for (const [name, setup] of sources) {
    await setup(); await page.click('#mode'); await a.idle(); // single technique view
    for (const terr of [5, 12]) {
      await a.slider('terraces', terr); await a.idle();
      const line = { name, terr };
      for (const t of ['A', 'B']) { await a.tech(t); line[t] = med(await cold(t, 'ordered')); }
      await a.tech('C');
      for (const pr of ['ordered', 'balanced', 'natural']) line[pr] = med(await cold('C', pr));
      rows.push(line);
      console.log(`${name}, ${terr} terraces: cold render A ${line.A.toFixed(0)} ms, B ${line.B.toFixed(0)} ms, C ordered ${line.ordered.toFixed(0)} ms, balanced ${line.balanced.toFixed(0)} ms, natural ${line.natural.toFixed(0)} ms`);
    }
    await page.click('#mode'); await a.idle(); // back to compare
    for (const terr of [5, 12]) for (const pr of ['ordered', 'balanced', 'natural']) {
      await page.evaluate((p) => { window.__evo.P.curves = p; }, pr); const sel = await page.$('#curvesPreset'); if (sel) await sel.selectOption(pr);
      const first = [], all = [];
      for (let k = 0; k < runs; k++) { await a.slider('terraces', terr === 5 ? 6 : terr - 1); await a.idle(); await a.slider('terraces', terr); await a.idle(); const tm = await page.evaluate(() => window.__evo.timing()); first.push(tm.first); all.push(tm.all); }
      console.log(`  compare ${name}, ${terr} terraces, ${pr}: first panels (Box + A) ${med(first).toFixed(0)} ms, all four ${med(all).toFixed(0)} ms`);
    }
    await page.click('#mode'); await a.idle(); await page.click('#mode'); await a.idle();
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
