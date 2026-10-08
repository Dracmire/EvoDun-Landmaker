/* EvoDun crystal viewer - room types (Cake / Diorama / Ascension), the user's crystallizer.
   Source of the rules: reference/SingleRoomMeshGeneratorV16.4.cs. GenerateRoom ends with BuildCakesForCurrentRoom(...) and `return` (lines 648-649): the pass-1/pass-2 code,
   DetectCakeDirection and DetectCakeViaTerraceEdges below it are dead code and are NOT followed.
   - Room type (473-560), neighbours instead of lobby platforms: CAKE = the room has >= 2 terraces, cakeLayers > 0 and a terrace edge (the LOW tile of a used terrace gate whose two tiles are in the room);
     DIORAMA = not cake and >= 3 neighbouring rooms by room transitions; ASCENSION = the rest.
   - Cake (BuildCakesForCurrentRoom 1719, BuildCakeDownRingsSimple 1670, BuildCakeUpRings 1602): ONE cake per terrace link (low, high) of the room. Direction: one link -> more pieces of the room on the high
     terrace = Down, more on the low = Up, tie = Down; several links -> Down only when low is the minimum terrace of the room, else Up. Pieces = 4-connected pieces of the room per terrace (no platforms here).
     Core = ALL the room's tiles of the core terrace (low if Down, high if Up). Rings OUTSIDE the core: ring k = Dilate8(core, (k+1)d) \ Dilate8(core, k d), cakeLayers 3, dilationPerLayer 1, clipped to the room's tiles
     of the two terraces. Down: cut to the seam window (Dilate8 of the gate tiles of the link, radius 5). Up: around the whole high core. Heights: uniform step (cakeStepHeight = 0.3 terH); Down rises from the core top
     (+0.3, +0.6, +0.9), Up descends (-0.3, -0.6, -0.9).
   - ADAPTATION TO THE VIEWER (user's decision): in Unity the rings fill the gap between the platforms of two terraces; here the terraces touch. Down: the rings are CUT into tiles of the high terrace of the same room.
     Up: they are BUILT on tiles of the low terrace of the same room. Never outside the room, never on void. The footprint of a ramp is reserved. Empty rings are dropped and the rest renumbered.
     step = min(step, (gap - margin) / n) so the last ring stays below the neighbouring terrace (Down) / above the low terrace (Up). Rings replace the sub-terraces on the tiles they take.
   - Up has no "high side" filter (the rings already sit on low tiles of the room, within ring distance of the high core). Stitching of diagonal gaps only adds free ring candidates.
   - A tile claimed by two links keeps the ring with the smaller index (tie: the lower link).
   Ported to Unity later: classify() and the ring construction (BFS over tile sets); the level assignment replaces BuildPlatformMesh heights. */
