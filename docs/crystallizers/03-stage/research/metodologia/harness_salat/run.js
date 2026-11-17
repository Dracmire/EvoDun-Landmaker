const L = require('./lib.js'), C = require('./common.js'), K = require('./controls.js'), M = C.M; const fs = require('fs');
const W = 41, Yz = (z) => 55 - z, ix = (x, z) => Yz(z) * W + x; const log = (...a) => console.log(...a);
const SEL = JSON.parse(fs.readFileSync('/home/claude/salat/scratch/sel3.json')), CLOSURE = 8, OUT = L.OUT, SC = '/home/claude/salat/scratch';
const R = (x0, x1, z0, z1) => M.rectTiles(x0, x1, z0, z1);
const TR = ['A6', 'A3a', 'A3b', 'A4', 'C3', 'C2', 'B3'];
const A3A = new Set(), A3B = new Set(); for (let z = SEL.A3a.z; z < SEL.A3a.z + 2; z++) for (let x = SEL.A3a.x; x < SEL.A3a.x + 2; x++) A3A.add(ix(x, z)); for (let z = SEL.A3b.z; z < SEL.A3b.z + 2; z++) for (let x = SEL.A3b.x; x < SEL.A3b.x + 3; x++) A3B.add(ix(x, z));
const C2W = R(14, 15, 16, 17), C2E = R(25, 26, 16, 17), ISLA = R(10, 13, 22, 26), FOOT = R(17, 22, 28, 33), STAIR = R(17, 23, 14, 17);
const PAINT = new Set(); // tiles painted by C3 (ring + star), from the page's own table
// geometry volumes of each trick (map x0 x1, map y0 y1, h lo, h hi in tiles) for the box of V1.4 (c)
const VOL = {
  A6: [[8, 33, Yz(38), Yz(38) + 1, 5, 7.8]], A3a: [[SEL.A3a.x, SEL.A3a.x + 2, Yz(SEL.A3a.z + 1), Yz(SEL.A3a.z) + 1, 2.5, 5 + SEL.A3a.h * 2]],
  A3b: [[SEL.A3b.x, SEL.A3b.x + 3, Yz(SEL.A3b.z + 1), Yz(SEL.A3b.z) + 1, 2.5, 5 + SEL.A3b.h * 2]], A4: [[18, 23, Yz(55), Yz(52) + 1, 0, 16]],
  C3: [[17, 23, Yz(33), Yz(28) + 1, 5, 5]], C2: [[14, 16, Yz(17), Yz(16) + 1, 2.5, 5 + SEL.C2.h * 2], [25, 27, Yz(17), Yz(16) + 1, 2.5, 5 + SEL.C2.h * 2]], B3: [[10, 14, Yz(26), Yz(22) + 1, 5, 8]],
};
(async () => {
  const a = await L.open({ closure: CLOSURE }); const res = { closure: CLOSURE, sel: SEL, pos: {}, states: {}, own: {}, fy: {}, hashes: {} };
  await a.eval((s) => { const P = window.SALAT.params; P.A3a = { x: s.A3a.x, z: s.A3a.z, w: 2, d: 2, h: s.A3a.h }; P.A3b = { x: s.A3b.x, z: s.A3b.z, w: 3, d: 2, h: s.A3b.h }; P.A4 = { bill: Object.assign({}, s.A4) }; P.C2 = { h: s.C2.h, cols: s.C2.cols }; P.B3 = { h: 4 }; }, SEL);
  const HS = JSON.parse(JSON.stringify(C.HS));
  // ---- fy of the n group, in TECHO ----
  for (const pos of ['n1', 'n2', 'n3']) { let found = null; for (let fy = 0.5; fy <= 0.8001 && !found; fy += 0.01) { await a.put({ tricks: TR, pos, hs: [0.63, +fy.toFixed(2)] }); const g = await a.grab(true); const cap = M.maskTiles(g.ids, C.RAILONLY, [4]); const tops = []; for (let x = 0; x < 1280; x++) for (let y = 0; y < 720; y++) if (cap[y * 1280 + x]) { tops.push(y); break; } const yt = M.median(tops) / 720; if (yt >= 0.4 && yt <= 0.6) found = +fy.toFixed(2); } HS[pos] = [0.63, found]; res.fy[pos] = found; log('fy', pos, found); }
  // ---- states ----
  const STATES = [['SUELO', [], false, null], ['TECHO', TR, false, null], ['PLACEBO', [], true, null], ...TR.map((x) => ['TECHO-' + x, TR.filter((t) => t !== x), false, x])];
  const pageInfo = (pos, extra) => a.eval((e) => { const S0 = window.SALAT, ev = window.__evo, S = ev.S(); const B = S.__base; const mi = S0.maskInfo(); const pathIdx = mi.path || []; let vol = 0; for (const i of pathIdx) if (B && Math.abs(S.levelH[S.fine[i]] - B[i]) > 1e-6) vol++; delete mi.mask;
    const b = S0.bands(); const bandOf = (y) => Math.max(1, Math.min(5, Math.floor((b.yNear - y) / b.len * 5) + 1));
    const baseCol = (x, z, w, d) => { let m = -1; for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) { const g = B[S0.idx(xx, zz)], y0 = S0.Yz(zz); for (const [cx, cy] of [[xx, y0], [xx + 1, y0], [xx, y0 + 1], [xx + 1, y0 + 1]]) { const q = S0.proj([[cx, cy, g]])[0]; m = Math.max(m, q[1]); } } return m; };
    const hero = ev.st.hero; const boxes = {}; for (const [k, vs] of Object.entries(e.VOL)) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [ax, bx, ay, by, hl, hh] of vs) for (const cx of [ax, bx]) for (const cy of [ay, by]) for (const h of [hl, hh]) { const q = S0.proj([[cx, cy, h]])[0]; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } boxes[k] = [x0, y0, x1, y1]; }
    return { mi: { maskHash: mi.maskHash, pathHash: mi.pathHash, count: mi.count, goal: mi.goal, goalWalkable: mi.goalWalkable, regions: mi.regions }, volOnPath: vol, pathLen: pathIdx.length, redTiles: Object.fromEntries(Object.entries(S.salat && S.salat.tiles || {}).map(([k, v]) => [k, v])), baseA3a: B ? baseCol(e.a3a.x, e.a3a.z, 2, 2) : null, bandC3: bandOf(24), bandB3: bandOf(30.5), boxes, hero: [hero.x, hero.y] }; }, { VOL, a3a: SEL.A3a });
  const stairDist = (h) => { let m = 1e9; for (const i of STAIR) { const x = i % W + 0.5, y = Math.floor(i / W) + 0.5; m = Math.min(m, Math.hypot(h[0] - x, h[1] - y)); } return m; };
  const frames = {}; // frames[state][pos] = { rgba, png, sha, m }
  for (let pass = 0; pass < 2; pass++) {
    for (const [name, tricks, placebo, X] of STATES) {
      const posList = name.startsWith('TECHO-') ? res.own[X] || C.ORDER : C.ORDER;
      if (pass === 0 && name === 'SUELO') { // own positions (V1.4 a) in SUELO with the final heroScreen
        await a.eval(() => 0); for (const t of TR) res.own[t] = [];
        for (const pos of C.ORDER) { await a.put({ tricks: [], pos, hs: HS[pos] }); const o = await a.eval((c) => { const S0 = window.SALAT, out = {}, cnt = (set, pred, top) => { let n = 0, t = 0; for (const i of set) { const x = i % 41, z = 55 - Math.floor(i / 41); const [px, py] = S0.proj([[x + 0.5, S0.Yz(z) + 0.5, top(x, z)]])[0]; t++; if (pred(px / 1280, py / 720)) n++; } return [n, t]; }; const inF = (u, v) => u >= 0 && u <= 1 && v >= 0 && v <= 1, tt = (x, z) => S0.tileTop(x, z);
            out.A6 = cnt(c.A6, inF, () => 6.6); out.A4 = cnt(c.A4, inF, tt); out.C3 = cnt(c.C3, inF, tt); out.B3 = cnt(c.B3, inF, tt); out.C2 = cnt(c.C2, inF, tt); out.A3a = cnt(c.ring, (u) => (u >= 0.02 && u <= 0.14) || (u >= 0.86 && u <= 0.98), tt)[0]; out.A3b = cnt(c.a3b, (u, v) => (u <= 0.25 || u >= 0.75) && v >= 0.7 && v <= 1, tt)[0]; return out; },
            { A6: [...C.lip], A4: [...C.CAND.A4], C3: [...C.CAND.C3], B3: [...C.CAND.B3], C2: [...C.CAND.C2], ring: [...R(2, 7, 0, 38), ...R(33, 38, 0, 38)], a3b: [...R(2, 7, 0, 38), ...R(33, 38, 0, 38), ...R(8, 17, 0, 3), ...R(23, 32, 0, 3), ...R(8, 10, 4, 9), ...R(30, 32, 4, 9)] });
          res.pos[pos] = { own: o }; for (const t of ['A6', 'A4', 'C3', 'B3', 'C2']) if (o[t][0] === o[t][1]) res.own[t].push(pos); for (const t of ['A3a', 'A3b']) if (o[t] > 0) res.own[t].push(pos); }
        log('own', JSON.stringify(res.own));
      }
      const pl = name.startsWith('TECHO-') ? res.own[X] : C.ORDER;
      for (const pos of pl) {
        await a.put({ tricks, pos, hs: HS[pos], }); await a.eval((p) => { window.SALAT.state.placebo = p; }, placebo);
        if (placebo) await a.put({ tricks, placebo: true, pos, hs: HS[pos] });
        const g = await a.grab(pass === 0); const sha = L.sha(g.png);
        if (g.w !== 1280 || g.h !== 720) throw new Error('size ' + g.w + 'x' + g.h);
        (res.hashes[name + '_' + pos] = res.hashes[name + '_' + pos] || []).push(sha);
        if (pass === 0) { fs.writeFileSync(`${OUT}/${name}_${pos}.png`, g.png); const info = await pageInfo(pos); frames[name + '_' + pos] = { g, info }; }
      }
      log('pass', pass, name, 'done');
    }
  }
  // ---- plans (Cam 5) ----
  for (const nm of ['SUELO', 'TECHO']) { await a.put({ tricks: nm === 'TECHO' ? TR : [], pos: 's1', hs: null }); await a.eval(() => { const ev = window.__evo, st = ev.st; st.preset = 'top'; st.follow = false; st.zoom = 1; st.panX = st.panY = 0; st.stage.heroScreen = null; ev.draw(); }); await a.idle(); const t = await a.grab(false); fs.writeFileSync(`${OUT}/${nm}_plano_cam5.png`, t.png); res.hashes[nm + '_plano_cam5'] = [L.sha(t.png)]; }
  res.HS = HS; res.frameKeys = Object.keys(frames);
  // ---- measures ----
  const base = frames['SUELO_s1'].info.mi; const kAt = (pts) => a.eval((p) => window.SALAT.kAt(p), pts);
  const out = { controls: {}, presence: {}, iso: {}, dry: {} };
  const redOf = (info) => { const s = new Set(); for (const [k, v] of Object.entries(info.redTiles)) if (k !== 'A4') for (const i of v) s.add(i); return s; };
  for (const key of Object.keys(frames)) {
    const { g, info } = frames[key]; const br = K.billRed(g, redOf(info));
    out.controls[key] = { mask: info.mi.maskHash === base.maskHash, path: info.mi.pathHash === base.pathHash, goal: info.mi.goal === base.goal && info.mi.goalWalkable, volOnPath: info.volOnPath, bill: br.bill, red: br.red, total: br.total, hero: K.heroCovered(g), empty: K.emptyShare(g) };
  }
  // presence in TECHO at own positions
  const T = (p) => frames['TECHO_' + p];
  const run = async (id, fn) => { out.dry[id] = 'no'; const r = {}; for (const pos of res.own[id]) { try { r[pos] = await fn(pos, T(pos)); out.dry[id] = 'si'; } catch (e) { r[pos] = { present: false, fails: ['SCRIPT ERROR ' + e.message], figs: {} }; out.dry[id] = 'error: ' + e.message; log(e.stack); } } out.presence[id] = r; };
  await run('A6', (pos, f) => M.A6(f.g, { railOnly: C.RAILONLY, posts: C.POSTS, all: C.lip, kAt, railTop: 6.6, postTop: 7.8 }));
  await run('A3a', (pos, f) => M.A3a(f.g, { tiles: A3A, baseY: f.info.baseA3a, colY: Yz(SEL.A3a.z) }));
  await run('A3b', (pos, f) => M.A3b(f.g, { tiles: A3B }));
  await run('A4', (pos, f) => M.A4(f.g, { find: (m) => m.objs.find((o) => Math.abs(o.x - SEL.A4.x) < 1e-6 && Math.abs(o.y - SEL.A4.y) < 1e-6) }));
  await run('C3', (pos, f) => { const paint = new Set(f.info.redTiles.C3 || []); return M.C3(f.g, { foot: FOOT, paint: paint.size ? paint : FOOT, band: f.info.bandC3 }); });
  await run('C2', (pos, f) => M.C2(f.g, { west: C2W, east: C2E, dist: stairDist(f.info.hero) }));
  await run('B3', (pos, f) => M.B3(f.g, { tiles: ISLA, band: f.info.bandB3, relH: 1.5 }));
  // isolation (c)
  for (const X of TR) { out.iso[X] = {}; for (const pos of res.own[X]) { const t = frames['TECHO_' + pos], tx = frames['TECHO-' + X + '_' + pos]; if (!t || !tx) continue; const b = t.info.boxes[X]; let [x0, y0, x1, y1] = b; if (X === 'A4') { const o = t.g.meta.objs.find((q) => Math.abs(q.x - SEL.A4.x) < 1e-6); if (o) { const r = M.billRect(o); x0 = Math.min(x0, r.x0); y0 = Math.min(y0, r.y0); x1 = Math.max(x1, r.x1); y1 = Math.max(y1, r.y1); } }
      const mx = 0.02 * 1280, my = 0.02 * 720; x0 -= mx; x1 += mx; y0 -= my; y1 += my; let tot = 0, outn = 0; const A = t.g.rgba, B2 = tx.g.rgba; for (let p = 0; p < 1280 * 720; p++) { if (A[p * 4] !== B2[p * 4] || A[p * 4 + 1] !== B2[p * 4 + 1] || A[p * 4 + 2] !== B2[p * 4 + 2]) { tot++; const x = p % 1280, y = (p / 1280) | 0; if (x < x0 || x > x1 || y < y0 || y > y1) outn++; } }
      out.iso[X][pos] = { diff: tot, outside: outn, pct: tot ? outn / tot * 100 : 0, box: [x0, y0, x1, y1].map((v) => Math.round(v)) }; } }
  res.out = out; fs.writeFileSync(`${SC}/results.json`, JSON.stringify(res, null, 1)); log('done', a.errs); await a.close();
})().catch((e) => { console.error(e); process.exit(1); });
