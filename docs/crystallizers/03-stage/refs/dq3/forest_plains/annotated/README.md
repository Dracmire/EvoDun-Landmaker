# Forest: the roles of the old map (M3a, commit 1)

`derive_roles.py` (deterministic; numpy, scipy, scikit-learn, Pillow; `--check` compares with the committed files, `--overlay out.png` writes a review picture) writes the PNGs of ROLES for the source "Your images" of mode 3 from `../../old/forest.png` and the map of the remake `../../remake/r_20261030_141929_shrine_of_the_plains_map.png` (the zones of v53, reproduced and checked against the user's 26 x 23 grid: 0 differences). 52 x 46 px = 26 x 23 old tiles at x2: 1 px = 1 tile of the viewer, H (the hero) = 1 old tile at tilesPerH 2.

| file | role | content |
|---|---|---|
| `zones.png` | `zone` (H) | 1 valley 604 px, 2 plateau NW 376, 3 plateau SW 100, 4 plateau N + tower 616, 5 slope / dark band 696. The trail tiles (class 6 of v53) take the nearest of 1-5; the tower (cols 17-21, rows 2-10) is forced to zone 4 (7 old tiles were slope) |
| `height_A.png` | `elevation` | variant A, the v53 hypothesis [R, by eye on remake screenshots, NOT verified]: valley and trails grey 20 (0 H), slope 26 (0.3 H), plateaus 32 (0.6 H), tower 90 (3.5 H); 1 H = 20 grey; 0 is void in the viewer so the valley is 20 |
| `height_B.png` | `elevation` | variant B, amplified relief: valley 20, slope 33, plateaus NW and N 45, plateau SW 57, tower 92; the trails follow their zone |
| `path.png` | `path` | the 44 trail tiles of v53 (255) |
| `poi.png` | `poi` | A (tower, tile 19, 6) 255, B (west exit, 8, 11) 170, door (19, 10) 85 |
| `trees_blocked.png` | `vegetation` | 255 = not walkable terrain: the tower (45 tiles) and the trees (230 tiles whose pixels are foliage or trunk for at least half of the tile) |
| `manifest.json` | | `evodun-pack/0.2` roles of the files; `variants` names the two elevation images |

- **Trees.** The sprites are 2 tiles wide and overlap, so they are NOT separated one by one: 34 trunks are visible (a lower bound) and the rest are hidden by the tree in front; the mask is the tile coverage by colour (230 tiles), the footprint of the whole canopy. The user's ~47 could not be confirmed by centroid.
- **What the roles cannot say.** Today no role marks blocked terrain: `trees_blocked.png` is read as the graded role `vegetation`, which the viewer carries and does not use. Loaded as "Your images" the trees and the tower are walkable terrain; the tower is a piece apart (a terrace of its own, no ramp reaches its top) and the footprint rule drops it. The built-in source (commit 2) is the route that blocks them.
- **Terraces.** The viewer quantizes the greys; the heights in H it leaves are measured in `tools/test_forest_roles.js` (frozen table): A with terraces 2 / sub-terraces 6 gives valley 0, slope 0.267, plateaus 0.533, tower 3.333 H; B with terraces 6 / sub-terraces 3 gives 0, 2, 4 (NW, N), 6 (SW), tower 10.88 H.

Captures: `../../../../shots/m3a/` (`tools/ui/m3a_shots.js`; `capas_v53_zonas_arboles_torre.png` = the layers over the old map).
