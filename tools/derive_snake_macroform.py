"""Derive data/snake_mountain_macroform.json (40x40): the MACROFORM package of crystallizer 6 (docs/crystallizers/06-macroform/README.md).
DERIVED data (not the user's spreadsheets): Snake Mountain as ONE 3D field. Each column (x, y) holds SEVERAL solid intervals (z0, z1, material) instead of one height.
Every constant marked PROVISIONAL is my choice, not the user's.

Inputs: data/snake_mountain_surface.json (elevation, the outer surface) and data/snake_mountain.json (masks.snake, 252 tiles).
Algorithm:
  1. solid  = voxel centre below surface x V (V tiles per elevation unit); the outside ground is the 10th percentile of the surface;
  2. hollow = solid AND 3D euclidean distance to the outside air > T_SHELL AND above the ground (air around the map edge, solid below z = 0);
  3. shaft  = r <= SHAFT_R around the axis, open as a crater from the top of the hollow to the surface (an ADDITION, not a replacement of the serpent);
  4. serpent centreline = skeleton of the snake mask walked from the head end (the inner / high end), gaussian-smoothed (sigma 2), resampled every 0.25 tile;
     ramp surface = min hollow ceiling across the ramp width - HEAD, gaussian-smoothed (sigma 6), made monotone (never climbs away from the head);
  5. floors = horizontal slices of the hollow every HEAD + SLAB from the lowest level, aligned so that the last ramp end sits on floor 1 (ALIGN); each slice needs HEAD clear above;
     floors 2+ lose the shaft tiles and get an OPENING where the ramp passes below; the ramp tiles carve the tube (rock up to HEAD above the ramp removed) and get a ramp slab under them;
  6. materials: air 0, rock 1, serpent 2 (rock inside the snake mask within 1.46 elevation units x V of the surface), slab 3, ramp 4, ground 5 (floor 1).
Skeleton: the 2D thinning of the snake mask is FROZEN below (SKELETON_RC, 67 tiles = skimage.morphology.skeletonize(mask), method 'zhang', skimage 0.26, BSD-3-Clause), so the script needs numpy + scipy only;
if skimage happens to be installed it is only used to CHECK that the frozen list is still what it returns (a note is printed, nothing else changes). A plain Zhang-Suen thinning differs in 2 tiles (it drops the
head-end tile (15, 20) and keeps (27, 17)) and would change the walked path, so it is not used.
Usage: python3 tools/derive_snake_macroform.py [--check] [--sweep]
  (no argument: write data/snake_mountain_macroform.json and print the numbers; --check: only compare the would-be file with the committed one; --sweep: the sensitivity table, nothing written)
Needs numpy and scipy; reproduces the committed JSON bit for bit (same numpy / scipy / platform; the only floating point decisions are the EDT threshold and the smoothing, both deterministic)."""
import json, os, sys
import numpy as np
from collections import deque
from scipy import ndimage as ndi
from scipy.ndimage import gaussian_filter1d

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W = 40
AXIS = (20.5, 20.5)
DEFAULTS = dict(V=2.0, T_SHELL=1.5, HEAD=2.5, SLAB=0.5, DZ=0.25, RAMP_W=1.0, SHAFT_R=2.5, STEP=0.75, ALIGN=1, SERPENT_BAND=1.46,   # ALL PROVISIONAL (docs/crystallizers/06-macroform/README.md section 4)
                MAX_SLOPE_TARGET=0.6, MAX_SLOPE_CAP=0.65)
