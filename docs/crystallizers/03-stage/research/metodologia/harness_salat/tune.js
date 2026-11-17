const T = require('./tunelib.js'), C = require('./cfg3.js'), G = require('./gates.js'), M = C.M, fs = require('fs'); const { log } = T; const { R, ix, Yz } = C;
const clone = (o) => JSON.parse(JSON.stringify(o));
(async () => {
  const x = await T.makeCtx(8), a = x.a;
  let P = { A6: { rail: 0.8, post: 1.4, north: true, south: true, nx0: 8, nx1: 32 }, A3a: { x: 5, z: 23, w: 2, d: 2, h: 6 }, A3b: { x: 31, z: 8, w: 3, d: 2, h: 2.5 }, C2: { h: 7, cols: [[14, 16, 2, 2], [25, 16, 2, 2]] }, B3: { x: 10, z: 22, w: 4, d: 5, h: 1.5 }, C3: { cx: 20, cz: 31, size: 6 }, A4: { cut: false, bill: { x: 20.5, y: 4.1, hH: 2.5, wH: 3.7 } }, tone: '#fff3c4' };
  const report = {}, iters = {};
  const best = async (X, cfgs, apply) => { const rows = []; let bi = -1, bp = -1, bres = null; for (let i = 0; i < Math.min(6, cfgs.length); i++) { const Q = apply(clone(P), cfgs[i]); const r = await x.evalTrick(X, Q); rows.push({ it: i + 1, cfg: cfgs[i], pass: r.pass, own: C.OWN[X].length, fails: Object.fromEntries(Object.entries(r.res).filter(([, v]) => !v.present).map(([p, v]) => [p, v.fails.join('; ')])) }); log(X, 'it', i + 1, JSON.stringify(cfgs[i]), r.pass + '/' + C.OWN[X].length); if (r.pass > bp) { bp = r.pass; bi = i; bres = r; } if (r.pass === C.OWN[X].length) break; } P = apply(P, cfgs[bi]); iters[X] = { used: rows.length, chosen: bi + 1, pass: bp, rows }; log('=>', X, 'chosen it', bi + 1, bp); return bres; };
  // ---------------- A6 ----------------
  const a6cfg = [[0.8, 1.4, 0], [0.8, 1.4, 1], [1.0, 1.6, 1], [0.9, 1.5, 1], [1.0, 1.6, 0], [0.9, 1.5, 0]].map(([rail, post, ext]) => ({ rail, post, ext }));
  await best('A6', a6cfg, (Q, c) => { Q.A6.rail = c.rail; Q.A6.post = c.post; Q.A6.nx0 = c.ext ? 2 : 8; Q.A6.nx1 = c.ext ? 38 : 32; return Q; });
  // ---------------- A3a (west ring, analytic scan at m1..n3) ----------------
  { const cand = []; for (let xx = 2; xx <= 6; xx++) for (let zz = 0; zz <= 37; zz++) for (let h = 5; h <= 12; h++) cand.push({ x: xx, z: zz, w: 2, d: 2, h }); const score = new Array(cand.length).fill(0);
    for (const pos of C.OWN.A3a) { const sc = await x.scan(pos, cand); sc.forEach((b, i) => { const w = (b.x1 - b.x0) / 1280; if (b.x1 / 1280 <= 0.18 && w >= 0.035 && w <= 0.125 && b.y0 <= 0 && b.baseY / 720 > 0.40) score[i]++; }); }
    const order = cand.map((c, i) => [i, score[i]]).sort((p, q) => q[1] - p[1] || cand[p[0]].h - cand[q[0]].h); const cfgs = [clone(P.A3a)]; for (const [i] of order) { if (cfgs.length >= 6) break; const c = cand[i]; if (!cfgs.some((q) => q.x === c.x && q.z === c.z && q.h === c.h)) cfgs.push(c); }
    log('A3a analytic top', order.slice(0, 6).map(([i, s]) => JSON.stringify(cand[i]) + ':' + s).join(' '));
    await best('A3a', cfgs, (Q, c) => { Q.A3a = { x: c.x, z: c.z, w: 2, d: 2, h: c.h }; return Q; }); }
  // ---------------- A3b (east blue blocks, s1..s3, n1..n3) ----------------
  { const blue = new Set([...R(33, 38, 0, 38), ...R(23, 32, 0, 3), ...R(30, 32, 4, 9), ...R(24, 32, 17, 17)]); const cand = [];
    for (const [w, d] of [[3, 2], [4, 2], [3, 3], [4, 3], [5, 3], [5, 2], [6, 3]]) for (let z = 0; z <= 38 - d + 1; z++) for (let xx = 23; xx <= 38 - w + 1; xx++) { let ok = true; for (let zz = z; zz < z + d && ok; zz++) for (let q = xx; q < xx + w; q++) if (!blue.has(ix(q, zz))) { ok = false; break; } if (ok) for (const h of [1.5, 2, 2.5, 3]) cand.push({ x: xx, z, w, d, h }); }
    const score = new Array(cand.length).fill(0), tot = new Array(cand.length).fill(0);
    for (const pos of C.OWN.A3b) { const sc = await x.scan(pos, cand); sc.forEach((b, i) => { const x0 = Math.max(0, b.x0), x1 = Math.min(1280, b.x1), y0 = Math.max(0, b.y0), y1 = Math.min(720, b.y1); const w = (x1 - x0) / 1280, hh = (y1 - y0) / 720; const touch = b.y1 >= 719 || ((b.x1 >= 1279 || b.x0 <= 0) && y1 / 720 >= 0.5); const side = x0 / 1280 >= 0.65 || x1 / 1280 <= 0.35; if (touch && w >= 0.10 && w <= 0.20 && hh >= 0.25 && hh <= 0.60 && y0 / 720 >= 0.4 && side && x1 > x0 && y1 > y0) score[i]++; }); }
    const order = cand.map((c, i) => [i, score[i]]).sort((p, q) => q[1] - p[1] || (cand[p[0]].w * cand[p[0]].d) - (cand[q[0]].w * cand[q[0]].d)); const cfgs = [clone(P.A3b)]; for (const [i] of order) { if (cfgs.length >= 6) break; const c = cand[i]; if (!cfgs.some((q) => q.x === c.x && q.z === c.z && q.w === c.w && q.d === c.d && q.h === c.h)) cfgs.push(c); }
    log('A3b analytic top', order.slice(0, 6).map(([i, s]) => JSON.stringify(cand[i]) + ':' + s).join(' '));
    await best('A3b', cfgs, (Q, c) => { Q.A3b = { x: c.x, z: c.z, w: c.w, d: c.d, h: c.h }; return Q; }); }
  // ---------------- C2 (symmetric pair, s1..s3) ----------------
  { const shapes = []; for (let w = 1; w <= 3; w++) for (let xx = 8; xx + w - 1 <= 16; xx++) shapes.push([xx, 17, w, 1]); for (const s of [[14, 16, 2, 2], [14, 15, 2, 3], [15, 15, 1, 3], [14, 16, 1, 2], [15, 16, 1, 2], [14, 17, 2, 1]]) shapes.push(s);
    const cand = []; for (const s of shapes) for (let h = 2; h <= 14; h++) cand.push({ w: s, e: [41 - s[0] - s[2], s[1], s[2], s[3]], h });
    const score = new Array(cand.length).fill(0);
    for (const pos of C.OWN.C2) { const W_ = await x.scan(pos, cand.map((c) => ({ x: c.w[0], z: c.w[1], w: c.w[2], d: c.w[3], h: c.h }))), E_ = await x.scan(pos, cand.map((c) => ({ x: c.e[0], z: c.e[1], w: c.e[2], d: c.e[3], h: c.h })));
      cand.forEach((c, i) => { const w = W_[i], e = E_[i]; if (w.x0 / 1280 >= 0.30 && w.x1 / 1280 <= 0.48 && e.x0 / 1280 >= 0.60 && e.x1 / 1280 <= 0.80 && (e.x0 - w.x1) / 1280 >= 0.17 && w.y0 <= 0.15 * 720 && e.y0 <= 0.15 * 720) score[i]++; }); }
    const order = cand.map((c, i) => [i, score[i]]).sort((p, q) => q[1] - p[1] || cand[p[0]].h - cand[q[0]].h); const cfgs = [{ cols: clone(P.C2.cols), h: P.C2.h }]; for (const [i] of order) { if (cfgs.length >= 6) break; const c = cand[i]; if (!cfgs.some((q) => JSON.stringify(q.cols[0]) === JSON.stringify(c.w) && q.h === c.h)) cfgs.push({ cols: [c.w, c.e], h: c.h }); }
    log('C2 analytic top', order.slice(0, 6).map(([i, s]) => JSON.stringify([cand[i].w, cand[i].h]) + ':' + s).join(' '));
    await best('C2', cfgs, (Q, c) => { Q.C2 = { h: c.h, cols: c.cols }; return Q; }); }
  // ---------------- B3 (s1..s3) ----------------
  { const cand = []; for (const h of [1, 1.5, 2]) cand.push({ x: 10, z: 22, w: 4, d: 5, h }); for (const xs of [[2, 7], [33, 38]]) for (const [w, d] of [[3, 3], [4, 4], [4, 6], [6, 6], [6, 8], [3, 8]]) for (let xx = xs[0]; xx + w - 1 <= xs[1]; xx++) for (let z = 0; z + d - 1 <= 38; z += 1) for (const h of [1, 1.5, 2]) cand.push({ x: xx, z, w, d, h });
    const score = new Array(cand.length).fill(0), sumA = new Array(cand.length).fill(0);
    for (const pos of C.OWN.B3) { const sc = await x.scan(pos, cand); sc.forEach((b, i) => { const u = b.cx / 1280; if (b.area / (1280 * 720) >= 0.012 && b.band >= 2 && b.band <= 4 && (u < 0.35 || u > 0.65) && b.cx >= 0 && b.cx <= 1280 && b.cy >= 0 && b.cy <= 720) { score[i]++; sumA[i] += b.area; } }); }
    const order = cand.map((c, i) => [i, score[i]]).sort((p, q) => q[1] - p[1] || sumA[q[0]] - sumA[p[0]]); const cfgs = [clone(P.B3)]; for (const [i] of order) { if (cfgs.length >= 6) break; const c = cand[i]; if (!cfgs.some((q) => q.x === c.x && q.z === c.z && q.w === c.w && q.d === c.d && q.h === c.h)) cfgs.push(c); }
    log('B3 analytic top', order.slice(0, 6).map(([i, s]) => JSON.stringify(cand[i]) + ':' + s).join(' '));
    await best('B3', cfgs, (Q, c) => { Q.B3 = { x: c.x, z: c.z, w: c.w, d: c.d, h: c.h }; return Q; }); }
  // ---------------- C3 (all 9 positions) ----------------
  { const cand = []; for (const size of [6, 5, 4]) for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { const cx = 20 + dx + (size % 2 ? 0.5 : 0), cz = 31 + dz + (size % 2 ? 0.5 : 0), x0 = Math.round(cx - size / 2), z0 = Math.round(cz - size / 2); if (x0 < 8 || x0 + size - 1 > 32 || z0 < 18 || z0 + size - 1 > 37) continue; cand.push({ x: x0, z: z0, w: size, d: size, h: 0, cx, cz, size }); }
    const score = new Array(cand.length).fill(0);
    for (const pos of C.OWN.C3) { const sc = await x.scan(pos, cand); sc.forEach((b, i) => { const sh = b.area / (1280 * 720); if (sh >= 0.03 && sh <= 0.08 && (b.band === 2 || b.band === 3)) score[i]++; }); }
    const order = cand.map((c, i) => [i, score[i]]).sort((p, q) => q[1] - p[1] || (Math.abs(cand[p[0]].cx - 20) + Math.abs(cand[p[0]].cz - 31)) - (Math.abs(cand[q[0]].cx - 20) + Math.abs(cand[q[0]].cz - 31)) || cand[q[0]].size - cand[p[0]].size); const cfgs = [clone(P.C3)]; for (const [i] of order) { if (cfgs.length >= 6) break; const c = cand[i]; if (!cfgs.some((q) => q.cx === c.cx && q.cz === c.cz && q.size === c.size)) cfgs.push({ cx: c.cx, cz: c.cz, size: c.size }); }
    log('C3 analytic top', order.slice(0, 6).map(([i, s]) => JSON.stringify([cand[i].cx, cand[i].cz, cand[i].size]) + ':' + s).join(' '));
    await best('C3', cfgs, (Q, c) => { Q.C3 = { cx: c.cx, cz: c.cz, size: c.size }; return Q; }); }
  // ---------------- A4b ----------------
  { // size from the scale at m1 (target fractions of the frame), then the options (a) panel at the wall, (b) billboard with a visible base
    const size = async (y, wf, hf) => { await x.setParams(Object.assign(clone(P), { A4: { cut: false, bill: { x: 20.5, y, hH: 3, wH: 3 } } })); await x.put(C.TR, 'm1'); const g = await a.grab(false); const o = g.meta.objs.find((q) => Math.abs(q.y - y) < 1e-6 && Math.abs(q.x - 20.5) < 1e-6); if (!o) return null; return { hH: +(3 * hf * 720 / o.hpx).toFixed(3), wH: +(3 * wf * 1280 / o.wpx).toFixed(3), probe: o.drawn }; };
    const defs = [['a', 4.1, 0.12, 0.15, '#fff3c4'], ['a', 4.1, 0.16, 0.20, '#fff3c4'], ['a', 4.1, 0.16, 0.20, '#ffffff'], ['b', 6.5, 0.16, 0.20, '#ffffff'], ['b', 9.5, 0.16, 0.20, '#ffffff'], ['a', 4.1, 0.12, 0.15, '#ffffff']]; const cfgs = [];
    for (const [k, y, wf, hf, tone] of defs) { const sz = await size(y, wf, hf); if (sz) cfgs.push({ k, y, wf, hf, tone, hH: sz.hH, wH: sz.wH }); }
    await best('A4', cfgs, (Q, c) => { Q.A4 = { cut: false, bill: { x: 20.5, y: c.y, hH: c.hH, wH: c.wH } }; Q.tone = c.tone; return Q; }); }
  fs.writeFileSync('/home/claude/salat/scratch/tuned.json', JSON.stringify({ P, iters }, null, 1)); log('FINAL', JSON.stringify(P)); await a.close();
})().catch((e) => { console.error(e); process.exit(1); });
