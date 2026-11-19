/* PR Q1: growth of the destination terrace (px per H) from k0 to k8 in the places r21 (Default 3), r16 (Default 9), r79 (Balanced 5), Cam 6, with the dolly OFF and ON (gain 0.15 [R], the new default of the window examples). Writes <out>/raw/<place>_<off|on>_k<i>.png and <out>/data.json.
     NODE_PATH=$(npm root -g) node tools/ui/q1_dolly_sheet.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2]; if (!out) { console.error('usage: q1_dolly_sheet.js <outDir>'); process.exit(2); } fs.mkdirSync(path.join(out, 'raw'), { recursive: true });
(async () => {
  const a = await Q.begin(open), data = {};
  await a.page.click('#presets button[data-id="stage"]'); await a.idle();
  for (const key of ['r21', 'r16_9', 'r79']) {
    const info = await Q.setupPlace(a, key); data[key] = { T: info.T, ks: info.ks, window: info.ids, rows: {} };
    for (const mode of ['off', 'on']) {
      await a.ev((m) => { const st = window.__evo.st.stage; st.dolly = m; st.dollyGain = 0.15; }, mode); const rows = [];
      for (const [q, k] of info.ks.entries()) { await Q.heroAt(a, k); rows.push(await Q.measure(a)); await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, 'raw', `${key}_${mode}_k${[0, 4, 8][q]}.png`) }); }
      data[key].rows[mode] = rows; const g = (r) => (r[2].pxPerH && r[0].pxPerH ? ((r[2].pxPerH / r[0].pxPerH - 1) * 100).toFixed(0) + ' %' : 'n/a');
      console.log(key, 'T', info.T, 'dolly', mode, 'px/H k0/k4/k8', rows.map((r) => r.pxPerH).join(' / '), 'growth', g(rows), 'hero px/H', rows.map((r) => r.heroPxPerH).join(' / '));
    }
  }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); console.log('page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
