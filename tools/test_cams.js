/* Camera bank (Cam 1-7): the screen -> ground inverse is exact for the three projection types (ortho, perspective, oblique), the perspective camera dollies with the zoom (sc * D = f, so the
   strength of the perspective on screen does not depend on the zoom), the face facing of the perspective camera is the normal against the vector to the camera, Cam 7 is the oblique projection
   with ground scale 1 and height scale 1, and the viewer block of the manifest takes the camera ids.
     node tools/test_cams.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'render']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, margin: 24 };
const BANK = { isoE: { kind: 'ortho', yaw: 45, pitch: 35 }, isoW: { kind: 'ortho', yaw: -45, pitch: 35 }, oblique: { kind: 'ortho', yaw: 0, pitch: 50 }, low: { kind: 'ortho', yaw: 0, pitch: 28 }, top: { kind: 'ortho', yaw: 0, pitch: 80 },
  stage: { kind: 'persp', yaw: 0, pitch: 25 }, classic: { kind: 'oblique', yaw: 0, pitch: 0 } };
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (const file of ['snake_mountain_surface.json', 'shrine_pier.json']) {
  const S = E.shape(JSON.parse(fs.readFileSync(path.join(__dirname, '../data', file), 'utf8')), P, null);
  for (const [id, v] of Object.entries(BANK)) for (const zoom of [1, 3]) {
    const cam = E.makeCam(S, P, Object.assign({ zoom, panX: 11, panY: -5, fitSc: 0, persH: 700 }, v), 1000, 700); let worst = 0, n = 0;
    for (let i = 0; i < 400; i++) {
      const x = rnd() * S.W, y = rnd() * S.H, h = rnd() * 6;
      if (cam.persp && cam.D - cam.depth(x, y, h) < 0.2 * cam.D) continue; // behind or at the camera: not visible, not invertible
      const [px, py] = cam.p(x, y, h), [gx, gy] = cam.unp(px, py, h); worst = Math.max(worst, Math.hypot(gx - x, gy - y)); n++;
    }
    ok(`${file} ${id} zoom ${zoom}: unp(p(x, y, h), h) = (x, y) (${n} points, worst ${worst.toExponential(1)})`, n > 50 && worst < 1e-9, worst);
  }
}
const S = E.shape(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/snake_mountain_surface.json'), 'utf8')), P, null);
const cam7 = E.makeCam(S, P, Object.assign({ zoom: 1, panX: 0, panY: 0, fitSc: 0 }, BANK.classic), 1000, 700), a = cam7.p(5, 5, 0), b = cam7.p(6, 5, 0), c = cam7.p(5, 6, 0), d = cam7.p(5, 5, 1);
ok('Cam 7: ground scale 1 and height scale 1 (one tile east = sc px right, one tile south = sc px down, one unit up = sc px up)', Math.abs(b[0] - a[0] - cam7.sc) < 1e-9 && Math.abs(b[1] - a[1]) < 1e-9 && Math.abs(c[1] - a[1] - cam7.sc) < 1e-9 && Math.abs(c[0] - a[0]) < 1e-9 && Math.abs(a[1] - d[1] - cam7.sc) < 1e-9);
for (const persH of [400, 700]) for (const zoom of [1, 2, 5]) {
  const cam = E.makeCam(S, P, Object.assign({ zoom, panX: 0, panY: 0, fitSc: 20, persH }, BANK.stage), 900, persH), f = (persH / 2) / Math.tan(15 * Math.PI / 180);
  ok(`Cam 6 dolly: sc * D = (panel height / 2) / tan(FOV / 2) at zoom ${zoom}, first panel height ${persH}`, Math.abs(cam.sc * cam.D - f) < 1e-6 * f, cam.sc * cam.D);
}
{ // pan moves the CAMERA: a focus point far from the map centre, at play scale, is brought to the centre in closed form (panFor) and is in front of the camera (an image shift would leave it behind the camera)
  const sc = 55, base = Object.assign({ zoom: sc / 3, panX: 0, panY: 0, fitSc: 3, persH: 700 }, BANK.stage); let worst = 0, behind = 0, n = 0;
  for (const [x, y, h] of [[S.W - 2, S.H - 2, 2], [1, 1, 2], [S.W - 2, 1, 5], [1, S.H - 2, 0], [S.W / 2, S.H - 2, 3]]) {
    const v = Object.assign({}, base), pf = E.makeCam(S, P, v, 1000, 700).panFor(x, y, h); v.panX = pf[0]; v.panY = pf[1];
    const cam = E.makeCam(S, P, v, 1000, 700), c = cam.p(x, y, h); worst = Math.max(worst, Math.hypot(c[0] - 500, c[1] - 350)); n++; if (cam.D - cam.depth(x, y, h) < 0.3 * cam.D) behind++;
  }
  ok(`Cam 6 pan: panFor brings any tile of the map to the screen centre at play scale (${n} points, worst ${worst.toExponential(1)} px)`, worst < 1e-6, worst);
  ok('Cam 6 pan: the focus point stays in front of the camera at about the dolly distance D (no tile behind the camera)', behind === 0, behind);
  for (const id of ['isoE', 'oblique', 'classic']) { const v = Object.assign({ zoom: 2, panX: 0, panY: 0, fitSc: 0 }, BANK[id]), pf = E.makeCam(S, P, v, 1000, 700).panFor(10, 12, 2); v.panX = pf[0]; v.panY = pf[1]; const c = E.makeCam(S, P, v, 1000, 700).p(10, 12, 2);
    ok(`${id}: panFor brings the point to the screen centre`, Math.hypot(c[0] - 500, c[1] - 350) < 1e-6, c); }
}
{ // the pivot is the ground point under the screen centre (at the focus height), at zoom 1 and after a pan
  for (const pan of [[0, 0], [37, -21]]) { const cam = E.makeCam(S, P, Object.assign({ zoom: 1.7, panX: pan[0], panY: pan[1], fitSc: 0, persH: 700 }, BANK.stage), 1000, 700), c = cam.p(cam.pivot[0], cam.pivot[1], cam.pivot[2]);
    ok(`Cam 6: the pivot is under the screen centre (pan ${pan})`, Math.hypot(c[0] - 500, c[1] - 350) < 1e-9, c); }
}
{ // two compare panels of different height share the camera (same sc and D from the first panel)
  const v = Object.assign({ zoom: 2, panX: 0, panY: 0, fitSc: 18, persH: 500 }, BANK.stage), c1 = E.makeCam(S, P, v, 800, 500), c2 = E.makeCam(S, P, v, 800, 300);
  ok('Cam 6: panels of different height have the same sc and the same D', c1.sc === c2.sc && Math.abs(c1.D - c2.D) < 1e-12);
}
{ const cam = E.makeCam(S, P, Object.assign({ zoom: 1, panX: 0, panY: 0, fitSc: 0, persH: 700 }, BANK.stage), 1000, 700), [cx, cy] = [cam.pivot[0], cam.pivot[1]];
  const near = cam.nrm(0, -1, cx - 12, cy + 5)[1], flip = cam.nrm(1, 0, cx - 12, cy + 5)[1], flip2 = cam.nrm(1, 0, cx + 12, cy + 5)[1];
  ok('Cam 6 facing: a face with normal +x left of the camera faces it, right of it it does not (constant-normal culling would say edge-on for both)', flip > 0.001 && flip2 < -0.001, [flip, flip2]);
  ok('Cam 6 facing: a face with normal -y (north) turned away from the camera at yaw 0', near < 0, near);
  ok('Cam 6 without a position keeps the orthographic answer (rny = ny at yaw 0)', cam.nrm(0, 1)[1] === 1 && cam.nrm(1, 0)[1] === 0);
}
{ const o = E.makeCam(S, P, Object.assign({ zoom: 1, panX: 0, panY: 0, fitSc: 0 }, BANK.oblique), 1000, 700);
  ok('orthographic cameras ignore the face position (the original culling)', o.nrm(1, 0, 3, 4)[1] === o.nrm(1, 0)[1] && o.nrm(0, 1, 3, 4)[1] === o.nrm(0, 1)[1]); }
{ const V = { camera: 'stage', terraces: 4 }, m = E.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: V });
  ok('manifest viewer.camera takes the bank ids', m.viewer.camera === 'stage' && ['isoE', 'isoW', 'oblique', 'low', 'top', 'stage', 'classic'].every((id) => E.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { camera: id } }).viewer.camera === id));
  let bad = 0; for (const c of ['iso', 'Cam 6', 6, 'A']) { try { E.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { camera: c } }); } catch (e) { bad++; } }
  ok('manifest viewer.camera rejects ids that are not in the bank', bad === 4, bad);
  ok('a viewer block without camera is unchanged (absent = default camera)', E.parseManifest({ format: 'evodun-pack/0.3', roles: {}, viewer: { terraces: 3 } }).viewer.camera === undefined); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
