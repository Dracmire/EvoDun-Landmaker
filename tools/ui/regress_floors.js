/* Pixel regression of the FLOORS single-floor view (source "Snake Mountain floors"; floor 1 and floor 2; Box / A / B / C; Cam 1 and Cam 3): the canvases must be identical to the checkout in EVO_ROOT with the floor backdrop
   off (Option 2, src/backdrop.js). Only generic preconditions: the same script runs in the old tree (which has no #t-backdrop) and the new one.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_floors.js <outDir> [--toggle backdrop] [--mode real|mirror|wall] [--gap 0-8]     (--toggle <id>: check and uncheck the switch #t-<id> before shooting, so a switch that leaks state is caught; --mode: the backdrop mode (P.backdropMode) and --gap its gap (P.backdropGap) used while it is on)
   then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_floors.js <outDir> [--toggle backdrop]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.selectOption('#src', 'snake_floors'); await a.idle(); await page.click('#mode'); await a.idle();
  const mi = process.argv.indexOf('--mode'); if (mi > 0) await page.evaluate((m) => { window.__evo.P.backdropMode = m; }, process.argv[mi + 1]);
  const gi = process.argv.indexOf('--gap'); if (gi > 0) await page.evaluate((g) => { window.__evo.P.backdropGap = +g; }, process.argv[gi + 1]);
  const ti = process.argv.indexOf('--toggle');
  if (ti > 0) { const id = process.argv[ti + 1]; const tog = (on) => page.$eval('#t-' + id, (e, v) => { e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, on); await tog(true); await a.idle(); await tog(false); await a.idle(); }
  for (const k of [1, 2]) { await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle();
    for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); for (const p of ['oblique', 'isoE']) { await a.preset(p); await a.idle(); fs.writeFileSync(path.join(out, `floor${k}_${t}_${p}.png`), await a.canvas()); } } }
  console.log('errors:', a.errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
