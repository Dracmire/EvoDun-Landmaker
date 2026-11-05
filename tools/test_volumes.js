/* STAGE VOLUMES, PR S4b (src/volumes.js, no browser): the rules of the declared volumes (real geometry on blocked tiles, in H).
   - the roof is the datum (the nearest walkable ground) + hH x tilesPerH, hH floored to the RELATIVE 0.25 H grid, independent of tilesPerH (2, 2.5, 3);
   - the footprint (the walkable tiles) is never touched; walking, regions and blocks are identical on / off;
   - only blocked tiles: walkable, void, water, outside-the-window, <= 1 tile from a transition (the margin: Chebyshev < 2) and already-higher tiles are OMITTED with a reason, never an error;
   - deterministic (twice = the same S); an empty list changes nothing.
   Each rule has a named MUTATION (a hook of opts.test) that must make its check FAIL.
     node tools/test_volumes.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['fields', 'shape', 'tech', 'rooms', 'roomtypes', 'border', 'volumes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
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
const S0 = shape(true), L0 = hAt(S0, S0.W >> 1, 5), fp = fpOf(S0), nfp = fp.reduce((a, b) => a + b, 0), ox = S0.ox, oy = S0.oy, tileOf = (S, mx, my) => (my - S.oy) * S.W + (mx - S.ox);
const vol = (S, list, tph, test) => E.volumes.apply(S, { list, tilesPerH: tph || 2, test });
const reasons = (v) => v.skipped.reduce((m, s) => (m[s.reason] = (m[s.reason] || 0) + 1, m), {});
const bx0 = 24 - S0.ox, bx1 = 47 - S0.ox, by0 = 14 - S0.oy, by1 = 41 - S0.oy, mx = (bx0 + bx1) >> 1;
// the box is map x 24..47, y 14..41; (52..53, 20..21) is blocked ground east of it, 4 tiles from the footprint
// 1. the height in H, independent of tilesPerH, on the relative grid of 0.25 H
for (const tph of [2, 2.5, 3]) {
  const S = shape(true), v = vol(S, [{ x: 52, y: 20, w: 2, d: 2, hH: 1.4 }], tph), r = (hAt(S, 52 - ox, 20 - oy) - L0) / tph;
  ok(`tilesPerH ${tph}: a 1.4 H volume has its roof at 1.25 H over the walkable ground (the 0.25 H grid floor), ${v.tiles} tiles, ${v.levelsAdded} level`, Math.abs(r - 1.25) < 0.01 && v.tiles === 4 && v.levelsAdded === 1, r);
}
{ const S = shape(true); vol(S, [{ x: 52, y: 20, w: 2, d: 2, hH: 1.4 }], 2, { tilesNotH: true }); const r = (hAt(S, 52 - ox, 20 - oy) - L0) / 2; ok('MUTATION tilesNotH (the height in tiles): the independence of tilesPerH FAILS', !(Math.abs(r - 1.25) < 0.01), r); }
{ const S = shape(true); vol(S, [{ x: 52, y: 20, w: 2, d: 2, hH: 1.4 }], 2, { noGrid: true }); const r = (hAt(S, 52 - ox, 20 - oy) - L0) / 2; ok('MUTATION noGrid (no floor to the grid): the grid check FAILS', !(Math.abs(r - 1.25) < 0.01), r); }
// 2. the footprint and the walking are untouched; the info describes the levels
for (const flat of [true, false]) {
  const S = shape(flat), before = hash(S), hb = Float64Array.from({ length: S.n }, (_, i) => S.levelH[S.fine[i]]), bl = Uint8Array.from(S.block), rg = S.region ? Int32Array.from(S.region) : null;
  const v = vol(S, [{ x: 52, y: 20, w: 3, d: 3, hH: 2 }, { x: 24, y: 8, w: 6, d: 3, hH: 1 }]); let moved = 0; for (let i = 0; i < S.n; i++) if (fp[i] && Math.abs(S.levelH[S.fine[i]] - hb[i]) > 1e-9) moved++;
  ok(`${flat ? 'flat' : 'relief'}: 0 footprint tiles touched (of ${nfp}), blocks and regions identical, S.stageVolumes describes the ${v.tiles} tiles and ${v.levelsAdded} new levels`, (!flat || true) && moved === 0 && S.block.every((q, i) => q === bl[i]) && (!rg || S.region.every((q, i) => q === rg[i])) && v.tiles > 0 && S.levelH.length === v.levelsBefore + v.levelsAdded && S.stageVolumes === v);
  if (flat) { const T = shape(true); vol(T, [{ x: 52, y: 20, w: 3, d: 3, hH: 2 }], 2, { touchFootprint: true }); let fm = 0; for (let i = 0; i < T.n; i++) if (fp[i] && Math.abs(T.levelH[T.fine[i]] - L0) > 1e-9) fm++; ok('MUTATION touchFootprint (a footprint tile moved): the footprint check FAILS', fm > 0, fm); }
}
// 3. only blocked tiles: a rectangle that crosses the east edge of the box (x 44..51): the 4 walkable columns are omitted with the reason
{ const S = shape(true), v = vol(S, [{ x: 44, y: 20, w: 8, d: 2, hH: 1 }]), r = reasons(v), hw = hAt(S, 45 - ox, 20 - oy);
  ok('a volume that steps on walkable tiles omits them (reason walkable), raises the blocked ones', r.walkable === 8 && v.tiles === 8 && Math.abs(hw - L0) < 1e-9 && hAt(S, 50 - ox, 20 - oy) > L0 + 1, JSON.stringify(r)); }
{ const S = shape(true); vol(S, [{ x: 44, y: 20, w: 8, d: 2, hH: 1 }], 2, { volumeOnWalkable: true }); ok('MUTATION volumeOnWalkable (walkable tiles accepted): the walkable check FAILS', !(Math.abs(hAt(S, 45 - ox, 20 - oy) - L0) < 1e-9)); }
// 4. outside the window, void, overlap
{ const S = shape(true), v = vol(S, [{ x: -3, y: 20, w: 2, d: 1, hH: 1 }, { x: 52, y: 30, w: 2, d: 2, hH: 1 }, { x: 53, y: 31, w: 2, d: 2, hH: 2 }]), r = reasons(v);
  ok('tiles outside the window are omitted (outside); where two volumes overlap the first keeps the tile (overlap)', r.outside === 2 && r.overlap === 1 && v.tiles === 4 + 3, JSON.stringify(r));
  const T = shape(true); T.void = new Uint8Array(T.n); T.void[tileOf(T, 52, 20)] = 1; const w = vol(T, [{ x: 52, y: 20, w: 2, d: 1, hH: 1 }]);
  ok('a void tile is omitted (void) and stays void', reasons(w).void === 1 && w.tiles === 1); }
// 5. the margin: Chebyshev < 2 from a tile of a transition. A fake transition has a step column at map (47, 25) (the east edge of the box), a bottom tile at (47, 26)
{ const mkS = () => { const S = shape(true); S.stairs = [{ steps: [{ tiles: [tileOf(S, 47, 25)] }], bottom: [tileOf(S, 47, 26)], top: [] }]; return S; };
  const S = mkS(), v = vol(S, [{ x: 48, y: 24, w: 4, d: 1, hH: 1 }, { x: 49, y: 28, w: 1, d: 1, hH: 1 }, { x: 50, y: 28, w: 1, d: 1, hH: 1 }]), sk = v.skipped.filter((s) => s.reason === 'margin').map((s) => s.x + ',' + s.y).sort().join(' ');
  // row y 24: x 48 (distance 1) and 49 (distance 2 to (47,25): Chebyshev 2, outside the margin) -> only x 48 omitted; (49, 28): distance 2 from (47,26) -> placed; (50, 28) placed. x 48 y 24 is dist 1.
  ok(`the margin: a tile at distance 1 of a transition is omitted (margin: ${sk}), a tile at exactly 2 is raised`, sk === '48,24' && v.tiles === 3 + 2 && hAt(S, 49 - ox, 24 - oy) > L0 + 1 && Math.abs(hAt(S, 48 - ox, 24 - oy) - L0) < 1e-9, sk);
  const T = mkS(); vol(T, [{ x: 48, y: 24, w: 4, d: 1, hH: 1 }], 2, { noMargin: true }); ok('MUTATION noMargin (the margin ignored): the tile 1 from the transition is raised, the margin check FAILS', !(Math.abs(hAt(T, 48 - ox, 24 - oy) - L0) < 1e-9)); }
// 6. with the border: a tile in the moat is water (omitted), a tile the quebrada already raised above the roof is 'higher'
{ const S = shape(true); E.border.apply(S, { type: 'island', tilesPerH: 2, yaw: 0 }); const v = vol(S, [{ x: 48, y: 25, w: 1, d: 1, hH: 1 }, { x: 54, y: 25, w: 1, d: 1, hH: 1 }]), r = reasons(v);
  ok('island: a volume tile in the moat is omitted (water), one beyond it is raised', r.water === 1 && v.tiles === 1, JSON.stringify(r));
  const Q = shape(true); E.border.apply(Q, { type: 'quebrada', tilesPerH: 2, yaw: 0 }); const hq = hAt(Q, mx, by0 - 4) , w = vol(Q, [{ x: mx + ox, y: by0 - 4 + oy, w: 1, d: 1, hH: 0.25 }]);
  ok('quebrada: a tile the far-side rise put above the roof is not lowered (higher)', reasons(w).higher === 1 && hAt(Q, mx, by0 - 4) === hq, JSON.stringify(reasons(w))); }
// 7. deterministic, an empty list changes nothing, tilesPerH is a unit
{ const a = shape(false), b = shape(false), L = [{ x: 52, y: 20, w: 3, d: 3, hH: 2 }, { x: 30, y: 8, w: 4, d: 2, hH: 1 }]; vol(a, L); vol(b, L); ok('turning it on twice gives the same S (deterministic)', hash(a) === hash(b));
  const c = shape(false), h = hash(c); const v = vol(c, []); ok('an empty list changes nothing (S identical)', v.tiles === 0 && v.levelsAdded === 0 && hash(c) === h); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
