/* Slice by rooms with the GLOBAL tree: the slice keeps the tree connections whose paths stay inside it and joins what the cut separated with the
   minimum patch connections; the ramps of a room do not depend on the slice. Real map: data/samples/skeleton_heightmap_256.png.
     node tools/test_slice_rooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
(async () => {
  const { W, H, mk } = await require('./real_pack.js').load(E); const n = W * H;
  const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, rooms: true };
  const full = mk(), S0 = E.shape(full, P, null), RL = S0.rooms, U = RL.usage;
  const byCores = RL.rooms.map((r) => ({ id: r.id, cores: RL.alive.filter((c) => c.room === r.id).length, size: RL.roomSizes[r.id] })).sort((a, b) => b.cores - a.cores);
  const R1 = byCores[0].id, R2 = byCores[1].id, R3 = byCores[2].id;
  ok('whole map: no slice, no patch connections', S0.roomGates.slice === null && S0.roomGates.patchSites === 0 && S0.sliceInfo === null);
  const S1 = E.shape(full, P, { rooms: [R1], margin: 6 });
  ok('a room slice is exactly the tiles of that room (and no void)', S1.sliceInfo.tiles === RL.roomSizes[R1] && S1.sliceInfo.rooms.join() === String(R1), [S1.sliceInfo.tiles, RL.roomSizes[R1]]);
  const maskOf = (rooms) => { const m = new Uint8Array(n); for (let i = 0; i < n; i++) m[i] = rooms.includes(RL.room[i]) ? 1 : 0; return m; };
  // a pair of rooms whose tree connection runs THROUGH a third room (so the cut really breaks an edge)
  let through = null; { const ids = byCores.slice(0, 12).map((r) => r.id);
    for (const e of U.edges) { const ra = RL.room[RL.reach[e.i].center], rb = RL.room[RL.reach[e.j].center]; if (ra === rb) continue; const mid = new Set(e.path.map((t) => RL.room[t])); mid.delete(ra); mid.delete(rb); if (mid.size && ids.includes(ra) && ids.includes(rb)) { through = [ra, rb]; break; } } }
  ok('the test has a pair of rooms joined through a third one', !!through, through);
  for (const rooms of [[R1], [R2], [R1, R2], [R1, R2, R3], ...(through ? [through] : [])]) {
    const mask = maskOf(rooms), SU = E.rooms.sliceUse(RL, W, H, mask), nodes = RL.alive.filter((c) => c.center >= 0 && mask[c.center]);
    // independent reference: components of the nodes under the slice-restricted passability
    const step = (a, b) => mask[a] && mask[b] && RL.pass(a, b), comp = new Array(nodes.length).fill(-1); let nc = 0;
    nodes.forEach((c, i) => { if (comp[i] >= 0) return; const d = E.rooms.bfs(W, H, c.center, step, false).dist; nodes.forEach((o, j) => { if (d[o.center] >= 0) comp[j] = nc; }); nc++; });
    let keptRef = 0; for (const e of U.edges) { const a = RL.reach[e.i], b = RL.reach[e.j]; if (mask[a.center] && mask[b.center] && e.path.every((t) => mask[t])) keptRef++; }
    ok(`rooms ${rooms}: kept = the global edges whose path stays inside (${keptRef})`, SU.kept === keptRef, [SU.kept, keptRef]);
    ok(`rooms ${rooms}: after the patch the components are exactly the connectable ones (${nc})`, SU.componentsAfter === nc, [SU.componentsAfter, nc]);
    ok(`rooms ${rooms}: patch connections = components before - after (the minimum)`, SU.patch === SU.componentsBefore - SU.componentsAfter, [SU.patch, SU.componentsBefore, SU.componentsAfter]);
  }
  // sites of the slice: patch flags consistent, non-patch pairs belong to the global tree
  const sum = (a) => a.length; ok('the slice has ramps and the counts agree', S1.passes.length > 0 && S1.roomGates.patchSites === S1.passes.filter((s) => s.patch).length, [S1.passes.length, S1.roomGates.patchSites]);
  let notGlobal = 0; const ofMap = (w, S) => (S.ox + (w % S.W)) + (S.oy + ((w / S.W) | 0)) * W;
  for (const s of S1.passes) if (!s.patch) { const k = E.rooms.key(ofMap(s.a, S1), ofMap(s.b, S1), n); if (!U.usedGate.has(k)) { /* a cluster site is one of the used pairs */ notGlobal++; } }
  ok('every non-patch ramp sits on a pair the global tree crosses', notGlobal === 0, notGlobal);
  // the ramps of a room do not depend on which other rooms are in the slice
  const S12 = E.shape(full, P, { rooms: [R1, R2], margin: 6 });
  const setOf = (S) => new Set(S.passes.filter((s) => !s.patch).map((s) => ofMap(s.a, S)));
  const a = setOf(S1), b = setOf(S12); let missing = 0; for (const t of a) if (!b.has(t)) missing++;
  ok('the global (non-patch) ramps of room R1 are the same with or without R2 in the slice', a.size > 0 && missing === 0, [a.size, b.size, missing]);
  const sAll = new Set(S0.passes.map((s) => s.a)); let notInAll = 0; for (const t of a) if (!sAll.has(t)) notInAll++;
  ok('and they are ramps of the whole-map shaping too', notInAll === 0, notInAll);
  // a crop (no rooms) also gets the cut + patch
  const C = E.shape(full, P, { rect: [70, 70, 140, 140], margin: 6 });
  ok('a crop slice reports the cut and the patch', C.roomGates.slice && C.roomGates.slice.nodes > 0, JSON.stringify(C.roomGates.slice));
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
