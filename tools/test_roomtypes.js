/* Room types (Cake / Diorama / Ascension) and the Cake geometry: the rules of reference/SingleRoomMeshGeneratorV16.4.cs (see src/roomtypes.js) on hand-made rooms,
   and the invariants on the real map (built like the viewer: tools/real_pack.js).
     node tools/test_roomtypes.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T = E.roomTypes; let pass = 0, fail = 0;
const measureRamps = require('./diag_cake_ramps.js').measure; // the same measurement as the diagnostic (buried / enclosed feet and heads)
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const P0 = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, roomsIsoLimit: 100, rooms: true, margin: 24 };

/* ---- hand-made rooms ---- */
function fake(W, H, rows, gates, rp) { // rows: strings; digit = terrace, letter = room id (a=1) written as "ra" pairs is too long: room and terrace given by two arrays
  const n = W * H, room = new Int32Array(n), ter = new Int32Array(n);
  for (const f of rows) for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) { room[y * W + x] = f.room; ter[y * W + x] = f.ter; }
  const gate = gates.map(([ax, ay, bx, by]) => [ay * W + ax, by * W + bx]), usedGate = new Map(); for (const [a, b] of gate) usedGate.set(E.rooms.key(a, b, n), 1);
  const rpSet = new Set((rp || []).map(([ax, ay, bx, by]) => E.rooms.key(ay * W + ax, by * W + bx, n)));
  return { W, H, room, ter, gate, usage: { usedGate, gateGroupOf: new Map() }, rp: rpSet };
}
const rect = (room, ter, x0, y0, x1, y1) => ({ room, ter, x0, y0, x1, y1 });
{ // one link, a tie of pieces -> Down
  const RL = fake(12, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7)], [[4, 3, 5, 3]]), c = T.classify(RL, P0), o = c.rooms.get(1);
  ok('room with two terraces and a used gate is Cake', o.type === T.CAKE && o.linkList.length === 1);
  ok('one link, tie of pieces (1 and 1) -> Down (bowl), core = the low terrace', o.linkList[0].down === true && o.linkList[0].core === 0);
}
{ // more pieces on the low terrace -> Up
  const RL = fake(12, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7), rect(1, 0, 7, 0, 7, 1)], [[4, 3, 5, 3]]), o = T.classify(RL, P0).rooms.get(1);
  ok('one link, more pieces on the low terrace (2 against 1) -> Up (pyramid), core = the high terrace', o.linkList[0].down === false && o.linkList[0].core === 1, JSON.stringify(o.linkList));
}
{ // more pieces on the high terrace -> Down
  const RL = fake(12, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7), rect(1, 1, 7, 3, 7, 3), rect(1, 0, 6, 3, 8, 3)], [[4, 3, 5, 3]]), o = T.classify(RL, P0).rooms.get(1);
  ok('pieces are counted per 4-connected piece of the room on each terrace', (o.pieces.get(0) || 0) >= 1 && (o.pieces.get(1) || 0) >= 1, JSON.stringify([...o.pieces]));
}
{ // several links: Down only when low is the minimum terrace of the room
  const RL = fake(14, 6, [rect(1, 0, 0, 0, 3, 5), rect(1, 1, 4, 0, 7, 5), rect(1, 2, 8, 0, 11, 5)], [[3, 2, 4, 2], [7, 2, 8, 2]]), o = T.classify(RL, P0).rooms.get(1);
  ok('two links: (0,1) is Down (low = minimum terrace), (1,2) is Up', o.linkList.length === 2 && o.linkList[0].down === true && o.linkList[1].down === false && o.linkList[1].core === 2, JSON.stringify(o.linkList.map((l) => [l.low, l.high, l.down])));
}
{ // no used gate: not Cake; Diorama from 3 neighbours, Ascension otherwise
  const RL = fake(14, 8, [rect(1, 0, 0, 0, 3, 5), rect(1, 1, 4, 0, 7, 5), rect(2, 0, 8, 0, 9, 1), rect(3, 0, 8, 2, 9, 3), rect(4, 0, 8, 4, 9, 5)], [], [[7, 0, 8, 0], [7, 2, 8, 2], [7, 4, 8, 4]]), c = T.classify(RL, P0);
  ok('a room with two terraces but NO terrace edge is not Cake; 3 neighbours by transitions -> Diorama', c.rooms.get(1).type === T.DIORAMA && c.rooms.get(1).neigh.size === 3, c.rooms.get(1).type);
  ok('a room with one neighbour and no terrace edge is Ascension', c.rooms.get(2).type === T.ASCENSION);
  const c0 = T.classify(fake(12, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7)], [[4, 3, 5, 3]]), { ...P0, cakeLayers: 0 });
  ok('cakeLayers 0 -> no Cake', c0.rooms.get(1).type !== T.CAKE);
}
{ // "Diorama never touches Diorama": hand-made rooms A (100 tiles) and B (50 tiles), both with 3 neighbours by transition
  const build = (pairsAB) => fake(15, 12, [rect(1, 0, 0, 0, 9, 9), rect(2, 0, 10, 0, 14, 9), rect(3, 0, 0, 10, 4, 11), rect(4, 0, 5, 10, 9, 11), rect(5, 0, 10, 10, 11, 11), rect(6, 0, 12, 10, 14, 11)], [],
    [...Array.from({ length: pairsAB }, (_, k) => [9, 1 + k, 10, 1 + k]), [2, 9, 2, 10], [7, 9, 7, 10], [10, 9, 10, 10], [13, 9, 13, 10]]);
  const c3 = T.classify(build(3), P0), c2 = T.classify(build(2), P0), cOff = T.classify(build(3), { ...P0, dioNoTouch: false });
  ok('D-D: A (100 tiles) and B (50) are both Diorama by the V16.4 rule, joined by 3 transition pairs: the bigger stays, the smaller becomes Ascension', c3.rooms.get(1).type === T.DIORAMA && c3.rooms.get(2).type === T.ASCENSION && c3.rooms.get(2).demoted === true && c3.counts.dioDemoted === 1 && c3.counts.dioDemotedTiles === 50, JSON.stringify(c3.counts));
  ok('D-D: joined by only 2 pairs they are not "connected by walking": both stay Diorama', c2.rooms.get(1).type === T.DIORAMA && c2.rooms.get(2).type === T.DIORAMA && c2.counts.dioDemoted === 0);
  ok('D-D off (P.dioNoTouch false): the plain V16.4 rule, both Diorama', cOff.rooms.get(1).type === T.DIORAMA && cOff.rooms.get(2).type === T.DIORAMA);
  ok('D-D: a Diorama that only touches a demoted one stays (greedy by size)', (() => { const RL = build(3); const cc = T.classify(RL, P0); return cc.rooms.get(1).type === T.DIORAMA; })());
}
/* ---- rings of a hand-made Cake ---- */
const mkq = (RL, sub) => ({ sub: sub || new Int8Array(RL.W * RL.H), center: undefined, void: null });
const ringsOf = (RL, P, reserved, sub) => { const ty = T.classify(RL, P), R = T.buildRings(RL, ty, P, mkq(RL, sub), reserved || new Uint8Array(RL.W * RL.H)); const by = new Map(); for (const [t, c] of R.claim) { if (!by.has(c.k)) by.set(c.k, []); by.get(c.k).push(t); } return { R, by, ty }; };
{
  const RL = fake(14, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7)], [[4, 3, 5, 3]]), W = 14, { R, by } = ringsOf(RL, P0), info = R.links[0];
  const xs = (k) => [...new Set((by.get(k) || []).map((t) => t % W))].join();
  ok('Down: rings lie OUTSIDE the core, on the high terrace, one column per ring (d = 1)', info.down && xs(0) === '5' && xs(1) === '6' && xs(2) === '7' && !by.get(3), [xs(0), xs(1), xs(2)]);
  ok('Down: 8 tiles per ring (the seam window reaches every row), heights +0.3, +0.6, +0.9 above the core top', (by.get(0) || []).length === 8 && [0, 1, 2].every((k) => Math.abs([...R.claim.values()].find((c) => c.k === k).h - (E.hOf(0, P0) + 0.3 * (k + 1))) < 1e-9), JSON.stringify([...by].map(([k, v]) => [k, v.length])));
  ok('Down: no tile outside the room or on the core', [...R.claim.keys()].every((t) => RL.room[t] === 1 && RL.ter[t] === 1));
}
{ // seam window: a tall room, the gate at the top, the window (radius 5) cuts the far rows
  const RL = fake(14, 16, [rect(1, 0, 0, 0, 4, 15), rect(1, 1, 5, 0, 9, 15)], [[4, 1, 5, 1]]), { R } = ringsOf(RL, P0), ys = [...R.claim.keys()].map((t) => (t / 14) | 0);
  ok('Down: rings are cut to the seam window (radius 5 around the gate tiles)', Math.max(...ys) <= 1 + 5 && Math.min(...ys) >= 0, [Math.min(...ys), Math.max(...ys)]);
}
{ // Up: rings on the low terrace around the whole high core, heights descend from the core top
  const RL = fake(14, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7), rect(1, 0, 7, 0, 7, 1)], [[4, 3, 5, 3]]), { R, by } = ringsOf(RL, P0), W = 14, info = R.links[0];
  const coreTop = E.hOf(3, P0), vals = [...R.claim.values()];
  ok('Up: rings are BUILT on tiles of the low terrace of the room, never on the core', !info.down && [...R.claim.keys()].every((t) => RL.ter[t] === 0), JSON.stringify([...R.claim.keys()].slice(0, 5)));
  ok('Up: heights descend from the core top (-0.3, -0.6, -0.9) and stay above the low terrace', vals.every((c) => Math.abs(c.h - (coreTop - 0.3 * (c.k + 1))) < 1e-9 && c.h > c.old), JSON.stringify(vals.slice(0, 3)));
}
{ // reserved footprint: excluded; an emptied ring is dropped and the rest renumbered
  const RL = fake(14, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7)], [[4, 3, 5, 3]]), W = 14, res = new Uint8Array(14 * 8); for (let y = 0; y < 8; y++) res[y * W + 6] = 1; res[3 * W + 5] = 1;
  const { R, by } = ringsOf(RL, P0, res), hs = [...new Set([...R.claim.values()].map((c) => +c.h.toFixed(6)))].sort();
  ok('the footprint of a ramp is reserved (no ring on it)', [...R.claim.keys()].every((t) => !res[t]));
  ok('an empty ring is dropped and the others renumbered (x = 5 -> 0.3, x = 7 -> 0.6)', by.size === 2 && R.links[0].rings === 2 && JSON.stringify(hs) === JSON.stringify([+(E.hOf(0, P0) + 0.3).toFixed(6), +(E.hOf(0, P0) + 0.6).toFixed(6)]), JSON.stringify([hs, R.links[0].rings]));
}
{ // step = min(step, (gap - margin) / n): the core reaches the top sub-level, the gap to the high terrace is small
  const RL = fake(14, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7)], [[4, 3, 5, 3]]), sub = new Int8Array(14 * 8); for (let i = 0; i < sub.length; i++) if (RL.ter[i] === 0) sub[i] = 2;
  const { R } = ringsOf(RL, P0, null, sub), l = R.links[0], gap = E.hOf(3, P0) - E.hOf(2, P0);
  ok('the step shrinks when the gap is small: (gap - margin) / n and the last ring stays below the high terrace', Math.abs(l.step - (gap - 0.05) / 3) < 1e-9 && l.step < 0.3 && l.coreTop + 3 * l.step < E.hOf(3, P0), JSON.stringify(l));
}
{ // an empty gap: no ring, the link is flat
  const RL = fake(14, 8, [rect(1, 0, 0, 0, 4, 7), rect(1, 1, 5, 0, 9, 7)], [[4, 3, 5, 3]]), sub = new Int8Array(14 * 8); for (let i = 0; i < sub.length; i++) if (RL.ter[i] === 0) sub[i] = 2;
  const { R } = ringsOf(RL, { ...P0, subs: 3, subH: 0.5, climb: 0, terH: 1, cakeMargin: 0.5 }, null, sub);
  ok('a link whose gap is not above the margin builds nothing (flat), never a zero-thickness ring', R.links[0].flat === true && R.claim.size === 0, JSON.stringify(R.links[0]));
}

