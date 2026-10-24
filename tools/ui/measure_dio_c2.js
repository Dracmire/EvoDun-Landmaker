/* DAC v2 PR C2 (D31) measures and evidence crops on the real map (report, not tuned): per example (Balanced types, Chain 5 terraces) and K (1 / 0 sub-objectives): the moved Dioramas (type, rank, free-side share, via, shift, gap, bridge, kept share, pocket tiles, slopes, framing of the paths by the pocket),
   their visibility at Cam 1 / Cam 3 (the Box pick render with the walls as occluders, per Diorama, only the tiles inside the view), the redraw time with the option Off / M2, the levels added, the land kept and the chain visibility.
     EVO_ROOT=<dir> NODE_PATH=$(npm root -g) node tools/ui/measure_dio_c2.js [--shots <dir>] */
const { open } = require('./common');
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), timed = async (sel) => { const t0 = Date.now(); await page.selectOption('#dioChain', sel); await a.idle(); return Date.now() - t0; };
  const focusMeasure = (spec) => ev(({ room, tiles, withShot }) => { const E = window.EVO, e = window.__evo, S = e.S(), n = S.n, W = S.W, it = e.P.dioPlan.items.find((q) => q.room === room && q.eligible); if (!it) return null; const c = (arr) => [arr.reduce((s, j) => s + (j % W), 0) / arr.length, arr.reduce((s, j) => s + ((j / W) | 0), 0) / arr.length];
    const fp = c(it.dst), lc = c(it.landing), mid = [(fp[0] + lc[0]) / 2, (fp[1] + lc[1]) / 2], dist = Math.hypot(fp[0] - lc[0], fp[1] - lc[1]), tl = tiles || Math.max(40, Math.ceil(dist * 1.7 + 30)), Href = S.levelH[S.fine[it.landing[0]]]; const cv = document.querySelector('#stage canvas'); const z = (cv.clientWidth / tl) / e.st.fitSc, v = e.view(); v.zoom = z; v.panX = 0; v.panY = 0;
    const p0 = E.makeCam(S, e.P, v, cv.clientWidth, cv.clientHeight).p(mid[0], mid[1], Href); e.st.zoom = z; e.st.panX = cv.clientWidth / 2 - p0[0]; e.st.panY = cv.clientHeight / 2 - p0[1]; e.draw();
    const cam = E.makeCam(S, e.P, e.view(), cv.clientWidth, cv.clientHeight), dpr = cv.width / cv.clientWidth, cw = cv.width, ch = cv.height, seen = new Uint8Array(n); E.render(cv, S, e.P, 'box', e.view(), { pick: true, pickWalls: true }); const dd = cv.getContext('2d').getImageData(0, 0, cw, ch).data;
    for (let q = 0; q < cw * ch; q++) { const code = (dd[4 * q] << 16) | (dd[4 * q + 1] << 8) | dd[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (dd[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n) seen[t] = 1; } e.draw();
    const share = (tl2) => { let iv = 0, sv = 0; for (const t of tl2) { const q = cam.p((t % W) + 0.5, ((t / W) | 0) + 0.5, S.levelH[S.fine[t]]), px = q[0] * dpr, py = q[1] * dpr; if (px >= 0 && py >= 0 && px < cw && py < ch) { iv++; if (seen[t]) sv++; } } return iv ? +(100 * sv / iv).toFixed(1) : null; };
    return { fp: share(it.dst), landing: share(it.landing), bridge: share([...it.bridge.inner, ...it.bridge.lat]), pocket: share(it.pocket) }; }, spec);
  const shot = async (name) => { if (!shotsDir) return; const cv = await page.$('#stage canvas'); await cv.screenshot({ path: `${shotsDir}/${name}.png` }); };
  const info = (room) => ev((room) => { const it = window.__evo.P.dioPlan.items.find((q) => q.room === room && q.eligible); if (!it) return null; const p = it.prof; return { type: it.type, rank: it.rank, free: Math.round(it.free.share * 100), sector: it.free.sector * 45, via: it.via, shift: it.shift, gapC: it.gapC, gapE: it.gapE, bridge: it.bridgeLen, kept: it.kept, pocketN: it.pocket.length, pocketWanted: it.pocketWanted, slopeMax: p.slopeMax, slopeNoCliff: p.slopeNoCliff, pocketMaxRel: +(p.pocketMax - p.top).toFixed(2), top: +p.top.toFixed(2), framing: it.framing }; }, room);
  await ev(() => window.__evo.setMode('rooms')); await a.idle();
  for (const id of ['real_balanced', 'real_chain5']) for (const K of [1, 0]) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.tech('A');
    if (K === 0) { await ev(() => { window.__evo.inc.objectives.splice(0, window.__evo.inc.objectives.length - 1); }); await page.selectOption('#roomRule', 'route'); await a.idle(); await page.selectOption('#roomRule', 'v164'); await a.idle(); }
    for (const mode of ['m2', 'm1']) {
      const tOff = await timed('off'), levelsOff = await ev(() => window.__evo.S().levelH.length), tOn = await timed(mode);
      const g = await ev(() => { const e = window.__evo, S = e.S(), d = S.dioInfo, p = e.P.dioPlan, cr = window.EVO.roomTypes.chainRoute(S, e.P), chain = new Set(e.P.chainIds); let land = 0, kept = 0; for (let i = 0; i < S.n; i++) { if (S.void && S.void[i]) continue; land++; if (chain.has(S.roomMap[i])) kept++; } return { eligible: d ? d.eligible : [], levelsAdded: d ? d.levelsAdded : 0, levels: S.levelH.length, demoted: p.why.map((q) => q.room + ': ' + q.why), landKept: +(100 * kept / land).toFixed(1), routeTiles: cr && !cr.fail ? cr.path.length : null, routePieces: cr && !cr.fail ? cr.pieces + '/' + cr.chainPieces : null, routeGrey: cr && !cr.fail ? cr.path.filter((t) => S.chainGrey && S.chainGrey[t]).length : null }; });
      console.log(JSON.stringify({ ex: id, K, mode, msOff: tOff, msOn: tOn, levelsOff, ...g }));
      for (const room of g.eligible) { const inf = await info(room); for (const [cam, cn] of [['isoE', 'cam1'], ['oblique', 'cam3']]) { await a.preset(cam); await a.idle(); const v = await focusMeasure({ room }); await shot && 0; console.log(JSON.stringify({ ex: id, K, mode, room, cam: cn, ...inf, vis: v })); if (mode === 'm2' && K === 1 && shotsDir) { await focusMeasure({ room, withShot: true }); await shot(`dacvC2_${id.replace('real_', '')}_${mode}_room${room}_${cn}`); } else if (mode === 'm1' && K === 1 && shotsDir) { await focusMeasure({ room }); await shot(`dacvC2_${id.replace('real_', '')}_${mode}_room${room}_${cn}`); } } }
      if (mode === 'm2' && K === 1 && shotsDir) for (const [cam, cn] of [['isoE', 'cam1'], ['oblique', 'cam3']]) { await a.preset(cam); await ev(() => { const e = window.__evo; e.st.zoom = 1; e.st.panX = 0; e.st.panY = 0; e.draw(); }); await a.idle(); await shot(`dacvC2_${id.replace('real_', '')}_chain_${cn}`); }
      await a.preset('isoE'); await a.idle();
    }
  }
  if (shotsDir) { // the forced types on a real Chain 5 room (room 10: terrace 3): the test-only hooks P.dioForceRooms / P.dioForceRank / P.dioFree
    await page.click('#examples button[data-id="real_chain5"]'); await a.idle(); await a.tech('A');
    for (const [name, rank, free] of [['island', 'low', undefined], ['arena', 'mid', undefined], ['cima', 'high', 2]]) {
      await ev(({ rank, free }) => { const P = window.__evo.P; P.dioForceRooms = [10]; P.dioForceRank = rank; P.dioFree = free; }, { rank, free }); await page.selectOption('#dioChain', 'off'); await a.idle(); await page.selectOption('#dioChain', 'm2'); await a.idle();
      const inf = await info(10); console.log(JSON.stringify({ forced: name, ...inf })); for (const [cam, cn] of [['isoE', 'cam1'], ['oblique', 'cam3']]) { await a.preset(cam); await a.idle(); const v = await focusMeasure({ room: 10 }); console.log(JSON.stringify({ forced: name, cam: cn, vis: v })); await shot(`dacvC2_forced_${name}_${cn}`); } }
    await ev(() => { const P = window.__evo.P; P.dioForceRooms = undefined; P.dioForceRank = undefined; P.dioFree = undefined; });
  }
  await a.browser.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
