const L = require('./lib.js'), C = require('./common.js'), K = require('./controls.js'), M = C.M; const fs = require('fs');
const W = 41, Yz = (z) => 55 - z, ix = (x, z) => Yz(z) * W + x; const log = (...a) => console.log(...a);
const S3 = JSON.parse(fs.readFileSync('/home/claude/salat/scratch/sel3.json')), A4B = JSON.parse(fs.readFileSync('/home/claude/salat/scratch/sel4.json'));
const SEL = { A3a: S3.A3a, A3b: S3.A3b, C2: S3.C2, A4: A4B }, CLOSURE = 8, OUT = L.OUT, SC = '/home/claude/salat/scratch';
const R = (x0, x1, z0, z1) => M.rectTiles(x0, x1, z0, z1);
const TR = ['A6', 'A3a', 'A3b', 'A4', 'C3', 'C2', 'B3'];
const A3A = new Set(), A3B = new Set(); for (let z = SEL.A3a.z; z < SEL.A3a.z + 2; z++) for (let x = SEL.A3a.x; x < SEL.A3a.x + 2; x++) A3A.add(ix(x, z)); for (let z = SEL.A3b.z; z < SEL.A3b.z + 2; z++) for (let x = SEL.A3b.x; x < SEL.A3b.x + 3; x++) A3B.add(ix(x, z));
const C2W = R(14, 15, 16, 17), C2E = R(25, 26, 16, 17), ISLA = R(10, 13, 22, 26), FOOT = R(17, 22, 28, 33), STAIR = R(17, 23, 14, 17);
const PIECES = { A6: C.lip, A3a: A3A, A3b: A3B, C2w: C2W, C2e: C2E, B3: ISLA };
const VOL = {
  A6: [[8, 33, Yz(38), Yz(38) + 1, 5, 7.8]], A3a: [[SEL.A3a.x, SEL.A3a.x + 2, Yz(SEL.A3a.z + 1), Yz(SEL.A3a.z) + 1, 2.5, 5 + SEL.A3a.h * 2]],
  A3b: [[SEL.A3b.x, SEL.A3b.x + 3, Yz(SEL.A3b.z + 1), Yz(SEL.A3b.z) + 1, 2.5, 5 + SEL.A3b.h * 2]],
  C3: [[17, 23, Yz(33), Yz(28) + 1, 5, 5]], C2: [[14, 16, Yz(17), Yz(16) + 1, 2.5, 5 + SEL.C2.h * 2], [25, 27, Yz(17), Yz(16) + 1, 2.5, 5 + SEL.C2.h * 2]], B3: [[10, 14, Yz(26), Yz(22) + 1, 5, 8]],
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const a = await L.open({ closure: CLOSURE }); const res = { closure: CLOSURE, sel: SEL, pos: {}, own: {}, fy: {}, hashes: {}, cuts: {}, cutLog: {} };
  await a.eval((s) => { const P = window.SALAT.params; P.A3a = { x: s.A3a.x, z: s.A3a.z, w: 2, d: 2, h: s.A3a.h }; P.A3b = { x: s.A3b.x, z: s.A3b.z, w: 3, d: 2, h: s.A3b.h }; P.A4 = { cut: false, bill: Object.assign({}, s.A4) }; P.C2 = { h: s.C2.h, cols: s.C2.cols }; P.B3 = { h: 4 }; }, SEL);
  const HS = JSON.parse(JSON.stringify(C.HS));
  // camera-side cut: a state at a position with a set of cut pieces
  const putS = async (tricks, pos, hs, cut, placebo) => {
    cut = cut || []; const tl = tricks.filter((t) => !(t === 'A6' && cut.includes('A6')) && !(t === 'A3a' && cut.includes('A3a')) && !(t === 'A3b' && cut.includes('A3b')) && !(t === 'B3' && cut.includes('B3')) && !(t === 'C2' && cut.includes('C2w') && cut.includes('C2e')));
    const cols = SEL.C2.cols.filter((c, i) => !(i === 0 && cut.includes('C2w')) && !(i === 1 && cut.includes('C2e')));
    await a.eval((c) => { window.SALAT.params.C2.cols = c; }, cols);
    await a.put({ tricks: tl, pos, hs, placebo: !!placebo, noPBBill: cut.includes('PBbill') });
  };
  // ---- fy of the n group, in TECHO (with the cut of each position applied after the first guess: the rail is not a cut candidate unless it covers the hero) ----
  const heroCov = (g, tiles) => { const r = M.heroRect(g.meta); if (!r) return 0; const hy = Math.floor(g.meta.hero.y); let c = 0, n = 0; for (let y = Math.max(0, Math.floor(r.y0)); y <= Math.min(719, Math.ceil(r.y1)); y++) for (let x = Math.max(0, Math.floor(r.x0)); x <= Math.min(1279, Math.ceil(r.x1)); x++) { n++; const v = g.ids[y * 1280 + x]; if (v < 0) continue; const k = M.kindOf(v); if ((k === 2 || k === 4) && tiles.has(M.tileOf(v)) && Math.floor(M.tileOf(v) / W) > hy) c++; } return n ? c / n : 0; };
  const findCuts = async (pos, hs) => { const cut = [], lg = []; for (let it = 0; it < 6; it++) { await putS(TR, pos, hs, cut, false); const g = await a.grab(true); let best = null; for (const [id, tiles] of Object.entries(PIECES)) { if (cut.includes(id)) continue; const cv = heroCov(g, tiles); lg.push([it, id, +cv.toFixed(3)]); if (cv > 0.25 && (!best || cv > best[1])) best = [id, cv]; } if (!best) break; cut.push(best[0]); lg.push(['cut', best[0], +best[1].toFixed(3)]); } return { cut, lg }; };
  for (const pos of ['n1', 'n2', 'n3']) { let found = null; for (let fy = 0.5; fy <= 0.8001 && !found; fy += 0.01) { const hs = [0.63, +fy.toFixed(2)]; const { cut } = await findCuts(pos, hs); await putS(TR, pos, hs, cut, false); const g = await a.grab(true); const cap = M.maskTiles(g.ids, C.RAILONLY, [4]); const tops = []; for (let x = 0; x < 1280; x++) for (let y = 0; y < 720; y++) if (cap[y * 1280 + x]) { tops.push(y); break; } const yt = M.median(tops) / 720; if (yt >= 0.4 && yt <= 0.6) found = +fy.toFixed(2); } HS[pos] = [0.63, found]; res.fy[pos] = found; log('fy', pos, found); }
  // cuts per position (from TECHO, final heroScreen)
  for (const pos of C.ORDER) { const r = await findCuts(pos, HS[pos]); res.cuts[pos] = r.cut; res.cutLog[pos] = r.lg; log('cut', pos, JSON.stringify(r.cut)); }
  // placebo billboard cut
  const pbCut = {}; for (const pos of C.ORDER) { await putS([], pos, HS[pos], [], true); const g = await a.grab(true); const o = g.meta.objs.find((q) => Math.abs(q.x - 35.5) < 1e-6 && q.drawn); let cv = 0; if (o) { const r = M.billRect(o), h = M.heroRect(g.meta); const ox = Math.max(0, Math.min(r.x1, h.x1) - Math.max(r.x0, h.x0)), oy = Math.max(0, Math.min(r.y1, h.y1) - Math.max(r.y0, h.y0)); cv = ox * oy / ((h.x1 - h.x0) * (h.y1 - h.y0)); } pbCut[pos] = cv > 0.25; res.cutLog['PB_' + pos] = +cv.toFixed(3); }
  const STATES = [['SUELO', [], false, null], ['TECHO', TR, false, null], ['PLACEBO', [], true, null], ...TR.map((x) => ['TECHO-' + x, TR.filter((t) => t !== x), false, x])];
  const pageInfo = (pos) => a.eval((e) => { const S0 = window.SALAT, ev = window.__evo, S = ev.S(); const B = S.__base; const mi = S0.maskInfo(); const pathIdx = mi.path || []; let vol = 0; for (const i of pathIdx) if (B && Math.abs(S.levelH[S.fine[i]] - B[i]) > 1e-6) vol++; delete mi.mask;
    const b = S0.bands(); const bandOf = (y) => Math.max(1, Math.min(5, Math.floor((b.yNear - y) / b.len * 5) + 1));
    const baseCol = (x, z, w, d) => { let m = -1; for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) { const g = B[S0.idx(xx, zz)], y0 = S0.Yz(zz); for (const [cx, cy] of [[xx, y0], [xx + 1, y0], [xx, y0 + 1], [xx + 1, y0 + 1]]) { const q = S0.proj([[cx, cy, g]])[0]; m = Math.max(m, q[1]); } } return m; };
    const kR = {}, kP = {}; for (let x = 8; x <= 32; x++) { kR[x] = S0.kAt([[x + 0.5, 17.5, 6.6]])[0]; kP[x] = S0.kAt([[x + 0.5, 17.5, 7.8]])[0]; }
    const hero = ev.st.hero; const boxes = {}; for (const [k, vs] of Object.entries(e.VOL)) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [ax, bx, ay, by, hl, hh] of vs) for (const cx of [ax, bx]) for (const cy of [ay, by]) for (const h of [hl, hh]) { const q = S0.proj([[cx, cy, h]])[0]; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } boxes[k] = [x0, y0, x1, y1]; }
    return { kRail: kR, kPost: kP, mi: { maskHash: mi.maskHash, pathHash: mi.pathHash, count: mi.count, goal: mi.goal, goalWalkable: mi.goalWalkable, regions: mi.regions }, volOnPath: vol, pathLen: pathIdx.length, redTiles: Object.fromEntries(Object.entries(S.salat && S.salat.tiles || {})), baseA3a: B ? baseCol(e.a3a.x, e.a3a.z, 2, 2) : null, bandC3: bandOf(24), bandB3: bandOf(30.5), boxes, hero: [hero.x, hero.y] }; }, { VOL, a3a: SEL.A3a });
  const stairDist = (h) => { let m = 1e9; for (const i of STAIR) { const x = i % W + 0.5, y = Math.floor(i / W) + 0.5; m = Math.min(m, Math.hypot(h[0] - x, h[1] - y)); } return m; };
  const frames = {};
  for (let pass = 0; pass < 2; pass++) {
    for (const [name, tricks, placebo, X] of STATES) {
      if (pass === 0 && name === 'SUELO') { for (const t of TR) res.own[t] = [];
        for (const pos of C.ORDER) { await putS([], pos, HS[pos], [], false); const g0 = await a.grab(true); const o = await a.eval((c) => { const S0 = window.SALAT, out = {}, cnt = (set, pred, top) => { let n = 0, t = 0; for (const i of set) { const x = i % 41, z = 55 - Math.floor(i / 41); const [px, py] = S0.proj([[x + 0.5, S0.Yz(z) + 0.5, top(x, z)]])[0]; t++; if (pred(px / 1280, py / 720)) n++; } return [n, t]; }; const inF = (u, v) => u >= 0 && u <= 1 && v >= 0 && v <= 1, tt = (x, z) => S0.tileTop(x, z);
            out.A6 = cnt(c.A6, inF, () => 6.6); out.C3 = cnt(c.C3, inF, tt); out.B3 = cnt(c.B3, inF, tt); out.C2 = cnt(c.C2, inF, tt); out.A3a = cnt(c.ring, (u) => (u >= 0.02 && u <= 0.14) || (u >= 0.86 && u <= 0.98), tt)[0]; out.A3b = cnt(c.a3b, (u, v) => (u <= 0.25 || u >= 0.75) && v >= 0.7 && v <= 1, tt)[0]; return out; },
            { A6: [...C.lip], C3: [...C.CAND.C3], B3: [...C.CAND.B3], C2: [...C.CAND.C2], ring: [...R(2, 7, 0, 38), ...R(33, 38, 0, 38)], a3b: [...R(2, 7, 0, 38), ...R(33, 38, 0, 38), ...R(8, 17, 0, 3), ...R(23, 32, 0, 3), ...R(8, 10, 4, 9), ...R(30, 32, 4, 9)] });
          let vis = 0; for (let x = 18; x <= 22; x++) if (M.maskTiles(g0.ids, new Set([ix(x, 52)]), [2, 4]).count > 0) vis++; o.A4 = [vis, 5];
          res.pos[pos] = { own: o }; for (const t of ['A6', 'A4', 'C3', 'B3', 'C2']) if (o[t][0] === o[t][1]) res.own[t].push(pos); for (const t of ['A3a', 'A3b']) if (o[t] > 0) res.own[t].push(pos); }
        log('own', JSON.stringify(res.own)); }
      const pl = name.startsWith('TECHO-') ? res.own[X] : C.ORDER;
      for (const pos of pl) {
        const cut = name === 'PLACEBO' ? (pbCut[pos] ? ['PBbill'] : []) : (name === 'SUELO' ? [] : res.cuts[pos]);
        await putS(tricks, pos, HS[pos], cut, placebo);
        const g = await a.grab(pass === 0); const sha = L.sha(g.png); if (g.w !== 1280 || g.h !== 720) throw new Error('size ' + g.w + 'x' + g.h);
        (res.hashes[name + '_' + pos] = res.hashes[name + '_' + pos] || []).push(sha);
        if (pass === 0) { fs.writeFileSync(`${OUT}/${name}_${pos}.png`, g.png); frames[name + '_' + pos] = { g, info: await pageInfo(pos), cut }; }
      }
      log('pass', pass, name, 'done');
    }
  }
  for (const nm of ['SUELO', 'TECHO', 'SUELO', 'TECHO']) { await putS(nm === 'TECHO' ? TR : [], 's1', null, [], false); await a.eval(() => { const ev = window.__evo, st = ev.st; st.preset = 'top'; st.follow = false; st.zoom = 1; st.panX = st.panY = 0; st.stage.heroScreen = null; ev.draw(); }); await a.idle(); const t = await a.grab(false); if (nm === 'SUELO' && !(res.hashes.SUELO_plano_cam5 || []).length || nm === 'TECHO' && !(res.hashes.TECHO_plano_cam5 || []).length) fs.writeFileSync(`${OUT}/${nm}_plano_cam5.png`, t.png); (res.hashes[nm + '_plano_cam5'] = res.hashes[nm + '_plano_cam5'] || []).push(L.sha(t.png)); }
  res.HS = HS;
  // ---- measures ----
  const base = frames['SUELO_s1'].info.mi; const out = { controls: {}, presence: {}, iso: {}, dry: {} };
  const redOf = (info) => { const s = new Set(); for (const [k, v] of Object.entries(info.redTiles)) if (k !== 'A4') for (const i of v) s.add(i); return s; };
  for (const key of Object.keys(frames)) { const { g, info } = frames[key]; const br = K.billRed(g, redOf(info)); out.controls[key] = { mask: info.mi.maskHash === base.maskHash, path: info.mi.pathHash === base.pathHash, goal: info.mi.goal === base.goal && info.mi.goalWalkable, volOnPath: info.volOnPath, bill: br.bill, red: br.red, total: br.total, hero: K.heroCovered(g), empty: K.emptyShare(g) }; }
  const T = (p) => frames['TECHO_' + p]; const cutOf = { A6: ['A6'], A3a: ['A3a'], A3b: ['A3b'], B3: ['B3'], C2: ['C2w', 'C2e'], A4: [], C3: [] };
  const run = async (id, fn) => { out.dry[id] = 'no'; const r = {}; for (const pos of res.own[id]) { const cutHere = (res.cuts[pos] || []).filter((c) => cutOf[id].includes(c)); try { const x = await fn(pos, T(pos)); if (cutHere.length && !x.present) x.fails.unshift('pieza cortada por la regla de camara: ' + cutHere.join(',')); r[pos] = x; out.dry[id] = 'si'; } catch (e) { r[pos] = { present: false, fails: ['SCRIPT ERROR ' + e.message], figs: {} }; out.dry[id] = 'error: ' + e.message; log(e.stack); } } out.presence[id] = r; };
  await run('A6', (pos, f) => M.A6(f.g, { railOnly: C.RAILONLY, posts: C.POSTS, all: C.lip, kAt: async (pts) => [pts[0][2] === 6.6 ? f.info.kRail[Math.floor(pts[0][0])] : f.info.kPost[Math.floor(pts[0][0])]], railTop: 6.6, postTop: 7.8 }));
  await run('A3a', (pos, f) => M.A3a(f.g, { tiles: A3A, baseY: f.info.baseA3a, colY: Yz(SEL.A3a.z) }));
  await run('A3b', (pos, f) => M.A3b(f.g, { tiles: A3B }));
  await run('A4', (pos, f) => M.A4(f.g, { find: (m) => m.objs.find((o) => Math.abs(o.x - SEL.A4.x) < 1e-6 && Math.abs(o.y - SEL.A4.y) < 1e-6) }));
  await run('C3', (pos, f) => { const paint = new Set(f.info.redTiles.C3 || []); return M.C3(f.g, { foot: FOOT, paint: paint.size ? paint : FOOT, band: f.info.bandC3 }); });
  await run('C2', (pos, f) => M.C2(f.g, { west: C2W, east: C2E, dist: stairDist(f.info.hero) }));
  await run('B3', (pos, f) => M.B3(f.g, { tiles: ISLA, band: f.info.bandB3, relH: 1.5 }));
  for (const X of TR) { out.iso[X] = {}; for (const pos of res.own[X]) { const t = frames['TECHO_' + pos], tx = frames['TECHO-' + X + '_' + pos]; if (!t || !tx) continue; let box = t.info.boxes[X] || [1e9, 1e9, -1e9, -1e9]; let [x0, y0, x1, y1] = box; if (X === 'A4') { const o = t.g.meta.objs.find((q) => Math.abs(q.x - SEL.A4.x) < 1e-6 && Math.abs(q.y - SEL.A4.y) < 1e-6); if (o) { const r = M.billRect(o); x0 = Math.min(x0, r.x0); y0 = Math.min(y0, r.y0); x1 = Math.max(x1, r.x1); y1 = Math.max(y1, r.y1); } }
      const mx = 0.02 * 1280, my = 0.02 * 720; x0 -= mx; x1 += mx; y0 -= my; y1 += my; let tot = 0, outn = 0; const A = t.g.rgba, B2 = tx.g.rgba; for (let p = 0; p < 1280 * 720; p++) { if (A[p * 4] !== B2[p * 4] || A[p * 4 + 1] !== B2[p * 4 + 1] || A[p * 4 + 2] !== B2[p * 4 + 2]) { tot++; const x = p % 1280, y = (p / 1280) | 0; if (x < x0 || x > x1 || y < y0 || y > y1) outn++; } }
      out.iso[X][pos] = { diff: tot, outside: outn, pct: tot ? outn / tot * 100 : 0, box: [x0, y0, x1, y1].map((v) => Math.round(v)) }; } }
  res.out = out; fs.writeFileSync(`${SC}/results2.json`, JSON.stringify(res, null, 1)); log('done', a.errs); await a.close();
})().catch((e) => { console.error(e); process.exit(1); });
