using BlkEvo.ProcGen;
using System.Collections.Generic;
using UnityEngine;
using static BlkEvo.ProcGen.EDunProcGen;

[CreateAssetMenu(fileName = "genData", menuName = "PGen", order = 0)]
public class GenStructuralData : ScriptableObject
{
    [SerializeField]    
    public float[,] heightMap;
    [SerializeField]
    public SlopeType[,] slopeClassified;
    [SerializeField]
    public List<Room> rooms;
    [SerializeField]
    public List<EdgeTile> edges;
    [SerializeField]
    public List<TerraceEdge> terraceEdges;
    [SerializeField]
    public Dictionary<(int, int), List<Vector2Int>> RoomSegments; // raw tiles per room
    [SerializeField]
    public List<CoreConnection> AStarConnections;
    [SerializeField]
    public List<PlatformSeed> allPlatforms;
    [SerializeField]
    public HashSet<Vector2Int> forbidden;
    [SerializeField]
    public List<RoomCore> cores;
    [SerializeField]
    public Texture2D heightbase;

    public void totalFill(float[,] hMap, SlopeType[,] slopeC, List<Room> roms, List<EdgeTile> edgesList, List<TerraceEdge> terraceEds, Dictionary<(int, int), List<Vector2Int>> RoomS, List<CoreConnection> AStar, List<PlatformSeed> allPla, HashSet<Vector2Int> forb, List<RoomCore> crs)
    {
        heightMap = hMap;
        slopeClassified = slopeC;   
        rooms = roms;
        edges = edgesList;
        terraceEdges = terraceEds;
        RoomSegments = RoomS;
        AStarConnections = AStar;
        allPlatforms = allPla;
        forbidden = forb;
        cores = crs;
    }

}
