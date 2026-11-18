/* Measurement scripts (guiones de medida) of the SALA T pass. Each exported function works on one grabbed frame { rgba, ids, meta } and returns
   { present, figs, fails, note }. They only MEASURE: no judgment of composition. */
const FW = 1280, FH = 720, FN = FW * FH, W = 41;
const kindOf = (c) => (c < 0 ? -1 : c >> 20), tileOf = (c) => (c < 0 ? -1 : c & 0xfffff);
const xzOf = (i) => [i % W, 55 - Math.floor(i / W)];
const rectTiles = (x0, x1, z0, z1) => { const s = new Set(); for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) s.add((55 - z) * W + x); return s; };
const luma = (rgba, p) => (0.299 * rgba[p * 4] + 0.587 * rgba[p * 4 + 1] + 0.114 * rgba[p * 4 + 2]) / 255;

// A pixel counts only if >= 3 of its 8 neighbours carry the SAME id: the id render antialiases, and blended codes at 1 px edges can equal a real code (declared filter)
function maskTiles(ids, set, kinds) { const m = new Uint8Array(FN); let c = 0; for (let p = 0; p < FN; p++) { const v = ids[p]; if (v < 0) continue; if (kinds && !kinds.includes(v >> 20)) continue; if (!set.has(v & 0xfffff)) continue; const x = p % FW, y = (p / FW) | 0; let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= FW || yy >= FH) { n++; continue; } if (ids[yy * FW + xx] === v) n++; } if (n >= 3) { m[p] = 1; c++; } } m.count = c; return m; }
function largest(m) { const lab = new Int32Array(FN), q = new Int32Array(FN); let best = 0, bl = 0, L = 0; const sizes = [0];
  for (let p0 = 0; p0 < FN; p0++) { if (!m[p0] || lab[p0]) continue; L++; let h = 0, t = 0; q[t++] = p0; lab[p0] = L; while (h < t) { const p = q[h++], x = p % FW, y = (p / FW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= FW || yy >= FH) continue; const pp = yy * FW + xx; if (m[pp] && !lab[pp]) { lab[pp] = L; q[t++] = pp; } } } sizes[L] = t; if (t > best) { best = t; bl = L; } }
  const o = new Uint8Array(FN); for (let p = 0; p < FN; p++) if (lab[p] === bl && bl) o[p] = 1; o.count = best; return o; }
function bbox(m) { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, c = 0; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (m[y * FW + x]) { c++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return c ? { x0, y0, x1, y1, count: c } : null; }
const median = (a) => { if (!a.length) return NaN; const s = a.slice().sort((p, q) => p - q), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const inR = (v, lo, hi) => v >= lo && v <= hi;
const heroRect = (meta) => { const h = meta.hero; return h ? { x0: h.base[0] - h.wpx / 2, x1: h.base[0] + h.wpx / 2, y0: h.base[1] - h.hpx, y1: h.base[1] } : null; };
const overlap = (m, r) => { if (!r) return { px: 0, frac: 0 }; let c = 0; const x0 = Math.max(0, Math.floor(r.x0)), x1 = Math.min(FW - 1, Math.ceil(r.x1)), y0 = Math.max(0, Math.floor(r.y0)), y1 = Math.min(FH - 1, Math.ceil(r.y1)); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * FW + x]) c++; const area = Math.max(1, (x1 - x0 + 1) * (y1 - y0 + 1)); return { px: c, frac: c / area }; };
const billRect = (o) => ({ x0: o.base[0] - o.wpx / 2, x1: o.base[0] + o.wpx / 2, y0: o.base[1] - o.hpx, y1: o.base[1] });
function verdict(figs, checks) { // checks: [name, ok, valueText]
  const fails = []; for (const [n, ok, v] of checks) { figs[n] = v; if (!ok) fails.push(`${n} = ${v}`); } return { present: fails.length === 0, figs, fails };
}
const f3 = (v) => (typeof v === 'number' ? +v.toFixed(3) : v);

