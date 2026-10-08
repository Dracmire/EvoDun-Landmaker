/* EvoDun crystal viewer - POCKET (pseudo-space) of a Diorama room: the user's crystallizer for Diorama rooms.
   IDEA (user's decision): the map does not change. The FRAGMENT of the Diorama (its real tiles) is the same in the world and in the pocket; only what surrounds it changes. The pocket is bigger
   than the footprint and does not look outward (a closed scene, Hades style). Fixed camera for now: the composition is made for the Iso preset (yaw 45).
   - Input: a LIST of room ids (always one today; the list is there for double dioramas of two rooms, NOT implemented: only 2 pairs in the map are joined only by a cliff, none facing the camera).
   - Fragment: all the tiles of the room with their levels, sub-terraces and walkability as they are, in WORLD coordinates (the pocket overlaps the world at the same place: the change is seamless).
   - Size: R = 3 r, r = sqrt(tiles / pi). Centre of the disc = centroid of the fragment moved 2 r TOWARD the camera, so the fragment sits against the back edge. Outside the disc there is nothing (no world, no veil).
   - Decoration (not walkable, no stake or objectives): a weighted Voronoi (distance^2 / weight^2, weight 0.5 + noise, like Step3_ApplyVoronoi of skeletonMeshmakerGenV4) with 9 seeds, deterministic by room id.
     Each tile takes as reference the level of the nearest fragment floor tile (so an inner cliff of a double fragment continues in the pocket: a waterfall); each CELL adds an offset in terraces:
     behind the fragment (farther from the camera) +1 or +2 (the backdrop), in front -1 or -2 (the view; the lowest front cell is a POND), at the sides 0 or -1. HARD RULE: nothing in front of the fragment may be higher
     than the edge of the fragment that faces it (it would hide the fragment in Iso). The decoration may go below the lowest terrace of the map or above the highest one, with levels of its own.
     (Seeds: 3 behind, 4 in front, 2 at the sides, each one random inside its zone: a pure random draw could leave no backdrop or no view.)
   - Exits: the faces of the border of the fragment where the walking graph of the world crosses to another room (an open room transition). From each run of exit faces a straight road, as wide as the run and at the
     height of the fragment on that face, goes to the edge of the disc, cutting the decoration. Drawn as a marked road (not walkable in the viewer).
   - Floors ("double"): walkable floors of the fragment (>= 20 tiles each, ramps join floors); two floors without a ramp between them = "double". The decoration follows each floor (reference = nearest floor).
   NOT reproduced from the user's code (generator work): the 40 % displacement of platforms toward the centre (PackPlatformsIntoRegion), enlarged terrain with detail, Voronoi cells of the neighbouring rooms.
   Port to Unity: an RPG interior in the same place: same fragment, environment swapped with a crossfade when the focused unit enters the fragment. With the rule "Diorama never touches Diorama" two active pockets never touch. */
