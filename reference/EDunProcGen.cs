using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEngine;
using static BlkEvo.ProcGen.EDunProcGen;


namespace BlkEvo.ProcGen
{
    public enum SlopeType { Flat, Gentle, Steep, Void }

    public class EDunProcGen
    {

        public struct Room
        {
            public int Id;
            public float AverageHeight;
            public List<Vector2Int> Cells;
        }

        public enum EdgeType { None, Transition, SolidSoft, SolidHard }
        public enum CoreType { Unknown, Reachable, Unreachable, Isolated, Dead }

        public enum RoomFlowType
        {
            Leaf = 0,       // Only one connection
            Corridor = 1,   // Two connections
            Hub = 2,        // 3+ connections
            Small = 3,      // Room is very small
            Micro = 4,      // Extremely tiny room
            Isolated = 5,   // No connections
            Dead = 6        // Has no valid platform or only decorative
        }

        public enum PlatformRole
        {
            Main,       // Primary scenario platform
            Transition, // Near room entry/exit points or terrace changes
            Auxiliary,  // Side areas, extensions, useful for staging
            Fragment    // Too small to matter, probably discarded
        }

        [System.Serializable]
        public enum ScenarioRole
        {
            Undefined,
            Central,
            Lobby,
            Road,
            Satellite,
            Branch,
            Discarded,
            Unreachable
        }


        public struct EdgeTile
        {
            public Vector2Int Pos;
            public int RoomA;
            public int RoomB;
            public EdgeType Type;
        }

        public class RoomConnection
        {
            public int RoomA;
            public int RoomB;
            public List<Vector2Int> EdgeTiles = new List<Vector2Int>();
            public Vector2 center; // Center of all edge tiles
            public int width => EdgeTiles.Count;
        }

        public class RoomCore
        {
            public int RoomID;
            public int TerraceLevel;
            public List<Vector2Int> Tiles = new List<Vector2Int>();
            public Vector2Int Center;
            public CoreType coreType = CoreType.Unknown;
            public RoomFlowType FlowType;

        }

        [System.Serializable]
        public struct TerraceEdge
        {
            public Vector2Int Pos;
            public int Room;
            public int TerraceFrom;
            public int TerraceTo;
        }

        public struct AStarContext
        {
            public int[,] RoomMap;
            public int[,] TerraceMap;
            public SlopeType[,] SlopeMap;
            public HashSet<Vector2Int> RoomTransitions;
            public HashSet<Vector2Int> TerraceTransitions;

            public int Width;
            public int Height;
            public float[,] VisibilityMap;         // [0..1] where 1 = fully shadowed
            public float VisibilityTilePenalty; // Extra cost per tile in full shadow


            public bool IsInside(Vector2Int p)
            {
                return p.x >= 0 && p.y >= 0 && p.x < Width && p.y < Height;
            }

            public HashSet<Vector2Int> ForbiddenTiles;

            public bool IsWalkable(Vector2Int from, Vector2Int to)
            {
                if (!IsInside(to))
                    return false;

                if (ForbiddenTiles.Contains(to))
                    return false;

                int roomA = RoomMap[from.x, from.y];
                int roomB = RoomMap[to.x, to.y];
                int terrA = TerraceMap[from.x, from.y];
                int terrB = TerraceMap[to.x, to.y];

                if (roomA != roomB && !RoomTransitions.Contains(to))
                    return false;

                if (terrA != terrB && !TerraceTransitions.Contains(to))
                    return false;

                if (ForbiddenTiles.Contains(to))
                {
                    Debug.Log($"Blocked at: {to}");
                    return false;
                }


                return true;
            }

        }

        public class CoreConnection
        {
            public RoomCore From;
            public RoomCore To;
            public List<Vector2Int> Path;
            public float VisibilityPenalty = 0f;
            public float Cost => Path?.Count ?? 0;
            public float TotalCost => Cost + VisibilityPenalty;
            

        }

        public class CoreConnectivityGraph
        {
            public List<RoomCore> ReachableCores;
            public List<CoreConnection> Connections = new();
        }

        public class RoomFloodGroup
        {
            public int FloodId;
            public List<Vector2Int> Tiles = new();
            public Vector2Int Entry;
            public bool ReachedCore = false;
            public HashSet<int> MergedWith = new();
        }

        public class FlowMap
        {
            public float[,] RawFlow;
            public float[,] WeightedFlow;
            public float[,] NormalizedFlow;
            public int Width;
            public int Height;

            public FlowMap(int width, int height)
            {
                Width = width;
                Height = height;
                RawFlow = new float[width, height];
                WeightedFlow = new float[width, height];
                NormalizedFlow = new float[width, height];
            }
        }

        public class PlatformRegion
        {
            public int Id;
            public Vector2Int Origin;
            public List<Vector2Int> Tiles = new();
            public int RoomId;
            public int TerraceId;
            public float AvgFlow;
            public float AvgVisibility;
        }

        public class PlatformBlob
        {
            public int ID;
            public Vector2Int Core;
            public List<Vector2Int> Tiles = new();
            public float TotalStrength = 0f;
        }

        [System.Serializable]
        public class PlatformSeed
        {
            public Vector2Int Center;
            public int RoomId;
            public int TerraceId;
            public int platformId;
            public int Area;
            public List<Vector2Int> Tiles;        // Final usable surface
            public List<Vector2Int> TrimmedTiles; // Discarded tiles 
            public Vector2Int vantagePt;             //platform vantage point where everything can be seen
            public PlatformRole Role;
            public ScenarioRole ScenarioRole;
            public float Score;
            public float VantageRoomScore; //a score normalized from 0-1 within the room, that deals with the overlaping vantage point area added as score 
            public float EntryRoomScore; //a score normalized from 0-1 within the room, that deals with overlapping viewpoint cone cast from every entry point to the room
            public float PathImportanceScore;  //a score normalized from 0-1 within the room, tat deals with the widened critical path as a 
            public float avgTileheight;
        }

        public class RoomScenario
        {
            public int RoomId;
            public int TerraceLevel;

            // Grouped platforms within this room
            public List<PlatformSeed> Platforms = new List<PlatformSeed>();

            // Final output groups (after merging logic)
            public List<List<PlatformSeed>> MergedBlobs = new List<List<PlatformSeed>>();

            // Reference platforms
            public PlatformSeed CentralPlatform;
            public List<PlatformSeed> LobbyPlatforms = new();
            public List<PlatformSeed> RoadPlatforms = new();
            public List<List<PlatformSeed>> SatelliteIslands = new();
            public List<PlatformSeed> Branches = new();
            public List<PlatformSeed> Unreachables = new();

            public RoomFlowType RoomType; // Leaf, Hub, Corridor, etc.
        }




        public static Texture2D[] SequenceA(Texture2D heightMap, int numTerraces, Vector2 slopeThreshold, float exponent, float hTolerance, int minRadius, int nsteps, float hardEdge, int minSizeEdge, float transStrict, int minTerraceTrans, float visibilityWeight, int maxHalfWidening, Vector3 blobThreshold, Vector3 assignPlaformThreshold, GenStructuralData datadump, int gridW = -1, int gridH = -1)
        {
            Texture2D[] generations = new Texture2D[20];
            float[,] hmap;
            List<Room> rooms;
            List<EdgeTile> edges;
            int[,] roomMap;
            int height;
            int width;
            Dictionary<Vector2Int, EdgeTile> edgeDict = new Dictionary<Vector2Int, EdgeTile>();
            List<RoomCore> roomCores = new List<RoomCore>();
            Vector2 cameraDir = new Vector2(-1f, -1f); // Example for top-left camera view

            if (gridH == -1 && gridW == -1)
            {
                height = heightMap.height;
                width = heightMap.width;

            }
            else
            {
                height = gridH;
                width = gridW;

            }

            hmap = TextureToHeightMap(heightMap, width, height);
            float[,] slopeMap = ComputeSlopeMap(hmap);
            slopeMap = ApplyPowTransform(slopeMap, exponent);
            slopeMap = NormalizeSlopeMap(slopeMap);
            int[,] terraceMap = QuantizeToTerraces(hmap, numTerraces);
            SlopeType[,] slopeClasified = ClassifySlopeMap(slopeMap, hmap, slopeThreshold.x, slopeThreshold.y);


            Debug.Log("Slope generation completed.");

            //List<Room> rooms = WatershedGenerator.WatershedSegmentation(slopeMap, slopeClasified, terraceMap, hmap);
            rooms = TrueWatershed.WatershedFromHeightMinima(hmap, slopeClasified, slopeThreshold.y, out roomMap, minRadius, hTolerance, nsteps);
            edges = ClassifyRoomEdges(roomMap, hmap, slopeClasified, terraceMap, hTolerance, hardEdge);
            List<List<Vector2Int>> edgegroups = GroupEdgePositionsByType(edgeDict, EdgeType.Transition, width, height);
            //FilterAndExpandTransitions(edges, hmap, slopeClasified, roomMap, terraceMap, width, height, hTolerance, minSizeEdge);
            ExpandAndFilterTransitions(edges, hmap, slopeClasified, roomMap, terraceMap, width, height, hTolerance, minSizeEdge);

            Debug.Log("Edge generation completed.");

            Dictionary<(int, int), RoomConnection> roomGraph = BuildRoomGraph(edges);
            foreach (var om in rooms)
            {
                var rs = FindRoomCores(roomMap, terraceMap, slopeClasified, om.Id, width, height);
                foreach (var r in rs)
                {
                    roomCores.Add(r);
                }
            }

            MarkReachableRoomCores(roomCores, roomGraph);
            FlagMicroCores(roomCores);
            List<TerraceEdge> terraceEdges = FindRankedTerraceTransitions(roomMap, terraceMap, hmap, width, height, transStrict);
            terraceEdges = FindFilteredRankedTerraceTransitions(roomMap, terraceMap, hmap, width, height, transStrict, minTerraceTrans);

            var terraceSet = new HashSet<Vector2Int>(terraceEdges.Select(e => e.Pos));


            RoomCore rootCore = ChooseStartingCore(roomCores);
            var terraceTransSet = ExtractTerraceTransitionPositions(terraceEdges);
            var roomTransSet = ExtractRoomTransitionPositions(edges);

            HashSet<Vector2Int> visited = ScanCoreConnectivity(rootCore, roomCores, roomMap, terraceMap, slopeClasified, roomTransSet, terraceTransSet, width, height);


            var validRoomTrans = ExtractRoomTransitionPositions(edges);
            var validTerraceTrans = ExtractTerraceTransitionPositions(terraceEdges);
            var nonTransitionTerraceBorders = ExtractNonTransitionTerraceBorders(terraceMap, slopeClasified, validTerraceTrans, width, height);


            var forbidden = GenerateForbiddenTiles(slopeClasified, edges, terraceEdges, validRoomTrans, validTerraceTrans, nonTransitionTerraceBorders);

            float[,] slopeSadow = GenerateVisibilityMap_SlopeTerrace(slopeClasified, terraceMap, cameraDir, width, height);
            float[,] terraceShadow = GenerateVisibilityMap_TerraceOnly(terraceMap, cameraDir, width, height);

            //trim threshold cleans more slope small groups the higher the threshold
            float[,] slopeTrimmedShadow = TrimSmallVisibilityRegions(slopeSadow, 0.6f, 20);
            float[,] visibilityTrimmed = new float[width, height];
            float[,] visibilityFinal = new float[width, height];
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float combined = Mathf.Max(slopeSadow[x, y], terraceShadow[x, y]);
                    visibilityFinal[x, y] = Mathf.Clamp01(combined);
                }

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float combined = Mathf.Max(slopeTrimmedShadow[x, y], terraceShadow[x, y]);
                    visibilityTrimmed[x, y] = Mathf.Clamp01(combined);
                }

            visibilityFinal = normalizeTextureMap(visibilityFinal, width, height);

            Debug.Log("visibility casting complete");

            var context = new AStarContext
            {
                RoomMap = roomMap,
                TerraceMap = terraceMap,
                SlopeMap = slopeClasified,
                RoomTransitions = validRoomTrans,
                TerraceTransitions = validTerraceTrans,
                ForbiddenTiles = forbidden,
                Width = width,
                Height = height,
                VisibilityMap = visibilityTrimmed,        // [0..1] where 1 = fully shadowed
                VisibilityTilePenalty = 0 // Extra cost per tile in full shadow

            };

            var visualContext = new AStarContext
            {
                RoomMap = roomMap,
                TerraceMap = terraceMap,
                SlopeMap = slopeClasified,
                RoomTransitions = validRoomTrans,
                TerraceTransitions = validTerraceTrans,
                ForbiddenTiles = forbidden,
                Width = width,
                Height = height,
                VisibilityMap = visibilityFinal,        // [0..1] where 1 = fully shadowed
                VisibilityTilePenalty = 50 // Extra cost per tile in full shadow

            };

            int tmpRng = 0;
            int tmpRng2 = 1;
            RoomCore startCore = roomCores[tmpRng];
            RoomCore goalCore = roomCores[tmpRng2];

            //while (roomCores[tmpRng2].coreType != CoreType.Reachable)
            //{
            //    tmpRng2++;
            //    goalCore = roomCores[tmpRng2];
            //}

            int goalIdx = roomCores.FindIndex(c => c.coreType == CoreType.Reachable);
            if (goalIdx == -1)
            {
                // fallback: any non-dead
                goalIdx = roomCores.FindIndex(c => c.coreType != CoreType.Dead);
            }
            if (goalIdx == -1)
            {
                Debug.LogError("No valid goal core found.");
                // bail out or skip later steps safely
                return generations; // or return null; choose what fits your pipeline
            }
           
            // --- pick START safely (distinct from goal) ---
            int startIdx = roomCores.FindIndex(c => c.coreType == CoreType.Reachable && !ReferenceEquals(c, goalCore));
            if (startIdx == -1)
            {
                // fallback: any non-dead distinct from goal
                startIdx = roomCores.FindIndex(c => !ReferenceEquals(c, goalCore) && c.coreType != CoreType.Dead);
            }

            if (startIdx == -1)
            {
                Debug.LogWarning("No suitable start core found distinct from goal; using goal as start (degenerate path).");
                startCore = goalCore; // path may be length 0; handle downstream if needed
            }
            else
            {
                startCore = roomCores[startIdx];
            }

            var path = AStarBetweenCoresWeighted(startCore.Center, goalCore.Center, visualContext);
            var fullGraph = BuildCoreToCoreGraphWeighted(roomCores, visualContext);

            var Vispath = AStarBetweenCoresWeighted(startCore.Center, goalCore.Center, visualContext);
            var VisfullGraph = BuildCoreToCoreGraphWeighted(roomCores, visualContext);

            foreach (var conn in VisfullGraph.Connections)
            {
                conn.VisibilityPenalty = ComputeVisibilityPenalty(conn.Path, visibilityFinal, visibilityWeight);
            }




            var spanningTreeRaw = BuildSpanningTree(fullGraph.Connections);
            var spanningTreeVisual = BuildSpanningTreeWithVisibility(VisfullGraph.Connections);

            int diff = spanningTreeVisual.Count(conn => !spanningTreeRaw.Any(r => r.From == conn.From && r.To == conn.To));

            Debug.Log($"Connections differing: {diff}");


            Debug.Log("visibility casting complete");


            ClassifyRoomFlow(roomCores, spanningTreeVisual);



            List<RoomFloodGroup> allFloodGroups = new();

            foreach (var room in rooms)
            {
                var groups = FloodValidateRoom(
                    room.Id,
                    roomMap,
                    terraceMap,
                    slopeClasified,
                    roomTransSet,
                    terraceTransSet,
                    roomCores,
                    width,
                    height
                );

                allFloodGroups.AddRange(groups);
                //LogFloodValidation(groups, room.Id);
            }


            var widened = AccumulatePathFlows(spanningTreeVisual, width, height, 0.95f);

            // Step: Generate flow map
            var widePath = GenerateRoomAwareWidenedFlowMap(spanningTreeVisual, roomMap, forbidden, width, height, maxHalfWidening);
            var segments = ExtractAndClassifySubsegments(widePath, roomMap, terraceMap);



            //exploding blobs phase1
            var thicknessMap = ComputeThicknessMap(widePath, maxHalfWidening);
            var prunedSubsegments = PruneSubsegmentsByThickness(segments.fullSubsegments, thicknessMap, minThickness: 4);

            var prunedFlowMap = ConvertSubsegmentTilesToFlowMap(prunedSubsegments, width, height);


            //exploding blobs phase2
            var pruneMasked = MaskFlowMapBySubsegments(prunedFlowMap, roomMap, terraceMap, prunedSubsegments);

            var seeds = FloodPlatformBlobSeedsFromSubsegments(roomMap, terraceMap, prunedSubsegments, 12);

            //var blobRoomsSeeds = FloodPlatformBlobSeedsFromUntouchedSubsegments(prunedSubsegments, segments.touchedByPath, minSurface: 6);
            var blobRoomsResul = FloodPlatformBlobSeedsFromUntouchedSubsegments(segments.fullSubsegments, prunedSubsegments, segments.touchedByPath, minSurface: 300);
            var blobRoomsSeeds = blobRoomsResul.seeds;
            var discardedBlobs = blobRoomsResul.discarded;


            List<PlatformSeed> discardedPlat = new List<PlatformSeed>();
            int countV = 0;
            foreach (var d in blobRoomsSeeds)
            {
                foreach (var c in discardedBlobs)
                {
                    if (d.RoomId == c.roomId && d.TerraceId == c.terraceId)
                    {
                        discardedPlat.Add(d);
                        countV += d.Tiles.Count;
                    }

                }

            }
            Debug.Log("Discarded: " + discardedBlobs.Count().ToString() + " - discarded plat:" + discardedBlobs.Count().ToString() + "- total tiles: " + countV.ToString());

            var allRoomsUsed = new HashSet<(int roomId, int terraceId)>(
            blobRoomsSeeds.Select(b => (b.RoomId, b.TerraceId)));

            foreach (var s in segments.fullSubsegments)
            {
                if (!allRoomsUsed.Contains((s.Key.roomId, s.Key.terraceId)))
                    Debug.LogWarning($"Missing room blob: {s.Key.roomId}/{s.Key.terraceId} — Size: {s.Value.Count}");
            }


            //exploding blobs phase 3
            Vector2Int countTil = Vector2Int.zero;
            countTil = countTiles(blobRoomsSeeds, seeds); // count original tiles
            Debug.Log("room base: " + countTil.x.ToString() + "/ flow base: " + countTil.y.ToString());

            //3-1 trimming
            seeds = TrimPlatformSeeds_VisibilityAndPadding(seeds, visibilityTrimmed, roomMap, terraceMap, 0.3f, 2);
            blobRoomsSeeds = TrimPlatformSeeds_VisibilityAndPadding(blobRoomsSeeds, visibilityTrimmed, roomMap, terraceMap, 0.3f, 2);

            countTil = countTiles(blobRoomsSeeds, seeds);// count trimmed tiles
            Debug.Log("room trimmed: " + countTil.x.ToString() + "/ flow trimmed: " + countTil.y.ToString());


            //3-2 compact and shape

            //DISCARDS

            //ROOM SEEDS
            List<PlatformSeed> growthResult = new List<PlatformSeed>();
            for (int i = 0; i < blobRoomsSeeds.Count; i++)
            {
                //find vantage point
                var platformList = MultiVantagePlatformGrowth(blobRoomsSeeds[i].Tiles, visibilityTrimmed, blobRoomsSeeds[i].RoomId, blobRoomsSeeds[i].TerraceId, width, height, 0.85f, 1000, 250);
                growthResult.AddRange(platformList);
            }
            blobRoomsSeeds = growthResult;


            //FLOW SEEDS
            List<PlatformSeed> growthFlow = new List<PlatformSeed>();
            for (int j = 0; j < seeds.Count; j++)
            {
                var seedList = MultiVantagePlatformGrowth(seeds[j].Tiles, visibilityTrimmed, seeds[j].RoomId, seeds[j].TerraceId, width, height, 0.85f, 1000, 250);
                growthFlow.AddRange(seedList);
            }
            seeds = growthFlow;

            countTil = countTiles(blobRoomsSeeds, seeds); //count tiles after expansion
            Debug.Log("room compressed: " + countTil.x.ToString() + " / flow compressed: " + countTil.y.ToString() + " / Vantage pt: " + growthResult.Count().ToString());



            //3-3 Edge Smothing
            for (int i = 0; i < 10; i++)
            {
                ApplyJaggedEdgeSmoothing(blobRoomsSeeds, width, height);
                ApplyJaggedEdgeSmoothing(seeds, width, height);
            }

            countTil = countTiles(blobRoomsSeeds, seeds); //counting tiles after edge smothing
            Debug.Log("room Edge smoothed: " + countTil.x.ToString() + "/ flow Edge smoothed: " + countTil.y.ToString());


            //4.1 classify, merge and discard
            // you need to use Raw path otherwise it may miss conectivity links
            var allPlatforms = blobRoomsSeeds.Concat(seeds).ToList();
            
            for(int i = 0; i< allPlatforms.Count(); i++)
            {
                var pln = allPlatforms[i];
                pln.platformId = i;
                allPlatforms[i] = pln;
            }


            var roomCls = ClassifyRoomFlowFromConnections(allPlatforms, spanningTreeRaw, 50, 200); // variables control thhe rooms flagged as small or micro
            ClassifyPlatformRoles(allPlatforms, roomCls, spanningTreeRaw);
            Debug.Log("rooms classified: " + roomCls.Count().ToString() + "/ Room Seed classified: " + blobRoomsSeeds.Count().ToString() + "/ Flow Seed classified: " + seeds.Count().ToString());

            //4.2 hubs, use entry view point to find central piece, then merge pieces above certain threshold to find their central platform
            //the exact formula is to project a double cone from each edge transition, normalize as entrycone
            //then generate radial fallout from each vantage point, both occluded by obstacles, then normalize
            //each platform obtains a value from 0-2 by adding


            var entryCone = GenerateEntryConeVisibilityMap(edges, forbidden, width, height, 45, 30, 30);

            List<Vector2Int> vpts = new List<Vector2Int>();
            foreach (var plat in allPlatforms)
            {
                vpts.Add(plat.vantagePt);
            }
            var heatVantage = GenerateOccludedVantageHeatMap(vpts, width, height, forbidden, 90, 360);
            heatVantage = NormalizeHeatMapPerRoom(heatVantage, roomCores, width, height);
            entryCone = NormalizeHeatMapPerRoom(entryCone, roomCores, width, height);
            //var combinedVantage = CombineViewAndVantageMaps(entryCone, heatVantage, width, height);



            //4.3 with the maps created, we can now identify platforms for HUB and LEAF type rooms
            //score generates te score of each platform and marks all platforms as undefined
            ScorePlatformsByVantageMap(blobRoomsSeeds, heatVantage, entryCone, roomCls);
            ScoreFlowPlatformsByVantageMap(seeds, heatVantage, entryCone, widePath, roomCls);
            Debug.Log("Room Seeds Scored: " + blobRoomsSeeds.Count().ToString() + " - Flow Seeds Scored: " + seeds.Count().ToString() + " - AllPlat: " + allPlatforms.Count().ToString());
            List<PlatformSeed> hubPlat = new List<PlatformSeed>();
            List<PlatformSeed> leafPlat = new List<PlatformSeed>();
            List<PlatformSeed> corridorPlat = new List<PlatformSeed>();

            allPlatforms.Clear();
            allPlatforms.AddRange(blobRoomsSeeds);
            allPlatforms.AddRange(seeds);
            HashSet<Vector2Int> Alltiles = new HashSet<Vector2Int>();
            foreach (var pl in allPlatforms)
            {
                foreach (var tile in pl.Tiles)
                {
                    Alltiles.Add(tile);
                }
            }
            foreach (var plat in allPlatforms)
            {
                if (roomCls[(plat.RoomId, plat.TerraceId)] == RoomFlowType.Hub)
                    hubPlat.Add(plat);
                else if (roomCls[(plat.RoomId, plat.TerraceId)] == RoomFlowType.Leaf)
                    leafPlat.Add(plat);
                else if (roomCls[(plat.RoomId, plat.TerraceId)] == RoomFlowType.Corridor)
                    corridorPlat.Add(plat);
                else //undefinned is originally on flow territory as part of the widened path
                {
                    roomCls[(plat.RoomId, plat.TerraceId)] = RoomFlowType.Small;
                    if (plat.EntryRoomScore > plat.VantageRoomScore)
                        plat.ScenarioRole = ScenarioRole.Road;
                    else
                        plat.ScenarioRole = ScenarioRole.Satellite;
                }
            }
            Debug.Log("Hubs: " + hubPlat.Count().ToString() + " - Leafs: " + leafPlat.Count().ToString() + " - Corridor: " + corridorPlat.Count().ToString() + " - Missing: " + (allPlatforms.Count() - corridorPlat.Count() - leafPlat.Count() - hubPlat.Count()));