MATERIALS = ['air', 'rock', 'serpent', 'slab', 'ramp', 'ground']
START = (15, 20)           # (row, col) of the head end of the skeleton (the walk starts here)
# skimage.morphology.skeletonize(snake mask), 40x40, as (row, col) in row-major order (frozen, see the module docstring)
SKELETON_RC = [(10, 17), (10, 18), (10, 19), (10, 20), (10, 21), (10, 22), (10, 23), (10, 24), (11, 15), (11, 16), (11, 25), (11, 26),
               (12, 14), (12, 27), (13, 13), (13, 28), (14, 12), (14, 28), (15, 12), (15, 20), (15, 21), (15, 22), (15, 23), (15, 29),
               (16, 11), (16, 24), (16, 30), (17, 11), (17, 24), (17, 30), (18, 11), (18, 25), (18, 30), (19, 11), (19, 25), (19, 30),
               (20, 11), (20, 25), (20, 30), (21, 11), (21, 25), (21, 30), (22, 12), (22, 25), (22, 30), (23, 12), (23, 25), (23, 30),
               (24, 13), (24, 24), (24, 25), (24, 26), (24, 30), (25, 14), (25, 23), (25, 27), (25, 30), (26, 15), (26, 16), (26, 17),
               (26, 21), (26, 22), (26, 28), (26, 29), (27, 18), (27, 19), (27, 20)]


def load_inputs():
    es = np.array(json.load(open(os.path.join(ROOT, 'data/snake_mountain_surface.json')))['elevation'], float).reshape(W, W)
    sn = np.array(json.load(open(os.path.join(ROOT, 'data/snake_mountain.json')))['masks']['snake'], bool).reshape(W, W)
    return es, sn


