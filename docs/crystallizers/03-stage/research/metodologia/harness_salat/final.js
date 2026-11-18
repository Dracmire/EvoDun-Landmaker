const L = require('./lib.js'), C = require('./common.js'); const fs = require('fs');
(async () => {
  const a = await L.open(); const rows = [];
  const once = async (pos) => { await a.put({ tricks: [], pos, hs: C.HS[pos] }); return a.grab(false); };
  for (let pass = 0; pass < 2; pass++) for (const pos of C.ORDER) {
    const g = await once(pos); const h = L.sha(g.png); const r = rows.find((q) => q.pos === pos) || (rows.push({ pos, h: [] }), rows[rows.length - 1]); r.h.push(h);
    if (pass === 0) fs.writeFileSync(`${L.OUT}/SUELO_${pos}.png`, g.png);
    if (g.w !== 1280 || g.h !== 720) console.log('SIZE', g.w, g.h);
  }
  for (const r of rows) console.log(r.pos, r.h[0] === r.h[1] ? 'IGUAL' : 'DISTINTO', r.h[0]);
  await a.put({ tricks: [], pos: 's1', hs: null, preset: 'top' }); const t = await a.grab(false); fs.writeFileSync(`${L.OUT}/SUELO_plano_cam5.png`, t.png);
  console.log('cam5', t.w, t.h, a.errs); await a.close();
})();
