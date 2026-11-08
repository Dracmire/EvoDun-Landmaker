#!/usr/bin/env python3
"""Aurhea's Fountain (DQ3 old map, 24 x 22 tiles of 16 px) -> PNGs of ROLES + the water for the built-in source `aurhea` of mode 3 (M3b).
Deterministic, numpy + scipy + Pillow only (offline script; nothing here runs in the viewer).

    python3 derive_roles.py [--out DIR] [--check] [--overlay PNG]      (defaults: --out = the folder of this script; --check = write nothing, compare with the files that exist)

Input (found from this script's place): refs/dq3/old/aurheas_fountain.png. ONLY THE MAP CROP is read: columns 8..391, rows 8..359 (384 x 352 px); the rows from 360 down are never read (the crop is asserted to be
surrounded by black, and the 21 colours of the crop are asserted). Nothing of what lies below the map goes into any file derived here.
Output (48 x 44 px = 24 x 22 old tiles at x2: 1 px = 1 viewer tile, H (the hero) = 1 old tile at tilesPerH 2):
  zones.png    role `zone` (hue ids, h = id / 6, maxnode 5): 1 south meadow, 2 west shore, 3 east shore, 4 north shore, 5 peninsula. Water tiles are black (outside every zone). The trail is NOT a zone: its tiles belong to the nearest zone (as in Forest)
  height.png   role `elevation` [R, hypothesis, ONE variant, calibrated in M4 against the photo]: water 20, all land 30 (rock edges included), the peninsula 60 (the order of 0 < 1 < 1.5 H of the plan; the realized heights are 0 / 0.31 / 0.92 H, see README). 0 is VOID in the viewer, so the water is 20, never 0. The heights the viewer ends up with are MEASURED (test_aurhea_roles.js)
  path.png     role `path`  graded: 255 on the dirt trail of the south
  poi.png      role `poi`   graded: 255 at the TIP of the peninsula (its north end tile, 2 x 2 px)
  water.png    the water mask (255 = water; NOT a role: the built-in source sets pack.masks.water from it, `packFromRoles` is not generalized)
  layers.png   review picture, one colour per class, 32 px per old tile (README only; not read by the viewer)
  manifest.json  evodun-pack/0.2: the roles of those images and the key `water`
WHAT IS AURHEA'S (thresholds, colour families, the geometric sector rules, the heights) and WHAT M6 CAN REUSE (reading the crop of the map, the signature per tile, the grid LEARNED from the blocks, the generic connected-piece / MIN_PIECE logic) is in README.md.
"""
import sys, os, json, colorsys, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__)); REFS = os.path.normpath(os.path.join(HERE, '..', '..'))   # .../refs/dq3
OLD = os.path.join(REFS, 'old', 'aurheas_fountain.png')
BOX = (8, 8, 392, 360)       # x0, y0, x1, y1 of the map in the old PNG (verified: black around it); rows >= 360 are never read
T, SC = 16, 2
FAMILY = {                   # the 21 colours of the map in five families [Aurhea's]
    'water': [(33, 57, 123), (24, 41, 82), (16, 24, 57), (49, 99, 148), (74, 132, 231)],
    'brown': [(165, 115, 66), (123, 74, 41), (82, 49, 33), (198, 156, 99), (239, 206, 140)],
    'pink':  [(239, 107, 206)],
    'dark':  [(115, 140, 16), (57, 74, 0), (24, 49, 0), (82, 107, 0), (165, 189, 24)],
    'grass': [(82, 148, 24), (107, 173, 24), (57, 115, 8), (132, 206, 33), (33, 99, 16)]}
WATER_MIN, BROWN_MIN, PINK_MIN, DARK_MIN = 0.40, 0.20, 0.03, 0.30   # [Aurhea's, written thresholds]: share of a tile's pixels
MIN_PIECE = 10               # [R, as in Forest] a zone piece smaller than this many VIEWER tiles (4 per old tile) is fused into the neighbour with the most shared border
GREY = {'water': 20, 'land': 30, 'peninsula': 60}      # [R, hypothesis] the ORDER water < land < peninsula (mound). The intended 0 / 1 / 1.5 H is NOT reachable: with the pre-smoothing and the quantization by terraces the best the viewer gives with a terrace of 5 levels is 0 / 0.31 / 0.92 H (README, measured by test_aurhea_roles.js); M4 calibrates
ZONE_NAME = {1: 'south meadow', 2: 'west shore', 3: 'east shore', 4: 'north shore', 5: 'peninsula'}
EXPECT = {'classes': {'water': 75, 'rock': 11, 'path': 16, 'flower': 29, 'tree': 169, 'grass': 228}, 'zones': {1: 192, 2: 64, 3: 73, 4: 120, 5: 4}}   # frozen (old tiles)


