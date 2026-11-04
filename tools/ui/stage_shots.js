/* Screenshots of the 2D-HD Stage (mode 3, example dac_stage, Cam 6): four rooms of the window that differ in size and in how they are crossed, one CLAMP case at the window edge, and the same RAMP at terH 1, 2 and 4 (tiles) with the same framing.
   The whole page is shot (the info line, with the Stage readout first, is in it). Output: <outDir>/<prefix>_<name>.png  (prefix: s1 = the first set, s2a = with the clean view and the measures in H)
     NODE_PATH=$(npm root -g) node tools/ui/stage_shots.js <outDir> [prefix]      (prefix default s2a) */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || 's2a'; if (!out) { console.error('usage: stage_shots.js <outDir> [prefix]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const shot = async (name) => { await a.idle(); await page.waitForTimeout(300); await a.idle(); await page.screenshot({ path: path.join(out, `${pre}_${name}.png`) }); console.log(name, (await ev(() => document.querySelector('#info').innerText)).split('\n')[0].slice(0, 230)); };
  const toRoom = async (id) => { await ev((id) => { const e = window.__evo, c = window.EVO.stage.roomCentre(e.S(), id); e.st.follow = true; e.st.hero = { x: e.S().ox + c.x, y: e.S().oy + c.y }; e.redraw(); }, id); };
  await toRoom(17); await shot('room17_cake_front_to_back');
  await toRoom(20); await shot('room20_cake_left_to_right_5_exits');
  await toRoom(27); await shot('room27_ascension_6_exits');
  await toRoom(10); await shot('room10_diorama_small');
  // CLAMP: the west edge of room 6 (the left edge of the rooms box)
  await ev(() => { const e = window.__evo, S = e.S(), E = window.EVO; let best = null; for (let i = 0; i < S.n; i++) if (S.roomMap[i] === 6 && E.stage.walkable(S, i)) { const x = i % S.W; if (!best || x < best.x) best = { x, y: (i / S.W) | 0 }; } e.st.follow = true; e.st.hero = { x: S.ox + best.x + 0.5, y: S.oy + best.y + 0.5 }; e.redraw(); });
  await shot('clamp_left_room6_west_edge');
  // the same ramp (the first of the window, room 17) at terH 1, 2 and 4 tiles, the same framing (the hero just below its foot): the units by hand for 1 and 2, the units in H (tilesPerH 2 -> terH 4) for 4
  const report = [];
  for (const th of [1, 2, 4]) {
    if (th !== 4) { await ev(() => { const el = document.querySelector('#t-stageUnits'); if (el.checked) el.click(); }); await a.slider('subH', +(0.22 * th).toFixed(4)); await a.idle(); await a.slider('terH', th); await a.idle(); }
    else { await ev(() => { const el = document.querySelector('#t-stageUnits'); if (!el.checked) el.click(); }); await a.idle(); }
    const r = await ev(() => { const e = window.__evo, S = e.S(), st = e.st, rec = S.stairs[0], W = S.W, b = rec.bottom[0], bx = S.ox + (b % W), by = S.oy + ((b / W) | 0); st.follow = true; st.hero = { x: bx + 0.5, y: by - 0.5 }; e.redraw(); const R = rec.ramp, jump = Math.abs(R.h1 - R.h0); return { terH: e.P.terH, subH: e.P.subH, rampDepth: e.P.rampDepth, len: R.len, h0: R.h0, h1: R.h1, jump, slope: +(jump / R.len).toFixed(3), lines: Math.max(2, Math.min(10, Math.round(jump / 0.3))), terraceH_in_H: +(e.P.terH / st.stage.tilesPerH).toFixed(2), jumpH: +(jump / st.stage.tilesPerH).toFixed(2) }; });
    report.push(r); await shot(`ramp_terH${th}`);
  }
  // the hero ON the ramp at terH 4 (units in H), the same Cam 6 framing as ramp_terH*: its feet use the height of the level of the tile (the placeholder does not follow the ramp surface)
  await ev(() => { const e = window.__evo, S = e.S(), st = e.st, rec = S.stairs[0], W = S.W, ts = rec.steps.flatMap((q) => q.tiles), t = ts[Math.floor(ts.length / 2)]; st.follow = true; st.hero = { x: S.ox + (t % W) + 0.5, y: S.oy + ((t / W) | 0) + 0.5 }; e.redraw(); });
  await shot('ramp_terH4_hero_on_ramp');
  // the same ramp seen from Cam 3 (oblique 50: a ramp that rises toward the camera, slope above tan(pitch), is back-facing from Cam 6, pitch 25: tan 25 = 0.47): the same three terH, centred on the foot of the ramp at about 54 px per tile
  await page.click('#presets button[data-id="oblique"]'); await a.idle();
  for (const th of [1, 2, 4]) {
    if (th !== 4) { await ev(() => { const el = document.querySelector('#t-stageUnits'); if (el.checked) el.click(); }); await a.slider('subH', +(0.22 * th).toFixed(4)); await a.idle(); await a.slider('terH', th); await a.idle(); }
    else { await ev(() => { const el = document.querySelector('#t-stageUnits'); if (!el.checked) el.click(); }); await a.idle(); }
    await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, rec = S.stairs[0], W = S.W, b = rec.bottom[0], bx = b % W, by = (b / W) | 0, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight; st.follow = false; st.zoom = (0.14 * h / 2) * 1.6 / st.fitSc; st.panX = st.panY = 0; const v = e.view(); const p = E.makeCam(S, e.P, v, w, h).p(bx + 1.5, by + 1.5, (S.levelH[S.fine[rec.top[0]]] + S.levelH[S.fine[b]]) / 2); st.panX = w / 2 - p[0]; st.panY = h / 2 - p[1]; e.redraw(); });
    await shot(`ramp_cam3_terH${th}`);
  }
  console.log('RAMP', JSON.stringify(report)); fs.writeFileSync(path.join(out, `${pre}_ramp_report.json`), JSON.stringify(report, null, 1));
  console.log('errors:', a.errs); await a.browser.close();
})();
