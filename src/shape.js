/* EvoDun crystal viewer - level shaping: terraces, micro steps, passes, walk regions */
(function (E) {
  const N4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function comps(W, H, val, grp) {
    const id = new Int32Array(W * H).fill(-1), list = [], st = [];
    for (let s = 0; s < W * H; s++) {
      if (id[s] >= 0) continue;
      const c = list.length, l = [s];
      id[s] = c; st.length = 0; st.push(s);
      while (st.length) {
        const i = st.pop(), x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of N4) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (id[j] >= 0 || val[j] !== val[s] || grp[j] !== grp[s]) continue;
          id[j] = c; l.push(j); st.push(j);
        }
      }
      list.push(l);
    }
    return { id, list };
  }

  /* merge tiny equal-value regions into the majority neighbour (minimum plateau width) */
  function cleanup(W, H, val, grp, minArea) {
    if (minArea <= 1) return;
    for (let pass = 0; pass < 8; pass++) {
      const { list } = comps(W, H, val, grp);
      let changed = false;
      for (const l of list) {
        if (l.length >= minArea) continue;
        const g = grp[l[0]], v0 = val[l[0]], cnt = new Map();
        for (const i of l) {
          const x = i % W, y = (i / W) | 0;
          for (const [dx, dy] of N4) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const j = ny * W + nx;
            if (grp[j] !== g || val[j] === v0) continue;
            cnt.set(val[j], (cnt.get(val[j]) || 0) + 1);
          }
        }
        if (!cnt.size) continue;
        let best = null, bc = -1;
        for (const [v, c] of cnt) {
          if (c > bc || (c === bc && Math.abs(v - v0) < Math.abs(best - v0))) { best = v; bc = c; }
        }
        for (const i of l) val[i] = best;
        changed = true;
      }
      if (!changed) break;
    }
  }

  function blur3(a, W, H) {
    const o = new Float32Array(a.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        s += a[ny * W + nx]; c++;
      }
      o[y * W + x] = s / c;
    }
    return o;
  }

  E.hOf = function (fine, P) {
    const K = P.micro;
    return Math.floor(fine / K) * P.terH + (fine % K) * P.microH;
  };

  E.shape = function (pack, P) {
    const W = pack.width, H = pack.height, n = W * H, N = P.terraces, K = P.micro;
    let el = Float32Array.from(pack.elevation);
    for (let p = 0; p < P.pre; p++) el = blur3(el, W, H);
    let mn = Infinity, mx = -Infinity;
    for (const v of el) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const U = new Float32Array(n), ter = new Int16Array(n), mic = new Int16Array(n), g0 = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      U[i] = (el[i] - mn) / (mx - mn || 1) * N;
      ter[i] = Math.min(N - 1, Math.floor(U[i]));
    }
    cleanup(W, H, ter, g0, P.minPlateau);
    for (let i = 0; i < n; i++) {
      const t0 = Math.min(N - 1, Math.floor(U[i]));
      if (K <= 1) mic[i] = 0;
      else if (ter[i] === t0) mic[i] = Math.min(K - 1, Math.floor((U[i] - t0) * K));
      else mic[i] = ter[i] > t0 ? 0 : K - 1;
    }
    cleanup(W, H, mic, ter, P.minMicro);
    const fine = new Int16Array(n);
    let maxFine = 0;
    for (let i = 0; i < n; i++) { fine[i] = ter[i] * K + mic[i]; if (fine[i] > maxFine) maxFine = fine[i]; }
    const byLevel = Array.from({ length: maxFine + 1 }, () => []);
    for (let i = 0; i < n; i++) byLevel[fine[i]].push(i);
    const masks = pack.masks || {};
    const S = {
      W, H, n, U, ter, mic, fine, maxFine, byLevel, K, N,
      water: masks.water || new Array(n).fill(0),
      snake: masks.snake || null, cave: masks.cave || null, waterfall: masks.waterfall || null,
      markers: pack.markers || [], name: pack.name, cache: {}
    };
    computePasses(S, P);
    computeRegions(S, P);
    return S;
  };

  function computePasses(S, P) {
    const { W, H, ter, U, water } = S;
    const g0 = new Int16Array(S.n);
    const reg = comps(W, H, ter, g0).id; // same-terrace regions
    const cand = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (Math.abs(ter[i] - ter[j]) !== 1) continue;
        if (water[i] || water[j]) continue;
        const a = ter[i] < ter[j] ? i : j, b = a === i ? j : i;
        cand.push({ a, b, g: Math.abs(U[i] - U[j]) });
      }
    }
    cand.sort((p, q) => p.g - q.g);
    const chosen = [], pair = new Set(), usedA = new Set(), usedB = new Set();
    const bx = (c) => c.b % W, by = (c) => (c.b / W) | 0;
    const take = (c) => { chosen.push(c); usedA.add(c.a); usedB.add(c.b); };
    for (const c of cand) { // best pass per region pair keeps regions connectable
      const key = reg[c.a] + ':' + reg[c.b];
      if (pair.has(key) || usedA.has(c.a) || usedB.has(c.b)) continue;
      pair.add(key); take(c);
    }
    for (const c of cand) {
      if (usedA.has(c.a) || usedB.has(c.b)) continue;
      let ok = true;
      for (const o of chosen) {
        if (Math.hypot(bx(c) - bx(o), by(c) - by(o)) < P.passGap) { ok = false; break; }
      }
      if (ok) take(c);
    }
    S.passes = chosen;
  }

  function computeRegions(S, P) {
    const { W, H, ter, mic, water } = S, n = S.n;
    const par = new Int32Array(n).map((_, i) => i);
    const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (water[i]) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (water[j]) continue;
        if (ter[i] === ter[j] && Math.abs(mic[i] - mic[j]) <= P.climb) uni(i, j);
      }
    }
    for (const p of S.passes) uni(p.a, p.b);
    const idOf = new Map(), region = new Int32Array(n).fill(-1), sizes = [];
    for (let i = 0; i < n; i++) {
      if (water[i]) continue;
      const r = find(i);
      if (!idOf.has(r)) { idOf.set(r, sizes.length); sizes.push(0); }
      region[i] = idOf.get(r); sizes[region[i]]++;
    }
    S.region = region; S.regionSizes = sizes;
  }

  /* demo packs */
  E.noisePack = function (W, H, seed) {
    let s = seed >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const sm = (t) => t * t * (3 - 2 * t);
    const octave = (G) => { // own lattice per octave, so no octave ever wraps or jumps
      const grid = Array.from({ length: G + 1 }, () => Array.from({ length: G + 1 }, rnd));
      return (x, y) => {
        const gx = x * G / W, gy = y * G / H, x0 = Math.min(G - 1, Math.floor(gx)), y0 = Math.min(G - 1, Math.floor(gy));
        const tx = sm(gx - x0), ty = sm(gy - y0);
        const a = grid[y0][x0], b = grid[y0][x0 + 1], c = grid[y0 + 1][x0], d = grid[y0 + 1][x0 + 1];
        return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
      };
    };
    const o1 = octave(9), o2 = octave(18);
    const el = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      el.push(+(o1(x, y) * 0.65 + o2(x, y) * 0.35).toFixed(3) * 9 + 1);
    }
    return { format: 'evodun-pack/0.1', name: 'Value noise (base pipeline stand-in)', width: W, height: H, elevation: el, masks: {}, markers: [] };
  };

  E.imagePack = function (img, channel, maxSide, name) {
    const sc = Math.min(1, maxSide / Math.max(img.width, img.height));
    const W = Math.max(2, Math.round(img.width * sc)), H = Math.max(2, Math.round(img.height * sc));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.imageSmoothingEnabled = false;
    cx.drawImage(img, 0, 0, W, H);
    const d = cx.getImageData(0, 0, W, H).data, el = [];
    let semi = 0;
    for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] !== 255) semi++;
    const warnings = semi ? [`${semi} pixels have alpha < 255: canvas premultiplies alpha, so their RGB values are not read exactly.`] : [];
    for (let i = 0; i < W * H; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      const v = channel === 'r' ? r : channel === 'g' ? g : channel === 'b' ? b : 0.299 * r + 0.587 * g + 0.114 * b;
      el.push(v / 255 * 9 + 1);
    }
    return { format: 'evodun-pack/0.1', name: name || 'Image', width: W, height: H, elevation: el, masks: {}, markers: [], warnings };
  };
})(window.EVO = window.EVO || {});
