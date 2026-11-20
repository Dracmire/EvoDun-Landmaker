#!/usr/bin/env python3
"""HT1-R: the UNITS of the three truth tables and how a run is scored against them. The truth (tools/ht1/truth_*.json) is frozen and is not edited; this file only says WHERE each unit is in the flat map and what the run predicts for it.
Nothing is compared tile by tile: every row is one STRUCTURE (a band across the axis, a zone, an edge, the landmark, the axis, the basin) and one verdict per row: ok / miss / no_data (the remake does not show it: not counted).
The selectors are the scaffolding that locates a truth row in the flat map (one line each); they are the same for every run and do not depend on which transformers are on.
  prediction vocabulary:  up N / down / same / level0 / closed / open / top / basin / jumps N
"""
import json, os
import numpy as np
from ops import Flat, NB, CLS, WALK, HERE

NAN = float('nan')
EXPECT = {   # id -> (expected change, its leading word in the frozen truth text: asserted, so a mismatch with the truth file is loud)
    'T1': ('level0', 'level 0'), 'T2': ('up1', 'up 1'), 'T3': ('up1', 'up 1'), 'T4': ('same', 'same'), 'T5': ('closed', 'closed'), 'T6': ('same', 'same'), 'T7': ('top', 'top'), 'AX': ('jumps2', 'rises in 2'),
    'A1': ('down', 'down'), 'A2': ('up', 'up'), 'A3': ('no_data', 'no_data'), 'A4': ('no_data', 'no_data'), 'A5': ('open', 'open'), 'A6': ('closed', 'closed'), 'A7': ('no_data', 'no_data'),
    'F1': ('up1', 'up 1'), 'F2': ('no_data', 'no_data'), 'F3': ('top', 'top'), 'F4': ('closed', 'closed'), 'F5': ('same', 'same'), 'F6': ('basin', 'yes')}


def mean(R, m):
    v = R.J[m]; v = v[~np.isnan(v)]; return float(v.mean()) if v.size else NAN


def cheb(f, tile, r):
    m = np.zeros((f.H, f.W), bool); x, y = tile; m[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1] = True; return m


def share_closed(R, pred):
    s = [g for g in R.closed if pred(g)]
    return (sum(g['closed'] for g in s) / len(s)) if s else None, len(s)


