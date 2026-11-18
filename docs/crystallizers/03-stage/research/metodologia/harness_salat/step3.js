const L = require('./lib.js'), C = require('./common.js'), K = require('./controls.js'), M = C.M; const fs = require('fs');
(async () => {
  const a = await L.open(); const res = {};
  fs.mkdirSync('/home/claude/salat/scratch', { recursive: true });
  for (const pos of C.ORDER) {
    await a.put({ tricks: [], pos, hs: C.HS[pos] }); const g = await a.grab(true);
    fs.writeFileSync(`/home/claude/salat/scratch/SUELO_${pos}.png`, g.png);
    const mi = await a.eval(() => { const m = window.SALAT.maskInfo(); delete m.mask; return m; });
    const own = await a.eval((cand) => { const S0 = window.SALAT, out = {}; for (const k in cand) { let n = 0, inn = 0; for (const i of cand[k]) { const x = i % 41, z = 55 - Math.floor(i / 41); const top = k === 'A6' ? 6.6 : S0.tileTop(x, z); const [px, py] = S0.proj([[x + 0.5, S0.Yz(z) + 0.5, top]])[0]; n++; if (px >= 0 && px <= 1280 && py >= 0 && py <= 720) inn++; } out[k] = [inn, n]; } return out; }, Object.fromEntries(Object.entries(C.CAND).map(([k, v]) => [k, [...v]])));
    res[pos] = { mask: mi.maskHash, count: mi.count, path: mi.pathHash, pathLen: mi.pathLen, goal: mi.goal, goalWalkable: mi.goalWalkable, regions: mi.regions, empty: +K.emptyShare(g).toFixed(4), hero: +K.heroCovered(g).toFixed(4), own, hero0: g.meta.hero && [g.meta.hero.base, g.meta.hero.hpx], levels: g.meta.levels };
    console.log(pos, JSON.stringify(Object.assign({}, res[pos], { levels: undefined })));
  }
  fs.writeFileSync('/home/claude/salat/scratch/suelo.json', JSON.stringify(res)); console.log(a.errs); await a.close();
})();
