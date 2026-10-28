/* PR E2 measurement: pan with the cached bitmap vs the normal pan at ~13 px per tile (headless software render; absolute ms are that machine's, not the user's).
   Args: <example id> <K> <tech> <mode> [PPT]. Prints ONE JSON line. */
process.env.EVO_ROOT = process.env.EVO_ROOT || '/home/user/EvoDun-Landmaker';
const { open } = require('../ui/common.js');
const [ID, K, TECH, MODE, PPT] = [process.argv[2], +process.argv[3], process.argv[4], process.argv[5], +(process.argv[6] || 13)];
const pct = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(1); };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${ID}"]`); await a.idle();
  if (K === 0) { await ev(() => { window.__evo.inc.objectives.splice(0, window.__evo.inc.objectives.length - 1); }); await page.selectOption('#roomRule', 'route'); await a.idle(); await page.selectOption('#roomRule', 'v164'); await a.idle(); }
  if (TECH !== 'A') await a.tech(TECH);
  await page.selectOption('#dioChain', MODE); await a.idle();
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = y * S.W + x, hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.panRest(); }, { x: c.x, y: c.y, ppt: PPT });
  await a.idle();
  // hooks: every E.render / E.renderLayer / E.blitPan call (duration, time stamp) and the rAF intervals
  await ev(() => { const E = window.EVO; window.__m = { render: [], layer: [], blit: [], raf: [], on: false }; const wrap = (n, k) => { const f = E[n]; E[n] = function () { const t = performance.now(), r = f.apply(this, arguments); if (window.__m.on) window.__m[k].push([t, performance.now() - t]); return r; }; }; wrap('render', 'render'); wrap('renderLayer', 'layer'); wrap('blitPan', 'blit');
    const tick = (t) => { if (window.__m.on) window.__m.raf.push(t); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  const b = await (await page.$('#stage canvas')).boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  const pan = async (pxPerSec, secs) => { // shift-drag along a line at a steady speed (one move per ~16 ms of wall time)
    await ev(() => { const m = window.__m; m.render = []; m.layer = []; m.blit = []; m.raf = []; m.on = true; });
    await page.keyboard.down('Shift'); await page.mouse.move(cx, cy); await page.mouse.down(); const t0 = Date.now(); let n = 0;
    while (Date.now() - t0 < secs * 1000) { const el = (Date.now() - t0) / 1000; await page.mouse.move(cx + el * pxPerSec * 0.8, cy + el * pxPerSec * 0.6); n++; await page.waitForTimeout(8); }
    await page.mouse.up(); await page.keyboard.up('Shift'); await ev(() => { window.__m.on = false; }); await page.waitForTimeout(600); await a.idle();
    const m = await ev(() => window.__m), iv = []; for (let i = 1; i < m.raf.length; i++) iv.push(m.raf[i] - m.raf[i - 1]);
    const frameMs = m.render.map((r) => r[1]).concat(m.blit.map((r) => r[1])); // the work of a frame: a full render, or a blit
    return { moves: n, secs, pxPerSec, rafFrames: m.raf.length, fpsRaf: +(m.raf.length / secs).toFixed(1), rafIntervalMs: { p50: pct(iv, 0.5), p95: pct(iv, 0.95), max: pct(iv, 1) }, fullRenders: m.render.length, fullRenderMs: { median: pct(m.render.map((r) => r[1]), 0.5), max: pct(m.render.map((r) => r[1]), 1) }, blits: m.blit.length, blitMs: { median: pct(m.blit.map((r) => r[1]), 0.5), max: pct(m.blit.map((r) => r[1]), 1) }, layerBuilds: m.layer.map((r) => +r[1].toFixed(0)) }; };
  const out = { scene: ID + '-K' + K, tech: TECH, mode: MODE, ppt: PPT };
  const info = await ev(() => { const e = window.__evo, cv = document.querySelector('#stage canvas'); return { viewport: [cv.clientWidth, cv.clientHeight], fit: e.st.fitSc }; }); out.viewport = info.viewport;
  // 1) panCache OFF: the normal pan (a full render per frame)
  out.off = await pan(150, 3);
  // 2) panCache ON: a pan that stays inside the margin (150 px/s x 3 s = 450 px < 0.5 x viewport) ...
  await page.check('#t-panCache'); await a.idle();
  out.first_drag = await pan(40, 0.5); // the first drag after the option is on (or after any invalidation): the layer is built on its first frame
  out.on_inside = await pan(150, 3); // WARM layer: it is still valid
  const li = await ev(() => window.__evo.panLayerInfo()); out.layer = li && { bytes: li.bytes, MB: +(li.bytes / 1048576).toFixed(1), mx: li.mx, my: li.my, buildMs: Math.round(li.ms) };
  // ... and a fast one that exhausts it (500 px/s x 3 s = 1500 px: layer rebuilds, the hitch)
  out.on_fast = await pan(500, 3);
  // 3) zoom step: one wheel notch at the viewport centre = one full render per step (the zoom is not cached)
  await ev(() => { const m = window.__m; m.render = []; m.layer = []; m.blit = []; m.on = true; });
  for (let i = 0; i < 3; i++) { const n = await ev(() => window.__evo.st.draws || 0); await page.mouse.move(cx, cy); await page.mouse.wheel(0, i % 2 ? 100 : -100); await page.waitForFunction((n0) => window.__evo.st.draws > n0, n, { timeout: 120000 }); await a.idle(); }
  const z = await ev(() => { window.__m.on = false; return window.__m.render.map((r) => Math.round(r[1])); }); out.zoomStepRenderMs = z;
  console.log(JSON.stringify(out)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
