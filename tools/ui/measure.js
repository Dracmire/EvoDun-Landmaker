/* Cold cost of the techniques with carved stairs (bridge levels): terraces x sub-terraces, whole map and one zone.
     NODE_PATH=$(npm root -g) node tools/ui/measure.js [reps]
   Median of `reps` runs (default 3) of: shape, and the first render of each technique with an empty contour cache
   (cold) in a 1200x800 canvas at Oblique 50 degrees. Also reports levels, stairs and the stairs lost in A and B. */
const { open } = require('./common');
(async () => {
  const reps = +process.argv[2] || 3;
  const a = await open();
  await a.load('maps');
  const rows = await a.page.evaluate(({ reps }) => {
    const E = window.EVO, ev = window.__evo, pack = ev.packs.image.pack, O = Object.assign({}, ev.O);
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:800px'; document.body.appendChild(cv);
    const med = (x) => x.slice().sort((p, q) => p - q)[x.length >> 1], view = { yaw: 0, pitch: 50, zoom: 1, panX: 0, panY: 0 };
    const out = [];
    for (const [terraces, subs] of [[5, 3], [5, 6], [24, 3], [24, 6]]) for (const [slice, spec] of [['whole map', null], ['zone 6', { zones: [6], margin: 24 }]]) {
      const P = Object.assign({}, ev.P, { terraces, subs });
      const shapeMs = [], cold = { box: [], A: [], B: [] }; let S;
      for (let r = 0; r < reps; r++) {
        const t = performance.now(); S = E.shape(pack, P, spec); shapeMs.push(performance.now() - t);
        for (const tech of ['box', 'A', 'B']) { S.cache = {}; cold[tech].push(E.render(cv, S, P, tech, view, O).ms); }
      }
      const sa = E.stairSurvival(S, P, 'A'), sb = E.stairSurvival(S, P, 'B');
      out.push({ terraces, subs, slice, levels: S.levelH.length, bridges: S.levelMeta.filter((m) => m.bridge).length, stairs: S.stairs.length, sites: S.stairInfo.sites,
        shape: med(shapeMs), box: med(cold.box), A: med(cold.A), B: med(cold.B), lostA: `${(sa.coverage * 100).toFixed(1)}% (${sa.lost} lost)`, lostB: `${(sb.coverage * 100).toFixed(1)}% (${sb.lost} lost)` });
    }
    return out;
  }, { reps });
  const f = (v) => (typeof v === 'number' ? (v >= 100 ? v.toFixed(0) : v.toFixed(1)) : v);
  console.log('| terraces | sub-terraces | slice | levels (bridges) | stairs / sites | shape | Box cold | A cold | B cold | coverage A | coverage B |\n|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of rows) console.log(`| ${r.terraces} | ${r.subs} | ${r.slice} | ${r.levels} (${r.bridges}) | ${r.stairs} / ${r.sites} | ${f(r.shape)} | ${f(r.box)} | ${f(r.A)} | ${f(r.B)} | ${r.lostA} | ${r.lostB} |`);
  console.log('errors:', a.errs); await a.browser.close();
})();
