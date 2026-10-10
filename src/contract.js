/* ART CONTRACT (crystallizer 3, Stage; switch "Art contract", off by default = identical pixels; Box, A and B). Placeholders drawn on top of the scene, only where the piece is visible, with a count per kind.
   Vocabulary (user's): cap = the top surface; body = the mass with its base texture; wrapper = terminations and boundary (it frames the body and keeps it from spilling); footprint = where a structure is inserted
   (same contour, a little bigger, slightly sunken). MVP pieces:
     body       one per terrace face of a tile (a tile above a lower neighbour of another terrace, or at the border of the map / void), classed by its jump in terH units (low < 1.2, mid < 2.2, high), "masonry"
                inside a landmark footprint, "edge" at the map border. No module length: per tile.
     wrapper    CONTINUOUS strips along the chains of terrace faces, cut only at corners and material changes: top rim (colour by cap material), base contact (dark, white where the lower side is water) and
                outer-corner terminations. Box = tile edges; A / B = the vertices snapped to the technique's own loops (a vertex that cannot be snapped within 0.75 tile keeps its tile-edge position).
     footprint  the outline of each landmark footprint of the pack (radius foot).
     props      the pack's trees as billboards of a FIXED stylized height (2.2 terH, Hades style, not 1:1 with any data) and the landmarks (Shrine 3.2 terH, Pier 1.0 terH) on their solid; a prop between the
                camera and the STAKE that overlaps it on screen is drawn at 25 % opacity.
   VISIBILITY = the Box pick render (one per frame with the switch on): every column paints its walls with its tile code and its cap with the tile cap code; a piece is drawn only if >= half of its sample points
   hit its OWN code (a body face: its tile's wall code; props, footprint: the cap code of the tile under the point). The same id render serves the three techniques (A and B have no per-face id), so the placeholders of
   A and B sit on the tile geometry and differ slightly from the smoothed walls.
   Not in this MVP: stones stacked behind the rim, inner corners, doors, lights, floor dressing, any export. */
