/* PR Q3: the platforms of the places (measure only): per place box of docs/crystallizers/03-stage/shots/p3_places.json (the rooms that cut it) at its terrace count, the platforms of those rooms, their flow type, the ROAD platforms and the ELBOWS (src/s3/platforms.js). Writes the JSON (argv[2]).
     node tools/platforms_table.js <out.json> [--all] */
const fs = require('fs'), vm = require('vm'); global.window = global; const R = __dirname + '/../';
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/platforms', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(R + `src/${f}.js`, 'utf8'), { filename: f });
const E = window.EVO, P3 = JSON.parse(fs.readFileSync(R + 'docs/crystallizers/03-stage/shots/p3_places.json', 'utf8')).places;
const CASES = [['r21_default9', 3], ['r21_default9', 9], ['r16_default9', 7], ['r16_default9', 9], ['r79_balanced9', 5]];
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), out = { cases: {} };
  for (const [id, T] of CASES) { const pl = P3.find((p) => p.id === id), t0 = Date.now();
    const P = { ...RT.BASE, ...(pl.preset === 'Balanced' ? { roomsMinCore: 100, rRadius: 5, minPlateau: 120 } : {}), terraces: T, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
    const pack = mk(), S = E.s3.shape(pack, P, null), RL = S.rooms || E.s3.rooms.layer(pack, P), ids = pl.cases[T].rooms.map((r) => r.id), ori = E.orient.compute(S, P, ids, 1.5), yawOf = (r) => (ori.byId.get(r) ? ori.byId.get(r).yaw : 0);
    const res = E.s3.platforms.compute(RL, { only: ids, yawOf }), tiles = (p) => p.tiles.length;
    const rows = ids.map((r) => { const v = res.rooms.get(r); return v ? { room: r, yaw: yawOf(r), platforms: v.platforms.length, tiles: v.platforms.reduce((s, p) => s + tiles(p), 0), flow: v.flow, road: v.road.map((s) => s.length), roadPaths: v.road.length, elbows: v.elbows, bySource: { room: v.platforms.filter((p) => p.src === 'room').length, flow: v.platforms.filter((p) => p.src === 'flow').length } } : { room: r, yaw: yawOf(r), platforms: 0 }; });
    out.cases[`${id}|T${T}`] = { counts: res.counts, ms: res.ms, discardedRoomSeeds: res.discardedRoomSeeds.length, rows, seconds: (Date.now() - t0) / 1000 };
    console.log(id, T, JSON.stringify(res.counts), 's', (Date.now() - t0) / 1000, '\n  ', rows.map((r) => `r${r.room}: ${r.platforms}p ${r.platforms ? Object.values(r.flow).join('/') : ''} road ${r.roadPaths || 0} elbows ${r.elbows || 0}`).join(' | ')); }
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
