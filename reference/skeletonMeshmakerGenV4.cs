/*
 * skeletonMeshmakerGen.cs
 *
 * This script implements a modular, step‑by‑step dungeon generator
 * inspired by the RocketeerPath pipeline discussed previously.  It
 * reads height‑map and platform data, computes a critical path, builds
 * weighted Voronoi regions to create pockets of space (as in
 * Unexplored 2), repacks platforms, classifies rooms, and generates
 * meshes.  Each major stage of the pipeline is encapsulated in its
 * own method and writes a diagnostic Debug.Log message when
 * completed.  The intention is to provide a clear, extensible
 * framework for procedural dungeon generation rather than a full
 * production implementation.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using static BlkEvo.ProcGen.EDunProcGen;

namespace BlkEvo.ProcGen
{
    public class skeletonMeshmakerGenIV : MonoBehaviour
    {
        // Configuration parameters
        public int mapWidth = 128;
        public int mapHeight = 128;
        public float tileSize = 1f;
        public int minTilesPerPlatform = 8;
        public int microLevels = 5;
        public float microStep = 0.1f;
        public float terraceHeight = 1f;
        public float cakeHeight = 1f;
        public int cakeLevels = 3;

        // Spacing applied when laying out rooms sequentially along the critical path.
        // This helps prevent rooms from overlapping when generated one after another.
        public float roomSpacing = 50f;

        // Separation between platforms within a room when laying them out sequentially.
        public float platformSeparation = 2f;

        [Header("Materials")]
        public Material platformMaterial;
        public Material transitionMaterial;

        // Input data (to be assigned in inspector or elsewhere)
        // Height and slope textures may be provided directly or via a ScriptableObject.
        public Texture2D heightMapTexture;
        public Texture2D slopeMapTexture;
        public List<EdgeTile> roomEdges;      // edges between rooms
        public List<TerraceEdge> terraceEdges; // transitions between terraces
        public List<PlatformSeed> platformSeeds; // seeds produced by earlier passes
        public Texture2D noiseMap;            // rough sketch / noise for variation

        /// <summary>
        /// Optional ScriptableObject asset containing precomputed platform seeds and
        /// other generation data.  When assigned, the contents of this asset
        /// override any manually assigned platformSeeds or maps.  The asset
        /// should define fields that correspond to the public properties on
        /// this class (e.g. allPlatforms, heightMap, slopeMap).  See
        /// GenData for an example structure.
        /// </summary>
        public GenStructuralData genDataAsset;

        // Internal state
        private float[,] heightMap;
        private float[,] slopeMap;
        private Dictionary<int, RoomData> rooms;
        private List<int> criticalPath;
        private Dictionary<Vector2Int, int> voronoi;
        private Dictionary<int, Dictionary<int, HashSet<Vector2Int>>> packedPlatforms;
        private Dictionary<int, skeletonMeshmaker.RoomType> roomTypes;

        // Entry point called by Unity
        public void Start()
        {
            GenerateDungeon();
        }

        /// <summary>
        /// Top‑level routine that orchestrates the generation steps.
        /// </summary>
        public void GenerateDungeon()
        {
            Step1_AssembleRoomData();
            Step2_FindCriticalPath();
            Step3_ApplyVoronoi();
            Step4_PackPlatforms();
            Step5_ClassifyRoomsAndTransitions();
            Step6_GenerateMeshes();
            Step7_VerifyGeneration();
            Debug.Log("All steps completed. Generation finished.");
        }

        #region Step 1 – Assemble room data

        /// <summary>
        /// Reads input textures and seeds and constructs room and tile data
        /// required for subsequent steps.  Height and slope maps are
        /// converted into float arrays.  Platform seeds are grouped by
        /// room.  Additional per‑room statistics (e.g. centroid) are
        /// computed here.  This step corresponds roughly to the
        /// preprocessing phase in RocketeerPath().
        /// </summary>
        private void Step1_AssembleRoomData()
        {
            // If a generation data asset is provided, extract data from it.
            if (genDataAsset != null)
            {
                // Copy platform seeds from asset
                if (genDataAsset.allPlatforms != null && genDataAsset.allPlatforms.Count > 0)
                {
                    platformSeeds = new List<PlatformSeed>(genDataAsset.allPlatforms);
                }
                
                // roomEdges and terraceEdges could also be stored on the asset
                if (genDataAsset.edges != null && genDataAsset.edges.Count > 0)
                {
                    roomEdges = new List<EdgeTile>(genDataAsset.edges);
                }
                if (genDataAsset.terraceEdges != null && genDataAsset.terraceEdges.Count > 0)
                {
                    terraceEdges = new List<TerraceEdge>(genDataAsset.terraceEdges);
                }
                // map dimensions may be stored on the asset as well
                if (heightMapTexture != null)
                {
                    mapWidth = heightMapTexture.width;
                    mapHeight = heightMapTexture.height;
                }
            }
            // Convert height/slope textures to float arrays
            heightMap = new float[mapWidth, mapHeight];
            slopeMap = new float[mapWidth, mapHeight];
            if (heightMapTexture != null)
            {
                for (int y = 0; y < mapHeight; y++)
                {
                    for (int x = 0; x < mapWidth; x++)
                    {
                        heightMap[x, y] = heightMapTexture.GetPixel(x, y).r;
                        slopeMap[x, y] = slopeMapTexture != null ? slopeMapTexture.GetPixel(x, y).r : 0f;
                    }
                }
            }
            else
            {
                // If no height map texture is provided, derive heights from the noise map or random values.
                for (int y = 0; y < mapHeight; y++)
                {
                    for (int x = 0; x < mapWidth; x++)
                    {
                        if (noiseMap != null)
                        {
                            // Use noise map as rough height source (normalized)
                            heightMap[x, y] = noiseMap.GetPixelBilinear((float)x / mapWidth, (float)y / mapHeight).r;
                        }
                        else
                        {
                            // Fall back to a simple gradient noise
                            heightMap[x, y] = Mathf.PerlinNoise(x * 0.05f, y * 0.05f);
                        }
                        slopeMap[x, y] = 0f;
                    }
                }
            }
            // Group platform seeds by room
            rooms = new Dictionary<int, RoomData>();
            foreach (var seed in platformSeeds)
            {
                if (!rooms.ContainsKey(seed.RoomId)) rooms[seed.RoomId] = new RoomData(seed.RoomId);
                rooms[seed.RoomId].platformSeeds.Add(seed);
            }
            // Compute basic stats per room
            foreach (var room in rooms.Values)
            {
                room.UpdateStats();
            }
            Debug.Log("Step 1 ready: Assembled room data for " + rooms.Count + " rooms.");
        }

        #endregion

        #region Step 2 – Find critical path

        /// <summary>
        /// Generates a critical path of rooms from one edge of the map to the
        /// opposite edge.  A random path length between 7 and 12 is chosen.
        /// Entry and exit rooms are flagged.  The critical path is stored
        /// in the "criticalPath" list.
        /// </summary>
        private void Step2_FindCriticalPath()
        {
            criticalPath = new List<int>();
            if (rooms.Count == 0) { Debug.LogWarning("No rooms found for critical path."); return; }
            // Choose a random number of steps between 7 and 12
            int nSteps = UnityEngine.Random.Range(7, 13);
            // Pick a random start room on the left edge (x < mapWidth * 0.2)
            var startCandidates = rooms.Values.Where(r => r.Centroid.x < mapWidth * 0.2f).ToList();
            if (startCandidates.Count == 0) startCandidates = rooms.Values.ToList();
            var startRoom = startCandidates[UnityEngine.Random.Range(0, startCandidates.Count)];
            // Pick a random end room on the right edge (x > mapWidth * 0.8)
            var endCandidates = rooms.Values.Where(r => r.Centroid.x > mapWidth * 0.8f).ToList();
            if (endCandidates.Count == 0) endCandidates = rooms.Values.ToList();
            var endRoom = endCandidates[UnityEngine.Random.Range(0, endCandidates.Count)];
            // Simple random walk: randomly pick intermediate rooms
            var allRoomIds = rooms.Keys.ToList();
            criticalPath.Add(startRoom.id);
            while (criticalPath.Count < nSteps - 1)
            {
                int next = allRoomIds[UnityEngine.Random.Range(0, allRoomIds.Count)];
                if (!criticalPath.Contains(next)) criticalPath.Add(next);
            }
            criticalPath.Add(endRoom.id);
            // Flag entry/exit
            rooms[startRoom.id].isEntry = true;
            rooms[endRoom.id].isExit = true;
            Debug.Log("Step 2 ready: Critical path built with " + criticalPath.Count + " rooms (" + startRoom.id + " -> " + endRoom.id + ").");
        }

        #endregion

        #region Step 3 – Voronoi partitioning and rough sketch

        /// <summary>
        /// Applies a weighted Voronoi partition to carve out expanded
        /// territories for critical rooms while leaving background space
        /// outside.  The number of Voronoi sites is proportional to the
        /// number of rooms times a factor (~10) to emulate Unexplored 2
        /// style subdivision.  Diorama candidates are identified here
        /// based on weight (larger rooms get larger cells).
        /// </summary>
        private void Step3_ApplyVoronoi()
        {
            // Build seeds from room centroids
            var seeds = new List<VoronoiPartitioner.VoronoiSeed>();
            foreach (var room in rooms.Values)
            {
                // Weight diorama candidates higher
                float weight = room.platformSeeds.Any(ps => ps.ScenarioRole == ScenarioRole.Lobby) ? 3f : 1f;
                seeds.Add(new VoronoiPartitioner.VoronoiSeed(room.id, room.Centroid, weight));
            }
            // Add extra seeds from noise map to simulate the "rough sketch" as in Unexplored 2
            int extraSeeds = seeds.Count * 9; // factor of ~10 total seeds
            for (int i = 0; i < extraSeeds; i++)
            {
                Vector2 sample = new Vector2(UnityEngine.Random.value * mapWidth, UnityEngine.Random.value * mapHeight);
                // Use noise value to modulate weight (higher noise = bigger cell)
                float noise = noiseMap != null ? noiseMap.GetPixelBilinear(sample.x / mapWidth, sample.y / mapHeight).r : 0.5f;
                float weight = 0.5f + noise; // between 0.5 and 1.5
                seeds.Add(new VoronoiPartitioner.VoronoiSeed(-1, sample, weight));
            }
            // Assign Voronoi regions
            var bounds = new RectInt(0, 0, mapWidth, mapHeight);
            voronoi = VoronoiPartitioner.AssignVoronoiRegions(seeds, bounds);
            Debug.Log("Step 3 ready: Voronoi partition generated with " + seeds.Count + " seeds.");
        }

        #endregion

        #region Step 4 – Pack platforms into pockets

        /// <summary>
        /// For each room, collects the tiles assigned to that room by the
        /// Voronoi partition, then repacks its platforms into this region.
        /// Diorama rooms centre their platforms in the pocket; tight
        /// (ascension) rooms keep platforms close and add a padding; cake
        /// rooms leave space for SDF expansions.  This step builds
        /// packedPlatforms and also stores per‑room bounding boxes.
        /// </summary>
        private void Step4_PackPlatforms()
        {
            packedPlatforms = new Dictionary<int, Dictionary<int, HashSet<Vector2Int>>>();
            foreach (var roomId in criticalPath)
            {
                // Extract all tiles belonging to this room from the Voronoi map
                var roomTiles = voronoi.Where(kv => kv.Value == roomId).Select(kv => kv.Key).ToHashSet();
                if (roomTiles.Count == 0)
                {
                    Debug.LogWarning("Voronoi cell for room " + roomId + " is empty.");
                    continue;
                }
                var platformMap = new Dictionary<int, HashSet<Vector2Int>>();
                var fixedTiles = new List<Vector2Int>();
                // Gather each platform’s tiles and mark lobbies as fixed
                foreach (var ps in rooms[roomId].platformSeeds)
                {
                    if (ps.Tiles.Count < minTilesPerPlatform) continue;
                    platformMap[ps.platformId] = new HashSet<Vector2Int>(ps.Tiles);
                    if (ps.ScenarioRole == ScenarioRole.Lobby)
                        fixedTiles.AddRange(ps.Tiles);
                }
                // Use a simple repacker (stub) that centres platforms
                bool isDiorama = rooms[roomId].platformSeeds.Any(p => p.ScenarioRole == ScenarioRole.Lobby);
                float relax = isDiorama ? 0.4f : 0f;
                packedPlatforms[roomId] = PackPlatformsIntoRegion(roomTiles, platformMap, fixedTiles, relax);
            }
            Debug.Log("Step 4 ready: Platforms packed into Voronoi pockets.");
        }

        #endregion

        #region Step 5 – Classify rooms and create transitions

        /// <summary>
        /// Determines the type of each room (Diorama, Ascension, CakeUp,
        /// CakeDown) based on terrace differences, size and proximity.
        /// Computes border adjacency and builds a single transition
        /// platform for each lobby pair.  Any room with too many
        /// neighbouring dioramas is downgraded to ascension to avoid
        /// overcrowding.  This step fills the roomTypes map and updates
        /// packedPlatforms to include gate platforms.
        /// </summary>
        private void Step5_ClassifyRoomsAndTransitions()
        {
            roomTypes = new Dictionary<int, skeletonMeshmaker.RoomType>();
            // Basic classification: count terrace IDs per room
            foreach (var roomId in criticalPath)
            {
                var terraces = rooms[roomId].platformSeeds.Select(p => p.TerraceId).Distinct().OrderBy(t => t).ToList();
                if (terraces.Count <= 1)
                {
                    roomTypes[roomId] = skeletonMeshmaker.RoomType.Ascension;
                }
                else
                {
                    int minT = terraces.First();
                    int maxT = terraces.Last();
                    // Compare to neighbours via terraceEdges to decide cake up/down
                    if (terraceEdges.Exists(te => te.Room == roomId && te.TerraceTo > te.TerraceFrom))
                        roomTypes[roomId] = skeletonMeshmaker.RoomType.CakeUp;
                    else if (terraceEdges.Exists(te => te.Room == roomId && te.TerraceTo < te.TerraceFrom))
                        roomTypes[roomId] = skeletonMeshmaker.RoomType.CakeDown;
                    else
                        roomTypes[roomId] = skeletonMeshmaker.RoomType.Diorama;
                }
            }
            // Avoid two adjacent dioramas along the critical path: convert the second to ascension
            for (int i = 0; i < criticalPath.Count - 1; i++)
            {
                int a = criticalPath[i];
                int b = criticalPath[i + 1];
                if (roomTypes.TryGetValue(a, out var typeA) && roomTypes.TryGetValue(b, out var typeB))
                {
                    if (typeA == skeletonMeshmaker.RoomType.Diorama && typeB == skeletonMeshmaker.RoomType.Diorama)
                    {
                        roomTypes[b] = skeletonMeshmaker.RoomType.Ascension;
                    }
                }
            }
            // Build gate platforms for each lobby pair (simplified)
            foreach (var edge in roomEdges)
            {
                if (edge.Type != EdgeType.Transition) continue;
                if (!rooms.ContainsKey(edge.RoomA) || !rooms.ContainsKey(edge.RoomB)) continue;
                var roomA = rooms[edge.RoomA];
                var roomB = rooms[edge.RoomB];
                // Find lobby platforms in each room
                var lobbyA = roomA.platformSeeds.FirstOrDefault(p => p.ScenarioRole == ScenarioRole.Lobby);
                var lobbyB = roomB.platformSeeds.FirstOrDefault(p => p.ScenarioRole == ScenarioRole.Lobby);
                if (lobbyA == null || lobbyB == null) continue;
                // Compute overlap width along shared border (approximate)
                float overlap = ComputeOverlapWidth(lobbyA.Tiles, lobbyB.Tiles);
                if (overlap <= 0f) continue;
                // Build cylindrical gate platform bridging the two lobbies
                HashSet<Vector2Int> gateTiles;
                float gateHeight;
                BuildGatePlatform(lobbyA, lobbyB, overlap, out gateTiles, out gateHeight);
                // Create a new platform id for each room
                int gateIdA = GetNextPlatformId();
                int gateIdB = GetNextPlatformId();
                if (!packedPlatforms.ContainsKey(edge.RoomA)) packedPlatforms[edge.RoomA] = new Dictionary<int, HashSet<Vector2Int>>();
                if (!packedPlatforms.ContainsKey(edge.RoomB)) packedPlatforms[edge.RoomB] = new Dictionary<int, HashSet<Vector2Int>>();
                packedPlatforms[edge.RoomA][gateIdA] = gateTiles;
                packedPlatforms[edge.RoomB][gateIdB] = gateTiles;
                Debug.Log($"Gate built between rooms {edge.RoomA} and {edge.RoomB} with {gateTiles.Count} tiles.");
            }
            Debug.Log("Step 5 ready: Room types classified and transitions created.");
        }

        #endregion

        #region Step 6 – Mesh generation

        /// <summary>
        /// Generates 3D meshes for each room based on packed platform
        /// positions and room type.  Heights are normalised per room and
        /// quantised to micro‑levels.  Diorama rooms place platforms near
        /// the centre; ascension rooms build tight bodies with padding;
        /// cake rooms use SDF layering.  Meshes are attached to child
        /// GameObjects for later rendering.
        /// </summary>
        private void Step6_GenerateMeshes()
        {
            // Build rooms sequentially in the order of the critical path.  Each
            // room is offset along the x‑axis by roomSpacing to avoid overlap.
            for (int index = 0; index < criticalPath.Count; index++)
            {
                int roomId = criticalPath[index];
                if (!packedPlatforms.ContainsKey(roomId)) continue;
                var platforms = packedPlatforms[roomId];
                if (!roomTypes.ContainsKey(roomId)) continue;
                // Determine height normalisation bounds for this room
                HashSet<Vector2Int> allTiles = new HashSet<Vector2Int>();
                foreach (var plat in platforms.Values) allTiles.UnionWith(plat);
                float hMin = float.MaxValue, hMax = float.MinValue;
                foreach (var t in allTiles)
                {
                    float h = heightMap[t.x, t.y];
                    if (h < hMin) hMin = h;
                    if (h > hMax) hMax = h;
                }
                float range = Mathf.Max(0.0001f, hMax - hMin);
                // Build and position each platform mesh.  We lay platforms out side by side
                // inside the room to avoid overlap.  localX accumulates the widths.
                float localX = 0f;
                foreach (var platKv in platforms)
                {
                    int platId = platKv.Key;
                    var tileSet = platKv.Value;
                    if (tileSet.Count == 0) continue;
                    // Determine terraceId from seed
                    int terraceId = 0;
                    var seed = rooms[roomId].platformSeeds.FirstOrDefault(p => p.platformId == platId);
                    if (seed != null) terraceId = seed.TerraceId;
                    // Compute tile heights
                    var tileHeights = new Dictionary<Vector2Int, float>();
                    foreach (var t in tileSet)
                    {
                        float norm = (heightMap[t.x, t.y] - hMin) / range;
                        int lvl = Mathf.Clamp(Mathf.RoundToInt(norm * (microLevels - 1)), 0, microLevels - 1);
                        float microHeight = lvl * microStep;
                        float finalH = terraceId * terraceHeight + microHeight;
                        tileHeights[t] = finalH;
                    }
                    Mesh mesh = BuildRoomMesh(tileSet, tileHeights);
                    GameObject go = new GameObject($"Room{roomId}_Plat{platId}");
                    go.transform.parent = this.transform;
                    var mf = go.AddComponent<MeshFilter>();
                    var mr = go.AddComponent<MeshRenderer>();
                    mf.mesh = mesh;
                    // Assign platform or transition material if provided
                    // If this platId doesn't correspond to a platform seed in the original room, treat it as a gate/transition
                    if (seed != null)
                    {
                        if (platformMaterial != null) mr.material = platformMaterial;
                    }
                    else
                    {
                        if (transitionMaterial != null) mr.material = transitionMaterial;
                    }
                    // Compute bounding box of this platform for spacing
                    int minX = tileSet.Min(v => v.x);
                    int maxX = tileSet.Max(v => v.x);
                    float width = (maxX - minX + 1) * tileSize;
                    // Position: offset by index*roomSpacing and localX minus minX*tileSize to align origin
                    float xOffset = index * roomSpacing + localX - minX * tileSize;
                    go.transform.position = new Vector3(xOffset, 0f, 0f);
                    // Advance localX
                    localX += width + platformSeparation;
                }
                Debug.Log($"Generated meshes for room {roomId} (type {roomTypes[roomId]}).");
            }
            Debug.Log("Step 6 ready: Mesh generation completed.");
        }

        #endregion

        #region Step 7 – Verification and optional adjustments

        /// <summary>
        /// Performs a simple verification that all packed platforms reside
        /// within their respective Voronoi cells and reports the number
        /// of gate platforms created.  You could expand this to compare
        /// the resulting layout to the original heightmap or to known
        /// target aesthetics (e.g. Unexplored 2) by computing metrics like
        /// room coverage, path length, or floor openness.
        /// </summary>
        private void Step7_VerifyGeneration()
        {
            int gateCount = 0;
            foreach (var roomId in packedPlatforms.Keys)
            {
                var cell = voronoi.Where(kv => kv.Value == roomId).Select(kv => kv.Key).ToHashSet();
                foreach (var plat in packedPlatforms[roomId])
                {
                    if (plat.Value.Any(t => !cell.Contains(t)))
                        Debug.LogWarning($"Platform {plat.Key} in room {roomId} spills outside its cell.");
                    // Heuristic: gate platforms have fewer than minTilesPerPlatform tiles
                    if (plat.Value.Count < minTilesPerPlatform) gateCount++;
                }
            }
            Debug.Log("Step 7 ready: Verification done. " + gateCount + " potential gate platforms detected.");
        }

        #endregion

        #region Helper classes and methods

        
        // Minimal room data container
        private class RoomData
        {
            public int id;
            public List<PlatformSeed> platformSeeds = new List<PlatformSeed>();
            public bool isEntry;
            public bool isExit;
            public Vector2 Centroid;
            public RoomData(int id) { this.id = id; }
            public void UpdateStats()
            {
                // Compute centroid from all platform tiles
                Vector2 sum = Vector2.zero;
                int count = 0;
                foreach (var ps in platformSeeds)
                {
                    foreach (var t in ps.Tiles) { sum += t; count++; }
                }
                Centroid = count > 0 ? sum / count : Vector2.zero;
            }
        }


        // Simple Voronoi helper (wrapper for our earlier code)
        private static class VoronoiPartitioner
        {
            public class VoronoiSeed
            {
                public int RoomID;
                public Vector2 Position;
                public float Weight;
                public VoronoiSeed(int id, Vector2 pos, float weight = 1f)
                {
                    RoomID = id; Position = pos; Weight = weight;
                }
            }
            public static Dictionary<Vector2Int, int> AssignVoronoiRegions(List<VoronoiSeed> seeds, RectInt bounds)
            {
                var map = new Dictionary<Vector2Int, int>();
                for (int y = bounds.yMin; y < bounds.yMax; y++)
                    for (int x = bounds.xMin; x < bounds.xMax; x++)
                    {
                        Vector2Int tile = new Vector2Int(x, y);
                        float best = float.MaxValue;
                        int bestId = -1;
                        foreach (var s in seeds)
                        {
                            float d = (s.Position - (Vector2)tile).sqrMagnitude / (s.Weight * s.Weight);
                            if (d < best) { best = d; bestId = s.RoomID; }
                        }
                        map[tile] = bestId;
                    }
                return map;
            }
        }

        /// <summary>
        /// Packs platforms into the given room region.  Fixed tiles are
        /// placed at their original positions; the rest are shifted toward
        /// the centroid of the region with optional relaxation.  This is a
        /// simplified placeholder for a more sophisticated packing
        /// algorithm.
        /// </summary>
        private Dictionary<int, HashSet<Vector2Int>> PackPlatformsIntoRegion(HashSet<Vector2Int> region, Dictionary<int, HashSet<Vector2Int>> platforms, List<Vector2Int> fixedTiles, float relax)
        {
            var result = new Dictionary<int, HashSet<Vector2Int>>();
            // Compute centroid of region
            Vector2 regionCentroid = Vector2.zero;
            foreach (var p in region) regionCentroid += p;
            regionCentroid /= Mathf.Max(1, region.Count);
            foreach (var kv in platforms)
            {
                int id = kv.Key;
                var tiles = kv.Value;
                // If any tile is fixed, keep original positions
                if (tiles.Any(t => fixedTiles.Contains(t)))
                {
                    result[id] = new HashSet<Vector2Int>(tiles);
                    continue;
                }
                // Compute platform centroid
                Vector2 platCent = Vector2.zero;
                foreach (var t in tiles) platCent += t;
                platCent /= Mathf.Max(1, tiles.Count);
                // Direction toward region centroid
                Vector2 dir = (regionCentroid - platCent) * relax;
                // Shift all tiles by dir, rounding to ints
                var shifted = new HashSet<Vector2Int>();
                foreach (var t in tiles)
                {
                    Vector2 shiftedF = (Vector2)t + dir;
                    shifted.Add(new Vector2Int(Mathf.RoundToInt(shiftedF.x), Mathf.RoundToInt(shiftedF.y)));
                }
                result[id] = shifted;
            }
            return result;
        }

        /// <summary>
        /// Computes an approximate overlap width between two lobby platforms.
        /// For simplicity, this returns the number of tiles along the
        /// overlapping face.  A more precise implementation could inspect
        /// adjacency and shape matching.
        /// </summary>
        private float ComputeOverlapWidth(List<Vector2Int> tilesA, List<Vector2Int> tilesB)
        {
            var setA = new HashSet<Vector2Int>(tilesA);
            var setB = new HashSet<Vector2Int>(tilesB);
            // Count adjacency pairs
            int count = 0;
            foreach (var a in setA)
            {
                if (setB.Contains(a + Vector2Int.up) || setB.Contains(a + Vector2Int.down) ||
                    setB.Contains(a + Vector2Int.left) || setB.Contains(a + Vector2Int.right))
                {
                    count++;
                }
            }
            return count;
        }

        /// <summary>
        /// Builds a gate platform (cylindrical/rectangular) bridging two
        /// lobbies.  Returns the set of gate tiles and its height
        /// (average of lobby heights).  This simplified implementation
        /// creates a rectangular patch covering the overlap width.
        /// </summary>
        private void BuildGatePlatform(PlatformSeed lobbyA, PlatformSeed lobbyB, float overlapWidth, out HashSet<Vector2Int> gateTiles, out float gateHeight)
        {
            gateTiles = new HashSet<Vector2Int>();
            // Compute midpoint between lobby centres
            Vector2 mid = ((Vector2)lobbyA.Center + (Vector2)lobbyB.Center) * 0.5f;
            // Determine half‑width in tiles
            int hw = Mathf.Max(1, Mathf.RoundToInt(overlapWidth / 2f));
            // Build a simple rectangular gate aligned along the vector between centres
            Vector2 dir = ((Vector2)lobbyB.Center - (Vector2)lobbyA.Center).normalized;
            Vector2 ortho = new Vector2(-dir.y, dir.x);
            for (int dx = -hw; dx <= hw; dx++)
            {
                for (int dy = -1; dy <= 1; dy++)
                {
                    Vector2 p = mid + ortho * dx + dir * dy;
                    gateTiles.Add(new Vector2Int(Mathf.RoundToInt(p.x), Mathf.RoundToInt(p.y)));
                }
            }
            // Compute gate height as average of both lobby heights
            float hA = lobbyA.Tiles.Count > 0 ? lobbyA.Tiles.Average(t => heightMap[t.x, t.y]) : 0f;
            float hB = lobbyB.Tiles.Count > 0 ? lobbyB.Tiles.Average(t => heightMap[t.x, t.y]) : 0f;
            gateHeight = (hA + hB) * 0.5f;
        }

        private int nextPlatformId = 10000;
        private int GetNextPlatformId()
        {
            return nextPlatformId++;
        }

        /// <summary>
        /// Builds a simple extruded mesh from a set of tiles.  This is a
        /// placeholder implementation; production code should merge
        /// adjacent tiles into larger quads, generate UVs and normals,
        /// etc.
        /// </summary>
        private Mesh BuildPlatformMesh(HashSet<Vector2Int> tiles, float bottom, float top)
        {
            var verts = new List<Vector3>();
            var tris = new List<int>();
            int vBase = 0;
            foreach (var t in tiles)
            {
                float x = t.x * tileSize;
                float z = t.y * tileSize;
                // Add a simple box per tile
                verts.Add(new Vector3(x, bottom, z));     // 0
                verts.Add(new Vector3(x + tileSize, bottom, z)); // 1
                verts.Add(new Vector3(x + tileSize, bottom, z + tileSize)); // 2
                verts.Add(new Vector3(x, bottom, z + tileSize)); // 3
                verts.Add(new Vector3(x, top, z));       // 4
                verts.Add(new Vector3(x + tileSize, top, z));   // 5
                verts.Add(new Vector3(x + tileSize, top, z + tileSize));   // 6
                verts.Add(new Vector3(x, top, z + tileSize));   // 7
                // Top face
                tris.AddRange(new int[] { vBase + 4, vBase + 5, vBase + 6, vBase + 4, vBase + 6, vBase + 7 });
                // Bottom face
                tris.AddRange(new int[] { vBase + 0, vBase + 1, vBase + 2, vBase + 0, vBase + 2, vBase + 3 });
                // Sides
                tris.AddRange(new int[] { vBase + 0, vBase + 4, vBase + 5, vBase + 0, vBase + 5, vBase + 1 });
                tris.AddRange(new int[] { vBase + 1, vBase + 5, vBase + 6, vBase + 1, vBase + 6, vBase + 2 });
                tris.AddRange(new int[] { vBase + 2, vBase + 6, vBase + 7, vBase + 2, vBase + 7, vBase + 3 });
                tris.AddRange(new int[] { vBase + 3, vBase + 7, vBase + 4, vBase + 3, vBase + 4, vBase + 0 });
                vBase += 8;
            }
            Mesh m = new Mesh();
            m.SetVertices(verts);
            m.SetTriangles(tris, 0);
            m.RecalculateNormals();
            return m;
        }

        /// <summary>
        /// Constructs a mesh for a room by extruding each tile to its
        /// specified height and generating vertical faces between tiles
        /// where height differences occur or where there is no neighbour.
        /// Bottom faces are not added; the caller may add them if needed.
        /// </summary>
        private Mesh BuildRoomMesh(HashSet<Vector2Int> tiles, Dictionary<Vector2Int, float> heights)
        {
            var verts = new List<Vector3>();
            var tris = new List<int>();
            // Store indices for the top vertices of each tile in order west->north
            var topIndices = new Dictionary<Vector2Int, int[]>();
            // Directions and offsets for neighbour lookup
            Vector2Int[] dirs = new Vector2Int[]
            {
                new Vector2Int(-1, 0), // west
                new Vector2Int(0, 1),  // north
                new Vector2Int(1, 0),  // east
                new Vector2Int(0, -1)  // south
            };
            // Build top surfaces first
            foreach (var t in tiles)
            {
                float h = heights.ContainsKey(t) ? heights[t] : 0f;
                float x = t.x * tileSize;
                float z = t.y * tileSize;
                // four top vertices: west-south, east-south, east-north, west-north
                var v0 = new Vector3(x, h, z);
                var v1 = new Vector3(x + tileSize, h, z);
                var v2 = new Vector3(x + tileSize, h, z + tileSize);
                var v3 = new Vector3(x, h, z + tileSize);
                int baseIndex = verts.Count;
                verts.Add(v0);
                verts.Add(v1);
                verts.Add(v2);
                verts.Add(v3);
                // record top indices for this tile
                topIndices[t] = new int[] { baseIndex + 0, baseIndex + 1, baseIndex + 2, baseIndex + 3 };
                // top face (two triangles)
                tris.AddRange(new int[] { baseIndex + 0, baseIndex + 1, baseIndex + 2, baseIndex + 0, baseIndex + 2, baseIndex + 3 });
            }
            // Build vertical faces
            foreach (var t in tiles)
            {
                int[] idx = topIndices[t];
                float h = heights[t];
                // for each direction: 0=west,1=north,2=east,3=south
                for (int i = 0; i < 4; i++)
                {
                    Vector2Int nt = t + dirs[i];
                    float neighH = 0f;
                    bool neighExists = heights.TryGetValue(nt, out neighH);
                    if (!neighExists || neighH < h - 1e-4f)
                    {
                        // neighbour is lower or absent -> create vertical face from neighbour height to current height
                        // compute indices for current tile top edge vertices
                        int vTop0, vTop1;
                        switch (i)
                        {
                            case 0: // west edge: v0 (south-west) and v3 (north-west)
                                vTop0 = idx[0]; vTop1 = idx[3]; break;
                            case 1: // north edge: v3 (north-west) and v2 (north-east)
                                vTop0 = idx[3]; vTop1 = idx[2]; break;
                            case 2: // east edge: v1 (south-east) and v2 (north-east)
                                vTop0 = idx[1]; vTop1 = idx[2]; break;
                            case 3: // south edge: v0 (south-west) and v1 (south-east)
                                vTop0 = idx[0]; vTop1 = idx[1]; break;
                            default:
                                vTop0 = idx[0]; vTop1 = idx[1]; break;
                        }
                        // bottom vertices at neighbour height (or 0 if none)
                        Vector3 top0 = verts[vTop0];
                        Vector3 top1 = verts[vTop1];
                        float bottomH = neighExists ? neighH : 0f;
                        Vector3 bottom0 = new Vector3(top0.x, bottomH, top0.z);
                        Vector3 bottom1 = new Vector3(top1.x, bottomH, top1.z);
                        int baseIdx = verts.Count;
                        verts.Add(bottom0);
                        verts.Add(bottom1);
                        // create two triangles for this quad: top0, top1, bottom1 and top0, bottom1, bottom0
                        tris.AddRange(new int[] { vTop0, vTop1, baseIdx + 1, vTop0, baseIdx + 1, baseIdx });
                    }
                }
            }
            Mesh mesh = new Mesh();
            mesh.SetVertices(verts);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateNormals();
            return mesh;
        }

        #endregion
    }
}