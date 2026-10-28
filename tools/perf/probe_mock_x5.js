const { start } = require('/tmp/claude-0/perf/lib.js'); const fs = require('fs');
const PPT = +process.argv[2], MT = +(process.argv[3] || 3), TAG = process.argv[4] || String(PPT);
(async () => { const L = await start(), { a, page, ev } = L; await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle();
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  if (PPT > 0) await L.frame('close', c.x, c.y, PPT); else await L.frame('full');
  await ev(() => { const C = CanvasRenderingContext2D.prototype; window.__ascN = 0; window.__ascOn = false; window.__ac = {}; for (const k of ['fill', 'stroke', 'createLinearGradient']) { const f = C[k]; C[k] = function () { if (window.__ascOn) window.__ac[k] = (window.__ac[k] || 0) + 1; return f.apply(this, arguments); }; } });
  for (const mock of [undefined, 'c', 'd2', 'c+asc', 'd2+asc']) {
    const r = await ev(({ mock, MT }) => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'); const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1]; const o = Object.assign({}, e.O, { mock: mock && mock.split('+')[0], mockAsc: !!(mock && mock.includes('asc')), mockT: MT }); const runs = []; let st;
      for (let k = 0; k < 6; k++) { window.__W = { build: 0, draw: 0, cap: 0, setup: 0, asc: 0 }; window.__ascN = 0; window.__ac = {}; const t = performance.now(); st = E.render(cv, e.S(), e.P, 'A', e.view(), o); const ms = performance.now() - t; cv.getContext('2d').getImageData(0, 0, 1, 1); if (k > 0) runs.push({ ms, ...window.__W }); }
      const f = (k) => ({ med: Math.round(med(runs.map((r) => r[k]))), min: Math.round(Math.min(...runs.map((r) => r[k]))), max: Math.round(Math.max(...runs.map((r) => r[k]))) });
      return { ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), mock: (mock || 'exact').replace('+', '_'), total: f('ms'), segmentsBuild: f('build'), levelWallsDraw: f('draw'), caps: f('cap'), ascension: f('asc'), walls: st.walls, ascWalls: window.__ascN, png: cv.toDataURL('image/png') }; }, { mock, MT });
    fs.writeFileSync(`/tmp/claude-0/perf/f0/mock/${TAG}_${r.mock}.png`, Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; console.log(JSON.stringify(r)); }
  await a.browser.close(); })().catch((e) => { console.error(e); process.exit(1); });
