/* Painter order of the ramps against a per-pixel z-buffer reference.
   The viewer is rendered in debug mode (flat grey terrain, pure red for everything that belongs to a ramp: its surface,
   its side walls and the walls of neighbours that stop at its surface). A reference rasterizer draws the true geometry
   (flat tile tops, ramp surfaces, vertical walls between tiles) with a depth buffer and says, per pixel, whether the
   front-most surface belongs to a ramp. Pixels where the two disagree are counted, in a box around each ramp, for
   four view directions in Oblique 50 and Iso 45, in Box, A and B, with the default smoothing and with none
   (smoothing off makes A and B tile-exact, which isolates the painter order from the smoothing).
     NODE_PATH=$(npm root -g) node tools/ui/test_ramp_ui.js [outDir] [--n 6]
   Pixels within 1 px of a class border (anti-aliasing) are ignored. */
const fs = require('fs'), path = require('path');
const { open } = require('./common');

const PAGE = async ({ nPer, px, only, techs, spread, terraces, width }) => {
  const E = window.EVO;
  const mk = (W, H, f) => { const el = new Float32Array(W * H); let mn = 1e9, mx = -1e9; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); } return { name: 't', width: W, height: H, elevation: el, elevRange: [mn, mx], masks: {}, markers: [], fields: {} }; };
  const relief = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
  const BASE = { spread, terraces, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: width, stairStyle: 1, gateThr: 0.05, gateMin: 3 };
  const CW = 520, CH = 420, PX = px;
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${CW}px;height:${CH}px;z-index:-1`; document.body.appendChild(cv);
  const views = [['oblique', 0, 50], ['oblique', 90, 50], ['oblique', 180, 50], ['oblique', 270, 50], ['iso', 45, 35], ['iso', 135, 35], ['iso', 225, 35], ['iso', 315, 35]];

  function classify(S, rec) { // does a tile with an intermediate level touch the footprint? (the risky case for the painter)
    const tiles = new Set(); for (const st of rec.steps) for (const t of st.tiles) tiles.add(t);
    const lo = Math.min(...[...tiles].map((t) => S.fine[t])), hi = S.fine[rec.top[0]], hi2 = Math.max(S.fine[rec.top[0]], S.fine[rec.bottom[0]]);
    for (const t of tiles) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = t % S.W + dx, y = ((t / S.W) | 0) + dy; if (x < 0 || y < 0 || x >= S.W || y >= S.H) continue;
      const j = y * S.W + x; if (tiles.has(j)) continue;
      if (S.fine[j] > lo && S.fine[j] < Math.max(hi, hi2) && S.fine[j] !== hi && S.fine[j] !== hi2) return 'mixed';
    }
    return 'clean';
  }

  function reference(S, view, rec, cam) {
    // true geometry around the ramp: tile tops, ramp surfaces, walls between tiles; owner 1 = ramp, 2 = other
    const W = S.W, H = S.H, ST = new Map();
    for (const st of S.stairs) if (st.ramp) for (const step of st.steps) for (const t of step.tiles) ST.set(t, st);
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const zOf = (x, y, h) => ((sy * (x - W / 2) + cy * (y - H / 2)) * cp + h * sp);
    const zb = new Float32Array(CW * CH).fill(-1e9), own = new Uint8Array(CW * CH), kind = new Uint8Array(CW * CH);
    const tri = (A, B, C, o) => {
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(CW - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(CH - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]); if (Math.abs(d) < 1e-9) return;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const l1 = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d, l2 = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d, l3 = 1 - l1 - l2;
        if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
        const z = l1 * A[2] + l2 * B[2] + l3 * C[2], k = y * CW + x;
        if (z > zb[k]) { zb[k] = z; own[k] = o === 1 || o === 3 ? 1 : 2; kind[k] = o; }
      }
    };
    const V = (x, y, h) => { const p = cam.p(x, y, h); return [p[0], p[1], zOf(x, y, h)]; };
    const quad = (a, b, c, d, o) => { tri(a, b, c, o); tri(a, c, d, o); };
    const hOf = (j) => S.levelH[S.fine[j]];
    const corner = (j, x, y) => (ST.has(j) ? E.rampHeight(ST.get(j), x, y) : hOf(j));
    const r = 1e9, cx = rec.top[0] % W, cyy = (rec.top[0] / W) | 0;
    for (let y = Math.max(0, cyy - r); y <= Math.min(H - 1, cyy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) {
      const i = y * W + x, ramp = ST.has(i) ? 1 : 2;
      quad(V(x, y, corner(i, x, y)), V(x + 1, y, corner(i, x + 1, y)), V(x + 1, y + 1, corner(i, x + 1, y + 1)), V(x, y + 1, corner(i, x, y + 1)), ramp);
      for (const [dx, dy, ax, ay, bx, by] of [[1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1]]) { // each pair once
        const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue;
        const j = ny * W + nx, a0 = corner(i, x + ax, y + ay), a1 = corner(i, x + bx, y + by), b0 = corner(j, x + ax, y + ay), b1 = corner(j, x + bx, y + by);
        if (Math.abs(a0 - b0) < 1e-6 && Math.abs(a1 - b1) < 1e-6) continue;
        const o = ST.has(i) || ST.has(j) ? 3 : 4;
        quad(V(x + ax, y + ay, Math.min(a0, b0)), V(x + bx, y + by, Math.min(a1, b1)), V(x + bx, y + by, Math.max(a1, b1)), V(x + ax, y + ay, Math.max(a0, b0)), o);
      }
    }
    // skirts: the viewer draws a wall from every edge tile of the window down to the base of the world
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      for (const [on, ax, ay, bx, by] of [[y === 0, 0, 0, 1, 0], [x === W - 1, 1, 0, 1, 1], [y === H - 1, 1, 1, 0, 1], [x === 0, 0, 1, 0, 0]]) {
        if (!on) continue;
        quad(V(x + ax, y + ay, cam.base), V(x + bx, y + by, cam.base), V(x + bx, y + by, corner(i, x + bx, y + by)), V(x + ax, y + ay, corner(i, x + ax, y + ay)), 2000000 + i, 4);
      }
    }
    return { own, kind };
  }

  const results = []; const worstBy = { true: null, false: null };
  const shapes = {};
  for (const smooth of [true, false]) { const P = Object.assign({}, BASE, smooth ? {} : { smooth: 0, radius: 0 }); shapes[smooth] = { P, S: E.shape(relief, P) }; }
  // pick ramps from the smooth shape (the same footprint in both: carving does not depend on smoothing)
  const S0 = shapes[true].S, cands = { cut: { clean: [], mixed: [] }, fill: { clean: [], mixed: [] } };
  S0.stairs.forEach((rec, i) => { if (rec.ramp) cands[rec.mode][classify(S0, rec)].push(i); });
  const picks = [];
  for (const mode of ['cut', 'fill']) for (const cat of ['clean', 'mixed']) for (const i of cands[mode][cat].slice(0, nPer)) picks.push({ i, mode, cat });
  if (only >= 0) { picks.length = 0; S0.stairs.forEach((rec, i) => { if (i === only) picks.push({ i, mode: rec.mode, cat: classify(S0, rec) }); }); }
  const counts = { cut: { clean: cands.cut.clean.length, mixed: cands.cut.mixed.length }, fill: { clean: cands.fill.clean.length, mixed: cands.fill.mixed.length } };

  const ctx2 = (n) => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return c; };
  const rows = {};
  for (const smooth of [true, false]) for (const tech of techs) {
    if (!smooth && tech === 'box') continue; // Box has no smoothing
    const { P, S } = shapes[smooth];
    for (const pk of picks) {
      const rec = S.stairs[pk.i], cx = rec.top[0] % S.W + 0.5, cyy = ((rec.top[0] / S.W) | 0) + 0.5, hh = S.levelH[S.fine[rec.top[0]]];
      for (const [vname, yaw, pitch] of views) {
        const view = { yaw, pitch, zoom: 1, panX: 0, panY: 0 };
        let cam = E.makeCam(S, P, view, CW, CH); view.zoom = PX / cam.sc;
        cam = E.makeCam(S, P, view, CW, CH); const c = cam.p(cx, cyy, hh); view.panX = CW / 2 - c[0]; view.panY = CH / 2 - c[1];
        cam = E.makeCam(S, P, view, CW, CH);
        E.render(cv, S, P, tech, view, { debug: true });
        const img = cv.getContext('2d').getImageData(0, 0, CW, CH).data, refR = reference(S, view, rec, cam), ref = refR.own;
        // box of the ramp footprint on screen, +1.5 tile
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const st of rec.steps) for (const t of st.tiles) for (const [ox, oy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) for (const h of [rec.ramp.h0, rec.ramp.h1, S.levelH[S.fine[t]]]) { const q = cam.p(t % S.W + ox, ((t / S.W) | 0) + oy, h); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
        const m = 1.5 * cam.sc; x0 = Math.max(2, Math.floor(x0 - m)); y0 = Math.max(2, Math.floor(y0 - m)); x1 = Math.min(CW - 3, Math.ceil(x1 + m)); y1 = Math.min(CH - 3, Math.ceil(y1 + m));
        const isR = (k) => img[k * 4] - img[k * 4 + 1] > 60;
        let diff = 0, total = 0;
        const mism = new Uint8Array(CW * CH), hist = {};
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const k = y * CW + x, a = ref[k] === 1, b = isR(k);
          let edge = false; for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const k2 = (y + dy) * CW + x + dx; if ((ref[k2] === 1) !== a || isR(k2) !== b) { edge = true; break; } }
          if (a || b) total++;
          if (a !== b && !edge) { diff++; mism[k] = a ? 1 : 2; const hk = (a ? 'ref-only kind ' : 'viewer-only, ref kind ') + refR.kind[k]; hist[hk] = (hist[hk] || 0) + 1; }
        }
        let probe = null;
        if (diff > 50 && tech === 'box') { let sx = 0, sy2 = 0, c = 0; for (let k = 0; k < CW * CH; k++) if (mism[k] === 1) { sx += k % CW; sy2 += (k / CW) | 0; c++; } if (c) { const px0 = sx / c, py0 = sy2 / c, q0 = (py0 | 0) * CW + (px0 | 0), pt = E.pickTile(S, P, tech, view, CW, CH, px0, py0); probe = { at: [px0 | 0, py0 | 0], refOwner: ref[q0], refKind: refR.kind[q0], pick: pt, refTile: ref[q0] >= 0 ? [ref[q0] % S.W, (ref[q0] / S.W) | 0, S.levelH[S.fine[ref[q0]]]] : null, pickTile: pt.tile >= 0 ? [pt.tile % S.W, (pt.tile / S.W) | 0, S.levelH[S.fine[pt.tile]]] : null, rampTop: rec.top[0] % S.W + ',' + ((rec.top[0] / S.W) | 0), key: [cam.ry(ref[q0] % S.W + 0.5, ((ref[q0] / S.W) | 0) + 0.5), pt.tile >= 0 ? cam.ry(pt.tile % S.W + 0.5, ((pt.tile / S.W) | 0) + 0.5) : null] }; } }
        if (probe && !window.__probe) window.__probe = probe;
        const pct = total ? 100 * diff / total : 0;
        const key = `${smooth ? 'default smoothing' : 'no smoothing'}|${tech}|${pk.mode}|${pk.cat}|${vname} ${yaw}`;
        (rows[key] || (rows[key] = { n: 0, sum: 0, max: 0 })); rows[key].n++; rows[key].sum += pct; rows[key].max = Math.max(rows[key].max, pct);
        results.push({ smooth, tech, mode: pk.mode, cat: pk.cat, vname, yaw, pct, diff, ramp: pk.i });
        let worst = worstBy[smooth]; if (!worst || pct > worst.pct) {
          const out = document.createElement('canvas'); out.width = CW; out.height = CH; const oc = out.getContext('2d'), id = oc.createImageData(CW, CH);
          for (let k = 0; k < CW * CH; k++) { const v = mism[k], base = ref[k] === 1 ? 70 : 30; id.data[k * 4] = v === 2 ? 255 : base; id.data[k * 4 + 1] = base; id.data[k * 4 + 2] = v === 1 ? 255 : base; id.data[k * 4 + 3] = 255; }
          oc.putImageData(id, 0, 0); oc.strokeStyle = '#fff'; oc.strokeRect(x0, y0, x1 - x0, y1 - y0);
          const dbg = cv.toDataURL('image/png');
          E.render(cv, S, P, tech, view, { outlines: true, gradient: true });
          worstBy[smooth] = { hist, pct, diff, desc: key + ` yaw ${yaw} ramp #${pk.i}`, mask: out.toDataURL('image/png'), shot: cv.toDataURL('image/png'), dbg };
        }
      }
    }
  }
  return { probe: window.__probe, top: results.slice().sort((p, q) => q.pct - p.pct).slice(0, 8).map((r) => `${r.pct.toFixed(2)}% ${r.smooth ? 'smooth' : 'exact'} ${r.tech} ${r.mode} ${r.cat} yaw ${r.yaw} ramp #${r.ramp}`), rows, worstBy, counts, picks: picks.length, total: results.length };
};

