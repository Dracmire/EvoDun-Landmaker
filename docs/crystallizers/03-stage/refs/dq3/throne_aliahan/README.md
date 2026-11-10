# Throne room of Aliahan Castle: "MAPA 1" (the throne world, commits 1 and 2)

The ROOM of the paired shot `../pairs/p_20261029_192049_throne_room_orig_remake.png` (left half = the SFC original, right half = the remake), read BY HAND from the left half and turned into the role images of mode 3 (zones, elevation, path, poi) like Forest and Aurhea.
It is NOT the room of `../old/castle_scenario.png` (that rip is the "Dragon Quest 3 Remix" hack: blue floor, a 4-5 tile carpet, hedged gardens, a curtain: another room).

- `map1.txt`: the ONE source of truth, a 17 x 17 grid of old tiles with a legend. Row 0 is the north (the throne); the camera of Cam 6 looks north (yaw 0).
- `derive_roles.py`: deterministic (`--check` compares with the committed files): writes `zones.png`, `height.png`, `path.png`, `poi.png` and `manifest.json` (`evodun-pack/0.2`). 2 x 2 px per old tile (like Forest: 1 px = 1 viewer tile at tilesPerH 2). `node tools/test_throne_pack.js`.
- The viewer embeds the four PNGs (`data/packs.js`, `EVO_THRONE_PNG`, `tools/build.py`) and `src/ui.js` `thronePack` decodes them on the first selection of the example `throne_aliahan` (mode 3).

## Why 2 x 2 px per old tile (and not 1)
The hero of the remake measures 0.72 old tiles (43.5 px against a carpet of 7 tiles = 424 px at its feet), so 1 H = 1.44 viewer tiles when an old tile is 2 viewer tiles: `tilesPerH` 1.5 (the minimum of the control) gives 0.75 old tile per H. With 1 px per old tile the same hero would need `tilesPerH` 0.72, which the control does not allow.

## Zones (hue ids, maxnode 3) and the footprint
| id | zone | old tiles | viewer tiles | where |
|---|---|---|---|---|
| 1 | NAVE | 156 | 624 | walkable: the dais, the carpet, the side floor, the entrance passage through the parapet and its landing: ONE zone, ONE room for `orient` |
| 2 | PILLAR | 6 | 24 | six loose BLOCKED cells (outside the window), inside the footprint of the nave |
| 3 | WALL | 127 | 508 | walls and the parapet: terrain of another zone (outside the window) |

The ids are 1, 2, 3 with no gap (hue = id / 4, `maxnode` 3): there was no reason to keep an id free.

The window of the example is `[NAVE]` (raw id 1): 624 walkable tiles in ONE zone and ONE walking region, nothing dropped by the footprint rule, no stairs. WHY ONE ZONE: with the entrance passage as a zone of its own (commit 1) `orient` gave it Hub yaw 180 (exit gate -> highest part), so with the hero in the passage the camera looked at the south wall and the room was not in the frame; with the dais as a zone of its own it gave X yaw 270. In ONE zone `orient` gives Hub yaw 0 ("lowest part -> POI goal": the throne) at every position, entrance included. (The Paso 0b mock-up lost tiles because its zones touched a 4 H wall with the default pre-smoothing 1: the example declares `pre` 0.)

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
Cam 6 untouched; `tilesPerH` 1.5, `heroFrac` 0.11 (the control moves in 0.01 steps: the viewer then draws the hero at 11.7 % of the panel height, the remake 11.6 %; with 0.12 it was 12.7 %, with 0.10 10.7 %), `heroScreen` (0.52, 0.62), yaw the one `orient` gives: ONE room, Hub yaw 0, L 28.8 x W 30.7, "lowest part -> POI goal" (the throne). `orient`, `planes` and `props` are ON (`planes`: back wall 64 tiles, 8 columns, front 96; `props`: 12 torches and the goal); volumes (the pillars and the closing walls, commit 2: see below), billboards and ribbons (commit 3) and the emblem are NOT in this commit. Screenshots: `../../shots/throne1/` (`tools/ui/throne_world_shots.js`).

