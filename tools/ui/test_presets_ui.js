/* Rooms presets (Default / Balanced types / Custom), the wider slider ranges, the Room radius slider and the `viewer` block of the manifest (round trip of the seven fields).
     NODE_PATH=$(npm root -g) node tools/ui/test_presets_ui.js */
const fs = require('fs'), path = require('path'), os = require('os');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  const rng = (id) => page.$eval('#s-' + id, (e) => [+e.min, +e.max, +e.value]), sel = () => page.$eval('#roomsPreset', (e) => e.value);
  ok('Min core size 5-250 (20), Min plateau 1-300 (5), Room radius 3-30 (9)', JSON.stringify([await rng('roomsMinCore'), await rng('minPlateau'), await rng('rRadius')]) === JSON.stringify([[5, 250, 20], [1, 300, 5], [3, 30, 9]]));
  ok('the preset selector offers Default, Balanced types and Custom, and starts on Default', JSON.stringify(await page.$$eval('#roomsPreset option', (o) => o.map((x) => x.textContent))) === JSON.stringify(['Default', 'Balanced types', 'Custom']) && (await sel()) === 'default');
  await page.check('#t-rooms'); await a.idle(); await page.check('#t-cake'); await a.idle();
  const st = () => page.evaluate(() => { const e = window.__evo, S = e.S(), P = e.P, c = S.types.counts; return { P: [P.terraces, P.roomsMinCore, P.rRadius, P.minPlateau, P.rooms, P.cake], types: `${c.cake}/${c.diorama}/${c.ascension}`, rooms: S.types.rooms.size, ramps: S.stairs.length, levels: S.maxFine + 1, sliders: ['terraces', 'roomsMinCore', 'rRadius', 'minPlateau'].map((k) => +document.querySelector('#s-' + k).value) }; });
  const d = await st(); ok('default: 31/0/1 of 32 rooms, 140 ramps (the old behaviour)', d.types === '31/0/1' && d.rooms === 32 && d.ramps === 140, JSON.stringify(d));
  const t0 = Date.now(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); const cold = Date.now() - t0, b = await st(), tm = await page.evaluate(() => window.__evo.timing());
  ok('Balanced types: terraces 3, core 100, radius 5 (sliders follow), 32/29/27 of 88 rooms, 54 ramps', JSON.stringify(b.P.slice(0, 3)) === '[3,100,5]' && JSON.stringify(b.sliders.slice(0, 3)) === '[3,100,5]' && b.types === '32/29/27' && b.rooms === 88 && b.ramps === 54, JSON.stringify(b));
  console.log(`  info: Balanced types + Cake: ${b.levels} levels (without Cake: see test_roomtypes), recompute ${cold} ms; compare mode cold: first panels ${tm.first.toFixed(0)} ms, all three ${tm.all.toFixed(0)} ms`);
  await a.slider('rRadius', 6); await a.idle(); ok('moving a slider off the preset shows Custom', (await sel()) === 'custom');
  await a.slider('rRadius', 5); await a.idle(); ok('putting it back shows Balanced types again', (await sel()) === 'balanced');
  await page.selectOption('#roomsPreset', 'default'); await a.idle(); const d2 = await st();
  ok('Default restores terraces 5, core 20, radius 9 and the old picture data (31/0/1, 140 ramps, same levels)', JSON.stringify(d2.P.slice(0, 3)) === '[5,20,9]' && d2.types === d.types && d2.ramps === d.ramps && d2.levels === d.levels, JSON.stringify(d2));
  // manifest round trip: seven fields
  await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); await a.slider('minPlateau', 120); await a.idle(); const before = await st();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveManifest')]); const file = path.join(os.tmpdir(), 'evo_viewer_block.json'); fs.copyFileSync(await dl.path(), file);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok('pack.json carries the viewer block with the seven fields', json.format === 'evodun-pack/0.3' && JSON.stringify(json.viewer) === JSON.stringify({ preset: 'balanced', rooms: true, cake: true, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }), JSON.stringify(json.viewer));
  await page.selectOption('#roomsPreset', 'default'); await a.slider('minPlateau', 5); await page.uncheck('#t-cake'); await page.uncheck('#t-rooms'); await a.idle();
  await page.setInputFiles('#file', [IMG, file]); await page.waitForTimeout(1500); await a.idle();
  const after = await st();
  ok('loading the saved pack restores the seven fields and the same picture data', JSON.stringify(after) === JSON.stringify(before) && (await sel()) === 'balanced' && (await page.$eval('#t-cake', (e) => e.checked)) && (await page.$eval('#t-rooms', (e) => e.checked)), JSON.stringify([before.P, after.P]));
  const plain = Object.assign({}, json); delete plain.viewer; const f2 = path.join(os.tmpdir(), 'evo_no_viewer_block.json'); fs.writeFileSync(f2, JSON.stringify(plain));
  await page.setInputFiles('#file', [IMG, f2]); await page.waitForTimeout(1500); await a.idle();
  ok('a manifest WITHOUT the block loads with the defaults (rooms off, cake off, 5 / 20 / 9 / 5)', JSON.stringify((await page.evaluate(() => { const P = window.__evo.P; return [P.terraces, P.roomsMinCore, P.rRadius, P.minPlateau, P.rooms, P.cake]; }))) === '[5,20,9,5,false,false]' && (await sel()) === 'default');
  console.log('errors:', JSON.stringify(a.errs)); ok('no console errors', a.errs.length === 0); await a.browser.close();
})();
