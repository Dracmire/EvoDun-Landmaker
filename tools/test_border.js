/* Tests for the slice border classification from the edge map (src/shape.js). Run: node tools/test_border.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['fields', 'shape', 'tech']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };
const W = 40, H = 20, n = W * H, P = { terraces: 3, subs: 1, terH: 1, subH: 0.22, minPlateau: 1, minSub: 1, pre: 0, smooth: 0, radius: 0, passGap: 8, climb: 1, stairW: 0 };
const mkPack = (edges) => {
  const el = new Float32Array(n).map((_, i) => 100 + (i % W) * 3), zid = new Int32Array(n).map((_, i) => ((i % W) < 20 ? 1 : 2)), eid = new Int32Array(n);
  for (const [x, y, v] of edges) eid[y * W + x] = v;
  return { name: 't', width: W, height: H, elevation: el, elevRange: [0, 1000], masks: {}, markers: [], fields: {
    zone: { ids: zid, amb: new Uint8Array(n), info: { classes: [{ id: 1 }, { id: 2 }], outside: 0, ambiguous: {} } },
    edge: { ids: eid, amb: new Uint8Array(n), info: { classes: [{ id: 1, label: 'barrier' }, { id: 2, label: 'pass' }, { id: 3, label: 'edge 3' }], outside: 0, ambiguous: {} } } } };
};
const kindOf = (S, x, y, b) => S.borderKind[(y * S.W + x) * 4 + b];
// zone 1 = x < 20; faces to the east of x = 19 look at zone 2; N/S/W faces are the map edge
{
  const pk = mkPack([[19, 5, 1], [20, 7, 1], [19, 9, 2], [20, 10, 2], [19, 11, 2], [20, 11, 1], [19, 13, 3], [20, 15, 3], [19, 17, 2], [20, 17, 1], [19, 17, 0]]);
  const S = E.shape(pk, P, { zones: [1], margin: 0 });
  ok('window = slice, border bits on the east side', S.border[5 * S.W + 19] === 2 && S.slice[5 * S.W + 19] === 1);
  const k = (y) => kindOf(S, 19, y, 1);
  ok('barrier on the slice tile -> red', k(5) === 1);
  ok('barrier on the partner (other side) -> red', k(7) === 1);
  ok('pass on the slice tile -> cyan', k(9) === 2);
  ok('pass on the partner -> cyan', k(10) === 2);
  ok('pass on one side and barrier on the other -> red', k(11) === 1);
  ok('other edge classes count as not marked -> yellow', k(13) === 3 && k(15) === 3);
  ok('nothing marked -> yellow', k(2) === 3);
  ok('pass and barrier on different tiles of the pair -> red (barrier wins)', k(17) === 1);
  ok('faces at the map edge -> white', kindOf(S, 5, 0, 0) === 4 && kindOf(S, 5, 19, 2) === 4 && kindOf(S, 0, 8, 3) === 4);
  const c = S.borderInfo, total = c.barrier + c.pass + c.none + c.mapEdge;
  let faces = 0; for (let i = 0; i < S.n; i++) for (let b = 0; b < 4; b++) if (S.border[i] >> b & 1) faces++;
  ok('counts add up to the number of border faces', total === faces && c.barrier === 4 && c.pass === 2 && c.mapEdge === 60, JSON.stringify(c));
}
// a window that does not reach the map edge: the partner outside the window is read from the whole map (no white there)
{
  const pk = mkPack([[19, 5, 1], [30, 5, 1]]);
  const S = E.shape(pk, P, { zones: [1], rect: [5, 3, 20, 14], margin: 0 });
  const x = 19 - S.ox, y = 5 - S.oy;
  ok('crop: east face of the rect uses the partner in the whole map', kindOf(S, x, y, 1) === 1, kindOf(S, x, y, 1));
  ok('crop: faces on the rect edge that are not map edge are never white', kindOf(S, 0, 4, 3) === 3);
}
// no edge map: all non-map-edge faces are yellow
{
  const pk = mkPack([]); delete pk.fields.edge;
  const S = E.shape(pk, P, { zones: [1], margin: 0 });
  ok('without an edge field the border stays yellow, map edge white', kindOf(S, 19, 5, 1) === 3 && kindOf(S, 5, 0, 0) === 4 && S.borderInfo.barrier === 0 && S.borderInfo.pass === 0);
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
