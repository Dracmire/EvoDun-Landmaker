# Crystallizer 5 - Floors (a multi-floor macroform: Snake Mountain with an open crater shaft and 2 interior floors)

## 1. Status

IN PROGRESS. Data, pack format, `elevFrame`, declared links and tests done (steps B and B2); the Floors view (single floor, exploded stack, cutaway) is not built yet. Nothing is exported to Unity.

## 2. Goal

Compose N stacked heightmaps of ONE landmark and present them three ways, reusing Box / A / B / C unchanged. The question it answers: can a multi-floor macroform be read from its 2.5D maps (exterior, floors, the link between them)?
Not the SDF exterior (deferred, it may become a later crystallizer): no volume representation, no WebGL.

## 3. Decisions

- D1 The mountain is hollow along a central vertical SHAFT, open at the top as a CRATER (a sheer pit, r 2.5 around (20.5, 20.5), dug from the plateau at ~7.4 down to floor 1). The shaft replaces the serpent tube as the link between floors: an intentional deviation from GDD 4.1 (the serpent only gives the exterior, the floor-height reference and the head anchor). No rooms layer inside the floors.
- D2 Floors are sectional heightmaps (a horizontal section of the exterior solid), NOT zones (a zone is a slice of one map). Two floors at z = 3.6 and 5.2, no third floor (the section at z ~ 6 has ~110 tiles; not requested).
- D3 The derived package is `data/snake_mountain_floors.json` (`tools/derive_snake_floors.py`, numpy only, reproduces the JSON bit for bit, reads only `data/snake_mountain_surface.json`). `snake_surface` is untouched (default source and regression baseline). The pack declares a viewer block `{ terraces: 5, minPlateau: 5 }` (choosing the source sets both; 5 is the band layout the floor heights were chosen for; the declared link does not depend on them).
- D4 GLOBAL height frame: every layer carries the package's `elevFrame` (the surface range 1.256 .. 9.115) so terrace heights agree between floors. `quantize` in `src/shape.js` honours it ONLY when present (also where the map has void); without it nothing changes (`elevRange` behaviour untouched; `tools/test_floors.js` compares the terraces with origin/main).
- D5 The head `H` is the high end of the spiral, (22, 16), in THIS pack only; the source pack keeps (29, 26) (the inverted end from the spreadsheet). `W`, `P`, `E` stay where they are (placed for the old head); the semantic-landmark stage will resolve it. The head is a semantic anchor, not built here.
- D6 The link between floors is a DECLARED LINK (section 5): the pack declares it, a forced site carves its ramp; it is not detected. Reason: GDD 4.1 step 5 says floor connections are RESERVED (declared by the cave graph), the gate criterion is for natural terrain transitions. A straight radial ramp, not an arc or a spiral (later improvements).
- D7 Number reference: an earlier estimate of the centre height (5.1) came from the cave-carved composite, not from the repository. The pure surface has 7.41 at (20.5, 20.5), a plateau of 7.0-7.5 up to r ~ 4 and the crest (9.1) at r 5-6; there is no basin, so the crater is dug. Section areas (z + 1, shell 1.5, shaft r 2.5): z = 3: 289, z = 4: 223, z = 5: 161 tiles.

## 4. Data (derivation rules)

- Exterior = the surface with the shaft pit (tiles whose centre is within 2.5 of the axis lowered to z1 = 3.6).
- Floor k = the tiles with exterior >= z_k + 0.15 + 1.0 (roof margin counted from the highest floor tile), eroded by a shell of 1.5 tiles; shaft void in floor 2, floor 1 keeps the disc as the flat pit bottom; deterministic bumps <= 0.15 (zero in the link box). Floor 1: 264 tiles, floor 2: 136; floor 2 lies inside floor 1.
- Keys of the pack (optional, old packs unaffected; `docs/pack-format.md`): `floors`, `shaft`, `links`, `elevFrame`; helpers `E.hasFloors`, `E.validateFloors`, `E.floorPack(pack, k)` (k = 0 the exterior), `E.floorWarnings(pack, S)` in `src/fields.js`, `E.linkProtect` in `src/shape.js`.

## 5. The link between floors (declared links, plan B)

