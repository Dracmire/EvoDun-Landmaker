/* Wall pass of C at one spot of the real map, at game scale: the Stage settings (7 terraces, spread 1.5 middle), Natural, dressing on, Cam 1 and Cam 6 (and Cam 3), for a list of configs. For the visual review of the wall pass.
     NODE_PATH=$(npm root -g) node tools/ui/wall_spot.js <outDir> [--x 89.5] [--y 73.7] [--px 70] [--cams isoE,stage] [--dress 1] [--cfg t3:0.25,t3:0.40,t2:0.25,off] [--flag key=value ...] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const out = process.argv[2]; if (!out || out.startsWith('--')) { console.error('usage: wall_spot.js <outDir> [options]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const x = +arg('--x', 89.5), y = +arg('--y', 73.7), px = +arg('--px', 70), cams = arg('--cams', 'isoE,stage').split(','), dress = arg('--dress', '1') !== '0', cfgs = arg('--cfg', 't3:0.25,t3:0.40,t2:0.25,off').split(',');
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.click('#mode'); await a.idle();
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.click('#stagePreset'); await a.idle();
  await a.tech('C'); await page.selectOption('#curvesPreset', 'natural'); await a.idle();
  await (dress ? page.check('#t-dress') : page.uncheck('#t-dress')); await a.idle();
  for (const cam of cams) for (const c of cfgs) {
    const [mode, ext] = c.split(':');
    await page.selectOption('#wallPass', mode); if (ext) await page.evaluate((e) => { window.__evo.P.wallExtrude = e; }, +ext); await a.idle(); await a.preset(cam);
    const info = await page.evaluate(({ x, y }) => { const e = window.__evo, S = e.S(), i = Math.min(S.n - 1, Math.max(0, Math.floor(y) * S.W + Math.floor(x))); return { h: S.levelH[S.fine[i]], fit: e.st.fitSc }; }, { x, y });
    await a.focus(x, y, info.h, px / info.fit);
    const f = path.join(out, `spot_${cam}_${mode}${ext ? Math.round(ext * 100) : ''}.png`); fs.writeFileSync(f, await a.canvas()); console.log(f);
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
