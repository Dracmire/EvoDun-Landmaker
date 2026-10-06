/* Tests for the gate criterion (E.gateTransitions in src/shape.js) against a literal, independent transcription of the
   user's rules (NormalizeHeightsPerTerrace, ComputeTerraceSlopeMap, FindRankedTerraceTransitions,
   FilterConnectedTerraceTransitions). Run: node tools/test_gates.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 4, subs: 3, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, smooth: 0, radius: 0.9, passGap: 8, climb: 2, stairW: 2, gateThr: 0.05, gateMin: 3 };
const mk = (W, H, f) => {
  const el = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) el[y * W + x] = f(x, y);
  return { name: 't', width: W, height: H, elevation: el, elevRange: [0, 1000], masks: {}, markers: [], fields: {} };
};

/* Literal transcription, written without looking at the implementation: 2D arrays of normalized heights, one per
   unit; adj(a, b) says that b is the upper partner of the low tile a. */
function literal(full, unitOf, nUnits, adj, thr, minSize) {
  const W = full.width, H = full.height, h = full.elevation;
  const norm = [], slope = [];
  for (let u = 0; u < nUnits; u++) {
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < W * H; i++) if (unitOf(i) === u) { mn = Math.min(mn, h[i]); mx = Math.max(mx, h[i]); }
    let range = mx - mn; if (!(range > 0.0001)) range = 1;
    const n = new Float64Array(W * H);
    for (let i = 0; i < W * H; i++) n[i] = unitOf(i) === u ? (h[i] - mn) / range : 0;
    norm.push(n);
    const s = new Float64Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const dx = (n[y * W + x + 1] - n[y * W + x - 1]) * 0.5, dy = (n[(y + 1) * W + x] - n[(y - 1) * W + x]) * 0.5;
      s[y * W + x] = Math.sqrt(dx * dx + dy * dy);
    }
    slope.push(s);
  }
  const trans = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const a = y * W + x, b = ny * W + nx;
    if (!adj(a, b)) continue; // a is the LOW tile
    if (slope[unitOf(a)][a] - slope[unitOf(b)][a] > thr) trans.add(a);
  }
  const groups = [], seen = new Set();
  for (const s0 of [...trans].sort((a, b) => a - b)) {
    if (seen.has(s0)) continue;
    const g = [], st = [s0]; seen.add(s0);
    while (st.length) {
      const i = st.pop(); g.push(i);
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (trans.has(j) && !seen.has(j)) { seen.add(j); st.push(j); }
      }
    }
    if (g.length >= minSize) groups.push(g.sort((a, b) => a - b));
  }
  return { trans, groups };
}

function compare(label, full, P) {
  const q = E.quantize(full, P), K = P.subs;
  for (const kind of ['terrace', 'sub']) {
    const unitOf = kind === 'sub' ? (i) => q.ter[i] * K + q.sub[i] : (i) => q.ter[i];
    const adj = kind === 'sub' ? (a, b) => q.ter[a] === q.ter[b] && q.sub[b] - q.sub[a] > P.climb : (a, b) => q.ter[b] === q.ter[a] + 1;
    const lit = literal(full, unitOf, P.terraces * (kind === 'sub' ? K : 1), adj, P.gateThr, P.gateMin);
    const impl = E.gateTransitions(full, P, kind);
    const litAll = new Set(); for (const g of lit.groups) for (const t of g) litAll.add(t);
    const implAll = new Set(); for (const g of impl.groups) for (const t of g.tiles) implAll.add(t);
    ok(`${label} [${kind}]: same kept positions`, litAll.size === implAll.size && [...litAll].every((t) => implAll.has(t)), `${litAll.size} vs ${implAll.size}`);
    ok(`${label} [${kind}]: same groups`, lit.groups.length === impl.groups.length && lit.groups.every((g) => impl.groups.some((h) => h.tiles.length === g.length && h.tiles.every((t, m) => t === g[m]))), `${lit.groups.length} vs ${impl.groups.length}`);
    ok(`${label} [${kind}]: partner is a 4-neighbour one level up`, impl.groups.every((g) => g.tiles.every((t) => {
      const j = impl.partner[t]; if (j < 0) return false;
      const d = Math.abs((t % full.width) - (j % full.width)) + Math.abs(((t / full.width) | 0) - ((j / full.width) | 0));
      return d === 1 && (kind === 'sub' ? q.ter[j] === q.ter[t] && q.sub[j] - q.sub[t] > P.climb : q.ter[j] === q.ter[t] + 1);
    })));
    ok(`${label} [${kind}]: min size respected`, impl.groups.every((g) => g.size >= P.gateMin));
  }
}

