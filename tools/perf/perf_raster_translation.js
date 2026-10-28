const { chromium } = require('/opt/node-tools/node_modules/playwright-core') ;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }); const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent('<body></body>');
  const r = await page.evaluate(() => {
    let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const mkLoops = (n, grid) => { const out = []; for (let k = 0; k < n; k++) { const cx = rnd() * 1400, cy = rnd() * 900, rr = 20 + rnd() * 120, m = 6 + (rnd() * 20 | 0), pts = []; for (let i = 0; i < m; i++) { const a = i / m * 6.283 + rnd() * 0.3, d = rr * (0.6 + rnd() * 0.5); let x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; if (grid) { x = Math.round(x * grid) / grid; y = Math.round(y * grid) / grid; } pts.push([x, y]); } out.push(pts); } return out; };
    const draw = (W, H, loops, dx, dy, opt) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; for (let k = 0; k < loops.length; k++) { const p = new Path2D(); loops[k].forEach(([a, b], i) => { i ? p.lineTo(a + dx, b + dy) : p.moveTo(a + dx, b + dy); }); p.closePath(); x.fillStyle = `rgb(${(k * 37) % 255},${(k * 91) % 255},${(k * 53) % 255})`; if (opt === 'grad') { const g = x.createLinearGradient(0, loops[k][0][1] + dy, 0, loops[k][0][1] + dy + 40); g.addColorStop(0, '#fff'); g.addColorStop(1, '#222'); x.fillStyle = g; } x.fill(p, 'evenodd'); if (opt !== 'nostroke') { x.strokeStyle = 'rgba(24,20,34,0.6)'; x.lineWidth = opt === 'hair' ? 0.5 : 1.7; x.stroke(p); } } return x.getImageData(0, 0, W, H).data; };
    const cmp = (A, wa, ox, oy, B, wb, w, h) => { let d = 0, big = 0, mx = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ia = ((y + oy) * wa + x + ox) * 4, ib = (y * wb + x) * 4; let m = 0; for (let k = 0; k < 4; k++) m = Math.max(m, Math.abs(A[ia + k] - B[ib + k])); if (m) { d++; if (m > 2) big++; if (m > mx) mx = m; } } return { d, big, mx }; };
    const res = {};
    for (const [name, grid, opt] of [['random doubles', 0, ''], ['grid 1/64', 64, ''], ['grid 1/4', 4, ''], ['integers', 1, ''], ['random, no stroke', 0, 'nostroke'], ['random, hairline', 0, 'hair'], ['random, gradient fills', 0, 'grad'], ['grid 1/64, gradient fills', 64, 'grad']]) {
      const loops = mkLoops(120, grid), BIG = draw(1536, 1024, loops, 0, 0, opt), out = {};
      for (const [tx, ty] of [[256, 0], [256, 256], [512, 256], [768, 512], [100, 40]]) { const T = draw(256, 256, loops, -tx, -ty, opt); out[tx + ',' + ty] = cmp(BIG, 1536, tx, ty, T, 256, 256, 256); }
      res[name] = out; }
    return res; });
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(28), Object.entries(v).map(([t, m]) => `${t}: ${m.d}/${m.big}/${m.mx}`).join('  '));
  await browser.close();
})();
