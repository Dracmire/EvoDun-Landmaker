/* Screenshots of C2 (planes by room) into docs/crystallizers/03-stage/shots/c2/: mockt_z14 and mockt_x44 with the room framing and the hero framing (Box), the 6 rooms of dac_stage with the room framing (Box), and a top view of the classes (room, BACK, SIDE, FRONT) for z14, x44 and one room of dac_stage.
     NODE_PATH=$(npm root -g) node tools/ui/c2_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/c2');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await a.idle(); };
  const goRoom = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, id); await a.idle(); await a.idle(); };
  const info = () => ev(() => { const e = window.__evo, p = e.S().stagePlanes; return { room: e.st.orientId, yaw: e.view().yaw, tech: e.st.tech, planes: p && { wall: p.wall, cols: p.cols, front: p.front, counts: p.counts, skipped: p.skipped } }; });
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await info())); };
  const classes = async (name, id) => { const url = await ev((id) => { const e = window.__evo, E = window.EVO, S = e.S(), rec = S.orient.byId.get(id), C = E.planes.classify(S, rec, rec.yaw), K = 6, cv = document.createElement('canvas'); cv.width = S.W * K; cv.height = S.H * K; const g = cv.getContext('2d');
      for (let y = 0; y < S.H; y++) for (let x = 0; x < S.W; x++) { const i = y * S.W + x; let c = '#46465a'; if (S.void && S.void[i]) c = '#14142a'; else if (!S.block[i]) c = '#8a8a8a'; const k = C.cls[i]; if (k === 1) c = '#dc3c3c'; else if (k === 2) c = '#e6c83c'; else if (k === 3) c = '#3ca0e6'; if (S.roomMap[i] === id && !S.block[i] && !(S.void && S.void[i])) c = C.walk(i) ? '#3cc85a' : '#1e783c'; g.fillStyle = c; g.fillRect(x * K, y * K, K, K); }
      g.fillStyle = '#fff'; g.font = '14px sans-serif'; const f = C.f, ax = 40, ay = 40; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + f[0] * 30, ay + f[1] * 30); g.stroke(); g.fillText(`room ${id} · yaw ${rec.yaw} · arrow = looking direction (BACK = red, SIDE = yellow, FRONT = blue)`, 8, 14);
      return cv.toDataURL('image/png'); }, id); fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64')); console.log(name); };
  for (const id of ['mockt_z14', 'mockt_x44']) { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle(); const rid = +id.slice(-2); await frame('room'); await goRoom(rid); await shot(`${id}_encuadre_sala_Box.png`); await classes(`${id}_clases.png`, rid); await frame('hero'); await goRoom(rid); await shot(`${id}_encuadre_heroe_Box.png`); }
  await page.click('#examples button[data-id="dac_stage"]'); await a.idle(); await a.idle(); await frame('room'); const rooms = await ev(() => window.__evo.st.stageRooms.slice());
  for (const id of rooms) { await goRoom(id); await shot(`dac_stage_sala${id}_encuadre_sala_Box.png`); if (id === 20) await classes('dac_stage_sala20_clases.png', 20); }
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})();
