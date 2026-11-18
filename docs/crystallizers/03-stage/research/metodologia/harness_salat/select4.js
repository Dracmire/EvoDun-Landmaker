const L = require('./lib.js'), fs = require('fs'); const log = console.log;
(async () => {
  const a = await L.open({ closure: 8 }); const place = { x: 20.5, y: 4.1, always: true };
  const setA4 = (b) => a.eval((b) => { window.SALAT.params.A4 = { cut: false, bill: b }; }, b);
  await setA4(Object.assign({ hH: 3, wH: 3 }, place)); await a.put({ tricks: ['A4'], pos: 'm1', hs: null }); let g = await a.grab(false);
  const find = (g) => g.meta.objs.find((q) => Math.abs(q.x - place.x) < 1e-6 && Math.abs(q.y - place.y) < 1e-6);
  let o = find(g); log('probe', JSON.stringify(o));
  const wH = +(3 * 0.12 * 1280 / o.wpx).toFixed(3), hH = +(3 * 0.15 * 720 / o.hpx).toFixed(3);
  await setA4(Object.assign({ hH, wH }, place)); await a.put({ tricks: ['A4'], pos: 'm1', hs: null }); g = await a.grab(false); o = find(g); log('sized', JSON.stringify(o));
  fs.writeFileSync('/home/claude/salat/scratch/sel4.json', JSON.stringify(Object.assign({ hH, wH }, place))); fs.writeFileSync('/home/claude/salat/scratch/a4b_m1.png', g.png); await a.close();
})();
