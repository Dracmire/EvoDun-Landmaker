/* EvoDun crystal viewer - level shaping: terraces, sub-terraces, passes, walk regions */
(function (E) {
  const N4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function comps(W, H, val, grp) {
    const id = new Int32Array(W * H).fill(-1), list = [], st = [];
    for (let s = 0; s < W * H; s++) {
      if (id[s] >= 0) continue;
      const c = list.length, l = [s];
      id[s] = c; st.length = 0; st.push(s);
      while (st.length) {
        const i = st.pop(), x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of N4) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (id[j] >= 0 || val[j] !== val[s] || grp[j] !== grp[s]) continue;
          id[j] = c; l.push(j); st.push(j);
        }
      }
      list.push(l);
    }
    return { id, list };
  }

  /* merge tiny equal-value regions into the majority neighbour (minimum plateau width) */
  function cleanup(W, H, val, grp, minArea) {
    if (minArea <= 1) return;
    for (let pass = 0; pass < 8; pass++) {
      const { list } = comps(W, H, val, grp);
      let changed = false;
      for (const l of list) {
        if (l.length >= minArea) continue;
        const g = grp[l[0]], v0 = val[l[0]], cnt = new Map();
        for (const i of l) {
          const x = i % W, y = (i / W) | 0;
          for (const [dx, dy] of N4) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const j = ny * W + nx;
            if (grp[j] !== g || val[j] === v0) continue;
            cnt.set(val[j], (cnt.get(val[j]) || 0) + 1);
          }
        }
        if (!cnt.size) continue;
        let best = null, bc = -1;
        for (const [v, c] of cnt) {
          if (c > bc || (c === bc && Math.abs(v - v0) < Math.abs(best - v0))) { best = v; bc = c; }
        }
        for (const i of l) val[i] = best;
        changed = true;
      }
      if (!changed) break;
    }
  }

  function blur3(a, W, H) {
    const o = new Float32Array(a.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        s += a[ny * W + nx]; c++;
      }
      o[y * W + x] = s / c;
    }
    return o;
  }

  /* Effective sub-terrace height. The gap from the last sub-terrace of a terrace to the base of the next one,
     terH - (subs - 1) * subH, must exceed the climb limit by half a sub-step, so that a stair always has a visible
     rise: subH_eff = min(subH, terH / (subs + climb - 0.5)). */
  E.subHeight = function (P) { return Math.min(P.subH, P.terH / (P.subs + P.climb - 0.5)); };

  /* Height of the bottom of terrace t. P.spread (Height spread, 1 = uniform) widens the jump between neighbouring terraces
     the farther it is from the central terrace c (the one with most tiles on the whole map): the jump j -> j+1 is
     terH * (1 + (spread - 1) * T(min(d - 1, 2))) with d = distance of that jump from c (1 = next to it) and T = 0, 1, 3, so with
     spread 1.5 the jumps are 1, 1.5, 2.5, 2.5, ... times terH. Without c, or with spread 1, terraces are t * terH. */
  E.terGap = function (j, P, c) {
    const sp = P.spread === undefined ? 1 : P.spread;
    if (!(sp > 1) || c === undefined) return P.terH;
    const d = j >= c ? j - c + 1 : c - j, k = Math.min(d - 1, 2);
    return P.terH * (1 + (sp - 1) * [0, 1, 3][k]);
  };
  E.terBase = function (t, P, c) {
    if (!(P.spread > 1) || c === undefined) return t * P.terH;
    let h = 0; for (let j = 0; j < t; j++) h += E.terGap(j, P, c);
    return h;
  };
  E.hOf = function (fine, P, c) {
    const K = P.subs;
    return E.terBase(Math.floor(fine / K), P, c) + (fine % K) * E.subHeight(P);
  };

  /* ---- slice: the tiles of the incursion, and the window that gets built (slice + scenery margin) ---- */
  function zoneIdsForSlice(pack) {
    const z = pack.fields && pack.fields.zone; if (!z) return null;
    if (!z.sliceIds) z.sliceIds = E.fillUnassigned(z.ids, pack.width, pack.height); // -1 never opens holes
    return z.sliceIds;
  }

  /* spec: { zones: [ids], rect: [x0, y0, x1, y1] (x1, y1 exclusive), margin }. null = the whole map is the slice.
     Returns { mask (map-sized), x0, y0, x1, y1 (window, x1/y1 exclusive), bbox, tiles }. */
  E.sliceOf = function (pack, spec) {
    if (!spec || (!(spec.zones && spec.zones.length) && !(spec.rooms && spec.rooms.length) && !spec.rect)) return null;
    const W = pack.width, H = pack.height, mask = new Uint8Array(W * H);
    if (spec.rooms && spec.rooms.length && spec.roomMap) { // rooms (rooms switch on) choose the slice, like zones
      const set = new Set(spec.rooms); for (let i = 0; i < mask.length; i++) mask[i] = set.has(spec.roomMap[i]) ? 1 : 0;
    } else if (spec.zones && spec.zones.length) {
      const ids = zoneIdsForSlice(pack), set = new Set(spec.zones);
      if (!ids) throw new Error('This pack has no zone field: assign the zone role first.');
      for (let i = 0; i < mask.length; i++) mask[i] = set.has(ids[i]) ? 1 : 0;
    } else mask.fill(1);
    if (spec.rect) {
      const [rx0, ry0, rx1, ry1] = spec.rect;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < rx0 || x >= rx1 || y < ry0 || y >= ry1) mask[y * W + x] = 0;
    }
    let tiles = 0, bx0 = W, by0 = H, bx1 = 0, by1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      tiles++; if (x < bx0) bx0 = x; if (x + 1 > bx1) bx1 = x + 1; if (y < by0) by0 = y; if (y + 1 > by1) by1 = y + 1;
    }
    if (!tiles) throw new Error('The slice is empty: no tile matches the selected zones and crop.');
    const m = spec.margin === undefined || spec.margin === null ? 24 : Math.max(0, spec.margin | 0);
    return { mask, tiles, bbox: { x0: bx0, y0: by0, x1: bx1, y1: by1 }, x0: Math.max(0, bx0 - m), y0: Math.max(0, by0 - m), x1: Math.min(W, bx1 + m), y1: Math.min(H, by1 + m) };
  };

  /* Pieces of each zone (4-neighbour contiguity, on the ids used for slicing). Cached on the pack.
     Returns Map id -> { pieces, largest, total }. */
  E.zonePieces = function (pack) {
    const z = pack.fields && pack.fields.zone; if (!z) return new Map();
    if (z.pieces) return z.pieces;
    const ids = zoneIdsForSlice(pack), W = pack.width, H = pack.height, seen = new Uint8Array(ids.length), out = new Map(), stack = [];
    for (let s0 = 0; s0 < ids.length; s0++) {
      const id = ids[s0]; if (id <= 0 || seen[s0]) continue;
      let size = 0; seen[s0] = 1; stack.push(s0);
      while (stack.length) {
        const i = stack.pop(), x = i % W, y = (i / W) | 0; size++;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j >= 0 && !seen[j] && ids[j] === id) { seen[j] = 1; stack.push(j); }
        }
      }
      const r = out.get(id) || { pieces: 0, largest: 0, total: 0 };
      r.pieces++; r.total += size; if (size > r.largest) r.largest = size; out.set(id, r);
    }
    return (z.pieces = out);
  };

  function cropArr(a, W, x0, y0, w, h) {
    const o = Array.isArray(a) ? new Array(w * h) : new a.constructor(w * h);
    for (let y = 0; y < h; y++) {
      const src = (y + y0) * W + x0;
      if (a.subarray) o.set(a.subarray(src, src + w), y * w); else for (let x = 0; x < w; x++) o[y * w + x] = a[src + x];
    }
    return o;
  }

  function cropPack(pack, sl) {
    const W = pack.width, x0 = sl.x0, y0 = sl.y0, w = sl.x1 - x0, h = sl.y1 - y0, c = (a) => cropArr(a, W, x0, y0, w, h);
    const masks = {}; for (const [k, v] of Object.entries(pack.masks || {})) masks[k] = c(v);
    const fields = {};
    for (const [k, f] of Object.entries(pack.fields || {})) {
      if (f.ids) { fields[k] = { ids: c(f.ids), amb: c(f.amb), info: f.info }; if (f.sliceIds) fields[k].sliceIds = c(f.sliceIds); }
      else fields[k] = { values: c(f.values) };
    }
    const markers = (pack.markers || []).filter((m) => m.x >= x0 && m.x < sl.x1 && m.y >= y0 && m.y < sl.y1).map((m) => Object.assign({}, m, { x: m.x - x0, y: m.y - y0 }));
    return { name: pack.name, width: w, height: h, elevation: c(pack.elevation), elevRange: pack.elevRange, masks, markers, fields };
  }

  /* Void: elevation <= 0 is NOT terrain (a black pixel of the height image), never a low terrace. landFill returns the elevation with every
     void tile replaced by the value of the nearest land tile (4-neighbour distance, so smoothing and slopes do not see a cliff at the coast),
     the void mask and the range [lowest land, highest land]. Without void tiles (or without land) `void` is null and `el` is the input itself. */
  E.landFill = function (elev, W, H) {
    const n = W * H; let land = 0, mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { const v = elev[i]; if (v > 0) { land++; if (v < mn) mn = v; if (v > mx) mx = v; } }
    if (land === 0 || land === n) return { el: elev, void: null, range: land ? [mn, mx] : null };
    const el = Float32Array.from(elev), vd = new Uint8Array(n), done = new Uint8Array(n); let q = [];
    for (let i = 0; i < n; i++) if (elev[i] > 0) { done[i] = 1; q.push(i); } else vd[i] = 1;
    while (q.length) {
      const next = [];
      for (const i of q) { const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!done[j]) { done[j] = 1; el[j] = el[i]; next.push(j); } } }
      q = next;
    }
    return { el, void: vd, range: [mn, mx] };
  };

  /* Terraces and sub-terraces of the WHOLE map (U = raw-range position after pre-smoothing), cached on the pack by the
     shaping parameters and then cropped to the window, so a slice never changes them. */
  function quantize(full, P) {
    const key = [P.terraces, P.subs, P.minPlateau, P.minSub, P.pre].join('|');
    if (full._q && full._q.key === key) return full._q;
    const W = full.width, H = full.height, n = W * H, N = P.terraces, K = P.subs;
    const lf = E.landFill(full.elevation, W, H), vd = lf.void;
    let el = Float32Array.from(lf.el);
    for (let p = 0; p < P.pre; p++) el = blur3(el, W, H);
    let mn = Infinity, mx = -Infinity;
    if (vd) { mn = lf.range[0]; mx = lf.range[1]; } // terraces over the land only
    else if (full.elevRange) { mn = full.elevRange[0]; mx = full.elevRange[1]; }
    else for (const v of el) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const U = new Float32Array(n), ter = new Int16Array(n), sub = new Int16Array(n), g0 = new Int16Array(n);
    if (vd) for (let i = 0; i < n; i++) if (vd[i]) g0[i] = 1; // void never votes in, nor merges into, a land plateau
    for (let i = 0; i < n; i++) {
      U[i] = Math.max(0, (el[i] - mn) / (mx - mn || 1) * N);
      ter[i] = Math.min(N - 1, Math.floor(U[i]));
    }
    cleanup(W, H, ter, g0, P.minPlateau);
    for (let i = 0; i < n; i++) {
      const t0 = Math.min(N - 1, Math.floor(U[i]));
      if (K <= 1) sub[i] = 0;
      else if (ter[i] === t0) sub[i] = Math.min(K - 1, Math.floor((U[i] - t0) * K));
      else sub[i] = ter[i] > t0 ? 0 : K - 1;
    }
    if (vd) { const g1 = new Int16Array(n); for (let i = 0; i < n; i++) g1[i] = ter[i] + (vd[i] ? 1000 : 0); cleanup(W, H, sub, g1, P.minSub); } else cleanup(W, H, sub, ter, P.minSub);
    const cnt = new Int32Array(N); for (let i = 0; i < n; i++) if (!vd || !vd[i]) cnt[ter[i]]++;
    let center = 0; for (let t = 1; t < N; t++) if (cnt[t] > cnt[center]) center = t; // the terrace with most land tiles on the whole map (ties: the lower)
    return (full._q = { key, U, ter, sub, trans: {}, range: [mn, mx], center, void: vd, raw: lf.el });
  }
  E.quantize = quantize;

  /* pack: the whole map; spec: see E.sliceOf (omit for the whole map as one slice). Terraces use the global
     elevation range of the whole map (pack.elevRange when present), so they do not depend on the window. */
  E.shape = function (full, P, spec) {
    const RL = P.rooms && E.rooms ? E.rooms.layer(full, P) : null; // rooms on: the global tree gives the gates, sub-terraces are only visual
    if (RL && spec && spec.rooms && spec.rooms.length) spec = Object.assign({}, spec, { roomMap: RL.room });
    let pocketIds = null, seedIds = null; // POCKET (Pocket view, P.pocket): a Diorama room as the slice is drawn as its pocket; the window grows to hold the whole disc
    if (RL && E.pocket && P.pocket && spec && spec.rooms && spec.rooms.length === 1) {
      const pd = P._padded, o = pd ? { id: spec.rooms[0], tiles: pd.tiles, type: E.roomTypes.DIORAMA } : E.roomTypes.classify(RL, P).rooms.get(spec.rooms[0]);
      if (o && o.type === E.roomTypes.DIORAMA) {
        pocketIds = [o.id]; seedIds = pd ? pd.seedIds : [o.id];
        if (!pd && E.pocket.overflows(RL, o)) { // the disc leaves the map: build everything on a copy with a border of void (pseudo-space) and the same room there
          const pad = E.pocket.margin(o.tiles), pf = E.pocket.padPack(full, pad), RL2 = E.rooms.layer(pf, P), id2 = E.pocket.matchRoom(RL, RL2, o.id, pad);
          if (id2 > 0) { const S2 = E.shape(pf, Object.assign({}, P, { _padded: { pad, seedIds: [o.id], tiles: o.tiles } }), Object.assign({}, spec, { rooms: [id2] })); S2.pad = pad; return S2; }
        }
        spec = Object.assign({}, spec, { margin: Math.max(spec.margin === undefined || spec.margin === null ? 24 : spec.margin, E.pocket.margin(o.tiles)) });
      }
    }
    const sl = E.sliceOf(full, spec), pack = sl ? cropPack(full, sl) : full;
    const W = pack.width, H = pack.height, n = W * H, N = P.terraces, K = P.subs;
    const q = quantize(full, P);
    const U = sl ? cropArr(q.U, full.width, sl.x0, sl.y0, W, H) : q.U;
    const ter = sl ? cropArr(q.ter, full.width, sl.x0, sl.y0, W, H) : q.ter;
    const sub = sl ? cropArr(q.sub, full.width, sl.x0, sl.y0, W, H) : q.sub;
    const vd = q.void ? (sl ? cropArr(q.void, full.width, sl.x0, sl.y0, W, H) : q.void) : null; // void: not terrain, not drawn, not walkable
    const fine = new Int16Array(n);
    let maxFine = 0;
    for (let i = 0; i < n; i++) { fine[i] = ter[i] * K + sub[i]; if ((!vd || !vd[i]) && fine[i] > maxFine) maxFine = fine[i]; }
    for (let i = 0; i < n; i++) if (fine[i] > maxFine) fine[i] = maxFine; // void tiles only need a valid index
    const byLevel = Array.from({ length: maxFine + 1 }, () => []);
    for (let i = 0; i < n; i++) if (!vd || !vd[i]) byLevel[fine[i]].push(i);
    // `fine` is a level index: levels are ranked by height. levelH[L] is the height of level L and levelMeta[L]
    // says where it comes from (terrace, sub-terrace; bridge levels are added by the stair carving).
    const levelH = new Array(maxFine + 1), levelMeta = new Array(maxFine + 1);
    for (let L = 0; L <= maxFine; L++) { levelH[L] = E.hOf(L, P, q.center); levelMeta[L] = { ter: Math.floor(L / K), sub: L % K, bridge: false }; }
    const masks = pack.masks || {};
    const S = {
      W, H, n, U, ter, sub, fine, maxFine, byLevel, levelH, levelMeta, subs: K, N, center: q.center, void: vd,
      water: masks.water || new Array(n).fill(0),
      snake: masks.snake || null, cave: masks.cave || null, waterfall: masks.waterfall || null,
      markers: pack.markers || [], name: pack.name, fields: pack.fields || {}, cache: {},
      mapW: full.width, mapH: full.height, ox: sl ? sl.x0 : 0, oy: sl ? sl.y0 : 0,
      slice: null, sliceBox: null, border: null, sliceLoops: null, sliceInfo: null
    };
    if (vd) { S.fineMask = Int16Array.from(fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1; } // level membership: void belongs to no level
    S.block = new Uint8Array(n); // not walkable: water, or outside the slice
    for (let i = 0; i < n; i++) S.block[i] = S.water[i] || (vd && vd[i]) ? 1 : 0;
    if (sl) {
      const mask = cropArr(sl.mask, full.width, sl.x0, sl.y0, W, H), b = sl.bbox;
      S.slice = mask;
      S.sliceBox = { x0: b.x0 - sl.x0, y0: b.y0 - sl.y0, x1: b.x1 - sl.x0, y1: b.y1 - sl.y0 };
      S.border = new Uint8Array(n); // per tile bits N=1 E=2 S=4 W=8: that side faces outside the slice (or the window)
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (!mask[i]) { S.block[i] = 1; continue; }
        if (y === 0 || !mask[i - W]) S.border[i] |= 1;
        if (x === W - 1 || !mask[i + 1]) S.border[i] |= 2;
        if (y === H - 1 || !mask[i + W]) S.border[i] |= 4;
        if (x === 0 || !mask[i - 1]) S.border[i] |= 8;
      }
      // colour of each border face from the edge map: red if the slice tile or its partner (the tile across the face, in the
      // whole map) is a barrier, cyan if one is a pass and none a barrier, yellow if neither is marked, white at the map edge
      const ef = full.fields && full.fields.edge, labels = new Map(); if (ef) for (const c of ef.info.classes) labels.set(c.id, c.label);
      const kindAt = (fx, fy) => { if (!ef) return 0; const id = ef.ids[fy * full.width + fx], l = id > 0 ? labels.get(id) : null; return l === 'barrier' ? 1 : l === 'pass' ? 2 : 0; };
      S.borderKind = new Uint8Array(n * 4); S.borderInfo = { barrier: 0, pass: 0, none: 0, mapEdge: 0 };
      const OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (let i = 0; i < n; i++) for (let b = 0; b < 4; b++) {
        if (!(S.border[i] >> b & 1)) continue;
        const fx = sl.x0 + (i % W), fy = sl.y0 + ((i / W) | 0), nx = fx + OFF[b][0], ny = fy + OFF[b][1];
        let kind;
        if (nx < 0 || ny < 0 || nx >= full.width || ny >= full.height) kind = 4;
        else { const k1 = kindAt(fx, fy), k2 = kindAt(nx, ny); kind = k1 === 1 || k2 === 1 ? 1 : k1 === 2 || k2 === 2 ? 2 : 3; }
        S.borderKind[i * 4 + b] = kind; S.borderInfo[['', 'barrier', 'pass', 'none', 'mapEdge'][kind]]++;
      }
      S.sliceLoops = E.maskLoops(W, H, (x, y) => mask[y * W + x] === 1);
      const warnings = [];
      if (spec.zones && spec.zones.length) {
        const pieces = E.zonePieces(full);
        for (const id of spec.zones) {
          const p = pieces.get(id);
          if (p && p.pieces > 1) warnings.push(`Zone ${id} is not contiguous (4-neighbour): ${p.pieces} pieces, the largest has ${p.largest} of ${p.total} tiles. Left as is.`);
        }
      }
      S.sliceInfo = { tiles: sl.tiles, window: { x0: sl.x0, y0: sl.y0, w: W, h: H }, bbox: b, zones: spec.zones ? spec.zones.slice() : [], rooms: spec.rooms ? spec.rooms.slice() : [], rect: spec.rect || null, warnings };
    }
    S.rooms = RL; S.subFree = !!RL;
    if (RL) { computeGatesRooms(S, P, full, RL, sl); computeRoomFaces(S, full, RL); } else computeGates(S, P, full, q);
    const snap = RL ? { fine: S.fine.slice(), levelH: S.levelH.slice(), levelMeta: S.levelMeta.slice(), maxFine: S.maxFine, byLevel: S.byLevel.map((a) => a.slice()) } : null;
    const build = () => { for (const c of S.conns || []) if (c.old) { c.path = c.old; c.old = null; } /* a re-carve starts again from the tree paths, not from an earlier recompute */ carveStairs(S, P); if (RL) checkConnections(S, P); computeRegions(S, P); if (RL) classifyWalk(S, P, RL); };
    build();
    /* rooms on, repeated until nothing changes (at most 6 times):
       - MERGE BY passGap: a connection that crosses a pair merged into a ramp at another pair and has no route even after the recompute: that pair is NOT merged,
         it gets its own ramp (with the usual variants). The merge stays when the recompute finds a route.
       - a ramp that ends up entirely inside ISOLATED terrain is not built (its site is dropped). */
    S.unmerged = 0; S.exactRetry = 0; S.isoRampsDropped = 0; S.retryBroke = 0;
    for (let tries = 0; RL && tries < 6; tries++) {
      const have = new Set(S.passes.map((x) => x.a * S.n + x.b)), add = [];
      if (P.noUnmerge !== true && P.rampKeep !== false) for (const c of S.conns) if (c.status === 'unresolved' && c.reason === 'gate pair merged into a ramp at another pair') {
        const [u, v] = c.fail, lo = S.ter[u] < S.ter[v] ? u : v, hi = lo === u ? v : u; if (have.has(lo * S.n + hi)) continue; const site = S.makeSite(lo, hi); if (site) { have.add(lo * S.n + hi); add.push(site); }
      }
      if (P.noUnmerge !== true && P.rampKeep !== false) for (const c of S.conns) if (c.status === 'unresolved' && c.reason === 'gate pair carved at another pair of its gate') {
        const site = S.passes.find((x) => !x.exact && ((x.a === c.fail[0] && x.b === c.fail[1]) || (x.a === c.fail[1] && x.b === c.fail[0]))); if (site) { site.exact = true; S.exactRetry = (S.exactRetry || 0) + 1; add.push(null); } // its ramp went to another pair: try only its own pair
      }
      const useless = S.stairs.filter((rec) => rec.steps.every((st) => st.tiles.every((t) => S.isolated[t])) && rec.bottom.every((t) => S.isolated[t]) && rec.top.every((t) => S.isolated[t]));
      if (!add.length && !useless.length) break;
      const okBefore = S.conns.map((c) => c.status === 'ok');
      for (const rec of useless) rec.site.noRamp = true;
      for (const site of add) if (site) S.passes.push(site);
      S.fine.set(snap.fine); S.levelH = snap.levelH.slice(); S.levelMeta = snap.levelMeta.slice(); S.maxFine = snap.maxFine; S.byLevel = snap.byLevel.map((a) => a.slice()); refreshMask(S);
      build(); S.retryBroke += S.conns.reduce((a, c, i) => a + (okBefore[i] && c.status !== 'ok' ? 1 : 0), 0); S.unmerged += add.filter(Boolean).length; S.isoRampsDropped += useless.length;
    }
    if (RL && E.roomTypes) { // room types (classification always, tint and info) and the Cake geometry (P.cake): after the stairs, before the levels are counted
      const ty = E.roomTypes.classify(RL, P); S.types = ty; S.roomType = new Uint8Array(n);
      for (let i = 0; i < n; i++) if (!(vd && vd[i])) S.roomType[i] = ty.type[(((i / W) | 0) + S.oy) * S.mapW + (i % W) + S.ox] || 0;
      if (P.cake) E.roomTypes.cake(S, P, RL, q, ty);
    }
    if (pocketIds) E.pocket.apply(S, P, RL, pocketIds, { ids: seedIds }); // the pocket of a Diorama: the fragment stays, the surroundings change
    const terSeen = new Set(), fineSeen = new Set(); // distinct levels inside the slice (the whole window if there is none)
    for (let i = 0; i < n; i++) if ((!S.slice || S.slice[i]) && !(vd && vd[i])) { terSeen.add(S.ter[i]); fineSeen.add(S.fine[i]); }
    S.levelCount = { terraces: terSeen.size, levels: fineSeen.size };
    { let lt = 0; for (let i = 0; i < n; i++) if ((!S.slice || S.slice[i]) && !(vd && vd[i])) lt++; S.landTiles = lt; } // land tiles of the slice (or the map)
    return S;
  };

  /* Terrace transitions, a transcription of the user's EDunProcGen.cs (NormalizeHeightsPerTerrace,
     ComputeTerraceSlopeMap, FindRankedTerraceTransitions, FilterConnectedTerraceTransitions) on the WHOLE map and the
     RAW elevation (the "same room" condition is omitted: there are no rooms).
       - per unit u (terrace): min/max of the raw elevation over its tiles; norm_u = (h-min)/(max-min) on u, 0 elsewhere
         (range <= 0.0001 -> 1);
       - slope = sqrt(dx^2 + dy^2), central differences * 0.5 on the whole norm_u (tiles of other units count 0);
         the 1-tile frame of the map is skipped (slope 0);
       - for every 4-neighbour pair exactly one terrace apart, pos = the LOW tile; transition if
         slope_low[pos] - slope_high[pos] > threshold (no absolute value); each pos once;
       - transitions are grouped by 4-connectivity (all together) and groups smaller than the minimum are dropped.
     kind 'sub' is OUR EXTENSION: the same rule with the sub-terrace as the unit, for pairs in the same terrace that
     differ by more than the climb limit (steps that cannot be walked); groups of their own.
     Returns { partner: Int32Array (upper tile of each transition pos, -1 if none), groups: [{ tiles, size }] }. */
  function transitions(full, q, P, kind) {
    const thr = P.gateThr === undefined ? 0.05 : P.gateThr, minSize = P.gateMin === undefined ? 3 : P.gateMin, K = P.subs;
    const key = `${kind}|${thr}|${minSize}|${P.climb}|band`;
    if (q.trans[key]) return q.trans[key];
    const W = full.width, H = full.height, n = W * H, raw = q.raw || full.elevation; // void filled with the nearest land value
    const unit = new Int32Array(n), nU = P.terraces * (kind === 'sub' ? K : 1);
    for (let i = 0; i < n; i++) unit[i] = kind === 'sub' ? q.ter[i] * K + q.sub[i] : q.ter[i];
    /* DEVIATION from the user's code: each unit is normalized with its NOMINAL band of the global elevation range
       (clamped to 0..1), not with the min/max of its tiles. Here the plateau cleanup and the pre-smoothing move a few tiles
       into a terrace whose raw height is far outside its band; those outliers stretch min/max (3-4x on a real map) and
       flatten the slopes, which left whole terrace borders without gates. */
    const [g0, g1] = q.range, bandW = (g1 - g0 || 1) / nU;
    const lo = Float64Array.from({ length: nU }, (_, u) => g0 + u * bandW);
    const norm = (u, x, y) => { const i = y * W + x; return unit[i] === u ? Math.max(0, Math.min(1, (raw[i] - lo[u]) / bandW)) : 0; };
    const slope = (u, x, y) => {
      if (x < 1 || y < 1 || x > W - 2 || y > H - 2) return 0;
      const dx = (norm(u, x + 1, y) - norm(u, x - 1, y)) * 0.5, dy = (norm(u, x, y + 1) - norm(u, x, y - 1)) * 0.5;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const partner = new Int32Array(n).fill(-1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { // E, S, W, N: the first upper neighbour that qualifies
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        const higher = kind === 'sub' ? q.ter[j] === q.ter[i] && q.sub[j] - q.sub[i] > P.climb : q.ter[j] === q.ter[i] + 1;
        if (higher && slope(unit[i], x, y) - slope(unit[j], x, y) > thr) { partner[i] = j; break; }
      }
    }
    const seen = new Uint8Array(n), groups = [];
    for (let s0 = 0; s0 < n; s0++) {
      if (partner[s0] < 0 || seen[s0]) continue;
      const tiles = [], st = [s0]; seen[s0] = 1;
      while (st.length) {
        const i = st.pop(), x = i % W, y = (i / W) | 0; tiles.push(i);
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && partner[j] >= 0 && !seen[j]) { seen[j] = 1; st.push(j); }
      }
      if (tiles.length >= minSize) groups.push({ tiles: tiles.sort((a, b) => a - b), size: tiles.length });
    }
    return (q.trans[key] = { partner, groups });
  }
  E.gateTransitions = (full, P, kind) => transitions(full, quantize(full, P), P, kind);

  /* Gates inside the slice and the stair sites on them: one stair per gate at the tile nearest the centroid; long gates
     get floor(length / passGap) stairs spread along their main axis. Each site keeps the rest of its gate as fallbacks
     (nearest first) for when the carving does not fit. S.passes = sites. */
  function computeGates(S, P, full, q) {
    const W = S.W, H = S.H, fw = full.width, gates = [], sites = [];
    for (const kind of ['terrace', 'sub']) {
      if (kind === 'sub' && !(P.climb < S.subs - 1)) continue;
      const tr = transitions(full, q, P, kind);
      for (const g of tr.groups) {
        const tiles = [];
        for (const pos of g.tiles) {
          const x = pos % fw - S.ox, y = ((pos / fw) | 0) - S.oy, pj = tr.partner[pos], px = pj % fw - S.ox, py = ((pj / fw) | 0) - S.oy;
          if (x < 0 || y < 0 || x >= W || y >= H || px < 0 || py < 0 || px >= W || py >= H) continue;
          const a = y * W + x, b = py * W + px;
          if (!S.block[a] && !S.block[b]) tiles.push({ a, b, x, y });
        }
        if (!tiles.length) continue;
        const gi = gates.length; gates.push({ kind, size: g.size, tiles: tiles.map((t) => ({ a: t.a, b: t.b })) });
        const L = tiles.length, nSt = Math.max(1, Math.floor(L / P.passGap));
        let cx = 0, cy = 0; for (const t of tiles) { cx += t.x; cy += t.y; } cx /= L; cy /= L;
        let sxx = 0, syy = 0, sxy = 0; for (const t of tiles) { sxx += (t.x - cx) ** 2; syy += (t.y - cy) ** 2; sxy += (t.x - cx) * (t.y - cy); }
        const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(ang), uy = Math.sin(ang);
        const order = tiles.slice().sort((p, q2) => ((p.x - cx) * ux + (p.y - cy) * uy) - ((q2.x - cx) * ux + (q2.y - cy) * uy) || p.a - q2.a);
        const targets = nSt === 1
          ? [tiles.reduce((best, t) => (Math.hypot(t.x - cx, t.y - cy) < Math.hypot(best.x - cx, best.y - cy) ? t : best), tiles[0])]
          : Array.from({ length: nSt }, (_, k) => order[Math.floor((k + 0.5) * L / nSt)]);
        for (const t of targets) {
          const alts = tiles.filter((o) => o !== t).sort((p, q2) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q2.x - t.x, q2.y - t.y) || p.a - q2.a).map((o) => ({ a: o.a, b: o.b }));
          sites.push({ a: t.a, b: t.b, gate: gi, kind, alts });
        }
      }
    }
    S.gates = gates; S.passes = sites;
  }

  /* Rooms on: gates are the PAIRS where a path of the spanning tree crosses a terrace gate (RL.usage); every other candidate gate stays a cliff.
     A site is that exact pair (a = low tile, b = high tile). Crossings of the same gate group closer than passGap to a chosen site are merged into it
     (sites are taken by number of crossing paths, then position); the candidate pairs of the group within 3 tiles are the fallbacks when the carve does
     not fit. Everything is clipped to the window (both tiles unblocked). */
  function computeGatesRooms(S, P, full, RL, sl) {
    const W = S.W, H = S.H, fw = full.width, n = fw * full.height, gates = [], sites = [], U = RL.usage, gap = P.passGap;
    if (!RL.gateByKey) { RL.gateByKey = new Map(); for (const p of RL.gate) RL.gateByKey.set(E.rooms.key(p[0], p[1], n), p); RL.gateByGroup = new Map(); for (const p of RL.gate) { const g = U.gateGroupOf.get(p[0]); if (!RL.gateByGroup.has(g)) RL.gateByGroup.set(g, []); RL.gateByGroup.get(g).push(p); } }
    const win = (t) => { const x = t % fw - S.ox, y = ((t / fw) | 0) - S.oy; return x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x; };
    const mapOfWin = (i) => (((i / W) | 0) + S.oy) * fw + (i % W) + S.ox;
    const xy = (i) => [i % W, (i / W) | 0];
    const used = [], SU = sl ? E.rooms.sliceUse(RL, fw, full.height, sl.mask) : null; // a slice: the global tree cut + the patch connections
    const entries = SU ? [...SU.gate].map(([k, o]) => [k, o.count, o.patch]) : [...U.usedGate].map(([k, c]) => [k, c, false]);
    for (const [k, count, patch] of entries) {
      const p = RL.gateByKey.get(k); if (!p) continue;
      const a = win(p[0]), b = win(p[1]); if (a < 0 || b < 0 || S.block[a] || S.block[b]) continue;
      used.push({ a, b, count, patch, gid: U.gateGroupOf.get(p[0]) });
    }
    used.sort((p, q) => q.count - p.count || p.a - q.a);
    const clusters = [];
    for (const u of used) {
      const [x, y] = xy(u.a); let into = null;
      for (const c of clusters) { if (c.gid !== u.gid) continue; const [cx, cy] = xy(c.site.a); if (Math.max(Math.abs(cx - x), Math.abs(cy - y)) < gap) { into = c; break; } }
      if (into) { into.pairs.push(u); into.count += u.count; } else clusters.push({ gid: u.gid, site: u, pairs: [u], count: u.count });
    }
    clusters.sort((p, q) => p.gid - q.gid || p.site.a - q.site.a);
    for (const c of clusters) {
      const gi = gates.length, [sx, sy] = xy(c.site.a);
      gates.push({ kind: 'terrace', size: c.count, tiles: c.pairs.map((u) => ({ a: u.a, b: u.b })) });
      const alts = [];
      for (const p of RL.gateByGroup.get(c.gid)) { const a = win(p[0]), b = win(p[1]); if (a < 0 || b < 0 || a === c.site.a || S.block[a] || S.block[b]) continue; const [x, y] = xy(a); if (Math.max(Math.abs(x - sx), Math.abs(y - sy)) <= 3) alts.push({ a, b, d: Math.hypot(x - sx, y - sy) }); }
      alts.sort((p, q) => p.d - q.d || p.a - q.a);
      sites.push({ a: c.site.a, b: c.site.b, gate: gi, kind: 'terrace', patch: c.pairs.every((u) => u.patch), alts: alts.map((o) => ({ a: o.a, b: o.b })) });
    }
    // the tree connections that stay inside the window (window tile indices): they must remain walkable after the ramps are carved
    S.conns = (SU ? SU.edges : U.edges.map((e) => ({ kind: 'global', path: e.path }))).map((e) => ({ kind: e.kind, path: e.path.map(win) })).filter((c) => c.path.every((t) => t >= 0));
    /* a pair of a gate that was merged into a ramp at another pair gets its OWN site (used when the connection that crosses it has no route otherwise) */
    S.makeSite = (a, b) => {
      const gi = gates.findIndex((g) => g.tiles.some((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a))); if (gi < 0) return null;
      const host = sites.find((x) => x.gate === gi), [sx, sy] = xy(a), gid = U.gateGroupOf.get(mapOfWin(a)), alts = [];
      for (const p of RL.gateByGroup.get(gid) || []) { const a2 = win(p[0]), b2 = win(p[1]); if (a2 < 0 || b2 < 0 || a2 === a || S.block[a2] || S.block[b2]) continue; const [x, y] = xy(a2); if (Math.max(Math.abs(x - sx), Math.abs(y - sy)) <= 3) alts.push({ a: a2, b: b2, d: Math.hypot(x - sx, y - sy) }); }
      alts.sort((p, q) => p.d - q.d || p.a - q.a);
      return { a, b, gate: gi, kind: 'terrace', patch: host ? host.patch : false, unmerged: true, alts: alts.map((o) => ({ a: o.a, b: o.b })) };
    };
    S.sliceUse = SU; S.gates = gates; S.passes = sites; S.roomGates = { candidates: RL.usage.gateGroups, usedGroups: new Set(clusters.map((c) => c.gid)).size, sites: sites.length, merged: used.length - clusters.length, patchSites: sites.filter((x) => x.patch).length, slice: SU ? { nodes: SU.nodes, kept: SU.kept, patch: SU.patch, componentsBefore: SU.componentsBefore, componentsAfter: SU.componentsAfter } : null };
  }

  /* Room borders, per tile face (the window's tiles; S.roomKind[i * 4 + b], b = N E S W like S.border): 1 = a border between two rooms that BLOCKS (a pair that is
     not a valid transition), 2 = a valid transition that the tree of this slice crosses (highlighted), 0 = no border or an open transition nobody uses
     (a gap). S.roomMap = the room id of every window tile (0 = void / none). S.roomBorderInfo counts faces once each. */
  function computeRoomFaces(S, full, RL) {
    const W = S.W, H = S.H, fw = full.width, fh = full.height, n = fw * fh, kind = new Uint8Array(S.n * 4), bits = new Uint8Array(S.n), map = new Int32Array(S.n);
    const usedRoom = S.sliceUse ? S.sliceUse.room : RL.usage.usedRoom, OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]], info = { closed: 0, open: 0, used: 0 };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, mx = x + S.ox, my = y + S.oy, m = my * fw + mx, r = RL.room[m]; map[i] = r;
      if (r <= 0) continue;
      for (let b = 0; b < 4; b++) {
        const nx = mx + OFF[b][0], ny = my + OFF[b][1]; if (nx < 0 || ny < 0 || nx >= fw || ny >= fh || nx - S.ox < 0 || ny - S.oy < 0 || nx - S.ox >= W || ny - S.oy >= H) continue;
        const m2 = ny * fw + nx, r2 = RL.room[m2]; if (r2 <= 0 || r2 === r) continue;
        const kk = E.rooms.key(m, m2, n), open = RL.rp.has(kk), used = open && usedRoom.has(kk);
        kind[i * 4 + b] = used ? 2 : open ? 0 : 1; if (kind[i * 4 + b]) bits[i] |= 1 << b;
        if (m < m2) { if (used) info.used++; else if (open) info.open++; else info.closed++; }
      }
    }
    S.roomKind = kind; S.roomBits = bits; S.roomMap = map; S.roomBorderInfo = info;
  }

  /* Stairs are carved into the terrain. Each tread rises at most `tread` sub-terraces (default: the climb limit; never more). A stair is cut into the upper
     terrace (or, if that does not fit, built on the lower one) as `stairW` columns of treads; the treads take
     heights from the existing levels plus "bridge" levels in the gap between terraces (only the ones that end up
     used become levels), so every technique gets the same geometry from its normal level pipeline. */
  /* Ramp surface height at ground point (x, y) (tile units): linear along the path from the gate edge (s = 0) to the far end
     (s = len); constant across the width. r = a stair record with `ramp`. */
  E.rampHeight = (r, x, y, t) => {
    const R = r.ramp; let s = (x - R.mx) * R.pdx + (y - R.my) * R.pdy;
    if (t !== undefined && R.shift) { const d = R.shift.get(t); if (d) s -= d; } // a lateral column whose cliff is `d` tiles further along the path
    s = Math.max(0, Math.min(R.len, s));
    return R.h0 + (R.h1 - R.h0) * s / R.len;
  };
  const MAX_TREADS = 6, STAIR_COLS = { 1: [0], 2: [0, 1], 3: [-1, 0, 1] };
  function carveStairs(S, P) {
    const { W, H, n } = S, K = S.subs, N = S.N, s = E.subHeight(P), EPS = 1e-9;
    const tread = Math.max(1, Math.min(P.climb, Math.round(P.tread === undefined ? P.climb : P.tread))), reachPlain = tread * s, reach = reachPlain + EPS; // each tread rises at most `tread` sub-terraces
    if (P.stairW === 0) { // diagnostic: no carving at all (stair sites stay unconnected)
      S.carved = new Uint8Array(n); S.stairs = []; S.stairInfo = { gates: S.gates.length, sites: S.passes.length, placed: 0, dropped: 0, narrowed: 0, fills: 0, width: 0 }; return;
    }
    const wReq = Math.round(P.stairW === undefined ? 2 : P.stairW), width = Math.max(1, Math.min(3, wReq)), rwidth = Math.max(1, Math.min(5, wReq)); // steps: 1-3 columns, ramp: 1-5
    const cands = [];
    for (let L = 0; L <= S.maxFine; L++) cands.push({ h: S.levelH[L], base: L });
    for (let t = 0; t + 1 < N; t++) {
      const top = E.terBase(t, P, S.center) + (K - 1) * s, g = E.terBase(t + 1, P, S.center) - top, nb = Math.ceil(g / reachPlain - EPS) - 1;
      for (let j = 1; j <= nb; j++) cands.push({ h: top + j * g / (nb + 1), base: -1, ter: t, frac: j / (nb + 1) });
    }
    cands.sort((p, q) => p.h - q.h);
    const pickUp = (h) => { for (let k = cands.length - 1; k >= 0; k--) if (cands[k].h <= h + reach) return cands[k].h > h + EPS ? cands[k] : null; return null; };
    const pickDown = (h) => { for (let k = 0; k < cands.length; k++) if (cands[k].h >= h - reach) return cands[k].h < h - EPS ? cands[k] : null; return null; };
    const hT = new Float64Array(n); for (let i = 0; i < n; i++) hT[i] = S.levelH[S.fine[i]];
    const used = new Uint8Array(n), carved = new Uint8Array(n), carve = new Map(), stairs = [];
    let dropped = 0, narrowed = 0, fills = 0, shiftedCols = 0;
    const idx = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x);
    const okTile = (i, terr) => i >= 0 && !S.block[i] && !used[i] && S.ter[i] === terr;

    /* ramp style (user's decision): short and wide. The depth into the terrace is FIXED (P.rampDepth, default 2) and does not
       depend on the jump, so the slope is jump / depth and can be steep; the width is P.stairW (up to 5). The footprint is the same
       as the stair's (cut into the upper terrace or built on the lower one), over one smooth surface. Levels are not touched. */
    const ramp = P.stairStyle !== 0, depthDefault = Math.max(1, Math.min(4, Math.round(P.rampDepth === undefined ? 2 : P.rampDepth))), rwidthDefault = rwidth;
    const ORDER = [0, 1, -1, 2, -2];
    const planRamp = (pass, mode, dOv, wOv) => {
      const depth = dOv || depthDefault, rwidth = wOv || rwidthDefault; // variants of the ramp: a shallower one (depth 1) or a narrower one (width 1)
      const ax = pass.a % W, ay = (pass.a / W) | 0, bx = pass.b % W, by = (pass.b / W) | 0;
      const dx = bx - ax, dy = by - ay, ex = -dy, ey = dx, cut = mode === 'cut';
      const sx = cut ? bx : ax, sy = cut ? by : ay, sd = cut ? 1 : -1, fx = cut ? ax : bx, fy = cut ? ay : by;
      const terPath = cut ? S.ter[pass.b] : S.ter[pass.a], terFix = cut ? S.ter[pass.a] : S.ter[pass.b];
      const col = (c, k) => idx(sx + sd * dx * k + c * ex, sy + sd * dy * k + c * ey), fixed = (c) => idx(fx + c * ex, fy + c * ey);
      if (!okTile(fixed(0), terFix)) return null;
      const len = depth, e = col(0, len);
      for (let k = 0; k < len; k++) if (!okTile(col(0, k), terPath)) return null;
      if (!okTile(e, terPath)) return null;
      const hFix = hT[fixed(0)], hEnd = hT[e], hi = cut ? hEnd : hFix, lo = cut ? hFix : hEnd;
      if (hi - lo <= EPS) return null;
      const h0 = cut ? lo : hi, h1 = cut ? hi : lo, hAt = (t) => h0 + (h1 - h0) * t / len;
      // A column is valid when it lies on the SAME border between the two terraces: fixed end on the lower one, path on the upper one,
      // and (cut: not lower than the surface / built up: not higher). A lateral column may find the cliff of ITS OWN column up to `depth`
      // tiles further along (d > 0) or back (d < 0) the path: it is then placed there (shift d), always between the same two terraces.
      const validAt = (c, d) => {
        if (!okTile(col(c, d - 1), terFix)) return false;
        for (let k = 0; k < len; k++) { const t = col(c, d + k); if (!okTile(t, terPath) || (cut ? hT[t] < hAt(k + 1) - EPS : hT[t] > hAt(k + 1) + EPS)) return false; }
        return okTile(col(c, d + len), terPath);
      };
      const SHIFTS = [0]; for (let d = 1; d <= depth; d++) SHIFTS.push(d, -d);
      const shiftOf = (c) => { for (const d of (c === 0 ? [0] : SHIFTS)) if (validAt(c, d)) return d; return null; };
      if (shiftOf(0) === null) return null;
      let lo2 = 0, hi2 = 0; const shifts = new Map([[0, 0]]), want = ORDER.slice(0, rwidth);   // widen from the centre outwards; a column that does not fit stops its side
      for (const c of want) { if (c === 0) continue; if (c > 0 ? c === hi2 + 1 : c === lo2 - 1) { const d = P.rampShift === false ? (validAt(c, 0) ? 0 : null) : shiftOf(c); if (d !== null) { shifts.set(c, d); if (c > 0) hi2 = c; else lo2 = c; } } }
      const cols = []; for (let c = lo2; c <= hi2; c++) cols.push(c);
      const rec = { mode, dir: [dx, dy], cols, requested: rwidthDefault, narrowed: cols.length < rwidthDefault, site: pass, bottom: [], top: [], steps: [],
        ramp: { mx: (ax + bx) / 2 + 0.5, my: (ay + by) / 2 + 0.5, pdx: sd * dx, pdy: sd * dy, len, h0, h1, shift: new Map() }, level: S.fine[pass.a] };
      for (let k = 0; k < len; k++) rec.steps.push({ cand: null, tiles: [] });
      for (const c of cols) {
        const d = shifts.get(c);
        rec.bottom.push(cut ? col(c, d - 1) : col(c, d + len)); rec.top.push(cut ? col(c, d + len) : col(c, d - 1));
        for (let k = 0; k < len; k++) { const t = col(c, d + k); rec.steps[cut ? k : len - 1 - k].tiles.push(t); if (d) rec.ramp.shift.set(t, d); }
      }
      rec.shifted = cols.filter((c) => shifts.get(c) !== 0).length;
      return rec;
    };
    const plan = (pass, mode) => {
      const ax = pass.a % W, ay = (pass.a / W) | 0, bx = pass.b % W, by = (pass.b / W) | 0;
      const dx = bx - ax, dy = by - ay, ex = -dy, ey = dx, cut = mode === 'cut';
      const sx = cut ? bx : ax, sy = cut ? by : ay, sd = cut ? 1 : -1;        // path: b, b+d, ...  (cut)  or  a, a-d, ...  (fill)
      const fx = cut ? ax : bx, fy = cut ? ay : by;                           // fixed end: the lower tile (cut) or the upper tile (fill)
      const terPath = cut ? S.ter[pass.b] : S.ter[pass.a], terFix = cut ? S.ter[pass.a] : S.ter[pass.b];
      const col = (c, k) => idx(sx + sd * dx * k + c * ex, sy + sd * dy * k + c * ey), fixed = (c) => idx(fx + c * ex, fy + c * ey);
      // heights of the treads, from the central column
      const steps = []; let cur = hT[fixed(0)], end = -1;
      if (!okTile(fixed(0), terFix)) return null;
      for (let k = 0; k <= MAX_TREADS; k++) {
        const t = col(0, k); if (!okTile(t, terPath)) return null;
        const o = hT[t];
        if (cut ? o - cur <= reach : cur - o <= reach) { if (cut ? o < cur - EPS : o > cur + EPS) return null; end = k; break; }
        const c = cut ? pickUp(cur) : pickDown(cur);
        if (!c || (cut ? c.h >= o - EPS : c.h <= o + EPS)) return null;
        steps.push(c); cur = c.h;
      }
      if (end < 1) return null;
      const m = steps.length, first = steps[0].h, last = steps[m - 1].h;
      const valid = (c) => {
        const f = fixed(c);
        if (c === 0 ? !okTile(f, terFix) : (f < 0 || S.block[f] || used[f])) return false; // lateral ends may sit on any terrace (diagonal cliffs)
        if (c === 0 && (cut ? first - hT[f] > reach : hT[f] - first > reach)) return false;
        for (let k = 0; k < m; k++) { const t = col(c, k); if (!okTile(t, terPath) || (cut ? hT[t] <= steps[k].h + EPS : hT[t] >= steps[k].h - EPS)) return false; }
        const e = col(c, m); if (!okTile(e, terPath)) return false;
        return cut ? hT[e] >= last - EPS && hT[e] - last <= reach : hT[e] <= last + EPS && last - hT[e] <= reach;
      };
      const want = STAIR_COLS[width], ok = new Set(want.filter(valid));
      if (!ok.has(0)) return null;
      let cols = [0];
      if (width === 3 && ok.has(-1) && ok.has(1)) cols = [-1, 0, 1]; else if (width === 2 && ok.has(1)) cols = [0, 1];
      const asc = cut ? steps : steps.slice().reverse();
      const rec = { mode, dir: [dx, dy], cols, requested: width, narrowed: cols.length < width, site: pass, bottom: [], top: [], steps: asc.map((c) => ({ cand: c, tiles: [] })) };
      for (const c of cols) {
        rec.bottom.push(cut ? fixed(c) : col(c, m)); rec.top.push(cut ? col(c, m) : fixed(c));
        for (let k = 0; k < m; k++) rec.steps[cut ? k : m - 1 - k].tiles.push(col(c, k));
      }
      return rec;
    };
    /* Rooms on: the tree decided which cores are joined and along which tiles (S.conns, window indices). The tiles of those paths are RESERVED: a ramp may only
       occupy one if the path walks it ALONG the ramp (bottom -> treads -> top of a column, or sideways between two columns of the ramp), because carved tiles
       connect only along their stair. Variants, in order: cut into the upper terrace, built on the lower one, depth 1 of each, lateral columns out (narrower). */
    const keep = !!S.rooms && P.rampKeep !== false, links = new Set(), lk = (a, b) => (a < b ? a * n + b : b * n + a), tileConns = new Map();
    if (keep) S.conns.forEach((c, ci) => { for (const t of c.path) { let l = tileConns.get(t); if (!l) tileConns.set(t, l = []); if (l[l.length - 1] !== ci) l.push(ci); } });
    const adj4 = adj4For(W);
    const recLinks = (rec) => { const out = []; for (let ci = 0; ci < rec.cols.length; ci++) { let prev = rec.bottom[ci]; for (const st of rec.steps) { out.push([prev, st.tiles[ci]]); prev = st.tiles[ci]; } out.push([prev, rec.top[ci]]); if (ci > 0) for (const st of rec.steps) if (adj4(st.tiles[ci - 1], st.tiles[ci])) out.push([st.tiles[ci - 1], st.tiles[ci]]); } return out; };
    const walkOK = (rec) => { // every step of a reserved path that touches the footprint is a link of this ramp (or of an earlier one)
      if (!keep) return true;
      const foot = new Set(); for (const st of rec.steps) for (const t of st.tiles) foot.add(t);
      const mine = new Set(recLinks(rec).map(([a, b]) => lk(a, b))), seen = new Set();
      for (const t of foot) for (const ci of tileConns.get(t) || []) {
        if (seen.has(ci)) continue; seen.add(ci); const path = S.conns[ci].path;
        for (let k = 1; k < path.length; k++) { const u = path[k - 1], v = path[k]; if ((foot.has(u) || foot.has(v)) && !mine.has(lk(u, v)) && !links.has(lk(u, v))) return false; }
      }
      return true;
    };
    // depth D, D-1, ... 1 at full width, then the same depths with the lateral columns out (width 1); a ramp that is not the first of the ladder is a variant
    const ladder = [];
    if (ramp && keep) { for (let d = depthDefault; d >= 1; d--) ladder.push([d, rwidthDefault]); if (rwidthDefault > 1) for (let d = depthDefault; d >= 1; d--) ladder.push([d, 1]); } else ladder.push(ramp ? [depthDefault, rwidthDefault] : [0, 0]);
    const variantHist = new Array(ladder.length).fill(0); let variantsChanged = 0;
    for (const pass of S.passes) {
      if (pass.noRamp) continue; // its ramp would end up in isolated terrain (rooms on)
      let rec = null, variant = 0;   // cut into the upper terrace, or build up the lower one: the wider result wins (ties: cut)
      for (const site of pass.exact ? [pass] : [pass, ...pass.alts]) {   // the centred tile first, then the rest of the gate, nearest first
        for (let vi = 0; vi < ladder.length && !rec; vi++) {
          const cand = [];
          for (const mode of ['cut', 'fill']) { const r = ramp ? planRamp(site, mode, ladder[vi][0], ladder[vi][1]) : plan(site, mode); if (r) cand.push(r); }
          if (vi === 0 && !cand.length) break;   // nothing fits here at all: the next site of the gate (variants are for a ramp that fits but would cut a path)
          cand.sort((p, q) => q.cols.length - p.cols.length || (p.mode === 'cut' ? -1 : 1));
          for (const r of cand) if (walkOK(r)) { rec = r; variant = vi; break; }
        }
        if (rec) break;
      }
      if (!rec) { dropped++; pass.dropped = true; continue; }
      rec.variant = variant; variantHist[variant]++; if (variant) variantsChanged++;
      if (rec.mode === 'fill') fills++;
      if (rec.narrowed) narrowed++;
      shiftedCols += rec.shifted || 0;
      for (let ci = 0; ci < rec.cols.length; ci++) { used[rec.bottom[ci]] = 1; used[rec.top[ci]] = 1; }
      for (const st of rec.steps) for (const t of st.tiles) { used[t] = 1; carved[t] = 1; if (st.cand) carve.set(t, st.cand); }
      for (const [a, b] of recLinks(rec)) links.add(lk(a, b));
      stairs.push(rec);
    }
    if (ramp) { // a cut ramp lowers its footprint to the level of the low end (a hole in every slab above); a built-up one keeps its tiles
      for (const rec of stairs) if (rec.mode === 'cut') for (const st of rec.steps) for (const t of st.tiles) S.fine[t] = rec.level;
      S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []);
      for (let i = 0; i < n; i++) if (!S.void || !S.void[i]) S.byLevel[S.fine[i]].push(i);
      refreshMask(S);
    }
    for (const rec of stairs) if (rec.ramp && rec.site && rec.site.patch) rec.ramp.patch = true; // a patch ramp (it exists only for this slice) has its own tone
    S.carved = carved; S.stairs = stairs; S.stairInfo = { gates: S.gates.length, sites: S.passes.length, placed: stairs.length, dropped, narrowed, fills, shiftedCols, width: P.stairStyle !== 0 ? rwidth : width, style: ramp ? 'ramp' : 'steps', variants: variantHist, variantLabels: ladder.map(([d, w]) => `depth ${d}${w === 1 && rwidthDefault > 1 ? ' narrow' : ''}`), variantsChanged };
    if (!carve.size) return;
    // rebuild the level ranking: base levels plus the bridge levels that are used, ordered by height
    const bridges = [...new Set([...carve.values()].filter((c) => c.base < 0))].sort((p, q) => p.h - q.h);
    const newH = [], newMeta = [], baseIdx = new Array(S.maxFine + 1), bridgeIdx = new Map();
    let bi = 0;
    for (let L = 0; L <= S.maxFine; L++) {
      while (bi < bridges.length && bridges[bi].h < S.levelH[L] - EPS) {
        bridgeIdx.set(bridges[bi], newH.length); newH.push(bridges[bi].h);
        newMeta.push({ ter: bridges[bi].ter, sub: K - 1, bridge: true, frac: bridges[bi].frac }); bi++;
      }
      baseIdx[L] = newH.length; newH.push(S.levelH[L]); newMeta.push(S.levelMeta[L]);
    }
    for (let i = 0; i < n; i++) { const c = carve.get(i); S.fine[i] = c ? (c.base >= 0 ? baseIdx[c.base] : bridgeIdx.get(c)) : baseIdx[S.fine[i]]; }
    S.levelH = newH; S.levelMeta = newMeta; S.maxFine = newH.length - 1;
    S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []);
    for (let i = 0; i < n; i++) if (!S.void || !S.void[i]) S.byLevel[S.fine[i]].push(i);
    refreshMask(S);
  }
  /* Rooms on: after the ramps are carved, is every connection of the tree still walkable from end to end in the FINAL walking graph (the one of E.route)?
     A step is walkable when neither tile is carved and the patched passability allows it, or when it is a link of a ramp (carved tiles connect only along their
     stair). A connection that is not is recomputed over the carved graph with the same crossing cost (per ramp crossed); if no such path exists it is NOT forced:
     it is counted and named (S.connInfo). P.rampKeep === false: the old behaviour (nothing reserved, nothing recomputed) to measure what the fix changes. */
  function checkConnections(S, P) {
    const conns = S.conns, n = S.n, W = S.W, H = S.H, RL = S.rooms, adj4 = adj4For(W), lk = (a, b) => (a < b ? a * n + b : b * n + a);
    const links = new Set();
    for (const rec of S.stairs) for (let ci = 0; ci < rec.cols.length; ci++) {
      let prev = rec.bottom[ci]; for (const st of rec.steps) { links.add(lk(prev, st.tiles[ci])); prev = st.tiles[ci]; } links.add(lk(prev, rec.top[ci]));
      if (ci > 0) for (const st of rec.steps) if (adj4(st.tiles[ci - 1], st.tiles[ci])) links.add(lk(st.tiles[ci - 1], st.tiles[ci]));
    }
    const step = (u, v) => { if (S.block[u] || S.block[v]) return false; if (S.carved[u] || S.carved[v]) return links.has(lk(u, v)); return !roomBlocked(S, u) && !roomBlocked(S, v) && roomStep(S, u, v); };
    const cc = RL.prm.crossCost || 0, extra = cc > 0 ? (u, v) => (links.has(lk(u, v)) && S.ter[u] !== S.ter[v] ? cc : 0) : null;
    const exactOf = new Map(); // gate pair (window tiles) -> the site that is exactly that pair
    S.passes.forEach((site) => { exactOf.set(lk(site.a, site.b), site); });
    const inGate = new Set(); S.gates.forEach((g) => { for (const t of g.tiles) inGate.add(lk(t.a, t.b)); });
    const why = (u, v) => {
      if (S.block[u] || S.block[v] || roomBlocked(S, u) || roomBlocked(S, v)) return 'blocked tile';
      if (S.carved[u] || S.carved[v]) return 'path crosses a ramp sideways';
      if (S.ter[u] !== S.ter[v]) { const site = exactOf.get(lk(u, v)); if (site) return site.dropped ? 'gate pair whose ramp did not fit' : 'gate pair carved at another pair of its gate'; return inGate.has(lk(u, v)) ? 'gate pair merged into a ramp at another pair' : 'gate pair without ramp'; }
      return 'other';
    };
    const info = { total: conns.length, ok: 0, recomputed: 0, unresolved: 0, noRoute: 0, reasons: {}, unresolvedReasons: {}, list: [], global: 0, patch: 0, keep: P.rampKeep !== false }; // noRoute: no route at all between its ends in the final graph
    for (const c of conns) {
      c.kind === 'patch' ? info.patch++ : info.global++;
      let bad = -1; for (let k = 1; k < c.path.length; k++) if (!step(c.path[k - 1], c.path[k])) { bad = k; break; }
      if (bad < 0) { c.status = 'ok'; info.ok++; continue; }
      const reason = why(c.path[bad - 1], c.path[bad]); c.reason = reason; c.fail = [c.path[bad - 1], c.path[bad]]; info.reasons[reason] = (info.reasons[reason] || 0) + 1;
      const a = c.path[0], b = c.path[c.path.length - 1];
      const r = E.rooms.dijkstra(W, H, a, step, true, extra, b);
      if (info.keep && r.dist[b] >= 0) { c.old = c.path; c.path = E.rooms.pathTo(r, b); c.status = 'recomputed'; info.recomputed++; continue; }
      if (r.dist[b] < 0) info.noRoute++;
      c.status = 'unresolved'; info.unresolved++; info.unresolvedReasons[reason] = (info.unresolvedReasons[reason] || 0) + 1;
      const mxy = (t) => [S.ox + (t % W), S.oy + ((t / W) | 0)];
      if (info.list.length < 8) info.list.push({ from: mxy(a), to: mxy(b), at: [mxy(c.path[bad - 1]), mxy(c.path[bad])], reason, kind: c.kind });
    }
    S.connInfo = info;
  }
  /* Rooms on, after the regions of the final walking graph (user's rule). MAIN = the largest region (of the slice, if there is one). ISOLATED terrain = any other
     region with fewer tiles than P.roomsIsoLimit (default 100): decorative, NOT walkable, not a region, takes no ramp (and no mark). EDGE PROBLEM = any other region with
     that many tiles or more: it stays walkable, gets a warning outline (faces, kind 3 of S.roomKind) and the info names it (size, place, what separates it).
     S.nowalk = the tiles drawn with the "not walkable" tone: isolated terrain and the forbidden margins (walls, cliffs, Steep) of the layer. */
  function classifyWalk(S, P, RL) {
    const n = S.n, W = S.W, H = S.H, limit = P.roomsIsoLimit === undefined ? 100 : P.roomsIsoLimit, rs = S.regionSizes, nr = rs.length;
    let main = -1; for (let r = 0; r < nr; r++) if (main < 0 || rs[r] > rs[main]) main = r;
    const isoR = new Uint8Array(nr); for (let r = 0; r < nr; r++) if (r !== main && rs[r] < limit) isoR[r] = 1;
    const isolated = new Uint8Array(n), newId = new Int32Array(nr).fill(-1), sizes = []; let k = 0, isoRegions = 0, isoTiles = 0;
    for (let r = 0; r < nr; r++) { if (isoR[r]) { isoRegions++; isoTiles += rs[r]; } else { newId[r] = k++; sizes.push(rs[r]); } }
    const old = Int32Array.from(S.region);
    for (let i = 0; i < n; i++) if (old[i] >= 0) { if (isoR[old[i]]) { isolated[i] = 1; S.region[i] = -1; } else S.region[i] = newId[old[i]]; }
    S.regionSizes = sizes; S.isolated = isolated; S.mainRegion = main >= 0 ? newId[main] : -1;
    const nowalk = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (!S.block[i] && !(S.void && S.void[i]) && (isolated[i] || (!S.carved[i] && RL.forb[mapIdxOf(S, i)] === 1))) nowalk[i] = 1;
    S.nowalk = nowalk;
    // edge problems: the regions that are neither main nor isolated
    const stat = new Map(), OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]], N = S.mapW * S.mapH;
    for (let i = 0; i < n; i++) { const r = S.region[i]; if (r < 0 || r === S.mainRegion) continue; let o = stat.get(r); if (!o) stat.set(r, o = { id: r, size: 0, sx: 0, sy: 0, x0: 1e9, y0: 1e9, x1: -1, y1: -1, causes: {} }); const x = i % W, y = (i / W) | 0; o.size++; o.sx += x; o.sy += y; o.x0 = Math.min(o.x0, x); o.y0 = Math.min(o.y0, y); o.x1 = Math.max(o.x1, x); o.y1 = Math.max(o.y1, y); }
    const walkable = (j) => S.region[j] >= 0;
    const cause = (a, c) => {
      if (S.carved[a] || S.carved[c]) return 'a ramp';
      if (S.ter[a] !== S.ter[c]) return Math.abs(a - c) === 1 || Math.abs(a - c) === W ? (RL.gp.has(E.rooms.key(mapIdxOf(S, a), mapIdxOf(S, c), N)) ? 'a terrace gate without a ramp' : 'a terrace cliff') : 'a terrace cliff';
      if (RL.room[mapIdxOf(S, a)] !== RL.room[mapIdxOf(S, c)]) return 'a room border without a transition';
      return 'a steep slope or the margin of a wall';
    };
    const warnK = S.roomKind, warnB = S.roomBits;
    for (let k = 0; k < warnK.length; k++) if (warnK[k] === 3) { warnK[k] = 0; warnB[k >> 2] &= ~(1 << (k & 3)); } // classifyWalk runs in every build() of the recovery loop: drop the marks of the previous pass first
    for (let i = 0; i < n; i++) {
      const r = S.region[i]; if (r < 0 || r === S.mainRegion) continue; const o = stat.get(r), x = i % W, y = (i / W) | 0;
      for (let b = 0; b < 4; b++) {
        const nx = x + OFF[b][0], ny = y + OFF[b][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx;
        if (S.region[j] === r || (S.void && S.void[j]) || S.block[j]) continue;
        // a face of the warning outline (both tiles flagged so the painter draws it once, like the room borders)
        { if (!warnK[i * 4 + b]) { warnK[i * 4 + b] = 3; warnB[i] |= 1 << b; } if (!warnK[j * 4 + (b + 2) % 4]) { warnK[j * 4 + (b + 2) % 4] = 3; warnB[j] |= 1 << ((b + 2) % 4); } }
        let c = -1; if (walkable(j)) c = j; else { const mx2 = nx + OFF[b][0], my2 = ny + OFF[b][1]; if (mx2 >= 0 && my2 >= 0 && mx2 < W && my2 < H && walkable(my2 * W + mx2) && S.region[my2 * W + mx2] !== r) c = my2 * W + mx2; }
        if (c >= 0) { const w = cause(i, c); o.causes[w] = (o.causes[w] || 0) + 1; }
      }
    }
    const none = S.slice ? 'no path inside the slice (what it would join lies outside it)' : 'only non-walkable margins around it (no neighbouring walkable region)';
    const problems = [...stat.values()].map((o) => { const top = Object.entries(o.causes).sort((p, q) => q[1] - p[1]); return { id: o.id, size: o.size, at: [Math.round(S.ox + o.sx / o.size), Math.round(S.oy + o.sy / o.size)], box: [S.ox + o.x0, S.oy + o.y0, S.ox + o.x1, S.oy + o.y1], causes: top, cause: top.length ? top[0][0] : none }; }).sort((p, q) => q.size - p.size);
    let wt = 0; for (const v of sizes) wt += v;
    S.walkInfo = { limit, main: main >= 0 ? rs[main] : 0, walkable: wt, isolatedRegions: isoRegions, isolatedTiles: isoTiles, problems };
  }
  function refreshMask(S) { if (S.void) { S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < S.n; i++) if (S.void[i]) S.fineMask[i] = -1; } } // level membership: void belongs to no level

  /* Rooms on: walking is the patched passability of the rooms chain (E.rooms.makePass): same terrace and room, or a valid room transition (all of them open);
     the margin of a wall, cliff or Steep tile is not walkable; terraces change only along a ramp. Window tile -> map tile for the layer's arrays. */
  const mapIdxOf = (S, i) => (((i / S.W) | 0) + S.oy) * S.mapW + (i % S.W) + S.ox;
  const roomStep = (S, i, j) => S.ter[i] === S.ter[j] && S.rooms.pass(mapIdxOf(S, i), mapIdxOf(S, j));
  const roomBlocked = (S, i) => S.block[i] || (!S.carved[i] && S.rooms.forb[mapIdxOf(S, i)] === 1);
  E.tileWalkable = (S, i) => !(S.rooms ? roomBlocked(S, i) || (S.isolated && S.isolated[i] === 1) : S.block[i]); // can a mark stand on tile i (window index)?
  const adj4For = (W) => (a, b) => (Math.abs(a - b) === W || (Math.abs(a - b) === 1 && ((a / W) | 0) === ((b / W) | 0)));
  function computeRegions(S, P) {
    const adj4 = adj4For(S.W);
    const { W, H, ter, sub } = S, rooms = S.rooms, n = S.n, carved = S.carved;
    const water = rooms ? Uint8Array.from({ length: n }, (_, i) => (roomBlocked(S, i) ? 1 : 0)) : S.block; // rooms on: the forbidden margins are not walkable either
    const par = new Int32Array(n).map((_, i) => i);
    const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (water[i]) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (water[j] || carved[i] || carved[j]) continue;   // carved tiles only connect along their stair
        if (rooms ? roomStep(S, i, j) : ter[i] === ter[j] && (S.subFree || Math.abs(sub[i] - sub[j]) <= P.climb)) uni(i, j);
      }
    }
    for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) {
      let prev = st.bottom[ci];
      for (const step of st.steps) { uni(prev, step.tiles[ci]); prev = step.tiles[ci]; }
      uni(prev, st.top[ci]);
      if (ci > 0) for (const step of st.steps) if (adj4(step.tiles[ci - 1], step.tiles[ci])) uni(step.tiles[ci - 1], step.tiles[ci]); // columns shifted along the path are not neighbours
    }
    const idOf = new Map(), region = new Int32Array(n).fill(-1), sizes = [];
    for (let i = 0; i < n; i++) {
      if (water[i]) continue;
      const r = find(i);
      if (!idOf.has(r)) { idOf.set(r, sizes.length); sizes.push(0); }
      region[i] = idOf.get(r); sizes[region[i]]++;
    }
    S.region = region; S.regionSizes = sizes;
  }

  /* ---- walking graph: the same edges as computeRegions (so a route exists exactly when two tiles share a region) ---- */
  function walkGraph(S, P) {
    if (S._walk) return S._walk;
    const adj4 = adj4For(S.W);
    const extra = new Map(), link = (a, b) => { (extra.get(a) || extra.set(a, []).get(a)).push(b); (extra.get(b) || extra.set(b, []).get(b)).push(a); };
    for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) {
      let prev = st.bottom[ci];
      for (const step of st.steps) { link(prev, step.tiles[ci]); prev = step.tiles[ci]; }
      link(prev, st.top[ci]);
      if (ci > 0) for (const step of st.steps) if (adj4(step.tiles[ci - 1], step.tiles[ci])) link(step.tiles[ci - 1], step.tiles[ci]);
    }
    const W = S.W, H = S.H, out = [];
    const neighbors = (i) => {
      out.length = 0;
      if (S.block[i] || (S.rooms && roomBlocked(S, i))) return out;
      const x = i % W, y = (i / W) | 0;
      if (!S.carved[i]) for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j < 0 || S.block[j] || S.carved[j]) continue;   // carved tiles only connect along their stair
        if (S.rooms ? roomStep(S, i, j) : S.ter[i] === S.ter[j] && (S.subFree || Math.abs(S.sub[i] - S.sub[j]) <= P.climb)) out.push(j);
      }
      const e = extra.get(i); if (e) for (const j of e) if (!S.block[j]) out.push(j);
      return out;
    };
    return (S._walk = neighbors);
  }
  /* Shortest route (fewest tiles) from tile a to tile b over the walking graph, or null. Tiles are window indices. */
  E.route = function (S, P, a, b) {
    if (a === b) return [a];
    if (S.block[a] || S.block[b]) return null;
    const nb = walkGraph(S, P), prev = new Int32Array(S.n).fill(-2), q = [a]; prev[a] = -1;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      for (const j of nb(i).slice()) if (prev[j] === -2) { prev[j] = i; if (j === b) { const r = [b]; for (let k = i; k !== -1; k = prev[k]) r.push(k); return r.reverse(); } q.push(j); }
    }
    return null;
  };
  /* Why there is no route between a and b: their regions (id, tiles), the closest approach between the two regions through any
     unblocked tile (tiles between them, the two end tiles) and the gates that touch both regions but got no stair. */
  E.regionGap = function (S, a, b) {
    const ra = S.region[a], rb = S.region[b], W = S.W, H = S.H;
    const res = { ra, rb, sizeA: S.regionSizes[ra], sizeB: S.regionSizes[rb], dist: -1, from: -1, to: -1, droppedGates: 0 };
    const dist = new Int32Array(S.n).fill(-1), from = new Int32Array(S.n).fill(-1), q = [];
    for (let i = 0; i < S.n; i++) if (S.region[i] === ra) { dist[i] = 0; from[i] = i; q.push(i); }
    for (let h = 0; h < q.length && res.dist < 0; h++) {
      const i = q[h], x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j < 0 || dist[j] >= 0 || (S.slice && !S.slice[j])) continue;
        dist[j] = dist[i] + 1; from[j] = from[i];
        if (S.region[j] === rb) { res.dist = dist[j] - 1; res.from = from[j]; res.to = j; break; }
        q.push(j);
      }
    }
    const placed = new Set(S.stairs.map((r) => r.site.gate));
    S.gates.forEach((g, gi) => { if (placed.has(gi)) return; if (g.tiles.some((t) => (S.region[t.a] === ra && S.region[t.b] === rb) || (S.region[t.a] === rb && S.region[t.b] === ra))) res.droppedGates++; });
    return res;
  };

  E._carve = carveStairs; E._regions = computeRegions; // test hooks (hand-built shaping objects)

  /* demo packs */
  E.noisePack = function (W, H, seed) {
    let s = seed >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const sm = (t) => t * t * (3 - 2 * t);
    const octave = (G) => { // own lattice per octave, so no octave ever wraps or jumps
      const grid = Array.from({ length: G + 1 }, () => Array.from({ length: G + 1 }, rnd));
      return (x, y) => {
        const gx = x * G / W, gy = y * G / H, x0 = Math.min(G - 1, Math.floor(gx)), y0 = Math.min(G - 1, Math.floor(gy));
        const tx = sm(gx - x0), ty = sm(gy - y0);
        const a = grid[y0][x0], b = grid[y0][x0 + 1], c = grid[y0 + 1][x0], d = grid[y0 + 1][x0 + 1];
        return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
      };
    };
    const o1 = octave(9), o2 = octave(18);
    const el = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      el.push(+(o1(x, y) * 0.65 + o2(x, y) * 0.35).toFixed(3) * 9 + 1);
    }
    return { format: 'evodun-pack/0.1', name: 'Value noise (base pipeline stand-in)', width: W, height: H, elevation: el, masks: {}, markers: [] };
  };
})(window.EVO = window.EVO || {});
