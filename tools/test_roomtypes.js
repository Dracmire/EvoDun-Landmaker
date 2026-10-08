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

/* ---- Diorama bubble (mock-up, P.dioBubble): the background around a Diorama room; hand-made map surrounded by void ---- */
{
  const W = 24, H = 14, R = (room, x0, y0, x1, y1) => ({ room, ter: 0, x0, y0, x1, y1 });
  const RL = fake(W, H, [R(1, 4, 3, 9, 8), R(2, 10, 5, 23, 5), R(5, 0, 5, 3, 6), R(6, 4, 0, 23, 2), R(8, 0, 3, 3, 4), R(9, 0, 7, 3, 8), R(10, 6, 9, 6, 13)], [[6, 8, 6, 9]],
    [[9, 5, 10, 5], [3, 3, 4, 3], [3, 7, 4, 7]]);
  // room 10 is a 1-wide corridor under room 1 behind a used gate (void on both sides)
  RL.h = Float32Array.from(RL.room, (r) => (r > 0 ? 1 : 0));
  const o = T.classify(RL, P0).rooms.get(1), b = T.bubble(RL, 1, 3, P0), at = (x, y) => y * W + x;
  ok('bubble: room 1 (3 doors) is a Diorama, and only a Diorama gets a bubble', o.type === T.DIORAMA && T.bubble(RL, 2, 3, P0) === null && T.bubble(RL, 6, 3, P0) === null, o.type);
  ok('bubble: radius = factor x sqrt(tiles / pi) (36 tiles -> r 3.385, R 10.155)', Math.abs(b.r - Math.sqrt(36 / Math.PI)) < 1e-9 && Math.abs(b.R - 3 * b.r) < 1e-9);
  ok('bubble: grows across CLOSED borders (the rooms above and to the left of its closed faces)', b.mask[at(6, 2)] && b.mask[at(1, 5)] && b.mask[at(5, 1)]);
  ok('bubble: never inside the room, never on void, never beyond R from the centroid', (() => { let bad = 0; for (let i = 0; i < W * H; i++) if (b.mask[i]) { const x = i % W + 0.5, y = ((i / W) | 0) + 0.5; if (RL.room[i] === 1 || RL.h[i] <= 0 || Math.hypot(x - 7, y - 6) > b.R + 1e-9) bad++; } return bad === 0; })());
  ok('bubble: never across a room transition (the corridor of room 2 behind a door, void on both sides, stays out)', !b.mask[at(10, 5)] && !b.mask[at(11, 5)] && !b.mask[at(14, 5)], [b.mask[at(10, 5)], b.mask[at(11, 5)]]);
  ok('bubble: never across a used gate (a ramp): the corridor of room 10 behind the gate stays out', !b.mask[at(6, 9)] && !b.mask[at(6, 10)], [b.mask[at(6, 9)], b.mask[at(6, 10)]]);
  ok('bubble: the faces of the perimeter add up (bubble + open + void + beyond = faces)', b.edge.bubble + b.edge.open + b.edge.void + b.edge.beyond === b.edge.faces && b.edge.open >= 3 && b.edge.faces === 24, JSON.stringify(b.edge));
  ok('bubble: off (factor 0) gives no bubble', T.bubble(RL, 1, 0, P0) === null);
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
      if (S1.roomMap[i] !== l.room) bad++;
      if (S1.ter[i] !== (l.down ? l.high : l.low)) wrongSide++;
      if (l.down ? !(hNew < hOld - 0.05 + 1e-9) : !(hNew > hOld + 0.05 - 1e-9)) thin++;           // a cut / build of at least the margin (0.05 terH): thickness > 0
      if (!(hNew > tb(l.low) && hNew < tb(l.high) + (K - 1) * sub)) band++;
    }
    ok(`${label}: ${nRing} ring tiles, every one in a claimed ring of ITS room, none on void`, nRing === S1.cake.tiles && bad === 0, [nRing, S1.cake.tiles, bad]);
    ok(`${label}: Down rings are cut into the HIGH terrace, Up rings built on the LOW one`, wrongSide === 0, wrongSide);
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
    ok('mutation: without the corridor many feet are enclosed (the test can fail)', m0.footEnclosed > 20, JSON.stringify(m0));
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
  { // Diorama as the slice with the bubble: three planes, the bubble is not walkable and takes no marks; flag off = nothing changes
    const PB = { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, base0 = run(PB), dio = [...base0.types.rooms.values()].filter((r) => r.type === T.DIORAMA).sort((p, q) => p.tiles - q.tiles), id = dio[(dio.length / 2) | 0].id;
    const a0 = run(PB, { rooms: [id], margin: 6 }), a1 = run({ ...PB, dioBubble: 3 }, { rooms: [id], margin: 6 });
    ok('bubble flag off: no bubble data on the shape', a0.bg === undefined && a0.bubbleInfo === undefined && a0.openLoops === undefined);
    ok(`bubble on (Diorama room ${id}): ${a1.bubbleInfo.tiles} background tiles around the ${a1.bubbleInfo.roomTiles} of the room, none of them in the slice, none on void`, a1.bg && a1.bubbleInfo.tiles > 0 && a1.bg.reduce((t, v) => t + v, 0) === a1.bubbleInfo.tiles && a1.bg.every((v, i) => !v || (!a1.slice[i] && !(a1.void && a1.void[i]))));
    ok('bubble: not walkable (blocked, in no region), takes no mark', a1.bg.every((v, i) => !v || (a1.block[i] === 1 && a1.region[i] < 0 && !E.tileWalkable(a1, i))));
    ok('bubble: the window is big enough for the whole bubble (grown margin)', a1.W >= a0.W && a1.H >= a0.H);
    ok('bubble: the scene is the same (walkable, main region, connections, regions)', a0.walkInfo.walkable === a1.walkInfo.walkable && a0.walkInfo.main === a1.walkInfo.main && JSON.stringify(a0.regionSizes) === JSON.stringify(a1.regionSizes) && JSON.stringify([a0.connInfo.ok, a0.connInfo.recomputed, a0.connInfo.unresolved]) === JSON.stringify([a1.connInfo.ok, a1.connInfo.recomputed, a1.connInfo.unresolved]));
    const nd = base0.types.rooms.size && [...base0.types.rooms.values()].find((r) => r.type !== T.DIORAMA), n1 = run({ ...PB, dioBubble: 3 }, { rooms: [nd.id], margin: 6 });
    ok('bubble: a room that is not a Diorama gets none', n1.bg === undefined);
    console.log(`  info: Diorama room ${id}: ${a1.bubbleInfo.roomTiles} tiles, bubble ${a1.bubbleInfo.tiles} tiles (r ${a1.bubbleInfo.r.toFixed(1)}, R ${a1.bubbleInfo.R.toFixed(1)}); perimeter faces ${JSON.stringify(a1.bubbleInfo.edge)}`);
  }
  { const sp = { rooms: [8], margin: 6 }, a = run(P0, sp), b = run({ ...P0, cake: true }, sp); check('slice = room 8', a, b);
    const whole = base.roomType, mi = (i) => (((i / b.W) | 0) + b.oy) * b.mapW + (i % b.W) + b.ox; let diff = 0; for (let i = 0; i < b.n; i++) if (b.roomType[i] !== (b.void && b.void[i] ? 0 : whole[mi(i)])) diff++;
    ok('slice: the room type of every tile equals the whole-map type (classification does not depend on the slice)', diff === 0, diff); }
  { const off = E.shape(mk(), { ...P0, rooms: false, cake: true }, null), off2 = E.shape(mk(), { ...P0, rooms: false }, null);
    ok('rooms off (cake switch on): nothing changes, no types, no cake', off.cake === undefined && off.types === undefined && off.fine.every((v, i) => v === off2.fine[i]) && JSON.stringify(off.levelH) === JSON.stringify(off2.levelH)); }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
