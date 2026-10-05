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

  function chaikin(loop, W, H, it) {
    let pts = loop;
    const onB = (a, b) => (a[0] === 0 && b[0] === 0) || (a[0] === W && b[0] === W) || (a[1] === 0 && b[1] === 0) || (a[1] === H && b[1] === H);
    for (let t = 0; t < it; t++) {
      const out = [], n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if (onB(a, b)) { out.push(a, b); continue; }
        out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      pts = out.filter((p, i) => { const q = out[(i + out.length - 1) % out.length]; return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 1e-6; });
    }
    return pts;
  }

  E.loopsA = function (S, L, P) {
    const key = 'A' + L + ':' + P.smooth;
    if (S.cache[key]) return S.cache[key];
    const { W, H, fine } = S;
    const loops = traceMask(W, H, (x, y) => fine[y * W + x] >= L)
      .map((l) => chaikin(dropCollinear(l), W, H, P.smooth));
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
    const key = 'B' + L + ':' + P.radius;
    if (S.cache[key]) return S.cache[key];
    const { W, H, fine } = S, s = 4, r = Math.round(P.radius * s), pad = r * 3 + 3;
    const w = W * s + pad * 2, h = H * s + pad * 2;
    const inside = new Uint8Array(w * h);
    for (let y = 0; y < H * s; y++) for (let x = 0; x < W * s; x++) {
      inside[(y + pad) * w + x + pad] = fine[((y / s) | 0) * W + ((x / s) | 0)] >= L ? 1 : 0;
    }
    const f = boxBlur(sdf(inside, w, h), w, h, r, 3);
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
