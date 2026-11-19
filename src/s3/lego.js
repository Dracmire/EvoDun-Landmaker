/* STAGE 3 CONSTRUCTOR (DAC3): LEGO VERTICALITY BY TERRACE, rule L2' (docs/crystallizers/03-stage/research/octopath2/verticalidad_lego.md section 7b, stage_lego_go.md, decisions D-L1..D-L5 of [U]). It lives ONLY in src/s3/ (never in the original DAC chain) and only runs behind the Stage selector "Height treatment" (Mid = this file is never called: identical pixels, byte for byte).
   TREATMENT per room (`down` | `mid` | `up`; `mid` = today):
   - m = the BASE terrace of the room (the lowest terrace its walkable tiles step on, 1-based), clamped to 1..3 (1 simple, 2 double, 3 triple). E = P.terH (one terrace of the Base).
   - UP: every jump between consecutive walkable terraces of the room measures m * E * D, D = the terraces it crosses (PR lego2, A531; D = 1 for adjacent terraces, so the first pass is unchanged there). The lowest terrace stays where it is, the others rise.
   - DOWN: the same m, downward: the HIGHEST walkable terrace of the room stays where it is and every other falls m * E per jump (the viewpoint stays high, everything falls around the hero).
   - The sub-terraces (micro relief) keep their own steps; the heights BETWEEN terraces (the bridge levels of `steps`, the ends of a ramp) are stretched linearly between the top sub-level of a terrace and the base of the next, so stairs and ramps keep joining the same terraces (a ramp gets steeper: its depth is fixed).
   - THE TOPOLOGY STAYS IDENTICAL: the same tiles, regions, walking graph and stairs; only the heights of the levels of the ROOM's tiles change (their `S.fine` points to new levels inserted with the clone's `insertLevels`; `S.block`, `S.void`, `S.region`, `S.roomMap`, the stairs list and its records' tiles are not touched; the ramp records only get the heights of their two ends mapped by the same function). Checked by hash in tools/test_lego.js. A room that steps on ONE terrace gains nothing: it is returned as `single` (not a conflict, counted).
   - L4 (the scenery rises / falls with the room): `apply` runs BEFORE `E.planes.apply`, so the planes read the new heights of the room (the back wall is `wallH` H over the highest ground of the room = 2.4 E at the Base unit: UP gives the "2-3 E over the top"); in DOWN `scenery` lowers the closing wall to m * E below the top of the room (the far view is lower than the viewpoint). Geometry only, never billboards.
   - L6: if a higher walkable terrace of the room lies NEARER to the camera than a lower one at the yaw of the room (Up and Down alike), `yawFlip` says whether the opposite yaw orders them properly; if neither does, `conflict` says so and nothing is forced (the camera yaw is never changed here).
   `apply(S, P, { room: rec (E.orient), yaw, treatment, tilesPerH })` -> { treatment, m, E, terraces, moved, levelsAdded, single, conflict, yawFlip, jumps (the new jumps in tiles) }; `scenery(S, P, o)` -> the wall tiles lowered (DOWN only). */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0));
  const L = E.lego = {};
  L.M_MAX = 3;
  /* the walkable tiles of the room (the same predicate as vert.js) */
  const walkOf = (S, rec) => { const zm = E.stage.zoneMap(S), vd = S.void; return (i) => zm[i] === rec.id && !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]); };
  /* the terraces of the room: { t (0-based), base (old height), top (old height of its last sub-level), n tiles, u (mean view depth) } sorted by t */
  L.terraces = function (S, P, rec, yaw) {
    const W = S.W, walk = walkOf(S, rec), look = E.orient.lookOf(yaw === undefined ? rec.yaw : yaw), K = S.subs, s = E.subHeight(P), by = new Map();
    for (let i = 0; i < S.n; i++) { if (!walk(i)) continue; const mt = S.levelMeta[S.fine[i]]; if (!mt || mt.bridge || mt.deco) continue; const t = mt.ter, q = by.get(t) || { t, n: 0, su: 0 }; q.n++; q.su += (i % W + 0.5) * look[0] + (((i / W) | 0) + 0.5) * look[1]; by.set(t, q); }
    return [...by.values()].sort((a, b) => a.t - b.t).map((q) => { const base = E.terBase(q.t, P, S.center); return { t: q.t, base, top: base + (K - 1) * s, n: q.n, u: q.su / q.n }; });
  };
  /* m of the room: its lowest walkable terrace (1-based), 1..3 */
  L.mOf = (terr) => (terr.length ? Math.max(1, Math.min(L.M_MAX, terr[0].t + 1)) : 1);
  /* the new base of every terrace (by rank) */
  L.newBases = function (terr, m, Eh, treatment) { // PR lego2 (A531): a jump that crosses D terraces measures m * E * D (a jump of two terraces is no longer squeezed to one)
    const R = terr.length, out = new Array(R);
    if (treatment === 'up') for (let r = 0; r < R; r++) out[r] = terr[0].base + m * Eh * (terr[r].t - terr[0].t);
    else for (let r = 0; r < R; r++) out[r] = terr[R - 1].base - m * Eh * (terr[R - 1].t - terr[r].t);
    return out;
  };
  /* the piecewise-linear height map: anchors (base_r -> nb_r) and (top_r -> nb_r + the same sub offset), linear between; shifted beyond the ends */
  L.heightMap = function (terr, nb) {
    const A = []; terr.forEach((q, r) => { A.push([q.base, nb[r]]); A.push([q.top, nb[r] + (q.top - q.base)]); });
    return (h) => {
      if (h < A[0][0] - 1e-9 || h > A[A.length - 1][0] + 1e-9) return h; // outside the room's own span (a terrace below / above it belongs to another room): untouched
      for (let k = 0; k + 1 < A.length; k++) { const a = A[k], b = A[k + 1]; if (h <= b[0] + 1e-9) return b[0] - a[0] < 1e-9 ? a[1] : a[1] + (h - a[0]) * (b[1] - a[1]) / (b[0] - a[0]); }
      return h;
    };
  };
  /* L6: no higher walkable terrace of the room lies NEARER to the camera than a lower one (the same test for Up and Down: Up rises away from the camera, Down falls toward it, L5); `flip` = the opposite yaw */
  L.ordered = function (terr, treatment, flip) {
    for (let r = 0; r + 1 < terr.length; r++) { const du = (terr[r + 1].u - terr[r].u) * (flip ? -1 : 1); if (du < 0) return false; }
    return true;
  };
  L.apply = function (S, P, o) {
    const rec = o.room, treatment = o.treatment, out = { treatment, m: 1, E: P.terH, terraces: 0, moved: 0, levelsAdded: 0, single: false, conflict: null, yawFlip: false, jumps: [], tilesPerH: o.tilesPerH };
    S.legoInfo = out; if (!rec || (treatment !== 'up' && treatment !== 'down')) return out;
    const yaw = o.yaw === undefined ? rec.yaw : o.yaw, terr = L.terraces(S, P, rec, yaw); out.terraces = terr.length;
    if (terr.length < 2) { out.single = true; out.m = L.mOf(terr); return out; }
    const m = L.mOf(terr), Eh = P.terH, nb = L.newBases(terr, m, Eh, treatment), f = L.heightMap(terr, nb); out.m = m;
    for (let r = 0; r + 1 < terr.length; r++) out.jumps.push(+(nb[r + 1] - nb[r]).toFixed(4));
    if (!L.ordered(terr, treatment, false)) { if (L.ordered(terr, treatment, true)) out.yawFlip = true; else out.conflict = 'no yaw orders the walkable terraces of the room as the treatment wants (a higher one stays nearer than a lower one): not forced'; }
    const walk = walkOf(S, rec), moves = new Map(), cache = new Map();
    for (let i = 0; i < S.n; i++) {
      if (!walk(i)) continue; const l = S.fine[i], h0 = S.levelH[l]; let h = cache.get(l); if (h === undefined) { h = f(h0); cache.set(l, h); } if (Math.abs(h - h0) < 1e-9) continue;
      moves.set(i, { h, meta: Object.assign({}, S.levelMeta[l], { lego: true }) });
    }
    // the ends of the ramps that join terraces of the room (the surface is linear between them; the tiles stay the same)
    for (const rec2 of S.stairs || []) { const R = rec2.ramp, pa = rec2.site; if (!R || !pa || !(walk(pa.a) || walk(pa.b)) || R.__lego) continue; R.h0o = R.h0; R.h1o = R.h1; R.h0 = f(R.h0); R.h1 = f(R.h1); R.__lego = true; }
    if (moves.size) { out.levelsAdded = E.s3.roomTypes.insertLevels(S, moves); out.moved = moves.size; }
    S.cache = {}; return out;
  };
  /* DOWN scenery: the closing wall of `planes` (BACK, after planes.apply) falls to m * E below the highest ground of the room */
  L.scenery = function (S, P, o) {
    const info = S.legoInfo, out = { lowered: 0 }; if (!info || info.treatment !== 'down' || !S.stagePlanes || !S.stagePlanes.wall) return out;
    const high = S.stagePlanes.floorHigh, target = high - info.m * info.E, moves = new Map();
    for (let i = 0; i < S.n; i++) { const mt = S.levelMeta[S.fine[i]]; if (mt && mt.plane === 'wall' && S.levelH[S.fine[i]] > target) moves.set(i, { h: target, meta: Object.assign({}, mt, { lego: true }) }); }
    if (moves.size) { E.s3.roomTypes.insertLevels(S, moves); S.cache = {}; } out.lowered = moves.size; info.sceneryLowered = out.lowered; return out;
  };
})(window.EVO = window.EVO || {});
