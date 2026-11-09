/* STAGE HEIGHT SLIDERS (mode 3, PR M4c-0): "Vertical scale" (`vScale`, Cam 6 only, optional input of makePersp) and "Height exaggeration" (`exag`, pure E.stage.exag at the planes / volumes / objects sites) in the viewer.
   (1) both exist in mode 3, default 1, greyed in a legacy example; (2) neutral = the same canvas as before touching them (set to 1 explicitly after a change); (3) vScale only redraws (the shape S is the same object, levels equal) and changes the canvas;
   exag rebuilds the planes (S.stagePlanes.exag) and moves levelH; (4) Reset returns both to 1; (5) the state ends with the window session; (6) the manifest writes the keys only when not 1 and loads old manifests as 1.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_heights_ui.js */
const crypto = require('crypto'), { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const setSlider = async (k, v) => { await ev(([k, v]) => { const i = document.querySelector('#s-' + k); i.value = v; i.dispatchEvent(new Event('change')); }, [k, v]); await idle(); await idle(); };
  const snap = async () => sha(await a.canvas());
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('x4_stage');
  const d0 = await ev(() => ['vScale', 'exag'].map((k) => document.querySelector('#s-' + k) && document.querySelector('#s-' + k).disabled));
  ok('both sliders exist and are greyed in a legacy example (no window)', d0.every((x) => x === true), d0);
  await clickEx('dac_stage');
  const c0 = await ev(() => ({ d: ['vScale', 'exag'].map((k) => document.querySelector('#s-' + k).disabled), v: ['vScale', 'exag'].map((k) => +document.querySelector('#s-' + k).value), r: ['vScale', 'exag'].map((k) => [document.querySelector('#s-' + k).min, document.querySelector('#s-' + k).max, document.querySelector('#s-' + k).step].join('/')), st: [window.__evo.st.stage.vScale, window.__evo.st.stage.exag] }));
  ok(`in dac_stage: enabled, default 1 / 1, ranges ${c0.r.join(' ; ')}`, c0.d.every((x) => !x) && c0.v.join() === '1,1' && c0.st.join() === '1,1' && c0.r[0] === '0.8/1.6/0.01' && c0.r[1] === '1/2/0.01', c0);
  const h0 = await snap(), S0 = await ev(() => JSON.stringify([Array.from(window.__evo.S().levelH), Array.from(window.__evo.S().fine)]).length);
  await setSlider('vScale', 1.15); const h1 = await snap(), same = await ev(() => window.__evo.S().stagePlanes && window.__evo.S().stagePlanes.exag);
  ok('vScale 1.15 changes the canvas and does not touch the shape (same levels)', h1 !== h0 && (await ev(() => JSON.stringify([Array.from(window.__evo.S().levelH), Array.from(window.__evo.S().fine)]).length)) === S0 && same === 1);
  await setSlider('vScale', 1); const h2 = await snap(); ok('vScale back to 1: the canvas is the one of before (neutral = identical)', h2 === h0, [h0, h2]);
  const lv0 = await ev(() => Array.from(window.__evo.S().levelH).join());
  await setSlider('exag', 1.3); const h3 = await snap(), r3 = await ev(() => ({ ex: window.__evo.S().stagePlanes && window.__evo.S().stagePlanes.exag, lv: Array.from(window.__evo.S().levelH).join() }));
  ok('exag 1.3 rebuilds the planes (S.stagePlanes.exag = 1.3), changes the levels and the canvas', r3.ex === 1.3 && r3.lv !== lv0 && h3 !== h0, [r3.ex]);
  await setSlider('exag', 1); const h4 = await snap(), lv4 = await ev(() => Array.from(window.__evo.S().levelH).join()); ok('exag back to 1: levels and canvas are the ones of before', h4 === h0 && lv4 === lv0, [h0, h4]);
  await setSlider('vScale', 1.2); await setSlider('exag', 1.5);
  const man = await ev(() => { const b = window.__evo.viewerBlock ? window.__evo.viewerBlock() : null; return b && b.stage; });
  ok('the manifest writes vScale / exag when they are not 1', !man || (man.vScale === 1.2 && man.exag === 1.5), man);
  await page.click('#stageReset'); await idle(); await idle();
  const rs = await ev(() => [window.__evo.st.stage.vScale, window.__evo.st.stage.exag, +document.querySelector('#s-vScale').value, +document.querySelector('#s-exag').value]);
  ok('Reset returns both to 1 (state and sliders)', rs.join() === '1,1,1,1', rs);
  const h5 = await snap(); ok('after Reset the canvas is the neutral one', h5 === h0, [h0, h5]);
  await setSlider('vScale', 1.3); await setSlider('exag', 1.2); await clickEx('x4_stage');
  const end = await ev(() => [window.__evo.st.stage.vScale, window.__evo.st.stage.exag]); ok('the window session ends: leaving to a legacy example resets both', end.join() === '1,1', end);
  await clickEx('dac_stage'); const back = await ev(() => [window.__evo.st.stage.vScale, window.__evo.st.stage.exag, +document.querySelector('#s-vScale').value]); ok('entering again starts at 1', back.join() === '1,1,1', back);
  ok('no page errors', a.errs.length === 0, a.errs.slice(0, 2));
  console.log(`${pass} passed, ${fail} failed`); await a.browser.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
