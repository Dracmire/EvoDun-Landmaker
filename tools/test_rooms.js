/* Rooms chain (src/rooms.js) against the user's rules transcribed as is (tools/rooms_original.js), on small maps built by hand:
   every defect found when reading reference/EDunProcGen.cs is reproduced with the original rules and must be gone in the patched ones.
     node tools/test_rooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname, 'rooms_original.js'), 'utf8'));
const E = window.EVO, R = E.rooms, O = E.roomsOriginal, SL = R.SL, ET = R.ET;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const N4 = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const blank = (W, H) => ({ W, H, n: W * H, h: new Float32Array(W * H).fill(0.5), room: new Int32Array(W * H), ter: new Int32Array(W * H), cls: new Uint8Array(W * H).fill(SL.Gentle) });
const idx = (m, x, y) => y * m.W + x;
const reach = (m, a, b, step) => R.bfs(m.W, m.H, a, step, false).dist[b] >= 0;

// ---- 1. a tile with two pairs: the original keeps ONE record per tile (last wins) and kills the transition pair ----
{ const m = blank(7, 5);
  for (let y = 1; y < 4; y++) for (let x = 1; x < 6; x++) m.room[idx(m, x, y)] = 1;
  m.room[idx(m, 2, 2)] = 3; m.room[idx(m, 4, 2)] = 2; m.cls[idx(m, 4, 2)] = SL.Steep; // (3,2): Transition with room 3 on the west, Hard with room 2 on the east
  const a = idx(m, 3, 2), b = idx(m, 2, 2);
  const e = O.expand(O.edges(m.room, m.h, m.cls, m.ter, m.W, m.H, 0.05, 0.2), m.room, m.ter, m.cls, m.W, m.H, 1);
  const tr = new Set(e.filter((q) => q.type === ET.Transition).map((q) => q.pos)), forb = O.forbidden(m.cls, e, new Set(), m.ter, m.W, m.H);
  const rules = O.makeRules({ room: m.room, ter: m.ter, forb, roomTrans: tr, gateSet: new Set(), cls: m.cls });
  ok('1 original: the transition pair (3,2)-(2,2) cannot be crossed (the tile (3,2) became Hard and forbidden, (2,2) stays Transition)', !rules.walk(b, a) && forb[a] === 1 && !tr.has(a) && tr.has(b), [rules.walk(b, a), forb[a], tr.has(a), tr.has(b)]);
  const pairs = R.roomPairs(m.room, m.h, m.cls, m.ter, m.W, m.H, { hTol: 0.05, hardEdge: 0.2 }); R.expandFilter(pairs, m.room, m.ter, m.cls, m.W, m.H, 1);
  const p = R.makePass({ W: m.W, H: m.H, h: m.h, room: m.room, ter: m.ter, cls: m.cls, pairs, gate: [] });
  ok('1 patched: the pair passes both ways', p.pass(a, b) && p.pass(b, a));
  ok('1 patched: the wall pair to the east stays closed', !p.pass(a, idx(m, 4, 2)) && !p.pass(idx(m, 4, 2), a));
  ok('1 patched: the tiles of the valid pair are not forbidden', !p.forb[a] && !p.forb[b]);
}

// ---- 2. a terrace gate stored on the LOW tile: sealed in the original, open in the patched rule ----
{ const m = blank(10, 6); m.room.fill(1); for (let y = 0; y < 6; y++) for (let x = 5; x < 10; x++) m.ter[idx(m, x, y)] = 1;
  const lowG = [idx(m, 4, 2), idx(m, 4, 3)], gateSet = new Set(lowG), lo = idx(m, 2, 2), hi = idx(m, 7, 2);
  const forb = O.forbidden(m.cls, [], gateSet, m.ter, m.W, m.H), rules = O.makeRules({ room: m.room, ter: m.ter, forb, roomTrans: new Set(), gateSet, cls: m.cls });
  ok('2 original: high gate tiles are forbidden', forb[idx(m, 5, 2)] === 1 && forb[idx(m, 5, 3)] === 1);
  ok('2 original: no path up and none down', !reach(m, lo, hi, rules.walk) && !reach(m, hi, lo, rules.walk));
  ok('2 original: the scan (either tile, no forbidden) claims it is reachable, the paths do not', reach(m, lo, hi, rules.scan) && !reach(m, lo, hi, rules.walk));
  const gate = [[idx(m, 4, 2), idx(m, 5, 2)], [idx(m, 4, 3), idx(m, 5, 3)]];
  const p = R.makePass({ W: m.W, H: m.H, h: m.h, room: m.room, ter: m.ter, cls: m.cls, pairs: [], gate });
  const d1 = R.bfs(m.W, m.H, lo, p.pass, false).dist[hi], d2 = R.bfs(m.W, m.H, hi, p.pass, false).dist[lo];
  ok('2 patched: a path exists up and down, same length', d1 === 5 && d2 === 5, [d1, d2]);
  ok('2 patched: the cliff outside the gate stays closed', !p.pass(idx(m, 4, 0), idx(m, 5, 0)) && !p.pass(idx(m, 4, 4), idx(m, 5, 4)));
}

// ---- 3. rooms split by an unassigned strip have no edge; the strip goes to the nearest room ----
{ const m = blank(9, 5);
  for (let y = 1; y < 4; y++) { for (let x = 1; x <= 3; x++) m.room[idx(m, x, y)] = 1; for (let x = 5; x <= 7; x++) m.room[idx(m, x, y)] = 2; m.cls[idx(m, 4, y)] = SL.Steep; }
  const prm = { hTol: 0.05, hardEdge: 0.2 };
  ok('3 original: no edge between the rooms', O.edges(m.room, m.h, m.cls, m.ter, m.W, m.H, 0.05, 0.2).length === 0);
  const as = R.assign(m.room, m.h, m.W, m.H);
  ok('3 patched: the 3 strip tiles go to the nearest room (a tie to the lowest id)', [1, 2, 3].every((y) => as.room[idx(m, 4, y)] === 1) && as.left === 0, [1, 2, 3].map((y) => as.room[idx(m, 4, y)]));
  const pairs = R.roomPairs(as.room, m.h, m.cls, m.ter, m.W, m.H, prm);
  const mid = pairs.filter((p) => [4].includes(p.a % m.W) && [5].includes(p.b % m.W) || [4].includes(p.b % m.W) && [5].includes(p.a % m.W));
  ok('3 patched: the rooms now touch, through Hard pairs (the strip is Steep)', mid.length === 3 && mid.every((p) => p.type === ET.SolidHard), mid.length);
}

// ---- 4. the swap of t1/t2 leaks into the next direction (original) ----
{ let s = 7; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; let leaks = 0, cleanLeaks = 0;
  for (let it = 0; it < 300; it++) {
    const W = 6, H = 6, raw = new Float32Array(W * H), ter = new Int32Array(W * H), room = new Int32Array(W * H).fill(1);
    for (let i = 0; i < W * H; i++) { raw[i] = rnd(); ter[i] = Math.floor(raw[i] * 4); }
    for (const g of O.gates(room, ter, raw, W, H, 0.05, 1)) { let up = false; const x = g % W, y = (g / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && ter[ny * W + nx] === ter[g] + 1) up = true; } if (!up) leaks++; }
    const h = Float32Array.from(raw, (v) => v + 0.01), tiles = []; for (let i = 0; i < W * H; i++) tiles.push(i);
    const gp = R.gatePairs(tiles, room, ter, new Uint8Array(W * H).fill(SL.Gentle), h, W, H, 1, true);
    for (const [a, b] of gp.pairs) if (ter[b] !== ter[a] + 1) cleanLeaks++;
  }
  ok('4 original: gates appear on tiles with no neighbour one terrace up (the leak)', leaks > 0, leaks);
  ok('4 patched: every gate pair is (low tile, tile one terrace up)', cleanLeaks === 0);
}

// ---- 5. core centre: the rounded centroid of a U-shaped core is outside the core ----
{ const m = blank(8, 8); m.room.fill(1);
  const core = [[1, 4], [1, 3], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4]]; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) m.ter[idx(m, x, y)] = core.some((t) => t[0] === x && t[1] === y) ? 1 : 0;
  const cs = R.cores(m.room, m.ter, m.cls, [{ id: 1 }], m.W, m.H, 5), u = cs.find((c) => c.terrace === 1);
  ok('5 the original centre (rounded centroid) is not in the core', !u.tiles.includes(u.center), u.center);
  const forb = new Uint8Array(m.n); forb[idx(m, 2, 2)] = 1; // and the nearest tile is forbidden: the centre must skip it
  R.fixCentres([u], forb, m.W);
  ok('5 patched: the centre is a free tile of the core', u.tiles.includes(u.center) && !forb[u.center], u.center);
  const all = new Uint8Array(m.n).fill(1); const v = { ...u, center: u.center0 }; R.fixCentres([v], all, m.W);
  ok('5 patched: a core with every tile forbidden has no centre', v.center === -1);
}

// ---- 6. Steep closes: a pair with a Steep tile is dropped, a Steep tile is never opened ----
{ const m = blank(8, 4); m.room.fill(1); for (let y = 0; y < 4; y++) for (let x = 4; x < 8; x++) m.ter[idx(m, x, y)] = 1;
  m.cls[idx(m, 4, 1)] = SL.Steep; // the high tile of the pair at y = 1
  const tiles = [idx(m, 3, 1), idx(m, 3, 2)], gp = R.gatePairs(tiles, m.room, m.ter, m.cls, m.h, m.W, m.H, 1, true);
  ok('6 the pair with a Steep tile is lost and counted', gp.pairs.length === 1 && gp.stats.lostSteep === 1, JSON.stringify(gp.stats));
  const keep = R.gatePairs(tiles, m.room, m.ter, m.cls, m.h, m.W, m.H, 1, false);
  ok('6 without the rule both pairs would stay', keep.pairs.length === 2);
  const p = R.makePass({ W: m.W, H: m.H, h: m.h, room: m.room, ter: m.ter, cls: m.cls, pairs: [], gate: gp.pairs });
  ok('6 the Steep tile is never entered', !p.pass(idx(m, 3, 1), idx(m, 4, 1)) && !p.pass(idx(m, 4, 1), idx(m, 3, 1)) && p.forb[idx(m, 4, 1)] === 1);
}

// ---- 7. properties on random maps: symmetry, void, pair tiles never forbidden, group minimum ----
{ let s = 11; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; let asym = 0, voidWalk = 0, pairForb = 0, checked = 0, steepIn = 0;
  for (let it = 0; it < 60; it++) {
    const W = 14, H = 14, n = W * H, h = new Float32Array(n), room = new Int32Array(n), ter = new Int32Array(n), cls = new Uint8Array(n);
    for (let i = 0; i < n; i++) { h[i] = rnd() < 0.15 ? 0 : 0.2 + rnd() * 0.8; room[i] = h[i] > 0 ? 1 + Math.floor(rnd() * 3) : 0; ter[i] = Math.floor(h[i] * 3); cls[i] = h[i] <= 0 ? SL.Void : [SL.Flat, SL.Gentle, SL.Gentle, SL.Steep][Math.floor(rnd() * 4)]; }
    const pairs = R.roomPairs(room, h, cls, ter, W, H, { hTol: 0.5, hardEdge: 0.9 }); R.expandFilter(pairs, room, ter, cls, W, H, 2);
    const gp = R.gatePairs([...Array(n).keys()].filter((i) => rnd() < 0.3), room, ter, cls, h, W, H, 1, true);
    const mp = R.makePass({ W, H, h, room, ter, cls, pairs, gate: gp.pairs });
    for (let i = 0; i < n; i++) { const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; checked++; if (mp.pass(i, j) !== mp.pass(j, i)) asym++; if (mp.pass(i, j) && (h[i] <= 0 || h[j] <= 0)) voidWalk++; if (mp.pass(i, j) && (cls[i] === SL.Steep || cls[j] === SL.Steep)) steepIn++; } }
    for (const p of pairs) if (p.type === ET.Transition && (mp.forb[p.a] || mp.forb[p.b])) pairForb++;
    for (const [a, b] of gp.pairs) if (mp.forb[a] || mp.forb[b]) pairForb++;
  }
  ok('7 the passability function is symmetric', asym === 0 && checked > 5000, [asym, checked]);
  ok('7 void is never walkable and Steep is never entered', voidWalk === 0 && steepIn === 0, [voidWalk, steepIn]);
  ok('7 the tiles of valid pairs are never forbidden', pairForb === 0, pairForb);
}

// ---- 8. shortest paths: BFS lengths equal an independent A* with the same step function ----
{ const m = blank(12, 12); m.room.fill(1); for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if ((x === 5 && y !== 9) || (y === 6 && x > 7)) m.cls[idx(m, x, y)] = SL.Steep;
  const step = (a, b) => m.cls[a] !== SL.Steep && m.cls[b] !== SL.Steep, start = idx(m, 1, 1), goal = idx(m, 10, 10);
  const open = [[0, start]], cost = new Map([[start, 0]]);
  while (open.length) { open.sort((a, b) => a[0] - b[0]); const [, c] = open.shift(); if (c === goal) break; const cx = c % 12, cy = (c / 12) | 0; for (const [dx, dy] of N4) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= 12 || ny >= 12) continue; const j = ny * 12 + nx; if (!step(c, j)) continue; const nc = cost.get(c) + 10; if (!cost.has(j) || nc < cost.get(j)) { cost.set(j, nc); open.push([nc + Math.abs(goal % 12 - nx) + Math.abs(((goal / 12) | 0) - ny), j]); } } }
  ok('8 BFS length equals the A* length', R.bfs(12, 12, start, step, false).dist[goal] === cost.get(goal) / 10 && cost.has(goal));
  const sp = R.spanning(12, 12, [start, goal, idx(m, 1, 10)], step); ok('8 spanning tree joins 3 centres with 2 edges', sp.tree.length === 2 && sp.trees === 1 && sp.largest === 3);
}

console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
