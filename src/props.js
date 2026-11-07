/* STAGE PROPS BY ROOM (mode 3, PR C3; `E.props`; docs/crystallizers/03-stage/README.md "C3"): features 4 (torches along the axis) and 5 (the goal at the back) of the "mock T", for the room the hero stands in, with the C1 yaw. BILLBOARDS ONLY (src/objects.js): the shape S is never rebuilt and nothing changes in the terrain.
   - PATH: the walkable route (BFS over the room's tiles of the walking graph) from a START to an END. A room with an entry gate AND an exit gate: from the room tile nearest the entry gate to the one nearest the exit gate. The first / last room and a window of one room: from the end nearest the camera (smallest view depth, nearest the middle of the room across) to the GOAL tile.
   - TORCHES: `lamp` HYP.torchH H, on both sides of the path, HYP.torchSide H from its axis (along the normal of the local tangent), one pair every HYP.torchEvery path steps. Only on walkable tiles of the room, never on the steps / ramps / gates nor within 1 tile of them.
   - GOAL (the last room of the window, and a window of one room): a `landmark` (S4c, default parameters) on the highest terrace of the BACK half of the room (the half of the view depth farther from the camera), at the tile of that terrace nearest the path axis (the start's column), S4c rules (not on a transition, >= 2 tiles from its bottom / top).
   - DOOR PILLARS (every room with an exit gate, the last one has none): 2 `pillar` HYP.gatePillarH H at both sides of the exit gate, HYP.gateSide tiles beyond its extent across the view.
   ONE table of hypotheses for S6 (H are multiplied by tilesPerH). Test hooks (`E.propsTest`, tests only): onStairs (no exclusion around transitions / gates), torchEvery (a number), metaFront (the goal in the NEAR half). */
