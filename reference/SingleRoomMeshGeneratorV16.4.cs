using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using UnityEditor;
using UnityEngine;
using static BlkEvo.ProcGen.EDunProcGen;

/// <summary>
///     This helper class demonstrates how to generate an individual room mesh
///     based off the same primitives that the original skeletonMeshmaker uses.
///     The intent is to walk step–by–step through a single room: build the
///     landmass out of platforms, generate optional cake‑down layers via
///     dilation, place a transition platform, build the enclosing walls and
///     finally wrap everything in a bowl.  It is deliberately modular so
///     that callers can invoke or override each stage separately.
///
///     NOTE: This file is a standalone demonstration and does not depend on
///     external libraries such as Clipper.  It reuses core routines from
///     skeletonMeshmaker (Dilate, ChaikinSmooth, ExtrudeBorder, etc.).
///     You should attach this script to an empty GameObject in your Unity
///     scene and call GenerateRoom() in the Start() method or via the
///     Inspector to see the results.  All generated meshes are parented
///     under this GameObject for easy inspection.
///
///     Limitations:
///     ‑ This script focuses on one room at a time.  It does not handle
///       neighbours or gateway alignment.  Instead, it demonstrates how
///       micro levels, cake layers and walls can be generated without
///       scattering platforms.  You would still need to coordinate wall
///       cuts across rooms externally.
/// </summary>
public class SingleRoomMeshGeneratorV164 : MonoBehaviour
{
    [Header("Room input data")]
    public List<List<Vector2Int>> platformTilesPerRoom = new List<List<Vector2Int>>();
    public List<int> terraceLevels = new List<int>();

    // Additional data for classification and transitions
    [Tooltip("Room identifier (needed to classify connections via EdgeTile)")]
    public int roomId = -1;
    [Tooltip("List of all edge tiles; only those relevant to this room will be used for classification")]
    public List<EdgeTile> edgeTiles;
    [Tooltip("Original platform seeds for this room; needed to inspect ScenarioRole and other metadata")] public List<PlatformSeed> platformSeeds;
    public int microLevels = 6;
    public float microStep = 5f;
    public float terraceHeight = 100f;
    public int cakeLayers = 3;
    public float cakeStepHeight = 30f;
    public int dilationPerLayer = 1;
    public float tileSize = 10f;
    // Spawn all rooms instead of a single random one
    [SerializeField] private bool spawnAllRooms = false;

    public LayerMask cylinderMask;
    public LayerMask wallMask;
    public GameObject stairPrefab;

    [Header("Materials")] public Material floorMat;
    public Material wallMat;
    [Tooltip("Material used for transition (lobby) platforms")] public Material transitionMat;
    public int MeshRes = 8;

    [Header("Smoothing & Bowl")] public int chaikinIterations = 3;
    public float outlineOffset = 0.5f;
    public float bowlHeight = 70.0f;

    [Header("Room type offsets")]
    [Tooltip("Wall offset for cake rooms (donut/bowl)")]
    public float cakeOffset = -5.0f;
    [Tooltip("Wall offset for diorama rooms (loose pockets)")]
    public float dioramaOffset = -20.0f;
    [Tooltip("Wall offset for ascension/tight rooms")]
    public float ascensionOffset = 0.5f;
    [Tooltip("If true, cake rooms layer from top down (bowl).  Otherwise layers grow upward (pyramid).")]
    public bool isCakeDown = true;
    public int biasMoat = 0;
    [Tooltip("corePad >= 1 guarantees L0 is a donut, not the plateau")]
    public int corePad = 0;

    // The global terrain edges for this build pass
    [HideInInspector] public List<TerraceEdge> terrainEdges;



    [Header("Pocket settings")]
    [Tooltip("Number of tiles to dilate the union footprint to create a pocket mask for SDF")]
    public int pocketRadius = 40;

    [Header("-- Transition-bridge prototype --")]
    public bool enableTransitions = true;        // master toggle
    public float transitionCutHeight = 0f;          // 0 = auto (platformTop + microStep)
    public float raypushout = 0.5f;
    [SerializeField, HideInInspector] string _transitionDebugInfo;
    [Min(1)] public int borderDepth = 1;     // how many tile-rings from the edge we accept
    [Min(0.5f)] public float minDoorDiameter = 1.0f;  // fallback if strip is tiny
    public bool clampDoorWidth = true;             // reduce oversize doors
    [Min(1f)] public float maxDoorDiameter = 4.0f;  // only used if clampDoorWidth = true

    // --- Cake pass knobs ---
    [Header("Cake Pass Tweaks")]
    [SerializeField] private int SeamWindowRadiusCells = 5;   // 2..4 is sane
    [SerializeField] private int CoreNearRadiusCells = 4;   // tiles around seam to sample core
    [SerializeField] private int MinSeamEdgeTiles = 1;   // skip links with too few edge points
    [SerializeField] private int MinRingTiles = 1;   // sliver guard per ring (in tiles)


    [SerializeField]
    [HideInInspector]
    private Vector3 raystart = Vector3.zero;
    // pass-1 → pass-2 handoff
    private  Dictionary<int, RoomCakeWorkItem> _pendingCakes = new();


    private enum CakeDirection { Flat, Up, Down }

    #region Ascension tight wall helpers (copied from provided code)
    // Build tight walls and floor around a landmass.  Returns (wall, floor) meshes.
    public static (Mesh, Mesh) BuildTightPlatformWalls(
        HashSet<Vector2Int> walkableTiles,
        float tileSize,
        float wallHeight,
        HashSet<Vector2Int> edgeTiles = null,
        float borderSmooth = 0.05f, // small for tight wall
        int smoothIters = 1)
    {
        var edgesList = ExtractBorderEdges(walkableTiles, tileSize);
        var rawLoop = BuildLoopUndirected(edgesList);
        if (rawLoop == null || rawLoop.Count < 3) return (null, null);
        var smoothed = ChaikinSmooth(rawLoop, smoothIters);
        // Only a tiny offset
        var norms = ComputeNormals2D(smoothed);
        var offset = smoothed.Select((p, i) => p + norms[i] * borderSmooth).ToList();
        Mesh wallMesh = ExtrudeWallPolylineV2(offset, wallHeight, edgeTiles, 1);
        Mesh floor = PolygonToMesh(offset, y: wallHeight);
        return (wallMesh, floor);
    }

    static Mesh ExtrudeWallPolylineV2(List<Vector2> poly, float wallHeight, HashSet<Vector2Int> portals = null, float portalWidth = 1f)
    {
        int n = poly.Count;
        var verts = new List<Vector3>();
        var tris = new List<int>();
        int vtx = 0;
        for (int i = 0; i < n; i++)
        {
            Vector2 p0 = poly[i];
            Vector2 p1 = poly[(i + 1) % n];
            // Portal logic: skip wall segment if near a portal position
            if (portals != null && ShouldSkipWallSegment(p0, p1, portals, portalWidth))
                continue;
            verts.Add(new Vector3(p0.x, 0f, p0.y));
            verts.Add(new Vector3(p1.x, 0f, p1.y));
            verts.Add(new Vector3(p1.x, wallHeight, p1.y));
            verts.Add(new Vector3(p0.x, wallHeight, p0.y));
            tris.AddRange(new[] { vtx + 0, vtx + 1, vtx + 2, vtx + 0, vtx + 2, vtx + 3 });
            vtx += 4;
        }
        Mesh mesh = new Mesh();
        mesh.SetVertices(verts);
        mesh.SetTriangles(tris, 0);
        mesh.RecalculateNormals();
        return mesh;
    }

    // Distance from a point to segment
    public static float DistancePointToSegment(Vector2 point, Vector2 a, Vector2 b)
    {
        Vector2 ab = b - a;
        Vector2 ap = point - a;
        float t = Vector2.Dot(ap, ab) / ab.sqrMagnitude;
        t = Mathf.Clamp01(t);
        Vector2 closest = a + t * ab;
        return Vector2.Distance(point, closest);
    }

    // Check if wall segment should be skipped due to portal
    public static bool ShouldSkipWallSegment(Vector2 p0, Vector2 p1, HashSet<Vector2Int> portals, float tol = 0.7f)
    {
        foreach (var portal in portals)
            if (DistancePointToSegment(portal, p0, p1) < tol)
                return true;
        return false;
    }

    static Mesh PolygonToMesh(List<Vector2> poly, float y = 0f)
    {
        if (poly.Count < 3) return null;
        var verts = poly.Select(v => new Vector3(v.x, y, v.y)).ToList();
        var tris = new List<int>();
        for (int i = 1; i < poly.Count - 1; i++)
            tris.AddRange(new[] { 0, i, i + 1 });
        Mesh mesh = new Mesh();
        mesh.SetVertices(verts);
        mesh.SetTriangles(tris, 0);
        mesh.RecalculateNormals();
        return mesh;
    }

    /// <summary>
    ///     Build multiple closed loops from an unordered list of border edges.  A set
    ///     of tiles that forms a ring (i.e. has holes) will produce two loops: one for
    ///     the outer boundary and one for each inner boundary.  This helper walks
    ///     through all segments, building each closed loop and removing used
    ///     segments until none remain.
    /// </summary>
    private static List<List<Vector2>> BuildLoops(List<(Vector2 a, Vector2 b)> segs)
    {
        var loops = new List<List<Vector2>>();
        var edges = new List<(Vector2, Vector2)>(segs);
        const float eps = 1e-4f;
        while (edges.Count > 0)
        {
            // Start from the first segment
            var (start, end) = edges[0];
            edges.RemoveAt(0);
            var loop = new List<Vector2>();
            loop.Add(start);
            Vector2 current = end;
            // Build loop by following connected segments
            while (true)
            {
                loop.Add(current);
                int foundIndex = -1;
                Vector2 next = current;
                // Find a segment that connects to current
                for (int i = 0; i < edges.Count; i++)
                {
                    var (ea, eb) = edges[i];
                    if ((ea - current).sqrMagnitude < eps)
                    {
                        next = eb;
                        foundIndex = i;
                        break;
                    }
                    if ((eb - current).sqrMagnitude < eps)
                    {
                        next = ea;
                        foundIndex = i;
                        break;
                    }
                }
                if (foundIndex >= 0)
                {
                    // Remove used edge
                    edges.RemoveAt(foundIndex);
                    // Check if loop is closed
                    if ((next - loop[0]).sqrMagnitude < eps)
                    {
                        // Add the closing vertex and finish
                        // Do not add duplicate start vertex again
                        loops.Add(loop);
                        break;
                    }
                    else
                    {
                        current = next;
                    }
                }
                else
                {
                    // No connecting edge found – finish this open loop
                    loops.Add(loop);
                    break;
                }
            }
        }
        return loops;
    }

    /// <summary>
    ///     Tessellate a polygon outline with holes into a Mesh using a
    ///     temporary PolygonCollider2D.  The first loop is treated as the
    ///     outer boundary, and any additional loops are treated as holes.  The
    ///     resulting mesh is returned in XY plane.
    /// </summary>
    private static Mesh TessellateWithCollider2D(List<List<Vector2>> loops)
    {
        if (loops == null || loops.Count == 0)
            return null;
        // Create a temporary GameObject with PolygonCollider2D
        var go = new GameObject("TempPolyCollider", typeof(PolygonCollider2D));
        var collider = go.GetComponent<PolygonCollider2D>();
        collider.pathCount = loops.Count;
        for (int i = 0; i < loops.Count; i++)
        {
            collider.SetPath(i, loops[i].ToArray());
        }
        // Bake a mesh from collider (note: this triangulates with holes)
        Mesh mesh = collider.CreateMesh(false, false);
        GameObject.DestroyImmediate(go);
        return mesh;
    }

    #endregion



