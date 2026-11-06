/* Screenshots of the S4c landmark (dac_stage, Cam 6, yaw 180, objects on) into docs/crystallizers/03-stage/shots/: the same shot with the hero at 8, 6, 4 and 2 H from it, the base detail at 3 H, and the island border on.
     NODE_PATH=$(npm root -g) node tools/ui/stage_landmark_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots');
const LX = 55.5, LY = 135.5, DIR = [-13 / Math.hypot(13, 9), -9 / Math.hypot(13, 9)]; // the ray toward the 8 H hero position (42.5, 126.5)
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="dac_stage"]'); await a.idle(); await page.click('#t-stageObjects'); await a.idle();
  const atD = async (d) => { const x = LX + DIR[0] * d * 2, y = LY + DIR[1] * d * 2; await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); };
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await ev(() => { const s = window.__evo.O.objects.stats.find((q) => q.kind === 'landmark'); return { d: +s.d.toFixed(2), hH: +s.hH.toFixed(3), visible: s.visible, alpha: s.alpha }; }))); };
  for (const d of [8, 6, 4, 2]) { await atD(d); await shot(`s4c_d${d}H.png`); }
  await atD(3); await shot('s4c_base_detail_3H.png');
  await ev(() => { const s = document.querySelector('#stageBorder'); s.value = 'island'; s.dispatchEvent(new Event('change')); }); await a.idle(); await atD(4); await shot('s4c_island_4H.png');
  console.log('errs', a.errs.length); await a.browser.close();
})();
