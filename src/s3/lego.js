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
  L.M_MAX = 3; // the cap of m when the number of terraces is not known (the old fixed cap)
  L.mMax = (T) => (T > 0 ? Math.round(T / 2) + 1 : L.M_MAX); // PR Q2 (D5 of [U], interpretation of [R], to confirm): m <= round(T / 2) + 1, T = the number of terraces (3 -> 3, 5 -> 4, 7 -> 5, 9 -> 6); the ONE place of the cap [R]
  /* the walkable tiles of the room (the same predicate as vert.js) */
  const walkOf = (S, rec) => { const zm = E.stage.zoneMap(S), vd = S.void; return (i) => zm[i] === rec.id && !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]); };
  /* the terraces of the room: { t (0-based), base (old height), top (old height of its last sub-level), n tiles, u (mean view depth) } sorted by t */
  L.terraces = function (S, P, rec, yaw) {
    const W = S.W, walk = walkOf(S, rec), look = E.orient.lookOf(yaw === undefined ? rec.yaw : yaw), K = S.subs, s = E.subHeight(P), by = new Map();
    for (let i = 0; i < S.n; i++) { if (!walk(i)) continue; const mt = S.levelMeta[S.fine[i]]; if (!mt || mt.bridge || mt.deco) continue; const t = mt.ter, q = by.get(t) || { t, n: 0, su: 0 }; q.n++; q.su += (i % W + 0.5) * look[0] + (((i / W) | 0) + 0.5) * look[1]; by.set(t, q); }
    return [...by.values()].sort((a, b) => a.t - b.t).map((q) => { const base = E.terBase(q.t, P, S.center); return { t: q.t, base, top: base + (K - 1) * s, n: q.n, u: q.su / q.n }; });
  };
  /* m of the room: its lowest walkable terrace (1-based), 1..3 */
  L.mOf = (terr, T) => (terr.length ? Math.max(1, Math.min(L.mMax(T), terr[0].t + 1)) : 1);
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
    let f, m;
    if (terr.length < 2) { // PR lego3 (A539): a room on ONE terrace: the heights of its SUB-LEVELS are multiplied by m (Up: the lowest sub-level stays; Down: the highest stays); the level RANKING is the same, so the topology (which counts sub-levels, not heights) is identical
      out.single = true; out.m = L.mOf(terr, P.terraces); if (!(terr.length === 1 && out.m >= 2)) return out; const q = terr[0]; m = out.m; out.sub = true;
      f = treatment === 'up' ? (h) => ((h < q.base - 1e-9 || h > q.top + 1e-9) ? h : q.base + (h - q.base) * m) : (h) => ((h < q.base - 1e-9 || h > q.top + 1e-9) ? h : q.top - (q.top - h) * m);
    } else {
      m = L.mOf(terr, P.terraces); const Eh = P.terH, nb = L.newBases(terr, m, Eh, treatment); f = L.heightMap(terr, nb); out.m = m;
      for (let r = 0; r + 1 < terr.length; r++) out.jumps.push(+(nb[r + 1] - nb[r]).toFixed(4));
      if (!L.ordered(terr, treatment, false)) { if (L.ordered(terr, treatment, true)) out.yawFlip = true; else out.conflict = 'no yaw orders the walkable terraces of the room as the treatment wants (a higher one stays nearer than a lower one): not forced'; }
    }
    const walk = walkOf(S, rec), moves = new Map(), cache = new Map();
    for (let i = 0; i < S.n; i++) {
      if (!walk(i) || (S.ringTile && S.ringTile[i])) continue; /* PR lego3 (A538): the Cake ring tiles are never re-heighted (Rest: they stay as they were; Scale: they were built m times more numerous, with the same height per ring) */ const l = S.fine[i], h0 = S.levelH[l]; let h = cache.get(l); if (h === undefined) { h = f(h0); cache.set(l, h); } if (Math.abs(h - h0) < 1e-9) continue;
      moves.set(i, { h, meta: Object.assign({}, S.levelMeta[l], { lego: true }) });
    }
    // the ends of the ramps that join terraces of the room (the surface is linear between them; the tiles stay the same)
    for (const rec2 of S.stairs || []) { const R = rec2.ramp, pa = rec2.site; if (!R || !pa || !(walk(pa.a) || walk(pa.b)) || R.__lego) continue; R.h0o = R.h0; R.h1o = R.h1; R.h0 = f(R.h0); R.h1 = f(R.h1); R.__lego = true; }
    if (o.cakeLego === 'scale' && !out.sub && S.cake && S.cake.claim && S.ringTile) { // CAKE SCALE: the ring tiles of the links of this room, m times taller from their anchor
      const fw = S.mapW, W = S.W, claim = S.cake.claim; let rings = 0; out.cakeScale = { tiles: 0, maxRelief: 0 };
      for (let i = 0; i < S.n; i++) { if (!S.ringTile[i]) continue; const c = claim.get(((((i / W) | 0) + S.oy) * fw) + (i % W) + S.ox); if (!c || !c.link || c.link.room !== rec.id) continue; const l = c.link, h0 = S.levelH[S.fine[i]], anchor0 = l.coreTop, anchor1 = f(anchor0), h1 = l.down ? anchor1 + (h0 - anchor0) * m : anchor1 - (anchor0 - h0) * m; if (Math.abs(h1 - h0) < 1e-9) continue; moves.set(i, { h: h1, meta: Object.assign({}, S.levelMeta[S.fine[i]], { lego: true, ring: true }) }); rings++; out.cakeScale.maxRelief = Math.max(out.cakeScale.maxRelief, Math.abs(h1 - anchor1)); }
      out.cakeScale.tiles = rings;
    }
    if (moves.size) { out.levelsAdded = E.s3.roomTypes.insertLevels(S, moves); out.moved = moves.size; }
    S.cache = {}; return out;
  };
  /* CAKE UNDER LEGO, SCALE (t79, A543, rule of [U]: the footprint of Scale on the HIGH terrace must be <= Mid's): done in `apply` as a RE-HEIGHT of the ring tiles of the room's links, NOT as more rings: the SAME tiles (so the footprint on the high terrace is exactly Mid's), each ring m TIMES TALLER from its anchor (Down link, a bowl cut into the high terrace: from the core top up; Up link, a pyramid: from the platform top down), which is what the m-times higher jump leaves room for (checked: m * r <= the new gap). "More rings outward on the low terrace" was not needed. REST = the ring tiles keep their heights (they are never re-heighted).
     STAIRS (t79, A545): the pass 3 change (a shorter ramp) is GONE: a stair keeps the style of the example (`steps`) and its treads; the m-times taller jump is the height stretch of `apply`. Half the depth with m times more risers cannot be drawn in the tile model (a tread is one tile = one level; more risers in fewer tiles means sub-tile treads: a clone of the step renderer): NOT built, reported. */
  /* t79: the ring tiles that stand on the HIGH terrace of the room (original terrace of the tile >= the room's highest walkable terrace), for the table of Rest / Scale vs Mid */
  L.ringsOnHigh = function (S, P, rec, yaw) {
    const terr = L.terraces(S, P, rec, yaw); if (terr.length < 2 || !S.ringTile) return null; const top = terr[terr.length - 1].t; let n = 0, all = 0, inRoom = 0; const zm = E.stage.zoneMap(S);
    for (let i = 0; i < S.n; i++) if (S.ringTile[i]) { all++; if (S.ter[i] >= top) n++; if (zm[i] === rec.id) inRoom++; } return { ringTiles: all, onHighTerrace: n, inRoom, highTerrace: top + 1 };
  };
  /* AUTO (A538, counted only, not built): Scale when the Cake is the ONLY ascent to the highest terrace of the room (no stair of the room ends on it), Rest otherwise */
  L.autoPick = function (S, P, rec, yaw) {
    const terr = L.terraces(S, P, rec, yaw); if (terr.length < 2) return { pick: 'n/a', why: 'one terrace' }; const top = terr[terr.length - 1].t, walk = walkOf(S, rec);
    const tOf = (i) => { const mt = S.levelMeta[S.fine[i]]; return mt ? mt.ter : -1; };
    const toTop = (S.stairs || []).filter((r) => r.site && (walk(r.site.a) || walk(r.site.b)) && Math.max(tOf(r.site.a), tOf(r.site.b)) >= top).length;
    return { pick: S.cake && S.cake.links > 0 && toTop === 0 ? 'scale' : 'rest', stairsToTop: toTop, cake: !!(S.cake && S.cake.links > 0) };
  };
  /* DOWN scenery: the closing wall of `planes` (BACK, after planes.apply) falls to m * E below the highest ground of the room */
  L.scenery = function (S, P, o) {
    const info = S.legoInfo, out = { lowered: 0 }; if (!info || info.treatment !== 'down' || !S.stagePlanes || !S.stagePlanes.wall) return out;
    const high = S.stagePlanes.floorHigh, target = high - info.m * info.E, moves = new Map();
    for (let i = 0; i < S.n; i++) { const mt = S.levelMeta[S.fine[i]]; if (mt && mt.plane === 'wall' && S.levelH[S.fine[i]] > target) moves.set(i, { h: target, meta: Object.assign({}, mt, { lego: true }) }); }
    if (moves.size) { E.s3.roomTypes.insertLevels(S, moves); S.cache = {}; } out.lowered = moves.size; info.sceneryLowered = out.lowered; return out;
  };
})(window.EVO = window.EVO || {});
