/* Screenshots of C1 (orientation by room + room framing) into docs/crystallizers/03-stage/shots/c1/: mockt_z14 and mockt_x44 with the room framing (Box and B), the 6 rooms of dac_stage with the room framing (Box), and two of them with the hero framing.
     NODE_PATH=$(npm root -g) node tools/ui/c1_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/c1');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await a.idle(); };
  const tech = async (t) => { await ev((t) => { window.__evo.set({ tech: t }); window.__evo.redraw(); }, t); await a.idle(); };
  const readout = () => ev(() => { const e = window.__evo; return { room: e.st.orientId, yaw: e.view().yaw, tech: e.st.tech }; });
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await readout())); };
  for (const id of ['mockt_z14', 'mockt_x44']) { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await frame('room'); for (const t of ['box', 'B']) { await tech(t); await shot(`${id}_sala_${t === 'box' ? 'Box' : 'B'}.png`); } }
  await page.click('#examples button[data-id="dac_stage"]'); await a.idle(); await frame('room'); await tech('box');
  const rooms = await ev(() => window.__evo.st.stageRooms.slice());
  for (let k = 0; k < rooms.length; k++) { await ev((k) => { const e = window.__evo; e.st.stageIdx = (k + e.st.stageRooms.length - 1) % e.st.stageRooms.length; }, k); await page.click('#stageNext'); await a.idle(); await shot(`dac_stage_sala${rooms[k]}_encuadre_sala_Box.png`); }
  await frame('hero');
  for (const k of [0, 4]) { await ev((k) => { const e = window.__evo; e.st.stageIdx = (k + e.st.stageRooms.length - 1) % e.st.stageRooms.length; }, k); await page.click('#stageNext'); await a.idle(); await shot(`dac_stage_sala${rooms[k]}_encuadre_heroe_Box.png`); }
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})();
