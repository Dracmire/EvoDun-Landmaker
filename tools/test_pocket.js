/* The POCKET of a Diorama room (src/pocket.js): hand-made plans and the real map with the Balanced types preset.
     node tools/test_pocket.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, K = E.pocket; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };

/* ---- the plan on a hand-made fragment (pure) ---- */
{
  const W = 90, H = 90, frag = new Uint8Array(W * H), hf = (i) => 3 + ((i % W) > 40 ? 0.5 : 0); // a 12 x 10 fragment, higher on its left part
  for (let y = 40; y < 50; y++) for (let x = 34; x < 46; x++) frag[y * W + x] = 1;
  const exits = []; for (let y = 40; y < 50; y++) exits.push({ a: y * W + 45, dx: 1, dy: 0 }); // a wide exit to the east
  for (let x = 34; x < 38; x++) exits.push({ a: 49 * W + x, dx: 0, dy: 1 });                      // and one to the south
  const opts = { ids: [7], jump: 1, sub: 0.22 }, a = K.plan(W, H, frag, hf, exits, opts), b = K.plan(W, H, frag, hf, exits, opts), c = K.plan(W, H, frag, hf, exits, { ...opts, ids: [8] });
  const d = a.disc, r = Math.sqrt(120 / Math.PI), u = [Math.SQRT1_2, Math.SQRT1_2];
  ok('plan: R = 3 r and the disc centre = the centroid moved 1 r toward the camera (Iso, yaw 45)', Math.abs(d.R - 3 * r) < 1e-9 && Math.abs(d.cx - (40 + r * u[0])) < 1e-9 && Math.abs(d.cy - (45 + r * u[1])) < 1e-9 && !d.grown, JSON.stringify(d));
  { // an elongated fragment: its far end is outside 3 r, so R grows until every fragment tile is inside the disc
    const f2 = new Uint8Array(W * H); for (let x = 5; x < 80; x++) for (let y = 44; y < 46; y++) f2[y * W + x] = 1; for (let y = 20; y < 44; y++) f2[y * W + 5] = 1;
    const e = K.plan(W, H, f2, () => 3, [], { ids: [1], jump: 1 }); let out = 0; for (let i = 0; i < W * H; i++) if (f2[i] && Math.hypot((i % W) + 0.5 - e.disc.cx, ((i / W) | 0) + 0.5 - e.disc.cy) > e.disc.R + 1e-9) out++;
    ok('plan: no fragment tile outside the disc: R grows beyond 3 r for an elongated fragment', e.disc.grown && e.disc.R > 3 * e.disc.r && out === 0, `${e.disc.R.toFixed(1)} vs ${(3 * e.disc.r).toFixed(1)}, ${out} outside`);
  }
  ok('plan: deterministic (same ids, same plan, byte for byte) and different for another room id', Buffer.compare(Buffer.from(a.height.buffer), Buffer.from(b.height.buffer)) === 0 && Buffer.compare(Buffer.from(a.role), Buffer.from(b.role)) === 0 && Buffer.compare(Buffer.from(a.height.buffer), Buffer.from(c.height.buffer)) !== 0);
  ok('plan: the fragment is untouched (role 1, its own heights), the decoration is never on it', (() => { for (let i = 0; i < W * H; i++) { if (frag[i] && (a.role[i] !== 1 || a.height[i] !== hf(i))) return false; if (!frag[i] && a.role[i] === 1) return false; } return true; })());
  ok('plan: nothing outside the disc except the fragment', (() => { for (let i = 0; i < W * H; i++) if (a.role[i] >= 2) { const dd = Math.hypot((i % W) + 0.5 - d.cx, ((i / W) | 0) + 0.5 - d.cy); if (dd > d.R + 1e-9) return false; } return true; })());
  const sOf = (sd) => sd.s;
  ok('plan: seeds proportional to the area (one per 80 tiles, 30..48), behind +1..+3 terraces, in front 0 / -1 / -2, at the sides 0, jitter -1..+1 sub-level', a.seeds.length === Math.max(30, Math.min(48, Math.round(Math.PI * d.R * d.R / 80))) && a.seeds.filter((s) => s.k >= 1).length >= 3 && a.seeds.every((s) => (s.k >= 1 && s.k <= 3 && sOf(s) < 0) || (s.k <= 0 && s.k >= -2)) && a.seeds.every((s) => Math.abs(s.j) <= 1) && a.seeds.some((s) => s.k === 3 || s.k === 2) && a.seeds.some((s) => s.k < 0), `${a.seeds.length} seeds: k ${[...new Set(a.seeds.map((s) => s.k))].sort().join(',')}`);
  ok('plan: the height of the cells follows the camera axis: the more behind, the higher (never lower than a seed closer to the fragment); in front the offset never rises', (() => { const back = a.seeds.filter((s) => s.k >= 1).sort((p, q) => p.s - q.s); for (let i = 1; i < back.length; i++) if (back[i].k > back[i - 1].k) return false; const front = a.seeds.filter((s) => s.k <= 0 && s.s > 0).sort((p, q) => p.s - q.s); for (let i = 1; i < front.length; i++) if (front[i].k > front[i - 1].k) return false; return true; })());
  ok('plan: exactly one pond cell, in front, at most 50 % of the fragment tiles (60), the tiles nearest to its seed', a.pondCell >= 0 && a.seeds[a.pondCell].k < 0 && a.info.pondTiles >= 1 && a.info.pondTiles <= 60 && (() => { const sd = a.seeds[a.pondCell]; let far = 0, near = Infinity; for (let i = 0; i < W * H; i++) if (a.cell[i] === sd.id) { const dd = ((i % W) + 0.5 - sd.x) ** 2 + (((i / W) | 0) + 0.5 - sd.y) ** 2; if (a.role[i] === 4) far = Math.max(far, dd); else if (a.role[i] === 2) near = Math.min(near, dd); } return far <= near + 1e-9; })(), JSON.stringify([a.pondCell, a.info.pondTiles, a.info.pondMax]));
  { const big = new Uint8Array(W * H); for (let y = 20; y < 30; y++) for (let x = 20; x < 30; x++) big[y * W + x] = 1; const small = K.plan(W, H, big, () => 3, [], { ids: [3], jump: 1, pondMax: 0.05 });
    ok('plan: the pond is limited by its parameter (5 % of 100 tiles = 5)', small.info.pondTiles <= 5 && small.info.pondTiles >= 1, small.info.pondTiles); }
  ok('plan: HARD RULE: no decoration tile is higher than the first fragment tile met looking away from the camera (it would hide the fragment)', (() => { let bad = 0, checked = 0; for (let i = 0; i < W * H; i++) { if (a.role[i] !== 2 && a.role[i] !== 4) continue; let x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, hit = -1; for (let s = 0; s < 4 * d.R && hit < 0; s++) { x -= u[0] * 0.5; y -= u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; if (frag[iy * W + ix]) hit = iy * W + ix; } if (hit >= 0) { checked++; if (a.height[i] > hf(hit) + 1e-6) bad++; } } return bad === 0 && checked > 50; })());
  // paths: width min(run, 2), ON the decoration (its height beyond the short ramp), a ramp of at most 3 tiles from the fragment, to the edge of the disc
  const east = a.exits.find((e) => e.dx === 1), south = a.exits.find((e) => e.dy === 1);
  ok('plan: the exits are paths of width min(run, 2) that reach the edge of the disc', a.info.exitRuns === 2 && a.info.exitsReached === 2 && a.info.exitsBlocked === 0 && east.width === 2 && south.width === 2 && east.paths.length === 2 && east.paths.every((p) => Math.hypot(p[p.length - 1] % W + 0.5 - d.cx, ((p[p.length - 1] / W) | 0) + 0.5 - d.cy) <= d.R && Math.hypot(p[p.length - 1] % W + 1.5 - d.cx, ((p[p.length - 1] / W) | 0) + 0.5 - d.cy) > d.R - 1e-9));
  ok('plan: a path is drawn ON the decoration: beyond the first 3 tiles its height is the decoration\'s (not the fragment\'s); the first 3 are a monotone ramp from the fragment face to it', east.paths.every((p) => { const f = hf(p[0] - 1); for (let t = 3; t < p.length; t++) if (a.height[p[t]] !== a.decoHeight[p[t]]) return false; const h3 = a.height[p[3]]; const sg = Math.sign(h3 - f); let prev = f; for (let t = 0; t < 3; t++) { const h = a.height[p[t]]; if (sg * (h - prev) < -1e-9) return false; prev = h; } return true; }) && a.exits.every((e) => e.paths.every((p) => p.every((t) => a.role[t] === 3))));
  { // parallel runs of the same direction less than 3 tiles apart become one path
    const ex2 = [{ a: 41 * W + 45, dx: 1, dy: 0 }, { a: 42 * W + 45, dx: 1, dy: 0 }, { a: 46 * W + 45, dx: 1, dy: 0 }, { a: 47 * W + 45, dx: 1, dy: 0 }, { a: 49 * W + 36, dx: 0, dy: 1 }]; // two runs of 2 faces with a gap of 3 tiles between them: merged (gap < 3? no: 3 tiles) -> kept apart; a third run 1 tile away from the second: merged
    const m1 = K.plan(W, H, frag, hf, ex2.slice(0, 2).concat([{ a: 44 * W + 45, dx: 1, dy: 0 }]), { ids: [7], jump: 1 }); // faces 41,42 and 44: the gap is one tile: ONE path
    const m2 = K.plan(W, H, frag, hf, [{ a: 41 * W + 45, dx: 1, dy: 0 }, { a: 46 * W + 45, dx: 1, dy: 0 }], { ids: [7], jump: 1 });  // gap of 4 tiles: two paths
    ok('plan: parallel runs less than 3 tiles apart are one path; farther apart stay two', m1.info.exitRunsBeforeMerge === 2 && m1.info.exitRuns === 1 && m2.info.exitRuns === 2, JSON.stringify([m1.info.exitRunsBeforeMerge, m1.info.exitRuns, m2.info.exitRuns]));
  }
  // a notch: the exit faces a wall of the fragment, so its straight path is blocked; it bends around it and still reaches the edge
  const frag2 = frag.slice(); for (let y = 38; y < 52; y++) frag2[y * W + 48] = 1; // a wall 2 tiles east of the east exit
  const e2 = K.plan(W, H, frag2, hf, exits.filter((e) => e.dx === 1), { ids: [7], jump: 1 });
  ok('plan: a path whose straight line is blocked by the fragment bends to another direction and still reaches the edge', e2.info.exitsBlocked === 0 && e2.info.exitsBent >= 1, JSON.stringify(e2.info));
}

