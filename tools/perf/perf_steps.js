/* PR F step 0.1: the user's case (real_balanced K1, terH 1, A, M2, Cam 1) at the default framing and every wheel step down to ~13 px/tile.
   Per step: info-line fields (polys / walls / verts / ms), my own wall-clock of E.render, the same split into JS (the render call) and the raster flush (a 1x1 getImageData right after), culling counts, native 2D call counts. */
process.env.EVO_ROOT = process.env.EVO_ROOT || '/home/user/EvoDun-Landmaker';
const { open } = require('../ui/common.js');
const TECH = process.argv[2] || 'A', MODE = process.argv[3] || 'm2', EX = process.argv[4] || 'real_balanced', TH = +(process.argv[5] || 1);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${EX}"]`); await a.idle();
  if (TH !== 1) { await a.slider('terH', TH); await a.idle(); }
  if (TECH !== 'A') await a.tech(TECH); if (MODE !== 'm2') { await page.selectOption('#dioChain', MODE); await a.idle(); }
  await ev(() => { const E = window.EVO, C = CanvasRenderingContext2D.prototype; window.__n = {}; window.__on = false; for (const k of ['fill', 'stroke', 'fillRect', 'drawImage', 'createLinearGradient', 'beginPath', 'clip', 'fillText', 'setLineDash']) { const f = C[k]; C[k] = function () { if (window.__on) window.__n[k] = (window.__n[k] || 0) + 1; return f.apply(this, arguments); }; }
    const R = E.render; window.__r = []; E.render = function (cv) { window.__on = true; window.__n = {}; const t = performance.now(), r = R.apply(this, arguments), t1 = performance.now(); cv.getContext('2d').getImageData(0, 0, 1, 1); const t2 = performance.now(); window.__on = false; window.__r.push({ js: t1 - t, flush: t2 - t1, walls: r.walls, polys: r.polys, verts: r.verts, ms: r.ms, culled: r.culled, n: Object.assign({}, window.__n) }); return r; }; });
  const b = await (await page.$('#stage canvas')).boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  const snap = async (label) => { const r = await ev(() => { const e = window.__evo, o = window.__r[window.__r.length - 1] || {}; return Object.assign({ cap: document.querySelector('#stage figcaption').textContent, ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), canvas: [document.querySelector('#stage canvas').width, document.querySelector('#stage canvas').height], nRenders: window.__r.length }, o); }); console.log(label, JSON.stringify(r)); return r; };
  await snap('first');
  for (let i = 0; i < 16; i++) { const n = await ev(() => window.__evo.st.draws || 0); await page.mouse.move(cx, cy); await page.mouse.wheel(0, -100); await page.waitForFunction((n0) => window.__evo.st.draws > n0, n, { timeout: 300000 }); await a.idle(); const r = await snap('step' + (i + 1)); if (r.ppt >= 13.1) break; }
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
