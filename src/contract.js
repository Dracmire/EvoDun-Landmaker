/* ART CONTRACT (crystallizer 3, Stage; switch "Art contract", off by default = identical pixels; Box, A and B). Placeholders drawn on top of the scene, only where the piece is visible, with a count per kind.
   Vocabulary (user's): cap = the top surface; body = the mass with its base texture; wrapper = terminations and boundary (it frames the body where the cap would otherwise touch the background or a different material);
   footprint = where a structure is inserted. MVP pieces:
     body       one per terrace face of a tile (a tile above a lower neighbour of another terrace, or at the border of the map / void), classed by its jump in terH units (low < 1.2, mid < 2.2, high), "masonry"
                inside a landmark footprint, "edge" at the map border. No module length: per tile. A light tint, so the stones of the wrapper read.
     wrapper    FRAMING ONLY at silhouettes and material transitions, on the cap edge in ALL four directions (not only the camera-facing ones): a drop of 1.5 terH or more to a lower terrace, the border of the map / void,
                and the shore (the cap meets water). Nothing on smaller internal steps. A row of neutral dark framing stones (placeholder), slightly inside the cap edge: on the technique's own contour in A / B (a point that
                cannot be snapped within 0.75 tile keeps its tile-edge position), on the tile edges in Box. Only the visible stones are drawn.
     footprint  a SOFT DARKENING, no geometry change: a smooth radial shade (about 0.4 opacity at the centre, 0 at the radius `foot`) on the caps of the tiles of the landmark's OWN terrace only (4-connected from the
                landmark, never water, ramp or void), so it never crosses a cliff, a ramp or the sea; one clip path for the union of the tiles, so there are no tile seams.
     props      the pack's trees as billboards of a FIXED stylized height (2.2 terH, Hades style, not 1:1 with any data), each with the same soft shade, small, at its base; the landmarks (Shrine 3.2 terH, Pier 1.0 terH)
                on their solid; a prop between the camera and the STAKE that overlaps it on screen is drawn at 25 % opacity.
   VISIBILITY = the Box pick render (one per frame with the switch on): every column paints its walls with its tile code and its cap with the tile cap code; a piece is drawn only if >= half of its sample points
   hit its OWN code (a body face: its tile's wall code; stones, shade tiles, props: the cap code of the tile). The same id render serves the three techniques (A and B have no per-face id), so the placeholders of
   A and B sit on the tile geometry and differ slightly from the smoothed walls.
   Not in this MVP: stones stacked behind the rim, inner corners, doors, lights, floor dressing, a sculpted footprint, any export. */
