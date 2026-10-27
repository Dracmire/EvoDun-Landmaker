/* The KEY of the chain and of the Diorama plan (PR E0, src/roomtypes.js T.CHAIN_KEY / T.chainParamKey, used by chainSig of src/ui.js).
   Before PR E0 the key held only the rooms layer, the ramp parameters and (Corridor only) terH, so after a change of terH with M1 / M2 on the viewer kept the plan of the old heights (stale plan: the pocket relief of the old terH on the new terraces).
     node tools/test_chainkey.js
   (1) COMPLETENESS: every `P.<name>` read of shape.js, rooms.js, roomtypes.js and pocket.js (comments stripped) is a key field, an audited NOT-key field with its reason, or a `dio*` hook (part of the key by rule): a new parameter forces a decision.
   (2) SESSION: the plan a session ends with after terH 1 -> 3 (and 1 -> 6), replanning only when the key changes (what chainSig does in the viewer), has the same hash as the plan of a session built directly at the final terH, for M1, M2 and Corridor.
   (3) PROPERTY: changing a NOT-key field leaves the plan hash unchanged; changing a key field changes the key (and, for the height parameters, the plan hash: the key is needed).
   (4) MUTATION: terH dropped from the key -> the session check of (2) FAILS (named below); a height parameter dropped likewise.
   The plan hash is recomputed here from the plan items (rooms, steps, shifts, footprints, the pocket heights), never taken from the planner's own summary. */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'modes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T = E.roomTypes; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const src = fs.readFileSync(path.join(__dirname, 'test_roomtypes.js'), 'utf8'), P0 = eval('(' + src.match(/const P0 = (\{[^;]*\});/)[1] + ')');
const EX = { balanced: { P: { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[122, 201]], fin: [47, 75] }, chain5: { P: { ...P0, terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[87, 136]], fin: [25, 128] } };
const setup = (pack, ex, k, over) => { const P = { ...ex.P, pocketYaw: 45, ...(over || {}) }, S0 = E.shape(pack, P, null), at = (xy) => (xy[1] - S0.oy) * S0.W + xy[0] - S0.ox, st = at(ex.stake), fin = at(ex.fin), subs = k ? ex.subs.map(at) : [];
  const ch = T.roomChain(S0, P, st, fin, undefined, subs); if (ch.fail) return null; const tp = T.chainTypes(S0, P, ch, 'v164', st, fin), goals = ch.goalTiles && ch.goalTiles.length ? ch.goalTiles : [st, fin], ids = [...new Set(ch.rooms)].sort((a, b) => a - b);
  const typeOf = (r) => (tp.map.has(r) ? tp.map.get(r).type : (S0.types.rooms.get(r) || {}).type); return { P, S0, ch, tp, goals, ids, typeOf }; };
const PPof = (c, mode) => ({ ...c.P, dioChain: mode, chainIds: c.ids, chainSeqs: [c.ch.pieces], chainGoals: c.goals, chainBlocked: c.ch.blocked, chainExtra: 3 });
const planOf = (c, mode) => T.dioPlan(c.S0, PPof(c, mode), { chainIds: c.ids, pieces: c.ch.pieces, goals: c.goals, typeOf: c.typeOf });
const fnv = (a) => crypto.createHash('sha256').update(a).digest('hex').slice(0, 16);
const planHash = (dp) => fnv(JSON.stringify(dp.items.map((q) => [q.room, !!q.eligible, q.step || '', q.type || '', q.ring === undefined ? '' : q.ring, q.shift === undefined ? '' : q.shift, q.dst ? q.dst.length : 0, q.landing ? q.landing.length : 0, (q.bridges || (q.bridge ? [q.bridge] : [])).map((b) => (b.inner ? b.inner.length : 0) + ':' + b.from + ':' + b.to), q.prof ? [q.prof.ok, q.prof.top, (q.prof.heights || []).map((x) => +x.toFixed(6)), (q.prof.fpH || []).map((x) => +x.toFixed(6))] : null])));
// what the viewer does at every step: build the whole shape at the current settings; if the key changed, recompute the chain and the plan, else keep the plan of the earlier key
const session = (pack, ex, k, mode, steps) => { let prevKey = null, plan = null, last = null;
  for (const over of steps) { const c = setup(pack, ex, k, over), key = T.chainParamKey(PPof(c, mode)); if (key !== prevKey) { plan = planOf(c, mode); prevKey = key; } last = c; }
  return { plan, hash: planHash(plan), last }; };
