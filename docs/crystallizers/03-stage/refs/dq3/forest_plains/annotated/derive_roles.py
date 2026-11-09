#!/usr/bin/env python3
"""Forest (DQ3 old map "Forest", 26 x 23 tiles of 16 px) -> PNGs of ROLES for the "Your images" source of mode 3 (M3a).
Deterministic: no random numbers except scikit-learn's KMeans(random_state=0), the recipe of the user's v53 zoning (see "ZONES"). Needs numpy, scipy, scikit-learn and Pillow.

    python3 derive_roles.py [--out DIR] [--check]       (defaults: --out = the folder of this script; --check = write nothing, compare with the files that exist)

Inputs (relative to refs/dq3/, found from this script's place):  old/forest.png   remake/r_20261030_141929_shrine_of_the_plains_map.png
Output (52 x 46 = 26 x 23 tiles at x2: each tile of the old game is 2 x 2 px, so 1 px = 1 tile of the viewer and H (the hero) = 1 old tile at tilesPerH 2):
  zones.png        role `zone`      hue ids (h = id / 7, maxnode 6): a zone is a CONNECTED piece (4-connectivity, old tiles): 1 valley, 2 plateau NW, 3 plateau SW, 4 plateau N with the tower, 5 slope / dark band (main piece), 6 slope, east piece.
                   Pieces of fewer than MIN_PIECE tiles are fused into the neighbouring piece that shares the most border (tie: lower id) and take its class
  height_A.png     role `elevation` VARIANT A, the v53 hypothesis [R, by eye on remake screenshots, NOT verified]: valley and paths 0 H, slope 0.3 H, plateaus 0.6 H, tower 3.5 H
  height_B.png     role `elevation` VARIANT B (B', since 2026-11-09), amplified relief: every zone is at least one terrace away from each neighbour (valley < slope < plateaus < SW plateau; the tower is the maximum, 68 grey, 6.88 H with the 4 terraces of the example forest_b)
  path.png         role `path`      graded mask: the class 6 of v53 (the trails), 255 on the trail, 0 elsewhere. The trail tiles belong to the NEAREST zone of 1..5 in `zones.png`
  poi.png          role `poi`       graded: A (two tiles south of the tower door (19, 10): old tile (19, 12), zone 6 = the east slope, inside the footprint of the windows [1, 6], [6] and [1, 6, 4]) 255, B (west exit, (8, 11)) 170. The door (19, 10) is not marked. M3c: the Stage rules read `poi` as the GOAL of the last zone of a window (E.stage.poiGoal)
  trees_blocked.png      role `vegetation` graded: 255 = the TOWER (cols 17-21, rows 2-10) and the TREES (tile coverage of the foliage and trunk colours >= 0.5 in forest.png; no tree is separated: the sprites overlap). DATA FOR LATER (trees as volumes or billboards): the viewer reads the role `vegetation` and does not use it, nothing is blocked by it
  manifest.json    evodun-pack/0.2: the roles of those images ("Your images" / the viewer read it the same way), flipY false, maxnode 6
Heights are grey values (V). 0 is VOID in the viewer, so the valley is 20, never 0. The viewer quantizes them into terraces and sub-terraces: the heights it ends up with (in H) are measured, not assumed: tools/ui + README "M3a".
"""
import sys, os, json, colorsys, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.interpolate import RBFInterpolator
from sklearn.cluster import KMeans

