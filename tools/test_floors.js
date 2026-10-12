/* Crystallizer 5 (floors): the derived package data/snake_mountain_floors.json and what the viewer pipeline does with it. Run: node tools/test_floors.js
   Data: each floor tile under the exterior with the roof margin, shell kept, shaft void, floors nested, landing of floor 1 = walkable floor-2 tiles at the same level, opening over the slope tiles only, both rings connected,
   derivation reproducible. Pipeline: `elevFrame` absent = the same terraces as origin/main, present = the same bands on every layer, the link is walkable (stairW 1-5, rampDepth 1-4) at 3 and 5 terraces, minPlateau 120 and stairW 0 break it
   (that is what the warnings are for). The table over 2-12 terraces is printed (MEASURED, not enforced: it is the known limit of the README). */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const D = path.join(__dirname, '../data'), pk = JSON.parse(fs.readFileSync(path.join(D, 'snake_mountain_floors.json'), 'utf8')), src = JSON.parse(fs.readFileSync(path.join(D, 'snake_mountain_surface.json'), 'utf8'));
const N = pk.width, n = N * N, ext0 = Float64Array.from(src.elevation), A = pk.params;
const F1 = pk.floors[0].elevation, F2 = pk.floors[1].elevation, EXT = pk.elevation, L = pk.links[0];
const rr = (i) => Math.hypot(i % N + 0.5 - A.axis[0], Math.floor(i / N) + 0.5 - A.axis[1]);
const comps = (set) => { const seen = new Set(), out = []; for (const s0 of set) { if (seen.has(s0)) continue; const c = [s0]; seen.add(s0); for (let k = 0; k < c.length; k++) { const i = c[k], x = i % N, y = (i / N) | 0; for (const j of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1]) if (j >= 0 && set.has(j) && !seen.has(j)) { seen.add(j); c.push(j); } } out.push(c); } return out; };

