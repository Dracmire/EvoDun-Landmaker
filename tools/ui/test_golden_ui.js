/* GOLDEN SHOT 1 (PR M4c-1) in the viewer: the example `golden_door` of mode 3 (hand-placed layers: objects with wH / always, the ribbon).
   (1) it loads without page errors, declares its window / hero / heroFrac; (2) with "Stage objects" OFF there is no ribbon and no piece (O.frame, O.objects absent); ON: the ribbon is painted (visible tiles) and the pieces are drawn, the `always` piece is drawn with its base under the bottom edge;
   (3) the window session restores EVERYTHING on leaving: ribbonList, objectList, volumeList, hero, heroFrac; (4) a mode 1 example after the golden shot has the canvas of a fresh session (nothing leaks).
     NODE_PATH=$(npm root -g) node tools/ui/test_golden_ui.js */
const crypto = require('crypto'), { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  await ev(() => window.__evo.setMode('terrain')); await idle(); await idle(); const fresh = sha(await a.canvas());
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('golden_door');
  const s0 = await ev(() => { const e = window.__evo, st = e.st; return { win: st.stageRooms, hero: st.hero, hf: st.stage.heroFrac, yaw: e.view().yaw, orient: st.stage.orient, props: st.stage.props, ribbons: st.stage.ribbonList.length, objs: st.stage.objectList.length, on: document.querySelector('#t-stageObjects').checked, frame: !!e.O.frame, objects: !!e.O.objects, src: st.pack }; });
  ok('the example loads: window [valley, east slope] (k 1, 4), hero (49.5, 31.5), heroFrac 0.098, yaw 0, no orientation, no props by rule; 2 ribbons and 14 pieces declared', s0.win.join() === '1,4' && s0.hero.x === 49.5 && s0.hero.y === 31.5 && s0.hf === 0.098 && s0.yaw === 0 && s0.orient === 'off' && s0.props === 'off' && s0.ribbons === 2 && s0.objs === 14, s0);
  ok('with "Stage objects" OFF there is no ribbon and no piece (O.frame and O.objects absent)', !s0.on && !s0.frame && !s0.objects, s0);
  const h0 = sha(await a.canvas());
  await page.click('#t-stageObjects'); await idle();
  const s1 = await ev(() => { const e = window.__evo, O = e.O; return { frame: !!O.frame, stats: O.frame && O.frame.stats, drawn: O.objects && O.objects.stats.filter((q) => q.drawn).length, total: O.objects && O.objects.stats.length, always: O.objects && O.objects.stats.filter((q) => q.always || (e.st.stage.objectList.find((o) => o.x === q.x && o.y === q.y && o.always))).map((q) => ({ drawn: q.drawn, baseY: q.base[1], h: document.querySelector('#stage canvas').clientHeight })) }; });
  ok(`ON: the ribbon is painted (${s1.stats && s1.stats.map((q) => q.drawn + ' of ' + q.tiles).join(' / ')} tiles) and ${s1.drawn} of ${s1.total} pieces are drawn`, s1.frame && s1.stats.every((q) => q.drawn > 0 && q.drawn <= q.tiles) && s1.drawn >= 12, s1);
  ok('the `always` piece (the rock) is drawn (its base under the bottom edge at the panel of the shot is checked in tools/test_objects.js and tools/ui/m4c_golden.js: P cuts an edge)', s1.always.length === 1 && s1.always[0].drawn, s1.always);
  ok('switching the objects on changes the canvas, off again gives the canvas of before', sha(await a.canvas()) !== h0 && (await (async () => { await page.click('#t-stageObjects'); await idle(); return sha(await a.canvas()); })()) === h0);
  await page.click('#t-stageObjects'); await idle();
  // (3) the window session restores everything
  await clickEx('x4_stage');
  const s2 = await ev(() => { const e = window.__evo, st = e.st; return { ribbons: st.stage.ribbonList.length, objs: st.stage.objectList.length, vols: st.stage.volumeList.length, hero: st.hero, hf: st.stage.heroFrac, frame: !!e.O.frame, objects: !!e.O.objects, win: st.win }; });
  ok('leaving to a legacy example restores everything: no ribbon, no objects, no volumes, no hero, heroFrac 0.14, no window session', s2.ribbons === 0 && s2.objs === 0 && s2.vols === 0 && s2.hero === null && s2.hf === 0.14 && !s2.frame && !s2.objects && !s2.win, s2);
  await clickEx('golden_door'); await ev(() => window.__evo.setMode('terrain')); await idle(); await idle();
  const s3 = await ev(() => { const e = window.__evo, st = e.st; return { ribbons: st.stage.ribbonList.length, objs: st.stage.objectList.length, hf: st.stage.heroFrac, win: st.win, frame: !!e.O.frame }; });
  ok('leaving to another MODE restores the state too', s3.ribbons === 0 && s3.objs === 0 && s3.hf === 0.14 && !s3.win && !s3.frame, s3);
  ok('(4) the mode 1 default after the golden shot has the canvas of a fresh session (nothing leaks)', sha(await a.canvas()) === fresh, [fresh, sha(await a.canvas())]);
  ok('no page errors', a.errs.length === 0, a.errs.slice(0, 2));
  console.log(`${pass} passed, ${fail} failed`); await a.browser.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
