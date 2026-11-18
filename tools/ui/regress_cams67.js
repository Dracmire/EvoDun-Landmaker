/* Pixel regression of Cam 6 (stage) and Cam 7 (classic) against the checkout in EVO_ROOT (the commit before Cam 8 existed): the canvases must be identical. Scenes: the old Snake Mountain pack, the real map with rooms on (Default),
   the real map with rooms on, Balanced types, Cake and Ascension walls; Box, A and B (Cam 6 and Cam 7); and mode 3 (the hero tracking of dac_stage, Cam 6, Box) at the first window room and after Next room.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_cams67.js <outDir>      then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_cams67.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  let a = await open({ w: 1500, h: 900 }), page = a.page, CAMS = ['stage', 'classic'];
  const sweep = async (tag) => { for (const t of ['box', 'A', 'B']) { await a.tech(t); for (const c of CAMS) { await a.preset(c); fs.writeFileSync(path.join(out, `${tag}_${t}_${c}.png`), await a.canvas()); } } };
  await page.click('#mode'); await a.idle();
  await page.selectOption('#src', 'snake'); await a.idle(); await sweep('snake');
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await sweep('real_default');
  await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); await page.check('#t-cake'); await a.idle(); await page.check('#t-ascWalls'); await a.idle(); await sweep('real_balanced_cake_walls');
  let errs = a.errs.slice(); await a.browser.close();
  a = await open({ w: 1500, h: 900, modes: true }); page = a.page;
  await page.evaluate(() => window.__evo.setMode('stage')); await a.idle();
  fs.writeFileSync(path.join(out, 'mode3_dac_stage_cam6.png'), await a.canvas());
  await page.click('#stageNext').catch(() => {}); await a.idle(); fs.writeFileSync(path.join(out, 'mode3_dac_stage_next_cam6.png'), await a.canvas());
  errs = errs.concat(a.errs); console.log('errors:', errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(errs)); await a.browser.close(); process.exit(errs.length ? 1 : 0);
})();
