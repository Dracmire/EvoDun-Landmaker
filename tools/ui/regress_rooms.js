/* Pixel regression with ROOMS ON on the fixed test set (real map, 5 terraces, rooms on, the rest by default): the room types are classified but, with the Cake switch off and the
   type tint off, the canvases must be identical to the checkout in EVO_ROOT (the commit before the technique).
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_rooms.js <outDir> [--cake] [--balanced] [--noDD]     (--noDD: rule "Diorama never touches Diorama" off, to compare it with the same checkout, rule on)  then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_rooms.js <outDir> [--cake]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.click('#mode'); await a.idle();
  if (process.argv.includes('--balanced')) { await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); }
  if (process.argv.includes('--noDD')) { await page.evaluate(() => { window.__evo.P.dioNoTouch = false; window.__evo.draw(); }); await a.idle(); }
  if (process.argv.includes('--cake')) { await page.check('#t-cake'); await a.idle(); }
  for (const t of ['box', 'A', 'B']) { await a.tech(t); for (const p of ['oblique', 'isoE']) { await a.preset(p); fs.writeFileSync(path.join(out, `rooms_${t}_${p}.png`), await a.canvas()); } }
  console.log('errors:', a.errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
