/* COMPOSITIONAL VERTICALITY in the viewer (mode 3, src/s3/vert.js behind the switch "Compositional verticality", off by default; docs/crystallizers/03-stage/research/octopath2/stage_verticalidad_go.md):
   (1) the control exists, is a main control of mode 3 only, is greyed in a legacy example and enabled in a window example, off at the start;
   (2) OFF = the viewer of today: S has no S.vert and switching it on and off again gives the SAME canvas as the first time (hash);
   (3) ON in Cam 7 on perfil_m1 (yaw 0, opposite to the room's yaw 180) re-heights the room (340 tiles) and the canvas changes; the topology hash (block, void, region, room map, walking graph, stairs) is identical on / off; in Cam 6 the same room is already monotone (nothing to change);
   (4) a conflict is reported, not forced: the window with stairs (the legacy / dac_stage windows) say it in S.vert; (5) the state ends with the window session.
     NODE_PATH=$(npm root -g) node tools/ui/test_vert_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const vert = async (on) => { await ev((on) => { const c = document.querySelector('#t-stageVert'); if (c.checked !== on) c.click(); }, on); await idle(); await idle(); };
  const cam = async (c) => { await page.click(`#presets button[data-id="${c}"]`); await idle(); await idle(); };
  const topo = () => ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), P = e.P; let h = 0; const mix = (x) => { h = (Math.imul(h ^ (x | 0), 0x01000193) + 0x9e3779b9) | 0; }; const nb = E.s3.walkGraph(S, P); for (let i = 0; i < S.n; i++) { mix(S.block[i]); mix(S.void ? S.void[i] : 0); mix(S.region ? S.region[i] : 0); mix(S.roomMap ? S.roomMap[i] : 0); for (const j of nb(i)) mix(j); } for (const s of S.stairs || []) for (const t of (s.bottom || []).concat(s.top || [])) mix(t); return (h >>> 0).toString(16); });
  await ev(() => window.__evo.setMode('stage')); await idle();
  await clickEx('x4_stage');
  const c1 = await ev(() => ({ d: document.querySelector('#t-stageVert') && document.querySelector('#t-stageVert').disabled, main: window.EVO.modes.MODES.filter((x) => x.main.includes('stageVert')).map((x) => x.id) }));
  ok('the control exists, is a main control of mode 3 only and is greyed in a legacy example (no window)', c1.d === true && c1.main.join() === 'stage', c1);
  await clickEx('perfil_m1');
  const c2 = await ev(() => ({ d: document.querySelector('#t-stageVert').disabled, chk: document.querySelector('#t-stageVert').checked, st: window.__evo.st.stage.vert, vi: window.__evo.S().vert }));
  ok('in a window example the switch is enabled, off, and S has no S.vert (the module is never called)', !c2.d && !c2.chk && c2.st === 'off' && c2.vi === undefined, c2);
  // (2) off / on / off in Cam 7 and Cam 6
  await cam('classic'); const h0 = sha(await a.canvas()), t0 = await topo();
  await vert(true); const info7 = await ev(() => window.__evo.S().vert), h1 = sha(await a.canvas()), t1 = await topo();
  ok(`Cam 7 (yaw 0), perfil_m1 ON: the room is re-heighted (${info7 && info7.changed} tiles of ${info7 && info7.levels} levels), the canvas changes (${h0} -> ${h1}) and the topology hash is identical (${t0} = ${t1})`, info7 && info7.changed > 0 && !info7.conflict && h0 !== h1 && t0 === t1, { info7: info7 && { c: info7.changed, conf: info7.conflict } });
  await vert(false); const h2 = sha(await a.canvas()); ok(`switching it OFF again gives the same canvas as the first time (${h0} = ${h2}) and S.vert is gone`, h0 === h2 && (await ev(() => window.__evo.S().vert)) === undefined, { h0, h2 });
  await cam('stage'); const g0 = sha(await a.canvas()); await vert(true); const info6 = await ev(() => window.__evo.S().vert), g1 = sha(await a.canvas());
  ok(`Cam 6 (the room's own yaw 180), perfil_m1 ON: the room was already monotone (changed ${info6 && info6.changed}), the canvas is the same (${g0} = ${g1})`, info6 && info6.changed === 0 && !info6.conflict && g0 === g1, info6 && { c: info6.changed });
  await vert(false);
  // (4) conflict
  await clickEx('dac_stage'); await vert(true); const ic = await ev(() => window.__evo.S().vert);
  ok(`a window with stairs reports the conflict and changes nothing: "${ic && ic.conflict}" (changed ${ic && ic.changed})`, ic && !!ic.conflict && ic.changed === 0, ic && { conf: ic.conflict });
  // (5) the end of the session
  await ev(() => window.__evo.setMode('terrain')); await idle();
  const end = await ev(() => ({ s: window.__evo.st.stage.vert, chk: document.querySelector('#t-stageVert').checked })); ok('the state ends with the window session (leaving to mode 1): off, checkbox clear', end.s === 'off' && !end.chk, end);
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
