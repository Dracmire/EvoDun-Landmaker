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
  // PR lego3: with the stairs re-carved (half the depth) the footprint of a stair and the numbering of the regions may differ from Mid's, so the topology of a room with a stair is compared as: the room map, the void, the NUMBER and the SIZES of the walkable regions and the walkable tile count (not the stair footprint, which changes by design)
  const hashTopo2 = () => ev(() => { const S = window.__evo.S(); let h = 0; const mix = (x) => { h = (Math.imul(h ^ (x | 0), 0x01000193) + 0x9e3779b9) | 0; }; const sz = new Set(); let walk = 0; for (let i = 0; i < S.n; i++) { mix(S.void ? S.void[i] : 0); mix(S.roomMap ? S.roomMap[i] : 0); if (S.region && S.region[i] >= 0) { walk++; sz.add(S.region[i]); } } return { h, regions: sz.size, walk }; });
  const topoEq = (a, b) => a.h === b.h && a.regions === b.regions && Math.abs(a.walk - b.walk) <= 4; // the stair footprint is re-carved with half the depth: the walkable count may differ by a few tiles (measured and printed)
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
  // (2b) PR lego2: the two Up examples step on 2+ terraces, the treatment ran, the jump is m * E * D, the topology is the one of Mid
  for (const [id, room] of [['perfil_u1', 1], ['perfil_u2', 29]]) { await clickEx(id); const f = await facts(), ta = await hashTopo2(); await setSel('mid'); const fm = await facts(), tm = await hashTopo2(); await setSel('auto');
    ok(`${id} (DAC ${room}): declared up, ${f.li && f.li.terraces} terraces, m ${f.li && f.li.m}, jump ${f.li && JSON.stringify(f.li.jumps)} = m * E * D (3.75), ${f.li && f.li.moved} tiles moved; the walkable topology (room map, void, regions, walkable tiles; not the stair footprint, re-carved on purpose) equals Mid's up to the re-carved footprint (regions ${ta.regions} = ${tm.regions}, walkable ${ta.walk} vs ${tm.walk}); Mid has no treatment`, f.htEx === 'up' && f.li && f.li.t === 'up' && !f.li.single && f.li.terraces >= 2 && f.li.moved > 0 && f.li.jumps.every((j) => Math.abs(j - f.li.m * 1.875) < 0.01) && topoEq(ta, tm) && !fm.li, { f, fm, ta, tm }); }
  // (3) single terrace (PR lego3, A539): the sub-level lego changes the canvas and not the topology
  await clickEx('perfil_m1'); const g1 = await facts(), tg1 = await hashTopo(); await setSel('mid'); const g2 = await facts(), tg2 = await hashTopo();
  ok(`M1 (room 14, one terrace): single + sub-level lego (${g1.li && g1.li.moved} tiles moved), the topology is the same (${tg1} = ${tg2}), the canvas differs from Mid (${g1.cv} vs ${g2.cv})`, g1.li && g1.li.single && g1.li.moved > 0 && tg1 === tg2 && g1.cv !== g2.cv && !g2.li, { g1, g2 }); await setSel('auto');
  await clickEx('perfil_s1'); const s1 = await facts(); ok(`S1 (DAC 57, one terrace): declared up, sub-level lego ran (${s1.li && s1.li.moved} tiles moved)`, s1.htEx === 'up' && s1.li && s1.li.single && s1.li.moved > 0, s1);
  // (3b) PR lego3: Cake under lego (Rest default / Scale) and the shorter stairs
  { const adj = () => ev(() => { const a = window.__evo.S().legoAdjust; return a && { depth: a.depthAfter, before: a.lenBefore, layers: a.cakeLayersAfter, m: a.m }; }), rings = () => ev(() => { const c = window.__evo.S().cake; return c ? c.rings.reduce((x, y) => x + y, 0) : -1; });
    await clickEx('perfil_u2'); const sel0 = await ev(() => document.querySelector('#stageCakeLego').value), aR = await adj(), rR = await rings();
    await ev(() => { const c = document.querySelector('#stageCakeLego'); c.value = 'scale'; c.dispatchEvent(new Event('change')); }); await idle(); await idle(); const aS = await adj(), rS = await rings();
    ok(`Cake under lego: default Rest (selector ${sel0}): stairs ${aR && aR.before} -> ${aR && aR.depth} tiles, rings kept (layers change ${aR && aR.layers}), ${rR} ring tiles; Scale: layers x m = ${aS && aS.layers}, ${rS} ring tiles`, sel0 === 'rest' && aR && aR.depth < aR.before && aR.layers === null && aS && aS.layers === 6 && rS > 0 && rR > 0, { aR, aS, rR, rS });
    await ev(() => { const c = document.querySelector('#stageHeight'); c.value = 'mid'; c.dispatchEvent(new Event('change')); }); await idle(); await idle(); const aM = await adj(); ok('Mid has no stair / ring adjustment', aM === null || aM === undefined || aM === false, aM);
    await ev(() => { const c = document.querySelector('#stageHeight'); c.value = 'auto'; c.dispatchEvent(new Event('change')); const k = document.querySelector('#stageCakeLego'); k.value = 'rest'; k.dispatchEvent(new Event('change')); }); await idle(); await idle(); }
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
