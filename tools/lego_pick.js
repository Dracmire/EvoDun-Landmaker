/* LEGO pass 2 (stage_lego2_go.md section 2): the candidates for the Up examples. For every room of "Balanced types" that steps on 2+ terraces: type (DAC), direction / role (E.orient), the profile of the table of perfiles_forma.md (P1 / P2 corridor widths, P3/P4 one shot), the path of `props` (entry -> exit / goal) and whether the hero CLIMBS along it (the height of the last quarter of the path against the first quarter), the terraces and the jump. MEASURE ONLY.
     node tools/lego_pick.js [out.json] */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 's3/lego', 'stage', 'orient', 'props']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), { filename: f });
const E = window.EVO, TP = 1.5, TYPE = { 1: 'Cake', 2: 'Diorama', 3: 'Ascension' };
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), rows = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/crystallizers/03-stage/shots/lego/lego_rooms.json'), 'utf8')).rows;
  const P = { ...RT.BASE, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, terH: 1.25 * TP, subH: +(0.22 * 1.25 * TP).toFixed(4), subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true, margin: 6 };
  const out = [];
  for (const r of rows) {
    const S = E.s3.shape(mk(), P, { rooms: [r.id], margin: P.margin }); S.orient = E.orient.compute(S, P, [r.id], TP); const rec = S.orient.byId.get(r.id); if (!rec) continue;
    let pd = null; try { pd = E.props.compute(S, P, rec, { tilesPerH: TP, last: true, next: 0 }); } catch (e) { pd = null; }
    const path_ = pd && pd.path ? pd.path : [], hs = path_.map((t) => S.levelH[S.fine[t]]), q = Math.max(1, Math.floor(hs.length / 4)), mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    const climb = hs.length ? (mean(hs.slice(-q)) - mean(hs.slice(0, q))) / P.terH : null; // in terraces
    const terr = E.s3.lego.terraces(S, P, rec, rec.yaw), Lh = rec.L / TP, Wh = rec.W / TP, w = Math.min(Lh, Wh), l = Math.max(Lh, Wh);
    const prof = rec.dir === 'Hub' ? (Wh <= 18 && Lh <= 17 ? 'P3/P4' : 'ninguno') : ((w >= 3 && w <= 5 && l > 17) ? 'P1' : (w >= 6 && w <= 12 && l > 17) ? 'P2' : 'ninguno');
    out.push({ id: r.id, type: r.type, dir: rec.dir, yaw: rec.yaw, LH: +Lh.toFixed(1), WH: +Wh.toFixed(1), meanWH: +((rec.tiles / Math.max(rec.L, rec.W)) / TP).toFixed(1), profile: prof, tiles: r.tiles, terr: terr.map((q2) => q2.t + 1), m: E.s3.lego.mOf(terr), pathLen: path_.length, climbTerr: climb === null ? null : +climb.toFixed(2), hStart: hs.length ? +(hs[0] / P.terH).toFixed(2) : null, hEnd: hs.length ? +(hs[hs.length - 1] / P.terH).toFixed(2) : null, noPath: pd && pd.noPath });
  }
  const file = process.argv[2]; if (file) fs.writeFileSync(file, JSON.stringify(out, null, 1)); else console.log(JSON.stringify(out));
  const wsingle = out.filter((x) => x.terr.length === 1).length; console.error(`${out.length} rooms as windows of one room: single-terrace ${wsingle}, 2+ ${out.filter((x) => x.terr.length >= 2).length}, none ${out.filter((x) => !x.terr.length).length}; climbing (>= 0.5 terrace along the path) among 2+: ${out.filter((x) => x.terr.length >= 2 && x.climbTerr >= 0.5).length}`);
})().catch((e) => { console.error(e); process.exit(1); });
