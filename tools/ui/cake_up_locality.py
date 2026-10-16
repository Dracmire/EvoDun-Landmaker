"""Distance (Chebyshev, tiles) from the single lowered tile to every differing pixel (see cake_up_locality_probe.js).   python3 tools/ui/cake_up_locality.py <outDir>"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage
d = sys.argv[1]; res = json.load(open(os.path.join(d, 'probe.json')))
BINS = [(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 6), (7, 10), (11, 10**9)]
for t, r in res.items():
    W, n = r['W'], r['n']; H = n // W; x0, y0 = r['x'], r['y']
    a = np.asarray(Image.open(os.path.join(d, f'loc_{t}_base.png')).convert('RGB')).astype(int); b = np.asarray(Image.open(os.path.join(d, f'loc_{t}_mod.png')).convert('RGB')).astype(int)
    pk = np.asarray(Image.open(os.path.join(d, f'loc_{t}_pick.png')).convert('RGB')).astype(np.int64); tile = (pk[..., 0] << 16 | pk[..., 1] << 8 | pk[..., 2]) - 1
    dpx, (iy, ix) = ndimage.distance_transform_edt(tile < 0, return_indices=True); tile = np.where((tile < 0) & (dpx <= 3), tile[iy, ix], tile)
    diff = np.abs(a - b).max(axis=2) > 0; res_ = diff & (tile >= 0); tx, ty = tile[res_] % W, tile[res_] // W; dist = np.maximum(abs(tx - x0), abs(ty - y0))
    print(f'{t:4s} tile ({x0}, {y0}) lowered from level {r["level"]}: differing pixels {int(diff.sum()):>6d}, unresolved {int((diff & (tile < 0)).sum()):>4d} | ' + '  '.join(f'd{lo}' + (f'-{hi}' if hi != lo and hi < 10**9 else ('+' if hi >= 10**9 else '')) + f' {int(((dist >= lo) & (dist <= hi)).sum())}' for lo, hi in BINS) + f' | farthest {int(dist.max()) if dist.size else 0} tiles')
