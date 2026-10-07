/*
 * SkeletonMeshmakerSDF.cs
 *
 * This script demonstrates a modular approach to generating room
 * geometry using platform seeds, weighted Voronoi pockets and
 * platform‑level height calculation.  It incorporates the height
 * formula supplied (terrace + micro steps) and sets up hooks for
 * creating bowl‑shaped room boundaries and smooth gate openings.  The
 * goal is to mirror some of the high‑level structure of Unexplored 2
 * (negative space, meaningful transitions) while keeping the data
 * representation (platform seeds) and algorithmic steps clear and
 * extensible.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using static BlkEvo.ProcGen.EDunProcGen;

namespace BlkEvo.ProcGen
{
    public class SkeletonMeshmakerSDF : MonoBehaviour
    {
        [Header("Input Data")]
        public GenStructuralData genDataAsset;
        public int microLevels = 5;
        public float microStep = 0.2f;
        public float terraceHeight = 10f;
        public float cakeStepHeight = 0.5f;
        public int cakeLevels = 5;
        public float platformSeparation = 2f;
        public float bowlHeight = 2f;
        [Header("Materials")]
        public Material platformMaterial;
        public Material wallMaterial;
        public Material gateMaterial;

        // Internal state
        private Dictionary<int, RoomData> rooms;
        private Dictionary<int, RoomPocket> pockets;
        private Dictionary<int, Dictionary<int, PlatformFootprint>> footprints;
        private List<int> criticalPath;

        private void Start()
        {
            GenerateDungeon();
        }

        public void GenerateDungeon()
        {
            if (genDataAsset == null || genDataAsset.allPlatforms.Count == 0)
            {
                Debug.LogError("No generation data asset assigned or it contains no platform seeds.");
                return;
            }
            LoadRooms();
            ComputeCriticalPath();
            ComputeVoronoiPockets();
            PackPlatformsIntoPockets();
            ComputePlatformHeights();
            BuildMeshes();
            Debug.Log("Generation complete.");
        }

        #region Loading and prep
        private void LoadRooms()
        {
            rooms = new Dictionary<int, RoomData>();
            footprints = new Dictionary<int, Dictionary<int, PlatformFootprint>>();
            foreach (var seed in genDataAsset.allPlatforms)
            {
                if (!rooms.ContainsKey(seed.RoomId))
                {
                    rooms[seed.RoomId] = new RoomData(seed.RoomId);
                    footprints[seed.RoomId] = new Dictionary<int, PlatformFootprint>();
                }
                rooms[seed.RoomId].platformSeeds.Add(seed);
                // Compute simple footprint as convex hull of tiles
                var foot = new PlatformFootprint();
                foot.seed = seed;
                foot.outline = ComputeConvexHull(seed.Tiles);
                footprints[seed.RoomId][seed.platformId] = foot;
            }
            foreach (var room in rooms.Values)
            {
                room.UpdateCentroid();
            }
            Debug.Log("Loaded " + rooms.Count + " rooms from GenData asset.");
        }

        private void ComputeCriticalPath()
        {
            criticalPath = rooms.Keys.OrderBy(k => UnityEngine.Random.value).Take(8).ToList();
            if (criticalPath.Count > 0)
            {
                rooms[criticalPath[0]].isEntry = true;
                rooms[criticalPath.Last()].isExit = true;
            }
            Debug.Log("Critical path selected with " + criticalPath.Count + " rooms.");
        }

        #endregion

        #region Voronoi and packing
        private void ComputeVoronoiPockets()
        {
            // Build weighted seeds from room centroids; extra noise seeds omitted for brevity
            var seeds = new List<VoronoiPartitioner.VoronoiSeed>();
            foreach (var room in rooms.Values)
            {
                float w = room.platformSeeds.Any(p => p.ScenarioRole == ScenarioRole.Lobby) ? 3f : 1f;
                seeds.Add(new VoronoiPartitioner.VoronoiSeed(room.id, room.centroid, w));
            }
            var bounds = new RectInt(0, 0, genDataAsset.heightMap.GetLength(0), genDataAsset.heightMap.GetLength(1));
            var assignment = VoronoiPartitioner.AssignVoronoiRegions(seeds, bounds);
            pockets = new Dictionary<int, RoomPocket>();
            foreach (var roomId in rooms.Keys)
            {
                var pocket = new RoomPocket();
                pocket.roomId = roomId;
                pocket.tiles = assignment.Where(kv => kv.Value == roomId).Select(kv => kv.Key).ToHashSet();
                // Compute a smoothed outline from the tiles (simplified)
                pocket.outline = ComputeConvexHull(pocket.tiles.ToList());
                pockets[roomId] = pocket;
            }
            Debug.Log("Voronoi pockets computed for rooms.");
        }

        private void PackPlatformsIntoPockets()
        {
            // Very simple packing: place lobby at its original position, then arrange
            // other platforms side by side from the pocket centroid outward.
            foreach (var roomId in criticalPath)
            {
                if (!pockets.ContainsKey(roomId)) continue;
                var pocket = pockets[roomId];
                var roomFootprints = footprints[roomId];
                // Determine fixed (lobby) and movable platforms
                var lobby = roomFootprints.Values.FirstOrDefault(f => f.seed.ScenarioRole == ScenarioRole.Lobby);
                List<PlatformFootprint> movable = roomFootprints.Values.Where(f => f.seed.ScenarioRole != ScenarioRole.Lobby).ToList();
                // Place lobby at its centre
                Vector2 lobbyPos = lobby != null ? lobby.seed.Center : pocket.centroid;
                pocket.platformPositions = new Dictionary<int, Vector2>();
                if (lobby != null)
                {
                    pocket.platformPositions[lobby.seed.platformId] = lobbyPos;
                }
                // Lay out other platforms in a line to the right of the lobby
                float offset = 0f;
                foreach (var fp in movable)
                {
                    pocket.platformPositions[fp.seed.platformId] = lobbyPos + new Vector2(offset + platformSeparation, 0f);
                    offset += fp.GetWidth();
                }
            }
            Debug.Log("Platforms packed into pockets.");
        }

        #endregion

        #region Height computation
        private void ComputePlatformHeights()
        {
            foreach (var roomId in criticalPath)
            {
                var room = rooms[roomId];
                // Compute average raw height per platform
                var avgs = new Dictionary<int, float>();
                float minA = float.MaxValue, maxA = float.MinValue;
                foreach (var ps in room.platformSeeds)
                {
                    float avg = ps.Tiles.Count > 0 ? ps.Tiles.Average(t => genDataAsset.heightbase.GetPixel(t.x, t.y).r) : 0f;
                    avgs[ps.platformId] = avg;
                    minA = Mathf.Min(minA, avg);
                    maxA = Mathf.Max(maxA, avg);
                }
                float range = Mathf.Max(0.0001f, maxA - minA);
                // Compute final heights using (TerraceLevel+1)*terraceHeight + quantised micro step
                foreach (var ps in room.platformSeeds)
                {
                    float norm = (avgs[ps.platformId] - minA) / range;
                    int q = Mathf.Clamp(Mathf.RoundToInt(norm * (microLevels - 1)), 0, microLevels - 1);
                    float micro = q * microStep;
                    ps.avgTileheight = (ps.TerraceId + 1) * terraceHeight + micro;
                }
            }
            Debug.Log("Platform heights computed.");
        }

        #endregion

        #region Mesh construction
        private void BuildMeshes()
        {
            foreach (var roomId in criticalPath)
            {
                var pocket = pockets[roomId];
                var room = rooms[roomId];
                var goRoom = new GameObject("Room_" + roomId);
                goRoom.transform.parent = this.transform;
                // Generate bowl/wall mesh from the pocket outline
                Mesh bowl = BuildBowlMesh(pocket.outline, bowlHeight);
                var mfBowl = goRoom.AddComponent<MeshFilter>();
                var mrBowl = goRoom.AddComponent<MeshRenderer>();
                mfBowl.mesh = bowl;
                if (wallMaterial != null) mrBowl.material = wallMaterial;
                // Generate each platform
                foreach (var ps in room.platformSeeds)
                {
                    // Skip empty seeds
                    if (ps.Tiles == null || ps.Tiles.Count == 0) continue;
                    var fp = footprints[roomId][ps.platformId];
                    Vector2 centre = pocket.platformPositions.ContainsKey(ps.platformId) ? pocket.platformPositions[ps.platformId] : room.centroid;
                    Mesh m = BuildPlatformMesh(fp.outline, ps.avgTileheight);
                    var goPlat = new GameObject("Room" + roomId + "_Plat" + ps.platformId);
                    goPlat.transform.parent = goRoom.transform;
                    var mf = goPlat.AddComponent<MeshFilter>();
                    var mr = goPlat.AddComponent<MeshRenderer>();
                    mf.mesh = m;
                    goPlat.transform.localPosition = new Vector3(centre.x, 0f, centre.y);
                    if (platformMaterial != null) mr.material = platformMaterial;
                }
                // TODO: Build gates between rooms along the critical path (not implemented here)
            }
            Debug.Log("Meshes built for all rooms.");
        }

        // Build a cylindrical or polygonal bowl from a 2D outline
        private Mesh BuildBowlMesh(List<Vector2> outline, float height)
        {
            // Create a simple extruded cylinder from outline with vertical walls
            var verts = new List<Vector3>();
            var tris = new List<int>();
            int n = outline.Count;
            // Bottom vertices
            for (int i = 0; i < n; i++) verts.Add(new Vector3(outline[i].x, 0f, outline[i].y));
            // Top vertices
            for (int i = 0; i < n; i++) verts.Add(new Vector3(outline[i].x, height, outline[i].y));
            // Side faces
            for (int i = 0; i < n; i++)
            {
                int j = (i + 1) % n;
                int b0 = i;
                int b1 = j;
                int t0 = i + n;
                int t1 = j + n;
                tris.AddRange(new int[] { b0, t0, t1, b0, t1, b1 });
            }
            // No top face to leave the bowl open
            var mesh = new Mesh();
            mesh.SetVertices(verts);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateNormals();
            return mesh;
        }

        // Build a flat platform mesh by triangulating its footprint and extruding walls down to 0
        private Mesh BuildPlatformMesh(List<Vector2> outline, float height)
        {
            // Triangulate using a simple fan (assumes convex outline)
            var verts = new List<Vector3>();
            var tris = new List<int>();
            int n = outline.Count;
            for (int i = 0; i < n; i++) verts.Add(new Vector3(outline[i].x, height, outline[i].y));
            // Top surface triangulation (fan from vertex 0)
            for (int i = 1; i < n - 1; i++)
            {
                tris.AddRange(new int[] { 0, i, i + 1 });
            }
            // Walls
            for (int i = 0; i < n; i++)
            {
                int j = (i + 1) % n;
                Vector3 b0 = new Vector3(outline[i].x, 0f, outline[i].y);
                Vector3 b1 = new Vector3(outline[j].x, 0f, outline[j].y);
                Vector3 t0 = verts[i];
                Vector3 t1 = verts[j];
                int idx = verts.Count;
                verts.Add(b0);
                verts.Add(b1);
                verts.Add(t0);
                verts.Add(t1);
                tris.AddRange(new int[] { idx + 2, idx + 0, idx + 1, idx + 2, idx + 1, idx + 3 });
            }
            Mesh m = new Mesh();
            m.SetVertices(verts);
            m.SetTriangles(tris, 0);
            m.RecalculateNormals();
            return m;
        }

        #endregion

        #region Helper classes
        private class RoomData
        {
            public int id;
            public List<PlatformSeed> platformSeeds = new List<PlatformSeed>();
            public Vector2 centroid;
            public bool isEntry;
            public bool isExit;
            public RoomData(int id) { this.id = id; }
            public void UpdateCentroid()
            {
                Vector2 sum = Vector2.zero;
                int count = 0;
                foreach (var ps in platformSeeds)
                {
                    foreach (var t in ps.Tiles) { sum += t; count++; }
                }
                centroid = count > 0 ? sum / count : Vector2.zero;
            }
        }

        private class RoomPocket
        {
            public int roomId;
            public HashSet<Vector2Int> tiles;
            public List<Vector2> outline;
            public Vector2 centroid { get { return outline != null && outline.Count > 0 ? outline.Aggregate(Vector2.zero, (a, b) => a + b) / outline.Count : Vector2.zero; } }
            public Dictionary<int, Vector2> platformPositions = new Dictionary<int, Vector2>();
        }

        private class PlatformFootprint
        {
            public PlatformSeed seed;
            public List<Vector2> outline;
            public float GetWidth()
            {
                if (outline.Count > 0)
                {
                    float minX = outline.Min(p => p.x);
                    float maxX = outline.Max(p => p.x);
                    return maxX - minX;
                }
                else
                    return 0;
                
            }
        }

        private static List<Vector2> ComputeConvexHull(List<Vector2Int> points)
        {
            // Monotone chain convex hull (returns points in counter‑clockwise order)
            var pts = points.Select(p => new Vector2(p.x, p.y)).Distinct().ToList();
            if (pts.Count <= 1) return pts;
            pts.Sort((a, b) => a.x == b.x ? a.y.CompareTo(b.y) : a.x.CompareTo(b.x));
            List<Vector2> lower = new List<Vector2>();
            foreach (var p in pts)
            {
                while (lower.Count >= 2 && Cross(lower[lower.Count - 2], lower[lower.Count - 1], p) <= 0) lower.RemoveAt(lower.Count - 1);
                lower.Add(p);
            }
            List<Vector2> upper = new List<Vector2>();
            for (int i = pts.Count - 1; i >= 0; i--)
            {
                var p = pts[i];
                while (upper.Count >= 2 && Cross(upper[upper.Count - 2], upper[upper.Count - 1], p) <= 0) upper.RemoveAt(upper.Count - 1);
                upper.Add(p);
            }
            lower.RemoveAt(lower.Count - 1);
            upper.RemoveAt(upper.Count - 1);
            lower.AddRange(upper);
            return lower;
        }
        private static float Cross(Vector2 o, Vector2 a, Vector2 b)
        {
            return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        }

        #endregion
    }
}