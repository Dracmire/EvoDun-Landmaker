#!/usr/bin/env python3
"""HT1-R, Paso 2: the TRANSFORMERS T-A .. T-F of docs/crystallizers/03-stage/TRANSFORMADORES.md section 3, each a function on UNITS (a band across the axis, a zone, a landmark, an edge), in the order of section 4:
   classes and zones (input) -> T-C (the water sinks) -> T-B and T-A or T-F (the kind of place decides) -> T-E (the landmark is the top) -> T-D (the edge closes).
They read ONLY the flat map (tools/ht1/flat_*.json: classes, zones, path, goal, landmark, declared entry; no height) and return the RELATIVE JUMP of every unit (whole jumps, 1 jump = 1 terrace) and the CLOSED edges. The same constants for the three maps (they are written once, here; nothing is tuned per map).

    FIXED CONSTANTS (the same for every map, never adjusted to make a run pass):
      NB       = 3     bands across the axis (thirds of the axis arc length)
      TF_SHARE = 0.20  a zone is a TRAIL zone when it holds at least this share of all the path tiles
      COST     = path tile 1, any other walkable tile 2 (the axis follows the trail where there is one)
    T-A  ascent along the axis       the axis = the cheapest walk entry -> goal; every walkable tile belongs to the band of its nearest axis point; band k (0 = the entry side) is k jumps above band 0.
    T-B  displacement of a unit      the zones are a graph (shared borders); a walkable zone is as many jumps above the entry zone as its hops from it (a neighbour of the entry zone is one jump above it).
    T-C  the water sinks             every water tile is one jump below the lowest land after the other transformers.
    T-D  the edge closes             a segment between walkable ground and a WALL or the OUTSIDE of the map is CLOSED (raised to the top); a segment against water, a pillar or anything else stays open.
    T-E  the solid landmark is top   the landmark tile is one jump above the highest walkable tile of its zone.
    T-F  basin                       zones with at least TF_SHARE of the path are the basin floor; every other zone is as many jumps above it as its hops from the nearest basin zone.
"""
import json, os, heapq, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
NB, TF_SHARE = 3, 0.20
OPS = ['A', 'B', 'C', 'D', 'E', 'F']
ORDER = ['C', 'B', 'A', 'F', 'E', 'D']            # section 4 (T-B first, then A or F)
CLS = {'void': 0, 'floor': 1, 'path': 2, 'water': 3, 'wall': 4, 'pillar': 5, 'tree': 6, 'landmark': 7, 'rock': 8}
WALK = (1, 2, 6, 8)


class Flat:
    def __init__(self, name):
        j = json.load(open(os.path.join(HERE, 'flat_%s.json' % name))); self.name = name; self.j = j; self.W, self.H = j['width'], j['height']
        self.cls = np.array(j['grid']); self.zones = np.array(j['zones']); self.path = np.array(j['path']).astype(bool); self.goal = tuple(j['goal']); self.entry = tuple(j['entry']['tile'])
        self.landmark = [tuple(t) for t in j['landmark']]
        self.walk = np.isin(self.cls, WALK)
        for (x, y) in self.landmark + [self.goal]: self.walk[y, x] = self.walk[y, x] or self.cls[y, x] == CLS['landmark'] and (x, y) == self.goal   # the goal tile is walkable even when it is the landmark (the throne)
        self.table = {z['id']: z for z in j['zone_table']}
        self._axis = None

    def axis(self):
        """the cheapest 4-connected walk entry -> goal over walkable ground: path tile 1, any other 2."""
        if self._axis is not None: return self._axis
        H, W = self.H, self.W; cost = lambda x, y: 1 if self.path[y, x] else 2; INF = 1e18; dist = np.full((H, W), INF); prev = {}; ex, ey = self.entry; dist[ey, ex] = 0; pq = [(0, ex, ey)]
        while pq:
            d, x, y = heapq.heappop(pq)
            if d > dist[y, x]: continue
            if (x, y) == self.goal: break
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = x + dx, y + dy
                if 0 <= a < W and 0 <= b < H and self.walk[b, a]:
                    nd = d + cost(a, b)
                    if nd < dist[b, a]: dist[b, a] = nd; prev[(a, b)] = (x, y); heapq.heappush(pq, (nd, a, b))
        assert dist[self.goal[1], self.goal[0]] < INF, 'no walk from the entry to the goal in %s' % self.name
        p = [self.goal]
        while p[-1] != self.entry: p.append(prev[p[-1]])
        self._axis = p[::-1]; return self._axis

    def bands(self):
        """band index (0 = the entry side .. NB-1) of every walkable tile, from the arc-length fraction of its nearest axis point; -1 for the rest."""
        ax = self.axis(); arc = np.concatenate([[0], np.cumsum([math.hypot(ax[i + 1][0] - ax[i][0], ax[i + 1][1] - ax[i][1]) for i in range(len(ax) - 1)])]); tot = arc[-1] or 1.0
        out = np.full((self.H, self.W), -1, int); P = np.array(ax, float)
        for y in range(self.H):
            for x in range(self.W):
                if not self.walk[y, x]: continue
                k = int(np.argmin(((P[:, 0] - x) ** 2 + (P[:, 1] - y) ** 2)))
                out[y, x] = min(NB - 1, int(NB * arc[k] / tot))
        return out

    def zone_graph_hops(self, sources):
        """hops over the graph of zones (shared borders) from a set of zone ids; zones not reached get None."""
        hop = {z: 0 for z in sources}; q = list(sources)
        for z in q:
            for n in self.table[z]['neighbors']:
                if n not in hop: hop[n] = hop[z] + 1; q.append(n)
        return hop


