/* The wall pass of technique C (src/wallc.js): determinism, the support rule, the exemptions, the world band depth, T2 (no fusion, depth levels per (group, pass)), the cache key, whole-map hashing, and the figures of the fusion
   (islands, slivers, thin islands, spans) on the real map and the other maps: MEASURED, printed, not enforced.
     node tools/test_walls_c.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'curves', 'wallc', 'rooms', 'roomtypes', 'pocket', 'render']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P0 = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, tread: 2, margin: 24, spread: 1, curves: 'natural' };
const STAGE = { terraces: 7, spread: 1.5, spreadCentre: 'middle' };
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8'));

(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const x4 = () => load('shrine_pier_x4.json'), snake = () => load('snake_mountain_surface.json');
  const PX = Object.assign({}, P0, STAGE), S = E.shape(x4(), PX, null);
  const w3 = E.wallc.get(S, Object.assign({}, PX, { wallPass: 't3' })), st3 = w3.stats;
  ok('Off: no wall pass (the C of phase 1)', E.wallc.get(S, Object.assign({}, PX, { wallPass: 'off' })) === null);
  ok('T3 builds faces and tops on Shrine-Pier x4 (7 terraces, spread 1.5)', st3.faces > 100 && st3.tops > 100, JSON.stringify(st3));
  // determinism
  const S2 = E.shape(x4(), PX, null), w3b = E.wallc.get(S2, Object.assign({}, PX, { wallPass: 't3' }));
  ok('T3 is deterministic (two shapes give the same faces)', w3b.stats.faces === st3.faces && w3b.stats.tops === st3.tops && [...w3.byHi.keys()].every((k) => { const a = w3.byHi.get(k).faces, b = w3b.byHi.get(k).faces; return a.length === b.length && a.every((f, i) => f.ax === b[i].ax && f.zhi === b[i].zhi); }));
  // support rule
  let bad = 0, n = 0;
  for (const r of w3.inst) { if (r.lip || r.s === 0) continue; let m = 0; for (const o of r.nb.keys()) if (o.u < r.u) m = Math.max(m, o.s); n++; if (r.s > m) bad++; }
  ok(`the support rule holds for every atom that does not touch the lip (${n} atoms)`, bad === 0, bad);
  ok(`no tiny full-height island survives the fusion (s = K and area < ${E.wallc.FULLMIN}): the free-standing plate at the end of a spur`, w3.stats.after.tinyFull === 0, w3.stats.after.tinyFull);
  ok('every face and top carries its lower level and lies between the heights of lo and hi', [...w3.byHi.values()].every((v) => v.faces.every((f) => f.lo >= 0 && f.lo < f.hi && f.zlo >= S.levelH[f.lo] - 1e-9 && f.zhi <= S.levelH[f.hi] + 1e-9 && f.na && f.nb) && v.tops.every((t) => t.lo >= 0 && t.lo < t.hi)));
  ok('strata: 0 <= s <= K and K = max(2, round(jumpTerH * 3))', w3.inst.every((r) => r.s >= 0 && r.s <= r.K && r.K === Math.max(2, Math.round(r.H / 1 * 3))));
  ok('u is in [0, 1) for every band atom', w3.inst.every((r) => r.u >= 0 && r.u < 1));
  // exemptions: no atom piece on an exempt tile (ramp footprints and their ring, Ascension faces, Cake rings), nor over void
  const ex = E.curves.exemptTiles(S, PX); let onEx = 0, np = 0;
  for (const r of w3.inst) for (const p of r.pieces) { np++; for (let k = 0; k < p.poly.x.length; k++) { const x = (p.poly.x[k] + p.poly.x[(k + 1) % p.poly.x.length]) / 2, y = (p.poly.y[k] + p.poly.y[(k + 1) % p.poly.y.length]) / 2, t = Math.floor(y) * S.W + Math.floor(x); if (ex[t] || (S.void && S.void[t])) { onEx++; break; } } }
  ok(`no atom piece touches an exempt tile or void (${np} pieces; ${ex.reduce((a, b) => a + b, 0)} exempt tiles)`, onEx === 0, onEx);
  const exOff = E.wallc.get(S, Object.assign({}, PX, { wallPass: 't3', anchor: false }));
  ok('(control) with the exemption off the band has more atoms', exOff.stats.band >= st3.band, [exOff.stats.band, st3.band]);
  // world depth of the band: every vertex within 0.35 * H * extrude of the wall edges (also at extrude 1.0)
  for (const ext of [0.25, 1.0]) {
    const Pe = Object.assign({}, PX, { wallPass: 't3', wallExtrude: ext }), w = E.wallc.get(S, Pe); let worst = 0, bad2 = 0;
    const e = w.W.e, segD = (x, y, i) => { const x0 = e.x0[i], y0 = e.y0[i], vx = e.x1[i] - x0, vy = e.y1[i] - y0, l2 = vx * vx + vy * vy || 1e-12, t = Math.max(0, Math.min(1, ((x - x0) * vx + (y - y0) * vy) / l2)); return Math.hypot(x0 + vx * t - x, y0 + vy * t - y); };
    for (const v of w.byHi.values()) for (const f of v.faces) for (const [x, y] of [[f.ax, f.ay], [f.bx, f.by]]) { let d = 1e9; for (const i of w.W.list) d = Math.min(d, segD(x, y, i)); const lim = (E.wallc.BAND * f.tot + E.wallc.REACH) * ext + 1e-6; worst = Math.max(worst, d - lim); if (d > lim) bad2++; }
    ok(`T3 world band depth <= (0.35 * H + atom reach 0.45) * extrude (extrude ${ext}; the band is 0.35 H by MEAN distance, atoms are whole)`, bad2 === 0, [bad2, worst]);
  }
  // cache key: every wall parameter
  const keys = new Set([{}, { wallExtrude: 0.1 }, { wallStrata: 4 }, { wallColumn: 2 }, { wallPass: 't2' }, { t2Rows: 8 }, { t2Group: 1.4 }, { t2Spacing: 1.2 }, { t2Jitter: 0.1 }].map((o) => E.wallc.key(Object.assign({}, PX, o))));
  ok('the cache key changes with every wall parameter and the mode', keys.size === 9, keys.size);
  // T2: no fusion; the depth levels per (group, pass) are 0..3 / 3 * maxDepth
  const P2 = Object.assign({}, PX, { wallPass: 't2' }), w2 = E.wallc.get(S, P2);
  ok('T2 builds blocks and has NO fusion step (no before / after islands)', w2.stats.blocks > 100 && w2.stats.before === undefined && w2.stats.after === undefined, JSON.stringify(w2.stats));
  let badLv = 0, fronts = 0; const per = new Map(), hist = [0, 0, 0, 0];
  for (const v of w2.byHi.values()) for (const f of v.faces) { if (f.dep === undefined) continue; fronts++; const lv = Math.round(f.dep / f.maxD * 3); if (Math.abs(f.dep - lv / 3 * f.maxD) > 1e-9 || lv < 1 || lv > 3) badLv++; const k = f.chain + ':' + f.grp + ':' + f.row, o = per.get(k); if (o === undefined) per.set(k, f.dep); else if (Math.abs(o - f.dep) > 1e-9) badLv++; }
  for (const [k, d] of per) { void k; void d; }
  ok(`T2 front faces: depth = level / 3 * (0.35 * H * extrude) with level 1..3, one depth per (group, pass) (${fronts} faces, ${per.size} (group, pass) pairs)`, fronts > 100 && badLv === 0, badLv);
  // level frequencies over (chain, group, row), counting level 0 as the pairs without any face
  { const P2b = Object.assign({}, P0, STAGE, { wallPass: 't2', wallExtrude: 0.4 }), Sr = E.shape(mk(), P2b, null), wr = E.wallc.get(Sr, P2b); const seen = new Map(); for (const v of wr.byHi.values()) for (const f of v.faces) if (f.dep !== undefined) seen.set(f.chain + ':' + f.grp + ':' + f.row, Math.round(f.dep / f.maxD * 3));
    for (const l of seen.values()) hist[l]++; const tot = hist[1] + hist[2] + hist[3]; const share = [hist[1] / tot, hist[2] / tot, hist[3] / tot];
    ok(`T2 levels 1 : 2 : 3 follow p = 0.25 : 0.25 : 0.15 (normalised without level 0): ${share.map((v) => v.toFixed(2)).join(' : ')} (${tot} pairs on the real map)`, Math.abs(share[0] - 0.25 / 0.65) < 0.08 && Math.abs(share[1] - 0.25 / 0.65) < 0.08 && Math.abs(share[2] - 0.15 / 0.65) < 0.08, share); }
  // whole-map hashing: the same atoms (same s) in the interior of a slice
  { const Pn = Object.assign({}, P0, { anchor: false, stairW: 0, wallPass: 't3' }), Sw = E.shape(mk(), Pn, null), Sz = E.shape(mk(), Pn, { rect: [60, 60, 140, 140], margin: 8 }), a = E.wallc.get(Sw, Pn), b = E.wallc.get(Sz, Pn), key = (r, S_) => `${r.a.ai},${r.a.aj},${r.lo}`;
    const mapA = new Map(a.inst.map((r) => [key(r, Sw), r])); let n2 = 0, diff = 0;
    for (const r of b.inst) { const wx = (r.a.x + Sz.ox), wy = (r.a.y + Sz.oy); if (wx - Sz.ox < 5 || wy - Sz.oy < 5 || Sz.ox + Sz.W - wx < 5 || Sz.oy + Sz.H - wy < 5) continue; const o = mapA.get(key(r, Sz)); n2++; if (!o || o.s !== r.s || o.hi !== r.hi) diff++; }
    ok(`the same atoms and strata in the interior of a slice as on the whole map (${n2} atoms compared)`, n2 > 100 && diff <= Math.max(2, n2 * 0.005), diff); }
  // the figures of the fusion on the maps (measured, not enforced)
  console.log('\nFUSION FIGURES (T3, Natural, extrude 0.25; islands before -> after the rules, slivers (s < K and area < 0.30), thin (area / border < 0.10; reported for walls of 1.5 terH or more, the metric on H = 1 walls is dominated by the narrow band), tiny full-height islands (s = K and area < 0.30), islands over LMAX = 3.6 tiles, mean / max span in tiles, rounds, ms):');
  const rows = [['real map 5 terraces', mk, P0], ['real map 7 terraces spread 1.5 middle', mk, Object.assign({}, P0, STAGE)], ['real map 12 terraces', mk, Object.assign({}, P0, { terraces: 12 })], ['Snake surface 5 terraces', snake, P0], ['Snake surface 7 terraces', snake, Object.assign({}, P0, STAGE)], ['Shrine-Pier x4 7 terraces', x4, Object.assign({}, P0, STAGE)]];
  for (const [name, f, Pp] of rows) {
    const Pw = Object.assign({}, Pp, { wallPass: 't3' }), Sx = E.shape(f(), Pw, null), t0 = Date.now(), w = E.wallc.get(Sx, Pw), q = w.stats;
    console.log(`  ${name}: wall edges ${q.edges}, band atoms ${q.band}, islands ${q.before.islands} -> ${q.after.islands}, slivers ${q.before.slivers} -> ${q.after.slivers}, thin (walls >= 1.5 terH) ${q.before.thin} -> ${q.after.thin}, thin of every wall ${q.before.thinAll} -> ${q.after.thinAll}, tiny full-height ${q.before.tinyFull} -> ${q.after.tinyFull}, over LMAX ${q.before.spans} -> ${q.after.spans}, span mean ${q.before.meanSpan.toFixed(2)} -> ${q.after.meanSpan.toFixed(2)} max ${q.before.maxSpan.toFixed(1)} -> ${q.after.maxSpan.toFixed(1)}, rounds ${q.rounds}, faces ${q.faces}, ${Date.now() - t0} ms`);
    if (name.startsWith('real map 5')) ok('on the real map the fusion removes the slivers', q.after.slivers <= q.before.slivers * 0.1 + 2, [q.before.slivers, q.after.slivers]);
  }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
