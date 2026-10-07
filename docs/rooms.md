# Rooms: minimal chain with the patched connection (stage check)

`src/rooms.js` ports the minimal chain of the user's `reference/EDunProcGen.cs` (`SequenceA`): slope classes, rooms by watershed,
room edges, cores, A* between cores with a spanning tree; the terrace gates already in the viewer are reused. Void is height 0.
No UI, no render, no room types, no platforms. The original rules, transcribed as is, are in `tools/rooms_original.js` (comparison only).

    node tools/test_rooms.js                       25 checks: each defect reproduced with the original rules, gone in the patched ones
    node tools/rooms_check.js [--preset forge|conical] [--transStrict 0.05 --minTerraceTrans 3 ...]   figures + PNG overlays

## The three variants
- **A** the user's code as written: terraces `floor(h * N)`, his gates (with the swap leak), his passability.
- **B** the same original passability over the viewer's terraces and gates (isolates the rule from the gates).
- **C** the patched rule over the viewer's terraces and gates.

Gates: the viewer's `E.gateTransitions` (nominal band normalization), then the user's same-room condition, void and Steep removed, group
minimum applied again (same result as filtering by room first: groups only shrink). Terraces: the viewer's (global range of the whole map,
void included as the lowest value; pre-smoothing and plateau cleanup as in the viewer), not `floor(h * N)`.

## Results on `data/samples/skeleton_heightmap_256.png` (void 32 %, 44 582 land tiles)
Terraces of B and C are quantized over the LAND only (void takes the nearest land value, range 67..1000; `--voidInRange` gives the first version of
this table: C 240/271 at 0.05 / min 3). "Largest tree" = cores joined in the biggest spanning tree / living cores (>= 5 tiles); living cores differ per
variant (A 303, B 270, C 274 with mapGen_forge).

| config | A (user's code) | B (original rule, viewer gates) | C (patched) |
|---|---|---|---|
| mapGen_forge as given (transStrict 0.45, min 8) | 8 / 303 (2.6 %) | 1 / 270 | 2 / 274 |
| forge, transStrict 0.05, min 3 | 287 / 303 (94.7 %) | 7 / 270 (2.6 %) | 239 / 274 (87.2 %) |
| forge, transStrict 0.05, min 8 | 276 / 303 | 1 / 270 | 2 / 274 |
| ConicalTown (0.46, min 8; 2 terraces) | 42 / 81 (51.9 %) | 1 / 82 | 1 / 90 |

Sweep of transStrict, forge, min 3 (viewer groups / C groups; largest tree C, B, A): 0.05: 747 / 533; 239, 7, 287. 0.1: 748 / 533; 239, 7, 287.
0.2: 706 / 528; 235, 7, 287. 0.3: 495 / 372; 212, 5, 281. 0.45: 54 / 20; 2, 1, 88. With min 8: 63, 61, 55, 34, 11 viewer groups; C stays at 2.

Pairs lost because they have a Steep tile (candidate gate pairs): forge 0.05 / min 3: 463 of 4201 (11 %); 0.05 / min 8: 62; 0.45 / min 3: 8. Room
transition pairs: 0 by construction (a pair with a Steep tile is Hard).

## What the spanning tree USES (lax gates are only candidates)
`R.usage`: every tree edge is walked along its shortest path; a gate group (4-connected low tiles, as the viewer groups them) or a room-transition group
is USED if one of its pairs is crossed. Forge, transStrict 0.05, min 3; 533 candidate gate groups, 52 transition groups. `cost` = extra tiles for crossing a
terrace gate (paths then prefer going round and tend to share gates). Land in the largest tree: core tiles (paths add < 0.4 point).

| minCore | cost | living | largest tree | gate groups used / 533 | transition groups used / 52 | path steps | land in tree |
|---|---|---|---|---|---|---|---|
| 5 | 0 | 274 | 239 | 238 | 43 | 3668 | 89.6 % |
| 5 | 10 | 274 | 239 | 190 | 47 | 3974 | 89.6 % |
| 5 | 30 | 274 | 239 | 167 | 51 | 4603 | 89.6 % |
| 20 | 0 | 182 | 176 | 188 | 38 | 3177 | 88.0 % |
| 20 | 10 | 182 | 176 | 141 | 43 | 3385 | 88.0 % |
| 20 | 30 | 182 | 176 | 122 | 49 | 3808 | 88.0 % |
| 50 | 0 | 136 | 135 | 157 | 37 | 2823 | 85.0 % |
| 50 | 10 | 136 | 135 | 111 | 39 | 2968 | 85.0 % |
| 50 | 30 | 136 | 135 | 94 | 44 | 3266 | 85.0 % |

PNGs of only the used gates (cyan) and transitions (yellow) with the tree paths: `rooms_out/<tag>_used_core<N>_cost<C>.png` (gitignored).

## What the numbers say
- The user's code DOES connect on this map (A, 91-95 % in the first version of this table, 287/303 now) when the gates are loose, and it connects because of the swap leak: 40-45 % of its gate
  tiles are leak records (the sealed gates of defect 2 are opened from the high side by accident). With the viewer's clean gates and the original
  rule (B) almost nothing connects (2.6 %), and with the patched rule (C) 88.6 %. The patch is what makes the clean gates usable.
- mapGen_forge's values (0.45 / 8) were tuned to the original code: A gets 2.6 % there too, and the viewer finds no gates at all.
- One-off ablation (scratch, not in the repo; C, forge 0.05 / min 8, 249 living cores): with terraces fully open (no gate rule, no margin around
  cliffs) and the room transitions as classified, 244 of 249 cores join; opening the rooms instead leaves 51. The limit is the terraces/gates, not the rooms.
- 8-bit heights (239 distinct values) and the coast dominate the slope normalization; with exponent 0.5 and (0.2, 0.33) there are 15 257 Flat, 25 580 Gentle,
  3 684 Steep tiles inland+coast.

## Not checked
Only this map (and the same map with ConicalTown's values; the scene's own height map is not in the repo). Not compared with a run of the user's
Unity code. The tie rules of C# `PriorityQueue` (watershed) and A* (equal-length paths) are not reproduced. The spanning tree uses BFS lengths (same
as the A* lengths with unit cost). Terrace quantization over the land only is done in the check script (`R.landElevation`), NOT in the viewer's `E.quantize` of the UI.

