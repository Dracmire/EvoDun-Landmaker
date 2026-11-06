/* STAGE PLANES BY ROOM (mode 3, PR C2; `E.planes`; docs/crystallizers/03-stage/README.md "C2"): the RULE of planes of the "mock T". With the camera of the room (the yaw of C1), what lies OUTSIDE the room is classified per COLUMN (perpendicular to the view axis):
   - BACK (FONDO) = beyond the far end of the room in that column; SIDE (LATERAL) = in a column the room does not cover (or between its near and far ends); FRONT (FRENTE) = before the near end of the room in that column. (A tile in two classes: BACK > SIDE > FRONT; the per-column rule gives one.)
   - Only tiles that are NOT walkable and not void are classified (the walkable footprint of every room never changes height). Within a ring of HYP.R tiles around the room's footprint.
   What is done (the mechanism of border.js / volumes.js: `E.roomTypes.insertLevels`, `S.cache = {}`; visual only, the walkable footprint is never touched):
   - BACK: the closing WALL = the first HYP.wallDepth tiles of the back band are raised to the highest walkable ground of the room + HYP.wallH H;
   - SIDE: 1 x 1 COLUMNS of HYP.colH H (over the local ground of the room's edge), one every HYP.colEvery rows along the axis, on the first non-walkable tile beside the room on each side (over void: none, counted);
   - FRONT: the tiles of the first HYP.frontDepth tiles of the front band that are ABOVE the lowest walkable ground of the room are lowered to that ground - HYP.frontDrop H, so they do not hide the room.
   Lowering uses the same insertLevels (a move to a lower height): no new mechanism in the shared code.
   HYP = ONE table of hypotheses for S6 (tiles or H; H are multiplied by tilesPerH). Test hooks (`E.planesTest`, tests only): noBack, noFront, noCols, colEvery (a number), wallOnWalkable. */
