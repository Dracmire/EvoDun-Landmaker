const M = require('./measure.js'); const { FW, FH, FN, kindOf, tileOf, xzOf, heroRect, billRect } = M;
const BG = [[0x2a, 0x25, 0x40], [0x17, 0x14, 0x24]];
function emptyShare(g) { let c = 0; const d = g.rgba; for (let p = 0; p < FN; p++) { if (g.ids[p] >= 0) continue; const r = d[p * 4], gg = d[p * 4 + 1], b = d[p * 4 + 2]; // distance to the BG gradient segment
  let best = 1e9; for (let t = 0; t <= 1; t += 0.125) { const dr = r - (BG[0][0] + (BG[1][0] - BG[0][0]) * t), dg = gg - (BG[0][1] + (BG[1][1] - BG[0][1]) * t), db = b - (BG[0][2] + (BG[1][2] - BG[0][2]) * t); best = Math.min(best, Math.abs(dr) + Math.abs(dg) + Math.abs(db)); } if (best <= 12) c++; } return c / FN; }
/* billboards + red: union of the drawn billboard rects and the pixels of the red volumes (tiles raised by the tricks, kinds 2 / 4) */
function billRed(g, redTiles) { const m = new Uint8Array(FN); let bill = 0, red = 0;
  for (const o of g.meta.objs) { if (!o.drawn) continue; const r = billRect(o); for (let y = Math.max(0, Math.floor(r.y0)); y <= Math.min(FH - 1, Math.ceil(r.y1)); y++) for (let x = Math.max(0, Math.floor(r.x0)); x <= Math.min(FW - 1, Math.ceil(r.x1)); x++) if (!m[y * FW + x]) { m[y * FW + x] = 1; bill++; } }
  for (let p = 0; p < FN; p++) { const v = g.ids[p]; if (v >= 0 && (kindOf(v) === 2 || kindOf(v) === 4) && redTiles.has(tileOf(v)) && !m[p]) { m[p] = 1; red++; } }
  return { bill: bill / FN, red: red / FN, total: (bill + red) / FN }; }
/* hero covered: share of the hero rectangle whose pick pixel shows a wall / cap nearer the camera than the hero (map y larger than the hero's tile row) */
function heroCovered(g) { const r = heroRect(g.meta); if (!r) return 0; const hy = Math.floor(g.meta.hero.y); let c = 0, n = 0;
  for (let y = Math.max(0, Math.floor(r.y0)); y <= Math.min(FH - 1, Math.ceil(r.y1)); y++) for (let x = Math.max(0, Math.floor(r.x0)); x <= Math.min(FW - 1, Math.ceil(r.x1)); x++) { n++; const v = g.ids[y * FW + x]; if (v < 0) continue; const k = kindOf(v); if (k !== 2 && k !== 4) continue; const [, tz] = xzOf(tileOf(v)); if (55 - tz > hy) c++; }
  return n ? c / n : 0; }
module.exports = { emptyShare, billRed, heroCovered };
