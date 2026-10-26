/* EvoDun crystal viewer - room types (Cake / Diorama / Ascension), the user's crystallizer.
   Source of the rules: reference/SingleRoomMeshGeneratorV16.4.cs. GenerateRoom ends with BuildCakesForCurrentRoom(...) and `return` (lines 648-649): the pass-1/pass-2 code,
   DetectCakeDirection and DetectCakeViaTerraceEdges below it are dead code and are NOT followed.
   - Room type (473-560), neighbours instead of lobby platforms: CAKE = the room has >= 2 terraces, cakeLayers > 0 and a terrace edge (the LOW tile of a used terrace gate whose two tiles are in the room);
     DIORAMA = not cake and >= 3 neighbouring rooms by room transitions; ASCENSION = the rest.
   - Cake (BuildCakesForCurrentRoom 1719, BuildCakeDownRingsSimple 1670, BuildCakeUpRings 1602): ONE cake per terrace link (low, high) of the room. Direction: one link -> more pieces of the room on the high
     terrace = Down, more on the low = Up, tie = Down; several links -> Down only when low is the minimum terrace of the room, else Up. Pieces = 4-connected pieces of the room per terrace (no platforms here).
     Core = ALL the room's tiles of the core terrace (low if Down, high if Up). Rings OUTSIDE the core: ring k = Dilate8(core, (k+1)d) \ Dilate8(core, k d), cakeLayers 3, dilationPerLayer 1, clipped to the room's tiles
     of the two terraces (Down; Up v2: see below). Both directions are cut to the seam window (Dilate8 of the gate tiles of the link, radius 5). Heights: uniform step (cakeStepHeight = 0.3 terH); Down rises from the core top
     (+0.3, +0.6, +0.9), Up descends from the LOCAL platform height (-0.3, -0.6, -0.9 at most).
   - ADAPTATION TO THE VIEWER (user's decision): in Unity the rings fill the gap between the platforms of two terraces; here the terraces touch. Down: the rings are CUT into tiles of the high terrace of the same room.
     Up (CAKE v2 FOR UP LINKS, 2026-10-15; P.cakeUpV1 = the previous rule): rings are BUILT in the AIRSPACE of any non-void tile except a Diorama tile (the land mass of a cake room is more than its footprint), only raising ground, and
     each ring tile takes its height from ref(t) = the lowest core tile in the Chebyshev window of radius d around it, so the platform is the highest point of the cake. Never on void. The footprint of a ramp is reserved. Empty rings are dropped and the rest renumbered.
     step = min(step, (gap - margin) / n) so the last ring stays below the neighbouring terrace (Down) / above the low terrace (Up). Rings replace the sub-terraces on the tiles they take.
   - Unity's BuildCakeUpRings keeps the ring tiles closer to the low terrace than to the high one; the seam window is the viewer's way to the same result. Stitching of diagonal gaps only adds free ring candidates.
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
    const claim = new Map(); // tile -> { link, k, h, old }
    const v1 = P.cakeUpV1 === true, coreOpen = P.cakeCoreOpen === true, dioBlocked = new Set(), coreBlocked = new Set(); out.dioBlocked = 0; out.skipRaise = 0; out.coreBlocked = 0;
    // CORE PROTECTION (user's decision 2026-10-16; P.cakeCoreOpen = the previous behaviour): the core tiles of every Cake room (any link, any direction) are solid for the Up rings of ANOTHER room: a platform is the extreme of its own cake (Up = the highest point, Down = the lowest, a bowl floor)
    // and a ring of another cake must not raise it. The cores of the other links of the SAME room are not protected, except a bowl floor (the core of a Down link): stacked cakes (the platform terrace of the lower link is the low terrace of the upper link) are by design.
    // A bowl floor (the core of a Down link) is protected from the Up rings of the SAME room as well (protDown): a bowl's floor must stay its lowest point (measured: room 30 of the Default real map, an Up ring of its link (1, 2) raised the floor of its link (0, 1) from 0.44 to 1.49).
    const prot = new Uint8Array(n), protDown = new Uint8Array(n);
    for (const o of types.rooms.values()) { if (o.type !== T.CAKE) continue; const cores = new Set(o.linkList.map((k) => k.core)), dcores = new Set(o.linkList.filter((k) => k.down).map((k) => k.core)); for (const t of byRoom.get(o.id) || []) { if (cores.has(ter[t])) prot[t] = 1; if (dcores.has(ter[t])) protDown[t] = 1; } }
    for (const o of [...types.rooms.values()].sort((p, q2) => p.id - q2.id)) {
      if (o.type !== T.CAKE) continue; const tiles = byRoom.get(o.id) || [];
      for (const l of o.linkList) {
        const r = o.id, lo = l.low, hi = l.high, core = l.core, air = !l.down && !v1; // air: Up v2 (seam window, airspace, local platform reference, raise only); Down and the v1 diagnostic keep the room-based rule
        const isCore = (j) => room[j] === r && ter[j] === core;
        const inMask = air // Up v2: the AIRSPACE of any non-void tile (the land mass of a cake room is more than its footprint), except a Diorama tile (a pocket: its footprint is not modified)
          ? (j) => { if (isVoid && isVoid[j]) return false; if (types.type[j] === T.DIORAMA) { dioBlocked.add(j); return false; } if (!coreOpen && prot[j] && !isCore(j) && (room[j] !== r || protDown[j])) { coreBlocked.add(j); return false; } return true; }
          : (j) => room[j] === r && (ter[j] === lo || ter[j] === hi) && !(isVoid && isVoid[j]);
        const coreTiles = [], low = [], high = []; for (const t of tiles) { if (ter[t] === core) coreTiles.push(t); if (ter[t] === lo) low.push(t); else if (ter[t] === hi) high.push(t); }
        const info = { room: r, low: lo, high: hi, down: l.down, rings: 0, tiles: 0, gap: 0, step: 0, flat: false };
        out.links.push(info);
        if (!coreTiles.length) { info.flat = true; continue; }
        let coreTop = -Infinity, lowTop = -Infinity, highMin = Infinity; for (const t of coreTiles) coreTop = Math.max(coreTop, hb(t)); for (const t of low) lowTop = Math.max(lowTop, hb(t)); for (const t of high) highMin = Math.min(highMin, hb(t));
        const maxD = prm.layers * prm.per;
        let allowed = null; // the seam window (Dilate8 of the gate tiles of the link, radius cakeSeam): Down, and Up v2
        if (l.down || air) { bfs(l.pos, inMask, prm.seam); allowed = new Set(touched); for (const p of l.pos) allowed.add(p); }
        bfs(coreTiles, inMask, maxD);
        const rings = Array.from({ length: prm.layers }, () => []);
        for (const t of touched) {
          const d = dist[t]; if (d < 1 || isCore(t)) continue; // exclude the core itself
          if (reserved[t]) continue; if (allowed && !allowed.has(t)) continue;
          rings[Math.min(prm.layers - 1, Math.ceil(d / prm.per) - 1)].push(t);
        }
        // CloseSmallDiagonalGaps: two diagonal tiles of a ring without the tiles between them -> add those that are free candidates (never another ring, the core, the reserved ones)
        const taken = new Set(); for (const rg of rings) for (const t of rg) taken.add(t);
        const cand = (j) => j >= 0 && inMask(j) && !isCore(j) && !reserved[j] && !taken.has(j) && (!allowed || allowed.has(j)) && dist[j] >= 1 && Math.min(prm.layers - 1, Math.ceil(dist[j] / prm.per) - 1) >= 0;
        for (let k = 0; k < rings.length; k++) {
          const set = new Set(rings[k]), add = [];
          for (const t of rings[k]) { const x = t % W, y = (t / W) | 0; for (const [dx, dy] of [[1, 1], [-1, 1]]) { const ax = x + dx, ay = y + dy, bx = x - dx, by = y - dy; if (ax < 0 || ay < 0 || bx < 0 || by < 0 || ax >= W || ay >= H || bx >= W || by >= H) continue; if (!(set.has(ay * W + ax) && set.has(by * W + bx))) continue; for (const j of [y * W + x + dx, (y + dy) * W + x]) if (cand(j) && Math.min(prm.layers - 1, Math.ceil(dist[j] / prm.per) - 1) === k) add.push(j); } }
          for (const j of add) if (!taken.has(j)) { taken.add(j); rings[k].push(j); }
        }
        const kept = rings.filter((rg) => rg.length > 0), nR = kept.length; info.rings = nR;
        if (!nR) { info.flat = true; continue; }
        // Up v2: LOCAL PLATFORM REFERENCE. ref(t) = the lowest core tile inside the Chebyshev window of radius dist[t] around t (the BFS reached t from a core tile in dist[t] 8-neighbour steps, so one exists; coreTop is only a fallback): the ring is strictly below every core tile it can touch, so the platform is the highest point of the cake (the viewer core has sub-terrace relief, Unity platform tops are flat)
        const refOf = new Map();
        if (air) for (const rg of kept) for (const t of rg) {
          const x = t % W, y = (t / W) | 0, d = dist[t]; let m = Infinity;
          for (let yy = Math.max(0, y - d); yy <= Math.min(H - 1, y + d); yy++) for (let xx = Math.max(0, x - d); xx <= Math.min(W - 1, x + d); xx++) { const j = yy * W + xx; if (isCore(j)) m = Math.min(m, hb(j)); }
          refOf.set(t, m === Infinity ? coreTop : m);
        }
        let refMin = Infinity; if (air) for (const v of refOf.values()) refMin = Math.min(refMin, v);
        const gap = l.down ? highMin - coreTop : (air ? refMin : coreTop) - lowTop; info.gap = gap;
        if (!(gap - prm.margin * P.terH > 1e-9)) { info.flat = true; info.rings = 0; continue; }
        const step = Math.min(prm.step * P.terH, (gap - prm.margin * P.terH) / nR); info.step = step; info.coreTop = coreTop; info.lowTop = lowTop; { let sx = 0, sy = 0; for (const t of coreTiles) { sx += t % W; sy += (t / W) | 0; } info.cc = [sx / coreTiles.length + 0.5, sy / coreTiles.length + 0.5]; }
        kept.forEach((rg, k) => {
          for (const t of rg) {
            const h = l.down ? coreTop + (k + 1) * step : (air ? refOf.get(t) : coreTop) - (k + 1) * step, old = hb(t);
            if (air && old >= h - 1e-9) { out.skipRaise++; continue; } // an Up ring only RAISES ground, never cuts it
            const rec = { link: info, k, h, old, d: dist[t] }, c = claim.get(t); if (!c) claim.set(t, rec); else { out.conflicts++; if (k < c.k) claim.set(t, rec); }
          }
        });
      }
    }
    // CAMERA CUT (D29, P.cakeCut quadrant | half; off = nothing): the rings stay per link, but the sector of the link that faces the camera axis (P.pocketYaw) is removed so the platform is seen: Down -> the tile drops to the core floor, Up -> the claim is dropped (an Up ring only raised ground, so the tile keeps its original, lower height)
    out.cut = 0;
    if (P.cakeCut === 'quadrant' || P.cakeCut === 'half') {
      const yaw = (P.pocketYaw || 0) * Math.PI / 180, ux = Math.sin(yaw), uy = Math.cos(yaw), thr = P.cakeCut === 'half' ? 0 : Math.SQRT1_2;
      for (const [t, c] of [...claim]) { const l = c.link; if (!l.cc) continue; const dx = (t % W) + 0.5 - l.cc[0], dy = ((t / W) | 0) + 0.5 - l.cc[1], len = Math.hypot(dx, dy) || 1; if ((dx * ux + dy * uy) / len < thr - 1e-9) continue; out.cut++; if (l.down) c.h = l.coreTop; else claim.delete(t); }
    }
    out.dioBlocked = dioBlocked.size; out.coreBlocked = coreBlocked.size;
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
  /* NON-WALKABLE AS ANCHORS (DAC v2, D26; `P.anchors`, off by default; `P.anchorH` terraces, default 0.5): the tiles that are not walkable in the rooms layer (S.nowalk: isolated terrain and the forbidden margins of walls, cliffs and Steep) are raised by a fixed
     amount and drawn grey (`meta.anchor`), as a reminder of the structural anchors, instead of the flat "not walkable" tone. VISUAL ONLY (walking, regions and routes are computed before). In the Chain view only the tiles of the chain rooms are raised (the
     rest is the flat grey ground). Ring tiles and ramp tiles are never raised. Each distinct level under an anchor gets ONE new level `anchorH * terH` above it (the shared level insertion, like the Cake rings and the Pocket). Sets S.anchorInfo. */
  T.insertLevels = function (S, moves) { // moves: Map tile -> { h, meta }; new levels are never merged with an existing one (a height that equals one is nudged up by 0.003)
    const n = S.n, eps = 1e-6, old = S.levelH, key = (m) => JSON.stringify(m), uniq = new Map(); // (height, meta) -> level
    for (const [, m] of moves) { let h = m.h; if (old.some((x) => Math.abs(x - h) < 1e-4)) h += 0.003; const k = Math.round(h / eps) + '|' + key(m.meta); if (!uniq.has(k)) uniq.set(k, { h, meta: m.meta }); m.k = k; }
    const list = [...uniq.entries()].sort((a, b) => a[1].h - b[1].h), newH = [], newMeta = [], remap = new Array(old.length), idx = new Map(); let hi = 0;
    for (let L = 0; L <= S.maxFine; L++) {
      while (hi < list.length && list[hi][1].h < old[L]) { idx.set(list[hi][0], newH.length); newH.push(list[hi][1].h); newMeta.push(list[hi][1].meta); hi++; }
      remap[L] = newH.length; newH.push(old[L]); newMeta.push(S.levelMeta[L]);
    }
    while (hi < list.length) { idx.set(list[hi][0], newH.length); newH.push(list[hi][1].h); newMeta.push(list[hi][1].meta); hi++; }
    for (let i = 0; i < n; i++) S.fine[i] = remap[S.fine[i]];
    for (const [i, m] of moves) S.fine[i] = idx.get(m.k);
    for (const rec of S.stairs || []) if (rec.level !== undefined) rec.level = remap[rec.level];
    S.levelH = newH; S.levelMeta = newMeta; S.maxFine = newH.length - 1;
    const vd = S.void; S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd || !vd[i]) S.byLevel[S.fine[i]].push(i);
    if (vd) { S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1; }
    return uniq.size;
  };
  T.anchors = function (S, P) {
    const n = S.n, up = (P.anchorH === undefined ? 0.5 : P.anchorH) * P.terH, moves = new Map(), vd = S.void, chain = S.chainGrey; let skippedRing = 0;
    for (let i = 0; i < n; i++) {
      if (!S.nowalk[i] || (vd && vd[i]) || (chain && chain[i]) || (S.carved && S.carved[i])) continue;
      if (S.ringTile && S.ringTile[i]) { skippedRing++; continue; }
      moves.set(i, { h: S.levelH[S.fine[i]] + up, meta: { ter: S.levelMeta[S.fine[i]].ter, sub: 0, bridge: false, anchor: true } });
    }
    const added = moves.size ? T.insertLevels(S, moves) : 0;
    S.anchorInfo = { tiles: moves.size, levelsAdded: added, skippedRing, up };
    return S.anchorInfo;
  };
  /* ROOM-LEVEL CHAIN (DAC v2 PR B, D27; `P.chainExtra` N, default 3). The chain is a path in the ROOM graph, not the union of the tile routes (PR A). Nodes = rooms; edges = room pairs joined by an OPEN room transition (a valid transition, used or not: the walking
     rule of src/rooms.js) or by a carved ramp between two rooms (a used terrace gate); `doors` keeps the tiles of every connection. Goals = the room of the stake, then the objectives in placement order (the last one is the final goal; intermediate landmarks and
     arenas will come later). BLOCK THE SHORTEST ONCE: the shortest room path from the start to the FINAL goal only (BFS, fewest rooms; intermediate goals ignored) is blocked edge by edge, except the edges that are a BRIDGE of the room graph (never block them: the map
     must not split in two). Then, per leg (goal -> next goal), the LONGEST simple room path without the blocked edges and without any room already in the chain, with at most (shortest rooms of that leg + N) rooms (a bounded DFS pruned by the distance to the goal; the
     bound and an expansion budget cut the exponential search: `cut` says so); a leg with no path after blocking is unblocked and reported. Legs are chained by backtracking over their candidate paths (longest first), so a long leg cannot make the next one impossible.
     Visual only: the tile route and the walking do not change. Returns { rooms (the core chain, stake first), blocked: [[a, b]], bridges, cut, unblockedLegs, legs, shortest } or { fail }. */
  const rkey = (a, b) => Math.min(a, b) * 100000 + Math.max(a, b);
  /* PIECES (DAC v2 PR B, user's decision 2026-10-20): the nodes of the chain graph are not rooms but the PIECES of a room = the walkable components of its tiles (4-neighbour steps of the walking graph that stay inside the room, so a room's internal ramps join terraces into ONE piece and
     two terraces of a room with no ramp between them are two pieces). A route that enters a room by one piece can only leave it by that piece: this is what makes the chain walkable with the tiles of its own rooms. `S.region` >= 0 = walkable (isolated terrain and forbidden margins have none). */
  T.pieces = function (S, P) {
    if (S._pieces) return S._pieces; const n = S.n, map = S.roomMap, nb = E.walkGraph(S, P), id = new Int32Array(n), room = [0]; let cnt = 0;
    const ok = (i) => map[i] > 0 && !(S.void && S.void[i]) && S.region && S.region[i] >= 0;
    for (let s = 0; s < n; s++) { if (id[s] || !ok(s)) continue; cnt++; room.push(map[s]); id[s] = cnt; const q = [s]; for (let h = 0; h < q.length; h++) for (const j of nb(q[h])) if (!id[j] && ok(j) && map[j] === map[s]) { id[j] = cnt; q.push(j); } }
    return (S._pieces = { id, count: cnt, room });
  };
  /* the graph: nodes = pieces (default) or rooms (`mode` 'room', diagnostic only: `P.chainNodes === 'room'` reproduces the room-level chain of the first PR B probe); edges = the walking-graph steps between tiles of different nodes (open room transitions and ramps between rooms).
     adj: node -> Set of nodes; doors: rkey(a, b) -> [{ ra, rb, ia, ib, ramp }] with the tile of each side. */
  T.roomGraph = function (S, P, mode) {
    const pc = T.pieces(S, P), nb = E.walkGraph(S, P), W = S.W, n = S.n, node = mode === 'room' ? (i) => S.roomMap[i] : (i) => pc.id[i], adj = new Map(), doors = new Map(), seen = new Set();
    const add = (ra, rb, ia, ib) => { const k = rkey(ra, rb); let d = doors.get(k); if (!d) doors.set(k, d = []); const df = Math.abs(ia - ib); d.push({ ra, rb, ia, ib, ramp: !!(S.carved && (S.carved[ia] || S.carved[ib])) || (df !== 1 && df !== W) }); (adj.get(ra) || adj.set(ra, new Set()).get(ra)).add(rb); (adj.get(rb) || adj.set(rb, new Set()).get(rb)).add(ra); };
    for (let i = 0; i < n; i++) { const a = node(i); if (!(a > 0) || !pc.id[i]) continue;
      for (const j of nb(i).slice()) { const b = node(j); if (!(b > 0) || b === a || !pc.id[j]) continue; const k = Math.min(i, j) * n + Math.max(i, j); if (seen.has(k)) continue; seen.add(k); add(a, b, i, j); } }
    return { adj, doors, mode: mode === 'room' ? 'room' : 'piece', pc };
  };
  /* THE CHAIN (user's decisions 2026-10-19 / 20): from the stake to the FINAL goal only (the last objective placed; the other objectives are not intermediate goals: landmarks and arenas will become forced intermediate goals later). The shortest node path is found; its edges are BLOCKED except bridges (an edge whose removal disconnects its ends);
     then the LONGEST simple node path without blocked edges and without repeating a room (or a piece) whose length is at most shortest + N (`P.chainExtra`, default 3, bounded DFS: `cut` says if the bound was hit). If the blocked graph has no path the edges are unblocked and the info says so. Returns { pieces, rooms, blocked: [[a, b]], bridges, cut, unblocked, shortest, graph, mode }. */
  T.roomChainSimple = function (S, P, stakeTile, goalTile, mode) {
    const g = T.roomGraph(S, P, mode), adj = g.adj, pc = g.pc, N = P.chainExtra === undefined ? 3 : P.chainExtra, node = g.mode === 'room' ? (i) => S.roomMap[i] : (i) => pc.id[i], roomOf = g.mode === 'room' ? (x) => x : (x) => pc.room[x];
    const from = node(stakeTile), to = node(goalTile);
    if (!(from > 0) || !(to > 0)) return { fail: 'the stake or the final goal is not on walkable room terrain' };
    if (from === to) return { pieces: [from], rooms: [roomOf(from)], blocked: [], bridges: 0, cut: false, unblocked: false, shortest: 1, graph: g, mode: g.mode };
    const nb = (u) => [...(adj.get(u) || [])].sort((p, q) => p - q);
    const bfs = (s, t, blocked) => { const prev = new Map([[s, -1]]), q = [s]; for (let h = 0; h < q.length; h++) { const u = q[h]; if (u === t) break; for (const v of nb(u)) { if (prev.has(v) || (blocked && blocked.has(rkey(u, v)))) continue; prev.set(v, u); q.push(v); } }
      if (!prev.has(t)) return null; const path = []; for (let k = t; k !== -1; k = prev.get(k)) path.push(k); return path.reverse(); };
    const p0 = bfs(from, to, null); if (!p0) return { fail: 'the stake and the final goal are not connected by walkable room transitions' };
    const blocked = new Set(), blockedList = []; let bridges = 0;
    for (let k = 0; k + 1 < p0.length; k++) { const a = p0[k], b = p0[k + 1], one = new Set([rkey(a, b)]); if (!bfs(a, b, one)) { bridges++; continue; } blocked.add(rkey(a, b)); blockedList.push([a, b]); }
    const dists = (t, blk) => { const d = new Map([[t, 0]]), q = [t]; for (let h = 0; h < q.length; h++) { const u = q[h]; for (const v of nb(u)) { if (d.has(v) || (blk && blk.has(rkey(u, v)))) continue; d.set(v, d.get(u) + 1); q.push(v); } } return d; };
    let blk = blocked, unblocked = false, d = dists(to, blk); if (!d.has(from)) { blk = null; unblocked = true; d = dists(to, null); }
    const BUDGET = 400000; let cut = false, out = [], repeated = false;
    // FIRST the chain without repeating a room (the user's rule); only if there is none, a room may host two pieces of the chain (user's decision 2026-10-20: the info says "room X appears twice, two pieces"; the repeated room has ONE type, the one of its first visit, in both pieces)
    for (const repeat of [false, true]) {
      const limit = d.get(from) + 1 + N; let exp = 0; out = []; const path = [from], seenN = new Set([from]), seenR = new Set([roomOf(from)]);
      const dfs = (u) => { if (u === to) { out.push(path.slice()); return; } if (++exp > BUDGET || out.length > 4000) { cut = true; return; }
        for (const v of nb(u)) { if (seenN.has(v) || (!repeat && seenR.has(roomOf(v))) || (blk && blk.has(rkey(u, v))) || !d.has(v) || path.length + 1 + d.get(v) > limit) continue; const had = seenR.has(roomOf(v)); seenN.add(v); seenR.add(roomOf(v)); path.push(v); dfs(v); path.pop(); seenN.delete(v); if (!had) seenR.delete(roomOf(v)); if (cut && out.length > 4000) return; } };
      dfs(from); if (out.length) { repeated = repeat; break; }
    }
    if (!out.length) return { fail: 'no chain of rooms joins the stake and the final goal within the extra-rooms bound' };
    out.sort((p, q) => q.length - p.length || (p.join() < q.join() ? -1 : 1)); const pieces = out[0];
    const cnt = new Map(); for (const x of pieces) cnt.set(roomOf(x), (cnt.get(roomOf(x)) || 0) + 1); const twice = [...cnt].filter(([, c]) => c > 1).map(([r]) => r);
    return { pieces, rooms: pieces.map(roomOf), blocked: blockedList, bridges, cut, unblocked, shortest: p0.length, candidates: out.length, repeated: twice, graph: g, mode: g.mode };
  };
  /* CHAIN THROUGH SUB-OBJECTIVES (DAC v2 PR B3, D29; user's rule 2026-10-21, it CORRECTS "no room repeated anywhere in the whole chain" of PR B, which only holds with no sub-objective): the goals in order are the stake, the SUB-OBJECTIVES (the objectives before the last, in placement order; later landmarks and
     arenas become sub-objectives the same way) and the FINAL goal. K = the number of valid sub-objectives; a MAXIMUM NUMBER OF USES per piece over the whole chain U = K + 1 (K = 0: U = 1, no piece repeats: `roomChainSimple`, the PR B code, unchanged); the step maximum is (K + 1) x B with B = the ACTUAL steps of the K = 0 chain of the same example (a chain of 14 rooms = 13 steps becomes 26 with one sub-objective).
     A sub-objective off room terrain, or in the same piece as the previous goal, is skipped (`skipped`, the info says so). The blocking is the PR B one (shortest stake -> FINAL goal, once, bridges skipped; a goal unreachable once blocked unblocks the edges and the info says so). The walk is the LONGEST within the bounds (ties: the smallest ids in DFS order), bounded DFS (`cut` says if the budget was hit) with a distance lower bound through the remaining goals.
     JUSTIFIED REPEAT (user's decision, the reason for a repeat, not a stated rule: the cap U is the rule): a piece may be entered again only if a goal was reached since its previous visit, so every repeat has a sub-objective behind it and there is no pointless back-and-forth (A-B-A-B) inside one stretch. Returns the PR B fields plus { k, steps, maxSteps, baseSteps, visits, uses, skipped, goalTiles }. */
  T.roomChain = function (S, P, stakeTile, goalTile, mode, subTiles) {
    const base = T.roomChainSimple(S, P, stakeTile, goalTile, mode); if (base.fail || mode === 'room' || !subTiles || !subTiles.length) return base;
    const g = base.graph, pc = g.pc, adj = g.adj, node = (i) => (i >= 0 ? pc.id[i] : 0), from = node(stakeTile), to = node(goalTile), skipped = [], goals = [from], goalTiles = [stakeTile];
    subTiles.forEach((t, q) => { const v = node(t); if (!(v > 0)) { skipped.push({ index: q + 1, why: 'not on room terrain' }); return; } if (v === goals[goals.length - 1]) { skipped.push({ index: q + 1, why: 'in the same piece as the previous goal' }); return; } goals.push(v); goalTiles.push(t); });
    if (goals.length === 1) return Object.assign({}, base, { k: 0, skipped, goalTiles: [stakeTile, goalTile] });
    goals.push(to); goalTiles.push(goalTile); const K = goals.length - 2, U = K + 1, B = base.pieces.length - 1, MAX = (K + 1) * B;
    const bl = new Set(base.blocked.map(([a, b]) => rkey(a, b))); let blk = bl, unblocked = base.unblocked;
    const nbOf = (b2) => (u) => [...(adj.get(u) || [])].filter((v) => !(b2 && b2.has(rkey(u, v)))).sort((p, q) => p - q);
    const distFrom = (nb, s) => { const d = new Map([[s, 0]]), q = [s]; for (let h = 0; h < q.length; h++) for (const v of nb(q[h])) if (!d.has(v)) { d.set(v, d.get(q[h]) + 1); q.push(v); } return d; };
    let nb = nbOf(blk), dist = goals.map((x) => distFrom(nb, x));
    if (goals.some((x) => !dist[0].has(x))) { blk = null; unblocked = true; nb = nbOf(null); dist = goals.map((x) => distFrom(nb, x)); }
    const justified = P.chainJustified !== false, last = goals.length - 1, BUDGET = 400000; let exp = 0, cut = false, best = null; const uses = new Map([[from, 1]]), walk = [from], stretch = new Set([from]);
    const dfs = (u, gi) => {
      if (++exp > BUDGET) { cut = true; return; }
      if (gi === last && u === to && (!best || walk.length > best.length)) best = walk.slice();
      for (const v of nb(u)) {
        const c = uses.get(v) || 0; if (c >= U || (justified && stretch.has(v))) continue; // the cap U per piece; a repeat only after a goal was reached (the stretch set is cleared at every goal; `P.chainJustified === false` = diagnostic only, not in the UI or the manifest: the cap alone, to test it)
        const ngi = gi < last && v === goals[gi + 1] ? gi + 1 : gi; let lb = walk.length, cur = v, ok = true;
        for (let q = ngi + 1; q <= last && ok; q++) { const dd = dist[q].get(cur); if (dd === undefined) ok = false; else { lb += dd; cur = goals[q]; } }
        if (!ok || lb > MAX) continue;
        const reset = ngi !== gi, saved = reset ? [...stretch] : null; walk.push(v); uses.set(v, c + 1); if (reset) { stretch.clear(); } stretch.add(v);
        dfs(v, ngi);
        walk.pop(); uses.set(v, c); stretch.delete(v); if (reset) for (const x of saved) stretch.add(x);
      }
    };
    dfs(from, 0);
    if (!best) return { fail: 'no chain of rooms through the sub-objectives within the step maximum' };
    const roomOf = (x) => pc.room[x], cnt = new Map(); for (const x of best) cnt.set(x, (cnt.get(x) || 0) + 1); const rc = new Map(); for (const x of best) rc.set(roomOf(x), (rc.get(roomOf(x)) || 0) + 1);
    return Object.assign({}, base, { pieces: best, rooms: best.map(roomOf), cut, unblocked, repeated: [...rc].filter(([, c]) => c > 1).map(([r2]) => r2), k: K, steps: best.length - 1, maxSteps: MAX, baseSteps: B, visits: best.length, distinct: cnt.size, piecesTwice: [...cnt].filter(([, c]) => c > 1).length, maxUses: Math.max(...cnt.values()), uses: U, skipped, goalTiles, candidates: 1 });
  };
  /* WALKABLE CHECK (user, 2026-10-20): the chain must be walkable using only the tiles of the rooms of the chain and without crossing a blocked edge: a BFS from the stake over the walking graph restricted to those tiles. { ok, length } (length in tiles, -1 if not). */
  T.chainWalk = function (S, P, chain, stakeTile, goalTile) {
    const nb = E.walkGraph(S, P), pc = T.pieces(S, P), rooms = new Set(chain.rooms), bl = new Set(chain.blocked.map(([a, b]) => rkey(a, b))), node = chain.mode === 'room' ? (i) => S.roomMap[i] : (i) => pc.id[i];
    const tiles = chain.goalTiles && chain.goalTiles.length > 2 ? chain.goalTiles : [stakeTile, goalTile]; // through the sub-objectives (D29): the whole walk, stretch by stretch, from each goal to the next
    for (const t of tiles) if (!rooms.has(S.roomMap[t])) return { ok: false, length: -1 };
    let total = 0;
    for (let k = 0; k + 1 < tiles.length; k++) { const a0 = tiles[k], b0 = tiles[k + 1], dist = new Int32Array(S.n).fill(-1), q = [a0]; dist[a0] = 1;
      for (let h = 0; h < q.length; h++) { const i = q[h]; if (i === b0) break; for (const j of nb(i).slice()) { if (dist[j] >= 0 || !rooms.has(S.roomMap[j])) continue; const a = node(i), b = node(j); if (a !== b && bl.has(rkey(a, b))) continue; dist[j] = dist[i] + 1; q.push(j); } }
      if (dist[b0] < 0) return { ok: false, length: -1 }; total += dist[b0] - (k > 0 ? 1 : 0); }
    return { ok: true, length: total };
  };
  /* CROSSINGS (diagnostic, the user's check of the room-level chain): for a sequence of ROOM ids (stake first) the rooms where the route cannot get through: the pieces reachable on entry have no door into the next room, i.e. the entry and the exit are different pieces of the room
     (not walkable inside it). Returns the list of room ids (the last one is listed when the goal piece is not reached). */
  T.chainCrossings = function (S, P, rooms, stakeTile, goalTile) {
    const g = T.roomGraph(S, P), pc = g.pc, bad = []; let reach = new Set([pc.id[stakeTile]]);
    for (let k = 0; k + 1 < rooms.length; k++) { const next = new Set(); for (const a of reach) for (const b of g.adj.get(a) || []) if (pc.room[b] === rooms[k + 1]) next.add(b);
      if (!next.size) { bad.push(rooms[k]); for (let b = 1; b <= pc.count; b++) if (pc.room[b] === rooms[k + 1] && [...(g.adj.get(b) || [])].some((c) => pc.room[c] === rooms[k])) next.add(b); }
      reach = next; }
    if (!reach.has(pc.id[goalTile])) bad.push(rooms[rooms.length - 1]);
    return bad;
  };
  /* The types of the chain rooms. `rule` 'v164' = the classification of E.roomTypes.classify; 'route' = BY ROLE in the chain: Cake if the entry terrace differs from the exit terrace of the PIECE along the chain (Up if it climbs; the first piece enters at the stake tile, the last leaves at the goal tile),
     else Diorama if the room has >= 2 terraces and no used internal terrace edge (V4 Step5), else Ascension. Both rules then turn the second Diorama of two in a row into Ascension (chain view only). Returns { map: Map room id -> { type, up }, counts, v164, route, ... }. */
  T.chainTypes = function (S, P, chain, rule, stakeTile, goalTile) {
    const ty = S.types, graph = chain.graph, nodes = chain.pieces, rooms = chain.rooms, doorTer = (ra, rb) => { const ds = graph.doors.get(rkey(ra, rb)) || []; let best = null;
      for (const d of ds) { const ia = d.ra === ra ? d.ia : d.ib, ib = d.ra === ra ? d.ib : d.ia, c = { ta: S.ter[ia], tb: S.ter[ib], ramp: d.ramp }; if (!best || (best.ramp && !c.ramp) || (best.ramp === c.ramp && c.ta < best.ta)) best = c; } return best || { ta: 0, tb: 0 }; };
    const relabel = (types) => { for (let k = 1; k < types.length; k++) if (types[k] === T.DIORAMA && types[k - 1] === T.DIORAMA) types[k] = T.ASCENSION; return types; };
    const v164 = rooms.map((id) => { const o = ty.rooms.get(id); return o ? o.type : T.ASCENSION; });
    const route = rooms.map((id, k) => { const o = ty.rooms.get(id); const entry = k === 0 ? S.ter[stakeTile] : doorTer(nodes[k - 1], nodes[k]).tb, exit = k === rooms.length - 1 ? S.ter[goalTile] : doorTer(nodes[k], nodes[k + 1]).ta;
      if (entry !== exit) return { type: T.CAKE, up: exit > entry }; if (o && o.terraces.size >= 2 && !(o.linkList && o.linkList.length)) return { type: T.DIORAMA }; return { type: T.ASCENSION }; });
    const cnt = (arr) => { const c = { Cake: 0, Asc: 0, Dio: 0 }; for (const t of arr) c[t === T.CAKE ? 'Cake' : t === T.DIORAMA ? 'Dio' : 'Asc']++; return c; };
    // a room that appears several times has ONE type, the one of its FIRST visit; no two Dioramas in a row on the whole sequence: a room that follows a Diorama at any visit becomes Ascension (in all its visits), to a fixpoint (with no repeated room it is the single pass of PR B)
    const first = rooms.map((id, k) => rooms.indexOf(id)), typed = (arr) => { const m = new Map(); rooms.forEach((id, k) => { if (!m.has(id)) m.set(id, arr[k]); }); for (let ch = true, it = 0; ch && it < 50; it++) { ch = false; for (let k = 1; k < rooms.length; k++) { const r = rooms[k], q = rooms[k - 1]; if (r !== q && m.get(r) === T.DIORAMA && m.get(q) === T.DIORAMA) { m.set(r, T.ASCENSION); ch = true; } } } return rooms.map((id) => m.get(id)); };
    const a = typed(v164), b = typed(route.map((x) => x.type));
    const use = rule === 'route' ? b : a, map = new Map(), ters = new Set([S.ter[stakeTile], S.ter[goalTile]]); for (let k = 0; k + 1 < nodes.length; k++) { const dt = doorTer(nodes[k], nodes[k + 1]); ters.add(dt.ta); ters.add(dt.tb); }
    rooms.forEach((id, k) => { if (first[k] !== k) return; const o = ty.rooms.get(id); if (!o || o.type !== use[k]) map.set(id, { type: use[k], up: rule === 'route' && route[k].up }); else if (rule === 'route') map.set(id, { type: use[k], up: route[k].up }); });
    return { map, counts: cnt(use), v164: cnt(a), route: cnt(b), v164Raw: cnt(v164), routeRaw: cnt(route.map((x) => x.type)), types: use, routeVisit: route.map((x) => x.type), terraces: [...ters].sort((x, y) => x - y), relabeled: rooms.filter((id, k) => (rule === 'route' ? route[k].type : v164[k]) === T.DIORAMA && use[k] === T.ASCENSION).length };
  };
  /* a copy of the classification where the chain rooms take the types of the rule in force (the rings of Cake, the Ascension walls, the tint and the Diorama outline of the chain view read it; E.roomTypes.classify itself is unchanged) */
  T.overrideTypes = function (ty, map, RL) {
    const rooms = new Map(); for (const [id, o] of ty.rooms) rooms.set(id, map.has(id) ? Object.assign({}, o, { type: map.get(id).type, linkList: o.linkList || [] }) : o);
    const type = Uint8Array.from(ty.type); for (let i = 0; i < RL.room.length; i++) { const r = RL.room[i]; if (r > 0 && map.has(r)) type[i] = map.get(r).type; }
    return Object.assign({}, ty, { rooms, type });
  };
  /* the GATE faces of a chain: bit b of tile i = its face b (N E S W) is an open border (not a blocking one) between two consecutive pieces of a chain sequence (`seqs`: arrays of piece ids, stake first). Returns a Uint8Array with `.count` (faces counted once). */
  T.chainGateBits = function (S, P, seqs) {
    const n = S.n, W = S.W, H = S.H, map = S.roomMap, vd = S.void, pcs = T.pieces(S, P), nodeOf = P.chainNodes === 'room' ? (i) => map[i] : (i) => pcs.id[i], OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const pairs = new Set(); for (const sq of seqs || []) for (let k = 0; k + 1 < sq.length; k++) { const a = Math.min(sq[k], sq[k + 1]), b = Math.max(sq[k], sq[k + 1]); if (a !== b) pairs.add(a * 100000 + b); }
    const gate = new Uint8Array(n); gate.count = 0;
    for (let i = 0; i < n; i++) {
      const r = map[i]; if (r <= 0 || (vd && vd[i])) continue; const x = i % W, y = (i / W) | 0;
      for (let b = 0; b < 4; b++) {
        const nx = x + OFF[b][0], ny = y + OFF[b][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx, r2 = map[j]; if (r2 <= 0 || r2 === r || (vd && vd[j])) continue; const na = nodeOf(i), nbb = nodeOf(j); if (!(na > 0) || !(nbb > 0)) continue;
        if (S.roomKind[i * 4 + b] === 1 || !pairs.has(Math.min(na, nbb) * 100000 + Math.max(na, nbb))) continue; // blocking borders are walls, not gates; only consecutive chain rooms
        gate[i] |= 1 << b; if (i < j) gate.count++;
      }
    }
    return gate;
  };
  /* CHAIN VIEW (DAC v2, docs/crystallizers/02-room-types/README.md D23; `P.chainIds` = the ids of the rooms the route(s) from the stake to the objective(s) cross; absent = nothing here runs, the shape is the one of before):
     a VISUAL pass after the Cake rings and the Ascension walls (so the rings exist when it runs). Every land tile outside the chain rooms is moved to a level of its own, just under the lowest level (`meta.grey`: a neutral grey, no type tint), i.e. flattened;
     the void stays void. The ring tiles (S.ringTile) of the Cake links of the CHAIN rooms are never flattened, even where they fall outside the chain (Cake v2 builds Up rings in the airspace of other rooms). Walking, the regions, the route and the room
     types do not change: the caller builds the walking graph BEFORE this runs (the ramps outside the chain are dropped from S.stairs, which the graph reads). Ascension wall faces with no chain room on either side are dropped.
     GATE faces: the open borders (a valid transition, used or not) between two rooms that are consecutive in a chain sequence (`seqs`, arrays of room ids stake first) -> S.gateBits (bit b of a tile = its face b, N E S W), drawn by the Display toggle `gateMarks`. */
  T.chainFlatten = function (S, P, RL, ids, seqs) {
    const n = S.n, W = S.W, H = S.H, fw = S.mapW, chain = new Set(ids), map = S.roomMap, vd = S.void;
    const mapOf = (i) => ((((i / W) | 0) + S.oy) * fw + (i % W) + S.ox), ring = S.ringTile, claim = S.cake && S.cake.claim;
    const info = { rooms: ids.length, tiles: 0, kept: 0, chainRingTiles: 0, ringOutside: 0, ringOffChainLinks: 0, stairsDropped: 0, wallsDropped: 0, gateFaces: 0 };
    const grey = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (vd && vd[i]) continue;
      const ringOfChain = !!(ring && ring[i] && claim && (() => { const c = claim.get(mapOf(i)); return c && chain.has(c.link.room); })());
      if (ringOfChain) { info.chainRingTiles++; if (!chain.has(map[i])) info.ringOutside++; }
      if (chain.has(map[i]) || ringOfChain) { info.kept++; continue; }
      if (ring && ring[i]) info.ringOffChainLinks++;
      grey[i] = 1; info.tiles++;
    }
    if (info.tiles) { // the grey level: just under the lowest one, so the flattened ground is the lowest ground
      S.levelH.unshift(S.levelH[0] - 0.002); S.levelMeta.unshift({ ter: 0, sub: 0, bridge: false, grey: true });
      for (let i = 0; i < n; i++) S.fine[i] = grey[i] ? 0 : S.fine[i] + 1;
      for (const rec of S.stairs || []) if (rec.level !== undefined) rec.level++;
      S.maxFine = S.levelH.length - 1;
      S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd || !vd[i]) S.byLevel[S.fine[i]].push(i);
      if (vd) { S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1; }
      if (S.roomType) for (let i = 0; i < n; i++) if (grey[i]) S.roomType[i] = 0; // no type tint on the grey ground
      if (S.nowalk) for (let i = 0; i < n; i++) if (grey[i]) S.nowalk[i] = 0;
      if (S.roomBits) { S.roomBits = Uint8Array.from(S.roomBits); if (S.roomBitsDio) S.roomBitsDio = Uint8Array.from(S.roomBitsDio); if (S.dioBits) S.dioBits = Uint8Array.from(S.dioBits); S.roomKind = Uint8Array.from(S.roomKind); // no room border lines on the grey ground (the faces of a chain tile toward it stay)
        for (let i = 0; i < n; i++) if (grey[i]) { S.roomBits[i] = 0; if (S.roomBitsDio) S.roomBitsDio[i] = 0; if (S.dioBits) S.dioBits[i] = 0; for (let b = 0; b < 4; b++) S.roomKind[i * 4 + b] = 0; } }
    }
    S.chainGrey = grey;
    if (S.stairs) { const before = S.stairs.length; S.stairs = S.stairs.filter((r) => ![...r.bottom, ...r.top, ...r.steps.flatMap((x) => x.tiles)].some((t) => grey[t])); info.stairsDropped = before - S.stairs.length; }
    if (S.ascWalls && S.ascWalls.faces) { const keep = S.ascWalls.faces.filter((f) => chain.has(map[f.i]) || chain.has(map[f.j])); info.wallsDropped = S.ascWalls.faces.length - keep.length; S.ascWalls = Object.assign({}, S.ascWalls, { faces: keep }); }
    const pcs = T.pieces(S, P), nodeOf = P.chainNodes === 'room' ? (i) => map[i] : (i) => pcs.id[i], OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // the chain is a sequence of PIECES (nodes of T.roomGraph); gates and blocked faces are the faces between those pieces
    const gate = T.chainGateBits(S, P, seqs); info.gateFaces = gate.count;
    const bl = new Set((P.chainBlocked || []).map(([a, b]) => rkey(a, b))), blk = new Uint8Array(n); info.blockedFaces = 0;
    if (bl.size) for (let i = 0; i < n; i++) { const r = map[i]; if (r <= 0 || (vd && vd[i])) continue; const x = i % W, y = (i / W) | 0;
      for (let b = 0; b < 4; b++) { const nx = x + OFF[b][0], ny = y + OFF[b][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx, r2 = map[j]; if (r2 <= 0 || r2 === r || (vd && vd[j])) continue;
        const na = nodeOf(i), nbb = nodeOf(j); if (!(na > 0) || !(nbb > 0) || !bl.has(rkey(na, nbb)) || !(chain.has(r) || chain.has(r2)) || S.roomKind[i * 4 + b] === 1 || (S.roomKind[i * 4 + b] === 0 && grey[i])) continue; blk[i] |= 1 << b; if (i < j) info.blockedFaces++; } }
    S.blockBits = blk; S.gateBits = gate; S.chain = info; return info;
  };
  /* ASCENSION WALLS (user's decision, Zelda: A Link Between Worlds; `P.ascWalls`, off by default): a thin wall on every room-border face WITHOUT a transition (a face that blocks: S.roomKind 1) that has an Ascension room on at least one side.
     Never on an open transition (the doors stay open), never on a face of a ramp tile (S.carved), never toward void; only runs of 3 faces or more (consecutive faces on the same line). One face = one wall, tile-exact. The base is the
     higher of the two tiles; the height is ABSOLUTE (wallH 0.7; the low piece for the cut, lowH 0.15) and does not scale with the terrace height or with Pocket height. Returns { faces: [{ i, j, dir (0 = E face of i, 1 = S face), x, y,
     ai, aj (that side is an Ascension room), hb, run }], runs, info } (window tiles). The CUT toward the camera is computed at render time (E.ascWallLow). */
  T.ASC_H = 1.5; T.ASC_LOW = 0.15; T.ASC_T = 0.35; T.ASC_MIN_RUN = 3; T.ASC_GATE_MAX = 5;
  T.ascWalls = function (S, P, RL, ty) {
    const W = S.W, H = S.H, n = S.n, kind = S.roomKind, map = S.roomMap, cand = [], openF = [], isAsc = (r) => { const o = ty.rooms.get(r); return !!o && o.type === T.ASCENSION; }, gateN = Math.max(0, Math.min(T.ASC_GATE_MAX, P.ascGate | 0)); // gateN > 0 (`P.ascGate`, D28): the open transition faces of Ascension rooms are collected too
    for (let i = 0; i < n; i++) {
      if (S.void && S.void[i]) continue; const ri = map[i]; if (ri <= 0) continue; const x = i % W, y = (i / W) | 0;
      for (const [b, dx, dy] of [[1, 1, 0], [2, 0, 1]]) {
        const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue; const j = ny * W + nx; if (S.void && S.void[j]) continue; const rj = map[j]; if (rj <= 0 || rj === ri) continue; const kd = kind[i * 4 + b];
        if (kd !== 1 && !(gateN > 0 && (kd === 0 || kd === 2))) continue;
        const ai = isAsc(ri), aj = isAsc(rj); if (!ai && !aj) continue; if (S.carved && (S.carved[i] || S.carved[j])) continue;
        const f = { i, j, dir: b === 1 ? 0 : 1, x, y, ai, aj, rid: ai ? ri : rj, hb: Math.max(S.levelH[S.fine[i]], S.levelH[S.fine[j]]) };
        if (kd === 1) cand.push(f); else openF.push(Object.assign(f, { kd, ri, rj }));
      }
    }
    // GATE WIDTH (D28, `P.ascGate` N = 1..5; 0 = nothing here runs): the open transition faces of an Ascension room are grouped (same room pair, joined by a shared corner); in each group only a GATE of N faces stays open around every CROSSING and the other faces become blocking faces (walls).
    // CROSSINGS = the union of (a) the used transition faces (S.roomKind 2: the spanning-tree paths), (b) every face crossed by a drawn tile route (P.ascRouteFaces: map-coordinate keys of the routes of the objectives to the stake, set by the UI from the finished shape) and (c) in the chain view the gate faces of the chain (T.chainGateBits);
    // a group with no crossing keeps the N faces around the face nearest its centroid. Faces of ramp tiles stay excluded (a ramp is a door that always stays open). Walking, the tree and the routes do not change. info.gateOk: no crossing face is a wall.
    let gateInfo = null;
    if (gateN > 0) {
      const fw = S.mapW, mi = (t) => (((t / W) | 0) + S.oy) * fw + (t % W) + S.ox, fkey = (f) => { const a = mi(f.i), b = mi(f.j); return Math.min(a, b) + '_' + Math.max(a, b); };
      const rf = P.ascRouteFaces || null, gbits = P.chainIds && P.chainSeqs ? T.chainGateBits(S, P, P.chainSeqs) : null;
      const isX = (f) => f.kd === 2 || (rf && rf.has(fkey(f))) || (gbits && ((gbits[f.i] >> (f.dir === 0 ? 1 : 2)) & 1));
      const vo = (f) => (f.dir === 0 ? [[f.x + 1, f.y], [f.x + 1, f.y + 1]] : [[f.x, f.y + 1], [f.x + 1, f.y + 1]]);
      const par = openF.map((_, k) => k), find = (q) => { while (par[q] !== q) { par[q] = par[par[q]]; q = par[q]; } return q; }, at = new Map();
      openF.forEach((f, k) => { const rk = Math.min(f.ri, f.rj) + '_' + Math.max(f.ri, f.rj); for (const [vx, vy] of vo(f)) { const key = rk + '|' + vx + ',' + vy, o = at.get(key); if (o === undefined) at.set(key, k); else par[find(k)] = find(o); } });
      const groups = new Map(); openF.forEach((f, k) => { const r = find(k); let g = groups.get(r); if (!g) groups.set(r, g = []); g.push(k); });
      let nX = 0, nOpen = 0, nAdded = 0, nNoX = 0; const added = [];
      for (const g of groups.values()) {
        const adjV = new Map(); for (const k of g) for (const [vx, vy] of vo(openF[k])) { const key = vx + ',' + vy; (adjV.get(key) || adjV.set(key, []).get(key)).push(k); }
        const keep = new Set(), win = (k0) => { const seen = new Set([k0]), q = [k0], got = []; for (let h = 0; h < q.length && got.length < gateN; h++) { got.push(q[h]); const nbs = new Set(); for (const [vx, vy] of vo(openF[q[h]])) for (const o of adjV.get(vx + ',' + vy)) if (!seen.has(o)) nbs.add(o); for (const o of [...nbs].sort((p2, q2) => p2 - q2)) { seen.add(o); q.push(o); } } for (const k of got) keep.add(k); };
        const xs = g.filter((k) => isX(openF[k])); nX += xs.length;
        if (xs.length) for (const k of xs) { keep.add(k); win(k); }
        else { nNoX++; let cx = 0, cy = 0; for (const k of g) { cx += openF[k].x; cy += openF[k].y; } cx /= g.length; cy /= g.length; let best = g[0], bd = 1e9; for (const k of g) { const d = Math.hypot(openF[k].x - cx, openF[k].y - cy); if (d < bd - 1e-9) { bd = d; best = k; } } win(best); }
        for (const k of g) if (keep.has(k)) nOpen++; else { const f = openF[k]; cand.push({ i: f.i, j: f.j, dir: f.dir, x: f.x, y: f.y, ai: f.ai, aj: f.aj, rid: f.rid, hb: f.hb, gate: true }); added.push(k); nAdded++; }
      }
      gateInfo = { groups: groups.size, crossings: nX, groupsWithoutCrossing: nNoX, open: nOpen, added: nAdded, gateOk: added.every((k) => !isX(openF[k])), routeFaces: rf ? rf.size : 0 };
    }
    // CHAINS: faces connected by a shared corner (vertex) along the border, following the turns (a diagonal border is a staircase of faces in two directions); a chain of fewer than 3 faces is dropped
    const vOf = (f) => (f.dir === 0 ? [[f.x + 1, f.y], [f.x + 1, f.y + 1]] : [[f.x, f.y + 1], [f.x + 1, f.y + 1]]), par = cand.map((_, k) => k), find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, at = new Map();
    cand.forEach((f, k) => { for (const [vx, vy] of vOf(f)) { const key = vx + ',' + vy, o = at.get(key); if (o === undefined) at.set(key, k); else par[find(k)] = find(o); } });
    const size = new Map(); cand.forEach((_, k) => { const r = find(k); size.set(r, (size.get(r) || 0) + 1); });
    const faces = [], ids = new Map(), runs = [], deg = new Map();
    cand.forEach((f, k) => { const r = find(k); if (size.get(r) < T.ASC_MIN_RUN) return; if (!ids.has(r)) { ids.set(r, runs.length); runs.push({ id: runs.length, n: 0 }); } f.run = ids.get(r); runs[f.run].n++; faces.push(f); for (const [vx, vy] of vOf(f)) { const key = vx + ',' + vy; deg.set(key, (deg.get(key) || 0) + 1); } });
    for (const f of faces) { const [v0, v1] = vOf(f); f.e0 = deg.get(v0[0] + ',' + v0[1]) > 1; f.e1 = deg.get(v1[0] + ',' + v1[1]) > 1; } // an end is extended by half the thickness where another wall meets it (the corner is filled)
    const height = P.ascHeight === undefined ? T.ASC_H : P.ascHeight, lowH = Math.min(P.ascCut === undefined ? T.ASC_LOW : P.ascCut, height); // `lowH` (D28, `P.ascCut`): the height of the low walls of the cut toward the camera (default 0.15 = ASC_LOW)
    return { faces, runs, height, lowH, gate: gateN, info: Object.assign({ candidates: cand.length, faces: faces.length, runs: runs.length, dropped: cand.length - faces.length }, gateInfo ? { gateInfo } : {}) };
  };
  /* the footprint of the wall of a face: [x0, x1, y0, y1] (thickness ASC_T centred on the edge, the ends extended where another face meets it) */
  T.ascBox = function (w) {
    const t = T.ASC_T / 2, a0 = w.e0 ? t : 0, a1 = w.e1 ? t : 0;
    return w.dir === 0 ? [w.x + 1 - t, w.x + 1 + t, w.y - a0, w.y + 1 + a1] : [w.x - a0, w.x + 1 + a1, w.y + 1 - t, w.y + 1 + t];
  };
  /* the cut: a face whose wall would stand between the camera and the inside of an Ascension room (the outward normal of that room faces the camera) is drawn low. Both sides count for a face between two Ascension rooms. */
  T.ascWallLow = function (w, cam) { const dx = w.dir === 0 ? 1 : 0, dy = w.dir === 0 ? 0 : 1, mx = w.dir === 0 ? w.x + 1 : w.x + 0.5, my = w.dir === 0 ? w.y + 0.5 : w.y + 1; return (w.ai && cam.nrm(dx, dy, mx, my)[1] > 0.001) || (w.aj && cam.nrm(-dx, -dy, mx, my)[1] > 0.001); }; // the face position only matters to the perspective camera
  /* DIORAMA IN THE CHAIN VIEW (DAC v2 PR C, D30; `P.dioChain` 'off' (default: nothing here runs) | 'm2' | 'm1', only in the chain view and only for the Dioramas of the chain; the Pocket view of D13 is a different thing and is untouched).
     The Diorama FOOTPRINT (the room's tiles, same shape, internal relative heights kept) moves into the free grey space, a decorative POCKET grows around it and the route keeps passing on a TRANSIT LANDING left at the old place; the footprint is reached by a BRIDGE (width 3).
     Cake and Ascension never move. PLAN (`dioPlan`, on the whole shape BEFORE the chain is flattened): eligibility = free perimeter >= 50 % (the share of the border edges that face tiles of no chain room; off-chain rooms, their non-walkable tiles and void are free),
     a minimum shift of at most `P.dioCap` (default T.DIO_CAP = 30 tiles; user's decision 2026-10-23: room 6 of Chain 5 has a bridge that crosses 10 chain tiles at its minimum shift, so the cap is 30, not 40) and a straight bridge that crosses no chain room, no earlier pocket; a Diorama that fails is drawn as Ascension
     in the chain view (labels only: `classify` is unchanged). LANDING (user's variant (b): the goals inside a Diorama move with the footprint): the lane of the route through the old footprint between its doors (a single door = a stub), dilated by 2 and clipped to the room; it keeps its heights and is colour-coded as transit.
     M2: translate the footprint by the SMALLEST shift (16 directions, step 2) whose tiles lie on no other chain room, no landing and no earlier pocket and fall inside the window; pocket = the 3 x area free tiles nearest the footprint. M1: region R = (old footprint minus landing) + the 3 x area free tiles nearest to it; the footprint is translated to the centroid of R and clipped to R; pocket = R minus footprint.
     Height (Auto): +2 terraces if the room's median terrace is >= the median of its chain neighbours, else -2 (terH units). Pocket: Low = water at min(footprint min - 0.5 terH, ground - 0.5 terH); High = stepped flanks from the footprint top down to the ground, the flank toward the camera capped at 1/3 of that height. Returns a plan of window indices (valid for a rebuild of the same window). */
  T.DIO_CAP = 30; T.DIO_GAP = 4; // D31: the gap between the footprint and the landing, as a centre (Chebyshev) distance (4 = 3 empty tiles)
  const rasterLine = (x0, y0, x1, y1) => { const out = [[x0, y0]], dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let x = x0, y = y0, ix = 0, iy = 0; // a 4-connected line (one tile step at a time)
    while (ix < dx || iy < dy) { if (iy >= dy || (ix < dx && (0.5 + ix) / dx < (0.5 + iy) / dy)) { x += sx; ix++; } else { y += sy; iy++; } out.push([x, y]); } return out; };
  const walk0S = (S, i) => !S.block[i] && S.region && S.region[i] >= 0;
  T.dioPlan = function (S, P, ctx) {
    if (P.dioChain === 'corr') return T.dioPlanCorr(S, P, ctx); // DAC v2 PR D (D32): the corridor planner; the code below is the D31 planner (Off / M1 / M2), untouched
    const PTH = P.dioPerim != null ? P.dioPerim : 50; // free-perimeter threshold (%): the 50 % rule; the override is for the eligibility report only, not in the UI or the manifest
    const n = S.n, W = S.W, H = S.H, map = S.roomMap, vd = S.void, CR = new Set(ctx.chainIds), pc = T.pieces(S, P), nbf = E.walkGraph(S, P), pieces = ctx.pieces, goals = ctx.goals, mode = P.dioChain === 'm1' ? 'm1' : 'm2', cap = P.dioCap === undefined ? T.DIO_CAP : P.dioCap, typeOf = (r) => (P.dioForceRooms && P.dioForceRooms.includes(r) ? T.DIORAMA : ctx.typeOf(r)); // `P.dioForceRooms`: TEST-ONLY (not in the pack or the UI): treat these rooms as Dioramas and skip the free-perimeter rule
    const xy = (i) => [i % W, (i / W) | 0], idx = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x), land = (i) => !(vd && vd[i]), walk0 = (i) => !S.block[i] && S.region && S.region[i] >= 0, N4o = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const gp = goals.map((t) => (t >= 0 ? pc.id[t] : 0)), reach = pieces.map(() => []); { let gi = 0; for (let k = 1; k < pieces.length; k++) if (gi + 1 < gp.length && pieces[k] === gp[gi + 1]) { gi++; reach[k].push(gi); } }
    const bfsPath = (starts, goalSet, p) => { const prev = new Map(), q = []; for (const s of starts) { prev.set(s, -1); q.push(s); } let hit = -1; for (let h = 0; h < q.length && hit < 0; h++) { const u = q[h]; if (goalSet.has(u)) { hit = u; break; } for (const v of nbf(u).slice()) if (!prev.has(v) && pc.id[v] === p) { prev.set(v, u); q.push(v); } } if (hit < 0) return null; const path = []; for (let k = hit; k !== -1; k = prev.get(k)) path.push(k); return path; };
    const adjTo = (p, other) => { const s = new Set(); for (let i = 0; i < n; i++) if (pc.id[i] === p) for (const j of nbf(i).slice()) if (pc.id[j] === other) { s.add(i); break; } return s; };
    const dil = (set, r, within) => { const out = new Set(); for (const i of set) { const [x, y] = xy(i); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const j = idx(x + dx, y + dy); if (j >= 0 && within(j)) out.add(j); } } return out; };
    const laneOf = (r) => { const res = new Set(); let bad = false; // the doors of every visit of the room: the lane between entry and exit (a first / last room: the single door), the goal inside the room is NOT part of it (it moves with the footprint)
      pieces.forEach((p, k) => { if (pc.room[p] !== r) return; const first = k === 0, last = k === pieces.length - 1; if (first && last) { bad = true; return; }
        const A = first ? adjTo(p, pieces[k + 1]) : adjTo(p, pieces[k - 1]), B = last || first ? A : adjTo(p, pieces[k + 1]), path = bfsPath([...A], B, p); if (!path) { bad = true; return; } for (const t of path) res.add(t); });
      return { tiles: res, bad }; };
    const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] : 0; };
    const roomsSeq = pieces.map((p) => pc.room[p]), order = [...new Set(roomsSeq)], items = [], demoted = [], occ = new Set(), hov = new Map();
    const tmed = new Map(); for (const r of order) { const ts = []; for (let i = 0; i < n; i++) if (map[i] === r && land(i)) ts.push(S.ter[i]); tmed.set(r, median(ts)); }
    const centroid = (arr) => { let sx = 0, sy = 0; for (const i of arr) { const [x, y] = xy(i); sx += x; sy += y; } return [sx / arr.length, sy / arr.length]; };
    for (const r of order) {
      if (typeOf(r) !== T.DIORAMA) continue;
      const tiles = [], inT = new Uint8Array(n); for (let i = 0; i < n; i++) if (map[i] === r && land(i)) { tiles.push(i); inT[i] = 1; } const area = tiles.length;
      let edges = 0, free = 0; for (const i of tiles) { const [x, y] = xy(i); for (const [dx, dy] of N4o) { const j = idx(x + dx, y + dy); if (j >= 0 && inT[j]) continue; edges++; if (j < 0 || !land(j) || map[j] <= 0 || !CR.has(map[j])) free++; } }
      const perim = edges ? 100 * free / edges : 0, it = { room: r, tiles: area, perim: +perim.toFixed(1), eligible: false, why: '', mode };
      const nbRooms = []; roomsSeq.forEach((q, k) => { if (q !== r) return; if (k > 0 && roomsSeq[k - 1] !== r) nbRooms.push(roomsSeq[k - 1]); if (k + 1 < roomsSeq.length && roomsSeq[k + 1] !== r) nbRooms.push(roomsSeq[k + 1]); });
      it.high = !nbRooms.length || tmed.get(r) >= median(nbRooms.map((q) => tmed.get(q))); it.goals = goals.map((t, g) => (t >= 0 && inT[t] ? g : -1)).filter((g) => g >= 0);
      const L = laneOf(r); let landing = L.tiles; if (L.bad || !landing.size) { it.why = 'no door lane (the room is the whole chain or has no walkable door)'; items.push(it); demoted.push({ room: r, why: it.why }); continue; }
      const land2 = dil(landing, 2, (j) => inT[j]); for (const st of S.stairs || []) { const ts = st.bottom.concat(st.top, ...st.steps.map((x) => x.tiles)); if (ts.some((t) => land2.has(t))) for (const t of ts) if (inT[t]) land2.add(t); } // a ramp that touches the landing stays whole
      it.landing = [...land2];
      const free_ = (j) => j >= 0 && (!CR.has(map[j]) || (map[j] === r && !land2.has(j))) && !occ.has(j); // free ground for the bridge sides and the pocket: no chain room, but the OWN old footprint (minus the landing) is flattened to ground and is free too
      // GAP (D31, user's rule): 3 EMPTY tiles between the footprint and the landing = a centre (Chebyshev) distance >= T.DIO_GAP (4); `dL` = the Chebyshev distance field from the landing (8-neighbour BFS, up to 64)
      const GAP = P.dioGap !== undefined ? P.dioGap : T.DIO_GAP, dL = new Int16Array(n).fill(-1); { const q = [...land2]; for (const t of q) dL[t] = 0; for (let h = 0; h < q.length; h++) { const t = q[h], [x, y] = xy(t); if (dL[t] >= 64) continue; for (const [dx, dy] of N8) { const j = idx(x + dx, y + dy); if (j >= 0 && dL[j] < 0) { dL[j] = dL[t] + 1; q.push(j); } } } }
      const gapOf = (dArr) => { let c = 99; for (const j of dArr) if (dL[j] >= 0 && dL[j] < c) c = dL[j]; return c; };
      const gapEuclid = (dArr) => { let e = 1e9; const L = [...land2].map((l) => [l % W, (l / W) | 0]); for (const j of dArr) { const x = j % W, y = (j / W) | 0; if (dL[j] > 12) continue; for (const [lx, ly] of L) { const d = Math.hypot(lx - x, ly - y); if (d < e) e = d; } } return +e.toFixed(2); };
      // M2: the VALID shifts (16 directions, step 2, within the cap) in order of distance; the footprint keeps the gap (ties by direction order). The smallest one is taken, or, with the visibility criterion, the smallest whose footprint is >= 95 % visible from the FIXED reference camera (Cam 1)
      const useVis = P.dioVis !== undefined ? P.dioVis : T.DIO_VIS, cands = []; let sh = null;
      for (let d = 2; d <= 160 && (cands.length === 0 || (useVis && d <= cap && cands.length < 24)); d += 2) for (let a = 0; a < 16; a++) { const dx = Math.round(d * Math.cos(a * Math.PI / 8)), dy = Math.round(d * Math.sin(a * Math.PI / 8)); let ok = true, out = 0; const dst = [], src = []; // >= 90 % of the tiles inside the window (the rest is clipped), none on another chain room, the landing or an earlier pocket
        for (let k = 0; k < area; k++) { const [x, y] = xy(tiles[k]), j = idx(x + dx, y + dy); if (j < 0) { out++; continue; } if (land2.has(j) || (CR.has(map[j]) && !inT[j]) || occ.has(j)) { ok = false; break; } dst.push(j); src.push(tiles[k]); }
        if (ok && out <= 0.1 * area && it.goals.every((g) => goals[g] < 0 || !inT[goals[g]] || src.includes(goals[g])) && gapOf(dst) >= GAP) { cands.push({ dx, dy, dst, src, d: Math.hypot(dx, dy) }); if (!useVis) break; } }
      sh = cands.length ? cands[0] : null;
      it.shiftM2 = sh ? +sh.d.toFixed(1) : null;
      const wantPiece = (() => { const g = it.goals.find((q) => goals[q] >= 0 && inT[goals[q]]); if (g !== undefined) return pc.id[goals[g]]; const cnt = new Map(); for (const t of land2) if (pc.id[t] > 0) cnt.set(pc.id[t], (cnt.get(pc.id[t]) || 0) + 1); let bp = 0, bc = -1; for (const [p, c] of cnt) if (c > bc) { bc = c; bp = p; } return bp; })(); // the piece the bridge serves: the piece of the goal inside the Diorama, else the piece with most landing tiles
      const bridgeOf = (dstSet, dstArr, srcArr) => { // the straight bridge: the nearest pair (a walkable landing tile, a walkable footprint tile), a 4-connected line, cut at the first footprint tile
        let bd = 1e18, bl = -1, bf = -1; const lt = [...land2].filter((t) => walk0(t) && pc.id[t] === wantPiece), srcOf = new Map(dstArr.map((j, k) => [j, srcArr[k]])); const ft = dstArr.filter((j) => walk0(srcOf.get(j)) && pc.id[srcOf.get(j)] === wantPiece); // both ends on the piece the route uses (see wantPiece), so the footprint is reached door to door
        if (!lt.length || !ft.length) return null; if (!lt.length || !ft.length) return null;
        for (const a2 of lt) { const [ax, ay] = xy(a2); for (const b2 of ft) { const [bx, by] = xy(b2); const dd = (ax - bx) * (ax - bx) + (ay - by) * (ay - by); if (dd < bd) { bd = dd; bl = a2; bf = b2; } } }
        const [ax, ay] = xy(bl), [bx, by] = xy(bf), line = rasterLine(ax, ay, bx, by), inner = []; let end = bf;
        for (let q = 1; q < line.length; q++) { const j = idx(line[q][0], line[q][1]); if (dstSet.has(j)) { end = j; break; } inner.push(j); }
        let xChain = 0, xOcc = 0, xVoid = 0; for (const j of inner) { if (CR.has(map[j]) && !(map[j] === r && !land2.has(j))) xChain++; if (occ.has(j)) xOcc++; if (!land(j)) xVoid++; }
        // width 3: the lateral neighbours of the centre line that are free ground (never a chain room, the footprint or an earlier pocket)
        const lat = new Set(), cs = new Set(inner); for (let q = 0; q < inner.length; q++) { const [x, y] = xy(inner[q]), nxt = q + 1 < inner.length ? xy(inner[q + 1]) : xy(end), prv = q ? xy(inner[q - 1]) : [ax, ay], tx = nxt[0] - prv[0], ty = nxt[1] - prv[1]; const px = Math.abs(ty) >= Math.abs(tx) ? 1 : 0, py = px ? 0 : 1;
          for (const s of [-1, 1]) { const j = idx(x + s * px, y + s * py); if (j >= 0 && free_(j) && !dstSet.has(j) && !cs.has(j) && !land2.has(j)) lat.add(j); } }
        return { from: bl, to: end, inner, lat: [...lat], xChain, xOcc, xVoid, length: +Math.hypot(xy(end)[0] - ax, xy(end)[1] - ay).toFixed(1) }; };
      const ringsOf = (from, set) => { const dist = new Int16Array(n).fill(-1), q = [...from]; for (const t of q) dist[t] = 0; for (let h = 0; h < q.length; h++) { const t = q[h]; if (dist[t] >= 64) continue; const [x, y] = xy(t); for (const [dx, dy] of N8) { const j = idx(x + dx, y + dy); if (j >= 0 && dist[j] < 0) { dist[j] = dist[t] + 1; q.push(j); } } } return set.map((j) => (dist[j] > 0 ? dist[j] : 1)); }; // the Chebyshev distance of a pocket tile to the footprint (over the whole window)
      const near = (srcArr, want, avoid) => { const q = [...srcArr], dist = new Map(srcArr.map((i) => [i, 0])), got = []; for (let h = 0; h < q.length && got.length < want; h++) { const [x, y] = xy(q[h]); for (const [dx, dy] of N8) { const j = idx(x + dx, y + dy); if (dist.has(j) || !free_(j) || avoid.has(j)) continue; dist.set(j, dist.get(q[h]) + 1); q.push(j); got.push(j); if (got.length >= want) break; } } return { tiles: got, dist }; };
      const buildM2 = (c) => { c = c || sh; if (!c) return null; const dstSet = new Set(c.dst), geo = { dst: c.dst, src: c.src, shift: [c.dx, c.dy], bridge: bridgeOf(dstSet, c.dst, c.src), via: 'm2' }; if (geo.bridge) { const avoid = new Set([...dstSet, ...geo.bridge.inner, ...geo.bridge.lat]); geo.pocket = near(c.dst, 3 * area, avoid).tiles; } return addMargin(geo); };
      const buildM1 = () => { const rest = tiles.filter((i) => !land2.has(i)), pk = near(rest, 3 * area, new Set()), Rs = new Set([...rest, ...pk.tiles]), cR = centroid([...Rs]), cT = centroid(tiles), dx = Math.round(cR[0] - cT[0]), dy = Math.round(cR[1] - cT[1]); const dst = [], src = []; tiles.forEach((i) => { const [x, y] = xy(i), j = idx(x + dx, y + dy); if (j >= 0 && Rs.has(j)) { dst.push(j); src.push(i); } });
        const geo = { dst, src, shift: [dx, dy], kept: +(100 * dst.length / area).toFixed(1), via: 'm1' }; if (!dst.length || !it.goals.every((g) => goals[g] < 0 || !inT[goals[g]] || src.includes(goals[g]))) return geo; const dstSet = new Set(dst); geo.bridge = bridgeOf(dstSet, dst, src); if (geo.bridge) { const avoid = new Set([...dstSet, ...geo.bridge.inner, ...geo.bridge.lat]); geo.pocket = [...Rs].filter((j) => !avoid.has(j) && !land2.has(j)); } return addMargin(geo); };
      const addMargin = (geo) => { // the pocket FRAMES the connecting paths (D31): free tiles within 2 of the bridge are always part of the pocket (priority corridor), whatever the 3 x area cut
        if (!geo || !geo.bridge || !geo.pocket) return geo; const have = new Set(geo.pocket), skip = new Set([...geo.dst, ...geo.bridge.inner, ...geo.bridge.lat, ...land2]); for (const b of [...geo.bridge.inner, ...geo.bridge.lat, geo.bridge.from, geo.bridge.to]) { const [bx, by] = xy(b); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = idx(bx + dx, by + dy); if (j >= 0 && !have.has(j) && !skip.has(j) && free_(j)) { have.add(j); geo.pocket.push(j); } } } return geo; };
      const whyNot = (geo) => { // the reason a geometry is not eligible ('' = eligible)
        if (perim < PTH && !(P.dioForceRooms && P.dioForceRooms.includes(r))) return `free perimeter ${perim.toFixed(0)} % < ${PTH} %`; if (!geo || !geo.dst || !geo.dst.length) return geo === null ? 'no free place for the footprint' : 'the footprint is clipped away';
        const sd = Math.hypot(geo.shift[0], geo.shift[1]); if (sd > cap + 1e-9) return `${geo.via === 'm1' ? 'shift' : 'minimum shift'} ${sd.toFixed(1)} tiles > cap ${cap}`; const g = gapOf(geo.dst); if (g < GAP) return `gap ${g} < ${GAP} (a centre distance of ${GAP} = 3 empty tiles)`;
        const br = geo.bridge; if (!br) return 'no walkable bridge ends'; if (br.xChain || br.xOcc) return `the straight bridge crosses ${br.xChain ? br.xChain + ' chain-room tiles' : br.xOcc + ' tiles of an earlier pocket'}`; if (br.length < GAP) return `bridge ${br.length} < ${GAP}`; return ''; };
      // the visibility criterion: among the valid candidates (eligible geometry) the smallest shift whose real footprint (raised / lowered by its type, with its pocket and bridge) is >= 95 % visible from the reference camera; else the most visible one
      const visOf = (geo) => { const w = new Map(); const itx = { room: r, landing: it.landing, src: geo.src, dst: geo.dst, bridge: { from: geo.bridge.from, to: geo.bridge.to, inner: geo.bridge.inner, lat: geo.bridge.lat }, pocket: geo.pocket, pdist: ringsOf(geo.dst, geo.pocket) }; const fc = [geo.dst.reduce((a, j) => a + (j % W), 0) / geo.dst.length, geo.dst.reduce((a, j) => a + ((j / W) | 0), 0) / geo.dst.length];
        itx.rank = T.dioRank(S, P, r); itx.free = T.dioFreeSide(S, CR, fc[0], fc[1], new Set(geo.dst)); itx.type = T.dioType(itx.rank, itx.free, P.dioFree); const pf = T.dioProfile(S, P, itx); itx.dst.forEach((j, k) => w.set(j, pf.fpH[k])); for (const [j, h] of pf.bridgeH) w.set(j, h); itx.pocket.forEach((j, k) => w.set(j, pf.heights[k]));
        const ownOld = new Set(tiles.filter((t) => !land2.has(t))); const heightOf = (t) => (hov.has(t) ? hov.get(t) : w.has(t) ? w.get(t) : S.void && S.void[t] ? -Infinity : ownOld.has(t) || !CR.has(map[t]) ? pf.greyH : S.levelH[S.fine[t]]);
        return { vis: T.dioLOS(W, H, heightOf, itx.dst, itx.dst.map((j, k) => pf.fpH[k])), pf }; };
      if (useVis && mode === 'm2' && cands.length) { let best = null; for (const c of cands.slice(0, 24)) { if (c.d > cap + 1e-9) break; const g = buildM2(c); if (whyNot(g)) continue; const v = visOf(g); c.vis = v.vis; if (!best || v.vis > best.vis + 1e-9) best = c; if (v.vis >= T.DIO_VIS_MIN) { best = c; break; } } if (best) sh = best; }
      let geo, why;
      if (mode === 'm2') { geo = buildM2(); why = whyNot(geo); if (why && (perim >= PTH || (P.dioForceRooms && P.dioForceRooms.includes(r)))) { const g1 = buildM1(), w1 = whyNot(g1); it.m2why = why; if (!w1) { geo = g1; why = ''; } } } // M2 -> fallback M1 for this Diorama -> else Ascension
      else { geo = buildM1(); why = whyNot(geo); }
      if (geo && geo.bridge) geo.pdist = ringsOf(geo.dst, geo.pocket || []);
      if (geo && geo.dst && geo.dst.length) { const fc = [geo.dst.reduce((a, j) => a + (j % W), 0) / geo.dst.length, geo.dst.reduce((a, j) => a + ((j / W) | 0), 0) / geo.dst.length]; it.rank = T.dioRank(S, P, r); it.free = T.dioFreeSide(S, CR, fc[0], fc[1], new Set(geo.dst)); it.type = T.dioType(it.rank, it.free, P.dioFree); it.gapC = gapOf(geo.dst); it.gapE = gapEuclid(geo.dst); }
      it.via = geo ? geo.via : null; it.shift = geo ? +Math.hypot(geo.shift[0], geo.shift[1]).toFixed(1) : null; it.kept = geo && geo.kept !== undefined ? geo.kept : 100; const br = geo && geo.bridge; it.bridgeLen = br ? br.length : null; it.bridgeCross = br ? { chain: br.xChain, pocket: br.xOcc, void: br.xVoid } : null; it.why = why;
      if (it.why) { items.push(it); demoted.push({ room: r, why: it.why }); continue; }
      it.src = geo.src || tiles.slice(); it.dst = geo.dst; it.bridge = { from: br.from, to: br.to, inner: br.inner, lat: br.lat }; it.pocket = geo.pocket; it.pdist = geo.pdist; it.pocketWanted = 3 * area;
      it.prof = T.dioProfile(S, P, it); it.framing = T.dioFraming(S, it, CR);
      if (!it.prof.ok) { it.why = it.prof.why; items.push(it); demoted.push({ room: r, why: it.why }); continue; } // the pocket profile does not fit (slope cap): drawn as Ascension
      it.eligible = true; it.dst.forEach((j, k) => hov.set(j, it.prof.fpH[k])); for (const [j, h] of it.prof.bridgeH) hov.set(j, h); it.pocket.forEach((j, k) => hov.set(j, it.prof.heights[k]));
      for (const j of geo.dst) occ.add(j); for (const j of geo.pocket) occ.add(j); for (const j of br.inner) occ.add(j); for (const j of br.lat) occ.add(j);
      items.push(it);
    }
    return { n, mode, cap, goals, items, demoted: demoted.map((d) => d.room), why: demoted, eligible: items.filter((q) => q.eligible).map((q) => q.room) };
  };
  /* DIORAMA CORRIDOR PLANNER (DAC v2 PR D, D32; `P.dioChain === 'corr'`, opt-in: `T.dioPlan` delegates here and the Off / M2 / M1 paths are untouched). A moved Diorama is a STRUCTURE built from the doors the chain really uses, not a footprint with one bridge:
     LADDER per Diorama: (1) CORRIDOR: the doors of the room = door groups (a piece of the room x the neighbouring piece, over every visit of the chain); each group gets its OWN landing (the door tiles dilated by ring 0, then 1, then 2, the first ring that works; the landings of two groups of the same piece keep >= T.DIO_LAND_SEP apart)
     and ONE bridge to the footprint (a leaf has one group, a corridor two, a crossing three or more); the old footprint minus the landings is flattened. (2) LATERAL: the D31 lane landing and ONE bridge. (3) Ascension. The structure is the number of bridges BUILT.
     CANDIDATES: 16 directions, step 2, up to T.DIO_CORR_CAP; a candidate is discarded when the footprint touches a landing / another chain room / an earlier pocket, the gap (T.DIO_GAP, from every landing) is not kept, a goal inside would be clipped, or a bridge: crosses a chain room or an earlier pocket, is shorter than T.DIO_MIN_BRIDGE or longer than T.DIO_MAX_BRIDGE (EVERY bridge),
     starts on a landing tile that is not walk-connected to its own door, ends on a footprint tile that is not walkable on its piece (<= 4 margin tiles carved), or comes too close to another bridge of the same Diorama. TWO rules, BOTH enforced (user's decision, Gate 2): (1) AXIS separation: the Chebyshev distance between the centre-line tiles (landing end + inner tiles) of two bridges of one Diorama is >= T.DIO_BRIDGE_AXIS (3); (2) TILE-SET separation: the width-3 tile sets (centre line + side lanes, inner tiles only, never the landing or the footprint tiles)
     of two bridges do not overlap and no tile of one is a 4-neighbour of a tile of the other (for two PARALLEL bridges of width 3 the product of (1) and (2) is an axis separation >= 4). Both exist so that no walkable hop between two bridges can short-circuit the structure; the ORACLE (tools/test_diocorr.js) checks the result on the walk graph. PAIR: the NEAREST (landing tile, footprint tile) pair; when no candidate of the rung works, the same rung is tried again with the SHORTEST valid pair (never the first valid). The 50 % perimeter rule is not used. The pocket is the 3 x area free tiles nearest the footprint plus a margin of 2 around every bridge.
     Per Diorama: `step` ('leaf' | 'corridor' | 'lateral' | 'ascension'), `ring` (the landing ring used), `bridges[]` (`bridge` = the first one), `bridgeLens`, `structure` (bridges built), `report` (per attempt: tally of why candidates failed, `rej` = candidates rejected by the bridge separation / the maximum length). Test-only hooks (not in the pack or the UI): `P.dioMin`, `P.dioMax`, `P.dioCap`, `P.dioGap`, `P.dioLandSep`,
     `P.dioBridgeAdj === false` (tile-set rule off), `P.dioAxisSep` (axis rule; 0 = off), `P.dioMaxScope === 'single'` (the maximum applies only to a Diorama with ONE bridge: the Gate 2 probe), `P.dioPair === 'first'` (first valid pair instead of the shortest), `P.dioNoFallback`, `P.dioForceRooms`, `P.dioSkip` ('corridor' | 'lateral': that rung is skipped), `P.dioPerim` (the old 50 % free-perimeter rule, 0 = off), `P.dioEndAny` (a bridge ends at the first footprint tile, walkable or not), `P.dioForce`, `P.dioCimaThr`. */
  T.DIO_HITO_FAR = 7; T.DIO_HITO_H = 2.5; T.DIO_MIN_BRIDGE = 8; T.DIO_MAX_BRIDGE = 40; T.DIO_BRIDGE_AXIS = 3; T.DIO_CORR_CAP = 120; T.DIO_LAND_SEP = 3; T.DIO_RINGS = [0, 1, 2]; T.DIO_CIMA_ASC = 0.25;
  T.dioPlanCorr = function (S, P, ctx) {
    const AXS = P.dioAxisSep !== undefined ? P.dioAxisSep : T.DIO_BRIDGE_AXIS, MIN = P.dioMin !== undefined ? P.dioMin : T.DIO_MIN_BRIDGE, MAX = P.dioMax !== undefined ? P.dioMax : T.DIO_MAX_BRIDGE, CAP = P.dioCap !== undefined ? P.dioCap : T.DIO_CORR_CAP, GAP = P.dioGap !== undefined ? P.dioGap : T.DIO_GAP, SEP = P.dioLandSep !== undefined ? P.dioLandSep : T.DIO_LAND_SEP;
    const n = S.n, W = S.W, H = S.H, map = S.roomMap, vd = S.void, CR = new Set(ctx.chainIds), pc = T.pieces(S, P), nbf = E.walkGraph(S, P), pieces = ctx.pieces, goals = ctx.goals, typeOf = (r) => (P.dioForceRooms && P.dioForceRooms.includes(r) ? T.DIORAMA : ctx.typeOf(r));
    const xy = (i) => [i % W, (i / W) | 0], idx = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x), land = (i) => !(vd && vd[i]), walk0 = (i) => !S.block[i] && S.region && S.region[i] >= 0;
    const adjTo = (p, other) => { const s = new Set(); for (let i = 0; i < n; i++) if (pc.id[i] === p) for (const j of nbf(i).slice()) if (pc.id[j] === other) { s.add(i); break; } return s; };
    const dil = (set, r, within) => { const out = new Set(); for (const i of set) { const [x, y] = xy(i); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const j = idx(x + dx, y + dy); if (j >= 0 && within(j)) out.add(j); } } return out; };
    const bfsPath = (starts, goalSet, p) => { const prev = new Map(), q = []; for (const s of starts) { prev.set(s, -1); q.push(s); } let hit = -1; for (let h = 0; h < q.length && hit < 0; h++) { const u = q[h]; if (goalSet.has(u)) { hit = u; break; } for (const v of nbf(u).slice()) if (!prev.has(v) && pc.id[v] === p) { prev.set(v, u); q.push(v); } } if (hit < 0) return null; const path = []; for (let k = hit; k !== -1; k = prev.get(k)) path.push(k); return path; };
    const cheb = (A, B) => { let m = 1e9; for (const a of A) { const ax = a % W, ay = (a / W) | 0; for (const b of B) { const d = Math.max(Math.abs(ax - b % W), Math.abs(ay - ((b / W) | 0))); if (d < m) m = d; } } return m; };
    const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] : 0; };
    const roomsSeq = pieces.map((p) => pc.room[p]), order = [...new Set(roomsSeq)], items = [], demoted = [], occ = new Set();
    const goalPieceOf = (inT) => { const g = goals.findIndex((t) => t >= 0 && inT[t]); return g >= 0 ? pc.id[goals[g]] : -1; };
    for (const r of order) {
      if (typeOf(r) !== T.DIORAMA) continue;
      const tiles = [], inT = new Uint8Array(n); for (let i = 0; i < n; i++) if (map[i] === r && land(i)) { tiles.push(i); inT[i] = 1; } const area = tiles.length;
      let edges = 0, free = 0; for (const i of tiles) { const [x, y] = xy(i); for (const [dx, dy] of N4) { const j = idx(x + dx, y + dy); if (j >= 0 && inT[j]) continue; edges++; if (j < 0 || !land(j) || map[j] <= 0 || !CR.has(map[j])) free++; } }
      const it = { room: r, tiles: area, perim: edges ? +(100 * free / edges).toFixed(1) : 0, eligible: false, why: '', mode: 'corr', goals: goals.map((t, g) => (t >= 0 && inT[t] ? g : -1)).filter((g) => g >= 0), report: [] };
      const groups = [], seenG = new Map(); // door groups: (piece of this room) x (neighbouring piece), over every visit
      pieces.forEach((p, k) => { if (pc.room[p] !== r) return; for (const d of [-1, 1]) { const q = pieces[k + d]; if (q === undefined || pc.room[q] === r) continue; const gk = p + '|' + q; let gr = seenG.get(gk); if (!gr) { gr = { piece: p, nbPiece: q, nbRoom: pc.room[q], door: adjTo(p, q), visits: [] }; seenG.set(gk, gr); groups.push(gr); } gr.visits.push(k); } });
      it.nGroups = groups.length; it.nbRooms = [...new Set(groups.map((g) => g.nbRoom))];
      if (!groups.length) { it.why = 'no door (the room is the whole chain)'; it.step = 'ascension'; items.push(it); demoted.push({ room: r, why: it.why }); continue; }
      if (P.dioPerim && it.perim < P.dioPerim) { it.why = `free perimeter ${it.perim} % < ${P.dioPerim} % (the D30 rule, a test-only mutation)`; it.step = 'ascension'; items.push(it); demoted.push({ room: r, why: it.why }); continue; }
      // ---- one attempt: a landing definition (landGroups) and the groups that get a bridge (bridgeGroups), pair mode 'nearest' | 'shortest' | 'first'
      const attempt = (kind, ring, landGroups, bridgeGroups, pm) => {
        const rep = { kind, ring, pair: pm, sep: null, tally: {}, rej: { axis: 0, set: 0, adj: 0, long: 0 }, ok: false }, T1 = (k) => { rep.tally[k] = (rep.tally[k] || 0) + 1; };
        const land2 = new Set(); for (const g of landGroups) for (const t of g.tiles) land2.add(t);
        for (const st of S.stairs || []) { const ts = st.bottom.concat(st.top, ...st.steps.map((x) => x.tiles)); if (ts.some((t) => land2.has(t))) for (const t of ts) if (inT[t]) { land2.add(t); for (const g of landGroups) if (ts.some((u) => g.tiles.has(u))) g.tiles.add(t); } } // a ramp that touches a landing stays whole
        for (const g of landGroups) { const conn = new Set(), q = [...g.door].filter((t) => g.tiles.has(t) && walk0(t) && pc.id[t] === g.piece); for (const t of q) conn.add(t); for (let h = 0; h < q.length; h++) for (const v of nbf(q[h]).slice()) if (!conn.has(v) && g.tiles.has(v) && walk0(v) && pc.id[v] === g.piece) { conn.add(v); q.push(v); } g.conn = conn; } // a bridge starts only on a landing tile walk-connected to ITS door through landing tiles (the rest of the old room is flattened)
        if (kind === 'corr' && landGroups.length > 1) { let m = 1e9; for (let a = 0; a < landGroups.length; a++) for (let b = a + 1; b < landGroups.length; b++) if (landGroups[a].piece === landGroups[b].piece) m = Math.min(m, cheb(landGroups[a].tiles, landGroups[b].tiles)); rep.sep = m === 1e9 ? null : m; if (rep.sep !== null && rep.sep < SEP) { rep.fail = `doors adjacent (landing separation ${rep.sep} < ${SEP})`; return { rep }; } }
        const free_ = (j) => j >= 0 && (!CR.has(map[j]) || (map[j] === r && !land2.has(j))) && !occ.has(j);
        const dL = new Int16Array(n).fill(-1); { const q = [...land2]; for (const t of q) dL[t] = 0; for (let h = 0; h < q.length; h++) { const t = q[h], [x, y] = xy(t); if (dL[t] >= 64) continue; for (const [dx, dy] of N8) { const j = idx(x + dx, y + dy); if (j >= 0 && dL[j] < 0) { dL[j] = dL[t] + 1; q.push(j); } } } }
        const gapOf = (dArr) => { let c = 99; for (const j of dArr) if (dL[j] >= 0 && dL[j] < c) c = dL[j]; return c; };
        const bridgesOf = (dstSet, dstArr, srcArr) => {
          const srcOf = new Map(dstArr.map((j, k) => [j, srcArr[k]])), res = [], edge = dstArr.filter((j) => { const [x, y] = xy(j); return N4.some(([dx, dy]) => { const q = idx(x + dx, y + dy); return q < 0 || !dstSet.has(q); }); });
          const latOf = (inner, end, ax, ay) => { const lat = new Set(), cs = new Set(inner); for (let q = 0; q < inner.length; q++) { const [x, y] = xy(inner[q]), nxt = q + 1 < inner.length ? xy(inner[q + 1]) : xy(end), prv = q ? xy(inner[q - 1]) : [ax, ay], tx = nxt[0] - prv[0], ty = nxt[1] - prv[1], px = Math.abs(ty) >= Math.abs(tx) ? 1 : 0, py = px ? 0 : 1;
            for (const s2 of [-1, 1]) { const j = idx(x + s2 * px, y + s2 * py); if (j >= 0 && free_(j) && !dstSet.has(j) && !cs.has(j) && !land2.has(j)) lat.add(j); } } return lat; };
          const taken = new Set(), used = new Set(); // `used`: the end and centre-line tiles of the bridges already chosen (two bridges never share a tile); `taken`: the width-3 tile sets (centre line + side lanes) of the bridges already chosen for this footprint
          const touches = (set) => { for (const t of set) { if (taken.has(t)) return true; const [x, y] = xy(t); for (const [dx, dy] of N4) { const j = idx(x + dx, y + dy); if (j >= 0 && taken.has(j)) return true; } } return false; };
          for (const gr of bridgeGroups) {
            const lt = [...gr.tiles].filter((t) => walk0(t) && pc.id[t] === gr.piece && (!gr.conn || gr.conn.has(t))), ft = edge.filter((j) => walk0(srcOf.get(j)) && pc.id[srcOf.get(j)] === gr.piece); if (!lt.length || !ft.length) return { fail: 'noWalkableEnds' };
            const pairs = []; for (const a2 of lt) { const [ax, ay] = xy(a2); for (const b2 of ft) { const [bx, by] = xy(b2); pairs.push([(ax - bx) * (ax - bx) + (ay - by) * (ay - by), a2, b2]); } } pairs.sort((u, v) => u[0] - v[0]);
            let sawShort = false, sawLong = false, sawChain = false, sawLine = false, sawOcc = false, sawAdj = false;
            const evalLine = (line, a0) => { const inner = []; let first = -1, emb = 0, a2 = a0, ax = a0 % W, ay = (a0 / W) | 0;  // the bridge starts at the LAST landing tile of its line (the landing part is not counted), ends at the first WALKABLE footprint tile of its piece
              for (let q = 1; q < line.length; q++) { const j = idx(line[q][0], line[q][1]); if (land2.has(j)) { if (emb > 0 || (gr.conn && !gr.conn.has(j))) { sawLine = true; return null; } a2 = j; ax = j % W; ay = (j / W) | 0; inner.length = 0; continue; }
                if (dstSet.has(j)) { const sj = srcOf.get(j); if (P.dioEndAny || (walk0(sj) && pc.id[sj] === gr.piece)) { first = j; break; } emb++; if (emb > 4) { sawLine = true; return null; } inner.push(j); } else { if (emb > 0) { sawLine = true; return null; } inner.push(j); } }
              if (first < 0 || !walk0(a2) || pc.id[a2] !== gr.piece) { sawLine = true; return null; }
              let xC = 0, xO = 0; for (const j of inner) { if (CR.has(map[j]) && !(map[j] === r && !land2.has(j))) xC++; if (occ.has(j)) xO++; }
              if (xC) { sawChain = true; return null; } if (xO) { sawOcc = true; return null; }
              const len = Math.hypot(xy(first)[0] - ax, xy(first)[1] - ay); if (len < MIN) { sawShort = true; return null; }
              if (len > MAX && !(P.dioMaxScope === 'single' && bridgeGroups.length > 1)) { sawLong = true; rep.rej.long++; return null; } // EVERY bridge is at most MAX tiles long
              if ([a2, ...inner, first].some((t) => used.has(t))) return null;
              if (AXS > 0 && res.length) { let mn = 1e9; for (const pr of res) for (const u of [pr.from, ...pr.inner]) for (const v of [a2, ...inner]) { const d = Math.max(Math.abs(u % W - v % W), Math.abs(((u / W) | 0) - ((v / W) | 0))); if (d < mn) mn = d; } if (mn < AXS) { sawAdj = true; rep.rej.axis++; rep.rej.adj++; return null; } } // rule (1): axis separation
              const lat = latOf(inner, first, ax, ay); if (P.dioBridgeAdj !== false && taken.size && touches(new Set([...inner, ...lat]))) { sawAdj = true; rep.rej.set++; rep.rej.adj++; return null; } // rule (2): tile-set separation
              return { a2, first, inner, lat, ax, ay, len }; };
            let best = null; const lim = pm === 'nearest' ? 1 : 2500;
            for (let pi = 0; pi < Math.min(pairs.length, lim); pi++) { const [, a0, b2] = pairs[pi], c1 = evalLine(rasterLine(xy(a0)[0], xy(a0)[1], xy(b2)[0], xy(b2)[1]), a0); if (c1) { if (pm === 'shortest') { if (!best || c1.len < best.len) best = c1; } else { best = c1; break; } } }
            if (!best) return { fail: sawAdj && !sawChain && !sawLong ? 'bridgeTooClose' : sawChain && !sawShort && !sawLong ? 'bridgeCrossesChain' : sawShort && !sawChain ? 'bridgeShort' : sawLong && !sawChain ? 'bridgeTooLong' : sawChain ? 'bridgeCrossesChain' : sawOcc ? 'bridgeCrossesPocket' : sawLine ? 'noCleanLine' : 'noLine', toward: gr.nbRoom };
            for (const t of [...best.inner, ...best.lat]) taken.add(t); for (const t of [best.a2, ...best.inner, best.first]) used.add(t);
            res.push({ from: best.a2, to: best.first, inner: best.inner, lat: [...best.lat], xChain: 0, xOcc: 0, xVoid: 0, length: +best.len.toFixed(1), nbRoom: gr.nbRoom, piece: gr.piece }); }
          return { bridges: res }; };
        const near = (srcArr, want, avoid) => { const q = [...srcArr], dist = new Map(srcArr.map((i) => [i, 0])), got = []; for (let h = 0; h < q.length && got.length < want; h++) { const [x, y] = xy(q[h]); for (const [dx, dy] of N8) { const j = idx(x + dx, y + dy); if (dist.has(j) || !free_(j) || avoid.has(j)) continue; dist.set(j, dist.get(q[h]) + 1); q.push(j); got.push(j); if (got.length >= want) break; } } return got; };
        const ringsOf = (from, set) => { const dist = new Int16Array(n).fill(-1), q = [...from]; for (const t of q) dist[t] = 0; for (let h = 0; h < q.length; h++) { const t = q[h]; if (dist[t] >= 64) continue; const [x, y] = xy(t); for (const [dx, dy] of N8) { const j = idx(x + dx, y + dy); if (j >= 0 && dist[j] < 0) { dist[j] = dist[t] + 1; q.push(j); } } } return set.map((j) => (dist[j] > 0 ? dist[j] : 1)); };
        for (let d = 2; d <= CAP; d += 2) for (let a = 0; a < 16; a++) { const dx = Math.round(d * Math.cos(a * Math.PI / 8)), dy = Math.round(d * Math.sin(a * Math.PI / 8)); let ok = true, out = 0; const dst = [], src = [];
          for (let k = 0; k < area; k++) { const [x, y] = xy(tiles[k]), j = idx(x + dx, y + dy); if (j < 0) { out++; continue; } if (land2.has(j) || (CR.has(map[j]) && !inT[j]) || occ.has(j)) { ok = false; break; } dst.push(j); src.push(tiles[k]); }
          if (!ok || out > 0.1 * area) { T1('footprint'); continue; } if (!it.goals.every((g) => goals[g] < 0 || !inT[goals[g]] || src.includes(goals[g]))) { T1('goalClipped'); continue; } if (gapOf(dst) < GAP) { T1('gap'); continue; }
          const dstSet = new Set(dst), br = bridgesOf(dstSet, dst, src); if (br.fail) { T1(br.fail); continue; }
          const avoid = new Set([...dstSet, ...br.bridges.flatMap((b2) => [...b2.inner, ...b2.lat]), ...land2]), pk = near(dst, 3 * area, avoid); if (pk.length < 3 * area) { T1('pocketIncomplete'); continue; }
          const have = new Set(pk); for (const b of br.bridges.flatMap((b2) => [...b2.inner, ...b2.lat, b2.from, b2.to])) { const [bx, by] = xy(b); for (let dy2 = -2; dy2 <= 2; dy2++) for (let dx2 = -2; dx2 <= 2; dx2++) { const j = idx(bx + dx2, by + dy2); if (j >= 0 && !have.has(j) && !avoid.has(j) && free_(j)) { have.add(j); pk.push(j); } } } // the pocket frames every bridge
          rep.ok = true; rep.shift = +Math.hypot(dx, dy).toFixed(1);
          return { rep, geo: { dst, src, shift: [dx, dy], bridges: br.bridges, pocket: pk, pdist: ringsOf(dst, pk), landing: [...land2], groups: landGroups, gapC: gapOf(dst), pocketFill: +(100 * Math.min(pk.length, 3 * area) / (3 * area)).toFixed(0) } }; }
        rep.fail = 'no valid shift within the cap'; return { rep }; };
      const finish = (geo, step) => { const fc = [geo.dst.reduce((a, j) => a + (j % W), 0) / geo.dst.length, geo.dst.reduce((a, j) => a + ((j / W) | 0), 0) / geo.dst.length];
        Object.assign(it, { landing: geo.landing, src: geo.src, dst: geo.dst, bridges: geo.bridges, bridge: geo.bridges[0], bridgeLen: geo.bridges[0].length, bridgeLens: geo.bridges.map((b2) => b2.length), pocket: geo.pocket, pdist: geo.pdist, pocketWanted: 3 * area, pocketFill: geo.pocketFill, shift: +Math.hypot(geo.shift[0], geo.shift[1]).toFixed(1), gapC: geo.gapC, kept: 100, via: 'corr',
          groups: geo.groups.map((g) => ({ piece: g.piece, nbRoom: g.nbRoom, tiles: [...g.tiles], visits: g.visits.slice() })), bridgeCross: { chain: 0, pocket: 0, void: 0 }, structure: geo.bridges.length, step });
        it.rank = T.dioRank(S, P, r); it.free = T.dioFreeSide(S, CR, fc[0], fc[1], new Set(geo.dst)); // the free-side share is informative only (no type depends on it)
        { const entry = groups[0].piece, pe = []; for (let i = 0; i < n; i++) if (pc.id[i] === entry) pe.push(S.ter[i]); const te = median(pe); it.ascEntry = +(100 * tiles.filter((t) => S.ter[t] > te).length / tiles.length).toFixed(1); it.terEntry = te; } // the ascent of the footprint: the share of the room's tiles ABOVE the terrace of the piece the chain enters by
        it.type = (P.dioForce && P.dioForce.room === r && P.dioForce.type) || T.dioTypeCorr(it.rank, it.ascEntry / 100, geo.bridges.length, P.dioCimaThr); // `P.dioForce` {room, type} (the prototype selector, step 4) and `P.dioCimaThr` (a test-only mutation: 2 = type by rank only)
        it.prof = T.dioProfile(S, P, it); it.framing = T.dioFraming(S, it, CR); return it.prof.ok; };
      // ---- the ladder: CORRIDOR (ring 0, 1, 2; nearest pair, then the shortest valid pair inside the same ring) -> LATERAL (same pairs) -> Ascension
      const tryPairs = (kind, ring, mk, bg) => { for (const pm of P.dioPair === 'first' ? ['first'] : P.dioNoFallback ? ['nearest'] : ['nearest', 'shortest']) { const lg = mk(), res = attempt(kind, ring, lg, bg ? bg(lg) : lg, pm); it.report.push(res.rep); if ((res.rep.fail || '').startsWith('doors adjacent')) return null; if (res.rep.ok) { const ok = finish(res.geo, kind === 'lat' ? 'lateral' : groups.length >= 2 ? 'corridor' : 'leaf'); if (ok) { it.ring = ring; return true; } res.rep.ok = false; res.rep.fail = 'profile: ' + it.prof.why; it.prof = null; } } return false; };
      let done = false;
      if (P.dioSkip !== 'corridor') for (const ring of T.DIO_RINGS) { const res = tryPairs('corr', ring, () => groups.map((g) => ({ piece: g.piece, nbRoom: g.nbRoom, visits: g.visits, door: g.door, tiles: dil(g.door, ring, (j) => inT[j]) }))); if (res) { done = true; break; } if (res === null) break; }
      if (!done && groups.length >= 2 && P.dioSkip !== 'lateral') { // LATERAL: the D31 lane landing (the door to door path of every visit, dilated by 2) and ONE bridge on the piece of the goal (else the piece with most landing tiles)
        const lane = new Set(); let bad = false; pieces.forEach((p, k) => { if (pc.room[p] !== r) return; const first = k === 0, last = k === pieces.length - 1; if (first && last) { bad = true; return; } const A = first ? adjTo(p, pieces[k + 1]) : adjTo(p, pieces[k - 1]), B = last || first ? A : adjTo(p, pieces[k + 1]), path = bfsPath([...A], B, p); if (!path) { bad = true; return; } for (const t of path) lane.add(t); });
        if (bad || !lane.size) it.report.push({ kind: 'lat', ok: false, fail: 'no door lane', tally: {}, rej: { axis: 0, set: 0, adj: 0, long: 0 } });
        else { const tiles2 = dil(lane, 2, (j) => inT[j]), gp = goalPieceOf(inT); let bp = gp, bc = -1; if (bp < 0) { const cnt = new Map(); for (const t of tiles2) if (pc.id[t] > 0) cnt.set(pc.id[t], (cnt.get(pc.id[t]) || 0) + 1); for (const [p, c] of cnt) if (c > bc) { bc = c; bp = p; } }
          if (tryPairs('lat', 2, () => [{ piece: bp, nbRoom: -1, visits: [], door: lane, tiles: new Set(tiles2) }])) done = true; } }
      if (!done) { it.step = 'ascension'; it.why = it.report.map((q) => `${q.kind}${q.kind === 'corr' ? ' ring ' + q.ring : ''}${q.pair ? ' (' + q.pair + ')' : ''}: ${q.fail || 'n/a'}`).join(' | '); items.push(it); demoted.push({ room: r, why: it.why }); continue; }
      it.eligible = true; for (const j of it.dst) occ.add(j); for (const j of it.pocket) occ.add(j); for (const b2 of it.bridges) { for (const j of b2.inner) occ.add(j); for (const j of b2.lat) occ.add(j); }
      items.push(it);
    }
    return { n, mode: 'corr', cap: CAP, goals, items, demoted: demoted.map((d) => d.room), why: demoted, eligible: items.filter((q) => q.eligible).map((q) => q.room) };
  };
  /* TYPE OF A MOVED DIORAMA IN `corr` (D32, user's rule A): CIMA iff the ascent of the footprint (the share of the room's tiles above the terrace of the PIECE the chain enters by) >= T.DIO_CIMA_ASC (25 %); else by rank: Low ISLA, Mid ARENA, High QUEBRADA (one bridge BUILT) or MIRADOR (two or more bridges built). No free-side threshold. */
  T.dioTypeCorr = function (rank, asc, bridges, thr) { return asc >= (thr === undefined ? T.DIO_CIMA_ASC : thr) - 1e-12 ? 'cima' : rank === 'low' ? 'island' : rank === 'mid' ? 'arena' : bridges >= 2 ? 'mirador' : 'quebrada'; };
  /* APPLY a plan to the (rebuilt, chain-flattened) shape: new levels for the footprint / bridge (exact heights, the palette of the terrace they sit at), the water or the stepped flanks of the pocket, the old footprint minus the landing flattened like the off-chain ground,
     the pocket not walkable, the footprint + bridge + landing walkable (the walking graph is extended: the footprint mirrors the walking of its source tiles, the bridge links the landing to the footprint), the goals inside a moved Diorama moved with it (S.dioMove: window tile -> tile).
     Sets S.dioRole (1 footprint, 2 pocket, 3 landing, 4 bridge), S.dioInfo. */
  T.dioApply = function (S, P, dp) {
    const n = S.n, W = S.W; if (!dp || dp.n !== n) return null; const items = dp.items.filter((q) => q.eligible); S.dioInfo = { mode: dp.mode, cap: dp.cap, eligible: dp.eligible.slice(), demoted: dp.why.slice(), levelsAdded: 0, footprint: 0, pocket: 0, bridge: 0, landing: 0 }; if (!items.length) return S.dioInfo;
    for (const k of ['void', 'block', 'region', 'ter', 'sub']) if (S[k]) S[k] = S[k].slice(); // these arrays can be shared with the cached layers of the shape: copy before writing (Off after the option must draw as before)
    const lv = S.levelH, terH = P.terH, greyL = S.levelMeta.findIndex((m) => m && m.grey), greyH = greyL >= 0 ? lv[greyL] : lv[0], vd = S.void;
    const role = new Uint8Array(n), height = new Float64Array(n), keep = new Uint8Array(n), dioRole = new Uint8Array(n), srcOf = new Map(), own = new Set(), ext = new Map(), move = new Map(), oldFp = new Set(), landSet = new Set();
    const link = (a, b) => { const la = ext.get(a) || ext.set(a, []).get(a), lb = ext.get(b) || ext.set(b, []).get(b); if (!la.includes(b)) la.push(b); if (!lb.includes(a)) lb.push(a); }, base = E.walkGraph(S, P), baseList = (i) => base(i).slice();
    for (const it of items) {
      const prof = it.prof;
      it.dst.forEach((j, k) => { role[j] = 3; height[j] = prof.fpH[k]; keep[j] = 1; dioRole[j] = 1; srcOf.set(j, it.src[k]); own.add(j); });
      for (const t of it.src) oldFp.add(t); for (const t of it.landing) { landSet.add(t); dioRole[t] = 3; }
      // walking inside the footprint = the walking of the source tiles
      const inv = new Map(it.src.map((s, k) => [s, it.dst[k]]));
      for (const [s, j] of inv) { if (!walk0S(S, s)) continue; for (const q of baseList(s)) { const j2 = inv.get(q); if (j2 !== undefined && j2 > j) link(j, j2); } }
      // the bridge: from the landing tile through the centre line to the footprint tile, heights linear between both ends
      for (const [j, h] of prof.bridgeH) { role[j] = 3; height[j] = h; keep[j] = 1; dioRole[j] = 4; own.add(j); }
      for (const b of it.bridges || [it.bridge]) { const path = [b.from, ...b.inner, b.to]; // `corr` (D32): one bridge per door group; the other plans have `it.bridge` only
        for (let q = 0; q + 1 < path.length; q++) link(path[q], path[q + 1]);
        { const brSet = new Set([...b.inner, ...b.lat]), ends = new Set([b.from, b.to]); for (const j of brSet) { const x = j % W, y = (j / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= S.H) continue; const k = ny * W + nx; if (brSet.has(k) || ends.has(k)) link(j, k); } } } }
      // the pocket: the profile of its type (heights relative to the footprint and the landing)
      it.pocket.forEach((j, k) => { role[j] = prof.roles[k]; height[j] = prof.heights[k]; keep[j] = 1; dioRole[j] = 2; });
      for (const g of it.goals) { const s = dp.goals[g]; if (s >= 0 && inv.has(s)) move.set(s, inv.get(s)); }
    }
    const decoHeight = Float64Array.from(height), added = E.pocket.addLevels(S, P, { role, height, decoHeight, keep }).added;
    // the levels of the footprint and the bridge follow the palette of the terrace they sit at (not the desaturated decoration)
    { const base0 = []; S.levelMeta.forEach((m, L) => { if (m && !m.deco && !m.water && !m.grey && !m.bridge && !m.dio) base0.push(L); });
      const done = new Set(); for (let i = 0; i < n; i++) if (role[i] === 3) { const L = S.fine[i]; if (done.has(L)) continue; done.add(L); let bl = base0[0], bd = 1e9; for (const q of base0) { const d = Math.abs(S.levelH[q] - S.levelH[L]); if (d < bd) { bd = d; bl = q; } } const m0 = S.levelMeta[bl]; S.levelMeta[L] = { ter: m0.ter, sub: m0.sub, bridge: false, dio: true }; } }
    for (const it of items) { let pmn = 1e9, pmx = -1e9; it.pocket.forEach((j, k) => { if (it.prof.roles[k] === 2) { pmn = Math.min(pmn, it.prof.heights[k]); pmx = Math.max(pmx, it.prof.heights[k]); } }); it.pocket.forEach((j, k) => { if (it.prof.roles[k] === 2) S.levelMeta[S.fine[j]] = { ter: 0, sub: 0, bridge: false, deco: true, pk: (it.prof.heights[k] - pmn) / ((pmx - pmn) || 1) }; }); } // the pocket palette: a gradient by height, distinct from the flattened grey and from the terrace palette (render.js `meta.pk`)
    const greyNow = S.levelMeta.findIndex((m) => m && m.grey), fp = new Set(); let nFp = 0, nPk = 0, nBr = 0;
    for (let i = 0; i < n; i++) { if (role[i] >= 2 && vd && vd[i]) vd[i] = 0; if (dioRole[i] === 1) { fp.add(i); nFp++; } else if (dioRole[i] === 2) nPk++; else if (dioRole[i] === 4) nBr++; }
    for (const t of landSet) if (!fp.has(t)) { if (S.dioBits) S.dioBits[t] = 0; if (S.roomBitsDio && S.roomBits) S.roomBitsDio[t] = S.roomBits[t]; } // D31: the Diorama outline is at the MOVED footprint only, not at the landing of the old place
    for (const t of oldFp) if (!fp.has(t) && !landSet.has(t)) { if (!dioRole[t] && greyNow >= 0) S.fine[t] = greyNow; if (S.roomType) S.roomType[t] = 0; if (S.nowalk) S.nowalk[t] = 0; if (S.roomBits) S.roomBits[t] = 0; if (S.dioBits) S.dioBits[t] = 0; if (S.roomBitsDio) S.roomBitsDio[t] = 0; } // the old footprint minus the landing is ground (grey) or pocket / bridge: no tint, no border, no outline
    if (S.ascWalls && S.ascWalls.faces) { // the Ascension walls were built on the room borders at the OLD tiles: no wall inside the footprint, the bridge, the pocket or the flattened old footprint (the walls follow the type shown)
      const dead = (t) => dioRole[t] === 1 || dioRole[t] === 2 || dioRole[t] === 4 || (oldFp.has(t) && !landSet.has(t)), keepF = S.ascWalls.faces.filter((f) => !dead(f.i) && !dead(f.j));
      S.dioInfo.wallsDropped = S.ascWalls.faces.length - keepF.length; S.ascWalls = Object.assign({}, S.ascWalls, { faces: keepF }); }
    S.stairs = (S.stairs || []).filter((r) => { const ts = r.bottom.concat(r.top, ...r.steps.map((x) => x.tiles)); return !ts.some((t) => oldFp.has(t) && !landSet.has(t)); }); // a ramp inside a moved footprint is not drawn (a Diorama has no internal ramp; the ramps at its doors lie in the landing)
    for (let i = 0; i < n; i++) { if (role[i] < 2) continue; const s = srcOf.get(i); if (s !== undefined) { S.ter[i] = S.ter[s]; S.sub[i] = S.sub[s]; if (S.roomType) S.roomType[i] = 2; if (S.nowalk) S.nowalk[i] = 0; } if (dioRole[i] === 2) { S.block[i] = 1; if (S.region) S.region[i] = -1; if (S.roomType) S.roomType[i] = 0; if (S.nowalk) S.nowalk[i] = 0; } else { S.block[i] = 0; } }
    for (const it of items) { const reg = S.region ? S.region[it.bridge.from] : 0; for (const j of own) if (dioRole[j] === 1 || dioRole[j] === 4) if (S.region) S.region[j] = reg; if (S.roomBits) for (const j of it.dst) S.roomBits[j] = 0;
      if (S.dioBits) { const fs = new Set(it.dst); for (const j of it.dst) { const x = j % W, y = (j / W) | 0; [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], b) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= S.H || !fs.has(ny * W + nx)) S.dioBits[j] |= 1 << b; }); } if (S.roomBitsDio) for (const j of it.dst) S.roomBitsDio[j] |= S.dioBits[j]; } }
    S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd || !vd[i]) S.byLevel[S.fine[i]].push(i);
    if (vd) { S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1; }
    S._walk = (i) => { if (own.has(i)) return ext.get(i) || []; const b = base(i); let out = b; for (const j of b) if (own.has(j)) { out = b.filter((q) => !own.has(q)); break; } const e = ext.get(i); return e ? out.concat(e) : out; };
    S.dioRole = dioRole; S.dioMove = move; Object.assign(S.dioInfo, { levelsAdded: added, footprint: nFp, pocket: nPk, bridge: nBr, landing: landSet.size });
    return S.dioInfo;
  };

  /* THE DRAWN ROUTE IS THE CHAIN (DAC v2 PR C2, D31; the chain view only): the route of the objective j is the prefix of ONE tile path that follows the chain piece by piece, door to door, ONLY on tiles of the chain pieces (never on the flattened ground) and, where a Diorama moved, on its landing and, when a goal lies inside it, on the bridge and the footprint.
     A layered BFS over (visit k, tile, goal flag): layer k = the tiles of piece k of `P.chainSeqs[0]` (the old footprint minus the landing is flattened, so it is not walkable here), edges = the final walking graph `S._walk`, a move to layer k + 1 only across a door edge, every goal (stake, sub-objectives, final goal; `P.chainGoals`, moved with the footprint by `S.dioMove`) forced at its visit in order.
     Returns { path (stake first), goalIdx (index of each goal in the path), layers, pieces (distinct pieces on the path) } or { fail, failAt, why }; the tree, classify and the walking graph are only READ. */
  T.chainRoute = function (S, P) {
    const seq = P.chainSeqs && P.chainSeqs[0], goals = P.chainGoals; if (!seq || !goals || goals.length < 2) return null;
    if (S._chainRoute !== undefined) return S._chainRoute;
    const n = S.n, K = seq.length, pc = T.pieces(S, P), nb = E.walkGraph(S, P), dp = S.dioInfo && P.dioPlan && P.dioChain && P.dioChain !== 'off' ? P.dioPlan : null, moved = dp ? dp.items.filter((q) => q.eligible) : [];
    const mv = (t) => (S.dioMove && S.dioMove.has(t) ? S.dioMove.get(t) : t), gs = goals.map(mv), flat = new Set(), landOf = new Map(), extraOf = new Map();
    for (const it of moved) { for (const t of it.src) flat.add(t); landOf.set(it.room, new Set(it.landing)); extraOf.set(it.room, [...it.dst, ...(it.bridges || [it.bridge]).flatMap((b2) => [...b2.inner, ...b2.lat])]); }
    const gp = goals.map((t) => pc.id[t]), goalAt = new Array(K).fill(-1); goalAt[0] = 0; { let gi = 0; for (let k = 1; k < K; k++) if (gi + 1 < gp.length && seq[k] === gp[gi + 1]) { gi++; goalAt[k] = gi; } }
    const byPiece = new Map(); for (let i = 0; i < n; i++) { const p = pc.id[i]; if (p > 0) { let a = byPiece.get(p); if (!a) byPiece.set(p, a = []); a.push(i); } }
    const layerSets = seq.map((p, k) => { const room = pc.room[p], land = landOf.get(room), set = new Set(); for (const i of byPiece.get(p) || []) { if (land && flat.has(i) && !land.has(i)) continue; set.add(i); } if (land && ((goalAt[k] >= 0 && gs[goalAt[k]] !== goals[goalAt[k]]) || (dp && dp.mode === 'corr'))) for (const t of extraOf.get(room)) set.add(t); return set; }); // `corr` (D32): the route crosses the structure (landing -> bridge -> footprint -> bridge -> landing) whether or not a goal lies inside
    const need = (k) => goalAt[k] > 0, goalTile = (k) => (goalAt[k] >= 0 ? gs[goalAt[k]] : -1), f0 = (k, t) => (need(k) ? (t === goalTile(k) ? 1 : 0) : 1), key = (k, t, f) => (k * n + t) * 2 + f;
    const start = gs[0]; if (!layerSets[0].has(start)) return (S._chainRoute = { fail: true, failAt: 0, why: 'the stake tile is not on its piece' });
    const par = new Map([[key(0, start, 1), -1]]), q = [[0, start, 1]], last = K - 1, fin = gs[gs.length - 1]; let maxK = 0, endKey = -1;
    for (let h = 0; h < q.length; h++) { const [k, t, f] = q[h]; if (k > maxK) maxK = k; if (k === last && t === fin && f === 1) { endKey = key(k, t, f); break; }
      for (const v of nb(t).slice()) { if (layerSets[k].has(v)) { const f2 = need(k) && v === goalTile(k) ? 1 : f, kk = key(k, v, f2); if (!par.has(kk)) { par.set(kk, key(k, t, f)); q.push([k, v, f2]); } }
        if (k + 1 < K && f === 1 && layerSets[k + 1].has(v)) { const f2 = f0(k + 1, v), kk = key(k + 1, v, f2); if (!par.has(kk)) { par.set(kk, key(k, t, f)); q.push([k + 1, v, f2]); } } } }
    if (endKey < 0) return (S._chainRoute = { fail: true, failAt: Math.min(maxK + 1, K - 1), why: `no way through visit ${maxK + 1} (piece ${seq[maxK]}) with its own tiles` + (need(maxK) && maxK < K ? ' (door to the next piece or its goal tile)' : '') });
    const path = [], lay = []; for (let kk = endKey; kk !== -1; kk = par.get(kk)) { const f = kk % 2, rest = (kk - f) / 2, t = rest % n, k = (rest - t) / n; path.push(t); lay.push(k); } path.reverse(); lay.reverse();
    const goalIdx = goals.map((g, j) => { const k = j === 0 ? 0 : goalAt.indexOf(j); const tile = gs[j]; for (let i = 0; i < path.length; i++) if (lay[i] === k && path[i] === tile) return i; return -1; });
    return (S._chainRoute = { path, goalIdx, layers: lay, goals: gs, pieces: new Set(path.map((t) => pc.id[t]).filter((p) => p > 0 && seq.includes(p))).size, chainPieces: new Set(seq).size });
  };

  /* RANK AND TYPE OF A MOVED DIORAMA (DAC v2 PR C2, D31; user's rule 2026-10-23): the RANK of a room over the terraces of the map (0 .. S.N - 1): it TOUCHES the lowest terrace -> 'low', the highest -> 'high', neither -> 'mid'; touching both: the extreme with more of the room's tiles. The rank decides the pocket TYPE:
     low -> ISLAND, mid -> ARENA, high -> QUEBRADA or CIMA by the FREE SIDE: the 45-degree sector (of 8, radius 18 around the footprint, the footprint itself not counted) with the highest share of tiles that are NOT chain rooms (void counts as free: the D30 pocket-space definition); a share >= T.DIO_FREE (0.6) -> QUEBRADA, else CIMA.
     (MIRADOR, the fifth type, is deferred.) `P.dioForceRank` ('low' | 'mid' | 'high') is a TEST-ONLY hook (not in the pack, not in the UI). */
  T.DIO_FREE = 0.6;
  T.dioRank = function (S, P, room) {
    if (P && P.dioForceRank) return P.dioForceRank; const N = S.N; if (!(N > 1)) return 'mid'; let lo = 0, hi = 0;
    for (let i = 0; i < S.n; i++) if (S.roomMap[i] === room && !(S.void && S.void[i])) { if (S.ter[i] === 0) lo++; else if (S.ter[i] === N - 1) hi++; }
    return lo && !hi ? 'low' : hi && !lo ? 'high' : lo && hi ? (lo > hi ? 'low' : 'high') : 'mid';
  };
  T.dioFreeSide = function (S, chainSet, cx, cy, skip, R) {
    const W = S.W, H = S.H, rad = R || 18, tot = new Array(8).fill(0), fr = new Array(8).fill(0);
    for (let y = Math.max(0, Math.round(cy) - rad); y < Math.min(H, Math.round(cy) + rad); y++) for (let x = Math.max(0, Math.round(cx) - rad); x < Math.min(W, Math.round(cx) + rad); x++) { const i = y * W + x; if (skip && skip.has(i)) continue;
      const k = ((Math.round(Math.atan2(y - cy, x - cx) / (Math.PI / 4)) % 8) + 8) % 8; tot[k]++; if ((S.void && S.void[i]) || !(S.roomMap[i] > 0 && chainSet.has(S.roomMap[i]))) fr[k]++; }
    const shares = tot.map((t, k) => (t ? fr[k] / t : 0)); let b = 0; for (let k = 1; k < 8; k++) if (shares[k] > shares[b]) b = k;
    return { sector: b, share: shares[b], shares, dir: [Math.cos(b * Math.PI / 4), Math.sin(b * Math.PI / 4)] };
  };
  T.dioType = function (rank, free, thr) { return rank === 'low' ? 'island' : rank === 'mid' ? 'arena' : free && free.share >= (thr === undefined ? T.DIO_FREE : thr) ? 'quebrada' : 'cima'; }; // `thr` / `P.dioFree`: test-only override of the 60 % threshold

  /* POCKET PROFILES (DAC v2 PR C2, D31; user's types 2026-10-23: ISLAND, CIMA, ARENA, QUEBRADA; MIRADOR is deferred): the pocket is decorative (not walkable) and its height is a PROFILE relative to the footprint and to the landing level (a function of the distance and the direction from the footprint), never an absolute height of its own,
     so it reads the same on terrace 1 and on terrace 10; the footprint keeps its shape and its internal relative heights and is placed by the type (offset from the landing level Href, in terH: island 0, cima +1.5, arena -1.2, quebrada +1.0). Every profile keeps a FRAME MASK: the pocket tiles within 2 of the bridge or the landing are lowered under the bridge height so the paths that
     connect the Diorama are framed, not buried. The camera side tests use the FIXED reference camera (Cam 1, T.DIO_REF_YAW), never the active one: the geometry of a Diorama does not depend on the camera.
       island (rank Low): water flat below the footprint and the landing (min(fp min, Href) - 0.7), a land strip (within 1 of the bridge and the landing) at the bridge height: water on both sides of the paths.
       cima (High, no free side): stepped flanks from the footprint top down to the ground (the flattened chain ground), the camera-side flank capped at 1/3 of that height; the pocket maximum is below the footprint top.
       arena (Middle): the footprint at the bottom, the pocket rises all around (+2.5 over 6 rings), the rim on the camera side cut low (+0.3), the bridge enters through the frame gap.
       quebrada (High, free side >= T.DIO_FREE): a high rock wall behind the footprint (+1.5 over 2 rings), the DROP on the free side (the whole free half is the DECLARED cliff face: the fall within 3 rings, a notch of +-3 facing the free side, the chasm floor at the ground - 1.5).
     SLOPE CAP T.DIO_SLOPE (3.0 terH between 4-adjacent pocket tiles); the declared cliff face of the quebrada is exempt (its slope is reported apart); a profile that does not fit -> the Diorama is drawn as Ascension with the reason.
     Returns { type, dz, fpH (per dst tile), bridgeH (Map tile -> height), heights / roles (per pocket tile; role 2 deco, 4 water), cliff, Href, top, min, greyH, slopeMax, slopeNoCliff, pocketMax, pocketMin, ok, why }. */
  T.DIO_REF_YAW = 45; T.DIO_SLOPE = 3.0;
  /* FLATTEN of the MINOR terrace islands of a footprint (DAC v2 PR D, D32; `corr` only; VISUAL only: it changes the drawn heights `fpH` of the footprint, never `S.ter`, the walking graph, the regions or the route). A footprint keeps its internal relief, but a small high or low patch of it (a one-tile post, a thin tongue) is multiplied by terH and reads as a pillar or a stump.
     RULE: an ISLAND is a 4-connected component of equal SOURCE terrace that is not the dominant terrace of the footprint and (a) has fewer than 12 tiles, or (b) is thinner than 3 tiles (it has no tile whose four neighbours are all in it), or (c) its terrace holds less than 8 % of the footprint tiles. Its tiles take the MEDIAN height of the footprint tiles around it (8-neighbours, outside the island).
     EXCEPTION (user, Gate 2): an ASCENDING footprint (ascent >= T.DIO_CIMA_ASC, i.e. a Cima) never loses its TOP terrace: that plateau is the summit, not a stump. Returns { tiles, comps, list, kept }; `kept` = the tiles of a top-terrace island that the exception saved. `P.dioFlatTop === true` (test-only) switches the exception off. */
  T.dioFlat = function (S, P, it, fpH, med) {
    const W = S.W, fidx = new Map(it.dst.map((j, k) => [j, k])), ter = it.dst.map((j, k) => S.ter[it.src[k]]), cnt = new Map(); for (const t of ter) cnt.set(t, (cnt.get(t) || 0) + 1);
    let dom = null, domN = -1, topT = -1e9; for (const [t, c] of cnt) { if (c > domN) { domN = c; dom = t; } if (t > topT) topT = t; }
    const asc = !(P.dioFlatTop === true) && (it.ascEntry || 0) >= 100 * T.DIO_CIMA_ASC - 1e-9 && cnt.size > 1, orig = fpH.slice(), seen = new Uint8Array(it.dst.length), N4f = [[1, 0], [-1, 0], [0, 1], [0, -1]], N8f = N4f.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]), info = { tiles: 0, comps: 0, list: [], kept: 0 };
    for (let k0 = 0; k0 < it.dst.length; k0++) { if (seen[k0] || ter[k0] === dom) continue; const comp = [k0]; seen[k0] = 1;
      for (let h2 = 0; h2 < comp.length; h2++) { const j = it.dst[comp[h2]], x = j % W, y = (j / W) | 0; for (const [dx, dy] of N4f) { const kq = fidx.get((y + dy) * W + x + dx); if (kq !== undefined && !seen[kq] && ter[kq] === ter[k0]) { seen[kq] = 1; comp.push(kq); } } }
      const cs = new Set(comp.map((k) => it.dst[k])), core = comp.filter((k) => { const j = it.dst[k], x = j % W, y = (j / W) | 0; return N4f.every(([dx, dy]) => cs.has((y + dy) * W + x + dx)); }), share = cnt.get(ter[k0]) / it.dst.length;
      if (!(comp.length < 12 || core.length === 0 || share < 0.08)) continue;
      if (asc && ter[k0] === topT) { info.kept += comp.length; continue; } // the summit of an ascending footprint is kept
      const around = []; for (const k of comp) { const j = it.dst[k], x = j % W, y = (j / W) | 0; for (const [dx, dy] of N8f) { const kq = fidx.get((y + dy) * W + x + dx); if (kq !== undefined && !cs.has(it.dst[kq])) around.push(orig[kq]); } }
      if (around.length) { const m2 = med(around); for (const k of comp) fpH[k] = m2; info.tiles += comp.length; info.comps++; info.list.push(comp.length); } }
    return info; };
  /* the CLOSED footprint (corr, Cima and Mirador): the notches and slots of the outline (dilate 2, erode 2, never over a bridge or a landing, only over pocket tiles) become filler at the height of the nearest footprint tile, flush with it, so no one-tile column stands in a slot; the skirt starts outside the closed shape. */
  T.dioClosed = function (S, it, R0) {
    const W = S.W, H = S.H, fpS = new Set(it.dst), pk = new Set(it.pocket), N8c = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], skip = new Set(it.landing); for (const b of it.bridges || [it.bridge]) for (const t of [...b.inner, ...b.lat, b.from, b.to]) skip.add(t);
    const dil = (set) => { const o = new Set(set); for (const t of set) { const x = t % W, y = (t / W) | 0; for (const [dx, dy] of N8c) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) o.add(ny * W + nx); } } return o; };
    const ero = (set) => { const o = new Set(); for (const t of set) { const x = t % W, y = (t / W) | 0; if (N8c.every(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < W && ny < H && set.has(ny * W + nx); })) o.add(t); } return o; };
    let c1 = fpS; const R = R0 !== undefined ? R0 : T.DIO_CLOSE; for (let q = 0; q < R; q++) c1 = dil(c1); for (let q = 0; q < R; q++) c1 = ero(c1);
    const fill = new Set([...c1].filter((t) => !fpS.has(t) && pk.has(t) && !skip.has(t))); return fill; };
  T.DIO_CLOSE = 2;
  T.dioGround = function (S) { const g = S.levelMeta ? S.levelMeta.findIndex((m) => m && m.grey) : -1; return g >= 0 ? S.levelH[g] : S.levelH[0] - 0.002; }; // the flattened chain ground (the grey level is inserted just under the lowest level)
  T.dioProfile = function (S, P, it) {
    const W = S.W, lv = (t) => S.levelH[S.fine[t]], terH = P.terH, greyH = T.dioGround(S), type = it.type || 'cima', yaw = T.DIO_REF_YAW * Math.PI / 180, ux = Math.sin(yaw), uy = Math.cos(yaw), corr = it.via === 'corr'; // `corr` (D32): the corridor plans; the D31 plans (Off / M1 / M2) keep every profile below exactly as it was
    const med = (a) => { const q = a.slice().sort((x, y) => x - y); return q[(q.length - 1) >> 1]; }, Href = med(it.landing.map(lv)), sm = med(it.src.map(lv));
    const dz = Href - sm + ({ island: 0, cima: 1.5, arena: -1.2, quebrada: 1.0, mirador: 1.0 }[type] || 0) * terH, fpH = it.dst.map((j, k) => lv(it.src[k]) + dz), flat = corr && P.dioFlat !== false ? T.dioFlat(S, P, it, fpH, med) : null; let top = -1e9, mn = 1e9; for (const h of fpH) { if (h > top) top = h; if (h < mn) mn = h; }
    const bridgeH = new Map(); for (const b of it.bridges || [it.bridge]) { const hL = lv(b.from), hF = fpH[it.dst.indexOf(b.to)], m = b.inner.length; b.inner.forEach((j, q) => bridgeH.set(j, hL + (hF - hL) * (q + 1) / (m + 1))); // heights linear between both ends, one run per bridge
      for (const j of b.lat) { let bq = 0, bd = 1e9; b.inner.forEach((c, q) => { const d = Math.abs((c % W) - (j % W)) + Math.abs(((c / W) | 0) - ((j / W) | 0)); if (d < bd) { bd = d; bq = q; } }); bridgeH.set(j, hL + (hF - hL) * (bq + 1) / (m + 1)); } }
    const brT = [...bridgeH.keys()], brX = brT.map((t) => t % W), brY = brT.map((t) => (t / W) | 0), brHs = brT.map((t) => bridgeH.get(t)), lnX = it.landing.map((t) => t % W), lnY = it.landing.map((t) => (t / W) | 0);
    const cx = it.dst.reduce((a, j) => a + (j % W), 0) / it.dst.length, cy = it.dst.reduce((a, j) => a + ((j / W) | 0), 0) / it.dst.length, ring = it.pdist, D = Math.max(1, ...ring), f = it.free ? it.free.dir : [1, 0];
    const N = it.pocket.length, heights = new Float64Array(N), roles = new Uint8Array(N), cliff = new Uint8Array(N);
    // corr, Cima and Mirador: the closed footprint (flush filler in the notches), the height of the nearest footprint tile of every pocket tile, the skirt distance from the closed shape
    const fill = corr && (type === 'cima' || type === 'mirador') ? T.dioClosed(S, it, P.dioClose) : null, nearH = new Map(), effD = new Map(); let De = 1;
    if (fill) { const N8c = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], q = [], pk0 = new Set(it.pocket); it.dst.forEach((j2, k2) => { nearH.set(j2, fpH[k2]); q.push(j2); });
      for (let h2 = 0; h2 < q.length; h2++) { const t = q[h2], x = t % W, y = (t / W) | 0; for (const [dx, dy] of N8c) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= S.H) continue; const q2 = ny * W + nx; if (pk0.has(q2) && !nearH.has(q2)) { nearH.set(q2, nearH.get(t)); q.push(q2); } } }
      const q3 = []; for (const t of fill) { effD.set(t, 0); q3.push(t); } for (const j2 of it.dst) { effD.set(j2, 0); q3.push(j2); }
      for (let h2 = 0; h2 < q3.length; h2++) { const t = q3[h2], x = t % W, y = (t / W) | 0; for (const [dx, dy] of N8c) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= S.H) continue; const q2 = ny * W + nx; if (pk0.has(q2) && !effD.has(q2)) { effD.set(q2, effD.get(t) + 1); De = Math.max(De, effD.get(t) + 1); q3.push(q2); } } } }
    const hn0 = (j2) => (nearH.has(j2) ? nearH.get(j2) : Href);
    // Mirador: the landmark (an irregular rock, plus a pond at terH <= 1) on the BACKGROUND axis of the fixed reference camera, >= 7 tiles from every bridge and landing tile, inside the pocket
    let hito = null; const rockAt = new Map(), pondAt = new Set(), plain = Href - 0.6 * terH;
    if (corr && type === 'mirador') { const hash = (a2, b2) => { let h2 = (a2 * 374761393 + b2 * 668265263) | 0; h2 = (h2 ^ (h2 >>> 13)) * 1274126177 | 0; return ((h2 ^ (h2 >>> 16)) >>> 0) / 4294967295; }, poc = new Set(it.pocket), FAR = P.dioHitoFar !== undefined ? P.dioHitoFar : T.DIO_HITO_FAR, far7 = (xx, yy) => lnX.every((lx, i) => Math.max(Math.abs(lx - xx), Math.abs(lnY[i] - yy)) >= FAR) && brX.every((bx, i) => Math.max(Math.abs(bx - xx), Math.abs(brY[i] - yy)) >= FAR), room = (xx, yy, RR) => { for (let a2 = -RR; a2 <= RR; a2++) for (let b2 = -RR; b2 <= RR; b2++) if (!poc.has((yy + b2) * W + xx + a2)) return false; return true; };
      const fl = P.dioMirFlip ? -1 : 1, bgx = -ux * fl, bgy = -uy * fl; let fpR = 0; // `P.dioMirFlip` (test-only mutation): the Mirador facing the CAMERA for (let t2 = 0; t2 < 60; t2 += 0.5) { const xx = Math.round(cx + bgx * t2), yy = Math.round(cy + bgy * t2); if (it.dst.includes(yy * W + xx)) fpR = t2; }
      const place = (skipNear) => { for (const dAng of [0, 12, -12, 25, -25, 40, -40]) { const ca = Math.cos(dAng * Math.PI / 180), sa = Math.sin(dAng * Math.PI / 180), dx2 = bgx * ca - bgy * sa, dy2 = bgx * sa + bgy * ca; for (let t2 = fpR + 6; t2 <= fpR + 24; t2 += 1) { const xx = Math.round(cx + dx2 * t2), yy = Math.round(cy + dy2 * t2); if (skipNear && Math.hypot(xx - skipNear.x, yy - skipNear.y) < 8) continue; if (far7(xx, yy) && room(xx, yy, 4)) return { x: xx, y: yy }; } } return null; };
      const site = place(null); if (site) { const ph = [hash(site.x, site.y) * 6.28, hash(site.y, site.x) * 6.28, hash(site.x + 3, site.y + 5) * 6.28, hash(site.y + 7, site.x + 1) * 6.28], rockTop = top + T.DIO_HITO_H * terH, tiles2 = [];
        const rad1 = (th) => 1.45 + 0.4 * Math.sin(2 * th + ph[0]) + 0.25 * Math.sin(3 * th + ph[1]), rad2 = (th) => 2.7 + 0.5 * Math.sin(2 * th + ph[2]) + 0.35 * Math.sin(4 * th + ph[3]), ox2 = 0.8 * Math.cos(ph[0]), oy2 = 0.8 * Math.sin(ph[0]); // two tiers with different centres: a spire on a shoulder, never concentric discs
        for (let b2 = -5; b2 <= 5; b2++) for (let a2 = -5; a2 <= 5; a2++) { const xx = site.x + a2, yy = site.y + b2, j2 = yy * W + xx; if (!poc.has(j2)) continue; const d1 = Math.hypot(a2, b2), t1 = Math.atan2(b2, a2), d2 = Math.hypot(a2 - ox2, b2 - oy2), t2 = Math.atan2(b2 - oy2, a2 - ox2);
          if (d1 <= rad1(t1)) rockAt.set(j2, rockTop); else if (d2 <= rad2(t2)) rockAt.set(j2, plain + 0.5 * (rockTop - plain)); }
        for (const j2 of rockAt.keys()) tiles2.push(j2);
        let pond = null; if (terH <= 1 + 1e-9) { const ps = place(site); if (ps) { pond = ps; for (let b2 = -4; b2 <= 4; b2++) for (let a2 = -4; a2 <= 4; a2++) { const j2 = (ps.y + b2) * W + ps.x + a2, th = Math.atan2(b2, a2); if (poc.has(j2) && Math.hypot(a2, b2) <= 2.6 + 0.4 * Math.sin(3 * th + ph[2])) pondAt.add(j2); } } }
        const aF = (j2) => ((j2 % W) - cx) * ux + (((j2 / W) | 0) - cy) * uy, amax = Math.max(...it.dst.map(aF)), front = it.dst.map((j2, k) => [aF(j2), fpH[k]]).filter((q) => q[0] >= amax - 1).map((q) => q[1]);
        hito = { x: site.x, y: site.y, tiles: tiles2, top: rockTop, base: plain, front: med(front), above: rockTop - med(front), aboveTerH: (rockTop - med(front)) / terH, pond: pond ? { x: pond.x, y: pond.y, tiles: [...pondAt] } : null }; } }
    for (let k = 0; k < N; k++) { const j = it.pocket[k], x = j % W, y = (j / W) | 0, d = ring[k], toward = ((x - cx) * ux + (y - cy) * uy) > 0;
      let bd = 1e9, bh = Href; for (let q = 0; q < brT.length; q++) { const dd = Math.abs(brX[q] - x) + Math.abs(brY[q] - y); if (dd < bd) { bd = dd; bh = brHs[q]; } } let ld = 1e9; for (let q = 0; q < lnX.length; q++) { const dd = Math.max(Math.abs(lnX[q] - x), Math.abs(lnY[q] - y)); if (dd < ld) ld = dd; }
      const cw3 = Math.max(0, Math.min(1, ((x - cx) * ux + (y - cy) * uy) / 3)), fd = Math.min(bd, ld), fw = fd <= 2 ? 1 : fd >= 5 ? 0 : (5 - fd) / 3, frm = (h0) => h0 + (Math.min(h0, bh - 0.35) - h0) * fw; let h, r = 2; // the frame gap (2 tiles around the paths) opens gradually over 3 more tiles
      if (type === 'island') { if (bd <= 1 || ld <= 1) h = Math.min(Href, bh) - 0.05; else { r = 4; h = Math.min(mn, Href) - 0.7 * terH; } }
      else if (type === 'cima' && corr) { /* D32: the HUGGING flank: the footprint is the highest point, the skirt descends in terraces from the height of the NEAREST footprint tile to the ground, no camera-side cut; filler tiles of the closed outline are flush with the footprint */
        if (fill.has(j)) h = hn0(j); else { const de = effD.has(j) ? effD.get(j) : d; h = greyH + (hn0(j) - greyH) * (1 - de / (De + 1)); if (P.dioCimaCut) h = h + (Math.min(h, greyH + Math.max(0, top - greyH) / 3) - h) * Math.max(0, Math.min(1, ((x - cx) * ux + (y - cy) * uy) / 3)); h = Math.max(frm(h), greyH + 0.05); } } // `P.dioCimaCut` (test-only mutation): the D31 camera-side cut restored
      else if (type === 'mirador' && corr) { /* D32 Mirador v7: a raised platform (the footprint, +1 terH over the landing), NO walls; it OPENS toward the BACKGROUND of the fixed reference camera (the plain falls away there and the landmark stands in it) and is CLOSED on the camera side by the hugging skirt, never open toward the camera */
        const de = effD.has(j) ? effD.get(j) : d, wcam = Math.max(0, Math.min(1, ((x - cx) * ux + (y - cy) * uy) / 3)), hnn = hn0(j), sk = greyH + (hnn - greyH) * (1 - de / (De + 1)), hp = Math.max(greyH + 0.15, plain + (hnn - plain) * Math.max(0, 1 - de / 4));
        if (fill.has(j)) h = hnn; else { h = hp + (Math.max(sk, hp) - hp) * wcam; r = 2;
          if (rockAt.has(j)) { h = rockAt.get(j); cliff[k] = 1; } else if (pondAt.has(j)) { r = 4; h = plain - 0.5 * terH; } else h = Math.max(frm(h), greyH + 0.05); } }
      else if (type === 'cima') { const span = Math.max(0, top - greyH); h = greyH + span * (1 - d / (D + 1)); h = h + (Math.min(h, greyH + span / 3) - h) * cw3; h = Math.max(frm(h), greyH + 0.05); }
      else if (type === 'arena') { const rim = top + 2.5 * terH; h = top + (rim - top) * Math.min(1, d / 6); h = h + (Math.min(h, top + 0.3) - h) * cw3; h = Math.max(frm(h), greyH + 0.05); }
      else { const proj = (x - cx) * f[0] + (y - cy) * f[1], perp = Math.abs((x - cx) * -f[1] + (y - cy) * f[0]);
        if (proj < 0) h = top + 1.5 * terH * Math.min(1, d / 2); else { const low = greyH - 1.5 * terH; h = top + (low - top) * Math.min(1, d / 3); cliff[k] = 1; if (perp <= 3) h = Math.min(h, low); } // the whole drop side (the free half: the fall within 3 rings, the notch, the chasm floor) is the DECLARED cliff face, exempt from the slope cap
        h = frm(h); }
      if (corr && r === 2 && P.dioSnap !== false) h = Math.floor(h / (0.25 * terH) + 1e-9) * 0.25 * terH; // D32: pocket heights snap DOWN to 0.25 terH (fewer levels); the footprint and the bridges keep their exact heights
      heights[k] = h; roles[k] = r; }
    const at = new Map(it.pocket.map((j, k) => [j, k])); let slopeMax = 0, slopeNoCliff = 0, pmax = -1e9, pmin = 1e9;
    for (let k = 0; k < N; k++) { const j = it.pocket[k]; if (roles[k] === 2) { if (heights[k] > pmax) pmax = heights[k]; if (heights[k] < pmin) pmin = heights[k]; } for (const q of [j + 1, j + W]) { const k2 = at.get(q); if (k2 === undefined || (q === j + 1 && (q % W) === 0)) continue; const d = Math.abs(heights[k] - heights[k2]); if (d > slopeMax) slopeMax = d; if (!cliff[k] && !cliff[k2] && d > slopeNoCliff) slopeNoCliff = d; } }
    const dsl = P.dioSlope !== undefined ? P.dioSlope : T.DIO_SLOPE; let ok = true, why = '';
    slopeMax /= terH; slopeNoCliff /= terH; // in terraces (terH units) per tile
    if (slopeNoCliff > dsl + 1e-9) { ok = false; why = `pocket ${type}: slope ${slopeNoCliff.toFixed(2)} terraces per tile > cap ${dsl}`; }
    else if (type === 'cima' && pmax >= top - 1e-6) { ok = false; why = 'pocket cima: the pocket reaches the footprint top'; }
    else if (corr && type === 'mirador' && !hito) { ok = false; why = 'pocket mirador: no room for the landmark (7 tiles from every bridge and landing, 9 x 9 tiles of pocket on the background axis)'; }
    return { flat, hito, type, dz, fpH, bridgeH, heights, roles, cliff, Href, top, min: mn, greyH, slopeMax: +slopeMax.toFixed(2), slopeNoCliff: +slopeNoCliff.toFixed(2), pocketMax: pmax, pocketMin: pmin, ok, why };
  };
  /* DIAGNOSTIC (D32): the pocket tiles that stand as ONE-TILE COLUMNS beside the structure ("stumps"): a decoration tile at least 0.4 terH over at least 5 of its 8 neighbours (footprint, bridge and decoration tiles), the landmark, the pond and the DECLARED cliff face of a Quebrada (its drop side is a feature, not a stump) excluded; and the "holes" of the landmark: decoration tiles
     of the pocket of which at least 6 of 8 neighbours are rock tiles but that are not rock themselves (a pit at the base of the spire). Returns { stumps: [tile], holes: [tile] }; nothing is drawn or changed by it. */
  T.dioStumps = function (S, P, it) {
    const W = S.W, pf = it.prof, terH = P.terH, H = new Map(), rock = new Set(), D8 = [1, -1, W, -W, W + 1, W - 1, -W + 1, -W - 1];
    it.dst.forEach((j, k) => H.set(j, pf.fpH[k])); for (const [j, h] of pf.bridgeH) H.set(j, h); it.pocket.forEach((j, k) => { if (pf.roles[k] === 2) H.set(j, pf.heights[k]); });
    if (pf.hito) { for (const j of pf.hito.tiles) rock.add(j); if (pf.hito.pond) for (const j of pf.hito.pond.tiles) rock.add(j); }
    const stumps = [], holes = []; it.pocket.forEach((j, k) => { if (pf.roles[k] !== 2 || rock.has(j) || (pf.cliff && pf.cliff[k] && !(pf.hito))) return; let n = 0, hi = 0, nr = 0; for (const d of D8) { const v = H.get(j + d); if (rock.has(j + d)) nr++; if (v === undefined) continue; n++; if (pf.heights[k] - v >= 0.4 * terH) hi++; } if (n >= 5 && hi >= 5) stumps.push(j); if (nr >= 6) holes.push(j); });
    return { stumps, holes }; };
  /* FRAMING of the connecting paths (D31): the share of the footprint perimeter (the edges that do not face the bridge) whose outside tile is pocket, and the share of both sides of the bridge (the 4-neighbours of the bridge outside the footprint, the landing and the bridge) that are pocket */
  T.dioFraming = function (S, it, chainSet) {
    const W = S.W, H = S.H, dst = new Set(it.dst), pk = new Set(it.pocket), br = new Set((it.bridges || [it.bridge]).flatMap((b2) => [...b2.inner, ...b2.lat])), land = new Set(it.landing), O = [[1, 0], [-1, 0], [0, 1], [0, -1]]; let pe = 0, pc = 0, pw = 0, bs = 0, bc = 0;
    for (const j of it.dst) { const x = j % W, y = (j / W) | 0; for (const [dx, dy] of O) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const q = ny * W + nx; if (dst.has(q) || br.has(q)) continue; if (chainSet && !pk.has(q) && S.roomMap[q] > 0 && chainSet.has(S.roomMap[q]) && !(S.roomMap[q] === it.room)) { pw++; continue; } pe++; if (pk.has(q)) pc++; } }
    const seen = new Set(); for (const j of br) { const x = j % W, y = (j / W) | 0; for (const [dx, dy] of O) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const q = ny * W + nx; if (br.has(q) || dst.has(q) || land.has(q) || seen.has(q)) continue; seen.add(q); if (chainSet && !pk.has(q) && S.roomMap[q] > 0 && chainSet.has(S.roomMap[q]) && S.roomMap[q] !== it.room) continue; bs++; if (pk.has(q)) bc++; } }
    return { perimeter: pe ? +(100 * pc / pe).toFixed(1) : null, perimeterEdges: pe, perimeterAgainstChain: pw, bridgeSides: bs ? +(100 * bc / bs).toFixed(1) : null, bridgeSideTiles: bs };
  };

  /* ANALYTIC LINE OF SIGHT (DAC v2 PR C2, D31): the share of the footprint tiles visible from a camera, over a height map, without rendering: from the centre of a tile at its top the ray goes toward the camera (ground direction (sin yaw, cos yaw), rising tan(pitch) per tile, the orthographic cameras of the bank) and the tile is hidden if any tile along it is higher than the ray.
     `heightOf(t)` (-Infinity for void), `tiles` and `tops` (parallel: the height of the point of each tile). The reference camera is FIXED (Cam 1: yaw 45, pitch 35; T.DIO_REF_YAW / T.DIO_REF_PITCH): the plan never depends on the active camera. It was validated against the Box pick render (tools/ui/measure_dio_los.js, D31). */
  T.DIO_REF_PITCH = 35; T.DIO_VIS = false; T.DIO_VIS_MIN = 0.95; // DROPPED by the user's 2-point rule: the analytic test disagrees with the Box pick render by up to 4.3 points (tools/ui/measure_dio_los.js, D31), so the criterion is OFF (the smallest valid shift is taken); P.dioVis: true re-enables it for diagnostics
  T.dioLOS = function (W, H, heightOf, tiles, tops, yawDeg, pitchDeg, maxH) {
    const yaw = (yawDeg === undefined ? T.DIO_REF_YAW : yawDeg) * Math.PI / 180, pit = (pitchDeg === undefined ? T.DIO_REF_PITCH : pitchDeg) * Math.PI / 180, dx = Math.sin(yaw), dy = Math.cos(yaw), tn = Math.tan(pit); let vis = 0;
    for (let k = 0; k < tiles.length; k++) { const t = tiles[k], x0 = (t % W) + 0.5, y0 = ((t / W) | 0) + 0.5, h0 = tops[k]; let hid = false;
      for (let s = 0.5; s <= 80; s += 0.5) { const rh = h0 + s * tn; if (maxH !== undefined && rh > maxH) break; const x = x0 + dx * s, y = y0 + dy * s, ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; const q = iy * W + ix; if (q === t) continue; if (heightOf(q) > rh + 1e-6) { hid = true; break; } }
      if (!hid) vis++; }
    return tiles.length ? vis / tiles.length : 0;
  };
})(window.EVO = window.EVO || {});
