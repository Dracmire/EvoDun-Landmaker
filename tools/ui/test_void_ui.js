/* Void in the viewer (height 0 is not terrain) on the user's real map data/samples/skeleton_heightmap_256.png:
   no void tile is ever picked by the id render (so none is drawn) in Box, A and B, in Oblique and Iso; land is drawn.
     NODE_PATH=$(npm root -g) node tools/ui/test_void_ui.js */
const path = require('path');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]);
  await page.waitForTimeout(1500); await a.idle();
  const info = await page.evaluate(() => { const S = window.__evo.S(); let v = 0; for (let i = 0; i < S.n; i++) v += S.void && S.void[i] ? 1 : 0; return { v, n: S.n, blocked: S.void ? Array.from(S.void).every((x, i) => !x || S.block[i]) : false }; });
  ok('the real map has void tiles and they are blocked', info.v > 20000 && info.blocked, JSON.stringify(info));
  await page.click('#mode'); await a.idle();
  for (const tech of ['box', 'A', 'B']) for (const preset of ['oblique', 'isoE']) {
    await a.tech(tech); await a.preset(preset);
    const r = await page.evaluate((tech) => {
      const ev = window.__evo, S = ev.S(), E = window.EVO, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth;
      const view = ev.view(), bg = Array.from(ctx.getImageData(3, 3, 1, 1).data), cam = E.makeCam(S, ev.P, view, w, h); let voidHit = 0, landHit = 0, bgPx = 0, total = 0;
      const land = [], vd = [];
      for (let y = 4; y < S.H - 4; y += 2) for (let x = 4; x < S.W - 4; x += 2) { const i = y * S.W + x; let deep = true; for (let dy = -2; dy <= 2 && deep; dy++) for (let dx = -2; dx <= 2; dx++) if (!S.void[(y + dy) * S.W + x + dx]) { deep = false; break; } if (S.void[i] && deep) vd.push(i); else if (!S.void[i]) land.push(i); }
      const pickAt = (arr, k) => Array.from({ length: k }, (_, q) => arr[Math.floor((q + 0.5) * arr.length / k)]);
      const test = (i, hh) => {
        const p = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, hh); if (p[0] < 20 || p[1] < 20 || p[0] > w - 20 || p[1] > h - 20) return;
        total++; const r = E.pickTile(S, ev.P, tech, view, w, h, p[0], p[1]), c = Array.from(ctx.getImageData(Math.round(p[0] * dpr), Math.round(p[1] * dpr), 1, 1).data);
        if (Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) < 12) bgPx++;
        if (r.tile >= 0) { if (S.void[r.tile]) voidHit++; else landHit++; }
      };
      for (const i of pickAt(vd, 14)) test(i, 0);
      for (const i of pickAt(land, 14)) test(i, S.levelH[S.fine[i]]);
      let bgGrid = 0, gridN = 0; for (let gy = 10; gy < h; gy += 40) for (let gx = 10; gx < w; gx += 40) { gridN++; const c = Array.from(ctx.getImageData(Math.round(gx * dpr), Math.round(gy * dpr), 1, 1).data); if (Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) < 12) bgGrid++; }
      return { total, voidHit, landHit, bgFrac: +(bgGrid / gridN).toFixed(2) };
    }, tech);
    ok(`${tech} ${preset}: the id render never picks a void tile; land is picked, the background shows where the void is`, r.voidHit === 0 && r.landHit >= 10 && r.bgFrac > 0.05, JSON.stringify(r));
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
