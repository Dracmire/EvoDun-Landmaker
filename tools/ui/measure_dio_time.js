/* DAC v2 PR C2 (D31, review of PR #46): redraw time of the mode-2 chain view with "Diorama in chain view" Off / M2 / M1, in ONE session with a fixed protocol (report, not tuned).
   Per technique (A, B): 3 fresh pages; each page: click the example (the cold first draw, M2 = the mode-2 default), then alternate Off, M2, Off, M2, Off, M2, M1, Off, M1 (each a selectOption + idle).
   Off / M2 / M1 are compared on the WARM state (same page, rooms layer cached); the cold first draw is reported apart.   EVO_ROOT=<dir> NODE_PATH=$(npm root -g) node tools/ui/measure_dio_time.js */
const { open } = require('./common');
const med = (a) => { const q = a.slice().sort((x, y) => x - y); return q[(q.length - 1) >> 1]; };
(async () => {
  const res = {};
  for (const tech of ['A', 'B']) for (let rep = 0; rep < 3; rep++) {
    const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    const timed = async (sel) => { const t0 = Date.now(); await page.selectOption('#dioChain', sel); await a.idle(); return Date.now() - t0; };
    await ev(() => window.__evo.setMode('rooms')); await a.idle();
    const t0 = Date.now(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle(); const cold = Date.now() - t0; await a.tech(tech);
    const seq = ['off', 'm2', 'off', 'm2', 'off', 'm2', 'm1', 'off', 'm1'], got = {}; for (const m of seq) (got[m] = got[m] || []).push(await timed(m));
    const lv = await ev(() => window.__evo.S().levelH.length); const r = res[tech] = res[tech] || { cold: [], off: [], m2: [], m1: [], levels: lv };
    r.cold.push(cold); for (const m of ['off', 'm2', 'm1']) r[m].push(...got[m]); await a.browser.close();
  }
  for (const [tech, r] of Object.entries(res)) console.log(JSON.stringify({ tech, coldFirstDrawM2: { median: med(r.cold), all: r.cold }, warmOff: { median: med(r.off), min: Math.min(...r.off), max: Math.max(...r.off), n: r.off.length }, warmM2: { median: med(r.m2), min: Math.min(...r.m2), max: Math.max(...r.m2), n: r.m2.length }, warmM1: { median: med(r.m1), min: Math.min(...r.m1), max: Math.max(...r.m1), n: r.m1.length } }));
})().catch((e) => { console.error(e); process.exit(1); });
