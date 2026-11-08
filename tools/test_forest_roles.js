/* FOREST, THE ROLES OF THE OLD MAP (M3a, no browser): the PNGs that `docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated/derive_roles.py` writes (zones of v53, heights A and B, trail, POI, blocked tiles) read by the SAME path as "Your images"
   (E.decodePng -> E.imageChannels -> E.packFromRoles with the roles of manifest.json), and what the mode 3 rules do with them (src/stage.js `zoneTable` / `buildZones`):
   - the script is deterministic: `derive_roles.py --check` finds the committed files equal to what it generates (SKIP, not a failure, when python or one of numpy / scipy / scikit-learn / Pillow is missing);
   - 52 x 46 px (26 x 23 old tiles at x2), five zones, the order of the table (a hypothesis [R]: BFS from the lowest mean), the counts of the grid of v53;
   - the heights: A has the greys 20 / 26 / 32 / 90 (valley and trails / slope / plateaus / tower), B five bands; the HEIGHTS IN H that the viewer leaves per class are a frozen table (measured, not chosen): A = terraces 2, sub-terraces 6; B = terraces 6, sub-terraces 3;
   - the tower (cols 17-21, rows 2-10 of the old map) is not walkable: through the PNG route it is a piece apart (no ramp reaches it) that the footprint rule drops; with the blocked mask (the built-in route) it is blocked;
   - the footprint rule: tiles dropped per zone and window, frozen (REPORTED, the rule is not changed).
     node tools/test_forest_roles.js [--dump] */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0; const DUMP = process.argv.includes('--dump'), dump = {};
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const P0 = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":120,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":1,"stairW":3,"stairStyle":0,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":true,"ascWalls":false,"ascHeight":1.5,"pocket":false,"pocketFraming":"auto","pocketHeight":2.5,"backdrop":false,"backdropGap":0,"backdropHeight":2,"roomsMinCore":100,"roomsCross":10,"roomsIsoLimit":100,"rRadius":5,"cake":false,"cakeLayers":3,"cakeStep":0.3,"cakePer":1,"cakeSeam":5,"pocketYaw":180,"chainKey":"","chainFail":"","rampPreferFill":true}');
const DIR = path.join(__dirname, '../docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated');
const VARIANT = { A: { terraces: 2, subs: 6 }, B: { terraces: 6, subs: 3 } };   // what the example of each variant sets (M3a)
// frozen (measured 2026-11-08): median height in H of each class of tiles; footprint tiles dropped by zone (window numbering k = place in the BFS order: 1 valley, 2 plateau SW, 3 slope, 4 plateau NW, 5 plateau N) for the windows [1] (valley), [1, 3, 5] (valley, slope, plateau N: the way to the tower) and [5] (plateau N with the tower); `png` = the PNGs alone, `blk` = with the blocked mask (the built-in route)
const EXP = {"heights":{"A":{"1":0,"2":0.5333,"3":0.5333,"4":0.5333,"5":0.2667,"tower":3.3333,"trail":0,"levels":4},"B":{"1":0,"2":4,"3":6,"4":4,"5":2,"tower":10.88,"trail":2,"levels":5}},"drops":{"A":{"png [1]":{"walkable":{"1":604},"dropped":{"1":0},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0},"png [1,3,5]":{"walkable":{"1":604,"3":696,"5":616},"dropped":{"1":0,"3":279,"5":207},"towerTiles":180,"towerWalkable":180,"towerInFootprint":0,"towerTopReachedByWalking":0},"png [5]":{"walkable":{"5":616},"dropped":{"5":199},"towerTiles":180,"towerWalkable":180,"towerInFootprint":0,"towerTopReachedByWalking":0},"blk [1]":{"walkable":{"1":360},"dropped":{"1":100},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0},"blk [1,3,5]":{"walkable":{"1":360,"3":412,"5":256},"dropped":{"1":100,"3":276,"5":17},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0},"blk [5]":{"walkable":{"5":256},"dropped":{"5":9},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0}},"B":{"png [1]":{"walkable":{"1":604},"dropped":{"1":0},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0},"png [1,3,5]":{"walkable":{"1":604,"3":696,"5":616},"dropped":{"1":0,"3":316,"5":256},"towerTiles":180,"towerWalkable":180,"towerInFootprint":0,"towerTopReachedByWalking":0},"png [5]":{"walkable":{"5":616},"dropped":{"5":207},"towerTiles":180,"towerWalkable":180,"towerInFootprint":0,"towerTopReachedByWalking":0},"blk [1]":{"walkable":{"1":360},"dropped":{"1":100},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0},"blk [1,3,5]":{"walkable":{"1":360,"3":412,"5":256},"dropped":{"1":100,"3":301,"5":35},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0},"blk [5]":{"walkable":{"5":256},"dropped":{"5":28},"towerTiles":180,"towerWalkable":0,"towerInFootprint":0,"towerTopReachedByWalking":0}}}};
(async () => {
  // 1. determinism of the script
  const py = cp.spawnSync('python3', [path.join(DIR, 'derive_roles.py'), '--check'], { encoding: 'utf8' });
  if (py.status === 0) ok('derive_roles.py --check: the committed PNGs and manifest.json are what the script generates (deterministic) and the zone grid is the v53 one: ' + py.stdout.trim().split('\n').pop(), true);
  else if (/ModuleNotFoundError|No module named/.test(py.stderr)) console.log('SKIP derive_roles.py --check: ' + py.stderr.trim().split('\n').pop());
  else ok('derive_roles.py --check', false, (py.stdout + py.stderr).slice(-600));
  // 2. the files through the path of "Your images"
  const man = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
  const cache = {}, load = async (n) => cache[n] || (cache[n] = await (async () => { const dec = await E.decodePng(fs.readFileSync(path.join(DIR, n))); return Object.assign({ name: n, dec }, E.imageChannels(dec, !!man.flipY)); })());
  const mk = async (variant, blocked) => {
    const names = [...new Set(Object.values(man.roles).map((r) => r.image))], roles = {}, imgs = [];
    const elev = man.variants[variant].elevation.image; const use = Object.assign({}, man.roles, { elevation: { image: elev, channel: 'V' } });
    for (const n of [...new Set(Object.values(use).map((r) => r.image))]) imgs.push(await load(n));
    for (const [role, r] of Object.entries(use)) roles[role] = { image: [...new Set(Object.values(use).map((q) => q.image))].indexOf(r.image), channel: r.channel };
    const pk = E.packFromRoles(imgs, roles, { name: man.name, maxnode: man.maxnode, markers: [] });
    if (blocked) pk.masks = { water: Array.from(pk.fields.vegetation.values, (v) => (v > 0.5 ? 1 : 0)) };
    return pk;
  };
  const pA = await mk('A'), pB = await mk('B');
  ok(`52 x 46 px (26 x 23 old tiles at x2), the images of the pack share the size (${pA.width} x ${pA.height})`, pA.width === 52 && pA.height === 46 && pB.width === 52 && pB.height === 46);
  ok(`five zones by hue (maxnode ${man.maxnode}), no unreliable hue (${pA.warnings.length} warnings)`, pA.fields.zone.info.classes.length === 5 && pA.warnings.length === 0, pA.warnings);
  const tbA = E.stage.zoneTable(pA), tbB = E.stage.zoneTable(pB);
  ok(`the order of the table (hypothesis [R], BFS from the lowest mean): raw ids ${tbA.order} in both variants (1 valley, 3 plateau SW, 5 slope, 2 plateau NW, 4 plateau N)`, tbA.order.join() === '1,3,5,2,4' && tbB.order.join() === '1,3,5,2,4', [tbA.order, tbB.order]);
  const z = pA.fields.zone.ids, cnt = {}; for (const v of z) cnt[v] = (cnt[v] || 0) + 1;
  ok(`the zones of the v53 grid at x4 px per old tile pair: ${JSON.stringify(cnt)}`, JSON.stringify(cnt) === JSON.stringify({ 1: 604, 2: 376, 3: 100, 4: 616, 5: 696 }), cnt);
  const greys = (pk) => [...new Set(Array.from(pk.elevation, (v) => Math.round(v / 1000 * 255)))].sort((a, b) => a - b);
  ok(`heights A: grey ${greys(pA)} (valley and trails 20 = 0 H, slope 26 = 0.3 H, plateaus 32 = 0.6 H, tower 90 = 3.5 H); heights B: grey ${greys(pB)}`, greys(pA).join() === '20,26,32,90' && greys(pB).join() === '20,33,45,57,92', [greys(pA), greys(pB)]);
  // 3. the viewer: heights in H, the footprint
  const heights = {}, drops = {};
  for (const [v, pk0] of [['A', pA], ['B', pB]]) {
    const q = VARIANT[v], P = Object.assign({}, P0, { rooms: false, terraces: q.terraces, subs: q.subs, minPlateau: 5, spread: 1, terH: 4, subH: 0.88, stairStyle: 0, tread: 1, rampPreferFill: true });
    const S0 = E.shape(await mk(v, false), P, null), W = pk0.width, zid = pk0.fields.zone.ids, tr = pk0.fields.path.values, med = (a) => { a.sort((x, y) => x - y); return a.length ? +a[a.length >> 1].toFixed(4) : null; };
    const bk = { 1: [], 2: [], 3: [], 4: [], 5: [], tower: [], trail: [] };
    for (let i = 0; i < S0.n; i++) { const h = E.stage.feetH(S0, i) / 2, tx = (i % W) >> 1, ty = ((i / W) | 0) >> 1; if (tx >= 17 && tx <= 21 && ty >= 2 && ty <= 10) bk.tower.push(h); else if (tr[i] > 0.5) bk.trail.push(h); else bk[zid[i]].push(h); }
    heights[v] = Object.fromEntries(Object.entries(bk).map(([k, a]) => [k, med(a)]));
    const lv = new Set(Object.values(heights[v]).filter((x) => x !== null)); heights[v].levels = lv.size;
    drops[v] = {};
    for (const blk of [false, true]) for (const ks of [[1], [1, 3, 5], [5]]) {
      const pack = await mk(v, blk), tb = E.stage.zoneTable(pack), S = E.shape(pack, P, { zones: ks.map((k) => tb.order[k - 1]).sort((a, b) => a - b), margin: P.margin }); E.stage.buildZones(S, P, pack, ks);
      const nb = E.walkGraph(S, P), walk = (i) => !S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0, tot = {}, foot = {}; let towerWalk = 0, towerInFoot = 0, towerReach = 0, towerTiles = 0;
      for (let i = 0; i < S.n; i++) { const x = S.ox + (i % S.W), y = S.oy + ((i / S.W) | 0), k = tb.toK.get(pack.fields.zone.sliceIds[y * W + x]); if (k && ks.includes(k) && walk(i)) { tot[k] = (tot[k] || 0) + 1; if (S.stageZones[i] === k) foot[k] = (foot[k] || 0) + 1; } if (((x >> 1) >= 17 && (x >> 1) <= 21 && (y >> 1) >= 2 && (y >> 1) <= 10)) { towerTiles++; if (walk(i)) towerWalk++; if (S.stageZones[i] && ks.includes(S.stageZones[i]) && walk(i) && E.stage.feetH(S, i) / 2 >= heights[v].tower - 1e-6) towerInFoot++; } }
      // is any tower tile connected by walking to the footprint of the window? (BFS from every footprint tile)
      const seen = new Uint8Array(S.n), q2 = []; for (let i = 0; i < S.n; i++) if (S.stageZones[i] && walk(i)) { seen[i] = 1; q2.push(i); } for (let h = 0; h < q2.length; h++) for (const j of nb(q2[h])) if (!seen[j] && walk(j)) { seen[j] = 1; q2.push(j); }
      for (let i = 0; i < S.n; i++) { const x = S.ox + (i % S.W), y = S.oy + ((i / S.W) | 0); if ((x >> 1) >= 17 && (x >> 1) <= 21 && (y >> 1) >= 2 && (y >> 1) <= 10 && seen[i] && E.stage.feetH(S, i) / 2 >= heights[v].tower - 1e-6) towerReach++; }
      const key = (blk ? 'blk ' : 'png ') + JSON.stringify(ks);
      drops[v][key] = { walkable: tot, dropped: S.stageZonesInfo.discarded, towerTiles, towerWalkable: towerWalk, towerInFootprint: towerInFoot, towerTopReachedByWalking: towerReach };
    }
  }
  dump.heights = heights; dump.drops = drops;
  if (DUMP) { console.log(JSON.stringify(dump, null, 1)); process.exit(0); }
  ok('A (terraces 2, sub-terraces 6): the heights in H per class of the viewer = the frozen table ' + JSON.stringify(heights.A), JSON.stringify(heights.A) === JSON.stringify(EXP.heights.A), heights.A);
  ok('B (terraces 6, sub-terraces 3): the heights in H per class of the viewer = the frozen table ' + JSON.stringify(heights.B), JSON.stringify(heights.B) === JSON.stringify(EXP.heights.B), heights.B);
  ok(`A has at least 3 distinct levels (${heights.A.levels}) and keeps the order valley < slope < plateaus < tower; B separates every pair of neighbouring zones by at least one terrace step (2 H)`,
    heights.A.levels >= 3 && heights.A[1] < heights.A[5] && heights.A[5] < heights.A[4] && heights.A[4] < heights.A.tower && [[1, 3], [1, 5], [2, 3], [2, 5], [3, 5], [4, 5]].every(([a, b]) => Math.abs(heights.B[a] - heights.B[b]) >= 2 - 1e-9), [heights.A, heights.B]);
  for (const v of ['A', 'B']) {
    ok(`${v}: the tower is not walkable. PNG route: a piece apart, no ramp reaches its top (tiles at the tower height reached by walking from the window: ${drops[v]['png [1,3,5]'].towerTopReachedByWalking} of ${drops[v]['png [1,3,5]'].towerTiles} tiles) and the footprint rule drops it (${drops[v]['png [1,3,5]'].towerInFootprint} tiles at the tower height in the footprint; a ramp may cut a tile or two of the tower box lower down); blocked route: ${drops[v]['blk [1,3,5]'].towerWalkable} walkable tiles`,
      drops[v]['png [1,3,5]'].towerTopReachedByWalking === 0 && drops[v]['png [1,3,5]'].towerInFootprint === 0 && drops[v]['blk [1,3,5]'].towerWalkable === 0 && drops[v]['blk [5]'].towerWalkable === 0 && drops[v]['png [5]'].towerInFootprint === 0, drops[v]);
    ok(`${v}: the footprint rule drops per zone (frozen; REPORTED): ` + JSON.stringify(drops[v]), JSON.stringify(drops[v]) === JSON.stringify(EXP.drops[v]), drops[v]);
  }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
