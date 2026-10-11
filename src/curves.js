/* TECHNIQUE C, "Tiles to Curves" (Unexplored 2 style; crystallizer 4, phase 1, planar only). One Voronoi seed per tile; seeds at level corners are displaced by rules,
   the cells of the displaced seeds give the plan contour of every level. It plugs into renderLevels like A and B through E.loopsC(S, L, P): closed loops of the region
   {fine >= L} (outward normal (dy, -dx)), here the union of the Voronoi cells of the level. Visual only: walking, regions, gates and ramps do not change.
   Rules (the approved mocks; the devlog is https://www.ludomotion.com/blogs/tiles-to-curves/):
     grid      one seed per tile of the built window, at the tile centre, in tile units; level = S.fineMask (void = -1, not drawn). Every hash uses WHOLE-MAP coordinates (S.ox, S.oy), so changing the slice
               does not reshuffle the jitter.
     corner    per grid vertex shared by 4 cells: if 3 of them have the same level and the 4th (the tip) differs, u = unit vector from the vertex to the tip centre (the diagonal); tip += u * max;
               opposite -= u * max (the seed diagonally across the vertex). BOTH move away from the vertex; the chamfer comes from the two orthogonal neighbours, which are of the opposite's level and
               are now closer to the vertex, so they eat the tip's convex corner. No orthogonal-neighbour shift. Shifts accumulate over all vertices; equality = same fine level (sub-terrace steps differ).
     jitter    added AFTER all the corner shifts: uniform in [-j, j] on each axis, j = jit * (1 + jitTall * min(jumpTerH, 3)) (jumpTerH = largest height difference to a land 4-neighbour / terH);
               then the TOTAL displacement vector is clamped to `max` (units of the cell of the pass).
     meander   (diagnostic, P.meander, default 0, in no preset): value-noise offset (amplitude 1.6 * meander tiles, 0.12 per tile) added to the first-pass seeds before the cap; the cap is raised to 0.5.
     passes    pass p > 1 rasterises the cells of pass p - 1 at 2x resolution (each sub-cell takes the LEVEL and the OWNER TILE of the nearest seed of the previous pass, which is the Voronoi cell it lies in),
               then applies corner rule + jitter + cap again on that finer grid.
     cells     the cell square clipped by the bisectors against the neighbours (Sutherland-Hodgman, no library): the 8 neighbours when max <= 0.42 in the brief, but measured on the real map the 3x3 block with the
               Balanced preset (max 0.40) missed 3 of 72 817 edges (14 of 5405 point tests), so the 5x5 block is used from max > 0.25 (every preset); with 5x5 the test finds none. Only the cells that have a neighbour of
               another level are built: the others produce no contour.
     exempt    (not displaced, no jitter, in every pass: the sub-cells of an exempt tile are exempt): the tiles of ramp / stair footprints (S.carved) and their 1-tile ring, the two tiles of every
               Ascension wall face, the Cake ring tiles. One ring is enough to keep a footprint TILE-EXACT: a seed 2 tiles away moved by <= 0.55 reaches 0.225 into the ring tile at most.
               P.anchor === false (diagnostic) switches the exemption off, like A and B.
   Known limit: the vertices on the border of the window have no neighbours outside it, so they get no corner rule; the shape at the slice border can differ from the whole-map shape (it lies in the veiled
   scenery). */
