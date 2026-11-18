const T = require('./tunelib.js'), C = require('./cfg3.js');
(async () => { const x = await T.makeCtx(8);
 const P0 = { A6: { rail: 0.8, post: 1.4, north: true, south: true, nx0: 8, nx1: 32 }, A3a: { x: 5, z: 23, w: 2, d: 2, h: 6 }, A3b: { x: 31, z: 8, w: 3, d: 2, h: 2.5 }, C2: { h: 7, cols: [[14, 16, 2, 2], [25, 16, 2, 2]] }, B3: { x: 10, z: 22, w: 4, d: 5, h: 1.5 }, C3: { cx: 20, cz: 31, size: 6 }, A4: { cut: false, bill: { x: 20.5, y: 4.1, hH: 2.5, wH: 3.7 } }, tone: '#fff3c4' };
 for (const rail of [1.03, 1.05, 1.07]) { const P = JSON.parse(JSON.stringify(P0)); P.A6.rail = rail; P.A6.post = 1.4; P.A6.nx0 = 2; P.A6.nx1 = 38;
  console.log('rail', rail, 'fy', JSON.stringify(await x.fitFy(P)));
  const r = await x.evalTrick('A6', P); console.log(r.pass, JSON.stringify(Object.fromEntries(Object.entries(r.res).map(([p, v]) => [p, v.present ? 'OK' : v.fails.join('; ')])))); }
 await x.a.close(); })().catch((e) => { console.error(e); process.exit(1); });
