/* GOLDEN SHOT 2 (PR M4c-2) in the viewer: the example `golden_path` of mode 3 (the frame of the capture 17.01: a winding path between masses of foliage, no goal), made with the SAME fields as golden shot 1.
   (1) it opens with ONE click already framed (the hero's feet at heroScreen) and with its layers on (`objectsOn`); (2) the ribbons are painted and the pieces drawn, the ones beyond the map included; no landmark, no facade (nothing of the door shot);
   (3) at the panel of the shot (1280 x 645) the canvas has the hash of the committed capture (sensitive to the machine: Chromium / fonts); (4) the window session restores EVERYTHING on leaving; a mode 1 example afterwards has the canvas of a fresh session.
     NODE_PATH=$(npm root -g) node tools/ui/test_golden_path_ui.js */
const crypto = require('crypto'), fs = require('fs'), path = require('path'), { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  await ev(() => window.__evo.setMode('terrain')); await idle(); await idle(); const fresh = sha(await a.canvas());
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('golden_path');
  const s0 = await ev(() => { const e = window.__evo, st = e.st, E = window.EVO, S = e.S(), w = document.querySelector('#stage canvas').clientWidth, h = st.persH, cam = E.makeCam(S, e.P, e.view(), w, h), x = st.hero.x - S.ox, y = st.hero.y - S.oy, p = cam.p(x, y, E.stage.feetH(S, E.stage.cellOf(S, x, y)));
    return { win: st.stageRooms, hero: st.hero, hs: st.stage.heroScreen, yaw: e.view().yaw, orient: st.stage.orient, planes: st.stage.planes, props: st.stage.props, on: document.querySelector('#t-stageObjects').checked, frame: !!e.O.frame, fx: p[0] / w, fy: p[1] / h, follow: st.follow, src: st.pack, kinds: [...new Set(st.stage.objectList.map((o) => o.kind))].sort(), objs: st.stage.objectList.length, ribbons: st.stage.ribbonList.length }; });
  ok(`one click: source forest_b, window [valley] alone, the hero in the valley, yaw 0, no orientation / planes / props by rule; ${s0.ribbons} ribbons and ${s0.objs} pieces declared`, s0.src === 'forest_b' && s0.win.join() === '1' && s0.yaw === 0 && s0.orient === 'off' && s0.planes === 'off' && s0.props === 'off' && s0.ribbons >= 3 && s0.objs >= 20, s0);
  ok(`it opens framed: the feet of the hero at heroScreen (${s0.fx.toFixed(4)}, ${s0.fy.toFixed(4)}) = [${s0.hs}], the tracking on`, Math.abs(s0.fx - s0.hs[0]) < 1e-6 && Math.abs(s0.fy - s0.hs[1]) < 1e-6 && s0.follow, s0);
  ok('it opens with its layers ON (`objectsOn`)', s0.on && s0.frame, s0);
  ok(`the SAME fields as golden shot 1 and no piece of the door shot: kinds ${s0.kinds.join(', ')} (no landmark, no lamp)`, !s0.kinds.includes('landmark') && !s0.kinds.includes('lamp') && s0.kinds.every((k) => ['shrub', 'pillar'].includes(k)), s0.kinds);
  const s1 = await ev(() => { const e = window.__evo, O = e.O; return { rib: O.frame.stats.map((q) => [q.drawn, q.tiles]), drawn: O.objects.stats.filter((q) => q.drawn).length, total: O.objects.stats.length, outside: O.objects.stats.filter((q) => q.outside).map((q) => q.drawn) }; });
  ok(`the ribbons are painted (${s1.rib.map((q) => q.join(' of ')).join(' / ')} tiles) and ${s1.drawn} of ${s1.total} pieces are drawn; the ${s1.outside.length} pieces beyond the map are drawn`, s1.rib.every((q) => q[0] > 0) && s1.drawn === s1.total && s1.outside.length >= 8 && s1.outside.every(Boolean), s1);
  { await ev(() => { const s = document.querySelector('#stage'); s.style.cssText = 'width:1280px;height:645px;flex:none;'; window.dispatchEvent(new Event('resize')); }); await idle(); await ev(() => window.__evo.redraw()); await idle(); await idle();
    const live = sha(await a.canvas()), file = sha(fs.readFileSync(path.join(__dirname, '../../docs/crystallizers/03-stage/shots/m4c/golden_path_viewer.png')));
    ok(`the canvas of the example at 1280 x 645 has the hash of docs/.../m4c/golden_path_viewer.png (${live} = ${file}; sensitive to the machine)`, live === file, [live, file]);
    await ev(() => { document.querySelector('#stage').style.cssText = ''; window.dispatchEvent(new Event('resize')); }); await idle(); await ev(() => window.__evo.redraw()); await idle(); }
  await clickEx('x4_stage');
  const s2 = await ev(() => { const e = window.__evo, st = e.st; return { ribbons: st.stage.ribbonList.length, objs: st.stage.objectList.length, vols: st.stage.volumeList.length, hero: st.hero, hs: st.stage.heroScreen, hf: st.stage.heroFrac, on: st.stage.objects, chk: document.querySelector('#t-stageObjects').checked, frame: !!e.O.frame, objects: !!e.O.objects, win: st.win }; });
  ok('leaving to a legacy example restores everything: no ribbon, no objects, the switch off, no hero, no heroScreen, heroFrac 0.14, no window session', s2.ribbons === 0 && s2.objs === 0 && s2.vols === 0 && s2.hero === null && s2.hs === null && s2.hf === 0.14 && s2.on === 'off' && !s2.chk && !s2.frame && !s2.objects && !s2.win, s2);
  await clickEx('golden_path'); await clickEx('dac_stage');
  const s3 = await ev(() => { const e = window.__evo, st = e.st; return { on: st.stage.objects, chk: document.querySelector('#t-stageObjects').checked, ribbons: st.stage.ribbonList.length, hs: st.stage.heroScreen }; });
  ok('another window example after it (dac_stage, no `objectsOn`) starts with the switch OFF, no ribbon, no heroScreen', s3.on === 'off' && !s3.chk && s3.ribbons === 0 && s3.hs === null, s3);
  await ev(() => window.__evo.setMode('terrain')); await idle(); await idle();
  ok('the mode 1 default after the golden shot has the canvas of a fresh session (nothing leaks)', sha(await a.canvas()) === fresh);
  ok('no page errors', a.errs.length === 0, a.errs.slice(0, 2));
  console.log(`${pass} passed, ${fail} failed`); await a.browser.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
