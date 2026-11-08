/* Screenshots of M2c (the window selector of mode 3) into docs/crystallizers/03-stage/shots/m2c/: the list `#stageWindow` in Forest A with a window of three zones marked (valley, plateau N, east slope: the first pair are not neighbours, so the warning shows) and in dac_stage (88 rooms in the scroll box), each as the list alone and as the whole page.
     NODE_PATH=$(npm root -g) node tools/ui/m2c_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/m2c');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const shot = async (name) => { await ev(() => document.querySelector('#stageWinRow').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200); await page.locator('#stageWinRow').screenshot({ path: path.join(out, name + '_lista.png') }); await page.screenshot({ path: path.join(out, name + '_pagina.png') }); console.log(name); };
  await ev(() => window.__evo.setMode('stage')); await idle();
  await page.click('#examples button[data-id="forest_a"]'); await idle();
  for (const k of [6, 4]) { await page.click(`#stageWindow .wrow[data-k="${k}"]`); await idle(); }
  await shot('forest_a_ventana_1_6_4_aviso');
  await page.click('#examples button[data-id="dac_stage"]'); await idle(); await shot('dac_stage_88_salas');
  await ev(() => { document.querySelector('#stageWindow').scrollTop = 400; }); await shot('dac_stage_88_salas_desplazada');
  console.log('errs', a.errs.length); await a.browser.close();
})();
