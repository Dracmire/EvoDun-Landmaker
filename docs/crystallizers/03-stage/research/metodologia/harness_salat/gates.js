const C = require('./cfg3.js'), M = C.M, K = require('./controls.js'); const { W, Yz, ix, R } = C;
const A3Atiles = (p) => C.rectSet(p.A3a.x, p.A3a.z, p.A3a.w || 2, p.A3a.d || 2), A3Btiles = (p) => C.rectSet(p.A3b.x, p.A3b.z, p.A3b.w, p.A3b.d);
const c2sets = (p) => p.C2.cols.map(([x, z, w, d]) => C.rectSet(x, z, w || 2, d || 2));
const b3tiles = (p) => C.rectSet(p.B3.x, p.B3.z, p.B3.w, p.B3.d);
const c3foot = (p) => { const q = p.C3, size = q.size, x0 = Math.round(q.cx - size / 2), z0 = Math.round(q.cz - size / 2); return C.rectSet(x0, z0, size, size); };
const STAIR = R(17, 23, 14, 17);
const stairDist = (h) => { let m = 1e9; for (const i of STAIR) { const x = i % W + 0.5, y = Math.floor(i / W) + 0.5; m = Math.min(m, Math.hypot(h[0] - x, h[1] - y)); } return m; };
const volOf = (p) => ({
  A6: [[8, 33, Yz(38), Yz(38) + 1, 5, 7.8], [8, 17, Yz(17), Yz(17) + 1, 2.5, 7.8], [24, 33, Yz(17), Yz(17) + 1, 2.5, 7.8]],
  A3a: [[p.A3a.x, p.A3a.x + (p.A3a.w || 2), Yz(p.A3a.z + (p.A3a.d || 2) - 1), Yz(p.A3a.z) + 1, 2.5, 5 + p.A3a.h * 2]],
  A3b: [[p.A3b.x, p.A3b.x + p.A3b.w, Yz(p.A3b.z + p.A3b.d - 1), Yz(p.A3b.z) + 1, 2.5, 5 + p.A3b.h * 2]],
  A4: p.A4.panel ? [[p.A4.panel.x0, p.A4.panel.x1 + 1, Yz(51), Yz(51) + 1, 2.5, 5 + p.A4.panel.h * 2]] : [],
  C3: [[Math.round(p.C3.cx - p.C3.size / 2), Math.round(p.C3.cx - p.C3.size / 2) + p.C3.size, Yz(Math.round(p.C3.cz - p.C3.size / 2) + p.C3.size - 1), Yz(Math.round(p.C3.cz - p.C3.size / 2)) + 1, 5, 5]],
  C2: p.C2.cols.map(([x, z, w, d]) => [x, x + (w || 2), Yz(z + (d || 2) - 1), Yz(z) + 1, 2.5, 5 + p.C2.h * 2]),
  B3: [[p.B3.x, p.B3.x + p.B3.w, Yz(p.B3.z + p.B3.d - 1), Yz(p.B3.z) + 1, 5, 5 + p.B3.h * 2 + 0]],
});
// per-frame page data (k tables, bands, boxes, base column of A3a, masks)
async function pageInfo(a, p) {
  return a.eval((e) => { const S0 = window.SALAT, ev = window.__evo, S = ev.S(), B = S.__base; const mi = S0.maskInfo(); const pathIdx = mi.path || []; let vol = 0; for (const i of pathIdx) if (B && Math.abs(S.levelH[S.fine[i]] - B[i]) > 1e-6) vol++; delete mi.mask;
    const bandOf = (y) => S0.bandAt(y);
    const baseCol = (x, z, w, d) => { let m = -1; for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) { const g = B[S0.idx(xx, zz)], y0 = S0.Yz(zz); for (const [cx, cy] of [[xx, y0], [xx + 1, y0], [xx, y0 + 1], [xx + 1, y0 + 1]]) { const q = S0.proj([[cx, cy, g]])[0]; m = Math.max(m, q[1]); } } return m; };
    const kt = {}; for (const [nm, y] of [['N', 17.5], ['S', 38.5]]) { kt['R' + nm] = {}; kt['P' + nm] = {}; for (let x = 8; x <= 32; x++) { kt['R' + nm][x] = S0.kAt([[x + 0.5, y, 6.6]])[0]; kt['P' + nm][x] = S0.kAt([[x + 0.5, y, 7.8]])[0]; } }
    const hero = ev.st.hero; const boxes = {}; for (const [k, vs] of Object.entries(e.VOL)) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [ax, bx, ay, by, hl, hh] of vs) for (const cx of [ax, bx]) for (const cy of [ay, by]) for (const h of [hl, hh]) { const q = S0.proj([[cx, cy, h]])[0]; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } boxes[k] = [x0, y0, x1, y1]; }
    return { kt, mi: { maskHash: mi.maskHash, pathHash: mi.pathHash, count: mi.count, goal: mi.goal, goalWalkable: mi.goalWalkable, regions: mi.regions }, volOnPath: vol, pathLen: pathIdx.length, redTiles: Object.fromEntries(Object.entries(S.salat && S.salat.tiles || {})), baseA3a: B ? baseCol(e.a3a.x, e.a3a.z, e.a3a.w || 2, e.a3a.d || 2) : null, bandC3: bandOf(55 - e.c3z), bandB3: bandOf(55 - e.b3z), boxes, hero: [hero.x, hero.y] }; },
    { VOL: volOf(p), a3a: p.A3a, c3z: p.C3.cz, b3z: p.B3.z + p.B3.d / 2 });
}
async function gate(X, g, info, p, pos) {
  const grp = pos[0];
  if (X === 'A6') { const set = grp === 's' ? C.A6S : C.A6N, S = grp === 's'; return M.A6(g, { rail: set.rail, posts: set.posts, all: set.all, kRail: (x) => info.kt[S ? 'RS' : 'RN'][x], kPost: (x) => info.kt[S ? 'PS' : 'PN'][x], railFace: S ? 4.1 : 1.6, postFace: S ? 5.3 : 2.8, gapTiles: S ? 7 : 0 }); }
  if (X === 'A3a') return M.A3a(g, { tiles: A3Atiles(p), baseY: info.baseA3a, colY: Yz(p.A3a.z + 1) });
  if (X === 'A3b') return M.A3b(g, { tiles: A3Btiles(p) });
  if (X === 'A4') return M.A4(g, { find: (m) => m.objs.find((o) => Math.abs(o.x - p.A4.bill.x) < 1e-6 && Math.abs(o.y - p.A4.bill.y) < 1e-6) });
  if (X === 'C3') { const paint = new Set(info.redTiles.C3 || []); return M.C3(g, { foot: c3foot(p), paint: paint.size ? paint : c3foot(p), band: info.bandC3 }); }
  if (X === 'C2') { const [w, e] = c2sets(p); return M.C2(g, { west: w, east: e, dist: stairDist(info.hero) }); }
  if (X === 'B3') return M.B3(g, { tiles: b3tiles(p), band: info.bandB3, relH: p.B3.h });
}
module.exports = { pageInfo, gate, volOf, A3Atiles, A3Btiles, c2sets, b3tiles, c3foot, stairDist };
