/* STAGE BORDERS (mode 3, PR S2; `E.border.apply(S, opts)`; docs/crystallizers/03-stage/README.md "S2"): the ground OUTSIDE the footprint of the 2D-HD window gets a profile that closes the stage: ISLA (a shallow moat of water around the footprint) and QUEBRADA (a rise on the far side, a deep drop on the camera side).
   VISUAL ONLY: the footprint (the tiles that are not S.block) is never touched, walking, regions and routes are computed before this runs, and the outside tiles are already blocked (S.block = 1): no new mark. Called by ui.js right after E.shape, only in mode 3 with a window and a border other than Off; Off = this file is never called (identical pixels).
   SEMANTICS (a) (user's decision): the height of an outside tile = the height of the NEAREST footprint tile (the datum, one function: `datum`, so it can switch to another source later) + the profile offset of the type. The offset is defined in H (the hero height), independent of tilesPerH, is floored to a RELATIVE grid of 0.25 TH
   (it is ADDED to the datum; the absolute height is never rounded) and converted to tiles with tilesPerH. The footprint is CLOSED first (dilate then erode, Chebyshev radius K = 4): the tiles of the closure that are not footprint (holes, 136 on dac_stage) are INTERIOR: no profile, they keep their source height.
   The separators between rooms are interior too (they are inside the closure). Only the OUTER border gets a profile. New levels go through E.roomTypes.insertLevels as it is (D-shared with Cake / Pocket / anchors); S.cache is reset (B contours are cached by level key).
   CAMERA: the "toward the camera" side is computed against the REAL base yaw of the camera (opts.yaw, degrees: baseYaw() of ui.js): the camera looks from (sin yaw, cos yaw) in map x / y (yaw 0: +y, the south edge; yaw 180: the north edge); nv = outward normal . that vector, +1 = faces the camera.
   TABLE: one row per type, with its own TH (hypothesis, S6 calibrates; 0.8 H for ISLA and QUEBRADA), the profile in H, and whether the offset tiles are water. ARENA / CIMA / MIRADOR are S2b (the table is extensible); QUEBRADA / MIRADOR never go to a Hub [U]. */
