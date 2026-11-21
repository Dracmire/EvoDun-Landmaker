/* HT1-R, Paso 4 (only to LOOK): the scenes of tools/ht1/scene.py (the jumps of a leave-one-out run painted as role PNGs) loaded as the example "Your images (PNG + roles)" of mode 3, Cam 6, the hero at k0 (the declared entry) and k4 (the middle of the axis). One jump = one terrace: `terraces` = the number of levels, pre-smoothing 0.
   Writes docs/crystallizers/03-stage/shots/ht1/<map>_<chosen|alt>_k0.png / _k4.png (our own renders). The remake captures are third-party: the side-by-side with them goes ONLY to tools/ui/out/ht1/ (git-ignored, never committed).
     NODE_PATH=$(npm root -g) node tools/ui/ht1_scene.js */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const ROOT = path.resolve(__dirname, '../..'), SCENES = path.join(ROOT, 'tools/ht1/scene'), OUT = path.join(ROOT, 'docs/crystallizers/03-stage/shots/ht1'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle(), res = {};
  const setCtl = async (id, v) => { await ev(({ id, v }) => { const c = document.querySelector('#' + id); if (!c) throw new Error('no control ' + id); c.value = v; c.dispatchEvent(new Event('input')); c.dispatchEvent(new Event('change')); }, { id, v }); await idle(); };
  await ev(() => window.__evo.setMode('stage')); await idle();
  for (const d of fs.readdirSync(SCENES).sort()) {
    const meta = JSON.parse(fs.readFileSync(path.join(SCENES, d, 'scene.json'), 'utf8'));
    await page.click('#examples button[data-id="images"]'); await idle();
    await page.setInputFiles('#file', ['height', 'zones', 'path', 'poi'].map((n) => path.join(SCENES, d, n + '.png'))); await page.waitForTimeout(2500); await idle(); await idle();
    await setCtl('s-pre', 0); await setCtl('stageTerraces', meta.levels);
    const ok = await ev((z) => window.__evo.stageSetWindow(z), meta.window_zones); await idle(); await idle();
    res[d] = { window: ok, zones: meta.window_zones, levels: meta.levels };
    for (const [k, pos] of [['k0', meta.hero_k0], ['k4', meta.hero_k4]]) {
      await ev((p) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x: p[0], y: p[1] }; e.redraw(); }, pos); await idle(); await idle();
      await (await page.$('#stage canvas')).screenshot({ path: path.join(OUT, `${d}_${k}.png`) });
      res[d][k] = await ev(() => { const e = window.__evo, S = e.S(); return { info: document.querySelector('#info').innerText.slice(0, 140), levels: S ? S.levelH.length : null }; });
    }
    console.log(d, JSON.stringify(res[d]).slice(0, 260));
  }
  res.pageErrors = a.errs.length; fs.writeFileSync(path.join(OUT, 'escenas.json'), JSON.stringify(res, null, 1)); console.log('page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
