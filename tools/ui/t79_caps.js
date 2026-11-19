/* TERRAZAS 79 part 1 captures (stage_terrazas79_go.md): (a) the whole real map (the height layer only, no rooms layer: the terraces are the same; minPlateau 120 / 5 of the two presets) in Cam 5 (top) for each case (Balanced types 3 / 7 / 8 / 9 terraces, Default 7 / 8 / 9), the levels coloured by terrace as the viewer always does; (b) for 9 terraces ("Balanced types"), Cam 6 of the largest VALLEY (DAC 79) and the largest PEAK (DAC 46) of tools/terrazas79.js in mode 3 with the height treatment Up and Down (window of one room).
     NODE_PATH=$(npm root -g) node tools/ui/t79_caps.js <outDir> */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2]; if (!out) { console.error('usage: t79_caps.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  const shot = async (name) => { await (await page.$('#stage canvas')).screenshot({ path: path.join(out, name) }); console.log('shot', name); };
  // (a) the whole map, Cam 5
  await ev(() => window.__evo.setMode('terrain')); await a.idle();
  for (const [ex, tag, N] of [['real_map', 'balanced', 3], ['real_map', 'balanced', 7], ['real_map', 'balanced', 8], ['real_map', 'balanced', 9], ['real_map', 'default', 7], ['real_map', 'default', 8], ['real_map', 'default', 9]]) {
    await page.click(`#examples button[data-id="${ex}"]`); await a.idle(); await a.idle();
    await ev(({ N, tag }) => { const e = window.__evo; e.P.terraces = N; e.P.minPlateau = tag === 'balanced' ? 120 : 5; e.set({ tech: 'box', mode: 'single', preset: 'top' }); e.draw(); }, { N, tag }); await a.idle(); await a.idle();
    await page.click('#presets button[data-id="top"]'); await a.idle(); await a.idle();
    const info = await ev(() => { const e = window.__evo; return { terraces: e.P.terraces, preset: e.st.preset, tech: e.st.tech }; });
    console.log(tag, N, JSON.stringify(info)); await shot(`mapa_${tag}${N}_cam5.png`);
  }
  // (b) 9 terraces, the largest valley and peak in mode 3
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="perfil_c0"]'); await a.idle(); await a.idle();
  for (const [id, name] of [[79, 'valle79'], [46, 'cima46']]) {
    await ev(({ id }) => { const e = window.__evo; e.P.terraces = 9; e.stageSetRooms([id]); e.draw(); }, { id }); await a.idle(); await a.idle();
    for (const ht of ['up', 'down']) {
      await ev(({ ht }) => { const c = document.querySelector('#stageHeight'); c.value = ht; c.dispatchEvent(new Event('change')); }, { ht }); await a.idle(); await a.idle();
      const f = await ev(() => { const e = window.__evo, S = e.S(); return { rooms: e.st.stageRooms.slice(), terraces: e.P.terraces, lego: S.legoInfo && { t: S.legoInfo.treatment, m: S.legoInfo.m, terr: S.legoInfo.terraces, single: S.legoInfo.single, sub: !!S.legoInfo.sub, jumps: S.legoInfo.jumps }, yaw: e.view().yaw }; });
      console.log(name, ht, JSON.stringify(f)); await shot(`${name}_${ht}_cam6.png`);
    }
    await ev(() => { const c = document.querySelector('#stageHeight'); c.value = 'mid'; c.dispatchEvent(new Event('change')); }); await a.idle(); await a.idle(); await shot(`${name}_mid_cam6.png`);
  }
  console.log('errors:', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
