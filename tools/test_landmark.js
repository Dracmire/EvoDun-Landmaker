/* STAGE LANDMARK, PR S4c (src/objects.js `landmarkH`, `baseAlpha`; src/fields.js `checkLandmark`; no browser): the pure rules.
   - h(d) = hFar + (hNear - hFar) * smoothstep(t): 8 -> 1.5, 6 -> 1.89, 4 -> 2.61, 2 -> 3.0 (the values of the decision), hFar for d >= dFar, hNear for d <= dNear, monotone, continuous (<= 0.1 H per 0.25 H step);
   - the base detail alpha: 0 at d >= 2 * dNear, 1 at d <= 1.5 * dNear, smoothstep between (absent 5 H, partial 3.5 H, full <= 3 H);
   - the entry validation (hFar <= hNear, dNear < dFar, numbers > 0) and the inert manifest key viewer.stage.billboards.
   The draw-time mutations (noDistance, hardStep, detailAlways, detailNever, tilesNotH) are checked in tools/ui/test_stage_landmark_ui.js.
     node tools/test_landmark.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'objects']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const O = E.objects, near = (a, b, e) => Math.abs(a - b) <= (e || 0.006);
ok('defaults are the hypotheses of v80: hFar 1.5, hNear 3, dFar 8, dNear 2', JSON.stringify(O.LANDMARK) === JSON.stringify({ hFar: 1.5, hNear: 3, dFar: 8, dNear: 2 }), O.LANDMARK);
const want = { 8: 1.5, 6: 1.89, 4: 2.61, 2: 3.0 };
for (const [d, h] of Object.entries(want)) ok(`landmarkH(${d}) = ${h}`, near(O.landmarkH(+d), h), O.landmarkH(+d));
ok('plateaus: hFar for d >= dFar (8, 10, 50) and hNear for d <= dNear (2, 1, 0)', [8, 10, 50].every((d) => O.landmarkH(d) === 1.5) && [2, 1, 0].every((d) => O.landmarkH(d) === 3));
{ let mono = true, step = 0, prev = O.landmarkH(10); for (let d = 9.75; d >= 1 - 1e-9; d -= 0.25) { const h = O.landmarkH(d); if (h < prev - 1e-12) mono = false; step = Math.max(step, Math.abs(h - prev)); prev = h; }
  ok(`sweep d = 10 -> 1 H in 0.25 H steps: h never drops when approaching, the largest step is ${step.toFixed(4)} H (<= 0.1)`, mono && step <= 0.1, step); }
{ const p = { hFar: 1, hNear: 4, dFar: 10, dNear: 3 }, mid = O.landmarkH(6.5, p); ok('own parameters travel in the entry: the middle of (10, 3) gives the middle height', near(mid, 2.5, 1e-9) && O.landmarkH(10, p) === 1 && O.landmarkH(3, p) === 4, mid);
  const q = O.landmarkParams({ kind: 'landmark', hNear: 5 }); ok('an absent parameter takes the default, a given one is kept', q.hNear === 5 && q.hFar === 1.5 && q.dFar === 8 && q.dNear === 2, q); }
ok('base detail: absent at 5 H, partial at 3.5 H (0.5), full at 3 H and nearer', O.baseAlpha(5) === 0 && near(O.baseAlpha(3.5), 0.5, 1e-9) && O.baseAlpha(3) === 1 && O.baseAlpha(2) === 1 && O.baseAlpha(0.5) === 1 && O.baseAlpha(4) === 0, [O.baseAlpha(5), O.baseAlpha(3.5), O.baseAlpha(3)]);
{ let mono = true, prev = 0; for (let d = 4.5; d >= 1; d -= 0.05) { const a = O.baseAlpha(d); if (a < prev - 1e-12) mono = false; prev = a; } ok('the base alpha only grows when approaching', mono); }
ok('the detail table is one table of hypotheses: 2 lamps of 1.2 H at +-1 tile and a 0.6 H sign in front', O.DETAIL.pieces.length === 3 && O.DETAIL.pieces.filter((q) => q.kind === 'lamp' && q.hH === 1.2 && Math.abs(q.side) === 1).length === 2 && O.DETAIL.pieces.some((q) => q.hH === 0.6 && q.front === 1) && O.DETAIL.startMul === 2 && O.DETAIL.fullMul === 1.5);
// validation
const cl = E.checkLandmark;
ok('entry validation: a valid one and the defaults pass; other kinds are not checked', cl({ kind: 'landmark' }) === null && cl({ kind: 'landmark', hFar: 1.5, hNear: 3, dFar: 8, dNear: 2 }) === null && cl({ kind: 'lamp', hH: -1 }) === null);
ok('entry validation: hFar > hNear, dNear >= dFar, non-positive or non-numeric values are rejected', [{ hFar: 4, hNear: 3 }, { dNear: 8 }, { dNear: 9, dFar: 8 }, { hFar: 0 }, { hNear: -1 }, { dFar: '8' }, { dNear: NaN }].every((q) => !!cl(Object.assign({ kind: 'landmark' }, q))));
const parse = (b) => E.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { stage: { billboards: b } } });
ok('manifest: viewer.stage.billboards with a valid landmark is accepted (inert), a bad one is rejected with a clear error', (() => { parse([{ kind: 'landmark', hFar: 1.5, hNear: 3, dFar: 8, dNear: 2 }, { kind: 'lamp', x: 1, y: 2, hH: 1 }]); let n = 0; for (const b of [[{ kind: 'landmark', hFar: 4, hNear: 3 }], [{ kind: 'landmark', dNear: 8, dFar: 8 }], 'x', [5]]) { try { parse(b); } catch (e) { if (/viewer\.stage\.billboards/.test(e.message)) n++; } } return n === 4; })());
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
