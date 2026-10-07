/* Are the connections of the spanning tree walkable end to end in the final walking graph (the one of E.route)? Real map, rooms on, whole map or a room slice.
   Prints the numbers with the reservation + recompute (default) and without it (P.rampKeep = false, the behaviour before the fix), and how many ramps changed.
     node tools/diag_connections.js [--rooms 8,5] [--minCore 20] [--cost 10] [--depth 2] */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const img = await E.decodePng(fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'))), W = img.width, H = img.height;
  const mk = () => ({ name: 'skeleton', width: W, height: H, elevation: Float32Array.from(img.channels[0], (v) => v / img.max * 1000), masks: {}, markers: [], fields: {} });
  const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: +arg('--depth', 2), spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: +arg('--minCore', 20), roomsCross: +arg('--cost', 10), rooms: true };
  const rooms = arg('--rooms', ''), spec = rooms ? { rooms: rooms.split(',').map(Number), margin: 6 } : null;
  const limit = +arg('--limit', 100), run = (keep) => E.shape(mk(), { ...P, rampKeep: keep, roomsIsoLimit: limit }, spec);
  const A = run(false), B = run(true);
  const sum = (S) => { const c = S.connInfo, rs = S.regionSizes, tot = rs.reduce((x, y) => x + y, 0), big = Math.max(...rs); return `${c.ok} ok of ${c.total} (${c.global} global + ${c.patch} patch), ${c.recomputed} recomputed, ${c.unresolved} not kept (${c.noRoute} with no route at all) ${JSON.stringify(c.reasons)}; ramps ${S.stairs.length}/${S.passes.length}, variants ${JSON.stringify(S.stairInfo.variants)}; regions ${rs.length}, largest ${(big / tot * 100).toFixed(0)} % of the walkable`; };
  const cat = (S) => { const w = S.walkInfo; return `walkable ${w.walkable} tiles (${(w.walkable / S.landTiles * 100).toFixed(1)} % of the land), main ${w.main}; isolated (under ${w.limit}): ${w.isolatedRegions} regions, ${w.isolatedTiles} tiles; edge problems: ${w.problems.length} regions ${JSON.stringify(w.problems.map((p) => p.size))}; ramps not built (in isolated terrain): ${S.isoRampsDropped || 0}`; };
  console.log('before the fix (P.rampKeep = false):', sum(A)); console.log('   categories:', cat(A)); console.log('after the fix                      :', sum(B)); console.log('   categories:', cat(B));
  // how many ramps changed: by site (exact pair) compare mode / columns / depth
  const key = (S) => new Map(S.stairs.map((r) => [r.site.a + ':' + r.site.b, `${r.mode}|${r.cols.length}|${r.ramp ? r.ramp.len : 0}|${r.top[0]}`]));
  const ka = key(A), kb = key(B); let changed = 0, lost = 0, gained = 0; for (const [k, v] of ka) { if (!kb.has(k)) lost++; else if (kb.get(k) !== v) changed++; } for (const k of kb.keys()) if (!ka.has(k)) gained++;
  console.log(`ramps that changed shape: ${changed}, no longer placed: ${lost}, newly placed: ${gained}`);
  const c = B.connInfo; console.log('unresolved after the fix:', JSON.stringify(c.list));
})();
