/* Pocket view in the viewer: switch, chip / click selection of a Diorama, info line, compare mode, the footprint outline toggle, switch off = same picture.
     NODE_PATH=$(npm root -g) node tools/ui/test_pocket_ui.js */
const path = require('path'), crypto = require('crypto');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  const hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex'), chip = async (id) => { await page.click(`#roomChips .chip[data-id="${id}"]`); await a.idle(); };
  const info = () => page.evaluate(() => ({ pocket: !!window.__evo.S().pocket, info: document.querySelector('#info').textContent, pi: window.__evo.S().pocketInfo || null, role: window.__evo.S().pocketRole ? Array.from(window.__evo.S().pocketRole).filter((v) => v > 0).length : 0 }));
  await a.tech('A'); await a.preset('isoE');
  await page.click('#wholeRooms'); await a.idle(); const worldA = await hash();
  await chip(31); const off31 = await info(), off31h = await hash();
  ok('switch off: room 31 is a normal slice (no pocket)', !off31.pocket && !off31.info.includes('POCKET'));
  await page.check('#t-pocket'); await a.idle(); const on31 = await info(), on31h = await hash();
  ok('switch on + chip 31 (a Diorama): the pocket is drawn and the info line names it (fragment, pocket tiles, exits, floors, double)', on31.pocket && on31.info.includes('POCKET of Diorama room 31') && on31.pi.double === true && on31.pi.fragTiles === 383 && on31.pi.exitRuns > 0 && on31h !== off31h, on31.info.slice(on31.info.indexOf('POCKET'), on31.info.indexOf('POCKET') + 260));
  await page.screenshot({ path: process.env.SHOT_DIR ? path.join(process.env.SHOT_DIR, 'ui_pocket_31_A.png') : '/tmp/ui_pocket_31_A.png' });
  await a.tech('B'); ok('technique B draws the pocket too', (await info()).pocket); await a.tech('box'); ok('Box draws the pocket too', (await info()).pocket);
  await page.click('#mode'); await a.idle(); const cmp = await page.evaluate(() => [...document.querySelectorAll('#stage canvas')].filter((c) => !c.closest('figure') || !c.closest('figure').hidden).map((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let nz = 0; for (let i = 0; i < d.length; i += 4 * 17) if (d[i + 3] && (d[i] + d[i + 1] + d[i + 2]) % 765 !== 0) nz++; return nz; }));
  ok('compare mode (Box | A | B) draws three non-empty panels of the pocket', cmp.length === 3 && cmp.every((v) => v > 500) && (await info()).pocket, JSON.stringify(cmp));
  await page.click('#mode'); await a.idle(); await a.tech('A');
  await chip(1); const nd = await info(); ok('a room that is not a Diorama keeps the normal slice and the info says so', !nd.pocket && nd.info.includes('is not a Diorama'));
  await page.click('#wholeRooms'); await a.idle(); ok('whole map with the switch on: the world (no pocket)', !(await info()).pocket);
  // click in the world on a Diorama
  const spot = await page.evaluate(() => { const e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), v = e.view(), cam = window.EVO.makeCam(S, e.P, v, cv.clientWidth, cv.clientHeight), ts = [];
    for (let i = 0; i < S.n; i++) if (S.roomMap[i] === 49) ts.push(i); const i = ts[Math.floor(ts.length / 2)], p = cam.p((i % S.W) + 0.5, ((i / S.W) | 0) + 0.5, S.levelH[S.fine[i]]), r = cv.getBoundingClientRect();
    return ts.length ? { x: r.left + p[0], y: r.top + p[1], id: 49 } : null; });
  ok('the world view shows at least one Diorama under the cursor grid', !!spot);
  if (spot) { await page.mouse.click(spot.x, spot.y); await a.idle(); const c = await info(), sel = await page.evaluate(() => [...window.__evo.sliceSel.rooms]); ok(`a click on Diorama ${spot.id} in the world chooses it and draws its pocket`, c.pocket && sel.length === 1 && sel[0] === spot.id, JSON.stringify(sel)); }
  await page.click('#wholeRooms'); await a.idle();
  // outline toggle
  await page.check('#t-dioOutline'); await a.idle(); await page.uncheck('#t-dioOutline'); await a.idle(); const w0 = await hash(), w0b = await hash(); await page.check('#t-dioOutline'); await a.idle(); const w1 = await hash(); await page.uncheck('#t-dioOutline'); await a.idle(); const w2 = await hash();
  ok('Diorama outline: the toggle changes the world picture and switching it off gives back the identical picture', w0 !== w1 && w0 === w2 && w0 === w0b, JSON.stringify([w0 !== w1, w0 === w2, w0 === w0b]));
  await page.check('#t-dioOutline'); await a.idle(); await page.screenshot({ path: process.env.SHOT_DIR ? path.join(process.env.SHOT_DIR, 'ui_world_outline_A.png') : '/tmp/ui_world_outline_A.png' }); await page.uncheck('#t-dioOutline'); await a.idle();
  // switch off again: same picture as before
  await page.uncheck('#t-pocket'); await a.idle(); await chip(31); ok('pocket switch back off: room 31 is the same normal slice picture', (await hash()) === off31h && !(await info()).pocket);
  console.log('errors:', JSON.stringify(a.errs)); ok('no console errors', a.errs.length === 0); await a.browser.close();
})();