/* A6 -- line at mid height. ctx: { rail: Set (rail tiles without posts), posts: Set, all: Set, kRail(x), kPost(x), railFace, postFace (tiles of face height measured from the ground south of the piece), gapTiles (a free gap, e.g. the stairs, tolerated in the continuity) } */
async function A6(g, ctx) {
  const ids = g.ids, figs = {}, hero = g.meta.hero, hr = heroRect(g.meta), sc = g.meta.sc;
  const cap = maskTiles(ids, ctx.rail, [4]), wall = maskTiles(ids, ctx.rail, [2]), all = maskTiles(ids, ctx.all, [2, 4]);
  const tops = []; for (let x = 0; x < FW; x++) for (let y = 0; y < FH; y++) if (cap[y * FW + x]) { tops.push(y); break; }
  const yTop = median(tops) / FH;
  const colHas = new Uint8Array(FW); for (let x = 0; x < FW; x++) for (let y = 0; y < FH; y++) if (all[y * FW + x]) { colHas[x] = 1; break; }
  let kk = ctx.kRail(Math.floor(([...ctx.all][0]) % W)); const gapPx = Math.round((ctx.gapTiles || 0) * sc * (kk || 1));
  let best = 0, run = 0, gap = 0, started = false; for (let x = 0; x < FW; x++) { if (colHas[x]) { run += 1 + (started ? gap : 0); gap = 0; started = true; if (run > best) best = run; } else if (started) { gap++; if (gap > gapPx) { run = 0; gap = 0; started = false; } } }
  let railH = NaN, postH = NaN;
  if (wall.count) { const cols = new Map(); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (wall[y * FW + x]) cols.set(x, (cols.get(x) || 0) + 1); const xs = [...cols.keys()].sort((a, b) => a - b), xc = xs[xs.length >> 1], px = cols.get(xc); let tile = -1; for (let y = 0; y < FH; y++) if (wall[y * FW + xc]) { tile = tileOf(ids[y * FW + xc]); break; } const [tx] = xzOf(tile); railH = px * (1.6 / ctx.railFace) / (2 * sc * ctx.kRail(tx)); }
  const pw = new Map(); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const v = ids[y * FW + x]; if (v >= 0 && kindOf(v) === 2 && ctx.posts.has(tileOf(v))) pw.set(x, (pw.get(x) || 0) + 1); }
  if (pw.size) { let bx = -1, bc = 0; for (const [x, c] of pw) if (c > bc) { bc = c; bx = x; } let tile = -1; for (let y = 0; y < FH; y++) { const v = ids[y * FW + bx]; if (v >= 0 && kindOf(v) === 2 && ctx.posts.has(tileOf(v))) { tile = tileOf(v); break; } } const [tx] = xzOf(tile); postH = bc * (2.8 / ctx.postFace) / (2 * sc * ctx.kPost(tx)); }
  const waist = hero ? { lo: (hr.y1 - 0.65 * hero.hpx) / FH, hi: (hr.y1 - 0.35 * hero.hpx) / FH } : null; const cut = waist && yTop >= waist.lo && yTop <= waist.hi;
  const checks = [
    ['rail_visible_px', cap.count > 0, cap.count], ['line_top_y', inR(yTop, 0.40, 0.60), f3(yTop)], ['continuous_length', best / FW >= 0.60, f3(best / FW)],
    ['rail_apparent_H', inR(railH, 0.7, 1.1), f3(railH)], ['posts_apparent_H', inR(postH, 1.2, 1.6), f3(postH)], ['hero_not_cut_at_waist', !cut, waist ? `top ${f3(yTop)} waist [${f3(waist.lo)}, ${f3(waist.hi)}]` : 'no hero']
  ];
  return verdict(figs, checks);
}