def derive(P=None, es=None, sn=None, skeleton=None):
    """The whole derivation. Returns a dict with the voxel field and every number the tests need (nothing is written)."""
    p = dict(DEFAULTS); p.update(P or {})
    V, T_SHELL, HEAD, SLAB, DZ, RAMP_W, SHAFT_R, STEP = p['V'], p['T_SHELL'], p['HEAD'], p['SLAB'], p['DZ'], p['RAMP_W'], p['SHAFT_R'], p['STEP']
    SPACING = HEAD + SLAB
    if es is None or sn is None: es, sn = load_inputs()
    Hs = es * V                                       # surface height in tiles
    NZ = int(np.ceil(Hs.max() / DZ)) + 6
    zc = (np.arange(NZ) + 0.5) * DZ                   # voxel centre heights
    solid = zc[:, None, None] < Hs[None]              # [z, y, x]
    ground = float(np.percentile(Hs, 10))
    pad = 8                                           # below z = 0 is ground (solid): pad with solid underneath, air around the map edge
    sp = np.concatenate([np.ones((pad, W, W), bool), solid], 0)
    sp = np.pad(sp, ((0, 0), (1, 1), (1, 1)), constant_values=False)
    D = ndi.distance_transform_edt(sp, sampling=(DZ, 1, 1))[pad:, 1:-1, 1:-1]
    hollow = solid & (D > T_SHELL) & (zc[:, None, None] > ground)
    yy, xx = np.mgrid[0:W, 0:W] + 0.5
    rr = np.hypot(xx - AXIS[0], yy - AXIS[1]); shaft = rr <= SHAFT_R

    def zi(z): return int(np.clip(np.floor(z / DZ), 0, NZ - 1))

    def clear(cy, cx, z0, z1):                        # the hollow covers [z0, z1] in that column
        return bool(hollow[zi(z0 + 1e-6):zi(z1 - 1e-6) + 1, cy, cx].all())

    # serpent centreline from the head end outward
    pts = set(skeleton if skeleton is not None else SKELETON_RC)
    assert all(sn[r, c] for r, c in pts), 'the frozen skeleton has tiles outside the snake mask: the mask changed, regenerate SKELETON_RC'
    cur = START; order = [cur]; seen = {cur}
    while True:
        nx = [(cur[0] + dy, cur[1] + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (cur[0] + dy, cur[1] + dx) in pts and (cur[0] + dy, cur[1] + dx) not in seen]
        if not nx: break
        nx.sort(key=lambda q: abs(q[0] - cur[0]) + abs(q[1] - cur[1])); cur = nx[0]; order.append(cur); seen.add(cur)
    Pp = np.array([(x + 0.5, y + 0.5) for y, x in order])
    Ps = np.stack([gaussian_filter1d(Pp[:, 0], 2, mode='nearest'), gaussian_filter1d(Pp[:, 1], 2, mode='nearest')], 1)
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(Ps, axis=0).T))]; L = float(seg[-1])
    t = np.arange(0, L, 0.25); X = np.interp(t, seg, Ps[:, 0]); Y = np.interp(t, seg, Ps[:, 1])

    def colceil(x, y):
        h = hollow[:, y, x]
        return zc[np.where(h)[0][-1]] + DZ / 2 if h.any() else np.nan
    ceil = []
    for x, y in zip(X, Y):
        cs = [colceil(cx, cy) for cy in range(max(0, int(y - RAMP_W)), min(W, int(y + RAMP_W) + 1)) for cx in range(max(0, int(x - RAMP_W)), min(W, int(x + RAMP_W) + 1))
              if np.hypot(cx + 0.5 - x, cy + 0.5 - y) <= RAMP_W]
        ceil.append(np.nanmin(cs) if cs and not np.all(np.isnan(cs)) else np.nan)
    ceil = np.array(ceil)
    rz = gaussian_filter1d(np.nan_to_num(ceil, nan=np.nanmin(ceil)) - HEAD, 6, mode='nearest')
    rz = np.minimum.accumulate(rz)                    # never climbs going away from the head
    slope = np.abs(np.diff(rz)) / 0.25

    # floors: slices every SPACING from the lowest hollow level
    z1 = float(zc[np.argmax(hollow.any(axis=(1, 2)))] - DZ / 2)
    if p['ALIGN']: z1 = float(rz[-1] - SPACING * np.floor((rz[-1] - z1) / SPACING))
    levels = []; z = z1
    while True:
        m = np.zeros((W, W), bool)
        for y in range(W):
            for x in range(W): m[y, x] = clear(y, x, z, z + HEAD)
        if m.sum() < 12: break
        levels.append((float(z), m)); z += SPACING
    floors_before = [int(m.sum()) for _, m in levels]

    # ramp tiles (width), surface = rz at the nearest path sample
    ramp_z = np.full((W, W), np.nan); ramp_t = np.full((W, W), np.nan)
    for y in range(W):
        for x in range(W):
            d = np.hypot(X - (x + 0.5), Y - (y + 0.5)); i = int(np.argmin(d))
            if d[i] <= RAMP_W: ramp_z[y, x] = rz[i]; ramp_t[y, x] = t[i]
    rt = ~np.isnan(ramp_z)
    inside = [clear(y, x, ramp_z[y, x], ramp_z[y, x] + HEAD) for y, x in zip(*np.where(rt))]
    cover = [Hs[y, x] - (ramp_z[y, x] + HEAD) for y, x in zip(*np.where(rt))]
    junctions = []
    for k, (lv, m) in enumerate(levels, 1):
        idx = np.where((rz[:-1] - lv - 1e-6) * (rz[1:] - lv - 1e-6) <= 0)[0]
        if not len(idx): junctions.append(None); continue
        i = idx[0]; x, y = int(X[i]), int(Y[i])
        junctions.append(dict(t=round(float(t[i]), 1), x=x, y=y, adjacent=bool(m[max(0, y - 1):y + 2, max(0, x - 1):x + 2].any())))

    # materials
    mat = np.where(solid & ~hollow, 1, 0).astype(np.uint8)
    if levels: mat[(zc < levels[0][0])[:, None, None] & hollow] = 1
    mat[(mat == 1) & sn[None] & (zc[:, None, None] > (Hs - p['SERPENT_BAND'] * V)[None])] = 2
    for k, (lv, m) in enumerate(levels, 1):
        m2 = m & ~shaft if k > 1 else m.copy()
        if k > 1: m2 &= ~(rt & (ramp_z + HEAD > lv - SLAB) & (ramp_z < lv - 0.01))   # the ramp passes through the upper slab: the opening
        a, b = zi(lv - SLAB), zi(lv - 1e-6)
        for y, x in zip(*np.where(m2)): mat[a:b + 1, y, x] = 3 if k > 1 else 5
        levels[k - 1] = (lv, m2)
    carved = 0
    for y, x in zip(*np.where(rt)):
        a, b = zi(ramp_z[y, x] + 1e-6), zi(ramp_z[y, x] + HEAD - 1e-6)
        carved += int((mat[a:b + 1, y, x] != 0).sum()); mat[a:b + 1, y, x] = 0
    for y, x in zip(*np.where(rt)):
        a, b = zi(ramp_z[y, x] - SLAB), zi(ramp_z[y, x] - 1e-6)
        mat[a:b + 1, y, x] = np.where(mat[a:b + 1, y, x] == 0, 4, mat[a:b + 1, y, x])
    top = np.where(hollow.any(0), (hollow.shape[0] - 1 - np.argmax(hollow[::-1], 0)), 0)   # the crater: the shaft is open from the top of the hollow to the surface
    for y, x in zip(*np.where(shaft)): mat[top[y, x]:, y, x] = 0

    # walk graph: floor tiles (after the openings) + ramp tiles; 4-neighbour steps with a height change <= STEP
    nodes = {}
    for k, (lv, m) in enumerate(levels, 1):
        for y, x in zip(*np.where(m)):
            if not rt[y, x] or abs(ramp_z[y, x] - lv) <= STEP: nodes[(k, y, x)] = lv
    for y, x in zip(*np.where(rt)): nodes[('r', y, x)] = float(ramp_z[y, x])
    pos = {}
    for n, zz in nodes.items(): pos.setdefault((n[1], n[2]), []).append((n, zz))

    def reach(start):
        got = {start}; q = deque([start])
        while q:
            n = q.popleft(); y, x = n[1], n[2]; zn = nodes[n]
            for dy, dx in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                for m2, z2 in pos.get((y + dy, x + dx), []):
                    if m2 not in got and abs(z2 - zn) <= STEP: got.add(m2); q.append(m2)
        return got
    iy, ix = int(Y[0]), int(X[0]); R = reach(('r', iy, ix))
    ring = (rr > SHAFT_R) & (rr <= SHAFT_R + 1.5)
    walk = []
    for k, (lv, m) in enumerate(levels, 1):
        fk = [n for n in nodes if n[0] == k]; got = [n for n in fk if n in R]
        walk.append(dict(floor=k, nodes=len(fk), reached=len(got), ring=any(bool(ring[n[1], n[2]]) for n in got), unreached=sorted((int(n[2]), int(n[1])) for n in fk if n not in R)))
    ramp_reached = sum(1 for n in R if n[0] == 'r')
    # shell thickness AFTER the carve: the 3D distance to the outside air of every interior air voxel that was solid (the shaft columns open to the sky are not shell)
    interior = (mat == 0) & solid & ~shaft[None]
    shell_after = float(D[interior].min()) if interior.any() else float('nan')
    return dict(p=p, V=V, DZ=DZ, NZ=NZ, mat=mat, levels=[lv for lv, _ in levels], floor_masks=[m for _, m in levels], floors_before=floors_before, X=X, Y=Y, t=t, rz=rz, L=L,
                ceil=ceil, slope_max=float(slope.max()), slope_mean=float((rz[0] - rz[-1]) / L), ramp_z=ramp_z, ramp_t=ramp_t, rt=rt, ramp_tiles=int(rt.sum()), ramp_inside=int(sum(inside)),
                cover_min=float(min(cover)), cover_median=float(np.median(cover)), junctions=junctions, carved=carved, hollow_voxels=int(hollow.sum()), ground=ground, surface_top=float(Hs.max()),
                counts={n: int((mat == i).sum()) for i, n in enumerate(MATERIALS)}, walk=walk, ramp_reached=ramp_reached, nodes=len(nodes), shell_after=shell_after,
                head=(ix, iy), hollow=hollow, shaft=shaft, Hs=Hs, snake=sn, D=D)


