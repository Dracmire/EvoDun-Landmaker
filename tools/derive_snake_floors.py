"""Derive data/snake_mountain_floors.json (40x40) from data/snake_mountain_surface.json: the FLOORS package of crystallizer 5.
DERIVED data (not the user's spreadsheets): the mountain is hollow along a central vertical SHAFT, open at the top as a CRATER, with two interior floors.
Each floor is its own heightmap (a horizontal section of the exterior solid); the floors are linked by a DECLARED link (a flat landing next to the ring + a ramp carved by a forced site, rising toward the shaft).
Rules (all numbers are starting values, see docs/crystallizers/05-floors/README.md):
  1. exterior = the surface with the shaft pit: tiles whose centre is within SHAFT_R of the shaft axis are lowered to Z1 (the pit bottom = floor 1's disc), a sheer wall;
  2. floor k = the tiles whose exterior height is at least z_k + AMP + ROOF (a horizontal section with a roof margin that counts from the HIGHEST floor tile), eroded by SHELL
     tiles (distance to the border of the section, the protected exterior shell); the shaft disc is void in every floor except floor 1, where it stays as the pit bottom;
  3. floor heights: z_k plus a small deterministic bump (<= AMP, no random numbers) that is zero in the link box so the landing is exactly at the level of floor 2;
  4. the link (floor 1 -> floor 2) is DECLARED in the pack (`links`), not detected: along -x from the shaft, the ring of floor 1 (z1) at x 11..13, then a FLAT landing at Z2 (x 14..17, plus x 18 where
     r >= 2.5, lanes y 18..22, a cliff to the ring); the ramp is carved by a forced site at the pair a = (13, 20), b = (14, 20) with the link's own width x depth (3 x 2: the viewer's defaults for
     stairW and rampDepth), so its footprint is x 14..15, y 19..21. Floor 2 has a void OPENING over exactly that footprint (6 tiles); the arrival (landing tiles beyond the footprint, x 16..17) is floor 2; the viewer puts a low RAILING on the three sides of the opening that do not face the arrival and the marker D 'Stairs down' sits on the arrival edge tile (16, 20);
  5. everything uses the package's GLOBAL height frame `elevFrame` (the surface range) so terrace heights agree between floors.
Markers: the head `H` is moved to the high end of the spiral (22, 16) in THIS pack only; W, P, E stay where they are (placed for the old head).
Usage: python3 tools/derive_snake_floors.py   (needs numpy only; reproduces the committed JSON bit for bit)"""
import json, os, numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
src = json.load(open(os.path.join(ROOT, 'data/snake_mountain_surface.json')))
N = src['width']; assert N == src['height'] == 40
ext0 = np.array(src['elevation'], float).reshape(N, N)

