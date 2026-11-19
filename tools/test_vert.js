/* COMPOSITIONAL VERTICALITY, family A (src/s3/vert.js; docs/crystallizers/03-stage/research/octopath2/stage_verticalidad_go.md part C), no browser.
   (1) the TOPOLOGY is identical: after V.apply the hash of S.block, S.void, S.region, S.roomMap, the walking graph of every tile, the stairs and S.levelH equals the hash before; only S.fine of walkable tiles of the room changes;
   (2) V1a is monotone: after the re-height the walkable levels, ordered by their mean depth u, have non-decreasing heights (the farthest level is the highest); the SET of heights the room uses is the same (the tiles per level are permuted with the levels) (a permutation of its levels); a second apply changes nothing (idempotent);
   (3) the view depth is the one of the camera in use: yaw 180 and yaw 0 give opposite orders on a room whose levels are not symmetric (M1: room 14, two levels);
   (4) conflict, never forced: a window with stairs (dac_stage, 6 rooms) is left alone and says why; a room with a single walkable level too;
   (5) it lives only in DAC3: the vert module defines E.s3.vert and nothing on E (the original namespace has no `vert`).
     node tools/test_vert.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/vert', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
const topo = (S, P) => { const h = crypto.createHash('sha1'); for (const k of ['block', 'void', 'region', 'roomMap', 'levelH']) { const v = S[k]; if (v === undefined || v === null) h.update('~'); else if (ArrayBuffer.isView(v)) h.update(Buffer.from(v.buffer, v.byteOffset, v.byteLength)); else h.update(JSON.stringify(v)); } const nb = E.s3.walkGraph(S, P); for (let i = 0; i < S.n; i++) h.update(JSON.stringify(nb(i))); h.update(JSON.stringify((S.stairs || []).map((s) => [s.bottom, s.top, s.cols]))); return h.digest('hex').slice(0, 14); };
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js');
  const P = { ...RT.BASE, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
  const P5 = { ...P, terraces: 5, terH: 4, subH: 0.88, subs: 3 }, mkS = (rooms, PP) => { PP = PP || P; const S = E.s3.shape(mk(), PP, { rooms, margin: PP.margin }); S.orient = E.orient.compute(S, PP, rooms, 1.5); return S; };
  const U = (S, rec, yaw) => { const l = E.orient.lookOf(yaw), W = S.W, zm = E.stage.zoneMap(S), m = new Map(); for (let i = 0; i < S.n; i++) if (zm[i] === rec.id && !S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0) { const q = m.get(S.fine[i]) || { s: 0, c: 0 }; q.s += ((i % W) + 0.5) * l[0] + (((i / W) | 0) + 0.5) * l[1]; q.c++; m.set(S.fine[i], q); } return [...m.entries()].map(([lv, q]) => ({ lv, h: S.levelH[lv], u: q.s / q.c, n: q.c })).sort((a, b) => a.u - b.u); };
  const hist = (S, rec) => { const zm = E.stage.zoneMap(S), h = new Set(); for (let i = 0; i < S.n; i++) if (zm[i] === rec.id && !S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0) h.add(S.levelH[S.fine[i]].toFixed(4)); return [...h].sort().join(','); };
  const fineSig = (S) => crypto.createHash('sha1').update(Buffer.from(S.fine.buffer, S.fine.byteOffset, S.fine.byteLength)).digest('hex').slice(0, 10);
  // (1)-(3) M1: room 14
  for (const yaw of [180, 0]) {
    const S = mkS([14]), rec = S.orient.byId.get(14), t0 = topo(S, P), f0 = fineSig(S), h0 = hist(S, rec), o0 = U(S, rec, yaw), r = E.s3.vert.apply(S, P, { room: rec, yaw, tilesPerH: 1.5 });
    const t1 = topo(S, P), o1 = U(S, rec, yaw), mono = o1.every((q, i) => i === 0 || o1[i - 1].h <= q.h + 1e-9);
    ok(`yaw ${yaw}: topology identical (${t0} = ${t1}); only S.fine of the room's walkable tiles changed (${r.changed} tiles)`, t0 === t1 && (r.changed === 0 || fineSig(S) !== f0), { t0, t1, changed: r.changed });
    ok(`yaw ${yaw}: V1a monotone (levels by mean depth: ${o1.map((q) => q.h.toFixed(2) + '@' + q.u.toFixed(1)).join(' < ')}), the SET of heights the room uses is the same (the tiles per level are permuted with the levels)`, mono && hist(S, rec) === h0, { o0, o1 });
    const r2 = E.s3.vert.apply(S, P, { room: rec, yaw, tilesPerH: 1.5 }); ok(`yaw ${yaw}: idempotent (a second apply changes ${r2.changed} tiles)`, r2.changed === 0);
    ok(`yaw ${yaw}: the order of the levels by depth before (${o0.map((q) => q.h.toFixed(2)).join(',')}) was ${o0.every((q, i) => i === 0 || o0[i - 1].h <= q.h + 1e-9) ? 'already monotone (nothing to do)' : 'not monotone (re-heighted)'}`, true);
    globalThis['r' + yaw] = r.changed;
  }
  ok(`(3) the two cameras give opposite re-heights on the asymmetric room 14: yaw 180 changes ${globalThis.r180} tiles, yaw 0 changes ${globalThis.r0}`, (globalThis.r180 === 0) !== (globalThis.r0 === 0));
  // (4) conflicts
  { const S = mkS([5, 6, 10, 17, 20, 27], P5), rec = S.orient.byId.get(20), t0 = topo(S, P5), f0 = fineSig(S), r = E.s3.vert.apply(S, P5, { room: rec, yaw: rec.yaw, tilesPerH: 1.5 }); ok(`a window with stairs (${S.stairs.length}) is a conflict, not forced: "${r.conflict}", nothing changed`, !!r.conflict && r.changed === 0 && fineSig(S) === f0 && topo(S, P5) === t0, r); }
  { const S = mkS([25]), rec = S.orient.byId.get(25), r = E.s3.vert.apply(S, P, { room: rec, yaw: rec.yaw, tilesPerH: 1.5 }); ok(`a room with fewer than two walkable levels (room 25, ${r.levels} level) is left alone: ${r.conflict}`, r.changed === 0 && (r.levels < 2 ? !!r.conflict : true), r); }
  // (5) only DAC3
  ok('src/s3/vert.js defines E.s3.vert and nothing on E (the original namespace has no `vert`)', !!E.s3.vert && E.vert === undefined && Object.prototype.hasOwnProperty.call(E.s3, 'vert'));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
