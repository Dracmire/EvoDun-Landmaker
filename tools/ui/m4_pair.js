/* THE PAIRED SHOT (M4a commit 2): the viewer next to the remake, read in the same units. Aurhea's Fountain with TWO shots (the judge: window [south meadow, peninsula], the hero on the tip of the peninsula at (fx, fy) of the photo, yaw 0; the entry: the hero in the south meadow, yaw 90, INFO only)
   and the DAC rooms 14, 44 and 31 as windows of ONE room with the hero at the entrance of the route (the lowest part of the room), read against the bands. The state is set through window.__evo (ui.js: st.hero, st.follow, st.focus, st.panX / panY) and the panel is fixed at 1280 x 720 (16:9);
   the readings are computed IN THE PAGE by tools/stage_readings.js from S and the Cam 6 projection (not from pixels).
   Writes: docs/crystallizers/03-stage/shots/m4/<shot>.png (the viewer only) and readings.md (the table); the side-by-side with the PHOTO goes to tools/ui/out/m4/ (ignored by git: the photo is third-party material and is never written into the repo).
   FAILS LOUDLY if the internals of ui.js it uses are missing.   NODE_PATH=$(npm root -g) node tools/ui/m4_pair.js [--no-compose] */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), SR = require('../stage_readings.js');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'docs/crystallizers/03-stage/shots/m4'), IGN = path.join(__dirname, 'out/m4'), PHOTO_PNG = path.join(ROOT, 'docs/crystallizers/03-stage/refs/dq3/remake/r_20261030_050039_pond_peninsula.png');
