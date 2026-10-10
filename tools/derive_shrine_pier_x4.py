"""Derive data/shrine_pier_x4.json (40x40) from data/shrine_pier.json (10x10): a DECOMPRESSED stage of core example 2 for the Stage crystallizer.
The result is DERIVED data (not the user's spreadsheets): the spreadsheets are a 10x10 prototype, compressed beyond what a stage needs.
Simplest rule that keeps a SHAPE (no bigger blocky square):
  1. ground: cubic interpolation x4 of the continuous ground (the spreadsheet keeps full precision), sea cells taken as 0 so the coast slopes;
  2. bodies re-stamped with the Recipe radii x4 (Semantic_Perlin_Negotiation_Step1.xlsx, Recipe!B10:J13): solid flat at the body height,
     footprint = the Inner radius, flat and slightly sunken, a short blend ring outside it;
  3. forest density -> jittered trees (not one per cell), kept out of the footprints;
  4. the OVERLOOKS corridor (Recipe "LOS corridor half-width" 0.72 cells) re-applied at the new scale: no tree within it.
Sea cells: (lowest land - 0.5) and the water mask, as in shrine_pier.json (0 is VOID in the viewer).
Usage: python3 tools/derive_shrine_pier_x4.py   (needs numpy and scipy)"""
import json, os, numpy as np
from scipy import ndimage as ndi
ROOT = os.path.join(os.path.dirname(__file__), '..')
src = json.load(open(os.path.join(ROOT, 'data/shrine_pier.json')))
K = 4; N = 10 * K
ground = np.array(src['elevation'], float).reshape(10, 10); bodies = np.array(src['bodies']).reshape(10, 10)
g0 = ground.copy(); g0[bodies == 4] = 0.0
dens = np.array(src['forestDensity'], float).reshape(10, 10)
yy, xx = np.mgrid[0:N, 0:N]; cy = (yy + 0.5) / K - 0.5; cx = (xx + 0.5) / K - 0.5
h = ndi.map_coordinates(g0, [cy, cx], order=3, mode='nearest'); d = ndi.map_coordinates(dens, [cy, cx], order=1, mode='nearest')
sea = xx >= 9 * K
h = np.clip(h, 0.9, None)
# Recipe radii (cells): Shrine solid 0.65, inner 1.45, outer 2.15, influence 3.6, ground 5.6; Pier solid 0.45, inner 1.2, outer 1.6, influence 2.8, ground 1.4
S = dict(c=[(4 + 0.5) * K, (7 + 0.5) * K], solid=0.65 * K, foot=1.45 * K, rej=2.15 * K, infl=3.6 * K, h=5.6)
Pq = dict(c=[(8 + 0.5) * K, (7 + 0.5) * K], solid=0.45 * K, foot=1.2 * K, rej=1.6 * K, infl=2.8 * K, h=1.4)
def stamp(h, b, sink):
    r = np.hypot(xx + 0.5 - b['c'][0], yy + 0.5 - b['c'][1])
    blend = np.clip((r - b['foot']) / (K * 0.75), 0, 1); blend = blend * blend * (3 - 2 * blend)
    plaza = b['h'] - sink
    out = np.where(r <= b['foot'], plaza, h * blend + plaza * (1 - blend))
    return np.where(r <= b['solid'], b['h'], out)
h = stamp(h, S, 0.12); h = stamp(h, Pq, 0.05)
land = h[~sea]; seaH = round(float(land.min()) - 0.5, 6); h[sea] = seaH
rng = np.random.default_rng(7); trees = []
eye = np.array(S['c']); tgt = np.array(Pq['c']); half = 0.72 * K
def segdist(p):
    v = tgt - eye; t = np.clip(np.dot(p - eye, v) / np.dot(v, v), 0, 1); return np.linalg.norm(p - (eye + t * v))
for gy in range(0, N, 2):
    for gx in range(0, N, 2):
        p = np.array([gx + rng.uniform(0.3, 1.7), gy + rng.uniform(0.3, 1.7)]); ix, iy = int(p[0]), int(p[1])
        if ix >= N or iy >= N or sea[iy, ix] or d[iy, ix] < 0.45 or rng.random() > d[iy, ix]: continue
        if np.hypot(*(p - eye)) < S['foot'] + 0.5 or np.hypot(*(p - tgt)) < Pq['foot'] + 0.5 or segdist(p) < half: continue
        trees.append([round(float(p[0]), 2), round(float(p[1]), 2)])
pack = {"format": "evodun-pack/0.1", "name": "Shrine-Pier x4 (decompressed, DERIVED)",
        "source": "DERIVED by tools/derive_shrine_pier_x4.py from data/shrine_pier.json (core example 2) and the Recipe radii of Semantic_Perlin_Negotiation_Step1.xlsx; not the user's data.",
        "note": "Cubic x4 of the continuous ground, Shrine and Pier re-stamped (solid flat, footprint = Inner radius flat and slightly sunken), forest density -> jittered trees, OVERLOOKS corridor re-applied. Sea = lowest land - 0.5 + water mask. landmarks: c (tile coords), solid / foot / rej / infl radii in tiles, h = body ground in the spreadsheet units. trees: [x, y] in tile coords. stageYaw: the Stage camera looks from the sea (Pier in front, Shrine behind).",
        "width": N, "height": N, "elevation": [round(float(v), 5) for v in h.flatten()], "masks": {"water": sea.astype(int).flatten().tolist()},
        "markers": [{"x": int(S['c'][0]), "y": int(S['c'][1]), "code": "S", "label": "Shrine"}, {"x": int(Pq['c'][0]), "y": int(Pq['c'][1]), "code": "P", "label": "Pier"}],
        "landmarks": {"shrine": S, "pier": Pq}, "trees": trees, "stageYaw": 90}
json.dump(pack, open(os.path.join(ROOT, 'data/shrine_pier_x4.json'), 'w'))
print(N, float(h.min()), float(h.max()), len(trees))
