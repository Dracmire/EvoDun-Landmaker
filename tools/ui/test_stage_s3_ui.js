/* S3 (transitions of the 2D-HD window, mode 3): the example's own base yaw of Cam 6, the steps of the window, the hero at yaw 180.
   (1) YAW: `dac_stage` declares `yaw: 180` (src/modes.js, like `display`); the view has yaw 180 there and gets back the value it had before on every exit (the legacy examples: Shrine-Pier x4 declares the pack's stageYaw 90, the Diorama 31 one has 0).
       MUTATION skipYawRestore (E.modesTest): the yaw of the last example survives -> the restore check FAILS.
   (2) THE TRANSITIONS of the window: stairStyle 0, tread 1 (A1: 3 risers of 0.19 terH, 2 treads), rampPreferFill on; the 4 stairs are steps (no sloped surface: the hero's feet = the level), all 4 rise AWAY from the camera at yaw 180 (they were all TOWARD at yaw 0); narrowed / dropped reported.
   (3) THE HERO at yaw 180 (the expectations of the S3 step 0, part b): the arrow keys are mirrored, the clamp is symmetric (the near side is the north one), the screen -> ground inverse is exact in front of the camera, a click resolves to the tile it was projected from.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_s3_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const goHero = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.st.follow = true; e.redraw(); }, id); await idle(); };
  const YAW = () => ev(() => window.__evo.view().yaw);
  const baseYawOf = () => ev(() => { const e = window.__evo; return { yaw: e.view().yaw, base: e.st.stage.yaw === undefined ? null : e.st.stage.yaw }; });
  // ---- (1) the yaw: the legacy examples first (their yaw is the pack's / 0), then dac_stage, then back
  await setMode('stage'); await clickEx('x4_stage'); const y4 = await YAW(); await clickEx('diorama31_stage'); const y31 = await YAW();
  await clickEx('dac_stage'); const yd = await baseYawOf();
  ok('dac_stage declares yaw 180 in its example (src/modes.js) and the view has it', yd.yaw === 180 && yd.base === 180, yd);
  await clickEx('x4_stage'); const y4b = await YAW(); await clickEx('dac_stage'); await clickEx('diorama31_stage'); const y31b = await YAW();
  ok(`the yaw comes back on exit: Shrine-Pier x4 (pack stageYaw) ${y4} -> 180 -> ${y4b}, Diorama 31 ${y31} -> 180 -> ${y31b}`, y4 === 90 && y4b === y4 && y31 === 0 && y31b === y31, { y4, y4b, y31, y31b });
  await setMode('terrain'); ok('another mode (1 Terrain, Cam 3): no yaw of the window (ortho, 0)', (await ev(() => window.__evo.st.stage.yaw === undefined)) && (await YAW()) === 0);
  await setMode('stage');
  // the example yaw is NOT a manifest key: saving and loading does not change it, and the stageReset button keeps it
  await clickEx('dac_stage'); await page.click('#stageReset'); await idle(); ok('the Reset button of the Stage block keeps the example yaw (it resets the scale, not the camera axis)', (await YAW()) === 180);
  // MUTATION skipYawRestore
  await ev(() => { window.EVO.modesTest = { skipYawRestore: true }; }); await clickEx('dac_stage'); await clickEx('x4_stage'); const yMut = await YAW(); await ev(() => { window.EVO.modesTest = null; }); await clickEx('diorama31_stage');
  ok(`MUTATION skipYawRestore: the yaw restore check FAILS (after leaving dac_stage the yaw is ${yMut} instead of 90)`, yMut !== 90, yMut);
  // ---- (2) the transitions of the window
  await clickEx('dac_stage');
  const T = await ev(() => { const e = window.__evo, S = e.S(), P = e.P; const recs = S.stairs.map((r) => ({ steps: r.steps.length, ramp: !!r.ramp, dy: r.dir[1], dx: r.dir[0], mode: r.mode, narrowed: !!r.narrowed, cols: r.cols.length })); const camToward = [Math.sin(e.view().yaw * Math.PI / 180), Math.cos(e.view().yaw * Math.PI / 180)];
    const cls = recs.map((r) => { const d = r.dx * Math.round(camToward[0]) + r.dy * Math.round(camToward[1]); return d > 0 ? 'toward' : d < 0 ? 'away' : 'lateral'; });
    return { style: P.stairStyle, tread: P.tread, fill: P.rampPreferFill, n: recs.length, anyRamp: recs.some((r) => r.ramp), cls, narrowed: recs.filter((r) => r.narrowed).length, dropped: S.stairInfo.dropped, treads: recs.map((r) => r.steps), cols: recs.map((r) => r.cols), levels: S.maxFine + 1, feetErr: Math.max(0, ...S.stairs.flatMap((r) => r.steps.flatMap((st) => st.tiles.map((t) => (st.cand ? Math.abs(S.levelH[S.fine[t]] - st.cand.h) : 1e9))))), stepTiles: S.stairs.reduce((n, r) => n + r.steps.reduce((m, st) => m + st.tiles.length, 0), 0) }; }); // the hero's feet use S.levelH[S.fine[tile]]: on a step tile that IS the tread height of the carve (cand.h): the error is the max |level - tread|
  ok('the window opens with the steps (stairStyle 0, tread 1) and the fill preference on', T.style === 0 && T.tread === 1 && T.fill === true, T);
  ok(`the ${T.n} transitions of the window are steps: no sloped surface (no ramp record) and the hero's feet (the level of the tile) equal the tread height on all ${T.stepTiles} step tiles (max error ${T.feetErr.toExponential(1)}); 2 or 3 treads each (${T.treads.join('/')}: 3 when the gap holds one extra sub-level), none dropped (${T.dropped}), narrowed ${T.narrowed}`, T.n === 4 && !T.anyRamp && T.treads.every((k) => k === 2 || k === 3) && T.dropped === 0 && T.stepTiles > 0 && T.feetErr < 1e-6, T);
  ok('at yaw 180 all 4 rise AWAY from the camera (at yaw 0 they were all TOWARD)', T.cls.every((c) => c === 'away'), T.cls);
  await ev(() => { const e = window.__evo; e.st.stage.yaw = 0; e.draw(); }); await idle();
  const cls0 = await ev(() => { const S = window.__evo.S(); return S.stairs.map((r) => (r.dir[1] > 0 ? 'toward' : r.dir[1] < 0 ? 'away' : 'lateral')); }); ok('(control) the same stairs at yaw 0 are all toward the camera', cls0.every((c) => c === 'toward'), cls0);
  await ev(() => { const e = window.__evo; e.st.stage.yaw = 180; e.draw(); }); await idle();
  // the share of the treads that Cam 6 sees at yaw 180 (away: the risers face the camera, nothing shadows a tread) and, for the record, at yaw 0 by the slope rule
  console.log(`    window at yaw 180: ${T.n} stairs, treads ${T.treads.join('/')}, all away: tread visibility at Cam 6 = 100 % (away); at yaw 0: 0-19 % (toward); narrowed ${T.narrowed}, dropped ${T.dropped}, levels ${T.levels}`);
  // ---- (3) the hero at yaw 180 vs yaw 0 (the same window, the camera axis turned)
  const hero = async (yaw) => { await ev((y) => { const e = window.__evo; e.st.stage.yaw = y; e.st.hero = null; e.st.follow = true; e.draw(); }, yaw); await idle();
    await ev(() => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, 17); e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }); await idle();
    const R = { move: {}, clamp: {} };
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) { R.move[k] = await ev((k) => { const e = window.__evo, h0 = { x: e.st.hero.x, y: e.st.hero.y }; window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); return { dx: +(e.st.hero.x - h0.x).toFixed(3), dy: +(e.st.hero.y - h0.y).toFixed(3) }; }, k);
      await ev(() => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, 17); e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }); await idle(); }
    const ext = await ev(() => { const S = window.__evo.S(), W = S.W, o = { n: null, s: null, w: null, e: null }; for (let i = 0; i < S.n; i++) { if (S.block[i]) continue; const x = i % W, y = (i / W) | 0; if (!o.n || y < o.n.y) o.n = { x, y }; if (!o.s || y > o.s.y) o.s = { x, y }; if (!o.w || x < o.w.x) o.w = { x, y }; if (!o.e || x > o.e.x) o.e = { x, y }; } return o; });
    for (const [nm, t] of Object.entries(ext)) { await ev((t) => { const e = window.__evo, S = e.S(); e.st.hero = { x: S.ox + t.x + 0.5, y: S.oy + t.y + 0.5 }; e.st.follow = true; e.redraw(); }, t); await idle(); R.clamp[nm] = await ev(() => { const c = window.__evo.st.stageClamp; return c ? { side: c.side, near: c.near } : null; }); }
    return R; };
  const H0 = await hero(0), H180 = await hero(180);
  ok('yaw 180: the arrow keys are mirrored (up = +y, down = -y, left = +x, right = -x; 0.5 tile = 0.25 H); yaw 0 as before', H0.move.ArrowUp.dy === -0.5 && H0.move.ArrowRight.dx === 0.5 && H180.move.ArrowUp.dy === 0.5 && H180.move.ArrowDown.dy === -0.5 && H180.move.ArrowLeft.dx === 0.5 && H180.move.ArrowRight.dx === -0.5, { H0: H0.move, H180: H180.move });
  ok('yaw 180: the clamp is the symmetric one (the NEAR side is the north edge, the sides swap L / R; at yaw 0 the near side is the south edge)', H0.clamp.s && H0.clamp.s.near === true && H0.clamp.n === null && H180.clamp.n && H180.clamp.n.near === true && H180.clamp.s && H180.clamp.s.near === false && H180.clamp.e && H0.clamp.e && H180.clamp.e.side !== H0.clamp.e.side, { c0: H0.clamp, c180: H180.clamp });
  await hero(180); await ev(() => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, 17); e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.st.follow = true; e.redraw(); }); await idle(); // back at the centre of room 17 (the clamp loop leaves the hero at the east edge)
  const inv = await ev(() => { const e = window.__evo, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.focus = [e.st.focus[0] - S.ox, e.st.focus[1] - S.oy, e.st.focus[2]]; const cam = window.EVO.makeCam(S, P, v, w, h); let front = 0, behind = 0, mf = 0;
    for (let gx = 0; gx < 9; gx++) for (let gy = 0; gy < 9; gy++) { const x = 10 + gx * 11, y = 5 + gy * 6, fh = 4.0, dep = cam.D - cam.depth(x, y, fh), p = cam.p(x, y, fh), u = cam.unp(p[0], p[1], fh); if (dep > 0.05 * cam.D + 1e-9) { front++; mf = Math.max(mf, Math.hypot(u[0] - x, u[1] - y)); } else behind++; } return { front, behind, mf }; });
  ok(`yaw 180: the screen -> ground inverse is exact in front of the camera (${inv.front} points, max error ${inv.mf.toExponential(1)} tiles); the ${inv.behind} points BEHIND the camera are clamped (known limit, limitation 15.3)`, inv.mf < 1e-9 && inv.front >= 60, inv);
  const tiles = await ev(() => { const S = window.__evo.S(), W = S.W, o = []; for (let i = 0; i < S.n; i += 97) if (!S.block[i]) o.push({ x: i % W, y: (i / W) | 0 }); return o.slice(0, 40); });
  let exact = 0, clicked = 0;
  for (const t of tiles) { const info = await ev((t) => { const e = window.__evo, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.focus = [e.st.focus[0] - S.ox, e.st.focus[1] - S.oy, e.st.focus[2]]; const cam = window.EVO.makeCam(S, P, v, w, h), i = t.y * S.W + t.x, fh = S.levelH[S.fine[i]], p = cam.p(t.x + 0.5, t.y + 0.5, fh), r = cv.getBoundingClientRect(); return { px: p[0], py: p[1], rx: r.left, ry: r.top, w, h }; }, t);
    if (info.px < 2 || info.py < 2 || info.px > info.w - 2 || info.py > info.h - 2) continue; clicked++; await page.mouse.click(info.rx + info.px, info.ry + info.py); await idle();
    const got = await ev(() => { const e = window.__evo; return { x: Math.floor(e.st.hero.x - e.S().ox), y: Math.floor(e.st.hero.y - e.S().oy) }; }); if (got.x === t.x && got.y === t.y) exact++;
    await ev(() => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, 17); e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }); await idle(); }
  ok(`yaw 180: a click resolves to the tile it was projected from (${exact} of ${clicked} sampled tiles on screen; the step-0 sample was 6 of 6)`, clicked >= 4 && exact === clicked, { exact, clicked });
  // ---- (4) THE WINDOW vs THE WHOLE MAP with steps: they differ ONLY in stair footprints, 11 tiles (deterministic: 3 runs, same count)
  { await ev(() => { const e = window.__evo; e.st.stage.yaw = 180; }); await page.click('#examples button[data-id="dac_stage"]'); await idle();
    const w = await ev(() => { const S = window.__evo.S(); return { W: S.W, ox: S.ox, oy: S.oy, hh: Array.from(S.fine, (f) => S.levelH[f]), carved: Array.from(S.carved), slice: Array.from(S.slice), patch: S.passes.filter((x) => x.patch).length }; }); // the slice "patch" sites of the connection tree (a stair's own `site` may be an alternative pair of its pass: count the passes)
    await ev(() => { document.querySelector('#wholeRooms').click(); }); await idle();
    const m = await ev(() => { const S = window.__evo.S(); return { W: S.W, hh: Array.from(S.fine, (f) => S.levelH[f]), carved: Array.from(S.carved) }; });
    let dh = 0, onlyWin = 0, onlyWhole = 0, outside = 0; for (let i = 0; i < w.hh.length; i++) { if (!w.slice[i]) continue; const x = i % w.W, y = (i / w.W) | 0, j = (y + w.oy) * m.W + x + w.ox; if (Math.abs(w.hh[i] - m.hh[j]) > 1e-9) { dh++; if (w.carved[i] && !m.carved[j]) onlyWin++; else if (!w.carved[i] && m.carved[j]) onlyWhole++; else outside++; } }
    ok(`window vs whole map with the steps: ${dh} tiles differ, ALL of them stair footprints (${onlyWin} carved only in the window = a slice "patch" stair of the connection tree, ${onlyWhole} only in the whole map = the edge of a global stair whose connection leaves the slice; ${outside} elsewhere)`, dh === 11 && onlyWin === 9 && onlyWhole === 2 && outside === 0 && w.patch === 1, { dh, onlyWin, onlyWhole, outside, patch: w.patch });
    await page.click('#examples button[data-id="dac_stage"]'); await idle(); }
  // ---- (5) THE YAW 180 COUNTERPARTS of the camera / hero checks of test_stage_ui.js (which runs at yaw 0): hero size, CLAMP L / R / near / far, the arrows, the blocked step. The expectations are DERIVED from the yaw (a = screen right = cos x - sin y, u = toward the camera = sin x + cos y).
  const SNAP2 = () => { const E = window.EVO, e = window.__evo, S = e.S(), st = e.st, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(), tp = st.stage.tilesPerH, hf = st.stage.heroFrac;
    const hx = st.hero.x - S.ox, hy = st.hero.y - S.oy, i = E.stage.cellOf(S, hx, hy), feet = E.stage.feetH(S, i), hs = e.O.hero && e.O.hero.stats, sg = E.stage, D = sg.dist(hf, tp), p = v.pitch * Math.PI / 180, nearD = D * Math.cos(p) - D * Math.sin(p) / Math.tan(p + sg.FOV / 2), yr = v.yaw * Math.PI / 180, uOf = (x, y) => Math.sin(yr) * x + Math.cos(yr) * y;
    const box = S.sliceBox, corners = [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]], uMax = Math.max(...corners.map((c) => uOf(c[0], c[1])));
    return { yaw: v.yaw, w, h, tp, hf, centre: hs && hs.centre, hpx: hs && hs.hpx, k: sg.depthScale(E.makeCam(S, e.P, Object.assign(v, { focus: [st.focus[0] - S.ox, st.focus[1] - S.oy, st.focus[2]] }), w, h), hx, hy, feet), clamp: st.stageClamp && { side: st.stageClamp.side, near: st.stageClamp.near }, hero: [st.hero.x, st.hero.y], walk: i >= 0 && sg.walkable(S, i), wantNear: uOf(hx, hy) > uMax - nearD + 1e-9, nearD, box, ox: S.ox, oy: S.oy }; };
  const sizes180 = async (pg, b, tag) => { for (const tp of [2, 3]) for (const hf of [0.10, 0.14, 0.17]) {
    await b.slider('tilesPerH', tp); await b.idle(); await b.slider('heroFrac', hf); await b.idle();
    await pg.evaluate(() => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, 17); e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.st.follow = true; e.redraw(); }); await b.idle();
    const q = await pg.evaluate(SNAP2), cx = Math.abs(q.centre[0] - q.w / 2) <= 1, cy = Math.abs(q.centre[1] - q.h / 2) <= 1;
    // derived: the hero is centred unless its position is closer to the NEAR edge (the north one at yaw 180) than the camera allows; then it sits below the centre and the near flag is up
    ok(`${tag} yaw ${q.yaw}, tilesPerH ${tp} heroFrac ${hf}: hero ${q.hpx.toFixed(1)} px = heroFrac x panel x depth scale (${(hf * q.h * q.k).toFixed(1)}); ${q.wantNear ? 'past the near limit: clamp near, hero below the centre' : 'centred +-1 px, no clamp'}`,
      Math.abs(q.hpx - hf * q.h * q.k) <= 1 && (q.wantNear ? q.clamp && q.clamp.near && q.centre[1] > q.h / 2 + 5 && cx : !q.clamp && cx && cy), q); } };
  await sizes180(page, a, 'dpr 1,');
  await a.slider('tilesPerH', 2); await idle(); await a.slider('heroFrac', 0.14); await idle();
  { const b = await open({ w: 1500, h: 900, modes: true, dpr: 2 }), pg = b.page; await pg.evaluate(() => window.__evo.setMode('stage')); await b.idle(); await sizes180(pg, b, 'dpr 2,'); ok('dpr 2: no page errors', b.errs.length === 0, b.errs); await b.browser.close(); }
  // CLAMP at the four edges of the rooms box: the expected sides come from the yaw
  const edges = await ev(() => { const e = window.__evo, S = e.S(), box = S.sliceBox, yr = e.view().yaw * Math.PI / 180, ay = (x, y) => Math.cos(yr) * x - Math.sin(yr) * y, uy = (x, y) => Math.sin(yr) * x + Math.cos(yr) * y, midX = (box.x0 + box.x1) / 2, midY = (box.y0 + box.y1) / 2;
    const pts = { west: [box.x0 + 0.5, midY], east: [box.x1 - 0.5, midY], north: [midX, box.y0 + 0.5], south: [midX, box.y1 - 0.5] }, cen = [ay(midX, midY), uy(midX, midY)], out = {}; let nearName = null, farName = null, uMaxV = -1e9, uMinV = 1e9;
    for (const [k, p] of Object.entries(pts)) { const u = uy(p[0], p[1]); if (u > uMaxV) { uMaxV = u; nearName = k; } if (u < uMinV) { uMinV = u; farName = k; } out[k] = { x: p[0], y: p[1], a: ay(p[0], p[1]) - cen[0] }; }
    return { out, nearName, farName }; });
  const place = async (x, y) => { await ev(({ x, y, ox, oy }) => { const e = window.__evo; e.st.hero = { x: e.S().ox + x, y: e.S().oy + y }; e.st.follow = true; e.redraw(); }, { x, y }); await idle(); return ev(SNAP2); };
  const names = ['west', 'east'], res = {}; for (const [k, p] of Object.entries(edges.out)) res[k] = await place(p.x, p.y);
  for (const k of names) { const q = res[k], wantSide = edges.out[k].a < 0 ? 'L' : 'R'; ok(`CLAMP ${k} edge at yaw 180: screen side ${wantSide} (derived: a = cos x - sin y), the hero is ${wantSide === 'L' ? 'left' : 'right'} of the centre`, q.clamp && q.clamp.side === wantSide && (wantSide === 'L' ? q.centre[0] < q.w / 2 - 5 : q.centre[0] > q.w / 2 + 5), { q, wantSide }); }
  { const q = res[edges.nearName]; ok(`CLAMP near edge at yaw 180 is the ${edges.nearName} edge (max of u = sin x + cos y): the near flag, the hero below the centre, depth scale > 1.03`, q.clamp && q.clamp.near && q.centre[1] > q.h / 2 + 5 && q.k > 1.03, q); }
  { const q = res[edges.farName]; ok(`FAR edge at yaw 180 is the ${edges.farName} edge: never clamped, the hero stays at the screen centre`, !q.clamp && Math.abs(q.centre[0] - q.w / 2) <= 1 && Math.abs(q.centre[1] - q.h / 2) <= 1, q); }
  // the arrows: 'right' = screen right = (cos, -sin) in the map; the key that moves +x is derived; a step into a non-walkable cell is blocked
  await goHero(17);
  const window_yaw = 180; // the yaw of the example (asserted at the top: view().yaw === 180)
  const keyFor = (dx, dy) => { const yr = (window_yaw) * Math.PI / 180, vec = { ArrowRight: [Math.cos(yr), -Math.sin(yr)], ArrowLeft: [-Math.cos(yr), Math.sin(yr)], ArrowDown: [Math.sin(yr), Math.cos(yr)], ArrowUp: [-Math.sin(yr), -Math.cos(yr)] }; return Object.keys(vec).find((k) => Math.round(vec[k][0]) === dx && Math.round(vec[k][1]) === dy); };
  const keyPlusX = keyFor(1, 0), keyRight = 'ArrowRight';
  { const q0 = await ev(SNAP2); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press(keyRight); await idle(); const q1 = await ev(SNAP2), d = [q1.hero[0] - q0.hero[0], q1.hero[1] - q0.hero[1]], yr = q0.yaw * Math.PI / 180, want = [0.5 * Math.cos(yr), -0.5 * Math.sin(yr)]; // screen right in the map = (cos yaw, -sin yaw), 0.25 H = 0.5 tile
    ok(`arrow right at yaw ${q0.yaw} moves the hero 0.25 H = 0.5 tile along the screen right (derived (${want.map((v) => v.toFixed(2))}), measured (${d.map((v) => v.toFixed(2))})) and the camera follows (hero at the screen centre)`, Math.abs(d[0] - want[0]) < 1e-9 && Math.abs(d[1] - want[1]) < 1e-9 && Math.abs(q1.centre[0] - q1.w / 2) <= 1, { q0: q0.hero, q1: q1.hero }); }
  { const blocked = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(); for (let i = 0; i < S.n - 1; i++) if (S.slice && S.slice[i] && E.stage.walkable(S, i) && !E.stage.walkable(S, i + 1) && (i % S.W) < S.W - 1) return { x: S.ox + (i % S.W) + 0.75, y: S.oy + ((i / S.W) | 0) + 0.5 }; return null; });
    await ev(({ x, y }) => { const e = window.__evo; e.st.hero = { x, y }; e.redraw(); }, blocked); await idle(); const q0 = await ev(SNAP2); await page.keyboard.press(keyPlusX); await idle(); const q1 = await ev(SNAP2);
    ok(`yaw 180: an arrow step (${keyPlusX}, the key that moves +x here) into a non-walkable cell is blocked: the hero does not move`, q0.walk && JSON.stringify(q0.hero) === JSON.stringify(q1.hero), [q0.hero, q1.hero]); }
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
