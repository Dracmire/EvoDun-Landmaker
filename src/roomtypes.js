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
  T.roomChain = function (S, P, stakeTile, goalTile, mode) {
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
  /* WALKABLE CHECK (user, 2026-10-20): the chain must be walkable using only the tiles of the rooms of the chain and without crossing a blocked edge: a BFS from the stake over the walking graph restricted to those tiles. { ok, length } (length in tiles, -1 if not). */
  T.chainWalk = function (S, P, chain, stakeTile, goalTile) {
    const nb = E.walkGraph(S, P), pc = T.pieces(S, P), rooms = new Set(chain.rooms), bl = new Set(chain.blocked.map(([a, b]) => rkey(a, b))), node = chain.mode === 'room' ? (i) => S.roomMap[i] : (i) => pc.id[i];
    if (!rooms.has(S.roomMap[stakeTile]) || !rooms.has(S.roomMap[goalTile])) return { ok: false, length: -1 };
    const dist = new Int32Array(S.n).fill(-1), q = [stakeTile]; dist[stakeTile] = 1;
    for (let h = 0; h < q.length; h++) { const i = q[h]; if (i === goalTile) break; for (const j of nb(i).slice()) { if (dist[j] >= 0 || !rooms.has(S.roomMap[j])) continue; const a = node(i), b = node(j); if (a !== b && bl.has(rkey(a, b))) continue; dist[j] = dist[i] + 1; q.push(j); } }
    return { ok: dist[goalTile] >= 0, length: dist[goalTile] };
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
    const first = rooms.map((id, k) => rooms.indexOf(id)), a = relabel(v164.slice()), b = relabel(route.map((x) => x.type)); for (const arr of [a, b]) for (let k = 0; k < arr.length; k++) if (first[k] !== k) arr[k] = arr[first[k]]; // a room that appears twice has ONE type, the one of its first visit
    const use = rule === 'route' ? b : a, map = new Map(), ters = new Set([S.ter[stakeTile], S.ter[goalTile]]); for (let k = 0; k + 1 < nodes.length; k++) { const dt = doorTer(nodes[k], nodes[k + 1]); ters.add(dt.ta); ters.add(dt.tb); }
    rooms.forEach((id, k) => { if (first[k] !== k) return; const o = ty.rooms.get(id); if (!o || o.type !== use[k]) map.set(id, { type: use[k], up: rule === 'route' && route[k].up }); else if (rule === 'route') map.set(id, { type: use[k], up: route[k].up }); });
    return { map, counts: cnt(use), v164: cnt(a), route: cnt(b), v164Raw: cnt(v164), routeRaw: cnt(route.map((x) => x.type)), types: use, terraces: [...ters].sort((x, y) => x - y), relabeled: rooms.filter((id, k) => (rule === 'route' ? route[k].type : v164[k]) === T.DIORAMA && use[k] === T.ASCENSION).length };
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
})(window.EVO = window.EVO || {});