const PHOTO = JSON.parse(fs.readFileSync(path.join(OUT, 'photo_readings.json'), 'utf8')), W = 1280, H = 720, TIP = { x: 23.0, y: 20.5 };   // the tip tile of the peninsula (old tile (11, 10) at x2), map coordinates
const fail = (m) => { console.error('M4 PAIR FAILED: ' + m); process.exit(2); };
(async () => {
  if (!fs.existsSync(PHOTO_PNG)) fail('the photo is not in refs/: ' + PHOTO_PNG);
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(IGN, { recursive: true });
  const a = await open({ w: 1800, h: 1000, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  const need = await ev(() => { const e = window.__evo || {}, st = e.st || {}, miss = []; for (const k of ['st', 'S', 'P', 'view', 'set', 'redraw', 'stageSetWindow', 'stageSetRooms']) if (!e[k]) miss.push('__evo.' + k); for (const k of ['follow', 'focus', 'hero', 'panX', 'panY', 'persH', 'zoom', 'stage', 'stageRooms', 'stageIdx']) if (!(k in st)) miss.push('st.' + k); if (!window.EVO.makeCam || !window.EVO.stage || !window.EVO.stage.feetH) miss.push('EVO.makeCam / EVO.stage'); if (!document.querySelector('#stage')) miss.push('#stage'); return miss; });
  if (need.length) fail('internals of ui.js missing: ' + need.join(', '));
  await page.addScriptTag({ content: 'var module = { exports: {} };' + fs.readFileSync(path.join(__dirname, '../stage_readings.js'), 'utf8') + '\nwindow.SR = module.exports;' });
  const rawK = (raws) => ev((raws) => { const e = window.__evo, tb = window.EVO.stage.zoneTable(e.packs[e.st.pack].pack); return raws.map((r) => tb.toK.get(r)); }, raws);
  const placeHero = (fx, fy) => ev(([fx, fy]) => { const e = window.__evo, st = e.st, S = e.S(), P = e.P, E = window.EVO; st.follow = false; const w = document.querySelector('#stage canvas').clientWidth, h = st.persH, hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, tp = st.stage.tilesPerH, feet = E.stage.feetH(S, E.stage.cellOf(S, hw.x, hw.y)); let res;
    for (let k = 0; k < 12; k++) { const p = E.makeCam(S, P, e.view(), w, h).p(hw.x, hw.y, feet + tp / 2); st.panX += fx * w - p[0]; st.panY += fy * h - p[1]; res = [p[0] - fx * w, p[1] - fy * h]; } return res; }, [fx, fy]);
  const measure = () => ev(() => { const e = window.__evo, st = e.st, S = e.S(), P = e.P, E = window.EVO, w = document.querySelector('#stage canvas').clientWidth, h = st.persH, v = e.view(), cam = E.makeCam(S, P, v, w, h), hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, tp = st.stage.tilesPerH;
    const feet = E.stage.feetH(S, E.stage.cellOf(S, hw.x, hw.y)), g = S.propsC && S.propsC.data && S.propsC.data.goal, r = S.orient && S.orient.byId.get(st.orientId), pl = S.stagePlanes;
    const out = window.SR.compute(S, cam, w, h, { hero: hw, feet, tilesPerH: tp, yaw: v.yaw, goal: g ? { x: g.x, y: g.y, h: g.h } : null });
    return { r: out, yaw: v.yaw, dir: r && r.dir, L: r && r.L, W: r && r.W, tp, heroFrac: st.stage.heroFrac, hero: [+(hw.x + S.ox).toFixed(2), +(hw.y + S.oy).toFixed(2)], planes: pl ? { wall: pl.wall, cols: pl.cols } : null, hyp: E.planes && E.planes.HYP ? { wallH: E.planes.HYP.wallH, colH: E.planes.HYP.colH } : null, follow: st.follow, goalW: g ? [g.x, g.y] : null }; });
  const save = async (name) => { const buf = await a.canvas(); fs.writeFileSync(path.join(OUT, name + '.png'), buf); return buf; };
  const shots = [];
  // ---- Aurhea ----
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click('#examples button[data-id="aurhea"]'); await idle();
  await ev(() => { const s = document.querySelector('#stage'); s.style.cssText = 'width:1280px;height:720px;flex:none;'; window.dispatchEvent(new Event('resize')); }); await idle();
  const dims = await ev(() => { const c = document.querySelector('#stage canvas'); return [c.clientWidth, window.__evo.st.persH]; }); if (dims[0] !== W || dims[1] !== H) fail('the panel is ' + dims + ', not ' + W + ' x ' + H);
  const ks = await rawK([1, 5]); await ev((ks) => window.__evo.stageSetWindow(ks), ks); await idle();
  { // the entry shot: the hero in the first zone (the south meadow), yaw by the orientation (90)
    const m = await measure(); const buf = await save('aurhea_entry'); shots.push({ pair: 'Aurhea', name: 'aurhea_entry', title: 'entry (hero in the south meadow, yaw ' + m.yaw + ')', judge: false, photo: PHOTO, m, buf }); }
  await page.click('#stageNext'); await idle(); await ev((t) => window.__evo.set({ hero: { x: t.x, y: t.y } }), TIP); await idle();
  { const res = await placeHero(PHOTO.fx.value, PHOTO.fy.value); await ev(() => window.__evo.redraw()); await idle(); const m = await measure(); const buf = await save('aurhea_judge'); shots.push({ pair: 'Aurhea', name: 'aurhea_judge', title: `judge (hero on the tip of the peninsula at fx ${PHOTO.fx.value}, fy ${PHOTO.fy.value}, yaw ${m.yaw})`, judge: true, photo: PHOTO, m, buf, residual: res.map((x) => +x.toFixed(2)) }); }
  // ---- DAC rooms ----
  await page.click('#examples button[data-id="dac_stage"]'); await idle();
  for (const id of [14, 44, 31]) {
    await ev((id) => window.__evo.stageSetRooms([id]), id); await idle();
    const ok = await ev((id) => window.__evo.st.stageRooms.join() === String(id), id); if (!ok) fail('room ' + id + ' could not be loaded as a window of one room');
    const entry = await ev((id) => { const e = window.__evo, S = e.S(), E = window.EVO, zm = E.stage.zoneMap(S), t = []; let lo = 1e9; for (let i = 0; i < S.n; i++) if (zm[i] === id && E.stage.walkable(S, i) && S.region && S.region[i] >= 0) { const f = E.stage.feetH(S, i); t.push([i, f]); lo = Math.min(lo, f); }
      const low = t.filter((q) => q[1] <= lo + 1e-9).map((q) => q[0]); if (!low.length) return null; let cx = 0, cy = 0; for (const i of low) { cx += i % S.W; cy += (i / S.W) | 0; } cx /= low.length; cy /= low.length; let best = low[0], bd = 1e18; for (const i of low) { const d = (i % S.W - cx) ** 2 + (((i / S.W) | 0) - cy) ** 2; if (d < bd) { bd = d; best = i; } }
      const x = S.ox + (best % S.W) + 0.5, y = S.oy + ((best / S.W) | 0) + 0.5; e.set({ hero: { x, y } }); return [x, y]; }, id);
    if (!entry) fail('room ' + id + ' has no walkable ground (no entrance of the route)');
    await ev(() => window.__evo.redraw()); await idle(); const m = await measure(); const buf = await save('dac_room_' + id); shots.push({ pair: 'DAC room ' + id, name: 'dac_room_' + id, title: `entrance of the route = the lowest part (hero at ${entry.map((x) => x.toFixed(1))}), yaw ${m.yaw}, ${m.dir}`, judge: true, photo: null, m, buf });
  }
  if (a.errs.length) fail('page errors: ' + JSON.stringify(a.errs));
  // ---- the table ----
  const f2 = (x, d = 2) => (x === null || x === undefined ? '-' : Number(x).toFixed(d)), md = [];
  md.push('# M4a readings (generated by `tools/ui/m4_pair.js`; do not edit)', '', `Panel ${W} x ${H}, Cam 6 (FOV 30, pitch 25). Readings from S and the projection (\`tools/stage_readings.js\`), the photo from \`photo_readings.json\` (numbers only). Verdicts by the table \`BANDS\` (hypotheses [R], sources in the file): PASA / FALLA / INFO / N-A.`, '', 'M5a of the viewer is the hero as drawn (feet 0.5 H below the pivot): heroFrac x 0.984 = 13.8 % for heroFrac 0.14; at the pivot depth it is `heroFrac` BY CONSTRUCTION, so in the DAC rooms M5a is not an independent reading.', '');
  let kRead = null;
  for (const s of shots) {
    const r = s.m.r, p = s.photo, J = s.judge, V = (n, v, ph) => SR.verdict(n, v, ph, J), rows = [];
    const row = (name, ref, val, vd) => rows.push(`| ${name} | ${ref} | ${val} | ${vd} |`);
    row('M5a hero height / frame', p ? `${PHOTO.M5a.value} (+-25 %)` : `band ${SR.BANDS.M5a.band.join('-')}`, f2(r.M5a, 4), V('M5a', r.M5a, p ? PHOTO.M5a : null));
    row('fx hero centre', p ? `${PHOTO.fx.value} (+-0.05)` : '-', f2(r.fx, 3), V('fx', r.fx, p ? PHOTO.fx : null));
    row('fy hero centre', p ? `${PHOTO.fy.value} (+-0.05)` : '-', f2(r.fy, 3), V('fy', r.fy, p ? PHOTO.fy : null));
    row('M5b width at the hero, H' + (p ? '' : ' (the width of the ROOM, not of a route)'), p ? `${PHOTO.M5b.value} (+-25 % or band 3.5-4)` : 'band 3.5-4 (route width)', f2(r.M5b), p ? V('M5b', r.M5b, PHOTO.M5b) : 'INFO');
    row('M8b far edge above the head, H (gap ' + f2(r.M8b.gapH, 1) + ' H)', p ? `${PHOTO.M8b.value} (+-0.5)` : '-', f2(r.M8b.head), V('M8b', r.M8b.head, p ? PHOTO.M8b : null));
    row('M8b far edge above the feet, H', p ? `${PHOTO.M8b.feet}` : '-', f2(r.M8b.feet), 'INFO');
    row('M1 walkable levels in frame', p ? `${PHOTO.M1.walkable} walkable (${PHOTO.M1.distinctHeights} heights), band 1-3` : 'band 1-3', `${r.M1.n} (${r.M1.heights.join(', ')} H)`, V('M1', r.M1.n));
    row('M3a closed background', p ? 'closed' : 'closed', r.M3a.closed ? 'closed' : `OPEN: ${f2(100 * r.M3a.bandFrac, 1)} % of the frame empty above the far edge`, V('M3a', r.M3a.closed));
    row('M4 goal in frame', p ? 'N/A (no landmark in the photo)' : 'in frame', r.M4 ? (r.M4.inFrame ? `in frame (${f2(r.M4.fx, 2)}, ${f2(r.M4.fy, 2)})` : 'out of frame') : 'no goal', p ? 'N-A' : (J ? V('M4', !!(r.M4 && r.M4.inFrame)) : 'INFO'));
    if (!p) { row('planes: back wall H over the highest ground', `${SR.BANDS.wall.H} [Ref]`, s.m.hyp ? f2(s.m.hyp.wallH, 1) : '-', 'INFO'); row('planes: columns H', `${SR.BANDS.vertical.band.join('-')} [Ref M10]`, s.m.hyp ? f2(s.m.hyp.colH, 1) : '-', 'INFO'); row('room extent L x W, H (clearing)', `${SR.BANDS.clearing.band.join('-')} [Ref M5c]`, s.m.L ? `${f2(s.m.L / s.m.tp, 1)} x ${f2(s.m.W / s.m.tp, 1)}` : '-', 'INFO'); }
    md.push(`## ${s.pair}: ${s.title}`, '', `Image: \`${s.name}.png\`${s.residual ? `; hero placed at the target within ${s.residual} px` : ''}. Hero (map) ${s.m.hero}, heroFrac ${s.m.heroFrac}, tilesPerH ${s.m.tp}.`, '', '| reading | photo / band | viewer | verdict |', '|---|---|---|---|', ...rows, '');
    if (s.name === 'aurhea_judge') kRead = SR.kReading(PHOTO, r);
  }
  if (kRead) md.push('## K (M5d, INFO): the scale of the remake against the viewer', '', `- K by width = M5b photo / M5b viewer = ${f2(PHOTO.M5b.value)} / ${f2(shots.find((s) => s.name === 'aurhea_judge').m.r.M5b)} = **${f2(kRead.width.k, 2)} +- ${f2(kRead.width.tol, 2)}** (photo tolerance only)`, `- K by depth = M8b photo / M8b viewer = ${f2(PHOTO.M8b.value)} / ${f2(shots.find((s) => s.name === 'aurhea_judge').m.r.M8b.head)} = **${f2(kRead.depth.k, 2)} +- ${f2(kRead.depth.tol, 2)}** (depends on the pitch of the photo, which is unknown)`, '');
  fs.writeFileSync(path.join(OUT, 'readings.md'), md.join('\n')); console.log(md.join('\n'));
  // ---- the side-by-side with the photo: ONLY in the ignored folder ----
  if (!process.argv.includes('--no-compose')) {
    const pg = await a.browser.newPage({ viewport: { width: 2400, height: 760 } }), photo = 'data:image/png;base64,' + fs.readFileSync(PHOTO_PNG).toString('base64');
    for (const s of shots.filter((q) => q.photo)) {
      const data = await pg.evaluate(async ([ph, vw, W, H]) => { const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; }), A = await load(ph), B = await load(vw), pw = Math.round(A.width * H / A.height), c = document.createElement('canvas'); c.width = pw + 10 + W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, H); x.drawImage(A, 0, 0, pw, H); x.drawImage(B, pw + 10, 0); return c.toDataURL('image/png'); }, [photo, 'data:image/png;base64,' + s.buf.toString('base64'), W, H]);
      fs.writeFileSync(path.join(IGN, s.name + '_pair.png'), Buffer.from(data.split(',')[1], 'base64'));
    }
    await pg.close(); console.log('side-by-side (not in the repo): ' + IGN);
  }
  await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
