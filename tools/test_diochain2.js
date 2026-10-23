/* Diorama in the chain view, DAC v2 PR C2 (D31): the drawn route is the chain, the rank and the type, the gap, the pocket profiles (real map built like the viewer: tools/real_pack.js).
     node tools/test_diochain2.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T = E.roomTypes; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const src = fs.readFileSync(path.join(__dirname, 'test_roomtypes.js'), 'utf8'), P0 = eval('(' + src.match(/const P0 = (\{[^;]*\});/)[1] + ')');
const EX = { balanced: { P: { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[122, 201]], fin: [47, 75] }, chain5: { P: { ...P0, terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[87, 136]], fin: [25, 128] } };
const setup = (pack, ex, k, extra) => { const P = { ...ex.P, pocketYaw: 45, ...(extra || {}) }, S0 = E.shape(pack, P, null), at = (xy) => (xy[1] - S0.oy) * S0.W + xy[0] - S0.ox, st = at(ex.stake), fin = at(ex.fin), subs = k ? ex.subs.map(at) : [];
  const ch = T.roomChain(S0, P, st, fin, undefined, subs), tp = T.chainTypes(S0, P, ch, 'v164', st, fin), goals = ch.goalTiles && ch.goalTiles.length ? ch.goalTiles : [st, fin], ids = [...new Set(ch.rooms)].sort((a, b) => a - b);
  const typeOf = (r) => (tp.map.has(r) ? tp.map.get(r).type : (S0.types.rooms.get(r) || {}).type); return { P, S0, ch, tp, goals, ids, typeOf }; };
const build = (pack, c, mode) => { const PP = { ...c.P, dioChain: mode, chainIds: c.ids, chainSeqs: [c.ch.pieces], chainGoals: c.goals, chainBlocked: c.ch.blocked, chainExtra: 3 }; const dp = T.dioPlan(c.S0, PP, { chainIds: c.ids, pieces: c.ch.pieces, goals: c.goals, typeOf: c.typeOf }), tmap = new Map(c.tp.map); for (const r of dp.demoted) tmap.set(r, { type: T.ASCENSION, up: false }); PP.chainTypes = tmap; PP.dioPlan = dp; return { PP, dp, S: E.shape(pack, PP, null) }; };
(async () => {
  const { mk } = await require('./real_pack.js').load(E), pack = mk(), out = {};
  for (const [name, ex] of Object.entries(EX)) for (const k of [1, 0]) {
    const c = setup(pack, ex, k); out[`${name}-K${k}`] = c;
    for (const mode of ['off', 'm2']) {
      const b = build(pack, c, mode), S = b.S, tag = `${name} K${k} ${mode}`; c['b_' + mode] = b;
      const regionBefore = Int32Array.from(S.region), cr = T.chainRoute(S, b.PP), distinct = new Set(c.ch.pieces).size;
      ok(`${tag}: the chain route exists (no failure)`, cr && !cr.fail, cr && cr.why);
      if (!cr || cr.fail) continue;
      const pc = T.pieces(S, b.PP), onChain = new Set(c.ch.pieces), items = mode === 'm2' ? b.dp.items.filter((q) => q.eligible) : [], flat = new Set(), land = new Set(), extra = new Set();
      for (const it of items) { for (const t of it.src) flat.add(t); for (const t of it.landing) land.add(t); for (const t of it.dst) extra.add(t); for (const t of it.bridge.inner) extra.add(t); for (const t of it.bridge.lat) extra.add(t); }
      const allowed = (t) => (onChain.has(pc.id[t]) && (!flat.has(t) || land.has(t))) || extra.has(t);
      ok(`${tag}: pieces visited by the drawn route == the pieces of the chain (${cr.pieces} of ${distinct})`, cr.pieces === distinct && cr.chainPieces === distinct, [cr.pieces, distinct]);
      ok(`${tag}: 0 route tiles on non-chain ground (flattened) or on the flattened old footprint`, cr.path.every(allowed) && cr.path.every((t) => !(S.chainGrey && S.chainGrey[t])), cr.path.filter((t) => !allowed(t)).length);
      ok(`${tag}: the goals are reached in order (stake -> sub-objectives -> final goal), each at its own tile`, cr.goalIdx.every((v, i, a) => v >= 0 && (!i || a[i - 1] < v)) && cr.goalIdx.every((v, j) => cr.path[v] === cr.goals[j]), cr.goalIdx);
      ok(`${tag}: consecutive route tiles are joined by the walking graph`, (() => { const nb = E.walkGraph(S, b.PP); for (let i = 0; i + 1 < cr.path.length; i++) if (!nb(cr.path[i]).slice().includes(cr.path[i + 1])) return false; return true; })());
      ok(`${tag}: reading the route changes nothing (regions, walking graph)`, S.region.every((v, i) => v === regionBefore[i]));
    }
  }
  // the OLD drawn route (E.route) went through the grey ground in Balanced: the instrument finds it (the user's 39 / 65 tiles)
  { const c = out['balanced-K1'], b = c.b_off, S = b.S, gs = c.goals, r1 = E.route(S, b.PP, gs[1], gs[0]), r2 = E.route(S, b.PP, gs[2], gs[0]);
    ok('Balanced K = 1, the old shortest route crossed the flattened ground (39 and 65 tiles on route 1 and 2) and skipped pieces: this is the defect the chain route removes', r1.filter((t) => S.chainGrey[t]).length === 39 && r2.filter((t) => S.chainGrey[t]).length === 65, [r1.filter((t) => S.chainGrey[t]).length, r2.filter((t) => S.chainGrey[t]).length]); }
  global.__out = out; if (process.argv[2] === 'probe') process.exit(0);
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
