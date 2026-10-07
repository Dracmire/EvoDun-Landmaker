using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using static BlkEvo.ProcGen.EDunProcGen;

/// <summary>
///     This component reads platform seeds from a GenData ScriptableObject,
///     computes a simple critical path (first room only for demonstration),
///     and then invokes the SingleRoomMeshGenerator logic to build a
///     full 3D representation of that room.  It follows the same height
///     computation, cake layer generation and wall/bowl construction as
///     SingleRoomMeshGenerator but pulls its input from the GenData asset.
/// </summary>
public class SingleRoomMeshFromGenDataV3 : MonoBehaviour
{
    [Header("Generation asset")]
    public GenStructuralData genDataAsset;

    [Header("Room selection")]
    public bool pickRandomRoom = true;
    public int overrideRoomId = -1;

    [Header("Spawning mode")]
    [SerializeField] 
    private bool spawnAllRooms = false;   // toggle in Inspector

    [Header("Height settings")]
    public int microLevels = 3;
    public float microStep = 0.2f;
    public float terraceHeight = 1.0f;
    [Header("Cake settings")]
    public int cakeLayers = 0;
    public float cakeStepHeight = 1.0f;
    public int dilationPerLayer = 1;
    [Header("Mesh appearance")]
    public Material floorMaterial;
    public Material wallMaterial;
    public int Meshres = 4;
    [Tooltip("Material to highlight transition (lobby) platforms")] public Material transitionMaterial;
    public float bowlHeight = 2.0f;
    public int chaikinIterations = 3;
    public float outlineOffset = 0.5f;

    // When called from Inspector, generate the first room in the critical path
    [ContextMenu("Generate Room From GenData")]
    public void GenerateRoomFromGenData()
    {
        if (genDataAsset == null)
        {
            Debug.LogError("GenData asset not assigned.");
            return;
        }
        // Group platform seeds by room
        var grouped = new Dictionary<int, List<PlatformSeed>>();
        foreach (var seed in genDataAsset.allPlatforms)
        {
            if (!grouped.ContainsKey(seed.RoomId)) grouped[seed.RoomId] = new List<PlatformSeed>();
            grouped[seed.RoomId].Add(seed);
        }
        if (grouped.Count == 0)
        {
            Debug.LogError("No platforms found in GenData asset.");
            return;
        }
        // Pick a room
        int roomId;
        if (overrideRoomId >= 0 && grouped.ContainsKey(overrideRoomId))
            roomId = overrideRoomId;
        else if (pickRandomRoom)
            roomId = grouped.Keys.ElementAt(Random.Range(0, grouped.Count));
        else
            roomId = grouped.Keys.First();

        var roomSeeds = grouped[roomId];

        
        // Extract tiles per platform and terrace levels
        var platformTiles = new List<List<Vector2Int>>();
        var terraces = new List<int>();
        foreach (var ps in roomSeeds)
        {
            var list = new List<Vector2Int>();

           

            foreach (var t in ps.Tiles)
            {
                list.Add(t);
            }
            platformTiles.Add(list);
            terraces.Add(ps.TerraceId);
        }


        // Use SingleRoomMeshGenerator to build the meshes
        var generator = gameObject.GetComponent<SingleRoomMeshGeneratorV164>();
        generator.platformTilesPerRoom = platformTiles;
        generator.terrainEdges = genDataAsset.terraceEdges;
        generator.terraceLevels = terraces;
        generator.microLevels = microLevels;
        generator.microStep = microStep;
        generator.terraceHeight = terraceHeight;
        generator.cakeLayers = cakeLayers;
        generator.cakeStepHeight = cakeStepHeight;
        generator.dilationPerLayer = dilationPerLayer;
        generator.floorMat = floorMaterial;
        generator.wallMat = wallMaterial;
        generator.transitionMat = transitionMaterial;
        generator.bowlHeight = bowlHeight;
        generator.chaikinIterations = chaikinIterations;
        generator.outlineOffset = outlineOffset;
        generator.MeshRes = Meshres;
        // Pass extra data for classification and transitions
        generator.roomId = roomId;
        generator.edgeTiles = genDataAsset != null ? new List<EdgeTile>(genDataAsset.edges) : null;
        generator.platformSeeds = roomSeeds;
        // Trigger generation
        //generator.GenerateRoom();

        generator.GenerateTransitions(new List<EdgeTile>(genDataAsset.edges), roomSeeds, roomId);
    }

    [ContextMenu("Generate Room From GenDataV2")]
    public void GenerateRoomFromGenDataV2()
    {
        if (genDataAsset == null)
        {
            Debug.LogError("GenData asset not assigned.");
            return;
        }

        // get or add the generator ON THIS GAMEOBJECT
        var gen = GetComponent<SingleRoomMeshGeneratorV164>() ??
                  gameObject.AddComponent<SingleRoomMeshGeneratorV164>();

        // pass raw data + your toggle straight through
        gen.BuildFromSeeds(
            new List<PlatformSeed>(genDataAsset.allPlatforms),
            new List<EdgeTile>(genDataAsset.edges),
            new List<TerraceEdge>(genDataAsset.terraceEdges),
            spawnAllRooms  // true = build ALL rooms, false = one random (legacy)
        );
    }
}