## Commit 2: the scenography as GEOMETRY (S4b volumes; nothing walkable moves)
The example declares nine volumes (`volumes` in `src/modes.js`, MAP coordinates, `volumesOn: true`: the switch "Stage volumes" starts ON, one line of `src/ui.js`; no billboards, ribbons, emblem or `z`: commit 3):

| volumes | where | height over the nearest walkable ground | roof |
|---|---|---|---|
| 6 pillars (2 x 2 tiles) | `Q` at (6, 4) and (26, 4) on the north band; `P` at (6, 12), (26, 12), (6, 20), (26, 20) | 5 H | 6.05 H over the band, 5 H over the floor |
| north wall | x 0-33, y 0-3 (grid rows 0-1) | 8 H | 9.05 H (the centre tile is on the 1.05 H band) |
| west and east walls | x 0-1 and 32-33, y 4-33 | 8 H | 8 H |

280 tiles, none omitted (`S.stageVolumes.skipped` is empty), +4 levels. The walkable footprint and its heights are the same with the switch on and off (624 tiles, one region, 0 stairs, 0 dropped, yaw 0), the Commit 1 walk gives the same distances and never crosses a pillar.

**Pillar height: 5 H.** The remake clips the near pillar at the top edge (base about 150 px from it, hero 43.5 px: at least 3.5 H; clip about 5 H +- 1): at 5 H the two north pillars are cut by the top edge, at 4 H their tops show. The ground the pillars hide is the same at 3, 4 and 5 H (table below), so the height is chosen by the look.

**Closing walls: route (a), volumes, not more rows in the grid.** The terrain wall (3.47 H) and the back wall of `planes` (4.05 H) leave the top of the frame empty (void colour 42 / 37 / 64 at the top, the camera pitches 25 deg and the map ends): measured in the DRAWN canvas (pixels of the void colour where the pick buffer has no terrain, eroded by one pixel), 15.4 % with the hero on the dais, 18.1 % on the throne, 2.8 % 4 old tiles off the axis (void beyond the west edge). Route (b) (rows of wall in the DATA, flat at 3.47 H) removes about 2.7 points per old row (1, 2, 3 rows: 14.4 / 11.7 / 9.0 % at the dais), so it needs about 6-7 rows (a grid of 17 x 24, everything shifted) and 3 columns each side for the off-axis case: more data, more tiles to draw, and `heroAt`, the volumes, the shots and the tests all move. Route (a) is three declared volumes and no data shift. The height: 4 H leaves 2 % at the dais and 4 % at the throne, 5-6 H close the seven positions (the north wall height does not matter beyond 4 H, the SIDE walls do), 8 H also the extremes (x = 5 and 29, corner at (3, 6.5)): 8 H.

