/* PR Q5 (P7): per stair of the window at r21 (Default 3, Up) and r16 (Default 9, Up): the risers (treads + the last step) and the footprint depth BEFORE (the Mid carve, `P.stairStretch` off) and AFTER (the risers 1 / m of the hero's lego room), whether the longer stair fitted (it is placed) or not (dropped / narrower), the walkable regions of the window (one region: the main share), and the shot at k4. Writes <out>/<place>_<before|after>_k4.png and data.json.
     NODE_PATH=$(npm root -g) node tools/ui/q5_stairs.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common'), Q = require('./q_common');
const out = process.argv[2]; if (!out) { console.error('usage: q5_stairs.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
const STAIRS = `(() => { const e = window.__evo, S = e.S(), zm = window.EVO.stage.zoneMap(S), P = e.P, hero = e.st.hero, hi = hero ? Math.floor(hero.y - S.oy) * S.W + Math.floor(hero.x - S.ox) : -1, hroom = hi >= 0 ? zm[hi] : 0;
  const list = (S.stairs || []).map((r) => { const a = r.site ? r.site.a : -1, room = a >= 0 ? zm[a] : 0, risers = r.steps ? r.steps.length + 1 : (r.ramp ? 1 : 0); return { room, inHero: room === hroom, mode: r.mode, risers, depth: r.steps ? r.steps.length : (r.ramp ? r.ramp.len : 0), cols: r.cols ? r.cols.length : 0, narrowed: !!r.narrowed }; });
  let nr = 0, mainTiles = 0, walk = 0; if (S.region) { const cnt = new Map(); for (let i = 0; i < S.n; i++) if (S.region[i] >= 0 && !S.block[i]) { cnt.set(S.region[i], (cnt.get(S.region[i]) || 0) + 1); walk++; } nr = cnt.size; for (const v of cnt.values()) mainTiles = Math.max(mainTiles, v); }
  return { heroRoom: hroom, stretch: P.stairStretch || null, stairs: list, info: S.stairInfo ? { placed: S.stairInfo.placed, dropped: S.stairInfo.dropped, narrowed: S.stairInfo.narrowed, sites: S.stairInfo.sites } : null, regions: nr, mainShare: walk ? +(mainTiles / walk).toFixed(4) : null, walk, lego: S.legoInfo ? { m: S.legoInfo.m, terraces: S.legoInfo.terraces } : null }; })()`;
(async () => {
  const a = await Q.begin(open), data = {}; await a.page.click('#presets button[data-id="stage"]'); await a.idle();
  for (const key of ['r21', 'r16_9']) { const info = await Q.setupPlace(a, key, { treat: 'up' }); data[key] = { T: info.T, window: info.ids };
    for (const mode of ['before', 'after']) { // before: stretch forced off by the test hook; after: the rule
      await a.ev((m) => { window.EVO.legoTest = Object.assign(window.EVO.legoTest || {}, { noStairStretch: m === 'before' }); }, mode); await Q.setCtl(a, 'stageHeight', 'mid'); await Q.setCtl(a, 'stageHeight', 'up'); await Q.heroAt(a, info.ks[1]);
      data[key][mode] = await a.page.evaluate(STAIRS); await (await a.page.$('#stage canvas')).screenshot({ path: path.join(out, `${key}_${mode}_k4.png`) });
      const d = data[key][mode]; console.log(key, mode, 'hero room', d.heroRoom, 'stretch', JSON.stringify(d.stretch), 'lego', JSON.stringify(d.lego), 'stairs', d.stairs.length, 'in hero room', d.stairs.filter((s) => s.inHero).map((s) => `${s.risers}r/${s.depth}d`).join(','), 'info', JSON.stringify(d.info), 'regions', d.regions, 'main', d.mainShare); } }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
