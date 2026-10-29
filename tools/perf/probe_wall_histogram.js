const { start } = require('/tmp/claude-0/perf/lib.js');
const PPT = +process.argv[2];
(async () => { const L = await start(), { a, page, ev } = L; await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle();
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  if (PPT > 0) await L.frame('close', c.x, c.y, PPT); else await L.frame('full');
  const r = await ev(() => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'); window.__H = { h: [0, 0, 0, 0, 0, 0, 0], n: 0, area: 0 }; const st = E.render(cv, e.S(), e.P, 'A', e.view(), e.O); const H = window.__H; window.__H = null; return { ppt: +(e.st.zoom * e.st.fitSc).toFixed(1), drawnWalls: st.walls, calls: H.n, bins: { '<0.25px': H.h[0], '<0.5': H.h[1], '<1': H.h[2], '<2': H.h[3], '<4': H.h[4], '<8': H.h[5], '>=8': H.h[6] }, culled: st.culled }; });
  console.log(JSON.stringify(r)); await a.browser.close(); })();
