/* Minimal experiment: is the contour of A / B / C local? Lower ONE tile by one level (a notch in the boundary of a big level region of the real map, Balanced types, Cake OFF, Cam 3), redraw, and measure how far from that tile the
   picture changes (python3 tools/ui/cake_up_locality.py <outDir>). Box is the control (tile-exact: it can only change within about a tile). Writes base / mod / pick pictures and probe.json.
     NODE_PATH=$(npm root -g) EVO_INFO_H=80.2 node tools/ui/cake_up_locality_probe.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: cake_up_locality_probe.js <outDir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page, res = {};
  await page.click('#mode'); await a.idle();
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  for (const t of ['box', 'A', 'B', 'C']) {
    await a.tech(t); await a.preset('oblique'); fs.writeFileSync(path.join(out, `loc_${t}_base.png`), await a.canvas());
    const info = await page.evaluate(() => { // the tile: on the boundary of the biggest level (4-neighbour one level lower, the other three at the same level), the closest to the centre of the map; it is lowered by one level
      const e = window.__evo, S = e.S(), W = S.W, H = S.H, cnt = new Array(S.maxFine + 1).fill(0); for (let i = 0; i < S.n; i++) if (!(S.void && S.void[i])) cnt[S.fine[i]]++;
      const L = cnt.indexOf(Math.max(...cnt.slice(1))); let best = -1, bd = 1e9;
      for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = y * W + x; if (S.fine[i] !== L || (S.void && S.void[i])) continue; let lower = 0, same = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = i + dy * W + dx; if (S.fine[j] === L - 1) lower++; else if (S.fine[j] === L) same++; } if (lower === 1 && same === 3) { const d = Math.hypot(x - W / 2, y - H / 2); if (d < bd) { bd = d; best = i; } } }
      S.fine[best] = L - 1; if (S.fineMask) S.fineMask[best] = L - 1; S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < S.n; i++) if (!S.void || !S.void[i]) S.byLevel[S.fine[i]].push(i); S.cache = {};
      return { tile: best, x: best % W, y: (best / W) | 0, level: L, W, n: S.n };
    });
    await a.preset('oblique'); await a.idle(); fs.writeFileSync(path.join(out, `loc_${t}_mod.png`), await a.canvas()); res[t] = info;
    const pk = await page.evaluate(() => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, b = E.pickBuffer(S, e.P, e.view(), w, h), o = document.createElement('canvas'); o.width = w; o.height = h;
      const g = o.getContext('2d'), im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const code = (b.data[4 * i] << 16) | (b.data[4 * i + 1] << 8) | b.data[4 * i + 2], k = code >> 20, v = code & 0xfffff, tt = b.data[4 * i + 3] === 255 && (k === 2 || k === 3 || k === 4) && v < S.n ? v + 1 : 0; im.data[4 * i] = (tt >> 16) & 255; im.data[4 * i + 1] = (tt >> 8) & 255; im.data[4 * i + 2] = tt & 255; im.data[4 * i + 3] = 255; }
      g.putImageData(im, 0, 0); return o.toDataURL('image/png'); });
    fs.writeFileSync(path.join(out, `loc_${t}_pick.png`), Buffer.from(pk.split(',')[1], 'base64'));
    await page.selectOption('#roomsPreset', 'default'); await a.idle(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); // rebuild the real shape for the next technique
  }
  fs.writeFileSync(path.join(out, 'probe.json'), JSON.stringify(res)); console.log(JSON.stringify(res)); console.log('errors:', a.errs); await a.browser.close();
})();
