#!/usr/bin/env python3
"""Throne room of Aliahan Castle ("MAPA 1") -> PNGs of ROLES for the window of mode 3 (commit 1 of the throne world).
Deterministic (no random numbers). Needs numpy and Pillow.

    python3 derive_roles.py [--out DIR] [--check]       (defaults: --out = the folder of this script; --check = write nothing, compare with the files that exist)

Input: map1.txt (next to this script): the ONE source of truth, a grid of old tiles with a legend (read by hand from the SFC half of refs/dq3/pairs/p_20261029_192049_throne_room_orig_remake.png).
Output (each old tile = SC x SC px, SC = 2, like Forest: 1 px = 1 viewer tile at tilesPerH 2 and 1 H = 0.75 old tile at tilesPerH 1.5, the hero of the remake measures 0.72 old tiles):
  zones.png   role `zone`      hue ids (h = id / 5, maxnode 4): 1 NAVE (walkable: the dais, the carpet and the side floor), 2 ENT (walkable: the entrance passage and its landing), 3 PILLAR (six loose blocked cells), 4 WALL (walls and the parapet)
  height.png  role `elevation` grey V: 20 for sub-level 0 and 20 + 2 x level + 1 for the others (the middle of the 2-grey band), 52 for the walls (the top of the map), the parapet at level 4 (29); the viewer (terraces 2, subs 8, pre 0) turns grey g into sub-level floor((g - 20) / 2) of the floor terrace
  path.png    role `path`      graded: 255 on the carpet (nave and entrance passage), 0 elsewhere
  poi.png     role `poi`       graded: 255 on the throne tile
  manifest.json                evodun-pack/0.2 with the roles, flipY false, maxnode 4
"""
import sys, os, json, colorsys, argparse
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SC = 2
NAVE, ENT, PILLAR, WALL = 1, 2, 3, 4
MAXNODE = 4
BASE, WALL_GREY = 20, 52
STEP = 2                                      # grey values per sub-level: terraces 2 over the range 20..52 = 16 grey each, subs 8 -> 2 grey per sub-level; a value in the MIDDLE of its band (never on a boundary: float32 would floor it one level down)
def grey(level): return BASE if level == 0 else BASE + STEP * level + 1
PARAPET_GREY = grey(4)

def read_grid(path):
    rows = [l.rstrip('\n') for l in open(path, encoding='utf8') if l.strip() and not l.startswith('#')]
    w = len(rows[0])
    for i, r in enumerate(rows):
        if len(r) != w: sys.exit('map1.txt: row %d has %d columns, expected %d' % (i, len(r), w))
    return rows

def classify(grid):
    H, W = len(grid), len(grid[0])
    z = np.zeros((H, W), np.int32); g = np.zeros((H, W), np.int32); p = np.zeros((H, W), np.int32); q = np.zeros((H, W), np.int32)
    for y in range(H):
        for x in range(W):
            c = grid[y][x]
            if c == 'W': z[y, x], g[y, x] = WALL, WALL_GREY
            elif c == 'p': z[y, x], g[y, x] = WALL, PARAPET_GREY
            elif c == 'P': z[y, x], g[y, x] = PILLAR, BASE
            elif c == 'Q': z[y, x], g[y, x] = PILLAR, grey(5)
            elif c in '012345': z[y, x], g[y, x] = NAVE, grey(int(c))
            elif c in 'abcdef': z[y, x], g[y, x], p[y, x] = NAVE, grey('abcdef'.index(c)), 255
            elif c == 'T': z[y, x], g[y, x], p[y, x], q[y, x] = NAVE, grey(5), 255, 255
            elif c == 'G': z[y, x], g[y, x], p[y, x] = ENT, BASE, 255
            elif c == 'E': z[y, x], g[y, x] = ENT, BASE
            else: sys.exit('map1.txt: unknown character %r at row %d, column %d' % (c, y, x))
    return z, g, p, q

def rgba(a3): return np.dstack([a3, np.full(a3.shape[:2], 255, np.uint8)])

def build(grid):
    z, g, p, q = classify(grid)
    up = lambda a: np.kron(a, np.ones((SC, SC), a.dtype))
    zz = up(z); rgb = np.zeros(zz.shape + (3,), np.uint8)
    for k in range(1, MAXNODE + 1):
        r, gg, b = colorsys.hsv_to_rgb(k / (MAXNODE + 1), 1, 1); rgb[zz == k] = [round(r * 255), round(gg * 255), round(b * 255)]
    gray = lambda a: np.dstack([up(a).astype(np.uint8)] * 3)
    manifest = {'format': 'evodun-pack/0.2', 'name': 'Throne room of Aliahan (MAPA 1)', 'flipY': False, 'maxnode': MAXNODE,
                'roles': {'elevation': {'image': 'height.png', 'channel': 'V'}, 'zone': {'image': 'zones.png', 'channel': 'H'}, 'path': {'image': 'path.png', 'channel': 'V'}, 'poi': {'image': 'poi.png', 'channel': 'V'}}}
    return {'zones.png': rgba(rgb), 'height.png': rgba(gray(g)), 'path.png': rgba(gray(p)), 'poi.png': rgba(gray(q))}, manifest, z

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=HERE); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
    grid = read_grid(os.path.join(HERE, 'map1.txt')); imgs, manifest, z = build(grid)
    names = {1: 'NAVE', 2: 'ENT', 3: 'PILLAR', 4: 'WALL'}
    print('grid %d x %d old tiles -> %d x %d px; tiles per zone: %s' % (len(grid[0]), len(grid), len(grid[0]) * SC, len(grid) * SC, ', '.join('%s %d' % (names[k], int((z == k).sum())) for k in names)))
    bad = 0
    for n, arr in imgs.items():
        path = os.path.join(a.out, n)
        if a.check:
            same = os.path.exists(path) and np.array_equal(np.array(Image.open(path).convert('RGBA')), arr)
            print('%-10s %s' % (n, 'ok' if same else 'DIFFERS')); bad += 0 if same else 1
        else: Image.fromarray(arr, 'RGBA').save(path)
    mp = os.path.join(a.out, 'manifest.json'); text = json.dumps(manifest, indent=1) + '\n'
    if a.check:
        same = os.path.exists(mp) and open(mp, encoding='utf8').read() == text; print('%-10s %s' % ('manifest', 'ok' if same else 'DIFFERS')); bad += 0 if same else 1; sys.exit(1 if bad else 0)
    open(mp, 'w', encoding='utf8').write(text)

if __name__ == '__main__': main()
