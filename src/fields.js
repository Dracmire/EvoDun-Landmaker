/* Channels as fields: decoded PNG -> R,G,B,A,H,S,V planes -> roles (numeric / categorical / graded).
   Pure functions, no DOM. */
(function (E) {
  const HUE_GAP = 4;    // degrees: occupied hue bins further apart than this start a new cluster
  const TOL_CAP = 5;    // degrees: hue tolerance never exceeds this (and is 1/4 of the id spacing if smaller)
  const MAX_IDS = 256;
  const BINS = 720;     // hue histogram, 0.5 degree per bin

  E.CHANNELS = ['R', 'G', 'B', 'A', 'H', 'S', 'V'];
  /* [role, kind]: numeric = height-like, categorical = ids (0 = outside), graded = 0..1 mask */
  E.ROLES = [['elevation', 'numeric'], ['zone', 'categorical'], ['edge', 'categorical'], ['path', 'graded'], ['vegetation', 'graded'], ['poi', 'graded']];
  E.RESERVED_ROLES = ['area', 'room']; // accepted in the pack format, not used yet
  E.ELEVATION_SCALE = 1000;            // baked convention: grey = height / 1000

  /* Same algorithm as UnityEngine.Color.RGBToHSV (h, s, v in 0..1). */
  E.rgbToHsv = function (r, g, b, out) {
    let off, dom, c1, c2;
    if (b > g && b > r) { off = 4; dom = b; c1 = r; c2 = g; }
    else if (g > r) { off = 2; dom = g; c1 = b; c2 = r; }
    else { off = 0; dom = r; c1 = g; c2 = b; }
    let h = 0, s = 0;
    if (dom !== 0) {
      const diff = dom - (c1 > c2 ? c2 : c1);
      if (diff !== 0) { s = diff / dom; h = off + (c1 - c2) / diff; } else h = off + (c1 - c2);
      h /= 6;
      if (h < 0) h += 1;
    }
    out[0] = h; out[1] = s; out[2] = dom;
    return out;
  };

  function flipRows(a, W, H) {
    for (let y = 0; y < H >> 1; y++) {
      const t = a.slice(y * W, y * W + W);
      a.copyWithin(y * W, (H - 1 - y) * W, (H - y) * W);
      a.set(t, (H - 1 - y) * W);
    }
  }

  /* dec: result of E.decodePng. Returns { width, height, max, ch: {R,G,B,A,H,S,V} } with planes in 0..1.
     Grey images give R=G=B; palette images are expanded to RGBA. */
  E.imageChannels = function (dec, flipY) {
    const { width: W, height: H, colorType: ct, channels: c } = dec, n = W * H;
    const mk = (src, m) => { const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = src[i] / m; return o; };
    const ones = () => new Float32Array(n).fill(1);
    let R, G, B, A, max = dec.max;
    if (ct === 0) { R = G = B = mk(c[0], max); A = ones(); }
    else if (ct === 4) { R = G = B = mk(c[0], max); A = mk(c[1], max); }
    else if (ct === 2) { R = mk(c[0], max); G = mk(c[1], max); B = mk(c[2], max); A = ones(); }
    else if (ct === 6) { R = mk(c[0], max); G = mk(c[1], max); B = mk(c[2], max); A = mk(c[3], max); }
    else { // palette
      max = 255; R = new Float32Array(n); G = new Float32Array(n); B = new Float32Array(n); A = new Float32Array(n);
      const { rgb, alpha } = dec.palette, np = alpha.length;
      for (let i = 0; i < n; i++) {
        const k = c[0][i];
        if (k < np) { R[i] = rgb[k * 3] / 255; G[i] = rgb[k * 3 + 1] / 255; B[i] = rgb[k * 3 + 2] / 255; A[i] = alpha[k] / 255; }
      }
    }
    const Hh = new Float32Array(n), S = new Float32Array(n), V = new Float32Array(n), t = [0, 0, 0];
    for (let i = 0; i < n; i++) { E.rgbToHsv(R[i], G[i], B[i], t); Hh[i] = t[0]; S[i] = t[1]; V[i] = t[2]; }
    const ch = { R, G, B, A, H: Hh, S, V };
    if (flipY) for (const k of E.CHANNELS) flipRows(ch[k], W, H);
    return { width: W, height: H, max, ch };
  };

  const circ = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d) * 360; }; // degrees between hues 0..1

  /* Categorical ids from hue. V = 0 is "outside" (id 0).
     With o.maxnode the id is always id = round(H * (maxnode + 1)) (valid ids 1..maxnode; 0 and maxnode+1 are
     reserved, so those pixels get -1). Otherwise hue clusters are found and every pixel goes to its nearest
     centre (ids 1..K in hue order); there, pixels whose hue is not reliable get -1.
     Pixels with an unreliable hue are counted in info.ambiguous and flagged in the returned `amb` mask
     (1 = ambiguous); with maxnode they keep their id unless it is reserved. */
  E.categoricalFromHue = function (img, o = {}) {
    const { H, S, V } = img.ch, n = H.length, mx = img.max, ids = new Int32Array(n), amb = new Uint8Array(n);
    const stat = { total: 0, kept: 0, noHue: 0, lowChroma: 0, far: 0, reserved: 0 };
    const chroma = new Float32Array(n);
    for (let i = 0; i < n; i++) chroma[i] = Math.round(S[i] * V[i] * mx); // raw counts, exact for 8/16-bit
    const maxnode = o.maxnode > 0 ? Math.round(o.maxnode) : 0;
    let centres, tol;
    if (maxnode) {
      tol = Math.min(0.25 * 360 / (maxnode + 1), TOL_CAP);
    } else {
      const cnt = new Float64Array(BINS), sn = new Float64Array(BINS), cs = new Float64Array(BINS);
      for (let i = 0; i < n; i++) {
        if (V[i] === 0 || chroma[i] < 1 || 60 / chroma[i] > TOL_CAP) continue;
        const b = Math.min(BINS - 1, Math.floor(H[i] * BINS));
        cnt[b]++; sn[b] += Math.sin(H[i] * 2 * Math.PI); cs[b] += Math.cos(H[i] * 2 * Math.PI);
      }
      const occ = []; for (let b = 0; b < BINS; b++) if (cnt[b]) occ.push(b);
      const binGap = (a, b) => ((b - a + BINS) % BINS) * 360 / BINS;
      const groups = [];
      if (occ.length) {
        let start = 0; // first occupied bin whose predecessor is further than HUE_GAP
        for (let k = 0; k < occ.length; k++) if (binGap(occ[(k + occ.length - 1) % occ.length], occ[k]) > HUE_GAP) { start = k; break; }
        let cur = [occ[start]];
        for (let q = 1; q < occ.length; q++) {
          const a = occ[(start + q - 1) % occ.length], b = occ[(start + q) % occ.length];
          if (binGap(a, b) > HUE_GAP) { groups.push(cur); cur = []; }
          cur.push(b);
        }
        groups.push(cur);
      }
      if (groups.length > MAX_IDS) throw new Error(`Found ${groups.length} distinct hues (limit ${MAX_IDS}); this does not look like a categorical image.`);
      centres = groups.map((g) => {
        let a = 0, b = 0; for (const k of g) { a += sn[k]; b += cs[k]; }
        let h = Math.atan2(a, b) / (2 * Math.PI); if (h < 0) h += 1;
        return h;
      }).sort((p, q) => p - q);
      let spacing = 360;
      for (let k = 0; k < centres.length && centres.length > 1; k++) spacing = Math.min(spacing, circ(centres[k], centres[(k + 1) % centres.length]));
      tol = Math.min(0.25 * spacing, TOL_CAP);
    }
    const count = new Map(); let outside = 0;
    for (let i = 0; i < n; i++) {
      if (V[i] === 0) { outside++; continue; }
      let why = '', id = -1;
      if (chroma[i] < 1) why = 'noHue';
      else if (60 / chroma[i] > tol) why = 'lowChroma';
      if (maxnode) {
        const x = H[i] * (maxnode + 1), r = Math.round(x);
        if (r >= 1 && r <= maxnode) { id = r; if (!why && Math.abs(x - r) * 360 / (maxnode + 1) > tol) why = 'far'; }
        else if (!why) why = 'reserved';
      } else if (!why) {
        let best = -1, bd = 1e9;
        for (let k = 0; k < centres.length; k++) { const d = circ(H[i], centres[k]); if (d < bd) { bd = d; best = k; } }
        if (best < 0 || bd > tol) why = 'far'; else id = best + 1;
      }
      if (why) { stat[why]++; stat.total++; amb[i] = 1; if (id > 0) stat.kept++; }
      ids[i] = id;
      if (id > 0) count.set(id, (count.get(id) || 0) + 1);
    }
    const classes = [...count].sort((p, q) => p[0] - q[0]).map(([id, c]) => ({ id, count: c, hue: maxnode ? id / (maxnode + 1) : centres[id - 1] }));
    return { ids, amb, info: { mode: maxnode ? 'maxnode' : 'deduced', maxnode, tolDeg: tol, classes, outside, ambiguous: stat } };
  };

  /* Categorical ids from a plain channel: every distinct non-zero value is an id, 0 = outside. */
  E.categoricalFromValue = function (img, chan) {
    const v = img.ch[chan], n = v.length, ids = new Int32Array(n), count = new Map(); let outside = 0;
    for (let i = 0; i < n; i++) {
      const id = Math.round(v[i] * img.max);
      if (!id) { outside++; continue; }
      ids[i] = id; count.set(id, (count.get(id) || 0) + 1);
      if (count.size > MAX_IDS) throw new Error(`Channel ${chan} has more than ${MAX_IDS} distinct values; this does not look like a categorical image.`);
    }
    const classes = [...count].sort((p, q) => p[0] - q[0]).map(([id, c]) => ({ id, count: c }));
    return { ids, amb: new Uint8Array(n), info: { mode: 'value', maxnode: 0, tolDeg: 0, classes, outside, ambiguous: { total: 0, kept: 0, noHue: 0, lowChroma: 0, far: 0, reserved: 0 } } };
  };

  /* Edge map labels from hue: red = barrier, cyan = border with a pass. */
  function labelEdges(info) {
    for (const c of info.classes) {
      if (c.hue === undefined) { c.label = 'edge ' + c.id; continue; }
      c.label = circ(c.hue, 0) < 20 ? 'barrier' : circ(c.hue, 0.5) < 20 ? 'pass' : 'edge ' + c.id;
    }
  }

  function ambiguityWarning(role, info) {
    const a = info.ambiguous; if (!a.total) return null;
    const n = info.outside + a.total + info.classes.reduce((s, c) => s + c.count, 0);
    const parts = [];
    if (a.noHue + a.lowChroma) parts.push(`${a.noHue + a.lowChroma} with grey or very low chroma (hue imprecise)`);
    if (a.far) parts.push(`${a.far} far from any ${info.mode === 'maxnode' ? 'id' : 'hue centre'}`);
    if (a.reserved) parts.push(`${a.reserved} on reserved id 0 / maxnode+1`);
    const left = a.total - a.kept;
    return `${role}: ${a.total} px (${(a.total / n * 100).toFixed(2)}%) have an ambiguous hue (${parts.join(', ')}); ` +
      `${a.kept} kept the id from the formula, ${left} left unassigned (id -1); all shown magenta.`;
  }

  /* images: [{ name, width, height, max, ch }]; roles: { role: { image: index, channel } };
     o: { name, maxnode, markers, elevationScale }. Returns an evodun-pack/0.2 object (+ warnings). */
  E.packFromRoles = function (images, roles, o = {}) {
    if (!roles.elevation) throw new Error('Assign a channel to the elevation role.');
    const used = [...new Set(Object.values(roles).map((r) => r.image))];
    const first = images[used[0]];
    for (const k of used) {
      const im = images[k];
      if (!im) throw new Error('A role points to an image that is not loaded.');
      if (im.width !== first.width || im.height !== first.height)
        throw new Error('Images differ in size: ' + used.map((j) => `${images[j].name} ${images[j].width}x${images[j].height}`).join(', ') + ' (all images of a pack must share one size).');
    }
    const field = (r) => {
      if (!E.CHANNELS.includes(r.channel)) throw new Error('Unknown channel ' + r.channel);
      return images[r.image].ch[r.channel];
    };
    const W = first.width, H = first.height, scale = o.elevationScale || E.ELEVATION_SCALE;
    const src = field(roles.elevation), elevation = new Float32Array(W * H);
    let emin = Infinity, emax = -Infinity, lmin = Infinity, lmax = -Infinity, voidN = 0;
    for (let i = 0; i < elevation.length; i++) { elevation[i] = src[i] * scale; const v = elevation[i]; if (v < emin) emin = v; if (v > emax) emax = v; if (v > 0) { if (v < lmin) lmin = v; if (v > lmax) lmax = v; } else voidN++; } // stored (float32) values
    if (voidN && voidN < elevation.length) { emin = lmin; emax = lmax; } // height 0 is VOID (not terrain): the range is the land's
    const fields = {}, warnings = [];
    for (const role of ['zone', 'edge']) {
      const r = roles[role]; if (!r) continue;
      const im = images[r.image];
      fields[role] = r.channel === 'H' ? E.categoricalFromHue(im, { maxnode: role === 'zone' ? o.maxnode : 0 }) : E.categoricalFromValue(im, r.channel);
      if (role === 'edge') labelEdges(fields[role].info);
      const w = ambiguityWarning(role, fields[role].info); if (w) warnings.push(w);
    }
    for (const role of ['path', 'vegetation', 'poi']) if (roles[role]) fields[role] = { values: field(roles[role]) };
    return { format: 'evodun-pack/0.2', name: o.name || 'Images', width: W, height: H, elevation, elevRange: [emin, emax], voidTiles: voidN < elevation.length ? voidN : 0, masks: {}, markers: o.markers || [], fields, warnings };
  };

  /* Zone ids for slicing: every id -1 pixel takes the majority id among its 8 neighbours (neighbours that are
     themselves -1 are ignored; a tie prefers a zone over "outside", then the lowest id), so unassigned pixels
     never open holes. Repeats so that runs of -1 are filled from their borders; what is still unresolved
     becomes 0 (outside). The original ids are not modified. */
  E.fillUnassigned = function (ids, W, H) {
    const out = Int32Array.from(ids);
    let pending = []; for (let i = 0; i < out.length; i++) if (out[i] < 0) pending.push(i);
    for (let pass = 0; pass < 64 && pending.length; pass++) {
      const upd = [], rest = [];
      for (const i of pending) {
        const x = i % W, y = (i / W) | 0, cnt = new Map();
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const v = out[ny * W + nx]; if (v < 0) continue;
          cnt.set(v, (cnt.get(v) || 0) + 1);
        }
        if (!cnt.size) { rest.push(i); continue; }
        let best = -1, bc = 0;
        for (const [v, c] of cnt) if (c > bc || (c === bc && ((best === 0 && v > 0) || (v > 0 && best > 0 && v < best)))) { best = v; bc = c; }
        upd.push(i, best);
      }
      for (let k = 0; k < upd.length; k += 2) out[upd[k]] = upd[k + 1];
      pending = rest;
    }
    for (const i of pending) out[i] = 0;
    return out;
  };

  /* ---- manifest (evodun-pack/0.3 json: roles by image name, slice, stake and objectives in tiles of the whole map; 0.2 is read too) ---- */
  E.VIEWER_KEYS = ['preset', 'rooms', 'cake', 'terraces', 'roomsMinCore', 'rRadius', 'minPlateau']; // the optional `viewer` block of the manifest
  E.parseManifest = function (json) {
    if (!json || (json.format !== 'evodun-pack/0.2' && json.format !== 'evodun-pack/0.3')) throw new Error('Manifest: expected format "evodun-pack/0.3" (or 0.2, without stake and objectives).');
    const known = new Set([...E.ROLES.map((r) => r[0]), ...E.RESERVED_ROLES]), roles = {}, notes = [];
    for (const [role, r] of Object.entries(json.roles || {})) {
      if (!known.has(role)) throw new Error('Manifest: unknown role "' + role + '".');
      if (E.RESERVED_ROLES.includes(role)) { notes.push(`role "${role}" is reserved and ignored.`); continue; }
      if (!r || typeof r.image !== 'string' || !E.CHANNELS.includes(r.channel)) throw new Error(`Manifest: role "${role}" needs { image, channel } with channel in ${E.CHANNELS.join('/')}.`);
      roles[role] = { image: r.image, channel: r.channel };
    }
    let slice = null;
    if (json.slice) {
      const z = json.slice.zones, r = json.slice.rect, m = json.slice.margin;
      if (z !== undefined && !(Array.isArray(z) && z.every((v) => Number.isInteger(v) && v > 0))) throw new Error('Manifest: slice.zones must be a list of positive integers.');
      if (r !== undefined && !(Array.isArray(r) && r.length === 4 && r.every(Number.isInteger))) throw new Error('Manifest: slice.rect must be [x0, y0, x1, y1] (integers, x1/y1 exclusive).');
      if (m !== undefined && !(Number.isInteger(m) && m >= 0)) throw new Error('Manifest: slice.margin must be a non-negative integer.');
      slice = { zones: z || [], rect: r || null, margin: m };
    }
    let viewer = null; // optional block: the viewer's parameters, so that a saved pack reproduces the same picture (absent = defaults)
    if (json.viewer !== undefined && json.viewer !== null) {
      const v = json.viewer, num = (k, lo, hi) => { if (v[k] !== undefined && !(Number.isInteger(v[k]) && v[k] >= lo && v[k] <= hi)) throw new Error(`Manifest: viewer.${k} must be an integer from ${lo} to ${hi}.`); };
      if (typeof v !== 'object') throw new Error('Manifest: viewer must be an object.');
      if (v.preset !== undefined && !['default', 'balanced', 'custom'].includes(v.preset)) throw new Error('Manifest: viewer.preset must be "default", "balanced" or "custom".');
      for (const k of ['rooms', 'cake']) if (v[k] !== undefined && typeof v[k] !== 'boolean') throw new Error(`Manifest: viewer.${k} must be true or false.`);
      num('terraces', 2, 24); num('roomsMinCore', 5, 250); num('rRadius', 3, 30); num('minPlateau', 1, 300);
      viewer = {}; for (const k of E.VIEWER_KEYS) if (v[k] !== undefined) viewer[k] = v[k];
    }
    const pt = (v, what) => { if (!v || !Number.isInteger(v.x) || !Number.isInteger(v.y) || v.x < 0 || v.y < 0) throw new Error(`Manifest: ${what} needs integer { x, y } (tile of the whole map).`); return { x: v.x, y: v.y }; };
    const stake = json.stake === undefined || json.stake === null ? null : pt(json.stake, 'stake');
    if (json.objectives !== undefined && !Array.isArray(json.objectives)) throw new Error('Manifest: objectives must be a list of { x, y }.');
    const objectives = (json.objectives || []).map((o, k) => Object.assign(pt(o, `objective ${k + 1}`), typeof o.label === 'string' ? { label: o.label } : {}));
    return { name: json.name || '', stake, objectives, flipY: !!json.flipY, maxnode: json.maxnode > 0 ? json.maxnode : 0, roles, slice, viewer, markers: json.markers || [], notes };
  };
  E.buildManifest = function (m) {
    const roles = {};
    for (const [role, r] of Object.entries(m.roles)) roles[role] = { image: r.image, channel: r.channel };
    const out = { format: 'evodun-pack/0.3', name: m.name, flipY: !!m.flipY };
    if (m.maxnode) out.maxnode = m.maxnode;
    out.roles = roles;
    if (m.slice) {
      const sl = {};
      if (m.slice.zones && m.slice.zones.length) sl.zones = m.slice.zones.slice();
      if (m.slice.rect) sl.rect = m.slice.rect.slice();
      if (m.slice.margin !== undefined && m.slice.margin !== null) sl.margin = m.slice.margin;
      if (Object.keys(sl).length) out.slice = sl;
    }
    if (m.viewer) { const vb = {}; for (const k of E.VIEWER_KEYS) if (m.viewer[k] !== undefined) vb[k] = m.viewer[k]; if (Object.keys(vb).length) out.viewer = vb; }
    if (m.markers && m.markers.length) out.markers = m.markers;
    if (m.stake) out.stake = { x: m.stake.x, y: m.stake.y };
    if (m.objectives && m.objectives.length) out.objectives = m.objectives.map((o) => Object.assign({ x: o.x, y: o.y }, o.label ? { label: o.label } : {}));
    return out;
  };
})(window.EVO = window.EVO || {});
