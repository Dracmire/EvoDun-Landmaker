/* S1b measurement (not a test): the canvas of EVERY example of modes 1, 3, 4, 5 and 6 (the ones that need no files), each shot right after a visit of mode 2 (its default example: type tint and Diorama outline on),
   i.e. the LEAK path of limitation 22. Run it on main (EVO_ROOT = origin/main, which inherits the tint / outline) and on the S1b tree, then compare: the images that differ are the ones the fix changes on that path.
     NODE_PATH=$(npm root -g) [EVO_ROOT=<old checkout>] node tools/ui/leak_images.js <outDir>      then: node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: leak_images.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const list = await ev(() => window.EVO.modes.MODES.filter((m) => m.id !== 'rooms').flatMap((m) => m.examples.filter((x) => !x.images).map((x) => ({ mode: m.id, id: x.id }))));
  for (const ex of list) {
    await ev(() => window.__evo.setMode('rooms')); await a.idle();
    await ev((m) => window.__evo.setMode(m), ex.mode); await a.idle(); await page.click(`#examples button[data-id="${ex.id}"]`); await a.idle(); await page.waitForTimeout(300); await a.idle();
    fs.writeFileSync(path.join(out, `${ex.mode}_${ex.id}.png`), await a.canvas());
  }
  console.log('examples:', list.length, 'errors:', a.errs); await a.browser.close();
})();
