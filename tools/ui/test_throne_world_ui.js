/* THE THRONE WORLD, COMMIT 1 (mode 3) in the viewer: the example `throne_aliahan` (src/modes.js, src/ui.js `thronePack`, the PNGs of docs/crystallizers/03-stage/refs/dq3/throne_aliahan/, "MAPA 1").
   (1) the example exists in mode 3 only; entering it sets what it declares: terraces 2, subs 8, pre 0, tilesPerH 1.5, heroFrac 0.11, heroScreen (0.52, 0.62), the window [NAVE] (raw id 1), the hero on the axis 3 old tiles from the dais, and the DECLARATION (CLAUDE.md "COMPOSITION RULES" (c)):
       orient / planes / props ON, volumes and objects EMPTY, no ribbon;
   (2) the world: 624 walkable tiles in ONE zone (NAVE: the dais, the carpet, the side floor, the entrance passage and its landing) and ONE region, nothing dropped, 0 stairs; the six pillars are 24 blocked tiles of the zone PILLAR outside the window, inside the footprint of the nave; the walls are terrain of another zone;
   (3) `orient`: ONE room, Hub yaw 0 toward the POI goal (the throne) all along the way, the entrance passage included; `planes` and `props` do their rules (reported);
   (4) the heights: every walkable tile has the sub-level its character has in map1.txt (no stray slab), the six sub-levels 0 .. 1.053 H;
   (5) the WALK (rule 4): from 3 positions (the axis 3 old tiles from the dais, the entrance passage, 4 old tiles off the axis) the hero walks 4 directions: every step stays on a walkable tile of the window (no void, no foreign terrain, no pillar), and stops where map1.txt has a non-walkable tile (the pillars and the walls), else it reaches 8 old tiles;
       the route entrance -> nave -> dais in the walking graph (climb limit 2 sub-levels) exists and takes single steps of 1 sub-level;
   (6) no leak: another example of mode 3 (Forest B) starts with pre 1 and tilesPerH 2, and leaving the window restores the pre-smoothing;
   (7) reported, not asserted: the draw cost against Forest B, the empty background of the frame, the share of the screen that the props billboards cover.
     NODE_PATH=$(npm root -g) node tools/ui/test_throne_world_ui.js */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
