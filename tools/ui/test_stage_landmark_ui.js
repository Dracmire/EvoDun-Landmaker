/* STAGE LANDMARK (mode 3, PR S4c) in the viewer: the `landmark` entry of the objects list of `dac_stage` (src/objects.js), same switch "Stage objects".
   (1) the example declares it (10 entries) and it obeys the placement rules of S4a (walkable, outside the 3 columns of every transition, >= 2 tiles from their bottom / top tiles) in the last room of the chain (room 5); mutation landmarkOnStair;
   (2) the apparent height: with the hero at d = 10, 8, 6, 4, 2, 1 H (tilesPerH 2, 2.5, 3; the hero stands d * tilesPerH tiles from it) the landmark's pixel height / (tilesPerH * cam.sc * k at its depth) = landmarkH(d) within 1 %; mutation tilesNotH;
   (3) continuity and monotony over a sweep of d from 10 to 1 H in 0.25 H steps (never drops when approaching, <= 0.1 H per step, hFar / hNear plateaus); mutations noDistance, hardStep;
   (4) the base detail: absent at 5 H, partial at 3.5 H, full at 3 H and nearer; each piece is drawn only if its own base is on its own tile in the pick buffer (an independent oracle), a case with the 3 pieces visible (a temporary landmark on flat ground) and the case of the example (the sign hidden behind the rim, the lamps drawn); mutations detailAlways, detailNever, pieceIgnoreHidden;
   (5) NOTHING REBUILDS S: 22 hero positions between 10 and 1 H and the switch on / off leave S and S.cache the same objects (S.fine / S.levelH hash equal); mutation rebuildOnMove; off = the identical pixels and the 9 S4a objects have the same stats with and without the landmark;
   (6) the common depth order (a landmark nearer than the hero covers it; heroAlwaysTop FAILS) and a hidden base is not drawn (ignoreHidden FAILS);
   (7) the MEASURED TABLE (and the minimum margin of the top over every walkable tile of room 5 with the base visible: no top outside the panel at tilesPerH 2; LM_SCAN_ALL=1 also prints tilesPerH 2.5 and 3) d -> (px height, margin of the top over the panel's top edge, as a share of the panel height) at Cam 6 yaw 180, printed.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_landmark_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const LX = 55.5, LY = 135.5, DIR = [-13 / Math.hypot(13, 9), -9 / Math.hypot(13, 9)]; // the landmark, and the direction toward the 8 H hero position (42.5, 126.5): the ray the heroes stand on
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const objs = async (on) => { const cur = await ev(() => window.__evo.st.stage.objects === 'on'); if (cur !== on) { await page.click('#t-stageObjects'); await idle(); } };
  const pix = async () => crypto.createHash('sha1').update(await a.canvas()).digest('hex');
  const mut = (m) => ev((m) => { window.EVO.objectsTest = m ? { [m]: true } : undefined; }, m);
  const atD = async (d, tp) => { const x = LX + DIR[0] * d * tp, y = LY + DIR[1] * d * tp; await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await idle(); };
  // the landmark's figures of the last frame: d, h in H, its pixel height over the pixels of one H at its depth (tilesPerH * cam.sc * k), the top margin
  const LM = () => ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.O.objects.stats.find((s) => s.kind === 'landmark'); if (!st) return null; const cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = e.st.persH || cv.clientHeight, cam = E.makeCam(S, e.P, e.view(), w, h), tp = e.st.stage.tilesPerH, x = st.x - S.ox, y = st.y - S.oy, i = E.stage.cellOf(S, x, y), k = E.stage.depthScale(cam, x, y, E.stage.feetH(S, i)), unit = tp * cam.sc * k;
    // the oracle of the base detail: is each piece's base on its own tile in the pick buffer (an independent re-implementation of the S4a ownGround)?
    const D = E.pickBuffer(S, e.P, e.view(), w, h).data, code = (px, py) => { const X = Math.round(px), Y = Math.round(py); if (X < 0 || Y < 0 || X >= w || Y >= h) return -1; const q = (Y * w + X) * 4; return D[q + 3] === 255 ? (D[q] << 16) | (D[q + 1] << 8) | D[q + 2] : -1; }, ya = (e.st.stage.yaw || 0) * Math.PI / 180, cx = Math.sin(ya), cy = Math.cos(ya);
    const oracle = E.objects.DETAIL.pieces.map((pc) => { const x2 = x + (pc.side * cy + pc.front * cx) * tp, y2 = y + (-pc.side * cx + pc.front * cy) * tp, i2 = E.stage.cellOf(S, x2, y2); if (i2 < 0) return null; const b2 = cam.p(x2, y2, E.stage.feetH(S, i2)); return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = code(b2[0] + dx, b2[1] + dy); return c === ((4 << 20) | i2) || c === ((3 << 20) | i2); }); });
    return { d: st.d, hH: st.hH, hpx: st.hpx, ratio: st.hpx / unit, visible: st.visible, drawn: st.drawn, alpha: st.alpha, detail: (st.detail || []).map((q) => ({ kind: q.kind, visible: q.visible, drawn: q.drawn })), oracle, top: st.base[1] - st.hpx, margin: (st.base[1] - st.hpx) / h, panelH: h, heroPx: e.O.hero.stats ? e.O.hero.stats.hpx : null }; });
  const SHASH = () => ev(() => { const S = window.__evo.S(); let h = 7; for (let i = 0; i < S.n; i++) h = (h * 31 + S.fine[i]) % 1000000007; for (const v of S.levelH) h = (h * 31 + Math.round(v * 1e6)) % 1000000007; return h; });
  const expected = (d) => ev((d) => window.EVO.objects.landmarkH(d), d);
  // (1) the example and the placement rules
  await setMode('stage'); await clickEx('dac_stage');
  const L0 = await ev(() => window.__evo.st.stage.objectList.map((q) => Object.assign({}, q)));
  const lm = L0.filter((q) => q.kind === 'landmark');
  ok(`the example declares ${L0.length} entries, one of them a landmark with its own parameters (${JSON.stringify(lm[0])})`, L0.length === 10 && lm.length === 1 && lm[0].hFar === 1.5 && lm[0].hNear === 3 && lm[0].dFar === 8 && lm[0].dNear === 2, lm);
  const RULES = (list) => ev((list) => { const e = window.__evo, S = e.S(), W = S.W, H = S.H, bad = [], foot = new Set(), bt = [];
    for (const r of S.stairs) { for (const st of r.steps) for (const t of st.tiles) foot.add(t); for (const t of r.bottom) { foot.add(t); bt.push(t); } for (const t of r.top) { foot.add(t); bt.push(t); } }
    list.forEach((q, k) => { const x = Math.floor(q.x - S.ox), y = Math.floor(q.y - S.oy), i = y * W + x; if (x < 0 || y < 0 || x >= W || y >= H) { bad.push([k, 'window']); return; } if (S.block[i] || (S.void && S.void[i]) || !(S.region[i] >= 0) || (S.nowalk && S.nowalk[i])) bad.push([k, 'walkable']); if (foot.has(i)) bad.push([k, 'stair columns']);
      if (S.roomMap[i] !== 5) bad.push([k, 'room 5']); for (const t of bt) if (Math.max(Math.abs((t % W) - x), Math.abs(((t / W) | 0) - y)) < 2) { bad.push([k, 'bottom/top']); break; } });
    return bad; }, list);
  { const bad = await RULES(lm); ok('the landmark obeys the placement rules: walkable, outside the 3 columns of every transition, >= 2 tiles from their bottom / top tiles, in room 5 (the last of the chain)', bad.length === 0, bad);
    const onStep = await ev(() => { const S = window.__evo.S(), r = S.stairs[0], t = r.steps[1].tiles[1]; return { kind: 'landmark', x: (t % S.W) + S.ox + 0.5, y: ((t / S.W) | 0) + S.oy + 0.5 }; });
    const m = await RULES([onStep]); ok('MUTATION landmarkOnStair (the landmark put on the middle column of a step): the placement rules FAIL', m.some((b) => b[1] === 'stair columns'), m); }
  await objs(true);
  // (2) the height in H, for tilesPerH 2, 2.5 and 3
  for (const tp of [2, 2.5, 3]) { if (tp !== (await ev(() => window.__evo.st.stage.tilesPerH))) { await a.slider('tilesPerH', tp); await idle(); }
    const rows = []; for (const d of [10, 8, 6, 4, 2, 1]) { await atD(d, tp); const r = await LM(), want = await expected(d); rows.push({ d, got: +r.ratio.toFixed(4), want: +want.toFixed(4), dst: +r.d.toFixed(3), okd: Math.abs(r.d - d) < 0.01 && Math.abs(r.ratio / want - 1) <= 0.01 }); }
    ok(`tilesPerH ${tp}: the landmark's pixel height / (tilesPerH x cam.sc x k) = landmarkH(d) within 1 % at d = 10, 8, 6, 4, 2, 1 H (${rows.map((q) => q.d + ' H: ' + q.got).join('; ')})`, rows.every((q) => q.okd), rows);
    if (tp === 2.5) { await mut('tilesNotH'); await atD(6, tp); const r = await LM(); await mut(null); ok('MUTATION tilesNotH (the distance in tiles): the height check FAILS at tilesPerH 2.5, d = 6 H', !(Math.abs(r.ratio / (await expected(6)) - 1) <= 0.01), r); } }
  await a.slider('tilesPerH', 2); await idle();
  // (3) continuity and monotony: d from 10 to 1 H in 0.25 H steps
  const sweep = async () => { const out = []; for (let d = 10; d >= 1 - 1e-9; d -= 0.25) { await atD(d, 2); const r = await LM(); out.push({ d, h: r.hH }); } return out; };
  const judge = (sw) => { let mono = true, step = 0; for (let k = 1; k < sw.length; k++) { if (sw[k].h < sw[k - 1].h - 1e-9) mono = false; step = Math.max(step, Math.abs(sw[k].h - sw[k - 1].h)); } const far = sw.filter((q) => q.d >= 8 - 1e-9).every((q) => Math.abs(q.h - 1.5) < 1e-9), nearP = sw.filter((q) => q.d <= 2 + 1e-9).every((q) => Math.abs(q.h - 3) < 1e-9); return { mono, step: +step.toFixed(4), far, nearP, ok: mono && step <= 0.1 && far && nearP }; };
  { const j = judge(await sweep()); ok(`sweep of d from 10 to 1 H (37 frames): h never drops when approaching, the largest step is ${j.step} H (<= 0.1), h = hFar for d >= 8 and hNear for d <= 2`, j.ok, j); }
  for (const m of ['noDistance', 'hardStep']) { await mut(m); const j = judge(await sweep()); await mut(null); ok(`MUTATION ${m}: the continuity / plateau check FAILS (${JSON.stringify(j)})`, !j.ok, j); }
  // (4) the base detail
  const DET = async (d, m) => { if (m) await mut(m); await atD(d, 2); const r = await LM(); if (m) await mut(null); return r; };
  const atXY = async (x, y) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await idle(); };
  const same = (r) => r.detail.length === 3 && r.detail.every((q, k) => q.drawn === r.oracle[k] && q.visible === r.oracle[k]);
  { const r5 = await DET(5), r35 = await DET(3.5), r3 = await DET(3), r2 = await DET(2);
    ok(`base detail alpha: absent at 5 H (alpha ${r5.alpha}, no pieces), partial at 3.5 H (${(r35.alpha || 0).toFixed(2)}), full at 3 H and 2 H (${r3.alpha} / ${r2.alpha}), 3 pieces examined when there is alpha`, r5.visible && r5.alpha === 0 && r5.detail.length === 0 && r35.alpha > 0.05 && r35.alpha < 0.95 && r3.alpha === 1 && r2.alpha === 1 && [r35, r3, r2].every((r) => r.detail.length === 3), { r5, r35, r3, r2 });
    ok(`the pieces drawn = the pieces whose base is visible in the pick buffer (3.5 H: ${r35.detail.map((q) => +q.drawn).join('')}, 3 H: ${r3.detail.map((q) => +q.drawn).join('')}, 2 H: ${r2.detail.map((q) => +q.drawn).join('')})`, same(r35) && same(r3) && same(r2), { r35, r3, r2 });
    const ma = await DET(5, 'detailAlways'), mn = await DET(3, 'detailNever');
    ok('MUTATION detailAlways (the detail at 5 H): the absent-at-5-H check FAILS', ma.alpha === 1 && ma.detail.length === 3, ma); ok('MUTATION detailNever (no detail at 3 H): the full-at-3-H check FAILS', mn.alpha === 0 && mn.detail.length === 0, mn); }
  // (4a) a temporary landmark on flat ground of the start terrace, the hero 3 H toward the camera: the 3 pieces are visible and drawn
  { let found = null; const cands = []; for (const yy of [118.5, 116.5, 114.5, 120.5]) for (const xx of [58.5, 56.5, 60.5, 54.5, 62.5, 52.5]) cands.push([xx, yy]);
    for (const [xx, yy] of cands) { await ev(([xx, yy]) => { window.__evo.st.stage.objectList = [{ kind: 'landmark', x: xx, y: yy }]; }, [xx, yy]); await atXY(xx, yy - 6); const r = await LM(); if (r && r.visible && r.detail.length === 3 && r.detail.every((q) => q.visible)) { found = { at: [xx, yy], r }; break; } }
    ok(`(a) a temporary landmark at ${found ? found.at.join(', ') : '-'} (flat ground, hero 3 H toward the camera): the 3 pieces have their base visible and are drawn, equal to the pick-buffer oracle`, found && found.r.detail.every((q) => q.drawn) && same(found.r) && Math.abs(found.r.d - 3) < 0.01, found);
    await ev((l) => { window.__evo.st.stage.objectList = l; }, L0);
    // (4b) the example: hero at (50.5, 131.5) (3.2 H): the sign's base is behind the rim of the terrace (not on its own tile): NOT drawn; the two lamps are
    await atXY(50.5, 131.5); const rb = await LM();
    ok(`(b) the example at the hero (50.5, 131.5), d ${rb.d.toFixed(2)} H: the lamps are drawn and the sign is NOT (its base is not on its own tile in the image): [${rb.detail.map((q) => q.kind + ':' + (q.drawn ? 'drawn' : 'hidden')).join(', ')}], equal to the oracle`, rb.visible && rb.alpha > 0.5 && rb.detail.map((q) => q.drawn).join() === 'true,true,false' && same(rb), rb);
    await mut('pieceIgnoreHidden'); await atXY(50.5, 131.5); const rm = await LM(); await mut(null);
    ok('MUTATION pieceIgnoreHidden (the pieces drawn although their base is hidden): the sign is drawn and the case (b) FAILS', rm.detail[2] && rm.detail[2].drawn === true && !same(rm), rm); }
  // (5) nothing rebuilds S
  { await ev(() => { const e = window.__evo; window.__S0 = e.S(); window.__C0 = e.S().cache; }); const h0 = await SHASH(); // (the tilesPerH slider above rebuilt S: the reference is taken now)
    await atD(10, 2); let same = true, n = 0; for (let k = 0; k < 22; k++) { const d = 10 - k * (9 / 21); await atD(d, 2); n++; if (!(await ev(() => window.__evo.S() === window.__S0 && window.__evo.S().cache === window.__C0))) same = false; }
    await objs(false); await objs(true); await objs(false); await objs(true); const h1 = await SHASH(), still = await ev(() => window.__evo.S() === window.__S0 && window.__evo.S().cache === window.__C0);
    ok(`${n} hero positions between 10 and 1 H and the switch on / off / on / off / on leave S and S.cache the same objects (S.fine / S.levelH hash ${h0 === h1 ? 'equal' : 'DIFFERENT'})`, same && still && h0 === h1, { same, still, h0, h1 });
    await mut('rebuildOnMove'); await atD(6, 2); await atD(5, 2); const rb = await ev(() => window.__evo.S() !== window.__S0); await mut(null); ok('MUTATION rebuildOnMove (the shape rebuilt when the hero moves): the same-S check FAILS', rb);
    await redrawFix(); }
  async function redrawFix() { await ev(() => { window.__evo.draw(); }); await idle(); await ev(() => { window.__S0 = window.__evo.S(); window.__C0 = window.__evo.S().cache; }); }
  // off = the identical pixels; the 9 S4a objects have the same stats with and without the landmark
  { await ev(() => { const e = window.__evo; e.st.hero = { x: 61.5, y: 117.5 }; e.st.follow = true; }); await objs(false); await redrawFix(); const p0 = await pix(), s0 = await SHASH(); await objs(true); await objs(false); const p1 = await pix(), s1 = await SHASH();
    ok('objects off: the identical pixels and the identical shape after turning the objects (landmark included) on and off', p0 === p1 && s0 === s1);
    const stats = async (list) => { await ev((l) => { const e = window.__evo; e.st.stage.objectList = l; e.redraw(); }, list); await idle(); return ev(() => window.__evo.O.objects.stats.filter((s) => s.kind !== 'landmark').map((s) => JSON.stringify([s.kind, s.x, s.y, s.hH, s.visible, s.drawn, s.hpx, s.wpx, s.k, s.lw, s.base, s.tile]))); };
    await objs(true); const withLm = await stats(L0), without = await stats(L0.filter((q) => q.kind !== 'landmark')); await ev((l) => { window.__evo.st.stage.objectList = l; }, L0);
    ok(`with the landmark in the list the ${withLm.length} S4a objects have the same stats (visible, drawn, pixel sizes, bases) as without it`, withLm.length === 9 && JSON.stringify(withLm) === JSON.stringify(without), [withLm.length]); }
  // (6) the common depth order and a hidden base
  { await ev((l) => { const e = window.__evo; e.st.stage.objectList = [Object.assign({}, l)]; e.st.hero = { x: 55.5, y: 136.5 }; e.st.follow = true; e.redraw(); }, lm[0]); await idle();
    const pixelAtHero = () => ev(() => { const e = window.__evo, S = e.S(), E = window.EVO, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = e.st.persH || cv.clientHeight, cam = E.makeCam(S, e.P, e.view(), w, h), hw = { x: e.st.hero.x - S.ox, y: e.st.hero.y - S.oy }, i = E.stage.cellOf(S, hw.x, hw.y), feet = E.stage.feetH(S, i), c = cam.p(hw.x, hw.y, feet + 0.5 * e.st.stage.tilesPerH), d = cv.getContext('2d').getImageData(Math.round(c[0]), Math.round(c[1]), 1, 1).data; return { rgb: [d[0], d[1], d[2]], drawn: e.O.objects.stats.some((s) => s.drawn) }; });
    const near = (rgb, t) => Math.abs(rgb[0] - t[0]) + Math.abs(rgb[1] - t[1]) + Math.abs(rgb[2] - t[2]) <= 30, po = await pixelAtHero();
    ok(`a landmark nearer than the hero covers it: the pixel at the hero's centre is the tower's stone (${po.rgb.join(',')}), not the hero's pink`, po.drawn && near(po.rgb, [185, 178, 166]), po);
    await mut('heroAlwaysTop'); await ev(() => window.__evo.redraw()); await idle(); const pm = await pixelAtHero(); await mut(null); ok(`MUTATION heroAlwaysTop: the pixel is the hero's pink (${pm.rgb.join(',')}): the order check FAILS`, near(pm.rgb, [255, 79, 163]) && !near(pm.rgb, [185, 178, 166]), pm);
    const hid = async (m) => { await mut(m); await ev(() => { const e = window.__evo; e.st.stage.objectList = [{ kind: 'landmark', x: 64.5, y: 117.5 }]; e.st.hero = { x: 61.5, y: 117.5 }; e.st.follow = true; e.redraw(); }); await idle(); const r = await LM(); await mut(null); return r; };
    const h1 = await hid(null), h2 = await hid('ignoreHidden'); ok('a landmark whose base is hidden behind higher terrain (the pit of S4a, on the panel) is NOT drawn', h1 && !h1.visible && !h1.drawn, h1); ok('MUTATION ignoreHidden (draw it anyway): the hidden-base check FAILS', h2 && h2.drawn === true, h2); }
  // (7) the measured table at Cam 6 yaw 180, tilesPerH 2, the declared landmark, objects on
  await ev((l) => { window.__evo.st.stage.objectList = l; }, L0);
  const table = []; for (const d of [8, 6, 4, 2]) { await atD(d, 2); const r = await LM(); table.push({ d, hH: +r.hH.toFixed(3), hpx: Math.round(r.hpx), perH: +(r.hpx / r.hH).toFixed(1), heroPx: r.heroPx && Math.round(r.heroPx), topY: Math.round(r.top), margin: +r.margin.toFixed(3), inside: r.top >= 0, visible: r.visible, alpha: r.alpha }); }
  console.log('TABLE d(H)  h(H)   px   px/H  hero px  top y  margin(top / panel)  inside  base visible  detail alpha  (panel height ' + (await LM()).panelH + ' px)');
  for (const r of table) console.log(`TABLE ${r.d}  ${r.hH}  ${r.hpx}  ${r.perH}  ${r.heroPx}  ${r.topY}  ${r.margin}  ${r.inside}  ${r.visible}  ${r.alpha}`);
  // (7b) the minimum margin of the top over EVERY walkable tile of room 5 whose landmark base is visible (the hero standing on it)
  const scanTop = async (tp) => { if (tp !== (await ev(() => window.__evo.st.stage.tilesPerH))) { await a.slider('tilesPerH', tp); await idle(); }
    const tiles = await ev(() => { const S = window.__evo.S(), out = []; for (let i = 0; i < S.n; i++) if (S.roomMap[i] === 5 && !S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i])) out.push([(i % S.W) + S.ox + 0.5, ((i / S.W) | 0) + S.oy + 0.5]); return out; });
    let vis = 0, out = 0, min = { m: 9 }; for (const [x, y] of tiles) { await atXY(x, y); const r = await LM(); if (!r || !r.visible) continue; vis++; if (r.top < 0) out++; if (r.margin < min.m) min = { m: +r.margin.toFixed(3), x, y, d: +r.d.toFixed(2) }; } return { tp, tiles: tiles.length, visible: vis, out, min }; };
  { const r2 = await scanTop(2); console.log(`SCAN tilesPerH 2: ${r2.visible} of ${r2.tiles} walkable tiles of room 5 see the landmark base; minimum margin of the top ${r2.min.m} at (${r2.min.x}, ${r2.min.y}), d ${r2.min.d} H; tops outside the panel: ${r2.out}`);
    ok('tilesPerH 2: no top of the landmark (hero on any walkable tile of room 5 with the base visible) is outside the panel (top >= 0)', r2.visible > 20 && r2.out === 0, r2);
    if (process.env.LM_SCAN_ALL) for (const tp of [2.5, 3]) { const r = await scanTop(tp); console.log(`SCAN tilesPerH ${tp}: ${r.visible} of ${r.tiles} see the base; minimum margin ${r.min.m} at (${r.min.x}, ${r.min.y}), d ${r.min.d} H; tops outside the panel: ${r.out}`); }
    await a.slider('tilesPerH', 2); await idle(); }
  ok('the table is measured (4 rows, the landmark grows when approaching)', table.length === 4 && table[3].hpx > table[0].hpx, table);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
