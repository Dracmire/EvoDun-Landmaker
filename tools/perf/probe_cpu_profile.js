/* PR E step 0: CPU profile (CDP) of ONE camera-move render at the close-up framing */
const { start } = require('/tmp/claude-0/perf/lib.js');
const TECH = process.argv[2] || 'A', MODE = process.argv[3] || 'corr';
(async () => {
  const L = await start(), { a, page, ev } = L;
  await L.scene(TECH, 1);
  await L.mode('m2'); if (+(process.argv[4]||0) > 0) { const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; }); await L.frame('close', c.x, c.y, +process.argv[4]); } else await L.frame('full');
  const cdp = await page.context().newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await ev(({ tech }) => { const E = window.EVO, e = window.__evo, cv = document.querySelector('#stage canvas'); for (let i = 0; i < 1; i++) E.render(cv, e.S(), e.P, tech, e.view(), e.O); }, { tech: TECH });
  const { profile } = await cdp.send('Profiler.stop');
  const byId = new Map(profile.nodes.map((n) => [n.id, n])), self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
  const agg = new Map(); let tot = 0; for (const [id, t] of self) { const cf = byId.get(id).callFrame, k = (cf.url.split('/').pop() || '(native)') + ':' + (cf.functionName || '(anon)') + ':' + (cf.lineNumber + 1); agg.set(k, (agg.get(k) || 0) + t); tot += t; }
  const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const byParent = new Map(); for (const [id, t] of self) { const cf = byId.get(id).callFrame; if ((cf.url || '') !== '') continue; const pn = byId.get(parent.get(id)); const k = cf.functionName + ' <- ' + (pn ? pn.callFrame.functionName : '?'); byParent.set(k, (byParent.get(k) || 0) + t); }
  console.log('--- native self time by (call <- caller)'); for (const [k, v] of [...byParent].sort((x, y) => y[1] - x[1]).slice(0, 14)) console.log(String(Math.round(v / 1000)).padStart(7), 'ms', k);
  console.log('tech', TECH, 'mode', MODE, 'sampled ms (2 renders)', Math.round(tot / 1000));
  for (const [k, v] of [...agg].sort((x, y) => y[1] - x[1]).slice(0, 18)) console.log(String(Math.round(v / 1000)).padStart(7), 'ms', (100 * v / tot).toFixed(1).padStart(5), '%', k);
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
