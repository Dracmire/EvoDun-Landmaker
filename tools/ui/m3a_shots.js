/* Screenshots of M3a (Forest, the old map with the zones of v53) into docs/crystallizers/03-stage/shots/m3a/: the roles of docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated/ loaded as "Your images" (the files the user would pick: height_A / height_B, zones, path, poi),
   mode 3, Cam 6, Box, orientation + planes + props on (the defaults of the example). Windows: the valley [1], the way to the tower [1, 3, 5] (valley, slope, plateau N), the plateau N with the tower [5]; variants A (terraces 2, sub-terraces 6) and B (terraces 6, sub-terraces 3).
   The loaded PNGs cannot say that the trees and the tower are not walkable (no role for it): that comes with the built-in source (commit 2), so these shots have walkable trees.
     NODE_PATH=$(npm root -g) node tools/ui/m3a_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const SRC = path.join(__dirname, '../../docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated'), out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/m3a');
const VARIANT = { A: { terraces: 2, subs: 6 }, B: { terraces: 6, subs: 3 } };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle(), table = {};
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await idle(); };
  const win = async (ks) => { await ev((ks) => window.__evo.stageSetWindow(ks), ks); await idle(); await idle(); };
  const info = () => ev(() => { const e = window.__evo, S = e.S(), r = S.orient && S.orient.byId.get(e.st.orientId), p = S.stagePlanes, d = S.propsC && S.propsC.data, I = S.stageZonesInfo; return { terH: e.P.terH, terraces: e.P.terraces, subs: e.P.subs, zone: e.st.orientId, dir: r && r.dir, yaw: e.view().yaw, planes: p && { wall: p.wall, cols: p.cols, front: p.front, voidTiles: p.voidTiles }, props: d && { torches: d.torches.length, pillars: d.pillars.length, goal: !!d.goal }, dropped: I && { window: I.window, discarded: I.discarded, total: I.total }, heroH: e.O.hero && e.O.hero.feet }; });
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); const i = await info(); table[name] = i; console.log(name, JSON.stringify(i)); };
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="images"]'); await idle();
  for (const v of ['A', 'B']) {
    await page.setInputFiles('#file', [`height_${v}.png`, 'zones.png', 'path.png', 'poi.png'].map((n) => path.join(SRC, n))); await page.waitForTimeout(2500); await idle(); await idle();
    for (const k of ['terraces', 'subs']) { await a.slider(k, VARIANT[v][k]); await idle(); await idle(); }
    const dims = await ev(() => window.__evo.S() && [window.__evo.S().W, window.__evo.S().H]); console.log('variant', v, 'shape', dims);
    for (const [ks, nm] of [[[1], 'valle'], [[1, 3, 5], 'ruta_valle_talud_mesetaN'], [[5], 'mesetaN_torre']]) {
      await win(ks); await frame('room'); await shot(`${v}_${nm}_encuadre_sala.png`); await frame('hero'); await shot(`${v}_${nm}_encuadre_heroe.png`);
    }
  }
  fs.writeFileSync(path.join(out, 'm3a_shots.json'), JSON.stringify(table, null, 1) + '\n');
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
