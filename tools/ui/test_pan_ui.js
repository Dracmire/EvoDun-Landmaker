/* PAN WITH A CACHED BITMAP (PR E2, option "Pan with a cached bitmap", `O.panCache`, off by default; `panFrame` / `panLayer` in src/ui.js, `E.renderLayer` / `E.blitPan` in src/render.js).
   (i) AT REST: after a real shift-drag (Playwright mouse events, 6 moves; at least one frame is the blit) the canvas is BYTE-IDENTICAL to a fresh `E.render` at that position (the frame at rest is the normal full render). Combinations as test_cull_ui.js: technique A and B, Off / M2 / Corridor,
   terH 1 / 3 / 6, Cam 1 and Cam 3, 20 / 30 / 60 px per tile, 14 positions (default: 4 per combination in rotation; `--full`: all).
   (ii) MID-GESTURE: the blit frame (`__evo.panFrameTest`) vs a fresh render at the same pan: the number of differing pixels and the largest channel difference are REPORTED (the layer is rendered on a transparent background and composited over the panel gradient, so a few anti-aliased silhouette pixels may differ by rounding); asserted: <= 0.5 % of the pixels
   and a channel difference <= 8 (a stale layer differs in far more).
   (iii) INVALIDATION: after a change of terH, of the technique and of a display option (outlines) the next blit frame equals a fresh render (within the tolerance of (ii)); MUTATION: with `E.panNoInvalidate` (no validity check) the same checks FAIL (the frame shows the old state).
     NODE_PATH=$(npm root -g) node tools/ui/test_pan_ui.js [--full] */
const { open } = require('./common');
const ONLY = process.env.PAN_ONLY ? process.env.PAN_ONLY.split(',') : null, FULL = process.argv.includes('--full'), ZOOMS = [20, 30, 60], THS = [1, 3, 6], MODES = ['off', 'm2', 'corr'], TECHS = ['A', 'B'], CAMS = ['isoE', 'oblique'];
const POSITIONS = () => { const e = window.__evo, E = window.EVO, S = e.S(), P = e.P, W = S.W, H = S.H, out = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3], [W >> 1, 2], [W - 3, H >> 1], [W >> 1, H - 3], [2, H >> 1], [W >> 1, H >> 1]];
  const cr = P.chainSeqs ? E.roomTypes.chainRoute(S, P) : null; if (cr && cr.path) for (const f of [0.2, 0.4, 0.6, 0.8]) { const t = cr.path[Math.floor(cr.path.length * f)]; out.push([t % W, (t / W) | 0]); }
  const it = P.dioPlan && P.dioPlan.items.find((q) => q.eligible); if (it) { let sx = 0, sy = 0; for (const t of it.dst) { sx += t % W; sy += (t / W) | 0; } out.push([Math.round(sx / it.dst.length), Math.round(sy / it.dst.length)]); }
  while (out.length < 14) out.push([(out.length * 37) % W, (out.length * 53) % H]); return out; };
const GOTO = ({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = Math.max(0, Math.min(S.n - 1, y * S.W + x)), hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.panRest(); };
// the canvas of the panel against a fresh render of the same state into an offscreen canvas of the same size: { same, diff (pixels), maxDelta, pixels }
const COMPARE = () => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height; off.style.cssText = `width:${w}px;height:${h}px;position:absolute;left:-9999px`; document.body.appendChild(off);
  E.render(off, S, e.P, e.st.panTech || e.st.tech, e.view(), e.O); const a = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, b = off.getContext('2d').getImageData(0, 0, off.width, off.height).data; off.remove(); let diff = 0, mx = 0;
  for (let i = 0; i < a.length; i += 4) { let d = 0; for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(a[i + c] - b[i + c])); if (d) { diff++; if (d > mx) mx = d; } } return { same: diff === 0, diff, maxDelta: mx, pixels: cv.width * cv.height }; };
