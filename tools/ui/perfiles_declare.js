/* SHAPE PROFILES, PART B: the generator of the DECLARED data of the mockups (docs/crystallizers/03-stage/research/octopath2/stage_perfiles_mockup_go.md). It reads each mockup room in the viewer (the room's walkable tiles, the path of `props`, the view axis of `E.orient`) and writes the rectangles / polylines that the examples of src/modes.js
   declare as DATA (`blocked`, `volumes`, `ribbon`, in MAP coordinates). It is a authoring aid: the viewer never calls it and nothing it writes is a rule. Run it, paste the JSON into src/modes.js (tools/ui/perfiles_declare.js --apply does the paste).
     NODE_PATH=$(npm root -g) node tools/ui/perfiles_declare.js <out.json> [--stage blocked|rest] */
const fs = require('fs');
const { open } = require('./common');
const out = process.argv[2], stage = process.argv.includes('--stage') ? process.argv[process.argv.indexOf('--stage') + 1] : 'rest';
if (!out) { console.error('usage: perfiles_declare.js <out.json> [--stage blocked|rest]'); process.exit(2); }
const SPEC = { // per example: the profile data of the mockup
  perfil_m1: { masses: 4, decalH: 6 },
  perfil_m2: { masses: 4, decalH: 6, narrowTiles: [-4,4] }, // the hand reduction: the walkable tiles whose lateral offset from the path axis is outside [-2, +3] are blocked (6 tiles = 4 H)
  perfil_m3: { masses: 4, decalH: 6 },
  perfil_c0: { masses: 0, decalH: 6 } // the control: no profile, no masses of ours (the base v2.4 planes only); the decal is the Base's C3
};
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const res = {};
  for (const id of Object.keys(SPEC)) {
    if (stage === 'blocked') await ev((id) => { const ex = window.EVO.modes.byId('stage').examples.find((x) => x.id === id); ex.blocked = []; }, id); // the reduction is computed on the UNREDUCED room
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    res[id] = await ev(({ spec, stage }) => {
      const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, tp = st.stage.tilesPerH, W = S.W, H = S.H, n = S.n, rid = st.stageRooms[0], rec = S.orient.byId.get(rid), zm = E.stage.zoneMap(S);
      const look = E.orient.lookOf(rec.yaw), f = [look[0], look[1]], r = [-f[1], f[0]], A = (i) => (i % W) * f[0] + ((i / W) | 0) * f[1], Pc = (i) => (i % W) * r[0] + ((i / W) | 0) * r[1];
      const walk = (i) => zm[i] === rid && E.stage.walkable(S, i) && S.region[i] >= 0;
      const path = (S.propsC && S.propsC.data ? S.propsC.data.path : []), res = { room: rid, yaw: rec.yaw, f, tp, ox: S.ox, oy: S.oy, pathN: path.length };
      // merge a set of window tiles into rectangles (maximal runs along x, then equal runs stacked along y)
      const rects = (set) => { const rows = new Map(); for (const i of set) { const y = (i / W) | 0; (rows.get(y) || rows.set(y, []).get(y)).push(i % W); } const runs = []; for (const [y, xs] of rows) { xs.sort((p, q) => p - q); let s = xs[0], p = xs[0]; for (let k = 1; k <= xs.length; k++) { if (k < xs.length && xs[k] === p + 1) { p = xs[k]; continue; } runs.push({ y, x0: s, x1: p }); if (k < xs.length) { s = xs[k]; p = xs[k]; } } }
        const used = new Set(), outR = []; runs.sort((p, q) => p.x0 - q.x0 || p.x1 - q.x1 || p.y - q.y); for (let k = 0; k < runs.length; k++) { if (used.has(k)) continue; let d = 1; used.add(k); for (let m = k + 1; m < runs.length; m++) if (!used.has(m) && runs[m].x0 === runs[k].x0 && runs[m].x1 === runs[k].x1 && runs[m].y === runs[k].y + d) { used.add(m); d++; } outR.push([runs[k].x0 + S.ox, runs[k].y + S.oy, runs[k].x1 - runs[k].x0 + 1, d]); } return outR; };
      // the centre line of the room along the view axis: for every row a, the mean lateral coordinate of the path tiles on it (nearest row if none)
      const pa = path.map((t) => A(t)), pp = path.map((t) => Pc(t)), axisAt = (a) => { let s = 0, c = 0; for (let k = 0; k < path.length; k++) if (pa[k] === a) { s += pp[k]; c++; } if (c) return s / c; let b = 0, bd = 1e9; for (let k = 0; k < path.length; k++) { const d = Math.abs(pa[k] - a); if (d < bd) { bd = d; b = k; } } return pp[b]; };
      const room = []; for (let i = 0; i < n; i++) if (walk(i)) room.push(i);
      if (stage === 'blocked') { // the hand reduction (M2 only)
        if (spec.narrowTiles) { const [lo, hi] = spec.narrowTiles, drop = []; for (const i of room) { const c = Math.round(axisAt(A(i))), p = Pc(i); if (p < c + lo || p > c + hi) drop.push(i); } res.blocked = rects(drop); res.droppedTiles = drop.length; res.keptTiles = room.length - drop.length; }
        return res;
      }
      // masses: the blocked non-void tiles within 5 tiles (laterally) of the room's remaining walkable tiles, rows a in [aMin - 2, aMax + 2]
      const aMin = Math.min(...room.map(A)), aMax = Math.max(...room.map(A)), byRow = new Map(); for (const i of room) { const q = byRow.get(A(i)) || { lo: 1e9, hi: -1e9 }; q.lo = Math.min(q.lo, Pc(i)); q.hi = Math.max(q.hi, Pc(i)); byRow.set(A(i), q); }
      const rowAt = (a) => { if (byRow.has(a)) return byRow.get(a); let b = null, bd = 1e9; for (const [k, v] of byRow) { const d = Math.abs(k - a); if (d < bd) { bd = d; b = v; } } return b; };
      if (spec.masses) { const set = []; for (let i = 0; i < n; i++) { if (!S.block[i] || (S.void && S.void[i]) || (S.water && S.water[i]) || walk(i)) continue; const a = A(i); if (a < aMin - 2 || a > aMax + 2) continue; const q = rowAt(a), p = Pc(i); const d = p < q.lo ? q.lo - p : p > q.hi ? p - q.hi : 0; if (d >= 1 && d <= 5) set.push(i); } res.masses = { hH: spec.masses, rects: rects(set), tiles: set.length }; }
      // the decal C3 at the hotspot (k4 of the path): a ring + a hexagram of diameter min(decalH H, the width of the room at that row), tile-quantized by the ribbon
      const k4 = path[Math.floor(4 * (path.length - 1) / 8 + 0.5)], q4 = rowAt(A(k4)), wRow = (q4.hi - q4.lo + 1) / tp, D = Math.min(spec.decalH, wRow) * tp, rho = D / 2, cx = (k4 % W) + 0.5 + S.ox, cy = ((k4 / W) | 0) + 0.5 + S.oy;
      const ring = []; for (let k = 0; k <= 32; k++) { const t = 2 * Math.PI * k / 32; ring.push([+(cx + rho * Math.cos(t)).toFixed(2), +(cy + rho * Math.sin(t)).toFixed(2)]); }
      const tri = (off) => { const p = []; for (let k = 0; k <= 3; k++) { const t = off + 2 * Math.PI * k / 3; p.push([+(cx + rho * Math.cos(t)).toFixed(2), +(cy + rho * Math.sin(t)).toFixed(2)]); } return p; };
      res.decal = { hotspot: [cx, cy], widthRowH: wRow, diameterH: D / tp, ring, tri1: tri(-Math.PI / 2), tri2: tri(Math.PI / 2) };
      res.room = { rid, tiles: room.length, aMin, aMax };
      return res;
    }, { spec: SPEC[id], stage });
    console.log(id, stage, JSON.stringify(res[id]).slice(0, 220));
  }
  fs.writeFileSync(out, JSON.stringify(res)); console.log('errors', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
