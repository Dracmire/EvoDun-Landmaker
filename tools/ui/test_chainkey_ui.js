/* The key of the chain and of the Diorama plan in the real viewer (PR E0; the node test is tools/test_chainkey.js). The NORMAL session is: open mode 2 (terH 1, M2 by default), pick the Diorama option, change terH.
   Before PR E0 the plan stayed the one of terH 1 (the pocket relief of terH 1 on the terraces of terH 3). The reference is the same final settings reached by a path that always recomputed the plan: Diorama option Off, terH 3, then the option.
   For M1, M2 and Corridor the plan fingerprint (rooms, steps, shifts, footprints, pocket tops in terH units) and the level heights of the built shape must be equal; the MUTATION (terH removed from E.roomTypes.CHAIN_KEY) must make the check fail.
     NODE_PATH=$(npm root -g) node tools/ui/test_chainkey_ui.js */
const { open } = require('./common');
const FP = () => { const e = window.__evo, P = e.P, S = e.S(), dp = P.dioPlan; if (!dp) return null; const q = (x) => +x.toFixed(4);
  return { terH: P.terH, plan: dp.items.map((it) => [it.room, !!it.eligible, it.step || '', it.type || '', it.shift === undefined ? '' : it.shift, it.dst ? it.dst.length : 0, it.prof ? q(it.prof.top / P.terH) : null]), levels: Array.from(S.levelH).map((h) => q(h / P.terH)), key: P.chainKey }; };
(async () => {
  const run = async (mode, path, mutate) => { const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    if (mutate) await ev(() => { const T = window.EVO.roomTypes; T.CHAIN_KEY = T.CHAIN_KEY.filter((k) => k !== 'terH'); });
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click('#examples button[data-id="real_balanced"]'); await a.idle();
    const sel = async (m) => { await page.selectOption('#dioChain', m); await a.idle(); };
    if (path === 'direct') { await sel('off'); await a.slider('terH', 3); await a.idle(); await sel(mode); } else { await sel(mode); await a.slider('terH', 3); await a.idle(); }
    const r = await ev(FP); await a.browser.close(); return r; };
  const same = (x, y) => JSON.stringify(x.plan) === JSON.stringify(y.plan) && JSON.stringify(x.levels) === JSON.stringify(y.levels);
  let fails = 0; const ok = (name, c, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!c) fails++; };
  for (const mode of ['m2', 'm1', 'corr']) {
    const d = await run(mode, 'direct', false), m = await run(mode, 'moved', false), top = (r) => JSON.stringify(r.plan.filter((q) => q[6] !== null).map((q) => q[6]));
    ok(`${mode}: the plan and the level heights after terH 1 -> 3 equal those of a session that always recomputed the plan (pocket tops / terH ${top(m)}, ${m.levels.length} levels)`, same(d, m), `direct tops ${top(d)} levels ${d.levels.length}`);
    if (mode !== 'corr') ok(`${mode}: the pocket tops are 3 terH-units tall relative to the terrace scale, not the 1 of the old plan`, m.plan.filter((q) => q[6] !== null).every((q) => q[6] > 1.5), top(m)); // (Corridor pocket tops are relative to the platform of each Diorama: the equality above is its check)
    if (mode === 'm2') { const bad = await run(mode, 'moved', true); ok('MUTATION terH removed from the key (M2): the check FAILS (the plan after terH 1 -> 3 is the stale one)', !same(d, bad), `stale tops ${top(bad)} levels ${bad.levels.length}`); } }
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
