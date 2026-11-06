/* STAGE VOLUMES (mode 3, PR S4b; `E.volumes.apply(S, opts)`; docs/crystallizers/03-stage/README.md "S4b"): DECLARED volumes (rectangles of tiles, flat roofs) raised on tiles that are ALREADY blocked, in hero heights H: [{ x, y, w, d, hH }], x / y = the integer MIN corner in MAP coordinates (the window offset S.ox / S.oy is subtracted here), w x d in tiles.
   REAL GEOMETRY, VISUAL ONLY: the tiles move through the same mechanism as src/border.js (`moves` -> `E.roomTypes.insertLevels`, `S.cache = {}`), so a volume follows the vertical projection, enters the pick buffer and occludes like terrain. The walkable footprint (the tiles that are not S.block) is NEVER touched, walking, regions and routes are computed before this runs.
   Called by ui.js right after E.border.apply (order: shape -> border -> volumes), only in mode 3 with a window and the switch on; off = this file is never called (identical pixels).
   HEIGHT = flat roof = the height of the NEAREST walkable ground (the datum of border.js: the footprint tile nearest to the centre of the rectangle, an 8-neighbour sweep) + hH x tilesPerH, hH floored to a RELATIVE grid of 0.25 H (added to the datum; the absolute height is never rounded), independent of tilesPerH. A tile already at or above the roof is not lowered (skipped, 'higher').
   RULES (a tile that breaks one is OMITTED with its reason in `S.stageVolumes.skipped`, never an error): 'outside' (not in the window), 'void', 'walkable' (a footprint tile, S.block = 0), 'water' (the border's moat or a water tile), 'margin' (Chebyshev distance < 2 from a tile of a transition: step columns, bottom / top tiles), 'higher'.
   OCCLUSION (the acceptance criterion of the example, measured by tools/ui/test_stage_volumes_ui.js against the pick buffer): no walkable tile loses more than 25 % of its pixels to a volume at the base Cam 6 of the example (yaw 180; worst measured 16.9 %, partial lateral occlusion by perspective next to a volume); with other cameras of mode 3 (yaw 0, 90, 270) volumes can hide tiles. This module does not enforce it (it depends on the camera): the DECLARED list is chosen to obey it at yaw 180. KNOWN LIMIT: turning volumes on changes view().zoom and fitSc by about 0.1 % (the fit uses the highest level; the effective scale is the same).
   Test hooks (`E.volumesTest`, tests only, undefined in normal use): touchFootprint, tilesNotH, volumeOnWalkable, noMargin, noGrid. */
(function (E) {
  'use strict';
  const GRID = 0.25, MARGIN = 2; // the relative height grid in H; the margin in tiles (Chebyshev) from the tiles of a transition
  const T = () => E.volumesTest || {};
  const sweep = (S, seeds) => { const W = S.W, H = S.H, n = S.n, src = new Int32Array(n).fill(-1), q = []; for (const i of seeds) { src[i] = i; q.push(i); } for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (src[j] < 0) { src[j] = src[i]; q.push(j); } } } return src; }; // the nearest footprint tile of every tile (the datum source of border.js)
  /* apply: opts { list: [{ x, y, w, d, hH }], tilesPerH, test }. Returns S.stageVolumes = { list, tilesPerH, grid, volumes: [{ k, datum, roof, tiles, skipped }], tiles, skipped: [{ k, x, y, reason }], levelsBefore, levelsAdded } or null (no footprint). */
  function apply(S, opts) {
    const W = S.W, H = S.H, n = S.n, tph = opts.tilesPerH, list = opts.list || [], tm = opts.test || T(), vd = S.void;
    const fp = []; for (let i = 0; i < n; i++) if (!S.block[i] && !(vd && vd[i])) fp.push(i);
    if (!fp.length) return (S.stageVolumes = null);
    const near = sweep(S, fp), foot = new Set(); // the tiles of the transitions: step columns, bottom and top
    for (const r of S.stairs || []) { for (const st of r.steps || []) for (const t of st.tiles) foot.add(t); for (const t of r.bottom || []) foot.add(t); for (const t of r.top || []) foot.add(t); }
    const ft = [...foot].map((t) => [t % W, (t / W) | 0]);
    const nearStair = (x, y) => { for (const [fx, fy] of ft) if (Math.max(Math.abs(fx - x), Math.abs(fy - y)) < MARGIN) return true; return false; };
    const moves = new Map(), skipped = [], vols = [], claimed = new Set(); let tiles = 0;
    list.forEach((v, k) => {
      const x0 = Math.floor(v.x - S.ox), y0 = Math.floor(v.y - S.oy), w = Math.max(1, Math.floor(v.w)), d = Math.max(1, Math.floor(v.d));
      const cx = Math.min(W - 1, Math.max(0, x0 + (w >> 1))), cy = Math.min(H - 1, Math.max(0, y0 + (d >> 1))), src = near[cy * W + cx];
      const datum = S.levelH[S.fine[src]], hg = tm.noGrid ? v.hH : Math.floor(v.hH / GRID + 1e-9) * GRID, roof = datum + hg * (tm.tilesNotH ? 1 : tph);
      const info = { k, datum, roof, hGrid: hg, tiles: 0, skipped: 0 }; vols.push(info);
      const meta = { ter: S.levelMeta[S.fine[src]].ter, sub: 0, bridge: false, deco: true, vol: true };
      for (let y = y0; y < y0 + d; y++) for (let x = x0; x < x0 + w; x++) {
        const skip = (reason) => { skipped.push({ k, x: x + S.ox, y: y + S.oy, reason }); info.skipped++; };
        if (x < 0 || y < 0 || x >= W || y >= H) { skip('outside'); continue; }
        const i = y * W + x;
        if (vd && vd[i]) { skip('void'); continue; }
        if (!S.block[i] && !tm.volumeOnWalkable) { skip('walkable'); continue; }
        const m = S.levelMeta[S.fine[i]]; if (m && m.water) { skip('water'); continue; }
        if (!tm.noMargin && nearStair(x, y)) { skip('margin'); continue; }
        if (S.levelH[S.fine[i]] >= roof - 1e-9) { skip('higher'); continue; }
        if (claimed.has(i)) { skip('overlap'); continue; }
        claimed.add(i); moves.set(i, { h: roof, meta }); info.tiles++; tiles++;
      }
    });
    if (tm.touchFootprint) for (const i of fp) if (i % 7 === 0) moves.set(i, { h: S.levelH[S.fine[i]] + 0.5, meta: { ter: S.ter[i], sub: 0, bridge: false, deco: true } }); // (MUTATION touchFootprint: a footprint tile moved)
    const before = S.levelH.length, added = moves.size ? E.roomTypes.insertLevels(S, moves) : 0; S.cache = {};
    return (S.stageVolumes = { list: list.map((v) => Object.assign({}, v)), tilesPerH: tph, grid: GRID, volumes: vols, tiles, skipped, levelsBefore: before, levelsAdded: added });
  }
  E.volumes = { GRID, MARGIN, apply };
})(window.EVO = window.EVO || {});