            //hubs
            AssignScenarioRoles(hubPlat, edges, 0.9f, 0.1f, 3);
            //leaf
            AssignLeafScenarioRoles(leafPlat, edges, new Vector3(0.99f, 0.65f, 0.25f), 3); // first is intimacy threshold, second is vanpoint threshold (high for core visible places), third is entry point view (low for away from visible)
            //corridor
            AssignCorridorScenarioRoles(corridorPlat, edges, 3);



            List<RoomScenario> Scenarios = BuildRoomScenarios(allPlatforms, roomCls);

            StampGen tester = GameObject.FindAnyObjectByType<StampGen>();
            if (tester == null)
            {
                GameObject go = new GameObject("RoomTerrainTester");
                tester = go.AddComponent<StampGen>();
            }

            Debug.Log("height: " + (hmap.GetLength(0) * hmap.GetLength(1)) + " - psegment Tiles: " + prunedSubsegments.Count(k => k.Value.Count() > 0) + " - allplat: " + allPlatforms.Count(p => p.Tiles.Count > 0));

            string datapath = "Assets/Script/ScriiptableObj/genData.asset";
            var data = AssetDatabase.LoadAssetAtPath<GenStructuralData>(datapath);
            if (data != null)
            {
                datadump.totalFill(hmap, slopeClasified, rooms, edges, terraceEdges, prunedSubsegments, spanningTreeRaw, allPlatforms, forbidden, roomCores);
                datadump.heightbase = heightMap;
                EditorUtility.SetDirty(data);
                AssetDatabase.SaveAssets();
            }

            string f = "";
            int countplatforms = 0 ;
            foreach(var plt in allPlatforms)
            {
                if (plt.RoomId == 3 && plt.Tiles.Count > 50)
                {
                    countplatforms++;
                    f += "p" + countplatforms.ToString() + ": " + plt.TerraceId.ToString() + " - " + plt.Tiles.Count.ToString() + "\n";
                }
            }

            Debug.Log("Room 3 - platforms " + countplatforms.ToString());
            Debug.Log(f);

           



            //texture Generation
            //slope  - > side map
            generations[0] = GenerateTerraceHeightDebugTex(terraceMap, hmap, width,height);
            //rooms
            generations[1] = GenerateRoomTerraceDebugTex(rooms, hmap, terraceMap, numTerraces, width, height);
            //generations[1] = GenerateSegmentTexture(segments,terraceMap,width,height);
            //edges
            generations[2] = GenerateTerraceBorderTexture(terraceMap, slopeClasified, terraceEdges, edges, roomMap, width, height, minTerraceTrans);

            //path -> 4: path renderer
            generations[3] = GenerateFlowScoreTexture(widePath, width, height);
            //GeneratePrunedGraphTexture(roomCores, spanningTreeVisual, width, height);
            //cls
            generations[4] = GenerateFlowScoreTexture(heatVantage, width,height);
            //flow
            generations[5] = GenerateFlowScoreTexture(prunedFlowMap, width, height);
            //GeneratePlatformScenarioRoleTexture(hubPlat, width, height);

            //vis - > side map
            generations[6] = GenerateFlowScoreTexture(thicknessMap, width, height);
            //GenerateFlowScoreTexture(widePath, width, height);
            //forbidden
            generations[7] = GenerateForbiddenDebugTexture(forbidden, width, height);
            //platform
            //show trimmed and smothed platforms with platforms ares compacted by radial vantage point of view
            generations[8] = GeneratePlatformSeedDebugTexture(blobRoomsSeeds, width, height); 
            generations[9] = GeneratePlatformSeedDebugTexture(seeds, width, height);

            //
            generations[10] = GeneratePlatformScenarioRoleTexture(allPlatforms,width,height); // platform roles??
            //generations[10] = GeneratePlatformRoleTexture(blobRoomsSeeds, width, height);
            generations[11] = GenerateRoomFlowTypeDebugTexture(roomCls, roomCores,width, height); // draws room role with outlines
            generations[12] = GeneratePlatformSeedDebugTexture(discardedPlat, width, height);
            //GeneratePlatformScenarioRoleTexture(corridorPlat, width, height);

            

