/* STAGE (mode 3), PR S1, in the viewer: the example `dac_stage` (a DAC window of 6 rooms of the real map in hero heights H), the hero placeholder, the Cam 6 hero tracking, the clamp, the suspension of the tracking, the readout and the manifest.
   T1 the terrain of `dac_stage` (whole map) = the terrain of mode 2's `real_chain5` with its rules neutral (levelH, fine, rooms, types); T2 the heights of the window = the heights of the whole map on every tile of the slice (0 differences);
   T3 mode 2 -> mode 3 -> mode 2 in one session leaves the chain and the Diorama plan of mode 2 unchanged. MUTATIONS (E.stageTest hooks, each must fail its NAMED check): the pivot on the ground, the distance not coupled to heroFrac,
   the hero at a constant screen size (tools/test_stage_cam.js), the clamp on the far side (tools/test_stage_cam.js), a focus input that changes the camera when absent (tools/test_stage_cam.js), `dac_stage` applying the Stage preset.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra)); } };
const WIN = [17, 10, 20, 27, 6, 5];
// ---- in the page
const SNAP = () => {
  const E = window.EVO, e = window.__evo, S = e.S(), st = e.st, cv = document.querySelector('#stage').children[0].querySelector('canvas'), w = cv.clientWidth, h = cv.clientHeight, cam = E.makeCam(S, e.P, e.view(), w, h), tp = st.stage.tilesPerH;
  const hx = st.hero.x - S.ox, hy = st.hero.y - S.oy, i = E.stage.cellOf(S, hx, hy), feet = E.stage.feetH(S, i), hc = feet + 0.5 * tp, c = cam.p(hx, hy, hc), hs = e.O.hero && e.O.hero.stats, r = E.stage.ratios(cam, w, h, feet), mid = cam.unp(w / 2, h / 2, hc);
  return { hero: [st.hero.x, st.hero.y], cell: [Math.floor(st.hero.x), Math.floor(st.hero.y)], room: i >= 0 ? S.roomMap[i] : 0, walk: i >= 0 && E.stage.walkable(S, i), follow: st.follow, zoom: st.zoom, focus: st.focus && st.focus.slice(), clamp: st.stageClamp && { side: st.stageClamp.side, near: st.stageClamp.near },
    centre: c, w, h, hpx: hs && hs.hpx, k: E.stage.depthScale(cam, hx, hy, feet), near: r && r.near, far: r && r.far, yawOff: st.yawOff, panX: st.panX, panY: st.panY, tp, hf: st.stage.heroFrac, box: S.sliceBox, ox: S.ox, oy: S.oy, hc, mid, info: document.querySelector('#info').innerText };
};
const HASH = () => { // the terrain of the shape in hand: heights per tile, level indices, rooms and room types (FNV-1a)
  const S = window.__evo.S(); let h = 2166136261 >>> 0; const mix = (v) => { h = Math.imul((h ^ (v & 0xffffffff)) >>> 0, 16777619) >>> 0; };
  mix(S.W); mix(S.H); mix(S.levelH.length); const th = window.__evo.P.terH; for (const v of S.levelH) mix(Math.round(v / th * 1e6)); // SCALE INVARIANT (S2a: the window has terH 4, mode 2 has terH 1): the heights in terraces for (let i = 0; i < S.n; i++) { mix(S.fine[i]); mix(S.roomMap ? S.roomMap[i] : -1); mix(S.roomType ? S.roomType[i] : -1); mix(S.void && S.void[i] ? 1 : 0); }
  return h >>> 0;
};
const PLAN = () => { // the chain and the Diorama plan of mode 2
  const e = window.__evo, P = e.P, S = e.S(); let h = 2166136261 >>> 0; const mix = (v) => { h = Math.imul((h ^ (v & 0xffffffff)) >>> 0, 16777619) >>> 0; };
  for (const v of P.chainIds || []) mix(v); for (const s of P.chainSeqs || []) for (const v of s) mix(v); const dp = P.dioPlan; if (dp) for (const q of dp.items) { mix(q.room); mix(q.eligible ? 1 : 0); mix(q.shift || 0); mix(q.bridgeLen || 0); }
  mix(S.levelH.length); for (let i = 0; i < S.n; i++) mix(S.fine[i]); return { hash: h >>> 0, chain: (P.chainIds || []).length, plan: dp ? dp.items.length : -1 };
};
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const idle = () => a.idle(), set = (k, v) => a.slider(k, v), snap = () => ev(SNAP);
  const setHero = async (x, y) => { await ev(({ x, y }) => { window.__evo.st.hero = { x, y }; window.__evo.redraw(); }, { x, y }); await idle(); };
  const near = (p, q, t) => Math.abs(p - q) <= t;
  let t0 = Date.now(); await ev(() => window.__evo.setMode('rooms')); await idle(); const tMode2 = Date.now() - t0;
  // ---- T3 / T1 reference: mode 2, real_chain5, as the user sees it
  await page.click('#examples button[data-id="real_chain5"]'); await idle(); const plan1 = await ev(PLAN);
  ok('mode 2 real_chain5 has a chain and a Diorama plan (the reference of T3)', plan1.chain > 5 && plan1.plan > 0, plan1);
  // neutral rules: what mode 3 has (no Cake / Ascension / Pocket, no chain view, no Diorama move)
  await page.evaluate(() => { const set = (id, v) => { const el = document.querySelector('#' + id); if (el && el.checked !== v) { el.checked = v; el.dispatchEvent(new Event('change', { bubbles: true })); } }; set('dacAuto', false); set('t-cake', false); set('t-ascWalls', false); set('t-pocket', false); const dv = document.querySelector('#dacView'); dv.value = 'whole'; dv.dispatchEvent(new Event('change', { bubbles: true })); const dc = document.querySelector('#dioChain'); dc.value = 'off'; dc.dispatchEvent(new Event('change', { bubbles: true })); }); await idle();
  const hashMode2 = await ev(HASH), terr2 = await ev(() => { const P = window.__evo.P, S = window.__evo.S(); return { terraces: P.terraces, spread: P.spread, centre: P.spreadCentre, levels: S.levelH.length, cake: P.cake, asc: P.ascWalls, pocket: P.pocket, dio: P.dioChain }; });
  // ---- mode 3: the default example
  t0 = Date.now(); await ev(() => window.__evo.setMode('stage')); await idle(); const tEnter = Date.now() - t0;
  const m3 = await ev(() => { const e = window.__evo, P = e.P, O = e.O, st = e.st, S = e.S(); const rooms = new Set(); for (let i = 0; i < S.n; i++) if (S.slice && S.slice[i]) rooms.add(S.roomMap[i]); return { id: st.exampleId, preset: st.preset, tech: st.tech, mode: st.mode, pocket: P.pocket, cake: P.cake, asc: P.ascWalls, dio: P.dioChain, terraces: P.terraces, spread: P.spread, centre: P.spreadCentre, tint: O.typeTint, outline: O.dioOutline, borders: O.roomBorders, rooms: [...rooms].sort((x, y) => x - y), list: st.stageRooms, banner: document.querySelector('.banner, #modeBanner, #mode-banner') ? '' : '', text: document.body.innerText }; });
  ok('mode 3 opens on the example dac_stage, Cam 6 (preset stage), technique B, one panel', m3.id === 'dac_stage' && m3.preset === 'stage' && m3.tech === 'B' && m3.mode === 'single', m3);
  ok('dac_stage: terraces 5, spread 1, centre largest, no Cake / Ascension / Pocket, no Diorama move (the Stage preset is NOT applied)', m3.terraces === 5 && m3.spread === 1 && m3.centre === 'largest' && !m3.pocket && !m3.cake && !m3.asc && m3.dio === 'off', m3);
  { const dsp = await ev(() => { const O = window.__evo.O, o = {}, c = {}; for (const k of ['roomBorders', 'nowalk', 'gateMarks', 'rampLines', 'veil', 'border', 'markers', 'edgeWarn', 'typeTint', 'dioOutline', 'outlines', 'gradient', 'features']) { o[k] = O[k]; const el = document.querySelector('#t-' + k); c[k] = el ? el.checked : null; } return { o, c }; });
    ok('dac_stage opens the CLEAN VIEW: the 8 debug aids (room borders, not-walkable tone, gate markers, ramp lines, veil, slice border, landmarks, edge-problem outline) and the tint / outline are off, their checkboxes too; outlines, cliff gradient and water / snake / cave stay on', ['roomBorders', 'nowalk', 'gateMarks', 'rampLines', 'veil', 'border', 'markers', 'edgeWarn', 'typeTint', 'dioOutline'].every((k) => dsp.o[k] === false && dsp.c[k] === false) && ['outlines', 'gradient', 'features'].every((k) => dsp.o[k] === true && dsp.c[k] === true), dsp); }
  ok('dac_stage: the window is exactly the 6 rooms of the list, in chain order', JSON.stringify(m3.rooms) === JSON.stringify(WIN.slice().sort((x, y) => x - y)) && JSON.stringify(m3.list) === JSON.stringify(WIN), m3);
  ok('the banner says "2D-HD crystallizer: in construction (S1)" and the purpose names the Pocket limit', /2D-HD crystallizer: in construction \(S1\)/.test(m3.text) && /multi-room Pocket: later PR/.test(m3.text));
  console.log(`(timing, with other work on the machine: mode 2 first entry ${tMode2} ms, mode 3 entry after it ${tEnter} ms)`);
  // ---- T1, T2
  const whole = await page.evaluate(async () => { document.querySelector('#wholeRooms').click(); }); await idle();
  const hashMode3 = await ev(HASH), terr3 = await ev(() => { const P = window.__evo.P, S = window.__evo.S(); return { terraces: P.terraces, spread: P.spread, centre: P.spreadCentre, levels: S.levelH.length }; });
  ok(`T1: the whole-map terrain of dac_stage (hash ${hashMode3}) = mode 2's real_chain5 with its rules neutral (hash ${hashMode2}): levelH, fine, rooms, types`, hashMode3 === hashMode2, [terr2, terr3]);
  await ev(() => { const S = window.__evo.S(); window.__w0 = { W: S.W, hh: Array.from(S.fine, (f) => S.levelH[f]), ty: Uint8Array.from(S.roomType) }; });
  await page.click('#examples button[data-id="dac_stage"]'); await idle();
  const t2 = await ev(() => { const S = window.__evo.S(), w0 = window.__w0; let tiles = 0, dh = 0, dt = 0; for (let y = 0; y < S.H; y++) for (let x = 0; x < S.W; x++) { const i = y * S.W + x; if (!S.slice || !S.slice[i]) continue; tiles++; const j = (y + S.oy) * w0.W + x + S.ox; if (Math.abs(S.levelH[S.fine[i]] - w0.hh[j]) > 1e-9) dh++; if (S.roomType[i] !== w0.ty[j]) dt++; } return { tiles, dh, dt, win: [S.W, S.H] }; });
  ok(`T2: the heights and room types of the window of dac_stage equal the whole map on every tile of the slice (${t2.tiles} tiles, ${t2.dh} height differences, ${t2.dt} type differences)`, t2.tiles > 2000 && t2.dh === 0 && t2.dt === 0, t2);
  // ---- the hero
  let s = await snap();
  ok(`the hero starts at the centre of the first room of the list (room ${s.room}, cell ${s.cell}), on a walkable cell`, s.room === WIN[0] && s.walk, s);
  ok(`tracking: the hero centre (feet + 0.5 H) projects to the screen centre +-1 px (${s.centre.map((v) => v.toFixed(2))} vs ${s.w / 2}, ${s.h / 2})`, near(s.centre[0], s.w / 2, 1) && near(s.centre[1], s.h / 2, 1), s);
  ok(`near/hero ${s.near.toFixed(3)} (1.39 +-0.01) and far/hero ${s.far.toFixed(3)} (0.60 +-0.01) from the viewer's own projection`, near(s.near, 1.39, 0.01) && near(s.far, 0.60, 0.01), s);
  ok(`the info line starts with the Stage readout: tilesPerH, terrace step in H, hero share of the panel, near / far, cell, room, state`, /^Stage \(2D-HD S1\): 1 H = 2 tiles · terrace step 2\.00 H · hero 13\.\d % of the panel · near\/hero 1\.39 · far\/hero 0\.60 · cell \(\d+, \d+\) · room 17 · following/.test(s.info), s.info.slice(0, 300));
  // sizes: heroFrac x tilesPerH (the same at dpr 2 below)
  const sizes = async (tag) => { for (const tp of [2, 3]) for (const hf of [0.10, 0.14, 0.17]) {
    await set('tilesPerH', tp); await idle(); await set('heroFrac', hf); await idle(); const q = await snap();
    ok(`${tag} tilesPerH ${tp} heroFrac ${hf}: hero ${q.hpx.toFixed(1)} px = ${(100 * q.hpx / q.h).toFixed(2)} % of the panel (heroFrac x depth scale of the feet ${(hf * q.k).toFixed(4)}), centre at the screen centre +-1 px`,
      Math.abs(q.hpx / (hf * q.h) - 1) <= 0.02 && Math.abs(q.hpx - hf * q.h * q.k) <= 1 && near(q.centre[0], q.w / 2, 1) && near(q.centre[1], q.h / 2, 1), q);
  } await set('tilesPerH', 2); await set('heroFrac', 0.14); await idle(); };
  await sizes('dpr 1,');
  // ---- MEASURES IN H (S2a): terH = 2 x tilesPerH, subH = 0.22 x terH, the relief in H and everything that is not a height unchanged
  { const MEAS = () => ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, tp = e.st.stage.tilesPerH; let lo = 1e9, hi = -1e9, nw = 0, h = 2166136261 >>> 0; const mix = (v) => { h = Math.imul((h ^ (v & 0xffffffff)) >>> 0, 16777619) >>> 0; };
      for (let i = 0; i < S.n; i++) if (S.slice && S.slice[i]) { mix(S.roomMap[i]); if (!(S.void && S.void[i])) { const q = S.levelH[S.fine[i]]; lo = Math.min(lo, q); hi = Math.max(hi, q); } if (S.nowalk && S.nowalk[i]) nw++; }
      const rs = S.regionSizes || [], big = Math.max(0, ...rs), tot = rs.reduce((x, y) => x + y, 0), sv = E.stairSurvival(S, P, 'B');
      return { tp, terH: P.terH, subH: P.subH, subHeff: E.subHeight(P), relH: (hi - lo) / tp, roomsHash: h >>> 0, nowalk: nw, regions: rs.length, bigPct: Math.round(1000 * big / Math.max(1, tot)) / 10, stairs: (S.stairs || []).length, carved: S.carved ? Array.from(S.carved).filter(Boolean).length : 0, cov: sv.coverage, lost: sv.lost, levels: S.levelH.length }; });
    const rows = []; for (const tpv of [1.5, 2, 3, 4]) { await set('tilesPerH', tpv); await idle(); rows.push(await MEAS()); }
    ok(`MEASURES IN H: with the switch on terH = 2 x tilesPerH for tilesPerH 1.5, 2, 3, 4 (${rows.map((r) => r.terH).join(', ')} tiles), subH = 0.22 x terH and the effective sub-terrace height is subH (the proportion is kept)`, rows.every((r) => Math.abs(r.terH - 2 * r.tp) < 1e-9 && Math.abs(r.subH - 0.22 * r.terH) < 1e-9 && Math.abs(r.subHeff - r.subH) < 1e-9), rows);
    ok(`MEASURES IN H: the relief of the window in H does not change with tilesPerH (${rows.map((r) => r.relH.toFixed(3)).join(', ')} H)`, rows.every((r) => Math.abs(r.relH - rows[0].relH) < 1e-6), rows);
    // the invariance measured in the step 0: the same rooms, not-walkable tiles, regions and stairs as with terH 1 (the switch off, the units by hand)
    await ev(() => { const el = document.querySelector('#t-stageUnits'); if (el.checked) el.click(); }); await a.slider('subH', 0.22); await idle(); await a.slider('terH', 1); await idle(); const m1 = await MEAS();
    ok(`the shape does not depend on the height unit: with terH ${m1.terH} (tiles) the rooms, not-walkable tiles (${m1.nowalk}), regions (${m1.regions}, largest ${m1.bigPct} %), stairs (${m1.stairs}, ${m1.carved} tiles, coverage ${m1.cov}) and levels (${m1.levels}) equal those at terH ${rows[1].terH} / 4 / 6 / 8`,
      rows.every((r) => r.roomsHash === m1.roomsHash && r.nowalk === m1.nowalk && r.regions === m1.regions && r.bigPct === m1.bigPct && r.stairs === m1.stairs && r.carved === m1.carved && r.cov === m1.cov && r.lost === m1.lost && r.levels === m1.levels), [m1, rows]);
    ok('the relief in TILES scales with terH exactly: terH 1 -> ' + (m1.relH * m1.tp).toFixed(3) + ' tiles (' + m1.relH.toFixed(3) + ' H at tilesPerH ' + m1.tp + '), terH ' + rows[1].terH + ' -> ' + (rows[1].relH * rows[1].tp).toFixed(3) + ' tiles = ' + rows[1].relH.toFixed(3) + ' H at tilesPerH ' + rows[1].tp, Math.abs((rows[1].relH * rows[1].tp) / (m1.relH * m1.tp) - rows[1].terH / m1.terH) < 1e-6, [m1, rows[1]]);
    // the controls: terH / subH hidden with the switch on, back (folded with the terrain controls) with it off
    const vis = () => ev(() => ['#s-terH', '#s-subH'].map((q) => document.querySelector(q).getClientRects().length > 0));
    await ev(() => { const g = document.querySelector('[data-group="1 Terrain"]'), t = g && g.querySelector(':scope > .advtoggle'); if (g && t && g.dataset.adv !== '1') t.click(); }); await page.waitForTimeout(150);
    const vOff = await vis(); await ev(() => { document.querySelector('#t-stageUnits').click(); }); await idle(); await page.waitForTimeout(150); const vOn = await vis();
    ok('the terH and subH controls come back with the switch off (terrain controls open) and are hidden with it on', vOff[0] && vOff[1] && !vOn[0] && !vOn[1], [vOff, vOn]);
    const mOn = await MEAS(); ok('turning the switch on again derives terH and subH again (it overwrites the manual values)', Math.abs(mOn.terH - 2 * mOn.tp) < 1e-9 && Math.abs(mOn.subH - 0.22 * mOn.terH) < 1e-9, mOn);
    // Reset: tilesPerH 2, heroFrac 0.14, the switch on
    await set('tilesPerH', 3); await idle(); await set('heroFrac', 0.2); await idle(); await ev(() => { const el = document.querySelector('#t-stageUnits'); if (el.checked) el.click(); }); await idle();
    await page.click('#stageReset'); await idle(); const rs = await ev(() => { const e = window.__evo; return { tp: e.st.stage.tilesPerH, hf: e.st.stage.heroFrac, u: e.st.stageUnits, terH: e.P.terH, cb: document.querySelector('#t-stageUnits').checked }; });
    ok('Reset: tilesPerH 2, heroFrac 0.14, Measures in H on (terH 4)', rs.tp === 2 && rs.hf === 0.14 && rs.u && rs.cb && rs.terH === 4, rs);
    // MUTATION: terH not derived
    await ev(() => { window.EVO.stageTest = { noDerive: true }; }); await set('tilesPerH', 3); await idle(); const mm = await MEAS(); await ev(() => { window.EVO.stageTest = null; }); await set('tilesPerH', 2); await idle();
    ok(`MUTATION: terH not derived from tilesPerH: the "terH = 2 x tilesPerH" check FAILS (tilesPerH ${mm.tp}, terH ${mm.terH})`, !(Math.abs(mm.terH - 2 * mm.tp) < 1e-9), mm); }
  // ---- the clamp at the edges of the rooms box (hero placed by hand, camera tracking)
  const box = s.box, ox = s.ox, oy = s.oy, midX = (box.x0 + box.x1) / 2, midY = (box.y0 + box.y1) / 2;
  const edge = async (name, wx, wy) => { await setHero(ox + wx, oy + wy); return { name, q: await snap() }; };
  let r = await edge('left', box.x0 + 0.5, midY);
  ok(`CLAMP left: side L, the hero is left of the centre (${r.q.centre[0].toFixed(0)} < ${r.q.w / 2}), the left screen edge is the box edge, the info says CLAMP`, r.q.clamp && r.q.clamp.side === 'L' && r.q.centre[0] < r.q.w / 2 - 5 && /CLAMP/.test(r.q.info.slice(0, 400)), r.q);
  r = await edge('right', box.x1 - 0.5, midY); ok('CLAMP right: side R, the hero is right of the centre', r.q.clamp && r.q.clamp.side === 'R' && r.q.centre[0] > r.q.w / 2 + 5, r.q);
  r = await edge('near', midX, box.y1 - 0.5); ok(`CLAMP near edge: the near flag, the hero is below the centre (${r.q.centre[1].toFixed(0)} > ${r.q.h / 2}) and its drawn height follows the depth scale (${r.q.hpx.toFixed(1)} px, k ${r.q.k.toFixed(3)})`, r.q.clamp && r.q.clamp.near && r.q.centre[1] > r.q.h / 2 + 5 && r.q.k > 1.03 && Math.abs(r.q.hpx - r.q.tp * (r.q.hf * r.q.h / r.q.tp) * r.q.k) <= 1, r.q);
  const farQ = (await edge('far', midX, box.y0 + 0.5)).q; ok('FAR edge: never clamped, the hero stays at the screen centre, the info says following', !farQ.clamp && near(farQ.centre[0], farQ.w / 2, 1) && near(farQ.centre[1], farQ.h / 2, 1) && /following/.test(farQ.info.slice(0, 400)), farQ);
  r = await edge('centre', midX, midY); ok('inside the window: no clamp, the hero at the screen centre', !r.q.clamp && near(r.q.centre[0], r.q.w / 2, 1) && near(r.q.centre[1], r.q.h / 2, 1), r.q);
  // ---- suspend: a wheel step starts from the CURRENT view
  await page.click('#stageNext'); await idle(); await page.click('#stagePrev'); await idle(); // back to the first room, following
  const c = await page.$eval('#stage canvas', (cv) => { const b = cv.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
  const z0 = (await snap()); await page.mouse.move(c[0], c[1]); await page.mouse.wheel(0, 100); await idle(); let q = await snap();
  ok(`one wheel step after tracking: the zoom changes by exactly one wheel factor (${(q.zoom / z0.zoom).toFixed(9)} = 0.9), the tracking is suspended, no jump to the fit framing`, near(q.zoom / z0.zoom, 0.9, 1e-9) && !q.follow && q.zoom > 4, [z0.zoom, q.zoom]);
  ok('... around the SAME focus: the ground point at the screen centre and the hero centre do not move', JSON.stringify(q.focus) === JSON.stringify(z0.focus) && near(q.mid[0], z0.mid[0], 1e-6) && near(q.mid[1], z0.mid[1], 1e-6) && near(q.centre[0], q.w / 2, 1) && near(q.centre[1], q.h / 2, 1), [z0.focus, q.focus, z0.mid, q.mid]);
  await page.mouse.wheel(0, -100); await idle(); q = await snap(); ok(`the next step (zoom in) is again one factor (${(q.zoom / z0.zoom).toFixed(9)} = 0.9 x 1.1)`, near(q.zoom / z0.zoom, 0.99, 1e-9), q.zoom);
  // the wheel cap: out below 4 and back in, the wheel gets back to the tracking zoom and stops at the cap max(4, 2 x tracking zoom)
  { const tz = await ev(() => window.__evo.st.trackZoom); let zq = (await snap()).zoom, n = 0; while (zq >= 4 && n++ < 40) { await page.mouse.wheel(0, 100); await idle(); zq = (await snap()).zoom; }
    const low = zq, seen = [zq]; let prev = -1, cnt = 0; while (cnt++ < 60) { await page.mouse.wheel(0, -100); await idle(); zq = (await snap()).zoom; seen.push(zq); if (zq === prev) break; prev = zq; }
    ok(`WHEEL CAP: out below 4 (${low.toFixed(2)}) and back in, the wheel passes the tracking zoom (${tz.toFixed(2)}) and stops at the cap 2 x tracking zoom (${zq.toFixed(2)})`, low < 4 && seen.some((v) => Math.abs(v / tz - 1) < 0.1) && Math.abs(zq - 2 * tz) < 1e-9, [low, tz, zq, seen.length]);
    const cap = zq; await page.mouse.wheel(0, 100); await idle(); await page.mouse.wheel(0, 100); await idle(); await page.mouse.wheel(0, -100); await page.mouse.wheel(0, -100); await page.mouse.wheel(0, -100); await idle(); zq = (await snap()).zoom; ok('WHEEL CAP: above the cap the zoom does not grow', zq <= cap + 1e-9, [zq, cap]); }
  // an orbit drag keeps the pivot; a pan drag starts from the current view: the hero (at the pivot) moves by the drag and nothing jumps back to the fit
  const mid0 = q.mid; await page.mouse.move(c[0], c[1]); await page.mouse.down(); await page.mouse.move(c[0] + 40, c[1] + 10); await page.mouse.up(); await idle(); q = await snap();
  ok('an orbit drag keeps the pivot (the ground point at the screen centre) and does not re-enable the tracking', q.yawOff !== 0 && near(q.mid[0], mid0[0], 1e-6) && near(q.mid[1], mid0[1], 1e-6) && !q.follow, [q.yawOff, mid0, q.mid]);
  const c1 = q.centre; await page.keyboard.down('Shift'); await page.mouse.move(c[0], c[1]); await page.mouse.down(); await page.mouse.move(c[0] + 30, c[1]); await page.mouse.move(c[0] + 30, c[1] + 12); await page.mouse.up(); await page.keyboard.up('Shift'); await idle(); q = await snap();
  ok(`a pan drag of (30, 12) px moves the hero centre by (${(q.centre[0] - c1[0]).toFixed(1)}, ${(q.centre[1] - c1[1]).toFixed(1)}) from the current view (no jump back to the fit)`, near(q.centre[0] - c1[0], 30, 1.5) && near(q.centre[1] - c1[1], 12, 1.5) && !q.follow, [c1, q.centre]);
  await page.check('#t-stageFollow'); await idle(); q = await snap();
  ok('the Follow toggle returns to tracking: the hero at the screen centre, the tracking zoom, pan and orbit reset', q.follow && near(q.zoom, z0.zoom, 1e-9) && q.yawOff === 0 && q.panX === 0 && q.panY === 0 && near(q.centre[0], q.w / 2, 1) && near(q.centre[1], q.h / 2, 1), q);
  await page.mouse.move(c[0], c[1]); await page.mouse.wheel(0, 100); await idle(); await page.dblclick('#stage canvas'); await idle(); q = await snap();
  ok('a double click returns to tracking too (the reset of the view)', q.follow && near(q.zoom, z0.zoom, 1e-9), q);
  // ---- input: arrow keys, click, buttons
  const free = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), st = e.st, hx = st.hero.x - S.ox, hy = st.hero.y - S.oy, tp = st.stage.tilesPerH, out = {}; for (const [d, dx, dy] of [['right', 1, 0], ['left', -1, 0], ['down', 0, 1], ['up', 0, -1]]) out[d] = E.stage.walkable(S, E.stage.cellOf(S, hx + dx * 0.25 * tp, hy + dy * 0.25 * tp)); return out; });
  const dir = Object.keys(free).find((d) => free[d]); q = await snap(); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('Arrow' + dir[0].toUpperCase() + dir.slice(1)); await idle(); let q2 = await snap();
  const dd = { right: [0.5, 0], left: [-0.5, 0], down: [0, 0.5], up: [0, -0.5] }[dir];
  ok(`arrow ${dir} moves the hero 0.25 H = 0.5 tile (${q2.hero.map((v) => v.toFixed(2))} from ${q.hero.map((v) => v.toFixed(2))}) and the camera follows`, near(q2.hero[0] - q.hero[0], dd[0], 1e-9) && near(q2.hero[1] - q.hero[1], dd[1], 1e-9) && near(q2.centre[0], q2.w / 2, 1), [q.hero, q2.hero]);
  const blocked = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(); for (let i = 0; i < S.n - 1; i++) if (S.slice && S.slice[i] && E.stage.walkable(S, i) && !E.stage.walkable(S, i + 1) && (i % S.W) < S.W - 1) return { x: S.ox + (i % S.W) + 0.75, y: S.oy + ((i / S.W) | 0) + 0.5 }; return null; });
  await setHero(blocked.x, blocked.y); q = await snap(); await page.keyboard.press('ArrowRight'); await idle(); q2 = await snap();
  ok('an arrow step into a non-walkable cell (void, water, outside the slice) is blocked: the hero does not move', JSON.stringify(q.hero) === JSON.stringify(q2.hero) && q.walk, [q.hero, q2.hero]);
  await page.click('#stageNext'); await idle(); q = await snap(); await page.focus('#s-heroFrac'); await page.keyboard.press('ArrowRight'); await idle(); q2 = await snap();
  ok('an arrow key on a focused slider changes the slider, not the hero (no collision with the controls)', JSON.stringify(q.hero) === JSON.stringify(q2.hero) && q2.hf > 0.14, [q.hero, q2.hero, q2.hf]);
  await set('heroFrac', 0.14); await idle();
  // click: a walkable cap places the hero; a non-walkable one does nothing; with the stake mode on, the click places the stake
  const FIND = () => { const E = window.EVO, e = window.__evo, S = e.S(), st = e.st, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(), r = cv.getBoundingClientRect(), cam = E.makeCam(S, e.P, v, w, h), hx = Math.floor(st.hero.x - S.ox), hy = Math.floor(st.hero.y - S.oy), found = { good: null, bad: null };
    const cand = []; for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) { const x = hx + dx, y = hy + dy; if (x < 0 || y < 0 || x >= S.W || y >= S.H || Math.hypot(dx, dy) < 3) continue; cand.push([Math.hypot(dx, dy), y * S.W + x]); } cand.sort((p, q) => p[0] - q[0]);
    for (const [, t] of cand) { if (found.good && found.bad) break; const want = E.stage.walkable(S, t) ? 'good' : S.block[t] ? 'bad' : null; if (!want || found[want]) continue; const p = cam.p((t % S.W) + 0.5, ((t / S.W) | 0) + 0.5, E.stage.feetH(S, t)); if (p[0] < 20 || p[1] < 20 || p[0] > w - 20 || p[1] > h - 20) continue;
      const hit = E.pickTile(S, e.P, st.tech, v, w, h, p[0], p[1]); if (hit && hit.tile >= 0 && (want === 'good' ? E.stage.walkable(S, hit.tile) : !E.stage.walkable(S, hit.tile))) found[want] = { x: r.left + p[0], y: r.top + p[1], tile: hit.tile }; }
    return found; };
  const pts = await ev(FIND);
  q = await snap(); await page.mouse.click(pts.good.x, pts.good.y); await idle(); q2 = await snap();
  ok(`a click on a walkable cap places the hero on the tile it resolves to (the visible tile, as for the stake)`, pts.good && q2.walk && JSON.stringify(q2.hero) !== JSON.stringify(q.hero) && q2.hero[0] % 1 === 0.5 && q2.hero[1] % 1 === 0.5, [q.hero, q2.hero, pts.good]);
  const pts2 = await ev(FIND); // (the camera followed the hero: the points are looked up again at the new view)
  if (pts2.bad) { q = await snap(); await page.mouse.click(pts2.bad.x, pts2.bad.y); await idle(); q2 = await snap(); ok('a click on a non-walkable cell (void, water, outside the slice) leaves the hero where it is', JSON.stringify(q.hero) === JSON.stringify(q2.hero), [q.hero, q2.hero]); }
  else console.log('(no non-walkable cell on screen at this framing: not tested)');
  const pts3 = await ev(FIND); await page.click('#m-stake'); q = await snap(); await page.mouse.click(pts3.good.x, pts3.good.y); await idle(); q2 = await snap(); const stake = await ev(() => window.__evo.inc.stake);
  const note = await ev(() => document.querySelector('#incInfo').innerText);
  ok('with Place stake on, the click goes to the mark (the stake, or its refusal note) and the hero does not move (the mark has priority)', (stake || note.length > 0) && JSON.stringify(q.hero) === JSON.stringify(q2.hero), [stake, note, q.hero, q2.hero]);
  await page.keyboard.press('Escape'); await page.click('#m-clear'); await idle();
  // the buttons
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); const rooms = []; for (let k = 0; k < 7; k++) { await page.click('#stageNext'); await idle(); q = await snap(); rooms.push(q.room); }
  ok(`Next room visits the centre of the rooms in chain order and wraps (${rooms.join(', ')})`, JSON.stringify(rooms) === JSON.stringify([10, 20, 27, 6, 5, 17, 10]), rooms);
  await page.click('#stagePrev'); await idle(); await page.click('#stagePrev'); await idle(); q = await snap(); ok('Previous room goes back (and the camera follows again)', q.room === 5 && q.follow && near(q.centre[0], q.w / 2, 1), q);
  // ---- the manifest block
  const mb = await ev(() => { const e = window.__evo; e.st.stage = { tilesPerH: 3, heroFrac: 0.17 }; e.st.follow = false; const b = e.viewerBlock(); e.applyViewerBlock({}); const d = { tp: e.st.stage.tilesPerH, hf: e.st.stage.heroFrac, f: e.st.follow }; e.applyViewerBlock(b); return { b: b.stage, d, back: { tp: e.st.stage.tilesPerH, hf: e.st.stage.heroFrac, f: e.st.follow } }; });
  ok('manifest: viewer.stage is written in mode 3, absent loads the defaults (2, 0.14, follow), and the block restores the values', mb.b && mb.b.tilesPerH === 3 && mb.b.heroFrac === 0.17 && mb.b.follow === false && mb.d.tp === 2 && mb.d.hf === 0.14 && mb.d.f === true && mb.back.tp === 3 && mb.back.hf === 0.17 && mb.back.f === false, mb);
  // manifests and the switch "Measures in H" (S2a): without the `units` key they behave as before (the switch stays, the units follow the loaded tilesPerH); with it, the switch is set
  { const ap = (v) => ev((v) => { const e = window.__evo; e.applyViewerBlock(v); return { tp: e.st.stage.tilesPerH, u: e.st.stageUnits, cb: document.querySelector('#t-stageUnits').checked, terH: e.P.terH, subH: e.P.subH }; }, v);
    await ev(() => { const e = window.__evo; if (!e.st.stageUnits) { document.querySelector('#t-stageUnits').click(); } }); await idle();
    let r1 = await ap({ stage: { tilesPerH: 3, heroFrac: 0.14 } }); ok('manifest viewer.stage WITHOUT units (a manifest of S1): the switch stays on and terH / subH follow the loaded tilesPerH (3 -> terH 6, subH 1.32)', r1.u && r1.cb && r1.tp === 3 && r1.terH === 6 && Math.abs(r1.subH - 1.32) < 1e-9, r1);
    r1 = await ap({}); ok('a manifest without the stage block: the defaults (tilesPerH 2) and the units follow (terH 4)', r1.u && r1.tp === 2 && r1.terH === 4, r1);
    r1 = await ap({ stage: { tilesPerH: 3, units: false } }); ok('manifest viewer.stage with units false: the switch is off (the checkbox too) and terH / subH are not derived (terH stays 4)', !r1.u && !r1.cb && r1.tp === 3 && r1.terH === 4, r1);
    r1 = await ap({ stage: { tilesPerH: 3, units: true } }); ok('manifest viewer.stage with units true: the switch is on and the units are derived again (terH 6)', r1.u && r1.cb && r1.terH === 6, r1);
    const wb = await ev(() => window.__evo.viewerBlock().stage); ok('viewerBlock writes the switch in viewer.stage.units', wb && wb.units === true && wb.tilesPerH === 3, wb);
    await ap({ stage: { tilesPerH: 2, units: true } }); }
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); s = await snap(); ok('re-clicking the example restores the defaults (tilesPerH 2, heroFrac 0.14, following, hero in the first room)', s.tp === 2 && s.hf === 0.14 && s.follow && s.room === WIN[0], s);
  // ---- legacy examples: no hero, no tracking, the controls greyed with a reason
  for (const id of ['x4_stage', 'diorama31_stage']) {
    await page.click(`#examples button[data-id="${id}"]`); await idle();
    const lg = await ev(() => { const e = window.__evo, b = document.querySelector('#stagePrev'); return { hero: e.O.hero, focus: e.view().focus, info: document.querySelector('#info').innerText.slice(0, 200), dis: b.disabled, tip: b.closest('.row').title || b.title, contract: e.O.contract }; });
    ok(`legacy example ${id}: no hero, no focus (the camera of today), no Stage readout, the hero controls greyed ("Requires: ...")`, lg.hero === null && !lg.focus && !/Stage \(2D-HD/.test(lg.info) && lg.dis && /Requires/.test(lg.tip) && lg.contract === true, lg);
  }
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); s = await snap();
  ok('back on dac_stage: the hero controls are enabled', await ev(() => !document.querySelector('#stagePrev').disabled && !document.querySelector('#s-tilesPerH').disabled));
  // ---- the other modes do not show the Stage controls
  await ev(() => window.__evo.setMode('terrain')); await idle(); ok('mode 1 hides the Stage controls', await ev(() => ['#stagePrev', '#s-tilesPerH', '#t-stageFollow'].every((q) => document.querySelector(q).closest('.mh') || document.querySelector(q).closest('label,.row').classList.contains('mh'))));
  // ---- T3: mode 2 -> mode 3 -> mode 2 in one session
  await ev(() => window.__evo.setMode('rooms')); await idle(); await page.click('#examples button[data-id="real_chain5"]'); await idle(); const plan2 = await ev(PLAN);
  ok(`T3: mode 2 -> mode 3 -> mode 2: the chain and the Diorama plan are unchanged (hash ${plan2.hash} = ${plan1.hash}, ${plan2.chain} chain rooms, ${plan2.plan} plan items)`, plan2.hash === plan1.hash && plan2.chain === plan1.chain && plan2.plan === plan1.plan, [plan1, plan2]);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close();
  // ---- dpr 2 (a second page: the hero size in CSS px does not depend on the pixel ratio)
  { const b = await open({ w: 1500, h: 900, modes: true, dpr: 2 }), pg = b.page; await pg.evaluate(() => window.__evo.setMode('stage')); await b.idle();
    const sz = async (tp, hf) => { await b.slider('tilesPerH', tp); await b.idle(); await b.slider('heroFrac', hf); await b.idle(); return pg.evaluate(SNAP); };
    for (const tp of [2, 3]) for (const hf of [0.10, 0.14, 0.17]) { const q3 = await sz(tp, hf); ok(`dpr 2, tilesPerH ${tp} heroFrac ${hf}: hero ${q3.hpx.toFixed(1)} px = ${(100 * q3.hpx / q3.h).toFixed(2)} % of the panel, centre at the screen centre +-1 px`, Math.abs(q3.hpx / (hf * q3.h) - 1) <= 0.02 && Math.abs(q3.hpx - hf * q3.h * q3.k) <= 1 && near(q3.centre[0], q3.w / 2, 1) && near(q3.centre[1], q3.h / 2, 1), q3); }
    ok('dpr 2: no page errors', b.errs.length === 0, b.errs); await b.browser.close(); }
  // ---- MUTATIONS (E.stageTest hooks; each must fail its NAMED check)
  { const b = await open({ w: 1500, h: 900, modes: true }), pg = b.page, run = (f, x) => pg.evaluate(f, x); await run(() => window.__evo.setMode('stage')); await b.idle();
    const hooks = (o) => run((o) => { window.EVO.stageTest = o; window.__evo.redraw(); }, o);
    await hooks({ pivotGround: true }); await b.idle(); let m = await run(SNAP); ok('MUTATION: the pivot on the ground instead of the hero centre: the "hero centre at the screen centre" check FAILS', !(near(m.centre[0], m.w / 2, 1) && near(m.centre[1], m.h / 2, 1)), m.centre);
    await hooks({ noHeroFrac: true }); await b.slider('heroFrac', 0.17); await b.idle(); m = await run(SNAP); ok('MUTATION: the distance not coupled to heroFrac (slider 0.17): the "hero = heroFrac x panel height" check FAILS', !(Math.abs(m.hpx / (0.17 * m.h) - 1) <= 0.02), [m.hpx, 0.17 * m.h]);
    await hooks(null); await b.slider('heroFrac', 0.14); await b.idle();
    await hooks({ presetLeak: true }); await pg.evaluate(async () => { document.querySelector('#examples button[data-id="dac_stage"]').click(); }); await b.idle(); await pg.evaluate(() => document.querySelector('#wholeRooms').click()); await b.idle(); const hm = await run(HASH), pm = await run(() => ({ terraces: window.__evo.P.terraces, spread: window.__evo.P.spread }));
    ok(`MUTATION: dac_stage applying the Stage preset (terraces ${pm.terraces}, spread ${pm.spread}): the T1 "terrain = real_chain5 neutral" check FAILS`, hm !== hashMode2, [hm, hashMode2]);
    await hooks(null); await b.browser.close(); }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