/* ---- the real map, Balanced types ---- */
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const PB = { terraces: 3, subs: 3, terH: 1, subH: 0.22, minPlateau: 120, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 100, roomsCross: 10, roomsIsoLimit: 100, rRadius: 5, rooms: true, margin: 24 };
  const base = E.shape(mk(), PB, null), dio = [...base.types.rooms.values()].filter((o) => o.type === E.roomTypes.DIORAMA).sort((p, q) => p.id - q.id);
  ok('Balanced types: 18 Dioramas (rule D-D on)', dio.length === 18, dio.length);
  const rows = [];
  for (const o of dio) {
    const sp = { rooms: [o.id], margin: 6 }, w0 = base, S = E.shape(mk(), { ...PB, pocket: true }, sp), I = S.pocketInfo, fw = w0.mapW; // w0 = the WHOLE map shape (the world); the pocket of a room at the edge is built on a padded copy: S.pad shifts it back to world coordinates
    const mapOf = (S0, i) => { const x = (i % S0.W) + S0.ox, y = ((i / S0.W) | 0) + S0.oy; return x < 0 || y < 0 || x >= fw || y >= S0.mapH ? -1 - i : y * fw + x; }, // S.ox / S.oy are -pad for an embedded pocket; -1 - i = outside the map (the border of void)
      w0idx = new Map(); for (let i = 0; i < w0.n; i++) w0idx.set(mapOf(w0, i), i);
    const stairKey = (T, rec) => JSON.stringify([rec.mode, rec.cols.length, rec.bottom.map((t) => mapOf(T, t)), rec.top.map((t) => mapOf(T, t))]);
    let diff = 0, fragN = 0, walkDiff = 0, carvedDiff = 0;
    for (let i = 0; i < S.n; i++) { if (!S.slice[i]) continue; const j = w0idx.get(mapOf(S, i)); if (j === undefined) { diff++; continue; } fragN++; if (Math.abs(S.levelH[S.fine[i]] - w0.levelH[w0.fine[j]]) > 1e-9 || S.ter[i] !== w0.ter[j]) diff++; if (S.block[i] !== w0.block[j] || (S.region[i] < 0) !== (w0.region[j] < 0)) walkDiff++; if (S.carved[i] !== w0.carved[j]) carvedDiff++; }
    const inFrag = (T, rec) => rec.cols.some((c, ci) => T.slice[rec.bottom[ci]] || T.slice[rec.top[ci]]), rampsS = S.stairs.filter((r) => inFrag(S, r)).map((r) => stairKey(S, r)).sort(), rampsW = w0.stairs.filter((r) => { const fm = new Set(); for (let i = 0; i < S.n; i++) if (S.slice[i]) fm.add(mapOf(S, i)); return r.cols.some((c, ci) => fm.has(mapOf(w0, r.bottom[ci])) || fm.has(mapOf(w0, r.top[ci]))); }).map((r) => stairKey(w0, r)).sort();
    ok(`room ${o.id}: the fragment is the FULL MAP's, tile by tile (${fragN} tiles: levels, terraces, walkability, ramps; ${rampsS.length} ramps touch it, none of a patch)`, diff === 0 && walkDiff === 0 && carvedDiff === 0 && fragN === I.fragTiles && I.fragTiles === o.tiles && JSON.stringify(rampsS) === JSON.stringify(rampsW) && !S.stairs.some((r) => r.site && r.site.patch) && S.connInfo.patch === 0, [diff, walkDiff, carvedDiff, fragN, I.fragTiles, o.tiles, rampsS.length, rampsW.length, S.connInfo.patch]);
    { // the world does not change: pocket on / off give the same regions, route, connections and walking summary (world coordinates; the padded copy of a room at the edge also without positions)
      const sc = (x) => JSON.stringify(x, (k, v) => (k === 'at' || k === 'box' || k === 'list' ? undefined : v)), key = (T, i) => mapOf(T, i);
      let sameRegion = true; for (let i = 0; i < S.n; i++) { if (S.pocketRole[i] >= 2 && !S.slice[i]) continue; const j = w0idx.get(key(S, i)); if (j === undefined) continue; if ((S.region[i] === S.mainRegion) !== (w0.region[j] === w0.mainRegion) || (S.region[i] < 0) !== (w0.region[j] < 0)) { sameRegion = false; break; } }
      const mainS = [], fragW = new Set(); for (let i = 0; i < S.n; i++) if (S.slice[i]) { fragW.add(key(S, i)); if (S.region[i] === S.mainRegion) mainS.push(i); }
      const mainWf = []; for (let i = 0; i < w0.n; i++) if (w0.region[i] === w0.mainRegion && fragW.has(key(w0, i))) mainWf.push(i);
      // a route inside the fragment: the same in the pocket and in the world when the world's route does not leave the fragment (the pocket has nothing else to walk on)
      let routeOk = true, routes = 0; for (let k = 1; k <= 3 && mainWf.length > 1; k++) { const ia = Math.floor((mainWf.length - 1) * (k - 1) / 3), ib = Math.floor((mainWf.length - 1) * k / 3) + 1, a0 = mainWf[ia], b0 = mainWf[Math.min(ib, mainWf.length - 1)], rW = E.route(w0, PB, a0, b0); if (!rW || !rW.every((t) => fragW.has(key(w0, t)))) continue; routes++; const sa = w0idx.size && [...Array(S.n).keys()].find((i) => S.slice[i] && key(S, i) === key(w0, a0)), sb = [...Array(S.n).keys()].find((i) => S.slice[i] && key(S, i) === key(w0, b0)), rS = E.route(S, PB, sa, sb); if (!rS || JSON.stringify(rS.map((t) => key(S, t))) !== JSON.stringify(rW.map((t) => key(w0, t)))) routeOk = false; }
      ok(`room ${o.id}: pocket on / off: same regions, connections and walking summary of the world, same route inside the fragment`, sameRegion && sc(S.connInfo) === sc(w0.connInfo) && sc(S.walkInfo) === sc(w0.walkInfo) && JSON.stringify(S.regionSizes) === JSON.stringify(w0.regionSizes) && mainS.length === mainWf.length && routeOk, [sameRegion, mainS.length, mainWf.length, routeOk, routes]);
    }
    { let bad = 0, lv = new Set(); for (let i = 0; i < S.n; i++) if (S.pocketRole[i] >= 2) { if (Math.abs(S.levelH[S.fine[i]] - S.pocketPlan.height[i]) > 2e-6) bad++; lv.add(S.fine[i]); } ok(`room ${o.id}: every decoration / path tile sits at its planned height (${lv.size} levels)`, bad === 0 && lv.size >= 4, [bad, lv.size]); }
    const pl = S.pocketPlan, d = pl.disc;
    ok(`room ${o.id}: every exit reaches the edge of the disc (${I.exitRuns} runs, ${I.exitsBent} bent)`, I.exitsBlocked === 0 && I.exitRuns > 0 && I.exitsReached === I.exitRuns, JSON.stringify(I));
    ok(`room ${o.id}: not walkable outside the fragment, nothing drawn outside the pocket`, S.block.every((v, i) => S.pocketRole[i] < 2 || v === 1) && S.void.every((v, i) => (S.pocketRole[i] === 0) === (v === 1)));
    let bad = 0; const u = d.u, W = S.W, H = S.H, frag = Uint8Array.from(S.slice, (v) => (v ? 1 : 0)); // independent re-check of the hard rule on the shape
    for (let i = 0; i < S.n; i++) { if (S.pocketRole[i] !== 2 && S.pocketRole[i] !== 4) continue; let x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, hit = -1; for (let s = 0; s < 4 * d.R && hit < 0; s++) { x -= u[0] * 0.5; y -= u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; if (frag[iy * W + ix]) hit = iy * W + ix; } if (hit >= 0 && S.levelH[S.fine[i]] > S.levelH[S.fine[hit]] + 1e-6) bad++; }
    ok(`room ${o.id}: no decoration in front is higher than the fragment edge facing it`, bad === 0, bad);
    rows.push([o.id, I.fragTiles, I.pocketTiles, I.exitRuns, I.floors.length, I.double, I.cliffFacesCamera, I.truncated]); console.log(`  room ${o.id}: fragment ${I.fragTiles}, walkable per terrace ${JSON.stringify(I.perTerrace.map((t) => t.ter + ':' + t.tiles))}, floors ${JSON.stringify(I.floors)}, double ${I.double}, cliff facing camera ${I.cliffFacesCamera}, padded ${S.pad || 0}, pond ${I.pondTiles}/${I.pondMax}, backdrop band ${I.backDepth.toFixed(1)} tiles deep (${I.backTiles} tiles), seeds ${I.seeds}, disc R ${S.pocketPlan.disc.R.toFixed(1)}${I.discGrown ? ' (grown)' : ''}`);
  }
  const S1 = E.shape(mk(), { ...PB, pocket: true }, { rooms: [31], margin: 6 }), S1b = E.shape(mk(), { ...PB, pocket: true }, { rooms: [31], margin: 6 });
  ok('real map: deterministic (room 31 twice: the same levels and the same roles)', JSON.stringify(S1.levelH) === JSON.stringify(S1b.levelH) && Buffer.compare(Buffer.from(S1.fine.buffer), Buffer.from(S1b.fine.buffer)) === 0 && Buffer.compare(Buffer.from(S1.pocketRole), Buffer.from(S1b.pocketRole)) === 0);
  const dbl = rows.filter((r) => r[5]).map((r) => r[0]);
  ok('floors: room 31 is "double" (two terraces >= 20 walkable tiles, no ramp between them); room 38 (14 tiles on its upper floor) and room 49 (one floor) are not', dbl.includes(31) && !dbl.includes(38) && !dbl.includes(49), JSON.stringify(dbl));
  console.log(`  info: Dioramas of Balanced types with two floors ("double"): ${dbl.join(', ')}; cliff facing the camera: ${rows.filter((r) => r[6]).map((r) => r[0]).join(', ')}; disc cut by the edge of the map: ${rows.filter((r) => r[7]).map((r) => r[0]).join(', ') || 'none'}`);
  const none = E.shape(mk(), { ...PB, pocket: true }, { rooms: [(base.types.rooms.get(1).type === E.roomTypes.DIORAMA ? 2 : 1)], margin: 6 });
  ok('a room that is not a Diorama has no pocket (the switch does nothing)', none.pocket === undefined);
  const off = E.shape(mk(), PB, { rooms: [31], margin: 6 }), off2 = E.shape(mk(), { ...PB, pocket: false }, { rooms: [31], margin: 6 });
  ok('pocket off: identical shape (levels, tiles) and no pocket data', off.pocket === undefined && off.pocketInfo === undefined && JSON.stringify(off.levelH) === JSON.stringify(off2.levelH) && Buffer.compare(Buffer.from(off.fine.buffer), Buffer.from(off2.fine.buffer)) === 0);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
