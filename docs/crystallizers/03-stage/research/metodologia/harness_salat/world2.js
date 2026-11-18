/* SALA T, in-page part 2: states, the 9 positions, projection, id render, bands, controls. (Loaded after world.js.) */
(function () {
  'use strict';
  const E = window.EVO, S0 = window.SALAT, { W, H, TP, Yz, idx } = S0;
  S0.POS = { s1: [20, 19], s2: [18, 19], s3: [22, 19], m1: [20, 27], m2: [18, 29], m3: [22, 29], n1: [20, 35], n2: [23, 35], n3: [17, 35] };
  S0.HS = { s1: [0.5, 0.5], s2: [0.5, 0.5], s3: [0.5, 0.5], m1: null, m2: null, m3: null, n1: [0.63, 0.5], n2: [0.63, 0.5], n3: [0.63, 0.5] }; // n: fy is filled by the A6 rule (f)
  const TONE = { clear: '#fff3c4', dark: '#4a4458', island: '#c9785a' };
  S0.TONE = TONE;
  const serp = (x0, z0, x1, z1) => { const p = []; for (let z = z0, k = 0; z <= z1; z++, k++) { const y = Yz(z) + 0.5, a = [x0 + 0.5, y], b = [x1 + 0.5, y]; if (k % 2) p.push(b, a); else p.push(a, b); } return p; };
  S0.serp = serp;
  // the pattern of C3: ring + star rasterised on the 6 x 6 tiles x 17-22, z 28-33 (centre x 20.0, z 31.0 in tile-edge coordinates)
  S0.c3Tiles = (q) => { // ring + star on a size x size footprint centred at (cx, cz) in tile-edge coordinates; returns { paint, foot }
    q = q || {}; const size = q.size || 6, cx = q.cx === undefined ? 20.0 : q.cx, cz = q.cz === undefined ? 31.0 : q.cz, f = size / 6, out = [], foot = [], star = [];
    for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = (k % 2 ? 0.85 : 1.9) * f; star.push([r * Math.cos(a), r * Math.sin(a)]); }
    const inPoly = (px, pz) => { let c = false; for (let i = 0, j = star.length - 1; i < star.length; j = i++) { const [xi, zi] = star[i], [xj, zj] = star[j]; if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) c = !c; } return c; };
    const x0 = Math.round(cx - size / 2), z0 = Math.round(cz - size / 2);
    for (let z = z0; z < z0 + size; z++) for (let x = x0; x < x0 + size; x++) { foot.push([x, z]); const dx = x + 0.5 - cx, dz = z + 0.5 - cz, r = Math.hypot(dx, dz); if ((r >= 2.2 * f && r <= 3.15 * f) || inPoly(dx, dz)) out.push([x, z]); }
    return q.foot ? foot : out;
  };
  const tilesRibbon = (tiles, color) => tiles.map(([x, z]) => ({ pts: [[x + 0.5, Yz(z) + 0.5]], wH: 0.5, color })); // a 1-point ribbon is a disc of radius wH * tilesPerH / 2 = 0.5 tile: only the tile itself (neighbours are 1 away)
  const rectRibbon = (x0, z0, x1, z1, color) => ({ pts: serp(x0, z0, x1, z1), wH: 0.5, color });
  S0.params = {
    A6: { rail: 0.8, post: 1.4 }, A3a: null, A3b: null, A4: { bill: null }, C2: { h: 6, cols: [[14, 16], [25, 16]] }, B3: { h: 4 }, C3: {},
  };
  const lists = () => { // billboards and ribbons of the state
    const on = S0.state.on, objs = [], rib = [], p = S0.params;
    if (on.A4 && p.A4.bill && !p.A4.panel) objs.push(Object.assign({ kind: 'pillar', label: false, shadow: false, color: TONE.clear, mass: 'A4' }, p.A4.bill));
    if (on.C3) rib.push(...tilesRibbon(S0.c3Tiles(p.C3), TONE.dark).map((r) => Object.assign(r, { mass: 'C3' })));
    if (on.B3) { const b = p.B3; rib.push(Object.assign(rectRibbon(b.x === undefined ? 10 : b.x, b.z === undefined ? 22 : b.z, (b.x === undefined ? 10 : b.x) + (b.w || 4) - 1, (b.z === undefined ? 22 : b.z) + (b.d || 5) - 1, TONE.island), { mass: 'B3' })); }
    if (S0.state.placebo) {
      if (!S0.state.noPBBill) objs.push({ kind: 'pillar', x: 35.5, y: Yz(10) + 0.5, hH: 1.5, wH: 1.5, color: TONE.clear, label: false, shadow: false, mass: 'PB-bill' });
      rib.push(Object.assign(rectRibbon(11, 5, 15, 9, TONE.dark), { mass: 'PB-decal' }));
    }
    if (S0.state.extraObjs) objs.push(...S0.state.extraObjs);
    return { objs, rib };
  };
  S0.lists = lists;
  let lastSig = null;
  /* apply(spec): spec = { tricks: ['A6', ...], placebo, pos, hs ([fx, fy] override), extra (name of an internal variant), noPosts } */
  S0.apply = (spec) => {
    const ev = window.__evo, st = ev.st;
    S0.state.on = {}; for (const t of spec.tricks || []) S0.state.on[t] = true;
    S0.state.placebo = !!spec.placebo; S0.state.noPBBill = !!spec.noPBBill; S0.state.extra = spec.extra ? S0.extras[spec.extra] : null; S0.state.extraObjs = spec.extraObjs || null;
    S0.params.A6.noPosts = !!spec.noPosts;
    const sig = JSON.stringify([Object.keys(S0.state.on).sort(), S0.params, spec.extra || '', spec.noPosts || false, spec.hf || 0]);
    const { objs, rib } = lists();
    st.stage.objectList = objs; st.stage.ribbonList = rib; st.stage.objects = 'on';
    const pos = S0.POS[spec.pos || 's1'], hs = spec.hs !== undefined ? spec.hs : S0.HS[spec.pos || 's1'];
    st.hero = { x: pos[0] + 0.5, y: Yz(pos[1]) + 0.5 }; st.stage.heroScreen = hs ? hs.slice() : null; st.follow = true; st.panX = st.panY = 0;
    if (spec.preset) st.preset = spec.preset; if (spec.hf) st.stage.heroFrac = spec.hf;
    if (sig !== lastSig) { lastSig = sig; ev.draw(); } else ev.redraw();
    return sig.length;
  };
  S0.extras = {};
  /* ---------- projection / ids ---------- */
  const dims = () => { const cv = document.querySelector('#stage canvas'); return [cv.clientWidth, window.__evo.st.persH || cv.clientHeight]; };
  S0.camNow = () => { const ev = window.__evo, S = ev.S(), [w, h] = dims(); return { cam: E.makeCam(S, ev.P, ev.view(), w, h), S, w, h, view: ev.view() }; };
  S0.proj = (pts) => { const { cam } = S0.camNow(); return pts.map((p) => cam.p(p[0], p[1], p[2])); }; // [x_map, y_map, h_tiles] -> [px, py]
  S0.groundH = (i) => { const S = window.__evo.S(); return S.levelH[S.fine[i]]; };
  S0.tileTop = (x, z) => { const S = window.__evo.S(), i = idx(x, z); return S.levelH[S.fine[i]]; };
  S0.idsRaw = () => { const { S, w, h, view } = S0.camNow(), b = E.pickBuffer(S, window.__evo.P, view, w, h), d = b.data, out = new Int32Array(w * h); for (let q = 0, i = 0; i < w * h; i++, q += 4) out[i] = d[q + 3] === 255 ? ((d[q] << 16) | (d[q + 1] << 8) | d[q + 2]) : -1; return out; };
  S0.idsB64 = () => { const a = S0.idsRaw(), u = new Uint8Array(a.buffer), parts = [], CH = 0x8000; for (let k = 0; k < u.length; k += CH) parts.push(String.fromCharCode.apply(null, u.subarray(k, k + CH))); return btoa(parts.join('')); };
  S0.meta = () => {
    const ev = window.__evo, S = ev.S(), O = ev.O, [w, h] = dims(), { cam } = S0.camNow();
    const hero = O.hero && O.hero.stats ? { hpx: O.hero.stats.hpx, wpx: O.hero.stats.wpx, k: O.hero.stats.k, base: O.hero.stats.base, x: O.hero.x, y: O.hero.y, feet: O.hero.feet } : null;
    const objs = (O.objects && O.objects.stats || []).map((s) => ({ kind: s.kind, x: s.x, y: s.y, hH: s.hH, tile: s.tile, drawn: s.drawn, visible: s.visible, hpx: s.hpx, wpx: s.wpx, k: s.k, base: s.base, ry: s.ry, outside: !!s.outside }));
    const rib = (O.frame && O.frame.stats || []).map((s) => ({ tiles: s.tiles, drawn: s.drawn, hidden: s.hidden }));
    const sc = cam.sc, D = cam.D;
    return { w, h, hero, objs, rib, sc, D, view: ev.view(), levels: S.levelH.slice(), salat: S.salat, st: { hero: ev.st.hero, hs: ev.st.stage.heroScreen, clamp: ev.st.stageClamp } };
  };
  // walkable mask, path and goal (controls)
  S0.maskInfo = () => {
    const ev = window.__evo, S = ev.S(), P = ev.P, n = S.n, m = new Uint8Array(n); let cnt = 0;
    for (let i = 0; i < n; i++) if (!S.block[i] && !(S.void && S.void[i]) && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i])) { m[i] = 1; cnt++; }
    const a = idx(20, 1), b = idx(20, 31), path = E.route(S, P, a, b);
    const hash = (arr) => { let hh = 2166136261; for (let i = 0; i < arr.length; i++) { hh ^= arr[i] & 255; hh = Math.imul(hh, 16777619) >>> 0; } return hh.toString(16); };
    return { count: cnt, maskHash: hash(m), path: path, pathHash: hash(Int32Array.from(path || [])), pathLen: path ? path.length : 0, goal: b, goalWalkable: !!m[b], regions: S.regionSizes.slice(), mask: Array.from(m) };
  };
  S0.baseBlocked = (x, z) => window.__evo.S().block[idx(x, z)] === 1;
  // bands B1..B5 of the position (DEFINICIONES_T26 section 1): equal depth in tiles along the camera axis between the ground row that touches the bottom edge and the last tile of the current room
  S0.bands = () => {
    const { cam, S, w, h } = S0.camNow(), ev = window.__evo, hero = ev.st.hero, feet = S.levelH[S.fine[Math.floor(hero.y) * W + Math.floor(hero.x)]];
    const g = cam.unp(w / 2, h, feet), yNear = g[1], yFar = Yz(37); // map y of the bottom-edge ground row and the far edge (north end) of the last tile of L1 (z = 37 -> row 18, its far edge y = 18.0)
    return { yNear, yFar, len: yNear - yFar };
  };
})();
(function () {
  'use strict';
  const E = window.EVO, S0 = window.SALAT, { W, Yz, idx } = S0;
  // depth scale k of the hero convention at map points [x, y, h]
  S0.kAt = (pts) => { const { cam } = S0.camNow(); return pts.map((p) => E.stage.depthScale(cam, p[0], p[1], p[2])); };
  // ground heights (tile units) of the current S for a list of tiles [x, z]
  S0.tops = (tiles) => { const S = window.__evo.S(); return tiles.map(([x, z]) => S.levelH[S.fine[idx(x, z)]]); };
  S0.blockedTiles = () => { const S = window.__evo.S(), out = []; for (let i = 0; i < S.n; i++) if (S.block[i] && !(S.void && S.void[i])) out.push(i); return out; };
  S0.ryOf = (x, y) => { const { cam } = S0.camNow(); return cam.ry(x, y); };
})();
(function () {
  'use strict';
  const S0 = window.SALAT;
  // projected boxes of candidate blocks at the CURRENT camera: [{x,z,w,d,h,rel}] -> [{x0,y0,x1,y1,baseY,cx,cy,u,v}]
  S0.scan = (list) => {
    const S = window.__evo.S(), B = S.__base; const out = [];
    for (const c of list) { let gmax = -1e9, gmin = 1e9; for (let zz = c.z; zz < c.z + c.d; zz++) for (let xx = c.x; xx < c.x + c.w; xx++) { const g = B[S0.idx(xx, zz)]; gmax = Math.max(gmax, g); gmin = Math.min(gmin, g); }
      const th0 = c.rel === false ? c.h * 2 : gmax + c.h * 2, ymn0 = S0.Yz(c.z + c.d - 1), ymx0 = S0.Yz(c.z) + 1, mid0 = S0.proj([[c.x + c.w / 2, (ymn0 + ymx0) / 2, th0]])[0], xs0 = mid0[0] > 640 ? c.x : c.x + c.w; // the side face nearest the axis
      const pts = []; for (const [qx, qy] of [[c.x, ymn0], [c.x + c.w, ymn0], [c.x + c.w, ymx0], [c.x, ymx0]]) pts.push(S0.proj([[qx, qy, th0]])[0]); const bp = [[c.x, ymx0], [c.x + c.w, ymx0], [xs0, ymn0]].map(([qx, qy]) => S0.proj([[qx, qy, gmin]])[0]); for (const q of bp) pts.push(q); const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const base = Math.max(bp[0][1], bp[1][1]);
      const th = c.rel === false ? c.h * 2 : gmax + c.h * 2, ymn = S0.Yz(c.z + c.d - 1), ymx = S0.Yz(c.z) + 1, qd = [[c.x, ymn], [c.x + c.w, ymn], [c.x + c.w, ymx], [c.x, ymx]].map(([qx, qy]) => S0.proj([[qx, qy, th]])[0]); let ar = 0; for (let i = 0; i < 4; i++) { const p = qd[i], q = qd[(i + 1) % 4]; ar += p[0] * q[1] - q[0] * p[1]; } ar = Math.abs(ar) / 2; const mid = S0.proj([[c.x + c.w / 2, (ymn + ymx) / 2, th]])[0];
      out.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), baseY: base, area: ar, cx: mid[0], cy: mid[1], band: S0.bandAt((ymn + ymx) / 2) }); }
    return out;
  };
  S0.bandAt = (yc) => { const b = S0.bands(); return Math.max(1, Math.min(5, Math.floor((b.yNear - yc) / b.len * 5) + 1)); };
})();
