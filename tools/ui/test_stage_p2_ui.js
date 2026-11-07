/* STAGE P2 (mode 3) in the viewer: the shape of each room kept, the yaw that turns, the ramps by the yaw of the room (src/ui.js).
   (1) the shape of each room is built on the FIRST visit and kept: going back to a visited room builds nothing (counter of builds, the same S object comes back); mutation noCache FAILS;
   (2) the cache (6 rooms at most, its size in MB is printed) is emptied on the three exits of the window: the mode selector (winExit), another example (applyScenario) and the load of images (loadFiles);
   (3) the yaw turns: crossing 17 -> 10 (yaw 0 -> 270) the first frame has the OLD yaw with the NEW room's shape, the middle frame (a controlled clock) a yaw between the two (the short way, 315), the last the new one; mutation snapYaw (a cut) FAILS; orientation off: no turn;
   (4) the ramps follow the yaw of the room: room 5 (yaw 90) is built with the lateral axis y (S.rampPreferYaw 90), more of its y-lateral transitions are built up (fill) than with the fixed 180 of S3; mutation fixedPreferYaw (180) FAILS.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_p2_ui.js */
const { open, mapFile } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const goRoom = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, id); await idle(); await idle(); await idle(); };
  const ST = () => ev(() => { const e = window.__evo; return { builds: e.st.shapeBuilds, hits: e.st.cacheHits || 0, room: e.st.orientId, cache: e.cacheStats() }; });
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('dac_stage');
  // (1) the cache
  await goRoom(17); const b17 = await ST(); await ev(() => { window.__S17 = window.__evo.S(); });
  await goRoom(10); const b10 = await ST(); await goRoom(20); await goRoom(17); const back = await ST(), same = await ev(() => window.__evo.S() === window.__S17);
  ok(`the first visit builds (17: ${b17.builds}, 10: ${b10.builds}) and going back to room 17 builds nothing (${back.builds} builds, +${back.hits - b10.hits} cache hit) and returns the same shape object`, b10.builds === b17.builds + 1 && back.builds === b10.builds + 1 && back.hits >= 1 && same, { b17, b10, back, same });
  for (const id of [27, 6, 5]) await goRoom(id); const c6 = await ST(); await goRoom(6); const c6b = await ST();
  console.log(`  cache with the 6 rooms: ${c6.cache.rooms} shapes, ${c6.cache.mb.toFixed(1)} MB of typed arrays`);
  ok('the 6 rooms of the window are cached (no more) and a return to any of them builds nothing', c6.cache.rooms === 6 && c6b.builds === c6.builds, { c6, c6b });
  await ev(() => { window.EVO.orientTest = { noCache: true }; }); await goRoom(17); const n0 = await ST(); await goRoom(10); const n1 = await ST(); await goRoom(17); const n2 = await ST(); await ev(() => { window.EVO.orientTest = undefined; });
  ok(`MUTATION noCache: going back to a visited room builds again (${n1.builds - n0.builds} and ${n2.builds - n1.builds} builds for two crossings): the cache check FAILS`, n2.builds - n1.builds >= 1 && n1.builds - n0.builds >= 1);
  // (2) the exits
  await goRoom(17); await goRoom(10); const pre = await ST();
  await page.click('#examples button[data-id="mockt_z14"]'); await idle(); await idle(); const e1 = await ST();
  ok(`applyScenario (another example): the cache holds only the new window's room (${pre.cache.rooms} -> ${e1.cache.rooms}: ${e1.cache.keys})`, pre.cache.rooms >= 2 && e1.cache.rooms === 1 && /^14\|/.test(e1.cache.keys[0]), e1);
  await clickEx('dac_stage'); await goRoom(17); await goRoom(10); await ev(() => window.__evo.setMode('terrain')); await idle(); await idle(); const e2 = await ST();
  ok(`winExit (the mode selector): the cache is empty (${e2.cache.rooms})`, e2.cache.rooms === 0, e2);
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('dac_stage'); await goRoom(17); await goRoom(10); const pre3 = await ST();
  await page.setInputFiles('#file', ['height', 'zones', 'edges'].map((n) => mapFile('maps', n))); await page.waitForTimeout(2000); await idle(); const e3 = await ST();
  ok(`loadFiles (images loaded while in the window): the cache is empty (${pre3.cache.rooms} -> ${e3.cache.rooms})`, pre3.cache.rooms >= 2 && e3.cache.rooms === 0, { pre3, e3 });
  // (3) the yaw turns
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('dac_stage'); await goRoom(17);
  const turn = async (mut) => { await ev((m) => { let t = 0; window.__clock = { set: (v) => { t = v; } }; window.EVO.orientTest = Object.assign({ now: () => t }, m); }, mut || {});
    await goRoom(17); await ev(() => window.__clock.set(1e6)); await goRoom(17); const S0 = await ev(() => window.__evo.view().yaw);
    await ev(() => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, 10); window.__clock.set(2e6); e.st.stageIdx = e.st.stageRooms.indexOf(10); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }); await page.waitForTimeout(150);
    const f0 = await ev(() => ({ yaw: window.__evo.view().yaw, key: window.__evo.S().shapeKey })); // the first frame of the turn: clock at t0
    await ev(() => window.__clock.set(2e6 + 200)); await ev(() => window.__evo.redraw()); await page.waitForTimeout(150); const fm = await ev(() => window.__evo.view().yaw);
    await ev(() => window.__clock.set(2e6 + 500)); await ev(() => window.__evo.redraw()); await page.waitForTimeout(150); const f1 = await ev(() => window.__evo.view().yaw); await ev(() => { window.EVO.orientTest = undefined; }); return { S0, f0, fm, f1 }; };
  const t1 = await turn(); const norm = (y) => ((y % 360) + 360) % 360;
  ok(`the turn 17 -> 10 (yaw 0 -> 270): first frame yaw ${norm(t1.f0.yaw)} with the shape of room ${t1.f0.key}, middle ${norm(t1.fm)}, end ${norm(t1.f1)} (the short way round: 0 -> 315 -> 270)`, norm(t1.f0.yaw) < 5 || norm(t1.f0.yaw) > 355 ? /^10\|/.test(t1.f0.key) && Math.abs(norm(t1.fm) - 315) < 12 && Math.abs(norm(t1.f1) - 270) < 1 : false, t1);
  const t2 = await turn({ snapYaw: true });
  ok(`MUTATION snapYaw (a cut): the middle frame already has yaw ${norm(t2.fm)}, not a yaw between the two: the turn check FAILS`, !(Math.abs(norm(t2.fm) - 315) < 12), t2);
  // orientation off: no turn
  await ev(() => { document.querySelector('#t-stageOrient').click(); }); await idle(); await goRoom(17); const yOff = await ev(() => window.__evo.view().yaw); await goRoom(10); const yOff2 = await ev(() => window.__evo.view().yaw);
  ok(`orientation off: no turn, the yaw is the example's (${yOff} -> ${yOff2})`, yOff === 180 && yOff2 === 180, { yOff, yOff2 });
  await ev(() => { document.querySelector('#t-stageOrient').click(); }); await idle();
  // (4) the ramps by the yaw of the room: the shape of each room is carved with the lateral axis of ITS yaw (the node test of src/shape.js, tools/test_ramp_prefer_fill.js, measures what the axis changes)
  const prefOf = async (mut) => { await clickEx('dac_stage'); await ev((m) => { window.EVO.orientTest = m; }, mut || undefined); const o = {}; for (const id of [17, 10, 27, 5]) { await goRoom(id); o[id] = await ev(() => window.__evo.S().rampPreferYaw); } await ev(() => { window.EVO.orientTest = undefined; }); return o; };
  const pr = await prefOf();
  ok(`the shape of each room is carved with its own yaw (S.rampPreferYaw; rooms 17 and 27 look along x, the lateral axis of 0 and 180 is the same): ${JSON.stringify(pr)}`, pr[17] % 180 === 0 && pr[27] % 180 === 0 && pr[10] === 270 && pr[5] === 90, pr);
  const prm = await prefOf({ fixedPreferYaw: 180 });
  ok(`MUTATION fixedPreferYaw (the fixed 180 of S3): no yaw reaches the carve (${JSON.stringify(prm)}): the check FAILS`, !(prm[5] === 90), prm);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
