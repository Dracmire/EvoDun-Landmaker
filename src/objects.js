/* STAGE OBJECTS, BILLBOARDS (mode 3, PR S4a; `E.objects`; docs/crystallizers/03-stage/README.md "S4a"): a DECLARED list of placeholder billboards in the window of the 2D-HD stage: [{ kind, x, y, hH }], x / y in MAP coordinates (the window offset S.ox / S.oy is subtracted here), hH in hero heights H.
   The list is declared by the example (`objects` of `dac_stage` in src/modes.js) with the format of the future `billboards` entry of the treatment; rules that DERIVE objects from the rooms (Z / X / Hub, flanks of a transition, the back of a room) need a direction and a role per room that does not exist in the repo yet: not here.
   VISUAL ONLY. Nothing here touches the terrain: no height of S changes, E.shape is never called for the objects, switching them on or off only redraws (`S` and its cache stay the same object). Off (the default) = this file is never called: identical pixels. The contract (src/contract.js) and the legacy examples are untouched.
   HEIGHT = the convention of the HERO (src/stage.js drawHero): a camera-facing sprite, 1 H = the pixels the hero measures at that depth (`hTiles * cam.sc * k`, k = depthScale of the base point), so an object of hH H is hH hero heights tall at its own depth; width, line widths and the font scale with the same k.
   (A segment that is vertical in the 3D projection is about 8 % shorter than the hero sprite at pitch 25 degrees: the volumes of S4b are real geometry and follow that projection; the billboards do not.) The pack's `h` is NOT read: in data/shrine_pier_x4.json it is the terrain elevation of the landmark platform (tools/derive_shrine_pier_x4.py), not an object height.
   BASE = the ground of the tile under (x, y) (E.stage.feetH). VISIBILITY = the Box pick render, like the contract (`ownGround`): an object whose base is not on its own tile in the image (a higher terrain in front, or outside the panel) is not drawn.
   ORDER = ONE depth-sorted list with the hero (cam.ry, larger = nearer the camera): an object nearer than the hero is painted over it; the hero no longer comes last when the objects are on. Tall objects may leave the panel at the top: expected (a cut silhouette).
   Test hooks (`E.objectsTest`, tests only, undefined in normal use): constSize, constStroke, tilesNotH, ignoreHidden, heroAlwaysTop; S4c: noDistance, hardStep, detailAlways, detailNever. */
