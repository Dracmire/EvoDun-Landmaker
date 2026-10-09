/* Ascension walls: painter order against a per-pixel z-buffer reference (as test_ramp_ui for the ramps), the pixel regression with the switch off, and what the cut keeps visible.
   The viewer is rendered in debug mode (flat grey terrain, pure red for the Ascension walls); a reference rasterizer draws the true geometry (flat tile tops, vertical walls between tiles, down to the base over void,
   and the wall boxes with their cut for that camera) with a depth buffer and says, per pixel, whether the front-most surface is an Ascension wall. Differing pixels are counted in a box around each run, for four
   Oblique 50 and four Iso 45 directions, in Box, A and B, with the default smoothing and with none (tile-exact A / B). Pixels within 1 px of a class border (anti-aliasing) are ignored.
     NODE_PATH=$(npm root -g) node tools/ui/test_asc_ui.js [--runs 10] [--only <run id>] */
const path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const PAGE = async ({ nRuns, px, only }) => {
  const E = window.EVO, ev = window.__evo, pack = ev.packs[ev.st.pack].pack, CW = 520, CH = 420;
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${CW}px;height:${CH}px;z-index:-1`; document.body.appendChild(cv);
  const views = [['oblique', 0, 50], ['oblique', 90, 50], ['oblique', 180, 50], ['oblique', 270, 50], ['iso', 45, 35], ['iso', 135, 35], ['iso', 225, 35], ['iso', 315, 35]];
  const shapes = {}; for (const smooth of [true, false]) { const P = Object.assign({}, ev.P, { ascWalls: true, stairW: 0, pocket: false }, smooth ? {} : { smooth: 0, radius: 0 }); shapes[smooth] = { P, S: E.shape(pack, P, null) }; }
  const S0 = shapes[true].S, runs = S0.ascWalls.runs, step = Math.max(1, Math.floor(runs.length / nRuns)), picks = []; for (let r = 0; r < runs.length && picks.length < nRuns; r += step) picks.push(r);
  if (only >= 0) { picks.length = 0; picks.push(only); }
  function reference(S, cam, view) {
    const W = S.W, H = S.H, yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const zOf = (x, y, h) => ((sy * (x - W / 2) + cy * (y - H / 2)) * cp + h * sp), zb = new Float32Array(CW * CH).fill(-1e9), own = new Uint8Array(CW * CH);
    const tri = (A, B, C, o) => { const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(CW - 1, Math.ceil(Math.max(A[0], B[0], C[0]))), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(CH - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]); if (Math.abs(d) < 1e-9) return;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x + 0.5, py = y + 0.5, l1 = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d, l2 = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d, l3 = 1 - l1 - l2;
        if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue; const z = l1 * A[2] + l2 * B[2] + l3 * C[2], k = y * CW + x; if (z > zb[k]) { zb[k] = z; own[k] = o; } } };
    const V = (x, y, h) => { const p = cam.p(x, y, h); return [p[0], p[1], zOf(x, y, h)]; }, quad = (a, b, c, d, o) => { tri(a, b, c, o); tri(a, c, d, o); };
    const hOf = (j) => S.levelH[S.fine[j]], isVoid = (j) => !!(S.void && S.void[j]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (isVoid(i)) continue; const h = hOf(i);
      quad(V(x, y, h), V(x + 1, y, h), V(x + 1, y + 1, h), V(x, y + 1, h), 2);
      for (const [dx, dy, ax, ay, bx, by] of [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]]) { const nx = x + dx, ny = y + dy, out = nx < 0 || ny < 0 || nx >= W || ny >= H || isVoid(ny * W + nx), hn = out ? cam.base : hOf(ny * W + nx); if (hn >= h - 1e-6) continue; quad(V(x + ax, y + ay, hn), V(x + bx, y + by, hn), V(x + bx, y + by, h), V(x + ax, y + ay, h), 3); } }
    for (const w of S.ascWalls.faces) { // the wall boxes, with the cut of this camera
      const low = E.roomTypes.ascWallLow(w, cam), T = E.roomTypes, hb = w.hb, ht = hb + (low ? T.ASC_LOW : S.ascWalls.height), [x0, x1, y0, y1] = T.ascBox(w);
      for (const [ax, ay, bx, by] of [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]]) quad(V(ax, ay, hb), V(bx, by, hb), V(bx, by, ht), V(ax, ay, ht), 1);
      quad(V(x0, y0, ht), V(x1, y0, ht), V(x1, y1, ht), V(x0, y1, ht), 1);
    }
    return own;
  }
  const rows = {}, results = []; let worst = null;
  for (const smooth of [true, false]) for (const tech of ['box', 'A', 'B']) {
    if (!smooth && tech === 'box') continue; const { P, S } = shapes[smooth];
    for (const rid of picks) { const run = S.ascWalls.runs[rid], fs = S.ascWalls.faces.filter((f) => f.run === rid), fm = fs[fs.length >> 1], cx = fm.dir === 0 ? fm.x + 1 : fm.x + 0.5, cyy = fm.dir === 0 ? fm.y + 0.5 : fm.y + 1;
      for (const [vname, yaw, pitch] of views) {
        const view = { yaw, pitch, zoom: 1, panX: 0, panY: 0 }; let cam = E.makeCam(S, P, view, CW, CH); view.zoom = px / cam.sc; cam = E.makeCam(S, P, view, CW, CH);
        const c = cam.p(cx, cyy, fm.hb); view.panX = CW / 2 - c[0]; view.panY = CH / 2 - c[1]; cam = E.makeCam(S, P, view, CW, CH);
        E.render(cv, S, P, tech, view, { debug: true }); const img = cv.getContext('2d').getImageData(0, 0, CW, CH).data, ref = reference(S, cam, view);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const f of fs) for (const [ox, oy] of f.dir === 0 ? [[f.x + 1, f.y], [f.x + 1, f.y + 1]] : [[f.x, f.y + 1], [f.x + 1, f.y + 1]]) for (const h of [f.hb, f.hb + S.ascWalls.height]) { const q = cam.p(ox, oy, h); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
        const m = 1.5 * cam.sc; x0 = Math.max(2, Math.floor(x0 - m)); y0 = Math.max(2, Math.floor(y0 - m)); x1 = Math.min(CW - 3, Math.ceil(x1 + m)); y1 = Math.min(CH - 3, Math.ceil(y1 + m));
        const isR = (k) => img[k * 4] - img[k * 4 + 1] > 60; let diff = 0, total = 0;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * CW + x, a = ref[k] === 1, b = isR(k); let edge = false;
          for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const k2 = (y + dy) * CW + x + dx; if ((ref[k2] === 1) !== a || isR(k2) !== b) { edge = true; break; } }
          if (a || b) total++; if (a !== b && !edge) diff++; }
        const pct = total ? 100 * diff / total : 0;
        if (!worst || pct > worst.pct) { const out = document.createElement('canvas'); out.width = CW; out.height = CH; const oc = out.getContext('2d'), id = oc.createImageData(CW, CH);
          for (let k = 0; k < CW * CH; k++) { const a = ref[k] === 1, b = isR(k), base = a ? 90 : 25; id.data[k * 4] = a !== b && !b ? 30 : a !== b ? 255 : base; id.data[k * 4 + 1] = a !== b ? 30 : base; id.data[k * 4 + 2] = a !== b && !b ? 255 : base; id.data[k * 4 + 3] = 255; }
          oc.putImageData(id, 0, 0); const dbg = cv.toDataURL('image/png'); E.render(cv, S, P, tech, view, { outlines: true, gradient: true }); worst = { pct, desc: `${smooth ? 'smooth' : 'exact'} ${tech} ${vname} ${yaw} run #${rid}`, mask: out.toDataURL('image/png'), dbg, shot: cv.toDataURL('image/png') }; }
        const key = `${smooth ? 'default smoothing' : 'no smoothing'}|${tech}|${vname} ${yaw}`;
        (rows[key] || (rows[key] = { n: 0, sum: 0, max: 0 })); rows[key].n++; rows[key].sum += pct; rows[key].max = Math.max(rows[key].max, pct); results.push({ smooth, tech, vname, yaw, pct, diff, total, run: rid });
      } } }
  return { worst, rows, top: results.slice().sort((p, q) => q.pct - p.pct).slice(0, 8).map((r) => `${r.pct.toFixed(2)}% (${r.diff}/${r.total} px) ${r.smooth ? 'smooth' : 'exact'} ${r.tech} ${r.vname} ${r.yaw} run #${r.run}`), picks: picks.length, runs: runs.length, total: results.length };
};
const VIS = async () => { // what the walls hide: Balanced types, Iso 45, whole map, the pick (id) render of the Box technique
  const E = window.EVO, ev = window.__evo, pack = ev.packs[ev.st.pack].pack, CW = 2400, CH = 1400;
  const P = Object.assign({}, ev.P, { ascWalls: true }), S = E.shape(pack, P, null), view = { yaw: 45, pitch: 35, zoom: 1, panX: 0, panY: 0 };
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${CW}px;height:${CH}px;z-index:-1`; document.body.appendChild(cv);
  const counts = (o) => { E.render(cv, S, P, 'box', view, Object.assign({ pick: true, pickWalls: true }, o)); const d = cv.getContext('2d').getImageData(0, 0, CW, CH).data, c = new Int32Array(S.n);
    for (let k = 0; k < CW * CH; k++) { if (d[k * 4 + 3] !== 255) continue; const code = (d[k * 4] << 16) | (d[k * 4 + 1] << 8) | d[k * 4 + 2], kind = code >> 20, v = code & 0xfffff; if (kind === 4 && v < S.n) c[v]++; } return c; };
  const cam = E.makeCam(S, P, view, CW, CH), none = (() => { const w = S.ascWalls; S.ascWalls = null; const c = counts({}); S.ascWalls = w; return c; })(), full = counts({ ascNoCut: true }), cut = counts({});
  const tiles = []; for (let i = 0; i < S.n; i++) if (S.roomType[i] === 3 && !S.block[i] && S.region[i] >= 0 && none[i] >= 6) tiles.push(i);
  const stat = (c) => { let vis = 0, frac = 0; for (const i of tiles) { const f = Math.min(1, c[i] / none[i]); frac += f; if (f >= 0.5) vis++; } return { visible: 100 * vis / tiles.length, meanFraction: 100 * frac / tiles.length }; };
  return { tiles: tiles.length, pxPerTile: cam.sc, none: stat(none), full: stat(full), cut: stat(cut), faces: S.ascWalls.info.faces, runs: S.ascWalls.info.runs };
};
const argNum = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
(async () => {
  const a = await open({ w: 900, h: 700 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  const r = await page.evaluate(PAGE, { nRuns: argNum('--runs', 10), px: argNum('--px', 30), only: argNum('--only', -1) });
  console.log(`${r.runs} runs of walls, ${r.picks} tested x ${r.total / r.picks} renders`);
  const groups = {}; for (const [key, v] of Object.entries(r.rows)) { const [sm, tech, vname] = key.split('|'); const g = `${sm} | ${tech}`; (groups[g] || (groups[g] = {}))[vname] = v; }
  console.log('\n| smoothing | technique | mean % over views | worst % (any view) | worst view |\n|---|---|---:|---:|---|');
  for (const [g, vs] of Object.entries(groups)) { const all = Object.values(vs), mean = all.reduce((s, v) => s + v.sum / v.n, 0) / all.length, mx = Math.max(...all.map((v) => v.max)), wv = Object.entries(vs).sort((p, q) => q[1].max - p[1].max)[0][0];
    console.log(`| ${g.split(' | ')[0]} | ${g.split(' | ')[1]} | ${mean.toFixed(2)} | ${mx.toFixed(2)} | ${wv} |`);
    const box = g.includes('| box'); ok(`wall order ${g}: ${box ? 'mean <= 2 %, worst <= 8 %' : 'mean <= 2 %, worst <= 8 %'}`, mean <= 2 && mx <= 8, `mean ${mean.toFixed(2)} worst ${mx.toFixed(2)}`); }
  console.log('\ntop cases:\n' + r.top.join('\n'));
  const v = await page.evaluate(VIS);
  console.log(`\nvisibility of the walkable tiles of Ascension rooms (Balanced types, Iso 45, whole map, ${v.tiles} tiles, ${v.pxPerTile.toFixed(1)} px per tile; Box id render): without walls ${v.none.visible.toFixed(1)} % tiles with >= 50 % of their pixels visible (mean ${v.none.meanFraction.toFixed(1)} %); walls FULL height on every face ${v.full.visible.toFixed(1)} % (mean ${v.full.meanFraction.toFixed(1)} %); with the CUT ${v.cut.visible.toFixed(1)} % (mean ${v.cut.meanFraction.toFixed(1)} %)${v.cut.visible < 90 ? '   -> BELOW 90 %' : ''}`);
  ok('the cut hides less than full walls (visible tiles with cut >= with full walls)', v.cut.visible >= v.full.visible - 1e-9 && v.cut.meanFraction >= v.full.meanFraction - 1e-9);
  if (process.argv.includes('--out')) { const fs = require('fs'), d = process.argv[process.argv.indexOf('--out') + 1]; fs.mkdirSync(d, { recursive: true }); for (const [k, f] of [['mask', 'mask'], ['dbg', 'debug'], ['shot', 'shot']]) fs.writeFileSync(path.join(d, `asc_worst_${f}.png`), Buffer.from(r.worst[k].split(',')[1], 'base64')); console.log('worst:', r.worst.desc); }
  // UI: the switch (off = the same picture), the info line, an Ascension room chosen by chip, pick unchanged
  const crypto = require('crypto'), hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  ok('slider "Ascension wall height" 0.5-3, default 1.5', JSON.stringify(await page.$eval('#s-ascHeight', (e) => [+e.min, +e.max, +e.value])) === '[0.5,3,1.5]');
  await page.click('#mode'); await a.idle(); await a.tech('A'); await a.preset('isoE'); await page.click('#wholeRooms'); await a.idle();
  await page.check('#t-ascWalls'); await a.idle(); await page.uncheck('#t-ascWalls'); await a.idle(); // warm-up (the first draw after a slice change differs by a transient)
  const h0 = await hash(); await page.check('#t-ascWalls'); await a.idle(); const h1 = await hash(), info1 = await page.evaluate(() => document.querySelector('#info').textContent);
  ok('the switch "Ascension walls" changes the picture and the info line reports faces and runs', h1 !== h0 && /Ascension walls: \d+ faces in \d+ (runs|chains)/.test(info1), (info1.match(/Ascension walls[^·]*/) || [''])[0]);
  const sel = await page.evaluate(() => { const S = window.__evo.S(), cnt = new Map(); for (const w of S.ascWalls.faces) for (const t of [w.i, w.j]) { const r = S.roomMap[t]; if (S.types.rooms.get(r).type === 3) cnt.set(r, (cnt.get(r) || 0) + 1); } let br = 0, bv = 0; for (const [r, v] of cnt) if (v > bv) { bv = v; br = r; } return { room: br, faces: bv }; });
  const pickDiff = await page.evaluate(() => { const e = window.__evo, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), pk = () => { const out = []; for (let y = 60; y < cv.clientHeight - 40; y += Math.floor(cv.clientHeight / 6)) for (let x = 60; x < cv.clientWidth - 40; x += Math.floor(cv.clientWidth / 6)) out.push(window.EVO.pickTile(S, P, 'A', e.view(), cv.clientWidth, cv.clientHeight, x, y).tile); return out; }; const a = pk(), w = S.ascWalls; S.ascWalls = null; const b = pk(); S.ascWalls = w; return { n: a.length, diff: a.filter((v, i) => v !== b[i]).length }; }); // same shape, same canvas: with and without the walls (the info line changes the canvas size when toggling, so the shape itself is compared)
  await page.uncheck('#t-ascWalls'); await a.idle(); const h2 = await hash();
  ok('switch off again: the identical picture; pick returns the same tiles with and without walls (the walls are not selectable)', h2 === h0 && pickDiff.diff === 0 && pickDiff.n > 20, JSON.stringify([h2 === h0, pickDiff]));
  await page.check('#t-ascWalls'); await a.idle(); await page.click(`#roomChips .chip[data-id="${sel.room}"]`); await a.idle();
  const ch = await page.evaluate(() => { const S = window.__evo.S(); return { n: S.ascWalls ? S.ascWalls.faces.length : -1, type: [...new Set(Array.from(S.roomMap).filter((r) => r > 0))].map((r) => S.types.rooms.get(r).type).includes(3) }; });
  ok(`an Ascension room chosen by chip (room ${sel.room}, ${sel.faces} wall faces in the world) keeps its walls (${ch.n} faces in the slice window)`, ch.n > 0, JSON.stringify(ch));
  console.log('errors:', a.errs); ok('no console errors', a.errs.length === 0); await a.browser.close();
})();
