/* Screenshots of the S4a objects (dac_stage, Cam 6, yaw 180) into docs/crystallizers/03-stage/shots/: the hero start (the 1 H reference banner beside it, the cut 3 H banner at the top right), beside the transition (two flanking lamps), and the hero BEHIND and IN FRONT OF the 3 H pillar of room 20 (the common depth order).
     NODE_PATH=$(npm root -g) node tools/ui/stage_objects_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="dac_stage"]'); await a.idle(); await page.click('#t-stageObjects'); await a.idle();
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await ev(() => window.__evo.O.objects.stats.map((s) => [s.kind, s.hH, s.drawn ? 1 : 0])))); };
  const at = async (x, y) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); };
  await shot('s4a_start.png');
  await at(61.5, 119.5); await shot('s4a_transition.png');
  await at(80.5, 122.5); await shot('s4a_pillar_hero_behind.png');
  await at(80.5, 120.5); await shot('s4a_pillar_hero_in_front.png');
  console.log('errs', a.errs.length); await a.browser.close();
})();