(function (E) {
  'use strict';
  const K = 4, GRID = 0.25, BLUR = 3;
  const clip = (v, a, b) => Math.max(a, Math.min(b, v));
  /* profiles in H: (dr, nv, TH) -> { off (H), water }; dr = distance to the border in rings of 1/3 H (distance in tiles * 3 / tilesPerH) */
  const PROFILES = {
    island: { label: 'Isla', TH: 0.8, fn: (dr, nv, TH) => ({ off: dr <= 6 ? -0.7 * TH : 0, water: dr <= 6 }) },
    quebrada: { label: 'Quebrada', TH: 0.8, fn: (dr, nv, TH) => ({ off: nv < 0 ? 1.5 * TH * Math.min(1, dr / 2) : (-3 * TH - 1.5 * TH) * Math.min(1, dr / 3), water: false }) }
  };
  const TYPES = Object.keys(PROFILES);
  /* THE DATUM: the height an outside tile starts from, before the profile. (a) = the height of the nearest footprint tile (the source tile carried by the sweep). Kept in ONE place on purpose. */
  const datum = (S, nearFp, i) => S.levelH[S.fine[nearFp[i]]];
  const dilate = (a, r, W, H) => { const o = new Uint8Array(a.length); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!a[y * W + x]) continue; for (let dy = -r; dy <= r; dy++) { const ny = y + dy; if (ny < 0 || ny >= H) continue; for (let dx = -r; dx <= r; dx++) { const nx = x + dx; if (nx >= 0 && nx < W) o[ny * W + nx] = 1; } } } return o; };
  const erode = (a, r, W, H) => { const o = new Uint8Array(a.length); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let ok = 1; for (let dy = -r; dy <= r && ok; dy++) { const ny = y + dy; if (ny < 0 || ny >= H) continue; for (let dx = -r; dx <= r; dx++) { const nx = x + dx; if (nx < 0 || nx >= W) continue; if (!a[ny * W + nx]) { ok = 0; break; } } } o[y * W + x] = ok; } return o; }; // outside the window counts as inside
  /* apply: opts { type, tilesPerH, yaw (degrees), test (mutation hooks of tools/test_border.js: noClosure, noGrid, tilesNotH, ignoreYaw, touchFootprint) }. Returns S.stageBorder = { type, TH, tilesPerH, yaw, tiles, water, levelsAdded, closure, boundary, towardCamera } or null (no footprint). */
  function apply(S, opts) {
    const prof = PROFILES[opts.type]; if (!prof) return null;
    const W = S.W, H = S.H, n = S.n, tph = opts.tilesPerH, TH = prof.TH, tm = opts.test || {}, vd = S.void;
    const fp = new Uint8Array(n); let nfp = 0; for (let i = 0; i < n; i++) if (!S.block[i] && !(vd && vd[i])) { fp[i] = 1; nfp++; }
    if (!nfp) return (S.stageBorder = null);
    const C = tm.noClosure ? fp : erode(dilate(fp, K, W, H), K, W, H); let nC = 0; for (let i = 0; i < n; i++) if (C[i] && !fp[i]) nC++;
    // boundary of the closed footprint, the outward normal from the gradient of the blurred inside mask
    const bl = new Float32Array(n), cnt = (2 * BLUR + 1) * (2 * BLUR + 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let dy = -BLUR; dy <= BLUR; dy++) for (let dx = -BLUR; dx <= BLUR; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) s += C[ny * W + nx]; } bl[y * W + x] = s / cnt; }
    const bnd = []; for (let i = 0; i < n; i++) { if (!C[i]) continue; const x = i % W, y = (i / W) | 0; let b = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !C[ny * W + nx]) b = true; } if (b) bnd.push(i); }
    // the nearest footprint tile of every tile (8-neighbour sweep) and the nearest boundary tile of every outside tile (the source of the profile)
    const sweep = (seeds, free) => { const src = new Int32Array(n).fill(-1), q = []; for (const i of seeds) { src[i] = i; q.push(i); } for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (src[j] < 0 && free(j)) { src[j] = src[i]; q.push(j); } } } return src; };
    const fpList = []; for (let i = 0; i < n; i++) if (fp[i]) fpList.push(i);
    const nearFp = sweep(fpList, () => true), src = sweep(bnd, (j) => !C[j]);
    // camera direction in map x / y: yaw 0 = the camera is on the +y side
    const yaw = (tm.ignoreYaw ? 0 : opts.yaw || 0) * Math.PI / 180, cx = Math.sin(yaw), cy = Math.cos(yaw);
    const g = (xx, yy) => bl[clip(yy, 0, H - 1) * W + clip(xx, 0, W - 1)];
    const nvOf = (b) => { const x = b % W, y = (b / W) | 0, gx = g(x + 1, y) - g(x - 1, y), gy = g(x, y + 1) - g(x, y - 1), m = Math.hypot(gx, gy) || 1; return (-gx * cx - gy * cy) / m; };
    const nvCache = new Map(), gridH = GRID * TH, moves = new Map(); let water = 0, up = 0, down = 0, toward = 0;
    for (let i = 0; i < n; i++) {
      if (C[i] || src[i] < 0 || (vd && vd[i]) || nearFp[i] < 0) continue; // the closed footprint (footprint + interior) is never touched; void is not terrain
      const b = src[i], x = i % W, y = (i / W) | 0, dt = Math.hypot(x - (b % W), y - ((b / W) | 0)), dr = dt * 3 / tph; let nv = nvCache.get(b); if (nv === undefined) nvCache.set(b, nv = nvOf(b));
      const r = prof.fn(dr, nv, TH), offg = tm.noGrid ? r.off : Math.floor(r.off / gridH + 1e-9) * gridH, h = datum(S, nearFp, i) + offg * (tm.tilesNotH ? 1 : tph); // relative grid: floored in H, then added to the datum in tiles
      if (Math.abs(h - S.levelH[S.fine[i]]) < 1e-9) continue;
      moves.set(i, { h, meta: r.water ? { ter: 0, sub: 0, bridge: false, water: true } : { ter: S.ter[i], sub: 0, bridge: false, deco: true } }); if (r.water) water++; if (h > S.levelH[S.fine[i]]) up++; else down++; if (nv > 0) toward++;
    }
    if (tm.touchFootprint) for (let i = 0; i < n; i++) if (fp[i] && i % 7 === 0) moves.set(i, { h: S.levelH[S.fine[i]] + 0.5, meta: { ter: S.ter[i], sub: 0, bridge: false, deco: true } }); // (MUTATION touchFootprint: a footprint tile moved)
    const before = S.levelH.length, added = moves.size ? E.roomTypes.insertLevels(S, moves) : 0; S.cache = {};
    return (S.stageBorder = { type: opts.type, label: prof.label, TH, tilesPerH: tph, yaw: opts.yaw || 0, footprint: nfp, closure: nC, boundary: bnd.length, tiles: moves.size, water, up, down, towardCamera: toward, levelsBefore: before, levelsAdded: added, grid: gridH });
  }
  E.border = { K, GRID, TYPES, PROFILES, datum, apply };
})(window.EVO || (window.EVO = {}));
