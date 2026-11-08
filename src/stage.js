/* STAGE (crystallizer 3, mode 3, PR S1): the base of the 2D-HD crystallizer. Pure logic of the Stage: the unit H (a hero's height, `tilesPerH` viewer units, horizontally and vertically), the Cam 6 hero tracking (distance, clamp at the window), the
   hero placeholder (walkability, movement, drawing) and the readout. Nothing here changes a shape, a level or a pixel of modes 1 and 2: the viewer reaches it only in mode 3, in an example that declares a window (`roomSet`); src/ui.js owns the state.
   UNITS: 1 H = tilesPerH tiles (default 2: "a character is 2 tiles tall", option2-backdrop.md D). Every Stage constant is declared in H and converted to tiles only at the boundary (here and in ui.js).
   CAMERA (port of the reference rig, behaviour not code): the hero centre (feet + 0.5 H) is the pivot of Cam 6 (view.focus, src/render.js makePersp); the scale at the pivot is sc = heroFrac * panelH / H so the camera distance is
   dist = H / (2 * heroFrac * tan(FOV / 2)); the target is clamped at the window (sideways and on the near side; the far side is never clamped: the background is part of the scene) and the target height always follows the hero.
   HERO: a camera-facing billboard, 1 H tall and 0.4 H wide, drawn from its projected feet upward with the depth scale of its feet, ALWAYS on top (no visibility test: hero occlusion is Unity's). Nothing is exported (README D15). */
