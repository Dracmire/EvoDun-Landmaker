/* EvoDun crystal viewer - crystallizer 6, MACROFORM: the VOLUME of a pack (`pack.volume`, `pack.macro`; docs/pack-format.md, docs/crystallizers/06-macroform/README.md).
   The data model is a column (x, y) that holds SEVERAL solid intervals (z0, z1, material) instead of one height; the render family is the same as the Box technique: orthographic, painter's algorithm, flat colour + outlines,
   no WebGL, no mesh engine, no z-buffer (a z-buffer is only used by the TESTS as a reference, tools/ui/test_volume_ui.js).
   VERTICAL UNIT: the volume is stored in ELEVATION units; here z_tiles = z * vScale (a voxel is a cube, 1 tile wide and 1 tile high). The heightmap view of the same source quantizes `elevation` into terraces of `P.terH`
   (a terrace is `terH` tiles high, not `vScale` tiles per elevation unit), so the two views do NOT share a vertical scale (README section 11).
   PAINTER ORDER (exact for axis-aligned boxes under any orthographic camera, no sorting by projected depth): a box is nearer to the camera when its x is larger (if the camera is on the +x side), its y is larger (+y side) and its z is larger
   (the camera is above), so the lexicographic order (x toward the camera, then y toward the camera, then z) is a linear extension of that product order, and two boxes that overlap on screen are never ordered the other way
   (a ray from the camera moves monotonically in x, y and z). Per column the intervals go bottom up.
   Faces: top, and the sides whose normal faces the camera (the same test as Box: `cam.nrm`), only where EXPOSED: a side is clipped against the intervals of the neighbour column, a top is hidden by an interval that starts on it.
   SECTION faces (what a cut or a removed quadrant opens) take their own colour: a face that is exposed only because the full volume had solid there. Interior only has none (it removes the shell, it does not cut it). */