    // Helper to call generation from the inspector
    [ContextMenu("GenerateRoom")]
    public void GenerateRoom(bool clearChildren = false)
    {
        // Clear children from previous runs
        if (clearChildren)
        {
            for (int i = transform.childCount - 1; i >= 0; i--)
            {
                DestroyImmediate(transform.GetChild(i).gameObject);
            }
        }
        _pendingCakes.Clear();

        if (microStep * microLevels > terraceHeight)
        {
            Debug.Log("micro step too large, reducing...");
            microStep = (terraceHeight + 1f) / (float)microLevels;
        }

        // Step 1: build the landmass as a union of all platform tiles
        var allTiles = new HashSet<Vector2Int>();
        foreach (var plat in platformTilesPerRoom)
        {
            foreach (var t in plat)
            {
                allTiles.Add(t);
            }
        }
        if (allTiles.Count == 0)
        {
            Debug.LogWarning("No tiles assigned.");
            return;
        }

        Dictionary<int, List<int>> roomcounttypesOfHeight = new Dictionary<int, List<int>>();
        foreach (var ps in platformSeeds)
        {
            if (roomcounttypesOfHeight.ContainsKey(ps.RoomId))
            {
                if (!roomcounttypesOfHeight[ps.RoomId].Contains(ps.TerraceId))
                {
                    roomcounttypesOfHeight[ps.RoomId].Add((int)ps.TerraceId);
                }
            }
            else //when the room is not added
            {
                roomcounttypesOfHeight.Add(ps.RoomId, new List<int>() { ps.TerraceId });
            }
        }

        // Step 2: compute per‑platform heights according to terrace and micro‑level
        var platformHeights = new float[platformTilesPerRoom.Count];
        if (platformTilesPerRoom.Count != terraceLevels.Count)
        {
            Debug.LogWarning("Platform list and terrace level list length mismatch.");
        }

        // Normalise the average height within this room so that the lowest platform is 0 and the highest is 1
        var averages = new List<float>();
        for (int i = 0; i < platformTilesPerRoom.Count; i++)
        {
            var tiles = platformTilesPerRoom[i];
            if (tiles.Count == 0)
            {
                averages.Add(0f);
                continue;
            }
            // For demonstration, derive a pseudo height from x+y coordinates – replace with a height map in production
            float sum = 0f;
            foreach (var t in tiles)
            {
                sum += (t.x + t.y) / (float)(allTiles.Count);
            }
            averages.Add(sum / tiles.Count);
        }
        float minAvg = averages.Count > 0 ? averages.Min() : 0f;
        float maxAvg = averages.Count > 0 ? averages.Max() : 1f;
        float eps = Mathf.Max(0.0001f, microStep * 0.01f);  // tiny margin
        for (int i = 0; i < averages.Count; i++)
        {
            float norm = (maxAvg - minAvg > 1e-4f) ? ((averages[i] - minAvg) / (maxAvg - minAvg)) : 0f;
            // Quantise micro level
            // q in [0..microLevels-1]
            int q = (microLevels > 1) ? Mathf.RoundToInt(norm * (microLevels - 1)) : 0;
            float microHeight = q * microStep;

            // Keep the top inside the terrace band
            float baseTop = ((terraceLevels.Count > i ? terraceLevels[i] : 0) + 1) * terraceHeight;
            float H = baseTop + microHeight;

            // Clamp to [bandMinTop, bandMaxTop)
            var (bandMinTop, bandMaxTop) = TopBand(terraceLevels.Count > i ? terraceLevels[i] : 0, terraceHeight);
            H = Mathf.Clamp(H, bandMinTop + eps, bandMaxTop - eps);

            platformHeights[i] = H;




        }



        // Step 3: optionally create cake layers if specified.
        // Cake layers should wrap only those platforms whose terrace level differs
        // from the dominant terrace of the room.  This produces a donut‑like
        // structure around the secondary terraces rather than covering the
        // entire union footprint.
        // Step 3 (inside your existing block)
        var unionFootprint = new HashSet<Vector2Int>(allTiles);
        var cakeLayerSets = new List<HashSet<Vector2Int>>();

        // --- Decide cake direction BEFORE generating layer sets ---
        // --- Decide cake direction BEFORE generating layer sets (you already do this) ---
        var cakeDirSEL = DetectCakeDirection(platformSeeds, edgeTiles, roomId);
        if (cakeDirSEL != CakeDirection.Flat) isCakeDown = (cakeDirSEL == CakeDirection.Down);

        // core-terrace for footprints
        int lowTerrSEL = terraceLevels.Min();
        int highTerrSEL = terraceLevels.Max();
        int coreTerrSEL = isCakeDown ? lowTerrSEL : highTerrSEL;

        // collect core tiles ON the core terrace
        var cakeCoreSEL = new HashSet<Vector2Int>();
        for (int i = 0; i < platformTilesPerRoom.Count; i++)
            if (i < terraceLevels.Count && terraceLevels[i] == coreTerrSEL)
                foreach (var v in platformTilesPerRoom[i]) cakeCoreSEL.Add(v);

        // pocket mask (room footprint dilated a bit)
        var pocketMaskSEL = new HashSet<Vector2Int>(allTiles);
        for (int k = 0; k < pocketRadius; k++) pocketMaskSEL = Dilate(pocketMaskSEL, 1);

        if (cakeLayers > 0 && cakeCoreSEL.Count > 0)
        {
            if (isCakeDown)
            {
                // ✅ your existing, working bowl generator
                cakeLayerSets = GenerateCakeDownLayersV2(cakeCoreSEL, pocketMaskSEL, cakeLayers, dilationPerLayer);
            }
            else
            {
                var lowTerrTiles = new HashSet<Vector2Int>();
                for (int i = 0; i < platformTilesPerRoom.Count; i++)
                    if (i < terraceLevels.Count && terraceLevels[i] < coreTerrSEL)
                        foreach (var v in platformTilesPerRoom[i]) lowTerrTiles.Add(v);


                // require at least 1 tile closer to HIGH than LOW
                cakeLayerSets = BuildCakeUpRings(
                    coreHigh: cakeCoreSEL,
                    roomMask: pocketMaskSEL,
                    lowTerrTiles: lowTerrTiles,
                    layers: cakeLayers,
                    tilesPerLayer: dilationPerLayer,
                    corePad: corePad,
                    biasMoat: biasMoat
                );
            }
            if (!isCakeDown)
            {
                // make every up-layer an actual ring (exclude the core plateau)
                for (int li = 0; li < cakeLayerSets.Count; li++)
                {
                    cakeLayerSets[li].ExceptWith(cakeCoreSEL);
                }
            }
        }





        // Step 4: determine room type and create a continuous wall around the union of platforms.
        string wallLabel;
        float savedOffset = outlineOffset;
        // Classification:
        // Cake: more than one terrace level and cakeLayers>0
        bool isCakeRoom = (terraceLevels.Distinct().Count() > 1 && cakeLayers > 0 && terrainEdges.Any(s => s.Room == roomId && s.TerraceFrom != s.TerraceTo));
        if (isCakeRoom)
        {
            isCakeRoom = roomcounttypesOfHeight[roomId].Count > 1;

        }
        // Diorama: if not cake and there are >=2 lobby platforms or multiple distinct connected rooms
        bool isDiorama = false;
        var lobbyPoints = edgeTiles.FindAll(q => q.RoomA == roomId || q.RoomB == roomId);
        int lobbyCount = 0;

        if (!isCakeRoom)
        {

            if (platformSeeds != null)
            {
                foreach (var ps in platformSeeds)
                {
                    // Check lobby via ScenarioRole if available
                    try
                    {
                        //if (ps.ScenarioRole == ScenarioRole.Lobby)
                        //{
                        //    lobbyCount++;
                        //}

                        foreach (var ed in lobbyPoints)
                        {
                            if (ps.Tiles.Contains(ed.Pos) && ed.Type == EdgeType.Transition)
                            {
                                lobbyCount++;
                                break;
                            }
                        }
                    }
                    catch
                    {
                        // fallback: attempt to use Role or mark none
                    }
                }
            }
            // Also check unique neighboring rooms via transition edges
            int neighborCount = 0;
            if (roomId >= 0 && edgeTiles != null)
            {
                var neighbors = new HashSet<int>();
                foreach (var e in edgeTiles)
                {
                    if (e.Type != EdgeType.Transition) continue;
                    if (e.RoomA == roomId) neighbors.Add(e.RoomB);
                    else if (e.RoomB == roomId) neighbors.Add(e.RoomA);
                }
                neighborCount = neighbors.Count;
            }
            //Debug.Log("Room: " + roomId.ToString() + " - lobbies: " + lobbyCount.ToString() + " - is cake? " + (isCakeRoom ? "Yes" : "No"));
            if (lobbyCount >= 3 || neighborCount >= 3)
                isDiorama = true;
        }

        List<Vector2Int> TerraceLink = new List<Vector2Int>();
        foreach (var ttl in terrainEdges.FindAll(s => s.Room == roomId && s.TerraceTo != s.TerraceFrom))
        {
            if (!TerraceLink.Contains(new Vector2Int(ttl.TerraceFrom, ttl.TerraceTo)) && !TerraceLink.Contains(new Vector2Int(ttl.TerraceTo, ttl.TerraceFrom)))
                TerraceLink.Add(new Vector2Int(ttl.TerraceFrom, ttl.TerraceTo));
        }
        Debug.Log("Room: " + roomId.ToString() + " - isCake: " + isCakeRoom.ToString() + " - hasTerraceEdge: " + terrainEdges.Any(w => w.Room == roomId).ToString() + " / Terr.Link: " + string.Join(",", TerraceLink) + " -- TerraceLevels: " + roomcounttypesOfHeight[roomId].Count.ToString() + ": " + string.Join(",", roomcounttypesOfHeight[roomId]));



        bool isAscension = !isCakeRoom && !isDiorama;
        if (isCakeRoom)
        {
            outlineOffset = cakeOffset;
            wallLabel = "C";
        }
        else if (isDiorama)
        {
            outlineOffset = dioramaOffset;
            wallLabel = "D";
        }
        else
        {
            outlineOffset = ascensionOffset;
            wallLabel = "A";
        }
        Mesh wallMesh = null;
        if (isAscension)
        {
            // Build a tight wall hugging the union of tiles for ascension rooms
            var (tightWall, tightFloor) = BuildTightPlatformWalls(unionFootprint, tileSize, bowlHeight, null, 0.05f, 1);
            wallMesh = tightWall;
        }
        else
        {
            wallMesh = BuildPocketWall(unionFootprint, tileSize, bowlHeight, 0, 1, MeshRes);
        }
        // Restore outline offset for other calls
        outlineOffset = savedOffset;
        if (wallMesh != null)
        {
            var wallObj = CreateChild($"RoomWall_{wallLabel}_{roomId}", wallMesh, wallMat, true);
            wallObj.transform.SetParent(transform);

        }

        // Step 5: build each platform slab at its computed height (and cake layers if any)

        float TH = terraceHeight;

        for (int i = 0; i < platformTilesPerRoom.Count; i++)
        {
            int terr = (i < terraceLevels.Count) ? terraceLevels[i] : -999;
            float H = (platformHeights != null && i < platformHeights.Length) ? platformHeights[i] : float.NaN;

            float bandMinTop = (terr + 1) * TH;           // top must be >= this
            float bandMaxTop = (terr + 2) * TH;     // and < this (exclusive top edge)

            bool inBand = (H >= bandMinTop - 1e-3f) && (H < bandMaxTop + 1e-3f);

            //Debug.Log($"[Room {roomId}] Plat#{i} terr={terr} Top={H:F3}  band=[{bandMinTop:F3},{bandMaxTop:F3})  {(inBand ? "OK" : "OUT-OF-BAND!")}");
        }



        for (int i = 0; i < platformTilesPerRoom.Count; i++)
        {
            var plat = platformTilesPerRoom[i];
            float height = platformHeights[i];
            // Derive the quantised height level for debug naming: this is the micro‑level index used earlier
            int qLevel = 0;
            if (platformTilesPerRoom.Count > 0)
            {
                // Compute normalised average again for this platform to infer q
                float sum = 0f;
                foreach (var t in plat)
                {
                    sum += (t.x + t.y) / (float)(allTiles.Count);
                }
                float avg = plat.Count > 0 ? sum / plat.Count : 0f;
                float norm = (maxAvg - minAvg > 1e-4f) ? ((avg - minAvg) / (maxAvg - minAvg)) : 0f;
                qLevel = Mathf.RoundToInt(norm * microLevels);
            }
            // Append quantised level to name for debugging
            string name = $"Platform_{i}_H{qLevel}";
            // Choose material: transition for lobby platforms, otherwise floor
            Material matToUse = floorMat;

            bool isTransit = false;
            if (platformSeeds != null && platformSeeds.Count > i)
            {
                var ps = platformSeeds[i];

                // scale-aware tolerances
                int tilePad = Mathf.Max(1, Mathf.RoundToInt(tileSize * 0.15f)); // 1 at ts=5
                float worldSlack = tileSize * 0.6f;                                   // ~half-tile

                isTransit = PlatformHasTransitionEdgesScaled(ps, edgeTiles, roomId, tilePad, tileSize, worldSlack);

                // (optional) role can still force transit for visualization
                // if (!isTransit && ps.ScenarioRole == ScenarioRole.Lobby) isTransit = true;

                // (optional) use a special material/layer when transit
                if (isTransit && transitionMat != null) matToUse = transitionMat;
            }

            BuildPlatformMesh(new HashSet<Vector2Int>(plat), 0f, height, tileSize, name, matToUse, chaikinIterations, isTransit);
        }

        // After building all platform slabs and the enclosing walls, build cake layers
        // directly using the simplified SDF logic and then return.  This bypasses the
        // original pass‑1/pass‑2 cake generation system below.
        BuildCakesForCurrentRoom(platformHeights);
        return;

        // ---------------- PASS 1: collect cake work, do NOT build cake meshes here ----------------
        var work = new RoomCakeWorkItem
        {
            RoomId = roomId,
            TerraceLevels = new List<int>(terraceLevels),           // parallel to platforms
            PlatformHeights = platformHeights.ToArray()             // tops (terrace+micro)
        };

        // ❶ choose main terrace by area (fallback: by count)
        var areaByTerr = new Dictionary<int, int>();
        for (int i = 0; i < platformTilesPerRoom.Count; i++)
        {
            int terr = (i < terraceLevels.Count) ? terraceLevels[i] : 0;
            if (!areaByTerr.ContainsKey(terr)) areaByTerr[terr] = 0;
            areaByTerr[terr] += platformTilesPerRoom[i].Count;
        }
        work.MainTerrace = areaByTerr.Count > 0
            ? areaByTerr.OrderByDescending(kv => kv.Value).First().Key
            : 0;

        // ❷ gather TerraceEdge links inside THIS room
        var edgesInRoom = (terrainEdges != null)
            ? terrainEdges.Where(e => e.Room == roomId && e.TerraceFrom != e.TerraceTo).ToList()
            : new List<TerraceEdge>();

        // Expected links from TerraceEdge for this room (sorted pairs)
        var expectedLinks = new HashSet<(int, int)>();
        foreach (var te in edgesInRoom)
        {
            int a = Mathf.Min(te.TerraceFrom, te.TerraceTo);
            int b = Mathf.Max(te.TerraceFrom, te.TerraceTo);
            expectedLinks.Add((a, b));
        }

        // NEW: room-level helpers for direction policy
        var roomTerrSet = new HashSet<int>(terraceLevels);
        int roomMinTerr = roomTerrSet.Count > 0 ? roomTerrSet.Min() : 0;
        int roomMaxTerr = roomTerrSet.Count > 0 ? roomTerrSet.Max() : 0;
        int expectedLinkCount = expectedLinks.Count;


        // What we actually enqueue/build (we’ll fill this)
        var builtLinks = new HashSet<(int, int)>();


        // terraces present in THIS room
        var roomTerrs = new HashSet<int>(terraceLevels);

        // keep only edges whose (low,high) both exist in the room
        var roomLinks = new List<(int low, int high)>();
        foreach (var te in terrainEdges) // however you enumerate the room’s TerraceEdges
        {
            int a = Mathf.Min(te.TerraceFrom, te.TerraceTo);
            int b = Mathf.Max(te.TerraceFrom, te.TerraceTo);
            if (te.Room != roomId) continue;
            if (roomTerrs.Contains(a) && roomTerrs.Contains(b))
                roomLinks.Add((a, b));
        }
        // then group/iterate using roomLinks rather than raw edges


        // if there are no links or only one terrace level, we’ll end up with no Groups (which is fine)
        if (edgesInRoom.Count > 0 && terraceLevels.Distinct().Count() > 1)
        {
            // graph over terrace ids using links found in this room
            var adj = new Dictionary<int, HashSet<int>>();
            var linkByPair = new Dictionary<(int, int), List<TerraceEdge>>();
            foreach (var te in edgesInRoom)
            {
                int a = Math.Min(te.TerraceFrom, te.TerraceTo);
                int b = Math.Max(te.TerraceFrom, te.TerraceTo);
                if (!adj.ContainsKey(a)) adj[a] = new HashSet<int>();
                if (!adj.ContainsKey(b)) adj[b] = new HashSet<int>();
                adj[a].Add(b); adj[b].Add(a);

                var key = (a, b);
                if (!linkByPair.ContainsKey(key)) linkByPair[key] = new List<TerraceEdge>();
                linkByPair[key].Add(te);
            }

            // connected components of terraces
            var seen = new HashSet<int>();
            foreach (var start in adj.Keys)
            {
                if (!seen.Add(start)) continue;


                var compTerrs = new HashSet<int> { start };

                var q = new Queue<int>(); q.Enqueue(start);
                while (q.Count > 0)
                {
                    int u = q.Dequeue();
                    foreach (var v in adj[u])
                        if (seen.Add(v)) { compTerrs.Add(v); q.Enqueue(v); }
                }

                // pack links + edge tiles for this component
                var compLinks = new List<(int, int)>();
                var compEdgeTiles = new List<Vector2Int>();
                foreach (var kv in linkByPair)
                {
                    if (compTerrs.Contains(kv.Key.Item1) && compTerrs.Contains(kv.Key.Item2))
                    {
                        compLinks.Add(kv.Key);
                        foreach (var te in kv.Value) compEdgeTiles.Add(te.Pos);
                    }
                }
                // Just after compLinks is filled, before the foreach over compLinks:
                // AFTER compLinks has been created for this component:
                var presentTerrs = new HashSet<int>(terraceLevels);
                compLinks = compLinks
                    .Where(p => presentTerrs.Contains(p.Item1) && presentTerrs.Contains(p.Item2))
                    .ToList();


                if (compLinks.Count == 0) continue; // nothing doable in this component


                // All terrace edges that belong to THIS component:
                var compEdges = edgesInRoom
                    .Where(te => compTerrs.Contains(te.TerraceFrom) && compTerrs.Contains(te.TerraceTo))
                    .ToList();

                // For each (low,high) link in this component, build one SeamGroup
                foreach (var link in compLinks)
                {
                    int low = link.Item1;
                    int high = link.Item2;

                    var norm = (Mathf.Min(low, high), Mathf.Max(low, high));
                    if (builtLinks.Contains(norm)) continue;
                    // --- 1) tiles that actually belong to THIS link only ---
                    var linkEdgeTiles = new HashSet<Vector2Int>();
                    foreach (var te in terrainEdges.FindAll(w => w.Room == work.RoomId)) // your raw collected edges for the component
                    {
                        int a = Mathf.Min(te.TerraceFrom, te.TerraceTo);
                        int b = Mathf.Max(te.TerraceFrom, te.TerraceTo);
                        if ((a, b) == (link.Item1, link.Item2))
                            linkEdgeTiles.Add(te.Pos);
                    }
                    if (linkEdgeTiles.Count < MinSeamEdgeTiles)
                    {
                        Debug.Log($"[P1-SKIP-LINK] Room {roomId} link=({link.Item1},{link.Item2}) edgeTiles={linkEdgeTiles.Count}");
                        continue;
                    }

                    // --- 2) Up/Down for THIS link relative to the room’s dominant terrace ---
                    // 3b) decide Up/Down against main terrace using revised logic
                    // When there is only one terrace change in this room (expectedLinkCount ≤ 1),
                    // determine the cake direction based on the number of platforms on each terrace.
                    // If the high terrace has strictly more platforms than the low terrace, we choose
                    // cake-down (groupIsDown = true).  If the low terrace has more platforms, we
                    // choose cake-up (groupIsDown = false).  On a tie we default to cake-down.
                    bool groupIsDown;
                    if (expectedLinkCount <= 1)
                    {
                        int countLow = 0;
                        int countHigh = 0;
                        // Count how many platforms reside on the low and high terrace levels
                        for (int pi = 0; pi < terraceLevels.Count; pi++)
                        {
                            int terr = (pi < terraceLevels.Count) ? terraceLevels[pi] : 0;
                            if (terr == low) countLow++;
                            else if (terr == high) countHigh++;
                        }
                        if (countHigh > countLow) groupIsDown = true;          // more high platforms → cake down
                        else if (countLow > countHigh) groupIsDown = false;    // more low platforms → cake up
                        else groupIsDown = true;                                // tie → default to down
                    }
                    else
                    {
                        // When multiple terrace changes exist, only the lowest link uses cake-down
                        groupIsDown = (low == roomMinTerr);
                    }
                    int coreTerr = groupIsDown ? link.Item1 : link.Item2;

                    // 3b) local mask = only terraces in THIS component, dilated a bit to avoid tight choke
                    var localMask = new HashSet<Vector2Int>();
                    foreach (var t in compTerrs) // your component’s terrace set
                    {
                        for (int i = 0; i < platformTilesPerRoom.Count; i++)
                        {
                            if (i >= terraceLevels.Count) continue;
                            if (terraceLevels[i] != t) continue;
                            foreach (var v in platformTilesPerRoom[i]) localMask.Add(v);
                        }
                    }
                    for (int k = 0; k < pocketRadius; k++) localMask = Dilate(localMask, 1);

                    // 3c) seam window around ONLY this link (use 8-connected dilate ONCE with radius)
                    var seamWindow = BuildSeamWindow(
                        linkEdgeTiles,            // the edge tiles for THIS (low,high) link
                        localMask,                // the component/room mask you already computed
                        SeamWindowRadiusCells,    // corridor half-width in tiles (your serialized field)
                         0                         // optional extra pad (try 1 if you want slightly wider)
                        );


                    // --- 4) gather ALL tiles on the core terrace (for core side pulldown) ---
                    // 3d) collect ALL tiles on the core terrace, then prefer those near the seam
                    var coreAll = new HashSet<Vector2Int>();
                    for (int i = 0; i < platformTilesPerRoom.Count; i++)
                    {
                        if (i >= terraceLevels.Count) continue;
                        if (terraceLevels[i] != coreTerr) continue;
                        foreach (var v in platformTilesPerRoom[i]) coreAll.Add(v);
                    }
                    HashSet<Vector2Int> coreNear = new HashSet<Vector2Int>();
                    if (CoreNearRadiusCells > 0 && seamWindow.Count > 0)
                    {
                        foreach (var e in linkEdgeTiles)
                        {
                            for (int dx = -CoreNearRadiusCells; dx <= CoreNearRadiusCells; dx++)
                                for (int dy = -CoreNearRadiusCells; dy <= CoreNearRadiusCells; dy++)
                                {
                                    if (Mathf.Abs(dx) + Mathf.Abs(dy) > CoreNearRadiusCells) continue; // diamond
                                    var p = new Vector2Int(e.x + dx, e.y + dy);
                                    if (coreAll.Contains(p)) coreNear.Add(p);
                                }
                        }
                    }
                    var coreTiles = coreNear.Count > 0 ? coreNear : coreAll;








                    // 3f) low-side tiles for CAKE-UP bias (keep away from the low)
                    // local mask: ONLY the two terraces for this link
                    var linkMask = new HashSet<Vector2Int>();
                    int lowTerr = Math.Min(low, high);
                    int highTerr = Math.Max(low, high);
                    for (int pi = 0; pi < platformTilesPerRoom.Count; pi++)
                    {
                        if (pi >= terraceLevels.Count) continue;
                        int t = terraceLevels[pi];
                        if (t != lowTerr && t != highTerr) continue;
                        foreach (var v in platformTilesPerRoom[pi]) linkMask.Add(v);
                    }

                    // seam corridor for THIS link only (use your helper)
                    int seamHalf = Mathf.Max(2, Mathf.RoundToInt(tileSize * 0.6f));      // width
                    int seamPad = Mathf.Max(1, Mathf.RoundToInt(tileSize * 0.3f));      // extend along the edge
                    var seamWin = BuildSeamWindow(linkEdgeTiles, linkMask, seamHalf, seamPad);

                    

                    // build terrace tiles per side (we’ll reuse in pass 2)
                    var lowTiles = new HashSet<Vector2Int>();
                    var highTiles = new HashSet<Vector2Int>();
                    for (int pi = 0; pi < platformTilesPerRoom.Count; pi++)
                    {
                        if (pi >= terraceLevels.Count) continue;
                        int t = terraceLevels[pi];
                        if (t == lowTerr)
                            foreach (var v in platformTilesPerRoom[pi]) lowTiles.Add(v);
                        else if (t == highTerr)
                            foreach (var v in platformTilesPerRoom[pi]) highTiles.Add(v);
                    }

                    Debug.Log("P1 initial - localMask: " + localMask.Count.ToString() + " - SeamWindow: " + seamWindow.Count.ToString() + " - seamWin: " + seamWin.Count.ToString() + " - lowTiles: " + lowTiles.Count.ToString() + " - highTiles: " + highTiles.Count.ToString() );


                    var baseCore = (groupIsDown ? lowTiles : highTiles);
                    var coreTilesNear = IntersectSets(baseCore, seamWin);
                    if (coreTilesNear.Count == 0) coreTilesNear = baseCore;  // fall back if seam too thin
                    if (corePad > 0) coreTilesNear = Dilate8(coreTilesNear, corePad, linkMask);


                    // 3g) create group
                    var g = new SeamGroup
                    {
                        Terraces = new HashSet<int> { lowTerr, highTerr },
                        Links = new List<(int, int)> { (lowTerr, highTerr) },
                        EdgeTiles = linkEdgeTiles.ToList(),
                        IsCakeDown = groupIsDown,
                        CoreTerr = groupIsDown ? lowTerr : highTerr,
                        LocalMask = linkMask,
                        SeamWindow = seamWin,
                        CoreTiles = coreTilesNear,
                        LowTerrTiles = lowTiles,
                        HighTerrTiles = highTiles
                    };

                    Debug.Log($"[P1-GROUP] room={roomId} link=({link.Item1},{link.Item2}) dir={(g.IsCakeDown ? "Down" : "Up")} " +
          $"edges={g.EdgeTiles.Count} core={g.CoreTerr} mask={g.LocalMask.Count}");

                    

                    // sanity: skip empty groups so PASS-2 won’t build 0,0,0 rings
                    if (g.CoreTiles.Count == 0 || g.LocalMask.Count == 0 || g.EdgeTiles.Count == 0)
                    {
                        Debug.Log($"[P1-SKIP-LINK] Room {roomId} link=({low},{high}) " +
                                  $"coreTiles={g.CoreTiles.Count} mask={g.LocalMask.Count} edgeTiles={g.EdgeTiles.Count}");
                        continue;
                    }

                    builtLinks.Add((Mathf.Min(low, high), Mathf.Max(low, high)));
                    work.Groups.Add(g);

                    
                }
            }

            // Coverage diagnostics: expected vs built (per room)
            var missing = expectedLinks.Where(l => !builtLinks.Contains(l)).ToList();
            var extras = builtLinks.Where(l => !expectedLinks.Contains(l)).ToList();

            Debug.Log($"[P1-COVER] room={roomId} expected={expectedLinks.Count} built={builtLinks.Count} " +
                      $"missing={missing.Count} extras={extras.Count}");

            if (missing.Count > 0)
            {
                var s = string.Join(",", missing.Select(p => $"({p.Item1},{p.Item2})"));
                Debug.Log($"[P1-COVER] room={roomId} MISSING links: {s}");
            }
            if (extras.Count > 0)
            {
                var s = string.Join(",", extras.Select(p => $"({p.Item1},{p.Item2})"));
                Debug.Log($"[P1-COVER] room={roomId} EXTRA links: {s}");
            }


            if (isCakeRoom && work.Groups != null && work.Groups.Count > 0)
            {
                _pendingCakes[roomId] = work;
            }
            else
            {
                Debug.Log($"[Cakes/SKIP] Room {roomId} (isCake={isCakeRoom}, groups={work.Groups?.Count ?? 0})");
            }

            // ---------------- END PASS 1 collect -------------------------------------------------------

            BuildPendingCakes();

        }
    }