(function (E) {
  const CLS = { low: [110, 170, 235], mid: [235, 190, 100], high: [235, 110, 110], masonry: [176, 160, 140], edge: [150, 130, 235] };
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W: neighbour offset = outward normal
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const TREE_SHADE_R = 0.75, TREE_H = 2.2, LAND_H = { shrine: 3.2, pier: 1.0 }; // stylized heights in terH units

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

  /* the cap edges that get a framing stone, in all four directions: a drop of 1.5 terH or more to a lower terrace ('drop'), the border of the map / void ('border'), the cap meets water ('shore') */
  const DROP_MIN = 1.5;
  function frames(S, P) {
    if (S.cache.contractFrames) return S.cache.contractFrames;
    const W = S.W, H = S.H, out = [];
    const isWater = (i) => !!(S.water && S.water[i]) || !!(S.levelMeta[S.fine[i]] && S.levelMeta[S.fine[i]].water);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if ((S.void && S.void[i]) || isWater(i)) continue;
      const hi = S.levelH[S.fine[i]];
      for (let d = 0; d < 4; d++) {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
        let kind = null, j = -1;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) { if (nx + S.ox < 0 || ny + S.oy < 0 || nx + S.ox >= S.mapW || ny + S.oy >= S.mapH) kind = 'border'; else continue; }
        else {
          j = ny * W + nx;
          if (S.void && S.void[j]) kind = 'border';
          else if (isWater(j)) kind = 'shore';
          else { const lo = S.levelH[S.fine[j]]; if (S.ter[j] !== S.ter[i] && lo < hi - 1e-9 && (hi - lo) / P.terH >= DROP_MIN - 1e-9) kind = 'drop'; }
        }
        if (!kind || (S.carved && (S.carved[i] || (j >= 0 && S.carved[j])))) continue; // a ramp draws and owns its own edges
        out.push({ i, j, d, e: faceEnds(x, y, d), ht: hi, L: S.fine[i], kind });
      }
    }
    return (S.cache.contractFrames = out);
  }

  /* the tiles a soft shade covers: those of the OWN terrace of (cx, cy), 4-connected from it, tile centre within r + 0.5, never water, ramp or void (a seed on water moves to the nearest dry tile within r) */
  function shadeTiles(S, cx, cy, r) {
    const W = S.W, H = S.H, isWater = (i) => !!(S.water && S.water[i]) || !!(S.levelMeta[S.fine[i]] && S.levelMeta[S.fine[i]].water);
    const ok = (i) => !(S.void && S.void[i]) && !isWater(i) && !(S.carved && S.carved[i]);
    const tx = Math.floor(cx), ty = Math.floor(cy); if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    let seed = ty * W + tx;
    if (!ok(seed)) { let bd = Infinity, bi = -1; for (let y = Math.max(0, ty - Math.ceil(r)); y <= Math.min(H - 1, ty + Math.ceil(r)); y++) for (let x = Math.max(0, tx - Math.ceil(r)); x <= Math.min(W - 1, tx + Math.ceil(r)); x++) { const i = y * W + x, d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (ok(i) && d < bd) { bd = d; bi = i; } } if (bi < 0 || bd > r) return null; seed = bi; }
    const ter = S.ter[seed], seen = new Set([seed]), q = [seed], tiles = [];
    while (q.length) {
      const i = q.pop(), x = i % W, y = (i / W) | 0; tiles.push(i);
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (seen.has(j) || S.ter[j] !== ter || !ok(j) || Math.hypot(nx + 0.5 - cx, ny + 0.5 - cy) > r + 0.5) continue; seen.add(j); q.push(j); }
    }
    return tiles;
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

  E.contract = {
    faces, frames, shadeTiles, TREE_H, LAND_H,
    /* classify a jump in terH units (exposed for the tests) */
    classOf: (jump) => (jump < 1.2 ? 'low' : jump < 2.2 ? 'mid' : 'high'),
    /* draw; returns the counts. buf = the Box pick image { data, w, h } (null in tests that only count) */
    draw(ctx, cam, S, P, tech, view, o, w, h) {
      const buf = E.pickBuffer(S, P, view, w, h), D = buf.data;
      const code = (px, py) => { const x = Math.round(px), y = Math.round(py); if (x < 0 || y < 0 || x >= w || y >= h) return -1; const q = (y * w + x) * 4; return D[q + 3] === 255 ? (D[q] << 16) | (D[q + 1] << 8) | D[q + 2] : -1; };
      const wallCode = (i) => (2 << 20) | i;
      const ownGround = (p, i) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = code(p[0] + dx, p[1] + dy); if (k === ((4 << 20) | i) || k === ((3 << 20) | i)) return true; } return false; }; // a cap (kind 4) or a ramp (kind 3) of tile i at the point or one pixel around it (edge pixels are blends)
      const cnt = { body: { low: 0, mid: 0, high: 0, masonry: 0, edge: 0 }, wrapper: { drop: 0, border: 0, shore: 0 }, footprint: 0, trees: 0, landmarks: 0, faded: 0 };
      const fs = faces(S, P), snap = tech === 'box' ? null : snapper(S, P, tech);
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // BODY: visible = facing the camera and half of the sample points hit the tile's own wall code; a LIGHT tint so the stones of the wrapper read
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
        ctx.fillStyle = rgba(CLS[f.cls], 0.2); ctx.fill(); ctx.strokeStyle = rgba(CLS[f.cls], 0.6); ctx.lineWidth = 1; ctx.stroke();
      }
      const groundAt = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= S.W || ty >= S.H) return null; const i = ty * S.W + tx; return { i, h: S.levelH[S.fine[i]] }; };
      // SHADES (footprints and tree bases): a soft radial darkening on the caps of the own terrace; ONE clip path for the union of the visible tiles (no seams), the gradient in the affine frame of the ground circle
      const shade = (cx, cy, r, alpha, tiles) => {
        if (!tiles || !tiles.length) return false;
        const g0 = groundAt(cx, cy), h0 = g0 ? g0.h : S.levelH[S.fine[tiles[0]]];
        ctx.beginPath(); let nt = 0;
        for (const i of tiles) {
          const x = i % S.W, y = (i / S.W) | 0, h = S.levelH[S.fine[i]]; let hit = 0;
          for (const [u, v] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) { const p = cam.p(x + u, y + v, h); if (ownGround(p, i)) hit++; }
          if (hit < 3) continue;
          const q = [cam.p(x, y, h), cam.p(x + 1, y, h), cam.p(x + 1, y + 1, h), cam.p(x, y + 1, h)];
          ctx.moveTo(q[0][0], q[0][1]); for (let k = 1; k < 4; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.closePath(); nt++;
        }
        if (!nt) return false;
        const o0 = cam.p(cx, cy, h0), ex = cam.p(cx + r, cy, h0), ey = cam.p(cx, cy + r, h0);
        ctx.save(); ctx.clip('nonzero'); ctx.transform(ex[0] - o0[0], ex[1] - o0[1], ey[0] - o0[0], ey[1] - o0[1], o0[0], o0[1]);
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        for (const [t, k] of [[0, 1], [0.3, 0.8], [0.6, 0.38], [0.85, 0.1], [1, 0]]) gr.addColorStop(t, `rgba(12,10,24,${(alpha * k).toFixed(3)})`);
        ctx.fillStyle = gr; ctx.fillRect(-1.05, -1.05, 2.1, 2.1); ctx.restore();
        return true;
      };
      if (!S.cache.contractShades) S.cache.contractShades = {
        lands: footOf(S).map((f) => ({ x: f.x, y: f.y, r: f.foot, tiles: shadeTiles(S, f.x, f.y, f.foot) })),
        trees: (S.trees || []).map((t) => ({ x: t[0] - S.ox, y: t[1] - S.oy, r: TREE_SHADE_R, tiles: shadeTiles(S, t[0] - S.ox, t[1] - S.oy, TREE_SHADE_R) }))
      };
      for (const l of S.cache.contractShades.lands) if (shade(l.x, l.y, l.r, 0.4, l.tiles)) cnt.footprint++;
      for (const t of S.cache.contractShades.trees) shade(t.x, t.y, t.r, 0.4, t.tiles);
      // WRAPPER: a row of neutral dark framing stones on the cap edge (slightly inside), on the technique's contour (A / B) or the tile edges (Box); visible stones only
      const STONE_HL = 0.2, STONE_HD = 0.12, STONE_Z = 0.16, IN = 0.2;
      const stone = (cx, cy, ux, uy, nx, ny, z0) => { // a small block at (cx, cy): half-length STONE_HL along (ux, uy), half-depth STONE_HD along (nx, ny)
        const c4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + ux * STONE_HL * a + nx * STONE_HD * b, cy + uy * STONE_HL * a + ny * STONE_HD * b]);
        const sides = [0, 1, 2, 3].map((k) => ({ k, ry: cam.ry((c4[k][0] + c4[(k + 1) % 4][0]) / 2, (c4[k][1] + c4[(k + 1) % 4][1]) / 2) })).sort((p, q) => q.ry - p.ry);
        for (const { k } of sides) { const a = c4[k], b = c4[(k + 1) % 4], q = [cam.p(a[0], a[1], z0 + STONE_Z), cam.p(b[0], b[1], z0 + STONE_Z), cam.p(b[0], b[1], z0), cam.p(a[0], a[1], z0)]; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let m = 1; m < 4; m++) ctx.lineTo(q[m][0], q[m][1]); ctx.closePath(); ctx.fillStyle = '#25212e'; ctx.fill(); }
        const t = c4.map((c) => cam.p(c[0], c[1], z0 + STONE_Z)); ctx.beginPath(); ctx.moveTo(t[0][0], t[0][1]); for (let m = 1; m < 4; m++) ctx.lineTo(t[m][0], t[m][1]); ctx.closePath(); ctx.fillStyle = '#4b4658'; ctx.fill(); ctx.strokeStyle = 'rgba(14,12,20,0.9)'; ctx.lineWidth = 0.8; ctx.stroke();
      };
      for (const f of frames(S, P)) {
        const nx = -DIRS[f.d][0], ny = -DIRS[f.d][1], len = Math.hypot(f.e[2] - f.e[0], f.e[3] - f.e[1]) || 1, ux = (f.e[2] - f.e[0]) / len, uy = (f.e[3] - f.e[1]) / len; // (nx, ny) points into the tile
        for (const t of [0.25, 0.75]) {
          let x = f.e[0] + (f.e[2] - f.e[0]) * t, y = f.e[1] + (f.e[3] - f.e[1]) * t; const sp = snap && snap(f.L, x, y); if (sp) { x = sp[0]; y = sp[1]; }
          x += nx * IN; y += ny * IN;
          const p = cam.p(x, y, f.ht); let seen = false;
          for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = code(p[0] + dx, p[1] + dy); if (k >> 20 === 4 && S.fine[k & 0xfffff] === f.L) { seen = true; break; } } // the cap of a tile of the same level
          if (!seen) continue;
          stone(x, y, ux, uy, nx, ny, f.ht); cnt.wrapper[f.kind]++;
        }
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
