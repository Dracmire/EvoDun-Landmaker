/* THE THRONE WORLD, COMMIT 1 (no browser): the role PNGs of docs/crystallizers/03-stage/refs/dq3/throne_aliahan/ ("MAPA 1", the throne room of Aliahan read by hand from the SFC half of the paired shot) read by the SAME path as a loaded file
   (E.decodePng -> E.imageChannels -> E.packFromRoles with the manifest.json roles), and what map1.txt says:
   - derive_roles.py is deterministic: `--check` finds the committed PNGs and manifest.json equal to what it generates (SKIP, not a failure, when python, numpy or Pillow is missing);
   - the image is 34 x 34 px (17 x 17 old tiles at x2), THREE zones by hue (maxnode 3), no unreliable hue; the tiles per zone are the ones of map1.txt x 4 (NAVE 624 = the dais, the carpet, the side floor, the entrance passage and its landing: ONE walkable zone, PILLAR 24, WALL 508);
   - NAVE and WALL are ONE 4-connected piece each; PILLAR is SIX loose pieces of 2 x 2 px (the six pillars);
   - the heights: the greys of map1.txt (the sub-levels 0..5 of the nave at 20 / 23 / 25 / 27 / 29 / 31, the walls 52), and the viewer's shape with the declared parameters (terraces 2, subs 8, pre 0, tilesPerH 1.5) gives the six sub-levels 0, 0.21 ... 1.05 H on the walkable zones (5 sub-levels = 1.05 H against 0.94 H of the remake) and the walls at 4.05 H;
   - the path mask is 255 on the carpet (nave + entrance passage) and the poi mask on the throne tile only.
     node tools/test_throne_pack.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const DIR = path.join(__dirname, '../docs/crystallizers/03-stage/refs/dq3/throne_aliahan');
const GRID = fs.readFileSync(path.join(DIR, 'map1.txt'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
const P0 = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":5,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":2,"stairW":3,"stairStyle":1,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":false,"ascWalls":false}');
(async () => {
  // 1. determinism of the script
  const py = cp.spawnSync('python3', [path.join(DIR, 'derive_roles.py'), '--check'], { encoding: 'utf8' });
  if (py.status === 0) ok('derive_roles.py --check: the committed PNGs and manifest.json are what the script generates (deterministic): ' + py.stdout.trim().split('\n')[0], true);
  else if (/ModuleNotFoundError|No module named/.test(py.stderr)) console.log('SKIP derive_roles.py --check: ' + py.stderr.trim().split('\n').pop());
  else ok('derive_roles.py --check', false, (py.stdout + py.stderr).slice(-600));
  // 2. the grid
  ok(`map1.txt is a ${GRID[0].length} x ${GRID.length} grid of old tiles with every row of the same length`, GRID.length === 17 && GRID.every((r) => r.length === 17));
  const man = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8')), cache = {};
  const load = async (n) => cache[n] || (cache[n] = await (async () => { const dec = await E.decodePng(fs.readFileSync(path.join(DIR, n))); return Object.assign({ name: n, dec }, E.imageChannels(dec, !!man.flipY)); })());
  const names = [...new Set(Object.values(man.roles).map((r) => r.image))], imgs = [], roles = {};
  for (const n of names) imgs.push(await load(n)); for (const [role, r] of Object.entries(man.roles)) roles[role] = { image: names.indexOf(r.image), channel: r.channel };
  const pk = E.packFromRoles(imgs, roles, { name: man.name, maxnode: man.maxnode, markers: [] }), W = pk.width, H = pk.height;
  ok(`34 x 34 px (17 x 17 old tiles at x2); three zones by hue (maxnode ${man.maxnode}), no unreliable hue (${pk.warnings.length} warnings)`, W === 34 && H === 34 && pk.fields.zone.info.classes.length === 3 && pk.warnings.length === 0, pk.warnings);
  const z = pk.fields.zone.ids, cnt = {}; for (const v of z) cnt[v] = (cnt[v] || 0) + 1;
  const want = { 1: 0, 2: 0, 3: 0 }; for (const r of GRID) for (const c of r) { const k = /[0-5a-fTGE]/.test(c) ? 1 : /[PQ]/.test(c) ? 2 : 3; want[k] += 4; }
  ok(`tiles per zone = the grid x 4: NAVE ${cnt[1]} (ONE walkable zone, the entrance included), PILLAR ${cnt[2]}, WALL ${cnt[3]}`, JSON.stringify(cnt) === JSON.stringify(want) && cnt[1] === 624 && cnt[2] === 24 && cnt[3] === 508, [cnt, want]);
  const pieces = (id) => { const seen = new Uint8Array(z.length), out = []; for (let i = 0; i < z.length; i++) { if (seen[i] || z[i] !== id) continue; const q = [i]; seen[i] = 1; for (let h = 0; h < q.length; h++) { const j = q[h], x = j % W, y = (j / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const k = yy * W + xx; if (!seen[k] && z[k] === id) { seen[k] = 1; q.push(k); } } } out.push(q); } return out; };
  const pc = { 1: pieces(1), 2: pieces(2), 3: pieces(3) };
  ok(`NAVE and WALL are ONE 4-connected piece each (${pc[1].length}, ${pc[3].length}); PILLAR is ${pc[2].length} loose pieces of ${[...new Set(pc[2].map((q) => q.length))]} tiles (2 x 2 px: the six pillars)`, pc[1].length === 1 && pc[3].length === 1 && pc[2].length === 6 && pc[2].every((q) => q.length === 4), Object.fromEntries(Object.entries(pc).map(([k, v]) => [k, v.map((q) => q.length)])));
  // pillars: inside the footprint of the nave (every pillar tile has nave tiles on its four sides) and 2.1 old tiles from the wall (column 3 / 14 of 17)
  { const nav = (x, y) => z[y * W + x] === 1; const inside = pc[2].every((q) => q.every((i) => { const x = i % W, y = (i / W) | 0; return [[x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2]].some(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && nav(a, b)); }));
    const cols = [...new Set(pc[2].map((q) => Math.min(...q.map((i) => i % W)) >> 1))].sort((a, b) => a - b), rows = [...new Set(pc[2].map((q) => Math.min(...q.map((i) => (i / W) | 0)) >> 1))].sort((a, b) => a - b);
    ok(`the six pillars stand at the old columns ${cols} (the axis of the carpet is x = 8.5: +-5, the measured +-5.5 rounded to the tile) and rows ${rows} (every ~4 old tiles), each touching nave tiles`, inside && cols.join() === '3,13' && rows.join() === '2,6,10', { inside, cols, rows }); }
  // 3. the heights and the masks
  const greys = [...new Set(Array.from(pk.elevation, (v) => Math.round(v / 1000 * 255)))].sort((a, b) => a - b);
  ok(`greys ${greys}: the sub-levels 0..5 of the nave at 20 / 23 / 25 / 27 / 29 / 31 (the middle of 2-grey bands), the walls at 52 (3.47 H)`, greys.join() === '20,23,25,27,29,31,52', greys);
  { const pa = pk.fields.path.values, po = pk.fields.poi.values; let np = 0, nq = 0, bad = 0; for (let i = 0; i < pa.length; i++) { const car = /[a-fTG]/.test(GRID[(i / W) >> 1][(i % W) >> 1]); if (pa[i] > 0.5) np++; if (po[i] > 0.5) nq++; if ((pa[i] > 0.5) !== car) bad++; }
    ok(`the path mask is 255 exactly on the carpet (${np} px: 7 x 10 nave rows + 2 x 3 passage, at x4) and the poi mask on the throne tile only (${nq} px, the tile (8, 3))`, np === 4 * (70 + 6) && nq === 4 && bad === 0 && po[7 * W + 16] > 0.5, { np, nq, bad }); }
  // 4. the viewer's shape with what the example declares: terraces 2, subs 8, pre 0, tilesPerH 1.5 (terH = 2 H x 1.5 = 3, subH = 0.22 x 3)
  const P = Object.assign({}, P0, { rooms: false, terraces: 2, subs: 8, pre: 0, minPlateau: 5, spread: 1, terH: 3, subH: 0.66, stairStyle: 0, tread: 1, rampPreferFill: true }), S = E.shape(pk, P, null), tph = 1.5;
  const hs = {}; for (let i = 0; i < S.n; i++) { const c = GRID[(i / W) >> 1][(i % W) >> 1]; const k = /[GE]/.test(c) ? 'ent' : /[PQ]/.test(c) ? 'pillar' : c === 'W' ? 'wall' : c === 'p' ? 'parapet' : 'nave'; (hs[k] = hs[k] || new Set()).add(+(S.levelH[S.fine[i]] / tph).toFixed(3)); }
  const lv = [...hs.nave].sort((a, b) => a - b);
  ok(`the nave has the SIX sub-levels ${lv} H (0.21 H each, 5 of them = ${(lv[5] - lv[0]).toFixed(3)} H against 0.94 H of the remake: 3 x 0.16 + 2 x 0.23)`, lv.length === 6 && lv.every((v, k) => Math.abs(v - k * 0.2105) < 0.003) && Math.abs(lv[5] - 1.053) < 0.003, lv);
  ok(`the entrance is at 0 H (${[...hs.ent]}), the parapet at ${[...hs.parapet]} H (about 0.8 H), the walls at ${[...hs.wall]} H (terrace 1 + 7 sub-levels: the top of the map; about 3.5 H, planes adds to it)`, [...hs.ent].join() === '0' && [...hs.parapet].join() === '0.842' && [...hs.wall].join() === '3.474', Object.fromEntries(Object.entries(hs).map(([k, v]) => [k, [...v]])));
  // every nave tile has the sub-level the grid says (no stray level)
  { let bad = 0; for (let i = 0; i < S.n; i++) { const c = GRID[(i / W) >> 1][(i % W) >> 1], lvl = /[0-5]/.test(c) ? +c : /[a-f]/.test(c) ? c.charCodeAt(0) - 97 : c === 'T' ? 5 : /[GE]/.test(c) ? 0 : -1; if (lvl < 0) continue; if (Math.abs(S.levelH[S.fine[i]] / tph - lvl * 0.2105) > 0.003) bad++; }
    ok(`every walkable tile of the shape has the sub-level of its character in the grid (${bad} tiles differ)`, bad === 0, bad); }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
