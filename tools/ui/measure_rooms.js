/* Cold cost of the rooms chain in the real viewer (headless Chromium), whole 256x256 map data/samples/skeleton_heightmap_256.png, compare mode (Box | A | B):
   time from loading the image to the first panels (shape + Box + A) and to all three, with rooms off and on, and the stage times of the chain.
   Then the cost of changing each control with the chain on. Each "cold" case is a fresh browser page.
     NODE_PATH=$(npm root -g) node tools/ui/measure_rooms.js */
const path = require('path');
const { open } = require('./common');
const FILE = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const round = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)])));
(async () => {
  for (const on of [false, true]) {
    const a = await open({ w: 1500, h: 900 }), page = a.page;
    if (on) await page.evaluate(() => { window.__evo.P.rooms = true; });
    await page.setInputFiles('#file', [FILE]); await page.waitForTimeout(800); await a.idle();
    const t = await page.evaluate(() => window.__evo.timing()), r = await page.evaluate(() => window.__evo.roomsTiming());
    console.log(`cold, rooms ${on ? 'ON ' : 'off'}: first panels (shape + Box + A) ${t.first.toFixed(0)} ms, all three ${t.all.toFixed(0)} ms` + (r ? `; rooms chain ${r.total.toFixed(0)} ms ${round(r.ms)}` : ''));
    if (on) {
      for (const [id, v, label] of [['roomsCross', 25, 'crossing cost 10 -> 25'], ['roomsMinCore', 50, 'min core 20 -> 50'], ['gateThr', 0.1, 'gate threshold 0.05 -> 0.1'], ['terraces', 6, 'terraces 5 -> 6']]) {
        await a.slider(id, v); await a.idle();
        const t2 = await page.evaluate(() => window.__evo.timing()), r2 = await page.evaluate(() => window.__evo.roomsTiming());
        console.log(`  ${label}: first panels ${t2.first.toFixed(0)} ms, all three ${t2.all.toFixed(0)} ms; chain ${r2.total.toFixed(0)} ms ${round(r2.ms)}`);
      }
    }
    await a.browser.close();
  }
})();
