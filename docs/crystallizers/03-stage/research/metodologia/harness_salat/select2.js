const L = require('./lib.js'), C = require('./common.js'), M = C.M; const fs = require('fs');
const W = 41, Yz = (z) => 55 - z, ix = (x, z) => Yz(z) * W + x; const log = (...a) => console.log(...a);
(async () => {
  const sel = JSON.parse(fs.readFileSync('/home/claude/salat/scratch/sel_a3a.json')).out; const A3a = sel.A3a; const out = { A3a };
  const a = await L.open({ closure: 8 });
  const setP = (k, v) => a.eval(([k, v]) => { window.SALAT.params[k] = v; }, [k, v]);
  const baseOf = 'window.__evo.S().__base';
  const projB = (x, z, w, d, h) => a.eval(([x, z, w, d, h]) => { const S0 = window.SALAT, B = window.__evo.S().__base; let ys = [], xs = [], base = []; for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) { const g = B ? B[S0.idx(xx, zz)] : S0.tileTop(xx, zz), top = g + h * 2, y0 = S0.Yz(zz); for (const [cx, cy] of [[xx, y0], [xx + 1, y0], [xx, y0 + 1], [xx + 1, y0 + 1]]) { const p = S0.proj([[cx, cy, top]])[0], q = S0.proj([[cx, cy, g]])[0]; xs.push(p[0], q[0]); ys.push(p[1], q[1]); base.push(q[1]); } } return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), baseY: Math.max(...base) }; }, [x, z, w, d, h]);
  await setP('A3a', { x: A3a.x, z: A3a.z, w: 2, d: 2, h: A3a.h });
  // blue tiles on the side opposite to A3a
  const east = A3a.side === 'W'; const R = (x0, x1, z0, z1) => { const s = new Set(); for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) s.add(ix(x, z)); return s; };
  const blue = east ? [R(33, 38, 0, 38), R(23, 32, 0, 3), R(30, 32, 4, 9)] : [R(2, 7, 0, 38), R(8, 17, 0, 3), R(8, 10, 4, 9)];
  const inBlue = (x, z) => blue.some((s) => s.has(ix(x, z)));
  const blocks = []; for (let z = 0; z <= 37; z++) for (let x = 2; x <= 36; x++) { let ok = true; for (let zz = z; zz < z + 2 && ok; zz++) for (let xx = x; xx < x + 3; xx++) if (!inBlue(xx, zz)) { ok = false; break; } if (ok) blocks.push([x, z]); }
  log('A3b side', east ? 'E' : 'W', 'blocks', blocks.length);
  const cand = {};
  for (const pos of ['s1', 'n1']) {
    await a.put({ tricks: ['A3a'], pos, hs: C.HS[pos] });
    const list = [];
    for (const [x, z] of blocks) { const r = await a.eval(([x, z]) => { const S0 = window.SALAT, B = window.__evo.S().__base, g = B[S0.idx(x, z)]; const p = S0.proj([[x + 1.5, S0.Yz(z), g]])[0]; return [p[0] / 1280, p[1] / 720]; }, [x, z]); if ((r[0] <= 0.25 || r[0] >= 0.75) && r[1] >= 0.7 && r[1] <= 1.0) list.push({ x, z, u: r[0], v: r[1], d: Math.hypot(r[0] - (east ? 0.88 : 0.12), r[1] - 0.85) }); }
    list.sort((p, q) => p.d - q.d); cand[pos] = list.slice(0, 40); log(pos, 'corner candidates', list.length);
  }
  const done = new Map(), results = [];
  const evalAt = async (c, h, pos) => { await a.put({ tricks: ['A3a', 'A3b'], pos, hs: C.HS[pos] }); const g = await a.grab(true); const tiles = new Set(); for (let zz = c.z; zz < c.z + 2; zz++) for (let xx = c.x; xx < c.x + 3; xx++) tiles.add(ix(xx, zz)); return M.A3b(g, { tiles }); };
  const apparent = (r) => { const m = (r.fails.join(';') + ' ' + JSON.stringify(r.figs)); const f = r.figs['apparent_height']; return typeof f === 'number' ? f : NaN; };
  for (const pos0 of ['s1', 'n1']) for (const c of cand[pos0]) {
    const key = c.x + ',' + c.z; if (done.has(key)) continue; done.set(key, 1);
    let chosen = null, r1 = null;
    for (const h of [1.5, 2, 2.5, 3]) { await setP('A3b', { x: c.x, z: c.z, w: 3, d: 2, h }); r1 = await evalAt(c, h, 's1'); chosen = h; const ah = r1.figs['apparent_height']; if (r1.present || (typeof ah === 'number' && ah >= 0.25)) break; }
    const rr = { s1: r1.present ? 'PRESENTE' : r1.fails.join('; ') }; let passes = r1.present ? 1 : 0;
    const r2 = await evalAt(c, chosen, 'n1'); rr.n1 = r2.present ? 'PRESENTE' : r2.fails.join('; '); if (r2.present) passes++;
    results.push({ x: c.x, z: c.z, from: pos0, h: chosen, passes, nfail: r1.fails.length + r2.fails.length, rr }); log(JSON.stringify(results[results.length - 1]));
  }
  results.sort((p, q) => (q.passes - p.passes) || (p.nfail - q.nfail)); const bestA3b = results.find((r) => r.h);
  out.A3b = bestA3b ? { x: bestA3b.x, z: bestA3b.z, w: 3, d: 2, h: bestA3b.h, passes: bestA3b.passes, rr: bestA3b.rr, side: east ? 'E' : 'W' } : null; log('A3b chosen', JSON.stringify(out.A3b));
  fs.writeFileSync('/home/claude/salat/scratch/sel2.json', JSON.stringify(out)); await a.close();
})();
