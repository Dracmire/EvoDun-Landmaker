/* STAGE, PR S1: the geometry of the hero tracking (src/stage.js and the optional `view.focus` of Cam 6 in src/render.js), no browser.
   - the camera WITHOUT a focus is byte-identical to the one before PR S1 (a golden hash of the projection of 2 scenes x 2 panels x 4 views, computed with the render.js of PR G);
   - the hero size: the 3D hero centre (feet + 0.5 H) projects to the screen centre (+-1 px) and the drawn height of the feet-anchored billboard is heroFrac x panel height (+-2 %), for heroFrac 0.10 / 0.14 / 0.17 and tilesPerH 2 / 3;
   - near/hero 1.39 and far/hero 0.60 (+-0.01) from the viewer's own projection (the design reference: rig.py, Cam 6 pitch 25 / FOV 30, heroFrac 0.14);
   - the clamp: sideways and on the near side, never on the far side, the target height is the hero's, a window narrower than the view is centred.
     node tools/test_stage_cam.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'render', 'stage']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, SG = E.stage; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 1, anchor: true, rooms: false };
const shapeOf = (f) => E.shape(JSON.parse(fs.readFileSync(path.join(__dirname, '../data', f), 'utf8')), P, null);

// 1. no focus = the camera of PR G (golden hash, tools/test_stage_cam.js header)
const GOLDEN = 'c3b71ae8683163c925e88dd76c88a365d9d01587', goldenHash = () => {
  const out = [];
  for (const file of ['shrine_pier_x4.json', 'snake_mountain_surface.json']) {
    const S = shapeOf(file);
    for (const [w, h] of [[1220, 767], [900, 700]]) {
      const fit = E.fitScale(S, P, { kind: 'persp', yaw: 0, pitch: 25, persH: h }, w, h);
      for (const [zoom, panX, panY, yaw, pitch] of [[1, 0, 0, 0, 25], [3, 12, -7, 0, 25], [5.9, 0, 0, 20, 30], [2, -30, 40, -90, 25]]) {
        const cam = E.makeCam(S, P, { kind: 'persp', yaw, pitch, zoom, panX, panY, fitSc: fit, persH: h }, w, h);
        out.push(fit.toFixed(9), cam.sc.toFixed(9), cam.D.toFixed(9));
        for (let k = 0; k < 12; k++) { const p = cam.p(3 + k * 2.5, 4 + k * 1.7, 1 + (k % 4)); out.push(p[0].toFixed(7), p[1].toFixed(7)); }
      }
    }
  }
  return crypto.createHash('sha1').update(out.join(',')).digest('hex');
};
{
  const h = goldenHash(); ok('CAMERA WITHOUT A FOCUS is byte-identical to the one of PR G (golden hash of 432 projected numbers)', h === GOLDEN, h);
  E.stageTest = { focusLeak: true }; const hm = goldenHash(); E.stageTest = null;
  ok('MUTATION: a focus input that changes the camera when it is absent (the pivot height +0.01): the golden check FAILS', hm !== GOLDEN);
}

// 2. the hero size, the pivot and near / far, from the viewer's own projection
const S0 = shapeOf('shrine_pier_x4.json');
const stub = new Proxy({}, { get: (t, k) => (k === 'canvas' ? null : () => ({})), set: () => true }); // a no-op 2D context
for (const [w, h] of [[1220, 767], [1000, 600]]) for (const tp of [2, 3]) for (const hf of [0.10, 0.14, 0.17]) {
  const fit = E.fitScale(S0, P, { kind: 'persp', yaw: 0, pitch: 25, persH: h }, w, h), sc = SG.scale(h, hf, tp), x = 20, y = 20, feet = 1.2, hc = feet + 0.5 * tp;
  const cam = E.makeCam(S0, P, { kind: 'persp', yaw: 0, pitch: 25, zoom: sc / fit, panX: 0, panY: 0, fitSc: fit, persH: h, focus: [x, y, hc] }, w, h);
  const c = cam.p(x, y, hc), o = { x, y, feet, hTiles: tp, wTiles: SG.HERO_W * tp }, st = SG.drawHero(stub, cam, o), k = SG.depthScale(cam, x, y, feet);
  ok(`${w}x${h} tilesPerH ${tp} heroFrac ${hf}: the hero centre (feet + 0.5 H) is at the screen centre +-1 px (${c[0].toFixed(2)}, ${c[1].toFixed(2)})`, Math.abs(c[0] - w / 2) <= 1 && Math.abs(c[1] - h / 2) <= 1, c);
  ok(`${w}x${h} tilesPerH ${tp} heroFrac ${hf}: drawn height ${st.hpx.toFixed(1)} px = heroFrac x panel height ${(hf * h).toFixed(1)} +-2 % (depth scale of the feet ${k.toFixed(4)})`, Math.abs(st.hpx / (hf * h) - 1) <= 0.02 && Math.abs(st.hpx - hf * h * k) <= 1 && k < 1, st.hpx);
  ok(`${w}x${h} tilesPerH ${tp} heroFrac ${hf}: the camera distance is H / (2 heroFrac tan(FOV / 2)) = ${SG.dist(hf, tp).toFixed(3)} tiles`, Math.abs(cam.D - SG.dist(hf, tp)) < 1e-9 * cam.D, [cam.D, SG.dist(hf, tp)]);
  if (hf === 0.14) { const r = SG.ratios(cam, w, h, feet); ok(`${w}x${h} tilesPerH ${tp} heroFrac 0.14: near/hero ${r.near.toFixed(3)} (1.39 +-0.01) and far/hero ${r.far.toFixed(3)} (0.60 +-0.01)`, Math.abs(r.near - 1.39) <= 0.01 && Math.abs(r.far - 0.60) <= 0.01, r); }
}

// 3. the clamp (window coordinates, yaw 0: a = x, u = y; the near side is the larger y)
{
  const box = { x0: 0, y0: 24, x1: 109, y1: 77 }, w = 1220, h = 767, tp = 2, hf = 0.14, d = SG.dist(hf, tp), hw = d * SG.TAN * w / h, near = d * Math.cos(25 * Math.PI / 180) - d * Math.sin(25 * Math.PI / 180) / Math.tan((25 + 15) * Math.PI / 180);
  const cl = (x, y, b) => SG.clamp(x, y, b || box, 0, 25, d, w, h);
  let c = cl(50, 40); ok('inside the window: no clamp, the target is the hero', !c.clamped && c.x === 50 && c.y === 40, c);
  c = cl(box.x0 + 1, 40); ok(`left edge: clamped to x0 + hw = ${(box.x0 + hw).toFixed(2)}, side L`, c.side === 'L' && Math.abs(c.x - (box.x0 + hw)) < 1e-9 && c.y === 40 && !c.near, c);
  c = cl(box.x1 - 1, 40); ok(`right edge: clamped to x1 - hw = ${(box.x1 - hw).toFixed(2)}, side R`, c.side === 'R' && Math.abs(c.x - (box.x1 - hw)) < 1e-9 && c.y === 40, c);
  c = cl(50, box.y1 - 0.5); ok(`near edge: clamped to y1 - near = ${(box.y1 - near).toFixed(2)} (near ${near.toFixed(2)} tiles), the hero is nearer than the target`, c.near && Math.abs(c.y - (box.y1 - near)) < 1e-9 && c.y < box.y1 - 0.5 && c.side === null, c);
  const farOk = () => { const q = cl(50, box.y0 + 0.5); return !q.clamped && q.y === box.y0 + 0.5 && q.x === 50; };
  ok('FAR edge: NEVER clamped (the background is part of the scene): the target is the hero', farOk(), cl(50, box.y0 + 0.5));
  E.stageTest = { clampFar: true }; const farMut = farOk(); E.stageTest = null; ok('MUTATION: the clamp applied on the far side too: the far-edge check FAILS', !farMut);
  c = cl(50, box.y0 - 10); ok('beyond the far edge (a hero outside the box): still not clamped on the far side', !c.clamped && c.y === box.y0 - 10, c);
  c = cl(30, 50, { x0: 10, y0: 24, x1: 10 + 2 * hw - 4, y1: 77 }); ok('a window narrower than the view (2 hw): the target is the window centre, side C', c.side === 'C' && Math.abs(c.x - (10 + (2 * hw - 4) / 2)) < 1e-9, c);
  // the view stays inside the window on the clamped sides (the screen edges at the pivot height / the bottom row on the ground)
  const fit = E.fitScale(S0, P, { kind: 'persp', yaw: 0, pitch: 25, persH: h }, w, h), sc = SG.scale(h, hf, tp), feet = 1, hc = feet + 0.5 * tp;
  const camAt = (t) => E.makeCam(S0, P, { kind: 'persp', yaw: 0, pitch: 25, zoom: sc / fit, panX: 0, panY: 0, fitSc: fit, persH: h, focus: [t.x, t.y, hc] }, w, h);
  let cam = camAt(cl(box.x0 + 1, 40)); ok('left clamp: the left screen edge (at the pivot height) is the window edge', Math.abs(cam.unp(0, h / 2, hc)[0] - box.x0) < 1e-6, cam.unp(0, h / 2, hc));
  cam = camAt(cl(box.x1 - 1, 40)); ok('right clamp: the right screen edge is the window edge', Math.abs(cam.unp(w, h / 2, hc)[0] - box.x1) < 1e-6, cam.unp(w, h / 2, hc));
  cam = camAt(cl(50, box.y1 - 0.5)); const g = cam.unp(w / 2, h, hc), gf = cam.unp(w / 2, h, feet); ok(`near clamp: the ground at the bottom screen row, on the pivot plane (feet + 0.5 H), is the near edge (${g[1].toFixed(4)} vs ${box.y1}); at the feet level it is ${(box.y1 - gf[1]).toFixed(2)} tiles inside (the rule is stated at the pivot plane, like the reference)`, Math.abs(g[1] - box.y1) < 1e-6 && gf[1] < box.y1, [g, gf]);
  // the hero is off-centre in the right direction, and its drawn size follows the depth scale (not constant)
  cam = camAt(cl(box.x0 + 1, 40)); let p = cam.p(box.x0 + 1, 40, hc); ok('left clamp: the hero is LEFT of the screen centre', p[0] < w / 2 - 5, p);
  cam = camAt(cl(50, box.y1 - 0.5)); p = cam.p(50, box.y1 - 0.5, hc); const kN = SG.depthScale(cam, 50, box.y1 - 0.5, feet), st = SG.drawHero(stub, cam, { x: 50, y: box.y1 - 0.5, feet, hTiles: tp, wTiles: 0.4 * tp });
  ok(`near clamp: the hero is BELOW the screen centre and drawn ${(100 * (kN / SG.depthScale(cam, 50, 40, feet) - 1)).toFixed(1)} % bigger than at the centre (depth scale ${kN.toFixed(3)}); its height follows it`, p[1] > h / 2 + 5 && kN > 1.03 && Math.abs(st.hpx - tp * cam.sc * kN) < 1e-9, [p, kN, st.hpx]);
  E.stageTest = { constSize: true }; const stm = SG.drawHero(stub, cam, { x: 50, y: box.y1 - 0.5, feet, hTiles: tp, wTiles: 0.4 * tp }); E.stageTest = null;
  ok('MUTATION: the hero drawn at a constant screen size (away from the centre, clamped): the depth-scale check FAILS', !(Math.abs(stm.hpx - tp * cam.sc * kN) < 1e-9));
}

// 4. the hero: walkability and the arrow step (0.25 H) on a small shape
{
  const S = shapeOf('shrine_pier_x4.json'); let i = -1; for (let t = 0; t < S.n && i < 0; t++) { const x = t % S.W, y = (t / S.W) | 0; if (x > 3 && x < S.W - 4 && [0, 1, 2, 3, 4, 5].every((d) => SG.walkable(S, t + d) && SG.walkable(S, t + d - S.W))) i = t; }
  const pos = { x: (i % S.W) + 0.5, y: ((i / S.W) | 0) + 0.5 }, m = SG.move(S, pos, 'right', 0, 2);
  ok('arrow right moves the hero 0.25 H = 0.5 tile at tilesPerH 2', m && Math.abs(m.x - pos.x - 0.5) < 1e-12 && m.y === pos.y, m);
  const m3 = SG.move(S, pos, 'up', 0, 3); ok('arrow up moves 0.75 tile at tilesPerH 3, away from the camera (y decreases at yaw 0)', m3 && Math.abs(pos.y - m3.y - 0.75) < 1e-12, m3);
  const my = SG.move(S, pos, 'right', 90, 2); ok('at yaw 90 the right arrow follows the screen axis (the map y axis)', my && Math.abs(my.x - pos.x) < 1e-9 && Math.abs(Math.abs(my.y - pos.y) - 0.5) < 1e-9, my);
  const wall = { x: S.W - 0.2, y: pos.y }; ok('blocked outside the window (no cell)', SG.move(S, wall, 'right', 0, 2) === null);
  let v = -1; for (let t = 0; t < S.n && v < 0; t++) if (S.void && S.void[t] && t % S.W > 0 && !SG.walkable(S, t) && SG.walkable(S, t - 1)) v = t;
  if (v >= 0) { const e = { x: (v % S.W) - 0.1, y: ((v / S.W) | 0) + 0.5 }; ok('blocked by a void cell', SG.move(S, e, 'right', 0, 2) === null); } else console.log('(no void cell next to a walkable one in this pack: the void case is covered by the UI test)');
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
