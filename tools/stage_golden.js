/* STAGE GOLDEN SHOT, COMPARISON BY BLOBS (PR M4c-1; pure, no DOM, no file reads; node tools/test_stage_golden.js tests it with SYNTHETIC images only).
   Two images (an RGBA buffer each: the viewer's capture and the remake's crop to its valid area) are reduced to a grid of cols x rows cells; each cell is LIGHT or DARK with respect to the MEDIAN of its own image (so the palette does not count: only the composition), cells under an exclusion mask (the minimap circle of the remake, a player bar) are left out of both;
   then: the per-cell agreement, the intersection over union (IoU) of the DARK blobs, and for every connected blob (4-neighbours) its box and centroid in fractions of the image. CONTROL OF FAULTS, not the judge: the judge is a person looking at the side-by-side. */
(function (root) {
  'use strict';
  const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  /* cellLum(rgba, w, h, cols, rows) -> Float64Array(cols * rows): the mean luminance of each cell (the cells split the image evenly; a cell is never empty for w >= cols, h >= rows) */
  function cellLum(rgba, w, h, cols, rows) {
    const out = new Float64Array(cols * rows), cnt = new Float64Array(cols * rows);
    for (let y = 0; y < h; y++) { const cy = Math.min(rows - 1, Math.floor(y * rows / h)); for (let x = 0; x < w; x++) { const cx = Math.min(cols - 1, Math.floor(x * cols / w)), q = (y * w + x) * 4, k = cy * cols + cx; out[k] += lum(rgba[q], rgba[q + 1], rgba[q + 2]); cnt[k]++; } }
    for (let k = 0; k < out.length; k++) out[k] /= Math.max(1, cnt[k]);
    return out;
  }
  /* exclusion: a list of { rect: [x0, y0, x1, y1] } or { circle: [cx, cy, r] } in FRACTIONS of the image; a cell is excluded when its centre falls inside one. Returns Uint8Array(cols * rows), 1 = excluded. */
  function excludeMask(cols, rows, excl) {
    const m = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const fx = (i + 0.5) / cols, fy = (j + 0.5) / rows; for (const e of excl || []) { if (e.rect && fx >= e.rect[0] && fx <= e.rect[2] && fy >= e.rect[1] && fy <= e.rect[3]) m[j * cols + i] = 1; if (e.circle && Math.hypot((fx - e.circle[0]) * cols / rows, fy - e.circle[1]) <= e.circle[2] * cols / rows) m[j * cols + i] = 1; } }
    return m;
  }
  const median = (a) => { const s = Array.from(a).sort((p, q) => p - q); return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0; };
  /* darkMask(lumCells, excluded) -> Uint8Array: 1 = DARK (strictly below the median of the included cells), 0 = light; excluded cells are 0 */
  function darkMask(lc, ex) { const inc = []; for (let k = 0; k < lc.length; k++) if (!ex[k]) inc.push(lc[k]); const md = median(inc), d = new Uint8Array(lc.length); for (let k = 0; k < lc.length; k++) d[k] = !ex[k] && lc[k] < md ? 1 : 0; return { dark: d, median: md }; }
  /* compare(dA, dB, ex) -> { agreement (share of the included cells with the same class), iou (of the dark cells), nDarkA, nDarkB, included } */
  function compare(dA, dB, ex) { let same = 0, inc = 0, inter = 0, uni = 0, na = 0, nb = 0; for (let k = 0; k < dA.length; k++) { if (ex[k]) continue; inc++; if (dA[k] === dB[k]) same++; if (dA[k] && dB[k]) inter++; if (dA[k] || dB[k]) uni++; na += dA[k]; nb += dB[k]; } return { agreement: inc ? same / inc : 0, iou: uni ? inter / uni : 1, nDarkA: na, nDarkB: nb, included: inc }; }
  /* blobs(dark, cols, rows) -> the 4-connected components of the dark cells: [{ cells, box: [x0, y0, x1, y1] (fractions), centroid: [fx, fy] }], the biggest first */
  function blobs(dark, cols, rows) {
    const seen = new Uint8Array(dark.length), out = [];
    for (let s = 0; s < dark.length; s++) { if (!dark[s] || seen[s]) continue; const q = [s]; seen[s] = 1; for (let h = 0; h < q.length; h++) { const i = q[h] % cols, j = (q[h] / cols) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= cols || b >= rows) continue; const k = b * cols + a; if (dark[k] && !seen[k]) { seen[k] = 1; q.push(k); } } }
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, sx = 0, sy = 0; for (const k of q) { const i = k % cols, j = (k / cols) | 0; x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); sx += i + 0.5; sy += j + 0.5; }
      out.push({ cells: q.length, box: [x0 / cols, y0 / rows, (x1 + 1) / cols, (y1 + 1) / rows].map((v) => +v.toFixed(3)), centroid: [+(sx / q.length / cols).toFixed(3), +(sy / q.length / rows).toFixed(3)] }); }
    return out.sort((p, q) => q.cells - p.cells);
  }
  /* an ASCII picture of a mask (# dark, . light, x excluded) for the log */
  const ascii = (dark, ex, cols, rows) => { let s = ''; for (let j = 0; j < rows; j++) { for (let i = 0; i < cols; i++) s += ex[j * cols + i] ? 'x' : dark[j * cols + i] ? '#' : '.'; s += '\n'; } return s; };
  const api = { cellLum, excludeMask, darkMask, compare, blobs, ascii, median };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StageGolden = api;
})(typeof window !== 'undefined' ? window : globalThis);
