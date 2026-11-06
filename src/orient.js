/* STAGE ORIENTATION BY ROOM (mode 3, PR C1; `E.orient`; docs/crystallizers/03-stage/README.md "C1"; P3 of the plan: the DIRECTION of a room).
   For every room of the window list, computed from the GEOMETRY of the window and its list order, NOT from the DAC room type:
   - the AXIS of the walk = from the entry gate (the previous room of the list) to the exit gate (the next room); in the first / last room, from the gate toward the highest part of the room; with no gate at all (a window of one room), from the lowest part of the room to the highest. A gate = the centroid of the walking edges between two consecutive rooms of the list (the same walking graph as the rooms layer);
   - LENGTH along the axis / WIDTH across it (the extent of the room's walkable tiles projected on each): ratio >= RATIO -> Z, <= 1 / RATIO -> X, in between -> Hub (RATIO = 1.5: a HYPOTHESIS, one constant);
   - the YAW of the room, a multiple of 90 degrees (the camera of Cam 6 sits at (sin yaw, cos yaw) in map x / y, as border.js assumes): Z and Hub = the camera looks ALONG the axis, the exit (or the high part) at the BACK; X = the camera looks ACROSS the axis, the higher / more blocked side at the back (the score of the two sides: the mean height difference in H + BLOCK_W x the share of blocked tiles in a band behind the room: HYPOTHESES).
   Visual only: nothing here touches S. Test hooks (`E.orientTest`, tests only): fixedYaw (every room gets that yaw), noRoomFrame (the room framing falls back to the hero's). */
