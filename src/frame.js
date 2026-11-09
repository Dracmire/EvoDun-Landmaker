/* STAGE FRAME LAYERS, THE RIBBON (mode 3, PR M4c-1; `E.frame`; docs/crystallizers/03-stage/README.md "M4c-1 as built"): the G layer (guide) of a hand-placed golden shot: a RIBBON = a declared polyline in MAP coordinates, `{ pts: [[x, y], ...], wH, color? }`, wH = the width in hero heights H (about 1.5 H = 3 tiles at tilesPerH 2; the band of the remake path is 1.2-1.7 H).
   The tiles of the ribbon are the tiles whose CENTRE is at most wH * tilesPerH / 2 from the polyline (`ribbonTiles`, pure, deterministic). `draw` paints, BEFORE the billboards, the top face of each of those tiles (four corners with `cam.p` at the ground height `E.stage.feetH`, a flat placeholder colour, no texture) and ONLY where the tile is visible by the same test as the objects (`E.objects.groundTest`, the Box pick render: a tile hidden by a higher terrain in front is not painted).
   VISUAL ONLY: the shape S is never touched, no walking changes. Absent (`o.frame` null) = this file is never called: identical pixels. A golden shot is a capability test: afterwards the rules generate the layers; the ribbon is data written by hand, a hypothesis, not a rule. */
(function (E) {
  'use strict';
  const COLOR = '#b4764a'; // the flat placeholder of a dirt path (R4: no final art, Unity owns the look)
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy; let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); };
  /* ribbonTiles(W, H, ox, oy, ribbon, tilesPerH) -> the ascending tile indices (y * W + x of the window) whose centre is within wH * tilesPerH / 2 (inclusive) of the polyline (points in MAP coordinates: ox / oy are subtracted). A one-point polyline is a disc. */
  function ribbonTiles(W, H, ox, oy, ribbon, tilesPerH) {
    const pts = (ribbon && ribbon.pts || []).map((p) => [p[0] - ox, p[1] - oy]), r = (ribbon && ribbon.wH > 0 ? ribbon.wH : 0) * tilesPerH / 2, out = [];
    if (!pts.length || !(r > 0)) return out;
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[0])) - r - 1)), x1 = Math.min(W - 1, Math.ceil(Math.max(...pts.map((p) => p[0])) + r + 1)), y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1])) - r - 1)), y1 = Math.min(H - 1, Math.ceil(Math.max(...pts.map((p) => p[1])) + r + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const cx = x + 0.5, cy = y + 0.5; let d = Infinity;
      if (pts.length === 1) d = Math.hypot(cx - pts[0][0], cy - pts[0][1]); else for (let k = 1; k < pts.length; k++) d = Math.min(d, segDist(cx, cy, pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]));
      if (d <= r + 1e-9) out.push(y * W + x);
    }
    return out;
  }
  function draw(ctx, cam, S, P, tech, view, o, w, h) {
    const lists = (o.frame && o.frame.list) || [], tp = o.frame.tilesPerH, stats = []; if (!lists.length) return;
    const gt = E.objects.groundTest(S, P, view, w, h, o);
    for (const rb of lists) {
      const tiles = ribbonTiles(S.W, S.H, S.ox, S.oy, rb, tp), st = { tiles: tiles.length, drawn: 0, hidden: 0 }; stats.push(st);
      ctx.save(); ctx.fillStyle = rb.color || COLOR; ctx.strokeStyle = rb.color || COLOR; ctx.lineWidth = 0.7; ctx.lineJoin = 'round';
      for (const i of tiles) {
        const x = i % S.W, y = (i / S.W) | 0, f = E.stage.feetH(S, i), c = cam.p(x + 0.5, y + 0.5, f);
        if (!gt.ownGround(c, i)) { st.hidden++; continue; }
        const a = cam.p(x, y, f), b = cam.p(x + 1, y, f), d = cam.p(x + 1, y + 1, f), e = cam.p(x, y + 1, f);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); st.drawn++;
      }
      ctx.restore();
    }
    o.frame.stats = stats;
  }
  E.frame = { COLOR, ribbonTiles, draw };
})(window.EVO = window.EVO || {});
