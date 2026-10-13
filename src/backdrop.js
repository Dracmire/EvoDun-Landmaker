/* EvoDun crystal viewer - crystallizer 5, FLOORS, Option 2 (docs/crystallizers/05-floors/option2-backdrop.md), PHASE 1: the camera-fixed BACKDROP of a single floor.
   The floor is drawn by the normal pipeline, tile for tile as the single-floor view. BEHIND it (farther from the camera, along the camera axis) a band of terrain geometry is added: a low PLAIN (the gap, `gap` tiles deep)
   and then the BACKDROP band, whose heights are the REAL heights of the exterior layer (the mountain section a person standing on the floor would see behind the playable space). Both are decoration: not walkable,
   the levels of their own with the palette of the Pocket decoration (`levelMeta.deco`), written only on tiles that are void in the floor's shape.
   Phase 1 scope: single floor, the Cam 1 axis (yaw 45, like the Pocket), no fog, no tone multiplier. HARD RULE: nothing hides the floor: every added tile lies behind the back edge of the floor along the axis (s < sBack), so it is
   drawn before (and under) any tile of the floor in every orthographic painter order. INVARIANT: the floor's tiles are not touched (same levels, same walking); only void tiles are written.
   Not exported to Unity. */
(function (E) {
  const B_ = E.backdrop = {};
  B_.defaults = { yaw: 45, gap: 0, depth: 9, lat0: 2, flare: 0.75, plainUp: 0.1, bayUp: 0.05, bandMin: 0.5, characterTiles: 2, mode: 'wall', height: 2, attDepth: 9, steps: 3, riser: 1, taper: 2, noise: 0 };
  B_.MODES = ['real', 'mirror', 'wall']; // real / mirror: the phase 1 diagnostic modes (kept until phase 2d); wall: the attached cavity wall (any other value of P.backdropMode is the same)
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
  /* PLAN of the ATTACHED backdrop (phases 1b, 2a, 2b: the cavity wall with a stepped profile; pure). W, H window; frag Uint8Array (1 = a tile of the floor); fragH Float32Array (height of each floor tile); extH Float32Array (real exterior
     height of each tile, NaN = none); opts { yaw, gap (0-8, 0 = no apron), attDepth (D, depth of the wall), steps (n), riser (terraces of the risers after the first), taper (tiles per step), noise (0 / 1), jump (terH), mult (Backdrop height),
     minRise (characterTiles x terH), bayH (the height of the bay tiles, slab base + 0.1 terH) }.
     OUTSIDE tiles = the tiles that are not floor and are 4-connected to the map border through non-floor tiles: the void tiles ENCLOSED by the floor (the shaft, the floor-2 opening, any inner hole) are never written.
     A tile is BEHIND the floor when a ray from its centre toward the camera (+u, step 0.25) meets a floor tile within gap + D and the three parallel rays (lateral offsets -0.7, 0, +0.7) AWAY from the camera meet none (nothing of the
     floor lies behind it, so it cannot hide any of it). d = the distance of the centre ray to the first floor tile (the local back contour), hit = that tile, base = the height of `hit`.
       APRON (part 1) d <= gap: height = base (exact). No apron when gap = 0.
       WALL  (part 2) gap < d <= gap + D, t = d - gap: STEPPED PROFILE (stylization): step k = min(n, floor(n t' / D) + 1, floor(1 + (w - e) / taper)) where t' = t minus a deterministic 0 / 1 tile when `noise` (a tile can only fall to a
              LOWER step, never rise) and e = the lateral distance of the tile to the centre of the wall, w its half-width (the taper: each step is `taper` tiles narrower per side; tiles beyond take the step below, none is removed);
              profile = mult x (minRise + (k - 1) x riser x jump); the REAL MIRROR (the exterior height at the tile reflected across the back contour, section L) is a LOWER BOUND: height = base + max(profile, mult x (mirror - base)).
              The profile is stylization, the mirror is real data placed by a reflection: `info.profileTiles` / `info.mirrorTiles` count which one decided each wall tile.
       BAY   (part 3): a void tile of the floor's own silhouette that three or more of its 4-neighbours (floor, apron or wall) enclose and that touches the floor: height = bayH (exact). It stands in front of a floor lobe, so it may cover
              the lowest 0.1 terH of that lobe's own skirt and nothing else (section M, 4).
     Returns { role (0 none, 1 floor, 2 added), part, height, u, outside, info }. */
  B_.planAttached = function (W, H, frag, fragH, extH, opts) {
    const o = Object.assign({}, B_.defaults, opts), n = W * H, yaw = o.yaw * Math.PI / 180, u = [Math.sin(yaw), Math.cos(yaw)], v = [-u[1], u[0]], gap = o.gap, jump = o.jump || 1;
    const minRise = o.minRise === undefined ? o.characterTiles * jump : o.minRise, mult = o.mult === undefined ? o.height : o.mult, D = o.attDepth, steps = Math.max(1, Math.round(o.steps)), riser = o.riser * jump, taper = o.taper, noise = o.noise ? 1 : 0;
    const role = new Uint8Array(n), part = new Uint8Array(n), height = new Float32Array(n).fill(NaN), outside = new Uint8Array(n);
    let nf = 0, fmin = Infinity; for (let i = 0; i < n; i++) if (frag[i]) { role[i] = 1; nf++; if (fragH[i] < fmin) fmin = fragH[i]; }
    const bayH = o.bayH === undefined ? fmin - 0.3 * jump : o.bayH;
    const info = { floorTiles: nf, apron: 0, wall: 0, bay: 0, profileTiles: 0, mirrorTiles: 0, noMirror: 0, enclosed: 0, maxRise: 0, maxHeight: -Infinity, gap, depth: D, mult, minRise, steps, riser: o.riser, taper, noise };
    if (!nf) return { role, part, height, u, outside, info };
    const q = []; for (let i = 0; i < n; i++) { const x = i % W, y = (i / W) | 0; if (!frag[i] && (x === 0 || y === 0 || x === W - 1 || y === H - 1)) { outside[i] = 1; q.push(i); } }
    for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !frag[j] && !outside[j]) { outside[j] = 1; q.push(j); } }
    for (let i = 0; i < n; i++) if (!frag[i] && !outside[i]) info.enclosed++;
    const at = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); return ix < 0 || iy < 0 || ix >= W || iy >= H ? -1 : iy * W + ix; };
    const ray = (x0, y0, dx, dy, max) => { for (let t = 0.25; t <= max; t += 0.25) { const j = at(x0 + dx * t, y0 + dy * t); if (j >= 0 && frag[j]) return { t, j }; } return null; }; // first floor tile along the ray
    const far = W + H, lat = [-0.7, 0, 0.7], cand = []; let lmin = Infinity, lmax = -Infinity;
    for (let i = 0; i < n; i++) { // pass 1: the tiles behind the floor
      if (frag[i] || !outside[i]) continue;
      const x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, hit = ray(x, y, u[0], u[1], gap + D + 0.5); if (!hit) continue;
      let behind = true; for (const l of lat) if (ray(x + v[0] * l, y + v[1] * l, -u[0], -u[1], far)) { behind = false; break; } if (!behind) continue;
      const d = hit.t, l = x * v[0] + y * v[1]; cand.push({ i, x, y, d, l, base: fragH[hit.j] }); if (d > gap && d <= gap + D) { if (l < lmin) lmin = l; if (l > lmax) lmax = l; }
    }
    const cl = (lmin + lmax) / 2, w = (lmax - lmin) / 2, hash = (ix, iy) => (Math.imul(ix * 73856093 ^ iy * 19349663, 2654435761) >>> 28) & 1;
    for (const c of cand) {
      if (c.d <= gap) { role[c.i] = 2; part[c.i] = 1; height[c.i] = c.base; info.apron++; continue; }
      if (c.d > gap + D) continue;
      const t = c.d - gap, t2 = Math.max(0, t - (noise ? hash(c.i % W, (c.i / W) | 0) : 0)), kDepth = Math.min(steps, Math.floor(steps * t2 / D) + 1), kLat = taper > 0 ? Math.max(1, Math.floor(1 + (w - Math.abs(c.l - cl)) / taper)) : steps, k = Math.min(kDepth, kLat, steps);
      const prof = mult * (minRise + (k - 1) * riser), mj = at(c.x + 2 * c.d * u[0], c.y + 2 * c.d * u[1]), e = mj >= 0 && extH[mj] === extH[mj] ? extH[mj] : NaN; if (!(e === e)) info.noMirror++;
      const mir = e === e ? mult * Math.max(0, e - c.base) : 0, rise = Math.max(prof, mir); if (mir > prof) info.mirrorTiles++; else info.profileTiles++;
      role[c.i] = 2; part[c.i] = 2; height[c.i] = c.base + rise; info.wall++; if (rise > info.maxRise) info.maxRise = rise; if (c.base + rise > info.maxHeight) info.maxHeight = c.base + rise;
    }
    for (let i = 0; i < n; i++) { // the bays of the silhouette
      if (frag[i] || !outside[i] || role[i] !== 0) continue; const x = i % W, y = (i / W) | 0; let cnt = 0, fl = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const r = role[ny * W + nx]; if (r === 1) { cnt++; fl++; } else if (r === 2) cnt++; }
      if (cnt >= 3 && fl >= 1) { role[i] = 2; part[i] = 3; height[i] = bayH; info.bay++; }
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
    const baseH = S.baseH !== undefined ? S.baseH : S.levelH[0] - jump, mode = P.backdropMode || (P.backdropMirror ? 'mirror' : o.mode), legacy = mode === 'real' || mode === 'mirror', pv = (k, d) => (P[k] === undefined ? d : P[k]);
    let pl;
    if (!legacy) { // the attached cavity wall (planAttached): gap, stepped profile, real mirror as a lower bound, bays
      const fragH = new Float32Array(n).fill(NaN); for (let i = 0; i < n; i++) if (frag[i]) fragH[i] = S.levelH[S.fine[i]];
      const ext0 = new Float32Array(n).fill(NaN); for (let i = 0; i < n; i++) if (!(S0.void && S0.void[i])) ext0[i] = S0.levelH[S0.fine[i]];
      pl = B_.planAttached(W, H, frag, fragH, ext0, Object.assign({}, o, { gap: pv('backdropGap', o.gap), jump, mult: pv('backdropHeight', o.height), steps: pv('backdropSteps', o.steps), riser: pv('backdropRiser', o.riser), taper: pv('backdropTaper', o.taper), noise: pv('backdropNoise', o.noise), attDepth: pv('backdropDepth', o.attDepth), bayH: baseH + pv('backdropBayUp', o.bayUp) * jump }));
    } else pl = B_.plan(W, H, frag, extH, Object.assign({}, o, { gap: pv('backdropGap', 4), jump, plainH: baseH + o.plainUp * jump }));
    let added = 0; for (let i = 0; i < n; i++) if (pl.role[i] === 2) added++; let levelsAdded = 0;
    if (added) {
      S.void = Uint8Array.from(S.void); S.fine = Int16Array.from(S.fine); // own copies: `S.void` is shared with the quantization cached on the pack (writing it in place would change the next shape built from the same pack)
      const keep = new Uint8Array(n); for (let i = 0; i < n; i++) if (pl.part[i] === 1 || pl.part[i] === 3) keep[i] = 1; // the apron, the plain and the bays keep their exact height (a snap down could go under the slab base)
      const plan = { role: pl.role, height: Float32Array.from(pl.height), decoHeight: Float32Array.from(pl.height), keep };
      levelsAdded = E.pocket.addLevels(S, P, plan).added;
      const vd = S.void; for (let i = 0; i < n; i++) if (pl.role[i] === 2) { vd[i] = 0; S.block[i] = 1; } // decoration: drawn, not walkable
      S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd[i]) S.byLevel[S.fine[i]].push(i);
      S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1;
    }
    S.backdrop = { role: pl.role, part: pl.part, u: pl.u, sBack: pl.sBack, info: Object.assign({}, pl.info, { levelsAdded, plainH: baseH + o.plainUp * jump, mode: legacy ? mode : 'wall' }) };
    return S.backdrop;
  };
})(window.EVO = window.EVO || {});
