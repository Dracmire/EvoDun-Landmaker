/* LEGO VERTICALITY BY TERRACE, rule L2' (src/s3/lego.js; docs/crystallizers/03-stage/research/octopath2/verticalidad_lego.md 7b, stage_lego_go.md), no browser.
   (1) Mid (and an absent treatment) is the viewer of today: the shape is NOT touched (hash of the whole shape state before = after, and `lego.apply` with 'mid' changes nothing);
   (2) the TOPOLOGY is identical in Up and Down: the hash of S.block, S.void, S.region, S.roomMap, the stairs' tiles and the walkable set before = after; only the heights of the room's levels change (`S.levelH` grows by the inserted levels);
   (3) Up: the jumps between consecutive walkable terraces of the room are m * E (m = the base terrace of the room, 1..3, E = P.terH), the lowest terrace stays; Down: the highest stays and the others fall m * E per jump; the sub-terraces keep their own steps;
   (4) a room on ONE terrace gains nothing: `single`, nothing changed; idempotent guard (a second apply over the same S is not run by the viewer: the ramp ends are guarded);
   (5) DOWN scenery: the closing wall of planes falls m * E below the top of the room; UP: the planes wall is `wallH` H over the new top (2-3 E);
   (6) it lives only in DAC3: E.s3.lego, nothing on E.
     node tools/test_lego.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/vert', 's3/lego', 'stage', 'orient', 'planes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const sha = (S, keys) => { const h = crypto.createHash('sha1'); for (const k of keys) { const v = S[k]; if (v === undefined || v === null) h.update('~'); else if (ArrayBuffer.isView(v)) h.update(Buffer.from(v.buffer, v.byteOffset, v.byteLength)); else h.update(JSON.stringify(v)); } return h.digest('hex').slice(0, 12); };
const TOPO = ['block', 'void', 'region', 'roomMap'];
const topo = (S) => sha(S, TOPO) + '|' + crypto.createHash('sha1').update(JSON.stringify((S.stairs || []).map((r) => [r.mode, r.dir, r.cols, r.site && r.site.a, r.site && r.site.b, r.bottom, r.top]))).digest('hex').slice(0, 8);
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js');
  const P = { ...RT.BASE, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
  const mkS = (rooms) => { const S = E.s3.shape(mk(), P, { rooms, margin: P.margin }); S.orient = E.orient.compute(S, P, rooms, 1.5); return S; };
  const walkSet = (S, rec) => L.walk(S, rec);
  const L = { walk: (S, rec) => { const zm = E.stage.zoneMap(S), out = []; for (let i = 0; i < S.n; i++) if (zm[i] === rec.id && !S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0) out.push(i); return out; } };
  const tl = (S, rec) => E.s3.lego.terraces(S, P, rec, rec.yaw);
  // pick rooms: a room that steps on >= 2 terraces for every m (1, 2, 3), and a single-terrace one
  const cands = [14, 19, 44, 20, 7, 30, 31, 10, 17, 27, 6, 5, 60, 85, 88], info = [];
  for (const id of cands) { const S = mkS([id]), rec = S.orient.byId.get(id); if (!rec) continue; const t = tl(S, rec); info.push({ id, terr: t.map((q) => q.t), m: E.s3.lego.mOf(t) }); }
  console.log('rooms:', JSON.stringify(info));
  const multi = info.filter((x) => x.terr.length >= 2), single = info.find((x) => x.terr.length === 1);
  ok(`the sample has rooms on 2+ terraces (${multi.map((x) => x.id + ':m' + x.m).join(' ')}) and a single-terrace one (${single && single.id})`, multi.length >= 2 && !!single, info);
  for (const x of multi.slice(0, 4)) {
    const id = x.id;
    for (const tr of ['up', 'down']) {
      const S = mkS([id]), rec = S.orient.byId.get(id), t0 = topo(S), h0 = sha(S, ['fine', 'levelH']), tt = tl(S, rec), m = E.s3.lego.mOf(tt), w0 = walkSet(S, rec).length, lowOld = tt[0].base, highOld = tt[tt.length - 1].base;
      const r = E.s3.lego.apply(S, P, { room: rec, yaw: rec.yaw, treatment: tr, tilesPerH: 1.5 }), t1 = topo(S), tn = tl(S, rec);
      ok(`room ${id} ${tr}: topology identical (${t0} = ${t1}), the walkable set is the same (${w0} tiles), ${r.moved} tiles moved to ${r.levelsAdded} new levels, m = ${m} (base terrace ${tt[0].t + 1})`, t0 === t1 && walkSet(S, rec).length === w0 && sha(S, ['fine', 'levelH']) !== h0, { t0, t1, r });
      // the jumps measured on the NEW heights of the room's own terraces (the base of each terrace = the lowest level of its tiles; the terrace ids are the old ones)
      const zm = E.stage.zoneMap(S), minH = new Map(); for (const i of walkSet(S, rec)) { const mt = S.levelMeta[S.fine[i]]; if (mt.bridge || mt.deco) continue; const h = S.levelH[S.fine[i]]; if (!minH.has(mt.ter) || h < minH.get(mt.ter)) minH.set(mt.ter, h); }
      const ts = [...minH.keys()].sort((a, b) => a - b), jumps = ts.slice(1).map((t, k) => minH.get(t) - minH.get(ts[k]));
      ok(`room ${id} ${tr}: ${jumps.length} jump(s) between its walkable terraces measure m * E = ${(m * P.terH).toFixed(3)}: [${jumps.map((j) => j.toFixed(3)).join(', ')}]`, jumps.length === tt.length - 1 && jumps.every((j) => Math.abs(j - m * P.terH) < 0.02), { jumps, m });
      const lo = Math.min(...[...minH.values()]), hi = Math.max(...[...minH.values()]);
      ok(`room ${id} ${tr}: ${tr === 'up' ? 'the lowest terrace stays (' + lo.toFixed(3) + ' = ' + lowOld.toFixed(3) + ')' : 'the highest terrace stays (' + hi.toFixed(3) + ' = ' + highOld.toFixed(3) + ')'}`, tr === 'up' ? Math.abs(lo - lowOld) < 0.02 : Math.abs(hi - highOld) < 0.02, { lo, hi, lowOld, highOld });
    }
  }
  // (1) Mid / absent: nothing
  { const id = multi[0].id, S = mkS([id]), rec = S.orient.byId.get(id), a = sha(S, ['fine', 'levelH', 'levelMeta', ...TOPO]), r = E.s3.lego.apply(S, P, { room: rec, yaw: rec.yaw, treatment: 'mid', tilesPerH: 1.5 }), r2 = E.s3.lego.apply(S, P, { room: rec, yaw: rec.yaw, treatment: undefined, tilesPerH: 1.5 }); ok(`Mid and an absent treatment leave the shape byte for byte (${a} = ${sha(S, ['fine', 'levelH', 'levelMeta', ...TOPO])}, ${r.moved + r2.moved} tiles moved)`, a === sha(S, ['fine', 'levelH', 'levelMeta', ...TOPO]) && r.moved === 0 && r2.moved === 0); }
  // (4) PR lego3 (A539): a room on ONE terrace gets the SUB-LEVEL lego: the sub-levels are m times higher (Up: the lowest stays; Down: the highest stays), the level RANKING and the topology are the same
  if (single) for (const tr of ['up', 'down']) { const S = mkS([single.id]), rec = S.orient.byId.get(single.id), t0 = topo(S), q = tl(S, rec)[0], before = walkSet(S, rec).map((i) => S.levelH[S.fine[i]]), r = E.s3.lego.apply(S, P, { room: rec, yaw: rec.yaw, treatment: tr, tilesPerH: 1.5 }), after = walkSet(S, rec).map((i) => S.levelH[S.fine[i]]), t1 = topo(S);
    const lo0 = Math.min(...before), hi0 = Math.max(...before), lo1 = Math.min(...after), hi1 = Math.max(...after), m = r.m;
    let rank = true; { const idx = walkSet(S, rec).map((_, k) => k).sort((a, b) => before[a] - before[b] || a - b); for (let k = 1; k < idx.length; k++) if (after[idx[k]] < after[idx[k - 1]] - 1e-9) rank = false; }
    ok(`room ${single.id} (one terrace, m = ${m}) ${tr}: sub-level lego: single + sub, ${r.moved} tiles moved, the span of the sub-levels ${(hi0 - lo0).toFixed(3)} -> ${(hi1 - lo1).toFixed(3)} (x ${m}), ${tr === 'up' ? 'lowest' : 'highest'} stays, the ranking of the levels and the topology are identical (${t0} = ${t1})`, r.single && r.sub && r.moved > 0 && Math.abs((hi1 - lo1) - m * (hi0 - lo0)) < 0.02 && (tr === 'up' ? Math.abs(lo1 - lo0) < 0.02 : Math.abs(hi1 - hi0) < 0.02) && rank && t0 === t1, { r, lo0, hi0, lo1, hi1, rank }); }
  // (5) PR lego3 (A537): the stairs of a room with m >= 2 get half the depth; a room with m = 1 or on one terrace is left as it was
  { const S = mkS([29]), rec = S.orient.byId.get(29), P29 = { ...P, cake: true }, S2 = E.s3.shape(mk(), P29, { rooms: [29], margin: P.margin }); S2.orient = E.orient.compute(S2, P29, [29], 1.5); const rec2 = S2.orient.byId.get(29);
    const adj = E.s3.lego.adjustP(S2, P29, { room: rec2, yaw: rec2.yaw, treatment: 'up', cakeLego: 'rest' }), adjS = E.s3.lego.adjustP(S2, P29, { room: rec2, yaw: rec2.yaw, treatment: 'up', cakeLego: 'scale' }), none = E.s3.lego.adjustP(S2, P29, { room: rec2, yaw: rec2.yaw, treatment: 'mid', cakeLego: 'scale' });
    ok(`stairs: DAC 29 (m = ${adj && adj.info.m}): ${adj && adj.info.stairs} stair, ${adj && adj.info.lenBefore} -> ${adj && adj.info.depthAfter} tiles (half, minimum 1), carved as ramps (stairStyle ${adj && adj.P2.stairStyle}); Rest keeps cakeLayers (${adj && adj.P2.cakeLayers})`, adj && adj.info.m === 2 && adj.info.stairs >= 1 && adj.info.depthAfter === Math.max(1, Math.ceil(adj.info.lenBefore / 2)) && adj.P2.stairStyle === 1 && adj.P2.cakeLayers === P29.cakeLayers, adj);
    ok(`Cake under lego: Scale multiplies the rings by m (${adjS && adjS.info.cakeLayersBefore} -> ${adjS && adjS.info.cakeLayersAfter}); Mid gives nothing to change (${none})`, adjS && adjS.info.cakeLayersAfter === adjS.info.cakeLayersBefore * 2 && adjS.P2.cakeLayers === 6 && none === null, adjS);
    const SR = E.s3.shape(mk(), adj.P2, { rooms: [29], margin: P.margin }); SR.orient = E.orient.compute(SR, adj.P2, [29], 1.5); const ring0 = SR.ringTile ? SR.levelH.length : 0, rh = []; for (let i = 0; i < SR.n; i++) if (SR.ringTile && SR.ringTile[i]) rh.push(SR.levelH[SR.fine[i]]);
    E.s3.lego.apply(SR, adj.P2, { room: SR.orient.byId.get(29), yaw: SR.orient.byId.get(29).yaw, treatment: 'up', tilesPerH: 1.5 }); const rh2 = []; for (let i = 0; i < SR.n; i++) if (SR.ringTile && SR.ringTile[i]) rh2.push(SR.levelH[SR.fine[i]]);
    ok(`the Cake ring tiles are never re-heighted by lego (${rh.length} ring tiles, heights ${rh.every((h, k) => Math.abs(h - rh2[k]) < 1e-9) ? 'identical' : 'CHANGED'})`, rh.length > 0 && rh.every((h, k) => Math.abs(h - rh2[k]) < 1e-9), { n: rh.length });
    const aSingle = E.s3.lego.adjustP(mkS([14]), P, { room: mkS([14]).orient.byId.get(14), treatment: 'up', cakeLego: 'scale' }); ok('a room on one terrace gets no stair / ring change (adjustP null)', aSingle === null); }
  // (5) scenery: Down lowers the planes wall, Up leaves it wallH over the new top
  { const id = multi.find((x) => x.m >= 1).id; const tp = 1.5;
    const run = (tr) => { const S = mkS([id]), rec = S.orient.byId.get(id); const r = E.s3.lego.apply(S, P, { room: rec, yaw: rec.yaw, treatment: tr, tilesPerH: tp }); E.planes.apply(S, { room: rec, yaw: rec.yaw, tilesPerH: tp, exag: 1 }); const sc = E.s3.lego.scenery(S, P, {}); let wallTop = -1e9, wallN = 0; for (let i = 0; i < S.n; i++) { const mt = S.levelMeta[S.fine[i]]; if (mt && mt.plane === 'wall') { wallTop = Math.max(wallTop, S.levelH[S.fine[i]]); wallN++; } } return { r, sc, S, wallTop, wallN, high: S.stagePlanes ? S.stagePlanes.floorHigh : null }; };
    const up = run('up'), dn = run('down'), mid = run('mid');
    const E1 = P.terH;
    ok(`Up: the planes wall sits ${((up.wallTop - up.high) / E1).toFixed(2)} E over the new top of the room (2-3 E)`, up.wallN > 0 && (up.wallTop - up.high) / E1 >= 2 - 1e-6 && (up.wallTop - up.high) / E1 <= 3 + 1e-6, { up: [up.wallTop, up.high, up.wallN] });
    ok(`Down: the wall falls to m * E = ${dn.r.m * E1} below the top of the room (${(dn.wallTop - dn.high).toFixed(3)}), ${dn.sc.lowered} tiles lowered; Mid keeps the wall at 3 H (${(mid.wallTop - mid.high).toFixed(3)} = ${3 * tp})`, dn.wallN === 0 || (Math.abs((dn.wallTop - dn.high) + dn.r.m * E1) < 0.02 && dn.sc.lowered > 0) && Math.abs((mid.wallTop - mid.high) - 3 * tp) < 0.02, { dn: [dn.wallTop, dn.high, dn.wallN, dn.sc], mid: [mid.wallTop, mid.high] });
  }
  // (7) PR lego2 (A531): a jump that crosses D terraces measures m * E * D
  { const Eh = 1.875, base = (t) => t * Eh, mk2 = (ts) => ts.map((t) => ({ t, base: base(t), top: base(t) + 0.4125, n: 10, u: t })), f = E.s3.lego.newBases;
    const a = f(mk2([0, 2]), 1, Eh, 'up'), b = f(mk2([0, 1, 3]), 2, Eh, 'up'), c = f(mk2([1, 3]), 3, Eh, 'down'), d = f(mk2([0, 1]), 2, Eh, 'up');
    ok(`Up, m = 1, terraces 1 and 3 (D = 2): the jump is m * E * D = 2 E (${(a[1] - a[0]).toFixed(3)}), not squeezed to E`, Math.abs(a[1] - a[0] - 2 * Eh) < 1e-9, a);
    ok(`Up, m = 2, terraces 1, 2, 4: jumps m * E * D = 2 E (D = 1) and 4 E (D = 2) (${(b[1] - b[0]).toFixed(3)}, ${(b[2] - b[1]).toFixed(3)})`, Math.abs(b[1] - b[0] - 2 * Eh) < 1e-9 && Math.abs(b[2] - b[1] - 4 * Eh) < 1e-9, b);
    ok(`Down, m = 3, terraces 2 and 4 (D = 2): the highest stays (${c[1].toFixed(3)} = ${base(3).toFixed(3)}) and the lower falls m * E * D = 6 E (${(c[1] - c[0]).toFixed(3)})`, Math.abs(c[1] - base(3)) < 1e-9 && Math.abs(c[1] - c[0] - 6 * Eh) < 1e-9, c);
    ok(`adjacent terraces (D = 1) give the jump of the first pass, m * E (${(d[1] - d[0]).toFixed(3)})`, Math.abs(d[1] - d[0] - 2 * Eh) < 1e-9, d); }
  ok('src/s3/lego.js defines E.s3.lego and nothing on E (the original namespace has no `lego`)', !!E.s3.lego && E.lego === undefined && Object.prototype.hasOwnProperty.call(E.s3, 'lego'));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
