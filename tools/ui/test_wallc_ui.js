/* Painter order of the wall pass of technique C against a per-pixel reference (like test_ramp_ui.js). Reference = ray marching of a SOLID model: terrain (the height of the C cell under the point) plus the block volumes (top polygon x [base, top]);
   the first solid hit from above decides whether a pixel shows a block. The viewer renders the same scene in debug mode (flat grey terrain, pure red blocks). Reported per view kind: mean / worst % of the pixels that differ (blocks seen by only one of
   the two) over the sampled places, and the same without the 1-pixel edge band. MEASURED, not enforced (the reference is the same geometry, so a mismatch is an ORDER error: a block drawn over something nearer, or hidden by something farther).
     NODE_PATH=$(npm root -g) node tools/ui/test_wallc_ui.js [--mode t3|t2] [--ext 0.25] [--px 40] [--n 4] */
const { open } = require('./common');
const PAGE = async ({ mode, ext, px, n, terraces, spread, views, curves }) => {
  const E = window.EVO, CW = 420, CH = 340;
  const mk = (W, H, f) => { const el = new Float32Array(W * H); let mn = 1e9, mx = -1e9; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); } return { name: 't', width: W, height: H, elevation: el, elevRange: [mn, mx], masks: {}, markers: [], fields: {} }; };
  const relief = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
  const P = { spread, spreadCentre: 'middle', terraces, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 0, stairStyle: 1, gateThr: 0.05, gateMin: 3, curves, wallPass: mode, wallExtrude: ext };
  const S = E.shape(relief, P), WP = E.wallc.get(S, P), cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${CW}px;height:${CH}px;z-index:-1`; document.body.appendChild(cv);
  const tops = []; for (const v of WP.byHi.values()) for (const t of v.tops) tops.push(t);
  const grid = new Map(); tops.forEach((t, i) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of t.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } t.bb = [x0, y0, x1, y1]; for (let x = Math.floor(x0); x <= Math.floor(x1); x++) for (let y = Math.floor(y0); y <= Math.floor(y1); y++) { const k = x * 4096 + y; let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); } });
  const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const p = pts[i], q = pts[j]; if ((p[1] > y) !== (q[1] > y) && x < (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]) + p[0]) c = !c; } return c; };
  const g = E.curves.struct(S, P).grid, hmax = Math.max(...S.levelH) + 0.5, hmin = Math.min(...S.levelH) - 0.5;
  const terrainH = (x, y) => { if (x < 0 || y < 0 || x >= S.W || y >= S.H) return -1e9; const t = E.cellTileAt(S, P, x, y); return t < 0 || (S.void && S.void[t]) ? -1e9 : S.levelH[S.fine[t]]; };
  const faces = []; for (const v of WP.byHi.values()) for (const f of v.faces) faces.push(f);
  const picks = []; for (let k = 0; k < n; k++) picks.push(faces[Math.floor((k + 0.5) * faces.length / n)]);
  const out = {};
  for (const [vname, kind, yaw, pitch, key] of views) for (const f of picks) {
    const view = { kind, yaw, pitch, zoom: 1, panX: 0, panY: 0, persH: CH }; let cam = E.makeCam(S, P, view, CW, CH); view.zoom = px / cam.sc; cam = E.makeCam(S, P, view, CW, CH);
    const cx = (f.ax + f.bx) / 2, cy = (f.ay + f.by) / 2, ch = (f.zlo + f.zhi) / 2, c = cam.p(cx, cy, ch); view.panX = CW / 2 - c[0]; view.panY = CH / 2 - c[1];
    if (cam.panFor) { const q = cam.panFor(cx, cy, ch); view.panX = q[0]; view.panY = q[1]; }
    cam = E.makeCam(S, P, view, CW, CH);
    E.render(cv, S, P, 'C', view, { debug: true });
    const ctx = cv.getContext('2d'), dpr = cv.width / CW, img = ctx.getImageData(0, 0, cv.width, cv.height).data, mask = new Uint8Array(CW * CH), ref = new Uint8Array(CW * CH);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const q = ((Math.floor(y * dpr)) * cv.width + Math.floor(x * dpr)) * 4; if (img[q] > 180 && img[q + 1] < 60 && img[q + 2] < 60) mask[y * CW + x] = 1; }
    // candidate pixels: the screen boxes of the blocks near the view
    const cand = new Uint8Array(CW * CH);
    for (const t of tops) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of t.pts) for (const z of [t.zb, t.z]) { const p = cam.p(x, y, z); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } if (x1 < 0 || y1 < 0 || x0 > CW || y0 > CH) continue; for (let y = Math.max(0, Math.floor(y0) - 1); y <= Math.min(CH - 1, Math.ceil(y1) + 1); y++) for (let x = Math.max(0, Math.floor(x0) - 1); x <= Math.min(CW - 1, Math.ceil(x1) + 1); x++) cand[y * CW + x] = 1; }
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      if (!cand[y * CW + x]) continue;
      for (let z = hmax; z >= hmin; z -= 0.03) {
        const [gx, gy] = cam.unp(x + 0.5, y + 0.5, z); if (terrainH(gx, gy) >= z) break;
        const a = grid.get(Math.floor(gx) * 4096 + Math.floor(gy)); let hit = false;
        if (a) for (const i of a) { const t = tops[i]; if (z <= t.z && z >= t.zb && gx >= t.bb[0] && gx <= t.bb[2] && gy >= t.bb[1] && gy <= t.bb[3] && inPoly(t.pts, gx, gy)) { hit = true; break; } }
        if (hit) { ref[y * CW + x] = 1; break; }
      }
    }
    let rp = 0, vp = 0, xor = 0, xorEdge = 0;
    const near = (m, x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < CW && yy < CH && m[yy * CW + xx]) return true; } return false; };
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x, a = ref[i], b = mask[i]; rp += a; vp += b; if (a !== b) { xor++; if (!(a ? near(mask, x, y) : near(ref, x, y))) xorEdge++; } }
    const den = Math.max(rp, vp, 1), r = out[key] || (out[key] = { n: 0, sum: 0, max: 0, sumE: 0, maxE: 0, ref: 0 });
    if (rp + vp < 50) continue; r.n++; r.sum += xor / den * 100; r.max = Math.max(r.max, xor / den * 100); r.sumE += xorEdge / den * 100; r.maxE = Math.max(r.maxE, xorEdge / den * 100); r.ref += rp;
  }
  return { out, tops: tops.length, faces: faces.length, stats: WP.stats };
};
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const a = await open({ w: 900, h: 700 }), mode = arg('--mode', 't3'), ext = +arg('--ext', 0.25), px = +arg('--px', 40), n = +arg('--n', 4), terraces = +arg('--terraces', 7), spread = +arg('--spread', 1.5), curves = arg('--curves', 'natural');
  const views = [['oblique 50', 'ortho', 0, 50, 'oblique 50 (4 yaws)'], ['oblique 50', 'ortho', 90, 50, 'oblique 50 (4 yaws)'], ['oblique 50', 'ortho', 180, 50, 'oblique 50 (4 yaws)'], ['oblique 50', 'ortho', 270, 50, 'oblique 50 (4 yaws)'], ['iso 45', 'ortho', 45, 35, 'iso 45 (4 yaws)'], ['iso 45', 'ortho', 135, 35, 'iso 45 (4 yaws)'], ['iso 45', 'ortho', 225, 35, 'iso 45 (4 yaws)'], ['iso 45', 'ortho', 315, 35, 'iso 45 (4 yaws)'], ['stage', 'persp', 0, 25, 'Cam 6 stage'], ['classic', 'oblique', 0, 0, 'Cam 7 classic']];
  const r = await a.page.evaluate(PAGE, { mode, ext, px, n, terraces, spread, views, curves });
  console.log(`wall pass ${mode}, extrude ${ext}, ${px} px per tile, ${terraces} terraces spread ${spread}, ${curves}: ${r.tops} tops, ${r.faces} faces, ${n} places x views`);
  console.log('| view | places | mean % differing | worst % | mean % beyond the 1 px edge band | worst % beyond |\n|---|---:|---:|---:|---:|---:|');
  for (const [k, v] of Object.entries(r.out)) console.log(`| ${k} | ${v.n} | ${(v.sum / v.n).toFixed(2)} | ${v.max.toFixed(2)} | ${(v.sumE / v.n).toFixed(2)} | ${v.maxE.toFixed(2)} |`);
  a.ok('blocks were compared in every view kind', Object.values(r.out).every((v) => v.n > 0 && v.ref > 500), JSON.stringify(Object.entries(r.out).map(([k, v]) => [k, v.n, v.ref])));
  console.log('errors:', a.errs); a.ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
