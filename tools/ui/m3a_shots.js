/* Screenshots of M3a (Forest, the old map with the zones of v53) into docs/crystallizers/03-stage/shots/m3a/: the roles of docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated/ loaded as "Your images" (the files the user would pick: height_A / height_B, zones, path, poi),
   mode 3, Cam 6, Box, orientation + planes + props on (the defaults of the example). (M3c: see the windows below); variants A (terraces 2, sub-terraces 6) and B (terraces 6, sub-terraces 3).
   The trees are walkable terrain (they are not blocked in M3a); the tower is a raised mass. Windows are named by RAW zone id (1 valley, 4 plateau N + tower, 5 main slope, 6 east slope): [valley], [valley, east slope] (the way to the POI A), [plateau N], [valley, east slope, plateau N] and the control [valley, main slope, plateau N], turned into the place in the BFS order of the table.
   M3A_SRC=<dir> shoots another set of PNGs (the data of an older commit); the names of the files are the ones of derive_roles.py.
   --builtin: no files, the examples "Forest A (v53)" and "Forest B (amplified relief)" with the built-in sources (file names prefixed `integrada_`).
     NODE_PATH=$(npm root -g) node tools/ui/m3a_shots.js [outDir] [--builtin] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const BUILTIN = process.argv.includes('--builtin'), ARGS = process.argv.slice(2).filter((x) => !x.startsWith('--')), SRC = process.env.M3A_SRC || path.join(__dirname, '../../docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated'), out = ARGS[0] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/m3a');
const VARIANT = { A: { terraces: 2, subs: 6 }, B: { terraces: 6, subs: 3 } };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle(), table = {};
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await idle(); };
  const win = async (ks) => { await ev((ks) => window.__evo.stageSetWindow(ks), ks); await idle(); await idle(); };
  const info = () => ev(() => {
    const e = window.__evo, S = e.S(), tb = window.EVO.stage.zoneTable(e.packs[e.st.pack].pack), zmap = window.EVO.stage.zoneMap(S), r = S.orient && S.orient.byId.get(e.st.orientId), p = S.stagePlanes, d = S.propsC && S.propsC.data, I = S.stageZonesInfo, gl = d && d.goal;
    const inT = (x, y) => (x >> 1) >= 17 && (x >> 1) <= 21 && (y >> 1) >= 2 && (y >> 1) <= 10, hx = e.O.hero ? Math.floor(e.O.hero.x) : 0, hy = e.O.hero ? Math.floor(e.O.hero.y) : 0, hi = hy * S.W + hx;
    return { terH: e.P.terH, terraces: e.P.terraces, subs: e.P.subs, zone: e.st.orientId, dir: r && r.dir, yaw: e.view().yaw, planes: p && { wall: p.wall, cols: p.cols, front: p.front, voidTiles: p.voidTiles }, props: d && { torches: d.torches.length, pillars: d.pillars.length, goal: !!gl },
      dropped: I && { window: I.window, discarded: I.discarded, total: I.total },
      hero: e.O.hero && { map: [S.ox + hx, S.oy + hy], zoneRaw: tb.order[zmap[hi] - 1] || 0, h: +(e.O.hero.feet / 2).toFixed(3), onTower: inT(S.ox + hx, S.oy + hy) },
      goal: gl ? { map: [S.ox + Math.floor(gl.x), S.oy + Math.floor(gl.y)], zoneRaw: tb.order[zmap[gl.tile] - 1] || 0, h: +(gl.h / 2).toFixed(3), onTower: inT(S.ox + Math.floor(gl.x), S.oy + Math.floor(gl.y)) } : null };
  });
  const shot = async (name) => { name = (BUILTIN ? 'integrada_' : '') + name; fs.writeFileSync(path.join(out, name), await a.canvas()); const i = await info(); table[name] = i; console.log(name, JSON.stringify(i)); };
  await ev(() => window.__evo.setMode('stage')); await idle(); if (!BUILTIN) { await page.click('#examples button[data-id="images"]'); await idle(); }
  for (const v of ['A', 'B']) {
    if (BUILTIN) { await page.click(`#examples button[data-id="forest_${v.toLowerCase()}"]`); await idle(); await idle(); }
    else {
      await page.setInputFiles('#file', [`height_${v}.png`, 'zones.png', 'path.png', 'poi.png'].map((n) => path.join(SRC, n))); await page.waitForTimeout(2500); await idle(); await idle();
      for (const k of ['terraces', 'subs']) { await a.slider(k, VARIANT[v][k]); await idle(); await idle(); }
    }
    const dims = await ev(() => window.__evo.S() && [window.__evo.S().W, window.__evo.S().H]); console.log('variant', v, 'shape', dims);
    const ONLY = process.env.M3A_ONLY ? process.env.M3A_ONLY.split(',') : null; // M3A_ONLY=valle,taludEste: only the windows with these names
    for (const [raws, nm] of [[[1], 'valle'], [[1, 6], 'valle_taludEste'], [[6], 'taludEste'], [[4], 'mesetaN_torre'], [[1, 6, 4], 'valle_taludEste_mesetaN'], [[1, 5, 4], 'control_valle_taludPpal_mesetaN']].filter(([, n]) => !ONLY || ONLY.includes(n))) {
      const ks = await ev((raws) => { const e = window.__evo, tb = window.EVO.stage.zoneTable(e.packs[e.st.pack].pack); return raws.map((r) => tb.toK.get(r)); }, raws);
      await win(ks); await frame('room'); await shot(`${v}_${nm}_encuadre_sala.png`); await frame('hero'); await shot(`${v}_${nm}_encuadre_heroe.png`);
      if (ks.length > 1) { // the hero in the LAST zone of the window (the one that has the goal): the room framing
        await ev((k) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, k); e.st.stageIdx = e.st.stageRooms.indexOf(k); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, ks[ks.length - 1]); await idle(); await idle();
        await frame('room'); await shot(`${v}_${nm}_ultimaZona_encuadre_sala.png`);
      }
    }
  }
  fs.writeFileSync(path.join(out, BUILTIN ? 'm3a_shots_integrada.json' : 'm3a_shots.json'), JSON.stringify(table, null, 1) + '\n');
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
