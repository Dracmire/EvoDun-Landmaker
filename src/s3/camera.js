/* STAGE CAMERA 7 FOR MODE 3, DAC3 (PR Q6; `E.s3.obliqueCam`): a CLONE of the affine branch of `makeCam` of src/render.js for the oblique projection (Cam 7 Classic 3/4), with ONE change: the depth (ground) scale `sp` is `view.depthScale` [R: 0.5, also 0.4 and 0.6 for [U] to choose] instead of 1, so the ratio height / depth that reads 1 in Cam 7 (a terrace wall takes the same screen space as a tile of ground) becomes 1 / depthScale (2 at 0.5; Cam 6 reads cot 25 deg = 2.14 at the pivot). The height scale stays 1. render.js `makeCam` hands the view to this function ONLY when `view.depthScale` is set (one dispatch line); without it the Cam 7 of modes 1, 2 and 4 is the original code, byte for byte (tools/test_cam7.js, tools/test_cams.js). Everything else of the returned camera (p, unp, panFor, ry, nrm, aff, fit, sc, base) is the original one with sp changed, so picking, culling and the hero tracking work as for any affine camera. Visual only. */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0));
  E.obliqueCam = function (S, P, view, w, h) {
    const yaw = view.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), sp = view.depthScale, cp = 1;
    const base = S.baseH !== undefined ? S.baseH : S.levelH[0] - P.terH, top = S.levelH[S.maxFine];
    const raw = (x, y, hh) => { const X = x - S.W / 2, Y = y - S.H / 2; return [cy * X - sy * Y, (sy * X + cy * Y) * sp - hh * cp]; };
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const fb = S.sliceBox ? [S.sliceBox.x0 - 2, S.sliceBox.y0 - 2, S.sliceBox.x1 + 2, S.sliceBox.y1 + 2] : [0, 0, S.W, S.H];
    for (const [x, y] of [[fb[0], fb[1]], [fb[2], fb[1]], [fb[0], fb[3]], [fb[2], fb[3]]]) for (const hh of S.fitH || [base, top + 1.5]) { const [a, b] = raw(x, y, hh); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
    const fit = Math.min((w - 20) / (x1 - x0), (h - 20) / (y1 - y0)), sc = (view.fitSc || fit) * view.zoom;
    const ox = w / 2 - (x0 + x1) / 2 * sc + view.panX, oy = h / 2 - (y0 + y1) / 2 * sc + view.panY;
    return {
      sc, base, fit, aff: { sc, ox, oy, cy, sy, sp, cp, W2: S.W / 2, H2: S.H / 2, w, h },
      p: (x, y, hh) => { const [a, b] = raw(x, y, hh); return [a * sc + ox, b * sc + oy]; },
      panFor: (x, y, hh) => { const [a, b] = raw(x, y, hh); return [w / 2 - (a * sc + ox - view.panX), h / 2 - (b * sc + oy - view.panY)]; },
      unp: (px, py, hh) => { const a = (px - ox) / sc, b = (py - oy) / sc + hh * cp, c = b / sp; return [cy * a + sy * c + S.W / 2, -sy * a + cy * c + S.H / 2]; },
      ry: (x, y) => sy * (x - S.W / 2) + cy * (y - S.H / 2),
      nrm: (nx, ny) => [cy * nx - sy * ny, sy * nx + cy * ny]
    };
  };
})(window.EVO = window.EVO || {});
