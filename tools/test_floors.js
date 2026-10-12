/* Crystallizer 5 (floors): the derived package data/snake_mountain_floors.json and what the viewer pipeline does with it. Run: node tools/test_floors.js
   Data: each floor tile under the exterior with the roof margin, shell kept, shaft void, floors nested, the landing of floor 1 (beyond the ramp footprint: the arrival) = walkable floor-2 tiles at the same level, the floor-2
   opening = exactly the declared footprint, both rings connected, derivation reproducible. Pipeline: `elevFrame` absent = origin/main's terraces and shapes, present = the same bands on every layer; the DECLARED link is carved
   by its forced site (its own width x depth) and walkable for terraces 2-12 x pre 0-3, also with stairW 0, a huge minPlateau / minSub and any stairW / rampDepth; a pack without links is identical to origin/main. The table is printed. */
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
const LK = L, FP = L.footprint, LD = L.landing, inRect = (i, r) => { const x = i % N, y = (i / N) | 0; return x >= r.x[0] && x <= r.x[1] && y >= r.y[0] && y <= r.y[1]; };
const z2 = pk.floors[1].z, landing = [...land1].filter((i) => inRect(i, LD) && rr(i) >= A.shaftR), footprint = landing.filter((i) => inRect(i, FP)), arrival = landing.filter((i) => !inRect(i, FP));
ok(`the link is declared with its own width x depth (${L.width} x ${L.depth}) and the footprint has exactly that many tiles (${footprint.length})`, footprint.length === L.width * L.depth && L.width === 3 && L.depth === 2, [L.width, L.depth, footprint.length]);
ok('the landing of floor 1 is FLAT at z2 (no sloped strip) and next to the ring (a cliff of z2 - z1)', landing.length === 22 && landing.every((i) => F1[i] === z2) && F1[L.site.a[1] * N + L.site.a[0]] >= pk.floors[0].z - A.amp && F1[L.site.a[1] * N + L.site.a[0]] <= pk.floors[0].z + A.amp);
ok('the forced pair: a = a ring tile of floor 1 (z1), b = the first landing tile (z2), 4-neighbours', Math.abs(F1[L.site.a[1] * N + L.site.a[0]] - A.z[0]) <= A.amp && F1[L.site.b[1] * N + L.site.b[0]] === z2 && Math.abs(L.site.a[0] - L.site.b[0]) + Math.abs(L.site.a[1] - L.site.b[1]) === 1);
ok('every arrival tile of floor 1 (the landing beyond the footprint) coincides with a walkable floor-2 tile at exactly z2', arrival.length >= 2 * L.width && arrival.every((i) => F2[i] === z2), arrival.length);
{ const opening = footprint.filter((i) => F2[i] === 0).length, other = [...land1].filter((i) => !inRect(i, FP) && rr(i) >= A.shaftR && F2[i] === 0 && ext0[i] >= A.z[1] + A.amp + A.roof && inRect(i, { x: [LD.x[0], LD.x[1]], y: LD.y })).length;
  ok(`floor 2 has the void opening over exactly the footprint (${opening} tiles) and no other void in the landing`, opening === footprint.length && other === 0, [opening, other]); }
{ const ledge = []; for (let x = FP.x[1] + 1; x <= LD.x[1]; x++) { const i = L.site.b[1] * N + x; if (F2[i] > 0 && rr(i) >= A.shaftR) ledge.push(x); }
  ok(`the arrival ledge of floor 2 between the opening and the shaft is ${ledge.length} tiles wide (1-2 wanted) on the axis row`, ledge.length >= 1 && ledge.length <= 2, ledge); }
