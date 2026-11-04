/* STAGE BORDERS (PR S2) measurements, report only (nothing enforced): per border (off / island / quebrada) on `dac_stage`:
   levels, tiles moved, levels added, the build time of the border itself, the COLD time (a fresh page, select the border, until the frame is idle) and the MEDIAN redraw (N redraws of the same view at Cam 6 and Cam 3, each to idle),
   and the new height jumps between neighbouring tiles outside the footprint (> 0.5 H) that the border introduces (the source scenery already has some). Optionally writes the shots (Cam 6 yaw 180 and Cam 3) to a folder.
     NODE_PATH=$(npm root -g) node tools/ui/measure_border.js [--shots dir] [--n 9] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 9), SHOTS = arg('shots', null);
const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
(async () => {
  const out = [];
  for (const type of ['off', 'island', 'quebrada']) {
    const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
    await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="dac_stage"]'); await idle();
    const t0 = Date.now(); await page.selectOption('#stageBorder', type); await idle(); const cold = Date.now() - t0;
    const info = await ev(() => { const e = window.__evo, S = e.S(), tph = e.st.stage.tilesPerH; let jumps = 0; const W = S.W, H = S.H, th = 0.5 * tph, hh = (i) => S.levelH[S.fine[i]]; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (S.block[i] === 0 || (S.void && S.void[i])) continue; for (const j of [i + 1, i + W]) { if (j >= S.n || (j === i + 1 && x === W - 1) || (S.void && S.void[j]) || S.block[j] === 0) continue; if (Math.abs(hh(i) - hh(j)) > th) jumps++; } } return { levels: S.levelH.length, b: S.stageBorder, jumps }; });
    const res = { type, cold, levels: info.levels, tiles: info.b && info.b.tiles, added: info.b && info.b.levelsAdded, jumpsOutside: info.jumps };
    for (const cam of ['stage', 'oblique']) {
      await ev((id) => { document.querySelector('#presets button[data-id=' + id + ']').click(); }, cam); await idle();
      await ev(() => { const e = window.__evo; e.st.follow = false; e.st.zoom = 1; e.st.panX = 0; e.st.panY = 0; e.redraw(); }); await idle();
      const ts = []; for (let k = 0; k < N; k++) { const t = Date.now(); await ev(() => window.__evo.redraw()); await idle(); ts.push(Date.now() - t); }
      res['median_' + cam] = med(ts);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, `s2_${type}_${cam === 'stage' ? 'cam6' : 'cam3'}.png`), await a.canvas()); }
    }
    out.push(res); console.log(JSON.stringify(res)); await a.browser.close();
  }
  const o = out.find((r) => r.type === 'off'); for (const r of out) if (r.type !== 'off') console.log(`${r.type}: +${r.levels - o.levels} levels, new jumps > 0.5 H outside ${r.jumpsOutside - o.jumpsOutside} (off ${o.jumpsOutside}), median Cam 6 ${r.median_stage} vs ${o.median_stage} ms, Cam 3 ${r.median_oblique} vs ${o.median_oblique} ms`);
})().catch((e) => { console.error(e); process.exit(1); });