The pack declares the link (`links[0]`): the pair `site` a = (13, 20) (a ring tile of floor 1, z1) and b = (14, 20) (the first landing tile, z2), its own `width` 3 and `depth` 2, the `landing` rectangle and the `footprint` rectangle. In `src/shape.js` (opt-in: only a pack with `links`, carried by the floor the link starts from, `E.floorPack`):
- `addDeclaredLinks`: a gate record and a FORCED site (`exact`, `declared`) at the pair, bypassing the gate detection (precedent: `site.exact` / `S.makeSite` of the rooms layer); the declared sites go FIRST in `S.passes`, so a natural stair never takes their tiles; natural gate sites that touch the link's tiles are dropped;
- `carveStairs` plans a declared site with ITS OWN width x depth (`planRamp` overrides), always as a ramp, and builds it even when stairW is 0: declared links are structure, the stair sliders govern natural stairs only;
- `linkProtect` (`E.linkProtect`): the landing, the footprint and the ring foot tiles are excluded from the pre-smoothing blur and from the plateau cleanup (`minPlateau`, `minSub`), so presets like Balanced types (minPlateau 120) cannot merge the landing into the ring.
Geometry (`tools/derive_snake_floors.py`): the ring of floor 1 at z1 (x 11..13), a FLAT landing at z2 = 5.2 (x 14..17, plus x 18 where r >= 2.5; lanes y 18..22: 22 tiles) next to it (a cliff of 1.6), the ramp CUT into the landing (footprint x 14..15 x y 19..21: 3 x 2 = the viewer's default stairW and rampDepth; end tile x 16). Floor 2 has the void OPENING over exactly the footprint (6 tiles) and keeps the ARRIVAL ledge (x 16..17, 2 tiles) between the opening and the shaft; floor 2's ring stays connected (the opening is a hole in it) and so does floor 1's around the landing (both tested). Every arrival tile of floor 1 is a walkable floor-2 tile at exactly z2.

### The knife-edge attempt (dropped)
Step B first tried to let the gate detection find the link: a sloped strip rising to the landing. Measured on the viewer pipeline: two flat plateaus give no gate (the criterion compares band-normalised slopes: 0.245 vs 0.255 for z1 and z2 at 5 terraces, difference -0.01 < `gateThr` 0.05); strips narrower than 5 lose the gate to the pre-smoothing (the gate group falls under `gateMin` 3); with 3 slope tiles (the spike's geometry) the depth-2 ramp was dropped on this package; one slope tile at z = 4.4 worked, but only because it sat exactly on the band edge of 5 terraces (4.39995), a float tie that breaks with the pre-smoothing, `gateThr`, `gateMin` or the bumps (values 3.8 .. 4.2 gave 0 of 20 combinations). It also depended on the number of terraces (3 and 5 only) and on `minPlateau`. It was dropped for declared links.

## 6. Known limits

- MEASURED (`node tools/test_floors.js`): the declared link is carved (3 columns x depth 2) and walkable from the foot to the arrival for terraces 2-12 x pre 0-3 (44 combinations), also for stairW 0-5 x rampDepth 1-4 and for minPlateau 120 / minSub 100: a jump of 1, 2 or 3 terraces carves the same (`planRamp` is generic in the terraces of its two tiles). Floors at 3.6 / 5.2; terrace jump of the pair: 1 at 2-5 terraces, 2 at 6, 1 at 7, 2 at 8-9, 3 at 10, 2 at 11, 3 at 12.
- The floors' OWN rings are ordinary terrain: at 10 terraces z1 = 3.6 lies on a band edge (3.614), the bumps and the smoothing split floor 1's ring into terraces and, with `pre` 2-3, the ring tile next to the ramp's foot is cut from it by a cliff ("ring cut" in the printed table). The link itself still works. Bands at 5 terraces: 1.26 / 2.83 / 4.40 / 5.97 / 7.54 / 9.12; at 7: 1.26 / 2.38 / 3.50 / 4.62 / 5.75 / 6.87 / 7.99 / 9.12.
- The Floors view warns only when a declared link was not built in the lower floor (`E.floorWarnings(pack, S)`: the pair in void, the ramp did not fit): no slider setting is a reason to warn any more. The view itself is Step C.
- The ring tiles next to the landing read its raw 5.2 in the pre-smoothing blur and can change terrace (cosmetic; a natural stair may appear at that cliff, never on the link's tiles).
- With the opening sized exactly to the declared footprint, a link whose `width` / `depth` the pack changes needs the derivation to be re-run (the opening and the data stay in step).
- The link is a straight radial ramp, not an arc or a spiral.
- Not verified: touch input, non-Chromium browsers, GPU timings.

## 7. Unity (later)

Each floor becomes its own scene / Tilemap; the link a stair prefab; the paired anchor at the landing a portal between the floor scenes; the shaft top (crater) and the head are semantic anchors. Nothing is exported until every crystallizer is done.
