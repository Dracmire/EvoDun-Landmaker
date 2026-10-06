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
    if (!spec || (!(spec.zones && spec.zones.length) && !spec.rect)) return null;
    const W = pack.width, H = pack.height, mask = new Uint8Array(W * H);
    if (spec.zones && spec.zones.length) {
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

  /* Terraces and sub-terraces of the WHOLE map (U = raw-range position after pre-smoothing), cached on the pack by the
     shaping parameters and then cropped to the window, so a slice never changes them. */
  function quantize(full, P) {
    const key = [P.terraces, P.subs, P.minPlateau, P.minSub, P.pre].join('|');
    if (full._q && full._q.key === key) return full._q;
    const W = full.width, H = full.height, n = W * H, N = P.terraces, K = P.subs;
    let el = Float32Array.from(full.elevation);
    for (let p = 0; p < P.pre; p++) el = blur3(el, W, H);
    let mn = Infinity, mx = -Infinity;
    if (full.elevRange) { mn = full.elevRange[0]; mx = full.elevRange[1]; }
    else for (const v of el) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const U = new Float32Array(n), ter = new Int16Array(n), sub = new Int16Array(n), g0 = new Int16Array(n);
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
    cleanup(W, H, sub, ter, P.minSub);
    const cnt = new Int32Array(N); for (let i = 0; i < n; i++) cnt[ter[i]]++;
    let center = 0; for (let t = 1; t < N; t++) if (cnt[t] > cnt[center]) center = t; // the terrace with most tiles on the whole map (ties: the lower)
    return (full._q = { key, U, ter, sub, trans: {}, range: [mn, mx], center });
  }
  E.quantize = quantize;

  /* pack: the whole map; spec: see E.sliceOf (omit for the whole map as one slice). Terraces use the global
     elevation range of the whole map (pack.elevRange when present), so they do not depend on the window. */
  E.shape = function (full, P, spec) {
    const sl = E.sliceOf(full, spec), pack = sl ? cropPack(full, sl) : full;
    const W = pack.width, H = pack.height, n = W * H, N = P.terraces, K = P.subs;
    const q = quantize(full, P);
    const U = sl ? cropArr(q.U, full.width, sl.x0, sl.y0, W, H) : q.U;
    const ter = sl ? cropArr(q.ter, full.width, sl.x0, sl.y0, W, H) : q.ter;
    const sub = sl ? cropArr(q.sub, full.width, sl.x0, sl.y0, W, H) : q.sub;
    const fine = new Int16Array(n);
    let maxFine = 0;
    for (let i = 0; i < n; i++) { fine[i] = ter[i] * K + sub[i]; if (fine[i] > maxFine) maxFine = fine[i]; }
    const byLevel = Array.from({ length: maxFine + 1 }, () => []);
    for (let i = 0; i < n; i++) byLevel[fine[i]].push(i);
    // `fine` is a level index: levels are ranked by height. levelH[L] is the height of level L and levelMeta[L]
    // says where it comes from (terrace, sub-terrace; bridge levels are added by the stair carving).
    const levelH = new Array(maxFine + 1), levelMeta = new Array(maxFine + 1);
    for (let L = 0; L <= maxFine; L++) { levelH[L] = E.hOf(L, P, q.center); levelMeta[L] = { ter: Math.floor(L / K), sub: L % K, bridge: false }; }
    const masks = pack.masks || {};
    const S = {
      W, H, n, U, ter, sub, fine, maxFine, byLevel, levelH, levelMeta, subs: K, N, center: q.center,
      water: masks.water || new Array(n).fill(0),
      snake: masks.snake || null, cave: masks.cave || null, waterfall: masks.waterfall || null,
      markers: pack.markers || [], name: pack.name, fields: pack.fields || {}, cache: {},
      mapW: full.width, mapH: full.height, ox: sl ? sl.x0 : 0, oy: sl ? sl.y0 : 0,
      slice: null, sliceBox: null, border: null, sliceLoops: null, sliceInfo: null
    };
    S.block = new Uint8Array(n); // not walkable: water, or outside the slice
    for (let i = 0; i < n; i++) S.block[i] = S.water[i] ? 1 : 0;
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
      S.sliceInfo = { tiles: sl.tiles, window: { x0: sl.x0, y0: sl.y0, w: W, h: H }, bbox: b, zones: spec.zones ? spec.zones.slice() : [], rect: spec.rect || null, warnings };
    }
    computeGates(S, P, full, q);
    carveStairs(S, P);
    const terSeen = new Set(), fineSeen = new Set(); // distinct levels inside the slice (the whole window if there is none)
    for (let i = 0; i < n; i++) if (!S.slice || S.slice[i]) { terSeen.add(S.ter[i]); fineSeen.add(S.fine[i]); }
    S.levelCount = { terraces: terSeen.size, levels: fineSeen.size };
    computeRegions(S, P);
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
    const W = full.width, H = full.height, n = W * H, raw = full.elevation;
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

  /* Stairs are carved into the terrain. Each tread rises at most `tread` sub-terraces (default: the climb limit; never more). A stair is cut into the upper
     terrace (or, if that does not fit, built on the lower one) as `stairW` columns of treads; the treads take
     heights from the existing levels plus "bridge" levels in the gap between terraces (only the ones that end up
     used become levels), so every technique gets the same geometry from its normal level pipeline. */
  /* Ramp surface height at ground point (x, y) (tile units): linear along the path from the gate edge (s = 0) to the far end
     (s = len); constant across the width. r = a stair record with `ramp`. */
  E.rampHeight = (r, x, y) => {
    const R = r.ramp, t = Math.max(0, Math.min(R.len, (x - R.mx) * R.pdx + (y - R.my) * R.pdy));
    return R.h0 + (R.h1 - R.h0) * t / R.len;
  };
  const MAX_TREADS = 6, STAIR_COLS = { 1: [0], 2: [0, 1], 3: [-1, 0, 1] };
  function carveStairs(S, P) {
    const { W, H, n } = S, K = S.subs, N = S.N, s = E.subHeight(P), EPS = 1e-9;
    const tread = Math.max(1, Math.min(P.climb, Math.round(P.tread === undefined ? P.climb : P.tread))), reachPlain = tread * s, reach = reachPlain + EPS; // each tread rises at most `tread` sub-terraces
    if (P.stairW === 0) { // diagnostic: no carving at all (stair sites stay unconnected)
      S.carved = new Uint8Array(n); S.stairs = []; S.stairInfo = { gates: S.gates.length, sites: S.passes.length, placed: 0, dropped: 0, narrowed: 0, fills: 0, width: 0 }; return;
    }
    const width = Math.max(1, Math.min(3, Math.round(P.stairW === undefined ? 2 : P.stairW)));
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
    let dropped = 0, narrowed = 0, fills = 0;
    const idx = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x);
    const okTile = (i, terr) => i >= 0 && !S.block[i] && !used[i] && S.ter[i] === terr;

    const maxGap = P.terH * (1 + 3 * Math.max(0, (P.spread === undefined ? 1 : P.spread) - 1)); // the largest terrace jump (the spread caps at distance 3)
    const ramp = P.stairStyle === 0 ? false : true, slope = Math.max(0.05, P.rampSlope === undefined ? 0.4 : P.rampSlope), minLen = Math.max(1, Math.round(P.rampMin === undefined ? 2 : P.rampMin)), maxRamp = Math.max(8, Math.ceil(maxGap / slope) + 1); // 8 is enough for spread <= 1.5 at the default slope
    /* ramp style: the same footprint as the stair (cut into the upper terrace or built on the lower one), but one smooth
       surface from the low height to the high one; its length comes from the maximum slope. Levels are not touched. */
    const planRamp = (pass, mode) => {
      const ax = pass.a % W, ay = (pass.a / W) | 0, bx = pass.b % W, by = (pass.b / W) | 0;
      const dx = bx - ax, dy = by - ay, ex = -dy, ey = dx, cut = mode === 'cut';
      const sx = cut ? bx : ax, sy = cut ? by : ay, sd = cut ? 1 : -1, fx = cut ? ax : bx, fy = cut ? ay : by;
      const terPath = cut ? S.ter[pass.b] : S.ter[pass.a], terFix = cut ? S.ter[pass.a] : S.ter[pass.b];
      const col = (c, k) => idx(sx + sd * dx * k + c * ex, sy + sd * dy * k + c * ey), fixed = (c) => idx(fx + c * ex, fy + c * ey);
      if (!okTile(fixed(0), terFix)) return null;
      const hFix = hT[fixed(0)];
      let len = 0, h0 = 0, h1 = 0;
      for (let L = 1; L <= maxRamp; L++) {
        if (!okTile(col(0, L - 1), terPath)) return null;
        if (L < minLen) continue;
        const e = col(0, L); if (!okTile(e, terPath)) return null;
        const hEnd = hT[e], hi = cut ? hEnd : hFix, lo = cut ? hFix : hEnd;
        if (hi - lo <= EPS) return null;
        if (L >= Math.ceil((hi - lo) / slope - 1e-9)) { len = L; h0 = cut ? lo : hi; h1 = cut ? hi : lo; break; }
      }
      if (!len) return null;
      const hAt = (t) => h0 + (h1 - h0) * t / len;
      const valid = (c) => {
        const f = fixed(c);
        if (c === 0 ? !okTile(f, terFix) : (f < 0 || S.block[f] || used[f])) return false; // lateral ends may sit on any terrace (diagonal cliffs)
        for (let k = 0; k < len; k++) { const t = col(c, k); if (!okTile(t, terPath) || (cut ? hT[t] < hAt(k + 1) - EPS : hT[t] > hAt(k + 1) + EPS)) return false; }
        return okTile(col(c, len), terPath);
      };
      const want = STAIR_COLS[width], ok = new Set(want.filter(valid));
      if (!ok.has(0)) return null;
      let cols = [0];
      if (width === 3 && ok.has(-1) && ok.has(1)) cols = [-1, 0, 1]; else if (width === 2 && ok.has(1)) cols = [0, 1];
      const rec = { mode, dir: [dx, dy], cols, requested: width, narrowed: cols.length < width, site: pass, bottom: [], top: [], steps: [],
        ramp: { mx: (ax + bx) / 2 + 0.5, my: (ay + by) / 2 + 0.5, pdx: sd * dx, pdy: sd * dy, len, h0, h1 }, level: S.fine[pass.a] };
      for (let k = 0; k < len; k++) rec.steps.push({ cand: null, tiles: [] });
      for (const c of cols) {
        rec.bottom.push(cut ? fixed(c) : col(c, len)); rec.top.push(cut ? col(c, len) : fixed(c));
        for (let k = 0; k < len; k++) rec.steps[cut ? k : len - 1 - k].tiles.push(col(c, k));
      }
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
    for (const pass of S.passes) {
      let rec = null;   // cut into the upper terrace, or build up the lower one: the wider result wins (ties: cut)
      for (const site of [pass, ...pass.alts]) {   // the centred tile first, then the rest of the gate, nearest first
        for (const mode of ['cut', 'fill']) { const r = ramp ? planRamp(site, mode) : plan(site, mode); if (r && (!rec || r.cols.length > rec.cols.length)) rec = r; }
        if (rec) break;
      }
      if (!rec) { dropped++; continue; }
      if (rec.mode === 'fill') fills++;
      if (rec.narrowed) narrowed++;
      for (let ci = 0; ci < rec.cols.length; ci++) { used[rec.bottom[ci]] = 1; used[rec.top[ci]] = 1; }
      for (const st of rec.steps) for (const t of st.tiles) { used[t] = 1; carved[t] = 1; if (st.cand) carve.set(t, st.cand); }
      stairs.push(rec);
    }
    if (ramp) { // a cut ramp lowers its footprint to the level of the low end (a hole in every slab above); a built-up one keeps its tiles
      for (const rec of stairs) if (rec.mode === 'cut') for (const st of rec.steps) for (const t of st.tiles) S.fine[t] = rec.level;
      S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []);
      for (let i = 0; i < n; i++) S.byLevel[S.fine[i]].push(i);
    }
    S.carved = carved; S.stairs = stairs; S.stairInfo = { gates: S.gates.length, sites: S.passes.length, placed: stairs.length, dropped, narrowed, fills, width, style: ramp ? 'ramp' : 'steps' };
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
    for (let i = 0; i < n; i++) S.byLevel[S.fine[i]].push(i);
  }

  function computeRegions(S, P) {
    const { W, H, ter, sub } = S, water = S.block, n = S.n, carved = S.carved;
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
        if (ter[i] === ter[j] && Math.abs(sub[i] - sub[j]) <= P.climb) uni(i, j);
      }
    }
    for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) {
      let prev = st.bottom[ci];
      for (const step of st.steps) { uni(prev, step.tiles[ci]); prev = step.tiles[ci]; }
      uni(prev, st.top[ci]);
      if (ci > 0) for (const step of st.steps) uni(step.tiles[ci - 1], step.tiles[ci]);
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
