/* STAGE PLANES BY ROOM (mode 3, PR C2) in the viewer: the switch "Planes by room" (src/planes.js, src/ui.js).
   (1) the control: greyed in a legacy example, enabled in dac_stage; ON at the start of dac_stage and of the two one-room examples; a main control of mode 3 only;
   (2) S carries the planes of the hero's room (room 17: wall 42, columns 7, front 27 tiles) and crossing to another room REBUILDS S with that room's planes (room 20: 44 / 10 / 64);
   (3) the walkable footprint keeps every height with the switch on or off, alone or with the island border; off = no planes in S, the picture changes with the switch and returns when it is off again;
   (4) the state ends with the window session; the manifest key `planes` is written only when on, inert at load, and an unknown value is rejected.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_planes_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const goRoom = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, id); await idle(); await idle(); };
  const pix = async () => crypto.createHash('sha1').update(await a.canvas()).digest('hex');
  const PL = () => ev(() => { const S = window.__evo.S(), p = S.stagePlanes; return p ? { room: p.room, wall: p.wall, cols: p.cols, front: p.front, yaw: p.yaw } : null; });
  const WH = () => ev(() => { const S = window.__evo.S(); let h = 7; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i])) h = (h * 31 + Math.round(S.levelH[S.fine[i]] * 1e6)) % 1000000007; return h; });
  const tog = async () => { await page.click('#t-stagePlanes'); await idle(); await idle(); };
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('x4_stage');
  const c1 = await ev(() => { const s = document.querySelector('#t-stagePlanes'); return s ? { dis: s.disabled, on: window.__evo.st.stage.planes } : null; });
  ok('the switch exists in mode 3 and is greyed in a legacy example (no window), off', c1 && c1.dis === true && c1.on === 'off', c1);
  await clickEx('dac_stage');
  const c2 = await ev(() => ({ dis: document.querySelector('#t-stagePlanes').disabled, chk: document.querySelector('#t-stagePlanes').checked, main: window.EVO.modes.MODES.filter((x) => x.main.includes('stagePlanes')).map((x) => x.id).join() }));
  ok('in dac_stage the switch is enabled and ON; it is a main control of mode 3 only', !c2.dis && c2.chk && c2.main === 'stage', c2);
  const p17 = await PL(); ok(`S carries the planes of the hero's room 17 (yaw 0): wall ${p17 && p17.wall}, columns ${p17 && p17.cols}, front ${p17 && p17.front}`, p17 && p17.room === 17 && p17.wall === 42 && p17.cols === 7 && p17.front === 27 && p17.yaw === 0, p17);
  const hOn = await WH(); await ev(() => { window.__S17 = window.__evo.S(); });
  const t0 = Date.now(); await goRoom(20); const ms = Date.now() - t0, p20 = await PL(), fresh = await ev(() => window.__evo.S() !== window.__S17);
  console.log(`crossing 17 -> 20 (S rebuilt with the planes of the new room): ${ms} ms headless`);
  ok(`crossing to room 20 rebuilds S with ITS planes (wall ${p20 && p20.wall}, columns ${p20 && p20.cols}, front ${p20 && p20.front}, yaw ${p20 && p20.yaw})`, fresh && p20 && p20.room === 20 && p20.wall === 44 && p20.cols === 10 && p20.front === 64 && p20.yaw === 270, p20);
  ok('the walkable footprint has the same heights in room 17 and room 20 (the planes only change what is not walkable)', hOn === (await WH()));
  await goRoom(17); const pOn = await pix(); await tog(); const off = await PL(), hOff = await WH(), pOff = await pix();
  ok('switch off: no planes in S, the picture changes, the walkable heights are the same as with the planes', off === null && pOff !== pOn && hOff === hOn, { off, same: hOff === hOn });
  await tog(); const pOn2 = await pix(); ok('on again: the same planes and the identical picture of before (deterministic)', pOn2 === pOn && (await PL()).wall === 42);
  await ev(() => { const s = document.querySelector('#stageBorder'); s.value = 'island'; s.dispatchEvent(new Event('change')); }); await idle(); await idle();
  const both = await ev(() => { const S = window.__evo.S(); return { border: !!S.stageBorder, planes: !!S.stagePlanes }; }); ok('with the island border the planes combine: both in S, and the walkable heights are still the same', both.border && both.planes && (await WH()) === hOn, both);
  await ev(() => { const s = document.querySelector('#stageBorder'); s.value = 'off'; s.dispatchEvent(new Event('change')); }); await idle();
  for (const [id, room] of [['mockt_z14', 14], ['mockt_x44', 44]]) { await clickEx(id); const p = await PL(); ok(`${id}: planes ON at the start, S carries the planes of room ${room} (wall ${p && p.wall}, columns ${p && p.cols}, front ${p && p.front})`, p && p.room === room, p); }
  const man = await ev(() => { const e = window.__evo; e.st.stage.planes = 'off'; const b1 = e.viewerBlock().stage; e.st.stage.planes = 'on'; const b2 = e.viewerBlock().stage; return { off: 'planes' in b1, on: b2.planes }; });
  ok('manifest: viewer.stage.planes is written only when on', man.off === false && man.on === 'on', man);
  const bad = await ev(() => { let n = 0; for (const b of [{ planes: 'yes' }, { planes: 1 }, { planes: true }]) { try { window.EVO.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { stage: b } }); } catch (e) { if (/viewer\.stage\.planes/.test(e.message)) n++; } } return n; });
  ok('manifest: an unknown planes value is rejected with a clear error', bad === 3, bad);
  await ev(() => window.__evo.setMode('terrain')); await idle(); const end = await ev(() => ({ p: window.__evo.st.stage.planes, has: !!window.__evo.S().stagePlanes }));
  ok('the state ends with the window session: planes off, none in S (leaving to mode 1)', end.p === 'off' && !end.has, end);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
