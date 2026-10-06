/* Tests for ramp-style gates (src/shape.js: planRamp, E.rampHeight). Run: node tools/test_ramp.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 2, stairStyle: 1, rampSlope: 0.4, rampMin: 2, gateThr: 0.05, gateMin: 3 };
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
  ok('length >= minimum, slope <= maximum', ramps.every((r) => r.ramp.len >= BASE.rampMin && Math.abs(r.ramp.h1 - r.ramp.h0) / r.ramp.len <= BASE.rampSlope + EPS), ramps.map((r) => Math.abs(r.ramp.h1 - r.ramp.h0) / r.ramp.len).filter((s) => s > BASE.rampSlope).join());
  ok('length is the shortest that respects the slope (or the minimum)', ramps.every((r) => r.ramp.len === BASE.rampMin || Math.abs(r.ramp.h1 - r.ramp.h0) / (r.ramp.len - 1) > BASE.rampSlope - EPS));
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

// slope and minimum length parameters
{
  const lens = (P) => E.shape(relief, P).stairs.map((r) => r.ramp.len);
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const gentle = Object.assign({}, BASE, { rampSlope: 0.2 }), steep = Object.assign({}, BASE, { rampSlope: 0.8 });
  const Sg = E.shape(relief, gentle);
  ok('a gentler maximum slope gives longer ramps and respects it', Sg.stairs.length > 0 && mean(lens(gentle)) > mean(lens(BASE)) && Sg.stairs.every((r) => Math.abs(r.ramp.h1 - r.ramp.h0) / r.ramp.len <= 0.2 + EPS));
  ok('a steeper one gives shorter ramps', mean(lens(steep)) < mean(lens(BASE)));
  const Pm = Object.assign({}, BASE, { rampMin: 4 });
  ok('minimum length is respected', E.shape(relief, Pm).stairs.every((r) => r.ramp.len >= 4));
  ok('width 1 gives single-column ramps, width 3 up to three', E.shape(relief, Object.assign({}, BASE, { stairW: 1 })).stairs.every((r) => r.cols.length === 1) && E.shape(relief, Object.assign({}, BASE, { stairW: 3 })).stairs.every((r) => r.cols.length <= 3));
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
  const P = { terraces: 2, subs: 1, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, smooth: 0, radius: 0, passGap: 8, climb: 1, stairW: 1, stairStyle: 1, rampSlope: 0.4, rampMin: 2, gateThr: 0.05, gateMin: 1 };
  const W = 20, H = 9, n = W * H, ter = new Int16Array(n), sub = new Int16Array(n), block = new Uint8Array(n), fine = new Int16Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ter[y * W + x] = x >= 9 ? 1 : 0; fine[y * W + x] = ter[y * W + x]; }
  const levelH = [E.hOf(0, P), E.hOf(1, P)], levelMeta = [{ ter: 0, sub: 0, bridge: false }, { ter: 1, sub: 0, bridge: false }];
  const mkS = (a, b) => ({ W, H, n, subs: 1, N: 2, ter: ter.slice(), sub: sub.slice(), fine: fine.slice(), maxFine: 1, levelH: levelH.slice(), levelMeta: levelMeta.slice(), block, water: new Array(n).fill(0), gates: [{}], passes: [{ a, b, gate: 0, kind: 'terrace', alts: [] }], byLevel: [] });
  const a = 4 * W + 8, b = 4 * W + 9, gap = levelH[1] - levelH[0];
  const Sc = mkS(a, b); E._carve(Sc, P); const rc = Sc.stairs[0];
  ok('hand-built: one ramp, gap known', !!rc && gap > 0, gap);
  if (rc) {
    ok('hand-built: length = ceil(gap / slope)', rc.ramp.len === Math.max(2, Math.ceil(gap / 0.4 - 1e-9)), `${rc.ramp.len} for gap ${gap}`);
    ok('hand-built: heights go from the lower to the upper terrace', Math.abs(rc.ramp.h0 - levelH[0]) < EPS && Math.abs(rc.ramp.h1 - levelH[1]) < EPS);
    ok('hand-built: footprint tiles are in the upper terrace and take the lower level', rc.steps.every((s) => s.tiles.every((t) => Sc.ter[t] === 1 && Sc.fine[t] === 0)));
  }
  const Sh = mkS(a, b); E._carve(Sh, Object.assign({}, P, { rampSlope: 1.0, rampMin: 1 }));
  ok('hand-built: with slope 1.0 and minimum 1 the ramp is 1 tile long', Sh.stairs.length === 1 && Sh.stairs[0].ramp.len === Math.ceil(gap / 1.0 - 1e-9));
}

// a tile of the footprint that is lower than the surface cannot be cut (it would have to be raised)
{
  const P = { terraces: 2, subs: 3, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, smooth: 0, radius: 0, passGap: 8, climb: 2, stairW: 1, stairStyle: 1, rampSlope: 0.4, rampMin: 2, gateThr: 0.05, gateMin: 1 };
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
