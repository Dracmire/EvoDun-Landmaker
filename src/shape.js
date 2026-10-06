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

  E.hOf = function (fine, P) {
    const K = P.subs;
    return Math.floor(fine / K) * P.terH + (fine % K) * E.subHeight(P);
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

  /* pack: the whole map; spec: see E.sliceOf (omit for the whole map as one slice). Terraces use the global
     elevation range of the whole map (pack.elevRange when present), so they do not depend on the window. */
  E.shape = function (full, P, spec) {
    const sl = E.sliceOf(full, spec), pack = sl ? cropPack(full, sl) : full;
    const W = pack.width, H = pack.height, n = W * H, N = P.terraces, K = P.subs;
    let el = Float32Array.from(pack.elevation);
    for (let p = 0; p < P.pre; p++) el = blur3(el, W, H);
    let mn = Infinity, mx = -Infinity;
    if (pack.elevRange) { mn = pack.elevRange[0]; mx = pack.elevRange[1]; }
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
    const fine = new Int16Array(n);
    let maxFine = 0;
    for (let i = 0; i < n; i++) { fine[i] = ter[i] * K + sub[i]; if (fine[i] > maxFine) maxFine = fine[i]; }
    const byLevel = Array.from({ length: maxFine + 1 }, () => []);
    for (let i = 0; i < n; i++) byLevel[fine[i]].push(i);
    // `fine` is a level index: levels are ranked by height. levelH[L] is the height of level L and levelMeta[L]
    // says where it comes from (terrace, sub-terrace; bridge levels are added by the stair carving).
    const levelH = new Array(maxFine + 1), levelMeta = new Array(maxFine + 1);
    for (let L = 0; L <= maxFine; L++) { levelH[L] = E.hOf(L, P); levelMeta[L] = { ter: Math.floor(L / K), sub: L % K, bridge: false }; }
    const masks = pack.masks || {};
    const S = {
      W, H, n, U, ter, sub, fine, maxFine, byLevel, levelH, levelMeta, subs: K, N,
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
    computePasses(S, P);
    carveStairs(S, P);
    const terSeen = new Set(), fineSeen = new Set(); // distinct levels inside the slice (the whole window if there is none)
    for (let i = 0; i < n; i++) if (!S.slice || S.slice[i]) { terSeen.add(S.ter[i]); fineSeen.add(S.fine[i]); }
    S.levelCount = { terraces: terSeen.size, levels: fineSeen.size };
    computeRegions(S, P);
    return S;
  };

  /* Stair sites. Same heuristic as before (lowest slope, one per pair of regions, then spacing). A site is a pair
     of 4-neighbour tiles (a lower, b upper) that cannot be walked: one terrace apart, or in the same terrace with
     more than `climb` sub-terraces of difference (the climb limit is provisional). */
  function computePasses(S, P) {
    const { W, H, ter, sub, U } = S, water = S.block;
    const g0 = new Int16Array(S.n);
    const reg = comps(W, H, ter, g0).id; // same-terrace regions
    let wreg = null;                      // same-terrace regions split by the climb limit (only if it can matter)
    if (P.climb < S.subs - 1) {
      const par = new Int32Array(S.n).map((_, i) => i);
      const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue;
        const i = y * W + x, j = ny * W + nx;
        if (ter[i] === ter[j] && Math.abs(sub[i] - sub[j]) <= P.climb) { const ra = find(i), rb = find(j); if (ra !== rb) par[ra] = rb; }
      }
      wreg = new Int32Array(S.n).map((_, i) => find(i));
    }
    const cand = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (water[i] || water[j]) continue;
        const dt = Math.abs(ter[i] - ter[j]);
        if (dt === 1) {
          const a = ter[i] < ter[j] ? i : j, b = a === i ? j : i;
          cand.push({ a, b, g: Math.abs(U[i] - U[j]), key: reg[a] + ':' + reg[b] });
        } else if (dt === 0 && wreg && Math.abs(sub[i] - sub[j]) > P.climb) {
          const a = sub[i] < sub[j] ? i : j, b = a === i ? j : i;
          cand.push({ a, b, g: Math.abs(U[i] - U[j]), key: 'w' + wreg[a] + ':' + wreg[b] });
        }
      }
    }
    cand.sort((p, q) => p.g - q.g);
    const chosen = [], pair = new Set(), usedA = new Set(), usedB = new Set();
    const bx = (c) => c.b % W, by = (c) => (c.b / W) | 0;
    const take = (c) => { chosen.push(c); usedA.add(c.a); usedB.add(c.b); };
    for (const c of cand) { // best pass per region pair keeps regions connectable
      if (pair.has(c.key) || usedA.has(c.a) || usedB.has(c.b)) continue;
      pair.add(c.key); take(c);
    }
    for (const c of cand) {
      if (usedA.has(c.a) || usedB.has(c.b)) continue;
      let ok = true;
      for (const o of chosen) {
        if (Math.hypot(bx(c) - bx(o), by(c) - by(o)) < P.passGap) { ok = false; break; }
      }
      if (ok) take(c);
    }
    S.passes = chosen;
  }

  /* Stairs are carved into the terrain. Each tread rises at most `tread` sub-terraces (default: the climb limit; never more). A stair is cut into the upper
     terrace (or, if that does not fit, built on the lower one) as `stairW` columns of treads; the treads take
     heights from the existing levels plus "bridge" levels in the gap between terraces (only the ones that end up
     used become levels), so every technique gets the same geometry from its normal level pipeline. */
  const MAX_TREADS = 6, STAIR_COLS = { 1: [0], 2: [0, 1], 3: [-1, 0, 1] };
  function carveStairs(S, P) {
    const { W, H, n } = S, K = S.subs, N = S.N, s = E.subHeight(P), EPS = 1e-9;
    const tread = Math.max(1, Math.min(P.climb, Math.round(P.tread === undefined ? P.climb : P.tread))), reachPlain = tread * s, reach = reachPlain + EPS; // each tread rises at most `tread` sub-terraces
    if (P.stairW === 0) { // diagnostic: no carving at all (stair sites stay unconnected)
      S.carved = new Uint8Array(n); S.stairs = []; S.stairInfo = { sites: S.passes.length, placed: 0, dropped: 0, narrowed: 0, fills: 0, width: 0 }; return;
    }
    const width = Math.max(1, Math.min(3, Math.round(P.stairW === undefined ? 2 : P.stairW)));
    const cands = [];
    for (let L = 0; L <= S.maxFine; L++) cands.push({ h: S.levelH[L], base: L });
    for (let t = 0; t + 1 < N; t++) {
      const top = t * P.terH + (K - 1) * s, g = (t + 1) * P.terH - top, nb = Math.ceil(g / reachPlain - EPS) - 1;
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
      for (const mode of ['cut', 'fill']) { const r = plan(pass, mode); if (r && (!rec || r.cols.length > rec.cols.length)) rec = r; }
      if (!rec) { dropped++; continue; }
      if (rec.mode === 'fill') fills++;
      if (rec.narrowed) narrowed++;
      for (let ci = 0; ci < rec.cols.length; ci++) { used[rec.bottom[ci]] = 1; used[rec.top[ci]] = 1; }
      for (const st of rec.steps) for (const t of st.tiles) { used[t] = 1; carved[t] = 1; carve.set(t, st.cand); }
      stairs.push(rec);
    }
    S.carved = carved; S.stairs = stairs; S.stairInfo = { sites: S.passes.length, placed: stairs.length, dropped, narrowed, fills, width };
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
