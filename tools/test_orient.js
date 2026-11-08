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
  // M3c: the LAST zone of a window walks to the POI inside its footprint (E.stage.poiGoal); without `poi`, a POI outside the footprint, or a zone that is not the last: the rule of before
  {
    const withPoi = (S, tiles) => { const v = new Float32Array(S.n); for (const [t, q] of tiles) v[t] = q; S.fields = Object.assign({}, S.fields, { poi: { values: v } }); return S; };
    const foot = (S, id) => { const zm = E.stage.zoneMap(S), out = []; for (let i = 0; i < S.n; i++) if (zm[i] === id && !S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0) out.push(i); return out; };
    const S14 = table([14]).S, f14 = foot(S14, 14), pt = f14[Math.floor(f14.length * 0.8)], base14 = E.orient.compute(S14, P, [14], 2).byId.get(14);
    withPoi(S14, [[pt, 1]]); const r14 = E.orient.compute(S14, P, [14], 2).byId.get(14), g = E.stage.poiGoal(S14, 14), ax = [((pt % S14.W) + 0.5 - r14.centre[0]), (((pt / S14.W) | 0) + 0.5 - r14.centre[1])];
    ok(`M3c: a window of one room with a POI inside its footprint: the axis goes from the lowest part to the POI ("${r14.why}", was "${base14.why}"), the goal tile is the POI (${g && g.tile} = ${pt})`, g && g.tile === pt && r14.why === 'lowest part -> POI goal' && JSON.stringify(r14.axis) !== JSON.stringify(base14.axis), [r14.why, r14.axis, base14.axis]);
    E.orientTest = { noPoi: true }; const nop = E.orient.compute(S14, P, [14], 2).byId.get(14); E.orientTest = undefined;
    ok('MUTATION noPoi: the axis is the one of before (the check above FAILS without the rule)', JSON.stringify(nop.axis) === JSON.stringify(base14.axis) && nop.why === base14.why && nop.yaw === base14.yaw, [nop.why, nop.axis]);
    const other = foot(table([17]).S, 17); const S14b = table([14]).S; withPoi(S14b, [[0, 1]]); // tile 0 is not in the footprint of room 14 (outside the room: not walkable or another zone)
    ok('M3c: a POI outside the footprint of the last zone = the rule of before (axis, why, yaw)', (() => { const r = E.orient.compute(S14b, P, [14], 2).byId.get(14); return JSON.stringify(r.axis) === JSON.stringify(base14.axis) && r.why === base14.why && r.yaw === base14.yaw; })());
    ok('M3c: a pack without `poi` = the rule of before; E.stage.poiGoal is null', E.stage.poiGoal(table([14]).S, 14) === null && JSON.stringify(R(w14.T, 14).axis) === JSON.stringify(base14.axis));
    // a window of two rooms: the POI of the FIRST room does not matter, the one of the LAST one is walked to from the entry gate
    const S2 = table([17, 10]).S, f17 = foot(S2, 17), f10 = foot(S2, 10), b2 = E.orient.compute(S2, P, [17, 10], 2);
    withPoi(S2, [[f17[Math.floor(f17.length / 2)], 1]]); const a2 = E.orient.compute(S2, P, [17, 10], 2);
    ok('M3c: a POI in the first room of a window of two changes nothing (only the last zone reads it)', JSON.stringify(a2.rooms.map((r) => [r.axis, r.why, r.yaw])) === JSON.stringify(b2.rooms.map((r) => [r.axis, r.why, r.yaw])));
    const t10 = f10[Math.floor(f10.length * 0.7)]; withPoi(S2, [[t10, 1]]); const c2 = E.orient.compute(S2, P, [17, 10], 2), r10b = c2.byId.get(10);
    ok(`M3c: a POI in the last room of a window of two: the axis goes from its entry gate to the POI ("${r10b.why}"), the first room is as before`, r10b.why === 'entry gate -> POI goal' && JSON.stringify(c2.byId.get(17).axis) === JSON.stringify(b2.byId.get(17).axis), [r10b.why]);
    // the value decides, a tie goes to the tile nearest the centroid of the tied ones
    const a = f14[2], b = f14[Math.floor(f14.length / 2)], c = f14[f14.length - 3];
    withPoi(S14, [[a, 0.667], [b, 1], [c, 0.8]]); const win = E.stage.poiGoal(S14, 14);
    withPoi(S14, [[a, 1], [b, 1], [c, 1]]); const tie = E.stage.poiGoal(S14, 14), cs = [a, b, c], cx = cs.reduce((p, i) => p + (i % S14.W) + 0.5, 0) / 3, cy = cs.reduce((p, i) => p + ((i / S14.W) | 0) + 0.5, 0) / 3, near = cs.slice().sort((p, q) => Math.hypot((p % S14.W) + 0.5 - cx, ((p / S14.W) | 0) + 0.5 - cy) - Math.hypot((q % S14.W) + 0.5 - cx, ((q / S14.W) | 0) + 0.5 - cy))[0];
    withPoi(S14, [[a, 0.4]]);
    ok(`M3c: the highest value wins (1 over 0.8 and 0.667), a tie goes to the tile nearest the centroid of the tied ones, below ${E.stage.POI_MIN} there is no goal`, win.tile === b && tie.tile === near && tie.tied === 3 && E.stage.poiGoal(S14, 14) === null, [win, tie, near]);
  }
  // M3c-canon: the degenerate branch (a flat room, or the gate on the high part): the principal direction has a canonical sign. A nearly horizontal axis (|axis[1]| < 0.2) points to x >= 0; the sign of a tiny cross-covariance no longer turns the room round
  {
    const Wd = 40, Hd = 20, strip = (slope) => {
      const pack = { format: 'evodun-pack/0.2', name: 'strip', width: Wd, height: Hd, elevation: new Float32Array(Wd * Hd).fill(50), elevRange: [50, 50], voidTiles: 0, masks: {}, markers: [], fields: {}, warnings: [] };
      const S = E.shape(pack, Object.assign({}, P, { rooms: false, terraces: 3, subs: 3, terH: 4, subH: 0.88 }), null), zm = new Int32Array(S.n);
      for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) if (x >= 2 && x <= 37 && Math.abs(y + 0.5 - (10 + slope * (x - 20))) < 2) zm[y * Wd + x] = 1;
      S.stageZones = zm; return S;
    };
    const rec = (S, hook) => { E.orientTest = hook; const r = E.orient.compute(S, P, [1], 2).byId.get(1); E.orientTest = undefined; return r; };
    const up = rec(strip(0.03)), dn = rec(strip(-0.03));
    ok(`M3c-canon: a flat strip tilted +0.03 and -0.03 (the sign of a tiny cross-covariance) gives the SAME axis side and yaw (${up.yaw} and ${dn.yaw}, "${up.why}")`, /degenerate/.test(up.why) && up.yaw === dn.yaw && up.axis[0] > 0.99 && dn.axis[0] > 0.99, [up.axis, dn.axis, up.yaw, dn.yaw]);
    const upN = rec(strip(0.03), { noCanon: true }), dnN = rec(strip(-0.03), { noCanon: true });
    ok(`MUTATION noCanon: the two tilts turn round again (yaw ${upN.yaw} and ${dnN.yaw}): the check above FAILS without the rule`, upN.yaw !== dnN.yaw && JSON.stringify(upN.axis) === JSON.stringify(up.axis));
    const s4 = [0.4, -0.4].map((k) => ({ c: rec(strip(k)), n: rec(strip(k), { noCanon: true }) }));
    ok(`M3c-canon: an inclined degenerate zone (|axis[1]| >= 0.2: tilts +0.4 and -0.4) keeps the rule of before (y >= 0): axes ${JSON.stringify(s4.map((q) => q.c.axis))}`, s4.every((q) => JSON.stringify(q.c.axis) === JSON.stringify(q.n.axis) && q.c.yaw === q.n.yaw && q.c.axis[1] > 0), s4.map((q) => [q.c.axis, q.n.axis]));
    ok('M3c-canon: the 9 rooms of the DAC tables are not degenerate: nothing changes (the table checks above are the proof)', [w6, w14, w44].every((w) => w.T.rooms.every((r) => !/degenerate/.test(r.why))));
  }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
