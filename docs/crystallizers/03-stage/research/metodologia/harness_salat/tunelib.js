const L = require('./lib.js'), C = require('./cfg3.js'), G = require('./gates.js'), M = C.M; const fs = require('fs');
const log = (...a) => console.log(...a);
async function makeCtx(closure) {
  const a = await L.open({ closure }); const ctx = { a, HS: {}, P: null, iters: {}, logs: {} };
  for (const p of C.ORDER) ctx.HS[p] = C.HS0[p[0]] ? C.HS0[p[0]].slice() : null;
  ctx.setParams = (P) => a.eval((P) => { const S = window.SALAT; S.params.A6 = P.A6; S.params.A3a = P.A3a; S.params.A3b = P.A3b; S.params.C2 = P.C2; S.params.B3 = P.B3; S.params.C3 = P.C3; S.params.A4 = P.A4; S.TONE.clear = P.tone; }, P);
  ctx.put = (tricks, pos, extra) => a.put(Object.assign({ tricks, pos, hs: ctx.HS[pos], hf: C.HF[pos[0]] }, extra || {}));
  ctx.evalTrick = async (X, P) => { await ctx.setParams(P); const res = {}; let pass = 0; for (const pos of C.OWN[X]) { await ctx.put(C.TR, pos); const g = await a.grab(true); const info = await G.pageInfo(a, P); res[pos] = await G.gate(X, g, info, P, pos); if (res[pos].present) pass++; } return { pass, res }; };
  ctx.scan = async (pos, list) => { await ctx.put([], pos); return a.eval((l) => window.SALAT.scan(l), list); };
  ctx.fitFy = async (P) => { await ctx.setParams(P); const out = {}; for (const pos of ['n1', 'n2', 'n3']) { let found = null, last = null; for (let fy = 0.45; fy <= 0.8001 && !found; fy += 0.01) { const hs = [0.63, +fy.toFixed(2)]; await a.put({ tricks: ['A6'], pos, hs, hf: C.HF[pos[0]] }); const g = await a.grab(true); const cap = M.maskTiles(g.ids, C.A6N.rail, [4]); const tops = []; for (let xx = 0; xx < 1280; xx++) for (let y = 0; y < 720; y++) if (cap[y * 1280 + xx]) { tops.push(y); break; } if (!tops.length) continue; const yt = M.median(tops) / 720; last = yt; if (yt >= 0.4 && yt <= 0.6) found = +fy.toFixed(2); } out[pos] = found; if (found) ctx.HS[pos] = [0.63, found]; } return out; };
  return ctx;
}
module.exports = { makeCtx, log };
