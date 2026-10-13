/* EvoDun crystal viewer - crystallizer 5, FLOORS, Option 2 (docs/crystallizers/05-floors/option2-backdrop.md), PHASE 1: the camera-fixed BACKDROP of a single floor.
   The floor is drawn by the normal pipeline, tile for tile as the single-floor view. BEHIND it (farther from the camera, along the camera axis) a band of terrain geometry is added: a low PLAIN (the gap, `gap` tiles deep)
   and then the BACKDROP band, whose heights are the REAL heights of the exterior layer (the mountain section a person standing on the floor would see behind the playable space). Both are decoration: not walkable,
   the levels of their own with the palette of the Pocket decoration (`levelMeta.deco`), written only on tiles that are void in the floor's shape.
   Phase 1 scope: single floor, the Cam 1 axis (yaw 45, like the Pocket), no fog, no tone multiplier. HARD RULE: nothing hides the floor: every added tile lies behind the back edge of the floor along the axis (s < sBack), so it is
   drawn before (and under) any tile of the floor in every orthographic painter order. INVARIANT: the floor's tiles are not touched (same levels, same walking); only void tiles are written.
   Not exported to Unity. */
(function (E) {
  const B_ = E.backdrop = {};
  B_.defaults = { yaw: 45, gap: 4, depth: 9, lat0: 2, flare: 0.75, plainUp: 0.1, bandMin: 0.5, characterTiles: 2 };
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
  /* APPLY to the primary shape S of floor k (k > 0) of a floors package `raw`, right after `E.shape` + `E.floors.prepare`: the real exterior heights come from the exterior layer's shape (`E.floors.shapeOf(S, raw, P, 0)`, the same
     global height frame, so the heights agree). The plain sits on the floor's own thin slab (`S.baseH` + plainUp x terH, kept exact: it must stay above the base) and the floor keeps its skirt. Sets S.backdrop = { role, part, info }. */
  B_.apply = function (S, P, raw, k, opts) {
    if (!(k > 0) || !E.hasFloors(raw) || S.backdrop) return null;
    const S0 = E.floors.shapeOf(S, raw, P, 0), n = S.n, W = S.W, H = S.H, frag = new Uint8Array(n), extH = new Float32Array(n).fill(NaN), jump = P.terH, o = Object.assign({}, B_.defaults, opts);
    if (S0.W !== W || S0.H !== H) return null;
    for (let i = 0; i < n; i++) { frag[i] = S.void && S.void[i] ? 0 : 1; if (!(S0.void && S0.void[i])) extH[i] = S0.levelH[S0.fine[i]]; }
    /* DIAGNOSTIC `P.backdropMirror` (no UI, like P.anchor; the phase 1 finding, see the PR): the real exterior BEHIND a floor is the low outer slope of the mountain (the floors lie inside it), far below the floor, so the band of real
       heights is empty. In this mode the band takes the exterior height at the tile reflected through the back edge of the floor (the real mountain that stands over the floor, seen as if it were behind it): real data, placed by reflection. */
    if (P.backdropMirror) { const yw = o.yaw * Math.PI / 180, ux = Math.sin(yw), uy = Math.cos(yw); let sB = Infinity; for (let i = 0; i < n; i++) if (frag[i]) sB = Math.min(sB, ((i % W) + 0.5) * ux + (((i / W) | 0) + 0.5) * uy);
      const e2 = new Float32Array(n).fill(NaN); for (let i = 0; i < n; i++) { if (frag[i]) continue; const x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, sd = sB - (x * ux + y * uy); if (!(sd > 0)) continue; const qx = Math.floor(x + 2 * sd * ux), qy = Math.floor(y + 2 * sd * uy); if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue; const j = qy * W + qx; if (!(S0.void && S0.void[j])) e2[i] = S0.levelH[S0.fine[j]]; }
      extH.set(e2); }
    const baseH = S.baseH !== undefined ? S.baseH : S.levelH[0] - jump, gap = P.backdropGap === undefined ? o.gap : P.backdropGap;
    const pl = B_.plan(W, H, frag, extH, Object.assign({}, o, { gap, jump, plainH: baseH + o.plainUp * jump }));
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
    S.backdrop = { role: pl.role, part: pl.part, u: pl.u, sBack: pl.sBack, info: Object.assign({}, pl.info, { levelsAdded, plainH: baseH + o.plainUp * jump }) };
    return S.backdrop;
  };
})(window.EVO = window.EVO || {});
