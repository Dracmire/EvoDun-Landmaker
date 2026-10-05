# CLAUDE.md

## Context
EvoDun is an SRPG with an overworld. This repo (EvoDun-Landmaker) holds a web viewer to test the
MATERIALIZATION (crystallization) of 2.5D isometric maps. The goal is NOT to generate terrain: it is to
take the same data and express it with several techniques to compare which reads best. Generation and the
old pipeline (Unity, C#) are reference only.

## Agreed design (do not change without asking the user)
- Build unit: one complete continuous slice; zones only split it.
- Hierarchy: Map -> Zone -> Room -> Platform (micro step).
- Terrace height is global. Height is almost decorative: levels disconnect, stairs connect.
- Micro step: small, quantized height difference between platforms. You can climb 1->2 or 1->3, not 1->4.
- The world continues past the incursion border as scenery under a veil; only movement is restricted.
- Numeric fields usually come as images: a 256 image is a 256x256 matrix and each channel is a field.
  Numbered zones are used as terraces (or the room level if more variety is needed).
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
- `src/ui.js`, `src/app.html`: controls, angle presets, compare mode, image loading.
- `data/snake_mountain.json`: sample pack, format `evodun-pack/0.1` (width, height, row-major elevation,
  masks, markers).
- `tools/build.py` regenerates `data/packs.js`, `index.html`, `dist/viewer.html`. Run it after touching
  `src/` or `data/`.

## Known limitations
1. Overlays (snake, cave, water) are drawn as square tiles and look blocky over the smoothed A/B shapes.
2. Ramps are a one-tile plane leaning on the wall; they don't cut geometry and only draw if facing the
   camera. Passes are chosen by lowest slope and spacing, not from pipeline data (flow, A*, terrace edges).
3. Terraces come from quantizing elevation. A zone/room/platform channel can't yet be used directly as levels.
4. Technique B rounds the outer corners of the slice.
5. In compare mode the three panels are narrow in isometric views.
6. Only two sources: Snake Mountain and filler noise. Missing: Shrine-Pier pack and real 256x256 maps.
7. Unverified: image loading, mouse drag/zoom, the noise pack. Only checked: render of the three
   techniques, two presets, overlays, mobile width.

## Pending, in this order
1. Verify item 7 and fix what fails.
2. Channel input: a pack or image can supply zone/terrace ids and masks (path, vegetation, POIs) in
   addition to elevation.
3. Fix items 1, 2 and 4.
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