def unit(f, R, uid):
    """-> (predicted text, ok) for one truth row; ok is None for no_data rows."""
    b = f.bands(); walk = f.walk; lm = np.zeros((f.H, f.W), bool)
    for (x, y) in f.landmark: lm[y, x] = True
    floor = walk & ~lm
    d = lambda a, c: mean(R, a) - mean(R, c)
    if uid in ('T1', 'T2', 'T3', 'T4', 'AX', 'T7') and f.name == 'throne':
        T1, T2 = floor & (b == 0), floor & (b == 1); T3 = f.path & walk & cheb(f, f.goal, 1); T4 = floor & ~f.path & (b == NB - 1)
        if uid == 'T1': lo = float(np.nanmin(R.J[walk])); return ('level0' if mean(R, T1) <= lo + 1e-9 else 'above the lowest', mean(R, T1) <= lo + 1e-9)
        if uid == 'T2': x = d(T2, T1); return ('up %.1f' % x, round(x) == 1)
        if uid == 'T3': x = d(T3, T2); return ('up %.1f' % x, round(x) == 1)
        if uid == 'T4': x = d(T4, T2); return ('%+.1f' % x, abs(x) < 0.5)
        if uid == 'T7': top = np.nanmax(R.J[floor & (f.zones == f.zones[f.goal[1], f.goal[0]])]); g = R.J[f.goal[1], f.goal[0]]; return ('goal %.1f vs rest max %.1f' % (g, top), g > top)
        if uid == 'AX':
            seq = [R.J[y, x] for (x, y) in f.axis()]; ups = sum(1 for i in range(1, len(seq)) if seq[i] > seq[i - 1] + 1e-9); downs = sum(1 for i in range(1, len(seq)) if seq[i] < seq[i - 1] - 1e-9)
            return ('%d jumps, %d falls' % (ups, downs), ups == 2 and downs == 0)
    if uid == 'T5':
        c, n = share_closed(R, lambda g: g['other'] == 'wall'); return ('closed %s of %d' % ('-' if c is None else '%.0f%%' % (100 * c), n), c is not None and c >= 0.5)
    if uid == 'T6':
        pl = f.cls == CLS['pillar']; v = R.J[pl]; moved = bool(np.nansum(np.abs(v)) > 0) if v.size else False   # a pillar is a solid obstacle: no transformer assigns it a level
        return ('same (no transformer moves a pillar)' if not moved else 'moved', not moved)
    if uid == 'A1':
        w = f.cls == CLS['water']; land = floor; x = mean(R, w) - float(np.nanmin(R.J[land])); return ('water %.1f vs lowest land' % x, x < 0)
    if uid == 'A2':
        pz = int(f.zones[f.goal[1], f.goal[0]]); P = floor & (f.zones == pz); x = d(P, f.cls == CLS['water']); return ('up %.1f' % x, x > 0)
    if uid == 'A5':
        c, n = share_closed(R, lambda g: g['other'] == 'water'); c = 0.0 if c is None else c; return ('closed %.0f%% of %d' % (100 * c, n), c < 0.5)
    if uid == 'A6':
        c, n = share_closed(R, lambda g: g['other'] == 'outside' and g['side'] == 'N'); return ('closed %s of %d' % ('-' if c is None else '%.0f%%' % (100 * c), n), c is not None and c >= 0.5)
    if uid == 'F1':
        P = floor & np.isin(f.zones, (2, 3, 4)); V = floor & (f.zones == 1); x = d(P, V); return ('up %.1f' % x, round(x) == 1)
    if uid in ('F3',):
        z = int(f.zones[f.landmark[0][1], f.landmark[0][0]]); top = np.nanmax(R.J[floor & (f.zones == z)]); g = float(np.nanmax(R.J[lm])); return ('tower %.1f vs plateau max %.1f' % (g, top), g > top)
    if uid == 'F4':
        c, n = share_closed(R, lambda g: g['other'] == 'outside'); return ('closed %s of %d' % ('-' if c is None else '%.0f%%' % (100 * c), n), c is not None and c >= 0.5)
    if uid == 'F5':
        ring = floor & cheb(f, f.goal, 2); ring[f.goal[1], f.goal[0]] = False; x = R.J[f.goal[1], f.goal[0]] - mean(R, ring); return ('%+.1f vs ring' % x, abs(x) < 0.5)
    if uid == 'F6':
        P = f.path & floor; O = floor & ~f.path; x = d(P, O); return ('path %+.1f vs the rest' % x, x < 0)
    if EXPECT[uid][0] == 'no_data': return ('-', None)
    raise KeyError(uid)


def truth(name):
    t = json.load(open(os.path.join(HERE, 'truth_%s.json' % {'throne': 'throne', 'aurhea': 'aurhea', 'forest': 'forest'}[name])))
    for u in t['units']:
        want = EXPECT[u['id']][1]; assert u['remake_change'].startswith(want), 'the frozen truth of %s says %r, this scorer expects %r' % (u['id'], u['remake_change'], want)
    return t


def score(f, R):
    """-> list of rows {id, unit, expected, predicted, verdict}; verdict ok / miss / no_data."""
    rows = []
    for u in truth(f.name)['units']:
        exp = EXPECT[u['id']][0]
        if exp == 'no_data': rows.append({'id': u['id'], 'unit': u['unit'], 'expected': 'no_data', 'predicted': '-', 'verdict': 'no_data', 'remake': u['remake_change']}); continue
        pred, ok = unit(f, R, u['id']); rows.append({'id': u['id'], 'unit': u['unit'], 'expected': exp, 'predicted': pred, 'verdict': 'ok' if ok else 'miss', 'remake': u['remake_change']})
    return rows


def tally(rows):
    ev = [r for r in rows if r['verdict'] != 'no_data']; return sum(r['verdict'] == 'ok' for r in ev), len(ev)