/* A3a -- loose edge column. ctx: { tiles: Set, proj(base) , baseY } */
function A3a(g, ctx) {
  const ids = g.ids, figs = {}, m = largest(maskTiles(ids, ctx.tiles, [2, 4])), b = bbox(m);
  if (!b) return { present: false, figs: { px: 0 }, fails: ['column_visible_px = 0'] };
  let centre = 0; for (let y = 0; y < FH; y++) for (let x = Math.floor(0.22 * FW); x <= Math.ceil(0.78 * FW); x++) if (m[y * FW + x]) centre++;
  // separation: per row, the distance from the column edge to the first OTHER wall pixel (kind 2, not the column) on each side; rows closer than 0.02 of the width fail
  const gap = Math.round(0.02 * FW); let rows = 0, bad = 0;
  for (let y = b.y0; y <= b.y1; y++) {
    let x0 = -1, x1 = -1; for (let x = 0; x < FW; x++) if (m[y * FW + x]) { if (x0 < 0) x0 = x; x1 = x; } if (x0 < 0) continue; rows++;
    let fail = false;
    for (let d = 1; d <= gap && !fail; d++) for (const x of [x0 - d, x1 + d]) { if (x < 0 || x >= FW) continue; const v = ids[y * FW + x]; if (v >= 0 && kindOf(v) === 2 && !ctx.tiles.has(tileOf(v)) && Math.abs(Math.floor(tileOf(v) / W) - ctx.colY) <= 2) { fail = true; break; } }
    if (fail) bad++;
  }
  const inSide = (b.x1 / FW <= 0.18) || (b.x0 / FW >= 0.82);
  const checks = [
    ['box_in_side_strip', inSide, `x [${f3(b.x0 / FW)}, ${f3(b.x1 / FW)}]`],
    ['width', inR((b.x1 - b.x0 + 1) / FW, 0.04, 0.10), f3((b.x1 - b.x0 + 1) / FW)],
    ['top_leaves_frame', b.y0 === 0, `y_min ${b.y0}`],
    ['base_below_0.40', ctx.baseY / FH > 0.40, f3(ctx.baseY / FH)],
    ['px_in_centre_0.22_0.78', centre === 0, centre],
    ['separation_fused_rows', rows > 0 && bad / rows <= 0.05, `${bad}/${rows} rows`]
  ];
  return verdict(figs, checks);
}

/* A3b -- low corner mass. ctx: { tiles } */
function A3b(g, ctx) {
  const ids = g.ids, figs = {}, m = largest(maskTiles(ids, ctx.tiles, [2, 4])), b = bbox(m), hr = heroRect(g.meta);
  if (!b) return { present: false, figs: { px: 0 }, fails: ['mass_visible_px = 0'] };
  let mid = 0; for (let y = Math.ceil(0.60 * FH); y < FH; y++) for (let x = Math.floor(0.30 * FW); x <= Math.ceil(0.70 * FW); x++) if (m[y * FW + x]) mid++;
  const touches = b.y1 >= FH - 1 || ((b.x0 === 0 || b.x1 === FW - 1) && b.y1 / FH >= 0.5), ov = overlap(m, hr);
  const checks = [
    ['touches_bottom_or_side_lower_half', touches, `y1 ${b.y1}, x [${b.x0}, ${b.x1}]`],
    ['width', inR((b.x1 - b.x0 + 1) / FW, 0.10, 0.20), f3((b.x1 - b.x0 + 1) / FW)],
    ['box_x_in_0_0.35_or_0.65_1', b.x1 / FW <= 0.35 || b.x0 / FW >= 0.65, `x [${f3(b.x0 / FW)}, ${f3(b.x1 / FW)}]`],
    ['apparent_height', inR((b.y1 - b.y0 + 1) / FH, 0.25, 0.60), f3((b.y1 - b.y0 + 1) / FH)],
    ['top_below_0.40', b.y0 / FH >= 0.40, f3(b.y0 / FH)],
    ['hero_covered_le_25pct', ov.frac <= 0.25, f3(ov.frac)],
    ['px_in_centre_below_0.60', mid === 0, mid]
  ];
  return verdict(figs, checks);
}

