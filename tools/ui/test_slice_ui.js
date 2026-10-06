/* UI test: slice controls, sliders that recompute on release, terrace/sub-terrace controls, warnings.
     python3 tools/ui/gen_maps.py && NODE_PATH=$(npm root -g) node tools/ui/test_slice_ui.js */
const fs = require('fs'), path = require('path');
const { open, mapFile, CACHE } = require('./common');
(async () => {
  const a = await open(), { page, ok } = a;
  const info = () => page.evaluate(() => { const s = window.__evo.S(); return { spec: window.__evo.sliceSpec(), tiles: s.sliceInfo ? s.sliceInfo.tiles : null, win: [s.ox, s.oy, s.W, s.H], slice: !!s.slice }; });
  const msg = () => page.$eval('#msg', (e) => (e.hidden ? '' : e.textContent));
  const infoText = () => page.$eval('#info', (e) => e.innerText);
  const input = async (id, v, ev = 'change') => { await page.fill('#' + id, String(v)); await page.dispatchEvent('#' + id, ev); };
  await a.page.click('#mode'); await a.tech('A');
  ok('terraces slider goes up to 24, sub-terraces up to 6', (await page.$eval('#s-terraces', (e) => e.max)) === '24' && (await page.$eval('#s-subs', (e) => e.max)) === '6');
  ok('climb limit is labelled provisional', (await page.$$eval('#sliders label.sl span', (e) => e.map((x) => x.textContent))).some((t) => /Climb limit.*provisional/.test(t)));
  await a.load('maps');
  let r = await info(); ok('default: one zone, the lowest id', JSON.stringify(r.spec.zones) === '[1]' && r.tiles === 5024, JSON.stringify(r.spec));
  await page.click('#zoneChips .chip[data-id="2"]', { modifiers: ['Control'] }); await a.idle();
  r = await info(); ok('ctrl-click adds a zone', JSON.stringify(r.spec.zones) === '[1,2]' && r.tiles === 5024 + 6173, r.tiles);
  await page.click('#zoneChips .chip[data-id="2"]', { modifiers: ['Shift'] }); await a.idle();
  ok('shift-click removes it', JSON.stringify((await info()).spec.zones) === '[1]');
  await a.zone(3); r = await info(); ok('plain click = only this zone', JSON.stringify(r.spec.zones) === '[3]' && r.tiles === 5021);
  await page.click('#wholeMap'); await a.idle(); r = await info(); ok('whole map: no slice', r.spec === null && !r.slice && r.win[2] === 256);
  await a.zone(6);
  for (const [id, v] of [['cx0', 120], ['cy0', 100], ['cx1', 170], ['cy1', 150]]) await input(id, v);
  await a.idle(); r = await info();
  const want = await page.evaluate(() => { const ids = window.__evo.packs.image.pack.fields.zone.sliceIds; let n = 0; for (let y = 100; y < 150; y++) for (let x = 120; x < 170; x++) if (ids[y * 256 + x] === 6) n++; return n; });
  ok('zone ∩ crop', r.tiles === want && want > 0, `${r.tiles} vs ${want}`);
  await input('cx0', 300); await a.idle(); r = await info();
  ok('empty slice: clear message and the whole map is shown', /slice is empty/.test(await msg()) && !r.slice, await msg());
  await input('cx0', 120); await a.idle(); ok('recovers, error gone', (await info()).slice && !/empty/.test(await msg()));
  for (const id of ['cx0', 'cy0', 'cx1', 'cy1']) await input(id, ''); await a.idle();

  await page.evaluate(() => { window.__calls = 0; const o = window.EVO.shape; window.EVO.shape = function () { window.__calls++; return o.apply(this, arguments); }; });
  const sl = (id, v, ev) => page.evaluate(({ id, v, ev }) => { const el = document.querySelector('#s-' + id); el.value = v; el.dispatchEvent(new Event(ev, { bubbles: true })); return document.querySelector('#busy').hidden; }, { id, v, ev });
  const before = await info();
  for (const v of [10, 14, 20, 30]) await sl('margin', v, 'input');
  await page.waitForTimeout(500);
  ok('dragging does not recompute', (await page.evaluate(() => window.__calls)) === 0 && JSON.stringify((await info()).win) === JSON.stringify(before.win));
  ok('label follows the drag', (await page.$eval('#o-margin', (e) => e.textContent)) === '30');
  ok('release shows "computing…" at once', (await sl('margin', 30, 'change')) === false); await a.idle();
  ok('release recomputes once and widens the window', (await page.evaluate(() => window.__calls)) === 1 && (await info()).win[2] > before.win[2]);
  await sl('margin', 24, 'change'); await a.idle();

  await sl('subs', 6, 'change'); await a.idle();
  ok('6 sub-terraces: height is limited and says so', !(await page.$eval('#subHnote', (e) => e.hidden)) && /limited to 0\.133/.test(await page.$eval('#subHnote', (e) => e.textContent)));
  ok('terraces / levels inside the slice are shown', /\d+ terraces, \d+ levels in the slice/.test(await infoText()), await infoText());
  await sl('subs', 3, 'change'); await a.idle();
  ok('back to the default: no note', await page.$eval('#subHnote', (e) => e.hidden));

  await page.click('#zoneChips .chip[data-id="7"]'); await a.idle();
  await input('cx0', 90); await sl('margin', 10, 'change'); await a.idle();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveManifest')]);
  const mp = path.join(CACHE, 'saved_slice_pack.json'); await dl.saveAs(mp);
  ok('manifest has the slice', JSON.stringify(JSON.parse(fs.readFileSync(mp, 'utf8')).slice) === JSON.stringify({ zones: [7], rect: [90, 0, 256, 256], margin: 10 }));
  await page.click('#wholeMap'); await a.idle();
  await page.setInputFiles('#file', [mp, ...['edges', 'zones', 'height'].map((n) => mapFile('maps', n))]); await page.waitForTimeout(1200); await a.idle();
  ok('manifest restores zone, crop and margin', JSON.stringify((await info()).spec) === JSON.stringify({ margin: 10, zones: [7], rect: [90, 0, 256, 256] }));

  await a.load('maps_split'); await a.zone(6);
  const total = await page.evaluate(() => window.__evo.packs.image.pack.fields.zone.info.classes.find((c) => c.id === 6).count);
  ok('zone in two pieces: warning with pieces and the largest', /Zone 6 is not contiguous/.test(await msg()) && /2 pieces/.test(await msg()) && new RegExp(`largest has ${total - 49} of ${total} tiles`).test(await msg()), await msg());
  await a.zone(3); ok('a contiguous zone gives no warning', (await msg()) === '');

  await page.selectOption('#src', 'snake'); await a.idle(); r = await info();
  ok('snake pack: whole map, no zone chips, crop cleared', r.spec === null && (await page.$$eval('#zoneChips .chip', (e) => e.length)) === 0);
  for (const [id, v] of [['cx0', 5], ['cy0', 5], ['cx1', 25], ['cy1', 25]]) await input(id, v); await a.idle(); r = await info();
  ok('snake pack: crop works without zones', r.tiles === 400 && r.slice);
  ok('no console errors', a.errs.length === 0, JSON.stringify(a.errs));
  await a.browser.close();
})();