(function (E) {
  const T = E.roomTypes = {};
  T.CAKE = 1; T.DIORAMA = 2; T.ASCENSION = 3;
  T.NAMES = ['', 'Cake', 'Diorama', 'Ascension'];
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  T.paramsOf = (P) => ({ layers: P.cakeLayers === undefined ? 3 : P.cakeLayers, step: P.cakeStep === undefined ? 0.3 : P.cakeStep, per: P.cakePer === undefined ? 1 : P.cakePer, seam: P.cakeSeam === undefined ? 5 : P.cakeSeam, margin: P.cakeMargin === undefined ? 0.05 : P.cakeMargin }); // margin in terH (cakeMargin: tests only)

  const gateByKey = (RL, n) => {
    if (RL.gateByKey) return RL.gateByKey;
    RL.gateByKey = new Map(); for (const p of RL.gate) RL.gateByKey.set(E.rooms.key(p[0], p[1], n), p);
    RL.gateByGroup = new Map(); for (const p of RL.gate) { const g = RL.usage.gateGroupOf.get(p[0]); if (!RL.gateByGroup.has(g)) RL.gateByGroup.set(g, []); RL.gateByGroup.get(g).push(p); }
    return RL.gateByKey;
  };

  /* Classification of every room of the WHOLE map (it does not depend on the slice). Returns { rooms: Map(id -> info), counts, type: Uint8Array(map) }.
     info = { id, type, terraces: [..], minTer, links: [{ low, high, pos: [low tiles of its gates], down }], neighbours, pieces: Map(ter -> count) } */
  T.classify = function (RL, P) {
    const W = RL.W, H = RL.H, n = W * H, room = RL.room, ter = RL.ter, prm = T.paramsOf(P), gk = gateByKey(RL, n);
    const rooms = new Map(), get = (r) => { let o = rooms.get(r); if (!o) rooms.set(r, o = { id: r, terraces: new Set(), links: new Map(), neigh: new Set(), pieces: new Map(), tiles: 0 }); return o; };
    for (let i = 0; i < n; i++) { const r = room[i]; if (r > 0) { const o = get(r); o.terraces.add(ter[i]); o.tiles++; } }
    // pieces: 4-connected pieces of the room on each terrace
    const seen = new Uint8Array(n), stack = [];
    for (let i = 0; i < n; i++) {
      if (seen[i] || room[i] <= 0) continue; const r = room[i], t = ter[i]; seen[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), x = c % W, y = (c / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!seen[j] && room[j] === r && ter[j] === t) { seen[j] = 1; stack.push(j); } } }
      const o = rooms.get(r); o.pieces.set(t, (o.pieces.get(t) || 0) + 1);
    }
    // terrace edges: the LOW tile of every USED terrace gate pair whose two tiles are in the room
    for (const k of RL.usage.usedGate.keys()) {
      const p = gk.get(k); if (!p) continue; const a = p[0], b = p[1], r = room[a]; if (r <= 0 || room[b] !== r) continue;
      const lo = Math.min(ter[a], ter[b]), hi = Math.max(ter[a], ter[b]); if (lo === hi) continue;
      const o = get(r), lk = lo + ',' + hi; let l = o.links.get(lk); if (!l) o.links.set(lk, l = { low: lo, high: hi, pos: [] });
      l.pos.push(ter[a] === lo ? a : b);
    }
    // neighbouring rooms by room transitions (all valid ones, used or not); pairCount = how many transition PAIRS join two rooms (key 'low,high')
    const pairCount = new Map();
    for (const k of RL.rp) { const a = (k / n) | 0, b = k % n, ra = room[a], rb = room[b]; if (ra > 0 && rb > 0 && ra !== rb) { get(ra).neigh.add(rb); get(rb).neigh.add(ra); const pk = Math.min(ra, rb) + ',' + Math.max(ra, rb); pairCount.set(pk, (pairCount.get(pk) || 0) + 1); } }
    const counts = { cake: 0, diorama: 0, ascension: 0, bowl: 0, pyramid: 0, links: 0 };
    for (const o of rooms.values()) {
      const terr = [...o.terraces].sort((p, q) => p - q); o.terraceList = terr; o.minTer = terr[0];
      o.linkList = [...o.links.values()].sort((p, q) => p.low - q.low || p.high - q.high);
      const isCake = terr.length > 1 && prm.layers > 0 && o.linkList.length > 0;
      o.type = isCake ? T.CAKE : o.neigh.size >= 3 ? T.DIORAMA : T.ASCENSION;
      if (isCake) {
        const multi = o.linkList.length > 1;
        for (const l of o.linkList) {
          if (!multi) { const cl = o.pieces.get(l.low) || 0, ch = o.pieces.get(l.high) || 0; l.down = ch > cl ? true : cl > ch ? false : true; } else l.down = l.low === o.minTer;
          l.core = l.down ? l.low : l.high; counts.links++; l.down ? counts.bowl++ : counts.pyramid++;
        }
      }
    }
    /* RULE "Diorama never touches Diorama" (user's decision; param P.dioNoTouch, default ON; false = the plain V16.4 rule): after the V16.4 rule, if two Dioramas are connected by walking
       (at least 3 open room-transition pairs between them), the BIGGEST stays and the others become Ascension (greedy by size, then by id: a Diorama that only touches a demoted one stays). */
    counts.dioDemoted = 0; counts.dioDemotedTiles = 0;
    if (P.dioNoTouch !== false) {
      const dio = [...rooms.values()].filter((o) => o.type === T.DIORAMA).sort((p, q) => q.tiles - p.tiles || p.id - q.id), kept = new Set();
      const minPairs = P.dioTouchMin === undefined ? 3 : P.dioTouchMin, joined = (a, b) => (pairCount.get(Math.min(a, b) + ',' + Math.max(a, b)) || 0) >= minPairs; // 'connected by walking' = at least 3 open transition pairs (the minimum size of a transition group; it reproduces the user's figures)
      for (const o of dio) { if ([...o.neigh].some((id) => kept.has(id) && joined(o.id, id))) { o.type = T.ASCENSION; o.demoted = true; counts.dioDemoted++; counts.dioDemotedTiles += o.tiles; } else kept.add(o.id); }
    }
    for (const o of rooms.values()) counts[o.type === T.CAKE ? 'cake' : o.type === T.DIORAMA ? 'diorama' : 'ascension']++;
    const type = new Uint8Array(n); for (let i = 0; i < n; i++) if (room[i] > 0) type[i] = rooms.get(room[i]).type;
    return { rooms, counts, type, W, H, pairCount };
  };

  /* Cake rings of the whole map, reserved = Uint8Array(map) with the footprints of the ramps (end tiles and treads). Returns the ring tiles with their link and index. */
  function buildRings(RL, types, P, q, reserved) {
    const W = types.W, H = types.H, n = W * H, room = RL.room, ter = RL.ter, prm = T.paramsOf(P), K = P.subs, s = E.subHeight(P);
    const hb = (i) => E.hOf(ter[i] * K + q.sub[i], P, q.center), isVoid = q.void;
    const dist = new Int16Array(n).fill(-1), touched = [], out = { links: [], conflicts: 0, flat: 0 };
    const bfs = (src, inMask, maxD) => { // 8-neighbour distances through the mask, up to maxD; returns the touched list
      for (const t of touched) dist[t] = -1; touched.length = 0; let cur = [];
      for (const t of src) { dist[t] = 0; touched.push(t); cur.push(t); }
      for (let d = 1; d <= maxD && cur.length; d++) {
        const nxt = [];
        for (const c of cur) { const x = c % W, y = (c / W) | 0; for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (dist[j] < 0 && inMask(j)) { dist[j] = d; touched.push(j); nxt.push(j); } } }
        cur = nxt;
      }
      return touched;
    };
    const byRoom = new Map(); for (let i = 0; i < n; i++) if (room[i] > 0 && !(isVoid && isVoid[i])) { let l = byRoom.get(room[i]); if (!l) byRoom.set(room[i], l = []); l.push(i); }
    const claim = new Map(); // tile -> { link, k }
    for (const o of [...types.rooms.values()].sort((p, q2) => p.id - q2.id)) {
      if (o.type !== T.CAKE) continue; const tiles = byRoom.get(o.id) || [];
      for (const l of o.linkList) {
        const r = o.id, lo = l.low, hi = l.high, core = l.core, inMask = (j) => room[j] === r && (ter[j] === lo || ter[j] === hi) && !(isVoid && isVoid[j]);
        const coreTiles = [], low = [], high = []; for (const t of tiles) { if (ter[t] === core) coreTiles.push(t); if (ter[t] === lo) low.push(t); else if (ter[t] === hi) high.push(t); }
        const info = { room: r, low: lo, high: hi, down: l.down, rings: 0, tiles: 0, gap: 0, step: 0, flat: false };
        out.links.push(info);
        if (!coreTiles.length) { info.flat = true; continue; }
        let coreTop = -Infinity, lowTop = -Infinity, highMin = Infinity; for (const t of coreTiles) coreTop = Math.max(coreTop, hb(t)); for (const t of low) lowTop = Math.max(lowTop, hb(t)); for (const t of high) highMin = Math.min(highMin, hb(t));
        const maxD = prm.layers * prm.per;
        let allowed = null; // Down: the seam window
        if (l.down) { bfs(l.pos, inMask, prm.seam); allowed = new Set(touched); for (const p of l.pos) allowed.add(p); }
        bfs(coreTiles, inMask, maxD);
        const rings = Array.from({ length: prm.layers }, () => []);
        for (const t of touched) {
          const d = dist[t]; if (d < 1 || ter[t] === core) continue; // exclude the core itself
          if (reserved[t]) continue; if (l.down && !allowed.has(t)) continue;
          rings[Math.min(prm.layers - 1, Math.ceil(d / prm.per) - 1)].push(t);
        }
        // CloseSmallDiagonalGaps: two diagonal tiles of a ring without the tiles between them -> add those that are free candidates (never another ring, the core, the reserved ones)
        const taken = new Set(); for (const rg of rings) for (const t of rg) taken.add(t);
        const cand = (j) => j >= 0 && inMask(j) && ter[j] !== core && !reserved[j] && !taken.has(j) && (!l.down || allowed.has(j)) && dist[j] >= 1 && Math.min(prm.layers - 1, Math.ceil(dist[j] / prm.per) - 1) >= 0;
        for (let k = 0; k < rings.length; k++) {
          const set = new Set(rings[k]), add = [];
          for (const t of rings[k]) { const x = t % W, y = (t / W) | 0; for (const [dx, dy] of [[1, 1], [-1, 1]]) { const ax = x + dx, ay = y + dy, bx = x - dx, by = y - dy; if (ax < 0 || ay < 0 || bx < 0 || by < 0 || ax >= W || ay >= H || bx >= W || by >= H) continue; if (!(set.has(ay * W + ax) && set.has(by * W + bx))) continue; for (const j of [y * W + x + dx, (y + dy) * W + x]) if (cand(j) && Math.min(prm.layers - 1, Math.ceil(dist[j] / prm.per) - 1) === k) add.push(j); } }
          for (const j of add) if (!taken.has(j)) { taken.add(j); rings[k].push(j); }
        }
        const kept = rings.filter((rg) => rg.length > 0), nR = kept.length; info.rings = nR;
        if (!nR) { info.flat = true; continue; }
        const gap = l.down ? highMin - coreTop : coreTop - lowTop; info.gap = gap;
        if (!(gap - prm.margin * P.terH > 1e-9)) { info.flat = true; info.rings = 0; continue; }
        const step = Math.min(prm.step * P.terH, (gap - prm.margin * P.terH) / nR); info.step = step; info.coreTop = coreTop;
        kept.forEach((rg, k) => {
          const h = l.down ? coreTop + (k + 1) * step : coreTop - (k + 1) * step;
          for (const t of rg) { const c = claim.get(t); if (!c) claim.set(t, { link: info, k, h, old: hb(t) }); else { out.conflicts++; if (k < c.k) claim.set(t, { link: info, k, h, old: hb(t) }); } }
        });
      }
    }
    out.claim = claim; out.flat = out.links.filter((x) => x.flat).length; return out;
  }
  T.buildRings = buildRings;

  /* Applies the cake to a shape S (rooms on, after the stairs are carved): the ring tiles get new levels (inserted in the height ranking), replacing their sub-terrace.
     `q` = E.quantize(full, P). Sets S.cake = info. */
  T.cake = function (S, P, RL, q, types) {
    const fw = S.mapW, n = S.n, K = S.subs, W = S.W, H = S.H;
    const reserved = new Uint8Array(RL.W * RL.H), mapOf = (i) => ((((i / W) | 0) + S.oy) * fw + (i % W) + S.ox);
    for (const rec of S.stairs || []) { for (const t of rec.bottom) reserved[mapOf(t)] = 1; for (const t of rec.top) reserved[mapOf(t)] = 1; for (const st of rec.steps) for (const t of st.tiles) reserved[mapOf(t)] = 1; }
    /* CORRIDOR (user's decision): the rings must not bury a ramp. Up (pyramid, rings on the low terrace): the low-terrace tiles straight in front of the foot of every column of the ramp are reserved, as far as the band of rings
       (layers x tiles per ring); Down (bowl, rings cut into the high terrace): the same behind the head, on the high terrace. Width = the ramp's columns. It stops at the room's limit, void, another terrace and the footprint of another ramp
       (so it never touches the core, which is on the other terrace, or another ramp). The corridor keeps the height of its terrace. P.cakeCorridor === false: diagnostic, no corridor. */
    const foot = reserved.slice(), prm = T.paramsOf(P); let corridor = 0;
    if (P.cakeCorridor !== false) for (const rec of S.stairs || []) {
      if (!rec.cols || !rec.cols.length || !rec.steps.length) continue;
      const b0 = rec.bottom[0], o = types.rooms.get(RL.room[mapOf(b0)]); if (!o || o.type !== T.CAKE) continue;
      const tl = S.ter[b0], th = S.ter[rec.top[0]], l = o.linkList.find((k) => k.low === tl && k.high === th); if (!l) continue;
      const atFoot = !l.down, first = rec.steps[0], last = rec.steps[rec.steps.length - 1], want = atFoot ? tl : th;
      let mine = 0;
      for (let ci = 0; ci < rec.cols.length; ci++) {
        const a = atFoot ? rec.bottom[ci] : rec.top[ci], from = atFoot ? first.tiles[ci] : last.tiles[ci], dx = (a % W) - (from % W), dy = ((a / W) | 0) - ((from / W) | 0);
        if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
        let x = a % W, y = (a / W) | 0;
        for (let j = 1; j <= prm.layers * prm.per; j++) {
          x += dx; y += dy; if (x < 0 || y < 0 || x >= W || y >= H) break; const t = y * W + x, m = mapOf(t);
          if ((S.void && S.void[t]) || RL.room[m] !== o.id || S.ter[t] !== want || foot[m]) break;
          mine++; if (!reserved[m]) { reserved[m] = 1; corridor++; }
        }
      }
      if (!mine) { // the straight way is closed at once (a cliff or the room's limit right in front): keep at least the free neighbours of the end tiles open
        for (let ci = 0; ci < rec.cols.length; ci++) { const a = atFoot ? rec.bottom[ci] : rec.top[ci], x = a % W, y = (a / W) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const t = ny * W + nx, m = mapOf(t);
            if (!(S.void && S.void[t]) && RL.room[m] === o.id && S.ter[t] === want && !foot[m] && !reserved[m]) { reserved[m] = 1; corridor++; } } }
      }
    }
    const R = buildRings(RL, types, P, q, reserved), eps = 1e-6, claimed = [];
    for (let i = 0; i < n; i++) { if (S.void && S.void[i]) continue; const c = R.claim.get(mapOf(i)); if (c) claimed.push([i, c]); }
    const info = { corridor, links: R.links.length, down: 0, up: 0, flat: R.flat, conflicts: R.conflicts, tiles: claimed.length, levelsAdded: 0, rings: [0, 0, 0, 0, 0, 0, 0], list: R.links, claim: R.claim };
    for (const l of R.links) { if (l.flat) continue; l.down ? info.down++ : info.up++; info.rings[Math.min(6, l.rings)]++; }
    S.cake = info; if (!claimed.length) return;
    // insert the new heights in the ranking of levels (an existing level is reused when the height matches)
    const hs = [...new Set(claimed.map(([, c]) => Math.round(c.h / eps)))].sort((a, b) => a - b).map((v) => v * eps), old = S.levelH, newH = [], newMeta = [], remap = new Array(old.length), hIdx = new Map();
    let hi = 0;
    for (let L = 0; L <= S.maxFine; L++) {
      while (hi < hs.length && hs[hi] < old[L] - 1e-5) { hIdx.set(hs[hi], newH.length); newH.push(hs[hi]); newMeta.push(null); hi++; }
      if (hi < hs.length && Math.abs(hs[hi] - old[L]) <= 1e-5) { hIdx.set(hs[hi], newH.length); hi++; }
      remap[L] = newH.length; newH.push(old[L]); newMeta.push(S.levelMeta[L]);
    }
    while (hi < hs.length) { hIdx.set(hs[hi], newH.length); newH.push(hs[hi]); newMeta.push(null); hi++; }
    for (const [, c] of claimed) { const h = Math.round(c.h / eps) * eps; if (!hIdx.has(h)) continue; const li = hIdx.get(h); if (!newMeta[li]) { const lo = c.link.low, top = E.terBase(lo, P, q.center) + (K - 1) * E.subHeight(P), base = E.terBase(lo + 1, P, q.center); newMeta[li] = { ter: lo, sub: K - 1, bridge: true, ring: true, frac: Math.max(0.05, Math.min(0.95, base > top ? (h - top) / (base - top) : 0.5)) }; info.levelsAdded++; } }
    for (let i = 0; i < n; i++) S.fine[i] = remap[S.fine[i]];
    for (const [i, c] of claimed) S.fine[i] = hIdx.get(Math.round(c.h / eps) * eps);
    for (const rec of S.stairs || []) if (rec.level !== undefined) rec.level = remap[rec.level];
    S.levelH = newH; S.levelMeta = newMeta.map((m, L) => m || { ter: 0, sub: 0, bridge: false }); S.maxFine = newH.length - 1;
    S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!S.void || !S.void[i]) S.byLevel[S.fine[i]].push(i);
    S.ringTile = new Uint8Array(n); for (const [i] of claimed) S.ringTile[i] = 1;
    if (S.void) { S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (S.void[i]) S.fineMask[i] = -1; }
  };
})(window.EVO = window.EVO || {});