const withKey = (keys, fn) => { const old = T.CHAIN_KEY; T.CHAIN_KEY = keys; try { return fn(); } finally { T.CHAIN_KEY = old; } };

(async () => {
  // ---- (1) completeness of the audit
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  const reads = new Map(); for (const f of ['shape', 'rooms', 'roomtypes', 'pocket']) for (const m of strip(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8')).matchAll(/\bP\.([A-Za-z_]\w*)/g)) { if (!reads.has(m[1])) reads.set(m[1], new Set()); reads.get(m[1]).add(f); }
  const KEY = new Set(T.CHAIN_KEY), NOT = new Set(Object.keys(T.CHAIN_NOT_KEY)), unlisted = [...reads.keys()].filter((k) => !KEY.has(k) && !NOT.has(k) && !/^dio/.test(k)).sort();
  ok(`COMPLETENESS: every P.<name> read of shape.js, rooms.js, roomtypes.js and pocket.js (${reads.size} names) is a key field, an audited NOT-key field or a dio* hook`, unlisted.length === 0, 'unlisted: ' + unlisted.join(', '));
  ok('COMPLETENESS: no field is both a key field and a NOT-key field', [...KEY].every((k) => !NOT.has(k)));
  ok('COMPLETENESS: every NOT-key field carries its reason', Object.values(T.CHAIN_NOT_KEY).every((r) => typeof r === 'string' && r.length > 10));
  ok('the key of a bare parameter bag is a string and changes with terH, and with a test hook (dioMin)', (() => { const a = T.chainParamKey({ terH: 1 }), b = T.chainParamKey({ terH: 3 }), c = T.chainParamKey({ terH: 1, dioMin: 4 }); return typeof a === 'string' && a !== b && a !== c && T.chainParamKey({ terH: 1, dioPlan: {}, dioSummary: {} }) === a; })());
  ok('the Cake camera cut puts pocketYaw into the key only when the cut is on', T.chainParamKey({ cakeCut: 'half', pocketYaw: 0 }) !== T.chainParamKey({ cakeCut: 'half', pocketYaw: 45 }) && T.chainParamKey({ cakeCut: 'off', pocketYaw: 0 }) === T.chainParamKey({ cakeCut: 'off', pocketYaw: 45 }));

  const { mk } = await require('./real_pack.js').load(E), pack = mk();
  // ---- (2) the session check: terH 1 -> 3 and 1 -> 6 equal to a session built directly at the final terH, for M1 / M2 (Balanced K = 0) and Corridor (Chain 5 K = 1)
  const SCENES = [['balanced-K0', EX.balanced, 0, ['m1', 'm2']], ['chain5-K1', EX.chain5, 1, ['corr']]]; // scenes with moved Dioramas, so the plan holds pocket heights (Chain 5 K = 0 has none under M1 / M2)
  const sessionCheck = (ex, k, mode, th) => { const direct = session(pack, ex, k, mode, [{ terH: th }]), moved = session(pack, ex, k, mode, [{ terH: 1 }, { terH: th }]); return { ok: moved.hash === direct.hash, direct: direct.hash, moved: moved.hash, planTop: moved.plan.items.filter((q) => q.prof).map((q) => +(q.prof.top / th).toFixed(2)) }; };
  const base = {}; // the checks of the unmodified key, memoized for the mutation below
  for (const [name, ex, k, modes] of SCENES) for (const mode of modes) for (const th of [3, 6]) { const r = sessionCheck(ex, k, mode, th); base[name + mode + th] = r;
    ok(`SESSION ${name} ${mode}: the plan after terH 1 -> ${th} equals the plan of a session built at terH ${th} (hash ${r.direct}; pocket tops / terH ${JSON.stringify(r.planTop)})`, r.ok, r); }
  // ---- (3) property: NOT-key fields leave the plan hash unchanged, key fields change the key
  { const ex = EX.balanced, mode = 'm2', c0 = setup(pack, ex, 0, {}), h0 = planHash(planOf(c0, mode)), cc0 = setup(pack, ex, 0, {}), hCorr = planHash(planOf(cc0, 'corr'));
    const pert = { ascWalls: !c0.P.ascWalls, ascHeight: 2.6, ascCut: 0.3, ascGate: 3, pocket: !c0.P.pocket, pocketFraming: 'auto', pocketHeight: 3.5, pocketYaw: 0 };
    for (const [k, v] of Object.entries(pert)) { const c = setup(pack, ex, 0, { [k]: v }); ok(`PROPERTY NOT-key field ${k} = ${v}: the key is the same and the M2 plan hash is unchanged`, T.chainParamKey(PPof(c, mode)) === T.chainParamKey(PPof(c0, mode)) && planHash(planOf(c, mode)) === h0); }
    { const c = setup(pack, ex, 0, { ascWalls: !c0.P.ascWalls, ascGate: 3, ascHeight: 2.6, pocketYaw: 0 }); ok('PROPERTY NOT-key fields together (Ascension walls, pocket yaw): the Corridor plan hash is unchanged', planHash(planOf(c, 'corr')) === hCorr); }
    const keyPert = { terH: 3, subs: 2, subH: 0.3, climb: 1, spread: 1.5, spreadCentre: 'middle', minSub: 5, pre: 2, terraces: 4, passGap: 12, gateThr: 0.08, gateMin: 4, rGentle: 0.25, roomsMinCore: 60, cake: !c0.P.cake, cakeLayers: 2, anchors: !c0.P.anchors, anchorH: 1, roomsIsoLimit: 200, tread: 1, stairW: 2, rampDepth: 3, stairStyle: 0 };
    const changed = [], same = [], failed = [];
    for (const [k, v] of Object.entries(keyPert)) { ok(`PROPERTY key field ${k} = ${v}: the key changes`, T.chainParamKey({ ...PPof(c0, mode), [k]: v }) !== T.chainParamKey(PPof(c0, mode)));
      const c = setup(pack, ex, 0, { [k]: v }); if (!c) { failed.push(k); continue; } (planHash(planOf(c, mode)) !== h0 ? changed : same).push(k); }
    console.log('info: of the ' + Object.keys(keyPert).length + ' key fields perturbed (M2, Balanced K = 0) the plan hash changes for ' + changed.join(', ') + '; it stays equal (the key is conservative, never wrong) for ' + same.join(', ') + (failed.length ? '; the chain does not exist at ' + failed.join(', ') : ''));
    ok('PROPERTY the height parameters change the plan (the key is needed): terH and subH each change the M2 plan hash (Balanced K = 0; spread has no effect with 3 terraces: its jumps start at two terraces from the centre)', ['terH', 'subH'].every((k) => changed.includes(k)), changed.join(',')); }
  // ---- (4) mutations: the key without terH (or without a height parameter) must make the session check fail
  for (const [name, ex, k, modes] of SCENES) for (const mode of modes) { const r = withKey(T.CHAIN_KEY.filter((x) => x !== 'terH'), () => sessionCheck(ex, k, mode, 3));
    ok(`MUTATION terH dropped from the key (${name} ${mode}): the SESSION check FAILS (the plan after terH 1 -> 3 is the stale one)`, !r.ok && r.direct === base[name + mode + 3].direct, r); }
  { const r = withKey(T.CHAIN_KEY.filter((x) => x !== 'spread'), () => { const direct = session(pack, EX.chain5, 1, 'corr', [{ terH: 1, spread: 2 }]), moved = session(pack, EX.chain5, 1, 'corr', [{ terH: 1 }, { terH: 1, spread: 2 }]); return moved.hash === direct.hash; });
    ok('MUTATION spread dropped from the key (Chain 5 K = 1, Corridor, 5 terraces): the session check FAILS (spread 1 -> 2 keeps the old plan)', r === false); }
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
