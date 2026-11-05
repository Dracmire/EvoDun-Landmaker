/* THE WINDOW SESSION AND THE LEAKS BETWEEN MODES (limitation 22, S1b; extended in S2a).
   `dac_stage` (mode 3) sets the clean view (the 8 debug Display toggles off) and the units in H (P.terH = 2 x tilesPerH, P.subH = 0.22 x terH). Entering it saves the 10 Display keys of DISPLAY_KEYS (with their checkboxes) and P.terH / P.subH (with their sliders);
   EVERY exit restores them first, then applies the destination (and the reset of S1b: the examples outside mode 2 start from tint off / outline off / room borders on; mode 2's own examples set tint / outline themselves).
   (a) mode 2 with MANUAL toggles (nowalk and markers off, terH 1.7, subH 0.3) -> dac_stage -> every example of modes 1, 2, 4, 5, 6 (through the mode selector and then the example) and the 2 legacy examples of mode 3: the 10 keys, their checkboxes, P.terH, P.subH and their sliders
   equal those of before entering, except what the destination sets itself; (b) dac_stage pressed twice, then leave; (c) leaving with the mode selector only (the first example of each mode); (d) loading images + a manifest while inside.
   MUTATIONS (E.modesTest, each must FAIL its named check): skipDisplayRestore, skipUnitsRestore, skipStairsRestore (S3), skipYawEnd (S3: the yaw of the example survives a load), skipBorderEnd / skipBorderRestore (S2: the stage border ends with the session on every exit), skipStageStateEnd (polish-1: the window state ends with a load), retakeSnapshot.
     NODE_PATH=$(npm root -g) node tools/ui/test_window_session_ui.js */
