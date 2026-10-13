/* EvoDun crystal viewer - crystallizer 5, FLOORS, Option 2 (docs/crystallizers/05-floors/option2-backdrop.md), PHASE 1: the camera-fixed BACKDROP of a single floor.
   The floor is drawn by the normal pipeline, tile for tile as the single-floor view. BEHIND it (farther from the camera, along the camera axis) a band of terrain geometry is added: a low PLAIN (the gap, `gap` tiles deep)
   and then the BACKDROP band, whose heights are the REAL heights of the exterior layer (the mountain section a person standing on the floor would see behind the playable space). Both are decoration: not walkable,
   the levels of their own with the palette of the Pocket decoration (`levelMeta.deco`), written only on tiles that are void in the floor's shape.
   Phase 1 scope: single floor, the Cam 1 axis (yaw 45, like the Pocket), no fog, no tone multiplier. HARD RULE: nothing hides the floor: every added tile lies behind the back edge of the floor along the axis (s < sBack), so it is
   drawn before (and under) any tile of the floor in every orthographic painter order. INVARIANT: the floor's tiles are not touched (same levels, same walking); only void tiles are written.
   Not exported to Unity. */
(function (E) {
  const B_ = E.backdrop = {};
  B_.defaults = { yaw: 45, gap: 4, depth: 9, lat0: 2, flare: 0.75, plainUp: 0.1, bandMin: 0.5, characterTiles: 2, mode: 'v1', height: 2, attDepth: 10, v3Drop: 0.5 };
  B_.MODES = ['real', 'mirror', 'v1', 'v2', 'v3'];
  /* PLAN (pure): W, H window; frag Uint8Array (1 = a tile of the floor); extH Float32Array (height of the real exterior at each tile, NaN = void); opts { yaw, gap, depth, lat0, flare, jump, plainH, bandMin }.
     Axis u = (sin yaw, cos yaw) points TOWARD the camera (the Pocket's convention); s(i) = tile centre . u; sBack = the smallest s of the floor (its back edge). A tile is
       - PLAIN  (part 1) if 0 < sBack - s <= gap: the gap between the floor and the band; height = plainH;
       - BAND   (part 2) if gap < sBack - s <= gap + depth and the real exterior there is at least plainH + bandMin x jump (lower exterior is not a mountain section: left empty); height = the exterior height;
     and, in both, its lateral position l (along v = (-u1, u0)) lies in [lmin - (lat0 + flare x sd), lmax + (lat0 + flare x sd)], sd = sBack - s (the window of the floor widened as it recedes, so the band fills the frame).
     Tiles without exterior data (NaN) are never written. Returns { role (0 none, 1 floor, 2 added), part, height, u, sBack, info }. */
  B_.plan = function (W, H, frag, extH, opts) {
    const o = Object.assign({}, B_.defaults, opts), n = W * H, yaw = o.yaw * Math.PI / 180, u = [Math.sin(yaw), Math.cos(yaw)], v = [-u[1], u[0]], jump = o.jump || 1;
    const role = new Uint8Array(n), part = new Uint8Array(n), height = new Float32Array(n).fill(NaN);
    let sBack = Infinity, lmin = Infinity, lmax = -Infinity, cnt = 0;
    for (let i = 0; i < n; i++) if (frag[i]) { const x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, s = x * u[0] + y * u[1], l = x * v[0] + y * v[1]; role[i] = 1; cnt++; if (s < sBack) sBack = s; if (l < lmin) lmin = l; if (l > lmax) lmax = l; }
    const info = { floorTiles: cnt, plain: 0, band: 0, dropped: 0, maxDepth: 0, gap: o.gap, depth: o.depth };
    if (!cnt) return { role, part, height, u, sBack, info };
    for (let i = 0; i < n; i++) {
      if (frag[i] || !(extH[i] === extH[i])) continue; // a floor tile, or no exterior data
      const x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, sd = sBack - (x * u[0] + y * u[1]); if (sd <= 0 || sd > o.gap + o.depth) continue;
      const l = x * v[0] + y * v[1], w = o.lat0 + o.flare * sd; if (l < lmin - w || l > lmax + w) continue;
      if (sd <= o.gap) { role[i] = 2; part[i] = 1; height[i] = o.plainH; info.plain++; }
      else if (extH[i] >= o.plainH + o.bandMin * jump) { role[i] = 2; part[i] = 2; height[i] = extH[i]; info.band++; if (sd - o.gap > info.maxDepth) info.maxDepth = sd - o.gap; }
      else info.dropped++;
    }
    return { role, part, height, u, sBack, info };
  };
  /* PLAN of the ATTACHED backdrop (phase 1b, the cavity wall; pure). W, H window; frag Uint8Array (1 = a tile of the floor); fragH Float32Array (height of each floor tile); extH Float32Array (real exterior height of each tile, NaN = none);
     opts { yaw, variant 'v1' | 'v2' | 'v3', gap, depth (attDepth), jump (terH), sub (sub-terrace height), mult (Backdrop height), minRise (characterTiles x terH), v3Drop }.
     OUTSIDE tiles = the tiles that are not floor and are 4-connected to the map border through non-floor tiles: the void tiles ENCLOSED by the floor (the shaft, the floor-2 opening, any inner hole) are never written.
     A tile is BEHIND the floor when a ray from its centre toward the camera (+u, step 0.25) meets a floor tile within gap + depth and the three parallel rays (lateral offsets -0.7, 0, +0.7) AWAY from the camera meet none (so nothing of
     the floor lies behind it and it cannot hide any of it). d = the distance of the centre ray to the first floor tile (the local back contour), hit = that tile. Then
       APRON  (v1, v3) d <= gap: height = the height of `hit` (v3: minus v3Drop x sub), exact, role 2, part 1;
       WALL   gap < d <= gap + depth: base = the height of `hit` (v3: minus v3Drop x sub); the MIRRORED tile (the centre moved 2 d toward the camera, across the back contour) gives the real exterior height e;
              rise = max(e - base, minRise) x mult; height = base + rise (snapped to the level grid by the caller), role 2, part 2. v2 has gap 0: no apron, the wall starts at the back contour.
     Heights are real data (the exterior surface over the floor); their PLACEMENT behind the back edge is a mirror; `minRise` and `mult` are stylization. Returns { role, part, height, u, info }. */
  B_.planAttached = function (W, H, frag, fragH, extH, opts) {
    const o = Object.assign({}, B_.defaults, opts), n = W * H, yaw = o.yaw * Math.PI / 180, u = [Math.sin(yaw), Math.cos(yaw)], v = [-u[1], u[0]], v2 = o.variant === 'v2', gap = v2 ? 0 : o.gap, jump = o.jump || 1, sub = o.sub === undefined ? 0.22 * jump : o.sub;
    const minRise = o.minRise === undefined ? o.characterTiles * jump : o.minRise, mult = o.mult === undefined ? o.height : o.mult, depth = o.attDepth === undefined ? o.depth : o.attDepth;
    const role = new Uint8Array(n), part = new Uint8Array(n), height = new Float32Array(n).fill(NaN), outside = new Uint8Array(n);
    let nf = 0; for (let i = 0; i < n; i++) if (frag[i]) { role[i] = 1; nf++; }
    const info = { floorTiles: nf, apron: 0, wall: 0, minRiseTiles: 0, noMirror: 0, enclosed: 0, maxRise: 0, maxHeight: -Infinity, variant: o.variant, gap, depth, mult, minRise };
    if (!nf) return { role, part, height, u, outside, info };
    const q = []; for (let i = 0; i < n; i++) { const x = i % W, y = (i / W) | 0; if (!frag[i] && (x === 0 || y === 0 || x === W - 1 || y === H - 1)) { outside[i] = 1; q.push(i); } }
    for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !frag[j] && !outside[j]) { outside[j] = 1; q.push(j); } }
    for (let i = 0; i < n; i++) if (!frag[i] && !outside[i]) info.enclosed++;
    const at = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); return ix < 0 || iy < 0 || ix >= W || iy >= H ? -1 : iy * W + ix; };
    const ray = (x0, y0, dx, dy, max) => { for (let t = 0.25; t <= max; t += 0.25) { const j = at(x0 + dx * t, y0 + dy * t); if (j >= 0 && frag[j]) return { t, j }; } return null; }; // first floor tile along the ray
    const far = W + H, lat = [-0.7, 0, 0.7];
    for (let i = 0; i < n; i++) {
      if (frag[i] || !outside[i]) continue;
      const x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, hit = ray(x, y, u[0], u[1], gap + depth + 0.5); if (!hit) continue;
      let behind = true; for (const l of lat) if (ray(x + v[0] * l, y + v[1] * l, -u[0], -u[1], far)) { behind = false; break; } if (!behind) continue;
      const d = hit.t, base = fragH[hit.j] - (o.variant === 'v3' ? o.v3Drop * sub : 0);
      if (d <= gap) { role[i] = 2; part[i] = 1; height[i] = base; info.apron++; continue; }
      if (d > gap + depth) continue;
      const mj = at(x + 2 * d * u[0], y + 2 * d * u[1]), e = mj >= 0 && extH[mj] === extH[mj] ? extH[mj] : NaN, riseM = e === e ? e - base : 0; if (!(e === e)) info.noMirror++;
      const rise = Math.max(riseM, minRise); if (riseM < minRise) info.minRiseTiles++; const hh = base + rise * mult;
      role[i] = 2; part[i] = 2; height[i] = hh; info.wall++; if (rise * mult > info.maxRise) info.maxRise = rise * mult; if (hh > info.maxHeight) info.maxHeight = hh;
    }
    return { role, part, height, u, outside, info };
  };
  /* APPLY to the primary shape S of floor k (k > 0) of a floors package `raw`, right after `E.shape` + `E.floors.prepare`: the real exterior heights come from the exterior layer's shape (`E.floors.shapeOf(S, raw, P, 0)`, the same
     global height frame, so the heights agree). The plain sits on the floor's own thin slab (`S.baseH` + plainUp x terH, kept exact: it must stay above the base) and the floor keeps its skirt. Sets S.backdrop = { role, part, info }. */
  B_.apply = function (S, P, raw, k, opts) {
    if (!(k > 0) || !E.hasFloors(raw) || S.backdrop) return null;
    const S0 = E.floors.shapeOf(S, raw, P, 0), n = S.n, W = S.W, H = S.H, frag = new Uint8Array(n), extH = new Float32Array(n).fill(NaN), jump = P.terH, o = Object.assign({}, B_.defaults, opts);
    if (S0.W !== W || S0.H !== H) return null;
    for (let i = 0; i < n; i++) { frag[i] = S.void && S.void[i] ? 0 : 1; if (!(S0.void && S0.void[i])) extH[i] = S0.levelH[S0.fine[i]]; }
    /* DIAGNOSTIC `P.backdropMirror` (no UI, like P.anchor; the phase 1 finding, see the PR): the real exterior BEHIND a floor is the low outer slope of the mountain (the floors lie inside it), far below the floor, so the band of real
       heights is empty. In this mode the band takes the exterior height at the tile reflected through the back edge of the floor (the real mountain that stands over the floor, seen as if it were behind it): real data, placed by reflection. */
    if (P.backdropMode === 'mirror' || (!P.backdropMode && P.backdropMirror)) { const yw = o.yaw * Math.PI / 180, ux = Math.sin(yw), uy = Math.cos(yw); let sB = Infinity; for (let i = 0; i < n; i++) if (frag[i]) sB = Math.min(sB, ((i % W) + 0.5) * ux + (((i / W) | 0) + 0.5) * uy);
      const e2 = new Float32Array(n).fill(NaN); for (let i = 0; i < n; i++) { if (frag[i]) continue; const x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, sd = sB - (x * ux + y * uy); if (!(sd > 0)) continue; const qx = Math.floor(x + 2 * sd * ux), qy = Math.floor(y + 2 * sd * uy); if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue; const j = qy * W + qx; if (!(S0.void && S0.void[j])) e2[i] = S0.levelH[S0.fine[j]]; }
      extH.set(e2); }
    const baseH = S.baseH !== undefined ? S.baseH : S.levelH[0] - jump, gap = P.backdropGap === undefined ? o.gap : P.backdropGap, mode = P.backdropMode || (P.backdropMirror ? 'mirror' : o.mode), attached = mode === 'v1' || mode === 'v2' || mode === 'v3';
    let pl;
    if (attached) { // phase 1b: the cavity wall attached to the floor (planAttached); the mirror of the exterior is done there
      const fragH = new Float32Array(n).fill(NaN); for (let i = 0; i < n; i++) if (frag[i]) fragH[i] = S.levelH[S.fine[i]];
      const ext0 = new Float32Array(n).fill(NaN); for (let i = 0; i < n; i++) if (!(S0.void && S0.void[i])) ext0[i] = S0.levelH[S0.fine[i]];
      pl = B_.planAttached(W, H, frag, fragH, ext0, Object.assign({}, o, { variant: mode, gap, jump, sub: E.subHeight(P), mult: P.backdropHeight === undefined ? o.height : P.backdropHeight }));
      pl.info.plain = pl.info.apron; pl.info.band = pl.info.wall; pl.info.dropped = 0; pl.info.maxDepth = pl.info.depth;
    } else pl = B_.plan(W, H, frag, extH, Object.assign({}, o, { gap, jump, plainH: baseH + o.plainUp * jump }));
    const added = pl.info.plain + pl.info.band; let levelsAdded = 0;
    if (added) {
      S.void = Uint8Array.from(S.void); S.fine = Int16Array.from(S.fine); // own copies: `S.void` is shared with the quantization cached on the pack (writing it in place would change the next shape built from the same pack)
      const keep = new Uint8Array(n); for (let i = 0; i < n; i++) if (pl.part[i] === 1) keep[i] = 1; // the plain keeps its exact height (a snap down could go under the slab base)
      const plan = { role: pl.role, height: Float32Array.from(pl.height), decoHeight: Float32Array.from(pl.height), keep };
      levelsAdded = E.pocket.addLevels(S, P, plan).added;
      const vd = S.void; for (let i = 0; i < n; i++) if (pl.role[i] === 2) { vd[i] = 0; S.block[i] = 1; } // decoration: drawn, not walkable
      S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd[i]) S.byLevel[S.fine[i]].push(i);
      S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1;
    }
    S.backdrop = { role: pl.role, part: pl.part, u: pl.u, sBack: pl.sBack, info: Object.assign({}, pl.info, { levelsAdded, plainH: baseH + o.plainUp * jump, mode }) };
    return S.backdrop;
  };
})(window.EVO = window.EVO || {});
