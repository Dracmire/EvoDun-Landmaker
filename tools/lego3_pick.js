/* LEGO pass 3 (stage_lego3_go.md section 3 and 2): (a) among the single-terrace windows of "Balanced types", the rooms with the MOST distinct sub-levels (the candidates for the sub-level lego of A539); (b) the AUTO count (not built): in the 2+ terrace windows with a Cake, whether the Cake is the only ascent to the highest terrace (Scale) or not (Rest). MEASURE ONLY.
     node tools/lego3_pick.js [out.json] */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/lego', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO, TP = 1.5;
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), rows = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/crystallizers/03-stage/shots/lego/lego_pick_windows.json'), 'utf8'));
  const base = { ...RT.BASE, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, terH: 1.25 * TP, subH: +(0.22 * 1.25 * TP).toFixed(4), subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true, margin: 6 };
  const out = { single: [], auto: [] };
  for (const r of rows) {
    const multi = r.terr.length >= 2, P = { ...base, cake: multi && r.type === 'Cake' };
    if (!multi && r.terr.length !== 1) continue;
    const S = E.s3.shape(mk(), P, { rooms: [r.id], margin: P.margin }); S.orient = E.orient.compute(S, P, [r.id], TP); const rec = S.orient.byId.get(r.id); if (!rec) continue;
    const zm = E.stage.zoneMap(S), lv = new Set(), all = new Set(), cnt = new Map(); for (let i = 0; i < S.n; i++) if (zm[i] === r.id && !S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0) { const mt = S.levelMeta[S.fine[i]]; all.add(S.fine[i]); if (!mt.bridge && !mt.deco) { lv.add(S.fine[i]); cnt.set(S.fine[i], (cnt.get(S.fine[i]) || 0) + 1); } }
    if (!multi) out.single.push({ id: r.id, type: r.type, tiles: r.tiles, subLevels: lv.size, allLevels: all.size, relief: lv.size > 1 ? +(1 - Math.max(...cnt.values()) / [...cnt.values()].reduce((a, b) => a + b, 0)).toFixed(2) : 0, m: E.s3.lego.mOf(E.s3.lego.terraces(S, P, rec, rec.yaw)) });
    else out.auto.push({ id: r.id, type: r.type, ...E.s3.lego.autoPick(S, P, rec, rec.yaw), stairs: (S.stairs || []).length, rings: S.cake ? S.cake.rings : null });
  }
  out.single.sort((a, b) => b.subLevels - a.subLevels || b.relief - a.relief || b.tiles - a.tiles); const file = process.argv[2]; if (file) fs.writeFileSync(file, JSON.stringify(out, null, 1)); else console.log(JSON.stringify(out));
  const cnt = {}; for (const x of out.auto) cnt[x.pick] = (cnt[x.pick] || 0) + 1; console.error('single windows', out.single.length, 'top sub-levels', JSON.stringify(out.single.slice(0, 8).map((x) => [x.id, x.type, x.subLevels, x.relief, x.tiles, x.m])), 'AUTO count (2+ terraces)', JSON.stringify(cnt), 'of which cake rooms', out.auto.filter((x) => x.cake).length);
})().catch((e) => { console.error(e); process.exit(1); });
