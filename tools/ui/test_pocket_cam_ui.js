/* The POCKET composed along the ACTIVE camera's axis (docs/ui-modes.md 7b; src/pocket.js is parametrised by yaw, src/shape.js takes P.pocketYaw, src/ui.js sets it from the camera's BASE yaw and rebuilds a pocket when that yaw changes).
   Real map, rooms on, Balanced types, Pocket view on, the 18 Dioramas (the six of the five archetypes, 31 7 22 49 4 25, are also reported apart), Box single panel, Cam 1 / 2 / 3 / 6.
   WHY 18 AND NOT 6 for the statistics: over the six rooms alone the mean dx at Cam 2 is +0.18 because two of them have a backdrop of 27 and 3 tiles (their centroid is noise); over the 18 rooms (the sample of the first measurement) every camera is within +-0.09.
   (a) the shape's yaw equals the camera's base yaw after every preset click, and a rebuild happens exactly when the base yaw changes (Cam 3 <-> 4 <-> 5 <-> 6 <-> 7 do not rebuild, Cam 1 <-> 2 <-> {3..7} do);
   (b) the BACKDROP sits behind and centred: the mean screen offset dx (backdrop tiles relative to the fragment, in fragment widths) over the rooms that have a backdrop is in [-0.15, 0.15] at each camera; per-room values printed;
   (c) the decoration hides at most 2 points of the fragment's visible tiles (visible ALONE minus visible WITH the pocket, mean over the rooms, per camera; only the DIFFERENCE is used, the absolute share of the probe is unreliable);
   (d) drag offsets of +-10 / +-20 deg of yaw: MEASURED and PRINTED, not asserted (the pocket is not recomposed on a drag: same policy as the Floor backdrop);
   (e) Cam 1 -> Cam 3 -> Cam 1 gives the identical canvas as the first Cam 1 (deterministic rebuild); (f) Box, A, B and C draw the pocket at Cam 6 without errors; no page errors.
   METRICS (in the page, on the Box pick render E.pickBuffer, opaque pixels, code = (r<<16)|(g<<8)|b, kind = code>>20, id = code & 0xfffff): fragment tile i is visible if the code at cam.p(x+.5, y+.5, levelH[fine[i]]) has kind 3 or 4 and id i;
   "alone" = the same buffer with S.void[j] = 1 for every non-fragment tile (restored afterwards). Backdrop tiles = S.pocketRole 2 with height >= the median fragment height + 1 terH; dx = (mean screen x of the backdrop - mean screen x of the fragment) / (the fragment's screen x range).
   Run: NODE_PATH=$(npm root -g) node tools/ui/test_pocket_cam_ui.js [--mutate]   (--mutate forces P.pocketYaw = 45 always, today's behaviour: the dx assertions at Cam 3 and Cam 6 must FAIL) */
