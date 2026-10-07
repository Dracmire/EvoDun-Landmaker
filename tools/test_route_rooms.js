/* Rooms on: walking = the patched passability + ramps. Regions and routes against an independent implementation (built from the layer's pass
   function and the stair columns), terrace changes only along ramps, nothing forbidden is entered. Real map data/samples/skeleton_heightmap_256.png.
     node tools/test_route_rooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
(async () => {
  const img = await E.decodePng(fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'))), W = img.width, H = img.height;
  const mk = () => ({ name: 'skeleton', width: W, height: H, elevation: Float32Array.from(img.channels[0], (v) => v / img.max * 1000), masks: {}, markers: [], fields: {} });
  const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, rooms: true };
  for (const [label, spec] of [['whole map', null], ['room slice', { rooms: [E.shape(mk(), P, null).rooms.rooms[2].id], margin: 6 }]]) {
    const S = E.shape(mk(), P, spec), RL = S.rooms, n = S.n, mi = (i) => (((i / S.W) | 0) + S.oy) * S.mapW + (i % S.W) + S.ox;
    // independent graph: pass between non-carved same-terrace tiles + the stair columns
    const adj = Array.from({ length: n }, () => []), link = (a, b) => { adj[a].push(b); adj[b].push(a); };
    const blocked = (i) => S.block[i] || (!S.carved[i] && RL.forb[mi(i)]);
    for (let i = 0; i < n; i++) { if (blocked(i) || S.carved[i]) continue; const x = i % S.W; for (const j of [x < S.W - 1 ? i + 1 : -1, i + S.W < n ? i + S.W : -1]) { if (j < 0 || blocked(j) || S.carved[j]) continue; if (S.ter[i] === S.ter[j] && RL.pass(mi(i), mi(j))) link(i, j); } }
    const stairLinks = new Set(); const lk = (a, b) => { link(a, b); stairLinks.add(a < b ? a * n + b : b * n + a); };
    for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) { let prev = st.bottom[ci]; for (const step of st.steps) { lk(prev, step.tiles[ci]); prev = step.tiles[ci]; } lk(prev, st.top[ci]); if (ci > 0) for (const step of st.steps) { const a = step.tiles[ci - 1], b = step.tiles[ci]; if (Math.abs(a - b) === S.W || (Math.abs(a - b) === 1 && ((a / S.W) | 0) === ((b / S.W) | 0))) lk(a, b); } }
    // components
    const comp = new Int32Array(n).fill(-1); let nc = 0;
    for (let s0 = 0; s0 < n; s0++) { if (comp[s0] >= 0 || blocked(s0)) continue; comp[s0] = nc; const q = [s0]; for (let h = 0; h < q.length; h++) for (const j of adj[q[h]]) if (comp[j] < 0 && !blocked(j)) { comp[j] = nc; q.push(j); } nc++; }
    // S.region partitions the walkable tiles exactly like the independent components
    const csize = new Map(); for (let i = 0; i < n; i++) if (comp[i] >= 0) csize.set(comp[i], (csize.get(comp[i]) || 0) + 1);
    let bigC = -1; for (const [c, z] of csize) if (bigC < 0 || z > csize.get(bigC)) bigC = c;
    const isoC = new Set([...csize].filter(([c, z]) => c !== bigC && z < 100).map(([c]) => c)); // isolated terrain: not a region (limit 100)
    const map = new Map(); let mism = 0, same = 0; for (let i = 0; i < n; i++) { if (blocked(i)) { if (S.region[i] >= 0) mism++; continue; } if (isoC.has(comp[i])) { if (S.region[i] >= 0 || !S.isolated[i]) mism++; continue; } if (S.region[i] < 0) { mism++; continue; } if (!map.has(S.region[i])) map.set(S.region[i], comp[i]); else if (map.get(S.region[i]) !== comp[i]) mism++; else same++; }
    ok(`${label}: regions are the components of the independent graph (${nc}, minus the isolated ones under 100 tiles)`, mism === 0 && map.size === nc - isoC.size, [mism, map.size, nc, isoC.size]);
    // routes: random pairs
    let rnd = 5; const r = () => (rnd = (rnd * 1664525 + 1013904223) >>> 0) / 4294967296; const walk = []; for (let i = 0; i < n; i++) if (!blocked(i) && !S.isolated[i]) walk.push(i);
    let bad = 0, checked = 0, nul = 0, forbiddenStep = 0, cliffStep = 0, lenBad = 0;
    for (let k = 0; k < 120; k++) {
      const a = walk[Math.floor(r() * walk.length)], b = walk[Math.floor(r() * walk.length)], route = E.route(S, P, a, b);
      if (comp[a] !== comp[b]) { if (route !== null) bad++; else nul++; continue; }
      checked++; if (!route || route[0] !== a || route[route.length - 1] !== b) { bad++; continue; }
      // shortest: compare with an independent BFS distance
      const d = new Int32Array(n).fill(-1); d[a] = 0; const q = [a]; for (let h = 0; h < q.length && d[b] < 0; h++) for (const j of adj[q[h]]) if (d[j] < 0) { d[j] = d[q[h]] + 1; q.push(j); }
      if (route.length - 1 !== d[b]) lenBad++;
      for (let t = 1; t < route.length; t++) { const u = route[t - 1], v = route[t]; if (blocked(v)) forbiddenStep++; const isStair = stairLinks.has(u < v ? u * n + v : v * n + u); if (S.ter[u] !== S.ter[v] && !isStair) cliffStep++; if (!isStair && !RL.pass(mi(u), mi(v)) && !(S.carved[u] || S.carved[v])) bad++; }
    }
    ok(`${label}: routes exist exactly inside a component, are shortest, and end where asked`, bad === 0 && lenBad === 0 && checked > 40, [bad, lenBad, checked, nul]);
    ok(`${label}: a route never enters a blocked tile and changes terrace only along a ramp`, forbiddenStep === 0 && cliffStep === 0, [forbiddenStep, cliffStep]);
  }
  const S = E.shape(mk(), P, null); let forb = -1; for (let i = 0; i < S.n; i++) if (!S.block[i] && !S.carved[i] && S.rooms.forb[i]) { forb = i; break; }
  ok('tileWalkable: false on a forbidden margin tile, true on a free one, false on void', forb >= 0 && !E.tileWalkable(S, forb) && !E.tileWalkable(S, S.void.indexOf(1)) && E.tileWalkable(S, S.region.findIndex((v) => v >= 0)));
  const off = E.shape(mk(), { ...P, rooms: false }, null); ok('rooms off: tileWalkable is just not-blocked', E.tileWalkable(off, forb) === !off.block[forb]);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
