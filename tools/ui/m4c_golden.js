/* GOLDEN SHOT 1 (M4c-1): the viewer's frame of the example `golden_door` next to the remake capture "Shrine of Plains 17.17", compared by COMPOSITION (not by look). FAULT CONTROL, not the judge: the judge is a person looking at the side-by-side.
   (i) sizes the panel to the aspect of the valid area of the capture (1242 x 625 -> 1280 x 644); the EXAMPLE frames itself (`heroScreen`, M4c-1b: the tool does not move the camera) and saves docs/crystallizers/03-stage/shots/m4c/golden_door_viewer.png (the VIEWER only);
   (ii) readings of the viewer by layer (hero, door, facade, route width, P, F) in the units of the photo readings (px over the hero's px at its feet = H);
   (iii) reads docs/.../m4c/golden_door_photo_readings.json (NUMBERS I read on the capture: no pixels of it in the repo);
   (iv) blobs: both images (the capture cropped to its valid area) to a 40 x 22 grid, light / dark against each image's own median, the minimap circle excluded in both; agreement, IoU of the dark blobs, boxes and centroids;
   (v) the side-by-side and the blob maps go ONLY to tools/ui/out/m4c/ (git-ignored: third-party material). The remake file is read from docs/crystallizers/03-stage/refs/dq3/remake/ and never copied.
   NODE_PATH=$(npm root -g) node tools/ui/m4c_golden.js [--no-compose] */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), G = require('../stage_golden.js'), SR = path.join(__dirname, '../stage_readings.js');
