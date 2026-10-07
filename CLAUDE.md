# CLAUDE.md

## Context
EvoDun is an SRPG with an overworld. This repo (EvoDun-Landmaker) holds a web viewer to test the
MATERIALIZATION (crystallization) of 2.5D isometric maps. The goal is NOT to generate terrain: it is to
take the same data and express it with several techniques to compare which reads best. Generation and the
old pipeline (Unity, C#) are reference only.

## Agreed design (do not change without asking the user)
- Build unit: one complete continuous slice; zones only split it.
- Hierarchy: Map -> Zone -> Area -> Room -> Platform (micro step). A zone is a biome or country with many
  heights inside, meant as ONE incursion bounded by natural barriers (from the watershed). An Area is a
  terrain type inside a zone (city, swamp, desert, beach). A 256x256 map has 6-16 zones. `area` and `room`
  are reserved categorical roles in the pack format; there are no images for them yet and nothing uses them.
- Terraces are a mesoform (zone/area level): X big terraces and Y sub-terraces with a small height difference.
  MICRO STEPS belong to room and platform, come from the discovery, and there is no data for them today: a
  reserved concept (like the `room` and `platform` roles), not implemented. The viewer never calls anything a
  micro step.
- A zone is NOT a terrace and gives no level (not even from its mean height). The zone only defines the slice.
- Terraces always come from elevation, quantized with the GLOBAL range of the map, and are continuous across
  zone borders (a zone border limits movement, it is not a terrace edge). Sub-terraces come from elevation
  inside their terrace.
- Slice: one zone by default, chosen by id; several zones are optional. The rest of the map is scenery under
  the veil (starts as a single band; add a gradient only if it reads badly). Movement is restricted to the slice.
- Height spread (user's decision): the jump between terraces can grow away from the CENTRAL terrace (the one with most
  tiles on the whole map, never the slice): jump j -> j+1 = terH*(1+(spread-1)*T(min(d-1,2))), d = distance of the jump from
  the centre, T = 0,1,3. spread 1 (default) = uniform and changes no pixel; 1.5 gives 1, 1.5, 2.5, 2.5, ... Sub-terrace height
  keeps using terH (the smallest jump), so the climb condition holds in every jump. Ramp length limit is computed
  (>= 8 tiles; 8 is enough for spread <= 1.5 at slope 0.4). `node tools/test_spread.js`.
- VOID (user's decision): elevation <= 0 is not terrain. Not drawn (Box, A and B: `S.void`, `S.fineMask`), not walkable, in no level; terraces are quantized over the
  land only (`E.landFill`: void takes the nearest land value, range = lowest..highest land). Always on, whatever the rooms switch. `tools/test_void.js`, `tools/ui/test_void_ui.js`.
  The synthetic test maps never use 0 (gen_maps.py clips grey to >= 1).
- Terrace height is global. Height is almost decorative: levels disconnect, stairs connect.
- Sub-terraces: small, quantized height differences inside a terrace (1 to 6 per terrace in the viewer). Climb
  limit: up to 2 sub-terraces of difference without a stair. This is PROVISIONAL, an assumption of the user and not
  the micro-step rule; it is a viewer parameter (default 2). Steeper differences need a stair, inside a terrace
  as well as between terraces. The effective sub-terrace height is limited so that the gap from the last
  sub-terrace to the next terrace stays above climb*subH by half a sub-step (`E.subHeight`).
- Stairs are carved into the terrain (levels are a ranking by height, so every technique gets the same geometry);
  stair width is a parameter (1-3 tiles, default 2); the edge map plays no part in placing them.
- Where stairs go: GATES, a transcription of the user's EDunProcGen.cs (NormalizeHeightsPerTerrace,
  ComputeTerraceSlopeMap, FindRankedTerraceTransitions, FilterConnectedTerraceTransitions), on the WHOLE map and the
  RAW elevation, then clipped to the slice. Per terrace t: min/max of the raw elevation over its tiles,
  norm_t = (h-min)/(max-min) on t and 0 elsewhere (range <= 0.0001 -> 1); slope = sqrt(dx^2+dy^2) with central
  differences *0.5 on the whole norm_t (neighbours of other terraces count 0; the 1-tile map frame is skipped).
  For each 4-neighbour pair exactly one terrace apart, pos = the LOW tile; transition if slope_tLow[pos] -
  slope_tHigh[pos] > threshold (0.05, no absolute value); each pos once. Transitions are grouped by 4-connectivity
  (all together, not per terrace pair) and groups smaller than the minimum (3, the user's choice) are dropped.
  DEVIATION FROM THE USER'S CODE: each terrace is normalized with its NOMINAL band of the global elevation range, clamped
  to 0..1, not with the min/max of its tiles. In the viewer the pre-smoothing and the plateau cleanup move a few tiles
  into a terrace whose raw height is far outside its band; on the user's 12-terrace map 124 of 6469 and 50 of 2574 such
  tiles stretched terraces 6 and 7 by 3.7x and 3.2x and left the 6-7 border without gates. With the band, gates per
  border come back (`tools/test_gates.js`, `tools/diag_gates.js`).
  Each remaining group is a gate; every terrace edge outside a gate is blocked. The user's "same room" condition is
  omitted (no rooms). One stair per gate at the centroid, several in long gates (stair spacing), retry on the
  next tile if the carve fails. EXTENSION OF OURS (not in the user's code): steps inside a terrace steeper than the
  climb limit use the same rule with the sub-terrace as the unit, in groups of their own.
- Stair footprint: terrain stays smooth, but the footprint of a stair is rigid (exact per tile) in Box, A and B, with
  its own colour and outline, the same in all three techniques and visible from all four sides. Survival
  is measured as the percentage of each tile area that is well covered by the drawn contours.
- RAMP instead of treads (user's decision): terraces are general, so the transition is not quantized. Each gate is a
  smooth ramp, SHORT AND WIDE, linear from the height of the lower terrace to the upper one. Default style `ramp`; `steps`
  (treads with bridge levels) stays as an option. The depth into the terrace is FIXED (slider "Ramp depth", 1-4, default 2) and does
  not depend on the jump, so the slope is jump / depth and can be steep (height is almost decorative); there is no maximum slope.
  Width = "Stair / ramp width" slider (0-5, default 3; steps use up to 3), widened from the centre outwards; every column must lie
  on the SAME border between the two terraces (fixed end on the lower one, path on the upper one); a lateral column may find the cliff of ITS OWN column up to `depth` tiles further along (or back) the path and is then placed there (shift d,
  surface re-anchored per column, a wall between neighbouring columns where the surfaces differ), always between the same two terraces; a column that
  does not fit stops its side, so the ramp narrows. Measured on the relief test map, 12 terraces, width 3: 93 of 108 ramps narrowed without the shift,
  86 of 104 with it (mean columns 1.74 -> 2.01; width 5: 105 -> 99); 5 terraces: 42 -> 33 of 72. What still stops a column (diagnostic): the
  upper-terrace tile of that column is LOWER than the ramp surface (a lower sub-level, 64 % of the stops), the end tile (16 %), another terrace (15 %),
  or tiles already used by another stair (5 %). Relaxing the first needs the surface of a column to follow its own end height: not done. A ramp can span more wall than its gate. With ramps there are no bridge levels and no `tread`.
  Movement does not change. Look: stone colour with a gradient along the slope (lighter at the high end), dark outline, own side
  walls, transverse lines whose number grows with the jump (round(jump / 0.3), 2-10; Display switch "Ramp cross lines", on): a steep
  ramp reads as a flight of steps. Same in Box, A and B. `stairW = 0` switches stairs off (also for the pixel regression).
- Terrain edges are NOT touched (user's decision): A keeps its stepped border (more legible) and B the smooth one (more
  natural). Both techniques are kept to compare them.
- The world continues past the incursion border as scenery under a veil; only movement is restricted.
- Numeric fields usually come as images: a 256 image is a 256x256 matrix, 1 pixel = 1 tile, and each channel
  is a field. Images encode HSV: hue is an id codec, Value carries height; so R, G, B, A, H, S, V can each be
  assigned a role, and one image can give zone (H) and elevation (V). Categorical role: every distinct
  hue/colour is an id, black (V=0) is "outside", with no need to know the maximum number of ids. Graded
  0-255 masks (path, vegetation) are also allowed. Unity writes Y up, so loading has a "flip Y" option applied
  equally to all images of a pack.
- Baked images (Unity `EncodeToPNG`: 8-bit RGBA, non-interlaced, alpha 255): height (grey = height/1000,
  range 1-1000), zones (id by hue), edges (`BakedEdgemap.png`). The PNG decoder is our own (no canvas, no
  premultiplied alpha) and rejects interlaced files.
- Edge map (from the user's TopdwnGrid.cs): cells on the border between watershed ZONES; each has a partner in
  the neighbouring zone, so edges sit on BOTH sides of the limit. Values: 1 barrier (height difference with the
  partner above a threshold that depends on the height band), 0 pass (not above it; passes extend 1-3 px
  inward), -1 no edge. In the image: black = no edge, cyan = pass, red = barrier. In the game they are cosmetic
  or used for fog of war (in inhabited places they may become walls, rarely a fissure). They are NOT a movement
  rule and not used to place stairs. In the viewer they are VISUAL only: each face of the slice border is
  classified with the edge map and drawn red solid (barrier) or cyan dashed (pass), with the counts in the info.
  No crossing rules between zones; walls and fissures are out of scope.
- Stake and objectives: the stake is the entry point of the incursion, placed at the start by clicking in the
  viewer; heroes return to it at the end, sometimes as an escape race. One or more objectives (resistance
  points) are also placed by click. The viewer draws the shortest walkable route from each objective to the
  stake inside the slice, using the stairs; if there is none the info says so. Same in all three techniques.
  Everything is saved in the manifest (`evodun-pack/0.3`: `stake {x,y}`, `objectives [{x,y,label?}]`, tiles of the whole map).
  Landmarks are manifest markers; POI stays a mask. Viewer: buttons Place stake / Add objective / Remove / Clear, Esc
  cancels; the click resolves to the VISIBLE tile with the same renderer (`E.pickTile`: an id render where every surface
  has a code colour; A/B caps are level codes turned into a tile by unprojecting onto the plane of their level), so
  heights, occlusion and ramps are respected in Box, A and B in every preset (`tools/ui/test_pick_ui.js` against a
  per-pixel z-buffer: 99.2-100 % of cap/ramp points, naive picker 4-25 %). Route = BFS over the same edges as the regions
  (`E.route`, `tools/test_route.js`); with no route the info names both regions (R1 = id 0...), their tile counts, the
  closest approach between them (`E.regionGap`) and how many gates touch both without a ramp.
- Visual target: Sea of Stars / 2D-HD readability, Unexplored 2 style stage modelling. Flat colour per
  level, gradient on cliffs, outlines. Orthographic camera with predefined angles and zoom, no free rotation.
- Same style pass for every technique so the comparison is fair.

## Criteria to judge a technique
Distinguishable levels; walkable vs not; stairs and passes locatable; recognisable landmark; readable
incursion border; stake and way-back path visible.

## Repo state
- `index.html` opens from file://, no dependencies. Own canvas 2D renderer, painter's algorithm (no three.js).
- `src/shape.js`: slice (zones and/or crop, window = bbox + scenery margin), terrace quantization with the global
  elevation range + sub-terraces, minimal-plateau cleanup, stair sites, carved stairs (levels are a ranking by
  height with bridge levels), walkable regions (only inside the slice, connected only by stairs).
  `node tools/test_slice.js`, `node tools/test_stairs.js`, `node tools/test_gates.js`, `node tools/test_ramp.js`, `node tools/test_spread.js`, `node tools/test_border.js`, `node tools/test_route.js`.
- `src/tech.js`: technique A (per-level tile outline -> simplify -> Chaikin) and B (signed distance field ->
  blur -> marching squares).
- `src/render.js`: camera, extruded walls, caps, overlays, markers. Stairs (steps) are terrain; ramps have their own surface renderer. Includes Box technique (one
  column per tile) as reference.
- `src/png.js`: own PNG decoder (`E.decodePng`, raw samples per channel, 8/16 bit). `node tools/test_png.js`.
- `src/fields.js`: channels R,G,B,A,H,S,V, roles (elevation / zone / edge / path / vegetation / POI), categorical
  hue ids, manifest. `node tools/test_fields.js`. Format in `docs/pack-format.md`.
- `src/rooms.js` (rooms ON = `P.rooms`, off by default; `E.rooms.layer(pack, P)` caches the whole-map chain in stages; `E.shape` then takes the gates from the tree: `computeGatesRooms`, `tools/test_gates_rooms.js`, `tools/ui/test_rooms_ui.js`, cold cost `tools/ui/measure_rooms.js`): minimal rooms chain with the patched connection (no UI, no render; `node tools/test_rooms.js`, `node tools/rooms_check.js`); `tools/rooms_original.js` = the user's rules as written, comparison only.
- `src/ui.js`, `src/app.html`: controls, angle presets, compare mode, multi-image loading with a role selector per
  channel, flip Y, maxnode, save pack.json, slice controls (zone chips, crop, scenery margin). Sliders recompute on
  release. Overlays: zones, edge map, graded masks (blocky tiles, see item 1).
- `reference/`: the user's C# generator `EDunProcGen.cs` (READ-ONLY, not built, not run, not edited) and `README.md` with the function index.
- `data/samples/skeleton_heightmap_256.png`: the user's REAL height map (8-bit RGBA, grey, 32 % pure black = void; lowest terrain value 17).
- `data/snake_mountain.json`: sample pack, format `evodun-pack/0.1` (width, height, row-major elevation,
  masks, markers).
- `tools/ui/`: headless UI tests (`test_roles.js`, `test_slice_ui.js`, `test_stairs_ui.js`), pixel regression
  (`regress.js` + `compare.js`, `EVO_ROOT` tests an older checkout), ramp painter order against a z-buffer
  (`test_ramp_ui.js`), screenshots (`stairs_shots.js`, `gates_shots.js`, `ramp_shots.js` four directions), cold-cost
  measurement (`measure.js`). Need Playwright and Pillow, see `tools/ui/common.js`; maps from `gen_maps.py`;
  `node tools/test_heights.js` checks the effective sub-terrace height.
- `tools/build.py` regenerates `data/packs.js`, `index.html`, `dist/viewer.html`. Run it after touching
  `src/` or `data/`.

## Known limitations
1. PARKED. Overlays (snake, cave, water) are drawn as square tiles and look blocky over the smoothed A/B shapes.
2. Carved stairs and ramps: each is cut into the upper terrace (or built up on the lower one) as 1-3 columns (ramps 1-5)
   (width default 2; in `steps` style the tread rise defaults to the climb limit, 1 is also available).
   RAMP PAINTER ORDER: Box orders ramps by tile depth and matches a per-pixel z-buffer reference (<= 0.04 % mean, <= 3.2 % worst).
   A and B order by level, so the ramp is CUT BY LEVEL BANDS: every ramp tile is split where its surface crosses the height of a level,
   and each piece is drawn in the pass of the level at the top of its band, sorted by depth together with the walls of that level and
   before its cap; slab walls beside a ramp are clipped to its surface. (Earlier orders drew the WHOLE ramp in one pass: after the low slab,
   before the high slab, and two variants; the banded cut is a different one and the first that is clearly better.) Measured with
   `tools/ui/test_ramp_ui.js` (`--terraces N --spread S`; mean / worst % of the ramp's pixels that differ from the z-buffer, default smoothing):
   (mean range over the four ramp kinds / worst %): 5 terraces spread 1: Box 0 / 0, A 0.00-0.02 / 0.4, B 0.02-0.14 / 1.0 (before the cut: A 0.1-0.7 / 3.6,
   B 0.2-0.8 / 4.1). 5 terraces spread 1.5: Box 0 / 0.2, A <= 0.02 / 0.4, B 0.07-0.16 / 1.3. 12 terraces spread 1: Box 0 / 0, A 0.02-0.13 / 4.3,
   B 0.16-0.61 / 5.0 (before: A <= 3.0 / 30, B <= 3.6 / 32). 12 terraces spread 1.5: Box <= 0.05 / 3.3, A 0.01-0.09 / 4.2, B 0.91-3.39 / 79
   (before: A 1.8-4.0 / 42, B 2.8-6.3 / 41). The 2 % / 8 % threshold is reached in every configuration EXCEPT B with 12 terraces and spread 1.5,
   so the test still ENFORCES only the reference (5 terraces, spread 1: Box exact, A and B mean <= 2 %, worst <= 8 %) and the rest is measured.
   The worst case left (B, 12 terraces, spread 1.5, `--only 5 --px 45`) is a ramp almost hidden behind a peak: the smoothed B slab contour is not
   the tile-exact edge of the reference, so about 1000 px of ramp that the reference hides are drawn (a smoothing mismatch, not an order error).
   Accepted; the full solution is per-pixel depth, left for WebGL in round 2. The footprint is rigid: in A the vertices
   of every contour edge that touches a carved tile are pinned through the Chaikin passes; in B the unblurred distance
   field replaces the blurred one within 0.5 tile of a carved tile (fading out by 1.5 tiles). Terrain away from the
   stairs is smoothed as before. Look (`render.js`): own cream colour with a tint per tread, light line on the top edge
   of each riser, dark outline on the flanks, risers and flanks tinted, identical in Box, A and B. The info line gives
   the stair coverage per technique (share of each tread tile's area inside contour(L) and outside contour(L+1), 4x4
   samples; stair lost if the mean of a tread is below 0.5, degraded if a tile is below 0.9): 100 % with the footprint,
   and `P.anchor = false` (diagnostic) switches it off to show what the smoothing does without it. Lateral columns may
   start on any terrace (diagonal cliffs); a stair that fits neither as cut nor as build-up is dropped and counted.
3. A selected zone that is not 4-contiguous only produces a warning (pieces, largest piece); it is not corrected.
   B costs about 3 s cold at 24 terraces (36 levels) on a 256x256 map; sliders recompute on release.
4. Slice border: drawn per tile face, tile-exact and identical in Box, A and B (not smoothed like the A/B shapes), coloured
   from the edge map, visual only: red solid if the slice tile or its partner (the tile across the face, read in the whole
   map) is a barrier; cyan dashed (dash restarts per face) if one is a pass and none a barrier; yellow if neither is
   marked; white at the map edge. Counts by colour in the info. The veil is a single band. In Box, the veil is drawn per
   tile and looks rougher than in A/B. The old "dashed in B" was not reproduced after drawing by face: A and B show 95-97 %
   of the faces that Box shows (hidden ones are covered by higher terrain), measured in `tools/ui/test_border_ui.js`; the
   same measurement on the previous code gave 93-97 % for A and B, so the cause was never isolated. Stairs outside the slice
   are not generated (scenery has no stairs).
5. PARKED. Technique B rounds the outer corners of the slice.
6. Compare mode (Box | A | B, on by default): ONE camera for all panels (same px per tile, fitted to the first panel, same point of the map; wheel zoom,
   pan and presets move all of them), two layouts, Columns and Rows, chosen automatically (Rows in isometric presets) with a manual selector;
   Box and A are painted as soon as they are ready and B afterwards, with "computing…" in its panel (`tools/ui/test_compare_ui.js`). At zoom 1 Rows is
   NOT larger than Columns in Iso (2.64 vs 3.14 px per tile: the panel is 219 px tall); its advantage is the wide strip when zooming in. Cold time to
   the first panels / to all three (`tools/ui/measure_compare.js`, 5x3, 12x3, 24x3 terraces): zone 6: 0.17 / 0.60 s, 0.22 / 1.24 s, 0.34 / 2.2 s; whole
   map: 0.78 / 2.8 s, 1.3 / 6.0 s, 1.7 / 10.2 s. Moving the camera does not recompute (cached contours). POSSIBLE IMPROVEMENT (not done, user's call):
   a cursor synchronised across panels (hover resolves the visible tile with `E.pickTile` and marks it in the others). B is not split by levels.
7. Only two built-in sources: Snake Mountain and filler noise. Missing: Shrine-Pier pack and real 256x256 maps. Roles
   were tested with synthetic images; no real Unity `EncodeToPNG` file yet (to be added under `data/samples/`).
8. Verified in headless Chromium only: image loading, mouse drag/zoom/pan, roles, slice. Not
   verified: touch input, non-Chromium browsers, GPU timings. Measurements are in `docs/measurements.md`.
9. PARKED. Box technique: light vertical stripes along the front edge of the slice (seen on the noise pack).
   Cause not investigated.
10. The climb limit (2 sub-terraces) is a provisional assumption, not the micro-step rule.
11. Partial connection: with the user's gate criterion many regions stay unconnected (e.g. 14 regions, the largest 55 % of the slice in one test). KNOWN LIMITATION, on purpose: the global connection will come from the rooms and the numeric world; a connection step here would be filler code. No connection step is added.
12. PENDING, NOT FIXED (found while porting the user's rooms chain): `ClassifySlopeMap` calls Void any tile with slope <= 0 WITHOUT a height test, and the
    slope normalization (min/max, after the power) includes the coast. On a map with a black void the steepest values are on the coast (exponent 1, real map:
    1099 of the 1100 tiles with normalized slope >= 0.6 touch the void), so thresholds inland depend on the coast. `src/rooms.js` forces h <= 0 to Void and keeps the
    user's normalization; a decision (exclude the coast from the range?) is still to be taken with the user.

## Pending, in this order
1. (Done, PR #1) Verify the first limitations.
2. (Done, PR #2) Channel input: own PNG decoder, roles per channel, native resolution, `evodun-pack/0.2`,
   slice by zone id and/or crop with a veil, sliders recalculating on release. Missing: a real Unity
   `EncodeToPNG` sample in `data/samples/`.
3. Base solid before anything new. In this order: (1) carved stairs on a level ranking by height, sub-terraces
   renamed and up to 6, stair width, survival check in A and B (done); gate placement, rigid stair footprint and ramp (done, to be reviewed); (2) visual slice border from the edge map (done);
   (3) stake, objectives and shortest route (click, manifest) (done, to be reviewed); (4) compare mode (done, PR #4; pixel regression against the
   commit before it, stairW=0, 25 images, 0 differ). BASE CLOSED here. PARKED, not implemented, by the user's decision (their maps carry no
   masks and these are finishes that do not change the comparison): (5) overlays that follow the smoothed A/B shapes (known limitation 1);
   (6) outer corners of B (limitation 5); (7) Box line and stripes (limitation 9). Test scripts live in `tools/ui/`.
4. NEXT STAGE: ROOMS (user's decision). Port to the viewer the minimal chain of the user's `reference/EDunProcGen.cs` (`SequenceA`: slope
   classes, rooms by watershed, room edges, cores, A* between cores with a spanning tree; terrace gates already exist and are reused)
   with the connection PATCHED (a transition is an undirected PAIR of neighbouring tiles; one passability function for scan, A* and fills;
   the two tiles of a transition pair are never forbidden; unassigned tiles go to the nearest room before edges are searched), and CHECK it on
   the real map `data/samples/skeleton_heightmap_256.png` BEFORE building anything on top: cores joined in one tree with the original rule
   (transcribed as is) vs the patched rule, plus an overlay (rooms, transitions, cores, tree). Value 0 is VOID (outside the terrain), never low
   terrain. NOT in this stage: room types, platforms, render changes. Status: DESIGN APPROVED; chain + patch + check implemented (`src/rooms.js`,
   `tools/rooms_original.js`, `tools/rooms_check.js`, `tools/test_rooms.js`, results in `docs/rooms.md`); waiting for the user's review of the figures and the PNG
   overlays before anything is built on top. The patch adds, by the user's decision: a pair (transition or gate) with a Steep tile is dropped; the core centre is
   its free tile nearest the centroid. Parameters come from the user's scenes mapGen_forge (base) and ConicalTown (second check), all script arguments.
   User's decision after the first check: lax gates (transStrict 0.05, min 3) are only CANDIDATES; a gate or room transition is USED only when a path of the
   spanning tree crosses it, the rest is discarded. Terraces are quantized over the LAND only (void takes the nearest land value, range = lowest..highest land) in
   the check script, not yet in the viewer. Measured in `tools/rooms_check.js` (`--coreSweep`, `--crossCosts`); DECIDED: minimum core size 20, gate crossing cost 10 (both to become viewer sliders: core 5-80, cost 0-40; transStrict 0.05 and gate minimum 3 by default when rooms are on).
   Integration into the viewer: design proposed, waiting for approval (rooms switch, used gates only, exact crossing pair, void, slice by rooms, room borders, route by the tree).
   DECIDED for the integration (user): sub-terraces are only visual with rooms on; the tree is GLOBAL (computed once on the whole map, cached) and a slice keeps the
   connections whose paths stay inside it plus the minimum extra ones to join what the cut separated (Kruskal from those components; "patch" ramps exist only while
   that slice is chosen and get another tone); room transitions are OPEN (all valid ones, used or not) and only borders that are not a transition block; unused
   terrace gates are closed (cliff). Six commits: (1) void + land quantization [done], (2) rooms layer + switch + sliders [done], (3) used gates -> ramps at the exact pair, sub-terraces visual [done, PR], (4) slice by rooms + patch connections [done],
   (5) room borders + overlay [done], (6) route by the tree [done] (PR); all in the viewer, off by default, see `docs/rooms.md` "In the viewer".
   CONNECTIONS MUST STAY WALKABLE (user's decision, fix of PR #6): every tree connection (global and slice patch) must be walkable end to end in the FINAL walking graph (E.route).
   Mechanism (`carveStairs` + `checkConnections`, `S.conns`, `S.connInfo`): the tiles of the tree paths are reserved; a ramp may occupy one only if the path walks it along the
   ramp (links: bottom -> treads -> top of a column, or between adjacent columns); variants in order: cut into the upper terrace, built on the lower, depth 1 of each, lateral
   columns out (narrower). If none fits, the connection is recomputed over the carved graph with the same crossing cost; what is still not walkable is NOT forced: it is counted and
   named in the info. The tree itself, the candidate gates and the look of the ramps are untouched. `P.rampKeep = false` is the old behaviour (diagnostic). Not a full-connectivity rule.
   `tools/test_conns_rooms.js`, `tools/diag_connections.js`.
   ISOLATED TERRAIN (user's rule, rooms on, measured on the WALKABLE regions of the final graph, `classifyWalk` in `shape.js`): MAIN = the largest region (of the slice, if there is one);
   ISOLATED = any other region with fewer tiles than the slider "Isolated limit" (20-1000, default 100): decorative, NOT walkable, not counted as a region, takes no ramp (a ramp that
   would end entirely in isolated terrain is not built) and no stake or objective (refused with the reason); it is drawn as normal terrain with the "not walkable" tone, the same as the
   forbidden margins of the layer (walls, cliffs, Steep), identical in Box, A and B, Display switch. EDGE PROBLEM = any other region with the limit or more tiles: NOT hidden and NOT
   connected; it stays walkable, gets a magenta warning outline (Display switch) and the info names it (size, place, what separates it: ramp, terrace gate without ramp, room border
   without transition...). Info: "Walkable N tiles (X % of the land) - isolated: K regions, M tiles - edge problems: J regions (sizes)". `tools/test_walk_rooms.js`.
   LAST FIX COMMIT OF PR #6 (changing Terraces 3-8 / ramp depth, user's decisions):
   (1) MERGE BY passGap is conditional: a pair merged into a ramp at another pair (or whose own ramp was carved at an alternative pair of its gate) is only kept
   so if the connection that crosses it has a route after the recompute; otherwise that pair gets its OWN ramp (`S.makeSite`, or `site.exact` = no alternative pairs) and the
   whole slice is carved again (at most 6 times, from the tree paths, not from an earlier recompute; all connections are checked again after each carve; `S.unmerged`,
   `S.exactRetry`, `S.retryBroke` = neighbour paths broken by a retry, 0 in every measured case). The only reason a connection can stay without route is "gate pair whose ramp did not fit"
   (tried at its own pair, with all variants, and failed), named in the info. (2) START CORE (DEVIATION from the user's `ChooseStartingCore`, user's decision): the scan starts from
   the group of cores with the MOST cores under the same passability (tie: more tiles); other groups are not connected and stay unreachable (`R.startGroups`; `P.rScanFirst` = old
   rule, diagnostic only). `tools/rooms_check.js` numbers shift slightly with it. (3) Ramp depth ladder: depth, depth-1, ... 1 at full width, then the same with the lateral columns out.
   (4) The edge-problem outline is ELECTRIC BLUE dashed (white was confused with the white slice border at the map edge); in a slice the cause "no path inside the slice (what it would join lies outside it)".
   Diagnostic flags `rampKeep`, `noUnmerge`, `rScanFirst` are not in the UI or the manifest (like `P.anchor`). `node tools/diag_connections.js --table` prints terraces 3-8 before / after.
   KNOWN LIMIT (documented, not fixed): with 10 and 12 terraces the rooms passability fragments by itself (66 and 138 groups, forbidden margins 34-40 % of the land): the rooms method
   is meant for 2-5 terraces. ClassifySlopeMap (limitation 12) goes in a SEPARATE PR after this one; approved first option: empty neighbour = the tile's own height, Void by height <= 0,
   min/max range over land without void in its 3x3 (shore stays walkable up to the edge).
   POSSIBLE IMPROVEMENT (not done, user's call): loops for the terrace gates only (room transitions already give alternative routes on flat ground).
   Diagnosis of why corridors do not connect: `reference/README.md` (corrected after running a transcription; verification in `docs/rooms.md`).
5. PARKED (user's decision): round 2 of techniques (HD-2D layered terraces, SDF exterior mesh for Snake Mountain; per-pixel depth/WebGL),
   RuleTile skin and modular kits, room types, platforms.

## How to work with the user
- Do not write code until the design is agreed. For each point: read the relevant code, propose the
  approach in a few lines, wait for approval.
- Reply in Spanish. Code, comments and README in English.
- User is a computer engineer, intermediate game dev, mostly Unity/C#. Say when something will be ported
  to Unity later.
- Libraries / GitHub repos are allowed if they save time; state which one and its licence before adding.
- Verify every change visually (headless browser screenshot, at least two presets) before calling it done,
  and report what was and wasn't checked.
- Small commits on main with descriptive messages.
