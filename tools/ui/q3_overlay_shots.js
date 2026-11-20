/* PR Q3: the debug overlay "Platforms (debug)" in r21 (Default 3) and r79 (Balanced 5), Cam 6, k4, switch off / on; writes <out>/<place>_<off|on>.png and the platform counts of the window.   NODE_PATH=$(npm root -g) node tools/ui/q3_overlay_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2]; if (!out) { console.error('usage: q3_overlay_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
(async () => {
  const a = await Q.begin(open), data = {}; await a.page.click('#presets button[data-id="stage"]'); await a.idle();
  for (const key of ['r21', 'r79']) { const info = await Q.setupPlace(a, key); await Q.heroAt(a, info.ks[1]);
    for (const m of [false, true]) { await a.ev((m) => { const c = document.querySelector('#t-stagePlatDebug'); if (c.checked !== m) { c.checked = m; c.dispatchEvent(new Event('change')); } }, m); await a.idle(); await a.idle(); await Q.heroAt(a, info.ks[1]);
      await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_${m ? 'on' : 'off'}.png`) });
      if (m) { data[key] = await a.ev(() => { const S = window.__evo.S(), d = S.platDebug; return d ? { counts: d.counts, rooms: [...d.rooms.keys()] } : null; }); console.log(key, JSON.stringify(data[key])); } } }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
