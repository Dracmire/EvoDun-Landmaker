/* T2 BY PARTS (PR pend P6, debt A500; MEASURE ONLY, nothing in src/ changes): every room of the whole-map shape (DAC3 constructor) is cut into its PARTS and each part is classified with the table v2 of verticalidad.md section 6 (widths and lengths in H, tilesPerH 1.5).
   Method (hypotheses of this tool, [R]-style, written in one place):
   - thickness: the Euclidean distance of every walkable tile of the room to the nearest tile that is not walkable ground of the room (so the width across a part = 2 * the largest distance in its cross section, width of a part = 2 * the 90th percentile of the distances of its tiles + 1 (tiles));
   - CENTRAL AREA = the 8-connected components of the room's tiles with width >= WIDE_H (6 H, the lower bound of P2) that have at least MIN_TILES tiles; everything else walkable is the PASSAGE set;
   - RIM: the tiles within WIDE_H*tilesPerH/2 tiles of a central area are its shoulders and are not passage;
   - the PASSAGE set splits into components; a component is a CORRIDOR (L = its longest bounding-box side in H, W = (2 * the 90th percentile of its distances + 1) / tilesPerH: the mean of the distances of a band reads half of its width because the tiles at its edge count too) or an ELBOW when its bounding box is L-shaped: both sides >= 60 % of the longer one AND its area fills less than 55 % of the box (a straight band fills most of its box);
   - each part gets the profile of table v2: P1 (W 2.5-6, L > 17), P1c (W 2.5-6, L <= 17), P2 (W 6-12), Hub (the central area: <= 22 x 22 H = P3/P4, bigger = none), none (W < 2.5, or > 12 and not Hub).
   The entrance -> core -> exits walk of the brief is NOT done as a path walk: the parts are the components above, and `entry/exit` are the parts that touch a transition tile of the room (a ramp end or a gate tile). Output: JSON (argv[2]) and a markdown table on stdout.   node tools/perfiles_partes.js <out.json> [default] */
const fs = require('fs'), vm = require('vm'); global.window = global;
const R = __dirname + '/../';
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket', 'stage', 'orient']) vm.runInThisContext(fs.readFileSync(R + `src/${f}.js`, 'utf8'), { filename: f });
const E = window.EVO, TPH = 1.5, WIDE_H = 6, MIN_TILES = 20, TYPE = { 1: 'Cake', 2: 'Diorama', 3: 'Ascension' };
const profile = (W, L, hub) => hub ? (L <= 22 && W <= 22 ? 'P3/P4 Hub' : 'ninguno (Hub > 22)') : W < 2.5 ? 'ninguno (< 2,5)' : W <= 6 ? (L > 17 ? 'P1' : 'P1c') : W <= 12 ? 'P2' : 'ninguno (> 12, no Hub)';
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js'), DEF = process.argv[3] === 'default';
  const P = { ...RT.BASE, ...(DEF ? { terraces: 9 } : { terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }), terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true };
  const S = E.s3.shape(mk(), P, null), W = S.W, Hh = S.H, zm = E.stage.zoneMap(S), ids = [...S.types.rooms.keys()].sort((a, b) => a - b), rows = [], tally = {};
  const walk = (i) => !S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]);
  for (const id of ids) {
    const tiles = []; for (let i = 0; i < S.n; i++) if (zm[i] === id && walk(i)) tiles.push(i); if (!tiles.length) continue;
    const inR = new Map(tiles.map((i) => [i, 1])), dist = new Map();
    for (const i of tiles) { const x = i % W, y = (i / W) | 0; let d = 1e9; for (let r = 1; r <= 40 && d > r - 1; r++) { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const xx = x + dx, yy = y + dy, j = yy * W + xx; if (xx < 0 || yy < 0 || xx >= W || yy >= Hh || !inR.has(j)) d = Math.min(d, Math.hypot(dx, dy) - 0.5); } } dist.set(i, Math.min(d, 40)); }
    const comp = (set) => { const seen = new Set(), out = []; for (const s0 of set) { if (seen.has(s0)) continue; const st = [s0], c = []; seen.add(s0); while (st.length) { const t = st.pop(); c.push(t); const x = t % W, y = (t / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy, j = yy * W + xx; if ((dx || dy) && xx >= 0 && yy >= 0 && xx < W && yy < Hh && set.has(j) && !seen.has(j)) { seen.add(j); st.push(j); } } } out.push(c); } return out; };
    const wide = new Set(tiles.filter((i) => 2 * dist.get(i) / TPH >= WIDE_H)), central = comp(wide).filter((c) => c.length >= MIN_TILES), cset = new Set(central.flat());
    const RIM = Math.ceil(WIDE_H * TPH / 2), rim = new Set(); for (const i of cset) { const x = i % W, y = (i / W) | 0; for (let dy = -RIM; dy <= RIM; dy++) for (let dx = -RIM; dx <= RIM; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < Hh) rim.add(yy * W + xx); } } // the rim of a wide area (its own shoulders, half the wide width) belongs to it, it is not a passage
    const passage = new Set(tiles.filter((i) => !rim.has(i))), parts = [];
    
    const box = (c) => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const t of c) { const x = t % W, y = (t / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
    for (const c of central) { const b = box(c); parts.push({ kind: 'central', tiles: c.length, L: Math.max(b.w, b.h) / TPH, W: Math.min(b.w, b.h) / TPH, prof: profile(Math.min(b.w, b.h) / TPH, Math.max(b.w, b.h) / TPH, true) }); }
    for (const c of comp(passage)) { if (c.length < 3) continue; const b = box(c), L = Math.max(b.w, b.h) / TPH, short = Math.min(b.w, b.h) / TPH, fill = c.length / (b.w * b.h), ds = c.map((t) => dist.get(t)).sort((a, b) => a - b), meanW = (2 * ds[Math.floor(0.9 * (ds.length - 1))] + 1) / TPH, elbow = short >= 0.6 * L && fill < 0.55;
      parts.push({ kind: elbow ? 'codo' : 'pasillo', tiles: c.length, L, W: meanW, prof: profile(meanW, L, false) }); }
    for (const p of parts) { const k = p.kind + ' -> ' + p.prof; tally[k] = (tally[k] || 0) + 1; }
    rows.push({ id, type: TYPE[S.types.rooms.get(id).type], tiles: tiles.length, parts: parts.map((p) => ({ ...p, L: +p.L.toFixed(1), W: +p.W.toFixed(1) })) });
  }
  const out = { preset: DEF ? 'Default 9' : 'Balanced 3', tilesPerH: TPH, rooms: rows.length, tally, rows };
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  console.log(`${out.preset}: ${rows.length} rooms, ${rows.reduce((s, r) => s + r.parts.length, 0)} parts`); for (const [k, v] of Object.entries(tally).sort()) console.log('  ' + k + ': ' + v);
})().catch((e) => { console.error(e); process.exit(1); });
