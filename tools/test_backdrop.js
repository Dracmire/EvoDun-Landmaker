/* Crystallizer 5, Option 2 phase 1 (src/backdrop.js, docs/crystallizers/05-floors/option2-backdrop.md): the floor backdrop. Run: node tools/test_backdrop.js
   Checks: (a) the FLOOR is identical tile by tile with the backdrop (height of each tile, terrace, sub-terrace, walkable, region, ramps, block) for floor 1 and floor 2, terraces 2-12;
   (b) HARD RULE, analytic and independent of the plan: every added tile lies strictly behind the back edge of the floor along the camera axis, written only on tiles that were void, never walkable;
   (c) the plain is above the thin slab base and the band is the REAL exterior height (snapped down to the level grid, never higher); (d) the Exterior layer gets nothing; (e) deterministic; (f) the plan is pure and obeys its window. */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'pocket', 'tech', 'floors', 'backdrop']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const pk = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/snake_mountain_floors.json'), 'utf8')), N = pk.width, n = N * N;
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, stairW: 3, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3 };
const mk = (P, k, bd) => { const S = E.shape(E.floorPack(pk, k), P, null); E.floors.prepare(S, pk, P, k); const snap = bd ? null : undefined; const out = { S }; if (bd) out.bd = E.backdrop.apply(S, P, pk, k); return out; };
const snapshot = (S) => ({ h: Float64Array.from({ length: n }, (_, i) => (S.void && S.void[i] ? NaN : S.levelH[S.fine[i]])), ter: Array.from(S.ter), sub: Array.from(S.sub), block: Array.from(S.block), region: Array.from(S.region), stairs: JSON.stringify((S.stairs || []).map((r) => ({ b: r.bottom, t: r.top, c: r.cols && r.cols.length })) ), carved: Array.from(S.carved) });
const sameFloor = (a, b, S0) => { for (let i = 0; i < n; i++) { if (S0.void[i]) continue; if (a.h[i] !== b.h[i] || a.ter[i] !== b.ter[i] || a.sub[i] !== b.sub[i] || a.block[i] !== b.block[i] || a.region[i] !== b.region[i] || a.carved[i] !== b.carved[i]) return i; } return a.stairs === b.stairs ? -1 : -2; };
const rows = [];
for (const T of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) for (const k of [1, 2]) {
  const P = Object.assign({}, BASE, { terraces: T }), a = mk(P, k, false), S0v = Uint8Array.from(a.S.void), A = snapshot(a.S), P2 = Object.assign({}, P, { backdrop: true, backdropMode: 'real' }), b = mk(P2, k, true), Bs = snapshot(b.S);
  const bad = sameFloor(A, Bs, { void: S0v }), plan = b.bd, added = plan.info.plain + plan.info.band;
  // hard rule, recomputed independently from the shape: s = tile centre . u (u toward the camera), sBack = min s over the floor's own tiles
  const u = [Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)]; let sBack = 1e9; for (let i = 0; i < n; i++) if (!S0v[i]) sBack = Math.min(sBack, ((i % N) + 0.5) * u[0] + (((i / N) | 0) + 0.5) * u[1]);
  let hr = 0, wroteOnFloor = 0, walk = 0, below = 0, notReal = 0, plainBad = 0;
  const ext = E.floors.shapeOf(b.S, pk, P2, 0), base = a.S.baseH !== undefined ? a.S.baseH : a.S.levelH[0] - P.terH;
  for (let i = 0; i < n; i++) if (plan.role[i] === 2) {
    const s = ((i % N) + 0.5) * u[0] + (((i / N) | 0) + 0.5) * u[1]; if (!(s < sBack - 1e-9)) hr++;
    if (!S0v[i]) wroteOnFloor++; if (b.S.void[i] || !b.S.block[i]) walk++;
    const h = b.S.levelH[b.S.fine[i]]; if (plan.part[i] === 1) { if (h < base + 0.1 * P.terH - 1e-9 || h > base + 0.1 * P.terH + 0.01) plainBad++; if (h < base) below++; } else { const e = ext.levelH[ext.fine[i]]; if (h > e + 1e-6) notReal++; }
  }
  const touched = (() => { let c = 0; for (let i = 0; i < n; i++) if (plan.role[i] !== 2 && (b.S.void[i] ? 1 : 0) !== S0v[i]) c++; return c; })();
  rows.push({ T, k, added, plain: plan.info.plain, band: plan.info.band, dropped: plan.info.dropped, lv: plan.info.levelsAdded, maxDepth: plan.info.maxDepth });
  ok(`terraces ${T}, floor ${k}: the floor is identical tile by tile (height, terrace, sub-terrace, block, region, carved, ramps)${bad === -1 ? '' : ' [' + bad + ']'}`, bad === -1, bad);
  ok(`terraces ${T}, floor ${k}: HARD RULE: ${added} added tiles, all strictly behind the back edge of the floor; none written on a floor tile; none walkable; the void changes only where tiles were added`, added > 0 && hr === 0 && wroteOnFloor === 0 && walk === 0 && touched === 0, { added, hr, wroteOnFloor, walk, touched });
  ok(`terraces ${T}, floor ${k}: the plain sits on the slab base (never under it) and the band is never higher than the real exterior`, plainBad === 0 && below === 0 && notReal === 0, { plainBad, below, notReal });
}
// DIAGNOSTIC mirror mode (P.backdropMirror): the band takes the real exterior height at the tile reflected through the back edge; the floor is still identical, the hard rule still holds, and the band is not empty
for (const k of [1, 2]) { const P = Object.assign({}, BASE), a = mk(P, k, false), S0v = Uint8Array.from(a.S.void), A = snapshot(a.S), b = mk(Object.assign({}, P, { backdrop: true, backdropMode: 'mirror' }), k, true), Bs = snapshot(b.S), plan = b.bd;
  const u = [Math.SQRT1_2, Math.SQRT1_2]; let sBack = 1e9; for (let i = 0; i < n; i++) if (!S0v[i]) sBack = Math.min(sBack, ((i % N) + 0.5) * u[0] + (((i / N) | 0) + 0.5) * u[1]);
  let hr = 0, low = 0; for (let i = 0; i < n; i++) if (plan.role[i] === 2) { const s = ((i % N) + 0.5) * u[0] + (((i / N) | 0) + 0.5) * u[1]; if (!(s < sBack - 1e-9)) hr++; if (plan.part[i] === 2 && b.S.levelH[b.S.fine[i]] < a.S.baseH + 0.1 * P.terH + 0.5 - 1e-6) low++; }
  ok(`mirror mode, floor ${k}: the floor is identical tile by tile, the hard rule holds, the band is not empty (${plan.info.band} tiles) and no band tile is under plain + 0.5 terH`, sameFloor(A, Bs, { void: S0v }) === -1 && hr === 0 && plan.info.band > 0 && low === 0, { hr, band: plan.info.band, low });
  ok(`LEVELS BUDGET (5 terraces x 3 sub-terraces): at most 12 levels added in mirror mode (measured ${plan.info.levelsAdded}; the Pocket adds 12-19) and at most 3 with the real heights`, plan.info.levelsAdded <= 12 && mk(Object.assign({}, P, { backdrop: true, backdropMode: 'real' }), k, true).bd.info.levelsAdded <= 3, plan.info.levelsAdded); }
