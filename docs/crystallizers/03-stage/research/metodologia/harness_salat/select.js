const L = require('./lib.js'), C = require('./common.js'), K = require('./controls.js'), M = C.M; const fs = require('fs');
const W = 41, Yz = (z) => 55 - z, ix = (x, z) => Yz(z) * W + x;
const log = (...a) => console.log(...a);
(async () => {
  const a = await L.open({ closure: 8 }); const out = {};
  const setP = (k, v) => a.eval(([k, v]) => { window.SALAT.params[k] = v; }, [k, v]);
  const projB = (x, z, w, d, h, rel) => a.eval(([x, z, w, d, h, rel]) => { const S0 = window.SALAT; let ys = [], xs = [], base = []; for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) { const g = window.__evo.S().__base ? window.__evo.S().__base[S0.idx(xx, zz)] : S0.tileTop(xx, zz), top = rel ? g + h * 2 : h * 2; const y0 = S0.Yz(zz); for (const [cx, cy] of [[xx, y0], [xx + 1, y0], [xx, y0 + 1], [xx + 1, y0 + 1]]) { const p = S0.proj([[cx, cy, top]])[0], q = S0.proj([[cx, cy, g]])[0]; xs.push(p[0], q[0]); ys.push(p[1], q[1]); base.push(q[1]); } } return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), baseY: Math.max(...base) }; }, [x, z, w, d, h, rel]);
  const cen = (x, z, w, d) => a.eval(([x, z, w, d]) => { const S0 = window.SALAT, g = window.__evo.S().__base ? window.__evo.S().__base[S0.idx(x, z)] : S0.tileTop(x, z); const p = S0.proj([[x + w / 2, S0.Yz(z) + 1 - d / 2, g]])[0]; const b = S0.bands(); const yc = S0.Yz(z) + 1 - d / 2; return { u: p[0] / 1280, v: p[1] / 720, band: Math.max(1, Math.min(5, Math.floor((b.yNear - yc) / b.len * 5) + 1)), dist: b.yNear - yc }; }, [x, z, w, d]);
  // ---------- A3a at m1 ----------
  await a.put({ tricks: [], pos: 'm1', hs: null }); const gm = await a.grab(true);
  let massL = 0, massR = 0; for (let p = 0; p < 1280 * 720; p++) { const v = gm.ids[p]; if (v >= 0 && M.kindOf(v) === 2) { if ((p % 1280) < 640) massL++; else massR++; } }
  const ringBlocks = []; for (const xs of [[2, 6], [33, 37]]) for (let x = xs[0]; x <= xs[1]; x++) for (let z = 0; z <= 37; z++) ringBlocks.push([x, z]);
  const cands = []; for (const [x, z] of ringBlocks) { const c = await cen(x, z, 2, 2); if ((c.u >= 0.02 && c.u <= 0.14) || (c.u >= 0.86 && c.u <= 0.98)) cands.push(Object.assign({ x, z, side: c.u < 0.5 ? 'W' : 'E' }, c)); }
  cands.sort((p, q) => ((p.band >= 2 && p.band <= 4 ? 0 : 1) - (q.band >= 2 && q.band <= 4 ? 0 : 1)) || p.dist - q.dist);
  log('A3a candidates', cands.length, 'mass W/E at m1 (wall px)', massL, massR);
  const valid = { W: null, E: null }, tried = []; let best = null;
  for (const c of cands) {
    if (valid[c.side]) continue; if (c.band === 5) continue;
    let hh = null; for (let h = 5; h <= 12; h++) { const b = await projB(c.x, c.z, 2, 2, h, true); if (b.y0 <= 0) { hh = h; break; } } if (!hh) { tried.push([c.x, c.z, 'no exit <=12H']); continue; }
    { const b0 = await projB(c.x, c.z, 2, 2, hh, true); const wd = (b0.x1 - b0.x0) / 1280; if (process.env.DBG) log('dbg', c.x, c.z, 'B' + c.band, hh, wd.toFixed(3), (b0.baseY / 720).toFixed(3), c.u.toFixed(3)); if (wd < 0.035 || wd > 0.17 || b0.baseY / 720 <= 0.36) { continue; } }
    await setP('A3a', { x: c.x, z: c.z, w: 2, d: 2, h: hh }); await a.put({ tricks: ['A3a'], pos: 'm1', hs: null }); const g = await a.grab(true); const b = await projB(c.x, c.z, 2, 2, hh, true);
    const tiles = new Set(); for (let zz = c.z; zz < c.z + 2; zz++) for (let xx = c.x; xx < c.x + 2; xx++) tiles.add(ix(xx, zz));
    const r = M.A3a(g, { tiles, baseY: b.baseY, colY: Yz(c.z) }); tried.push([c.x, c.z, c.side, 'B' + c.band, hh, r.present, r.fails.join('; ')]);
    if (r.present) valid[c.side] = { x: c.x, z: c.z, h: hh, band: c.band, figs: r };
    if (!best || r.fails.length < best.n) best = { n: r.fails.length, x: c.x, z: c.z, h: hh, band: c.band, side: c.side, fails: r.fails };
    if (valid.W && valid.E) break; if (tried.length > 400) break;
  }
  log(tried.map((t) => JSON.stringify(t)).join('\n')); log('valid', JSON.stringify({ W: valid.W && [valid.W.x, valid.W.z, valid.W.h], E: valid.E && [valid.E.x, valid.E.z, valid.E.h] }));
  let side = null, why = '';
  if (valid.W && valid.E) { side = massL > massR ? 'E' : massR > massL ? 'W' : 'W'; why = `both valid; wall mass W ${massL} E ${massR} -> opposite to the larger` + (massL === massR ? ' (tie: west)' : ''); } else if (valid.W) { side = 'W'; why = 'only west valid'; } else if (valid.E) { side = 'E'; why = 'only east valid'; }
  if (!side) { log('A3a: no valid candidate; best', JSON.stringify(best)); out.A3a = best ? { x: best.x, z: best.z, w: 2, d: 2, h: best.h, side: best.side, band: best.band, why: 'NO candidate meets the sheet at m1; the one with fewest failing figures is built: ' + best.fails.join('; '), bestEffort: true } : null; } else { const v = valid[side]; out.A3a = { x: v.x, z: v.z, w: 2, d: 2, h: v.h, side, why, band: v.band }; }
  log('A3a chosen', JSON.stringify(out.A3a));
  fs.writeFileSync('/home/claude/salat/scratch/sel_a3a.json', JSON.stringify({ out, tried }));
  await a.close();
})();