    public void GenerateTransitions(List<EdgeTile> allEdges,
                                List<PlatformSeed> roomSeeds,
                                int roomId)
    {
        if (!enableTransitions || roomSeeds == null || roomSeeds.Count == 0) return;

        // ---------- 1. pick *one* lobby platform & its transition edge ----------
        // ---------- 1. pick *one* lobby platform & its transition edge ----------

        // a) grab every EdgeTile of type Transition that touches THIS room
        var filteredEdges = allEdges.Where(e =>
                e.Type == EdgeType.Transition &&
                (e.RoomA == roomId || e.RoomB == roomId))
            .ToList();
        if (filteredEdges.Count == 0)
        {
            Debug.LogWarning($"[Transitions] Room {roomId} – no transition edges at all.");
            return;
        }

        // b) prefer ScenarioRole.Lobby, otherwise any platform that contains a transition edge
        // new: tolerant detection
        int tilePad = Mathf.Max(1, Mathf.RoundToInt(Mathf.Ceil(tileSize / 5f))); // 1 at ts=5, 2 if you go even larger
        float worldSlack = tileSize * 0.6f;   // ≈ a bit wider than half a tile

        var transPlatforms = FindTransitionPlatforms(roomSeeds, allEdges, roomId, tilePad, tileSize, worldSlack);

        if (transPlatforms.Count == 0)
        {
            Debug.LogWarning($"[Transitions] Room {roomId} – no transition platforms found with pad={tilePad}, slack={worldSlack:F2}m");
            return;
        }

        // pick one as origin (your existing policy: random or by role/score)
        PlatformSeed origin = transPlatforms[UnityEngine.Random.Range(0, transPlatforms.Count)];


        if (origin == null)
            origin = roomSeeds
                .FirstOrDefault(p => filteredEdges.Any(e => TouchesPlatform(e.Pos, p, 0)));

        if (origin == null)
        {
            Debug.LogWarning($"[Transitions] Room {roomId} – unable to find a lobby or edge-touching platform.");
            return;                       // nothing to work with
        }

        // c) limit edges to only those sitting on **this** origin platform
        var originEdges = filteredEdges
            .Where(e => TouchesPlatform(e.Pos, origin, 0))
            .ToList();

        //Debug.Log($"[Transitions] Room {roomId} – origin edges found: {originEdges.Count}");
        if (originEdges.Count == 0) return;   // should be impossible now, but safe-guard


        EdgeTile sample = originEdges[UnityEngine.Random.Range(0, originEdges.Count)];
        int targetRoomId = (sample.RoomA == roomId) ? sample.RoomB : sample.RoomA;
        float baseY = origin.avgTileheight;

        // ---------- 2. collect border-strip tiles between the two rooms ----------
        var strip = new HashSet<Vector2Int>();
        var q = new Queue<(Vector2Int, int)>();

        // seed with every edge-tile that touches the origin platform
        foreach (var e in allEdges)
            if ((e.RoomA == roomId && e.RoomB == targetRoomId) ||
                (e.RoomB == roomId && e.RoomA == targetRoomId))
                if (TouchesPlatform(e.Pos, origin, 0))
                {
                    strip.Add(e.Pos);
                    q.Enqueue((e.Pos, 0));
                }

        // optional depth flood-fill inside the platform
        while (q.Count > 0)
        {
            var (pos, d) = q.Dequeue();
            if (d >= borderDepth) continue;
            foreach (var dir in DIR8)
            {
                var np = pos + dir;
                if (!origin.Tiles.Contains(np) || strip.Contains(np)) continue;
                strip.Add(np);
                q.Enqueue((np, d + 1));
            }
        }
        if (strip.Count == 0) return;

        // ---------- 3. collapse strip to a straight segment (PCA) ----------
        List<Vector2> pts = strip.Select(t => new Vector2((t.x + 0.5f) * tileSize, (t.y + 0.5f) * tileSize)).ToList();
        Vector2 mean = pts.Aggregate(Vector2.zero, (acc, p) => acc + p) / pts.Count;
        Vector2 axis = PrincipalAxis(pts, mean);                  // unit length

        float minProj = float.PositiveInfinity, maxProj = float.NegativeInfinity;
        foreach (var p in pts)
        {
            float proj = Vector2.Dot(p - mean, axis);
            if (proj < minProj) minProj = proj;
            if (proj > maxProj) maxProj = proj;
        }
        Vector2 A = mean + axis * minProj;
        Vector2 B = mean + axis * maxProj;
        float W = (maxProj - minProj) + 1f;                     // at least one-tile wide

        float doorDia = Mathf.Max(minDoorDiameter, W);
        if (clampDoorWidth && doorDia > maxDoorDiameter)
            doorDia = maxDoorDiameter;

        Vector2 mid = (A + B) * 0.5f;

        // ---------- 4. outward normal (points toward wall) ----------
        Vector2 platCtr = origin.Tiles
            .Select(t => new Vector2(t.x + 0.5f, t.y + 0.5f))
            .Aggregate(Vector2.zero, (acc, p) => acc + p) / origin.Tiles.Count;

        Vector2 n2D = new Vector2(axis.y, -axis.x);               // left-hand normal
        if (Vector2.Dot(n2D, platCtr - mid) > 0) n2D = -n2D;      // flip if pointing inward

        // ---------------- 5. grow-to-fit probe ----------------------------

        // 5A. raycast from lobby through transition edge to find wall surface

        // --------------------------------------------------------------------
        // E . centre on the lobby’s transition edge
        // --------------------------------------------------------------------


        //--------------------------------------------------------------------
        // 5 . Robust wall hit  ➜  grow-to-fit probe
        //--------------------------------------------------------------------

        // --- A . local helpers / inputs we already have ---
        float minDoorRadius = Mathf.Max(minDoorDiameter * 0.5f, 0.25f);

        // lobby Y-level using your public fields
        float lobbyY = (origin.TerraceId + 1) * terraceHeight;
        // originEdges   = List<EdgeTile> that lie ON the lobby platform (you computed earlier)

        // originEdges  = List<EdgeTile> that lie ON the lobby platform
        Vector3 platCtrW = new Vector3((platCtr.x + 0.5f) * tileSize, lobbyY + 0.3f, (platCtr.y + 0.5f) * tileSize);

        // pick the edge-tile furthest from the platform centre  ⇒ nearest wall
        Vector2Int edgeTile = originEdges
                .OrderByDescending(e => (e.Pos - platCtr).sqrMagnitude)
                .First().Pos;

        Vector3 edgeMidW = new Vector3((edgeTile.x + 0.5f) * tileSize, lobbyY + 0.3f, (edgeTile.y + 0.5f) * tileSize);



        // 3-D outward ray direction
        //Vector3 rayDir3 = new Vector3(n2D.x, 0f, n2D.y).normalized;

        // --- B . ensure wall collider exists & baked ---
        var wallTf = transform.GetComponentsInChildren<Transform>().FirstOrDefault(q => q.name.StartsWith("RoomWall_") && q.name.EndsWith($"_{roomId}"));
        // fallback, just in case
        if (wallTf == null)
            wallTf = transform.GetComponentsInChildren<Transform>()
                .FirstOrDefault(q => q.name.StartsWith("RoomWall"));
        if (wallTf == null) { Debug.LogError($"[Transitions] Room {roomId} – Wall GO not found"); return; }

        MeshFilter wallMF = wallTf.GetComponent<MeshFilter>();
        if (wallMF == null || wallMF.sharedMesh == null)
        {
            Debug.LogError($"[Transitions] Room {roomId} – Wall MeshFilter or mesh is null");
            return;
        }

        MeshCollider wallMC = wallTf.GetComponent<MeshCollider>();
        if (wallMC == null)
        {
            wallMC = wallTf.gameObject.AddComponent<MeshCollider>();
            wallMC.sharedMesh = Instantiate(wallMF.sharedMesh);
        }

        if (wallMask.value == 0)                                 // guard ❶
        {
            wallMask = 1 << LayerMask.NameToLayer("Wall");
            Debug.Log($"[Transitions] Room {roomId} – wallMask was 0, defaulting to 'Wall' layer");
        }

        // Ensure wall is on correct layer
        int wallLayer = GetSingleLayerIndex(wallMask, "Wall");
        SetLayerRecursively(wallTf, wallLayer);

        wallMC.cookingOptions = MeshColliderCookingOptions.None;
        wallMC.convex = false;                   // keep both faces
        wallMC.enabled = true;
        Physics.SyncTransforms();                // bake collider immediately

        // --- C . cast: start 0.2 m inside the room, try SphereCast then RayCast ---

        const float sphereRad = 0.25f;
        RaycastHit hitInfo;


        // ------------------------------------------------------------
        // A . compute outward, then ask collider for clearance
        // ------------------------------------------------------------
        Vector3 toWall = (edgeMidW - platCtrW).normalized;           // aims at wall

        Ray edgeRay = new Ray(edgeMidW, toWall);                   // shoot OUTWARD
        RaycastHit wh;                                               // wall hit

        float maxRoom = wallMC.bounds.extents.magnitude * 2f + 5f;
        float pushOut;
        if (wallMC.Raycast(edgeRay, out wh, maxRoom))                     // 5 m enough
            pushOut = wh.distance + 0.05f;                           // 5 cm past face
        else
            pushOut = wallMC.bounds.extents.magnitude + 1.0f;        // rare fallback

        Debug.DrawRay(edgeMidW, toWall * 5f,                              // direction
              Color.yellow, 15f);

        Vector3 rayStart = edgeMidW + toWall * pushOut;              // ALWAYS outside
        Vector3 rayDir3 = -toWall;                                  // shoot INWARD
        float inwardMax = pushOut + Mathf.Max(10f, 2f * tileSize); // give it room on big bowls


        // 2️⃣  cast inward toward the lobby
        //rayDir3 = -outward;          // into the room
        raystart = rayStart;

        if (wallMC.bounds.Contains(raystart))
        {
            // move start 0.5 m along rayDir *back* into the lobby
            Debug.Log("ray start is inside bounds!");
        }

        bool hitOk = Physics.SphereCast(raystart, sphereRad, rayDir3,
                        out hitInfo, inwardMax, wallMask) ||
                     Physics.Raycast(raystart, rayDir3,
                        out hitInfo, inwardMax, wallMask);

        Debug.DrawRay(raystart,   // start
              rayDir3.normalized * inwardMax,                               // direction
              Color.magenta, 15f);

        if (!hitOk)
        {
            Debug.LogWarning($"[Transitions] Room {roomId} – Primary raycast failed, trying alternative approach");

            // Fallback: try from multiple directions
            Vector3[] fallbackDirections = {
                rayDir3,
                -rayDir3,
                Vector3.Cross(rayDir3, Vector3.up).normalized,
                -Vector3.Cross(rayDir3, Vector3.up).normalized
            };

            foreach (var dir in fallbackDirections)
            {
                Vector3 fallbackStart = new Vector3(mid.x, lobbyY + 0.5f, mid.y);
                if (Physics.Raycast(fallbackStart, dir, out hitInfo, 10f, wallMask))
                {
                    hitOk = true;
                    Debug.Log($"[Transitions] Room {roomId} – Fallback raycast succeeded with direction {dir}");
                    break;
                }
            }
        }

        if (!hitOk)
        {
            Debug.LogError($"[Transitions] Room {roomId} – All raycast attempts failed. Check wall layer ({LayerMask.LayerToName(wallTf.gameObject.layer)}) vs mask ({wallMask.value})");
            return;
        }

        Vector3 outwardW = hitInfo.normal;          // reliable – PhysX gives it to us

        Debug.Log("Hit: " + hitInfo.transform.name + " / Dist: " + Vector3.Distance(raystart, hitInfo.point) + " - Layer: " + LayerMask.LayerToName(hitInfo.transform.gameObject.layer));



        // --- D . seed probe capsule flush with wall, then grow to radius ----


        // ===================================================================
        // AFTER the Sphere/Ray cast succeeds you already have hitInfo
        // ===================================================================


        // 2️⃣  cylinder centre = pull inward by exactly the door radius


        // ------------------------------------------------------------
        // 1. robust inward centre (world space)
        // ------------------------------------------------------------
        Vector3 inwardW = (hitInfo.point - new Vector3(platCtrW.x, hitInfo.point.y, platCtrW.z)).normalized;

        //Vector3 cylCtrW = hitInfo.point - inwardW * (doorRadius + epsilon);   // final centre

        LayerMask platformMask = cylinderMask;           // lobby & bridges
        LayerMask probeMask = platformMask & ~wallMask;

        //wallMC.enabled = false;   // wall off during grow

        GameObject probe = new GameObject("DoorProbe_tmp");
        CapsuleCollider pc = probe.AddComponent<CapsuleCollider>();
        pc.direction = 1;
        pc.height = microStep;
        pc.radius = 0.05f;

        float targetRadius = Mathf.Max(doorDia * 0.5f, minDoorRadius);
        float probeHeight = microStep;            // walkable slab thickness

        probe.transform.position = hitInfo.point - outwardW * 0.05f;
        Vector3 growDir = outwardW;

        float doorRadius = targetRadius;     // <<-- ensure this exists before we start
        const float growStep = 0.05f;
        while (pc.radius + 1e-4f < targetRadius)
        {
            pc.radius = Mathf.Min(pc.radius + growStep, targetRadius);
            Vector3 p1 = probe.transform.position + Vector3.up * pc.height * .5f;
            Vector3 p2 = probe.transform.position - Vector3.up * pc.height * .5f;
            if (Physics.OverlapCapsule(p1, p2, pc.radius, probeMask).Length > 0)
            {
                pc.radius -= growStep;
                break;
            }
        }
        doorRadius = pc.radius;
        Vector3 cylCtrW = hitInfo.point - outwardW * doorRadius;

        DestroyImmediate(probe);
        //wallMC.enabled = true;                // re-enable wall collider

        // ------------------------------------------------------------
        // 3. cut wall – local-space test


        // ------------------------------------------------------------

        Transform meshTf = wallMF.transform;
        Vector3 cylLocal = meshTf.InverseTransformPoint(cylCtrW);
        float localRad = doorRadius / meshTf.lossyScale.x;      // scale-aware


        // Debug information for troubleshooting

        SubtractCircularDoorway(wallMF, cylLocal, localRad);
        wallMC.enabled = false;      // leave it off – avoids PhysX recook failure
        // ------------------------------------------------------------
        // 4. spawn the disc (diameter!) and build bridge
        // ------------------------------------------------------------
        float cylHeight = microStep;
        var cyl = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        cyl.transform.SetParent(transform);
        //cyl.transform.position = cylCtrW + Vector3.up * 0.01f;
        cyl.transform.position = new Vector3(cylCtrW.x, lobbyY + Mathf.Ceil(microStep * (origin.avgTileheight) * microLevels), cylCtrW.z);
        cyl.transform.localScale =
                new Vector3(doorRadius * 2f, cylHeight * 0.5f, doorRadius * 2f);
        cyl.GetComponent<Renderer>().sharedMaterial = transitionMat;
        cyl.tag = "Transition";

        // bridge (dir.y forced flat inside BuildBridge)
        //BuildBridge(ClosestPointOnPolygon(GetPlatformOutline(origin),
        //                                  new Vector2(cylCtrW.x, cylCtrW.z)),
        //            cylCtrW,
        //            doorRadius * 2f,
        //            cylHeight * 0.4f);



    }





