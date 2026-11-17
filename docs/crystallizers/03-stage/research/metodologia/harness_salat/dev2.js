const L = require('./lib.js'); const fs = require('fs');
(async () => {
  const a = await L.open(); const t0 = Date.now();
  for (const [name, tricks] of [['SUELO', []], ['A6', ['A6']], ['ALL', ['A6','B3','C3','C2','A4']]]) {
    for (const pos of ['s1','n1']) {
      const t1 = Date.now();
      await a.put({ tricks, pos }); const g = await a.grab(false);
      fs.writeFileSync(`/home/claude/salat/out/dev2_${name}_${pos}.png`, g.png);
      console.log(name, pos, Date.now() - t1, 'ms', JSON.stringify(g.meta.hero), g.meta.objs.length, g.meta.rib.length);
    }
  }
  console.log(a.errs); await a.close();
})();