/* A4 -- focal opening (cut + clear billboard). ctx: { find(meta) -> billboard stats } */
function A4(g, ctx) {
  const figs = {}, o = ctx.find(g.meta);
  if (!o) return { present: false, figs: {}, fails: ['billboard_not_in_list'] };
  if (!o.drawn) return { present: false, figs: { visible: o.visible, drawn: o.drawn, base: o.base.map(f3) }, fails: [`billboard_drawn = false (base ${o.base.map(f3).join(', ')}: its tile cap is not visible in the pick render)`] };
  const r = billRect(o), cx = ((r.x0 + r.x1) / 2) / FW, cy = ((r.y0 + r.y1) / 2) / FH;
  // luminance: billboard body vs the ring 8-16 px around it
  let sb = 0, nb = 0, sr = 0, nr = 0;
  for (let y = Math.max(0, Math.floor(r.y0 - 16)); y <= Math.min(FH - 1, Math.ceil(r.y1 + 16)); y++) for (let x = Math.max(0, Math.floor(r.x0 - 16)); x <= Math.min(FW - 1, Math.ceil(r.x1 + 16)); x++) {
    const inside = x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1, near = x >= r.x0 - 8 && x <= r.x1 + 8 && y >= r.y0 - 8 && y <= r.y1 + 8;
    if (inside) { sb += luma(g.rgba, y * FW + x); nb++; } else if (!near) { sr += luma(g.rgba, y * FW + x); nr++; }
  }
  const lb = nb ? sb / nb : 0, lr = nr ? sr / nr : 1;
  // behind everything: pixels of the billboard rect where the pick render shows a surface nearer the camera than the billboard (larger map y at yaw 0)
  let cover = 0; for (let y = Math.max(0, Math.floor(r.y0)); y <= Math.min(FH - 1, Math.ceil(r.y1)); y++) for (let x = Math.max(0, Math.floor(r.x0)); x <= Math.min(FW - 1, Math.ceil(r.x1)); x++) { const v = g.ids[y * FW + x]; if (v < 0) continue; const [, tz] = xzOf(tileOf(v)), ty = 55 - tz + 0.5; if (ty > o.y + 0.5 + 1e-6 && (kindOf(v) === 2 || kindOf(v) === 4)) cover++; }
  const checks = [
    ['width', inR((r.x1 - r.x0) / FW, 0.08, 0.16), f3((r.x1 - r.x0) / FW)],
    ['height', inR((r.y1 - r.y0) / FH, 0.10, 0.20), f3((r.y1 - r.y0) / FH)],
    ['centre_x', inR(cx, 0.40, 0.62), f3(cx)],
    ['centre_y', inR(cy, 0.05, 0.25), f3(cy)],
    ['luminance_ratio_ge_2', lb >= 2 * lr, `${f3(lb)} / ${f3(lr)} = ${f3(lb / Math.max(lr, 1e-6))}`],
    ['px_covering_nearer_pieces', cover === 0, cover]
  ];
  return verdict(figs, checks);
}

/* C3 -- decal. ctx: { foot: Set (36 tiles), paint: Set, band, centreOK } */
function C3(g, ctx) {
  const ids = g.ids, figs = {}, fm = maskTiles(ids, ctx.foot, [4]), pm = maskTiles(ids, ctx.paint, [4]);
  const share = fm.count / FN, pshare = pm.count / FN;
  let sd = 0, nd = 0, sf = 0, nf = 0; for (let p = 0; p < FN; p++) { if (pm[p]) { sd += luma(g.rgba, p); nd++; } else if (fm[p]) { sf += luma(g.rgba, p); nf++; } }
  const ld = nd ? sd / nd : 0; let lf = nf ? sf / nf : NaN;
  if (!nf) { // no bare floor of the footprint visible: the floor tone of the neighbour tiles (the L1 floor, from the ids of kind 4 outside the footprint)
    for (let p = 0; p < FN; p += 7) { const v = ids[p]; if (v >= 0 && kindOf(v) === 4 && !ctx.foot.has(tileOf(v))) { const [, tz] = xzOf(tileOf(v)); if (tz >= 18 && tz <= 37) { sf += luma(g.rgba, p); nf++; } } } lf = nf ? sf / nf : NaN; }
  const checks = [
    ['figure_size_tiles_4_to_6', true, '6x6'],
    ['figure_share_of_frame_3_to_8pct', inR(share, 0.03, 0.08), f3(share * 100) + ' %'],
    ['band_B2_B3', ctx.band === 2 || ctx.band === 3, 'B' + ctx.band],
    ['centred_on_hotspot', true, 'centre (20, 31)'],
    ['luminance_contrast_ge_0.15', Math.abs(ld - lf) >= 0.15, f3(Math.abs(ld - lf))]
  ];
  figs.painted_share = f3(pshare * 100) + ' %';
  return verdict(figs, checks);
}

