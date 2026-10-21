/* ASCENSION walls (P.ascWalls): where they go, the camera cut, off = identical. Real map, Balanced types, whole map. Also prints the figures (faces, runs).
     node tools/test_walls.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'render'].filter((f) => f !== 'render')) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T = E.roomTypes;
let pass = 0, fail = 0; const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  ' + extra : '')); } };
const PB = { terraces: 3, subs: 3, terH: 1, subH: 0.22, minPlateau: 120, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 100, roomsCross: 10, roomsIsoLimit: 100, rRadius: 5, rooms: true };
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const off = E.shape(mk(), PB, null), on = E.shape(mk(), { ...PB, ascWalls: true }, null), RL = E.rooms.layer(mk(), PB), n = on.n, W = on.W, H = on.H, ty = on.types;
  ok('off: no walls data at all, and the shape is the same with the switch on (levels, tiles)', off.ascWalls === undefined && JSON.stringify(off.levelH) === JSON.stringify(on.levelH) && Buffer.compare(Buffer.from(off.fine.buffer), Buffer.from(on.fine.buffer)) === 0 && JSON.stringify(off.regionSizes) === JSON.stringify(on.regionSizes) && Buffer.compare(Buffer.from(off.block.buffer), Buffer.from(on.block.buffer)) === 0);
  const A = on.ascWalls; ok('on: the data exists', !!A && A.faces.length > 0);
  // independent recomputation from the rooms layer (not from S.roomKind)
  const isAsc = (r) => { const o = ty.rooms.get(r); return !!o && o.type === T.ASCENSION; }, N = RL.W * RL.H, cand = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, ri = RL.room[i]; if (ri <= 0 || on.void[i]) continue;
    for (const [dx, dy, dir] of [[1, 0, 0], [0, 1, 1]]) { const nx = x + dx, ny = y + dy; if (nx >= W || ny >= H) continue; const j = ny * W + nx, rj = RL.room[j]; if (rj <= 0 || rj === ri || on.void[j]) continue;
      if (RL.rp.has(E.rooms.key(i, j, N))) continue; if (!isAsc(ri) && !isAsc(rj)) continue; if (on.carved[i] || on.carved[j]) continue; cand.push({ i, dir, line: dir === 0 ? x + 1 : y + 1, along: dir === 0 ? y : x }); } }
  // chains: faces connected by a shared corner, any direction; chains of fewer than 3 faces dropped (independent union-find on corner keys)
  const vk = (c) => { const x = (c.i % W), y = (c.i / W) | 0; return c.dir === 0 ? [`${x + 1},${y}`, `${x + 1},${y + 1}`] : [`${x},${y + 1}`, `${x + 1},${y + 1}`]; };
  const par = cand.map((_, q) => q), fnd = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, at = new Map();
  cand.forEach((c, q) => { for (const key of vk(c)) { if (at.has(key)) par[fnd(q)] = fnd(at.get(key)); else at.set(key, q); } });
  const sz = new Map(); cand.forEach((_, q) => sz.set(fnd(q), (sz.get(fnd(q)) || 0) + 1)); const want = new Set(), rootsKept = new Set(); cand.forEach((c, q) => { if (sz.get(fnd(q)) >= 3) { want.add(c.i * 2 + c.dir); rootsKept.add(fnd(q)); } }); const runs = rootsKept.size;
  const got = new Set(A.faces.map((f) => f.i * 2 + f.dir));
  ok(`the faces are exactly the independent recomputation (${want.size} faces in ${runs} runs)`, want.size === got.size && [...want].every((v) => got.has(v)) && A.runs.length === runs, [want.size, got.size, runs, A.runs.length]);
  ok('only on faces WITHOUT a transition (none on an open transition), an Ascension room on at least one side, none on ramp tiles, none toward void', A.faces.every((f) => !RL.rp.has(E.rooms.key(f.i, f.j, N)) && (isAsc(RL.room[f.i]) || isAsc(RL.room[f.j])) && !on.carved[f.i] && !on.carved[f.j] && !on.void[f.i] && !on.void[f.j] && RL.room[f.i] > 0 && RL.room[f.j] > 0));
  ok('every transition pair between two rooms is a door: no wall on it (counted over all open pairs)', (() => { let doors = 0; for (const kk of RL.rp) { const a = (kk / N) | 0, b = kk % N; if (RL.room[a] > 0 && RL.room[b] > 0 && RL.room[a] !== RL.room[b]) { doors++; const i = Math.min(a, b), j = Math.max(a, b), dir = j === i + 1 ? 0 : 1; if (got.has(i * 2 + dir)) return false; } } return doors > 0; })());
  ok('chains of 3 faces or more (connected by corners, following the turns); a chain can have faces in both directions', A.runs.every((r) => r.n >= 3) && A.runs.reduce((s, r) => s + r.n, 0) === A.faces.length && A.runs.some((r) => { const ds = new Set(A.faces.filter((f) => f.run === r.id).map((f) => f.dir)); return ds.size === 2; }));
  ok('wall footprint: thickness 0.35, the ends extended by half of it only where another face of the chain meets them (corners filled)', T.ASC_T === 0.35 && A.faces.every((f) => { const b = T.ascBox(f), th = f.dir === 0 ? b[1] - b[0] : b[3] - b[2], len = f.dir === 0 ? b[3] - b[2] : b[1] - b[0]; return Math.abs(th - 0.35) < 1e-9 && Math.abs(len - (1 + (f.e0 ? 0.175 : 0) + (f.e1 ? 0.175 : 0))) < 1e-9; }) && A.faces.some((f) => f.e0 || f.e1) && A.faces.some((f) => !f.e0 || !f.e1));
  ok('the base is the higher of the two tiles; the height is absolute (default 1.5, slider 0.5-3) and low 0.15', A.faces.every((f) => Math.abs(f.hb - Math.max(on.levelH[on.fine[f.i]], on.levelH[on.fine[f.j]])) < 1e-9) && T.ASC_H === 1.5 && A.height === 1.5 && T.ASC_LOW === 0.15);
  // the cut by camera: the outward normal of an Ascension room facing the camera = low
  const view = (yaw) => ({ yaw, pitch: 35, zoom: 1, panX: 0, panY: 0 });
  const cam = (yaw) => E.makeCam ? E.makeCam(on, PB, view(yaw), 800, 600) : { nrm: (nx, ny) => { const a = yaw * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c * nx - s * ny, s * nx + c * ny]; } };
  const nrmAt = (yaw) => (nx, ny) => { const a = yaw * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c * nx - s * ny, s * nx + c * ny]; };
  const lowAt = (yaw) => A.faces.map((f) => T.ascWallLow(f, { nrm: nrmAt(yaw) }));
  for (const [yaw, rule] of [[0, (f) => f.dir === 1 && f.ai], [180, (f) => f.dir === 1 && f.aj]]) { // S faces: the outward normal (0, 1) of the north tile faces the camera at yaw 0; the one of the south tile at yaw 180; E / W faces are edge-on
    const low = lowAt(yaw); ok(`cut at yaw ${yaw}: an S face is low when the Ascension room is on the ${yaw === 0 ? 'north' : 'south'} side; E / W faces (edge-on) are full`, A.faces.every((f, q) => low[q] === rule(f)));
  }
  { const low = lowAt(45); ok('cut at Iso 45: low exactly when the Ascension room is the west / north tile (its outward normal faces the camera); the far sides stay full', A.faces.every((f, q) => low[q] === !!f.ai)); }
  { const l0 = lowAt(0), l180 = lowAt(180), l90 = lowAt(90); ok('the cut depends on the camera: it changes with the preset', l0.some((v, q) => v !== l180[q]) && l0.some((v, q) => v !== l90[q]) && l0.filter(Boolean).length > 0 && l0.filter((v) => !v).length > 0); }
  { const both = A.faces.filter((f) => f.ai && f.aj); let okBoth = true; for (const yaw of [0, 45, 90, 135, 180, 225, 270, 315]) { const low = lowAt(yaw), nr = nrmAt(yaw); A.faces.forEach((f, q) => { if (!(f.ai && f.aj)) return; const dx = f.dir === 0 ? 1 : 0, dy = f.dir === 0 ? 0 : 1, full = nr(dx, dy)[1] <= 0.001 && nr(-dx, -dy)[1] <= 0.001; if (low[q] === full) okBoth = false; }); }
    ok(`a face between two Ascension rooms (${both.length}) is full only when it is the back one for both (edge-on), else low`, okBoth); }
  // figures
  const asc = [...ty.rooms.values()].filter((o) => o.type === T.ASCENSION).length, ascFaceN = A.faces.length, lens = A.runs.map((r) => r.n).sort((a, b) => a - b);
  console.log(`  figures (Balanced types, whole map): ${ty.counts.ascension} Ascension rooms; candidate faces (blocking, with an Ascension side, not ramp, not void) ${A.info.candidates}; walls ${A.info.faces} faces in ${A.info.runs} chains (${A.info.dropped} faces dropped: chains of fewer than 3); chain length median ${lens[lens.length >> 1]}, max ${lens[lens.length - 1]}`);
  { const hs = E.shape(mk(), { ...PB, ascWalls: true, ascHeight: 2.5 }, null); ok('the height is a parameter (ascHeight) and does not change which faces get a wall', hs.ascWalls.height === 2.5 && hs.ascWalls.faces.length === A.faces.length); }
  // ---- D28 (DAC v2 PR B2): the gate width (ascGate) and the cut height (ascCut)
  {
    const ids = (w) => w.faces.map((f) => f.i + '_' + f.j + '_' + f.dir).join(','), base = on.ascWalls, key = (w) => w.faces.map((f) => `${f.i},${f.j},${f.dir},${f.hb}`).join(';');
    const g0 = E.shape(mk(), { ...PB, ascWalls: true, ascGate: 0, ascCut: 0.15 }, null).ascWalls;
    ok('ascGate 0 and ascCut 0.15 (the defaults) reproduce today: the same faces, runs and heights, no gate info, lowH 0.15', key(g0) === key(base) && g0.runs.length === base.runs.length && !g0.info.gateInfo && g0.lowH === 0.15 && g0.gate === 0);
    const gs = [1, 3, 5].map((k) => E.shape(mk(), { ...PB, ascWalls: true, ascGate: k }, null)); const ns = gs.map((S) => S.ascWalls.faces.length);
    ok(`ascGate 1 / 3 / 5: faces ${ns.join(' / ')} (today ${base.faces.length}): more walls than today, fewer as the gate widens`, ns[0] > ns[1] && ns[1] > ns[2] && ns[2] > base.faces.length, ns.join());
    for (const [k, S] of [1, 3, 5].map((k, q) => [k, gs[q]])) { const w = S.ascWalls, gi = w.info.gateInfo, W2 = S.W;
      ok(`ascGate ${k}: info.gateOk (no crossing face is a wall), ${gi.crossings} crossings, ${gi.open} faces kept open, ${gi.added} faces walled in ${gi.groups} groups`, gi.gateOk === true && gi.crossings > 0 && gi.added > 0, JSON.stringify(gi));
      let usedWall = 0, rampWall = 0; const wallSet = new Set(w.faces.map((f) => f.i + '_' + f.j)); for (let i = 0; i < S.n; i++) for (const [b, dx, dy] of [[1, 1, 0], [2, 0, 1]]) { const x = i % W2, y = (i / W2) | 0; if (x + dx >= W2 || y + dy >= S.H) continue; const j = (y + dy) * W2 + x + dx; if (S.roomKind[i * 4 + b] === 2 && wallSet.has(i + '_' + j)) usedWall++; }
      for (const f of w.faces) if (S.carved && (S.carved[f.i] || S.carved[f.j])) rampWall++;
      ok(`ascGate ${k}: no used transition face (roomKind 2) and no ramp tile gets a wall`, usedWall === 0 && rampWall === 0, [usedWall, rampWall]);
      const added = w.faces.filter((f) => f.gate).length; ok(`ascGate ${k}: the walls added by the gate are marked and all of them lie on open transition faces`, added > 0 && w.faces.filter((f) => f.gate).every((f) => { const b = f.dir === 0 ? 1 : 2; return [0, 2].includes(S.roomKind[f.i * 4 + b]); }), added); }
    // a route face (a face crossed by a drawn route, passed through P like P.chainIds) is never walled: take a kind-0 face that the gate would wall and pass it
    const g1 = gs[0], w1 = g1.ascWalls, add1 = w1.faces.find((f) => f.gate), fw = g1.mapW, mk2 = (t) => (((t / g1.W) | 0) + g1.oy) * fw + (t % g1.W) + g1.ox, rk = Math.min(mk2(add1.i), mk2(add1.j)) + '_' + Math.max(mk2(add1.i), mk2(add1.j));
    const gr = E.shape(mk(), { ...PB, ascWalls: true, ascGate: 1, ascRouteFaces: new Set([rk]) }, null).ascWalls;
    ok('a route face passed in P.ascRouteFaces is kept open (not a wall) and counted as a crossing', !gr.faces.some((f) => f.i === add1.i && f.j === add1.j) && gr.info.gateInfo.routeFaces === 1 && gr.info.gateInfo.gateOk, JSON.stringify(gr.info.gateInfo));
    // the cut height
    const c5 = E.shape(mk(), { ...PB, ascWalls: true, ascCut: 0.5 }, null).ascWalls, cf = E.shape(mk(), { ...PB, ascWalls: true, ascCut: 3 }, null).ascWalls;
    ok('ascCut sets the low height (0.5), clamped to the wall height (1.5) at full; the faces and their heights of base are unchanged', c5.lowH === 0.5 && cf.lowH === 1.5 && key(c5) === key(base) && c5.height === 1.5, [c5.lowH, cf.lowH]);
  }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