## In the viewer (rooms on)
`P.rooms` (off by default; with it off the viewer is the one without rooms and the pixel regression is identical). Sliders: min core size 5-80 (default 20), gate
crossing cost 0-40 (default 10); gate threshold 0.05 and gate minimum 3 are the existing ones. The other chain parameters are fields of `P` (`rGentle`, `rSteep`,
`rExp`, `rHTol`, `rRadius`, `rMinRoom`, `rHardEdge`, `rMinSizeEdge`) with the mapGen_forge values.
- **Layer**: `E.rooms.layer(pack, P)`, the whole map, cached on the pack in stages (rooms, edges, pass, cores, tree); each control recomputes only what depends on it.
- **Ramps only on used gates**: `computeGatesRooms` (`shape.js`). A site is the exact pair a tree path crosses; crossings of one gate group closer than `passGap`
  are merged into the most crossed one; other candidate gates stay cliffs. Sub-terraces are only visual.
- **Slice** by rooms (chips, Ctrl/Shift for several, Whole map): the tree is GLOBAL; a slice keeps the connections whose paths stay inside and adds the minimum
  patch connections (`R.sliceUse`, Kruskal from the kept components). Patch ramps (blue) exist only while that slice is chosen.
- **Room borders**: per tile face, a line where a border blocks (orange), a gap on every open transition, green on the ones the slice's tree crosses; "Room tint" overlay.
- **Walking** (`E.route`, regions): the patched passability (all valid room transitions open, same terrace, margins of walls/cliffs/Steep not walkable) plus the ramps.
  A mark on a margin tile is refused with the reason.
- **Void** is always on, rooms or not (see `docs/pack-format.md`).
Tests: `tools/test_gates_rooms.js`, `test_slice_rooms.js`, `test_room_faces.js`, `test_route_rooms.js`, `tools/ui/test_rooms_ui.js`; cold cost: `tools/ui/measure_rooms.js`.

