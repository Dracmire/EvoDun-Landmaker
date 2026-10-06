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
- A zone is NOT a terrace and gives no level (not even from its mean height). The zone only defines the slice.
- Terraces always come from elevation, quantized with the GLOBAL range of the map, and are continuous across
  zone borders (a zone border limits movement, it is not a terrace edge). Micro steps come from elevation
  inside their terrace.
- Slice: one zone by default, chosen by id; several zones are optional. The rest of the map is scenery under
  the veil (starts as a single band; add a gradient only if it reads badly). Movement is restricted to the slice.
- Terrace height is global. Height is almost decorative: levels disconnect, stairs connect.
- Micro step: small, quantized height difference between platforms. You can climb 1->2 or 1->3, not 1->4.
- The world continues past the incursion border as scenery under a veil; only movement is restricted.
- Numeric fields usually come as images: a 256 image is a 256x256 matrix, 1 pixel = 1 tile, and each channel
  is a field. Images encode HSV: hue is an id codec, Value carries height; so R, G, B, A, H, S, V can each be
  assigned a role, and one image can give zone (H) and elevation (V). Categorical role: every distinct
  hue/colour is an id, black (V=0) is "outside", with no need to know the maximum number of ids. Graded
  0-255 masks (path, vegetation) are also allowed. Unity writes Y up, so loading has a "flip Y" option applied
  equally to all images of a pack.
- Baked images (Unity `EncodeToPNG`: 8-bit RGBA, non-interlaced, alpha 255): height (grey = height/1000,
  range 1-1000), zones (id by hue), edges (`BakedEdgemap.png`: black = outside, cyan = border with a pass,
  red = barrier border; categorical role `edge`, read-only/overlay until point 3 uses it for stairs).
  The PNG decoder is our own (no canvas, no premultiplied alpha) and rejects interlaced files.
- Visual target: Sea of Stars / 2D-HD readability, Unexplored 2 style stage modelling. Flat colour per
  level, gradient on cliffs, outlines. Orthographic camera with predefined angles and zoom, no free rotation.
- Same style pass for every technique so the comparison is fair.

## Criteria to judge a technique
Distinguishable levels; walkable vs not; stairs and passes locatable; recognisable landmark; readable
incursion border; stake and way-back path visible.

## Repo state
- `index.html` opens from file://, no dependencies. Own canvas 2D renderer, painter's algorithm (no three.js).
- `src/shape.js`: terrace quantization + micro steps, minimal-plateau cleanup, pass selection between
  terraces, walkable regions.
- `src/tech.js`: technique A (per-level tile outline -> simplify -> Chaikin) and B (signed distance field ->
  blur -> marching squares).
- `src/render.js`: camera, extruded walls, caps, overlays, ramps, markers. Includes Box technique (one
  column per tile) as reference.
- `src/png.js`: own PNG decoder (`E.decodePng`, raw samples per channel, 8/16 bit). `node tools/test_png.js`.
- `src/fields.js`: channels R,G,B,A,H,S,V, roles (elevation / zone / edge / path / vegetation / POI), categorical
  hue ids, manifest. `node tools/test_fields.js`. Format in `docs/pack-format.md`.
- `src/ui.js`, `src/app.html`: controls, angle presets, compare mode, multi-image loading with a role selector per
  channel, flip Y, maxnode, save pack.json. Overlays: zones, edge map, graded masks (blocky tiles, see item 1).
- `data/snake_mountain.json`: sample pack, format `evodun-pack/0.1` (width, height, row-major elevation,
  masks, markers).
- `tools/build.py` regenerates `data/packs.js`, `index.html`, `dist/viewer.html`. Run it after touching
  `src/` or `data/`.

## Known limitations
1. Overlays (snake, cave, water) are drawn as square tiles and look blocky over the smoothed A/B shapes.
2. Ramps are a one-tile plane leaning on the wall; they don't cut geometry and only draw if facing the
   camera. Passes are chosen by lowest slope and spacing, not from pipeline data (flow, A*, terrace edges).
3. Zone, edge and mask fields are read and shown as overlays only. The slice (one zone, scenery under the veil, movement
   restricted) is not implemented: the whole map is still one slice. Elevation is normalised after pre-smoothing
   over the loaded image, not yet with the raw global range (matters once a slice is cropped).
4. Technique B rounds the outer corners of the slice.
5. In compare mode the three panels are narrow in isometric views.
6. Only two built-in sources: Snake Mountain and filler noise. Missing: Shrine-Pier pack and real 256x256 maps. Roles
   were tested with synthetic images; no real Unity `EncodeToPNG` file yet (to be added under `data/samples/`).
7. Verified in headless Chromium (point 1): image loading, mouse drag/zoom/pan, the noise pack. Not
   verified: touch input, non-Chromium browsers, GPU timings. Measurements are in `docs/measurements.md`.
8. Box technique: light vertical stripes along the front edge of the slice (seen on the noise pack).
   Cause not investigated; to be fixed in point 3.

## Pending, in this order
1. (Done, PR #1) Verify item 7 and fix what fails.
2. Channel input. Done: own PNG decoder, roles per channel (R/G/B/A/H/S/V, categorical, graded), native resolution,
   `evodun-pack/0.2` manifest, edge map overlay, flip Y. Left: slice by zone id with scenery under the veil (one
   visible line on the slice border following each cap, optionally coloured by the edge map), raw global elevation
   range, sliders recalculating on release.
3. Fix items 1, 2, 4 and 8.
4. Round 2 of techniques: HD-2D layered terraces, and SDF exterior mesh for Snake Mountain only.
   Parked: RuleTile skin and modular kits.

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
