/* Pixel regression: renders a fixed set of scenarios and writes the canvases as PNG files.
     NODE_PATH=$(npm root -g) node tools/ui/regress.js <outDir> [--set subs=6,terraces=12]
   Compare two runs with `node tools/ui/compare.js <dirA> <dirB>`. Scenarios without carved stairs must stay
   identical across refactors. */
const fs = require('fs'), path = require('path');
const { open } = require('./common');

(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: regress.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open();
  const setArg = process.argv.indexOf('--set') > 0 ? process.argv[process.argv.indexOf('--set') + 1] : '';
  for (const kv of setArg.split(',').filter(Boolean)) { const [k, v] = kv.split('='); await a.slider(k, +v); await a.idle(); } // slider values: shaping parameters
  const shot = async (name) => fs.writeFileSync(path.join(out, name + '.png'), await a.canvas());
  const techs = ['box', 'A', 'B'], presets = ['oblique', 'isoE'];
  const sweep = async (tag) => { for (const t of techs) { await a.tech(t); for (const p of presets) { await a.preset(p); await shot(`${tag}_${t}_${p}`); } } };
  await a.page.click('#mode');                                     // single-technique view
  await a.page.selectOption('#src', 'noise'); await a.idle(); await sweep('noise');
  await a.page.selectOption('#src', 'snake'); await a.idle(); await sweep('snake');
  await a.load('maps'); await a.zone(6); await sweep('zone6');
  await a.load('maps_noring'); await a.zone(1); await sweep('zone1_edge');
  await a.page.click('#wholeMap'); await a.idle(); await a.tech('A'); await a.preset('oblique'); await shot('whole_A_oblique');
  console.log('errors:', a.errs); fs.writeFileSync(path.join(out, 'errors.json'), JSON.stringify(a.errs));
  await a.browser.close();
  process.exit(a.errs.length ? 1 : 0);
})();
