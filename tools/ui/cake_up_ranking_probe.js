/* Minimal experiment for the A / B / C pixel differences far from a changed tile (Cake v2 review): insert ONE unused level into the height ranking of a shape (no tile changes its height, no tile uses the new level as its own)
   and redraw. Every differing pixel is then caused by the RANKING alone: in A / B / C each level is a slab whose wall spans levelH[L - 1] .. levelH[L] (renderLevels, `hb = levelH[L - 1]`), so a new level splits every
   cliff that crosses its height into one more band (gradient, outline). Real map, Balanced types, Cake OFF, Cam 3; the level is inserted between levels L0 and L0 + 1 (default: the level with the most tiles on it).
     NODE_PATH=$(npm root -g) EVO_INFO_H=80.2 node tools/ui/cake_up_ranking_probe.js <outDir> [--l0 <index>] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: cake_up_ranking_probe.js <outDir> [--l0 N]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.click('#mode'); await a.idle();
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.selectOption('#roomsPreset', 'balanced'); await a.idle();
  const res = {};
  for (const t of ['A', 'B', 'C']) {
    await a.tech(t); await a.preset('oblique'); fs.writeFileSync(path.join(out, `probe_${t}_base.png`), await a.canvas());
    const info = await page.evaluate((l0arg) => { // insert one unused level (no tile moves): the contours of the new level equal those of the next one, only the wall bands change
      const e = window.__evo, S = e.S(); let L0 = l0arg; if (L0 === null) { const cnt = new Array(S.maxFine + 1).fill(0); for (let i = 0; i < S.n; i++) if (!(S.void && S.void[i])) cnt[S.fine[i]]++; L0 = cnt.indexOf(Math.max(...cnt.slice(0, S.maxFine))); }
      const h = (S.levelH[L0] + S.levelH[L0 + 1]) / 2, remap = (L) => (L <= L0 ? L : L + 1);
      const before = Array.from(S.fine, (L) => S.levelH[L]);
      S.levelH = S.levelH.slice(0, L0 + 1).concat([h], S.levelH.slice(L0 + 1)); S.levelMeta = S.levelMeta.slice(0, L0 + 1).concat([Object.assign({}, S.levelMeta[L0 + 1])], S.levelMeta.slice(L0 + 1));
      for (let i = 0; i < S.n; i++) S.fine[i] = remap(S.fine[i]); if (S.fineMask) for (let i = 0; i < S.n; i++) S.fineMask[i] = S.void && S.void[i] ? -1 : S.fine[i];
      for (const rec of S.stairs || []) if (rec.level !== undefined) rec.level = remap(rec.level);
      S.maxFine++; S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < S.n; i++) if (!S.void || !S.void[i]) S.byLevel[S.fine[i]].push(i); S.cache = {};
      let moved = 0; for (let i = 0; i < S.n; i++) if (Math.abs(S.levelH[S.fine[i]] - before[i]) > 1e-9) moved++;
      return { L0, h, levels: S.maxFine + 1, moved, tilesAtL0: S.byLevel[L0].length };
    }, arg('--l0') === undefined ? null : +arg('--l0'));
    await a.preset('oblique'); await a.idle(); fs.writeFileSync(path.join(out, `probe_${t}_probe.png`), await a.canvas()); res[t] = info;
    await page.evaluate(() => window.__evo.setMode && 0); await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); // the shape is rebuilt: the next technique starts from the real one
  }
  fs.writeFileSync(path.join(out, 'probe.json'), JSON.stringify(res)); console.log(JSON.stringify(res)); console.log('errors:', a.errs); await a.browser.close();
})();
