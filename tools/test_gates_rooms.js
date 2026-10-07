/* Rooms on: ramps only where the spanning tree crosses a terrace gate, at the exact pair; crossings closer than passGap are merged; sub-terraces are only
   visual; rooms off is the viewer without rooms. Real map: data/samples/skeleton_heightmap_256.png.
     node tools/test_gates_rooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
(async () => {
  const img = await E.decodePng(fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'))), W = img.width, H = img.height, n = W * H;
  const mk = () => ({ name: 'skeleton', width: W, height: H, elevation: Float32Array.from(img.channels[0], (v) => v / img.max * 1000), masks: {}, markers: [], fields: {} });
  const base = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10 };
  const full = mk(), P = { ...base, rooms: true }, S = E.shape(full, P, null), RL = S.rooms, U = RL.usage;
  ok('the layer exists and the tree uses far fewer gates than there are candidates', RL && U.usedGateGroups > 50 && U.usedGateGroups < RL.gateStats.groups / 2, [U.usedGateGroups, RL.gateStats.groups]);
  // every site is a candidate pair (low tile a, high tile b one terrace up, same room), at the exact crossing
  let notCand = 0, notUp = 0, notRoom = 0; const mapOf = (i) => i; // whole map: window = map
  for (const s of S.passes) { const k = E.rooms.key(mapOf(s.a), mapOf(s.b), n); if (!RL.gp.has(k)) notCand++; if (S.ter[s.b] !== S.ter[s.a] + 1) notUp++; if (RL.room[s.a] !== RL.room[s.b]) notRoom++; }
  ok('every site is a candidate gate pair, low -> high, in one room', S.passes.length > 0 && notCand === 0 && notUp === 0 && notRoom === 0, [notCand, notUp, notRoom]);
  ok('sites are exactly the used pairs that survived the merge (and the merge is small)', S.passes.length <= U.usedGatePairs && S.passes.length >= U.usedGatePairs - 5 * S.roomGates.merged - 5, [S.passes.length, U.usedGatePairs, S.roomGates.merged]);
  // every used crossing has a site of the same gate group within passGap, and sites of one group are at least passGap apart
  const gid = (t) => U.gateGroupOf.get(t); const siteG = S.passes.map((s) => ({ g: gid(s.a), x: s.a % W, y: (s.a / W) | 0 }));
  let uncovered = 0; for (const [k] of U.usedGate) { const a = Math.floor(k / n), b = k % n, low = S.ter[a] < S.ter[b] ? a : b, x = low % W, y = (low / W) | 0, g = gid(low); if (!siteG.some((s) => s.g === g && Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < P.passGap)) uncovered++; }
  ok('every used crossing is within passGap of a site of its gate group', uncovered === 0, uncovered);
  let close = 0; for (let i = 0; i < siteG.length; i++) for (let j = i + 1; j < siteG.length; j++) if (siteG[i].g === siteG[j].g && Math.max(Math.abs(siteG[i].x - siteG[j].x), Math.abs(siteG[i].y - siteG[j].y)) < P.passGap) close++;
  ok('two sites of one gate group are at least passGap apart', close === 0, close);
  ok('ramps were carved on (almost) all sites', S.stairs.length >= S.passes.length - 3 && S.stairs.every((r) => r.ramp), [S.stairs.length, S.passes.length]);
  // sub-terraces are visual only: the walk regions do not depend on the climb limit
  const a1 = E.shape(mk(), { ...P, climb: 0 }, null), a5 = E.shape(mk(), { ...P, climb: 5 }, null);
  ok('with rooms on the climb limit does not change the walk regions', JSON.stringify(a1.regionSizes) === JSON.stringify(a5.regionSizes), [a1.regionSizes.length, a5.regionSizes.length]);
  const o1 = E.shape(mk(), { ...base }, null);
  // rooms off: the gates of the viewer (every terrace and sub-terrace gate), no layer
  ok('rooms off: no layer, many more gates', o1.rooms === null && o1.gates.length > 3 * S.gates.length, [o1.gates.length, S.gates.length]);
  // a crop: sites inside the window only, tiles unblocked
  const c = E.shape(mk(), P, { rect: [60, 60, 180, 180], margin: 6 }); let bad = 0;
  for (const s of c.passes) if (c.block[s.a] || c.block[s.b] || c.ter[s.b] !== c.ter[s.a] + 1) bad++;
  ok('a crop keeps the global tree gates that fall inside it', c.passes.length > 0 && c.passes.length < S.passes.length && bad === 0, [c.passes.length, bad]);
  // the minimum core size changes what the tree needs
  const lo = E.shape(mk(), { ...P, roomsMinCore: 5 }, null), hi = E.shape(mk(), { ...P, roomsMinCore: 60 }, null);
  ok('a larger minimum core size needs fewer ramps', hi.passes.length < S.passes.length && S.passes.length < lo.passes.length, [hi.passes.length, S.passes.length, lo.passes.length]);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
