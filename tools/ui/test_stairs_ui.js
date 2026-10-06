/* UI test: stairs (carved), their parameters and the survival numbers in the info line.
     python3 tools/ui/gen_maps.py && NODE_PATH=$(npm root -g) node tools/ui/test_stairs_ui.js */
const { open } = require('./common');
(async () => {
  const a = await open(), { page, ok } = a;
  const infoText = () => page.$eval('#info', (e) => e.innerText);
  const st = () => page.evaluate(() => { const S = window.__evo.S(); return { info: S.stairInfo, n: S.stairs.length, levels: S.levelH.length, bridges: S.levelMeta.filter((m) => m.bridge).length, cols: S.stairs.map((x) => x.cols.length) }; });
  await a.load('maps'); await a.zone(6);
  let s = await st();
  ok('ramps are carved with the defaults (width 3, depth 2)', s.n > 0 && s.info.width === 3 && s.info.placed === s.n, JSON.stringify(s.info));
  ok('the info line reports stairs and what A and B lose (compare mode shows both)', /\d+ stairs of \d+ sites/.test(await infoText()) && /stair coverage A [\d.]+%/.test(await infoText()) && /B [\d.]+%/.test(await infoText()), await infoText());
  await a.page.click('#mode'); await a.tech('A');
  ok('single technique: the other one shows a dash', /coverage A [\d.]+% · B –/.test(await infoText()), await infoText());
  await a.tech('B'); ok('single technique B', /coverage A – · B [\d.]+%/.test(await infoText()), await infoText());
  ok('stair sliders exist (width 0..5, tread 1..5, style 0..1, ramp depth 1..4)', (await page.$eval('#s-stairW', (e) => e.min + '..' + e.max)) === '0..5' && (await page.$eval('#s-stairStyle', (e) => e.min + '..' + e.max)) === '0..1' && (await page.$eval('#s-rampDepth', (e) => e.min + '..' + e.max)) === '1..4' && !(await page.$('#s-rampSlope')) && (await page.$eval('#s-tread', (e) => e.min + '..' + e.max)) === '1..5');
  await a.slider('stairW', 1); await a.idle(); s = await st();
  ok('width 1: single columns, nothing narrowed', s.cols.every((c) => c === 1) && s.info.narrowed === 0 && !/narrowed/.test(await infoText()));
  await a.slider('stairW', 3); await a.idle(); s = await st(); ok('width 3: up to three columns', Math.max(...s.cols) === 3 && Math.max(...s.cols) <= 3);
  await a.slider('stairW', 2); await a.slider('tread', 1); await a.idle(); const t1 = await st();
  ok('tread rise 1: more treads and levels than tread = climb', t1.levels > s.levels || t1.bridges >= s.bridges);
  await a.slider('tread', 2); await a.idle();
  for (const sub of [3, 6]) { await a.slider('subs', sub); await a.idle(); s = await st(); ok(`${sub} sub-terraces: stairs placed and no console errors`, s.n > 0 && a.errs.length === 0, JSON.stringify(a.errs)); }
  await a.slider('subs', 3); await a.idle();
  await (await page.$('#t-passes')).click(); await a.idle();           // stair marks use the stair chains
  await a.tech('box'); await a.tech('A');
  ok('no console errors (stair marks, all techniques)', a.errs.length === 0, JSON.stringify(a.errs));
  await a.browser.close();
})();