            return generations;
        }

        private static void SequenceB()
        {

        }

        
        

        public static float[,] TextureToHeightMap(Texture2D texture, int targetWidth, int targetHeight)
        {
            float[,] heightMap = new float[targetWidth, targetHeight];

            for (int x = 0; x < targetWidth; x++)
            {
                for (int y = 0; y < targetHeight; y++)
                {
                    float u = (float)x / (targetWidth - 1);
                    float v = (float)y / (targetHeight - 1);
                    Color pixel = texture.GetPixelBilinear(u, v);
                    heightMap[x, y] = pixel.grayscale; 
                }
            }

            return heightMap;
        }

        public static float[,] ComputeSlopeMap(float[,] heightMap)
        {
            int width = heightMap.GetLength(0);
            int height = heightMap.GetLength(1);
            float[,] slopeMap = new float[width, height];

            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {


                    float dx = (heightMap[x + 1, y] - heightMap[x - 1, y]) * 0.5f;
                    float dy = (heightMap[x, y + 1] - heightMap[x, y - 1]) * 0.5f;

                    slopeMap[x, y] = Mathf.Sqrt(dx * dx + dy * dy);
                }
            }

            // Optional: edge padding
            for (int x = 0; x < width; x++)
            {
                slopeMap[x, 0] = slopeMap[x, 1];
                slopeMap[x, height - 1] = slopeMap[x, height - 2];
            }
            for (int y = 0; y < height; y++)
            {
                slopeMap[0, y] = slopeMap[1, y];
                slopeMap[width - 1, y] = slopeMap[width - 2, y];
            }

            float minSlope = float.MaxValue;
            float maxSlope = float.MinValue;

            // After computing slopeMap
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    float s = slopeMap[x, y];
                    if (s < minSlope) minSlope = s;
                    if (s > maxSlope) maxSlope = s;
                }
            }

            Debug.Log($"Original Slope range: {minSlope} - {maxSlope}");

            return slopeMap;
        }

        public static float[,] NormalizeHeightsPerTerrace(    float[,] heightMap,    int[,] terraceMap,    int targetTerrace,    int width,    int height)
        {
            float minH = float.MaxValue;
            float maxH = float.MinValue;

            // First pass: find min/max for this terrace
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    if (terraceMap[x, y] == targetTerrace)
                    {
                        float h = heightMap[x, y];
                        if (h < minH) minH = h;
                        if (h > maxH) maxH = h;
                    }

            float range = maxH - minH;
            if (range <= 0.0001f) range = 1f;

            // Second pass: normalize
            float[,] norm = new float[width, height];
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    norm[x, y] = (terraceMap[x, y] == targetTerrace)
                        ? (heightMap[x, y] - minH) / range
                        : 0f;

            return norm;
        }

        public static float[,] ComputeTerraceSlopeMap(float[,] heightMap, int width, int height)
        {
            float[,] slope = new float[width, height];
            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    float dx = (heightMap[x + 1, y] - heightMap[x - 1, y]) * 0.5f;
                    float dy = (heightMap[x, y + 1] - heightMap[x, y - 1]) * 0.5f;
                    slope[x, y] = Mathf.Sqrt(dx * dx + dy * dy);
                }
            }
            return slope;
        }



        public static SlopeType[,] ClassifySlopeMap(float[,] slopeMap, float[,] hmap, float gentleThreshold = 0.06f, float steepThreshold = 0.6f)
        {
            int width = slopeMap.GetLength(0);
            int height = slopeMap.GetLength(1);
            SlopeType[,] slopeClassMap = new SlopeType[width, height];

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    float slope = slopeMap[x, y];

                    if(slope <= 0)
                        slopeClassMap[x, y] = SlopeType.Void;
                    else if (slope < gentleThreshold)
                        slopeClassMap[x, y] = SlopeType.Flat;
                    else if (slope < steepThreshold)
                        slopeClassMap[x, y] = SlopeType.Gentle;
                    else
                        slopeClassMap[x, y] = SlopeType.Steep;
                }
            }

            return slopeClassMap;
        }

        public static float[,] NormalizeSlopeMap(float[,] slopeMap)
        {
            int width = slopeMap.GetLength(0);
            int height = slopeMap.GetLength(1);
            float min = float.MaxValue;
            float max = float.MinValue;

            // Find min and max
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float val = slopeMap[x, y];
                    if (val < min) min = val;
                    if (val > max) max = val;
                }

            // Normalize
            float[,] normalized = new float[width, height];
            float range = max - min;

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    normalized[x, y] = range > 0f ? (slopeMap[x, y] - min) / range : 0f;

            float minSlope = float.MaxValue;
            float maxSlope = float.MinValue;

            // After computing slopeMap
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    float s = normalized[x, y];
                    if (s < minSlope) minSlope = s;
                    if (s > maxSlope) maxSlope = s;
                }
            }

            Debug.Log($"Normalized Slope range: {minSlope} - {maxSlope}");

            return normalized;
        }

        public static float[,] ApplyPowTransform(float[,] slopeMap, float exponent)
        {
            int width = slopeMap.GetLength(0);
            int height = slopeMap.GetLength(1);
            float[,] result = new float[width, height];

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    float val = slopeMap[x, y];
                    result[x, y] = Mathf.Pow(val, exponent);
                }
            }

            float minSlope = float.MaxValue;
            float maxSlope = float.MinValue;

            // After computing slopeMap
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    float s = result[x, y];
                    if (s < minSlope) minSlope = s;
                    if (s > maxSlope) maxSlope = s;
                }
            }
            Debug.Log($"Power Slope range: {minSlope} - {maxSlope}");
            return result;
        }

        public static int[,] QuantizeToTerraces(float[,] heightMap, int terraceCount)
        {
            int width = heightMap.GetLength(0);
            int height = heightMap.GetLength(1);
            int[,] terraceMap = new int[width, height];

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    terraceMap[x, y] = Mathf.FloorToInt(heightMap[x, y] * terraceCount);
                }
            }

            return terraceMap;
        }

        public static List<EdgeTile> ClassifyRoomEdges(    int[,] roomMap,    float[,] heightMap,    SlopeType[,] slopeMap,    int[,] terraceMap,    float heightThreshold = 0.05f,    float hardHeightThreshold = 0.2f)
        {
            int width = roomMap.GetLength(0);
            int height = roomMap.GetLength(1);

            List<EdgeTile> edgeTiles = new List<EdgeTile>();
            Vector2Int[] directions = new Vector2Int[]
            {
        Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right
            };

            HashSet<string> visitedPairs = new HashSet<string>();

            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    int roomA = roomMap[x, y];
                    float h1 = heightMap[x, y];
                    int terraceA = terraceMap[x, y];

                    if (roomA <= 0 || h1 <= 0f)
                        continue;

                    foreach (var dir in directions)
                    {
                        int nx = x + dir.x;
                        int ny = y + dir.y;

                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                            continue;

                        int roomB = roomMap[nx, ny];
                        float h2 = heightMap[nx, ny];
                        int terraceB = terraceMap[nx, ny];

                        if (roomB <= 0 || roomB == roomA || h2 <= 0f)
                            continue;

                        // Avoid duplicate edges
                        string pairKey = roomA < roomB
                            ? $"{roomA}-{roomB}-{x}-{y}"
                            : $"{roomB}-{roomA}-{nx}-{ny}";

                        if (visitedPairs.Contains(pairKey)) continue;
                        visitedPairs.Add(pairKey);

                        float heightDiff = Mathf.Abs(h1 - h2);
                        SlopeType s1 = slopeMap[x, y];
                        SlopeType s2 = slopeMap[nx, ny];

                        EdgeType type;

                        // 🧱 New Terrace-based hard edge rule:
                        if (terraceA != terraceB && roomA != roomB)
                        {
                            type = EdgeType.SolidHard;
                        }
                        else if (s1 == SlopeType.Steep || s2 == SlopeType.Steep || heightDiff > hardHeightThreshold)
                        {
                            type = EdgeType.SolidHard;
                        }
                        else if (s1 == SlopeType.Gentle && s2 == SlopeType.Gentle && heightDiff <= heightThreshold)
                        {
                            type = EdgeType.Transition;
                        }
                        else
                        {
                            type = EdgeType.SolidSoft;
                        }

                        edgeTiles.Add(new EdgeTile
                        {
                            Pos = new Vector2Int(x, y),
                            RoomA = roomA,
                            RoomB = roomB,
                            Type = type
                        });

                        edgeTiles.Add(new EdgeTile
                        {
                            Pos = new Vector2Int(nx, ny),
                            RoomA = roomB,
                            RoomB = roomA,
                            Type = type
                        });
                    }
                }
            }

            Debug.Log($"Classified {edgeTiles.Count} room edges with terrace-based logic.");
            return edgeTiles;
        }

        public static List<List<Vector2Int>> GroupEdgePositionsByType(    Dictionary<Vector2Int, EdgeTile> edgeDict,    EdgeType matchType,    int width,    int height)
        {
            List<List<Vector2Int>> groups = new List<List<Vector2Int>>();
            HashSet<Vector2Int> visited = new HashSet<Vector2Int>();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            foreach (var kvp in edgeDict)
            {
                Vector2Int pos = kvp.Key;
                if (visited.Contains(pos)) continue;
                if (kvp.Value.Type != matchType) continue;

                List<Vector2Int> group = new List<Vector2Int>();
                Queue<Vector2Int> queue = new Queue<Vector2Int>();
                queue.Enqueue(pos);

                while (queue.Count > 0)
                {
                    Vector2Int current = queue.Dequeue();
                    if (visited.Contains(current)) continue;
                    visited.Add(current);
                    group.Add(current);

                    foreach (var dir in dirs)
                    {
                        Vector2Int np = current + dir;
                        if (!edgeDict.ContainsKey(np)) continue;
                        if (visited.Contains(np)) continue;
                        if (edgeDict[np].Type != matchType) continue;
                        queue.Enqueue(np);
                    }
                }

                if (group.Count > 0)
                    groups.Add(group);
            }

            return groups;
        }

        public static void ExpandAndFilterTransitions(    List<EdgeTile> edges,    float[,] heightMap,    SlopeType[,] slopeMap,    int[,] roomMap,    int[,] terraceMap,    int width,    int height,    float heightThreshold,    int minGroupSize = 4)
        {
            // Build quick lookup
            Dictionary<Vector2Int, EdgeTile> edgeDict = new Dictionary<Vector2Int, EdgeTile>();
            for (int i = 0; i < edges.Count; i++)
            {
                edgeDict[edges[i].Pos] = edges[i];
            }

            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            // Step 1: Expand all existing transitions
            Queue<Vector2Int> frontier = new Queue<Vector2Int>();
            HashSet<Vector2Int> seen = new HashSet<Vector2Int>();

            foreach (var kvp in edgeDict)
            {
                if (kvp.Value.Type == EdgeType.Transition)
                {
                    frontier.Enqueue(kvp.Key);
                    seen.Add(kvp.Key);
                }
            }

            while (frontier.Count > 0)
            {
                Vector2Int pos = frontier.Dequeue();
                EdgeTile source = edgeDict[pos];

                int roomA = roomMap[pos.x, pos.y];
                int terraceA = terraceMap[pos.x, pos.y];
                float h1 = heightMap[pos.x, pos.y];
                SlopeType s1 = slopeMap[pos.x, pos.y];

                foreach (var dir in dirs)
                {
                    Vector2Int np = pos + dir;
                    if (np.x < 0 || np.x >= width || np.y < 0 || np.y >= height)
                        continue;
                    if (seen.Contains(np))
                        continue;
                    if (!edgeDict.TryGetValue(np, out var neighbor))
                        continue;
                    if (neighbor.Type != EdgeType.SolidSoft)
                        continue;

                    int roomB = roomMap[np.x, np.y];
                    int terraceB = terraceMap[np.x, np.y];
                    SlopeType s2 = slopeMap[np.x, np.y];

                    // ✅ Apply only essential rules
                    if (roomA != roomB) continue;
                    if (terraceA != terraceB) continue;
                    if (s1 == SlopeType.Steep || s2 == SlopeType.Steep) continue;

                    // ✅ Promote to transition
                    neighbor.Type = EdgeType.Transition;
                    edgeDict[np] = neighbor;

                    frontier.Enqueue(np);
                    seen.Add(np);
                }
            }

            Debug.Log($"Expanded transitions: total transition tiles = {edgeDict.Values.Count(e => e.Type == EdgeType.Transition)}");

            // Step 2: Re-group transitions
            List<List<Vector2Int>> transitionGroups = GroupEdgePositionsByType(edgeDict, EdgeType.Transition, width, height);

            // Step 3: Filter out small groups
            int removed = 0;
            foreach (var group in transitionGroups)
            {
                if (group.Count < minGroupSize)
                {
                    removed++;
                    foreach (var pos in group)
                    {
                        var e = edgeDict[pos];
                        e.Type = EdgeType.SolidSoft;
                        edgeDict[pos] = e;
                    }
                }
            }

            Debug.Log($"Transition groups removed: {removed}");

            // Final sync back to edge list
            for (int i = 0; i < edges.Count; i++)
            {
                if (edgeDict.TryGetValue(edges[i].Pos, out var updated))
                    edges[i] = updated;
            }
        }


        public static Dictionary<(int, int), RoomConnection> BuildRoomGraph(    List<EdgeTile> edges)
        {
            var graph = new Dictionary<(int, int), RoomConnection>();

            foreach (var edge in edges)
            {
                if (edge.Type != EdgeType.Transition)
                    continue;

                int a = edge.RoomA;
                int b = edge.RoomB;
                if (a > b) (a, b) = (b, a); // consistent ordering

                var key = (a, b);
                if (!graph.TryGetValue(key, out var connection))
                {
                    connection = new RoomConnection { RoomA = a, RoomB = b };
                    graph[key] = connection;
                }

                connection.EdgeTiles.Add(edge.Pos);
            }

            // Calculate centers
            foreach (var conn in graph.Values)
            {
                Vector2 sum = Vector2.zero;
                foreach (var p in conn.EdgeTiles)
                    sum += (Vector2)p;

                conn.center = sum / conn.EdgeTiles.Count;
            }

            Debug.Log($"Built room graph with {graph.Count} connections.");
            return graph;
        }

        public static List<RoomCore> FindRoomCores(    int[,] roomMap,    int[,] terraceMap,    SlopeType[,] slopeMap,    int targetRoom,    int width,    int height)
        {
            bool[,] visited = new bool[width, height];
            List<RoomCore> cores = new List<RoomCore>();

            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (visited[x, y]) continue;
                    if (roomMap[x, y] != targetRoom) continue;
                    if (slopeMap[x, y] == SlopeType.Steep) continue;

                    int terrace = terraceMap[x, y];
                    RoomCore core = new RoomCore { RoomID = targetRoom, TerraceLevel = terrace };

                    Queue<Vector2Int> queue = new Queue<Vector2Int>();
                    queue.Enqueue(new Vector2Int(x, y));

                    while (queue.Count > 0)
                    {
                        var pos = queue.Dequeue();
                        if (visited[pos.x, pos.y]) continue;
                        if (roomMap[pos.x, pos.y] != targetRoom) continue;
                        if (terraceMap[pos.x, pos.y] != terrace) continue;
                        if (slopeMap[pos.x, pos.y] == SlopeType.Steep) continue;

                        visited[pos.x, pos.y] = true;
                        core.Tiles.Add(pos);

                        foreach (var d in dirs)
                        {
                            Vector2Int np = pos + d;
                            if (np.x >= 0 && np.x < width && np.y >= 0 && np.y < height)
                                if (!visited[np.x, np.y])
                                    queue.Enqueue(np);
                        }
                    }

                    if (core.Tiles.Count > 0)
                    {
                        // Compute Center (centroid)
                        Vector2 sum = Vector2.zero;
                        foreach (var t in core.Tiles)
                            sum += t;

                        core.Center = Vector2Int.RoundToInt(sum / core.Tiles.Count);
                        cores.Add(core);
                    }
                }
            }

            //Debug.Log($"Room {targetRoom} has {cores.Count} terrace segment cores.");
            return cores;
        }

        public static void MarkReachableRoomCores(    List<RoomCore> cores,    Dictionary<(int, int), RoomConnection> graph)
        {
            foreach (var conn in graph.Values)
            {
                int roomA = conn.RoomA;
                int roomB = conn.RoomB;

                RoomCore? closestA = FindClosestCore(conn.center, roomA, cores);
                RoomCore? closestB = FindClosestCore(conn.center, roomB, cores);

                if (closestA != null) closestA.coreType = CoreType.Reachable;
                if (closestB != null) closestB.coreType = CoreType.Reachable;
            }
        }

        private static RoomCore? FindClosestCore(Vector2 center, int roomId, List<RoomCore> cores)
        {
            RoomCore? closest = null;
            float bestDist = float.MaxValue;

            foreach (var core in cores)
            {
                if (core.RoomID != roomId)
                    continue;
                if (core.coreType == CoreType.Dead)
                    continue; // Don't promote micro-cores

                float dist = Vector2.Distance(center, core.Center);
                if (dist < bestDist)
                {
                    bestDist = dist;
                    closest = core;
                }
            }

            return closest;
        }

        public static List<TerraceEdge> FindTerraceTransitions(    int[,] roomMap,    int[,] terraceMap,    SlopeType[,] slopeMap,    int width,    int height)
        {
            List<TerraceEdge> edges = new List<TerraceEdge>();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    int room = roomMap[x, y];
                    int terrace = terraceMap[x, y];
                    SlopeType slope = slopeMap[x, y];
                    if (room <= 0 || slope == SlopeType.Steep)
                        continue;

                    foreach (var dir in dirs)
                    {
                        int nx = x + dir.x;
                        int ny = y + dir.y;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                            continue;

                        if (roomMap[nx, ny] != room)
                            continue;

                        int otherTerrace = terraceMap[nx, ny];
                        SlopeType otherSlope = slopeMap[nx, ny];

                        // Only allow transitions between adjacent terraces
                        if (Mathf.Abs(otherTerrace - terrace) != 1)
                            continue;

                        if (otherSlope == SlopeType.Steep)
                            continue;

                        // Must be walkable: at least one must be Flat or Gentle
                        if (slope == SlopeType.Steep && otherSlope == SlopeType.Steep)
                            continue;

                        edges.Add(new TerraceEdge
                        {
                            Pos = new Vector2Int(x, y),
                            Room = room,
                            TerraceFrom = terrace,
                            TerraceTo = otherTerrace
                        });
                    }
                }
            }

            Debug.Log($"[TerraceTransitions] Found {edges.Count} valid terrace transitions.");
            return edges;
        }

        public static void FlagMicroCores(List<RoomCore> cores, int minSize = 5)
        {
            foreach (var core in cores)
            {
                if (core.Tiles.Count < minSize)
                    core.coreType = CoreType.Dead; // or Decorative/Discard
            }
        }

        public static HashSet<Vector2Int> ScanCoreConnectivity(    RoomCore root,    List<RoomCore> allCores,    int[,] roomMap,    int[,] terraceMap,    SlopeType[,] slopeMap,    HashSet<Vector2Int> roomTransitions,    HashSet<Vector2Int> terraceTransitions,    int width,    int height)
        {
            bool[,] visited = new bool[width, height];
            Queue<Vector2Int> queue = new Queue<Vector2Int>();
            HashSet<Vector2Int> reachableTiles = new HashSet<Vector2Int>();

            queue.Enqueue(root.Center);
            visited[root.Center.x, root.Center.y] = true;

            Vector2Int[] dirs = {
                Vector2Int.up, Vector2Int.down,
                Vector2Int.left, Vector2Int.right
                                };

            while (queue.Count > 0)
            {
                var pos = queue.Dequeue();
                reachableTiles.Add(pos);

                int room = roomMap[pos.x, pos.y];
                int terrace = terraceMap[pos.x, pos.y];
                SlopeType slope = slopeMap[pos.x, pos.y];

                foreach (var d in dirs)
                {
                    Vector2Int np = pos + d;
                    if (np.x < 0 || np.x >= width || np.y < 0 || np.y >= height)
                        continue;
                    if (visited[np.x, np.y])
                        continue;

                    var nextSlope = slopeMap[np.x, np.y];
                    if (nextSlope == SlopeType.Steep)
                        continue;

                    int roomNext = roomMap[np.x, np.y];
                    int terraceNext = terraceMap[np.x, np.y];

                    bool roomMatch = (room == roomNext);
                    bool terraceMatch = (terrace == terraceNext);

                    bool validRoomTransit = roomTransitions.Contains(pos) || roomTransitions.Contains(np);
                    bool validTerraceTransit = terraceTransitions.Contains(pos) || terraceTransitions.Contains(np);

                    if ((roomMatch || validRoomTransit) && (terraceMatch || validTerraceTransit))
                    {
                        visited[np.x, np.y] = true;
                        queue.Enqueue(np);
                    }
                }
            }

            // ✅ Flag reachable cores
            foreach (var core in allCores)
            {
                if (core.coreType == CoreType.Dead)
                    continue;

                bool reachable = core.Tiles.Any(t => reachableTiles.Contains(t));
                if (reachable)
                    core.coreType = CoreType.Reachable;
                else if (core.coreType != CoreType.Dead)
                    core.coreType = CoreType.Unreachable;
            }

            return reachableTiles;
        }

        private static RoomCore ChooseStartingCore(List<RoomCore> cores)
        {
            return cores.FirstOrDefault(c => c.coreType != CoreType.Dead);
        }

        public static HashSet<Vector2Int> ExtractTerraceTransitionPositions(List<TerraceEdge> edges)
        {
            return new HashSet<Vector2Int>(edges.Select(e => e.Pos));
        }

        public static HashSet<Vector2Int> ExtractRoomTransitionPositions(List<EdgeTile> edges)
        {
            return new HashSet<Vector2Int>(
                edges.Where(e => e.Type == EdgeType.Transition).Select(e => e.Pos)
            );
        }

        public static List<TerraceEdge> FindRankedTerraceTransitions(    int[,] roomMap,    int[,] terraceMap,    float[,] rawHeightMap,    int width,    int height,    float slopeThreshold = 0.05f)
        {
            var result = new List<TerraceEdge>();
            HashSet<Vector2Int> added = new();

            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            // Step 1: Normalize slope per terrace
            Dictionary<int, float[,]> terraceSlope = new();
            HashSet<int> terraces = new();

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    terraces.Add(terraceMap[x, y]);

            foreach (int t in terraces)
            {
                var norm = NormalizeHeightsPerTerrace(rawHeightMap, terraceMap, t, width, height);
                var slope = ComputeTerraceSlopeMap(norm, width, height);
                terraceSlope[t] = slope;
            }

            // Step 2: Check each valid border position only once
            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    int room = roomMap[x, y];
                    int t1 = terraceMap[x, y];
                    if (room <= 0 || !terraceSlope.ContainsKey(t1)) continue;

                    foreach (var d in dirs)
                    {
                        int nx = x + d.x, ny = y + d.y;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                            continue;

                        if (roomMap[nx, ny] != room) continue;

                        int t2 = terraceMap[nx, ny];
                        if (t1 == t2 || Mathf.Abs(t1 - t2) != 1) continue;

                        // Enforce directional consistency
                        Vector2Int edgePos = new Vector2Int(x, y);
                        if (t2 < t1)
                        {
                            edgePos = new Vector2Int(nx, ny);
                            (t1, t2) = (t2, t1); // swap so t1 is always lower
                        }

                        if (added.Contains(edgePos)) continue;

                        float sLow = terraceSlope[t1][edgePos.x, edgePos.y];
                        float sHigh = terraceSlope[t2][edgePos.x, edgePos.y];

                        float slopeDelta = sLow - sHigh;
                        if (slopeDelta > slopeThreshold)
                        {
                            result.Add(new TerraceEdge
                            {
                                Pos = edgePos,
                                Room = room,
                                TerraceFrom = t1,
                                TerraceTo = t2
                            });

                            added.Add(edgePos);
                        }
                    }
                }
            }

            return result;
        }

        public static List<TerraceEdge> FindFilteredRankedTerraceTransitions(    int[,] roomMap,    int[,] terraceMap,    float[,] rawHeightMap,    int width,    int height,    float slopeDeltaThreshold,    int minGroupSize)
        {
            var baseEdges = FindRankedTerraceTransitions(
                roomMap, terraceMap, rawHeightMap, width, height, slopeDeltaThreshold);

            // Filter based on connected regions
            var grouped = FilterConnectedTerraceTransitions(
                new HashSet<Vector2Int>(baseEdges.Select(e => e.Pos)), width, height, minGroupSize);

            var result = baseEdges.Where(e => grouped.Contains(e.Pos)).ToList();

            return result;
        }

        public static HashSet<Vector2Int> ExtractNonTransitionTerraceBorders(     int[,] terraceMap,     SlopeType[,] slopeMap,     HashSet<Vector2Int> validTransitions,     int width,     int height)
        {
            var borders = new HashSet<Vector2Int>();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    var pos = new Vector2Int(x, y);
                    if (slopeMap[x, y] == SlopeType.Steep) continue;
                    int terr = terraceMap[x, y];

                    foreach (var d in dirs)
                    {
                        int nx = x + d.x;
                        int ny = y + d.y;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                        if (terraceMap[nx, ny] != terr &&
                            slopeMap[nx, ny] != SlopeType.Steep &&
                            !validTransitions.Contains(pos))
                        {
                            borders.Add(pos);
                            break;
                        }
                    }
                }
            }

            return borders;
        }





        public static CoreConnectivityGraph BuildCoreToCoreGraphWeighted(    List<RoomCore> allCores,    AStarContext context)
        {
            var graph = new CoreConnectivityGraph();

            // Only use reachable cores
            var reachable = allCores
                .Where(c => c.coreType == CoreType.Reachable)
                .ToList();

            graph.ReachableCores = reachable;

            // Connect every pair with A* path
            for (int i = 0; i < reachable.Count; i++)
            {
                var from = reachable[i];

                for (int j = i + 1; j < reachable.Count; j++)
                {
                    var to = reachable[j];

                    var path = AStarBetweenCoresWeighted(from.Center, to.Center, context);

                    if (path.Count > 0)
                    {
                        graph.Connections.Add(new CoreConnection
                        {
                            From = from,
                            To = to,
                            Path = path,
                            VisibilityPenalty = ComputeVisibilityPenalty(path, context.VisibilityMap, context.VisibilityTilePenalty)
                        });
                    }
                }
            }

            return graph;
        }

        public static List<Vector2Int> AStarBetweenCoresWeighted(    Vector2Int start,    Vector2Int goal,    AStarContext context,    bool allowDiagonals = false)
        {
            var open = new PriorityQueue<Vector2Int, float>();
            var cameFrom = new Dictionary<Vector2Int, Vector2Int>();
            var costSoFar = new Dictionary<Vector2Int, float>();

            Vector2Int[] cardinalDirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };
            Vector2Int[] diagonalDirs = { new(1, 1), new(-1, 1), new(1, -1), new(-1, -1) };
            Vector2Int[] dirs = allowDiagonals
                ? cardinalDirs.Concat(diagonalDirs).ToArray()
                : cardinalDirs;

            open.Enqueue(start, 0f);
            cameFrom[start] = start;
            costSoFar[start] = 0f;

            while (open.Count > 0)
            {
                Vector2Int current = open.Dequeue();

                if (current == goal)
                    break;

                foreach (var dir in dirs)
                {
                    Vector2Int next = current + dir;
                    if (!context.IsInside(next) || !context.IsWalkable(current, next))
                        continue;

                    float baseCost = (Mathf.Abs(dir.x) + Mathf.Abs(dir.y) == 2) ? 14f : 10f;
                    float shadowFactor = context.VisibilityMap[next.x, next.y]; // [0..1]
                    float shadowPenalty = shadowFactor * context.VisibilityTilePenalty;

                    float stepCost = baseCost + shadowPenalty;
                    float newCost = costSoFar[current] + stepCost;

                    if (!costSoFar.ContainsKey(next) || newCost < costSoFar[next])
                    {
                        costSoFar[next] = newCost;
                        float priority = newCost + Mathf.Abs(goal.x - next.x) + Mathf.Abs(goal.y - next.y);
                        open.Enqueue(next, priority);
                        cameFrom[next] = current;
                    }
                }
            }

            // Reconstruct path
            if (!cameFrom.ContainsKey(goal))
                return new List<Vector2Int>(); // Unreachable

            var path = new List<Vector2Int>();
            Vector2Int p = goal;
            while (p != start)
            {
                path.Add(p);
                p = cameFrom[p];
            }
            path.Add(start);
            path.Reverse();
            return path;
        }

        public class UnionFind<T>
        {
            private Dictionary<T, T> parent = new();

            public T Find(T item)
            {
                if (!parent.ContainsKey(item))
                    parent[item] = item;

                if (!EqualityComparer<T>.Default.Equals(parent[item], item))
                    parent[item] = Find(parent[item]);

                return parent[item];
            }

            public void Union(T a, T b)
            {
                var rootA = Find(a);
                var rootB = Find(b);
                if (!EqualityComparer<T>.Default.Equals(rootA, rootB))
                    parent[rootB] = rootA;
            }

            public bool Connected(T a, T b) => Find(a).Equals(Find(b));
        }

        public static List<CoreConnection> BuildSpanningTree(List<CoreConnection> allConnections)
        {
            var sortedEdges = allConnections.OrderBy(e => e.Cost).ToList();
            var uf = new UnionFind<RoomCore>();
            var result = new List<CoreConnection>();

            foreach (var edge in sortedEdges)
            {
                if (!uf.Connected(edge.From, edge.To))
                {
                    uf.Union(edge.From, edge.To);
                    result.Add(edge);
                }
            }

            return result;
        }

        public static List<CoreConnection> BuildSpanningTreeWithVisibility(List<CoreConnection> allConnections)
        {
            var sortedEdges = allConnections.OrderBy(c => c.TotalCost).ToList();
            var uf = new UnionFind<RoomCore>();
            var result = new List<CoreConnection>();

            foreach (var edge in sortedEdges)
            {
                if (!uf.Connected(edge.From, edge.To))
                {
                    uf.Union(edge.From, edge.To);
                    result.Add(edge);
                }
            }

            return result;
        }

        public static float[,] GenerateRoomAwareWidenedFlowMap(    List<CoreConnection> corePaths,    int[,] roomMap,    HashSet<Vector2Int> forbidden,    int width,    int height,    int maxHalfWidth = 6)
        {
            float[,] flowMap = new float[width, height];

            foreach (var connection in corePaths)
            {
                var path = connection.Path;
                if (path.Count < 2) continue;

                // Step 1: Break into sub-segments by room
                List<List<Vector2Int>> subSegments = BreakPathByRoom(path, roomMap);

                foreach (var sub in subSegments)
                {
                    //if (sub.Count < 2) continue;


                    int minReachableRadius = maxHalfWidth;

                    // Step 2: Evaluate min width based on all tiles in segment
                    int leftRadius = maxHalfWidth;
                    int rightRadius = maxHalfWidth;

                    for (int i = 1; i < sub.Count; i++)
                    {
                        Vector2Int a = sub[i - 1];
                        Vector2Int b = sub[i];
                        Vector2 dir = (b - a);
                        Vector2 normal = new Vector2(-dir.y, dir.x).normalized;
                        Vector2Int mid = b;

                        for (int r = 1; r <= maxHalfWidth; r++)
                        {
                            Vector2 leftOffset = mid + normal * r * -1;
                            Vector2Int testLeft = new Vector2Int(Mathf.RoundToInt(leftOffset.x), Mathf.RoundToInt(leftOffset.y));
                            if (testLeft.x < 0 || testLeft.y < 0 || testLeft.x >= width || testLeft.y >= height || forbidden.Contains(testLeft))
                            {
                                leftRadius = Mathf.Min(leftRadius, r - 1);
                                break;
                            }
                        }

                        for (int r = 1; r <= maxHalfWidth; r++)
                        {
                            Vector2 rightOffset = mid + normal * r * 1;
                            Vector2Int testRight = new Vector2Int(Mathf.RoundToInt(rightOffset.x), Mathf.RoundToInt(rightOffset.y));
                            if (testRight.x < 0 || testRight.y < 0 || testRight.x >= width || testRight.y >= height || forbidden.Contains(testRight))
                            {
                                rightRadius = Mathf.Min(rightRadius, r - 1);
                                break;
                            }
                        }
                    }


                    // Step 3: Apply expansion using that uniform radius
                    for (int i = 1; i < sub.Count; i++)
                    {
                        Vector2Int a = sub[i - 1];
                        Vector2Int b = sub[i];
                        Vector2 dir = (b - a);
                        Vector2 normal = new Vector2(-dir.y, dir.x).normalized;

                        if (!forbidden.Contains(b))
                            flowMap[b.x, b.y] = 1f;

                        // Expand left
                        for (int r = 1; r <= leftRadius; r++)
                        {
                            Vector2 offset = b + normal * r * -1;
                            Vector2Int p = new Vector2Int(Mathf.RoundToInt(offset.x), Mathf.RoundToInt(offset.y));
                            if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) continue;
                            if (forbidden.Contains(p)) continue;

                            float v = 1f - (r / (float)(maxHalfWidth + 1));
                            flowMap[p.x, p.y] = Mathf.Max(flowMap[p.x, p.y], v);
                        }

                        // Expand right
                        for (int r = 1; r <= rightRadius; r++)
                        {
                            Vector2 offset = b + normal * r * 1;
                            Vector2Int p = new Vector2Int(Mathf.RoundToInt(offset.x), Mathf.RoundToInt(offset.y));
                            if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) continue;
                            if (forbidden.Contains(p)) continue;

                            float v = 1f - (r / (float)(maxHalfWidth + 1));
                            flowMap[p.x, p.y] = Mathf.Max(flowMap[p.x, p.y], v);
                        }


                    }
                }
            }

            return flowMap;
        }

        private static List<List<Vector2Int>> BreakPathByRoom(List<Vector2Int> path, int[,] roomMap)
        {
            List<List<Vector2Int>> segments = new();
            if (path.Count == 0) return segments;

            List<Vector2Int> current = new() { path[0] };
            int currentRoom = roomMap[path[0].x, path[0].y];

            for (int i = 1; i < path.Count; i++)
            {
                Vector2Int p = path[i];
                int room = roomMap[p.x, p.y];

                if (room != currentRoom)
                {
                    segments.Add(new List<Vector2Int>(current));
                    current.Clear();
                    currentRoom = room;
                }
                current.Add(p);
            }

            if (current.Count > 0)
                segments.Add(current);

            return segments;
        }

        public static HashSet<Vector2Int> GenerateForbiddenTiles(    SlopeType[,] slopeMap,    List<EdgeTile> roomEdges,    List<TerraceEdge> terraceEdges,    HashSet<Vector2Int> validRoomTransitions,    HashSet<Vector2Int> validTerraceTransitions, HashSet<Vector2Int> nonTransitionTerraceBorders)
        {
            var blocked = new HashSet<Vector2Int>();

            int width = slopeMap.GetLength(0);
            int height = slopeMap.GetLength(1);

            // 1. Steep slopes
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    if (slopeMap[x, y] == SlopeType.Steep)
                        blocked.Add(new Vector2Int(x, y));

            // 2. Block all non-transition room edges
            foreach (var edge in roomEdges)
            {
                if (edge.Type != EdgeType.Transition)
                    blocked.Add(edge.Pos);
            }

            // ✅ 3. Block all terrace edges *unless they are valid transitions*
            foreach (var edge in terraceEdges)
            {
                var pos = edge.Pos;
                if (!validTerraceTransitions.Contains(pos))
                    blocked.Add(pos); // fully block surface
            }

            foreach (var pos in nonTransitionTerraceBorders)
            {
                blocked.Add(pos);
            }


            return blocked;
        }

        public static HashSet<Vector2Int> FilterConnectedTerraceTransitions(    HashSet<Vector2Int> positions,    int width,    int height,    int minSize)
        {
            HashSet<Vector2Int> result = new();
            HashSet<Vector2Int> visited = new();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            foreach (var p in positions)
            {
                if (visited.Contains(p))
                    continue;

                List<Vector2Int> group = new();
                Queue<Vector2Int> q = new();
                q.Enqueue(p);
                visited.Add(p);

                while (q.Count > 0)
                {
                    var current = q.Dequeue();
                    group.Add(current);

                    foreach (var d in dirs)
                    {
                        Vector2Int np = current + d;
                        if (np.x < 0 || np.y < 0 || np.x >= width || np.y >= height) continue;
                        if (visited.Contains(np) || !positions.Contains(np)) continue;

                        visited.Add(np);
                        q.Enqueue(np);
                    }
                }

                if (group.Count >= minSize)
                    foreach (var pt in group)
                        result.Add(pt);
            }

            return result;
        }





        //phase 3 : room flow and role

        public static void ClassifyRoomFlow(List<RoomCore> cores, List<CoreConnection> connections)
        {
            // Count edges per core
            var connectionCount = new Dictionary<RoomCore, int>();
            foreach (var conn in connections)
            {
                if (!connectionCount.ContainsKey(conn.From))
                    connectionCount[conn.From] = 0;
                if (!connectionCount.ContainsKey(conn.To))
                    connectionCount[conn.To] = 0;

                connectionCount[conn.From]++;
                connectionCount[conn.To]++;
            }

            foreach (var core in cores)
            {
                if (core.coreType == CoreType.Dead)
                {
                    core.FlowType = RoomFlowType.Dead;
                }
                else if (!connectionCount.ContainsKey(core))
                {
                    core.FlowType = RoomFlowType.Isolated;
                }
                else
                {
                    int degree = connectionCount[core];
                    core.FlowType = degree switch
                    {
                        1 => RoomFlowType.Leaf,
                        2 => RoomFlowType.Corridor,
                        _ => RoomFlowType.Hub
                    };
                }
            }
        }

        public static List<RoomFloodGroup> FloodValidateRoom(    int roomId,    int[,] roomMap,    int[,] terraceMap,    SlopeType[,] slopeMap,    HashSet<Vector2Int> roomTransitions,    HashSet<Vector2Int> terraceTransitions,    List<RoomCore> cores,    int width,    int height)
        {
            List<RoomFloodGroup> floodGroups = new();
            Dictionary<Vector2Int, int> visited = new();
            int currentFloodId = 1;

            // Entry points for this room
            var entries = roomTransitions.Where(p => roomMap[p.x, p.y] == roomId).ToList();

            foreach (var entry in entries)
            {
                if (visited.ContainsKey(entry)) continue;

                Queue<Vector2Int> queue = new();
                RoomFloodGroup group = new RoomFloodGroup
                {
                    FloodId = currentFloodId,
                    Entry = entry
                };

                queue.Enqueue(entry);
                visited[entry] = currentFloodId;

                while (queue.Count > 0)
                {
                    var pos = queue.Dequeue();
                    group.Tiles.Add(pos);

                    // Did this flood reach a core?
                    if (cores.Any(c => c.Center == pos && c.RoomID == roomId))
                        group.ReachedCore = true;

                    foreach (var dir in new[] { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right })
                    {
                        int nx = pos.x + dir.x;
                        int ny = pos.y + dir.y;
                        var nPos = new Vector2Int(nx, ny);

                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                            continue;
                        if (visited.ContainsKey(nPos))
                        {
                            // Merge detection
                            int otherFlood = visited[nPos];
                            if (otherFlood != currentFloodId)
                                group.MergedWith.Add(otherFlood);
                            continue;
                        }

                        if (roomMap[nx, ny] != roomId)
                            continue;

                        if (slopeMap[nx, ny] == SlopeType.Steep)
                            continue;

                        // Allow only valid terrace transitions between terraces
                        int currTerr = terraceMap[pos.x, pos.y];
                        int nextTerr = terraceMap[nx, ny];
                        bool sameTerr = currTerr == nextTerr;
                        bool canTransit = terraceTransitions.Contains(nPos);

                        if (sameTerr || canTransit)
                        {
                            visited[nPos] = currentFloodId;
                            queue.Enqueue(nPos);
                        }
                    }
                }

                floodGroups.Add(group);
                currentFloodId++;
            }

            return floodGroups;
        }

        public static float[,] GenerateVisibilityMap_Directional(int width, int height, Vector2 cameraDir)
        {
            float[,] map = new float[width, height];
            cameraDir.Normalize();

            // Simulate camera positioned "behind" the map (relative to direction)
            Vector2 camOrigin = new Vector2(width / 2f, height / 2f) - cameraDir * Mathf.Max(width, height);

            // Project tile positions along the camera's forward direction
            float[,] projection = new float[width, height];
            float minProj = float.MaxValue;
            float maxProj = float.MinValue;

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    Vector2 pos = new Vector2(x, y);
                    float projected = Vector2.Dot(pos - camOrigin, cameraDir);

                    projection[x, y] = projected;
                    if (projected < minProj) minProj = projected;
                    if (projected > maxProj) maxProj = projected;
                }

            float range = Mathf.Max(0.0001f, maxProj - minProj);

            // Normalize and invert to get visibility (0 = far, 1 = close)
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float norm = (projection[x, y] - minProj) / range;
                    map[x, y] = 1f - norm;
                }

            return map;
        }

        public static FlowMap ComputeTrueFlowMap(    List<CoreConnection> allConnections,    float[,] visibilityMap,    int width,    int height,    float visibilityWeight = 0.3f,    bool useVisibility = true)
        {
            FlowMap map = new FlowMap(width, height);

            foreach (var conn in allConnections)
            {
                if (conn.Path == null || conn.Path.Count == 0)
                    continue;

                float weight = 1f;

                // Optional: Give shorter paths higher weight (simulate funnels)
                weight += Mathf.Max(0f, 30f - conn.Path.Count) * 0.1f;

                foreach (var pos in conn.Path)
                {
                    if (pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= height)
                        continue;

                    map.RawFlow[pos.x, pos.y] += weight;
                }

            }

            // Step 2: Apply visibility weight as a blend (not multiplier!)
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float raw = map.RawFlow[x, y];
                    float vis = useVisibility ? Mathf.Clamp01(visibilityMap[x, y]) : 1f;

                    map.WeightedFlow[x, y] = raw * Mathf.Lerp(1f, vis, visibilityWeight);
                }

            // Step 3: Normalize
            float min = float.MaxValue, max = float.MinValue;
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float v = map.WeightedFlow[x, y];
                    if (v < min) min = v;
                    if (v > max) max = v;
                }

            float range = Mathf.Max(0.0001f, max - min);
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    map.NormalizedFlow[x, y] = (map.WeightedFlow[x, y] - min) / range;

            return map;
        }

        public static float[,] GenerateVisibilityMap_TerrainOcclusion(    int[,] terraceMap,    SlopeType[,] slopeMap,    int width,    int height,    Vector2 cameraDir,    int maxSteps = 20,    int stepSpacing = 1)
        {
            float[,] visibility = new float[width, height];
            cameraDir.Normalize();

            Vector2 lightDir = -cameraDir; // light travels *into* the scene

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    if (terraceMap[x, y] <= 0)
                    {
                        visibility[x, y] = 0f; // void or unreachable
                        continue;
                    }

                    bool blocked = false;
                    int currTerrace = terraceMap[x, y];

                    // March BACKWARDS along light ray to see if anything blocks us
                    for (int step = 1; step <= maxSteps; step++)
                    {
                        Vector2 origin = new Vector2(x + 0.5f, y + 0.5f);
                        Vector2 probe = origin + lightDir * (step * stepSpacing);
                        int px = Mathf.FloorToInt(probe.x);
                        int py = Mathf.FloorToInt(probe.y);

                        if (px < 0 || py < 0 || px >= width || py >= height)
                            break;

                        if (terraceMap[px, py] <= 0 || terraceMap[x, y] <= 0)
                            continue;

                        if (slopeMap[px, py] == SlopeType.Steep)
                        {
                            blocked = true;
                            break;
                        }

                        int probeTerrace = terraceMap[px, py];
                        if (probeTerrace > currTerrace)
                        {
                            blocked = true;
                            break;
                        }
                    }

                    visibility[x, y] = blocked ? 1f : 0f;
                }

            return visibility;
        }

        public static float[,] GenerateVisibilityMap_SlopeTerrace(    SlopeType[,] slopeMap,    int[,] terraceMap,    Vector2 cameraDir,    int width,    int height,    int shadowLength = 6)
        {
            float[,] vis = new float[width, height];
            cameraDir.Normalize();

            Vector2Int[] shadowDirs = {
            new Vector2Int(Mathf.RoundToInt(cameraDir.x), Mathf.RoundToInt(cameraDir.y)),
            new Vector2Int(Mathf.RoundToInt(cameraDir.x * 0.7f), Mathf.RoundToInt(cameraDir.y * 0.7f))
            };

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    bool isOccluder = slopeMap[x, y] == SlopeType.Steep;

                    // Optional: terrace occlusion if higher than adjacent
                    foreach (var dir in shadowDirs)
                    {
                        int tx = x + dir.x;
                        int ty = y + dir.y;
                        if (tx < 0 || ty < 0 || tx >= width || ty >= height) continue;
                        if (terraceMap[tx, ty] > terraceMap[x, y])
                            isOccluder = true;
                    }

                    if (!isOccluder) continue;

                    // Cast shadow behind occluder
                    for (int i = 1; i <= shadowLength; i++)
                    {
                        int sx = x + Mathf.RoundToInt(cameraDir.x * i);
                        int sy = y + Mathf.RoundToInt(cameraDir.y * i);
                        if (sx < 0 || sy < 0 || sx >= width || sy >= height) break;

                        float strength = 1f - (i / (float)shadowLength);
                        vis[sx, sy] = Mathf.Max(vis[sx, sy], strength); // max fade
                    }
                }

            return vis;
        }

        public static float[,] GenerateVisibilityMap_TerraceOnly(    int[,] terraceMap,    Vector2 cameraDir,    int width,    int height,    int shadowLength = 6)
        {
            float[,] vis = new float[width, height];
            cameraDir.Normalize();

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    int currentTerrace = terraceMap[x, y];
                    if (currentTerrace <= 0) continue;

                    // If neighbor in light direction has *lower* terrace, we're standing on a ledge
                    int lx = x + Mathf.RoundToInt(cameraDir.x);
                    int ly = y + Mathf.RoundToInt(cameraDir.y);

                    if (lx < 0 || ly < 0 || lx >= width || ly >= height)
                        continue;

                    int neighborTerrace = terraceMap[lx, ly];
                    if (neighborTerrace < currentTerrace)
                    {
                        // This tile is the top of a terrace drop — it should cast shadow
                        for (int step = 1; step <= shadowLength; step++)
                        {
                            int sx = x + Mathf.RoundToInt(cameraDir.x * step);
                            int sy = y + Mathf.RoundToInt(cameraDir.y * step);
                            if (sx < 0 || sy < 0 || sx >= width || sy >= height) break;

                            float strength = 1f - (step / (float)shadowLength);
                            vis[sx, sy] = Mathf.Max(vis[sx, sy], strength);
                        }
                    }
                }

            return vis;
        }

        //phase 1: seed pruning
        public static float[,] AccumulatePathFlows(List<CoreConnection> connections, int width, int height, float decayFactor = 0.9f)
        {
            float[,] flowMap = new float[width, height];

            foreach (var conn in connections)
            {
                float weight = 1f;
                foreach (var p in conn.Path)
                {
                    flowMap[p.x, p.y] += weight;
                    weight *= decayFactor; // reduce weight as we walk farther from origin
                }
            }

            return flowMap;
        }

        public static List<Vector2Int> DetectPlatformCores(    float[,] flowMap,    HashSet<Vector2Int> forbidden,    int width,    int height,    float minFlow = 0.8f,    int minSpacing = 6,    int maxCandidates = 20)
        {
            List<Vector2Int> candidates = new();

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    Vector2Int p = new(x, y);
                    if (forbidden.Contains(p)) continue;
                    if (flowMap[x, y] < minFlow) continue;

                    bool tooClose = candidates.Any(c => Vector2Int.Distance(c, p) < minSpacing);
                    if (!tooClose)
                        candidates.Add(p);
                }
            }

            // Sort by flow strength and pick top-N
            var sorted = candidates
                .OrderByDescending(p => flowMap[p.x, p.y])
                .Take(maxCandidates)
                .ToList();

            return sorted;
        }

        public static List<PlatformRegion> FloodPlatformRegions(    List<Vector2Int> seeds,    int[,] roomMap,    int[,] terraceMap,    SlopeType[,] slopeMap,    float[,] flowMap,    float[,] visibilityMap,    HashSet<Vector2Int> forbidden,    int width,    int height)
        {
            List<PlatformRegion> regions = new();
            HashSet<Vector2Int> visited = new();
            int idCounter = 1;
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            foreach (var origin in seeds)
            {
                if (visited.Contains(origin)) continue;

                int room = roomMap[origin.x, origin.y];
                int terr = terraceMap[origin.x, origin.y];
                if (room <= 0 || forbidden.Contains(origin)) continue;

                Queue<Vector2Int> queue = new();
                PlatformRegion region = new()
                {
                    Id = idCounter++,
                    Origin = origin,
                    RoomId = room,
                    TerraceId = terr
                };

                queue.Enqueue(origin);
                visited.Add(origin);

                while (queue.Count > 0)
                {
                    var p = queue.Dequeue();
                    region.Tiles.Add(p);

                    foreach (var d in dirs)
                    {
                        Vector2Int np = p + d;
                        if (np.x < 0 || np.y < 0 || np.x >= width || np.y >= height) continue;
                        if (visited.Contains(np)) continue;
                        if (roomMap[np.x, np.y] != room) continue;
                        if (terraceMap[np.x, np.y] != terr) continue;
                        if (slopeMap[np.x, np.y] == SlopeType.Steep) continue;
                        if (forbidden.Contains(np)) continue;

                        visited.Add(np);
                        queue.Enqueue(np);
                    }
                }

                if (region.Tiles.Count >= 10)
                {
                    region.AvgFlow = region.Tiles.Average(p => flowMap[p.x, p.y]);
                    region.AvgVisibility = region.Tiles.Average(p => visibilityMap[p.x, p.y]);
                    regions.Add(region);
                }
            }

            return regions;
        }

        public static List<Vector2Int> DetectPeakSeeds(float[,] flowMap, int width, int height, float threshold = 0.9f, int minDistance = 4)
        {
            List<Vector2Int> seeds = new();
            float[,] copy = (float[,])flowMap.Clone();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    float v = copy[x, y];
                    if (v < threshold) continue;

                    bool isPeak = true;
                    foreach (var d in dirs)
                    {
                        if (flowMap[x + d.x, y + d.y] > v)
                        {
                            isPeak = false;
                            break;
                        }
                    }

                    if (isPeak)
                    {
                        Vector2Int peak = new(x, y);

                        // Keep only distant seeds
                        if (seeds.All(s => Vector2Int.Distance(s, peak) >= minDistance))
                        {
                            seeds.Add(peak);
                        }
                    }
                }
            }

            return seeds;
        }

        public static List<PlatformBlob> GrowPlatformBlobs(float[,] flowMap, List<Vector2Int> seeds, int width, int height, float growThreshold = 0.5f)
        {
            int[,] labelMap = new int[width, height];
            int id = 1;
            List<PlatformBlob> blobs = new();

            foreach (var seed in seeds)
            {
                if (labelMap[seed.x, seed.y] > 0) continue;

                Queue<Vector2Int> q = new();
                q.Enqueue(seed);
                labelMap[seed.x, seed.y] = id;

                PlatformBlob blob = new() { ID = id, Core = seed };
                blob.Tiles.Add(seed);
                blob.TotalStrength += flowMap[seed.x, seed.y];

                while (q.Count > 0)
                {
                    var p = q.Dequeue();
                    foreach (var d in new[] { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right })
                    {
                        Vector2Int np = p + d;
                        if (np.x < 0 || np.y < 0 || np.x >= width || np.y >= height) continue;
                        if (labelMap[np.x, np.y] > 0) continue;
                        if (flowMap[np.x, np.y] < growThreshold) continue;

                        labelMap[np.x, np.y] = id;
                        blob.Tiles.Add(np);
                        blob.TotalStrength += flowMap[np.x, np.y];
                        q.Enqueue(np);
                    }
                }

                blobs.Add(blob);
                id++;
            }

            return blobs;
        }

        public static List<PlatformBlob> MergeSmallBlobs(List<PlatformBlob> blobs, int minSize = 40)
        {
            List<PlatformBlob> result = new(blobs.Where(b => b.Tiles.Count >= minSize));
            var small = blobs.Where(b => b.Tiles.Count < minSize).ToList();

            foreach (var blob in small)
            {
                PlatformBlob bestTarget = null;
                float bestScore = float.MinValue;

                foreach (var candidate in result)
                {
                    float dist = Vector2Int.Distance(blob.Core, candidate.Core);
                    float score = candidate.Tiles.Count / (dist + 1); // Prefer big & nearby

                    if (score > bestScore)
                    {
                        bestScore = score;
                        bestTarget = candidate;
                    }
                }

                if (bestTarget != null)
                {
                    bestTarget.Tiles.AddRange(blob.Tiles);
                }
            }

            return result;
        }

        public static List<PlatformSeed> FloodPlatformBlobSeedsFromSubsegments(    int[,] roomMap,    int[,] terraceMap,    Dictionary<(int roomId, int terraceId), List<Vector2Int>> validSubsegments,    int minSurface = 20)
        {
            int width = roomMap.GetLength(0);
            int height = roomMap.GetLength(1);
            bool[,] visited = new bool[width, height];

            List<PlatformSeed> seeds = new();

            foreach (var kvp in validSubsegments)
            {
                var blob = new List<Vector2Int>();
                foreach (var p in kvp.Value)
                {
                    if (visited[p.x, p.y]) continue;
                    visited[p.x, p.y] = true;
                    blob.Add(p);
                }

                if (blob.Count >= minSurface)
                {
                    Vector2 avg = Vector2.zero;
                    foreach (var pt in blob) avg += pt;
                    avg /= blob.Count;

                    seeds.Add(new PlatformSeed
                    {
                        RoomId = kvp.Key.roomId,
                        TerraceId = kvp.Key.terraceId,
                        Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
                        Tiles = blob,
                        Area = blob.Count,
                        Score = blob.Count
                    });
                }
            }

            return seeds;
        }

        public static (Dictionary<(int roomId, int terraceId), List<Vector2Int>> fullSubsegments,               Dictionary<(int roomId, int terraceId), HashSet<Vector2Int>> touchedByPath)
        ExtractAndClassifySubsegments(float[,] flowMap, int[,] roomMap, int[,] terraceMap, float flowThreshold = 0.001f)
        {
            int width = roomMap.GetLength(0);
            int height = roomMap.GetLength(1);

            var fullSegments = new Dictionary<(int, int), List<Vector2Int>>();
            var touchedSegments = new Dictionary<(int, int), HashSet<Vector2Int>>();

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    int roomId = roomMap[x, y];
                    int terraceId = terraceMap[x, y];

                    if (roomId <= 0) continue;
                    var key = (roomId, terraceId);
                    var pos = new Vector2Int(x, y);

                    if (!fullSegments.ContainsKey(key))
                        fullSegments[key] = new List<Vector2Int>();
                    fullSegments[key].Add(pos);

                    if (flowMap[x, y] >= flowThreshold)
                    {
                        if (!touchedSegments.ContainsKey(key))
                            touchedSegments[key] = new HashSet<Vector2Int>();
                        touchedSegments[key].Add(pos);
                    }
                }
            }

            return (fullSegments, touchedSegments);
        }



        //public static List<PlatformSeed> FloodPlatformBlobSeedsFromUntouchedSubsegments(Dictionary<(int roomId, int terraceId), List<Vector2Int>> fullSubsegments, Dictionary<(int roomId, int terraceId), List<Vector2Int>> prunedSubsegmentsUsedByFlow, Dictionary<(int roomId, int terraceId), HashSet<Vector2Int>> originalTouched, int minSurface = 6)
        //{
        //    List<PlatformSeed> seeds = new();

        //    foreach (var kvp in fullSubsegments)
        //    {
        //        var key = kvp.Key;

        //        // Skip segments already used by pruned flow
        //        if (prunedSubsegmentsUsedByFlow.ContainsKey(key))
        //            continue;

        //        // Optional: If originally untouched by the path, that's fine
        //        // But we don't strictly need to check `originalTouched` anymore.

        //        var tiles = kvp.Value;

        //        Debug.Log($"[ROOM SEED] Subsegment {key} has {tiles.Count} tiles");

        //        var blobs = FloodBlobSubclusters(tiles, minSurface);
        //        Debug.Log($" -> {blobs.Count} valid blobs found");

        //        foreach (var blob in blobs)
        //        {
        //            Vector2 avg = Vector2.zero;
        //            foreach (var p in blob)
        //                avg += p;
        //            avg /= blob.Count;

        //            seeds.Add(new PlatformSeed
        //            {
        //                RoomId = key.roomId,
        //                TerraceId = key.terraceId,
        //                Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
        //                Tiles = blob,
        //                Area = blob.Count,
        //                Score = blob.Count
        //            });
        //        }
        //    }

        //    return seeds;
        //}

        public static (List<PlatformSeed> seeds, List<(int roomId, int terraceId)> discarded) FloodPlatformBlobSeedsFromUntouchedSubsegments(    Dictionary<(int roomId, int terraceId), List<Vector2Int>> fullSubsegments,    Dictionary<(int roomId, int terraceId), List<Vector2Int>> prunedSubsegmentsUsedByFlow,    Dictionary<(int roomId, int terraceId), HashSet<Vector2Int>> originalTouched,    int minSurface = 6)
        {
            List<PlatformSeed> seeds = new();
            List<(int roomId, int terraceId)> discarded = new();

            foreach (var kvp in fullSubsegments)
            {
                var key = kvp.Key;

                if (prunedSubsegmentsUsedByFlow.ContainsKey(key))
                    continue;

                var tiles = kvp.Value;
                var blobs = FloodBlobSubclusters(tiles, minSurface: 1); // start with 1 to gather everything
                bool foundValidBlob = false;

                foreach (var blob in blobs)
                {
                    if (blob.Count < minSurface)
                        continue;

                    foundValidBlob = true;

                    Vector2 avg = Vector2.zero;
                    foreach (var p in blob)
                        avg += p;
                    avg /= blob.Count;

                    seeds.Add(new PlatformSeed
                    {
                        RoomId = key.roomId,
                        TerraceId = key.terraceId,
                        Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
                        Tiles = blob,
                        Area = blob.Count,
                        Score = blob.Count
                    });
                }

                if (!foundValidBlob)
                {
                    discarded.Add(key);
                    Debug.Log($"[DISCARDED ROOM SEED] Subsegment {key} had no blob above minSurface {minSurface}");
                }
            }

            return (seeds, discarded);
        }

        public static List<List<Vector2Int>> FloodBlobSubclusters(    List<Vector2Int> tiles,    int minSurface = 6)
        {
            List<List<Vector2Int>> blobs = new();
            HashSet<Vector2Int> visited = new();
            HashSet<Vector2Int> tileSet = new(tiles);
            Vector2Int[] dirs = {
        Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right
    };

            foreach (var start in tiles)
            {
                if (visited.Contains(start)) continue;

                List<Vector2Int> blob = new();
                Queue<Vector2Int> q = new();
                q.Enqueue(start);
                visited.Add(start);

                while (q.Count > 0)
                {
                    var current = q.Dequeue();
                    blob.Add(current);

                    foreach (var d in dirs)
                    {
                        var next = current + d;
                        if (tileSet.Contains(next) && !visited.Contains(next))
                        {
                            visited.Add(next);
                            q.Enqueue(next);
                        }
                    }
                }

                if (blob.Count >= minSurface)
                    blobs.Add(blob);
            }

            return blobs;
        }

        public static List<PlatformBlob> DetectPlatformBlobs(bool[,] platformMask, float[,] flowMap, int width, int height, int minBlobSize = 12)
        {
            bool[,] visited = new bool[width, height];
            List<PlatformBlob> blobs = new();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (visited[x, y] || !platformMask[x, y])
                        continue;

                    List<Vector2Int> blobTiles = new();
                    Queue<Vector2Int> queue = new();
                    queue.Enqueue(new Vector2Int(x, y));
                    visited[x, y] = true;

                    while (queue.Count > 0)
                    {
                        var current = queue.Dequeue();
                        blobTiles.Add(current);

                        foreach (var d in dirs)
                        {
                            int nx = current.x + d.x;
                            int ny = current.y + d.y;
                            if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                                continue;
                            if (visited[nx, ny] || !platformMask[nx, ny])
                                continue;

                            visited[nx, ny] = true;
                            queue.Enqueue(new Vector2Int(nx, ny));
                        }
                    }

                    if (blobTiles.Count >= minBlobSize)
                    {
                        // Choose the brightest tile in the blob as the core
                        var core = blobTiles.OrderByDescending(p => flowMap[p.x, p.y]).First();
                        blobs.Add(new PlatformBlob { Tiles = blobTiles, Core = core });
                    }
                }
            }

            return blobs;
        }

        public static bool[,] ThresholdFlowMap(float[,] flowMap, float threshold)
        {
            int width = flowMap.GetLength(0);
            int height = flowMap.GetLength(1);
            bool[,] mask = new bool[width, height];

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    mask[x, y] = flowMap[x, y] >= threshold;

            return mask;
        }
        


        //phase 2: flood seeds
        public static List<PlatformSeed> FindPlatformBlobSeeds(    int[,] roomMap,    int[,] terraceMap,    float[,] flowMap,    float threshold = 0.25f,    int minSurface = 20)
        {
            int width = roomMap.GetLength(0);
            int height = roomMap.GetLength(1);
            bool[,] visited = new bool[width, height];

            List<PlatformSeed> seeds = new();

            Vector2Int[] directions = {
                Vector2Int.up,
                Vector2Int.down,
                Vector2Int.left,
                Vector2Int.right
            };

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (visited[x, y]) continue;
                    if (flowMap[x, y] < threshold) continue;

                    int roomId = roomMap[x, y];
                    int terraceId = terraceMap[x, y];
                    if (roomId <= 0) continue;

                    Queue<Vector2Int> queue = new();
                    List<Vector2Int> blob = new();

                    queue.Enqueue(new Vector2Int(x, y));
                    visited[x, y] = true;

                    while (queue.Count > 0)
                    {
                        Vector2Int current = queue.Dequeue();
                        blob.Add(current);

                        foreach (var d in directions)
                        {
                            Vector2Int next = current + d;
                            if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
                            if (visited[next.x, next.y]) continue;
                            if (flowMap[next.x, next.y] < threshold) continue;
                            if (roomMap[next.x, next.y] != roomId) continue;
                            if (terraceMap[next.x, next.y] != terraceId) continue;

                            queue.Enqueue(next);
                            visited[next.x, next.y] = true;
                        }
                    }

                    if (blob.Count >= minSurface)
                    {
                        Vector2 avg = Vector2.zero;
                        foreach (var p in blob)
                            avg += p;
                        avg /= blob.Count;

                        seeds.Add(new PlatformSeed
                        {
                            RoomId = roomId,
                            TerraceId = terraceId,
                            Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
                            Tiles = blob,
                            Area = blob.Count,
                            Score = blob.Count
                        });
                    }
                }
            }

            return seeds;
        }
        
        public static (float[,] flowMap, float[,] thicknessMap) GenerateRoomAwareWidenedFlowMapPlatformVer(    List<CoreConnection> corePaths,    int[,] roomMap,    HashSet<Vector2Int> forbidden,    int width,    int height,    int maxHalfWidth = 6)
        {
            float[,] flowMap = new float[width, height];
            float[,] thicknessMap = new float[width, height];

            foreach (var connection in corePaths)
            {
                var path = connection.Path;
                if (path.Count < 2) continue;

                // Step 1: Break into sub-segments by room
                List<List<Vector2Int>> subSegments = BreakPathByRoom(path, roomMap);

                foreach (var sub in subSegments)
                {
                    if (sub.Count < 2) continue;

                    for (int i = 1; i < sub.Count; i++)
                    {
                        Vector2Int a = sub[i - 1];
                        Vector2Int b = sub[i];
                        Vector2 dir = (b - a);
                        Vector2 normal = new Vector2(-dir.y, dir.x).normalized;

                        // Always mark center path tile
                        if (!forbidden.Contains(b))
                        {
                            flowMap[b.x, b.y] = 1f;
                            thicknessMap[b.x, b.y] = Mathf.Max(thicknessMap[b.x, b.y], 1f);
                        }

                        // Calculate max safe expansion on both sides
                        int localRadius = maxHalfWidth;
                        for (int side = -1; side <= 1; side += 2)
                        {
                            int radius = 0;
                            for (int r = 1; r <= maxHalfWidth; r++)
                            {
                                Vector2 offset = b + normal * r * side;
                                Vector2Int test = new Vector2Int(Mathf.RoundToInt(offset.x), Mathf.RoundToInt(offset.y));

                                if (test.x < 0 || test.y < 0 || test.x >= width || test.y >= height)
                                    break;
                                if (forbidden.Contains(test))
                                    break;

                                radius++;
                            }

                            localRadius = Mathf.Min(localRadius, radius);
                        }

                        // Paint both sides of the band with a falloff
                        for (int side = -1; side <= 1; side += 2)
                        {
                            for (int r = 1; r <= localRadius; r++)
                            {
                                Vector2 offset = b + normal * r * side;
                                Vector2Int p = new Vector2Int(Mathf.RoundToInt(offset.x), Mathf.RoundToInt(offset.y));

                                if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) continue;
                                if (forbidden.Contains(p)) continue;

                                float value = 1f - (r / (float)(maxHalfWidth + 1));
                                flowMap[p.x, p.y] = Mathf.Max(flowMap[p.x, p.y], value);
                                thicknessMap[p.x, p.y] = Mathf.Max(thicknessMap[p.x, p.y], r);
                            }
                        }
                    }
                }
            }

            return (flowMap, thicknessMap);
        }

        public static bool[,] PruneWidenedFlowBySegment(    List<CoreConnection> corePaths,    float[,] flowMap,    int[,] roomMap,    HashSet<Vector2Int> forbidden,    int width,    int height,    float thicknessThreshold = 0.15f)// Typical range: 0.1 to 0.2
        {
            bool[,] result = new bool[width, height];

            foreach (var conn in corePaths)
            {
                var path = conn.Path;
                if (path.Count < 2) continue;

                var subSegments = BreakPathByRoom(path, roomMap);

                foreach (var segment in subSegments)
                {
                    float maxThickness = 0f;

                    foreach (var p in segment)
                    {
                        if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)
                            continue;
                        if (forbidden.Contains(p))
                            continue;

                        maxThickness = Mathf.Max(maxThickness, flowMap[p.x, p.y]);
                    }

                    // If this segment is wide enough, keep the entire segment
                    if (maxThickness >= thicknessThreshold)
                    {
                        foreach (var p in segment)
                        {
                            if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)
                                continue;
                            if (forbidden.Contains(p))
                                continue;

                            result[p.x, p.y] = true;
                        }
                    }
                }
            }

            return result;
        }

        public static Dictionary<(int roomId, int terraceId), List<Vector2Int>> ExtractSubsegments(    float[,] hotmap, int[,] roomMap, int[,] terraceMap, float threshold = 0.001f)
        {
            int width = hotmap.GetLength(0);
            int height = hotmap.GetLength(1);
            bool[,] visited = new bool[width, height];
            var result = new Dictionary<(int, int), List<Vector2Int>>();
            var directions = new[] { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (visited[x, y] || hotmap[x, y] < threshold)
                        continue;

                    int roomId = roomMap[x, y];
                    int terrId = terraceMap[x, y];
                    var key = (roomId, terrId);
                    if (!result.ContainsKey(key))
                        result[key] = new List<Vector2Int>();

                    Queue<Vector2Int> queue = new();
                    queue.Enqueue(new(x, y));
                    visited[x, y] = true;

                    while (queue.Count > 0)
                    {
                        var p = queue.Dequeue();
                        result[key].Add(p);
                        foreach (var d in directions)
                        {
                            int nx = p.x + d.x;
                            int ny = p.y + d.y;
                            if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                                continue;
                            if (visited[nx, ny]) continue;
                            if (hotmap[nx, ny] < threshold) continue;
                            if (roomMap[nx, ny] != roomId || terraceMap[nx, ny] != terrId)
                                continue;

                            visited[nx, ny] = true;
                            queue.Enqueue(new(nx, ny));
                        }
                    }
                }
            }

            return result;
        }

        public static float[,] ComputeThicknessMap(float[,] widenedMap, int radius = 5)
        {
            int width = widenedMap.GetLength(0);
            int height = widenedMap.GetLength(1);
            float[,] result = new float[width, height];

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (widenedMap[x, y] <= 0) continue;

                    float maxR = 0;
                    for (int r = 1; r <= radius; r++)
                    {
                        bool blocked = false;
                        foreach (var dir in new[] {
                    new Vector2Int(r, 0), new Vector2Int(-r, 0),
                    new Vector2Int(0, r), new Vector2Int(0, -r) })
                        {
                            int nx = x + dir.x, ny = y + dir.y;
                            if (nx < 0 || ny < 0 || nx >= width || ny >= height || widenedMap[nx, ny] <= 0)
                                blocked = true;
                        }
                        if (!blocked) maxR = r;
                    }
                    result[x, y] = maxR;
                }
            }
            return result;
        }

        public static Dictionary<(int roomId, int terraceId), List<Vector2Int>> PruneSubsegmentsByThickness(    Dictionary<(int, int), List<Vector2Int>> subsegments, float[,] thicknessMap, float minThickness)
        {
            var result = new Dictionary<(int, int), List<Vector2Int>>();
            foreach (var kvp in subsegments)
            {
                float maxT = kvp.Value.Max(p => thicknessMap[p.x, p.y]);
                if (maxT >= minThickness)
                    result[kvp.Key] = kvp.Value;
            }
            return result;
        }

        public static float[,] ConvertSubsegmentTilesToFlowMap(    Dictionary<(int roomId, int terraceId), List<Vector2Int>> keptSegments,    int width,    int height,    float fillValue = 1f)
        {
            float[,] result = new float[width, height];

            foreach (var pair in keptSegments)
            {
                foreach (var pos in pair.Value)
                {
                    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height)
                    {
                        result[pos.x, pos.y] = fillValue;
                    }
                }
            }

            return result;
        }


        public static float[,] BinaryMaskToFloatMap(bool[,] mask, int width, int height)
        {
            float[,] result = new float[width, height];
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    result[x, y] = mask[x, y] ? 1f : 0f;
            return result;
        }

        public static bool[,] ThresholdFlowMask(float[,] flowMap, float minValue)
        {
            int width = flowMap.GetLength(0);
            int height = flowMap.GetLength(1);
            bool[,] mask = new bool[width, height];

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    mask[x, y] = flowMap[x, y] >= minValue;

            return mask;
        }

        public static bool[,] PruneWidenedFlowByPhysicalThickness(    List<CoreConnection> corePaths,    int[,] roomMap,    HashSet<Vector2Int> forbidden,    int width,    int height,    int maxAllowedHalfWidth = 6,    int minRequiredHalfWidth = 2)
        {
            bool[,] mask = new bool[width, height];

            foreach (var connection in corePaths)
            {
                var path = connection.Path;
                if (path.Count < 2) continue;

                var subSegments = BreakPathByRoom(path, roomMap);

                foreach (var segment in subSegments)
                {
                    int observedMaxHalfWidth = 0;

                    for (int i = 1; i < segment.Count; i++)
                    {
                        Vector2Int a = segment[i - 1];
                        Vector2Int b = segment[i];
                        Vector2 dir = (b - a);
                        Vector2 normal = new Vector2(-dir.y, dir.x).normalized;

                        for (int side = -1; side <= 1; side += 2)
                        {
                            int radius = 0;
                            for (int r = 1; r <= maxAllowedHalfWidth; r++)
                            {
                                Vector2 offset = b + normal * r * side;
                                Vector2Int p = new Vector2Int(Mathf.RoundToInt(offset.x), Mathf.RoundToInt(offset.y));
                                if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) break;
                                if (forbidden.Contains(p)) break;
                                radius++;
                            }

                            observedMaxHalfWidth = Mathf.Max(observedMaxHalfWidth, radius);
                        }
                    }

                    if (observedMaxHalfWidth >= minRequiredHalfWidth)
                    {
                        // ✅ This segment qualifies — keep all points
                        foreach (var p in segment)
                        {
                            if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) continue;
                            mask[p.x, p.y] = true;
                        }
                    }
                }
            }

            return mask;
        }

        public static bool[,] PruneWidenedFlowByThickness(    float[,] widenedFlowMap,    int[,] thicknessMap,    int width,    int height,    int minHalfWidthThreshold = 2)
        {
            bool[,] prunedMask = new bool[width, height];

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    int thickness = thicknessMap[x, y];
                    if (thickness >= minHalfWidthThreshold)
                    {
                        prunedMask[x, y] = true;
                    }
                }
            }

            return prunedMask;
        }

        public static float[,] MaskFlowMapBySubsegments(    float[,] flowMap,    int[,] roomMap,    int[,] terraceMap,    Dictionary<(int roomId, int terraceId), List<Vector2Int>> validSegments)
        {
            int width = flowMap.GetLength(0);
            int height = flowMap.GetLength(1);
            float[,] masked = new float[width, height];

            foreach (var kvp in validSegments)
            {
                foreach (var p in kvp.Value)
                {
                    masked[p.x, p.y] = flowMap[p.x, p.y];
                }
            }

            return masked;
        }

        public static List<PlatformSeed> DetectPlatformSeeds(    int[,] roomMap,    int[,] terraceMap,    bool[,] prunedWidenedMask,    List<RoomCore> cores,    float minVisibility = 0.2f)
        {
            int width = roomMap.GetLength(0);
            int height = roomMap.GetLength(1);

            var result = new List<PlatformSeed>();
            var visited = new bool[width, height];
            var subSegmentDict = new Dictionary<(int room, int terrace), List<Vector2Int>>();

            // Step 1: Group tiles by (room, terrace)
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    int room = roomMap[x, y];
                    int terr = terraceMap[x, y];
                    if (room <= 0 || terr < 0) continue;

                    var key = (room, terr);
                    if (!subSegmentDict.ContainsKey(key))
                        subSegmentDict[key] = new List<Vector2Int>();

                    subSegmentDict[key].Add(new Vector2Int(x, y));
                }
            }

            // Step 2: Exclude segments touched by widened path mask
            foreach (var kvp in subSegmentDict)
            {
                var segment = kvp.Value;
                bool isTouchedByPath = segment.Any(p => prunedWidenedMask[p.x, p.y]);

                if (isTouchedByPath)
                    continue;

                // Step 3: Seed platform from highest visibility point within segment
                var unvisitedTiles = segment.Where(p => !visited[p.x, p.y]).ToList();
                if (unvisitedTiles.Count == 0) continue;

                // Find a central seed (could be randomized, currently just the first one)
                var seed = unvisitedTiles[0];
                var group = new List<Vector2Int>();
                var q = new Queue<Vector2Int>();
                q.Enqueue(seed);
                visited[seed.x, seed.y] = true;

                while (q.Count > 0)
                {
                    var p = q.Dequeue();
                    group.Add(p);

                    foreach (var d in new[] { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right })
                    {
                        var np = p + d;
                        if (np.x < 0 || np.y < 0 || np.x >= width || np.y >= height)
                            continue;
                        if (visited[np.x, np.y]) continue;
                        if (!segment.Contains(np)) continue;

                        visited[np.x, np.y] = true;
                        q.Enqueue(np);
                    }
                }

                if (group.Count >= 8) // Size threshold
                {
                    result.Add(new PlatformSeed
                    {
                        Center = seed,
                        RoomId = kvp.Key.room,
                        TerraceId = kvp.Key.terrace,
                        Area = group.Count,
                        Tiles = group
                    });
                }
            }

            return result;
        }



        //phase 3: visibility trim
        public static float[,] TrimSmallVisibilityRegions(float[,] slopeShadowMap, float threshold = 0.1f, int minSize = 10)
        {
            int width = slopeShadowMap.GetLength(0);
            int height = slopeShadowMap.GetLength(1);
            bool[,] visited = new bool[width, height];
            float[,] result = new float[width, height];
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (visited[x, y] || slopeShadowMap[x, y] < threshold)
                        continue;

                    // BFS to find the region
                    List<Vector2Int> region = new();
                    Queue<Vector2Int> q = new();
                    q.Enqueue(new Vector2Int(x, y));
                    visited[x, y] = true;

                    while (q.Count > 0)
                    {
                        var pos = q.Dequeue();
                        region.Add(pos);

                        foreach (var d in dirs)
                        {
                            int nx = pos.x + d.x;
                            int ny = pos.y + d.y;
                            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                            if (visited[nx, ny]) continue;
                            if (slopeShadowMap[nx, ny] < threshold) continue;

                            visited[nx, ny] = true;
                            q.Enqueue(new Vector2Int(nx, ny));
                        }
                    }

                    // If region is big enough, keep it
                    if (region.Count >= minSize)
                    {
                        foreach (var p in region)
                            result[p.x, p.y] = slopeShadowMap[p.x, p.y];
                    }
                }
            }

            return result;
        }

        //    public static List<PlatformSeed> TrimAndPadPlatforms(    List<PlatformSeed> seeds,    float[,] visibilityMap,    float visibilityThreshold = 0.25f,    int erosionRadius = 1)
        //    {
        //        int width = visibilityMap.GetLength(0);
        //        int height = visibilityMap.GetLength(1);
        //        List<PlatformSeed> result = new();
        //        Vector2Int[] dirs = {
        //    Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right
        //};

        //        foreach (var seed in seeds)
        //        {
        //            // Step 1: Visibility trim
        //            HashSet<Vector2Int> initial = new();
        //            foreach (var p in seed.Tiles)
        //            {
        //                if (p.x >= 0 && p.y >= 0 && p.x < width && p.y < height &&
        //                    visibilityMap[p.x, p.y] >= visibilityThreshold)
        //                {
        //                    initial.Add(p);
        //                }
        //            }

        //            if (initial.Count == 0) continue;

        //            // Step 2: Apply erosion by removing edge layers
        //            HashSet<Vector2Int> eroded = new(initial);
        //            for (int iter = 0; iter < erosionRadius; iter++)
        //            {
        //                HashSet<Vector2Int> toRemove = new();
        //                foreach (var p in eroded)
        //                {
        //                    foreach (var d in dirs)
        //                    {
        //                        Vector2Int neighbor = p + d;
        //                        if (!eroded.Contains(neighbor))
        //                        {
        //                            toRemove.Add(p);
        //                            break;
        //                        }
        //                    }
        //                }
        //                eroded.ExceptWith(toRemove);

        //                // Stop early if too much erosion
        //                if (eroded.Count < 4)
        //                    break;
        //            }

        //            if (eroded.Count >= 4)
        //            {
        //                Vector2 avg = Vector2.zero;
        //                foreach (var p in eroded)
        //                    avg += p;
        //                avg /= eroded.Count;

        //                result.Add(new PlatformSeed
        //                {
        //                    RoomId = seed.RoomId,
        //                    TerraceId = seed.TerraceId,
        //                    Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
        //                    Tiles = eroded.ToList(),
        //                    Area = eroded.Count,
        //                    Score = eroded.Count
        //                });
        //            }
        //        }

        //        return result;
        //    }




        //drawing functions

        //public static List<PlatformSeed> TrimPlatformSeedsByVisibility(    List<PlatformSeed> seeds,    float[,] visibilityMap,    float visibilityThreshold = 0.2f,    int erosionIterations = 1)
        //{
        //    int width = visibilityMap.GetLength(0);
        //    int height = visibilityMap.GetLength(1);
        //    Vector2Int[] dirs = {
        //    Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right
        //    };

        //    List<PlatformSeed> result = new();

        //    foreach (var seed in seeds)
        //    {
        //        bool[,] mask = new bool[width, height];
        //        foreach (var p in seed.Tiles)
        //        {
        //            if (p.x >= 0 && p.y >= 0 && p.x < width && p.y < height &&
        //                visibilityMap[p.x, p.y] >= visibilityThreshold)
        //            {
        //                mask[p.x, p.y] = true;
        //            }
        //        }

        //        // Erode
        //        bool[,] eroded = (bool[,])mask.Clone();
        //        for (int step = 0; step < erosionIterations; step++)
        //        {
        //            bool[,] next = (bool[,])eroded.Clone();

        //            for (int x = 0; x < width; x++)
        //            {
        //                for (int y = 0; y < height; y++)
        //                {
        //                    if (!eroded[x, y]) continue;

        //                    foreach (var d in dirs)
        //                    {
        //                        int nx = x + d.x;
        //                        int ny = y + d.y;
        //                        if (nx < 0 || ny < 0 || nx >= width || ny >= height || !eroded[nx, ny])
        //                        {
        //                            next[x, y] = false;
        //                            break;
        //                        }
        //                    }
        //                }
        //            }

        //            eroded = next;
        //        }

        //        // Extract retained + trimmed
        //        List<Vector2Int> kept = new();
        //        List<Vector2Int> trimmed = new();

        //        foreach (var p in seed.Tiles)
        //        {
        //            if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) continue;

        //            if (!eroded[p.x, p.y])
        //                kept.Add(p);
        //            else
        //                trimmed.Add(p);
        //        }

        //        if (kept.Count == 0) continue;

        //        Vector2 avg = Vector2.zero;
        //        foreach (var p in kept)
        //            avg += p;
        //        avg /= kept.Count;

        //        result.Add(new PlatformSeed
        //        {
        //            RoomId = seed.RoomId,
        //            TerraceId = seed.TerraceId,
        //            Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
        //            Tiles = kept,
        //            TrimmedTiles = trimmed,
        //            Area = kept.Count,
        //            Score = kept.Count
        //        });
        //    }

        //    return result;
        //}

        public static List<PlatformSeed> TrimPlatformSeeds_VisibilityAndPadding(    List<PlatformSeed> seeds,    float[,] visibilityMap,    int[,] roomMap,    int[,] terraceMap,    float visibilityThreshold = 0.3f,    int padding = 2)
        {
            int width = visibilityMap.GetLength(0);
            int height = visibilityMap.GetLength(1);
            HashSet<Vector2Int> globalUsed = new(); // avoid overlapping

            List<PlatformSeed> trimmed = new();

            foreach (var seed in seeds)
            {
                HashSet<Vector2Int> platformTiles = new(seed.Tiles);

                // Step 1: Erode based on visibility
                HashSet<Vector2Int> keepVis = new();
                foreach (var p in platformTiles)
                {
                    float vis = visibilityMap[p.x, p.y];
                    if (vis >= visibilityThreshold)
                        keepVis.Add(p);
                }

                // Step 2: Apply edge padding
                HashSet<Vector2Int> keepPadded = new(keepVis);
                foreach (var p in keepVis)
                {
                    for (int dx = -padding; dx <= padding; dx++)
                    {
                        for (int dy = -padding; dy <= padding; dy++)
                        {
                            Vector2Int n = new(p.x + dx, p.y + dy);
                            if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue;
                            if (!keepVis.Contains(n)) continue;
                            if (roomMap[n.x, n.y] != seed.RoomId || terraceMap[n.x, n.y] != seed.TerraceId)
                                keepPadded.Remove(p);
                        }
                    }
                }

                var finalTiles = keepPadded.Where(p => !globalUsed.Contains(p)).ToList();
                

                if (finalTiles.Count > 0 )
                {
                    var fullTiles = platformTiles;
                    foreach (var tile in finalTiles)
                    {
                        if(fullTiles.Contains(tile))
                            fullTiles.Remove(tile);
                    }

                    Vector2 avg = Vector2.zero;
                    foreach (var p in platformTiles)
                    {
                        avg += p;
                        globalUsed.Add(p);
                    }
                    avg /= finalTiles.Count;

                    trimmed.Add(new PlatformSeed
                    {
                        RoomId = seed.RoomId,
                        TerraceId = seed.TerraceId,
                        Tiles = fullTiles.ToList(),
                        Center = new Vector2Int(Mathf.RoundToInt(avg.x), Mathf.RoundToInt(avg.y)),
                        Area = fullTiles.Count,
                        Score = fullTiles.Count,
                        TrimmedTiles = finalTiles
                    });
                }
            }

            return trimmed;
        }


        public static bool[,] SmoothPlatformEdges(bool[,] input, int iterations = 1)
        {
            int width = input.GetLength(0);
            int height = input.GetLength(1);
            bool[,] result = (bool[,])input.Clone();

            for (int iter = 0; iter < iterations; iter++)
            {
                // Erosion
                bool[,] eroded = new bool[width, height];
                for (int x = 1; x < width - 1; x++)
                {
                    for (int y = 1; y < height - 1; y++)
                    {
                        if (result[x, y] &&
                            result[x - 1, y] && result[x + 1, y] &&
                            result[x, y - 1] && result[x, y + 1])
                        {
                            eroded[x, y] = true;
                        }
                    }
                }

                // Dilation
                bool[,] dilated = new bool[width, height];
                for (int x = 1; x < width - 1; x++)
                {
                    for (int y = 1; y < height - 1; y++)
                    {
                        if (eroded[x, y] ||
                            eroded[x - 1, y] || eroded[x + 1, y] ||
                            eroded[x, y - 1] || eroded[x, y + 1])
                        {
                            dilated[x, y] = true;
                        }
                    }
                }

                result = dilated;
            }

            return result;
        }

        public static void ApplyJaggedEdgeSmoothing(List<PlatformSeed> seeds, int width, int height)
        {
            foreach (var seed in seeds)
            {
                var platformSet = new HashSet<Vector2Int>(seed.Tiles);
                var trimmed = new HashSet<Vector2Int>();
                Vector2Int[] dirs = {
                Vector2Int.up, Vector2Int.down,
                Vector2Int.left, Vector2Int.right
                };

                foreach (var tile in seed.Tiles)
                {
                    int neighbors = 0;
                    foreach (var dir in dirs)
                    {
                        var check = tile + dir;
                        if (check.x < 0 || check.y < 0 || check.x >= width || check.y >= height) continue;
                        if (platformSet.Contains(check)) neighbors++;
                    }

                    // Remove edge tiles with only 0 or 1 neighbor
                    if (neighbors <= 1)
                        trimmed.Add(tile);
                }

                // Update platform tiles
                seed.TrimmedTiles.AddRange(trimmed);
                seed.Tiles = seed.Tiles.Where(t => !trimmed.Contains(t)).ToList();
                seed.Area = seed.Tiles.Count;
            }
        }

        //public static void CompressRoomSeed(    PlatformSeed seed,    float[,] visibilityMap,    float visibilityThreshold = 0.2f,    float centerWeight = 0.4f)
        //{
        //    var retained = new List<Vector2Int>();
        //    var trimmed = new List<Vector2Int>();

        //    if (seed.Tiles == null || seed.Tiles.Count == 0)
        //        return;

        //    Vector2 center = Vector2.zero;
        //    foreach (var tile in seed.Tiles)
        //        center += tile;
        //    center /= seed.Tiles.Count;

        //    float maxDist = 0f;
        //    foreach (var tile in seed.Tiles)
        //        maxDist = Mathf.Max(maxDist, Vector2.Distance(tile, center));

        //    float minVis = 1f, maxVis = 0f;

        //    foreach (var tile in seed.Tiles)
        //    {
        //        float vis = visibilityMap[tile.x, tile.y];
        //        float dist = Vector2.Distance(tile, center);
        //        float normDist = 1f - (dist / (maxDist + 0.01f));

        //        float score = vis * (1f - centerWeight) + normDist * centerWeight;

        //        if (vis < minVis) minVis = vis;
        //        if (vis > maxVis) maxVis = vis;

        //        if (score >= visibilityThreshold)
        //            retained.Add(tile);
        //        else
        //            trimmed.Add(tile);
        //    }

        //    Debug.Log($"[CompressRoomSeed] Original: {seed.Tiles.Count}, Retained: {retained.Count}, Trimmed: {trimmed.Count} | Vis Range: {minVis:F2}-{maxVis:F2}");

        //    seed.Tiles = retained;
        //    seed.TrimmedTiles.AddRange(trimmed);
        //}



        //texture maker

        public static (Vector2Int vantage, List<Vector2Int> retained) FindVantagePointByClarity(List<Vector2Int> platformTiles, float[,] visibilityMap, int maxRadius, float clarityThreshold)
        {
            int width = visibilityMap.GetLength(0);
            int height = visibilityMap.GetLength(1);
            float[,] clarityMap = new float[width, height];
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    clarityMap[x, y] = 1f - visibilityMap[x, y]; // convert to clarity

            Vector2Int bestPoint = Vector2Int.zero;
            List<Vector2Int> bestVisible = new();
            int bestScore = -1;

            foreach (var p in platformTiles)
            {
                float clarity = clarityMap[p.x, p.y];
                if (clarity < clarityThreshold)
                    continue;

                List<Vector2Int> visible = new();
                foreach (var q in platformTiles)
                {
                    if ((q - p).sqrMagnitude <= maxRadius * maxRadius)
                    {
                        float qClarity = clarityMap[q.x, q.y];
                        if (qClarity >= clarityThreshold)
                            visible.Add(q);
                    }
                }

                if (visible.Count > bestScore)
                {
                    bestScore = visible.Count;
                    bestVisible = visible;
                    bestPoint = p;
                }
            }

            return (bestPoint, bestVisible);
        }

        //    public static List<Vector2Int> GrowPlatformFromVantage(
    //Vector2Int center,
    //HashSet<Vector2Int> allowedTiles,
    //float[,] visibilityMap,
    //int maxRadius,
    //float minClarity,
    //int maxArea)
    //    {
    //        int width = visibilityMap.GetLength(0);
    //        int height = visibilityMap.GetLength(1);
    //        HashSet<Vector2Int> visited = new();
    //        Queue<Vector2Int> queue = new();
    //        List<Vector2Int> result = new();

    //        queue.Enqueue(center);
    //        visited.Add(center);

    //        while (queue.Count > 0 && result.Count < maxArea)
    //        {
    //            Vector2Int current = queue.Dequeue();
    //            result.Add(current);

    //            foreach (Vector2Int dir in new Vector2Int[] {
    //        Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right })
    //            {
    //                Vector2Int next = current + dir;

    //                if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height)
    //                    continue;
    //                if (visited.Contains(next))
    //                    continue;
    //                if (!allowedTiles.Contains(next))
    //                    continue;
    //                if ((next - center).sqrMagnitude > maxRadius * maxRadius)
    //                    continue;

    //                float clarity = 1f - visibilityMap[next.x, next.y];
    //                if (clarity < minClarity)
    //                    continue;

    //                visited.Add(next);
    //                queue.Enqueue(next);
    //            }
    //        }

    //        return result;
    //    }

        
        public static HashSet<Vector2Int> CollectLOSVisibleTilesFlooded(    Vector2Int center,    HashSet<Vector2Int> allowedTiles,    float[,] visibilityMap,    float visibilityThreshold,    int width,    int height,    int maxRadius = 30,    Func<Vector2Int, bool> isObstacle = null)
        {
            HashSet<Vector2Int> visible = new();
            Queue<Vector2Int> queue = new();
            Dictionary<Vector2Int, int> distance = new();

            queue.Enqueue(center);
            visible.Add(center);
            distance[center] = 0;

            isObstacle ??= (_pos) => false;

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                int dist = distance[current];

                foreach (var dir in Directions.CardinalAndDiagonal)
                {
                    Vector2Int next = current + dir;

                    if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height)
                        continue;
                    if (visible.Contains(next))
                        continue;
                    if (!allowedTiles.Contains(next))
                        continue;
                    if (isObstacle(next))
                        continue;

                    float clarity = 1f - visibilityMap[next.x, next.y];
                    if (clarity < visibilityThreshold)
                        continue;

                    int newDist = dist + ((dir.x != 0 && dir.y != 0) ? 14 : 10);
                    if (newDist > maxRadius * 10)
                        continue;

                    visible.Add(next);
                    distance[next] = newDist;
                    queue.Enqueue(next);
                }
            }

            return visible;
        }


        public static List<Vector2Int> BuildPlatformRegionVisibleFrom(    Vector2Int vantage,    List<Vector2Int> candidateTiles,    float[,] visibilityMap,    float clarityThreshold,    int maxRadius,    int maxArea)
        {
            int width = visibilityMap.GetLength(0);
            int height = visibilityMap.GetLength(1);
            bool[,] visited = new bool[width, height];
            HashSet<Vector2Int> candidateSet = new HashSet<Vector2Int>(candidateTiles);

            Queue<Vector2Int> queue = new Queue<Vector2Int>();
            List<Vector2Int> result = new List<Vector2Int>();

            queue.Enqueue(vantage);
            visited[vantage.x, vantage.y] = true;
            result.Add(vantage);
            Vector2Int origin = vantage;

            Vector2Int[] dirs = {
                Vector2Int.up, Vector2Int.down,
                Vector2Int.left, Vector2Int.right
                };


            while (queue.Count > 0 && result.Count < maxArea)
            {
                Vector2Int current = queue.Dequeue();

                foreach (var d in dirs)
                {
                    Vector2Int next = current + d;
                    if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
                    if (visited[next.x, next.y]) continue;
                    if (!candidateSet.Contains(next)) continue;
                    if ((next - origin).sqrMagnitude > maxRadius * maxRadius) continue;

                    float clarity = 1f - visibilityMap[next.x, next.y];
                    if (clarity < clarityThreshold) continue;

                    visited[next.x, next.y] = true;
                    result.Add(next);
                    queue.Enqueue(next);
                }
            }

            return result;
        }

        public static List<PlatformSeed> MultiVantagePlatformGrowth(    List<Vector2Int> subsegmentTiles,    float[,] visibilityMap,    int roomId,    int terraceId,    int width,    int height,    float visibilityThreshold = 0.85f,    int maxRadius = 1000,    int maxArea = 9999)
        {
            HashSet<Vector2Int> remaining = new(subsegmentTiles);
            List<PlatformSeed> results = new();

            while (remaining.Count > 0)
            {
                var tilesList = remaining.ToList();
                (Vector2Int vantage, List<Vector2Int> retained) = FindVantagePointByClarity(tilesList, visibilityMap, maxRadius, visibilityThreshold);

                if (retained.Count == 0 || vantage == Vector2.zero)
                    break;

                var losTiles = CollectLOSVisibleTilesFlooded(vantage, retained.ToHashSet(),visibilityMap, visibilityThreshold, width, height, maxRadius);
                var buildTiles = BuildPlatformRegionVisibleFrom(vantage, losTiles.ToList(), visibilityMap, visibilityThreshold, maxRadius, maxArea);

                List<Vector2Int> trimmed = retained.Where(p => !buildTiles.Contains(p)).ToList();

                results.Add(new PlatformSeed
                {
                    RoomId = roomId,
                    TerraceId = terraceId,
                    Center = vantage,
                    Tiles = buildTiles,
                    TrimmedTiles = trimmed,
                    Area = buildTiles.Count,
                    Score = buildTiles.Count,
                    vantagePt = vantage
                });

                foreach (var t in buildTiles)
                    remaining.Remove(t);
            }

            return results;
        }

        //phase 4 merge and discard

        public static void ClassifyPlatformRoles(    List<PlatformSeed> platforms,    Dictionary<(int roomId, int terraceId), RoomFlowType> roomFlowTypes,    List<CoreConnection> connections)
        {
            var grouped = platforms.GroupBy(p => (p.RoomId, p.TerraceId));

            foreach (var group in grouped)
            {
                var roomId = group.Key.RoomId;
                var terraceId = group.Key.TerraceId;
                var roomType = roomFlowTypes.GetValueOrDefault((roomId, terraceId), RoomFlowType.Isolated);
                var plats = group.ToList();

                if (plats.Count == 1)
                {
                    plats[0].Role = PlatformRole.Main;
                    continue;
                }

                plats.Sort((a, b) => b.Area.CompareTo(a.Area));
                plats[0].Role = PlatformRole.Main;

                for (int i = 1; i < plats.Count; i++)
                {
                    if (plats[i].Area < 10)
                        plats[i].Role = PlatformRole.Fragment;
                    else
                    {
                        bool isNearTransition = connections.Any(conn =>
                            (conn.From.RoomID == roomId && (conn.From.TerraceLevel == terraceId || conn.To.TerraceLevel == terraceId)) &&
                            conn.Path.Any(p => plats[i].Tiles.Contains(p)));

                        plats[i].Role = isNearTransition ? PlatformRole.Transition : PlatformRole.Auxiliary;
                    }
                }
            }
        }

        public static Dictionary<(int roomId, int terraceId), RoomFlowType> ClassifyRoomFlowFromEdges(    List<PlatformSeed> platforms,    List<EdgeTile> edges,    List<TerraceEdge> terraceEdges,    int microThreshold = 50,    int smallThreshold = 200)
        {
            var result = new Dictionary<(int roomId, int terraceId), RoomFlowType>();

            // Build room-wise connectivity (only by RoomID)
            var roomConnections = new Dictionary<int, HashSet<int>>();

            foreach (var edge in edges)
            {
                if (edge.Type != EdgeType.Transition)
                    continue;

                int a = edge.RoomA;
                int b = edge.RoomB;

                if (!roomConnections.ContainsKey(a))
                    roomConnections[a] = new HashSet<int>();
                if (!roomConnections.ContainsKey(b))
                    roomConnections[b] = new HashSet<int>();

                roomConnections[a].Add(b);
                roomConnections[b].Add(a);
            }

            // Add terrace edges (only within the same room)
            foreach (var terraceEdge in terraceEdges)
            {
                int room = terraceEdge.Room;
                // No other room to connect to, just ensure the room exists
                if (!roomConnections.ContainsKey(room))
                    roomConnections[room] = new HashSet<int>();
            }

            // Group platform tiles by room + terrace
            var platformBySubsegment = new Dictionary<(int roomId, int terraceId), List<PlatformSeed>>();

            foreach (var plat in platforms)
            {
                var key = (plat.RoomId, plat.TerraceId);
                if (!platformBySubsegment.ContainsKey(key))
                    platformBySubsegment[key] = new List<PlatformSeed>();
                platformBySubsegment[key].Add(plat);
            }

            // Classify each room+terrace using room-wise connectivity
            foreach (var kvp in platformBySubsegment)
            {
                var key = kvp.Key;
                var plats = kvp.Value;
                int roomId = key.roomId;

                int totalTiles = plats.Sum(p => p.Tiles.Count);
                if (totalTiles < microThreshold)
                {
                    result[key] = RoomFlowType.Micro;
                    continue;
                }
                if (totalTiles < smallThreshold)
                {
                    result[key] = RoomFlowType.Small;
                    continue;
                }

                if (!roomConnections.TryGetValue(roomId, out var neighbors) || neighbors.Count == 0)
                {
                    result[key] = RoomFlowType.Isolated;
                    continue;
                }

                int degree = neighbors.Count;

                RoomFlowType flowType = degree switch
                {
                    1 => RoomFlowType.Leaf,
                    2 => RoomFlowType.Corridor,
                    >= 3 => RoomFlowType.Hub,
                    _ => RoomFlowType.Isolated
                };

                result[key] = flowType;
                Debug.Log($"Room {key.Item1} has {degree} external connections → {flowType}");

            }

            return result;
        }

        public static Dictionary<(int roomId, int terraceId), RoomFlowType> ClassifyRoomFlowFromConnections(    List<PlatformSeed> platforms,    List<CoreConnection> connections,    int microThreshold = 50,    int smallThreshold = 200)
        {
            var result = new Dictionary<(int roomId, int terraceId), RoomFlowType>();

            // Build logical connections per RoomID (ignore terrace level here)
            var roomConnections = new Dictionary<int, HashSet<int>>();

            foreach (var conn in connections)
            {
                int a = conn.From.RoomID;
                int b = conn.To.RoomID;

                if (!roomConnections.ContainsKey(a))
                    roomConnections[a] = new HashSet<int>();
                if (!roomConnections.ContainsKey(b))
                    roomConnections[b] = new HashSet<int>();

                if (a != b) // avoid self-links
                {
                    roomConnections[a].Add(b);
                    roomConnections[b].Add(a);
                }
            }

            // Group platform tiles by room + terrace
            var platformBySubsegment = new Dictionary<(int roomId, int terraceId), List<PlatformSeed>>();

            foreach (var plat in platforms)
            {
                var key = (plat.RoomId, plat.TerraceId);
                if (!platformBySubsegment.ContainsKey(key))
                    platformBySubsegment[key] = new List<PlatformSeed>();
                platformBySubsegment[key].Add(plat);
            }

            // Classify each room+terrace using room-wise connectivity
            foreach (var kvp in platformBySubsegment)
            {
                var key = kvp.Key;
                var plats = kvp.Value;
                int roomId = key.roomId;

                int totalTiles = plats.Sum(p => p.Tiles.Count);
                if (totalTiles < microThreshold)
                {
                    result[key] = RoomFlowType.Micro;
                    continue;
                }
                if (totalTiles < smallThreshold)
                {
                    result[key] = RoomFlowType.Small;
                    continue;
                }

                int degree = roomConnections.TryGetValue(roomId, out var neighbors)
                    ? neighbors.Count
                    : 0;

                RoomFlowType flowType = degree switch
                {
                    0 => RoomFlowType.Isolated,
                    1 => RoomFlowType.Leaf,
                    2 => RoomFlowType.Corridor,
                    >= 3 => RoomFlowType.Hub,
                    _ => RoomFlowType.Isolated
                };

                ///Debug.Log($"Room {key.Item1} has {degree} external connections → {flowType}");
                result[key] = flowType;
            }

            return result;
        }

        public static float[,] GenerateEntryViewHeatMap(
    List<EdgeTile> edges,
    int width,
    int height,
    HashSet<Vector2Int> forbidden,
    int coneLength = 20,
    float maxIntensity = 1.0f)
        {
            float[,] heat = new float[width, height];

            Vector2Int[] directions = {
        Vector2Int.up,
        Vector2Int.down,
        Vector2Int.left,
        Vector2Int.right
    };

            foreach (var edge in edges)
            {
                if (edge.Type != EdgeType.Transition)
                    continue;

                Vector2Int origin = edge.Pos;
                Vector2Int? to = null;

                // Estimate direction: find adjacent tile not forbidden and not same room
                foreach (var d in directions)
                {
                    Vector2Int next = origin + d;
                    if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height)
                        continue;
                    if (forbidden.Contains(next))
                        continue;

                    to = d;
                    break;
                }

                if (to == null)
                    continue;

                Vector2 dir = ((Vector2)to.Value).normalized;
                Vector2 pos = origin + new Vector2(0.5f, 0.5f);

                for (int i = 0; i < coneLength; i++)
                {
                    pos += dir;
                    Vector2Int p = new Vector2Int(Mathf.FloorToInt(pos.x), Mathf.FloorToInt(pos.y));

                    if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)
                        break;
                    if (forbidden.Contains(p))
                        break;

                    float intensity = maxIntensity * (1f - (i / (float)coneLength));
                    heat[p.x, p.y] = Mathf.Max(heat[p.x, p.y], intensity);
                }
            }

            return heat;
        }

        public static float[,] GenerateOccludedVantageHeatMap(
    List<Vector2Int> vantagePoints,
    int width, int height,
    HashSet<Vector2Int> forbidden,
    int maxRadius = 50,
    int rayCount = 360)
        {
            float[,] heatMap = new float[width, height];

            foreach (var center in vantagePoints)
            {
                Vector2 origin = center + new Vector2(0.5f, 0.5f);

                for (int i = 0; i < rayCount; i++)
                {
                    float angle = (i / (float)rayCount) * Mathf.PI * 2f;
                    Vector2 dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
                    Vector2 pos = origin;

                    for (int step = 0; step < maxRadius * 2; step++)
                    {
                        pos += dir * 0.5f;
                        Vector2Int p = new Vector2Int(Mathf.FloorToInt(pos.x), Mathf.FloorToInt(pos.y));

                        if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)
                            break;
                        if (forbidden.Contains(p))
                            break;

                        float dist = Vector2.Distance(origin, p + new Vector2(0.5f, 0.5f));
                        float falloff = Mathf.Max(0f, 1f - dist / maxRadius);
                        heatMap[p.x, p.y] += falloff;
                    }
                }

                // Also add the center point itself
                heatMap[center.x, center.y] += 1f;
            }

            return heatMap;
        }


        public static float[,] CombineViewAndVantageMaps(
    float[,] entryViewMap,
    float[,] vantageHeatMap,
    int width, int height, List<RoomCore> rooms)
        {
            float[,] combinedMap = new float[width, height];
            Dictionary<int, Vector3> maxValues = new Dictionary<int, Vector3>();
            Vector3 maxV = Vector3.zero;
            
            foreach(var  R in rooms)
            {
                foreach (var tile in R.Tiles) 
                {
                    if (maxValues.ContainsKey(R.RoomID))
                    {
                        //maxV.x += Mathf.Max(maxValues[R.RoomID].x, vantageHeatMap[tile.x, tile.y]);
                        //maxV.y += Mathf.
                    } 
                }

            }


            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {

                   
                        combinedMap[x, y] = (entryViewMap[x,y] + vantageHeatMap[x, y]);
                    
                }
            }


            return combinedMap;
        }


        public static float[,] NormalizeHeatMapPerRoom(
    float[,] input,
    List<RoomCore> rooms,
    int width, int height)
        {
            float[,] result = new float[width, height];

            foreach (var room in rooms)
            {
                float max = 0f;

                // First pass: find max in this room
                foreach (var p in room.Tiles)
                {
                    if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)
                        continue;

                    max = Mathf.Max(max, input[p.x, p.y]);
                }

                // Second pass: normalize
                foreach (var p in room.Tiles)
                {
                    if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height)
                        continue;

                    result[p.x, p.y] = (max > 0f) ? input[p.x, p.y] / max : 0f;
                }
            }

            return result;
        }

        public static HashSet<Vector2Int> ProjectConeFromEdge(
    Vector2Int edgePos,
    Vector2 dirAtoB, // Direction vector from RoomA to RoomB, e.g., (1, 0)
    HashSet<Vector2Int> forbidden,
    int width,
    int height,
    float coneAngle = 45f,
    int coneLength = 30,
    int rays = 30)
        {
            HashSet<Vector2Int> visible = new();
            List<Vector2> perpendicularDirs = new();

            // Calculate two perpendicular normalized directions
            Vector2 norm = ((Vector2)dirAtoB).normalized;
            perpendicularDirs.Add(new Vector2(-norm.y, norm.x)); // 90 degrees
            perpendicularDirs.Add(new Vector2(norm.y, -norm.x)); // -90 degrees

            foreach (var dir in perpendicularDirs)
            {
                float halfAngle = coneAngle / 2f;
                float baseAngle = Mathf.Atan2(dir.y, dir.x);

                for (int i = 0; i < rays; i++)
                {
                    float angle = baseAngle - halfAngle * Mathf.Deg2Rad + i * (coneAngle * Mathf.Deg2Rad / (rays - 1));
                    Vector2 rayDir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
                    Vector2 pos = edgePos + new Vector2(0.5f, 0.5f);

                    for (int step = 0; step < coneLength * 2; step++)
                    {
                        pos += rayDir * 0.5f;
                        Vector2Int tile = new Vector2Int(Mathf.FloorToInt(pos.x), Mathf.FloorToInt(pos.y));
                        if (tile.x < 0 || tile.y < 0 || tile.x >= width || tile.y >= height)
                            break;
                        if (forbidden.Contains(tile))
                            break;

                        visible.Add(tile);
                    }
                }
            }

            return visible;
        }

        public static float[,] GenerateEntryConeVisibilityMap(
    List<EdgeTile> edges,
    HashSet<Vector2Int> forbidden,
    int width,
    int height,
    float coneAngle = 45f,
    int coneLength = 30,
    int rays = 30)
        {
            float[,] visibilityMap = new float[width, height];

            foreach (var edge in edges)
            {
                if (edge.Type != EdgeType.Transition)
                    continue;

                Vector2Int pos = edge.Pos;
                // Estimate direction from RoomA to RoomB by sampling nearby tiles (improvable with true Room shapes)
                Vector2Int dir = new Vector2Int(edge.RoomB - edge.RoomA, 0); // This needs domain logic refinement
                Vector2 dirAtoB = new Vector2 ((float)dir.x, (float)dir.y) / (float)dir.magnitude;

                var visible = ProjectConeFromEdge(pos, dirAtoB, forbidden, width, height, coneAngle, coneLength, rays);

                foreach (var tile in visible)
                {
                    visibilityMap[tile.x, tile.y] += 1f;
                }
            }

            return visibilityMap;
        }


        //scores based on room type, each of the 3 main room types has a specific formulae based on vantage map and entry view map
        public static void ScorePlatformsByVantageMap(
    List<PlatformSeed> platforms,
    float[,] VantageMap,
    float[,] EntryViewMap,
    Dictionary<(int roomId, int terraceId), RoomFlowType> RoomClass)
        {
            var groupedPlatforms = platforms.GroupBy(p => (p.RoomId, p.TerraceId));
            var RoomMaxScores = new Dictionary<(int, int), Vector3>();
            Debug.Log("total roomplat: " + groupedPlatforms.Count().ToString());

            foreach (var group in groupedPlatforms)
            {
                float maxHubScore = 0f, maxVantage = 0f, maxEntry = 0f, maxCorridorScore = 0f, maxLeafScore = 0f;
                RoomFlowType role = RoomClass.TryGetValue(group.Key, out var rtype) ? rtype : RoomFlowType.Isolated;

                foreach (var plat in group)
                {
                    float hubScore = 0f;
                    float leafScore = 0f;
                    float corridorScore = 0f;
                    float vantage = 0f;
                    float entry = 0f;

                    foreach (var tile in plat.Tiles)
                    {
                        float v = VantageMap[tile.x, tile.y];
                        float e = EntryViewMap[tile.x, tile.y];

                        vantage += v;
                        entry += e;

                        if (role == RoomFlowType.Hub)
                            hubScore += v + e;
                        else if (role == RoomFlowType.Leaf)
                            leafScore += v + (1 - e);
                        else if (role == RoomFlowType.Corridor)//corridor
                            corridorScore += 0.65f * v + 0.35f * e;
                        else
                        {
                            hubScore = 0;
                            leafScore = 0;
                            corridorScore = 0;
                        }
                    }

                    plat.VantageRoomScore = vantage;
                    plat.EntryRoomScore = entry;

                    plat.Score = role switch
                    {
                        RoomFlowType.Hub => hubScore,
                        RoomFlowType.Leaf => leafScore,
                        RoomFlowType.Corridor => corridorScore,
                        _ => 0f
                    };

                    maxHubScore = Mathf.Max(maxHubScore, plat.Score);
                    maxCorridorScore = Mathf.Max(maxCorridorScore, plat.Score);
                    maxLeafScore = Mathf.Max(maxLeafScore, plat.Score);
                    maxVantage = Mathf.Max(maxVantage, vantage);
                    maxEntry = Mathf.Max(maxEntry, entry);
                }

                if (role == RoomFlowType.Hub)
                    RoomMaxScores[group.Key] = new Vector3(maxHubScore, maxVantage, maxEntry);
                else if (role == RoomFlowType.Leaf)
                    RoomMaxScores[group.Key] = new Vector3(maxLeafScore, maxVantage, maxEntry);
                else if (role == RoomFlowType.Corridor)
                    RoomMaxScores[group.Key] = new Vector3(maxCorridorScore, maxVantage, maxEntry);
                else
                    RoomMaxScores[group.Key] = Vector3.zero;

                // Normalize each platform in this group
                foreach (var plat in group)
                {
                    if (RoomMaxScores.TryGetValue(group.Key, out var maxVec))
                    {
                        if (maxVec.x > 0f) plat.Score /= maxVec.x;
                        if (maxVec.y > 0f) plat.VantageRoomScore /= maxVec.y;
                        if (maxVec.z > 0f) plat.EntryRoomScore /= maxVec.z;
                    }
                }
            }
        }

        public static void ScoreFlowPlatformsByVantageMap(
    List<PlatformSeed> platforms,
    float[,] VantageMap,
    float[,] EntryViewMap,
    float[,] widenedPathMap,
    Dictionary<(int roomId, int terraceId), RoomFlowType> RoomClass)
        {
            var groupedPlatforms = platforms.GroupBy(p => (p.RoomId, p.TerraceId));
            var RoomMaxScores = new Dictionary<(int, int), Vector4>(); // Includes widened path
            Debug.Log("total flowplat: " + groupedPlatforms.Count().ToString());

            foreach (var group in groupedPlatforms)
            {
                float maxScore = 0f, maxVantage = 0f, maxEntry = 0f, maxPath = 0f;
                RoomFlowType role = RoomClass.TryGetValue(group.Key, out var rtype) ? rtype : RoomFlowType.Isolated;

                foreach (var plat in group)
                {
                    float score = 0f;
                    float vantage = 0f;
                    float entry = 0f;
                    float path = 0f;

                    foreach (var tile in plat.Tiles)
                    {
                        float v = VantageMap[tile.x, tile.y];
                        float e = EntryViewMap[tile.x, tile.y];
                        float p = widenedPathMap[tile.x, tile.y];

                        vantage += v;
                        entry += e;
                        path += p;

                        if (role == RoomFlowType.Hub)
                            score += v + e + 0.3f * p; // path-influenced hub score
                        else if (role == RoomFlowType.Leaf)
                            score += v + (1 - e); // leaf score remains intimacy-based
                        else
                            score += v + 0.2f * p; // other room types use visibility + soft path influence
                    }

                    plat.VantageRoomScore = vantage;
                    plat.EntryRoomScore = entry;
                    plat.PathImportanceScore = path;
                    plat.Score = score;

                    maxScore = Mathf.Max(maxScore, score);
                    maxVantage = Mathf.Max(maxVantage, vantage);
                    maxEntry = Mathf.Max(maxEntry, entry);
                    maxPath = Mathf.Max(maxPath, path);
                }

                RoomMaxScores[group.Key] = new Vector4(maxScore, maxVantage, maxEntry, maxPath);

                // Normalize
                foreach (var plat in group)
                {
                    var max = RoomMaxScores[group.Key];

                    if (max.x > 0f) plat.Score /= max.x;
                    if (max.y > 0f) plat.VantageRoomScore /= max.y;
                    if (max.z > 0f) plat.EntryRoomScore /= max.z;
                    if (max.w > 0f) plat.PathImportanceScore /= max.w;
                }
            }
        }



        public static void AssignScenarioRoles(
    List<PlatformSeed> platforms,
    List<EdgeTile> edgeTransitions,
    float lightThreshold = 1.4f,
    float darkThreshold = 0.5f,
    int maxLobbyDistance = 6, int maxLobbies = 1)
        {
            HashSet<Vector2Int> edgePositions = edgeTransitions
                .Where(e => e.Type == EdgeType.Transition)
                .Select(e => e.Pos)
                .ToHashSet();

            Debug.Log("Hub platforms: " + platforms.Count);
            // Map tiles to their platform
            Dictionary<Vector2Int, PlatformSeed> tileToPlatform = new();
            foreach (var platform in platforms)
            {
                foreach (var tile in platform.Tiles)
                {
                    tileToPlatform[tile] = platform;
                }
            }

            // Step 1: Assign Central / Branch / Satellite by score
            foreach (var platform in platforms)
            {
                if (platform.Score >= lightThreshold)
                    platform.ScenarioRole = ScenarioRole.Central;
                else if (platform.Score <= darkThreshold)
                    platform.ScenarioRole = ScenarioRole.Branch;
                else
                    platform.ScenarioRole = ScenarioRole.Satellite;

                //if(platform.Score != float.NaN)
                //Debug.Log("Room " + platform.RoomId.ToString() + ": " + platform.Score.ToString() + " - " + platform.ScenarioRole.ToString());
            }

            int lobbymaxCount = maxLobbies;
            // Step 2: Mark Lobby platforms (near edge transition)
            foreach (var platform in platforms)
            {
                lobbymaxCount = maxLobbies;
                if (platform.ScenarioRole == ScenarioRole.Central || platform.ScenarioRole == ScenarioRole.Branch || lobbymaxCount <= 0)
                    continue;

                foreach (var tile in platform.Tiles)
                {
                    foreach (var edgePos in edgePositions)
                    {
                        if ((tile - edgePos).sqrMagnitude <= maxLobbyDistance * maxLobbyDistance && lobbymaxCount > 0)
                        {
                            lobbymaxCount--;
                            platform.ScenarioRole = ScenarioRole.Lobby;
                            break;
                        }
                    }
                    if (platform.ScenarioRole == ScenarioRole.Lobby)
                        break;
                }
            }

            // Step 3: Find road connections between Lobby and Central (single path per pair)
            var centralPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Central).ToList();
            var lobbyPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Lobby).ToList();
            HashSet<PlatformSeed> roadSet = new();

            foreach (var central in centralPlatforms)
            {
                foreach (var lobby in lobbyPlatforms)
                {
                    var path = FindPlatformPath(central, lobby, platforms, maxDepth: 20);
                    foreach (var p in path)
                    {
                        if (p.ScenarioRole == ScenarioRole.Satellite)
                        {
                            p.ScenarioRole = ScenarioRole.Road;
                            roadSet.Add(p);
                        }
                    }
                }
            }

            var undefinedPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Undefined).ToList();
            for (int i = 0; i < undefinedPlatforms.Count; i++)
            {
                undefinedPlatforms[i].ScenarioRole = ScenarioRole.Branch;
                Debug.Log("undefined hub - Score: " + undefinedPlatforms[i].Score.ToString() + " - Van: " + undefinedPlatforms[i].VantageRoomScore.ToString() + " - Entry: " + undefinedPlatforms[i].EntryRoomScore.ToString());
            }

            // Done!
        }

        private static List<PlatformSeed> FindPlatformPath(
            PlatformSeed from,
            PlatformSeed to,
            List<PlatformSeed> allPlatforms,
            int maxDepth = 20)
        {
            // BFS to find shortest path
            Queue<List<PlatformSeed>> queue = new();
            HashSet<PlatformSeed> visited = new();
            queue.Enqueue(new List<PlatformSeed> { from });
            visited.Add(from);

            Dictionary<Vector2Int, PlatformSeed> tileToPlatform = new();
            foreach (var p in allPlatforms)
            {
                foreach (var tile in p.Tiles)
                    tileToPlatform[tile] = p;
            }

            while (queue.Count > 0)
            {
                var path = queue.Dequeue();
                var last = path.Last();
                if (last == to)
                    return path;

                if (path.Count > maxDepth)
                    continue;

                var neighbors = GetNeighboringPlatforms(last, tileToPlatform, allPlatforms);
                foreach (var neighbor in neighbors)
                {
                    if (!visited.Contains(neighbor))
                    {
                        visited.Add(neighbor);
                        var newPath = new List<PlatformSeed>(path) { neighbor };
                        queue.Enqueue(newPath);
                    }
                }
            }

            return new List<PlatformSeed>(); // no path
        }

        private static List<PlatformSeed> GetNeighboringPlatforms(
            PlatformSeed platform,
            Dictionary<Vector2Int, PlatformSeed> tileToPlatform,
            List<PlatformSeed> allPlatforms)
        {
            HashSet<PlatformSeed> neighbors = new();

            foreach (var tile in platform.Tiles)
            {
                foreach (var dir in Directions.CardinalAndDiagonal)
                {
                    var adj = tile + dir;
                    if (tileToPlatform.TryGetValue(adj, out var neighbor))
                    {
                        if (neighbor != platform)
                            neighbors.Add(neighbor);
                    }
                }
            }

            return neighbors.ToList();
        }

        public static List<RoomScenario> BuildRoomScenarios(
    List<PlatformSeed> platforms,
    Dictionary<(int roomId, int terraceId), RoomFlowType> roomRoles)
        {
            var roomMap = new Dictionary<(int, int), RoomScenario>();
            Dictionary<ScenarioRole, int> rolecount = new Dictionary<ScenarioRole, int>();

            foreach (var p in platforms)
            {
                var key = (p.RoomId, p.TerraceId);
                if (!roomMap.ContainsKey(key))
                {
                    roomMap[key] = new RoomScenario
                    {
                        RoomId = p.RoomId,
                        TerraceLevel = p.TerraceId,
                        RoomType = roomRoles.ContainsKey(key) ? roomRoles[key] : RoomFlowType.Dead

                    };


                }
                roomMap[key].Platforms.Add(p);

                if (rolecount.ContainsKey(p.ScenarioRole))
                {
                    rolecount[p.ScenarioRole]++;
                }
                else
                {
                    rolecount.Add(p.ScenarioRole, 1);
                }
            }

            string debg = "";
            foreach (var p in rolecount) 
            {
                debg += p.Key.ToString() + ": " + p.Value.ToString() + ", " ;
            }
            Debug.Log(debg);

            return roomMap.Values.ToList();
        }

        public static void AssignLeafScenarioRoles(
    List<PlatformSeed> platforms,
    List<EdgeTile> edgeTransitions,
    Vector3 IntimateThreshold,
    int maxLobbyDistance = 6, int maxlobby = 1)
        {
            //intimate thresholds works as follows
            //x value = high intimacy place = used to find central
            //y value = vanMap visibility = used to find core location
            //z value = entry visibility = its used to find closeness to entry points
            Debug.Log("leaf platforms: " + platforms.Count);
            HashSet<Vector2Int> edgePositions = edgeTransitions
                .Where(e => e.Type == EdgeType.Transition)
                .Select(e => e.Pos)
                .ToHashSet();

            Dictionary<Vector2Int, PlatformSeed> tileToPlatform = new();
            Dictionary<ScenarioRole, int> roomString = new Dictionary<ScenarioRole, int>();
            int maxlobbyCount = maxlobby;

            foreach (var platform in platforms)
            {
                foreach (var tile in platform.Tiles)
                    tileToPlatform[tile] = platform;
            }

            // Step 1: Score-based assignment for Leaf (favoring intimacy)
            foreach (var platform in platforms)
            {
                float score = platform.Score;
                float vanScore = platform.VantageRoomScore;
                float entryScore = platform.EntryRoomScore;

                if (score >= IntimateThreshold.x) //the most intimate place
                    platform.ScenarioRole = ScenarioRole.Central;
                else if (entryScore <= IntimateThreshold.z && vanScore >= IntimateThreshold.y)
                {
                    if ((vanScore - IntimateThreshold.y) / vanScore > (IntimateThreshold.z - entryScore) / IntimateThreshold.z)
                    {
                        platform.ScenarioRole = ScenarioRole.Satellite;
                    }
                    else
                    {
                        platform.ScenarioRole = ScenarioRole.Branch;
                    }
                }

                else if (vanScore >= IntimateThreshold.y) // under the high intimacty, threshold but still a core location 
                    platform.ScenarioRole = ScenarioRole.Satellite;
                else if (entryScore <= IntimateThreshold.z) //under te high intimacy threshold, but away from the entrace
                    platform.ScenarioRole = ScenarioRole.Branch;
                else
                    platform.ScenarioRole = ScenarioRole.Road;


            }

            if (!roomString.ContainsKey(ScenarioRole.Central))
            {
                var fallback = platforms.OrderByDescending(p => p.Score).FirstOrDefault();
                if (fallback != null)
                {
                    fallback.ScenarioRole = ScenarioRole.Central;

                    platforms[platforms.FindIndex(p => p == fallback)] = fallback;
                }
            }


            // Step 2: Identify Lobby (adjacent to transition)
            foreach (var platform in platforms)
            {
                maxlobbyCount = maxlobby;
                if (platform.ScenarioRole == ScenarioRole.Central)
                {
                    if (roomString.ContainsKey(ScenarioRole.Central))
                    {
                        roomString[ScenarioRole.Central]++;
                    }

                    continue;
                }


                foreach (var tile in platform.Tiles)
                {
                    foreach (var edgePos in edgePositions)
                    {
                        if ((tile - edgePos).sqrMagnitude <= maxLobbyDistance * maxLobbyDistance && maxlobbyCount > 0)
                        {
                            maxlobbyCount--;
                            platform.ScenarioRole = ScenarioRole.Lobby;
                            break;
                        }
                    }

                    if (platform.ScenarioRole == ScenarioRole.Lobby)
                        break;
                }

                if (roomString.ContainsKey(platform.ScenarioRole))
                {
                    roomString[platform.ScenarioRole]++;
                }
                else
                {
                    roomString.Add(platform.ScenarioRole, 1);
                }
            }

            // Step 3: Roads — connect Lobbies to Central
            var central = platforms.FirstOrDefault(p => p.ScenarioRole == ScenarioRole.Central);
            //Debug.Log(central);
            if (central != null)
            {
                var lobbies = platforms.Where(p => p.ScenarioRole == ScenarioRole.Lobby).ToList();
                foreach (var lobby in lobbies)
                {
                    var path = FindPlatformPath(central, lobby, platforms, maxDepth: 20);
                    foreach (var step in path)
                    {
                        if (step.ScenarioRole == ScenarioRole.Branch || step.ScenarioRole == ScenarioRole.Road || step.ScenarioRole == ScenarioRole.Undefined)
                        {
                            step.ScenarioRole = ScenarioRole.Road;
                        }
                    }
                }
            }

            foreach (var x in roomString)
            {
                Debug.Log(x.Key.ToString() + ": " + x.Value.ToString() + "/ " + platforms.Count().ToString());
            }

            var undefinedPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Undefined).ToList();
            for (int i = 0; i < undefinedPlatforms.Count; i++)
            {
                undefinedPlatforms[i].ScenarioRole = ScenarioRole.Satellite;
                Debug.Log("undefined leaf - Score: " + undefinedPlatforms[i].Score.ToString() + " - Van: " + undefinedPlatforms[i].VantageRoomScore.ToString() + " - Entry: " + undefinedPlatforms[i].EntryRoomScore.ToString());
            }
        }

        public static void AssignCorridorScenarioRoles(
    List<PlatformSeed> platforms,
    List<EdgeTile> edgeTransitions,
    int maxLobbyDistance = 6, int maxlobby = 1)
        {
            HashSet<Vector2Int> edgePositions = edgeTransitions
                .Where(e => e.Type == EdgeType.Transition)
                .Select(e => e.Pos)
                .ToHashSet();

            Debug.Log("Corridors: " + platforms.Count);
            Dictionary<Vector2Int, PlatformSeed> tileToPlatform = new();
            foreach (var platform in platforms)
            {
                foreach (var tile in platform.Tiles)
                    tileToPlatform[tile] = platform;
            }

            // Step 1: Assign platform roles based on scores
            foreach (var platform in platforms)
            {
                float vantage = platform.VantageRoomScore;
                float entry = platform.EntryRoomScore;
                float score = 0.65f * vantage + 0.35f * entry;

                if (score >= 0.85f)
                {
                    platform.ScenarioRole = ScenarioRole.Central;
                }
                else if (entry >= 0.85f && vantage >= 0.5f)
                {
                    platform.ScenarioRole = ScenarioRole.Lobby;
                }
                else if (score >= 0.4f && score <= 0.75f && vantage >= 0.5f)
                {
                    platform.ScenarioRole = ScenarioRole.Road;
                }
                else if (vantage >= 0.7f && entry <= 0.3f)
                {
                    platform.ScenarioRole = ScenarioRole.Satellite;
                }
                else if (vantage <= 0.3f && entry >= 0.5f)
                {
                    platform.ScenarioRole = ScenarioRole.Branch;
                }
                else if (vantage <= 0.2f && entry <= 0.2f)
                {
                    platform.ScenarioRole = ScenarioRole.Central; // deep corner
                }
                else
                {
                    platform.ScenarioRole = ScenarioRole.Branch;
                }
            }

            int maxlobbyCount = maxlobby;
            // Step 2: Mark Lobby platforms near transitions if not yet marked
            foreach (var platform in platforms)
            {
                maxlobbyCount = maxlobby;
                if (platform.ScenarioRole == ScenarioRole.Central)
                    continue;

                foreach (var tile in platform.Tiles)
                {
                    foreach (var edgePos in edgePositions)
                    {
                        if ((tile - edgePos).sqrMagnitude <= maxLobbyDistance * maxLobbyDistance && maxlobby > 0)
                        {
                            maxlobby--;
                            platform.ScenarioRole = ScenarioRole.Lobby;
                            break;
                        }
                    }
                    if (platform.ScenarioRole == ScenarioRole.Lobby)
                        break;
                }
            }

            // Step 3: Find road connections between Lobby and Central
            var centralPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Central).ToList();
            var lobbyPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Lobby).ToList();

            foreach (var central in centralPlatforms)
            {
                foreach (var lobby in lobbyPlatforms)
                {
                    var path = FindPlatformPath(central, lobby, platforms, maxDepth: 20);
                    foreach (var p in path)
                    {
                        if (p.ScenarioRole == ScenarioRole.Satellite || p.ScenarioRole == ScenarioRole.Branch)
                        {
                            p.ScenarioRole = ScenarioRole.Road;
                        }
                    }
                }
            }

            var undefinedPlatforms = platforms.Where(p => p.ScenarioRole == ScenarioRole.Undefined).ToList();
            for (int i = 0; i < undefinedPlatforms.Count; i++)
            {
                undefinedPlatforms[i].ScenarioRole = ScenarioRole.Road;
                Debug.Log("undefined corridor - Score: " + undefinedPlatforms[i].Score.ToString() + " - Van: " + undefinedPlatforms[i].VantageRoomScore.ToString() + " - Entry: " + undefinedPlatforms[i].EntryRoomScore.ToString());
            }
        }

        
        //texture generation
        public static Texture2D GenerateSlopeDebugTexture(SlopeType[,] slopeClassMap)
        {
            int width = slopeClassMap.GetLength(0);
            int height = slopeClassMap.GetLength(1);
            Texture2D texture = new Texture2D(width, height);
            texture.filterMode = FilterMode.Point;

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    Color color;
                    switch (slopeClassMap[x, y])
                    {
                        case SlopeType.Flat: color = Color.green; break;
                        case SlopeType.Gentle: color = Color.yellow; break;
                        case SlopeType.Steep: color = Color.red; break;
                        case SlopeType.Void: color = Color.black; break;
                        default: color = Color.magenta; break;
                    }

                    texture.SetPixel(x, y, color);
                }
            }

            texture.Apply();
            return texture;
        }

        public static Texture2D GenerateRoomTerraceDebugTex(    List<Room> rooms,    float[,] heightMap,    int[,] terraceMap,    int terraceCount,    int width,    int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            // Build a lookup for tile -> room ID
            Dictionary<Vector2Int, int> roomLookup = new Dictionary<Vector2Int, int>();
            foreach (Room room in rooms)
                foreach (var cell in room.Cells)
                    roomLookup[cell] = room.Id;

            // Assign unique base color to each room
            Dictionary<int, Color> roomColors = new Dictionary<int, Color>();
            System.Random rng = new System.Random();

            foreach (Room room in rooms)
            {
                roomColors[room.Id] = new Color(
                    (float)room.Id/(float)rooms.Count,
                    (float)rng.NextDouble(),
                    Mathf.Max((float)rng.NextDouble(), 0.5f)
                );
            }

            // Paint each tile
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    Vector2Int pos = new Vector2Int(x, y);
                    float heightVal = heightMap[x, y];

                    if (heightVal <= 0f)
                    {
                        tex.SetPixel(x, y, Color.black); // VOID
                        continue;
                    }

                    if (roomLookup.TryGetValue(pos, out int roomId))
                    {
                        Color baseColor = roomColors[roomId];

                        // Brightness factor from terrace level
                        int terraceLevel = terraceMap[x, y];
                        float t = (float)terraceLevel / Mathf.Max(terraceCount - 1, 1);
                        float brightness = Mathf.Lerp(0.7f, 1f, t); // ensures min brightness
                        
                        brightness = Mathf.Clamp01(brightness);

                        // Apply brightness scaling
                        Color shaded = baseColor * brightness;
                        shaded.a = 1f;

                        tex.SetPixel(x, y, shaded);
                    }
                    else
                    {
                        tex.SetPixel(x, y, Color.gray); // unassigned terrain
                    }
                }
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateTerraceBorderTexture(    int[,] terraceMap,    SlopeType[,] slopeMap,    List<TerraceEdge> terraceEdges,    List<EdgeTile> roomEdges,    int[,] roomMap,    int width,    int height,    int minTransitionSize = 4)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            Color baseColor = new Color(0, 0, 0, 0.1f);
            Color borderColor = new Color(0.5f, 0.7f, 1f);       // light blue
            Color transitionColor = new Color(1f, 0f, 1f);       // magenta
            Color steepColor = new Color(0.25f, 0.25f, 0.625f);  // muted blue

            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };
            HashSet<Vector2Int> transitionSet = new HashSet<Vector2Int>(terraceEdges.Select(e => e.Pos));

            // Step 0: Base fill
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, baseColor);

            // Step 1: Draw steep slopes first
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    if (slopeMap[x, y] == SlopeType.Steep)
                        tex.SetPixel(x, y, steepColor);

            // Step 2: Filter transitions and collect grouped valid ones
            var validTransitionGroups = GroupConnectedTransitions(transitionSet, width, height)
                .Where(g => g.Count >= minTransitionSize)
                .ToList();

            HashSet<Vector2Int> validTransitionSet = new HashSet<Vector2Int>();
            foreach (var group in validTransitionGroups)
                foreach (var p in group)
                    validTransitionSet.Add(p);

            // Step 3: Draw terrace borders (if not claimed by a valid transition)
            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    if (slopeMap[x, y] == SlopeType.Steep || roomMap[x, y] <= 0)
                        continue;

                    int terr = terraceMap[x, y];
                    Vector2Int current = new Vector2Int(x, y);

                    if (validTransitionSet.Contains(current))
                        continue;

                    foreach (var d in dirs)
                    {
                        int nx = x + d.x;
                        int ny = y + d.y;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                            continue;

                        if (roomMap[nx, ny] <= 0 || slopeMap[nx, ny] == SlopeType.Steep)
                            continue;

                        if (terraceMap[nx, ny] != terr)
                        {
                            if (!validTransitionSet.Contains(new Vector2Int(x, y)))
                                tex.SetPixel(x, y, borderColor);
                            break;
                        }
                    }
                }
            }

            // Step 4: Draw full valid transition groups (magenta)
            foreach (var p in validTransitionSet)
                tex.SetPixel(p.x, p.y, transitionColor);

            // Step 5: Overlay room edges
            foreach (var edge in roomEdges)
            {
                var pos = edge.Pos;
                switch (edge.Type)
                {
                    case EdgeType.Transition:
                        tex.SetPixel(pos.x, pos.y, Color.green); break;
                    case EdgeType.SolidSoft:
                        tex.SetPixel(pos.x, pos.y, new Color(1f, 0.5f, 0f)); break;
                    case EdgeType.SolidHard:
                        tex.SetPixel(pos.x, pos.y, Color.red); break;
                }
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateCoreGraphTexture(    List<RoomCore> cores,    Dictionary<(int, int), RoomConnection> graph,    int width,    int height,    int nodeRadius = 2)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            Color background = new Color(0, 0, 0, 0.1f);
            Color lineColor = Color.white;
            Color colorReachable = Color.cyan;
            Color colorUnreachable = Color.red;
            Color colorIsolated = new Color(1f, 0f, 1f); // purple
            Color colorDead = Color.yellow;

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, background);

            // Build fast core lookup per room
            Dictionary<int, RoomCore> coreByRoom = new Dictionary<int, RoomCore>();
            foreach (var core in cores)
            {
                if (core.coreType == CoreType.Dead) continue;
                if (!coreByRoom.ContainsKey(core.RoomID))
                    coreByRoom[core.RoomID] = core;
            }

            foreach (var conn in graph.Values)
            {
                if (!coreByRoom.TryGetValue(conn.RoomA, out var a)) continue;
                if (!coreByRoom.TryGetValue(conn.RoomB, out var b)) continue;
                DrawLine(tex, a.Center, b.Center, lineColor);
            }

            // Draw each core by type
            foreach (var core in cores)
            {
                Color c = background;

                switch (core.coreType)
                {
                    case CoreType.Reachable:
                        c = colorReachable;
                        break;
                    case CoreType.Unreachable:
                        c = colorUnreachable;
                        break;
                    case CoreType.Isolated:
                        c = colorIsolated;
                        break;
                    case CoreType.Dead:
                        c = colorDead;
                        break;
                }

                DrawDot(tex, core.Center, nodeRadius, c);
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateAStarPathTexture(List<Vector2Int> path, List<RoomCore> cores, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            // fill with transparent
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, new Color(0, 0, 0, 0.1f));

            // draw path
            foreach (var p in path)
                tex.SetPixel(p.x, p.y, Color.yellow);

            foreach (var core in cores)
            {
                if (core.coreType == CoreType.Reachable)
                    DrawDot(tex, core.Center, 2, Color.green);
                else if (core.coreType != CoreType.Reachable && core.coreType != CoreType.Dead)
                    DrawDot(tex, core.Center, 1, Color.red);
                else DrawDot(tex, core.Center, 1, Color.white);
            }


            if (path.Count > 0)
            {
                tex.SetPixel(path[0].x, path[0].y, Color.cyan);                      // start
                tex.SetPixel(path[^1].x, path[^1].y, new Color(0f, 1f, 0.2f));       // goal
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateCoreGraphTexture(CoreConnectivityGraph graph, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            // Background
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, new Color(0, 0, 0, 0.1f));

            // Paths
            foreach (var conn in graph.Connections)
            {
                foreach (var p in conn.Path)
                    tex.SetPixel(p.x, p.y, Color.yellow);
            }

            // Nodes
            foreach (var core in graph.ReachableCores)
            {
                if (graph.Connections.Any(c => c.From == core || c.To == core))
                {
                    Color dot =  Color.cyan ;
                    DrawDot(tex, core.Center, 2, dot);
                }
                else
                {
                    Color dot = Color.red;
                    DrawDot(tex, core.Center, 1, dot);
                }
                
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateFloodValidationTexture(    List<RoomFloodGroup> groups,    List<RoomCore> cores,    int[,] roomMap,    int width,    int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            // Step 0: Fill base with dark purple (unreachable or unclassified space)
            Color baseColor = new Color(0.2f, 0.0f, 0.3f); // dark purple
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, baseColor);

            // Step 1: Draw flood zones in light gray
            foreach (var group in groups)
            {
                foreach (var tile in group.Tiles)
                {
                    tex.SetPixel(tile.x, tile.y, new Color(0.6f, 0.6f, 0.6f)); // light gray
                }
            }

            // Step 2: Mark entries
            foreach (var group in groups)
            {
                Color entryColor = group.ReachedCore ? Color.green : Color.red;
                DrawDot(tex, group.Entry, 2, entryColor);
            }

            // Step 3: Mark cores (static reference)
            foreach (var core in cores)
            {
                DrawDot(tex, core.Center, 2, Color.yellow);
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateTerraceHeightDebugTex(int[,] terraceMap, float[,] heightmap, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    int val = terraceMap[x, y];
                    float brightness;

                    if (heightmap[x,y] <= 0)
                        brightness = 0f; // void or invalid
                    else if (val == 0)
                        brightness = 0.5f; // base terrace
                    else
                        brightness = 1f; // higher terraces

                    tex.SetPixel(x, y, new Color(brightness, brightness, brightness));
                }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateKruskalComparisonTexture(    List<CoreConnection> allPaths,    List<CoreConnection> rawKruskal,    List<CoreConnection> visualKruskal,    int width,    int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            Color bg = new Color(0f, 0f, 0f, 0.5f);         // background
            Color allPathsColor = new Color(0.5f, 0.5f, 0.5f); // gray for all connections
            Color rawColor = Color.red;                      // red = raw Kruskal
            Color visualColor = Color.green;                 // green = visual Kruskal

            // Fill base
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, bg);

            // Draw all paths in gray
            foreach (var conn in allPaths)
            {
                foreach (var p in conn.Path)
                {
                    tex.SetPixel(p.x, p.y, allPathsColor);
                }
            }

            // Overlay raw Kruskal in red
            foreach (var conn in rawKruskal)
            {
                foreach (var p in conn.Path)
                {
                    tex.SetPixel(p.x, p.y, rawColor);
                }
            }

            // Overlay visual Kruskal in green
            foreach (var conn in visualKruskal)
            {
                foreach (var p in conn.Path)
                {
                    tex.SetPixel(p.x, p.y, visualColor);
                }
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateForbiddenDebugTexture(HashSet<Vector2Int> forbidden, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            Color allowedColor = new Color(0f, 0f, 0f, 0.1f);  // transparent black
            Color blockedColor = new Color(1f, 0f, 0f, 0.9f);  // bright red

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    Vector2Int pos = new Vector2Int(x, y);
                    tex.SetPixel(x, y, forbidden.Contains(pos) ? blockedColor : allowedColor);
                }
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformRegionTexture(List<PlatformRegion> regions, int width, int height)
        {
            Texture2D tex = new(width, height);
            tex.filterMode = FilterMode.Point;
            Color baseColor = new(0, 0, 0, 0.1f);
            Color[] palette = new Color[regions.Count];
            for (int i = 0; i < regions.Count; i++)
                palette[i] = Color.HSVToRGB((float)i/(float)regions.Count, 0.7f, 1f );

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, baseColor);

            for (int i = 0; i < regions.Count; i++)
            {
                var color = palette[i];
                foreach (var p in regions[i].Tiles)
                    tex.SetPixel(p.x, p.y, color);
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformRegionWithCoresTexture(    List<PlatformRegion> regions,    int width,    int height,    Color coreColor,    int coreRadius = 2)
        {
            Texture2D tex = new(width, height);
            tex.filterMode = FilterMode.Point;

            Color baseColor = new(0, 0, 0, 0.1f);
            Color[] palette = new Color[regions.Count];
            for (int i = 0; i < regions.Count; i++)
                palette[i] = Color.HSVToRGB((float)i / (float)regions.Count, 0.7f, 1f);

            // Base fill
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, baseColor);

            // Paint regions
            for (int i = 0; i < regions.Count; i++)
            {
                Color regionColor = palette[i];
                foreach (var p in regions[i].Tiles)
                    tex.SetPixel(p.x, p.y, regionColor);
            }

            // Overlay cores
            foreach (var region in regions)
            {
                DrawDot(tex, region.Origin, coreRadius, coreColor);
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformSeedTexture(List<PlatformSeed> seeds, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            Color bg = new Color(0.05f, 0.05f, 0.05f, 0.1f);
            FillTexture(tex, bg);

            Color[] palette = GenerateColorPalette(seeds.Count);

            for (int i = 0; i < seeds.Count; i++)
            {
                var seed = seeds[i];
                Color c = palette[i];

                foreach (var p in seed.Tiles)
                    tex.SetPixel(p.x, p.y, c);

                DrawDot(tex, seed.Center, 2, Color.white);
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GenerateSegmentTexture(    Dictionary<(int roomId, int terraceId), List<Vector2Int>> segments,    int[,] terraceMap,    int width,    int height)
        {
            Texture2D tex = new Texture2D(width, height);
            Color32[] pixels = new Color32[width * height];

            // Determine terrace height range
            int maxTerrace = 0;
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    if (terraceMap[x, y] > maxTerrace)
                        maxTerrace = terraceMap[x, y];

            // Generate unique random base color per (roomId, terraceId)
            Dictionary<(int roomId, int terraceId), Color> palette = new();
            System.Random rng = new System.Random();

            foreach (var key in segments.Keys)
            {
                Color baseColor = new Color(
                    (float)(rng.NextDouble() * 0.7 + 0.1),
                    (float)(rng.NextDouble() * 0.7 + 0.1),
                    (float)(rng.NextDouble() * 0.7 + 0.1));

                float brightness = Mathf.Lerp(0.5f, 1f, key.terraceId / (float)Mathf.Max(1, maxTerrace));
                palette[key] = baseColor * brightness;
            }

            // Paint pixels
            for (int i = 0; i < pixels.Length; i++)
                pixels[i] = Color.black;

            foreach (var kvp in segments)
            {
                var color = palette[kvp.Key];
                foreach (var p in kvp.Value)
                {
                    if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height)
                        pixels[p.x + p.y * width] = color;
                }
            }

            tex.SetPixels32(pixels);
            tex.Apply();
            return tex;
        }


        //room roles using old definitions such as leafLarge or hubSmall
        public static Texture2D GeneratePlatformClassificationTexture(    List<PlatformSeed> platforms,    Dictionary<(int roomId, int terraceId), RoomFlowType> flowMap,    int width,    int height,    int sizeThreshold = 50)
        {
            Texture2D tex = new Texture2D(width, height);
            FillTexture(tex, new Color(0, 0, 0, 0.05f));

            Dictionary<string, Color> palette = new()
            {
                ["LeafLarge"] = new Color(0f, 1f, 0f, 1f),
                ["LeafSmall"] = new Color(0f, 0.5f, 0f, 1f),
                ["CorridorLarge"] = new Color(1f, 1f, 0f, 1f),
                ["CorridorSmall"] = new Color(0.7f, 0.7f, 0f, 1f),
                ["HubLarge"] = new Color(0f, 0.5f, 1f, 1f),
                ["HubSmall"] = new Color(0f, 0.25f, 0.5f, 1f),
                ["Isolated"] = new Color(1f, 0f, 0f, 1f)
            };

            foreach (var platform in platforms)
            {
                var key = (platform.RoomId, platform.TerraceId);
                string flowType = flowMap.ContainsKey(key) ? flowMap[key].ToString() : "Isolated";
                bool large = platform.Tiles.Count >= sizeThreshold;
                string finalKey = $"{flowType}{(large ? "Large" : "Small")}";

                Color c = palette.ContainsKey(finalKey) ? palette[finalKey] : Color.gray;

                foreach (var p in platform.Tiles)
                    tex.SetPixel(p.x, p.y, c);

                // Optional white outline for edges
                foreach (var p in platform.Tiles)
                {
                    foreach (var d in Directions.Cardinal)
                    {
                        Vector2Int n = p + d;
                        if (!platform.Tiles.Contains(n))
                            tex.SetPixel(p.x, p.y, Color.white);
                    }
                }
            }

            tex.Apply();
            return tex;
        }

        // lastest room roles with borders
        public static Texture2D GenerateRoomFlowTypeDebugTexture(    Dictionary<(int roomId, int terraceId), RoomFlowType> roomRoles,    List<RoomCore> roomCores,    int width,    int height)
        {
            Texture2D tex = new Texture2D(width, height);
            FillTexture(tex, new Color(0,0,0,0.05f)); // Background

            foreach (var core in roomCores)
            {
                var key = (core.RoomID, core.TerraceLevel);
                if (!roomRoles.TryGetValue(key, out var role))
                    continue;

                Color color = RoleColor(role);

                foreach (var tile in core.Tiles)
                {
                    tex.SetPixel(tile.x, tile.y, color);
                }

                // Optional white outline for edges
                foreach (var p in core.Tiles)
                {
                    foreach (var d in Directions.Cardinal)
                    {
                        Vector2Int n = p + d;
                        if (!core.Tiles.Contains(n))
                            tex.SetPixel(p.x, p.y, Color.white);
                    }
                }
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformScoreTexture(List<PlatformSeed> platforms, float[,] scoreMap, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            Color background = new Color(0, 0, 0, 0.1f);
            Color[] pixels = Enumerable.Repeat(background, width * height).ToArray();

            foreach (var platform in platforms)
            {
                float maxScore = 0f;
                foreach (var tile in platform.Tiles)
                {
                    maxScore = Mathf.Max(maxScore, scoreMap[tile.x, tile.y]);
                }

                Color platformColor = new Color(maxScore, maxScore, maxScore, 1f);
                foreach (var tile in platform.Tiles)
                {
                    int idx = tile.y * width + tile.x;
                    pixels[idx] = platformColor;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
        }


        public static Color RoleColor(RoomFlowType role)
        {
            return role switch
            {
                RoomFlowType.Leaf => Color.green,
                RoomFlowType.Corridor => Color.cyan,
                RoomFlowType.Hub => Color.yellow,
                RoomFlowType.Dead => Color.darkGoldenRod,
                RoomFlowType.Isolated => Color.red / 2f, //grey
                RoomFlowType.Small => Color.darkMagenta, // pinkish
                RoomFlowType.Micro => Color.purple, // purple
                _ => Color.white
            };
        }

        public static Color ScenarioRoleColor(ScenarioRole srole)
        {
            return srole switch
            {
                ScenarioRole.Undefined => Color.green,
                ScenarioRole.Central => Color.yellowNice,
                ScenarioRole.Lobby => Color.darkCyan,
                ScenarioRole.Road => Color.darkGreen,
                ScenarioRole.Satellite => Color.darkOrange,
                ScenarioRole.Branch => Color.darkMagenta, // pinkish
                _ => Color.gray7
            };
        }


        public static Texture2D GeneratePlatformScenarioRoleTexture(List<PlatformSeed> seed, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            Color background = new Color(0, 0, 0, 0.1f); // Light transparent background
            FillTexture(tex, background);

            
            foreach (var kvp in seed)
            {
                PlatformRole role = kvp.Role;

                Color color = ScenarioRoleColor(kvp.ScenarioRole);

                foreach (var p in kvp.Tiles)
                {
                    if (p.x >= 0 && p.y >= 0 && p.x < width && p.y < height)
                        tex.SetPixel(p.x, p.y, color);
                }

                // Optional white outline for edges
                foreach (var p in kvp.Tiles)
                {
                    foreach (var d in Directions.Cardinal)
                    {
                        Vector2Int n = p + d;
                        if (!kvp.Tiles.Contains(n))
                            tex.SetPixel(p.x, p.y, Color.white);
                    }
                }
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformRoleTexture(    List<PlatformSeed> seed,    int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            Color background = new Color(0, 0, 0, 0.1f); // Light transparent background
            FillTexture(tex, background);

            Dictionary<PlatformRole, Color> roleColors = new()
    {
        { PlatformRole.Main, Color.green / 1.5f },
        { PlatformRole.Transition, Color.blue / 1.5f },
        { PlatformRole.Auxiliary, Color.yellow / 1.5f },
        { PlatformRole.Fragment, Color.red / 1.5f }
    };

            foreach (var kvp in seed)
            {
                PlatformRole role = kvp.Role;

                Color color = roleColors.ContainsKey(role) ? roleColors[role] : Color.magenta;

                foreach (var p in kvp.Tiles)
                {
                    if (p.x >= 0 && p.y >= 0 && p.x < width && p.y < height)
                        tex.SetPixel(p.x, p.y, color);
                }

                // Optionally draw the center as a white dot
                DrawDot(tex, kvp.Center, 2, Color.white);
            }

            tex.Apply();
            return tex;
        }


        //can be used to other 0-1 textures
        public static Texture2D GenerateFlowScoreTexture(float[,] flowMap, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                {
                    float val = Mathf.Clamp01(flowMap[x, y]);
                    if(val == 0)
                        tex.SetPixel(x, y, new Color(val, val, val, 0.5f)); // grayscale
                    else
                        tex.SetPixel(x, y, new Color(val, val, val, 1f)); // grayscale
                }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePrunedGraphTexture(List<RoomCore> cores, List<CoreConnection> prunedEdges, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            Color baseColor = new Color(0, 0, 0, 0.1f);
            Color pathColor = Color.yellow;
            Color coreColor = Color.cyan;
            Color isolatedColor = Color.red;
            isolatedColor.a = 0.3f;
            pathColor.a = 0.7f;

            // Base fill
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, baseColor);

            // Draw paths
            foreach (var conn in prunedEdges)
            {
                foreach (var p in conn.Path)
                {
                    tex.SetPixel(p.x, p.y, pathColor);
                }
            }

            // Draw node dots
            var usedCores = new HashSet<RoomCore>();
            foreach (var conn in prunedEdges)
            {
                usedCores.Add(conn.From);
                usedCores.Add(conn.To);
            }

            foreach (var core in cores)
            {
                if (usedCores.Contains(core))
                {
                    var color = coreColor;
                    DrawDot(tex, core.Center, 2, color);
                }
                else
                {
                    var color = isolatedColor;
                    DrawDot(tex, core.Center, 1, color);
                }


            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformBlobTexture(List<PlatformBlob> blobs, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            tex.filterMode = FilterMode.Point;

            Color baseColor = new Color(0, 0, 0, 0.1f); // faint background
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    tex.SetPixel(x, y, baseColor);

            System.Random rng = new System.Random(1337);

            foreach (var blob in blobs)
            {
                Color c = new Color(
                    (float)rng.NextDouble() * 0.7f + 0.3f,
                    (float)rng.NextDouble() * 0.7f + 0.3f,
                    (float)rng.NextDouble() * 0.7f + 0.3f,
                    1f
                );

                foreach (var p in blob.Tiles)
                {
                    tex.SetPixel(p.x, p.y, c);
                }

                // Draw core with solid dot
                DrawDot(tex, blob.Core, 2, Color.white);
            }

            tex.Apply();
            return tex;
        }

        public static Texture2D GeneratePlatformSeedDebugTexture(    List<PlatformSeed> seeds, int width, int height)
        {
            Texture2D tex = new Texture2D(width, height);
            FillTexture(tex,new Color( 0,0,0,0.05f ) );

            Color[] palette = GenerateColorPalette(seeds.Count);

            for (int i = 0; i < seeds.Count; i++)
            {
                var seed = seeds[i];
                foreach (var p in seed.Tiles)
                {
                    tex.SetPixel(p.x, p.y, palette[i]/1.5f);
                }
                // optional: center dot
                DrawDot(tex, seed.Center, 1, Color.white);
            }

            tex.Apply();
            return tex;
        }



        // helper functions
        public static void LogFloodValidation(List<RoomFloodGroup> groups, int roomId)
        {
            Debug.Log($"Room {roomId}:");
            foreach (var group in groups)
            {
                string result = group.ReachedCore ? "REACHED CORE ✅" : "DID NOT REACH CORE ❌";
                Debug.Log($"  Entry @ {group.Entry} → {result} | Tiles: {group.Tiles.Count}");
            }

            bool needsSubdivision = groups.Any(g => !g.ReachedCore);
            if (needsSubdivision)
                Debug.Log($"  🔧 Subdivision required for Room {roomId}");
            else
                Debug.Log($"  ✅ Room {roomId} fully connected.");
        }

        public static void DrawLine(Texture2D tex, Vector2Int p0, Vector2Int p1, Color color)
        {
            int x0 = p0.x, y0 = p0.y;
            int x1 = p1.x, y1 = p1.y;

            int dx = Mathf.Abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
            int dy = -Mathf.Abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
            int err = dx + dy;

            while (true)
            {
                if (x0 >= 0 && x0 < tex.width && y0 >= 0 && y0 < tex.height)
                    tex.SetPixel(x0, y0, color);

                if (x0 == x1 && y0 == y1) break;
                int e2 = 2 * err;
                if (e2 >= dy) { err += dy; x0 += sx; }
                if (e2 <= dx) { err += dx; y0 += sy; }
            }
        }

        public static void DrawDot(Texture2D tex, Vector2Int center, int radius, Color color)
        {
            for (int dx = -radius; dx <= radius; dx++)
            {
                for (int dy = -radius; dy <= radius; dy++)
                {
                    int x = center.x + dx;
                    int y = center.y + dy;
                    if (x < 0 || x >= tex.width || y < 0 || y >= tex.height)
                        continue;

                    float dist = Mathf.Sqrt(dx * dx + dy * dy);
                    if (dist <= radius)
                    {
                        tex.SetPixel(x, y, color);
                    }
                }
            }
        }

        public static void FillTexture(Texture2D tex, Color color)
        {
            for (int x = 0; x < tex.width; x++)
                for (int y = 0; y < tex.height; y++)
                    tex.SetPixel(x, y, color);
        }

        public static Color[] GenerateColorPalette(int count)
        {
            Color[] colors = new Color[count];
            for (int i = 0; i < count; i++)
            {
                float hue = (i * 0.61803398875f) % 1f; // Golden ratio spacing
                colors[i] = Color.HSVToRGB(hue, 0.6f, 0.95f);
            }
            return colors;
        }


        public static List<List<Vector2Int>> GroupConnectedTransitions(    HashSet<Vector2Int> positions,    int width,    int height)
        {
            var visited = new HashSet<Vector2Int>();
            var groups = new List<List<Vector2Int>>();
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            foreach (var start in positions)
            {
                if (visited.Contains(start))
                    continue;

                var group = new List<Vector2Int>();
                var q = new Queue<Vector2Int>();
                q.Enqueue(start);
                visited.Add(start);

                while (q.Count > 0)
                {
                    var p = q.Dequeue();
                    group.Add(p);

                    foreach (var d in dirs)
                    {
                        Vector2Int np = p + d;
                        if (np.x < 0 || np.y < 0 || np.x >= width || np.y >= height) continue;
                        if (visited.Contains(np) || !positions.Contains(np)) continue;

                        visited.Add(np);
                        q.Enqueue(np);
                    }
                }

                groups.Add(group);
            }

            return groups;
        }

        public static float ComputeVisibilityPenalty(List<Vector2Int> path, float[,] visibilityMap, float weight)
        {
            float penalty = 0f;
            foreach (var p in path)
            {
                float shadowFactor = visibilityMap[p.x, p.y]; // 0 = clear, 1 = deep shadow
                penalty += shadowFactor * weight;
            }
            return penalty;
        }

        public static float[,] normalizeTextureMap(float[,] entryMap, int width, int height)
        {
            float maxV = float.MinValue;
            float minV = float.MaxValue;
            float[,] final = new float[width, height];
            final = entryMap;

            for(int i = 0; i < width; i++)
            {
                for (int j = 0; j < height; j++)
                {
                    if (entryMap[i, j] > maxV)
                        maxV = entryMap[i, j];
                    if (entryMap[i,j] < minV)
                        minV = entryMap[i,j];
                }
            }

            for (int i = 0; i < width; i++)
            {
                for (int j = 0; j < height; j++)
                {
                    final[i,j] = ( entryMap[i,j] - minV )/(maxV - minV) ;
                }
            }

            return final;
        }

        public static bool[,] FloatMapToBoolMask(float[,] flowMap, float threshold = 0.01f)
        {
            int width = flowMap.GetLength(0);
            int height = flowMap.GetLength(1);
            bool[,] result = new bool[width, height];

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    result[x, y] = flowMap[x, y] > threshold;
                }
            }

            return result;
        }

        public static Vector2Int countTiles(List<PlatformSeed> Roomseeds, List<PlatformSeed> Flowseeds)
        {
            Vector2Int result = Vector2Int.zero;

            foreach (var Rseed in Roomseeds)
            {
                result.x += Rseed.Tiles.Count;
            }

            foreach (var Fseed in Flowseeds)
            {
                result.y += Fseed.Tiles.Count;
            }


            return result;
        }

        public static class Directions
        {
            public static readonly Vector2Int[] Cardinal = new Vector2Int[]
            {
        Vector2Int.up,
        Vector2Int.down,
        Vector2Int.left,
        Vector2Int.right
            };

            public static readonly Vector2Int[] Diagonal = new Vector2Int[]
            {
        new Vector2Int(1, 1),
        new Vector2Int(1, -1),
        new Vector2Int(-1, 1),
        new Vector2Int(-1, -1)
            };

            public static readonly Vector2Int[] CardinalAndDiagonal = Cardinal.Concat(Diagonal).ToArray();
        }

    }


    public class PriorityQueue<T, TPriority> where TPriority : IComparable<TPriority>
    {
        private List<(T item, TPriority priority)> heap = new List<(T, TPriority)>();

        public int Count => heap.Count;

        public void Enqueue(T item, TPriority priority)
        {
            heap.Add((item, priority));
            BubbleUp(heap.Count - 1);
        }

        public T Dequeue()
        {
            if (heap.Count == 0)
                throw new InvalidOperationException("Queue is empty.");

            T item = heap[0].item;

            var last = heap[heap.Count - 1];
            heap.RemoveAt(heap.Count - 1);

            if (heap.Count > 0)
            {
                heap[0] = last;
                BubbleDown(0);
            }

            return item;
        }

        private void BubbleUp(int index)
        {
            while (index > 0)
            {
                int parent = (index - 1) / 2;
                if (heap[index].priority.CompareTo(heap[parent].priority) >= 0)
                    break;

                (heap[parent], heap[index]) = (heap[index], heap[parent]);
                index = parent;
            }
        }

        private void BubbleDown(int index)
        {
            int lastIndex = heap.Count - 1;

            while (true)
            {
                int left = index * 2 + 1;
                int right = index * 2 + 2;
                int smallest = index;

                if (left <= lastIndex && heap[left].priority.CompareTo(heap[smallest].priority) < 0)
                    smallest = left;
                if (right <= lastIndex && heap[right].priority.CompareTo(heap[smallest].priority) < 0)
                    smallest = right;

                if (smallest == index)
                    break;

                (heap[smallest], heap[index]) = (heap[index], heap[smallest]);
                index = smallest;
            }
        }
    }

    public static class WatershedGenerator
    {
        public static List<Room> WatershedSegmentation(
    float[,] slopeMap,
    SlopeType[,] slopeClassMap,
    int[,] terraceMap,
    float[,] heightMap,
    float heightTolerance = 0.05f,
    int minRoomSize = 5)
        {
            int width = slopeMap.GetLength(0);
            int height = slopeMap.GetLength(1);
            int[,] roomMap = new int[width, height];
            bool[,] visited = new bool[width, height];

            List<Room> rooms = new List<Room>();
            int currentRoomId = 1;
            int assignedTileCount = 0;

            Vector2Int[] directions = {
        Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right
    };

            HashSet<int> terraceLevels = new HashSet<int>();
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    terraceLevels.Add(terraceMap[x, y]);

            foreach (int terrace in terraceLevels)
            {
                for (int x = 1; x < width - 1; x++)
                {
                    for (int y = 1; y < height - 1; y++)
                    {
                        if (visited[x, y]) continue;
                        if (terraceMap[x, y] != terrace) continue;
                        if (slopeClassMap[x, y] != SlopeType.Flat) continue;
                        if (heightMap[x, y] <= 0f) continue; // VOID

                        Room room = new Room { Id = currentRoomId, Cells = new List<Vector2Int>() };
                        PriorityQueue<Vector2Int, float> queue = new PriorityQueue<Vector2Int, float>();
                        queue.Enqueue(new Vector2Int(x, y), slopeMap[x, y]);

                        while (queue.Count > 0)
                        {
                            Vector2Int pos = queue.Dequeue();
                            int px = pos.x, py = pos.y;

                            if (visited[px, py]) continue;
                            if (terraceMap[px, py] != terrace) continue;
                            if (slopeClassMap[px, py] != SlopeType.Flat) continue;
                            if (heightMap[px, py] <= 0f) continue; // VOID

                            visited[px, py] = true;
                            room.Cells.Add(pos);
                            roomMap[px, py] = currentRoomId;

                            foreach (var dir in directions)
                            {
                                int nx = px + dir.x;
                                int ny = py + dir.y;

                                if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                                    continue;

                                if (Mathf.Abs(heightMap[nx, ny] - heightMap[px, py]) > heightTolerance)
                                    continue;

                                if (!visited[nx, ny] &&
                                    terraceMap[nx, ny] == terrace &&
                                    slopeClassMap[nx, ny] == SlopeType.Flat &&
                                    heightMap[nx, ny] > 0f)
                                {
                                    queue.Enqueue(new Vector2Int(nx, ny), slopeMap[nx, ny]);
                                }
                            }
                        }

                        if (room.Cells.Count >= minRoomSize)
                        {
                            float total = 0f;
                            foreach (var cell in room.Cells)
                                total += heightMap[cell.x, cell.y];

                            room.AverageHeight = total / room.Cells.Count;
                            rooms.Add(room);
                            assignedTileCount += room.Cells.Count;
                            currentRoomId++;
                        }
                    }
                }
            }

            // Debug info
            int totalFlatTerrain = 0;
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    if (heightMap[x, y] > 0f && slopeClassMap[x, y] == SlopeType.Flat)
                        totalFlatTerrain++;

            int unassigned = totalFlatTerrain - assignedTileCount;

            Debug.Log($"Watershed complete: {rooms.Count} rooms, {assignedTileCount} tiles assigned.");
            Debug.Log($"Unassigned flat terrain tiles: {unassigned}");

            return rooms;
        }


    }

    public static class TrueWatershed
    {
        public static List<Room> WatershedFromHeightMinima(
            float[,] heightMap,
            SlopeType[,] slopeMap,
            float steepThreshold,
            out int[,] roomMap,
            int minimaRadius = 1,
            float heightTolerance = 0.01f,
            int minRoomSize = 5
            )
        {
            int width = heightMap.GetLength(0);
            int height = heightMap.GetLength(1);

            roomMap = new int[width, height];
            bool[,] visited = new bool[width, height];
            List<Vector2Int> seedPoints = FindLocalMinima(heightMap, minimaRadius);

            PriorityQueue<(Vector2Int pos, int seedId), float> queue = new PriorityQueue<(Vector2Int, int), float>();
            Dictionary<int, List<Vector2Int>> roomCells = new Dictionary<int, List<Vector2Int>>();
            int currentRoomId = 1;

            foreach (var seed in seedPoints)
            {
                int id = currentRoomId++;
                queue.Enqueue((seed, id), heightMap[seed.x, seed.y]);
                roomMap[seed.x, seed.y] = id;
                visited[seed.x, seed.y] = true;
                roomCells[id] = new List<Vector2Int> { seed };
            }

            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

            while (queue.Count > 0)
            {
                var (pos, seedId) = queue.Dequeue();
                int x = pos.x, y = pos.y;

                foreach (var dir in dirs)
                {
                    int nx = x + dir.x, ny = y + dir.y;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                        continue;

                    if (visited[nx, ny])
                        continue;

                    if (heightMap[nx, ny] <= 0f)
                        continue; // VOID

                    float slopeValue = slopeMap[nx, ny] == SlopeType.Steep ? steepThreshold + 1f : 0f;
                    if (slopeValue > steepThreshold)
                        continue;

                    if (Mathf.Abs(heightMap[nx, ny] - heightMap[x, y]) > heightTolerance)
                        continue;

                    visited[nx, ny] = true;
                    roomMap[nx, ny] = seedId;
                    roomCells[seedId].Add(new Vector2Int(nx, ny));

                    queue.Enqueue((new Vector2Int(nx, ny), seedId), heightMap[nx, ny]);
                }
            }

            // Construct rooms
            List<Room> rooms = new List<Room>();
            foreach (var kvp in roomCells)
            {
                int id = kvp.Key;
                List<Vector2Int> cells = kvp.Value;

                if (cells.Count < minRoomSize)
                    continue;

                float avgHeight = 0f;
                foreach (var cell in cells)
                    avgHeight += heightMap[cell.x, cell.y];

                avgHeight /= cells.Count;

                rooms.Add(new Room
                {
                    Id = id,
                    Cells = cells,
                    AverageHeight = avgHeight
                });
            }

            Debug.Log($"Watershed finished. {rooms.Count} rooms created.");

            return rooms;
        }

        private static List<Vector2Int> FindLocalMinima(float[,] heightMap, int radius)
        {
            int width = heightMap.GetLength(0);
            int height = heightMap.GetLength(1);
            List<Vector2Int> minima = new List<Vector2Int>();

            for (int x = radius; x < width - radius; x++)
            {
                for (int y = radius; y < height - radius; y++)
                {
                    float center = heightMap[x, y];
                    bool isMin = true;

                    for (int dx = -radius; dx <= radius && isMin; dx++)
                    {
                        for (int dy = -radius; dy <= radius; dy++)
                        {
                            if (dx == 0 && dy == 0) continue;
                            if (heightMap[x + dx, y + dy] < center)
                            {
                                isMin = false;
                                break;
                            }
                        }
                    }

                    if (isMin && center > 0f)
                        minima.Add(new Vector2Int(x, y));
                }
            }

            Debug.Log($"Found {minima.Count} local minima.");
            return minima;
        }
    }
}
