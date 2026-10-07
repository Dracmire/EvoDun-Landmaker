/* Isolated terrain and edge problems (rooms on), measured on the walkable regions: main = the largest region; any other region under the limit is isolated
   (decorative, not walkable, not a region, no ramps, no marks); any other region with the limit or more is an edge problem (stays walkable, outlined, named).
   Real map data/samples/skeleton_heightmap_256.png.
     node tools/test_walk_rooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
(async () => {
  const img = await E.decodePng(fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'))), W = img.width, H = img.height;
  const mk = () => ({ name: 'skeleton', width: W, height: H, elevation: Float32Array.from(img.channels[0], (v) => v / img.max * 1000), masks: {}, markers: [], fields: {} });
  const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, rooms: true };
  const stats = {};
  for (const limit of [20, 100, 300, 1000]) {
    const S = E.shape(mk(), { ...P, roomsIsoLimit: limit }, null), w = S.walkInfo, n = S.n, rs = S.regionSizes;
    // independent components of the final graph: regions of the shape BEFORE the classification are rebuilt from the stored pieces (isolated + region ids)
    const sizesAll = [...rs]; // after: main + problems
    const mainSize = Math.max(...rs);
    ok(`limit ${limit}: the main region is the largest walkable region and is not isolated`, S.regionSizes[S.mainRegion] === mainSize && w.main === mainSize, [mainSize, w.main]);
    ok(`limit ${limit}: every region left is main or has ${limit} tiles or more (edge problems), none is smaller`, rs.every((z, r) => r === S.mainRegion || z >= limit), JSON.stringify(rs.filter((z, r) => r !== S.mainRegion && z < limit)));
    ok(`limit ${limit}: the problems are exactly the non-main regions`, w.problems.length === rs.length - 1 && w.problems.every((p) => p.size >= limit && p.size === rs[p.id]), [w.problems.length, rs.length]);
    let iso = 0, isoWalk = 0, isoRegion = 0, nowalkBad = 0, tileOK = 0; for (let i = 0; i < n; i++) { if (S.isolated[i]) { iso++; if (S.region[i] >= 0) isoRegion++; if (E.tileWalkable(S, i)) tileOK++; if (!S.nowalk[i]) nowalkBad++; } }
    ok(`limit ${limit}: isolated tiles belong to no region, carry the tone and refuse marks`, iso === w.isolatedTiles && isoRegion === 0 && tileOK === 0 && nowalkBad === 0, [iso, w.isolatedTiles, isoRegion, tileOK, nowalkBad]);
    let sum = 0; for (const z of rs) sum += z; ok(`limit ${limit}: walkable = the sum of the regions left`, sum === w.walkable, [sum, w.walkable]);
    let rampInIso = 0; for (const rec of S.stairs) if (rec.steps.every((st) => st.tiles.every((t) => S.isolated[t]))) rampInIso++;
    ok(`limit ${limit}: no ramp lies entirely in isolated terrain`, rampInIso === 0, rampInIso);
    // the tone: margins of the layer (not carved) and isolated tiles, nothing else
    let toneBad = 0; for (let i = 0; i < n; i++) { const mi = (((i / S.W) | 0) + S.oy) * S.mapW + (i % S.W) + S.ox, want = !S.block[i] && !(S.void && S.void[i]) && (S.isolated[i] || (!S.carved[i] && S.rooms.forb[mi] === 1)); if ((S.nowalk[i] === 1) !== !!want) toneBad++; if (S.carved[i] && S.nowalk[i] && !S.isolated[i]) toneBad++; }
    ok(`limit ${limit}: the not-walkable tone is exactly isolated terrain + forbidden margins, never a ramp`, toneBad === 0, toneBad);
    // warning outline: faces of problem regions only
    let warnBad = 0, warnFaces = 0; const OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let i = 0; i < n; i++) for (let b = 0; b < 4; b++) if (S.roomKind[i * 4 + b] === 3) { warnFaces++; const x = i % S.W + OFF[b][0], y = ((i / S.W) | 0) + OFF[b][1], j = y * S.W + x, ri = S.region[i], rj = j >= 0 && j < n ? S.region[j] : -2; const mine = (ri >= 0 && ri !== S.mainRegion), other = (rj >= 0 && rj !== S.mainRegion); if (!mine && !other) warnBad++; if (ri === rj && ri >= 0) warnBad++; }
    ok(`limit ${limit}: warning-outline faces separate a problem region from something else`, warnBad === 0 && (w.problems.length === 0 || warnFaces > 0), [warnBad, warnFaces, w.problems.length]);
    ok(`limit ${limit}: every problem names its size, place and what separates it`, w.problems.every((p) => p.size > 0 && p.at.length === 2 && p.box.length === 4 && typeof p.cause === 'string' && p.cause.length > 0), JSON.stringify(w.problems.slice(0, 2)));
    stats[limit] = { iso: w.isolatedTiles, prob: w.problems.length, walk: w.walkable };
  }
  ok('a larger limit makes more isolated tiles and no more problems', stats[20].iso <= stats[100].iso && stats[100].iso <= stats[300].iso && stats[300].iso <= stats[1000].iso && stats[20].prob >= stats[100].prob && stats[100].prob >= stats[300].prob, JSON.stringify(stats));
  // slice: the main region is the largest of the slice
  const SL = E.shape(mk(), { ...P, roomsIsoLimit: 100 }, { rooms: [8], margin: 6 });
  ok('a slice has its own main region (the largest of the slice) and the same rule', SL.regionSizes[SL.mainRegion] === Math.max(...SL.regionSizes) && SL.walkInfo.walkable > 1000, JSON.stringify(SL.walkInfo.problems.map((p) => p.size)));
  // marks and rooms off
  const S = E.shape(mk(), P, null); let iso = -1; for (let i = 0; i < S.n; i++) if (S.isolated[i]) { iso = i; break; }
  ok('an isolated tile is refused for a mark', iso >= 0 && !E.tileWalkable(S, iso));
  const off = E.shape(mk(), { ...P, rooms: false }, null); ok('rooms off: no isolated terrain, no tone, no warning', off.isolated === undefined && off.nowalk === undefined && off.walkInfo === undefined);
  // terraces 3-8: the same rule holds, every problem is named (no empty cause, none "unknown" in a slice), main is the largest region
  for (const T of [3, 4, 5, 6, 7, 8]) {
    const S = E.shape(mk(), { ...P, terraces: T }, null), w = S.walkInfo, rs = S.regionSizes;
    ok(`${T} terraces: main is the largest region, the rest are problems of ${w.limit} tiles or more`, rs[S.mainRegion] === Math.max(...rs) && w.problems.length === rs.length - 1 && w.problems.every((q) => q.size >= w.limit), [rs.length, w.problems.length]);
    ok(`${T} terraces: every problem has a named cause`, w.problems.every((q) => typeof q.cause === 'string' && q.cause.length > 0 && !/^unknown$/i.test(q.cause)), JSON.stringify(w.problems.slice(0, 2).map((q) => q.cause)));
  }
  { const S = E.shape(mk(), { ...P, terraces: 6 }, { rooms: [8], margin: 6 }); ok('a slice: no problem is named "unknown"', S.walkInfo.problems.every((q) => q.cause && !/unknown/i.test(q.cause)), JSON.stringify(S.walkInfo.problems.map((q) => q.cause))); }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
