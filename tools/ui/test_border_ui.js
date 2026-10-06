/* Slice border line per tile face: colours by edge-map kind in Box, A and B, and how much of it is visible compared with Box.
   A face counts as visible if one of 3 sample points along it has the face colour. Faces hidden by terrain are hidden in
   every technique, so A and B are compared with Box (which draws each face after the later of the two tiles that meet there).
     NODE_PATH=$(npm root -g) node tools/ui/test_border_ui.js */
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 800 });
  for (const [dir, zone] of [['maps', 4], ['maps_noring', 4]]) {
  await a.load(dir); await a.zone(zone);
  console.log(`\n== ${dir}, zone ${zone}`);
  const info = await a.page.$eval('#info', (e) => e.innerText);
  a.ok('info reports the border face counts by colour', /slice border faces: \d+ barrier \(red\) · \d+ pass \(cyan\) · \d+ unmarked \(yellow\) · \d+ map edge \(white\)/.test(info), info.match(/slice border faces[^·]*·[^·]*·[^·]*·[^·]*/) + '');
  const res = await a.page.evaluate(() => {
    const ev = window.__evo, E = window.EVO, S = ev.S(), P = ev.P, O = Object.assign({}, ev.O, { veil: true, border: true });
    const CW = 900, CH = 600, cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${CW}px;height:${CH}px;z-index:-1`; document.body.appendChild(cv);
    const COL = { 1: [240, 56, 56], 2: [56, 228, 244], 3: [255, 226, 110], 4: [255, 255, 255] };
    const near = (d, k, c) => Math.abs(d[k] - c[0]) + Math.abs(d[k + 1] - c[1]) + Math.abs(d[k + 2] - c[2]) < 90;
    const out = [], kinds = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (let i = 0; i < S.n; i++) for (let b = 0; b < 4; b++) if (S.border[i] >> b & 1) kinds[S.borderKind ? S.borderKind[i * 4 + b] : 3]++;
    for (const [pname, yaw, pitch] of [['oblique', 0, 50], ['oblique', 180, 50], ['iso', 45, 35], ['iso', 225, 35]]) {
      const view = { yaw, pitch, zoom: 1, panX: 0, panY: 0 }, cam0 = E.makeCam(S, P, view, CW, CH); view.zoom = 1.25; const cam = E.makeCam(S, P, view, CW, CH);
      const row = { view: `${pname} ${yaw}` };
      const FACE = [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]];
      const faces = [];
      for (let i = 0; i < S.n; i++) for (let b = 0; b < 4; b++) if (S.border[i] >> b & 1) { const x = i % S.W, y = (i / S.W) | 0, h = S.levelH[S.fine[i]], f = FACE[b]; faces.push({ k: S.borderKind ? S.borderKind[i * 4 + b] : 3, p: cam.p(x + f[0], y + f[1], h), q: cam.p(x + f[2], y + f[3], h) }); }
      for (const tech of ['box', 'A', 'B']) {
        E.render(cv, S, P, tech, view, O);
        const d = cv.getContext('2d').getImageData(0, 0, CW, CH).data; let seen = 0, total = 0; const byKind = { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] };
        for (const f of faces) {
          if (f.p[0] < 3 || f.p[0] > CW - 3 || f.q[0] < 3 || f.q[0] > CW - 3 || f.p[1] < 3 || f.p[1] > CH - 3 || f.q[1] < 3 || f.q[1] > CH - 3) continue;
          total++; byKind[f.k][1]++; let hit = false;
          for (const t of [0.25, 0.5, 0.75]) { const x = Math.round(f.p[0] + (f.q[0] - f.p[0]) * t), y = Math.round(f.p[1] + (f.q[1] - f.p[1]) * t); for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1; dx++) if (near(d, ((y + dy) * CW + x + dx) * 4, COL[f.k])) { hit = true; break; } }
          if (hit) { seen++; byKind[f.k][0]++; }
        }
        row[tech] = { seen, total, byKind };
      }
      out.push(row);
    }
    return { out, kinds };
  });
  console.log('faces by kind in the slice (1 barrier, 2 pass, 3 unmarked, 4 map edge):', JSON.stringify(res.kinds));
  a.ok(dir === 'maps' ? 'the zone has barrier, pass and unmarked faces' : 'the zone has barrier, pass and map-edge faces', res.kinds[1] > 0 && res.kinds[2] > 0 && res.kinds[dir === 'maps' ? 3 : 4] > 0, JSON.stringify(res.kinds));
  for (const r of res.out) {
    const pc = (t) => (r[t].total ? (100 * r[t].seen / r[t].total) : 0);
    console.log(`${r.view}: faces on screen ${r.box.total}; visible with their colour: Box ${pc('box').toFixed(1)} %, A ${pc('A').toFixed(1)} %, B ${pc('B').toFixed(1)} %; by kind (box) ${JSON.stringify(r.box.byKind)}`);
    a.ok(`${dir} ${r.view}: Box shows most faces in their colour`, pc('box') > 40, pc('box').toFixed(1));
    a.ok(`${dir} ${r.view}: A and B show at least 90 % of what Box shows`, r.A.seen >= 0.9 * r.box.seen && r.B.seen >= 0.9 * r.box.seen, `box ${r.box.seen} A ${r.A.seen} B ${r.B.seen}`);
  }
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
