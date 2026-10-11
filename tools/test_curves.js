/* Technique C (Tiles to Curves, src/curves.js): the corner rule (tip and opposite move AWAY from the vertex), the cap, determinism, exempt seeds (and their pass-2 sub-cells) unmoved, loops closed and nested
   (checked against the nearest seed), the same jitter after changing the slice (whole-map hashing), and the cost of each preset on the real map.
     node tools/test_curves.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'curves', 'rooms', 'roomtypes', 'pocket', 'render']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, tread: 2, margin: 24, spread: 1 };
const inLoops = (loops, x, y) => { let c = false; for (const lp of loops) for (let i = 0, j = lp.length - 1; i < lp.length; j = i++) { const p = lp[i], q = lp[j]; if ((p[1] > y) !== (q[1] > y) && x < (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]) + p[0]) c = !c; } return c; };
const fake = (W, H, fine) => ({ W, H, n: W * H, fine: Int16Array.from(fine), levelH: [0, 1, 2, 3], ox: 0, oy: 0, cache: {}, void: null, carved: null, levelMeta: [{}, {}, {}, {}] });

(async () => {
  { // the corner rule on a 4 x 4 window: an L of three high tiles and a low tip at (2, 2)
    const lv = new Array(16).fill(0); for (const [x, y] of [[1, 1], [2, 1], [1, 2]]) lv[y * 4 + x] = 1;
    const S = fake(4, 4, lv), cfg = { passes: 1, max: 0.4, jit: 0, jitTall: 0 }, st = E.curves.build(S, P, cfg), g = st.grid, i = 2 * 4 + 2;
    const dx = g.sx[i] - g.bx[i], dy = g.sy[i] - g.by[i], u = Math.SQRT1_2 * 0.4;
    ok('corner rule: the tip (2, 2) moves AWAY from the vertex, along the diagonal, by max', Math.abs(dx - u) < 1e-9 && Math.abs(dy - u) < 1e-9, [dx, dy]);
    const o = 1 * 4 + 1; // the opposite (1, 1) is also the tip of its own corner (+u) and the opposite here (-u): they cancel
    ok('corner rule: opposite -= u * max (the net of the two vertices on a diagonal cancels), no orthogonal neighbour shift', Math.abs(g.sx[o] - g.bx[o]) < 1e-9 && Math.abs(g.sy[o] - g.by[o]) < 1e-9 && Math.abs(g.sx[1 * 4 + 2] - g.bx[1 * 4 + 2]) > 0);
    const lone = fake(4, 4, new Array(16).fill(0).map((_, k) => (k === 2 * 4 + 1 ? 1 : 0))), s2 = E.curves.build(lone, P, cfg).grid;
    ok('a vertex with 2 + 2 levels or a lone tile (the four tip shifts cancel) does not move the seed', Math.abs(s2.sx[9] - s2.bx[9]) < 1e-9 && Math.abs(s2.sy[9] - s2.by[9]) < 1e-9);
    const hs = E.curves.build(fake(4, 4, lv), P, { passes: 1, max: 0.4, jit: 0.3, jitTall: 0 }).grid; // jitter is added after the corner shifts and the total is capped
    ok('the total displacement is capped at max (corner shifts + jitter)', [...hs.sx].every((v, k) => Math.hypot(v - hs.bx[k], hs.sy[k] - hs.by[k]) <= 0.4 + 1e-9));
  }
  const { mk } = await require('./real_pack.js').load(E), S = E.shape(mk(), P, null);
  ok('the real map has carved ramps to test the exemption', S.carved && S.carved.some((v) => v), S.stairs && S.stairs.length);
  for (const name of ['ordered', 'balanced', 'natural']) {
    const PP = Object.assign({}, P, { curves: name }), t0 = Date.now(), st = E.curves.struct(S, PP), tb = Date.now() - t0, g = st.grid, cfg = st.cfg;
    ok(`${name}: the cap is respected in every seed (cell units)`, [...g.sx].every((v, k) => Math.hypot(v - g.bx[k], g.sy[k] - g.by[k]) <= g.cap + 1e-9));
    const st2 = E.curves.build(S, PP);
    ok(`${name}: deterministic (two builds give the same seeds and edges)`, g.sx.every((v, k) => v === st2.grid.sx[k]) && st.info.edges === st2.info.edges);
    let bad = 0, nex = 0; for (let c = 0; c < g.ex.length; c++) if (g.ex[c]) { nex++; if (g.sx[c] !== g.bx[c] || g.sy[c] !== g.by[c]) bad++; }
    ok(`${name}: exempt seeds are unmoved, also the ${cfg.passes === 2 ? 'pass-2 sub-cells' : 'cells'} (${nex} exempt cells)`, nex > 0 && bad === 0, bad);
    const ring = E.curves.exemptTiles(S, PP); let carvedOk = true; for (let i = 0; i < S.n; i++) if (S.carved[i]) { const x = i % S.W, y = (i / S.W) | 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) { const q = (y + b) * S.W + x + a; if (q >= 0 && q < S.n && !ring[q]) carvedOk = false; } }
    ok(`${name}: the footprint of every ramp and its 1-tile ring are exempt`, carvedOk);
    // loops against the nearest seed: a point is inside the loops of level L iff its cell has level >= L; nested levels
    let wrong = 0, nest = 0, tested = 0, seed = 12345; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
    const lv = S.fineMask || S.fine, Ls = [...new Set(Array.from(lv))].filter((v) => v >= 0).sort((a, b) => a - b), picks = [Ls[0], Ls[(Ls.length / 2) | 0], Ls[Ls.length - 1]].filter((v, k, a) => a.indexOf(v) === k);
    const levelAt = (x, y) => { const gx = Math.floor(x / g.cell), gy = Math.floor(y / g.cell); let best = -1, bd = 1e9; for (let yy = Math.max(0, gy - 3); yy <= Math.min(g.gh - 1, gy + 3); yy++) for (let xx = Math.max(0, gx - 3); xx <= Math.min(g.gw - 1, gx + 3); xx++) { const q = yy * g.gw + xx, d = (g.sx[q] - x) ** 2 + (g.sy[q] - y) ** 2; if (d < bd) { bd = d; best = q; } } return g.lev[best]; };
    for (let k = 0; k < 1500; k++) {
      const x = 0.01 + rnd() * (S.W - 0.02), y = 0.01 + rnd() * (S.H - 0.02), l = levelAt(x, y); let prev = true;
      for (const L of Ls.filter((v) => picks.includes(v) || v === l)) { const ins = inLoops(E.loopsC(S, L, PP), x, y); tested++; if (ins !== (l >= L)) wrong++; if (ins && !prev) nest++; prev = ins; }
    }
    ok(`${name}: the loops of every level enclose exactly the cells of level >= L (${tested} tests), and level L + 1 is inside level L`, wrong === 0 && nest === 0, [wrong, nest]);
    const sub = E.loopsC(S, Ls[0], PP); ok(`${name}: loops have at least 3 vertices`, sub.length > 0 && sub.every((l) => l.length >= 3));
    console.log(`INFO ${name}: ${JSON.stringify(Object.assign({}, st.info, { buildMs: tb }))}`);
  }
  { // whole-map hashing: the same seeds after changing the slice (no exemption, away from the window border)
    const PP = Object.assign({}, P, { anchor: false }), pk = mk(), Sw = E.shape(pk, PP, null), Sz = E.shape(mk(), PP, { rect: [60, 60, 140, 140], margin: 8 });
    for (const name of ['ordered', 'balanced']) {
      const a = E.curves.build(Sw, Object.assign({}, PP, { curves: name })), b = E.curves.build(Sz, Object.assign({}, PP, { curves: name })), ga = a.grid, gb = b.grid, k = ga.cell === 1 ? 1 : 2;
      let n = 0, diff = 0; const near = (T, tx, ty) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const a = tx + dx, b = ty + dy; if (a >= 0 && b >= 0 && a < T.W && b < T.H && T.carved[b * T.W + a]) return true; } return false; }; // ramps exist only inside the slice: their tiles change levels there
      for (let y = 4 * k; y < gb.gh - 4 * k; y++) for (let x = 4 * k; x < gb.gw - 4 * k; x++) {
        const cb = y * gb.gw + x, wx = Sz.ox * k + x, wy = Sz.oy * k + y, ca = wy * ga.gw + wx;
        if (near(Sz, (x / k) | 0, (y / k) | 0) || near(Sw, (wx / k) | 0, (wy / k) | 0)) continue; n++;
        if (Math.abs(ga.sx[ca] - (gb.sx[cb] + Sz.ox)) > 1e-9 || Math.abs(ga.sy[ca] - (gb.sy[cb] + Sz.oy)) > 1e-9) diff++;
      }
      ok(`${name}: the seeds in the interior of a slice are the whole-map seeds, away from the ramps (${n} cells, window ${Sz.W} x ${Sz.H} at ${Sz.ox}, ${Sz.oy})`, n > 0 && diff === 0, diff);
    }
  }
  { // exemption sources: Ascension wall faces and Cake ring tiles
    const S3 = fake(5, 5, new Array(25).fill(0)); S3.ascWalls = { faces: [{ i: 6, j: 7 }] }; S3.levelMeta = [{}, { ring: true }, {}, {}]; S3.fine[18] = 1;
    const ex = E.curves.exemptTiles(S3, P);
    ok('exempt: both tiles of an Ascension wall face and the Cake ring tiles; P.anchor === false switches it off', ex[6] === 1 && ex[7] === 1 && ex[18] === 1 && ex[0] === 0 && E.curves.exemptTiles(S3, Object.assign({}, P, { anchor: false })).every((v) => v === 0));
  }
  { // meander: 0 is the identity, > 0 moves the seeds (cap raised to 0.5)
    const S4 = fake(12, 12, new Array(144).fill(0)), cfg = { passes: 1, max: 0.3, jit: 0, jitTall: 0 }, a = E.curves.build(S4, P, cfg).grid, b = E.curves.build(S4, Object.assign({}, P, { meander: 1 }), cfg).grid;
    ok('meander 0: the seeds stay on the tile centres; meander 1 moves them within the raised cap 0.5', a.sx.every((v, k) => v === a.bx[k]) && b.sx.some((v, k) => v !== b.bx[k]) && b.sx.every((v, k) => Math.hypot(v - b.bx[k], b.sy[k] - b.by[k]) <= 0.5 + 1e-9));
  }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