const crypto = require('crypto'), { open } = require('./common');
const MUTATE = process.argv.includes('--mutate');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.scenario('pocket31')); await a.idle();
  await page.click('#mode'); await a.idle(); await a.tech('box');
  if (MUTATE) await ev(() => { const e = window.__evo; Object.defineProperty(e.P, 'pocketYaw', { get: () => 45, set: () => {}, configurable: true }); e.draw(); }), await a.idle();
  const CAMS = [['isoE', 'Cam 1', 45], ['isoW', 'Cam 2', -45], ['oblique', 'Cam 3', 0], ['stage', 'Cam 6', 0]], ROOMS = [4, 7, 10, 20, 22, 25, 30, 31, 34, 35, 38, 49, 53, 64, 66, 68, 74, 80], SIX = [31, 7, 22, 49, 4, 25]; // ROOMS = the 18 Dioramas of the Balanced types (tools/test_pocket.js); SIX = the five archetypes (hill 22, falls 7 and 31, island 49 and 4, lake 25) that are looked at in the screenshots
  const measure = () => ev(() => {
    const E = window.EVO, e = window.__evo, S = e.S(), P = e.P, v = e.view(), cv = [...document.querySelectorAll('#stage canvas')].find((c) => !c.closest('figure').hidden), w = cv.clientWidth, h = cv.clientHeight;
    const cam = E.makeCam(S, P, v, w, h), codes = () => { const d = E.pickBuffer(S, P, v, w, h).data, c = new Int32Array(w * h).fill(-1); for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] === 255) c[i] = (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]; return c; };
    const frag = [], back = [], hs = []; for (let i = 0; i < S.n; i++) { if (S.pocketRole[i] === 1) { frag.push(i); hs.push(S.levelH[S.fine[i]]); } } hs.sort((p, q) => p - q); const med = hs[hs.length >> 1];
    for (let i = 0; i < S.n; i++) if (S.pocketRole[i] === 2 && S.levelH[S.fine[i]] >= med + P.terH) back.push(i);
    const pt = (i) => cam.p((i % S.W) + 0.5, ((i / S.W) | 0) + 0.5, S.levelH[S.fine[i]]);
    const vis = (cd) => { let n = 0; for (const i of frag) { const q = pt(i), xx = Math.round(q[0]), yy = Math.round(q[1]); if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const c = cd[yy * w + xx]; if (c >= 0 && ((c >> 20) === 3 || (c >> 20) === 4) && (c & 0xfffff) === i) n++; } return n; };
    const withP = vis(codes()), saved = S.void.slice(); const inF = new Uint8Array(S.n); for (const i of frag) inF[i] = 1; for (let j = 0; j < S.n; j++) if (!inF[j]) S.void[j] = 1; const alone = vis(codes()); S.void.set(saved);
    const fx = frag.map((i) => pt(i)[0]), fy = frag.map((i) => pt(i)[1]), mean = (x) => x.reduce((s, y) => s + y, 0) / x.length, range = Math.max(...fx) - Math.min(...fx);
    let dx = null, dy = null; if (back.length) { const bx = back.map((i) => pt(i)[0]), by = back.map((i) => pt(i)[1]); dx = (mean(bx) - mean(fx)) / range; dy = (mean(by) - mean(fy)) / range; }
    return { id: [...window.__evo.sliceSel.rooms][0], nFrag: frag.length, nBack: back.length, dx, dy, loss: 100 * (alone - withP) / frag.length, withP, alone, yaw: S.pocketYaw, arch: S.pocketInfo && S.pocketInfo.archetype };
  });
  const rows = [], drag = [], builds = [];
  let first = true;
  for (const room of ROOMS) {
    await page.click(`#roomChips .chip[data-id="${room}"]`); await a.idle();
    for (const [pre, label, base] of CAMS) {
      await a.preset(pre); const m = await measure(); rows.push({ ...m, cam: label, pre, base });
      if (room === 31 || room === 49) for (const dy of [10, -10, 20, -20]) { await ev((d) => { window.__evo.set({ yawOff: d }); window.dispatchEvent(new Event('resize')); }, dy); await a.idle(); const md = await measure(); drag.push({ room, cam: label, off: dy, dx: md.dx, loss: md.loss, nBack: md.nBack }); await ev(() => { window.__evo.set({ yawOff: 0 }); window.dispatchEvent(new Event('resize')); }); await a.idle(); }
    }
  }
  const fmt = (x) => (x === null ? ' n/a ' : (x >= 0 ? '+' : '') + x.toFixed(2));
  console.log(`MEASURED per room and camera (${MUTATE ? 'MUTATED: pocketYaw forced to 45' : 'composed along the camera axis'}): dx in fragment widths (0 = centred behind), dy (negative = above), loss = fragment visibility alone minus with the pocket (points)`);
  for (const room of ROOMS) console.log(`  room ${String(room).padStart(2)} ${(rows.find((r) => r.id === room) || {}).arch}: ` + CAMS.map(([pre, label]) => { const r = rows.find((q) => q.id === room && q.pre === pre); return `${label} dx ${fmt(r.dx)} dy ${fmt(r.dy)} loss ${r.loss.toFixed(1)} (${r.nBack} backdrop)`; }).join(' | '));
  const stat = {}; for (const [pre, label] of CAMS) { const rs = rows.filter((r) => r.pre === pre), withB = rs.filter((r) => r.dx !== null); stat[pre] = { n: withB.length, dx: withB.reduce((s, r) => s + r.dx, 0) / withB.length, loss: rs.reduce((s, r) => s + r.loss, 0) / rs.length }; console.log(`  ${label}: mean dx ${fmt(stat[pre].dx)} over ${withB.length} rooms with a backdrop, mean loss ${stat[pre].loss.toFixed(2)} points over ${rs.length} rooms`); }
  for (const [pre, label] of CAMS) { const rs = rows.filter((r) => r.pre === pre && SIX.includes(r.id) && r.dx !== null); console.log(`  (six archetype rooms only) ${label}: mean dx ${fmt(rs.reduce((x, r) => x + r.dx, 0) / rs.length)} over ${rs.length} rooms with a backdrop`); }
  for (const [pre, label] of CAMS) ok(`${label}: the backdrop is behind and centred: mean dx ${fmt(stat[pre].dx)} in [-0.15, +0.15] fragment widths (${stat[pre].n} rooms with a backdrop)`, stat[pre].n >= 10 && Math.abs(stat[pre].dx) <= 0.15, JSON.stringify(stat[pre]));
  for (const [pre, label] of CAMS) ok(`${label}: the decoration hides at most 2 points of the fragment (mean loss ${stat[pre].loss.toFixed(2)}, alone minus with pocket)`, stat[pre].loss <= 2, stat[pre].loss.toFixed(2));
  console.log('MEASURED (not asserted) drag variation of the yaw on rooms 31 (no backdrop at Cam 1, 3, 6) and 49 (the pocket is not recomposed): ' + drag.map((d) => `r${d.room} ${d.cam} ${d.off > 0 ? '+' : ''}${d.off}: dx ${fmt(d.dx)} loss ${d.loss.toFixed(1)}`).join(' | '));
  // (a) yaw stored = the camera's base yaw; rebuilds exactly when the base yaw changes
  await page.click('#roomChips .chip[data-id="31"]'); await a.idle(); await a.preset('isoE');
  await ev(() => { window.__prevS = window.__evo.S(); });
  const seq = [['isoE', 45, false], ['oblique', 0, true], ['stage', 0, false], ['low', 0, false], ['top', 0, false], ['classic', 0, false], ['isoE', 45, true], ['isoW', -45, true], ['oblique', 0, true], ['isoW', -45, true], ['isoW', -45, false]], bad = [];
  for (const [pre, yaw, rebuilt] of seq) { await a.preset(pre); const r = await ev(() => { const e = window.__evo, S = e.S(), re = S !== window.__prevS; window.__prevS = S; return { yaw: S.pocketYaw, re, pocket: !!S.pocket }; }); builds.push(`${pre}:${r.yaw}${r.re ? '*' : ''}`); if (r.yaw !== yaw || r.re !== rebuilt || !r.pocket) bad.push(`${pre} yaw ${r.yaw} (want ${yaw}) rebuilt ${r.re} (want ${rebuilt})`); }
  ok('the shape yaw equals the camera base yaw after every preset click and a rebuild happens exactly when it changes (Cam 3-7 share yaw 0: no rebuild; Cam 1 <-> 2 <-> others: rebuild) ' + builds.join(' '), bad.length === 0, bad.join('; '));
  // (e) Cam 1 -> 3 -> 1: identical canvas
  await a.preset('isoE'); const h1 = crypto.createHash('md5').update(await a.canvas()).digest('hex'); await a.preset('oblique'); await a.preset('isoE'); const h2 = crypto.createHash('md5').update(await a.canvas()).digest('hex');
  ok('Cam 1 -> Cam 3 -> Cam 1 gives the identical canvas (deterministic rebuild)', h1 === h2, h1 + ' ' + h2);
  // (f) the four techniques draw the pocket at Cam 6
  await a.preset('stage'); const techOk = []; for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); techOk.push(t + ':' + (await ev(() => !!window.__evo.S().pocket))); }
  ok('Box, A, B and C draw the pocket at Cam 6 without errors', techOk.every((x) => x.endsWith('true')) && a.errs.length === 0, techOk.join(' ') + ' ' + JSON.stringify(a.errs));
  console.log('errors:', a.errs); ok('no page errors', a.errs.length === 0); await a.browser.close();
})();
