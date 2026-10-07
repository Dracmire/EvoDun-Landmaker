/* Cake rings in the viewer (real map, 5 terraces, rooms on): the switch, the info, the tint, the same geometry in Box, A and B, off = identical canvases, picking on ring tiles.
     NODE_PATH=$(npm root -g) node tools/ui/test_cake_ui.js */
const path = require('path'), crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = (b) => crypto.createHash('md5').update(b).digest('hex');
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]); await page.waitForTimeout(1500); await a.idle();
  ok('the Cake switch and the type tint toggle exist and are off by default', !(await page.$eval('#t-cake', (e) => e.checked)) && !(await page.$eval('#t-typeTint', (e) => e.checked)));
  await page.check('#t-rooms'); await a.idle(); await page.click('#mode'); await a.idle(); await a.tech('A'); await a.preset('oblique');
  const info = () => page.$eval('#info', (e) => e.innerText), lv = () => page.evaluate(() => window.__evo.S().maxFine + 1);
  const off0 = await a.canvas(), lv0 = await lv();
  ok('rooms on, Cake off: no room-type text (the canvas does not change size)', !/Room types/.test(await info()));
  await page.check('#t-cake'); await a.idle();
  const t1 = await info(), lv1 = await lv(), on = {};
  ok('Cake on: the info gives the types (31 Cake, 0 Diorama, 1 Ascension) and the rings (30 bowls, 40 pyramids)', /31 Cake \(30 bowls, 40 pyramids\) · 0 Diorama · 1 Ascension of 32 rooms/.test(t1) && /Cake rings ON: 30 bowl \+ 40 pyramid links built, 0 links without rings, \d+ ring tiles, \d+ levels added/.test(t1), t1.split('\n').filter((l) => /Room types/.test(l)).join(' '));
  ok('the ring levels are in the ranking', lv1 > lv0 + 10, [lv0, lv1]);
  for (const t of ['box', 'A', 'B']) { await a.tech(t); await a.preset('oblique'); on[t] = hash(await a.canvas()); }
  await page.uncheck('#t-cake'); await a.idle();
  const off = {}; for (const t of ['box', 'A', 'B']) { await a.tech(t); await a.preset('oblique'); off[t] = hash(await a.canvas()); }
  ok('Cake changes the picture in Box, A and B', ['box', 'A', 'B'].every((t) => on[t] !== off[t]));
  await a.tech('A'); await a.preset('oblique'); ok('Cake off again: the canvas is identical to the first one (A, Oblique)', hash(await a.canvas()) === hash(off0));
  await page.check('#t-typeTint'); await a.idle(); const tint = hash(await a.canvas()); ok('the type tint changes the picture and shows the type text', tint !== off.A && /Room types/.test(await info()));
  await page.uncheck('#t-typeTint'); await a.idle();
  // picking on ring tiles (top view, where occlusion is small)
  await page.check('#t-cake'); await a.idle();
  for (const tech of ['box', 'A', 'B']) {
    const r = await page.evaluate(({ tech }) => {
      const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, CW = 1200, CH = 800, view = { yaw: 0, pitch: 80, zoom: 1, panX: 0, panY: 0 }, cam = E.makeCam(S, P, view, CW, CH);
      const rt = []; for (let i = 0; i < S.n; i++) if (S.ringTile[i]) rt.push(i); let got = 0, tot = 0;
      for (let k = 0; k < rt.length && tot < 120; k += Math.max(1, Math.floor(rt.length / 120))) { const i = rt[k], x = i % S.W, y = (i / S.W) | 0, p = cam.p(x + 0.5, y + 0.5, S.levelH[S.fine[i]]), t = E.pickTile(S, P, tech, view, CW, CH, p[0], p[1]); tot++; if (t.tile === i) got++; }
      return { got, tot, rings: rt.length };
    }, { tech });
    ok(`${tech}: a click on the centre of a ring tile resolves to that tile (top view)`, r.tot > 100 && r.got / r.tot >= 0.85, JSON.stringify(r));
  }
  // rooms off: the switch does nothing
  await page.uncheck('#t-rooms'); await a.idle(); await a.tech('A'); await a.preset('oblique'); const ro = hash(await a.canvas()); await page.uncheck('#t-cake'); await a.idle();
  ok('rooms off: the Cake switch changes nothing (identical canvas) and there is no type text', ro === hash(await a.canvas()) && !/Room types/.test(await info()));
  console.log('errors:', JSON.stringify(a.errs)); ok('no console errors', a.errs.length === 0); await a.browser.close();
})();
