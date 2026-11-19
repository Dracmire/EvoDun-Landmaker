/* LEGO VERTICALITY (PR lego, rule L2'; docs/crystallizers/03-stage/research/octopath2/stage_lego_go.md), the selector "Height treatment" and Cam 7 (D-L4):
   (1) the selector exists in mode 3 (default Auto); the examples declare M1 / M3 = up, L1 (Diorama 7, Cima) = down, C0 = mid;
   (2) L1 (Down): lego.js ran (m = 2, one jump of m * E = 3.75, tiles moved) and the shape's topology hash equals the one with Mid; the selector Mid removes the treatment (no `legoInfo`), Up forces Up, Auto returns the declared one;
   (3) a room on ONE terrace (M1) is `single`: nothing moves and the canvas is the same with Mid and Auto;
   (4) Cam 7: in mode 3 its view yaw is the yaw of the room (the one of Cam 6), in mode 1 it is 0 (byte-identical camera) and Cam 6 / Cam 1 / Cam 3 / Cam 5 do not change;
   (5) the state ends with the window session (leaving to mode 1): selector Auto, example treatment Mid, no flip, the next example (dac_stage) has no `legoInfo`; no page errors.
     NODE_PATH=$(npm root -g) node tools/ui/test_lego_ui.js */
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const setSel = async (v) => { await ev((v) => { const c = document.querySelector('#stageHeight'); c.value = v; c.dispatchEvent(new Event('change')); }, v); await idle(); await idle(); };
  const facts = () => ev(() => { const e = window.__evo, S = e.S(), st = e.st, li = S.legoInfo || null; return { sel: document.querySelector('#stageHeight') && document.querySelector('#stageHeight').value, htSel: st.stage.htSel, htEx: st.stage.htEx, li: li && { t: li.treatment, m: li.m, jumps: li.jumps, moved: li.moved, single: li.single, terraces: li.terraces }, levels: S.levelH.length, view: e.view().yaw, flip: st.stage.legoFlip, cv: (() => { const c = document.querySelector('#stage canvas'); return c.toDataURL().length; })() }; });
  const hashTopo = () => ev(() => { const S = window.__evo.S(); let h = 0; const mix = (x) => { h = (Math.imul(h ^ (x | 0), 0x01000193) + 0x9e3779b9) | 0; }; for (let i = 0; i < S.n; i++) { mix(S.block[i]); mix(S.void ? S.void[i] : 0); mix(S.region ? S.region[i] : 0); mix(S.roomMap ? S.roomMap[i] : 0); } mix((S.stairs || []).length); return h; });
  await ev(() => window.__evo.setMode('stage')); await idle();
  // (1)
  const d = {}; for (const id of ['perfil_m1', 'perfil_m3', 'perfil_l1', 'perfil_c0']) { await clickEx(id); d[id] = await facts(); }
  ok('the selector "Height treatment" exists in mode 3 (Auto) and the examples declare M1 / M3 = up, L1 = down, C0 = mid', Object.values(d).every((q) => q.sel === 'auto' && q.htSel === 'auto') && d.perfil_m1.htEx === 'up' && d.perfil_m3.htEx === 'up' && d.perfil_l1.htEx === 'down' && d.perfil_c0.htEx === 'mid', d);
  // (2) L1
  await clickEx('perfil_l1'); const f1 = await facts(), t1 = await hashTopo();
  ok(`L1 (Diorama 7, Down): lego ran: m ${f1.li && f1.li.m}, jumps ${f1.li && JSON.stringify(f1.li.jumps)} (m x E = 3.75), ${f1.li && f1.li.moved} tiles moved`, f1.li && f1.li.t === 'down' && f1.li.m === 2 && f1.li.jumps.length === 1 && Math.abs(f1.li.jumps[0] - 3.75) < 0.01 && f1.li.moved > 0, f1);
  await setSel('mid'); const f2 = await facts(), t2 = await hashTopo();
  ok(`Mid removes the treatment (no legoInfo) and the topology hash is the same (${t1} = ${t2}); the level set is the one of today (${f2.levels} levels, ${f1.levels} with Down)`, !f2.li && t1 === t2 && f2.levels < f1.levels, { f1, f2, t1, t2 });
  await setSel('up'); const f3 = await facts(), t3 = await hashTopo(); ok(`Up forces Up on L1 (m ${f3.li && f3.li.m}, jumps ${f3.li && JSON.stringify(f3.li.jumps)}) with the same topology (${t3} = ${t1})`, f3.li && f3.li.t === 'up' && Math.abs(f3.li.jumps[0] - 3.75) < 0.01 && t3 === t1, f3);
  await setSel('auto'); const f4 = await facts(); ok('Auto returns the declared one (Down)', f4.li && f4.li.t === 'down', f4);
  // (3) single terrace
  await clickEx('perfil_m1'); const g1 = await facts(); await setSel('mid'); const g2 = await facts();
  ok(`M1 (room 14, one terrace): single, nothing moved (${g1.li && g1.li.moved}); the canvas is the same with Mid and Auto (${g1.cv} = ${g2.cv})`, g1.li && g1.li.single && g1.li.moved === 0 && g1.cv === g2.cv && g1.levels === g2.levels, { g1, g2 });
  // (4) Cam 7
  await clickEx('perfil_c0'); const yawOf = async (cam) => { await page.click(`#presets button[data-id="${cam}"]`); await idle(); return ev(() => ({ yaw: window.__evo.view().yaw, kind: window.__evo.view().kind, room: window.__evo.S().orient ? window.__evo.S().orient.byId.get(window.__evo.st.stageRooms[0]).yaw : null })); };
  const c6 = await yawOf('stage'), c7 = await yawOf('classic');
  ok(`mode 3: Cam 7 takes the yaw of the room (Cam 6 ${c6.yaw}, Cam 7 ${c7.yaw}, the room's ${c7.room}), kind oblique`, c7.kind === 'oblique' && c7.yaw === c6.yaw && c7.yaw === c7.room, { c6, c7 });
  await page.click('#presets button[data-id="stage"]'); await idle();
  await ev(() => window.__evo.setMode('terrain')); await idle(); await clickEx(await ev(() => window.EVO.modes.byId('terrain').examples[0].id));
  const m1c7 = await yawOf('classic'); ok(`mode 1: Cam 7 stays at yaw 0 (${m1c7.yaw})`, m1c7.yaw === 0 && m1c7.kind === 'oblique', m1c7);
  const others = []; for (const c of ['isoE', 'isoW', 'oblique', 'top']) others.push((await yawOf(c)).yaw); ok(`mode 1: Cam 1 / 2 / 3 / 5 yaws unchanged (${others.join(', ')})`, others.join() === '45,-45,0,0', others);
  // (5) session end
  const end = await ev(() => { const st = window.__evo.st; return { sel: document.querySelector('#stageHeight').value, htSel: st.stage.htSel, htEx: st.stage.htEx, flip: st.stage.legoFlip }; });
  ok('the state ended with the window session (leaving to mode 1): selector Auto, example treatment Mid, no flip', end.sel === 'auto' && end.htSel === 'auto' && end.htEx === 'mid' && !end.flip, end);
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('dac_stage'); const nx = await facts();
  ok('no leak: dac_stage afterwards has no treatment (no legoInfo, htEx mid)', !nx.li && nx.htEx === 'mid' && nx.htSel === 'auto', nx);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
