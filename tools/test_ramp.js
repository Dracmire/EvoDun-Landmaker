/* Tests for ramp-style gates (src/shape.js: planRamp, E.rampHeight). Run: node tools/test_ramp.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 2, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
const mk = (W, H, f) => {
  const el = new Float32Array(W * H); let mn = Infinity, mx = -Infinity;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  return { name: 't', width: W, height: H, elevation: el, elevRange: [mn, mx], masks: {}, markers: [], fields: {} };
};
const relief = mk(72, 56, (x, y) => 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3);
const EPS = 1e-6;

{
  const S = E.shape(relief, BASE), ramps = S.stairs.filter((r) => r.ramp);
  ok('ramps placed, style reported', ramps.length > 0 && ramps.length === S.stairs.length && S.stairInfo.style === 'ramp' && S.stairInfo.placed === ramps.length, JSON.stringify(S.stairInfo));
  ok('no bridge levels and base heights untouched in ramp mode', S.levelMeta.every((m) => !m.bridge) && S.levelH.every((h, L) => h === E.hOf(L, BASE)));
  ok('depth is FIXED (2 by default) whatever the jump; slope = jump / depth', ramps.every((r) => r.ramp.len === 2 && Math.abs(Math.abs(r.ramp.h1 - r.ramp.h0) / r.ramp.len - Math.abs(r.ramp.h1 - r.ramp.h0) / 2) < EPS), ramps.map((r) => r.ramp.len).join());
  { const Sp = E.shape(relief, Object.assign({}, BASE, { spread: 1.5, terraces: 12 })); ok('with spread 1.5 some ramps are steeper than the old 0.4 maximum (the slope is no longer limited)', Sp.stairs.some((r) => Math.abs(r.ramp.h1 - r.ramp.h0) / r.ramp.len > 0.4 + EPS) && Sp.stairs.every((r) => r.ramp.len === 2)); }
  ok('one step entry per tile of length, same tiles in every column', ramps.every((r) => r.steps.length === r.ramp.len && r.steps.every((s) => s.tiles.length === r.cols.length)));
  // surface: h0 at the gate edge, h1 at the far end, linear in between, constant across the width
  let surfBad = 0;
  for (const r of ramps) {
    const R = r.ramp, m = [R.mx, R.my];
    if (Math.abs(E.rampHeight(r, m[0], m[1]) - R.h0) > EPS) surfBad++;
    if (Math.abs(E.rampHeight(r, m[0] + R.pdx * R.len, m[1] + R.pdy * R.len) - R.h1) > EPS) surfBad++;
    const mid = E.rampHeight(r, m[0] + R.pdx * R.len / 2, m[1] + R.pdy * R.len / 2);
    if (Math.abs(mid - (R.h0 + R.h1) / 2) > EPS) surfBad++;
    if (Math.abs(E.rampHeight(r, m[0] - R.pdy * 0.9, m[1] + R.pdx * 0.9) - R.h0) > EPS) surfBad++; // across the width
  }
  ok('surface height: edge, far end, middle, across the width', surfBad === 0, surfBad);
  // the gate edge matches the low (cut) or the high (built up) neighbour, the far end the tile beyond
  let endBad = 0;
  for (const r of ramps) {
    const hT = (t) => S.levelH[S.fine[t]], R = r.ramp;
    if (r.mode === 'cut') { if (Math.abs(hT(r.site.a) - R.h0) > EPS || !(R.h1 > R.h0)) endBad++; if (Math.abs(hT(r.top[0]) - R.h1) > EPS) endBad++; }
    else { if (Math.abs(hT(r.top[0]) - R.h0) > EPS || !(R.h1 < R.h0)) endBad++; if (Math.abs(hT(r.bottom[0]) - R.h1) > EPS) endBad++; }
  }
  ok('cut: low edge = lower tile, far end = top tile; built up: high edge = upper tile, far end = bottom tile', endBad === 0, endBad);
  ok('cut footprints take the level of the low end (a hole in the slabs above); built-up ones keep theirs', ramps.every((r) => r.steps.every((s) => s.tiles.every((t) => (r.mode === 'cut' ? S.fine[t] === r.level : true)))) && S.byLevel.every((l, L) => l.every((i) => S.fine[i] === L)));
  // movement is unchanged: the ends of every ramp are in one region, footprints are carved and distinct
  ok('bottom and top of every ramp are in the same region', ramps.every((r) => r.bottom.every((b, c) => S.region[b] === S.region[r.top[c]])));
  const seen = new Set(); let dup = 0; for (const r of ramps) for (const s of r.steps) for (const t of s.tiles) { if (seen.has(t) || !S.carved[t]) dup++; seen.add(t); }
  ok('footprints are carved and do not overlap', dup === 0, dup);
  const A = E.stairSurvival(S, BASE, 'A'), B = E.stairSurvival(S, BASE, 'B');
  ok('footprint coverage is 100 % in A and B', A.coverage === 1 && B.coverage === 1 && A.lost === 0 && B.lost === 0, `${A.coverage} ${B.coverage}`);
}

// depth and width parameters
{
  const lens = (P) => E.shape(relief, P).stairs.map((r) => r.ramp.len);
  for (const d of [1, 2, 3, 4]) ok(`depth ${d}: every ramp is ${d} tiles deep`, lens(Object.assign({}, BASE, { rampDepth: d })).length > 0 && lens(Object.assign({}, BASE, { rampDepth: d })).every((l) => l === d));
  const SD = E.shape(relief, Object.assign({}, BASE, { rampDepth: 4 })), S1 = E.shape(relief, Object.assign({}, BASE, { rampDepth: 1 }));
  const slope = (r) => Math.abs(r.ramp.h1 - r.ramp.h0) / r.ramp.len;
  ok('a shallower ramp is steeper', S1.stairs.length > 0 && S1.stairs.reduce((a, r) => a + slope(r), 0) / S1.stairs.length > SD.stairs.reduce((a, r) => a + slope(r), 0) / SD.stairs.length);
  for (const w of [1, 2, 3, 4, 5]) {
    const S = E.shape(relief, Object.assign({}, BASE, { stairW: w })), cols = S.stairs.map((r) => r.cols.length);
    ok(`width ${w}: at most ${w} contiguous columns, requested ${w}`, S.stairs.length > 0 && S.stairs.every((r) => r.cols.length >= 1 && r.cols.length <= w && r.requested === w && r.cols.every((c, i) => i === 0 || c === r.cols[i - 1] + 1) && r.cols.includes(0)), cols.join(''));
  }
  const W5 = E.shape(relief, Object.assign({}, BASE, { stairW: 5 })), W3 = E.shape(relief, BASE);
  ok('width 5 gives wider ramps than width 3 on average', W5.stairs.reduce((a, r) => a + r.cols.length, 0) / W5.stairs.length > W3.stairs.reduce((a, r) => a + r.cols.length, 0) / W3.stairs.length);
  ok('a ramp can be wider than the gate tiles it sits on (it spans more wall than the gate)', W5.stairs.some((r) => { const g = new Set(); for (const gt of W5.gates) for (const t of gt.tiles) { g.add(t.a); g.add(t.b); } return r.cols.some((c, ci) => { const t = r.mode === 'cut' ? r.bottom[ci] : r.top[ci]; return !g.has(t); }); }));
  ok('width 5 uses offsets -2..2 (both sides reach two columns somewhere)', W5.stairs.some((r) => r.cols.includes(-2)) && W5.stairs.some((r) => r.cols.includes(2)) && W5.stairs.every((r) => r.cols.every((c) => c >= -2 && c <= 2)));
  { let badCol = 0; const hOf = (S, t) => S.levelH[S.fine[t]];
    for (const r of W5.stairs) r.cols.forEach((c, ci) => {
      const tilesCol = r.steps.map((st) => st.tiles[ci]);
      const pathTer = r.mode === 'cut' ? W5.ter[r.top[ci]] : W5.ter[r.bottom[ci]], fixTer = r.mode === 'cut' ? W5.ter[r.bottom[ci]] : W5.ter[r.top[ci]];
      if (pathTer !== fixTer + 1 && !(r.mode === 'fill' && W5.ter[r.top[ci]] === W5.ter[r.bottom[ci]] + 1)) badCol++;
    }); ok('every column of every ramp joins terrace t (low end) and t + 1 (top)', badCol === 0, badCol); }
  // all columns of a ramp lie on the SAME border: low end on the lower terrace, path on the upper terrace
  let off = 0; for (const r of W5.stairs) for (let ci = 0; ci < r.cols.length; ci++) { const lowT = r.mode === 'cut' ? r.bottom[ci] : r.steps[0].tiles[ci], upT = r.mode === 'cut' ? r.top[ci] : r.top[ci]; if (W5.ter[r.mode === 'cut' ? r.bottom[ci] : r.bottom[ci]] + 1 !== W5.ter[r.top[ci]] && W5.ter[r.bottom[ci]] !== W5.ter[r.top[ci]] - 1) off++; }
  ok('every column joins the same two terraces (low end terrace t, top terrace t + 1)', off === 0, off);
  ok('width 3 and 5 keep the regions of the previous widths (every ramp connects its ends)', W5.stairs.every((r) => r.bottom.every((b, c) => W5.region[b] === W5.region[r.top[c]])));
}

// stairW = 0: nothing is carved, the map keeps its levels; style 0 still gives treads with bridge levels
{
  const S0 = E.shape(relief, Object.assign({}, BASE, { stairW: 0 }));
  ok('stairW=0: no stairs, nothing carved, levels untouched', S0.stairs.length === 0 && S0.carved.every((v) => !v) && S0.fine.every((L, i) => L === S0.ter[i] * S0.subs + S0.sub[i]));
  const Ss = E.shape(relief, Object.assign({}, BASE, { stairStyle: 0 }));
  ok('steps style is still available (treads, bridge levels)', Ss.stairs.length > 0 && Ss.stairs.every((r) => !r.ramp) && Ss.stairInfo.style === 'steps' && Ss.levelMeta.some((m) => m.bridge));
}

// a hand-built cut and a hand-built built-up case with known heights
{
  const P = { terraces: 2, subs: 1, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, smooth: 0, radius: 0, passGap: 8, climb: 1, stairW: 1, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 1 };
  const W = 20, H = 9, n = W * H, ter = new Int16Array(n), sub = new Int16Array(n), block = new Uint8Array(n), fine = new Int16Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ter[y * W + x] = x >= 9 ? 1 : 0; fine[y * W + x] = ter[y * W + x]; }
  const levelH = [E.hOf(0, P), E.hOf(1, P)], levelMeta = [{ ter: 0, sub: 0, bridge: false }, { ter: 1, sub: 0, bridge: false }];
  const mkS = (a, b) => ({ W, H, n, subs: 1, N: 2, ter: ter.slice(), sub: sub.slice(), fine: fine.slice(), maxFine: 1, levelH: levelH.slice(), levelMeta: levelMeta.slice(), block, water: new Array(n).fill(0), gates: [{}], passes: [{ a, b, gate: 0, kind: 'terrace', alts: [] }], byLevel: [] });
  const a = 4 * W + 8, b = 4 * W + 9, gap = levelH[1] - levelH[0];
  const Sc = mkS(a, b); E._carve(Sc, P); const rc = Sc.stairs[0];
  ok('hand-built: one ramp, gap known', !!rc && gap > 0, gap);
  if (rc) {
    ok('hand-built: length = depth (2) whatever the gap', rc.ramp.len === 2, `${rc.ramp.len} for gap ${gap}`);
    ok('hand-built: heights go from the lower to the upper terrace', Math.abs(rc.ramp.h0 - levelH[0]) < EPS && Math.abs(rc.ramp.h1 - levelH[1]) < EPS);
    ok('hand-built: footprint tiles are in the upper terrace and take the lower level', rc.steps.every((s) => s.tiles.every((t) => Sc.ter[t] === 1 && Sc.fine[t] === 0)));
  }
  { const Sw = mkS(a, b); Sw.block = Sw.block.slice(); Sw.block[5 * W + 9] = 1; // column +1 is blocked: columns +2 must not be used across the gap
    E._carve(Sw, Object.assign({}, P, { stairW: 5 }));
    ok('hand-built: a blocked column stops its side (no column +1 or +2), the other side widens', Sw.stairs.length === 1 && Sw.stairs[0].cols.join() === '-2,-1,0' && Sw.stairInfo.narrowed === 1, JSON.stringify(Sw.stairs.map((r) => r.cols))); }
  const Sh = mkS(a, b); E._carve(Sh, Object.assign({}, P, { rampDepth: 4 }));
  ok('hand-built: depth 4 gives a 4 tile ramp with slope gap / 4', Sh.stairs.length === 1 && Sh.stairs[0].ramp.len === 4 && Math.abs((Sh.stairs[0].ramp.h1 - Sh.stairs[0].ramp.h0) / 4 - gap / 4) < EPS);
}

// a tile of the footprint that is lower than the surface cannot be cut (it would have to be raised)
{
  const P = { terraces: 2, subs: 3, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, smooth: 0, radius: 0, passGap: 8, climb: 2, stairW: 1, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 1 };
  const W = 20, H = 9, n = W * H;
  const mkS = (dipSub) => {
    const ter = new Int16Array(n), sub = new Int16Array(n), fine = new Int16Array(n), block = new Uint8Array(n);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; ter[i] = x >= 9 ? 1 : 0; sub[i] = 2; if (x === 10 && y === 4) sub[i] = dipSub; fine[i] = ter[i] * 3 + sub[i]; }
    for (let y = 0; y < H; y++) for (let x = 0; x < 2; x++) block[y * W + x] = 1;   // no room to build up the lower terrace
    const levelH = [], levelMeta = []; for (let L = 0; L < 6; L++) { levelH.push(E.hOf(L, P)); levelMeta.push({ ter: Math.floor(L / 3), sub: L % 3, bridge: false }); }
    return { W, H, n, subs: 3, N: 2, ter, sub, fine, maxFine: 5, levelH, levelMeta, block, water: new Array(n).fill(0), gates: [{}], passes: [{ a: 4 * W + 8, b: 4 * W + 9, gate: 0, kind: 'terrace', alts: [] }], byLevel: [] };
  };
  const c = mkS(2); E._carve(c, P);
  ok('control: flat upper terrace, the ramp is cut', c.stairs.length === 1 && c.stairs[0].mode === 'cut', JSON.stringify(c.stairInfo));
  const d = mkS(0); E._carve(d, P);
  ok('a footprint tile lower than the surface is not cut', d.stairs.length === 0 || d.stairs[0].mode !== 'cut', JSON.stringify(d.stairInfo));
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