const GRID = fs.readFileSync(path.join(__dirname, '../../docs/crystallizers/03-stage/refs/dq3/throne_aliahan/map1.txt'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
const SUB = 0.2105;
const lvlOf = (c) => (/[0-5]/.test(c) ? +c : /[a-f]/.test(c) ? c.charCodeAt(0) - 97 : c === 'T' ? 5 : /[GE]/.test(c) ? 0 : -1); // the sub-level of a walkable character, -1 = not walkable
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); await idle(); };
  // (1) the example
  await ev(() => window.__evo.setMode('stage')); await idle();
  const ex = await ev(() => ({ s: window.EVO.modes.byId('stage').examples.some((x) => x.id === 'throne_aliahan'), others: ['terrain', 'rooms', 'curves'].some((m) => window.EVO.modes.byId(m).examples.some((x) => x.id === 'throne_aliahan')) }));
  ok('the example `throne_aliahan` is an example of mode 3 and of no other mode', ex.s && !ex.others, ex);
  let t0 = Date.now(); await clickEx('throne_aliahan'); const enterMs = Date.now() - t0;
  const D = await ev(() => { const e = window.__evo, S = e.S(); return { win: !!e.st.win, rooms: e.st.stageRooms.slice(), pre: e.P.pre, subs: e.P.subs, ter: e.P.terraces, tph: e.st.stage.tilesPerH, hf: e.st.stage.heroFrac, hs: e.st.stage.heroScreen, hero: e.st.hero, src: e.st.pack, terH: e.P.terH, subH: e.P.subH, units: e.st.stageUnits, orient: e.st.stage.orient, planes: e.st.stage.planes, props: e.st.stage.props, volumes: e.st.stage.volumes, vlist: e.st.stage.volumeList.length, objects: e.st.stage.objects, olist: e.st.stage.objectList.length, rlist: e.st.stage.ribbonList.length, tech: e.st.tech, yawBase: e.st.stage.yaw, W: S.W, H: S.H, ox: S.ox, oy: S.oy }; });
  ok(`entering it declares: terraces ${D.ter}, subs ${D.subs}, pre ${D.pre}, tilesPerH ${D.tph}, heroFrac ${D.hf}, heroScreen ${D.hs}, terH ${D.terH} = 2 H, subH ${D.subH} = 0.22 x terH (Measures in H ${D.units}), technique ${D.tech}, no fixed yaw (${D.yawBase})`,
     D.win && D.src === 'throne' && D.ter === 2 && D.subs === 8 && D.pre === 0 && D.tph === 1.5 && D.hf === 0.11 && D.hs.join() === '0.52,0.62' && D.terH === 3 && Math.abs(D.subH - 0.66) < 1e-9 && D.units === true && D.tech === 'box' && D.yawBase === undefined, D);
  ok(`the window is [NAVE] alone (the place ${D.rooms} in the zone table), the hero starts on the axis at (${D.hero.x}, ${D.hero.y}) = 3 old tiles from the dais front`, D.rooms.join() === '1' && D.hero.x === 17 && D.hero.y === 18, D);
  ok(`DECLARATION: orient ${D.orient}, planes ${D.planes}, props ${D.props} are ON (no rule off); volumes ${D.volumes} with ${D.vlist} declared, objects ${D.objects} with ${D.olist}, ribbons ${D.rlist}: empty (commits 2 and 3)`, D.orient === 'on' && D.planes === 'on' && D.props === 'on' && D.vlist === 0 && D.olist === 0 && D.rlist === 0, D);
  // (2) the world
  const W = await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), zm = E.stage.zoneMap(S), cnt = { 1: 0, 2: 0 }; let walk = 0, block = 0, pil = 0, wall = 0, foreign = 0; const regs = new Set(); const info = S.stageZonesInfo;
    for (let i = 0; i < S.n; i++) { const raw = E.stage; if (!S.block[i]) { walk++; regs.add(S.region ? S.region[i] : 0); if (zm[i] === 1 || zm[i] === 2) cnt[zm[i]]++; else foreign++; } else block++; }
    const pk = e.packs.throne.pack, zid = pk.fields.zone.ids; for (let i = 0; i < S.n; i++) { const raw = zid[(((i / S.W) | 0) + S.oy) * pk.width + (i % S.W) + S.ox]; if (raw === 3) { pil++; if (!S.block[i]) foreign += 1000; } if (raw === 4 && !S.block[i]) foreign += 1000000; }
    return { walk, block, cnt, regs: [...regs], foreign, pil, dropped: info.total, stairs: (S.stairs || []).length, readout: document.querySelector('#info').innerText }; });
  ok(`624 walkable tiles (all of them in the zone NAVE: ${W.cnt[1]}) in ${W.regs.length} walking region, ${W.dropped} dropped by the footprint rule, ${W.stairs} stairs carved, no walkable tile of another zone (${W.foreign})`, W.walk === 624 && W.cnt[1] === 624 && !W.cnt[2] && W.regs.length === 1 && W.dropped === 0 && W.stairs === 0 && W.foreign === 0, W);
  ok(`the six pillars are ${W.pil} blocked tiles (6 x 2 x 2) outside the window, loose inside the footprint of the nave; the walls are terrain of another zone`, W.pil === 24 && W.block === 34 * 34 - 624, W);
  // (3) orient / planes / props
  const O3 = await ev(() => { const S = window.__evo.S(); return { orient: S.orient.rooms.map((r) => ({ id: r.id, dir: r.dir, yaw: r.yaw, L: r.L, W: r.W, why: r.why })), planes: S.stagePlanes && { wall: S.stagePlanes.wall, cols: S.stagePlanes.cols, front: S.stagePlanes.front, skipped: S.stagePlanes.skipped }, view: window.__evo.view().yaw }; });
  const nave = O3.orient[0];
  ok(`orient: ONE record (${O3.orient.length}), ${nave.dir} yaw ${nave.yaw} (L ${nave.L} x W ${nave.W}, "${nave.why}"): the camera looks at the throne from the entrance passage to the dais; the view yaw with the hero on the axis is ${O3.view}`, O3.orient.length === 1 && nave.dir === 'Hub' && nave.yaw === 0 && /POI goal/.test(nave.why) && O3.view === 0, O3);
  { const yaws = []; for (const [x, y] of [[17, 27], [17, 25], [17, 18], [9, 18], [17, 8]]) { await ev(([x, y]) => { const e = window.__evo; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await idle(); yaws.push(await ev(() => window.__evo.view().yaw)); }
    ok(`the camera yaw is ${yaws} at the entrance passage, its landing side, the axis, off the axis and the dais: one cut-less yaw 0 all along the way`, yaws.every((v) => v === 0), yaws); await ev(() => { const e = window.__evo; e.st.hero = { x: 17, y: 18 }; e.redraw(); }); await idle(); }
  console.log('planes (reported): ' + JSON.stringify(O3.planes) + '\nreadout: ' + W.readout.split('\n')[0].split('·').filter((s) => /props|planes|room /.test(s)).join('·'));
  // (4) the heights
  const H4 = await ev(() => { const e = window.__evo, S = e.S(), tph = e.st.stage.tilesPerH, lv = {}; const out = []; for (let i = 0; i < S.n; i++) if (!S.block[i]) out.push([(i % S.W) + S.ox, ((i / S.W) | 0) + S.oy, S.levelH[S.fine[i]] / tph]); return out; });
  { let bad = 0, max = 0; for (const [x, y, h] of H4) { const l = lvlOf(GRID[y >> 1][x >> 1]); max = Math.max(max, h); if (l < 0 || Math.abs(h - l * SUB) > 0.004) bad++; }
    ok(`every walkable tile has the sub-level of its character in map1.txt (${bad} of ${H4.length} differ: no stray slab); the highest is ${max.toFixed(3)} H = 5 sub-levels (the remake: 0.94 H)`, bad === 0 && Math.abs(max - 1.053) < 0.004, { bad, max }); }
  // (5) the walk
  await ev(() => { window.__walk = (sx, sy, dir) => { const e = window.__evo, E = window.EVO, S = e.S(), yaw = e.view().yaw, zm = E.stage.zoneMap(S); let p = { x: sx - S.ox, y: sy - S.oy }; const seq = [], tph = e.st.stage.tilesPerH; for (let k = 0; k < 80; k++) { const n = E.stage.move(S, p, dir, yaw, tph); if (!n) break; p = n; const i = E.stage.cellOf(S, p.x, p.y); seq.push({ x: p.x + S.ox, y: p.y + S.oy, i, z: i >= 0 ? zm[i] : -1, blocked: i >= 0 ? S.block[i] : 1, voidT: i >= 0 && S.void ? S.void[i] : 0 }); if (Math.hypot(p.x - (sx - S.ox), p.y - (sy - S.oy)) >= 16) break; } return seq; }; });
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, STARTS = { 'axis, 3 old tiles from the dais': [17, 18], 'entrance passage': [17, 27], 'off the axis (4 old tiles)': [9, 18] };
  const expectDist = (sx, sy, d) => { let x = sx, y = sy; const [dx, dy] = DIRS[d]; for (let k = 0; k < 400; k++) { const nx = x + dx * 0.05, ny = y + dy * 0.05, c = GRID[Math.floor(ny) >> 1] && GRID[Math.floor(ny) >> 1][Math.floor(nx) >> 1]; if (!c || lvlOf(c) < 0) return Math.hypot(x - sx, y - sy); x = nx; y = ny; if (Math.hypot(x - sx, y - sy) >= 16) return 16; } return 16; };
  const rows = []; let allOk = true;
  for (const [name, [sx, sy]] of Object.entries(STARTS)) for (const d of Object.keys(DIRS)) {
    const seq = await ev(([sx, sy, d]) => window.__walk(sx, sy, d), [sx, sy, d]), last = seq.length ? seq[seq.length - 1] : { x: sx, y: sy }, dist = Math.hypot(last.x - sx, last.y - sy), exp = expectDist(sx, sy, d);
    const valid = seq.every((s) => s.i >= 0 && s.z === 1 && !s.blocked && !s.voidT), match = dist >= Math.min(16, exp) - 0.8 && dist <= Math.min(16, exp) + 0.4; // one step is 0.375 tiles
    rows.push(`${name} ${d}: ${(dist / 2).toFixed(1)} old tiles (expected ${(exp / 2).toFixed(1)})${valid ? '' : ' INVALID'}`); if (!valid || !match) allOk = false; }
  console.log(rows.join('\n'));
  ok('the WALK: from 3 positions in 4 directions the hero only visits walkable tiles of the window (no void, no foreign terrain, no pillar) and stops where map1.txt has a wall, a pillar or the parapet, else after 8 old tiles', allOk, rows);
  const R = await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), nb = E.walkGraph(S, e.P), W = S.W, at = (x, y) => y * W + x, from = at(17, 27), goal = at(17, 7), lvl = (i) => S.levelH[S.fine[i]] / e.st.stage.tilesPerH, par = new Map([[from, -1]]), q = [from];
    for (let h = 0; h < q.length; h++) for (const j of nb(q[h])) if (!par.has(j)) { par.set(j, q[h]); q.push(j); } if (!par.has(goal)) return { reached: false }; const path = []; for (let i = goal; i >= 0; i = par.get(i)) path.push(i); path.reverse(); let maxStep = 0, up = 0; for (let k = 1; k < path.length; k++) { const d = lvl(path[k]) - lvl(path[k - 1]); maxStep = Math.max(maxStep, Math.abs(d)); up += Math.max(0, d); } return { reached: true, len: path.length, maxSubStep: +(maxStep / 0.2105).toFixed(2), climbed: +up.toFixed(3), top: +lvl(goal).toFixed(3) }; });
  ok(`the route entrance -> nave -> dais (the throne tile) exists in the walking graph (${R.len} tiles): it climbs ${R.climbed} H = 5 sub-levels in steps of at most ${R.maxSubStep} sub-level (the climb limit is 2): no stairs needed`, R.reached && R.maxSubStep <= 1.01 && Math.abs(R.climbed - 1.053) < 0.01, R);
  // (6) no leak
  await clickEx('forest_b'); const L = await ev(() => ({ pre: window.__evo.P.pre, tph: window.__evo.st.stage.tilesPerH, subs: window.__evo.P.subs, ter: window.__evo.P.terraces }));
  ok(`another example of mode 3 (Forest B) starts with pre ${L.pre} (the default 1) and tilesPerH ${L.tph} (2): the example's values do not leak`, L.pre === 1 && L.tph === 2 && L.subs === 3 && L.ter === 4, L);
  await clickEx('throne_aliahan'); await ev(() => window.__evo.setMode('terrain')); await idle(); await idle();
  ok(`leaving the window (mode 1) restores the pre-smoothing (${await ev(() => window.__evo.P.pre)}), the sub-terraces and the terraces`, (await ev(() => [window.__evo.P.pre, window.__evo.P.subs, window.__evo.P.terraces].join())) === '1,3,5');
  // (7) reported
  await ev(() => window.__evo.setMode('stage')); await idle(); await clickEx('throne_aliahan');
  const ms = async () => { const r = []; for (let i = 0; i < 3; i++) { const t = Date.now(); await ev(() => window.__evo.draw()); await idle(); r.push(Date.now() - t); } return r; };
  const mt = await ms(); await clickEx('forest_b'); const mf = await ms(); await clickEx('throne_aliahan');
  const F = await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = e.st.persH || cv.clientHeight, D = E.pickBuffer(S, e.P, e.view(), w, h).data; let empty = 0; for (let q = 0; q < w * h; q++) if (D[q * 4 + 3] !== 255) empty++; return { w, h, emptyPct: +(100 * empty / (w * h)).toFixed(2) }; });
  const snap = () => ev(() => { const cv = document.querySelector('#stage canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; return Array.from(d); });
  const withProps = await ev(() => { const cv = document.querySelector('#stage canvas'); window.__s1 = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.slice(); return true; });
  await page.click('#t-stageProps'); await idle(); await idle(); const share = await ev(() => { const cv = document.querySelector('#stage canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, s = window.__s1; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - s[i]) + Math.abs(d[i + 1] - s[i + 1]) + Math.abs(d[i + 2] - s[i + 2]) > 30) n++; return +(100 * n / (d.length / 4)).toFixed(2); }); await page.click('#t-stageProps'); await idle();
  console.log(`reported: select + build ${enterMs} ms; draw ms throne ${mt.join('/')} vs Forest B ${mf.join('/')}; empty background of the frame (hero on the axis, 3 old tiles from the dais) ${F.emptyPct} %; pixels changed by the props billboards ${share} % of the panel (${F.w} x ${F.h})`);
  ok('no page errors', a.errs.length === 0, a.errs.slice(0, 3));
  console.log(`\n${pass} passed, ${fail} failed`); await a.browser.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
