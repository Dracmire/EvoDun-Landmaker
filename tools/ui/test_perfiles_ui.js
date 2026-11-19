/* SHAPE PROFILES MOCKUPS (mode 3, PR profiles-mockup): the four declared examples M1, M2, M3 and the control C0 of src/modes.js and the three optional example fields they use (`terHH`, `cake` / `ascWalls`, `blocked`, `torches: false`).
   (1) the four examples exist in mode 3 only, with their rooms ([14], [30], [19], [44]) and the Base v2.4 terrain (terraces 3, subs 2, terH 1.25 H = 1.875 tiles, "Measures in H" off, tilesPerH 1.5, heroFrac 0.10, Cam 6);
   (2) the type framing: M1 has Ascension walls, M2 the Pocket, M3 the Cake rings, C0 none of them; the four have no torches (props: 0 torches) while dac_stage keeps its torches (the field absent = as before);
   (3) M2: the hand reduction blocks tiles of the room (declared, `S.stageBlocked`), and the walkable tiles measured as built are fewer than the room's 260;
   (4) the state ends with the window session (leaving to mode 1): Cake / Ascension walls / Pocket off, the blocked list and the no-torches flag cleared; the following example (dac_stage) has its walkable tiles, torches and terrain back (no leak).
     NODE_PATH=$(npm root -g) node tools/ui/test_perfiles_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const ROOM = { perfil_m1: 14, perfil_m2: 30, perfil_m3: 19, perfil_c0: 44 };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const facts = () => ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, zm = E.stage.zoneMap(S), rid = st.stageRooms[0]; let walk = 0; for (let i = 0; i < S.n; i++) if (zm[i] === rid && E.stage.walkable(S, i) && S.region[i] >= 0) walk++;
    return { rooms: st.stageRooms.slice(), terraces: P.terraces, subs: P.subs, terH: P.terH, subH: P.subH, units: st.stageUnits, tp: st.stage.tilesPerH, hf: st.stage.heroFrac, cam: st.preset, cake: !!P.cake, asc: !!P.ascWalls, pocket: !!P.pocket, ascFaces: S.ascWalls ? S.ascWalls.faces.length : 0, cakeRings: S.cake && S.cake.rings ? 1 : 0, torches: S.propsC ? S.propsC.data.torches.length : -1, blocked: S.stageBlocked ? S.stageBlocked.tiles : 0, walk, orient: st.stage.orient, planes: st.stage.planes, props: st.stage.props }; });
  await ev(() => window.__evo.setMode('stage')); await idle();
  // (1) + (2) the four examples
  const f = {}; for (const id of Object.keys(ROOM)) { await clickEx(id); f[id] = await facts(); }
  ok('the four examples load with their rooms and the Base v2.4 terrain: terraces 3, subs 2, terH 1.875 (1.25 H), Measures in H off, tilesPerH 1.5, heroFrac 0.10, Cam 6, orient / planes / props on', Object.entries(ROOM).every(([id, r]) => { const q = f[id]; return q.rooms.join() === String(r) && q.terraces === 3 && q.subs === 2 && Math.abs(q.terH - 1.875) < 1e-6 && q.units === false && q.tp === 1.5 && q.hf === 0.1 && q.cam === 'stage' && q.orient === 'on' && q.planes === 'on' && q.props === 'on'; }), f);
  ok(`the type framing: M1 Ascension walls (${f.perfil_m1.ascFaces} faces), M2 Pocket, M3 Cake rings, C0 none`, f.perfil_m1.asc && f.perfil_m1.ascFaces > 0 && !f.perfil_m1.cake && f.perfil_m2.pocket && !f.perfil_m2.cake && !f.perfil_m2.asc && f.perfil_m3.cake && f.perfil_m3.cakeRings === 1 && !f.perfil_m3.asc && !f.perfil_c0.cake && !f.perfil_c0.asc && !f.perfil_c0.pocket, f);
  ok('the four mockups have no torches (props: Base v2.4, `torches: false`)', Object.values(f).every((q) => q.torches === 0), Object.values(f).map((q) => q.torches));
  // (3) the reduction of M2
  ok(`M2: the declared reduction blocked ${f.perfil_m2.blocked} tiles of Diorama 30 (260 walkable tiles of the room before, ${f.perfil_m2.walk} after); the other three block none`, f.perfil_m2.blocked > 100 && f.perfil_m2.walk < 200 && f.perfil_m1.blocked === 0 && f.perfil_m3.blocked === 0 && f.perfil_c0.blocked === 0, f);
  // (4) the end of the session, and no leak to the next example
  await ev(() => window.__evo.setMode('terrain')); await idle();
  const end = await ev(() => { const e = window.__evo; return { cake: !!e.P.cake, asc: !!e.P.ascWalls, pocket: !!e.P.pocket, blocked: e.st.stage.blockedList.length, noT: e.st.stage.noTorches, chk: [document.querySelector('#t-cake').checked, document.querySelector('#t-ascWalls').checked] }; });
  ok('the state ends with the window session (leaving to mode 1): Cake / Ascension walls / Pocket off, the blocked list cleared, torches flag cleared, the checkboxes clear', !end.cake && !end.asc && !end.pocket && end.blocked === 0 && end.noT === false && !end.chk[0] && !end.chk[1], end);
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('dac_stage');
  const d = await facts();
  ok(`no leak: dac_stage afterwards keeps its torches (${d.torches} > 0), terraces ${d.terraces}, no blocked tiles, no Cake / Ascension walls`, d.torches > 0 && d.terraces === 5 && d.blocked === 0 && !d.cake && !d.asc && !d.pocket, d);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
