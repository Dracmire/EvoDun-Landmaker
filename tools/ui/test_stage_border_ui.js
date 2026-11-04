/* STAGE BORDERS (mode 3, PR S2) in the viewer: the select "Stage border" (Off / Island / Quebrada) of the window example `dac_stage`.
   (1) the control exists, is greyed outside a window example (the legacy examples) and enabled in dac_stage; (2) Island / Quebrada change the picture and the info line, Off returns the identical pixels; (3) the footprint, the blocks and the regions are identical on / off (walking does not change);
   (4) the camera side follows the base yaw of the camera: Cam 6 (yaw 180) vs Cam 3 (yaw 0) give different shapes, a preset change rebuilds, MUTATION ignoreYaw (E.borderTest) makes Cam 6 equal Cam 3: the check FAILS;
   (5) the unit: a new tilesPerH rebuilds the border (the profile is in H); (6) the manifest: viewer.stage.border is written only when not Off, an absent key loads Off, the fields.js validation (tools/test_fields.js) rejects a wrong value.
   The leaks (the border ends with the window session on every exit) are tested in test_window_session_ui.js.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_border_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const setB = async (v) => { await page.selectOption('#stageBorder', v); await idle(); };
  const pix = async () => crypto.createHash('sha1').update(await a.canvas()).digest('hex');
  const SH = () => ev(() => { const S = window.__evo.S(), h = new Float64Array(S.n); for (let i = 0; i < S.n; i++) h[i] = S.levelH[S.fine[i]]; let fpMoved = 0; return { b: S.stageBorder, hh: Array.from(h.slice(0, 0)), n: S.n, levels: S.levelH.length, blk: Array.from(S.block).reduce((x, v) => x + v, 0), reg: S.region ? Array.from(S.region).reduce((x, v, i) => (x * 31 + v + 7 * i) % 1000003, 7) : 0, info: document.querySelector('#info').textContent }; });
  const FP = () => ev(() => { const S = window.__evo.S(), o = []; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i])) o.push(+S.levelH[S.fine[i]].toFixed(6)); return o; });
  const HH = () => ev(() => { const S = window.__evo.S(); let h = 7; for (let i = 0; i < S.n; i++) h = (h * 31 + Math.round(S.levelH[S.fine[i]] * 1000)) % 1000000007; return h; });
  // (1) the control
  await setMode('stage'); await clickEx('x4_stage');
  const c1 = await ev(() => { const s = document.querySelector('#stageBorder'); return s ? { dis: s.disabled, vis: !s.closest('[hidden]') } : null; });
  ok('the select exists in mode 3 and is greyed in a legacy example (no window): requirement stageWin', c1 && c1.dis === true, c1);
  await clickEx('dac_stage');
  const c2 = await ev(() => { const s = document.querySelector('#stageBorder'); return { dis: s.disabled, v: s.value, opts: [...s.options].map((o) => o.value) }; });
  ok('in dac_stage it is enabled, starts Off and offers Off / Island / Quebrada', !c2.dis && c2.v === 'off' && c2.opts.join() === 'off,island,quebrada', c2);
  const modes12 = await ev(() => { const m = window.EVO.modes.MODES; return m.filter((x) => x.main.includes('stageBorder')).map((x) => x.id); }); ok('stageBorder is a main control of mode 3 only', modes12.join() === 'stage', modes12);
  // (2) pictures
  const p0 = await pix(), s0 = await SH(), fp0 = await FP(), h0 = await HH();
  ok('Off: no border in the shape and no border text in the info', !s0.b && !/border (Isla|Quebrada)/.test(s0.info), s0.b);
  await setB('island'); const p1 = await pix(), s1 = await SH(), fp1 = await FP();
  ok(`Island: the picture changes, the info says it (${s1.b && s1.b.tiles} tiles, +${s1.b && s1.b.levelsAdded} levels)`, p1 !== p0 && s1.b && s1.b.type === 'island' && s1.b.levelsAdded > 0 && /border Isla/.test(s1.info), s1.b);
  await setB('quebrada'); const p2 = await pix(), s2 = await SH(), fp2 = await FP();
  ok(`Quebrada: another picture (+${s2.b && s2.b.levelsAdded} levels)`, p2 !== p1 && p2 !== p0 && s2.b && s2.b.type === 'quebrada' && /border Quebrada/.test(s2.info), s2.b);
  // (3) walking and the footprint
  ok('the footprint heights are identical on / off for Island and Quebrada (0 tiles touched)', JSON.stringify(fp0) === JSON.stringify(fp1) && JSON.stringify(fp0) === JSON.stringify(fp2), [fp0.length, fp1.length, fp2.length]);
  ok('blocks and regions are identical on / off (walking does not change)', s0.blk === s1.blk && s0.blk === s2.blk && s0.reg === s1.reg && s0.reg === s2.reg, [s0.blk, s1.blk, s2.blk, s0.reg, s1.reg, s2.reg]);
  await setB('off'); const p3 = await pix(); ok('back to Off: the identical pixels of the start', p3 === p0);
  // (4) the camera side follows the base yaw
  await setB('quebrada'); const hC6 = await HH(); const yaw6 = await ev(() => window.__evo.S().stageBorder.yaw);
  await ev(() => { const b = document.querySelector('#presets button[data-id=oblique]'); b.click(); }); await idle(); const hC3 = await HH(); const yaw3 = await ev(() => window.__evo.S().stageBorder.yaw);
  ok(`the base yaw is the camera's: Cam 6 ${yaw6}, Cam 3 ${yaw3}; the border is rebuilt on the preset change and the two shapes differ`, yaw6 === 180 && yaw3 === 0 && hC6 !== hC3, { yaw6, yaw3 });
  await ev(() => { document.querySelector('#presets button[data-id=stage]').click(); }); await idle(); const hC6b = await HH(); ok('Cam 6 again: the same shape as before (the rebuild is deterministic)', hC6b === hC6);
  await ev(() => { window.EVO.borderTest = { ignoreYaw: true }; window.__evo.redraw(); document.querySelector('#stageBorder').dispatchEvent(new Event('change')); }); await idle(); const hMut = await HH(); await ev(() => { window.EVO.borderTest = undefined; });
  ok('MUTATION ignoreYaw (the camera side always +y): at Cam 6 the shape equals the one of Cam 3 and the yaw check FAILS', hMut === hC3 && hMut !== hC6, { hMut, hC3, hC6 });
  // (5) the unit
  await a.slider('tilesPerH', 3); await idle(); const u = await ev(() => ({ tph: window.__evo.S().stageBorder.tilesPerH, terH: window.__evo.P.terH })); ok(`a new tilesPerH rebuilds the border (tilesPerH ${u.tph}, terH ${u.terH})`, u.tph === 3 && u.terH === 6, u);
  await a.slider('tilesPerH', 2); await idle();
  // (6) the manifest
  const m = await ev(() => { const e = window.__evo, b1 = e.viewerBlock().stage; e.st.stage.border = 'off'; const b2 = e.viewerBlock().stage; e.st.stage.border = 'island'; e.applyViewerBlock({ mode: 'stage', stage: { border: 'quebrada' } }); const l1 = e.st.stage.border; e.applyViewerBlock({ mode: 'stage', stage: {} }); const l2 = e.st.stage.border; e.applyViewerBlock({ mode: 'stage', stage: { border: 'nonsense' } }); return { w1: b1.border, w2: 'border' in b2, l1, l2, l3: e.st.stage.border }; });
  ok('manifest: viewer.stage.border is written when not Off, not written when Off; loaded: a value is kept, absent = off, an unknown one = off', m.w1 === 'quebrada' && m.w2 === false && m.l1 === 'quebrada' && m.l2 === 'off' && m.l3 === 'off', m);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