// the Exterior layer gets nothing; another call does not apply twice; no backdrop without the switch
{ const P = Object.assign({}, BASE, { backdrop: true, backdropMode: 'real' }), S = E.shape(E.floorPack(pk, 0), P, null); E.floors.prepare(S, pk, P, 0); ok('the Exterior layer (k = 0) gets no backdrop', E.backdrop.apply(S, P, pk, 0) === null && !S.backdrop); }
{ const P = Object.assign({}, BASE, { backdropMode: 'real' }), S = E.shape(E.floorPack(pk, 1), P, null); E.floors.prepare(S, pk, P, 1); const r1 = E.backdrop.apply(S, P, pk, 1), lv = S.levelH.length, r2 = E.backdrop.apply(S, P, pk, 1); ok('applying twice does nothing the second time', r1 && r2 === null && S.levelH.length === lv); }
// deterministic
{ const P = Object.assign({}, BASE, { backdrop: true, backdropMode: 'real' }), a = mk(P, 1, true), b = mk(P, 1, true); ok('deterministic: the same plan and the same levels twice', Buffer.compare(Buffer.from(a.bd.role), Buffer.from(b.bd.role)) === 0 && JSON.stringify(a.S.levelH) === JSON.stringify(b.S.levelH)); }
// the pure plan
{ const W = 30, H = 30, frag = new Uint8Array(W * H), ext = new Float32Array(W * H).fill(9); for (let y = 15; y < 22; y++) for (let x = 15; x < 22; x++) frag[y * W + x] = 1; const pl = E.backdrop.plan(W, H, frag, ext, { gap: 4, depth: 6, jump: 1, plainH: 2 });
  ok('plan: floor tiles stay role 1 and get no height; plain tiles have the plain height; band tiles the exterior height', (() => { for (let i = 0; i < W * H; i++) { if (frag[i] && (pl.role[i] !== 1 || !Number.isNaN(pl.height[i]))) return false; if (pl.part[i] === 1 && pl.height[i] !== 2) return false; if (pl.part[i] === 2 && pl.height[i] !== 9) return false; } return true; })());
  const e2 = Float32Array.from(ext); for (let i = 0; i < W * H; i += 3) e2[i] = NaN; const p2 = E.backdrop.plan(W, H, frag, e2, { gap: 4, depth: 6, jump: 1, plainH: 2 });
  ok('plan: tiles without exterior data (NaN) are never written', (() => { for (let i = 0; i < W * H; i++) if (!(e2[i] === e2[i]) && p2.role[i] === 2) return false; return true; })());
  const low = new Float32Array(W * H).fill(2.2), p3 = E.backdrop.plan(W, H, frag, low, { gap: 4, depth: 6, jump: 1, plainH: 2 });
  ok('plan: an exterior lower than plain + 0.5 terH is not a mountain section: no band (the plain remains), counted as dropped', p3.info.band === 0 && p3.info.dropped > 0 && p3.info.plain > 0);
  const g = (gap) => E.backdrop.plan(W, H, frag, ext, { gap, depth: 6, jump: 1, plainH: 2 }); ok('plan: the gap parameter moves the foot of the band: gap 2 starts it 2 tiles from the floor, gap 8 starts it 8 (plain tiles = gap x width of the window)', g(2).info.plain < g(4).info.plain && g(4).info.plain < g(8).info.plain);
  ok('plan: an empty floor gives an empty plan', E.backdrop.plan(W, H, new Uint8Array(W * H), ext, { jump: 1, plainH: 2 }).info.plain === 0); }
