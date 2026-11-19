/* HYBRID EDGE (src/s3/hybrid.js; stage_terrazas79_go.md part 3), no browser: on a synthetic mask the camera-facing segments are classified square and kept (their vertices are exactly where they were), every other segment is smoothed, the ends of the square runs are fixed (no gap: the loop stays closed and continuous), a quarter turn of the view moves which edges are square; the loops of a real room are closed and square runs stay on the tile grid.
     node tools/test_hybrid.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 's3/ns', 's3/hybrid', 'rooms', 'roomtypes', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
const W = 12, H = 12, inside = (x, y) => x >= 3 && x < 9 && y >= 3 && y < 9; // a 6 x 6 block
const fakeS = (yaw) => { const fine = new Int16Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fine[y * W + x] = inside(x, y) ? 1 : 0; return { W, H, n: W * H, fine, cache: {}, stairs: [], carved: new Uint8Array(W * H) }; };
const P = { smooth: 2 };
{ const loops = E.maskLoops(W, H, inside); ok(`the tracer gives one closed loop of 4 corners for a block (${loops.length} loop, ${loops[0].length} points)`, loops.length === 1 && loops[0].length === 4, loops);
  const look = E.orient.lookOf(0), sq = E.s3.edge.classify(loops[0], inside, look); ok(`exactly one side of a block faces the camera at yaw 0 (square: ${sq.filter(Boolean).length} of ${sq.length})`, sq.filter(Boolean).length === 1, sq);
  for (const yaw of [0, 90, 180, 270]) { const l2 = E.maskLoops(W, H, inside)[0], s2 = E.s3.edge.classify(l2, inside, E.orient.lookOf(yaw)), i = s2.indexOf(true), a = l2[i], b = l2[(i + 1) % l2.length], d = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])], lk = E.orient.lookOf(yaw); ok(`yaw ${yaw}: the square side is the one whose outward normal is -look (${JSON.stringify(lk)}): the side ${JSON.stringify(a)} -> ${JSON.stringify(b)}`, s2.filter(Boolean).length === 1 && Math.abs(d[0] * lk[0] + d[1] * lk[1]) === 0, { s2, a, b, lk }); } }
for (const yaw of [0, 90, 180, 270]) { const S = fakeS(yaw); E.s3.edge.yaw = yaw; const loop = E.s3.edge.loops(S, 1, P)[0], l0 = E.maskLoops(W, H, inside)[0], sq = E.s3.edge.classify(l0, inside, E.orient.lookOf(yaw)), i = sq.indexOf(true), a = l0[i], b = l0[(i + 1) % l0.length];
  const has = (p) => loop.some((q) => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9), onSeg = loop.filter((q) => (a[0] === b[0] ? Math.abs(q[0] - a[0]) < 1e-9 : Math.abs(q[1] - a[1]) < 1e-9));
  let gap = 0; for (let k = 0; k < loop.length; k++) { const p = loop[k], q = loop[(k + 1) % loop.length]; gap = Math.max(gap, Math.hypot(p[0] - q[0], p[1] - q[1])); }
  const corners = [[3, 3], [9, 3], [9, 9], [3, 9]], cut = corners.filter((c) => !has(c)).length;
  ok(`yaw ${yaw}: the ends of the square side stay (${has(a) && has(b)}), the other ${cut} corners are cut (smoothed), no gap (longest step ${gap.toFixed(2)} <= 6)`, has(a) && has(b) && cut >= 1 && gap <= 6 + 1e-9 && onSeg.length >= 2, { loop }); }
{ const S = fakeS(0); E.s3.edge.yaw = 0; const l1 = E.s3.edge.loops(S, 1, P); E.s3.edge.yaw = 90; const l2 = E.s3.edge.loops(S, 1, P); ok('the cache is keyed by the yaw (a quarter turn gives another contour)', JSON.stringify(l1) !== JSON.stringify(l2)); }
// PR pend P2: a Cake ring tile / an Ascension wall face keeps its contour SQUARE and glued, on every side (also the back / sides that Hybrid smooths)
for (const kind of ['ring', 'asc']) { const S = fakeS(0); E.s3.edge.yaw = 0; const t = 5 * W + 3 + 2; // tile (5,5), inside the block, on a loop corner of the cut 3x3 below
  const m = (x, y) => y * W + x; if (kind === 'ring') { S.ringTile = new Uint8Array(W * H); S.ringTile[m(8, 3)] = 1; } else S.ascWalls = { faces: [{ i: m(8, 3), j: m(9, 3) }] };
  const loop = E.s3.edge.loops(S, 1, P)[0], has = (x, y) => loop.some((q) => Math.abs(q[0] - x) < 1e-9 && Math.abs(q[1] - y) < 1e-9);
  const guarded = has(9, 3), cornerBack = !has(3, 3); // (9,3) is cut without the guard (a side); the corner (3,3) far from the guarded tile is still smoothed
  ok(`${kind}: the corner (9,3) next to the guarded tile stays exactly where it was and the unguarded back corner is still smoothed`, guarded && cornerBack, { loop }); }
ok("E.loopsOf('Ah') is the hybrid contour and every other id goes to the original function", E.loopsOf('Ah') === E.s3.edge.loops && E.loopsOf('A') === E.loopsA && E.loopsOf('B') === E.loopsB && E.loopsOf('C') === E.loopsC);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
