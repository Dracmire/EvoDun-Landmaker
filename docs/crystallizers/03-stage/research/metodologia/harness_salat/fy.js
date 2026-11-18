const L = require('./lib.js'); const fs = require('fs');
(async () => {
  const a = await L.open(); const out = {};
  for (const pos of ['n1','n2','n3']) {
    const res = [];
    for (let fy = 0.45; fy <= 0.8001; fy += 0.01) {
      await a.put({ tricks: ['A6'], pos, hs: [0.63, +fy.toFixed(2)] });
      const y = await a.eval((p) => { const S0 = window.SALAT, ev = window.__evo; const hx = ev.st.hero.x; const q = S0.proj([[hx, S0.Yz(38) + 0.5, 6.6], [hx, S0.Yz(38) + 0.5, 5]]); return { top: q[0], base: q[1], h: S0.camNow().h }; });
      res.push([+fy.toFixed(2), +(y.top[1] / y.h).toFixed(3), +(y.top[0] / 1280).toFixed(3)]);
    }
    out[pos] = res; console.log(pos, JSON.stringify(res.filter((r, i) => i % 5 === 0)));
  }
  console.log(a.errs); await a.close();
})();