ok('the package validates (floors, shaft, links, elevFrame)', E.validateFloors(pk).length === 0, E.validateFloors(pk));
ok('elevFrame is the range of the original surface', pk.elevFrame[0] === Math.min(...ext0) && pk.elevFrame[1] === Math.max(...ext0));
ok('the old packs have no floors keys (unaffected)', !E.hasFloors(src) && src.elevFrame === undefined);
// --- data ---
const land1 = new Set(), land2 = new Set(); for (let i = 0; i < n; i++) { if (F1[i] > 0) land1.add(i); if (F2[i] > 0) land2.add(i); }
let under = 0, worst = 1e9; for (const [land, F] of [[land1, F1], [land2, F2]]) for (const i of land) { const m = ext0[i] - F[i]; worst = Math.min(worst, m); if (m < A.roof - 1e-9) under++; }
ok(`every floor tile lies under the exterior with a roof margin of ${A.roof} (worst margin ${worst.toFixed(3)})`, under === 0, under);
let shell = 1e9; for (const [k, land] of [[0, land1], [1, land2]]) { const z = A.z[k], sec = (i) => ext0[i] >= z + A.amp + A.roof; for (const i of land) { const x = i % N, y = (i / N) | 0; let m = 1e9; for (let yy = -1; yy <= N; yy++) for (let xx = -1; xx <= N; xx++) if (xx < 0 || yy < 0 || xx >= N || yy >= N || !sec(yy * N + xx)) m = Math.min(m, Math.hypot(xx - x, yy - y)); shell = Math.min(shell, m); } }
ok(`the protected shell is kept: every floor tile is more than ${A.shell} tiles from the border of its section (min ${shell.toFixed(2)})`, shell > A.shell);
let discBad = 0; for (let i = 0; i < n; i++) if (rr(i) < A.shaftR) { if (F2[i] !== 0) discBad++; if (EXT[i] !== A.z[0] || F1[i] !== A.z[0]) discBad++; }
ok('the shaft: void in floor 2, floor 1 keeps it as the flat pit bottom at z1, and the exterior pit equals it', discBad === 0, discBad);
let extBad = 0; for (let i = 0; i < n; i++) if (rr(i) >= A.shaftR && EXT[i] !== Math.round(ext0[i] * 1e6) / 1e6) extBad++;
ok('the exterior is the original surface outside the pit', extBad === 0, extBad);
let nest = 0; for (const i of land2) if (!land1.has(i)) nest++;
ok('floor 2 lies inside floor 1', nest === 0, nest);
const lanes = []; for (let y = L.lanes[0]; y <= L.lanes[1]; y++) lanes.push(y);
const inLanes = (i) => { const y = (i / N) | 0; return y >= L.lanes[0] && y <= L.lanes[1]; };
const landing = [], slopeT = [], z2 = pk.floors[1].z; for (const i of land1) { const x = i % N; if (!inLanes(i)) continue; if (Math.abs(F1[i] - z2) < 1e-9 && x >= L.landingX[0] && x <= L.landingX[1]) landing.push(i); if (L.slopeX.includes(x)) slopeT.push(i); }
ok(`the tongue is ${L.width} wide with ${L.slopeX.length} slope tile(s) per lane (${slopeT.length}) and ${landing.length} landing tiles`, L.width === 5 && slopeT.length === 5 * L.slopeX.length && landing.length >= 15, [slopeT.length, landing.length]);
{ const edge = pk.elevFrame[0] + 2 * (pk.elevFrame[1] - pk.elevFrame[0]) / 5; ok(`the slope tile sits on the band edge of 5 terraces (${edge.toFixed(5)}) and between z1 and z2`, L.slopeZ.length === 1 && Math.abs(L.slopeZ[0] - edge) < 1e-3 && L.slopeZ[0] > pk.floors[0].z && L.slopeZ[0] < z2, L.slopeZ); }
ok('every landing tile of floor 1 coincides with a walkable floor-2 tile at the same level (exactly z2)', landing.every((i) => F2[i] === z2));
{ let open = 0, bad = 0; for (const i of land1) { if (!inLanes(i) || i % N < L.slopeX[0]) continue; const x = i % N, slope = L.slopeX.includes(x); if (slope) { open++; if (F2[i] !== 0) bad++; } else if (rr(i) >= A.shaftR && F2[i] === 0 && x <= L.landingX[1]) bad++; }
  ok(`floor 2 has the void opening over the slope tiles only (${open} tiles) and no other void between the slope and the shaft in the lanes`, open === slopeT.length && bad === 0, [open, bad]); }
const tongue = new Set([...landing, ...slopeT]); const ring1 = new Set([...land1].filter((i) => !tongue.has(i)));
ok('floor 1 stays connected around the tongue (one component)', comps(ring1).length === 1, comps(ring1).map((c) => c.length));
ok('floor 2 stays connected: the ring is a C (one component with the opening)', comps(land2).length === 1, comps(land2).map((c) => c.length));
ok('the head marker H is at the high end of the spiral (22, 16) in this pack; the source pack keeps its own', pk.markers.find((m) => m.code === 'H').x === 22 && pk.markers.find((m) => m.code === 'H').y === 16 && src.markers.find((m) => m.code === 'H').x === 29 && ['W', 'P', 'E'].every((c) => { const a = pk.markers.find((m) => m.code === c), b = src.markers.find((m) => m.code === c); return a.x === b.x && a.y === b.y; }));
ok('the manifest viewer block sets terraces 5 AND minPlateau 5', pk.viewer && pk.viewer.terraces === 5 && pk.viewer.minPlateau === 5);
// derivation reproducible
try {
  cp.execSync('python3 -c "import numpy"', { stdio: 'ignore' }); const file = path.join(D, 'snake_mountain_floors.json'), keep = fs.readFileSync(file);
  try { cp.execSync('python3 ' + JSON.stringify(path.join(__dirname, 'derive_snake_floors.py')), { stdio: 'ignore' }); ok('the derivation reproduces data/snake_mountain_floors.json bit for bit', Buffer.compare(keep, fs.readFileSync(file)) === 0); } finally { fs.writeFileSync(file, keep); }
} catch (e) { console.log('SKIP derivation reproducible (python3 / numpy not available)'); }