def columns(R):
    """Per column (row-major), the SOLID intervals [z0, z1, mat] bottom up in ELEVATION units (z_tiles / V), same-material neighbours merged. Voxel boundaries are multiples of DZ / V (exact in binary for V = 2)."""
    mat, DZ, V = R['mat'], R['DZ'], R['V']; out = []
    for y in range(W):
        for x in range(W):
            col = mat[:, y, x]; iv = []; z = 0
            while z < len(col):
                if col[z] == 0: z += 1; continue
                m = int(col[z]); z0 = z
                while z < len(col) and col[z] == m: z += 1
                iv.append([z0 * DZ / V, z * DZ / V, m])
            out.append(iv)
    return out


def build_pack(R):
    surf = json.load(open(os.path.join(ROOT, 'data/snake_mountain_surface.json')))
    snake_pack = json.load(open(os.path.join(ROOT, 'data/snake_mountain.json')))
    V = R['V']; hx, hy = R['head']
    markers = [m for m in surf['markers'] if m['code'] != 'H'] + [{'x': hx, 'y': hy, 'code': 'H', 'label': 'Snake head (high end of the serpent; marker only, no geometry)'}, {'x': 21, 'y': 21, 'code': 'S', 'label': 'Shaft top (crater)'}]
    floors = [{'id': k + 1, 'z': round(lv / V, 6), 'zTiles': round(lv, 6), 'tiles': [[int(x), int(y)] for y, x in zip(*np.where(m))]} for k, (lv, m) in enumerate(zip(R['levels'], R['floor_masks']))]
    rp = R['rt']
    path = [[round(float(R['X'][i]), 4), round(float(R['Y'][i]), 4), round(float(R['rz'][i] / V), 6), round(float(R['t'][i]), 2)] for i in range(len(R['t']))]
    tiles = [[int(x), int(y), round(float(R['ramp_z'][y, x] / V), 6), round(float(R['ramp_t'][y, x]), 2)] for y, x in zip(*np.where(rp))]
    p = R['p']
    return {
        'format': 'evodun-pack/0.3',
        'name': 'Snake Mountain macroform (volume: shell, serpent, shaft, floors, derived)',
        'source': 'data/snake_mountain_surface.json + data/snake_mountain.json (masks.snake) via tools/derive_snake_macroform.py (numpy + scipy, reproduces this file bit for bit). DERIVED data, not the user\'s spreadsheets. PROVISIONAL parameters: docs/crystallizers/06-macroform/README.md.',
        'note': 'Crystallizer 6, Macroform. `elevation` is the OUTER SURFACE (identical to snake_mountain_surface). `volume` holds, per column, the SOLID intervals [z0, z1, material] in ELEVATION units (z_tiles / vScale), bottom up; '
                'materials index `volume.materials` (air is never stored). The mountain is a shell with a hollow inside; the serpent is a traversable spiral ramp that crosses every floor; the central shaft is an addition (crater). '
                'Row-major, index = y*width + x, x grows east, y grows south. Nothing is exported to Unity.',
        'width': W, 'height': W,
        'elevation': surf['elevation'],
        'masks': {'snake': snake_pack['masks']['snake']},
        'markers': markers,
        'volume': {'vScale': V, 'dz': R['DZ'] / V, 'nz': R['NZ'], 'materials': MATERIALS, 'columns': columns(R)},
        'macro': {'params': {'V': V, 'DZ': R['DZ'], 'T_SHELL': p['T_SHELL'], 'HEAD': p['HEAD'], 'SLAB': p['SLAB'], 'RAMP_W': p['RAMP_W'], 'SHAFT_R': p['SHAFT_R'], 'STEP': p['STEP'], 'ground': round(R['ground'], 6),
                             'provisional': True},
                  'floors': floors,
                  'ramp': {'width': p['RAMP_W'], 'path': path, 'tiles': tiles},
                  'shaft': {'c': list(AXIS), 'r': p['SHAFT_R']},
                  'head': {'x': hx, 'y': hy}},
        'viewer': {'terraces': 5, 'minPlateau': 5},
    }


