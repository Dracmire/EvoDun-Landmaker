/* Tests for carved stairs (src/shape.js) and their survival in A and B (src/tech.js).
   Run: node tools/test_stairs.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech', 'render']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairStyle: 0, stairW: 2 };
const mk = (W, H, f, range) => {
  const el = new Float32Array(W * H); let mn = Infinity, mx = -Infinity;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  return { name: 't', width: W, height: H, elevation: el, elevRange: range || [mn, mx], masks: {}, markers: [], fields: {} };
};
const relief = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
const EPS = 1e-6;
/* The fixed end of a lateral column (the bottom tile of a cut stair, the top tile of a built-up one) may sit on any
   terrace (diagonal cliffs), so its link to the first/last tread is not constrained. */
const relaxedLink = (st, ci, k, len) => st.cols[ci] !== 0 && (st.mode === 'cut' ? k === 1 : k === len - 1);

// 1. flat map: no sites, no stairs, levels are exactly ter*subs+sub and there are no bridge levels
{
  const S = E.shape(mk(30, 20, () => 500, [0, 1000]), BASE);
  ok('flat map: no stairs', S.stairs.length === 0 && S.stairInfo.sites === 0);
  let same = true; for (let i = 0; i < S.n; i++) if (S.fine[i] !== S.ter[i] * S.subs + S.sub[i]) same = false;
  ok('no stairs: level index == ter*subs+sub', same);
  ok('no stairs: levelH == E.hOf, no bridge levels', S.levelH.every((h, L) => h === E.hOf(L, BASE)) && S.levelMeta.every((m) => !m.bridge));
}

