/* Crystallizer 5, the CUTAWAY paint order against a per-pixel z-buffer reference (MEASURED, not enforced: like known limitation 15 and tools/ui/test_ramp_ui.js / test_asc_ui.js).
   The cutaway draws, in this order, the back half of the exterior and then the front half of each floor (E.floors.layers(.., 'cut')); the painter's result at a pixel is the LAST layer that covers it. Each layer is rendered
   ALONE on a transparent canvas (E.renderLayers with o.noBg) to get its coverage; the owner of a pixel in the painter is the last layer of the draw order that covers it. The reference rasterizes the true geometry of
   ALL the layers together (flat tile tops at their level heights, vertical walls between tiles and down to the layer's base over void or the map edge) with a depth buffer and says which layer is front-most per pixel.
   Differing pixels / covered pixels (pixels within 1 px of an ownership border, in either picture, are ignored: anti-aliasing). Cam 1 (iso 45 / pitch 35) and Cam 3 (oblique 50), Box / A / B / C, the default smoothing
   and tile-exact A / B (smooth 0, radius 0; C has no tile-exact mode), yaw offsets 0 / +10 / -10 (the plane follows the drag). For the WORST case: which pair of layers produces the differing pixels, how close to an
   ownership border they lie, whether the tile-exact variant (A / B) shows the same, and crops of reference vs painter.
     NODE_PATH=$(npm root -g) node tools/ui/test_cut_ui.js [outDir] [--px 14] [--only 'exact|A|Cam 1 Iso 45|0'] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PAGE = async ({ px, only }) => {
  const E = window.EVO, ev = window.__evo, pack = ev.packs[ev.st.pack].pack, CW = 760, CH = 600;
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${CW}px;height:${CH}px;z-index:-1`; document.body.appendChild(cv);
  const cams = [['Cam 1 Iso 45', 45, 35], ['Cam 3 Oblique 50', 0, 50]], techs = ['box', 'A', 'B', 'C'], offs = [0, 10, -10], variants = [['default', {}], ['exact', { smooth: 0, radius: 0 }]];
  const state = {}; for (const [vn, extra] of variants) { const P = Object.assign({}, ev.P, extra), S0 = E.shape(pack, P, null); E.floors.prepare(S0, pack, P, 0); state[vn] = { P, S0 }; }
  function reference(list, cam, view, skirt) { // skirt 'thin': walls over void go down to the layer's baseH (Box); 'deep': down to the lowest level of the shared grid (what the level-banded A / B / C walls reach)
    const yaw = view.yaw * Math.PI / 180, pit = view.pitch * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pit), cp = Math.cos(pit), S0 = list[0].S, W = S0.W, H = S0.H;
    const zOf = (x, y, h) => (sy * (x - W / 2) + cy * (y - H / 2)) * cp + h * sp, zb = new Float32Array(CW * CH).fill(-1e9), own = new Uint8Array(CW * CH);
    const tri = (A, B, C, o) => { const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(CW - 1, Math.ceil(Math.max(A[0], B[0], C[0]))), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(CH - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]); if (Math.abs(d) < 1e-9) return;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const qx = x + 0.5, qy = y + 0.5, l1 = ((B[1] - C[1]) * (qx - C[0]) + (C[0] - B[0]) * (qy - C[1])) / d, l2 = ((C[1] - A[1]) * (qx - C[0]) + (A[0] - C[0]) * (qy - C[1])) / d, l3 = 1 - l1 - l2;
        if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue; const z = l1 * A[2] + l2 * B[2] + l3 * C[2], k = y * CW + x; if (z > zb[k]) { zb[k] = z; own[k] = o; } } };
    const V = (x, y, h) => { const p = cam.p(x, y, h); return [p[0], p[1], zOf(x, y, h)]; }, quad = (a, b, c, d, o) => { tri(a, b, c, o); tri(a, c, d, o); };
    list.forEach((L, li) => { const S = L.S, hOf = (j) => S.levelH[S.fine[j]], isVoid = (j) => !!(S.void && S.void[j]), base0 = S.baseH !== undefined ? S.baseH : S.levelH[0] - ev.P.terH, base = skirt === 'deep' ? Math.min(base0, S.levelH[0]) : base0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (isVoid(i)) continue; const h = hOf(i);
        quad(V(x, y, h), V(x + 1, y, h), V(x + 1, y + 1, h), V(x, y + 1, h), li + 1);
        for (const [dx, dy, ax, ay, bx, by] of [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]]) { const nx = x + dx, ny = y + dy, out = nx < 0 || ny < 0 || nx >= W || ny >= H || isVoid(ny * W + nx), hn = out ? base : hOf(ny * W + nx); if (hn >= h - 1e-6) continue; quad(V(x + ax, y + ay, hn), V(x + bx, y + by, hn), V(x + bx, y + by, h), V(x + ax, y + ay, h), li + 1); } } });
    return own;
  }
  const rows = {}, results = []; let worst = null;
  const run = (vn, tech, camName, yaw0, pitch, off) => {
    const { P, S0 } = state[vn], view = { yaw: yaw0 + off, pitch, zoom: 1, panX: 0, panY: 0 }, FL = E.floors.layers(S0, pack, P, view, 'cut', false), list = FL.list;
    let cam = E.makeCam(S0, P, view, CW, CH); view.zoom = px / cam.sc; cam = E.makeCam(S0, P, view, CW, CH); const ax = pack.shaft.c, c = cam.p(ax[0], ax[1], 5.2); view.panX = CW / 2 - c[0]; view.panY = CH / 2 - c[1]; cam = E.makeCam(S0, P, view, CW, CH);
    const paint = new Uint8Array(CW * CH);
    list.forEach((L, li) => { E.renderLayers(cv, [L], P, tech, view, { noBg: true }); const d = cv.getContext('2d').getImageData(0, 0, CW, CH).data; for (let k = 0; k < CW * CH; k++) if (d[k * 4 + 3] >= 128) paint[k] = li + 1; });
    const ref = reference(list, cam, view, tech === 'box' ? 'thin' : 'deep'); let diff = 0, total = 0; const pair = {}, dm = new Uint8Array(CW * CH), bd = new Uint8Array(CW * CH);
    for (let y = 2; y < CH - 2; y++) for (let x = 2; x < CW - 2; x++) { const k = y * CW + x; let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const k2 = k + dy * CW + dx; if (ref[k2] !== ref[k] || paint[k2] !== paint[k]) { edge = true; break; } }
      if (ref[k] || paint[k]) total++; if (ref[k] !== paint[k] && !edge) { diff++; dm[k] = 1; const nm = (n) => (n ? list[n - 1].name : 'nothing'), key = `ref ${nm(ref[k])}  vs  painter ${nm(paint[k])}`; pair[key] = (pair[key] || 0) + 1; } if (edge) bd[k] = 1; }
    let thin = null; if (tech !== 'box') { const rt = reference(list, cam, view, 'thin'); let d2 = 0, t2 = 0; for (let y = 2; y < CH - 2; y++) for (let x = 2; x < CW - 2; x++) { const k = y * CW + x; let edge = false; for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const k2 = k + dy * CW + dx; if (rt[k2] !== rt[k] || paint[k2] !== paint[k]) { edge = true; break; } } if (rt[k] || paint[k]) t2++; if (rt[k] !== paint[k] && !edge) d2++; } thin = t2 ? 100 * d2 / t2 : 0; }
    const pct = total ? 100 * diff / total : 0, key = `${vn}|${tech}|${camName}`;
    (rows[key] || (rows[key] = { n: 0, sum: 0, max: 0, diff: 0, total: 0, thin: 0 })); const r = rows[key]; r.thin = Math.max(r.thin, thin || 0); r.n++; r.sum += pct; r.max = Math.max(r.max, pct); r.diff += diff; r.total += total;
    const rec = { vn, tech, camName, off, pct, diff, total, pair, thin }; results.push(rec);
    if (!worst || pct > worst.rec.pct) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let k = 0; k < CW * CH; k++) if (dm[k]) { const x = k % CW, y = (k / CW) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      let near = 0; for (let k = 0; k < CW * CH; k++) if (dm[k]) { const x = k % CW, y = (k / CW) | 0; let n = false; for (let dy = -4; dy <= 4 && !n; dy++) for (let dx = -4; dx <= 4; dx++) { const x2 = x + dx, y2 = y + dy; if (x2 < 0 || y2 < 0 || x2 >= CW || y2 >= CH) continue; if (bd[y2 * CW + x2]) { n = true; break; } } if (n) near++; }
      const col = [[20, 18, 30], [214, 96, 77], [76, 148, 214], [102, 190, 120], [230, 200, 80]], mk = (own) => { const out = document.createElement('canvas'); out.width = CW; out.height = CH; const oc = out.getContext('2d'), id = oc.createImageData(CW, CH);
        for (let k = 0; k < CW * CH; k++) { const q = col[own[k]] || col[4]; id.data[k * 4] = q[0]; id.data[k * 4 + 1] = q[1]; id.data[k * 4 + 2] = q[2]; id.data[k * 4 + 3] = 255; } oc.putImageData(id, 0, 0); return out; };
      const dmask = (() => { const o = new Uint8Array(CW * CH); for (let k = 0; k < CW * CH; k++) o[k] = dm[k] ? 1 : 0; const out = document.createElement('canvas'); out.width = CW; out.height = CH; const oc = out.getContext('2d'), id = oc.createImageData(CW, CH); for (let k = 0; k < CW * CH; k++) { const v = dm[k] ? 255 : ref[k] || paint[k] ? 60 : 15; id.data[k * 4] = v; id.data[k * 4 + 1] = dm[k] ? 40 : v; id.data[k * 4 + 2] = dm[k] ? 40 : v; id.data[k * 4 + 3] = 255; } oc.putImageData(id, 0, 0); return out; })();
      E.renderLayers(cv, list, P, tech, view, {}); const shot = document.createElement('canvas'); shot.width = CW; shot.height = CH; shot.getContext('2d').drawImage(cv, 0, 0);
      worst = { rec, bbox: [x0, y0, x1, y1], near, ref: mk(ref).toDataURL('image/png'), paint: mk(paint).toDataURL('image/png'), mask: dmask.toDataURL('image/png'), shot: shot.toDataURL('image/png'), layers: list.map((L, i) => `${i + 1} = ${L.name}`) };
    }
  };
  for (const [vn] of variants) for (const t of techs) { if (vn === 'exact' && (t === 'box' || t === 'C')) continue; for (const [cn, yw, pt] of cams) for (const o of offs) { if (only && only !== `${vn}|${t}|${cn}|${o}`) continue; run(vn, t, cn, yw, pt, o); } }
  const exactOf = {}; for (const r of results) exactOf[`${r.vn}|${r.tech}|${r.camName}|${r.off}`] = r.pct;
  return { rows, worst, exactOf, top: results.slice().sort((a, b) => b.pct - a.pct).slice(0, 8).map((r) => ({ pct: r.pct, diff: r.diff, total: r.total, vn: r.vn, tech: r.tech, cam: r.camName, off: r.off, pair: r.pair })) };
};
(async () => {
  const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '/tmp/evo-verify/cut'; fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page;
  await page.click('#mode'); await a.idle(); await page.selectOption('#src', 'snake_floors'); await a.idle();
  const r = await page.evaluate(PAGE, { px: +arg('--px', 14), only: arg('--only', '') });
  console.log('Cutaway paint order vs z-buffer (measured, not enforced; the reference of A / B / C has the deep skirt they draw, the thin-slab number is the geometry difference with Box). % = differing pixels / covered pixels (1 px around ownership borders ignored); yaw offsets 0 / +10 / -10; mean / worst:');
  for (const k of Object.keys(r.rows).sort()) { const x = r.rows[k]; console.log(`  ${k.padEnd(34)} mean ${(x.sum / x.n).toFixed(2)} %  worst ${x.max.toFixed(2)} %  (${x.n} views)` + (x.thin ? `   [vs the thin-slab reference (Box skirt): worst ${x.thin.toFixed(2)} %]` : '')); }
  console.log('Top cases:'); for (const t of r.top) { console.log(`  ${t.pct.toFixed(2)} % (${t.diff}/${t.total} px) ${t.vn} ${t.tech} ${t.cam} yaw offset ${t.off}`); for (const [k, v] of Object.entries(t.pair).sort((p, q) => q[1] - p[1]).slice(0, 3)) console.log(`      ${v} px  ${k}`); }
  const w = r.worst, rec = w.rec;
  console.log(`WORST: ${rec.pct.toFixed(2)} % ${rec.vn} ${rec.tech} ${rec.camName} yaw offset ${rec.off}; layers: ${w.layers.join(', ')}; ${w.near} of ${rec.diff} differing px lie within 4 px of an ownership border (${(100 * w.near / Math.max(1, rec.diff)).toFixed(0)} %)`);
  const same = ['A', 'B'].includes(rec.tech) ? r.exactOf[`${rec.vn === 'default' ? 'exact' : 'default'}|${rec.tech}|${rec.camName}|${rec.off}`] : undefined;
  if (same !== undefined) console.log(`  the same view with ${rec.vn === 'default' ? 'tile-exact (no smoothing)' : 'the default smoothing'}: ${same.toFixed(2)} %`);
  for (const [n, d] of [['ref', w.ref], ['painter', w.paint], ['diff', w.mask], ['shot', w.shot]]) fs.writeFileSync(path.join(out, `cut_worst_${n}.png`), Buffer.from(d.split(',')[1], 'base64'));
  console.log('crops (ownership colours: ' + w.layers.map((l, i) => l).join(', ') + ') in', out, '; bbox of differing pixels', w.bbox.join(','));
  console.log('errors:', a.errs); await a.browser.close();
})();
