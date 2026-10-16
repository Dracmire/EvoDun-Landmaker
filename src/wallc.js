/* WALL PASS of technique C (crystallizer 4, phase 2; C-only geometry: it needs sub-tile resolution, Box / A / B do not get it; the wall DRESSING stays the shared pass of the four techniques).
   A cliff band of blocks built OUTWARD on the lower ground in front of every wall (D17: the upper floor and its lip stay intact). Visual only: walking, regions, gates and ramps do not change.
   P.wallPass: 't3' (default, the Unexplored 2 look: atoms + strata + fusion), 't2' (alternative: Voronoi blocks moved by groups through N height passes, NO fusion), 'off' (the C of phase 1, identical pixels).
   WALLS: every Voronoi edge of C with a jump (levelH[hi] - levelH[lo]) of 0.5 terH or more (the threshold of the dressing), except edges next to an exempt cell (ramp / stair footprints + 1 ring, Ascension wall faces, Cake rings, and the owner tiles of the Pocket roads: D23) and next to void:
   the band is interrupted there. H = the jump in tiles. "The nearest higher ground IS the terrace a" holds by construction: a low point is tied to the nearest wall edge of ITS OWN level (an intermediate ledge has its own edges).
   TECHNIQUE 3 (layout space first, then the extrusion scale):
     atoms     a jittered grid of 0.5 tile (jitter +-0.3 of the cell, hashed by WHOLE-MAP coordinates), cells = Voronoi of those seeds, clipped to the LOW-SIDE C cell of level lo (convex x convex, no library): the pieces of an
               atom. (The parts of a prism inside the upper terrace would not always be hidden by its cap near the lip, so the pieces are clipped to the low side: user's decision.)
     band      an atom belongs to a wall when the mean distance of its low-side area to the lip is < 0.35 * H and, for those points, the nearest wall edge is the same terrace; u = mean / (0.35 H) in [0, 1);
               it touches the lip when one of its edges lies on the wall edge.
     columns   coarse Worley (spacing P.wallColumn, 1.2 tile) on the atom's lip point.
     strata    K = max(2, round(jumpTerH * P.wallStrata)) (default 3 per terrace), stratum s in 0..K. Column profile (hashed per column): buttress 0.20 (s = K if u < 0.7 else K - 1), step 0.55 (s = (K - 1) - floor(clamp(u + off, 0, 0.999) * K),
               off = U(-0.25, 0.25)), recess 0.25 (s = (K - 2) - floor(u * K)); s >= 0. SUPPORT RULE after every change: by increasing u, an atom that does not touch the lip has s <= the max s of its band neighbours with smaller u (0 if none).
     fusion    at most 20 rounds. Islands = 4-connected atoms of equal s > 0. (a) an island with s < K whose layout area is < 0.30 tile^2, or whose area / border is < 0.10 tile, takes the s of the neighbour with the longest shared border (0 = floor);
               (b) an island longer than LMAX = 3.6 tiles along the wall (columns * column width, the top stratum included) has the atoms of its MIDDLE column lowered by 1. Then the support rule again. (b) is not always met: it is measured, not enforced.
     heights   block top = lower ground + H * s / K.
     extrusion P.wallExtrude (slider 0.10-0.40, default 0.25; tests up to 1.0): the band is nominally 0.35 * H deep, but an atom is accepted WHOLE when its MEAN distance is < 0.35 H, so its far vertices reach up to REACH (0.45 tile) beyond: the world depth is
               at most (0.35 * H + REACH) * extrude (measured in tools/test_walls_c.js). World geometry = layout geometry compressed toward the lip along the direction to the nearest lip point, v' = lip(v) + (v - lip(v)) * extrude, the SAME mapping for every vertex
               (shared vertices stay shared, edges are cut every 0.5 tile). Only the depth changes, not the layout along the wall.
   TECHNIQUE 2 (no fusion): lateral seeds along the lip every P.t2Spacing (0.9), NP = P.t2Rows (6) height passes, each lateral cell with its own jittered row boundaries; groups = coarse 1D Worley on the lateral seed (P.t2Group, 1.0 tile);
     depth level per (group, pass) in 0..3 with p = 0.35 / 0.25 / 0.25 / 0.15, depth = level / 3 * maxDepth, maxDepth = 0.35 * H * extrude. Block = lateral cell footprint from the lip out to its depth, z in its row; overhangs allowed.
     P.t2Jitter (default 0.4) is the lateral and row jitter, higher than the atoms' 0.3: the "face" of the stone.
   OUTPUT (both): per upper level `hi`: faces (vertical quads with an outward normal) and tops (polygons at a height), drawn by renderLevels in the pass of level `hi` after the walls of that level and before its cap, by depth. */
