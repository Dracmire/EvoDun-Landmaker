/* DAC v2 PR C2 (D31) in the real viewer: the mode-2 defaults (Diorama M2, gate width 3, wall cut 0.5), the explicit manifest values and the backward compatibility (an absent key = the OLD values), the other modes keep today's values, the drawn route is the chain.
     NODE_PATH=$(npm root -g) node tools/ui/test_diochain2_ui.js */
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ok = a.ok, ev = (f, x) => page.evaluate(f, x);
  const vals = () => ev(() => ({ d: window.__evo.P.dioChain, g: window.__evo.P.ascGate, c: window.__evo.P.ascCut, ds: document.querySelector('#dioChain') && document.querySelector('#dioChain').value }));
  await ev(() => window.__evo.setMode('rooms')); await a.idle();
  for (const id of ['real_balanced', 'real_chain5']) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle();
    const v = await vals(); ok(`${id}: the mode-2 defaults are Diorama M2, gate width 3, wall cut 0.5 (D31, announced)`, v.d === 'm2' && v.g === 3 && v.c === 0.5 && v.ds === 'm2', JSON.stringify(v));
    const vb = await ev(() => window.__evo.viewerBlock()); ok(`${id}: a manifest saved in mode 2 writes the three values EXPLICITLY (dioChain "m2", ascGate 3, ascCut 0.5)`, vb.dioChain === 'm2' && vb.ascGate === 3 && vb.ascCut === 0.5, JSON.stringify(vb));
    await ev((vb) => window.__evo.applyViewerBlock(vb), vb); const v2 = await vals(); ok(`${id}: the new manifest loads back to the same values`, v2.d === 'm2' && v2.g === 3 && v2.c === 0.5);
    // a pack saved BEFORE C2 (rooms mode, none of the three keys): loads as before (Off / 0 / 0.15)
    const old = { preset: 'balanced', rooms: true, cake: true, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, camera: 'isoE', mode: 'rooms', dacAuto: true, dacView: 'chain' };
    await ev((vb) => window.__evo.applyViewerBlock(vb), old); const v3 = await vals(); ok(`${id}: an OLD pack (no dioChain / ascGate / ascCut) loads as before: Off / 0 / 0.15, not the new defaults`, v3.d === 'off' && v3.g === 0 && v3.c === 0.15 && v3.ds === 'off', JSON.stringify(v3));
    const vbOff = await ev(() => { window.__evo.P.dioChain = 'off'; return window.__evo.viewerBlock(); }); ok(`${id}: "off" is written explicitly (a mode-2 manifest with the option Off stays Off)`, vbOff.dioChain === 'off');
    await page.click(`#examples button[data-id="${id}"]`); await a.idle();
  }
  // the chain view draws the chain as the route (Balanced, M2 default)
  await page.click('#examples button[data-id="real_balanced"]'); await a.idle();
  const r = await ev(() => { const E = window.EVO, e = window.__evo, S = e.S(), cr = E.roomTypes.chainRoute(S, e.P); if (!cr || cr.fail) return { fail: cr && cr.why }; const pc = E.roomTypes.pieces(S, e.P); const info = document.querySelector('#info').textContent; return { len: cr.path.length, pieces: cr.pieces, chain: cr.chainPieces, grey: cr.path.filter((t) => S.chainGrey && S.chainGrey[t]).length, text: (info.match(/the drawn route follows the chain: [^;]*/) || [''])[0], routes: (document.querySelector('#incInfo').textContent.match(/route of \d+ tiles/g) || []), goalIdx: cr.goalIdx }; });
  ok('Balanced, mode 2: the drawn route follows the chain (the info line says so), through every piece, with 0 route tiles on the flattened ground', !r.fail && r.pieces === r.chain && r.grey === 0 && /through 32 of 32 pieces/.test(r.text), JSON.stringify(r));
  ok('Balanced, mode 2: the routes of the two objectives are the prefixes of the chain path (lengths = the goal indexes + 1)', r.routes.length === 2 && r.routes[0] === `route of ${r.goalIdx[1] + 1} tiles` && r.routes[1] === `route of ${r.goalIdx[2] + 1} tiles`, JSON.stringify([r.routes, r.goalIdx]));
  // the other modes keep today's values
  await ev(() => window.__evo.setMode('terrain')); await a.idle(); const t1 = await vals(); ok('mode 1 (Terrain): the Ascension gate width, the wall cut and the Diorama option keep today\'s values (0 / 0.15 / Off)', t1.d === 'off' && t1.g === 0 && t1.c === 0.15, JSON.stringify(t1));
  console.log('errors:', a.errs); await a.browser.close(); process.exit(process.exitCode || (a.errs.length ? 1 : 0));
})().catch((e) => { console.error(e); process.exit(1); });
