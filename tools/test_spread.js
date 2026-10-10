/* Tests for the non-uniform height scale (Height spread). Run: node tools/test_spread.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const BASE = { terraces: 12, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 2, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
const mk = (W, H, f, range) => {
  const el = new Float32Array(W * H); let mn = Infinity, mx = -Infinity;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = el[y * W + x] = f(x, y); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  return { name: 't', width: W, height: H, elevation: el, elevRange: range || [mn, mx], masks: {}, markers: [], fields: {} };
};
const EPS = 1e-9;

// formula
{
  const P = Object.assign({}, BASE, { spread: 1.5 }), c = 6;
  const up = [6, 7, 8, 9, 10].map((j) => E.terGap(j, P, c)), down = [5, 4, 3, 2, 1].map((j) => E.terGap(j, P, c));
  ok('gaps above the centre: 1, 1.5, 2.5, 4, 6 (T(d) = (d - 1) * d / 2, no cap: the user\'s extreme-heights rule; it was 1, 1.5, 2.5, 2.5, 2.5 capped from distance 3)', up.every((g, i) => Math.abs(g - [1, 1.5, 2.5, 4, 6][i]) < EPS), up.join());
  ok('gaps below the centre: the same, mirrored', down.every((g, i) => Math.abs(g - [1, 1.5, 2.5, 4, 6][i]) < EPS), down.join());
  ok('base(t) is the sum of the gaps, base(0) = 0', Math.abs(E.terBase(0, P, c)) < EPS && Math.abs(E.terBase(9, P, c) - ([0, 1, 2, 3, 4, 5].map((j) => E.terGap(j, P, c)).reduce((a, b) => a + b, 0) + [6, 7, 8].map((j) => E.terGap(j, P, c)).reduce((a, b) => a + b, 0))) < EPS);
  const u = Object.assign({}, BASE, { spread: 1 });
  ok('spread 1 (or no centre): uniform, t * terH, bit for bit', [0, 3, 11].every((t) => E.terBase(t, u, 6) === t * 1 && E.terBase(t, P, undefined) === t * 1) && E.hOf(7, u, 6) === E.hOf(7, BASE), E.hOf(7, u, 6));
  const big = Object.assign({}, BASE, { spread: 2 });
  ok('another spread: gap = terH * (1 + (s-1) * T)', [0, 1, 2].every((k) => Math.abs(E.terGap(6 + k, big, 6) - (1 + [0, 1, 3][k])) < EPS));
  ok('terH scales every gap', Math.abs(E.terGap(7, Object.assign({}, P, { terH: 2 }), 6) - 3) < EPS);
}

// whole-map shape: the central terrace comes from the whole map, never from the slice
const relief = mk(96, 72, (x, y) => 100 + 800 * (0.5 + 0.5 * Math.sin(x / 11) * Math.cos(y / 8)));
{
  const P1 = BASE, S1 = E.shape(relief, P1), Pu = Object.assign({}, BASE, { spread: 1 }), Su = E.shape(relief, Pu);
  ok('spread 1 (default, absent): same levels, stairs and fine as before', JSON.stringify(S1.levelH) === JSON.stringify(Su.levelH) && JSON.stringify(S1.fine) === JSON.stringify(Su.fine) && JSON.stringify(S1.stairs) === JSON.stringify(Su.stairs));
  const cnt = new Array(12).fill(0); for (const t of E.quantize(relief, BASE).ter) cnt[t]++;
  const want = cnt.indexOf(Math.max(...cnt));
  const Sp = E.shape(relief, Object.assign({}, BASE, { spread: 1.5 }));
  ok('central terrace = the most populated one of the whole map', Sp.center === want, `${Sp.center} vs ${want}`);
  relief.fields = { zone: { ids: Int32Array.from({ length: 96 * 72 }, (_, i) => ((i % 96) < 24 ? 1 : 2)), amb: new Uint8Array(96 * 72), info: { classes: [], outside: 0, ambiguous: {} } } };
  const Sz = E.shape(relief, Object.assign({}, BASE, { spread: 1.5 }), { zones: [1], margin: 4 });
  ok('with a slice the centre is still the one of the whole map', Sz.center === want, `${Sz.center} vs ${want}`);
  const zc = new Array(12).fill(0); for (let i = 0; i < Sz.n; i++) if (Sz.slice[i]) zc[Sz.ter[i]]++;
  ok('(control) the slice alone would have another most populated terrace', zc.indexOf(Math.max(...zc)) !== want);
  // levels: strictly increasing, base heights follow terBase
  ok('levels strictly increasing; level heights follow terBase + sub * subH', Sp.levelH.every((h, L) => L === 0 || h > Sp.levelH[L - 1]) && Sp.levelH.every((h, L) => Math.abs(h - E.hOf(L, Object.assign({}, BASE, { spread: 1.5 }), Sp.center)) < EPS || Sp.levelMeta[L].bridge));
}

// spreadCentre: 'largest' (default) is today's rule; 'middle' = floor((terraces - 1) / 2), whatever the map
{
  const Pm = Object.assign({}, BASE, { spread: 1.5, spreadCentre: 'middle' }), Sm = E.shape(relief, Pm), Sd = E.shape(relief, Object.assign({}, BASE, { spread: 1.5 })), Sl = E.shape(relief, Object.assign({}, BASE, { spread: 1.5, spreadCentre: 'largest' }));
  ok("spreadCentre 'middle': the centre is floor((terraces - 1) / 2)", Sm.center === Math.floor((BASE.terraces - 1) / 2), Sm.center);
  ok("spreadCentre absent = 'largest' (same levels, no pixel change)", JSON.stringify(Sd.levelH) === JSON.stringify(Sl.levelH) && Sd.center === Sl.center);
  const P5 = Object.assign({}, BASE, { terraces: 7, spread: 1.5, spreadCentre: 'middle' }), S7 = E.shape(relief, P5);
  ok("middle, 7 terraces: centre 3, jumps 2.5, 1.5, 1, 1, 1.5, 2.5 (symmetric around the centre)", S7.center === 3 && [2.5, 1.5, 1, 1, 1.5, 2.5].every((g, j) => Math.abs(E.terGap(j, P5, S7.center) - g) < EPS), S7.center);
  ok("middle: spread 1 changes nothing", JSON.stringify(E.shape(relief, Object.assign({}, BASE, { spreadCentre: 'middle' })).levelH) === JSON.stringify(E.shape(relief, BASE).levelH));
}

// ramps and sub-terraces with uneven jumps
for (const [subs, climb] of [[1, 1], [3, 2], [6, 2], [6, 5]]) {
  const P = Object.assign({}, BASE, { spread: 1.5, subs, climb }), S = E.shape(relief, P), s = E.subHeight(P);
  const gaps = []; for (let t = 0; t + 1 < 12; t++) { const lastSub = E.terBase(t, P, S.center) + (subs - 1) * s; gaps.push(E.terBase(t + 1, P, S.center) - lastSub); }
  ok(`subs ${subs} climb ${climb}: the gap from the last sub-terrace to the next terrace stays above climb*subH in every jump`, gaps.every((g) => g > climb * s - EPS), gaps.map((g) => g.toFixed(2)).join());
  ok(`subs ${subs} climb ${climb}: ramps placed, all 2 tiles deep whatever the jump`, S.stairs.length > 0 && S.stairs.every((r) => r.ramp && r.ramp.len === 2), JSON.stringify(S.stairInfo));
  ok(`subs ${subs} climb ${climb}: regions connect through ramps`, S.stairs.every((r) => r.bottom.every((b, c) => S.region[b] === S.region[r.top[c]])));
}
{
  const P = Object.assign({}, BASE, { spread: 1.5 }), S = E.shape(relief, P), maxLen = Math.max(...S.stairs.map((r) => r.ramp.len));
  ok('with spread 1.5 the ramps are still 2 tiles deep (steeper), never the 7 of the slope-limited ramps', maxLen === 2, maxLen);
  const P3 = Object.assign({}, BASE, { spread: 3 }), S3 = E.shape(relief, P3);
  ok('spread 3 (jump 7): ramps are placed and still 2 tiles deep', S3.stairs.length > 0 && S3.stairs.every((r) => r.ramp.len === 2) && Math.max(...S3.stairs.map((r) => Math.abs(r.ramp.h1 - r.ramp.h0))) > 5, JSON.stringify(S3.stairInfo));
  const Ps = Object.assign({}, BASE, { spread: 1.5, stairStyle: 0 }), Ss = E.shape(relief, Ps);
  ok('steps style with uneven jumps: stairs placed, bridge levels, strictly increasing levels', Ss.stairs.length > 0 && Ss.levelH.every((h, L) => L === 0 || h > Ss.levelH[L - 1]) && Ss.levelMeta.some((m) => m.bridge));
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
