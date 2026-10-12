# Crystallizer 5 - Floors (a multi-floor macroform: Snake Mountain with an open crater shaft and 2 interior floors)

## 1. Status

IN PROGRESS. Step B (data, pack format, `elevFrame`, tests) done; the Floors view (single floor, exploded stack, cutaway) is not built yet. Nothing is exported to Unity.

## 2. Goal

Compose N stacked heightmaps of ONE landmark and present them three ways, reusing Box / A / B / C unchanged. The question it answers: can a multi-floor macroform be read from its 2.5D maps (exterior, floors, the link between them)?
Not the SDF exterior (deferred, it may become a later crystallizer): no volume representation, no WebGL.

## 3. Decisions

- D1 The mountain is hollow along a central vertical SHAFT, open at the top as a CRATER (a sheer pit, r 2.5 around (20.5, 20.5), dug from the plateau at ~7.4 down to floor 1). The shaft replaces the serpent tube as the link between floors: an intentional deviation from GDD 4.1 (the serpent only gives the exterior, the floor-height reference and the head anchor). No rooms layer inside the floors.
- D2 Floors are sectional heightmaps (a horizontal section of the exterior solid), NOT zones (a zone is a slice of one map). Two floors at z = 3.6 and 5.2, no third floor (the section at z ~ 6 has ~110 tiles; not requested).
- D3 The derived package is `data/snake_mountain_floors.json` (`tools/derive_snake_floors.py`, numpy only, reproduces the JSON bit for bit, reads only `data/snake_mountain_surface.json`). `snake_surface` is untouched (default source and regression baseline). The pack declares a viewer block `{ terraces: 5, minPlateau: 5 }`: choosing the source sets both.
- D4 GLOBAL height frame: every layer carries the package's `elevFrame` (the surface range 1.256 .. 9.115) so terrace heights agree between floors. `quantize` in `src/shape.js` honours it ONLY when present (also where the map has void); without it nothing changes (`elevRange` behaviour untouched; `tools/test_floors.js` compares the terraces with origin/main).
- D5 The head `H` is the high end of the spiral, (22, 16), in THIS pack only; the source pack keeps (29, 26) (the inverted end from the spreadsheet). `W`, `P`, `E` stay where they are (placed for the old head); the semantic-landmark stage will resolve it. The head is a semantic anchor, not built here.
- D6 The link is a STRAIGHT RADIAL TONGUE (see section 5), a further simplification of the approved "ramp in an arc"; the arc and the spiral stay as later improvements.
- D7 Number reference: an earlier estimate of the centre height (5.1) came from the cave-carved composite, not from the repository. The pure surface has 7.41 at (20.5, 20.5), a plateau of 7.0-7.5 up to r ~ 4 and the crest (9.1) at r 5-6; there is no basin, so the crater is dug. Section areas (z + 1, shell 1.5, shaft r 2.5): z = 3: 289, z = 4: 223, z = 5: 161 tiles.

## 4. Data (derivation rules)

- Exterior = the surface with the shaft pit (tiles whose centre is within 2.5 of the axis lowered to z1 = 3.6).
- Floor k = the tiles with exterior >= z_k + 0.15 + 1.0 (roof margin counted from the highest floor tile), eroded by a shell of 1.5 tiles; shaft void in floor 2, floor 1 keeps the disc as the flat pit bottom; deterministic bumps <= 0.15 (zero in the link box). Floor 1: 264 tiles, floor 2: 136; floor 2 lies inside floor 1.
- Keys of the pack (optional, old packs unaffected; `docs/pack-format.md`): `floors`, `shaft`, `links`, `elevFrame`; helpers `E.hasFloors`, `E.validateFloors`, `E.floorPack(pack, k)` (k = 0 the exterior), `E.floorWarnings(pack, P)` in `src/fields.js`.

## 5. The link between floors

Floor 1 carries a straight radial tongue along -x from the shaft, rising TOWARD THE SHAFT: 5 lanes wide, a landing on the inner side (x 14..18, 22 tiles at z2 = 5.2, every one a walkable floor-2 tile at the same level), ONE slope tile per lane at 4.4 (x 13), and the floor-1 ring beyond (x 12, 11). Floor 2 has a void OPENING over the slope tiles only (5 tiles); its ring stays connected (a C) and floor 1's ring stays connected around the tongue (both tested). The ramp itself is carved by the existing gates (`transitions` + `carveStairs`), nothing new.
Why this shape (all measured on the viewer pipeline, `tools/test_floors.js`):
- two FLAT plateaus give no gate: the gate criterion compares the band-normalised slopes of the two terraces (0.245 vs 0.255 for 3.6 and 5.2 at 5 terraces, difference -0.01 < 0.05), so the raw heights of the link must approach a band edge;
- strips narrower than 5 lose the gate to the pre-smoothing (the terrace edge is curved by the blur and the gate group falls under 3 connected tiles, `gateMin`): the tongue is 5 wide;
- the landing must have more tiles than `minPlateau` (the plateau cleanup deletes smaller ones): Balanced types sets 120 and would delete it, hence `minPlateau: 5` in the pack's viewer block;
- the geometry found by the spike (3 slope tiles, rising outward, a void shaft) carved a walkable link for every ramp depth on a synthetic ring, but NOT on this package: with 3 slope tiles the depth-2 ramp (the default) is dropped (the upper-terrace tiles of the slope are sub-levels lower than the ramp surface). The data now has ONE slope tile exactly on the band edge of 5 terraces (4.39995): 20 of 20 combinations of stairW 1-5 and rampDepth 1-4 walk at 3 and at 5 terraces. This is a KNIFE EDGE: slope values of 3.8 .. 4.2 fail at 5 terraces (0 of 20), 4.6 and 4.8 give 15 of 20. A forced `site` (plan B, as the rooms layer does) would remove the dependence on the gate criterion and is not built.

## 6. Known limits

- TERRACE COUNT (measured, `node tools/test_floors.js`, stairW 3, rampDepth 2, minPlateau 5): the link walks only at 3 and 5 terraces. Floors at 3.6 / 5.2; bands at 5 terraces 1.26 / 2.83 / 4.40 / 5.97 / 7.54 / 9.12, at 7 terraces 1.26 / 2.38 / 3.50 / 4.62 / 5.75 / 6.87 / 7.99 / 9.12.

  | terraces | ring / landing terrace | link walkable |
  |---:|---|---|
  | 2 | 0 / 1 | no (floors on the band edge) |
  | 3 | 0 / 1 | yes |
  | 4 | 1 / 2 | no (z = 5.2 is 0.01 from a band edge) |
  | 5 | 1 / 2 | yes |
  | 6 | 1 / 3 | no (two bands apart) |
  | 7 | 2 / 3 | no (z = 3.6 is 0.10 from an edge; the Stage preset sets 7) |
  | 8-12 | two or more bands apart | no |
- The Floors view warns in its info line when terraces is not 3 or 5, when minPlateau is larger than the landing (22 tiles) or when stairW is 0 ("floor link missing"). The warning logic is `E.floorWarnings`; the view itself is Step C.
- The link is a straight radial ramp, not an arc or a spiral.
- Not verified: touch input, non-Chromium browsers, GPU timings.

## 7. Unity (later)

Each floor becomes its own scene / Tilemap; the link a stair prefab; the paired anchor at the landing a portal between the floor scenes; the shaft top (crater) and the head are semantic anchors. Nothing is exported until every crystallizer is done.
