/* STAGE PLATFORMS OF THE NUMERIC WORLD, DAC3 (PR Q3, phase 1; `E.s3.platforms`): a TRANSCRIPTION of the user's `reference/EDunProcGen.cs` (read-only reference; `SequenceA` lines 470-680 and the functions it calls) that splits every room into PLATFORMS. Nothing in the render uses it yet: the OUTPUT is, per room, the platforms, their flow type, the ROAD platforms in path order and the ELBOWS; plus a debug overlay (switch "Platforms (debug)", off by default).
   Pipeline (C# name -> here):
     1 widened path   GenerateRoomAwareWidenedFlowMap(corePaths, roomMap, forbidden, w, h, maxHalfWidth 6)   [BreakPathByRoom inside]   -> widened()
     2 subsegments    ExtractAndClassifySubsegments -> subsegments(); ComputeThicknessMap(widePath, 6) -> thickness(); PruneSubsegmentsByThickness(minThickness 4) -> prune()
     3 seeds          FloodPlatformBlobSeedsFromSubsegments(.., 12) -> flowSeeds(); FloodPlatformBlobSeedsFromUntouchedSubsegments(full, pruned, touched, minSurface 300) (the overload SequenceA calls at line 502) -> roomSeeds() [FloodBlobSubclusters inside]
     4 visibility     GenerateVisibilityMap_SlopeTerrace + GenerateVisibilityMap_TerraceOnly, cameraDir = the look direction of the yaw of the room (C1), TrimSmallVisibilityRegions(0.6, 20) -> visibility(); TrimPlatformSeeds_VisibilityAndPadding(0.3, 2) -> trimSeeds()
     5 growth         MultiVantagePlatformGrowth(0.85, 1000, 250) [FindVantagePointByClarity, CollectLOSVisibleTilesFlooded, BuildPlatformRegionVisibleFrom] -> multiVantage()
     6 flow type      ClassifyRoomFlowFromConnections(platforms, spanningTreeRaw, 50, 200) -> flowTypes()
   NOT done (step 7 and the ones between 5 and 6 in the C#): ApplyJaggedEdgeSmoothing (10 passes), ClassifyPlatformRoles, the heat maps and AssignScenarioRoles / leaf / corridor roles. A ROAD platform here is [R]-defined (no C# role): a platform made from the FLOW seeds (the widened tree path) that a connection path crosses; the ROAD ORDER of a room is the order in which each connection path that crosses the room first touches those platforms; an ELBOW is a change of direction >= ELBOW_DEG [R] between the centres of consecutive road platforms of one path.
   DEVIATIONS from the C# (each with its reason; the sheet repeats them): (1) the A* tree is DAC3's `RL.usage.edges` (the global spanning tree of src/s3/rooms.js, the one that is not visibility weighted, a single `spanningTreeRaw`); the C# widens `spanningTreeVisual` and classifies with `spanningTreeRaw`; (2) `slopeClasified`, `terraceMap` (terrace + 1), `roomMap`, `forbidden` come from the DAC3 rooms layer (`RL.cls`, `RL.ter`, `RL.room`, `RL.forb`), not from Unity textures; (3) Unity `Mathf.RoundToInt` (half to even) is reproduced; (4) no Unity types (Vector2Int = [x, y] / a flat tile index); (5) the visibility maps are made for each of the 4 yaws that exist (the camera of a room is its C1 yaw, the C# has ONE cameraDir (-1, -1)); the platforms of a room use the map of ITS yaw; (6) ClassifyRoomFlowFromConnections never returns Dead (the enum has it, the function does not): Dead does not appear here; (7) `TrimPlatformSeeds_VisibilityAndPadding` is transcribed LITERALLY, including that it keeps the tiles that are NOT in `finalTiles` as the platform and divides by finalTiles.Count (listed as oddities, not changed).
   Unity: the same code already exists in the user's project; nothing is exported. */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0)), X = E.platforms = {};
  /* hypotheses [R] in ONE table (the numbers of SequenceA are the C# ones and are marked C#) */
  X.HYP = { maxHalfWidth: 6 /* C# */, minThickness: 4 /* C# */, minFlowSeed: 12 /* C# */, minRoomSeed: 300 /* C# */, trimSmallThr: 0.6 /* C# */, trimSmallMin: 20 /* C# */, trimVis: 0.3 /* C# */, trimPad: 2 /* C# */, vantageThr: 0.85 /* C# */, vantageRadius: 1000 /* C# */, vantageMaxArea: 250 /* C# */, micro: 50 /* C# */, small: 200 /* C# */, shadowLength: 6 /* C# default */, elbowDeg: 45 /* [R] */ };
  const rte = (v) => { const f = Math.floor(v), d = v - f; return d < 0.5 - 1e-9 ? f : d > 0.5 + 1e-9 ? f + 1 : (f % 2 === 0 ? f : f + 1); }; // Mathf.RoundToInt: half to even
  const D4 = [[0, 1], [0, -1], [-1, 0], [1, 0]], D8 = [[0, 1], [0, -1], [-1, 0], [1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  /* 1. the widened path -> Float32Array flow map (index y * W + x) */
  X.widened = function (paths, room, forb, W, H, maxHalf) {
    const flow = new Float32Array(W * H), xy = (t) => [t % W, (t / W) | 0], bad = (x, y) => x < 0 || y < 0 || x >= W || y >= H || forb[y * W + x];
    for (const pth0 of paths) {
      if (pth0.length < 2) continue; const path = pth0.map(xy), subs = []; let cur = [path[0]], cr = room[path[0][1] * W + path[0][0]];
      for (let i = 1; i < path.length; i++) { const p = path[i], r = room[p[1] * W + p[0]]; if (r !== cr) { subs.push(cur.slice()); cur = []; cr = r; } cur.push(p); } if (cur.length) subs.push(cur); // BreakPathByRoom
      for (const sub of subs) {
        let leftR = maxHalf, rightR = maxHalf;
        const normalOf = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(-dy, dx) || 1; return [-dy / l, dx / l]; };
        for (let i = 1; i < sub.length; i++) { const nm = normalOf(sub[i - 1], sub[i]), mid = sub[i];
          for (let r = 1; r <= maxHalf; r++) { if (bad(rte(mid[0] + nm[0] * r * -1), rte(mid[1] + nm[1] * r * -1))) { leftR = Math.min(leftR, r - 1); break; } }
          for (let r = 1; r <= maxHalf; r++) { if (bad(rte(mid[0] + nm[0] * r), rte(mid[1] + nm[1] * r))) { rightR = Math.min(rightR, r - 1); break; } } }
        for (let i = 1; i < sub.length; i++) { const b = sub[i], nm = normalOf(sub[i - 1], b);
          if (!forb[b[1] * W + b[0]]) flow[b[1] * W + b[0]] = 1;
          for (const [s, R] of [[-1, leftR], [1, rightR]]) for (let r = 1; r <= R; r++) { const px = rte(b[0] + nm[0] * r * s), py = rte(b[1] + nm[1] * r * s); if (px < 0 || py < 0 || px >= W || py >= H || forb[py * W + px]) continue; const v = 1 - r / (maxHalf + 1); flow[py * W + px] = Math.max(flow[py * W + px], v); } }
      }
    }
    return flow;
  };
  /* 2. subsegments (key 'room|terrace' -> tile list, x-major like the C#), thickness, prune */
  X.subsegments = function (flow, room, terr, W, H, thr) {
    const full = new Map(), touched = new Map(); thr = thr === undefined ? 0.001 : thr;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const i = y * W + x, r = room[i], t = terr[i]; if (r <= 0) continue; const k = r + '|' + t; if (!full.has(k)) full.set(k, []); full.get(k).push(i); if (flow[i] >= thr) { if (!touched.has(k)) touched.set(k, new Set()); touched.get(k).add(i); } }
    return { full, touched };
  };
  X.thickness = function (flow, W, H, radius) {
    const out = new Float32Array(W * H);
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { if (flow[y * W + x] <= 0) continue; let maxR = 0;
      for (let r = 1; r <= radius; r++) { let blocked = false; for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || flow[ny * W + nx] <= 0) blocked = true; } if (!blocked) maxR = r; }
      out[y * W + x] = maxR; }
    return out;
  };
  X.prune = function (sub, thick, minT) { const out = new Map(); for (const [k, v] of sub) { let m = -1; for (const t of v) if (thick[t] > m) m = thick[t]; if (m >= minT) out.set(k, v); } return out; };
  /* 3. seeds. A seed = { room, terrace, tiles, center (tile index), area, score } */
  const keyOf = (k) => { const [r, t] = k.split('|'); return [+r, +t]; };
  const mkSeed = (k, tiles, W) => { let sx = 0, sy = 0; for (const t of tiles) { sx += t % W; sy += (t / W) | 0; } const [r, t] = keyOf(k); return { room: r, terrace: t, tiles, center: rte(sy / tiles.length) * W + rte(sx / tiles.length), area: tiles.length, score: tiles.length }; };
  X.flowSeeds = function (pruned, W, H, minSurface) { const visited = new Uint8Array(W * H), seeds = []; for (const [k, v] of pruned) { const blob = []; for (const p of v) { if (visited[p]) continue; visited[p] = 1; blob.push(p); } if (blob.length >= minSurface) seeds.push(mkSeed(k, blob, W)); } return seeds; };
  X.blobs = function (tiles, minSurface, W, H) { const set = new Set(tiles), seen = new Set(), out = []; for (const s of tiles) { if (seen.has(s)) continue; const blob = [], q = [s]; seen.add(s); for (let qi = 0; qi < q.length; qi++) { const c = q[qi]; blob.push(c); const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (set.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } } } if (blob.length >= minSurface) out.push(blob); } return out; }; // FloodBlobSubclusters (the C# looks up neighbours by set membership, also outside the map: the map border is respected here)
  X.roomSeeds = function (full, pruned, minSurface, W, H) { const seeds = [], discarded = []; for (const [k, tiles] of full) { if (pruned.has(k)) continue; let ok = false; for (const blob of X.blobs(tiles, 1, W, H)) { if (blob.length < minSurface) continue; ok = true; seeds.push(mkSeed(k, blob, W)); } if (!ok) discarded.push(k); } return { seeds, discarded }; };
  /* 4. visibility maps (value 1 = shadowed) for a look direction [dx, dy] */
  X.visibility = function (cls, terr, look, W, H, steepV) {
    const len = Math.hypot(look[0], look[1]) || 1, cd = [look[0] / len, look[1] / len], L = X.HYP.shadowLength, slope = new Float32Array(W * H), ter = new Float32Array(W * H);
    const sd = [[rte(cd[0]), rte(cd[1])], [rte(cd[0] * 0.7), rte(cd[1] * 0.7)]];
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
      let occ = cls[y * W + x] === steepV; for (const [dx, dy] of sd) { const tx = x + dx, ty = y + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue; if (terr[ty * W + tx] > terr[y * W + x]) occ = true; }
      if (occ) for (let i = 1; i <= L; i++) { const sx = x + rte(cd[0] * i), sy = y + rte(cd[1] * i); if (sx < 0 || sy < 0 || sx >= W || sy >= H) break; const s = 1 - i / L; slope[sy * W + sx] = Math.max(slope[sy * W + sx], s); }
      const cur = terr[y * W + x]; if (cur <= 0) continue; const lx = x + rte(cd[0]), ly = y + rte(cd[1]); if (lx < 0 || ly < 0 || lx >= W || ly >= H) continue;
      if (terr[ly * W + lx] < cur) for (let st = 1; st <= L; st++) { const sx = x + rte(cd[0] * st), sy = y + rte(cd[1] * st); if (sx < 0 || sy < 0 || sx >= W || sy >= H) break; const s = 1 - st / L; ter[sy * W + sx] = Math.max(ter[sy * W + sx], s); } }
    // TrimSmallVisibilityRegions(slope, 0.6, 20): 4-connected regions of value >= 0.6 smaller than 20 are dropped
    const thr = X.HYP.trimSmallThr, minSize = X.HYP.trimSmallMin, seen = new Uint8Array(W * H), trimmed = new Float32Array(W * H);
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const i0 = y * W + x; if (seen[i0] || slope[i0] < thr) continue; const reg = [i0]; seen[i0] = 1; for (let qi = 0; qi < reg.length; qi++) { const c = reg[qi], cx = c % W, cy = (c / W) | 0; for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (seen[j] || slope[j] < thr) continue; seen[j] = 1; reg.push(j); } } if (reg.length >= minSize) for (const p of reg) trimmed[p] = slope[p]; }
    const vis = new Float32Array(W * H); for (let i = 0; i < W * H; i++) vis[i] = Math.min(1, Math.max(0, Math.max(trimmed[i], ter[i])));
    return vis;
  };
  X.trimSeeds = function (seeds, vis, room, terr, W, H, visThr, pad) { // TrimPlatformSeeds_VisibilityAndPadding, LITERAL (see the header: the kept tiles are the ones NOT in finalTiles)
    const globalUsed = new Set(), out = [];
    for (const seed of seeds) {
      const plat = new Set(seed.tiles), keepVis = new Set(); for (const p of plat) if (vis[p] >= visThr) keepVis.add(p);
      const padded = new Set(keepVis);
      for (const p of keepVis) { const px = p % W, py = (p / W) | 0; for (let dx = -pad; dx <= pad; dx++) for (let dy = -pad; dy <= pad; dy++) { const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (!keepVis.has(n)) continue; if (room[n] !== seed.room || terr[n] !== seed.terrace) padded.delete(p); } }
      const finalTiles = [...padded].filter((p) => !globalUsed.has(p));
      if (finalTiles.length > 0) { const full = plat; for (const t of finalTiles) full.delete(t); let sx = 0, sy = 0; for (const p of plat) { sx += p % W; sy += (p / W) | 0; globalUsed.add(p); } const c = rte(sy / finalTiles.length) * W + rte(sx / finalTiles.length); out.push({ room: seed.room, terrace: seed.terrace, tiles: [...full], center: c, area: full.size, score: full.size, trimmedTiles: finalTiles }); }
    }
    return out;
  };
  /* 5. MultiVantagePlatformGrowth */
  X.multiVantage = function (tiles0, vis, room, terrace, W, H, visThr, maxRadius, maxArea) {
    const remaining = new Set(tiles0), results = [];
    const clarity = (t) => 1 - vis[t];
    while (remaining.size > 0) {
      const list = [...remaining]; let best = -1, bestP = 0, bestVis = [];
      for (const p of list) { if (clarity(p) < visThr) continue; const px = p % W, py = (p / W) | 0, visible = []; for (const q of list) { const dx = (q % W) - px, dy = ((q / W) | 0) - py; if (dx * dx + dy * dy <= maxRadius * maxRadius && clarity(q) >= visThr) visible.push(q); } if (visible.length > best) { best = visible.length; bestP = p; bestVis = visible; } } // FindVantagePointByClarity
      if (bestVis.length === 0 || (bestP % W === 0 && ((bestP / W) | 0) === 0)) break; // `retained.Count == 0 || vantage == Vector2.zero`
      const allowed = new Set(bestVis), los = new Set([bestP]), dist = new Map([[bestP, 0]]), qq = [bestP]; // CollectLOSVisibleTilesFlooded (maxRadius = the call's 1000: the 10 * maxRadius cap)
      for (let qi = 0; qi < qq.length; qi++) { const c = qq[qi], cx = c % W, cy = (c / W) | 0, d0 = dist.get(c); for (const [dx, dy] of D8) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (los.has(j) || !allowed.has(j) || clarity(j) < visThr) continue; const nd = d0 + (dx !== 0 && dy !== 0 ? 14 : 10); if (nd > maxRadius * 10) continue; los.add(j); dist.set(j, nd); qq.push(j); } }
      const cand = new Set(los), vx = bestP % W, vy = (bestP / W) | 0, visited = new Uint8Array(W * H), build = [bestP]; visited[bestP] = 1; // BuildPlatformRegionVisibleFrom
      for (let qi = 0; qi < build.length && build.length < maxArea; qi++) { const c = build[qi], cx = c % W, cy = (c / W) | 0; for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (visited[j] || !cand.has(j)) continue; if ((nx - vx) * (nx - vx) + (ny - vy) * (ny - vy) > maxRadius * maxRadius) continue; if (clarity(j) < visThr) continue; visited[j] = 1; build.push(j); } }
      const bs = new Set(build); results.push({ room, terrace, center: bestP, vantagePt: bestP, tiles: build, trimmedTiles: bestVis.filter((p) => !bs.has(p)), area: build.length, score: build.length });
      for (const t of build) remaining.delete(t);
    }
    return results;
  };
  /* 6. ClassifyRoomFlowFromConnections(platforms, connections [{ a: roomId, b: roomId }], micro, small) -> Map 'room|terrace' -> 'Leaf' | 'Corridor' | 'Hub' | 'Small' | 'Micro' | 'Isolated' */
  X.flowTypes = function (platforms, conns, micro, small) {
    const rc = new Map(); for (const c of conns) { if (!rc.has(c.a)) rc.set(c.a, new Set()); if (!rc.has(c.b)) rc.set(c.b, new Set()); if (c.a !== c.b) { rc.get(c.a).add(c.b); rc.get(c.b).add(c.a); } }
    const by = new Map(); for (const p of platforms) { const k = p.room + '|' + p.terrace; if (!by.has(k)) by.set(k, []); by.get(k).push(p); }
    const out = new Map(); for (const [k, ps] of by) { const tiles = ps.reduce((s, p) => s + p.tiles.length, 0); if (tiles < micro) { out.set(k, 'Micro'); continue; } if (tiles < small) { out.set(k, 'Small'); continue; } const deg = rc.has(ps[0].room) ? rc.get(ps[0].room).size : 0; out.set(k, deg === 0 ? 'Isolated' : deg === 1 ? 'Leaf' : deg === 2 ? 'Corridor' : 'Hub'); }
    return out;
  };
  /* the whole pipeline over a rooms layer RL (E.s3.rooms.layer of the whole map): X.compute(RL, { yawOf: (roomId) => yaw, only: [roomIds] }) */
  X.compute = function (RL, opts) {
    opts = opts || {}; const H = X.HYP, W = RL.mapW, Hh = RL.mapH, n = W * Hh, room = RL.room, terr = Int16Array.from(RL.ter, (t) => t + 1), cls = RL.cls, forb = RL.forb, SL = E.rooms.SL, ms = {}, t0 = Date.now(), tick = (k) => { ms[k] = Date.now() - t0; };
    const U = RL.usage || E.rooms.usage(RL, W, Hh), edges = U.edges, paths = edges.map((e) => e.path);
    const flow = X.widened(paths, room, forb, W, Hh, H.maxHalfWidth); tick('widened');
    const sub = X.subsegments(flow, room, terr, W, Hh), thick = X.thickness(flow, W, Hh, H.maxHalfWidth), pruned = X.prune(sub.full, thick, H.minThickness); tick('subsegments');
    const fs0 = X.flowSeeds(pruned, W, Hh, H.minFlowSeed), rs = X.roomSeeds(sub.full, pruned, H.minRoomSeed, W, Hh); tick('seeds');
    const visCache = new Map(), visOf = (yaw) => { if (!visCache.has(yaw)) visCache.set(yaw, X.visibility(cls, terr, E.orient.lookOf(yaw), W, Hh, SL.Steep)); return visCache.get(yaw); };
    const only = opts.only ? new Set(opts.only) : null, yawOf = opts.yawOf || (() => 0), keep = (s) => !only || only.has(s.room);
    const prep = (seeds) => { const out = []; for (const s of seeds.filter(keep)) { const vis = visOf(yawOf(s.room)); const tr = X.trimSeeds([s], vis, room, terr, W, Hh, H.trimVis, H.trimPad); for (const t of tr) for (const g of X.multiVantage(t.tiles, vis, t.room, t.terrace, W, Hh, H.vantageThr, H.vantageRadius, H.vantageMaxArea)) out.push(g); } return out; }; // NB: the C# trims the whole list at once (globalUsed across seeds); here per seed so each room uses the visibility of ITS yaw (deviation 5)
    const roomP = prep(rs.seeds).map((p) => Object.assign(p, { src: 'room' })), flowP = prep(fs0).map((p) => Object.assign(p, { src: 'flow' })); tick('growth');
    const all = roomP.concat(flowP); all.forEach((p, i) => { p.id = i; });
    const coreRoom = (ci) => RL.reach[ci] ? RL.reach[ci].room : 0, conns = RL.treeReach.tree.map((e) => ({ a: coreRoom(e.i), b: coreRoom(e.j) })).filter((c) => c.a > 0 && c.b > 0);
    const flowT = X.flowTypes(all, conns, H.micro, H.small); tick('flowTypes');
    // ROAD platforms and ELBOWS (the [R] definition of the header)
    const owner = new Map(); for (const p of flowP) for (const t of p.tiles) owner.set(t, p.id);
    const road = new Map(), elbows = new Map(), cosT = Math.cos(H.elbowDeg * Math.PI / 180);
    for (const e of edges) { const seqByRoom = new Map(); for (const t of e.path) { const pid = owner.get(t); if (pid === undefined) continue; const rid = room[t]; const s = seqByRoom.get(rid) || (seqByRoom.set(rid, []), seqByRoom.get(rid)); if (s[s.length - 1] !== pid) s.push(pid); }
      for (const [rid, seq] of seqByRoom) { if (!road.has(rid)) road.set(rid, []); road.get(rid).push(seq); const c = (id) => { const p = all[id], x = p.center % W, y = (p.center / W) | 0; return [x, y]; }; let el = 0; for (let k = 1; k + 1 < seq.length; k++) { const a = c(seq[k - 1]), b = c(seq[k]), d = c(seq[k + 1]), v1 = [b[0] - a[0], b[1] - a[1]], v2 = [d[0] - b[0], d[1] - b[1]], l1 = Math.hypot(...v1), l2 = Math.hypot(...v2); if (l1 > 0 && l2 > 0 && (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2) <= cosT) el++; } elbows.set(rid, (elbows.get(rid) || 0) + el); } }
    const rooms = new Map(); for (const p of all) { if (!rooms.has(p.room)) rooms.set(p.room, { room: p.room, platforms: [], flow: {}, road: [], elbows: 0 }); rooms.get(p.room).platforms.push(p); }
    for (const [k, v] of flowT) { const [r, t] = keyOf(k); if (rooms.has(r)) rooms.get(r).flow[t] = v; }
    for (const [r, v] of rooms) { v.road = road.get(r) || []; v.elbows = elbows.get(r) || 0; }
    return { W, H: Hh, platforms: all, rooms, discardedRoomSeeds: rs.discarded, counts: { widenedTiles: flow.reduce((s, v) => s + (v > 0 ? 1 : 0), 0), subsegments: sub.full.size, pruned: pruned.size, flowSeeds: fs0.length, roomSeeds: rs.seeds.length, platforms: all.length, roomPlat: roomP.length, flowPlat: flowP.length }, ms };
  };
  /* debug overlay: platform tiles tinted by flow type (hub orange, corridor blue, leaf green, small / micro grey, isolated red), ROAD platforms outlined. Drawn like the other frame layers (after the terrain, NO occlusion: a debug view). Installed through E.frame.draw, which render.js calls when `o.frame` is set. */
  X.COLORS = { Hub: 'rgba(255,150,30,0.5)', Corridor: 'rgba(70,130,255,0.5)', Leaf: 'rgba(60,200,110,0.5)', Small: 'rgba(170,170,170,0.5)', Micro: 'rgba(120,120,120,0.5)', Isolated: 'rgba(230,60,60,0.5)' };
  X.draw = function (ctx, cam, S, P, o) {
    const D = S.platDebug; if (!D) return; const gh = (i) => S.levelH[S.fine[i]], W = S.W, mw = D.mapW;
    for (const p of D.platforms) { ctx.fillStyle = X.COLORS[D.flow.get(p.room + '|' + p.terrace)] || 'rgba(255,255,255,0.4)'; for (const t of p.tiles) { const x = (t % mw) - S.ox, y = ((t / mw) | 0) - S.oy; if (x < 0 || y < 0 || x >= W || y >= S.H) continue; const h = gh(y * W + x), a = cam.p(x, y, h), b = cam.p(x + 1, y, h), c = cam.p(x + 1, y + 1, h), d = cam.p(x, y + 1, h); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill(); } }
  };
  { const fr = E0.frame; if (fr && !fr.__plat) { const base = fr.draw; fr.draw = function (ctx, cam, S, P, tech, view, o) { base.apply(this, arguments); if (o && o.platDebug && S.platDebug) X.draw(ctx, cam, S, P, o); }; fr.__plat = true; } } // render.js calls E.frame.draw when o.frame is set; the debug layer rides on it (no shared file changes)
})(window.EVO = window.EVO || {});
