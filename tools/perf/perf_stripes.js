/* PR F step 0.4: pan cache ON at devicePixelRatio 1 / 1.25 / 2: layer size, blit frame vs fresh render, and a screenshot of a blit frame */
const { chromium } = require('playwright'); const fs = require('fs');
const DPR = +(process.argv[2] || 2), W = +(process.argv[3] || 1500), H = +(process.argv[4] || 900);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR }); const errs = []; page.on('pageerror', (e) => errs.push(String(e))); 
  await page.goto('file://' + require('path').resolve(__dirname, '../../index.html') + ''); await page.waitForFunction(() => window.__evo);
  const idle = () => page.waitForFunction(() => document.querySelector('#busy').hidden, null, { timeout: 300000 }).then(() => page.waitForTimeout(350)), ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await idle(); await page.click('#examples button[data-id="real_chain5"]'); await idle(); await page.check('#t-panCache'); await idle();
  // zoom in with the wheel to ~13 px/tile
  const b = await (await page.$('#stage canvas')).boundingBox(); for (let i = 0; i < 14; i++) { const n = await ev(() => window.__evo.st.draws); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.wheel(0, -100); await page.waitForFunction((n0) => window.__evo.st.draws > n0, n); await idle(); }
  const r = await ev(() => { const e = window.__evo, E = window.EVO, cv = document.querySelector('#stage canvas'); e.panFrameTest(e.st.panX + 3, e.st.panY + 2); const L = e.panLayerInfo(), lc = e.st.panLay.cv;
    const off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height; off.style.cssText = `width:${cv.clientWidth}px;height:${cv.clientHeight}px;position:absolute;left:-9999px`; document.body.appendChild(off); E.render(off, e.S(), e.P, e.st.panTech, e.view(), e.O);
    const A = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, B = off.getContext('2d').getImageData(0, 0, off.width, off.height).data; let d = 0, big = 0, big40 = 0, mx = 0; for (let i = 0; i < A.length; i += 4) { const m = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (m) { d++; if (m > 2) big++; if (m > 40) big40++; if (m > mx) mx = m; } }
    return { dpr: devicePixelRatio, canvas: [cv.width, cv.height], layerCss: [lc.clientWidth || null], layerPx: [lc.width, lc.height], layerMB: +(lc.width * lc.height * 4 / 1048576).toFixed(1), buildMs: Math.round(L.ms), diff: d, big, big40, maxDelta: mx, pixels: cv.width * cv.height }; });
  console.log('dpr', DPR, JSON.stringify(r), errs.length ? errs : '');
  await page.screenshot({ path: `/tmp/claude-0/perf/f0/blit_dpr${DPR}.png` });
  await browser.close();
})();
