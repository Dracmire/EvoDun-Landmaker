/* Stair survival once per shape (PR E1c, `E.stairSurvival` / `E.stairSurvivalKey` in src/tech.js): the cached result equals a fresh computation, a second call is a cache hit (same object, much faster), a change of a contour parameter (A smooth, B radius, C curves preset, the anchor switch)
   gives the result of a fresh computation (the key holds what `loopsOf` reads), and MUTATIONS: the key without `smooth` / `radius` / the preset -> the named check FAILS (a stale coverage after the parameter changed).
     node tools/test_survival_cache.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'curves', 'wallc']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const src = fs.readFileSync(path.join(__dirname, 'test_roomtypes.js'), 'utf8'), P0 = eval('(' + src.match(/const P0 = (\{[^;]*\});/)[1] + ')');
(async () => {
  const { mk } = await require('./real_pack.js').load(E), pack = mk();
  const base = { ...P0, terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120, anchor: false }; // anchor false: the smoothing moves the footprint, so the coverage depends on the contour parameters
  const S = E.shape(pack, base, null); ok(`the scene has stairs (${S.stairs.length})`, S.stairs.length > 20);
  const CASES = [['A', { smooth: 0 }, { smooth: 3 }, 'smooth'], ['B', { radius: 0.9 }, { radius: 2.2 }, 'radius'], ['C', { curves: 'ordered' }, { curves: 'natural' }, 'curves']];
  for (const [t, pa, pb, name] of CASES) {
    const PA = { ...base, ...pa }, PB = { ...base, ...pb }, S1 = E.shape(pack, PA, null);
    const t0 = process.hrtime.bigint(), r1 = E.stairSurvival(S1, PA, t), d1 = Number(process.hrtime.bigint() - t0) / 1e6, t1 = process.hrtime.bigint(), r2 = E.stairSurvival(S1, PA, t), d2 = Number(process.hrtime.bigint() - t1) / 1e6;
    const fresh = E.stairSurvivalCompute(S1, PA, t);
    ok(`${t}: the cached survival equals a fresh computation (coverage ${(fresh.coverage * 100).toFixed(2)} %, ${fresh.n} tiles)`, JSON.stringify(r1) === JSON.stringify(fresh));
    ok(`${t}: the second call is a cache hit: the same object, ${d1.toFixed(1)} ms -> ${d2.toFixed(3)} ms`, r2 === r1 && d2 < d1 / 10 + 0.05);
    const r3 = E.stairSurvival(S1, PB, t), fresh3 = E.stairSurvivalCompute(S1, PB, t);
    ok(`${t}: after ${name} changes the result is the fresh computation for the new value (coverage ${(fresh.coverage * 100).toFixed(2)} -> ${(fresh3.coverage * 100).toFixed(2)} %)`, JSON.stringify(r3) === JSON.stringify(fresh3));
    ok(`${t}: the two parameter values give different coverage (the check is meaningful)`, JSON.stringify(fresh) !== JSON.stringify(fresh3), 'same coverage');
    // MUTATION: the key without the parameter -> the second value reads the first one
    const S2 = E.shape(pack, PA, null), keyOrig = E.stairSurvivalKey; E.stairSurvivalKey = (tech) => 'surv:' + tech; E.stairSurvival(S2, PA, t); const stale = E.stairSurvival(S2, PB, t); E.stairSurvivalKey = keyOrig;
    ok(`MUTATION ${name} dropped from the survival key (${t}): the "fresh value after the change" check FAILS (the cache returns the coverage of the old value)`, JSON.stringify(stale) !== JSON.stringify(fresh3)); }
  ok('the anchor switch is part of the key: with the anchor on the key differs', E.stairSurvivalKey('A', { smooth: 2 }) !== E.stairSurvivalKey('A', { smooth: 2, anchor: false }));
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