(function (E) {
  const CLS = { low: [110, 170, 235], mid: [235, 190, 100], high: [235, 110, 110], masonry: [176, 160, 140], edge: [150, 130, 235] };
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W: neighbour offset = outward normal
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const TREE_H = 2.2, LAND_H = { shrine: 3.2, pier: 1.0 }; // stylized heights in terH units

  /* the face of tile (x, y) toward direction d, clockwise around the upper tile: [x0, y0, x1, y1] */
  const faceEnds = (x, y, d) => (d === 0 ? [x, y, x + 1, y] : d === 1 ? [x + 1, y, x + 1, y + 1] : d === 2 ? [x + 1, y + 1, x, y + 1] : [x, y + 1, x, y]);

  function footOf(S) { // landmark footprints in WINDOW tile coordinates
    const L = S.landmarks; if (!L) return [];
    return Object.entries(L).map(([name, b]) => ({ name, x: b.c[0] - S.ox, y: b.c[1] - S.oy, solid: b.solid, foot: b.foot, rej: b.rej, infl: b.infl }));
  }
  const inFoot = (fp, x, y) => fp.some((f) => Math.hypot(x - f.x, y - f.y) <= f.foot);

  /* the terrace faces of the window, once per shape */
  function faces(S, P) {
    if (S.cache.contractFaces) return S.cache.contractFaces;
    const W = S.W, H = S.H, fp = footOf(S), base = S.baseH !== undefined ? S.baseH : S.levelH[0] - P.terH, out = [];
    const isWater = (i) => !!(S.water && S.water[i]) || !!(S.levelMeta[S.fine[i]] && S.levelMeta[S.fine[i]].water);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (S.void && S.void[i]) continue;
      const hi = S.levelH[S.fine[i]];
      for (let d = 0; d < 4; d++) {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
        let j = -1, lo, edge = false;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) { if (nx + S.ox < 0 || ny + S.oy < 0 || nx + S.ox >= S.mapW || ny + S.oy >= S.mapH) { edge = true; lo = base; } else continue; }
        else { j = ny * W + nx; if (S.void && S.void[j]) { edge = true; lo = base; } else { lo = S.levelH[S.fine[j]]; if (S.ter[j] === S.ter[i] || lo >= hi - 1e-9) continue; } }
        if (S.carved && (S.carved[i] || (j >= 0 && S.carved[j]))) continue; // a ramp draws and owns its own walls
        const e = faceEnds(x, y, d), mx = (e[0] + e[2]) / 2, my = (e[1] + e[3]) / 2, jump = (hi - lo) / P.terH;
        const cls = edge ? 'edge' : inFoot(fp, mx, my) ? 'masonry' : jump < 1.2 ? 'low' : jump < 2.2 ? 'mid' : 'high';
        out.push({ i, j, d, e, mx, my, hb: lo, ht: hi, jump, cls, edge, upperWater: isWater(i), lowerWater: j >= 0 && isWater(j), mat: isWater(i) ? 'water' : inFoot(fp, mx, my) ? 'masonry' : 'ground', L: S.fine[i] });
      }
    }
    return (S.cache.contractFaces = out);
  }

  /* chains of terrace faces (edge faces excluded): follow the clockwise ends, cut at corners (the direction changes) and material changes */
  function strips(S, P) {
    if (S.cache.contractStrips) return S.cache.contractStrips;
    const fs = faces(S, P).filter((f) => !f.edge), byStart = new Map();
    for (const f of fs) { const k = f.e[0] * 4096 + f.e[1]; (byStart.get(k) || byStart.set(k, []).get(k)).push(f); }
    const used = new Set(), res = [];
    const next = (f) => (byStart.get(f.e[2] * 4096 + f.e[3]) || []).find((g) => !used.has(g) && g.d === f.d) || (byStart.get(f.e[2] * 4096 + f.e[3]) || []).find((g) => !used.has(g)); // straight on first, then a turn
    const ends = new Set(fs.map((f) => f.e[2] * 4096 + f.e[3])), heads = fs.filter((f) => !ends.has(f.e[0] * 4096 + f.e[1])); // chain heads first (nothing ends where they start), then closed loops
    for (const f0 of heads.concat(fs)) {
      if (used.has(f0)) continue;
      let run = [f0]; used.add(f0);
      for (let f = f0, g; (g = next(f)); f = g) {
        used.add(g);
        if (g.d !== f.d || g.mat !== f.mat) { res.push({ faces: run, corner: g.d !== f.d && ((g.d - f.d + 4) % 4 === 1) }); run = [g]; } else run.push(g);
      }
      res.push({ faces: run, corner: false });
    }
    return (S.cache.contractStrips = res);
  }

  /* nearest point on the loops of level L (a grid of segments, once per technique and level) */
  function snapper(S, P, tech) {
    const cache = S.cache['contractSnap_' + tech] || (S.cache['contractSnap_' + tech] = new Map()), fn = tech === 'A' ? E.loopsA : E.loopsB;
    return (L, x, y) => {
      let g = cache.get(L);
      if (!g) {
        g = new Map(); const add = (cx, cy, s) => { const k = cx * 8192 + cy; (g.get(k) || g.set(k, []).get(k)).push(s); };
        for (const loop of fn(S, L, P)) for (let k = 0; k < loop.length; k++) {
          const a = loop[k], b = loop[(k + 1) % loop.length], s = [a[0], a[1], b[0], b[1]];
          const x0 = Math.floor(Math.min(a[0], b[0])), x1 = Math.floor(Math.max(a[0], b[0])), y0 = Math.floor(Math.min(a[1], b[1])), y1 = Math.floor(Math.max(a[1], b[1]));
          for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) add(cx, cy, s);
        }
        cache.set(L, g);
      }
      let best = null, bd = Infinity; const cx = Math.floor(x), cy = Math.floor(y);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const s of g.get((cx + dx) * 8192 + (cy + dy)) || []) {
        const vx = s[2] - s[0], vy = s[3] - s[1], l2 = vx * vx + vy * vy || 1e-12, t = Math.max(0, Math.min(1, ((x - s[0]) * vx + (y - s[1]) * vy) / l2)), px = s[0] + vx * t, py = s[1] + vy * t, d = Math.hypot(px - x, py - y);
        if (d < bd) { bd = d; best = [px, py]; }
      }
      return best && bd <= 0.75 ? best : null; // too far: keep the tile-edge vertex (corners that would get messy)
    };
  }

  function capMaterialColor(S, P, f) {
    if (f.mat === 'water') return [90, 170, 235];
    if (f.mat === 'masonry') return [196, 182, 160];
    const c = E.levelColor(S, f.L, P); return [Math.min(255, c[0] * 1.25 + 20), Math.min(255, c[1] * 1.25 + 20), Math.min(255, c[2] * 1.25 + 20)];
  }

  E.contract = {
    faces, strips, TREE_H, LAND_H,
    /* classify a jump in terH units (exposed for the tests) */
    classOf: (jump) => (jump < 1.2 ? 'low' : jump < 2.2 ? 'mid' : 'high'),
    /* draw; returns the counts. buf = the Box pick image { data, w, h } (null in tests that only count) */
    draw(ctx, cam, S, P, tech, view, o, w, h) {
      const buf = E.pickBuffer(S, P, view, w, h), D = buf.data;
      const code = (px, py) => { const x = Math.round(px), y = Math.round(py); if (x < 0 || y < 0 || x >= w || y >= h) return -1; const q = (y * w + x) * 4; return D[q + 3] === 255 ? (D[q] << 16) | (D[q + 1] << 8) | D[q + 2] : -1; };
      const wallCode = (i) => (2 << 20) | i;
      const ownGround = (p, i) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = code(p[0] + dx, p[1] + dy); if (k === ((4 << 20) | i) || k === ((3 << 20) | i)) return true; } return false; }; // a cap (kind 4) or a ramp (kind 3) of tile i at the point or one pixel around it (edge pixels are blends)
      const cnt = { body: { low: 0, mid: 0, high: 0, masonry: 0, edge: 0 }, rim: 0, base: 0, corner: 0, footprint: 0, trees: 0, landmarks: 0, faded: 0 };
      const fs = faces(S, P), snap = tech === 'box' ? null : snapper(S, P, tech);
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // BODY: visible = facing the camera and half of the sample points hit the tile's own wall code
      for (const f of fs) {
        const nx = DIRS[f.d][0], ny = DIRS[f.d][1];
        f.vis = false;
        if (cam.nrm(nx, ny, f.mx, f.my)[1] <= 0.001) continue;
        let hit = 0; const hm = (f.hb + f.ht) / 2;
        for (const t of [0.25, 0.5, 0.75]) { const p = cam.p(f.e[0] + (f.e[2] - f.e[0]) * t, f.e[1] + (f.e[3] - f.e[1]) * t, hm); if (code(p[0], p[1]) === wallCode(f.i)) hit++; }
        if (hit < 2) continue;
        f.vis = true; cnt.body[f.cls]++;
        const p0 = cam.p(f.e[0], f.e[1], f.ht), p1 = cam.p(f.e[2], f.e[3], f.ht), p2 = cam.p(f.e[2], f.e[3], f.hb), p3 = cam.p(f.e[0], f.e[1], f.hb);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
        ctx.fillStyle = rgba(CLS[f.cls], 0.42); ctx.fill(); ctx.strokeStyle = rgba(CLS[f.cls], 0.95); ctx.lineWidth = 1; ctx.stroke();
      }
      // WRAPPER: strips over the visible members, on the technique's contour (A / B) or the tile edges (Box)
      const vtx = (f, t) => { // vertex of face f at t (0 / 1) as [x, y] (snapped on A / B)
        const x = f.e[0] + (f.e[2] - f.e[0]) * t, y = f.e[1] + (f.e[3] - f.e[1]) * t, s = snap && snap(f.L, x, y); return s || [x, y];
      };
      for (const st of strips(S, P)) {
        let run = [];
        const flush = () => {
          if (run.length) {
            const f0 = run[0], pts = []; for (const f of run) { if (!pts.length) pts.push([...vtx(f, 0), f.ht, f.hb]); pts.push([...vtx(f, 1), f.ht, f.hb]); }
            const col = capMaterialColor(S, P, f0), line = (hk, c, wpx, dark) => {
              ctx.beginPath(); pts.forEach((q, k) => { const p = cam.p(q[0], q[1], q[hk]); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
              ctx.strokeStyle = 'rgba(24,20,34,0.85)'; ctx.lineWidth = wpx + 2; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = wpx; ctx.stroke(); void dark;
            };
            line(2, rgba(col, 0.95), 2.5); cnt.rim++;
            line(3, f0.lowerWater ? 'rgba(255,255,255,0.95)' : 'rgba(40,30,46,0.95)', 2.5); cnt.base++;
          }
          run = [];
        };
        for (const f of st.faces) { if (f.vis) run.push(f); else flush(); }
        flush();
        if (st.corner && st.faces[st.faces.length - 1].vis) { // outer-corner termination: a short post where the strip ends in a convex turn
          const f = st.faces[st.faces.length - 1], v = vtx(f, 1), a = cam.p(v[0], v[1], f.ht), b = cam.p(v[0], v[1], f.ht + 0.45 * P.terH);
          ctx.strokeStyle = 'rgba(24,20,34,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.strokeStyle = '#f4efe4'; ctx.lineWidth = 3; ctx.stroke(); cnt.corner++;
        }
      }
      // FOOTPRINT: the outline of each landmark footprint, on the ground, visible where its sample points hit caps
      const groundAt = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= S.W || ty >= S.H) return null; const i = ty * S.W + tx; return { i, h: S.levelH[S.fine[i]] }; };
      for (const f of footOf(S)) {
        const pts = []; let hit = 0;
        for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, x = f.x + Math.cos(a) * f.foot, y = f.y + Math.sin(a) * f.foot, g = groundAt(x, y); if (!g) { pts.push(null); continue; } const p = cam.p(x, y, g.h + 0.03); pts.push(p); if (ownGround(p, g.i)) hit++; }
        if (hit < 12) continue;
        ctx.beginPath(); let pen = false; pts.concat(pts.slice(0, 1)).forEach((p) => { if (!p) { pen = false; return; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; });
        ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(24,20,34,0.9)'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); cnt.footprint++;
      }
      // PROPS: billboards of a fixed stylized height; faded where they stand between the camera and the stake and cover it on screen
      const stake = o.incursion && o.incursion.stake != null ? o.incursion.stake : null; let stakeRect = null, stakeKey = 0;
      if (stake !== null) { const sx = stake % S.W + 0.5, sy = (stake / S.W | 0) + 0.5, sh = S.levelH[S.fine[stake]], b = cam.p(sx, sy, sh), t = cam.p(sx, sy, sh + 1.3); stakeRect = [b[0] - 10, Math.min(t[1], b[1]) - 10, b[0] + 20, Math.max(t[1], b[1]) + 2]; stakeKey = cam.ry(sx, sy); }
      const props = [];
      for (const t of S.trees || []) { const x = t[0] - S.ox, y = t[1] - S.oy; props.push({ x, y, h: TREE_H, kind: 'tree', wTile: 0.9 }); }
      for (const [name, b] of Object.entries(S.landmarks || {})) props.push({ x: b.c[0] - S.ox, y: b.c[1] - S.oy, h: LAND_H[name] || 1, kind: name, wTile: Math.max(1.2, b.solid * 2) });
      props.sort((p, q) => cam.ry(p.x, p.y) - cam.ry(q.x, q.y));
      for (const pr of props) {
        const g = groundAt(pr.x, pr.y); if (!g) continue;
        const b = cam.p(pr.x, pr.y, g.h), t = cam.p(pr.x, pr.y, g.h + pr.h * P.terH);
        let seen = ownGround(b, g.i); // the base point (a landmark centre may sit on a tile corner: its neighbours count too)
        if (!seen && pr.kind !== 'tree') for (const [ox, oy] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) { const g2 = groundAt(pr.x + ox, pr.y + oy); if (g2) { const q = cam.p(pr.x + ox, pr.y + oy, g2.h); if (ownGround(q, g2.i)) { seen = true; break; } } }
        if (!seen) continue;
        const dd = (ax, ay, bx, by) => { const p = cam.p(ax, ay, g.h), q = cam.p(bx, by, g.h); return Math.hypot(p[0] - q[0], p[1] - q[1]); };
        const wp = pr.wTile * Math.max(dd(pr.x + 0.5, pr.y, pr.x - 0.5, pr.y), dd(pr.x, pr.y + 0.5, pr.x, pr.y - 0.5)), hpx = Math.abs(b[1] - t[1]);
        const rect = [b[0] - wp / 2, Math.min(b[1], t[1]), b[0] + wp / 2, Math.max(b[1], t[1])];
        const faded = stakeRect && cam.ry(pr.x, pr.y) > stakeKey && rect[0] < stakeRect[2] && rect[2] > stakeRect[0] && rect[1] < stakeRect[3] && rect[3] > stakeRect[1];
        ctx.save(); ctx.globalAlpha = faded ? 0.25 : 1;
        if (pr.kind === 'tree') { ctx.fillStyle = '#5b3f2a'; ctx.fillRect(b[0] - wp * 0.08, b[1] - hpx * 0.4, wp * 0.16, hpx * 0.4); ctx.beginPath(); ctx.ellipse(b[0], b[1] - hpx * 0.68, wp * 0.5, hpx * 0.34, 0, 0, 7); ctx.fillStyle = '#2f7d3a'; ctx.fill(); ctx.strokeStyle = 'rgba(24,20,34,0.9)'; ctx.lineWidth = 1.2; ctx.stroke(); cnt.trees++; }
        else { ctx.fillStyle = pr.kind === 'shrine' ? '#e8dcc4' : '#b88a5a'; ctx.fillRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]); ctx.strokeStyle = 'rgba(24,20,34,0.95)'; ctx.lineWidth = 1.6; ctx.strokeRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]); ctx.fillStyle = '#1a1624'; ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(pr.kind === 'shrine' ? 'S' : 'P', b[0], (rect[1] + rect[3]) / 2 + 4); cnt.landmarks++; }
        ctx.restore(); if (faded) cnt.faded++;
      }
      ctx.restore();
      return cnt;
    }
  };
})(window.EVO = window.EVO || {});
