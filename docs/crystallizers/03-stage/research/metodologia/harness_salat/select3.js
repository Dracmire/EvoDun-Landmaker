const L = require('./lib.js'), C = require('./common.js'), M = C.M; const fs = require('fs');
const W = 41, Yz = (z) => 55 - z, ix = (x, z) => Yz(z) * W + x; const log = (...a) => console.log(...a);
(async () => {
  const s2 = JSON.parse(fs.readFileSync('/home/claude/salat/scratch/sel2.json')); const out = Object.assign({}, s2);
  const a = await L.open({ closure: 8 }); const setP = (k, v) => a.eval(([k, v]) => { window.SALAT.params[k] = v; }, [k, v]);
  // ---- C2: height measured from s1 ----
  const sets = (cols) => cols.map(([x0, z0]) => { const t = new Set(); for (let z = z0; z < z0 + 2; z++) for (let x = x0; x < x0 + 2; x++) t.add(ix(x, z)); return t; });
  const cols = [[14, 16], [25, 16]]; const [west, east] = sets(cols); let c2h = null; const c2log = [];
  for (let h = 2; h <= 16; h++) {
    await setP('C2', { h, cols }); await a.put({ tricks: ['C2'], pos: 's1', hs: C.HS.s1 }); const g = await a.grab(true);
    const mw = M.bbox(M.largest(M.maskTiles(g.ids, west, [2, 4]))), me = M.bbox(M.largest(M.maskTiles(g.ids, east, [2, 4])));
    c2log.push([h, mw && mw.y0, me && me.y0]); if (mw && me && mw.y0 === 0 && me.y0 === 0) { c2h = h; break; }
  }
  log('C2 heights (h, west y0, east y0):', JSON.stringify(c2log)); out.C2 = { h: c2h, cols }; log('C2 chosen h', c2h);
  // ---- A4: billboard size and place from m1 ----
  const place = { x: 20.5, y: Yz(55) + 0.5 };
  await setP('A4', { bill: Object.assign({ hH: 3, wH: 3 }, place) }); await a.put({ tricks: ['A4'], pos: 'm1', hs: null }); let g = await a.grab(true);
  let o = g.meta.objs.find((q) => Math.abs(q.x - place.x) < 1e-6 && Math.abs(q.y - place.y) < 1e-6); log('A4 probe', JSON.stringify(o));
  if (o) {
    const wH = 3 * (0.12 * 1280) / o.wpx, hH = 3 * (0.15 * 720) / o.hpx; await setP('A4', { bill: Object.assign({ hH: +hH.toFixed(3), wH: +wH.toFixed(3) }, place) });
    await a.put({ tricks: ['A4'], pos: 'm1', hs: null }); g = await a.grab(true); o = g.meta.objs.find((q) => Math.abs(q.x - place.x) < 1e-6); log('A4 sized', JSON.stringify(o)); out.A4 = Object.assign({ hH: +hH.toFixed(3), wH: +wH.toFixed(3) }, place);
  } else out.A4 = null;
  fs.writeFileSync('/home/claude/salat/scratch/sel3.json', JSON.stringify(out)); await a.close();
})();
