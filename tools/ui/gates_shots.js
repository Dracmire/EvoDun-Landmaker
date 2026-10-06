/* Screenshots of gates: a long gate with several stairs and a gate whose stairs could not be carved (discarded), Box / A / B,
   Oblique 50 and Iso 45, at least 20 px per tile.
     NODE_PATH=$(npm root -g) node tools/ui/gates_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: gates_shots.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 760 }), stage = a.page.locator('#stage');
  const shot = async (name) => { await stage.screenshot({ path: path.join(out, name + '.png') }); console.log('wrote', name); };
  const setArg = process.argv.indexOf('--set') > 0 ? process.argv[process.argv.indexOf('--set') + 1] : '';
  await a.load('maps'); await a.zone(6);
  for (const kv of setArg.split(',').filter(Boolean)) { const [k, v] = kv.split('='); await a.slider(k, +v); await a.idle(); }
  const scan = () => a.page.evaluate(() => {
    const S = window.__evo.S(), W = S.W, per = S.gates.map(() => 0);
    for (const st of S.stairs) per[st.site.gate]++;
    return S.gates.map((g, i) => { let sx = 0, sy = 0; for (const t of g.tiles) { sx += (t.a % W) + 0.5; sy += ((t.a / W) | 0) + 0.5; } const t0 = g.tiles[0].a; return { i, size: g.size, inSlice: g.tiles.length, stairs: per[i], x: sx / g.tiles.length, y: sy / g.tiles.length, h: S.levelH[S.fine[t0]] }; });
  });
  const zoomFor = (px) => a.page.evaluate((px) => { const ev = window.__evo, cv = document.querySelector('#stage canvas'), v = ev.view(); v.zoom = 1; v.panX = 0; v.panY = 0; return px / window.EVO.makeCam(ev.S(), ev.P, v, cv.clientWidth, cv.clientHeight).sc; }, px);
  const long = (await scan()).filter((g) => g.stairs >= 2).sort((p, q) => q.stairs - p.stairs)[0];
  console.log('zone 6, long gate:', JSON.stringify(long));
  for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) { await a.preset(pid); await a.focus(long.x, long.y, long.h, await zoomFor(22)); await shot(`long_gate_${pname}`); }
  // a discarded gate: default parameters, zone 9 (a gate whose stair does not fit as cut or as build-up)
  for (const [k, v] of [['passGap', 8], ['stairW', 2], ['tread', 2]]) { await a.slider(k, v); await a.idle(); }
  await a.zone(9);
  const dropped = (await scan()).filter((g) => g.stairs === 0)[0];
  console.log('zone 9, discarded gate:', JSON.stringify(dropped), (await a.page.$eval('#info', (e) => e.innerText)).split(' · ').filter((t) => /gates/.test(t)).join(''));
  for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) { await a.preset(pid); await a.focus(dropped.x, dropped.y, dropped.h, await zoomFor(22)); await shot(`discarded_gate_${pname}`); }
  console.log('errors:', a.errs); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})();
