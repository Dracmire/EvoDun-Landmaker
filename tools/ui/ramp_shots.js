/* Captures of one ramp from four directions (yaw 0/90/180/270 on top of the preset) in Oblique 50 and Iso 45, Box | A | B,
   at least 20 px per tile.
     NODE_PATH=$(npm root -g) node tools/ui/ramp_shots.js <outDir> [--mode cut|fill] [--set stairW=5,rampDepth=3] [--site <tile>] [--px 30] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: ramp_shots.js <outDir>'); process.exit(2); }
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 760 }), stage = a.page.locator('#stage'), PX = +arg('--px', 28), wantMode = arg('--mode', 'cut');
  for (const kv of arg('--set', '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); await a.slider(k, +v); await a.idle(); }
  await a.load('maps'); await a.zone(6);
  const list = await a.page.evaluate(() => { const S = window.__evo.S(); return S.stairs.map((r, i) => { const t = r.top[0]; return { i, site: r.site.a, mode: r.mode, cols: r.cols.length, len: r.ramp.len, gap: Math.abs(r.ramp.h1 - r.ramp.h0), x: (t % S.W) + 0.5, y: ((t / S.W) | 0) + 0.5, h: (r.ramp.h0 + r.ramp.h1) / 2 }; }); });
  const siteArg = arg('--site', ''), r = siteArg !== '' ? list.find((s) => s.site === +siteArg) : list.filter((s) => s.mode === wantMode).sort((p, q) => q.gap - p.gap || q.cols - p.cols || p.i - q.i)[0];
  if (!r) { console.log('no ramp at that site in this build'); process.exit(3); }
  console.log('ramp', JSON.stringify(r), 'site tile', r.site);
  const zoomFor = (px) => a.page.evaluate((px) => { const ev = window.__evo, cv = document.querySelector('#stage canvas'), v = ev.view(); v.zoom = 1; v.panX = 0; v.panY = 0; return px / window.EVO.makeCam(ev.S(), ev.P, v, cv.clientWidth, cv.clientHeight).sc; }, px);
  for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) {
    await a.preset(pid);
    for (const yaw of [0, 90, 180, 270]) {
      await a.page.evaluate((yaw) => { window.__evo.st.yawOff = yaw; window.__evo.draw(); }, yaw); await a.idle();
      await a.focus(r.x, r.y, r.h, await zoomFor(PX));
      await stage.screenshot({ path: path.join(out, `ramp_${wantMode}_${pname}_${yaw}.png`) }); console.log('wrote', `ramp_${wantMode}_${pname}_${yaw}`);
    }
    await a.page.evaluate(() => { window.__evo.st.yawOff = 0; });
  }
  console.log('errors:', a.errs); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
