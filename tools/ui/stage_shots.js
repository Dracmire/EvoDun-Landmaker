/* Screenshots of the 2D-HD Stage S1 (mode 3, example dac_stage, Cam 6): four rooms of the window that differ in size and in how they are crossed, and one CLAMP case at the window edge.
   The whole page is shot (the info line, with the Stage readout first, is in it). Output: <outDir>/s1_<name>.png
     NODE_PATH=$(npm root -g) node tools/ui/stage_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: stage_shots.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const shot = async (name) => { await a.idle(); await page.waitForTimeout(300); await a.idle(); await page.screenshot({ path: path.join(out, `s1_${name}.png`) }); console.log(name, (await ev(() => document.querySelector('#info').innerText)).split('\n')[0].slice(0, 230)); };
  const toRoom = async (id) => { await ev((id) => { const e = window.__evo, c = window.EVO.stage.roomCentre(e.S(), id); e.st.follow = true; e.st.hero = { x: e.S().ox + c.x, y: e.S().oy + c.y }; e.redraw(); }, id); };
  await toRoom(17); await shot('room17_cake_front_to_back');
  await toRoom(20); await shot('room20_cake_left_to_right_5_exits');
  await toRoom(27); await shot('room27_ascension_6_exits');
  await toRoom(10); await shot('room10_diorama_small');
  // CLAMP: the west edge of room 6 (the left edge of the rooms box)
  await ev(() => { const e = window.__evo, S = e.S(), E = window.EVO; let best = null; for (let i = 0; i < S.n; i++) if (S.roomMap[i] === 6 && E.stage.walkable(S, i)) { const x = i % S.W; if (!best || x < best.x) best = { x, y: (i / S.W) | 0 }; } e.st.follow = true; e.st.hero = { x: S.ox + best.x + 0.5, y: S.oy + best.y + 0.5 }; e.redraw(); });
  await shot('clamp_left_room6_west_edge');
  console.log('errors:', a.errs); await a.browser.close();
})();
