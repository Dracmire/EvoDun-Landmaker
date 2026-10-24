/* Diorama in the chain view (DAC v2 PR C, D30) in the real viewer: the selector, Off = the same pixels, M2 / M1 on the two chain examples, the info line, the manifest round trip, the pick of a moved goal.
     NODE_PATH=$(npm root -g) node tools/ui/test_diochain_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ok = a.ok, ev = (f, x) => page.evaluate(f, x);
  const hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex'), info = () => ev(() => document.querySelector('#info').textContent);
  await ev(() => window.__evo.setMode('rooms')); await a.idle();
  for (const id of ['real_balanced', 'real_chain5']) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle();
    ok(`${id}: the selector "Diorama in chain view" exists and is enabled in the chain view; D31 (ANNOUNCED): its default in mode 2 is M2 (every check below starts from an explicit Off)`, (await ev(() => { const s = document.querySelector('#dioChain'); return !!s && !s.disabled && s.value === 'm2' && window.__evo.P.dioChain === 'm2'; })));
    await page.selectOption('#dioChain', 'off'); await a.idle();
    const h0 = await hash(), vb0 = await ev(() => window.__evo.viewerBlock());
    ok(`${id}: Off is written explicitly (D31: "off") and the shape has no Diorama role`, vb0.dioChain === 'off' && (await ev(() => !window.__evo.S().dioRole)));
    await page.selectOption('#dioChain', 'm2'); await a.idle();
    const m2 = await ev(() => { const S = window.__evo.S(), d = S.dioInfo; return { eligible: d ? d.eligible : null, fp: d ? d.footprint : 0, added: d ? d.levelsAdded : 0, vb: window.__evo.viewerBlock().dioChain, info: document.querySelector('#info').textContent.match(/Diorama in chain view.{0,260}/) }; });
    const h2 = await hash();
    if (id === 'real_balanced') {
      ok('Balanced types K = 1, M2: rooms 7, 64 and 66 are moved (info says so), footprint tiles exist, levels were added, the canvas changed', m2.eligible && m2.eligible.slice().sort((x, y) => x - y).join() === '7,64,66' && m2.fp > 0 && m2.added > 0 && h2 !== h0 && m2.info && /M2: 3 of 9 Dioramas moved \(cap 30 tiles\)/.test(m2.info[0]), JSON.stringify(m2));
      const marks = await ev(() => { const e = window.__evo, S = e.S(); const out = e.inc.objectives.map((o) => { const i = (o.y - S.oy) * S.W + o.x - S.ox; return { moved: S.dioMove.has(i), to: S.dioMove.get(i) }; }); const inc = e.P.chainInfo; return { out, route: (document.querySelector('#incInfo').textContent.match(/route of \d+ tiles/g) || []).length }; });
      ok('the final goal (inside room 7) moves with the footprint and every objective still has a route', marks.out.some((m) => m.moved) && marks.route === marks.out.length, JSON.stringify(marks));
    } else { // Chain 5 is NOT pixel-identical with the option on: nothing moves, but the Dioramas that fail the rules are drawn as Ascension (tint and walls change)
      const c5 = await ev(() => { const S = window.__evo.S(), d = window.__evo.P.dioSummary; return { noRole: !S.dioRole, levels: S.levelH.length, demoted: d ? d.items.filter((q) => !q.eligible).length : -1, asc: S.types ? 0 : 0 }; });
      const offLv = await (async () => { await page.selectOption('#dioChain', 'off'); await a.idle(); const L = await ev(() => window.__evo.S().levelH.length), hh = await hash(); await page.selectOption('#dioChain', 'm2'); await a.idle(); return { L, hh }; })();
      ok('Chain 5, M2: the canvas differs from Off although nothing moved (no Diorama role, same levels): the cause is the 3 Dioramas drawn as Ascension (tint, walls)', c5.noRole && c5.levels === offLv.L && c5.demoted === 3 && h2 !== offLv.hh, JSON.stringify([c5, offLv.L]));
    }
    if (id !== 'real_balanced') ok('Chain 5, M2: no Diorama qualifies (all shown as Ascension), nothing moved', m2.eligible && m2.eligible.length === 0 && m2.fp === 0 && m2.info && /M2: 0 of 3 Dioramas moved/.test(m2.info[0]), JSON.stringify(m2));
    if (id === 'real_balanced') { // the TRANSIT LANDING stays visible (PR #45 review: the tint of the landing and the bridge was painted over the pick codes, so a pick render saw 3-12 % of it): game-scale framing around each landing, Box pick render with the walls as occluders, share of the landing tiles with >= 1 visible pixel
      const items = await ev(() => { const e = window.__evo, S = e.S(), W = S.W; return e.P.dioPlan.items.filter((q) => q.eligible).map((q) => ({ room: q.room, landing: q.landing, l: [q.landing.reduce((s, j) => s + (j % W), 0) / q.landing.length, q.landing.reduce((s, j) => s + ((j / W) | 0), 0) / q.landing.length], h: S.levelH[S.fine[q.landing[0]]] })); });
      const share = (g, tiles) => ev(({ g, tiles }) => { const E = window.EVO, e = window.__evo, S = e.S(), n = S.n, cv = document.querySelector('#stage canvas'); const z = (cv.clientWidth / tiles) / e.st.fitSc, v = e.view(); v.zoom = z; v.panX = 0; v.panY = 0; const p = E.makeCam(S, e.P, v, cv.clientWidth, cv.clientHeight).p(g.l[0], g.l[1], g.h); e.st.zoom = z; e.st.panX = cv.clientWidth / 2 - p[0]; e.st.panY = cv.clientHeight / 2 - p[1]; e.draw();
        const cw = cv.width, ch = cv.height, seen = new Uint8Array(n); E.render(cv, S, e.P, 'box', e.view(), { pick: true, pickWalls: true }); const dd = cv.getContext('2d').getImageData(0, 0, cw, ch).data;
        for (let q = 0; q < cw * ch; q++) { const code = (dd[4 * q] << 16) | (dd[4 * q + 1] << 8) | dd[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (dd[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n) seen[t] = 1; } e.draw();
        return +(100 * g.landing.filter((t) => seen[t]).length / g.landing.length).toFixed(1); }, { g, tiles });
      for (const [cam, nm] of [['isoE', 'Cam 1'], ['isoW', 'Cam 2']]) { await a.preset(cam); const got = []; for (const g of items) { await page.waitForTimeout(100); got.push(await share(g, 40)); }
        ok(`Balanced K = 1, M2 at ${nm}: the transit landing of every moved Diorama is visible >= 80 % (share of its tiles with a visible pixel in the Box pick render, game scale)`, got.length === 3 && got.every((x) => x >= 80), JSON.stringify(got)); }
      await a.preset('isoE'); await ev(() => { const e = window.__evo; e.st.zoom = 1; e.st.panX = 0; e.st.panY = 0; e.draw(); }); await a.idle();
    }
    ok(`${id}: M2 is written to the manifest (viewer.dioChain "m2") and read back`, m2.vb === 'm2' && await (async () => { const vb = await ev(() => window.__evo.viewerBlock()); await ev(() => { const s = document.querySelector('#dioChain'); s.value = 'off'; s.dispatchEvent(new Event('change')); }); await a.idle(); await ev((b) => window.__evo.applyViewerBlock(b), vb); await a.idle(); return (await ev(() => window.__evo.P.dioChain)) === 'm2' && (await ev(() => document.querySelector('#dioChain').value)) === 'm2'; })());
    await page.selectOption('#dioChain', 'm1'); await a.idle();
    const m1 = await ev(() => { const d = window.__evo.S().dioInfo; return { eligible: d ? d.eligible : null, fp: d ? d.footprint : 0 }; });
    ok(`${id}: M1 keeps only the Dioramas that can hold the gap of 3 empty tiles without moving far (D31, ANNOUNCED: room 66 in Balanced, none in Chain 5; M2 keeps 7, 64 and 66) (${m1.eligible && m1.eligible.join()})`, JSON.stringify((m1.eligible || []).slice().sort((x, y) => x - y)) === (id === 'real_balanced' ? '[66]' : '[]'));
    await page.selectOption('#dioChain', 'off'); await a.idle();
    ok(`${id}: back to Off = the same pixels as before`, (await hash()) === h0);
  }
  ok('no moved Diorama outside the chain view: whole map view has no Diorama role', await (async () => { await page.selectOption('#dioChain', 'm2'); await a.idle(); await page.selectOption('#dacView', 'whole'); await a.idle(); const r = await ev(() => !window.__evo.S().dioRole); await page.selectOption('#dacView', 'chain'); await page.selectOption('#dioChain', 'off'); await a.idle(); return r; })());
  console.log('errors:', a.errs); await a.browser.close(); process.exit(process.exitCode || (a.errs.length ? 1 : 0));
})();
