/* Cake ON, old tree vs new tree (Cake v2 for Up links): the Cake-ON images WILL differ; this checks that the differing pixels lie on the columns of the tiles whose height changed (ring tiles of Up or Down links, old or new) and nowhere else. Two runs:
     EVO_ROOT=<old checkout> EVO_INFO_H=80.2 node tools/ui/cake_up_regress.js <outOld>                       (pictures + the height of every tile, per config)
     EVO_INFO_H=80.2 node tools/ui/cake_up_regress.js <outNew> --old <outOld>                                 (the same + a mask of the changed columns, dilated by 4 px; A / B / C also by 2 tiles around each changed tile: their smoothed contours reach past the tile)
   then: python3 tools/ui/cake_up_diff.py <outOld> <outNew>   (differing pixels, inside / outside the mask, per picture). Configs: real map Default and Balanced types; Box / A / B / C; Oblique and Iso (isoE). */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
(async () => {
  const out = process.argv[2], old = arg('--old'); if (!out) { console.error('usage: cake_up_regress.js <outDir> [--old <outOldDir>]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.click('#mode'); await a.idle();
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); if (!process.argv.includes('--nocake')) { await page.check('#t-cake'); await a.idle(); } // --nocake: the Cake-OFF baseline (a control: how much of the picture outside the changed columns moves when ring levels enter the ranking)
  const cfgs = (arg('--cfg') || 'default,balanced').split(','), techs = (arg('--techs') || 'box,A,B,C').split(','), presets = (arg('--cams') || 'oblique,isoE').split(','); // --asc: Ascension walls on too (the camera-bank scene of tools/verify.sh regress: --cfg balanced --asc --techs box,A,B --cams isoE,isoW,oblique,low,top)
  if (process.argv.includes('--asc')) { await page.check('#t-ascWalls'); await a.idle(); }
  for (const cfg of cfgs) {
    if (cfg === 'balanced') { await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); }
    // heights per tile + claimed = the window tiles of every ring (Up and Down), for cake_up_reach.py
    const heights = await page.evaluate(() => { const S = window.__evo.S(); const fw = S.mapW; return { n: S.n, W: S.W, ox: S.ox, oy: S.oy, h: Array.from(S.fine, (L) => S.levelH[L]), claimed: S.cake ? [...S.cake.claim.keys()].map((m) => ((((m / fw) | 0) - S.oy) * S.W + (m % fw) - S.ox)) : [] }; });
    fs.writeFileSync(path.join(out, `${cfg}_heights.json`), JSON.stringify(heights));
    const oldH = old ? JSON.parse(fs.readFileSync(path.join(old, `${cfg}_heights.json`), 'utf8')) : null;
    for (const t of techs) { await a.tech(t); for (const p of presets) {
      await a.preset(p); fs.writeFileSync(path.join(out, `${cfg}_${t}_${p}.png`), await a.canvas());
      if (process.argv.includes('--pick')) { // the Box pick buffer of this view as an image: tile + 1 in the RGB bytes of every pixel that resolves to a tile (wall, ramp or cap code), 0 elsewhere (used by cake_up_reach.py)
        const pk = await page.evaluate(() => { const E = window.EVO, e = window.__evo, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, b = E.pickBuffer(S, e.P, e.view(), w, h), o = document.createElement('canvas'); o.width = w; o.height = h;
          const g = o.getContext('2d'), im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const r = b.data[4 * i], gg = b.data[4 * i + 1], bb = b.data[4 * i + 2], al = b.data[4 * i + 3], code = (r << 16) | (gg << 8) | bb, k = code >> 20, v = code & 0xfffff, t = al === 255 && (k === 2 || k === 3 || k === 4) && v < S.n ? v + 1 : 0; im.data[4 * i] = (t >> 16) & 255; im.data[4 * i + 1] = (t >> 8) & 255; im.data[4 * i + 2] = t & 255; im.data[4 * i + 3] = 255; }
          g.putImageData(im, 0, 0); return o.toDataURL('image/png'); });
        fs.writeFileSync(path.join(out, `${cfg}_${t}_${p}_pick.png`), Buffer.from(pk.split(',')[1], 'base64'));
      }
      if (oldH) {
        const mask = await page.evaluate(({ oldH, rad }) => {
          const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), CW = cv.clientWidth, CH = cv.clientHeight, cam = E.makeCam(S, P, e.view(), CW, CH);
          const m = document.createElement('canvas'); m.width = cv.width; m.height = cv.height; const g = m.getContext('2d'), sx = cv.width / CW, sy = cv.height / CH; g.scale(sx, sy); g.fillStyle = g.strokeStyle = '#fff'; g.lineWidth = 9; g.lineJoin = 'round';
          const z0 = S.levelH[0] - 0.5; let n = 0; if (oldH.W !== S.W || oldH.ox !== S.ox || oldH.oy !== S.oy) throw new Error('the window of the old tree differs');
          for (let i = 0; i < S.n; i++) {
            if (S.void && S.void[i]) continue; const x = i % S.W, y = (i / S.W) | 0, hn = S.levelH[S.fine[i]], ho = oldH.h[i]; if (ho === undefined || Math.abs(hn - ho) < 1e-9) continue; n++;
            const z1 = Math.max(hn, ho) + 0.05, pts = []; for (const [dx, dy] of [[-rad, -rad], [1 + rad, -rad], [1 + rad, 1 + rad], [-rad, 1 + rad]]) for (const z of [z0, z1]) pts.push(cam.p(x + dx, y + dy, z));
            pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cross = (o, a1, b) => (a1[0] - o[0]) * (b[1] - o[1]) - (a1[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
            for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
            const hull = lo.slice(0, -1).concat(up.slice(0, -1)); g.beginPath(); hull.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); g.stroke();
          }
          return { png: m.toDataURL('image/png'), changed: n };
        }, { oldH, rad: t === 'box' ? 0 : 2 });
        fs.writeFileSync(path.join(out, `${cfg}_${t}_${p}_mask.png`), Buffer.from(mask.png.split(',')[1], 'base64')); fs.writeFileSync(path.join(out, `${cfg}_${t}_${p}_changed.txt`), String(mask.changed));
      }
    } }
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
