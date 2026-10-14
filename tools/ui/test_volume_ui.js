/* Crystallizer 6 (Macroform), the volume view of the source "Snake Mountain macroform": the painter's order of src/volume.js against a PER-PIXEL Z-BUFFER reference (the product has no z-buffer; the reference is the test's).
   Both are software rasterizations of the SAME faces (E.volume.faces), pixel-centre sampled, so the difference is the painter ORDER only: the painter overwrites in list order, the reference keeps the nearest face per pixel
   (nearness = depth along the view direction of an orthographic camera, affine on a face). Every view kind (exterior, quadrant removed, interior only, horizontal cut at floor 1 / 2 / 3) at Cam 1 / 2 / 3 / 4 / 5 and yaw offsets
   0 / +10 / -10, 640 x 480. Reported: pixels that differ / pixels covered by either (mean and worst over the combinations). Also: the controls (the selector, its chips, greyed at Cam 6 / 7, Off = the heightmap), the scenario,
   one panel only, and the section faces. Run: NODE_PATH=$(npm root -g) node tools/ui/test_volume_ui.js */
const crypto = require('crypto'), { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, ev = (f, x) => page.evaluate(f, x);
  const info = () => page.$eval('#info', (e) => e.textContent);
  await page.selectOption('#src', 'snake_macroform'); await a.idle();
  ok('the Macroform block is shown for the volume source (Off selected: the heightmap exterior, four compare panels)', !(await page.$eval('#macro', (e) => e.hidden)) && (await page.$eval('#macroView', (e) => e.value)) === 'off' && (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 4);
  const KINDS = [['exterior', 1], ['quad', 1], ['interior', 1], ['cut', 1], ['cut', 2], ['cut', 3]], PRE = ['isoE', 'isoW', 'oblique', 'low', 'top'], DY = [0, 10, -10];
  const rows = [];
  const shoot = async (kind, floor, pre, dy, order) => {
    const r = await ev(({ kind, floor, pre, dy, order }) => {
      const E = window.EVO, e = window.__evo, pack = e.packs[e.st.pack].pack, W = 640, H = 480, P0 = { yawOf: { isoE: 45, isoW: -45, oblique: 0, low: 0, top: 0 }, pit: { isoE: 35, isoW: 35, oblique: 50, low: 28, top: 80 } };
      const view = { kind: 'ortho', yaw: P0.yawOf[pre] + dy, pitch: P0.pit[pre], zoom: 1, panX: 0, panY: 0 }, shape = E.volume.camShape(E.volume.prep(pack));
      view.fitSc = E.fitScale(shape, { terH: 1 }, view, W, H); const cam = E.makeCam(shape, { terH: 1 }, view, W, H);
      const F = E.volume.faces(pack, { kind, floor }, view); let faces = F.faces; if (order === 'reversed') faces = faces.slice().reverse(); if (order === 'centre') faces = faces.slice().sort((p, q) => { const c = (f) => f.pts.reduce((t, [x, y]) => t + cam.ry(x, y), 0); return c(p) - c(q); }); const pit = view.pitch * Math.PI / 180, near = (x, y, z) => cam.ry(x, y) * Math.cos(pit) + z * Math.sin(pit);
      const painter = new Int32Array(W * H), zb = new Int32Array(W * H), zd = new Float64Array(W * H).fill(-1e30);
      faces.forEach((f, idx) => {
        const sp = f.pts.map(([x, y, z]) => cam.p(x, y, z)), nr = f.pts.map(([x, y, z]) => near(x, y, z));
        let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9; for (const p of sp) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
        const area = ((sp[1][0] - sp[0][0]) * (sp[2][1] - sp[0][1]) - (sp[2][0] - sp[0][0]) * (sp[1][1] - sp[0][1]));
        if (Math.abs(area) < 1e-6) return; // edge-on
        // depth plane n = A sx + B sy + C through the first three vertices
        const [p0, p1, p2] = sp, d1x = p1[0] - p0[0], d1y = p1[1] - p0[1], d2x = p2[0] - p0[0], d2y = p2[1] - p0[1], det = d1x * d2y - d2x * d1y, dn1 = nr[1] - nr[0], dn2 = nr[2] - nr[0];
        const A = (dn1 * d2y - dn2 * d1y) / det, B = (d1x * dn2 - d2x * dn1) / det, C = nr[0] - A * p0[0] - B * p0[1];
        const sgn = area > 0 ? 1 : -1;
        for (let py = Math.max(0, Math.floor(miny)); py <= Math.min(H - 1, Math.ceil(maxy)); py++) for (let px = Math.max(0, Math.floor(minx)); px <= Math.min(W - 1, Math.ceil(maxx)); px++) {
          const cx = px + 0.5, cy = py + 0.5; let inside = true;
          for (let i = 0; i < 4 && inside; i++) { const u = sp[i], v = sp[(i + 1) % 4]; if (sgn * ((v[0] - u[0]) * (cy - u[1]) - (v[1] - u[1]) * (cx - u[0])) < -1e-9) inside = false; }
          if (!inside) continue;
          const k = py * W + px; painter[k] = idx + 1; const d = A * cx + B * cy + C; if (d >= zd[k] - 1e-9) { zd[k] = d; zb[k] = idx + 1; }
        }
      });
      let cov = 0, diff = 0; for (let k = 0; k < W * H; k++) { if (painter[k] || zb[k]) { cov++; if (painter[k] !== zb[k]) diff++; } }
      return { faces: faces.length, cov, diff, section: F.stats.cutFaces };
    }, { kind, floor, pre, dy, order });
    return Object.assign({ kind: kind === 'cut' ? 'cut' + floor : kind, pre, dy }, r);
  };
  for (const [kind, floor] of KINDS) for (const pre of PRE) for (const dy of DY) rows.push(await shoot(kind, floor, pre, dy, 'painter'));
  const pct = (r) => 100 * r.diff / Math.max(1, r.cov);
  console.log('MEASURED: pixels that differ from the z-buffer / pixels covered, % (mean, worst), faces; 640 x 480, yaw offsets 0 / +10 / -10');
  for (const kind of ['exterior', 'quad', 'interior', 'cut1', 'cut2', 'cut3']) {
    let line = `  ${kind.padEnd(9)}`; for (const pre of PRE) { const rs = rows.filter((r) => r.kind === kind && r.pre === pre), m = rs.reduce((s, r) => s + pct(r), 0) / rs.length, w = Math.max(...rs.map(pct)); line += ` ${pre}: ${m.toFixed(3)} / ${w.toFixed(3)} (${rs[0].faces})`; }
    console.log(line);
  }
  const worst = Math.max(...rows.map(pct)), mean = rows.reduce((s, r) => s + pct(r), 0) / rows.length;
  console.log(`  overall: mean ${mean.toFixed(4)} %, worst ${worst.toFixed(4)} % of ${rows.length} combinations`);
  ok(`ENFORCED (= the measured value): the painter's order equals the z-buffer on every combination: worst ${worst.toFixed(4)} % (${Math.max(...rows.map((r) => r.diff))} px) of ${rows.length}`, rows.every((r) => r.diff === 0 && r.cov > 5000), { worst });
  // controls: the reference must be able to FAIL: a reversed order and an order by the centre of the face (the naive one) are measured with the same reference
  const rev = await shoot('exterior', 1, 'isoE', 0, 'reversed'), cen = await shoot('exterior', 1, 'isoE', 0, 'centre'), cenQ = await shoot('quad', 1, 'oblique', 10, 'centre');
  ok(`control: the reference catches a wrong order (reversed list: ${pct(rev).toFixed(2)} % of the pixels differ)`, pct(rev) > 5, pct(rev));
  console.log(`MEASURED control (not enforced): painter by the projected depth of the face centre instead of the exact order: exterior Cam 1 ${pct(cen).toFixed(3)} %, quadrant Cam 3 yaw +10 ${pct(cenQ).toFixed(3)} % differ`);
  // section faces: a cut and a removed quadrant have them, the closed exterior and the interior-only view do not
  const sec = Object.fromEntries(['exterior', 'quad', 'interior', 'cut1'].map((k) => [k, rows.find((r) => r.kind === k && r.pre === 'isoE' && r.dy === 0).section]));
  ok('section faces (their own colour): none in the Exterior and in Interior only, some in the Quadrant view and in the Horizontal cut', sec.exterior === 0 && sec.interior === 0 && sec.quad > 20 && sec.cut1 > 20, sec);
  // the view in the page: one panel, the caption, the info line with the vertical scale, the chips
  await page.selectOption('#macroView', 'exterior'); await a.preset('isoE'); await a.idle();
  ok('Exterior: ONE panel (no compare grid), captioned with its face counts', (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 1 && /Macroform · Exterior/.test(await page.$eval('#stage figcaption', (e) => e.textContent)));
  const t = await info(); ok('the info line states the vertical scale of the volume and that it differs from the heightmap (Off)', /VERTICAL SCALE/.test(t) && /1 tile of height = 1 tile of width/.test(t) && /5 terraces of 1 tile/.test(t), t.slice(-330));
  ok('the chips of the cut appear only with Horizontal cut (Floor 1 / 2 / 3)', (await page.$eval('#macroChips', (e) => e.hidden)) === true && (await (async () => { await page.selectOption('#macroView', 'cut'); await a.idle(); return page.$$eval('#macroChips button', (b) => b.map((x) => x.textContent).join()); })()) === 'Floor 1,Floor 2,Floor 3' && !(await page.$eval('#macroChips', (e) => e.hidden)));
  await page.click('#macroChips button[data-macro-floor="3"]'); await a.idle(); ok('a chip chooses the floor of the cut (caption)', /Horizontal cut 3/.test(await page.$eval('#stage figcaption', (e) => e.textContent)));
  const hs = {}; for (const k of ['exterior', 'quad', 'interior', 'cut']) { await page.selectOption('#macroView', k); await a.idle(); hs[k] = crypto.createHash('md5').update(await a.canvas()).digest('hex'); }
  ok('the four view kinds are four different pictures', new Set(Object.values(hs)).size === 4, hs);
  // cameras: Cam 6 and Cam 7 are greyed (the options) and fall back to the heightmap exterior
  await page.selectOption('#macroView', 'exterior'); await a.preset('stage'); await a.idle();
  const opts = await page.$$eval('#macroView option', (o) => o.map((x) => x.value + ':' + (x.disabled ? 'off' : 'on')).join());
  ok('Cam 6: Exterior, Quadrant, Interior and Cut are greyed ("Requires: use Cam 1-5"), Off stays', opts === 'off:on,exterior:off,quad:off,interior:off,cut:off' && /Cam 1-5/.test(await page.$eval('#macroView option[value="quad"]', (o) => o.title)), opts);
  ok('Cam 6: the heightmap exterior is drawn (four compare panels) and the info line says so', (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 4 && /Cam 6 and Cam 7 are not supported in the volume view/.test(await info()));
  await a.preset('classic'); await a.idle(); ok('Cam 7 falls back the same way', (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 4 && /not supported in the volume view/.test(await info()));
  await a.preset('isoE'); await a.idle(); ok('back at Cam 1 the volume is drawn again (one panel)', (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 1);
  await page.selectOption('#macroView', 'off'); await a.idle(); ok('Off: the existing heightmap exterior again (four panels, Box / A / B / C)', (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 4);
  // the scenario button and the other sources
  await ev(() => window.__evo.scenario('snake_macro')); await a.idle();
  const sc = await ev(() => { const e = window.__evo; return [e.st.pack, e.st.macro, e.st.preset, e.st.mode, e.st.tech]; });
  ok('the scenario "Snake · Macroform": the volume source, Exterior, Cam 1, a single view', sc.join() === 'snake_macroform,exterior,isoE,single,box' && (await page.$$eval('#stage figure', (f) => f.filter((x) => !x.hidden).length)) === 1, sc);
  await page.selectOption('#src', 'snake_surface'); await a.idle();
  ok('a source without a volume: no Macroform block, the heightmap exterior', (await page.$eval('#macro', (e) => e.hidden)) === true && (await ev(() => window.__evo.st.macro)) === 'off');
  console.log('errors:', a.errs); ok('no page errors', a.errs.length === 0); await a.browser.close();
})();
