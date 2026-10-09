# Crystallizer 1 - Terrain techniques (Box, A, B)

Dates: the "merged" date is the date of the merge commit of the PR in `git log` (it is NOT the date the decision was taken). "date not recorded" = CLAUDE.md names no PR for that decision. PR numbers are the ones CLAUDE.md uses.

## 1. Status

CLOSED (base of the viewer). CLAUDE.md "Pending" 3: the base was closed with the compare mode (PR #4, merged 2026-10-06; pixel regression against the commit before it, stairW = 0, 25 images, 0 differ). Items parked by the user: overlays that follow the smoothed shapes, outer corners of B, Box line and stripes (section 9).

## 2. Goal

Take the SAME map data (an elevation field, optionally zones, edge map and masks) and express it with several techniques to compare which reads best as a 2.5D isometric map. The goal is NOT to generate terrain. Techniques:
- **Box**: one column per tile, the reference.
- **A**: per-level tile outline -> simplify -> Chaikin smoothing (`src/tech.js`).
- **B**: signed distance field per level -> blur -> marching squares (`src/tech.js`).

Criteria to judge a technique (CLAUDE.md): distinguishable levels; walkable vs not; stairs and passes locatable; recognisable landmark; readable incursion border; stake and way-back path visible.

## 3. References

Only those that appear in the repo:
- `reference/EDunProcGen.cs` (the user's C# generator: `NormalizeHeightsPerTerrace`, `ComputeTerraceSlopeMap`, `FindRankedTerraceTransitions`, `FilterConnectedTerraceTransitions`; READ-ONLY) and `reference/README.md` (function index). Gates are a transcription of it.
- The user's `TopdwnGrid.cs` for the edge map (named in CLAUDE.md; the file itself is not in `reference/`).
- Visual target (CLAUDE.md): Sea of Stars / 2D-HD readability, Unexplored 2 style stage modelling. Flat colour per level, gradient on cliffs, outlines.
- Data: `data/samples/skeleton_heightmap_256.png` (the user's real height map, 32 % void), `data/snake_mountain.json`, `data/snake_mountain_surface.json`; format in [`docs/pack-format.md`](../../pack-format.md).

## 4. Decisions

Numbered here from the "(user's decision)" items of CLAUDE.md "Agreed design". CLAUDE.md does not give a PR or date for most of them: "date not recorded".

- **D1** (date not recorded) Build unit: one complete continuous slice; zones only split it. Hierarchy Map -> Zone -> Area -> Room -> Platform; `area` and `room` are reserved roles with no images yet.
- **D2** (date not recorded) Terraces are a mesoform (zone/area level), always from elevation quantized with the GLOBAL range of the map, continuous across zone borders. A zone is NOT a terrace and gives no level. Micro steps belong to room and platform: a reserved concept, not implemented; the viewer never calls anything a micro step.
- **D3** (date not recorded) Slice: one zone by default (several optional); the rest of the map is scenery under a single-band veil; movement is restricted to the slice.
- **D4** (date not recorded) Height spread: the jump between terraces can grow away from the CENTRAL terrace (most tiles on the whole map, never the slice); spread 1 (default) changes no pixel.
- **D5** (date not recorded) VOID: elevation <= 0 is not terrain (not drawn, not walkable, in no level); terraces are quantized over the land only. Always on.
- **D6** (date not recorded) Sub-terraces: small quantized height differences inside a terrace (1-6); climb limit 2 sub-terraces without a stair. PROVISIONAL assumption of the user, not the micro-step rule; a viewer parameter.
- **D7** (date not recorded) Stairs are carved into the terrain (levels are a ranking by height, every technique gets the same geometry). Where: GATES, a transcription of the user's EDunProcGen.cs on the whole map and the raw elevation, then clipped to the slice. DEVIATION: each terrace is normalized with its nominal band of the global range, not with the min/max of its tiles; minimum group size 3 is the user's choice. Extension of ours: steps inside a terrace steeper than the climb limit use the same rule.
- **D8** (date not recorded) The footprint of a stair/ramp is rigid (exact per tile) in Box, A and B, with its own colour and outline, identical in the three and visible from four sides.
- **D9** (date not recorded) RAMP instead of treads: each gate is a smooth ramp, short and wide, linear from the lower terrace to the upper one; depth into the terrace fixed (slider 1-4, default 2), so the slope can be steep; no maximum slope; width slider 0-5 (default 3). `steps` stays as an option. `stairW = 0` switches stairs off.
- **D10** (date not recorded) Terrain edges are NOT touched: A keeps its stepped border (more legible), B the smooth one (more natural); both are kept to compare.
- **D11** (date not recorded) The edge map is VISUAL only (red solid barrier, cyan dashed pass on the slice border); it is not a movement rule and plays no part in placing stairs.
- **D12** (PR #3 by its merge title, merged 2026-10-06; CLAUDE.md names no PR for it) Stake and objectives are placed by click on the VISIBLE tile (`E.pickTile`), the shortest walkable route is drawn (`E.route`), everything is saved in the manifest (`evodun-pack/0.3`).
- **D13** (PR #4, merged 2026-10-06) Compare mode (Box | A | B), one camera for all panels, Columns/Rows layouts, on by default.
- **D14** (date not recorded) Orthographic camera with predefined angles and zoom, no free rotation; the same style pass for every technique so the comparison is fair.
- **D15** (date not recorded) Connection between regions is NOT forced in this crystallizer (limitation 11): the global connection will come from the rooms and the numeric world.
- **D16** (date not recorded) PARKED by the user (their maps carry no masks and these finishes do not change the comparison): overlays that follow the smoothed A/B shapes, outer corners of B, Box line and stripes. Per-pixel depth / WebGL is also parked.

## 5. Design

Short rules; the long text is in CLAUDE.md "Agreed design" and in the code (`src/shape.js`, `src/tech.js`, `src/render.js`).
- **Slice and window**: slice = zones and/or crop; window = bbox + scenery margin. Terraces use the global elevation range of the whole map (`pack.elevRange`), so they do not depend on the window.
- **Terraces and sub-terraces**: quantization + minimal-plateau cleanup; effective sub-terrace height limited so the gap to the next terrace stays above climb x subH by half a sub-step (`E.subHeight`, `node tools/test_heights.js`). Spread: jump j -> j+1 = terH x (1 + (spread-1) x T(min(d-1, 2))), T = 0, 1, 3; spread 1.5 gives 1, 1.5, 2.5, 2.5...; ramp length limit >= 8 tiles (`node tools/test_spread.js`).
- **Gates**: per terrace t, norm_t on the whole map; slope by central differences x 0.5; for each 4-neighbour pair exactly one terrace apart, pos = the LOW tile, transition if slope_tLow - slope_tHigh > 0.05 (no absolute value); groups by 4-connectivity, groups smaller than 3 dropped; every terrace edge outside a gate is blocked. One stair/ramp per gate at the centroid, several in long gates.
- **Ramps**: lateral columns may find the cliff of their own column up to `depth` tiles further along the path; a column that does not fit stops its side (the ramp narrows). Look: stone colour with a gradient along the slope, dark outline, own side walls, transverse lines (round(jump / 0.3), 2-10; Display switch "Ramp cross lines").
- **Technique A**: per-level tile outline -> simplify -> Chaikin; footprint pinned (vertices of every contour edge touching a carved tile are fixed through the passes). **B**: signed distance field -> blur -> marching squares; the unblurred field replaces the blurred one within 0.5 tile of a carved tile (fading out by 1.5 tiles). **Box**: one column per tile.
- **Painter order of ramps**: Box orders by tile depth; A and B order by level, so a ramp is CUT BY LEVEL BANDS (each piece drawn in the pass of the level at the top of its band, sorted by depth with the walls of that level, before its cap; slab walls beside a ramp are clipped to its surface).
- **Slice border**: per tile face, tile-exact, identical in Box, A and B, coloured from the edge map (red solid barrier, cyan dashed pass, yellow unmarked, white at the map edge).
- **Walkable regions**: only inside the slice, connected only by stairs/ramps; the route is a BFS over the same edges (`E.route`); with no route the info names both regions, their sizes, the closest approach (`E.regionGap`) and the gates that touch both without a ramp.

## 6. Viewer vs Unity

Everything here is the viewer (own canvas 2D renderer, painter's algorithm, no dependencies). CLAUDE.md names for the port to Unity later: the room materializers of `reference/` (crystallizer 2) and the gate transcription (already a port of the user's C#). Nothing in this crystallizer is marked as "ported as is" in CLAUDE.md; per-pixel depth is left for WebGL (round 2).

## 7. Verification

Tests (all from CLAUDE.md "Repo state"): `node tools/test_slice.js`, `test_stairs.js`, `test_gates.js`, `test_ramp.js`, `test_spread.js`, `test_border.js`, `test_route.js`, `test_heights.js`, `test_png.js`, `test_fields.js`, `test_void.js`; UI: `tools/ui/test_roles.js`, `test_slice_ui.js`, `test_stairs_ui.js`, `test_border_ui.js`, `test_compare_ui.js`, `test_pick_ui.js`, `test_void_ui.js`, `test_ramp_ui.js`. All of them run with `tools/verify.sh` (CLAUDE.md "Repo state"). Pixel regression: `tools/ui/regress.js` + `compare.js` against another checkout (`EVO_ROOT`).

Measured figures, each with its configuration (headless Chromium, software rasteriser, +-30 %; sources `docs/measurements.md` and CLAUDE.md):

**Cold render, state of the repo at PR #1 (before carved stairs)** ([`docs/measurements.md`](../../measurements.md) section 1): synthetic 4-octave value noise, square map, 5 terraces x 3 sub-terraces (15 levels), canvas 1200x800, Oblique, single technique; side 256: shape 69 ms; Box 444 ms cold / 359 warm; A 312 / 254; B 1885 / 121.

**Cold cost with carved stairs** (section 4 of that file, `node tools/ui/measure.js 3`): synthetic 256x256 map with 12 zones, Oblique 50, canvas 1200x800, median of 3. 5 terraces x 3 sub-terraces: whole map 19 levels, 376 stairs of 376 sites, Box 425 ms / A 232 / B 2353; zone 6: 14 levels, 29 stairs, Box 157 / A 21.3 / B 558. 24 terraces x 6 sub-terraces: whole map 167 levels, B 20274 ms; zone 6: 127 levels, B 4593 ms. Stair coverage (share of each tread tile area drawn as its own step): 100.0 % (0 lost) in A and B in every row; without the footprint (`P.anchor = false`) B loses stairs and A degrades them (`tools/test_stairs.js`).

**Compare mode, cold time to the first panels / to all three** (`node tools/ui/measure_compare.js 3`, [`docs/measurements.md`](../../measurements.md) section 5): synthetic 256x256 map, rooms OFF, compare mode ON (columns layout, 1500x800), 3 sub-terraces, median of 3 cold runs from the slider release:

| slice | terraces | first panels (Box + A) | all three | B alone |
|---|---:|---:|---:|---:|
| zone 6 | 5 | 171 ms | 599 ms | 428 ms |
| zone 6 | 12 | 216 ms | 1240 ms | 1024 ms |
| zone 6 | 24 | 336 ms | 2225 ms | 1888 ms |
| whole map | 5 | 781 ms | 2834 ms | 2053 ms |
| whole map | 12 | 1295 ms | 5998 ms | 4703 ms |
| whole map | 24 | 1688 ms | 10203 ms | 8515 ms |

(CLAUDE.md limitation 6 rounds the same figures: zone 6 0.17 / 0.60 s, 0.22 / 1.24 s, 0.34 / 2.2 s; whole map 0.78 / 2.8 s, 1.3 / 6.0 s, 1.7 / 10.2 s.) The figures of crystallizer 2 (real map, rooms on) are a DIFFERENT setup and are in [`../02-room-types/README.md`](../02-room-types/README.md); they must not be mixed with these.

**Ramp painter order against a per-pixel z-buffer** (`tools/ui/test_ramp_ui.js --terraces N --spread S`, default smoothing; mean range over the four ramp kinds / worst, % of the ramp's pixels that differ from the reference, relief test map; CLAUDE.md limitation 2):
- 5 terraces, spread 1: Box 0 / 0; A 0.00-0.02 / 0.4; B 0.02-0.14 / 1.0 (before the level-band cut: A 0.1-0.7 / 3.6, B 0.2-0.8 / 4.1).
- 5 terraces, spread 1.5: Box 0 / 0.2; A <= 0.02 / 0.4; B 0.07-0.16 / 1.3.
- 12 terraces, spread 1: Box 0 / 0; A 0.02-0.13 / 4.3; B 0.16-0.61 / 5.0 (before: A <= 3.0 / 30, B <= 3.6 / 32).
- 12 terraces, spread 1.5: Box <= 0.05 / 3.3; A 0.01-0.09 / 4.2; B 0.91-3.39 / 79 (before: A 1.8-4.0 / 42, B 2.8-6.3 / 41).
- The test ENFORCES only the reference (5 terraces, spread 1: Box exact, A and B mean <= 2 %, worst <= 8 %); the rest is measured.

**Ramp width** (relief test map, width 3, shift of lateral columns, CLAUDE.md limitation 2): 12 terraces: 93 of 108 ramps narrowed without the shift, 86 of 104 with it (mean columns 1.74 -> 2.01; width 5: 105 -> 99); 5 terraces: 42 -> 33 of 72. What still stops a column: upper-terrace tile lower than the ramp surface 64 %, the end tile 16 %, another terrace 15 %, tiles already used by another stair 5 %.

**Pick** (`tools/ui/test_pick_ui.js`, against a per-pixel z-buffer): 99.2-100 % of cap/ramp points; the naive picker 4-25 %.

**Slice border** (`tools/ui/test_border_ui.js`): A and B show 95-97 % of the faces that Box shows (hidden ones are covered by higher terrain); the previous code gave 93-97 %; the cause of the old "dashed in B" was never isolated.

**Gates on the 12-terrace map**: with the min/max normalization 124 of 6469 and 50 of 2574 displaced tiles stretched terraces 6 and 7 by 3.7x and 3.2x and left the 6-7 border without gates; with the nominal band gates per border come back (`tools/test_gates.js`, `tools/diag_gates.js`). Other terrace counts for that comparison: configuration not recorded.

Screenshots: `tools/ui/stairs_shots.js`, `gates_shots.js`, `ramp_shots.js` (four directions); the fixed test set is in `tools/ui/verify_shots.js`. The images themselves are not in the repo.

## 8. Mocks

None recorded in the repo for this crystallizer.

## 9. Known limits and open questions

Known limits (CLAUDE.md "Known limitations", numbering kept):
1. PARKED. Overlays (snake, cave, water) are drawn as square tiles and look blocky over the smoothed A/B shapes.
2. Carved stairs and ramps. The worst ramp-order case left (B, 12 terraces, spread 1.5, `--only 5 --px 45`) is a ramp almost hidden behind a peak: the smoothed B contour is not the tile-exact edge of the reference, so about 1000 px that the reference hides are drawn (a smoothing mismatch, not an order error). Accepted; the full solution is per-pixel depth (WebGL, round 2).
3. A selected zone that is not 4-contiguous only produces a warning. B costs about 3 s cold at 24 terraces (36 levels) on a 256x256 map (CLAUDE.md; configuration not recorded beyond that).
4. Slice border: the veil is a single band and looks rougher in Box; stairs outside the slice are not generated.
5. PARKED. Technique B rounds the outer corners of the slice.
6. Compare mode: at zoom 1 Rows is NOT larger than Columns in Iso (2.64 vs 3.14 px per tile: the panel is 219 px tall); its advantage is the wide strip when zooming in. Moving the camera does not recompute (cached contours).
9. PARKED. Box technique: light vertical stripes along the front edge of the slice (seen on the noise pack); cause not investigated.
10. The climb limit (2 sub-terraces) is a provisional assumption, not the micro-step rule.
11. Partial connection: with the user's gate criterion many regions stay unconnected (e.g. 14 regions, the largest 55 % of the slice in one test; configuration not recorded). On purpose.
Also: verified in headless Chromium only (touch input, non-Chromium browsers and GPU timings not verified); no real Unity `EncodeToPNG` file yet.

Open questions:
- Cursor synchronised across the compare panels (hover resolves the visible tile with `E.pickTile` and marks it in the others): POSSIBLE IMPROVEMENT, not done, user's call.
- Per-pixel depth / WebGL (parked).
- "Tiles to curves" in the style of Unexplored 2 (CLAUDE.md "LATER PHASE", user's decision, no date): one Voronoi seed per tile displaced by rules at the corners; uses per-tile data only and does not need rooms. Reference in CLAUDE.md: the "Tiles to Curves" devlog by Ludomotion; candidate libraries (Delaunator for the viewer; delaunator-sharp MIT and Clipper2 BSL-1.0 for Unity) with LICENCE TO BE CONFIRMED before adding anything.

## 10. Camera contract

- **Made for**: the five ORTHOGRAPHIC cameras of the bank, Cam 1 Iso 45 (`isoE`), Cam 2 Iso -45 (`isoW`), Cam 3 Oblique 50 (`oblique`, the default), Cam 4 Low 28 (`low`) and Cam 5 Top 80 (`top`): overview cameras to compare the three techniques on the whole map or a slice.
  The measurements of this README (ramp order, pick, border, stair survival) were taken at Oblique 50 and Iso 45 (four yaws, [`docs/measurements.md`](../../measurements.md) and CLAUDE.md limitation 2).
- **Pixel regression of the bank**: `tools/ui/regress_cams.js` renders Cam 1-5 x Box, A, B on three scenes (the old Snake Mountain pack with rooms off, the real map with rooms on Default, the real map Balanced types with Cake and Ascension walls on) and
  `tools/verify.sh regress` compares them with the checkout of origin/main: 45 images, 0 differ when the bank was added.
- **Cam 6 Stage and Cam 7 Classic 3/4** are NOT part of this crystallizer's contract; the techniques do run under them (same code), and their ramp order, wall order and picking were measured there, with what does not work yet, in CLAUDE.md limitation 15
  (summary: ramp order <= 1.64 % worst for every technique at 28 and 55 px per tile under Cam 6 and <= 0.38 % under Cam 7; Box tile order under Cam 6 is not an exact painter order, pick 91.0-98.2 % in Box). Crystallizer 3 owns those two cameras
  ([`../03-stage/README.md`](../03-stage/README.md) D6, D7).
