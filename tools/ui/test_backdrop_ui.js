/* Crystallizer 5, Option 2 phases 1 and 1b, the floor backdrop in the viewer (source "Snake Mountain floors"): the switch exists only for a floors package and is greyed in the multi-layer views and with Cam 6; with it on, the floor is
   still drawn by the normal pipeline (the info line reports the backdrop and, for the attached variants, says that the heights are real data placed by a mirror and what the multiplier does), the picture changes in Box, A, B and C, the
   Exterior layer is untouched; and the HARD RULE in pixels: in the Box pick render (E.pickBuffer, one code per pixel: walls by tile, caps by tile) every pixel that shows a tile of the floor with the backdrop off shows the SAME code
   with it on (nothing added hides the floor), Cam 1, fitted and at ~50 px per tile, floor 1 and floor 2, for every mode: real, mirror (phase 1), and the attached cavity wall V1 x1 / x2 / x4 (the tallest), V2, V3. Floor 2: the enclosed void
   (the shaft and the opening) stays void (no cap of the backdrop inside the projected opening). Pixel identity with the switch off: tools/verify.sh regress (regress_floors.js).
     NODE_PATH=$(npm root -g) node tools/ui/test_backdrop_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  const info = () => page.$eval('#info', (e) => e.textContent), ev = (f, ...args) => page.evaluate(f, ...args);
  const sw = async (on, mode, mult) => { await ev(({ on, mode, mult }) => { const P = window.__evo.P; P.backdropMode = mode || 'v1'; if (mult) P.backdropHeight = mult; const c = document.querySelector('#t-backdrop'); c.checked = on; c.dispatchEvent(new Event('change', { bubbles: true })); }, { on, mode, mult }); await a.idle(); await page.waitForTimeout(250); await a.idle(); };
  await page.selectOption('#src', 'snake_floors'); await a.idle(); await page.click('#mode'); await a.idle(); await a.preset('isoE');
  ok('the Floor backdrop switch and its two sliders exist and are enabled for a floors package in the single-floor view (the sliders once the switch is on)', await ev(() => { const c = document.querySelector('#t-backdrop'); return !!c && !c.disabled && !!document.querySelector('#s-backdropGap') && !!document.querySelector('#s-backdropHeight'); }));
  /* the Box pick render at an explicit view and size (the state with the backdrop off records them, the state with it on reuses them: the info line grows with the backdrop text and the canvas height follows, known limitation 18) */
  const pick = (spec) => ev(({ spec }) => { const e = window.__evo, E = window.EVO, S = e.S(), cv = document.querySelector('#stage canvas'), w = spec ? spec.w : cv.clientWidth, h = spec ? spec.h : cv.clientHeight, v = spec ? spec.v : Object.assign({}, e.view());
      const r = E.pickBuffer(S, e.P, v, w, h), d = r.data, codes = new Int32Array(w * h); for (let i = 0; i < w * h; i++) codes[i] = d[i * 4 + 3] === 255 ? (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2] : -1;
      const frag = [], bd = S.backdrop, add = []; for (let i = 0; i < S.n; i++) { frag.push(bd ? (bd.role[i] === 1 ? 1 : 0) : (S.void && S.void[i] ? 0 : 1)); add.push(bd && bd.role[i] === 2 ? 1 : 0); }
      // the enclosed void of the floor (void tiles not 4-connected to the map border through void): projected quads of their cap at the floor height, for the opening check
      const W = S.W, H = S.H, isFloor = (i) => (bd ? bd.role[i] === 1 : !(S.void && S.void[i])), out = new Uint8Array(S.n), q = []; for (let i = 0; i < S.n; i++) { const x = i % W, y = (i / W) | 0; if (!isFloor(i) && (x === 0 || y === 0 || x === W - 1 || y === H - 1)) { out[i] = 1; q.push(i); } }
      for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !isFloor(j) && !out[j]) { out[j] = 1; q.push(j); } }
      const hs = []; for (let i = 0; i < S.n; i++) if (isFloor(i)) hs.push(S.levelH[S.fine[i]]); hs.sort((x, y) => x - y); const hf = hs[hs.length >> 1], cam = E.makeCam(S, e.P, v, w, h), quads = [];
      for (let i = 0; i < S.n; i++) if (!isFloor(i) && !out[i]) { const x = i % W, y = (i / W) | 0; quads.push([cam.p(x, y, hf), cam.p(x + 1, y, hf), cam.p(x + 1, y + 1, hf), cam.p(x, y + 1, hf)]); }
      return { w, h, v, codes: Array.from(codes), frag, add, n: S.n, quads, enclosed: quads.length }; }, { spec });
  const playView = async () => { const fo = await ev(() => { const e = window.__evo, S = e.S(); let sx = 0, sy = 0, c = 0; const bd = S.backdrop; for (let i = 0; i < S.n; i++) if (bd ? bd.role[i] === 1 : !(S.void && S.void[i])) { sx += (i % S.W) + 0.5; sy += ((i / S.W) | 0) + 0.5; c++; } const cx = sx / c, cy = sy / c, i = Math.floor(cy) * S.W + Math.floor(cx); return { x: cx - 3.5 * Math.SQRT1_2, y: cy - 3.5 * Math.SQRT1_2, h: S.levelH[S.fine[i]] + 0.5, fit: e.st.fitSc }; }); await a.focus(fo.x, fo.y, fo.h, 50 / fo.fit); };
  const inQuad = (q, x, y) => { let s = 0; for (let i = 0; i < 4; i++) { const A = q[i], B = q[(i + 1) % 4], c = (B[0] - A[0]) * (y - A[1]) - (B[1] - A[1]) * (x - A[0]); s += c >= 0 ? 1 : -1; } return Math.abs(s) === 4; };
  const MODES = [['real', 0], ['mirror', 0], ['v1', 1], ['v1', 2], ['v1', 4], ['v2', 2], ['v3', 2]];
  for (const k of [1, 2]) {
    await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle(); await sw(false, 'real');
    const hOff = {}; for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); await a.preset('isoE'); hOff[t] = await hash(); }
    await a.tech('box'); await a.preset('isoE'); const fitOff = await pick(null), fragOff = new Set(); for (let i = 0; i < fitOff.n; i++) if (fitOff.frag[i]) fragOff.add(i);
    await playView(); const playOff = await pick(null);
    for (const [mode, mult] of MODES) {
      const tag = `floor ${k}, ${mode}${mult ? ' x' + mult : ''}`;
      await sw(true, mode, mult); const t = await info();
      ok(`${tag}: the info line reports the backdrop` + (mult ? ' and says that the heights are real data placed by a mirror and what the multiplier does' : ''), /Backdrop/.test(t) && (!mult || (/MIRROR/.test(t) && /minimum/.test(t) && /multiplies only the rise above the apron/.test(t))), t.slice(-420));
      const changed = []; for (const tt of ['box', 'A', 'B', 'C']) { await a.tech(tt); await a.preset('isoE'); changed.push((await hash()) !== hOff[tt]); }
      ok(`${tag}: the picture changes in Box, A, B and C`, changed.every(Boolean), changed);
      await a.tech('box'); await a.preset('isoE'); const fitOn = await pick({ w: fitOff.w, h: fitOff.h, v: fitOff.v }), playOn = await pick({ w: playOff.w, h: playOff.h, v: playOff.v });
      for (const [nm, off, on] of [['fitted', fitOff, fitOn], ['~50 px per tile', playOff, playOn]]) {
        /* real / mirror (a gap of void between the floor and the band): strict identity of every floor pixel. Attached variants (the apron touches the floor): a pixel on the JOIN of two tiles is an antialiased blend of two codes
           (not a valid code of either), so there the rule is: no floor pixel shows a valid code of a backdrop tile (hidden = 0); the blended join pixels are counted and must stay under 0.05 % of the floor pixels */
        /* a join pixel is one of the floor's silhouette pixels (an 8-neighbour of the floor's own pixels is not floor): the 0.8 px outline stroke of a touching tile can cover it with its own code (painter order of tiles in the same diagonal row) */
        const isFloorPx = (q) => { const c = off.codes[q]; return c >= 0 && ((c >> 20) === 2 || (c >> 20) === 4) && fragOff.has(c & 0xfffff); };
        const attached = mode[0] === 'v'; let cov = 0, bad = 0, hiddenIn = 0, hiddenJoin = 0, blend = 0; for (let p = 0; p < off.codes.length; p++) { if (!isFloorPx(p)) continue; cov++; const c = off.codes[p], c2 = on.codes[p]; if (c2 !== c) { bad++; const k2 = c2 < 0 ? -1 : c2 >> 20, v2 = c2 < 0 ? -1 : c2 & 0xfffff;
          if ((k2 === 2 || k2 === 4) && v2 < on.n && on.add[v2]) { const x = p % off.w, y = (p / off.w) | 0; let join = false; for (let dy = -1; dy <= 1 && !join; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= off.w || yy >= off.h || !isFloorPx(yy * off.w + xx)) { join = true; break; } } if (join) hiddenJoin++; else hiddenIn++; } else blend++; } }
        ok(`${tag}, ${nm}: HARD RULE in pixels: ${cov} pixels show the floor without the backdrop; ${attached ? hiddenIn + ' of them (interior of the floor) show a backdrop tile, ' + hiddenJoin + ' join pixels show a backdrop code, ' + blend + ' are blended join pixels (' + (100 * (hiddenJoin + blend) / cov).toFixed(4) + ' % together)' : bad + ' of them show something else with it'}`, cov > 500 && (attached ? hiddenIn === 0 && hiddenJoin + blend <= 0.0005 * cov : bad === 0), { cov, bad, hiddenIn, hiddenJoin, blend });
        if (k === 2 && on.enclosed > 0) { // the opening: the pixels inside the projected enclosed void (the shaft and the opening) must not show a CAP of the backdrop (the void was not filled)
          let inside = 0, capBd = 0, wallBd = 0; const xs = on.quads.flat().map((q) => q[0]), ys = on.quads.flat().map((q) => q[1]), x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(on.w - 1, Math.ceil(Math.max(...xs))), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(on.h - 1, Math.ceil(Math.max(...ys)));
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!on.quads.some((q) => inQuad(q, x + 0.5, y + 0.5))) continue; inside++; const c = on.codes[y * on.w + x]; if (c < 0) continue; const kind = c >> 20, v = c & 0xfffff; if (on.add[v]) { if (kind === 4) capBd++; else if (kind === 2) wallBd++; } }
          ok(`${tag}, ${nm}: the opening stays an opening: ${on.enclosed} enclosed void tiles, ${inside} pixels inside their projection, ${capBd} show a backdrop cap (${wallBd} a backdrop wall seen through)`, capBd === 0, { inside, capBd, wallBd });
        }
      }
      await a.preset('isoE'); await page.click('#reset'); await a.idle();
    }
    await sw(false, 'real');
  }
  for (const cmode of ['mirror', 'v1']) { // CONTROL of the pixel check: the same plan on the OPPOSITE axis (yaw 225: the band in FRONT of the floor, toward the camera) must be caught by it, also by the refined interior metric of the attached variant
    await page.click('#floorChips button[data-floor="1"]'); await a.idle(); await sw(false, 'real'); await a.tech('box'); await a.preset('isoE'); const off = await pick(null), fr = new Set(); for (let i = 0; i < off.n; i++) if (off.frag[i]) fr.add(i);
    await ev(() => { window.EVO.backdrop.defaults.yaw = 225; }); await sw(true, cmode, 2); const on = await pick({ w: off.w, h: off.h, v: off.v }); await ev(() => { window.EVO.backdrop.defaults.yaw = 45; });
    let cov = 0, bad = 0, hid = 0; for (let p = 0; p < off.codes.length; p++) { const c = off.codes[p]; if (c < 0) continue; const kind = c >> 20, v = c & 0xfffff; if ((kind === 2 || kind === 4) && fr.has(v)) { cov++; const c2 = on.codes[p]; if (c2 !== c) { bad++; const k2 = c2 < 0 ? -1 : c2 >> 20, v2 = c2 < 0 ? -1 : c2 & 0xfffff; if ((k2 === 2 || k2 === 4) && v2 < on.n && on.add[v2]) hid++; } } }
    ok(`control (${cmode}): with the band on the camera side (yaw 225) the pixel check catches it (${bad} of ${cov} floor pixels changed, ${hid} show a backdrop tile)`, cmode === 'mirror' ? bad > 100 : hid > 100, { cov, bad, hid }); await sw(false, 'real'); }
  // the Exterior layer has none; the stack and the cutaway grey the switch; Cam 6 greys it
  await sw(true, 'v1', 2); await page.click('#floorChips button[data-floor="0"]'); await a.idle(); ok('the Exterior layer has no backdrop', !(await ev(() => !!window.__evo.S().backdrop)));
  await page.click('#floorChips button[data-floor="1"]'); await a.idle(); ok('floor 1 has it again when the switch is on', await ev(() => !!window.__evo.S().backdrop));
  await page.selectOption('#floorsView', 'stack'); await a.idle(); ok('the exploded stack has no backdrop and the switch and the sliders are greyed (Requires: Single floor)', !(await ev(() => !!window.__evo.S().backdrop)) && (await ev(() => document.querySelector('#t-backdrop').disabled && document.querySelector('#s-backdropHeight').disabled)));
  await page.selectOption('#floorsView', 'cut'); await a.idle(); ok('the cutaway has no backdrop', !(await ev(() => !!window.__evo.S().backdrop)));
  await page.selectOption('#floorsView', 'single'); await a.idle(); await a.preset('stage'); await a.idle(); ok('Cam 6 (perspective): no backdrop and the switch is greyed', !(await ev(() => !!window.__evo.S().backdrop)) && (await ev(() => document.querySelector('#t-backdrop').disabled)));
  await a.preset('isoE'); await a.idle(); await sw(false, 'real');
  console.log('errors:', a.errs); ok('no page errors', a.errs.length === 0); await a.browser.close();
})();
