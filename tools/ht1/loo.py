#!/usr/bin/env python3
"""HT1-R, Paso 3: LEAVE ONE MAP OUT (three runs). For each map M left out: (1) with the OTHER two maps choose the set of transformers (which of T-A .. T-F are on: the 64 subsets) by the largest number of units hit in those two maps (ties: fewer transformers on, then the first in the order A B C D E F); (2) apply that set to the flat map of M; (3) the table unit by unit against truth_M.json; (4) the verdict by the discard rule of TRANSFORMADORES.md section 5: HT1 stays at lv2 if, in the map left out, the transformers fire where the remake did not change or do not fire where it did, in the MAJORITY of the units (more than half of the units that have data).
CONTRADICTIONS (section 7): when the chosen set fails on M, the ALTERNATIVE set (A <-> F swapped) is also run on M and the attributes of the flat maps that separate the maps where each wins are listed; no single set is forced. The oracle (the best set for M itself) is printed to read the runs, never used to choose.
    python3 tools/ht1/loo.py [--json PATH]
"""
import json, os, sys, itertools
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ops import Flat, run, OPS, TF_SHARE, NB, CLS
from units import score, tally

MAPS = ['throne', 'aurhea', 'forest']
FL = {m: Flat(m) for m in MAPS}
SUBSETS = [frozenset(c) for r in range(0, 7) for c in itertools.combinations(OPS, r)]


def acc(m, on):
    rows = score(FL[m], run(FL[m], set(on))); return tally(rows), rows


def choose(train):
    best = None
    for s in SUBSETS:
        hit = sum(acc(m, s)[0][0] for m in train); tot = sum(acc(m, s)[0][1] for m in train)
        k = (-hit, len(s), [OPS.index(x) for x in sorted(s)])
        if best is None or k < best[0]: best = (k, s, hit, tot)
    return best[1], best[2], best[3]


def alt(s):
    if 'A' in s and 'F' not in s: return frozenset(s - {'A'} | {'F'})
    if 'F' in s and 'A' not in s: return frozenset(s - {'F'} | {'A'})
    return None


def attrs(m):
    f = FL[m]; tot = max(1, int(f.path.sum())); trail = [z for z, t in f.table.items() if t['path_tiles'] / tot >= TF_SHARE]; gz = int(f.zones[f.goal[1], f.goal[0]]); edge = bool(f.walk[0].any() or f.walk[-1].any() or f.walk[:, 0].any() or f.walk[:, -1].any())
    return {'has_water': bool((f.cls == CLS['water']).any()), 'has_walls': bool((f.cls == CLS['wall']).any()), 'walkable_touches_map_edge': edge, 'closed_room': bool((f.cls == CLS['wall']).any()) and not edge,
            'zones': len(f.table), 'trail_zones': len(trail), 'goal_zone_has_trail': gz in trail, 'goal_is_solid_landmark_tile': bool(f.cls[f.goal[1], f.goal[0]] == CLS['landmark']), 'solid_landmark_elsewhere_than_goal': bool(len(f.landmark) and f.cls[f.goal[1], f.goal[0]] != CLS['landmark'])}


def contradiction():
    """T-A against T-F (section 7) with the other transformers equal: base C D E (+ A or F), on each map; the winner per map and the attributes of the flat maps that separate the maps where each wins."""
    base = {'C', 'D', 'E'}; res = {}
    for m in MAPS:
        a, f = acc(m, base | {'A'})[0], acc(m, base | {'F'})[0]; res[m] = {'A': a, 'F': f, 'winner': 'A' if a[0] > f[0] else 'F' if f[0] > a[0] else 'tie'}
    at = {m: attrs(m) for m in MAPS}; sep = []
    for k in at[MAPS[0]]:
        if isinstance(at[MAPS[0]][k], bool):
            win = {w: [m for m in MAPS if res[m]['winner'] == w] for w in ('A', 'F')}
            if win['A'] and win['F'] and all(at[m][k] for m in win['A']) and not any(at[m][k] for m in win['F']): sep.append((k, 'True where A wins, False where F wins'))
            elif win['A'] and win['F'] and not any(at[m][k] for m in win['A']) and all(at[m][k] for m in win['F']): sep.append((k, 'False where A wins, True where F wins'))
    return {'base': sorted(base), 'per_map': res, 'separating_attributes': sep}


