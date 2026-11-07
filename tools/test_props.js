/* STAGE PROPS BY ROOM, PR C3 (src/props.js, no browser): torches along the path, door pillars and the goal of the "mock T" on the real map (the P of dac_stage; the 6 rooms of its list as one window, the rooms 14 and 44 as windows of their own; every room with the yaw of C1).
   - the table per room: path length, torches, pillars and the goal tile is STABLE;
   - every torch is on a walkable tile of its room and none on a step / ramp / gate tile nor within 1 tile of them; mutation onStairs (no exclusion) FAILS;
   - the torches are one pair every torchEvery (4) rows of view depth along the path; mutation torchEvery 6 FAILS;
   - the goal of the last room of the window (and of a window of one room) is on the highest terrace of the BACK half of the room; mutation metaFront (the NEAR half) FAILS;
   - the path exists in all 8 rooms; an intermediate room has pillars and no goal.
     node tools/test_props.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'stage', 'orient', 'props']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const P = JSON.parse('{"ascCut":0.15,"ascGate":0,"ascRouteKey":"","chainExtra":3,"cakeCut":"off","dioChain":"off","anchors":false,"anchorH":0.5,"terraces":5,"subs":3,"terH":4,"spread":1,"spreadCentre":"largest","curves":"ordered","wallPass":"t3","wallExtrude":0.25,"wallStrata":3,"wallColumn":1.2,"t2Spacing":0.9,"t2Rows":6,"t2Group":1,"t2Jitter":0.4,"subH":0.88,"minPlateau":120,"minSub":3,"pre":1,"smooth":2,"radius":0.9,"passGap":8,"climb":2,"tread":1,"stairW":3,"stairStyle":0,"rampDepth":2,"gateThr":0.05,"gateMin":3,"margin":24,"rooms":true,"ascWalls":false,"ascHeight":1.5,"pocket":false,"pocketFraming":"auto","pocketHeight":2.5,"backdrop":false,"backdropGap":0,"backdropHeight":2,"roomsMinCore":100,"roomsCross":10,"roomsIsoLimit":100,"rRadius":5,"cake":false,"cakeLayers":3,"cakeStep":0.3,"cakePer":1,"cakeSeam":5,"pocketYaw":180,"chainKey":"","chainFail":"","rampPreferFill":true}');
// [path steps, torches, pillars, goal tile (-1 = none)]
const EXP = { 17: [29, 5, 1, -1], 10: [1, 0, 1, -1], 20: [22, 3, 1, -1], 27: [36, 10, 0, -1], 6: [95, 17, 1, -1], 5: [28, 8, 0, 7084], 14: [57, 15, 0, 4428], 44: [93, 27, 0, 1863] };
const WINS = [[17, 10, 20, 27, 6, 5], [14], [44]], HYP = E.props.HYP;
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const shape = (rooms) => E.shape(mk(), P, { rooms: rooms.slice().sort((a, b) => a - b), margin: P.margin });
  const recs = {}, wins = {}, shapes = {}; for (const w of WINS) { const S = shape(w), T = E.orient.compute(S, P, w, 2); shapes[w.join()] = S; for (const r of T.rooms) { recs[r.id] = r; wins[r.id] = w; } }
  const run = (id, test) => { const w = wins[id], S = shapes[w.join()], k = w.indexOf(id); return { S, d: E.props.compute(S, P, recs[id], { tilesPerH: 2, last: k === w.length - 1, next: k < w.length - 1 ? w[k + 1] : 0, test }) }; };
  const W = (S) => S.W;
  const blocked = (S) => { const m = new Uint8Array(S.n); for (const st of S.stairs || []) { for (const s of st.steps || []) for (const t of s.tiles) m[t] = 1; for (const t of st.bottom || []) m[t] = 1; for (const t of st.top || []) m[t] = 1; } const nb = E.walkGraph(S, P); for (let i = 0; i < S.n; i++) if (S.roomMap[i] > 0) for (const j of nb(i)) if (S.roomMap[j] !== S.roomMap[i]) { m[i] = 1; m[j] = 1; } return m; };
  const near1 = (S, m, t) => { const w = S.W, x = t % w, y = (t / w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < S.H && m[yy * w + xx]) return true; } return false; };
  // the table
  const tab = {}; for (const id of Object.keys(EXP)) { const { d } = run(+id); tab[id] = [d.path.length, d.torches.length, d.pillars.length, d.goal ? d.goal.tile : -1]; }
  ok('the table of the 8 rooms (path length, torches, pillars, goal tile) is stable: ' + JSON.stringify(tab), Object.keys(EXP).every((id) => JSON.stringify(tab[id]) === JSON.stringify(EXP[id])), tab);
  ok('a path exists in all 8 rooms; an intermediate room (17, 10, 20) has pillars and no goal, the last room (5) and the rooms of one window (14, 44) have the goal', Object.keys(EXP).every((id) => !run(+id).d.noPath) && [17, 10, 20].every((id) => run(id).d.pillars.length >= 1 && !run(id).d.goal) && [5, 14, 44].every((id) => run(id).d.goal), tab);
  // torches on walkable tiles, never near a transition
  const bad = (test) => { let n = 0, near = 0, tot = 0; for (const id of Object.keys(EXP)) { const { S, d } = run(+id, test), m = blocked(S); for (const t of d.torches) { tot++; if (S.block[t.tile] || S.roomMap[t.tile] !== +id) n++; if (near1(S, m, t.tile)) near++; } } return { n, near, tot }; };
  { const b = bad(); ok(`all ${b.tot} torches stand on walkable tiles of their room, ${b.near} within 1 tile of a step / ramp / gate`, b.n === 0 && b.near === 0 && b.tot > 0, b); }
  { const b = bad({ onStairs: true }); ok(`MUTATION onStairs (no exclusion): ${b.near} torches within 1 tile of a transition: the check FAILS`, b.near > 0, b); }
  // spacing
  const spacing = (test) => { const ks = new Set(); for (const id of Object.keys(EXP)) { const { d } = run(+id, test), u = [...new Set(d.torches.map((t) => t.a))].sort((a, b) => a - b); for (let q = 1; q < u.length; q++) ks.add(Math.abs(u[q] - u[q - 1])); } return [...ks].sort(); };
  { const s = spacing(); ok(`torch pairs are every ${HYP.torchEvery} rows of view depth (the gaps found: ${s})`, s.every((g) => g % HYP.torchEvery === 0) && s.includes(HYP.torchEvery), s); }
  { const s = spacing({ torchEvery: 6 }); ok(`MUTATION torchEvery 6: the gaps are ${s}: the spacing check FAILS`, !(s.every((g) => g % HYP.torchEvery === 0) && s.includes(HYP.torchEvery)), s); }
  // the goal: the highest terrace of the BACK half
  const goalOk = (test) => { const res = {}; for (const id of [5, 14, 44]) { const { S, d } = run(id, test), f = E.orient.lookOf(recs[id].yaw), w = S.W, a = (i) => (i % w) * f[0] + ((i / w) | 0) * f[1]; let tmax = -1; const g = d.goal; for (let i = 0; i < S.n; i++) if (S.roomMap[i] === id && !S.block[i] && S.region && S.region[i] >= 0 && a(i) >= d.aMid) tmax = Math.max(tmax, S.ter[i]); res[id] = { back: a(g.tile) >= d.aMid, highest: g.ter === tmax }; } return res; };
  { const r = goalOk(); ok('the goal of rooms 5, 14 and 44 is in the BACK half on the highest terrace of that half: ' + JSON.stringify(r), Object.values(r).every((x) => x.back && x.highest), r); }
  { const r = goalOk({ metaFront: true }); ok('MUTATION metaFront (the NEAR half): ' + JSON.stringify(r) + ': the BACK-half check FAILS', !Object.values(r).every((x) => x.back), r); }
  // P1: the path follows the centre line of the room along the view axis
  const centred = (test, id) => { const { S, d } = run(id, test), f = E.orient.lookOf(recs[id].yaw), r = [-f[1], f[0]], w = S.W, A = (i) => (i % w) * f[0] + ((i / w) | 0) * f[1], Pc = (i) => (i % w) * r[0] + ((i / w) | 0) * r[1]; const rows = new Map(); for (let i = 0; i < S.n; i++) if (S.roomMap[i] === id && !S.block[i] && S.region && S.region[i] >= 0) { const a = A(i), p = Pc(i), q = rows.get(a); if (!q) rows.set(a, [p, p]); else { q[0] = Math.min(q[0], p); q[1] = Math.max(q[1], p); } }
    const best = new Map(); for (const t of d.path) { const a = A(t), q = rows.get(a); if (!q) continue; const dd = Math.abs(Pc(t) - (q[0] + q[1]) / 2); if (!best.has(a) || dd < best.get(a)) best.set(a, dd); } let good = 0; for (const v of best.values()) if (v <= 1) good++; return { rows: best.size, good, share: best.size ? good / best.size : 0 }; };
  { const c = centred(undefined, 14); ok(`room 14: the path is within 1 tile of the centre line in ${c.good} of its ${c.rows} rows (${(100 * c.share).toFixed(0)} %, at least 90 %)`, c.share >= 0.9, c); }
  { const c = centred({ shortestPath: true }, 14); ok(`MUTATION shortestPath (the C3 route): ${c.good} of ${c.rows} rows (${(100 * c.share).toFixed(0)} %): the centre-line check FAILS`, !(c.share >= 0.9), c); }
  // no torch or pillar within goalClear tiles of the goal
  { let minD = 1e9; for (const id of [5, 14, 44]) { const { d } = run(id); for (const t of d.torches.concat(d.pillars)) minD = Math.min(minD, Math.hypot(t.x - d.goal.x, t.y - d.goal.y)); } ok(`no torch or pillar closer than ${HYP.goalClear} tiles to the goal (the closest: ${minD.toFixed(2)})`, minD >= HYP.goalClear, minD); }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
