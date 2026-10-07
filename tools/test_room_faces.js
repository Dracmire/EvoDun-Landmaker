/* Room borders per tile face (S.roomKind): blocking faces, open transitions (gap) and the ones the tree uses; consistent with the layer and symmetric.
     node tools/test_room_faces.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
(async () => {
  const img = await E.decodePng(fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'))), W = img.width, H = img.height, n = W * H;
  const mk = () => ({ name: 'skeleton', width: W, height: H, elevation: Float32Array.from(img.channels[0], (v) => v / img.max * 1000), masks: {}, markers: [], fields: {} });
  const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, rooms: true };
  const full = mk(), S = E.shape(full, P, null), RL = S.rooms, U = RL.usage, OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const info = S.roomBorderInfo;
  let pairs = 0, sym = 0, bad = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let b = 0; b < 4; b++) {
    const nx = x + OFF[b][0], ny = y + OFF[b][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const i = y * W + x, j = ny * W + nx, r = RL.room[i], r2 = RL.room[j]; if (r <= 0 || r2 <= 0 || r === r2) { if (S.roomKind[i * 4 + b]) bad++; continue; }
    const k = S.roomKind[i * 4 + b], k2 = S.roomKind[j * 4 + (b + 2) % 4], open = RL.rp.has(E.rooms.key(i, j, n));
    if (i < j) pairs++; if (k !== k2) sym++;
    if (open && k === 1) bad++; if (!open && k !== 1) bad++;
  }
  ok('every face between two rooms is classified, both sides agree, nothing else is marked', sym === 0 && bad === 0 && pairs > 1000, [sym, bad, pairs]);
  ok('counts: closed + open + used = the pairs between rooms', info.closed + info.open + info.used === pairs, [info, pairs]);
  ok('open + used = the valid room transition pairs of the layer', info.open + info.used === RL.expand.transitionPairs && info.open + info.used === RL.rp.size, [info, RL.expand.transitionPairs, RL.rp.size]);
  ok('used = the transition pairs the global tree crosses', info.used === U.usedRoom.size && info.used > 10, [info.used, U.usedRoom.size]);
  ok('blocking faces are the large majority (rooms are mostly walled)', info.closed > info.open, info);
  // a slice: window faces only, used = what THIS slice uses (kept + patch)
  const rooms = RL.rooms.map((r) => r.id).slice(0, 3), C = E.shape(full, P, { rooms, margin: 6 }), ci = C.roomBorderInfo, su = C.sliceUse;
  ok('a slice counts the faces of its window and the transitions its own tree uses', ci.closed + ci.open + ci.used > 0 && ci.used <= su.room.size, [ci, su.room.size]);
  const full0 = E.shape(full, { ...P, rooms: false }, null);
  ok('rooms off: no faces', full0.roomKind === undefined && full0.roomBits === undefined);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
