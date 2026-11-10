/* Screenshots of the throne world, commit 1 (example `throne_aliahan`, Cam 6, the yaw `orient` gives) into docs/crystallizers/03-stage/shots/throne1/: the hero on the axis 3 old tiles from the dais (the example's start), 8 old tiles back,
   in the entrance passage, on the dais, and 4 old tiles off the axis. Our own render (no third-party image).
     NODE_PATH=$(npm root -g) node tools/ui/throne_world_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/throne1');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="throne_aliahan"]'); await a.idle(); await a.idle();
  const at = async (x, y) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); await a.idle(); };
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await ev(() => ({ yaw: window.__evo.view().yaw, hero: window.__evo.st.hero })))); };
  await at(17, 18); await shot('throne1_axis_3_tiles.png');
  await at(17, 23); await shot('throne1_axis_6_tiles.png');
  await at(17, 27); await shot('throne1_entrance_passage.png');
  await at(17, 8); await shot('throne1_on_the_dais.png');
  await at(9, 18); await shot('throne1_off_axis_4_tiles.png');
  console.log('errs', a.errs.length); await a.browser.close();
})();
