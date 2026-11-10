/* STAGE OBJECTS (PR S4a, src/objects.js), no browser: the SIZE convention and the DEPTH ORDER of the declared billboards.
   - the height is the HERO's convention: an object of hH H at depth z is hH x the pixels the hero measures there (`hTiles * cam.sc * k`), for tilesPerH 2, 2.5, 3 and heroFrac 0.10 / 0.14 / 0.17 (an object of 1 H at the pivot = heroFrac x panel height);
   - it scales with the depth like the hero: near / far = 1.39 / 0.60 (+-0.01, the numbers of S1, `E.stage.ratios`), and so do the line width and the font (k); the width is wH hero heights;
   - ONE depth-sorted list with the hero: an object nearer than the hero is painted after it (over it), a farther one before; with the objects off nothing changes (the hero last, drawn by render.js);
   MUTATIONS (E.objectsTest, each makes its named check FAIL): tilesNotH, constSize, constStroke, heroAlwaysTop (ignoreHidden is in the UI test: the visibility needs a canvas).
     node tools/test_objects.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'render', 'stage', 'objects']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, SG = E.stage, OB = E.objects; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 400)); } };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, minSubArea: 3, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2 };
const S0 = E.shape(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/shrine_pier_x4.json'), 'utf8')), P, null);
const mkctx = () => { const log = []; const ctx = new Proxy({ log }, { get: (t, k) => (k in t ? t[k] : (...a) => { t.log.push([k, t.fillStyle]); }), set: (t, k, v) => { t[k] = v; return true; } }); return ctx; };
const camFor = (w, h, tp, hf, x, y, feet) => { const fit = E.fitScale(S0, P, { kind: 'persp', yaw: 0, pitch: 25, persH: h }, w, h), sc = SG.scale(h, hf, tp); return E.makeCam(S0, P, { kind: 'persp', yaw: 0, pitch: 25, zoom: sc / fit, panX: 0, panY: 0, fitSc: fit, persH: h, focus: [x, y, feet + 0.5 * tp] }, w, h); };
const stub = mkctx();

// 1. height in H: the hero's convention, independent of tilesPerH and heroFrac
const heightCheck = () => { let good = true, ex = null;
  for (const [w, h] of [[1220, 767], [1000, 600]]) for (const tp of [2, 2.5, 3]) for (const hf of [0.10, 0.14, 0.17]) {
    const x = 20, y = 20, feet = 1.2, cam = camFor(w, h, tp, hf, x, y, feet), hero = SG.drawHero(stub, cam, { x, y, feet, hTiles: tp, wTiles: SG.HERO_W * tp });
    for (const hH of [1, 1.5, 3]) { const s = OB.sizeAt(cam, tp, hH, 0.5, x, y, feet); if (!(Math.abs(s.hpx - hH * hero.hpx) <= 1e-6 * hero.hpx && Math.abs(hero.hpx / (hf * h) - 1) <= 0.02)) { good = false; ex = ex || { w, tp, hf, hH, obj: s.hpx, hero: hero.hpx }; } }
    const s1 = OB.sizeAt(cam, tp, 1, 0.5, x, y, feet); if (Math.abs(s1.wpx - 0.5 * hero.hpx) > 1e-6 * hero.hpx) { good = false; ex = ex || { width: s1.wpx, expect: 0.5 * hero.hpx }; } }
  return [good, ex]; };
{ const [g, ex] = heightCheck(); ok('the height of an object of hH H = hH x the hero\'s pixels at that depth (1, 1.5, 3 H; tilesPerH 2 / 2.5 / 3; heroFrac 0.10 / 0.14 / 0.17; two panels); the width is wH hero heights', g, ex); }
{ E.objectsTest = { tilesNotH: true }; const [g] = heightCheck(); E.objectsTest = null; ok('MUTATION tilesNotH (the height in tiles, not in H): the height check FAILS', !g); }

// 2. depth scale and strokes: near / far at the S1 rows
const depthCheck = () => { const w = 1220, h = 767, tp = 2, feet = 1.2, x = 20, y = 20, cam = camFor(w, h, tp, 0.14, x, y, feet), r = SG.ratios(cam, w, h, feet);
  const at = (row) => { const g = cam.unp(w / 2, row * h, feet); return OB.sizeAt(cam, tp, 1, 0.4, g[0], g[1], feet); }, n = at(SG.ROW_NEAR), f = at(SG.ROW_FAR), base = tp * cam.sc;
  return { r, n, f, base, okH: Math.abs(n.hpx / base - r.near) <= 0.01 && Math.abs(f.hpx / base - r.far) <= 0.01 && Math.abs(r.near - 1.39) <= 0.01 && Math.abs(r.far - 0.60) <= 0.01,
    okS: Math.abs(n.lw / OB.LW0 - r.near) <= 0.01 && Math.abs(f.lw / OB.LW0 - r.far) <= 0.01 && Math.abs(n.font / OB.FONT0 - r.near) <= 0.01 && Math.abs(f.font / OB.FONT0 - r.far) <= 0.01 }; };
{ const d = depthCheck(); ok(`a 1 H object scales with the depth like the hero: near ${(d.n.hpx / d.base).toFixed(3)} / far ${(d.f.hpx / d.base).toFixed(3)} of its pivot size (S1: 1.39 / 0.60 +-0.01), ratio ${(d.n.hpx / d.f.hpx).toFixed(2)}`, d.okH, d.r);
  ok(`the line width and the font scale with the same k (${d.n.lw.toFixed(2)} px near, ${d.f.lw.toFixed(2)} px far; font ${d.n.font.toFixed(1)} / ${d.f.font.toFixed(1)})`, d.okS, [d.n, d.f]); }
{ E.objectsTest = { constSize: true }; const d = depthCheck(); E.objectsTest = null; ok('MUTATION constSize (a constant screen size): the depth-scale check FAILS', !d.okH); }
{ E.objectsTest = { constStroke: true }; const d = depthCheck(); E.objectsTest = null; ok('MUTATION constStroke (a constant line width): the stroke check FAILS', !d.okS && d.okH); }

// 3. one depth order with the hero (the Box pick render of the Node shape is used for the visibility test)
const W = S0.W, tileAt = (i) => [(i % W) + 0.5, ((i / W) | 0) + 0.5];
let hx = 20.5, hy = 22.5; { const i = Math.floor(hy) * W + Math.floor(hx); if (S0.block[i]) { for (let k = 0; k < S0.n; k++) if (!S0.block[k] && S0.ter[k] === S0.ter[i]) { [hx, hy] = tileAt(k); break; } } }
const orderCheck = (opts) => { const w = 1220, h = 767, tp = 2, hi = Math.floor(hy) * W + Math.floor(hx), feet = SG.feetH(S0, hi), cam = camFor(w, h, tp, 0.14, hx, hy, feet);
  const view = { kind: 'persp', yaw: 0, pitch: 25, zoom: 1, panX: 0, panY: 0, fitSc: 1, persH: h, focus: [hx, hy, feet + tp / 2] };
  // two objects on the hero's own tile column, one nearer to the camera (larger y at yaw 0) and one farther; the visibility test is bypassed here (the pick render of this synthetic camera is not the point), a hidden-base check follows
  const mk = (kind, dy) => ({ kind, x: hx + S0.ox, y: hy + dy + S0.oy, hH: 2 }), list = [mk('pillar', 1.5), mk('shrub', -1.5)];
  const ctx = mkctx(); E.objectsTest = Object.assign({ ignoreHidden: true }, opts || {});
  const o = { hero: { x: hx, y: hy, feet, hTiles: tp, wTiles: SG.HERO_W * tp }, objects: { list, tilesPerH: tp } };
  OB.draw(ctx, cam, S0, P, 'box', view, o, w, h); E.objectsTest = null;
  const idx = (col) => { const a = ctx.log.map((e, i) => (e[0] === 'fill' && e[1] === col ? i : -1)).filter((i) => i >= 0); return a; };
  const hero = idx('#ff4fa3'), near = idx('#b9b2a6'), far = idx('#3f8a4a');
  return { hero, near, far, stats: o.objects.stats, nearerOverHero: near.length > 0 && hero.length > 0 && Math.min(...near) > Math.max(...hero), fartherUnderHero: far.length > 0 && Math.max(...far) < Math.min(...hero) }; };
{ const r = orderCheck(); ok('ONE depth order with the hero: the object nearer than the hero (pillar) is painted AFTER it, the farther one (shrub) BEFORE it', r.nearerOverHero && r.fartherUnderHero, { hero: r.hero, near: r.near, far: r.far }); }
{ const r = orderCheck({ heroAlwaysTop: true }); ok('MUTATION heroAlwaysTop (the hero last, as before S4a): the nearer-object check FAILS', !r.nearerOverHero); }
// 4. M4c-1: the optional `wH` (width in H that replaces the kind's) and `always` (drawn although the base is not on its own tile in the image, also outside the panel); absent = as before
{ const w = 1220, h = 767, tp = 2, hi = Math.floor(hy) * W + Math.floor(hx), feet = SG.feetH(S0, hi), cam = camFor(w, h, tp, 0.14, hx, hy, feet), view = { kind: 'persp', yaw: 0, pitch: 25, zoom: 1, panX: 0, panY: 0, fitSc: 1, persH: h, focus: [hx, hy, feet + tp / 2] };
  const run = (list, opts) => { const ctx = mkctx(); E.objectsTest = opts || null; const o = { objects: { list, tilesPerH: tp } }; OB.draw(ctx, cam, S0, P, 'box', view, o, w, h); E.objectsTest = null; return { st: o.objects.stats, log: ctx.log }; };
  const base = { kind: 'shrub', x: hx + S0.ox, y: hy + 1 + S0.oy, hH: 2 };
  const a = run([base], { ignoreHidden: true }), b = run([Object.assign({}, base, { wH: 3 })], { ignoreHidden: true }), c = run([Object.assign({}, base, { wH: undefined, always: false })], { ignoreHidden: true });
  const k = a.st[0].k, unit = tp * cam.sc * k;
  ok(`wH replaces the width of the kind: a shrub of wH 3 is ${(b.st[0].wpx / unit).toFixed(3)} H wide (3), the kind's own is ${(a.st[0].wpx / unit).toFixed(3)} H (0.9); the height is untouched`, Math.abs(b.st[0].wpx / unit - 3) < 1e-9 && Math.abs(a.st[0].wpx / unit - 0.9) < 1e-9 && b.st[0].hpx === a.st[0].hpx, [a.st[0], b.st[0]]);
  ok('absent fields (wH undefined, always false) = the entry of before, byte for byte (same figures and same paint calls)', JSON.stringify(c.st) === JSON.stringify(a.st) && JSON.stringify(c.log) === JSON.stringify(a.log));
  // the visibility test with an EMPTY pick render (nothing is a tile of its own in the image): without `always` the piece is dropped, with it drawn; a base under the bottom edge too; a tile outside the window is still skipped
  const pb = E.pickBuffer; E.pickBuffer = () => ({ data: new Uint8ClampedArray(w * h * 4) });
  const nope = run([base]), yes = run([Object.assign({}, base, { always: true })]);
  const outPos = { x: S0.ox + S0.W + 6.5, y: S0.oy + hy + 1 }, outside = run([{ kind: 'shrub', x: outPos.x, y: outPos.y, hH: 2, always: true }]), outsideNo = run([{ kind: 'shrub', x: outPos.x, y: outPos.y, hH: 2 }]);
  E.pickBuffer = pb;
  ok('without `always` a piece whose base is not on its own tile in the image is not drawn; with `always: true` it is drawn', !nope.st[0].visible && !nope.st[0].drawn && yes.st[0].visible && yes.st[0].drawn, [nope.st[0], yes.st[0]]);
  { const e = { kind: 'banner', x: hx + S0.ox, y: S0.H - 1 + S0.oy, hH: 2, always: true };
    E.pickBuffer = () => ({ data: new Uint8ClampedArray(w * h * 4) }); const r = run([e]); E.pickBuffer = pb;
    ok(`an always-piece with its base at y = ${r.st[0].base[1].toFixed(0)} px (panel height ${h}) is drawn (a foreground occluder with the base outside the panel)`, r.st[0].base[1] > h && r.st[0].drawn, r.st[0]); }
  // M4c-1b (D2): an `always` piece may stand OUTSIDE the window: the ground height is the one of the nearest window tile, the position is the declared one; without `always` it is skipped as before
  { const o = outside.st[0], near = E.stage.cellOf(S0, S0.W - 0.5, outPos.y - S0.oy), expB = cam.p(outPos.x - S0.ox, outPos.y - S0.oy, SG.feetH(S0, near));
    ok(`an always-piece OUTSIDE the window (x = W + 6.5) is drawn at its declared position with the ground height of the nearest window tile (tile ${near}, base ${o.base && o.base.map((v) => v.toFixed(1))})`, o.tile < 0 && o.drawn && o.outside === true && o.groundTile === near && Math.abs(o.base[0] - expB[0]) < 1e-9 && Math.abs(o.base[1] - expB[1]) < 1e-9 && Math.abs(o.ry - cam.ry(outPos.x - S0.ox, outPos.y - S0.oy)) < 1e-12, o);
    ok('without `always` a piece outside the window is skipped (as before)', outsideNo.st[0].tile < 0 && !outsideNo.st[0].drawn && !outsideNo.st[0].visible); }
  // M4c-1b (D3): the placeholder style fields: color, shadow: false, label: false; absent or invalid = as before
  { const plain = run([base], { ignoreHidden: true }), fills = (r) => r.log.filter((e) => e[0] === 'fill').map((e) => e[1]), texts = (r) => r.log.filter((e) => e[0] === 'fillText').length;
    const col = run([Object.assign({}, base, { color: '#224422' })], { ignoreHidden: true }), bad = run([Object.assign({}, base, { color: 'red; drop' })], { ignoreHidden: true }), nosh = run([Object.assign({}, base, { shadow: false })], { ignoreHidden: true }), nolab = run([Object.assign({}, base, { label: false })], { ignoreHidden: true });
    ok('color replaces the fill of the kind (the shrub is painted #224422), an invalid colour is ignored (the paint calls of before)', fills(col).includes('#224422') && !fills(col).includes('#3f8a4a') && JSON.stringify(bad.log) === JSON.stringify(plain.log), [fills(col), fills(plain)]);
    ok(`shadow: false drops the contact shade (${fills(plain).length} fills -> ${fills(nosh).length}) and nothing else`, fills(nosh).length === fills(plain).length - 1 && !fills(nosh).includes('rgba(14,12,22,0.35)') && fills(plain).includes('rgba(14,12,22,0.35)') && texts(nosh) === texts(plain));
    ok(`label: false drops the text label (${texts(plain)} -> ${texts(nolab)}) and nothing else`, texts(plain) === 1 && texts(nolab) === 0 && JSON.stringify(fills(nolab).slice(0, fills(plain).length - 1)) === JSON.stringify(fills(plain).slice(0, fills(plain).length - 1)));
    // M4c-2 (D1): `outline: false` = no stroke of the piece and nothing else; absent = the paint calls of before
    { const strokes = (r) => r.log.filter((e) => e[0] === 'stroke').length, rest = (r) => JSON.stringify(r.log.filter((e) => e[0] !== 'stroke'));
      for (const kind of ['shrub', 'pillar', 'landmark', 'lamp', 'banner']) { const e = { kind, x: base.x, y: base.y, hH: 2 }, a0 = run([e], { ignoreHidden: true, detailNever: true }), a1 = run([Object.assign({}, e, { outline: false })], { ignoreHidden: true, detailNever: true }), a2 = run([Object.assign({}, e, { outline: true })], { ignoreHidden: true, detailNever: true });
        ok(`outline: false on a ${kind}: the ${strokes(a0)} stroke(s) are gone and every other paint call is the same; outline: true / absent = as before`, strokes(a0) > 0 && strokes(a1) === 0 && rest(a1) === rest(a0) && JSON.stringify(a2.log) === JSON.stringify(a0.log), [strokes(a0), strokes(a1)]); } }
    const pil = run([{ kind: 'pillar', x: base.x, y: base.y, hH: 2, color: '#333' }], { ignoreHidden: true }); ok('a coloured pillar takes the colour on its body and its cap (#333)', fills(pil).filter((c) => c === '#333').length === 2, fills(pil)); }
}
// (the visibility test = the Box pick render needs a canvas: it is checked in tools/ui/test_stage_objects_ui.js, with its mutation ignoreHidden)
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
