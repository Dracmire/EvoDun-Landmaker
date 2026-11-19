/* PR Q2 step 4: Height spread (`P.spread`, the "extreme heights" control) at r16 and r79 with 5 / 7 / 9 terraces, treatment Mid, spread 1 / 1.5 / 2, Cam 6, k4. Sheet only, no judgement.
     NODE_PATH=$(npm root -g) node tools/ui/q2_spread.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2]; if (!out) { console.error('usage: q2_spread.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
(async () => {
  const a = await Q.begin(open), data = {}; await a.page.click('#presets button[data-id="stage"]'); await a.idle();
  for (const [key, label] of [['r16_9', 'r16'], ['r79', 'r79']]) for (const T of [5, 7, 9]) {
    const info = await Q.setupPlace(a, key, { T, treat: 'mid' });
    for (const sp of [1, 1.5, 2]) {
      await Q.setCtl(a, 's-spread', sp); await Q.heroAt(a, info.ks[1]);
      await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${label}_T${T}_spread${sp}.png`) });
      data[`${label}|T${T}|spread ${sp}`] = await a.ev(() => { const S = window.__evo.S(), P = window.__evo.P, hs = [...S.levelH].sort((x, y) => x - y); return { spread: P.spread, levels: S.levelH.length, heightRange: +(hs[hs.length - 1] - hs[0]).toFixed(2) }; });
      console.log(label, T, sp, JSON.stringify(data[`${label}|T${T}|spread ${sp}`]));
    }
  }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
