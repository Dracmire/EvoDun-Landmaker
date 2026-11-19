/* STAGE 3 CONSTRUCTOR FORK, phase 0 (docs/crystallizers/03-stage/research/octopath2/stage_s3_fork_go.md): sha1 of the canvas (and of the info text without its timings) of EVERY example of mode 3 (the legacy ones, the mockups perfil_*, the forest, Aurhea, the throne...) with its default switches, plus the default example of modes 1, 2 and 4.
   Run it on the tree before and after the separation and diff the two JSON files:
     NODE_PATH=$(npm root -g) node tools/ui/s3_hashes.js <out.json>      (EVO_ROOT=<dir> runs another checkout of the viewer) */
const fs = require('fs'), crypto = require('crypto');
const { open } = require('./common');
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle(), out = {};
  const snap = async (name) => { out[name] = sha(await a.canvas()) + ' ' + sha(Buffer.from((await ev(() => document.querySelector('#info').innerText)).replace(/\d+(\.\d+)?\s*(ms|s)\b/g, 'T'))); };
  await ev(() => window.__evo.setMode('stage')); await idle();
  const ids = await ev(() => window.EVO.modes.byId('stage').examples.map((e) => e.id));
  for (const id of ids) { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); await snap('stage ' + id); }
  for (const m of ['terrain', 'rooms', 'curves']) { await ev((m) => window.__evo.setMode(m), m); await idle(); await idle(); await snap('mode ' + m + ' default'); }
  out.errors = a.errs.length; fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); console.log(Object.keys(out).length - 1, 'states, page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
