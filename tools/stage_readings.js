/* STAGE READINGS (M4a, the paired shot of the MVP; tools only: no DOM, no src/, nothing of the viewer changes): the numbers v85 / v89 read on a Cam 6 shot, computed from the shape S and the projection of the camera (`cam.p`, `cam.D`, `cam.depth`, `cam.sc` of makePersp), NOT from pixels.
   Units: H = the hero's height = `tilesPerH` tiles; window coordinates (tiles); the panel is w x h px.
     M5a  hero height / panel height as DRAWN (tilesPerH * cam.sc * k, k = the depth scale at the hero's FEET, `drawHero` in src/stage.js): heroFrac x 0.984 with the hero at the pivot (his feet are 0.5 H below it: 13.8 % for 0.14). M5aPivot = the same with k at the hero's centre = the pivot: equal to `heroFrac` BY CONSTRUCTION.
     fx, fy  the hero's CENTRE (feet + 0.5 H) as a share of the panel width / height (fyFeet: the feet).
     M5b  the width of the walkable strip across the view at the hero's position, in H (the run of walkable ground through the hero along the screen-horizontal ground direction).
     M8b  the row of the FAR EDGE of the ground beyond the hero: going away from the camera along the hero's column, the first blocked tile (water, void, wall) and then the first walkable tile after it = the far shore; its near edge projected at its own height. In H above the hero's head (head) and above his feet (feet), measured with the hero's px height. With no gap: the last walkable point (gap = 0).
     M3a  the BACKGROUND IS CLOSED: the far edge of the window grid (where the hero's column leaves the grid, at the ground height there) projects at or above the top of the panel (row <= 0); otherwise `bandFrac` = row / h is the share of the panel above the edge that shows nothing.
     M4   the goal / landmark ({ x, y, h }, window coordinates) projects inside the panel.
     M1   the number of distinct walkable levels among the walkable tiles whose centre projects inside the panel (heights in H).
     K    (M5d, INFO) the scale of the remake against the viewer: K by width = M5b(photo) / M5b(viewer), K by depth = M8b(photo) / M8b(viewer), each with its tolerance.
   BANDS = ONE table of hypotheses [R] (like HYP in src/planes.js) with the source of every number; `verdict` applies it. The photo is read separately (docs/crystallizers/03-stage/shots/m4/photo_readings.json: numbers only).
     node tools/test_stage_readings.js */
'use strict';
const BANDS = {
  M5a: { band: [0.08, 0.17], rel: 0.25, src: 'DQ3 band 8-17 % of the frame (v85); tolerance +-25 % of the photo value (decision of 2026-11-09, [R])' },
  fx: { abs: 0.05, src: 'photo fx; tolerance +-0.05 of the frame (decision of 2026-11-09, [R]); the photo is cropped on the right, DQ3 is 16:9, so fx 0.50 is taken [R]' },
  fy: { abs: 0.05, src: 'photo fy (hero centre); tolerance +-0.05 of the frame (decision of 2026-11-09, [R])' },
  M5b: { band: [3.5, 4], rel: 0.25, src: 'Octopath band 3.5-4 H (n not declared, v85) OR +-25 % of the photo value (decision of 2026-11-09, [R])' },
  M8b: { abs: 0.5, src: 'photo M8b (head); tolerance +-0.5 H (decision of 2026-11-09, [R])' },
  M1: { band: [1, 3], src: 'DQ3 band 1-3 walkable levels visible (v85)' },
  M3a: { want: true, src: 'closed background expected (DQ3, v85)' },
  M4: { src: 'goal inside the frame at the entry shot; N/A against the photo (the goal of the place is where the party stands)' },
  // references of other games for the rooms (INFO: nothing reads them in a shot of one room): back wall 2.4 H, verticals M10 3-6 H, clearing M5c 7-16 H [Ref]
  wall: { H: 2.4, src: 'back wall 2.4 H [Ref]' }, vertical: { band: [3, 6], src: 'verticals M10 3-6 H [Ref]' }, clearing: { band: [7, 16], src: 'clearing M5c 7-16 H [Ref]' }
};

const walkableAt = (S, x, y) => { const cx = Math.floor(x), cy = Math.floor(y); if (cx < 0 || cy < 0 || cx >= S.W || cy >= S.H) return false; const i = cy * S.W + cx; return !S.block[i] && !(S.void && S.void[i]); };
const feetAt = (S, x, y) => { const cx = Math.max(0, Math.min(S.W - 1, Math.floor(x))), cy = Math.max(0, Math.min(S.H - 1, Math.floor(y))); return S.levelH[S.fine[cy * S.W + cx]]; };