    // NEW: top-level dispatcher that feeds your current per-room GenerateRoom
    public void BuildFromSeeds(
        List<PlatformSeed> allSeeds,
        List<EdgeTile> allEdges,
        List<TerraceEdge> terrainEdges,   // keep if you already use stairs
        bool? spawnAllOverride = null)
    {
        bool buildAll = spawnAllOverride ?? spawnAllRooms;

        // fresh parent
        for (int i = transform.childCount - 1; i >= 0; i--)
            DestroyImmediate(transform.GetChild(i).gameObject);

        if (allSeeds == null || allSeeds.Count == 0)
        {
            Debug.LogWarning("BuildFromSeeds: no seeds"); return;
        }

        this.terrainEdges = terrainEdges;
        // group seeds by room
        var rooms = allSeeds.GroupBy(s => s.RoomId).ToList();
        if (rooms.Count == 0) return;

        if (!buildAll)
        {
            var g = rooms[UnityEngine.Random.Range(0, rooms.Count)];
            PrepareRoomInputs(g.Key, g.ToList(), allEdges);
            GenerateRoom(clearChildren: false);        // use your existing per-room generator
        }
        else
        {
            foreach (var g in rooms)
            {
                PrepareRoomInputs(g.Key, g.ToList(), allEdges);
                GenerateRoom(clearChildren: false);    // call your existing per-room generator
            }
        }
        // after you finished building every room (walls+slabs), do:
        //foreach(var m in terrainEdges)
        //{
        //    GameObject p = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        //    p.transform.position = m.Pos;
        //}
    }

    // helper: fill the instance fields your current GenerateRoom already reads
    private void PrepareRoomInputs(int roomKey, List<PlatformSeed> seeds, List<EdgeTile> allEdges)
    {
        roomId = roomKey;
        platformSeeds = seeds;
        edgeTiles = allEdges;

        platformTilesPerRoom = seeds.Select(ps => ps.Tiles).ToList();
        terraceLevels = seeds.Select(ps => ps.TerraceId).ToList();
    }


    #region Mesh construction helpers (copied from skeletonMeshmaker)

    // 4-neighbour directions
    static readonly Vector2Int[] DIR4 = { new(1, 0), new(-1, 0), new(0, 1), new(0, -1) };
    static readonly Vector2Int[] DIR8 = {
    new(1,0), new(-1,0), new(0,1), new(0,-1),
    new(1,1), new(1,-1), new(-1,1), new(-1,-1)
};



    // ---------------------------------------------------------------------
    // Call *after* GenerateTransitions()
    // ---------------------------------------------------------------------
    public void GenerateTerrainStairs(
             List<TerraceEdge> terrainEdges,
             List<PlatformSeed> platformSeeds,
             int roomId)                                   // current room
    {
        if (stairPrefab == null)
        {
            Debug.LogWarning("stairPrefab not assigned – skipping stairs");
            return;
        }

        // 0. quick lookup: tile -> PlatformSeed
        Dictionary<Vector2Int, PlatformSeed> lookup = new();
        foreach (var p in platformSeeds)
            foreach (var t in p.Tiles)
                lookup[t] = p;

        // 1. filter: only edges inside **this** cake room
        var edges = terrainEdges.Where(e =>
                       (e.Room == roomId) &&
                       (e.TerraceFrom != e.TerraceTo)).ToList();

        if (edges.Count == 0) return;

        Transform bucket = new GameObject("Stairs").transform;
        bucket.SetParent(transform, false);

        foreach (var e in edges)
        {
            if (!lookup.TryGetValue(e.Pos, out var seed)) continue;

            // world centre of this tile
            Vector3 worldXZ = new Vector3(
                    (e.Pos.x + 0.5f) * tileSize,
                    0f,
                    (e.Pos.y + 0.5f) * tileSize);

            float fromHeight = (e.TerraceFrom + 1) * terraceHeight;
            float toHeight = (e.TerraceTo + 1) * terraceHeight;
            float yBottom = Mathf.Min(fromHeight, toHeight);
            float yTop = Mathf.Max(fromHeight, toHeight);
            float deltaY = yTop - yBottom;

            // instantiate & orient
            GameObject stair = Instantiate(stairPrefab, bucket);
            stair.name = $"Stair_{e.Pos.x}_{e.Pos.y}";

            // position centre at lower terrace, raise by microStep so it rests on floor
            stair.transform.position =
                new Vector3(worldXZ.x, yBottom + microStep, worldXZ.z);

            // face from lower toward higher terrace
            Vector3 dir =
                (toHeight > fromHeight) ? Vector3.forward : Vector3.back; // default
                                                                          // try to align with actual neighbouring tile if available
            Vector2Int n = (e.TerraceTo > e.TerraceFrom) ? e.Pos + DIR8[0] : e.Pos + DIR8[2];
            if (lookup.ContainsKey(n))
                dir = (new Vector3(n.x + 0.5f, 0, n.y + 0.5f) - new Vector3(e.Pos.x + 0.5f, 0, e.Pos.y + 0.5f)).normalized;
            stair.transform.rotation = Quaternion.LookRotation(dir, Vector3.up);

            // scale Y (length) so the top landing reaches the upper terrace
            Vector3 s = stair.transform.localScale;
            s.y = deltaY / (stairPrefab.GetComponent<MeshRenderer>().bounds.size.y);
            stair.transform.localScale = s;
        }
    }


    // CAKE-DOWN (bowl) via two-source SDF bands:
    //   S(p) = dLow(p) - dHigh(p)
    //   seam ~ S==0; high-facing side has S > 0
    // Rings are S in [moat + li*w, moat + (li+1)*w)
    private List<HashSet<Vector2Int>> BuildCakeDownRingsBiased(
    HashSet<Vector2Int> coreLow,
    HashSet<Vector2Int> roomMask,
    HashSet<Vector2Int> highTerrTiles,   // may be empty
    HashSet<Vector2Int> seamWindow,      // may be null/empty
    int layers,
    int tilesPerLayer,
    float corePad,
    int biasMoat
)
    {
        // --- candidate in seam corridor ---
        var candidate = new HashSet<Vector2Int>(roomMask);
        if (seamWindow != null && seamWindow.Count > 0)
            candidate.IntersectWith(seamWindow);

        // EXCLUDE CORE (so cake-down is never inside the slab)
        var corePadCells = Mathf.Max(1, Mathf.RoundToInt(corePad)); // at least 1
        //if (coreLow != null && coreLow.Count > 0)
        //{
        //    var coreOut = (corePadCells > 0)
        //        ? Dilate8(new HashSet<Vector2Int>(coreLow), corePadCells, roomMask)
        //        : new HashSet<Vector2Int>(coreLow);
        //    candidate.ExceptWith(coreOut);
        //}
        //if (candidate.Count == 0) return new List<HashSet<Vector2Int>>(); // nothing to build

        // --- distances ---
        var dLow = BFSDistances8(coreLow, roomMask);          // from low slab (core)
        Dictionary<Vector2Int, int> dHigh = null;
        if (highTerrTiles != null && highTerrTiles.Count > 0)
            dHigh = BFSDistances8(highTerrTiles, roomMask);

        // --- banding on LOW side of the seam ---
        // T = dh - dl  (T > 0 ⇒ closer to LOW; T ≈ 0 near seam; T < 0 ⇒ closer to HIGH)
        int moat = Mathf.Max(0, biasMoat);
        var rings = new List<HashSet<Vector2Int>>(layers);
        for (int li = 0; li < layers; li++)
        {
            int sLo = moat + li * tilesPerLayer;
            int sHi = sLo + tilesPerLayer;

            var ring = new HashSet<Vector2Int>();
            foreach (var p in candidate)
            {
                if (dLow == null || dHigh == null) continue;
                if (!dLow.TryGetValue(p, out int dl)) continue;
                if (!dHigh.TryGetValue(p, out int dh)) continue;

                int T = dh - dl; // positive on low side
                if (T >= sLo && T <= sHi)
                    ring.Add(p);
            }

            CloseSmallDiagonalGaps(ring);
            rings.Add(ring);
        }

        // fallback: if every ring is empty, do a perimeter-based ring from the low core outward
        if (rings.All(r => r.Count == 0) && coreLow != null && coreLow.Count > 0)
        {
            var coreOut = Dilate8(new HashSet<Vector2Int>(coreLow), 1, roomMask);
            var perimeter = Perimeter4(coreOut, roomMask);
            var growMask = new HashSet<Vector2Int>(roomMask);
            growMask.ExceptWith(coreOut);
            if (seamWindow != null && seamWindow.Count > 0) growMask.IntersectWith(seamWindow);
            var dPerim = BFSDistances8(perimeter, growMask);

            rings.Clear();
            for (int li = 0; li < layers; li++)
            {
                int sLo = moat + li * tilesPerLayer;
                int sHi = sLo + tilesPerLayer;

                var ring = new HashSet<Vector2Int>();
                foreach (var p in growMask)
                {
                    if (dPerim.TryGetValue(p, out int dp) && dp >= sLo && dp < sHi)
                        ring.Add(p);
                }
                CloseSmallDiagonalGaps(ring);
                rings.Add(ring);
            }
        }

        return rings;

    }



    // Builds inner→outer exclusive rings for CAKE-UP via morphological shells,
    // then masks to the “high side” (closer to high than low by ≥ bias).
    List<HashSet<Vector2Int>> BuildCakeUpRings(
        HashSet<Vector2Int> coreHigh,        // tiles on the HIGH terrace
        HashSet<Vector2Int> roomMask,        // union footprint (optionally dilated)
        HashSet<Vector2Int> lowTerrTiles,    // tiles on any LOWER terrace (may be empty)
        int layers,
        int tilesPerLayer,                   // = dilationPerLayer
        int corePad,                         // ≥1 so L0 ≠ core
        int biasMoat                         // 0 or 1 (how much closer to high than low)
    )
    {
        var rings = new List<HashSet<Vector2Int>>();
        if (coreHigh == null || coreHigh.Count == 0 || layers <= 0 || tilesPerLayer <= 0) return rings;

        // High/Low distance fields inside the room
        var dHigh = BFSDistances8(coreHigh, roomMask);
        Dictionary<Vector2Int, int> dLow = null;
        if (lowTerrTiles != null && lowTerrTiles.Count > 0)
            dLow = BFSDistances8(lowTerrTiles, roomMask);

        // “High-side” mask: closer to HIGH (by ≥ bias) than to any LOW
        var highSide = new HashSet<Vector2Int>();
        foreach (var kv in dHigh)
        {
            var p = kv.Key; int dh = kv.Value;
            if (dh <= 0) continue; // exclude the core itself
            if (dLow != null && dLow.TryGetValue(p, out int dl))
            {
                if (dl + biasMoat < dh) highSide.Add(p);
            }
            else highSide.Add(p);
        }

        // Morphological shells (exclusive): ring k = D(r_hi) \ D(r_lo)
        for (int li = 0; li < layers; li++)
        {
            int rLo = corePad + li * tilesPerLayer;
            int rHi = corePad + (li + 1) * tilesPerLayer;

            var dilLo = Dilate8(coreHigh, rLo, roomMask);
            var dilHi = Dilate8(coreHigh, rHi, roomMask);

            var ring = new HashSet<Vector2Int>(dilHi);
            ring.ExceptWith(dilLo);          // shell between the two dilations
            ring.IntersectWith(highSide);    // keep only the high-facing side

            CloseSmallDiagonalGaps(ring);    // optional stitch (fix 1-tile holes)

            rings.Add(ring);
        }
        return rings;
    }

    /// <summary>
    /// Generates a set of concentric rings for a cake-down connection.  Each ring is
    /// produced by dilating the low‑terrace core outward in 8‑connected neighbourhoods
    /// and subtracting the previous dilation.  The rings are clipped to the provided
    /// local mask and optionally further restricted to a seam window (corridor) if
    /// supplied.  Unlike the original implementation, this version does not attempt
    /// to bias the rings away from the high terrace; instead, it simply builds
    /// exclusive shells around the low core inside the footprint.  This avoids
    /// incorrectly cutting away parts of the mesh when generating cake down layers.
    /// </summary>
    /// <param name="coreLow">All tiles on the low terrace (core).</param>
    /// <param name="roomMask">Union of tiles belonging to the terraces in this link (optionally dilated).</param>
    /// <param name="seamWindow">Optional corridor mask restricting where rings may be built.  If null or empty no additional restriction is applied.</param>
    /// <param name="layers">Number of cake layers to generate.</param>
    /// <param name="tilesPerLayer">Number of dilations per layer.</param>
    /// <returns>A list of rings (as sets of grid positions) from innermost to outermost.</returns>
    private List<HashSet<Vector2Int>> BuildCakeDownRingsSimple(
        HashSet<Vector2Int> coreLow,
        HashSet<Vector2Int> roomMask,
        HashSet<Vector2Int> seamWindow,
        int layers,
        int tilesPerLayer
    )
    {
        var rings = new List<HashSet<Vector2Int>>();
        if (coreLow == null || coreLow.Count == 0 || roomMask == null || roomMask.Count == 0 || layers <= 0 || tilesPerLayer <= 0)
            return rings;

        // Candidate area is the footprint clipped by the seam window (if any)
        var candidate = new HashSet<Vector2Int>(roomMask);
        if (seamWindow != null && seamWindow.Count > 0)
            candidate.IntersectWith(seamWindow);

        // Never include the core itself in the rings
        candidate.ExceptWith(coreLow);

        // Build each ring by dilating outward and taking the set difference
        for (int li = 0; li < layers; li++)
        {
            int rLo = li * tilesPerLayer;
            int rHi = (li + 1) * tilesPerLayer;

            var dilLo = Dilate8(coreLow, rLo, roomMask);
            var dilHi = Dilate8(coreLow, rHi, roomMask);

            var ring = new HashSet<Vector2Int>(dilHi);
            ring.ExceptWith(dilLo);
            ring.IntersectWith(candidate);
            CloseSmallDiagonalGaps(ring);

            rings.Add(ring);
        }
        return rings;
    }

