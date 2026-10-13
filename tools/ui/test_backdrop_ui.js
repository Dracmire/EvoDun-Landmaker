/* Crystallizer 5, Option 2 phase 1, the floor backdrop in the viewer (source "Snake Mountain floors"): the switch exists only for a floors package and is greyed in the multi-layer views and with Cam 6; with it on, the floor is
   still drawn by the normal pipeline (the info line reports the backdrop), the picture changes in Box, A, B and C, the Exterior layer is untouched; and the HARD RULE in pixels: in the Box pick render (E.pickBuffer, one code per
   pixel: walls by tile, caps by tile) every pixel that shows a tile of the floor with the backdrop off shows the SAME code with it on (nothing added hides the floor), Cam 1, fitted and at ~50 px per tile, floor 1 and floor 2,
   real heights and the diagnostic mirror mode. Pixel identity with the switch off: tools/verify.sh regress (regress_floors.js).
     NODE_PATH=$(npm root -g) node tools/ui/test_backdrop_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  const info = () => page.$eval('#info', (e) => e.textContent), ev = (f, ...args) => page.evaluate(f, ...args);
  const sw = async (on, mirror) => { await ev(({ on, mirror }) => { window.__evo.P.backdropMirror = !!mirror; const c = document.querySelector('#t-backdrop'); c.checked = on; c.dispatchEvent(new Event('change', { bubbles: true })); }, { on, mirror }); await a.idle(); await page.waitForTimeout(250); await a.idle(); };
  await page.selectOption('#src', 'snake_floors'); await a.idle(); await page.click('#mode'); await a.idle(); await a.preset('isoE');
  ok('the Floor backdrop switch exists and is enabled for a floors package in the single-floor view', await ev(() => { const c = document.querySelector('#t-backdrop'); return !!c && !c.disabled; }));
  // pixels of the Box pick render: codes of the floor's tiles
  /* the Box pick render at an explicit view and size (the state with the backdrop off records them, the state with it on reuses them: the info line grows with the backdrop text and the canvas height follows, known limitation 18) */
  const pick = (spec) => ev(({ spec }) => { const e = window.__evo, E = window.EVO, S = e.S(), cv = document.querySelector('#stage canvas'), w = spec ? spec.w : cv.clientWidth, h = spec ? spec.h : cv.clientHeight, v = spec ? spec.v : Object.assign({}, e.view());
      const r = E.pickBuffer(S, e.P, v, w, h), d = r.data, codes = new Int32Array(w * h); for (let i = 0; i < w * h; i++) codes[i] = d[i * 4 + 3] === 255 ? (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2] : -1;
      const frag = []; const bd = S.backdrop; for (let i = 0; i < S.n; i++) frag.push(bd ? (bd.role[i] === 1 ? 1 : 0) : (S.void && S.void[i] ? 0 : 1)); return { w, h, v, codes: Array.from(codes), frag, n: S.n }; }, { spec });
  const playView = async () => { const fo = await ev(() => { const e = window.__evo, S = e.S(); let sx = 0, sy = 0, c = 0; const bd = S.backdrop; for (let i = 0; i < S.n; i++) if (bd ? bd.role[i] === 1 : !(S.void && S.void[i])) { sx += (i % S.W) + 0.5; sy += ((i / S.W) | 0) + 0.5; c++; } const cx = sx / c, cy = sy / c, i = Math.floor(cy) * S.W + Math.floor(cx); return { x: cx - 3.5 * Math.SQRT1_2, y: cy - 3.5 * Math.SQRT1_2, h: S.levelH[S.fine[i]] + 0.5, fit: e.st.fitSc }; }); await a.focus(fo.x, fo.y, fo.h, 50 / fo.fit); };
  for (const k of [1, 2]) {
    await page.click(`#floorChips button[data-floor="${k}"]`); await a.idle(); await sw(false, false);
    const hOff = {}; for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); await a.preset('isoE'); hOff[t] = await hash(); }
    await a.tech('box'); await a.preset('isoE'); const fitOff = await pick(null), fragOff = new Set(); for (let i = 0; i < fitOff.n; i++) if (fitOff.frag[i]) fragOff.add(i);
    await playView(); const playOff = await pick(null);
    for (const mode of ['real', 'mirror']) {
      await sw(true, mode === 'mirror'); const t = await info();
      ok(`floor ${k}, ${mode}: the info line reports the backdrop`, /Backdrop/.test(t), t.slice(-160));
      const changed = []; for (const tt of ['box', 'A', 'B', 'C']) { await a.tech(tt); await a.preset('isoE'); changed.push((await hash()) !== hOff[tt]); }
      ok(`floor ${k}, ${mode}: the picture changes in Box, A, B and C`, changed.every(Boolean), changed);
      await a.tech('box'); await a.preset('isoE'); const fitOn = await pick({ w: fitOff.w, h: fitOff.h, v: fitOff.v }); const playOn = await pick({ w: playOff.w, h: playOff.h, v: playOff.v });
      for (const [nm, off, on] of [['fitted', fitOff, fitOn], ['~50 px per tile', playOff, playOn]]) {
        let cov = 0, bad = 0;
        for (let p = 0; p < off.codes.length; p++) { const c = off.codes[p]; if (c < 0) continue; const kind = c >> 20, v = c & 0xfffff; if ((kind === 2 || kind === 4) && fragOff.has(v)) { cov++; if (on.codes[p] !== c) bad++; } }
        ok(`floor ${k}, ${mode}, ${nm}: HARD RULE in pixels: ${cov} pixels show the floor without the backdrop, ${bad} of them show something else with it`, cov > 500 && bad === 0, { cov, bad });
      }
      await a.preset('isoE'); await page.click('#reset'); await a.idle();
    }
    await sw(false, false);
  }
  { // CONTROL of the pixel check: the same plan on the OPPOSITE axis (yaw 225: the band in FRONT of the floor, toward the camera) must be caught by it
    await page.click('#floorChips button[data-floor="1"]'); await a.idle(); await sw(false, false); await a.tech('box'); await a.preset('isoE'); const off = await pick(null), fr = new Set(); for (let i = 0; i < off.n; i++) if (off.frag[i]) fr.add(i);
    await ev(() => { window.EVO.backdrop.defaults.yaw = 225; }); await sw(true, true); const on = await pick({ w: off.w, h: off.h, v: off.v }); await ev(() => { window.EVO.backdrop.defaults.yaw = 45; });
    let cov = 0, bad = 0; for (let p = 0; p < off.codes.length; p++) { const c = off.codes[p]; if (c < 0) continue; const kind = c >> 20, v = c & 0xfffff; if ((kind === 2 || kind === 4) && fr.has(v)) { cov++; if (on.codes[p] !== c) bad++; } }
    ok(`control: with the band on the camera side (yaw 225) the pixel check catches it (${bad} of ${cov} floor pixels hidden)`, bad > 100, { cov, bad }); await sw(false, false); }
  // the Exterior layer has none; the stack and the cutaway grey the switch; Cam 6 greys it
  await sw(true, false); await page.click('#floorChips button[data-floor="0"]'); await a.idle(); ok('the Exterior layer has no backdrop', !(await ev(() => !!window.__evo.S().backdrop)));
  await page.click('#floorChips button[data-floor="1"]'); await a.idle(); ok('floor 1 has it again when the switch is on', await ev(() => !!window.__evo.S().backdrop));
  await page.selectOption('#floorsView', 'stack'); await a.idle(); ok('the exploded stack has no backdrop and the switch is greyed (Requires: Single floor)', !(await ev(() => !!window.__evo.S().backdrop)) && (await ev(() => document.querySelector('#t-backdrop').disabled)));
  await page.selectOption('#floorsView', 'cut'); await a.idle(); ok('the cutaway has no backdrop', !(await ev(() => !!window.__evo.S().backdrop)));
  await page.selectOption('#floorsView', 'single'); await a.idle(); await a.preset('stage'); await a.idle(); ok('Cam 6 (perspective): no backdrop and the switch is greyed', !(await ev(() => !!window.__evo.S().backdrop)) && (await ev(() => document.querySelector('#t-backdrop').disabled)));
  await a.preset('isoE'); await a.idle(); await sw(false, false);
  console.log('errors:', a.errs); ok('no page errors', a.errs.length === 0); await a.browser.close();
})();
