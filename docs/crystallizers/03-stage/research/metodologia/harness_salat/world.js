/* SALA T (R1.5 Base + Verificacion 1), in-page library. Loaded into the viewer page (index.html of the frozen tree e882c5c) by the Node harness with
   page.addScriptTag. It does NOT modify src/: it registers a synthetic pack in `__evo.packs`, adds one example to the stage mode, and wraps `E.shape`
   (a page hook, like the G2 hooks) so that, right after the viewer's own shape, the world pass adds: the central staircase (a carved-stair record
   in S.stairs, the same structure carveStairs writes), the absolute heights above the 3 terraces (insertLevels, the same mechanism as border.js /
   volumes.js) and the geometry of the tricks of the current state.
   Coordinates: the brief's (x, z) = tile columns / rows counted from the SOUTH edge; map row y = 55 - z; camera yaw 0 looks toward -y = north. */
(function () {
  'use strict';
  const E = window.EVO, W = 41, H = 56, TP = 2, N = W * H;
  const Yz = (z) => 55 - z, idx = (x, z) => Yz(z) * W + x;
  const S0 = (window.SALAT = { W, H, TP, N, Yz, idx });
  S0.state = { on: {}, placebo: false, positions: null };
  S0.params = {};

  /* ---------- the world table (brief section 1) ---------- */
  const T = { walk: 1, salon: 2, blue: 3 };
  const pieces = []; // {name, zone, h (H, absolute), x0, x1, z0, z1} in painting order (later overrides)
  const P_ = (name, zone, h, x0, x1, z0, z1) => pieces.push({ name, zone, h, x0, x1, z0, z1 });
  P_('muro_ext_w', T.blue, 5.5, 0, 1, 0, 55); P_('muro_ext_e', T.blue, 5.5, 39, 40, 0, 55);
  for (const [a, b] of [[2, 7], [33, 38]]) { P_('anillo_L0', T.blue, 1.25, a, b, 0, 17); P_('anillo_L1', T.blue, 2.5, a, b, 18, 38); }
  P_('muro_lat_w', T.blue, 4, 4, 7, 39, 51); P_('muro_lat_e', T.blue, 4, 33, 36, 39, 51);
  P_('muro_norte', T.blue, 4, 4, 36, 52, 55);
  P_('frente_sur_w', T.blue, 1.25, 8, 17, 0, 3); P_('frente_sur_e', T.blue, 1.25, 23, 32, 0, 3);
  P_('entrada', T.walk, 1.25, 18, 22, 0, 3);
  P_('L0', T.walk, 1.25, 8, 32, 4, 17);
  P_('franja_w', T.blue, 1.25, 8, 10, 4, 9); P_('franja_e', T.blue, 1.25, 30, 32, 4, 9);
  P_('base_par_w', T.blue, 1.25, 14, 15, 15, 17); P_('base_par_e', T.blue, 1.25, 25, 26, 15, 17);
  P_('pretil_w', T.blue, 1.25, 8, 16, 17, 17); P_('pretil_e', T.blue, 1.25, 24, 32, 17, 17); // Enmienda 3: south parapet strip (blocked, L0 height, stairs free)
  P_('escalera', T.walk, 1.25, 17, 23, 14, 17); // heights of the treads are set by the world pass
  P_('L1', T.walk, 2.5, 8, 32, 18, 37);
  P_('hotspot', T.walk, 2.5, 17, 23, 28, 34);
  P_('isla', T.blue, 2.5, 10, 13, 22, 26);
  P_('labio', T.blue, 2.5, 8, 32, 38, 38);
  P_('salon', T.salon, 0, 8, 32, 39, 51);
  S0.pieces = pieces;
  S0.closureH = 5.5;
  S0.setClosure = (h) => { S0.closureH = h; for (const p of pieces) if (p.name === 'muro_ext_w' || p.name === 'muro_ext_e' || p.name === 'muro_norte') p.h = h; S0.table = tileTable(); };
  // elevation (pack units) of a terrace class: 3 terraces over the land range [100, 900]
  const elOf = (h) => (h < 0.6 ? 100 : h < 1.9 ? 500 : 900);
  const tileTable = () => {
    const zone = new Int32Array(N), hgt = new Float32Array(N).fill(NaN), name = new Array(N).fill('');
    for (const p of pieces) for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) { const i = idx(x, z); zone[i] = p.zone; hgt[i] = p.h; name[i] = p.name; }
    return { zone, hgt, name };
  };
  S0.table = tileTable();
  S0.buildPack = () => {
    const { zone, hgt } = S0.table, ele = new Float32Array(N); let voidN = 0; const cnt = new Map();
    for (let i = 0; i < N; i++) { if (zone[i] === 0) { ele[i] = 0; voidN++; } else { ele[i] = elOf(hgt[i]); cnt.set(zone[i], (cnt.get(zone[i]) || 0) + 1); } }
    const ids = Int32Array.from(zone);
    return { format: 'evodun-pack/0.2', name: 'SALAT_T', width: W, height: H, elevation: ele, elevRange: [100, 900], voidTiles: voidN, masks: {}, markers: [], warnings: [],
      fields: { zone: { ids, amb: new Uint8Array(N), info: { mode: 'value', maxnode: 0, tolDeg: 0, classes: [...cnt].sort((a, b) => a[0] - b[0]).map(([id, count]) => ({ id, count })), outside: voidN, ambiguous: { total: 0, kept: 0, noHue: 0, lowChroma: 0, far: 0, reserved: 0 } } } } };
  };

  /* ---------- the world pass (runs after E.shape for the SALAT_T pack) ---------- */
  const META = (ter, extra) => Object.assign({ ter, sub: 0, bridge: false, deco: true, vol: true }, extra || {});
  const STAIR_X = [17, 18, 19, 20, 21, 22, 23], STAIR_Z = [14, 15, 16, 17];
  const treadH = (k) => (1.25 + 0.25 * (k + 1)) * TP; // k = 0..3 -> 3.0, 3.5, 4.0, 4.5 tiles (L0 = 2.5, L1 = 5.0): 5 risers of 0.25 H
  function recomputeRegions(S, P) { // same rules as computeRegions of src/shape.js (rooms off), after the staircase record exists
    const n = S.n, Wd = S.W, par = new Int32Array(n).map((_, i) => i);
    const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
    const adj4 = (a, b) => Math.abs(a - b) === Wd || (Math.abs(a - b) === 1 && ((a / Wd) | 0) === ((b / Wd) | 0));
    for (let y = 0; y < S.H; y++) for (let x = 0; x < Wd; x++) {
      const i = y * Wd + x; if (S.block[i]) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy; if (nx >= Wd || ny >= S.H) continue; const j = ny * Wd + nx; if (S.block[j] || S.carved[i] || S.carved[j]) continue; if (S.ter[i] === S.ter[j] && Math.abs(S.sub[i] - S.sub[j]) <= P.climb) uni(i, j); }
    }
    for (const st of S.stairs) for (let ci = 0; ci < st.cols.length; ci++) { let prev = st.bottom[ci]; for (const step of st.steps) { uni(prev, step.tiles[ci]); prev = step.tiles[ci]; } uni(prev, st.top[ci]); if (ci > 0) for (const step of st.steps) if (adj4(step.tiles[ci - 1], step.tiles[ci])) uni(step.tiles[ci - 1], step.tiles[ci]); }
    const idOf = new Map(), region = new Int32Array(n).fill(-1), sizes = [];
    for (let i = 0; i < n; i++) { if (S.block[i]) continue; const r = find(i); if (!idOf.has(r)) { idOf.set(r, sizes.length); sizes.push(0); } region[i] = idOf.get(r); sizes[region[i]]++; }
    S.region = region; S.regionSizes = sizes; delete S._walk; delete S._stairTile; delete S._stairNear;
  }
  /* the tiles of a trick, from the current params (also used by the Node side for boxes): returns { tiles: [{i, h, meta}], ... } as absolute heights in tiles */
  const groundOf = (S, i) => S.levelH[S.fine[i]];
  function trickMoves(S, id, P) { // moves of trick `id` over the BASE ground (levels of the base shape + walls), absolute tile heights
    const out = [], q = S0.params[id]; if (!q) return out;
    const add = (x, z, h, meta) => out.push({ i: idx(x, z), h, meta });
    if (id === 'A6') { // north rail on the lip (z 38) and south parapet on the strip (z 17): rail 0.8 H over L1, posts 1.4 H
      const base = 2.5 * TP; const nx0 = q.nx0 === undefined ? 8 : q.nx0, nx1 = q.nx1 === undefined ? 32 : q.nx1;
      const runs = []; if (q.north !== false) runs.push([nx0, nx1, 38, 'N']); if (q.south !== false) { runs.push([8, 16, 17, 'S']); runs.push([24, 32, 17, 'S']); }
      for (const [a, b, z, k] of runs) { for (let x = a; x <= b; x++) add(x, z, base + q.rail * TP, META(2));
        if (!q.noPosts) { if (k === 'N' && a === 8 && b === 32) { for (const [p0, p1] of [[8, 9], [12, 13], [16, 17], [20, 21], [24, 25], [28, 29], [31, 32]]) for (let x = p0; x <= p1; x++) add(x, z, base + q.post * TP, META(2)); } else for (let x = a; x <= b; x += 4) for (let xx = x; xx <= Math.min(x + 1, b); xx++) add(xx, z, base + q.post * TP, META(2)); } }
    } else if (id === 'A3a' || id === 'A3b') { // a block of w x d tiles whose min corner is q.x, q.z (brief: x, z), height q.h (H) over the local ground
      for (let z = q.z; z < q.z + q.d; z++) for (let x = q.x; x < q.x + q.w; x++) { const i = idx(x, z); add(x, z, S0.baseGround(S, i) + q.h * TP, META(S.ter[i])); }
    } else if (id === 'A4') { if (q.panel) { for (let x = q.panel.x0; x <= q.panel.x1; x++) add(x, 51, S0.baseGround(S, idx(x, 51)) + q.panel.h * TP, Object.assign(META(2), { anchor: true })); return out; } if (q.cut === false) return out; // A4b: the wall is NOT cut (only the billboard exists)
      // the cut: the wall tiles x 18-22, z 52-55 down to the floor of the salon (level 0)
      for (let z = 52; z <= 55; z++) for (let x = 18; x <= 22; x++) add(x, z, 0, META(0));
    } else if (id === 'C2') { // one column of 2 x 2 tiles on each base of the pair
      for (const [x0, z0, cw, cd] of q.cols) for (let z = z0; z < z0 + (cd || 2); z++) for (let x = x0; x < x0 + (cw || 2); x++) { const i = idx(x, z); add(x, z, S0.baseGround(S, i) + q.h * TP, META(S.ter[i])); }
    } else if (id === 'B3') { // the island up to 4 H absolute
      { const bx = q.x === undefined ? 10 : q.x, bz = q.z === undefined ? 22 : q.z, bw = q.w || 4, bd = q.d || 5; for (let z = bz; z < bz + bd; z++) for (let x = bx; x < bx + bw; x++) add(x, z, S0.baseGround(S, idx(x, z)) + q.h * TP, META(2)); }
    }
    return out;
  }
  S0.baseGround = (S, i) => (S.__base ? S.__base[i] : groundOf(S, i)); // ground height of the BASE world (walls and stairs included, tricks excluded)
  function worldPass(S, P) {
    const Wd = S.W;
    // 1. the staircase: a carved-stair record (fill style, built on L0), 5 risers of 0.25 H
    const t = (x, z) => idx(x, z);
    const rec = { mode: 'fill', dir: [0, -1], cols: STAIR_X.map((x) => x - 20), requested: 7, narrowed: false, site: { a: t(20, 17), b: t(20, 18), kind: 'terrace', salat: true },
      bottom: STAIR_X.map((x) => t(x, 13)), top: STAIR_X.map((x) => t(x, 18)), steps: STAIR_Z.map((z) => ({ cand: null, tiles: STAIR_X.map((x) => t(x, z)) })), variant: 0, level: S.fine[t(20, 17)] };
    S.carved = S.carved && S.carved.length === S.n ? S.carved : new Uint8Array(S.n);
    for (const st of rec.steps) for (const i of st.tiles) S.carved[i] = 1;
    S.stairs = [rec]; S.stairInfo = Object.assign(S.stairInfo || {}, { placed: 1, dropped: 0, narrowed: 0, fills: 1, width: 7, style: 'steps' });
    recomputeRegions(S, P);
    // 2. heights: stair treads (bridge levels), the walls above the 3 terraces, then the tricks of the state
    const moves = new Map(), tab = S0.table;
    STAIR_Z.forEach((z, k) => { for (const x of STAIR_X) moves.set(t(x, z), { h: treadH(k), meta: { ter: 1, sub: 0, bridge: true, frac: (k + 1) / 5 } }); });
    for (let i = 0; i < S.n; i++) { const h = tab.hgt[i]; if (!(h > 2.5 + 1e-9) || tab.zone[i] === 0) continue; moves.set(i, { h: h * TP, meta: META(2) }); }
    // base ground of the world, before the tricks: heights of the final base levels
    const baseH = new Float64Array(S.n); for (let i = 0; i < S.n; i++) baseH[i] = moves.has(i) ? moves.get(i).h : S.levelH[S.fine[i]];
    S.__base = baseH;
    const on = S0.state.on, order = ['B3', 'A6', 'A3a', 'A3b', 'A4', 'C2'];
    const tiles = {};
    for (const id of order) if (on[id]) { const ms = trickMoves(S, id, P); tiles[id] = ms.map((m) => m.i); for (const m of ms) moves.set(m.i, { h: m.h, meta: m.meta }); }
    if (S0.state.extra) for (const m of S0.state.extra(S)) moves.set(m.i, { h: m.h, meta: m.meta }); // measurement-only variants (e.g. the rail without posts)
    const before = S.levelH.length, added = E.roomTypes.insertLevels(S, moves); S.cache = {};
    S.salat = { levelsBefore: before, levelsAdded: added, moved: moves.size, tiles };
    return S;
  }
  const shape0 = E.shape;
  E.shape = function (full, P, spec) { const S = shape0.apply(this, arguments); if (full && full.name === 'SALAT_T') worldPass(S, P); return S; };

  /* ---------- registration: pack, option, example ---------- */
  S0.install = () => {
    const ev = window.__evo, pack = S0.buildPack(); S0.pack = pack;
    ev.packs.salat = { label: 'SALA T (R1.5)', pack };
    const sel = document.querySelector('#src'); if (sel && ![...sel.options].some((o) => o.value === 'salat')) { const o = document.createElement('option'); o.value = 'salat'; o.textContent = 'SALA T (R1.5)'; sel.appendChild(o); }
    const ex = { id: 'salat', label: 'SALA T', src: 'salat', stageHero: true, stageZones: true, tech: 'box', orient: false, planes: false, props: false, terraces: 3, subs: 1, pre: 0, tilesPerH: 2, heroFrac: 0.10, yaw: 0, window: [1, 2],
      heroAt: { x: 20.5, y: Yz(19) + 0.5 }, heroScreen: [0.5, 0.5], objectsOn: true, stairs: { style: 0, tread: 1, preferFill: true },
      display: { roomBorders: false, nowalk: false, gateMarks: false, rampLines: false, veil: false, border: false, markers: false, edgeWarn: false } };
    const m = E.modes.byId('stage'); if (!m.examples.some((e) => e.id === 'salat')) m.examples.unshift(ex);
    return ex;
  };
})();
