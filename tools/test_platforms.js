/* PLATFORMS (src/s3/platforms.js, PR Q3), no browser. Units: rte (Mathf.RoundToInt, half to even); the widened path of a straight path (the radius is the half width, the values fall 1 - r / (maxHalf + 1)); thickness; prune; flow seeds; ClassifyRoomFlowFromConnections degrees; and on the real map (Balanced types) the invariants of the whole pipeline: every platform tile lies in its room and terrace, two platforms never share a tile, the platform area <= maxArea, a room that is not in `only` has no platform, the pipeline is deterministic (same counts twice), E.s3.platforms exists and E.platforms does not.
     node tools/test_platforms.js */
const fs = require('fs'), path = require('path'), vm = require('vm'); global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/platforms', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO, X = E.s3.platforms; let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS ' + n); } else { fail++; console.log('FAIL ' + n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
(async () => {
  ok('the platforms live in E.s3 only', !!X && E.platforms === undefined && Object.prototype.hasOwnProperty.call(E.s3, 'platforms'));
  // rte: half to even
  { const f = (v) => { const fl = Math.floor(v), d = v - fl; return d < 0.5 - 1e-9 ? fl : d > 0.5 + 1e-9 ? fl + 1 : (fl % 2 === 0 ? fl : fl + 1); }; ok('Unity RoundToInt: 0.5 -> 0, 1.5 -> 2, 2.5 -> 2, -0.5 -> 0, 2.4 -> 2, 2.6 -> 3', [0.5, 1.5, 2.5, -0.5, 2.4, 2.6].map(f).join() === '0,2,2,0,2,3'); }
  // widened path of a straight vertical path x = 10, y = 5..20 in a 30 x 30 free room 1
  { const W = 30, H = 30, room = new Int32Array(W * H).fill(1), forb = new Uint8Array(W * H), path = []; for (let y = 5; y <= 20; y++) path.push(y * W + 10);
    const f = X.widened([path], room, forb, W, H, 6), at = (x, y) => f[y * W + x];
    ok(`the widened path: 1 on the path, 1 - r / 7 at distance r (r = 1: ${at(11, 10).toFixed(3)}, 6: ${at(16, 10).toFixed(3)}), 0 beyond 6 (${at(17, 10)})`, at(10, 10) === 1 && Math.abs(at(11, 10) - (1 - 1 / 7)) < 1e-6 && Math.abs(at(4, 10) - (1 - 6 / 7)) < 1e-6 && at(17, 10) === 0 && at(3, 10) === 0);
    const forb2 = new Uint8Array(W * H); for (let y = 0; y < H; y++) forb2[y * W + 12] = 1; const f2 = X.widened([path], room, forb2, W, H, 6);
    ok('a forbidden column at x = 12 limits the right radius to 1 (x = 11 filled, 12 and 13 empty)', f2[10 * W + 11] > 0 && f2[10 * W + 12] === 0 && f2[10 * W + 13] === 0 && f2[10 * W + 4] > 0);
    const th = X.thickness(f, W, H, 6); ok(`thickness: the middle of the band has 6 (${th[12 * W + 10]}), its edge 0 (${th[12 * W + 16]}); near the path end (y = 10: the first point of a path is not marked, so a 4-neighbour at distance 5 is empty) 4 (${th[10 * W + 10]})`, th[12 * W + 10] === 6 && th[12 * W + 16] === 0 && th[10 * W + 10] === 4);
    const sub = X.subsegments(f, room, new Int16Array(W * H).fill(1), W, H); const pr = X.prune(sub.full, th, 4), pr2 = X.prune(sub.full, th, 7);
    ok('prune keeps a (room, terrace) whose maximum thickness >= 4 and drops it at 7', pr.size === 1 && pr2.size === 0);
    const fs = X.flowSeeds(pr, W, H, 12); ok(`one flow seed of ${fs[0] && fs[0].area} tiles = the whole subsegment (the C# does not use connectivity here)`, fs.length === 1 && fs[0].area === W * H); }
  // flow types: room degrees from the tree
  { const mk = (room, n) => ({ room, terrace: 1, tiles: new Array(n).fill(0) }), pl = [mk(1, 500), mk(2, 500), mk(3, 500), mk(4, 500), mk(5, 30), mk(6, 120), mk(7, 500)], conns = [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 2, b: 4 }, { a: 5, b: 1 }];
    const f = X.flowTypes(pl, conns, 50, 200), g = (r) => f.get(r + '|1'); ok(`flow types by degree: room 1 (2) ${g(1)}, 2 (3) ${g(2)}, 3 (1) ${g(3)}, 7 (0) ${g(7)}; tiny: 5 ${g(5)}, 6 ${g(6)}`, g(1) === 'Corridor' && g(2) === 'Hub' && g(3) === 'Leaf' && g(4) === 'Leaf' && g(7) === 'Isolated' && g(5) === 'Micro' && g(6) === 'Small'); }
  // the real map
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), P = { ...RT.BASE, terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120, terH: 1.875, subH: 0.4125, subs: 2 };
  const RL = E.s3.rooms.layer(mk(), P), only = [79, 63, 86], A = X.compute(RL, { only }), B = X.compute(RL, { only });
  ok(`determinism: two runs give the same counts (${JSON.stringify(A.counts)})`, JSON.stringify(A.counts) === JSON.stringify(B.counts) && A.platforms.length === B.platforms.length);
  ok('only the requested rooms have platforms', A.platforms.every((p) => only.includes(p.room)) && A.platforms.length > 0, [...new Set(A.platforms.map((p) => p.room))]);
  let outside = 0, dup = 0, big = 0; const seen = new Set(); for (const p of A.platforms) { if (p.tiles.length > X.HYP.vantageMaxArea) big++; for (const t of p.tiles) { if (RL.room[t] !== p.room || RL.ter[t] + 1 !== p.terrace) outside++; if (seen.has(t)) dup++; seen.add(t); } }
  ok(`every platform tile is in its room and terrace (${outside} outside), no tile in two platforms (${dup}), no platform above ${X.HYP.vantageMaxArea} tiles (${big})`, outside === 0 && dup === 0 && big === 0);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
