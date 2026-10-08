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
| **Balanced types** (preset: + minPlateau 120) | 88 | 29 / 30 / 29 (with the rule D-D: 29 / 18 / 41) | 48 | 73.0 % | 74.7 % | 4 |
| + minPlateau 250 | 88 | 25 / 33 / 30 | 43 | 73.5 % | 75.2 % | 4 |

Reading (user's decision: the preset "Balanced types" includes minPlateau 120): minPlateau 120 improves BOTH things on top of 3 terraces + core 100 + radius 5: the types are evener (29 / 30 / 29, spread 1 against 5) and the main region grows 70.3 -> 73.0 % (walkable 72.0 -> 74.7 %), with 6 fewer ramps. minPlateau 250 connects a bit more (73.5 %) but unbalances the types again (25 / 33 / 30). rRadius 14-30 gives only Cake; gateThr 0.45 / gateMin 8 leaves 5 % connected (user's measurements).
Balanced types (with minPlateau 120) + Cake: see `node tools/test_roomtypes.js` (info line). Before minPlateau 120 it was 31 bowls + 8 pyramids, 3850 ring tiles, 21 levels (9 without Cake).

Viewer: Rooms group -> "Rooms preset" (Default / Balanced types / Custom; it only sets terraces, Min core size, Room radius and Min plateau), sliders Min core size 5-250 (default 20), Room radius 3-30 (default 9, `P.rRadius`, already a generator parameter) and Min plateau 1-300 (default 5; it was 1-20). The preset and the switches are saved in the optional `viewer` block of the manifest (`docs/pack-format.md`).

## Rule "Diorama never touches Diorama" (types stage, `P.dioNoTouch`, default ON)
After the V16.4 rule: two Dioramas joined by walking (>= 3 valid transition pairs between them, `P.dioTouchMin`) cannot both stay: the biggest wins (greedy by size, ties by id), the other becomes Ascension. Balanced types: 30 Dioramas -> 18, 12 -> Ascension (2452 tiles), totals 29 / 18 / 41; Default (0 Dioramas) is unchanged. Only labels change: with Cake and the tint off the picture is identical (regression, D-D on vs off).