HERE = os.path.dirname(os.path.abspath(__file__)); REFS = os.path.normpath(os.path.join(HERE, '..', '..'))   # .../refs/dq3
OLD = os.path.join(REFS, 'old', 'forest.png'); REMAKE = os.path.join(REFS, 'remake', 'r_20261030_141929_shrine_of_the_plains_map.png')
TW, TH, SC = 26, 23, 2                      # old map in tiles; each tile -> SC x SC px
TOWER = (17, 21, 2, 10)                     # [v53] columns 17-21, rows 2-10 (old tiles): solid, not walkable
POI = {'A': (19, 12, 255), 'B': (8, 11, 170)}
MIN_PIECE = 10                              # [R, a HYPOTHESIS] a connected piece of at least this many old tiles is a zone of its own; smaller ones are fused into a neighbour
# VARIANT A: grey values with 1 H = 20 grey (valley 20 = 0 H): slope +6 (0.3 H), plateaus +12 (0.6 H), tower +70 (3.5 H)
GREY_A = {'valley': 20, 'path': 20, 'slope': 26, 'plateau': 32, 'tower': 90}
# VARIANT B: bands of 12 grey with 4 terraces (20..68): valley band 0, slope band 1, plateaus NW / N band 2, plateau SW band 3; a value on the start of a band (+1) so the sub-terraces stay low. B' (2026-11-09): the tower is the MAXIMUM of the map and the viewer quantizes with the global range, so its cima is always the last sub-terrace of the last terrace: 92 (6 terraces) gave 10.88 H; 68 with 4 terraces gives 6.88 H (any of 66-69 does the same). The example forest_b sets 4 terraces / 3 sub-terraces
GREY_B = {1: 20, 5: 33, 2: 45, 4: 45, 3: 57, 'tower': 68}   # by CLASS (the zone id of a second piece of a class gets the height of its class)


# THE GRID the user verified for v53 (23 rows x 26 columns, old tiles; 1 valley, 2 plateau NW, 3 plateau SW, 4 plateau N, 5 slope, 6 trail); counts 1: 140, 2: 86, 3: 24, 4: 142, 5: 162, 6: 44. If the recipe gives another one, STOP: the zones are not v53's.
V53_GRID = """
22222266544444444444446444
22222256544444444554444644
22222226544444444544444664
22222226644444444544444464
22222226544444445544444444
22222226544444445544444444
22222226544444445544444444
22222266544444555544444444
22222265544555555544445544
22222565545555555444445544
22222565555555555444445554
22222555555555555544555554
22222555556655551155555555
22225555555655511155555555
22555655555655511111555551
25565555555611111111111111
33661111666111111111111155
33561111166111611111115555
53566666111111661111155511
33356611111111111115511111
33335511111111115511111111
33333351111111111111111111
33333355511111551111111111
""".split()


