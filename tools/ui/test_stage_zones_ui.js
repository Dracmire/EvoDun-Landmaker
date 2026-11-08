/* STAGE ZONES OF A PNG (mode 3, PR M2b) in the viewer: the example "Your images (PNG + roles)" of mode 3 (src/modes.js, src/ui.js, src/stage.js) with the synthetic fixture of tools/ui/gen_maps.py (`maps_stage`).
   (1) the example exists only in mode 3 (a window example with the loader of the images); before any file nothing is entered;
   (2) loading the fixture enters the window: example images, window session on, window = zone 1 (the lowest), the Stage rules on its zone (S.stageZones, the orientation table, the planes, the props), the readout names the zones;
   (3) a window of the chain [1, 2, 3] drops the 25 tiles of the island of zone 3 and says so in the readout; every zone of the window has an orientation record;
   (4) the window state ends on EVERY exit: the mode selector (winExit), another example (applyScenario: the DAC window has its own rooms, no zones of the image) and a new load (loadFiles: the session ends and is entered again, with ONE snapshot: leaving restores the units);
   (5) modes 1, 2 and 4 load the same files as before: no window, no stage state (R7).
     python3 tools/ui/gen_maps.py; NODE_PATH=$(npm root -g) node tools/ui/test_stage_zones_ui.js */
const { open, mapFile } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const FILES = ['height', 'zones', 'path'].map((n) => mapFile('maps_stage', n));
  const load = async () => { await page.setInputFiles('#file', FILES); await page.waitForTimeout(2500); await idle(); await idle(); };
  const ST = () => ev(() => { const e = window.__evo, S = e.S(), st = e.st; return { mode: st.modeId, ex: st.exampleId, win: !!st.win, rooms: st.stageRooms.slice(), terH: window.EVO && e.st.stage && document.querySelector('#s-terH') ? +document.querySelector('#s-terH').value : null, zones: S && S.stageZones ? 1 : 0, info: S && S.stageZonesInfo, ori: S && S.orient && S.orient.rooms.map((r) => r.id), planes: !!(S && S.stagePlanes), props: !!(S && S.propsC), readout: document.querySelector('#info').innerText.slice(0, 600), loader: !document.querySelector('#file').closest('[hidden]') }; });
  // (1) the example
  await ev(() => window.__evo.setMode('stage')); await idle();
  const ex = await ev(() => ({ s: window.EVO.modes.byId('stage').examples.filter((x) => x.images).map((x) => x.id), others: ['terrain', 'rooms', 'curves'].map((id) => window.EVO.modes.byId(id).examples.filter((x) => x.images && x.stageHero).length).join() }));
  ok('"Your images" is an example of mode 3 as a window example (stageHero, stageZones); the images examples of modes 1, 2 and 4 are not window examples', ex.s.join() === 'images' && ex.others === '0,0,0', ex);
  await page.click('#examples button[data-id="images"]'); await idle(); const pre = await ST();
  ok('before any file the loader is there and no window is entered', pre.ex === 'images' && !pre.win && pre.rooms.length === 0, pre);
  // (2) the load
  const pv0 = await ev(() => +document.querySelector('#s-terH').value);
  await load(); const s1 = await ST();
  ok(`the load enters the window: example ${s1.ex}, session ${s1.win}, window zone ${JSON.stringify(s1.rooms)} (the lowest), zone map ${s1.zones}, orientation of ${JSON.stringify(s1.ori)}, planes ${s1.planes}, props ${s1.props}`, s1.mode === 'stage' && s1.ex === 'images' && s1.win && s1.rooms.join() === '1' && s1.zones === 1 && s1.ori.join() === '1' && s1.planes && s1.props, s1);
  ok('the readout names the zones of the PNG and the dropped tiles (0 in zone 1)', /PNG zones: 3, window zone \d+ · 0 walkable tiles dropped/.test(s1.readout), s1.readout);
  // (3) the chain
  await ev(() => window.__evo.stageSetWindow([1, 2, 3])); await idle(); await idle(); const s3 = await ST();
  ok(`the window [1, 2, 3] drops the 25 tiles of the island of zone 3 (${s3.info && s3.info.total}) and the readout says so; the three zones have an orientation record (${s3.ori})`, s3.info && s3.info.total === 25 && s3.info.discarded[3] === 25 && /25 walkable tiles dropped/.test(s3.readout) && s3.ori.join() === '1,2,3', s3);
  // (4a) applyScenario: the DAC window
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); await idle(); const d1 = await ST();
  ok(`another example (applyScenario): the DAC window has its own rooms (${d1.rooms}), no zone map of the image, the readout has no PNG zones`, d1.ex === 'dac_stage' && d1.win && d1.rooms.join() === '17,10,20,27,6,5' && d1.zones === 0 && !/PNG zones/.test(d1.readout), d1);
  // (4c) loadFiles: back to the images, a new load while the window is on (one snapshot)
  await page.click('#examples button[data-id="images"]'); await idle(); await idle(); const m = await ST();
  await load(); const l1 = await ST();
  ok(`a new load (loadFiles) ends the session and enters it again: window ${l1.win}, zone ${JSON.stringify(l1.rooms)}, zone map ${l1.zones}`, l1.win && l1.rooms.join() === '1' && l1.zones === 1, l1);
  // (4b) winExit: the mode selector
  await ev(() => window.__evo.setMode('terrain')); await idle(); await idle(); const x1 = await ST(), tv = await ev(() => +document.querySelector('#s-terH').value);
  ok(`the mode selector (winExit) ends the window: session ${x1.win}, no rooms (${x1.rooms.length}), no zone state, the units are the ones of before (terH ${tv}, before ${pv0})`, !x1.win && x1.rooms.length === 0 && x1.zones === 0 && tv === pv0, { x1, tv, pv0 });
  // (5) the other modes load the same files as before
  for (const mode of ['terrain', 'curves', 'rooms']) {
    await ev((m) => window.__evo.setMode(m), mode); await idle();
    await page.click('#examples button[data-id="images"]'); await idle(); await load(); const o = await ST();
    ok(`mode ${mode}: the load of the same files makes no window and no zone state (session ${o.win}, rooms ${o.rooms.length}, zone map ${o.zones}), the example stays "images"`, o.mode === mode && !o.win && o.rooms.length === 0 && o.zones === 0 && o.ex === 'images', o);
  }
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
