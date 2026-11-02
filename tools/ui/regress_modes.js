/* Pixel regression of the MODES layer (the panel as the user sees it, not the EVO_NO_MODES panel of the other regress scripts): the canvas of the default example of mode 1 and of mode 2, the "Chain (5 terraces)" example of
   mode 2 (and a round trip 2 -> 3 -> 2: the same example again), and the two LEGACY examples of mode 3 (Stage: x4_stage, diorama31_stage, Art contract on). PR S1 adds the 2D-HD example `dac_stage` to mode 3; these images must not change.
   The canvases must be identical to the checkout in EVO_ROOT (origin/main). `--round` also visits mode 3 (dac_stage, only in a tree that has it) between two visits of mode 2: the second image of mode 2 must equal the first.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/regress_modes.js <outDir> [--round]      then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress_modes.js <outDir> [--round]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const shot = async (name) => { await a.idle(); await page.waitForTimeout(300); await a.idle(); fs.writeFileSync(path.join(out, name + '.png'), await a.canvas()); };
  const mode = async (id) => { await ev((m) => window.__evo.setMode(m), id); await a.idle(); };
  const example = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); };
  await mode('terrain'); await shot('m1_snake_surface'); await example('real_map'); await shot('m1_real_map');
  await mode('rooms'); await shot('m2_default'); await example('real_chain5'); await shot('m2_chain5');
  await mode('stage'); await example('x4_stage'); await shot('m3_x4_stage'); await example('diorama31_stage'); await shot('m3_diorama31_stage');
  if (process.argv.includes('--round')) { // 2 -> 3 (the 2D-HD window) -> 2 in one session: mode 2 draws exactly as before
    await mode('stage'); await example('dac_stage'); await mode('rooms'); await example('real_chain5'); await a.idle(); await page.waitForTimeout(300); await a.idle();
    const same = Buffer.compare(fs.readFileSync(path.join(out, 'm2_chain5.png')), await a.canvas()) === 0; console.log('round trip equal:', same); if (!same) process.exitCode = 1;
  }
  console.log('errors:', a.errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : process.exitCode || 0);
})();