def zones_v53(remake_path):
    """THE v53 RECIPE (reproduced and verified by the user: the grid below is what it must give). The map of the remake, k-means of its colours, regions and trails, warped by a thin-plate spline to the old map (11 control points), a vote per tile.
    Classes: 1 valley, 2 plateau NW, 3 plateau SW, 4 plateau N + tower, 5 dark band / slope, 6 trail."""
    a = np.array(Image.open(remake_path).convert('RGB')).astype(float)
    sub = a[118:628, 75:628]; H, W = sub.shape[:2]
    X = sub.reshape(-1, 3); km = KMeans(7, n_init=4, random_state=0).fit(X[::7]); lab = km.predict(X).reshape(H, W)
    dark = (ndi.median_filter((lab == 4).astype(np.uint8), 9) > 0) | (ndi.median_filter((lab == 3).astype(np.uint8), 9) > 0)
    path = ndi.median_filter(((lab == 5) | (lab == 6)).astype(np.uint8), 7) > 0
    rest = ~(dark | path); rest[:6, :] = False
    op = ndi.binary_opening(rest, iterations=3); cc, n = ndi.label(op)
    keep = [i + 1 for i, s in enumerate(ndi.sum(op, cc, range(1, n + 1))) if s > 2500]
    assert keep == [1, 3, 29, 46], keep   # v53 ids: nw 1, nn 3, valley 29, sw 46
    valley, nw, sw, nn = 29, 1, 46, 3
    pcc, pn = ndi.label(path); psz = ndi.sum(path, pcc, range(1, pn + 1)); pathv = np.isin(pcc, [i + 1 for i, s in enumerate(psz) if s > 1800])
    CL = np.zeros((H, W), np.uint8); CL[cc == valley] = 1; CL[cc == nw] = 2; CL[cc == sw] = 3; CL[cc == nn] = 4; CL[dark] = 5; CL[pathv] = 6
    z = CL == 0; idx = ndi.distance_transform_edt(z, return_distances=False, return_indices=True); CLf = CL.copy(); CLf[z] = CL[tuple(idx)][z]
    old_pts = np.array([[0, 0], [26, 0], [0, 23], [26, 23], [17, 2], [22, 2], [17, 11], [22, 11], [8.5, 11.4], [11.5, 22.5], [19.5, 11.0]], float)
    rem_pts = np.array([[0, 0], [W, 0], [0, H], [W, H], [320, 157], [377, 157], [320, 231], [377, 231], [185, 191], [300, 505], [348, 231]], float)
    tps = RBFInterpolator(old_pts, rem_pts, kernel='thin_plate_spline', smoothing=2.0)
    S = 8; gy, gx = np.mgrid[0:TH * S, 0:TW * S]; uv = tps(np.stack([(gx + .5) / S, (gy + .5) / S], -1).reshape(-1, 2)).reshape(TH * S, TW * S, 2)
    ZO = ndi.median_filter(CLf[np.clip(uv[..., 1], 0, H - 1).astype(int), np.clip(uv[..., 0], 0, W - 1).astype(int)], size=9)
    Zt = np.zeros((TH, TW), np.uint8)
    for ty in range(TH):
        for tx in range(TW): Zt[ty, tx] = np.bincount(ZO[ty * S:(ty + 1) * S, tx * S:(tx + 1) * S].ravel(), minlength=7).argmax()
    assert (Zt == np.array([[int(c) for c in r] for r in V53_GRID])).all(), 'the zone grid differs from the v53 grid'
    return Zt



def normalize(Z):
    """A zone is a connected piece. Returns (zid, cls, sizes): zid = zone ids (class c keeps the id c for its largest piece, the other big pieces get 6, 7... in class order), cls = the class (height) of every tile,
    sizes = the list of the piece sizes per class (for the report). Pieces smaller than MIN_PIECE are fused (largest first) into the neighbouring resolved piece with the most shared border (tie: lower id) and take its class."""
    four = ndi.generate_binary_structure(2, 1); pieces = []   # (class, size, mask)
    for c in range(1, 6):
        lab, n = ndi.label(Z == c, structure=four)
        for i in range(1, n + 1): m = lab == i; pieces.append([c, int(m.sum()), m])
    sizes = {c: sorted([p[1] for p in pieces if p[0] == c], reverse=True) for c in range(1, 6)}
    pieces.sort(key=lambda p: (-p[1], p[0], int(np.argmax(p[2].ravel()))))
    zid = np.zeros(Z.shape, np.int32); cls = Z.astype(np.int32).copy(); nxt = 6; used = set()
    for p in pieces:
        if p[1] < MIN_PIECE: continue
        if p[0] not in used: zid[p[2]] = p[0]; used.add(p[0])
        else: zid[p[2]] = nxt; nxt += 1
    small = [p for p in pieces if p[1] < MIN_PIECE]
    while small:
        rest = []
        for p in small:
            ring = ndi.binary_dilation(p[2], structure=four) & ~p[2]; ids, cnt = np.unique(zid[ring][zid[ring] > 0], return_counts=True)
            if not len(ids): rest.append(p); continue
            best = sorted(zip(ids.tolist(), cnt.tolist()), key=lambda t: (-t[1], t[0]))[0][0]
            zid[p[2]] = best; cls[p[2]] = cls[zid == best][0]
        if len(rest) == len(small): raise SystemExit('a small piece has no neighbour')
        small = rest
    return zid, cls, sizes

