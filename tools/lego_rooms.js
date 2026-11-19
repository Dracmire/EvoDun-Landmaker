/* LEGO, the 88 rooms of "Balanced types" (stage_lego_go.md section 4; MEASURE ONLY, nothing in src/ changes): how many rooms step on ONE terrace (L2' does not change them), the distribution of m (the base terrace of the room, 1..3), and the borders between rooms whose terraces differ by 2 (A+2) and 3 (A+3): how many room pairs, how many tiles, and how many would have a door if the gate rule accepted two (three) terraces
   (the same rule as `transitions` of src/s3/shape.js on the nominal band of the global range: pos = the LOW tile, slope(low) - slope(high) > gateThr, 4-connected groups, groups under gateMin dropped; gap 1 is the check: it must give the groups of `E.s3.gateTransitions`).
   Uses the DAC3 constructor only. Output: JSON (argv[2]) or stdout; the markdown is written by hand into verticalidad_lego_resultado.md.
     node tools/lego_rooms.js [out.json] [default] */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/lego', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO, TYPE = { 1: 'Cake', 2: 'Diorama', 3: 'Ascension' };
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), t0 = Date.now();
  const DEF = process.argv[3] === 'default'; // PR lego2: the Default preset (5 terraces, core 20, radius 9, minPlateau 5) for the A+2 / A+3 count
  const P = { ...RT.BASE, ...(DEF ? {} : { terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }), terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
  const pack = mk(), S = E.s3.shape(pack, P, null), W = S.W, H = S.H, n = S.n, zm = E.stage.zoneMap(S);
  const ids = [...S.types.rooms.keys()].sort((a, b) => a - b), rows = [], byRoom = new Map();
  // per room: the terraces its walkable tiles step on (the levels that are not bridges), m
  for (const id of ids) byRoom.set(id, { id, terr: new Set(), tiles: 0, type: TYPE[S.types.rooms.get(id).type] });
  for (let i = 0; i < n; i++) { const r = byRoom.get(zm[i]); if (!r || S.block[i] || (S.void && S.void[i]) || !(S.region && S.region[i] >= 0) || (S.nowalk && S.nowalk[i])) continue; const mt = S.levelMeta[S.fine[i]]; if (mt.bridge || mt.deco) continue; r.terr.add(mt.ter); r.tiles++; }
  const dist = { single: 0, multi: 0, none: 0, m: { 1: 0, 2: 0, 3: 0 }, mMulti: { 1: 0, 2: 0, 3: 0 }, byType: {}, terrCount: {} };
  for (const r of byRoom.values()) {
    const ts = [...r.terr].sort((a, b) => a - b), k = ts.length, m = k ? Math.max(1, Math.min(3, ts[0] + 1)) : 0;
    r.ts = ts; r.m = m; rows.push({ id: r.id, type: r.type, tiles: r.tiles, terraces: ts.map((t) => t + 1), m, single: k === 1 });
    if (!k) dist.none++; else if (k === 1) dist.single++; else dist.multi++;
    if (k) { dist.m[m]++; if (k > 1) dist.mMulti[m]++; }
    const b = dist.byType[r.type] || (dist.byType[r.type] = { rooms: 0, single: 0, multi: 0 }); b.rooms++; if (k === 1) b.single++; else if (k > 1) b.multi++;
    dist.terrCount[k] = (dist.terrCount[k] || 0) + 1;
  }
  // borders between rooms by terrace gap (A+g), from the quantized terraces S.ter of the shape; the gate rule with gap g on the nominal band of the global range
  const q = E.s3.quantize(pack, P), fw = pack.width, thr = P.gateThr === undefined ? 0.05 : P.gateThr, minSize = P.gateMin === undefined ? 3 : P.gateMin, nU = P.terraces, [g0, g1] = q.range, bandW = (g1 - g0 || 1) / nU, raw = q.raw || pack.elevation, hh = pack.height;
  const norm = (u, x, y) => { const i = y * fw + x; return q.ter[i] === u ? Math.max(0, Math.min(1, (raw[i] - (g0 + u * bandW)) / bandW)) : 0; };
  const slope = (u, x, y) => { if (x < 1 || y < 1 || x > fw - 2 || y > hh - 2) return 0; const dx = (norm(u, x + 1, y) - norm(u, x - 1, y)) * 0.5, dy = (norm(u, x, y + 1) - norm(u, x, y - 1)) * 0.5; return Math.sqrt(dx * dx + dy * dy); };
  const gap = (g) => { // the pairs of 4-neighbour tiles exactly g terraces apart that lie in two different rooms; the candidate doors by the gate rule
    const pairs = new Map(), cand = [], seen = new Set(); let tiles = 0;
    for (let y = 0; y < hh; y++) for (let x = 0; x < fw; x++) { const i = y * fw + x, u = q.ter[i];
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= fw || yy >= hh) continue; const j = yy * fw + xx; if (q.ter[j] - u !== g) continue; // i is the LOW tile
        const li = (y - S.oy) * W + (x - S.ox), lj = (yy - S.oy) * W + (xx - S.ox); if (x - S.ox < 0 || y - S.oy < 0 || xx - S.ox < 0 || yy - S.oy < 0 || x - S.ox >= W || y - S.oy >= H || xx - S.ox >= W || yy - S.oy >= H) continue;
        const ri = zm[li], rj = zm[lj], cross = byRoom.has(ri) && byRoom.has(rj) && ri !== rj && !(S.void && (S.void[li] || S.void[lj])), key = ri < rj ? ri + '-' + rj : rj + '-' + ri;
        if (cross) { tiles++; const p = pairs.get(key) || { key, ri, rj, tiles: 0, doors: 0 }; p.tiles++; pairs.set(key, p); }
        if (!seen.has(i) && slope(u, x, y) - slope(q.ter[j], x, y) > thr) { seen.add(i); cand.push({ i, key: cross ? key : null }); } } }
    // 4-connected groups of the candidate tiles, dropped under minSize; a group is a door of the pair (the room pair of its first tile)
    const set = new Map(cand.map((c) => [c.i, c.key])), done = new Set(); let groups = 0, kept = 0, crossKept = 0; const doorsOf = new Map();
    for (const [i0] of set) { if (done.has(i0)) continue; const st = [i0], g = []; done.add(i0); while (st.length) { const t = st.pop(); g.push(t); const x = t % fw, y = (t / fw) | 0; for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= fw || yy >= hh) continue; const j = yy * fw + xx; if (set.has(j) && !done.has(j)) { done.add(j); st.push(j); } } } groups++; if (g.length >= minSize) { kept++; const ck = g.map((t) => set.get(t)).find((k) => k); if (ck) { crossKept++; doorsOf.set(ck, (doorsOf.get(ck) || 0) + 1); } } }
    for (const [key, d] of doorsOf) if (pairs.has(key)) pairs.get(key).doors = d;
    const list = [...pairs.values()], withDoor = list.filter((p) => p.doors > 0);
    return { gap: g, roomPairs: list.length, borderFaces: tiles, candidateTiles: cand.length, groups, groupsKept: kept, crossGroupsKept: crossKept, pairsWithDoor: withDoor.length, pairs: list.sort((a, b) => b.tiles - a.tiles).slice(0, 12) };
  };
  const tr1 = E.s3.gateTransitions(pack, P, 'terrace'), borders = { A1: gap(1), A2: gap(2), A3: gap(3) };
  const out = { P: { preset: DEF ? 'Default' : 'Balanced types', terraces: P.terraces, roomsMinCore: P.roomsMinCore, rRadius: P.rRadius, minPlateau: P.minPlateau, terH: P.terH, subs: 2 }, rooms: ids.length, types: { Cake: rows.filter((r) => r.type === 'Cake').length, Diorama: rows.filter((r) => r.type === 'Diorama').length, Ascension: rows.filter((r) => r.type === 'Ascension').length }, dist, borders, checkA1: { mineGroupsKept: borders.A1.groupsKept, theirs: tr1.groups.length, crossRoomGroups: borders.A1.crossGroupsKept }, seconds: (Date.now() - t0) / 1000, rows };
  const file = process.argv[2]; if (file) fs.writeFileSync(file, JSON.stringify(out, null, 1)); else console.log(JSON.stringify(out));
  console.error(`rooms ${ids.length}: single-terrace ${dist.single}, multi ${dist.multi}, none ${dist.none}; m (all) ${JSON.stringify(dist.m)}, m (multi) ${JSON.stringify(dist.mMulti)}; A+1 check ${borders.A1.groupsKept} vs ${tr1.groups.length}; A+2 ${JSON.stringify({ pairs: borders.A2.roomPairs, faces: borders.A2.borderFaces, groups: borders.A2.groupsKept, cross: borders.A2.crossGroupsKept, withDoor: borders.A2.pairsWithDoor })}; A+3 ${JSON.stringify({ pairs: borders.A3.roomPairs, faces: borders.A3.borderFaces, groups: borders.A3.groupsKept, cross: borders.A3.crossGroupsKept, withDoor: borders.A3.pairsWithDoor })}; ${out.seconds} s`);
})().catch((e) => { console.error(e); process.exit(1); });
