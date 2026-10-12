"""Derive data/snake_mountain_floors.json (40x40) from data/snake_mountain_surface.json: the FLOORS package of crystallizer 5.
DERIVED data (not the user's spreadsheets): the mountain is hollow along a central vertical SHAFT, open at the top as a CRATER, with two interior floors.
Each floor is its own heightmap (a horizontal section of the exterior solid); the floors are linked by a straight radial TONGUE + ramp that rises toward the shaft.
Rules (all numbers are starting values, see docs/crystallizers/05-floors/README.md):
  1. exterior = the surface with the shaft pit: tiles whose centre is within SHAFT_R of the shaft axis are lowered to Z1 (the pit bottom = floor 1's disc), a sheer wall;
  2. floor k = the tiles whose exterior height is at least z_k + AMP + ROOF (a horizontal section with a roof margin that counts from the HIGHEST floor tile), eroded by SHELL
     tiles (distance to the border of the section, the protected exterior shell); the shaft disc is void in every floor except floor 1, where it stays as the pit bottom;
  3. floor heights: z_k plus a small deterministic bump (<= AMP, no random numbers) that is zero in the link box so the landing is exactly at the level of floor 2;
  4. the link (floor 1 -> floor 2): lanes LANE0..LANE1 (5 wide), along -x from the shaft: landing tiles at Z2 on the inner side (x 14..18, inside floor 2), ONE slope tile (x 13, at the band edge),
     the ring of floor 1 beyond (x 12, 11). Floor 2 has a void OPENING over the slope tiles only;
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
LANE0, LANE1 = 18, 22                   # 5 lanes centred on the axis row (tile 20 has its centre at 20.5)
LAND_X = (14, 18)                       # landing tiles (inclusive), inner side, inside floor 2
SLOPE_X = {13: 4.4}                     # ONE slope tile per lane at 4.4: exactly the band edge of 5 terraces over the package frame (4.39995). Measured on this package (tools/test_floors.js): the
                                        # gate + ramp of the viewer carves a walkable link at 3 and 5 terraces for stairW 1-5 and rampDepth 1-4 ONLY with this value; 3 slope tiles (the spike's geometry) fail at rampDepth 2
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
slope = {x: lane & (xx == x) for x in SLOPE_X}

f1 = np.where(land1, Z1 + bump(1.3), 0.0)
f1 = np.where(disc & land1, Z1, f1)       # the pit bottom is flat: exactly the exterior's pit level
f1 = np.where(landing, Z2, f1)
for x, h in SLOPE_X.items():
    f1 = np.where(slope[x], h, f1)
f2 = np.where(land2, Z2 + bump(0.4), 0.0)
f2 = np.where(landing, Z2, f2)            # the landing of floor 1 is a walkable floor-2 tile at the same level
for x in SLOPE_X:
    f2 = np.where(slope[x], 0.0, f2)      # the OPENING: void over the slope tiles only

# exterior with the pit
ext = ext0.copy(); ext[disc] = Z1

# checks of the derivation (the same ones are repeated in tools/test_floors.js)
assert (land2 <= land1).all(), 'floor 2 must be inside floor 1'
for m in (landing, *slope.values()):
    assert (land1 | ~m).all(), 'the link must lie on floor 1 land'
assert (land2 | ~landing).all(), 'the landing must lie on floor 2 land'
for x in SLOPE_X:
    assert (land2 & slope[x]).any(), 'the opening must cut floor 2 tiles'


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
         'markers': [{'x': 11, 'y': 20, 'code': 'L', 'label': 'Floor link: foot'}]},
        {'id': 2, 'name': 'Floor 2', 'z': Z2, 'elevation': rnd(f2),
         'markers': [{'x': 16, 'y': 20, 'code': 'A', 'label': 'Portal (landing)'}]},
    ],
    'links': [{'from': 1, 'to': 2, 'dir': '-x', 'lanes': [LANE0, LANE1], 'width': LANE1 - LANE0 + 1, 'foot': [11, 20], 'landing': [16, 20],
               'landingX': list(LAND_X), 'slopeX': sorted(SLOPE_X), 'slopeZ': [SLOPE_X[x] for x in sorted(SLOPE_X)], 'opening': 'floor 2: void over the slope tiles'}],
    'params': {'axis': list(AXIS), 'shaftR': SHAFT_R, 'z': [Z1, Z2], 'amp': AMP, 'roof': ROOF, 'shell': SHELL},
    'viewer': {'terraces': 5, 'minPlateau': 5},
}
path = os.path.join(ROOT, 'data/snake_mountain_floors.json')
with open(path, 'w') as f:
    f.write(json.dumps(out, separators=(',', ':')))
print('wrote', path, 'floor1 tiles', int(land1.sum()), 'floor2 tiles', int((f2 > 0).sum()), 'landing', int(landing.sum()), 'opening', int(sum((land2 & slope[x]).sum() for x in SLOPE_X)))
