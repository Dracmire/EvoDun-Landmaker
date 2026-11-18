/* STAGE CAMERA SPACE BY ROOM (mode 3, PR softlock) in the viewer: the switch "Camera space by room" and the selector "Camera space profile" (src/ui.js, E.stage.CAM_PROFILES, E.stage.clamp margins).
   (1) the controls: greyed in a legacy example (no window), enabled in dac_stage, off and Auto at the start, main controls of mode 3 only;
   (2) switch OFF = the camera of today: the hero grows toward the camera at the near cap, does not shrink away from it, nothing is held at the far edge;
   (3) the profile by the role of the room (Auto): room 14 (Z) -> narrow: same growth at the south as today, shrinks at the north (the far cap holds the target); room 44 (E.orient: Hub) -> wide: constant size at both ends; forced Long on room 44: grows at the south, shrinks at the north;
       measured hero size = the predicted scale law (the exact curve, the camera's own formula) within 2 %;
   (4) MUTATION: the wide profile with the far margin of narrow: the room 44 constant-north check FAILS;
   (5) the state ends with the window session (leaving to mode 1): off, Auto, checkbox clear.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_camspace_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const sw = async (on, prof) => { await ev(({ on, prof }) => { const cs = document.querySelector('#t-stageCamSpace'), sel = document.querySelector('#stageCamProfile'); if (cs.checked !== on) cs.click(); sel.value = prof; sel.dispatchEvent(new Event('change')); }, { on, prof }); await idle(); };
  /* the hero on the view axis of the room (t tiles from its centre, + toward the camera): measured size / panel, predicted exact size, held flags, the profile in use */
  const at = async (room, t) => { await ev(({ room, t }) => { const e = window.__evo, E = window.EVO, S = e.S(), T = E.orient.compute(S, e.P, e.st.stageRooms, e.st.stage.tilesPerH), r = T.byId.get(room), c = E.stage.roomCentre(S, room), y = r.yaw * Math.PI / 180; e.st.follow = true; e.st.hero = { x: S.ox + c.x + t * Math.sin(y), y: S.oy + c.y + t * Math.cos(y) }; e.redraw(); }, { room, t }); await idle();
    return ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, cv = document.querySelector('#stage canvas'), h = st.persH || cv.clientHeight, v = e.view(), tp = st.stage.tilesPerH, hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, f = v.focus, ya = v.yaw * Math.PI / 180, p = v.pitch * Math.PI / 180, D = E.stage.dist(st.stage.heroFrac, tp), feet = E.stage.feetH(S, E.stage.cellOf(S, hw.x, hw.y)), du = (Math.sin(ya) * hw.x + Math.cos(ya) * hw.y) - (Math.sin(ya) * f[0] + Math.cos(ya) * f[1]), c = st.stageClamp;
      return { hf: e.O.hero.stats.hpx / h, pred: st.stage.heroFrac * D / (D - du * Math.cos(p) - (feet - f[2]) * Math.sin(p)), near: !!(c && c.near), far: !!(c && c.far), prof: st.camSpaceNow }; }); };
  const axisEnds = (room) => ev((room) => { const e = window.__evo, E = window.EVO, S = e.S(), T = E.orient.compute(S, e.P, e.st.stageRooms, e.st.stage.tilesPerH), r = T.byId.get(room), c = E.stage.roomCentre(S, room), y = r.yaw * Math.PI / 180, d = [Math.sin(y), Math.cos(y)], zm = E.stage.zoneMap(S), ok = (t) => { const i = E.stage.cellOf(S, c.x + t * d[0], c.y + t * d[1]); return i >= 0 && E.stage.walkable(S, i) && zm[i] === room; }; let s = 0, n = 0; while (ok(s + 0.25)) s += 0.25; while (ok(n - 0.25)) n -= 0.25; return { s, n, dir: r.dir }; }, room);
  const rel = (m) => Math.abs(m.hf / m.pred - 1);
  // (1) the controls
  await setMode('stage'); await clickEx('x4_stage');
  const c1 = await ev(() => ({ cs: document.querySelector('#t-stageCamSpace') && document.querySelector('#t-stageCamSpace').disabled, sel: document.querySelector('#stageCamProfile') && document.querySelector('#stageCamProfile').disabled, on: window.__evo.st.stage.camSpace }));
  ok('the controls exist in mode 3 and are greyed in a legacy example (no window); the state is off', c1.cs === true && c1.sel === true && c1.on !== 'on', c1);
  await clickEx('mockt_z14'); await a.slider('heroFrac', 0.10); await idle();
  const c2 = await ev(() => ({ cs: document.querySelector('#t-stageCamSpace').disabled, chk: document.querySelector('#t-stageCamSpace').checked, sel: document.querySelector('#stageCamProfile').value, main: window.EVO.modes.MODES.filter((x) => x.main.includes('stageCamSpace') && x.main.includes('stageCamProfile')).map((x) => x.id) }));
  ok('in a window example the switch is enabled, off, the profile is Auto; both are main controls of mode 3 only', !c2.cs && !c2.chk && c2.sel === 'auto' && c2.main.join() === 'stage', c2);
  // (2) off = today
  const ax = await axisEnds(14);
  const o0 = await at(14, 0), oS = await at(14, ax.s), oN = await at(14, ax.n);
  ok(`switch OFF (the camera of today), room 14 (${ax.dir}): constant at the centre (${o0.hf.toFixed(3)}), grows at the south edge (${oS.hf.toFixed(3)}, near cap held), does not shrink at the north (${oN.hf.toFixed(3)}), nothing held at the far edge`, o0.prof === null && oS.hf > 1.3 * o0.hf && oS.near && Math.abs(oN.hf / o0.hf - 1) < 0.01 && !oN.far && !oN.near, { o0, oS, oN });
  // (3) the profile by the role
  await sw(true, 'auto');
  const n0 = await at(14, 0), nS = await at(14, ax.s), nN = await at(14, ax.n);
  ok(`room 14 (Z) Auto -> narrow: constant at the centre (${n0.hf.toFixed(3)}), the south as today (${nS.hf.toFixed(3)} = ${oS.hf.toFixed(3)}), shrinks at the north (${nN.hf.toFixed(3)} < ${n0.hf.toFixed(3)}) with the far cap held`, n0.prof === 'narrow' && Math.abs(nS.hf / oS.hf - 1) < 0.002 && nN.hf < 0.95 * n0.hf && nN.far, { n0, nS, nN });
  const all = [o0, oS, oN, n0, nS, nN, await at(14, ax.s / 2), await at(14, ax.n / 2)];
  ok(`the measured size follows the predicted scale law of the camera within 2 % (max ${(100 * Math.max(...all.map(rel))).toFixed(2)} %)`, all.every((m) => rel(m) < 0.02), all.map(rel));
  await sw(true, 'wide');
  const w0 = await at(14, 0), wS = await at(14, ax.s), wN = await at(14, ax.n);
  ok(`room 14 forced wide: constant at both ends (${w0.hf.toFixed(3)} / ${wS.hf.toFixed(3)} / ${wN.hf.toFixed(3)} within 5 %), nothing held`, [wS, wN].every((m) => Math.abs(m.hf / w0.hf - 1) < 0.05) && !wS.near && !wN.far && w0.prof === 'wide', { w0, wS, wN });
  await sw(false, 'auto'); await clickEx('mockt_x44'); await a.slider('heroFrac', 0.10); await idle();
  const bx = await axisEnds(44); await sw(true, 'auto');
  const h0 = await at(44, 0), hS = await at(44, bx.s), hN = await at(44, bx.n);
  ok(`room 44 (E.orient says ${bx.dir}) Auto -> wide: constant at both ends (${h0.hf.toFixed(3)} / ${hS.hf.toFixed(3)} / ${hN.hf.toFixed(3)} within 5 %)`, h0.prof === 'wide' && [hS, hN].every((m) => Math.abs(m.hf / h0.hf - 1) < 0.05), { h0, hS, hN });
  await sw(true, 'long');
  const l0 = await at(44, 0), lS = await at(44, bx.s), lN = await at(44, bx.n);
  ok(`room 44 forced long: grows at the south (${lS.hf.toFixed(3)} > ${l0.hf.toFixed(3)}, near held), shrinks at the north (${lN.hf.toFixed(3)}, far held)`, l0.prof === 'long' && lS.hf > 1.1 * l0.hf && lS.near && lN.hf < 0.95 * l0.hf && lN.far, { l0, lS, lN });
  // (4) mutation: wide with the far margin of narrow
  await ev(() => { window.EVO.stage.CAM_PROFILES.wide.mF = 4; }); await sw(true, 'wide');
  const mN2 = await at(44, bx.n); await ev(() => { window.EVO.stage.CAM_PROFILES.wide.mF = null; });
  ok(`MUTATION wide with a far margin of 4 H: room 44 shrinks at the north (${mN2.hf.toFixed(3)} vs ${h0.hf.toFixed(3)}): the constant-size check FAILS`, !(Math.abs(mN2.hf / h0.hf - 1) < 0.05), { mN2, h0 });
  // (5) the end of the session
  await sw(true, 'narrow'); await setMode('terrain');
  const end = await ev(() => ({ on: window.__evo.st.stage.camSpace, p: window.__evo.st.stage.camProfile, now: window.__evo.st.camSpaceNow, chk: document.querySelector('#t-stageCamSpace').checked, sel: document.querySelector('#stageCamProfile').value }));
  ok('the state ends with the window session (leaving to mode 1): off, Auto, checkbox clear', end.on === 'off' && end.p === 'auto' && !end.now && !end.chk && end.sel === 'auto', end);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
