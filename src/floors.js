/* EvoDun crystal viewer - crystallizer 5, FLOORS: the layers of a floors package (exterior + interior floors, `E.hasFloors`) and the two multi-layer views.
   Single floor: the existing pipeline on `E.floorPack(raw, k)`. Exploded stack: the layers are drawn bottom to top, each one raised by a screen-space height offset (the exterior on top, ghosted, so the floors under it stay
   readable). Cutaway: a PLANE perpendicular to the view through the shaft axis (cam.ry(x, y) = cam.ry(axis): it follows the preset yaw AND the drag variation); the back half of the exterior is drawn first, then the floors
   cropped to the front half, at their true heights. Painter-exact: a point behind the plane that shares a ray with one in front can only be lower, hence farther. Orthographic cameras only (Cam 1-5 and 7); a
   quadrant wedge is not possible under the painter's algorithm (the wings of the exterior interleave with the floors in depth; it needs per-pixel depth, parked).
   All layers share one window (the whole map, no slice), one fit (`S.fitH`) and thin slabs (`S.baseH`, the precedent of the Pocket), so one camera frames them all. */
(function (E) {
  const GHOST = 0.42;                                   // opacity of the exterior lid in the exploded stack
  const lowH = (S) => { for (let L = 0; L <= S.maxFine; L++) if (S.byLevel[L] && S.byLevel[L].length) return S.levelH[L]; return S.levelH[0]; };
  const baseOf = (S, P) => (S.baseH !== undefined ? S.baseH : S.levelH[0] - P.terH);
  const store = (S) => S.cache.floors || (S.cache.floors = { shapes: {}, cuts: {} });

  /* the shape of layer k of the package (0 = the exterior), cached on the primary shape S; a floor is a thin slab (baseH a little under its lowest level) */
  function shapeOf(S, raw, P, k) {
    if (S.floorLayer === k) return S;
    const c = store(S); if (c.shapes[k]) return c.shapes[k];
    const T = E.shape(E.floorPack(raw, k), P, null); T.floorLayer = k; if (k > 0) T.baseH = lowH(T) - 0.4 * P.terH;
    return (c.shapes[k] = T);
  }
  /* the package-wide camera frame: every layer of every view gets the same `fitH`, so switching layers or views never rescales */
  function frame(S, raw, P, extra) {
    const all = [0, ...raw.floors.map((f) => f.id)].map((k) => shapeOf(S, raw, P, k)); let lo = 1e9, hi = -1e9;
    for (const T of all) { const dz = extra && extra[T.floorLayer] || 0; lo = Math.min(lo, baseOf(T, P) + dz); hi = Math.max(hi, T.levelH[T.maxFine] + dz); }
    for (const T of all) T.fitH = [lo, hi + 1.5];
    return all;
  }
  /* the primary shape was just built for layer k (0 in the multi-layer views): its constants */
  function prepare(S, raw, P, k) { S.floorLayer = k; if (k > 0) S.baseH = lowH(S) - 0.4 * P.terH; store(S).shapes[k] = S; frame(S, raw, P); }

  function rotKey(v) { return Math.round(v.yaw * 10); }
  function cutPack(raw, k, ry, c, keep) { // the pack of layer k with the tiles of the other half of the plane made void
    const base = E.floorPack(raw, k), el = Float64Array.from(base.elevation), N = raw.width;
    for (let i = 0; i < el.length; i++) { const front = ry((i % N) + 0.5, Math.floor(i / N) + 0.5) >= c - 1e-9; if (front !== (keep === 'front')) el[i] = 0; }
    const o = Object.assign({}, base, { elevation: el }); delete o._q; return o; // the copy must not inherit the quantization cached on the unmasked pack
  }

  /* The layers to draw, bottom to top: [{ S, dz, ghost }]. mode 'stack' | 'cut'. `hold` (a drag in progress): keep the last cut, it is recomputed on release. dirty = new shapes were built (B and C recompute). */
  function layers(S, raw, P, v, mode, hold) {
    const c = store(S), ids = raw.floors.map((f) => f.id), cam = E.makeCam(S, P, Object.assign({}, v, { fitSc: 0, zoom: 1, panX: 0, panY: 0 }), 100, 100), ry = cam.ry;
    if (mode === 'stack') {
      const S1 = shapeOf(S, raw, P, ids[0]); let mn = 1e9, mx = -1e9; for (let i = 0; i < S1.n; i++) if (!S1.void || !S1.void[i]) { const r = ry((i % S1.W) + 0.5, Math.floor(i / S1.W) + 0.5); mn = Math.min(mn, r); mx = Math.max(mx, r); }
      const tanp = v.kind === 'oblique' ? 1 : Math.tan(v.pitch * Math.PI / 180), dz = Math.max(6, Math.min(30, (mx - mn) * tanp + 1.5)), shift = {}; ids.forEach((k, i) => { shift[k] = dz * i; }); shift[0] = dz * ids.length;
      frame(S, raw, P, shift);
      return { mode, dirty: false, dz, list: [...ids.map((k) => ({ S: shapeOf(S, raw, P, k), dz: shift[k], name: 'Floor ' + k })), { S, dz: shift[0], ghost: GHOST, name: 'Exterior (lid)' }] };
    }
    // cutaway: the plane through the shaft axis
    const key = rotKey(v); if (hold && c.lastCut) return Object.assign({}, c.lastCut, { dirty: false });
    frame(S, raw, P);
    if (c.lastCut && c.lastCut.key === key) return Object.assign({}, c.lastCut, { dirty: false });
    const axis = raw.shaft ? raw.shaft.c : [raw.width / 2, raw.height / 2], plane = ry(axis[0], axis[1]), mk = (k, keep) => { const T = E.shape(cutPack(raw, k, ry, plane, keep), P, null); T.floorLayer = k; T.markers = T.markers.filter((m) => !(T.void && T.void[m.y * T.W + m.x])); /* no mark floats over the removed half */ if (k > 0) T.baseH = lowH(T) - 0.4 * P.terH; return T; };
    const list = [{ S: mk(0, 'back'), dz: 0, name: 'Exterior (back half)' }, ...ids.map((k) => ({ S: mk(k, 'front'), dz: 0, name: 'Floor ' + k + ' (front half)' }))];
    const all = [0, ...ids].map((k) => shapeOf(S, raw, P, k)); let lo = 1e9, hi = -1e9; for (const T of all) { lo = Math.min(lo, baseOf(T, P)); hi = Math.max(hi, T.levelH[T.maxFine]); } for (const l of list) l.S.fitH = [lo, hi + 1.5];
    c.lastCut = { mode, key, list, plane, dirty: true };
    return Object.assign({}, c.lastCut);
  }

  E.floors = { shapeOf, frame, prepare, layers, cutPack, GHOST };
})(window.EVO = window.EVO || {});