class Result:
    def __init__(self, f):
        self.f = f; self.J = np.full((f.H, f.W), np.nan); self.J[f.walk] = 0.0; self.J[f.cls == CLS['water']] = 0.0; self.closed = None; self.fired = {}; self.on = set()   # no transformer yet: land and water are at the same level (0)


def t_c(f, R):
    R.water = f.cls == CLS['water']; R.fired['C'] = {'water_tiles': int(R.water.sum())}


def t_b(f, R):
    ez = int(f.zones[f.entry[1], f.entry[0]]); hop = f.zone_graph_hops([ez]); moved = {}
    for z, h in hop.items():
        if h: R.J[(f.zones == z) & f.walk] += h; moved[z] = h
    R.fired['B'] = {'entry_zone': ez, 'zone_jumps': moved}


def t_a(f, R):
    b = f.bands(); R.J[f.walk] += b[f.walk]; R.fired['A'] = {'bands': NB, 'axis_tiles': len(f.axis()), 'band_tiles': [int((b == k).sum()) for k in range(NB)]}


def t_f(f, R):
    tot = max(1, int(f.path.sum())); basin = [z for z, t in f.table.items() if t['path_tiles'] / tot >= TF_SHARE]; moved = {}
    if basin:
        hop = f.zone_graph_hops(basin)
        for z, h in hop.items():
            if h: R.J[(f.zones == z) & f.walk] += h; moved[z] = h
    R.fired['F'] = {'basin_zones': basin, 'zone_jumps': moved}


def t_e(f, R):
    """the landmark: ONE jump above the highest walkable tile of its zone that is not a landmark tile (computed before raising any landmark tile)."""
    lm = np.zeros((f.H, f.W), bool)
    for (x, y) in f.landmark: lm[y, x] = True
    tops = {}; done = []
    for (x, y) in f.landmark:
        z = int(f.zones[y, x])
        if z not in tops:
            m = (f.zones == z) & f.walk & ~lm; tops[z] = float(np.nanmax(R.J[m])) if m.any() else 0.0
    for (x, y) in f.landmark:
        z = int(f.zones[y, x]); R.J[y, x] = tops[z] + 1.0; done.append([x, y, z])
    R.fired['E'] = {'landmark_tiles': len(done), 'zones': sorted(tops)}


def t_d(f, R):
    segs = []; H, W = f.H, f.W
    for y in range(H):
        for x in range(W):
            if not f.walk[y, x]: continue
            for dx, dy, name in ((1, 0, 'E'), (-1, 0, 'W'), (0, 1, 'S'), (0, -1, 'N')):
                a, b = x + dx, y + dy
                if not (0 <= a < W and 0 <= b < H): segs.append({'tile': [x, y], 'side': name, 'other': 'outside', 'closed': True}); continue
                if f.walk[b, a]: continue
                c = int(f.cls[b, a]); segs.append({'tile': [x, y], 'side': name, 'other': {CLS['wall']: 'wall', CLS['water']: 'water', CLS['pillar']: 'pillar', CLS['landmark']: 'landmark'}.get(c, 'other'), 'closed': c == CLS['wall']})
    R.closed = segs; R.fired['D'] = {'segments': len(segs), 'closed': sum(s['closed'] for s in segs)}


FUNS = {'A': t_a, 'B': t_b, 'C': t_c, 'D': t_d, 'E': t_e, 'F': t_f}


def run(f, on):
    """apply the transformers in `on` (a set of letters) in the order of section 4 -> Result (J: the jump of every tile in whole terraces, nan where no unit moves it; closed: the edge segments)."""
    R = Result(f); R.on = set(on)
    for k in ORDER:
        if k in on: FUNS[k](f, R)
    if 'C' in on:
        land = R.J[f.walk]; low = float(np.nanmin(land)) if land.size else 0.0; R.J[R.water] = low - 1.0
    for (x, y) in f.landmark:   # a solid landmark that no transformer raised stands on the ground of its zone (its level = the mean of the walkable tiles of that zone): it is not 'above' anything
        if np.isnan(R.J[y, x]):
            m = (f.zones == f.zones[y, x]) & f.walk; R.J[y, x] = float(np.nanmean(R.J[m])) if m.any() else 0.0
    if R.closed is None: R.closed = []
    return R


if __name__ == '__main__':
    import sys
    for name in ('throne', 'aurhea', 'forest'):
        f = Flat(name); R = run(f, set(OPS)); print(name, 'axis', len(f.axis()), 'fired', json.dumps(R.fired)[:300])