## Pocket (pseudo-space) of a Diorama (`src/pocket.js`, `P.pocket`, Pocket view switch; off by default)
The map does not change. The FRAGMENT of the Diorama (its real tiles, levels, sub-terraces, walkability, ramps) is the same in the world and in the pocket; only its surroundings change. The pocket is bigger than the footprint and closed (Hades style). Fixed camera for now; composition made for Iso (yaw 45), the fragment sits in the back third.
- WORLD SHAPE, NO PATCH: the pocket is built from the shape of the WHOLE map (no slice), so the ramps, gates, regions and walking of the fragment are exactly the world's (no patch connections: a slice adds ramps the world does not have). Test: for the 18 Dioramas of Balanced types the fragment is identical tile by tile to the full-map shape (height, terrace, walkable, ramps).
- Input: a LIST of room ids (always one today). Double dioramas of two rooms are NOT implemented: only 2 pairs of the map are joined only by a cliff and none faces the camera.
- Disc: centre = centroid moved 1 r toward the camera (so a band is left behind the fragment for the backdrop), R = 3 r; if any fragment tile would be outside, R grows until all are inside. Nothing outside the disc. The world shape is REFRAMED to the window of the disc (`E.pocket.windowOf`, `E.pocket.reframe`: arrays copied at an offset, the ramps that do not lie wholly inside dropped, indices remapped; the window may extend past the map, with void there; no recomputation, so the world is untouched). B costs per tile and per level, so the empty rest of the map is not carried.
- Relief: seeds proportional to the area (one per 80 tiles, 30..48), weights 0.5 + noise (like Step3_ApplyVoronoi), deterministic by room id. The offset of a cell comes from the DISTANCE of its seed to the fragment along the camera axis (a ray away from the camera that hits the fragment = in front of it): in front the bands of that distance give 0, -1, -2 (the pond goes in the lowest), behind +1, +2, +3 (the backdrop); neighbouring cells differ by at most one band (relaxation, so no table with 2-terrace walls). Chance only picks the seed positions and the jitter of -1, 0 or +1 sub-level per cell. The heights are QUANTIZED (snapped down) to the existing grid of levels extended beyond the lowest and highest terrace, so the jitter creates no new level: the pocket adds 12-19 levels (rooms 31, 7, 64, 49: 19, 15, 17, 12) and B takes 0.8, 2.0, 1.7, 0.4 s for all three panels in compare mode (it was 7-13 s with 49-52 new levels). The reference of a tile is the nearest fragment tile. HARD RULE: nothing in front is higher than the fragment edge that faces it.
- Colour: the decoration has levels of its own (never shared with the fragment); under the lowest terrace it keeps going darker, over the highest it does not get lighter; it is always strongly desaturated and darker than the fragment (which keeps its full colour) and its brightness is capped (max channel 150), so the backdrop never gets close to white.
- Paths (exits): at each face where the world walking graph crosses to another room: a path of width min(run, 2) from the middle face, straight to the edge of the disc (bent around a notch), drawn ON the decoration (it keeps the height of the cell it crosses, it is not an embankment) with a short ramp (3 tiles) from the fragment's height; parallel runs of the same direction less than 3 tiles apart become one.
- Pond: the lowest cell of the front (nearest to the camera) that keeps tiles after the paths; at most 50 % of the fragment's tiles, the ones nearest to its seed.
- Floors ("double", user's criterion): a terrace of the room with >= 20 walkable tiles (valid walkable region of the world) is a floor; floors joined by a ramp inside the room are ONE floor; two floors without a ramp = double. Balanced types: 7, 10, 30, 31, 34, 64, 80 (cliff facing the camera: 31, 34, 64, 80).
- Viewer: Rooms group -> "Pocket view"; a chosen Diorama (chip or a click on it in the world) is drawn as its pocket in Box / A / B (compare mode included); Display -> "Diorama footprint outline" draws the footprint of every Diorama in the world. Info line: fragment tiles, pocket tiles, exits, pond (and its limit), backdrop band, seeds, floors, double. Tests: `node tools/test_pocket.js`, `tools/ui/test_pocket_ui.js`. Switch off = identical pixels (regression).
- NOT reproduced from the user's code (generator work): the 40 % displacement of platforms toward the centre, enlarged detailed terrain, Voronoi cells of neighbouring rooms.
- Port to Unity: an RPG interior in the same place: same fragment, environment swapped with a crossfade when the focused unit enters the fragment. With the rule D-D two active pockets never touch.

## Pocket framing (archetypes) — user's design, reviewed with a mock-up
The pocket is FRAMING, not more terrain: what surrounds the fragment must separate it (water, void, a drop) so it is the protagonist. Still not walkable. `P.pocketFraming` (selector "Pocket framing": Auto / Cerro / Lago / Cascada / Isla / Caída; a manual choice applies to any Diorama) and `P.pocketHeight` (slider "Pocket height" 1-4, default 2.5; it multiplies ONLY the relief of the decoration, the fragment keeps the world's heights). Separation s = max(2, 0.6 r) tiles. Heights are still quantized to the extended level grid.
- **Cerro (hill)**: the fragment is the high point; front bands -1, -2, -3 by distance, sides -1, small pond (<= 50 % of the fragment's tiles), backdrop +1..+3 behind. Exits: paths on the decoration with a 3-tile ramp.
- **Lago (insula)**: water ring of width s, open to the front (front cells up to 2.2 s); water at (lowest floor - 1.2 terraces x Pocket height); shore just above it, backdrop behind. Exits: causeways at the fragment's height over the water, then ramp + path.
- **Cascada (double)**: lake on the side of the low floor; behind and beside the high floor the decoration keeps the height of that floor (cornice); a 2-tile water channel one sub-level below the cornice runs along the outer side of the high floor to where the cornice ends and falls into the lake (the wall under a water tile takes the water colour).
- **Isla (Hades)**: ring s of VOID (not drawn); beyond it a rock ring (width max(3, 0.3 r)) at +1..+2 behind and at the sides, void in front. Exits: short bridges at the fragment's height over the void, ending at the ring.
- **Caída**: ring s of void; the rest of the disc far below (-3..-4 terraces x Pocket height); exits: a short bridge over the void ring at the fragment's height (as in Isla) and then a path that DESCENDS along its whole length to the level of the landscape (its walls reach the landscape, not the deep base).
- **Water is a level** with its own colour (`levelMeta.water`), flat per level so it is smooth in A and B; no per-tile tint.
- **Deep base**: Isla and Caída set `S.baseH` = lowest height of the pocket - 3 terraces x Pocket height, so the walls over the void go down to it (a floating rock, not a slab). Only pockets set it.
- **Camera**: `S.sliceBox` = fragment bbox + ~2 r; `S.fitH` = the fragment's heights (the tall backdrop / deep drop spill off the frame, never the fragment).
- **Auto** (`E.pocket.chooseArchetype`): double -> Cascada; else pos = dominant terrace / (N-1), rel = room mean terrace - mean of its neighbours' mean terraces, coast = perimeter faces toward void / perimeter faces. Low (pos <= 1/3, rel <= -0.3 or coast >= 0.25) -> Lago; high (pos >= 2/3 or rel >= +0.3) -> Caída; middle: Cerro if at least half of the neighbours are lower Cake rooms (mean < room mean - 0.3) or the largest arc without exits (angles of the exit groups per neighbour from the centroid) is >= 180 deg, else Isla. Balanced types: 7 Cascada (7, 10, 30, 31, 34, 64, 80), 6 Isla (4, 20, 38, 49, 53, 68), 4 Cerro (22, 35, 66, 74), 1 Lago (25), 0 Caída. The info line names the archetype and its reason.
- Cost (compare mode, B for all three panels): rooms 31, 7, 64, 25, 20: 0.6, 1.9, 1.3, 0.2, 0.5 s; levels added 14, 19, 12, 12, 14.
- **Small rooms and exits** (user's decision on PR #10): the disc has a minimum radius of 14 tiles (`Rmin`; room 25 has 52 tiles); ONE path per neighbouring room (its longest run of exit faces, after merging the parallel ones); in Lago / Cascada the pieces of path of less than 3 tiles after the water (or between water) are removed.

## Ascension walls (phase 2, part B; `P.ascWalls`, switch "Ascension walls", off by default = identical pixels)
Reference: Zelda, A Link Between Worlds (connected chambers that build a catacomb). A thin wall on every room-border face WITHOUT a transition (a face that blocks, `S.roomKind` 1) that has an Ascension room on at least one side (rule D-D on: 41 Ascension rooms in Balanced types).
- **Where** (`E.roomTypes.ascWalls`): never on an open transition (the doors stay open), never on a face of a ramp tile (`S.carved`), never toward void; only runs of 3 faces or more (consecutive faces on one line). Balanced types, whole map: 1863 candidate faces, 655 walls in 170 runs (1208 faces dropped by the minimum run; run length median 3, max 10).
- **Shape** (`src/render.js`, `drawAscWall`): a box 0.15 tile thick over the edge of the face, base = the higher of the two tiles, height ABSOLUTE 0.7 (it does not scale with the terrace height or with Pocket height), with a top cap; per face, tile-exact, identical in Box, A and B (like the slice border); stone colour, dark outline; veil colour outside the slice.
- **Cut** (`E.roomTypes.ascWallLow`): a face whose wall would stand between the camera and the inside of an Ascension room (the outward normal of that room faces the camera) is drawn low (0.15, a plinth); the back ones keep the full height. A face between two Ascension rooms is full only when it is the back one for both (edge-on), else low. It is recomputed for every camera preset.
- **Painter order**: Box draws a wall after the later (painter order) of the two tiles of its face. A / B cut the wall into BANDS at the heights of the levels it crosses (like the ramps) and draw each band in the pass of the level at the top of its band, after the cap, sorted by depth. Measured against a per-pixel z-buffer reference (`tools/ui/test_asc_ui.js`, 10 runs x 8 directions, Oblique 50 and Iso 45): Box mean 0.00 % / worst 0.08 %; A and B mean 0.36 % / worst 7.87 % (before the band cut: A 0.24 / 10.0, B 0.30 / 5.5 % with a worst of 11.7 % in tile-exact A / B: a higher slab behind the wall painted over it).
- **Not changed**: walking, route, stake and pick (the walls are not walkable nor selectable; the pick render skips them).
- **Visibility** (the old problem: do walls hide the walkable tiles of the Ascension rooms?): Balanced types, Iso 45, whole map, 5136 walkable Ascension tiles, Box id render: without walls 100 % of the tiles keep >= 50 % of their pixels visible; walls of full height on every face 99.1 % (mean visible fraction 99.0 %); with the cut 99.9 % (99.7 %). Well above the 90 % bar.
- Tests: `node tools/test_walls.js`, `tools/ui/test_asc_ui.js`.
- Port to Unity: one wall prefab per run of border faces (a 0.15 x 0.7 box on the edge, stone material); the front cut is Zelda's: it is recomputed whenever the camera changes (a face whose Ascension room normal points at the camera uses the low variant).
