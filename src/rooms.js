/* EvoDun crystal viewer - rooms: the minimal chain of the user's EDunProcGen.SequenceA with the connection PATCHED.
   Port of (reference/EDunProcGen.cs): ComputeSlopeMap + ApplyPowTransform + NormalizeSlopeMap + ClassifySlopeMap,
   TrueWatershed.WatershedFromHeightMinima, ClassifyRoomEdges, ExpandAndFilterTransitions, FindRoomCores, ScanCoreConnectivity,
   A* between cores + BuildSpanningTree. Terrace gates already exist in the viewer (shape.js) and are reused.
   No rendering, no UI: pure functions on flat arrays (index = y * W + x, y grows like the image rows).
   Value 0 of the height map is VOID (outside the terrain, never low terrain): no room, edge, core or path touches it.

   THE PATCH (user's design, see CLAUDE.md "Pending 4"):
   - a transition is an undirected PAIR of 4-neighbouring tiles (room edges and terrace gates alike), not a tile;
   - two tiles pass if (same room or the pair is a room transition) and (same terrace or the pair is a gate): ONE function
     (`makePass`) for the reachability scan, the shortest paths and the fills, symmetric by construction;
   - the two tiles of a valid pair are never forbidden; a pair with a Steep tile is not valid and is dropped (Steep stays closed);
   - tiles left without room by the watershed are given to the nearest room before edges are searched (`assign`);
   - the centre of a core is its free tile nearest to the centroid (the original rounded centroid can fall outside the core).
   The original rules, transcribed as is, live in tools/rooms_original.js (comparison only, never loaded by the viewer).
   Heights are floats in 0..1 (grey / 255); void is h <= 0. To be ported to Unity (C#) with the user's code once checked. */
