/* STAGE BORDERS, PR S2 (src/border.js, no browser): the rules of the border profiles ISLA and QUEBRADA outside the footprint of a window.
   - the profiles are in H, independent of tilesPerH (2, 2.5, 3), on the RELATIVE grid of 0.25 TH (added to the datum, the absolute height is not rounded);
   - the footprint is never touched, nor the interior (the tiles the closure K = 4 fills: a slot between rooms keeps its source height); walking, regions and blocks are identical on / off;
   - the camera side follows the REAL yaw (yaw 0: the camera is on the +y side, yaw 180: on the -y side);
   - an unknown type changes nothing (Off is the absence of the call: identical pixels are checked by tools/verify.sh regress).
   Each rule has a named MUTATION (a hook of opts.test) that must make its check FAIL.
     node tools/test_border.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['fields', 'shape', 'tech', 'rooms', 'roomtypes', 'border']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2 };
const W = 72, H = 56, n = W * H;
// zone 2 = a box x 24..47, y 14..41 with a SLOT of zone 1 (x 35..37, y 20..30: three tiles wide, a separator between two rooms); the elevation is CONSTANT (one terrace) so the datum is one height and the offsets are read exactly
const mk = (flat) => { const elevation = new Float32Array(n), ids = new Int32Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; elevation[i] = flat ? 400 : 100 + 600 * (0.5 + 0.5 * Math.sin(x / 9) * Math.cos(y / 7)) + x * 3; ids[i] = x >= 24 && x <= 47 && y >= 14 && y <= 41 ? (x >= 35 && x <= 37 && y >= 20 && y <= 30 ? 1 : 2) : (x < 2 || y < 2 || x >= W - 2 || y >= H - 2 ? 0 : 1); }
  return { name: 't', width: W, height: H, elevation, elevRange: [100, 700], masks: {}, markers: [], fields: { zone: { ids, amb: new Uint8Array(n), info: { classes: [{ id: 1, count: 0, hue: 0.25 }, { id: 2, count: 0, hue: 0.5 }], mode: 'maxnode', maxnode: 3, outside: 0, ambiguous: {} } } } }; };
const shape = (flat) => E.shape(mk(flat), P, { zones: [2], margin: 8 });
const hash = (S) => crypto.createHash('sha1').update(Buffer.from(S.fine.buffer, S.fine.byteOffset, S.fine.byteLength)).update(JSON.stringify(S.levelH)).update(Buffer.from(S.block)).update(Buffer.from(S.region ? Int32Array.from(S.region).buffer : new ArrayBuffer(0))).digest('hex');
const hAt = (S, x, y) => S.levelH[S.fine[y * S.W + x]];
const fpOf = (S) => { const f = new Uint8Array(S.n); for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i])) f[i] = 1; return f; };

const S0 = shape(true), L0 = hAt(S0, S0.W >> 1, 5), fp = fpOf(S0), nfp = fp.reduce((a, b) => a + b, 0);
ok('the test window has the box as footprint (672 tiles minus the slot)', nfp === 24 * 28 - 3 * 11, nfp);
// window coordinates of the box edges
const bx0 = 24 - S0.ox, bx1 = 47 - S0.ox, by0 = 14 - S0.oy, by1 = 41 - S0.oy, mx = (bx0 + bx1) >> 1;
const run = (flat, type, tph, yaw, test) => { const S = shape(flat); const b = E.border.apply(S, { type, tilesPerH: tph, yaw, test }); return { S, b }; };

// 1. profiles in H, independent of tilesPerH, on the relative grid of 0.25 TH
for (const tph of [2, 2.5, 3]) {
  const { S, b } = run(true, 'island', tph, 0), off = (x, y) => (hAt(S, x, y) - L0) / tph;
  ok(`ISLA tilesPerH ${tph}: water ring at -0.6 H (-0.7 TH floored to 0.25 TH = 0.2 H) near the footprint, 0 far away`, Math.abs(off(mx, by1 + 2) + 0.6) < 0.01 && Math.abs(off(mx, S.H - 1)) < 0.01 && b.water > 0, `${off(mx, by1 + 2)} ${off(mx, S.H - 1)}`);
  ok(`ISLA tilesPerH ${tph}: water tiles are flagged (meta.water) and every offset is a multiple of 0.2 H`, S.levelMeta[S.fine[(by1 + 2) * S.W + mx]].water === true && (() => { for (let i = 0; i < S.n; i++) { if (fp[i] || (S.void && S.void[i])) continue; const o = (S.levelH[S.fine[i]] - L0) / tph / 0.2; if (Math.abs(o - Math.round(o)) > 0.02) return false; } return true; })());
  const q0 = run(true, 'quebrada', tph, 0).S, o0 = (x, y) => (hAt(q0, x, y) - L0) / tph;
  ok(`QUEBRADA tilesPerH ${tph}, yaw 0: the far (north) side rises 1.2 H, the camera (south) side drops 3.6 H`, Math.abs(o0(mx, by0 - 4) - 1.2) < 0.01 && Math.abs(o0(mx, by1 + 4) + 3.6) < 0.01, `${o0(mx, by0 - 4)} ${o0(mx, by1 + 4)}`);
}
{ const { S } = run(true, 'quebrada', 2.5, 0, { tilesNotH: true }), o = (hAt(S, mx, by1 + 4) - L0) / 2.5;
  ok('MUTATION tilesNotH (the profile in tiles, not in H): the independence of tilesPerH FAILS', !(Math.abs(o + 3.6) < 0.01)); }
{ const { S } = run(true, 'island', 2, 0, { noGrid: true }), o = (hAt(S, mx, by1 + 2) - L0) / 2;
  ok('MUTATION noGrid (the offset not floored to the grid): the relative grid check FAILS', !(Math.abs(o + 0.6) < 0.01), o); }

// 2. the camera side follows the REAL yaw
{ const a = run(true, 'quebrada', 2, 0).S, b = run(true, 'quebrada', 2, 180).S, up = (S, y) => (hAt(S, mx, y) - L0) / 2;
  ok('yaw 0: the south edge (camera side) drops, the north edge rises', up(a, by1 + 4) < -3 && up(a, by0 - 4) > 1);
  ok('yaw 180: the north edge (camera side) drops, the south edge rises', up(b, by0 - 4) < -3 && up(b, by1 + 4) > 1);
  const c = run(true, 'quebrada', 2, 180, { ignoreYaw: true }).S;
  ok('MUTATION ignoreYaw (always +y): at yaw 180 the camera-side check FAILS', !(up(c, by0 - 4) < -3 && up(c, by1 + 4) > 1));
  const e = run(true, 'quebrada', 2, 90).S, w = run(true, 'quebrada', 2, 270).S, east = (S, x) => (hAt(S, x, (by0 + by1) >> 1) - L0) / 2;
  ok('yaw 90: the camera is on the +x side (east drops); yaw 270 on the -x side (west drops)', east(e, bx1 + 4) < -3 && east(e, bx0 - 4) > 1 && east(w, bx0 - 4) < -3 && east(w, bx1 + 4) > 1); }

// 3. footprint and interior untouched; walking identical on / off
for (const type of ['island', 'quebrada']) {
  const S = shape(false), before = hash(S), hb = Float64Array.from({ length: S.n }, (_, i) => S.levelH[S.fine[i]]), bl = Uint8Array.from(S.block), rg = S.region ? Int32Array.from(S.region) : null, cv = S.carved ? Uint8Array.from(S.carved) : null;
  const b = E.border.apply(S, { type, tilesPerH: 2, yaw: 180 });
  let moved = 0, interior = 0, interiorMoved = 0; const slot = (i) => { const x = (i % S.W) + S.ox, y = ((i / S.W) | 0) + S.oy; return x >= 35 && x <= 37 && y >= 20 && y <= 30; };
  for (let i = 0; i < S.n; i++) { const same = Math.abs(S.levelH[S.fine[i]] - hb[i]) < 1e-9; if (fp[i] && !same) moved++; if (slot(i)) { interior++; if (!same) interiorMoved++; } }
  ok(`${type}: 0 footprint tiles touched (of ${nfp}); the ${interior} slot tiles (interior of the closure K = 4) keep their source height`, moved === 0 && interior === 33 && interiorMoved === 0, `${moved} ${interior} ${interiorMoved}`);
  ok(`${type}: blocks, regions and carved tiles identical (walking does not change)`, S.block.every((v, i) => v === bl[i]) && (!rg || S.region.every((v, i) => v === rg[i])) && (!cv || S.carved.every((v, i) => v === cv[i])));
  ok(`${type}: the outside gets tiles and new levels, S.stageBorder describes them`, b && b.tiles > 500 && b.levelsAdded > 5 && b.closure === 33 && S.levelH.length === b.levelsBefore + b.levelsAdded, JSON.stringify(b));
  ok(`${type}: unknown type = null and no change`, (() => { const T = shape(false), h = hash(T); return E.border.apply(T, { type: 'off', tilesPerH: 2, yaw: 0 }) === null && hash(T) === h; })());
  const m1 = run(false, type, 2, 180, { noClosure: true }).S; let slotMoved = 0; { const T = shape(false); for (let i = 0; i < T.n; i++) if (slot(i) && Math.abs(m1.levelH[m1.fine[i]] - T.levelH[T.fine[i]]) > 1e-9) slotMoved++; }
  ok(`${type}: MUTATION noClosure (the slot gets a profile): the interior check FAILS`, slotMoved > 0, slotMoved);
  const m2 = run(false, type, 2, 180, { touchFootprint: true }).S; let fm = 0; { const T = shape(false); for (let i = 0; i < T.n; i++) if (fp[i] && Math.abs(m2.levelH[m2.fine[i]] - T.levelH[T.fine[i]]) > 1e-9) fm++; }
  ok(`${type}: MUTATION touchFootprint: the footprint check FAILS`, fm > 0, fm);
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
