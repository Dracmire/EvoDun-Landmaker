/* STAGE ORIENTATION BY ROOM, PR C1 (src/orient.js, no browser): the DIRECTION and the YAW of every room, computed from the geometry of the window and the order of its list (not from the DAC room type).
   Real map, the P of the example dac_stage (Balanced types, terraces 5, units in H: terH 4 = 2 H x 2 tiles), the 6 rooms of dac_stage as one window and the rooms 14 and 44 as windows of their own: the table is STABLE (a change of the constants RATIO / BLOCK_W or of the rule moves it and this test says so).
   Mutations: fixedYaw (every room gets one yaw: the table check FAILS), a Z room that is turned the other way by the entry / exit order (the list reversed gives the opposite yaw).
     node tools/test_orient.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":120,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":1,"stairW":3,"stairStyle":0,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":true,"ascWalls":false,"ascHeight":1.5,"pocket":false,"pocketFraming":"auto","pocketHeight":2.5,"backdrop":false,"backdropGap":0,"backdropHeight":2,"roomsMinCore":100,"roomsCross":10,"roomsIsoLimit":100,"rRadius":5,"cake":false,"cakeLayers":3,"cakeStep":0.3,"cakePer":1,"cakeSeam":5,"pocketYaw":180,"chainKey":"","chainFail":"","rampPreferFill":true}');
// expected: [room, direction, yaw, ratio]
const WIN6 = [17, 10, 20, 27, 6, 5], EXP6 = [[17, 'Hub', 0, 1.2], [10, 'Hub', 270, 0.92], [20, 'Hub', 270, 0.97], [27, 'Hub', 180, 1.21], [6, 'Z', 90, 1.83], [5, 'X', 90, 0.63]], EXP14 = [[14, 'Z', 180, 2.09]], EXP44 = [[44, 'Hub', 90, 1.37]];
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const table = (rooms) => { const S = E.shape(mk(), P, { rooms: rooms.slice().sort((a, b) => a - b), margin: P.margin }); return { S, T: E.orient.compute(S, P, rooms, 2) }; };
  const row = (T) => T.rooms.map((r) => [r.id, r.dir, r.yaw, r.ratio]);
  const w6 = table(WIN6), w14 = table([14]), w44 = table([44]);
  const same = (got, exp) => got.length === exp.length && got.every((g, k) => g[0] === exp[k][0] && g[1] === exp[k][1] && g[2] === exp[k][2] && Math.abs(g[3] - exp[k][3]) <= 0.02);
  ok(`dac_stage, the 6 rooms of the list: ${JSON.stringify(row(w6.T))}`, same(row(w6.T), EXP6), row(w6.T));
  ok(`room 14 (a window of one room): ${JSON.stringify(row(w14.T))}`, same(row(w14.T), EXP14), row(w14.T));
  ok(`room 44 (a window of one room): ${JSON.stringify(row(w44.T))}`, same(row(w44.T), EXP44), row(w44.T));
  const R = (T, id) => T.byId.get(id);
  ok('the threshold is one constant (1.5) and every yaw is a multiple of 90', E.orient.RATIO === 1.5 && [w6, w14, w44].every((w) => w.T.rooms.every((r) => r.yaw % 90 === 0 && r.yaw >= 0 && r.yaw < 360)));
  ok('Z / X / Hub follow the ratio: Z >= 1.5, X <= 1 / 1.5, Hub in between (the 8 rooms)', [w6, w14, w44].every((w) => w.T.rooms.every((r) => (r.dir === 'Z') === (r.ratio >= 1.5) && (r.dir === 'X') === (r.ratio <= 1 / 1.5) && (r.dir === 'Hub') === (r.ratio > 1 / 1.5 && r.ratio < 1.5))));
  ok('the three directions all occur in the 8 rooms (no degenerate table: not all Hub)', new Set([w6, w14, w44].flatMap((w) => w.T.rooms.map((r) => r.dir))).size === 3);
  // the gates: the middle rooms of the list have both, the first only an exit, the last only an entry; the axis of a middle room goes from its entry to its exit
  const r10 = R(w6.T, 10), r17 = R(w6.T, 17), r5 = R(w6.T, 5);
  ok('gates: the first room has only an exit, the last only an entry, a middle room both (the walking edges between consecutive rooms)', !r17.entry && !!r17.exit && !!r5.entry && !r5.exit && !!r10.entry && !!r10.exit, [r17.why, r5.why, r10.why]);
  ok('the axis of a middle room is its entry -> exit gate (unit, same direction)', (() => { const dx = r10.exit[0] - r10.entry[0], dy = r10.exit[1] - r10.entry[1], m = Math.hypot(dx, dy); return Math.abs(dx / m - r10.axis[0]) < 0.01 && Math.abs(dy / m - r10.axis[1]) < 0.01; })(), r10);
  ok('a window of one room has no gate: the axis goes from its lowest part to its highest', R(w14.T, 14).why === 'lowest part -> highest part');
  // the order of the list is the walk: reversed, the entry and the exit of a middle room swap and its axis turns around
  const rev = table(WIN6.slice().reverse()), a0 = R(w6.T, 10).axis, a1 = R(rev.T, 10).axis;
  ok('the order of the list matters: with the list reversed the axis of room 10 (entry <-> exit) is the opposite one', Math.abs(a0[0] + a1[0]) < 0.02 && Math.abs(a0[1] + a1[1]) < 0.02, [a0, a1]);
  // determinism and the mutation
  ok('deterministic: the same window twice gives the same table', JSON.stringify(row(table(WIN6).T)) === JSON.stringify(row(w6.T)));
  E.orientTest = { fixedYaw: 180 }; const fx = table(WIN6); E.orientTest = undefined;
  ok('MUTATION fixedYaw (one yaw for every room): the table check FAILS', !same(row(fx.T), EXP6) && fx.T.rooms.every((r) => r.yaw === 180));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
