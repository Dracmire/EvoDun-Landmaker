/* STAGE 3 CONSTRUCTOR (DAC3): COMPOSITIONAL VERTICALITY, family A (docs/crystallizers/03-stage/research/octopath2/verticalidad.md V1a, stage_verticalidad_go.md part C, decision D-V1 of [U]). It lives ONLY in src/s3/ (never in the original DAC chain) and only runs behind the Stage switch "Compositional verticality" (off = this file is never called: identical pixels).
   V1a (the band that rises): the walkable LEVELS of the hero's room are ordered by the mean view depth u of their walkable tiles (u grows away from the camera, the yaw of `E.orient`) and the heights are re-assigned monotonically: the farthest level gets the highest of the levels the room already has, the nearest the lowest (the same multiset of heights, the steps of the Base: terrace 1.25 H, subs 2). So nothing walkable in front of the hero is higher than the hero up to the granularity of the level (I1).
   THE TOPOLOGY STAYS IDENTICAL: only `S.fine` of the ROOM'S walkable tiles changes (their level index); `S.block`, `S.void`, `S.region`, `S.roomMap`, the walking graph, the stairs and the level heights `S.levelH` are not touched (checked by hash in tools/test_vert.js). The tiles outside the room keep their level, so a cliff appears where the room meets a neighbour at another level (the renderer draws it).
   CONFLICT, never forced: if the room has stairs / ramps (their records carry the heights of their ends), or the room has a single walkable level, nothing is changed and the reason is returned. Visual only. `apply(S, P, { room: rec (E.orient), yaw (the base yaw of the camera in use), tilesPerH })` -> { changed, levels, order, conflict }. */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0));
  const V = E.vert = {};
  /* the room's walkable tiles, the mean depth per level and the monotone permutation of the level indices */
  V.plan = function (S, rec, yaw) {
    const W = S.W, n = S.n, zm = E.stage.zoneMap(S), look = E.orient.lookOf(yaw === undefined ? rec.yaw : yaw), vd = S.void;
    const walk = (i) => zm[i] === rec.id && !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]);
    const acc = new Map(); for (let i = 0; i < n; i++) if (walk(i)) { const l = S.fine[i], u = (i % W + 0.5) * look[0] + (((i / W) | 0) + 0.5) * look[1], q = acc.get(l) || { l, s: 0, c: 0 }; q.s += u; q.c++; acc.set(l, q); }
    const lv = [...acc.values()].map((q) => ({ l: q.l, u: q.s / q.c, n: q.c })).sort((a, b) => a.u - b.u || a.l - b.l), targets = lv.map((q) => q.l).sort((a, b) => a - b), perm = new Map();
    lv.forEach((q, k) => perm.set(q.l, targets[k]));
    return { walk, levels: lv, perm, look };
  };
  V.apply = function (S, P, o) {
    const rec = o.room, out = { changed: 0, levels: 0, order: [], conflict: null };
    if (!rec) { out.conflict = 'no room'; return out; }
    const pl = V.plan(S, rec, o.yaw); S.vert = out; out.levels = pl.levels.length; out.order = pl.levels.map((q) => ({ level: q.l, h: S.levelH[q.l], u: +q.u.toFixed(2), tiles: q.n }));
    if ((S.stairs || []).length) { out.conflict = 'the window has stairs / ramps (their records carry the heights of their ends): not forced'; return out; }
    if (pl.levels.length < 2) { out.conflict = 'the room has a single walkable level'; return out; }
    for (let i = 0; i < S.n; i++) if (pl.walk(i)) { const t = pl.perm.get(S.fine[i]); if (t !== undefined && t !== S.fine[i]) { S.fine[i] = t; out.changed++; } }
    S.cache = {}; return out;
  };
})(window.EVO = window.EVO || {});
