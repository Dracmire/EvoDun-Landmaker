/* PR Q2 step 1 (MEASURE FIRST, prompt_r3_go.md): what blocks the view at r21 / r16 with 7 and 9 terraces, treatment Up, k0 / k4 / k8, Cam 6: the share of the PANEL covered, by source, from the Box pick render (every pixel carries its tile; `pickWalls` on):
   (a) base terrain of the hero's room (a walkable tile of the hero's room: the terrain the lego raises), (b) planes (back wall, side columns, front: tiles whose level meta has `plane`), (c) terrain of other rooms (any other tile), (d1) volumes (meta `vol`), and (d2) billboards = the pixels that change when the props and the objects are switched off (the hero stays). The rest is background / unclassified.
     NODE_PATH=$(npm root -g) node tools/ui/q2_cover.js <out.json> [--shots <dir>] [--m <list>] */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2], si = process.argv.indexOf('--shots'), SHOTS = si > 0 ? process.argv[si + 1] : null; if (!out) { console.error('usage: q2_cover.js <out.json> [--shots <dir>]'); process.exit(2); } if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const CASES = [['r21', 7], ['r21', 9], ['r16_9', 7], ['r16_9', 9]];
const COVER = `(() => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = st.persH || cv.clientHeight, v = e.view(), n = S.n, zm = E.stage.zoneMap(S), rid = st.stageRooms[0];
  const D = E.pickBuffer(S, P, v, w, h, { pickWalls: true }).data, c = { base: 0, planes: 0, other: 0, volumes: 0, unclassified: 0 }, kinds = {};
  for (let q = 0; q < w * h; q++) { if (D[4 * q + 3] !== 255) { c.unclassified++; continue; } const code = (D[4 * q] << 16) | (D[4 * q + 1] << 8) | D[4 * q + 2], k = code >> 20, t = code & 0xfffff; kinds[k] = (kinds[k] || 0) + 1; if (k < 1 || t >= n) { c.unclassified++; continue; }
    const mt = S.levelMeta[S.fine[t]]; if (mt && mt.plane) c.planes++; else if (mt && mt.vol) c.volumes++; else if (zm[t] === rid && E.stage.walkable(S, t) && S.region[t] >= 0) c.base++; else c.other++; }
  const tot = w * h, r = {}; for (const k of Object.keys(c)) r[k] = +(c[k] / tot * 100).toFixed(2); return { w, h, share: r, kinds, lego: S.legoInfo ? { m: S.legoInfo.m, terraces: S.legoInfo.terraces, single: S.legoInfo.single } : null }; })()`;
(async () => {
  const a = await Q.begin(open), res = {};
  await a.page.click('#presets button[data-id="stage"]'); await a.idle();
  for (const [key, T] of CASES) {
    const info = await Q.setupPlace(a, key, { T, treat: process.env.Q2_TREAT || 'up' }), name = `${key}_T${T}`; res[name] = { T, ks: info.ks, rows: [] };
    for (const [q, k] of info.ks.entries()) {
      await Q.heroAt(a, k); const cov = await a.page.evaluate(COVER); if (SHOTS) await (await a.page.$('#stage canvas')).screenshot({ path: path.join(SHOTS, `${name}_k${[0, 4, 8][q]}.png`) });
      const img = await a.page.evaluate(() => { const cv = document.querySelector('#stage canvas'), c = cv.getContext('2d'); return Array.from(c.getImageData(0, 0, cv.width, cv.height).data); });
      await a.ev(() => { const s = window.__evo.st.stage; s._pp = s.props; s._po = s.objects; s.props = 'off'; s.objects = 'off'; window.__evo.redraw(); }); await a.idle(); await a.idle();
      const diff = await a.page.evaluate((img) => { const cv = document.querySelector('#stage canvas'), c = cv.getContext('2d'), d = c.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - img[i]) + Math.abs(d[i + 1] - img[i + 1]) + Math.abs(d[i + 2] - img[i + 2]) > 24) n++; return n / (d.length / 4) * 100; }, img);
      await a.ev(() => { const s = window.__evo.st.stage; s.props = s._pp; s.objects = s._po; window.__evo.redraw(); }); await a.idle();
      cov.share.billboards = +diff.toFixed(2); res[name].rows.push({ k: [0, 4, 8][q], ...cov });
      console.log(name, 'k' + [0, 4, 8][q], JSON.stringify(cov.share), 'lego', JSON.stringify(cov.lego));
    }
  }
  res.pageErrors = a.errs.length; fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
