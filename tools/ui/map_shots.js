/* Whole-map (or zone) screenshots with the stair marks on, for gate checks. EVO_ROOT picks another checkout.
     NODE_PATH=$(npm root -g) node tools/ui/map_shots.js <outDir> [--set terraces=12] [--zone 6] [--tag after] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: map_shots.js <outDir>'); process.exit(2); }
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 800 }), stage = a.page.locator('#stage'), tag = arg('--tag', 'map');
  for (const kv of arg('--set', '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); await a.slider(k, +v); await a.idle(); }
  await a.load('maps'); if (arg('--zone', '')) await a.zone(+arg('--zone', 0)); else { await a.page.click('#wholeMap'); await a.idle(); }
  await a.page.click('#t-passes'); await a.page.click('#mode'); await a.idle();
  for (const [pid, pname] of [['oblique', 'oblique'], ['isoE', 'iso']]) { await a.preset(pid); await stage.screenshot({ path: path.join(out, `${tag}_${pname}.png`) }); }
  console.log((await a.page.$eval('#info', (e) => e.innerText)).split(' · ').filter((t) => /gates|stairs|regions/.test(t)).join(' · '));
  console.log('errors:', a.errs); await a.browser.close();
})();
