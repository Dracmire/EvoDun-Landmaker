/* The user's room-connection rules TRANSCRIBED AS IS from reference/EDunProcGen.cs, for comparison only (never loaded by the viewer).
   Kept on purpose: edge records per TILE (last writer wins in the dictionary and in the final sync), expansion of single tiles,
   AStarContext.IsWalkable (destination only), ScanCoreConnectivity (either tile, ignores ForbiddenTiles), forbidden tiles,
   ExtractNonTransitionTerraceBorders, and FindRankedTerraceTransitions with the swap of t1/t2 that leaks into the next direction.
   Void: the user's code has no void concept; here h <= 0 is not a room (as in the watershed's own `h <= 0` test) and nothing else changes.
   Loaded after src/png.js, fields.js, shape.js, rooms.js (E.rooms). */
(function (E) {
  const O = E.roomsOriginal = {}, R = E.rooms, SL = R.SL, ET = R.ET;
  const N4 = [[0, 1], [0, -1], [-1, 0], [1, 0]];

  // ClassifySlopeMap as written: Void is "slope <= 0" (no height test)
  O.classify = (slope, gentle, steep) => Uint8Array.from(slope, (v) => v <= 0 ? SL.Void : v < gentle ? SL.Flat : v < steep ? SL.Gentle : SL.Steep);
  O.terraces = (h, N) => Int32Array.from(h, (v) => Math.floor(v * N)); // QuantizeToTerraces

  // ClassifyRoomEdges: the list has an entry for EACH of the two tiles of a pair
  O.edges = function (room, h, cls, ter, W, H, hT, hardT) {
    const edges = [], seen = new Set();
    for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) {
      const a = y * W + x, rA = room[a]; if (rA <= 0 || h[a] <= 0) continue;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const b = ny * W + nx, rB = room[b]; if (rB <= 0 || rB === rA || h[b] <= 0) continue;
        const k = rA < rB ? `${rA}-${rB}-${x}-${y}` : `${rB}-${rA}-${nx}-${ny}`; if (seen.has(k)) continue; seen.add(k);
        const hd = Math.abs(h[a] - h[b]), s1 = cls[a], s2 = cls[b]; let type;
        if (ter[a] !== ter[b] && rA !== rB) type = ET.SolidHard;
        else if (s1 === SL.Steep || s2 === SL.Steep || hd > hardT) type = ET.SolidHard;
        else if (s1 === SL.Gentle && s2 === SL.Gentle && hd <= hT) type = ET.Transition;
        else type = ET.SolidSoft;
        edges.push({ pos: a, rA, rB, type }); edges.push({ pos: b, rA: rB, rB: rA, type });
      }
    }
    return edges;
  };
  // ExpandAndFilterTransitions: the dictionary keeps ONE record per tile; the final sync copies it over every entry of that tile
  O.expand = function (edges, room, ter, cls, W, H, minGroup) {
    const dict = new Map(); for (const e of edges) dict.set(e.pos, { ...e });
    const fr = [], seen = new Set(); for (const [k, e] of dict) if (e.type === ET.Transition) { fr.push(k); seen.add(k); }
    for (let f = 0; f < fr.length; f++) {
      const pos = fr[f], x = pos % W, y = (pos / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const np = ny * W + nx; if (seen.has(np)) continue; const nb = dict.get(np); if (!nb || nb.type !== ET.SolidSoft) continue;
        if (room[pos] !== room[np] || ter[pos] !== ter[np] || cls[pos] === SL.Steep || cls[np] === SL.Steep) continue;
        nb.type = ET.Transition; fr.push(np); seen.add(np);
      }
    }
    const group = (t) => { const out = [], vis = new Set(); for (const [k, e] of dict) { if (vis.has(k) || e.type !== t) continue; const g = [], q = [k]; while (q.length) { const c = q.shift(); if (vis.has(c)) continue; vis.add(c); g.push(c); const cx = c % W, cy = (c / W) | 0; for (const [dx, dy] of N4) { const j = (cy + dy) * W + cx + dx; if (dict.has(j) && !vis.has(j) && dict.get(j).type === t) q.push(j); } } out.push(g); } return out; };
    for (const g of group(ET.Transition)) if (g.length < minGroup) for (const k of g) dict.get(k).type = ET.SolidSoft;
    for (let i = 0; i < edges.length; i++) { const u = dict.get(edges[i].pos); if (u) edges[i] = { ...u }; }
    return edges;
  };

  // FindRankedTerraceTransitions + FilterConnectedTerraceTransitions (the swap leaks into the next direction on purpose).
  O.gates = function (room, ter, raw, W, H, thr, minGroup) {
    const n = W * H, slopeOf = new Map(), res = [], added = new Set();
    for (const t of new Set(ter)) {
      let mn = Infinity, mx = -Infinity; for (let i = 0; i < n; i++) if (ter[i] === t) { if (raw[i] < mn) mn = raw[i]; if (raw[i] > mx) mx = raw[i]; }
      let range = mx - mn; if (range <= 0.0001) range = 1;
      const nm = new Float64Array(n); for (let i = 0; i < n; i++) nm[i] = ter[i] === t ? (raw[i] - mn) / range : 0;
      const s = new Float64Array(n);
      for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) { const dx = (nm[y * W + x + 1] - nm[y * W + x - 1]) * 0.5, dy = (nm[(y + 1) * W + x] - nm[(y - 1) * W + x]) * 0.5; s[y * W + x] = Math.sqrt(dx * dx + dy * dy); }
      slopeOf.set(t, s);
    }
    for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) {
      const r = room[y * W + x]; let t1 = ter[y * W + x]; if (r <= 0 || !slopeOf.has(t1)) continue;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (room[ny * W + nx] !== r) continue; let t2 = ter[ny * W + nx]; if (t1 === t2 || Math.abs(t1 - t2) !== 1) continue;
        let ep = y * W + x; if (t2 < t1) { ep = ny * W + nx; const t = t1; t1 = t2; t2 = t; }
        if (added.has(ep)) continue;
        if (slopeOf.get(t1)[ep] - slopeOf.get(t2)[ep] > thr) { res.push(ep); added.add(ep); }
      }
    }
    return O.filterGroups(new Set(res), W, H, minGroup);
  };
  O.filterGroups = function (set, W, H, minGroup) {
    const out = new Set(), vis = new Set();
    for (const p of set) {
      if (vis.has(p)) continue; const g = [], q = [p]; vis.add(p);
      while (q.length) { const c = q.pop(); g.push(c); const x = c % W, y = (c / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!vis.has(j) && set.has(j)) { vis.add(j); q.push(j); } } }
      if (g.length >= minGroup) for (const t of g) out.add(t);
    }
    return out;
  };

  // GenerateForbiddenTiles + ExtractNonTransitionTerraceBorders
  O.forbidden = function (cls, edges, gateSet, ter, W, H) {
    const n = W * H, forb = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (cls[i] === SL.Steep) forb[i] = 1;
    for (const e of edges) if (e.type !== ET.Transition) forb[e.pos] = 1;
    for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) {
      const i = y * W + x; if (cls[i] === SL.Steep) continue;
      for (const [dx, dy] of N4) { const j = (y + dy) * W + x + dx; if (ter[j] !== ter[i] && cls[j] !== SL.Steep && !gateSet.has(i)) { forb[i] = 1; break; } }
    }
    return forb;
  };

  // AStarContext.IsWalkable (destination only) and ScanCoreConnectivity's rule (either tile, no ForbiddenTiles)
  O.makeRules = function (inp) {
    const { room, ter, forb, roomTrans, gateSet, cls } = inp;
    return {
      walk: (a, b) => { if (forb[b]) return false; if (room[a] !== room[b] && !roomTrans.has(b)) return false; if (ter[a] !== ter[b] && !gateSet.has(b)) return false; return true; },
      scan: (a, b) => { if (cls[b] === SL.Steep) return false; return (room[a] === room[b] || roomTrans.has(a) || roomTrans.has(b)) && (ter[a] === ter[b] || gateSet.has(a) || gateSet.has(b)); }
    };
  };

  /* mode 'literal': terraces floor(h * N) and the user's gates (with the leak). mode 'viewer': terraces and gates of the viewer,
     the same room condition on the gate tile, but the ORIGINAL passability. inp: { W, H, h, N, ter?, gateTiles? } */
  O.run = function (inp, prm, mode) {
    const { W, H, h } = inp, n = W * H, out = { mode };
    const slope = R.slope(h, W, H, prm.exponent), cls = O.classify(slope, prm.gentle, prm.steep);
    const ws = R.watershed(h, cls, W, H, prm), room = ws.room;
    const ter = mode === 'literal' ? O.terraces(h, inp.N) : inp.ter;
    const edges = O.expand(O.edges(room, h, cls, ter, W, H, prm.hTol, prm.hardEdge), room, ter, cls, W, H, prm.minSizeEdge);
    let gateSet;
    if (mode === 'literal') gateSet = O.gates(room, ter, h, W, H, prm.transStrict, prm.gateMin);
    else { const low = new Set(); for (const i of inp.gateTiles) { const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (ter[j] === ter[i] + 1 && room[i] > 0 && room[i] === room[j]) { low.add(i); break; } } } gateSet = O.filterGroups(low, W, H, prm.gateMin); }
    const roomTrans = new Set(edges.filter((e) => e.type === ET.Transition).map((e) => e.pos));
    const forb = O.forbidden(cls, edges, gateSet, ter, W, H), rules = O.makeRules({ room, ter, forb, roomTrans, gateSet, cls });
    const rooms = ws.rooms, cores = R.cores(room, ter, cls, rooms, W, H, prm.minCore), alive = cores.filter((c) => !c.dead);
    const root = alive[0];
    const scan = root ? R.bfs(W, H, root.center, rules.scan, false).dist : new Int32Array(n).fill(-1);
    const reach = alive.filter((c) => c.tiles.some((t) => scan[t] >= 0));
    const tree = R.spanning(W, H, reach.map((c) => c.center), rules.walk);
    const treeAll = R.spanning(W, H, alive.map((c) => c.center), rules.walk);
    let leak = 0; // gate tiles whose terrace is not one below a 4-neighbour (only meaningful for the literal gates)
    for (const g of gateSet) { const x = g % W, y = (g / W) | 0; let ok = false; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && ter[ny * W + nx] === ter[g] + 1) ok = true; } if (!ok) leak++; }
    let centreForbidden = 0; for (const c of alive) if (forb[c.center]) centreForbidden++;
    Object.assign(out, { slope, cls, room, rooms, ter, edges, roomTrans, gateSet, forb, rules, cores, alive, scan, reach, tree, treeAll, root, leak, centreForbidden, seeds: ws.seeds });
    return out;
  };
})(window.EVO = window.EVO || {});
