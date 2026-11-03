/* LIMITATION 22 (fixed in S1b): the Display toggles that only mode 2 sets (O.typeTint, O.dioOutline, O.roomBorders and their checkboxes) must not leak into the examples of the other modes.
   Mode 2 is visited (its default example has the type tint and the Diorama outline ON), then EVERY example of modes 1, 3, 4, 5 and 6 (the ones with rooms in particular: real map Default / Balanced types of mode 4, dac_stage and
   diorama31_stage of mode 3) is applied: the three toggles and their checkboxes must be the fresh defaults of O (tint off, outline off, room borders on). Between two examples mode 2 is visited again (tint and outline back on).
   MUTATION (E.modesTest.skipDisplayReset: the reset skipped): the same check FAILS on the examples with rooms.
   The panel without modes (EVO_NO_MODES, the legacy scenario buttons) cannot leak: no scenario sets these toggles there (they are the user's own), so the check is only about the modes layer.
     NODE_PATH=$(npm root -g) node tools/ui/test_modes_leak_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const STATE = () => { const e = window.__evo, O = e.O, cb = (id) => { const el = document.querySelector('#' + id); return el ? el.checked : null; }; return { tint: O.typeTint, outline: O.dioOutline, borders: O.roomBorders, cTint: cb('t-typeTint'), cOutline: cb('t-dioOutline'), cBorders: cb('t-roomBorders') }; };
  const isDefault = (s) => s.tint === false && s.outline === false && s.borders === true && s.cTint === false && s.cOutline === false && s.cBorders === true;
  const list = await ev(() => window.EVO.modes.MODES.filter((m) => m.id !== 'rooms').flatMap((m) => m.examples.filter((x) => !x.images).map((x) => ({ mode: m.id, id: x.id, rooms: !!x.rooms })))); // every example outside mode 2 (the images example needs files)
  const visit2 = async () => { await ev(() => window.__evo.setMode('rooms')); await a.idle(); return ev(STATE); };
  const run = async (mutate) => { const bad = []; let withRooms = 0, n = 0;
    await ev((m) => { window.EVO.modesTest = m ? { skipDisplayReset: true } : null; }, mutate);
    for (const ex of list) {
      const s2 = await visit2(); if (!(s2.tint && s2.outline)) bad.push(['precondition: mode 2 has tint and outline on', ex.id, s2]);
      await ev((m) => window.__evo.setMode(m), ex.mode); await a.idle(); await page.click(`#examples button[data-id="${ex.id}"]`); await a.idle();
      const s = await ev(STATE); n++; if (ex.rooms) withRooms++; if (!isDefault(s)) bad.push([ex.mode + '/' + ex.id, s]);
    }
    await ev(() => { window.EVO.modesTest = null; }); return { bad, n, withRooms }; };
  const good = await run(false);
  ok(`after a visit of mode 2 (tint and outline on), the ${good.n} examples of modes 1, 3, 4, 5 and 6 (${good.withRooms} with rooms) have O.typeTint / O.dioOutline off, O.roomBorders on, checkboxes the same`, good.bad.length === 0 && good.n >= 10 && good.withRooms >= 4, good.bad);
  const s = await ev(STATE); const s2 = await visit2(); ok('mode 2 itself is unchanged: its default example has the type tint and the Diorama outline on', s2.tint && s2.outline && s2.borders && s2.cTint && s2.cOutline, s2);
  await page.click('#examples button[data-id="real_chain5"]'); await a.idle(); const c5 = await ev(STATE); ok('mode 2 "Chain (5 terraces)" keeps its tint and outline', c5.tint && c5.outline && c5.borders, c5);
  const mut = await run(true);
  ok(`MUTATION: the reset skipped (E.modesTest.skipDisplayReset): the leak check FAILS (${mut.bad.length} of ${mut.n} examples inherit the tint / outline of mode 2)`, mut.bad.some((b) => /dac_stage|real_|diorama31/.test(b[0])), mut.bad.map((b) => b[0]));
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
