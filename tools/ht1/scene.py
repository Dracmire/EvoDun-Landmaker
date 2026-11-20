#!/usr/bin/env python3
"""HT1-R, Paso 4 (only to LOOK at): the jumps of a run -> role PNGs (height, zones, path, poi) that the viewer loads as "Your images (PNG + roles)" (mode 3). One jump = one terrace: the integer levels 0..L-1 become grey 20 + 12 k (the viewer then needs `terraces` = L; tools/ui/ht1_scene.js sets it). 2 x 2 px per tile of the old map (as the three derive_roles.py do).
Per map two scenes: CHOSEN = the set that the leave-one-out run chose with the OTHER two maps, ALT = the alternative set (A <-> F swapped). Written to tools/ht1/scene/<map>_<chosen|alt>/ (tiny PNGs + scene.json with the levels, the hero positions k0 / k4 along the axis in map pixels and the zones to put in the window).
Painting rules (the visible form of the jumps, nothing else): walkable tile = its jump; water = its jump (T-C); a solid landmark = its jump; a pillar = the level of the nearest walkable tile; a WALL tile (T-D on) = the highest jump + 1 (the closed edge goes up to the top); void (grey 0) nowhere. Edges of the MAP that T-D closes cannot be painted (nothing beyond the map): `planes` of mode 3 closes the back by itself.
    python3 tools/ht1/scene.py
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ops import Flat, run, CLS, WALK
import loo

HERE = os.path.dirname(os.path.abspath(__file__)); SC = 2; BASE, STEP = 20, 12


def png(path, a): Image.fromarray(a, 'RGBA').save(path)


def make(name, on, out):
    f = Flat(name); R = run(f, set(on)); J = R.J.copy(); H, W = f.H, f.W
    walkable_or_lm = f.walk | (f.cls == CLS['landmark']); lvl = np.full((H, W), np.nan)
    lvl[walkable_or_lm] = J[walkable_or_lm]; lvl[f.cls == CLS['water']] = J[f.cls == CLS['water']]
    nearest = ndi.distance_transform_edt(np.isnan(lvl), return_distances=False, return_indices=True)
    fill = lvl[tuple(nearest)]
    top = float(np.nanmax(lvl)) + 1.0
    for y in range(H):
        for x in range(W):
            if np.isnan(lvl[y, x]):
                lvl[y, x] = top if (f.cls[y, x] == CLS['wall'] and 'D' in on) else fill[y, x]
    lvl -= lvl.min(); lvl = np.round(lvl).astype(int); L = int(lvl.max()) + 1
    up = lambda a: np.kron(a, np.ones((SC, SC), a.dtype))
    grey = (BASE + STEP * lvl).astype(np.uint8); import colorsys
    ids = sorted(int(z) for z in np.unique(f.zones) if z > 0); zrgb = np.zeros((H * SC, W * SC, 4), np.uint8); zrgb[..., 3] = 255; nz = max(ids) + 1
    for k in ids:
        r, g, b = colorsys.hsv_to_rgb(k / nz, 1, 1); zrgb[up(f.zones) == k, :3] = [round(r * 255), round(g * 255), round(b * 255)]
    g4 = lambda a: np.dstack([up(a)] * 3 + [np.full((H * SC, W * SC), 255, np.uint8)])
    poi = np.zeros((H, W), np.uint8); poi[f.goal[1], f.goal[0]] = 255
    os.makedirs(out, exist_ok=True); png(os.path.join(out, 'height.png'), g4(grey)); png(os.path.join(out, 'zones.png'), zrgb); png(os.path.join(out, 'path.png'), g4(np.where(f.path, 255, 0).astype(np.uint8))); png(os.path.join(out, 'poi.png'), g4(poi))
    ax = f.axis(); k0 = ax[0]; k4 = ax[len(ax) // 2]; px = lambda t: [t[0] * SC + 1, t[1] * SC + 1]
    meta = {'map': name, 'set': sorted(on), 'levels': L, 'level_counts': {int(k): int((lvl == k).sum()) for k in range(L)}, 'window_zones': ids, 'hero_k0': px(k0), 'hero_k4': px(k4), 'axis_len': len(ax), 'terraces_to_set': L, 'fired': R.fired}
    json.dump(meta, open(os.path.join(out, 'scene.json'), 'w'), indent=1, default=str); return meta


if __name__ == '__main__':
    res = loo.main()
    for m, r in res['runs'].items():
        for tag, on in (('chosen', r['chosen']), ('alt', r.get('alternative', {}).get('set'))):
            if on is None: continue
            d = os.path.join(HERE, 'scene', '%s_%s' % (m, tag)); meta = make(m, on, d); print(m, tag, on, 'levels', meta['levels'], meta['level_counts'], 'hero k0', meta['hero_k0'], 'k4', meta['hero_k4'])
