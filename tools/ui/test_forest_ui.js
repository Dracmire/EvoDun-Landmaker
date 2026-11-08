/* FOREST in the viewer (M3a commit 2): the two examples of mode 3, "Forest A (v53)" and "Forest B (amplified relief)", with the built-in sources `forest_a` / `forest_b` (the PNGs of docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated/ embedded as base64 in data/packs.js).
   (1) the examples exist in mode 3 only and name their sources; the first example of the mode is still dac_stage;
   (2) clicking one enters the window session: pack, zones (6), window = the lowest zone, terraces / sub-terraces of the variant (A 2 / 6, B 6 / 3), the Stage rules on the zones (orientation, planes, props);
   (3) the footprint rule on the windows [valley, main slope, plateau N] (the CONTROL of M3c: unchanged, A 235 tiles with the tower, B 328), [valley, east slope] and [valley, east slope, plateau N] = the frozen numbers of tools/test_forest_roles.js;
   (4) the window state ends on EVERY exit: another example (dac_stage gets its own terraces and sub-terraces back), the mode selector; MUTATION skipShapeRestore (the restore of the terraces / sub-terraces) is caught;
   (5) without the modes layer the sources are plain sources: selecting one makes no window and no stage state (R7).
     NODE_PATH=$(npm root -g) node tools/ui/test_forest_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const ST = () => ev(() => { const e = window.__evo, S = e.S(), st = e.st, zi = S && S.stageZonesInfo; return { mode: st.modeId, ex: st.exampleId, pack: st.pack, win: !!st.win, rooms: st.stageRooms.slice(), terraces: e.P.terraces, subs: e.P.subs, terH: e.P.terH, zones: zi ? zi.zones : 0, info: zi && { window: zi.window, discarded: zi.discarded, total: zi.total }, ori: S && S.orient ? S.orient.rooms.length : 0, planes: !!(S && S.stagePlanes), props: !!(S && S.propsC), readout: document.querySelector('#info').innerText.slice(0, 900) }; });
  await ev(() => window.__evo.setMode('stage')); await idle();
  const ex = await ev(() => ({ s: window.EVO.modes.byId('stage').examples.map((x) => [x.id, x.src, !!x.stageZones, x.terraces, x.subs]), first: window.EVO.modes.byId('stage').examples[0].id, others: ['terrain', 'rooms', 'curves'].map((id) => window.EVO.modes.byId(id).examples.filter((x) => /forest/.test(x.id)).length).join() }));
  ok('mode 3 offers forest_a (source forest_a, terraces 2, sub-terraces 6) and forest_b (forest_b, 6, 3), both zone windows; the other modes offer none; the default example is still dac_stage', JSON.stringify(ex.s.filter((x) => /forest/.test(x[0]))) === JSON.stringify([['forest_a', 'forest_a', true, 2, 6], ['forest_b', 'forest_b', true, 6, 3]]) && ex.others === '0,0,0' && ex.first === 'dac_stage', ex);
  const TOT = { forest_a: { control: 235, route: 8, route3: 207 }, forest_b: { control: 328, route: 40, route3: 246 } }; // frozen (tools/test_forest_roles.js)
  const base = await ST();
  for (const [id, terr, subs] of [['forest_a', 2, 6], ['forest_b', 6, 3]]) {
    await page.click(`#examples button[data-id="${id}"]`); await idle(); const s = await ST();
    ok(`${id}: the window session is on, pack ${s.pack}, window = zone ${JSON.stringify(s.rooms)} (the lowest), ${s.zones} zones, terraces ${s.terraces} and sub-terraces ${s.subs}, terH ${s.terH} (2 H x 2), orientation of ${s.ori}, planes ${s.planes}, props ${s.props}`, s.mode === 'stage' && s.ex === id && s.pack === id && s.win && s.rooms.join() === '1' && s.zones === 6 && s.terraces === terr && s.subs === subs && s.terH === 4 && s.ori === 1 && s.planes && s.props, s);
    ok(`${id}: the readout names the zones of the PNG`, /PNG zones: 6, window zone \d+/.test(s.readout), s.readout);
    // the windows (raw ids): the control [valley, main slope, plateau N], the route [valley, east slope] and [valley, east slope, plateau N] = the frozen figures (dropped walkable tiles, tower included)
    for (const [raws, name] of [[[1, 5, 4], 'control'], [[1, 6], 'route'], [[1, 6, 4], 'route3']]) {
      await ev((raws) => { const e = window.__evo, tb = window.EVO.stage.zoneTable(e.packs[e.st.pack].pack); e.stageSetWindow(raws.map((r) => tb.toK.get(r))); }, raws); await idle(); const r = await ST(), want = TOT[id][name];
      ok(`${id}: the window ${name} [${raws}] drops ${r.info && r.info.total} walkable tiles (tower included), the frozen figure ${want}`, r.info && r.info.total === want, r.info);
    }
  }
  // (4) exits
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); const d = await ST();
  ok(`another example (dac_stage): its own rooms (${d.rooms}), no PNG zones, terraces ${d.terraces} and sub-terraces ${d.subs} as they were when the window was entered (${base.terraces} / ${base.subs})`, d.ex === 'dac_stage' && d.rooms.join() === '17,10,20,27,6,5' && d.zones === 0 && d.terraces === base.terraces && d.subs === base.subs, { d, base });
  await page.click('#examples button[data-id="forest_a"]'); await idle();
  await ev(() => window.__evo.setMode('terrain')); await idle(); const x = await ST();
  ok(`the mode selector (winExit) ends the window: no session (${x.win}), no rooms, terraces ${x.terraces} and sub-terraces ${x.subs} back to the entry values (${base.terraces} / ${base.subs})`, !x.win && x.rooms.length === 0 && x.terraces === base.terraces && x.subs === base.subs, { x, base });
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="forest_a"]'); await idle();
  await ev(() => { window.EVO.modesTest = Object.assign(window.EVO.modesTest || {}, { skipShapeRestore: true }); }); await ev(() => window.__evo.setMode('terrain')); await idle(); const m = await ST();
  ok(`MUTATION skipShapeRestore is caught: the exit leaves the sub-terraces of the variant (${m.subs}) instead of ${base.subs} (the destination's base reset puts the terraces back to ${m.terraces}, so only the sub-terraces would leak)`, m.subs === 6 && base.subs !== 6, m);
  await ev(() => { window.EVO.modesTest.skipShapeRestore = false; });
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close();
  // (5) without the modes layer
  const b = await open({ w: 1500, h: 900 }), pg = b.page;
  await pg.selectOption('#src', 'forest_a'); await b.idle(); await b.idle();
  const o = await pg.evaluate(() => { const e = window.__evo, S = e.S(); return { pack: e.st.pack, zone: !!e.packs.forest_a.pack.fields.zone, win: !!e.st.win, rooms: e.st.stageRooms.length, zones: S.stageZones ? 1 : 0, w: e.packs.forest_a.pack.width, h: e.packs.forest_a.pack.height }; });
  ok(`without the modes layer the source is a plain source: ${o.w} x ${o.h}, the role zone is carried, no window (${o.win}), no stage state (${o.rooms} rooms, zone map ${o.zones})`, o.pack === 'forest_a' && o.zone && !o.win && o.rooms === 0 && o.zones === 0 && o.w === 52 && o.h === 46, o);
  ok('no page errors (without modes)', b.errs.length === 0, b.errs);
  await b.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
