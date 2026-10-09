/* Screenshots of the FIXED TEST SET for tools/verify.sh (never written inside the repo):
     real map (data/samples/skeleton_heightmap_256.png) with rooms on in "Default" and in "Balanced types", and Snake Mountain surface with rooms on,
     each in Box, A and B, Iso (isoE) and Oblique presets; plus extra views: chip:<id> (a room chosen by chip), pocket:<id> (Pocket view of a
     Diorama), walls (Ascension walls on, whole map), all on Balanced types.
     NODE_PATH=$(npm root -g) node tools/ui/verify_shots.js <outDir> [--extra chip:31 --extra pocket:31 --extra walls]
   Snake Mountain is its pure SURFACE pack (snake_surface, 40x40): with rooms on and the Default parameters the layer finds no room and is not applied (the picture is the rooms-off one and the info says so):
   reported as "not applicable", not as a warning or a failure. Last line: "RESULT <json>". */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: verify_shots.js <outDir> [--extra <view>]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const extras = process.argv.reduce((l, v, i, A) => (v === '--extra' && A[i + 1] ? l.concat(A[i + 1]) : l), []);
  const a = await open({ w: 1500, h: 900 }), page = a.page, files = [], warnings = [], notApplicable = [];
  const shot = async (name) => { const f = path.join(out, name + '.png'); fs.writeFileSync(f, await a.canvas()); files.push(f); };
  const sweep = async (tag, presets = ['isoE', 'oblique']) => { for (const t of ['box', 'A', 'B']) { await a.tech(t); for (const p of presets) { await a.preset(p); await shot(`${tag}_${t}_${p}`); } } };
  const chips = () => page.$$eval('#roomChips .chip', (c) => c.length);
  await page.click('#mode'); await a.idle();                       // single-technique view
  // Snake Mountain, rooms on
  await page.selectOption('#src', 'snake_surface'); await a.idle(); await page.check('#t-rooms'); await a.idle();
  const nSnake = await chips(), snakeInfo = await page.$eval('#info', (e) => e.textContent);
  if (nSnake === 0) { if (snakeInfo.includes('rooms layer not applied')) notApplicable.push('snake surface: rooms layer not applied (no rooms found: map too small for the Default parameters); drawn as with rooms off'); else warnings.push('snake surface: 0 rooms and the info does not say the layer was not applied'); }
  await sweep('snake_rooms');
  await page.uncheck('#t-rooms'); await a.idle();
  // real map
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle();
  const nDef = await chips(); if (nDef === 0) warnings.push('real map, Default: 0 rooms');
  await sweep('real_default');
  await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  const nBal = await chips(); if (nBal === 0) warnings.push('real map, Balanced types: 0 rooms');
  await sweep('real_balanced');
  for (const ex of extras) {
    const [kind, arg] = ex.split(':');
    try {
      if (kind === 'chip') { await page.click(`#roomChips .chip[data-id="${arg}"]`); await a.idle(); await sweep(`extra_chip${arg}`, ['isoE']); await page.click('#wholeRooms'); await a.idle(); }
      else if (kind === 'pocket') { await page.check('#t-pocket'); await a.idle(); await page.click(`#roomChips .chip[data-id="${arg}"]`); await a.idle(); await sweep(`extra_pocket${arg}`, ['isoE']); await page.click('#wholeRooms'); await a.idle(); await page.uncheck('#t-pocket'); await a.idle(); }
      else if (kind === 'walls') { await page.check('#t-ascWalls'); await a.idle(); await sweep('extra_walls', ['isoE']); await page.uncheck('#t-ascWalls'); await a.idle(); }
      else warnings.push('unknown extra view: ' + ex);
    } catch (e) { warnings.push(`extra ${ex} failed: ${e.message.split('\n')[0]}`); }
  }
  fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs));
  await a.browser.close();
  console.log('RESULT ' + JSON.stringify({ images: files.length, rooms: { snake: nSnake, realDefault: nDef, realBalanced: nBal }, warnings, notApplicable, errors: a.errs, dir: out }));
  process.exit(a.errs.length ? 1 : 0);
})();