/* ---- the real map (like the viewer) ---- */
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const run = (P, spec) => E.shape(mk(), P, spec || null);
  const base = run(P0), cake = run({ ...P0, cake: true });
  const c = base.types.counts;
  ok('5 terraces: 31 Cake, 0 Diorama, 1 Ascension of 32 rooms (the user\'s figures)', c.cake === 31 && c.diorama === 0 && c.ascension === 1 && base.types.rooms.size === 32, JSON.stringify(c));
  { const c3 = run({ ...P0, terraces: 3, dioNoTouch: false }).types.counts, c2 = run({ ...P0, terraces: 2, dioNoTouch: false }).types.counts;
    console.log(`  info: 3 terraces ${c3.cake}/${c3.diorama}/${c3.ascension} (expected 27/5/0), 2 terraces ${c2.cake}/${c2.diorama}/${c2.ascension} (expected 26/4/2)`);
    ok('3 and 2 terraces: 27/5/0 and 26/4/2 (the expected values: used gates as terrace edges)', c3.cake === 27 && c3.diorama === 5 && c2.cake === 26 && c2.diorama === 4 && c2.ascension === 2, JSON.stringify([c3, c2])); }
  ok('Cake off: no cake info, no ring tiles, classification still there', base.cake === undefined && base.ringTile === undefined && !!base.types && !!base.roomType);
  ok('Cake on builds links in both directions', cake.cake.down > 10 && cake.cake.up > 10 && cake.cake.links === cake.cake.down + cake.cake.up + cake.cake.flat, JSON.stringify({ d: cake.cake.down, u: cake.cake.up, f: cake.cake.flat }));
  const check = (label, S0, S1) => {
    const n = S1.n, K = S1.subs, tb = (t) => E.terBase(t, S1.P || P0, S1.center), sub = E.subHeight(P0);
    // levels
    let sorted = true; for (let L = 1; L <= S1.maxFine; L++) if (!(S1.levelH[L] > S1.levelH[L - 1] + 1e-9)) sorted = false;
    ok(`${label}: the level ranking is strictly increasing`, sorted);
    const ringLv = []; S1.levelMeta.forEach((m, L) => { if (m.ring) ringLv.push(L); });
    ok(`${label}: no empty ring level (${ringLv.length} ring levels, each with tiles)`, ringLv.length === S1.cake.levelsAdded && ringLv.every((L) => S1.byLevel[L].length > 0), [ringLv.length, S1.cake.levelsAdded]);
    // per tile
    let nRing = 0, bad = 0, thin = 0, band = 0, foot = 0, moved = 0, wrongSide = 0; const claim = S1.cake.claim, fw = S1.mapW, mapOf = (i) => (((i / S1.W) | 0) + S1.oy) * fw + (i % S1.W) + S1.ox;
    const used = new Set(); for (const rec of S1.stairs) { for (const t of rec.bottom) used.add(t); for (const t of rec.top) used.add(t); for (const st of rec.steps) for (const t of st.tiles) used.add(t); }
    for (let i = 0; i < n; i++) {
      const hNew = S1.levelH[S1.fine[i]], hOld = S0.levelH[S0.fine[i]];
      if (!S1.ringTile[i]) { if (Math.abs(hNew - hOld) > 1e-9 && !(S1.void && S1.void[i])) moved++; continue; }
      nRing++; const cl = claim.get(mapOf(i)); if (!cl) { bad++; continue; }
      const l = cl.link; if (S1.void && S1.void[i]) bad++;
      if (used.has(i)) foot++;
      if (l.down ? S1.roomMap[i] !== l.room : S1.roomType[i] === T.DIORAMA) bad++; // Up v2 builds in the AIRSPACE (any non-void tile except a Diorama tile)
      if (l.down ? S1.ter[i] !== l.high : S1.roomMap[i] === l.room && S1.ter[i] === l.high) wrongSide++; // Up: never on the core terrace of its own room (a room tile of a third terrace below may be raised: airspace)
      if (l.down ? !(hNew < hOld - 0.05 + 1e-9) : !(hNew > hOld + 0.05 - 1e-9)) thin++;           // a cut / build of at least the margin (0.05 terH): thickness > 0
      if (!(hNew > tb(l.low) && hNew < tb(l.high) + (K - 1) * sub)) band++;
    }
    ok(`${label}: ${nRing} ring tiles, every one in a claimed ring (Down: of ITS room; Up: in the airspace, never a Diorama tile), none on void`, nRing === S1.cake.tiles && bad === 0, [nRing, S1.cake.tiles, bad]);
    ok(`${label}: Down rings are cut into the HIGH terrace; Up rings are never on the core (high) terrace of their own room`, wrongSide === 0, wrongSide);
    ok(`${label}: every ring tile is really cut (Down) or built (Up) by at least the margin: no zero-thickness ring`, thin === 0, thin);
    ok(`${label}: every ring height is inside the band of its link`, band === 0, band);
    ok(`${label}: no ring on the footprint of a ramp`, foot === 0, foot);
    ok(`${label}: tiles outside the rings keep their height exactly`, moved === 0, moved);
    ok(`${label}: ramps keep their level (rec.level) and their end heights`, S1.stairs.length === S0.stairs.length && S1.stairs.every((r, k) => Math.abs(S1.levelH[r.level] - S0.levelH[S0.stairs[k].level]) < 1e-9 && r.top.every((t, j) => Math.abs(S1.levelH[S1.fine[t]] - S0.levelH[S0.fine[S0.stairs[k].top[j]]]) < 1e-9)));
    const a = S0.connInfo, b = S1.connInfo, wa = S0.walkInfo, wb = S1.walkInfo;
    ok(`${label}: walking, connections, regions, stake / route data unchanged`, JSON.stringify([a.ok, a.recomputed, a.unresolved, a.noRoute]) === JSON.stringify([b.ok, b.recomputed, b.unresolved, b.noRoute]) && wa.walkable === wb.walkable && wa.main === wb.main && JSON.stringify(S0.regionSizes) === JSON.stringify(S1.regionSizes) && S0.region.every((v, i) => v === S1.region[i]) && S0.nowalk.every((v, i) => v === S1.nowalk[i]));
    { // CORRIDOR: the straight way in front of the foot (pyramid) / behind the head (bowl) of every ramp is not a ring tile; no foot or head is enclosed
      const m = measureRamps(S1), RL = S1.rooms; let closed = 0, ringOnWay = 0, checked = 0;
      for (const rec of S1.stairs) {
        const b0 = rec.bottom[0], o = S1.types.rooms.get(RL.room[mapOf(b0)]); if (!o || o.type !== 1) continue;
        const l = o.linkList.find((k) => k.low === S1.ter[b0] && k.high === S1.ter[rec.top[0]]); if (!l) continue;
        const atFoot = !l.down, want = atFoot ? S1.ter[b0] : S1.ter[rec.top[0]];
        for (let ci = 0; ci < rec.cols.length; ci++) {
          const a = atFoot ? rec.bottom[ci] : rec.top[ci], from = atFoot ? rec.steps[0].tiles[ci] : rec.steps[rec.steps.length - 1].tiles[ci], dx = (a % S1.W) - (from % S1.W), dy = ((a / S1.W) | 0) - ((from / S1.W) | 0);
          let x = a % S1.W, y = (a / S1.W) | 0;
          for (let j = 1; j <= 3; j++) { x += dx; y += dy; if (x < 0 || y < 0 || x >= S1.W || y >= S1.H) break; const t = y * S1.W + x; if ((S1.void && S1.void[t]) || RL.room[mapOf(t)] !== o.id || S1.ter[t] !== want || used.has(t)) break; checked++; if (S1.ringTile[t]) ringOnWay++; if (Math.abs(S1.levelH[S1.fine[t]] - S0.levelH[S0.fine[t]]) > 1e-9) closed++; }
        }
      }
      ok(`${label}: the way in front of every foot (pyramid) / behind every head (bowl) is free of rings and keeps its height (${checked} tiles)`, ringOnWay === 0 && closed === 0 && checked > 0, [ringOnWay, closed, checked]);
      ok(`${label}: no ramp foot is enclosed by ring tiles above it, no head by ring tiles below it (${m.ramps} ramps)`, m.footEnclosed === 0 && m.headEnclosed === 0, JSON.stringify(m));
    }
    const steps = S1.cake.list.filter((l) => !l.flat); ok(`${label}: step <= 0.3 and n * step <= gap - margin on every link`, steps.every((l) => l.step <= 0.3 + 1e-9 && l.rings * l.step <= l.gap - 0.05 + 1e-9), JSON.stringify(steps.find((l) => l.rings * l.step > l.gap - 0.05 + 1e-9)));
  };
  check('5 terraces', base, cake);
  console.log(`  info: 5 terraces: ${cake.cake.down} bowls + ${cake.cake.up} pyramids, ${cake.cake.flat} flat links, ${cake.cake.tiles} ring tiles of ${cake.landTiles} land tiles, ${cake.cake.levelsAdded} levels added (${base.maxFine + 1} -> ${cake.maxFine + 1}), ${cake.cake.conflicts} tiles claimed twice`);
  for (const t of [3, 4, 6]) { const a = run({ ...P0, terraces: t }), b = run({ ...P0, terraces: t, cake: true }); check(`${t} terraces`, a, b); }
  { const nb = run({ ...P0, cake: true, cakeCorridor: false }), m0 = measureRamps(nb), m1 = measureRamps(cake);
    const m0v1 = measureRamps(run({ ...P0, cake: true, cakeCorridor: false, cakeUpV1: true }));
    ok('mutation (Up v1, the previous behaviour): without the corridor many feet are enclosed (the test can fail)', m0v1.footEnclosed > 20, JSON.stringify(m0v1)); // Up v2 builds far fewer ring tiles (seam window), so the same mutation encloses only 10 feet of 140 instead of 78
    ok('mutation (Up v2): without the corridor feet are still enclosed (the test can fail; 10 of 140)', m0.footEnclosed > 0, JSON.stringify(m0));
    console.log(`  info: 5 terraces, ramps buried by the rings: feet enclosed ${m0.footEnclosed} -> ${m1.footEnclosed}, heads enclosed ${m0.headEnclosed} -> ${m1.headEnclosed}; ring tiles ${nb.cake.tiles} -> ${cake.cake.tiles} (${nb.cake.tiles - cake.cake.tiles} lost, ${cake.cake.corridor} corridor tiles reserved)`); }
  { // the user's table, measured in the viewer (types, ramps, rooms, main % of the land), reproduced by tools/room_types_table.js
    const T2 = require('./room_types_table.js'), want = [['31/0/1', 140, 32, 74], ['24/3/5', 83, 32, 69], ['28/3/1', 82, 32, 79], ['20/7/5', 44, 32, 75], ['62/7/19', 156, 88, 61], ['32/29/27', 54, 88, 70]];
    want.forEach((w, k) => { const r = T2.run(mk, T2.ROWS[k][1], { dioNoTouch: false }); ok(`table row ${k + 1} "${T2.ROWS[k][0]}": types ${w[0]}, ${w[1]} ramps, ${w[2]} rooms, main ${w[3]} % of the land`, `${r.c.cake}/${r.c.diorama}/${r.c.ascension}` === w[0] && r.ramps === w[1] && r.rooms === w[2] && Math.round(r.main / r.land * 100) === w[3], `${r.c.cake}/${r.c.diorama}/${r.c.ascension} ${r.ramps} ${r.rooms} ${(r.main / r.land * 100).toFixed(1)}`); });
    const PB = { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, b0 = run(PB), b1 = run({ ...PB, cake: true }), cb = b0.types.counts;
    ok('Balanced types preset (3 terraces, core 100, radius 5, minPlateau 120): 88 rooms, 29 Cake / 18 Diorama / 41 Ascension (rule D-D on: 12 Dioramas of 30 demoted, 2452 tiles), 48 ramps', b0.types.rooms.size === 88 && cb.cake === 29 && cb.diorama === 18 && cb.ascension === 41 && cb.dioDemoted === 12 && cb.dioDemotedTiles === 2452 && b0.stairs.length === 48, JSON.stringify([cb, b0.stairs.length]));
    { const off = run({ ...PB, dioNoTouch: false }).types.counts; ok('rule D-D off: the plain V16.4 counts 29 / 30 / 29, nothing demoted', off.cake === 29 && off.diorama === 30 && off.ascension === 29 && off.dioDemoted === 0, JSON.stringify(off)); }
    check('Balanced types preset (3 terraces, core 100, radius 5, minPlateau 120)', b0, b1);
    console.log(`  info: Balanced types + Cake: ${b1.cake.down} bowls + ${b1.cake.up} pyramids, ${b1.cake.flat} flat links, ${b1.cake.tiles} ring tiles, ${b1.cake.levelsAdded} levels added (${b0.maxFine + 1} -> ${b1.maxFine + 1})`);
    const d9 = run({ ...P0, rRadius: 9 }); ok('rRadius 9 is the default: the same levels and tiles as without the parameter', d9.fine.every((v, i) => v === base.fine[i]) && JSON.stringify(d9.levelH) === JSON.stringify(base.levelH));
  }
  { const sp = { rooms: [8], margin: 6 }, a = run(P0, sp), b = run({ ...P0, cake: true }, sp); check('slice = room 8', a, b);
    const whole = base.roomType, mi = (i) => (((i / b.W) | 0) + b.oy) * b.mapW + (i % b.W) + b.ox; let diff = 0; for (let i = 0; i < b.n; i++) if (b.roomType[i] !== (b.void && b.void[i] ? 0 : whole[mi(i)])) diff++;
    ok('slice: the room type of every tile equals the whole-map type (classification does not depend on the slice)', diff === 0, diff); }
  { const off = E.shape(mk(), { ...P0, rooms: false, cake: true }, null), off2 = E.shape(mk(), { ...P0, rooms: false }, null);
    ok('rooms off (cake switch on): nothing changes, no types, no cake', off.cake === undefined && off.types === undefined && off.fine.every((v, i) => v === off2.fine[i]) && JSON.stringify(off.levelH) === JSON.stringify(off2.levelH)); }
  { // ---- Cake v2 for Up links: the platform is the extreme of the cake; seam window; airspace except Diorama tiles; raise only; Down untouched (both presets) ----
    const PBt = { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 };
    for (const [label, Pp] of [['Default', P0], ['Balanced types', PBt]]) {
      const S0 = run(Pp), RL = S0.rooms, ty = S0.types, K = Pp.subs, q = E.quantize(mk(), Pp), none = new Uint8Array(RL.W * RL.H), W = RL.W, H = RL.H, seam = T.paramsOf(Pp).seam;
      const hb = (i) => E.hOf(RL.ter[i] * K + q.sub[i], Pp, q.center), linkOf = (c) => ty.rooms.get(c.link.room).linkList.find((l) => l.low === c.link.low && l.high === c.link.high);
      const inv = (R) => { // counts of violations over the Up claims of one buildRings result
        const o = { up: 0, ring0: 0, window: 0, seam: 0, notRaise: 0, dio: 0, outside: 0, onOtherCore: 0, down: 0 };
        for (const [t, c] of R.claim) {
          if (c.link.down) { o.down++; continue; } o.up++;
          const l = linkOf(c), r = c.link.room, x = t % W, y = (t / W) | 0; let bad0 = false, badW = false;
          for (let yy = Math.max(0, y - c.d); yy <= Math.min(H - 1, y + c.d); yy++) for (let xx = Math.max(0, x - c.d); xx <= Math.min(W - 1, x + c.d); xx++) {
            const j = yy * W + xx; if (!(RL.room[j] === r && RL.ter[j] === l.core)) continue;
            if (!(hb(j) > c.h + 1e-9)) { badW = true; if (Math.abs(xx - x) <= 1 && Math.abs(yy - y) <= 1) bad0 = true; }
          }
          if (bad0) o.ring0++; if (badW) o.window++;
          if (!l.pos.some((p) => Math.abs((p % W) - x) <= seam && Math.abs(((p / W) | 0) - y) <= seam)) o.seam++;
          if (!(c.h > c.old + 1e-9)) o.notRaise++;
          if (ty.type[t] === T.DIORAMA) o.dio++;
          if (RL.room[t] !== r) { o.outside++; const o2 = ty.rooms.get(RL.room[t]); if (o2 && o2.type === T.CAKE && o2.linkList.some((l2) => l2.core === RL.ter[t])) o.onOtherCore++; }
        }
        return o;
      };
      const Rv2 = T.buildRings(RL, ty, Pp, q, none), Rv1 = T.buildRings(RL, ty, { ...Pp, cakeUpV1: true }, q, none), a = inv(Rv2), b = inv(Rv1);
      console.log(`  info: Cake v2 Up, ${label}: v1 -> v2: Up ring tiles ${b.up} -> ${a.up} (outside their room ${b.outside} -> ${a.outside}, on the core of another Cake room ${b.onOtherCore} -> ${a.onOtherCore}), ring-0 violations ${b.ring0} -> ${a.ring0} of ${b.up}/${a.up} claimed tiles, window violations ${b.window} -> ${a.window}, outside the seam window ${b.seam} -> ${a.seam}, not raised ${b.notRaise} -> ${a.notRaise}, Diorama tiles ${b.dio} -> ${a.dio} (blocked by the rule: ${Rv2.dioBlocked}, raise-only skips: ${Rv2.skipRaise}), Down tiles ${b.down} -> ${a.down}`);
      ok(`${label}: Up v2 builds ring tiles (${a.up})`, a.up > 100, a.up);
      ok(`${label}: the platform is the extreme: every Up ring tile is strictly lower than every core tile in its window of radius d (and than the adjacent ones)`, a.window === 0 && a.ring0 === 0, [a.window, a.ring0]);
      ok(`${label}: every Up ring tile is inside the seam window of its link (radius ${seam} around the gate tiles)`, a.seam === 0, a.seam);
      ok(`${label}: raise only: every Up claim has h > the old height`, a.notRaise === 0, a.notRaise);
      ok(`${label}: no Diorama tile is claimed by an Up link (${Rv2.dioBlocked} tiles were blocked by the rule)`, a.dio === 0, a.dio);
      ok(`${label}: mutation (Up v1): the platform-extreme and seam-window checks FAIL on the previous behaviour (${b.ring0} ring-0 tiles, ${b.window} window, ${b.seam} outside the seam)`, b.ring0 > 0 && b.window > 0 && b.seam > 0, JSON.stringify(b));
      { // Down is untouched: Down claims of a run with the Up links disabled (a copy of types without them) = the Down claims of the normal run, except tiles an Up claim wins
        const ty2 = { ...ty, rooms: new Map([...ty.rooms].map(([id, o]) => [id, { ...o, linkList: o.linkList.filter((l) => l.down) }])) }, Rd = T.buildRings(RL, ty2, Pp, q, none);
        let diff = 0, lost = 0, extra = 0; const same = (c1, c2) => c1.link.room === c2.link.room && c1.link.low === c2.link.low && c1.k === c2.k && Math.abs(c1.h - c2.h) < 1e-9;
        for (const [t, c] of Rd.claim) { const n = Rv2.claim.get(t); if (n && !n.link.down) extra++; else if (!n || !same(c, n)) diff++; }
        for (const [t, c] of Rv2.claim) if (c.link.down) { const d = Rd.claim.get(t); if (!d || !same(c, d)) lost++; }
        ok(`${label}: Down is untouched: the Down claims with the Up links disabled equal the normal run's (${extra} tiles are won by an Up claim)`, diff === 0 && lost === 0, [diff, lost, extra]);
        // v1 vs v2 (Down rule unchanged): every v1 Down tile is kept with the same height or is now claimed by an Up link of ANOTHER room (the airspace of a neighbouring cake wins the conflict: smaller ring index); every tile Down gains was an Up claim in v1
        let wonByUp = 0, miss = 0, hDiff = 0, added = 0, addedUp = 0, upSameRoom = 0; const dv1 = new Map([...Rv1.claim].filter(([, c]) => c.link.down)), dv2 = new Map([...Rv2.claim].filter(([, c]) => c.link.down));
        for (const [t, c] of dv1) { const n = dv2.get(t); if (n) { if (Math.abs(n.h - c.h) > 1e-9) hDiff++; } else { const u = Rv2.claim.get(t); if (u && !u.link.down) { wonByUp++; if (u.link.room === c.link.room) upSameRoom++; } else miss++; } }
        for (const [t] of dv2) if (!dv1.has(t)) { added++; const o = Rv1.claim.get(t); if (o && !o.link.down) addedUp++; }
        console.log(`  info: ${label}: Down tiles v1 ${dv1.size} -> v2 ${dv2.size}: ${added} added (${addedUp} of them claimed by an Up link in v1), ${wonByUp} now won by an Up link (${upSameRoom} of the same room), ${miss} lost otherwise, ${hDiff} with another height`);
        ok(`${label}: Down v1 -> v2: same heights on common tiles, ${added} tiles gained (all were Up claims in v1), ${wonByUp} lost only to an Up claim`, miss === 0 && hDiff === 0 && added === addedUp && upSameRoom === 0, [miss, hDiff, added, addedUp, wonByUp, upSameRoom]);
      }
      { // ---- CORE PROTECTION (follow-up of #35, user's decision 2026-10-16): an Up ring never takes a core tile of ANOTHER Cake room (stacked cakes of the same room are by design; a bowl floor is also protected from the Up rings of its own room) ----
        const coreOf = (m) => { const o = ty.rooms.get(RL.room[m]); return o && o.type === T.CAKE ? o.linkList.filter((l2) => l2.core === RL.ter[m]) : []; };
        const onCore = (R) => { const o = { other: 0, sameRoomUp: 0, sameRoomBowl: 0, down: 0 }; for (const [t, c] of R.claim) { const cs = coreOf(t); if (!cs.length) continue; if (c.link.down) { o.down++; continue; } if (RL.room[t] !== c.link.room) o.other++; else if (!cs.some((x) => x.low === c.link.low && x.high === c.link.high)) { if (cs.some((x) => x.down)) o.sameRoomBowl++; else o.sameRoomUp++; } } return o; };
        const upCount = (R) => [...R.claim.values()].filter((c) => !c.link.down).length, Ropen = T.buildRings(RL, ty, { ...Pp, cakeCoreOpen: true }, q, none), cc = onCore(Rv2), co = onCore(Ropen);
        console.log(`  info: ${label}: Up ring tiles on a core tile of ANOTHER Cake room ${co.other} -> ${cc.other} (cakeCoreOpen -> now); on the core of another link of the SAME room (stacked cakes, by design): ${co.sameRoomUp} -> ${cc.sameRoomUp}, on a bowl floor of the same room ${co.sameRoomBowl} -> ${cc.sameRoomBowl}; Down claims on any core tile (other rooms or other links of the same room): ${co.down} -> ${cc.down}; Up ring tiles ${upCount(Ropen)} -> ${upCount(Rv2)} (BFS entries refused by the rule, seam window included: ${Rv2.coreBlocked})`);
        ok(`${label}: no Up ring tile lies on a core tile of another Cake room (and none on a bowl floor of its own room)`, cc.other === 0 && cc.sameRoomBowl === 0, JSON.stringify(cc));
        ok(`${label}: Down claims never land on a core tile (other rooms or other links of the same room): 0`, cc.down === 0, cc.down);
        if (label === 'Default') ok(`${label}: mutation (cakeCoreOpen): the same check FAILS on the previous behaviour (${co.other} on another room's core, ${co.sameRoomBowl} on a bowl floor of its own room)`, co.other > 0 && co.sameRoomBowl > 0, JSON.stringify(co));
        else ok(`${label}: cakeCoreOpen changes nothing here (the old count is 0 too, so the check above is an equality)`, co.other === 0 && co.sameRoomBowl === 0 && Ropen.claim.size === Rv2.claim.size, JSON.stringify(co));
        // the FINAL shape (heights as drawn): the platform of a cake is its extreme: ring-0 tiles are strictly lower than an adjacent core tile (Up) / higher (Down); a ramp surface is lower than its platform, so tiles next to a ramp are excluded
        const finalCheck = (Sx) => {
          const fw = Sx.mapW, mapOf = (i) => (((i / Sx.W) | 0) + Sx.oy) * fw + (i % Sx.W) + Sx.ox, Hh = (i) => Sx.levelH[Sx.fine[i]], o = { up: 0, down: 0, nUp: 0, nDown: 0, at: [] };
          for (let i = 0; i < Sx.n; i++) {
            if (!Sx.ringTile[i]) continue; const c = Sx.cake.claim.get(mapOf(i)); if (!c || c.k !== 0) continue; const l = c.link, lk = Sx.types.rooms.get(l.room).linkList.find((k2) => k2.low === l.low && k2.high === l.high), x = i % Sx.W, y = (i / Sx.W) | 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
              const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= Sx.W || ny >= Sx.H) continue; const j = ny * Sx.W + nx; if (!(Sx.roomMap[j] === l.room && Sx.ter[j] === lk.core && !Sx.carved[j])) continue;
              if (l.down) { o.nDown++; if (!(Hh(i) > Hh(j) + 1e-9)) { o.down++; o.at.push([x, y, l.room]); } } else { o.nUp++; if (!(Hh(i) < Hh(j) - 1e-9)) o.up++; }
            }
          }
          return o;
        };
        const Sc = run({ ...Pp, cake: true }), So = run({ ...Pp, cake: true, cakeCoreOpen: true }), fc = finalCheck(Sc), fo = finalCheck(So);
        console.log(`  info: ${label}: final shape, ring-0 tiles next to a core tile of their own link (Up ${fc.nUp}, Down ${fc.nDown}): violations Up ${fo.up} -> ${fc.up}, Down ${fo.down} -> ${fc.down}${fo.at.length ? ' (previous: ' + [...new Set(fo.at.map((a2) => a2.join(',')))].join(' ; ') + ' = x, y, room)' : ''}`);
        ok(`${label}: FINAL shape: every Up ring-0 tile is strictly lower, every Down ring-0 tile strictly higher than an adjacent core tile of its link (${fc.nUp} + ${fc.nDown} pairs)`, fc.up === 0 && fc.down === 0, JSON.stringify(fc));
        if (label === 'Default') ok(`${label}: mutation (cakeCoreOpen): the final-shape check FAILS for Down on the previous behaviour (${fo.down} violations)`, fo.down > 0, JSON.stringify(fo));
      }
    }
  }
  // ---- DAC v2 PR B: the CHAIN of room PIECES (src/roomtypes.js: pieces, roomGraph, roomChain, chainTypes, chainWalk, chainCrossings)
  {
    const PBc = { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, Sb = run(PBc), at = (S, x, y) => (y - S.oy) * S.W + (x - S.ox), stake = at(Sb, 200, 62), goal = at(Sb, 47, 75);
    const pc = T.pieces(Sb, PBc), nb = E.walkGraph(Sb, PBc);
    let bad1 = 0, bad2 = 0, bad3 = 0, tiles = 0; for (let i = 0; i < Sb.n; i++) { const walk = Sb.roomMap[i] > 0 && !(Sb.void && Sb.void[i]) && Sb.region[i] >= 0; if (walk !== (pc.id[i] > 0)) bad1++; if (pc.id[i] > 0) { tiles++; if (pc.room[pc.id[i]] !== Sb.roomMap[i]) bad2++; for (const j of nb(i).slice()) if (pc.id[j] === pc.id[i] ? false : (Sb.roomMap[j] === Sb.roomMap[i] && pc.id[j] > 0)) bad3++; } }
    ok(`pieces: every walkable room tile (${tiles}) is in exactly one piece, and only those`, bad1 === 0, bad1);
    ok('pieces: a piece lies inside one room', bad2 === 0, bad2);
    ok('pieces: two tiles joined by a walking step inside the same room are in the same piece (a room is split only where it has no internal way)', bad3 === 0, bad3);
    ok('pieces: some room is split in more than one piece (the reason the room-level chain was not walkable)', pc.count > new Set(pc.room.slice(1)).size, [pc.count, new Set(pc.room.slice(1)).size]);
    const ch = T.roomChain(Sb, PBc, stake, goal), g = ch.graph, rk = (x, y) => Math.min(x, y) * 100000 + Math.max(x, y);
    ok('Balanced types, N 3: the chain is 21 pieces in 21 rooms, 8 blocked edges, 3 bridges skipped, the bound did not cut (the viewer figures)', ch.pieces.length === 21 && new Set(ch.rooms).size === 21 && ch.blocked.length === 8 && ch.bridges === 3 && !ch.cut && ch.repeated.length === 0, JSON.stringify({ n: ch.pieces.length, b: ch.blocked.length, br: ch.bridges, cut: ch.cut, rep: ch.repeated }));
    ok('the chain starts at the stake piece and ends at the goal piece, and consecutive pieces are joined by an edge of the graph', ch.pieces[0] === pc.id[stake] && ch.pieces[ch.pieces.length - 1] === pc.id[goal] && ch.pieces.every((x, k) => k === 0 || g.adj.get(ch.pieces[k - 1]).has(x)));
    ok('no blocked edge is on the chain', ch.blocked.every(([a, b]) => !ch.pieces.some((x, k) => k > 0 && rk(x, ch.pieces[k - 1]) === rk(a, b))));
    const conn = (a, b, ban) => { const seen = new Set([a]), q = [a]; for (let h = 0; h < q.length; h++) for (const v of g.adj.get(q[h]) || []) { if (seen.has(v) || rk(q[h], v) === ban) continue; seen.add(v); q.push(v); } return seen.has(b); };
    ok('no blocked edge is a bridge (removing it keeps its ends connected), and every edge of the shortest path is either blocked or a skipped bridge', ch.blocked.every(([a, b]) => conn(a, b, rk(a, b))) && ch.blocked.length + ch.bridges === ch.shortest - 1, JSON.stringify([ch.blocked.length, ch.bridges, ch.shortest]));
    const wk = T.chainWalk(Sb, PBc, ch, stake, goal);
    ok(`the chain is walkable with the tiles of its own rooms and without crossing a blocked edge (${wk.length} tiles)`, wk.ok && wk.length > 0, JSON.stringify(wk));
    const lens = [0, 1, 2, 3].map((n) => T.roomChain(Sb, { ...PBc, chainExtra: n }, stake, goal).pieces.length);
    ok(`the chain grows with N: ${lens.join(' <= ')} (the bound is the shortest path that avoids the blocked edges, 18 pieces, plus N; the unblocked shortest is 12)`, lens.every((l, k) => (k === 0 || l >= lens[k - 1]) && l === 18 + k), lens.join());
    const roomCh = T.roomChain(Sb, PBc, stake, goal, 'room');
    ok('MUTATION CHECK (nodes = rooms, the first PR B probe): the same stake and goal give a chain that is NOT walkable inside its rooms, so the walkable check can fail', !T.chainWalk(Sb, PBc, roomCh, stake, goal).ok, roomCh.pieces.length);
    const OLD = [82, 74, 68, 59, 53, 58, 66, 65, 55, 54, 36, 64, 57, 38, 23, 12, 11, 9, 10, 17, 20, 18, 19, 7], badOld = T.chainCrossings(Sb, PBc, OLD, stake, goal);
    ok(`the room-level chain of the first probe (24 rooms) has ${badOld.length} rooms that cannot be crossed (entry and exit in different pieces): ${badOld.join(', ')}`, badOld.join() === '55,54,64,38,23,9,10,20,7' && T.chainCrossings(Sb, PBc, ch.rooms, stake, goal).length === 0, badOld.join());
    // the types
    for (const rule of ['v164', 'route']) { const tp = T.chainTypes(Sb, PBc, ch, rule, stake, goal);
      ok(`rule ${rule}: no two Dioramas in a row in the chain (the second becomes Ascension)`, tp.types.every((t, k) => !(k > 0 && t === T.DIORAMA && tp.types[k - 1] === T.DIORAMA)), tp.types.join()); }
    const t164 = T.chainTypes(Sb, PBc, ch, 'v164', stake, goal), trt = T.chainTypes(Sb, PBc, ch, 'route', stake, goal);
    ok('V16.4 gives a Cake, an Ascension and a Diorama in the chain (AOK-1); Along the route only reports counts (7 / 8 / 6 and 0 / 17 / 4)', t164.counts.Cake > 0 && t164.counts.Asc > 0 && t164.counts.Dio > 0 && JSON.stringify(t164.counts) === '{"Cake":7,"Asc":8,"Dio":6}' && JSON.stringify(trt.route) === '{"Cake":0,"Asc":17,"Dio":4}', JSON.stringify([t164.counts, trt.route]));
    ok('Along the route (Balanced types): the whole chain stays on ONE terrace (stake, goal and every door tile), so no room is Cake by route (the info says so)', trt.terraces.length === 1 && trt.route.Cake === 0, trt.terraces.join());
    // 5 terraces: no chain without repeating a room; a room may then host two pieces
    const P5 = { ...PBc, terraces: 5 }, S5 = run(P5), s5 = at(S5, 200, 62), g5 = at(S5, 25, 128), c5 = T.roomChain(S5, P5, s5, g5);
    ok('5 terraces: there is no chain without repeating a room, so the repeat rule applies: room 6 appears twice, two pieces (14 pieces in 13 rooms)', c5.repeated.join() === '6' && c5.pieces.length === 14 && new Set(c5.rooms).size === 13 && T.chainWalk(S5, P5, c5, s5, g5).ok, JSON.stringify({ rep: c5.repeated, n: c5.pieces.length }));
    for (const rule of ['v164', 'route']) { const tp = T.chainTypes(S5, P5, c5, rule, s5, g5), first = new Map(); let same = true; c5.rooms.forEach((r, k) => { if (!first.has(r)) first.set(r, tp.types[k]); else if (tp.types[k] !== first.get(r)) same = false; }); ok(`5 terraces, rule ${rule}: the repeated room has one type (its first visit) in both pieces`, same); }
  }
  // ---- DAC v2 PR B3 (D29): the chain THROUGH the sub-objectives: a maximum number of uses per piece U = K + 1, steps <= (K + 1) x B, a repeat only after a goal
  {
    const PBc = { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, Sb = run(PBc), at = (S, x, y) => (y - S.oy) * S.W + (x - S.ox), stake = at(Sb, 200, 62), goal = at(Sb, 47, 75), sub = at(Sb, 122, 201);
    const k0 = T.roomChain(Sb, PBc, stake, goal), k0e = T.roomChain(Sb, PBc, stake, goal, undefined, []);
    ok('K = 0 (no sub-objective, or an empty list) is the PR B chain unchanged: the same pieces, blocked edges and bridges', JSON.stringify(k0e.pieces) === JSON.stringify(k0.pieces) && JSON.stringify(k0e.blocked) === JSON.stringify(k0.blocked) && k0e.bridges === k0.bridges && k0.pieces.length === 21 && k0.k === undefined);
    const pcB = T.pieces(Sb, PBc), subPiece = pcB.id[sub], B = k0.pieces.length - 1;
    const k1 = T.roomChain(Sb, PBc, stake, goal, undefined, [sub]);
    ok(`K = 1 with a dead-end sub-objective (room 57, an arm of the graph): a chain exists and passes the sub-objective piece (${k1.pieces ? k1.pieces.length : 0} visits)`, !k1.fail && k1.pieces.includes(subPiece) && k1.k === 1, k1.fail);
    ok('K = 1: no piece is used more than 2 times (U = K + 1), steps <= 2 x B (B = the actual 20 steps of the K = 0 chain), the walk starts at the stake piece and ends at the final goal piece', k1.maxUses <= 2 && k1.steps <= 2 * B && k1.baseSteps === B && k1.maxSteps === 2 * B && k1.pieces[0] === pcB.id[stake] && k1.pieces[k1.pieces.length - 1] === pcB.id[goal], JSON.stringify({ maxUses: k1.maxUses, steps: k1.steps, B: k1.baseSteps }));
    ok('K = 1 figures (the viewer\'s): 40 steps (the maximum), 41 visits, 32 distinct pieces, 9 pieces twice, 30 rooms, the bound did not cut', k1.steps === 40 && k1.visits === 41 && k1.distinct === 32 && k1.piecesTwice === 9 && new Set(k1.rooms).size === 30 && !k1.cut, JSON.stringify({ steps: k1.steps, visits: k1.visits, distinct: k1.distinct, twice: k1.piecesTwice, cut: k1.cut }));
    const rk2 = (x, y) => Math.min(x, y) * 100000 + Math.max(x, y), bset = new Set(k0.blocked.map(([x, y]) => rk2(x, y)));
    ok('the blocked edges are those of the stake -> FINAL goal path only (the K = 0 ones) and the walk crosses none of them', JSON.stringify(k1.blocked) === JSON.stringify(k0.blocked) && k1.pieces.every((x, k) => k === 0 || !bset.has(rk2(x, k1.pieces[k - 1]))));
    // justified repeat: no piece twice inside one stretch (the stretches are cut where a goal is reached for the first time)
    const iSub = k1.pieces.indexOf(subPiece), st1 = k1.pieces.slice(0, iSub + 1), st2 = k1.pieces.slice(iSub);
    ok('justified repeat: a piece is entered again only after a goal was reached: no piece twice inside the stretch stake -> sub-objective, nor inside sub-objective -> final goal', new Set(st1).size === st1.length && new Set(st2).size === st2.length, [st1.length, st2.length]);
    ok('the whole walk is walkable with the chain\'s own tiles and no blocked edge (every stretch, tiles counted)', T.chainWalk(Sb, PBc, k1, stake, goal).ok && T.chainWalk(Sb, PBc, k1, stake, goal).length > 0, JSON.stringify(T.chainWalk(Sb, PBc, k1, stake, goal)));
    // the cap alone (diagnostic: the justified-repeat rule off) is the rule U = K + 1 and the step maximum
    const kc = T.roomChain(Sb, { ...PBc, chainJustified: false }, stake, goal, undefined, [sub]);
    ok(`the cap alone (diagnostic, justified repeat off): no piece more than ${kc.uses} times (K + 1), steps <= ${kc.maxSteps} (the maximum is reached: ${kc.steps})`, !kc.fail && kc.maxUses <= kc.uses && kc.steps <= kc.maxSteps && kc.uses === 2, JSON.stringify({ maxUses: kc.maxUses, steps: kc.steps }));
    // K = 2: a second sub-objective (a tile of a piece of the K = 1 walk) allows 3 uses and 3 x B
    const k2sub = [...pcB.id.keys()].find((i) => pcB.id[i] === k1.pieces[6] && pcB.id[i] !== subPiece && pcB.id[i] !== pcB.id[stake] && pcB.id[i] !== pcB.id[goal]);
    const k2 = T.roomChain(Sb, PBc, stake, goal, undefined, [sub, k2sub]), k2c = T.roomChain(Sb, { ...PBc, chainJustified: false }, stake, goal, undefined, [sub, k2sub]);
    ok(`K = 2 (two sub-objectives): 3 uses and 3 x B steps are allowed: justified walk ${k2.steps} steps <= ${k2.maxSteps}, max uses ${k2.maxUses} <= 3; the cap alone reaches ${k2c.maxUses} uses`, !k2.fail && k2.k === 2 && k2.uses === 3 && k2.maxSteps === 3 * B && k2.steps <= 3 * B && k2.maxUses <= 3 && k2c.maxUses === 3, JSON.stringify({ k: k2.k, steps: k2.steps, uses: k2.maxUses, capOnly: k2c.maxUses }));
    // skipped sub-objectives
    const off = T.roomChain(Sb, PBc, stake, goal, undefined, [-1]), same = T.roomChain(Sb, PBc, stake, goal, undefined, [stake]);
    ok('a sub-objective off room terrain, or in the same piece as the previous goal, is skipped with its reason and the chain is the K = 0 one', JSON.stringify(off.pieces) === JSON.stringify(k0.pieces) && off.skipped.length === 1 && /not on room terrain/.test(off.skipped[0].why) && same.skipped.length === 1 && /same piece/.test(same.skipped[0].why) && JSON.stringify(same.pieces) === JSON.stringify(k0.pieces), JSON.stringify([off.skipped, same.skipped]));
    // types across the repeated uses
    for (const rule of ['v164', 'route']) { const tp = T.chainTypes(Sb, PBc, k1, rule, stake, goal), first = new Map(); let one = true, dio = 0; k1.rooms.forEach((r, k) => { if (!first.has(r)) first.set(r, tp.types[k]); else if (tp.types[k] !== first.get(r)) one = false; if (k > 0 && k1.rooms[k] !== k1.rooms[k - 1] && tp.types[k] === T.DIORAMA && tp.types[k - 1] === T.DIORAMA) dio++; });
      ok(`K = 1, rule ${rule}: a room used several times has ONE type in all its visits, and there are no two Dioramas in a row across the repeated uses (${dio})`, one && dio === 0); }
    // the type of a repeated room is the one of its FIRST visit (synthetic: its role differs between the visits)
    { const fake = { ter: [0, 0, 0, 1], types: { rooms: new Map([[1, { type: T.ASCENSION, terraces: new Set([0]), linkList: [] }], [2, { type: T.ASCENSION, terraces: new Set([0]), linkList: [] }]]) } };
      const rkk = (x, y) => Math.min(x, y) * 100000 + Math.max(x, y), doors = new Map([[rkk(10, 20), [{ ra: 10, rb: 20, ia: 0, ib: 0, ramp: false }]], [rkk(20, 10), []]]);
      doors.set(rkk(10, 20), [{ ra: 10, rb: 20, ia: 1, ib: 2, ramp: false }]); // piece 10 (room 1) -> piece 20 (room 2): leaves by tile 1, enters at tile 2 (all terrace 0); the goal tile 3 is on terrace 1, so the LAST visit of room 1 would be a Cake
      const chain = { graph: { doors }, pieces: [10, 20, 10], rooms: [1, 2, 1] }, tp = T.chainTypes(fake, {}, chain, 'route', 0, 3);
      ok('Along the route: a room visited twice with different roles takes the type of its FIRST visit in both (first visit Ascension, last visit would be Cake)', tp.routeVisit[0] === T.ASCENSION && tp.routeVisit[2] === T.CAKE && tp.types[0] === T.ASCENSION && tp.types[2] === T.ASCENSION, JSON.stringify([tp.routeVisit, tp.types])); }
  }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
