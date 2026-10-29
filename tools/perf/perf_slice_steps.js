/* The longest slices of a sliced frame (JS ms, flush ms, progress): what does not yield. Args: example id, ppt (0 = default framing), technique. */
const { open } = require('../ui/common.js');
const EX = process.argv[2] || 'real_balanced', PPT = +(process.argv[3] || 0), TECH = process.argv[4] || 'A';
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${EX}"]`); await a.idle();
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  if (PPT) await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = y * S.W + x, hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.panRest(); }, { x: c.x, y: c.y, ppt: PPT }); await a.idle();
  const r = await ev((tech) => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'), off = document.createElement('canvas'), trace = []; const task = E.sliceStart(cv, e.S(), e.P, tech, e.view(), e.O, { off, trace }); while (!task.step(10)) { /* slices */ } task.finish();
    const top = trace.map((t, i) => [i, t[0] + t[1], t[0], t[1], t[2]]).sort((p, q) => q[1] - p[1]).slice(0, 12); return { slices: trace.length, over30: trace.filter((t) => t[0] + t[1] > 30).length, over50: trace.filter((t) => t[0] + t[1] > 50).length, top: top.map(([i, tot, js, fl, pr]) => `#${i} ${tot.toFixed(0)} ms (js ${js.toFixed(0)}, raster ${fl.toFixed(0)}) at ${pr}`) }; }, TECH);
  console.log(JSON.stringify(r, null, 1)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