const tongue = new Set(landing); const ring1 = new Set([...land1].filter((i) => !tongue.has(i)));
ok('floor 1 stays connected around the landing (one component)', comps(ring1).length === 1, comps(ring1).map((c) => c.length));
ok('floor 2 stays connected with the opening (one component, the opening is a hole in the ring)', comps(land2).length === 1, comps(land2).map((c) => c.length));
ok('the head marker H is at the high end of the spiral (22, 16) in this pack; the source pack keeps its own', pk.markers.find((m) => m.code === 'H').x === 22 && pk.markers.find((m) => m.code === 'H').y === 16 && src.markers.find((m) => m.code === 'H').x === 29 && ['W', 'P', 'E'].every((c) => { const a = pk.markers.find((m) => m.code === c), b = src.markers.find((m) => m.code === c); return a.x === b.x && a.y === b.y; }));
ok('the manifest viewer block sets terraces 5 AND minPlateau 5', pk.viewer && pk.viewer.terraces === 5 && pk.viewer.minPlateau === 5);
// derivation reproducible
try {
  cp.execSync('python3 -c "import numpy"', { stdio: 'ignore' }); const file = path.join(D, 'snake_mountain_floors.json'), keep = fs.readFileSync(file);
  try { cp.execSync('python3 ' + JSON.stringify(path.join(__dirname, 'derive_snake_floors.py')), { stdio: 'ignore' }); ok('the derivation reproduces data/snake_mountain_floors.json bit for bit', Buffer.compare(keep, fs.readFileSync(file)) === 0); } finally { fs.writeFileSync(file, keep); }
} catch (e) { console.log('SKIP derivation reproducible (python3 / numpy not available)'); }

