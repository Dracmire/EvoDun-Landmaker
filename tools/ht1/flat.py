#!/usr/bin/env python3
"""HT1-R, Paso 1: the FLAT MAPS. The same JSON for the three maps (throne, Aurhea, forest): a grid of classes, the zones (connected pieces), the path mask, the goal, the solid landmark, the DECLARED entry, and a zone table with only structural facts. NO HEIGHT of any kind (no digit / letter of map1.txt, no grey of any height PNG, no variant A / B).

    python3 tools/ht1/flat.py [--out DIR] [--check]       (defaults: --out = tools/ht1/; needs numpy, scipy, Pillow and scikit-learn for the forest recipe)

THE READING OF THE MAP (colour -> class, the zones) IS INPUT, not a transformation: it is reused AS the three `derive_roles.py` do it (the throne: the grid of map1.txt read by the same function; Aurhea: `build()` of its script (classes by colour family, sectors by geometric rules); the forest: `build()` of its script (the v53 zoning)). It is not measured and not improved here.
Classes (the same codes in the three files): 0 void, 1 floor, 2 path (trail / carpet), 3 water, 4 wall, 5 pillar, 6 tree, 7 solid landmark (the throne, the tower), 8 rock (an edge of rock at the waterline; walkable floor with another name).
THE ENTRY is declared BY HAND, one line per map, with its reason (ENTRY below): it is data, not something the operators find.
What a zone is: a 4-connected piece of walkable ground (classes 1, 2, 6, 8 and the goal / landmark tile of the throne). Throne: the zones are the connected pieces of the walkable classes (one: the nave); Aurhea and forest: the zone ids of their scripts.
"""
import sys, os, json, argparse, importlib.util
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__)); REFS = os.path.normpath(os.path.join(HERE, '..', '..', 'docs', 'crystallizers', '03-stage', 'refs', 'dq3'))
CLS = {'void': 0, 'floor': 1, 'path': 2, 'water': 3, 'wall': 4, 'pillar': 5, 'tree': 6, 'landmark': 7, 'rock': 8}
WALKABLE = (1, 2, 6, 8)
# THE DECLARED ENTRIES (data by hand, one line per map, with the reason). Coordinates (x, y) in tiles of the OLD map (column, row), row 0 at the top of the picture / north.
ENTRY = {
    'throne': {'tile': [8, 11], 'reason': 'the south edge of the carpet on the axis (column 8 of 17): the door of the room is in the wall BEHIND the camera, centred on the carpet (map1.txt header)'},
    'aurhea': {'tile': [11, 21], 'reason': 'where the dirt trail meets the south edge of the map (the trail tiles on the bottom row are columns 9..14; 11 is the middle one)'},
    'forest': {'tile': [7, 0], 'reason': 'the north end of the long trail that crosses the map on the north edge (trail tiles on the border: (6, 0), (7, 0) and a separate trail at (22, 0)); (7, 0) is the end of the trail that reaches the south of the map'},
}


def load(path, name):
    s = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m


def zone_table(zones, cls, path, goal, entry):
    H, W = zones.shape; four = [(1, 0), (-1, 0), (0, 1), (0, -1)]; rows = []
    for z in sorted(int(v) for v in np.unique(zones) if v > 0):
        m = zones == z; ys, xs = np.where(m); nb = set()
        for y, x in zip(ys.tolist(), xs.tolist()):
            for dx, dy in four:
                a, b = x + dx, y + dy
                if 0 <= a < W and 0 <= b < H and zones[b, a] > 0 and zones[b, a] != z: nb.add(int(zones[b, a]))
        rows.append({'id': z, 'tiles': int(m.sum()), 'touches_map_edge': bool(m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any()), 'path_tiles': int((m & path).sum()), 'contains_landmark': bool((m & (cls == CLS['landmark'])).any()),
                     'contains_goal': bool(m[goal[1], goal[0]]), 'contains_entry': bool(m[entry[1], entry[0]]), 'neighbors': sorted(nb), 'centroid': [round(float(xs.mean()), 2), round(float(ys.mean()), 2)]})
    return rows


