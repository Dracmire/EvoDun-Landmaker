/* Tests for carved stairs (src/shape.js) and their survival in A and B (src/tech.js).
   Run: node tools/test_stairs.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 2 };
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
// 3. a steep step inside one terrace (6 sub-terraces, climb 2) also gets a stair
{
  const P = Object.assign({}, BASE, { terraces: 1, subs: 6, pre: 0, minPlateau: 1, minSub: 1, passGap: 8 });
  const pk = mk(40, 20, (x) => (x < 20 ? 20 : 80), [0, 100]);
  const withS = E.shape(pk, P), without = E.shape(pk, Object.assign({}, P, { stairW: 0 }));
  ok('intra-terrace: a step of 3 sub-terraces needs a stair (sites found)', withS.stairInfo.sites >= 1 && withS.stairs.length >= 1, JSON.stringify(withS.stairInfo));
  ok('intra-terrace: one region with the stair, two without', withS.regionSizes.length === 1 && without.regionSizes.length === 2, `${withS.regionSizes.length} / ${without.regionSizes.length}`);
  const small = E.shape(mk(40, 20, (x) => (x < 20 ? 20 : 20 + 10), [0, 100]), P);
  ok('intra-terrace: a step within the climb limit needs none', small.stairInfo.sites === 0 && small.stairs.length === 0);
}
// 4. slice: every stair lives inside the slice
{
  const pk = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
  pk.fields = { zone: { ids: Int32Array.from({ length: 72 * 56 }, (_, i) => ((i % 72) < 36 ? 1 : 2)), amb: new Uint8Array(72 * 56), info: { classes: [], outside: 0, ambiguous: {} } } };
  const Sl = E.shape(pk, BASE, { zones: [2], margin: 8 });
  let out = 0; for (const st of Sl.stairs) for (const list of [st.bottom, st.top, ...st.steps.map((x) => x.tiles)]) for (const t of list) if (!Sl.slice[t] || Sl.block[t]) out++;
  ok('slice: no stair tile outside the slice or on blocked tiles', Sl.stairs.length > 0 && out === 0, out);
}
// 5. survival in A and B
{
  /* independent re-implementation: even-odd ray cast to the left, tiles judged one by one */
  const inside = (loops, x, y) => { let c = 0; for (const lp of loops) for (let i = 0; i < lp.length; i++) { const a = lp[i], b = lp[(i + 1) % lp.length]; if ((a[1] <= y) !== (b[1] <= y)) { const xi = a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); if (xi < x) c++; } } return c % 2 === 1; };
  const indep = (S2, P2, tech) => {
    const lo = tech === 'A' ? E.loopsA : E.loopsB; let lost = 0, degraded = 0;
    for (const st of S2.stairs) { let closed = false, bad = 0;
      for (const step of st.steps) { let ok1 = 0; for (const t of step.tiles) { const L = S2.fine[t], x = t % S2.W + 0.5, y = Math.floor(t / S2.W) + 0.5; const next = L + 1 <= S2.maxFine ? lo(S2, L + 1, P2) : []; if (inside(lo(S2, L, P2), x, y) && !inside(next, x, y)) ok1++; else bad++; } if (!ok1) closed = true; }
      if (closed) lost++; else if (bad) degraded++; }
    return { lost, degraded };
  };
  const cfgs = [['defaults', BASE], ['width 1', Object.assign({}, BASE, { stairW: 1 })], ['strong smoothing', Object.assign({}, BASE, { stairW: 1, tread: 1, smooth: 4, radius: 2.5 })], ['width 3, tread 1', Object.assign({}, BASE, { stairW: 3, tread: 1 })]];
  for (const [name, Pc] of cfgs) for (const t of ['A', 'B']) {
    const S2 = E.shape(relief, Pc), a1 = E.stairSurvival(S2, Pc, t), b1 = indep(S2, Pc, t);
    ok(`survival ${name} / ${t}: same lost and degraded as an independent check`, a1.lost === b1.lost && a1.degraded === b1.degraded, `${a1.lost}/${a1.degraded} vs ${b1.lost}/${b1.degraded}`);
  }
  const sv = (S2, P2, t) => E.stairSurvival(S2, P2, t);
  const a = sv(S, BASE, 'A'), b = sv(S, BASE, 'B');
  ok('survival: well-formed result', a.n === S.stairs.length && b.n === S.stairs.length && a.lost + a.degraded <= a.n && b.lost + b.degraded <= b.n && a.tilesFailed <= a.tiles && a.tiles === b.tiles);
  ok('survival: no stairs -> nothing lost', sv(E.shape(mk(30, 20, () => 500, [0, 1000]), BASE), BASE, 'A').lost === 0);
  const P1 = Object.assign({}, BASE, { stairW: 1 }), S1 = E.shape(relief, P1), b1 = sv(S1, P1, 'B');
  ok('survival: with width 1 and the default smoothing B closes some slots (detector works)', b1.lost > 0 && b1.lostIdx.length === b1.lost, b1.lost + '/' + b1.n);
  ok('survival: width 2 loses fewer than width 1 in B', b.lost < b1.lost, `${b.lost} vs ${b1.lost}`);
  const Pr = Object.assign({}, BASE, { stairW: 1, tread: 1, smooth: 4, radius: 2.5 }), Sr = E.shape(relief, Pr);
  ok('survival: stronger smoothing loses more', sv(Sr, Pr, 'B').lost >= b1.lost);
  ok('survival is cached by the loops', sv(S, BASE, 'B').lost === b.lost);
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
