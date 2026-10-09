/* Pixel regression of the CAMERA BANK, Cam 1-5 (orthographic: isoE, isoW, oblique, low, top): the canvases must be identical to the checkout in EVO_ROOT (the commit before the bank).
   Scenes: the old Snake Mountain pack (rooms off), the real map with rooms on (Default) and the real map with rooms on, Balanced types, Cake and Ascension walls on; Box, A and B.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_cams.js <outDir>      then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_cams.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page, CAMS = ['isoE', 'isoW', 'oblique', 'low', 'top'];
  const sweep = async (tag) => { for (const t of ['box', 'A', 'B']) { await a.tech(t); for (const c of CAMS) { await a.preset(c); fs.writeFileSync(path.join(out, `${tag}_${t}_${c}.png`), await a.canvas()); } } };
  await page.click('#mode'); await a.idle();
  await page.selectOption('#src', 'snake'); await a.idle(); await sweep('snake');
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await sweep('real_default');
  await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); await page.check('#t-cake'); await a.idle(); await page.check('#t-ascWalls'); await a.idle(); await sweep('real_balanced_cake_walls');
  console.log('errors:', a.errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