def read_crop():
    full = np.array(Image.open(OLD).convert('RGB').crop((0, 0, 401, 360))).astype(int)    # rows 0..359 only
    x0, y0, x1, y1 = BOX; a = full[y0:y1, x0:x1].copy()
    assert a.shape == (352, 384, 3)
    ring = np.concatenate([full[:y0].ravel(), full[:, :x0].ravel(), full[:, x1:].ravel()])
    assert (ring == 0).all(), 'the map is not surrounded by black'
    pal = {c for v in FAMILY.values() for c in v}; assert len(pal) == 21
    got = set(map(tuple, a.reshape(-1, 3))); assert got == pal, 'the palette of the map is not the 21 known colours: %s' % sorted(got ^ pal)
    return a


def learn_grid(a):
    """THE GRID IS LEARNED: for each of the 16 x 16 offsets, the share of DISTINCT 16 x 16 blocks among the whole tiles (a tile map repeats its tiles; a misaligned grid cuts every sprite and finds almost none twin)."""
    H, W = a.shape[:2]; res = {}
    for oy in range(T):
        for ox in range(T):
            ny, nx = (H - oy) // T, (W - ox) // T; blocks = a[oy:oy + ny * T, ox:ox + nx * T].reshape(ny, T, nx, T, 3).swapaxes(1, 2).reshape(ny * nx, -1)
            res[(ox, oy)] = len({b.tobytes() for b in blocks}) / (ny * nx)
    order = sorted(res.items(), key=lambda kv: (kv[1], kv[0])); med = float(np.median(list(res.values())))
    (best, fb), (second, fs) = order[0], order[1]
    assert fb < 0.5 * med, ('best %.3f is not < 0.5 x median %.3f' % (fb, med))
    assert fs >= 1.5 * fb, ('second best %.3f is not >= 1.5 x best %.3f' % (fs, fb))
    return best, dict(best=best, frac=fb, second=second, frac2=fs, median=med, at_8_14=res[(8, 14)], offsets=res)


