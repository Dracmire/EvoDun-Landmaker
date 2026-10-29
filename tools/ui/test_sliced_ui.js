/* TIME-SLICED EXACT FRAME (PR F1', `E.sliceStart` / `O.sliced`; src/render.js generators, src/ui.js `slicedFrame`). IDENTITY BY CONSTRUCTION: a frame drawn in slices into the private canvas and swapped into the panel is BYTE-IDENTICAL (FNV-1a of every channel of every pixel) to the monolithic `E.render` frame of the same camera, canvas size and dpr.
   (A) the E1a matrix at render level: technique A and B, Off / M2 / Corridor, terH 1 / 3 / 6, Cam 1 and Cam 3, 20 / 30 / 60 px per tile, 4 positions in rotation per combination (`--full`: all 14), 640 x 480 canvases.
   (B) the user's real wheel steps on Balanced K1 (A, M2, Cam 1, default framing -> about 13 px per tile) through the REAL UI with the option on: after every step the panel (when the pending frame is complete) equals the monolithic frame; dpr 1 (every step), 1.25 and 2 (steps 1, 5, 10, 15; `--full`: all).
   (C) a frame abandoned at EVERY slice boundary, then a new frame to completion, gives the same bytes (no state leaks across a cancel); (D) in the UI: the placeholder, ten quick wheel notches = one render, the sliced option wins over the pan cache, the Floors view keeps its floor index (`st.layer`, the bug of E2's first version).
   (E) MUTATIONS, each makes a NAMED check fail: a lost slice, two levels in another order, a partial frame swapped in, the context of a cancelled frame kept (no reset), a pending frame not cancelled by a change of the state, a render input missing from the placeholder key.
     NODE_PATH=$(npm root -g) node tools/ui/test_sliced_ui.js [--full] */
const { open } = require('./common');
const FULL = process.argv.includes('--full'), ONLY = process.env.SL_ONLY ? process.env.SL_ONLY.split(',') : null, ZOOMS = [20, 30, 60], THS = [1, 3, 6], MODES = ['off', 'm2', 'corr'], TECHS = ['A', 'B'], CAMS = ['isoE', 'oblique'];
const HASH_SRC = `(c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let a = 2166136261; for (let i = 0; i < d.length; i++) { a ^= d[i]; a = Math.imul(a, 16777619) >>> 0; } return a; }`;
const POSITIONS = () => { const e = window.__evo, E = window.EVO, S = e.S(), P = e.P, W = S.W, H = S.H, out = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3], [W >> 1, 2], [W - 3, H >> 1], [W >> 1, H - 3], [2, H >> 1], [W >> 1, H >> 1]];
  const cr = P.chainSeqs ? E.roomTypes.chainRoute(S, P) : null; if (cr && cr.path) for (const f of [0.2, 0.4, 0.6, 0.8]) { const t = cr.path[Math.floor(cr.path.length * f)]; out.push([t % W, (t / W) | 0]); }
  const it = P.dioPlan && P.dioPlan.items.find((q) => q.eligible); if (it) { let sx = 0, sy = 0; for (const t of it.dst) { sx += t % W; sy += (t / W) | 0; } out.push([Math.round(sx / it.dst.length), Math.round(sy / it.dst.length)]); }
  while (out.length < 14) out.push([(out.length * 37) % W, (out.length * 53) % H]); return out; };
