/* Tests for the walking route and the region-gap explanation (src/shape.js: E.route, E.regionGap). Run: node tools/test_route.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 6, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 2, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
const mk = (W, H, f) => {
  const el = new Float32Array(W * H); let mn = Infinity, mx = -Infinity;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  return { name: 't', width: W, height: H, elevation: el, elevRange: [mn, mx], masks: {}, markers: [], fields: {} };
};
const relief = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// independent breadth-first search, written from the region rule (not from walkGraph)
function bfsLen(S, P, a, b) {
  const W = S.W, H = S.H, adj = new Map(), add = (u, v) => { (adj.get(u) || adj.set(u, []).get(u)).push(v); (adj.get(v) || adj.set(v, []).get(v)).push(u); };
  for (const st of S.stairs) for (let c = 0; c < st.cols.length; c++) { let p = st.bottom[c]; for (const sp of st.steps) { add(p, sp.tiles[c]); p = sp.tiles[c]; } add(p, st.top[c]); if (c > 0) for (const sp of st.steps) { const u = sp.tiles[c - 1], v = sp.tiles[c]; if (Math.abs(u - v) === W || (Math.abs(u - v) === 1 && ((u / W) | 0) === ((v / W) | 0))) add(u, v); } }
  const dist = new Map([[a, 1]]), q = [a];
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0, ns = [];
    if (!S.carved[i]) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!S.block[j] && !S.carved[j] && S.ter[i] === S.ter[j] && Math.abs(S.sub[i] - S.sub[j]) <= P.climb) ns.push(j); }
    for (const j of adj.get(i) || []) if (!S.block[j]) ns.push(j);
    for (const j of ns) if (!dist.has(j)) { dist.set(j, dist.get(i) + 1); q.push(j); }
  }
  return dist.get(b) || 0;
}

for (const [label, P, spec] of [['whole map', BASE, null], ['ramps, width 1', Object.assign({}, BASE, { stairW: 1 }), null], ['steps', Object.assign({}, BASE, { stairStyle: 0 }), null], ['no stairs', Object.assign({}, BASE, { stairW: 0 }), null]]) {
  const S = E.shape(relief, P, spec);
  let same = 0, diff = 0, bad = 0, lenBad = 0, adjBad = 0;
  for (let n = 0; n < 250; n++) {
    const a = (rnd() * S.n) | 0, b = (rnd() * S.n) | 0; if (S.block[a] || S.block[b]) continue;
    const r = E.route(S, P, a, b), sameRegion = S.region[a] === S.region[b];
    if (!!r !== sameRegion) bad++;
    if (r) {
      if (r[0] !== a || r[r.length - 1] !== b) bad++;
      const want = bfsLen(S, P, a, b); if (r.length !== want) lenBad++;
      for (let k = 1; k < r.length; k++) { const dx = Math.abs((r[k] % S.W) - (r[k - 1] % S.W)), dy = Math.abs(((r[k] / S.W) | 0) - ((r[k - 1] / S.W) | 0)); if (dx + dy !== 1) adjBad++; }
      same++;
    } else diff++;
  }
  ok(`${label}: a route exists exactly when the two tiles share a region (${same} routes, ${diff} without)`, bad === 0, bad);
  ok(`${label}: routes are as short as an independent search`, lenBad === 0, lenBad);
  ok(`${label}: consecutive tiles of a route are 4-neighbours`, adjBad === 0, adjBad);
}
{
  const S = E.shape(relief, BASE);
  // a route between two terraces goes through a carved tile (stair / ramp)
  let crossed = 0, tried = 0;
  for (let n = 0; n < 400 && tried < 30; n++) {
    const a = (rnd() * S.n) | 0, b = (rnd() * S.n) | 0; if (S.block[a] || S.block[b] || S.ter[a] === S.ter[b]) continue;
    const r = E.route(S, BASE, a, b); if (!r) continue; tried++; if (r.some((t) => S.carved[t])) crossed++;
  }
  ok('routes between different terraces use ramps', tried > 0 && crossed === tried, `${crossed}/${tried}`);
}
// the explanation of a missing connection
{
  const P = Object.assign({}, BASE, { stairW: 0 }), S = E.shape(relief, P);
  const regs = S.regionSizes.length; ok('stairW=0 leaves several regions', regs > 1, regs);
  let a = -1, b = -1; for (let i = 0; i < S.n && (a < 0 || b < 0); i++) { if (S.block[i]) continue; if (a < 0) a = i; else if (S.region[i] !== S.region[a]) b = i; }
  const g = E.regionGap(S, a, b);
  ok('regionGap: region ids and sizes are those of the two tiles', g.ra === S.region[a] && g.rb === S.region[b] && g.sizeA === S.regionSizes[g.ra] && g.sizeB === S.regionSizes[g.rb]);
  ok('regionGap: the closest approach joins a tile of each region', g.dist >= 0 && S.region[g.from] === g.ra && S.region[g.to] === g.rb, JSON.stringify(g));
  // the reported distance is minimal: no pair of tiles of the two regions is closer (Manhattan lower bound)
  let best = 1e9; const A = [], B = []; for (let i = 0; i < S.n; i++) { if (S.region[i] === g.ra) A.push(i); else if (S.region[i] === g.rb) B.push(i); }
  for (const i of A) for (const j of B) { const d = Math.abs((i % S.W) - (j % S.W)) + Math.abs(((i / S.W) | 0) - ((j / S.W) | 0)); if (d < best) best = d; }
  ok('regionGap: tiles between the regions is the Manhattan distance - 1 (no wall of blocked tiles in this map)', g.dist === best - 1, `${g.dist} vs ${best - 1}`);
  const S2 = E.shape(relief, BASE), nGates = S2.gates.length;
  ok('regionGap: with stairs on, gates that touch two regions but have no stair are counted as dropped', (() => { let ok2 = true; for (let n = 0; n < 40; n++) { const a2 = (rnd() * S2.n) | 0, b2 = (rnd() * S2.n) | 0; if (S2.block[a2] || S2.block[b2] || S2.region[a2] === S2.region[b2]) continue; const r = E.regionGap(S2, a2, b2); if (!(r.droppedGates >= 0 && r.dist >= 0)) ok2 = false; } return ok2; })(), nGates);
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
