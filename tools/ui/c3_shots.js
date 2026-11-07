/* Screenshots of C3 (props by room) into docs/crystallizers/03-stage/shots/c3/: mockt_z14 and mockt_x44 with the room framing and the hero framing (Box, planes and props on), the 6 rooms of dac_stage with the room framing (Box), and a top view of room 14 with the path, torches, door pillars and goal marked.
     NODE_PATH=$(npm root -g) node tools/ui/c3_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/c3');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const frame = async (v) => { await ev((v) => { const s = document.querySelector('#stageFrame'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await a.idle(); };
  const goRoom = async (id) => { await ev((id) => { const e = window.__evo, S = e.S(), c = window.EVO.stage.roomCentre(S, id); e.st.stageIdx = e.st.stageRooms.indexOf(id); e.st.follow = true; e.st.hero = { x: S.ox + c.x, y: S.oy + c.y }; e.redraw(); }, id); await a.idle(); };
  const info = () => ev(() => { const e = window.__evo, c = e.S().propsC, d = c && c.data; return { room: e.st.orientId, yaw: e.view().yaw, tech: e.st.tech, props: d && { torches: d.torches.length, pillars: d.pillars.length, goal: !!d.goal, noPath: d.noPath, pathLen: d.path.length } }; });
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await info())); };
  const top = async (name, id) => { const url = await ev((id) => { const e = window.__evo, S = e.S(), rec = S.orient.byId.get(id), W = S.W, K = 6, d = S.propsC.data, cv = document.createElement('canvas'); cv.width = W * K; cv.height = S.H * K; const g = cv.getContext('2d');
      for (let y = 0; y < S.H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let c = '#46465a'; if (S.void && S.void[i]) c = '#14142a'; else if (!S.block[i]) c = '#8a8a8a'; if (S.roomMap[i] === id && !S.block[i] && !(S.void && S.void[i])) c = '#3cc85a'; g.fillStyle = c; g.fillRect(x * K, y * K, K, K); }
      for (const st of S.stairs || []) for (const s of st.steps || []) for (const t of s.tiles) { g.fillStyle = '#c8a040'; g.fillRect((t % W) * K, ((t / W) | 0) * K, K, K); }
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); d.path.forEach((t, k) => { const x = ((t % W) + 0.5) * K, y = (((t / W) | 0) + 0.5) * K; if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
      g.fillStyle = '#ffd23c'; for (const t of d.torches) { g.beginPath(); g.arc(t.x * K, t.y * K, 3.5, 0, 7); g.fill(); }
      g.fillStyle = '#e04646'; for (const p of d.pillars) g.fillRect(p.x * K - 4, p.y * K - 4, 8, 8);
      if (d.goal) { g.fillStyle = '#3c8ce6'; g.beginPath(); g.moveTo(d.goal.x * K, d.goal.y * K - 8); g.lineTo(d.goal.x * K + 7, d.goal.y * K + 5); g.lineTo(d.goal.x * K - 7, d.goal.y * K + 5); g.fill(); }
      const f = window.EVO.orient.lookOf(rec.yaw); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 40); g.lineTo(40 + f[0] * 30, 40 + f[1] * 30); g.stroke(); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(`room ${id} · yaw ${rec.yaw} · arrow = looking direction · white = path, yellow = torches, red = pillars, blue = goal, orange = steps/ramps`, 8, 14);
      return cv.toDataURL('image/png'); }, id); fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64')); console.log(name); };
  for (const id of ['mockt_z14', 'mockt_x44']) { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle(); const rid = +id.slice(-2); await frame('room'); await goRoom(rid); await shot(`${id}_encuadre_sala_Box.png`); if (id === 'mockt_z14') await top('mockt_z14_vista_arriba.png', rid); await frame('hero'); await goRoom(rid); await shot(`${id}_encuadre_heroe_Box.png`); }
  await page.click('#examples button[data-id="dac_stage"]'); await a.idle(); await a.idle(); await frame('room'); const rooms = await ev(() => window.__evo.st.stageRooms.slice());
  for (const id of rooms) { await goRoom(id); await shot(`dac_stage_sala${id}_encuadre_sala_Box.png`); }
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})();
