/* STAGE, M4c-1b: `E.stage.screenPan` (src/stage.js), the closed-form pan that puts the hero's feet at a declared place of the panel (`heroScreen: [fx, fy]` of an example), checked against the camera itself (makePersp with a focus and that pan): for several panels, zooms, yaws, vertical scales and targets the feet project on the target (< 1e-6 px); the centre target with the feet at the pivot height gives pan 0.
     node tools/test_stage_heroscreen.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'render', 'stage']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, SG = E.stage; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300)); } };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, anchor: true, spreadCentre: 'largest' };
const S = E.shape(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/shrine_pier_x4.json'), 'utf8')), P, null);
let worst = 0, n = 0;
for (const [w, h] of [[1280, 644], [1220, 767], [900, 500]]) for (const yaw of [0, 90, 180, 270]) for (const vScale of [undefined, 1.3]) for (const hf of [0.098, 0.14]) for (const [fx, fy] of [[0.592, 0.768], [0.3, 0.4], [0.5, 0.5], [0.8, 0.9]]) {
  const tp = 2, hero = { x: 20.3, y: 18.7 }, feet = 1.2, hF = feet + 0.5 * tp, fitSc = E.fitScale(S, P, { kind: 'persp', yaw, pitch: 25, persH: h }, w, h), sc = SG.scale(h, hf, tp), zoom = sc / fitSc;
  const D = (h / 2) / SG.TAN / sc, pan = SG.screenPan((fx - 0.5) * w, (fy - 0.5) * h, { sc, D, pitch: 25, feet, hF, vScale });
  const cam = E.makeCam(S, P, { kind: 'persp', yaw, pitch: 25, zoom, panX: pan[0], panY: pan[1], fitSc, persH: h, focus: [hero.x, hero.y, hF], vScale }, w, h), q = cam.p(hero.x, hero.y, feet);
  worst = Math.max(worst, Math.hypot(q[0] - fx * w, q[1] - fy * h)); n++;
}
ok(`the feet of the hero project on the declared place of the panel (${n} combinations of panel, yaw, vScale, heroFrac and target; worst ${worst.toExponential(1)} px)`, n === 192 && worst < 1e-6, worst);
{ const p0 = SG.screenPan(0, 0, { sc: 40, D: 30, pitch: 25, feet: 3, hF: 3 }); ok('the centre of the panel with the feet at the pivot height needs no pan', Math.abs(p0[0]) < 1e-12 && Math.abs(p0[1]) < 1e-12, p0); }
{ // a clamped target (the focus is not the hero): the same pan expressed from the target, as src/ui.js does
  const w = 1280, h = 644, tp = 2, yaw = 90, hero = { x: 20.3, y: 18.7 }, focus = [17.1, 21.4], feet = 1.2, hF = feet + 1, fitSc = E.fitScale(S, P, { kind: 'persp', yaw, pitch: 25, persH: h }, w, h), sc = SG.scale(h, 0.11, tp), D = (h / 2) / SG.TAN / sc, q = SG.screenPan(0.1 * w, 0.2 * h, { sc, D, pitch: 25, feet, hF });
  const ya = yaw * Math.PI / 180, cy = Math.cos(ya), sy = Math.sin(ya), sp = Math.sin(25 * Math.PI / 180), dx = hero.x - focus[0], dy = hero.y - focus[1], pan = [q[0] - (cy * dx - sy * dy) * sc, q[1] - (sy * dx + cy * dy) * sc * sp];
  const cam = E.makeCam(S, P, { kind: 'persp', yaw, pitch: 25, zoom: sc / fitSc, panX: pan[0], panY: pan[1], fitSc, persH: h, focus: [focus[0], focus[1], hF] }, w, h), r = cam.p(hero.x, hero.y, feet);
  ok(`with a target that is not the hero (a clamp) the pan from that target still puts the feet on the place (${Math.hypot(r[0] - 0.6 * w, r[1] - 0.7 * h).toExponential(1)} px)`, Math.hypot(r[0] - 0.6 * w, r[1] - 0.7 * h) < 1e-6); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