// 2. relief map: invariants of the level table and of the carved tiles
const S = E.shape(relief, BASE), s = E.subHeight(BASE), tread = BASE.climb * s;
ok('relief: stairs were placed', S.stairs.length > 0 && S.stairInfo.placed === S.stairs.length && S.stairInfo.placed + S.stairInfo.dropped === S.stairInfo.sites, JSON.stringify(S.stairInfo));
ok('levels are strictly increasing in height', S.levelH.every((h, L) => L === 0 || h > S.levelH[L - 1]));
ok('every tile has a valid level and byLevel agrees', S.fine.every((L) => L >= 0 && L <= S.maxFine) && S.byLevel.reduce((a, l) => a + l.length, 0) === S.n && S.byLevel.every((l, L) => l.every((i) => S.fine[i] === L)));
{
  let bad = 0; for (let i = 0; i < S.n; i++) if (!S.carved[i] && S.levelH[S.fine[i]] !== E.hOf(S.ter[i] * S.subs + S.sub[i], BASE)) bad++;
  ok('tiles that are not carved keep their height', bad === 0, bad);
  let wrongDir = 0;
  for (const st of S.stairs) for (const step of st.steps) for (const t of step.tiles) {
    const orig = E.hOf(S.ter[t] * S.subs + S.sub[t], BASE), h = S.levelH[S.fine[t]];
    if (st.mode === 'cut' ? !(h < orig - EPS) : !(h > orig + EPS)) wrongDir++;
  }
  ok('cut stairs lower tiles, built-up stairs raise them', wrongDir === 0, wrongDir);
}
{
  let badRise = 0, badOrder = 0, badTop = 0;
  for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) {
    const hs = [S.levelH[S.fine[st.bottom[ci]]], ...st.steps.map((x) => S.levelH[S.fine[x.tiles[ci]]]), S.levelH[S.fine[st.top[ci]]]];
    for (let k = 1; k < hs.length; k++) if (relaxedLink(st, ci, k, hs.length) === false && Math.abs(hs[k] - hs[k - 1]) > tread + EPS) badRise++;
    for (let k = 1; k < st.steps.length; k++) if (!(hs[k + 1] > hs[k] + 1e-9)) badOrder++;
    if (ci === 0 && !(hs[1] > hs[0] + 1e-9 && hs[hs.length - 1] >= hs[hs.length - 2] - 1e-9)) badTop++;
  }
  ok('every tread rises at most climb*subH_eff (default tread = climb)', badRise === 0, badRise);
  ok('treads ascend from bottom to top', badOrder === 0 && badTop === 0, badOrder + '/' + badTop);
}
{
  const nonBridge = S.levelMeta.filter((m) => !m.bridge).length, maxOrig = Math.max(...Array.from(S.ter, (t, i) => t * S.subs + S.sub[i]));
  ok('base levels are all kept, bridge levels are only added when used', nonBridge === maxOrig + 1 && S.levelMeta.every((m, L) => !m.bridge || S.byLevel[L].length > 0), `${nonBridge} vs ${maxOrig + 1}`);
  const seen = new Set(); let shared = 0;
  for (const st of S.stairs) for (const list of [st.bottom, st.top, ...st.steps.map((x) => x.tiles)]) for (const t of list) { if (seen.has(t)) shared++; seen.add(t); }
  ok('no tile belongs to two stairs', shared === 0, shared);
}
// regions: stairs connect, and without them the terraces stay apart
{
  const none = E.shape(relief, Object.assign({}, BASE, { stairW: 0 }));
  ok('stairW=0 disables carving', none.stairs.length === 0 && none.stairInfo.width === 0 && none.fine.every((L, i) => L === none.ter[i] * none.subs + none.sub[i]));
  ok('stairs connect regions (fewer regions than without)', S.regionSizes.length < none.regionSizes.length, `${S.regionSizes.length} vs ${none.regionSizes.length}`);
  let leak = 0;   // a carved tile only shares a region with its own stair: the region of every carved tile equals that of its bottom tile
  for (const st of S.stairs) for (const step of st.steps) for (let ci = 0; ci < st.cols.length; ci++) if (S.region[step.tiles[ci]] !== S.region[st.bottom[ci]]) leak++;
  ok('every stair is one walkable chain', leak === 0, leak);
}
// independent walkable regions: normal tiles join by the climb rule, carved tiles only along their stair
{
  const par = Array.from({ length: S.n }, (_, i) => i), find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, uni = (a, b) => { par[find(a)] = find(b); };
  for (let y = 0; y < S.H; y++) for (let x = 0; x < S.W; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    if (x + dx >= S.W || y + dy >= S.H) continue;
    const i = y * S.W + x, j = (y + dy) * S.W + x + dx;
    if (S.block[i] || S.block[j] || S.carved[i] || S.carved[j]) continue;
    if (S.ter[i] === S.ter[j] && Math.abs(S.sub[i] - S.sub[j]) <= BASE.climb) uni(i, j);
  }
  for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) {
    const chain = [st.bottom[ci], ...st.steps.map((x) => x.tiles[ci]), st.top[ci]];
    for (let k = 1; k < chain.length; k++) uni(chain[k - 1], chain[k]);
    if (ci > 0) for (const x of st.steps) uni(x.tiles[ci - 1], x.tiles[ci]);
  }
  const map = new Map(); let mismatch = 0;
  for (let i = 0; i < S.n; i++) { if (S.block[i]) continue; const a = find(i), b = S.region[i]; if (map.has(a) ? map.get(a) !== b : false) mismatch++; map.set(a, b); }
  const back = new Map(); for (const [a, b] of map) { if (back.has(b) && back.get(b) !== a) mismatch++; back.set(b, a); }
  ok('regions equal an independent union-find (no leaks through carved tiles)', mismatch === 0 && map.size === S.regionSizes.length, `${mismatch} mismatches, ${map.size} vs ${S.regionSizes.length}`);
}
// width, tread rise, determinism
{
  const w = (n) => E.shape(relief, Object.assign({}, BASE, { stairW: n }));
  const w1 = w(1), w2 = S, w3 = w(3);
  ok('width 1: single column everywhere, never narrowed', w1.stairs.every((st) => st.cols.length === 1 && !st.narrowed) && w1.stairInfo.narrowed === 0);
  ok('width 2: columns [0] or [0,1]', w2.stairs.every((st) => st.cols.join() === '0' || st.cols.join() === '0,1') && w2.stairs.some((st) => st.cols.length === 2) && w2.stairs.every((st) => st.narrowed === (st.cols.length < 2)));
  ok('width 2: almost every stair keeps its full width', w2.stairInfo.narrowed <= 0.2 * w2.stairInfo.placed, JSON.stringify(w2.stairInfo));
  ok('width 3: columns [0] or [-1,0,1]', w3.stairs.every((st) => st.cols.join() === '0' || st.cols.join() === '-1,0,1') && w3.stairs.some((st) => st.cols.length === 3));
  ok('narrowed counter matches', w3.stairInfo.narrowed === w3.stairs.filter((st) => st.narrowed).length);
  const t1 = E.shape(relief, Object.assign({}, BASE, { tread: 1 }));
  let bad = 0; for (const st of t1.stairs) for (let ci = 0; ci < st.cols.length; ci++) { const hs = [t1.levelH[t1.fine[st.bottom[ci]]], ...st.steps.map((x) => t1.levelH[t1.fine[x.tiles[ci]]]), t1.levelH[t1.fine[st.top[ci]]]]; for (let k = 1; k < hs.length; k++) if (relaxedLink(st, ci, k, hs.length) === false && Math.abs(hs[k] - hs[k - 1]) > s + EPS) bad++; }
  ok('tread=1: every tread rises at most one sub-terrace; more treads and levels', bad === 0 && t1.levelH.length >= S.levelH.length && t1.stairs.reduce((a, st) => a + st.steps.length, 0) > S.stairs.reduce((a, st) => a + st.steps.length, 0));
  const t5 = E.shape(relief, Object.assign({}, BASE, { tread: 5 }));
  ok('tread is capped by the climb limit', JSON.stringify(t5.fine) === JSON.stringify(S.fine));
  const again = E.shape(relief, BASE);
  ok('deterministic', JSON.stringify(again.fine) === JSON.stringify(S.fine) && JSON.stringify(again.stairs) === JSON.stringify(S.stairs));
}
// 3. a steep step inside one terrace (6 sub-terraces, climb 2) also gets a stair, found by the same gate rule with the
//    sub-terrace as the unit: a ramp that climbs a whole sub-terrace band on each half plus a jump of 3 sub-terraces between the halves (the gate rule normalizes with the nominal band)
{
  const P = Object.assign({}, BASE, { terraces: 1, subs: 6, pre: 0, minPlateau: 1, minSub: 1, passGap: 8 });
  const pk = mk(40, 20, (x) => (x < 20 ? 34 + 0.8 * x : 83.5 + 0.8 * (x - 20)), [0, 100]);
  const withS = E.shape(pk, P), without = E.shape(pk, Object.assign({}, P, { stairW: 0 }));
  ok('intra-terrace: a step of 3+ sub-terraces needs a stair (a gate is found)', withS.stairInfo.gates >= 1 && withS.stairs.length >= 1 && withS.gates.every((g) => g.kind === 'sub'), JSON.stringify(withS.stairInfo));
  ok('intra-terrace: one region with the stairs, two without', withS.regionSizes.length === 1 && without.regionSizes.length === 2, `${withS.regionSizes.length} / ${without.regionSizes.length}`);
  const small = E.shape(mk(40, 20, (x) => (x < 20 ? 34 + 0.8 * x : 66.8 + 0.8 * (x - 20)), [0, 100]), P);
  ok('intra-terrace: a step within the climb limit needs none', small.stairInfo.gates === 0 && small.stairs.length === 0);
  const flat = E.shape(mk(40, 20, (x) => (x < 20 ? 20 : 78), [0, 100]), P);
  ok('intra-terrace: flat plateaus have zero slope, so no gate (the rule needs slope)', flat.stairInfo.gates === 0);
}
// 4. slice: every stair lives inside the slice
{
  const pk = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
  pk.fields = { zone: { ids: Int32Array.from({ length: 72 * 56 }, (_, i) => ((i % 72) < 36 ? 1 : 2)), amb: new Uint8Array(72 * 56), info: { classes: [], outside: 0, ambiguous: {} } } };
  const Sl = E.shape(pk, BASE, { zones: [2], margin: 8 });
  let out = 0; for (const st of Sl.stairs) for (const list of [st.bottom, st.top, ...st.steps.map((x) => x.tiles)]) for (const t of list) if (!Sl.slice[t] || Sl.block[t]) out++;
  ok('slice: no stair tile outside the slice or on blocked tiles', Sl.stairs.length > 0 && out === 0, out);
}
// 5. survival in A and B: coverage of each tread tile (share of its area inside contour(L) and outside contour(L+1))
{
  /* independent re-implementation: even-odd ray cast, 4x4 samples per tile, no box rejection */
  const inside = (loops, x, y) => { let c = 0; for (const lp of loops) for (let i = 0; i < lp.length; i++) { const a = lp[i], b = lp[(i + 1) % lp.length]; if ((a[1] <= y) !== (b[1] <= y)) { const xi = a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); if (xi < x) c++; } } return c % 2 === 1; };
  const indep = (S2, P2, tech) => {
    const lo = tech === 'A' ? E.loopsA : E.loopsB; let lost = 0, degraded = 0, sum = 0, cnt = 0;
    for (const st of S2.stairs) { let closed = false, bad = 0;
      for (const step of st.steps) { let m = 0;
        for (const t of step.tiles) { const L = S2.fine[t], X = t % S2.W, Y = Math.floor(t / S2.W), next = L + 1 <= S2.maxFine ? lo(S2, L + 1, P2) : [], cur = lo(S2, L, P2); let g = 0;
          for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) { const x = X + (k + 0.5) / 4 + 1e-4, y = Y + (j + 0.5) / 4 + 1.3e-4; if (inside(cur, x, y) && !inside(next, x, y)) g++; }
          m += g / 16; sum += g / 16; cnt++; if (g / 16 < 0.9) bad++; }
        if (m / step.tiles.length < 0.5) closed = true; }
      if (closed) lost++; else if (bad) degraded++; }
    return { lost, degraded, coverage: cnt ? sum / cnt : 1 };
  };
  const cfgs = [['defaults', BASE], ['width 1', Object.assign({}, BASE, { stairW: 1 })], ['strong smoothing', Object.assign({}, BASE, { stairW: 1, tread: 1, smooth: 4, radius: 2.5 })], ['width 3, tread 1', Object.assign({}, BASE, { stairW: 3, tread: 1 })]];
  for (const [name, Pc] of cfgs) for (const t of ['A', 'B']) {
    const S2 = E.shape(relief, Pc), a1 = E.stairSurvival(S2, Pc, t), b1 = indep(S2, Pc, t);
    ok(`survival ${name} / ${t}: same lost, degraded and coverage as an independent check`, a1.lost === b1.lost && a1.degraded === b1.degraded && Math.abs(a1.coverage - b1.coverage) < 1e-9, `${a1.lost}/${a1.degraded}/${a1.coverage} vs ${b1.lost}/${b1.degraded}/${b1.coverage}`);
    ok(`survival ${name} / ${t}: with the rigid footprint every stair is fully covered`, a1.n > 0 && a1.lost === 0 && a1.degraded === 0 && a1.coverage === 1 && a1.tilesFailed === 0, JSON.stringify(Object.assign({}, a1, { lostIdx: 0 })));
    const Pn = Object.assign({}, Pc, { anchor: false }), Sn = E.shape(relief, Pn), n1 = E.stairSurvival(Sn, Pn, t), n2 = indep(Sn, Pn, t);
    ok(`survival ${name} / ${t}: the check agrees with the independent one without the footprint`, n1.lost === n2.lost && n1.degraded === n2.degraded && Math.abs(n1.coverage - n2.coverage) < 1e-9);
    ok(`survival ${name} / ${t}: without the rigid footprint the check fails (it detects the problem)`, n1.coverage < 0.97 && n1.degraded + n1.lost > 0, n1.coverage);
  }
  { const Pn = Object.assign({}, BASE, { anchor: false }), Sn = E.shape(relief, Pn);
    ok('survival: B without footprint loses stairs, with it none', E.stairSurvival(Sn, Pn, 'B').lost > 0 && E.stairSurvival(S, BASE, 'B').lost === 0); }
  ok('survival: well-formed result', (() => { const a = E.stairSurvival(S, BASE, 'A'); return a.n === S.stairs.length && a.tiles > 0 && a.worst >= 0 && a.worst <= 1; })());
  ok('survival: no stairs -> nothing lost, coverage 1', (() => { const r = E.stairSurvival(E.shape(mk(30, 20, () => 500, [0, 1000]), BASE), BASE, 'A'); return r.lost === 0 && r.coverage === 1; })());
  // the terrain far from the stairs is still smoothed: a ramp on the left half of a map, flat plateaus (no gates) on the right
  {
    const half = mk(110, 40, (x, y) => (x < 30 ? 120 + x * 11 : 520 + 180 * (Math.sin(x / 6) * Math.cos(y / 5) > 0 ? 1 : 0)), [0, 1000]);
    const Pa = Object.assign({}, BASE, { stairW: 2 }), Pn = Object.assign({}, Pa, { anchor: false }), Sa = E.shape(half, Pa), Sn = E.shape(half, Pn);
    const far = (p) => p[0] > 60; let tot = 0, same = 0, nearTot = 0, nearSame = 0;
    for (let L = 1; L <= Sa.maxFine; L++) { const a = E.loopsA(Sa, L, Pa), b = E.loopsA(Sn, L, Pn), key = (q) => q[0].toFixed(6) + ',' + q[1].toFixed(6), set = new Set(); for (const lp of b) for (const q of lp) set.add(key(q)); for (const lp of a) for (const q of lp) { if (far(q)) { tot++; if (set.has(key(q))) same++; } else if (q[0] < 36) { nearTot++; if (set.has(key(q))) nearSame++; } } }
    ok('the map has stairs on the left and smooth plateaus on the right', Sa.stairs.length > 0 && Sa.stairs.every((st) => st.top[0] % Sa.W < 40) && tot > 40, `${Sa.stairs.length} ${tot}`);
    ok('anchoring leaves the smoothing of the terrain far from the stairs identical (A)', same === tot, `${same}/${tot}`);
    ok('(control) near the stairs the contours do change', nearTot > 0 && nearSame < nearTot, `${nearSame}/${nearTot}`);
  }
  ok('survival is cached by the loops', E.stairSurvival(S, BASE, 'B').lost === 0);
}