(function (E) {
  /* material -> [top, right-facing side, left-facing side]: PROVISIONAL (the spike palette); this table is the hook of the later stylization pass */
  const PAL = { 1: [[132, 160, 104], [150, 138, 122], [118, 108, 96]], 2: [[74, 116, 92], [78, 104, 84], [58, 80, 64]], 3: [[216, 194, 148], [176, 156, 116], [146, 128, 92]], 4: [[238, 224, 188], [204, 190, 152], [172, 158, 124]], 5: [[204, 182, 134], [176, 156, 116], [146, 128, 92]] };
  const CUT = [[112, 100, 90], [92, 82, 74]], CUT_TOP = [128, 116, 104], OUT = 'rgba(24,20,34,0.6)', EPS = 1e-6;
  const KINDS = ['exterior', 'quad', 'interior', 'cut'];
  const has = (pack) => !!(pack && pack.volume && pack.macro && pack.volume.columns);
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  /* the columns in TILES (z * vScale), cached on the pack */
  function prep(pack) {
    if (pack._vol) return pack._vol;
    const V = pack.volume.vScale, W = pack.width, H = pack.height;
    const cols = pack.volume.columns.map((iv) => iv.map(([a, b, m]) => [a * V, b * V, m]));
    let top = 0; for (const iv of cols) if (iv.length) top = Math.max(top, iv[iv.length - 1][1]);
    return (pack._vol = { W, H, V, cols, top, floors: pack.macro.floors.map((f) => f.zTiles) });
  }
  /* a stand-in shape for the camera (makeCam needs W, H and the height range): the fit frames the WHOLE volume in every view kind, so switching the view never rescales */
  function camShape(vol) { return { W: vol.W, H: vol.H, ox: 0, oy: 0, levelH: [0, vol.top], maxFine: 1, baseH: 0, fitH: [0, vol.top + 1.5] }; }

  /* the columns of a view kind: `vis` (what is drawn) and `ref` (what the section test compares against) */
  function filtered(vol, pack, mv, view) {
    const { W, H, cols } = vol, kind = mv.kind;
    if (kind === 'exterior') return { vis: cols, ref: cols };
    if (kind === 'interior') { const vis = cols.map((iv) => iv.filter((x) => x[2] >= 3)); return { vis, ref: vis }; } // floors, ramp and ground: the shell and the serpent body are removed, not cut
    if (kind === 'cut') {
      const f = Math.max(1, Math.min(vol.floors.length, mv.floor || 1)), cz = vol.floors[f - 1] + 2; // everything above floor + 2 tiles is removed
      const vis = cols.map((iv) => iv.filter((x) => x[0] < cz - EPS).map((x) => (x[1] > cz + EPS ? [x[0], cz, x[2]] : x)));
      return { vis, ref: cols, cutZ: cz };
    }
    // quadrant removed: the 90-degree wedge of the plan, centred on the direction of the camera (it follows the yaw), is taken out of the whole height
    const yaw = view.yaw * Math.PI / 180, sy = Math.sin(yaw), cy = Math.cos(yaw), c = pack.macro.shaft.c, vis = cols.map((iv, i) => {
      const dx = i % W + 0.5 - c[0], dy = Math.floor(i / W) + 0.5 - c[1], d = dx * sy + dy * cy, l = Math.abs(dx * cy - dy * sy);
      return d > 1e-9 && d >= l - 1e-9 ? [] : iv;
    });
    return { vis, ref: cols };
  }
  /* the parts of [a, b] that no interval of `iv` covers */
  function uncovered(a, b, iv) {
    let segs = [[a, b]];
    for (const [c0, c1] of iv) { const out = []; for (const [s0, s1] of segs) { if (c1 <= s0 + EPS || c0 >= s1 - EPS) out.push([s0, s1]); else { if (c0 > s0 + EPS) out.push([s0, c0]); if (c1 < s1 - EPS) out.push([c1, s1]); } } segs = out; }
    return segs;
  }
  const covered = (a, b, iv) => { const un = uncovered(a, b, iv).sort((p, q) => p[0] - q[0]), parts = []; let cur = a; for (const [u0, u1] of un) { if (u0 > cur + EPS) parts.push([cur, u0]); cur = u1; } if (b > cur + EPS) parts.push([cur, b]); return parts; }; // the parts of [a, b] that `iv` does cover

  /* all the faces of a view, in painter order. view: { yaw, pitch, ... } (only the yaw decides the order and the visible sides) */
  function faces(pack, mv, view, o) {
    o = o || {}; const vol = prep(pack), { W, H } = vol, { vis, ref, cutZ } = filtered(vol, pack, mv, view);
    const yaw = view.yaw * Math.PI / 180, sy = Math.sin(yaw), cy = Math.cos(yaw);
    const nrm = (nx, ny) => [cy * nx - sy * ny, sy * nx + cy * ny]; // the same as makeCam's cam.nrm: [screen x, toward the camera]
    const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => nrm(dx, dy)[1] > 0.001);
    const xs = [...Array(W).keys()], ys = [...Array(H).keys()]; if (sy < 0) xs.reverse(); if (cy < 0) ys.reverse();
    const out = []; const st = { top: 0, side: 0, cutFaces: 0 };
    const colOf = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? [] : vis[y * W + x]), refOf = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? [] : ref[y * W + x]);
    for (const x of xs) for (const y of ys) {
      const iv = vis[y * W + x];
      for (let k = 0; k < iv.length; k++) {
        const [z0, z1, m] = iv[k], pal = PAL[m];
        for (const [dx, dy] of SIDES) { // the sides that face the camera, clipped against the neighbour column
          const nx = x + dx, ny = y + dy, nv = colOf(nx, ny), nr = refOf(nx, ny), right = nrm(dx, dy)[0] > 0.001;
          for (const [a, b] of uncovered(z0, z1, nv)) {
            const segs = []; let cur = a; // [a, b, isCut]: the parts the full volume covered are the SECTION
            for (const [c0, c1] of covered(a, b, nr)) { if (c0 > cur + EPS) segs.push([cur, c0, false]); segs.push([c0, c1, true]); cur = c1; }
            if (b > cur + EPS) segs.push([cur, b, false]);
            for (const [s0, s1, isCut] of segs) {
              const px = dx !== 0 ? x + (dx > 0 ? 1 : 0) : null, py = dy !== 0 ? y + (dy > 0 ? 1 : 0) : null;
              const pts = dx !== 0 ? [[px, y, s0], [px, y + 1, s0], [px, y + 1, s1], [px, y, s1]] : [[x, py, s0], [x + 1, py, s0], [x + 1, py, s1], [x, py, s1]];
              out.push({ pts, col: isCut ? CUT[right ? 0 : 1] : pal[right ? 1 : 2], mat: m, top: false, cut: isCut, x, y, z0: s0, z1: s1 }); st.side++; if (isCut) st.cutFaces++;
            }
          }
        }
        // the top: hidden by an interval that starts on it; a section when the full volume continued above
        const nxt = iv[k + 1]; if (nxt && nxt[0] <= z1 + EPS) continue;
        const r = ref[y * W + x], isCut = r.some(([r0, r1]) => r0 <= z1 + EPS && r1 > z1 + EPS) && (mv.kind !== 'interior');
        const edges = []; // outline: the sides of the top where the neighbour has no exposed top at the same height
        for (const [i, [dx, dy]] of [[0, [0, -1]], [1, [1, 0]], [2, [0, 1]], [3, [-1, 0]]]) {
          const nv = colOf(x + dx, y + dy), same = nv.some(([c0, c1], j) => Math.abs(c1 - z1) < EPS && !(nv[j + 1] && nv[j + 1][0] <= c1 + EPS));
          if (!same) edges.push(i);
        }
        out.push({ pts: [[x, y, z1], [x + 1, y, z1], [x + 1, y + 1, z1], [x, y + 1, z1]], col: isCut && (m === 1 || m === 2) ? CUT_TOP : pal[0], mat: m, top: true, cut: isCut, edges, x, y, z0: z1, z1 }); st.top++; if (isCut) st.cutFaces++;
      }
    }
    return { faces: out, stats: Object.assign(st, { cutZ }) };
  }

  const FIT_CACHE = new WeakMap();
  /* draw the view into a canvas (the same background, size and dpr handling as E.render) */
  function render(cv, pack, mv, view, o) {
    o = o || {};
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight, t0 = performance.now();
    if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a2540'); bg.addColorStop(1, '#171424'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const vol = prep(pack), cam = E.makeCam(camShape(vol), { terH: 1 }, view, w, h), F = faces(pack, mv, view, o);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const f of F.faces) {
      ctx.beginPath(); f.pts.forEach(([x, y, z], i) => { const p = cam.p(x, y, z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath();
      ctx.fillStyle = rgb(f.col); ctx.fill(); ctx.strokeStyle = rgb(f.col); ctx.lineWidth = 0.8; ctx.stroke();
      if (f.top && o.outlines !== false) for (const i of f.edges) { const a = cam.p(...f.pts[i]), b = cam.p(...f.pts[(i + 1) % 4]); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    }
    const marks = [];
    if (o.markers !== false) { const hd = pack.macro.head, p0 = pack.macro.ramp.path[0]; marks.push({ x: hd.x + 0.5, y: hd.y + 0.5, z: p0[2] * vol.V + 0.1, label: 'H (snake head: marker only)', col: [220, 60, 40] }); }
    for (const m of (E.volume.extraMarks || [])) marks.push(m);
    for (const m of marks) { const p = cam.p(m.x, m.y, m.z); ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 6.2832); ctx.fillStyle = rgb(m.col || [220, 60, 40]); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#000'; ctx.font = '11px sans-serif'; ctx.fillText(m.label, p[0] + 8, p[1] - 6); }
    return { polys: F.faces.length, walls: F.stats.side, verts: F.faces.length * 4, ms: performance.now() - t0, faces: F.faces.length, stats: F.stats, cam };
  }
  /* the fit scale (px per tile at zoom 1) of the whole volume, for the UI's shared camera */
  const fitScale = (pack, view, w, h) => E.fitScale(camShape(prep(pack)), { terH: 1 }, view, w, h);
  E.volume = { has, prep, faces, render, fitScale, camShape, KINDS, PAL, extraMarks: [], nearness: (view, x, y, z) => { const yaw = view.yaw * Math.PI / 180, p = view.pitch * Math.PI / 180, cx = x - 0, cyy = y - 0; return (Math.sin(yaw) * cx + Math.cos(yaw) * cyy) * Math.cos(p) + z * Math.sin(p); } };
})(window.EVO = window.EVO || {});
