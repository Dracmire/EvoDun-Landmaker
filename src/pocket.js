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
  P_.defaults = { yaw: 45, factor: 3, shift: 1, seedArea: 80, seedMin: 30, seedMax: 48, margin: 0.05, pathWidth: 2, mergeGap: 3, rampLen: 3, pondMax: 0.5, arch: 'hill', ph: 2.5, sepMin: 2, sepK: 0.6, lakeOpen: 2.2, lakeDrop: 1.2, shoreUp: 0.4, rockW: 0.3 };
  // mulberry32: a small deterministic PRNG
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const seedOf = (ids) => { let h = 2166136261; for (const id of ids) { h ^= id + 0x9e3779b9; h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  /* The window of a pocket: the bounding box of its disc (+ a few tiles), in map coordinates; it may extend past the map (pseudo-space). */
  P_.windowOf = function (RL, o, opts) {
    const W = RL.W, H = RL.H, fl = []; let sx = 0, sy = 0; for (let i = 0; i < W * H; i++) if (RL.room[i] === o.id) { fl.push(i); sx += (i % W) + 0.5; sy += ((i / W) | 0) + 0.5; }
    if (!fl.length) return null; opts = Object.assign({}, P_.defaults, opts); const c = fl.length, cx = sx / c, cy = sy / c, r = Math.sqrt(c / Math.PI), yw = opts.yaw * Math.PI / 180, dx = cx + opts.shift * r * Math.sin(yw), dy = cy + opts.shift * r * Math.cos(yw);
    let R = opts.factor * r; for (const i of fl) R = Math.max(R, Math.hypot((i % W) + 0.5 - dx, ((i / W) | 0) + 0.5 - dy) + 0.71);
    return { x0: Math.floor(dx - R) - 3, y0: Math.floor(dy - R) - 3, x1: Math.ceil(dx + R) + 3, y1: Math.ceil(dy + R) + 3 };
  };
  /* REFRAME: the world shape (whole map) is copied into the window [x0, x1) x [y0, y1) (map coordinates, possibly past the map: void there): every per-tile array is copied at an offset, the ramps that do not lie wholly in the window are
     dropped and the tile indices of the others remapped. The pocket is made on that window (B costs per tile and per level: the whole map would be mostly empty). S.ox / S.oy = the map position of the window's corner. */
  P_.reframe = function (S, win) {
    const W = S.W, H = S.H, w = win.x1 - win.x0, h = win.y1 - win.y0, n2 = w * h, x0 = win.x0, y0 = win.y0;
    const src = (j) => { const X = x0 + (j % w), Y = y0 + ((j / w) | 0); return X < 0 || Y < 0 || X >= W || Y >= H ? -1 : Y * W + X; }, idx = (i) => { const X = (i % W) - x0, Y = ((i / W) | 0) - y0; return X < 0 || Y < 0 || X >= w || Y >= h ? -1 : Y * w + X; };
    const grow = (a, fill, per) => { if (!a || a.length === undefined) return a; per = per || 1; const T = a.constructor, o = T === Array ? new Array(n2 * per).fill(fill) : new T(n2 * per).fill(fill);
      for (let j = 0; j < n2; j++) { const i = src(j); if (i >= 0) for (let k = 0; k < per; k++) o[j * per + k] = a[i * per + k]; } return o; };
    S.U = grow(S.U, 0); S.ter = grow(S.ter, 0); S.sub = grow(S.sub, 0); S.fine = grow(S.fine, 0); S.void = grow(S.void || new Uint8Array(W * H), 1); S.fineMask = grow(S.fineMask || Int16Array.from(S.fine), -1);
    S.water = grow(S.water, 0); S.block = grow(S.block, 1); S.roomKind = grow(S.roomKind, 0, 4); S.roomBits = grow(S.roomBits, 0); S.roomMap = grow(S.roomMap, 0); S.carved = grow(S.carved, 0);
    S.region = grow(S.region, -1); S.isolated = grow(S.isolated, 0); S.nowalk = grow(S.nowalk, 0); S.roomType = grow(S.roomType, 0);
    for (const k of ['snake', 'cave', 'waterfall']) if (S[k] && S[k].length === W * H) S[k] = grow(S[k], 0);
    S.dioBits = S.roomBitsDio = S.slice = S.border = S.borderKind = S.sliceLoops = null; S.sliceUse = null; S.conns = []; S.passes = []; S.gates = []; S.makeSite = null; S._walk = null; S.cache = {};
    const keep = []; for (const rec of S.stairs || []) {
      const all = rec.bottom.concat(rec.top, ...(rec.steps || []).map((x) => x.tiles)); if (!all.every((t) => idx(t) >= 0)) continue;
      rec.bottom = rec.bottom.map(idx); rec.top = rec.top.map(idx); for (const st of rec.steps || []) st.tiles = st.tiles.map(idx); if (rec.ramp) { rec.ramp.mx -= x0; rec.ramp.my -= y0; }
      if (rec.site) { const m = (o) => (o ? Object.assign({}, o, { a: idx(o.a), b: idx(o.b) }) : o); rec.site = Object.assign({}, m(rec.site), { alts: (rec.site.alts || []).map(m) }); } keep.push(rec); }
    S.stairs = keep;
    S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n2; i++) if (!S.void[i]) S.byLevel[S.fine[i]].push(i);
    S.W = w; S.H = h; S.n = n2; S.ox = x0; S.oy = y0; return S;
  };
  /* PLAN (pure): W, H window; frag Uint8Array (1 = fragment tile); heightOf(i) height of a fragment tile; exits [{ a, dx, dy }] (a = fragment tile, (dx, dy) = outward direction);
     opts { ids, yaw, factor, shift, jump (height of one terrace), sub (height of one sub-level), arch, ph (Pocket height), lowH, highH, highMask, ... see defaults }. Returns { disc, role, height, decoHeight, cell, seeds, exits, info }.
     role: 0 none (void), 1 fragment, 2 decoration, 3 path / causeway / bridge / ridge, 4 water.
     FRAMING ARCHETYPES (user's design; the pocket is framing, not terrain: what surrounds the fragment must separate it). Separation s = max(2, 0.6 r) tiles. Offsets of the decoration are in terraces x jump x ph (Pocket height); the fragment keeps its heights.
       hill   (Cerro):   the fragment is the high point; front bands -1, -2, -3 by distance, sides -1, a small pond (<= 50 % of the fragment), backdrop +1..+3 behind.
       lake   (Lago):    a water ring of width s around the fragment, open to the front (front cells up to lakeOpen x s); water at (lowest floor - 1.2 terraces x ph); shore just above it, backdrop behind. Exits: causeways at the fragment's height across the water.
       falls  (Cascada): a lake on the side of the low floor; behind and beside the high floor the decoration keeps that floor's height (cornice) with a 2-tile water channel that runs to the edge of the cornice and falls into the lake.
       island (Isla):    a ring s of VOID (not drawn); beyond it a rock ring (+1..+2) behind and at the sides, void in front. Exits: short bridges at the fragment's height over the void.
       drop   (Caída):   a ring s of void; the rest of the disc far below (-3..-4 terraces x ph); exits: narrow ridges at the fragment's height to the edge. */
  P_.ARCH = ['hill', 'lake', 'falls', 'island', 'drop'];
  P_.ARCH_NAME = { hill: 'Cerro', lake: 'Lago', falls: 'Cascada', island: 'Isla', drop: 'Caída' };
  P_.plan = function (W, H, frag, heightOf, exits, opts) {
    const o = Object.assign({}, P_.defaults, opts), n = W * H, ids = o.ids || [0], jump = o.jump || 1, sub = o.sub === undefined ? 0.22 * jump : o.sub, PH = o.ph, arch = o.arch, yaw = o.yaw * Math.PI / 180, u = [Math.sin(yaw), Math.cos(yaw)], v = [-u[1], u[0]];
    const fl = []; let sx = 0, sy = 0; for (let i = 0; i < n; i++) if (frag[i]) { fl.push(i); sx += (i % W) + 0.5; sy += ((i / W) | 0) + 0.5; }
    const cnt = fl.length, cx = sx / cnt, cy = sy / cnt, r = Math.sqrt(cnt / Math.PI), dc = [cx + o.shift * r * u[0], cy + o.shift * r * u[1]], sep = Math.max(o.sepMin, o.sepK * r);
    const px = (i) => (i % W) + 0.5, py = (i) => ((i / W) | 0) + 0.5;
    let R = o.factor * r, grown = false; for (const i of fl) { const d = Math.hypot(px(i) - dc[0], py(i) - dc[1]) + 0.71; if (d > R) { R = d; grown = true; } } // no fragment tile outside the disc: R grows to hold them all
    const inDisc = (i) => Math.hypot(px(i) - dc[0], py(i) - dc[1]) <= R, sOf = (x, y) => ((x - cx) * u[0] + (y - cy) * u[1]) / r; // s: position along the camera axis in units of r (+ = toward the camera)
    const role = new Uint8Array(n), height = new Float32Array(n).fill(NaN), cell = new Int16Array(n).fill(-1), rand = rng(seedOf(ids));
    for (const i of fl) { role[i] = 1; height[i] = heightOf(i); }
    let sF = -Infinity, sf = Infinity; for (const i of fl) { const s = sOf(px(i), py(i)); if (s > sF) sF = s; if (s < sf) sf = s; } // front and back extent of the fragment
    const sBack = o.shift - R / r, sEdge = o.shift + R / r; // back and front edge of the disc
    // nearest fragment tile of every disc tile (and its distance): a grid of the fragment tiles keeps it fast
    const nearest = new Int32Array(n).fill(-1), dn = new Float32Array(n), g = 8, gw = Math.ceil(W / g), gh = Math.ceil(H / g), grid = Array.from({ length: gw * gh }, () => []);
    for (const i of fl) grid[(((i / W) | 0) / g | 0) * gw + (((i % W) / g) | 0)].push(i);
    const nearestFrag = (x, y) => {
      const gx = Math.floor(x / g), gy = Math.floor(y / g); let best = -1, bd = Infinity;
      for (let rad = 0; rad < Math.max(gw, gh); rad++) {
        for (let yy = gy - rad; yy <= gy + rad; yy++) for (let xx = gx - rad; xx <= gx + rad; xx++) { if (Math.max(Math.abs(yy - gy), Math.abs(xx - gx)) !== rad || xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; for (const f of grid[yy * gw + xx]) { const d = (px(f) - x) ** 2 + (py(f) - y) ** 2; if (d < bd) { bd = d; best = f; } } }
        if (best >= 0 && Math.sqrt(bd) <= rad * g) break;
      }
      return best;
    };
    const disc = []; for (let i = 0; i < n; i++) if (!frag[i] && inDisc(i)) disc.push(i);
    for (const i of disc) { const f = nearestFrag(px(i), py(i)); nearest[i] = f; dn[i] = Math.hypot(px(i) - px(f), py(i) - py(f)); }
    /* the offset of a cell comes from the DISTANCE of its seed to the fragment along the camera axis (a ray away from the camera that hits the fragment: the seed is in front of it; toward the camera: behind it; neither: the distance
       to the extent of the fragment). BANDS by archetype: [front thirds of the distance, side, back thirds]. Chance only picks the positions of the seeds and the jitter of -1, 0, +1 sub-level. */
    const BANDS = { hill: { F: [-1, -2, -3], S: -1, B: [1, 2, 3] }, lake: { F: [0, 0, 0], S: 0, B: [1, 2, 3] }, falls: { F: [0, 0, 0], S: 0, B: [1, 2, 3] }, island: { F: [0, 0, 0], S: 1, B: [1, 2, 2] }, drop: { F: [-3, -3, -4], S: -3, B: [-3, -4, -4] } }[arch];
    const nSeeds = Math.max(o.seedMin, Math.min(o.seedMax, Math.round(Math.PI * R * R / o.seedArea))), seeds = [];
    const rayD = (x0, y0, sg) => { let x = x0, y = y0; for (let t = 0; t < 4 * R; t++) { x += sg * u[0] * 0.5; y += sg * u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) return -1; if (frag[iy * W + ix]) return (t + 1) * 0.5; } return -1; };
    const frontReach = Math.max(1e-6, (sEdge - sF) * r), backReach = Math.max(1e-6, (sf - sBack) * r);
    const zoneOf = (x, y, s) => { // 'F' in front of the fragment, 'B' behind it, 'S' at its sides; d = distance along the camera axis
      const df = rayD(x, y, -1), db = rayD(x, y, 1); let front = df >= 0 && (db < 0 || df <= db), back = db >= 0 && !front, d = front ? df : db;
      if (!front && !back) { if (s > sF) { front = true; d = (s - sF) * r; } else if (s < sf) { back = true; d = (sf - s) * r; } else return { z: 'S', d: 0 }; }
      return { z: front ? 'F' : 'B', d };
    };
    const kOf = (z, d) => (z === 'F' ? BANDS.F[Math.min(2, Math.floor(3 * d / frontReach))] : z === 'B' ? BANDS.B[Math.min(2, Math.floor(3 * d / backReach))] : BANDS.S);
    for (let q = 0; q < nSeeds; q++) {
      const want = q < 3 ? 0 : q < 6 ? 1 : -1; let pos = null, s = 0;
      for (let t = 0; t < 600 && !pos; t++) { const a = rand() * 2 * Math.PI, d = Math.sqrt(rand()) * R, x = dc[0] + Math.cos(a) * d, y = dc[1] + Math.sin(a) * d; s = sOf(x, y); if (want === 0 ? s < sf : want === 1 ? s > sF : true) pos = [x, y]; }
      if (!pos) { s = want === 0 ? (sf + sBack) / 2 : (sF + sEdge) / 2; pos = [cx + s * r * u[0], cy + s * r * u[1]]; }
      const zd = zoneOf(pos[0], pos[1], s); seeds.push({ x: pos[0], y: pos[1], w: 0.5 + rand(), s, z: zd.z, k: kOf(zd.z, zd.d), d: zd.d, j: Math.floor(rand() * 3) - 1, id: q });
    }
    for (const i of disc) { let bd = Infinity, bs = 0; for (const sd of seeds) { const d = ((px(i) - sd.x) ** 2 + (py(i) - sd.y) ** 2) / (sd.w * sd.w); if (d < bd) { bd = d; bs = sd.id; } } cell[i] = bs; }
    { // neighbouring cells differ by at most one band (the higher one is lowered)
      const pairs = new Set(); for (const i of disc) { const x = i % W; if (x + 1 < W && cell[i + 1] >= 0 && cell[i + 1] !== cell[i] && !frag[i + 1]) pairs.add(Math.min(cell[i], cell[i + 1]) * 1000 + Math.max(cell[i], cell[i + 1])); if (i + W < n && cell[i + W] >= 0 && cell[i + W] !== cell[i] && !frag[i + W]) pairs.add(Math.min(cell[i], cell[i + W]) * 1000 + Math.max(cell[i], cell[i + W])); }
      const list = [...pairs].sort((a, b) => a - b).map((v) => [Math.floor(v / 1000), v % 1000]);
      for (let it = 0; it < 1000; it++) { let ch = false; for (const [a, b] of list) { const A = seeds[a], B = seeds[b]; if (A.k > B.k + 1) { A.k = B.k + 1; ch = true; } else if (B.k > A.k + 1) { B.k = A.k + 1; ch = true; } } if (!ch) break; } // min-plus smoothing: terminates, and no neighbour is more than one band higher
    }
    // per-tile zone (for the ring rules): the same ray test as the seeds
    const zoneT = new Uint8Array(n); // 0 side, 1 front, 2 back
    for (const i of disc) { const zd = zoneOf(px(i), py(i), sOf(px(i), py(i))); zoneT[i] = zd.z === 'F' ? 1 : zd.z === 'B' ? 2 : 0; }
    const lowH = o.lowH === undefined ? Math.min(...fl.map((i) => height[i])) : o.lowH, highH = o.highH === undefined ? lowH : o.highH, hm = o.highMask;
    const waterH = lowH - o.lakeDrop * jump * PH, shoreH = waterH + o.shoreUp * jump;
    const ringWater = (i) => dn[i] <= sep || (zoneT[i] === 1 && dn[i] <= o.lakeOpen * sep);
    const rockW = Math.max(3, o.rockW * r);
    for (const i of disc) {
      const sd = seeds[cell[i]], dec = (ref) => ref + sd.k * jump * PH + sd.j * sub; role[i] = 2;
      if (arch === 'hill') height[i] = dec(height[nearest[i]]);
      else if (arch === 'lake' || arch === 'falls') {
        if (arch === 'falls' && hm && hm[nearest[i]] && zoneT[i] !== 1) { height[i] = highH; continue; } // the cornice: flat at the height of the high floor
        if (ringWater(i)) { role[i] = 4; height[i] = waterH; } else height[i] = dec(shoreH);
      } else if (arch === 'island') {
        if (dn[i] <= sep || zoneT[i] === 1 || dn[i] > sep + rockW) role[i] = 0; else height[i] = height[nearest[i]] + (dn[i] <= sep + rockW / 2 ? 1 : 2) * jump * PH + sd.j * sub;
      } else { if (dn[i] <= sep) role[i] = 0; else height[i] = dec(height[nearest[i]]); }
    }
    let channelTiles = 0;
    if (arch === 'falls' && hm) { // the channel: 2 tiles wide, at the cornice, beside the high floor on its outer side, from the back edge to where the cornice ends (the fall)
      let lH = 0, nH = 0, lL = 0, nL = 0, lmax = -Infinity, lmin = Infinity; for (const i of fl) { const l = (px(i) - cx) * v[0] + (py(i) - cy) * v[1]; if (hm[i]) { lH += l; nH++; if (l > lmax) lmax = l; if (l < lmin) lmin = l; } else { lL += l; nL++; } }
      const latOf = (i) => (px(i) - cx) * v[0] + (py(i) - cy) * v[1], cor = disc.filter((i) => role[i] === 2 && height[i] === Math.fround(highH) && hm[nearest[i]] && zoneT[i] !== 1);
      if (nH && nL && cor.length) { const side = lL / nL >= lH / nH ? 1 : -1; let cmin = Infinity, cmax = -Infinity; for (const i of cor) { const l = latOf(i); if (l < cmin) cmin = l; if (l > cmax) cmax = l; }
        // along the outer side of the high floor (away from the low floor, so it never crosses the fragment), kept inside the cornice
        let l0 = side > 0 ? Math.max(lmin - 2, cmin + 2) : Math.min(lmax + 2, cmax - 2); if (l0 < cmin + 1 || l0 > cmax - 1) l0 = (cmin + cmax) / 2;
        for (const i of cor) if (Math.abs(latOf(i) - l0) <= 1) { role[i] = 4; height[i] = highH - sub; channelTiles++; } }
    }
    // HARD RULE: nothing hides the fragment. A ray from the tile away from the camera: the first fragment tile it meets is the edge in front of which the tile stands; the tile stays below it
    let capped = 0;
    for (const i of disc) {
      if (role[i] < 2) continue;
      let x = px(i), y = py(i), hit = -1; for (let s = 0; s < 4 * R && hit < 0; s++) { x -= u[0] * 0.5; y -= u[1] * 0.5; const ix = Math.floor(x), iy = Math.floor(y); if (ix < 0 || iy < 0 || ix >= W || iy >= H) break; const j = iy * W + ix; if (frag[j]) hit = j; }
      if (hit >= 0 && height[i] > height[hit] - o.margin * jump) { height[i] = height[hit] - o.margin * jump; capped++; }
    }
    const decoHeight = Float32Array.from(height); // the decoration before the paths
    /* EXITS as PATHS: runs of faces with the same direction and consecutive tiles; parallel runs of the same direction less than mergeGap tiles apart become one. A path of width min(run, width) leaves from the middle face, straight to the
       edge of the disc (bent around a notch of the fragment when needed). By archetype: hill / lake / falls: ON the decoration (it keeps the height of the cell it crosses), after a SPAN at the fragment's height over the water (lake, falls)
       and a short ramp of rampLen tiles; island: a bridge at the fragment's height over the void ring that ends at the rock ring; drop: a ridge (width 1) at the fragment's height all the way to the edge. */
    const fixedOf = (t) => (t.dx ? t.a % W : (t.a / W) | 0), alongOf = (t) => (t.dx ? (t.a / W) | 0 : t.a % W);
    const sortKey = (e) => [e.dx ? e.dx + 5 : e.dy + 20, fixedOf(e), alongOf(e)], sorted = exits.slice().sort((p, q) => { const a = sortKey(p), b = sortKey(q); return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
    let runs = [];
    for (const e of sorted) { const last = runs[runs.length - 1], lf = last && last.faces[last.faces.length - 1]; if (last && last.dx === e.dx && last.dy === e.dy && fixedOf(lf) === fixedOf(e) && alongOf(e) === alongOf(lf) + 1) last.faces.push(e); else runs.push({ dx: e.dx, dy: e.dy, faces: [e] }); }
    const nRuns0 = runs.length, par = runs.map((_, i) => i), find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const span = (ru) => [Math.min(...ru.faces.map(alongOf)), Math.max(...ru.faces.map(alongOf))];
    for (let a = 0; a < runs.length; a++) for (let b = a + 1; b < runs.length; b++) {
      if (runs[a].dx !== runs[b].dx || runs[a].dy !== runs[b].dy || Math.abs(fixedOf(runs[a].faces[0]) - fixedOf(runs[b].faces[0])) >= o.mergeGap) continue;
      const [a0, a1] = span(runs[a]), [b0, b1] = span(runs[b]), gap = Math.max(a0, b0) - Math.min(a1, b1) - 1; if (gap < o.mergeGap) par[find(a)] = find(b);
    }
    const groups = new Map(); runs.forEach((ru, i) => { const k = find(i); if (!groups.has(k)) groups.set(k, { dx: ru.dx, dy: ru.dy, faces: [] }); groups.get(k).faces.push(...ru.faces); });
    runs = [...groups.values()].map((ru) => { ru.faces.sort((p, q) => alongOf(p) - alongOf(q) || fixedOf(p) - fixedOf(q)); return ru; });
    let reached = 0, blocked = 0, bent = 0; const pathTiles = new Set(), pw = arch === 'drop' ? 1 : o.pathWidth;
    const trace = (dx, dy, from) => { // straight from `from` (outside the fragment) to the edge of the disc; null if the fragment is in the way
      const out = []; let x = from[0], y = from[1];
      for (let m = 0; m < 4 * R + 8; m++) { if (x < 0 || y < 0 || x >= W || y >= H) return out; const j = y * W + x; if (frag[j]) return null; if (!inDisc(j)) return out; out.push(j); x += dx; y += dy; }
      return out;
    };
    for (const run of runs) {
      run.width = Math.min(run.faces.length, pw); run.reached = true; run.bent = false; run.length = 0; run.paths = []; run.span = 0;
      const mid = run.faces[Math.floor((run.faces.length - 1) / 2)], lat = run.dx ? [0, 1] : [1, 0]; // lateral unit vector (along the face)
      for (let c = 0; c < run.width; c++) {
        const f = mid, x0 = (f.a % W) + f.dx + lat[0] * c, y0 = ((f.a / W) | 0) + f.dy + lat[1] * c; if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) continue;
        const fa = f.a + lat[1] * c * W + lat[0] * c, h0 = fa < n && frag[fa] ? height[fa] : height[f.a];
        let path = trace(f.dx, f.dy, [x0, y0]);
        if (!path) { for (const [dx, dy] of [[f.dy, f.dx], [-f.dy, -f.dx], [-f.dx, -f.dy]]) { path = trace(dx, dy, [x0, y0]); if (path) { run.bent = true; break; } } }
        if (!path) { if (c === 0) run.reached = false; continue; }
        let sp = 0; // tiles at the fragment's height
        if (arch === 'drop') sp = path.length;
        else if (arch === 'island') { while (sp < path.length && role[path[sp]] === 0) sp++; sp = Math.min(path.length, Math.max(1, Math.min(sp + 1, Math.ceil(sep) + 1))); path = path.slice(0, sp); }
        else if (arch === 'lake' || arch === 'falls') { while (sp < path.length && role[path[sp]] === 4) sp++; }
        const m = Math.min(o.rampLen, path.length - sp - 1), hT = path.length > sp + m ? height[path[sp + m]] : height[path[path.length - 1]];
        for (let t = 0; t < path.length; t++) { const j = path[t]; if (t < sp) height[j] = h0; else if (t < sp + m) height[j] = h0 + (hT - h0) * (t - sp + 1) / (m + 1); role[j] = 3; cell[j] = -1; pathTiles.add(j); }
        run.paths.push(path); run.length = Math.max(run.length, path.length); run.span = Math.max(run.span, sp);
      }
      run.reached ? reached++ : blocked++; if (run.bent) bent++;
    }
    // POND (hill): the lowest cell of the front (lowest offset, then the nearest to the camera) that still has decoration tiles; at most pondMax of the fragment's tiles, the ones nearest to its seed
    let pondCell = -1, pondTiles = 0;
    if (arch === 'hill') {
      const cand = seeds.filter((sd) => sd.k < 0).sort((a, b) => a.k - b.k || b.s - a.s);
      for (const sd of cand) {
        const ts = disc.filter((i) => cell[i] === sd.id && role[i] === 2).sort((a, b) => ((px(a) - sd.x) ** 2 + (py(a) - sd.y) ** 2) - ((px(b) - sd.x) ** 2 + (py(b) - sd.y) ** 2) || a - b);
        if (!ts.length) continue; const take = Math.max(1, Math.min(ts.length, Math.floor(o.pondMax * cnt))); for (let t = 0; t < take; t++) role[ts[t]] = 4; pondCell = sd.id; pondTiles = take; break;
      }
    }
    let decoTiles = 0, roadTiles = 0, backTiles = 0, waterTiles = 0, voidTiles = 0; for (let i = 0; i < n; i++) { if (role[i] === 2 || role[i] === 4) { decoTiles++; if (role[i] === 4) waterTiles++; if (sOf(px(i), py(i)) < sf) backTiles++; } else if (role[i] === 3) roadTiles++; }
    for (const i of disc) if (role[i] === 0) voidTiles++;
    return { disc: { cx: dc[0], cy: dc[1], R, r, centroid: [cx, cy], u, grown, sep }, role, height, decoHeight, cell, seeds, pondCell, exits: runs, waterH, shoreH, info: { arch, fragTiles: cnt, decoTiles, pondTiles, pondMax: Math.floor(o.pondMax * cnt), waterTiles, voidTiles, channelTiles, roadTiles, exitRuns: runs.length, exitRunsBeforeMerge: nRuns0, exitFaces: exits.length, exitsReached: reached, exitsBlocked: blocked, exitsBent: bent, capped, seeds: seeds.length, backDepth: (sf - sBack) * r, backTiles, discGrown: grown, sep, pocketTiles: cnt + decoTiles + roadTiles } };
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

  /* AUTO framing (user's rules). double -> falls; else pos = dominant terrace / (N - 1), rel = the room's mean terrace - the mean of its neighbours' mean terraces, coast = perimeter faces toward void / perimeter faces.
     Low (pos <= 1/3, rel <= -0.3 or coast >= 0.25) -> lake; high (pos >= 2/3 or rel >= +0.3) -> drop; middle: hill if at least half of the neighbours are Cake rooms that are lower (mean < room mean - 0.3) or the largest arc
     without exits (angles of the groups of exit faces per neighbour, seen from the centroid) is >= 180 deg; else island. Returns { arch, reason, stats }. */
  P_.chooseArchetype = function (RL, types, id, P, dbl, exits) {
    const W = RL.W, H = RL.H, N = P.terraces, o = types.rooms.get(id), cnt = new Array(N).fill(0), sum = new Map(), num = new Map();
    let perim = 0, coast = 0, sx = 0, sy = 0, n = 0;
    for (let i = 0; i < W * H; i++) { const r = RL.room[i]; if (r <= 0) continue; sum.set(r, (sum.get(r) || 0) + RL.ter[i]); num.set(r, (num.get(r) || 0) + 1);
      if (r !== id) continue; cnt[RL.ter[i]]++; n++; sx += (i % W) + 0.5; sy += ((i / W) | 0) + 0.5; const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) { perim++; coast++; continue; } const j = ny * W + nx; if (RL.room[j] === id) continue; perim++; if (RL.h[j] <= 0) coast++; } }
    const mean = (r) => sum.get(r) / num.get(r), me = mean(id), nbs = [...o.neigh], rel = nbs.length ? me - nbs.reduce((a, r) => a + mean(r), 0) / nbs.length : 0;
    const dom = cnt.indexOf(Math.max(...cnt)), pos = N > 1 ? dom / (N - 1) : 0.5, costa = perim ? coast / perim : 0, stats = { dom, pos, rel, costa, mean: me };
    if (dbl) return { arch: 'falls', reason: 'double: two floors without a ramp between them', stats };
    if (pos <= 1 / 3) return { arch: 'lake', reason: `low: dominant terrace ${dom} of ${N - 1} (pos ${pos.toFixed(2)} <= 1/3)`, stats };
    if (rel <= -0.3) return { arch: 'lake', reason: `low: ${rel.toFixed(2)} terraces below its neighbours (<= -0.3)`, stats };
    if (costa >= 0.25) return { arch: 'lake', reason: `low: coast ${(costa * 100).toFixed(0)} % of the perimeter (>= 25 %)`, stats };
    if (pos >= 2 / 3) return { arch: 'drop', reason: `high: dominant terrace ${dom} of ${N - 1} (pos ${pos.toFixed(2)} >= 2/3)`, stats };
    if (rel >= 0.3) return { arch: 'drop', reason: `high: ${rel.toFixed(2)} terraces above its neighbours (>= +0.3)`, stats };
    const cakeLow = nbs.filter((r) => types.rooms.get(r).type === E.roomTypes.CAKE && mean(r) < me - 0.3).length; stats.cakeLow = cakeLow; stats.neigh = nbs.length;
    if (nbs.length && cakeLow * 2 >= nbs.length) return { arch: 'hill', reason: `middle: ${cakeLow} of ${nbs.length} neighbours are lower Cake rooms`, stats };
    const cx = sx / n, cy = sy / n, by = new Map(); // exit groups per neighbour: mean direction seen from the centroid
    for (const e of exits) { const a = Math.atan2(e.y - cy, e.x - cx); let q = by.get(e.nb); if (!q) by.set(e.nb, q = [0, 0]); q[0] += Math.cos(a); q[1] += Math.sin(a); }
    const ang = [...by.values()].map((q) => Math.atan2(q[1], q[0])).sort((a, b) => a - b); let arc = 360;
    if (ang.length) { arc = 0; for (let i = 0; i < ang.length; i++) { const nx = i + 1 < ang.length ? ang[i + 1] : ang[0] + 2 * Math.PI; arc = Math.max(arc, (nx - ang[i]) * 180 / Math.PI); } }
    stats.arc = arc;
    if (arc >= 180) return { arch: 'hill', reason: `middle: the largest arc without exits is ${arc.toFixed(0)} deg (>= 180)`, stats };
    return { arch: 'island', reason: `middle: exits all around (largest arc without exits ${arc.toFixed(0)} deg < 180)`, stats };
  };

  /* APPLY to a shape S (the WORLD shape, reframed to the window of the pocket) of a Diorama: everything outside the pocket becomes void (not drawn), the decoration gets levels of its own, the water gets levels of its own (own colour),
     the paths are marked. Sets S.pocket (true), S.pocketRole (Uint8 per window tile: 1 fragment, 2 decoration, 3 path, 4 water), S.pocketInfo. The fragment is not touched (same fine levels, same walkability).
     P.pocketFraming ('auto' or an archetype), P.pocketHeight (multiplies the decoration offsets). S.sliceBox / S.fitH frame the fragment and ~2 r around it; island and drop set S.baseH (the walls over the void go down to it). */
  P_.apply = function (S, P, RL, ids, opts) {
    const n = S.n, W = S.W, H = S.H, K = S.subs, idsSet = new Set(ids), fw = S.mapW, frag = new Uint8Array(n);
    const mapOf = (i) => { const x = (i % W) + S.ox, y = ((i / W) | 0) + S.oy; return x < 0 || y < 0 || x >= fw || y >= S.mapH ? -1 : y * fw + x; }; // -1: outside the map (the border of void of a padded pocket)
    for (let i = 0; i < n; i++) if (idsSet.has(RL.room[mapOf(i)]) && !(S.void && S.void[i])) frag[i] = 1; // the room's tiles of the WORLD shape (whole map, no slice)
    // exits: faces of the fragment border across an open room transition (nb = the neighbouring room, x / y = the face in window tiles)
    const exits = [];
    for (let i = 0; i < n; i++) { if (!frag[i]) continue; const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (frag[j]) continue; const rb = RL.room[mapOf(j)]; if (rb <= 0 || idsSet.has(rb)) continue; if (RL.rp.has(E.rooms.key(mapOf(i), mapOf(j), RL.W * RL.H))) exits.push({ a: i, dx, dy, nb: rb, x: x + S.ox + 0.5 + dx * 0.5, y: y + S.oy + 0.5 + dy * 0.5 }); } }
    // floors first (they need the shape as the world made it): the double / archetype and the heights the framing refers to
    const fl = P_.floors(S, frag, (i) => RL.forb[mapOf(i)] !== 1 && RL.h[mapOf(i)] > 0 && S.region[i] >= 0), dbl = fl.length >= 2;
    const fragH = []; for (let i = 0; i < n; i++) if (frag[i]) fragH.push(S.levelH[S.fine[i]]);
    const fSorted = fl.slice().sort((a, b) => a.h - b.h), lowFloor = fSorted[0], highFloor = fSorted[fSorted.length - 1], lowH = lowFloor ? lowFloor.h : Math.min(...fragH);
    let highMask = null, highH = lowH; if (dbl) { highMask = new Uint8Array(n); const hs = new Set(highFloor.ters); for (let i = 0; i < n; i++) if (frag[i] && hs.has(S.ter[i])) highMask[i] = 1; const hv = []; for (let i = 0; i < n; i++) if (highMask[i]) hv.push(S.levelH[S.fine[i]]); hv.sort((a, b) => a - b); highH = hv[hv.length >> 1]; }
    const want = P.pocketFraming || 'auto', pick = want !== 'auto' && P_.ARCH.includes(want) ? { arch: want, reason: 'chosen manually' } : P_.chooseArchetype(RL, S.types, [...idsSet][0], P, dbl, exits);
    const PH = P.pocketHeight === undefined ? P_.defaults.ph : P.pocketHeight, jump = P.terH, plan = P_.plan(W, H, frag, (i) => S.levelH[S.fine[i]], exits, Object.assign({ ids, jump, sub: E.subHeight(P), arch: pick.arch, ph: PH, lowH, highH, highMask }, opts));
    const d = plan.disc, truncated = d.cx - d.R < 0 || d.cy - d.R < 0 || d.cx + d.R > W || d.cy + d.R > H;
    /* QUANTIZE to the existing grid of heights (user's decision, B costs per level): the decoration and the paths snap DOWN (never higher: the hard rule holds) to the levels of the world (terraces x sub-terraces, the cake rings if on)
       extended beyond the lowest and highest terrace with the same spacing; the jitter then moves a cell between existing sub-levels and creates no new level. */
    { const Kk = S.subs, Nn = S.N, sh = E.subHeight(P), jm = P.terH, bT = (t) => (t < 0 ? E.terBase(0, P, S.center) + t * jm : t >= Nn ? E.terBase(Nn - 1, P, S.center) + (t - Nn + 1) * jm : E.terBase(t, P, S.center)), gs = S.levelH.slice();
      for (let t = -16; t < Nn + 12; t++) for (let q = 0; q < Kk; q++) gs.push(bT(t) + q * sh);
      gs.sort((a, b) => a - b); const G = gs.filter((v, i) => i === 0 || v - gs[i - 1] > 1e-5);
      const snap = (h) => { let lo = 0, hi = G.length - 1; if (h <= G[0]) return G[0]; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (G[m] <= h + 1e-5) lo = m; else hi = m - 1; } return G[lo]; };
      for (let i = 0; i < n; i++) if (plan.role[i] >= 2) { plan.height[i] = snap(plan.height[i]); plan.decoHeight[i] = snap(plan.decoHeight[i]); } }
    /* levels: the heights of the decoration and the paths are inserted in the ranking as levels of their own (never shared with the fragment: a height that equals an existing level is nudged up by 0.003); the water gets levels of its
       own too (+0.006), with their own colour (meta.water), so it is flat and smooth in A and B and the wall under a water tile that falls to another level is water-coloured (the waterfall) */
    const eps = 1e-6, old = S.levelH, hs = new Set(), wk = new Set();
    for (let i = 0; i < n; i++) if (plan.role[i] >= 2) { let h = plan.height[i]; if (plan.role[i] === 4) h += 0.006; else if (old.some((x) => Math.abs(x - h) < 1e-4)) h += 0.003; plan.height[i] = h; const k = Math.round(plan.height[i] / eps); hs.add(k); if (plan.role[i] === 4) wk.add(k); }
    const list = [...hs].sort((a, b) => a - b).map((k) => k * eps), newH = [], newMeta = [], remap = new Array(old.length), hIdx = new Map(); let hi = 0;
    for (let L = 0; L <= S.maxFine; L++) {
      while (hi < list.length && list[hi] < old[L]) { hIdx.set(Math.round(list[hi] / eps), newH.length); newH.push(list[hi]); newMeta.push(null); hi++; }
      remap[L] = newH.length; newH.push(old[L]); newMeta.push(S.levelMeta[L]);
    }
    while (hi < list.length) { hIdx.set(Math.round(list[hi] / eps), newH.length); newH.push(list[hi]); newMeta.push(null); hi++; }
    const N = S.N, lo0 = E.terBase(0, P, S.center), top = E.terBase(N - 1, P, S.center) + (K - 1) * E.subHeight(P), jmp = P.terH;
    newH.forEach((h, L) => { if (newMeta[L]) return; // a level of the decoration: it follows the palette; beyond the lowest / highest terrace it keeps going (darker below, `ext` in terraces) and it is always desaturated (`deco`); water: own colour
      if (wk.has(Math.round(h / eps))) { newMeta[L] = { ter: 0, sub: 0, bridge: false, water: true }; return; }
      if (h <= lo0) { newMeta[L] = { ter: 0, sub: 0, bridge: false, deco: true, ext: (h - lo0) / jmp }; return; } if (h >= top) { newMeta[L] = { ter: N - 1, sub: K - 1, bridge: false, deco: true, ext: (h - top) / jmp }; return; }
      let t = 0; while (t + 1 < N && E.terBase(t + 1, P, S.center) <= h) t++; const lo = E.terBase(t, P, S.center) + (K - 1) * E.subHeight(P), hiB = E.terBase(t + 1, P, S.center);
      newMeta[L] = h <= lo ? { ter: t, sub: K - 1, bridge: false, deco: true } : { ter: t, sub: K - 1, bridge: true, frac: Math.max(0.05, Math.min(0.95, (h - lo) / (hiB - lo))), deco: true }; });
    const fine = new Int16Array(n);
    for (let i = 0; i < n; i++) fine[i] = plan.role[i] >= 2 ? hIdx.get(Math.round(plan.height[i] / eps)) : remap[S.fine[i]];
    S.fine.set(fine); for (const rec of S.stairs || []) if (rec.level !== undefined) rec.level = remap[rec.level];
    S.levelH = newH; S.levelMeta = newMeta; S.maxFine = newH.length - 1;
    // void: everything outside the pocket (fragment + decoration + water + paths) is not drawn; the ring of void of island and drop is not drawn either
    const vd = new Uint8Array(n); for (let i = 0; i < n; i++) vd[i] = plan.role[i] === 0 ? 1 : 0; S.void = vd;
    S.byLevel = Array.from({ length: S.maxFine + 1 }, () => []); for (let i = 0; i < n; i++) if (!vd[i]) S.byLevel[S.fine[i]].push(i);
    S.fineMask = Int16Array.from(S.fine); for (let i = 0; i < n; i++) if (vd[i]) S.fineMask[i] = -1;
    for (let i = 0; i < n; i++) if (plan.role[i] >= 2) S.block[i] = 1; // not walkable
    // framing of the camera: the fragment and ~2 r around it (the rest of the disc spills out of the frame); the vertical fit uses the fragment's heights only; over the void the walls go down to a deep base of the pocket's own
    { const m = Math.ceil(2 * d.r); let x0 = W, y0 = H, x1 = 0, y1 = 0, hmin = Infinity, hmax = -Infinity; for (let i = 0; i < n; i++) if (frag[i]) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x + 1 > x1) x1 = x + 1; if (y < y0) y0 = y; if (y + 1 > y1) y1 = y + 1; const h = S.levelH[S.fine[i]]; if (h < hmin) hmin = h; if (h > hmax) hmax = h; }
      S.sliceBox = { x0: Math.max(0, x0 - m), y0: Math.max(0, y0 - m), x1: Math.min(W, x1 + m), y1: Math.min(H, y1 + m) }; S.fitH = [hmin - 1, hmax + 1.5];
      if (pick.arch === 'island' || pick.arch === 'drop') { let lo = Infinity; for (let i = 0; i < n; i++) if (plan.role[i] > 0 && S.levelH[S.fine[i]] < lo) lo = S.levelH[S.fine[i]]; S.baseH = lo - 3 * jump * PH; } else S.baseH = undefined; }
    { const inP = (t) => plan.role[t] > 0, tiles = (r) => r.bottom.concat(r.top, ...(r.steps || []).map((x) => x.tiles)); // the ramps of the world that are not part of the pocket are not drawn (a ramp must touch the fragment and lie wholly inside the pocket)
      S.stairs = (S.stairs || []).filter((r) => tiles(r).every(inP) && tiles(r).some((t) => frag[t])); }
    S.slice = frag; S.border = null; S.borderKind = null; S.borderInfo = null; // the fragment is the slice (walking, the regions and the ramps are the world's); no border line
    S.pocket = true; S.pocketRole = plan.role; S.pocketPlan = plan;
    let faces = null;
    if (dbl) { const hi2 = fl.slice().sort((a, b) => b.h - a.h), A = hi2[0], B = hi2[hi2.length - 1], u = plan.disc.u; faces = (A.cx - B.cx) * u[0] + (A.cy - B.cy) * u[1] < 0; } // the higher floor is farther from the camera: the cliff between them faces the camera
    S.pocketInfo = Object.assign({}, plan.info, { ids: ((opts && opts.ids) || ids).slice(), archetype: pick.arch, archetypeName: P_.ARCH_NAME[pick.arch], reason: pick.reason, auto: want === 'auto', stats: pick.stats || null, ph: PH, perTerrace: fl.perTerrace, R: d.R, r: d.r, floors: fl.map((f) => f.tiles), double: dbl, cliffFacesCamera: faces, truncated, levelsAdded: newH.length - old.length, baseH: S.baseH });
    return S.pocketInfo;
  };
})(window.EVO = window.EVO || {});
