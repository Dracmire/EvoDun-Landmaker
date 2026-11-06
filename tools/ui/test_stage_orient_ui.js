/* STAGE ORIENTATION BY ROOM + ROOM FRAMING (mode 3, PR C1) in the viewer: the switch "Orientation by room" and the select "Framing" (Hero / Room) of the window examples (src/orient.js, src/ui.js).
   (1) the controls: greyed in a legacy example, enabled in dac_stage, orientation on and framing Hero at the start; legacy examples keep technique B and their yaw; dac_stage and the two one-room examples default to Box (B stays offered);
   (2) the yaw of the camera is the yaw of the room the hero stands in (dac_stage: 17 -> 0, 10 -> 270, 20 -> 270, 27 -> 180, 6 -> 90, 5 -> 90) and CHANGES when the hero crosses to another room (Previous / Next room); mutation fixedYaw (one yaw for every room) FAILS;
   (3) with the switch off the camera has the example yaw (180) in every room, as before C1; (4) the room framing: all 8 corners of the room's box (at its lowest and highest tile) inside the panel, the room centred, for the 6 rooms of dac_stage and for the rooms 14 and 44; mutation noRoomFrame (the hero framing) FAILS;
   (5) the Hero framing is the calibrated one (px per tile = heroFrac x panel height / tilesPerH); (6) the state ends with the window session; the manifest keys `orient` / `frame` are written only when set and inert at load.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_orient_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const YAW = { 17: 0, 10: 270, 20: 270, 27: 180, 6: 90, 5: 90 };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await idle(); };
  const goRoom = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, id); await idle(); };
  const YAWNOW = () => ev(() => ({ yaw: window.__evo.view().yaw, room: window.__evo.st.orientId, tech: window.__evo.st.tech }));
  // (1) the controls
  await setMode('stage'); await clickEx('x4_stage');
  const c1 = await ev(() => ({ o: document.querySelector('#t-stageOrient') && document.querySelector('#t-stageOrient').disabled, f: document.querySelector('#stageFrame') && document.querySelector('#stageFrame').disabled, tech: window.__evo.st.tech, orient: window.__evo.st.stage.orient, yaw: window.__evo.view().yaw }));
  ok('the controls exist in mode 3 and are greyed in a legacy example (no window); the legacy example keeps technique B, no orientation, its pack yaw (90)', c1.o === true && c1.f === true && c1.tech === 'B' && c1.orient === 'off' && c1.yaw === 90, c1);
  await clickEx('dac_stage');
  const c2 = await ev(() => ({ o: document.querySelector('#t-stageOrient').disabled, chk: document.querySelector('#t-stageOrient').checked, fr: document.querySelector('#stageFrame').value, tech: window.__evo.st.tech, techs: window.EVO.modes.byId('stage').techs, main: window.EVO.modes.MODES.filter((x) => x.main.includes('stageOrient') && x.main.includes('stageFrame')).map((x) => x.id) }));
  ok('in dac_stage the switch is on, the framing is Hero, the technique is Box and B stays offered; both controls are main controls of mode 3 only', !c2.o && c2.chk && c2.fr === 'hero' && c2.tech === 'box' && c2.techs.join() === 'box,B' && c2.main.join() === 'stage', c2);
  // (2) the yaw of the room the hero stands in
  const got = {}; for (const id of [17, 10, 20, 27, 6, 5]) { await goRoom(id); const r = await YAWNOW(); got[id] = r.yaw; }
  ok(`the camera yaw is the yaw of the room of the hero: ${JSON.stringify(got)}`, Object.entries(YAW).every(([id, y]) => got[id] === y), got);
  await goRoom(17); const y0 = (await YAWNOW()).yaw; await page.click('#stageNext'); await idle(); const y1 = await YAWNOW(); await page.click('#stageNext'); await idle(); const y2 = await YAWNOW();
  ok(`crossing with Next room: the yaw changes to the one of the new room (17: ${y0} -> room ${y1.room}: ${y1.yaw} -> room ${y2.room}: ${y2.yaw})`, y0 === 0 && y1.room === 10 && y1.yaw === 270 && y2.room === 20 && y2.yaw === 270);
  await goRoom(17); await ev(() => { window.EVO.orientTest = { fixedYaw: 180 }; window.__evo.S().orient = null; window.__evo.redraw(); }); await idle(); const m1 = (await YAWNOW()).yaw; await page.click('#stageNext'); await idle(); await page.click('#stageNext'); await idle(); await page.click('#stageNext'); await idle(); await page.click('#stageNext'); await idle(); const m2 = (await YAWNOW()).yaw; await ev(() => { window.EVO.orientTest = undefined; window.__evo.S().orient = null; });
  ok(`MUTATION fixedYaw (one yaw for every room): the yaw does not change when the hero crosses (${m1} -> ${m2}): the crossing check FAILS`, m1 === m2 && !(m1 === 0 && m2 === 90));
  // (3) the switch off: the example yaw in every room
  await ev(() => { const s = document.querySelector('#t-stageOrient'); s.click(); }); await idle(); const off = {}; for (const id of [17, 6, 5]) { await goRoom(id); off[id] = (await YAWNOW()).yaw; }
  ok(`orientation off: the camera has the example yaw (180) in every room, as before C1 (${JSON.stringify(off)})`, Object.values(off).every((y) => y === 180), off);
  await ev(() => { document.querySelector('#t-stageOrient').click(); }); await idle();
  // (5) the hero framing is the calibrated one
  await goRoom(17); const hf = await ev(() => { const e = window.__evo, v = e.view(), cv = document.querySelector('#stage canvas'), h = e.st.persH || cv.clientHeight; return { px: v.zoom * e.st.fitSc, want: e.st.stage.heroFrac * h / e.st.stage.tilesPerH }; });
  ok(`the Hero framing is the calibrated follow camera: ${hf.px.toFixed(2)} px per tile = heroFrac x panel height / tilesPerH (${hf.want.toFixed(2)})`, Math.abs(hf.px / hf.want - 1) < 0.002, hf);
  // (4) the room framing: the box of the room inside the panel, centred
  const box = (id) => ev((id) => { const e = window.__evo, E = window.EVO, S = e.S(), T = S.orient, r = T.byId.get(id), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = e.st.persH || cv.clientHeight, cam = E.makeCam(S, e.P, e.view(), w, h); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const x of [r.bbox[0], r.bbox[2]]) for (const y of [r.bbox[1], r.bbox[3]]) for (const z of [r.hMin, r.hMax]) { const c = cam.p(x, y, z); x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); }
    const cc = cam.p((r.bbox[0] + r.bbox[2]) / 2, (r.bbox[1] + r.bbox[3]) / 2, (r.hMin + r.hMax) / 2); return { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1), w, h, cx: Math.round(cc[0]), cy: Math.round(cc[1]), yaw: e.view().yaw }; }, id);
  const inside = (b) => b.x0 >= 0 && b.x1 <= b.w && b.y0 >= 0 && b.y1 <= b.h, centred = (b) => Math.abs(b.cx - b.w / 2) < 3 && Math.abs(b.cy - b.h / 2) < 3;
  await frame('room'); const res = {}; for (const id of [17, 10, 20, 27, 6, 5]) { await goRoom(id); res[id] = await box(id); }
  ok(`room framing, the 6 rooms of dac_stage: the 8 corners of the room's box (lowest and highest tile) inside the panel and the room centred (${Object.entries(res).map(([id, b]) => id + ': ' + b.x0 + '-' + b.x1 + ' x ' + b.y0 + '-' + b.y1).join('; ')})`, Object.values(res).every((b) => inside(b) && centred(b)), res);
  for (const id of [14, 44]) { await clickEx('mockt_' + (id === 14 ? 'z14' : 'x44')); await frame('room'); await goRoom(id); const b = await box(id); res[id] = b;
    ok(`room framing, room ${id} (a window of one room, yaw ${b.yaw}): the box inside the panel (${b.x0}-${b.x1} x ${b.y0}-${b.y1} of ${b.w} x ${b.h}) and centred`, inside(b) && centred(b), b); }
  await clickEx('dac_stage'); await frame('room'); await goRoom(6); await ev(() => { window.EVO.orientTest = { noRoomFrame: true }; window.__evo.st.roomFit = null; window.__evo.redraw(); }); await idle(); const mb = await box(6); await ev(() => { window.EVO.orientTest = undefined; window.__evo.st.roomFit = null; });
  ok(`MUTATION noRoomFrame (the hero framing): room 6 (63 x 35 tiles) does not fit the panel (${mb.x0}-${mb.x1} x ${mb.y0}-${mb.y1}): the framing check FAILS`, !inside(mb), mb);
  // (6) the session and the manifest
  const man = await ev(() => { const e = window.__evo; e.st.stage.frame = 'hero'; const b1 = e.viewerBlock().stage; e.st.stage.frame = 'room'; e.st.stage.orient = 'off'; const b2 = e.viewerBlock().stage; e.st.stage.orient = 'on'; const b3 = e.viewerBlock().stage; return { frameHero: 'frame' in b1, orientOn1: b1.orient, frameRoom: b2.frame, orientOff: 'orient' in b2, orientOn: b3.orient }; });
  ok('manifest: viewer.stage.orient is written only when on, viewer.stage.frame only when "room"', man.frameHero === false && man.orientOn1 === 'on' && man.frameRoom === 'room' && man.orientOff === false && man.orientOn === 'on', man);
  const bad = await ev(() => { let n = 0; for (const b of [{ orient: 'yes' }, { frame: 'both' }, { orient: 1 }]) { try { window.EVO.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { stage: b } }); } catch (e) { if (/viewer\.stage\.(orient|frame)/.test(e.message)) n++; } } return n; });
  ok('manifest: an unknown orient / frame is rejected with a clear error', bad === 3, bad);
  await setMode('terrain'); const end = await ev(() => ({ o: window.__evo.st.stage.orient, f: window.__evo.st.stage.frame, id: window.__evo.st.orientId }));
  ok('the state ends with the window session: orientation off, framing Hero (leaving to mode 1)', end.o === 'off' && end.f === 'hero' && !end.id, end);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
