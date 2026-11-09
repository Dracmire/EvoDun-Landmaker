/* AURHEA'S FOUNTAIN in the viewer (M3b commit 2): the example `aurhea` of mode 3 with the built-in source `aurhea` (the PNGs of docs/crystallizers/03-stage/refs/dq3/aurheas_fountain/derived/ as base64 in data/packs.js; the water is pack data, pack.masks.water).
   (1) the example exists in mode 3 only, names its source and is a zone window (terraces 1, sub-terraces 5);
   (2) clicking it enters the window session: pack, FIVE zones, window = the lowest zone, the list of M2c shows five rows;
   (3) the water is BLOCKED (S.block) and is not void (300 tiles); the window [south meadow, peninsula] (k 1 and 4) is built with the 16 walkable tiles of the peninsula and no page error;
   (4) the window state ends on every exit (dac_stage gets its terraces and sub-terraces back).
     NODE_PATH=$(npm root -g) node tools/ui/test_aurhea_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const ST = () => ev(() => { const e = window.__evo, S = e.S(), st = e.st, zi = S && S.stageZonesInfo; let wb = 0, wv = 0, wn = 0; if (S) for (let i = 0; i < S.n; i++) if (S.water[i]) { wn++; if (!S.block[i]) wb++; if (S.void && S.void[i]) wv++; } return { mode: st.modeId, ex: st.exampleId, pack: st.pack, win: !!st.win, rooms: st.stageRooms.slice(), terraces: e.P.terraces, subs: e.P.subs, zones: zi ? zi.zones : 0, rows: document.querySelectorAll('#stageWindow .wrow').length, onRows: document.querySelectorAll('#stageWindow .wrow.on').length, water: wn, waterNotBlocked: wb, waterVoid: wv, w: S && S.mapW, h: S && S.mapH, readout: (document.querySelector('#info') || {}).textContent || '' }; });
  await ev(() => window.__evo.setMode('stage')); await idle(); const base = await ST();
  const ex = await ev(() => ({ s: window.EVO.modes.byId('stage').examples.filter((x) => x.id === 'aurhea').map((x) => [x.id, x.src, !!x.stageZones, !!x.stageHero, x.terraces, x.subs]), others: ['terrain', 'rooms', 'curves'].map((id) => window.EVO.modes.byId(id).examples.filter((x) => x.id === 'aurhea').length).join(), first: window.EVO.modes.byId('stage').examples[0].id }));
  ok('mode 3 offers aurhea (source aurhea, a zone window, terraces 1, sub-terraces 5); the other modes none; the default example of mode 3 is still dac_stage', JSON.stringify(ex.s) === JSON.stringify([['aurhea', 'aurhea', true, true, 1, 5]]) && ex.others === '0,0,0' && ex.first === 'dac_stage', ex);
  await page.click('#examples button[data-id="aurhea"]'); await idle(); const s = await ST();
  ok(`the window session is on: pack ${s.pack}, ${s.w} x ${s.h}, ${s.zones} zones, window = zone ${JSON.stringify(s.rooms)} (the lowest = the south meadow), terraces ${s.terraces}, sub-terraces ${s.subs}`, s.mode === 'stage' && s.ex === 'aurhea' && s.pack === 'aurhea' && s.win && s.w === 48 && s.h === 44 && s.zones === 5 && s.rooms.join() === '1' && s.terraces === 1 && s.subs === 5, s);
  ok(`the list of M2c shows the five zones (${s.rows} rows, ${s.onRows} marked)`, s.rows === 5 && s.onRows === 1, s);
  ok(`the water: ${s.water} tiles, ${s.waterNotBlocked} not blocked, ${s.waterVoid} void`, s.water === 300 && s.waterNotBlocked === 0 && s.waterVoid === 0, s);
  await ev(() => { const e = window.__evo; e.stageSetWindow([1, 4]); }); await idle(); const w = await ST();
  const pen = await ev(() => { const e = window.__evo, S = e.S(); let n = 0; for (let i = 0; i < S.n; i++) if (S.stageZones && S.stageZones[i] === 4 && !S.block[i]) n++; return n; });
  ok(`the window [south meadow, peninsula] = k [${w.rooms}]: the peninsula has ${pen} walkable tiles in the footprint (16), ${w.onRows} rows marked`, w.rooms.join() === '1,4' && pen === 16 && w.onRows === 2, { w, pen });
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); const d = await ST();
  ok(`another example (dac_stage): rooms ${d.rooms}, no PNG zones, terraces ${d.terraces} and sub-terraces ${d.subs} as when the window was entered (${base.terraces} / ${base.subs})`, d.ex === 'dac_stage' && d.rooms.join() === '17,10,20,27,6,5' && d.zones === 0 && d.terraces === base.terraces && d.subs === base.subs, { d, base });
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
