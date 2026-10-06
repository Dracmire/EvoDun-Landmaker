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

  /* Categorical ids from hue. V = 0 is "outside" (id 0). With o.maxnode, id = round(H * (maxnode + 1)).
     Otherwise hue clusters are found and every pixel goes to its nearest centre (ids 1..K in hue order).
     Pixels whose hue is not reliable are NOT assigned: id -1 and counted in info.ambiguous. */
  E.categoricalFromHue = function (img, o = {}) {
    const { H, S, V } = img.ch, n = H.length, mx = img.max, ids = new Int32Array(n);
    const amb = { total: 0, noHue: 0, lowChroma: 0, far: 0, reserved: 0 };
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
      let groups = [];
      if (occ.length) {
        let start = 0; // first occupied bin whose predecessor is further than HUE_GAP
        for (let k = 0; k < occ.length; k++) if (binGap(occ[(k + occ.length - 1) % occ.length], occ[k]) > HUE_GAP) { start = k; break; }
        let cur = [occ[start]];
        for (let s = 1; s < occ.length; s++) {
          const a = occ[(start + s - 1) % occ.length], b = occ[(start + s) % occ.length];
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
      let id = -1, why = '';
      if (chroma[i] < 1) why = 'noHue';
      else if (60 / chroma[i] > tol) why = 'lowChroma';
      else if (maxnode) {
        const x = H[i] * (maxnode + 1); id = Math.round(x);
        if (id < 1 || id > maxnode) { why = 'reserved'; id = -1; }
        else if (Math.abs(x - id) * 360 / (maxnode + 1) > tol) { why = 'far'; id = -1; }
      } else {
        let best = -1, bd = 1e9;
        for (let k = 0; k < centres.length; k++) { const d = circ(H[i], centres[k]); if (d < bd) { bd = d; best = k; } }
        if (best < 0 || bd > tol) why = 'far'; else id = best + 1;
      }
      if (id < 0) { amb[why]++; amb.total++; ids[i] = -1; continue; }
      ids[i] = id; count.set(id, (count.get(id) || 0) + 1);
    }
    const classes = [...count].sort((p, q) => p[0] - q[0]).map(([id, c]) => ({ id, count: c, hue: maxnode ? id / (maxnode + 1) : centres[id - 1] }));
    return { ids, info: { mode: maxnode ? 'maxnode' : 'deduced', maxnode, tolDeg: tol, classes, outside, ambiguous: amb } };
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
    return { ids, info: { mode: 'value', maxnode: 0, tolDeg: 0, classes, outside, ambiguous: { total: 0, noHue: 0, lowChroma: 0, far: 0, reserved: 0 } } };
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
    return `${role}: ${a.total} px (${(a.total / n * 100).toFixed(2)}%) have an ambiguous hue (${parts.join(', ')}); left unassigned (id -1, shown magenta).`;
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
    for (let i = 0; i < elevation.length; i++) elevation[i] = src[i] * scale;
    const fields = {}, warnings = [];
    for (const role of ['zone', 'edge']) {
      const r = roles[role]; if (!r) continue;
      const im = images[r.image];
      fields[role] = r.channel === 'H' ? E.categoricalFromHue(im, { maxnode: role === 'zone' ? o.maxnode : 0 }) : E.categoricalFromValue(im, r.channel);
      if (role === 'edge') labelEdges(fields[role].info);
      const w = ambiguityWarning(role, fields[role].info); if (w) warnings.push(w);
    }
    for (const role of ['path', 'vegetation', 'poi']) if (roles[role]) fields[role] = { values: field(roles[role]) };
    return { format: 'evodun-pack/0.2', name: o.name || 'Images', width: W, height: H, elevation, masks: {}, markers: o.markers || [], fields, warnings };
  };

  /* ---- manifest (evodun-pack/0.2 json: roles by image name) ---- */
  E.parseManifest = function (json) {
    if (!json || json.format !== 'evodun-pack/0.2') throw new Error('Manifest: expected format "evodun-pack/0.2".');
    const known = new Set([...E.ROLES.map((r) => r[0]), ...E.RESERVED_ROLES]), roles = {}, notes = [];
    for (const [role, r] of Object.entries(json.roles || {})) {
      if (!known.has(role)) throw new Error('Manifest: unknown role "' + role + '".');
      if (E.RESERVED_ROLES.includes(role)) { notes.push(`role "${role}" is reserved and ignored.`); continue; }
      if (!r || typeof r.image !== 'string' || !E.CHANNELS.includes(r.channel)) throw new Error(`Manifest: role "${role}" needs { image, channel } with channel in ${E.CHANNELS.join('/')}.`);
      roles[role] = { image: r.image, channel: r.channel };
    }
    return { name: json.name || '', flipY: !!json.flipY, maxnode: json.maxnode > 0 ? json.maxnode : 0, roles, markers: json.markers || [], notes };
  };
  E.buildManifest = function (m) {
    const roles = {};
    for (const [role, r] of Object.entries(m.roles)) roles[role] = { image: r.image, channel: r.channel };
    const out = { format: 'evodun-pack/0.2', name: m.name, flipY: !!m.flipY };
    if (m.maxnode) out.maxnode = m.maxnode;
    out.roles = roles;
    if (m.markers && m.markers.length) out.markers = m.markers;
    return out;
  };
})(window.EVO = window.EVO || {});
