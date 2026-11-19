/* STAGE 3 CONSTRUCTOR (DAC3): HYBRID EDGE (stage_terrazas79_go.md part 3, decision of [U], A547). A drawing technique of DAC3, cloned from technique A of src/tech.js (`loopsA`, `chaikin`, the rigid stair footprint): the contour of every level is traced tile-exact (`E.maskLoops`, the shared pure tracer) and then, per SEGMENT:
   - the outward normal n of the segment against the view direction v on the ground (the yaw of the room, `E.s3.edge.yaw`): if n points to the CAMERA (the angle between n and -v under 45 degrees) the segment stays SQUARE, as Box draws it;
   - every other segment (the back, the sides, what faces the horizon) is SMOOTHED (Chaikin, `P.smooth` passes, as technique A);
   - the ends of every square segment are FIXED through the passes, so no gap opens between a square run and a smoothed one; a vertex near a stair / ramp (2 tiles) is fixed too, so the footprint of the stairs stays rigid.
   Technique id 'Ah': the viewer asks for it only with the Stage selector "Edge style" = Hybrid; Square (the default) never reaches this file (the canvas is the one of Box, byte for byte). `E.loopsOf` of the shared tech.js is wrapped here ONLY for the id 'Ah' (every other id goes to the original function). Visual only. */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0));
  const X = E.edge = { yaw: 0 };
  const near = (S) => { // tiles within 2 of a carved (stair / ramp) tile
    if (S._edgeNear) return S._edgeNear; const { W, H } = S, out = new Uint8Array(S.n);
    for (let i = 0; i < S.n; i++) if (S.carved && S.carved[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H) out[b * W + a] = 1; } }
    return (S._edgeNear = out);
  };
  /* PR pend P2: tiles whose contour stays SQUARE and glued to the tile like the front: the two tiles of every Ascension wall face (the wall is drawn against the tile edge, a smoothed contour would leave it floating on top) and the Cake ring tiles; the stair / ramp tiles are `near` above */
  const guard = (S) => {
    if (S._edgeGuard !== undefined) return S._edgeGuard; let m = null;
    if (S.ascWalls && S.ascWalls.faces && S.ascWalls.faces.length) { m = new Uint8Array(S.n); for (const f of S.ascWalls.faces) { if (f.i >= 0 && f.i < S.n) m[f.i] = 1; if (f.j >= 0 && f.j < S.n) m[f.j] = 1; } }
    if (S.ringTile) { m = m || new Uint8Array(S.n); for (let i = 0; i < S.n; i++) if (S.ringTile[i]) m[i] = 1; }
    return (S._edgeGuard = m);
  };
  /* clone of chaikin() of tech.js: fixed[i] keeps vertex i; segments on the map border are not cut */
  function chaikin(loop, W, H, it, fixed) {
    let pts = loop, fx = fixed;
    const onB = (a, b) => (a[0] === 0 && b[0] === 0) || (a[0] === W && b[0] === W) || (a[1] === 0 && b[1] === 0) || (a[1] === H && b[1] === H);
    for (let t = 0; t < it; t++) {
      const out = [], of = [], n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n], fa = fx[i], fb = fx[(i + 1) % n];
        if (onB(a, b)) { out.push(a, b); of.push(fa, fb); continue; }
        out.push(fa ? a : [0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], fb ? b : [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
        of.push(fa, fb);
      }
      const np = [], nf = [];
      for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + out.length - 1) % out.length]; if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 1e-6) { np.push(p); nf.push(of[i]); } }
      pts = np; fx = nf;
    }
    return pts;
  }
  /* the segments of a loop: 'sq' = faces the camera (stays square) */
  X.classify = function (loop, inside, look) {
    const n = loop.length, sq = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = loop[i], b = loop[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      let nx = uy, ny = -ux; const mx = (a[0] + b[0]) / 2 + 0.5 * nx, my = (a[1] + b[1]) / 2 + 0.5 * ny; if (inside(Math.floor(mx), Math.floor(my))) { nx = -nx; ny = -ny; } // the outward normal: the cell on that side is not inside
      sq[i] = (nx * -look[0] + ny * -look[1]) > Math.SQRT1_2 + 1e-9;
    }
    return sq;
  };
  X.loops = function (S, L, P) {
    const yaw = X.yaw, key = 'H' + L + ':' + P.smooth + ':' + yaw; if (S.cache[key]) return S.cache[key];
    const { W, H } = S, fine = S.fineMask || S.fine, inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && fine[y * W + x] >= L, look = E.orient ? E.orient.lookOf(yaw) : [0, -1], nr = S.stairs && S.stairs.length && P.anchor !== false ? near(S) : null, gd = guard(S);
    const loops = E.maskLoops(W, H, inside).map((l) => {
      const sq = X.classify(l, inside, look), fix = l.map((p, i) => (sq[i] || sq[(i + l.length - 1) % l.length] ? 1 : 0));
      if (nr) for (let i = 0; i < l.length; i++) { const x = l[i][0], y = l[i][1]; for (const [ax, ay] of [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]]) if (ax >= 0 && ay >= 0 && ax < W && ay < H && nr[ay * W + ax]) fix[i] = 1; }
      if (gd) for (let i = 0; i < l.length; i++) { const x = l[i][0], y = l[i][1]; for (const [ax, ay] of [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]]) if (ax >= 0 && ay >= 0 && ax < W && ay < H && gd[ay * W + ax]) fix[i] = 1; }
      return chaikin(l, W, H, P.smooth, fix);
    });
    return (S.cache[key] = loops);
  };
  const base = E0.loopsOf; if (!base.__hybrid) { const w = (t) => (t === 'Ah' ? X.loops : base(t)); w.__hybrid = true; E0.loopsOf = w; }
})(window.EVO = window.EVO || {});