def trees_mask(old_path):
    """Tiles (16 px) of forest.png whose pixels are foliage (olive greens) or trunk (dark browns) for at least half of the tile. Not a count of trees: the sprites (2 tiles wide, 2-3 tall) overlap, so the trunks of about a third are hidden."""
    a = np.array(Image.open(old_path).convert('RGB').crop((0, 0, TW * 16, TH * 16))).astype(int)
    cols = [(57, 74, 0), (24, 49, 0), (82, 107, 0), (115, 140, 16), (165, 189, 24), (82, 49, 33), (41, 24, 8), (57, 41, 16), (74, 57, 24)]
    m = np.zeros(a.shape[:2], bool)
    for c in cols: m |= (a == np.array(c)).all(2)
    cov = m.reshape(TH, 16, TW, 16).mean(axis=(1, 3))
    return cov >= 0.5, cov


def trunks(old_path):
    """The trunks that are VISIBLE (blobs of the root colour with the size of a whole sprite base): a lower bound of the number of trees, for the report only."""
    a = np.array(Image.open(old_path).convert('RGB').crop((0, 0, TW * 16, TH * 16))).astype(int)
    m = np.zeros(a.shape[:2], bool)
    for c in [(82, 49, 33), (41, 24, 8), (57, 41, 16), (74, 57, 24)]: m |= (a == np.array(c)).all(2)
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=2)); out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        w = s[1].stop - s[1].start; h = s[0].stop - s[0].start; cnt = int(m[s][lab[s] == i + 1].sum())
        if h == 13 and w in (17, 23) and cnt >= 39: out.append(((s[1].start + s[1].stop) / 2 / 16, s[0].stop / 16))
    return out


def build():
    Zt = zones_v53(REMAKE)
    tr = Zt == 6
    idx = ndi.distance_transform_edt(tr, return_distances=False, return_indices=True)
    Z = Zt.copy(); Z[tr] = Zt[tuple(idx)][tr]                      # the trail tiles take the nearest zone of 1..5
    c0, c1, r0, r1 = TOWER; tower = np.zeros((TH, TW), bool); tower[r0:r1 + 1, c0:c1 + 1] = True
    forced = int((Z[tower] != 4).sum()); Z[tower] = 4              # the tower is part of the plateau N (zone 4)
    zid, cls, sizes = normalize(Z)                                   # a zone is a connected piece; the heights follow the CLASS
    trees, cov = trees_mask(OLD)
    for k, (x, y, _) in POI.items(): trees[y, x] = False           # the exits and the door stay free
    trees &= ~tower
    blocked = trees | tower
    # heights
    hA = np.zeros((TH, TW), np.uint8)
    hA[cls == 1] = GREY_A['valley']; hA[cls == 5] = GREY_A['slope']
    for k in (2, 3, 4): hA[cls == k] = GREY_A['plateau']
    hA[tr] = GREY_A['path']; hA[tower] = GREY_A['tower']
    hB = np.zeros((TH, TW), np.uint8)
    for k in (1, 2, 3, 4, 5): hB[cls == k] = GREY_B[k]
    hB[tower] = GREY_B['tower']
    path = np.where(tr, 255, 0).astype(np.uint8)
    poi = np.zeros((TH, TW), np.uint8)
    for k, (x, y, v) in POI.items(): poi[y, x] = v
    up = lambda m: np.kron(np.asarray(m), np.ones((SC, SC), dtype=np.asarray(m).dtype))
    return dict(Zt=Zt, Z=zid, Zc=Z, cls=cls, sizes=sizes, tr=tr, tower=tower, trees=trees, cov=cov, blocked=blocked, forced=forced,
                zones=up(zid), height_A=up(hA), height_B=up(hB), path=up(path), poi=up(poi), blocked_img=up(np.where(blocked, 255, 0).astype(np.uint8)))


def rgba_grey(g): return np.dstack([g, g, g, np.full(g.shape, 255, np.uint8)])


