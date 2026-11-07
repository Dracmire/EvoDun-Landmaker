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

# ---- STAGE FIXTURE (M2b, tools/ui/test_stage_zones_ui.js, tools/test_stage_zones.js): a 96 x 96 image with a STRIP (y 38-57) of THREE zones in a chain along x, ours (no copyright), deterministic (no random
# numbers) -> tools/ui/.cache/maps_stage/{height,zones,path}.png. zones.png: hue ids 1, 2, 3 (A | B | C along x, wavy borders), black outside the strip. height.png: grey V = height, 0 (VOID) outside the strip,
# 7 plateaus joined by smooth ramps (A 44 -> 90, B 96 -> 128 -> 160, C 168 -> 198 -> 228: with 5 terraces A has 2, B 3 and C 2 terraces; the zone borders are NOT terrace edges). Two features the rules must cope with:
# a POND in zone B (height 0 = VOID, the roles have no water) and an ISLAND in zone C (a 5 x 5 walkable patch inside a ring of void: a piece apart from the main one of its zone, 25 tiles).
# Each zone is about 32 x 20 tiles (length / width 1.6: a Z room for the orientation). path.png: a graded road along y = 48 (not read by the Stage rules).
M = 96
ys_, xs_ = np.mgrid[0:M, 0:M]
strip = (ys_ >= 38) & (ys_ < 58)
wave = 3 * np.sin(ys_ / 4.0)
zs3 = np.where(~strip, 0, np.where(xs_ + wave < 32, 1, np.where(xs_ + wave < 64, 2, 3)))
def sstep(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)
xr = xs_ + wave
hh = 44 + 46 * sstep((xr - 14) / 10)                                    # A: 44 -> 90
hh = np.where(xr >= 32, 96 + 32 * sstep((xr - 40) / 6) + 32 * sstep((xr - 54) / 6), hh)   # B: 96 -> 128 -> 160
hh = np.where(xr >= 64, 168 + 30 * sstep((xr - 70) / 8) + 30 * sstep((xr - 86) / 6), hh)  # C: 168 -> 198 -> 228
hh = hh + 4 * np.sin(ys_ / 5.0 + xs_ / 17.0)                            # a gentle relief (sub-terraces)
hh[~strip] = 0                                                           # outside the strip: void
hh[(((xs_ - 47) / 8.0) ** 2 + ((ys_ - 48) / 5.0) ** 2) <= 1] = 0        # the pond (void)
ring = (xs_ >= 80) & (xs_ <= 88) & (ys_ >= 43) & (ys_ <= 51)
hh[ring & ~((xs_ >= 82) & (xs_ <= 86) & (ys_ >= 45) & (ys_ <= 49))] = 0 # the island: a 5 x 5 patch (x 82-86, y 45-49) inside a ring of void
g3 = np.clip(np.round(hh), 0, 255).astype(np.uint8)
def zone3_rgb(z):
    rgb = np.zeros((M, M, 3), np.uint8)
    for k in (1, 2, 3):
        r, g, b = colorsys.hsv_to_rgb(k / 4, 1, 1); rgb[z == k] = [round(r * 255), round(g * 255), round(b * 255)]
    return rgb
road = np.where(strip, np.clip(255 * (1 - np.abs(ys_ - 48) / 2), 0, 255), 0).astype(np.uint8)
def save3(name, rgb): Image.fromarray(np.dstack([rgb, np.full(rgb.shape[:2], 255, np.uint8)]), 'RGBA').save(os.path.join(out('maps_stage'), name + '.png'))
save3('height', np.dstack([g3] * 3)); save3('zones', zone3_rgb(zs3)); save3('path', np.dstack([road] * 3))
print('maps written to', cache)
