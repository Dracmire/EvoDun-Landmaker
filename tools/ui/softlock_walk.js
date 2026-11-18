/* SOFT LOCK OF THE CAMERA (mode 3, PR softlock): the walk of docs/crystallizers/03-stage/research/octopath2/stage_softlock_go.md section 4.
   For each room x profile the hero walks along the VIEW AXIS from the room centre: k0..k8 toward the camera (south) up to the last walkable tile of the room on that line, then n0..n8 away from it (north). At every step it records
   heroFrac measured (hero px height / panel height), the feet row fy, whether the camera target is held (near / far), the distance hero -> camera in H, and the heroFrac predicted by the scale law of the camera. Shots of k0, k4, k8 toward the south.
   Measurement only: it changes no state of the viewer except the hero position, heroFrac (0.10, the DQ3 value of the prediction), the switch "Camera space by room" and its profile selector.
     NODE_PATH=$(npm root -g) node tools/ui/softlock_walk.js <outDir> [--no-shots] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2], SHOTS = !process.argv.includes('--no-shots');
if (!out) { console.error('usage: softlock_walk.js <outDir> [--no-shots]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const HF = 0.10;
/* [example, room, [profiles], shotProfiles]: 'off' = the camera space switch off (the camera of today), 'auto' = by the role of the room, the rest forced */
const RUNS = [
  ['mockt_z14', 14, ['off', 'auto', 'wide'], ['auto', 'wide']],
  ['mockt_x44', 44, ['off', 'auto', 'long', 'wide'], ['long', 'wide']],
  ['dac_stage', 20, ['off', 'auto', 'wide'], ['wide']],
  ['dac_stage', 5, ['off', 'auto', 'long', 'wide'], []],
  ['mockt_z14', 14, ['auto'], [], 0.14], // the example's own heroFrac (0.14) and an intermediate one: the growth toward the camera depends on the camera distance D = H / (2 heroFrac tan 15)
  ['mockt_z14', 14, ['auto'], [], 0.12]
];
(async () => {
  const a = await open({ w: 1200, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const res = [];
  for (const [ex, room, profiles, shotP, hf0] of RUNS) {
    await page.click(`#examples button[data-id="${ex}"]`); await a.idle(); await a.slider('heroFrac', hf0 || HF); await a.idle();
    // the axis and the walkable run of the room along the view axis, from its centre
    const axis = await ev((room) => {
      const e = window.__evo, E = window.EVO, S = e.S(), tp = e.st.stage.tilesPerH, T = E.orient.compute(S, e.P, e.st.stageRooms, tp), r = T.byId.get(room), c = E.stage.roomCentre(S, room), yaw = r.yaw * Math.PI / 180, d = [Math.sin(yaw), Math.cos(yaw)], zm = E.stage.zoneMap(S);
      const ok = (t) => { const i = E.stage.cellOf(S, c.x + t * d[0], c.y + t * d[1]); return i >= 0 && E.stage.walkable(S, i) && zm[i] === room; };
      let s = 0, n = 0; while (ok(s + 0.25)) s += 0.25; while (ok(n - 0.25)) n -= 0.25;
      return { room, dir: r.dir, yaw: r.yaw, ratio: r.ratio, L: r.L, W: r.W, centre: [c.x, c.y], d, south: s, north: n, tp, box: S.sliceBox, ox: S.ox, oy: S.oy };
    }, room);
    for (const prof of profiles) {
      await ev(({ prof, room }) => { const e = window.__evo, E = window.EVO; const cs = document.querySelector('#t-stageCamSpace'), sel = document.querySelector('#stageCamProfile'); if (cs.checked !== (prof !== 'off')) cs.click(); sel.value = prof === 'off' ? 'auto' : prof; sel.dispatchEvent(new Event('change')); }, { prof, room });
      await a.idle();
      const rows = [];
      for (const [phase, tEnd] of [['k', axis.south], ['n', axis.north]]) {
        for (let k = 0; k <= 8; k++) {
          const t = tEnd * k / 8;
          const r = await ev(({ t, axis, room, phase, k }) => {
            const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, tp = st.stage.tilesPerH, x = axis.centre[0] + t * axis.d[0], y = axis.centre[1] + t * axis.d[1];
            st.follow = true; st.hero = { x: S.ox + x, y: S.oy + y }; e.redraw(); return true;
          }, { t, axis, room, phase, k });
          await a.idle();
          const m = await ev(({ axis, phase, k, t }) => {
            const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, tp = st.stage.tilesPerH, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = st.persH || cv.clientHeight, v = e.view(), cam = E.makeCam(S, P, v, w, h);
            const hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, i = E.stage.cellOf(S, hw.x, hw.y), feet = E.stage.feetH(S, i), hs = e.O.hero.stats, f = v.focus, ya = v.yaw * Math.PI / 180, sy = Math.sin(ya), cy = Math.cos(ya), p = v.pitch * Math.PI / 180;
            const D = E.stage.dist(st.stage.heroFrac, tp), du = (sy * hw.x + cy * hw.y) - (sy * f[0] + cy * f[1]), dz = feet - f[2];
            const kExact = D / (D - du * Math.cos(p) - dz * Math.sin(p)), kModel = D / (D - du * Math.cos(p)), k0 = D / (D + 0.5 * tp * Math.sin(p)); // k0: the feet of a hero standing at the pivot (dz = -0.5 H)
            const c = st.stageClamp, dist = cam.D - cam.depth(hw.x, hw.y, feet + tp / 2);
            return { step: phase + k, t: +t.toFixed(2), hf: hs.hpx / h, fy: hs.base[1] / h, fx: hs.base[0] / w, near: !!(c && c.near), far: !!(c && c.far), du: du / tp, distH: dist / tp, predExact: st.stage.heroFrac * kExact, predModel: st.stage.heroFrac * k0 * kModel, tile: [Math.floor(hw.x), Math.floor(hw.y)], info: document.querySelector('#info').innerText.split('\n')[0].slice(0, 220) };
          }, { axis, phase, k, t });
          rows.push(m);
          if (SHOTS && phase === 'k' && [0, 4, 8].includes(k) && shotP.includes(prof)) await page.screenshot({ path: path.join(out, `${ex}_r${room}_${prof}_k${k}.png`) });
        }
      }
      res.push({ ex, room, prof, hf0: hf0 || HF, axis, rows });
      const kk = rows.filter((r) => r.step[0] === 'k'), nn = rows.filter((r) => r.step[0] === 'n');
      console.log(`${ex} r${room} ${prof}: south hf ${kk.map((r) => r.hf.toFixed(3)).join(' ')} | north ${nn.map((r) => r.hf.toFixed(3)).join(' ')} | stops ${rows.filter((r) => r.near || r.far).map((r) => r.step + (r.near ? 'N' : 'F')).join(',') || '-'}`);
    }
    await ev(() => { const cs = document.querySelector('#t-stageCamSpace'); if (cs.checked) cs.click(); }); await a.idle();
  }
  // how far the camera would have to stop short of the near cap to reach 0.15 / 0.20 at the south edge of the z14 room (the profile is a mutable table: E.stage.CAM_PROFILES)
  const sweep = [];
  await page.click('#examples button[data-id="mockt_z14"]'); await a.idle(); await a.slider('heroFrac', HF); await a.idle();
  const ax = res.find((r) => r.ex === 'mockt_z14' && r.prof === 'auto').axis;
  for (const mN of [0, -0.5, -1, -2, -3, -4, -6]) {
    await ev((mN) => { window.EVO.stage.CAM_PROFILES.narrow.mN = mN; const cs = document.querySelector('#t-stageCamSpace'), sel = document.querySelector('#stageCamProfile'); if (!cs.checked) cs.click(); sel.value = 'narrow'; sel.dispatchEvent(new Event('change')); }, mN); await a.idle();
    await ev(({ ax }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + ax.centre[0] + ax.south * ax.d[0], y: S.oy + ax.centre[1] + ax.south * ax.d[1] }; e.redraw(); }, { ax }); await a.idle();
    const m = await ev(() => { const e = window.__evo, cv = document.querySelector('#stage canvas'), h = e.st.persH || cv.clientHeight, hs = e.O.hero.stats; return { hf: hs.hpx / h, fy: hs.base[1] / h }; });
    sweep.push({ mN, ...m });
  }
  await ev(() => { window.EVO.stage.CAM_PROFILES.narrow.mN = 0; });
  console.log('SWEEP mN (H) -> hf, fy:', sweep.map((s) => `${s.mN}: ${s.hf.toFixed(3)} / ${s.fy.toFixed(2)}`).join(' | '));
  fs.writeFileSync(path.join(out, 'softlock_pasos.json'), JSON.stringify({ heroFrac: HF, runs: res, sweep }, null, 1));
  console.log('errors:', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