def main():
    out = {'runs': {}, 'marginal': {}, 'attributes': {m: attrs(m) for m in MAPS}, 'contradiction': contradiction()}
    for m in MAPS:   # each transformer alone, on each map (to read the contradictions)
        out['marginal'][m] = {k: acc(m, {k})[0] for k in OPS}; out['marginal'][m]['(none)'] = acc(m, set())[0]
    for M in MAPS:
        train = [m for m in MAPS if m != M]; s, hit, tot = choose(train); (h, n), rows = acc(M, s); fired = run(FL[M], set(s)).fired
        r = {'left_out': M, 'train': train, 'chosen': sorted(s), 'train_hits': [hit, tot], 'hits': h, 'units': n, 'verdict': 'REPLICATES' if h * 2 > n else 'LV2 (does not replicate)', 'rows': rows, 'fired': fired}
        a = alt(s)
        if a is not None:
            (h2, n2), rows2 = acc(M, a); r['alternative'] = {'set': sorted(a), 'hits': h2, 'units': n2, 'rows': rows2, 'train_hits': sum(acc(m, a)[0][0] for m in train)}
        sc = sorted(((acc(M, x)[0][0], -len(x), sorted(x)) for x in SUBSETS), key=lambda t: (-t[0], -t[1])); r['oracle'] = {'hits': sc[0][0], 'set': sc[0][2], 'sets_with_that_score': sum(1 for t in sc if t[0] == sc[0][0])}
        out['runs'][M] = r
    return out


def md(out):
    L = ['| Mapa fuera | Conjunto elegido con los otros dos | Aciertos en los otros dos | Unidades acertadas / total en el mapa fuera | Veredicto | Conjunto alternativo (A <-> F) | Aciertos del alternativo |', '|---|---|---|---|---|---|---|']
    for M, r in out['runs'].items():
        al = r.get('alternative'); L.append('| %s | %s | %d / %d | **%d / %d** | %s | %s | %s |' % (M, ' '.join('T-' + k for k in r['chosen']) or '(ninguno)', r['train_hits'][0], r['train_hits'][1], r['hits'], r['units'], r['verdict'], (' '.join('T-' + k for k in al['set']) if al else '-'), ('%d / %d' % (al['hits'], al['units']) if al else '-')))
    return '\n'.join(L)


if __name__ == '__main__':
    out = main(); i = sys.argv.index('--json') if '--json' in sys.argv else -1
    if i > 0: json.dump(out, open(sys.argv[i + 1], 'w'), indent=1, default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))
    print(md(out))
    for M, r in out['runs'].items():
        print('\n## left out:', M, '| chosen', r['chosen'], '| train', r['train_hits'], '| hits', r['hits'], '/', r['units'], '|', r['verdict'], '| oracle', r['oracle'])
        for x in r['rows']: print('  %-3s %-8s expected %-9s predicted %s' % (x['id'], x['verdict'], x['expected'], x['predicted']))
        if 'alternative' in r:
            print('  alternative', r['alternative']['set'], r['alternative']['hits'], '/', r['alternative']['units'], '(train', r['alternative']['train_hits'], ')')
            for x in r['alternative']['rows']: print('     %-3s %-8s %s' % (x['id'], x['verdict'], x['predicted']))
    print('\nMARGINAL (each transformer alone: hits / units):')
    for m, d in out['marginal'].items(): print(' ', m, {k: '%d/%d' % v for k, v in d.items()})
    print('\nCONTRADICTION T-A vs T-F (base C D E):', json.dumps(out['contradiction'], default=list))
    print('\nATTRIBUTES:')
    for m, a in out['attributes'].items(): print(' ', m, a)
