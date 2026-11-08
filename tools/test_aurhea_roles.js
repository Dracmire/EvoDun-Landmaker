/* AURHEA'S FOUNTAIN, THE ROLES OF THE OLD MAP (M3b, no browser): the PNGs that `docs/crystallizers/03-stage/refs/dq3/aurheas_fountain/derived/derive_roles.py` writes (five zones from geometric sector rules, heights, trail, POI of the tip of the peninsula, the water)
   read by the SAME path as the built-in source (E.decodePng -> E.imageChannels -> E.packFromRoles with the roles of manifest.json, then pack.masks.water from water.png: `aurheaPack` of src/ui.js does the same), and what the mode 3 rules do with them (src/stage.js, orient.js, props.js, not changed):
   - the script is deterministic: `derive_roles.py --check` (SKIP, not a failure, when python or numpy / scipy / Pillow is missing); the grid it LEARNED (0, 0), 24 x 22 tiles, the counts per class, frozen in the script;
   - 48 x 44 px (24 x 22 old tiles at x2), FIVE zones (south meadow, west, east, north, peninsula), each ONE connected piece, none under 10 tiles, the order of the table (BFS from the lowest mean [R]);
   - the water: 300 px (75 old tiles x 4), every one BLOCKED in S.block, not void, elevation > 0; the water is NOT in any zone;
   - the heights in H that the viewer leaves per class (frozen, measured, not chosen): terraces 1, sub-terraces 5;
   - the footprint rule per window: tiles dropped per zone (no zone loses more than 20 % of its walkable tiles); the POI of the tip is inside the footprint of the peninsula and walkable;
   - the axis, the yaw and the goal of the LAST zone of every window (rules 1-6 with Planes OFF: orient + props only).
     node tools/test_aurhea_roles.js [--dump] */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage', 'orient', 'props']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0; const DUMP = process.argv.includes('--dump'), dump = {};
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const P0 = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":120,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":1,"stairW":3,"stairStyle":0,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":true,"ascWalls":false,"ascHeight":1.5,"pocket":false,"pocketFraming":"auto","pocketHeight":2.5,"backdrop":false,"backdropGap":0,"backdropHeight":2,"roomsMinCore":100,"roomsCross":10,"roomsIsoLimit":100,"rRadius":5,"cake":false,"cakeLayers":3,"cakeStep":0.3,"cakePer":1,"cakeSeam":5,"pocketYaw":180,"chainKey":"","chainFail":"","rampPreferFill":true}');
const DIR = path.join(__dirname, '../docs/crystallizers/03-stage/refs/dq3/aurheas_fountain/derived');
const SC = { terraces: 1, subs: 5 };   // what the example sets
const NAME = { 1: 'south', 2: 'west', 3: 'east', 4: 'north', 5: 'peninsula' };
const WINDOWS = { southPen: [1, 5], pen: [5], south: [1], north: [4], west: [2], east: [3], all: [1, 2, 3, 4, 5] };   // RAW zone ids
const EXP = {"order":[1,2,3,5,4],"heights":{"1":{"median":0.3077,"hist":{"0.308":698,"0.000":6}},"2":{"median":0.3077,"hist":{"0.308":230,"0.000":26}},"3":{"median":0.3077,"hist":{"0.000":26,"0.308":266}},"4":{"median":0.3077,"hist":{"0.308":470,"0.000":10}},"5":{"median":0.9231,"hist":{"0.923":14,"0.308":2}},"water":{"median":0,"hist":{"0.000":284,"0.308":16}},"path":{"median":0.3077,"hist":{"0.308":64}}},"drops":{"southPen":{"zones":{"1":{"walkable":768,"dropped":0,"pct":0},"5":{"walkable":16,"dropped":0,"pct":0}},"waterInWindow":300},"pen":{"zones":{"5":{"walkable":16,"dropped":0,"pct":0}},"waterInWindow":300},"south":{"zones":{"1":{"walkable":768,"dropped":0,"pct":0}},"waterInWindow":300},"north":{"zones":{"4":{"walkable":480,"dropped":0,"pct":0}},"waterInWindow":300},"west":{"zones":{"2":{"walkable":256,"dropped":0,"pct":0}},"waterInWindow":300},"east":{"zones":{"3":{"walkable":292,"dropped":0,"pct":0}},"waterInWindow":300},"all":{"zones":{"1":{"walkable":768,"dropped":0,"pct":0},"2":{"walkable":256,"dropped":0,"pct":0},"3":{"walkable":292,"dropped":0,"pct":0},"4":{"walkable":480,"dropped":0,"pct":0},"5":{"walkable":16,"dropped":0,"pct":0}},"waterInWindow":300}},"goals":{"southPen":{"why":"entry gate -> POI goal","axis":[-0.067,-0.998],"dir":"Z","yaw":0,"goal":{"map":[22,20],"h":0.923},"poi":{"tile":[22,20]}},"pen":{"why":"lowest part -> POI goal","axis":[-0.141,-0.99],"dir":"Z","yaw":0,"goal":{"map":[22,20],"h":0.923},"poi":{"tile":[22,20]}},"south":{"why":"lowest part -> highest part","axis":[0.132,0.991],"dir":"X","yaw":90,"goal":{"map":[0,35],"h":0.308},"poi":null},"north":{"why":"lowest part -> highest part","axis":[0.217,-0.976],"dir":"X","yaw":270,"goal":{"map":[47,4],"h":0.308},"poi":null},"west":{"why":"lowest part -> highest part","axis":[-1,0],"dir":"Hub","yaw":90,"goal":{"map":[0,11],"h":0.308},"poi":null},"east":{"why":"lowest part -> highest part","axis":[1,0],"dir":"Hub","yaw":270,"goal":{"map":[47,11],"h":0.308},"poi":null},"all":{"why":"lowest part -> POI goal","axis":[-0.141,-0.99],"dir":"Z","yaw":0,"goal":{"map":[22,20],"h":0.923},"poi":{"tile":[22,20]}}}};   // frozen (measured 2026-11-08)
(async () => {
  const py = cp.spawnSync('python3', [path.join(DIR, 'derive_roles.py'), '--check'], { encoding: 'utf8' });
  if (py.status === 0) ok('derive_roles.py --check: the committed PNGs and manifest.json are what the script generates (deterministic; grid learned, palette of 21 colours, counts frozen): ' + py.stdout.trim().split('\n').pop(), true);
  else if (/ModuleNotFoundError|No module named/.test(py.stderr)) console.log('SKIP derive_roles.py --check: ' + py.stderr.trim().split('\n').pop());
  else ok('derive_roles.py --check', false, (py.stdout + py.stderr).slice(-600));
  const man = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8')), cache = {};
  const load = async (n) => cache[n] || (cache[n] = await (async () => { const dec = await E.decodePng(fs.readFileSync(path.join(DIR, n))); return Object.assign({ name: n, dec }, E.imageChannels(dec, !!man.flipY)); })());
  const mk = async () => {
    const names = [...new Set(Object.values(man.roles).map((r) => r.image))], imgs = [], roles = {};
    for (const n of names) imgs.push(await load(n));
    for (const [role, r] of Object.entries(man.roles)) roles[role] = { image: names.indexOf(r.image), channel: r.channel };
    const pk = E.packFromRoles(imgs, roles, { name: man.name, maxnode: man.maxnode, markers: [] }), w = await load(man.water.image);
    pk.masks.water = Array.from(w.ch[man.water.channel], (v) => (v > 0.5 ? 1 : 0));   // the same as aurheaPack (src/ui.js)
    return pk;
  };
  const pk = await mk(), W = pk.width, z = pk.fields.zone.ids, n = z.length;
  ok(`48 x 44 px (24 x 22 old tiles at x2), the images share the size (${pk.width} x ${pk.height}), no warnings (${pk.warnings.length})`, pk.width === 48 && pk.height === 44 && pk.warnings.length === 0, pk.warnings);
  const cnt = {}; for (const v of z) cnt[v] = (cnt[v] || 0) + 1;
  ok(`five zones by hue (maxnode ${man.maxnode}); px per zone (x4 per old tile; 0 = the water, outside every zone): ${JSON.stringify(cnt)}`, pk.fields.zone.info.classes.length === 5 && JSON.stringify(cnt) === JSON.stringify({ 0: 300, 1: 768, 2: 256, 3: 292, 4: 480, 5: 16 }), cnt);
  ok('every zone has 10 tiles or more (MIN_PIECE) and is ONE 4-connected piece', (() => { const seen = new Uint8Array(n), pieces = {}; for (let i = 0; i < n; i++) { if (seen[i] || !z[i]) continue; const id = z[i], q = [i]; seen[i] = 1; for (let h = 0; h < q.length; h++) { const j = q[h], x = j % W, y = (j / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= pk.height) continue; const k = yy * W + xx; if (!seen[k] && z[k] === id) { seen[k] = 1; q.push(k); } } } pieces[id] = (pieces[id] || 0) + 1; } return Object.keys(cnt).filter((k) => k > 0).every((k) => pieces[k] === 1 && cnt[k] >= 10); })());
  const tb = E.stage.zoneTable(pk); ok(`the order of the table (hypothesis [R], BFS from the lowest mean): raw ids ${tb.order} (k = ${tb.order.map((r, i) => `${i + 1}:${NAME[r]}`).join(' ')})`, EXP === null || JSON.stringify(tb.order) === JSON.stringify(EXP.order), tb.order); dump.order = tb.order;
  const wt = pk.masks.water; let wn = 0, wInZone = 0, wLow = 0; for (let i = 0; i < n; i++) if (wt[i]) { wn++; if (z[i]) wInZone++; if (!(pk.elevation[i] > 0)) wLow++; }
  ok(`the water: ${wn} px (75 old tiles x 4), none inside a zone (${wInZone}), every elevation > 0 (${wLow} not): it is water, not void`, wn === 300 && wInZone === 0 && wLow === 0);
  const poi = pk.fields.poi.values; let pn = 0, pAt = -1; for (let i = 0; i < n; i++) if (poi[i] > 0.5) { pn++; pAt = i; }
  ok(`POI: 4 px (the 2 x 2 of the tip tile (11, 10) of the old map) in zone ${z[pAt]} (the peninsula)`, pn === 4 && z[pAt] === 5 && (pAt % W) >> 1 === 11 && ((pAt / W) | 0) >> 1 === 10, [pn, z[pAt], pAt]);
  const P = Object.assign({}, P0, { rooms: false, terraces: SC.terraces, subs: SC.subs, minPlateau: 5, spread: 1, terH: 4, subH: 0.88, stairStyle: 0, tread: 1, rampPreferFill: true });
  // heights in H of the whole map, per class
  const S0 = E.shape(pk, P, null), med = (a) => { a = a.slice().sort((x, y) => x - y); return a.length ? +a[a.length >> 1].toFixed(4) : null; }, hist = (a) => { const m = {}; for (const x of a) { const k = x.toFixed(3); m[k] = (m[k] || 0) + 1; } return m; };
  ok('S.block holds EVERY water tile (the water is not walkable) and no water tile is void', (() => { let b = 0, v = 0; for (let i = 0; i < S0.n; i++) if (S0.water[i]) { if (!S0.block[i]) b++; if (S0.void && S0.void[i]) v++; } return b === 0 && v === 0 && S0.water.reduce((s, x) => s + (x ? 1 : 0), 0) === 300; })());
  const bk = { water: [], path: [], 1: [], 2: [], 3: [], 4: [], 5: [] }, tr = pk.fields.path.values;
  for (let i = 0; i < S0.n; i++) { const h = S0.levelH[S0.fine[i]] / 2; if (S0.water[i]) bk.water.push(h); else if (tr[i] > 0.5) bk.path.push(h); else bk[z[i]].push(h); }
  const heights = Object.fromEntries(Object.entries(bk).map(([k, a]) => [k, { median: med(a), hist: hist(a) }]));
  dump.heights = heights;
  ok(`heights in H (terraces ${SC.terraces}, sub-terraces ${SC.subs}), MEDIANS: water ${heights.water.median}, south ${heights[1].median}, west ${heights[2].median}, east ${heights[3].median}, north ${heights[4].median}, peninsula ${heights[5].median}, trail ${heights.path.median}: water < land < peninsula`, heights.water.median < heights[1].median && heights[1].median < heights[5].median && [2, 3, 4].every((k) => heights[k].median === heights[1].median), heights);
  ok('the frozen table of heights in H (measured)', EXP === null || JSON.stringify(heights) === JSON.stringify(EXP.heights), heights);
  // footprint per window
  const drops = {}, goals = {};
  for (const [wn2, raws] of Object.entries(WINDOWS)) {
    const pack = await mk(), t2 = E.stage.zoneTable(pack), ks = raws.map((r) => t2.toK.get(r)), S = E.shape(pack, P, { zones: raws.slice().sort((a, b) => a - b), margin: P.margin }); E.stage.buildZones(S, P, pack, ks);
    const walk = (i) => !S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0, rec = {}; for (const r of raws) rec[r] = { walkable: 0, dropped: 0 };
    for (let i = 0; i < S.n; i++) { const x = S.ox + (i % S.W), y = S.oy + ((i / S.W) | 0), raw = pack.fields.zone.sliceIds[y * W + x], r = rec[raw]; if (!r || !walk(i)) continue; r.walkable++; if (S.stageZones[i] === 0) r.dropped++; }
    for (const r of raws) rec[r].pct = rec[r].walkable ? +(100 * rec[r].dropped / rec[r].walkable).toFixed(1) : 0;
    let waterIn = 0; for (let i = 0; i < S.n; i++) if (S.water[i] && S.block[i]) waterIn++;
    drops[wn2] = { zones: rec, waterInWindow: waterIn };
    const nb = E.orient.compute(S, P, ks, 2), last = nb.byId.get(ks[ks.length - 1]), pr = E.props.compute(S, P, last, { tilesPerH: 2, last: true, next: 0 }), tt = pr.goal ? pr.goal.tile : -1, pg = E.stage.poiGoal(S, ks[ks.length - 1]);
    goals[wn2] = { why: last.why, axis: last.axis, dir: last.dir, yaw: last.yaw, goal: tt < 0 ? null : { map: [S.ox + (tt % S.W), S.oy + ((tt / S.W) | 0)], h: +(pr.goal.h / 2).toFixed(3) }, poi: pg ? { tile: [S.ox + (pg.tile % S.W), S.oy + ((pg.tile / S.W) | 0)] } : null };
  }
  dump.drops = drops; dump.goals = goals;
  ok('no zone loses more than 20 % of its walkable tiles to the footprint rule in any window: ' + JSON.stringify(Object.fromEntries(Object.entries(drops).map(([k, v]) => [k, Object.fromEntries(Object.entries(v.zones).map(([r, a]) => [NAME[r], a.pct]))]))), Object.values(drops).every((v) => Object.values(v.zones).every((a) => a.pct <= 20)), drops);
  ok('the frozen table of drops per window', EXP === null || JSON.stringify(drops) === JSON.stringify(EXP.drops), drops);
  ok('the POI of the tip is the goal of the windows whose last zone is the peninsula ([south, peninsula], [peninsula], all) and it is inside the footprint and walkable', ['southPen', 'pen'].every((w) => goals[w].poi && goals[w].poi.tile.join() === '22,20' && goals[w].goal && goals[w].goal.map.join() === '22,20') || false, goals);
  ok('the frozen table of axis, yaw and goal per window (Planes off)', EXP === null || JSON.stringify(goals) === JSON.stringify(EXP.goals), goals);
  if (DUMP) console.log('DUMP ' + JSON.stringify(dump));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
