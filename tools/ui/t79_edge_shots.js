/* TERRAZAS 79 part 3 (stage_terrazas79_go.md): Square | Hybrid edge style: the shots k0 / k4 / k8 of Cam 6 (Cam 7 in u1) of the examples with the treatment OFF (Mid) and ON, and the table of data: the stairs (steps -> ramp, depth before / after), the rings of the Cake, the sub-level lego. The sheets (Mid | lego side by side) are made by tools/lego3_sheets.py.
     NODE_PATH=$(npm root -g) node tools/ui/lego3_shots.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2]; if (!out) { console.error('usage: lego3_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
// [example, variants: [name, height-treatment selector, cake-under-lego selector]], cams
const PLAN = [['perfil_u1', [['square', 'auto', 'rest', 'square'], ['hybrid', 'auto', 'rest', 'hybrid']], ['stage', 'classic']], ['perfil_u2', [['square', 'auto', 'rest', 'square'], ['hybrid', 'auto', 'rest', 'hybrid']], ['stage']], ['perfil_m1', [['square', 'auto', 'rest', 'square'], ['hybrid', 'auto', 'rest', 'hybrid']], ['stage']], ['perfil_s1', [['square', 'auto', 'rest', 'square'], ['hybrid', 'auto', 'rest', 'hybrid']], ['stage']], ['perfil_l1', [['square', 'auto', 'rest', 'square'], ['hybrid', 'auto', 'rest', 'hybrid']], ['stage']]];
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), data = {};
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const set = async (ht, ck, ed) => { await ev(({ ht, ck, ed }) => { for (const [sel, v] of [['#stageHeight', ht], ['#stageCakeLego', ck], ['#stageEdge', ed]]) { const c = document.querySelector(sel); if (c.value !== v) { c.value = v; c.dispatchEvent(new Event('change')); } } }, { ht, ck, ed }); await a.idle(); await a.idle(); };
  for (const [id, variants, cams] of PLAN) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    const path0 = await ev(() => { const e = window.__evo, S = e.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [t % S.W, (t / S.W) | 0]); });
    const N = path0.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(path0[Math.floor(i * (N - 1) / 8 + 0.5)]);
    for (const cam of cams) {
      await page.click(`#presets button[data-id="${cam}"]`); await a.idle(); await a.idle();
      for (const [vn, ht, ck, ed] of variants) {
        await set(ht, ck, ed);
        for (const i of [0, 4, 8]) {
          await ev(({ k }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[i] }); await a.idle();
          if (cam === 'classic') { await ev(() => { const e = window.__evo, st = e.st, cv = document.querySelector('#stage canvas'), h = st.persH || cv.clientHeight, tp = st.stage.tilesPerH, sc = st.stage.heroFrac * h / tp, zoom = sc / st.fitSc, S = e.S(), hx = st.hero.x - S.ox, hy = st.hero.y - S.oy; st.zoom = zoom; if (e.view) { const v = e.view(); void v; } e.redraw(); }); await a.idle(); }
          await (await page.$('#stage canvas')).screenshot({ path: path.join(out, `${id}_${cam === 'stage' ? 'cam6' : 'cam7'}_${vn}_k${i}.png`) });
        }
        if (cam === 'stage') data[`${id}|${vn}`] = await ev(() => { const e = window.__evo, S = e.S(), li = S.legoInfo || null, ad = S.legoAdjust || null; const st = (S.stairs || []).map((r) => ({ mode: r.mode, len: r.ramp ? r.ramp.len : r.steps.length, cols: r.cols.length, h0: r.ramp ? +r.ramp.h0.toFixed(2) : null, h1: r.ramp ? +r.ramp.h1.toFixed(2) : null, treads: r.ramp ? null : r.steps.length })); const jumpLines = (j) => Math.max(2, Math.min(10, Math.round(j / 0.3))); return { lego: li && { treatment: li.treatment, m: li.m, terraces: li.terraces, single: li.single, sub: !!li.sub, moved: li.moved, jumps: li.jumps, conflict: li.conflict, yawFlip: li.yawFlip }, adjust: ad, stairs: st.length, stairDepths: st.map((x) => x.len), stairMode: st.map((x) => x.mode).slice(0, 1), crossLines: st.filter((x) => x.h0 !== null).map((x) => jumpLines(Math.abs(x.h1 - x.h0))), stairInfo: S.stairInfo ? { placed: S.stairInfo.placed, dropped: S.stairInfo.dropped } : null, cake: S.cake ? { links: S.cake.links, rings: S.cake.rings, tiles: S.cake.tiles, levelsAdded: S.cake.levelsAdded } : null, levels: S.levelH.length }; });
      }
    }
    await page.click('#presets button[data-id="stage"]'); await a.idle();
    console.log(id, JSON.stringify(Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith(id + '|')).map(([k, v]) => [k.split('|')[1], { st: v.stairs, depth: v.stairDepths, lines: v.crossLines, cake: v.cake && v.cake.rings, adj: v.adjust && { d: v.adjust.depthAfter, cl: v.adjust.cakeLayersAfter } }]))).slice(0, 500));
  }
  fs.writeFileSync(path.join(out, 't79_edge_datos.json'), JSON.stringify(data, null, 1)); console.log('errors:', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
