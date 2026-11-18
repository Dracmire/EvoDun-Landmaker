const L = require('./lib.js'), C = require('./cfg3.js'), G = require('./gates.js'), K = require('./controls.js'), T = require('./tunelib.js'), M = C.M; const fs = require('fs');
const { W, Yz, ix, R } = C, log = (...a) => console.log(...a), SC = '/home/claude/salat/scratch', OUT = L.OUT, TR = C.TR;
const P = JSON.parse(fs.readFileSync(SC + '/tuned.json')).P;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const x = await T.makeCtx(8), a = x.a; await x.setParams(P);
  const res = { P, hashes: {}, cuts: {}, cutLog: {}, fy: {}, own: C.OWN, closure: 8 };
  const [C2W, C2E] = G.c2sets(P);
  const PIECES = { A6: new Set([...C.A6N.all, ...C.A6S.all]), A3a: G.A3Atiles(P), A3b: G.A3Btiles(P), C2w: C2W, C2e: C2E, B3: G.b3tiles(P) };
  const putS = async (tricks, pos, hs, cut, placebo) => { cut = cut || [];
    const tl = tricks.filter((t) => !cut.includes(t) && !(t === 'C2' && cut.includes('C2w') && cut.includes('C2e')));
    const cols = P.C2.cols.filter((c, i) => !(i === 0 && cut.includes('C2w')) && !(i === 1 && cut.includes('C2e')));
    await a.eval((c) => { window.SALAT.params.C2.cols = c; }, cols);
    await a.put({ tricks: tl, pos, hs, hf: C.HF[pos[0]], placebo: !!placebo, noPBBill: cut.includes('PBbill') }); };
  const heroCov = (g, tiles) => { const r = M.heroRect(g.meta); if (!r) return 0; const hy = Math.floor(g.meta.hero.y); let c = 0, n = 0; for (let y = Math.max(0, Math.floor(r.y0)); y <= Math.min(719, Math.ceil(r.y1)); y++) for (let xx = Math.max(0, Math.floor(r.x0)); xx <= Math.min(1279, Math.ceil(r.x1)); xx++) { n++; const v = g.ids[y * 1280 + xx]; if (v < 0) continue; const k = M.kindOf(v); if ((k === 2 || k === 4) && tiles.has(M.tileOf(v)) && Math.floor(M.tileOf(v) / W) > hy) c++; } return n ? c / n : 0; };
  const findCuts = async (pos, hs) => { const cut = [], lg = []; for (let it = 0; it < 6; it++) { await putS(TR, pos, hs, cut, false); const g = await a.grab(true); let best = null; for (const [id, tiles] of Object.entries(PIECES)) { if (cut.includes(id)) continue; const cv = heroCov(g, tiles); lg.push([it, id, +cv.toFixed(3)]); if (cv > 0.25 && (!best || cv > best[1])) best = [id, cv]; } if (!best) break; cut.push(best[0]); lg.push(['cut', best[0], +best[1].toFixed(3)]); } return { cut, lg }; };
  // fy of n in TECHO
  const HS = {}; for (const p of C.ORDER) HS[p] = C.HS0[p[0]] ? C.HS0[p[0]].slice() : null;
  for (const pos of ['n1', 'n2', 'n3']) { let found = null; for (let fy = 0.45; fy <= 0.8001 && !found; fy += 0.01) { const hs = [0.63, +fy.toFixed(2)]; await putS(TR, pos, hs, [], false); const g = await a.grab(true); const cap = M.maskTiles(g.ids, C.A6N.rail, [4]); const tops = []; for (let xx = 0; xx < 1280; xx++) for (let y = 0; y < 720; y++) if (cap[y * 1280 + xx]) { tops.push(y); break; } if (!tops.length) continue; const yt = M.median(tops) / 720; if (yt >= 0.4 && yt <= 0.6) found = +fy.toFixed(2); } HS[pos] = [0.63, found || 0.54]; res.fy[pos] = found; log('fy', pos, found); }
  for (const pos of C.ORDER) { const r = await findCuts(pos, HS[pos]); res.cuts[pos] = r.cut; res.cutLog[pos] = r.lg; log('cut', pos, JSON.stringify(r.cut)); }
  const pbCut = {}; for (const pos of C.ORDER) { await putS([], pos, HS[pos], [], true); const g = await a.grab(true); const o = g.meta.objs.find((q) => Math.abs(q.x - 35.5) < 1e-6 && q.drawn); let cv = 0; if (o) { const r = M.billRect(o), h = M.heroRect(g.meta); const ox = Math.max(0, Math.min(r.x1, h.x1) - Math.max(r.x0, h.x0)), oy = Math.max(0, Math.min(r.y1, h.y1) - Math.max(r.y0, h.y0)); cv = ox * oy / ((h.x1 - h.x0) * (h.y1 - h.y0)); } pbCut[pos] = cv > 0.25; res.cutLog['PB_' + pos] = +cv.toFixed(3); }
  const STATES = [['SUELO', [], false, null], ['TECHO', TR, false, null], ['PLACEBO', [], true, null], ...TR.map((t) => ['TECHO-' + t, TR.filter((q) => q !== t), false, t])];
  const frames = {};
  for (let pass = 0; pass < 2; pass++) for (const [name, tricks, placebo, X] of STATES) {
    const pl = name.startsWith('TECHO-') ? C.OWN[X] : C.ORDER;
    for (const pos of pl) { const cut = name === 'PLACEBO' ? (pbCut[pos] ? ['PBbill'] : []) : (name === 'SUELO' ? [] : res.cuts[pos]);
      await putS(tricks, pos, HS[pos], cut, placebo); const g = await a.grab(pass === 0); const sha = L.sha(g.png); if (g.w !== 1280 || g.h !== 720) throw new Error('size');
      (res.hashes[name + '_' + pos] = res.hashes[name + '_' + pos] || []).push(sha);
      if (pass === 0) { fs.writeFileSync(`${OUT}/${name}_${pos}.png`, g.png); frames[name + '_' + pos] = { g, info: await G.pageInfo(a, P), cut }; } }
    log('pass', pass, name); }
  for (const nm of ['SUELO', 'TECHO', 'SUELO', 'TECHO']) { await putS(nm === 'TECHO' ? TR : [], 's1', null, [], false); await a.eval(() => { const ev = window.__evo, st = ev.st; st.preset = 'top'; st.follow = false; st.zoom = 1; st.panX = st.panY = 0; st.stage.heroScreen = null; ev.draw(); }); await a.idle(); const t = await a.grab(false); const k = nm + '_plano_cam5'; if (!(res.hashes[k] || []).length) fs.writeFileSync(`${OUT}/${k}.png`, t.png); (res.hashes[k] = res.hashes[k] || []).push(L.sha(t.png)); }
  res.HS = HS;
  const base = frames['SUELO_s1'].info.mi; const out = { controls: {}, presence: {}, iso: {}, dry: {} };
  const redOf = (info) => { const s = new Set(); for (const [k, v] of Object.entries(info.redTiles)) if (k !== 'A4') for (const i of v) s.add(i); return s; };
  for (const key of Object.keys(frames)) { const { g, info } = frames[key]; const br = K.billRed(g, redOf(info)); out.controls[key] = { mask: info.mi.maskHash === base.maskHash, path: info.mi.pathHash === base.pathHash, goal: info.mi.goal === base.goal && info.mi.goalWalkable, volOnPath: info.volOnPath, bill: br.bill, red: br.red, total: br.total, hero: K.heroCovered(g), empty: K.emptyShare(g) }; }
  const cutOf = { A6: ['A6'], A3a: ['A3a'], A3b: ['A3b'], B3: ['B3'], C2: ['C2w', 'C2e'], A4: [], C3: [] };
  for (const X of TR) { out.dry[X] = 'no'; out.presence[X] = {}; for (const pos of C.OWN[X]) { const f = frames['TECHO_' + pos]; const cutHere = (res.cuts[pos] || []).filter((c) => cutOf[X].includes(c)); try { const r = await G.gate(X, f.g, f.info, P, pos); if (cutHere.length && !r.present) r.fails.unshift('pieza cortada por la regla de camara: ' + cutHere.join(',')); out.presence[X][pos] = r; out.dry[X] = 'si'; } catch (e) { out.presence[X][pos] = { present: false, fails: ['SCRIPT ERROR ' + e.message], figs: {} }; out.dry[X] = 'error: ' + e.message; log(e.stack); } } }
  for (const X of TR) { out.iso[X] = {}; for (const pos of C.OWN[X]) { const t = frames['TECHO_' + pos], tx = frames['TECHO-' + X + '_' + pos]; if (!t || !tx) continue; let [x0, y0, x1, y1] = t.info.boxes[X] || [1e9, 1e9, -1e9, -1e9]; if (X === 'A4') { const o = t.g.meta.objs.find((q) => Math.abs(q.x - P.A4.bill.x) < 1e-6 && Math.abs(q.y - P.A4.bill.y) < 1e-6); if (o) { const r = M.billRect(o); x0 = Math.min(x0, r.x0); y0 = Math.min(y0, r.y0); x1 = Math.max(x1, r.x1); y1 = Math.max(y1, r.y1); } }
      x0 -= 0.02 * 1280; x1 += 0.02 * 1280; y0 -= 0.02 * 720; y1 += 0.02 * 720; let tot = 0, outn = 0; const A = t.g.rgba, B2 = tx.g.rgba; for (let p = 0; p < 1280 * 720; p++) if (A[p * 4] !== B2[p * 4] || A[p * 4 + 1] !== B2[p * 4 + 1] || A[p * 4 + 2] !== B2[p * 4 + 2]) { tot++; const xx = p % 1280, y = (p / 1280) | 0; if (xx < x0 || xx > x1 || y < y0 || y > y1) outn++; }
      out.iso[X][pos] = { diff: tot, outside: outn, pct: tot ? outn / tot * 100 : 0, box: [x0, y0, x1, y1].map((v) => Math.round(v)) }; } }
  res.out = out; fs.writeFileSync(`${SC}/results3.json`, JSON.stringify(res, null, 1)); log('done', a.errs); await a.close();
})().catch((e) => { console.error(e); process.exit(1); });
