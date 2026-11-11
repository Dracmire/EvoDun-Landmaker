# Throne room of Aliahan Castle: "MAPA 1" (the throne world, commits 1, 2 and 3)

The ROOM of the paired shot `../pairs/p_20261029_192049_throne_room_orig_remake.png` (left half = the SFC original, right half = the remake), read BY HAND from the left half and turned into the role images of mode 3 (zones, elevation, path, poi) like Forest and Aurhea.
It is NOT the room of `../old/castle_scenario.png` (that rip is the "Dragon Quest 3 Remix" hack: blue floor, a 4-5 tile carpet, hedged gardens, a curtain: another room).

- `map1.txt`: the ONE source of truth, a 17 x 13 grid of old tiles with a legend (MAP 1 v2, see the next section; v1 was 17 x 17). Row 0 is the north (the throne); the camera of Cam 6 looks north (yaw 0).
- `derive_roles.py`: deterministic (`--check` compares with the committed files): writes `zones.png`, `height.png`, `path.png`, `poi.png` and `manifest.json` (`evodun-pack/0.2`). 2 x 2 px per old tile (like Forest: 1 px = 1 viewer tile at tilesPerH 2). `node tools/test_throne_pack.js`.
- The viewer embeds the four PNGs (`data/packs.js`, `EVO_THRONE_PNG`, `tools/build.py`) and `src/ui.js` `thronePack` decodes them on the first selection of the example `throne_aliahan` (mode 3).

## MAPA 1 v2: a SQUARE, SYMMETRIC room, no parapet, no passage (user, 2026-11-11)
The order is to REPRODUCE the throne room of Aliahan: the old map is a rectangular room with a red carpet, SYMMETRIC, and the hero walks from the door to the king with nothing in the way. Anything that is not in the original, or breaks it, is a defect even if an earlier commit put it there. Sections below that mention the passage, the landing or the parapet describe v1 and are kept as history.

- **What was wrong in v1 (commit 1):** rows 12-16 of the grid (a 3-row parapet `p` of 0.84 H, an entrance passage `G` at the old columns 8-9, a landing `E`, a south wall) are NOT in the original. Measured on the SFC half of the pair (671 px wide): the room spans x 90-550 (axis 320), the carpet of the nave is centred at 320.5 and the carpet of the door at 320.0: the door is CENTRED, v1 had it one viewer tile off. With the camera south of the hero the parapet was an OCCLUDER of the carpet.
- **v2:** the grid is 17 x 13 old tiles (34 x 26): rows 0-11 as they were (nave, dais, throne, six pillars, north / west / east walls: nothing moved) and ONE south row of `W`, which `planes` lowers below the floor as its FRONT (60 tiles). The door is the south end of the carpet (in the original it is in the wall behind the camera). With the grid cut at row 11 (12 rows) everything measures the same, but at the hero (17, 23) the frame shows a strip of void under the slab (about 14 % of the panel); with the row it is 0 %: the row stays. (Not usable, tried by the reviewer: a flat or lowered WALL zone south of the nave turns the camera of `orient`; flat PILLAR-zone floor leaves a far wall band.)
- **What changed with it:** 576 walkable tiles (624 - 48); the role `path` is 280 tiles (304 - 24) and the ribbon of the passage is gone (5 ribbons); the west and east wall volumes are 20 tiles deep (y 4-23; 236 volume tiles, none omitted); `props` gives 8 torches (12); NAVE is now the place 2 of the zone table (the zones are numbered from the lowest mean elevation and the six pillar cells are lower on average; the window is declared by the RAW id 1, nothing else depends on it); `planes`: no column candidate is left (the four that `planesAvoidPath` omitted stood on the parapet), so that option has no effect on this map (its rule is tested in `tools/test_planes.js`). No object or volume stood at y >= 24.
- **Positions of the tests:** "passage" (17, 27) and "landing" (17, 31) no longer exist, and "axis 6" (17, 24) is now the south row: the eight are (17, 18), (17, 13), (17, 21), (17, 23), (9, 18), (25, 18), the dais (17, 8) and the throne (17, 6.5).

