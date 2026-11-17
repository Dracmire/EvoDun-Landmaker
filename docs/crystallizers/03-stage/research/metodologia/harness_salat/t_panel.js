const T = require('./tunelib.js'), C = require('./cfg3.js'), M = C.M, L = require('./lib.js'), fs = require('fs'); const { W, Yz, R } = C; const SC = '/home/claude/salat/scratch';
const res3 = JSON.parse(fs.readFileSync(SC + '/results3.json')), P = res3.P, HS = res3.HS; const POS = C.OWN.A4;
const inR = (v, a, b) => v >= a && v <= b, f3 = (v) => +v.toFixed(3);
function gatePanel(g, set, tag) { const m = M.maskTiles(g.ids, set, [2, 4]); if (!m.count) return { present: false, fails: ['panel_not_visible (0 px)'], figs: {} };
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let p = 0; p < 1280 * 720; p++) if (m[p]) { const x = p % 1280, y = (p / 1280) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const wf = (x1 - x0) / 1280, hf = (y1 - y0) / 720, cx = (x0 + x1) / 2560, cy = (y0 + y1) / 1440; let sb = 0, nb = 0, sr = 0, nr = 0, cover = 0;
  for (let y = Math.max(0, y0 - 16); y <= Math.min(719, y1 + 16); y++) for (let x = Math.max(0, x0 - 16); x <= Math.min(1279, x1 + 16); x++) { const p = y * 1280 + x, inside = m[p], box = x >= x0 && x <= x1 && y >= y0 && y <= y1, near = x >= x0 - 8 && x <= x1 + 8 && y >= y0 - 8 && y <= y1 + 8; if (inside) { sb += M.luma(g.rgba, p); nb++; } else if (!near) { sr += M.luma(g.rgba, p); nr++; }
    if (box && !inside) { const v = g.ids[p]; if (v >= 0 && (M.kindOf(v) === 2 || M.kindOf(v) === 4)) { const [, tz] = M.xzOf(M.tileOf(v)); if (55 - tz > 4.5 + 1e-6 && !set.has(M.tileOf(v))) cover++; } } }
  const lb = nb ? sb / nb : 0, lr = nr ? sr / nr : 1;
  const checks = [['width', inR(wf, 0.08, 0.16), f3(wf)], ['height', inR(hf, 0.10, 0.20), f3(hf)], ['centre_x', inR(cx, 0.40, 0.62), f3(cx)], ['centre_y', inR(cy, 0.05, 0.25), f3(cy)], ['luminance_ratio_ge_2', lb >= 2 * lr, `${f3(lb)} / ${f3(lr)} = ${f3(lb / Math.max(lr, 1e-6))}`], ['px_covering_nearer_pieces', cover === 0, cover]];
  return { present: checks.every((c) => c[1]), figs: Object.fromEntries(checks.map((c) => [c[0], c[2]])), fails: checks.filter((c) => !c[1]).map((c) => c[0] + ' = ' + c[2]) }; }
(async () => { const x = await T.makeCtx(8), a = x.a; const out = [];
  const cuts = res3.cuts;
  // analytic candidates
  const cand = []; for (const w of [4, 5, 6, 7, 8]) for (const h of [1, 1.5, 2, 2.5, 3, 3.5, 4]) cand.push({ x: Math.round(20.5 - w / 2), z: 51, w, d: 1, h });
  const score = new Array(cand.length).fill(0), sumd = new Array(cand.length).fill(0);
  for (const pos of POS) { await x.setParams(P); x.HS[pos] = HS[pos]; const sc = await x.scan(pos, cand); sc.forEach((b, i) => { const wf = (b.x1 - b.x0) / 1280, hf = (b.y1 - b.y0) / 720, cx = (b.x0 + b.x1) / 2560, cy = (b.y0 + b.y1) / 1440; if (inR(wf, .08, .16) && inR(hf, .10, .20) && inR(cx, .4, .62) && inR(cy, .05, .25)) score[i]++; sumd[i] += Math.abs(wf - .12) + Math.abs(hf - .15); }); }
  const order = cand.map((c, i) => [i, score[i], sumd[i]]).sort((p, q) => q[1] - p[1] || p[2] - q[2]); console.log('analytic top', order.slice(0, 5).map(([i, s]) => JSON.stringify(cand[i]) + ':' + s).join(' '));
  const cfgs = order.slice(0, 3).map(([i]) => cand[i]); let bestPass = -1, bestCfg = null;
  for (let it = 0; it < 3; it++) { const c = cfgs[it]; const Q = JSON.parse(JSON.stringify(P)); Q.A4 = { cut: false, bill: P.A4.bill, panel: { x0: c.x, x1: c.x + c.w - 1, h: c.h } }; await x.setParams(Q);
    const set = C.rectSet(c.x, 51, c.w, 1); const row = {}; let pass = 0;
    for (const pos of POS) { // TECHO of this position with the cut of results3
      const cut = cuts[pos] || []; const tl = C.TR.filter((t) => !cut.includes(t) && !(t === 'C2' && cut.includes('C2w') && cut.includes('C2e'))); const cols = Q.C2.cols.filter((cc, i) => !(i === 0 && cut.includes('C2w')) && !(i === 1 && cut.includes('C2e')));
      await a.eval((cc) => { window.SALAT.params.C2.cols = cc; }, cols); await a.put({ tricks: tl, pos, hs: HS[pos], hf: C.HF[pos[0]] }); const g = await a.grab(true); const r = gatePanel(g, set); row[pos] = r; if (r.present) pass++; }
    console.log('IT', it + 1, JSON.stringify(c), pass + '/6'); for (const [p, r] of Object.entries(row)) console.log('  ', p, r.present ? 'OK ' + JSON.stringify(r.figs) : r.fails.join('; '));
    out.push({ it: it + 1, cfg: c, pass, row }); if (pass > bestPass) { bestPass = pass; bestCfg = c; } if (pass >= 4) break; }
  fs.writeFileSync(SC + '/panel.json', JSON.stringify({ out, bestPass, bestCfg }, null, 1)); await a.close(); })().catch((e) => { console.error(e); process.exit(1); });
