/* Pocket 31 (real map, Balanced types, technique C) with the wall pass T3 / T2 at the cameras given: the Pocket fitted and three close-ups at the road tiles that touch the most walls ((41, 31), (54, 31), (19, 37) of the window), for the visual review of the road exemption (D23). EVO_ROOT=<dir> shoots another tree (before / after).
     NODE_PATH=$(npm root -g) node tools/ui/pocket_road_shots.js <outDir> [--cams isoE,stage] [--cfg t3,t2,off] [--px 16] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SPOTS = [[41, 31], [54, 31], [19, 37]]; // isoE; another camera composes another Pocket (the plan follows the camera axis), so there the three road tiles that touch the most walls are looked up
const spotsFor = (page) => page.evaluate(() => { const e = window.__evo, S = e.S(), P = e.P, st = window.EVO.curves.struct(S, P), E_ = st.edges, g = st.grid, n = new Map();
  for (let i = 0; i < E_.x0.length; i++) { if (E_.lo[i] < 0 || S.levelH[E_.hi[i]] - S.levelH[E_.lo[i]] < 0.5 * (P.terH || 1) - 1e-9) continue; for (const c of [E_.ci[i], E_.co[i]]) if (c >= 0) { const t = g.own[c]; if (S.pocketRole[t] === 3) n.set(t, (n.get(t) || 0) + 1); } }
  const best = [...n].sort((p, q) => q[1] - p[1]), out = []; for (const [t] of best) { const x = t % S.W, y = (t / S.W) | 0; if (out.every((o) => Math.hypot(o[0] - x, o[1] - y) > 8)) out.push([x, y]); if (out.length === 3) break; } return out; });
(async () => {
  const out = process.argv[2]; if (!out || out.startsWith('--')) { console.error('usage: pocket_road_shots.js <outDir> [options]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const cams = arg('--cams', 'isoE,stage').split(','), cfgs = arg('--cfg', 't3,t2').split(','), px = +arg('--px', 16);
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.click('#mode'); await a.idle();
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  await page.check('#t-pocket'); await a.idle(); await page.click('#roomChips .chip[data-id="31"]'); await a.idle();
  await a.tech('C'); await a.idle();
  for (const cam of cams) for (const c of cfgs) {
    await page.selectOption('#wallPass', c); await a.idle(); await a.preset(cam);
    const f0 = path.join(out, `pocket31_${cam}_${c}_fit.png`); fs.writeFileSync(f0, await a.canvas()); console.log(f0);
    for (const [x, y] of (cam === 'isoE' ? SPOTS : await spotsFor(page))) {
      const info = await page.evaluate(({ x, y }) => { const e = window.__evo, S = e.S(), i = Math.min(S.n - 1, Math.max(0, Math.floor(y) * S.W + Math.floor(x))); return { h: S.levelH[S.fine[i]], fit: e.st.fitSc, road: S.pocketRole ? S.pocketRole[i] : -1 }; }, { x, y });
      await a.focus(x + 0.5, y + 0.5, info.h, px / info.fit);
      const f = path.join(out, `pocket31_${cam}_${c}_${x}_${y}.png`); fs.writeFileSync(f, await a.canvas()); console.log(f, 'role', info.road);
    }
    await a.preset(cam);
  }
  console.log('errors:', a.errs); await a.browser.close();
})();
