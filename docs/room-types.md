# Room types (Cake / Diorama / Ascension) — phase 1

Technique: the user's crystallizer (`reference/SingleRoomMeshGeneratorV16.4.cs`, index in `reference/README.md`). Code: `src/roomtypes.js`. Needs the Rooms switch.
Viewer controls: Rooms group -> "Cake rings" switch and sliders (Cake · rings 1-6 = 3, ring step 0.1-0.6 of the terrace height = 0.3, tiles per ring 1-3 = 1, seam window 2-12 = 5); Display -> "Room type tint" (Cake orange, Diorama green, Ascension blue).
The info shows "Room types" when the Cake switch or the tint is on.

## What follows the ACTIVE code
`GenerateRoom` ends with `BuildCakesForCurrentRoom(platformHeights); return;` (lines 648-649). PASS 1/2, `DetectCakeDirection` and `DetectCakeViaTerraceEdges` are dead code and are not used.
`BuildCakesForCurrentRoom` (1719), `BuildCakeDownRingsSimple` (1670), `BuildCakeUpRings` (1602) and the type rule (473-560) are.

## Rules (and how they are adapted to the viewer: no platforms, terraces touch)
- Input: rooms, terrace per tile, used terrace gates (the tree's), room transitions; all of the WHOLE map (classification does not depend on the slice).
- Type: CAKE = >= 2 terraces in the room, cakeLayers > 0 and a terrace edge (the LOW tile of a used gate pair whose two tiles are in the room); DIORAMA = not cake and >= 3 neighbouring rooms by transitions (the lobby-platform count is lost);
  ASCENSION = the rest.
- One cake per terrace link (low, high). Direction: one link -> the terrace with more room PIECES (4-connected) wins: more on the high = Down, more on the low = Up, tie = Down; several links -> Down only if low is the room's minimum terrace.
- Core = all the room's tiles of the core terrace (low if Down, high if Up). Rings = Dilate8 shells outside the core (d tiles each); Down is clipped to the seam window; Up goes around the whole core (no "high side" filter: the rings already sit on low tiles).
  Down: CUT into tiles of the high terrace; Up: BUILT on tiles of the low terrace; same room only, no void; ramp footprints reserved; empty rings dropped and renumbered; diagonal gaps stitched only with free candidates.
- Corridor (user's decision): the rings must not bury a ramp. Pyramid: the low-terrace tiles straight in front of the foot of each column of the ramp are reserved (layers x tiles per ring long); bowl: the same behind the head, on the high terrace. Same width as the ramp, same height as its terrace, it stops at the room's limit, void, another terrace or another ramp.
  If the straight way is closed at once, the free neighbours of the end tiles are reserved. Measured (5 terraces, `node tools/diag_cake_ramps.js`): ramps with the foot enclosed by ring tiles > 0.25 above: 78 -> 0; heads enclosed by lower ring tiles: 2 -> 0; ring tiles 15205 -> 14409 (796 lost; 1007 corridor tiles reserved).
- Heights: Down core top + (k+1) step, Up core top - (k+1) step, step = min(0.3 terH, (gap - 0.05 terH) / n) with gap = lowest high tile - core top (Down) or core top - highest low tile (Up). The rings replace the sub-terraces on their tiles.
- Conflicts: a tile in rings of two links keeps the smaller ring index (tie: the lower link).
- Walking, regions, stake and route do not change (rooms walking ignores levels).

## Measured (real map, rooms on, defaults)
| Terraces | Cake / Diorama / Ascension | links (bowl + pyramid) | ring tiles | levels |
|---|---|---|---|---|
| 5 | 31 / 0 / 1 (the user's figures) | 30 + 40 | 14409 of 44582 land (15205 before the corridor) | 15 -> 41 |
| 3 | 27 / 5 / 0 (expected values) | 26 + 14 | 6573 | 8 -> 23 |
| 2 | 26 / 4 / 2 (expected values) | 19 + 7 | 4057 | 5 -> 14 |
The earlier 30/2/0 and 28/2/2 (user) came from counting every candidate gate and only pieces >= 20 tiles; the figures above are the correct ones (user's decision). Variants of "terrace edge" tried at 3 / 2 terraces (none gives the expected figures): used pairs 27/5/0 and 26/4/2 (= ramps, = used gate groups), candidate gates 31/1/0 and 30/0/2, any terrace adjacency inside the room 31/1/0 and 32/0/0.
Cold (headless Chromium, compare mode, whole map): rooms on 2.7 s to the first panels, 5.2 s to all three; with Cake rings 3.7 s and 10.0 s (B grows with the number of levels: 41 instead of 15).

## Phase 2 (not done)
Wall offsets (cake -5, diorama -20, ascension +0.5 in world units, tileSize 10): in the user's code they are the wall that encloses the room; the viewer has no room walls. Needs its own design.

## For Unity later
`classify` and the ring construction port as they are (sets of tiles, BFS); the level assignment replaces the heights given to `BuildPlatformMesh`. The viewer's figures are acceptance numbers for the port.

## Balancing the types with the generator's existing parameters (no new logic)
User's decision: no Cake cap and no change in the classification; the types are evened out only with parameters that already exist. `node tools/room_types_table.js` reproduces the table measured in the viewer (real map, rooms on, Cake off):

| Row | Rooms | Cake / Diorama / Ascension | Ramps | Main (% of the land) | Walkable | Edge problems |
|---|---|---|---|---|---|---|
| default | 32 | 31 / 0 / 1 | 140 | 73.8 % | 74.3 % | 1 |
| core 100 | 32 | 24 / 3 / 5 | 83 | 69.0 % | 69.9 % | 3 |
| minPlateau 250 | 32 | 28 / 3 / 1 | 82 | 78.6 % | 78.6 % | 0 |
| 3 terraces + core 100 | 32 | 20 / 7 / 5 | 44 | 74.8 % | 76.5 % | 4 |
| rRadius 5 | 88 | 62 / 7 / 19 | 156 | 61.1 % | 69.4 % | 8 |
| 3 terraces + core 100 + rRadius 5 | 88 | 32 / 29 / 27 | 54 | 70.3 % | 72.0 % | 4 |
| **Balanced types** (preset: + minPlateau 120) | 88 | 29 / 30 / 29 | 48 | 73.0 % | 74.7 % | 4 |
| + minPlateau 250 | 88 | 25 / 33 / 30 | 43 | 73.5 % | 75.2 % | 4 |

Reading (user's decision: the preset "Balanced types" includes minPlateau 120): minPlateau 120 improves BOTH things on top of 3 terraces + core 100 + radius 5: the types are evener (29 / 30 / 29, spread 1 against 5) and the main region grows 70.3 -> 73.0 % (walkable 72.0 -> 74.7 %), with 6 fewer ramps. minPlateau 250 connects a bit more (73.5 %) but unbalances the types again (25 / 33 / 30). rRadius 14-30 gives only Cake; gateThr 0.45 / gateMin 8 leaves 5 % connected (user's measurements).
Balanced types (with minPlateau 120) + Cake: see `node tools/test_roomtypes.js` (info line). Before minPlateau 120 it was 31 bowls + 8 pyramids, 3850 ring tiles, 21 levels (9 without Cake).

Viewer: Rooms group -> "Rooms preset" (Default / Balanced types / Custom; it only sets terraces, Min core size, Room radius and Min plateau), sliders Min core size 5-250 (default 20), Room radius 3-30 (default 9, `P.rRadius`, already a generator parameter) and Min plateau 1-300 (default 5; it was 1-20). The preset and the switches are saved in the optional `viewer` block of the manifest (`docs/pack-format.md`).

## Phase 2, part A: the Diorama BACKGROUND bubble (mock-up, diagnostic flag `P.dioBubble`)
User's design: Diorama rooms are the scene of a HADES-style composition (silhouettes, framing, flat colour); the bubble is the BACKGROUND. Their code: `skeletonMeshmakerGenV4.cs` (`Step3_ApplyVoronoi` 235, `VoronoiPartitioner` 527): weighted Voronoi, distance^2 / weight^2, weight 3 for Diorama (3x the radius), ~9 noise seeds per room; `PackPlatformsIntoRegion` (566): platforms with a connection stay fixed, the rest moves 40 % toward the centre; in V16.4 the bubble is `BuildPocketWall` (2970: convex hull + Chaikin 3 + 2 tiles).
Mock-up (nothing is on by default, no UI control, set `window.__evo.P.dioBubble = 3` and recompute): with a Diorama room as the slice there are THREE planes: SCENE = the room (as today); BACKGROUND = the tiles outside the room up to `factor` x the equivalent radius (sqrt(tiles / pi), measured from the centroid of the room), growing 4-neighbour only across CLOSED borders, never across a room transition or a used terrace gate (a ramp), at any depth, never onto void; VEIL = the rest (as today).
The background keeps the real relief (levels) but is painted as a backdrop, the same in Box, A and B: 3 flat tones by height band, darkened toward the silhouette in 5 nested steps (alpha 0.28 each, thresholds 0, 0.2, 0.4, 0.6, 0.8 of the way from the equivalent radius to the limit of the bubble), no tints, no route or room marks, not walkable (blocked, in no region), no marks accepted. The window grows to hold the bubble. Code: `E.roomTypes.bubble` (`src/roomtypes.js`), `S.bg / S.bgT / S.bgBands / S.openLoops / S.bubbleInfo` (`src/shape.js`), `bgRGB`, `bgCap` (`src/render.js`), info line in `src/ui.js`. Tests: `tools/test_roomtypes.js` (hand-made map with doors, a used gate, void and the radius; real map: three planes, not walkable, same scene).
Measured with Balanced types (30 Diorama rooms of 88; the smallest bubbles 370 tiles, the largest 8191): coastal room 38 (256 tiles, 10 faces on void): bubble 1922 tiles, perimeter 138 faces: 99 toward the bubble (72 %), 29 open (21 %), 10 void (7 %); inner room 49 (251 tiles): bubble 2005 tiles, 96 faces: 78 toward the bubble (81 %), 18 open (19 %). The open faces are where the original fragment sits against the edge of the bubble (where it connects).
NOT reproduced (generator work): moving platforms 40 % toward the centre (`PackPlatformsIntoRegion`), the weighted Voronoi with ~9 noise seeds per room (the bubble here is a plain disc clipped by closed borders), enlarged terrain with detail, the convex hull + Chaikin envelope of `BuildPocketWall`. To port to Unity: `T.bubble` (a BFS over tile sets with the door / ramp test) to choose the background tiles; the look (tones, silhouette steps) is art, not code.

