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

## Known problem: corridors do not connect (diagnosis from READING the code, not from running it)
1. Room edges are one-sided. `ClassifyRoomEdges` de-duplicates each pair of neighbouring tiles and stores the edge tile
   only on the side of the room with the LOWER id. `IsWalkable(from, to)` lets a path change room only if the DESTINATION
   tile is a room transition, so a path can cross from the higher-id room into the lower-id one and never the other way.
2. Terrace gates are sealed. A terrace transition is stored only on the LOW tile. Going up is refused (the destination,
   the high tile, is not a transition) and `ExtractNonTransitionTerraceBorders` puts that high tile in the forbidden set
   (it borders another terrace and is not itself a transition), so it cannot be entered to go down either.
3. Rooms that do not touch. The watershed leaves unassigned tiles (room 0) between rooms where the slope is steep or the
   height tolerance stops the growth; edges are only looked for between directly adjacent rooms, so two rooms split by an
   unassigned strip never get an edge. Rooms under the minimum size are dropped from the list but keep their id in the map.
4. What hides it: `ScanCoreConnectivity` uses a SYMMETRIC rule (either tile is a transition) and marks cores reachable,
   while A* uses the destination-only rule and finds no path, so the spanning tree comes out in pieces.

Proposed patch (to be agreed before porting): a transition is an undirected PAIR of neighbouring tiles; passing between
two tiles is allowed both ways if they share room and terrace or the pair is a transition; the two tiles of a pair are
never forbidden; one passability function serves the scan, A* and the floods; unassigned tiles are given to the nearest
room before edges are searched.
