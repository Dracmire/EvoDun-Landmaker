/* wall work vs cap work at a close-up framing (JS-thread time of the three sections of renderLevels), plus the render statistics */
const { start } = require('/tmp/claude-0/perf/lib.js');
const [ID, K, TECH, MODE, PPT] = [process.argv[2], +process.argv[3], process.argv[4], process.argv[5], +(process.argv[6] || 13)];
(async () => {
  const L = await start(), { a, page, ev } = L;
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${ID}"]`); await a.idle();
  if (K === 0) { await ev(() => { window.__evo.inc.objectives.splice(0, window.__evo.inc.objectives.length - 1); }); await page.selectOption('#roomRule', 'route'); await a.idle(); await page.selectOption('#roomRule', 'v164'); await a.idle(); }
  if (TECH !== 'A') await a.tech(TECH); if (MODE !== 'm2') await L.mode(MODE);
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  if (PPT > 0) await L.frame('close', c.x, c.y, PPT); else await L.frame('full');
  const r = await ev(({ tech }) => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'); window.__W = { build: 0, draw: 0, cap: 0, setup: 0, asc: 0 }; const res = []; for (let i = 0; i < 3; i++) { const t = performance.now(); const st = E.render(cv, e.S(), e.P, tech, e.view(), e.O); res.push({ ms: performance.now() - t, polys: st.polys, walls: st.walls, verts: st.verts }); } const W = window.__W; return { ppt: +(e.st.zoom * e.st.fitSc).toFixed(1), perRender: { setup: Math.round(W.setup / 3), build: Math.round(W.build / 3), draw: Math.round(W.draw / 3), cap: Math.round(W.cap / 3), asc: Math.round(W.asc / 3) }, total: Math.round(res.reduce((s, x) => s + x.ms, 0) / 3), stats: res[0], levels: e.S().maxFine + 1 }; }, { tech: TECH });
  console.log(JSON.stringify({ scene: ID + '-K' + K, tech: TECH, mode: MODE, ...r })); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
