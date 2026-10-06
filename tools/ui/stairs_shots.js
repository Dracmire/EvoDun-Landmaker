/* Screenshots of the carved stairs, Box / A / B side by side: one stair facing the camera and one with its back to
   it in Oblique 50 and Iso 45, a context view with the stair marks, and a stair that B loses (if any).
     NODE_PATH=$(npm root -g) node tools/ui/stairs_shots.js <outDir> [--set tread=1,stairW=1] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: stairs_shots.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 760 });
  const setArg = process.argv.indexOf('--set') > 0 ? process.argv[process.argv.indexOf('--set') + 1] : '';
  const stage = a.page.locator('#stage');
  const shot = async (name) => { await stage.screenshot({ path: path.join(out, name + '.png') }); console.log('wrote', name); };
  const info = async () => (await a.page.$eval('#info', (e) => e.innerText)).split(' · ').slice(-4).join(' · ');
  /* stairs of the current slice with the facing of their wall for the current view: rny > 0 faces the camera */
  const stairs = () => a.page.evaluate(() => {
    const ev = window.__evo, S = ev.S(), cv = document.querySelector('#stage canvas'), cam = window.EVO.makeCam(S, ev.P, ev.view(), cv.clientWidth, cv.clientHeight);
    return S.stairs.map((st, i) => { const t = st.top[0], n = cam.nrm(-st.dir[0], -st.dir[1]); return { i, cols: st.cols.length, treads: st.steps.length, mode: st.mode, rny: n[1], x: (t % S.W) + 0.5, y: ((t / S.W) | 0) + 0.5, h: S.levelH[S.fine[t]] }; });
  });
  /* zoom that gives `px` screen pixels per tile along a tile edge at the current preset */
  const zoomFor = (px) => a.page.evaluate((px) => { const ev = window.__evo, cv = document.querySelector('#stage canvas'), v = ev.view(); v.zoom = 1; v.panX = 0; v.panY = 0; return px / window.EVO.makeCam(ev.S(), ev.P, v, cv.clientWidth, cv.clientHeight).sc; }, px);
  const pxTile = () => a.page.evaluate(() => { const ev = window.__evo, cv = document.querySelector('#stage canvas'), c = window.EVO.makeCam(ev.S(), ev.P, ev.view(), cv.clientWidth, cv.clientHeight); return Math.round(c.sc * 10) / 10; });
  const PX = 28;
  const pick = (list, front) => list.filter((s) => (front ? s.rny > 0.5 : s.rny < -0.5)).sort((p, q) => q.treads - p.treads || q.cols - p.cols || (p.mode === 'cut' ? -1 : 1) - (q.mode === 'cut' ? -1 : 1) || p.i - q.i)[0];
  for (const kv of setArg.split(',').filter(Boolean)) { const [k, v] = kv.split('='); await a.slider(k, +v); await a.idle(); }
  await a.load('maps'); await a.zone(6);
  console.log('zone 6:', await info());
  for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) {
    await a.preset(pid);
    const list = await stairs();
    for (const [facing, front] of [['front', true], ['back', false]]) {
      const s = pick(list, front); if (!s) { console.log('no stair', facing, pname); continue; }
      await a.focus(s.x, s.y, s.h, await zoomFor(PX)); console.log(`${facing} ${pname}: stair #${s.i} (${s.mode}, ${s.cols} columns, ${s.treads} treads), ${await pxTile()} px per tile`);
      await shot(`stair_${facing}_${pname}`);
    }
  }
  await a.page.click('#t-passes');                                  // stair marks on
  for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) { await a.preset(pid); await shot(`context_zone6_${pname}`); }
  await a.page.click('#t-passes');
  await a.load('maps_noring'); await a.zone(1); console.log('zone 1:', await info());
  const lost = await a.page.evaluate(() => { const ev = window.__evo, S = ev.S(); const A = window.EVO.stairSurvival(S, ev.P, 'A'), B = window.EVO.stairSurvival(S, ev.P, 'B'); return { A: A.lostIdx, B: B.lostIdx, info: S.stairs.map((st, i) => { const t = st.top[0]; return { i, x: (t % S.W) + 0.5, y: ((t / S.W) | 0) + 0.5, h: S.levelH[S.fine[t]] }; }) }; });
  console.log('lost in A:', lost.A, ' lost in B:', lost.B);
  if (lost.B.length) {
    const s = lost.info[lost.B[0]];
    for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) { await a.preset(pid); await a.focus(s.x, s.y, s.h, await zoomFor(PX)); await shot(`lost_in_B_${pname}`); }
  }
  console.log('errors:', a.errs); await a.browser.close();
  process.exit(a.errs.length ? 1 : 0);
})();