def report(R):
    print(f"serpent path {R['L']:.1f} tiles; hollow ceiling along it: start {R['ceil'][0]:.2f}, min {np.nanmin(R['ceil']):.2f}, max {np.nanmax(R['ceil']):.2f}, end {R['ceil'][-1]:.2f}; columns with no hollow: {int(np.isnan(R['ceil']).sum())}")
    print(f"ramp surface: {R['rz'][0]:.2f} -> {R['rz'][-1]:.2f} (drop {R['rz'][0] - R['rz'][-1]:.2f} over {R['L']:.1f} tiles, mean slope {R['slope_mean']:.3f}, max slope {R['slope_max']:.3f}; limit {R['p']['MAX_SLOPE_TARGET']})")
    print(f"V {R['V']} T_SHELL {R['p']['T_SHELL']} HEAD {R['p']['HEAD']} SLAB {R['p']['SLAB']} | outside ground {R['ground']:.2f} | surface top {R['surface_top']:.2f} | hollow voxels {R['hollow_voxels']}")
    print('floor levels (tiles):', R['levels'], ' tiles per floor:', R['floors_before'])
    print(f"ramp tiles {R['ramp_tiles']}; with {R['p']['HEAD']} clear above inside the hollow: {R['ramp_inside']} ({100 * R['ramp_inside'] / R['ramp_tiles']:.0f} %)")
    print(f"rock above the ramp headroom: min {R['cover_min']:.2f}, median {R['cover_median']:.2f} tiles")
    for k, j in enumerate(R['junctions'], 1):
        print(f"  floor {k} at {R['levels'][k - 1]}: " + ('ramp never reaches this level' if j is None else f"ramp crosses at t={j['t']} tile ({j['x']},{j['y']}), floor tiles adjacent: {j['adjacent']}"))
    print(f"tube carve: {R['carved']} voxels of rock removed above the ramp")
    print('materials (voxels):', R['counts'])
    print(f"\nwalk graph: {R['nodes']} nodes; from the head end of the serpent ({R['head'][0]},{R['head'][1]}) one reaches:")
    for w in R['walk']: print(f"  floor {w['floor']}: {w['reached']} of {w['nodes']} tiles ({100 * w['reached'] / max(1, w['nodes']):.0f} %), reaches the shaft ring: {w['ring']}")
    print(f"  ramp tiles reached: {R['ramp_reached']} of {R['ramp_tiles']}")
    print(f"minimum 3D shell thickness after the carve (distance of an interior air voxel to the outside air): {R['shell_after']:.2f} tiles")


