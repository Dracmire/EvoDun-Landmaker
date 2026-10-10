/* Screenshots of the FIXED TEST SET for tools/verify.sh (never written inside the repo):
     the three CORE EXAMPLES: the real map (data/samples/skeleton_heightmap_256.png) with rooms on in "Default" and in "Balanced types" (numeric), Shrine-Pier (semantic landmarks) and Snake Mountain
     surface (semantic macroform) with rooms on, each in Box, A and B, Iso (isoE) and Oblique presets; plus extra views (Balanced types): chip:<id> (a room chosen by chip), pocket:<id> (Pocket view of a
     Diorama), walls (Ascension walls on, whole map), shrine (Shrine-Pier). An extra takes the camera of the bank as a suffix (`@stage`, `@classic`, any preset id; default isoE) and `+play` adds a
     shot at play scale (55 px per tile, centred on the room / the Shrine) next to the fitted one: `pocket:31@stage+play`.
     NODE_PATH=$(npm root -g) node tools/ui/verify_shots.js <outDir> [--extra chip:31 --extra pocket:31@stage+play --extra walls --extra shrine@classic+play]
   Snake Mountain is its pure SURFACE pack (snake_surface, 40x40) and Shrine-Pier is 10x10: with rooms on and the Default parameters the layer finds no room and is not applied (the picture is the rooms-off one and the info says so):
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
  // Shrine-Pier, rooms on (still on)
  await page.selectOption('#src', 'shrine_pier'); await a.idle();
  const nShrine = await chips(), shrineInfo = await page.$eval('#info', (e) => e.textContent);
  if (nShrine === 0) { if (shrineInfo.includes('rooms layer not applied')) notApplicable.push('shrine pier: rooms layer not applied (no rooms found: map too small for the Default parameters); drawn as with rooms off'); else warnings.push('shrine pier: 0 rooms and the info does not say the layer was not applied'); }
  await sweep('shrine_rooms');
  await page.uncheck('#t-rooms'); await a.idle();
  // real map
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle();
  const nDef = await chips(); if (nDef === 0) warnings.push('real map, Default: 0 rooms');
  await sweep('real_default');
  await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  const nBal = await chips(); if (nBal === 0) warnings.push('real map, Balanced types: 0 rooms');
  await sweep('real_balanced');
  // play scale: 55 px per tile centred on the room (centroid of the slice / the chosen room) or on the Shrine
  const playShot = async (name, spot) => {
    const info = await page.evaluate((spot) => {
      const e = window.__evo, S = e.S(); let x = S.W / 2, y = S.H / 2;
      if (spot) { x = spot[0]; y = spot[1]; } else if (S.sliceBox) { x = (S.sliceBox.x0 + S.sliceBox.x1) / 2; y = (S.sliceBox.y0 + S.sliceBox.y1) / 2; } else if (S.slice) { let sx = 0, sy = 0, n = 0; for (let i = 0; i < S.n; i++) if (S.slice[i]) { sx += i % S.W; sy += (i / S.W) | 0; n++; } if (n) { x = sx / n; y = sy / n; } }
      const i = Math.min(S.n - 1, Math.max(0, (Math.floor(y) * S.W + Math.floor(x)))); return { x: x + 0.5, y: y + 0.5, h: S.levelH[S.fine[i]], fit: e.st.fitSc };
    }, spot || null);
    await a.focus(info.x, info.y, info.h, 55 / info.fit); await shot(name);
  };
  const camOf = (ex) => { const m = ex.match(/@([A-Za-z0-9]+)/); return m ? m[1] : 'isoE'; };
  extras.sort((p, q) => (p.startsWith('shrine') ? 1 : 0) - (q.startsWith('shrine') ? 1 : 0)); // shrine changes the source (the room chips go away), so it runs last
  for (const ex of extras) {
    const [kind, arg0] = ex.replace(/@.*$/, '').split(':'), arg = arg0, cam = camOf(ex), play = ex.includes('+play'), tag = cam === 'isoE' ? '' : '_' + cam;
    const doView = async (name) => { for (const t of ['box', 'A', 'B']) { await a.tech(t); await a.preset(cam); await shot(`${name}${tag}_${t}_${cam}`); if (play && t !== 'B') await playShot(`${name}${tag}_${t}_${cam}_play`); } };
    try {
      if (kind === 'chip') { await page.click(`#roomChips .chip[data-id="${arg}"]`); await a.idle(); await doView(`extra_chip${arg}`); await page.click('#wholeRooms'); await a.idle(); }
      else if (kind === 'pocket') { await page.check('#t-pocket'); await a.idle(); await page.click(`#roomChips .chip[data-id="${arg}"]`); await a.idle(); await doView(`extra_pocket${arg}`); await page.click('#wholeRooms'); await a.idle(); await page.uncheck('#t-pocket'); await a.idle(); }
      else if (kind === 'walls') { await page.check('#t-ascWalls'); await a.idle(); await doView('extra_walls'); await page.uncheck('#t-ascWalls'); await a.idle(); }
      else if (kind === 'shrine') { await page.uncheck('#t-rooms'); await a.idle(); await page.selectOption('#src', 'shrine_pier'); await a.idle(); await doView('extra_shrine'); }
      else warnings.push('unknown extra view: ' + ex);
    } catch (e) { warnings.push(`extra ${ex} failed: ${e.message.split('\n')[0]}`); }
  }
  fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs));
  await a.browser.close();
  console.log('RESULT ' + JSON.stringify({ images: files.length, rooms: { snake: nSnake, shrine: nShrine, realDefault: nDef, realBalanced: nBal }, warnings, notApplicable, errors: a.errs, dir: out }));
  process.exit(a.errs.length ? 1 : 0);
})();
