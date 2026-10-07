/* Techniques A (tile outline -> simplify -> Chaikin) and B (distance field -> marching squares).
   Both return, per level L, closed loops of the region fine>=L. Loops are oriented so that the
   outward normal is (dy,-dx) (right of the travel direction). */
(function (E) {
  /* ---------- Technique A ---------- */
  function traceMask(W, H, inside) {
    const out = new Map(), edges = [];
    const add = (x0, y0, x1, y1) => {
      const e = { x0, y0, x1, y1, used: false };
      edges.push(e);
      const k = x0 + ',' + y0;
      if (!out.has(k)) out.set(k, []);
      out.get(k).push(e);
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      if (y === 0 || !inside(x, y - 1)) add(x, y, x + 1, y);
      if (x === W - 1 || !inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (y === H - 1 || !inside(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (x === 0 || !inside(x - 1, y)) add(x, y + 1, x, y);
    }
    const loops = [];
    for (const e of edges) {
      if (e.used) continue;
      const loop = [];
      let c = e;
      while (c && !c.used) {
        c.used = true; loop.push([c.x0, c.y0]);
        const nxt = out.get(c.x1 + ',' + c.y1);
        c = nxt && nxt.find((q) => !q.used);
      }
      if (loop.length >= 3) loops.push(loop);
    }
    return loops;
  }

  function dropCollinear(loop) {
    let pts = loop;
    for (let guard = 0; guard < 3; guard++) {
      const n = pts.length, o = [];
      for (let i = 0; i < n; i++) {
        const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
        const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        if (Math.abs(cr) > 1e-9) o.push(b);
      }
      if (o.length === pts.length || o.length < 3) { pts = o.length < 3 ? pts : o; break; }
      pts = o;
    }
    return pts;
  }

  const inLoops = (loops, x, y) => { // even-odd point in polygon
    let c = false;
    for (const lp of loops) for (let i = 0, j = lp.length - 1; i < lp.length; j = i++) {
      const p = lp[i], q = lp[j];
      if ((p[1] > y) !== (q[1] > y) && x < (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]) + p[0]) c = !c;
    }
    return c;
  };

  /* Does each carved stair survive the drawn contours of technique A or B? A tread tile (level L) is well drawn where
     it is inside the contour of level L and outside the contour of level L+1: that is what makes it a step of its own.
     Coverage of a tile = share of its area (4x4 samples) that is well drawn. A tread is closed when the mean coverage of
     its tiles is below 0.5; a stair is lost when any tread is closed and degraded when only some tile is below 0.9. */
  E.stairSurvival = function (S, P, tech) {
    const loopsOf = tech === 'A' ? E.loopsA : E.loopsB, memo = new Map();
    const get = (L) => { // loops of a level with their boxes, for a quick rejection in the point tests
      if (L > S.maxFine) return [];
      if (!memo.has(L)) memo.set(L, loopsOf(S, L, P).map((lp) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of lp) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return { lp, x0, y0, x1, y1 }; }));
      return memo.get(L);
    };
    const inside = (boxed, x, y) => { let c = false; for (const b of boxed) { if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue; if (inLoops([b.lp], x, y)) c = !c; } return c; };
    const SM = 4;
    let lost = 0, degraded = 0, failed = 0, tiles = 0, area = 0, worst = 1; const lostIdx = [];
    S.stairs.forEach((st, si) => {
      let closed = false, bad = 0;
      for (const step of st.steps) {
        let sum = 0;
        for (const t of step.tiles) {
          const L = S.fine[t], tx = t % S.W, ty = (t / S.W) | 0, lo = get(L), hi = get(L + 1); let good = 0;
          for (let j = 0; j < SM; j++) for (let k = 0; k < SM; k++) {
            const x = tx + (k + 0.5) / SM + 1e-4, y = ty + (j + 0.5) / SM + 1.3e-4; // nudged so no sample sits exactly on a contour vertex
            if (inside(lo, x, y) && !inside(hi, x, y)) good++;
          }
          const cov = good / (SM * SM); tiles++; area += cov; sum += cov; worst = Math.min(worst, cov);
          if (cov < 0.9) { bad++; failed++; }
        }
        if (sum / step.tiles.length < 0.5) closed = true;
      }
      if (closed) { lost++; lostIdx.push(si); } else if (bad) degraded++;
    });
    return { n: S.stairs.length, lost, degraded, tilesFailed: failed, tiles, lostIdx, coverage: tiles ? area / tiles : 1, worst };
  };

  /* closed tile-exact loops of a mask, collinear points dropped (used for the slice border) */
  E.maskLoops = function (W, H, inside) { return traceMask(W, H, inside).map(dropCollinear); };

  /* fixed[i] (optional): vertex i stays where it is (stair footprint, see loopsA) */
  function chaikin(loop, W, H, it, fixed) {
    let pts = loop, fx = fixed || null;
    const onB = (a, b) => (a[0] === 0 && b[0] === 0) || (a[0] === W && b[0] === W) || (a[1] === 0 && b[1] === 0) || (a[1] === H && b[1] === H);
    for (let t = 0; t < it; t++) {
      const out = [], of = [], n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n], fa = fx ? fx[i] : 0, fb = fx ? fx[(i + 1) % n] : 0;
        if (onB(a, b)) { out.push(a, b); of.push(fa, fb); continue; }
        out.push(fa ? a : [0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], fb ? b : [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
        of.push(fa, fb);
      }
      const np = [], nf = [];
      for (let i = 0; i < out.length; i++) {
        const p = out[i], q = out[(i + out.length - 1) % out.length];
        if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 1e-6) { np.push(p); nf.push(of[i]); }
      }
      pts = np; fx = fx ? nf : null;
    }
    return pts;
  }

  /* Rigid stair footprint: a unit edge of the level mask that touches a carved tile (on either side) is pinned. The
     vertices where a pinned run starts or ends, and the corners inside it, stay fixed through the smoothing, so the
     footprint keeps its exact tile shape and the terrain around it is still smoothed. */
  const BAND = 2; // tiles around a carved tile where the contours are not smoothed (the chamfers of long edges would cover the footprint)
  function nearCarved(S) {
    if (S._nearCarved) return S._nearCarved;
    const { W, H } = S, out = new Uint8Array(S.n);
    for (let i = 0; i < S.n; i++) if (S.carved[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -BAND; dy <= BAND; dy++) for (let dx = -BAND; dx <= BAND; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H) out[b * W + a] = 1; } }
    return (S._nearCarved = out);
  }
  function anchored(loop, carved, W, H) {
    const n = loop.length, pinned = new Uint8Array(n);
    const has = (x, y) => x >= 0 && y >= 0 && x < W && y < H && carved[y * W + x] === 1;
    for (let i = 0; i < n; i++) {
      const a = loop[i], b = loop[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1];
      const x = a[0], y = a[1];
      pinned[i] = dx === 1 ? (has(x, y) || has(x, y - 1)) : dy === 1 ? (has(x - 1, y) || has(x, y)) : dx === -1 ? (has(x - 1, y - 1) || has(x - 1, y)) : (has(x, y - 1) || has(x - 1, y - 1)) ? 1 : 0;
    }
    if (!pinned.some((v) => v)) return null;
    const pts = [], fix = [];
    for (let j = 0; j < n; j++) {
      const p = loop[(j + n - 1) % n], c = loop[j], q = loop[(j + 1) % n], pi = pinned[(j + n - 1) % n], po = pinned[j];
      const turn = (c[0] - p[0]) * (q[1] - c[1]) - (c[1] - p[1]) * (q[0] - c[0]);
      if (Math.abs(turn) > 1e-9 || pi !== po) { pts.push(c); fix.push(pi || po ? 1 : 0); }
    }
    return pts.length >= 3 ? { pts, fix } : null;
  }

  E.loopsA = function (S, L, P) {
    const key = 'A' + L + ':' + P.smooth + (P.anchor === false ? 'n' : '');
    if (S.cache[key]) return S.cache[key];
    const { W, H } = S, fine = S.fineMask || S.fine, carved = S.stairs && S.stairs.length && P.anchor !== false ? S.carved : null; // P.anchor === false: diagnostic, no rigid footprint
    const loops = traceMask(W, H, (x, y) => fine[y * W + x] >= L).map((l) => {
      const an = carved && anchored(l, nearCarved(S), W, H);
      return an ? chaikin(an.pts, W, H, P.smooth, an.fix) : chaikin(dropCollinear(l), W, H, P.smooth);
    });
    return (S.cache[key] = loops);
  };

  /* ---------- Technique B ---------- */
  function sdf(inside, w, h) {
    // chamfer distance (3-4) both directions, centre-to-centre distance in cells
    const INF = 1e9, dIn = new Float32Array(w * h), dOut = new Float32Array(w * h);
    const pass = (d, target) => {
      for (let i = 0; i < w * h; i++) d[i] = inside[i] === target ? 0 : INF;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; let v = d[i];
        if (x > 0) v = Math.min(v, d[i - 1] + 1);
        if (y > 0) v = Math.min(v, d[i - w] + 1);
        if (x > 0 && y > 0) v = Math.min(v, d[i - w - 1] + 1.4142);
        if (x < w - 1 && y > 0) v = Math.min(v, d[i - w + 1] + 1.4142);
        d[i] = v;
      }
      for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x; let v = d[i];
        if (x < w - 1) v = Math.min(v, d[i + 1] + 1);
        if (y < h - 1) v = Math.min(v, d[i + w] + 1);
        if (x < w - 1 && y < h - 1) v = Math.min(v, d[i + w + 1] + 1.4142);
        if (x > 0 && y < h - 1) v = Math.min(v, d[i + w - 1] + 1.4142);
        d[i] = v;
      }
    };
    pass(dOut, 1); // distance to nearest inside cell (for outside cells)
    pass(dIn, 0);  // distance to nearest outside cell (for inside cells)
    const f = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) f[i] = inside[i] ? dIn[i] - 0.5 : -(dOut[i] - 0.5);
    return f;
  }

  function boxBlur(f, w, h, r, passes) {
    if (r < 1) return f;
    let a = f, b = new Float32Array(f.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < h; y++) { // horizontal
        let acc = 0;
        for (let x = -r; x <= r; x++) acc += a[y * w + Math.min(w - 1, Math.max(0, x))];
        for (let x = 0; x < w; x++) {
          b[y * w + x] = acc / (2 * r + 1);
          acc += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)];
        }
      }
      for (let x = 0; x < w; x++) { // vertical
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
        for (let y = 0; y < h; y++) {
          a[y * w + x] = acc / (2 * r + 1);
          acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
        }
      }
    }
    return a;
  }

  function marching(f, w, h, toXY) {
    const adj = new Map(), pos = new Map();
    const eid = (kind, i, j) => (kind === 0 ? (j * w + i) * 2 : (j * w + i) * 2 + 1); // 0 horizontal edge (i,j)-(i+1,j); 1 vertical (i,j)-(i,j+1)
    const edgePt = (id) => {
      if (pos.has(id)) return pos.get(id);
      const kind = id & 1, c = id >> 1, i = c % w, j = (c / w) | 0;
      const i2 = kind === 0 ? i + 1 : i, j2 = kind === 0 ? j : j + 1;
      const f0 = f[j * w + i], f1 = f[j2 * w + i2], t = f0 / (f0 - f1);
      const p0 = toXY(i, j), p1 = toXY(i2, j2);
      const p = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
      pos.set(id, p); return p;
    };
    const link = (a, b) => {
      if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push(b); adj.get(b).push(a);
    };
    for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) {
      const a = f[j * w + i], b = f[j * w + i + 1], c = f[(j + 1) * w + i + 1], d = f[(j + 1) * w + i];
      const idx = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (c > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const T = eid(0, i, j), R = eid(1, i + 1, j), B = eid(0, i, j + 1), Lf = eid(1, i, j);
      switch (idx) {
        case 1: case 14: link(Lf, T); break;
        case 2: case 13: link(T, R); break;
        case 3: case 12: link(Lf, R); break;
        case 4: case 11: link(R, B); break;
        case 6: case 9: link(T, B); break;
        case 7: case 8: link(Lf, B); break;
        case 5: if ((a + b + c + d) / 4 > 0) { link(T, R); link(Lf, B); } else { link(Lf, T); link(R, B); } break;
        case 10: if ((a + b + c + d) / 4 > 0) { link(Lf, T); link(R, B); } else { link(T, R); link(Lf, B); } break;
      }
    }
    const seen = new Set(), loops = [];
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const ids = []; let prev = -1, cur = start;
      while (cur !== undefined && !seen.has(cur)) {
        seen.add(cur); ids.push(cur);
        const nb = adj.get(cur); let nxt;
        for (const q of nb) if (q !== prev && !seen.has(q)) { nxt = q; break; }
        prev = cur; cur = nxt;
      }
      if (ids.length >= 3) loops.push(ids.map(edgePt));
    }
    return loops;
  }

  function rdp(pts, eps) {
    const n = pts.length; if (n < 8) return pts;
    const keep = new Uint8Array(n); keep[0] = keep[n >> 1] = 1;
    const run = (a, b) => {
      let md = 0, mi = -1;
      const A = pts[a % n], B = pts[b % n], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < b; i++) {
        const P = pts[i % n], d = Math.abs((P[0] - A[0]) * dy - (P[1] - A[1]) * dx) / L;
        if (d > md) { md = d; mi = i; }
      }
      if (md > eps && mi > 0) { keep[mi % n] = 1; run(a, mi); run(mi, b); }
    };
    run(0, n >> 1); run(n >> 1, n);
    return pts.filter((_, i) => keep[i]);
  }

  E.loopsB = function (S, L, P) {
    const key = 'B' + L + ':' + P.radius + (P.anchor === false ? 'n' : '');
    if (S.cache[key]) return S.cache[key];
    const { W, H } = S, fine = S.fineMask || S.fine, s = 4, r = Math.round(P.radius * s), pad = r * 3 + 3;
    const w = W * s + pad * 2, h = H * s + pad * 2;
    const inside = new Uint8Array(w * h);
    for (let y = 0; y < H * s; y++) for (let x = 0; x < W * s; x++) {
      inside[(y + pad) * w + x + pad] = fine[((y / s) | 0) * W + ((x / s) | 0)] >= L ? 1 : 0;
    }
    const raw = sdf(inside, w, h);
    let f = boxBlur(raw.slice(), w, h, r, 3);
    if (S.stairs && S.stairs.length && P.anchor !== false) { // rigid stair footprint: the unblurred field wins within 0.5 tile of a carved tile, fading out by 1.5
      const wk = 'Bw' + P.radius; // the weight depends on the stairs only, so it is shared by all levels
      if (!S.cache[wk]) {
        const F = new Uint8Array(w * h);
        for (let y = 0; y < H * s; y++) for (let x = 0; x < W * s; x++) F[(y + pad) * w + x + pad] = S.carved[((y / s) | 0) * W + ((x / s) | 0)];
        const dF = sdf(F, w, h), k = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) { const d = dF[i] < 0 ? -dF[i] + 0.5 : 0; k[i] = Math.max(0, Math.min(1, 1 - (d - 0.5 * s) / s)); }
        S.cache[wk] = k;
      }
      const k = S.cache[wk], g = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) g[i] = f[i] * (1 - k[i]) + raw[i] * k[i];
      f = g;
    }
    const toXY = (i, j) => [(i - pad + 0.5) / s, (j - pad + 0.5) / s];
    const eps = 0.5 / s + 0.02;
    const snap = (p) => [p[0] < eps ? 0 : p[0] > W - eps ? W : p[0], p[1] < eps ? 0 : p[1] > H - eps ? H : p[1]];
    const sample = (x, y) => {
      const i = Math.round(x * s + pad - 0.5), j = Math.round(y * s + pad - 0.5);
      return f[Math.max(0, Math.min(h - 1, j)) * w + Math.max(0, Math.min(w - 1, i))];
    };
    const loops = marching(f, w, h, toXY).map((l) => rdp(l.map(snap), 0.02)).filter((l) => l.length >= 3);
    // orient: outward normal (dy,-dx) must point away from the inside
    for (const l of loops) {
      let votes = 0; const n = l.length, step = Math.max(1, (n / 6) | 0);
      for (let k = 0; k < n; k += step) {
        const a = l[k], b = l[(k + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        const mx = (a[0] + b[0]) / 2 + (dy / len) * 0.25, my = (a[1] + b[1]) / 2 - (dx / len) * 0.25;
        votes += sample(mx, my) > 0 ? 1 : -1;
      }
      if (votes > 0) l.reverse();
    }
    return (S.cache[key] = loops);
  };
})(window.EVO = window.EVO || {});