(function (E) {
  'use strict';
  const HYP = { R: 8, wallDepth: 2, wallH: 3, colH: 3, colEvery: 3, frontDepth: 4, frontDrop: 0.5 };
  const BACK = 1, SIDE = 2, FRONT = 3;
  /* classify(S, room, yaw, opts?) -> { cls (Uint8Array, 0 none), A, Pc (the view coordinates of every tile), near, far (Map column -> extent), f, r (the view frame), counts { back, side, front }, footprint (tile list) }.
     room = { id } (a record of E.orient); yaw a multiple of 90. opts.all: classify the walkable tiles too (a test mutation). */
  function classify(S, room, yaw, opts) {
    opts = opts || {}; const W = S.W, H = S.H, n = S.n, vd = S.void, look = E.orient.lookOf(yaw), f = [look[0], look[1]], r = [-f[1], f[0]];
    const walk = (i) => !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]), eligible = (i) => !(vd && vd[i]) && (opts.all || !walk(i));
    const A = new Int32Array(n), Pc = new Int32Array(n); for (let i = 0; i < n; i++) { const x = i % W, y = (i / W) | 0; A[i] = x * f[0] + y * f[1]; Pc[i] = x * r[0] + y * r[1]; }
    const foot = [], inFoot = new Uint8Array(n), near = new Map(), far = new Map();
    for (let i = 0; i < n; i++) if (S.roomMap[i] === room.id && !S.block[i] && !(vd && vd[i])) { foot.push(i); inFoot[i] = 1; const p = Pc[i], a = A[i]; if (!near.has(p) || a < near.get(p)) near.set(p, a); if (!far.has(p) || a > far.get(p)) far.set(p, a); }
    const ring = new Uint8Array(n); for (const i of foot) { const x = i % W, y = (i / W) | 0; for (let dy = -HYP.R; dy <= HYP.R; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -HYP.R; dx <= HYP.R; dx++) { const xx = x + dx; if (xx >= 0 && xx < W) ring[yy * W + xx] = 1; } } }
    const cls = new Uint8Array(n), counts = { back: 0, side: 0, front: 0 };
    for (let i = 0; i < n; i++) { if (!ring[i] || inFoot[i] || !eligible(i)) continue; const p = Pc[i], a = A[i]; let c;
      if (far.has(p)) c = a > far.get(p) ? BACK : a < near.get(p) ? FRONT : SIDE; else c = SIDE;
      cls[i] = c; if (c === BACK) counts.back++; else if (c === SIDE) counts.side++; else counts.front++; }
    return { cls, A, Pc, near, far, f, r, counts, footprint: foot, walk, W, H, n };
  }
  /* apply(S, { room, yaw, tilesPerH, test }) -> S.stagePlanes = { room, yaw, tilesPerH, counts, wall, cols, front, colRows, skipped, levelsAdded, floorLow, floorHigh } or null (no footprint) */
  function apply(S, o) {
    const T = o.test || E.planesTest || {}, tp = o.tilesPerH, W = S.W, vd = S.void, C = classify(S, o.room, o.yaw, { all: !!T.wallOnWalkable });
    if (!C.footprint.length) return (S.stagePlanes = null);
    let high = -1e9, low = 1e9; for (const i of C.footprint) if (C.walk(i)) { const h = S.levelH[S.fine[i]]; high = Math.max(high, h); low = Math.min(low, h); } if (high < -1e8) { high = low = S.levelH[S.fine[C.footprint[0]]]; }
    const moves = new Map(), skipped = { higher: 0, void: 0 }, hOf = (i) => S.levelH[S.fine[i]], at = (a, p) => { const x = a * C.f[0] + p * C.r[0], y = a * C.f[1] + p * C.r[1]; return x < 0 || y < 0 || x >= W || y >= S.H ? -1 : y * W + x; };
    const meta = (kind) => ({ ter: 0, sub: 0, bridge: false, deco: true, plane: kind });
    let wall = 0, cols = 0, front = 0; const colRows = { '-1': [], '1': [] };
    // BACK: the closing wall
    if (!T.noBack) { const roof = high + HYP.wallH * tp; for (let i = 0; i < S.n; i++) { if (C.cls[i] !== BACK) continue; const d = C.A[i] - C.far.get(C.Pc[i]); if (d < 1 || d > HYP.wallDepth) continue; if (hOf(i) >= roof - 1e-9) { skipped.higher++; continue; } moves.set(i, { h: roof, meta: meta('wall') }); wall++; } }
    // SIDE: columns every colEvery rows along the axis, beside the room, on both sides
    if (!T.noCols) { const every = T.colEvery || HYP.colEvery; let aMin = 1e9, aMax = -1e9; for (const i of C.footprint) { aMin = Math.min(aMin, C.A[i]); aMax = Math.max(aMax, C.A[i]); }
      const rowTiles = new Map(); for (const i of C.footprint) { const a = C.A[i]; if (!rowTiles.has(a)) rowTiles.set(a, []); rowTiles.get(a).push(i); }
      for (let a0 = aMin; a0 <= aMax; a0 += every) { const ts = rowTiles.get(a0); if (!ts) continue; let pMin = 1e9, pMax = -1e9, iMin = -1, iMax = -1; for (const i of ts) { if (C.Pc[i] < pMin) { pMin = C.Pc[i]; iMin = i; } if (C.Pc[i] > pMax) { pMax = C.Pc[i]; iMax = i; } }
        for (const s of [-1, 1]) { const p0 = s > 0 ? pMax : pMin, edge = s > 0 ? iMax : iMin; let placed = false;
          for (let k = 1; k <= HYP.R && !placed; k++) { const j = at(a0, p0 + s * k); if (j < 0) break; if (vd && vd[j]) { skipped.void++; break; } if (C.walk(j)) continue; if (C.cls[j] !== SIDE) continue;
            const roof = hOf(edge) + HYP.colH * tp; if (hOf(j) >= roof - 1e-9) { skipped.higher++; placed = true; break; } if (moves.has(j)) { placed = true; break; } moves.set(j, { h: roof, meta: meta('col') }); cols++; colRows[s].push(a0); placed = true; } } } }
    // FRONT: the tiles above the lowest ground of the room are lowered below it
    if (!T.noFront) { const target = low - HYP.frontDrop * tp; for (let i = 0; i < S.n; i++) { if (C.cls[i] !== FRONT) continue; const d = C.near.get(C.Pc[i]) - C.A[i]; if (d < 1 || d > HYP.frontDepth) continue; if (hOf(i) <= low + 1e-9 || moves.has(i)) continue; moves.set(i, { h: target, meta: meta('front') }); front++; } }
    const before = S.levelH.length, added = moves.size ? E.roomTypes.insertLevels(S, moves) : 0; S.cache = {};
    return (S.stagePlanes = { room: o.room.id, yaw: o.yaw, tilesPerH: tp, counts: C.counts, wall, cols, front, colRows, skipped, levelsBefore: before, levelsAdded: added, floorLow: low, floorHigh: high });
  }
  E.planes = { HYP, BACK, SIDE, FRONT, classify, apply };
})(window.EVO = window.EVO || {});
