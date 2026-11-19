/* PR pend P5: Cam 7 (Classic 3/4, oblique) against Cam 6 (Stage, perspective) at k0 / k4 / k8 of the props path, in perfil_l1 (Diorama 7, Cima, Down), perfil_u1 (Ascension, Up) and perfil_u2 (Cake, Up). MEASURE AND CAPTURE ONLY: nothing in src/ changes.
   Writes <out>/<example>_<cam6|cam7>_k<i>.png and data.json (the hero tiles). KNOWN LIMIT: the Cam 7 shots do NOT track the hero in this harness (a.focus does not move the Cam 7 framing in mode 3: the three k images are identical and the hero is off panel); the flatness figures are from src/render.js makeCam: screen y = depth * sp - height * cp, sp = cp = 1 in Cam 7 (ratio 1); in Cam 6 at the pivot sp = sin(pitch), cp = cos(pitch) (pitch 25: cot 25 = 2.14).
     NODE_PATH=$(npm root -g) node tools/ui/p5_cam7_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2]; if (!out) { console.error('usage: p5_cam7_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), data = {};
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  for (const id of ['perfil_l1', 'perfil_u1', 'perfil_u2']) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    const path0 = await ev(() => { const S = window.__evo.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [S.ox + (t % S.W), S.oy + ((t / S.W) | 0)]); });
    const N = path0.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(path0[Math.floor(i * (N - 1) / 8 + 0.5)]);
    data[id] = { pathLen: N, cams: {} };
    for (const [cam, cn] of [['stage', 'cam6'], ['classic', 'cam7']]) {
      await page.click(`#presets button[data-id="${cam}"]`); await a.idle(); await a.idle();
      data[id].cams[cn] = [];
      for (const i of [0, 4, 8]) {
        await ev(({ k }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[i] }); await a.idle();
        if (cam === 'classic') { const g = await ev(() => { const e = window.__evo, st = e.st, cv = document.querySelector('#stage canvas'), h = st.persH || cv.clientHeight, tp = st.stage.tilesPerH, sc = st.stage.heroFrac * h / tp, S = e.S(), hx = st.hero.x - S.ox, hy = st.hero.y - S.oy, ti = Math.floor(hy) * S.W + Math.floor(hx); return { zoom: sc / st.fitSc, hx, hy, hh: S.levelH[S.fine[ti]] }; }); await a.focus(g.hx, g.hy, g.hh, g.zoom); }
        await (await page.$('#stage canvas')).screenshot({ path: path.join(out, `${id}_${cn}_k${i}.png`) });
        data[id].cams[cn].push({ k: i, hero: ks[i] });
      }
    }
    await page.click('#presets button[data-id="stage"]'); await a.idle();
  }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); console.log(JSON.stringify(data).slice(0, 900)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
