/* PR Q1 (D2 of [U]): the camera dolly by progress is ON (gain 0.15 [R]) in every WINDOW example of mode 3 and ends with the window session on EVERY exit (mode 1, 2, 4 examples, a legacy example of mode 3). MUTATION skipDollyEnd (E.modesTest): the exit check must FAIL.
     NODE_PATH=$(npm root -g) node tools/ui/test_dolly_default_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log('PASS ' + n); } else { fail++; console.log('FAIL ' + n, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } };
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const STATE = () => { const e = window.__evo, c = document.querySelector('#t-stageDolly'), g = document.querySelector('#stageDollyGain'); return { dolly: e.st.stage.dolly, gain: e.st.stage.dollyGain, win: !!e.st.win, chk: c ? c.checked : null, sel: g ? g.value : null }; };
  await ev(() => window.__evo.setMode('stage')); await idle();
  const ids = await ev(() => window.EVO.modes.byId('stage').examples.map((e) => e.id));
  let nWin = 0, nLegacy = 0, bad = [];
  for (const id of ids) { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); const s = await ev(STATE); if (s.win) { nWin++; if (!(s.dolly === 'on' && s.gain === 0.15 && s.chk === true && s.sel === '0.15')) bad.push([id, s]); } else { nLegacy++; if (!(s.dolly === 'off')) bad.push([id, s]); } }
  ok(`every window example (${nWin}) starts with the dolly on, gain 0.15 and the controls in sync; the ${nLegacy} legacy ones keep it off`, nWin > 0 && bad.length === 0, bad);
  const exits = [['mode 1', 'terrain'], ['mode 2', 'rooms'], ['mode 4', 'curves']];
  for (const [name, m] of exits) { await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="dac_stage"]'); await idle(); await idle(); const before = await ev(STATE); await ev((m) => window.__evo.setMode(m), m); await idle(); await idle(); const after = await ev(STATE);
    ok(`leaving the window to a ${name} example: dolly ${before.dolly} -> ${after.dolly}, gain ${after.gain}, checkbox ${after.chk}`, before.dolly === 'on' && after.dolly === 'off' && after.gain === 0.3 && after.chk === false, { before, after }); }
  { await ev(() => { window.EVO.modesTest = { skipDollyEnd: true }; window.__evo.setMode('stage'); }); await idle(); await page.click('#examples button[data-id="dac_stage"]'); await idle(); await idle(); await ev(() => window.__evo.setMode('terrain')); await idle(); await idle(); const m = await ev(STATE); await ev(() => { window.EVO.modesTest = null; });
    ok(`MUTATION skipDollyEnd: the exit check FAILS (the dolly survives the exit: ${m.dolly})`, m.dolly === 'on', m); }
  ok('no page errors', a.errs.length === 0, a.errs);
  console.log(`\n${pass} passed, ${fail} failed`); await a.browser.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