(function (E) {
  const FOV = 30 * Math.PI / 180, TAN = Math.tan(FOV / 2); // the vertical field of view of Cam 6 (src/render.js PERSP_FOV)
  const DEF = { tilesPerH: 2, heroFrac: 0.14 }, RANGE = { tilesPerH: [1.5, 4, 0.25], heroFrac: [0.08, 0.25, 0.01] };
  const HERO_W = 0.4, STEP_H = 0.25; // in H
  /* MEASURES IN H (S2a): with the switch on, the height unit of the shape follows the hero: terH = TERRACE_H x tilesPerH and subH = SUB_RATIO x terH (the proportion of the shape today). TERRACE_H = 2 H is a HYPOTHESIS (the user: a terrace goes from 3 to 6 tiles = 1.5-3 H; the reference has back walls of 2.4 H); S6 calibrates it. A constant, no slider, no manifest key. */
  const TERRACE_H = 2, SUB_RATIO = 0.22;
  const derive = (tilesPerH) => { const terH = TERRACE_H * tilesPerH; return { terH, subH: SUB_RATIO * terH }; };
  const ROW_NEAR = 0.95, ROW_FAR = 0.2; // screen rows (from the top, as a share of the panel height) of the near / far readout

  /* px per tile at the pivot, and the camera distance in tiles */
  const scale = (panelH, heroFrac, tilesPerH) => heroFrac * panelH / tilesPerH;
  const dist = (heroFrac, tilesPerH) => tilesPerH / (2 * heroFrac * TAN);

  /* the extent of a box {x0, y0, x1, y1} on the camera axes: a = screen right, u = toward the camera */
  function extent(box, yawDeg) {
    const y = yawDeg * Math.PI / 180, cy = Math.cos(y), sy = Math.sin(y); let aMin = 1e9, aMax = -1e9, uMin = 1e9, uMax = -1e9;
    for (const [x, yy] of [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]]) { const a = cy * x - sy * yy, u = sy * x + cy * yy; aMin = Math.min(aMin, a); aMax = Math.max(aMax, a); uMin = Math.min(uMin, u); uMax = Math.max(uMax, u); }
    return { aMin, aMax, uMin, uMax, cy, sy };
  }
  /* CLAMP of the camera target (window coordinates) at the window box. Sideways: half-width hw = dist * tan(FOV / 2) * panelW / panelH, the target stays in [aMin + hw, aMax - hw] (the window centre if it is narrower than 2 hw).
     Near side: near = dist * cos(pitch) - dist * sin(pitch) / tan(pitch + FOV / 2) is the ground distance from the target to the ground point at the bottom screen edge; the target may come no closer than that to the near edge.
     The far side is NOT clamped. Returns { x, y, side: 'L' | 'R' | 'C' | null, near: bool, clamped: bool }. */
  function clamp(tx, ty, box, yawDeg, pitchDeg, dst, w, h) {
    const e = extent(box, yawDeg), p = pitchDeg * Math.PI / 180, hw = dst * TAN * w / h, near = dst * Math.cos(p) - dst * Math.sin(p) / Math.tan(p + FOV / 2);
    let a = e.cy * tx - e.sy * ty, u = e.sy * tx + e.cy * ty, side = null, nr = false;
    const lo = e.aMin + hw, hi = e.aMax - hw;
    if (lo > hi) { a = (e.aMin + e.aMax) / 2; side = 'C'; } else if (a < lo) { a = lo; side = 'L'; } else if (a > hi) { a = hi; side = 'R'; }
    if (u > e.uMax - near) { u = e.uMax - near; nr = true; }
    if (E.stageTest && E.stageTest.clampFar && u < e.uMin + near) u = e.uMin + near; // MUTATION (tools/test_stage_cam.js): the far side clamped too
    return { x: e.cy * a + e.sy * u, y: -e.sy * a + e.cy * u, side, near: nr, clamped: !!side || nr };
  }

  /* walkable (the hero): not void, not water, inside the slice (S.block) and not a pocket decoration / water (pocketRole 2, 4) */
  const walkable = (S, i) => i >= 0 && !S.block[i] && !(S.pocketRole && (S.pocketRole[i] === 2 || S.pocketRole[i] === 4));
  const cellOf = (S, x, y) => { const cx = Math.floor(x), cy = Math.floor(y); return cx < 0 || cy < 0 || cx >= S.W || cy >= S.H ? -1 : cy * S.W + cx; };
  const feetH = (S, i) => S.levelH[S.fine[i]];

  /* the walkable tile of room `id` nearest to its centroid (window coordinates, the tile centre) */
  /* M2: THE ZONE MAP of the window (0 = none): the zones the mode 3 rules read. A zone of a PNG (`S.stageZones`, set by the viewer from the role `zone`) or a DAC room (`S.roomMap`); every rule reads it through this one function. */
  const zoneMap = (S) => S.stageZones || S.roomMap;
  function roomCentre(S, id) {
    const W = S.W, zm = zoneMap(S); let n = 0, sx = 0, sy = 0;
    for (let i = 0; i < zm.length; i++) if (zm[i] === id && walkable(S, i)) { n++; sx += i % W; sy += (i / W) | 0; }
    if (!n) return null;
    sx /= n; sy /= n; let best = -1, bd = 1e18;
    for (let i = 0; i < zm.length; i++) if (zm[i] === id && walkable(S, i)) { const d = (i % W + 0.5 - sx) ** 2 + (((i / W) | 0) + 0.5 - sy) ** 2; if (d < bd) { bd = d; best = i; } }
    return { x: best % W + 0.5, y: ((best / W) | 0) + 0.5, i: best };
  }

  /* one arrow-key step of 0.25 H on the camera axes (up = away from the camera); blocked only when the new cell is not walkable. Returns the new position or null. */
  function move(S, pos, dir, yawDeg, tilesPerH) {
    const y = yawDeg * Math.PI / 180, cy = Math.cos(y), sy = Math.sin(y), st = STEP_H * tilesPerH;
    const v = dir === 'right' ? [cy, -sy] : dir === 'left' ? [-cy, sy] : dir === 'down' ? [sy, cy] : [-sy, -cy];
    const nx = pos.x + v[0] * st, ny = pos.y + v[1] * st; return walkable(S, cellOf(S, nx, ny)) ? { x: nx, y: ny } : null;
  }

  /* near/hero and far/hero from the camera's own projection: the camera-space depth of the ground point (at the hero's feet level) that projects to screen row ROW_NEAR / ROW_FAR of the panel, and dist / z */
  function ratios(cam, w, h, feet) {
    if (!cam.persp) return null;
    const z = (r) => { const g = cam.unp(w / 2, r * h, feet); return cam.D - cam.depth(g[0], g[1], feet); };
    return { near: cam.D / z(ROW_NEAR), far: cam.D / z(ROW_FAR) };
  }

  /* the DEPTH SCALE of a point: the size on screen of one unit (perpendicular to the view axis) relative to the pivot; 1 for the orthographic cameras */
  const depthScale = (cam, x, y, hh) => (cam.persp ? cam.D / Math.max(cam.D - cam.depth(x, y, hh), 0.05 * cam.D) : 1);

  /* the hero: o = { x, y (window tiles), feet (height), hTiles, wTiles }; fills o.stats = { hpx, wpx, k, base: [x, y], centre: [x, y] } and returns it */
  function drawHero(ctx, cam, o) {
    const b = cam.p(o.x, o.y, o.feet), k = E.stageTest && E.stageTest.constSize ? 1 : depthScale(cam, o.x, o.y, o.feet), // (MUTATION: the hero at a constant screen size)
       hpx = o.hTiles * cam.sc * k, wpx = o.wTiles * cam.sc * k, c = cam.p(o.x, o.y, o.feet + o.hTiles / 2);
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(14,12,22,0.35)'; ctx.beginPath(); ctx.ellipse(b[0], b[1], wpx * 0.7, wpx * 0.22, 0, 0, 7); ctx.fill(); // the contact shade at the feet
    const x0 = b[0] - wpx / 2, y0 = b[1] - hpx, r = wpx * 0.22;
    ctx.beginPath(); ctx.moveTo(x0 + r, y0 + hpx * 0.3); ctx.lineTo(x0 + wpx - r, y0 + hpx * 0.3); ctx.quadraticCurveTo(x0 + wpx, y0 + hpx * 0.3, x0 + wpx, y0 + hpx * 0.3 + r); ctx.lineTo(x0 + wpx, y0 + hpx); ctx.lineTo(x0, y0 + hpx); ctx.lineTo(x0, y0 + hpx * 0.3 + r); ctx.quadraticCurveTo(x0, y0 + hpx * 0.3, x0 + r, y0 + hpx * 0.3); ctx.closePath();
    ctx.fillStyle = '#ff4fa3'; ctx.fill(); ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(b[0], y0 + hpx * 0.15, wpx * 0.32, hpx * 0.15, 0, 0, 7); ctx.fillStyle = '#ffd0e6'; ctx.fill(); ctx.stroke();
    ctx.restore();
    return (o.stats = { hpx, wpx, k, base: b, centre: c });
  }

  /* the terrace steps of the window in H (min, max over consecutive terraces; equal with spread 1) */
  function terraceSteps(S, P, tilesPerH) {
    const N = P.terraces; let lo = 1e9, hi = -1e9;
    for (let t = 1; t < N; t++) { const d = E.terBase(t, P, S.center) - E.terBase(t - 1, P, S.center); lo = Math.min(lo, d); hi = Math.max(hi, d); }
    return N < 2 ? null : { min: lo / tilesPerH, max: hi / tilesPerH };
  }

  /* M2b, THE ZONES OF A PNG (mode 3, example "Your images"): the Stage rules read ZONES (E.stage.zoneMap): for a PNG they come from the role `zone`, not from the rooms layer.
     ORDER [R, a HYPOTHESIS to calibrate against the paired shot]: BFS over the adjacency of the zones (4-neighbour tiles with different ids) from the zone of the LOWEST mean elevation (ties: the lowest id), the neighbours of a zone in ascending id, a zone that the BFS does not reach starts the next one (the lowest mean among the rest). The id of a zone in the window is its place in that order, 1..N (an explicit table: 0 is "none", the raw id of the image is not used), so `stageRooms` = [1] is the lowest zone.
     FOOTPRINT: only the LARGEST connected piece (walking graph) of a zone of the window is its footprint; the walkable tiles of its other pieces are dropped (0) and counted (`S.stageZonesInfo`, shown in the readout). DAC rooms are not touched. */
  function zoneTable(pack) {
    const z = pack.fields && pack.fields.zone; if (!z) return null; if (z.stageTable) return z.stageTable;
    const W = pack.width, H = pack.height, ids = z.sliceIds || (z.sliceIds = E.fillUnassigned(z.ids, W, H)), sum = new Map(), cnt = new Map(), adj = new Map();
    const link = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); if (!adj.has(b)) adj.set(b, new Set()); adj.get(a).add(b); adj.get(b).add(a); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, a = ids[i]; if (a <= 0) continue; const e = pack.elevation[i]; if (e > 0) { sum.set(a, (sum.get(a) || 0) + e); cnt.set(a, (cnt.get(a) || 0) + 1); } else if (!sum.has(a)) { sum.set(a, 0); cnt.set(a, 0); } if (x + 1 < W && ids[i + 1] > 0 && ids[i + 1] !== a) link(a, ids[i + 1]); if (y + 1 < H && ids[i + W] > 0 && ids[i + W] !== a) link(a, ids[i + W]); }
    const mean = (a) => (cnt.get(a) ? sum.get(a) / cnt.get(a) : Infinity), left = [...sum.keys()].sort((a, b) => a - b), order = [], seen = new Set();
    while (order.length < left.length) { const start = left.filter((a) => !seen.has(a)).sort((a, b) => mean(a) - mean(b) || a - b)[0], q = [start]; seen.add(start); for (let h = 0; h < q.length; h++) { order.push(q[h]); for (const b of [...(adj.get(q[h]) || [])].sort((p, r) => p - r)) if (!seen.has(b)) { seen.add(b); q.push(b); } } }
    return (z.stageTable = { order, toK: new Map(order.map((raw, k) => [raw, k + 1])), mean: order.map(mean), cnt, adj });
  }
  /* the zone map of the window (ids 1..N, 0 = none) and the footprint of the zones of the window `ks` (their place in the order): `S.stageZones`, `S.stageZonesInfo` */
  function buildZones(S, P, pack, ks) {
    const tb = zoneTable(pack), z = pack.fields.zone, ids = z.sliceIds, W = S.W, H = S.H, zm = new Int32Array(S.n);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const px = S.ox + x, py = S.oy + y; if (px < 0 || py < 0 || px >= pack.width || py >= pack.height) continue; zm[y * W + x] = tb.toK.get(ids[py * pack.width + px]) || 0; }
    const nb = E.walkGraph(S, P), vd = S.void, walk = (i) => !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0, info = { zones: tb.order.length, window: ks.slice(), raw: ks.map((k) => tb.order[k - 1]), discarded: {}, total: 0 };
    for (const k of ks) {
      const seen = new Uint8Array(S.n); let best = null; const pieces = [];
      for (let i = 0; i < S.n; i++) { if (zm[i] !== k || !walk(i) || seen[i]) continue; const c = [i]; seen[i] = 1; for (let h = 0; h < c.length; h++) for (const j of nb(c[h])) if (zm[j] === k && walk(j) && !seen[j]) { seen[j] = 1; c.push(j); } pieces.push(c); if (!best || c.length > best.length) best = c; }
      let d = 0; for (const c of pieces) if (c !== best) { for (const i of c) zm[i] = 0; d += c.length; } info.discarded[k] = d; info.total += d;
    }
    S.stageZones = zm; S.stageZonesInfo = info;
  }
  /* M3c, THE GOAL FROM A POI (docs/crystallizers/03-stage/README.md "M3c"): the role `poi` of the pack (S.fields.poi.values, a graded 0..1 mask: E.shape crops the fields to the window of the slice, so it is indexed like the tiles of S) marks the goal of a zone. Among the walkable tiles of the FOOTPRINT of zone `k` (E.stage.zoneMap) with poi >= POI_MIN [R, a hypothesis] the one with the highest value wins; a tie goes to the tile nearest the centroid of the tied ones. null without the role or without such a tile (the rule of the rules then stays as it was). Used by orient.js and props.js for the LAST zone of a window. */
  const POI_MIN = 0.5;
  function poiGoal(S, k) {
    const v = S.fields && S.fields.poi && S.fields.poi.values; if (!v) return null;
    const zm = zoneMap(S), W = S.W, vd = S.void; let best = -1, tied = [];
    for (let i = 0; i < S.n; i++) { if (zm[i] !== k || S.block[i] || (vd && vd[i]) || !(S.region && S.region[i] >= 0) || (S.nowalk && S.nowalk[i])) continue; const q = v[i]; if (!(q >= POI_MIN)) continue; if (q > best + 1e-9) { best = q; tied = [i]; } else if (Math.abs(q - best) <= 1e-9) tied.push(i); }
    if (!tied.length) return null;
    let cx = 0, cy = 0; for (const i of tied) { cx += (i % W) + 0.5; cy += ((i / W) | 0) + 0.5; } cx /= tied.length; cy /= tied.length;
    let tile = tied[0], bd = 1e18; for (const i of tied) { const d = ((i % W) + 0.5 - cx) ** 2 + (((i / W) | 0) + 0.5 - cy) ** 2; if (d < bd - 1e-12) { bd = d; tile = i; } }
    return { tile, value: best, tied: tied.length };
  }
  /* M2c, THE WINDOW SELECTOR (pure model, no interface): one row per zone in the order of zoneTable: { k (the place in the order, 1..N), raw (the id of the image), tiles (land tiles), elev (the mean elevation of zoneTable), adj (the k of the neighbouring zones, ascending) }.
     windowCheck(ks, list) -> the CONSECUTIVE pairs of the window [ka, kb] that are not neighbours (no walking path between them: the window still works, "Next room" jumps). WIN_MAX = 12 [R, a hypothesis]: the most zones or rooms of a window. */
  const WIN_MAX = 12;
  function zoneList(pack) { const tb = zoneTable(pack); if (!tb) return null; return tb.order.map((raw, i) => ({ k: i + 1, raw, tiles: tb.cnt.get(raw) || 0, elev: tb.mean[i], adj: [...(tb.adj.get(raw) || [])].map((r) => tb.toK.get(r)).sort((a, b) => a - b) })); }
  function windowCheck(ks, list) { const bad = []; for (let q = 1; q < ks.length; q++) { const a = list[ks[q - 1] - 1]; if (!a || !a.adj.includes(ks[q])) bad.push([ks[q - 1], ks[q]]); } return bad; }
  E.stage = { zoneTable, buildZones, zoneMap, poiGoal, POI_MIN, zoneList, windowCheck, WIN_MAX, TERRACE_H, SUB_RATIO, derive, FOV, TAN, DEF, RANGE, HERO_W, STEP_H, ROW_NEAR, ROW_FAR, scale, dist, extent, clamp, walkable, cellOf, feetH, roomCentre, move, ratios, depthScale, drawHero, terraceSteps };
})(window.EVO = window.EVO || {});
