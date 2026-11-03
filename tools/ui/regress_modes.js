/* Pixel regression of the MODES layer (the panel as the user sees it, not the EVO_NO_MODES panel of the other regress scripts): the canvas of the default example of mode 1 and of mode 2, the "Chain (5 terraces)" example of
   mode 2, and the two LEGACY examples of mode 3 (Stage: x4_stage, diorama31_stage, Art contract on). The images must be identical to the checkout in EVO_ROOT (origin/main).
   LEAK (limitation 22, fixed in S1b): in a tree WITHOUT the S1b reset the legacy examples inherit O.typeTint / O.dioOutline from the last mode-2 example of the session, so for such a tree (EVO_ROOT = origin/main before S1b) they are shot in a
   FRESH session first: `--fresh`. The tree under test shoots them in the SAME session, right after mode 2 (the default): they must equal the fresh-session images of main (the S1b reset makes the examples of every other mode independent of mode 2).
   `--round` also visits mode 3 (dac_stage, only in a tree that has it) between two visits of mode 2: the second image of mode 2 must equal the first.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_modes.js <outDir> [--fresh] [--round]      then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_modes.js <outDir> [--fresh] [--round]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const FRESH = process.argv.includes('--fresh'), errs = [];
  const legacy = async (a) => { // the two legacy examples of mode 3, in the session `a`
    const page = a.page, shot = async (name) => { await a.idle(); await page.waitForTimeout(300); await a.idle(); fs.writeFileSync(path.join(out, name + '.png'), await a.canvas()); };
    await page.evaluate(() => window.__evo.setMode('stage')); await a.idle();
    for (const id of ['x4_stage', 'diorama31_stage']) { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await shot('m3_' + id); }
  };
  if (FRESH) { const b = await open({ w: 1500, h: 900, modes: true }); await legacy(b); errs.push(...b.errs); await b.browser.close(); }
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const shot = async (name) => { await a.idle(); await page.waitForTimeout(300); await a.idle(); fs.writeFileSync(path.join(out, name + '.png'), await a.canvas()); };
  const mode = async (id) => { await ev((m) => window.__evo.setMode(m), id); await a.idle(); };
  const example = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); };
  await mode('terrain'); await shot('m1_snake_surface'); await example('real_map'); await shot('m1_real_map');
  await mode('rooms'); await shot('m2_default'); await example('real_chain5'); await shot('m2_chain5');
  if (!FRESH) await legacy(a); // the same session, after mode 2 (tint and outline on): they must not inherit them
  if (process.argv.includes('--round')) { // 2 -> 3 (the 2D-HD window) -> 2 in one session: mode 2 draws exactly as before
    await mode('stage'); await example('dac_stage'); await mode('rooms'); await example('real_chain5'); await a.idle(); await page.waitForTimeout(300); await a.idle();
    const same = Buffer.compare(fs.readFileSync(path.join(out, 'm2_chain5.png')), await a.canvas()) === 0; console.log('round trip equal:', same); if (!same) process.exitCode = 1;
  }
  errs.push(...a.errs); await a.browser.close();
  console.log('errors:', errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(errs)); process.exit(errs.length ? 1 : process.exitCode || 0);
})();
