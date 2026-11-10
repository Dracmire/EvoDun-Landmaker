# Throne room of Aliahan Castle: "MAPA 1" (the throne world, commit 1)

The ROOM of the paired shot `../pairs/p_20261029_192049_throne_room_orig_remake.png` (left half = the SFC original, right half = the remake), read BY HAND from the left half and turned into the role images of mode 3 (zones, elevation, path, poi) like Forest and Aurhea.
It is NOT the room of `../old/castle_scenario.png` (that rip is the "Dragon Quest 3 Remix" hack: blue floor, a 4-5 tile carpet, hedged gardens, a curtain: another room).

- `map1.txt`: the ONE source of truth, a 17 x 17 grid of old tiles with a legend. Row 0 is the north (the throne); the camera of Cam 6 looks north (yaw 0).
- `derive_roles.py`: deterministic (`--check` compares with the committed files): writes `zones.png`, `height.png`, `path.png`, `poi.png` and `manifest.json` (`evodun-pack/0.2`). 2 x 2 px per old tile (like Forest: 1 px = 1 viewer tile at tilesPerH 2). `node tools/test_throne_pack.js`.
- The viewer embeds the four PNGs (`data/packs.js`, `EVO_THRONE_PNG`, `tools/build.py`) and `src/ui.js` `thronePack` decodes them on the first selection of the example `throne_aliahan` (mode 3).

## Why 2 x 2 px per old tile (and not 1)
The hero of the remake measures 0.72 old tiles (43.5 px against a carpet of 7 tiles = 424 px at its feet), so 1 H = 1.44 viewer tiles when an old tile is 2 viewer tiles: `tilesPerH` 1.5 (the minimum of the control) gives 0.75 old tile per H. With 1 px per old tile the same hero would need `tilesPerH` 0.72, which the control does not allow.

## Zones (hue ids, maxnode 4) and the footprint
| id | zone | old tiles | viewer tiles | where |
|---|---|---|---|---|
| 1 | NAVE | 144 | 576 | walkable: the dais, the carpet and the side floor, ONE zone (with the dais apart, `orient` gave X yaw 270) |
| 2 | ENT | 12 | 48 | walkable: the 2-wide passage through the parapet (3 rows) and its landing |
| 3 | PILLAR | 6 | 24 | six loose BLOCKED cells (outside the window), inside the footprint of the nave |
| 4 | WALL | 127 | 508 | walls and the parapet: terrain of another zone (outside the window) |

The window of the example is `[ENT, NAVE]` (raw ids 2, 1): 624 walkable tiles in ONE walking region, nothing dropped by the footprint rule, no stairs. (The Paso 0b mock-up lost tiles because its zones touched a 4 H wall with the default pre-smoothing 1: the example declares `pre` 0, and the entrance zone is a straight 2-wide passage + a landing, one 4-connected piece.)

## Heights (sub-levels of the floor terrace; `terraces` 2, `subs` 8 -> 0.21 H each)
The viewer quantizes the grey of `height.png` over the land range (20 .. 52): 2 terraces of 16 grey, 8 sub-levels of 2 grey; a value in the MIDDLE of a band (a value on a boundary is floored one level down by float32). Level 0 = 20, level k = 20 + 2k + 1; the walls are 52 (the top of the map = 3.47 H; `planes` adds its back wall on top).

| where (rows of the grid) | sub-level | H | status |
|---|---|---|---|
| side floor, the entrance, the carpet of rows 9-11 | 0 | 0 | SUPUESTO (flat) |
| carpet flight: rows 8, 7, 6 | 1, 2, 3 | 0.21 / 0.42 / 0.63 | 3 steps (the remake: 3 risers of about 0.16 H): the NUMBER is MEDIDO, the place is SUPUESTO |
| dais: rows 5, 4..2 | 4, 5 | 0.84 / 1.05 | 2 steps (the remake: about 0.23 H each): the number is MEDIDO, the place SUPUESTO |
| north band (rows 2-3, beside the carpet) | 5 | 1.05 | SUPUESTO (the same level as the dais top) |
| parapet of the entrance | 4 | 0.84 | SUPUESTO (about 0.8 H: at 4 H the frame shows no floor) |
| walls | top | 3.47 | SUPUESTO |

The five sub-levels climbed add up to 1.05 H against 0.94 H of the remake (3 x 0.16 + 2 x 0.23): +11 %. The steps are 1 sub-level each (the climb limit without a stair is 2): the route entrance -> nave -> throne needs no stair.

## MEDIDO (from the SFC half of the pair: tile about 27 px in the original, 54 px in a x2 crop) or SUPUESTO
| element | value | status |
|---|---|---|
| interior width | 15.4 tiles (15 in the grid) | MEDIDO |
| carpet | 7 tiles (6.7), centred, x = 8.5 | MEDIDO |
| pillars | 2.1 tiles from the wall, 11.1 apart (+-5.5 of the axis; the grid puts them at +-5, columns 3 and 13), 3 rows 4.3 apart | MEDIDO; the tile alignment (+-0.5) and the absolute rows (2, 6, 10) are SUPUESTO |
| step of the dais across the carpet | at row 3.5 of the frame | MEDIDO; its heights SUPUESTO |
| raised band on the north (the L-shaped ledge at rows 1.75 / 3.5) | simplified to a band of rows 2-3 | MEDIDO shape in the frame, SUPUESTO as a level |
| entrance parapet | 3 rows thick, top edge at row 10.15, an arch 1.6 wide (2 in the grid, off-centre by 0.5) | MEDIDO |
| the throne | on the axis, row 1 of the frame (grid row 3) | MEDIDO |
| everything north of the frame (the 2 rows of back wall), the landing and the room beyond the arch | | SUPUESTO |
| heights of the walls | 3.47 H | SUPUESTO |

## What the viewer does with it (example `throne_aliahan`, `node tools/ui/test_throne_world_ui.js`)
Cam 6 untouched; `tilesPerH` 1.5, `heroFrac` 0.12 (the control moves in 0.01 steps), `heroScreen` (0.52, 0.62), yaw the one `orient` gives: NAVE = Hub yaw 0 (entry gate -> POI goal, the throne), ENT = Hub yaw 180 (exit gate -> highest part: with the hero in the passage the camera looks south). `orient`, `planes` and `props` are ON; volumes (the pillars, commit 2), billboards and ribbons (commit 3) and the emblem are NOT in this commit. Screenshots: `../../shots/throne1/` (`tools/ui/throne_world_shots.js`).