def pack(name, source, cls, zones, path, goal, landmark):
    H, W = cls.shape; e = ENTRY[name]; entry = e['tile']
    assert cls[entry[1], entry[0]] in WALKABLE or cls[entry[1], entry[0]] == CLS['landmark'], 'the declared entry is not walkable'
    return {'map': name, 'source': source, 'width': W, 'height': H, 'unit': 'tile of the OLD map', 'no_heights': True, 'classes': CLS,
            'grid': [[int(v) for v in r] for r in cls], 'zones': [[int(v) for v in r] for r in zones], 'path': [[int(v) for v in r] for r in path.astype(int)],
            'goal': list(map(int, goal)), 'landmark': [[int(x), int(y)] for y, x in zip(*np.where(cls == CLS['landmark']))] if landmark is None else landmark,
            'entry': {'tile': entry, 'reason': e['reason']}, 'zone_table': zone_table(zones, cls, path.astype(bool), goal, entry)}


def throne():
    d = load(os.path.join(REFS, 'throne_aliahan', 'derive_roles.py'), 'derive_throne'); grid = d.read_grid(os.path.join(REFS, 'throne_aliahan', 'map1.txt')); H, W = len(grid), len(grid[0])
    cls = np.zeros((H, W), np.int32); path = np.zeros((H, W), bool); goal = None
    for y in range(H):
        for x in range(W):
            c = grid[y][x]   # ONLY the class of the character: the digits and letters are the hand transformation and give floor / carpet, nothing more
            if c == 'W': cls[y, x] = CLS['wall']
            elif c in 'PQ': cls[y, x] = CLS['pillar']
            elif c in '012345': cls[y, x] = CLS['floor']
            elif c in 'abcdef': cls[y, x] = CLS['path']; path[y, x] = True
            elif c == 'T': cls[y, x] = CLS['landmark']; path[y, x] = True; goal = (x, y)
            else: raise SystemExit('unknown character %r' % c)
    walk = np.isin(cls, WALKABLE + (CLS['landmark'],)); lab, n = ndi.label(walk, structure=ndi.generate_binary_structure(2, 1))
    return pack('throne', 'refs/dq3/throne_aliahan/map1.txt (grid read by derive_roles.read_grid; characters -> classes only)', cls, lab, path, goal, None)


def aurhea():
    d = load(os.path.join(REFS, 'aurheas_fountain', 'derived', 'derive_roles.py'), 'derive_aurhea').build()
    names = {'water': 'water', 'rock': 'rock', 'path': 'path', 'flower': 'floor', 'grass': 'floor', 'tree': 'tree'}; H, W = d['cls'].shape; cls = np.zeros((H, W), np.int32)
    for y in range(H):
        for x in range(W): cls[y, x] = CLS[names[d['cls'][y, x]]]
    return pack('aurhea', 'refs/dq3/aurheas_fountain/derived/derive_roles.py build() (classes by colour family, sectors by geometric rules)', cls, d['Z'], d['path'], d['tip'], [])


def forest():
    m = load(os.path.join(REFS, 'forest_plains', 'annotated', 'derive_roles.py'), 'derive_forest'); d = m.build()
    H, W = d['Z'].shape; cls = np.full((H, W), CLS['floor'], np.int32); cls[d['trees']] = CLS['tree']; cls[d['tr']] = CLS['path']; cls[d['tower']] = CLS['landmark']
    return pack('forest', 'refs/dq3/forest_plains/annotated/derive_roles.py build() (the v53 zoning; trail = class 6, tower, trees)', cls, d['Z'], d['tr'], list(m.POI['A'][:2]), None)   # the goal = the POI A of the script (the door of the shrine, two tiles south of it)


MAPS = {'throne': throne, 'aurhea': aurhea, 'forest': forest}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=HERE); ap.add_argument('--check', action='store_true'); a = ap.parse_args(); bad = 0
    for name, fn in MAPS.items():
        j = fn(); text = json.dumps(j, separators=(',', ':')) + '\n'; p = os.path.join(a.out, 'flat_%s.json' % name)
        if a.check:
            same = os.path.exists(p) and open(p).read() == text; print('%-18s %s' % (os.path.basename(p), 'ok' if same else 'DIFFERS')); bad += 0 if same else 1
        else: open(p, 'w').write(text); print('wrote', p, '%d x %d, zones %s, path %d, goal %s, entry %s' % (j['width'], j['height'], [z['id'] for z in j['zone_table']], sum(map(sum, j['path'])), j['goal'], j['entry']['tile']))
    if a.check: sys.exit(1 if bad else 0)


if __name__ == '__main__': main()
