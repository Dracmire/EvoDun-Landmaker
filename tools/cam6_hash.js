/* Golden hash of Cam 6 (src/render.js makePersp): sha256 over the bytes of p(), unp(), depth(), ry(), nrm() of a fixed set of views and points (no zScale anywhere). Used by tools/test_cams.js:
   the hash was taken from the render.js of `main` BEFORE the Cam 8 depth scale existed, so Cam 6 (and every camera that does not set zScale) cannot change by a single bit. */
const crypto = require('crypto');
module.exports = function cam6Hash(E, S, P) {
  const nums = [], base = { kind: 'persp', yaw: 0, pitch: 25, fitSc: 7, persH: 640 };
  const views = [];
  for (const zoom of [1, 2.5]) for (const pan of [[0, 0], [13, -9]]) for (const yaw of [0, 37]) for (const extra of [{}, { focus: [S.W * 0.4, S.H * 0.55, 3] }, { focus: [S.W * 0.5, S.H * 0.5, 2], vScale: 1.3 }]) views.push(Object.assign({}, base, { zoom, panX: pan[0], panY: pan[1], yaw }, extra));
  for (const v of views) {
    const cam = E.makeCam(S, P, v, 900, 640);
    nums.push(cam.sc, cam.D, cam.fit, cam.pivot[0], cam.pivot[1], cam.pivot[2]);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const x = (i + 0.5) * S.W / 6, y = (j + 0.5) * S.H / 6, h = (i + j) % 4 * 1.5, [px, py] = cam.p(x, y, h), [gx, gy] = cam.unp(px, py, h), n = cam.nrm(1, 0, x, y), m = cam.nrm(0, -1, x, y);
      nums.push(px, py, gx, gy, cam.depth(x, y, h), cam.ry(x, y), n[0], n[1], m[0], m[1]);
    }
    const pf = cam.panFor(S.W / 3, S.H / 4, 2); nums.push(pf[0], pf[1]);
  }
  return { hash: crypto.createHash('sha256').update(Buffer.from(new Float64Array(nums).buffer)).digest('hex'), count: nums.length };
};
