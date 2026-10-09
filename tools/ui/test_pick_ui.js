/* Click resolution (E.pickTile): the tile under the cursor as seen, with heights and occlusion, in Box, A and B, two presets x four
   yaws. The reference is an independent per-pixel z-buffer of the true geometry (tile tops, ramp surfaces, walls) that stores the owner
   tile of the front-most surface. Points are random screen pixels where the reference shows a cap or a ramp; points near a change of
   level (within 0.9 tile on screen) are left out for A and B with smoothing, because the smoothed contour moves the edge of a slab.
   A naive picker (ground tile under the cursor ignoring heights) is run as a control: it must be clearly worse.
     NODE_PATH=$(npm root -g) node tools/ui/test_pick_ui.js [--n 400] */
const { open } = require('./common');

const PAGE = async ({ nPts, CAM }) => {
  const E = window.EVO;
  const mk = (W, H, f) => { const el = new Float32Array(W * H); let mn = 1e9, mx = -1e9; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); } return { name: 't', width: W, height: H, elevation: el, elevRange: [mn, mx], masks: {}, markers: [], fields: {} }; };
  const relief = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
  const BASE = { terraces: 6, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 2, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
  const CW = 640, CH = 480;
  let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  function reference(S, view, cam) {
    const W = S.W, H = S.H, ST = new Map();
    for (const st of S.stairs) if (st.ramp) for (const step of st.steps) for (const t of step.tiles) ST.set(t, st);
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const zOf = cam.persp ? (x, y, h) => 1 / Math.max(cam.D - cam.depth(x, y, h), 1e-6) : (x, y, h) => ((sy * (x - W / 2) + cy * (y - H / 2)) * (view.kind === 'oblique' ? 1 : cp) + h * (view.kind === 'oblique' ? 1 : sp)); // persp: 1 / z is linear in screen space
    const zb = new Float32Array(CW * CH).fill(-1e9), own = new Int32Array(CW * CH).fill(-1), kind = new Uint8Array(CW * CH), lev = new Int32Array(CW * CH).fill(-1);
    const tri = (A, B, C, o, k, L) => {
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(CW - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(CH - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]); if (Math.abs(d) < 1e-9) return;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5, l1 = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d, l2 = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d, l3 = 1 - l1 - l2;
        if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
        const z = l1 * A[2] + l2 * B[2] + l3 * C[2], q = y * CW + x;
        if (z > zb[q]) { zb[q] = z; own[q] = o; kind[q] = k; lev[q] = L; }
      }
    };
    const V = (x, y, h) => { const p = cam.p(x, y, h); return [p[0], p[1], zOf(x, y, h)]; };
    const quad = (a, b, c, d, o, k, L) => { tri(a, b, c, o, k, L); tri(a, c, d, o, k, L); };
    const corner = (j, x, y) => (ST.has(j) ? E.rampHeight(ST.get(j), x, y, j) : S.levelH[S.fine[j]]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, ramp = ST.has(i);
      quad(V(x, y, corner(i, x, y)), V(x + 1, y, corner(i, x + 1, y)), V(x + 1, y + 1, corner(i, x + 1, y + 1)), V(x, y + 1, corner(i, x, y + 1)), i, ramp ? 2 : 1, S.fine[i]);
      for (const [dx, dy, ax, ay, bx, by] of [[1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1]]) {
        const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue;
        const j = ny * W + nx, a0 = corner(i, x + ax, y + ay), a1 = corner(i, x + bx, y + by), b0 = corner(j, x + ax, y + ay), b1 = corner(j, x + bx, y + by);
        if (Math.abs(a0 - b0) < 1e-6 && Math.abs(a1 - b1) < 1e-6) continue;
        const owner = (a0 + a1) > (b0 + b1) ? i : j;
        quad(V(x + ax, y + ay, Math.min(a0, b0)), V(x + bx, y + by, Math.min(a1, b1)), V(x + bx, y + by, Math.max(a1, b1)), V(x + ax, y + ay, Math.max(a0, b0)), owner, 3, -1);
      }
    }
    return { own, kind, lev };
  }

  const out = {}; const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const views = CAM === 'stage' ? [['stage', 0, 25, 'persp']] : CAM === 'classic' ? [['classic', 0, 0, 'oblique']] : [['oblique', 0, 50], ['oblique', 90, 50], ['oblique', 180, 50], ['oblique', 270, 50], ['iso', 45, 35], ['iso', 135, 35], ['iso', 225, 35], ['iso', 315, 35]]; // --cam stage | classic: the camera bank's Cam 6 / Cam 7 (measured, not enforced)
  const configs = [['ramps', BASE], ['steps', Object.assign({}, BASE, { stairStyle: 0 })], ['ramps, no smoothing', Object.assign({}, BASE, { smooth: 0, radius: 0 })]];
  const worst = []; const fails = [], wfails = [];
  for (const [cname, P] of configs) {
    const S = E.shape(relief, P);
    for (const tech of ['box', 'A', 'B']) {
      if (cname === 'steps' && tech === 'box' && false) continue;
      let tot = 0, ok = 0, naiveOk = 0, hidTot = 0, hidOk = 0, hidNaive = 0, wallTot = 0, wallOk = 0, filtered = 0;
      for (const [vname, yaw, pitch, kind] of views) {
        const view = { kind, yaw, pitch, zoom: 1.6, panX: 0, panY: 0 }, cam = E.makeCam(S, P, view, CW, CH), ref = reference(S, view, cam);
        const sc = cam.sc, r = 0.9 * sc, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]];
        const naive = (x, y) => { const g = cam.unp(x, y, S.levelH[0]), ix = Math.floor(g[0]), iy = Math.floor(g[1]); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? iy * S.W + ix : -1; };
        let tries = 0, got = 0;
        while (got < nPts && tries < nPts * 40) {
          tries++;
          const px = 3 + rnd() * (CW - 6), py = 3 + rnd() * (CH - 6), q = (py | 0) * CW + (px | 0), k = ref.kind[q];
          if (k === 0) continue;
          if (k === 3) { // a wall: Box must give the owner tile; A and B only when exact
            if (tech !== 'box' && cname !== 'ramps, no smoothing') continue;
            let same = true; for (const [dx, dy] of DIRS) { const x2 = Math.round(px + dx * 2.5), y2 = Math.round(py + dy * 2.5); if (x2 < 0 || y2 < 0 || x2 >= CW || y2 >= CH || ref.own[y2 * CW + x2] !== ref.own[q]) { same = false; break; } }
            if (!same) continue;
            const t = E.pickTile(S, P, tech, view, CW, CH, px, py); wallTot++; if (t.tile === ref.own[q]) wallOk++; else if (wfails.length < 10) wfails.push(`${cname}|${tech}|${vname} wall at (${px.toFixed(1)},${py.toFixed(1)}): got ${t.tile} (${t.kind}) want ${ref.own[q]} (xy ${ref.own[q] % S.W},${(ref.own[q] / S.W) | 0}; got ${t.tile % S.W},${(t.tile / S.W) | 0}) fine ${S.fine[ref.own[q]]}/${S.fine[t.tile]}`); got++; continue;
          }
          // keep points whose neighbourhood (0.9 tile) is the same level: the edges of A/B slabs move with the smoothing
          if (tech !== 'box' && cname !== 'ramps, no smoothing') {
            let same = true; for (const [dx, dy] of DIRS) { const x2 = Math.round(px + dx * r), y2 = Math.round(py + dy * r); if (x2 < 0 || y2 < 0 || x2 >= CW || y2 >= CH) { same = false; break; } const q2 = y2 * CW + x2; if (ref.kind[q2] === 3 || ref.lev[q2] !== ref.lev[q]) { same = false; break; } }
            if (same) for (const [dx, dy] of DIRS) { const x2 = Math.round(px + dx * 2.5), y2 = Math.round(py + dy * 2.5); if (x2 < 0 || y2 < 0 || x2 >= CW || y2 >= CH || ref.own[y2 * CW + x2] !== ref.own[q]) { same = false; break; } } // and not within 1.5 px of a tile edge
            if (!same) { filtered++; continue; }
          } else {
            let same = true; for (const [dx, dy] of DIRS) { const x2 = Math.round(px + dx * 2.5), y2 = Math.round(py + dy * 2.5); if (x2 < 0 || y2 < 0 || x2 >= CW || y2 >= CH || ref.own[y2 * CW + x2] !== ref.own[q]) { same = false; break; } } // not within 1.5 px of an edge
            if (!same) continue;
          }
          const t = E.pickTile(S, P, tech, view, CW, CH, px, py); tot++; got++;
          if (t.tile === ref.own[q]) ok++; else if (tech === 'box') { const ky = (t2) => cam.ry(t2 % S.W + 0.5, ((t2 / S.W) | 0) + 0.5); (out.__boxFails || (out.__boxFails = [])).push(ky(t.tile) > ky(ref.own[q]) ? 'painter-later' : 'painter-earlier'); if (fails.length < 12) fails.push(`${cname}|${tech}|${vname} box cap at (${px.toFixed(1)},${py.toFixed(1)}): ref tile ${ref.own[q]} drawn ${ky(t.tile) > ky(ref.own[q]) ? 'before' : 'after'} the picked one ${t.tile}`); } else if (fails.length < 12) fails.push(`${cname}|${tech}|${vname} cap at (${px.toFixed(1)},${py.toFixed(1)}): got ${t.tile} (${t.kind}) want ${ref.own[q]} kind ${ref.kind[q]} (xy ${ref.own[q] % S.W},${(ref.own[q] / S.W) | 0}; got ${t.tile % S.W},${(t.tile / S.W) | 0}) fine ${S.fine[ref.own[q]]}/${S.fine[t.tile]}`);
          if (naive(px, py) === ref.own[q]) naiveOk++;
        }
        // hidden tiles: the centre of a random tile whose front-most surface there belongs to another tile
        for (let n = 0; n < Math.max(60, nPts * 3); n++) {
          const i = (rnd() * S.n) | 0, p = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, S.levelH[S.fine[i]]);
          if (p[0] < 3 || p[0] > CW - 3 || p[1] < 3 || p[1] > CH - 3) continue;
          const q = (p[1] | 0) * CW + (p[0] | 0);
          if (ref.own[q] === i || ref.kind[q] === 0 || ref.kind[q] === 3) continue;
          let flat = true; for (const [dx, dy] of DIRS) { const x2 = Math.round(p[0] + dx * 2.5), y2 = Math.round(p[1] + dy * 2.5); if (x2 < 0 || y2 < 0 || x2 >= CW || y2 >= CH || ref.own[y2 * CW + x2] !== ref.own[q]) { flat = false; break; } }
          if (!flat) continue; // a hidden centre that sits on an edge of the occluder is a 1-2 px case
          if (tech !== 'box' && cname !== 'ramps, no smoothing') continue;
          hidTot++; const t = E.pickTile(S, P, tech, view, CW, CH, p[0], p[1]); if (t.tile === ref.own[q]) hidOk++; else if (fails.length < 12) fails.push(`${cname}|${tech}|${vname} hidden centre of ${i} at (${p[0].toFixed(1)},${p[1].toFixed(1)}): got ${t.tile} (${t.kind}) want ${ref.own[q]} kind ${ref.kind[q]}`); if (naive(p[0], p[1]) === ref.own[q]) hidNaive++;
        }
      }
      out[`${cname} | ${tech}`] = { tot, ok, naiveOk, hidTot, hidOk, hidNaive, wallTot, wallOk };
    }
  }
  out.__fails = fails.concat(wfails); out.__bf = out.__boxFails; delete out.__boxFails;
  return out;
};

