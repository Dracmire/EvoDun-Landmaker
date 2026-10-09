# Crystallizer 2 - Room types (Cake / Diorama / Ascension)

Dates: the "merged" date is the date of the merge commit of the PR in `git log`; it is NOT the date the decision was taken. "date not recorded" = CLAUDE.md and `docs/` name no PR for that decision. A PR named "by its merge title" is matched from the title of the merge in `git log`, CLAUDE.md does not name it. The long texts stay where they are and are linked, not moved: [`docs/room-types.md`](../../room-types.md), [`docs/rooms.md`](../../rooms.md), [`docs/measurements.md`](../../measurements.md), [`docs/pack-format.md`](../../pack-format.md).

## 1. Status

CLOSED in this phase (CLAUDE.md "Pending" 5; user's decision, PR #13, merged 2026-10-09). Classification + tint + Cake geometry + Ascension walls + Pocket with the framing archetypes; all of it off by default and identical pixels with the switches off (`tools/verify.sh regress`). The rooms layer it needs as data source is CLOSED AND FROZEN as in PR #6 (merged 2026-10-07); it is a test data source, not a generator.

PRs: rooms layer and its fixes PR #6 (CLAUDE.md names no other PR for the rooms stage); Cake corridor PR #7 (by its merge title, merged 2026-10-07); Diorama bubble mock-up PR #8 (by its merge title, merged 2026-10-08; later replaced by the Pocket); Pocket PR #9 (merged 2026-10-08); Pocket framing archetypes PR #10 (merged 2026-10-08); Ascension walls PR #11 (merged 2026-10-08); closure, Snake Mountain surface and zero-rooms rule PR #13 (merged 2026-10-09).

## 2. Goal

Express each ROOM of the rooms layer (watershed rooms, cores, spanning tree, [`docs/rooms.md`](../../rooms.md)) according to its TYPE, the user's crystallizer of `reference/SingleRoomMeshGeneratorV16.4.cs`:
- **Cake**: terrace links become stacked rings (bowl = Down, pyramid = Up) around a core terrace.
- **Diorama**: a room read as a stage; in the viewer it is drawn as a closed pseudo-space, the POCKET, with a framing archetype.
- **Ascension**: connected chambers; thin walls on the blocking room-border faces.

The question it answers: how does a room read by type, in Box, A and B, on the fixed test set, while walking, stake and route do not change.

## 3. References

Only those that appear in the repo:
- `reference/SingleRoomMeshGeneratorV16.4.cs` (the ACTIVE code is `GenerateRoom` -> `BuildCakesForCurrentRoom`, lines 648-649; `BuildCakesForCurrentRoom` 1719, `BuildCakeDownRingsSimple` 1670, `BuildCakeUpRings` 1602, type rule 473-560; pass 1/2, `DetectCakeDirection` and `DetectCakeViaTerraceEdges` are dead code) and `reference/README.md` ("Room materializer" index).
- `reference/EDunProcGen.cs` (`SequenceA`: slope classes, rooms by watershed, room edges, cores, A* between cores) and `reference/skeletonMeshmakerGenV4.cs` (Step5, line 316: a multi-terrace room WITHOUT a terrace transition is Diorama; the original main type was Diorama; Step3_ApplyVoronoi).
- The user's scenes mapGen_forge (base) and ConicalTown (second check): parameters of the rooms chain, all script arguments (CLAUDE.md).
- Zelda, A Link Between Worlds (connected chambers that build a catacomb): the Ascension walls and their front cut ([`docs/room-types.md`](../../room-types.md)).
- Hades: the "Isla" archetype and the closed pocket ("Hades style", [`docs/room-types.md`](../../room-types.md)).
- Visual target of the whole viewer: Sea of Stars / 2D-HD readability, Unexplored 2 (CLAUDE.md).

## 4. Decisions

Stage 0, the rooms layer (data source). All "date not recorded" unless a PR is named:
- **D1** (date not recorded) Port to the viewer the minimal chain of `EDunProcGen.cs` with the connection PATCHED: a transition is an undirected PAIR of neighbouring tiles; one passability function for scan, A* and fills; the two tiles of a transition pair are never forbidden; unassigned tiles go to the nearest room before edges are searched. Value 0 is VOID, never low terrain.
- **D2** (date not recorded) Lax gates (transStrict 0.05, minimum 3) are only CANDIDATES; a gate or room transition is USED only when a path of the spanning tree crosses it. Minimum core size 20, gate crossing cost 10. A pair with a Steep tile is dropped; the core centre is its free tile nearest the centroid.
- **D3** (date not recorded) Integration: sub-terraces are only visual with rooms on; the tree is GLOBAL (computed once on the whole map, cached) and a slice keeps the connections whose paths stay inside plus the minimum extra ones (Kruskal; "patch" ramps exist only while that slice is chosen); room transitions are OPEN; unused terrace gates are closed.
- **D4** (PR #6, merged 2026-10-07) Connections must stay walkable end to end in the final graph (reserved path tiles, ramp variants, recompute over the carved graph, never forced). Isolated terrain (regions below the "Isolated limit", default 100) is decorative, not walkable, takes no ramp, mark or objective; edge problems stay walkable with an electric-blue dashed outline and the info names them.
- **D5** (PR #6, merged 2026-10-07) Start core: the scan starts from the group of cores with the MOST cores under the same passability (deviation from `ChooseStartingCore`).
- **D6** (PR #6, merged 2026-10-07) The rooms layer is CLOSED AND FROZEN: a TEST DATA SOURCE for the crystallizations, not a generator. Not done, noted for the GENERATOR (another project): recompute through another candidate gate, `ClassifySlopeMap` (limitation 12), size classes Micro/Small, Hub/Corridor/Leaf, central circuit by flow, platforms. Reason (user): no crystallization needs them in a significant way.
- **D7** (date not recorded) Fixed test set for every crystallization: the real map with rooms on in TWO variants, "Default" (5 terraces) and "Balanced types" (preset: 3 terraces, Min core size 100, Room radius 5, Min plateau 120), plus Snake Mountain. Since PR #13 the Snake Mountain of the set is its SURFACE pack (D18).

Stage 1, room types and Cake:
- **D8** (date not recorded) The code that counts is the ACTIVE one of V16.4 (see References). Cake is a GEOMETRY stage common to Box, A and B (a switch; off = identical pixels). One cake per terrace link (low, high); direction by pieces of the room per terrace (Down / Up / tie = Down); core = ALL the room's tiles of the core terrace; rings outside the core (cakeLayers 3, dilationPerLayer 1, step 0.3 terH). Adaptation: Down rings are CUT into the high terrace of the same room, Up rings are BUILT on the low terrace of the same room; never outside the room, never on void.
- **D9** (PR #7 by its merge title, merged 2026-10-07) A CORRIDOR is opened in front of every ramp (foot in pyramids, head in bowls) so the rings do not bury it. Also in that PR: the expected 3/2-terrace type counts corrected (the viewer's values are the correct ones, the user's earlier 30/2/0 and 28/2/2 came from counting every candidate gate and only pieces >= 20 tiles).
- **D10** (date not recorded) Rule D-D, "Diorama never touches Diorama" (`P.dioNoTouch`, default ON, `dioTouchMin` 3 pairs): two Dioramas joined by walking keep the biggest (greedy by size), the other becomes Ascension; labels only.
- **D11** (date not recorded) Preset "Balanced types" includes minPlateau 120 (it evens out the types AND grows the main region); no Cake cap, no change in the classification; types are balanced only with parameters that already exist.
- **D12** (date not recorded) The imbalance of the plain V16.4 rule (31 Cake, 0 Diorama, 1 Ascension of 32 rooms) is KNOWN and ACCEPTED. A LATER step (user's decision, no date): fewer ramps or ramps only in X rooms.

Stage 2, framing by type:
- **D13** (date not recorded) Part A, the Diorama background bubble mock-up (PR #8), is REPLACED by the POCKET (pseudo-space): the map does not change; the pocket is built from the WORLD shape (no slice, no patch ramps) so the fragment is identical to the full map tile by tile; only the surroundings change. One pocket at a time; drawn instead of the room slice when a Diorama is chosen (chip or click in the world).
- **D14** (PR #9, merged 2026-10-08) Pocket construction: weighted-Voronoi cells, offset by distance to the fragment along the camera axis, heights snapped down to the existing level grid (so B stays cheap), decoration duller and brightness capped, exits as paths on the decoration with a 3-tile ramp, pond <= 50 % of the fragment tiles.
- **D15** (date not recorded) Pocket framing archetypes Cerro / Lago / Cascada / Isla / Caída chosen by the selector "Pocket framing" (Auto by the user's rules: double -> Cascada), slider "Pocket height" 1-4 (default 2.5) multiplying only the decoration relief. Floors / "double" = two terraces >= 20 walkable tiles without a ramp between them.
- **D16** (PR #10, merged 2026-10-08) Caída exits: a bridge over the void, then a path that descends along its whole length to the landscape; minimum disc radius 14 tiles; ONE path per neighbouring room; short stubs of path between water removed.
- **D17** (PR #11, merged 2026-10-08) Ascension walls (`P.ascWalls`, off by default): walls on the room-border faces WITHOUT a transition that have an Ascension room on at least one side, in CHAINS of connected faces following the turns (chains of fewer than 3 faces dropped), 0.35 thick, absolute height by slider (0.5-3, default 1.5), low (0.15) on the faces whose Ascension-room normal faces the camera (Zelda cut, recomputed per camera). Never on a door, a ramp tile or toward void; not walkable, not selectable. DISCARDED by test: walls as blocks in the level system (loose beads in A, B smooths them away).

Closure:
- **D18** (PR #13, merged 2026-10-09) Snake Mountain of the fixed test set is its pure SURFACE pack (`data/snake_mountain_surface.json`, default source). The real Snake Mountain is multi-level (snake body, interior caves as an SDF) and cannot be expressed as a heightmap; it is the test case of the future SDF / volume crystallizer.
- **D19** (PR #13, merged 2026-10-09) Rooms on with ZERO rooms (40x40 with the Default radius): the layer is NOT applied, the viewer draws as with rooms off and the info says so; the verifier reports "not applicable".
- **D20** (PR #13, merged 2026-10-09) Crystallizer 2 is CLOSED in this phase; pending items in section 9.

## 5. Design

Short summary; the full rules are in [`docs/room-types.md`](../../room-types.md) (Cake, balancing table, D-D, Pocket, archetypes, Ascension walls) and [`docs/rooms.md`](../../rooms.md) (the chain, its checks and its viewer integration).
- **Input**: rooms, terrace per tile, used terrace gates (the tree's), room transitions; all of the WHOLE map (classification does not depend on the slice).
- **Type** (`E.roomTypes.classify`, `src/roomtypes.js`): CAKE = >= 2 terraces in the room, cakeLayers > 0 and a terrace edge (the LOW tile of a used gate pair whose two tiles are in the room); DIORAMA = not cake and >= 3 neighbouring rooms by transitions (the lobby-platform count of the Unity code is lost); ASCENSION = the rest; then rule D-D.
- **Cake**: see D8, D9 and the Heights rule: Down core top + (k+1) step, Up core top - (k+1) step, step = min(0.3 terH, (gap - 0.05 terH) / n); rings replace the sub-terraces on their tiles; a tile claimed by two links keeps the smaller ring index; walking, stake and route do not change. Switch "Cake rings" with sliders (rings 1-6 = 3, ring step 0.1-0.6 = 0.3, tiles per ring 1-3 = 1, seam window 2-12 = 5).
- **Pocket** (`src/pocket.js`): disc R = 3 r centred 1 r toward the camera (minimum radius 14), ~30-48 seeds (one per 80 tiles), cell offset by band, heights quantized, decoration levels of its own and capped brightness, exits and pond as in D14. The world shape is reframed to the window of the disc (`E.pocket.windowOf`, `E.pocket.reframe`). Display toggle "Diorama footprint outline".
- **Archetypes** (`E.pocket.chooseArchetype`): Cerro, Lago, Cascada, Isla, Caída; water is a level with its own colour; Isla and Caída have a ring of void and a deep `S.baseH`; the camera frames the fragment + 2 r.
- **Ascension walls** (`E.roomTypes.ascWalls`, `drawAscWall` in `src/render.js`): see D17; Box draws a wall after the later of the two tiles of its face; A and B cut the wall into bands at the heights of the levels it crosses and draw each band in the pass of the level at the top of its band, after the cap, sorted by depth.
- **Viewer controls**: Rooms group -> Rooms switch, "Rooms preset" (Default / Balanced types / Custom; sets only terraces, Min core size 5-250, Room radius 3-30, Min plateau 1-300), "Cake rings", "Pocket view", "Ascension walls"; Display -> "Room type tint" (Cake orange, Diorama green, Ascension blue). The manifest has an optional `viewer` block ([`docs/pack-format.md`](../../pack-format.md)).

## 6. Viewer vs Unity

- `classify` and the ring construction port as they are (sets of tiles, BFS); the level assignment replaces the heights given to `BuildPlatformMesh`; the viewer's figures are acceptance numbers for the port ([`docs/room-types.md`](../../room-types.md)).
- Pocket: an RPG interior in the same place: same fragment, environment swapped with a crossfade when the focused unit enters the fragment. With rule D-D two active pockets never touch.
- Ascension walls: one wall prefab per chain of border faces (a 0.35 x 1.5 box on the edge, stone material; corners filled where faces meet); the front cut is recomputed whenever the camera changes.
- The rooms chain code is "to be ported to Unity (C#) with the user's code once checked" (`src/rooms.js` header). Wall offsets of Diorama / Ascension in the user's code (cake -5, diorama -20, ascension +0.5 world units, tileSize 10) enclose the room; the viewer has no room walls and did not reproduce them.
- NOT reproduced from the user's code (generator work): the 40 % displacement of platforms toward the centre, enlarged detailed terrain, Voronoi cells of neighbouring rooms.

## 7. Verification

Tests: `node tools/test_rooms.js` (25 checks), `test_gates_rooms.js`, `test_slice_rooms.js`, `test_room_faces.js`, `test_route_rooms.js`, `test_conns_rooms.js`, `test_walk_rooms.js`, `test_roomtypes.js`, `test_walls.js`, `test_pocket.js`, `test_norooms.js`; UI: `tools/ui/test_rooms_ui.js`, `test_presets_ui.js`, `test_cake_ui.js`, `test_pocket_ui.js`, `test_asc_ui.js`, `test_viewer_node_ui.js`, `test_norooms_ui.js`; pixel regression with rooms on `tools/ui/regress_rooms.js`; everything through `tools/verify.sh`. Tables: `node tools/room_types_table.js`, `node tools/room_walls_table.js`, `node tools/diag_connections.js --table`.

Every figure below carries its configuration. Real map = `data/samples/skeleton_heightmap_256.png` (44582 land tiles).

**Room types, real map, rooms on, Default parameters, Cake on** ([`docs/room-types.md`](../../room-types.md) "Measured"):

| Terraces | Cake / Diorama / Ascension | links (bowl + pyramid) | ring tiles | levels |
|---|---|---|---|---|
| 5 | 31 / 0 / 1 (the user's figures) | 30 + 40 | 14409 of 44582 land (15205 before the corridor) | 15 -> 41 |
| 3 | 27 / 5 / 0 (expected values) | 26 + 14 | 6573 | 8 -> 23 |
| 2 | 26 / 4 / 2 (expected values) | 19 + 7 | 4057 | 5 -> 14 |

Corridor (real map, 5 terraces, `node tools/diag_cake_ramps.js`, CLAUDE.md): ramps with the foot enclosed by ring tiles 78 -> 0, heads enclosed 2 -> 0, 796 of 15205 ring tiles lost (1007 corridor tiles reserved).

**Balancing the types** (real map, rooms on, Cake off, `node tools/room_types_table.js`; Cake / Diorama / Ascension by the plain V16.4 rule; ramps; main region and walkable as % of the land; edge problems):

| Row | Rooms | C / D / A | Ramps | Main | Walkable | Edge problems |
|---|---|---|---|---|---|---|
| default | 32 | 31 / 0 / 1 | 140 | 73.8 % | 74.3 % | 1 |
| core 100 | 32 | 24 / 3 / 5 | 83 | 69.0 % | 69.9 % | 3 |
| minPlateau 250 | 32 | 28 / 3 / 1 | 82 | 78.6 % | 78.6 % | 0 |
| 3 terraces + core 100 | 32 | 20 / 7 / 5 | 44 | 74.8 % | 76.5 % | 4 |
| rRadius 5 | 88 | 62 / 7 / 19 | 156 | 61.1 % | 69.4 % | 8 |
| 3 terraces + core 100 + rRadius 5 | 88 | 32 / 29 / 27 | 54 | 70.3 % | 72.0 % | 4 |
| **Balanced types** (+ minPlateau 120) | 88 | 29 / 30 / 29 | 48 | 73.0 % | 74.7 % | 4 |
| + minPlateau 250 | 88 | 25 / 33 / 30 | 43 | 73.5 % | 75.2 % | 4 |

With rule D-D (Balanced types, Cake off or on): 30 Dioramas -> 18, 12 demoted (2452 tiles), totals 29 / 18 / 41; Default unchanged (0 Dioramas). On the preset itself at 3 terraces + core 100 + rRadius 5 (without minPlateau 120) D-D gives 32 / 19 / 37 (10 demoted, 1914 tiles). Cake on Balanced types WITHOUT minPlateau 120 (earlier row): 31 bowls + 8 pyramids, 3850 ring tiles, 21 levels (9 without Cake). Cake on Balanced types WITH minPlateau 120 (measured in the PR #13 session, real map, whole map, Balanced types, Cake on): 3052 ring tiles in 35 links (28 Down, 7 Up), 12 levels added, 369 corridor tiles, 3 conflicts. Minimum plateau 120 improves both things on top of 3 terraces + core 100 + radius 5; 250 connects slightly more but unbalances the types (user's reading, [`docs/room-types.md`](../../room-types.md)).

**Rooms chain checks** ([`docs/rooms.md`](../../rooms.md), real map, terraces quantized over the land only in the check script, mapGen_forge parameters; largest tree / living cores): forge as given (0.45, min 8): A 8 / 303 (2.6 %), B 1 / 270, C 2 / 274; forge with transStrict 0.05, min 3: A 287 / 303 (94.7 %), B 7 / 270 (2.6 %), C 239 / 274 (87.2 %). A = the user's code as written, B = original rule over the viewer's terraces and gates, C = the patched rule. ConicalTown (0.46, min 8, 2 terraces): A 42 / 81 (51.9 %), B 1 / 82, C 1 / 90. These are the figures of the check script, not of the viewer.

**Connections in the viewer** (real map, rooms on, Default otherwise; `node tools/diag_connections.js --table`; paths without route / total; main / walkable tiles): 3 terraces: 3/129, 31542 / 35196; 4: 1/142, 31188 / 34096; 5: 1/175, 32921 / 33129; 6: 8/211, 26294 / 31784 (edge problems 3700, 552, 498, 205, 179...); 7: 9/221, 18429 / 30692; 8: 20/267, 11646 / 28365. Findings (real map, 5 terraces): 132 of the 175 tree connections are ramps and 119 of them join two levels of the SAME room; with minimum core 50 there would be 111 ramps and 73 % of the land connected, with 200 there would be 51 and 62 % (today 142 and 74 %); a difference of 1e-5 in the heights moved 6 terraces from 83 % to 94 %.

**Pocket** (real map, Balanced types, compare mode, B for all three panels, [`docs/room-types.md`](../../room-types.md)): fragment identical tile by tile to the full-map shape for the 18 Dioramas (`tools/test_pocket.js`); the pocket adds 12-19 levels (rooms 31, 7, 64, 49: 19, 15, 17, 12) and B takes 0.8, 2.0, 1.7, 0.4 s for all three panels (it was 7-13 s with 49-52 new levels); with archetypes, rooms 31, 7, 64, 25, 20: 0.6, 1.9, 1.3, 0.2, 0.5 s and 14, 19, 12, 12, 14 levels added. Auto archetypes in Balanced types: 7 Cascada (7, 10, 30, 31, 34, 64, 80), 6 Isla (4, 20, 38, 49, 53, 68), 4 Cerro (22, 35, 66, 74), 1 Lago (25), 0 Caída. Floors / "double": 7, 10, 30, 31, 34, 64, 80 (cliff facing the camera: 31, 34, 64, 80).

**Ascension walls** (real map, Balanced types, whole map; `node tools/room_walls_table.js`, `tools/test_walls.js`, [`docs/room-types.md`](../../room-types.md)): 1863 candidate faces, 1832 walls in 51 chains (31 dropped), chain length median 15, max 446; the first version (straight runs of 3) kept 655 faces in 170 runs. Painter order against a per-pixel z-buffer (`tools/ui/test_asc_ui.js`, 10 chains x 8 directions, Oblique 50 and Iso 45, height 1.5, thickness 0.35): Box mean 0.18 % / worst 0.57 %; A and B (smoothed or tile-exact) mean 0.35 % / worst 2.78 % (first version, 0.7 high: Box 0.00 / 0.08, A and B 0.36 / 7.87 %). Visibility of the walkable tiles of the Ascension rooms (Balanced types, Iso 45, whole map, 5136 tiles, Box id render, height 1.5): without walls 100 % of the tiles keep >= 50 % of their pixels visible; walls of full height on every face 86.2 % (mean 85.7 %), below the 90 % bar; with the cut 97.3 % (96.1 %) (first version, 0.7 high and 0.15 thick: 99.1 % full, 99.9 % cut).

**Cold time in compare mode, real map, whole map, rooms on** (headless Chromium, software rasteriser, +-30 %; first panels = shape + Box + A / all three; the setups are different, do not mix them):
- CLAUDE.md limitation 14 (setup not recorded beyond "real map, whole map, compare mode"; its levels column, 15 -> 41, matches the 5-terrace Default row): rooms on without Cake 2.7 s / 5.2 s; with Cake rings 3.7 s / 10.0 s.
- Measured in the PR #13 session (Balanced types, compare mode, window 1500x800, a new shape each run by changing Terraces 4 -> 3, median of 3): Cake off 1.5 s / 3.0 s; Cake on 2.0 s / 5.1 s.
- The user's own figure for Balanced types, 1.3 s / 4.5 s: configuration not recorded.
- Rooms off, synthetic map: see [`../01-terrain/README.md`](../01-terrain/README.md) section 7.

Screenshots: the fixed set (real map Default and Balanced types, Snake Mountain surface; Box, A, B; Iso and Oblique) plus extra views (chip, pocket, walls) come from `tools/ui/verify_shots.js`; Snake Mountain surface with rooms on is reported "not applicable" (D19). The images are not in the repo.

## 8. Mocks

In the repo (CLAUDE.md):
- **Diorama background bubble** (PR #8, merged 2026-10-08): a mock-up behind the diagnostic flag `P.dioBubble`; REPLACED by the Pocket (D13); the bubble code is deleted.
- **Ascension walls as blocks in the level system**: DISCARDED by test (loose beads in A, B smooths them away).

Reviewer's mock-ups, images not in the repo (they come from the reviewer's sessions, not from the repo; date not recorded):
- **Balcony idea** (Dioramas as balconies over the map): rejected; it gave 2-3 tiles of balcony and blocked the view of other rooms. Root cause measured: the space all room types would need was about 176 % of the land, so the fix had to be a pseudo-space, not more map. This led to the Pocket.
- **Pocket v1**: the fragment was not identical to the world (a slice patch ramp appeared in room 7) and it read as a flat plate without backdrop. Fixed by building the pocket from the world shape and by the Pocket height slider and promontory.
- **Framing archetype "Caída", first version**: giant fins along the void; replaced by a path that descends along its whole length to the landscape. Room 25 (Lago) looked cluttered: minimum disc radius 14 and one path per neighbouring room (D16).
- **Ascension walls v1**: only straight runs of >= 3 faces were kept, which dropped about 65 % of the faces ("broken fence"); replaced by chains of connected faces following the turns, thicker and taller (D17).

Lesson recorded by the user: mock-up image first, specification after; always review the whole fixed test set (Snake Mountain was left to the end).

## 9. Known limits and open questions

Known limits:
- Rooms layer (CLAUDE.md limitation 12, PENDING, NOT FIXED): `ClassifySlopeMap` calls Void any tile with slope <= 0 WITHOUT a height test, and the slope normalization includes the coast; on the real map 1099 of the 1100 tiles with normalized slope >= 0.6 touch the void, so thresholds inland depend on the coast. `src/rooms.js` forces h <= 0 to Void and keeps the user's normalization; the decision (exclude the coast from the range?) is still to be taken with the user. The first option that had been approved, for the record: empty neighbour = the tile's own height, Void by height <= 0, min/max range over land without void in its 3x3.
- The rooms method is meant for 2-5 terraces: with 10 and 12 terraces the passability fragments by itself (66 and 138 groups, forbidden margins 34-40 % of the land).
- Imbalance of the plain V16.4 rule (D12) and the figures with rule D-D (D10).
- The "not walkable" tone looks jagged over the Cake rings (limitation 13, same cause as terrain limitation 1, PARKED).
- Cold cost with Cake rings: B grows with the number of levels (15 -> 41 on the 5-terrace Default row); figures in section 7.
- Pocket: fixed Iso camera (composition made for yaw 45, the fragment sits in the back third); double dioramas of two rooms NOT implemented (only 2 pairs of the map are joined only by a cliff and none faces the camera); per-room variations (wall yes / no) are designed, not implemented.
- Snake Mountain surface with rooms on: no rooms, layer not applied (D19).

Open questions / pending for later (CLAUDE.md "Pending" 4 and 5):
- Double dioramas of two rooms (the list of ids is ready).
- Per-room variations (wall yes / no).
- Pocket with cameras other than Iso.
- The hierarchical A* with flow stays as an ALTERNATIVE pending the user's decision (not implemented).
- A LATER step (user's decision): fewer ramps or ramps only in X rooms to even the types out; AFTER it: HD-2D layered terraces, SDF exterior mesh for Snake Mountain, RuleTile skin / modular kits.
- Possible improvement (user's call): loops for the terrace gates only (room transitions already give alternative routes on flat ground).
- The stage over the whole pipeline is the design draft of crystallizer 3: [`../03-stage/README.md`](../03-stage/README.md).
