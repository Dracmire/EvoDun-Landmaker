/* M2 (mode 3 independent of the source): sha1 of the canvas (and of the info text without its timings) in a fixed list of states, to prove that a change is pixel-neutral for the sources that already exist
   (dac_stage room by room, hero positions, the mode 3 switches on and off, the two legacy examples, modes 1 and 2). Run it on the tree before and after and diff the two JSON files:
     NODE_PATH=$(npm root -g) node tools/ui/m2_hashes.js <out.json>      (EVO_ROOT=<dir> runs another checkout of the viewer) */
const fs = require('fs'), crypto = require('crypto');
const { open } = require('./common');
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle(), out = {};
  const snap = async (name) => { out[name] = sha(await a.canvas()) + ' ' + sha(Buffer.from((await ev(() => document.querySelector('#info').innerText)).replace(/\d+(\.\d+)?\s*(ms|s)\b/g, 'T'))); };
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  const goRoom = async (id, dx, dy) => { await ev(([id, dx, dy]) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x + (dx || 0), y: S.oy + c.y + (dy || 0) }; e.redraw(); }, [id, dx, dy]); await idle(); await idle(); };
  const sw = async (id, on) => { const cur = await ev((id) => document.querySelector(id).checked, id); if (cur !== on) { await page.click(id); await idle(); await idle(); } };
  await ev(() => window.__evo.setMode('stage')); await idle();
  await clickEx('dac_stage');
  for (const id of [17, 10, 20, 27, 6, 5]) { await goRoom(id); await snap(`dac switches on, room ${id}`); }
  for (const [dx, dy] of [[3, 0], [-3, 2], [0, -4]]) { await goRoom(17, dx, dy); await snap(`dac switches on, room 17 hero +(${dx},${dy})`); }
  for (const id of ['#t-stageOrient', '#t-stagePlanes', '#t-stageProps']) await sw(id, false);
  for (const id of [17, 6, 5]) { await goRoom(id); await snap(`dac switches off, room ${id}`); }
  await goRoom(17, 3, 2); await snap('dac switches off, room 17 hero +(3,2)');
  for (const id of ['#t-stageOrient', '#t-stagePlanes', '#t-stageProps', '#t-stageObjects', '#t-stageVolumes']) await sw(id, true);
  for (const id of [17, 5]) { await goRoom(id); await snap(`dac all switches on (objects, volumes), room ${id}`); }
  for (const id of ['mockt_z14', 'mockt_x44', 'x4_stage', 'diorama31_stage']) { await clickEx(id); await snap(id); }
  await ev(() => window.__evo.setMode('terrain')); await idle(); await idle(); await snap('mode 1 default');
  await ev(() => window.__evo.setMode('rooms')); await idle(); await idle(); await snap('mode 2 default');
  out.errors = a.errs.length;
  fs.writeFileSync(process.argv[2] || '/dev/stdout', JSON.stringify(out, null, 1) + '\n'); console.log(Object.keys(out).length - 1, 'states, page errors', a.errs.length);
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
