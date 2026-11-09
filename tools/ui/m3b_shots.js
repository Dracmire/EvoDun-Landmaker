/* Screenshots of M3b (Aurhea's Fountain, the example `aurhea` of mode 3) into docs/crystallizers/03-stage/shots/m3b/: Cam 6, Box, orientation + props on (the defaults of the example), "Planes by room" ON and OFF, for the windows
   [south meadow, peninsula] (the one of the paired shot), [peninsula], [south meadow] and [north shore] (the control); with the hero in the FIRST zone of the window and, for [south, peninsula], also after "Next room" (the hero in the peninsula).
   Prints per shot: the yaw, the planes counts and the readout. No tuning of the look: these are measurements.
     NODE_PATH=$(npm root -g) node tools/ui/m3b_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/m3b');
const WINDOWS = [['south_pen', [1, 5], 'south meadow + peninsula'], ['pen', [5], 'peninsula'], ['south', [1], 'south meadow'], ['north', [4], 'north shore']];   // RAW zone ids
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const sw = async (id, on) => { const cur = await ev((id) => document.querySelector(id).checked, id); if (cur !== on) { await page.click(id); await idle(); } };
  const info = () => ev(() => { const e = window.__evo, S = e.S(), p = S.stagePlanes, r = S.orient && S.orient.byId.get(e.st.orientId); return { room: e.st.orientId, dir: r && r.dir, yaw: e.view().yaw, planes: p && { counts: p.counts, wall: p.wall, cols: p.cols, front: p.front, levelsAdded: p.levelsAdded }, levels: S.levelH.length, rooms: e.st.stageRooms.slice() }; });
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="aurhea"]'); await idle();
  const table = {};
  for (const [name, raws] of WINDOWS) {
    await ev((raws) => { const e = window.__evo, tb = window.EVO.stage.zoneTable(e.packs[e.st.pack].pack); e.stageSetWindow(raws.map((r) => tb.toK.get(r))); }, raws); await idle();
    for (const on of [true, false]) {
      await sw('#t-stagePlanes', on); const f = `${name}_planes_${on ? 'on' : 'off'}.png`; fs.writeFileSync(path.join(out, f), await a.canvas()); table[f] = await info(); console.log(f, JSON.stringify(table[f]));
    }
    if (name === 'south_pen') {
      await page.click('#stageNext'); await idle();
      for (const on of [true, false]) { await sw('#t-stagePlanes', on); const f = `${name}_next_planes_${on ? 'on' : 'off'}.png`; fs.writeFileSync(path.join(out, f), await a.canvas()); table[f] = await info(); console.log(f, JSON.stringify(table[f])); }
    }
    await sw('#t-stagePlanes', true);
  }
  console.log('errors', a.errs.length, JSON.stringify(a.errs)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
