/* Validation of the ANALYTIC line of sight (T.dioLOS, D31) against the Box pick render: the share of the footprint tiles of the moved Dioramas of the real map (Balanced rooms 66, 64, 7) and of room 10 of Chain 5 (forced with the test-only P.dioForceRooms) that are visible,
   measured two ways at Cam 1 (yaw 45, pitch 35) and Cam 3 (yaw 0, pitch 50): the Box pick render at game scale (only the tiles of that footprint inside the view, walls as occluders) and the analytic test over the height map of the final shape. Prints both and the difference; exit code 1 above the 2-point bound.
     EVO_ROOT=<dir> NODE_PATH=$(npm root -g) node tools/ui/measure_dio_los.js */
const { open } = require('./common');
const BOUND = 2;
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x); let worst = 0; const rows = [];
  const cases = [['real_balanced', null, [66, 64, 7]], ['real_chain5', [10], [10]]];
  await ev(() => window.__evo.setMode('rooms')); await a.idle();
  for (const [ex, force, rooms] of cases) {
    await page.click(`#examples button[data-id="${ex}"]`); await a.idle(); await a.tech('A');
    await ev((force) => { const P = window.__evo.P; P.dioForceRooms = force || undefined; }, force);
    await page.selectOption('#dioChain', 'off'); await a.idle(); await page.selectOption('#dioChain', 'm2'); await a.idle();
    for (const room of rooms) for (const [cam, cn, yaw, pitch] of [['isoE', 'Cam 1', 45, 35], ['oblique', 'Cam 3', 0, 50]]) { await a.preset(cam); await a.idle();
      const r = await ev(({ room, yaw, pitch }) => { const E = window.EVO, e = window.__evo, S = e.S(), n = S.n, W = S.W, it = e.P.dioPlan.items.find((q) => q.room === room && q.eligible); if (!it) return null; const c = (arr) => [arr.reduce((s, j) => s + (j % W), 0) / arr.length, arr.reduce((s, j) => s + ((j / W) | 0), 0) / arr.length];
        const fp = c(it.dst), lc = c(it.landing), mid = [(fp[0] + lc[0]) / 2, (fp[1] + lc[1]) / 2], dist = Math.hypot(fp[0] - lc[0], fp[1] - lc[1]), tiles = Math.max(34, Math.ceil(dist * 1.7 + 26)), Href = S.levelH[S.fine[it.landing[0]]]; const cv = document.querySelector('#stage canvas'); const z = (cv.clientWidth / tiles) / e.st.fitSc, v = e.view(); v.zoom = z; v.panX = 0; v.panY = 0;
        const p0 = E.makeCam(S, e.P, v, cv.clientWidth, cv.clientHeight).p(mid[0], mid[1], Href); e.st.zoom = z; e.st.panX = cv.clientWidth / 2 - p0[0]; e.st.panY = cv.clientHeight / 2 - p0[1]; e.draw();
        const cam = E.makeCam(S, e.P, e.view(), cv.clientWidth, cv.clientHeight), dpr = cv.width / cv.clientWidth, cw = cv.width, ch = cv.height, seen = new Uint8Array(n); E.render(cv, S, e.P, 'box', e.view(), { pick: true, pickWalls: true }); const dd = cv.getContext('2d').getImageData(0, 0, cw, ch).data;
        for (let q = 0; q < cw * ch; q++) { const code = (dd[4 * q] << 16) | (dd[4 * q + 1] << 8) | dd[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (dd[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n) seen[t] = 1; } e.draw();
        let iv = 0, sv = 0; const inView = []; for (const t of it.dst) { const q = cam.p((t % W) + 0.5, ((t / W) | 0) + 0.5, S.levelH[S.fine[t]]), px = q[0] * dpr, py = q[1] * dpr; if (px >= 0 && py >= 0 && px < cw && py < ch) { iv++; if (seen[t]) sv++; inView.push(t); } }
        const heightOf = (t) => (S.void && S.void[t] ? -Infinity : S.levelH[S.fine[t]]), los = E.roomTypes.dioLOS(W, S.H, heightOf, inView, inView.map((t) => S.levelH[S.fine[t]]), yaw, pitch);
        return { fpTiles: it.dst.length, inView: iv, render: iv ? 100 * sv / iv : null, analytic: 100 * los, shift: it.shift, type: it.type }; }, { room, yaw, pitch });
      if (!r) { console.log(`${ex} room ${room} ${cn}: no moved Diorama`); continue; } const diff = Math.abs(r.render - r.analytic); worst = Math.max(worst, diff); rows.push({ room, cn, ...r, diff });
      console.log(`room ${room} ${cn} (${r.type}, shift ${r.shift}, ${r.inView}/${r.fpTiles} tiles in view): Box pick render ${r.render.toFixed(1)} %, analytic ${r.analytic.toFixed(1)} %, difference ${diff.toFixed(1)} points`); }
  }
  console.log(`worst difference ${worst.toFixed(2)} points (bound ${BOUND}): ` + (worst <= BOUND ? 'the analytic criterion is validated' : 'DISAGREES: the criterion must be dropped')); await a.browser.close(); process.exit(worst <= BOUND ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
