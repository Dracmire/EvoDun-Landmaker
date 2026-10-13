/* Pixel regression with the FLOOR BACKDROP ON at Cam 1 (source "Snake Mountain floors", floor 1 and floor 2, Box / A / B, Cam 1 = isoE). Two outputs in <outDir>:
   <outDir>/cam1: the Cam 1 images with the switch on (compare against the checkout in EVO_ROOT: the fix pass must not change them);
   <outDir>/first and <outDir>/after: the first Cam 1 image and the one after a round trip Cam 1 -> Cam 3 -> Cam 1 with the switch on (they must be identical: no stale cache of the shape that was built for another camera).
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_backdrop_on.js <outDir> [--roundtrip]     then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_backdrop_on.js <outDir> [--roundtrip]'); process.exit(2); }
  const rt = process.argv.includes('--roundtrip'), dirs = rt ? ['first', 'after'] : ['cam1'];
  for (const d of dirs) fs.mkdirSync(path.join(out, d), { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.selectOption('#src', 'snake_floors'); await a.idle(); await page.click('#mode'); await a.idle();
  await page.$eval('#t-backdrop', (e) => { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle();
  const shot = async (k, t, dir) => { await a.preset('isoE'); await a.idle(); await a.preset('isoE'); await a.idle(); fs.writeFileSync(path.join(out, dir, `floor${k}_${t}_isoE_backdrop_on.png`), await a.canvas()); }; // the second redraw settles the info-line height (known limitation 18)
  for (const k of [1, 2]) { await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle();
    for (const t of ['box', 'A', 'B']) { await a.tech(t);
      await shot(k, t, rt ? 'first' : 'cam1');
      if (rt) { await a.preset('oblique'); await a.idle(); await shot(k, t, 'after'); } } }
  console.log('errors:', a.errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
