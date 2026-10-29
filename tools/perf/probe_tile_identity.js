/* PR F1 gate 1a / 1b: tile identity and fixed cost per tile. Args: PPT TECH Q(0=off) T GX GY [tiles: all|empty] */
process.env.EVO_ROOT = process.env.EVO_ROOT || '/tmp/claude-0/wt_gate';
const { open } = require('/tmp/claude-0/wt_gate/tools/ui/common.js');
const M = +(process.env.M || 0); const [PPT, TECH, Q, T, GX, GY] = [+process.argv[2], process.argv[3] || 'A', +(process.argv[4] || 0), +(process.argv[5] || 256), +(process.argv[6] || -97), +(process.argv[7] || -41)];
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle(); if (TECH !== 'A') await a.tech(TECH);
  const c = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); const t = cr.path[cr.path.length >> 1]; return { x: t % S.W, y: (t / S.W) | 0 }; });
  await ev(({ x, y, ppt }) => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = y * S.W + x, hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, e.P, v, w, h).p(x + 0.5, y + 0.5, hh); e.st.zoom = ppt / e.st.fitSc; e.st.panX = w / 2 - p0[0]; e.st.panY = h / 2 - p0[1]; e.redraw(); }, { x: c.x, y: c.y, ppt: PPT || 13 });
  if (!PPT) { await page.click('#reset'); } await a.idle();
  await ev((ov) => { window.__ov = ov; }, process.env.OV || '{}'); const r = await ev(({ T, GX, GY, Q, tech, M }) => {
    const OV = JSON.parse(window.__ov || '{}'); const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, cv0 = document.querySelector('#stage canvas'), W = cv0.clientWidth, H = cv0.clientHeight, v0 = e.view(), O = Object.assign({}, e.O, { q: Q || 0 });
    const mk = (w, h) => { const c = document.createElement('canvas'); c.style.cssText = `width:${w}px;height:${h}px;position:absolute;left:-9999px`; document.body.appendChild(c); return c; };
    const rd = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const nx = Math.ceil((W - GX) / T), ny = Math.ceil((H - GY) / T), BW = nx * T, BH = ny * T;
    const withPan = (dx, dy) => Object.assign({}, v0, { panX: v0.panX + dx, panY: v0.panY + dy });
    // today's viewport-origin render (the live pipeline, no quantisation), and the same with the grid hook
    const F0 = mk(W, H), t0 = performance.now(); E.renderLayer(F0, W, H, S, P, tech, v0, Object.assign({}, e.O, { q: 0 }, OV)); const msFull = performance.now() - t0;
    const F1 = mk(W, H); E.renderLayer(F1, W, H, S, P, tech, v0, O);
    // ONE render at the grid origin (anchored at viewport coordinates (GX, GY)), size BW x BH
    const BIG = mk(BW, BH); const tb = performance.now(); E.renderLayer(BIG, BW, BH, S, P, tech, withPan(W / 2 - BW / 2 - GX, H / 2 - BH / 2 - GY), O); const msBig = performance.now() - tb;
    const big = rd(BIG), f0 = rd(F0), f1 = rd(F1), tiles = [];
    const comp = new Uint8ClampedArray(BW * BH * 4); let msTiles = 0, msTile = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const TS = T + 2 * M, tc = mk(TS, TS), ts = performance.now(); E.renderLayer(tc, TS, TS, S, P, tech, withPan(W / 2 - TS / 2 - GX - i * T + M, H / 2 - TS / 2 - GY - j * T + M), O); const dt = performance.now() - ts; msTiles += dt; msTile.push(Math.round(dt)); const d = rd(tc); for (let y = 0; y < T; y++) comp.set(d.subarray(((y + M) * TS + M) * 4, ((y + M) * TS + M + T) * 4), ((j * T + y) * BW + i * T) * 4); tc.remove(); }
    const cmp = (A, B, wA, hA, offA, wB, hB, offB, w, h, border) => { let d = 0, b2 = 0, b40 = 0, mx = 0, dBorder = 0, nBorder = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ia = ((y + offA[1]) * wA + x + offA[0]) * 4, ib = ((y + offB[1]) * wB + x + offB[0]) * 4; let m = 0; for (let k = 0; k < 4; k++) m = Math.max(m, Math.abs(A[ia + k] - B[ib + k])); const onB = border && border(x, y); if (onB) nBorder++; if (m) { d++; if (onB) dBorder++; if (m > 2) b2++; if (m > 40) b40++; if (m > mx) mx = m; } } return { diff: d, big: b2, big40: b40, max: mx, pixels: w * h, borderDiff: dBorder, borderPx: nBorder }; };
    const nearBorder = (ox, oy) => (x, y) => { const X = x + ox, Y = y + oy; const rx = ((X % T) + T) % T, ry = ((Y % T) + T) % T; return rx < 2 || rx >= T - 2 || ry < 2 || ry >= T - 2; };
    // (i) tiles composed vs ONE render at the same origin, over the whole BW x BH
    const i1 = cmp(comp, big, BW, BH, [0, 0], BW, BH, [0, 0], BW, BH, nearBorder(0, 0));
    // (ii) composed (viewport region) vs today's viewport-origin render: the viewport (0,0) is at (-GX, -GY) of the grid canvases
    const ii = cmp(comp, F0 && f0, BW, BH, [-GX, -GY], W, H, [0, 0], W, H, nearBorder(-GX, -GY));
    const ii_q = cmp(comp, f1, BW, BH, [-GX, -GY], W, H, [0, 0], W, H, nearBorder(-GX, -GY));
    const ref_q = cmp(f1, f0, W, H, [0, 0], W, H, [0, 0], W, H, null); // what the grid quantisation itself changes against today's render
    const per = []; for (let j = 0; j < ny; j++) { const row = []; for (let i = 0; i < nx; i++) { let n = 0; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const ia = ((j * T + y) * BW + i * T + x) * 4; let m = 0; for (let k = 0; k < 4; k++) m = Math.max(m, Math.abs(comp[ia + k] - big[ia + k])); if (m > 2) n++; } row.push(n); } per.push(row); }
    const o2 = document.createElement('canvas'); o2.width = BW; o2.height = BH; const c2 = o2.getContext('2d'), im = c2.createImageData(BW, BH); for (let p = 0; p < BW * BH; p++) { let m = 0; for (let k = 0; k < 4; k++) m = Math.max(m, Math.abs(comp[p * 4 + k] - big[p * 4 + k])); im.data[p * 4] = m > 2 ? 255 : m ? 90 : 0; im.data[p * 4 + 1] = m > 2 ? 0 : m ? 90 : 0; im.data[p * 4 + 2] = m > 2 ? 0 : m ? 90 : 0; im.data[p * 4 + 3] = 255; } c2.putImageData(im, 0, 0); window.__dm = o2.toDataURL(); window.__big = BIG.toDataURL(); window.__comp = (() => { const o3 = document.createElement('canvas'); o3.width = BW; o3.height = BH; o3.getContext('2d').putImageData(new ImageData(comp, BW, BH), 0, 0); return o3.toDataURL(); })();
    return { per, ppt: +(e.st.zoom * e.st.fitSc).toFixed(2), tech, Q, T, grid: [nx, ny], W, H, msFullViewport: Math.round(msFull), msBig: Math.round(msBig), msTilesTotal: Math.round(msTiles), msTileMedian: msTile.slice().sort((p, q) => p - q)[msTile.length >> 1], msTileMax: Math.max(...msTile), i1, ii_vs_today_unquantised: ii, ii_vs_fresh_same_grid: ii_q, quantisation_vs_today: ref_q };
  }, { T, GX, GY, Q, tech: TECH, M });
  console.log(JSON.stringify(r)); const fs = require('fs'); for (const k of ['dm', 'big', 'comp']) fs.writeFileSync('/tmp/claude-0/perf/f0/gate_' + k + '.png', Buffer.from((await ev((k) => window['__' + k], k)).split(',')[1], 'base64')); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