const fs = require('fs'), os = require('os'), path = require('path');
const { open, mapFile } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const KEYS = ['roomBorders', 'nowalk', 'gateMarks', 'rampLines', 'veil', 'border', 'markers', 'edgeWarn', 'typeTint', 'dioOutline'];
const STATE = () => { const e = window.__evo, O = e.O, P = e.P, o = {}, c = {}; for (const k of ['roomBorders', 'nowalk', 'gateMarks', 'rampLines', 'veil', 'border', 'markers', 'edgeWarn', 'typeTint', 'dioOutline']) { o[k] = O[k]; const el = document.querySelector('#t-' + k); c[k] = el ? el.checked : null; } return { o, c, terH: P.terH, subH: P.subH, sTerH: +document.querySelector('#s-terH').value, sSubH: +document.querySelector('#s-subH').value, units: e.st.stageUnits, win: !!e.st.win, stairStyle: P.stairStyle, tread: P.tread, fill: !!P.rampPreferFill, sStyle: +document.querySelector('#s-stairStyle').value, sTread: +document.querySelector('#s-tread').value }; };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const idle = () => a.idle();
  const MODES = await ev(() => window.EVO.modes.MODES.map((m) => ({ id: m.id, ex: m.examples.filter((x) => !x.images).map((x) => ({ id: x.id, tint: !!x.tint, outline: !!x.outline })) })));
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const manual = async () => { // what a user may have done by hand: two debug aids off, own units
    await ev(() => { for (const id of ['t-nowalk', 't-markers']) { const el = document.querySelector('#' + id); if (el && el.checked) el.click(); } });
    await a.slider('subH', 0.3); await idle(); await a.slider('terH', 1.7); await idle(); await a.slider('tread', 3); await idle(); // S3: + an own tread (the window sets tread 1, stairStyle 0 and the fill preference)
  };
  const prep = async () => { await setMode('rooms'); await manual(); return ev(STATE); };
  const dest = (m, ex) => (m === 'rooms' ? { typeTint: ex.tint, dioOutline: ex.outline, roomBorders: true } : { typeTint: false, dioOutline: false, roomBorders: true });
  const verdict = (B0, S, d) => { // display: the 10 keys and their checkboxes; units: P.terH, P.subH and their sliders
    const badD = [], badU = []; for (const k of KEYS) { const want = k in d ? d[k] : B0.o[k]; if (S.o[k] !== want || S.c[k] !== want) badD.push([k, want, S.o[k], S.c[k]]); }
    if (!(S.terH === B0.terH && S.subH === B0.subH && S.sTerH === B0.sTerH && S.sSubH === B0.sSubH)) badU.push([B0.terH, B0.subH, S.terH, S.subH, S.sTerH, S.sSubH]);
    const badT = (S.stairStyle === B0.stairStyle && S.tread === B0.tread && S.fill === B0.fill && S.sStyle === B0.sStyle && S.sTread === B0.sTread) ? [] : [[B0.stairStyle, B0.tread, B0.fill, S.stairStyle, S.tread, S.fill, S.sStyle, S.sTread]]; // S3: the transitions of the window
    return { badD, badU, badT, session: S.win === false && S.units === false };
  };
  // the targets: every example of modes 1, 2, 4, 5, 6 and the two legacy examples of mode 3
  const targets = []; for (const m of MODES) { if (m.id === 'stage') continue; for (const ex of m.ex) targets.push({ mode: m.id, ex }); }
  for (const m of MODES.filter((q) => q.id === 'stage')) for (const ex of m.ex.filter((x) => x.id !== 'dac_stage')) targets.push({ mode: 'stage', ex });
  const trial = async (t, twice) => {
    const B0 = await prep(); await setMode('stage'); if (twice) await clickEx('dac_stage'); const inside = await ev(STATE);
    if (t.mode === 'stage') await clickEx(t.ex.id); else { await setMode(t.mode); if (t.ex.id !== MODES.find((q) => q.id === t.mode).ex[0].id) await clickEx(t.ex.id); }
    const S = await ev(STATE); return { B0, inside, S, v: verdict(B0, S, dest(t.mode, t.ex)) };
  };
  // (a) + (c)
  const badD = [], badU = [], badT = [], badS = []; let n = 0, cleanOk = true, unitsOn = true, stairsIn = true;
  for (const t of targets) {
    const r = await trial(t, false); n++;
    if (r.v.badD.length) badD.push([t.mode + '/' + t.ex.id, r.v.badD]); if (r.v.badU.length) badU.push([t.mode + '/' + t.ex.id, r.v.badU]); if (r.v.badT.length) badT.push([t.mode + '/' + t.ex.id, r.v.badT]); stairsIn = stairsIn && r.inside.stairStyle === 0 && r.inside.tread === 1 && r.inside.fill === true; if (!r.v.session) badS.push(t.mode + '/' + t.ex.id);
    cleanOk = cleanOk && ['roomBorders', 'nowalk', 'gateMarks', 'rampLines', 'veil', 'border', 'markers', 'edgeWarn', 'typeTint', 'dioOutline'].every((k) => r.inside.o[k] === false && r.inside.c[k] === false); unitsOn = unitsOn && r.inside.units && r.inside.terH === 4 && r.inside.win;
  }
  ok(`dac_stage opens the clean view (the 10 Display keys and checkboxes off) with units in H (terH 4, subH 0.88) and a window session, from a state with manual toggles (${n} entries)`, cleanOk && unitsOn);
  ok(`WINDOW SESSION: display restore: after ${n} exits (every example of modes 1, 2, 4, 5, 6 and the 2 legacy examples of mode 3, through the selector and the example) the 10 Display keys and checkboxes are those of before entering (or what the destination sets itself)`, badD.length === 0, badD);
  ok(`WINDOW SESSION: units restore: after ${n} exits P.terH, P.subH and their sliders are those of before entering (terH 1.7, subH 0.3)`, badU.length === 0, badU);
  ok(`dac_stage opens with the steps of S3 (stairStyle 0, tread 1, fill preferred) from a state with its own tread (${n} entries)`, stairsIn);
  ok(`WINDOW SESSION: transitions restore: after ${n} exits P.stairStyle (1), P.tread (3), P.rampPreferFill and their sliders are those of before entering`, badT.length === 0, badT);
  ok('WINDOW SESSION: every exit ends the session (no snapshot left, units flag off)', badS.length === 0, badS);
  // (b) dac_stage pressed twice
  { const t = { mode: 'rooms', ex: MODES.find((q) => q.id === 'rooms').ex[0] }; const r = await trial(t, true);
    ok('WINDOW SESSION: no second snapshot: dac_stage pressed again from inside, then leaving, restores the state of before the FIRST entry', r.v.badD.length === 0 && r.v.badU.length === 0, r.v); }
  // (d) images + a manifest loaded while inside the session
  { await setMode('terrain'); await ev(() => { document.querySelector('#examples button[data-id="images"]').click(); }); await idle();
    await page.setInputFiles('#file', ['height', 'zones', 'edges'].map((n) => mapFile('maps', n))); await page.waitForTimeout(1500); await idle();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveManifest')]); const mpath = path.join(os.tmpdir(), 'evo_leak_pack_' + process.pid + '.json'); await dl.saveAs(mpath);
    await manual(); const B0 = await ev(STATE); await setMode('stage');
    const inside = await ev(STATE); ok('(d) before the load: inside the window session, clean view, units in H', inside.win && inside.units && inside.o.nowalk === false && inside.terH === 4, inside);
    await page.setInputFiles('#file', [...['height', 'zones', 'edges'].map((n) => mapFile('maps', n)), mpath]); await page.waitForTimeout(1500); await idle();
    const S = await ev(STATE), v = verdict(B0, S, {});
    ok('WINDOW SESSION: (d) loading images + a manifest while inside ends the session and restores the Display keys, P.terH and P.subH', v.badD.length === 0 && v.badU.length === 0 && v.session, [v, S.win]);
    fs.unlinkSync(mpath); }
  // (e) S3: the example's yaw (dac_stage 180) ends with the window session on the LOAD path too: images + a manifest (viewer.mode 'rooms', camera 'stage' = Cam 6 in mode 2) -> the camera of mode 2 is at yaw 0 (it was 180 before the fix: the viewer block kept st.stage.yaw);
  // images WITHOUT a manifest (no viewer block at all, the mode stays 3) -> yaw 0 as well. MUTATION skipYawEnd (the yaw survives the load): the same check FAILS.
  const loadIn = async (withManifest, mut) => { await setMode('stage'); await clickEx('dac_stage'); await page.selectOption('#stageBorder', 'island'); await idle(); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut);
    const files = ['height', 'zones', 'edges'].map((n) => mapFile('maps', n)); let mp = null;
    if (withManifest) { mp = path.join(os.tmpdir(), 'yawend_' + process.pid + '_' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(mp, JSON.stringify({ format: 'evodun-pack/0.3', name: 'yaw end', roles: { elevation: { image: 'height.png', channel: 'V' } }, viewer: { mode: 'rooms', camera: 'stage', rooms: true, preset: 'balanced', terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 } })); }
    const inside = await ev(() => ({ yaw: window.__evo.view().yaw, base: window.__evo.st.stage.yaw, border: window.__evo.st.stage.border }));
    await page.setInputFiles('#file', mp ? [...files, mp] : files); await page.waitForTimeout(2500); await idle(); await ev(() => { window.EVO.modesTest = null; }); if (mp) fs.unlinkSync(mp);
    return { inside, after: await ev(() => { const e = window.__evo; return { mode: e.st.modeId, preset: e.st.preset, base: e.st.stage.yaw, view: e.view().yaw, win: !!e.st.win, border: e.st.stage.border, hasBorder: !!e.S().stageBorder, sel: document.querySelector('#stageBorder').value }; }) }; };
  { const r = await loadIn(true, null);
    ok(`YAW END: images + a manifest (viewer.mode rooms, Cam 6) loaded inside dac_stage (yaw ${r.inside.yaw}): mode ${r.after.mode}, st.stage.yaw ${r.after.base}, view().yaw ${r.after.view} (0 expected)`, r.inside.yaw === 180 && r.after.mode === 'rooms' && r.after.preset === 'stage' && r.after.base === undefined && r.after.view === 0 && !r.after.win, r);
    const r2 = await loadIn(false, null);
    ok(`YAW END: images WITHOUT a manifest loaded inside dac_stage: st.stage.yaw ${r2.after.base}, view().yaw ${r2.after.view} (0 expected)`, r2.after.base === undefined && r2.after.view === 0 && !r2.after.win, r2);
    const rm = await loadIn(true, 'skipYawEnd');
    ok(`MUTATION skipYawEnd: the YAW END check FAILS (the yaw survives the load: view().yaw ${rm.after.view} instead of 0)`, rm.after.view !== 0, rm); }

  // (f) S2: the stage border (st.stage.border, the select #stageBorder) belongs to the window session: it ends on EVERY exit, also the load of images with and without a manifest (the S3 lesson). MUTATIONS skipBorderEnd / skipBorderRestore.
  { const r = await loadIn(true, null), r2 = await loadIn(false, null);
    ok(`BORDER END: images + a manifest loaded inside dac_stage with Island on (${r.inside.border}): st.stage.border ${r.after.border}, select ${r.after.sel}, no border in the shape`, r.inside.border === 'island' && r.after.border === 'off' && r.after.sel === 'off' && !r.after.hasBorder, r);
    ok(`BORDER END: images WITHOUT a manifest: st.stage.border ${r2.after.border}, select ${r2.after.sel}, no border in the shape`, r2.after.border === 'off' && r2.after.sel === 'off' && !r2.after.hasBorder, r2);
    const rm = await loadIn(true, 'skipBorderEnd'), rr = await loadIn(false, 'skipBorderRestore');
    ok(`MUTATION skipBorderEnd: the BORDER END check FAILS (border ${rm.after.border} survives the load with a manifest)`, rm.after.border !== 'off', rm);
    ok(`MUTATION skipBorderRestore: the BORDER END check FAILS (border ${rr.after.border} survives the load without a manifest)`, rr.after.border !== 'off', rr); }
  // the other exits: another example of mode 3, the mode selector, dac_stage pressed again
  const exitBorder = async (go, mut) => { await setMode('stage'); await clickEx('dac_stage'); await page.selectOption('#stageBorder', 'quebrada'); await idle(); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut); await go(); const r = await ev(() => { const e = window.__evo; return { border: e.st.stage.border, win: !!e.st.win, has: !!e.S().stageBorder }; }); await ev(() => { window.EVO.modesTest = null; }); return r; };
  const exits = { 'legacy example of mode 3': async () => { await clickEx('x4_stage'); }, 'the mode selector (mode 1)': async () => { await setMode('terrain'); }, 'a mode 2 example': async () => { await setMode('rooms'); }, 'dac_stage pressed again': async () => { await clickEx('dac_stage'); } };
  for (const [name, go] of Object.entries(exits)) { const r = await exitBorder(go, null); ok(`BORDER END: exit through ${name}: st.stage.border ${r.border}, no border in the shape`, r.border === 'off' && !r.has, r); }
  { const r = await exitBorder(exits['a mode 2 example'], 'skipBorderRestore'); ok(`MUTATION skipBorderRestore: leaving to mode 2 keeps the border (${r.border}): the exit check FAILS`, r.border !== 'off', r); }
  // (g) polish-1, bug (b): loading images (with a manifest viewer.mode 'stage' that turns no rooms on, or without any manifest) from inside dac_stage ends the window STATE too (st.stageRooms, st.hero, st.focus, st.stageClamp):
  // before the fix stageOn() stayed true with the new shape having no roomMap and stageText() threw "Cannot read properties of undefined (reading '30013')", leaving #busy visible. MUTATION skipStageStateEnd: the same check FAILS.
  const loadStage = async (withManifest, mut) => { await setMode('stage'); await clickEx('dac_stage'); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut);
    const files = ['height', 'zones', 'edges'].map((n) => mapFile('maps', n)); let mp = null; const e0 = a.errs.length;
    if (withManifest) { mp = path.join(os.tmpdir(), 'stagestate_' + process.pid + '_' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(mp, JSON.stringify({ format: 'evodun-pack/0.3', name: 'stage state', roles: { elevation: { image: 'height.png', channel: 'V' } }, viewer: { mode: 'stage', camera: 'stage' } })); }
    await page.setInputFiles('#file', mp ? [...files, mp] : files); await page.waitForTimeout(3000); await idle(); await ev(() => { window.EVO.modesTest = null; }); if (mp) fs.unlinkSync(mp);
    const r = await ev(() => { const e = window.__evo; return { mode: e.st.modeId, rooms: !!e.P.rooms, stageRooms: e.st.stageRooms.length, hero: e.st.hero, on: !!e.stageOn(), busy: !document.querySelector('#busy').hidden, roomMap: !!(e.S() && e.S().roomMap) }; });
    return Object.assign(r, { errs: a.errs.slice(e0) }); };
  { const r = await loadStage(true, null), r2 = await loadStage(false, null);
    ok(`STAGE STATE END: images + a manifest {mode stage, camera stage} without rooms loaded inside dac_stage: stageOn() ${r.on}, stageRooms ${r.stageRooms}, hero ${JSON.stringify(r.hero)}, #busy visible ${r.busy}, page errors ${r.errs.length}`, r.mode === 'stage' && !r.rooms && !r.on && r.stageRooms === 0 && r.hero === null && !r.busy && r.errs.length === 0, r);
    ok(`STAGE STATE END: images WITHOUT a manifest: stageOn() ${r2.on}, stageRooms ${r2.stageRooms}, #busy visible ${r2.busy}, page errors ${r2.errs.length}`, !r2.on && r2.stageRooms === 0 && r2.hero === null && !r2.busy && r2.errs.length === 0, r2);
    const m = await loadStage(true, 'skipStageStateEnd'); // the readout guard in stageText() keeps this state from throwing; the state itself is what the mutation breaks
    ok(`MUTATION skipStageStateEnd: the STAGE STATE END check FAILS (stageOn() ${m.on}, stageRooms ${m.stageRooms}, #busy visible ${m.busy})`, m.on && m.stageRooms > 0, m);
    await setMode('terrain'); } // leave the window session cleanly (no mutation active): the short runs below start outside it
  // MUTATIONS: each must fail its named check (a short run: entering from a state with manual toggles, then a mode-2 example and a mode-1 example)
  const mini = async (flag) => { await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, flag); const T = [{ mode: 'rooms', ex: MODES.find((q) => q.id === 'rooms').ex[0] }, { mode: 'terrain', ex: MODES.find((q) => q.id === 'terrain').ex[0] }]; const out = { badD: 0, badU: 0, badT: 0, twice: null };
    for (const t of T) { const r = await trial(t, false); out.badD += r.v.badD.length; out.badU += r.v.badU.length; out.badT += r.v.badT.length; }
    const r2 = await trial(T[0], true); out.twice = r2.v.badD.length + r2.v.badU.length; await ev(() => { window.EVO.modesTest = null; }); return out; };
  let m = await mini('skipDisplayRestore'); ok(`MUTATION skipDisplayRestore: the display restore check FAILS (${m.badD} keys not restored)`, m.badD > 0);
  m = await mini('skipUnitsRestore'); ok(`MUTATION skipUnitsRestore: the units restore check FAILS (${m.badU} exits with terH / subH not restored)`, m.badU > 0);
  m = await mini('skipStairsRestore'); ok(`MUTATION skipStairsRestore: the transitions restore check FAILS (${m.badT} exits with stairStyle / tread / fill not restored)`, m.badT > 0);
  m = await mini('retakeSnapshot'); ok(`MUTATION retakeSnapshot: the no-second-snapshot check FAILS (${m.twice} wrong values after dac_stage pressed twice)`, m.twice > 0);
  m = await mini(null); ok('without a mutation the same short run is clean (the mutations were the only difference)', m.badD === 0 && m.badU === 0 && m.badT === 0 && m.twice === 0, m);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
