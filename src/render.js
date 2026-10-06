/* Orthographic painter renderer shared by all techniques (same style pass for every technique). */
(function (E) {
  const RAMP = [[0, [70, 128, 96]], [0.28, [128, 164, 92]], [0.52, [204, 178, 110]], [0.76, [160, 140, 128]], [1, [238, 232, 224]]];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgb = (c, k = 1, a = 1) => `rgba(${clamp(c[0] * k, 0, 255) | 0},${clamp(c[1] * k, 0, 255) | 0},${clamp(c[2] * k, 0, 255) | 0},${a})`;
  function ramp(t) {
    for (let i = 1; i < RAMP.length; i++) {
      if (t <= RAMP[i][0]) {
        const [t0, c0] = RAMP[i - 1], [t1, c1] = RAMP[i], u = (t - t0) / (t1 - t0);
        return c0.map((v, k) => v + (c1[k] - v) * u);
      }
    }
    return RAMP[RAMP.length - 1][1];
  }
  function levelColor(fine, P) {
    const K = P.micro, ter = Math.floor(fine / K), mi = fine % K;
    const c = ramp(P.terraces > 1 ? ter / (P.terraces - 1) : 0);
    const lift = 1 + (mi - (K - 1) / 2) * 0.05;
    return c.map((v) => v * lift);
  }
  const OUT = 'rgba(24,20,34,0.92)';

  function makeCam(S, P, view, w, h) {
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const base = E.hOf(0, P) - P.terH, top = E.hOf(S.maxFine, P);
    const raw = (x, y, hh) => {
      const X = x - S.W / 2, Y = y - S.H / 2;
      return [cy * X - sy * Y, (sy * X + cy * Y) * sp - hh * cp];
    };
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const fb = S.sliceBox ? [S.sliceBox.x0 - 2, S.sliceBox.y0 - 2, S.sliceBox.x1 + 2, S.sliceBox.y1 + 2] : [0, 0, S.W, S.H]; // fit the slice, scenery spills past
    for (const [x, y] of [[fb[0], fb[1]], [fb[2], fb[1]], [fb[0], fb[3]], [fb[2], fb[3]]]) for (const hh of [base, top + 1.5]) {
      const [a, b] = raw(x, y, hh); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    }
    const sc = Math.min((w - 20) / (x1 - x0), (h - 20) / (y1 - y0)) * view.zoom;
    const ox = w / 2 - (x0 + x1) / 2 * sc + view.panX, oy = h / 2 - (y0 + y1) / 2 * sc + view.panY;
    return {
      sc, base,
      p: (x, y, hh) => { const [a, b] = raw(x, y, hh); return [a * sc + ox, b * sc + oy]; },
      ry: (x, y) => sy * (x - S.W / 2) + cy * (y - S.H / 2),
      nrm: (nx, ny) => [cy * nx - sy * ny, sy * nx + cy * ny]
    };
  }

  function wallFill(ctx, c, k, y0, y1, o) {
    if (!o.gradient) return rgb(c, 0.62 * k);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(c, 0.86 * k)); g.addColorStop(1, rgb(c, 0.42 * k));
    return g;
  }

  function wallQuad(ctx, cam, ax, ay, bx, by, hb, ht, c, rnx, o, st, strong) {
    const p0 = cam.p(ax, ay, ht), p1 = cam.p(bx, by, ht), p2 = cam.p(bx, by, hb), p3 = cam.p(ax, ay, hb);
    const k = clamp(0.92 + 0.28 * -rnx, 0.65, 1.2);
    const f = wallFill(ctx, c, k, Math.min(p0[1], p1[1]), Math.max(p2[1], p3[1]), o);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
    ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = f; ctx.lineWidth = 0.8; ctx.stroke();
    st.walls++;
    return [p0, p1];
  }

  const AMBIGUOUS = 'rgba(255,0,255,0.75)';
  const VEIL_RGB = [10, 8, 24], VEIL_A = 0.6;               // one band: everything outside the slice
  const VEIL = `rgba(${VEIL_RGB},${VEIL_A})`;
  const veilMix = (c) => c.map((v, k) => v * (1 - VEIL_A) + VEIL_RGB[k] * VEIL_A); // same result as painting VEIL over c, without seams
  const BORDER = 'rgba(255,226,110,0.98)', BORDER_CASE = 'rgba(24,20,34,0.95)';
  const FACE = [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]]; // N E S W, same bits as S.border
  const inSlice = (S, x, y) => { const ix = Math.floor(x), iy = Math.floor(y); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H && S.slice[iy * S.W + ix] === 1; };
  function borderFaces(path, cam, x, y, bits, hh) { // adds the faces of tile (x,y) that look outside the slice, at the height of its cap
    for (let b = 0; b < 4; b++) {
      if (!(bits >> b & 1)) continue;
      const f = FACE[b], p = cam.p(x + f[0], y + f[1], hh), q = cam.p(x + f[2], y + f[3], hh);
      path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]);
    }
  }
  function strokeBorder(ctx, path) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = BORDER_CASE; ctx.lineWidth = 4.2; ctx.stroke(path);
    ctx.strokeStyle = BORDER; ctx.lineWidth = 2; ctx.stroke(path);
    ctx.restore();
  }
  function veilPath(cam, S, ht) { // the whole plane minus the slice, at cap height ht (even-odd)
    const vp = new Path2D(); vp.rect(-5e4, -5e4, 1e5, 1e5);
    for (const loop of S.sliceLoops) {
      loop.forEach((p, k) => { const q = cam.p(p[0], p[1], ht); k ? vp.lineTo(q[0], q[1]) : vp.moveTo(q[0], q[1]); });
      vp.closePath();
    }
    return vp;
  }
  const GRADED = [['path', '214,170,96'], ['vegetation', '52,170,72'], ['poi', '236,84,236']];
  function tint(S, key, make) { const c = S.tints || (S.tints = {}); return c[key] || (c[key] = make()); }
  function zoneTint(S, id) {
    return tint(S, 'z' + id, () => {
      const cl = S.fields.zone.info.classes.find((c) => c.id === id);
      const hue = cl && cl.hue !== undefined ? cl.hue * 360 : (id * 137.5) % 360;
      return `hsla(${hue.toFixed(0)},80%,55%,0.45)`;
    });
  }
  function edgeTint(S, id) {
    return tint(S, 'e' + id, () => {
      const cl = S.fields.edge.info.classes.find((c) => c.id === id);
      return cl && cl.label === 'barrier' ? 'rgba(235,48,48,0.92)' : cl && cl.label === 'pass' ? 'rgba(48,224,240,0.92)' : 'rgba(255,200,60,0.92)';
    });
  }

  function tileOverlay(S, P, o, i) {
    const out = [];
    if (o.regions && S.region[i] >= 0) {
      const r = S.region[i], hue = (r * 137.5) % 360;
      out.push(`hsla(${hue},75%,55%,0.42)`);
    }
    if (o.features) {
      if (S.water[i]) out.push('rgba(52,142,222,0.95)');
      else if (S.waterfall && S.waterfall[i]) out.push('rgba(200,236,255,0.95)');
      else if (S.cave && S.cave[i]) out.push('rgba(34,26,44,0.88)');
      else if (S.snake && S.snake[i]) out.push('rgba(214,84,112,0.38)');
    }
    const F = S.fields;
    if (o.zones && F.zone) {
      const z = F.zone.ids[i];
      if (F.zone.amb[i]) out.push(AMBIGUOUS); else if (z > 0) out.push(zoneTint(S, z));
    }
    if (o.edges && F.edge) {
      const e = F.edge.ids[i];
      if (F.edge.amb[i]) out.push(AMBIGUOUS); else if (e > 0) out.push(edgeTint(S, e));
    }
    if (o.masks) {
      for (const k of GRADED) {
        const m = F[k[0]]; if (!m) continue;
        const v = m.values[i]; if (v > 0) out.push(`rgba(${k[1]},${(0.15 + 0.7 * v).toFixed(2)})`);
      }
    }
    return out;
  }

  function tileQuad(ctx, cam, x, y, hh) {
    const a = cam.p(x, y, hh), b = cam.p(x + 1, y, hh), c = cam.p(x + 1, y + 1, hh), d = cam.p(x, y + 1, hh);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
  }

  function drawRamp(ctx, cam, S, P, pass, o) {
    const { W } = S, a = pass.a, b = pass.b;
    const xa = a % W, ya = (a / W) | 0, xb = b % W, yb = (b / W) | 0, dx = xa - xb, dy = ya - yb;
    const [rnx, rny] = cam.nrm(dx, dy);
    if (rny < -0.3) return false;
    const hb = E.hOf(S.fine[b], P), ha = E.hOf(S.fine[a], P);
    let e1, e2, f1, f2;
    if (dx === 1) { e1 = [xb + 1, yb]; e2 = [xb + 1, yb + 1]; f1 = [xb + 2, yb]; f2 = [xb + 2, yb + 1]; }
    else if (dx === -1) { e1 = [xb, yb]; e2 = [xb, yb + 1]; f1 = [xb - 1, yb]; f2 = [xb - 1, yb + 1]; }
    else if (dy === 1) { e1 = [xb, yb + 1]; e2 = [xb + 1, yb + 1]; f1 = [xb, yb + 2]; f2 = [xb + 1, yb + 2]; }
    else { e1 = [xb, yb]; e2 = [xb + 1, yb]; f1 = [xb, yb - 1]; f2 = [xb + 1, yb - 1]; }
    const q = [cam.p(e1[0], e1[1], hb), cam.p(e2[0], e2[1], hb), cam.p(f2[0], f2[1], ha), cam.p(f1[0], f1[1], ha)];
    const c = levelColor(S.fine[b], P);
    ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let k = 1; k < 4; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.closePath();
    ctx.fillStyle = rgb(c, 1.18); ctx.fill();
    const n = clamp(Math.round((hb - ha) / 0.28), 2, 6);
    ctx.strokeStyle = rgb(c, 0.55, 0.85); ctx.lineWidth = 1;
    for (let k = 1; k < n; k++) {
      const t = k / n, hh = hb + (ha - hb) * t;
      const A = cam.p(e1[0] + (f1[0] - e1[0]) * t, e1[1] + (f1[1] - e1[1]) * t, hh);
      const B = cam.p(e2[0] + (f2[0] - e2[0]) * t, e2[1] + (f2[1] - e2[1]) * t, hh);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    if (o.outlines) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.stroke();
    }
    return true;
  }

  function drawPassMarks(ctx, cam, S, P) {
    ctx.fillStyle = 'rgba(255,214,64,0.95)'; ctx.strokeStyle = 'rgba(24,20,34,0.9)'; ctx.lineWidth = 1;
    for (const p of S.passes) {
      const x = p.b % S.W + 0.5, y = ((p.b / S.W) | 0) + 0.5, hh = E.hOf(S.fine[p.b], P);
      const c = cam.p(x, y, hh), r = Math.max(3, cam.sc * 0.18);
      ctx.beginPath(); ctx.moveTo(c[0], c[1] - r * 1.2); ctx.lineTo(c[0] + r, c[1] + r * 0.8); ctx.lineTo(c[0] - r, c[1] + r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  function drawMarkers(ctx, cam, S, P) {
    ctx.font = `600 ${Math.max(10, Math.min(14, cam.sc * 0.5)) | 0}px system-ui, sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const m of S.markers) {
      const i = m.y * S.W + m.x, hh = E.hOf(S.fine[i], P);
      const b = cam.p(m.x + 0.5, m.y + 0.5, hh), t = cam.p(m.x + 0.5, m.y + 0.5, hh + 1.1);
      ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(t[0], t[1], 6, 0, 7); ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#1a1624'; ctx.textAlign = 'center'; ctx.fillText(m.code, t[0], t[1] + 0.5);
      ctx.textAlign = 'left';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,16,30,0.9)'; ctx.strokeText(m.label, t[0] + 10, t[1]);
      ctx.fillStyle = '#fff'; ctx.fillText(m.label, t[0] + 10, t[1]);
    }
  }

  /* ---- Box reference: one column per tile ---- */
  function renderBox(ctx, cam, S, P, o, st) {
    const { W, H } = S, order = [];
    for (let i = 0; i < S.n; i++) order.push(i);
    const key = (i) => cam.ry(i % W + 0.5, ((i / W) | 0) + 0.5);
    order.sort((a, b) => key(a) - key(b) || S.fine[a] - S.fine[b]);
    const passA = new Map(S.passes.map((p) => [p.a, p]));
    const dirs = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]];
    const rank = new Int32Array(S.n); order.forEach((t, r) => { rank[t] = r; });
    const face = (i2, b) => { const bp = new Path2D(); borderFaces(bp, cam, i2 % W, (i2 / W) | 0, 1 << b, E.hOf(S.fine[i2], P)); strokeBorder(ctx, bp); };
    for (const i of order) {
      const x = i % W, y = (i / W) | 0, f = S.fine[i], hh = E.hOf(f, P), c = levelColor(f, P);
      const veiled = !!(o.veil && S.slice && !S.slice[i]), cc = veiled ? veilMix(c) : c;
      for (const [dx, dy, ax, ay, bx, by] of dirs) {
        const nx = x + dx, ny = y + dy;
        const hn = nx < 0 || ny < 0 || nx >= W || ny >= H ? cam.base : E.hOf(S.fine[ny * W + nx], P);
        if (hn >= hh - 1e-6) continue;
        const [rnx, rny] = cam.nrm(dx, dy);
        if (rny <= 0.001) continue;
        wallQuad(ctx, cam, x + ax, y + ay, x + bx, y + by, hn, hh, cc, rnx, o, st);
      }
      tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = rgb(cc); ctx.fill(); ctx.strokeStyle = rgb(cc); ctx.lineWidth = 0.8; ctx.stroke();
      const ov = tileOverlay(S, P, o, i);
      for (const col of ov) { tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = col; ctx.fill(); }
      if (veiled && ov.length) { tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = VEIL; ctx.fill(); }
      if (o.outlines) { // rim only where a lower neighbour exists
        for (const [dx, dy, ax, ay, bx, by] of dirs) {
          const nx = x + dx, ny = y + dy;
          const hn = nx < 0 || ny < 0 || nx >= W || ny >= H ? cam.base : E.hOf(S.fine[ny * W + nx], P);
          if (hn >= hh - 1e-6) continue;
          const terrace = hh - hn > P.microH * 1.5;
          const A = cam.p(x + ax, y + ay, hh), B = cam.p(x + bx, y + by, hh);
          ctx.strokeStyle = terrace ? OUT : 'rgba(24,20,34,0.45)'; ctx.lineWidth = terrace ? 1.6 : 0.7;
          ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        }
      }
      if (o.border && S.border) { // each face is drawn after the later (in painter order) of the two tiles that meet there
        if (S.border[i]) for (let b = 0; b < 4; b++) {
          if (!(S.border[i] >> b & 1)) continue;
          const nx = x + dirs[b][0], ny = y + dirs[b][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || rank[ny * W + nx] < rank[i]) face(i, b);
        }
        if (S.slice && !S.slice[i]) for (let b = 0; b < 4; b++) {
          const px = x - dirs[b][0], py = y - dirs[b][1];
          if (px < 0 || py < 0 || px >= W || py >= H) continue;
          const i2 = py * W + px;
          if ((S.border[i2] >> b & 1) && rank[i2] < rank[i]) face(i2, b);
        }
      }
      st.polys++;
      const p = passA.get(i);
      if (p && drawRamp(ctx, cam, S, P, p, o)) st.ramps++;
    }
  }

  /* ---- Contour techniques A / B: one extruded slab per level over the whole slice ---- */
  function renderLevels(ctx, cam, S, P, o, st, loopsOf) {
    const byB = new Map();
    for (const p of S.passes) { const f = S.fine[p.b]; if (!byB.has(f)) byB.set(f, []); byB.get(f).push(p); }
    for (let L = 0; L <= S.maxFine; L++) {
      const loops = loopsOf(S, L, P);
      if (!loops.length) continue;
      const ht = E.hOf(L, P), hb = L === 0 ? cam.base : E.hOf(L - 1, P);
      const terraceLevel = L === 0 || L % P.micro === 0;
      const c = levelColor(L, P), cv = veilMix(c), segs = [];
      for (const loop of loops) {
        const n = loop.length; st.verts += n;
        for (let k = 0; k < n; k++) {
          const a = loop[k], b = loop[(k + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
          if (len < 1e-6) continue;
          const [rnx, rny] = cam.nrm(dy / len, -dx / len);
          if (rny <= 0.001) continue;
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
          // the wall belongs to the tile just inside the region (against the outward normal)
          segs.push({ a, b, rnx, d: cam.ry(mx, my), veiled: !!(o.veil && S.slice && !inSlice(S, mx - 0.2 * dy / len, my + 0.2 * dx / len)) });
        }
      }
      segs.sort((p, q) => p.d - q.d);
      for (const s of segs) wallQuad(ctx, cam, s.a[0], s.a[1], s.b[0], s.b[1], hb, ht, s.veiled ? cv : c, s.rnx, o, st);
      const path = new Path2D();
      for (const loop of loops) {
        loop.forEach((p, k) => { const q = cam.p(p[0], p[1], ht); k ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]); });
        path.closePath();
      }
      st.polys += loops.length;
      ctx.fillStyle = rgb(c); ctx.fill(path, 'evenodd');
      ctx.save(); ctx.clip(path, 'evenodd');
      for (const i of S.byLevel[L]) {
        const ov = tileOverlay(S, P, o, i);
        if (!ov.length) continue;
        const x = i % S.W, y = (i / S.W) | 0;
        for (const col of ov) { tileQuad(ctx, cam, x, y, ht); ctx.fillStyle = col; ctx.fill(); }
      }
      if (o.veil && S.slice) { ctx.fillStyle = VEIL; ctx.fill(veilPath(cam, S, ht), 'evenodd'); } // still clipped to this cap
      ctx.restore();
      if (o.outlines) {
        ctx.strokeStyle = terraceLevel ? OUT : 'rgba(24,20,34,0.42)'; ctx.lineWidth = terraceLevel ? 1.7 : 0.7; ctx.lineJoin = 'round';
        ctx.stroke(path);
      }
      if (o.border && S.border) {
        const bp = new Path2D(); let any = false;
        for (const i of S.byLevel[L]) if (S.border[i]) { borderFaces(bp, cam, i % S.W, (i / S.W) | 0, S.border[i], ht); any = true; }
        if (any) strokeBorder(ctx, bp);
      }
      for (const p of byB.get(L) || []) if (drawRamp(ctx, cam, S, P, p, o)) st.ramps++;
    }
  }

  E.render = function (cv, S, P, tech, view, o) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a2540'); bg.addColorStop(1, '#171424');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const t0 = performance.now(), st = { walls: 0, polys: 0, verts: 0, ramps: 0 };
    const cam = makeCam(S, P, view, w, h);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (tech === 'box') renderBox(ctx, cam, S, P, o, st);
    else renderLevels(ctx, cam, S, P, o, st, tech === 'A' ? E.loopsA : E.loopsB);
    if (o.passes) drawPassMarks(ctx, cam, S, P);
    if (o.markers) drawMarkers(ctx, cam, S, P);
    st.ms = performance.now() - t0;
    return st;
  };
})(window.EVO = window.EVO || {});