    /// <summary>
    /// Build cake layers for the current room using a straightforward SDF approach.
    /// This method iterates over each terrace edge in the room, determines
    /// whether it should generate cake‑up or cake‑down layers based on the
    /// height distribution, constructs concentric rings around the chosen
    /// core platform and extrudes them into meshes.  It bypasses the
    /// complicated pass‑1/pass‑2 infrastructure and therefore avoids
    /// duplicating layers or cutting into the slab.
    /// </summary>
    /// <param name="platformHeights">Array of platform top heights computed earlier.</param>
    private void BuildCakesForCurrentRoom(float[] platformHeights)
    {
        // require at least one cake layer to build
        if (cakeLayers <= 0 || platformHeights == null || platformHeights.Length == 0) return;
        if (terrainEdges == null) return;

        // Gather all terrace changes (links) for this room
        var edgesInRoom = terrainEdges.Where(e => e.Room == roomId && e.TerraceFrom != e.TerraceTo).ToList();
        if (edgesInRoom.Count == 0) return;

        // Group by sorted (low,high)
        var linkMap = new Dictionary<(int low, int high), List<Vector2Int>>();
        foreach (var te in edgesInRoom)
        {
            int a = Mathf.Min(te.TerraceFrom, te.TerraceTo);
            int b = Mathf.Max(te.TerraceFrom, te.TerraceTo);
            var key = (a, b);
            if (!linkMap.ContainsKey(key)) linkMap[key] = new List<Vector2Int>();
            linkMap[key].Add(te.Pos);
        }

        // Determine the minimum terrace level present in this room
        var roomTerrs = new HashSet<int>(terraceLevels);
        if (roomTerrs.Count == 0) return;
        int roomMinTerr = roomTerrs.Min();
        int roomMaxTerr = roomTerrs.Max();
        bool multipleLinks = linkMap.Count > 1;

        // Precompute per‑terrace platform counts for single‑link decisions
        var terrCount = new Dictionary<int, int>();
        for (int i = 0; i < terraceLevels.Count; i++)
        {
            int terr = terraceLevels[i];
            if (!terrCount.ContainsKey(terr)) terrCount[terr] = 0;
            terrCount[terr]++;
        }

        // For each link, build cake
        foreach (var kv in linkMap)
        {
            int low = kv.Key.low;
            int high = kv.Key.high;
            var edgePositions = kv.Value;
            // Decide direction
            bool isDown;
            if (!multipleLinks)
            {
                int countLow = terrCount.ContainsKey(low) ? terrCount[low] : 0;
                int countHigh = terrCount.ContainsKey(high) ? terrCount[high] : 0;
                if (countHigh > countLow) isDown = true;
                else if (countLow > countHigh) isDown = false;
                else isDown = true;
            }
            else
            {
                isDown = (low == roomMinTerr);
            }
            int coreTerr = isDown ? low : high;
            // Gather core tiles
            var coreTiles = new HashSet<Vector2Int>();
            for (int i = 0; i < platformTilesPerRoom.Count; i++)
            {
                if (i >= terraceLevels.Count) continue;
                if (terraceLevels[i] != coreTerr) continue;
                foreach (var v in platformTilesPerRoom[i]) coreTiles.Add(v);
            }
            if (coreTiles.Count == 0) continue;

            // Build local mask as the union of low and high terrace tiles
            var localMask = new HashSet<Vector2Int>();
            for (int i = 0; i < platformTilesPerRoom.Count; i++)
            {
                if (i >= terraceLevels.Count) continue;
                int t = terraceLevels[i];
                if (t == low || t == high)
                {
                    foreach (var v in platformTilesPerRoom[i]) localMask.Add(v);
                }
            }
            // Dilate the mask to avoid tight choke points
            for (int k = 0; k < pocketRadius; k++) localMask = Dilate(localMask, 1);

            // Build seam window around this link to bias rings along the connection
            var linkEdgeSet = new HashSet<Vector2Int>(edgePositions);
            var seamWindow = BuildSeamWindow(linkEdgeSet, localMask, SeamWindowRadiusCells, 0);

            // Build rings
            List<HashSet<Vector2Int>> rings;
            if (isDown)
            {
                // Low→High: build rings around the low core
                rings = BuildCakeDownRingsSimple(coreTiles, localMask, seamWindow, cakeLayers, dilationPerLayer);
            }
            else
            {
                // High→Low: build rings around the high core and bias away from the low side
                var lowTerrTiles = new HashSet<Vector2Int>();
                for (int i = 0; i < platformTilesPerRoom.Count; i++)
                {
                    if (i >= terraceLevels.Count) continue;
                    if (terraceLevels[i] != low) continue;
                    foreach (var v in platformTilesPerRoom[i]) lowTerrTiles.Add(v);
                }
                rings = BuildCakeUpRings(coreTiles, localMask, lowTerrTiles, cakeLayers, dilationPerLayer, corePad, biasMoat);
                // Exclude the core plateau from each ring so that layers do not overlap the core
                foreach (var r in rings) r.ExceptWith(coreTiles);
            }
            if (rings == null || rings.Count == 0) continue;

            // Compute heights per ring using a uniform thickness equal to cakeStepHeight.
            float step = cakeStepHeight;
            float epsLocal = Mathf.Max(0.0001f, microStep * 0.01f);

            // Determine the core top (highest micro‑height) across all platforms on the core terrace.
            var coreIndices = new List<int>();
            for (int i = 0; i < terraceLevels.Count; i++)
                if (terraceLevels[i] == coreTerr) coreIndices.Add(i);
            if (coreIndices.Count == 0) continue;
            float coreTop = coreIndices.Max(idx => platformHeights[idx]);

            // Clamp values: for cake‑down we should not extend above the upper bound of the
            // high terrace band.  For cake‑up we should not extend below the lower bound of
            // the low terrace band.  Use the link’s low/high pair for clamping.
            float clampTop = float.PositiveInfinity;
            float clampBottom = float.NegativeInfinity;
            // High terrace top: (high+1)*terraceHeight minus epsilon
            clampTop = ((high + 2) * terraceHeight) - epsLocal;
            // Low terrace bottom: low*terraceHeight plus epsilon
            clampBottom = ((low +1)* terraceHeight) + epsLocal;

            for (int li = 0; li < rings.Count; li++)
            {
                var ring = rings[li];
                if (ring == null || ring.Count == 0) continue;
                float bottom, top;
                if (isDown)
                {
                    // Layers ascend above the core: [coreTop + li*step, coreTop + (li+1)*step]
                    if (li == 0)
                        bottom = coreTop- (microStep);
                    else
                        bottom = coreTop + li * step;
                    top = coreTop + (li + 1) * step;
                    // Clamp to the high terrace band
                    if (top > clampTop) top = clampTop;
                }
                else
                {
                    // Layers descend below the core: [coreTop - (li+1)*step, coreTop - li*step]
                    top = coreTop - li * step - step;
                    bottom = coreTop - (li + 1) * step - step;
                    // Clamp to the low terrace band
                    if (bottom < clampBottom) bottom = clampBottom;
                }
                if (top <= bottom) continue;
                float height = top - bottom;
                // Name for debugging
                string layerName = $"Cake_{(isDown ? "Down" : "Up")}_{low}_{high}_L{li}";
                // Build mesh for the ring
                BuildPlatformMesh(new HashSet<Vector2Int>(ring), bottom, height, tileSize, layerName, floorMat, chaikinIterations, false);
            }
        }
    }

    static HashSet<Vector2Int> IntersectSets(HashSet<Vector2Int> a, HashSet<Vector2Int> b)
    {
        if (a == null || b == null) return new HashSet<Vector2Int>();
        if (a.Count > b.Count) { var t = a; a = b; b = t; }
        var outSet = new HashSet<Vector2Int>();
        foreach (var p in a) if (b.Contains(p)) outSet.Add(p);
        return outSet;
    }

    static HashSet<Vector2Int> Perimeter4(HashSet<Vector2Int> core, HashSet<Vector2Int> mask)
    {
        var res = new HashSet<Vector2Int>();
        if (core == null || core.Count == 0 || mask == null || mask.Count == 0) return res;

        // 4-neigh (N,E,S,W)
        var dirs = new (int x, int y)[] { (0, 1), (1, 0), (0, -1), (-1, 0) };
        foreach (var v in core)
        {
            foreach (var d in dirs)
            {
                var q = new Vector2Int(v.x + d.x, v.y + d.y);
                if (!core.Contains(q) && mask.Contains(q)) res.Add(q);
            }
        }
        return res;
    }

    private void BuildPendingCakes(Dictionary<int, List<HashSet<Vector2Int>>> debugDump = null)
    {
        //Debug.Log($"[Cakes/P2] start  pending={_pendingCakes?.Count ?? -1}");


        if (_pendingCakes.Count == 0) return;

        foreach (var kv in _pendingCakes)
        {
            var work = kv.Value;
            if (work.Groups == null || work.Groups.Count == 0) continue;

            foreach (var g in work.Groups)
            {
                // Skip tiny/invalid seams
                if (g.EdgeTiles == null || g.EdgeTiles.Count < MinSeamEdgeTiles) continue;

                // --- 0) Footprints (rings) ---
                List<HashSet<Vector2Int>> rings;
                if (g.IsCakeDown)
                {
                    // Build cake‑down layers using a simplified morphology that avoids
                    // trimming away the footprint.  We dilate the low terrace core
                    // outward and clip the rings to the local mask and seam window.
                    rings = BuildCakeDownRingsSimple(
                        coreLow: g.CoreTiles,
                        roomMask: g.LocalMask,
                        seamWindow: g.SeamWindow,
                        layers: cakeLayers,
                        tilesPerLayer: dilationPerLayer
                    );
                }
                else
                {
                    // For cake‑up we reuse the proven morphological shell builder
                    // that biases rings away from the low terrace.
                    rings = BuildCakeUpRings(
                        coreHigh: g.CoreTiles,
                        roomMask: g.LocalMask,
                        lowTerrTiles: g.LowTerrTiles ?? new HashSet<Vector2Int>(),
                        layers: cakeLayers,
                        tilesPerLayer: dilationPerLayer,
                        corePad: corePad,
                        biasMoat: biasMoat
                    );
                }
                if (rings == null || rings.Count == 0) continue;

                // --- 1) Seam corridor (local, per-link); exclude padded core so we never keep tiles inside the slab ---
                int seamHalfCells = Mathf.Max(1, Mathf.RoundToInt(tileSize));      // give it a bit more width
                int seamPadCells = Mathf.Max(0, Mathf.RoundToInt(tileSize * 0.25f));
                int corePadCells = Mathf.Max(0, Mathf.RoundToInt(corePad));

                var seamSeed = (g.EdgeTiles != null && g.EdgeTiles.Count > 0) ? g.EdgeTiles : g.LocalMask.ToList();
                var seamClip = Dilate8(new HashSet<Vector2Int>(seamSeed), seamHalfCells + seamPadCells, g.LocalMask);
                // <-- Do NOT remove the core from seamClip here


                // --- 2) Clip all rings to the seam corridor (use ring size, not list size) ---
                // Clip each ring to the seam corridor.  Do not duplicate the original rings;
                // instead, for each ring generate a clipped version and fall back to the original
                // if the clipping would produce an empty set.  This avoids doubling the number of
                // cake layers.
                var clipped = new List<HashSet<Vector2Int>>();
                foreach (var r in rings)
                {
                    var rr = new HashSet<Vector2Int>(r);
                    rr.IntersectWith(seamClip);
                    if (rr.Count > 0) clipped.Add(rr);
                    else clipped.Add(r);
                }

                if (clipped.Count == 0) { Debug.Log($"[P2-CLIPPED-EMPTY] room={work.RoomId}"); continue; }

                // --- 3) Optional bias (only when we have valid “other side” seeds) ---
                // For cake-up we already bias away from low inside BuildCakeUpRings; don’t double-bias here.
                
                var finalRings = new List<HashSet<Vector2Int>>();
                int minRingTiles = Mathf.Max(1, Mathf.RoundToInt(tileSize));
                foreach (var r0 in clipped)
                {
                    var r = r0;

                    // (cake-down) optional bias was already applied inside BuildCakeDownRingsBiased
                    // (cake-up) bias happened in BuildCakeUpRings

                    // remove padded core from the ring (not from the seam)
                    if (g.CoreTiles != null && g.CoreTiles.Count > 0 && corePadCells > 0)
                    {
                        var corePadMask = Dilate8(new HashSet<Vector2Int>(g.CoreTiles), corePadCells, g.LocalMask);
                        r.ExceptWith(corePadMask);
                    }

                    // sliver guard
                    
                    if (r.Count >= minRingTiles) finalRings.Add(r);
                }
                if (finalRings.Count == 0) { Debug.Log($"[P2-SLIVER-EMPTY] room={work.RoomId}"); continue; }
                Debug.Log("P2 - seamSeed: " + seamSeed.Count.ToString() + " - seamClip: " + seamClip.Count.ToString() + " - clipped: " + clipped.Count.ToString() + " - finalRing: " + finalRings.Count.ToString());

                // --- 4) Heights (uniform per-layer) ---
                // Determine the base top of the core slab for this seam group.  We use the
                // maximum top across all platforms on the core terrace.  Each cake layer
                // will be exactly cakeStepHeight thick and offset by multiples of that
                // thickness from the core.  The band logic in earlier revisions has been
                // removed so that layer thickness matches the user-defined value.
                var idxs = new List<int>();
                for (int i = 0; i < work.TerraceLevels.Count; i++)
                    if (work.TerraceLevels[i] == g.CoreTerr) idxs.Add(i);
                if (idxs.Count == 0) continue;

                float coreTopHi = idxs.Max(i => work.PlatformHeights[i]);
                float step = cakeStepHeight;
                float epsLocal = Mathf.Max(0.0001f, microStep * 0.01f);

                // Precompute vertical clamps.  For cake-down we never allow the top of a
                // layer to exceed the highest terrace band (hiTerr+1)*terraceHeight.  For
                // cake-up we never allow the bottom of a layer to drop below the lowest
                // terrace band (loTerr*terraceHeight).  These clamps prevent stacks
                // extending far beyond the transition.
                float clampTop = float.PositiveInfinity;
                float clampBottom = float.NegativeInfinity;
                if (g.Terraces != null && g.Terraces.Count > 0)
                {
                    int hiTerr = g.Terraces.Max();
                    int loTerr = g.Terraces.Min();
                    clampTop = ((hiTerr + 1) * terraceHeight) - epsLocal;
                    clampBottom = (loTerr * terraceHeight) + epsLocal;
                }

                for (int li = 0; li < finalRings.Count; li++)
                {
                    var ring = finalRings[li];
                    if (ring.Count < minRingTiles) continue;

                    float bottom, top;
                    if (g.IsCakeDown)
                    {
                        // Layers ascend above the core: coreTopHi + li*step .. coreTopHi + (li+1)*step
                        bottom = coreTopHi + li * step;
                        top = coreTopHi + (li + 1) * step;
                        // Clamp to the highest terrace to avoid runaway height
                        if (top > clampTop) top = clampTop;
                    }
                    else
                    {
                        // Layers descend below the core: coreTopHi - (li+1)*step .. coreTopHi - li*step
                        top = coreTopHi - li * step;
                        bottom = coreTopHi - (li + 1) * step;
                        // Clamp to the lowest terrace to avoid runaway depth
                        if (bottom < clampBottom) bottom = clampBottom;
                    }

                    float height = top - bottom;
                    if (height <= 0f) continue;

                    BuildPlatformMesh(
                        ring,
                        bottom,
                        height,
                        tileSize,
                        (g.IsCakeDown ? "CakeDw" : "CakeUp") + $"_R{work.RoomId}_T{g.CoreTerr}_{li}",
                        floorMat,
                        chaikinIterations
                    );
                }


            }
        }
        _pendingCakes.Clear();


    }


    // ---- Terrace-edge driven cake detection ----------------------------------
    public static void DetectCakeViaTerraceEdges(
        int roomId,
        List<PlatformSeed> platformSeeds,            // same order as platformTilesPerRoom / terraceLevels
        List<List<Vector2Int>> platformTilesPerRoom,
        List<int> terraceLevels,
        HashSet<Vector2Int> roomAllTiles,
        List<TerraceEdge> allTerraceEdges,           // global list
                                                     // Tunables (can expose in inspector)
        float minMinorFrac,      // e.g. 0.05f  (>=5% of room area)
        float maxMinorFrac,      // e.g. 0.65f  (not basically whole room)
        int minCoreTiles,      // e.g. 8      (avoid dust)
                               // OUT:
        out bool isCakeRoom,
        out bool isCakeDown,
        out int coreTerr,
        out HashSet<Vector2Int> coreTiles,          // minority tile set touching the rim
        out HashSet<Vector2Int> dominantTiles       // dominant terrace tiles (rim)
    )
    {
        isCakeRoom = false;
        isCakeDown = true;
        coreTerr = 0;
        coreTiles = new HashSet<Vector2Int>();
        dominantTiles = new HashSet<Vector2Int>();

        if (platformTilesPerRoom == null || terraceLevels == null ||
            platformTilesPerRoom.Count == 0 || terraceLevels.Count != platformTilesPerRoom.Count)
            return;

        // 0) Build per-terrace tile sets
        var terrToTiles = new Dictionary<int, HashSet<Vector2Int>>();
        for (int i = 0; i < platformTilesPerRoom.Count; i++)
        {
            int terr = terraceLevels[i];
            if (!terrToTiles.TryGetValue(terr, out var set))
                terrToTiles[terr] = set = new HashSet<Vector2Int>();
            foreach (var v in platformTilesPerRoom[i]) set.Add(v);
        }
        if (terrToTiles.Count <= 1) return; // single-terrace => never cake

        // 1) Dominant terrace by area (inside THIS room)
        int domTerr = 0, domArea = -1;
        foreach (var kv in terrToTiles)
            if (kv.Value.Count > domArea) { domArea = kv.Value.Count; domTerr = kv.Key; }
        dominantTiles = terrToTiles[domTerr];

        // 2) Collect terrace edges for THIS room and count contacts against dominant
        var roomTE = allTerraceEdges?.FindAll(te => te.Room == roomId) ?? new List<TerraceEdge>();
        var contactToDom = new Dictionary<int, int>(); // minorityTerr -> edge count touching dom
        var edgePosByPair = new Dictionary<(int, int), HashSet<Vector2Int>>();

        foreach (var te in roomTE)
        {
            int a = te.TerraceFrom, b = te.TerraceTo;
            if (a == b) continue;
            var key = (Mathf.Min(a, b), Mathf.Max(a, b));
            if (!edgePosByPair.TryGetValue(key, out var hs))
                edgePosByPair[key] = hs = new HashSet<Vector2Int>();
            hs.Add(te.Pos);

            // contact score if edge touches dominant
            if (a == domTerr || b == domTerr)
            {
                int other = (a == domTerr) ? b : a;
                if (!contactToDom.ContainsKey(other)) contactToDom[other] = 0;
                contactToDom[other] += 1;
            }
        }

        // 3) Minority candidates = terraces != domTerr with a non-zero contact to dominant
        //    Build a “touching core” by keeping only platforms on that terrace that actually
        //    include at least one edge-pos where (terr, domTerr) appears.
        int bestTerr = domTerr;
        int bestContact = 0;
        float bestFracScore = 0f;

        foreach (var kv in terrToTiles)
        {
            int t = kv.Key; if (t == domTerr) continue;
            contactToDom.TryGetValue(t, out int contact);
            if (contact <= 0) continue; // doesn’t touch dominant ⇒ not a donut/pyramid core

            // Build touching-core set
            var contactKey = (Mathf.Min(t, domTerr), Mathf.Max(t, domTerr));
            edgePosByPair.TryGetValue(contactKey, out var contactEdgePos);
            var touchingCore = new HashSet<Vector2Int>();
            for (int i = 0; i < platformSeeds.Count; i++)
            {
                if (terraceLevels[i] != t) continue;
                var tiles = platformTilesPerRoom[i];
                bool touches = false;
                if (contactEdgePos != null)
                {
                    // if any tile in platform is one of the terrace-edge positions ⇒ touching
                    foreach (var v in tiles) if (contactEdgePos.Contains(v)) { touches = true; break; }
                }
                if (!touches) continue;
                foreach (var v in tiles) touchingCore.Add(v);
            }

            // Size/ratio guards
            int coreCount = touchingCore.Count;
            if (coreCount < minCoreTiles) continue;
            float frac = (roomAllTiles != null && roomAllTiles.Count > 0)
                        ? (float)coreCount / (float)roomAllTiles.Count : 0f;
            if (frac < minMinorFrac || frac > maxMinorFrac) continue;

            // Score: prefer stronger contact, then larger fraction
            if (contact > bestContact || (contact == bestContact && frac > bestFracScore))
            {
                bestContact = contact;
                bestFracScore = frac;
                bestTerr = t;
                coreTiles = touchingCore;
            }
        }

        if (bestTerr == domTerr) return; // no valid minority found

        isCakeRoom = true;
        isCakeDown = (bestTerr < domTerr);   // lower-than-dominant ⇒ bowl; higher ⇒ pyramid
        coreTerr = bestTerr;

        // Final safety: ensure dominant actually touches room boundary (rim logic)
        // (prevents “flower” interiors)
        if (!TouchesRoomBoundary(dominantTiles, roomAllTiles))
        {
            // If the rim doesn’t touch the boundary, treat as not cake
            isCakeRoom = false;
            coreTiles.Clear();
        }
    }

