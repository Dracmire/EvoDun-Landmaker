/* Screenshots of the S4b volumes (dac_stage, Cam 6, yaw 180) into docs/crystallizers/03-stage/shots/: the same framing with the volumes off and on, the 3 H column, the 2 H wall, the far low block, and the far flank with the island and the quebrada border.
     NODE_PATH=$(npm root -g) node tools/ui/stage_volumes_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="dac_stage"]'); await a.idle();
  const at = async (x, y) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); };
  const vols = async (on) => { const cur = await ev(() => window.__evo.st.stage.volumes === 'on'); if (cur !== on) { await page.click('#t-stageVolumes'); await a.idle(); } };
  const border = async (v) => { await ev((v) => { const s = document.querySelector('#stageBorder'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await a.idle(); };
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await ev(() => { const v = window.__evo.S().stageVolumes; return v ? { tiles: v.tiles, levels: v.levelsAdded, omitted: v.skipped.length } : null; }))); };
  await at(75.5, 140.5); await shot('s4b_flank_off.png'); await vols(true); await shot('s4b_flank_on.png');
  await at(85.5, 138.5); await shot('s4b_column_3H.png');
  await at(68.5, 139.5); await shot('s4b_wall_2H.png');
  await at(50.5, 139.5); await shot('s4b_far_block_1H.png');
  await at(27.5, 129.5); await shot('s4b_interior_1H.png');
  await at(75.5, 140.5); await border('island'); await shot('s4b_island.png'); await border('quebrada'); await shot('s4b_quebrada.png');
  console.log('errs', a.errs.length); await a.browser.close();
})();
