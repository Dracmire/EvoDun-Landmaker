/* tools/stage_golden.js with SYNTHETIC images only (no file is read; the remake is third-party material and no test touches it).   node tools/test_stage_golden.js */
const G = require('./stage_golden.js'); let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300)); } };
const img = (w, h, f) => { const b = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = f(x / w, y / h), q = (y * w + x) * 4; b[q] = v[0]; b[q + 1] = v[1]; b[q + 2] = v[2]; b[q + 3] = 255; } return b; };
const C = 40, R = 22, w = 400, h = 220;
const A = img(w, h, (u, v) => (u > 0.2 && u < 0.5 && v > 0.1 && v < 0.5 ? [30, 30, 30] : [200, 200, 200]));      // a dark rectangle
const Bcol = img(w, h, (u, v) => (u > 0.2 && u < 0.5 && v > 0.1 && v < 0.5 ? [120, 20, 20] : [60, 220, 90]));   // the same rectangle with ANOTHER palette (a dark red on a light green)
const Bmove = img(w, h, (u, v) => (u > 0.6 && u < 0.9 && v > 0.5 && v < 0.9 ? [30, 30, 30] : [200, 200, 200])); // the rectangle elsewhere
const ex0 = G.excludeMask(C, R, []), dA = G.darkMask(G.cellLum(A, w, h, C, R), ex0).dark, dB = G.darkMask(G.cellLum(Bcol, w, h, C, R), ex0).dark, dM = G.darkMask(G.cellLum(Bmove, w, h, C, R), ex0).dark;
{ const c = G.compare(dA, dB, ex0); ok(`the palette does not count: the same composition in other colours agrees 100 % (IoU ${c.iou})`, c.agreement === 1 && c.iou === 1, c); }
{ const c = G.compare(dA, dM, ex0); ok(`a displaced blob: IoU 0 and the agreement drops (${c.agreement.toFixed(3)})`, c.iou === 0 && c.agreement < 0.8 && Math.abs(c.agreement - (1 - 216 / 880)) < 1e-9, c); }
{ const b = G.blobs(dA, C, R); ok(`blobs: one blob, box [0.2, 0.1, 0.5, 0.5] and centroid [0.35, 0.3] (${JSON.stringify(b[0])})`, b.length === 1 && Math.abs(b[0].box[0] - 0.2) < 0.03 && Math.abs(b[0].box[2] - 0.5) < 0.03 && Math.abs(b[0].centroid[0] - 0.35) < 0.03 && Math.abs(b[0].centroid[1] - 0.3) < 0.03, b); }
{ const two = img(w, h, (u, v) => ((u < 0.2 && v < 0.3) || (u > 0.7 && v > 0.6) ? [10, 10, 10] : [220, 220, 220])), d = G.darkMask(G.cellLum(two, w, h, C, R), ex0).dark, b = G.blobs(d, C, R); ok('two separate dark areas are two blobs (4-connectivity), the bigger first', b.length === 2 && b[0].cells >= b[1].cells, b); }
{ const ex = G.excludeMask(C, R, [{ circle: [0.9, 0.2, 0.1] }, { rect: [0, 0.9, 1, 1] }]); const n = ex.reduce((s, v) => s + v, 0); ok(`the exclusion mask (a circle in the corner, a bar at the bottom) leaves those cells out of both images and of the counts (${n} cells)`, n > 2 * C && n < 0.2 * C * R && G.compare(dA, dA, ex).included === C * R - n); }
{ const half = img(w, h, (u) => (u < 0.5 ? [0, 0, 0] : [255, 255, 255])), d = G.darkMask(G.cellLum(half, w, h, C, R), ex0); ok('the threshold is the MEDIAN of the image: a half-black half-white picture has half of its cells dark', Math.abs(d.dark.reduce((s, v) => s + v, 0) / (C * R) - 0.5) < 0.03); }
ok('an ASCII picture has rows x cols characters', G.ascii(dA, ex0, C, R).split('\n').filter(Boolean).length === R);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