### Connections stay walkable, isolated terrain (follow-up in PR #6)
- The tiles of the tree paths are reserved while ramps are carved (`carveStairs`): a ramp may occupy one only if the path walks it along the ramp (bottom -> treads -> top of a
  column, or between adjacent columns). Variants in order: cut into the upper terrace, built on the lower one, depth 1 of each, lateral columns out. A connection that still is not
  walkable is recomputed over the carved graph with the same crossing cost; if there is none it is not forced and the info names it (`S.connInfo`). `P.rampKeep = false` = before the fix.
  `node tools/diag_connections.js` prints before / after; `tools/test_conns_rooms.js`.
- Isolated terrain / edge problems: see CLAUDE.md "ISOLATED TERRAIN". `tools/test_walk_rooms.js`.

## Robustness when changing Terraces / ramp depth (last fix commit of PR #6)
- Start core: the scan starts from the group of cores with the MOST cores under the same passability (deviation from `ChooseStartingCore`, user's decision); other groups stay unreachable.
- Merge by passGap only when the connection still has a route; otherwise the pair gets its own ramp (variants: depth D..1 at full width, then without lateral columns); all paths are checked again after each carve.
- Only "gate pair whose ramp did not fit" may remain as a connection without route. `node tools/diag_connections.js --table`, `tools/test_conns_rooms.js` (terraces 3-8, depth 1-4).
- Known limit: 10 and 12 terraces fragment the passability (66 and 138 groups, forbidden margins 34-40 % of the land). The method is used with 2-5 terraces.

### Terraces 3-8 on the real map (numbers of the VIEWER, `node tools/diag_connections.js --table`)
All rooms tests and tools build the pack like the viewer (`tools/real_pack.js`: `E.imageChannels` + `E.packFromRoles`, channel V; the land range is 66.66666412, a hand-made `v / max * 1000` gives 66.66667175 and moves the terraces).
`tools/ui/test_viewer_node_ui.js` compares the viewer with Node (5 and 6 terraces). Paths without route / total; main / walkable tiles; edge problems.

| Terraces | before (no retry, old start core) | after |
|---|---|---|
| 3 | 3/129; 31552 / 35207; 2 problems | 3/129 (all "did not fit"); 31542 / 35196; 2 |
| 4 | 2/142; 29021 / 34098; 4 | 1/142; 31188 / 34096; 3 |
| 5 | 1/175; 32925 / 33133; 1 | 1/175; 32921 / 33129; 1 |
| 6 | 10/211; 13720 / 31814; 9 (12605, 3701, ...) | 8/211; 26294 / 31784; 8 (3700, 552, 498, 205, 179, ...) |
| 7 | 10/221; 18426 / 30678; 17 | 9/221; 18429 / 30692; 17 |
| 8 | 0/2 (tree of 2 connections); 686 / 22488; 97 | 20/267; 11646 / 28365; 23 |

Warning-outline faces (kind 3) are cleared at the start of every `classifyWalk` (it runs in each pass of the recovery loop); 6 terraces: 5722 faces, each touching a problem region (before: 16836, 11112 of them stale).

## Status: CLOSED (frozen as in PR #6)
In the viewer the rooms layer is a test data source for the crystallizations, not a generator; it is not developed any more.
- NOT done, noted for the generator (another project): recompute through an alternative candidate gate, `ClassifySlopeMap` (CLAUDE.md limitation 12 stays a known limitation), size classes Micro/Small, Hub/Corridor/Leaf, central circuit by flow, platforms. Reason (user): no crystallization needs them in a significant way.
- Findings (real map, 5 terraces): 132 of the 175 tree connections are ramps and 119 of them join two levels of the same room; with minimum core 50 there would be 111 ramps and 73 % of the land connected, with 200 there would be 51 and 62 % (today 142 and 74 %); a difference of 1e-5 in the heights moved 6 terraces from 83 % to 94 %.
- Fixed test set for every crystallization: the real map `data/samples/skeleton_heightmap_256.png`, 5 terraces, rooms on, the rest by default; and Snake Mountain.
- Next: technique "room types" (Cake / Diorama / Ascension), see CLAUDE.md "Pending" 5 and `reference/README.md` "Room materializer".

