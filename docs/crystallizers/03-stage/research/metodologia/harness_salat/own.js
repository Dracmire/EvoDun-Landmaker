const L = require('./lib.js'), C = require('./common.js'); const fs = require('fs'); const R = (x0, x1, z0, z1) => [...C.M.rectTiles(x0, x1, z0, z1)];
(async () => {
  const a = await L.open(); const out = {};
  const ring = [...R(2, 7, 0, 38), ...R(33, 38, 0, 38)], a3b = [...ring, ...R(8, 17, 0, 3), ...R(23, 32, 0, 3), ...R(8, 10, 4, 9), ...R(30, 32, 4, 9)];
  for (const pos of C.ORDER) {
    await a.put({ tricks: [], pos, hs: C.HS[pos] });
    out[pos] = await a.eval((c) => { const S0 = window.SALAT, f = (set, pred) => { let n = 0; for (const i of set) { const x = i % 41, z = 55 - Math.floor(i / 41), [px, py] = S0.proj([[x + 0.5, S0.Yz(z) + 0.5, S0.tileTop(x, z)]])[0], u = px / 1280, v = py / 720; if (pred(u, v)) n++; } return n; };
      return { A3a: f(c.ring, (u, v) => (u >= 0.02 && u <= 0.14) || (u >= 0.86 && u <= 0.98)), A3b: f(c.a3b, (u, v) => (u <= 0.25 || u >= 0.75) && v >= 0.7 && v <= 1.0) }; }, { ring, a3b });
    console.log(pos, JSON.stringify(out[pos]));
  }
  fs.writeFileSync('/home/claude/salat/scratch/own.json', JSON.stringify(out)); await a.close();
})();