(function (E) {
  const P_ = E.pocket = {};
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  P_.defaults = { yaw: 45, factor: 3, shift: 2, seeds: 9, margin: 0.05 };
  // mulberry32: a small deterministic PRNG
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const seedOf = (ids) => { let h = 2166136261; for (const id of ids) { h ^= id + 0x9e3779b9; h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  /* the margin (tiles) the window needs around the fragment to hold the whole disc: the centre is 2 r from the centroid, the radius 3 r */
  P_.margin = (tiles, o) => { o = Object.assign({}, P_.defaults, o); const r = Math.sqrt(tiles / Math.PI); return Math.ceil((o.shift + o.factor) * r) + 3; };

  /* PADDING (pseudo-space): the disc of a pocket may leave the map (room 64 is at the edge). The window of a shape cannot, so the whole map is copied with a border of void (elevation 0, zone 0, masks 0) and the shape and the
     rooms layer are built on that copy. matchRoom finds the same room there (same tile set, translated by pad) so the fragment stays the world's; the seeds still use the original room id. */
  P_.padPack = function (full, pad) {
    const w = full.width, h = full.height, W2 = w + 2 * pad, H2 = h + 2 * pad, key = pad;
    if (full._pad && full._pad.key === key) return full._pad.pack;
    const cp = (a, T) => { const o = new (T || a.constructor)(W2 * H2); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[(y + pad) * W2 + x + pad] = a[y * w + x]; return o; };
    const masks = {}; for (const [k, v] of Object.entries(full.masks || {})) masks[k] = Array.isArray(v) ? Array.from(cp(Float64Array.from(v), Float64Array)) : cp(v);
    const fields = {}; for (const [k, f] of Object.entries(full.fields || {})) fields[k] = f.ids ? Object.assign({}, f, { ids: cp(f.ids), amb: cp(f.amb), sliceIds: undefined }) : { values: cp(f.values) };
    const pack = { name: full.name, width: W2, height: H2, elevation: cp(full.elevation), elevRange: full.elevRange, masks, markers: (full.markers || []).map((m) => Object.assign({}, m, { x: m.x + pad, y: m.y + pad })), fields };
    full._pad = { key, pack }; return pack;
  };
  /* does the disc of room o (RL = layer of the original map) leave the map? */
  P_.overflows = function (RL, o, opts) {
    const W = RL.W, H = RL.H; let sx = 0, sy = 0, c = 0; for (let i = 0; i < W * H; i++) if (RL.room[i] === o.id) { sx += (i % W) + 0.5; sy += ((i / W) | 0) + 0.5; c++; }
    if (!c) return false; opts = Object.assign({}, P_.defaults, opts); const r = Math.sqrt(c / Math.PI), u = [Math.sin(opts.yaw * Math.PI / 180), Math.cos(opts.yaw * Math.PI / 180)], cx = sx / c + opts.shift * r * u[0], cy = sy / c + opts.shift * r * u[1], R = opts.factor * r;
    return cx - R < 0 || cy - R < 0 || cx + R > W || cy + R > H;
  };
  /* id of the room of RL2 (layer of the padded map) that has exactly the tiles of room id of RL translated by pad; 0 if there is none */
  P_.matchRoom = function (RL, RL2, id, pad) {
    const W = RL.W, H = RL.H, W2 = RL2.W; let found = 0, cnt = 0;
    for (let i = 0; i < W * H; i++) if (RL.room[i] === id) { const j = (((i / W) | 0) + pad) * W2 + (i % W) + pad, r2 = RL2.room[j]; if (!cnt) found = r2; else if (r2 !== found) return 0; cnt++; }
    if (!found || found <= 0) return 0; let n2 = 0; for (let i = 0; i < RL2.room.length; i++) if (RL2.room[i] === found) n2++;
    return n2 === cnt ? found : 0;
  };

  /* PLAN (pure): W, H window; frag Uint8Array (1 = fragment tile); heightOf(i) height of a fragment tile; exits [{ a, dx, dy }] (a = fragment tile, (dx, dy) = outward direction);
     opts { ids, yaw, factor, shift, seeds, jump (height of one terrace) }. Returns { disc, role, height, cell, exits, info }. role: 0 none, 1 fragment, 2 decoration, 3 road, 4 pond. */
  P_.plan = function (W, H, frag, heightOf, exits, opts) {
    const o = Object.assign({}, P_.defaults, opts), n = W * H, ids = o.ids || [0], jump = o.jump || 1, yaw = o.yaw * Math.PI / 180, u = [Math.sin(yaw), Math.cos(yaw)], v = [-u[1], u[0]];
    const fl = []; let sx = 0, sy = 0; for (let i = 0; i < n; i++) if (frag[i]) { fl.push(i); sx += (i % W) + 0.5; sy += ((i / W) | 0) + 0.5; }
    const cnt = fl.length, cx = sx / cnt, cy = sy / cnt, r = Math.sqrt(cnt / Math.PI), R = o.factor * r, dc = [cx + o.shift * r * u[0], cy + o.shift * r * u[1]];
    const role = new Uint8Array(n), height = new Float32Array(n).fill(NaN), cell = new Int16Array(n).fill(-1), rand = rng(seedOf(ids));
    const px = (i) => (i % W) + 0.5, py = (i) => ((i / W) | 0) + 0.5, inDisc = (i) => Math.hypot(px(i) - dc[0], py(i) - dc[1]) <= R;
    for (const i of fl) { role[i] = 1; height[i] = heightOf(i); }
    // nearest fragment tile of every disc tile: a grid of the fragment tiles keeps it fast
    const nearest = new Int32Array(n).fill(-1), g = 8, gw = Math.ceil(W / g), gh = Math.ceil(H / g), grid = Array.from({ length: gw * gh }, () => []);
    for (const i of fl) grid[(((i / W) | 0) / g | 0) * gw + (((i % W) / g) | 0)].push(i);
    const nearestFrag = (x, y) => { // ring search over the grid, then exact
      const gx = Math.floor(x / g), gy = Math.floor(y / g); let best = -1, bd = Infinity;
      for (let rad = 0; rad < Math.max(gw, gh); rad++) {
        for (let yy = gy - rad; yy <= gy + rad; yy++) for (let xx = gx - rad; xx <= gx + rad; xx++) { if (Math.max(Math.abs(yy - gy), Math.abs(xx - gx)) !== rad || xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; for (const f of grid[yy * gw + xx]) { const d = (px(f) - x) ** 2 + (py(f) - y) ** 2; if (d < bd) { bd = d; best = f; } } }
        if (best >= 0 && Math.sqrt(bd) <= rad * g) break;
      }
      return best;
    };
    const disc = []; for (let i = 0; i < n; i++) if (!frag[i] && inDisc(i)) disc.push(i);
    // seeds: 3 behind, 4 in front, 2 at the sides (zone by s = dot(position - centroid, u) / r), weights 0.5 + noise, each random inside the disc and its zone (no fragment tile needed)
    const zoneOf = (s) => (s < -0.2 ? 0 : s > 0.2 ? 1 : 2), want = [0, 0, 0, 1, 1, 1, 1, 2, 2].slice(0, o.seeds), seeds = [];
    for (const z of want) {
      let pos = null; for (let t = 0; t < 400 && !pos; t++) { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * R, x = dc[0] + Math.cos(a) * d, y = dc[1] + Math.sin(a) * d, s = ((x - cx) * u[0] + (y - cy) * u[1]) / r; if (zoneOf(s) === z) pos = [x, y]; }
      if (!pos) { const s = z === 0 ? -0.5 : z === 1 ? 1.2 : 0, l = z === 2 ? (rand() < 0.5 ? -0.8 : 0.8) : 0; pos = [cx + (s * r) * u[0] + l * r * v[0], cy + (s * r) * u[1] + l * r * v[1]]; } // fallback: a fixed anchor
      seeds.push({ x: pos[0], y: pos[1], w: 0.5 + rand(), zone: z, k: 0, id: seeds.length });
    }
    for (const sd of seeds) { const q = rand(); sd.k = sd.zone === 0 ? (q < 0.5 ? 1 : 2) : sd.zone === 1 ? (q < 0.5 ? -1 : -2) : (q < 0.5 ? 0 : -1); }
    // the lowest cell of the front is the POND (lowest offset, then the nearest to the camera)
    const front = seeds.filter((s) => s.zone === 1).sort((a, b) => a.k - b.k || ((b.x - cx) * u[0] + (b.y - cy) * u[1]) - ((a.x - cx) * u[0] + (a.y - cy) * u[1])); 
    for (const i of disc) {
      let bd = Infinity, bs = 0; for (const s of seeds) { const d = ((px(i) - s.x) ** 2 + (py(i) - s.y) ** 2) / (s.w * s.w); if (d < bd) { bd = d; bs = s.id; } }
      const ref = nearestFrag(px(i), py(i)); nearest[i] = ref; cell[i] = bs;
      role[i] = 2; height[i] = height[ref] + seeds[bs].k * jump;
    }
    // HARD RULE: nothing hides the fragment. A ray from the tile away from the camera: the first fragment tile it meets is the edge in front of which the tile stands; the tile stays below it
    let capped = 0;
    for (const i of disc) {
      let x = px(i), y = py(i), hit = -1; for (let s = 0; s < 4 * R && hit < 0; s++) { x -= u[0] * 0.5; y -= u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; const j = iy * W + ix; if (frag[j]) hit = j; }
      if (hit >= 0 && height[i] > height[hit] - o.margin * jump) { height[i] = height[hit] - o.margin * jump; capped++; }
    }
    // exits: runs of faces with the same direction and consecutive tiles; a road of the run's width and the height of the fragment on each face, to the edge of the disc (it cuts the decoration)
    const sortKey = (e) => (e.dx ? [e.dx + 5, e.a % W, (e.a / W) | 0] : [e.dy + 20, (e.a / W) | 0, e.a % W]), runs = [], sorted = exits.slice().sort((p, q) => { const a = sortKey(p), b = sortKey(q); return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
    for (const e of sorted) {
      const last = runs[runs.length - 1], lf = last && last.faces[last.faces.length - 1], fixed = (t) => (t.dx ? t.a % W : (t.a / W) | 0), along = (t) => (t.dx ? (t.a / W) | 0 : t.a % W);
      if (last && last.dx === e.dx && last.dy === e.dy && fixed(lf) === fixed(e) && along(e) === along(lf) + 1) last.faces.push(e); else runs.push({ dx: e.dx, dy: e.dy, faces: [e] });
    }
    let reached = 0, blocked = 0, bent = 0; const road = [];
    /* the road of one face: straight along the outward direction to the edge of the disc (or of the window); if the fragment is in the way (a notch of the border) the first of the other directions
       (the two sides, then back) whose straight line from the first free tile is clear; null if there is none */
    const trace = (f, dx, dy, from) => {
      const out = []; let x = from[0], y = from[1];
      for (let m = 0; m < 4 * R + 8; m++) { if (x < 0 || y < 0 || x >= W || y >= H) return out; const j = y * W + x; if (frag[j]) return null; if (!inDisc(j)) return out; out.push(j); x += dx; y += dy; }
      return out;
    };
    for (const run of runs) {
      run.width = run.faces.length; run.reached = true; run.bent = false; run.length = 0;
      for (const f of run.faces) {
        const x0 = (f.a % W) + f.dx, y0 = ((f.a / W) | 0) + f.dy, h = height[f.a];
        let path = trace(f, f.dx, f.dy, [x0, y0]);
        if (!path) { for (const [dx, dy] of [[f.dy, f.dx], [-f.dy, -f.dx], [-f.dx, -f.dy]]) { path = trace(f, dx, dy, [x0, y0]); if (path) { run.bent = true; break; } } }
        if (!path) { run.reached = false; continue; }
        for (const j of path) { role[j] = 3; height[j] = h; cell[j] = -1; road.push(j); }
        run.length = Math.max(run.length, path.length);
      }
      run.reached ? reached++ : blocked++; if (run.bent) bent++;
    }
    // the pond is the first front cell (lowest first) that still owns decoration tiles once the roads are cut (a cell may be eaten by its neighbours or crossed by a road)
    { const owned = new Set(); for (const i of disc) if (role[i] === 2) owned.add(cell[i]); const pondSeed = front.find((x) => owned.has(x.id)); if (pondSeed) { pondSeed.pond = true; for (const i of disc) if (cell[i] === pondSeed.id && role[i] === 2) role[i] = 4; } }
    let decoTiles = 0, pondTiles = 0, roadTiles = 0; for (let i = 0; i < n; i++) { if (role[i] === 2) decoTiles++; else if (role[i] === 4) pondTiles++; else if (role[i] === 3) roadTiles++; }
    return { disc: { cx: dc[0], cy: dc[1], R, r, centroid: [cx, cy], u }, role, height, cell, seeds, exits: runs, info: { fragTiles: cnt, decoTiles, pondTiles, roadTiles, exitRuns: runs.length, exitFaces: exits.length, exitsReached: reached, exitsBlocked: blocked, exitsBent: bent, capped, seeds: seeds.length, pocketTiles: cnt + decoTiles + pondTiles + roadTiles } };
  };

  /* Floors of a fragment (user's criterion): a terrace of the room with >= 20 walkable tiles (valid walkable region: no forbidden margin, no void, no ramp footprint) is a floor; two floors joined by a ramp inside the room
     are ONE floor (the ramp is the way between them), so "double" = two or more floors without a ramp between them. Returns the floors [{ tiles, h, cx, cy, ters }] and, as .perTerrace, the walkable count of every terrace of the room. */
  P_.floors = function (S, frag, walk) {
    const W = S.W, n = S.n, ok = (i) => frag[i] && walk(i) && !S.carved[i], per = new Map();
    for (let i = 0; i < n; i++) if (ok(i)) { let o = per.get(S.ter[i]); if (!o) per.set(S.ter[i], o = { ter: S.ter[i], tiles: 0, sh: 0, sx: 0, sy: 0 }); o.tiles++; o.sh += S.levelH[S.fine[i]]; o.sx += (i % W) + 0.5; o.sy += ((i / W) | 0) + 0.5; }
    const big = [...per.values()].filter((o) => o.tiles >= 20), par = new Map(big.map((o) => [o.ter, o.ter])), find = (a) => { while (par.get(a) !== a) a = par.get(a); return a; };
    for (const rec of S.stairs || []) for (let ci = 0; ci < rec.cols.length; ci++) { const a = rec.bottom[ci], b = rec.top[ci]; if (frag[a] && frag[b] && par.has(S.ter[a]) && par.has(S.ter[b])) par.set(find(S.ter[a]), find(S.ter[b])); }
    const g = new Map(); for (const o of big) { const k = find(o.ter); let f = g.get(k); if (!f) g.set(k, f = { tiles: 0, sh: 0, sx: 0, sy: 0, ters: [] }); f.tiles += o.tiles; f.sh += o.sh; f.sx += o.sx; f.sy += o.sy; f.ters.push(o.ter); }
    const out = [...g.values()].map((o) => ({ tiles: o.tiles, h: o.sh / o.tiles, cx: o.sx / o.tiles, cy: o.sy / o.tiles, ters: o.ters })).sort((a, b) => b.tiles - a.tiles);
    out.perTerrace = [...per.values()].map((o) => ({ ter: o.ter, tiles: o.tiles })).sort((a, b) => a.ter - b.ter); return out;
  };

  /* APPLY to a shape S whose slice is the room(s) of the pocket (rooms on, the room is a Diorama): everything outside the pocket becomes void (not drawn), the decoration gets levels of its own, the roads and the pond are marked.
     Sets S.pocket (true), S.pocketRole (Uint8 per window tile: 1 fragment, 2 decoration, 3 road, 4 pond), S.pocketInfo. The fragment is not touched (same fine levels, same walkability). */
  P_.apply = function (S, P, RL, ids, opts) {
    const n = S.n, W = S.W, H = S.H, K = S.subs, frag = Uint8Array.from(S.slice, (v, i) => (v && !(S.void && S.void[i]) ? 1 : 0)), idsSet = new Set(ids), fw = S.mapW;
    const mapOf = (i) => (((i / W) | 0) + S.oy) * fw + (i % W) + S.ox;
    // exits: faces of the fragment border across an open room transition
    const exits = [];
    for (let i = 0; i < n; i++) { if (!frag[i]) continue; const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (frag[j]) continue; const rb = RL.room[mapOf(j)]; if (rb <= 0 || idsSet.has(rb)) continue; if (RL.rp.has(E.rooms.key(mapOf(i), mapOf(j), RL.W * RL.H))) exits.push({ a: i, dx, dy }); } }
    const jump = P.terH, plan = P_.plan(W, H, frag, (i) => S.levelH[S.fine[i]], exits, Object.assign({ ids, jump }, opts));
    // the window may cut the disc at the edge of the map: counted
    const d = plan.disc, truncated = d.cx - d.R < -S.ox || d.cy - d.R < -S.oy || d.cx + d.R > fw - S.ox || d.cy + d.R > S.mapH - S.oy;
    // levels: insert the heights of the decoration, roads and pond in the ranking (an existing level is reused when the height matches)
    const eps = 1e-6, hs = new Set(); for (let i = 0; i < n; i++) if (plan.role[i] >= 2) hs.add(Math.round(plan.height[i] / eps));
    const list = [...hs].sort((a, b) => a - b).map((k) => k * eps), old = S.levelH, newH = [], newMeta = [], remap = new Array(old.length), hIdx = new Map(); let hi = 0;
    for (let L = 0; L <= S.maxFine; L++) {
      while (hi < list.length && list[hi] < old[L] - 1e-5) { hIdx.set(list[hi], newH.length); newH.push(list[hi]); newMeta.push(null); hi++; }
      if (hi < list.length && Math.abs(list[hi] - old[L]) <= 1e-5) { hIdx.set(list[hi], newH.length); hi++; }
      remap[L] = newH.length; newH.push(old[L]); newMeta.push(S.levelMeta[L]);
    }
    while (hi < list.length) { hIdx.set(list[hi], newH.length); newH.push(list[hi]); newMeta.push(null); hi++; }
    const N = S.N, top = E.terBase(N - 1, P, S.center) + (K - 1) * E.subHeight(P);
    newH.forEach((h, L) => { if (newMeta[L]) return; // a level of the decoration: colour between the terraces (bridge), or the lowest / highest colour outside the range
      if (h <= E.terBase(0, P, S.center)) { newMeta[L] = { ter: 0, sub: 0, bridge: false }; return; } if (h >= top) { newMeta[L] = { ter: N - 1, sub: K - 1, bridge: false }; return; }
      let t = 0; while (t + 1 < N && E.terBase(t + 1, P, S.center) <= h) t++; const lo = E.terBase(t, P, S.center) + (K - 1) * E.subHeight(P), hiB = E.terBase(t + 1, P, S.center);
      newMeta[L] = h <= lo ? { ter: t, sub: K - 1, bridge: false } : { ter: t, sub: K - 1, bridge: true, frac: Math.max(0.05, Math.min(0.95, (h - lo) / (hiB - lo))) }; });
    const fine = new Int16Array(n);
    for (let i = 0; i < n; i++) fine[i] = plan.role[i] >= 2 ? hIdx.get(Math.round(plan.height[i] / eps)) : remap[S.fine[i]];
    S.fine.set(fine); for (const rec of S.stairs || []) if (rec.level !== undefined) rec.level = remap[rec.level];
    S.levelH = newH; S.levelMeta = newMeta; S.maxFine = newH.length - 1;
    // void: everything outside the pocket (fragment + decoration + roads + pond) is not drawn; the world void inside the disc is decoration now
    const vd = new Uint8Array(n); for (let i = 0; i < n; i++) vd[i] = plan.role[i] === 0 ? 1 : 0; S.void = vd;
    S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd[i]) S.byLevel[S.fine[i]].push(i);
    S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1;
    for (let i = 0; i < n; i++) if (plan.role[i] >= 2) S.block[i] = 1; // not walkable
    { let x0 = W, y0 = H, x1 = 0, y1 = 0; for (let i = 0; i < n; i++) if (plan.role[i]) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x + 1 > x1) x1 = x + 1; if (y < y0) y0 = y; if (y + 1 > y1) y1 = y + 1; } S.sliceBox = { x0, y0, x1, y1 }; } // the camera fits the whole pocket
    S.pocket = true; S.pocketRole = plan.role; S.pocketPlan = plan;
    const fl = P_.floors(S, frag, (i) => RL.forb[mapOf(i)] !== 1 && RL.h[mapOf(i)] > 0), dbl = fl.length >= 2; let faces = null;
    if (dbl) { const hi2 = fl.slice().sort((a, b) => b.h - a.h), A = hi2[0], B = hi2[hi2.length - 1], u = plan.disc.u; faces = (A.cx - B.cx) * u[0] + (A.cy - B.cy) * u[1] < 0; } // the higher floor is farther from the camera: the cliff between them faces the camera
    S.pocketInfo = Object.assign({}, plan.info, { ids: ((opts && opts.ids) || ids).slice(), perTerrace: fl.perTerrace, R: d.R, r: d.r, floors: fl.map((f) => f.tiles), double: dbl, cliffFacesCamera: faces, truncated, levelsAdded: newH.length - old.length });
    return S.pocketInfo;
  };
})(window.EVO = window.EVO || {});
