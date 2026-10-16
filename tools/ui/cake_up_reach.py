"""How far from a changed tile do the differing pixels of A / B / C lie? (Cake v2 for Up links review; see cake_up_regress.js, run both trees with --pick on the tree whose picture is the second one.)
   For every differing pixel between <outA> and <outB>: its tile = the Box pick buffer of <outB> at that pixel (the nearest valid code within 3 px for the blended edge pixels, as E.pickTile does); distance = Chebyshev distance (tiles) to the nearest CHANGED tile = a tile claimed by a ring in either tree, or whose height differs.
   Prints, per technique, the histogram of the distance (0 = on a changed tile; 'none' = the pixel resolves to no tile: background, a blended edge pixel).
     python3 tools/ui/cake_up_reach.py <outA> <outB> [--cfgs default,balanced]"""
import sys, os, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage
A, B = sys.argv[1], sys.argv[2]
BINS = [(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 6), (7, 10), (11, 10**9)]
def load(d, cfg):
    return json.load(open(os.path.join(d, f'{cfg}_heights.json')))
tot = {}
for f in sorted(glob.glob(os.path.join(B, '*_pick.png'))):
    name = os.path.basename(f)[:-9]; cfg, tech = name.split('_')[0], name.split('_')[1]
    ha, hb = load(A, cfg), load(B, cfg); W, n = hb['W'], hb['n']; H = n // W
    changed = (np.abs(np.array(ha['h']) - np.array(hb['h'])) > 1e-9)
    for c in ha['claimed'] + hb['claimed']: changed[c] = True
    changed = changed.reshape(H, W)
    dist = ndimage.distance_transform_cdt(~changed, metric='chessboard')  # Chebyshev distance in tiles to the nearest changed tile
    a = np.asarray(Image.open(os.path.join(A, name + '.png')).convert('RGB')).astype(int); b = np.asarray(Image.open(os.path.join(B, name + '.png')).convert('RGB')).astype(int)
    pk = np.asarray(Image.open(f).convert('RGB')).astype(np.int64); tile = (pk[..., 0] << 16 | pk[..., 1] << 8 | pk[..., 2]) - 1
    # a pixel on the edge of a tile is a blend of two codes (invalid): like E.pickTile it takes the nearest valid code within 3 px; beyond that it is 'none' (background)
    dpx, (iy, ix) = ndimage.distance_transform_edt(tile < 0, return_indices=True); tile = np.where((tile < 0) & (dpx <= 3), tile[iy, ix], tile)
    diff = np.abs(a - b).max(axis=2) > 0
    res = diff & (tile >= 0); d = dist.ravel()[np.clip(tile, 0, n - 1)[res]]
    row = tot.setdefault(tech, {'none': 0, 'bins': [0] * len(BINS), 'n': 0})
    row['none'] += int((diff & (tile < 0)).sum()); row['n'] += int(diff.sum())
    for i, (lo, hi) in enumerate(BINS): row['bins'][i] += int(((d >= lo) & (d <= hi)).sum())
for tech, r in tot.items():
    print(f'{tech:4s} differing pixels {r["n"]:>8d}  unresolved {r["none"]:>7d} | ' + '  '.join(f'd{lo}' + (f'-{hi}' if hi != lo and hi < 10**9 else ('+' if hi >= 10**9 else '')) + f' {c}' for (lo, hi), c in zip(BINS, r['bins'])))