/* S: shape (W, H, block, void, fine, levelH); cam: makePersp camera; o = { hero: { x, y }, feet, tilesPerH, yaw (degrees), goal: { x, y, h } | null } */
function compute(S, cam, w, h, o) {
  const tp = o.tilesPerH, hx = o.hero.x, hy = o.hero.y, feet = o.feet, yaw = o.yaw * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const a = [cy, -sy], far = [-sy, -cy];                       // screen-right and away-from-the-camera directions on the ground (relTo in src/render.js)
  const dsc = (hh) => (cam.persp ? cam.D / Math.max(cam.D - cam.depth(hx, hy, hh), 0.05 * cam.D) : 1), k = dsc(feet), hpx = tp * cam.sc * k, hpxPivot = tp * cam.sc * dsc(feet + tp / 2); // drawn at the feet (drawHero) / at the hero centre (the pivot: = heroFrac * panel height)
  const pF = cam.p(hx, hy, feet), pH = cam.p(hx, hy, feet + tp), pC = cam.p(hx, hy, feet + tp / 2), STEP = 0.05;
  const run = (dx, dy) => { let t = 0; while (t < 400 && walkableAt(S, hx + dx * (t + STEP), hy + dy * (t + STEP))) t += STEP; return t; };
  const M5b = (run(a[0], a[1]) + run(-a[0], -a[1])) / tp;
  // far edge beyond the hero
  let t = run(far[0], far[1]), gap = 0, edge = { x: hx + far[0] * t, y: hy + far[1] * t, h: feetAt(S, hx + far[0] * t, hy + far[1] * t) };
  { let g = t + STEP; const lim = 400; while (g < lim && !walkableAt(S, hx + far[0] * g, hy + far[1] * g) && Math.floor(hx + far[0] * g) >= 0 && Math.floor(hy + far[1] * g) >= 0 && hx + far[0] * g < S.W && hy + far[1] * g < S.H) g += STEP;
    if (g < lim && walkableAt(S, hx + far[0] * g, hy + far[1] * g)) { gap = g - t; edge = { x: hx + far[0] * g, y: hy + far[1] * g, h: feetAt(S, hx + far[0] * g, hy + far[1] * g) }; } }
  const pe = cam.p(edge.x, edge.y, edge.h), M8b = { head: (pH[1] - pe[1]) / hpx, feet: (pF[1] - pe[1]) / hpx, row: pe[1] / h, gapH: gap / tp };
  // the far edge of the window grid along the hero's column
  let t2 = 0; while (hx + far[0] * (t2 + STEP) >= 0 && hy + far[1] * (t2 + STEP) >= 0 && hx + far[0] * (t2 + STEP) <= S.W && hy + far[1] * (t2 + STEP) <= S.H && t2 < 1000) t2 += STEP;
  const gx = hx + far[0] * t2, gy = hy + far[1] * t2, pg = cam.p(gx, gy, feetAt(S, gx, gy)), M3a = { closed: pg[1] <= 0, bandFrac: Math.max(0, pg[1]) / h, row: pg[1] / h };
  const M4 = o.goal ? (() => { const p = cam.p(o.goal.x, o.goal.y, o.goal.h); return { inFrame: p[0] >= 0 && p[0] <= w && p[1] >= 0 && p[1] <= h, fx: p[0] / w, fy: p[1] / h }; })() : null;
  const lv = new Set(); for (let y = 0; y < S.H; y++) for (let x = 0; x < S.W; x++) { if (!walkableAt(S, x + 0.5, y + 0.5)) continue; const hh = feetAt(S, x + 0.5, y + 0.5), p = cam.p(x + 0.5, y + 0.5, hh); if (p[0] >= 0 && p[0] <= w && p[1] >= 0 && p[1] <= h) lv.add(Math.round(hh / tp * 1000) / 1000); }
  return { M5a: hpx / h, M5aPivot: hpxPivot / h, fx: pC[0] / w, fy: pC[1] / h, fyFeet: pF[1] / h, M5b, M8b, M3a, M4, M1: { n: lv.size, heights: [...lv].sort((p, q) => p - q) }, hpx };
}

/* K (M5d): the scale of the remake against the viewer. photo = { M5b: { value, tol }, M8b: { value, tol } } (head); view = the readings of the viewer */
function kReading(photo, view) {
  const q = (p, v) => (v > 1e-9 ? { k: p.value / v, tol: p.tol / v } : { k: null, tol: null });
  return { width: q(photo.M5b, view.M5b), depth: q(photo.M8b, view.M8b.head) };
}

/* verdict: 'PASA' | 'FALLA' | 'INFO' | 'N-A'. photo = the entry of photo_readings.json for that reading (or null for rooms); judge = false makes every row INFO. */
function verdict(name, v, photo, judge) {
  const B = BANDS[name]; if (judge === false) return 'INFO';
  const near = (x, ref, rel, abs) => (rel !== undefined ? Math.abs(x - ref) <= rel * Math.abs(ref) : Math.abs(x - ref) <= abs), inBand = (x, b) => x >= b[0] && x <= b[1];
  switch (name) {
    case 'M5a': return photo ? (near(v, photo.value, B.rel) ? 'PASA' : 'FALLA') : (inBand(v, B.band) ? 'PASA' : 'FALLA');
    case 'fx': case 'fy': return photo ? (near(v, photo.value, undefined, B.abs) ? 'PASA' : 'FALLA') : 'INFO';
    case 'M5b': return photo ? (near(v, photo.value, B.rel) || inBand(v, B.band) ? 'PASA' : 'FALLA') : (inBand(v, B.band) ? 'PASA' : 'FALLA');
    case 'M8b': return photo ? (near(v, photo.value, undefined, B.abs) ? 'PASA' : 'FALLA') : 'INFO';
    case 'M1': return inBand(v, B.band) ? 'PASA' : 'FALLA';
    case 'M3a': return v === B.want ? 'PASA' : 'FALLA';
    case 'M4': return photo === 'na' ? 'N-A' : (v ? 'PASA' : 'FALLA');
    default: return 'INFO';
  }
}
module.exports = { BANDS, compute, kReading, verdict, walkableAt };
