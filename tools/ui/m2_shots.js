/* Screenshots of M2b (the zones of a PNG) into docs/crystallizers/03-stage/shots/m2/: the three zones of the synthetic fixture (tools/ui/gen_maps.py `maps_stage`) one by one with the Stage rules on
   (orientation, planes, props), Cam 6, Box, room framing and hero framing, plus a top view of the zone map of the window [1, 2, 3] (the island of zone 3 dropped, marked).
     python3 tools/ui/gen_maps.py; NODE_PATH=$(npm root -g) node tools/ui/m2_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open, mapFile } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/m2');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="images"]'); await idle();
  await page.setInputFiles('#file', ['height', 'zones', 'path'].map((n) => mapFile('maps_stage', n))); await page.waitForTimeout(2500); await idle(); await idle();
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await idle(); };
  const win = async (ks) => { await ev((ks) => window.__evo.stageSetWindow(ks), ks); await idle(); await idle(); };
  const info = () => ev(() => { const e = window.__evo, S = e.S(), r = S.orient.byId.get(e.st.orientId), p = S.stagePlanes, d = S.propsC && S.propsC.data; return { zone: e.st.orientId, dir: r && r.dir, yaw: e.view().yaw, planes: p && { wall: p.wall, cols: p.cols, front: p.front, voidTiles: p.voidTiles }, props: d && { torches: d.torches.length, pillars: d.pillars.length, goal: !!d.goal }, dropped: S.stageZonesInfo.total }; });
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await info())); };
  for (const k of [1, 2, 3]) { await win([k]); await frame('room'); await shot(`zona${k}_encuadre_sala_Box.png`); await frame('hero'); await shot(`zona${k}_encuadre_heroe_Box.png`); }
  await win([1, 2, 3]); await frame('room'); await shot('cadena123_zona1_encuadre_sala_Box.png');
  const url = await ev(() => { const e = window.__evo, S = e.S(), W = S.W, K = 7, cv = document.createElement('canvas'); cv.width = W * K; cv.height = S.H * K; const g = cv.getContext('2d'), col = ['#2a2a40', '#4f9bd9', '#e0a030', '#5ab552'];
    for (let y = 0; y < S.H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, k = S.stageZones[i]; let c = col[k]; if (S.void && S.void[i]) c = '#101020'; else if (S.block[i]) c = '#2a2a40'; g.fillStyle = c; g.fillRect(x * K, y * K, K, K); }
    // the dropped island: walkable, not in any zone
    g.strokeStyle = '#ff3030'; g.lineWidth = 2; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0 && S.stageZones[i] === 0) { const x = i % W, y = (i / W) | 0; g.strokeRect(x * K + 1, y * K + 1, K - 2, K - 2); }
    g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText('window [1, 2, 3]: zone 1 blue, zone 2 orange, zone 3 green; red = walkable tiles dropped (' + S.stageZonesInfo.total + ', the island of zone 3)', 8, 14); return cv.toDataURL('image/png'); });
  fs.writeFileSync(path.join(out, 'vista_arriba_zonas_y_isla.png'), Buffer.from(url.split(',')[1], 'base64')); console.log('vista_arriba_zonas_y_isla.png');
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})();
