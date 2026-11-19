/* TERRAZAS 79, part 2 (stage_terrazas79_go.md; MEASURE ONLY, the camera is not changed): how much the DESTINATION terrace (the highest terrace of the room; in a one-terrace room the highest sub-level) and the props / landmark grow on screen as the hero walks from k0 to k8, in Cam 6 and Cam 8, with the hero tracking ON and OFF.
   Per position: the pixels of the destination terrace in the Box pick buffer (area, horizontal width), the px per tile (sqrt(area / visible tiles)) and per H (x tilesPerH), and the bounding box of the props (the pixels that change when the props are removed: the landmark is the largest). Tracking OFF: the camera is framed at k0 with the tracking on and then frozen; only the hero moves.
     NODE_PATH=$(npm root -g) node tools/ui/t79_growth.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2]; if (!out) { console.error('usage: t79_growth.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
const EX = ['perfil_m1', 'perfil_u1', 'perfil_u2'], CAMS = [['stage', 'Cam 6'], ['stagez', 'Cam 8']];
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), res = {};
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  for (const id of EX) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    const path0 = await ev(() => { const e = window.__evo, S = e.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [t % S.W, (t / S.W) | 0]); }), N = path0.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(path0[Math.floor(i * (N - 1) / 8 + 0.5)]);
    for (const [cam, camName] of CAMS) {
      await page.click(`#presets button[data-id="${cam}"]`); await a.idle(); await a.idle();
      for (const follow of [true, false]) {
        const rows = [];
        await ev(({ k }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[0] }); await a.idle(); await a.idle();
        if (!follow) await ev(() => { window.__evo.st.follow = false; });
        for (let i = 0; i <= 8; i++) {
          await ev(({ k, follow }) => { const e = window.__evo, S = e.S(); if (follow) e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[i], follow }); await a.idle(); await a.idle();
          rows.push(await ev(async () => {
            const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, tp = st.stage.tilesPerH, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = st.persH || cv.clientHeight, v = e.view(), n = S.n, W = S.W, zm = E.stage.zoneMap(S), rid = st.stageRooms[0];
            const walk = (i) => E.stage.walkable(S, i) && S.region[i] >= 0 && zm[i] === rid; let maxTer = -1, maxLv = -1; for (let i = 0; i < n; i++) if (walk(i)) { const mt = S.levelMeta[S.fine[i]]; if (!mt.bridge && !mt.deco && mt.ter > maxTer) maxTer = mt.ter; }
            const single = (() => { const t = new Set(); for (let i = 0; i < n; i++) if (walk(i)) { const mt = S.levelMeta[S.fine[i]]; if (!mt.bridge && !mt.deco) t.add(mt.ter); } return t.size === 1; })();
            if (single) for (let i = 0; i < n; i++) if (walk(i) && S.fine[i] > maxLv) maxLv = S.fine[i];
            const dest = new Uint8Array(n); let destTiles = 0; for (let i = 0; i < n; i++) if (walk(i)) { const mt = S.levelMeta[S.fine[i]]; if (mt.bridge || mt.deco) continue; if (single ? S.fine[i] === maxLv : mt.ter === maxTer) { dest[i] = 1; destTiles++; } }
            const D = E.pickBuffer(S, P, v, w, h, { pickWalls: true }).data, seen = new Uint8Array(n); let px = 0, x0 = 1e9, x1 = -1;
            for (let q = 0; q < w * h; q++) { const code = (D[4 * q] << 16) | (D[4 * q + 1] << 8) | D[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (D[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n && dest[t]) { seen[t] = 1; px++; const x = q % w; if (x < x0) x0 = x; if (x > x1) x1 = x; } }
            let vis = 0; for (let i = 0; i < n; i++) if (seen[i]) vis++;
            // the props (landmark, pillars, path): bbox of the pixels that change when they are removed
            const cx = cv.getContext('2d'), W2 = cv.width, H2 = cv.height, img = cx.getImageData(0, 0, W2, H2).data, saved = st.stage.props; st.stage.props = 'off'; e.redraw(); await new Promise((r) => setTimeout(r, 60)); for (let kk = 0; kk < 400 && !(document.querySelector('#busy').hidden && !(e.slStats && e.slStats().pending)); kk++) await new Promise((r) => setTimeout(r, 25));
            const img2 = cx.getImageData(0, 0, W2, H2).data; let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1, dpx = 0; for (let q = 0; q < W2 * H2; q++) { const p4 = q * 4; if (Math.abs(img[p4] - img2[p4]) + Math.abs(img[p4 + 1] - img2[p4 + 1]) + Math.abs(img[p4 + 2] - img2[p4 + 2]) > 24) { dpx++; const x = q % W2, y = (q / W2) | 0; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } }
            st.stage.props = saved; e.redraw(); const hs = e.O.hero && e.O.hero.stats;
            return { destTiles, visTiles: vis, areaPx: px, widthPx: vis ? x1 - x0 + 1 : 0, pxPerTile: vis ? +Math.sqrt(px / vis).toFixed(2) : 0, pxPerH: vis ? +(Math.sqrt(px / vis) * tp).toFixed(2) : 0, propsBox: bx1 >= 0 ? { w: bx1 - bx0 + 1, h: by1 - by0 + 1, px: dpx } : null, heroPxPerH: hs ? +(hs.hpx).toFixed(1) : null, zoom: +st.zoom.toFixed(4) };
          }));
          await a.idle();
        }
        (res[id] = res[id] || {})[`${camName}|follow ${follow ? 'on' : 'off'}`] = rows;
      }
    }
    await page.click('#presets button[data-id="stage"]'); await a.idle();
    for (const k of Object.keys(res[id])) { const r = res[id][k]; console.log(id, k, 'area k0/k4/k8', r[0].areaPx, r[4].areaPx, r[8].areaPx, 'width', r[0].widthPx, r[4].widthPx, r[8].widthPx, 'px/H', r[0].pxPerH, r[4].pxPerH, r[8].pxPerH, 'hero px/H', r[0].heroPxPerH, r[8].heroPxPerH); }
  }
  fs.writeFileSync(path.join(out, 't79_crecimiento.json'), JSON.stringify(res, null, 1)); console.log('errors:', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