// the matrix: the same view as test_cull_ui.js (a point of the map centred at ppt px per tile), monolithic vs sliced, 640 x 480
const RUN = ({ tech, ppt, pos, hs }) => {
  const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, O = e.O, W = 640, H = 480, hash = eval(hs), res = [];
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:-9999px`; document.body.appendChild(c); return c; }, c0 = mk(), c1 = mk(), off = mk();
  for (const [x, y] of pos) {
    const v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = Math.max(0, Math.min(S.n - 1, y * S.W + x)), hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, P, v, W, H).p(x + 0.5, y + 0.5, hh); v.panX = W / 2 - p0[0]; v.panY = H / 2 - p0[1];
    E.render(c0, S, P, tech, v, O); const task = E.sliceStart(c1, S, P, tech, v, O, { off }); let n = 0; while (!task.step(5)) n++; task.finish();
    res.push({ x, y, same: hash(c0) === hash(c1), slices: task.slices, maxStep: task.maxStep }); }
  c0.remove(); c1.remove(); off.remove(); return res; };
const GOTO_POINT = ({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = Math.max(0, Math.min(S.n - 1, y * S.W + x)), hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; };
// the panel against a monolithic frame of the same state into an offscreen canvas of the same size: { same }
// the hash of the panel and of the BACKGROUND + LIVE OVERLAYS alone (what an invalid placeholder shows): they differ when the old terrain is on the panel
const PANEL_VS_BG = (hs) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, hash = eval(hs), off = document.createElement('canvas'); off.style.cssText = `width:${w}px;height:${h}px;position:absolute;left:-9999px`; document.body.appendChild(off); E.slPlaceholder(off, null, null, S, e.P, e.st.tech, e.view(), e.O); const r = { sameAsBg: hash(cv) === hash(off) }; off.remove(); return r; };
const PANEL_VS_MONO = (hs) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, hash = eval(hs), off = document.createElement('canvas'); off.style.cssText = `width:${w}px;height:${h}px;position:absolute;left:-9999px`; document.body.appendChild(off); E.render(off, S, e.P, e.st.tech, e.view(), e.O); const r = { same: hash(cv) === hash(off), px: [cv.width, cv.height], sl: window.__evo.slStats() }; off.remove(); return r; };
(async () => {
  let fails = 0, pairs = 0; const ok = (name, c, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!c) fails++; };
  const settle = (page, a) => page.waitForFunction(() => !window.__evo.slStats().pending, null, { timeout: 300000 }).then(() => a.idle());
  // ---- (A) the matrix at render level
  let combo = 0;
  for (const tech of TECHS) { if ((ONLY && ONLY[0] !== tech) || process.env.SL_UI_ONLY) continue; // (SL_UI_ONLY: skip the matrix, run the rest)
    const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle(); if (tech !== 'A') await a.tech(tech);
    for (const th of THS) { await a.slider('terH', th); await a.idle();
      for (const mode of MODES) { await page.selectOption('#dioChain', mode); await a.idle(); const all = await ev(POSITIONS);
        for (const cam of CAMS) { await a.preset(cam); await a.idle();
          for (const ppt of ZOOMS) { const pos = FULL ? all : [0, 1, 2, 3].map((j) => all[(combo * 4 + j) % all.length]); combo++;
            const r = await ev(RUN, { tech, ppt, pos, hs: HASH_SRC }), bad = r.filter((q) => !q.same); pairs += r.length;
            ok(`IDENTITY ${tech} terH ${th} ${mode} ${cam} ${ppt} px/tile: ${r.length} sliced frames are byte-identical to the monolithic frame (slices ${r.reduce((s, q) => s + q.slices, 0)}, longest slice ${Math.max(...r.map((q) => q.maxStep)).toFixed(0)} ms)`, bad.length === 0, bad.map((q) => `(${q.x},${q.y})`).join(' ')); } } } }
    await a.browser.close(); }
  console.log(`${pairs} sliced frames compared (${FULL ? 'full' : 'rotating positions'})`);
  if (ONLY) { process.exit(fails ? 1 : 0); }
  // ---- (C) every cancel point + (E) the render-level mutations, on a small scene (Chain 5, 60 px per tile at the middle of the route)
  { const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_chain5"]'); await a.idle();
    const SCENE = ({ hs, budget, mut }) => { const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, O = e.O, W = 640, H = 480, hash = eval(hs), cr = E.roomTypes.chainRoute(S, P), t0 = cr.path[cr.path.length >> 1], x = t0 % S.W, y = (t0 / S.W) | 0;
      const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:-9999px`; document.body.appendChild(c); return c; }, c0 = mk(), c1 = mk(), off = mk();
      const v = e.view(); v.zoom = 60 / e.st.fitSc; v.panX = 0; v.panY = 0; const hh = S.levelH[S.fine[t0]], p0 = E.makeCam(S, P, v, W, H).p(x + 0.5, y + 0.5, hh); v.panX = W / 2 - p0[0]; v.panY = H / 2 - p0[1];
      E.render(c0, S, P, 'A', v, O); const ref = hash(c0), out = { ref };
      const full = (o2, T) => { E.sliceTest = T || null; const task = E.sliceStart(c1, S, P, 'A', v, o2 || O, { off }); while (!task.step(budget)) { /* slices */ } task.finish(); E.sliceTest = null; return { same: hash(c1) === ref, slices: task.slices, maxStep: task.maxStep }; };
      const base = full(); out.base = base;
      if (mut === 'cancels') { // abandon a frame after k slices, then a complete frame: the same bytes
        const bad = []; for (let k = 1; k < base.slices; k++) { const t1 = E.sliceStart(c1, S, P, 'A', v, O, { off }); for (let i = 0; i < k; i++) t1.step(budget); t1.cancel(); const r = full(); if (!r.same) bad.push(k); } out.bad = bad; out.n = base.slices - 1; }
      if (mut === 'noReset') { const bad = []; for (let k = 1; k < base.slices; k++) { const t1 = E.sliceStart(c1, S, P, 'A', v, O, { off }); for (let i = 0; i < k; i++) t1.step(budget); t1.cancel(); const r = full(O, { noReset: true }); if (!r.same) bad.push(k); } out.bad = bad; out.n = base.slices - 1; }
      if (mut === 'skip') out.r = full(O, { skipAt: Math.max(1, base.slices >> 1) });
      if (mut === 'order') { const ord = []; for (let L = 0; L <= S.maxFine; L++) ord.push(L); const i = 3, j = 4; [ord[i], ord[j]] = [ord[j], ord[i]]; out.r = full(Object.assign({}, O, { testOrder: ord })); }
      if (mut === 'partial') { const t1 = E.sliceStart(c1, S, P, 'A', v, O, { off }); for (let i = 0; i < Math.max(1, base.slices >> 1); i++) t1.step(budget); E.sliceTest = { partialSwap: true }; t1.finish(); E.sliceTest = null; out.r = { same: hash(c1) === ref }; }
      c0.remove(); c1.remove(); off.remove(); return out; };
    const base = await ev(SCENE, { hs: HASH_SRC, budget: 3, mut: 'cancels' });
    ok(`IDENTITY (render level, Chain 5, 60 px per tile, ${base.base.slices} slices of 3 ms, longest ${base.base.maxStep.toFixed(0)} ms): the sliced frame equals the monolithic one`, base.base.same);
    ok(`CANCEL: a frame abandoned after k slices, for every k of 1..${base.n}, then a complete frame: the same bytes (bad k: ${base.bad.join(' ') || 'none'})`, base.bad.length === 0 && base.n >= 5);
    const mk = async (mut) => ev(SCENE, { hs: HASH_SRC, budget: 3, mut });
    const m1 = await mk('skip'), m2 = await mk('order'), m3 = await mk('partial'), m4 = await mk('noReset');
    ok('MUTATION a lost slice (the pixels of the earlier slices are dropped): the IDENTITY check FAILS', !m1.r.same);
    ok('MUTATION two levels drawn in another order: the IDENTITY check FAILS', !m2.r.same);
    ok('MUTATION a partial frame swapped in: the IDENTITY check FAILS', !m3.r.same);
    ok(`MUTATION the context of a cancelled frame kept (no reset): the CANCEL check FAILS (${m4.bad.length} of ${m4.n} cancel points differ)`, m4.bad.length > 0);
    await a.browser.close(); }
  // ---- (D) + (E) in the UI
  const open2 = async (dpr, example) => { const a = await open({ w: 1500, h: 900, modes: true, dpr }), page = a.page, ev = (f, x) => page.evaluate(f, x); await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${example}"]`); await a.idle(); await page.check('#t-sliced'); await settle(page, a); return { a, page, ev }; };
  { const { a, page, ev } = await open2(1, 'real_chain5'); const b = await (await page.$('#stage canvas')).boundingBox(), wheel = async (n, gap) => { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, -100); if (gap) await page.waitForTimeout(gap); } };
    let r = await ev(PANEL_VS_MONO, HASH_SRC); ok('the first frame of the sliced option (no placeholder yet) is byte-identical to the monolithic frame', r.same);
    const s0 = await ev(() => window.__evo.slStats()); await wheel(1, 0); await page.waitForTimeout(40);
    const during = await ev(() => ({ pending: window.__evo.slStats().pending, label: !!document.querySelector('#stage .pending'), started: window.__evo.slStats().started })), bgOnly = await ev(PANEL_VS_BG, HASH_SRC);
    ok(`PLACEHOLDER: 40 ms after a wheel notch the panel shows the last terrain moved (not the background alone: ${!bgOnly.sameAsBg}), the calculating label is up and no new frame has started (${during.started - s0.started} started)`, during.pending && during.label && !bgOnly.sameAsBg && during.started === s0.started);
    await settle(page, a); r = await ev(PANEL_VS_MONO, HASH_SRC); ok('after the notch the completed frame equals the monolithic frame', r.same);
    const s1 = await ev(() => window.__evo.slStats()); await wheel(10, 0); await settle(page, a); const s2 = await ev(() => window.__evo.slStats()); r = await ev(PANEL_VS_MONO, HASH_SRC);
    ok(`COALESCING: ten quick wheel notches start ${s2.started - s1.started} render(s) (about 0.12 s after the last notch) and the frame is exact`, s2.started - s1.started === 1 && r.same);
    const s3 = await ev(() => window.__evo.slStats()); await wheel(10, 30); await settle(page, a); const s4 = await ev(() => window.__evo.slStats()); ok(`COALESCING: ten notches 30 ms apart start ${s4.started - s3.started} render(s)`, s4.started - s3.started === 1);
    // MUTATIONS in the UI: an option changed while a frame is pending
    await page.click('#reset'); await settle(page, a); await wheel(1, 0); await page.waitForTimeout(250); // the default framing (a frame of about a second) is running now
    await ev(() => { window.EVO.sliceTest = { keepStale: true }; }); await page.uncheck('#t-outlines'); await page.waitForTimeout(100); await ev(() => { window.EVO.sliceTest = null; });
    await settle(page, a); r = await ev(PANEL_VS_MONO, HASH_SRC); ok('MUTATION a pending frame not cancelled by a change of the state: the frame after the change FAILS the IDENTITY check', !r.same);
    await page.check('#t-outlines'); await settle(page, a); r = await ev(PANEL_VS_MONO, HASH_SRC);
    ok('after the mutation the real code is exact again (the outline switch back on)', r.same);
    // a render input missing from the placeholder key: after a change of an option the old terrain must NOT be shown
    const toggled = async (ign) => { await ev((i) => { window.EVO.sliceTest = i ? { keyIgnoreO: true } : null; }, ign); await page.click('#reset'); await settle(page, a); await page.uncheck('#t-gradient'); await page.waitForTimeout(60); const r2 = await ev(PANEL_VS_BG, HASH_SRC); await ev(() => { window.EVO.sliceTest = null; }); await settle(page, a); await page.check('#t-gradient'); await settle(page, a); return r2.sameAsBg; };
    const bgOk = await toggled(false), bgBad = await toggled(true);
    ok(`PLACEHOLDER KEY: after a change of a display option the old terrain is NOT shown while the new frame is pending (the panel is the background and the live overlays: ${bgOk})`, bgOk);
    ok(`MUTATION a render input (the display options) missing from the placeholder key: the old terrain IS shown (the panel is not the background alone: ${!bgBad}): the PLACEHOLDER KEY check FAILS`, !bgBad);
    ok('no page error', a.errs.length === 0, a.errs.join(' | '));
    await a.browser.close(); }
  // ---- the PICK render in slices: the same answer as the monolithic E.pickTile (a click does not block the page) and the stake placed through the real click
  { const { a, page, ev } = await open2(1, 'real_chain5');
    const r = await ev(() => new Promise((resolve) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, pts = [[0.5, 0.5], [0.35, 0.4], [0.6, 0.55], [0.45, 0.3], [0.7, 0.7], [0.2, 0.8], [0.55, 0.45], [0.4, 0.6]].map(([fx, fy]) => [fx * w, fy * h]), out = { n: 0, bad: [], maxSlice: 0 };
      let i = 0; const next = () => { if (i >= pts.length) return resolve(out); const [px, py] = pts[i++], ref = E.pickTile(S, e.P, 'A', e.view(), w, h, px, py); E.pickTileSliced(S, e.P, 'A', e.view(), w, h, px, py, (hit) => { out.n++; if (hit.tile !== ref.tile || hit.kind !== ref.kind) out.bad.push([px | 0, py | 0, ref.tile, hit.tile]); next(); }); }; next(); }));
    ok(`PICK in slices: ${r.n} points of the viewport give the same tile and kind as the monolithic E.pickTile (differences: ${r.bad.length ? JSON.stringify(r.bad) : 'none'})`, r.n === 8 && r.bad.length === 0);
    const b = await (await page.$('#stage canvas')).boundingBox(), px = b.x + b.width * 0.5, py = b.y + b.height * 0.5;
    const ref = await ev(({ fx, fy }) => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'); return E.pickTile(e.S(), e.P, e.st.tech, e.view(), cv.clientWidth, cv.clientHeight, fx * cv.clientWidth, fy * cv.clientHeight); }, { fx: 0.5, fy: 0.5 });
    await ev(() => { window.__evo.inc.stake = null; window.__evo.setIncMode('stake'); }); const t0 = Date.now(); await page.mouse.click(px, py); await page.waitForFunction(() => window.__evo.inc.stake, null, { timeout: 60000 }); await page.waitForFunction(() => window.__evo.S(), null, { timeout: 120000 }); await settle(page, a); const st = await ev(() => { const s = window.__evo.S(), k = window.__evo.inc.stake; return { tile: k.y * s.W + k.x, k }; });
    ok(`CLICK with the sliced option: the stake is placed on the tile the monolithic pick gives (${st.tile} vs ${ref.tile}), the page not blocked`, st.tile === ref.tile, `(${Date.now() - t0} ms)`);
    ok('no page error', a.errs.length === 0, a.errs.join(' | ')); await a.browser.close(); }
  // ---- (D) the Floors view keeps its floor index (the first version of E2 stored its layer in st.layer: 'No floor null')
  { const a = await open({ w: 1500, h: 900 }), page = a.page, ev = (f, x) => page.evaluate(f, x); // (the whole panel: the source selector of the Floors package)
    await page.selectOption('#src', 'snake_floors'); await a.idle(); await page.click('#mode'); await a.idle(); await page.check('#t-sliced'); await settle(page, a);
    for (const k of [1, 2]) { await page.click(`#floorChips button[data-floor="${k}"]`); await settle(page, a); const r = await ev(() => ({ layer: window.__evo.st.layer, sl: window.__evo.slStats() })); const m = await ev(PANEL_VS_MONO, HASH_SRC);
      ok(`FLOORS with the sliced option: floor ${k} selected, st.layer = ${r.layer}, the frame is exact`, r.layer === k && m.same); }
    ok('FLOORS: no page error', a.errs.length === 0, a.errs.join(' | ')); await a.browser.close(); }
  // ---- (B) the user's wheel steps on Balanced K1 at three device pixel ratios
  for (const dpr of [1, 1.25, 2]) { const { a, page, ev } = await open2(dpr, 'real_balanced'); const b = await (await page.$('#stage canvas')).boundingBox(); const STEPS = FULL || dpr === 1 ? 16 : 4; let bad = [], k = 0, last = null;
    let r = await ev(PANEL_VS_MONO, HASH_SRC); if (!r.same) bad.push('fit'); k++;
    const pick = FULL || dpr === 1 ? null : new Set([1, 5, 10, 15]);
    for (let i = 1; i <= 15; i++) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.wheel(0, -100); if (pick && !pick.has(i)) { /* the intermediate notches only move the camera */ continue; } await settle(page, a); r = await ev(PANEL_VS_MONO, HASH_SRC); k++; last = r; if (!r.same) bad.push('step ' + i); }
    const ppt = await ev(() => +(window.__evo.st.zoom * window.__evo.st.fitSc).toFixed(2));
    ok(`WHEEL STEPS Balanced K1 A M2 Cam 1, dpr ${dpr} (canvas ${last ? last.px.join('x') : ''}): ${k} completed frames from the default framing to ${ppt} px per tile are byte-identical to the monolithic frame`, bad.length === 0, bad.join(' '));
    await a.browser.close(); }
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