const ROOT = path.resolve(__dirname, '../..'), SHOTS = path.join(ROOT, 'docs/crystallizers/03-stage/shots/m4c'), IGN = path.join(__dirname, 'out/m4c');
/* ONE tool, parametrized by shot (M4c-2, D3): --shot door (default: golden shot 1, the capture 17.17) | throne (golden shot 2, the throne room). Per shot: the example, the capture, its valid area (without the player bar), the minimap circle (fractions of the valid area: cx of the width, cy and r of the height), the panel of the viewer (the aspect of the valid area). What depends on the door / facade (R) is read only in `door`; the readings of the throne room only in `throne`. `exclude` = what the blobs leave out of both images (fractions of the valid area). */
const SHOT_TABLE = {
  door: { example: 'golden_door', capture: 'Shrine of Plains - 17.17.png', valid: [1242, 625], panel: [1280, 644], minimap: { circle: [1122 / 1242, 121 / 625, 84 / 625] } },
  throne: { example: 'golden_throne', capture: 'r_20261029_054537_throne_room_orange.png', valid: [1278, 643], panel: [1280, 644], minimap: { rect: [0.985, 0.90, 1, 1] } } // (no bar, no minimap: only a channel icon in the bottom right corner)
};
const SHOT_ID = (() => { const k = process.argv.indexOf('--shot'); return k >= 0 ? process.argv[k + 1] : 'door'; })(), SHOT = SHOT_TABLE[SHOT_ID]; if (!SHOT) { console.error('unknown --shot ' + SHOT_ID + ' (door | throne)'); process.exit(2); }
const PHOTO = path.join(ROOT, 'docs/crystallizers/03-stage/refs/dq3/remake', SHOT.capture), [W, H] = SHOT.panel, VALID = SHOT.valid, EX = SHOT.example;
const COLS = 40, ROWS = 22, MINIMAP = SHOT.minimap;
(async () => {
  const T0 = Date.now();
  fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(IGN, { recursive: true });
  const pr = JSON.parse(fs.readFileSync(path.join(SHOTS, EX + '_photo_readings.json'), 'utf8'));
  const a = await open({ w: 1800, h: 1000, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = async () => { await a.idle(); await a.idle(); };
  await page.addScriptTag({ content: 'var module = { exports: {} };' + fs.readFileSync(SR, 'utf8') + '\nwindow.SR = module.exports;' });
  await ev(() => window.__evo.setMode('stage')); await idle(); await page.click(`#examples button[data-id="${EX}"]`); await idle(); await idle();
  await ev(([W, H]) => { const s = document.querySelector('#stage'); s.style.cssText = `width:${W}px;height:${H}px;flex:none;`; window.dispatchEvent(new Event('resize')); }, [W, H]); await idle(); await ev(() => window.__evo.redraw()); await idle(); await idle();
  // the state of the example at the start (M4c-2: the golden examples declare `objectsOn`, the layers are on from the click); the tool turns the switch on only if it is off
  const off = await ev(() => { const e = window.__evo; return { objectsOn: document.querySelector('#t-stageObjects').checked, frame: !!e.O.frame, objects: !!e.O.objects, ribbons: e.st.stage.ribbonList.length, objectList: e.st.stage.objectList.length }; });
  if (!off.objectsOn) { await page.click('#t-stageObjects'); await idle(); }
  const png = await a.canvas(); fs.writeFileSync(path.join(SHOTS, EX + '_viewer.png'), png);
  // ---- (ii) the readings of the viewer ----
  const R = await ev(() => {
    const e = window.__evo, st = e.st, E = window.EVO, S = e.S(), P = e.P, O = e.O, w = document.querySelector('#stage canvas').clientWidth, h = st.persH, tp = st.stage.tilesPerH, v = e.view(), cam = E.makeCam(S, P, v, w, h);
    const hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, feet = E.stage.feetH(S, E.stage.cellOf(S, hw.x, hw.y)), hb = cam.p(hw.x, hw.y, feet), heroPx = tp * cam.sc * E.stage.depthScale(cam, hw.x, hw.y, feet);
    const stats = (O.objects && O.objects.stats) || [], door = stats.find((q) => q.kind === 'pillar' && q.hH === 2.1), fac = stats.find((q) => q.kind === 'landmark'), torch = stats.find((q) => q.kind === 'lamp' && q.hH === 0.7);
    const box = (q) => ({ fx: +(q.base[0] / w).toFixed(3), fy: +(q.base[1] / h).toFixed(3), h_H: +(q.hpx / heroPx).toFixed(2), w_H: +(q.wpx / heroPx).toFixed(2), drawn: q.drawn });
    const out = { panel: [w, h], heroPx: +heroPx.toFixed(1), hero: { frac: +(heroPx / h).toFixed(3), fx: +(hb[0] / w).toFixed(3), fy: +(hb[1] / h).toFixed(3) } };
    out.door = door ? box(door) : null; out.torch = torch ? box(torch) : null;
    if (fac) { const b = box(fac); b.visibleH_H = +(Math.min(fac.hpx, fac.base[1]) / heroPx).toFixed(2); b.left = +((fac.base[0] - fac.wpx / 2) / w).toFixed(3); b.right = +((fac.base[0] + fac.wpx / 2) / w).toFixed(3); b.topCut = fac.base[1] - fac.hpx < 0; out.facade = b; }
    // the route: the width in H of the dirt path at two screen rows (the span of the visible tiles of ribbon 1 that cross the row)
    const gt = E.objects.groundTest(S, P, v, w, h, {}), tiles = [...new Set(st.stage.ribbonList.filter((r) => r.part !== 'cross').flatMap((rb) => E.frame.ribbonTiles(S.W, S.H, S.ox, S.oy, rb, tp)))], polys = []; // the route = every ribbon that is not the crossing path
    for (const i of tiles) { const x = i % S.W, y = (i / S.W) | 0, f = E.stage.feetH(S, i), c = cam.p(x + 0.5, y + 0.5, f); if (!gt.ownGround(c, i)) continue; polys.push([cam.p(x, y, f), cam.p(x + 1, y, f), cam.p(x + 1, y + 1, f), cam.p(x, y + 1, f)]); }
    const span = (fy) => { let lo = 1e9, hi = -1e9; for (const q of polys) { let y0 = 1e9, y1 = -1e9; for (const p of q) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } if (fy * h < y0 || fy * h > y1) continue; for (const p of q) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); } } return hi > lo ? +((hi - lo) / heroPx).toFixed(2) : null; };
    const near = (r0) => { for (const d of [0, 0.03, -0.03, 0.06, -0.06, 0.09, -0.09, 0.12]) { const q = span(r0 + d); if (q !== null) return { w_H: q, row: +(r0 + d).toFixed(2) }; } return { w_H: null, row: null }; };
    out.route = { tiles: tiles.length, visible: polys.length, nearHero: near(0.72), nearDoor: near(0.46) };
    // P: the pieces with `always`: the share of the frame they cover, how many cut an edge
    const P_ = stats.filter((q) => st.stage.objectList.find((o) => o.x === q.x && o.y === q.y && o.layer === 'P')), pc = []; let cover = 0; // the pieces declared as the P layer
    for (const q of P_) { const x0 = Math.max(0, q.base[0] - q.wpx / 2), x1 = Math.min(w, q.base[0] + q.wpx / 2), y0 = Math.max(0, q.base[1] - q.hpx), y1 = Math.min(h, q.base[1]); const area = Math.max(0, x1 - x0) * Math.max(0, y1 - y0); cover += area; pc.push({ kind: q.kind, drawn: q.drawn, fx: [+((q.base[0] - q.wpx / 2) / w).toFixed(3), +((q.base[0] + q.wpx / 2) / w).toFixed(3)], fy_top: +((q.base[1] - q.hpx) / h).toFixed(3), fy_base: +(q.base[1] / h).toFixed(3), visiblePx: +Math.max(0, y1 - y0).toFixed(0), cutsBottom: q.base[1] > h, cutsEdge: q.base[1] > h || q.base[0] - q.wpx / 2 < 0 || q.base[0] + q.wpx / 2 > w || q.base[1] - q.hpx < 0, area: +(area / (w * h)).toFixed(4) }); }
    out.P = { pieces: pc.length, cutEdge: pc.filter((q) => q.cutsEdge).length, frameShare: +(cover / (w * h)).toFixed(4), list: pc };
    // F: the open band (M3a) of the terrain alone (the billboards are not in S) and the objects of the F layer
    const g = fac ? { x: fac.x - S.ox, y: fac.y - S.oy, h: E.stage.feetH(S, E.stage.cellOf(S, fac.x - S.ox, fac.y - S.oy)) } : null, sr = window.SR.compute(S, cam, w, h, { hero: hw, feet, tilesPerH: tp, yaw: v.yaw, goal: g });
    out.F = { M3a_terrainOnly: sr.M3a, M4: sr.M4 };
    out.counts = { objects: stats.length, drawn: stats.filter((q) => q.drawn).length, ribbonStats: O.frame && O.frame.stats };
    return out; });
  // voidShare: the share of the frame that is EMPTY BACKGROUND (the colour of the renderer's background gradient at that row, E.BG_COLORS, +-4 per channel), total and by quarters of the height (top to bottom). The remake: 0.
  const voidShare = await ev(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
    const hex = (s) => [1, 3, 5].map((k) => parseInt(s.slice(k, k + 2), 16)), [c0, c1] = window.EVO.BG_COLORS.map(hex), q = [0, 0, 0, 0], qt = [0, 0, 0, 0]; let n = 0;
    for (let py = 0; py < c.height; py++) { const t = py / c.height, bg = c0.map((v, k) => v + (c1[k] - v) * t), k4 = Math.min(3, Math.floor(4 * py / c.height)); for (let px = 0; px < c.width; px++) { const p = (py * c.width + px) * 4; qt[k4]++; if (Math.abs(d[p] - bg[0]) <= 4 && Math.abs(d[p + 1] - bg[1]) <= 4 && Math.abs(d[p + 2] - bg[2]) <= 4) { n++; q[k4]++; } } }
    return { total: +(n / (c.width * c.height)).toFixed(4), quarters: q.map((v, k) => +(v / qt[k]).toFixed(4)), colours: window.EVO.BG_COLORS }; }, png.toString('base64'));
  R.F.voidShare = voidShare;
  // ---- blockedShare (M4c-2): the share of the frame where BLOCKED filler terrain (a cliff, a plateau: a tile that is not walkable and not void) is seen with no piece and no ribbon over it. Pixels: the capture with the layers against the capture without them (equal = terrain in sight), the tile under each pixel from the Box pick render. The remake has none (its only wall is the earth bank).
  await page.click('#t-stageObjects'); await idle(); const pngOff = await a.canvas(); await page.click('#t-stageObjects'); await idle();
  const blocked = await ev(async ([onB64, offB64]) => { const e = window.__evo, st = e.st, E = window.EVO, S = e.S(), w = document.querySelector('#stage canvas').clientWidth, h = st.persH;
    const data = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
    const A = await data(onB64), B = await data(offB64), D = E.pickBuffer(S, e.P, e.view(), w, h).data, walk = (i) => !S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0, q = [0, 0, 0, 0], qt = [0, 0, 0, 0]; let n = 0, terrain = 0;
    for (let py = 0; py < h; py++) { const k4 = Math.min(3, Math.floor(4 * py / h)); for (let px = 0; px < w; px++) { const p = (py * w + px) * 4; qt[k4]++; if (A[p] !== B[p] || A[p + 1] !== B[p + 1] || A[p + 2] !== B[p + 2]) continue; if (D[p + 3] !== 255) continue; terrain++; const code = (D[p] << 16) | (D[p + 1] << 8) | D[p + 2], tile = code & 0xFFFFF; if (tile < S.n && !walk(tile) && !(S.void && S.void[tile])) { n++; q[k4]++; } } }
    return { total: +(n / (w * h)).toFixed(4), quarters: q.map((v, k) => +(v / qt[k]).toFixed(4)), terrainInSight: +(terrain / (w * h)).toFixed(4) }; }, [png.toString('base64'), pngOff.toString('base64')]);
  R.F.blockedShare = blocked;
  // ---- the readings of the throne room (shot `throne` only): from the PIXELS of the capture (the carpet colour; the luma boxes of the CONTRAST reading) and from the geometry of the pieces tagged `mass`
  if (SHOT_ID === 'throne') R.throne = await ev(async (b64) => { const e = window.__evo, st = e.st, E = window.EVO, O = e.O, w = document.querySelector('#stage canvas').clientWidth, h = st.persH;
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
    const hex = (s) => [1, 3, 5].map((k) => parseInt(s.slice(k, k + 2), 16)), S = e.S(), cam = E.makeCam(S, e.P, e.view(), w, h), tp = st.stage.tilesPerH, hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, feet = E.stage.feetH(S, E.stage.cellOf(S, hw.x, hw.y)), H1 = tp * cam.sc * E.stage.depthScale(cam, hw.x, hw.y, feet);
    const carpet = hex((st.stage.ribbonList.find((r) => r.part === 'carpet') || {}).color || '#000000'), isC = (p) => Math.abs(d[p] - carpet[0]) <= 3 && Math.abs(d[p + 1] - carpet[1]) <= 3 && Math.abs(d[p + 2] - carpet[2]) <= 3;
    const row = (fy) => { const py = Math.round(fy * h), x0 = fy < 0.40 ? Math.round(0.33 * w) : 0, x1 = fy < 0.40 ? Math.round(0.67 * w) : w; /* above the columns' banners (the same orange) only the middle third is read */ let lo = 1e9, hi = -1; for (let px = x0; px < x1; px++) if (isC((py * w + px) * 4)) { lo = Math.min(lo, px); hi = Math.max(hi, px); } return hi < 0 ? { row: fy, w_H: 0 } : { row: fy, w_H: +((hi - lo) / H1).toFixed(2), w_frame: +((hi - lo) / w).toFixed(3), centre_fx: +((lo + hi) / 2 / w).toFixed(3) }; }; // the outer span of the carpet in the row (the group and the throne stand on it)
    let top = null; for (const fx of [0.44, 0.56]) { const px = Math.round(fx * w); for (let py = 0; py < h; py++) if (isC((py * w + px) * 4)) { top = top === null ? py : Math.min(top, py); break; } }
    const stats = (O.objects && O.objects.stats) || [], tag = (m) => stats.filter((q) => q.drawn && st.stage.objectList.find((o) => o.x === q.x && o.y === q.y && o.mass === m)), bx = (m) => { const q = tag(m)[0]; return q ? { fx: [+((q.base[0] - q.wpx / 2) / w).toFixed(3), +((q.base[0] + q.wpx / 2) / w).toFixed(3)], fy: [+((q.base[1] - q.hpx) / h).toFixed(3), +(q.base[1] / h).toFixed(3)] } : null; };
    const edgeAt = (m, fy, side) => { const b = bx(m); return b && fy >= b.fy[0] && fy <= b.fy[1] ? b.fx[side === 'right' ? 1 : 0] : null; };
    const luma = (x0, y0, x1, y1) => { let s = 0, n = 0; for (let py = Math.round(y0 * h); py < Math.round(y1 * h); py++) for (let px = Math.round(x0 * w); px < Math.round(x1 * w); px++) { const p = (py * w + px) * 4; s += 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]; n++; } return s / n / 255; };
    const L = { P_left: luma(0, 0.30, 0.13, 1.0), P_right: luma(0.87, 0.30, 1.0, 0.98), carpet: (luma(0.40, 0.50, 0.47, 0.90) + luma(0.53, 0.50, 0.60, 0.90)) / 2, floor_side: luma(0.17, 0.70, 0.30, 0.95), top: luma(0, 0, 1, 0.15), all: luma(0, 0, 1, 1) }, r3 = (v) => +v.toFixed(3), Pm = (L.P_left + L.P_right) / 2;
    const fl = bx('farFloor');
    return { carpet: { rows: [0.85, 0.64, 0.45, 0.32].map(row), topEdge_fy: top === null ? null : +(top / h).toFixed(3) }, P: { left_innerEdge_fx: [0.40, 0.60, 0.80].map((fy) => ({ row: fy, fx: edgeAt('stoneL', fy, 'right') })), right_innerEdge_fx: [0.40, 0.60, 0.80].map((fy) => ({ row: fy, fx: edgeAt('stoneR', fy, 'left') })), top_fy: [bx('stoneL') && bx('stoneL').fy[0], bx('stoneR') && bx('stoneR').fy[0]] },
      midColumns: { left: bx('colMidL'), right: bx('colMidR') }, farColumns: { left: bx('colFarL'), right: bx('colFarR') }, dais: bx('dais'), throne: bx('throne'), throneTop_fy: bx('throne') && bx('throne').fy[0], wallBase_fy: fl && fl.fy[0],
      contrast: { luma: Object.fromEntries(Object.entries(L).map(([k, v]) => [k, r3(v)])), P_over_carpet: +(Pm / L.carpet).toFixed(2), floor_over_carpet: +(L.floor_side / L.carpet).toFixed(2), top_over_carpet: +(L.top / L.carpet).toFixed(2) } }; }, png.toString('base64'));
  // ---- cost of the ribbon on a frame (monolithic frame, ms), with and without it ----
  const cost = await ev(async () => { const e = window.__evo, st = e.st, O = e.O, keepR = st.stage.ribbonList, keepO = st.stage.objectList, was = O.sliced; O.sliced = false; const ms = [], run = async (r, o) => { st.stage.ribbonList = r; st.stage.objectList = o; for (let k = 0; k < 6; k++) { e.draw(); await new Promise((res) => { const t = setInterval(() => { if (document.querySelector('#busy').hidden && !e.slStats().pending) { clearInterval(t); res(); } }, 20); }); ms.push(st.timing && st.timing.first); } }; const A = [], B = [], C = [];
    for (let rep = 0; rep < 2; rep++) { ms.length = 0; await run([], keepO); A.push(...ms.slice(1)); ms.length = 0; await run(keepR, keepO); B.push(...ms.slice(1)); ms.length = 0; await run([], []); C.push(...ms.slice(1)); } st.stage.ribbonList = keepR; st.stage.objectList = keepO; O.sliced = was; e.draw(); const mean = (x) => x.reduce((s, v) => s + v, 0) / x.length; return { withoutMs: +mean(A).toFixed(1), withMs: +mean(B).toFixed(1), noLayersMs: +mean(C).toFixed(1), n: A.length }; }); await idle(); // withoutMs = no ribbon; withMs = the whole shot; noLayersMs (M4c-2) = no ribbon and no pieces
  // ---- (iv) the blobs ----
  const grids = await ev(async ([photoB64, viewerB64, cols, rows, valid]) => {
    const load = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); return img; };
    const cut = async (b64, vw, vh) => { const img = await load(b64), c = document.createElement('canvas'); c.width = vw; c.height = vh; const x = c.getContext('2d'); x.drawImage(img, 0, 0, vw, vh, 0, 0, vw, vh); return Array.from(x.getImageData(0, 0, vw, vh).data); };
    const pi = await load(photoB64), vi = await load(viewerB64);
    return { photo: await cut(photoB64, valid[0], valid[1]), viewer: await cut(viewerB64, vi.width, vi.height), vw: vi.width, vh: vi.height, pw: pi.width, ph: pi.height };
  }, [fs.readFileSync(PHOTO).toString('base64'), png.toString('base64'), COLS, ROWS, VALID]);
  const ex = G.excludeMask(COLS, ROWS, [MINIMAP]);
  const lp = G.cellLum(Uint8ClampedArray.from(grids.photo), VALID[0], VALID[1], COLS, ROWS), lv = G.cellLum(Uint8ClampedArray.from(grids.viewer), grids.vw, grids.vh, COLS, ROWS);
  const dp = G.darkMask(lp, ex), dv = G.darkMask(lv, ex), cmp = G.compare(dv.dark, dp.dark, ex), bp = G.blobs(dp.dark, COLS, ROWS), bv = G.blobs(dv.dark, COLS, ROWS);
  const res = { viewer: R, photo: pr, ribbonCostMs: cost, off, blobs: { grid: [COLS, ROWS], excluded: ex.reduce((s, v) => s + v, 0), agreement: +cmp.agreement.toFixed(3), iouDark: +cmp.iou.toFixed(3), darkCells: { viewer: cmp.nDarkA, photo: cmp.nDarkB }, photoBlobs: bp.slice(0, 5), viewerBlobs: bv.slice(0, 5) } };
  fs.writeFileSync(path.join(IGN, EX + '_readings.json'), JSON.stringify(res, null, 1) + '\n');
  console.log(JSON.stringify({ off, viewer: R, cost, blobs: res.blobs }, null, 1));
  console.log('PHOTO blobs (# dark)\n' + G.ascii(dp.dark, ex, COLS, ROWS) + '\nVIEWER blobs\n' + G.ascii(dv.dark, ex, COLS, ROWS));
  // ---- (v) the side-by-side, ONLY in tools/ui/out/m4c/ ----
  if (!process.argv.includes('--no-compose')) {
    const side = await ev(async ([photoB64, viewerB64, valid, dpA, dvA, cols, rows, ex]) => {
      const load = async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); return i; }, pi = await load(photoB64), vi = await load(viewerB64), sc = vi.width / valid[0] > 1 ? 1 : 1, cw = 1000, ch = Math.round(cw * valid[1] / valid[0]), c = document.createElement('canvas'); c.width = cw * 2 + 10; c.height = ch * 2 + 10; const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(pi, 0, 0, valid[0], valid[1], 0, 0, cw, ch); x.drawImage(vi, 0, 0, vi.width, vi.height, cw + 10, 0, cw, ch);
      const grid = (A, ox, oy) => { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i; x.fillStyle = ex[k] ? '#444' : A[k] ? '#000' : '#fff'; x.fillRect(ox + i * cw / cols, oy + j * ch / rows, cw / cols + 0.5, ch / rows + 0.5); } };
      grid(dpA, 0, ch + 10); grid(dvA, cw + 10, ch + 10); return c.toDataURL('image/png').split(',')[1]; }, [fs.readFileSync(PHOTO).toString('base64'), png.toString('base64'), VALID, Array.from(dp.dark), Array.from(dv.dark), COLS, ROWS, Array.from(ex)]);
    fs.writeFileSync(path.join(IGN, EX + '_side_by_side.png'), Buffer.from(side, 'base64')); console.log('side-by-side: ' + path.join(IGN, EX + '_side_by_side.png') + ' (ignored by git)');
  }
  console.log('page errors', a.errs.length, '| seconds', ((Date.now() - T0) / 1000).toFixed(0)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
