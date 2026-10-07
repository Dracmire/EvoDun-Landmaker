"""Synthetic 256x256 test maps in the style of the Unity bakes (RGBA, 8 bit, 12 zones at 360/13 degrees).
Needs numpy and Pillow. Output: tools/ui/.cache/<set>/{height,zones,edges,...}.png"""
import os, colorsys, shutil
import numpy as np
from PIL import Image

N, K = 256, 12
cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache')
rng = np.random.default_rng(11)

def out(d): p = os.path.join(cache, d); os.makedirs(p, exist_ok=True); return p
def save(d, name, rgb, alpha=255):
    Image.fromarray(np.dstack([rgb, np.full(rgb.shape[:2], alpha, np.uint8)]), 'RGBA').save(os.path.join(out(d), name + '.png'))

def fbm():
    h = np.zeros((N, N))
    for g, a in [(4, 1.0), (8, .5), (16, .25), (32, .12)]:
        r = rng.random((g + 1, g + 1)).astype(np.float32)
        h += a * np.asarray(Image.fromarray(r).resize((N, N), Image.BICUBIC))
    return (h - h.min()) / (h.max() - h.min())

height = np.clip(np.round(1 + fbm() * 999), 1, 1000)             # baked: 1..1000
gray = np.clip(np.round(height / 1000 * 255), 1, 255).astype(np.uint8)  # grey = height / 1000; never 0 (0 is VOID, not terrain)
seeds = np.array([((i + 0.5 + rng.uniform(-.25, .25)) * N / 4, (j + 0.5 + rng.uniform(-.25, .25)) * N / 3) for j in range(3) for i in range(4)])
yy, xx = np.mgrid[0:N, 0:N]
zid = (((xx[..., None] - seeds[:, 0]) ** 2 + (yy[..., None] - seeds[:, 1]) ** 2)).argmin(2) + 1
ring = (xx < 6) | (yy < 6) | (xx >= N - 6) | (yy >= N - 6)

def zone_rgb(z, ring_mask=None):
    rgb = np.zeros((N, N, 3), np.uint8)
    for k in range(1, K + 1):
        r, g, b = colorsys.hsv_to_rgb(k / (K + 1), 1, 1); rgb[z == k] = [round(r * 255), round(g * 255), round(b * 255)]
    if ring_mask is not None: rgb[ring_mask] = 0
    return rgb

def edge_rgb(z, ring_mask=None):
    e = np.zeros((N, N, 3), np.uint8)
    for dy, dx in [(0, 1), (1, 0)]:
        a = z[:N - dy, :N - dx]; b = z[dy:, dx:]; m = a != b
        if ring_mask is not None: m &= ~ring_mask[:N - dy, :N - dx]
        pairs = (np.minimum(a, b) * 7 + np.maximum(a, b) * 3) % 3 == 0
        for y, x in zip(*np.nonzero(m)): e[y, x] = [0, 255, 255] if pairs[y, x] else [255, 0, 0]
    return e

# maps: black ocean ring (zone 6 is central)
save('maps', 'height', np.dstack([gray] * 3)); save('maps', 'zones', zone_rgb(zid, ring)); save('maps', 'edges', edge_rgb(zid, ring))
comb = np.zeros((N, N, 3), np.uint8)                              # H = zone, V = height
for k in range(1, K + 1):
    m = zid == k; r, g, b = colorsys.hsv_to_rgb(k / (K + 1), 1, 1); v = gray[m] / 255.0
    comb[m] = np.stack([np.round(r * 255 * v), np.round(g * 255 * v), np.round(b * 255 * v)], 1).astype(np.uint8)
comb[ring] = 0; save('maps', 'combined', comb)
dirty = zone_rgb(zid, ring).copy(); dirty[100, 100:140] = [128, 128, 128]
r, g, b = colorsys.hsv_to_rgb(0.3, 1, 10 / 255); dirty[120, 100:130] = [round(r * 255), round(g * 255), round(b * 255)]
save('maps', 'zones_dirty', dirty)
Image.fromarray(np.full((128, 128, 4), 255, np.uint8), 'RGBA').save(os.path.join(out('maps'), 'small128.png'))
open(os.path.join(out('maps'), 'notapng.png'), 'wb').write(b'this is not a png')
# maps_noring: zones reach the image edge (zone 1 is a corner zone)
save('maps_noring', 'height', np.dstack([gray] * 3)); save('maps_noring', 'zones', zone_rgb(zid)); save('maps_noring', 'edges', edge_rgb(zid))
# maps_split: a 7x7 island of zone 6 inside zone 7
m = zid == 7; cur = m.copy(); last = cur
while cur.any():
    last = cur; e = cur.copy(); e[1:] &= cur[:-1]; e[:-1] &= cur[1:]; e[:, 1:] &= cur[:, :-1]; e[:, :-1] &= cur[:, 1:]; cur = e
ys, xs = np.nonzero(last); cy, cx = int(ys.mean()), int(xs.mean())
zs = zid.copy(); zs[cy - 3:cy + 4, cx - 3:cx + 4] = 6
save('maps_split', 'zones', zone_rgb(zs)); save('maps_split', 'height', np.dstack([gray] * 3)); save('maps_split', 'edges', edge_rgb(zid))
# graded masks
cyc = 128 + 60 * np.sin(xx / 256 * 2 * np.pi * 1.2)
def g(name, v): a = np.clip(v, 0, 255).astype(np.uint8); save('maps', name, np.dstack([a, a, a]))
g('path', 255 * np.clip(1 - np.abs(yy - cyc) / 4, 0, 1))
v = np.zeros((N, N))
for cx2, cy2, r2 in [(60, 60, 30), (190, 70, 40), (100, 190, 35), (210, 200, 25)]: v = np.maximum(v, 255 * np.clip(1 - np.hypot(xx - cx2, yy - cy2) / r2, 0, 1))
g('vegetation', v)
p = np.zeros((N, N))
for x, y in [(40, 200), (128, 128), (220, 40), (70, 100), (180, 150), (30, 30)]: p[y - 1:y + 2, x - 1:x + 2] = 255
g('poi', p)
import json
json.dump(np.where(ring, 0, zid)[128].tolist(), open(os.path.join(out('maps'), 'zid_row128.json'), 'w'))   # ground truth of zones.png, row 128
json.dump(sorted(int(v) for v in set(zid[0]) | set(zid[-1]) | set(zid[:, 0]) | set(zid[:, -1])), open(os.path.join(out('maps_noring'), 'edge_zones.json'), 'w'))
print('maps written to', cache)
