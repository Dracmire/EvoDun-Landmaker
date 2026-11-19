/* PR Q4: (1) "Only rooms in front" off / on at r21 (Default 3), r16 (Default 9), r79 (Balanced 5), Cam 6, k0 / k4 / k8; (3) the DAC cut (border Quebrada + props off) at k4, one shot per place. Writes <out>/<place>_<off|on>_k<i>.png, <place>_dac_cut_k4.png and data.json (the rooms hidden per case).
     NODE_PATH=$(npm root -g) node tools/ui/q4_front_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2]; if (!out) { console.error('usage: q4_front_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
const tog = (a, id, v) => a.ev(({ id, v }) => { const c = document.querySelector('#' + id); if (c && c.checked !== v) { c.checked = v; c.dispatchEvent(new Event('change')); } }, { id, v });
(async () => {
  const a = await Q.begin(open), data = {}; await a.page.click('#presets button[data-id="stage"]'); await a.idle();
  for (const key of ['r21', 'r16_9', 'r79']) { const info = await Q.setupPlace(a, key); data[key] = { T: info.T, ks: info.ks, window: info.ids, cases: {} };
    for (const m of [false, true]) { await tog(a, 't-stageOnlyFront', m); await a.idle(); await a.idle();
      for (const [q, k] of info.ks.entries()) { await Q.heroAt(a, k); const i = [0, 4, 8][q]; await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_${m ? 'on' : 'off'}_k${i}.png`) });
        data[key].cases[`${m ? 'on' : 'off'}_k${i}`] = await a.ev(() => { const S = window.__evo.S(), f = S.frontHidden; return f ? { hidden: f.hidden, tiles: f.tiles } : null; }); } }
    await tog(a, 't-stageOnlyFront', false); await a.idle();
    // DAC cut: Quebrada border + props off, k4
    await Q.setCtl(a, 'stageBorder', 'quebrada'); await a.ev(() => { const c = document.querySelector('#t-stageProps'); if (c && c.checked) { c.checked = false; c.dispatchEvent(new Event('change')); } }); await a.idle(); await a.idle(); await Q.heroAt(a, info.ks[1]);
    await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_dac_cut_k4.png`) });
    await Q.setCtl(a, 'stageBorder', 'off'); await a.ev(() => { const c = document.querySelector('#t-stageProps'); if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change')); } }); await a.idle();
    console.log(key, JSON.stringify(data[key].cases.on_k4)); }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
