/* STAGE PROPS BY ROOM (mode 3, PR C3) in the viewer: the switch "Props by room" (src/props.js, src/ui.js).
   (1) the control: greyed in a legacy example, enabled in dac_stage; ON at the start of dac_stage and of the two one-room examples; a main control of mode 3 only;
   (2) the props of the hero's room (room 17: 7 torches, 1 pillar, no goal; room 5: 7 torches and the goal; room 14: 16 torches and the goal) and crossing to another room changes them WITHOUT rebuilding S when the planes are off (they are billboards);
   (3) off = the picture of a scene without props, identical after on -> off; on changes the picture;
   (4) the state ends with the window session; the manifest key `props` is written only when on, inert at load, and an unknown value is rejected.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_props_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const goRoom = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, id); await idle(); await idle(); };
  const pix = async () => crypto.createHash('sha1').update(await a.canvas()).digest('hex');
  const PR = () => ev(() => { const S = window.__evo.S(), c = S.propsC; return c ? { room: c.data.room, torches: c.data.torches.length, pillars: c.data.pillars.length, goal: !!c.data.goal, noPath: c.data.noPath } : null; });
  const tog = async (id) => { await page.click(id); await idle(); await idle(); };
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('x4_stage');
  const c1 = await ev(() => { const s = document.querySelector('#t-stageProps'); return s ? { dis: s.disabled, on: window.__evo.st.stage.props } : null; });
  ok('the switch exists in mode 3 and is greyed in a legacy example (no window), off', c1 && c1.dis === true && c1.on === 'off', c1);
  await clickEx('dac_stage');
  const c2 = await ev(() => ({ dis: document.querySelector('#t-stageProps').disabled, chk: document.querySelector('#t-stageProps').checked, main: window.EVO.modes.MODES.filter((x) => x.main.includes('stageProps')).map((x) => x.id).join() }));
  ok('in dac_stage the switch is enabled and ON; it is a main control of mode 3 only', !c2.dis && c2.chk && c2.main === 'stage', c2);
  const p17 = await PR(); ok(`the props of the hero's room 17: ${p17 && p17.torches} torches, ${p17 && p17.pillars} pillar, no goal`, p17 && p17.room === 17 && p17.torches === 7 && p17.pillars === 1 && !p17.goal && !p17.noPath, p17);
  const pOn = await pix(); await tog("#t-stageProps"); const pOff = await pix();
  ok('switch off: no props (the picture changes with the switch)', pOff !== pOn  && !(await ev(() => window.__evo.st.stage.props === 'on')), { pOn, pOff });
  await tog('#t-stageProps'); const pOn2 = await pix(); ok('on again: the identical picture of before (deterministic)', pOn2 === pOn);
  await tog('#t-stageProps'); const pOff2 = await pix(); ok('off again: the identical picture of the first off (a scene without props)', pOff2 === pOff);
  await tog('#t-stageProps');
  // billboards: crossing does not rebuild S when the planes are off
  await tog('#t-stagePlanes'); await ev(() => { window.EVO.orientTest = { fixedPreferYaw: 180 }; window.__evo.redraw(); }); await idle(); await idle(); await goRoom(17); await ev(() => { window.__S17 = window.__evo.S(); });
  await goRoom(5); const p5 = await PR(), same = await ev(() => window.__evo.S() === window.__S17);
  ok(`planes off (and the ramps by yaw off, which also build a shape per room): crossing to room 5 changes the props (${p5 && p5.torches} torches, goal ${p5 && p5.goal}) and does NOT rebuild S (billboards)`, same && p5 && p5.room === 5 && p5.torches === 7 && p5.goal && p5.pillars === 0, { same, p5 });
  await ev(() => { window.EVO.orientTest = undefined; }); await tog('#t-stagePlanes');
  for (const [id, room, t] of [["mockt_z14", 14, 16], ["mockt_x44", 44, 26]]) { await clickEx(id); const p = await PR(); ok(`${id}: props ON at the start, room ${room}: ${p && p.torches} torches and the goal`, p && p.room === room && p.torches === t && p.goal && !p.noPath, p); }
  const man = await ev(() => { const e = window.__evo; e.st.stage.props = 'off'; const b1 = e.viewerBlock().stage; e.st.stage.props = 'on'; const b2 = e.viewerBlock().stage; return { off: 'props' in b1, on: b2.props }; });
  ok('manifest: viewer.stage.props is written only when on', man.off === false && man.on === 'on', man);
  const bad = await ev(() => { let n = 0; for (const b of [{ props: 'yes' }, { props: 1 }, { props: true }]) { try { window.EVO.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { stage: b } }); } catch (e) { if (/viewer\.stage\.props/.test(e.message)) n++; } } return n; });
  ok('manifest: an unknown props value is rejected with a clear error', bad === 3, bad);
  await ev(() => window.__evo.setMode('terrain')); await idle(); const end = await ev(() => ({ p: window.__evo.st.stage.props, chk: document.querySelector('#t-stageProps').checked }));
  ok('the state ends with the window session: props off (leaving to mode 1)', end.p === 'off' && !end.chk, end);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
