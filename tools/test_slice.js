/* Tests for the slice (src/shape.js): window, global elevation range, movement, border.
   Run: node tools/test_slice.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const P = { terraces: 5, micro: 3, terH: 1, microH: 0.22, minPlateau: 5, minMicro: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2 };

/* 72x56 map: smooth relief, 3 vertical zones (1: x<24, 2: 24..47, 3: >=48), outside ring of 2 tiles (0),
   unassigned pixels (-1): one hole inside zone 2, one on the 2|3 border, a 3x3 block in zone 3 */
const W = 72, H = 56, n = W * H;
const elevation = new Float32Array(n), ids = new Int32Array(n), amb = new Uint8Array(n);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  elevation[i] = 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3;
  ids[i] = x < 2 || y < 2 || x >= W - 2 || y >= H - 2 ? 0 : x < 24 ? 1 : x < 48 ? 2 : 3;
}
const hole = 30 * W + 35, border = 20 * W + 47, block = [40, 41, 42].flatMap((y) => [60, 61, 62].map((x) => y * W + x));
ids[hole] = -1; ids[border] = -1; for (const i of block) ids[i] = -1;
for (let i = 0; i < n; i++) if (ids[i] < 0) amb[i] = 1;
let emin = Infinity, emax = -Infinity; for (const v of elevation) { emin = Math.min(emin, v); emax = Math.max(emax, v); }
const classes = [1, 2, 3].map((id) => ({ id, count: 0, hue: id / 4 }));
const mkPack = (withRange = true) => ({ name: 't', width: W, height: H, elevation, elevRange: withRange ? [emin, emax] : undefined, masks: {}, markers: [{ x: 30, y: 30, code: 'A', label: 'in' }, { x: 5, y: 5, code: 'B', label: 'far' }], fields: { zone: { ids, amb, info: { classes, mode: 'maxnode', maxnode: 3, outside: 0, ambiguous: {} } } } });