(async () => {
  const ni = process.argv.indexOf('--n'), nPts = ni > 0 ? +process.argv[ni + 1] : 120;
  const a = await open({ w: 900, h: 700 }), CAMARG = process.argv.includes('--cam') ? process.argv[process.argv.indexOf('--cam') + 1] : '', okf = CAMARG ? (name, cond, extra) => console.log(`MEASURED (not enforced, --cam ${CAMARG}) ${cond ? 'within' : 'outside'}: ${name}  ${extra === undefined ? '' : extra}`) : a.ok;
  const r = await a.page.evaluate(PAGE, { nPts, CAM: process.argv.includes('--cam') ? process.argv[process.argv.indexOf('--cam') + 1] : '' });
  console.log('| configuration | technique | cap/ramp points | correct | naive picker (control) | hidden tile centres: correct / naive | wall points: correct |\n|---|---|---:|---:|---:|---|---|');
  console.log(r.__fails.join('\n')); console.log('box cap failures by painter order:', JSON.stringify(r.__bf || [])); delete r.__fails; delete r.__bf;
  for (const [k, v] of Object.entries(r)) {
    const [c, t] = k.split(' | '), pc = (x, y) => (y ? (100 * x / y).toFixed(1) + ' %' : '-');
    console.log(`| ${c} | ${t} | ${v.tot} | ${v.ok} (${pc(v.ok, v.tot)}) | ${pc(v.naiveOk, v.tot)} | ${v.hidTot ? `${v.hidOk}/${v.hidTot} / ${v.hidNaive}/${v.hidTot}` : '-'} | ${v.wallTot ? `${v.wallOk}/${v.wallTot}` : '-'} |`);
    okf(`${k}: >= 98 % of the cap/ramp points resolve to the tile that the reference shows (the rest are 1-2 px edge cases, see header)`, v.tot > 100 && v.ok >= 0.98 * v.tot, `${v.ok}/${v.tot}`);
    okf(`${k}: the naive picker (control) is clearly worse`, v.naiveOk < 0.9 * v.tot, `${v.naiveOk}/${v.tot}`);
    if (v.hidTot) okf(`${k}: tiles hidden behind higher terrain are not picked (>= 75 %)`, v.hidOk >= 0.75 * v.hidTot, `${v.hidOk}/${v.hidTot}`);
    if (v.wallTot && (t === 'box' || c === 'ramps, no smoothing')) okf(`${k}: wall points resolve to the tile that owns the wall (Box >= 95 %, A/B without smoothing >= 85 %: the rest are pixels of the lower edge of a wall that vote for the cap below)`, v.wallOk >= (t === 'box' ? 0.95 : 0.85) * v.wallTot, `${v.wallOk}/${v.wallTot}`);
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