AXIS = (20.5, 20.5); SHAFT_R = 2.5
Z1, Z2 = 3.6, 5.2; AMP = 0.15; ROOF = 1.0; SHELL = 1.5
LANE0, LANE1 = 18, 22                   # the landing's lanes (rows), centred on the axis row (tile 20 has its centre at 20.5)
LAND_X = (14, 18)                       # landing tiles (inclusive), inner side, inside floor 2; flat at Z2 (no slope: the ramp is carved by the declared link)
SITE_A, SITE_B = (13, 20), (14, 20)     # the forced pair: a = the ring tile, b = the first landing tile
LINK_W, LINK_D = 3, 2                   # the link's own width and depth (the viewer's default stairW and rampDepth: a small footprint, so the opening is 6 tiles and a 2-tile arrival ledge is left)
FOOT_X = (SITE_B[0], SITE_B[0] + LINK_D - 1); FOOT_Y = (SITE_B[1] - LINK_W // 2, SITE_B[1] + LINK_W // 2)
BOX = (10, 19, 17, 23)                  # x0, x1, y0, y1 inclusive: no bumps inside (the landing must sit exactly at Z2)

yy, xx = np.mgrid[0:N, 0:N]
r = np.hypot(xx + 0.5 - AXIS[0], yy + 0.5 - AXIS[1])
disc = r < SHAFT_R


def edge_distance(sec):
    """Euclidean distance of every tile to the nearest tile that is NOT in the section (outside the map counts as not in it); brute force, 40x40."""
    pad = np.pad(sec, 1, constant_values=False)
    ys, xs = np.nonzero(~pad)
    out = np.zeros((N, N))
    for y in range(N):
        for x in range(N):
            out[y, x] = np.sqrt(((ys - (y + 1)) ** 2 + (xs - (x + 1)) ** 2).min())
    return out


def bump(phase):
    """A smooth deterministic relief in [-AMP, AMP] (three sinusoids, fixed phases), zero inside the link box."""
    b = 0.5 * np.sin(0.9 * xx + phase) + 0.3 * np.cos(0.7 * yy + 0.4 + phase) + 0.2 * np.sin(0.55 * (xx + yy) + 2 * phase)
    b = AMP * b / 1.0
    inb = (xx >= BOX[0]) & (xx <= BOX[1]) & (yy >= BOX[2]) & (yy <= BOX[3])
    return np.where(inb, 0.0, b)


def section(z):
    sec = ext0 >= z + AMP + ROOF
    return sec & (edge_distance(sec) > SHELL)


land1 = section(Z1)                      # includes the shaft disc (pit bottom)
land2 = section(Z2) & ~disc              # the shaft is open above floor 1
lane = (yy >= LANE0) & (yy <= LANE1)
landing = lane & (xx >= LAND_X[0]) & (xx <= LAND_X[1]) & ~disc
footprint = (xx >= FOOT_X[0]) & (xx <= FOOT_X[1]) & (yy >= FOOT_Y[0]) & (yy <= FOOT_Y[1])

f1 = np.where(land1, Z1 + bump(1.3), 0.0)
f1 = np.where(disc & land1, Z1, f1)       # the pit bottom is flat: exactly the exterior's pit level
f1 = np.where(landing, Z2, f1)
f2 = np.where(land2, Z2 + bump(0.4), 0.0)
f2 = np.where(landing, Z2, f2)            # the landing of floor 1 is a walkable floor-2 tile at the same level
f2 = np.where(footprint, 0.0, f2)         # the OPENING: void over the ramp footprint only

# exterior with the pit
ext = ext0.copy(); ext[disc] = Z1

# checks of the derivation (the same ones are repeated in tools/test_floors.js)
assert (land2 <= land1).all(), 'floor 2 must be inside floor 1'
assert (land1 | ~landing).all(), 'the landing must lie on floor 1 land'
assert (land2 | ~landing).all(), 'the landing must lie on floor 2 land'
assert (landing | ~footprint).all() and int(footprint.sum()) == LINK_W * LINK_D, 'the footprint lies inside the landing'
assert land1[SITE_A[1], SITE_A[0]] and (Z1 + AMP < Z2), 'the pair a is a ring tile'


def rnd(a):
    return [round(float(v), 6) for v in a.reshape(-1)]


markers = []
for m in src['markers']:
    m = dict(m)
    if m['code'] == 'H':
        m.update(x=22, y=16, label='Snake head (high end of the spiral)')
    markers.append(m)
markers.append({'x': 21, 'y': 21, 'code': 'S', 'label': 'Shaft top (crater)'})
out = {
    'format': 'evodun-pack/0.3',
    'name': 'Snake Mountain floors (shaft and 2 interior floors, derived)',
    'source': 'data/snake_mountain_surface.json via tools/derive_snake_floors.py (numpy only, reproduces this file bit for bit). DERIVED data, not the user\'s spreadsheets.',
    'note': 'Crystallizer 5, Floors. The exterior is the surface with a sheer crater pit (shaft r 2.5 around the axis, down to floor 1). Floor k is a horizontal section of the exterior solid (a full-size heightmap, 0 = void); floors are NOT zones. '
            'The shaft replaces the serpent tube as the link between floors (a deliberate deviation from GDD 4.1); the link is a straight radial tongue + ramp rising toward the shaft. Row-major, index = y*width + x. x grows east, y grows south.',
    'width': N, 'height': N,
    'elevation': rnd(ext),
    'elevFrame': [float(ext0.min()), float(ext0.max())],
    'masks': {k: v for k, v in src['masks'].items() if k in ('snake', 'water', 'waterfall')},
    'markers': markers,
    'shaft': {'c': list(AXIS), 'r': SHAFT_R, 'top': float(ext0[disc].mean())},
    'floors': [
        {'id': 1, 'name': 'Floor 1', 'z': Z1, 'elevation': rnd(f1),
         'markers': [{'x': 12, 'y': 20, 'code': 'L', 'label': 'Floor link: foot'}]},
        {'id': 2, 'name': 'Floor 2', 'z': Z2, 'elevation': rnd(f2),
         'markers': [{'x': 16, 'y': 20, 'code': 'D', 'label': 'Stairs down (floor link)'}, {'x': 17, 'y': 20, 'code': 'A', 'label': 'Portal (landing)'}]},
    ],
    'links': [{'from': 1, 'to': 2, 'dir': '-x', 'site': {'a': list(SITE_A), 'b': list(SITE_B)}, 'width': LINK_W, 'depth': LINK_D,
               'landing': {'x': list(LAND_X), 'y': [LANE0, LANE1]}, 'footprint': {'x': list(FOOT_X), 'y': list(FOOT_Y)},
               'foot': [12, 20], 'arrival': [16, 20], 'opening': 'floor 2: void over exactly the footprint'}],
    'params': {'axis': list(AXIS), 'shaftR': SHAFT_R, 'z': [Z1, Z2], 'amp': AMP, 'roof': ROOF, 'shell': SHELL},
    'viewer': {'terraces': 5, 'minPlateau': 5},
}
path = os.path.join(ROOT, 'data/snake_mountain_floors.json')
with open(path, 'w') as f:
    f.write(json.dumps(out, separators=(',', ':')))
print('wrote', path, 'floor1 tiles', int(land1.sum()), 'floor2 tiles', int((f2 > 0).sum()), 'landing', int(landing.sum()), 'opening', int((land2 & footprint).sum()))
