/* DAC v2 PR D (D32): crops and visibility of the corridor Dioramas.
     node tools/ui/shoot_diocorr.js <spec.json> [--out <dir>]
   spec = [{ name, id, K, flags, terH, room, tiles, cams }]: `id` an example id ('real_balanced', 'real_chain5'), `K` 1 / 0 (sub-objective on / off), `flags` test hooks written to P (dioForce, dioFlat, dioFlatTop, dioSnap, dioCimaCut, dioMirFlip, dioHitoFar, dioMin ...), `terH`, `room` the moved Diorama to frame,
   `tiles` the view width in tiles (default: the structure + margin), `cams` ['cam1', 'cam3'] (Cam 1 = Iso 45, Cam 3 = Oblique 50).
   Writes <out>/<name>_<cam>.png and prints one JSON line per shot: the visibility of the footprint, the landing, every bridge, the pocket and the landmark as COUNTS [visible, in view, total] (Box pick render with the walls as occluders; only the tiles inside the view count),
   plus the landmark measure (height over the platform front). Counts, never bare percentages: the share of a few tiles is unstable across crops. Needs Playwright + Chromium (tools/ui/common.js). */
const fs = require('fs'), path = require('path'), { open } = require('./common.js');
const args = process.argv.slice(2), specFile = args.find((a) => !a.startsWith('--')), oi = args.indexOf('--out'), OUT = oi >= 0 ? args[oi + 1] : path.join(__dirname, '../../docs/crystallizers/02-room-types/shots');
if (!specFile) { console.error('usage: node tools/ui/shoot_diocorr.js <spec.json> [--out <dir>]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const specs = JSON.parse(fs.readFileSync(specFile, 'utf8')), HOOKS = ['dioForce', 'dioFlat', 'dioFlatTop', 'dioSnap', 'dioCimaCut', 'dioMirFlip', 'dioHitoFar', 'dioMin', 'dioMax', 'dioPair', 'dioPerim', 'dioCap', 'dioSkip', 'dioNoFallback', 'dioBridgeAdj', 'dioAxisSep', 'dioCimaThr', 'dioClose'];
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const frame = (o) => ev(({ room, tiles }) => { const E = window.EVO, e = window.__evo, S = e.S(), n = S.n, W = S.W, it = e.P.dioPlan && e.P.dioPlan.items.find((q) => q.room === room && q.eligible); if (!it) return null;
    const core = [...it.dst, ...it.landing, ...it.bridges.flatMap((b) => [...b.inner, ...b.lat, b.from, b.to])]; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (const t of core) { const x = t % W, y = (t / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const hito = it.prof.hito, tl = tiles || Math.max(40, Math.ceil(Math.max(x1 - x0, y1 - y0) * 1.2 + 14)), mid = [(x0 + x1) / 2 + 0.5, (y0 + y1) / 2 + 0.5], Href = S.levelH[S.fine[it.landing[0]]], cv = document.querySelector('#stage canvas'), z = (cv.clientWidth / tl) / e.st.fitSc, v = e.view(); v.zoom = z; v.panX = 0; v.panY = 0;
    const p0 = E.makeCam(S, e.P, v, cv.clientWidth, cv.clientHeight).p(mid[0], mid[1], Href); e.st.zoom = z; e.st.panX = cv.clientWidth / 2 - p0[0]; e.st.panY = cv.clientHeight / 2 - p0[1]; e.draw();
    const cam = E.makeCam(S, e.P, e.view(), cv.clientWidth, cv.clientHeight), dpr = cv.width / cv.clientWidth, cw = cv.width, ch = cv.height, seen = new Uint8Array(n); E.render(cv, S, e.P, 'box', e.view(), { pick: true, pickWalls: true }); const dd = cv.getContext('2d').getImageData(0, 0, cw, ch).data;
    for (let q = 0; q < cw * ch; q++) { const code = (dd[4 * q] << 16) | (dd[4 * q + 1] << 8) | dd[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (dd[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n) seen[t] = 1; } e.draw();
    const cnt = (tl2) => { let iv = 0, sv = 0; for (const t of tl2) { const q = cam.p((t % W) + 0.5, ((t / W) | 0) + 0.5, S.levelH[S.fine[t]]), px = q[0] * dpr, py = q[1] * dpr; if (px >= 0 && py >= 0 && px < cw && py < ch) { iv++; if (seen[t]) sv++; } } return [sv, iv, tl2.length]; };
    return { tilesAcross: tl, terH: e.P.terH, type: it.type, step: it.step, ring: it.ring, shift: it.shift, bridgeLens: it.bridgeLens, gap: it.gapC, footprint: cnt(it.dst), landing: cnt(it.landing), bridges: it.bridges.map((b) => cnt([...b.inner, ...b.lat, b.from, b.to])), pocket: cnt(it.pocket),
      hito: hito ? { centre: [hito.x, hito.y], visible: cnt(hito.tiles), aboveFrontTerH: +hito.aboveTerH.toFixed(2), top: +hito.top.toFixed(2), front: +hito.front.toFixed(2), pond: hito.pond ? cnt(hito.pond.tiles) : null } : null, flat: it.prof.flat, slopeNoCliff: it.prof.slopeNoCliff, levels: S.levelH.length }; }, o);
  await ev(() => window.__evo.setMode('rooms')); await a.idle();
  let last = '';
  for (const sp of specs) {
    const key = sp.id + '|' + sp.K; if (key !== last) { await page.click(`#examples button[data-id="${sp.id}"]`); await a.idle(); await a.tech('A'); if (sp.K === 0) { await ev(() => { window.__evo.inc.objectives.splice(0, window.__evo.inc.objectives.length - 1); }); await page.selectOption('#roomRule', 'route'); await a.idle(); await page.selectOption('#roomRule', 'v164'); await a.idle(); } last = key; }
    await a.slider('terH', sp.terH || 1);
    await ev(({ hooks, f }) => { const P = window.__evo.P; for (const k of hooks) P[k] = undefined; Object.assign(P, f); }, { hooks: HOOKS, f: sp.flags || {} });
    await page.selectOption('#dioChain', 'off'); await a.idle(); await page.selectOption('#dioChain', 'corr'); await a.idle();
    const moved = await ev(() => (window.__evo.P.dioPlan ? window.__evo.P.dioPlan.items.map((q) => [q.room, q.eligible ? q.step : 'no']) : null));
    for (const [cam, cn] of [['isoE', 'cam1'], ['oblique', 'cam3']]) { if (sp.cams && !sp.cams.includes(cn)) continue; await a.preset(cam); await a.idle(); const m = await frame(sp); if (!m) { console.log(JSON.stringify({ name: sp.name, cam: cn, error: 'room not moved', moved })); continue; } await a.idle();
      const cv = await page.$('#stage canvas'); await cv.screenshot({ path: path.join(OUT, `${sp.name}_${cn}.png`) }); console.log(JSON.stringify({ name: sp.name, cam: cn, room: sp.room, ...m })); }
  }
  console.log('errors', JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
