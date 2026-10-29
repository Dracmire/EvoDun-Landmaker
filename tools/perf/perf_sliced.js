/* PR F1' measurements (Balanced K1, A, M2, Cam 1; headless software render, absolute ms are that machine's; the user's machine is about 2.4-4.6x slower):
   - the monolithic frame and the sliced frame to completion (flush inside the window) at the default framing, 7 and 13 px per tile: slicing overhead in %;
   - the longest slice (JS + its own raster) and the longest main-thread task (PerformanceObserver 'longtask', 50 ms threshold; a task shorter than that is not reported by the browser: the longest slice stands for it) during a wheel gesture, option off and on;
   - the number of renders started by 10 quick wheel notches;
   - the pick buffer: where it is built and what it costs (E.pickTile on a click, E.pickBuffer, the Box render it is).
     NODE_PATH=$(npm root -g) node tools/perf/perf_sliced.js [example id] */
const { open } = require('../ui/common.js');
const EX = process.argv[2] || 'real_balanced';
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${EX}"]`); await a.idle();
  const settle = () => page.waitForFunction(() => !window.__evo.slStats().pending, null, { timeout: 600000 }).then(() => a.idle());
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  const frame = async (ppt) => { if (ppt) await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = y * S.W + x, hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.redraw(); }, { x: c.x, y: c.y, ppt }); else { await page.click('#reset'); } };
  const out = { scene: EX, frames: [], gesture: [] };
  // monolithic vs sliced to completion
  for (const ppt of [0, 7, 13]) {
    await frame(ppt); await a.idle();
    const mono = await ev(() => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'), T = []; for (let k = 0; k < 4; k++) { const t0 = performance.now(); E.render(cv, e.S(), e.P, e.st.tech, e.view(), e.O); cv.getContext('2d').getImageData(0, 0, 1, 1); if (k) T.push(performance.now() - t0); } T.sort((p, q) => p - q); return { ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), median: Math.round(T[1]), min: Math.round(T[0]), max: Math.round(T[2]) }; });
    const sl = await ev(() => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'), off = document.createElement('canvas'), R = []; for (let k = 0; k < 3; k++) { const t0 = performance.now(); const task = E.sliceStart(cv, e.S(), e.P, e.st.tech, e.view(), e.O, { off }); while (!task.step(10)) { /* slices */ } task.finish(); cv.getContext('2d').getImageData(0, 0, 1, 1); R.push({ ms: performance.now() - t0, slices: task.slices, maxStep: task.maxStep, jsMs: task.jsMs, flushMs: task.flushMs }); } R.sort((p, q) => p.ms - q.ms); const m = R[1]; return { median: Math.round(m.ms), slices: m.slices, longestSliceMs: +Math.max(...R.map((r) => r.maxStep)).toFixed(1), jsMs: Math.round(m.jsMs), flushMs: Math.round(m.flushMs) }; });
    out.frames.push({ mono, sliced: sl, overheadPct: +(100 * (sl.median - mono.median) / mono.median).toFixed(1) }); console.log(JSON.stringify(out.frames[out.frames.length - 1]));
  }
  // a wheel gesture (10 notches 30 ms apart) at the default framing then at 13 px per tile, option off and on: longest long task, renders, time until the frame is complete
  for (const on of [false, true]) {
    for (const ppt of [0, 13]) {
      await page.evaluate((on) => { const cb = document.querySelector('#t-sliced'); if (cb.checked !== on) { cb.checked = on; cb.dispatchEvent(new Event('change', { bubbles: true })); } }, on); await frame(ppt); await settle(); await page.waitForTimeout(300);
      await ev(() => { window.__lt = []; window.__po = new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); }); window.__po.observe({ entryTypes: ['longtask'] }); });
      const b = await (await page.$('#stage canvas')).boundingBox(), s0 = await ev(() => window.__evo.slStats()), n0 = await ev(() => window.__evo.st.draws); const t0 = Date.now();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, i < 5 ? -100 : 100); await page.waitForTimeout(30); }
      await page.waitForTimeout(150); await settle(); const total = Date.now() - t0; const lt = await ev(() => { window.__po.disconnect(); return window.__lt.slice(); }), s1 = await ev(() => window.__evo.slStats());
      const row = { sliced: on, ppt: ppt || 'fit', longestLongTaskMs: lt.length ? Math.round(Math.max(...lt)) : '<50', longTasks: lt.length, rendersStarted: on ? s1.started - s0.started : 'n/a', drawCalls: (await ev(() => window.__evo.st.draws)) - n0, msFromFirstNotchToCompleteFrame: total, longestSliceMs: on && s1.last ? +s1.last.maxStep.toFixed(1) : null };
      out.gesture.push(row); console.log(JSON.stringify(row));
    }
  }
  // the pick buffer: E.pickTile on a click (a Box render of the whole viewport; art contract and the Diorama visibility line use E.pickBuffer the same way)
  for (const ppt of [0, 13]) { await frame(ppt); await settle(); const r = await ev(() => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, T = []; for (let k = 0; k < 3; k++) { const t0 = performance.now(); E.pickTile(e.S(), e.P, e.st.tech, e.view(), w, h, w / 2, h / 2); T.push(performance.now() - t0); } T.sort((p, q) => p - q); return { ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), pickTileMs: Math.round(T[1]) }; }); console.log(JSON.stringify(r)); out.pick = (out.pick || []).concat([r]); }
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
