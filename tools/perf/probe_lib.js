/* PR E step 0 probe helpers (throw-away; the probe worktree /tmp/claude-0/wt_f0 carries a __perf hook in src/ui.js). */
process.env.EVO_ROOT = process.env.EVO_ROOT || '/tmp/claude-0/wt_f0';
const { open } = require('/tmp/claude-0/wt_f0/tools/ui/common.js');
const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const WRAP = { EVO: ['shape', 'render', 'fitScale', 'stairSurvival', 'route', 'regionGap', 'walkGraph', 'pickBuffer', 'pickTile', 'loopsA', 'loopsB', 'loopsC'], 'EVO.roomTypes': ['dioPlan', 'dioPlanCorr', 'chainRoute', 'roomChain', 'chainTypes', 'chainWalk', 'dioApply', 'dioProfile', 'pieces', 'dioFraming', 'dioStumps', 'classify'], 'EVO.rooms': ['layer'], 'EVO.controls': ['refresh'] };
exports.med = med;
exports.start = async (opts) => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev((WRAP) => {
    window.__perf = { frames: [], cur: null, begin() { this.cur = { t0: performance.now(), m: [] }; }, m(n) { if (this.cur) this.cur.m.push([n, performance.now()]); }, end() { const c = this.cur; if (!c) return; c.t1 = performance.now(); this.frames.push(c); this.cur = null; } };
    window.__cnt = {};
    for (const [path, names] of Object.entries(WRAP)) { const o = path.split('.').reduce((x, k) => x[k], window); for (const n of names) { const f = o && o[n]; if (typeof f !== 'function') continue; const key = path.replace('EVO.', '').replace('EVO', 'E') + '.' + n; o[n] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { const c = window.__cnt[key] || (window.__cnt[key] = { n: 0, ms: 0 }); c.n++; c.ms += performance.now() - t; } }; Object.assign(o[n], f); } }
  }, WRAP);
  const api = {
    a, page, ev,
    reset: () => ev(() => { window.__cnt = {}; window.__perf.frames = []; }),
    cnt: () => ev(() => { const o = {}; for (const [k, v] of Object.entries(window.__cnt)) o[k] = [v.n, Math.round(v.ms)]; return o; }),
    frames: () => ev(() => window.__perf.frames.map((f) => ({ total: f.t1 - f.t0, m: f.m.map(([n, t]) => [n, t - f.t0]) }))),
    // wait for the number of completed draws to reach n (and the busy flag to be down)
    waitFrames: (n, to) => page.waitForFunction((n) => window.__perf.frames.length >= n && document.querySelector('#busy').hidden, n, { timeout: to || 180000 }),
    nFrames: () => ev(() => window.__perf.frames.length),
    // phases of a frame record: [name, ms]
    phases: (f) => { const out = {}; let prev = 0; for (const [n, t] of f.m) { out[n] = (out[n] || 0) + (t - prev); prev = t; } out.rest = f.total - prev; out.total = f.total; return out; },
    scene: async (tech, terH, example) => { await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${example || 'real_balanced'}"]`); await a.idle(); await a.tech(tech); await a.slider('terH', terH); await a.idle(); },
    mode: async (m) => { await page.selectOption('#dioChain', m); await a.idle(); },
    // framing: 'full' = reset, 'close' = about `ppt` px per tile around tile (x, y) of the window
    frame: async (kind, x, y, ppt) => { if (kind === 'full') { await page.click('#reset'); await a.idle(); return; }
      await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'); const v = e.view(); const z = (ppt * cv.clientWidth / (cv.clientWidth)) / (e.st.fitSc || 1) ; v.zoom = z; v.panX = 0; v.panY = 0; const Href = S.levelH[S.fine[(y | 0) * S.W + (x | 0)]] || 0; const p0 = E.makeCam(S, e.P, v, cv.clientWidth, cv.clientHeight).p(x, y, Href); e.st.zoom = z; e.st.panX = cv.clientWidth / 2 - p0[0]; e.st.panY = cv.clientHeight / 2 - p0[1]; e.draw(); }, { x, y, ppt }); await a.idle(); },
    stage: () => page.$('#stage canvas').then((c) => c.boundingBox()),
  };
  return api;
};
