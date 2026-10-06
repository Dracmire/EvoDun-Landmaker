/* Read-only diagnostic of the gate criterion on a height image (8/16-bit grey or V channel of an RGB PNG).
     node tools/diag_gates.js <height.png> [--terraces 12] [--pre 1] [--minPlateau 5] [--subs 3]
   Per terrace: tiles, raw elevation range of its tiles vs its nominal band and the stretch factor, tiles outside the band.
   Per border t-(t+1): low tiles on the border, how many pass the threshold, and the distribution of sLow, sHigh and their
   difference, once normalizing with the tiles' min/max (the user's original code) and once with the nominal band (the
   viewer's rule). Then the gate tiles per low terrace for both. Nothing in the viewer changes. */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
(async () => {
  const file = process.argv[2]; if (!file) { console.error('usage: node tools/diag_gates.js <height.png> [--terraces 12]'); process.exit(2); }
  const img = await E.decodePng(fs.readFileSync(file)), W = img.width, H = img.height, n = W * H;
  const ch = img.colorType === 2 || img.colorType === 6 ? img.channels[0] : img.channels[0], max = img.max;
  const el = new Float32Array(n); for (let i = 0; i < n; i++) el[i] = ch[i] / max * 1000;
  const P = { terraces: arg('--terraces', 12), subs: arg('--subs', 3), terH: 1, subH: 0.22, minPlateau: arg('--minPlateau', 5), minSub: 3, pre: arg('--pre', 1), climb: 2, gateThr: 0.05, gateMin: 3 };
  let mn = Infinity, mx = -Infinity; for (const v of el) { if (v < mn) mn = v; if (v > mx) mx = v; }
  const full = { name: 'm', width: W, height: H, elevation: el, elevRange: [mn, mx], masks: {}, markers: [], fields: {} };
  const q = E.quantize(full, P), N = P.terraces, band = (mx - mn) / N;
  console.log(`${file}: ${W}x${H}, elevation ${mn.toFixed(0)}..${mx.toFixed(0)}, ${N} terraces (band ${band.toFixed(1)}), pre ${P.pre}, minPlateau ${P.minPlateau}\n`);
  const cnt = new Array(N).fill(0), rmin = new Array(N).fill(Infinity), rmax = new Array(N).fill(-Infinity), out = new Array(N).fill(0);
  for (let i = 0; i < n; i++) { const t = q.ter[i]; cnt[t]++; rmin[t] = Math.min(rmin[t], el[i]); rmax[t] = Math.max(rmax[t], el[i]); if (el[i] < mn + t * band - 1e-6 || el[i] > mn + (t + 1) * band + 1e-6) out[t]++; }
  console.log('terrace | tiles | raw range | nominal band | stretch | tiles outside band');
  for (let t = 0; t < N; t++) console.log(`${String(t).padStart(7)} | ${String(cnt[t]).padStart(5)} | ${rmin[t].toFixed(0)}-${rmax[t].toFixed(0)} | ${(mn + t * band).toFixed(0)}-${(mn + (t + 1) * band).toFixed(0)} | ${cnt[t] ? ((rmax[t] - rmin[t]) / band).toFixed(1) : '-'}x | ${out[t]}`);
  const slopes = (mode) => {
    const S = [];
    for (let t = 0; t < N; t++) {
      const lo = mode === 'minmax' ? rmin[t] : mn + t * band, w = mode === 'minmax' ? ((rmax[t] - rmin[t]) > 0.0001 ? rmax[t] - rmin[t] : 1) : band;
      const nn = new Float64Array(n); for (let i = 0; i < n; i++) nn[i] = q.ter[i] === t ? (mode === 'minmax' ? (el[i] - lo) / w : Math.max(0, Math.min(1, (el[i] - lo) / w))) : 0;
      const s = new Float64Array(n); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) s[y * W + x] = Math.hypot((nn[y * W + x + 1] - nn[y * W + x - 1]) * 0.5, (nn[(y + 1) * W + x] - nn[(y - 1) * W + x]) * 0.5);
      S.push(s);
    } return S;
  };
  const pct = (a, p) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(p * a.length))] : NaN);
  const fmt = (a) => [0, 0.25, 0.5, 0.75, 0.95, 1].map((p) => pct(a, p).toFixed(3)).join(' ');
  for (const mode of ['minmax', 'band']) {
    const S = slopes(mode), per = new Array(N).fill(0);
    console.log(`\n== normalization: ${mode === 'minmax' ? "tiles' min/max (the user's original code)" : 'nominal band, clamped (viewer)'}  [min q25 median q75 q95 max]`);
    for (let t = 0; t + 1 < N; t++) {
      const pos = new Set();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (q.ter[i] !== t) continue; for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H && q.ter[b * W + a] === t + 1) pos.add(i); } }
      const sl = [], sh = [], df = []; let pass = 0;
      for (const i of pos) { const a = S[t][i], b = S[t + 1][i]; sl.push(a); sh.push(b); df.push(a - b); if (a - b > P.gateThr) pass++; }
      per[t] = pass;
      console.log(`border ${t}-${t + 1}: low tiles ${pos.size}, pass ${pass}${pos.size && !pass ? '  <-- NO GATES' : ''}\n   sLow  ${fmt(sl)}\n   sHigh ${fmt(sh)}\n   diff  ${fmt(df)}`);
    }
    console.log('tiles passing the threshold by low terrace:', per.join(' '));
  }
  const g = E.gateTransitions(full, P, 'terrace'), per = new Array(N).fill(0); for (const gr of g.groups) for (const t of gr.tiles) per[q.ter[t]]++;
  console.log(`\nviewer: ${g.groups.length} gates (min size ${P.gateMin}), gate tiles by low terrace: ${per.join(' ')}`);
})();
