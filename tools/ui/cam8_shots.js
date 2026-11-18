/* Screenshots of Cam 6 and Cam 8 in two examples of mode 3 (dac_stage and golden_door): docs/crystallizers/03-stage/shots/cam8/. 
     NODE_PATH=$(npm root -g) node tools/ui/cam8_shots.js [outDir] */
const fs = require('fs'), path = require('path'), { open } = require('./common');
(async () => {
  const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/cam8'); fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, idle = async () => { await a.idle(); await a.idle(); };
  await page.evaluate(() => window.__evo.setMode('stage')); await idle();
  for (const ex of ['dac_stage', 'golden_door']) { await page.click(`#examples button[data-id="${ex}"]`); await idle(); await idle();
    for (const [cam, tag] of [['stage', 'cam6'], ['stagez', 'cam8']]) { await page.click(`#presets button[data-id="${cam}"]`); await idle(); await idle(); fs.writeFileSync(path.join(out, `${ex}_${tag}.png`), await a.canvas()); } }
  console.log('errors:', a.errs); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