// --- pipeline ---
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 3, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
const FOOT = L.site.a[1] * N + L.site.b[0], ARR = L.arrival[1] * N + L.arrival[0], RING = L.foot[1] * N + L.foot[0]; // foot = the ring tile next to the ramp's low end (a), arrival = a tile of floor 1's arrival
const build = (o, k) => { const P = Object.assign({}, BASE, o), fp = E.floorPack(pk, k || 1), S = E.shape(fp, P, null); return { P, S, q: E.quantize(fp, P) }; };
const carved = (S) => S.stairs.find((r) => r.site && r.site.declared);
const walk = (o) => { const { P, S } = build(o), rec = carved(S); return !!rec && S.region[FOOT] >= 0 && S.region[FOOT] === S.region[ARR] && !!E.route(S, P, FOOT, ARR); };
// elevFrame absent / no links = origin/main's terraces AND shapes
try {
  const git = (f) => cp.execSync(`git show origin/main:${f}`, { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); for (const f of ['fields', 'shape']) vm.runInContext(git(`src/${f}.js`), ctx);
  const O = ctx.EVO; let same = true, sameShape = true; const sets = [src, JSON.parse(fs.readFileSync(path.join(D, 'shrine_pier_x4.json'), 'utf8')), E.floorPack({ ...pk, elevFrame: undefined, links: [] }, 1)];
  for (const p of sets) for (const T of [3, 5, 7]) {
    const P = Object.assign({}, BASE, { terraces: T }), a = E.quantize(Object.assign({}, p), P), b = O.quantize(Object.assign({}, p), P);
    if (a.range[0] !== b.range[0] || a.range[1] !== b.range[1] || a.ter.some((v, i) => v !== b.ter[i]) || a.sub.some((v, i) => v !== b.sub[i])) same = false;
    const sa = E.shape(Object.assign({}, p), P, null), sb = O.shape(Object.assign({}, p), P, null);
    if (sa.fine.some((v, i) => v !== sb.fine[i]) || sa.stairs.length !== sb.stairs.length || sa.stairInfo.gates !== sb.stairInfo.gates || sa.carved.some((v, i) => v !== sb.carved[i]) || sa.region.some((v, i) => v !== sb.region[i])) sameShape = false;
  }
  ok('without elevFrame and without links the terraces are identical to origin/main (sources, Shrine-Pier x4 and a floor without the keys)', same);
  ok('without links the SHAPES are identical to origin/main: levels, carved tiles, stairs, gates, regions (3, 5 and 7 terraces)', sameShape);
} catch (e) { console.log('SKIP identical to origin/main (git show origin/main failed)', e.message); }
{ const qs = [0, 1, 2].map((k) => build({}, k).q);
  ok('with elevFrame every layer uses the package frame: the same bands (range) on the exterior and both floors', qs.every((q) => q.range[0] === pk.elevFrame[0] && q.range[1] === pk.elevFrame[1]));
}
// the declared link: carved by its own width x depth, a jump of one to three terraces
{ const { S, q } = build({}), rec = carved(S);
  ok('the declared site is in S.passes / S.gates (declared, exact) and carved: 3 columns, depth 2, cut into the landing', !!rec && S.declared.length === 1 && S.passes.some((p) => p.declared && p.exact) && S.gates.some((g) => g.declared) && rec.cols.length === L.width && rec.ramp.len === L.depth && rec.mode === 'cut', rec && [rec.cols.length, rec.ramp.len, rec.mode]);
  const fp = new Set(footprint); ok('the carved footprint is exactly the declared one (so the floor-2 opening covers it)', !!rec && rec.steps.every((st) => st.tiles.every((t) => fp.has(t))) && rec.steps.reduce((n2, st) => n2 + st.tiles.length, 0) === footprint.length);
  ok('terraces 5: the ring of floor 1 is one terrace below the landing', q.ter[RING] + 1 === q.ter[L.site.b[1] * N + L.site.b[0]]); }
{ let n = 0, bad = []; for (let T = 2; T <= 12; T++) for (let pre = 0; pre <= 3; pre++) { n++; if (!walk({ terraces: T, pre })) bad.push(`T${T}/pre${pre}`); }
  ok(`the declared link is carved and walkable (foot -> arrival) for terraces 2-12 x pre 0-3 (${n} combinations; jumps of 1 to 3 terraces)`, bad.length === 0, bad); }
{ let bad = []; for (const o of [{ stairW: 0 }, { stairW: 1, rampDepth: 1 }, { stairW: 5, rampDepth: 4 }, { minPlateau: 120 }, { minPlateau: 300, minSub: 100 }, { stairW: 0, minPlateau: 120, pre: 3 }, { stairStyle: 0 }]) for (const T of [3, 5, 7, 10]) if (!walk(Object.assign({ terraces: T }, o))) bad.push(JSON.stringify(o) + '/T' + T);
  ok('the link does not depend on stairW (also 0), rampDepth, minPlateau (Balanced types: 120), minSub or the stair style: structure, protected from the cleanup and the smoothing', bad.length === 0, bad); }
{ let n = 0, bad = []; for (let T = 2; T <= 12; T++) for (let sw = 0; sw <= 5; sw++) for (let dp = 1; dp <= 4; dp++) { n++; if (!walk({ terraces: T, stairW: sw, rampDepth: dp })) bad.push(`T${T}/w${sw}/d${dp}`); }
  ok(`the declared link is carved and walkable for terraces 2-12 x stairW 0-5 x rampDepth 1-4 (${n} combinations; natural stairs never take its tiles)`, bad.length === 0, bad.slice(0, 8)); }
ok('stairW 0 builds ONLY the declared link: no natural stair is carved', (() => { const { S } = build({ stairW: 0 }); return S.stairs.length === 1 && !!carved(S); })());
{ const { S } = build({}); ok('the Floors warning is empty when the link is carved', E.floorWarnings(pk, S).length === 0);
  const bad = JSON.parse(JSON.stringify(pk)); bad.links[0].site = { a: [2, 2], b: [3, 2] }; const S2 = E.shape(E.floorPack(bad, 1), BASE, null); ok('and it warns when a declared link was not built (the pair lies in void)', E.floorWarnings(bad, S2).length === 1, E.floorWarnings(bad, S2)); }
ok('the protect mask is the landing, the footprint and the ring foot tiles; none without links', (() => { const m = E.linkProtect(E.floorPack(pk, 1)); const cnt = m.reduce((a2, v) => a2 + v, 0); return m[FOOT] === 1 && footprint.every((i) => m[i]) && cnt >= landing.length && cnt <= landing.length + 12 && E.floorPack(pk, 2).links.length === 0; })());
console.log('\nMEASURED table: terraces x pre (stairW 3, rampDepth 2, minPlateau 5): link walkable / terrace jump / columns x depth / mode; ring = floor 1 ring reaches the foot');
for (let T = 2; T <= 12; T++) { let line = `  T${String(T).padStart(2)}`; for (let pre = 0; pre <= 3; pre++) { const { P, S, q } = build({ terraces: T, pre }), rec = carved(S), ok2 = !!rec && S.region[FOOT] >= 0 && S.region[FOOT] === S.region[ARR], ring = S.region[RING] >= 0 && S.region[RING] === S.region[FOOT]; line += ` | pre${pre} ${ok2 ? 'yes' : 'NO'} j${q.ter[L.site.b[1] * N + L.site.b[0]] - q.ter[L.site.a[1] * N + L.site.a[0]]} ${rec ? rec.cols.length + 'x' + rec.ramp.len + rec.mode[0] : '-'}${ring ? '' : ' ring cut'}`; void P; } console.log(line); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
