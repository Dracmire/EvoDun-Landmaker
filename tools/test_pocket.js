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
  const a = K.plan(W, H, frag, hf, exits, { ids: [7], jump: 1 }), b = K.plan(W, H, frag, hf, exits, { ids: [7], jump: 1 }), c = K.plan(W, H, frag, hf, exits, { ids: [8], jump: 1 });
  const d = a.disc, r = Math.sqrt(120 / Math.PI), u = [Math.SQRT1_2, Math.SQRT1_2];
  ok('plan: R = 3 r and the disc centre = the centroid moved 2 r toward the camera (Iso, yaw 45)', Math.abs(d.R - 3 * r) < 1e-9 && Math.abs(d.cx - (40 + 2 * r * u[0])) < 1e-9 && Math.abs(d.cy - (45 + 2 * r * u[1])) < 1e-9, JSON.stringify(d));
  ok('plan: deterministic (same ids, same plan, byte for byte) and different for another room id', Buffer.compare(Buffer.from(a.height.buffer), Buffer.from(b.height.buffer)) === 0 && Buffer.compare(Buffer.from(a.role), Buffer.from(b.role)) === 0 && Buffer.compare(Buffer.from(a.height.buffer), Buffer.from(c.height.buffer)) !== 0);
  ok('plan: the fragment is untouched (role 1, its own heights), the decoration is never on it', (() => { for (let i = 0; i < W * H; i++) { if (frag[i] && (a.role[i] !== 1 || a.height[i] !== hf(i))) return false; if (!frag[i] && a.role[i] === 1) return false; } return true; })());
  ok('plan: nothing outside the disc except the fragment and the roads that end at its edge', (() => { for (let i = 0; i < W * H; i++) if (a.role[i] >= 2) { const dd = Math.hypot((i % W) + 0.5 - d.cx, ((i / W) | 0) + 0.5 - d.cy); if (dd > d.R + 1e-9) return false; } return true; })());
  ok('plan: 9 seeds, 3 behind (+1/+2), 4 in front (-1/-2), 2 at the sides (0/-1), exactly one pond cell, in front', a.seeds.length === 9 && a.seeds.filter((s) => s.zone === 0 && s.k >= 1 && s.k <= 2).length === 3 && a.seeds.filter((s) => s.zone === 1 && s.k <= -1 && s.k >= -2).length === 4 && a.seeds.filter((s) => s.zone === 2 && s.k <= 0 && s.k >= -1).length === 2 && a.seeds.filter((s) => s.pond).length === 1 && a.seeds.find((s) => s.pond).zone === 1);
  ok('plan: HARD RULE: no decoration tile is higher than the first fragment tile met looking away from the camera (it would hide the fragment)', (() => { let bad = 0, checked = 0; for (let i = 0; i < W * H; i++) { if (a.role[i] !== 2 && a.role[i] !== 4) continue; let x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, hit = -1; for (let s = 0; s < 4 * d.R && hit < 0; s++) { x -= u[0] * 0.5; y -= u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; if (frag[iy * W + ix]) hit = iy * W + ix; } if (hit >= 0) { checked++; if (a.height[i] > hf(hit) + 1e-6) bad++; } } return bad === 0 && checked > 50; })());
  ok('plan: the exits are roads (role 3) at the height of the fragment on their face, as wide as the run, and reach the edge of the disc', a.info.exitRuns === 2 && a.info.exitsReached === 2 && a.info.exitsBlocked === 0 && a.exits.find((e) => e.dx === 1).width === 10 && a.exits.find((e) => e.dy === 1).width === 4 && (() => { for (let y = 40; y < 50; y++) { let x = 46; while (a.role[y * W + x] === 3) { if (a.height[y * W + x] !== hf(y * W + 45)) return false; x++; } const xe = x; if (xe === 46) return false; if (Math.hypot(xe + 0.5 - d.cx, y + 0.5 - d.cy) <= d.R) return false; } return true; })());
  ok('plan: the lowest cell of the front is a pond (role 4) and is not walkable decoration of another kind', a.info.pondTiles > 0);
  // a notch: the exit faces a wall of the fragment, so its straight road is blocked; the road bends around it and still reaches the edge
  const frag2 = frag.slice(); for (let y = 38; y < 52; y++) frag2[y * W + 48] = 1; // a wall 2 tiles east of the east exit
  const e2 = K.plan(W, H, frag2, hf, exits.filter((e) => e.dx === 1), { ids: [7], jump: 1 });
  ok('plan: a road whose straight line is blocked by the fragment bends to another direction and still reaches the edge', e2.info.exitsBlocked === 0 && e2.info.exitsBent >= 1, JSON.stringify(e2.info));
}