def info_alignment(a, grid):
    """INFORMATIVE, not a criterion: do the one-tile sprites (pink flowers, tree trunks) sit inside a tile of the learned grid? (the lake contour, drawn in sub-tile pieces, misleads a grid learned from water alone)"""
    pink = (a == np.array((239, 107, 206))).all(2); lab, n = ndi.label(ndi.binary_dilation(pink, iterations=2), structure=np.ones((3, 3))); ox, oy = grid; inside = 0
    for i in range(1, n + 1):
        yy, xx = np.where(pink & (lab == i)); inside += int((xx.min() - ox) // T == (xx.max() - ox) // T and (yy.min() - oy) // T == (yy.max() - oy) // T)
    return dict(flowers=n, flowers_inside_one_tile=inside)


def classify(a, gx, gy):
    H, W = (a.shape[0] - gy) // T, (a.shape[1] - gx) // T; code = {c: k for k, v in FAMILY.items() for c in v}
    fr = np.zeros((H, W, 5)); keys = list(FAMILY)
    for y in range(H):
        for x in range(W):
            t = a[gy + y * T:gy + (y + 1) * T, gx + x * T:gx + (x + 1) * T].reshape(-1, 3); c = {k: 0 for k in keys}
            for p in map(tuple, t): c[code[p]] += 1
            fr[y, x] = [c[k] / (T * T) for k in keys]
    f = {k: fr[..., i] for i, k in enumerate(keys)}
    cls = np.full((H, W), 'grass', dtype=object)
    cls[f['dark'] >= DARK_MIN] = 'tree'; cls[f['pink'] >= PINK_MIN] = 'flower'; cls[f['brown'] >= BROWN_MIN] = 'brown'; cls[f['water'] >= WATER_MIN] = 'water'
    isw = cls == 'water'; near = ndi.binary_dilation(isw, structure=np.ones((3, 3), bool))
    cls[(cls == 'brown') & near] = 'rock'; cls[cls == 'brown'] = 'path'
    return cls


def sectors(cls):
    """GEOMETRIC rules (nothing painted): land = every tile that is not water (rock edges are land). PENINSULA = land tiles with water to the left AND to the right in the same row (a strip between two waters), the connected strip that reaches
    the south shore; the rest by the box of the lake (rows r0..r1, columns c0..c1, centre column cx = mean of the water columns): NORTH = rows above r0, SOUTH meadow = rows below r1, WEST = the rows r0..r1 left of cx, EAST = the rest."""
    H, W = cls.shape; w = cls == 'water'; ys, xs = np.where(w); r0, r1, cx = ys.min(), ys.max(), xs.mean()
    Z = np.zeros((H, W), np.int32); pen = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if not w[y, x] and w[y, :x].any() and w[y, x + 1:].any(): pen[y, x] = True
    for y in range(H):
        for x in range(W):
            if w[y, x]: continue
            Z[y, x] = 5 if pen[y, x] else 4 if y < r0 else 1 if y > r1 else 2 if x < cx else 3
    return Z, pen, dict(r0=int(r0), r1=int(r1), c0=int(xs.min()), c1=int(xs.max()), cx=float(cx))


def normalize(Z):
    """Zones are connected pieces (4-connectivity); a piece smaller than MIN_PIECE viewer tiles is fused into the neighbour with the most shared border (tie: lower id). Returns Z and the piece sizes (old tiles) per class."""
    four = ndi.generate_binary_structure(2, 1); Z = Z.copy(); sizes = {}
    for c in range(1, 6):
        lab, n = ndi.label(Z == c, structure=four); sizes[c] = sorted([int((lab == i).sum()) for i in range(1, n + 1)], reverse=True)
        for i in range(1, n + 1):
            m = lab == i
            if m.sum() * SC * SC >= MIN_PIECE: continue
            ring = ndi.binary_dilation(m, structure=four) & ~m; ids, cnt = np.unique(Z[ring][Z[ring] > 0], return_counts=True)
            assert len(ids), 'a small piece has no neighbour'
            Z[m] = sorted(zip(ids.tolist(), cnt.tolist()), key=lambda t: (-t[1], t[0]))[0][0]
    for c in range(1, 6):
        _, n = ndi.label(Z == c, structure=four); assert n == 1, 'zone %d (%s) is %d pieces' % (c, ZONE_NAME[c], n)
    return Z, sizes


def build():
    a = read_crop(); (gx, gy), g = learn_grid(a); cls = classify(a, gx, gy); H, W = cls.shape
    assert (gx, gy) == (0, 0) and (H, W) == (22, 24), (gx, gy, H, W)
    Z, pen, box = sectors(cls); Z, sizes = normalize(Z)
    water = cls == 'water'; path = cls == 'path'
    # the trail is not a zone: its tiles already belong to a sector (the nearest zone), and the rule above gave it the sector it lies in
    ys, xs = np.where(pen & (Z == 5)); tip = (int(xs[np.argmin(ys)]), int(ys.min()))      # the north end of the strip: the tip of the peninsula
    up = lambda m: np.kron(np.asarray(m), np.ones((SC, SC), dtype=np.asarray(m).dtype))
    h = np.where(water, GREY['water'], np.where(Z == 5, GREY['peninsula'], GREY['land'])).astype(np.uint8)
    poi = np.zeros((H, W), np.uint8); poi[tip[1], tip[0]] = 255
    return dict(a=a, cls=cls, Z=Z, sizes=sizes, water=water, path=path, pen=pen, tip=tip, box=box, grid=g, align=info_alignment(a, (gx, gy)),
                zones=up(Z), height=up(h), path_img=up(np.where(path, 255, 0).astype(np.uint8)), poi=up(poi), water_img=up(np.where(water, 255, 0).astype(np.uint8)))


def rgba_grey(g): return np.dstack([g, g, g, np.full(g.shape, 255, np.uint8)])


def zones_rgba(z):
    out = np.zeros(z.shape + (4,), np.uint8); out[..., 3] = 255
    for k in range(1, 6):
        r, g, b = colorsys.hsv_to_rgb(k / 6, 1, 1); out[z == k, :3] = [round(r * 255), round(g * 255), round(b * 255)]
    return out


LAYER_COL = {'water': (40, 80, 200), 'rock': (130, 90, 50), 'path': (225, 190, 130), 'flower': (240, 110, 200), 'tree': (20, 90, 20), 'grass': (130, 205, 70)}


def layers(d):
    cls = d['cls']; H, W = cls.shape; im = np.zeros((H * 32, W * 32, 3), np.uint8)
    for y in range(H):
        for x in range(W): im[y * 32:(y + 1) * 32, x * 32:(x + 1) * 32] = LAYER_COL[cls[y, x]]
    tip = d['tip']; im[tip[1] * 32 + 10:tip[1] * 32 + 22, tip[0] * 32 + 10:tip[0] * 32 + 22] = (255, 255, 255)
    return np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])


