/* Proposal data for the ASCENSION walls (no wall code): the room-border faces WITHOUT a transition (the orange line) with the Balanced types preset, whole map, rooms on.
   Counts faces and runs (a run = faces of the same room pair chained by shared vertices) and how many survive each minimum length. Also how many faces are cliffs (levels differ) and the Ascension side.
     node tools/room_walls_table.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T2 = require('./room_types_table.js');
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const r = T2.run(mk, T2.ROWS[5][1]), S = r.S, W = S.W, H = S.H, room = S.roomMap, type = S.types.rooms, tOf = (id) => (id > 0 && type.get(id) ? type.get(id).type : 0);
  const faces = []; // { a, b (rooms), x0, y0, x1, y1, cliff }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (room[i] <= 0) continue;
    for (const [dx, dy, b] of [[1, 0, 1], [0, 1, 2]]) { const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue; const j = ny * W + nx; if (room[j] <= 0 || room[j] === room[i] || S.roomKind[i * 4 + b] !== 1) continue;
      const cliff = S.fine[i] !== S.fine[j], v = dx ? [x + 1, y, x + 1, y + 1] : [x, y + 1, x + 1, y + 1]; faces.push({ a: Math.min(room[i], room[j]), b: Math.max(room[i], room[j]), v, cliff, dh: Math.abs(S.levelH[S.fine[i]] - S.levelH[S.fine[j]]) }); } }
  const par = faces.map((_, k) => k), find = (k) => { while (par[k] !== k) { par[k] = par[par[k]]; k = par[k]; } return k; }, byV = new Map();
  faces.forEach((f, k) => { for (const [vx, vy] of [[f.v[0], f.v[1]], [f.v[2], f.v[3]]]) { const key = `${vx},${vy},${f.a},${f.b}`; if (byV.has(key)) par[find(k)] = find(byV.get(key)); else byV.set(key, k); } });
  const runs = new Map(); faces.forEach((f, k) => { const g = find(k); let o = runs.get(g); if (!o) runs.set(g, o = { n: 0, asc: false, cliff: 0 }); o.n++; if (tOf(f.a) === 3 || tOf(f.b) === 3) o.asc = true; if (f.cliff) o.cliff++; });
  const ascFaces = faces.filter((f) => tOf(f.a) === 3 || tOf(f.b) === 3), ascRuns = [...runs.values()].filter((o) => o.asc);
  console.log(`Balanced types: ${r.rooms} rooms (${r.c.cake}/${r.c.diorama}/${r.c.ascension}); room-border faces WITHOUT a transition: ${faces.length} in ${runs.size} runs; with an Ascension room on one side: ${ascFaces.length} faces in ${ascRuns.length} runs; faces that are also a cliff (levels differ): ${faces.filter((f) => f.cliff).length} (${ascFaces.filter((f) => f.cliff).length} of the Ascension ones)`);
  console.log('minimum run length (faces) | runs kept | faces kept | % of the Ascension faces kept   (Ascension runs only)');
  for (const k of [1, 2, 3, 4, 5, 6, 8, 10]) { const keep = ascRuns.filter((o) => o.n >= k); console.log(`${k} | ${keep.length} | ${keep.reduce((t, o) => t + o.n, 0)} | ${(keep.reduce((t, o) => t + o.n, 0) / ascFaces.length * 100).toFixed(1)} %`); }
  const hist = {}; for (const o of ascRuns) { const b = o.n >= 20 ? '20+' : o.n >= 10 ? '10-19' : o.n >= 5 ? '5-9' : String(o.n); hist[b] = (hist[b] || 0) + 1; } console.log('Ascension runs by length (faces):', JSON.stringify(hist));
  const dh = ascFaces.map((f) => f.dh).sort((p, q) => p - q); console.log(`height step across an Ascension face: median ${dh[dh.length >> 1].toFixed(2)} terH, share with a step >= 0.7 terH (the wall would be lower than the cliff): ${(dh.filter((v) => v >= 0.7).length / dh.length * 100).toFixed(1)} %`);
  process.exit(0);
})();
