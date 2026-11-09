/* M4c-0 shots (viewer only; no third-party material): Forest B' with the hero on the east slope (46, 28), yaw 0, heroFrac 0.11, 1280 x 720: neutral / vScale 1.15 / exag 1.3 (+ both), and DAC room 17 with vScale 1.15.
   Writes docs/crystallizers/03-stage/shots/m4c/*.png and m4c_readings.json (M4 door / goal in frame, M3a, the apparent height of the wall over the goal in px and in hero H, measured from the Cam 6 projection).
   NODE_PATH=$(npm root -g) node tools/ui/m4c_shots.js */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const OUT = path.resolve(__dirname, '../../docs/crystallizers/03-stage/shots/m4c'), W = 1280, H = 720;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const a = await open({ w: 1800, h: 1000, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  await page.addScriptTag({ content: 'var module = { exports: {} };' + fs.readFileSync(path.join(__dirname, '../stage_readings.js'), 'utf8') + '\nwindow.SR = module.exports;' });
  const size = async () => { await ev(() => { const s = document.querySelector('#stage'); s.style.cssText = 'width:1280px;height:720px;flex:none;'; window.dispatchEvent(new Event('resize')); }); await idle(); };
  const slider = async (k, v) => { await ev(([k, v]) => { const i = document.querySelector('#s-' + k); i.value = v; i.dispatchEvent(new Event('change')); }, [k, v]); await idle(); };
  const readings = {};
  const read = (tag, fx, fy) => ev(([tag]) => {
    const e = window.__evo, st = e.st, E = window.EVO, S = e.S(), P = e.P, w = document.querySelector('#stage canvas').clientWidth, h = st.persH, tp = st.stage.tilesPerH, v = e.view(), cam = E.makeCam(S, P, v, w, h);
    const hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, i0 = E.stage.cellOf(S, hw.x, hw.y), feet = E.stage.feetH(S, i0);
    const pk = e.packs[st.pack].pack, pv = pk.fields.poi.values, Wd = pk.width; let bi = -1, bv = 0; for (let i = 0; i < pv.length; i++) if (pv[i] > bv) { bv = pv[i]; bi = i; }
    const goal = bi < 0 ? null : { x: (bi % Wd) + 0.5 - S.ox, y: ((bi / Wd) | 0) + 0.5 - S.oy }; const gi = goal ? E.stage.cellOf(S, goal.x, goal.y) : -1, goalH = gi >= 0 ? E.stage.feetH(S, gi) : 0;
    const r = window.SR.compute(S, cam, w, h, { hero: hw, feet, tilesPerH: tp, yaw: v.yaw, goal: goal ? { x: goal.x, y: goal.y, h: goalH } : null });
    const door = { x: 39 - S.ox, y: 22 - S.oy }, dI = E.stage.cellOf(S, door.x, door.y), doorH = dI >= 0 ? E.stage.feetH(S, dI) : 0;
    let top = 0; for (let y = 12; y <= 21; y++) { const i = E.stage.cellOf(S, 39 - S.ox, y - S.oy); if (i >= 0) top = Math.max(top, E.stage.feetH(S, i)); } // the highest ground in the column of the door, north of it (the tower)
    const gp = goal ? cam.p(goal.x, goal.y, goalH) : null, tpnt = goal ? cam.p(goal.x, goal.y, top) : null, dp = cam.p(door.x, door.y, doorH);
    const k = E.stage.depthScale(cam, hw.x, hw.y, feet), heroPx = tp * cam.sc * k, wallPx = gp ? gp[1] - tpnt[1] : null;
    return { tag, vScale: cam.vScale, hero: [st.hero.x, st.hero.y], heroPx: +heroPx.toFixed(1), yaw: v.yaw, goalH_H: +(goalH / tp).toFixed(2), towerTop_H: +(top / tp).toFixed(2), doorGround_H: +(doorH / tp).toFixed(2), goalInFrame: gp ? gp[0] >= 0 && gp[0] <= w && gp[1] >= 0 && gp[1] <= h : null, goalAt: gp ? [+(gp[0] / w).toFixed(3), +(gp[1] / h).toFixed(3)] : null,
      doorInFrame: dp[0] >= 0 && dp[0] <= w && dp[1] >= 0 && dp[1] <= h, doorAt: [+(dp[0] / w).toFixed(3), +(dp[1] / h).toFixed(3)], towerTopInFrame: tpnt ? tpnt[1] >= 0 : null, wallOverGoal_px: wallPx === null ? null : +wallPx.toFixed(1), wallOverGoal_heroH: wallPx === null ? null : +(wallPx / heroPx).toFixed(2),
      M4: r.M4, M3a: r.M3a, M5a: r.M5a, M5b: r.M5b, M8b: r.M8b };
  }, [tag]);
  const save = async (name) => fs.writeFileSync(path.join(OUT, name + '.png'), await a.canvas());
  // ---- Forest B' ----
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="forest_b"]'); await idle(); await size();
  await ev(() => { const e = window.__evo, tb = window.EVO.stage.zoneTable(e.packs[e.st.pack].pack); e.st.stage.orient = 'off'; e.st.stage.heroFrac = 0.11; e.stageSetWindow([1, 4, 6]); }); await idle();
  await ev(() => { const e = window.__evo, st = e.st; st.panX = st.panY = 0; st.follow = true; e.set({ hero: { x: 46, y: 28 } }); e.redraw(); }); await idle();
  await slider('heroFrac', 0.11);
  await ev(() => { const e = window.__evo, st = e.st; st.panX = st.panY = 0; st.follow = true; e.set({ hero: { x: 46, y: 28 } }); e.redraw(); }); await idle();
  readings.neutral = await read('neutral'); await save('forest_b_46_28_neutral');
  await slider('vScale', 1.15); readings.vScale115 = await read('vScale 1.15'); await save('forest_b_46_28_vScale115');
  await slider('vScale', 1); await slider('exag', 1.3); readings.exag13 = await read('exag 1.3'); await save('forest_b_46_28_exag13');
  await slider('vScale', 1.15); readings.both = await read('vScale 1.15 + exag 1.3'); await save('forest_b_46_28_vScale115_exag13');
  // ---- a DAC room ----
  await slider('vScale', 1); await slider('exag', 1);
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); await size();
  await save('dac_room17_neutral'); await slider('vScale', 1.15); await save('dac_room17_vScale115'); await slider('exag', 1.3); await save('dac_room17_vScale115_exag13');
  fs.writeFileSync(path.join(OUT, 'm4c_readings.json'), JSON.stringify(readings, null, 1) + '\n');
  console.log(JSON.stringify(readings.neutral, null, 1)); console.log('page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
