/* Rooms on: every connection of the spanning tree (global, and the patch connections of a slice) is walkable end to end in the FINAL walking graph (the one of
   E.route), or is named as not walkable. Real map data/samples/skeleton_heightmap_256.png.
     node tools/test_conns_rooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
(async () => {
  const img = await E.decodePng(fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'))), W = img.width, H = img.height;
  const mk = () => ({ name: 'skeleton', width: W, height: H, elevation: Float32Array.from(img.channels[0], (v) => v / img.max * 1000), masks: {}, markers: [], fields: {} });
  const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, rooms: true };
  const base = E.shape(mk(), P, null), RL = base.rooms;
  const withPatch = (() => { const ids = RL.rooms.map((r) => r.id).slice(0, 14); for (const a of ids) for (const b of ids) if (a < b) { const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) m[i] = RL.room[i] === a || RL.room[i] === b ? 1 : 0; const su = E.rooms.sliceUse(RL, W, H, m); if (su.patch > 0 && su.kept > 0) return [a, b]; } return null; })();
  ok('the test has a two-room slice with patch connections', !!withPatch, withPatch);
  for (const [label, spec] of [['whole map', null], ['room 8', { rooms: [8], margin: 6 }], ['two rooms with patch connections', { rooms: withPatch, margin: 6 }]]) {
    const S = E.shape(mk(), P, spec), info = S.connInfo, mi = (i) => (((i / S.W) | 0) + S.oy) * S.mapW + (i % S.W) + S.ox;
    ok(`${label}: the info counts every connection once`, info.ok + info.recomputed + info.unresolved === info.total && info.total === S.conns.length && info.total > 0, JSON.stringify(info));
    // independent step test on the final stairs
    const n = S.n, key = (a, b) => (a < b ? a * n + b : b * n + a), links = new Set(), adj = (a, b) => Math.abs(a - b) === S.W || (Math.abs(a - b) === 1 && ((a / S.W) | 0) === ((b / S.W) | 0));
    for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) { let prev = st.bottom[ci]; for (const step of st.steps) { links.add(key(prev, step.tiles[ci])); prev = step.tiles[ci]; } links.add(key(prev, st.top[ci])); if (ci > 0) for (const step of st.steps) if (adj(step.tiles[ci - 1], step.tiles[ci])) links.add(key(step.tiles[ci - 1], step.tiles[ci])); }
    const blocked = (i) => S.block[i] || (!S.carved[i] && S.rooms.forb[mi(i)]);
    const stepOK = (u, v) => !blocked(u) && !blocked(v) && (S.carved[u] || S.carved[v] ? links.has(key(u, v)) : S.ter[u] === S.ter[v] && S.rooms.pass(mi(u), mi(v)));
    let badSteps = 0, noRoute = 0, walked = 0;
    for (const c of S.conns) {
      const a = c.path[0], b = c.path[c.path.length - 1], r = E.route(S, P, a, b);
      if (c.status === 'unresolved') { if (r) badSteps++; continue; }          // named as not walkable: there must really be no route
      walked++; if (!r) noRoute++;
      for (let k = 1; k < c.path.length; k++) if (!stepOK(c.path[k - 1], c.path[k])) { badSteps++; break; } // the stored path itself is walkable
    }
    ok(`${label}: every kept connection is walkable end to end (path steps and E.route), the others have no route`, badSteps === 0 && noRoute === 0 && walked > 0, [badSteps, noRoute, walked]);
    ok(`${label}: at most 2 connections stay unresolved, each named with a reason and a place`, info.unresolved <= 2 && info.list.length === info.unresolved && info.list.every((u) => u.reason && u.at && u.from && u.to), JSON.stringify(info.list));
    // the cores of each tree end up in one walkable region
    const par = new Map(), find = (v) => { while (par.has(v) && par.get(v) !== v) v = par.get(v); return v; };
    const nodes = new Set(); for (const c of S.conns) if (c.status !== 'unresolved') { const a = c.path[0], b = c.path[c.path.length - 1]; nodes.add(a); nodes.add(b); }
    for (const t of nodes) par.set(t, t); for (const c of S.conns) if (c.status !== 'unresolved') par.set(find(c.path[0]), find(c.path[c.path.length - 1]));
    const regionOf = new Map(); let split = 0; for (const t of nodes) { const r = find(t), reg = S.region[t]; if (!regionOf.has(r)) regionOf.set(r, reg); else if (regionOf.get(r) !== reg) split++; }
    ok(`${label}: the cores of every tree are in a single walkable region`, split === 0 && nodes.size > 4, [split, nodes.size]);
  }
  // power: without the fix connections are lost
  const old = E.shape(mk(), { ...P, rampKeep: false }, null);
  ok('without the fix (rampKeep false) the bug is there: paths cut sideways and connections without any route', old.connInfo.noRoute >= 5 && old.connInfo.reasons['path crosses a ramp sideways'] >= 5, JSON.stringify(old.connInfo));
  ok('with the fix some ramps use a variant (shallower or narrower) and most keep the original shape', base.stairInfo.variantsChanged > 5 && base.stairInfo.variants[0] > base.stairInfo.variantsChanged, JSON.stringify(base.stairInfo.variants));
  const off = E.shape(mk(), { ...P, rooms: false }, null); ok('rooms off: no connections, no variants', off.conns === undefined && off.connInfo === undefined && off.stairInfo.variants.length === 1);
  // terraces 3-8 on the real map and ramp depth 1-4 (5 terraces): the only connection without route that may stay is a gate pair whose ramp did not fit
  const DID = 'gate pair whose ramp did not fit', reasonsOf = (S) => Object.keys(S.connInfo.unresolvedReasons);
  const checkTer = (label, Pv) => {
    const S = E.shape(mk(), Pv, null), info = S.connInfo, RLv = S.rooms, n = S.n, key = (a, b) => (a < b ? a * n + b : b * n + a);
    ok(`${label}: no unresolved connection except 'ramp did not fit'`, reasonsOf(S).every((r) => r === DID), JSON.stringify(info.unresolvedReasons));
    const unres = S.conns.filter((c) => c.status === 'unresolved');
    ok(`${label}: each of them names a pair whose ramp WAS tried and failed (site dropped, no ramp placed)`, unres.every((c) => { const site = S.passes.find((x) => key(x.a, x.b) === key(c.fail[0], c.fail[1])); return site && site.dropped === true && !S.stairs.some((r) => r.site === site); }), unres.length);
    ok(`${label}: no unresolved connection has a route in the final graph`, unres.every((c) => !E.route(S, Pv, c.path[0], c.path[c.path.length - 1])));
    ok(`${label}: retries broke no other path`, S.retryBroke === 0, S.retryBroke);
    // scan start: the group with the MOST cores under the rooms passability (independent computation)
    const alive = RLv.alive.filter((c) => c.center >= 0), seen = new Set(), sizes = [];
    for (const c of alive) { if (seen.has(c)) continue; const d = E.rooms.bfs(S.mapW, S.mapH, c.center, RLv.pass, false).dist, m = alive.filter((o) => o === c || o.tiles.some((t) => d[t] >= 0)); m.forEach((o) => seen.add(o)); sizes.push(m.length); }
    const reach = alive.filter((c) => c.tiles.some((t) => RLv.scan[t] >= 0)).length;
    ok(`${label}: the scan starts from the group with the most cores (${Math.max(...sizes)} of ${alive.length}, ${sizes.length} groups)`, reach === Math.max(...sizes) && RLv.startGroups[0] === Math.max(...sizes), [reach, sizes.join(',')]);
    return S;
  };
  for (const T of [3, 4, 5, 6, 7, 8]) checkTer(`${T} terraces`, { ...P, terraces: T });
  for (const D of [1, 2, 3, 4]) checkTer(`5 terraces, ramp depth ${D}`, { ...P, rampDepth: D });
  // power: without the retry (P.noUnmerge) other reasons remain at 6 terraces; the old start core (first living core) reaches fewer cores at 8
  ok('mutation: without the retry (noUnmerge) some connection stays unresolved for another reason', reasonsOf(E.shape(mk(), { ...P, terraces: 6, noUnmerge: true }, null)).some((r) => r !== DID));
  { const a = E.shape(mk(), { ...P, terraces: 8 }, null).rooms, b = E.shape(mk(), { ...P, terraces: 8, rScanFirst: true }, null).rooms, cnt = (R) => R.alive.filter((c) => c.tiles.some((t) => R.scan[t] >= 0)).length;
    ok('mutation: with 8 terraces the old start (first living core) reaches fewer cores than the largest group', cnt(b) < cnt(a), [cnt(a), cnt(b)]); }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