def zones_rgba(z):
    out = np.zeros(z.shape + (4,), np.uint8); out[..., 3] = 255
    for k in range(1, int(z.max()) + 1):
        r, g, b = colorsys.hsv_to_rgb(k / 7, 1, 1); out[z == k, :3] = [round(r * 255), round(g * 255), round(b * 255)]
    return out


def files(d):
    return {'zones.png': zones_rgba(d['zones']), 'height_A.png': rgba_grey(d['height_A']), 'height_B.png': rgba_grey(d['height_B']), 'path.png': rgba_grey(d['path']), 'poi.png': rgba_grey(d['poi']), 'trees_blocked.png': rgba_grey(d['blocked_img'])}


MANIFEST = {'format': 'evodun-pack/0.2', 'name': 'Forest (old map, v53 zones)', 'flipY': False, 'maxnode': 6,
            'roles': {'elevation': {'image': 'height_A.png', 'channel': 'V'}, 'zone': {'image': 'zones.png', 'channel': 'H'}, 'path': {'image': 'path.png', 'channel': 'V'}, 'poi': {'image': 'poi.png', 'channel': 'V'}, 'vegetation': {'image': 'trees_blocked.png', 'channel': 'V'}},
            'variants': {'A': {'elevation': {'image': 'height_A.png', 'channel': 'V'}}, 'B': {'elevation': {'image': 'height_B.png', 'channel': 'V'}}}, 'markers': []}


def overlay(d, path_out):
    im = np.array(Image.open(OLD).convert('RGB').crop((0, 0, TW * 16, TH * 16))).astype(float); tint = {1: (255, 255, 0), 2: (0, 200, 255), 3: (255, 0, 255), 4: (255, 128, 0), 5: (0, 0, 0), 6: (120, 60, 200), 7: (0, 160, 0)}
    for ty in range(TH):
        for tx in range(TW):
            y, x = ty * 16, tx * 16; im[y:y + 16, x:x + 16] = im[y:y + 16, x:x + 16] * 0.6 + np.array(tint[int(d['Z'][ty, tx])], float) * 0.4
            if d['blocked'][ty, tx]: im[y + 4:y + 12, x + 4:x + 12] = (255, 0, 0)
            if d['tr'][ty, tx]: im[y + 6:y + 10, x + 6:x + 10] = (255, 255, 255)
    Image.fromarray(im.astype(np.uint8)).resize((TW * 32, TH * 32), Image.NEAREST).save(path_out)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=HERE); ap.add_argument('--check', action='store_true'); ap.add_argument('--overlay', help='write a review picture (forest.png x2 with the zones tinted, the blocked tiles red, the trail tiles white) to this PNG'); a = ap.parse_args()
    d = build(); F = files(d); man = json.dumps(MANIFEST, indent=1) + '\n'; bad = []
    for name, arr in F.items():
        p = os.path.join(a.out, name)
        if a.check:
            if not os.path.exists(p) or not np.array_equal(np.array(Image.open(p).convert('RGBA')), arr): bad.append(name)
        else: Image.fromarray(arr, 'RGBA').save(p)
    p = os.path.join(a.out, 'manifest.json')
    if a.check:
        if not os.path.exists(p) or open(p).read() != man: bad.append('manifest.json')
    else: open(p, 'w').write(man)
    if a.overlay: overlay(d, a.overlay)
    cnt = {k: int((d['Z'] == k).sum()) for k in range(1, int(d['Z'].max()) + 1)}
    print('pieces per class (sizes):', d['sizes'], '| MIN_PIECE', MIN_PIECE, '| zones (tiles of the old map):', cnt, '| trail tiles', int(d['tr'].sum()), '| tower tiles', int(d['tower'].sum()), 'of which not zone 4 before:', d['forced'], '| tree tiles', int(d['trees'].sum()), '| visible trunks', len(trunks(OLD)))
    if a.check: print('CHECK', 'OK' if not bad else 'DIFFERS: ' + ', '.join(bad)); sys.exit(1 if bad else 0)


if __name__ == '__main__': main()
