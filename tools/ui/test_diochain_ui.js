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
    ok(`${id}: the selector "Diorama in chain view" exists, enabled in the chain view, default Off`, (await ev(() => { const s = document.querySelector('#dioChain'); return !!s && !s.disabled && s.value === 'off' && window.__evo.P.dioChain === 'off'; })));
    const h0 = await hash(), vb0 = await ev(() => window.__evo.viewerBlock());
    ok(`${id}: Off writes no dioChain in the manifest and the shape has no Diorama role`, vb0.dioChain === undefined && (await ev(() => !window.__evo.S().dioRole)));
    await page.selectOption('#dioChain', 'm2'); await a.idle();
    const m2 = await ev(() => { const S = window.__evo.S(), d = S.dioInfo; return { eligible: d ? d.eligible : null, fp: d ? d.footprint : 0, added: d ? d.levelsAdded : 0, vb: window.__evo.viewerBlock().dioChain, info: document.querySelector('#info').textContent.match(/Diorama in chain view.{0,260}/) }; });
    const h2 = await hash();
    if (id === 'real_balanced') {
      ok('Balanced types K = 1, M2: rooms 7, 64 and 66 are moved (info says so), footprint tiles exist, levels were added, the canvas changed', m2.eligible && m2.eligible.slice().sort((x, y) => x - y).join() === '7,64,66' && m2.fp > 0 && m2.added > 0 && h2 !== h0 && m2.info && /M2: 3 of 9 Dioramas moved \(cap 30 tiles\)/.test(m2.info[0]), JSON.stringify(m2));
      const marks = await ev(() => { const e = window.__evo, S = e.S(); const out = e.inc.objectives.map((o) => { const i = (o.y - S.oy) * S.W + o.x - S.ox; return { moved: S.dioMove.has(i), to: S.dioMove.get(i) }; }); const inc = e.P.chainInfo; return { out, route: (document.querySelector('#incInfo').textContent.match(/route of \d+ tiles/g) || []).length }; });
      ok('the final goal (inside room 7) moves with the footprint and every objective still has a route', marks.out.some((m) => m.moved) && marks.route === marks.out.length, JSON.stringify(marks));
    } else ok('Chain 5, M2: no Diorama qualifies (all shown as Ascension), nothing moved', m2.eligible && m2.eligible.length === 0 && m2.fp === 0 && m2.info && /M2: 0 of 3 Dioramas moved/.test(m2.info[0]), JSON.stringify(m2));
    ok(`${id}: M2 is written to the manifest (viewer.dioChain "m2") and read back`, m2.vb === 'm2' && await (async () => { const vb = await ev(() => window.__evo.viewerBlock()); await ev(() => { const s = document.querySelector('#dioChain'); s.value = 'off'; s.dispatchEvent(new Event('change')); }); await a.idle(); await ev((b) => window.__evo.applyViewerBlock(b), vb); await a.idle(); return (await ev(() => window.__evo.P.dioChain)) === 'm2' && (await ev(() => document.querySelector('#dioChain').value)) === 'm2'; })());
    await page.selectOption('#dioChain', 'm1'); await a.idle();
    const m1 = await ev(() => { const d = window.__evo.S().dioInfo; return { eligible: d ? d.eligible : null, fp: d ? d.footprint : 0 }; });
    ok(`${id}: M1 gives the same eligible set as M2 at the cap (${m1.eligible && m1.eligible.join()})`, JSON.stringify((m1.eligible || []).slice().sort((x, y) => x - y)) === JSON.stringify((m2.eligible || []).slice().sort((x, y) => x - y)));
    await page.selectOption('#dioChain', 'off'); await a.idle();
    ok(`${id}: back to Off = the same pixels as before`, (await hash()) === h0);
  }
  ok('no moved Diorama outside the chain view: whole map view has no Diorama role', await (async () => { await page.selectOption('#dioChain', 'm2'); await a.idle(); await page.selectOption('#dacView', 'whole'); await a.idle(); const r = await ev(() => !window.__evo.S().dioRole); await page.selectOption('#dacView', 'chain'); await page.selectOption('#dioChain', 'off'); await a.idle(); return r; })());
  console.log('errors:', a.errs); await a.browser.close(); process.exit(process.exitCode || (a.errs.length ? 1 : 0));
})();
