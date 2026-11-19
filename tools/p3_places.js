/* PR pend P3 (prompt_pendientes_go.md): the FOUR PLACES as fixed tile boxes of the map and, per terrace count (3, 5, 7, 9), what the box is made of: the rooms that cut it (the window of the shots), the terraces its walkable tiles step on, m (the lowest terrace of the box, 1..3, the same rule as tools/lego_rooms.js) and the share of the box that is void / not walkable.
   Measure only; DAC3 constructor only. Writes the JSON (argv[2]) the shots tool reads.   node tools/p3_places.js <out.json> */
const fs = require('fs'), vm = require('vm'); global.window = global;
const R = __dirname + '/../';
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/lego', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(R + `src/${f}.js`, 'utf8'), { filename: f });
const E = window.EVO;
// the boxes are the tight boxes of the named rooms at their home setting (x0, y0, x1, y1 in map tiles); u2 = DAC 29 of Balanced types at 3 terraces, the example perfil_u2
const PLACES = [
  { id: 'r21_default9', name: 'Room 21 of Default 9 (plaza?)', preset: 'Default', home: 9, room: 21, box: [107, 185, 136, 222] },
  { id: 'r16_default9', name: 'Room 16 of Default 9 (gorge?)', preset: 'Default', home: 9, room: 16, box: [114, 30, 119, 47] },
  { id: 'r79_balanced9', name: 'Room 79 of Balanced 9 (valley)', preset: 'Balanced', home: 9, room: 79, box: [142, 116, 204, 172] },
  { id: 'u2_balanced3', name: 'u2 (DAC 29, Cake) of Balanced 3', preset: 'Balanced', home: 3, room: 29, box: [93, 113, 117, 134] }];
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), out = { places: [] };
  for (const pl of PLACES) {
    const row = { ...pl, cases: {} };
    for (const T of [3, 5, 7, 9]) {
      const P = { ...RT.BASE, ...(pl.preset === 'Balanced' ? { roomsMinCore: 100, rRadius: 5, minPlateau: 120 } : {}), terraces: T, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
      const S = E.s3.shape(mk(), P, null), zm = E.stage.zoneMap(S), W = S.W, [x0, y0, x1, y1] = pl.box, rooms = new Map(), ter = new Set(); let tiles = 0, walk = 0, voidT = 0, nowalk = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y - S.oy) * W + (x - S.ox); if (i < 0 || i >= S.n || x - S.ox < 0 || x - S.ox >= W) continue; tiles++; const r = zm[i]; if (r) rooms.set(r, (rooms.get(r) || 0) + 1);
        if (S.void && S.void[i]) { voidT++; continue; } const w = !S.block[i] && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]); if (!w) { nowalk++; continue; } walk++; const mt = S.levelMeta[S.fine[i]]; if (!mt.bridge && !mt.deco) ter.add(mt.ter); }
      const ts = [...ter].sort((a, b) => a - b), m = ts.length ? Math.max(1, Math.min(3, ts[0] + 1)) : 0;
      row.cases[T] = { rooms: [...rooms.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, tilesInBox: n })), roomIds: [...rooms.keys()].sort((a, b) => a - b), terraces: ts.map((t) => t + 1), m, boxTiles: tiles, walkable: walk, void: voidT, notWalkable: nowalk, homeRoomStillExists: rooms.has(pl.room), roomsTotal: S.types ? S.types.rooms.size : null };
    }
    out.places.push(row); console.error(pl.id, JSON.stringify(Object.fromEntries(Object.entries(row.cases).map(([T, c]) => [T, { rooms: c.roomIds.join(','), terr: c.terraces.join(''), m: c.m }]))));
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
