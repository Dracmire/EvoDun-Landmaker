/* MEASURED, NOT ENFORCED (docs/crystallizers/05-floors/option2-backdrop.md section N): the SILHOUETTE of the floor backdrop at the fitted view of Cam 1, Box pick render: the horizontal extent of the backdrop pixels in the top 15 % and in the
   bottom 15 % of the rows the backdrop covers, and their ratio (top width / base width: about 1 = a drum, < 1 = it tapers); plus the levels added. The same script runs in the old tree (EVO_ROOT=<checkout>, the phase 1b wall: only the
   height multiplier exists, the profile keys are ignored) and in the new one.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/measure_backdrop.js */
const { open } = require('./common');
const STATES = [['x1', { backdropHeight: 1 }], ['x2 (default)', { backdropHeight: 2 }], ['x3', { backdropHeight: 3 }], ['x2, 5 finer steps', { backdropHeight: 2, backdropSteps: 5, backdropRiser: 0.5, backdropDepth: 10 }], ['x2, boundary noise', { backdropHeight: 2, backdropNoise: 1 }], ['x2, no taper', { backdropHeight: 2, backdropTaper: 0 }]];
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await page.selectOption('#src', 'snake_floors'); await a.idle(); await page.click('#mode'); await a.idle(); await a.tech('box'); await a.preset('isoE');
  for (const k of [1, 2]) { await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle();
    for (const [name, cfg] of STATES) {
      await ev(({ cfg }) => { const P = window.__evo.P; Object.assign(P, { backdropMode: 'v2', backdropGap: 0, backdropSteps: 3, backdropRiser: 1, backdropTaper: 2, backdropNoise: 0, backdropDepth: 9 }, cfg); const c = document.querySelector('#t-backdrop'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }, { cfg });
      await a.idle(); await ev(() => { const c = document.querySelector('#t-backdrop'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle(); await page.waitForTimeout(250); await a.idle();
      const r = await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, bd = S.backdrop; if (!bd) return null;
        const px = E.pickBuffer(S, e.P, Object.assign({}, e.view()), w, h).data, rows = new Map(); let y0 = h, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (px[i * 4 + 3] !== 255) continue; const c = (px[i * 4] << 16) | (px[i * 4 + 1] << 8) | px[i * 4 + 2], kind = c >> 20, t = c & 0xfffff; if ((kind === 2 || kind === 4) && t < S.n && bd.role[t] === 2) { let r = rows.get(y); if (!r) rows.set(y, r = [x, x]); if (x < r[0]) r[0] = x; if (x > r[1]) r[1] = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
        const span = y1 - y0 + 1, ext = (lo, hi) => { let a = Infinity, b = -Infinity; for (const [y, r] of rows) if (y >= lo && y <= hi) { if (r[0] < a) a = r[0]; if (r[1] > b) b = r[1]; } return b - a + 1; };
        const top = ext(y0, y0 + Math.floor(0.15 * span)), base = ext(y1 - Math.floor(0.15 * span), y1); return { rows: span, top, base, ratio: +(top / base).toFixed(2), levelsAdded: bd.info.levelsAdded, touchesTop: y0 === 0 }; });
      console.log(JSON.stringify({ floor: k, state: name, ...r })); } }
  await a.browser.close();
})();
