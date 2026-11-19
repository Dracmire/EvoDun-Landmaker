/* SHAPE PROFILES, PART A (docs/crystallizers/03-stage/research/octopath2/stage_perfiles_mockup_go.md, perfiles_forma.md): MEASURE ONLY, nothing in src/ changes.
   The 88 rooms of "Balanced types" (real map, 3 terraces, core 100, radius 5, minPlateau 120; Base v2.4: terH 1.25 H, subs 2, tilesPerH 1.5): for every room its direction (E.orient, the room as a window of ONE room, like the mock examples mockt_z14 / mockt_x44), the walkable length / width in H
   along its axis and across it, its DAC type (whole-map classification) and the profile P1..P4 of the table of perfiles_forma.md section 2, or none. P5 / P6 are interiors and are not applied. The thresholds are the ones of the table and are NOT moved; the cases on the limit are counted apart.
   Output: JSON on stdout (or the path given as argv[2]); the markdown is made by tools/perfiles_report.js.
     node tools/perfiles_clasificacion.js [out.json] */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, TP = 1.5, TYPE = { 1: 'Cake', 2: 'Diorama', 3: 'Ascension' };
/* THE TABLE of perfiles_forma.md section 2 (H). One shot = 18 H wide x 17 H useful depth at the hero's depth (the doc's own reference). Corridor widths: P1 3-5, P2 6-12 (the gap 5-6 is on the limit). Length of P1 / P2: more than ONE shot ("varias tomas"): > 17 H along the view. P3 / P4: one shot, <= 18 across x <= 17 deep. */
const TABLE = { shotW: 18, shotD: 17, p1: [3, 5], p2: [6, 12] };
const classify = (r, meanW) => { // meanW (optional, tiles): the MEAN width (walkable tiles / the long dimension) instead of the extent across the axis, the alternative reading of "ancho caminable" for Z / X (a corridor with a bulge or a spur has a large extent and a small mean)
  const Lh = r.L / TP, Wh = r.W / TP; // along the axis / across it, in H (the extents of the walkable tiles)
  let profile = 'ninguno', why = '', limit = [];
  const near = (x, t) => Math.abs(x - t) / t <= 0.10;
  if (r.dir === 'Hub') {
    // Hub: the camera looks along the axis: depth = L, across = W
    if (Wh <= TABLE.shotW && Lh <= TABLE.shotD) { profile = 'P3/P4'; why = 'cabe en una toma'; } else why = `no cabe en una toma (${Wh.toFixed(1)} x ${Lh.toFixed(1)} H)`;
    if (profile === 'ninguno' && Wh <= TABLE.shotW + 1.8 && Lh <= TABLE.shotD + 1.7) limit.push('Hub a menos del 10 % de una toma');
    if (profile !== 'ninguno' && (near(Wh, TABLE.shotW) || near(Lh, TABLE.shotD))) limit.push('Hub a menos del 10 % del borde de la toma');
  } else {
    // Z / X: width = the SHORT dimension, length = the long one (E.orient looks along the long one in both: Z along its axis, X across its short axis)
    const w = meanW !== undefined ? meanW / TP : Math.min(Lh, Wh), l = Math.max(Lh, Wh), depth = TABLE.shotD;
    const fitsW1 = w >= TABLE.p1[0] && w <= TABLE.p1[1], fitsW2 = w >= TABLE.p2[0] && w <= TABLE.p2[1];
    if ((fitsW1 || fitsW2) && l > depth) { profile = fitsW1 ? 'P1' : 'P2'; why = `ancho ${w.toFixed(1)} H, largo ${l.toFixed(1)} H`; }
    else if (fitsW1 || fitsW2) { why = `forma ${fitsW1 ? 'P1' : 'P2'} (ancho ${w.toFixed(1)} H) pero largo ${l.toFixed(1)} H <= 1 toma`; limit.push('ancho de P1/P2 con largo de una sola toma'); }
    else if (w > TABLE.p1[1] && w < TABLE.p2[0]) { why = `ancho ${w.toFixed(1)} H entre P1 y P2`; limit.push('ancho en el hueco 5-6 H de la tabla'); }
    else if (w < TABLE.p1[0]) why = `ancho ${w.toFixed(1)} H < 3 H (menos que el paso de A182)`; else why = `ancho ${w.toFixed(1)} H > 12 H`;
    for (const t of [3, 5, 6, 12]) if (near(w, t) && !limit.includes('ancho a menos del 10 % de un umbral')) limit.push('ancho a menos del 10 % de un umbral');
    if (profile !== 'ninguno' && near(l, depth)) limit.push('largo a menos del 10 % de una toma');
  }
  if (r.ratio !== undefined && (Math.abs(r.ratio - E.orient.RATIO) / E.orient.RATIO <= 0.05 || Math.abs(r.ratio - 1 / E.orient.RATIO) / (1 / E.orient.RATIO) <= 0.05)) limit.push('razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67)');
  return { profile, why, limit };
};
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const RT = require('./room_types_table.js'), extra = { terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, over = { terH: 1.25 * TP, subH: +(0.22 * 1.25 * TP).toFixed(4), subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true }; // = the P of the mockup examples of src/modes.js (the viewer's example: steps, fill variant, Base v2.4 terrain)
  const whole = RT.run(mk, extra, over), S0 = whole.S, P = { ...RT.BASE, ...extra, ...over };
  const ids = [...S0.types.rooms.keys()].sort((a, b) => a - b), types = new Map(ids.map((id) => [id, TYPE[S0.types.rooms.get(id).type]]));
  const counts = { Cake: 0, Diorama: 0, Ascension: 0 }; for (const t of types.values()) counts[t]++;
  const rows = [], t0 = Date.now();
  for (const id of ids) {
    const S = E.shape(mk(), P, { rooms: [id], margin: P.margin }), T = E.orient.compute(S, P, [id], TP), r = T.byId.get(id);
    if (!r) { rows.push({ id, type: types.get(id), dir: null, none: 'sin tiles caminables' }); continue; }
    const c = classify(r), meanWt = r.tiles / Math.max(r.L, r.W), alt = r.dir === 'Hub' ? c : classify(r, meanWt);
    rows.push({ id, type: types.get(id), dir: r.dir, ratio: r.ratio, Ltiles: r.L, Wtiles: r.W, LH: +(r.L / TP).toFixed(1), WH: +(r.W / TP).toFixed(1), meanWH: +((r.tiles / Math.max(r.L, r.W)) / TP).toFixed(1), tilesWalk: r.tiles, areaH2: +(r.tiles / (TP * TP)).toFixed(1), hRange: +((r.hMax - r.hMin) / TP).toFixed(2), yaw: r.yaw, why: r.why, profile: c.profile, reason: c.why, limit: c.limit, profileMeanW: alt.profile });
  }
  const out = { P: { terraces: P.terraces, roomsMinCore: P.roomsMinCore, rRadius: P.rRadius, minPlateau: P.minPlateau, terH: P.terH, subs: P.subs, tilesPerH: TP }, rooms: ids.length, counts, table: TABLE, seconds: (Date.now() - t0) / 1000, rows };
  const file = process.argv[2]; if (file) fs.writeFileSync(file, JSON.stringify(out, null, 1)); else console.log(JSON.stringify(out));
  console.error(`rooms ${ids.length} (Cake ${counts.Cake} / Diorama ${counts.Diorama} / Ascension ${counts.Ascension}), classified in ${out.seconds} s`);
})().catch((e) => { console.error(e); process.exit(1); });
