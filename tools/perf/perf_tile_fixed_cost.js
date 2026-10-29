/* PR F1 gate 1b: fixed cost per tile. EMPTY tile (far outside the map), content tile at the centre, sizes 256 / 512, at fit and 13 px/tile (Balanced K1, A, M2). Median of 5 (first discarded). */
process.env.EVO_ROOT = process.env.EVO_ROOT || '/home/user/EvoDun-Landmaker';
const { open } = require('../ui/common.js');
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle();
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  for (const ppt of [0, 13]) {
    if (ppt) await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = y * S.W + x, hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.redraw(); }, { x: c.x, y: c.y, ppt }); else await page.click('#reset'); await a.idle();
    const r = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, cv0 = document.querySelector('#stage canvas'), W = cv0.clientWidth, H = cv0.clientHeight, v0 = e.view(), O = e.O; const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
      const mk = (w, h) => { const c = document.createElement('canvas'); c.style.cssText = `width:${w}px;height:${h}px;position:absolute;left:-9999px`; document.body.appendChild(c); return c; };
      const run = (TS, dx, dy) => { const cv = mk(TS, TS), ms = []; let st; for (let k = 0; k < 6; k++) { const t = performance.now(); st = E.renderLayer(cv, TS, TS, S, P, 'A', Object.assign({}, v0, { panX: v0.panX + W / 2 - TS / 2 + dx, panY: v0.panY + H / 2 - TS / 2 + dy }), O); cv.getContext('2d').getImageData(0, 0, 1, 1); ms.push(performance.now() - t); } cv.remove(); return { median: Math.round(med(ms.slice(1))), walls: st.walls, polys: st.polys, verts: st.verts, culledWalls: st.culled.walls }; };
      const out = { ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), viewportMs: null };
      const cvF = mk(W, H), ms = []; for (let k = 0; k < 4; k++) { const t = performance.now(); E.renderLayer(cvF, W, H, S, P, 'A', v0, O); cvF.getContext('2d').getImageData(0, 0, 1, 1); ms.push(performance.now() - t); } out.viewportMs = Math.round(med(ms.slice(1)));
      for (const TS of [256, 512]) { out['empty' + TS] = run(TS, 40000, 40000); out['content' + TS] = run(TS, 0, 0); } return out; });
    console.log(JSON.stringify(r)); }
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
