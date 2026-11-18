/* CAM 8 (Stage compressed, `stagez`) in the viewer: the button is offered where Cam 6 is (modes 1-4) and not in the modes that do not offer Cam 6; selecting it sets the preset and the view's zScale = E.CAM8_ZSCALE
   (0.5), Cam 6 has none; the hero tracking of mode 3 works as in Cam 6 (the feet at the example's heroScreen to 1e-6 and after a resize); picking a tile at the pixel it is drawn at resolves to that tile (the same rate as
   Cam 6, measured on the walkable tiles of the window); going back to Cam 6 gives the canvas of before (nothing leaks); the manifest keeps `camera: stagez`.
     NODE_PATH=$(npm root -g) node tools/ui/test_cam8_ui.js */
const crypto = require('crypto'), { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
    const vis = (id) => ev((i) => { const b = [...document.querySelectorAll('#presets button')].find((e) => e.dataset.id === i); return b ? { text: b.textContent.trim(), hidden: !!b.hidden || b.offsetParent === null } : null; }, id);
  for (const [m, offered] of [['terrain', true], ['rooms', true], ['stage', true], ['curves', true], ['floors', false], ['macroform', false]]) {
    await ev((i) => window.__evo.setMode(i), m); await idle(); const v6 = await vis('stage'), v8 = await vis('stagez');
    ok(`mode ${m}: Cam 8 is ${offered ? 'offered' : 'not offered'} exactly where Cam 6 is (Cam 6 ${v6 && !v6.hidden ? 'shown' : 'hidden'}, Cam 8 ${v8 && !v8.hidden ? 'shown' : 'hidden'})`, !!v8 && v8.text === 'Cam 8' && (!v8.hidden) === offered && (!v6.hidden) === (offered && m !== 'floors' && m !== 'macroform'), { v6, v8 });
  }
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="golden_door"]'); await idle(); await idle();
  const feetAt = () => ev(() => { const e = window.__evo, st = e.st, E = window.EVO, S = e.S(), w = document.querySelector('#stage canvas').clientWidth, h = st.persH, v = e.view(), cam = E.makeCam(S, e.P, v, w, h), x = st.hero.x - S.ox, y = st.hero.y - S.oy, i = E.stage.cellOf(S, x, y), p = cam.p(x, y, E.stage.feetH(S, i)); return { fx: p[0] / w, fy: p[1] / h, w, h, preset: st.preset, zs: v.zScale, kind: v.kind, follow: st.follow }; });
  const f6 = await feetAt(); const c6 = sha(await a.canvas());
  ok(`Cam 6 (the example's camera): no zScale in the view, the feet at heroScreen (${f6.fx.toFixed(4)}, ${f6.fy.toFixed(4)})`, f6.preset === 'stage' && f6.zs === undefined && Math.abs(f6.fx - 0.592) < 1e-6 && Math.abs(f6.fy - 0.768) < 1e-6, f6);
  await page.click('#presets button[data-id="stagez"]'); await idle(); await idle();
  const f8 = await feetAt(); const c8 = sha(await a.canvas());
  ok(`Cam 8: preset stagez, perspective, view.zScale = E.CAM8_ZSCALE (${f8.zs}), the tracking on`, f8.preset === 'stagez' && f8.kind === 'persp' && f8.zs === 0.5 && f8.follow, f8);
  ok(`Cam 8: the hero tracking works as in Cam 6: the feet at heroScreen (${f8.fx.toFixed(5)}, ${f8.fy.toFixed(5)})`, Math.abs(f8.fx - 0.592) < 1e-6 && Math.abs(f8.fy - 0.768) < 1e-6, f8);
  ok('Cam 8 draws something different from Cam 6 (the depth is compressed)', c8 !== c6);
  await ev(() => { const s = document.querySelector('#stage'); s.style.cssText = 'width:1280px;height:644px;flex:none;'; window.dispatchEvent(new Event('resize')); }); await idle(); await ev(() => window.__evo.redraw()); await idle();
  { const f = await feetAt(); ok(`Cam 8 after a resize to ${f.w} x ${f.h}: the feet are still at heroScreen`, f.w === 1280 && Math.abs(f.fx - 0.592) < 1e-6 && Math.abs(f.fy - 0.768) < 1e-6, f); }
  await ev(() => { document.querySelector('#stage').style.cssText = ''; window.dispatchEvent(new Event('resize')); }); await idle(); await ev(() => window.__evo.redraw()); await idle();
  // picking: the tile cap centre of every walkable tile of the window, projected and picked back
  const rate = (id) => ev(async (id) => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.st; const w = document.querySelector('#stage canvas').clientWidth, h = st.persH, v = e.view(), cam = E.makeCam(S, e.P, v, w, h); let n = 0, hit = 0;
    for (let i = 0; i < S.n; i += 3) { if (!E.stage.walkable(S, i)) continue; const x = (i % S.W) + 0.5, y = ((i / S.W) | 0) + 0.5, p = cam.p(x, y, E.stage.feetH(S, i)); if (p[0] < 2 || p[0] > w - 2 || p[1] < 2 || p[1] > h - 2) continue; const r = E.pickTile(S, e.P, st.tech, v, w, h, p[0], p[1]); n++; if (r && r.tile === i) hit++; } return { n, hit, rate: n ? hit / n : 0 }; }, id);
  const p8 = await rate('stagez'); await page.click('#presets button[data-id="stage"]'); await idle(); const p6 = await rate('stage');
  ok(`pick: tiles picked back at the pixel they are drawn at: Cam 8 ${(p8.rate * 100).toFixed(1)} % of ${p8.n}, Cam 6 ${(p6.rate * 100).toFixed(1)} % of ${p6.n}`, p8.n > 20 && p8.rate >= p6.rate - 0.03 && p8.rate > 0.85, { p6, p8 });
  const back = sha(await a.canvas()); ok('back to Cam 6: the canvas of before (nothing leaks from Cam 8)', back === c6, [back, c6]);
  await page.click('#presets button[data-id="stagez"]'); await idle();
  { const man = await ev(() => { const e = window.__evo; try { return JSON.stringify(e.viewerBlock ? e.viewerBlock() : null); } catch (err) { return 'ERR ' + err.message; } }); ok('the viewer block of the manifest writes camera stagez while Cam 8 is on', /"camera":"stagez"/.test(man), man); }
  ok('no page errors', a.errs.length === 0, a.errs);
  console.log(`\n${pass} passed, ${fail} failed`); await a.browser.close(); process.exit(fail ? 1 : 0);
})();
