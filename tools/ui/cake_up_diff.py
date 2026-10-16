"""Compare the Cake-ON pictures of two trees (see cake_up_regress.js): differing pixels, how many lie inside the mask of the changed columns, how many outside (and the largest delta outside).
     python3 tools/ui/cake_up_diff.py <outOld> <outNew>"""
import sys, os, glob
import numpy as np
from PIL import Image
old, new = sys.argv[1], sys.argv[2]
tot_out = 0
for f in sorted(glob.glob(os.path.join(new, '*.png'))):
    b = os.path.basename(f)
    if b.endswith('_mask.png'): continue
    a_ = np.asarray(Image.open(os.path.join(old, b)).convert('RGB')).astype(int); n_ = np.asarray(Image.open(f).convert('RGB')).astype(int)
    m = np.asarray(Image.open(os.path.join(new, b.replace('.png', '_mask.png'))).convert('L')) > 0
    d = np.abs(a_ - n_).max(axis=2); diff = d > 0; ins = int((diff & m).sum()); out = int((diff & ~m).sum()); mx = int(d[diff & ~m].max()) if out else 0
    changed = open(os.path.join(new, b.replace('.png', '_changed.txt'))).read()
    print(f'{b:34s} changed tiles {changed:>5s}  differing {int(diff.sum()):>7d}  inside {ins:>7d}  outside {out:>5d} (max delta {mx})'); tot_out += out
print('TOTAL outside the changed columns:', tot_out)