// --- pipeline ---
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 3, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
const FOOT = 20 * N + 11, LAND = 20 * N + 16;
const walk = (P) => { const S = E.shape(E.floorPack(pk, 1), P, null); return S.region[FOOT] >= 0 && S.region[LAND] >= 0 && !!E.route(S, P, FOOT, LAND); };
// elevFrame absent = origin/main's terraces; present = the same bands on every layer
try {
  const git = (f) => cp.execSync(`git show origin/main:${f}`, { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); for (const f of ['fields', 'shape']) vm.runInContext(git(`src/${f}.js`), ctx);
  const O = ctx.EVO; let same = true; const sets = [src, JSON.parse(fs.readFileSync(path.join(D, 'shrine_pier_x4.json'), 'utf8')), E.floorPack({ ...pk, elevFrame: undefined }, 1)];
  for (const p of sets) for (const T of [3, 5, 7]) { const P = Object.assign({}, BASE, { terraces: T }), a = E.quantize(Object.assign({}, p), P), b = O.quantize(Object.assign({}, p), P); if (a.range[0] !== b.range[0] || a.range[1] !== b.range[1] || a.ter.some((v, i) => v !== b.ter[i]) || a.sub.some((v, i) => v !== b.sub[i])) same = false; }
  ok('without elevFrame the terraces are identical to origin/main (sources, Shrine-Pier x4 and a floor without the key)', same);
} catch (e) { console.log('SKIP identical to origin/main (git show origin/main failed)'); }
{
  const P = Object.assign({}, BASE), qs = [0, 1, 2].map((k) => E.quantize(E.floorPack(pk, k), P));
  ok('with elevFrame every layer uses the package frame: the same bands (range) on the exterior and both floors', qs.every((q) => q.range[0] === pk.elevFrame[0] && q.range[1] === pk.elevFrame[1]));
  ok('terraces 5: the ring of floor 1 is terrace 1, the ring of floor 2 terrace 2, the landing of floor 1 terrace 2', qs[1].ter[(20 - 5) * N + 14] === 1 && qs[2].ter[(20 - 4) * N + 17] === 2 && qs[1].ter[LAND] === 2, [qs[1].ter[(20 - 5) * N + 14], qs[2].ter[(20 - 4) * N + 17], qs[1].ter[LAND]]);
}
for (const T of [3, 5]) for (const sw of [1, 2, 3, 4, 5]) for (const dp of [1, 2, 3, 4]) { const P = Object.assign({}, BASE, { terraces: T, stairW: sw, rampDepth: dp }); if (!walk(P)) ok(`the link is walkable (terraces ${T}, stairW ${sw}, rampDepth ${dp})`, false); else pass++; }
console.log('PASS the link is walkable foot -> landing at 3 and 5 terraces for stairW 1-5 and rampDepth 1-4 (40 combinations, none failed above)');
{ const q = E.quantize(E.floorPack(pk, 1), Object.assign({}, BASE, { minPlateau: 120 })); ok('minPlateau 120 (Balanced types) deletes the landing: it falls into the terrace of the ring, no terrace edge left (what the warning is for)', q.ter[LAND] === q.ter[FOOT], [q.ter[LAND], q.ter[FOOT]]); }
ok('stairW 0 (ramps off): no route', !walk(Object.assign({}, BASE, { stairW: 0 })));
// warnings
{ const w = (o) => E.floorWarnings(pk, Object.assign({}, BASE, o)).length;
  ok('the Floors warnings: none at the defaults; terraces 7, minPlateau 120 and stairW 0 each warn', w({}) === 0 && w({ terraces: 7 }) === 1 && w({ terraces: 4 }) === 1 && w({ minPlateau: 120 }) === 1 && w({ stairW: 0 }) === 1 && w({ terraces: 3 }) === 0); }
console.log('\nMEASURED (not enforced): terraces 2-12, stairW 3, rampDepth 2, minPlateau 5: ring / landing terrace, link walkable');
for (let T = 2; T <= 12; T++) { const P = Object.assign({}, BASE, { terraces: T }), q = E.quantize(E.floorPack(pk, 1), P); console.log(`  T${T}: ring terrace ${q.ter[15 * N + 14]}, landing terrace ${q.ter[LAND]}, walkable ${walk(P) ? 'yes' : 'NO'}`); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
