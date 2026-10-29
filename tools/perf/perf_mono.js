/* Monolithic frame cost (E.render, flush inside the timed window): median and range of 7 renders at the default framing and at 13 px/tile. Args: example id, technique list (default A,box). Used before / after the generator conversion of PR F1'. */
const { open } = require('../ui/common.js');
const EX = process.argv[2] || 'real_balanced', TECHS = (process.argv[3] || 'A,box').split(',');
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${EX}"]`); await a.idle();
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  const PPTS = (process.env.PPTS || '0,13').split(',').map(Number), REPS = +(process.env.REPS || 8);
  for (const ppt of PPTS) {
    if (ppt) await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = y * S.W + x, hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.panRest(); }, { x: c.x, y: c.y, ppt }); else await page.click('#reset'); await a.idle();
    for (const tech of TECHS) {
      const r = await ev(({ tech, REPS }) => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'), T = []; for (let k = 0; k < REPS; k++) { const t0 = performance.now(); E.render(cv, e.S(), e.P, tech, e.view(), e.O); cv.getContext('2d').getImageData(0, 0, 1, 1); if (k) T.push(performance.now() - t0); } T.sort((p, q) => p - q); return { ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), tech, median: Math.round(T[T.length >> 1]), min: Math.round(T[0]), max: Math.round(T[T.length - 1]), q1: Math.round(T[T.length >> 2]), n: T.length }; }, { tech, REPS });
      console.log(JSON.stringify(r)); }
  }
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
