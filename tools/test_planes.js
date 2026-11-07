/* STAGE PLANES BY ROOM, PR C2 (src/planes.js, no browser): the rule of planes of the "mock T" on the real map (the P of dac_stage; the 6 rooms of its list as one window, the rooms 14 and 44 as windows of their own; every room with the yaw of C1).
   - the table per room: tiles of BACK / SIDE / FRONT (the classes) and of the wall / columns / lowered front (the effects) is STABLE;
   - no walkable tile of the window changes height (the walkable footprint is never touched); mutation wallOnWalkable (the wall steps on walkable tiles) FAILS;
   - room 14 has a wall behind at least half of its columns; mutation noBack FAILS;
   - the columns are one every colEvery (3) rows along the axis; mutation colEvery 5 FAILS;
   - no FRONT tile (within frontDepth) stays above the lowest ground of the room; mutation noFront FAILS.
     node tools/test_planes.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'orient', 'planes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
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
  ok('the hypotheses are one table: R 8, wallDepth 2, wallH 3 H, colH 3 H, colEvery 3, frontDepth 4, frontDrop 0.5 H', JSON.stringify(HYP) === JSON.stringify({ R: 8, wallDepth: 2, wallH: 3, colH: 3, colEvery: 3, frontDepth: 4, frontDrop: 0.5 }));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
