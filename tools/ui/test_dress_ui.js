/* Wall dressing against a per-pixel reference (the Box id render = the true visible surface at every pixel): for every FOOT strip and BASE ROCK drawn, is its anchor point (on the lower cap) visible in the reference
   (cap code of the tile under the anchor) and does the picture with the dressing differ from the one without it there? Counts: agree (visible in the reference and changed), shows-through (hidden in the reference but
   changed: a painter-order error), missing (visible in the reference but not changed: covered by something that should be behind it). Measured, not enforced, except that the switch off is identical to the plain picture.
   Also checks that the dressing changes the picture in Box / A / B / C and that off is identical (same pixels as before the switch was touched).
     NODE_PATH=$(npm root -g) node tools/ui/test_dress_ui.js [--px 36] */
const crypto = require('crypto');
const { open } = require('./common');
const PAGE = async ({ techs, views, scene }) => {
  const E = window.EVO, e = window.__evo, W = 900, H = 640, out = {};
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:-1`; document.body.appendChild(cv);
  const S = e.S(), P = e.P;
  const px = (ctx, x, y) => { const d = ctx.getImageData(Math.max(0, Math.round(x) - 1), Math.max(0, Math.round(y) - 1), 3, 3).data; return d; };
  for (const [vname, kind, yaw, pitch] of views) for (const tech of techs) {
    const view0 = { kind, yaw, pitch, zoom: 1, panX: 0, panY: 0, persH: H }; view0.fitSc = E.fitScale(S, P, view0, W, H);
    const view = Object.assign({}, view0, { zoom: scene.zoom }), cam0 = E.makeCam(S, P, view, W, H);
    const L = S.landmarks && S.landmarks.shrine, fx = L ? L.c[0] - S.ox + 0.5 : S.W / 2, fy = L ? L.c[1] - S.oy + 3.5 : S.H / 2, fh = S.levelH[S.fine[Math.floor(fy) * S.W + Math.floor(fx)]], c = cam0.p(fx, fy, fh);
    view.panX = W / 2 - c[0]; view.panY = H / 2 - c[1]; if (cam0.panFor) { const q = cam0.panFor(fx, fy, fh); view.panX = q[0]; view.panY = q[1]; }
    const base = { outlines: true, gradient: true, veil: true, border: true, markers: true };
    E.render(cv, S, P, tech, view, Object.assign({}, base)); const ctx = cv.getContext('2d'), dpr = cv.width / W, off = ctx.getImageData(0, 0, cv.width, cv.height).data.slice();
    const st = E.render(cv, S, P, tech, view, Object.assign({}, base, { dress: true, dressItems: true })), on = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const ref = E.pickBuffer(S, P, view, W, H), cam = E.makeCam(S, P, view, W, H), rc = (x, y) => { const xx = Math.round(x), yy = Math.round(y); if (xx < 0 || yy < 0 || xx >= W || yy >= H) return -2; const q = (yy * W + xx) * 4; return ref.data[q + 3] === 255 ? (ref.data[q] << 16) | (ref.data[q + 1] << 8) | ref.data[q + 2] : -1; };
    const r = { foot: { agree: 0, through: 0, missing: 0, quiet: 0 }, rock: { agree: 0, through: 0, missing: 0, quiet: 0 }, items: 0, changed: 0 };
    for (let i = 0; i < on.length; i += 4) if (Math.abs(on[i] - off[i]) + Math.abs(on[i + 1] - off[i + 1]) + Math.abs(on[i + 2] - off[i + 2]) > 6) r.changed++;
    for (const it of (st.dress.items || [])) {
      const p = cam.p(it.x, it.y, it.z); if (p[0] < 3 || p[1] < 3 || p[0] > W - 3 || p[1] > H - 3) continue;
      const tile = Math.floor(it.y) * S.W + Math.floor(it.x); r.items++;
      let visRef = false; for (let dy = -2; dy <= 2 && !visRef; dy++) for (let dx = -2; dx <= 2; dx++) { const code = rc(p[0] + dx, p[1] + dy); if (code === ((4 << 20) | tile) || code === ((3 << 20) | tile)) { visRef = true; break; } } // edge pixels are blends: the cap code anywhere in 5 x 5
      let diff = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const q = ((Math.round(p[1] * dpr) + dy) * cv.width + Math.round(p[0] * dpr) + dx) * 4; diff = Math.max(diff, Math.abs(on[q] - off[q]) + Math.abs(on[q + 1] - off[q + 1]) + Math.abs(on[q + 2] - off[q + 2])); }
      const ch = diff > 10, g = r[it.k];
      if (visRef && ch) g.agree++; else if (!visRef && ch) g.through++; else if (visRef && !ch) g.missing++; else g.quiet++;
    }
    out[`${vname}|${tech}`] = r;
  }
  return out;
};
(async () => {
  const pi = process.argv.indexOf('--px'), zoom = pi > 0 ? +process.argv[pi + 1] / 20 : 1.8;
  const a = await open({ w: 1000, h: 760 }), page = a.page, hashOf = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  await page.selectOption('#src', 'shrine_pier_x4'); await a.idle(); await page.click('#stagePreset'); await a.idle();
  const views = [['oblique 50', 'ortho', 0, 50], ['iso 45', 'ortho', 45, 35], ['stage', 'persp', 90, 25]];
  const r = await page.evaluate(PAGE, { techs: ['box', 'A', 'B', 'C'], views, scene: { zoom } });
  console.log('| view | technique | foot strips: agree / shows through / missing | base rocks: agree / shows through / missing | changed px |\n|---|---|---|---|---:|');
  let any = 0;
  for (const [k, v] of Object.entries(r)) { const [vn, t] = k.split('|'), f = v.foot, q = v.rock; any += v.items; console.log(`| ${vn} | ${t} | ${f.agree} / ${f.through} / ${f.missing} | ${q.agree} / ${q.through} / ${q.missing} | ${v.changed} |`); }
  a.ok('the dressing draws foot strips and rocks and changes the picture in every technique and view', Object.values(r).every((v) => v.items > 20 && v.changed > 1000), JSON.stringify(Object.entries(r).map(([k, v]) => [k, v.items, v.changed])));
  // the switch: off = identical pixels (before / after toggling it)
  await a.tech('box'); await a.preset('oblique'); const h0 = await hashOf(); await page.check('#t-dress'); await a.idle(); const h1 = await hashOf(); await page.uncheck('#t-dress'); await a.idle(); const h2 = await hashOf();
  a.ok('switch on changes the Box picture, off again restores it exactly', h1 !== h0 && h2 === h0);
  for (const t of ['A', 'B', 'C']) { await a.tech(t); await a.idle(); await page.check('#t-dress'); await a.idle(); await page.uncheck('#t-dress'); await a.idle(); await page.waitForTimeout(200); const q0 = await hashOf(); /* one warm-up cycle first: the info line (and so the canvas height) settles once its stair coverage is computed */ await page.check('#t-dress'); await a.idle(); const q1 = await hashOf(); await page.uncheck('#t-dress'); await a.idle(); a.ok(`${t}: switch on changes the picture, off restores it`, q1 !== q0 && (await hashOf()) === q0); }
  console.log('errors:', a.errs); a.ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
