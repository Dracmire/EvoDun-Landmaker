/* Diorama in the chain view (DAC v2 PR C, D30): eligibility, the translated footprint, the landing, the bridge, the pocket and the walking, on the real map built like the viewer (tools/real_pack.js).
     node tools/test_diochain.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T = E.roomTypes; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const src = fs.readFileSync(path.join(__dirname, 'test_roomtypes.js'), 'utf8'), P0 = eval('(' + src.match(/const P0 = (\{[^;]*\});/)[1] + ')');
const EX = { balanced: { P: { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[122, 201]], fin: [47, 75] }, chain5: { P: { ...P0, terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[87, 136]], fin: [25, 128] } };
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const out = {};
  for (const [name, ex] of Object.entries(EX)) for (const k of [1, 0]) {
    const P = { ...ex.P, pocketYaw: 45 }, S0 = E.shape(mk(), P, null), at = (xy) => (xy[1] - S0.oy) * S0.W + (xy[0] - S0.ox), st = at(ex.stake), fin = at(ex.fin), subs = k ? ex.subs.map(at) : [];
    const ch = T.roomChain(S0, P, st, fin, undefined, subs), tp = T.chainTypes(S0, P, ch, 'v164', st, fin), goals = ch.goalTiles && ch.goalTiles.length ? ch.goalTiles : [st, fin];
    const typeOf = (r) => (tp.map.has(r) ? tp.map.get(r).type : (S0.types.rooms.get(r) || {}).type), ids = [...new Set(ch.rooms)].sort((a, b) => a - b);
    for (const mode of ['m2', 'm1']) {
      const PP = { ...P, dioChain: mode, chainIds: ids, chainSeqs: [ch.pieces], chainBlocked: ch.blocked, chainExtra: 3 };
      const dp = T.dioPlan(S0, PP, { chainIds: ids, pieces: ch.pieces, goals, typeOf }), tmap = new Map(tp.map); for (const r of dp.demoted) tmap.set(r, { type: T.ASCENSION, up: false });
      PP.chainTypes = tmap; PP.dioPlan = dp;
      const t0 = Date.now(), S1 = E.shape(mk(), PP, null), ms = Date.now() - t0;
      out[`${name}-K${k}-${mode}`] = { dp, S1, S0, ch, goals, ms, PP, tp };
      console.log(name, 'K' + k, mode, 'eligible', dp.eligible.join(','), 'demoted', dp.why.map((d) => d.room + ':' + d.why).join(' | '), 'info', JSON.stringify(S1.dioInfo), ms + ' ms');
    }
  }

  const terH = 1;
  const get = (key) => out[key], base = {};
  for (const key of Object.keys(out)) { const o = out[key], PPoff = { ...o.PP, dioChain: 'off' }; base[key] = E.shape(mk(), PPoff, null); } // the same chain with the option Off (the plan is still in P)
  const hOf = (S, i) => S.levelH[S.fine[i]];
  // ---- the option Off draws today's chain view (no pocket, no role, no move) even with a plan in P
  for (const key of Object.keys(out)) ok(`${key}: with the option Off the plan is ignored (no S.dioRole, no S.dioInfo)`, !base[key].dioRole && !base[key].dioInfo && !base[key].dioMove);
  { const o = get('balanced-K1-m2'), S0b = E.shape(mk(), { ...o.PP, dioChain: undefined, dioPlan: undefined }, null), S2 = base['balanced-K1-m2'];
    ok('Off = a shape built without any Diorama key: same levels, same level of every tile', S0b.levelH.length === S2.levelH.length && S0b.fine.every((v, i) => v === S2.fine[i]) && S0b.levelH.every((v, i) => v === S2.levelH[i])); }
  // ---- eligibility (cap 30, user's decision 2026-10-23)
  const el = (key) => get(key).dp.eligible.slice().sort((a, b) => a - b).join();
  ok('Balanced types K = 1 (M2 and M1): the eligible Dioramas are rooms 7, 64 and 66; the others are drawn as Ascension', el('balanced-K1-m2') === '7,64,66' && el('balanced-K1-m1') === '7,64,66', [el('balanced-K1-m2'), el('balanced-K1-m1')]);
  ok('Balanced types K = 0: rooms 7, 20 and 66', el('balanced-K0-m2') === '7,20,66', el('balanced-K0-m2'));
  ok('Chain 5 terraces (K = 1 and K = 0): no Diorama qualifies (rooms 48 and 6 are beyond the cap and their straight bridge crosses the chain; room 10 has 25 % free perimeter)', el('chain5-K1-m2') === '' && el('chain5-K0-m2') === '' && el('chain5-K1-m1') === '', [el('chain5-K1-m2'), el('chain5-K0-m2')]);
  for (const key of ['balanced-K1-m2', 'balanced-K1-m1', 'chain5-K1-m2', 'chain5-K0-m2']) {
    const dp = get(key).dp;
    ok(`${key}: no Diorama under 50 % free perimeter is eligible, and each one under it is listed as demoted with the reason`, dp.items.every((q) => (q.perim >= 50 || !q.eligible)) && dp.items.filter((q) => q.perim < 50).every((q) => dp.demoted.includes(q.room) && /free perimeter/.test(q.why)));
    ok(`${key}: the minimum shift of every eligible Diorama is within the cap (${dp.cap}) and no eligible bridge crosses a chain room or an earlier pocket`, dp.items.filter((q) => q.eligible).every((q) => q.shiftM2 <= dp.cap && q.bridgeCross.chain === 0 && q.bridgeCross.pocket === 0));
    ok(`${key}: a Diorama beyond the cap is demoted (no fallback)`, dp.items.filter((q) => q.perim >= 50 && q.shiftM2 > dp.cap).every((q) => !q.eligible && /cap|bridge/.test(q.why)));
  }
  { const o = get('chain5-K1-m2'), dp = T.dioPlan(o.S0, { ...o.PP, dioCap: 300 }, { chainIds: o.PP.chainIds, pieces: o.ch.pieces, goals: o.goals, typeOf: (r) => (o.tp.map.has(r) ? o.tp.map.get(r).type : (o.S0.types.rooms.get(r) || {}).type) });
    const q6 = dp.items.find((q) => q.room === 6);
    ok('Chain 5 K = 1, room 6 with the cap lifted: its straight bridge at the minimum shift (38 tiles) still crosses 10 chain-room tiles, so it stays demoted: the cap would be 30 whatever the 40 rule says', q6 && q6.shiftM2 > 30 && q6.shiftM2 <= 40 && q6.bridgeCross.chain > 0 && !q6.eligible, q6 && JSON.stringify([q6.shiftM2, q6.bridgeCross, q6.why])); }
  // ---- the geometry of the eligible Dioramas, per key
  for (const key of ['balanced-K1-m2', 'balanced-K1-m1', 'balanced-K0-m2']) {
    const o = get(key), S1 = o.S1, S2 = base[key], S0 = o.S0, dp = o.dp, W = S1.W, mode = dp.mode, items = dp.items.filter((q) => q.eligible), chainRooms = new Set(o.PP.chainIds);
    ok(`${key}: ${items.length} Dioramas moved, levels added, applied`, items.length > 0 && S1.dioInfo && S1.dioInfo.footprint > 0 && S1.dioInfo.levelsAdded > 0, JSON.stringify(S1.dioInfo));
    for (const it of items) {
      const tag = `${key} room ${it.room}`, dx = it.dst[0] % W - it.src[0] % W, dy = ((it.dst[0] / W) | 0) - ((it.src[0] / W) | 0);
      if (mode === 'm2') ok(`${tag}: M2 the footprint keeps its shape (every tile translated by the same shift; ${it.dst.length} of ${it.tiles} tiles, the rest clipped by the window, at most 10 %)`, it.dst.every((j, k) => j % W - it.src[k] % W === dx && ((j / W) | 0) - ((it.src[k] / W) | 0) === dy) && it.dst.length >= 0.9 * it.tiles);
      else ok(`${tag}: M1 the footprint is translated to the centre of its region and clipped to it (kept ${it.kept} %)`, it.dst.every((j, k) => j % W - it.src[k] % W === dx && ((j / W) | 0) - ((it.src[k] / W) | 0) === dy) && it.kept >= 60 && it.kept <= 100, it.kept);
      const dz = (it.high ? 2 : -2) * terH;
      ok(`${tag}: the footprint keeps its internal relative heights (source + ${it.high ? '+2' : '-2'} terraces)`, it.dst.every((j, k) => Math.abs(hOf(S1, j) - (hOf(S2, it.src[k]) + dz)) < 0.02), it.dst.slice(0, 3).map((j, k) => [hOf(S1, j), hOf(S2, it.src[k]) + dz]));
      ok(`${tag}: the landing keeps its heights (the same level as without the option)`, it.landing.every((t) => hOf(S1, t) === hOf(S2, t)), it.landing.filter((t) => hOf(S1, t) !== hOf(S2, t)).length);
      ok(`${tag}: the landing is colour-coded as transit (dioRole 3) and the bridge as 4`, it.landing.every((t) => S1.dioRole[t] === 3 || S1.dioRole[t] === 1) && it.bridge.inner.every((t) => S1.dioRole[t] === 4));
      ok(`${tag}: the bridge lies on free ground (no tile of a chain room, but the old footprint) and the pocket on free ground only (M1: plus the old footprint minus the landing)`, [...it.bridge.inner, ...it.bridge.lat].every((t) => !chainRooms.has(S0.roomMap[t]) || S0.roomMap[t] === it.room) && it.pocket.every((t) => !chainRooms.has(S0.roomMap[t]) || (mode === 'm1' && S0.roomMap[t] === it.room)));
      const nb = E.walkGraph(S1, o.PP), nbl = (i) => nb(i).slice();
      ok(`${tag}: the pocket is not walkable (blocked, no walking step into it, no region)`, it.pocket.every((t) => S1.block[t] === 1 && nbl(t).length === 0 && S1.region[t] < 0) && it.pocket.every((t) => { const x = t % W, y = (t / W) | 0; return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => { const j = (y + b) * W + x + a; return x + a < 0 || x + a >= W || j < 0 || j >= S1.n || !nbl(j).includes(t); }); }));
      const reach = (a, b) => { const seen = new Set([a]), q = [a]; for (let h = 0; h < q.length; h++) for (const j of nbl(q[h])) if (!seen.has(j)) { seen.add(j); q.push(j); } return seen.has(b); };
      ok(`${tag}: the bridge is walkable: the landing end reaches the footprint end, and the footprint tiles that were walkable are one region with the landing`, reach(it.bridge.from, it.bridge.to) && it.dst.filter((j, k) => S2.region[it.src[k]] >= 0).every((j) => S1.region[j] === S1.region[it.bridge.from]));
      ok(`${tag}: ${it.pocket.length} pocket tiles (wanted ${it.pocketWanted}); the pocket is ${it.high ? 'stepped flanks (High)' : 'water (Low)'}`, it.pocket.length > 0 && it.pocket.every((t) => S1.dioRole[t] === 2) && (it.high || it.pocket.every((t) => S1.levelMeta[S1.fine[t]].water)), [it.pocket.length, it.pocketWanted]);
    }
    // goals inside a moved Diorama move with it; the routes from the stake still reach every goal
    const gIn = items.flatMap((it) => it.goals.map((g) => [it, g]));
    for (const [it, g] of gIn) ok(`${key} room ${it.room}: goal ${g} (${g === 0 ? 'stake' : g === o.goals.length - 1 ? 'final' : 'sub'}) moved with the footprint (variant b)`, S1.dioMove.has(o.goals[g]) && it.dst.includes(S1.dioMove.get(o.goals[g])));
    const mapped = o.goals.map((t) => (S1.dioMove.has(t) ? S1.dioMove.get(t) : t));
    ok(`${key}: the walking routes still reach every goal from the stake (the objectives are reached through the bridge when they moved)`, mapped.slice(1).every((t) => !!E.route(S1, o.PP, mapped[0], t)), mapped.slice(1).map((t) => !!E.route(S1, o.PP, mapped[0], t)));
    // nothing else changed: tiles outside the old footprints, the footprints, the bridges and the pockets keep their heights
    const touched = new Set(); for (const it of items) { for (const t of it.src) touched.add(t); for (const t of it.dst) touched.add(t); for (const t of it.pocket) touched.add(t); for (const t of it.bridge.inner) touched.add(t); for (const t of it.bridge.lat) touched.add(t); }
    let bad = 0; for (let i = 0; i < S1.n; i++) if (!touched.has(i) && !(S1.void && S1.void[i]) && hOf(S1, i) !== hOf(S2, i)) bad++;
    ok(`${key}: no tile outside the footprints, bridges and pockets changed height`, bad === 0, bad);
    ok(`${key}: the number of levels grows by the added ones only (${S1.dioInfo.levelsAdded})`, S1.levelH.length === S2.levelH.length + S1.dioInfo.levelsAdded);
  }
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