(function (E) {
  const PRESETS = {
    ordered: { passes: 1, max: 0.55, jit: 0.10, jitTall: 0 },   // E
    balanced: { passes: 2, max: 0.40, jit: 0.25, jitTall: 0 },  // D
    natural: { passes: 2, max: 0.50, jit: 0.10, jitTall: 1.2 }  // F
  };
  const SQ2 = Math.SQRT1_2;
  const CORNER = [[-1, -1], [1, -1], [-1, 1], [1, 1]];          // tl, tr, bl, br: direction vertex -> centre of that cell

  /* integer hash -> [0, 1) */
  function hash(a, b, c, d) {
    let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1) ^ Math.imul(d | 0, 0x85ebca6b);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  const vnoise = (x, y, k) => { // value noise in [-1, 1]
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const v = (i, j) => hash(x0 + i, y0 + j, 77, k) * 2 - 1;
    return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
  };

  /* tiles that are not displaced (window tile mask) */
  function exemptTiles(S, P) {
    const W = S.W, H = S.H, ex = new Uint8Array(S.n);
    if (P.anchor !== false) {
      if (S.carved) for (let i = 0; i < S.n; i++) if (S.carved[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H) ex[b * W + a] = 1; } }
      if (S.ascWalls) for (const f of S.ascWalls.faces) { ex[f.i] = 1; ex[f.j] = 1; }
      if (S.levelMeta) for (let i = 0; i < S.n; i++) { const m = S.levelMeta[S.fine[i]]; if (m && m.ring) ex[i] = 1; }
    }
    return ex;
  }

  /* largest height difference to a land 4-neighbour, in terH units (per tile) */
  function jumpTiles(S, P) {
    const W = S.W, H = S.H, out = new Float32Array(S.n), th = P.terH || 1;
    for (let i = 0; i < S.n; i++) {
      if (S.void && S.void[i]) continue;
      const x = i % W, y = (i / W) | 0, h = S.levelH[S.fine[i]]; let m = 0;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (S.void && S.void[j]) continue; m = Math.max(m, Math.abs(h - S.levelH[S.fine[j]])); }
      out[i] = m / th;
    }
    return out;
  }

  /* one displacement pass over a grid of gw x gh cells (size `cell` tiles). Returns the displaced seed positions. wk: world cells per window cell offset (ox * k). */
  function displace(g, cfg, pass, S, jump, meander) {
    const { gw, gh, cell, lev, ex, bx, by } = g, n = gw * gh, k = Math.round(1 / cell); // grid cells per tile along one axis (1, 2, 4...)
    const dX = new Float64Array(n), dY = new Float64Array(n), mx = cfg.max;
    for (let vy = 1; vy < gh; vy++) for (let vx = 1; vx < gw; vx++) {
      const i0 = (vy - 1) * gw + vx - 1, i1 = i0 + 1, i2 = i0 + gw, i3 = i2 + 1, l0 = lev[i0], l1 = lev[i1], l2 = lev[i2], l3 = lev[i3];
      if (l0 === l1 && l1 === l2 && l2 === l3) continue;
      const tip = l0 === l1 && l1 === l2 && l3 !== l0 ? 3 : l0 === l1 && l1 === l3 && l2 !== l0 ? 2 : l0 === l2 && l2 === l3 && l1 !== l0 ? 1 : l1 === l2 && l2 === l3 && l0 !== l1 ? 0 : -1;
      if (tip < 0) continue; // 2-2 splits, checkerboards and 3 different levels: no tip
      const ids = [i0, i1, i2, i3], u = CORNER[tip], ti = ids[tip], oi = ids[3 - tip];
      if (!ex[ti]) { dX[ti] += u[0] * SQ2 * mx * cell; dY[ti] += u[1] * SQ2 * mx * cell; }  // tip += u * max (away from the vertex)
      if (!ex[oi]) { dX[oi] -= u[0] * SQ2 * mx * cell; dY[oi] -= u[1] * SQ2 * mx * cell; }  // opposite -= u * max (away from the vertex too)
    }
    // jitter after ALL the corner shifts, (meander,) then the cap
    const cap = (meander > 0 && pass === 1 ? Math.max(mx, 0.5) : mx) * cell, wx0 = S.ox * k, wy0 = S.oy * k;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const c = y * gw + x; if (ex[c]) continue;
      const jt = jump[(((y / k) | 0) * S.W) + ((x / k) | 0)], j = cfg.jit * (1 + cfg.jitTall * Math.min(jt, 3)) * cell;
      if (j > 0) { dX[c] += (hash(wx0 + x, wy0 + y, pass, 1) * 2 - 1) * j; dY[c] += (hash(wx0 + x, wy0 + y, pass, 2) * 2 - 1) * j; }
      if (meander > 0 && pass === 1) { dX[c] += 1.6 * meander * vnoise((wx0 + x + 0.5) * 0.12, (wy0 + y + 0.5) * 0.12, 1); dY[c] += 1.6 * meander * vnoise((wx0 + x + 0.5) * 0.12, (wy0 + y + 0.5) * 0.12, 2); }
      const d = Math.hypot(dX[c], dY[c]); if (d > cap) { dX[c] *= cap / d; dY[c] *= cap / d; }
    }
    const sx = new Float64Array(n), sy = new Float64Array(n);
    for (let c = 0; c < n; c++) { sx[c] = bx[c] + dX[c]; sy[c] = by[c] + dY[c]; }
    return { sx, sy, dX, dY, cap };
  }

  /* Sutherland-Hodgman against one half-plane f(p) >= 0. A polygon is { x: [], y: [], t: [] } with t[k] = tag of the edge that ENDS at vertex k (cell index of the neighbour that made it,
     -2 = window border, -3 = the initial square). */
  function clip(poly, fa, fb, fc, tag) {
    const n = poly.x.length, o = { x: [], y: [], t: [] };
    for (let k = 0; k < n; k++) {
      const p = (k + n - 1) % n, px = poly.x[p], py = poly.y[p], qx = poly.x[k], qy = poly.y[k];
      const fp = fa * px + fb * py + fc, fq = fa * qx + fb * qy + fc, pin = fp >= 0, qin = fq >= 0;
      if (pin !== qin) {
        const t = fp / (fp - fq), ix = px + (qx - px) * t, iy = py + (qy - py) * t;
        if (pin) { o.x.push(ix); o.y.push(iy); o.t.push(poly.t[k]); } // P -> I: part of the old edge
        else { o.x.push(ix); o.y.push(iy); o.t.push(tag); }           // the clip edge ends here
      }
      if (qin) { o.x.push(qx); o.y.push(qy); o.t.push(poly.t[k]); }
    }
    return o;
  }

  /* Build the whole structure for a shape: seeds of the last pass, the Voronoi edges between cells of different levels. cfg overrides the preset (tests). */
  function build(S, P, cfg0) {
    const t0 = Date.now(), cfg = cfg0 || PRESETS[P.curves] || PRESETS.ordered,  W = S.W, H = S.H, lvl = S.fineMask || S.fine, meander = P.meander > 0 ? P.meander : 0;
    if (!(cfg.passes >= 1 && cfg.passes <= 3)) throw new Error('curves: passes must be 1 to 3 (the 5x5 owner search and the hashing are tested for up to 3)');
    const exT = exemptTiles(S, P), jump = jumpTiles(S, P);
    let g = { gw: W, gh: H, cell: 1, lev: Int16Array.from(lvl), own: Int32Array.from({ length: S.n }, (_, i) => i), ex: Uint8Array.from(exT), bx: new Float64Array(S.n), by: new Float64Array(S.n) };
    for (let i = 0; i < S.n; i++) { g.bx[i] = (i % W) + 0.5; g.by[i] = ((i / W) | 0) + 0.5; }
    let d = displace(g, cfg, 1, S, jump, meander); g.sx = d.sx; g.sy = d.sy; g.dX = d.dX; g.dY = d.dY; g.cap = d.cap; g.passes = [{ cell: 1, cap: d.cap }];
    for (let p = 2; p <= cfg.passes; p++) { // rasterise the cells of the previous pass at 2x: the sub-cell takes level and owner of the nearest seed
      const gw = g.gw * 2, gh = g.gh * 2, n = gw * gh, lev = new Int16Array(n), own = new Int32Array(n), ex = new Uint8Array(n), bx = new Float64Array(n), by = new Float64Array(n);
      for (let Y = 0; Y < gh; Y++) for (let X = 0; X < gw; X++) {
        const c = Y * gw + X, cx = (X + 0.5) / 2, cy = (Y + 0.5) / 2, tx = X >> 1, ty = Y >> 1;
        let best = -1, bd = Infinity;
        for (let yy = Math.max(0, ty - 2); yy <= Math.min(g.gh - 1, ty + 2); yy++) for (let xx = Math.max(0, tx - 2); xx <= Math.min(g.gw - 1, tx + 2); xx++) {
          const q = yy * g.gw + xx, dd = (g.sx[q] - cx) ** 2 + (g.sy[q] - cy) ** 2; if (dd < bd) { bd = dd; best = q; }
        }
        lev[c] = g.lev[best]; own[c] = g.own[best]; ex[c] = g.ex[ty * g.gw + tx]; bx[c] = cx; by[c] = cy;
      }
      g = { gw, gh, cell: g.cell / 2, lev, own, ex, bx, by };
      d = displace(g, cfg, p, S, jump, meander); g.sx = d.sx; g.sy = d.sy; g.dX = d.dX; g.dY = d.dY; g.cap = d.cap; g.passes = null;
    }
    // cells: only those with a neighbour of another level inside the radius
    const { gw, gh, lev, sx, sy } = g, R = cfg.R || ((cfg.max > 0.25 || meander > 0) ? 2 : 1), E_ = { x0: [], y0: [], x1: [], y1: [], lo: [], hi: [], ci: [] };
    let built = 0;
    for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
      const c = cy * gw + cx, lc = lev[c]; let bd = false;
      for (let yy = Math.max(0, cy - R); yy <= Math.min(gh - 1, cy + R) && !bd; yy++) for (let xx = Math.max(0, cx - R); xx <= Math.min(gw - 1, cx + R); xx++) if (lev[yy * gw + xx] !== lc) { bd = true; break; }
      const atBorder = cx === 0 || cy === 0 || cx === gw - 1 || cy === gh - 1;
      if (!bd && !(atBorder && lc >= 0)) continue;
      built++;
      const s0x = sx[c], s0y = sy[c], hs = (R + 1) * g.cell;
      let poly = { x: [s0x - hs, s0x + hs, s0x + hs, s0x - hs], y: [s0y - hs, s0y - hs, s0y + hs, s0y + hs], t: [-3, -3, -3, -3] };
      poly = clip(poly, 1, 0, 0, -2); poly = clip(poly, -1, 0, W, -2); poly = clip(poly, 0, 1, 0, -2); poly = clip(poly, 0, -1, H, -2); // the window
      let r2 = 0; for (let k = 0; k < poly.x.length; k++) r2 = Math.max(r2, (poly.x[k] - s0x) ** 2 + (poly.y[k] - s0y) ** 2);
      for (let yy = Math.max(0, cy - R); yy <= Math.min(gh - 1, cy + R); yy++) for (let xx = Math.max(0, cx - R); xx <= Math.min(gw - 1, cx + R); xx++) {
        const q = yy * gw + xx; if (q === c) continue;
        const dx = s0x - sx[q], dy = s0y - sy[q], dd = dx * dx + dy * dy; if (dd / 4 > r2) continue; // the bisector cannot cut the polygon
        poly = clip(poly, dx, dy, -(dx * (s0x + sx[q]) + dy * (s0y + sy[q])) / 2, q);
        if (poly.x.length < 3) break;
        r2 = 0; for (let k = 0; k < poly.x.length; k++) r2 = Math.max(r2, (poly.x[k] - s0x) ** 2 + (poly.y[k] - s0y) ** 2);
      }
      const m = poly.x.length; if (m < 3) continue;
      for (let k = 0; k < m; k++) {
        const tg = poly.t[k], p = (k + m - 1) % m; let a = [poly.x[p], poly.y[p]], b = [poly.x[k], poly.y[k]], lo, hi, inside = c;
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) continue;
        if (tg >= 0) { if (lev[tg] === lc || c > tg) continue; lo = Math.min(lc, lev[tg]); hi = Math.max(lc, lev[tg]); if (lev[tg] > lc) inside = tg; }
        else if (tg === -2) { if (lc < 0) continue; lo = -1; hi = lc; }
        else continue;
        const dx = b[0] - a[0], dy = b[1] - a[1], nx = dy, ny = -dx, mxp = (a[0] + b[0]) / 2, myp = (a[1] + b[1]) / 2;
        if (nx * (mxp - sx[inside]) + ny * (myp - sy[inside]) < 0) { const t = a; a = b; b = t; } // outward normal (dy, -dx) points away from the inside cell
        E_.x0.push(a[0]); E_.y0.push(a[1]); E_.x1.push(b[0]); E_.y1.push(b[1]); E_.lo.push(lo); E_.hi.push(hi); E_.ci.push(inside);
      }
    }
    const byLevel = new Map();
    for (let e = 0; e < E_.x0.length; e++) for (let L = Math.max(0, E_.lo[e] + 1); L <= E_.hi[e]; L++) { let a = byLevel.get(L); if (!a) byLevel.set(L, a = []); a.push(e); }
    let nex = 0; for (let c = 0; c < g.ex.length; c++) nex += g.ex[c];
    return { cfg, grid: g, R, edges: E_, byLevel, exemptTiles: exT, info: { passes: cfg.passes, cells: gw * gh, built, edges: E_.x0.length, exemptCells: nex, ms: Date.now() - t0, cap: g.cap } };
  }

  const ckey = (P) => (P.curves || 'ordered') + ':' + (P.anchor === false ? 'n' : 'a') + ':' + (P.meander > 0 ? P.meander : 0);
  function struct(S, P) {
    const k = 'Cs:' + ckey(P); // the cache lives on S: a new shape (rooms, Cake, Ascension walls, sliders, slice) starts empty; preset, anchor and meander are in the key
    return S.cache[k] || (S.cache[k] = build(S, P));
  }

  const NB = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]], QK = 1e5, key = (x, y) => Math.round(x * QK) * 134217728 + Math.round(y * QK);
  E.loopsC = function (S, L, P) {
    const ck = 'C' + L + ':' + ckey(P);
    if (S.cache[ck]) return S.cache[ck];
    const st = struct(S, P), ids = st.byLevel.get(L) || [], e = st.edges, out = new Map();
    for (const i of ids) { const k = key(e.x0[i], e.y0[i]); let a = out.get(k); if (!a) out.set(k, a = []); a.push(i); }
    const used = new Set(), next = (i) => {
      const x = e.x1[i], y = e.y1[i];
      for (const o of NB) { // exact key first, then the neighbouring quantization cells
        const a = out.get(key(x + o[0] / QK, y + o[1] / QK)); if (a) { const f = a.find((q) => !used.has(q)); if (f !== undefined) return f; }
      }
      return undefined;
    };
    const loops = [];
    for (const i of ids) {
      if (used.has(i)) continue;
      const loop = []; let c = i;
      while (c !== undefined && !used.has(c)) { used.add(c); loop.push([e.x0[c], e.y0[c]]); c = next(c); }
      if (loop.length >= 3) loops.push(E.dropCollinear ? E.dropCollinear(loop) : loop);
    }
    return (S.cache[ck] = loops);
  };

  /* the tile of the cell that contains the point (x, y) (tile units of the window): the owner tile of the nearest seed (-1 outside the window) */
  function tileAt(S, P, x, y) {
    if (x < 0 || y < 0 || x >= S.W || y >= S.H) return -1;
    const g = struct(S, P).grid, gx = Math.floor(x / g.cell), gy = Math.floor(y / g.cell); let best = -1, bd = Infinity;
    for (let yy = Math.max(0, gy - 2); yy <= Math.min(g.gh - 1, gy + 2); yy++) for (let xx = Math.max(0, gx - 2); xx <= Math.min(g.gw - 1, gx + 2); xx++) {
      const q = yy * g.gw + xx, dd = (g.sx[q] - x) ** 2 + (g.sy[q] - y) ** 2; if (dd < bd) { bd = dd; best = q; }
    }
    return best < 0 ? -1 : g.own[best];
  }

  E.curves = { PRESETS, build, struct, tileAt, hash, exemptTiles, key: ckey };
  E.cellTileAt = tileAt;
})(window.EVO = window.EVO || {});
