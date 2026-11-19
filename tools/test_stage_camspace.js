/* STAGE, PR softlock: the optional margins of the camera space of E.stage.clamp (src/stage.js), no browser. docs/crystallizers/03-stage/research/octopath2/stage_softlock_go.md, MODELO_ACTUAL v2.2.
   - mg absent = the clamp of before, and a margin set { near: 0, far: null } gives the same target and flags (the result also carries `far: false`);
   - near margin mN: the near cap moves mN toward the camera (u <= uMax - near + mN); Infinity = no near cap (DQ3);
   - far margin mF: the target stays at least mF before the far edge of the box (u >= uMin + mF); null = no cap (today);
   - the caps act on the VIEW AXIS only: the sideways clamp does not change, for every yaw (0 / 90 / 180 / 270);
   - caps that cross (a room shorter than the margins): the target sits midway between them; the profile table has the three profiles of the brief (narrow 0 / 4, long 0 / 4, wide Infinity / none) and the role table maps Z, X, Hub.
     node tools/test_stage_camspace.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/shape', 's3/rooms', 's3/roomtypes', 'pocket', 'render', 'stage']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const SG = window.EVO.stage; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra)); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const box = { x0: 0, y0: 0, x1: 60, y1: 80 }, W = 1200, H = 760, PITCH = 25, DST = SG.dist(0.10, 2), tp = 2; // 2 tiles per H
const uOf = (c, yaw) => { const r = yaw * Math.PI / 180; return Math.sin(r) * c.x + Math.cos(r) * c.y; }; // toward the camera
const E0 = (yaw) => SG.extent(box, yaw);
const clampAt = (x, y, yaw, mg) => SG.clamp(x, y, box, yaw, PITCH, DST, W, H, undefined, mg);

// 1. absent = before
let same = true, n = 0;
for (const yaw of [0, 90, 180, 270]) for (const x of [2, 30, 58]) for (const y of [-5, 4, 40, 76, 90]) {
  const a = clampAt(x, y, yaw), b = clampAt(x, y, yaw, { near: 0, far: null });
  n++; if (!(near(a.x, b.x) && near(a.y, b.y) && a.near === b.near && a.side === b.side && a.clamped === b.clamped && b.far === false && !('far' in a))) { same = false; console.log('  differs', yaw, x, y, a, b); }
}
ok(`mg absent and { near: 0, far: null } give the same target and flags (${n} cases, 4 yaws); the result carries "far" only with a margin`, same);

// 2. near margin
const nearD = (DST * Math.cos(PITCH * Math.PI / 180) - DST * Math.sin(PITCH * Math.PI / 180) / Math.tan(PITCH * Math.PI / 180 + SG.FOV / 2)); // the clamp's own distance
for (const yaw of [0, 90, 180, 270]) {
  const e = E0(yaw), south = e.uMax; // a hero far past the near edge
  const p = (u) => { const r = yaw * Math.PI / 180; return [Math.sin(r) * u + Math.cos(r) * 30 * 0, 0]; }; // unused
  // a point on the line of the box centre: pick x, y with u = a given value and a = the box centre (so the sideways clamp does not act)
  const aC = (e.aMin + e.aMax) / 2, at = (u) => ({ x: e.cy * aC + e.sy * u, y: -e.sy * aC + e.cy * u });
  const hero = at(south + 3), c0 = clampAt(hero.x, hero.y, yaw), c3 = clampAt(hero.x, hero.y, yaw, { near: 3 * tp, far: null }), cI = clampAt(hero.x, hero.y, yaw, { near: Infinity, far: null });
  ok(`yaw ${yaw}: near margin 3 H = ${3 * tp} tiles moves the near cap ${3 * tp} tiles toward the camera (u = uMax - near + ${3 * tp}); Infinity = no cap, the target is the hero`, near(uOf(c0, yaw), south - nearD) && c0.near && near(uOf(c3, yaw), south - nearD + 3 * tp) && c3.near && near(uOf(cI, yaw), south + 3) && !cI.near, { c0, c3, cI, nearD });
}
// 3. far margin
for (const yaw of [0, 90, 180, 270]) {
  const e = E0(yaw), aC = (e.aMin + e.aMax) / 2, at = (u) => ({ x: e.cy * aC + e.sy * u, y: -e.sy * aC + e.cy * u }), hero = at(e.uMin - 2), mid = at((e.uMin + e.uMax) / 2);
  const c = clampAt(hero.x, hero.y, yaw, { near: 0, far: 4 * tp }), cn = clampAt(hero.x, hero.y, yaw, { near: 0, far: null }), cm = clampAt(mid.x, mid.y, yaw, { near: 0, far: 4 * tp });
  ok(`yaw ${yaw}: far margin 4 H holds the target 4 H = ${4 * tp} tiles before the far edge (far = true); null does not hold it (today); a target in the middle is not held`, near(uOf(c, yaw), e.uMin + 4 * tp) && c.far && c.clamped && near(uOf(cn, yaw), e.uMin - 2) && !cn.far && near(uOf(cm, yaw), (e.uMin + e.uMax) / 2) && !cm.far && !cm.near, { c, cn, cm });
}
// 4. the lateral axis does not change
let lat = true;
for (const yaw of [0, 90, 180, 270]) { const e = E0(yaw); for (const a of [e.aMin - 5, e.aMax + 5]) { const at = (u) => ({ x: e.cy * a + e.sy * u, y: -e.sy * a + e.cy * u }), h = at((e.uMin + e.uMax) / 2), c0 = clampAt(h.x, h.y, yaw), c1 = clampAt(h.x, h.y, yaw, { near: 0, far: 8 }); if (!(near(c0.x, c1.x) && near(c0.y, c1.y) && c0.side === c1.side && c0.side)) lat = false; } }
ok('the margins do not touch the lateral axis: a hero outside the box sideways gives the same target and side with and without them (4 yaws)', lat);
// 5. crossed caps
{
  const yaw = 0, e = E0(yaw), long = (e.uMax - e.uMin) - nearD + 5, c = clampAt(30, 40, yaw, { near: 0, far: long }), lo = e.uMin + long, hi = e.uMax - nearD;
  ok(`caps that cross (far margin ${long} tiles in a ${e.uMax - e.uMin}-tile box): the target sits midway (${((lo + hi) / 2).toFixed(2)}) and both flags are set`, near(uOf(c, yaw), (lo + hi) / 2) && c.far && c.near, { c, lo, hi });
}
// 6. the tables
const P_ = SG.CAM_PROFILES;
ok('profiles: narrow near 0 / far 4 H, long near 0 / far 4 H, wide near Infinity / no far; roles Z -> narrow, X -> long, Hub -> wide', P_.narrow.mN === 0 && P_.narrow.mF === 4 && P_.long.mN === 0 && P_.long.mF === 4 && P_.wide.mN === Infinity && P_.wide.mF === null && SG.CAM_PROFILE_OF.Z === 'narrow' && SG.CAM_PROFILE_OF.X === 'long' && SG.CAM_PROFILE_OF.Hub === 'wide', { P_, of: SG.CAM_PROFILE_OF });
// 7. Cam 8: the near distance scales with zS, the margins do not (they are map units)
{
  const e = E0(0), aC = (e.aMin + e.aMax) / 2, c = SG.clamp(aC, e.uMax + 3, box, 0, PITCH, DST, W, H, 0.5, { near: 2, far: null }), c1 = SG.clamp(aC, e.uMax + 3, box, 0, PITCH, DST, W, H, 0.5);
  ok('Cam 8 (zS 0.5): the near distance of the clamp is divided by zS as before and the margin is added in map units (same difference of 2 tiles with and without it)', near(uOf(c, 0) - uOf(c1, 0), 2) && c.near && c1.near, { c, c1 });
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
