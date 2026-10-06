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
  Each remaining group is a gate; every terrace edge outside a gate is blocked. The user's "same room" condition is
  omitted (no rooms). One stair per gate at the centroid, several in long gates (stair spacing), retry on the
  next tile if the carve fails. EXTENSION OF OURS (not in the user's code): steps inside a terrace steeper than the
  climb limit use the same rule with the sub-terrace as the unit, in groups of their own.
- Stair footprint: terrain stays smooth, but the footprint of a stair is rigid (exact per tile) in Box, A and B, with
  its own colour and outline, the same in all three techniques and visible from all four sides. Survival
  is measured as the percentage of each tile area that is well covered by the drawn contours.
- RAMP instead of treads (user's decision): terraces are general, so the transition is not quantized. Each gate is a
  smooth ramp inside its rigid footprint, linear from the height of the lower terrace to the upper one. Default style
  `ramp`; `steps` (treads with bridge levels) stays as an option. Ramp length = max(min length, ceil(gap / max slope)),
  default max slope 0.4 height per tile (~22 deg) and minimum 2 tiles (sliders). With ramps there are no bridge levels and
  no `tread` parameter (they only exist in `steps`). Movement does not change. Look: stone colour with a gradient along
  the slope (lighter at the high end), dark outline, own side walls; same in Box, A and B. Cue 2 (approved): 2-3 thin transverse lines across the
  slope, Display switch "Ramp cross lines" (on). `stairW = 0` (slider minimum) switches stairs off, which
  also lets the pixel regression compare against older checkouts.
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
  Everything is saved in the manifest. Landmarks are manifest markers; POI stays a mask.
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
  `node tools/test_slice.js`, `node tools/test_stairs.js`, `node tools/test_gates.js`, `node tools/test_ramp.js`.
- `src/tech.js`: technique A (per-level tile outline -> simplify -> Chaikin) and B (signed distance field ->
  blur -> marching squares).
- `src/render.js`: camera, extruded walls, caps, overlays, markers. Stairs (steps) are terrain; ramps have their own surface renderer. Includes Box technique (one
  column per tile) as reference.
- `src/png.js`: own PNG decoder (`E.decodePng`, raw samples per channel, 8/16 bit). `node tools/test_png.js`.
- `src/fields.js`: channels R,G,B,A,H,S,V, roles (elevation / zone / edge / path / vegetation / POI), categorical
  hue ids, manifest. `node tools/test_fields.js`. Format in `docs/pack-format.md`.
- `src/ui.js`, `src/app.html`: controls, angle presets, compare mode, multi-image loading with a role selector per
  channel, flip Y, maxnode, save pack.json, slice controls (zone chips, crop, scenery margin). Sliders recompute on
  release. Overlays: zones, edge map, graded masks (blocky tiles, see item 1).
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
1. Overlays (snake, cave, water) are drawn as square tiles and look blocky over the smoothed A/B shapes.
2. Carved stairs and ramps: each is cut into the upper terrace (or built up on the lower one) as 1-3 columns
   (width default 2; in `steps` style the tread rise defaults to the climb limit, 1 is also available).
   RAMP PAINTER ORDER: Box orders ramps by tile depth and matches a per-pixel z-buffer reference exactly (0 % in 8 view
   directions). A and B order by level, so a ramp that spans several levels can lose slivers: a cut ramp is drawn right
   after the slab of its low end, a built-up one right before the slab of its high end, and slab walls beside a ramp
   are clipped to its surface. Measured over all 73 ramps of the relief test map (`tools/ui/test_ramp_ui.js`): mean
   0.1-1.2 % of the ramp's pixels, worst 7.8 % (two ramps that touch). Thresholds in the test: mean <= 2 %, worst <= 8 % (accepted by the user as a LIMITATION OF THE LEVEL-ORDERED PAINTER; the full solution is per-pixel depth, left for WebGL in round 2). The footprint is rigid: in A the vertices
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
4. Slice border: tile-exact for all techniques (not smoothed like A/B shapes); the veil is a single band and the border
   line is one colour (to be coloured by the edge map, visual only). In Box, the line and veil are drawn per
   tile and look rougher than in A/B. **The border line comes out broken (dashed) in B**: to fix in the visual-border
   step. Stairs outside the slice are not generated (scenery has no stairs).
5. Technique B rounds the outer corners of the slice.
6. In compare mode the three panels are narrow in isometric views.
7. Only two built-in sources: Snake Mountain and filler noise. Missing: Shrine-Pier pack and real 256x256 maps. Roles
   were tested with synthetic images; no real Unity `EncodeToPNG` file yet (to be added under `data/samples/`).
8. Verified in headless Chromium only: image loading, mouse drag/zoom/pan, roles, slice. Not
   verified: touch input, non-Chromium browsers, GPU timings. Measurements are in `docs/measurements.md`.
9. Box technique: light vertical stripes along the front edge of the slice (seen on the noise pack).
   Cause not investigated.
10. The climb limit (2 sub-terraces) is a provisional assumption, not the micro-step rule.
11. Partial connection: with the user's gate criterion many regions stay unconnected (e.g. 14 regions, the largest 55 % of the slice in one test). KNOWN LIMITATION, on purpose: the global connection will come from the rooms and the numeric world; a connection step here would be filler code. No connection step is added.

## Pending, in this order
1. (Done, PR #1) Verify the first limitations.
2. (Done, PR #2) Channel input: own PNG decoder, roles per channel, native resolution, `evodun-pack/0.2`,
   slice by zone id and/or crop with a veil, sliders recalculating on release. Missing: a real Unity
   `EncodeToPNG` sample in `data/samples/`.
3. Base solid before anything new. In this order: (1) carved stairs on a level ranking by height, sub-terraces
   renamed and up to 6, stair width, survival check in A and B (done); gate placement, rigid stair footprint and ramp (done, to be reviewed); (2) visual slice border from the edge map;
   (3) stake, objectives and shortest route (click, manifest); (4) compare mode; (5) overlays that follow the
   smoothed A/B shapes; (6) outer corners of B; (7) Box line and stripes. Test scripts live in `tools/ui/`.
4. Round 2 of techniques: HD-2D layered terraces, and SDF exterior mesh for Snake Mountain only.
   Parked: RuleTile skin and modular kits, room types.

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