(function (E) {
  const R = E.rooms = {};
  const SL = R.SL = { Flat: 0, Gentle: 1, Steep: 2, Void: 3 };
  const ET = R.ET = { None: 0, Transition: 1, SolidSoft: 2, SolidHard: 3 };
  const N4 = [[0, 1], [0, -1], [-1, 0], [1, 0]]; // Unity's up, down, left, right (y up in the array, same order as the user's code)

  R.defaults = { gentle: 0.2, steep: 0.33, exponent: 0.5, hTol: 0.07, minRadius: 9, minRoom: 8, hardEdge: 0.5, minSizeEdge: 12, minCore: 5 };

  const key = (a, b, n) => a < b ? a * n + b : b * n + a;
  R.key = key;
  R.hue = (id) => (id * 137.508) % 360; // colour of a room: chips and overlay
  const roundEven = (v) => { const f = Math.floor(v), d = v - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1); };

  /* ---- slope classes (ComputeSlopeMap -> pow -> normalize -> ClassifySlopeMap) ---- */
  R.slope = function (h, W, H, exponent) {
    const s = new Float32Array(W * H);
    for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) {
      const dx = (h[y * W + x + 1] - h[y * W + x - 1]) * 0.5, dy = (h[(y + 1) * W + x] - h[(y - 1) * W + x]) * 0.5;
      s[y * W + x] = Math.sqrt(dx * dx + dy * dy);
    }
    for (let x = 0; x < W; x++) { s[x] = s[W + x]; s[(H - 1) * W + x] = s[(H - 2) * W + x]; } // the user's "edge padding"
    for (let y = 0; y < H; y++) { s[y * W] = s[y * W + 1]; s[y * W + W - 1] = s[y * W + W - 2]; }
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < s.length; i++) { s[i] = Math.pow(s[i], exponent); if (s[i] < mn) mn = s[i]; if (s[i] > mx) mx = s[i]; }
    const range = mx - mn;
    for (let i = 0; i < s.length; i++) s[i] = range > 0 ? (s[i] - mn) / range : 0;
    return s;
  };
  R.classify = function (slope, h, gentle, steep) {
    const c = new Uint8Array(slope.length);
    for (let i = 0; i < c.length; i++) {
      const v = slope[i];
      c[i] = h[i] <= 0 || v <= 0 ? SL.Void : v < gentle ? SL.Flat : v < steep ? SL.Gentle : SL.Steep; // h <= 0: void, always
    }
    return c;
  };

  /* ---- rooms: watershed from height minima (WatershedFromHeightMinima). Ties of the priority queue: insertion order
     (C#'s PriorityQueue does not promise one). ---- */
  function Heap() { this.k = []; this.s = []; this.v = []; this.n = 0; }
  Heap.prototype.push = function (key0, v) {
    let i = this.k.length; this.k.push(key0); this.s.push(this.n++); this.v.push(v);
    while (i > 0) { const p = (i - 1) >> 1; if (this.lt(i, p)) { this.swap(i, p); i = p; } else break; }
  };
  Heap.prototype.lt = function (i, j) { return this.k[i] < this.k[j] || (this.k[i] === this.k[j] && this.s[i] < this.s[j]); };
  Heap.prototype.swap = function (i, j) { let t = this.k[i]; this.k[i] = this.k[j]; this.k[j] = t; t = this.s[i]; this.s[i] = this.s[j]; this.s[j] = t; t = this.v[i]; this.v[i] = this.v[j]; this.v[j] = t; };
  Heap.prototype.pop = function () {
    const top = this.v[0], last = this.k.length - 1;
    if (last > 0) { this.k[0] = this.k[last]; this.s[0] = this.s[last]; this.v[0] = this.v[last]; }
    this.k.pop(); this.s.pop(); this.v.pop();
    let i = 0; const m = this.k.length;
    for (;;) { let b = i; const a = 2 * i + 1, c = a + 1; if (a < m && this.lt(a, b)) b = a; if (c < m && this.lt(c, b)) b = c; if (b === i) break; this.swap(i, b); i = b; }
    return top;
  };
  Object.defineProperty(Heap.prototype, 'size', { get() { return this.k.length; } });

  R.watershed = function (h, cls, W, H, prm) {
    const r = prm.minRadius, n = W * H, room = new Int32Array(n), seeds = [];
    for (let x = r; x < W - r; x++) for (let y = r; y < H - r; y++) {
      const c = h[y * W + x]; if (c <= 0) continue;
      let isMin = true;
      for (let dx = -r; dx <= r && isMin; dx++) for (let dy = -r; dy <= r; dy++) { if (!dx && !dy) continue; if (h[(y + dy) * W + x + dx] < c) { isMin = false; break; } }
      if (isMin) seeds.push(y * W + x);
    }
    const q = new Heap(), count = new Int32Array(seeds.length + 1);
    seeds.forEach((s, k) => { room[s] = k + 1; count[k + 1] = 1; q.push(h[s], s); });
    while (q.size) {
      const p = q.pop(), x = p % W, y = (p / W) | 0, id = room[p];
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (room[j] || h[j] <= 0 || cls[j] === SL.Steep || Math.abs(h[j] - h[p]) > prm.hTol) continue;
        room[j] = id; count[id]++; q.push(h[j], j);
      }
    }
    // rooms below the minimum size leave the LIST but keep their id in the map (as in the user's code)
    const rooms = [];
    for (let id = 1; id <= seeds.length; id++) if (count[id] >= prm.minRoom) rooms.push({ id, size: count[id] });
    return { room, rooms, seeds: seeds.length, count };
  };

  /* PATCH: unassigned non-void tiles go to the nearest room (4-neighbour distance, level by level; a tie goes to the lowest id). */
  R.assign = function (room, h, W, H) {
    const out = Int32Array.from(room), n = W * H;
    let cand = [];
    const touch = (i, list) => { const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (out[j] === 0 && h[j] > 0) list.push(j); } };
    for (let i = 0; i < n; i++) if (out[i] > 0) touch(i, cand);
    let assigned = 0;
    while (cand.length) {
      const seen = new Set(cand), upd = [];
      for (const i of seen) {
        const x = i % W, y = (i / W) | 0; let best = 0;
        for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const v = out[ny * W + nx]; if (v > 0 && (best === 0 || v < best)) best = v; }
        if (best) upd.push(i, best);
      }
      cand = [];
      for (let k = 0; k < upd.length; k += 2) { out[upd[k]] = upd[k + 1]; assigned++; }
      for (let k = 0; k < upd.length; k += 2) touch(upd[k], cand);
    }
    let left = 0; for (let i = 0; i < n; i++) if (out[i] === 0 && h[i] > 0) left++;
    return { room: out, assigned, left };
  };

  /* ---- room edges: PAIRS of neighbouring tiles of different rooms (ClassifyRoomEdges), then Expand and Filter (pair-wise) ---- */
  R.roomPairs = function (room, h, cls, ter, W, H, prm) {
    const pairs = [], inner = (i) => { const x = i % W, y = (i / W) | 0; return x >= 1 && y >= 1 && x <= W - 2 && y <= H - 2; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = y * W + x;
      for (const b of [x + 1 < W ? a + 1 : -1, y + 1 < H ? a + W : -1]) {
        if (b < 0 || (!inner(a) && !inner(b))) continue; // the user's scan only starts from tiles off the 1-tile frame
        const ra = room[a], rb = room[b];
        if (ra <= 0 || rb <= 0 || ra === rb || h[a] <= 0 || h[b] <= 0) continue;
        const hd = Math.abs(h[a] - h[b]), s1 = cls[a], s2 = cls[b];
        let type;
        if (ter[a] !== ter[b]) type = ET.SolidHard;
        else if (s1 === SL.Steep || s2 === SL.Steep || hd > prm.hardEdge) type = ET.SolidHard;
        else if (s1 === SL.Gentle && s2 === SL.Gentle && hd <= prm.hTol) type = ET.Transition;
        else type = ET.SolidSoft;
        pairs.push({ a, b, type });
      }
    }
    return pairs;
  };

  /* A soft pair is promoted when it runs PARALLEL to a transition pair (both its tiles are 4-neighbours of the two tiles of that pair,
     in the same rooms and terraces, none Steep); then groups of transition tiles smaller than minGroup go back to soft (the user's
     minSizeEdge counts tiles, both sides together). The original promoted single tiles without looking at their partner. */
  R.expandFilter = function (pairs, room, ter, cls, W, H, minGroup) {
    const n = W * H, byKey = new Map();
    pairs.forEach((p, i) => byKey.set(key(p.a, p.b, n), i));
    const fr = []; pairs.forEach((p, i) => { if (p.type === ET.Transition) fr.push(i); });
    let promoted = 0;
    for (let f = 0; f < fr.length; f++) {
      const p = pairs[fr[f]], ax = p.a % W, ay = (p.a / W) | 0, bx = p.b % W, by = (p.b / W) | 0;
      for (const [dx, dy] of N4) {
        const x1 = ax + dx, y1 = ay + dy, x2 = bx + dx, y2 = by + dy;
        if (x1 < 0 || y1 < 0 || x1 >= W || y1 >= H || x2 < 0 || y2 < 0 || x2 >= W || y2 >= H) continue;
        const na = y1 * W + x1, nb = y2 * W + x2; if (na === p.b || nb === p.a) continue;
        const j = byKey.get(key(na, nb, n)); if (j === undefined || pairs[j].type !== ET.SolidSoft) continue;
        if (room[na] !== room[p.a] || room[nb] !== room[p.b] || ter[na] !== ter[p.a] || ter[nb] !== ter[p.b]) continue;
        if (cls[na] === SL.Steep || cls[nb] === SL.Steep) continue;
        pairs[j].type = ET.Transition; fr.push(j); promoted++;
      }
    }
    // groups of transition TILES (4-connected, both sides of the border together)
    const par = new Map(), find = (v) => { let r = v; while (par.get(r) !== r) r = par.get(r); while (par.get(v) !== r) { const t = par.get(v); par.set(v, r); v = t; } return r; };
    for (const p of pairs) if (p.type === ET.Transition) { if (!par.has(p.a)) par.set(p.a, p.a); if (!par.has(p.b)) par.set(p.b, p.b); }
    for (const t of par.keys()) { const x = t % W, y = (t / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (par.has(j)) { const a = find(t), b = find(j); if (a !== b) par.set(a, b); } } }
    const size = new Map(); for (const t of par.keys()) { const r = find(t); size.set(r, (size.get(r) || 0) + 1); }
    let removedGroups = 0; const dead = new Set(); for (const [r, s] of size) if (s < minGroup) { dead.add(r); removedGroups++; }
    for (const p of pairs) if (p.type === ET.Transition && dead.has(find(p.a))) p.type = ET.SolidSoft;
    const trans = pairs.filter((p) => p.type === ET.Transition), tiles = new Set(); for (const p of trans) { tiles.add(p.a); tiles.add(p.b); }
    return { promoted, removedGroups, transitionPairs: trans.length, transitionTiles: tiles.size };
  };

  /* ---- terrace gates as PAIRS, from the viewer's gates (E.gateTransitions: low tile + groups). Per low tile, every 4-neighbour one
     terrace up is a pair (the gate criterion depends only on the low tile). The user's "same room" condition, omitted so far in
     the viewer, is applied here; so are void and (PATCH) Steep. The group minimum is applied again afterwards (same result as
     filtering by room before grouping: groups only shrink). ---- */
  R.gatePairs = function (gateTiles, room, ter, cls, h, W, H, minGroup, dropSteep) {
    const st = { viewerTiles: gateTiles.length, candidatePairs: 0, lostRoomOrVoid: 0, lostSteep: 0, lostGroup: 0 };
    const cand = [];
    for (const i of gateTiles) {
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (ter[j] !== ter[i] + 1) continue;
        st.candidatePairs++;
        if (h[i] <= 0 || h[j] <= 0 || room[i] <= 0 || room[i] !== room[j]) { st.lostRoomOrVoid++; continue; }
        if (dropSteep && (cls[i] === SL.Steep || cls[j] === SL.Steep)) { st.lostSteep++; continue; }
        cand.push([i, j]);
      }
    }
    const lows = new Set(cand.map((p) => p[0])), seen = new Set(), keep = new Set();
    for (const s0 of lows) {
      if (seen.has(s0)) continue;
      const grp = [s0], stack = [s0]; seen.add(s0);
      while (stack.length) { const i = stack.pop(), x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (lows.has(j) && !seen.has(j)) { seen.add(j); grp.push(j); stack.push(j); } } }
      if (grp.length >= minGroup) for (const t of grp) keep.add(t);
    }
    const pairs = cand.filter((p) => keep.has(p[0]));
    st.lostGroup = cand.length - pairs.length; st.pairs = pairs.length; st.lowTiles = keep.size; st.groups = 0;
    // number of groups kept
    const seen2 = new Set(); for (const s0 of keep) { if (seen2.has(s0)) continue; st.groups++; const stack = [s0]; seen2.add(s0); while (stack.length) { const i = stack.pop(), x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (keep.has(j) && !seen2.has(j)) { seen2.add(j); stack.push(j); } } } }
    return { pairs, stats: st };
  };

  /* ---- cores (FindRoomCores): connected tiles of one room, one terrace, not Steep. Only rooms in the list have cores. ---- */
  R.cores = function (room, ter, cls, rooms, W, H, minCore) {
    const n = W * H, listed = new Set(rooms.map((r) => r.id)), byRoom = new Map(), visited = new Uint8Array(n), cores = [];
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const i = y * W + x, r = room[i]; if (r > 0 && listed.has(r)) { if (!byRoom.has(r)) byRoom.set(r, []); byRoom.get(r).push(i); } }
    for (const { id } of rooms) {
      for (const s of byRoom.get(id) || []) {
        if (visited[s] || cls[s] === SL.Steep) continue;
        const t = ter[s], tiles = [], q = [s];
        for (let k = 0; k < q.length; k++) {
          const p = q[k]; if (visited[p] || room[p] !== id || ter[p] !== t || cls[p] === SL.Steep) continue;
          visited[p] = 1; tiles.push(p); const px = p % W, py = (p / W) | 0;
          for (const [dx, dy] of N4) { const nx = px + dx, ny = py + dy; if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny * W + nx]) q.push(ny * W + nx); }
        }
        let sx = 0, sy = 0; for (const p of tiles) { sx += p % W; sy += (p / W) | 0; }
        const cx = sx / tiles.length, cy = sy / tiles.length;
        cores.push({ room: id, terrace: t, tiles, size: tiles.length, cx, cy, center: roundEven(cy) * W + roundEven(cx), dead: tiles.length < minCore });
      }
    }
    return cores;
  };
  /* PATCH: the centre is the free (not forbidden) tile of the core nearest to the centroid; -1 if the whole core is forbidden. */
  R.fixCentres = function (cores, forb, W) {
    let moved = 0, none = 0;
    for (const c of cores) {
      c.center0 = c.center; let best = -1, bd = Infinity;
      for (const t of c.tiles) { if (forb[t]) continue; const d = (t % W - c.cx) ** 2 + (((t / W) | 0) - c.cy) ** 2; if (d < bd) { bd = d; best = t; } }
      if (best < 0) { c.center = -1; none++; } else { if (best !== c.center0) moved++; c.center = best; }
    }
    return { moved, none };
  };

  /* ---- THE passability function (patched). forbidden = void, unassigned, Steep, tiles of every non-transition room pair, tiles on a
     terrace border that are not a gate; minus the tiles of every valid pair. Symmetric by construction. ---- */
  R.makePass = function (inp) {
    const { W, H, h, room, ter, cls, pairs, gate } = inp, n = W * H, forb = new Uint8Array(n), rp = new Set(), gp = new Set(), free = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (h[i] <= 0 || room[i] <= 0 || cls[i] === SL.Steep) forb[i] = 1;
    for (const p of pairs) { if (p.type === ET.Transition) { rp.add(key(p.a, p.b, n)); free[p.a] = free[p.b] = 1; } else { forb[p.a] = 1; forb[p.b] = 1; } }
    for (const [a, b] of gate) { gp.add(key(a, b, n)); free[a] = free[b] = 1; }
    for (let x = 1; x < W - 1; x++) for (let y = 1; y < H - 1; y++) { // ExtractNonTransitionTerraceBorders (void neighbours are not a border)
      const i = y * W + x; if (cls[i] === SL.Steep || h[i] <= 0 || free[i]) continue;
      for (const [dx, dy] of N4) { const j = (y + dy) * W + x + dx; if (h[j] > 0 && ter[j] !== ter[i] && cls[j] !== SL.Steep) { forb[i] = 1; break; } }
    }
    for (let i = 0; i < n; i++) if (free[i] && h[i] > 0 && room[i] > 0 && cls[i] !== SL.Steep) forb[i] = 0; // the tiles of a valid pair are never forbidden
    const pass = (a, b) => !forb[a] && !forb[b] && (room[a] === room[b] || rp.has(key(a, b, n))) && (ter[a] === ter[b] || gp.has(key(a, b, n)));
    return { pass, forb, roomPairs: rp, gatePairs: gp };
  };

  /* ---- reachability and shortest paths over a step function step(from, to) -> bool (4-neighbours) ---- */
  R.bfs = function (W, H, start, step, wantParent, goal) { // goal (optional): stop as soon as it is reached
    const n = W * H, dist = new Int32Array(n).fill(-1), par = wantParent ? new Int32Array(n).fill(-1) : null, q = new Int32Array(n);
    let qh = 0, qt = 0; dist[start] = 0; q[qt++] = start;
    while (qh < qt) {
      const p = q[qh++], x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (dist[j] >= 0 || !step(p, j)) continue;
        dist[j] = dist[p] + 1; if (par) par[j] = p; q[qt++] = j;
        if (j === goal) return { dist, par };
      }
    }
    return { dist, par };
  };
  R.pathTo = (b, goal) => { const p = []; for (let t = goal; t >= 0; t = b.par[t]) { p.push(t); if (b.par[t] < 0) break; } return p.reverse(); };

  /* Shortest paths with an extra cost per step: extra(a, b) >= 0 is added to the unit cost (Dijkstra; without extra it is the BFS above).
     Used to make the paths prefer going round to crossing a terrace gate (the user's variant: a crossing costs `crossCost` tiles more). */
  R.maxExtra = 64; // largest extra cost per step the bucket queue supports (the viewer's slider stops at 40)
  R.dijkstra = function (W, H, start, step, wantParent, extra, goal) {
    if (!extra) return R.bfs(W, H, start, step, wantParent, goal);
    // integer costs (1 + extra, extra <= a few tens): Dial's buckets, circular, much faster than a heap on this grid
    const n = W * H, dist = new Int32Array(n).fill(-1), best = new Int32Array(n).fill(0x3fffffff), par = wantParent ? new Int32Array(n).fill(-1) : null;
    const NB = (R.maxExtra || 64) + 2, buckets = Array.from({ length: NB }, () => []); let pending = 1, cur = 0;
    best[start] = 0; buckets[0].push(start);
    while (pending > 0) {
      const bk = buckets[cur % NB];
      if (!bk.length) { cur++; continue; }
      const p = bk.pop(); pending--; if (dist[p] >= 0 || best[p] !== cur) continue; dist[p] = cur;
      if (p === goal) break;
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (dist[j] >= 0 || !step(p, j)) continue;
        const c = cur + 1 + extra(p, j); if (c < best[j]) { best[j] = c; if (par) par[j] = p; buckets[c % NB].push(j); pending++; }
      }
    }
    return { dist, par };
  };

  /* Kruskal over the shortest paths between the centres (BuildCoreToCoreGraphWeighted + BuildSpanningTree). The A* of the original,
     with unit costs, finds a shortest path: the BFS gives the same lengths (the path itself can differ in ties). Edges i<j are
     tried in that direction, as in the original (it matters with its directed rule). centres: tile index or -1. */
  R.spanning = function (W, H, centres, step, extra) {
    const m = centres.length, edges = [];
    for (let i = 0; i < m; i++) {
      if (centres[i] < 0) continue;
      const { dist } = R.dijkstra(W, H, centres[i], step, false, extra);
      for (let j = i + 1; j < m; j++) if (centres[j] >= 0 && dist[centres[j]] >= 0) edges.push({ i, j, cost: dist[centres[j]] + 1 });
    }
    edges.sort((a, b) => a.cost - b.cost); // stable: ties keep the (i, j) order
    const uf = Array.from({ length: m }, (_, i) => i), find = (v) => { while (uf[v] !== v) { uf[v] = uf[uf[v]]; v = uf[v]; } return v; };
    const tree = []; for (const e of edges) { const a = find(e.i), b = find(e.j); if (a !== b) { uf[a] = b; tree.push(e); } }
    const comp = new Map(); for (let i = 0; i < m; i++) if (centres[i] >= 0) { const r = find(i); comp.set(r, (comp.get(r) || 0) + 1); }
    const sizes = [...comp.values()].sort((a, b) => b - a);
    return { tree, trees: sizes.length, largest: sizes[0] || 0, sizes, root: find };
  };

  /* What the spanning forest actually USES. Every tree edge is walked along its shortest path; a step across a gate pair is a USED gate pair, across a
     room-transition pair a USED transition pair. Gates are grouped like the viewer does (4-connected low tiles), transitions by 4-connected tiles of
     both sides (like the user's minSizeEdge groups); a group is used if one of its pairs is. Coverage = land tiles of the cores of the largest tree
     (and those plus the path tiles). res: R.build output. */
  R.usage = function (res, W, H) {
    const n = W * H, tr = res.treeReach, cs = res.reach, usedGate = new Map(), usedRoom = new Map(), pathTiles = new Set(); let steps = 0; // used pairs -> how many tree paths cross them
    const edges = [];
    for (const e of tr.tree) {
      const b = R.dijkstra(W, H, cs[e.i].center, res.pass, true, res.extra, cs[e.j].center), pth = R.pathTo(b, cs[e.j].center); steps += pth.length - 1;
      const g = [], r = [];
      for (let k = 0; k < pth.length; k++) {
        pathTiles.add(pth[k]); if (k === 0) continue;
        const kk = key(pth[k - 1], pth[k], n); if (res.gp.has(kk)) { usedGate.set(kk, (usedGate.get(kk) || 0) + 1); g.push(kk); } else if (res.rp.has(kk)) { usedRoom.set(kk, (usedRoom.get(kk) || 0) + 1); r.push(kk); }
      }
      edges.push({ i: e.i, j: e.j, path: pth, g, r });
    }
    const comps = (tiles) => { // 4-connected components of a tile set -> Map tile -> id
      const id = new Map(); let c = 0;
      for (const t of tiles) { if (id.has(t)) continue; id.set(t, c); const st = [t]; while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (tiles.has(j) && !id.has(j)) { id.set(j, c); st.push(j); } } } c++; }
      return { id, count: c };
    };
    const lows = new Set(res.gate.map((p) => p[0])), gg = comps(lows), usedGG = new Set();
    for (const [a, b] of res.gate) if (usedGate.has(key(a, b, n))) usedGG.add(gg.id.get(a));
    const rtiles = new Set(); for (const p of res.pairs) if (p.type === ET.Transition) { rtiles.add(p.a); rtiles.add(p.b); }
    const rg = comps(rtiles), usedRG = new Set();
    for (const p of res.pairs) if (p.type === ET.Transition && usedRoom.has(key(p.a, p.b, n))) usedRG.add(rg.id.get(p.a));
    // largest tree: its cores and the land they cover
    const bySize = new Map(); cs.forEach((c, i) => { const r = tr.root(i); if (!bySize.has(r)) bySize.set(r, []); bySize.get(r).push(i); });
    let big = []; for (const l of bySize.values()) if (l.length > big.length) big = l;
    const inBig = new Set(big), coreTiles = new Set(); for (const i of big) for (const t of cs[i].tiles) coreTiles.add(t);
    const bigPath = new Set(); for (const e of tr.tree) if (inBig.has(e.i)) { const b = R.dijkstra(W, H, cs[e.i].center, res.pass, true, res.extra, cs[e.j].center); for (const t of R.pathTo(b, cs[e.j].center)) bigPath.add(t); }
    const withPaths = new Set([...coreTiles, ...bigPath]);
    return { usedGatePairs: usedGate.size, usedRoomPairs: usedRoom.size, gateGroups: gg.count, usedGateGroups: usedGG.size, roomGroups: rg.count, usedRoomGroups: usedRG.size,
      steps, pathTiles: pathTiles.size, bigCores: big.length, bigCoreTiles: coreTiles.size, bigWithPaths: withPaths.size, usedGate, usedRoom, gateGroupOf: gg.id, edges };
  };

  /* A slice cuts the global tree (user's rule). Nodes = living cores whose centre is inside the slice (mask, map-sized). The global tree edges whose whole
     path stays inside are KEPT; the components the cut left apart are joined with the minimum extra connections (Kruskal starting from those components,
     shortest paths that stay inside the slice, same crossing cost): the PATCH connections. Returns what the slice uses: gate and room-transition pairs
     with how many connections cross them and whether any is global (patch = false) or all are patch. res: R.build output. */
  R.sliceUse = function (res, W, H, mask) {
    const n = W * H, U = res.usage, cs = res.reach, nodes = res.alive.filter((c) => c.center >= 0 && mask[c.center]), idx = new Map(nodes.map((c, k) => [c, k]));
    const uf = Array.from({ length: nodes.length }, (_, k) => k), find = (v) => { while (uf[v] !== v) { uf[v] = uf[uf[v]]; v = uf[v]; } return v; };
    const gate = new Map(), room = new Map(), add = (map, kk, patch) => { const o = map.get(kk) || { count: 0, patch: true }; o.count++; if (!patch) o.patch = false; map.set(kk, o); };
    const edgeList = []; let kept = 0; const comps0 = () => { const s = new Set(); for (let k = 0; k < nodes.length; k++) s.add(find(k)); return s.size; };
    for (const e of U.edges) {
      const a = idx.get(cs[e.i]), b = idx.get(cs[e.j]); if (a === undefined || b === undefined || !e.path.every((t) => mask[t])) continue;
      uf[find(a)] = find(b); kept++; edgeList.push({ kind: 'global', path: e.path }); for (const kk of e.g) add(gate, kk, false); for (const kk of e.r) add(room, kk, false);
    }
    const before = comps0(), step = (a, b) => mask[a] && mask[b] && res.pass(a, b), cand = [];
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes.some((_, j) => j > i && find(j) !== find(i))) continue; // nothing left to join from here
      const { dist } = R.dijkstra(W, H, nodes[i].center, step, false, res.extra);
      for (let j = i + 1; j < nodes.length; j++) if (find(i) !== find(j) && dist[nodes[j].center] >= 0) cand.push({ i, j, cost: dist[nodes[j].center] + 1 });
    }
    cand.sort((p, q) => p.cost - q.cost); let patch = 0, steps = 0;
    for (const c of cand) {
      if (find(c.i) === find(c.j)) continue; uf[find(c.i)] = find(c.j); patch++;
      const b = R.dijkstra(W, H, nodes[c.i].center, step, true, res.extra, nodes[c.j].center), pth = R.pathTo(b, nodes[c.j].center); steps += pth.length - 1; edgeList.push({ kind: 'patch', path: pth });
      for (let k = 1; k < pth.length; k++) { const kk = key(pth[k - 1], pth[k], n); if (res.gp.has(kk)) add(gate, kk, true); else if (res.rp.has(kk)) add(room, kk, true); }
    }
    return { nodes: nodes.length, kept, patch, componentsBefore: before, componentsAfter: comps0(), patchSteps: steps, gate, room, edges: edgeList };
  };

  /* Elevation for quantizing over the LAND only: void tiles (h <= 0) take the value of the nearest land tile (so the pre-smoothing does not drag the
     coast down to 0) and the range is [lowest land, highest land]. Returns { el, range } in the units of `scale` (the viewer uses 1000). */
  R.landElevation = function (h, W, H, scale) {
    const n = W * H, el = new Float32Array(n), done = new Uint8Array(n); let mn = Infinity, mx = -Infinity, q = [];
    for (let i = 0; i < n; i++) if (h[i] > 0) { el[i] = h[i] * scale; done[i] = 1; q.push(i); if (h[i] < mn) mn = h[i]; if (h[i] > mx) mx = h[i]; }
    while (q.length) {
      const next = [];
      for (const i of q) { const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!done[j]) { done[j] = 1; el[j] = el[i]; next.push(j); } } }
      q = next;
    }
    return { el, range: [mn * scale, mx * scale] };
  };

  /* ---- the whole patched chain, in cached stages (a cache object keeps what an unchanged key already computed).
     inp: { W, H, h (0..1), ter (terrace map), gateTiles (low tiles of the viewer's gates), hkey / tkey / gkey (strings that change when h, ter or
     the gate tiles change; needed only when a cache is passed) }.
     prm: R.defaults + { gateMin, crossCost (extra cost of crossing a terrace gate, default 0), treeAll (also a tree over ALL living cores, diagnostic) }.
     Stages and what invalidates them: rooms (h and the slope / watershed parameters), edges (+ terraces, hardEdge, minSizeEdge), pass (+ gate tiles,
     gateMin), cores (+ minCore: centres, scan), tree (+ crossCost: spanning forest and what it uses). res.ms = ms of the stages that ran. ---- */
  R.stage = function (cache, name, key, fn) {
    const c = cache[name]; if (c && c.key === key) return c.v;
    const t = performance.now(), v = fn(); cache[name] = { key, v }; (cache.ms || (cache.ms = {}))[name] = performance.now() - t; return v;
  };
  R.build = function (inp, prm, cache) {
    const { W, H, h, ter } = inp, n = W * H, C = cache || {}; C.ms = {};
    const k1 = [W, H, prm.gentle, prm.steep, prm.exponent, prm.hTol, prm.minRadius, prm.minRoom, inp.hkey || ''].join('|');
    const s1 = R.stage(C, 'rooms', k1, () => {
      const slope = R.slope(h, W, H, prm.exponent), cls = R.classify(slope, h, prm.gentle, prm.steep), ws = R.watershed(h, cls, W, H, prm), as = R.assign(ws.room, h, W, H);
      let land = 0, un0 = 0; for (let i = 0; i < n; i++) if (h[i] > 0) { land++; if (!ws.room[i]) un0++; }
      const sizes = new Int32Array(ws.seeds + 1); for (let i = 0; i < n; i++) if (as.room[i] > 0) sizes[as.room[i]]++; // tiles per room id after the assignment
      return { slope, cls, room0: ws.room, rooms: ws.rooms, seeds: ws.seeds, room: as.room, sizes, stats: { seeds: ws.seeds, rooms: ws.rooms.length, land, unassignedBefore: un0, unassignedAfter: as.left } };
    });
    const k2 = k1 + '#' + (inp.tkey || '') + '|' + prm.hardEdge + '|' + prm.minSizeEdge;
    const s2 = R.stage(C, 'edges', k2, () => {
      const pairs = R.roomPairs(s1.room, h, s1.cls, ter, W, H, prm), expand = R.expandFilter(pairs, s1.room, ter, s1.cls, W, H, prm.minSizeEdge);
      return { pairs, expand };
    });
    const k3 = k2 + '#' + (inp.gkey || '') + '|' + prm.gateMin;
    const s3 = R.stage(C, 'pass', k3, () => {
      const gp = R.gatePairs(inp.gateTiles, s1.room, ter, s1.cls, h, W, H, prm.gateMin, true), mp = R.makePass({ W, H, h, room: s1.room, ter, cls: s1.cls, pairs: s2.pairs, gate: gp.pairs });
      return { gate: gp.pairs, gateStats: gp.stats, pass: mp.pass, forb: mp.forb, rp: mp.roomPairs, gp: mp.gatePairs };
    });
    const k4 = k3 + '#' + prm.minCore + (prm.scanFirst ? 'f' : '');
    const s4 = R.stage(C, 'cores', k4, () => {
      const cores = R.cores(s1.room, ter, s1.cls, s1.rooms, W, H, prm.minCore), centres = R.fixCentres(cores, s3.forb, W), alive = cores.filter((c) => !c.dead);
      /* START CORE (the user's decision, a DEVIATION from his ChooseStartingCore = the first living core): the scan starts from the GROUP of cores with the most
         cores under the same passability (a tie: the most tiles), so a small pocket that happens to come first does not discard the rest of the map. The other
         groups are not connected: they stay unreachable. prm.scanFirst = true restores the first living core (diagnostic). */
      const cand = alive.filter((c) => c.center >= 0); let root = cand[0], groups = [];
      if (cand.length && !prm.scanFirst) {
        const seen = new Set();
        for (const c of cand) {
          if (seen.has(c)) continue; const d = R.bfs(W, H, c.center, s3.pass, false).dist, members = cand.filter((o) => o === c || o.tiles.some((t) => d[t] >= 0));
          for (const o of members) seen.add(o); groups.push({ root: c, cores: members.length, tiles: members.reduce((a, o) => a + o.size, 0) });
        }
        groups.sort((p, q) => q.cores - p.cores || q.tiles - p.tiles); root = groups[0].root;
      }
      const scan = root ? R.bfs(W, H, root.center, s3.pass, false).dist : new Int32Array(n).fill(-1);
      return { cores, centres, alive, scan, reach: alive.filter((c) => c.tiles.some((t) => scan[t] >= 0)), startGroups: groups.map((g) => g.cores) };
    });
    const k5 = k4 + '#' + (prm.crossCost || 0) + (prm.treeAll ? 'a' : '');
    const out = { prm, ter, W, H, h, room: s1.room, room0: s1.room0, rooms: s1.rooms, roomSizes: s1.sizes, seeds: s1.seeds, cls: s1.cls, slope: s1.slope, stats: s1.stats, pairs: s2.pairs, expand: s2.expand,
      gate: s3.gate, gateStats: s3.gateStats, pass: s3.pass, forb: s3.forb, rp: s3.rp, gp: s3.gp, cores: s4.cores, centres: s4.centres, alive: s4.alive, scan: s4.scan, reach: s4.reach, startGroups: s4.startGroups };
    const cc = prm.crossCost || 0; out.extra = cc > 0 ? (a, b) => ter[a] !== ter[b] && s3.gp.has(key(a, b, n)) ? cc : 0 : null; // crossing a terrace gate costs cc tiles more
    const s5 = R.stage(C, 'tree', k5, () => {
      const treeReach = R.spanning(W, H, s4.reach.map((c) => c.center), s3.pass, out.extra);
      const treeAll = prm.treeAll ? R.spanning(W, H, s4.alive.map((c) => c.center), s3.pass, out.extra) : null;
      const part = Object.assign({}, out, { treeReach });
      return { treeReach, treeAll, usage: R.usage(part, W, H) };
    });
    out.treeReach = s5.treeReach; out.treeAll = s5.treeAll; out.usage = s5.usage; out.ms = Object.assign({}, C.ms);
    return out;
  };

  /* The layer of the viewer for a pack: the whole map, cached on the pack (`full._rc`). Terraces and gate tiles are the viewer's own (E.quantize,
     E.gateTransitions), heights are the elevation over the highest land tile (0..1, void = 0), the rest are P's rooms parameters. */
  R.paramsOf = (P) => ({ gentle: P.rGentle === undefined ? 0.2 : P.rGentle, steep: P.rSteep === undefined ? 0.33 : P.rSteep, exponent: P.rExp === undefined ? 0.5 : P.rExp, hTol: P.rHTol === undefined ? 0.07 : P.rHTol,
    minRadius: P.rRadius === undefined ? 9 : P.rRadius, minRoom: P.rMinRoom === undefined ? 8 : P.rMinRoom, hardEdge: P.rHardEdge === undefined ? 0.5 : P.rHardEdge, minSizeEdge: P.rMinSizeEdge === undefined ? 12 : P.rMinSizeEdge,
    minCore: P.roomsMinCore === undefined ? 20 : P.roomsMinCore, crossCost: P.roomsCross === undefined ? 10 : P.roomsCross, scanFirst: !!P.rScanFirst, gateMin: P.gateMin === undefined ? 3 : P.gateMin });
  R.layer = function (full, P) {
    const W = full.width, H = full.height, n = W * H, q = E.quantize(full, P), tr = E.gateTransitions(full, P, 'terrace');
    if (!full._rc) full._rc = {};
    if (!full._rcH) { let mx = 0; for (let i = 0; i < n; i++) if (full.elevation[i] > mx) mx = full.elevation[i]; full._rcH = Float32Array.from(full.elevation, (v) => (v > 0 && mx > 0 ? v / mx : 0)); }
    const tiles = []; for (const g of tr.groups) for (const i of g.tiles) tiles.push(i);
    const prm = R.paramsOf(P), res = R.build({ W, H, h: full._rcH, ter: q.ter, gateTiles: tiles, hkey: 'h', tkey: q.key, gkey: `${P.gateThr}|${P.gateMin}` }, prm, full._rc);
    res.gateGroups = tr.groups.length; res.mapW = W; res.mapH = H; return res;
  };
})(window.EVO = window.EVO || {});