// 6. hand-built cases for guards that real maps rarely exercise
const HP = { terraces: 2, subs: 3, terH: 1, subH: 0.22, climb: 2, stairStyle: 0, stairW: 2, tread: 2 };
{
  // (a) region leak: a tile beside a carved stair tile must not join it sideways. Row 0: terrace 0 x<4, terrace 1 x>=4;
  // tiles (2,0),(3,0) are the stair; (2,1) is a pocket whose other neighbours are blocked.
  const W = 7, H = 2, n = W * H;
  const ter = new Int16Array(n), sub = new Int16Array(n), block = new Uint8Array(n), carved = new Uint8Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ter[y * W + x] = x >= 4 ? 1 : 0;
  block[1 * W + 1] = 1; block[1 * W + 3] = 1; carved[2] = 1; carved[3] = 1;
  const S0 = { W, H, n, ter, sub, block, carved, stairs: [{ cols: [0], bottom: [1], top: [4], steps: [{ tiles: [2] }, { tiles: [3] }] }] };
  E._regions(S0, HP);
  ok('regions: the stair joins its bottom and top', S0.region[1] === S0.region[2] && S0.region[2] === S0.region[3] && S0.region[3] === S0.region[4]);
  ok('regions: a pocket tile beside a carved tread is not connected sideways', S0.region[1 * W + 2] !== S0.region[2], `${S0.region[1 * W + 2]} vs ${S0.region[2]}`);
}
{
  // (b) lateral column check: a lateral tile that is not above the tread cannot be cut (it would have to be raised).
  const mkS = (latSub) => {
    const W = 7, H = 3, n = W * H, K = 3, ter = new Int16Array(n), sub = new Int16Array(n), block = new Uint8Array(n);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; ter[i] = x >= 2 ? 1 : 0; sub[i] = x < 2 || y !== 2 ? 2 : latSub; }
    for (let y = 0; y < H; y++) block[y * W] = 1; // x=0 blocked: building up the lower terrace is impossible
    const fine = new Int16Array(n).map((_, i) => ter[i] * K + sub[i]);
    const levelH = [], levelMeta = [];
    for (let L = 0; L < 6; L++) { levelH.push(E.hOf(L, HP)); levelMeta.push({ ter: Math.floor(L / K), sub: L % K, bridge: false }); }
    return { W, H, n, subs: K, N: 2, ter, sub, fine, maxFine: 5, levelH, levelMeta, block, water: new Array(n).fill(0), gates: [{}], passes: [{ a: 1 + W, b: 2 + W, gate: 0, kind: 'terrace', alts: [] }] };
  };
  const Sa = mkS(2); E._carve(Sa, HP);
  ok('lateral: control, the lateral tile is above the treads -> width 2', Sa.stairs.length === 1 && Sa.stairs[0].cols.join() === '0,1', JSON.stringify(Sa.stairs.map((s) => s.cols)));
  const Sb = mkS(0); E._carve(Sb, HP);
  ok('lateral: a lateral tile level with a tread is rejected -> narrowed to the central column', Sb.stairs.length === 1 && Sb.stairs[0].cols.join() === '0' && Sb.stairInfo.narrowed === 1, JSON.stringify(Sb.stairs.map((s) => s.cols)));
}
{
  // (c) bridge levels: colour is the linear mix between the last sub-terrace of terrace t and the first of t+1; base levels unchanged
  const K = 3, levelMeta = [], levelH = [];
  for (let L = 0; L < 6; L++) { levelMeta.push({ ter: Math.floor(L / K), sub: L % K, bridge: false }); levelH.push(L); }
  levelMeta.splice(3, 0, { ter: 0, sub: K - 1, bridge: true, frac: 0.25 }); levelH.splice(3, 0, 2.5);
  const SC = { levelMeta, levelH }, lc = (L) => E.levelColor(SC, L, HP);
  const noBridge = { levelMeta: levelMeta.filter((m) => !m.bridge) };
  ok('level colour: base levels do not depend on bridges', [0, 1, 2].every((L) => lc(L).every((v, k) => Math.abs(v - E.levelColor(noBridge, L, HP)[k]) < 1e-9)) && [4, 5, 6].every((L) => lc(L).every((v, k) => Math.abs(v - E.levelColor(noBridge, L - 1, HP)[k]) < 1e-9)));
  const lo = lc(2), hi = lc(4), br = lc(3);
  ok('level colour: a bridge is the mix of its two terraces by frac', br.every((v, k) => Math.abs(v - (lo[k] + (hi[k] - lo[k]) * 0.25)) < 1e-9) && br.some((v, k) => Math.abs(v - lo[k]) > 1e-6), br.join());
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
