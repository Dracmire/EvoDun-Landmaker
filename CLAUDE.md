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
  stair width is a parameter (1-3 tiles, default 2). Site selection is the existing heuristic (lowest slope,
  spacing); the edge map plays no part in it.
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
  elevation range + sub-terraces, minimal-plateau cleanup, pass selection between terraces, walkable regions (only
  inside the slice). `node tools/test_slice.js`.
- `src/tech.js`: technique A (per-level tile outline -> simplify -> Chaikin) and B (signed distance field ->
  blur -> marching squares).
- `src/render.js`: camera, extruded walls, caps, overlays, ramps (to be replaced by carved stairs), markers. Includes Box technique (one
  column per tile) as reference.
- `src/png.js`: own PNG decoder (`E.decodePng`, raw samples per channel, 8/16 bit). `node tools/test_png.js`.
- `src/fields.js`: channels R,G,B,A,H,S,V, roles (elevation / zone / edge / path / vegetation / POI), categorical
  hue ids, manifest. `node tools/test_fields.js`. Format in `docs/pack-format.md`.
- `src/ui.js`, `src/app.html`: controls, angle presets, compare mode, multi-image loading with a role selector per
  channel, flip Y, maxnode, save pack.json, slice controls (zone chips, crop, scenery margin). Sliders recompute on
  release. Overlays: zones, edge map, graded masks (blocky tiles, see item 1).
- `data/snake_mountain.json`: sample pack, format `evodun-pack/0.1` (width, height, row-major elevation,
  masks, markers).
- `tools/ui/`: headless UI tests and pixel regression (Playwright + Pillow, see `tools/ui/common.js`);
  `node tools/test_heights.js` checks the effective sub-terrace height.
- `tools/build.py` regenerates `data/packs.js`, `index.html`, `dist/viewer.html`. Run it after touching
  `src/` or `data/`.

## Known limitations
1. Overlays (snake, cave, water) are drawn as square tiles and look blocky over the smoothed A/B shapes.
2. Ramps are a one-tile plane leaning on the wall; they don't cut geometry and only draw if facing the
   camera (replaced by carved stairs in point 3, step 1).
3. A selected zone that is not 4-contiguous only produces a warning (pieces, largest piece); it is not corrected.
   B costs about 3 s cold at 24 terraces (36 levels) on a 256x256 map; sliders recompute on release.
4. Slice border: tile-exact for all techniques (not smoothed like A/B shapes); the veil is a single band and the border
   line is one colour (to be coloured by the edge map, visual only). In Box, the line and veil are drawn per
   tile and look rougher than in A/B. Stairs outside the slice are not generated (scenery has no stairs).
5. Technique B rounds the outer corners of the slice.
6. In compare mode the three panels are narrow in isometric views.
7. Only two built-in sources: Snake Mountain and filler noise. Missing: Shrine-Pier pack and real 256x256 maps. Roles
   were tested with synthetic images; no real Unity `EncodeToPNG` file yet (to be added under `data/samples/`).
8. Verified in headless Chromium only: image loading, mouse drag/zoom/pan, roles, slice. Not
   verified: touch input, non-Chromium browsers, GPU timings. Measurements are in `docs/measurements.md`.
9. Box technique: light vertical stripes along the front edge of the slice (seen on the noise pack).
   Cause not investigated.
10. The climb limit (2 sub-terraces) is a provisional assumption, not the micro-step rule.

## Pending, in this order
1. (Done, PR #1) Verify the first limitations.
2. (Done, PR #2) Channel input: own PNG decoder, roles per channel, native resolution, `evodun-pack/0.2`,
   slice by zone id and/or crop with a veil, sliders recalculating on release. Missing: a real Unity
   `EncodeToPNG` sample in `data/samples/`.
3. Base solid before anything new. In this order: (1) carved stairs on a level ranking by height, sub-terraces
   renamed and up to 6, stair width, survival check in A and B; (2) visual slice border from the edge map;
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
