/* Crystallizer 6 (Macroform): the derived package data/snake_mountain_macroform.json, checked INDEPENDENTLY of the Python script (the data only), plus the Python reference test.
   Format: `elevation` = the outer surface of snake_mountain_surface, `masks.snake`, `volume` (per column the SOLID intervals [z0, z1, mat] in ELEVATION units, z_tiles / vScale), `macro` (floors, ramp, shaft, head).
   Checks: column intervals sorted / disjoint / on the voxel grid; the exterior is unchanged outside the shaft (top solid = the surface within DZ); material voxel counts (the spike's); the walk graph rebuilt from `macro`
   (floor nodes + ramp nodes, 4-neighbour, step <= 0.75) reaches every floor (>= 94 %: floor 2 is 94.7 %; user decision 2026-10-14, the exact counts below stay the real guard), each floor reaches the shaft ring, the ramp 100 %; max ramp slope <= 0.65 (PROVISIONAL cap); headroom >= HEAD - DZ.
   Then tools/test_macroform.py (the numbers of the spike, determinism); SKIP when python3 / numpy / scipy are missing. Run: node tools/test_macroform.js */
const fs = require('fs'), path = require('path'), cp = require('child_process');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const D = path.join(__dirname, '../data'), pk = JSON.parse(fs.readFileSync(path.join(D, 'snake_mountain_macroform.json'), 'utf8')), surf = JSON.parse(fs.readFileSync(path.join(D, 'snake_mountain_surface.json'), 'utf8')), old = JSON.parse(fs.readFileSync(path.join(D, 'snake_mountain.json'), 'utf8'));
const N = pk.width, V = pk.volume.vScale, dz = pk.volume.dz, DZ = dz * V, M = pk.macro.params, mats = pk.volume.materials, cols = pk.volume.columns;
ok('the pack is evodun-pack/0.3 with the optional keys volume and macro, 40 x 40', pk.format === 'evodun-pack/0.3' && N === 40 && pk.height === 40 && cols.length === N * N && !!pk.macro && M.provisional === true);
ok('`elevation` is exactly the surface of snake_mountain_surface and `masks.snake` the snake mask of snake_mountain (every existing technique draws the same exterior)', JSON.stringify(pk.elevation) === JSON.stringify(surf.elevation) && JSON.stringify(pk.masks.snake) === JSON.stringify(old.masks.snake));
ok('materials: air, rock, serpent, slab, ramp, ground; vScale 2, dz 0.125 elevation units (= 0.25 tile)', mats.join() === 'air,rock,serpent,slab,ramp,ground' && V === 2 && dz === 0.125 && Math.abs(DZ - 0.25) < 1e-12);
let badIv = 0, solid = 0; const cnt = new Array(mats.length).fill(0);
for (const iv of cols) { let prev = -1; for (const [z0, z1, m] of iv) { const a = z0 / dz, b = z1 / dz; if (!(z1 > z0) || z0 < prev || a !== Math.round(a) || b !== Math.round(b) || !(m >= 1 && m < mats.length)) badIv++; prev = z1; cnt[m] += b - a; solid += b - a; } }
ok('every column: intervals sorted, disjoint, z0 < z1, on the voxel grid, materials valid (and not air)', badIv === 0, badIv);
const air = pk.volume.nz * N * N - solid, want = { air: 97660, rock: 23695, serpent: 2686, slab: 1013, ramp: 307, ground: 1039 };
ok('material voxel counts = the spike: air 97660, rock 23695, serpent 2686, slab 1013, ramp 307, ground 1039', JSON.stringify({ air, rock: cnt[1], serpent: cnt[2], slab: cnt[3], ramp: cnt[4], ground: cnt[5] }) === JSON.stringify(want), { air, cnt });
// the exterior: outside the shaft the top solid of every column equals the surface within DZ
const ax = pk.macro.shaft.c, R0 = pk.macro.shaft.r; let worst = 0, nShaft = 0;
for (let i = 0; i < N * N; i++) { const x = i % N + 0.5, y = Math.floor(i / N) + 0.5; if (Math.hypot(x - ax[0], y - ax[1]) <= R0) { nShaft++; continue; } const iv = cols[i], top = iv.length ? iv[iv.length - 1][1] * V : 0; worst = Math.max(worst, Math.abs(top - pk.elevation[i] * V)); }
ok(`invariant: outside the shaft (${N * N - nShaft} columns) the top solid equals the original surface within DZ (worst ${worst.toFixed(3)} tiles)`, worst <= DZ + 1e-9, worst);
// walk graph rebuilt from macro: floor nodes (not under a far ramp column) + ramp nodes; 4-neighbour moves, height change <= STEP
const STEP = M.STEP, rampZ = new Map(pk.macro.ramp.tiles.map(([x, y, z, t]) => [y * N + x, z * V])), nodes = new Map();
pk.macro.floors.forEach((f, k) => { for (const [x, y] of f.tiles) { const i = y * N + x; if (!rampZ.has(i) || Math.abs(rampZ.get(i) - f.zTiles) <= STEP) nodes.set(`${k + 1}:${i}`, f.zTiles); } });
for (const [i, z] of rampZ) nodes.set(`r:${i}`, z);
const at = new Map(); for (const [key, z] of nodes) { const i = +key.split(':')[1]; if (!at.has(i)) at.set(i, []); at.get(i).push([key, z]); }
const head = pk.macro.head, start = `r:${head.y * N + head.x}`; ok('the head marker (21, 15) is the high end of the serpent and a ramp tile', head.x === 21 && head.y === 15 && nodes.has(start) && pk.markers.some((m) => m.code === 'H' && m.x === 21 && m.y === 15));
const seen = new Set([start]), q = [start];
while (q.length) { const key = q.shift(), i = +key.split(':')[1], x = i % N, y = Math.floor(i / N), z = nodes.get(key); for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= N || b >= N) continue; for (const [k2, z2] of at.get(b * N + a) || []) if (!seen.has(k2) && Math.abs(z2 - z) <= STEP) { seen.add(k2); q.push(k2); } } }
const ringOK = (i) => { const r = Math.hypot(i % N + 0.5 - ax[0], Math.floor(i / N) + 0.5 - ax[1]); return r > R0 && r <= R0 + 1.5; };
const per = pk.macro.floors.map((f, k) => { const ks = [...nodes.keys()].filter((s) => s.startsWith(`${k + 1}:`)), got = ks.filter((s) => seen.has(s)); return { n: ks.length, got: got.length, ring: got.some((s) => ringOK(+s.split(':')[1])) }; });
const rampGot = [...seen].filter((s) => s.startsWith('r:')).length;
ok('walk graph (664 nodes) from the head end: floor 1 276 / 279, floor 2 144 / 152, floor 3 94 / 98, ramp 135 / 135 (the spike)', nodes.size === 664 && per.map((p) => p.got + '/' + p.n).join() === '276/279,144/152,94/98' && rampGot === 135, { size: nodes.size, per, rampGot });
ok('ENFORCED reachability: every floor >= 94 % (floor 2 is 94.7 %; the stated 95 % is a rounding, flagged in the PR), each floor reaches the shaft ring, the ramp 100 %', per.every((p) => p.got / p.n >= 0.94 && p.ring) && rampGot === rampZ.size, per);
// the ramp slope along the centreline (the path is sampled every 0.25 tile)
const path_ = pk.macro.ramp.path; let ms = 0, len = 0; for (let i = 1; i < path_.length; i++) { const dxy = Math.hypot(path_[i][0] - path_[i - 1][0], path_[i][1] - path_[i - 1][1]); len += dxy; ms = Math.max(ms, Math.abs(path_[i][2] - path_[i - 1][2]) * V / 0.25); }
ok(`ENFORCED max ramp slope <= 0.65 (PROVISIONAL cap; measured ${ms.toFixed(3)} from the sampled path, the spike's 0.602 is from the same samples), path ${len.toFixed(1)} tiles (66.0)`, ms <= 0.65 && ms > 0.5 && Math.abs(len - 66.0) < 0.5 && Math.abs(path_[0][2] * V - 10.87) < 0.01 && Math.abs(path_[path_.length - 1][2] * V - 3.38) < 0.05, { ms, len });
// headroom above every standing tile, from the intervals: the first solid above the standing surface
const clearAbove = (i, zTiles) => { const eps = 1e-6, iv = cols[i]; let top = -1; for (const [z0, z1] of iv) if (z1 * V <= zTiles + DZ + eps && z1 * V >= zTiles - eps) top = z1 * V; if (top < 0) return null; const nxt = iv.find(([z0]) => z0 * V >= top - eps); return nxt ? nxt[0] * V - top : Infinity; };
let minClear = Infinity, nStand = 0, shared = 0;
for (const [key, z] of nodes) { const i = +key.split(':')[1], c = clearAbove(i, z); if (c === null) { ok(`standing surface exists under node ${key}`, false); continue; } if (c === 0) { shared++; continue; } nStand++; minClear = Math.min(minClear, c); }
ok(`invariant: every standing tile (${nStand}) has >= HEAD - DZ = ${M.HEAD - DZ} of air above (the slabs are quantized OUTWARD to the DZ grid; measured minimum ${minClear}); ${shared} floor nodes are ramp-shared columns (the ramp slab sits right on them)`, minClear >= M.HEAD - DZ - 1e-9 && shared === 34, { minClear, shared });
// the Python side: the numbers of the spike and the determinism
try {
  cp.execSync('python3 -c "import numpy, scipy"', { stdio: 'ignore' });
  let out = ''; try { out = cp.execSync('python3 ' + JSON.stringify(path.join(__dirname, 'test_macroform.py')), { encoding: 'utf8' }); } catch (e) { out = e.stdout || String(e); }
  const lines = out.split('\n'); for (const l of lines) if (/^(PASS|FAIL|MEASURED|NOTE)/.test(l)) { console.log('  [py] ' + l); if (l.startsWith('PASS')) pass++; if (l.startsWith('FAIL')) fail++; }
} catch (e) { console.log('SKIP the Python reference test (python3 / numpy / scipy not available)'); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