**Occlusion criterion (user's decision, 2026-11-10).** The S4b rule (no walkable tile loses more than 25 % of its pixels to a volume) holds for the walls and everything that is not a pillar; for the PILLARS the lateral floor beside and behind them may lose more (the remake hides it) with ONE condition: 0 tiles of the carpet (role `path`: the carpet, the dais steps, the throne, the passage) and of the landing lose more than 25 %. "Dais" = the carpet strip and the throne (the rows 5-2 of the carpet columns, which are in the `path` mask); the NORTH BAND beside it (rows 2-3, 1.05 H, the pillars `Q` stand on it) is lateral floor.

Measured at yaw 0 (the example's yaw; the S4b README measured at 180), pick buffer, tiles with at least 200 px visible without volumes; `n > 25 %` / worst %, pillars 5 H + walls 8 H (`node tools/ui/test_throne_world_ui.js` prints it):

| position (hero) | tiles | pillars: carpet | landing | north band | side floor | walls: worst of all groups |
|---|---|---|---|---|---|---|
| axis, 3 old tiles from the dais (17, 18) | 443 | 0 / 18.6 % | 0 | 28 / 99.6 % | 43 | 0.4 % |
| axis, 6 old tiles (17, 24) | 494 | 0 / 20.6 % | 0 | 30 / 98.2 % | 90 | 1.4 % |
| entrance passage (17, 27) | 431 | 0 / 23 % | 0 | 18 / 97 % | 79 | 0.9 % |
| landing (17, 31) | 260 | 0 | 0 | 0 | 38 | 0.5 % |
| off the axis, 4 old tiles, west (9, 18) | 338 | 0 / 18.7 % | 0 | 15 / 100 % | 38 | 10.3 % |
| off the axis, 4 old tiles, east (25, 18) | 353 | 0 / 10.3 % | 0 | 18 / 100 % | 44 | 18.2 % |
| dais (17, 8) | 212 | 0 / 2.9 % | 0 | 0 | 1 | 0.3 % |
| throne (17, 6.5) | 183 | 0 / 3.8 % | 0 | 0 | 0 | 0 |

Pillar height, same table, `carpet / landing / north band / side` tiles lost > 25 % (worst carpet tile): 3 H: axis 3: 0/0/28/44 (18.6 %), axis 6: 0/0/23/90 (21 %), passage: 0/0/15/79 (21.4 %), off the axis: 0/0/8/38 (18.5 %); 4 H: 0/0/28/43, 0/0/30/90 (21 %), 0/0/18/80 (23 %), 0/0/11/38; 5 H: 0/0/28/43, 0/0/30/90 (20.6 %), 0/0/18/79 (23 %), 0/0/15/38; the landing, the dais and the throne do not change. The carpet condition holds at the three heights.
NOT covered by the condition (reported): with the hero hugging a side wall, 6 old tiles off the axis (x = 5 or 29), a pillar hides carpet tiles (9 tiles, worst 100 % at x = 5; 3 tiles, 64 % at x = 29): the pillars `P` stand 1 tile from the hero.

**Visible background (drawn canvas), volumes off -> on:** axis 3 and 6, passage, landing 0 -> 0 %; off the axis 2.8 -> 0 % (east 1.9 -> 0 %); dais 15.4 -> 0 %; throne 18.1 -> 0 %; x = 5 14.1 -> 0 %, x = 29 10.2 -> 0 %.

**What `planes` does now (stays ON, `planes.js` untouched):** the 64-tile back wall and the four columns at the north corners (x = 1 / 32, y = 4 / 7, roof 4.05 H) are gone: the 8 H walls are higher than their roofs, so `planes` skips them. The four columns beside the entrance passage REMAIN: (15, 25), (20, 25), (15, 28), (20, 28), 3 H, on the parapet tiles next to the passage (every 3 rows). They hide CARPET of the nave behind them (tiles with more than 25 % hidden: 29 carpet + 1 lateral at the axis 3, 37 at the axis 6, 27 in the passage, 17 on the landing, 8 off the axis, 0 on the dais and the throne): the state of commit 1, not caused by the pillars. A 1 H volume over the parapet strips does not remove them (planes applies its 3 H column over the lower volume). Options that need only data: none found that removes them (a volume at least as high as the column hides the same carpet); options that need code (not done, the user decides): `planes.js` skipping a column whose shadow falls on the `path` mask, or placing the columns further out.

## Known, kept as it is (the user's decisions)
- The north band (rows 2-3 beside the carpet) is at 1.05 H (5 sub-levels). From the side the arrow keys climb that 1.05 H front without a stair: `E.stage.move` only checks `walkable` (the previous behaviour of the viewer); the climb limit of 2 sub-levels applies to the walking graph (the route), not to the hero's keys. The carpet itself is climbed in single steps of 1 sub-level.
- The walls are 3.47 H: the top of the map with `terraces` 2 (`planes` adds its back wall on top).
- 2 x 2 px per old tile (see above).
