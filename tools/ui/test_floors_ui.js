/* Crystallizer 5, the Floors view in the viewer (source "Snake Mountain floors"): the controls exist only for a floors package and its viewer block is applied; the chips give the exterior and each floor (the declared link is carved on
   floor 1, its info line says so); the exploded stack and the cutaway are different pictures; the cutaway plane is the one of the camera (every exterior tile kept is behind it, every floor tile in front) and follows the yaw
   (recomputed on release, not during a drag); Cam 6 falls back to the selected floor; stake and objectives are only placed in the single-floor views; compare mode draws four panels in both views; the default source is unchanged
   (no Floors controls, no Floors text). Pixel identity with the view off is covered by tools/verify.sh regress (the other sources).
     NODE_PATH=$(npm root -g) node tools/ui/test_floors_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  const info = () => page.$eval('#info', (e) => e.textContent), ev = (f, ...args) => page.evaluate(f, ...args);
  await page.click('#mode'); await a.idle(); await a.tech('A'); await a.preset('isoE');
  ok('the default source has no Floors controls and no Floors text', (await page.$eval('#floors', (e) => e.hidden)) && !/Floors:/.test(await info()));
  const h0 = await hash();
  await page.selectOption('#src', 'snake_floors'); await a.idle();
  ok('the floors source shows the Floors controls', !(await page.$eval('#floors', (e) => e.hidden)));
  ok('choosing it applies its viewer block: terraces 5 and minPlateau 5', (await ev(() => [window.__evo.P.terraces, window.__evo.P.minPlateau])).join() === '5,5');
  const chips = await page.$$eval('#floorChips button', (b) => b.map((x) => x.textContent)); ok('the chips are Exterior / Floor 1 / Floor 2', chips.join() === 'Exterior,Floor 1,Floor 2', chips);
  // single floors
  const hs = {};
  for (const k of [0, 1, 2]) { await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle(); await page.waitForTimeout(150); hs[k] = await hash(); const t = await info(); if (k === 1) ok('floor 1: the declared link is carved (ramp 3 x 2) and no warning', /link: declared ramp 3 x 2 carved/.test(t) && !/floor link missing/.test(t), t.slice(-200)); if (k === 2) ok('floor 2 is its own shape', /Floor 2/.test(await ev(() => window.__evo.S().name))); }
  ok('the exterior and the two floors are three different pictures', new Set(Object.values(hs)).size === 3);
  // the railing of the floor-2 opening: drawn in Box / A / B / C, not pickable, only on floor 2 (also kept by the layers of the stack and the cutaway)
  await page.click('#floorChips button[data-floor="2"]'); await a.idle();
  for (const t of ['box', 'A', 'B', 'C']) {
    const r = await ev((t) => { const e = window.__evo, S = e.S(), E = window.EVO, v = e.view(), W = 900, H = 600, mk = () => { const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;visibility:hidden`; document.body.appendChild(cv); return cv; },
      shot = (S2) => { const cv = mk(); E.render(cv, S2, e.P, t, v, {}); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; cv.remove(); return d; }, cnt = (x, y) => { let d = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) d++; return d; },
      sNo = Object.create(S); sNo.ascWalls = null; const pk = (S2) => E.pickBuffer(S2, e.P, v, W, H).data;
      return { has: !!(S.ascWalls && S.ascWalls.rails), picture: cnt(shot(S), shot(sNo)), pick: cnt(pk(S), pk(sNo)) }; }, t);
    ok(`${t}: floor 2 draws the railing (${r.picture} bytes differ without it) and the pick buffer is identical with and without it (${r.pick})`, r.has && r.picture > 100 && r.pick === 0, JSON.stringify(r));
  }
  for (const k of [0, 1]) { await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle(); ok(`layer ${k} has no railing`, !(await ev(() => !!window.__evo.S().ascWalls))); }
  await page.selectOption('#floorsView', 'stack'); await a.idle(); await page.waitForTimeout(150);
  ok('the stack keeps the railing on floor 2 only', (await ev(() => window.__evo.st.floorsLayers.list.map((l) => (l.S.ascWalls && l.S.ascWalls.rails ? 1 : 0)).join())) === '0,1,0');
  await page.selectOption('#floorsView', 'cut'); await a.idle(); await page.waitForTimeout(150);
  ok('the cutaway keeps the railing only on its floor-2 half (floor 1 and the exterior none)', (await ev(() => window.__evo.st.floorsLayers.list.map((l) => (l.S.ascWalls && l.S.ascWalls.rails ? l.S.ascWalls.faces.length : 0)).join(','))).split(',').map(Number).every((v, i) => (i === 2 ? v >= 0 : v === 0)));
  await page.selectOption('#floorsView', 'single'); await a.idle(); await a.tech('A'); await page.waitForTimeout(100);
  // exploded stack and cutaway
  await page.selectOption('#floorsView', 'stack'); await a.idle(); await page.waitForTimeout(200); const hStack = await hash(); const tS = await info();
  ok('the exploded stack draws the three layers (floor 1, floor 2, the ghosted exterior)', (await ev(() => window.__evo.st.floorsLayers.list.map((l) => l.name).join('|'))) === 'Floor 1|Floor 2|Exterior (lid)' && /exploded stack/.test(tS));
  await page.selectOption('#floorsView', 'cut'); await a.idle(); await page.waitForTimeout(200); const hCut = await hash();
  ok('the stack, the cutaway and the single floors are different pictures', new Set([hStack, hCut, ...Object.values(hs)]).size === 5);
  // the plane: exterior kept = behind, floors kept = in front
  const plane = () => ev(() => { const e = window.__evo, E = window.EVO, F = e.st.floorsLayers, cam = E.makeCam(F.list[0].S, e.P, e.view(), 100, 100), res = { back: 0, backBad: 0, front: 0, frontBad: 0, plane: F.plane, key: F.key };
    for (const [li, side] of F.list.map((l, i) => [i, i === 0 ? 'back' : 'front'])) { const T = F.list[li].S; for (let i = 0; i < T.n; i++) { if (T.void && T.void[i]) continue; const r = cam.ry((i % T.W) + 0.5, Math.floor(i / T.W) + 0.5); if (side === 'back') { res.back++; if (r >= F.plane - 1e-9 + 1e-9 && r > F.plane) res.backBad++; } else { res.front++; if (r < F.plane - 1e-9) res.frontBad++; } } } return res; });
  let pl = await plane();
  ok(`the cut plane is perpendicular to the view through the shaft axis: ${pl.back} exterior tiles all behind it, ${pl.front} floor tiles all in front`, pl.back > 200 && pl.front > 100 && pl.backBad === 0 && pl.frontBad === 0, pl);
  ok('the cutaway removes the front half of the exterior (fewer tiles than the whole map)', pl.back < 1500);
  // follows the yaw: a drag changes the plane on release, not during the drag
  const box = await (await page.$('#stage')).boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 80, cy, { steps: 5 }); await page.waitForTimeout(300);
  const during = await plane(); ok('during a drag the cut is held (recomputed on release)', during.key === pl.key, [during.key, pl.key]);
  await page.mouse.up(); await a.idle(); await page.waitForTimeout(300);
  const after = await plane(); ok('after the release the plane follows the new yaw (new cut key, still a clean cut)', after.key !== pl.key && after.backBad === 0 && after.frontBad === 0 && (await hash()) !== hCut, [after.key, pl.key]);
  await page.click('#reset'); await a.idle();
  // Cam 6 falls back to the selected floor
  await a.preset('stage'); await a.idle(); await page.waitForTimeout(150);
  ok('Cam 6 (perspective) is not supported in the stack and the cutaway: it says so and shows the selected floor', /Cam 6 \(perspective\) is not supported/.test(await info()) && ((await ev(() => window.__evo.st.floorsLayers)) === null));
  await a.preset('isoE'); await a.idle();
  // stake only in the single-floor views
  await page.evaluate(() => window.__evo.setIncMode('stake')); /* Place stake is greyed in the cutaway: the mode is set directly */ await page.mouse.click(cx, cy); await page.waitForTimeout(300);
  ok('the stake is not placed in the cutaway (message, nothing placed)', (await ev(() => window.__evo.inc.stake)) === null && /single-floor views/.test(await page.$eval('#msg', (e) => e.textContent)));
  await page.keyboard.press('Escape');
  // compare mode: four panels in both views
  await page.click('#mode'); await a.idle(); await page.waitForTimeout(500);
  for (const v of ['stack', 'cut']) { await page.selectOption('#floorsView', v); await a.idle(); await page.waitForTimeout(400); const n = await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length), caps = await page.$$eval('#stage figcaption', (c) => c.map((x) => x.textContent)); ok(`compare mode: four painted panels in the ${v} view`, n === 4 && caps.every((c) => !/computing/.test(c)), caps); }
  // back to the default source: the same picture as before
  await page.click('#mode'); await a.idle(); await page.selectOption('#src', 'snake_surface'); await a.idle(); await a.tech('A'); await a.preset('isoE'); await a.idle(); await page.waitForTimeout(150);
  ok('back on the default source: no Floors controls, the same picture as before', (await page.$eval('#floors', (e) => e.hidden)) && (await hash()) === h0);
  console.log('errors:', a.errs); ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
