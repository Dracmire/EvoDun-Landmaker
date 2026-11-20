/* PR Q2 (D5 of [U]): the lego stretches only the BASE. (1) the cap of m is a function of the terrace count, one place: m <= round(T / 2) + 1 (3 -> 3, 5 -> 4, 7 -> 5, 9 -> 6; unknown T -> the old 3); (2) with `midH` the planes read the hero's room from the ground BEFORE the lego (floorHigh = the Mid top, the back wall 3 H over it), without it (the old behaviour) from the raised top; (3) the same planes call without lego (no midH) is E.planes byte for byte (tools/test_frame.js covers the clone).
     node tools/test_lego_base.js */
const fs = require('fs'), path = require('path'), vm = require('vm'); global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/vert', 's3/lego', 'planes', 's3/planes', 's3/frame', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO; let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS ' + n); } else { fail++; console.log('FAIL ' + n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
(async () => {
  const L = E.s3.lego; ok('(1) mMax: 3 -> 3, 5 -> 4, 7 -> 5, 9 -> 6, unknown -> 3', [3, 5, 7, 9].map(L.mMax).join() === '3,4,5,6' && L.mMax(undefined) === 3, [3, 5, 7, 9].map(L.mMax));
  ok('(1) mOf uses it: the base terrace 6 gives m 6 at 9 terraces and 3 at 3', L.mOf([{ t: 5 }], 9) === 6 && L.mOf([{ t: 5 }], 3) === 3 && L.mOf([{ t: 5 }]) === 3);
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js');
  const P = { ...RT.BASE, terraces: 9, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true }, ROOM = 21;
  const run = (useMid) => { const S = E.s3.shape(mk(), P, { rooms: [ROOM], margin: P.margin }); S.orient = E.orient.compute(S, P, [ROOM], 1.5); const rec = S.orient.byId.get(ROOM), mid = Float32Array.from(S.fine, (l) => S.levelH[l]);
    const li = L.apply(S, P, { room: rec, yaw: rec.yaw, treatment: 'up', tilesPerH: 1.5 }), pl = E.s3.planes.apply(S, { room: rec, yaw: rec.yaw, tilesPerH: 1.5, exag: 1, midH: useMid ? mid : undefined }); return { li, pl, mid, S }; };
  const A = run(true), B = run(false);
  ok(`(2) the lego raised the room (m ${A.li.m}, ${A.li.moved} tiles) and the planes read the MID top with midH (floorHigh ${A.pl.floorHigh.toFixed(3)}) but the raised one without (${B.pl.floorHigh.toFixed(3)})`, A.li.m >= 2 && A.li.moved > 0 && A.pl.floorHigh < B.pl.floorHigh - 1e-6, { a: A.pl.floorHigh, b: B.pl.floorHigh });
  const zm = E.stage.zoneMap(A.S); let midHigh = -1e9; for (let i = 0; i < A.S.n; i++) if (zm[i] === ROOM && !A.S.block[i] && !(A.S.void && A.S.void[i]) && A.S.region[i] >= 0) midHigh = Math.max(midHigh, A.mid[i]);
  ok(`(2) floorHigh with midH is exactly the highest Mid ground of the room (${midHigh.toFixed(3)})`, Math.abs(A.pl.floorHigh - midHigh) < 1e-6, { f: A.pl.floorHigh, m: midHigh });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
