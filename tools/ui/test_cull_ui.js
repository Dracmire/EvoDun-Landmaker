/* VIEWPORT CULLING of walls and Ascension walls (PR E1a, `cullOf` / `edgeOff` / `boxOff` in src/render.js): PIXEL IDENTITY where `tools/verify.sh regress` cannot prove it (regress is full-map, where culling does nothing).
   For close-up viewports (map corners and edges, the centre, points of the chain route and a moved Diorama; 20 / 30 / 60 px per tile; Cam 1 and Cam 3; terH 1 / 3 / 6; technique A and B; Diorama option Off / M2 / Corridor) the SAME view is rendered with the culling ON and with it OFF (`o.noCull`)
   into 640 x 480 canvases and the two canvases must be BYTE-IDENTICAL (FNV-1a hash of every channel of every pixel). Also: the culling is effective (fewer walls drawn at 60 px per tile), and two MUTATIONS must make the identity check FAIL: the margin shrunk (`o.cullPad` = -150 px) and the wall height
   dropped from the box (`o.cullNoHeight`).
   Default run: every combination, 4 positions chosen in rotation (all 14 positions are covered across the combinations). `--full`: every combination x every position (about 1.5 h in headless software rendering).
     NODE_PATH=$(npm root -g) node tools/ui/test_cull_ui.js [--full] */
const { open } = require('./common');
const ONLY = process.env.CULL_ONLY ? process.env.CULL_ONLY.split(',') : null, FULL = process.argv.includes('--full'), ZOOMS = [20, 30, 60], THS = [1, 3, 6], MODES = ['off', 'm2', 'corr'], TECHS = ['A', 'B'], CAMS = ['isoE', 'oblique'];
const POSITIONS = () => { const e = window.__evo, E = window.EVO, S = e.S(), P = e.P, W = S.W, H = S.H, out = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3], [W >> 1, 2], [W - 3, H >> 1], [W >> 1, H - 3], [2, H >> 1], [W >> 1, H >> 1]];
  const cr = P.chainSeqs ? E.roomTypes.chainRoute(S, P) : null; if (cr && cr.path) for (const f of [0.2, 0.4, 0.6, 0.8]) { const t = cr.path[Math.floor(cr.path.length * f)]; out.push([t % W, (t / W) | 0]); }
  const it = P.dioPlan && P.dioPlan.items.find((q) => q.eligible); if (it) { let sx = 0, sy = 0; for (const t of it.dst) { sx += t % W; sy += (t / W) | 0; } out.push([Math.round(sx / it.dst.length), Math.round(sy / it.dst.length)]); }
  while (out.length < 14) out.push([(out.length * 37) % W, (out.length * 53) % H]); return out; };
const RUN = ({ tech, ppts, pos, opts }) => {
  const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, O = e.O, W = 640, H = 480, res = [];
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:-9999px`; document.body.appendChild(c); return c; }, c1 = mk(), c0 = mk();
  const hash = (cv) => { const d = cv.getContext('2d').getImageData(0, 0, W, H).data; let a = 2166136261; for (let i = 0; i < d.length; i++) { a ^= d[i]; a = Math.imul(a, 16777619) >>> 0; } return a; };
  for (const ppt of ppts) for (const [x, y] of pos) {
    const v = e.view(); v.zoom = ppt / e.st.fitSc; v.panX = 0; v.panY = 0; const t = Math.max(0, Math.min(S.n - 1, y * S.W + x)), hh = S.void && S.void[t] ? S.levelH[0] : S.levelH[S.fine[t]], p0 = E.makeCam(S, P, v, W, H).p(x + 0.5, y + 0.5, hh); v.panX = W / 2 - p0[0]; v.panY = H / 2 - p0[1];
    const r1 = E.render(c1, S, P, tech, v, Object.assign({}, O, opts || {})), r0 = E.render(c0, S, P, tech, v, Object.assign({}, O, { noCull: true }));
    res.push({ ppt, x, y, same: hash(c1) === hash(c0), walls: [r1.walls, r0.walls], culled: r1.culled }); }
  c1.remove(); c0.remove(); return res; };
(async () => {
  let fails = 0, pairs = 0, combo = 0; const ok = (name, c, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!c) fails++; };
  for (const tech of TECHS) { if (ONLY && ONLY[0] !== tech) continue;
    const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle(); if (tech !== 'A') await a.tech(tech);
    for (const th of THS) { if (ONLY && +ONLY[1] !== th) continue; await a.slider('terH', th); await a.idle();
      for (const mode of MODES) { if (ONLY && ONLY[2] !== mode) continue; await page.selectOption('#dioChain', mode); await a.idle();
        const all = await ev(POSITIONS);
        for (const cam of CAMS) { await a.preset(cam); await a.idle();
          for (const ppt of ZOOMS) { const pos = FULL ? all : [0, 1, 2, 3].map((j) => all[(combo * 4 + j) % all.length]); combo++;
            const r = await ev(RUN, { tech, ppts: [ppt], pos, opts: {} }), bad = r.filter((q) => !q.same); pairs += r.length;
            const w1 = r.reduce((s, q) => s + q.walls[0], 0), w0 = r.reduce((s, q) => s + q.walls[1], 0);
            ok(`IDENTITY ${tech} terH ${th} ${mode} ${cam} ${ppt} px/tile: ${r.length} viewports with the culling ON and OFF are byte-identical (walls drawn ${w1} vs ${w0})`, bad.length === 0, bad.map((q) => `(${q.x},${q.y})`).join(' '));
            if (ppt === 60) ok(`EFFECTIVE ${tech} terH ${th} ${mode} ${cam} 60 px/tile: the culling draws fewer walls (${w1} < ${w0})`, w1 < w0); }
          if (th === 3 && mode !== 'off' && cam === 'isoE') { // the mutations, on the scenes with walls near the canvas border
            const pos = all.slice(0, 14); const m1 = await ev(RUN, { tech, ppts: [60], pos, opts: { cullPad: -150 } }), m2 = await ev(RUN, { tech, ppts: [60], pos, opts: { cullNoHeight: true } });
            ok(`MUTATION margin shrunk (cullPad -150 px; ${tech} ${mode} terH 3 Cam 1 60 px/tile): the IDENTITY check FAILS (${m1.filter((q) => !q.same).length} of ${m1.length} viewports differ)`, m1.some((q) => !q.same));
            ok(`MUTATION wall height dropped from the box (cullNoHeight; ${tech} ${mode} terH 3 Cam 1 60 px/tile): the IDENTITY check FAILS (${m2.filter((q) => !q.same).length} of ${m2.length} viewports differ)`, m2.some((q) => !q.same)); } } } }
    await a.browser.close(); }
  console.log(`${pairs} viewport pairs compared (${FULL ? 'full' : 'rotating positions'})`); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
