/* NEIGHBOURS AS FRAME (src/s3/frame.js + src/s3/planes.js; PR pend P4), no browser:
   (1) E.s3.planes.apply WITHOUT `skip` is byte for byte E.planes.apply (levels, heights, the planes info);
   (2) with the neighbour skip mask no tile of a neighbouring room gets a wall / column / lowering by the planes;
   (3) with Up the neighbours are re-heighted by their own lego (some tile of a neighbour changes height) and the topology (block, void, region, roomMap, stairs) and the hero's room are identical to the switch off;
   (4) nothing of this file touches E / E.roomTypes of the original chain (E.frame undefined, E.s3.frame defined).
     node tools/test_frame.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/vert', 's3/lego', 'planes', 's3/planes', 's3/frame', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
const h = (S, keys) => { const x = crypto.createHash('sha1'); for (const k of keys) { const v = S[k]; if (v === undefined || v === null) x.update('~'); else if (ArrayBuffer.isView(v)) x.update(Buffer.from(v.buffer, v.byteOffset, v.byteLength)); else x.update(JSON.stringify(v)); } return x.digest('hex').slice(0, 12); };
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js');
  const P = { ...RT.BASE, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
  const PD = { ...RT.BASE, terraces: 9, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true }; /* Default 9: the neighbours of room 21 step on 2-4 terraces with m 2-3 (in Balanced 3 every neighbour of room 29 has m = 1 and Up changes nothing by design) */
  const PP = process.env.FRAME_BAL ? P : PD, ROOM = process.env.FRAME_BAL ? 29 : 21, mkS = () => { const S = E.s3.shape(mk(), PP, { rooms: [ROOM], margin: PP.margin }); S.orient = E.orient.compute(S, PP, [ROOM], 1.5); return S; };
  const levels = (S) => h(S, ['fine', 'levelH']) + '|' + JSON.stringify(S.levelMeta.map((m) => m.plane || '')).length;
  { const A = mkS(), B = mkS(), rec = A.orient.byId.get(ROOM), o = { room: rec, yaw: rec.yaw, tilesPerH: 1.5, exag: 1 };
    const ia = E.planes.apply(A, o), ib = E.s3.planes.apply(B, o);
    ok(`(1) E.s3.planes.apply without skip == E.planes.apply (levels ${levels(A)} == ${levels(B)}, info ${JSON.stringify(ia).length} == ${JSON.stringify(ib).length})`, levels(A) === levels(B) && JSON.stringify(ia) === JSON.stringify(ib) && h(A, ['fine']) === h(B, ['fine'])); }
  for (const treat of ['mid', 'up']) {
    const base = mkS(), rec = base.orient.byId.get(ROOM), o = { room: rec, yaw: rec.yaw, tilesPerH: 1.5, exag: 1 };
    const F = mkS(); const fr = E.s3.frame.apply(F, PP, { room: rec, yaw: rec.yaw, treatment: treat, tilesPerH: 1.5 });
    ok(`(2) ${treat}: ${fr.ids.length} neighbouring rooms (${fr.ids.join(',')}), ${fr.tiles} tiles in the skip mask`, fr.ids.length > 0 && fr.tiles > 0);
    const hBefore = Float64Array.from(F.fine, (l) => F.levelH[l]); E.s3.planes.apply(F, { ...o, skip: fr.skip });
    let touched = 0; for (let i = 0; i < F.n; i++) if (fr.skip[i] && F.levelH[F.fine[i]] !== hBefore[i]) touched++;
    ok(`(2) ${treat}: the planes touch 0 of the skipped neighbour tiles (${touched})`, touched === 0);
    const P0 = mkS(); E.s3.planes.apply(P0, o); let nd = 0; for (let i = 0; i < F.n; i++) if (fr.skip[i] && P0.levelH[P0.fine[i]] !== hBefore[i]) nd++;
    ok(`(2) ${treat}: control: without skip the planes DO change ${nd} of those tiles (the test can fail)`, nd > 0);
    if (treat === 'up') { let moved = 0; const M = mkS(); for (let i = 0; i < M.n; i++) if (fr.skip[i] && F.levelH[F.fine[i]] !== M.levelH[M.fine[i]]) moved++; // planes did not touch them, so any difference against the untouched shape is lego
      ok(`(3) up: ${fr.rooms.length} neighbours re-heighted by their own lego, ${moved} tiles at another height (moved by rooms: ${JSON.stringify(fr.rooms.map((r) => [r.id, r.m, r.moved]))})`, fr.rooms.length > 0 && moved > 0);
      ok('(3) topology (block, void, region, roomMap) identical to the switch off', h(F, ['block', 'void', 'region', 'roomMap']) === h(M, ['block', 'void', 'region', 'roomMap']) && F.region.every((v, i) => v === M.region[i]));
      let hero = 0; const zm = E.stage.zoneMap(F); for (let i = 0; i < F.n; i++) if (zm[i] === ROOM && F.levelH[F.fine[i]] !== M.levelH[M.fine[i]]) hero++; ok(`(3) the hero's room is not touched by the frame (${hero} tiles differ)`, hero === 0); } }
  ok('(4) E.s3.frame and E.s3.planes exist, E.frame is not defined on the original namespace', !!E.s3.frame && !!E.s3.planes && E.frame === undefined && Object.prototype.hasOwnProperty.call(E.s3, 'frame') && Object.prototype.hasOwnProperty.call(E.s3, 'planes'));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