// 1. whole map: no slice, nothing blocked beyond water
{
  const S = E.shape(mkPack(), P);
  ok('whole map: no slice, window = map', S.slice === null && S.W === W && S.H === H && S.ox === 0 && S.oy === 0 && S.border === null && S.sliceLoops === null);
}
// 2. slice of zone 2
const spec = { zones: [2], margin: 8 };
const S1 = E.shape(mkPack(), P, spec), full = E.shape(mkPack(), P);
const filled = E.fillUnassigned(ids, W, H);
{
  ok('window = zone bbox + margin, clipped to the map', S1.ox === 16 && S1.oy === 0 && S1.W === 40 && S1.H === 56, `ox ${S1.ox} oy ${S1.oy} W ${S1.W} H ${S1.H}`);
  let want = 0, bad = 0;
  for (let y = 0; y < S1.H; y++) for (let x = 0; x < S1.W; x++) {
    const mi = (y + S1.oy) * W + x + S1.ox, inZ = filled[mi] === 2; want += inZ ? 1 : 0;
    if ((S1.slice[y * S1.W + x] === 1) !== inZ) bad++;
  }
  ok('slice mask = zone 2 (with -1 filled by neighbours)', bad === 0, bad + ' tiles differ');
  ok('sliceInfo tiles matches the mask', S1.sliceInfo.tiles === want, S1.sliceInfo.tiles + ' vs ' + want);
  const wi = (mx, my) => (my - S1.oy) * S1.W + (mx - S1.ox);
  ok('hole inside zone 2 is in the slice (no hole)', S1.slice[wi(35, 30)] === 1);
  ok('unassigned pixel on the 2|3 border is decided by its neighbours', S1.slice[wi(47, 20)] === (filled[border] === 2 ? 1 : 0), 'filled=' + filled[border]);
  ok('block of -1 in zone 3 stays out of the zone 2 slice', block.every((i) => S1.ox <= (i % W) && (i % W) < S1.ox + S1.W ? S1.slice[wi(i % W, (i / W) | 0)] === 0 : true));
  ok('markers: shifted into the window, others dropped', S1.markers.length === 1 && S1.markers[0].x === 30 - S1.ox && S1.markers[0].y === 30 - S1.oy);
}
// 3. terraces do not depend on the window or on the zone (global range), unlike the legacy per-window range
{
  let diff = 0, tiles = 0;
  for (let y = 0; y < S1.H; y++) for (let x = 0; x < S1.W; x++) {
    if (!S1.slice[y * S1.W + x]) continue; tiles++;
    if (S1.fine[y * S1.W + x] !== full.fine[(y + S1.oy) * W + x + S1.ox]) diff++;
  }
  ok('terraces/micro steps inside the slice == full-map shaping', diff === 0, diff + ' of ' + tiles + ' differ');
  const noRange = E.shape(mkPack(false), P, spec); let d2 = 0;
  for (let y = 0; y < noRange.H; y++) for (let x = 0; x < noRange.W; x++) if (noRange.slice[y * noRange.W + x] && noRange.fine[y * noRange.W + x] !== full.fine[(y + noRange.oy) * W + x + noRange.ox]) d2++;
  ok('control: without elevRange the window changes the terraces (what the global range fixes)', d2 > 0, d2);
  // zone border is not a terrace edge: the shaping ignores zone ids entirely
  const other = mkPack(); other.fields.zone.ids = new Int32Array(n).fill(1);
  const noZones = E.shape(other, P); ok('zone ids do not influence levels', noZones.fine.every((v, i) => v === full.fine[i]));
}
// 4. movement restricted to the slice
{
  const wi = (S, i) => [i % S.W, (i / S.W) | 0];
  let out = 0; for (const p of S1.passes) for (const t of [p.a, p.b]) if (!S1.slice[t]) out++;
  ok('no stair pass touches a tile outside the slice', S1.passes.length > 0 && out === 0, out);
  let reg = 0, sum = 0; for (let i = 0; i < S1.n; i++) { if (S1.region[i] >= 0) { sum++; if (!S1.slice[i]) reg++; } }
  ok('walkable regions only inside the slice', reg === 0 && sum === S1.sliceInfo.tiles, `outside ${reg}, walkable ${sum}, slice ${S1.sliceInfo.tiles}`);
  ok('regionSizes add up to the walkable tiles', S1.regionSizes.reduce((a, b) => a + b, 0) === sum);
  ok('full map still has passes on both sides of the old border', full.passes.length > S1.passes.length);
}
// 5. border bits and loops agree with an independent perimeter count
{
  let edges = 0, bad = 0;
  for (let y = 0; y < S1.H; y++) for (let x = 0; x < S1.W; x++) {
    const i = y * S1.W + x, ins = (xx, yy) => xx >= 0 && yy >= 0 && xx < S1.W && yy < S1.H && S1.slice[yy * S1.W + xx] === 1;
    const want = S1.slice[i] ? (ins(x, y - 1) ? 0 : 1) | (ins(x + 1, y) ? 0 : 2) | (ins(x, y + 1) ? 0 : 4) | (ins(x - 1, y) ? 0 : 8) : 0;
    if (S1.border[i] !== want) bad++;
    for (let b = 0; b < 4; b++) if (want >> b & 1) edges++;
  }
  ok('border bits = faces looking outside the slice', bad === 0, bad);
  let len = 0; for (const loop of S1.sliceLoops) for (let k = 0; k < loop.length; k++) { const a = loop[k], b = loop[(k + 1) % loop.length]; len += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); }
  ok('loops total length == number of border faces', len === edges, `${len} vs ${edges}`);
}
// 6. zone touching the map edge: window clipped, border on the map edge
{
  const S = E.shape(mkPack(), P, { zones: [1], margin: 6 });
  ok('zone 1: window clipped at the map edge', S.ox === 0 && S.oy === 0 && S.W === 24 + 6 && S.H === 56);
  const first = S.border[2 * S.W + 2];
  ok('slice touching window edge has border bits there (outside ring tiles are not zone 1)', first !== 0);
}
// 7. crop rectangle intersects the zones; rect alone works; margin 0
{
  const S = E.shape(mkPack(), P, { zones: [2], rect: [30, 10, 40, 20], margin: 0 });
  ok('zone ∩ rect', S.W === 10 && S.H === 10 && S.sliceInfo.tiles === 100 && S.ox === 30 && S.oy === 10, `${S.W}x${S.H} tiles ${S.sliceInfo.tiles}`);
  const R = E.shape(mkPack(), P, { rect: [5, 5, 15, 25], margin: 2 });
  ok('rect only (no zone field needed)', R.sliceInfo.tiles === 200 && R.ox === 3 && R.oy === 3 && R.W === 14 && R.H === 24, `${R.W}x${R.H}`);
  const bare = { name: 'x', width: 4, height: 4, elevation: new Float32Array(16), masks: {}, markers: [], fields: {} };
  ok('rect on a pack without fields', E.shape(bare, P, { rect: [0, 0, 2, 2], margin: 0 }).sliceInfo.tiles === 4);
}
// 8. errors
{
  const msg = (f) => { try { f(); return ''; } catch (e) { return e.message; } };
  ok('empty slice message', /slice is empty/.test(msg(() => E.shape(mkPack(), P, { zones: [99] }))));
  ok('empty by rect', /slice is empty/.test(msg(() => E.shape(mkPack(), P, { zones: [1], rect: [60, 0, 70, 10] }))));
  const bare = { name: 'x', width: 4, height: 4, elevation: new Float32Array(16), masks: {}, markers: [], fields: {} };
  ok('zones without a zone field', /no zone field/.test(msg(() => E.shape(bare, P, { zones: [1] }))));
  ok('spec with only a margin = whole map', E.shape(mkPack(), P, { margin: 5 }).slice === null);
}
// 9. contiguity warning (4-neighbour), level counts inside the slice
{
  const W2 = 20, H2 = 10, ids2 = new Int32Array(W2 * H2);
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) ids2[y * W2 + x] = x < 6 ? 1 : 2;
  for (let y = 0; y < H2; y++) for (let x = 14; x < 20; x++) ids2[y * W2 + x] = 3;                // zone 3 on the right
  for (const [x, y] of [[17, 2], [18, 2], [17, 3], [18, 3]]) ids2[y * W2 + x] = 2;                // 4-tile island of zone 2 inside zone 3
  ids2[9 * W2 + 19] = 4; ids2[8 * W2 + 18] = 4;                                                    // zone 4: two tiles touching only by a corner
  const el2 = new Float32Array(W2 * H2).map((_, i) => i % W2);
  const p2 = { name: 'c', width: W2, height: H2, elevation: el2, masks: {}, markers: [], fields: { zone: { ids: ids2, amb: new Uint8Array(W2 * H2), info: { classes: [], outside: 0, ambiguous: {} } } } };
  const pc = E.zonePieces(p2);
  const count = (id) => ids2.reduce((a, v) => a + (v === id ? 1 : 0), 0);
  ok('zone 1 is one piece', pc.get(1).pieces === 1 && pc.get(1).total === 6 * H2);
  ok('zone 2: main body + 4-tile island = 2 pieces, largest = total - 4', pc.get(2).pieces === 2 && pc.get(2).largest === count(2) - 4 && pc.get(2).total === count(2), JSON.stringify(pc.get(2)));
  ok('zone 4: corner contact is not contiguous (2 pieces of 1)', pc.get(4).pieces === 2 && pc.get(4).largest === 1);
  const w = (z) => E.shape(p2, P, { zones: z, margin: 2 }).sliceInfo.warnings;
  ok('contiguous zone: no warning', w([1]).length === 0);
  ok('split zone: warning with pieces and the largest piece', w([2]).length === 1 && /Zone 2 is not contiguous/.test(w([2])[0]) && /2 pieces/.test(w([2])[0]) && new RegExp(`largest has ${count(2) - 4} of ${count(2)} tiles`).test(w([2])[0]), w([2])[0]);
  ok('only selected zones are checked', w([1, 4]).length === 1 && /Zone 4/.test(w([1, 4])[0]));
  ok('the slice is not corrected (the island tiles are in the slice)', E.shape(p2, P, { zones: [2], margin: 0 }).sliceInfo.tiles === count(2));
  const Sg = E.shape(mkPack(), P, { zones: [2], margin: 8 });
  let t = new Set(), f = new Set(); for (let i = 0; i < Sg.n; i++) if (Sg.slice[i]) { t.add(Sg.ter[i]); f.add(Sg.fine[i]); }
  ok('levelCount counts only tiles inside the slice', Sg.levelCount.terraces === t.size && Sg.levelCount.levels === f.size && Sg.levelCount.levels <= new Set(Sg.fine).size, JSON.stringify(Sg.levelCount));
  const P24 = Object.assign({}, P, { terraces: 24 }), S24 = E.shape(mkPack(), P24, { zones: [2], margin: 8 });
  ok('24 terraces: shaping works, levels grow', S24.levelCount.terraces > Sg.levelCount.terraces && S24.levelCount.terraces <= 24 && S24.levelCount.levels <= 72, JSON.stringify(S24.levelCount));
  ok('whole map level count', E.shape(mkPack(), P).levelCount.terraces <= 5);
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
