/* PR pend P2 (prompt_pendientes_go.md): Square | Hybrid edge style of u1 (Ascension) and u2 (Cake) at Cam 6 and Cam 8, with the yaw of the room FORCED to 90 and 270 (the page-side wrapper of E.orient.compute: a harness hook, nothing in src/), hero at k0 / k4 / k8 of the props path.
   Writes <outDir>/<example>_<cam>_y<yaw>_<edge>_k<i>.png and, per example / yaw, the SQUARE-vs-HYBRID pixel difference around the guarded tiles in data.json.
     NODE_PATH=$(npm root -g) node tools/ui/p2_edge_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2]; if (!out) { console.error('usage: p2_edge_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), data = {};
  await ev(() => { window.__force = null; const c = window.EVO.orient.compute; window.EVO.orient.compute = function () { const T = c.apply(this, arguments); if (T && T.byId && window.__force !== null) for (const r of T.byId.values()) r.yaw = window.__force; return T; }; });
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const setSel = async (sel, v) => { await ev(({ sel, v }) => { const c = document.querySelector(sel); if (c && c.value !== v) { c.value = v; c.dispatchEvent(new Event('change')); } }, { sel, v }); await a.idle(); };
  for (const id of ['perfil_u1', 'perfil_u2']) for (const yaw of [90, 270]) {
    await ev(({ yaw }) => { window.__force = yaw; }, { yaw });
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    const path0 = await ev(() => { const S = window.__evo.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [t % S.W, (t / S.W) | 0]); });
    const N = path0.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(path0[Math.floor(i * (N - 1) / 8 + 0.5)]);
    for (const cam of ['stage', 'stagez']) {
      await page.click(`#presets button[data-id="${cam}"]`); await a.idle(); await a.idle();
      for (const ed of ['square', 'hybrid']) {
        await setSel('#stageEdge', ed);
        for (const i of [0, 4, 8]) {
          await ev(({ k }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[i] }); await a.idle();
          await (await page.$('#stage canvas')).screenshot({ path: path.join(out, `${id}_${cam === 'stage' ? 'cam6' : 'cam8'}_y${yaw}_${ed}_k${i}.png`) });
        }
      }
    }
    data[`${id}|${yaw}`] = await ev(() => { const S = window.__evo.S(); return { yawNow: window.__force, ascFaces: S.ascWalls ? S.ascWalls.faces.length : 0, ringTiles: S.ringTile ? Array.prototype.reduce.call(S.ringTile, (s, v) => s + v, 0) : 0, errors: 0 }; });
    await setSel('#stageEdge', 'square'); await page.click('#presets button[data-id="stage"]'); await a.idle();
  }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); console.log(JSON.stringify(data)); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
