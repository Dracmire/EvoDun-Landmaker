const L = require('./lib.js'), C = require('./common.js'), K = require('./controls.js'); 
(async () => {
  for (let h = 8; h <= 14; h++) {
    const a = await L.open({ closure: h }); const row = [];
    for (const pos of C.ORDER) { await a.put({ tricks: [], pos, hs: C.HS[pos] }); const g = await a.grab(true); row.push(+(K.emptyShare(g) * 100).toFixed(2)); }
    console.log(h, JSON.stringify(row), Math.max(...row), a.errs.length); await a.close();
    if (Math.max(...row) <= 2) break;
  }
})();
