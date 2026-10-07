/* Rooms in the viewer: the switch (off by default), the two sliders, the info line, and which stages of the chain each control recomputes
   (the rest comes from the cache). Real map: data/samples/skeleton_heightmap_256.png.
     NODE_PATH=$(npm root -g) node tools/ui/test_rooms_ui.js */
const path = require('path');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]);
  await page.waitForTimeout(1500); await a.idle();
  const stages = () => page.evaluate(() => { const t = window.__evo.roomsTiming(); return t ? Object.keys(t.ms).sort().join(',') : null; });
  ok('rooms are off by default and nothing is computed', !(await page.$eval('#t-rooms', (e) => e.checked)) && (await stages()) === null && !/Rooms/.test(await page.$eval('#info', (e) => e.innerText)));
  ok('the two sliders exist with the agreed ranges and defaults (core 5-80 = 20, cost 0-40 = 10)', await page.evaluate(() => { const c = document.querySelector('#s-roomsMinCore'), x = document.querySelector('#s-roomsCross'); return c && x && +c.min === 5 && +c.max === 80 && +c.value === 20 && +x.min === 0 && +x.max === 40 && +x.value === 10; }));
  const cold = Date.now(); await page.check('#t-rooms'); await a.idle();
  const txt = await page.$eval('#info', (e) => e.innerText), t1 = await page.evaluate(() => window.__evo.roomsTiming());
  console.log('cold rooms chain (whole map, core 20, cost 10):', t1.total.toFixed(0), 'ms', JSON.stringify(Object.fromEntries(Object.entries(t1.ms).map(([k, v]) => [k, Math.round(v)]))));
  ok('switching on shows the Rooms line with rooms, cores, tree and gates', /Rooms: 32 rooms · \d+ cores \(min 20 tiles\) · tree \d+ of \d+ reachable cores in \d+ trees? · gates \d+ used of \d+ candidates/.test(txt), txt.split('\n').pop());
  ok('all five stages ran the first time', (await stages()) === 'cores,edges,pass,rooms,tree', await stages());
  await a.slider('roomsCross', 25); await a.idle(); ok('crossing cost recomputes only the tree', (await stages()) === 'tree', await stages());
  await a.slider('roomsMinCore', 40); await a.idle(); ok('min core size recomputes the cores and the tree', (await stages()) === 'cores,tree', await stages());
  await a.slider('gateThr', 0.1); await a.idle(); ok('gate threshold recomputes from the pass stage on', (await stages()) === 'cores,pass,tree', await stages());
  await a.slider('terraces', 6); await a.idle(); ok('terraces recompute from the edges on (rooms themselves are cached)', (await stages()) === 'cores,edges,pass,tree', await stages());
  await page.uncheck('#t-rooms'); await a.idle(); ok('switching off removes the Rooms line', !/Rooms:/.test(await page.$eval('#info', (e) => e.innerText)));
  console.log('errors:', a.errs); await a.browser.close();
})();
