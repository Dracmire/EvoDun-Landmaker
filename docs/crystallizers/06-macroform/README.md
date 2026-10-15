# Crystallizer 6 - Macroform (volume of the Snake Mountain)

## 1. Status
INCOMPLETE (user, 2026-10-15), like the Stage (3): it shows the volume, but it is not yet a crystallizer. It can only show ONE example baked by `tools/derive_snake_macroform.py`; the page cannot produce a volume from the macroform's maps, nor tune it. What is built is a VOXEL crystallizer (columns of solid intervals at 0.25 tile, drawn as blocks); an SDF appears only inside the offline derivation (the shell is carved by the 3D distance to the outside air), and the "SDF exterior mesh" crystallizer was never built (`docs/ui-modes.md` section 8).
PHASE 1 CLOSED (user, 2026-10-14). PR A (#29: derivation + data + tests, no `src/` change: `tools/derive_snake_macroform.py`, `data/snake_mountain_macroform.json`, `tools/test_macroform.js` + `.py`) and PR B (#30: the viewer, `src/volume.js`, the Macroform view, `tools/ui/test_volume_ui.js`, section 11) are merged. The review added an independent voxel ray cast to the test (0 mismatches over 36 combinations; it catches missing faces, which the z-buffer over the same faces cannot) and greys the Incursion controls in the volume view (a click there cannot be resolved against the heightmap shape).
PHASE 2: not designed, not started. The user (2026-10-14): it "looks good" but lacks serious things, such as the OTHER PASSES OF THE NUMERIC WORLD on the macroform. Candidates named so far (none decided): those numeric-world passes, the head as a semantic landmark, the waterfall from the mouth and the pond, more than one gate between exterior and interior (the original design had several), and changing the shape from the page (today it is baked by the Python script, so the user cannot reproduce or tune it).
Nothing is exported to Unity. Floors (crystallizer 5) code and data are untouched; techniques A, B and C are not extended to the volume.

## 2. Why
Floors stacks independent heightmaps, so it cannot hold a shell, a ceiling or an interior inside the SAME map. The user approved (2026-10-13) a different DATA MODEL with the SAME RENDER FAMILY: columns (x, y) that may hold SEVERAL solid intervals (z0, z1, material) instead of one height. Rendering stays 2.5D isometric: orthographic, painter's algorithm, flat colour + outlines, no WebGL, no mesh engine, no z-buffer in the product (a z-buffer is allowed in TESTS as a reference, as in `tools/ui/test_ramp_ui.js`).

## 3. User decisions (do not change; ask if one blocks)
- The serpent is a TRAVERSABLE SPIRAL BODY that connects ALL floors. The central axis shaft is an ADDITION (volcano-like crater), NOT a replacement of the serpent.
- The snake head is a SEPARATE LANDMARK at the TOP of the spiral (decision D5). Here it is only a MARKER at the high end of the serpent centreline, near (21, 15); no head geometry.
- The shell is the exterior; interiors are where play happens. The mountain is not a solid block.
- Dungeon content per floor, waterfall from the mouth, pond at the foot: OUT OF SCOPE.
- Default camera for this crystallizer: Cam 1 (Iso 45).
- (2026-10-14) Phase 1 closed as it stands; the rest is phase 2 (section 1).
- (2026-10-15) Marked INCOMPLETE, like the Stage: it is not yet a crystallizer while it can only show one baked example (section 1).

## 4. Parameters (ALL PROVISIONAL: my choices, the user has not set them)
| name | value | meaning |
|---|---|---|
| V | 2 tiles per elevation unit | vertical scale; the surface top is 18.23 tiles; V = 2.5 fails the slope limit (0.74) |
| DZ | 0.25 tile | voxel height |
| T_SHELL | 1.5 tiles | shell thickness: 3D distance to the outside air |
| HEAD | 2.5 tiles | headroom above every walkable surface |
| SLAB | 0.5 tile | floor slab thickness |
| spacing | HEAD + SLAB = 3.0 | floor spacing: 3 floors |
| RAMP_W | 1.0 tile (radius, about 2 tiles wide) | serpent ramp; slope target <= 0.6 (the spike measured 0.602, mean 0.113) |
| SHAFT | r 2.5 at (20.5, 20.5) | the crater |
| STEP | 0.75 tile | walk step limit |
| ground | 10th percentile of the surface (2.97 tiles) | outside ground level |
| max ramp slope cap | 0.65 | the cap the test enforces (measured 0.602) |

## 5. What the spike proved and did not prove
Scratch spike in Python + PIL (S1 data, S2 painter), reproduced exactly by the repo script with default arguments (`s1_run2.log`).
PROVED: one voxel field gives a shell + hollow + shaft + serpent ramp + three floors; a block painter over per-column intervals draws it in 2.5D isometric; the ramp crosses each floor next to floor tiles; the walk graph from the head end reaches 94.7-99 % of every floor, the shaft ring and the whole ramp.
NOT PROVED: the minimum 3D shell thickness AFTER the tube carve (checked only before); sensitivity to V / T_SHELL / HEAD (only the defaults were run); that the format round-trips through the viewer; painter exactness against a z-buffer (PR B measures it); what the floors look like at game scale; whether 3 floors read better than 2.

## 6. Pack format (proposal; optional keys, no version bump: stays `evodun-pack/0.3`)
Keeps `elevation` (= the existing outer surface of `snake_mountain_surface`, so every existing technique draws the exterior of this source exactly like `snake_surface`), `masks` (the `snake` mask) and `markers`. Adds:
```json
"volume": { "vScale": 2, "dz": 0.125, "nz": 79, "materials": ["air", "rock", "serpent", "slab", "ramp", "ground"],
            "columns": [ [[z0, z1, mat], ...], ... 1600 entries, row-major, x east, y south ] },
"macro":  { "params": { "...": "the table above" }, "floors": [{ "id": 1, "z": 1.69, "zTiles": 3.38, "tiles": [[x, y], ...] }],
            "ramp": { "width": 1.0, "path": [[x, y, z, t], ...], "tiles": [[x, y, z, t], ...] }, "shaft": { "c": [20.5, 20.5], "r": 2.5 }, "head": { "x": 21, "y": 15 } }
```
- `columns[i]` lists the SOLID intervals of tile i from the bottom up, `z0 < z1`, in ELEVATION units (`z_tiles / vScale`), `mat` an index into `materials` (0 = air is never stored). Voxel boundaries are multiples of `dz = DZ / V = 0.125`, exactly representable in binary, so the JSON is exact. Adjacent voxels of the same material are merged.
- MAPPING to the viewer's vertical unit: the viewer's height unit is the elevation unit (terraces are quantized from `elevation`); the volume view draws `z_tiles = z * vScale` so a voxel is a cube (1 tile wide, 1 tile high is `1 / vScale` elevation units). Outside the shaft, the top of the highest solid interval of every column equals `elevation` (within `dz`).
- `docs/pack-format.md` documents the keys; the built-in source id is `snake_macroform` (the pack is embedded in `data/packs.js` under the key `snake_mountain_macroform` by `tools/build.py`, like `snake_mountain_floors`; the SOURCE id `snake_macroform` is registered by the viewer in PR B; the selector entry is added with the viewer in PR B because PR A changes no `src/`).

## 7. Derivation (`tools/derive_snake_macroform.py`)
solid = voxel centre below `surface x V`; outside ground; hollow = solid AND 3D EDT to outside air > T_SHELL AND above ground (air around the map edge, solid below z = 0); shaft = r <= 2.5 open as a crater from the top of the hollow to the surface; serpent centreline = skeleton of the snake mask walked from the inner / high end (head end), gaussian-smoothed (sigma 2), resampled every 0.25 tile; ramp surface = min hollow ceiling across the ramp width - HEAD, smoothed (sigma 6), made monotone; floors = horizontal slices of the hollow every 3.0 from the lowest level, aligned so the last ramp end sits on floor 1; ramp tiles carve the tube and get a ramp slab under them; floor 2+ get an opening where the ramp passes below. Materials: air, rock, serpent (rock inside the snake mask within 1.46 elevation units x V of the surface), slab, ramp, ground (floor 1).

## 8. Tests (PR A)
ENFORCED: determinism (the script reproduces the JSON bit for bit), invariants (every standing tile has >= HEAD - DZ = 2.25 of air above, HEAD 2.5 being the nominal value; outside the shaft the top solid equals the surface within DZ), walk reachability (floors >= 94 %, shaft ring, ramp 100 %), max ramp slope <= 0.65. MEASURED, NOT ENFORCED: minimum 3D shell thickness after the tube carve; the sensitivity sweep V 1.5 / 2 / 2.5 x T_SHELL 1.0 / 1.5 / 2.0 x HEAD 2.0 / 2.5 / 3.0 (floors count, max slope, walk reach). Reference numbers of the spike are reproduced and every difference is explained (section 9, filled in with the results).

## 9. Results (PR A)
Everything below is produced by `python3 tools/derive_snake_macroform.py` and checked by `node tools/test_macroform.js` (which also runs `tools/test_macroform.py`). With the default arguments the script reproduces the spike's `s1_run2.log` EXACTLY (every number below matches).

| quantity | spike | repo |
|---|---|---|
| serpent path | 66.0 tiles | 66.0 |
| ramp surface | 10.87 -> 3.38 (drop 7.49), mean slope 0.113, max 0.602 | same |
| hollow voxels | 12209 | 12209 |
| floors (z tiles / tiles clear) | 3.38 / 6.38 / 9.38; 356 / 260 / 166 | same (3 floors) |
| ramp tiles / with HEAD clear / tube carve | 135 / 112 (83 %) / 112 voxels | same |
| rock above the ramp headroom | min 2.50, median 5.08 | same |
| ramp crosses floor 1 / 2 / 3 | t=52.2 (28,14) / 30.5 (11,17) / 13.2 (22,25), all next to floor tiles | same |
| voxels: air / rock / serpent / slab / ramp / ground | 97660 / 23695 / 2686 / 1013 / 307 / 1039 | same |
| walk graph (664 nodes) from (21,15) | floor 1 276/279, floor 2 144/152, floor 3 94/98, ramp 135/135, all reach the shaft ring | same |

SKELETON: the 2D thinning of the snake mask is FROZEN in the script (67 tiles = `skimage.morphology.skeletonize`, method zhang, scikit-image 0.26, BSD-3-Clause; the script only needs numpy + scipy, and if skimage is installed it just confirms the frozen list). I tried a plain Zhang-Suen thinning in numpy instead: it differs in 2 tiles (it deletes the head-end tile (15, 20) and keeps (27, 17)), the walk starts at (15, 20), so the path would change; not used.

UNREACHED FLOOR TILES (3 + 8 + 4 = 15, all explained): every one lies on the snake mask, at the OUTER EDGE of its floor, in a pocket of 1-3 tiles that touches the rest of the floor only through the ramp lane (the ramp lane columns are not floor nodes when the ramp surface is more than the step limit 0.75 away from the floor level). Floor 1: (11,13), (11,14), (12,13): neighbours are ramp columns 1.95-2.24 tiles ABOVE the floor and rock. Floor 2: (12,24), (13,25), (14,26), (22,27), (24,26), (25,25): ramp columns 1.35-3.64 tiles above; (25,25), (28,26), (29,26): the slab OPENING where the ramp passes below at 3.38 (3.0 below this floor) cuts them off. Floor 3: (24,15), (26,19), (26,20), (26,21): ramp columns 1.2 tiles above and rock. None is isolated by a bug: they are the places where the 2-tile-wide ramp lane crosses the floor edge. Not fixed (the instruction was to report).

INVARIANTS (ENFORCED): outside the shaft the top solid of every column equals the original surface within DZ (worst 0.25 tile); every standing tile has >= HEAD - DZ = 2.25 of air above. DEVIATION FROM THE STATED INVARIANT ">= HEAD": the slabs are quantized OUTWARD to the 0.25 grid (the floor levels are 3.3801 + 3k, not multiples of 0.25, so the standing surface is at most 0.12 above and the ceiling slab at most 0.13 below its nominal height): 240 of 630 standing tiles have 2.25-2.5 of air, the rest 2.5 or more, none less than 2.25. Also 34 floor nodes (25 on floor 1, 7 on floor 2, 2 on floor 3) are ramp-shared columns: the ramp surface is within 0.75 above the floor, the ramp slab sits right on the floor slab, so the column is walked as ramp and has no headroom as floor; the walk graph of the spike counts them as floor nodes (they are in the 279 / 152 / 98). USER DECISION (2026-10-14): >= HEAD - DZ (one voxel, 2.25 tiles) is ACCEPTED as the invariant at voxel resolution and HEAD 2.5 is the nominal value; the floors are NOT snapped to the grid (it would move every reference number).

REACHABILITY (ENFORCED): floors >= 94 %, NOT 95 %: floor 2 is 144 / 152 = 94.7 % (the 95 % of the task is the rounded figure). USER DECISION (2026-10-14): >= 94 % per floor is ACCEPTED as the design bound; the exact counts 276/279, 144/152, 94/98 stay as the real guard (they are asserted too). Ramp 100 %, every floor reaches the shaft ring.

MAX RAMP SLOPE: 0.602 <= the cap 0.65 (enforced; the cap is PROVISIONAL).

SHELL THICKNESS AFTER THE CARVE (MEASURED, NOT ENFORCED): the minimum 3D distance from an interior air voxel (hollow, tube, openings; shaft columns excluded) to the outside air is 1.03 tiles, against T_SHELL 1.5: the tube carve (rock up to HEAD above the ramp removed) and the slab openings eat 0.47 tile of the shell at the thinnest place. Before the carve every hollow voxel is > 1.5 by construction.

SENSITIVITY SWEEP (MEASURED, NOT ENFORCED; `python3 tools/derive_snake_macroform.py --sweep`; floors / max slope / floors reached / shaft ring Y or n per floor / ramp reached / shell after carve):
```
V    T_SHELL HEAD | floors | max slope | walk reach per floor (reached/nodes)       | ring  | ramp    | shell
1.5  1.0     2.0  | 3      | 0.634     | 232/240 117/120 0/13                      | YYn   | 135/135 | 1.00
1.5  1.0     2.5  | 2      | 0.634     | 232/240 121/129                           | YY    | 135/135 | 1.00
1.5  1.0     3.0  | 2      | 0.634     | 232/240 99/106                            | YY    | 135/135 | 1.00
1.5  1.5     2.0  | 3      | 0.446     | 271/274 139/141 76/79                     | YYY   | 135/135 | 1.03
1.5  1.5     2.5  | 2      | 0.446     | 159/161 0/12                              | Yn    | 135/135 | 1.03
1.5  1.5     3.0  | 1      | 0.446     | 148/155                                   | Y     | 135/135 | 1.03
1.5  2.0     2.0  | 2      | 0.407     | 176/184 94/97                             | YY    | 135/135 | 1.41
1.5  2.0     2.5  | 2      | 0.407     | 175/177 40/42                             | YY    | 135/135 | 1.41
1.5  2.0     3.0  | 1      | 0.407     | 167/168                                   | Y     | 135/135 | 1.41
2.0  1.0     2.0  | 5      | 0.822     | 0/278 208/212 134/141 85/89 0/0           | nYYYn | 135/135 | 1.00
2.0  1.0     2.5  | 3      | 0.822     | 229/233 122/126 63/63                     | YYY   | 135/135 | 1.00
2.0  1.0     3.0  | 3      | 0.822     | 229/233 107/117 0/8                       | YYn   | 135/135 | 1.00
2.0  1.5     2.0  | 4      | 0.602     | 276/279 143/157 111/118 36/36             | YYYY  | 135/135 | 1.03
2.0  1.5     2.5  | 3      | 0.602     | 276/279 144/152 94/98                     | YYY   | 135/135 | 1.03   <- the defaults
2.0  1.5     3.0  | 2      | 0.602     | 162/164 79/82                             | YY    | 135/135 | 1.03
2.0  2.0     2.0  | 3      | 0.563     | 171/193 122/122 96/96                     | YYY   | 135/135 | 1.41
2.0  2.0     2.5  | 3      | 0.563     | 176/187 100/107 0/12                      | YYn   | 135/135 | 1.41
2.0  2.0     3.0  | 2      | 0.563     | 170/176 106/106                           | YY    | 135/135 | 1.41
2.5  1.0     2.0  | 5      | 1.074     | 0/262 207/211 143/152 118/124 69/71       | nYYYY | 135/135 | 1.00
2.5  1.0     2.5  | 5      | 1.074     | 0/275 207/211 134/142 94/99 0/10          | nYYYn | 135/135 | 1.00
2.5  1.0     3.0  | 3      | 1.074     | 228/232 126/130 15/58                     | YYY   | 135/135 | 1.00
2.5  1.5     2.0  | 5      | 0.742     | 273/276 146/167 128/129 93/97 0/20        | YYYYn | 135/135 | 1.00
2.5  1.5     2.5  | 4      | 0.742     | 273/276 143/157 119/126 70/72             | YYYY  | 135/135 | 1.00
2.5  1.5     3.0  | 4      | 0.742     | 273/276 143/151 99/105 0/10               | YYYn  | 135/135 | 1.00
2.5  2.0     2.0  | 5      | 0.635     | 270/281 143/174 150/153 101/107 66/69     | YYYYY | 135/135 | 1.41
2.5  2.0     2.5  | 3      | 0.635     | 170/194 126/127 91/91                     | YYY   | 135/135 | 1.41
2.5  2.0     3.0  | 3      | 0.635     | 173/191 111/119 43/43                     | YYY   | 135/135 | 1.41
```
READING: the ramp slope depends on V and T_SHELL only (HEAD does not move it): at T_SHELL 1.0 / 1.5 / 2.0 it is 0.82 / 0.60 / 0.56 for V 2, 1.07 / 0.74 / 0.64 for V 2.5, 0.63 / 0.45 / 0.41 for V 1.5; so the 0.65 cap rules out V 2 and 2.5 at T_SHELL 1.0 and V 2.5 at 1.5. HEAD sets the number of floors (more headroom = fewer floors) and which ones the ramp meets. Cells with slope <= 0.65, every floor >= 94 % reached and every floor reaching the shaft ring (8 of 27): V 1.5 with T 1.5 / HEAD 2.0 (3 floors) and 3.0 (1), V 1.5 with T 2.0 / HEAD 2.0 / 2.5 / 3.0 (2 / 2 / 1 floors), V 2 / T 1.5 / HEAD 2.5 (the defaults, 3 floors) and 3.0 (2), V 2 / T 2.0 / HEAD 3.0 (2). Only two cells give 3 floors: the defaults and V 1.5 / T 1.5 / HEAD 2.0 (a flatter mountain, slope 0.45, HEAD 2.0). Many other cells have a floor with 0 reached tiles (0/12, 0/10, 0/278): a floor the ramp never meets or one above the head end. The shell after the carve follows T_SHELL (1.00 / 1.03 / 1.41): the carve costs up to 0.5 tile.

## 11. The viewer (PR B)
`src/volume.js` draws the volume with the Box family of techniques: orthographic, painter's algorithm, flat colour per material (the spike palette, PROVISIONAL, `E.volume.PAL` is the hook of the later stylization pass) and outlines on the top faces where the neighbour has no top at the same height. The data is read from `pack.volume` (`prep`): the intervals in tiles (`z x vScale`).

FACES: per column and per interval a top (hidden only by an interval that starts on it) and the sides that face the camera (the same test as Box, `cam.nrm`), each side CLIPPED against the intervals of the neighbour column, so only the exposed parts are faces. SECTION faces (what a removed quadrant or a cut opens) take their own colour (darker stone, a lighter top); Interior only has none (it removes the shell, it does not cut it).
PAINTER ORDER: for axis-aligned boxes under an orthographic camera the exact order needs no projected depth: a box is nearer when its x is larger (camera on the +x side), its y is larger (+y side) and its z is larger, so the lexicographic order (x toward the camera, then y toward the camera, then z, per column bottom up) is a linear extension of that product order, and two boxes that overlap on screen are never ordered the other way (a ray from the camera moves monotonically in x, y and z). The camera quadrant comes from the yaw (`sin`, `cos`), so Cam 1-5 and any drag yaw are covered.

VIEWS (selector "Macroform view", group "6 Macroform"): Off (the existing heightmap exterior of the same source, the compare grid), Exterior, Quadrant removed (the 90-degree wedge of the plan centred on the direction of the camera, it follows the yaw, taken out of the whole height), Interior only (floors, ramp and ground: the shell and the serpent body removed), Horizontal cut at floor 1 / 2 / 3 (chips; everything above floor + 2 tiles removed). The volume view is ONE panel (no compare grid), Cam 1-5 only: at Cam 6 and Cam 7 the options are greyed and the heightmap is drawn, as in the Floors view. No stake, objectives or route in the volume view. The scenario button "Snake · Macroform" (source `snake_macroform`, Exterior, Cam 1, single).

VERTICAL SCALE (decided here, not a surprise): the two views of this source do NOT share a vertical scale.
- Volume views: `z_tiles = z x vScale` with vScale 2 (PROVISIONAL), so a voxel is a cube (1 tile wide, 1 tile high). The surface spans 1.26-9.12 elevation units = 2.51-18.23 tiles: 15.7 tiles of relief.
- Off (the heightmap): `elevation` is quantized into terraces of `P.terH` = 1 tile (5 terraces, 3 sub-terraces each), so the same surface spans levels 0 to 4 tiles: about 4 tiles of relief, almost 4 times lower than the volume's.
The mapping is `volume z (tiles) = elevation x 2`, `heightmap z (tiles) = terrace index x terH (+ sub-terraces)`; the two are only monotonic images of the same elevation. The Off / Exterior pair at Cam 1 (a single Box panel each, same canvas size) sent with the PR shows the difference. The viewer states it in the info line of the volume view and in the Macroform hint.

TESTS (`tools/ui/test_volume_ui.js`): the painter against a PER-PIXEL Z-BUFFER, both software rasterizations of the same faces (pixel-centre sampled, so the difference is the ORDER only), 640 x 480, the six view kinds x Cam 1 / 2 / 3 / 4 / 5 x yaw offsets 0 / +10 / -10 = 90 combinations: 0 pixels differ in every one (the faces per view: 4106 exterior, 3121 quadrant, 1023 interior, 2374 / 3033 / 3576 cut 1 / 2 / 3). The reference can fail: a reversed list differs in 41.8 % of the pixels. The test ENFORCES the measured value (0 px): proposed in the PR, to be loosened or kept by the user. Also: the controls (greyed at Cam 6 / 7), the chips, one panel, the scenario, section faces (none in Exterior and Interior only, 109 in the quadrant view, 107-132 in the cuts).
COST (Cam 1, headless Chromium, software rasteriser, +-30 %): building the faces 3-23 ms cold, drawing 2.5-47 ms (exterior 4106 faces 47 ms, quadrant 18, interior 2.5, cut 1 / 2 / 3: 8 / 18 / 43 ms).

HEAD MARKER AND THE THINNEST POINT OF THE SHELL: the head marker H (the high end of the serpent centreline, (21, 15), `macro.head`) is drawn as a red dot on top of everything (as in the spike), so it shows in every view even where it is inside the rock; the heightmap view keeps its own H marker (the pack marker). The thinnest shell after the tube carve (1.03 tiles, README section 9) is NOT in the data (the data is unchanged); its voxels were recomputed with the derivation script: three voxels tie at 1.0308, all in ramp columns: (16, 10) z 6.375, (11, 22) z 9.625 and (21, 27) z 11.375. At Cam 1 in the Quadrant view they are NOT visible: (16, 10) and (11, 22) are hidden behind rock and sections in front of them (the nearest face at their pixel is nearer than the point), and (21, 27) is inside the removed wedge (its column is cut away). They are drawn as yellow dots in the screenshot of the PR only as an overlay (`E.volume.extraMarks`, diagnostic), not as geometry.

COMPARISON WITH THE SPIKE SHEET: the geometry is the same (the same columns, the same faces: the exterior with the serpent relief and the crater, the quadrant with the ramp spiral in section, interior only, the three cuts). Differences: the viewer draws on its dark gradient (the spike on light grey), the spike outlines the top edges with a darker 1 px line (60, 52, 44) and the viewer with a translucent dark line (same width), the framing (the viewer fits the whole volume in the panel and keeps it for every view), the sides are shaded by the screen side (right / left) of their normal, so at Cam 2 the colours of the two sides swap with respect to the spike's fixed +x / +y; the H label text.

## 10. Out of scope
Stake / objectives / route in the volume view; techniques A, B, C on the volume; Cam 6 / 7; Pocket and Backdrop; head geometry; dungeon content, waterfall, pond; Unity export.
