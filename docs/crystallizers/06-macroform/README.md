# Crystallizer 6 - Macroform (volume of the Snake Mountain) - PROPOSAL (number provisional)

## 1. Status
PROPOSAL, PR A (derivation + data + tests, no `src/` change). PR B (the viewer: `src/volume.js`, the "Macroform view") starts only after #28 and PR A are merged. Nothing is exported to Unity. Floors (crystallizer 5) code and data are untouched; techniques A, B and C are not extended to the volume.

## 2. Why
Floors stacks independent heightmaps, so it cannot hold a shell, a ceiling or an interior inside the SAME map. The user approved (2026-10-13) a different DATA MODEL with the SAME RENDER FAMILY: columns (x, y) that may hold SEVERAL solid intervals (z0, z1, material) instead of one height. Rendering stays 2.5D isometric: orthographic, painter's algorithm, flat colour + outlines, no WebGL, no mesh engine, no z-buffer in the product (a z-buffer is allowed in TESTS as a reference, as in `tools/ui/test_ramp_ui.js`).

## 3. User decisions (do not change; ask if one blocks)
- The serpent is a TRAVERSABLE SPIRAL BODY that connects ALL floors. The central axis shaft is an ADDITION (volcano-like crater), NOT a replacement of the serpent.
- The snake head is a SEPARATE LANDMARK at the TOP of the spiral (decision D5). Here it is only a MARKER at the high end of the serpent centreline, near (21, 15); no head geometry.
- The shell is the exterior; interiors are where play happens. The mountain is not a solid block.
- Dungeon content per floor, waterfall from the mouth, pond at the foot: OUT OF SCOPE.
- Default camera for this crystallizer: Cam 1 (Iso 45).

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
PROVED: one voxel field gives a shell + hollow + shaft + serpent ramp + three floors; a block painter over per-column intervals draws it in 2.5D isometric; the ramp crosses each floor next to floor tiles; the walk graph from the head end reaches 95-99 % of every floor, the shaft ring and the whole ramp.
NOT PROVED: the minimum 3D shell thickness AFTER the tube carve (checked only before); sensitivity to V / T_SHELL / HEAD (only the defaults were run); that the format round-trips through the viewer; painter exactness against a z-buffer (PR B measures it); what the floors look like at game scale; whether 3 floors read better than 2.

## 6. Pack format (proposal; optional keys, no version bump: stays `evodun-pack/0.3`)
Keeps `elevation` (= the existing outer surface of `snake_mountain_surface`, so every existing technique draws the exterior of this source exactly like `snake_surface`), `masks` (the `snake` mask) and `markers`. Adds:
```json
"volume": { "vScale": 2, "dz": 0.125, "materials": ["air", "rock", "serpent", "slab", "ramp", "ground"],
            "columns": [ [[z0, z1, mat], ...], ... 1600 entries, row-major, x east, y south ] },
"macro":  { "params": { "...": "the table above" }, "floors": [{ "id": 1, "z": 1.69, "tiles": [[x, y], ...] }],
            "ramp": { "width": 1.0, "path": [[x, y, z, t], ...] }, "shaft": { "c": [20.5, 20.5], "r": 2.5 }, "head": { "x": 21, "y": 15 } }
```
- `columns[i]` lists the SOLID intervals of tile i from the bottom up, `z0 < z1`, in ELEVATION units (`z_tiles / vScale`), `mat` an index into `materials` (0 = air is never stored). Voxel boundaries are multiples of `dz = DZ / V = 0.125`, exactly representable in binary, so the JSON is exact. Adjacent voxels of the same material are merged.
- MAPPING to the viewer's vertical unit: the viewer's height unit is the elevation unit (terraces are quantized from `elevation`); the volume view draws `z_tiles = z * vScale` so a voxel is a cube (1 tile wide, 1 tile high is `1 / vScale` elevation units). Outside the shaft, the top of the highest solid interval of every column equals `elevation` (within `dz`).
- `docs/pack-format.md` documents the keys; the built-in source id is `snake_macroform` (the data is embedded in `data/packs.js` by `tools/build.py`; the selector entry is added with the viewer in PR B because PR A changes no `src/`).

## 7. Derivation (`tools/derive_snake_macroform.py`)
solid = voxel centre below `surface x V`; outside ground; hollow = solid AND 3D EDT to outside air > T_SHELL AND above ground (air around the map edge, solid below z = 0); shaft = r <= 2.5 open as a crater from the top of the hollow to the surface; serpent centreline = skeleton of the snake mask walked from the inner / high end (head end), gaussian-smoothed (sigma 2), resampled every 0.25 tile; ramp surface = min hollow ceiling across the ramp width - HEAD, smoothed (sigma 6), made monotone; floors = horizontal slices of the hollow every 3.0 from the lowest level, aligned so the last ramp end sits on floor 1; ramp tiles carve the tube and get a ramp slab under them; floor 2+ get an opening where the ramp passes below. Materials: air, rock, serpent (rock inside the snake mask within 1.46 elevation units x V of the surface), slab, ramp, ground (floor 1).

## 8. Tests (PR A)
ENFORCED: determinism (the script reproduces the JSON bit for bit), invariants (every walkable tile has >= HEAD air above; outside the shaft the top solid equals the surface within DZ), walk reachability (floors >= 95 %, shaft ring, ramp 100 %), max ramp slope <= 0.65. MEASURED, NOT ENFORCED: minimum 3D shell thickness after the tube carve; the sensitivity sweep V 1.5 / 2 / 2.5 x T_SHELL 1.0 / 1.5 / 2.0 x HEAD 2.0 / 2.5 / 3.0 (floors count, max slope, walk reach). Reference numbers of the spike are reproduced and every difference is explained (section 9, filled in with the results).

## 9. Results
(filled in by the implementation, see below)

## 10. Out of scope
Stake / objectives / route in the volume view; techniques A, B, C on the volume; Cam 6 / 7; Pocket and Backdrop; head geometry; dungeon content, waterfall, pond; Unity export.
