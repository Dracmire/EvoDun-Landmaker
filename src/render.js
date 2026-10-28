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
    if (m.water) return [52, 142, 222]; // pocket water: a level of its own with its own colour
    if (m.pk !== undefined) { const t = m.pk, A = t < 0.5 ? [[52, 78, 96], [186, 150, 104]] : [[186, 150, 104], [176, 92, 68]], u = t < 0.5 ? t * 2 : (t - 0.5) * 2; return [0, 1, 2].map((q) => A[0][q] + (A[1][q] - A[0][q]) * u); } // Diorama pocket (D31): a palette by height, slate -> sand -> terracotta
    if (m.anchor) return [140, 142, 150]; // anchors (D26): a non-walkable tile raised, a lighter neutral grey than the flat ground
    if (m.grey) return [118, 120, 126]; // chain view (D23): the ground outside the chain rooms, flattened, a neutral grey (no type tint)
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

  /* CAMERA BANK (Cam 1-7, `view.kind`): 'ortho' (Cam 1-5: yaw / pitch, the original code path, unchanged), 'oblique' (Cam 7 Classic 3/4: ground scale 1 and height scale 1 independent of any pitch, yaw 0;
     the same affine code with sp = cp = 1) and 'persp' (Cam 6 Stage, makePersp). Every camera offers p / unp / ry / nrm / sc / fit / base; nrm takes the face position as optional extra arguments (only the
     perspective camera uses them: the facing of a face depends on where it is). */
  function makeCam(S, P, view, w, h) {
    if (view.kind === 'persp') return makePersp(S, P, view, w, h);
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), sp = view.kind === 'oblique' ? 1 : Math.sin(pit), cp = view.kind === 'oblique' ? 1 : Math.cos(pit);
    const base = S.baseH !== undefined ? S.baseH : S.levelH[0] - P.terH, top = S.levelH[S.maxFine]; // S.baseH: a pocket over the void has a deep base of its own
    const raw = (x, y, hh) => {
      const X = x - S.W / 2, Y = y - S.H / 2;
      return [cy * X - sy * Y, (sy * X + cy * Y) * sp - hh * cp];
    };
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const fb = S.sliceBox ? [S.sliceBox.x0 - 2, S.sliceBox.y0 - 2, S.sliceBox.x1 + 2, S.sliceBox.y1 + 2] : [0, 0, S.W, S.H]; // fit the slice, scenery spills past
    for (const [x, y] of [[fb[0], fb[1]], [fb[2], fb[1]], [fb[0], fb[3]], [fb[2], fb[3]]]) for (const hh of S.fitH || [base, top + 1.5]) { // S.fitH: a pocket frames the fragment's heights only
      const [a, b] = raw(x, y, hh); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    }
    const fit = Math.min((w - 20) / (x1 - x0), (h - 20) / (y1 - y0)), sc = (view.fitSc || fit) * view.zoom; // view.fitSc: the scale of the first panel, shared by all panels
    const ox = w / 2 - (x0 + x1) / 2 * sc + view.panX, oy = h / 2 - (y0 + y1) / 2 * sc + view.panY;
    return {
      sc, base, fit, aff: { sc, ox, oy, cy, sy, sp, cp, W2: S.W / 2, H2: S.H / 2, w, h }, // aff: the affine map of the camera (screen = sc * raw + (ox, oy)), read by the viewport culling (PR E1a); the perspective camera has none
      p: (x, y, hh) => { const [a, b] = raw(x, y, hh); return [a * sc + ox, b * sc + oy]; },
      panFor: (x, y, hh) => { const [a, b] = raw(x, y, hh); return [w / 2 - (a * sc + ox - view.panX), h / 2 - (b * sc + oy - view.panY)]; }, // the pan (px) that brings the point to the screen centre
      unp: (px, py, hh) => { const a = (px - ox) / sc, b = (py - oy) / sc + hh * cp, c = b / sp; return [cy * a + sy * c + S.W / 2, -sy * a + cy * c + S.H / 2]; }, // screen point -> ground point on the plane at height hh
      ry: (x, y) => sy * (x - S.W / 2) + cy * (y - S.H / 2),
      nrm: (nx, ny) => [cy * nx - sy * ny, sy * nx + cy * ny]
    };
  }

  /* Cam 6 Stage: PERSPECTIVE with true division by depth. View space around a pivot P0 (the centre of the fit box on the ground, at the focus height hF = middle of the fit heights):
     a = screen right, v = u*sp - hp*cp (screen down), n = u*cp + hp*sp (toward the camera), the camera at n = D on the view axis; z = D - n; screen = (a, v) * (D / z) * sc, so the scale at the pivot is sc.
     FOV 30: the DOLLY follows the zoom: sc * D = f = (panel height / 2) / tan(FOV / 2), i.e. D = (visible height in tiles / 2) / tan(FOV / 2) with visible height = panel height / sc, computed from the FIRST panel
     (view.persH, like view.fitSc) so every compare panel has the same camera; the perspective strength on screen is the same at any zoom. PAN moves the camera over the ground (see the end of makePersp). */
  const PERSP_FOV = 30 * Math.PI / 180;
  function makePersp(S, P, view, w, h) {
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const base = S.baseH !== undefined ? S.baseH : S.levelH[0] - P.terH, top = S.levelH[S.maxFine];
    const fb = S.sliceBox ? [S.sliceBox.x0 - 2, S.sliceBox.y0 - 2, S.sliceBox.x1 + 2, S.sliceBox.y1 + 2] : [0, 0, S.W, S.H], hs = S.fitH || [base, top + 1.5];
    const hF = (Math.min(...hs) + Math.max(...hs)) / 2, tanH = Math.tan(PERSP_FOV / 2);
    const relTo = (X0, Y0) => (x, y, hh) => { const X = x - X0, Y = y - Y0, hp = hh - hF, u = sy * X + cy * Y; return [cy * X - sy * Y, u * sp - hp * cp, u * cp + hp * sp]; }; // [a, v, n] around the pivot
    const cornersAt = (X0, Y0) => { const rel = relTo(X0, Y0), c = []; for (const [x, y] of [[fb[0], fb[1]], [fb[2], fb[1]], [fb[0], fb[3]], [fb[2], fb[3]]]) for (const hh of hs) c.push(rel(x, y, hh)); return c; };
    const extentOf = (corners, D) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [a, v, n] of corners) { const k = D / Math.max(D - n, 0.05 * D), px = a * k, py = v * k; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); } return [x0, x1, y0, y1]; };
    const f = ((view.persH || h) / 2) / tanH, avail = [w - 20, h - 20], sc1 = view.fitSc || 0;
    // THE PIVOT is the ground point under the screen centre (at the focus height hF, the middle of the fit heights): at zoom 1 it is chosen so that the box is centred. Alternate between the
    // fit scale (when no shared one is given), D = f / sc and the pivot until they agree (a few passes). With a shared fit scale (compare panels) every panel gets the same pivot.
    let X0 = (fb[0] + fb[2]) / 2, Y0 = (fb[1] + fb[3]) / 2, sc0 = 0;
    { const e = extentOf(cornersAt(X0, Y0), 1e9); sc0 = Math.min(avail[0] / (e[1] - e[0]), avail[1] / (e[3] - e[2])); }
    for (let it = 0; it < 14; it++) {
      const corners = cornersAt(X0, Y0), dMin = Math.max(...corners.map((c) => c[2])) + 1, D = Math.max(f / (sc1 || sc0), dMin), e = extentOf(corners, D);
      const ecx = (e[0] + e[1]) / 2, ecy = (e[2] + e[3]) / 2, hp = 0, u1 = (ecy * D) / (D * sp + ecy * cp), n1 = u1 * cp, a1 = ecx * (D - n1) / D; // the ground point (on the plane hF) that the centre of the box has on screen, relative to the pivot
      X0 += cy * a1 + sy * u1; Y0 += -sy * a1 + cy * u1;
      if (!sc1) sc0 = Math.min(avail[0] / (e[1] - e[0]), avail[1] / (e[3] - e[2]));
      if (Math.abs(a1) + Math.abs(u1) < 1e-9) break;
    }
    const fit = sc0, sc = (sc1 || sc0) * view.zoom, D = f / sc, ox = w / 2, oy = h / 2, zMin = 0.05 * D, Xb = X0, Yb = Y0;
    const mk = (X0, Y0) => { const rel = relTo(X0, Y0), proj = (x, y, hh) => { const [a, v, n] = rel(x, y, hh), k = D / Math.max(D - n, zMin); return [a * k * sc + ox, v * k * sc + oy]; }; return {
      sc, base, fit, D, persp: true, pivot: [X0, Y0, hF],
      p: proj,
      unp: (px, py, hh) => { // exact: the ray of the pixel meets the plane at height hh (u is linear in the pixel row)
        const xs = (px - ox) / sc, vs = (py - oy) / sc, hp = hh - hF, u = (vs * (D - hp * sp) + D * hp * cp) / (D * sp + vs * cp), z = D - u * cp - hp * sp, a = xs * z / D;
        return [cy * a + sy * u + X0, -sy * a + cy * u + Y0];
      },
      depth: (x, y, hh) => rel(x, y, hh)[2], // toward the camera: larger = nearer (the z-buffer tests use 1 / (D - depth))
      ry: (x, y) => sy * (x - S.W / 2) + cy * (y - S.H / 2),
      nrm: (nx, ny, px, py) => { // [shading component, facing]; with a position the facing is the face normal against the vector from the face to the camera
        const rnx = cy * nx - sy * ny;
        if (px === undefined || E.camConstFacing) return [rnx, sy * nx + cy * ny]; // E.camConstFacing (diagnostic, off): the constant-normal culling of the orthographic cameras, to show what the facing test changes
        const cu = D * cp, cx = X0 + sy * cu, cyy = Y0 + cy * cu, dx = cx - px, dy = cyy - py, len = Math.hypot(dx, dy) || 1;
        const r = (nx * dx + ny * dy) / len, cst = E.camStats; // E.camStats (a test sets it): how many face tests the position changes compared with the constant normal
        if (cst) { const flip = (r > 0.001) !== ((sy * nx + cy * ny) > 0.001), q = proj(px, py, hF), on = q[0] >= 0 && q[0] <= w && q[1] >= 0 && q[1] <= h; cst.faces++; if (flip) cst.flipped++; if (on) { cst.onscreen = (cst.onscreen || 0) + 1; if (flip) cst.flippedOnscreen = (cst.flippedOnscreen || 0) + 1; } }
        return [rnx, r];
      }
    }; };
    // PAN moves the CAMERA over the ground (not the image): the pan is the displacement of the pivot at its own scale, s = (-panX / sc, -panY / (sc * sp)) along (screen right, toward camera), so the pivot is always the ground point
    // under the screen centre and the dolly distance D is measured to what is on screen (an image shift would leave the camera over the map centre and put a far-away focus point behind the camera at play scale).
    const c0 = mk(Xb, Yb), rel0 = relTo(Xb, Yb);
    // panFor: the pan (px) that brings the point (x, y, hh) to the screen centre, in closed form (the point must be at u' = hp * cp / sp and a' = 0 from the new pivot)
    c0.panFor = (x, y, hh) => { const [aT] = rel0(x, y, hh), hp = hh - hF, uT = sy * (x - Xb) + cy * (y - Yb), u1 = hp * cp / sp; return [-aT * sc, -(uT - u1) * sc * sp]; };
    if (!view.panX && !view.panY) return c0;
    const sa = -view.panX / sc, su = -view.panY / (sc * sp);
    const c1 = mk(Xb + cy * sa + sy * su, Yb - sy * sa + cy * su); c1.panFor = c0.panFor; return c1;
  }

  function wallFill(ctx, c, k, y0, y1, o) {
    if (PICK) return PKC;
    if (!o.gradient) return rgb(c, 0.62 * k);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(c, 0.86 * k)); g.addColorStop(1, rgb(c, 0.42 * k));
    return g;
  }

  /* hb / ht: a number, or [at a, at b] for a wall whose bottom or top is sloped (ramp flanks) */
  /* VIEWPORT CULLING OF WALLS (PR E1a; orthographic and oblique cameras only; the perspective camera has no `aff`, the floors views (o.zShift) and `o.noCull` (tests) switch it off). A wall edge or an Ascension wall box whose projected box (both heights, so the wall height is inside it) lies
     entirely outside the canvas enlarged by a margin is not built and not drawn. PIXEL-IDENTICAL by construction: nothing outside the margin reaches a pixel of the canvas (wall stroke 0.8 px, Ascension wall outline 0.9 px, dressing foot 0.55 tile and rocks 0.3 tile, all inside the margin), and the
     walls that stay keep their order (the sort is stable and its comparator reads only the depth of the wall). Margin = max(64 px, 2 tiles); tests: `o.cullPad` (px, replaces the margin: the MUTATION "margin shrunk") and `o.cullNoHeight` (the box ignores the wall height: the MUTATION "wall height dropped"). `tools/ui/test_cull_ui.js`. */
  function cullOf(cam, o) { const A = cam.aff; if (!A || o.zShift || o.noCull) return null; return { A, pad: o.cullPad !== undefined ? o.cullPad : Math.max(64, 2 * A.sc), noH: !!o.cullNoHeight }; }
  function boxOff(C, x0, y0, x1, y1, hlo, hhi) { // the box [x0, x1] x [y0, y1] x [hlo, hhi] (map units) entirely outside the enlarged canvas
    const A = C.A, lo = C.noH ? hhi : hlo; let mnx = 1e18, mxx = -1e18, mny = 1e18, mxy = -1e18;
    for (let i = 0; i < 4; i++) { const X = (i & 1 ? x1 : x0) - A.W2, Y = (i & 2 ? y1 : y0) - A.H2, sx = A.sc * (A.cy * X - A.sy * Y) + A.ox, u = (A.sy * X + A.cy * Y) * A.sp, yt = A.sc * (u - hhi * A.cp) + A.oy, yb = A.sc * (u - lo * A.cp) + A.oy;
      if (sx < mnx) mnx = sx; if (sx > mxx) mxx = sx; if (yt < mny) mny = yt; if (yb > mxy) mxy = yb; if (yb < mny) mny = yb; if (yt > mxy) mxy = yt; }
    return mxx < -C.pad || mnx > A.w + C.pad || mxy < -C.pad || mny > A.h + C.pad;
  }
  function edgeOff(C, ax, ay, bx, by, hb, ht) { // the wall quad of the edge a -> b between hb and ht, entirely outside the enlarged canvas
    const A = C.A, Xa = ax - A.W2, Ya = ay - A.H2, Xb = bx - A.W2, Yb = by - A.H2, xa = A.sc * (A.cy * Xa - A.sy * Ya) + A.ox, xb = A.sc * (A.cy * Xb - A.sy * Yb) + A.ox;
    if ((xa < xb ? xb : xa) < -C.pad || (xa < xb ? xa : xb) > A.w + C.pad) return true;
    const ua = (A.sy * Xa + A.cy * Ya) * A.sp, ub = (A.sy * Xb + A.cy * Yb) * A.sp, lo = C.noH ? ht : hb, yta = A.sc * (ua - ht * A.cp) + A.oy, ytb = A.sc * (ub - ht * A.cp) + A.oy, yba = A.sc * (ua - lo * A.cp) + A.oy, ybb = A.sc * (ub - lo * A.cp) + A.oy;
    return Math.max(yta, ytb, yba, ybb) < -C.pad || Math.min(yta, ytb, yba, ybb) > A.h + C.pad;
  }

  function wallQuad(ctx, cam, ax, ay, bx, by, hb, ht, c, rnx, o, st, strong, band) {
    const hb0 = Array.isArray(hb) ? hb[0] : hb, hb1 = Array.isArray(hb) ? hb[1] : hb, ht0 = Array.isArray(ht) ? ht[0] : ht, ht1 = Array.isArray(ht) ? ht[1] : ht;
    const p0 = cam.p(ax, ay, ht0), p1 = cam.p(bx, by, ht1), p2 = cam.p(bx, by, hb1), p3 = cam.p(ax, ay, hb0);
    const k = clamp(0.92 + 0.28 * -rnx, 0.65, 1.2), cs = E.camStats; // E.camStats (a test sets it): wall quads drawn that touch the canvas
    if (cs && Math.max(p0[0], p1[0], p2[0], p3[0]) >= 0 && Math.min(p0[0], p1[0], p2[0], p3[0]) <= ctx.canvas.width && Math.max(p0[1], p1[1], p2[1], p3[1]) >= 0 && Math.min(p0[1], p1[1], p2[1], p3[1]) <= ctx.canvas.height) cs.quads = (cs.quads || 0) + 1;
    let gy0 = Math.min(p0[1], p1[1]), gy1 = Math.max(p2[1], p3[1]);
    if (band) { const t0 = cam.p(ax, ay, band[1]), t1 = cam.p(bx, by, band[1]), b0 = cam.p(ax, ay, band[0]), b1 = cam.p(bx, by, band[0]); gy0 = Math.min(t0[1], t1[1]); gy1 = Math.max(b0[1], b1[1]); } // the gradient of the whole band of the slab wall (the block face is a part of it)
    const f = wallFill(ctx, c, k, gy0, gy1, o);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
    ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = f; ctx.lineWidth = 0.8; ctx.stroke();
    st.walls++;
    return [p0, p1];
  }

  /* ---- WALL DRESSING (switch o.dress, crystallizer 4; the SAME pass for Box, A, B and C; never in the pick renders, never on ramp / stair walls). Applies to a cliff whose total height is at least 0.5 terH.
     Per wall piece: shading by the plan normal smoothed along the contour (A / B / C: a gradient between the shades of the two vertex normals; Box keeps its flat normal per face), STRATA (thin dark lines every 0.34 terH at
     absolute heights with a small wobble that follows the world position, a slightly different tone per stratum), LIP (lighter band on the top 0.22 terH, at most 40 % of the wall, with a dark line at its edge; only on the
     top band of a cliff). On the LOWER cap, right after the wall (Box: in the turn of the lower tile, after its cap; A / B / C: in the turn of the band whose base is the lower cap): FOOT (a darkening of 0.55 tile scaled by
     the jump) and, for jumps of 1.5 terH or more, BASE ROCKS (placeholder domes along the foot). The rocks do not repeat the art contract stones, which sit on the TOP edge. ---- */
  const DR = { strata: 0.34, lip: 0.22, minJump: 0.5, rockJump: 1.5, tallJump: 2.2, foot: 0.55 };
  const dhash = (a, b, c, d) => E.curves.hash(a, b, c, d);
  /* w: ax, ay, bx, by, hb, ht, k (base shade), kA, kB (vertex shades, optional), top, tot (total cliff height in terH), c (wall colour), wx, wy (world tile of the piece, only for tones) */
  function dressWall(ctx, cam, S, P, st, w) {
    const th = P.terH, hgt = w.ht - w.hb; if (hgt <= 1e-6 || w.tot < DR.minJump) return;
    const quad = (z0, z1) => { const q = [cam.p(w.ax, w.ay, z1), cam.p(w.bx, w.by, z1), cam.p(w.bx, w.by, z0), cam.p(w.ax, w.ay, z0)]; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.closePath(); return q; };
    st.dress.walls++;
    if (w.kA !== undefined && w.kB !== undefined) { // shading smoothed along the contour: the vertex shades relative to the shade of the piece, as a darkening and a lightening gradient
      const q = quad(w.hb, w.ht), dx = q[1][0] - q[0][0], dy = q[1][1] - q[0][1];
      if (dx * dx + dy * dy > 0.25) for (const sgn of [-1, 1]) {
        const a0 = Math.max(0, sgn * (w.kA - w.k) * (sgn < 0 ? 0.9 : 0.5)), a1 = Math.max(0, sgn * (w.kB - w.k) * (sgn < 0 ? 0.9 : 0.5)); if (a0 < 0.004 && a1 < 0.004) continue;
        const g = ctx.createLinearGradient(q[0][0], q[0][1], q[1][0], q[1][1]), col = sgn < 0 ? '16,12,26' : '255,250,240';
        g.addColorStop(0, `rgba(${col},${Math.min(0.4, a0).toFixed(3)})`); g.addColorStop(1, `rgba(${col},${Math.min(0.4, a1).toFixed(3)})`);
        quad(w.hb, w.ht); ctx.fillStyle = g; ctx.fill();
      }
    }
    const step = DR.strata * th, k0 = Math.ceil((w.hb + 1e-6) / step), k1 = Math.floor((w.ht - 1e-6) / step), len = Math.hypot(w.bx - w.ax, w.by - w.ay), m = Math.max(2, Math.ceil(len * 3));
    for (let q = k0 - 1; q <= k1; q++) { // the tone of each stratum (a band of 0.34 terH) varies a little
      const z0 = Math.max(w.hb, q * step), z1 = Math.min(w.ht, (q + 1) * step); if (z1 - z0 < 0.03 * th) continue;
      const tone = dhash(q, (w.wx + w.wy) >> 2, 3, 9); if (tone > 0.5) { quad(z0, z1); ctx.fillStyle = tone > 0.75 ? 'rgba(255,250,235,0.07)' : 'rgba(16,12,26,0.06)'; ctx.fill(); }
    }
    ctx.lineWidth = 1; ctx.lineJoin = 'round';
    for (let q = k0; q <= k1; q++) {
      const z = q * step; if (z <= w.hb + 0.04 * th || z >= w.ht - 0.04 * th) continue;
      ctx.strokeStyle = `rgba(18,14,28,${(0.16 + 0.14 * dhash(q, (w.wx + w.wy) >> 2, 4, 8)).toFixed(3)})`; ctx.beginPath();
      for (let i = 0; i <= m; i++) {
        const t = i / m, x = w.ax + (w.bx - w.ax) * t, y = w.ay + (w.by - w.ay) * t, X = x + S.ox, Y = y + S.oy; // wobble by world position: continuous across the pieces of a contour
        const wob = th * (0.022 * Math.sin(X * 1.9 + Y * 2.3 + q * 2.1) + 0.012 * Math.sin(X * 5.1 - Y * 4.3 + q * 3.7)), p = cam.p(x, y, Math.min(w.ht - 0.02 * th, Math.max(w.hb + 0.02 * th, z + wob)));
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      }
      ctx.stroke(); st.dress.strata++;
    }
    if (w.top) { // lip
      const lipH = Math.min(DR.lip * th, 0.4 * hgt), z = w.ht - lipH; quad(z, w.ht); ctx.fillStyle = 'rgba(255,250,236,0.17)'; ctx.fill();
      const a = cam.p(w.ax, w.ay, z), b = cam.p(w.bx, w.by, z); ctx.strokeStyle = 'rgba(18,14,28,0.36)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); st.dress.lips++;
    }
  }
  /* foot and base rocks along the edge a -> b on the lower cap (height hb); (nax, nay) / (nbx, nby): unit normals at the ends, pointing away from the wall onto the lower cap */
  function dressFoot(ctx, cam, S, P, st, f) {
    const th = P.terH, jump = f.jump; if (jump < DR.minJump) return;
    const A2 = [f.ax + f.nax * DR.foot, f.ay + f.nay * DR.foot], B2 = [f.bx + f.nbx * DR.foot, f.by + f.nby * DR.foot], z = f.hb + 0.003 * th;
    const pa = cam.p(f.ax, f.ay, z), pb = cam.p(f.bx, f.by, z), pb2 = cam.p(B2[0], B2[1], z), pa2 = cam.p(A2[0], A2[1], z);
    const mx = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], ex = [(pa2[0] + pb2[0]) / 2, (pa2[1] + pb2[1]) / 2];
    if (Math.hypot(ex[0] - mx[0], ex[1] - mx[1]) > 0.5) {
      const g = ctx.createLinearGradient(mx[0], mx[1], ex[0], ex[1]), al = Math.min(0.45, 0.16 + 0.1 * Math.min(jump, 3));
      g.addColorStop(0, `rgba(14,10,22,${al.toFixed(3)})`); g.addColorStop(0.5, `rgba(14,10,22,${(al * 0.45).toFixed(3)})`); g.addColorStop(1, 'rgba(14,10,22,0)');
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.lineTo(pb2[0], pb2[1]); ctx.lineTo(pa2[0], pa2[1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); st.dress.foot++; if (st.dress.items) st.dress.items.push({ k: 'foot', x: (f.ax + f.bx) / 2 + f.nax * 0.2, y: (f.ay + f.by) / 2 + f.nay * 0.2, z: f.hb });
    }
    if (f.sect) { // the gap of a convex vertex between two strips with different normals: a sector of the same darkening, radial in the ground frame (the ground circle is an ellipse on screen)
      const q = f.sect, o0 = cam.p(q.px, q.py, z), ex = cam.p(q.px + DR.foot, q.py, z), ey = cam.p(q.px, q.py + DR.foot, z), al = Math.min(0.45, 0.16 + 0.1 * Math.min(jump, 3));
      ctx.save(); ctx.transform((ex[0] - o0[0]) / DR.foot, (ex[1] - o0[1]) / DR.foot, (ey[0] - o0[0]) / DR.foot, (ey[1] - o0[1]) / DR.foot, o0[0], o0[1]);
      const a1 = Math.atan2(q.n1[1], q.n1[0]), da = Math.atan2(q.n1[0] * q.n2[1] - q.n1[1] * q.n2[0], q.n1[0] * q.n2[0] + q.n1[1] * q.n2[1]), g = ctx.createRadialGradient(0, 0, 0, 0, 0, DR.foot);
      g.addColorStop(0, `rgba(14,10,22,${al.toFixed(3)})`); g.addColorStop(0.5, `rgba(14,10,22,${(al * 0.45).toFixed(3)})`); g.addColorStop(1, 'rgba(14,10,22,0)');
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, DR.foot, a1, a1 + da); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    }
    if (jump < DR.rockJump) return;
    const len = Math.hypot(f.bx - f.ax, f.by - f.ay), tall = jump >= DR.tallJump, n = Math.round(len * (tall ? 2.6 : 1.6) * (0.6 + 0.8 * dhash(f.wx, f.wy, 1, 10)));
    for (let i = 0; i < n; i++) {
      const t = dhash(f.wx, f.wy, i, 11), r = (0.09 + 0.12 * dhash(f.wx, f.wy, i, 12)) * (tall ? 1.25 : 1), off = (0.3 + 0.5 * dhash(f.wx, f.wy, i, 13)) * r;
      let nx = f.nax + (f.nbx - f.nax) * t, ny = f.nay + (f.nby - f.nay) * t; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const x = f.ax + (f.bx - f.ax) * t + nx * off, y = f.ay + (f.by - f.ay) * t + ny * off, c0 = cam.p(x, y, f.hb), cx = cam.p(x + r, y, f.hb), cy = cam.p(x, y + r, f.hb), ct = cam.p(x, y, f.hb + 1.25 * r);
      const rx = Math.max(1.2, (Math.hypot(cx[0] - c0[0], cx[1] - c0[1]) + Math.hypot(cy[0] - c0[0], cy[1] - c0[1])) / 2), hp = Math.max(1.5, Math.abs(c0[1] - ct[1])), shade = 0.5 + 0.2 * dhash(f.wx, f.wy, i, 14);
      ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, rx * 0.5, 0, 0, Math.PI); ctx.ellipse(c0[0], c0[1], rx, hp, 0, Math.PI, 2 * Math.PI); ctx.closePath();
      ctx.fillStyle = rgb(f.c, shade); ctx.fill(); ctx.strokeStyle = 'rgba(18,14,28,0.62)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(c0[0] - rx * 0.25, c0[1] - hp * 0.45, rx * 0.4, hp * 0.3, 0, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,250,236,0.16)'; ctx.fill(); st.dress.rocks++; if (st.dress.items) st.dress.items.push({ k: 'rock', x, y, z: f.hb });
    }
  }

  /* ---- Ascension walls (S.ascWalls, P.ascWalls): a thin box (0.15 tile) on the edge of a room-border face, tile-exact and the same in Box, A and B. Its base is the higher of the two tiles, its height is absolute (0.7;
     0.15 for the cut toward the camera, computed here with the camera of the frame). Stone colour, dark outline. Not selectable (the pick render skips it unless o.pickWalls, used to measure what it hides). ---- */
  const STONE = [166, 158, 146], STONE_TOP = [204, 196, 182];
  function ascWallDepth(cam, w) { return cam.ry(w.dir === 0 ? w.x + 1 : w.x + 0.5, w.dir === 0 ? w.y + 0.5 : w.y + 1); }
  const ascLow = (o, cam, w) => !o.ascNoCut && E.roomTypes.ascWallLow(w, cam);
  /* In A / B a wall is cut into BANDS at the heights of the levels it crosses (like the ramps) and each band is drawn in the pass of the level at the top of its band, so a higher slab behind it cannot paint over it;
     the top cap goes with the last band. Returns [{ pass, lo, hi, top }]. */
  function ascBands(S, w, low) {
    const T = E.roomTypes, hb = w.hb, ht = hb + (low ? (S.ascWalls.lowH === undefined ? T.ASC_LOW : S.ascWalls.lowH) : S.ascWalls.height), bands = []; let lo = hb, L = Math.max(S.fine[w.i], S.fine[w.j]) + 1;
    while (L <= S.maxFine && S.levelH[L] < ht - 1e-6) { const hi = S.levelH[L]; if (hi > lo + 1e-6) { bands.push({ pass: L, lo, hi, top: false }); lo = hi; } L++; }
    bands.push({ pass: Math.min(L, S.maxFine), lo, hi: ht, top: true }); return bands;
  }
  function drawAscWall(ctx, cam, S, o, w, st, band) {
    if (PICK && !o.pickWalls) return;
    const low = ascLow(o, cam, w), T = E.roomTypes, hb = band ? band.lo : w.hb, ht = band ? band.hi : w.hb + (low ? (S.ascWalls.lowH === undefined ? T.ASC_LOW : S.ascWalls.lowH) : S.ascWalls.height), [x0, x1, y0, y1] = T.ascBox(w);
    const veiled = !!(o.veil && S.slice && !S.pocket && !S.slice[w.i] && !S.slice[w.j]); let side = DBG ? [255, 0, 0] : veiled ? veilMix(STONE) : STONE, top = DBG ? [255, 0, 0] : veiled ? veilMix(STONE_TOP) : STONE_TOP;
    if (!PICK && !DBG && o.typeTint && S.ascWalls.gate > 0) { const mixT = (c, k) => [0, 1, 2].map((q) => (c[q] * 0.65 + [70, 130, 255][q] * 0.35) * k); side = mixT(side, 0.8); top = mixT(top, 0.88); } // D28: with the gate width on (ascGate > 0) and the type tint on, a wall takes a darker shade of the Ascension tint, so it can be attributed to its room (the default look is unchanged)
    if (!PICK && !DBG && low && o.gateMarks && S.gateBits) { side = side.map((v) => v * 0.55); top = top.map((v) => v * 0.55); } // chain view with the gate markers: the low (cut) stubs are darker than the full walls, so a gate and a cut wall cannot be confused (D25)
    if (PICK) PKC = pcode(0, 0);
    for (const [ax, ay, bx, by, nx, ny] of [[x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0], [x1, y1, x0, y1, 0, 1], [x0, y1, x0, y0, -1, 0]]) { // the sides that face the camera, then the top
      const [rnx, rny] = cam.nrm(nx, ny, (ax + bx) / 2, (ay + by) / 2); if (rny <= 0.001) continue;
      wallQuad(ctx, cam, ax, ay, bx, by, hb, ht, side, rnx, o, st);
    }
    if (band && !band.top) return;
    const p0 = cam.p(x0, y0, ht), p1 = cam.p(x1, y0, ht), p2 = cam.p(x1, y1, ht), p3 = cam.p(x0, y1, ht);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
    ctx.fillStyle = PICK ? PKC : rgb(top); ctx.fill();
    if (!PICK && o.outlines !== false && !DBG) { ctx.strokeStyle = 'rgba(24,20,34,0.6)'; ctx.lineWidth = 0.9; ctx.lineJoin = 'round'; ctx.stroke(); }
    st.polys++;
  }
  const ascByKey = (S, keyOf) => { const m = new Map(); if (!S.ascWalls) return m; for (const w of S.ascWalls.faces) { const k = keyOf(w); let a = m.get(k); if (!a) m.set(k, a = []); a.push(w); } return m; };

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
  const ROOM_COLORS = { 5: 'rgba(70,235,255,1)', 6: 'rgba(255,45,45,1)', 4: 'rgba(255,226,40,0.99)', 1: 'rgba(255,150,40,0.98)', 2: 'rgba(70,232,130,0.98)', 3: 'rgba(40,110,255,0.98)' }; // 3 = the warning outline of an edge-problem region (electric blue, dashed: white is the slice border at the map edge, cyan the passes, pink the route)
  function roomFaces(list, S, cam, i, b, hh, o) { if (S.pocket && !S.slice[i]) return; let k = S.roomKind[i * 4 + b]; if (o.gateMarks && S.blockBits && (S.blockBits[i] >> b & 1)) k = 6; else if (o.gateMarks && S.gateBits && (S.gateBits[i] >> b & 1)) k = 5; else if (o.dioOutline && S.dioBits && (S.dioBits[i] >> b & 1)) k = 4; else if (!k || (k === 3 ? !o.edgeWarn : !o.roomBorders)) return; const x = i % S.W, y = (i / S.W) | 0, f = FACE[b]; list.push([cam.p(x + f[0], y + f[1], hh), cam.p(x + f[2], y + f[3], hh), k]); }
  /* the faces of tile i that carry a line: the room borders (Display toggles) plus the gate markers of the chain view (S.gateBits, Display toggle gateMarks) */
  const faceBits = (S, o, i, RB) => (((o.roomBorders || o.edgeWarn || o.dioOutline) && RB) ? RB[i] : 0) | ((o.gateMarks && S.gateBits) ? S.gateBits[i] : 0) | ((o.gateMarks && S.blockBits) ? S.blockBits[i] : 0);
  function strokeRoomFaces(ctx, list) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = new Path2D(); for (const [p, q] of list) { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); }
    ctx.strokeStyle = BORDER_CASE; ctx.lineWidth = 3.4; ctx.stroke(path);
    for (const kind of [1, 2, 3, 4, 5, 6]) {
      const pp = new Path2D(); let any = false;
      for (const [p, q, k] of list) if (k === kind) { pp.moveTo(p[0], p[1]); pp.lineTo(q[0], q[1]); any = true; }
      if (any && (kind === 5 || kind === 6)) { ctx.strokeStyle = BORDER_CASE; ctx.lineWidth = 5.6; ctx.stroke(pp); } // gate markers (D25): a dark casing under a bright, wide line
      if (any) { ctx.strokeStyle = ROOM_COLORS[kind]; ctx.lineWidth = kind >= 5 ? 3.8 : kind === 4 ? 2.6 : 1.8; if (kind === 3) { ctx.lineCap = 'butt'; ctx.setLineDash([3, 2.5]); } ctx.stroke(pp); ctx.setLineDash([]); ctx.lineCap = 'round'; }
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
    if (S.pocket && !S.slice[i]) { const r = S.pocketRole[i]; return r === 3 ? [ROAD] : []; } // pocket: the decoration takes no tints and no marks; the pond is water, the exits are marked roads
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
    if (!PICK && S.dioRole && S.dioRole[i] === 3) out.push('rgba(255,205,60,0.5)'); else if (!PICK && S.dioRole && S.dioRole[i] === 4) out.push('rgba(240,240,240,0.4)'); // Diorama in the chain view (D30): the transit landing and the bridge
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
      const [rnx, rny] = cam.nrm(dx, dy, (ax + bx) / 2, (ay + by) / 2);   // (a neighbour of the same ramp gets a wall only where its column is shifted and the surfaces differ)
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
    const ASC = ascByKey(S, (w) => (rank[w.i] > rank[w.j] ? w.i : w.j)); // each wall after the later (painter order) of the two tiles of its face

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
        const [rnx, rny] = cam.nrm(dx, dy, x + (ax + bx) / 2, y + (ay + by) / 2);
        if (rny <= 0.001) continue;
        const sj = ST && (si || ST.get(ny * W + nx)); // a wall that belongs to a stair (riser or flank) takes its colour
        const inside = nx >= 0 && ny >= 0 && nx < W && ny < H, nr = inside && ST && ST.get(ny * W + nx);
        const hbw = nr && nr.rec ? [Math.min(hh, E.rampHeight(nr.rec, x + ax, y + ay, ny * W + nx)), Math.min(hh, E.rampHeight(nr.rec, x + bx, y + by, ny * W + nx))] : hn; // beside a ramp the wall stops at its surface
        wallQuad(ctx, cam, x + ax, y + ay, x + bx, y + by, hbw, hh, sj && inside ? stairColor(sj) : cc, rnx, o, st);
        if (o.dress && !PICK && !sj && !(nr && nr.rec)) dressWall(ctx, cam, S, P, st, { ax: x + ax, ay: y + ay, bx: x + bx, by: y + by, hb: hn, ht: hh, k: 0, top: true, tot: (hh - hn) / P.terH, wx: S.ox + x, wy: S.oy + y }); // Box: one flat wall per face, no shade gradient
      }
      const ov = isRamp ? [] : tileOverlay(S, P, o, i);
      if (!isRamp) {
        if (PICK) PKC = pcode(4, i);
        tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = PICK ? PKC : rgb(cc); ctx.fill(); ctx.strokeStyle = PICK ? PKC : rgb(cc); ctx.lineWidth = 0.8; ctx.stroke();
        for (const col of ov) { tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = col; ctx.fill(); }
        if (veiled && ov.length) { tileQuad(ctx, cam, x, y, hh); ctx.fillStyle = VEIL; ctx.fill(); }
        if (ST) drawStairEdges(ctx, cam, S, i, hh);
        if (o.dress && !PICK && !(S.carved && S.carved[i])) for (const [dx, dy, ax, ay, bx, by] of dirs) { // foot and rocks of the walls of the higher neighbours that face the camera, on this (lower) cap
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if ((S.void && S.void[j]) || (S.carved && S.carved[j])) continue;
          const hj = S.levelH[S.fine[j]]; if ((hj - hh) / P.terH < DR.minJump - 1e-9 || cam.nrm(-dx, -dy, x + (ax + bx) / 2, y + (ay + by) / 2)[1] <= 0.001) continue;
          dressFoot(ctx, cam, S, P, st, { ax: x + ax, ay: y + ay, bx: x + bx, by: y + by, nax: -dx, nay: -dy, nbx: -dx, nby: -dy, hb: hh, jump: (hj - hh) / P.terH, wx: S.ox + nx, wy: S.oy + ny, c: cc });
        }
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
      const rbm = PICK ? 0 : faceBits(S, o, i, RB);
      if (rbm) { // each face is drawn once, after the later (painter order) of its two tiles
        const bp = [];
        for (let b = 0; b < 4; b++) {
          if (!(rbm >> b & 1)) continue;
          const j = (y + dirs[b][1]) * W + x + dirs[b][0]; if (rank[j] > rank[i]) continue;
          roomFaces(bp, S, cam, i, b, Math.max(hh, S.levelH[S.fine[j]]), o);
        }
        if (bp.length) strokeRoomFaces(ctx, bp);
      }
      const aw = ASC.get(i); if (aw) { aw.sort((p, q) => ascWallDepth(cam, p) - ascWallDepth(cam, q)); for (const w of aw) drawAscWall(ctx, cam, S, o, w, st); }
      st.polys++;
    }
  }

  /* ---- Contour techniques A / B: one extruded slab per level over the whole slice ---- */
  function renderLevels(ctx, cam, S, P, o, st, loopsOf, tech) {
    const DRESS = !!o.dress && !PICK, lvl = S.fineMask || S.fine, th = P.terH; // wall dressing: the same pass as in Box
    const WP = tech === 'C' && !PICK && E.wallc ? E.wallc.get(S, P) : null; // the wall pass of technique C (null: off); the pick render never sees it
    const ST = hasStairs(S) ? stairTiles(S) : null, PIECES = ST ? rampPieces(S, cam) : new Map(); // ramp pieces by level band
    const CULL = cullOf(cam, o), ASCL = new Map(); if (S.ascWalls) for (const w of S.ascWalls.faces) { if (CULL) { const [bx0, bx1, by0, by1] = E.roomTypes.ascBox(w); if (boxOff(CULL, bx0, by0, bx1, by1, w.hb, w.hb + Math.max(S.ascWalls.height, S.ascWalls.lowH === undefined ? E.roomTypes.ASC_LOW : S.ascWalls.lowH))) { st.culled.asc++; continue; } } for (const bd of ascBands(S, w, ascLow(o, cam, w))) { let a = ASCL.get(bd.pass); if (!a) ASCL.set(bd.pass, a = []); a.push({ w, bd }); } } // Ascension walls by bands: each in the pass of the level at the top of its band, after its cap, by depth
    for (let L = 0; L <= S.maxFine; L++) {
      const loops = loopsOf(S, L, P), pcs = PIECES.get(L) || [];
      if (!loops.length && !pcs.length) continue;
      if (!loops.length) { pcs.sort((p, q) => p.d - q.d); for (const pc of pcs) rampPiece(ctx, cam, S, o, pc.tile, pc.rec, ST, st, pc.sa, pc.sb); continue; }
      const ht = S.levelH[L], hb = L === 0 ? cam.base : S.levelH[L - 1];
      const terraceLevel = L === 0 || (!S.levelMeta[L].bridge && S.levelMeta[L].sub === 0);
      const c = levelColor(S, L, P), cv = veilMix(c), segs = [];
      const tileIdx = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? iy * S.W + ix : -1; };
      const tileC = tech === 'C' ? (px, py) => E.cellTileAt(S, P, px, py) : tileIdx; // technique C: the tile of the Voronoi cell, not the tile under the point
      const tileOf = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py); return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? ST.get(iy * S.W + ix) : undefined; };
      const mkSeg = (a, b, dx, dy, len, va, vb, pn) => {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, rnxy = cam.nrm(dy / len, -dx / len, mx, my);
        if (rnxy[1] <= 0.001) return null;
        const seg = { a, b, rnx: rnxy[0], d: cam.ry(mx, my), veiled: !!(o.veil && S.slice && !S.pocket && !inSlice(S, mx - 0.2 * dy / len, my + 0.2 * dx / len)), stair: null, own: tileC(mx - 0.2 * dy / len, my + 0.2 * dx / len) };
        if (ST) { // a wall touching a carved tile (also the diagonal corner cells of B): part of the rigid footprint
          const inn = tileOf(mx - 0.2 * dy / len, my + 0.2 * dx / len), outn = tileOf(mx + 0.2 * dy / len, my - 0.2 * dx / len);
          if (inn && inn.rec) return null;                  // the ramp draws its own side walls
          seg.stair = inn || outn || null;
          if (outn && outn.rec) { seg.clip = outn.rec; seg.clipT = outn.t; }        // a wall beside a ramp stops at the ramp surface
        }
        if (DRESS && !seg.stair && !seg.clip) { // wall dressing: the cliff this piece belongs to (levels inside and outside, from the cells / tiles on both sides) and the shades of its two vertex normals
          const tOut = tileC(mx + 0.2 * dy / len, my - 0.2 * dx / len), lvIn = seg.own >= 0 ? lvl[seg.own] : L, lvOut = tOut >= 0 ? lvl[tOut] : -1, base = S.baseH !== undefined ? S.baseH : S.levelH[0] - th, kk = (n, p) => clamp(0.92 + 0.28 * -cam.nrm(n[0], n[1], p[0], p[1])[0], 0.65, 1.2);
          seg.na = va || null; seg.nb = vb || null; seg.pn = pn || null; seg.dr = { lvIn, lvOut, tot: (S.levelH[Math.max(lvIn, 0)] - (lvOut >= 0 ? S.levelH[lvOut] : base)) / th, k: clamp(0.92 + 0.28 * -rnxy[0], 0.65, 1.2), kA: va ? kk(va, a) : undefined, kB: vb ? kk(vb, b) : undefined, mx, my };
        }
        return seg;
      };
      for (const loop of loops) {
        const n = loop.length; st.verts += n;
        const vn = DRESS ? loop.map((p, k) => { const pr = loop[(k + n - 1) % n], nx = loop[(k + 1) % n], vx = (p[1] - pr[1]) + (nx[1] - p[1]), vy = -(p[0] - pr[0]) - (nx[0] - p[0]), l = Math.hypot(vx, vy); return l > 1e-9 ? [vx / l, vy / l] : [nx[1] - p[1], -(nx[0] - p[0])]; }) : null; // outward normals (dy, -dx) summed over the two segments of a vertex (longer segment weighs more)
        for (let k = 0; k < n; k++) {
          const a = loop[k], b = loop[(k + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
          if (len < 1e-6) continue;
          if (CULL && edgeOff(CULL, a[0], a[1], b[0], b[1], hb, ht)) { st.culled.walls++; continue; } // PR E1a: the wall of this edge is off screen (it keeps nothing the canvas can show)
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
          let pn = null; if (vn) { const pr = loop[(k + n - 1) % n], pdx = a[0] - pr[0], pdy = a[1] - pr[1], pl = Math.hypot(pdx, pdy); if (pl > 1e-6) pn = [pdy / pl, -pdx / pl]; } // outward normal of the previous segment (the foot sector at a convex vertex)
          const seg = mkSeg(a, b, dx, dy, len, vn && vn[k], vn && vn[(k + 1) % n], pn); if (seg) segs.push(seg);
        }
      }
      for (const pc of pcs) segs.push({ piece: pc, d: pc.d });
      const wl = WP && WP.byHi.get(L); // the blocks of the wall pass in front of the walls of this level: by depth with them, before the cap
      if (wl) {
        for (const f of wl.faces) { const mx = (f.ax + f.bx) / 2, my = (f.ay + f.by) / 2, rr = cam.nrm(f.nx, f.ny, mx, my); if (rr[1] > 0.001) segs.push({ pf: f, rnx: rr[0], d: cam.ry(mx, my) }); }
        for (const t of wl.tops) segs.push({ pt: t, d: cam.ry(t.cx, t.cy) });
      }
      segs.sort((p, q) => p.d - q.d);
      for (const s of segs) {
        if (s.pf) { // a block face: the cliff colour of the upper level, with the dressing when it is on (no foot: the base is not on the lower cap)
          const f = s.pf, veiled = !!(o.veil && S.slice && !S.pocket && !inSlice(S, (f.ax + f.bx) / 2, (f.ay + f.by) / 2));
          if (DBG) { const q = [cam.p(f.ax, f.ay, f.zhi), cam.p(f.bx, f.by, f.zhi), cam.p(f.bx, f.by, f.zlo), cam.p(f.ax, f.ay, f.zlo)]; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let k = 1; k < 4; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.closePath(); ctx.fillStyle = '#ff0000'; ctx.fill(); continue; } // test mode: pure red, like the ramps
          for (let m = f.lo + 1; m <= f.hi; m++) { // the face takes the gradient of the slab wall behind it, band by band (a wall of the level m spans levelH[m - 1] .. levelH[m]): the same colour at the same height
            const bb = m === 0 ? cam.base : S.levelH[m - 1], bt = S.levelH[m], z0 = Math.max(f.zlo, bb), z1 = Math.min(f.zhi, bt); if (z1 - z0 < 1e-6) continue;
            wallQuad(ctx, cam, f.ax, f.ay, f.bx, f.by, z0, z1, veiled ? cv : c, s.rnx, o, st, false, [bb, bt]);
          }
          if (DRESS) { // the same dressing as the slab wall: shade smoothed along the contour (vertex normals), strata at absolute heights (they continue across the faces)
            const kk = (n, px, py) => clamp(0.92 + 0.28 * -cam.nrm(n[0], n[1], px, py)[0], 0.65, 1.2);
            dressWall(ctx, cam, S, P, st, { ax: f.ax, ay: f.ay, bx: f.bx, by: f.by, hb: f.zlo, ht: f.zhi, k: clamp(0.92 + 0.28 * -s.rnx, 0.65, 1.2), kA: f.na ? kk(f.na, f.ax, f.ay) : undefined, kB: f.nb ? kk(f.nb, f.bx, f.by) : undefined, top: f.top, tot: f.tot, wx: f.wx, wy: f.wy });
          }
          continue;
        }
        if (s.pt) { // the top of a block: ledges (0 < s < K) the upper cap colour x 0.92 without outline, full height the upper cap colour with the silhouette line
          const t = s.pt, veiled = !!(o.veil && S.slice && !S.pocket && !inSlice(S, t.cx, t.cy));
          ctx.beginPath(); t.pts.forEach((v, k) => { const q = cam.p(v[0], v[1], t.z); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath();
          ctx.fillStyle = DBG ? '#ff0000' : rgb(veiled ? cv : c, t.ledge ? 0.92 : 1); ctx.fill();
          if (t.ledge || DBG) { if (!DBG) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke(); } } // ledges: filled, NO outline (a thin ledge drew as a bare outline); the stroke in the fill colour only closes the seams between pieces
          else if (o.outlines) { ctx.strokeStyle = 'rgba(24,20,34,0.55)'; ctx.lineWidth = 0.8; ctx.stroke(); } // the full-height tops (the continuation of the cap) keep the silhouette line
          st.polys++; continue;
        }
        if (s.piece) { rampPiece(ctx, cam, S, o, s.piece.tile, s.piece.rec, ST, st, s.piece.sa, s.piece.sb); continue; }
        let hbs = hb;
        if (s.clip) { hbs = [Math.min(ht, Math.max(hb, E.rampHeight(s.clip, s.a[0], s.a[1], s.clipT))), Math.min(ht, Math.max(hb, E.rampHeight(s.clip, s.b[0], s.b[1], s.clipT)))]; if (hbs[0] >= ht - 1e-6 && hbs[1] >= ht - 1e-6) continue; }
        if (PICK) PKC = pcode(2, Math.max(0, s.own));
        wallQuad(ctx, cam, s.a[0], s.a[1], s.b[0], s.b[1], hbs, ht, s.stair ? stairColor(s.stair) : s.veiled ? cv : c, s.rnx, o, st);
        if (DRESS && s.dr && !Array.isArray(hbs)) { // dressing of this piece; foot and rocks right after the wall of the band whose base is the lower cap
          const d = s.dr, col = s.veiled ? cv : c;
          dressWall(ctx, cam, S, P, st, { ax: s.a[0], ay: s.a[1], bx: s.b[0], by: s.b[1], hb: hbs, ht, k: d.k, kA: d.kA, kB: d.kB, top: d.lvIn <= L, tot: d.tot, wx: S.ox + Math.floor(d.mx), wy: S.oy + Math.floor(d.my) });
          if (d.lvOut >= 0 && d.lvOut === L - 1) {
            const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], l = Math.hypot(dx, dy) || 1, nm = [dy / l, -dx / l]; // outward normal of the piece; the ends use the vertex normals when they are known
            const turn = s.pn ? s.pn[0] * nm[1] - s.pn[1] * nm[0] : 0, sect = s.pn && turn > 1e-3 ? { px: s.a[0], py: s.a[1], n1: s.pn, n2: nm } : null; // convex vertex: the outward normals diverge
            dressFoot(ctx, cam, S, P, st, { ax: s.a[0], ay: s.a[1], bx: s.b[0], by: s.b[1], nax: nm[0], nay: nm[1], nbx: nm[0], nby: nm[1], sect, hb, jump: d.tot, wx: S.ox + Math.floor(d.mx), wy: S.oy + Math.floor(d.my), c: col }); // per-segment normal (vertex normals folded the strips at sharp corners) + a fill sector at convex vertices
          }
        }
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
      if (((o.roomBorders || o.edgeWarn || o.dioOutline) && RB || (o.gateMarks && (S.gateBits || S.blockBits))) && !PICK) { // a face belongs to the higher of its two tiles (the lower index when they are level)
        const bp = [], dd = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const i of S.byLevel[L]) {
          const rbm = faceBits(S, o, i, RB); if (!rbm) continue; const x = i % S.W, y = (i / S.W) | 0;
          for (let b = 0; b < 4; b++) { if (!(rbm >> b & 1)) continue; const j = (y + dd[b][1]) * S.W + x + dd[b][0]; if (S.fine[j] > L || (S.fine[j] === L && j < i)) continue; roomFaces(bp, S, cam, i, b, ht, o); }
        }
        if (bp.length) strokeRoomFaces(ctx, bp);
      }
      const aw = ASCL.get(L); if (aw) { aw.sort((p, q) => ascWallDepth(cam, p.w) - ascWallDepth(cam, q.w) || p.bd.lo - q.bd.lo); for (const q of aw) drawAscWall(ctx, cam, S, o, q.w, st, q.bd); }
    }
  }

  E.levelColor = levelColor; // exposed for the tests
    E.makeCam = makeCam;
  E.fitScale = (S, P, view, w, h) => makeCam(S, P, Object.assign({}, view, { fitSc: 0, zoom: 1, panX: 0, panY: 0 }), w, h).fit; // px per tile at zoom 1 for a panel of w x h // exposed for the UI tests (screen position of a tile)

  function drawScene(ctx, w, h, S, P, tech, view, o) {
    DBG = !!o.debug; PICK = !!o.pick;
    const t0 = performance.now(), st = { walls: 0, polys: 0, verts: 0, culled: { walls: 0, asc: 0 }, dress: { walls: 0, strata: 0, lips: 0, foot: 0, rocks: 0, items: o.dressItems ? [] : null } }; // o.dressItems (tests): the anchor points of the foot strips and the rocks, to compare them with a reference
    const cam = makeCam(S, P, view, w, h);
    if (o.zShift) { const p0 = cam.p, zs = o.zShift; cam.p = (x, y, hh) => p0(x, y, hh + zs); } // a layer of the floors views (exploded stack): every height raised, the camera is the same
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (tech === 'box') renderBox(ctx, cam, S, P, o, st);
    else renderLevels(ctx, cam, S, P, o, st, E.loopsOf(tech), tech);
    if (!PICK) {
      if (o.passes) drawPassMarks(ctx, cam, S, P);
      if (o.markers) drawMarkers(ctx, cam, S, P);
      if (o.incursion) drawIncursion(ctx, cam, S, o.incursion);
      if (o.dress) S.dressInfo = Object.assign(S.dressInfo || {}, { [tech]: st.dress }); // wall dressing counts per technique
      if (o.contract && E.contract) S.contractInfo = Object.assign(S.contractInfo || {}, { [tech]: E.contract.draw(ctx, cam, S, P, tech, view, o, w, h) }); // art contract placeholders (switch off = nothing here)
    }
    st.ms = performance.now() - t0; DBG = false; PICK = false;
    return { st, cam };
  }

  /* The Box pick render as an image (CSS pixels, one code per pixel: walls kind 2 by tile, caps kind 4 by tile): the visibility test of the art contract. */
  E.pickBuffer = (S, P, view, w, h, o) => { // `o` (optional): extra options of the pick render, e.g. { pickWalls: true } (the Ascension walls as occluders)
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.antialias = false;
    drawScene(ctx, w, h, S, P, 'box', view, Object.assign({ pick: true }, o));
    return { data: ctx.getImageData(0, 0, w, h).data, w, h };
  };

  E.render = function (cv, S, P, tech, view, o) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a2540'); bg.addColorStop(1, '#171424');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    return drawScene(ctx, w, h, S, P, tech, view, o).st;
  };

  /* The layers of the floors views (src/floors.js), bottom to top: [{ S, dz, ghost }]. Each layer is drawn by the normal pipeline of the technique on its own shape, raised by dz (exploded stack); a ghost layer is drawn
     on a transparent canvas and composited once with its opacity (so overlapping polygons do not accumulate). The caller guarantees an orthographic camera and one fit (`S.fitH`) for every layer. */
  E.renderLayers = function (cv, layers, P, tech, view, o) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a2540'); bg.addColorStop(1, '#171424');
    if (o.noBg) ctx.clearRect(0, 0, w, h); else { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); } // noBg (tests): a transparent canvas, so the coverage of a layer can be read
    const sum = { walls: 0, polys: 0, verts: 0, ms: 0 };
    for (const L of layers) {
      const oo = Object.assign({}, o, { zShift: L.dz || 0, incursion: null });
      let target = ctx, off = null;
      if (L.ghost) { off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height; target = off.getContext('2d'); target.setTransform(dpr, 0, 0, dpr, 0, 0); }
      const r = drawScene(target, w, h, L.S, P, tech, view, oo).st;
      if (off) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = L.ghost; ctx.drawImage(off, 0, 0); ctx.restore(); }
      sum.walls += r.walls; sum.polys += r.polys; sum.verts += r.verts; sum.ms += r.ms;
    }
    return sum;
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
      const [gx, gy] = cam.unp(px, py, S.levelH[v]);
      if (tech === 'C') { const t = E.cellTileAt(S, P, gx, gy); return t >= 0 ? { tile: t, kind: 'cap' } : { tile: -1, kind: 'none' }; } // the tile of the Voronoi cell under the point (the owner of the nearest seed)
      const ix = Math.floor(gx), iy = Math.floor(gy);
      return ix >= 0 && iy >= 0 && ix < S.W && iy < S.H ? { tile: iy * S.W + ix, kind: 'cap' } : { tile: -1, kind: 'none' };
    }
    return { tile: -1, kind: 'none' };
  };
})(window.EVO = window.EVO || {});