    // Build a corridor around a link's edge tiles.
    // halfWidth = radius in tiles; extraPad = optional extra growth.
    // clipMask can be your component mask (e.g. localMask) or null.
    private HashSet<Vector2Int> BuildSeamWindow(
        HashSet<Vector2Int> linkEdgeTiles,
        HashSet<Vector2Int> clipMask,
        int halfWidth,
        int extraPad = 0)
    {
        if (linkEdgeTiles == null || linkEdgeTiles.Count == 0)
            return new HashSet<Vector2Int>();

        // First grow once with the requested radius
        var win = Dilate8(linkEdgeTiles, Mathf.Max(1, halfWidth), clipMask);

        // Optional extra pad (kept inside the same mask)
        if (extraPad > 0)
            win = Dilate8(win, extraPad, clipMask);

        // Keep corridor inside mask (if provided) and always include the seam points
        if (clipMask != null) win.IntersectWith(clipMask);
        win.UnionWith(linkEdgeTiles);
        return win;
    }


    // little utility (4-neigh): does this terrace set touch the room boundary?
    static bool TouchesRoomBoundary(HashSet<Vector2Int> terrSet, HashSet<Vector2Int> roomSet)
    {
        foreach (var p in terrSet)
        {
            if (!roomSet.Contains(p)) continue;
            if (!roomSet.Contains(p + new Vector2Int(1, 0))) return true;
            if (!roomSet.Contains(p + new Vector2Int(-1, 0))) return true;
            if (!roomSet.Contains(p + new Vector2Int(0, 1))) return true;
            if (!roomSet.Contains(p + new Vector2Int(0, -1))) return true;
        }
        return false;
    }

    // 8-neighbour dilation, r iterations, clipped to mask if provided
    static HashSet<Vector2Int> Dilate8(HashSet<Vector2Int> src, int r, HashSet<Vector2Int> clipMask = null)
    {
        if (src == null || src.Count == 0 || r <= 0) return new HashSet<Vector2Int>(src ?? new());
        var cur = new HashSet<Vector2Int>(src);
        for (int it = 0; it < r; it++)
        {
            var nxt = new HashSet<Vector2Int>(cur);
            foreach (var p in cur)
            {
                for (int k = 0; k < 8; k++)
                {
                    var q = p + DIR8[k];
                    if (clipMask != null && !clipMask.Contains(q)) continue;
                    nxt.Add(q);
                }
            }
            cur = nxt;
        }
        return cur;
    }

    // 8-neighbour BFS distances inside a mask (unit cost)
    static Dictionary<Vector2Int, int> BFSDistances8(HashSet<Vector2Int> sources, HashSet<Vector2Int> mask)
    {
        var dist = new Dictionary<Vector2Int, int>(sources?.Count ?? 0);
        if (sources == null || sources.Count == 0) return dist;
        var q = new Queue<Vector2Int>();
        foreach (var s in sources)
        {
            if (mask != null && !mask.Contains(s)) continue;
            if (!dist.ContainsKey(s)) { dist[s] = 0; q.Enqueue(s); }
        }
        while (q.Count > 0)
        {
            var p = q.Dequeue();
            int d = dist[p];
            for (int k = 0; k < 8; k++)
            {
                var n = p + DIR8[k];
                if (mask != null && !mask.Contains(n)) continue;
                if (dist.ContainsKey(n)) continue;
                dist[n] = d + 1;
                q.Enqueue(n);
            }
        }
        return dist;
    }

    // Optional: close 1-tile diagonal pin-holes in a ring
    static void CloseSmallDiagonalGaps(HashSet<Vector2Int> ring)
    {
        if (ring == null || ring.Count == 0) return;
        var add = new List<Vector2Int>();
        foreach (var p in ring)
        {
            bool ne = ring.Contains(p + new Vector2Int(1, 1));
            bool sw = ring.Contains(p + new Vector2Int(-1, -1));
            bool nw = ring.Contains(p + new Vector2Int(-1, 1));
            bool se = ring.Contains(p + new Vector2Int(1, -1));

            // If diagonals exist but orthogonals missing, stitch one orthogonal
            if (ne && sw)
            {
                var e = p + new Vector2Int(1, 0);
                var n = p + new Vector2Int(0, 1);
                if (!ring.Contains(e)) add.Add(e);
                if (!ring.Contains(n)) add.Add(n);
            }
            if (nw && se)
            {
                var w = p + new Vector2Int(-1, 0);
                var n = p + new Vector2Int(0, 1);
                if (!ring.Contains(w)) add.Add(w);
                if (!ring.Contains(n)) add.Add(n);
            }
        }
        foreach (var a in add) ring.Add(a);
    }

    // BFS distance on a grid inside a mask
    static Dictionary<Vector2Int, int> BFSDistances(HashSet<Vector2Int> sources, HashSet<Vector2Int> mask)
    {
        var dist = new Dictionary<Vector2Int, int>(sources.Count * 8);
        var q = new Queue<Vector2Int>();
        foreach (var s in sources)
        {
            if (!mask.Contains(s)) continue;
            dist[s] = 0; q.Enqueue(s);
        }
        var DIR = new Vector2Int[]{ new Vector2Int(1,0), new Vector2Int(-1,0),
                                new Vector2Int(0,1), new Vector2Int(0,-1) };
        while (q.Count > 0)
        {
            var p = q.Dequeue();
            int d = dist[p];
            for (int i = 0; i < 4; i++)
            {
                var n = p + DIR[i];
                if (!mask.Contains(n) || dist.ContainsKey(n)) continue;
                dist[n] = d + 1; q.Enqueue(n);
            }
        }
        return dist;
    }


    // in-platform or immediate neighbour?
    static bool TouchesPlatform(Vector2Int tile, PlatformSeed ps, int extraDepth = 0)
    {
        if (ps.Tiles.Contains(tile)) return true;
        if (extraDepth == 0) return false;
        foreach (var t in ps.Tiles)
            if (Mathf.Abs(t.x - tile.x) + Mathf.Abs(t.y - tile.y) <= extraDepth)
                return true;
        return false;
    }


    // BFS distance (Manhattan) from multiple seeds, restricted to 'allowed' tiles
    static Dictionary<Vector2Int, int> DistField(HashSet<Vector2Int> seeds, HashSet<Vector2Int> allowed)
    {
        var dist = new Dictionary<Vector2Int, int>();
        var q = new Queue<Vector2Int>();
        foreach (var s in seeds)
        {
            if (!allowed.Contains(s)) continue;
            dist[s] = 0; q.Enqueue(s);
        }
        while (q.Count > 0)
        {
            var p = q.Dequeue();
            int d = dist[p];
            foreach (var dir in DIR8)
            {
                var n = p + dir;
                if (!allowed.Contains(n) || dist.ContainsKey(n)) continue;
                dist[n] = d + 1;
                q.Enqueue(n);
            }
        }
        return dist;
    }



    static (float bandMinTop, float bandMaxTop) TopBand(int terr, float H) =>
    ((terr + 1) * H, (terr + 2) * H);



    // Chebyshev pad (8-neighbour); pad = 0 means exact match
    private static bool TilesContainsPadded(HashSet<Vector2Int> tiles, Vector2Int p, int pad)
    {
        if (pad <= 0) return tiles.Contains(p);
        for (int dx = -pad; dx <= pad; dx++)
            for (int dy = -pad; dy <= pad; dy++)
                if (Mathf.Max(Mathf.Abs(dx), Mathf.Abs(dy)) <= pad &&
                    tiles.Contains(p + new Vector2Int(dx, dy)))
                    return true;
        return false;
    }

    // Robust "is this platform a transition platform?" for scaled tiles
    private bool PlatformHasTransitionEdgesScaled(
        PlatformSeed ps,
        IEnumerable<EdgeTile> edgeTiles,
        int roomId,
        int tilePad,          // e.g. 1 (or 2 if you go > 6-8m tiles)
        float tileSize,       // e.g. 5
        float worldSlack)     // e.g. tileSize * 0.6f
    {
        // 1) collect transition tiles for THIS room (tile space)
        var transTiles = new HashSet<Vector2Int>(
            edgeTiles.Where(e => e.Type == EdgeType.Transition &&
                                 (e.RoomA == roomId || e.RoomB == roomId))
                     .Select(e => e.Pos));

        if (transTiles.Count == 0) return false;

        // 2) fast path: tile-space padded containment
        var psTiles = new HashSet<Vector2Int>(ps.Tiles);
        foreach (var t in transTiles)
            if (TilesContainsPadded(psTiles, t, tilePad))
                return true;

        // 3) slow fallback: world-space proximity to platform outline
        //    GetPlatformOutline returns tile-space polygon; scale to metres
        List<Vector2> polyWorld = GetPlatformOutline(ps)
            .Select(p => new Vector2(p.x * tileSize, p.y * tileSize))
            .ToList();

        foreach (var t in transTiles)
        {
            Vector2 ptW = new Vector2((t.x + 0.5f) * tileSize, (t.y + 0.5f) * tileSize);
            Vector2 closest = ClosestPointOnPolygon(polyWorld, ptW);
            if (Vector2.Distance(ptW, closest) <= worldSlack)
                return true;
        }

        return false;
    }


    // robust: world-outline proximity to any transition tile (meters)
    private bool PlatformNearTransitionsWorld(
        PlatformSeed ps,
        HashSet<Vector2Int> transTiles,
        float tileSize,
        float thresholdMeters)
    {
        // platform outline (world)
        List<Vector2> poly = GetPlatformOutline(ps)
            .Select(p => new Vector2(p.x * tileSize, p.y * tileSize)) // outline is already 0.5-based, keep consistent with your implementation
            .ToList();

        foreach (var t in transTiles)
        {
            Vector2 p = new((t.x + 0.5f) * tileSize, (t.y + 0.5f) * tileSize);
            Vector2 q = ClosestPointOnPolygon(poly, p);
            if (Vector2.Distance(p, q) <= thresholdMeters)
                return true;
        }
        return false;
    }

    // one-shot detector: which platforms in this room are "transition"
    private List<PlatformSeed> FindTransitionPlatforms(
        List<PlatformSeed> roomSeeds,
        List<EdgeTile> allEdges,
        int roomId,
        int tilePad,                // e.g. 1 or 2
        float tileSize,             // e.g. 5
        float worldSlackMeters)     // e.g. tileSize * 0.6f
    {
        // 1) collect all transition tiles belonging to this room (tile space)
        var transTiles = new HashSet<Vector2Int>(
            allEdges.Where(e =>
                    e.Type == EdgeType.Transition &&
                    (e.RoomA == roomId || e.RoomB == roomId))
                    .Select(e => e.Pos));

        var result = new List<PlatformSeed>();

        foreach (var ps in roomSeeds)
        {
            // Fast path: padded tile containment
            bool byTiles = ps.Tiles.Any(t =>
                transTiles.Contains(t) ||
                DIR8.Any(d =>
                {
                    // scan ring up to tilePad
                    for (int r = 1; r <= tilePad; r++)
                        if (transTiles.Contains(t + d * r)) return true;
                    return false;
                }));

            if (byTiles)
            {
                result.Add(ps);
                continue;
            }

            // Slow, robust fallback: world proximity to outline (meters)
            bool byWorld = PlatformNearTransitionsWorld(ps, transTiles, tileSize, worldSlackMeters);
            if (byWorld) result.Add(ps);
        }

        return result;
    }

    IEnumerable<HashSet<Vector2Int>> SplitIntoComponents(HashSet<Vector2Int> tiles)
    {
        var seen = new HashSet<Vector2Int>();
        foreach (var start in tiles)
        {
            if (seen.Contains(start)) continue;
            var comp = new HashSet<Vector2Int>();
            var q = new Queue<Vector2Int>();
            q.Enqueue(start); seen.Add(start);
            while (q.Count > 0)
            {
                var p = q.Dequeue();
                comp.Add(p);
                foreach (var d in DIR8)
                {
                    var np = p + d;
                    if (!seen.Contains(np) && tiles.Contains(np)) { seen.Add(np); q.Enqueue(np); }
                }
            }
            yield return comp;
        }
    }


    private static int MedianTerrace(List<int> vals)
    {
        if (vals == null || vals.Count == 0) return 0;
        vals.Sort();
        int mid = vals.Count / 2;
        return (vals.Count % 2 == 1) ? vals[mid] : (int)Mathf.Round((vals[mid - 1] + vals[mid]) * 0.5f);
    }

    // tiles on the outer rim for THIS room (any edge type)
    private HashSet<Vector2Int> GetRoomEdgeTiles(List<EdgeTile> allEdges, int roomId)
    {
        return new HashSet<Vector2Int>(
            allEdges.Where(e => e.RoomA == roomId || e.RoomB == roomId)
                    .Select(e => e.Pos));
    }

    // pick the “center” platform = platform whose tile-centroid is closest to the
    // room’s overall centroid (tile space). Fallback = largest area.
    private PlatformSeed FindCenterPlatform(List<PlatformSeed> roomSeeds)
    {
        if (roomSeeds == null || roomSeeds.Count == 0) return null;

        // room centroid in tile space
        Vector2 roomCentroid = Vector2.zero;
        int total = 0;
        foreach (var ps in roomSeeds)
        {
            foreach (var t in ps.Tiles) { roomCentroid += new Vector2(t.x + 0.5f, t.y + 0.5f); total++; }
        }
        if (total > 0) roomCentroid /= total;

        PlatformSeed best = null;
        float bestD2 = float.PositiveInfinity;

        foreach (var ps in roomSeeds)
        {
            // platform centroid
            Vector2 c = Vector2.zero;
            foreach (var t in ps.Tiles) c += new Vector2(t.x + 0.5f, t.y + 0.5f);
            c /= Mathf.Max(1, ps.Tiles.Count);

            float d2 = (c - roomCentroid).sqrMagnitude;
            if (d2 < bestD2) { bestD2 = d2; best = ps; }
        }

        // fallback to largest area if somehow null
        if (best == null) best = roomSeeds.OrderByDescending(p => p.Area).First();
        return best;
    }

    // —— KEY: robust cake direction based on terraces (tileSize-independent) ——
    private CakeDirection DetectCakeDirection(List<PlatformSeed> roomSeeds, List<EdgeTile> allEdges, int roomId)
    {
        if (roomSeeds == null || roomSeeds.Count == 0) return CakeDirection.Flat;

        var center = FindCenterPlatform(roomSeeds);
        if (center == null) return CakeDirection.Flat;

        int centerTerr = center.TerraceId;

        // rim = platforms that touch any room edge-tile
        var rimTiles = GetRoomEdgeTiles(allEdges, roomId);
        var rimTerrs = roomSeeds.Where(ps => ps.Tiles.Any(t => rimTiles.Contains(t)))
                                .Select(ps => ps.TerraceId)
                                .ToList();

        if (rimTerrs.Count == 0) return CakeDirection.Flat;

        int rimTerr = MedianTerrace(rimTerrs);

        // interpret:
        // center lower than rim ⇒ steps go DOWN toward center ⇒ CakeDown (bowl)
        // center higher than rim ⇒ steps go UP toward center ⇒ CakeUp (mound)
        if (centerTerr < rimTerr) return CakeDirection.Down;
        if (centerTerr > rimTerr) return CakeDirection.Up;
        return CakeDirection.Flat;
    }