(function (E) {
  'use strict';
  const RATIO = 1.5, BLOCK_W = 0.5, BAND = 8, HIGH_Q = 0.75, LOW_Q = 0.25;
  const norm = (v) => { const m = Math.hypot(v[0], v[1]); return m > 1e-9 ? [v[0] / m, v[1] / m] : null; };
  const yawOf = (look) => { const d = Math.atan2(-look[0], -look[1]) * 180 / Math.PI, q = Math.round(d / 90) * 90; return ((q % 360) + 360) % 360; }; // the camera sits opposite to the look direction
  const lookOf = (yaw) => { const r = yaw * Math.PI / 180; return [-Math.round(Math.sin(r)), -Math.round(Math.cos(r))]; }; // the unit look direction of a yaw that is a multiple of 90
  /* compute(S, P, rooms, tilesPerH, opts?) -> { rooms: [{ id, dir, L, W, ratio, yaw, axis, entry, exit, centre, bbox, hMin, hMax, tiles, why }], byId: Map } (window coordinates) */
  function compute(S, P, rooms, tilesPerH) {
    const W = S.W, n = S.n, tp = tilesPerH || 1, vd = S.void, T = (E.orientTest || {});
    const walk = (i) => !S.block[i] && !(vd && vd[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i]), hOf = (i) => S.levelH[S.fine[i]] / tp;
    const nb = E.walkGraph(S, P), tiles = new Map(); for (const id of rooms) tiles.set(id, []);
    for (let i = 0; i < n; i++) { const r = S.roomMap[i]; if (r > 0 && tiles.has(r) && walk(i)) tiles.get(r).push(i); }
    const gate = (a, b) => { let sx = 0, sy = 0, c = 0; const inB = (j) => S.roomMap[j] === b; for (const i of tiles.get(a) || []) for (const j of nb(i)) if (inB(j) && walk(j)) { sx += (i % W) + (j % W) + 1; sy += ((i / W) | 0) + ((j / W) | 0) + 1; c += 2; } return c ? [sx / c, sy / c] : null; }; // centroid of the walking edges (tile centres)
    const quant = (arr, q) => { const s = arr.slice().sort((p, r) => p - r); return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * (s.length - 1))))]; };
    const out = [], byId = new Map();
    rooms.forEach((id, k) => {
      const ts = tiles.get(id); if (!ts.length) return;
      const xs = ts.map((i) => (i % W) + 0.5), ys = ts.map((i) => ((i / W) | 0) + 0.5), hs = ts.map(hOf), cx = xs.reduce((p, q) => p + q, 0) / ts.length, cy = ys.reduce((p, q) => p + q, 0) / ts.length;
      const hHi = quant(hs, HIGH_Q), hLo = quant(hs, LOW_Q), cen = (pred) => { let sx = 0, sy = 0, c = 0; ts.forEach((_, m) => { if (pred(hs[m])) { sx += xs[m]; sy += ys[m]; c++; } }); return c ? [sx / c, sy / c] : [cx, cy]; };
      const high = cen((h) => h >= hHi), low = cen((h) => h <= hLo);
      const entry = k > 0 ? gate(rooms[k - 1], id) || gate(id, rooms[k - 1]) : null, exit = k < rooms.length - 1 ? gate(id, rooms[k + 1]) || gate(rooms[k + 1], id) : null;
      let axis = null, why;
      if (entry && exit) { axis = norm([exit[0] - entry[0], exit[1] - entry[1]]); why = 'entry gate -> exit gate'; }
      else if (exit) { axis = norm([high[0] - exit[0], high[1] - exit[1]]); why = 'exit gate -> highest part'; }
      else if (entry) { axis = norm([high[0] - entry[0], high[1] - entry[1]]); why = 'entry gate -> highest part'; }
      else { axis = norm([high[0] - low[0], high[1] - low[1]]); why = 'lowest part -> highest part'; }
      if (!axis) { // degenerate (the gate on the high part, a flat room): the principal direction of the tiles, pointing to +y (or +x)
        let sxx = 0, syy = 0, sxy = 0; ts.forEach((_, m) => { const dx = xs[m] - cx, dy = ys[m] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
        const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); axis = [Math.cos(th), Math.sin(th)]; if (axis[1] < -1e-9 || (Math.abs(axis[1]) < 1e-9 && axis[0] < 0)) axis = [-axis[0], -axis[1]]; why += ' (degenerate: principal direction)'; }
      const perp = [-axis[1], axis[0]]; let l0 = 1e9, l1 = -1e9, w0 = 1e9, w1 = -1e9;
      ts.forEach((_, m) => { const a = xs[m] * axis[0] + ys[m] * axis[1], b = xs[m] * perp[0] + ys[m] * perp[1]; l0 = Math.min(l0, a); l1 = Math.max(l1, a); w0 = Math.min(w0, b); w1 = Math.max(w1, b); });
      const L = l1 - l0 + 1, Wd = w1 - w0 + 1, ratio = L / Wd, dir = ratio >= RATIO ? 'Z' : ratio <= 1 / RATIO ? 'X' : 'Hub';
      let yaw;
      if (dir !== 'X') yaw = yawOf(axis);
      else { // across the axis: of the two sides, the higher / more blocked one at the back
        const cands = [yawOf(perp), yawOf([-perp[0], -perp[1]])];
        const score = (yw) => { const d = lookOf(yw), px = [d[1] * -1, d[0]]; let fs = 0, fc = 0, ns = 0, nc = 0, minA = 1e9, maxA = -1e9, minB = 1e9, maxB = -1e9;
          ts.forEach((_, m) => { const a = (xs[m] - cx) * d[0] + (ys[m] - cy) * d[1], b = (xs[m] - cx) * px[0] + (ys[m] - cy) * px[1]; minA = Math.min(minA, a); maxA = Math.max(maxA, a); minB = Math.min(minB, b); maxB = Math.max(maxB, b); if (a > 0) { fs += hs[m]; fc++; } else { ns += hs[m]; nc++; } });
          let far = 0, near = 0; for (let i = 0; i < n; i++) { if (!S.block[i] || (vd && vd[i])) continue; const x = (i % W) + 0.5 - cx, y = ((i / W) | 0) + 0.5 - cy, a = x * d[0] + y * d[1], b = x * px[0] + y * px[1]; if (b < minB || b > maxB) continue; if (a > maxA && a <= maxA + BAND) far++; else if (a < minA && a >= minA - BAND) near++; }
          return (fc && nc ? fs / fc - ns / nc : 0) + BLOCK_W * (far - near) / (far + near + 1); };
        const s0 = score(cands[0]), s1 = score(cands[1]); yaw = s1 > s0 + 1e-9 ? cands[1] : cands[0]; }
      if (T.fixedYaw !== undefined) yaw = T.fixedYaw; // (MUTATION fixedYaw: one yaw for every room)
      let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9; for (const i of ts) { const x = i % W, y = (i / W) | 0; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
      const rec = { id, dir, L: +L.toFixed(1), W: +Wd.toFixed(1), ratio: +ratio.toFixed(2), yaw, axis: [+axis[0].toFixed(3), +axis[1].toFixed(3)], entry, exit, centre: [cx, cy], bbox: [bx0, by0, bx1 + 1, by1 + 1], hMin: Math.min(...hs) * tp, hMax: Math.max(...hs) * tp, tiles: ts.length, why };
      out.push(rec); byId.set(id, rec);
    });
    return { rooms: out, byId, ratio: RATIO };
  }
  E.orient = { RATIO, BLOCK_W, BAND, yawOf, lookOf, compute };
})(window.EVO = window.EVO || {});
