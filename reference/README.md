# Reference code (read-only)

`EDunProcGen.cs` is the user's Unity C# generator from the "skeleton mesh" project (`BlkEvo.ProcGen`). It is here ONLY
as a reference to read: it is not built, not run and not to be edited. The viewer ports the parts it needs to JS.

## Where things are (line numbers of this copy)
| What | Function | Line |
|---|---|---|
| Whole chain | `SequenceA` | 257 |
| Passability rule used by A* | `AStarContext.IsWalkable` | 117 |
| Slope classes (Void / Flat / Gentle / Steep) | `ClassifySlopeMap` | 872 |
| Terraces | `QuantizeToTerraces` | 973 |
| Room edges (Transition / SolidSoft / SolidHard) | `ClassifyRoomEdges` | 990 |
| Grow and filter room transitions | `ExpandAndFilterTransitions` | 1124 |
| Room graph | `BuildRoomGraph` | 1220 |
| Room cores | `FindRoomCores`, `MarkReachableRoomCores` | 1257, 1315 |
| Reachability scan | `ScanCoreConnectivity` | 1416 |
| Terrace transitions (gates, already ported) | `FindRankedTerraceTransitions` | 1501 |
| Blocked terrace borders | `ExtractNonTransitionTerraceBorders` | 1590 |
| Core graph and paths | `BuildCoreToCoreGraphWeighted`, `AStarBetweenCoresWeighted` | 1627, 1665 |
| Spanning tree | `BuildSpanningTree` | 1753 |
| Forbidden tiles | `GenerateForbiddenTiles` | 1915 |
| Rooms | `TrueWatershed.WatershedFromHeightMinima` | 6325 |

## Known problem: corridors do not connect (verified by reading the code AND by running a transcription of it; see `docs/rooms.md`)
1. Room edges are kept per TILE, not per pair. `ClassifyRoomEdges` does de-duplicate each pair correctly (the key is symmetric) and stores
   BOTH tiles of the pair, so the edge is NOT one-sided by room id (the first version of this note said so; that was wrong). The defect is
   that `ExpandAndFilterTransitions` keeps ONE record per tile in a dictionary (last writer wins) and its final sync copies that record over
   every entry of the tile, including `RoomA`/`RoomB` and the type. A tile that touches two rooms loses one of its pairs: a Transition pair
   can turn Hard (and its tile forbidden) because another pair of the same tile came later, or a wall pair can turn Transition.
   `BuildRoomGraph` reads those overwritten rooms. The expansion also promotes single tiles without looking at their partner.
2. Terrace gates are sealed. A terrace transition is stored only on the LOW tile. Going up is refused (the destination, the high tile,
   is not a transition) and `ExtractNonTransitionTerraceBorders` puts that high tile in the forbidden set, so it cannot be entered to go
   down either.
3. Rooms that do not touch. The watershed leaves unassigned tiles (room 0) between rooms where the slope is steep or the height tolerance
   stops the growth; edges are only looked for between directly adjacent rooms, so two rooms split by an unassigned strip never get an
   edge. Rooms under the minimum size are dropped from the list but keep their id in the map.
4. What hides it: `ScanCoreConnectivity` uses a SYMMETRIC rule (either tile is a transition) and ignores `ForbiddenTiles`, while A* uses the
   destination-only rule and respects them, so the scan marks cores reachable that A* cannot reach and the spanning tree comes out in pieces.
5. (new) `FindRankedTerraceTransitions`: `(t1, t2) = (t2, t1)` modifies `t1`, which is declared OUTSIDE the loop over directions, so the swap leaks
   into the next direction and a tile can be recorded as a gate against a neighbour of its OWN terrace. On the real height map (one room, 12 terraces)
   about 40 % of the gate tiles came from it. It also happens to open the sealed gates of point 2 from the high side, which hides that defect.
6. (new) The centre of a core is the rounded centroid. For a core that is not convex it falls outside the core, and if that tile is
   forbidden A* can never reach it (the goal is checked like any destination).
7. (new) `ClassifySlopeMap` calls "Void" the tiles of slope <= 0 (no height test) and the slope is normalized with the coast included, so a
   map with a black void gets its steepest values on the coast: with exponent 1 the only Steep class of the real map was the coast.

Patch (agreed): a transition is an undirected PAIR of neighbouring tiles; passing between two tiles is allowed both ways if they share room and
terrace or the pair is a transition (room edge) / a gate (terrace); the two tiles of a valid pair are never forbidden; a pair with a Steep
tile is not valid; one passability function serves the scan, A* and the floods; unassigned tiles are given to the nearest room before edges
are searched; the centre of a core is its free tile nearest to the centroid. Implemented in `src/rooms.js`; the original rules are transcribed
in `tools/rooms_original.js` for comparison.