    // principal-axis of a point cloud (2-D PCA, returns unit vector)
    static Vector2 PrincipalAxis(List<Vector2> pts, Vector2 mean)
    {
        float xx = 0, xy = 0, yy = 0;
        foreach (var p in pts)
        {
            Vector2 d = p - mean;
            xx += d.x * d.x;
            xy += d.x * d.y;
            yy += d.y * d.y;
        }
        xx /= pts.Count; xy /= pts.Count; yy /= pts.Count;
        float trace = xx + yy;
        float det = xx * yy - xy * xy;
        float root = Mathf.Sqrt(Mathf.Max(0f, trace * trace - 4f * det));
        float eig = (trace + root) * 0.5f;               // largest eigenvalue
        Vector2 axis = (Mathf.Abs(xy) < 1e-5f && Mathf.Abs(xx - yy) < 1e-5f)
                       ? Vector2.right
                       : (new Vector2(eig - yy, xy)).normalized;
        return axis;
    }

    // closest point on polygon loop
    static Vector2 ClosestPointOnPolygon(List<Vector2> poly, Vector2 p)
    {
        float best = float.PositiveInfinity;
        Vector2 bestPt = p;
        for (int i = 0; i < poly.Count; ++i)
        {
            Vector2 a = poly[i];
            Vector2 b = poly[(i + 1) % poly.Count];
            Vector2 ab = b - a;
            float t = Mathf.Clamp01(Vector2.Dot(p - a, ab) / ab.sqrMagnitude);
            Vector2 proj = a + ab * t;
            float d2 = (p - proj).sqrMagnitude;
            if (d2 < best) { best = d2; bestPt = proj; }
        }
        return bestPt;
    }

    // Return the first (lowest) set bit as a layer index, or a fallback by name.
    // Handles multi-bit masks and invalid masks safely.
    private static int GetSingleLayerIndex(LayerMask mask, string fallbackName)
    {
        int v = mask.value;
        if (v != 0)
        {
            // pick the lowest set bit (so multi-bit masks still produce a valid index)
            int idx = 0;
            while ((v & 1) == 0 && idx < 31) { v >>= 1; idx++; }
            if (idx >= 0 && idx <= 31) return idx;
        }
        // fallback by name (must exist in Project Settings → Tags & Layers)
        return LayerMask.NameToLayer(fallbackName);
    }

    private static void SetLayerRecursively(Transform root, int layerIndex)
    {
        if (layerIndex < 0 || layerIndex > 31) return;
        root.gameObject.layer = layerIndex;
        for (int i = 0; i < root.childCount; i++)
            SetLayerRecursively(root.GetChild(i), layerIndex);
    }


    // Extract border edges from a set of tiles
    private static List<(Vector2 a, Vector2 b)> ExtractBorderEdges(HashSet<Vector2Int> tiles, float ts)
    {
        var edges = new List<(Vector2, Vector2)>();
        var dirs = new[] { Vector2Int.up, Vector2Int.right, Vector2Int.down, Vector2Int.left };
        foreach (var t in tiles)
        {
            var b2 = new Vector2(t.x, t.y) * ts;
            for (int i = 0; i < 4; i++)
            {
                var n = t + dirs[i];
                if (tiles.Contains(n)) continue;
                Vector2 p1, p2;
                switch (i)
                {
                    case 0:
                        p1 = b2 + Vector2.up * ts;
                        p2 = p1 + Vector2.right * ts;
                        break;
                    case 1:
                        p1 = b2 + Vector2.up * ts + Vector2.right * ts;
                        p2 = b2 + Vector2.right * ts;
                        break;
                    case 2:
                        p1 = b2;
                        p2 = p1 + Vector2.right * ts;
                        break;
                    default: // left
                        p1 = b2 + Vector2.up * ts;
                        p2 = b2;
                        break;
                }
                edges.Add((p1, p2));
            }
        }
        return edges;
    }

    // Build a closed loop from unordered edges
    private static List<Vector2> BuildLoopUndirected(List<(Vector2 a, Vector2 b)> segs)
    {
        const float eps = 1e-4f;
        var loop = new List<Vector2>();
        if (segs.Count == 0) return loop;
        var edges = new List<(Vector2, Vector2)>(segs);
        var start = edges[0].Item1;
        Vector2 cur = start;
        loop.Add(cur);
        edges.RemoveAt(0);
        while (edges.Count > 0)
        {
            int idx = -1;
            Vector2 next = cur;
            for (int i = 0; i < edges.Count; i++)
            {
                var (A, B) = edges[i];
                if ((A - cur).sqrMagnitude < eps * eps)
                {
                    next = B;
                    idx = i;
                    break;
                }
                if ((B - cur).sqrMagnitude < eps * eps)
                {
                    next = A;
                    idx = i;
                    break;
                }
            }
            if (idx < 0) break;
            cur = next;
            if ((cur - start).sqrMagnitude < eps * eps) break;
            loop.Add(cur);
            edges.RemoveAt(idx);
        }
        return loop;
    }

    // Chaikin smoothing
    private static List<Vector2> ChaikinSmooth(List<Vector2> pts, int iters)
    {
        var p = new List<Vector2>(pts);
        for (int k = 0; k < iters; k++)
        {
            var nxt = new List<Vector2>();
            for (int i = 0; i < p.Count; i++)
            {
                var A = p[i];
                var B = p[(i + 1) % p.Count];
                nxt.Add(A * 0.75f + B * 0.25f);
                nxt.Add(A * 0.25f + B * 0.75f);
            }
            p = nxt;
        }
        return p;
    }


    // Create a collider‑based top mesh (flat) from outline
    private static Mesh TessellateWithCollider2D(List<Vector2> outline)
    {
        var tmp = new GameObject("TempPolyCollider", typeof(PolygonCollider2D));
        var col = tmp.GetComponent<PolygonCollider2D>();
        col.pathCount = 1;
        col.SetPath(0, outline.ToArray());
        Mesh mesh = col.CreateMesh(false, false);
        GameObject.DestroyImmediate(tmp);
        return mesh;
    }

    // Create or update child game object with a given mesh and material
    //private GameObject CreateChild(string name, Mesh mesh, Material mat, bool isWall = false)
    //{
    //    var child = new GameObject(name);
    //    //FixUVs(mesh);
    //    ApplyBoxProjectionUVs(mesh, 4);
    //    ApplyBoxProjectionTangents(mesh);
    //    // NEW: tangents depend on UVs + normals
    //    mesh.RecalculateTangents();

    //    mesh.RecalculateBounds();
    //    mesh.UploadMeshData(false);
    //    var mf = child.AddComponent<MeshFilter>();
    //    var mr = child.AddComponent<MeshRenderer>();


    //    // ---------- CreateChild ----------

    //    if (isWall)
    //    {
    //        int wallLayer = LayerMask.NameToLayer("Wall");
    //        var mc = child.AddComponent<MeshCollider>();
    //        mc.GetComponent<MeshCollider>().sharedMesh = mesh;
    //        child.layer = wallLayer;
    //    }
    //    mf.sharedMesh = mesh;
    //    mr.sharedMaterial = mat;
    //    return child;
    //}

    // Compose a platform mesh using the same pipeline as skeletonMeshmaker

    private GameObject CreateChild(string name, Mesh mesh, Material mat, bool isWall = false)
    {
        var go = new GameObject(name);
        var mf = go.AddComponent<MeshFilter>();
        var mr = go.AddComponent<MeshRenderer>();

        // Geometry hygiene — order matters for PBR:
        // 1) normals (need valid triangles first)
        mesh.RecalculateBounds();
        mesh.RecalculateNormals();

        // 2) UVs (required before computing tangents)
        ApplyBoxProjectionUVs(mesh, 4f);       // your box-projection

        // 3) tangents (Unity’s solver; reliable if UV0 + normals exist)
        mesh.RecalculateTangents();

        // Optional: if you had custom tangent code, skip it now to avoid conflicts
        // ApplyBoxProjectionTangents(mesh);   // ← remove/disable this call

        mf.sharedMesh = mesh;

        // Material: if none provided, fall back to a Lit shader so it won't be black
        if (mat != null)
        {
            mr.sharedMaterial = mat;
        }
        else
        {
            var fallback =
                Shader.Find("Universal Render Pipeline/Lit") ??
                Shader.Find("HDRP/Lit") ??
                Shader.Find("Standard");
            mr.sharedMaterial = new Material(fallback) { color = Color.gray };
            Debug.LogWarning($"[{name}] Material was null; assigned fallback '{mr.sharedMaterial.shader.name}'.");
        }

        if (isWall)
        {
            int wallLayer = LayerMask.NameToLayer("Wall");
            go.layer = wallLayer;

            var mc = go.AddComponent<MeshCollider>();
            mc.sharedMesh = mesh;
            mc.convex = false;
        }

        return go;
    }



    private void BuildPlatformMesh(HashSet<Vector2Int> platformTiles, float baseY, float height,
        float ts, string name, Material mat, int smoothness, bool istransit = false)
    {
        //if (name.StartsWith("Cake"))
        //    Debug.Log($"[Mesh] {name} tiles={platformTiles?.Count ?? 0} baseY={baseY:F2} height={height:F2}");

        //if (name.StartsWith("Cake"))
        //{
        //    // One pixel dilation converts diagonal touches to 4-neighbour contact.
        //    platformTiles = Dilate(platformTiles, 1);
        //}
        // 1. Extract blocky outline
        var rawEdges = ExtractBorderEdges(platformTiles, ts);
        // Build one or more loops from the edge segments.  A single platform
        // may be a ring (have a hole), in which case we get multiple loops.
        var loops = BuildLoops(rawEdges);

        if (loops.Count == 0)
        {
            
            return;
        }

        // 2. Smooth each loop for organic borders
        var smoothLoops = new List<List<Vector2>>();
        foreach (var loop in loops)
        {
            if (loop.Count < 3) continue;
            var smooth = ChaikinSmooth(loop, smoothness);
            smoothLoops.Add(smooth);
        }
        if (smoothLoops.Count == 0) return;
        // 3. Extrude vertical sides for each loop separately
        float topY = baseY + height;
        int loopIndex = 0;
        foreach (var smoothOutline in smoothLoops)
        {
            var sideMesh = ExtrudeBorder(smoothOutline, baseY, topY, MeshRes);
            var sideChild = CreateChild(name + $"_Loop{loopIndex}_Sides", sideMesh, mat);
            sideChild.transform.SetParent(transform);
            loopIndex++;
            if (istransit)
            {
                int transitionLayer = LayerMask.NameToLayer("Platform"); // or a dedicated "Transition"
                SetLayerRecursively(sideChild.transform, transitionLayer);
            }
        }

        // 4. Create top surface via 2D collider tessellation with holes if necessary
        Mesh topMesh;
        if (smoothLoops.Count == 1)
        {
            topMesh = TessellateWithCollider2D(smoothLoops[0]);
        }
        else
        {
            topMesh = TessellateWithCollider2D(smoothLoops);
        }
        // Fix orientation: flatten z→y for Unity's Y axis height
        Vector3[] topVerts = new Vector3[topMesh.vertices.Length];
        for (int i = 0; i < topMesh.vertices.Length; i++)
        {
            topVerts[i] = new Vector3(topMesh.vertices[i].x, topY, topMesh.vertices[i].y);
        }
        var topCombined = new Mesh();
        topCombined.vertices = topVerts;
        topCombined.triangles = topMesh.triangles;
        topCombined.RecalculateNormals();
        var topChildObj = CreateChild(name + "_Top", topCombined, mat);
        topChildObj.transform.SetParent(transform);
        if (istransit)
        {
            int transitionLayer = LayerMask.NameToLayer("Platform"); // or a dedicated "Transition"
            SetLayerRecursively(topChildObj.transform, transitionLayer);
        }
    }

    // Build a bowl wall around the union of tiles
    private Mesh BuildPocketWall(HashSet<Vector2Int> roomTiles, float ts, float wallTopY, float wallBottomY,
                             float targetSegmentLength = 1f, int verticalSegments = 4)
    {
        // 1. Collect tile centers
        var points = new List<Vector2>();
        foreach (var t in roomTiles)
            points.Add(new Vector2((t.x + 0.5f) * ts, (t.y + 0.5f) * ts));
        if (points.Count < 3) return null;

        // 2. Convex hull (or concave if you implement)
        var hull = ConvexHull2D(points);

        // 3. Chaikin smoothing
        var smooth = ChaikinSmooth(hull, chaikinIterations);

        // 4. Offset outward
        var norms = ComputeNormals2D(smooth);
        var outline = new List<Vector2>(smooth.Count);
        for (int i = 0; i < smooth.Count; i++)
            outline.Add(smooth[i] + norms[i] * outlineOffset);

        // 5. Subdivide horizontally to meet target segment length
        var refinedOutline = SubdivideOutline(outline, targetSegmentLength);

        // 6. Extrude with vertical segmentation
        return ExtrudeBorder(refinedOutline, wallBottomY, wallTopY, verticalSegments);
    }

    // Add evenly spaced subdivisions along the outline
    private List<Vector2> SubdivideOutline(List<Vector2> outline, float targetLen)
    {
        var refined = new List<Vector2>();
        for (int i = 0; i < outline.Count; i++)
        {
            Vector2 a = outline[i];
            Vector2 b = outline[(i + 1) % outline.Count];
            float dist = Vector2.Distance(a, b);
            int segments = Mathf.Max(1, Mathf.CeilToInt(dist / targetLen));
            for (int s = 0; s < segments; s++)
            {
                float t = s / (float)segments;
                refined.Add(Vector2.Lerp(a, b, t));
            }
        }
        return refined;
    }

    // Extrude with vertical segments
    private Mesh ExtrudeBorder(List<Vector2> outline, float bottomY, float topY, int verticalSegments)
    {
        Mesh mesh = new Mesh();
        List<Vector3> vertices = new List<Vector3>();
        List<int> triangles = new List<int>();


        int count = outline.Count;
        float heightStep = (topY - bottomY) / verticalSegments;

        // Vertices
        for (int vSeg = 0; vSeg <= verticalSegments; vSeg++)
        {
            float y = bottomY + vSeg * heightStep;
            for (int i = 0; i < count; i++)
                vertices.Add(new Vector3(outline[i].x, y, outline[i].y));
        }

        // Triangles
        for (int vSeg = 0; vSeg < verticalSegments; vSeg++)
        {
            int baseIndex = vSeg * count;
            int nextIndex = (vSeg + 1) * count;
            for (int i = 0; i < count; i++)
            {
                int next = (i + 1) % count;
                triangles.Add(baseIndex + i);
                triangles.Add(nextIndex + i);
                triangles.Add(nextIndex + next);

                triangles.Add(baseIndex + i);
                triangles.Add(nextIndex + next);
                triangles.Add(baseIndex + next);
            }
        }

        mesh.vertices = vertices.ToArray();
        mesh.triangles = triangles.ToArray();
        //Vector2[] triUV = Unwrapping.GeneratePerTriangleUV(mesh);
        // after vertices/triangles are set:
        mesh.RecalculateNormals();
        mesh.RecalculateBounds();

        //FixUVs(mesh);


        return mesh;
    }

    static void FixUVs(Mesh mesh)
    {
        int[] tris = mesh.triangles;
        Vector3[] verts = mesh.vertices;
        Vector2[] triUV = Unwrapping.GeneratePerTriangleUV(mesh);

        Vector3[] newVerts = new Vector3[tris.Length];
        Vector2[] newUV = new Vector2[tris.Length];

        // one unique vertex per triangle index
        for (int i = 0; i < tris.Length; i++)
        {
            newVerts[i] = verts[tris[i]];
            newUV[i] = triUV[i];
            tris[i] = i;              // re-index
        }

        mesh.vertices = newVerts;
        mesh.triangles = tris;
        mesh.SetUVs(0, newUV);

    }


    /// <summary>
    /// Writes UV0 so every face projects to the axis it is most perpendicular to:
    ///   • ±Y faces  → X-Z plane
    ///   • ±Z faces  → X-Y plane
    ///   • ±X faces  → Z-Y plane
    /// Works on any readable Mesh (procedural or imported).
    /// </summary>
    /// <param name="mesh">Mesh to modify (must be readable/writeable)</param>
    /// <param name="tile">How many times the texture repeats over one Unity unit.
    ///—> Larger value = smaller on - screen texel size.</ param >
    /// <remarks>Feed the same mesh to a Renderer that uses a regular UV-sampling shader.</remarks>

    public static void ApplyBoxProjectionUVs(Mesh mesh, float tile = 4f)
    {
        if (mesh == null) { Debug.LogError("Mesh is null."); return; }
        if (!mesh.isReadable) { Debug.LogError("Mesh must be readable."); return; }

        Vector3[] v = mesh.vertices;
        Vector3[] n = mesh.normals;  // need existing normals to orient faces
        Vector2[] uv = new Vector2[v.Length];

        // Normalize vertex positions to the mesh bounds so UVs span [0,1]
        Bounds b = mesh.bounds;
        Vector3 min = b.min;
        Vector3 size = b.size;
        size.x = Mathf.Max(size.x, Mathf.Epsilon);
        size.y = Mathf.Max(size.y, Mathf.Epsilon);
        size.z = Mathf.Max(size.z, Mathf.Epsilon);

        for (int i = 0; i < v.Length; i++)
        {
            Vector3 pn = v[i] - min;
            Vector3 normal = n[i];
            Vector3 an = new Vector3(Mathf.Abs(normal.x), Mathf.Abs(normal.y), Mathf.Abs(normal.z));

            // Choose axis pair based on dominant normal component
            if (an.y >= an.x && an.y >= an.z)          // top / bottom  (±Y)
                uv[i] = new Vector2(pn.x / size.x, pn.z / size.z);
            else if (an.z >= an.x && an.z >= an.y)     // front / back  (±Z)
                uv[i] = new Vector2(pn.x / size.x, pn.y / size.y);
            else                                       // left / right  (±X)
                uv[i] = new Vector2(pn.z / size.z, pn.y / size.y);

            uv[i] *= tile;   // optional tiling factor
        }

        mesh.uv = uv;            // UV0 channel
    }