// 1. a ramp with jumps (terrace edges across a slope) and a rough relief
const ramp = mk(40, 30, (x, y) => 40 + x * 22 + (y % 7) * 3);
const relief = mk(48, 40, (x, y) => 500 + 450 * Math.sin(x / 6) * Math.cos(y / 5) + x);
compare('ramp', ramp, BASE);
compare('relief', relief, BASE);
compare('relief thr 0.15 min 6', relief, { ...BASE, gateThr: 0.15, gateMin: 6 });
compare('relief thr 0 min 1', relief, { ...BASE, gateThr: 0, gateMin: 1 });
compare('relief 2 subs climb 0', relief, { ...BASE, subs: 6, climb: 1 });
ok('relief has gates', E.gateTransitions(relief, BASE, 'terrace').groups.length > 0);

// 2. range <= 0.0001 on a unit: treated as 1, same as the literal version, no crash
compare('flat units', mk(24, 18, (x) => (x < 12 ? 100 : 700)), { ...BASE, subs: 1, climb: 0 });

// 2b. a unit whose range is tiny but not zero (0.00005 <= 0.0001): must be treated as range 1
{
  const m = mk(30, 20, (x, y) => (x < 15 ? 100 + (x % 2) * 0.00005 : 260 + (x - 15) * 12));
  compare('tiny range unit', m, { ...BASE, subs: 1, climb: 0 });
  const q = E.quantize(m, { ...BASE, subs: 1, climb: 0 });
  ok('tiny range: neighbouring terraces', q.ter[14] === 0 && q.ter[15] === 1 && E.gateTransitions(m, { ...BASE, subs: 1, climb: 0 }, 'terrace').groups.length === 0);
}

// 3. min size and threshold are monotonic
{
  const a = E.gateTransitions(relief, { ...BASE, gateMin: 1 }, 'terrace').groups.length;
  const b = E.gateTransitions(relief, { ...BASE, gateMin: 8 }, 'terrace').groups.length;
  ok('larger minimum keeps no more groups', b <= a && a > 0, `${a} ${b}`);
  const c = E.gateTransitions(relief, { ...BASE, gateThr: 0.01 }, 'terrace').groups.reduce((s, g) => s + g.size, 0);
  const d = E.gateTransitions(relief, { ...BASE, gateThr: 0.25 }, 'terrace').groups.reduce((s, g) => s + g.size, 0);
  ok('higher threshold keeps no more transition tiles', d <= c && c > 0, `${c} ${d}`);
}

// 4. the 1-tile frame of the map has no slope: no transition position on it
{
  const R = E.gateTransitions(ramp, { ...BASE, gateThr: 0, gateMin: 1 }, 'terrace'), W = ramp.width, H = ramp.height;
  let onFrame = 0; for (const g of R.groups) for (const t of g.tiles) { const x = t % W, y = (t / W) | 0; if (x === 0 || y === 0 || x === W - 1 || y === H - 1) onFrame++; }
  ok('no transition on the map frame', onFrame === 0, onFrame);
}

// 5. the slope is read at the LOW tile, no absolute value: a pure cliff between flat plateaus has no gate
{
  const cliff = mk(40, 20, (x) => (x < 20 ? 100 : 700));
  ok('pure cliff: no gate', E.gateTransitions(cliff, { ...BASE, subs: 1, climb: 0 }, 'terrace').groups.length === 0);
}

// 6. long gate: several stairs in one gate, stairs only on gates; flat map has neither
{
  const big = mk(60, 40, (x) => 20 + x * 16);
  const P = { ...BASE, terraces: 2, passGap: 8 };
  const g = E.gateTransitions(big, P, 'terrace');
  const long = g.groups.reduce((m, x) => (x.size > m.size ? x : m), { size: 0 });
  ok('long gate exists', long.size >= 30, long.size);
  const S = E.shape(big, P);
  const gateTiles = new Set(); for (const gg of g.groups) for (const t of gg.tiles) gateTiles.add(t);
  ok('S.gates matches the groups', S.gates && S.gates.length === g.groups.length, S.gates && S.gates.length);
  const gi = S.gates.findIndex((x) => x.size === long.size);
  ok('several stairs in a long gate', S.passes.filter((p) => p.gate === gi).length === Math.max(1, Math.floor(long.size / P.passGap)), S.passes.length);
  ok('every stair site lies on a gate tile', S.passes.every((p) => gateTiles.has(p.a)));
  const flat = E.shape(mk(30, 20, () => 500), P);
  ok('flat map: no gates, no stairs', flat.gates.length === 0 && flat.stairs.length === 0);
}

// 7. intra-terrace extension: only steps inside one terrace steeper than the climb limit
{
  const m = mk(40, 20, (x) => 100 + x * 4 + (x >= 20 ? 120 : 0));
  const P = { ...BASE, terraces: 1, subs: 6, climb: 1, minSub: 1 };
  const gs = E.gateTransitions(m, P, 'sub'), q = E.quantize(m, P);
  ok('sub kind: partners differ by more than climb in the same terrace', gs.groups.every((g) => g.tiles.every((t) => q.ter[gs.partner[t]] === q.ter[t] && q.sub[gs.partner[t]] - q.sub[t] > P.climb)));
  ok('terrace kind finds nothing with one terrace', E.gateTransitions(m, P, 'terrace').groups.length === 0);
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