(function (E) {
  const DEF = { wallPass: 't3', wallExtrude: 0.25, wallStrata: 3, wallColumn: 1.2, t2Spacing: 0.9, t2Rows: 6, t2Group: 1.0, t2Jitter: 0.4 };
  const par = (P, k) => (P[k] === undefined ? DEF[k] : P[k]);
  const KEYS = ['wallExtrude', 'wallStrata', 'wallColumn', 't2Spacing', 't2Rows', 't2Group', 't2Jitter'];
  const wkey = (P) => par(P, 'wallPass') + ':' + KEYS.map((k) => par(P, k)).join(':');
  const BAND = 0.35, REACH = 0.45, MIN_JUMP = 0.5, ATOM = 0.5, ATOM_JIT = 0.3, LMAX = 3.6, FULLMIN = 0.15, FINE = 1 / 16;
  const ROAD_RADIUS = 0; // Pocket roads (S.pocketRole 3) are left out of the wall pass: radius in tiles around the road tiles (0 = the road tiles only; 1 = + one ring, measured, not chosen)
  /* the Pocket road tiles as a mask over the window (null when the shape has no Pocket). Local to the wall pass: E.curves.exemptTiles also stops the Voronoi displacement, and the roads would turn rectilinear */
  function roadMask(S) {
    if (!(S.pocket && S.pocketRole)) return null;
    const W = S.W, H = S.H, r = ROAD_RADIUS, m = new Uint8Array(W * H); let any = false;
    for (let i = 0; i < m.length; i++) if (S.pocketRole[i] === 3) { any = true; const x = i % W, y = (i / W) | 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) m[yy * W + xx] = 1; } }
    return any ? m : null;
  }
  const hash = (a, b, c, d) => E.curves.hash(a, b, c, d);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const area2 = (x, y) => { let a = 0; for (let k = 0, n = x.length; k < n; k++) { const j = (k + 1) % n; a += x[k] * y[j] - x[j] * y[k]; } return a; }; // twice the signed area

  /* ---- the wall edges of C and a grid to find the nearest one ---- */
  function wallEdges(S, P, st) {
    const e = st.edges, g = st.grid, th = P.terH || 1, list = [], byLo = new Map(), road = roadMask(S);
    let hmax = 0, roadEdges = 0;
    for (let i = 0; i < e.x0.length; i++) {
      const lo = e.lo[i], hi = e.hi[i]; if (lo < 0) continue;
      const H = S.levelH[hi] - S.levelH[lo]; if (H < MIN_JUMP * th - 1e-9) continue;
      const ci = e.ci[i], co = e.co[i]; if (g.ex[ci] || (co >= 0 && g.ex[co])) continue; // the band is interrupted next to the exempt cells
      if (road && (road[g.own[ci]] || (co >= 0 && road[g.own[co]]))) { roadEdges++; continue; } // Pocket road: the owner tile of either cell (the cell -> tile map of C), the flank keeps the plain slab wall
      list.push(i); hmax = Math.max(hmax, H);
      let m = byLo.get(lo); if (!m) byLo.set(lo, m = new Map());
      const x0 = Math.floor(Math.min(e.x0[i], e.x1[i])), x1 = Math.floor(Math.max(e.x0[i], e.x1[i])), y0 = Math.floor(Math.min(e.y0[i], e.y1[i])), y1 = Math.floor(Math.max(e.y0[i], e.y1[i]));
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const k = x * 8192 + y; let a = m.get(k); if (!a) m.set(k, a = []); a.push(i); }
    }
    // a point on a road tile: the OWNER tile of the C cell that holds it (E.cellTileAt), the same cell -> tile map as the edge test above
    const roadAt = road ? (x, y) => { const t = E.cellTileAt(S, P, x, y); return t >= 0 && road[t] === 1; } : () => false;
    return { st, e, list, byLo, hmax, S, road, roadEdges, roadAt };
  }
  /* nearest wall edge of level lo (and of upper level hi when hi >= 0) within rmax: { i, d, qx, qy } or null */
  function nearest(W, lo, hi, x, y, rmax) {
    const m = W.byLo.get(lo); if (!m) return null; const e = W.e, r = Math.ceil(rmax), cx = Math.floor(x), cy = Math.floor(y); let best = null, bd = rmax;
    for (let ix = cx - r; ix <= cx + r; ix++) for (let iy = cy - r; iy <= cy + r; iy++) {
      const a = m.get(ix * 8192 + iy); if (!a) continue;
      for (const i of a) {
        if (hi >= 0 && e.hi[i] !== hi) continue;
        const x0 = e.x0[i], y0 = e.y0[i], vx = e.x1[i] - x0, vy = e.y1[i] - y0, l2 = vx * vx + vy * vy || 1e-12, t = clamp(((x - x0) * vx + (y - y0) * vy) / l2, 0, 1), qx = x0 + vx * t, qy = y0 + vy * t, d = Math.hypot(qx - x, qy - y);
        if (d < bd) { bd = d; best = { i, d, qx, qy }; }
      }
    }
    return best;
  }
  /* an edge a -> b cut every <= 0.5 tile, the cut points computed from the lexicographically smaller end so the two faces that share an edge cut it at the same points */
  function subdiv(ax, ay, bx, by) {
    const flip = ax > bx || (ax === bx && ay > by), x0 = flip ? bx : ax, y0 = flip ? by : ay, x1 = flip ? ax : bx, y1 = flip ? ay : by, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.5 - 1e-9)), out = [];
    for (let k = 0; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    return flip ? out.reverse() : out;
  }

  /* ================= TECHNIQUE 3 ================= */
  function buildT3(S, P, W) {
    const st = W.st, g = st.grid, th = P.terH || 1, wox = S.ox, woy = S.oy, ext = par(P, 'wallExtrude'), strata = par(P, 'wallStrata'), colSp = par(P, 'wallColumn'), CP = E.curves, stats = { atoms: 0, instances: 0, band: 0, pieces: 0 };
    // atoms (cells of the 0.5-tile jittered grid, hashed by whole-map coordinates), created on demand
    const atoms = [], amap = new Map();
    const atom = (ai, aj) => {
      const k = (ai + 8192) * 16384 + (aj + 8192); let a = amap.get(k); if (a) return a;
      a = { id: atoms.length, ai, aj, x: ((ai + 0.5) + (hash(ai, aj, 901, 1) * 2 - 1) * ATOM_JIT) * ATOM - wox, y: ((aj + 0.5) + (hash(ai, aj, 901, 2) * 2 - 1) * ATOM_JIT) * ATOM - woy, poly: null };
      atoms.push(a); amap.set(k, a); return a;
    };
    const atomPoly = (a) => {
      if (a.poly) return a.poly; const hs = 2 * ATOM;
      let poly = { x: [a.x - hs, a.x + hs, a.x + hs, a.x - hs], y: [a.y - hs, a.y - hs, a.y + hs, a.y + hs], t: [-3, -3, -3, -3] };
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue; const q = atom(a.ai + di, a.aj + dj), dx = a.x - q.x, dy = a.y - q.y;
        poly = CP.clip(poly, dx, dy, -(dx * (a.x + q.x) + dy * (a.y + q.y)) / 2, q.id); if (poly.x.length < 3) break;
      }
      return (a.poly = poly);
    };
    // candidate instances (atom, ground level lo): the atoms near the wall edges
    const cand = new Map();
    for (const i of W.list) {
      const lo = st.edges.lo[i], hi = st.edges.hi[i], H = S.levelH[hi] - S.levelH[lo], reach = BAND * H + 0.7, e = st.edges;
      const ax0 = Math.floor((Math.min(e.x0[i], e.x1[i]) - reach + wox) / ATOM), ax1 = Math.floor((Math.max(e.x0[i], e.x1[i]) + reach + wox) / ATOM), ay0 = Math.floor((Math.min(e.y0[i], e.y1[i]) - reach + woy) / ATOM), ay1 = Math.floor((Math.max(e.y0[i], e.y1[i]) + reach + woy) / ATOM);
      for (let ai = ax0; ai <= ax1; ai++) for (let aj = ay0; aj <= ay1; aj++) { const a = atom(ai, aj); cand.set(a.id * 1024 + lo, [a, lo]); }
    }
    stats.atoms = atoms.length; stats.instances = cand.size;
    // low-side pieces of every instance: atom cell x the C cells of level lo
    const cpoly = new Map(), cellPoly = (c) => { let p = cpoly.get(c); if (!p) cpoly.set(c, p = CP.cellPolygon(g, c, st.R, S.W, S.H)); return p; };
    const piecesOf = (a, lo) => {
      const A = atomPoly(a); if (A.x.length < 3) return [];
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let k = 0; k < A.x.length; k++) { x0 = Math.min(x0, A.x[k]); x1 = Math.max(x1, A.x[k]); y0 = Math.min(y0, A.y[k]); y1 = Math.max(y1, A.y[k]); }
      const out = [], gx0 = Math.max(0, Math.floor(x0 / g.cell) - st.R), gx1 = Math.min(g.gw - 1, Math.floor(x1 / g.cell) + st.R), gy0 = Math.max(0, Math.floor(y0 / g.cell) - st.R), gy1 = Math.min(g.gh - 1, Math.floor(y1 / g.cell) + st.R);
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const c = gy * g.gw + gx; if (g.lev[c] !== lo) continue;
        const cp = cellPoly(c); if (cp.x.length < 3) continue;
        let poly = A;
        for (let k = 0; k < cp.x.length && poly.x.length >= 3; k++) { // convex x convex: the half-planes of the C cell
          const p = (k + cp.x.length - 1) % cp.x.length, tg = cp.t[k]; if (tg === -3) continue;
          let fa = -(cp.y[k] - cp.y[p]), fb = cp.x[k] - cp.x[p], fc = -(fa * cp.x[p] + fb * cp.y[p]); if (Math.hypot(fa, fb) < 1e-12) continue;
          if (fa * g.sx[c] + fb * g.sy[c] + fc < 0) { fa = -fa; fb = -fb; fc = -fc; }
          const cls = tg >= 0 ? (g.lev[tg] > lo ? -10 : g.lev[tg] === lo ? -11 : -12) : -12; // lip (higher ground), the same level (internal), anything else (the band ends)
          poly = CP.clip(poly, fa, fb, fc, cls);
        }
        if (poly.x.length < 3) continue; const ar = Math.abs(area2(poly.x, poly.y)) / 2; if (ar < 1e-4) continue;
        out.push({ poly, area: ar });
      }
      return out;
    };
    const exT = st.exemptTiles, rdT = W.road, tileEx = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < S.W && ty < S.H && (!!exT[ty * S.W + tx] || (rdT !== null && !!rdT[ty * S.W + tx])); }; // the band is interrupted over the exempt tiles (footprints + ring, Ascension faces, Cake rings)
    const rmaxFor = BAND * W.hmax + 0.3, inst = [], imap = new Map();
    for (const [key, [a, lo]] of cand) {
      const pcs = piecesOf(a, lo); if (!pcs.length) continue;
      let tot = 0, big = pcs[0]; for (const p of pcs) { tot += p.area; if (p.area > big.area) big = p; }
      let cx = 0, cy = 0; for (let k = 0; k < big.poly.x.length; k++) { cx += big.poly.x[k]; cy += big.poly.y[k]; } cx /= big.poly.x.length; cy /= big.poly.y.length;
      const n0 = nearest(W, lo, -1, cx, cy, rmaxFor); if (!n0) continue;
      if (pcs.some((p) => p.poly.x.some((vx, k) => tileEx((vx + p.poly.x[(k + 1) % p.poly.x.length]) / 2, (p.poly.y[k] + p.poly.y[(k + 1) % p.poly.y.length]) / 2) || W.roadAt((vx + p.poly.x[(k + 1) % p.poly.x.length]) / 2, (p.poly.y[k] + p.poly.y[(k + 1) % p.poly.y.length]) / 2)) || tileEx(cx, cy) || W.roadAt(cx, cy))) continue; // a piece touching an exempt tile or a Pocket road (tile under the point, or the owner tile of its C cell): no atom there
      const hi = st.edges.hi[n0.i], H = S.levelH[hi] - S.levelH[lo]; if (n0.d >= BAND * H) continue;
      let sum = 0, ok = true;
      for (const p of pcs) {
        const px = p.poly.x, py = p.poly.y, n = px.length; let mx = 0, my = 0; for (let k = 0; k < n; k++) { mx += px[k]; my += py[k]; } mx /= n; my /= n;
        const pts = [[mx, my]]; for (let k = 0; k < Math.min(n, 6); k++) pts.push([(mx + px[k]) / 2, (my + py[k]) / 2]);
        let ps = 0; for (const q of pts) { const nn = nearest(W, lo, -1, q[0], q[1], rmaxFor); if (!nn || st.edges.hi[nn.i] !== hi) { ok = false; break; } ps += nn.d; }
        if (!ok) break; sum += (ps / pts.length) * p.area;
      }
      if (!ok) continue;
      const u = sum / tot / (BAND * H); if (!(u < 1)) continue;
      let lip = false; for (const p of pcs) { for (let k = 0; k < p.poly.t.length; k++) if (p.poly.t[k] === -10) { lip = true; break; } if (lip) break; }
      const wlx = n0.qx + wox, wly = n0.qy + woy, K = Math.max(2, Math.round(H / th * strata));
      // column: coarse Worley on the lip point (whole-map coordinates)
      let cid = 0, cbd = 1e9; const gx = Math.floor(wlx / colSp), gy = Math.floor(wly / colSp);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const fx = (gx + i + hash(gx + i, gy + j, 911, 1)) * colSp, fy = (gy + j + hash(gx + i, gy + j, 911, 2)) * colSp, d = (fx - wlx) ** 2 + (fy - wly) ** 2; if (d < cbd) { cbd = d; cid = (gx + i) * 100003 + (gy + j); } }
      const pr = hash(cid, 0, 912, 3), prof = pr < 0.20 ? 0 : pr < 0.75 ? 1 : 2, off = (hash(cid, 0, 913, 4) * 2 - 1) * 0.25;
      let s = prof === 0 ? (u < 0.7 ? K : K - 1) : prof === 1 ? (K - 1) - Math.floor(clamp(u + off, 0, 0.999) * K) : (K - 2) - Math.floor(u * K);
      s = Math.max(0, Math.min(K, s));
      const rec = { a, lo, hi, H, K, u, lip, area: tot, pieces: pcs, s, col: cid, lx: wlx, ly: wly, group: lo * 4096 + hi, nb: null, floor: 0, alive: true };
      inst.push(rec); imap.set(a.id * 1024 + lo, rec);
    }
    stats.band = inst.length;
    // adjacency: shared border lengths between band instances of the same wall; the rest (the band's end, other levels) is "floor"
    for (const r of inst) {
      r.nb = new Map(); r.floor = 0;
      for (const p of r.pieces) for (let k = 0; k < p.poly.x.length; k++) {
        const j = (k + p.poly.x.length - 1) % p.poly.x.length, len = Math.hypot(p.poly.x[k] - p.poly.x[j], p.poly.y[k] - p.poly.y[j]), tg = p.poly.t[k]; if (len < 1e-9) continue;
        if (tg === -10 || tg === -11) continue;
        if (tg >= 0) { const o = imap.get(tg * 1024 + r.lo); if (o && o.group === r.group) { r.nb.set(o, (r.nb.get(o) || 0) + len); continue; } }
        r.floor += len;
      }
    }
    const order = inst.slice().sort((p, q) => p.u - q.u);
    const support = () => { let ch = 0; for (const r of order) { if (r.lip || r.s === 0) continue; let m = 0; for (const o of r.nb.keys()) if (o.u < r.u) m = Math.max(m, o.s); if (r.s > m) { r.s = m; ch++; } } return ch; };
    support();
    const islands = () => { // 4-connected atoms of equal s > 0 (within a wall)
      const seen = new Set(), out = [];
      for (const r of inst) {
        if (r.s <= 0 || seen.has(r)) continue; const m = [r]; seen.add(r);
        for (let i = 0; i < m.length; i++) for (const o of m[i].nb.keys()) if (!seen.has(o) && o.s === r.s) { seen.add(o); m.push(o); }
        let area = 0, border = 0, lx = 0, ly = 0; const cols = new Map();
        for (const q of m) { area += q.area; lx += q.lx; ly += q.ly; border += q.floor; for (const [o, l] of q.nb) if (o.s !== q.s) border += l; let c = cols.get(q.col); if (!c) cols.set(q.col, c = { lx: 0, ly: 0, n: 0, m: [] }); c.lx += q.lx; c.ly += q.ly; c.n++; c.m.push(q); }
        out.push({ m, s: r.s, K: r.K, H: r.H, area, border, lx: lx / m.length, ly: ly / m.length, cols });
      }
      return out;
    };
    const measure = (isl) => ({ islands: isl.length, slivers: isl.filter((q) => q.s < q.K && q.area < 0.30).length, thin: isl.filter((q) => q.H >= 1.5 * th && q.border > 0 && q.area / q.border < 0.10).length, thinAll: isl.filter((q) => q.border > 0 && q.area / q.border < 0.10).length, tinyFull: isl.filter((q) => q.s === q.K && q.area < FULLMIN).length, spans: isl.filter((q) => q.cols.size * colSp > LMAX).length, meanSpan: isl.length ? isl.reduce((t, q) => t + q.cols.size * colSp, 0) / isl.length : 0, maxSpan: isl.reduce((t, q) => Math.max(t, q.cols.size * colSp), 0) });
    stats.before = measure(islands());
    let rounds = 0;
    for (; rounds < 20; rounds++) {
      const isl = islands(); let changed = 0; const set = new Map();
      for (const q of isl) {
        if ((q.s < q.K && (q.area < 0.30 || (q.border > 0 && q.area / q.border < 0.10)))) { // (a) a sliver or a thin island takes the s of the neighbour with the longest shared border
          const by = new Map(); by.set(0, 0); for (const r of q.m) { by.set(0, by.get(0) + r.floor); for (const [o, l] of r.nb) if (o.s !== q.s) by.set(o.s, (by.get(o.s) || 0) + l); }
          let bs = 0, bl = -1; for (const [sv, l] of by) if (l > bl || (l === bl && sv < bs)) { bl = l; bs = sv; } for (const r of q.m) set.set(r, bs); continue;
        }
        if (q.cols.size * colSp > LMAX) { // (b) too long: the atoms of the middle column are lowered by 1
          let best = null, bd = 1e9; for (const [, c] of q.cols) { const d = (c.lx / c.n - q.lx) ** 2 + (c.ly / c.n - q.ly) ** 2; if (d < bd) { bd = d; best = c; } }
          for (const r of best.m) set.set(r, Math.max(0, q.s - 1));
        }
      }
      for (const [r, v] of set) if (r.s !== v) { r.s = v; changed++; }
      changed += support(); if (!changed) break;
    }
    // final cleanup (after the rounds, so that single atoms have already merged into their islands): a TINY full-height island (s = K, area < FULLMIN = 0.15 tile², about a 0.4 tile square before the extrusion; the real map has a continuous spread of them, median 0.04-0.08) is a free-standing plate at the end of a spur or a corner (seen on the real map near (96, 68)); it takes the s of the neighbour with the longest shared border like a sliver
    for (let it = 0; it < 3; it++) {
      let changed = 0;
      for (const q of islands()) {
        if (q.s !== q.K || q.area >= FULLMIN) continue;
        const by = new Map(); by.set(0, 0); for (const r of q.m) { by.set(0, by.get(0) + r.floor); for (const [o, l] of r.nb) if (o.s !== q.s) by.set(o.s, (by.get(o.s) || 0) + l); }
        let bs = 0, bl = -1; for (const [sv, l] of by) if (l > bl || (l === bl && sv < bs)) { bl = l; bs = sv; } for (const r of q.m) { r.s = bs; changed++; }
      }
      if (!changed) break; support();
    }
    stats.rounds = rounds; stats.after = measure(islands());
    // ---- geometry ----
    const byHi = new Map(), top = (r, s) => S.levelH[r.lo] + r.H * s / r.K, ensure = (hi) => { let a = byHi.get(hi); if (!a) byHi.set(hi, a = { faces: [], tops: [] }); return a; };
    const lipOf = (r, x, y) => nearest(W, r.lo, r.hi, x, y, BAND * r.H + 0.4);
    const mapV = (r, x, y) => { const q = lipOf(r, x, y); return q ? [q.qx + (x - q.qx) * ext, q.qy + (y - q.qy) * ext] : [x, y]; };
    for (const r of inst) {
      if (r.s <= 0) continue; const dst = ensure(r.hi), th0 = top(r, r.s);
      for (const p of r.pieces) {
        const X = p.poly.x, Y = p.poly.y, n = X.length, sign = area2(X, Y) >= 0 ? 1 : -1, ring = [], sg = []; // sg: every sub-segment of the ring in order (face or not) for the vertex normals
        for (let k = 0; k < n; k++) {
          const j = (k + n - 1) % n, tg = p.poly.t[k]; let lowTop = null; // the edge from vertex j to vertex k
          if (tg >= 0) { const o = imap.get(tg * 1024 + r.lo); const so = o && o.group === r.group ? o.s : 0; if (so < r.s) lowTop = top(r, so); }
          else if (tg === -12) lowTop = S.levelH[r.lo];
          const pts = subdiv(X[j], Y[j], X[k], Y[k]).map((v) => mapV(r, v[0], v[1]));
          for (let q = 0; q < pts.length - 1; q++) ring.push(pts[q]);
          const has = !(lowTop === null || th0 - lowTop < 1e-6);
          for (let q = 0; q < pts.length - 1; q++) {
            const a = pts[q], b = pts[q + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (l < 1e-9) continue;
            const f = has ? { ax: a[0], ay: a[1], bx: b[0], by: b[1], zlo: lowTop, zhi: th0, nx: sign * dy / l, ny: -sign * dx / l, lo: r.lo, hi: r.hi, tot: r.H / th, top: r.s === r.K, wx: wox + Math.floor((a[0] + b[0]) / 2), wy: woy + Math.floor((a[1] + b[1]) / 2) } : null;
            sg.push({ n: [sign * dy / l, -sign * dx / l], f }); if (f) dst.faces.push(f);
          }
        }
        for (let i = 0; i < sg.length; i++) { // vertex normals along the ring (the dressing shades a face as a gradient between the shades of its two vertex normals, like the slab walls of C): the average with the next / previous sub-segment when that one is a face and turns less than 60 degrees
          const f = sg[i].f; if (!f) continue; const pv = sg[(i + sg.length - 1) % sg.length], nx = sg[(i + 1) % sg.length], me = sg[i].n;
          const vn = (o) => { if (!o.f || o.n[0] * me[0] + o.n[1] * me[1] < 0.5) return me; const x = me[0] + o.n[0], y = me[1] + o.n[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
          f.na = vn(pv); f.nb = vn(nx);
        }
        let cx = 0, cy = 0; for (const v of ring) { cx += v[0]; cy += v[1]; } dst.tops.push({ pts: ring, z: th0, zb: S.levelH[r.lo], lo: r.lo, hi: r.hi, ledge: r.s < r.K, cx: cx / ring.length, cy: cy / ring.length });
        stats.pieces++;
      }
    }
    return { byHi, stats, inst };
  }

  /* ================= TECHNIQUE 2 ================= */
  function buildT2(S, P, W) {
    const st = W.st, e = st.edges, th = P.terH || 1, wox = S.ox, woy = S.oy, ext = par(P, 'wallExtrude'), sp = par(P, 't2Spacing'), NP = Math.max(2, Math.round(par(P, 't2Rows'))), gw = par(P, 't2Group'), jit = par(P, 't2Jitter'), stats = { chains: 0, blocks: 0 };
    // chains of wall edges of one (lo, hi)
    const QK = 1e5, key = (x, y) => Math.round(x * QK) * 134217728 + Math.round(y * QK), by = new Map();
    for (const i of W.list) { const k = e.lo[i] * 4096 + e.hi[i]; let a = by.get(k); if (!a) by.set(k, a = []); a.push(i); }
    const byHi = new Map(), ensure = (hi) => { let a = byHi.get(hi); if (!a) byHi.set(hi, a = { faces: [], tops: [] }); return a; };
    for (const [gk, ids] of by) {
      const lo = Math.floor(gk / 4096), hi = gk % 4096, g0 = S.levelH[lo], H = S.levelH[hi] - g0, maxD = BAND * H * ext, out = new Map(), inn = new Set();
      for (const i of ids) { const k = key(e.x0[i], e.y0[i]); let a = out.get(k); if (!a) out.set(k, a = []); a.push(i); inn.add(key(e.x1[i], e.y1[i])); }
      const used = new Set(), starts = ids.filter((i) => !inn.has(key(e.x0[i], e.y0[i]))).concat(ids), dst = ensure(hi);
      for (const i0 of starts) {
        if (used.has(i0)) continue; const pts = [[e.x0[i0], e.y0[i0]]]; let c = i0;
        while (c !== undefined && !used.has(c)) { used.add(c); pts.push([e.x1[c], e.y1[c]]); const a = out.get(key(e.x1[c], e.y1[c])); c = a && a.find((q) => !used.has(q)); }
        if (pts.length < 2) continue; stats.chains++;
        // arclength and outward normals of the chain (the normal of an edge is (dy, -dx))
        const L = [0]; for (let k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])); const total = L[L.length - 1]; if (total < 0.2) continue;
        const segN = []; for (let k = 1; k < pts.length; k++) { const dx = pts[k][0] - pts[k - 1][0], dy = pts[k][1] - pts[k - 1][1], l = Math.hypot(dx, dy) || 1; segN.push([dy / l, -dx / l]); }
        const vn = pts.map((_, k) => { const a = segN[Math.max(0, k - 1)], b = segN[Math.min(segN.length - 1, k)], nx = a[0] + b[0], ny = a[1] + b[1], l = Math.hypot(nx, ny); return l > 1e-6 ? [nx / l, ny / l] : b; });
        const at = (s) => { let k = 1; while (k < L.length - 1 && L[k] < s) k++; const t = (s - L[k - 1]) / ((L[k] - L[k - 1]) || 1); return { x: pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * t, y: pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t, n: [vn[k - 1][0] + (vn[k][0] - vn[k - 1][0]) * t, vn[k - 1][1] + (vn[k][1] - vn[k - 1][1]) * t], k }; };
        const ch = Math.round(pts[0][0] * 1000 + wox * 1000) * 7919 + Math.round(pts[0][1] * 1000 + woy * 1000) + gk * 104729; // the chain's identity: its start in whole-map coordinates
        // lateral seeds, groups (1D Worley), rows
        const seeds = []; for (let s = hash(ch, 0, 921, 1) * sp, i = 0; s < total + sp; s += sp * (0.6 + 0.8 * hash(ch, i + 1, 922, 2)) , i++) seeds.push(s);
        const cells = seeds.map((s, i) => ({ s, t0: i === 0 ? 0 : (seeds[i - 1] + s) / 2, t1: i === seeds.length - 1 ? total : (s + seeds[i + 1]) / 2 })).filter((c) => c.t0 < total && c.t1 > c.t0 + 1e-6); if (!cells.length) continue;
        const grp = (s) => { const j0 = Math.floor(s / gw); let bj = j0, bd = 1e9; for (let j = j0 - 1; j <= j0 + 1; j++) { const f = (j + hash(ch, j, 923, 3)) * gw, d = Math.abs(f - s); if (d < bd) { bd = d; bj = j; } } return bj; };
        const depthOf = (gj, row) => { const r = hash(ch, gj * 64 + row, 924, 4); return (r < 0.35 ? 0 : r < 0.60 ? 1 : r < 0.85 ? 2 : 3) / 3 * maxD; };
        const rows = cells.map((c, i) => { const b = [0]; for (let k = 1; k < NP; k++) b.push(clamp(k / NP + (hash(ch, i * 64 + k, 925, 5) * 2 - 1) * jit / NP, b[k - 1] + 0.01, 1 - (NP - k) * 0.01)); b.push(1); return b; });
        const grpOf = cells.map((c) => grp(c.s)), dep = cells.map((c, i) => { const gj = grpOf[i]; const a = []; for (let k = 0; k < NP; k++) a.push(depthOf(gj, k)); return a; });
        cells.forEach((c, i) => {
          for (let k = 0; k < NP; k++) {
            const d = dep[i][k], gj0 = grpOf[i]; if (d < 1e-4) continue; const z0 = g0 + H * rows[i][k], z1 = g0 + H * rows[i][k + 1], topRow = k === NP - 1;
            // footprint along the chain from c.t0 to c.t1: the vertices inside plus the two ends
            const ss = [c.t0]; for (let q = 1; q < L.length - 1; q++) if (L[q] > c.t0 + 1e-6 && L[q] < c.t1 - 1e-6) ss.push(L[q]); ss.push(c.t1);
            const base = ss.map((s) => at(s)), front = base.map((b) => [b.x + b.n[0] * d, b.y + b.n[1] * d]);
            if (W.road && (front.some((f, q) => W.roadAt(f[0], f[1]) || (q > 0 && W.roadAt((f[0] + front[q - 1][0]) / 2, (f[1] + front[q - 1][1]) / 2))) || W.roadAt((base[0].x + front[front.length - 1][0]) / 2, (base[0].y + front[front.length - 1][1]) / 2))) continue; // a block whose front lies on a Pocket road (owner tile): none
            for (let q = 0; q < base.length - 1; q++) {
              const a = front[q], b = front[q + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (l < 1e-9) continue;
              dst.faces.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], zlo: z0, zhi: z1, nx: dy / l, ny: -dx / l, na: base[q].n, nb: base[q + 1].n, lo, hi, tot: H / th, top: topRow, wx: wox + Math.floor((a[0] + b[0]) / 2), wy: woy + Math.floor((a[1] + b[1]) / 2), dep: d, grp: gj0, row: k, chain: ch, maxD });
            }
            for (const [side, nb] of [[0, i - 1], [1, i + 1]]) { // the end faces, only where the neighbouring cell's block of the same row is shallower
              const dn = nb >= 0 && nb < cells.length ? dep[nb][k] : 0; if (d - dn < 1e-4) continue;
              const bp = side ? base[base.length - 1] : base[0], tx = side ? 1 : -1, tg = [segN[Math.min(segN.length - 1, bp.k - 1)][1] * -1, segN[Math.min(segN.length - 1, bp.k - 1)][0]]; // tangent (the chain direction): n = (dy, -dx) -> t = (-n.y, n.x)
              const a = [bp.x + bp.n[0] * dn, bp.y + bp.n[1] * dn], b = [bp.x + bp.n[0] * d, bp.y + bp.n[1] * d];
              dst.faces.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], zlo: z0, zhi: z1, nx: tg[0] * tx, ny: tg[1] * tx, lo, hi, tot: H / th, top: topRow, wx: wox + Math.floor(a[0]), wy: woy + Math.floor(a[1]) });
            }
            const ring = base.map((b) => [b.x, b.y]).concat(front.slice().reverse()); let cx = 0, cy = 0; for (const v of ring) { cx += v[0]; cy += v[1]; }
            dst.tops.push({ pts: ring, z: z1, zb: z0, lo, hi, ledge: !topRow, cx: cx / ring.length, cy: cy / ring.length }); stats.blocks++;
          }
        });
      }
    }
    return { byHi, stats };
  }

  /* the wall pass of a shape: { byHi: Map(level -> { faces, tops }), stats } or null when it is off (or the technique has no edges). Cached on S with every wall parameter in the key. */
  function get(S, P) {
    if (par(P, 'wallPass') === 'off') return null;
    const key = 'Cw:' + E.curves.key(P) + '|' + wkey(P); if (S.cache[key]) return S.cache[key];
    const t0 = Date.now(), st = E.curves.struct(S, P), W = wallEdges(S, P, st), res = par(P, 'wallPass') === 't2' ? buildT2(S, P, W) : buildT3(S, P, W);
    let nf = 0, nt = 0; for (const v of res.byHi.values()) { nf += v.faces.length; nt += v.tops.length; }
    res.stats = Object.assign({ mode: par(P, 'wallPass'), edges: W.list.length, faces: nf, tops: nt, ms: Date.now() - t0 }, W.road ? { roadEdges: W.roadEdges } : {}, res.stats); res.W = W;
    return (S.cache[key] = res);
  }

  E.wallc = { DEF, KEYS, key: wkey, get, par, BAND, REACH, LMAX, FULLMIN, MIN_JUMP, nearest };
})(window.EVO = window.EVO || {});
