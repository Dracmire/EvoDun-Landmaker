/* Ramps against the Cake rings (real map, 5 terraces, rooms on, Cake on): how many ramps are buried?
   foot  = a ramp of an UP cake (pyramid) whose foot has beside it same-terrace ring tiles more than 0.25 above it; ENCLOSED = every free same-terrace neighbour of the foot is such a tile.
   head  = a ramp of a DOWN cake (bowl) whose head has beside it same-terrace ring tiles more than 0.25 below it; ENCLOSED likewise.
   Prints with the corridor (default) and without it (P.cakeCorridor = false), and the ring tiles lost.     node tools/diag_cake_ramps.js [--terraces 5] */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const P0 = { terraces: +arg('--terraces', 5), subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, roomsIsoLimit: 100, rooms: true, margin: 24, cake: true };
exports.measure = (S) => {
  const W = S.W, H = S.H, fw = S.mapW, mapOf = (i) => (((i / W) | 0) + S.oy) * fw + (i % W) + S.ox, hh = (i) => S.levelH[S.fine[i]], types = S.types, RL = S.rooms;
  const foot = new Set(); for (const rec of S.stairs) { for (const t of rec.bottom) foot.add(t); for (const t of rec.top) foot.add(t); for (const st of rec.steps) for (const t of st.tiles) foot.add(t); }
  const out = { ramps: S.stairs.length, up: 0, down: 0, footBuried: 0, footEnclosed: 0, headBuried: 0, headEnclosed: 0 };
  for (const rec of S.stairs) {
    const b0 = rec.bottom[0], o = types.rooms.get(RL.room[mapOf(b0)]); if (!o || o.type !== 1) continue;
    const l = o.linkList.find((k) => k.low === S.ter[b0] && k.high === S.ter[rec.top[0]]); if (!l) continue;
    const ends = l.down ? rec.top : rec.bottom; l.down ? out.down++ : out.up++;
    const nb = []; for (const a of ends) { const x = a % W, y = (a / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!foot.has(j) && S.ter[j] === S.ter[a] && !(S.void && S.void[j])) nb.push([a, j]); } }
    if (!nb.length) continue;
    const bad = nb.filter(([a, j]) => S.ringTile && S.ringTile[j] && (l.down ? hh(j) < hh(a) - 0.25 : hh(j) > hh(a) + 0.25));
    if (bad.length) l.down ? out.headBuried++ : out.footBuried++;
    if (bad.length === nb.length) l.down ? out.headEnclosed++ : out.footEnclosed++;
  }
  return out;
};
if (require.main === module) (async () => {
  const { mk } = await require('./real_pack.js').load(E);
  for (const [label, extra] of [['without corridor', { cakeCorridor: false }], ['with corridor   ', {}]]) {
    const S = E.shape(mk(), { ...P0, ...extra }, null), m = exports.measure(S);
    console.log(`${label}: ${m.ramps} ramps (${m.up} in pyramids, ${m.down} in bowls); foot buried ${m.footBuried}, foot enclosed ${m.footEnclosed}; head buried ${m.headBuried}, head enclosed ${m.headEnclosed}; ring tiles ${S.cake.tiles}, corridor tiles ${S.cake.corridor}`);
  }
})();
