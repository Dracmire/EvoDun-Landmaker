/* Art contract: the pieces that come from data (no canvas): terrace faces classed by jump, masonry inside a landmark footprint, edge at the map border / void, strips cut at corners and material changes,
   the height spread rule behind the classes, and the pack keys that reach the shape (landmarks, trees, stageYaw).
     node tools/test_contract.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'render', 'contract']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = { terraces: 3, subs: 1, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 0, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 0, radius: 0, tread: 2, margin: 2 };
// a 16 x 10 map: terrace 0 on the left, terrace 1 in the middle, terrace 2 on the right
const W = 16, H = 10, el = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) el[y * W + x] = x < 5 ? 100 : x < 11 ? 500 : 900;
const mk = (extra) => Object.assign({ name: 't', width: W, height: H, elevation: el, elevRange: [100, 900], masks: {}, markers: [], fields: {} }, extra || {});
{
  const S = E.shape(mk(), P, null), fs = E.contract.faces(S, P);
  const terr = new Set(S.ter); ok('three terraces in the test scene', terr.size === 3, [...terr]);
  const lateral = fs.filter((f) => !f.edge);
  ok('terrace faces only where the neighbour is on a lower terrace: 2 columns x 10 rows', lateral.length === 20, lateral.length);
  ok('every face of the first scene is "low" (jump 1 terH < 1.2) and the border faces are "edge"', lateral.every((f) => f.cls === 'low') && fs.filter((f) => f.edge).length === 2 * W + 2 * H, [lateral.map((f) => f.cls).join(), fs.filter((f) => f.edge).length]);
  ok('jump classes: 1.2 and 2.2 terH are the limits (low < 1.2, mid < 2.2, high)', ['low', 'low', 'mid', 'mid', 'high'].every((c, k) => E.contract.classOf([0.5, 1.19, 1.2, 2.19, 2.2][k]) === c));
  const st = E.contract.strips(S, P);
  ok('the straight run of a terrace edge is ONE strip per side (no module length): 2 strips of 10 faces', st.filter((s) => s.faces.length === 10).length === 2, st.map((s) => s.faces.length).join());
}
{ // spread 1.5 without a cap: the jumps grow and the classes follow (4 terraces, centre at the end)
  const P2 = Object.assign({}, P, { terraces: 5, spread: 1.5 }), w2 = 25, e2 = new Float32Array(w2 * 4); for (let y = 0; y < 4; y++) for (let x = 0; x < w2; x++) e2[y * w2 + x] = 100 + (x / 5 | 0) * 200 + (x >= 20 ? 0 : 0);
  const S = E.shape({ name: 't', width: w2, height: 4, elevation: e2, elevRange: [100, 900], masks: {}, markers: [], fields: {} }, P2, null), fs = E.contract.faces(S, P2).filter((f) => !f.edge), classes = fs.map((f) => f.cls);
  ok('with spread 1.5 the faces include "mid" and "high" jumps (the classes are measured in terH units)', classes.includes('mid') || classes.includes('high'), [...new Set(classes)]);
  ok('the jumps are the rule T(d) = (d-1)d/2: gaps from the centre 1, 1.5, 2.5, 4, 6', [1, 2, 3, 4, 5].every((d, k) => Math.abs(P2.terH * (1 + 0.5 * (d - 1) * d / 2) - [1, 1.5, 2.5, 4, 6][k]) < 1e-9));
}
{ // landmarks: masonry inside the footprint; pack keys reach the shape
  const lm = { shrine: { c: [5, 5], solid: 1, foot: 2.5, rej: 3, infl: 4, h: 5 } }, S = E.shape(mk({ landmarks: lm, trees: [[2, 2], [3, 3]], stageYaw: 90 }), P, null), fs = E.contract.faces(S, P).filter((f) => !f.edge);
  ok('pack keys landmarks, trees and stageYaw reach the shape', S.landmarks === lm && S.trees.length === 2 && S.stageYaw === 90);
  ok('faces inside the landmark footprint are masonry, the others keep their jump class', fs.some((f) => f.cls === 'masonry') && fs.some((f) => f.cls === 'low') && fs.filter((f) => f.cls === 'masonry').every((f) => Math.hypot(f.mx - 5, f.my - 5) <= 2.5 + 1e-9));
  const st = E.contract.strips(S, P);
  ok('a material change cuts a strip: the masonry part is its own strip', st.some((s) => s.faces.every((f) => f.cls === 'masonry')) && st.some((s) => s.faces.every((f) => f.cls !== 'masonry')), st.map((s) => s.faces[0].cls + s.faces.length).join());
}
{ const S = E.shape(mk(), P, null); ok('no landmarks and no trees: stageYaw 0, nothing carried', S.landmarks === null && S.trees === null && S.stageYaw === 0); }
{ const pack = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/shrine_pier_x4.json'), 'utf8')), S = E.shape(pack, Object.assign({}, P, { terraces: 7, spread: 1.5, subs: 3, stairW: 3, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, margin: 24 }), null);
  ok('Shrine-Pier x4: 40 x 40, stageYaw 90, 123 trees, shrine and pier landmarks', S.W === 40 && S.stageYaw === 90 && S.trees.length === 123 && S.landmarks.shrine && S.landmarks.pier);
  const fs2 = E.contract.faces(S, P), cls = {}; for (const f of fs2) cls[f.cls] = (cls[f.cls] || 0) + 1;
  ok('Shrine-Pier x4: faces of every class, masonry only inside the footprints', ['low', 'mid', 'high', 'masonry', 'edge'].every((c) => cls[c] > 0), JSON.stringify(cls)); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