def sweep():
    es, sn = load_inputs(); rows = []
    print('V    T_SHELL HEAD | floors | max slope | ramp m/ max | walk reach per floor (reached/nodes) | ring | ramp | shell after carve')
    for V in (1.5, 2.0, 2.5):
        for T in (1.0, 1.5, 2.0):
            for H in (2.0, 2.5, 3.0):
                try:
                    R = derive(dict(V=V, T_SHELL=T, HEAD=H), es, sn)
                except Exception as e:
                    print(f'{V:<4} {T:<7} {H:<4} | failed: {e}'); continue
                wr = ' '.join(f"{w['reached']}/{w['nodes']}" for w in R['walk'])
                ring = ''.join('Y' if w['ring'] else 'n' for w in R['walk'])
                print(f"{V:<4} {T:<7} {H:<4} | {len(R['levels'])}      | {R['slope_max']:.3f}     | {R['slope_mean']:.3f}       | {wr:<40} | {ring:<4} | {R['ramp_reached']}/{R['ramp_tiles']} | {R['shell_after']:.2f}")


def check_skeleton():
    try:
        from skimage.morphology import skeletonize
    except Exception:
        return 'skimage not installed: the frozen skeleton was not cross-checked'
    es, sn = load_inputs()
    ref = sorted(map(tuple, np.argwhere(skeletonize(sn)).tolist()))
    return 'skimage ' + ('confirms' if ref == sorted(SKELETON_RC) else 'DIFFERS FROM') + ' the frozen skeleton'


if __name__ == '__main__':
    if '--sweep' in sys.argv: sweep(); sys.exit(0)
    R = derive(); report(R)
    text = json.dumps(build_pack(R), separators=(',', ':'))
    path = os.path.join(ROOT, 'data/snake_mountain_macroform.json')
    if '--check' in sys.argv:
        same = os.path.exists(path) and open(path).read() == text
        print('reproduces the committed file bit for bit:', same); sys.exit(0 if same else 1)
    with open(path, 'w') as f: f.write(text)
    print('wrote', path, len(text), 'bytes;', check_skeleton())
