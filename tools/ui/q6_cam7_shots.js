/* PR Q6: Cam 6 next to Cam 7 (depth scale 0.5, following the hero) at r21 (Default 3), r16 (Default 9), r79 (Balanced 5), k4; and one sheet with the depth scales 0.4 / 0.5 / 0.6 per place. Writes <out>/<place>_cam6_k4.png, <place>_cam7_d<scale>_k4.png and data.json (where the hero falls on the panel in Cam 7: it must be the centre).
     NODE_PATH=$(npm root -g) node tools/ui/q6_cam7_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2]; if (!out) { console.error('usage: q6_cam7_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
(async () => {
  const a = await Q.begin(open), data = {};
  for (const key of ['r21', 'r16_9', 'r79']) { await a.page.click('#presets button[data-id="stage"]'); await a.idle(); const info = await Q.setupPlace(a, key); await Q.heroAt(a, info.ks[1]); data[key] = { ks: info.ks, cam7: {} };
    await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_cam6_k4.png`) });
    await a.page.click('#presets button[data-id="classic"]'); await a.idle(); await a.idle();
    for (const d of [0.4, 0.5, 0.6]) { await Q.setCtl(a, 'stageCam7Depth', d); await Q.heroAt(a, info.ks[1]);
      data[key].cam7[d] = await a.ev(() => { const e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), c = window.EVO.makeCam(S, e.P, e.view(), cv.clientWidth, cv.clientHeight), hx = e.st.hero.x - S.ox, hy = e.st.hero.y - S.oy, ti = Math.floor(hy) * S.W + Math.floor(hx), p = c.p(hx, hy, S.levelH[S.fine[ti]]); return { heroOnPanel: [Math.round(p[0]), Math.round(p[1])], panel: [cv.clientWidth, cv.clientHeight], depthScale: e.view().depthScale, zoom: +e.st.zoom.toFixed(3) }; });
      await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_cam7_d${d}_k4.png`) }); }
    // the old Cam 7 (scale 1) for reference
    await Q.setCtl(a, 'stageCam7Depth', 1); await Q.heroAt(a, info.ks[1]); await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_cam7_d1_k4.png`) });
    console.log(key, JSON.stringify(Object.fromEntries(Object.entries(data[key].cam7).map(([d, v]) => [d, v.heroOnPanel])))); }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