    public static void ApplyBoxProjectionTangents(Mesh mesh)
    {
        var n = mesh.normals;          // must exist (RecalculateNormals first)
        var t4 = new Vector4[n.Length];

        for (int i = 0; i < n.Length; i++)
        {
            Vector3 normal = n[i];
            Vector3 an = new Vector3(Mathf.Abs(normal.x), Mathf.Abs(normal.y), Mathf.Abs(normal.z));

            Vector3 tangent;
            float w; // bitangent sign (handedness)

            if (an.y >= an.x && an.y >= an.z)          // ±Y faces → UV = (x,z), U along +X
            { tangent = Vector3.right; w = Mathf.Sign(normal.y); }
            else if (an.z >= an.x && an.z >= an.y)     // ±Z faces → UV = (x,y), U along +X
            { tangent = Vector3.right; w = Mathf.Sign(normal.z); }
            else                                       // ±X faces → UV = (z,y), U along +Z
            { tangent = Vector3.forward; w = Mathf.Sign(normal.x); }

            // Orthonormalize tangent against normal
            tangent = Vector3.Normalize(tangent - normal * Vector3.Dot(normal, tangent));

            // Pack (xyz = tangent, w = bitangent sign)
            t4[i] = new Vector4(tangent.x, tangent.y, tangent.z, w >= 0 ? 1f : -1f);
        }

        mesh.tangents = t4;
    }

    private void OnDrawGizmos()
    {
        if (raystart != null && raystart != Vector3.zero)
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(raystart, 0.25f);
        }
    }

    // Compute 2D convex hull via Graham scan
    private static List<Vector2> ConvexHull2D(List<Vector2> points)
    {
        if (points == null || points.Count == 0) return new List<Vector2>();
        var sorted = points.Distinct().OrderBy(p => p.x).ThenBy(p => p.y).ToList();
        if (sorted.Count < 3) return sorted;
        var lower = new List<Vector2>();
        foreach (var p in sorted)
        {
            while (lower.Count >= 2 && Cross(lower[lower.Count - 2], lower[lower.Count - 1], p) <= 0)
                lower.RemoveAt(lower.Count - 1);
            lower.Add(p);
        }
        var upper = new List<Vector2>();
        for (int i = sorted.Count - 1; i >= 0; i--)
        {
            var p = sorted[i];
            while (upper.Count >= 2 && Cross(upper[upper.Count - 2], upper[upper.Count - 1], p) <= 0)
                upper.RemoveAt(upper.Count - 1);
            upper.Add(p);
        }
        lower.RemoveAt(lower.Count - 1);
        upper.RemoveAt(upper.Count - 1);
        lower.AddRange(upper);
        return lower;
    }

    private static float Cross(Vector2 a, Vector2 b, Vector2 c)
    {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    // Compute normals for smoothing offset
    private static List<Vector2> ComputeNormals2D(List<Vector2> poly)
    {
        var norms = new List<Vector2>(poly.Count);
        for (int i = 0; i < poly.Count; i++)
        {
            var prev = poly[(i - 1 + poly.Count) % poly.Count];
            var curr = poly[i];
            var next = poly[(i + 1) % poly.Count];
            var e0 = (curr - prev).normalized;
            var e1 = (next - curr).normalized;
            var n0 = new Vector2(-e0.y, e0.x);
            var n1 = new Vector2(-e1.y, e1.x);
            norms.Add((n0 + n1).normalized);
        }
        return norms;
    }

    // Dilation helper replicates skeletonMeshmaker's Dilate
    private static HashSet<Vector2Int> Dilate(HashSet<Vector2Int> input, int dilateWidth)
    {
        var output = new HashSet<Vector2Int>(input);
        foreach (var t in input)
        {
            for (int dx = -dilateWidth; dx <= dilateWidth; dx++)
            {
                for (int dy = -dilateWidth; dy <= dilateWidth; dy++)
                {
                    if (dx == 0 && dy == 0) continue;
                    output.Add(new Vector2Int(t.x + dx, t.y + dy));
                }
            }
        }
        return output;
    }

    private static List<HashSet<Vector2Int>> GenerateCakeDownLayersV2(
        HashSet<Vector2Int> core,
        HashSet<Vector2Int> mask,
        int nLayers,
        int dilatePerLayer)
    {
        var layers = new List<HashSet<Vector2Int>>();
        var lastLayer = new HashSet<Vector2Int>(core);
        var alreadyFilled = new HashSet<Vector2Int>(core);
        const int MIN_LAYER_SIZE = 4;
        for (int i = 0; i < nLayers; i++)
        {
            var nextLayer = Dilate(lastLayer, dilatePerLayer);
            nextLayer.IntersectWith(mask);
            nextLayer.ExceptWith(alreadyFilled);
            if (nextLayer.Count < MIN_LAYER_SIZE)
            {
                if (layers.Count > 0)
                    layers.Add(new HashSet<Vector2Int>(layers[layers.Count - 1]));
                else
                    layers.Add(new HashSet<Vector2Int>(lastLayer));
            }
            else
            {
                layers.Add(new HashSet<Vector2Int>(nextLayer));
                alreadyFilled.UnionWith(nextLayer);
                lastLayer = nextLayer;
            }
        }
        return layers;
    }

    // Fast border extractor re-using existing tile-edge helpers
    private List<Vector2> GetPlatformOutline(PlatformSeed ps)
    {
        var borderEdges = ExtractBorderEdges(ps.Tiles.ToHashSet(), tileSize);         // already in the file
        var loop = BuildLoopUndirected(borderEdges);     // already in the file
        return ChaikinSmooth(loop, 1);                          // already in the file
    }

    // In-circle of convex hull (iterative shrink – fast enough for ≤ ~64 verts)
    // Replace the old ComputeInCircle method completely
    private void ComputeInCircle(List<Vector2> poly, out Vector2 center, out float radius)
    {
        // start at centroid
        Vector2 c = Vector2.zero;
        foreach (var p in poly) c += p;
        c /= poly.Count;

        // initial radius = distance to nearest vertex
        radius = float.MaxValue;
        foreach (var p in poly)
            radius = Mathf.Min(radius, Vector2.Distance(c, p));

        // simple refine: nudge toward farthest vertex a few times
        for (int i = 0; i < 6; ++i)
        {
            Vector2 far = poly
                .OrderByDescending(v => Vector2.Distance(c, v))
                .First();
            Vector2 dir = (far - c).normalized * 0.25f * radius;
            c += dir;

            // recompute radius after move
            radius = poly.Min(v => Vector2.Distance(c, v));
        }

        center = c;   // assign *after* we’re done so we don’t capture the out-var in lambdas
    }



    /// Removes wall triangles that intersect the cylinder footprint and lie
    /// ABOVE the disc’s top surface.
    ///   wallMF      – RoomWall MeshFilter (local vertices)
    ///   cylLocal    – disc centre, already in WALL-LOCAL coords
    ///   radius      – disc radius (not diameter)
    ///   yMin        – cut starts at this Y and goes upward
    private void CarveWallAboveCylinder(
        MeshFilter wallMF, Transform wallTf,
        Vector3 cylWorld, float radius, float yMinWorld)
    {
        Mesh m = wallMF.sharedMesh;
        Vector3[] verts = m.vertices;
        List<int> tris = new List<int>(m.triangles);

        float r2 = radius * radius;
        const float EPS = 1e-4f;

        // put this once, just after you fetch the mesh arrays
        Vector3 sampleVertWorld = wallTf.TransformPoint(verts[tris[0]]);

        // … after you have cylCtr and doorRadius …
        float d = Vector2.Distance(
                    new Vector2(sampleVertWorld.x, sampleVertWorld.z),
                    new Vector2(cylWorld.x, cylWorld.z));

        Debug.Log($"sampleVertWorld dist = {d:F3},   radius = {radius:F3}");

        for (int i = tris.Count - 3; i >= 0; i -= 3)
        {
            // transform once → world space
            Vector3 aW = wallTf.TransformPoint(verts[tris[i]]);
            Vector3 bW = wallTf.TransformPoint(verts[tris[i + 1]]);
            Vector3 cW = wallTf.TransformPoint(verts[tris[i + 2]]);

            // skip if entire tri is below the disc
            if (aW.y < yMinWorld && bW.y < yMinWorld && cW.y < yMinWorld)
                continue;

            int inside = 0;
            if ((new Vector2(aW.x - cylWorld.x, aW.z - cylWorld.z)).sqrMagnitude <= r2 + EPS) inside++;
            if ((new Vector2(bW.x - cylWorld.x, bW.z - cylWorld.z)).sqrMagnitude <= r2 + EPS) inside++;
            if ((new Vector2(cW.x - cylWorld.x, cW.z - cylWorld.z)).sqrMagnitude <= r2 + EPS) inside++;

            if (inside >= 2)
                tris.RemoveRange(i, 3);
        }



        m.triangles = tris.ToArray();
        m.RecalculateBounds();
    }

    /// Punches a circular hole straight through a wall mesh.
    ///   wallMF     – wall MeshFilter (Transform = local space).
    ///   cylLocal   – circle centre in wall-local space (X,Z).
    ///   radius     – doorway radius (world units).
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static void SubtractCircularDoorway(
        MeshFilter wallMF, Vector3 cylLocal, float radius)
    {
        if (wallMF == null || wallMF.sharedMesh == null)
        {
            Debug.LogError("SubtractCircularDoorway: Invalid MeshFilter or mesh");
            return;
        }

        Mesh originalMesh = wallMF.sharedMesh;
        Mesh m = Instantiate(originalMesh);
        Vector3[] vertices = m.vertices;
        List<int> triangles = new List<int>(m.triangles);
        int originalTriCount = triangles.Count / 3;

        // Convert radius to local space
        Transform meshTransform = wallMF.transform;
        Vector3 worldScale = meshTransform.lossyScale;
        float localRadius = radius / Mathf.Max(worldScale.x, worldScale.z); // Use max scale component
        float r2 = localRadius * localRadius;
        const float EPS = 1e-4f;


        // Remove triangles that are significantly inside the circle
        for (int i = triangles.Count - 3; i >= 0; i -= 3)
        {
            int a = triangles[i], b = triangles[i + 1], c = triangles[i + 2];

            // Check if vertices are valid indices
            if (a >= vertices.Length || b >= vertices.Length || c >= vertices.Length)
            {
                Debug.LogWarning($"Invalid triangle indices: {a}, {b}, {c} (vertex count: {vertices.Length})");
                continue;
            }

            Vector3 vA = vertices[a];
            Vector3 vB = vertices[b];
            Vector3 vC = vertices[c];

            // Calculate distances from cylinder center (ignore Y component)
            float distA2 = Mathf.Sqrt((vA.x - cylLocal.x) * (vA.x - cylLocal.x) + (vA.z - cylLocal.z) * (vA.z - cylLocal.z));
            float distB2 = Mathf.Sqrt((vB.x - cylLocal.x) * (vB.x - cylLocal.x) + (vB.z - cylLocal.z) * (vB.z - cylLocal.z));
            float distC2 = Mathf.Sqrt((vC.x - cylLocal.x) * (vC.x - cylLocal.x) + (vC.z - cylLocal.z) * (vC.z - cylLocal.z));

            int insideCount = 0;
            if (distA2 <= r2 + EPS)
            {
                insideCount++;

            }
            if (distB2 <= r2 + EPS) insideCount++;
            if (distC2 <= r2 + EPS) insideCount++;

            // More conservative removal: only remove if majority of vertices are inside
            // or if triangle centroid is well inside the circle

            if (insideCount >= 1) triangles.RemoveRange(i, 3);           // 1-of-3 rule for thin wall

        }

        int finalTriCount = triangles.Count / 3;
        Debug.Log($"Doorway cut complete: triangles before={originalTriCount}, after={finalTriCount}, removed={originalTriCount - finalTriCount}");

        // Update mesh
        m.triangles = triangles.ToArray();
        m.RecalculateBounds();
        m.RecalculateNormals();
        m.Optimize();


        // Update MeshFilter
        wallMF.sharedMesh = m;

        // Update MeshCollider if present
        MeshCollider meshCollider = wallMF.GetComponent<MeshCollider>();
        if (meshCollider != null)
        {
            meshCollider.cookingOptions = MeshColliderCookingOptions.EnableMeshCleaning |
                                         MeshColliderCookingOptions.WeldColocatedVertices;
            meshCollider.sharedMesh = null; // Clear first to force update
            meshCollider.sharedMesh = m;

            // Force physics update
            if (meshCollider.enabled)
            {
                meshCollider.enabled = false;
                meshCollider.enabled = true;
            }
        }
    }

    // Very plain bridge slab (+ optional low rails)
    private GameObject BuildBridge(Vector3 from, Vector3 to, float width, float thickness)
    {
        Vector3 dir = to - from;
        dir.y = 0f;                                  // ensure horizontal
        float len = dir.magnitude;
        if (len < 0.01f) return null;
        dir /= len;




        Vector3 up = Vector3.up;
        Vector3 right = Vector3.Cross(up, dir).normalized;

        Vector3 sz = new Vector3(width, thickness, len);

        var go = new GameObject("Bridge");
        var mf = go.AddComponent<MeshFilter>();
        var mr = go.AddComponent<MeshRenderer>();
        mr.sharedMaterial = transitionMat;

        // box mesh
        Mesh m = new Mesh();
        Vector3 p0 = -right * width * 0.5f;
        Vector3 p1 = right * width * 0.5f;
        Vector3 p2 = p0 + dir * len;
        Vector3 p3 = p1 + dir * len;
        float h = thickness;

        m.vertices = new Vector3[] {
        p0, p1, p2, p3,
        p0+up*h, p1+up*h, p2+up*h, p3+up*h
    };
        m.triangles = new int[] {
        0,1,2, 2,1,3,       // bottom
        4,6,5, 5,6,7,       // top
        0,2,4, 4,2,6,       // left
        1,5,3, 3,5,7,       // right
        0,4,1, 1,4,5,       // near
        2,3,6, 6,3,7        // far
    };
        m.RecalculateNormals();
        m.RecalculateBounds();
        m.Optimize();

        mf.sharedMesh = m;
        // 2. Tell PhysX to recook in a forgiving mode


        go.transform.position = from;
        go.transform.rotation = Quaternion.LookRotation(dir, up);
        return go;
    }

    // Minimal convex-convex Sutherland-Hodgman polygon intersection
    private List<Vector2> PolygonClip(List<Vector2> subj, List<Vector2> clip)
    {
        List<Vector2> output = new List<Vector2>(subj);

        for (int i = 0; i < clip.Count; ++i)
        {
            Vector2 A = clip[i];
            Vector2 B = clip[(i + 1) % clip.Count];
            Vector2 edgeDir = B - A;
            Vector2 edgeNormal = new Vector2(-edgeDir.y, edgeDir.x).normalized; // outward normal

            List<Vector2> input = output;
            output = new List<Vector2>();
            if (input.Count == 0) break;

            Vector2 S = input[input.Count - 1];
            for (int j = 0; j < input.Count; ++j)
            {
                Vector2 E = input[j];

                float dE = Vector2.Dot(edgeNormal, E - A);
                float dS = Vector2.Dot(edgeNormal, S - A);

                if (dE <= 0)     // E is inside
                {
                    if (dS > 0)  // S was outside → add intersection
                    {
                        Vector2 I = IntersectLines(S, E, A, B);
                        output.Add(I);
                    }
                    output.Add(E);
                }
                else if (dS <= 0) // S inside, E outside → add intersection only
                {
                    Vector2 I = IntersectLines(S, E, A, B);
                    output.Add(I);
                }
                S = E;
            }
        }
        return output;
    }

    // line–line intersection helper
    private Vector2 IntersectLines(Vector2 p1, Vector2 p2, Vector2 p3, Vector2 p4)
    {
        Vector2 s1 = p2 - p1;
        Vector2 s2 = p4 - p3;

        float s, t;
        float denom = (-s2.x * s1.y + s1.x * s2.y);
        if (Mathf.Abs(denom) < 1e-5f) return p1; // parallel fall-back
        s = (-s1.y * (p1.x - p3.x) + s1.x * (p1.y - p3.y)) / denom;
        t = (s2.x * (p1.y - p3.y) - s2.y * (p1.x - p3.x)) / denom;

        return p1 + (t * s1);
    }

    [Serializable]
    public class RoomCakeWorkItem
    {
        public int RoomId;
        public int MainTerrace;                  // chosen by area (fallback: platform count)
        public List<int> TerraceLevels;          // copy from pass 1
        public float[] PlatformHeights;          // tops (terrace+micro) from pass 1
        public List<SeamGroup> Groups = new();   // one per TerraceEdge-connected component
    }

    [Serializable]
    public class SeamGroup
    {
        public HashSet<int> Terraces = new();           // terrace ids within this seam component
        public List<(int a, int b)> Links = new();       // unique terrace pairs e.g. (2,3)
        public List<Vector2Int> EdgeTiles = new();      // all TerraceEdge.Pos for this component
        public int CoreTerr;                            // min (Down) or max (Up)
        public bool IsCakeDown;                         // bowl if true; pyramid if false
        public HashSet<Vector2Int> CoreTiles;           // tiles on CoreTerr near the seam
        public HashSet<Vector2Int> LocalMask;           // limiter mask inside this component
        public HashSet<Vector2Int> LowTerrTiles;        // for CakeUp bias (tiles below CoreTerr)
        public HashSet<Vector2Int> SeamWindow;
        public HashSet<Vector2Int> HighTerrTiles; // used only for CakeDown bias

    }


    #endregion
}