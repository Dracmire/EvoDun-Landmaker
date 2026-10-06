/* Cold time of the compare view: from the slider release (a new shape, empty contour caches) to the first panels (shape + Box + A)
   and to all three (B included). Chromium headless (software rasteriser, +-30 %), 1500x800 window, 256x256 synthetic map.
     NODE_PATH=$(npm root -g) node tools/ui/measure_compare.js [runs=3] */
const { open } = require('./common');
(async () => {
  const runs = +(process.argv[2] || 3), a = await open({ w: 1500, h: 800 }), page = a.page, rows = [];
  await a.load('maps');
  const med = (v) => v.slice().sort((x, y) => x - y)[(v.length / 2) | 0];
  for (const [slice, setSlice] of [['zone 6', async () => a.zone(6)], ['whole map', async () => { await page.click('#wholeMap'); await a.idle(); }]]) {
    await setSlice();
    for (const [terr, subs] of [[5, 3], [12, 3], [24, 3]]) {
      await a.slider('subs', subs); await a.idle();
      const first = [], all = [];
      for (let k = 0; k < runs; k++) {
        await a.slider('terraces', terr === 5 ? 6 : terr - 1); await a.idle();      // another shape first, so the next one is cold
        await a.slider('terraces', terr); await a.idle();
        const tm = await page.evaluate(() => window.__evo.timing());
        first.push(tm.first); all.push(tm.all);
      }
      rows.push({ slice, terr, subs, first: med(first), all: med(all), layout: 'columns' });
      console.log(`${slice}, ${terr} terraces x ${subs}: first panels (Box + A) ${med(first).toFixed(0)} ms, all three ${med(all).toFixed(0)} ms (B alone ~${(med(all) - med(first)).toFixed(0)} ms)`);
    }
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