// ---- PHASE 1b: the ATTACHED backdrop (cavity wall): apron + wall, variants v1 / v2 / v3, multipliers 1-3
const enclosedOf = (voidArr) => { const out = new Uint8Array(n), q = []; for (let i = 0; i < n; i++) { const x = i % N, y = (i / N) | 0; if (voidArr[i] && (x === 0 || y === 0 || x === N - 1 || y === N - 1)) { out[i] = 1; q.push(i); } } for (let k = 0; k < q.length; k++) { const i = q[k], x = i % N, y = (i / N) | 0; for (const j of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1]) if (j >= 0 && voidArr[j] && !out[j]) { out[j] = 1; q.push(j); } } const enc = new Uint8Array(n); for (let i = 0; i < n; i++) if (voidArr[i] && !out[i]) enc[i] = 1; return enc; };
const attRows = [];
for (const T of [2, 5, 8, 12]) for (const k of [1, 2]) for (const [variant, mult] of [['v1', 1], ['v1', 2], ['v1', 3], ['v2', 2], ['v3', 2]]) {
  const P = Object.assign({}, BASE, { terraces: T }), a = mk(P, k, false), S0v = Uint8Array.from(a.S.void), A = snapshot(a.S), enc = enclosedOf(S0v), b = mk(Object.assign({}, P, { backdrop: true, backdropMode: variant, backdropHeight: mult }), k, true), Bs = snapshot(b.S), pl = b.bd, I = pl.info;
  const u = [Math.SQRT1_2, Math.SQRT1_2], tag = `terraces ${T}, floor ${k}, ${variant} x${mult}`;
  let wroteEnc = 0, wroteFloor = 0, walk = 0, hide = 0, voidChanged = 0, nEnc = 0; const fl = []; for (let i = 0; i < n; i++) { if (enc[i]) nEnc++; if (!S0v[i]) fl.push(i); }
  for (let i = 0; i < n; i++) { if (pl.role[i] === 2) { if (enc[i]) wroteEnc++; if (!S0v[i]) wroteFloor++; if (b.S.void[i] || !b.S.block[i]) walk++; const sT = ((i % N) + 0.5) * u[0] + (((i / N) | 0) + 0.5) * u[1], lT = -((i % N) + 0.5) * u[1] + (((i / N) | 0) + 0.5) * u[0]; for (const f of fl) { const sF = ((f % N) + 0.5) * u[0] + (((f / N) | 0) + 0.5) * u[1], lF = -((f % N) + 0.5) * u[1] + (((f / N) | 0) + 0.5) * u[0]; if (sF < sT - 1e-9 && Math.abs(lF - lT) < 0.8) { hide++; break; } } } if (pl.role[i] !== 2 && (b.S.void[i] ? 1 : 0) !== S0v[i]) voidChanged++; }
  const bad = sameFloor(A, Bs, { void: S0v });
  ok(`${tag}: the floor is identical tile by tile`, bad === -1, bad);
  ok(`${tag}: ENCLOSED void (${nEnc} tiles: the shaft, the opening, inner holes) is never written; nothing is written on a floor tile; none walkable; the void changes only where tiles were added`, wroteEnc === 0 && wroteFloor === 0 && walk === 0 && voidChanged === 0 && (k === 2 ? nEnc > 0 : true), { wroteEnc, wroteFloor, walk, voidChanged, nEnc });
  ok(`${tag}: HARD RULE (analytic): ${I.apron + I.wall} added tiles, none has a floor tile behind it within 0.8 tile laterally (nothing it could hide)`, I.apron + I.wall > 0 && hide === 0, { hide });
  ok(`${tag}: ${variant === 'v2' ? 'no apron (gap 0)' : I.apron + ' apron tiles'}, ${I.wall} wall tiles; at the minimum rise: ${I.minRiseTiles}; max rise ${I.maxRise.toFixed(2)}; levels added ${I.levelsAdded}`, variant === 'v2' ? I.apron === 0 && I.wall > 0 : I.apron > 0 && I.wall > 0);
  attRows.push({ T, k, variant, mult, apron: I.apron, wall: I.wall, minR: I.minRiseTiles, maxRise: I.maxRise, maxH: I.maxHeight, lv: I.levelsAdded });
}
{ // the multiplier multiplies ONLY the rise above the apron, never the floor: rise(x2) = 2 x rise(x1) in the plan, the floor heights are identical
  const P = Object.assign({}, BASE, { backdrop: true, backdropMode: 'v1' }), r = (m) => mk(Object.assign({}, P, { backdropHeight: m }), 1, true).bd.info, r1 = r(1), r2 = r(2), r3 = r(3);
  ok('the multiplier scales the rise above the apron (x2 = 2 x, x3 = 3 x) and nothing else (same apron and wall tiles)', Math.abs(r2.maxRise - 2 * r1.maxRise) < 1e-5 && Math.abs(r3.maxRise - 3 * r1.maxRise) < 1e-5 && r1.apron === r3.apron && r1.wall === r3.wall, [r1.maxRise, r2.maxRise, r3.maxRise]);
  ok('the minimum rise is one character (2 tiles x terH): at x1 no wall tile rises less than it', r1.maxRise >= 2 - 1e-9 && r1.minRise === 2 && r1.minRiseTiles <= r1.wall, r1);
}
{ // pure plan: an enclosed hole is untouched even with floor tiles in front of it; a tile with floor behind it is not written; the apron takes the height of the back-edge tile
  const W = 30, H = 30, frag = new Uint8Array(W * H), fh = new Float32Array(W * H).fill(NaN), ext = new Float32Array(W * H).fill(9); for (let y = 12; y < 24; y++) for (let x = 10; x < 24; x++) { frag[y * W + x] = 1; fh[y * W + x] = 2 + (x > 16 ? 1 : 0); } for (let y = 16; y < 19; y++) for (let x = 14; x < 17; x++) { frag[y * W + x] = 0; fh[y * W + x] = NaN; }
  const pl = E.backdrop.planAttached(W, H, frag, fh, ext, { variant: 'v1', gap: 3, attDepth: 8, jump: 1, sub: 0.22, mult: 1 });
  ok('plan (attached): the enclosed hole (9 tiles) is never written, though floor tiles lie in front of it', pl.info.enclosed === 9 && (() => { for (let y = 16; y < 19; y++) for (let x = 14; x < 17; x++) if (pl.role[y * W + x] !== 0) return false; return true; })(), pl.info.enclosed);
  ok('plan (attached): the apron has the height of a back-edge tile of the floor (2 or 3 here, never anything else), the wall rises at least the minimum (2) above its apron height', (() => { let a = 0, w = 0; for (let i = 0; i < W * H; i++) { if (pl.part[i] === 1) { a++; if (pl.height[i] !== 2 && pl.height[i] !== 3) return false; } if (pl.part[i] === 2) { w++; if (pl.height[i] < 2 + 2 - 1e-6) return false; } } return a > 0 && w > 0; })());
  const v3 = E.backdrop.planAttached(W, H, frag, fh, ext, { variant: 'v3', gap: 3, attDepth: 8, jump: 1, sub: 0.22, mult: 1 }), v2 = E.backdrop.planAttached(W, H, frag, fh, ext, { variant: 'v2', gap: 3, attDepth: 8, jump: 1, sub: 0.22, mult: 1 });
  ok('plan (attached): the v3 apron is half a sub-terrace (0.11) below the back-edge height; v2 has no apron and its wall starts at the contour (gap 0)', (() => { for (let i = 0; i < W * H; i++) if (v3.part[i] === 1) { if (Math.abs(v3.height[i] - 1.89) > 1e-5 && Math.abs(v3.height[i] - 2.89) > 1e-5) return false; } return v3.info.apron > 0 && v2.info.apron === 0 && v2.info.wall > 0 && v2.info.gap === 0; })());
}
ok(`LEVELS BUDGET of the attached variants (heights x1-x3): at most 8 levels added at 5 terraces x 3 sub-terraces (measured max ${Math.max(...attRows.filter((r) => r.T === 5).map((r) => r.lv))}) and at most 20 at 12 terraces (measured max ${Math.max(...attRows.filter((r) => r.T === 12).map((r) => r.lv))}); the Pocket adds 12-19 on the 256 x 256 map`, attRows.filter((r) => r.T === 5).every((r) => r.lv <= 8) && attRows.filter((r) => r.T === 12).every((r) => r.lv <= 20));
console.log('\nattached variants: terraces floor variant mult  apron wall at-minimum maxRise maxHeight levelsAdded'); for (const r of attRows) console.log(`  ${String(r.T).padStart(2)} ${r.k} ${r.variant} x${r.mult} ${String(r.apron).padStart(4)} ${String(r.wall).padStart(4)} ${String(r.minR).padStart(4)} ${r.maxRise.toFixed(2).padStart(6)} ${r.maxH.toFixed(2).padStart(6)} ${String(r.lv).padStart(3)}`);
console.log('\nterraces floor added (plain + band, dropped) levels added, band depth reached');
for (const r of rows) console.log(`  ${String(r.T).padStart(2)} ${r.k} ${String(r.added).padStart(4)} (${r.plain} + ${r.band}, ${r.dropped}) ${String(r.lv).padStart(3)} ${r.maxDepth.toFixed(1)}`);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
