# Crystallizer 4 - Tiles to Curves (Unexplored 2 style)

## 1. Status

CLOSED (PR #17, #18). PHASE 1 (PR #17): technique C, three presets, wall dressing. PHASE 2, THE WALL PASS (PR #18): T3 (default, extrusion 0.25, D22) and T2 (alternative) as blocks built OUTWARD on the lower ground in front of the walls of technique C. The vertical pass (old phase 2, D6-D9) stays not approved and not built. Nothing is exported to Unity (03-stage D15).

## 2. Goal

Take the same tile data and give it the organic plan shape of Unexplored 2: one Voronoi seed per tile, seeds at level corners displaced by rules, the cells of the displaced seeds give the plan contour of every level. The walls of the elevations are the main interest
(D1, D2): the plan boundary between cells of different levels is extruded and dressed. The question it answers: does this plan shape, with a dressed wall, read better than the tile-exact Box, the smoothed A and the distance-field B?

## 3. References

- Ludomotion devlog "Tiles to Curves" (https://www.ludomotion.com/blogs/tiles-to-curves/): one Voronoi seed per tile; corner tiles shift seeds (own + 4 orthogonal neighbours), shifts are cumulative, small random jitter, displacement capped (40 % of a tile in the devlog); tiles with
  artificial structures are not displaced; cliffs get hand-made 3D assets and rocks at their base. The devlog does NOT describe how walls are built: the wall rules here are ours (from the mocks).
- Candidate libraries (LICENCE TO BE CONFIRMED before adding anything, none is used now): Delaunator (JS) for the viewer, delaunator-sharp (MIT) and Clipper2 (BSL-1.0) for Unity. The viewer clips the cells with its own Sutherland-Hodgman (no library).

## 4. Decisions

(dates as given by the user; never rewritten)
- **D1** (2026-10-10) Crystallizer 4 = Tiles to Curves (Unexplored 2). Main interest: the walls of the elevations.
- **D2** (2026-10-10) Walls are wanted: the plan boundary between cells of different levels is extruded and dressed.
- **D3** (2026-10-10) The extreme Voronoi look is liked; iterative passes kept. Presets chosen per map: Ordered = E, Balanced = D, Natural = F. Variants A and H are debug only.
- **D4** (2026-10-10) Exemptions (no displacement): ramps / stairs, Ascension walls, Cake rooms. Landmarks need nothing extra.
- **D5** (2026-10-10) The vertical pass is a phase 2, after the planar part.
- **D6** (2026-10-11) Phase 2 rules agreed so far: walkable floor intact (no extrusion over the lower terrace, lip of the upper terrace intact; yielding 15-25 % was the maximum the user would accept and it is not worth it), subtractive only (inward); purpose: emergent spaces in tall walls
  (e.g. a bench in an irregular recess).
- **D7** (2026-10-11) Phase 2: fixed block width, large (about 2 tiles: a long wall about 20 rocks, a short one about 5), with a minimum width.
- **D8** (2026-10-11) Phase 2: contiguous pieces with the same depth form ONE mass; no isolated slits, grooves or holes.
- **D9** (2026-10-11) Phase 2 keeps two candidate techniques, not decided: T1 nested masses (each height pass removes a contiguous, irregular mass that stays removed below and grows; a pass may fail; profile like 5-4-3-3-2, a "tower"; a second Voronoi pass un-squares the contour) and T2 predefined
  wall-surface Voronoi blocks moved as groups through N height passes (5-10). Depth limit: 20 % of the thickness of the mass.
- **D10** (2026-10-11) Crystallize the planar part now; phase 2 stays open (the user researches Unexplored 2 further).
- **D11** (2026-10-11, implementation, user's answers to the plan) The corner rule keeps the geometry of the approved mocks: u = unit vector from the vertex to the tip centre; tip += u * max; opposite -= u * max. BOTH seeds move AWAY from the vertex ("towards the vertex" in the brief was a wording
  error). The chamfer exists: once the tip moves away, the vertex is closer to the two orthogonal neighbours (same level as the opposite), which eat the tip's convex corner. `opposite += u * max` would be a different, stronger chamfer that nobody has seen. No orthogonal-neighbour shift; jitter is added
  after all the corner shifts, then the cap.
- **D12** (2026-10-11) `meander` is a diagnostic parameter only (`P.meander`, default 0, no UI, no manifest, in no preset). Box keeps a flat normal per face in the wall dressing. Walls under 0.5 terH are not dressed (base rocks stay at jumps of 1.5 terH or more). Compare mode becomes
  Box | A | B | C in a 2 x 2 grid. Window-edge vertices get no corner rule (known limit). The painter order of the foot and the rocks (right after the wall, in the turn of the lower band) is accepted.

- **D13** (2026-10-11) Technique 1 (nested masses) is DISCARDED. It lost clearly in the reviewer's mocks.
- **D14** (2026-10-11) Technique 3 is the DEFAULT wall technique (the Unexplored 2 look): a cliff band of Voronoi blocks with strata fusion. "If I had to pick for Unexplored 2, technique 3."
- **D15** (2026-10-11) The EXTRUSION SCALE of technique 3 is a design control and "very relevant". Small extrusion (10-25 % of the band of the reviewer's mock 4) makes walls read as walls. It is a slider (0.10-0.40, default 0.25; the parameter goes to 1.0 in tests).
- **D16** (2026-10-11) Technique 2 (Voronoi blocks on the wall surface moved by groups in N height passes) is KEPT as an alternative for implementations that need massive groups to shape the stone ("Sea of Stars: give a 'face' to the stone by deforming the Voronoi blocks, probably with more jitter").
  The fusion step is good for T3, NOT for T2: T2 has no fusion step, and its mock looked too fused (long horizontal bands).
- **D17** (2026-10-11) D6 revised: the upper floor and its lip stay intact; the wall band is built OUTWARD on the edge of the lower terrace. Visual only: walking, regions, gates and ramps do not change.
- **D18** (2026-10-11) D7 (fixed large blocks of about 2 tiles) and D9 (T1 / T2 undecided) are superseded by D13-D16.
- **D19** (2026-10-11, confirmed by the user) The wall pass is part of technique C's geometry, because it needs sub-tile resolution. Box, A and B do not get it. The wall DRESSING stays the same pass for all four techniques. In compare mode the band is therefore shown only in C; "Wall pass: Off" gives the like-for-like view.
- **D20** (2026-10-11, user's answers to the phase 2 plan) T3 is the default selection, and Off must be pixel-identical to PR #17's C (regress, 0 differences). The pieces of an atom are clipped to the LOW-SIDE C cell: the parts of a prism inside the upper terrace would not always be hidden by its cap near the lip
  (the claim "its cap hides them" does not hold there), so no clipping toward the lip is needed afterwards. Carry-overs of PR #17: the foot strip of the dressing uses the per-segment normal plus a fill sector at convex vertices (vertex normals folded the strips into streaky fans at sharp corners, Natural, Cam 6;
  it changes Box / A / B / C pixels only at the foot and only with the dressing on); the rock threshold stays at 1.5 terH (the real map at 5 terraces has no jump that large: max 1.00 terH, 0 edges; at 7 terraces spread 1.5 `middle`: 801 edges, 108 of 2.2 or more); `displace()` uses `k = round(1 / cell)` and `passes <= 3` is checked.
- **D21** (2026-10-11, review of PR #18, judged at 70 px per tile on the real map, Stage settings, Natural, dressing on, near tile (89.5, 73.7), Cam 1 and Cam 6) VISUAL FOLLOW-UP, picked here: (1) the block faces take the shading of the slab wall behind them: the gradient of the BAND of the slab wall (levelH[m - 1] .. levelH[m], one sub-quad per band) instead of one gradient per face, so the same colour at the same height, the foot darkening included; with the dressing on, the same smoothed shade (vertex normals along the ring) and the strata at absolute heights, so they continue across the faces. The foot strip and the rocks stay on the lower cap at the base of the SLAB wall (not relocated to the prism base; known limit).
  (2) Thin ledge tops: PICKED "fill, no outline" (not "merge into the face below"): a ledge is filled with the upper cap colour x 0.92 and a stroke in the fill colour that only closes the seams; the full-height tops keep the silhouette line (they continue the cap). (3) The thin dark plate at the upper right of the Cam 6 shot was a TINY FULL-HEIGHT ISLAND: three atoms of the low-side cell with areas 0.023, 0.04 and 0.036 (K = 5, `lip`, H = 1.5 terH, near (96.0, 68.2), a spur end), all s = K. The sliver rule only looked at s < K, so full-height islands of any size survived and stood as a free-standing plate in front of the end of the wall. A final cleanup after the rounds gives a full-height island of area < FULLMIN = 0.15 tile^2 the s of its neighbour with the longest shared border (then the support rule). The real map has a continuous spread of them (median 0.04-0.08 before the extrusion), so the cleanup removes many small teeth: faces on the real map at 5 / 7 / 12 terraces 2354 / 6622 / 13666 -> 755 / 4992 / 9558.
  (4) The thin-island figure is reported for walls of 1.5 terH or more only (on H = 1 walls it is dominated by the narrow band); the all-walls figure is kept as `thinAll`.
- **D22** (2026-10-12, user's verdict on PR #18) DEFAULT CONFIRMED: wall pass T3, extrusion 0.25, FULLMIN = 0.15 tile^2. No code change; T2 stays as an alternative (D16).


## 5. Design

### Technique C (`src/curves.js`, `E.loopsC`)
- **Grid**: one seed per tile of the built window, at the tile centre, in tile units. Level of a seed = `S.fineMask` (void = -1, not drawn, as in A and B). EVERY hash uses whole-map coordinates (`S.ox + x`, `S.oy + y`, pass, index, axis), so changing the slice does not reshuffle the jitter.
- **Corner rule** (D11), per pass, for every grid vertex shared by 4 cells: if 3 of them have the same level and the 4th (the tip) differs, `u` = unit vector from the vertex to the tip centre (the diagonal); `tip += u * max`, `opposite -= u * max` (the seed diagonally across the vertex).
  Equality = same fine level (sub-terrace steps count as different). 2 + 2 splits, checkerboards and three different levels have no tip. Shifts accumulate over all vertices.
- **Jitter**: after all the corner shifts, per seed uniform in [-j, j] on each axis, `j = jit * (1 + jitTall * min(jumpTerH, 3))`, `jumpTerH` = largest height difference to a land 4-neighbour / terH (jitTall = 0: constant jitter). Then the TOTAL displacement vector is clamped to `max` (units of the cell of the pass).
- **Passes**: pass p > 1 rasterises the cells of pass p - 1 at 2x resolution; each sub-cell takes the LEVEL and the OWNER TILE of the nearest seed of the previous pass (= the Voronoi cell it lies in), then the same rules run on the finer grid. Two passes = 4 seeds per tile. The owner tile is what `E.cellTileAt` returns (picking).
- **Cells**: the cell square clipped by the bisectors (Sutherland-Hodgman, no library) against a block of neighbours; only the cells that have a neighbour of another level are built (the others give no contour). The brief says 3 x 3 when `max <= 0.42` and 5 x 5 above; measured on the real map, 3 x 3 with the
  Balanced preset (max 0.40) misses 3 of 72 817 edges (14 of 5 405 point tests), so the 5 x 5 block is used from `max > 0.25` (every preset), and with it the test finds none.
- **Presets** (selector "Curves preset", manifest `viewer.curves`, default `ordered`, written only when it is not the default):

  | preset | passes | max | jit | jitTall | mocks |
  |---|---:|---:|---:|---:|---|
  | Ordered | 1 | 0.55 | 0.10 | 0 | E |
  | Balanced | 2 | 0.40 | 0.25 | 0 | D |
  | Natural | 2 | 0.50 | 0.10 | 1.2 | F |

  The user chooses the preset per map (orderly maps E, natural chaotic maps F). Presets A and H of the mocks are not offered.
- **meander** (diagnostic): value-noise offset (amplitude 1.6 * meander tiles, 0.12 per tile) added to the first-pass seeds before the cap, which is raised to 0.5. Default 0: identity.
- **Exemptions** (seed not displaced, no jitter, in every pass; the sub-cells of an exempt tile are exempt): the tiles of ramp / stair footprints (`S.carved`) and their 1-tile ring, both tiles of every Ascension wall face, the Cake ring tiles. Landmarks need nothing. One ring is enough for a
  TILE-EXACT footprint: a seed 2 tiles away moved by at most 0.55 reaches 0.225 into the ring tile, never the footprint. `P.anchor === false` (diagnostic) switches the exemption off.
- **Output**: `E.loopsC(S, L, P)` = closed loops of the region `{fine >= L}` as the union of the cells (outward normal (dy, -dx), like A and B); the Voronoi edges are built once per shape (pair i, j + endpoints), bucketed by the levels they separate, chained per level with a 1e-5 tolerance;
  level L + 1 is nested in level L by construction. The cache key is `curves : anchor : meander` and the cache lives on `S`: toggling rooms, Cake, Ascension walls or a slider builds a NEW shape (`invalidate(true)` -> `E.shape`, empty `S.cache`), so the exemptions can never be stale.
- C is visual only: walking, regions, stake, route, gates and ramps do not change. Pick: a cap pixel resolves to the tile of the cell under it (`E.cellTileAt`).

### Wall dressing (switch "Wall dressing", Display, off by default; the SAME pass for Box, A, B and C)
One function (`dressWall`, `dressFoot` in `src/render.js`), never in the pick renders, never on ramp / stair walls, only on cliffs of 0.5 terH or more:
- **Shading** by the plan normal, smoothed along the contour: a gradient between the shades of the two vertex normals (A / B / C). Box keeps the flat normal per face.
- **Strata**: thin darker lines every 0.34 terH at absolute heights (so they continue across the stacked bands of A / B / C), a small wobble that follows the world position, a slightly different tone per stratum.
- **Lip**: lighter band on the top 0.22 terH of the wall (at most 40 % of it) and a dark line at its edge; only on the top band of a cliff.
- **Foot**: darkening of the LOWER cap within 0.55 tile of the wall foot, scaled by the jump. **Base rocks**: on cliffs of 1.5 terH or more, count = round(len * (jump >= 2.2 ? 2.6 : 1.6) * (0.6..1.4)), radius 0.09-0.21 tile (x 1.25 for tall jumps), height 1.25 * radius, offset outward 0.3-0.8 radius;
  placeholders (domes). They do not repeat the art contract stones (03-stage D19), which sit on the TOP cap edge.
- **Painter order**: foot and rocks are drawn right after the wall, in the turn of the lower band (Box: in the turn of the lower tile, after its cap), so a wall drawn later cannot cover them and nearer things drawn later do.
- Outlines at depth discontinuities are unchanged. The info line counts walls, strata, lips, foot strips and rocks per technique.

### Wall pass of C (`src/wallc.js`, `E.wallc.get(S, P)`; selector "Wall pass (technique C)": T3 default / T2 / Off)
Blocks built OUTWARD on the lower ground in front of every wall; the slab wall of C stays behind them, the upper floor and its lip are intact (D17). Visual only. The blocks are faces (vertical quads with an outward normal) and tops (polygons at a height) grouped by the upper level `hi`; `renderLevels` draws them in the pass of level `hi`,
after the walls of that level and before its cap, sorted by depth with the walls. Not selectable (the pick render never sees them). Side faces take the cliff colour of the upper level and the dressing when it is on (no foot: the base is not on the lower cap); ledge tops (0 < s < K) take the upper cap colour x 0.92, full-height tops the upper cap colour, separated by the outline.
- **Walls**: every Voronoi edge of C with a jump of 0.5 terH or more (the threshold of the dressing), H = the jump in tiles; edges next to an exempt cell (ramp / stair footprints + 1 ring, Ascension faces, Cake rings) are dropped, and so is every atom piece that touches an exempt tile: the band is interrupted. "The nearest higher ground IS the terrace a" holds by construction: a low point is tied to the nearest wall edge of its own level.
- **T3 atoms**: a jittered grid of 0.5 tile (jitter +-0.3 of the cell, hashed by whole-map coordinates), cells = Voronoi of the seeds (3 x 3 neighbours), each cell clipped to the LOW-SIDE C cell of level lo (convex x convex with the same Sutherland-Hodgman, no library): the pieces of an atom. `E.curves.cellPolygon` and `E.curves.clip` are shared with C.
- **T3 band**: mean distance of the pieces (7 sample points each) to the wall edges < 0.35 H, with all the samples tied to the same upper level; u = mean / (0.35 H); an atom touches the lip when one of its edges lies on a wall edge. Columns: coarse Worley (spacing 1.2, slider) on the lip point. Strata K = max(2, round(jumpTerH * 3)) (slider 2-4).
  Column profile (hashed): buttress 0.20, step 0.55, recess 0.25 with the formulas of the mock, off = U(-0.25, 0.25). SUPPORT RULE after every change. FUSION, at most 20 rounds: (a) a sliver (s < K and area < 0.30 tile^2) or a thin island (area / border < 0.10) takes the s of the neighbour with the longest shared border; (b) an island over LMAX = 3.6 tiles
  (columns * column width) has its middle column lowered by 1; then the support rule again. Block top = lower ground + H * s / K.
- **T3 extrusion** (D15): `v' = lip(v) + (v - lip(v)) * extrude`, the same mapping for every vertex (shared vertices stay shared, edges are cut every 0.5 tile from a canonical end). The layout along the wall does not change, only the depth. NOTE: the band is 0.35 H deep by MEAN distance and the atoms are accepted whole, so the far vertices of an atom reach about 0.45 tile beyond:
  the world depth is at most (0.35 H + 0.45) * extrude (measured), not 0.35 H * extrude. At 0.25 and H = 1 that is about 0.2 tile, 11 px at 55 px per tile.
- **T2** (D16, NO fusion): the wall edges of one (lo, hi) are chained; lateral seeds every 0.9 tile (jittered by `T2 jitter`, default 0.4, higher than the atoms' 0.3), NP = 6 height passes (5-10) with jittered row boundaries per lateral cell; groups = coarse 1D Worley (1.0 tile); depth level per (group, pass) in 0..3 with p = 0.35 / 0.25 / 0.25 / 0.15,
  depth = level / 3 * maxDepth, maxDepth = 0.35 H * extrude; block = lateral cell footprint from the lip out to its depth, z in its row; overhangs allowed; the end faces only where the neighbouring block of the same row is shallower.
- **Cache**: `S.cache['Cw:' + curves key + '|' + wall key]`; the key has the mode and EVERY wall parameter; the wall sliders only redraw. Manifest: `viewer.wallPass`, `wallExtrude`, `wallStrata`, `wallColumn`, `t2Spacing`, `t2Rows`, `t2Group`, `t2Jitter`, written only when they are not the default.

## 6. Viewer vs Unity

The viewer computes the seeds, the cells and the contour polylines per level and draws the dressing as placeholders. For Unity (later, nothing is exported now): one Voronoi pass per level on the tile grid (the same rules, deterministic by world coordinates), the wall as an extruded strip along the
contour, the strata / lip / foot as a wall material, the rocks as a prefab scattered with the same counts and sizes.

## 7. Verification

`tools/verify.sh` (all parts) on the final commit: node 25 scripts PASS; ui 285 PASS / 0 FAIL; regress PASS, 131 images, 0 differences (single-technique pixels are the ones of main with C unselected and the dressing off; the `dress` switch toggled on and off is identical; the tech bar had to keep one row for that:
the labels are now Box / A · Contour / B · Distance / C · Curves); zbuf PASS (ramp order of C included); shots PASS (125 images, 75 of them the `curves` extra).

- `node tools/test_curves.js` (30 checks): corner rule (tip and opposite move away, along the diagonal, by max; a lone tile cancels), cap respected in every seed of the three presets, determinism, exempt seeds and their pass-2 sub-cells unmoved (11 752 / 47 008 exempt cells on the real map), the footprint and its ring exempt,
  the loops of every level enclose exactly the cells of level >= L (5 405 point tests per preset) and level L + 1 is nested in L, `E.cellTileAt` = owner of the nearest seed, the interior of a slice has the whole-map seeds (away from ramps), exemption sources (Ascension faces, Cake rings, `P.anchor`), `meander` 0 = identity.
- STAIR SURVIVAL (`tools/ui/test_curves_ui.js`): 100 % with every preset, nothing lost, nothing degraded: Shrine-Pier x4 (28 ramps / 29 steps) and the synthetic map zone 6 at 12 terraces (97 ramps / 100 steps), Ordered, Balanced and Natural.
- RAMP PAINTER ORDER against the z-buffer (`test_ramp_ui.js --tech C`, 5 terraces, spread 1; mean / worst % of the ramp's pixels that differ): cut clean 0.00 / 0.01, cut mixed 0.00 / 0.02, fill clean 0.00 / 0.08, fill mixed 0.01 / 0.17 (A: 0.00-0.02 / 0.4, B: 0.02-0.14 / 1.0).
  The presets give the same figures, because a ramp is inside its exempt footprint.
- PICKING against the z-buffer (`test_pick_ui.js`, share of cap / ramp points that resolve to the reference tile; C is MEASURED, not enforced: the tile shown is the cell owner): ramps 98.6 % (A 100, B 100), steps 97.5 % (A 100, B 100), ramps without smoothing 93.4 % (A 99.7, B 99.8).
- WALL DRESSING against the Box id render (`tools/ui/test_dress_ui.js`, Shrine-Pier x4 in the Stage preset, 36 px per tile; anchors of foot strips / rocks: visible in the reference and changed / hidden in the reference but changed ("shows through") / visible but not changed ("missing")):
  Box oblique 50: foot 41 / 0 / 0, rocks 47 / 0 / 0; Box iso 45: 63 / 9 / 0, 63 / 9 / 0; Box stage: 11 / 0 / 0, 18 / 3 / 0. A, B and C: shows-through 2-18 % of the foot strips and 10-40 % of the rocks (C worst: iso 45 foot 98 / 16 / 0, rocks 42 / 16 / 0; stage rocks 13 / 10 / 0), missing 0-4 pieces.
  Part of "shows through" is legitimate (the dome of a rock peeks over a lower wall, edge pixels); the figures are a measurement, not a threshold. A / B / C are compared with the TILE geometry of Box.
- COLD COST (`tools/ui/measure_curves.js 2`, headless Chromium, software rasteriser +-30 %; cold render of one technique with an empty contour cache, ms; A / B / C Ordered / C Balanced / C Natural):

  | source | terraces | A | B | C ord. | C bal. | C nat. |
  |---|---:|---:|---:|---:|---:|---:|
  | synthetic maps, zone 6 | 5 | 23 | 397 | 72 | 296 | 147 |
  | synthetic maps, zone 6 | 12 | 69 | 1086 | 104 | 492 | 587 |
  | synthetic maps, whole | 5 | 208 | 1648 | 375 | 653 | 704 |
  | synthetic maps, whole | 12 | 345 | 4324 | 577 | 1474 | 1281 |
  | real map, whole | 5 | 585 | 2095 | 738 | 1456 | 1328 |
  | real map, whole | 12 | 1293 | 5506 | 1284 | 2768 | 2619 |

  Compare (Box | A | B | C, cold, from the slider release; first panels = shape + Box + A / all four), Ordered / Balanced / Natural: synthetic zone 6, 5 terraces 230 / 875, 228 / 1048, 214 / 986 ms; 12 terraces 241 / 1430, 265 / 1749, 256 / 1826; synthetic whole, 5 terraces 971 / 3661, 890 / 4300, 892 / 4370;
  12 terraces 1355 / 6814, 1311 / 7985, 1352 / 8647; real map whole, 5 terraces 1917 / 6439, 1899 / 7556, 1928 / 7367; 12 terraces 3362 / 11084, 2792 / 13936, 3073 / 14193. C is a late panel like B ("computing…"); B stays the most expensive technique.
- CHANGED EXPECTATIONS (consequence of the 2 x 2 compare): `tools/ui/test_compare_ui.js` (4 panels, 2 x 2 grid, no columns / rows selector; the pending panels are B and C; coverage text of B and C; four clicks) and `tools/ui/test_pocket_ui.js` (compare draws four panels). `test_ramp_ui.js` and `test_pick_ui.js` list C; `test_ramp_ui.js` skips
  its "no smoothing" pass for C. Nothing was loosened for A, B or Box.
- Screenshots (`tools/verify.sh shots --extra curves`): the five fixed-set sources (real map Default and Balanced types, Shrine-Pier, Shrine-Pier x4, Snake Mountain surface) with C in Ordered / Balanced / Natural, dressing off / on, Cam 1 Iso and Cam 6 Stage; Box, A and B with the dressing on (Iso). Cam 7 was not shot.
- NOT verified: touch input, non-Chromium browsers, GPU timings; frame cost of the dressing on the real map; pick of C against A / B for the walkable semantics near displaced cell borders (up to 0.55 tile); the dressing with Pocket / Cake combined.

### Phase 2 (wall pass of C)

- `node tools/test_walls_c.js` (16 checks): determinism, support rule (109 atoms), strata range, u in [0, 1), no piece on exempt tiles or void, band depth <= (0.35 H + atom reach 0.45) * extrude (also at extrude 1.0; the bound includes the reach because atoms are accepted whole by MEAN distance), cache key, T2 without fusion and with depth levels per (group, pass) (levels 1 : 2 : 3 = 0.38 : 0.39 : 0.23 normalised on the real map), whole-map hashing (1786 atoms compared).
- FUSION FIGURES (T3, Natural, extrude 0.25; islands before -> after, slivers, thin only for walls >= 1.5 terH (all walls in brackets), tiny full-height islands, over LMAX, rounds; after D21): real map 5 terraces 1568 -> 85, slivers 1066 -> 0, thin 0 -> 0 (1225 -> 1), tiny full-height 417 -> 0, 1 round, 755 faces; real map 7 terraces (Stage) 3526 -> 460, slivers 2636 -> 5, thin 155 -> 0 (1994 -> 3), tiny full-height 433 -> 0, over LMAX 2 -> 2, 20 rounds, 4992 faces;
  real map 12 terraces 8079 -> 957, slivers 6011 -> 11, thin 9 -> 0 (5097 -> 9), tiny full-height 1119 -> 0, over LMAX 5 -> 2, 20 rounds, 9558 faces; Snake surface 5 / 7 terraces 136 -> 21 / 486 -> 112; Shrine-Pier x4 7 terraces 559 -> 119, slivers 424 -> 1, thin 89 -> 0, over LMAX 0 -> 1 (max span 4.8). Fusion often stops at the 20-round cap without converging (measured, not enforced); the final cleanup can re-merge islands, so over LMAX is 2 on the real map at 7 terraces (0 before D21).
- Z-BUFFER (`tools/ui/test_wallc_ui.js`, ray-marched solid reference, MEASURED, not enforced; mean % differing / mean % beyond the 1 px edge band): T2 at 40 px per tile, 7 terraces spread 1.5: oblique 49.6 / 5.2, iso 49.6 / 8.4, Cam 6 41.5 / 13.0 (worst 14.6), Cam 7 26.0 / 2.1. T2 overhangs are not a heightfield, so part of the mismatch is the reference model, not an order error.
- COLD COST (`tools/ui/measure_wall.js`, ms, software rasteriser +-30 %, one run): T3 / Off 1.2-1.9x at 5 terraces and 1.7-2.0x at 12 terraces (real map, whole map; Ordered 741 -> 1427 and 1557 -> 3168, Balanced 1950 -> 2376 and 3040 -> 6000, Natural 1581 -> 2431 and 3250 -> 5530). T3 roughly doubles C at 12 terraces. T2 is cheaper than T3.
- `tools/ui/test_wallpass_ui.js`: default T3, T3 / T2 / Off three pictures, Box / A / B pixel-identical in every mode, sliders only redraw, pick render never sees the blocks, manifest writes only non-default values and rejects wrong ones. `regress` keeps C at `wallPass: 'off'`, so Off is pixel-identical to phase 1.
- Review shots of D21: `tools/ui/wall_spot.js <outDir>` (real map, Stage settings, Natural, dressing on, 70 px per tile at (89.5, 73.7), Cam 1 and Cam 6, T3 0.25 / 0.40, T2 0.25, Off).
- Screenshots (`tools/verify.sh shots --extra wallpass`): x4, Snake surface, real map Default and Balanced, Cam 1 / 3 / 6, T3 0.10 / 0.25 and T2 0.25, dressing off / on, fitted and at 60 px per tile on a camera-facing wall. Cam 7 not shot.

## 8. Mocks (the reviewer's throwaway scripts, outside the repo: a Node ray-marched heightfield on Shrine-Pier x4, Snake Mountain surface and the real map)

- planar passes and presets: kept (E, D, F);
- rugged vs smooth: kept as presets;
- meander (reviewer's extra, not approved): kept as the diagnostic parameter;
- vertical v1-v3 noise notches / small stones / micro-grooves: rejected (blotches, lines);
- per-course bricks with the lip kept: read as erosion;
- T2 full blocks moving the lip: strong silhouette, but it breaks the floor (D6);
- floor-intact columns: almost invisible from cameras with pitch 50;
- nested masses: structure verified in plan slices, depth capped at about 0.5 tile on Snake by the 20 % rule, not readable in the mock renderer.
Known limit: the mock renderer itself.

## 9. Known limits and open questions

- Window-edge vertices have no neighbours outside the window, so they get no corner rule: the shape at the slice border can differ from the whole-map shape (it lies in the veiled scenery). The interior of a slice has the whole-map seeds (`tools/test_curves.js`).
- Pick with C: the tile shown is the owner of the cell, which lies up to 0.55 tile from the tile under the point, so against the reference tile (Box geometry) C scores below A and B (measured, not enforced; section 7).
- The dressing is tile-exact on Box and follows the contour on A / B / C; where a wall is cut per tile (next to a ramp) the vertex shades are not smoothed. The wobble of the strata and the stones are placeholders.
- OPEN: the vertical pass (phase 2, D6-D9); whether the foot and the rocks should be clipped to the lower cap (today a foot strip can reach a neighbouring cell of another level inside 0.55 tile).
- WALL PASS: the band depth bound includes the atom reach (0.45 tile); the dressing foot and rocks are not relocated to the prism base; fusion often hits the 20-round cap; the z-buffer mismatch under Cam 6 is higher than under the ortho cameras; T2 overhangs are not a heightfield; on the real map at 5 terraces the walls are weak (H = 1, depth about 0.09 tile at 0.25) and there are 0 rocks. Compare shows the band only in C; Off gives the like-for-like view.
- WALL PASS, from the reviewer's pass of PR #18 (D21 / D22): (1) narrow full-height tops still draw as outline-only lines in Cam 6 (the ledges are filled, the full-height tops keep the silhouette line); (2) T3 leaves stretches of wall without a band (atoms accepted only below 0.35 H by mean distance, exempt tiles, and the cleanup of tiny full-height islands); (3) the foot strip and the rocks of the dressing are not relocated to the base of the blocks (they stay at the base of the slab wall behind them).
- NOTE FOR LATER (T2): T2 repeats the same shape at different heights, because every row of a lateral cell shares the same lateral footprint and only the depth varies (`buildT2`). Possible fix: vary the lateral boundaries per row. T3 does not have this problem and reads better, so T2 stays an alternative (D16, D22).

## 10. Camera contract

Made for **Cam 6 Stage** and **Cam 1 Iso** (the mocks used a perspective FOV 30 pitch 25, an orthographic pitch 50 and a top view at pitch 80). See section 7 for what was tried in the viewer.
