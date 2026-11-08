/* STAGE ZONES OF A PNG, PR M2b (src/stage.js `zoneTable` / `buildZones`, no browser): the Stage rules (orientation C1, planes C2, props C3 / P1) run on the ZONES of an image (role `zone`) with the levels of its role `elevation`,
   on the synthetic fixture of tools/ui/gen_maps.py (3 zones in a chain, a pond of void in zone B, an island of 25 walkable tiles apart in zone C; generated with `python3 tools/ui/gen_maps.py`, never committed).
   - the ORDER of the zones (a hypothesis [R]: BFS from the lowest mean elevation) and the table raw id -> 1..N;
   - the FOOTPRINT: only the largest connected piece of a zone of the window; the island (25 tiles) is dropped and counted, nothing else is;
   - orientation: the gates of the chain (entry / exit), the axis along the chain; planes: the walkable heights never change; props: a path, torch pairs, door pillars in the zones that have an exit, the goal only in the last zone, and nothing on the dropped island;
   - E.stage.zoneMap keeps DAC rooms as they were (S.roomMap) when there is no S.stageZones.
     node tools/test_stage_zones.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage', 'orient', 'planes', 'props']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const P0 = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":120,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":1,"stairW":3,"stairStyle":0,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":true,"ascWalls":false,"ascHeight":1.5,"pocket":false,"pocketFraming":"auto","pocketHeight":2.5,"backdrop":false,"backdropGap":0,"backdropHeight":2,"roomsMinCore":100,"roomsCross":10,"roomsIsoLimit":100,"rRadius":5,"cake":false,"cakeLayers":3,"cakeStep":0.3,"cakePer":1,"cakeSeam":5,"pocketYaw":180,"chainKey":"","chainFail":"","rampPreferFill":true}');
// [direction, yaw, wall, columns, front lowered, void tiles used] of a window of one zone; [path steps, torches, pillars, goal tile] of a zone of the window [1, 2, 3]
const EXP_PLANES = { 1: ['Z', 270, 40, 23, 0, 23], 2: ['Z', 270, 40, 24, 8, 24], 3: ['Z', 270, 0, 23, 0, 23] }, EXP_PROPS = [[33, 7, 0, -1], [60, 10, 0, -1], [56, 13, 0, 4031]];
const DIR = path.join(__dirname, 'ui/.cache/maps_stage');
if (!fs.existsSync(path.join(DIR, 'height.png'))) cp.execFileSync('python3', [path.join(__dirname, 'ui/gen_maps.py')], { stdio: 'ignore' });
const P = Object.assign({}, P0, { rooms: false, terraces: 5, minPlateau: 5, spread: 1, terH: 4, subH: 0.88, stairStyle: 0, tread: 1, rampPreferFill: true });
(async () => {
  const load = async (n) => { const dec = await E.decodePng(fs.readFileSync(path.join(DIR, n + '.png'))); return Object.assign({ name: n + '.png', dec }, E.imageChannels(dec, false)); };
  const imgs = [await load('height'), await load('zones'), await load('path')];
  const mk = () => E.packFromRoles(imgs, { elevation: { image: 0, channel: 'V' }, zone: { image: 1, channel: 'H' }, path: { image: 2, channel: 'V' } }, { name: 'fixture', maxnode: 0, markers: [] });
  const pack = mk(), tb = E.stage.zoneTable(pack);
  const build = (ks) => { const S = E.shape(mk(), P, { zones: ks.map((k) => tb.order[k - 1]).sort((a, b) => a - b), margin: P.margin }); E.stage.buildZones(S, P, pack, ks); return S; };
  // the order and the table
  ok(`the zone table: ${tb.order.length} zones in the order ${tb.order} (BFS from the lowest mean elevation: ${tb.mean.map((m) => m.toFixed(0))}), ids 1..N`, tb.order.length === 3 && tb.order.every((r, k) => tb.toK.get(r) === k + 1) && tb.mean[0] < tb.mean[1] && tb.mean[1] < tb.mean[2], { order: tb.order, mean: tb.mean });
  // the footprint
  const W3 = build([1, 2, 3]), I3 = W3.stageZonesInfo;
  ok(`the window [1, 2, 3]: only the island is dropped (${JSON.stringify(I3.discarded)}, total ${I3.total}), the zone map has only the ids 0..3`, I3.total === 25 && I3.discarded[3] === 25 && I3.discarded[1] === 0 && I3.discarded[2] === 0 && [...new Set(W3.stageZones)].every((v) => v >= 0 && v <= 3), I3);
  const dropped = []; for (let i = 0; i < W3.n; i++) if (!W3.block[i] && W3.region[i] >= 0 && !(W3.void && W3.void[i]) && W3.stageZones[i] === 0 && E.stage.zoneMap(W3)[i] === 0) { const x = W3.ox + (i % W3.W), y = W3.oy + ((i / W3.W) | 0); if (x >= 82 && x <= 86 && y >= 45 && y <= 49) dropped.push(i); }
  ok(`the dropped tiles are the 5 x 5 island of the fixture (x 82-86, y 45-49): ${dropped.length} tiles`, dropped.length === 25, dropped.length);
  ok('a window of one zone: zone 3 alone drops the same 25, zone 1 alone drops none', build([3]).stageZonesInfo.total === 25 && build([1]).stageZonesInfo.total === 0);
  // E.stage.zoneMap
  { const S = { roomMap: Int32Array.of(1, 2), stageZones: undefined }; ok('E.stage.zoneMap: S.roomMap when there is no S.stageZones (DAC), S.stageZones when there is', E.stage.zoneMap(S) === S.roomMap && E.stage.zoneMap({ roomMap: S.roomMap, stageZones: Int32Array.of(3) })[0] === 3); }
  // orientation
  const T = E.orient.compute(W3, P, [1, 2, 3], 2), R = Object.fromEntries(T.rooms.map((r) => [r.id, r]));
  ok(`orientation of the chain: zone 1 has an exit gate and no entry, zone 2 both, zone 3 an entry and no exit (${T.rooms.map((r) => r.id + ':' + r.why).join('; ')})`, !R[1].entry && R[1].exit && R[2].entry && R[2].exit && R[3].entry && !R[3].exit, T.rooms.map((r) => r.why));
  ok(`the axis of zone 2 runs along the chain (+x, ${R[2].axis}) and every yaw is a multiple of 90 (${T.rooms.map((r) => r.yaw)})`, R[2].axis[0] > 0.9 && T.rooms.every((r) => r.yaw % 90 === 0), R[2].axis);
  // planes: the walkable heights never change
  const walkH = (S) => { const o = []; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i])) o.push(S.levelH[S.fine[i]]); return o; };
  const tab = {}; let same = true;
  for (const k of [1, 2, 3]) { const S = build([k]), rec = E.orient.compute(S, P, [k], 2).byId.get(k), before = walkH(S), r = E.planes.apply(S, { room: rec, yaw: rec.yaw, tilesPerH: 2 }), after = walkH(S); tab[k] = [rec.dir, rec.yaw, r.wall, r.cols, r.front, r.voidTiles]; same = same && before.length === after.length && before.every((h, q) => Math.abs(h - after[q]) < 1e-9); }
  ok('planes on every zone of the fixture: no walkable tile changes height; (a window of one zone) table [direction, yaw, wall, columns, front lowered, void tiles used] = ' + JSON.stringify(tab), same && EXP_PLANES && JSON.stringify(tab) === JSON.stringify(EXP_PLANES), tab);
  // props
  const dropSet = new Set(dropped), pr = {};
  for (const k of [1, 2, 3]) { const d = E.props.compute(W3, P, R[k], { tilesPerH: 2, last: k === 3, next: k < 3 ? k + 1 : 0 }); pr[k] = [d.path.length, d.torches.length, d.pillars.length, d.goal ? d.goal.tile : -1]; pr[k].bad = d.noPath || [...d.torches, ...d.pillars].some((t) => dropSet.has(t.tile)) || (d.goal && dropSet.has(d.goal.tile)); }
  ok('props on every zone: a path and torch pairs in each, the goal only in zone 3, nothing on the dropped island (the gate between two zones spans the whole 20-tile strip, so no door pillar fits: 0); table [path, torches, pillars, goal tile] = ' + JSON.stringify(Object.values(pr).map((a) => a.slice(0, 4))), !pr[1].bad && !pr[2].bad && !pr[3].bad && pr[1][1] > 0 && pr[2][1] > 0 && pr[3][1] > 0 && pr[1][3] < 0 && pr[2][3] < 0 && pr[3][3] >= 0 && EXP_PROPS && JSON.stringify(Object.values(pr).map((a) => a.slice(0, 4))) === JSON.stringify(EXP_PROPS), pr);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