(function (E) {
  'use strict';
  const HYP = { torchSide: 1, torchEvery: 4, torchH: 1.2, gatePillarH: 2, gateSide: 2 };
  /* compute(S, P, rec, { tilesPerH, last, next, test }) -> { room, yaw, noPath, path (tile list), start, end, torches [{ x, y, tile, k, side }], pillars [{ x, y, tile }], goal { x, y, tile, ter, h } | null, aMid } ; x / y = window tile coordinates (continuous), tile = index */
  function compute(S, P, rec, o) {
    const T = o.test || E.propsTest || {}, tp = o.tilesPerH, W = S.W, H = S.H, n = S.n, vd = S.void, look = E.orient.lookOf(rec.yaw), f = [look[0], look[1]], r = [-f[1], f[0]];
    const walk = (i) => !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]), nb = E.walkGraph(S, P);
    const A = (i) => (i % W) * f[0] + ((i / W) | 0) * f[1], Pc = (i) => (i % W) * r[0] + ((i / W) | 0) * r[1], hOf = (i) => S.levelH[S.fine[i]];
    const out = { room: rec.id, yaw: rec.yaw, noPath: false, path: [], start: -1, end: -1, torches: [], pillars: [], goal: null, aMid: 0 };
    const tiles = []; const inRoom = new Uint8Array(n); for (let i = 0; i < n; i++) if (S.roomMap[i] === rec.id && walk(i)) { tiles.push(i); inRoom[i] = 1; }
    if (!tiles.length) { out.noPath = true; return out; }
    // the transition tiles (steps, bottom, top) and the gate tiles (a room tile that walks into another room, and that neighbour), dilated
    const mark = new Uint8Array(n), gateTo = new Map(); // gateTo: next room id -> room tiles of that gate
    for (const st of S.stairs || []) { for (const s of st.steps || []) for (const t of s.tiles) mark[t] = 1; for (const t of st.bottom || []) mark[t] = 1; for (const t of st.top || []) mark[t] = 1; }
    for (const i of tiles) for (const j of nb(i)) { const rj = S.roomMap[j]; if (rj !== rec.id && walk(j)) { mark[i] = 1; mark[j] = 1; if (!gateTo.has(rj)) gateTo.set(rj, []); gateTo.get(rj).push(i); } }
    const dil = (m, d) => { const q = new Uint8Array(n); for (let i = 0; i < n; i++) if (m[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -d; dy <= d; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -d; dx <= d; dx++) { const xx = x + dx; if (xx >= 0 && xx < W) q[yy * W + xx] = 1; } } } return q; };
    const ex1 = T.onStairs ? new Uint8Array(n) : dil(mark, 1), ex2 = T.onStairs ? new Uint8Array(n) : dil(mark, 2); // (MUTATION onStairs: no exclusion)
    // the view extent of the room
    let aMin = 1e9, aMax = -1e9, pMin = 1e9, pMax = -1e9; for (const i of tiles) { aMin = Math.min(aMin, A(i)); aMax = Math.max(aMax, A(i)); pMin = Math.min(pMin, Pc(i)); pMax = Math.max(pMax, Pc(i)); }
    const aMid = (aMin + aMax) / 2, pMid = (pMin + pMax) / 2; out.aMid = aMid;
    const nearest = (g, ok) => { let b = -1, bd = 1e18; for (const i of tiles) { if (!ok(i)) continue; const d = ((i % W) + 0.5 - g[0]) ** 2 + (((i / W) | 0) + 0.5 - g[1]) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
    // the largest connected piece of the room's walkable tiles (a room can have pieces apart: the path lives in the main one)
    const comp = new Uint8Array(n), seen = new Uint8Array(n); let cBest = null;
    for (const t0 of tiles) { if (seen[t0]) continue; const c = [t0]; seen[t0] = 1; for (let h = 0; h < c.length; h++) for (const j of nb(c[h])) if (inRoom[j] && !seen[j]) { seen[j] = 1; c.push(j); } if (!cBest || c.length > cBest.length) cBest = c; }
    for (const i of cBest) comp[i] = 1;
    const both = rec.entry && rec.exit && !o.last;
    // START
    let start = -1;
    if (both) start = nearest(rec.entry, (i) => comp[i] && !ex1[i]); else { let bk = null; for (const i of cBest) { if (ex1[i]) continue; const k = [A(i), Math.abs(Pc(i) - pMid)]; if (!bk || k[0] < bk[0] || (k[0] === bk[0] && k[1] < bk[1])) { bk = k; start = i; } } }
    if (start < 0) start = cBest[0];
    // reachable set + parents (BFS inside the room)
    const par = new Int32Array(n).fill(-2); par[start] = -1; const q = [start];
    for (let h = 0; h < q.length; h++) { const i = q[h]; for (const j of nb(i)) if (inRoom[j] && par[j] === -2) { par[j] = i; q.push(j); } }
    // END
    let end = -1;
    if (both) { end = nearest(rec.exit, (i) => !ex1[i] && par[i] !== -2); }
    else { // the goal: the highest terrace of the BACK half (the NEAR half with the mutation metaFront), nearest the start's column
      const pAxis = Pc(start); let best = null;
      for (const i of q) { if (ex2[i]) continue; const a = A(i); if (T.metaFront ? a >= aMid : a < aMid) continue; const k = [S.ter[i], hOf(i), -Math.abs(Pc(i) - pAxis), T.metaFront ? -a : a]; if (!best || cmp(k, best.k) > 0) best = { i, k }; }
      if (!best) for (const i of q) { if (ex1[i]) continue; const a = A(i); if (T.metaFront ? a >= aMid : a < aMid) continue; const k = [S.ter[i], hOf(i), -Math.abs(Pc(i) - pAxis), T.metaFront ? -a : a]; if (!best || cmp(k, best.k) > 0) best = { i, k }; } // relaxed: no tile at >= 2 from a transition, >= 1 is taken
      if (!best) { let fa = -1e9; for (const i of q) if (A(i) > fa) { fa = A(i); best = { i }; } } // no tile fits the rules: the farthest reachable one (reported by the caller as relaxed)
      if (best) end = best.i;
      if (best && o.last) out.goal = { x: (end % W) + 0.5, y: ((end / W) | 0) + 0.5, tile: end, ter: S.ter[end], h: hOf(end) };
    }
    out.start = start; out.end = end;
    if (end < 0 || par[end] === -2) { out.noPath = true; }
    else { const path = []; for (let i = end; i >= 0; i = par[i]) path.push(i); path.reverse(); out.path = path; }
    // TORCHES
    const path = out.path, every = T.torchEvery || HYP.torchEvery, side = HYP.torchSide * tp;
    if (path.length) for (let k = 2; k <= path.length - 3; k += every) {
      const a0 = path[Math.max(0, k - 3)], a1 = path[Math.min(path.length - 1, k + 3)];
      let tx = (a1 % W) - (a0 % W), ty = ((a1 / W) | 0) - ((a0 / W) | 0); const m = Math.hypot(tx, ty); if (m < 1e-9) continue; tx /= m; ty /= m;
      const cx = (path[k] % W) + 0.5, cy = ((path[k] / W) | 0) + 0.5;
      for (const s of [-1, 1]) { const x = cx - s * ty * side, y = cy + s * tx * side, xi = Math.floor(x), yi = Math.floor(y); if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue; const t = yi * W + xi; if (!inRoom[t] || ex1[t]) continue; out.torches.push({ x, y, tile: t, k, side: s }); }
    }
    // DOOR PILLARS: both sides of the exit gate (the gate with the next room of the window list)
    const nxt = o.next, gt = nxt && gateTo.get(nxt);
    if (gt && gt.length && !o.last) {
      let gp0 = 1e9, gp1 = -1e9, ga = 0; for (const i of gt) { gp0 = Math.min(gp0, Pc(i)); gp1 = Math.max(gp1, Pc(i)); ga += A(i); } ga = Math.round(ga / gt.length);
      const byAP = new Map(); for (const i of tiles) byAP.set(A(i) * 4096 + Pc(i), i);
      for (const s of [-1, 1]) { let placed = null; for (const da of [0, -1, -2, 1, 2, -3, 3]) { for (const d of [2, 3, 4, 5]) { const p = s < 0 ? gp0 - d : gp1 + d, t = byAP.get((ga + da) * 4096 + p); if (t !== undefined && !ex1[t]) { placed = t; break; } } if (placed !== null) break; }
        if (placed !== null) out.pillars.push({ x: (placed % W) + 0.5, y: ((placed / W) | 0) + 0.5, tile: placed }); }
    }
    return out;
  }
  const cmp = (a, b) => { for (let k = 0; k < a.length; k++) { if (a[k] > b[k] + 1e-9) return 1; if (a[k] < b[k] - 1e-9) return -1; } return 0; };
  /* list(S, P, rec, o) -> the objects list in MAP coordinates ({ kind, x, y, hH }) for src/objects.js, plus the data */
  function list(S, P, rec, o) {
    const d = compute(S, P, rec, o), L = [];
    for (const t of d.torches) L.push({ kind: 'lamp', x: t.x + S.ox, y: t.y + S.oy, hH: HYP.torchH });
    for (const p of d.pillars) L.push({ kind: 'pillar', x: p.x + S.ox, y: p.y + S.oy, hH: HYP.gatePillarH });
    if (d.goal) L.push({ kind: 'landmark', x: d.goal.x + S.ox, y: d.goal.y + S.oy });
    return { list: L, data: d };
  }
  E.props = { HYP, compute, list };
})(window.EVO = window.EVO || {});
