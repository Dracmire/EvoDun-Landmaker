/* SHAPE PROFILES, PART B (docs/crystallizers/03-stage/research/octopath2/stage_perfiles_mockup_go.md): the walk of the mockups M1, M2, M3 and the control C0, k0..k8 toward the goal along the path of the room (the path of `props`, E.props: the hero starts at its first tile and k_i = path[round(i (N - 1) / 8)]).
   Per position it records the hero size and feet row (heroFrac, fx, fy), the EMPTY BACKGROUND share (the colour of E.BG_COLORS at that row, +-4 per channel: the vacío %), the BILLBOARDS share (pixels of the full panel that change when the declared billboards and the props are removed; the hero, the ribbon and the volumes stay, as the composition rule (a) says),
   and the ENCLOSURE seen: the blocked non-void tiles within 8 tiles of the room's walkable tiles (the masses, volumes, planes and rings that close the room), how many of them have at least one visible pixel (pick buffer) and the share of the panel they cover. Shots of k0, k4, k8 of every mockup.
     NODE_PATH=$(npm root -g) node tools/ui/perfiles_walk.js <outDir> [--no-shots] [--only id,id] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2], SHOTS = !process.argv.includes('--no-shots'), oi = process.argv.indexOf('--only'), ONLY = oi > 0 ? process.argv[oi + 1].split(',') : null;
if (!out) { console.error('usage: perfiles_walk.js <outDir> [--no-shots] [--only id,id]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const EX = ['perfil_m1', 'perfil_m2', 'perfil_m3', 'perfil_c0'].filter((x) => !ONLY || ONLY.includes(x));
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const res = {};
  for (const id of EX) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    const info = await ev(() => { // the room, its dimensions in H and the path
      const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, tp = st.stage.tilesPerH, rid = st.stageRooms[0], r = S.orient.byId.get(rid), zm = E.stage.zoneMap(S), W = S.W, tiles = [];
      for (let i = 0; i < S.n; i++) if (zm[i] === rid && E.stage.walkable(S, i) && S.region[i] >= 0) tiles.push(i);
      let hMin = 1e9, hMax = -1e9; const lv = new Set(); for (const i of tiles) { const h = S.levelH[S.fine[i]]; hMin = Math.min(hMin, h); hMax = Math.max(hMax, h); lv.add(S.fine[i]); }
      const pd = S.propsC && S.propsC.data; const path = pd ? pd.path.map((t) => [t % W, (t / W) | 0]) : [];
      return { rid, dir: r.dir, yaw: r.yaw, ratio: r.ratio, LH: r.L / tp, WH: r.W / tp, meanWH: tiles.length / Math.max(r.L, r.W) / tp, tiles: tiles.length, areaH2: tiles.length / (tp * tp), reliefH: (hMax - hMin) / tp, levels: lv.size, ox: S.ox, oy: S.oy, path, goal: pd && pd.goal ? [pd.goal.x, pd.goal.y] : null, ascFaces: S.ascWalls ? S.ascWalls.faces.length : 0, cakeRingTiles: S.cake && S.cake.tiles ? (S.cake.tiles.size !== undefined ? S.cake.tiles.size : S.cake.tiles.length || 0) : 0, pocket: !!e.P.pocket, blocked: S.stageBlocked ? S.stageBlocked.tiles : 0, volumes: S.stageVolumes ? S.stageVolumes.tiles : 0, planes: S.stagePlanes ? { wall: S.stagePlanes.wall, cols: S.stagePlanes.cols, front: S.stagePlanes.front } : null, props: pd ? { torches: pd.torches.length, pillars: pd.pillars.length, goal: !!pd.goal, noPath: pd.noPath } : null, objects: st.stage.objectList.length, ribbon: st.stage.ribbonList.length };
    });
    const N = info.path.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(info.path[Math.floor(i * (N - 1) / 8 + 0.5)]);
    const rows = [];
    for (let i = 0; i <= 8; i++) {
      await ev(({ k, info }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[i], info }); await a.idle();
      const shot = SHOTS && [0, 4, 8].includes(i) ? path.join(out, `${id}_k${i}.png`) : null;
      if (shot) await page.screenshot({ path: shot });
      const m = await ev(async () => {
        const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, tp = st.stage.tilesPerH, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = st.persH || cv.clientHeight, v = e.view(), hs = e.O.hero.stats;
        const ctx = cv.getContext('2d'), W2 = cv.width, H2 = cv.height, img = ctx.getImageData(0, 0, W2, H2).data;
        const hex = (s) => [1, 3, 5].map((k) => parseInt(s.slice(k, k + 2), 16)), [c0, c1] = E.BG_COLORS.map(hex); let bg = 0;
        for (let y = 0; y < H2; y++) { const t = y / (H2 - 1), rr = c0[0] + (c1[0] - c0[0]) * t, gg = c0[1] + (c1[1] - c0[1]) * t, bb = c0[2] + (c1[2] - c0[2]) * t; for (let x = 0; x < W2; x++) { const q = (y * W2 + x) * 4; if (Math.abs(img[q] - rr) <= 4 && Math.abs(img[q + 1] - gg) <= 4 && Math.abs(img[q + 2] - bb) <= 4) bg++; } }
        // billboards share: the pixels that change when the declared billboards and the props are removed (the hero, the ribbon, the volumes stay)
        const saved = { list: st.stage.objectList, props: st.stage.props }; st.stage.objectList = []; st.stage.props = 'off'; e.redraw();
        await new Promise((r) => setTimeout(r, 50)); await (async () => { for (let k = 0; k < 400 && !(document.querySelector('#busy').hidden && !(e.slStats && e.slStats().pending)); k++) await new Promise((r) => setTimeout(r, 25)); })();
        const img2 = cv.getContext('2d').getImageData(0, 0, W2, H2).data; let diff = 0; for (let q = 0; q < W2 * H2; q++) { const p4 = q * 4; if (Math.abs(img[p4] - img2[p4]) + Math.abs(img[p4 + 1] - img2[p4 + 1]) + Math.abs(img[p4 + 2] - img2[p4 + 2]) > 24) diff++; }
        st.stage.objectList = saved.list; st.stage.props = saved.props; e.redraw();
        return { hf: hs.hpx / h, fx: hs.base[0] / w, fy: hs.base[1] / h, bg: bg / (W2 * H2), bill: diff / (W2 * H2) };
      });
      await a.idle();
      const enc = await ev(() => { // the enclosure: blocked non-void tiles within 8 tiles of the room's walkable tiles; visible = has a pixel in the pick buffer
        const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, W = S.W, H = S.H, n = S.n, rid = st.stageRooms[0], zm = E.stage.zoneMap(S), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = st.persH || cv.clientHeight, v = e.view();
        const near = new Uint8Array(n); for (let i = 0; i < n; i++) if (zm[i] === rid && E.stage.walkable(S, i)) { const x = i % W, y = (i / W) | 0; for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) near[yy * W + xx] = 1; } }
        const enc = new Uint8Array(n); let total = 0; for (let i = 0; i < n; i++) if (near[i] && S.block[i] && !(S.void && S.void[i]) && !(zm[i] === rid && E.stage.walkable(S, i))) { enc[i] = 1; total++; }
        const D = E.pickBuffer(S, P, v, w, h, { pickWalls: true }).data, seen = new Uint8Array(n); let px = 0;
        for (let q = 0; q < w * h; q++) { const code = (D[4 * q] << 16) | (D[4 * q + 1] << 8) | D[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (D[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n && enc[t]) { seen[t] = 1; px++; } }
        let vis = 0; for (let i = 0; i < n; i++) if (seen[i]) vis++;
        return { total, visible: vis, share: px / (w * h) };
      });
      rows.push({ k: 'k' + i, tile: ks[i], ...m, enc });
    }
    res[id] = { info, rows };
    console.log(id, `room ${info.rid} ${info.dir} ${info.LH.toFixed(1)} x ${info.WH.toFixed(1)} H (mean ${info.meanWH.toFixed(1)}), relief ${info.reliefH.toFixed(2)} H, ${info.levels} levels; path ${N}; k4 hero ${(rows[4].hf * 100).toFixed(1)} % fy ${rows[4].fy.toFixed(2)} bg ${(rows[4].bg * 100).toFixed(1)} % bill ${(rows[4].bill * 100).toFixed(1)} % enclosure ${rows[4].enc.visible}/${rows[4].enc.total} (${(rows[4].enc.share * 100).toFixed(1)} %)`);
  }
  fs.writeFileSync(path.join(out, 'perfiles_pasos.json'), JSON.stringify(res, null, 1));
  console.log('errors:', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