**Symmetry** (`test_throne_world_ui.js`, the FINAL shape after volumes and planes, tile (x, y) against (33 - x, y): zone, path, poi, block, height; and every declared volume has its mirror; objects and ribbons are excluded, the king and the chancellor are not symmetric in the original): v1 (#90) 56 asymmetric tiles (zone 32, path 24, block 32, height 56) -> v2 **0**. Mutations: a 0.84 H block on the west half of the south row (56 asymmetric tiles) and a pillar moved one tile (4 tiles, 2 volumes without a mirror) both fail.

**Line of sight** (every `path` tile with at least 200 px of its projected top quadrilateral in the panel; lost = the pixels of that quadrilateral that are not its cap in the pick buffer: ANY occluder, terrain included; billboards do not count; asserted at most 30 % on the axis):

| hero | v1 (#90): tiles > 30 % / > 25 % / worst / carpet visible | v2: tiles > 30 % / > 25 % / worst / carpet visible |
|---|---|---|
| (17, 23) | 27 / 33 / 100 % / 77.6 % | 0 / 6 / 25.5 % at (10, 4) / 87.1 % |
| (17, 21) | 18 / 25 / 100 % / 78.1 % | 0 / 0 / 23.7 % / 88.4 % |
| (17, 18) | 18 / 18 / 100 % / 78.3 % | 0 / 0 / 21.7 % / 90.1 % |
| (17, 13) | 0 / 0 / 15.3 % / 91.2 % | 0 / 0 / 15.3 % / 91.2 % |
| (17, 8) | 0 / 0 / 12.4 % / 92.6 % | 0 / 0 / 12.4 % / 92.6 % |
| lateral, REPORTED: (5, 18) / (29, 18) | 16 / 12 tiles > 30 % | 9 / 4 |
| lateral, REPORTED: (5, 10) / (29, 10) | 28 / 17 | 28 / 17 (the side pillars hide the far edge of the carpet, as in the original) |

Mutation: a 0.84 H block along the south row (the parapet again) makes 28 path tiles lose more than 30 % at (17, 18): the test fails. The pair x = 5 / x = 29 is not a mirror (130 / 146 tiles in the panel, 10 / 4 over 25 %) because the example frames the hero at 52 % of the width (`heroScreen` (0.52, 0.62), a composition parameter of commit 1): with the hero at 50 % the pair gives 137 / 137 tiles, 87.3 / 87.3 % visible and 7 / 6 tiles over 25 % (one tile of rasterisation).

**NOT met, reported:** (1) the 25 % criterion of commit 2 (loss attributed to a pillar, S4b base) at the NEW position (17, 23): one carpet tile loses 26.3 %; it holds at the other seven (worst 18.2 %); the 30 % criterion of v2 holds there (25.5 %). The STRICT base of commit 2 (planes off) is dropped: without `planes` the south row stands 3.47 H in front of the camera in the base itself. (2) With the hero hugging a side wall (x = 5 / x = 29) the lower corner of the frame shows void south of the grid: 14.8 % / 8.6 % of the panel (0 % in v1, whose grid went on 5 old tiles south); 0 % at the eight positions.

**Ribbons and frame.js:** a ribbon paints a tile only when the CENTRE of its top face is visible (the rule of `frame.js`, untouched): a carpet tile half hidden by a pillar keeps the terrain colour on the part that shows (a green fringe at the edge of the occluder). The test asserts that every path tile with a visible centre is painted, and reports the share of the pixels of the path caps that change when the ribbons are removed (99.4 % at (17, 18)).

**Composition against the remake** (`tools/ui/throne_world_shots.js --pair` writes one sheet per position, remake half | viewer at the same hero size, to `tools/ui/out/throne_v2/`, not versioned). SAME: a symmetric room on the axis, the carpet centred with a gold trim on both edges and a medallion under the hero, steps across the whole carpet, the king on the axis at the top, pillars in pairs flanking the nave, armours and banners on the back wall, the pots beside the near pillars, nothing between the hero and the king. NOT the same (listed, not hidden): the dais of the remake is a NARROW raised platform (about 3 tiles, with a stone border) inside wider carpet wings, here the carpet runs 14 tiles wide up to the north wall (the map follows the SFC); the remake has 3 risers under the hero and 2 at the dais, here 5 evenly spaced risers of the terrain colour; the remake camera pitches about 33-35 degrees (more floor, less wall), Cam 6 pitches 25; its 6 candelabra stand at the EDGES of the carpet, the 8 lamps of `props` stand 1.5 tiles from the axis and carry labels; its banners HANG (on the wall and on the pillars) and the crest is high on the wall, here they stand on the ground (no `z`); the chancellor stands ON the carpet beside the hero, here on the band at its edge (the free corridor); the throne is a grey `landmark` tower of `props`; the side floor of the remake has stone ledges (an L), here a flat band; colours are values only (the floor is the terrain green, not purple tiles); the medallions are blocky discs.

## Why 2 x 2 px per old tile (and not 1)
The hero of the remake measures 0.72 old tiles (43.5 px against a carpet of 7 tiles = 424 px at its feet), so 1 H = 1.44 viewer tiles when an old tile is 2 viewer tiles: `tilesPerH` 1.5 (the minimum of the control) gives 0.75 old tile per H. With 1 px per old tile the same hero would need `tilesPerH` 0.72, which the control does not allow.

## Zones (hue ids, maxnode 3) and the footprint
| id | zone | old tiles | viewer tiles | where |
|---|---|---|---|---|
| 1 | NAVE | 144 | 576 | walkable: the dais, the carpet, the side floor: ONE zone, ONE room for `orient` (v1: 156 / 624 with the passage and the landing) |
| 2 | PILLAR | 6 | 24 | six loose BLOCKED cells (outside the window), inside the footprint of the nave |
| 3 | WALL | 71 | 284 | the north, west and east walls and ONE south row that `planes` lowers: terrain of another zone (outside the window) |

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
Cam 6 untouched; `tilesPerH` 1.5, `heroFrac` 0.11 (the control moves in 0.01 steps: the viewer then draws the hero at 11.7 % of the panel height, the remake 11.6 %; with 0.12 it was 12.7 %, with 0.10 10.7 %), `heroScreen` (0.52, 0.62), yaw the one `orient` gives: ONE room, Hub yaw 0, L 28.8 x W 30.7, "lowest part -> POI goal" (the throne). `orient`, `planes` and `props` are ON (`planes`, commit 1 numbers: back wall 64 tiles, 8 columns, front 96 (with the commit 2 volumes and `planesAvoidPath`: wall 0, columns 0, front 96, see below); `props`: 12 torches and the goal); volumes (the pillars and the closing walls, commit 2: see below), billboards and ribbons (commit 3: see below) and the emblem are NOT in this commit. Screenshots: `../../shots/throne1/` (`tools/ui/throne_world_shots.js`).

## Commit 2: the scenography as GEOMETRY (S4b volumes; nothing walkable moves) and its delta (PR #89)
The example declares nine volumes (`volumes` in `src/modes.js`, MAP coordinates, `volumesOn: true`: the switch "Stage volumes" starts ON, one line of `src/ui.js`; no billboards, ribbons, emblem or `z`: commit 3) and `planesAvoidPath: true`:

| volumes | where | height over the nearest walkable ground | roof |
|---|---|---|---|
| 4 pillars of 2 x 2 tiles | `Q` at (6, 4) and (26, 4) on the north band; `P` at (6, 20), (26, 20) on the floor | 5 H | 6.05 H over the band, 5 H over the floor |
| 2 pillars of 1 x 2 tiles | `P` at (6, 12) and (27, 12): the OUTER column of the 2 x 2 blocked cell (the other tiles of the cell stay blocked at floor height) | 5 H | 5 H |
| north wall | x 0-33, y 0-3 (grid rows 0-1) | 8 H | 9.05 H (the centre tile is on the 1.05 H band) |
| west and east walls | x 0-1 and 32-33, y 4-33 | 8 H | 8 H |

276 tiles, none omitted (`S.stageVolumes.skipped` is empty), +4 levels. The walkable footprint and its heights are the same with the switch on and off (624 tiles, one region, 0 stairs, 0 dropped, yaw 0), the Commit 1 walk gives the same distances and never crosses a pillar.

**Pillar height: 5 H.** The remake clips the near pillar at the top edge (base about 150 px from it, hero 43.5 px: at least 3.5 H; clip about 5 H +- 1): at 5 H the two north pillars are cut by the top edge, at 4 H their tops show. The ground the pillars hide is the same at 3, 4 and 5 H (measured with the six pillars at 2 x 2, before the delta: carpet worst tile 18.6-23 %, the north band and the side floor lose the same tiles at 3, 4 and 5 H), so the height is chosen by the look.

**Closing walls: route (a), volumes, not more rows in the grid.** The terrain wall (3.47 H) and the back wall of `planes` (4.05 H) leave the top of the frame empty (the camera pitches 25 deg and the map ends): measured in the DRAWN canvas (pixels of the void colour where the pick buffer has no terrain, eroded by one pixel), 15.4 % with the hero on the dais, 18.1 % on the throne, 2.8 % 4 old tiles off the axis (void beyond the west edge). Route (b) (rows of wall in the DATA, flat at 3.47 H) removes about 2.7 points per old row (1, 2, 3 rows: 14.4 / 11.7 / 9.0 % at the dais), so it needs about 6-7 rows and 3 columns each side: more data, more tiles to draw, and `heroAt`, the volumes, the shots and the tests all move. Route (a) is three declared volumes and no data shift. 4 H leaves 2 % at the dais and 4 % at the throne, 6 H closes the seven positions, 8 H also the extremes (x = 5 and 29): 8 H. Visible background of the drawn canvas, volumes off -> on: 0 -> 0 % on the axis, in the passage and on the landing; 2.8 -> 0 % off the axis (east 1.9 -> 0 %); 15.4 -> 0 % on the dais; 18.1 -> 0 % on the throne; x = 5 14.1 -> 0 %, x = 29 10.2 -> 0 %.

**Occlusion criterion (user's decision, 2026-11-10; "estrado" = reading A, decided by the reviewer).** ESTRADO = the carpet, the dais steps and the throne (the masks `path` and `poi`, the rows 5-2 of the carpet columns). The wings of the north band (rows 2-3 beside the carpet, 1.05 H) are LATERAL FLOOR, not dais; reading B (the wings as dais) cannot be met at any pillar height (2, 3, 4 or 5 H: tiles of the wings lose > 25 % at all of them). The S4b rule (no walkable tile loses more than 25 % of its pixels to a volume) holds for the walls and everything that is not a pillar; for the PILLARS the lateral floor beside and behind them may lose more (the remake hides it) with ONE condition: 0 tiles of the carpet (`path`: the carpet, the dais steps, the throne, the passage) and of the landing lose more than 25 %. The loss is counted to pillars, walls AND the columns of `planes` (a column in front of the carpet is an occluder too).

**Two bases** (yaw 0, pick buffer, tiles with at least 200 px visible in the base; carpet tiles > 25 % / worst %; the landing is 0 / 0 % everywhere; `node tools/ui/test_throne_world_ui.js` prints and asserts the STRICT one):

| position (hero) | STRICT (volumes + planes off) | S4b (volumes off, planes on) | >50 % of the carpet (strict) | columns back (mutation): carpet tiles > 25 % / share > 50 % |
|---|---|---|---|---|
| axis, 3 old tiles (17, 18) | 0 / 9.9 % | 0 / 9.9 % | 0 of 279 | 29 / 9.3 % |
| axis, 6 old tiles (17, 24) | 0 / 19.4 % | 0 / 19.4 % | 0 of 250 | 37 / 12.4 % |
| entrance passage (17, 27) | 0 / 22.6 % | 0 / 22.6 % | 0 of 196 | 27 / 11.2 % |
| landing (17, 31) | 0 / 0 % | 0 / 0 % | 0 of 84 | 17 / 16.7 % |
| off the axis, 4 old tiles west (9, 18) | 0 / 17.1 % | 0 / 17.1 % | 0 of 203 | 8 / 2.5 % |
| off the axis, 4 old tiles east (25, 18) | 0 / 18.2 % | 0 / 18.2 % | 0 of 227 | 24 / 9.3 % |
| dais (17, 8) | 0 / 0 % | 0 / 2.9 % | 0 of 154 | 0 |
| throne (17, 6.5) | 0 / 0 % | 0 / 3.8 % | 0 of 140 | 0 |

NOT covered by the condition (reported): with the hero hugging a side wall, 6 old tiles off the axis, a pillar `P` 1 tile from the hero hides carpet tiles: x = 5: 9 tiles (worst 100 %), x = 29: 3 tiles (64 %).

**The tile of the review, (12, 5) at the hero (17, 24)** (345 px visible in the strict base): "lost to a volume" is what S4b counts (pixels that now belong to a tile a volume raised); "any change" counts every pixel whose pick code changed, which includes the anti-aliased blends along the silhouette of the pillar (colour mixes whose id is no surface). Candidates, the pillar `P` at (6, 12) and its mirror:

| candidate | lost to a volume | any change |
|---|---|---|
| the pillar as it was (2 x 2, 5 H) | 22 % | 29.9 % |
| 4 H / 3 H | 22.3 % | 29.9 % |
| 2 H | 0 % | 10.1 % (a 2 H pillar no longer reads as one) |
| 2 x 1 (north row of the cell only) | 22.6 % | 29.9 % |
| **1 x 2, the outer column, 5 H (chosen)** | 10.7 % | **22.6 %** |
| 1 x 2, 3 H | 11 % | 22.6 % |
| moving the cell one old tile out | not tested: the blocked cell belongs to the pack, so the walkable footprint would change | |

The chosen one changes the composition the least that reaches <= 25 % in the stricter count: the pillar keeps its 5 H and its depth, it is one tile narrower, and from the camera the other tiles of the cell look like floor (they stay blocked). The strict-base "any change" figure is sensitive to the camera (a tile of the lower frame shows 92 % in the strict base because it is a scatter of blended pixels), so only this tile is asserted in that count.

**`planes` columns (the ONE-TIME exception of the user, 2026-11-10, for this commit and the point below; `src/planes.js` is off limits again after it and this is no precedent):** with `planesAvoidPath` a SIDE column is OMITTED when a tile of the role `path` lies in its shadow: the tiles behind it on the view axis up to L = (the column's height in tiles) / tan(25 deg) (3 H at `tilesPerH` 1.5 = 4.5 tiles = 9.65 tiles = 6.4 H behind) and at most 1 tile to each side. The omitted ones are counted (`skipped.path`, in the readout: "columns omitted over the path N"). In the throne: the four columns beside the entrance passage, (15, 25), (20, 25), (15, 28), (20, 28) (3 H on the parapet), are omitted (4 -> 0 columns; the four at the north corners and the back wall of 64 tiles are replaced by the 8 H walls; the front stays 96). Before the delta those four hid carpet of the nave (the "columns back" column above: 8 to 37 tiles > 25 % at six of the eight positions). The pitch (25 deg, Cam 6) is in `E.planes.AVOID`, not in `HYP`: `tools/test_planes.js` pins the content of `HYP` and the commit may not change an expectation (fold it into `HYP` with the user's approval). Opt-in: an example without `planesAvoidPath` is byte for byte what it was (canvas hashes of the 21 states and of the 10 other examples of mode 3 identical to main). `node tools/test_planes.js` (13 + 6 new checks, named mutation `E.planesTest.noAvoidPath`) and the mutation of the new lines: 20 mutants of the shadow rule (rows, lateral reach, thresholds, pitch units, exaggeration, stop-or-continue, the option, the order of the `higher` test...), 19 killed; the survivor `da <= L` -> `da < L` is EQUIVALENT: L = height / tan(25 deg) is irrational for a rational height, so it is never an integer and the two tests agree on every row (the `1e-9` tolerance never acts either).

## Commit 3: the DRESS of the room (ribbons, people and props, the emblem card; DATA only)
Only the example `throne_aliahan` changes (`src/modes.js`: `objectsOn: true`, `ribbon` 6, `objects` 11; no `src/` code, no `z`, `objects.js` / `frame.js` / `props.js` / `planes.js` / `volumes.js` untouched; the pack, the volumes and the walkable floor are the same). `node tools/ui/test_throne_world_ui.js` (section 9), shots in `../../shots/throne3/` (`tools/ui/throne_world_shots.js`: the eight positions and two sheets WITH and WITHOUT the billboards).

**Values, not looks.** The ground stays the dark terrain; the carpet is a lighter mass (`#d9694a`), the trim (`#f3cf6e`) and the medallions (`#f7e3a0`) lighter still; the people are light (the focus: king `#ece4cf`, chancellor `#a9c68f`), the armours dark (`#4b5462`: they frame). No text on any piece (`label: false`).

**Ribbons** (decals on the tiles of the role `path`; they paint TOP faces only: the risers of the carpet and of the dais keep the colour of the terrain; the stone border of the dais and the floor are NOT painted, the floor is terrain painted by role):

| ribbon | tiles | where | status |
|---|---|---|---|
| carpet of the nave | 280 | x 10-23, y 4-23 (14 wide, axis x = 17) | MEDIDO on `path.png` (reviewer) |
| carpet of the passage | 24 | x 16-19, y 24-29 (4 wide, axis x = 18: one tile off the nave's, measured on the pair) | MEDIDO |
| gold trim, 2 ribbons | 20 + 20 | the two outer columns of the nave carpet (x 10 and x 23) | SUPUESTO as to the width (1 tile; the trim of the SFC is about 0.35 tile) |
| medallion upper | 12 | disc at (17, 9.0), radius 1.75 tiles | MEDIDO on the SFC half: centre row 2.48 of the frame = y 9.0 (the reviewer read 8.8), the gold diamond 1.75 tiles in radius |
| medallion lower | 22 | disc at (17, 17.5), radius 2.5 tiles | centre MEDIDO (frame row 6.77 = y 17.5, the reviewer read 17.4); radius SUPUESTO: the diamond is 1.7 tiles, the ring with its corner knots 3.35 |

A ribbon covers the tiles whose centre is within `wH * tilesPerH / 2` of its polyline: a CAPSULE, which would spill past the ends of a wide rectangle (into the north wall and the entrance); so each rectangle is ONE serpentine ribbon of 1 tile through the tile centres (`serp` in `src/modes.js`): the carpet ribbons cover the 304 tiles of `path` EXACTLY and no ribbon tile lies outside `path` (the test asserts both).

**Pieces** (`objects`; `kind: 'pillar'` = a narrow box in a colour of value for a person, like the guards of `golden_throne`; coordinates in map tiles, `at` = on the nave or at the foot of the north wall, `mass` and `layer` are notes for the movement table of commit 4):

| piece | kind, size | where | status |
|---|---|---|---|
| king (R) | pillar 0.45 x 0.9 H | (16.5, 7.4): seated on the POI tile (16-17, 6-7), a little in front of the `landmark` of `props`, which stands on the same tile (16.5, 6.5) and would hide him | place MEDIDO; height 0.9 H (the reviewer's; measured 0.95 +- 0.1 H on the remake) |
| chancellor (R) | pillar 0.45 x 0.9 H | (24.5, 7.5): the north band, next to the east edge of the carpet (x 24 = the first tile outside it) | SUPUESTO: on the SFC half he stands ON the carpet at about (20, 7.6); the reviewer's rule is not on it (the free corridor) |
| 2 armours (F) | pillar 0.5 x 1.3 H | (8.5, 4.5) and (25.5, 4.5): the foot of the north wall, either side of the carpet | height MEDIDO on the remake (statue 1.16 H, with its plinth 1.5 H); place SUPUESTO: on the remake they stand 5.4 tiles from the axis, which is on the carpet in this map (the carpet here is 14 wide) |
| 2 pots (P) | shrub 0.6 x 0.8 H | (8.5, 21.5) and (25.5, 21.5): beside the near pillars, on the carpet side | place MEDIDO; height SUPUESTO: pedestal 0.75 H + plant 0.65 H = 1.4 H on the remake, one piece of 0.8 H here (without `z` the plant cannot sit on a pedestal; the reviewer read 0.6) |
| 4 banners (F) | banner 3 H | (4.5, 4.5), (13.5, 4.5), (20.5, 4.5), (29.5, 4.5): the foot of the north wall | the central pair MEDIDO (+-3.8 tiles of the axis); the corner pair hangs beside the `Q` pillars on the remake: moved out to 4.5 / 29.5 (the pillar cells are blocked); they STAND on the ground (they hang there: no `z`), the flag is the top 28 % of the piece |
| emblem (F) | pillar CARD 2.4 x 2.4 H | (17, 4.5): the foot of the north wall, on the axis | width MEDIDO by the reviewer (2.4 H, cut by the top edge on the remake); a BACKGROUND: any replacement will do; a `pillar` and not a `banner` because a banner of that width draws a pole 12 % of its width thick (a brown bar beside the flag) |

NOT repeated: the candelabra of the remake (12 lamps from the rule `props`, with their label "lamp 1.2 H", which cannot be removed without touching `props.js`), the windows, the flowers, the stone border of the dais. The people do NOT collide (the hero walks through them: blocking them would change the walkable floor). The `landmark` of `props` (the grey tower with its label) stands on the throne tile.

**Budget** (the pixels of the whole panel that change when the billboards, `objects` + `props`, are removed; the ribbons are decals and do not count; cap 30 %; `test_throne_world_ui.js` asserts it at the eight positions):

| position | both | `objects` only | `props` only |
|---|---|---|---|
| axis, 3 old tiles | 6.68 % | 4.41 | 3.03 |
| axis, 6 old tiles | 4.99 | 2.47 | 3.09 |
| entrance passage | 3.88 | 1.92 | 2.47 |
| landing | 2.93 | 1.30 | 2.00 |
| off the axis, 4 old tiles west | 5.02 | 3.63 | 2.16 |
| off the axis, 4 old tiles east | 5.87 | 3.85 | 2.80 |
| dais | 8.08 | 6.31 | 4.17 |
| throne | 8.21 | 7.05 | 3.80 |

The heaviest piece: the emblem card (1.96 % of the panel at the throne), then the armours, the banners and the people (about 0.5 % each). Pots and the corner banners are hidden there. Pieces cut by the edge of the panel (drawn, their box leaves it): the central banners at six positions (3 H tall), the emblem at the axis 6, the passage and the landing, the armours at the landing, the four banners at the axis 3; none on the dais or the throne.

**Free corridor** (from the note on Luminati: free corridors to every objective): at the eight positions no piece but the king has its base on a `path` tile between the hero's row and the throne. The 12 torches of `props` stand on the carpet at +-1.5 tiles of its centre line (6 to 11 of them in those rows at the six positions south of the dais, 0 at the dais and the throne): REPORTED, not asserted.

**Mutations of the test** (made on the declared list at test time): a 6 H x 6 H curtain on the dais takes the budget to 49.8 % and the cap fails; the chancellor on the carpet (17.5, 14.5) breaks the corridor at six of the eight positions; one tile less in the carpet ribbon gives 303 of 304 and the 100 % coverage fails. All three fail the assertion: no equivalent mutant.

**`z` (not done, decided by the user):** a height above the ground (banners hanging on the wall, the crest high, the plant on its pedestal) would need a `z` field in `objects.js`; the banners and the emblem stand on the ground instead. The option stays documented here.

## Known, kept as it is (the user's decisions)
- The north band (rows 2-3 beside the carpet) is at 1.05 H (5 sub-levels). From the side the arrow keys climb that 1.05 H front without a stair: `E.stage.move` only checks `walkable` (the previous behaviour of the viewer); the climb limit of 2 sub-levels applies to the walking graph (the route), not to the hero's keys. The carpet itself is climbed in single steps of 1 sub-level.
- The walls are 3.47 H: the top of the map with `terraces` 2 (`planes` adds its back wall on top).
- 2 x 2 px per old tile (see above).