(async () => {
  let fails = 0, combo = 0, checks = 0; const worst = { diff: 0, pct: 0, maxDelta: 0 }; const ok = (name, c, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!c) fails++; };
  for (const tech of TECHS) { if (ONLY && ONLY[0] !== tech) continue;
    const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle(); if (tech !== 'A') await a.tech(tech);
    await page.check('#t-panCache'); await a.idle();
    const drag = async (n) => { const b = await (await page.$('#stage canvas')).boundingBox(), x0 = b.x + b.width / 2, y0 = b.y + b.height / 2; await page.keyboard.down('Shift'); await page.mouse.move(x0, y0); await page.mouse.down(); for (let i = 1; i <= n; i++) await page.mouse.move(x0 + i * 7, y0 + i * 3); await page.mouse.up(); await page.keyboard.up('Shift'); await page.waitForTimeout(450); await a.idle(); };
    for (const th of THS) { if (ONLY && +ONLY[1] !== th) continue; await a.slider('terH', th); await a.idle();
      for (const mode of MODES) { if (ONLY && ONLY[2] !== mode) continue; await page.selectOption('#dioChain', mode); await a.idle(); const all = await ev(POSITIONS);
        for (const cam of CAMS) { await a.preset(cam); await a.idle();
          for (const ppt of ZOOMS) { const pos = FULL ? all : [0, 1, 2, 3].map((j) => all[(combo * 4 + j) % all.length]); combo++; let bad = [], noBlit = 0, mid = { diff: 0, maxDelta: 0, pixels: 1 };
            for (const [x, y] of pos) { await ev(GOTO, { x, y, ppt }); await a.idle(); const f0 = await ev(() => window.__evo.st.panFrames || 0); await drag(6); const f1 = await ev(() => window.__evo.st.panFrames || 0); if (f1 <= f0) noBlit++;
              const r = await ev(COMPARE); if (!r.same) bad.push(`(${x},${y}):${r.diff}px`);
              // (ii) one blit frame at this position vs a fresh render at the same pan
              await ev(GOTO, { x, y, ppt }); await a.idle(); const p = await ev(() => ({ x: window.__evo.st.panX, y: window.__evo.st.panY })); await ev(({ px, py }) => window.__evo.panFrameTest(px + 3, py + 2), { px: p.x, py: p.y }); const m = await ev(COMPARE); checks++; if (m.diff > mid.diff) mid = m; }
            ok(`AT REST ${tech} terH ${th} ${mode} ${cam} ${ppt} px/tile: after a real drag (blit frames used) the canvas is byte-identical to a fresh render at ${pos.length} positions`, bad.length === 0 && noBlit === 0, (bad.join(' ') + (noBlit ? ` (${noBlit} drags used no blit frame)` : '')).trim());
            ok(`MID-GESTURE ${tech} terH ${th} ${mode} ${cam} ${ppt} px/tile: the blit frame differs from a fresh render in at most ${mid.diff} of ${mid.pixels} pixels (${(100 * mid.diff / mid.pixels).toFixed(3)} %), channel delta <= ${mid.maxDelta}`, 100 * mid.diff / mid.pixels <= 0.5 && mid.maxDelta <= 8);
            worst.diff = Math.max(worst.diff, mid.diff); worst.pct = Math.max(worst.pct, 100 * mid.diff / mid.pixels); worst.maxDelta = Math.max(worst.maxDelta, mid.maxDelta); } } } }
    // (iii) invalidation: a render-input change, then a blit frame, against a fresh render; the same with the validity check removed
    for (const mutate of [false, true]) { await page.selectOption('#dioChain', 'm2'); await a.idle(); await ev(GOTO, { x: 128, y: 128, ppt: 30 }); await a.idle(); await ev(() => { window.EVO.panNoInvalidate = false; window.__evo.panFrameTest(window.__evo.st.panX + 4, window.__evo.st.panY + 4); }); // the layer exists
      await ev((m) => { window.EVO.panNoInvalidate = m; }, mutate);
      const nth = tech === 'A' ? 'B' : 'A', steps = [['terH', async () => { await a.slider('terH', 6); await a.idle(); }], ['technique', async () => { await a.tech(nth); await a.idle(); }], ['display option (outlines)', async () => { await page.uncheck('#t-outlines'); await a.idle(); }]];
      for (const [name, change] of steps) { await change(); await ev(GOTO, { x: 128, y: 128, ppt: 30 }); await a.idle(); // a rest frame (cache untouched by the mutation flag), then ONE blit frame
        await ev(() => window.__evo.panFrameTest(window.__evo.st.panX + 5, window.__evo.st.panY + 1)); const m1 = await ev(COMPARE), good = 100 * m1.diff / m1.pixels <= 0.5 && m1.maxDelta <= 8;
        if (!mutate) ok(`INVALIDATION ${tech}: after a change of ${name} the next blit frame equals a fresh render (${m1.diff} differing pixels, ${(100 * m1.diff / m1.pixels).toFixed(3)} %)`, good);
        else ok(`MUTATION no invalidation (E.panNoInvalidate; ${tech}, change of ${name}): the INVALIDATION check FAILS (${m1.diff} differing pixels, ${(100 * m1.diff / m1.pixels).toFixed(2)} %, the frame shows the old state)`, !good); }
      await ev(() => { window.EVO.panNoInvalidate = false; }); await page.check('#t-outlines'); await a.slider('terH', 3); await a.idle(); if (tech !== 'A') await a.tech(tech); else await a.tech('A'); await a.idle(); }
    await a.browser.close(); }
  console.log(`${checks} mid-gesture frames compared; worst: ${worst.diff} pixels (${worst.pct.toFixed(3)} %), channel delta ${worst.maxDelta}`); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