/* ---- the real map, Balanced types ---- */
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const PB = { terraces: 3, subs: 3, terH: 1, subH: 0.22, minPlateau: 120, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 100, roomsCross: 10, roomsIsoLimit: 100, rRadius: 5, rooms: true, margin: 24 };
  const base = E.shape(mk(), PB, null), dio = [...base.types.rooms.values()].filter((o) => o.type === E.roomTypes.DIORAMA).sort((p, q) => p.id - q.id);
  ok('Balanced types: 18 Dioramas (rule D-D on)', dio.length === 18, dio.length);
  const rows = [];
  for (const o of dio) {
    const sp = { rooms: [o.id], margin: 6 }, w0 = E.shape(mk(), PB, sp), S = E.shape(mk(), { ...PB, pocket: true }, sp), I = S.pocketInfo, fw = w0.mapW; // the pocket of a room at the edge is built on a padded copy: S.pad shifts it back to world coordinates
    const mapOf = (S0, i) => (((i / S0.W) | 0) + S0.oy - (S0.pad || 0)) * fw + (i % S0.W) + S0.ox - (S0.pad || 0), w0idx = new Map(); for (let i = 0; i < w0.n; i++) w0idx.set(mapOf(w0, i), i);
    let diff = 0, fragN = 0, walkDiff = 0, carvedDiff = 0;
    for (let i = 0; i < S.n; i++) { if (!S.slice[i] || (S.void && S.void[i] && !S.pocket)) continue; const j = w0idx.get(mapOf(S, i)); if (j === undefined || !w0.slice[j]) { diff++; continue; } fragN++; if (Math.abs(S.levelH[S.fine[i]] - w0.levelH[w0.fine[j]]) > 1e-9 || S.ter[i] !== w0.ter[j]) diff++; if (S.block[i] !== w0.block[j] || S.region[i] !== w0.region[j] && (S.region[i] < 0) !== (w0.region[j] < 0)) walkDiff++; if (S.carved[i] !== w0.carved[j]) carvedDiff++; }
    ok(`room ${o.id}: the fragment is the world's, tile by tile (${fragN} tiles: levels, terraces, walkability, ramps)`, diff === 0 && walkDiff === 0 && carvedDiff === 0 && fragN === I.fragTiles && I.fragTiles === o.tiles, [diff, walkDiff, carvedDiff, fragN, I.fragTiles, o.tiles]);
    { // the world does not change: pocket on / off give the same regions, route, connections and walking summary (compared in world coordinates; a padded copy also without positions in the summaries)
      const sc = (x) => JSON.stringify(x, (k, v) => (k === 'at' || k === 'box' || k === 'list' ? undefined : v)), key = (T, i) => mapOf(T, i);
      let sameRegion = true, nS = 0; for (let i = 0; i < S.n; i++) if (S.slice[i]) { nS++; const j = w0idx.get(key(S, i)); if (j === undefined || (S.region[i] === S.mainRegion) !== (w0.region[j] === w0.mainRegion) || (S.region[i] < 0) !== (w0.region[j] < 0)) { sameRegion = false; break; } }
      const mainS = [], mainW = []; for (let i = 0; i < S.n; i++) if (S.slice[i] && S.region[i] === S.mainRegion) mainS.push(i); for (let i = 0; i < w0.n; i++) if (w0.slice[i] && w0.region[i] === w0.mainRegion) mainW.push(i);
      const rS = mainS.length > 1 ? E.route(S, PB, mainS[0], mainS[mainS.length - 1]) : [], rW = mainW.length > 1 ? E.route(w0, PB, mainW[0], mainW[mainW.length - 1]) : [];
      ok(`room ${o.id}: pocket on / off: same regions, route, connections and walking summary`, sameRegion && sc(S.connInfo) === sc(w0.connInfo) && sc(S.walkInfo) === sc(w0.walkInfo) && JSON.stringify(S.regionSizes) === JSON.stringify(w0.regionSizes) && mainS.length === mainW.length && !!rS === !!rW && JSON.stringify((rS || []).map((i) => key(S, i))) === JSON.stringify((rW || []).map((i) => key(w0, i))), [sameRegion, mainS.length, mainW.length]);
    }
    const pl = S.pocketPlan, d = pl.disc;
    ok(`room ${o.id}: every exit reaches the edge of the disc (${I.exitRuns} runs, ${I.exitsBent} bent)`, I.exitsBlocked === 0 && I.exitRuns > 0 && I.exitsReached === I.exitRuns, JSON.stringify(I));
    ok(`room ${o.id}: not walkable outside the fragment, nothing drawn outside the pocket`, S.block.every((v, i) => S.pocketRole[i] < 2 || v === 1) && S.void.every((v, i) => (S.pocketRole[i] === 0) === (v === 1)));
    let bad = 0; const u = d.u, W = S.W, H = S.H, frag = Uint8Array.from(S.slice, (v) => (v ? 1 : 0)); // independent re-check of the hard rule on the shape
    for (let i = 0; i < S.n; i++) { if (S.pocketRole[i] !== 2 && S.pocketRole[i] !== 4) continue; let x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5, hit = -1; for (let s = 0; s < 4 * d.R && hit < 0; s++) { x -= u[0] * 0.5; y -= u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; if (frag[iy * W + ix]) hit = iy * W + ix; } if (hit >= 0 && S.levelH[S.fine[i]] > S.levelH[S.fine[hit]] + 1e-6) bad++; }
    ok(`room ${o.id}: no decoration in front is higher than the fragment edge facing it`, bad === 0, bad);
    rows.push([o.id, I.fragTiles, I.pocketTiles, I.exitRuns, I.floors.length, I.double, I.cliffFacesCamera, I.truncated]); console.log(`  room ${o.id}: fragment ${I.fragTiles}, walkable per terrace ${JSON.stringify(I.perTerrace.map((t) => t.ter + ':' + t.tiles))}, floors ${JSON.stringify(I.floors)}, double ${I.double}, cliff facing camera ${I.cliffFacesCamera}, padded ${S.pad || 0}`);
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
