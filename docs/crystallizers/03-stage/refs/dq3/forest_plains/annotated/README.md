# Forest: the roles of the old map (M3a)

`derive_roles.py` (deterministic; numpy, scipy, scikit-learn, Pillow; `--check` compares with the committed files, `--overlay out.png` writes a review picture) writes the PNGs of ROLES for the source "Your images" of mode 3 from `../../old/forest.png` and the map of the remake `../../remake/r_20261030_141929_shrine_of_the_plains_map.png` (the zones of v53, reproduced and checked against the user's 26 x 23 grid: 0 differences; the script asserts it BEFORE normalizing). 52 x 46 px = 26 x 23 old tiles at x2: 1 px = 1 tile of the viewer, H (the hero) = 1 old tile at tilesPerH 2.

| file | role | content |
|---|---|---|
| `zones.png` | `zone` (H, maxnode 6) | SIX zones, each ONE 4-connected piece: 1 valley (170 old tiles), 2 plateau NW (94), 3 plateau SW (35), 4 plateau N + tower (156), 5 slope main piece (110), 6 slope east piece (33). Trails (class 6 of v53) take the nearest zone of 1-5; the tower (cols 17-21, rows 2-10) is forced to zone 4 (7 old tiles were slope) |
| `height_A.png` | `elevation` | variant A, the v53 hypothesis [R, by eye on remake screenshots, NOT verified]: valley and trails grey 20 (0 H), slope 26 (0.3 H), plateaus 32 (0.6 H), tower 90 (3.5 H); 1 H = 20 grey; 0 is void in the viewer so the valley is 20. The heights follow the CLASS of a tile |
| `height_B.png` | `elevation` | variant B, amplified relief: valley 20, slope 33, plateaus NW and N 45, plateau SW 57, tower 92; the trails follow their zone |
| `path.png` | `path` | the 44 trail tiles of v53 (255) |
| `poi.png` | `poi` | A: the walkable tile in front of the tower door, old tile (19, 11), zone 4 (255); B: the west exit (8, 11) (170). The door (19, 10) is NOT marked: the viewer reads `poi` only as a graded overlay and the Stage rules never read it |
| `trees_blocked.png` | `vegetation` | 255 = the tower (45 tiles) and the trees (230 tiles whose pixels are foliage or trunk for at least half of the tile). DATA FOR LATER (trees as volumes or billboards): the viewer carries the role `vegetation` and does not use it, so NOTHING is blocked by it in M3a |
| `manifest.json` | | `evodun-pack/0.2` roles of the files; `variants` names the two elevation images |

- **Zones are connected pieces (M3a decision).** After "trails -> nearest zone" and "tower -> zone 4", every 4-connected piece of a class of at least `MIN_PIECE` = 10 old tiles is a zone of its own (the largest keeps the class id, the others are numbered 6, 7...); a smaller one is fused into the neighbouring piece that shares the most border (tie: lower id) and takes its class (and so its height). `MIN_PIECE` = 10 is a hypothesis [R]. Pieces per class: valley [151], plateau NW [94], plateau SW [25], plateau N [154], slope [110, 33, 9, 9, 4, 2, 2, 2, 2, 1] (the 8 pieces under 10, 31 tiles, were fused: 19 to the valley, 10 to plateau SW, 2 to plateau N). `src/stage.js` is not touched: its rule (only the largest connected piece of a zone is its footprint) now meets connected zones.
- **Trees.** The sprites are 2 tiles wide and overlap, so they are NOT separated one by one: 34 trunks are visible (a lower bound) and the rest are hidden by the tree in front; the mask is the tile coverage by colour (230 tiles). Trees are walkable terrain in M3a.
- **Tower.** No mask: it is a raised mass (a terrace of its own). The top is a piece apart that no ramp reaches and the footprint rule drops (counted apart in the tests: expected discard); the lower levels around it are reachable by ramp.
- **Terraces.** The viewer quantizes the greys; the heights in H it leaves are measured in `tools/test_forest_roles.js` (frozen table): A with terraces 2 / sub-terraces 6: valley 0, slope 0.267, plateaus 0.533, tower 3.333 H; B with terraces 6 / sub-terraces 3: valley 0, slope 2, plateaus NW and N 4, plateau SW 6, tower 10.88 H.

Captures: `../../../../shots/m3a/` (`tools/ui/m3a_shots.js`; `capas_v53_zonas_arboles_torre.png` = the layers over the old map).
