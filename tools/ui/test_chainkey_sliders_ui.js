/* The key of the chain and of the Diorama plan, moved through the REAL SLIDERS (PR E0b; the terH case is tools/ui/test_chainkey_ui.js, the node test tools/test_chainkey.js).
   For each height / sub-terrace parameter: in the normal session (mode 2, the Diorama option set, then the slider moved) the plan fingerprint (rooms, steps, shifts, footprints, pocket tops) and the level heights of the built shape must equal those of a session that
   always recomputed the plan (Diorama option Off, slider, option on); the move must CHANGE the shape (the value is not a no-op: spread has no effect with 3 terraces, subs 3 and climb 1 / 2 are no-ops at the default sub-terrace height, which is why the
   first probe of PR E0 saw "nothing"); and with the field dropped from E.roomTypes.CHAIN_KEY the equality FAILS (the stale plan).
     NODE_PATH=$(npm root -g) node tools/ui/test_chainkey_sliders_ui.js [--only <field>] */
const { open } = require('./common');
const CASES = [ // field, value, example, Diorama option
  ['subs', 2, 'real_balanced', 'm2'], ['climb', 3, 'real_balanced', 'm2'], ['subH', 0.1, 'real_balanced', 'm2'], ['spread', 2, 'real_chain5', 'corr']];
const FP = () => { const e = window.__evo, P = e.P, S = e.S(), dp = P.dioPlan; if (!dp) return null; const q = (x) => +x.toFixed(4);
  return { plan: dp.items.map((it) => [it.room, !!it.eligible, it.step || '', it.type || '', it.shift === undefined ? '' : it.shift, it.dst ? it.dst.length : 0, it.prof ? q(it.prof.top / P.terH) : null]), levels: Array.from(S.levelH).map((h) => q(h / P.terH)) }; };
(async () => {
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const run = async (field, value, ex, mode, path, mutate) => { const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
    if (mutate) await ev((f) => { const T = window.EVO.roomTypes; T.CHAIN_KEY = T.CHAIN_KEY.filter((k) => k !== f); }, field);
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await page.click(`#examples button[data-id="${ex}"]`); await a.idle();
    const sel = async (m) => { await page.selectOption('#dioChain', m); await a.idle(); };
    let pre = null;
    if (path === 'direct') { await sel('off'); await a.slider(field, value); await a.idle(); await sel(mode); } else { await sel(mode); pre = await ev(FP); await a.slider(field, value); await a.idle(); }
    const r = await ev(FP); await a.browser.close(); return { r, pre }; };
  const eq = (x, y) => JSON.stringify(x.plan) === JSON.stringify(y.plan) && JSON.stringify(x.levels) === JSON.stringify(y.levels);
  let fails = 0; const ok = (name, c, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!c) fails++; };
  for (const [field, value, ex, mode] of CASES) { if (only && only !== field) continue;
    const d = await run(field, value, ex, mode, 'direct', false), m = await run(field, value, ex, mode, 'moved', false);
    ok(`${field} = ${value} (${ex}, ${mode}): the move changes the shape (the level heights differ from those before the move: ${m.pre.levels.length} -> ${m.r.levels.length} levels)`, JSON.stringify(m.pre.levels) !== JSON.stringify(m.r.levels));
    ok(`${field} = ${value} (${ex}, ${mode}): through the real slider the plan and the level heights equal those of a session that always recomputed the plan`, eq(d.r, m.r), `direct levels ${d.r.levels.length}, moved ${m.r.levels.length}`);
    if (process.argv.includes('--nomut')) continue; // (an older tree has no CHAIN_KEY: used to show the bug on the old key)
    const bad = await run(field, value, ex, mode, 'moved', true);
    ok(`MUTATION ${field} dropped from the key (${ex}, ${mode}): the check FAILS (the plan after the move is the stale one)`, !eq(d.r, bad.r), `stale levels ${bad.r.levels.length}`); }
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