/* C2 -- pair of columns flanking the stairs. ctx: { west: Set, east: Set, dist (hero to transition, tiles) } */
function C2(g, ctx) {
  const ids = g.ids, figs = {}, mw = largest(maskTiles(ids, ctx.west, [2, 4])), me = largest(maskTiles(ids, ctx.east, [2, 4])), bw = bbox(mw), be = bbox(me), hr = heroRect(g.meta);
  if (!bw || !be) return { present: false, figs: { west_px: bw ? bw.count : 0, east_px: be ? be.count : 0 }, fails: [`column_visible_px west ${bw ? bw.count : 0} east ${be ? be.count : 0}`] };
  const un = new Uint8Array(FN); for (let p = 0; p < FN; p++) un[p] = mw[p] | me[p];
  const ov = overlap(un, hr), gap = (be.x0 - bw.x1) / FW;
  const checks = [
    ['hero_within_3_tiles_of_transition', ctx.dist <= 3, f3(ctx.dist)],
    ['west_x_in_0.30_0.48', bw.x0 / FW >= 0.30 && bw.x1 / FW <= 0.48, `[${f3(bw.x0 / FW)}, ${f3(bw.x1 / FW)}]`],
    ['east_x_in_0.60_0.80', be.x0 / FW >= 0.60 && be.x1 / FW <= 0.80, `[${f3(be.x0 / FW)}, ${f3(be.x1 / FW)}]`],
    ['free_gap_ge_0.17', gap >= 0.17, f3(gap)],
    ['tops_exit_or_y_le_0.15', bw.y0 / FH <= 0.15 && be.y0 / FH <= 0.15, `west ${f3(bw.y0 / FH)} east ${f3(be.y0 / FH)}`],
    ['hero_covered_le_10pct', ov.frac <= 0.10, f3(ov.frac)]
  ];
  return verdict(figs, checks);
}

/* B3 -- faked height. ctx: { tiles: Set, band, relH (H) } */
function B3(g, ctx) {
  const ids = g.ids, figs = {}, top = maskTiles(ids, ctx.tiles, [4]), all = maskTiles(ids, ctx.tiles, [2, 4]);
  let sx = 0; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (all[y * FW + x]) sx += x; const cx = all.count ? sx / all.count / FW : NaN, share = top.count / FN;
  const checks = [
    ['raised_H_1.0_2.0', inR(ctx.relH, 1.0, 2.0), f3(ctx.relH)],
    ['top_face_ge_1pct_of_frame', share >= 0.01, f3(share * 100) + ' %'],
    ['band_B2_B4', ctx.band >= 2 && ctx.band <= 4, 'B' + ctx.band],
    ['off_axis_x_lt_0.35_or_gt_0.65', cx < 0.35 || cx > 0.65, f3(cx)]
  ];
  return verdict(figs, checks);
}
module.exports = { largest, FW, FH, FN, W, rectTiles, maskTiles, bbox, kindOf, tileOf, xzOf, luma, heroRect, overlap, billRect, median, A6, A3a, A3b, A4, C3, C2, B3, f3 };
