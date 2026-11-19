/* PR pend P1 (F8): the terraces slider is a control of mode 3 (it was folded away) and what [U] sets AFTER opening an example wins over the example's own value; the shape is rebuilt; leaving the window session brings the terraces back. dac_stage and diorama31_stage at 9 terraces (the legacy one can break: the facts are printed).
     NODE_PATH=$(npm root -g) node tools/ui/test_terraces_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const facts = () => ev(() => { const e = window.__evo, S = e.S(), i = document.querySelector('#stageTerraces'), cv = document.querySelector('#stage canvas'); return { P: e.P.terraces, shown: !!(i && i.offsetParent), slider: i && +i.value, N: S.N, rooms: e.st.stageRooms.slice(), hero: !!e.st.hero, win: !!e.st.win, info: document.querySelector('#info').innerText.slice(0, 140), cv: cv.toDataURL().length }; });
  const setT = async (n) => { await ev((n) => { const i = document.querySelector('#stageTerraces'); i.value = n; i.dispatchEvent(new Event('input')); i.dispatchEvent(new Event('change')); }, n); await idle(); await idle(); };
  await ev(() => window.__evo.setMode('terrain')); await idle(); const t1 = (await facts()).P;
  await ev(() => window.__evo.setMode('stage')); await idle();
  for (const ex of ['dac_stage', 'diorama31_stage']) {
    await page.click(`#examples button[data-id="${ex}"]`); await idle(); await idle(); const f0 = await facts(); await setT(9); const f9 = await facts();
    ok(`${ex}: the visible Terraces control (#stageTerraces) is shown in mode 3 (${f0.shown}); the example opened with ${f0.P}; after the slider 9 wins (P ${f9.P}, slider ${f9.slider}) and the shape was rebuilt (N ${f0.N} -> ${f9.N}, canvas ${f0.cv} -> ${f9.cv})`, f0.shown && f9.P === 9 && f9.N === 9 && f9.cv !== f0.cv, { f0, f9 });
    console.log(`  FACT ${ex} at 9 terraces: rooms ${JSON.stringify(f9.rooms)} hero ${f9.hero} info "${f9.info.replace(/\n/g, ' ')}"`);
  }
  await ev(() => window.__evo.setMode('terrain')); await idle(); const back = await facts();
  ok(`leaving the window session brings the terraces back (${back.P}, the value of mode 1 before was ${t1})`, back.P === t1 && !back.win, { back, t1 });
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
