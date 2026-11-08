/* THE WINDOW SELECTOR OF MODE 3 (M2c; the list `#stageWindow` of src/ui.js, the model E.stage.zoneList / windowCheck / WIN_MAX of src/stage.js):
   (a) Forest A: the list has 6 rows (k, raw id, tiles, elevation) in the order of the table; marking rows gives the same window, the same canvas and the same info (without timings) as the hook stageSetWindow; another order of marks = another window and another badge; unmarking removes; the last mark stays;
   (b) the warning of zones that are not neighbours is in the help line of the list, never in #info (m2_hashes.js hashes #info);
   (c) WIN_MAX: a window of at most WIN_MAX zones (the limit is lowered in the page to test it);
   (d) the end of the session: the list is emptied and hidden, sliceSel goes back; MUTATION skipWinListClear breaks it;
   (e) outside mode 3 and without the modes layer the list is hidden, and the chips of mode 1 (zone chips of "Your images") do what they did: no window state;
   (f) M2c commit 2: dac_stage lists its rooms (the whole map, with scroll); marking the roomSet of the example in its order = the example, canvas for canvas; "Default window" goes back to it.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_window_ui.js */
const crypto = require('crypto');
const { open, mapFile } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const snap = async () => sha(await a.canvas()) + ' ' + sha(Buffer.from((await ev(() => document.querySelector('#info').innerText)).replace(/\d+(\.\d+)?\s*(ms|s)\b/g, 'T')));
  const rows = () => ev(() => [...document.querySelectorAll('#stageWindow .wrow')].map((r) => ({ k: +r.dataset.k, badge: r.querySelector('b').textContent, text: r.querySelector('span').textContent, on: r.classList.contains('on') })));
  const win = () => ev(() => window.__evo.st.stageRooms.slice());
  const help = () => ev(() => document.querySelector('#stageWinHelp').textContent);
  const click = async (k) => { await page.click(`#stageWindow .wrow[data-k="${k}"]`); await idle(); };
  await ev(() => window.__evo.setMode('stage')); await idle();
  // (a) Forest A
  await page.click('#examples button[data-id="forest_a"]'); await idle();
  const r0 = await rows();
  ok(`Forest A: the list has 6 rows in the order of the table with the sizes ${JSON.stringify(r0.map((r) => r.text.split(' · ')[2]))}; only k 1 is marked (badge 1)`, r0.length === 6 && r0.map((r) => r.k).join() === '1,2,3,4,5,6' && r0.map((r) => +r.text.split(' · ')[2].split(' ')[0]).join() === '680,140,440,132,376,624' && r0[0].on && r0[0].badge === '1' && r0.slice(1).every((r) => !r.on), r0);
  ok('the list is visible in the window and is a row of the group "3 Stage"', await ev(() => { const row = document.querySelector('#stageWinRow'); return !row.hidden && !!row.closest('.grp[data-group="3 Stage"]'); }));
  await click(4); await click(6); const viaClick = await snap(), w1 = await win();
  await ev(() => window.__evo.stageSetWindow([1])); await idle(); await ev(() => window.__evo.stageSetWindow([1, 4, 6])); await idle(); const viaHook = await snap();
  ok(`marking k 4 and k 6 gives the window ${JSON.stringify(w1)} and the same canvas and info as stageSetWindow([1, 4, 6]) (${viaClick} = ${viaHook})`, w1.join() === '1,4,6' && viaClick === viaHook);
  const badges = (await rows()).filter((r) => r.on).map((r) => [r.k, r.badge]);
  await click(1); await click(1); const w2 = await win(), o2 = await snap(), b2 = (await rows()).filter((r) => r.on).map((r) => [r.k, r.badge]);
  ok(`another order of marks is another window: [1, 4, 6] ${JSON.stringify(badges)} -> unmark and mark k 1 again -> ${JSON.stringify(w2)} ${JSON.stringify(b2)}, another canvas`, w2.join() === '4,6,1' && JSON.stringify(b2) === JSON.stringify([[1, '3'], [4, '1'], [6, '2']]) && o2 !== viaHook);
  await click(4); const w3 = await win(); ok(`unmarking k 4 removes it: ${JSON.stringify(w3)}`, w3.join() === '6,1');
  await click(1); await click(6); const w4 = await win(); ok(`the last mark stays: clicking the only marked row does nothing (${JSON.stringify(w4)})`, w4.join() === '6');
  await page.click('#stageWinDefault'); await idle(); const wd = await win(); ok(`"Default window" = the lowest zone alone (${JSON.stringify(wd)})`, wd.join() === '1');
  // (b) the warning
  await click(6); const hNo = await help(), iNo = await ev(() => document.querySelector('#info').innerText);
  ok(`the window [1, 6] (valley, plateau N: not neighbours) shows the warning in the help line: "${hNo}", and #info does not carry it`, /zones 1 and 6 are not neighbours/.test(hNo) && !/neighbours/.test(iNo), [hNo]);
  await click(6); await click(4); await click(6); const hOk = await help(); ok(`the window [1, 4, 6] (neighbours in a row) has no warning ("${hOk}")`, hOk === '', hOk);
  // (c) WIN_MAX
  await ev(() => { window.EVO.stage.WIN_MAX = 3; }); await ev(() => window.__evo.stageSetWindow([1, 4, 6])); await idle(); await click(2); const wm = await win(), hm = await help();
  ok(`WIN_MAX (lowered to 3 for the test): a fourth zone is refused (${JSON.stringify(wm)}) and the help says "${hm}"`, wm.join() === '1,4,6' && /at most 3/.test(hm), [wm, hm]);
  await ev(() => { window.EVO.stage.WIN_MAX = 12; });
  // (d) the end of the session
  const sel0 = await ev(() => { const s = window.__evo.sliceSel; return { whole: s.whole, zones: [...s.zones] }; });
  await ev(() => window.__evo.setMode('terrain')); await idle();
  const out = await ev(() => { const s = window.__evo.sliceSel, row = document.querySelector('#stageWinRow'); return { kids: document.querySelectorAll('#stageWindow .wrow').length, hidden: row.hidden, help: document.querySelector('#stageWinHelp').textContent, whole: s.whole, zones: [...s.zones] }; });
  ok(`leaving the session (the mode selector): the list is emptied and hidden (${out.kids} rows, hidden ${out.hidden}) and the slice is not the window any more (whole ${out.whole}, zones ${JSON.stringify(out.zones)}; inside it was ${JSON.stringify(sel0)})`, out.kids === 0 && out.hidden && out.help === '' && out.whole === true && out.zones.length === 0, out);
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="forest_a"]'); await idle();
  await ev(() => { window.EVO.modesTest = Object.assign(window.EVO.modesTest || {}, { skipWinListClear: true }); }); await ev(() => window.__evo.setMode('terrain')); await idle();
  const mut = await ev(() => document.querySelectorAll('#stageWindow .wrow').length); await ev(() => { window.EVO.modesTest.skipWinListClear = false; });
  ok(`MUTATION skipWinListClear is caught: the list outlives the session (${mut} rows left instead of 0)`, mut > 0, mut);
  // (e) the chips of mode 1 are untouched
  await ev(() => window.__evo.setMode('terrain')); await idle(); await page.click('#examples button[data-id="images"]'); await idle();
  await page.setInputFiles('#file', ['height', 'zones', 'path'].map((n) => mapFile('maps_stage', n))); await page.waitForTimeout(2500); await idle();
  const c0 = await ev(() => ({ rooms: window.__evo.st.stageRooms.length, row: document.querySelector('#stageWinRow').hidden, chips: document.querySelectorAll('#zoneChips .chip').length, zones: [...window.__evo.sliceSel.zones] }));
  await page.click('#zoneChips .chip:nth-child(2)'); await idle(); const c1 = await ev(() => ({ rooms: window.__evo.st.stageRooms.length, row: document.querySelector('#stageWinRow').hidden, zones: [...window.__evo.sliceSel.zones], win: !!window.__evo.st.win }));
  ok(`mode 1 with images: the window list is hidden and a zone chip does what it did (zones ${JSON.stringify(c0.zones)} -> ${JSON.stringify(c1.zones)}), no window state (stageRooms ${c1.rooms}, session ${c1.win})`, c0.row && c1.row && c0.rooms === 0 && c1.rooms === 0 && !c1.win && JSON.stringify(c0.zones) !== JSON.stringify(c1.zones), [c0, c1]);
  // (f) the rooms of DAC (M2c commit 2)
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="dac_stage"]'); await idle();
  const nRooms = await ev(() => window.__evo.S().rooms.rooms.length), d0 = await rows(), dsnap = await snap(), dwin = await win();
  const sc = await ev(() => { const b = document.querySelector('#stageWindow'); return { ch: b.clientHeight, sh: b.scrollHeight, mh: getComputedStyle(b).maxHeight }; });
  ok(`dac_stage: the list has ${d0.length} rows (the ${nRooms} rooms of the map) with a scroll box (${sc.mh}, content ${sc.sh} px in ${sc.ch}); the roomSet ${JSON.stringify(dwin)} is marked 1..6 in its order`, d0.length === nRooms && nRooms > 60 && sc.sh > sc.ch && d0.filter((r) => r.on).map((r) => [r.k, r.badge]).sort((p, q) => +p[1] - +q[1]).map((r) => r[0]).join() === '17,10,20,27,6,5' && d0.filter((r) => r.on).every((r) => r.badge === String(dwin.indexOf(r.k) + 1)), [d0.length, sc]);
  ok('the rows of rooms read "room id · tiles" (no elevation, no neighbours)', /^room 17 · \d+ tiles$/.test(d0.find((r) => r.k === 17).text));
  await ev(() => window.__evo.stageSetRooms([17])); await idle(); for (const id of [10, 20, 27, 6, 5]) await click(id); const viaClicks = await snap(), wClicks = await win();
  ok(`marking 10, 20, 27, 6 and 5 after 17 gives the roomSet of the example ${JSON.stringify(wClicks)} and the same canvas and info as the example untouched (${viaClicks} = ${dsnap})`, wClicks.join() === dwin.join() && viaClicks === dsnap);
  const extra = d0.find((r) => !r.on).k; await click(extra); const w7 = await win(); await page.click('#stageWinDefault'); await idle(); const wBack = await win(), sBack = await snap();
  ok(`a seventh room (${extra}) joins the window ${JSON.stringify(w7)}; "Default window" goes back to the roomSet of the example (${JSON.stringify(wBack)}), canvas for canvas`, w7.length === 7 && wBack.join() === dwin.join() && sBack === dsnap);
  await ev(() => { window.EVO.stage.WIN_MAX = 7; }); const refused = d0.filter((r) => !r.on && r.k !== extra)[0].k; await click(extra); await click(refused); const w8 = await win(), h8 = await help(); await ev(() => { window.EVO.stage.WIN_MAX = 12; }); await page.click('#stageWinDefault'); await idle();
  ok(`WIN_MAX with rooms (lowered to 7): an eighth room is refused (${JSON.stringify(w8)}), help "${h8}"`, w8.length === 7 && /at most 7 rooms/.test(h8), [w8, h8]);
  // the cost of a window of 12 rooms
  const ids12 = d0.slice(0, 12).map((r) => r.k), t0 = Date.now(); await ev((ids) => window.__evo.stageSetRooms(ids), ids12); await idle(); const ms12 = Date.now() - t0, w12 = await win();
  console.log(`INFO a window of ${w12.length} DAC rooms (${ids12}) builds and draws in ${ms12} ms (set + idle)`); ok(`a window of 12 rooms works (${w12.length} rooms in the window, ${ms12} ms)`, w12.length === 12);
  await page.click('#stageWinDefault'); await idle();
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close();
  const b = await open({ w: 1500, h: 900 }); const nm = await b.page.evaluate(() => { const r = document.querySelector('#stageWinRow'); return !r || r.hidden; });
  ok('without the modes layer the window list is hidden', nm); ok('no page errors (without modes)', b.errs.length === 0, b.errs); await b.browser.close();
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
