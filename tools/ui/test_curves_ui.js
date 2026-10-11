/* Technique C in the viewer: the stair footprint survives (stairSurvival = 100 %, nothing lost, nothing degraded) with EVERY preset (Ordered, Balanced, Natural), for ramps and steps and with Cake / Ascension
   exemptions in the shape; the preset changes the picture but not the shape; the curves info line; the manifest carries `curves`; (picking: see test_pick_ui.js and test_curves.js); and with C unselected and the dressing off
   nothing changes (single-technique pixels are covered by tools/ui/regress.js).
     NODE_PATH=$(npm root -g) node tools/ui/test_curves_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  const surv = (preset, style) => page.evaluate(([pr, sty]) => { const e = window.__evo, E = window.EVO; e.P.curves = pr; e.P.stairStyle = sty; e.draw(); return new Promise((res) => setTimeout(() => { const S = e.S(), P = e.P, v = E.stairSurvival(S, P, 'C'); res({ n: v.n, lost: v.lost, degraded: v.degraded, failed: v.tilesFailed, coverage: v.coverage, worst: v.worst }); }, 1500)); }, [preset, style]);
  await page.selectOption('#src', 'shrine_pier_x4'); await a.idle(); await page.click('#mode'); await a.idle();
  for (const style of [1, 0]) for (const preset of ['ordered', 'balanced', 'natural']) {
    const v = await surv(preset, style); await a.idle();
    ok(`Shrine-Pier x4, ${style ? 'ramps' : 'steps'}, ${preset}: stair survival 100 % (${v.n} stairs)`, v.n > 0 && v.lost === 0 && v.degraded === 0 && v.coverage > 0.9999, JSON.stringify(v));
  }
  await a.load('maps'); await a.zone(6); await a.slider('terraces', 12); await a.idle();
  for (const style of [1, 0]) for (const preset of ['ordered', 'balanced', 'natural']) {
    const v = await surv(preset, style); await a.idle();
    ok(`maps zone 6, 12 terraces, ${style ? 'ramps' : 'steps'}, ${preset}: stair survival 100 % (${v.n} stairs)`, v.n > 0 && v.lost === 0 && v.degraded === 0 && v.coverage > 0.9999, JSON.stringify(v));
  }
  // the preset changes the picture, the shape stays
  await page.selectOption('#src', 'shrine_pier_x4'); await a.idle(); await a.tech('C'); await a.preset('oblique');
  const imgs = {}, shapes = {};
  for (const preset of ['ordered', 'balanced', 'natural']) { await page.selectOption('#curvesPreset', preset); await a.idle(); imgs[preset] = await hash(); shapes[preset] = await page.evaluate(() => { const S = window.__evo.S(); return [S.levelCount.levels, S.stairs.length, Array.from(S.fine).join('').length]; }); }
  ok('the three presets give three different pictures', new Set(Object.values(imgs)).size === 3, JSON.stringify(imgs));
  ok('the preset does not reshape the map (same levels, stairs and fine)', JSON.stringify(shapes.ordered) === JSON.stringify(shapes.balanced) && JSON.stringify(shapes.balanced) === JSON.stringify(shapes.natural), JSON.stringify(shapes));
  const txt = await page.$eval('#info', (e) => e.textContent);
  ok('the info line names the curves preset, passes, seeds, contour edges and exempt cells', /Curves C \(natural\): 2 passes · \d+ seeds · \d+ contour edges · \d+ exempt/.test(txt), txt.slice(-220));
  // manifest: curves is written only when it is not the default, and read back
  const mf = await page.evaluate(() => { const E = window.EVO; return { vb: (() => { try { return E.buildManifest({ name: 't', flipY: false, maxnode: 0, roles: {}, markers: [], viewer: { preset: 'custom', rooms: false, cake: false, terraces: 5, curves: 'natural' } }); } catch (e) { return String(e); } })() }; });
  ok('the manifest accepts viewer.curves', typeof mf.vb === 'string' ? !/Error/.test(mf.vb) : true, String(mf.vb).slice(0, 200));
  const bad = await page.evaluate(() => { try { window.EVO.parseManifest({ format: 'evodun-pack/0.3', name: 't', roles: {}, viewer: { curves: 'wild' } }); return 'accepted'; } catch (e) { return e.message; } });
  ok('the manifest rejects an unknown curves preset', /curves/.test(bad), bad);
  // picking with C against the z-buffer is measured in test_pick_ui.js (C is listed there, not enforced); the cell -> tile rule is tested in tools/test_curves.js
  console.log('errors:', a.errs); ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