(function (E) {
  'use strict';
  const LW0 = 1.6, FONT0 = 11; // the line width of the hero sprite and a base font size, both multiplied by the depth scale k
  /* kinds: width in H and the placeholder look (R4: placeholders, no final art; Unity owns the art) */
  const KINDS = {
    banner: { wH: 0.5, color: '#c2563a' },
    lamp: { wH: 0.4, color: '#f2d78a' },
    shrub: { wH: 0.9, color: '#3f8a4a' },
    pillar: { wH: 0.6, color: '#b9b2a6' },
    landmark: { wH: 1.2, color: '#b9b2a6' } // S4c: a wide neutral tower (R4: the pillar's stone palette, no colours of its own); its height changes with the hero's distance
  };
  const KIND_NAMES = Object.keys(KINDS);
  const T = () => E.objectsTest || {};
  /* S4c, THE LANDMARK (docs/crystallizers/03-stage/README.md "S4c"): an entry `{ kind: 'landmark', x, y, hFar, hNear, dFar, dNear }` of the objects list (the format of the future `billboards` entry), the apparent height in H changes with the ground distance d (in H) between the hero's feet and its base:
     h(d) = hFar + (hNear - hFar) * smoothstep(t), t = clamp((dFar - d) / (dFar - dNear), 0, 1). HYPOTHESES (variant C of v80, measured only in a mock, NOT in the viewer): hFar 1.5, hNear 3, dFar 8, dNear 2. It is a scale in the DRAWING: nothing touches the terrain or the shape. */
  const LANDMARK = { hFar: 1.5, hNear: 3, dFar: 8, dNear: 2 };
  /* S4c, THE BASE DETAIL ("fragment" of v79 / v80), ONE table of HYPOTHESES for S6 to calibrate: it appears when d <= startMul * dNear (alpha 0) and is full at fullMul * dNear (smoothstep between); three placeholders stuck to the base, offsets in TILES ((side) perpendicular to the camera, (front) toward the camera). They are part of the landmark: they inherit its visibility, no entries of the list; NO real volume (a pedestal would depend on the volumes switch and on a blocked tile). */
  const DETAIL = { startMul: 2, fullMul: 1.5, pieces: [{ kind: 'lamp', hH: 1.2, side: -1, front: 0 }, { kind: 'lamp', hH: 1.2, side: 1, front: 0 }, { kind: 'banner', hH: 0.6, side: 0, front: 1 }] };
  const smoothstep = (t) => t * t * (3 - 2 * t), clamp01 = (v) => Math.max(0, Math.min(1, v));
  const landmarkParams = (ob) => { const p = Object.assign({}, LANDMARK); for (const k of Object.keys(p)) if (ob[k] > 0) p[k] = ob[k]; return p; };
  const landmarkH = (d, p) => { p = p || LANDMARK; return p.hFar + (p.hNear - p.hFar) * smoothstep(clamp01((p.dFar - d) / (p.dFar - p.dNear))); };
  const baseAlpha = (d, p) => { p = p || LANDMARK; return smoothstep(clamp01((DETAIL.startMul * p.dNear - d) / ((DETAIL.startMul - DETAIL.fullMul) * p.dNear))); };

  /* the size on screen of an object of hH hero heights standing on the ground point (x, y, feet) (window coordinates): the hero's convention */
  function sizeAt(cam, tilesPerH, hH, wH, x, y, feet) {
    const t = T(), k = t.constSize ? 1 : E.stage.depthScale(cam, x, y, feet), tp = t.tilesNotH ? 1 : tilesPerH;
    return { k, hpx: hH * tp * cam.sc * k, wpx: wH * tp * cam.sc * k, lw: t.constStroke ? LW0 : LW0 * k, font: FONT0 * k };
  }

  function shape(ctx, kind, b, sz, label) { // b = the base point on screen; the placeholder, a contact shade, a label
    const { hpx, wpx, lw, font } = sz, col = KINDS[kind].color;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(24,20,34,0.95)';
    ctx.fillStyle = 'rgba(14,12,22,0.35)'; ctx.beginPath(); ctx.ellipse(b[0], b[1], wpx * 0.7, wpx * 0.22, 0, 0, 7); ctx.fill();
    if (kind === 'shrub') { ctx.beginPath(); ctx.ellipse(b[0], b[1] - hpx / 2, wpx / 2, hpx / 2, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); }
    else if (kind === 'pillar' || kind === 'landmark') { ctx.beginPath(); ctx.rect(b[0] - wpx / 2, b[1] - hpx, wpx, hpx); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(b[0] - wpx * 0.62, b[1] - hpx, wpx * 1.24, Math.min(hpx * 0.06, wpx * 0.3)); ctx.fillStyle = '#d8d2c6'; ctx.fill(); ctx.stroke(); }
    else { // banner and lamp: a pole and a head
      ctx.beginPath(); ctx.rect(b[0] - wpx * 0.06, b[1] - hpx, wpx * 0.12, hpx); ctx.fillStyle = '#5b3f2a'; ctx.fill(); ctx.stroke();
      if (kind === 'banner') { ctx.beginPath(); ctx.rect(b[0] + wpx * 0.06, b[1] - hpx, wpx * 0.9, hpx * 0.28); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(b[0], b[1] - hpx, wpx * 0.45, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); }
    }
    if (label !== false) { ctx.fillStyle = '#1a1624'; ctx.font = `700 ${font.toFixed(1)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${kind} ${+(+sz.hH).toFixed(2)} H`, b[0], b[1] + font * 1.35); }
    ctx.restore();
  }

  /* draw the objects and the hero in one depth order. Returns nothing; the per-object figures go to o.objects.stats (tests and the readout). */
  function draw(ctx, cam, S, P, tech, view, o, w, h) {
    const list = (o.objects && o.objects.list) || [], tp = o.objects.tilesPerH, t = T(), stats = [], items = [];
    const wantPick = list.length > 0 && !t.ignoreHidden; let D = null;
    const code = (px, py) => { const x = Math.round(px), y = Math.round(py); if (!D || x < 0 || y < 0 || x >= w || y >= h) return -1; const q = (y * w + x) * 4; return D[q + 3] === 255 ? (D[q] << 16) | (D[q + 1] << 8) | D[q + 2] : -1; };
    const ownGround = (p, i) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = code(p[0] + dx, p[1] + dy); if (k === ((4 << 20) | i) || k === ((3 << 20) | i)) return true; } return false; }; // a cap (kind 4) or a ramp (kind 3) of the tile at the point or one pixel around it
    if (wantPick) D = E.pickBuffer(S, P, view, w, h).data;
    for (const ob of list) {
      const kd = KINDS[ob.kind]; if (!kd) continue;
      const x = ob.x - S.ox, y = ob.y - S.oy, i = E.stage.cellOf(S, x, y), st = { kind: ob.kind, hH: ob.hH, x: ob.x, y: ob.y, tile: i, drawn: false, visible: false };
      stats.push(st); if (i < 0) continue;
      let hH = ob.hH, lp = null, d = Infinity;
      if (ob.kind === 'landmark') { // S4c: the apparent height from the ground distance (in H) to the hero's feet
        lp = landmarkParams(ob); if (o.hero) d = Math.hypot(o.hero.x - x, o.hero.y - y) / (t.tilesNotH ? 1 : tp); // (MUTATION tilesNotH: the distance in tiles)
        hH = t.noDistance ? (lp.hFar + lp.hNear) / 2 : t.hardStep ? (d < (lp.dFar + lp.dNear) / 2 ? lp.hNear : lp.hFar) : landmarkH(d, lp); // (MUTATIONS noDistance: a constant height; hardStep: a jump instead of the smoothstep)
        Object.assign(st, { hH, d, lm: lp });
      }
      const feet = E.stage.feetH(S, i), b = cam.p(x, y, feet), sz = sizeAt(cam, tp, hH, kd.wH, x, y, feet); sz.hH = hH;
      st.visible = t.ignoreHidden ? true : ownGround(b, i); Object.assign(st, { hpx: sz.hpx, wpx: sz.wpx, k: sz.k, lw: sz.lw, font: sz.font, base: b, ry: cam.ry(x, y) });
      if (!st.visible) continue;
      items.push({ ry: st.ry, st, paint: () => { shape(ctx, ob.kind, b, sz); st.drawn = true; } });
      if (lp) { // the base detail: alpha from the distance, the three pieces drawn with the hero's convention at the depth of their own feet
        const al = t.detailAlways ? 1 : t.detailNever ? 0 : baseAlpha(d, lp), ya = (o.objects.yaw || 0) * Math.PI / 180, cx = Math.sin(ya), cy = Math.cos(ya); st.alpha = al; st.detail = [];
        if (al > 0) for (const pc of DETAIL.pieces) {
          const x2 = x + pc.side * cy + pc.front * cx, y2 = y - pc.side * cx + pc.front * cy, i2 = E.stage.cellOf(S, x2, y2); if (i2 < 0) continue;
          const f2 = E.stage.feetH(S, i2), b2 = cam.p(x2, y2, f2), s2 = sizeAt(cam, tp, pc.hH, KINDS[pc.kind].wH, x2, y2, f2); s2.hH = pc.hH; const ds = { kind: pc.kind, drawn: false }; st.detail.push(ds);
          items.push({ ry: cam.ry(x2, y2), paint: () => { ctx.save(); ctx.globalAlpha = al; shape(ctx, pc.kind, b2, s2, false); ctx.restore(); ds.drawn = true; } });
        }
      }
    }
    if (o.hero && E.stage) { const ry = cam.ry(o.hero.x, o.hero.y); items.push({ ry: t.heroAlwaysTop ? Infinity : ry, paint: () => E.stage.drawHero(ctx, cam, o.hero) }); } // (MUTATION heroAlwaysTop: the hero last, as before S4a) a tie: the hero is pushed last and Array.sort is stable, so it stays on top
    items.sort((p, q) => p.ry - q.ry);
    for (const it of items) it.paint();
    o.objects.stats = stats;
  }

  E.objects = { KINDS, KIND_NAMES, LW0, FONT0, LANDMARK, DETAIL, landmarkH, baseAlpha, landmarkParams, sizeAt, draw };
})(window.EVO = window.EVO || {});