def files(d):
    return {'zones.png': zones_rgba(d['zones']), 'height.png': rgba_grey(d['height']), 'path.png': rgba_grey(d['path_img']), 'poi.png': rgba_grey(d['poi']), 'water.png': rgba_grey(d['water_img']), 'layers.png': layers(d)}


MANIFEST = {'format': 'evodun-pack/0.2', 'name': "Aurhea's Fountain (old map)", 'flipY': False, 'maxnode': 5,
            'roles': {'elevation': {'image': 'height.png', 'channel': 'V'}, 'zone': {'image': 'zones.png', 'channel': 'H'}, 'path': {'image': 'path.png', 'channel': 'V'}, 'poi': {'image': 'poi.png', 'channel': 'V'}},
            'water': {'image': 'water.png', 'channel': 'V', 'note': 'not a role: the built-in source sets pack.masks.water from it'}, 'markers': []}


def overlay(d, out):
    im = d['a'].astype(float).copy(); tint = {1: (255, 255, 0), 2: (0, 200, 255), 3: (255, 0, 255), 4: (255, 128, 0), 5: (255, 255, 255)}
    H, W = d['Z'].shape
    for y in range(H):
        for x in range(W):
            z = int(d['Z'][y, x]); s = im[y * T:(y + 1) * T, x * T:(x + 1) * T]
            if z: s[:] = s * 0.6 + np.array(tint[z], float) * 0.4
            if d['path'][y, x]: s[6:10, 6:10] = (255, 255, 255)
            s[0, :] = 0; s[:, 0] = 0
    Image.fromarray(im.astype(np.uint8)).resize((W * 32, H * 32), Image.NEAREST).save(out)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=HERE); ap.add_argument('--check', action='store_true'); ap.add_argument('--overlay'); o = ap.parse_args()
    d = build(); F = files(d); man = json.dumps(MANIFEST, indent=1) + '\n'; bad = []
    for name, arr in F.items():
        p = os.path.join(o.out, name)
        if o.check:
            if not os.path.exists(p) or not np.array_equal(np.array(Image.open(p).convert('RGBA')), arr): bad.append(name)
        else: Image.fromarray(arr, 'RGBA').save(p)
    p = os.path.join(o.out, 'manifest.json')
    if o.check:
        if not os.path.exists(p) or open(p).read() != man: bad.append('manifest.json')
    else: open(p, 'w').write(man)
    if o.overlay: overlay(d, o.overlay)
    cls = d['cls']; counts = {k: int((cls == k).sum()) for k in LAYER_COL}; zc = {k: int((d['Z'] == k).sum()) for k in range(1, 6)}
    g = d['grid']; print('GRID learned (offset x, y) =', g['best'], '| distinct-block fraction best %.3f, second %.3f at %s, median %.3f, at (8,14) %.3f' % (g['frac'], g['frac2'], g['second'], g['median'], g['at_8_14']), '| 24 x 22 = 528 whole tiles, no strips')
    print('INFO (not a criterion) sprites of one tile inside a tile of the grid:', d['align'])
    print('classes (old tiles):', counts, '| lake box', d['box'], '| zones (old tiles):', zc, '| pieces per class:', d['sizes'], '| trail tiles', int(d['path'].sum()), '| peninsula tip tile', d['tip'], '| MIN_PIECE', MIN_PIECE)
    if EXPECT is not None: assert {'classes': counts, 'zones': zc} == EXPECT, 'counts differ from the frozen ones'
    if o.check: print('CHECK', 'OK' if not bad else 'DIFFERS: ' + ', '.join(bad)); sys.exit(1 if bad else 0)


if __name__ == '__main__': main()
