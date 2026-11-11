/* STAGE PLANES BY ROOM, PR C2 (src/planes.js, no browser): the rule of planes of the "mock T" on the real map (the P of dac_stage; the 6 rooms of its list as one window, the rooms 14 and 44 as windows of their own; every room with the yaw of C1).
   - the table per room: tiles of BACK / SIDE / FRONT (the classes) and of the wall / columns / lowered front (the effects) is STABLE;
   - no walkable tile of the window changes height (the walkable footprint is never touched); mutation wallOnWalkable (the wall steps on walkable tiles) FAILS;
   - room 14 has a wall behind at least half of its columns; mutation noBack FAILS;
   - the columns are one every colEvery (3) rows along the axis; mutation colEvery 5 FAILS;
   - no FRONT tile (within frontDepth) stays above the lowest ground of the room; mutation noFront FAILS.
     node tools/test_planes.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage', 'orient', 'planes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":120,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":1,"stairW":3,"stairStyle":0,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":true,"ascWalls":false,"ascHeight":1.5,"pocket":false,"pocketFraming":"auto","pocketHeight":2.5,"backdrop":false,"backdropGap":0,"backdropHeight":2,"roomsMinCore":100,"roomsCross":10,"roomsIsoLimit":100,"rRadius":5,"cake":false,"cakeLayers":3,"cakeStep":0.3,"cakePer":1,"cakeSeam":5,"pocketYaw":180,"chainKey":"","chainFail":"","rampPreferFill":true}');
// [room, back, side, front, wall, cols, front lowered]
const EXP = { 17: [178, 145, 55, 44, 7, 27], 10: [28, 148, 122, 11, 9, 56], 20: [224, 156, 162, 53, 10, 64], 27: [374, 153, 300, 94, 4, 69], 6: [365, 313, 396, 91, 22, 127], 5: [160, 205, 41, 60, 13, 27], 14: [265, 444, 231, 66, 22, 70], 44: [530, 844, 516, 123, 43, 111] };
const WINS = [[17, 10, 20, 27, 6, 5], [14], [44]], HYP = E.planes.HYP;
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const shape = (rooms) => E.shape(mk(), P, { rooms: rooms.slice().sort((a, b) => a - b), margin: P.margin });
  const walkH = (S) => { const o = []; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i])) o.push(S.levelH[S.fine[i]]); return o; };
  const run = (rooms, rec, test) => { const S = shape(rooms), before = walkH(S), r = E.planes.apply(S, { room: rec, yaw: rec.yaw, tilesPerH: 2, test }); return { S, r, before, after: walkH(S) }; };
  const recs = {}, wins = {}; for (const w of WINS) { const S = shape(w), T = E.orient.compute(S, P, w, 2); for (const r of T.rooms) { recs[r.id] = r; wins[r.id] = w; } }
  // the table
  const tab = {}, changed = {}; for (const id of Object.keys(EXP)) { const w = wins[id], S0 = shape(w), C = E.planes.classify(S0, recs[id], recs[id].yaw), x = run(w, recs[id]); tab[id] = [C.counts.back, C.counts.side, C.counts.front, x.r.wall, x.r.cols, x.r.front]; changed[id] = x.before.some((h, k) => Math.abs(h - x.after[k]) > 1e-9); }
  ok('the table of the 8 rooms (back / side / front tiles, wall / columns / lowered front) is stable: ' + JSON.stringify(tab), Object.keys(EXP).every((id) => JSON.stringify(tab[id]) === JSON.stringify(EXP[id])), tab);
  ok('no walkable tile of the window changes height, in any of the 8 rooms (the walkable footprint is never touched)', Object.values(changed).every((c) => !c), changed);
  { const x = run(wins[27], recs[27], { wallOnWalkable: true }); ok('MUTATION wallOnWalkable (the wall steps on walkable tiles of the other rooms): the walkable-footprint check FAILS', x.before.some((h, k) => Math.abs(h - x.after[k]) > 1e-9)); }
  // P1: void is classified like blocked ground in BACK and SIDE (not in FRONT)
  { const x = run(wins[44], recs[44]), y = run(wins[44], recs[44], { noVoidWall: true }), vd = x.S.void;
    ok(`room 44 (yaw 90, void behind it): the closing wall exists (${x.r.wall} tiles, ${x.r.voidTiles} of them on former void) and the columns reach the void side (${x.r.cols})`, x.r.wall > 0 && x.r.voidTiles > 0 && x.r.cols >= 9, { wall: x.r.wall, voidTiles: x.r.voidTiles });
    ok(`MUTATION noVoidWall (void is not classified, the C2 rule): room 44 has wall ${y.r.wall}: the wall check FAILS`, !(y.r.wall > 0), { wall: y.r.wall });
    // a former void tile is now a drawn, blocked, NOT walkable tile of the wall height
    const S0 = shape(wins[44]); let n = 0, bad = 0; for (let i = 0; i < S0.n; i++) if (S0.void[i] && !x.S.void[i]) { n++; if (!x.S.block[i]) bad++; } ok(`the ${n} void tiles that took a wall / column are drawn and blocked (${bad} walkable), and the next shape built from the same pack still has them as void`, n === x.r.voidTiles && bad === 0 && S0.void.some((v, i) => v && !x.S.void[i]) , { n, bad }); }
  // room 14: the wall behind the columns of the room
  const wallCols = (x, rec) => { const C = E.planes.classify(x.S, rec, rec.yaw), roof = x.r.floorHigh + HYP.wallH * 2; let cols = 0, withWall = 0; for (const [p, far] of C.far) { cols++; let found = false; for (let i = 0; i < x.S.n; i++) if (C.Pc[i] === p && C.A[i] === far + 1 && x.S.levelH[x.S.fine[i]] >= roof - 1e-6) { found = true; break; } if (found) withWall++; } return { cols, withWall }; };
  { const x = run(wins[14], recs[14]), w = wallCols(x, recs[14]); ok(`room 14: a wall behind ${w.withWall} of its ${w.cols} columns (at least half)`, w.withWall * 2 >= w.cols, w);
    const m = run(wins[14], recs[14], { noBack: true }), wm = wallCols(m, recs[14]); ok(`MUTATION noBack (no closing wall): ${wm.withWall} of ${wm.cols} columns have a wall, the check FAILS`, !(wm.withWall * 2 >= wm.cols), wm); }
  // columns every colEvery rows along the axis (both sides)
  const spacing = (r) => { const bad = []; let n = 0, minD = 99; for (const s of ['-1', '1']) { const rows = r.colRows[s]; n += rows.length; for (let k = 1; k < rows.length; k++) { const d = rows[k] - rows[k - 1]; minD = Math.min(minD, d); if (d % HYP.colEvery !== 0) bad.push(d); } } return { n, minD, bad }; };
  { const x = run(wins[14], recs[14]), sp = spacing(x.r); ok(`room 14: ${sp.n} columns, the rows of each side are ${HYP.colEvery} apart (smallest gap ${sp.minD}, none off the grid)`, sp.n >= 8 && sp.minD === HYP.colEvery && sp.bad.length === 0, sp);
    const m = run(wins[14], recs[14], { colEvery: 5 }), spm = spacing(m.r); ok(`MUTATION colEvery 5: the rows are 5 apart (smallest gap ${spm.minD}), the spacing check FAILS`, !(spm.minD === HYP.colEvery && spm.bad.length === 0), spm); }
  // the front never above the lowest ground of the room
  const frontMax = (x, rec) => { const C = E.planes.classify(x.S, rec, rec.yaw); let mx = -1e9, n = 0; for (let i = 0; i < x.S.n; i++) { if (C.cls[i] !== E.planes.FRONT) continue; const d = C.near.get(C.Pc[i]) - C.A[i]; if (d < 1 || d > HYP.frontDepth) continue; n++; mx = Math.max(mx, x.S.levelH[x.S.fine[i]]); } return { mx, n, low: x.r.floorLow }; };
  { const x = run(wins[14], recs[14]), f = frontMax(x, recs[14]); ok(`room 14: none of the ${f.n} front tiles (within ${HYP.frontDepth} tiles) is above the lowest ground of the room (${f.mx} <= ${f.low})`, f.n > 20 && f.mx <= f.low + 1e-9, f);
    const m = run(wins[14], recs[14], { noFront: true }), fm = frontMax(m, recs[14]); ok(`MUTATION noFront: a front tile stays above the lowest ground (${fm.mx} > ${fm.low}), the check FAILS`, !(fm.mx <= fm.low + 1e-9), fm); }
  // THRONE WORLD, COMMIT 2 (the ONE-TIME unlock of src/planes.js): `avoidPath` omits a SIDE column when a tile of the role `path` lies in its shadow (behind it on the view axis up to colH * tilesPerH / tan(25 deg), 1 tile to each side). New checks only: nothing above changed.
  {
    const rec = recs[14], mkS = (pts) => { const S = shape(wins[14]), v = new Float32Array(S.n); for (const [t, val] of pts) v[t] = val; S.fields = { path: { values: v } }; return S; };
    const go = (pts, o) => { const S = mkS(pts), r = E.planes.apply(S, Object.assign({ room: rec, yaw: rec.yaw, tilesPerH: 2 }, o || {})); let cols = 0; for (let i = 0; i < S.n; i++) { const m = S.levelMeta[S.fine[i]]; if (m && m.plane === 'col') cols++; } return { S, r, cols }; };
    const B0 = go([]), C = E.planes.classify(B0.S, rec, rec.yaw), at = (a, p) => { const x = a * C.f[0] + p * C.r[0], y = a * C.f[1] + p * C.r[1]; return x < 0 || y < 0 || x >= B0.S.W || y >= B0.S.H ? -1 : y * B0.S.W + x; };
    const colTiles = []; for (let i = 0; i < B0.S.n; i++) { const m = B0.S.levelMeta[B0.S.fine[i]]; if (m && m.plane === 'col') colTiles.push(i); }
    // the column in the middle of the list, with room around it
    const c0 = colTiles[(colTiles.length >> 1)], A0 = C.A[c0], P0 = C.Pc[c0], tanP = Math.tan(E.planes.AVOID.camPitch * Math.PI / 180);
    const expect = (tTile, val, exag) => { if (!(val > 0.5)) return 0; const L = (exag ? E.stage.exag(HYP.colH, exag) : HYP.colH) * 2 / tanP; let n = 0; for (const c of colTiles) { const da = C.A[tTile] - C.A[c], dp = Math.abs(C.Pc[tTile] - C.Pc[c]); if (da >= 1 && da <= L && dp <= 1) n++; } return n; };
    const cases = [[3, 0, 1], [3, 1, 1], [3, -1, 1], [3, 2, 1], [3, -2, 1], [1, 0, 1], [12, 0, 1], [13, 0, 1], [0, 0, 1], [-1, 0, 1], [3, 0, 0.5], [3, 0, 0.51], [3, 0, 0.4]];
    const bad = [], seen = { omit: 0, keep: 0 };
    for (const [da, dp, val] of cases) { const t = at(A0 + da, P0 + dp); if (t < 0) { bad.push(['off the grid', da, dp]); continue; } const e = expect(t, val), x = go([[t, val]], { avoidPath: true }); if (x.r.skipped.path !== e || x.cols !== B0.cols - e) bad.push([da, dp, val, 'expected ' + e, 'got ' + x.r.skipped.path + ' / cols ' + x.cols + ' of ' + B0.cols]); if (e > 0) seen.omit++; else seen.keep++; }
    ok(`avoidPath: ${cases.length} placements of ONE path tile around a column (rows behind 1 / 3 / 12 / 13, in front, same row, lateral 0 / +-1 / +-2, value 0.4 / 0.5 / 0.51): the columns omitted are exactly the ones whose shadow (1..${(HYP.colH * 2 / tanP).toFixed(2)} rows behind, 1 tile aside, value > 0.5) holds it; ${seen.omit} placements omit, ${seen.keep} keep`, bad.length === 0 && seen.omit >= 6 && seen.keep >= 4, bad);
    { const t = at(A0 + 20, P0), e1 = expect(t, 1, 1.5), e0 = expect(t, 1), x1 = go([[t, 1]], { avoidPath: true, exag: 1.5 }), x0 = go([[t, 1]], { avoidPath: true }); ok(`avoidPath with the exaggeration of the columns (exag 1.5: the column is taller, the shadow longer): a path tile 20 rows behind omits ${x1.r.skipped.path} columns (expected ${e1}) with exag 1.5 and ${x0.r.skipped.path} (expected ${e0}) without it: the taller column reaches more`, e1 > e0 && x1.r.skipped.path === e1 && x0.r.skipped.path === e0, { e1, e0, a: x1.r.skipped, b: x0.r.skipped }); }
    { const t = at(A0 + 3, P0), x = go([[t, 1]], { avoidPath: true }), n = go([[t, 1]]), z = go([[t, 1]], { avoidPath: false }); const same = (u, v) => JSON.stringify(u.r) === JSON.stringify(v.r) && u.S.levelH.length === v.S.levelH.length && u.S.levelH.every((h, k) => h === v.S.levelH[k]);
      ok('the option absent = byte for byte the behaviour of before: the same S.stagePlanes (no `skipped.path` key), the same levels, with a `path` mask present; `false` too; with it on the result differs', same(n, B0) && same(z, B0) && n.r.skipped.path === undefined && !same(x, B0) && x.r.skipped.path > 0, { a: n.r.skipped, b: x.r.skipped });
      const m = go([[t, 1]], { avoidPath: true, test: { noAvoidPath: true } }); ok(`MUTATION noAvoidPath (the columns return with the option on): the omission check FAILS (${m.cols} columns of ${B0.cols}, skipped.path ${m.r.skipped.path})`, !(m.r.skipped.path > 0) && m.cols === B0.cols, { cols: m.cols, base: B0.cols }); }
    { // a column tile (NOT over void: a void tile has no `higher` test) whose ground already reaches the roof is a `higher` skip, not a `path` one (the check of the shadow comes after it)
      const S00 = shape(wins[14]), cH = colTiles.find((c) => !S00.void[c]), t = at(C.A[cH] + 3, C.Pc[cH]), S = mkS([[t, 1]]); S.fine = Int16Array.from(S.fine); S.levelH = Array.from(S.levelH); S.levelMeta = Array.from(S.levelMeta); S.levelH.push(1e6); S.levelMeta.push(S.levelMeta[S.fine[cH]]); S.fine[cH] = S.levelH.length - 1;
      const e = expect(t, 1) - 1, r = E.planes.apply(S, { room: rec, yaw: rec.yaw, tilesPerH: 2, avoidPath: true });
      ok(`avoidPath: a column tile that is already as high as its roof is counted as higher (${r.skipped.higher}), not as omitted over the path: ${r.skipped.path} omitted (expected ${e})`, cH !== undefined && r.skipped.higher >= 1 && r.skipped.path === e && e >= 0, r.skipped); }
    { const S = shape(wins[14]); S.fields = undefined; const r = E.planes.apply(S, { room: rec, yaw: rec.yaw, tilesPerH: 2, avoidPath: true }); ok(`a pack without the role \`path\` with the option on omits nothing (${r.skipped.path} skipped, ${r.cols} columns as before: ${B0.r.cols})`, r.skipped.path === 0 && r.cols === B0.r.cols, r.skipped); }
  }
  ok('the hypotheses are one table: R 8, wallDepth 2, wallH 3 H, colH 3 H, colEvery 3, frontDepth 4, frontDrop 0.5 H', JSON.stringify(HYP) === JSON.stringify({ R: 8, wallDepth: 2, wallH: 3, colH: 3, colEvery: 3, frontDepth: 4, frontDrop: 0.5 }));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
