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
  let PICK = false, PKC = '#000'; // pick mode (E.pickTile): every surface is filled with a code colour instead of its look
  const pcode = (kind, v) => { const n = (kind << 20) | v; return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`; };
  let DBG = false; // test mode (o.debug): flat grey terrain, pure red for everything that belongs to a ramp
  function levelColor(S, L, P) {
    if (DBG) return [128, 128, 128];
    const K = P.subs, m = S.levelMeta[L];
    const at = (ter, mi) => { // colour of terrace `ter`, sub-terrace `mi`
      const c = ramp(P.terraces > 1 ? ter / (P.terraces - 1) : 0);
      const lift = 1 + (mi - (K - 1) / 2) * 0.05;
      return c.map((v) => v * lift);
    };
    const base = m.bridge ? (() => { const lo = at(m.ter, K - 1), hi = at(m.ter + 1, 0); return lo.map((v, k) => v + (hi[k] - v) * m.frac); })() : at(m.ter, m.sub); // a bridge is between two terraces
    if (!m.deco) return base;
    // pocket decoration: beyond the palette it keeps going (darker below the lowest terrace, lighter above the highest), and it is a little desaturated so it does not read as walkable
    let c = base; if (m.ext && m.ext < 0) c = c.map((v) => v * Math.max(0.45, 1 + 0.2 * m.ext)); // beyond the palette it keeps going darker below the lowest terrace; above the highest it does not get lighter
    const lum = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; c = c.map((v) => (v + (lum - v) * 0.6) * 0.8); // much less saturated and darker than the fragment
    const mx = Math.max(c[0], c[1], c[2]); return mx > 150 ? c.map((v) => v * 150 / mx) : c; // the backdrop never gets close to white
  }
  const OUT = 'rgba(24,20,34,0.92)';

  function makeCam(S, P, view, w, h) {
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const base = S.levelH[0] - P.terH, top = S.levelH[S.maxFine];
    const raw = (x, y, hh) => {
      const X = x - S.W / 2, Y = y - S.H / 2;
      return [cy * X - sy * Y, (sy * X + cy * Y) * sp - hh * cp];
    };
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const fb = S.sliceBox ? [S.sliceBox.x0 - 2, S.sliceBox.y0 - 2, S.sliceBox.x1 + 2, S.sliceBox.y1 + 2] : [0, 0, S.W, S.H]; // fit the slice, scenery spills past
    for (const [x, y] of [[fb[0], fb[1]], [fb[2], fb[1]], [fb[0], fb[3]], [fb[2], fb[3]]]) for (const hh of [base, top + 1.5]) {
      const [a, b] = raw(x, y, hh); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    }
    const fit = Math.min((w - 20) / (x1 - x0), (h - 20) / (y1 - y0)), sc = (view.fitSc || fit) * view.zoom; // view.fitSc: the scale of the first panel, shared by all panels
    const ox = w / 2 - (x0 + x1) / 2 * sc + view.panX, oy = h / 2 - (y0 + y1) / 2 * sc + view.panY;
    return {
      sc, base, fit,
      p: (x, y, hh) => { const [a, b] = raw(x, y, hh); return [a * sc + ox, b * sc + oy]; },
      unp: (px, py, hh) => { const a = (px - ox) / sc, b = (py - oy) / sc + hh * cp, c = b / sp; return [cy * a + sy * c + S.W / 2, -sy * a + cy * c + S.H / 2]; }, // screen point -> ground point on the plane at height hh
      ry: (x, y) => sy * (x - S.W / 2) + cy * (y - S.H / 2),
      nrm: (nx, ny) => [cy * nx - sy * ny, sy * nx + cy * ny]
    };
  }

  function wallFill(ctx, c, k, y0, y1, o) {
    if (PICK) return PKC;
    if (!o.gradient) return rgb(c, 0.62 * k);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(c, 0.86 * k)); g.addColorStop(1, rgb(c, 0.42 * k));
    return g;
  }

  /* hb / ht: a number, or [at a, at b] for a wall whose bottom or top is sloped (ramp flanks) */
  function wallQuad(ctx, cam, ax, ay, bx, by, hb, ht, c, rnx, o, st, strong) {
    const hb0 = Array.isArray(hb) ? hb[0] : hb, hb1 = Array.isArray(hb) ? hb[1] : hb, ht0 = Array.isArray(ht) ? ht[0] : ht, ht1 = Array.isArray(ht) ? ht[1] : ht;
    const p0 = cam.p(ax, ay, ht0), p1 = cam.p(bx, by, ht1), p2 = cam.p(bx, by, hb1), p3 = cam.p(ax, ay, hb0);
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
  const ROAD = 'rgba(236,212,150,0.92)'; // an exit road of a pocket
  const BORDER = 'rgba(255,226,110,0.98)', BORDER_CASE = 'rgba(24,20,34,0.95)';
  const FACE = [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]]; // N E S W, same bits as S.border
  const inSlice = (S, x, y) => { const ix = Math.floor(x), iy = Math.floor(y); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H && S.slice[iy * S.W + ix] === 1; };
  /* Border faces, one segment per tile face (tile-exact, the same in Box, A and B). kind: 1 barrier (red), 2 pass (cyan,
     dashed per face), 3 not marked (yellow), 4 map edge (white); 0 = the old single colour. */
  const BORDER_COLORS = { 0: BORDER, 1: 'rgba(240,56,56,0.98)', 2: 'rgba(56,228,244,0.98)', 3: BORDER, 4: 'rgba(255,255,255,0.98)' };
  function borderFaces(list, S, cam, i, bits, hh) { // adds the faces of tile i that look outside the slice, at the height of its cap
    const x = i % S.W, y = (i / S.W) | 0;
    for (let b = 0; b < 4; b++) {
      if (!(bits >> b & 1)) continue;
      const f = FACE[b], p = cam.p(x + f[0], y + f[1], hh), q = cam.p(x + f[2], y + f[3], hh);
      list.push([p, q, S.borderKind ? S.borderKind[i * 4 + b] : 0]);
    }
  }
  function strokeBorder(ctx, list) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = new Path2D(); for (const [p, q] of list) { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); }
    ctx.strokeStyle = BORDER_CASE; ctx.lineWidth = 4.2; ctx.stroke(path);
    for (const kind of [0, 1, 2, 3, 4]) {
      const pp = new Path2D(); let any = false;
      for (const [p, q, k] of list) if (k === kind) { pp.moveTo(p[0], p[1]); pp.lineTo(q[0], q[1]); any = true; }
      if (!any) continue;
      ctx.strokeStyle = BORDER_COLORS[kind]; ctx.lineWidth = 2;
      if (kind === 2) { ctx.lineCap = 'butt'; ctx.setLineDash([4, 3]); }
      ctx.stroke(pp); ctx.setLineDash([]); ctx.lineCap = 'round';
    }
    ctx.restore();
  }
  /* Room borders: a line on every face between two rooms that blocks (orange); an open transition is a gap; the ones the tree uses are green. */
  const ROOM_COLORS = { 4: 'rgba(255,226,40,0.99)', 1: 'rgba(255,150,40,0.98)', 2: 'rgba(70,232,130,0.98)', 3: 'rgba(40,110,255,0.98)' }; // 3 = the warning outline of an edge-problem region (electric blue, dashed: white is the slice border at the map edge, cyan the passes, pink the route)
  function roomFaces(list, S, cam, i, b, hh, o) { if (S.pocket && !S.slice[i]) return; let k = S.roomKind[i * 4 + b]; if (o.dioOutline && S.dioBits && (S.dioBits[i] >> b & 1)) k = 4; else if (!k || (k === 3 ? !o.edgeWarn : !o.roomBorders)) return; const x = i % S.W, y = (i / S.W) | 0, f = FACE[b]; list.push([cam.p(x + f[0], y + f[1], hh), cam.p(x + f[2], y + f[3], hh), k]); }
  function strokeRoomFaces(ctx, list) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = new Path2D(); for (const [p, q] of list) { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); }
    ctx.strokeStyle = BORDER_CASE; ctx.lineWidth = 3.4; ctx.stroke(path);
    for (const kind of [1, 2, 3, 4]) {
      const pp = new Path2D(); let any = false;
      for (const [p, q, k] of list) if (k === kind) { pp.moveTo(p[0], p[1]); pp.lineTo(q[0], q[1]); any = true; }
      if (any) { ctx.strokeStyle = ROOM_COLORS[kind]; ctx.lineWidth = kind === 4 ? 2.6 : 1.8; if (kind === 3) { ctx.lineCap = 'butt'; ctx.setLineDash([3, 2.5]); } ctx.stroke(pp); ctx.setLineDash([]); ctx.lineCap = 'round'; }
    }
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
    if (S.pocket && !S.slice[i]) { const r = S.pocketRole[i]; return r === 4 ? ['rgba(52,142,222,0.95)'] : r === 3 ? [ROAD] : []; } // pocket: the decoration takes no tints and no marks; the pond is water, the exits are marked roads
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
    if (o.nowalk && S.nowalk && S.nowalk[i]) out.push('rgba(48,40,84,0.36)'); // not walkable (rooms on): isolated terrain and the margins of walls, cliffs and steep slopes
    if (o.typeTint && S.roomType && S.roomType[i]) out.push(S.roomType[i] === 1 ? 'rgba(255,150,30,0.42)' : S.roomType[i] === 2 ? 'rgba(60,200,110,0.42)' : 'rgba(70,130,255,0.42)');
    if (o.roomTint && S.roomMap && S.roomMap[i] > 0) out.push(`hsla(${E.rooms.hue(S.roomMap[i]).toFixed(0)},55%,50%,0.45)`);
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

  function drawPassMarks(ctx, cam, S, P) {
    ctx.fillStyle = 'rgba(255,214,64,0.95)'; ctx.strokeStyle = 'rgba(24,20,34,0.9)'; ctx.lineWidth = 1;
    for (const st of S.stairs) {
      const t = st.top[0], x = t % S.W + 0.5, y = ((t / S.W) | 0) + 0.5, hh = S.levelH[S.fine[t]]; // top of the stair
      const c = cam.p(x, y, hh), r = Math.max(3, cam.sc * 0.18);
      ctx.beginPath(); ctx.moveTo(c[0], c[1] - r * 1.2); ctx.lineTo(c[0] + r, c[1] + r * 0.8); ctx.lineTo(c[0] - r, c[1] + r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  function drawMarkers(ctx, cam, S, P) {
    ctx.font = `600 ${Math.max(10, Math.min(14, cam.sc * 0.5)) | 0}px system-ui, sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const m of S.markers) {
      const i = m.y * S.W + m.x, hh = S.levelH[S.fine[i]];
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

  /* ---- Stair look (same in Box, A and B): the footprint is rigid, so it gets its own colour, a tint per tread,
     light lines on the top edge of each riser and a dark outline along its flanks. ---- */
  const STAIR_RGB = [226, 212, 178], PATCH_RGB = [176, 200, 232]; // PATCH: a ramp that joins what the slice cut apart (only while that slice is chosen)
  const toneOf = (R) => (R && R.patch ? PATCH_RGB : STAIR_RGB);
  function stairTiles(S) { // tile -> { dir, k (tread index, 0 = lowest), m }
    if (S._stairTile) return S._stairTile;
    const map = new Map();
    for (const st of S.stairs) st.steps.forEach((step, k) => { for (const t of step.tiles) map.set(t, { dir: st.dir, k, m: st.steps.length, rec: st.ramp ? st : null, t }); });
    S._stairNear = new Uint8Array(S.n); // carved tiles and their 4-neighbours: the only tiles with stair edges
    for (const t of map.keys()) { const x = t % S.W, y = (t / S.W) | 0; S._stairNear[t] = 1; if (x > 0) S._stairNear[t - 1] = 1; if (x < S.W - 1) S._stairNear[t + 1] = 1; if (y > 0) S._stairNear[t - S.W] = 1; if (y < S.H - 1) S._stairNear[t + S.W] = 1; }
    return (S._stairTile = map);
  }
  const stairColor = (info) => DBG ? [255, 0, 0] : info.rec ? toneOf(info.rec.ramp) : STAIR_RGB.map((v) => v * (0.78 + 0.3 * (info.m > 1 ? info.k / (info.m - 1) : 0.5)));
  const STAIR_LINE = 'rgba(255,248,226,0.95)', STAIR_EDGE = 'rgba(24,20,34,0.9)';
  /* edge of tile t towards neighbour n (t higher than n) that belongs to a stair: returns 'riser', 'flank' or null */
  function stairEdge(S, t, n) {
    const T = stairTiles(S), a = T.get(t), b = T.get(n);
    if (!a && !b) return null;
    if ((a && a.rec) || (b && b.rec)) return null; // ramps draw their own edges
    const dx = Math.abs((n % S.W) - (t % S.W)), info = a || b, par = info.dir[0] !== 0 ? dx === 1 : dx === 0;
    if (par) return 'riser';
    return a && b ? null : 'flank';
  }
  function drawStairEdges(ctx, cam, S, i, hh) { // edges of tile i that face a lower neighbour, at the height of its cap
    if (PICK || !S._stairNear[i]) return;
    const x = i % S.W, y = (i / S.W) | 0;
    for (const [dx, dy, ax, ay, bx, by] of [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= S.W || ny >= S.H) continue;
      const j = ny * S.W + nx; if (S.levelH[S.fine[j]] >= hh - 1e-6) continue;
      const kind = stairEdge(S, i, j); if (!kind) continue;
      const A = cam.p(x + ax, y + ay, hh), B = cam.p(x + bx, y + by, hh);
      ctx.strokeStyle = kind === 'riser' ? STAIR_LINE : STAIR_EDGE; ctx.lineWidth = kind === 'riser' ? 1.5 : 1.8;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
  }
  function hasStairs(S) { return S.stairs && S.stairs.length > 0; }

  /* ---- Ramp: one smooth surface per gate, same look in Box, A and B. Surface = quads with the heights of E.rampHeight, a
     gradient along the slope (lighter at the high end), a dark outline on the footprint and own side walls. ---- */
  function rampFill(ctx, cam, R, pos) {
    if (PICK) return PKC;
    if (DBG) return 'rgb(255,0,0)';
    const along = R.pdx !== 0, a0 = pos(0), a1 = pos(R.len), q0 = along ? R.my : R.mx; // the gradient of this tile's column (its own cliff)
    const p0 = along ? cam.p(a0, q0, R.h0) : cam.p(q0, a0, R.h0), p1 = along ? cam.p(a1, q0, R.h1) : cam.p(q0, a1, R.h1);
    const T = toneOf(R);
    if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 2) return rgb(T);
    const g = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]), up = R.h1 > R.h0;
    g.addColorStop(0, rgb(T, up ? 0.7 : 1.12)); g.addColorStop(1, rgb(T, up ? 1.12 : 0.7));
    return g;
  }
  /* One piece of a ramp tile: the part of tile i whose path coordinate s (0 at the gate edge, len at the far end) lies in [sa, sb]
     (default: the whole tile). Box draws whole tiles; A / B draw pieces cut at the heights of the levels (see renderLevels). */
  function rampPiece(ctx, cam, S, o, i, rec, ST, st, sa, sb) {
    if (PICK) PKC = pcode(3, i);
    const x = i % S.W, y = (i / S.W) | 0, R = rec.ramp, hc = (px, py) => E.rampHeight(rec, px, py, i), dsh = R.shift && R.shift.get(i) || 0;
    const alongX = R.pdx !== 0, sT0 = (alongX ? (R.pdx > 0 ? x - R.mx : R.mx - (x + 1)) : (R.pdy > 0 ? y - R.my : R.my - (y + 1))) - dsh;
    if (sa === undefined) { sa = sT0; sb = sT0 + 1; }
    const e = 1e-7, pos = (s) => (alongX ? R.mx + R.pdx * (s + dsh) : R.my + R.pdy * (s + dsh));
    let X0 = x, X1 = x + 1, Y0 = y, Y1 = y + 1;
    if (alongX) { const u = pos(sa), v = pos(sb); X0 = Math.min(u, v); X1 = Math.max(u, v); } else { const u = pos(sa), v = pos(sb); Y0 = Math.min(u, v); Y1 = Math.max(u, v); }
    const EDGES = [[0, -1, X0, Y0, X1, Y0, Math.abs(Y0 - y) < e], [1, 0, X1, Y0, X1, Y1, Math.abs(X1 - (x + 1)) < e], [0, 1, X1, Y1, X0, Y1, Math.abs(Y1 - (y + 1)) < e], [-1, 0, X0, Y1, X0, Y0, Math.abs(X0 - x) < e]];
    for (const [dx, dy, ax, ay, bx, by, onB] of EDGES) { // side walls where the surface is above the neighbour
      if (!onB) continue;
      const nx = x + dx, ny = y + dy, out = nx < 0 || ny < 0 || nx >= S.W || ny >= S.H || (S.void && S.void[ny * S.W + nx]), j = out ? -1 : ny * S.W + nx, nj = j >= 0 ? ST.get(j) : null;
      const [rnx, rny] = cam.nrm(dx, dy);   // (a neighbour of the same ramp gets a wall only where its column is shifted and the surfaces differ)
      if (rny <= 0.001) continue;
      const e0 = hc(ax, ay), e1 = hc(bx, by);
      const hn0 = out ? cam.base : nj ? E.rampHeight(nj.rec, ax, ay, j) : S.levelH[S.fine[j]], hn1 = out ? cam.base : nj ? E.rampHeight(nj.rec, bx, by, j) : hn0; // beside another ramp: its surface
      const b0 = Math.min(hn0, e0), b1 = Math.min(hn1, e1);
      if (e0 - b0 < 1e-6 && e1 - b1 < 1e-6) continue;
      wallQuad(ctx, cam, ax, ay, bx, by, [b0, b1], [e0, e1], DBG ? [255, 0, 0] : toneOf(R), rnx, o, st);
    }
    const q = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]].map(([px, py]) => cam.p(px, py, hc(px, py)));
    ctx.beginPath(); q.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = rampFill(ctx, cam, R, pos); ctx.fill(); if (!DBG && !PICK) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8; ctx.stroke(); }
    if (DBG || PICK) return;
    if (o.rampLines) { // thin lines across the slope, evenly spaced along the whole ramp (cut where they cross this piece)
      const nL = Math.max(2, Math.min(10, Math.round(Math.abs(R.h1 - R.h0) / 0.3))); // more lines the higher the jump: a steep ramp reads as a flight of steps
      for (let k = 1; k <= nL; k++) {
        const s0 = R.len * k / (nL + 1), c = pos(s0);
        if (s0 < sa - 1e-9 || s0 > sb + 1e-9) continue;
        const pts = alongX ? [[c, Y0], [c, Y1]] : [[X0, c], [X1, c]];
        const A = cam.p(pts[0][0], pts[0][1], hc(pts[0][0], pts[0][1])), B = cam.p(pts[1][0], pts[1][1], hc(pts[1][0], pts[1][1]));
        ctx.strokeStyle = 'rgba(255,250,230,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
    }
    for (const [dx, dy, ax, ay, bx, by, onB] of EDGES) { // outline along the footprint boundary, at the height of the surface
      if (!onB) continue;
      const nj = ST.get((y + dy) * S.W + x + dx);
      if ((nj && nj.rec === rec) || x + dx < 0 || y + dy < 0 || x + dx >= S.W || y + dy >= S.H) continue;
      const A = cam.p(ax, ay, hc(ax, ay)), B = cam.p(bx, by, hc(bx, by));
      ctx.strokeStyle = STAIR_EDGE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
  }
  const rampTile = (ctx, cam, S, o, i, rec, ST, st) => rampPiece(ctx, cam, S, o, i, rec, ST, st);
  /* Pieces of a ramp cut by level band: every tile of the ramp is split where its surface crosses the height of a level, and each
     piece is drawn in the pass of the level at the top of its band, sorted by depth together with the walls of that level and
     before its cap. Returns Map level -> [{ rec, tile, sa, sb, d }]. */
  function rampPieces(S, cam) {
    const out = new Map(), LH = S.levelH;
    for (const rec of S.stairs) {
      if (!rec.ramp) continue;
      const R = rec.ramp, span = R.h1 - R.h0, lo = Math.min(R.h0, R.h1), hi = Math.max(R.h0, R.h1), cuts = [];
      for (let L = 0; L < LH.length; L++) if (LH[L] > lo + 1e-6 && LH[L] < hi - 1e-6) cuts.push((LH[L] - R.h0) / span * R.len);
      cuts.sort((a, b) => a - b);
      for (const step of rec.steps) for (const t of step.tiles) {
        const x = t % S.W, y = (t / S.W) | 0, alongX = R.pdx !== 0;
        const dsh = R.shift && R.shift.get(t) || 0, sT0 = (alongX ? (R.pdx > 0 ? x - R.mx : R.mx - (x + 1)) : (R.pdy > 0 ? y - R.my : R.my - (y + 1))) - dsh, sT1 = sT0 + 1;
        const pts = [sT0, ...cuts.filter((c) => c > sT0 + 1e-7 && c < sT1 - 1e-7), sT1];
        for (let k = 0; k + 1 < pts.length; k++) {
          const sa = pts[k], sb = pts[k + 1], top = Math.max(R.h0 + span * sa / R.len, R.h0 + span * sb / R.len);
          let L = 0; while (L < LH.length - 1 && LH[L] < top - 1e-6) L++;
          const m = (sa + sb) / 2 + dsh, cx = alongX ? R.mx + R.pdx * m : x + 0.5, cy = alongX ? y + 0.5 : R.my + R.pdy * m;
          (out.get(L) || out.set(L, []).get(L)).push({ rec, tile: t, sa, sb, d: cam.ry(cx, cy) });
        }
      }
    }
    return out;
  }

  /* ---- Incursion: stake, objectives and their routes (drawn on top, same in every technique) ---- */
  const ROUTE_COLORS = ['#ffb020', '#ff5a8a', '#6ae0ff', '#b48cff', '#a6f06a', '#ffd84a'];
  function surfaceH(S, i) {
    const t = hasStairs(S) ? stairTiles(S).get(i) : null;
    return t && t.rec ? E.rampHeight(t.rec, i % S.W + 0.5, ((i / S.W) | 0) + 0.5, i) : S.levelH[S.fine[i]];
  }
  function drawIncursion(ctx, cam, S, inc) {
    const pt = (i, lift = 0.06) => cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, surfaceH(S, i) + lift);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    inc.objectives.forEach((ob, k) => {
      if (!ob.route || ob.route.length < 2) return;
      const col = ROUTE_COLORS[k % ROUTE_COLORS.length], pts = ob.route.map((i) => pt(i));
      for (const [w, c] of [[4.6, 'rgba(24,20,34,0.9)'], [2.4, col]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      }
    });
    const pin = (i, label, fill, flag) => {
      const b = pt(i, 0), t = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, surfaceH(S, i) + 1.3), r = 8;
      ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
      if (flag) { ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[0] + 16, t[1] + 5); ctx.lineTo(t[0], t[1] + 10); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(t[0], t[1], r, 0, 7); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#1a1624'; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, t[0], t[1] + 0.5); }
    };
    inc.objectives.forEach((ob, k) => pin(ob.i, String(k + 1), ROUTE_COLORS[k % ROUTE_COLORS.length], false));
    if (inc.stake) pin(inc.stake, 'S', '#4cd964', true);
    ctx.restore();
  }

  /* ---- Box reference: one column per tile ---- */
  function renderBox(ctx, cam, S, P, o, st) {
    const { W, H } = S, order = [];
    for (let i = 0; i < S.n; i++) if (!S.void || !S.void[i]) order.push(i); // void is not terrain
    const key = (i) => cam.ry(i % W + 0.5, ((i / W) | 0) + 0.5);
    order.sort((a, b) => key(a) - key(b) || S.fine[a] - S.fine[b]);
    const dirs = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]];
    const rank = new Int32Array(S.n); order.forEach((t, r) => { rank[t] = r; });
    const ST = hasStairs(S) ? stairTiles(S) : null;
    const face = (i2, b) => { const bp = []; borderFaces(bp, S, cam, i2, 1 << b, S.levelH[S.fine[i2]]); strokeBorder(ctx, bp); };
    for (const i of order) {
      const x = i % W, y = (i / W) | 0, f = S.fine[i], hh = S.levelH[f], si = ST && ST.get(i), c = si ? stairColor(si) : levelColor(S, f, P);
      const isRamp = !!(si && si.rec);
      if (PICK) PKC = pcode(2, i);
      const veiled = !!(o.veil && S.slice && !S.slice[i] && !S.pocket), cc = veiled ? veilMix(c) : c;
      if (isRamp) rampTile(ctx, cam, S, o, i, si.rec, ST, st);
      else for (const [dx, dy, ax, ay, bx, by] of dirs) {
        const nx = x + dx, ny = y + dy;
        const hn = nx < 0 || ny < 0 || nx >= W || ny >= H || (S.void && S.void[ny * W + nx]) ? cam.base : S.levelH[S.fine[ny * W + nx]];
        if (hn >= hh - 1e-6) continue;
        const [rnx, rny] = cam.nrm(dx, dy);
        if (rny <= 0.001) continue;
        const sj = ST && (si || ST.get(ny * W + nx)); // a wall that belongs to a stair (riser or flank) takes its colour
        const inside = nx >= 0 && ny >= 0 && nx < W && ny < H, nr = inside && ST && ST.get(ny * W + nx);
        const hbw = nr && nr.rec ? [Math.min(hh, E.rampHeight(nr.rec, x + ax, y + ay, ny * W + nx)), Math.min(hh, E.rampHeight(nr.rec, x + bx, y + by, ny * W + nx))] : hn; // beside a ramp the wall stops at its surface
        wallQuad(ctx, cam, x + ax, y + ay, x + bx, y + by, hbw, hh, sj && inside ? stairColor(sj) : cc, rnx, o, st);
      }
      const ov = isRamp ? [] : tileOverlay(S, P, o, i);
      if (!isRamp) {
        if (PICK) PKC = pcode(4, i);
        tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = PICK ? PKC : rgb(cc); ctx.fill(); ctx.strokeStyle = PICK ? PKC : rgb(cc); ctx.lineWidth = 0.8; ctx.stroke();
        for (const col of ov) { tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = col; ctx.fill(); }
        if (veiled && ov.length) { tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = VEIL; ctx.fill(); }
        if (ST) drawStairEdges(ctx, cam, S, i, hh);
      }
      if (o.outlines && !isRamp) { // rim only where a lower neighbour exists
        for (const [dx, dy, ax, ay, bx, by] of dirs) {
          const nx = x + dx, ny = y + dy;
          const hn = nx < 0 || ny < 0 || nx >= W || ny >= H || (S.void && S.void[ny * W + nx]) ? cam.base : S.levelH[S.fine[ny * W + nx]];
          if (hn >= hh - 1e-6) continue;
          const terrace = hh - hn > E.subHeight(P) * 1.5;
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
      const RB = o.dioOutline && S.roomBitsDio ? S.roomBitsDio : S.roomBits;
      if ((o.roomBorders || o.edgeWarn || o.dioOutline) && RB && !PICK && RB[i]) { // each face is drawn once, after the later (painter order) of its two tiles
        const bp = [];
        for (let b = 0; b < 4; b++) {
          if (!(RB[i] >> b & 1)) continue;
          const j = (y + dirs[b][1]) * W + x + dirs[b][0]; if (rank[j] > rank[i]) continue;
          roomFaces(bp, S, cam, i, b, Math.max(hh, S.levelH[S.fine[j]]), o);
        }
        if (bp.length) strokeRoomFaces(ctx, bp);
      }
      st.polys++;
    }
  }

  /* ---- Contour techniques A / B: one extruded slab per level over the whole slice ---- */
  function renderLevels(ctx, cam, S, P, o, st, loopsOf) {
    const ST = hasStairs(S) ? stairTiles(S) : null, PIECES = ST ? rampPieces(S, cam) : new Map(); // ramp pieces by level band
    for (let L = 0; L <= S.maxFine; L++) {
      const loops = loopsOf(S, L, P), pcs = PIECES.get(L) || [];
      if (!loops.length && !pcs.length) continue;
      if (!loops.length) { pcs.sort((p, q) => p.d - q.d); for (const pc of pcs) rampPiece(ctx, cam, S, o, pc.tile, pc.rec, ST, st, pc.sa, pc.sb); continue; }
      const ht = S.levelH[L], hb = L === 0 ? cam.base : S.levelH[L - 1];
      const terraceLevel = L === 0 || (!S.levelMeta[L].bridge && S.levelMeta[L].sub === 0);
      const c = levelColor(S, L, P), cv = veilMix(c), segs = [];
      const tileIdx = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? iy * S.W + ix : -1; };
      const tileOf = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? ST.get(iy * S.W + ix) : undefined; };
      const mkSeg = (a, b, dx, dy, len) => {
        const rnxy = cam.nrm(dy / len, -dx / len), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (rnxy[1] <= 0.001) return null;
        const seg = { a, b, rnx: rnxy[0], d: cam.ry(mx, my), veiled: !!(o.veil && S.slice && !S.pocket && !inSlice(S, mx - 0.2 * dy / len, my + 0.2 * dx / len)), stair: null, own: tileIdx(mx - 0.2 * dy / len, my + 0.2 * dx / len) };
        if (ST) { // a wall touching a carved tile (also the diagonal corner cells of B): part of the rigid footprint
          const inn = tileOf(mx - 0.2 * dy / len, my + 0.2 * dx / len), outn = tileOf(mx + 0.2 * dy / len, my - 0.2 * dx / len);
          if (inn && inn.rec) return null;                  // the ramp draws its own side walls
          seg.stair = inn || outn || null;
          if (outn && outn.rec) { seg.clip = outn.rec; seg.clipT = outn.t; }        // a wall beside a ramp stops at the ramp surface
        }
        return seg;
      };
      for (const loop of loops) {
        const n = loop.length; st.verts += n;
        for (let k = 0; k < n; k++) {
          const a = loop[k], b = loop[(k + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
          if (len < 1e-6) continue;
          if (PICK && len > 1.001) { // picking: every wall is cut into pieces of at most one tile, each owned by the tile it stands on
            const nP = Math.ceil(len - 1e-6);
            for (let q = 0; q < nP; q++) { const p0 = [a[0] + dx * q / nP, a[1] + dy * q / nP], p1 = [a[0] + dx * (q + 1) / nP, a[1] + dy * (q + 1) / nP], sg = mkSeg(p0, p1, p1[0] - p0[0], p1[1] - p0[1], len / nP); if (sg) segs.push(sg); }
            continue;
          }
          // a long wall that runs (nearly) along an axis next to a ramp is cut per tile: the ramp surface changes along it
          if ((ST || PICK) && len > 1.001 && (Math.abs(dx) < 0.1 * len || Math.abs(dy) < 0.1 * len)) {
            const ax = Math.abs(dx) > Math.abs(dy) ? 0 : 1, lo = Math.min(a[ax], b[ax]), hi = Math.max(a[ax], b[ax]), cuts = [];
            for (let c = Math.floor(lo + 1e-6) + 1; c < hi - 1e-6; c++) cuts.push(c);
            const pts = [a[ax], ...(a[ax] < b[ax] ? cuts : cuts.slice().reverse()), b[ax]], pieces = [];
            const at = (v) => { const t = (v - a[ax]) / (b[ax] - a[ax]); return [a[0] + dx * t, a[1] + dy * t]; };
            for (let q = 0; q + 1 < pts.length; q++) { const p0 = at(pts[q]), p1 = at(pts[q + 1]); pieces.push(mkSeg(p0, p1, p1[0] - p0[0], p1[1] - p0[1], Math.hypot(p1[0] - p0[0], p1[1] - p0[1]))); }
            if (PICK || pieces.some((q) => q && (q.clip || q.stair))) { for (const q of pieces) if (q) segs.push(q); continue; }
          }
          const seg = mkSeg(a, b, dx, dy, len); if (seg) segs.push(seg);
        }
      }
      for (const pc of pcs) segs.push({ piece: pc, d: pc.d });
      segs.sort((p, q) => p.d - q.d);
      for (const s of segs) {
        if (s.piece) { rampPiece(ctx, cam, S, o, s.piece.tile, s.piece.rec, ST, st, s.piece.sa, s.piece.sb); continue; }
        let hbs = hb;
        if (s.clip) { hbs = [Math.min(ht, Math.max(hb, E.rampHeight(s.clip, s.a[0], s.a[1], s.clipT))), Math.min(ht, Math.max(hb, E.rampHeight(s.clip, s.b[0], s.b[1], s.clipT)))]; if (hbs[0] >= ht - 1e-6 && hbs[1] >= ht - 1e-6) continue; }
        if (PICK) PKC = pcode(2, Math.max(0, s.own));
        wallQuad(ctx, cam, s.a[0], s.a[1], s.b[0], s.b[1], hbs, ht, s.stair ? stairColor(s.stair) : s.veiled ? cv : c, s.rnx, o, st);
      }
      const path = new Path2D();
      for (const loop of loops) {
        loop.forEach((p, k) => { const q = cam.p(p[0], p[1], ht); k ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]); });
        path.closePath();
      }
      st.polys += loops.length;
      ctx.fillStyle = PICK ? pcode(1, L) : rgb(c); ctx.fill(path, 'evenodd');
      ctx.save(); ctx.clip(path, 'evenodd');
      if (ST && !PICK) for (const i of S.byLevel[L]) {
        const si = ST.get(i); if (!si) continue;
        tileQuad(ctx, cam, i % S.W, (i / S.W) | 0, ht); ctx.fillStyle = rgb(stairColor(si)); ctx.fill();
      }
      for (const i of S.byLevel[L]) {
        const ov = tileOverlay(S, P, o, i);
        if (!ov.length) continue;
        const x = i % S.W, y = (i / S.W) | 0;
        for (const col of ov) { tileQuad(ctx, cam, x, y, ht); ctx.fillStyle = col; ctx.fill(); }
      }
      if (o.veil && S.slice && !S.pocket) { ctx.fillStyle = VEIL; ctx.fill(veilPath(cam, S, ht), 'evenodd'); } // still clipped to this cap
      ctx.restore();
      if (o.outlines) {
        ctx.strokeStyle = terraceLevel ? OUT : 'rgba(24,20,34,0.42)'; ctx.lineWidth = terraceLevel ? 1.7 : 0.7; ctx.lineJoin = 'round';
        ctx.stroke(path);
      }
      if (ST) for (const i of S.byLevel[L]) drawStairEdges(ctx, cam, S, i, ht);
      if (o.border && S.border) {
        const bp = [];
        for (const i of S.byLevel[L]) if (S.border[i]) borderFaces(bp, S, cam, i, S.border[i], ht);
        if (bp.length) strokeBorder(ctx, bp);
      }
      const RB = o.dioOutline && S.roomBitsDio ? S.roomBitsDio : S.roomBits;
      if ((o.roomBorders || o.edgeWarn || o.dioOutline) && RB && !PICK) { // a face belongs to the higher of its two tiles (the lower index when they are level)
        const bp = [], dd = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const i of S.byLevel[L]) {
          if (!RB[i]) continue; const x = i % S.W, y = (i / S.W) | 0;
          for (let b = 0; b < 4; b++) { if (!(RB[i] >> b & 1)) continue; const j = (y + dd[b][1]) * S.W + x + dd[b][0]; if (S.fine[j] > L || (S.fine[j] === L && j < i)) continue; roomFaces(bp, S, cam, i, b, ht, o); }
        }
        if (bp.length) strokeRoomFaces(ctx, bp);
      }
    }
  }

  E.levelColor = levelColor; // exposed for the tests
    E.makeCam = makeCam;
  E.fitScale = (S, P, view, w, h) => makeCam(S, P, Object.assign({}, view, { fitSc: 0, zoom: 1, panX: 0, panY: 0 }), w, h).fit; // px per tile at zoom 1 for a panel of w x h // exposed for the UI tests (screen position of a tile)

  function drawScene(ctx, w, h, S, P, tech, view, o) {
    DBG = !!o.debug; PICK = !!o.pick;
    const t0 = performance.now(), st = { walls: 0, polys: 0, verts: 0 };
    const cam = makeCam(S, P, view, w, h);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (tech === 'box') renderBox(ctx, cam, S, P, o, st);
    else renderLevels(ctx, cam, S, P, o, st, tech === 'A' ? E.loopsA : E.loopsB);
    if (!PICK) {
      if (o.passes) drawPassMarks(ctx, cam, S, P);
      if (o.markers) drawMarkers(ctx, cam, S, P);
      if (o.incursion) drawIncursion(ctx, cam, S, o.incursion);
    }
    st.ms = performance.now() - t0; DBG = false; PICK = false;
    return { st, cam };
  }

  E.render = function (cv, S, P, tech, view, o) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a2540'); bg.addColorStop(1, '#171424');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    return drawScene(ctx, w, h, S, P, tech, view, o).st;
  };

  /* The tile under a screen point, as seen: the same renderer draws every surface with a code colour (walls and ramps and
     Box caps by tile, the caps of A / B slabs by level) and the point is read back; a cap is turned into a tile by
     unprojecting the pixel onto the plane of its level. Returns { tile, kind } (tile = index in the window, -1 = nothing).
     (px, py) are CSS pixels of a canvas of w x h CSS pixels. */
  E.pickTile = function (S, P, tech, view, w, h, px, py) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.antialias = false;
    const { cam } = drawScene(ctx, w, h, S, P, tech, view, { pick: true });
    const x0 = Math.round(px), y0 = Math.round(py);
    const valid = (code) => { const k = code >> 20, v = code & 0xfffff; return (k === 1 && v <= S.maxFine) || ((k === 2 || k === 3 || k === 4) && v < S.n); }; // blended edge pixels are not codes
    const at = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return -1; const q = ctx.getImageData(x, y, 1, 1).data; return q[3] === 255 ? (q[0] << 16) | (q[1] << 8) | q[2] : -1; };
    const cc = at(x0, y0); let best = -1;
    if (cc >= 0 && valid(cc)) best = cc;
    else for (const rad of [1, 2, 3]) { // the nearest valid code around the point (an edge pixel is a blend of two codes)
      const votes = new Map();
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue; const c = at(x0 + dx, y0 + dy); if (c >= 0 && valid(c)) votes.set(c, (votes.get(c) || 0) + 1); }
      let bn = 0; for (const [c, n] of votes) if (n > bn) { best = c; bn = n; }
      if (best >= 0) break;
    }
    if (best < 0) return { tile: -1, kind: 'none' };
    const kind = best >> 20, v = best & 0xfffff;
    if (kind === 2) return { tile: v < S.n ? v : -1, kind: 'wall' };
    if (kind === 3) return { tile: v < S.n ? v : -1, kind: 'ramp' };
    if (kind === 4) return { tile: v < S.n ? v : -1, kind: 'cap' };
    if (kind === 1 && v <= S.maxFine) {
      const [gx, gy] = cam.unp(px, py, S.levelH[v]), ix = Math.floor(gx), iy = Math.floor(gy);
      return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? { tile: iy * S.W + ix, kind: 'cap' } : { tile: -1, kind: 'none' };
    }
    return { tile: -1, kind: 'none' };
  };
})(window.EVO = window.EVO || {});