const argNum = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
(async () => {
  const outDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
  const ni = process.argv.indexOf('--n'), nPer = ni > 0 ? +process.argv[ni + 1] : 4;
  const a = await open({ w: 900, h: 700 });
    const pi = process.argv.indexOf('--px'), oi = process.argv.indexOf('--only');
  const r = await a.page.evaluate(PAGE, { nPer, px: pi > 0 ? +process.argv[pi + 1] : 28, only: oi > 0 ? +process.argv[oi + 1] : -1, spread: argNum('--spread', 1), terraces: argNum('--terraces', 5), width: argNum('--width', 3), techs: process.argv.indexOf('--tech') > 0 ? [process.argv[process.argv.indexOf('--tech') + 1]] : ['box', 'A', 'B'] });
  console.log(`ramps available: cut clean ${r.counts.cut.clean}, cut mixed ${r.counts.cut.mixed}, fill clean ${r.counts.fill.clean}, fill mixed ${r.counts.fill.mixed}; ${r.picks} tested x ${r.total / r.picks} renders`);
  // table: per smoothing, tech, mode/category: mean and max % of differing ramp pixels over the 8 directions
  const groups = {};
  for (const [key, v] of Object.entries(r.rows)) { const [sm, tech, mode, cat, vname] = key.split('|'); const g = `${sm} | ${tech} | ${mode} ${cat}`; (groups[g] || (groups[g] = {}))[vname] = v; }
  console.log('\n| smoothing | technique | ramps | mean % over views | worst % (any view) | worst view |\n|---|---|---|---:|---:|---|');
  let anyNonZero = 0;
  for (const [g, vs] of Object.entries(groups)) {
    const all = Object.values(vs), mean = all.reduce((s, v) => s + v.sum / v.n, 0) / all.length, mx = Math.max(...all.map((v) => v.max)), wv = Object.entries(vs).sort((p, q) => q[1].max - p[1].max)[0][0];
    console.log(`| ${g.split(' | ')[0]} | ${g.split(' | ')[1]} | ${g.split(' | ')[2]} | ${mean.toFixed(2)} | ${mx.toFixed(2)} | ${wv} |`);
    if (mx > 0) anyNonZero++;
  }
  if (r.probe) console.log('probe:', JSON.stringify(r.probe));
  console.log('\ntop cases:\n' + r.top.join('\n'));
  for (const sm of ['true', 'false']) {
    const w = r.worstBy[sm]; console.log('  ref kinds at mismatches (1 ramp top, 2 other top, 3 wall touching a ramp, 4 other wall):', JSON.stringify(r.worstBy[sm].hist));
    console.log(`\nworst case, ${sm === 'true' ? 'default smoothing' : 'no smoothing'}:`, w.desc, w.pct.toFixed(2) + '%', w.diff + ' px');
    if (outDir) { fs.mkdirSync(outDir, { recursive: true }); for (const [k, f] of [['mask', 'mask'], ['dbg', 'debug'], ['shot', 'shot']]) fs.writeFileSync(path.join(outDir, `ramp_worst_${sm === 'true' ? 'smooth' : 'exact'}_${f}.png`), Buffer.from(w[k].split(',')[1], 'base64')); }
  }
  // Thresholds are ENFORCED only for the reference configuration the user accepted (5 terraces, spread 1): Box exact, A and B mean <= 2 %,
  // worst <= 8 %. Other configurations (12 terraces, spread 1.5...) are measurements: with more levels the level-ordered painter loses
  // more (a ramp spans several levels, and the wall of a farther, higher slab is painted over it), see CLAUDE.md.
  const enforce = argNum('--terraces', 5) === 5 && argNum('--spread', 1) === 1;
  for (const [g, vs] of Object.entries(groups)) {
    const all = Object.values(vs), mean = all.reduce((q, v) => q + v.sum / v.n, 0) / all.length, mx = Math.max(...all.map((v) => v.max)), box = g.includes('| box |');
    if (enforce) a.ok(`ramp order ${g}: ${box ? 'exact' : 'mean <= 2 %, worst <= 8 %'}`, box ? mx === 0 : mean <= 2 && mx <= 8, `mean ${mean.toFixed(2)} worst ${mx.toFixed(2)}`);
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
