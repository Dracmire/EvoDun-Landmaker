/* PR pend P3: THE SAME PLACE at 3 / 5 / 7 / 9 terraces (tools/p3_places.js gives the boxes and the rooms that cut each box; the window of a shot = those rooms, the same tile box in the four cases). Hero at k0 / k4 / k8 of the path of the home room (map coordinates, the same in the four cases), Cam 6, follow on,
   same zoom (heroFrac, tilesPerH), treatments Mid and Up (u2 also Up + Cake Scale). Writes <out>/raw/<place>_<treat>_T<N>_k<i>.png and <out>/data.json (per shot: terraces, rooms, legoInfo m / flags, the hero tile). No verdict.
     NODE_PATH=$(npm root -g) node tools/ui/p3_same_place.js <outDir> [placeId] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2], only = process.argv[3]; if (!out) { console.error('usage: p3_same_place.js <outDir> [placeId]'); process.exit(2); } fs.mkdirSync(path.join(out, 'raw'), { recursive: true });
const places = JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/crystallizers/03-stage/shots/p3_places.json'), 'utf8')).places.filter((p) => !only || p.id === only);
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), data = {};
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const set = async (id, v) => { await ev(({ id, v }) => { const c = document.querySelector('#' + id); if (!c) throw new Error('no control ' + id); if (c.value !== String(v)) { c.value = v; c.dispatchEvent(new Event('input')); c.dispatchEvent(new Event('change')); } }, { id, v }); await a.idle(); };
  const win = async (ids) => { const ok = await ev((ids) => window.__evo.stageSetRooms(ids), ids); await a.idle(); await a.idle(); return ok; };
  for (const pl of places) {
    const u2 = pl.id.startsWith('u2');
    await page.click(`#examples button[data-id="${u2 ? 'perfil_u2' : 'dac_stage'}"]`); await a.idle(); await a.idle();
    if (pl.preset === 'Default') { await set('s-roomsMinCore', 20); await set('s-rRadius', 9); await set('s-minPlateau', 5); } else { await set('s-roomsMinCore', 100); await set('s-rRadius', 5); await set('s-minPlateau', 120); }
    // the hero positions: k0 / k4 / k8 of the path of the home room at its home terrace count
    await set('stageTerraces', pl.home); await win([pl.room]);
    const path0 = await ev(() => { const S = window.__evo.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [S.ox + (t % S.W), S.oy + ((t / S.W) | 0)]); });
    const N0 = path0.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(path0[Math.floor(i * (N0 - 1) / 8 + 0.5)]);
    data[pl.id] = { box: pl.box, preset: pl.preset, ks: [ks[0], ks[4], ks[8]], pathLen: N0, shots: [] };
    const treats = u2 ? [['mid', 'mid', 'rest'], ['up', 'up', 'rest'], ['upscale', 'up', 'scale']] : [['mid', 'mid', 'rest'], ['up', 'up', 'rest']];
    for (const T of [3, 5, 7, 9]) {
      await set('stageTerraces', T);
      const ids = pl.cases[T].rooms.slice(0, 12).map((r) => r.id); // WIN_MAX 12
      for (const [tn, ht, ck] of treats) {
        await set('stageHeight', ht); await set('stageCakeLego', ck);
        const wok = await win(ids);
        for (const [q, i] of [[0, 0], [1, 4], [2, 8]]) {
          const k = ks[i]; await ev(({ k }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: k[0] + 0.5, y: k[1] + 0.5 }; e.redraw(); }, { k }); await a.idle();
          await (await page.$('#stage canvas')).screenshot({ path: path.join(out, 'raw', `${pl.id}_${tn}_T${T}_k${i}.png`) });
          const info = await ev(() => { const S = window.__evo.S(), li = S.legoInfo || null; return { m: li ? (li.m !== undefined ? li.m : null) : null, flags: li ? Object.keys(li).filter((x) => li[x] === true) : [], rooms: S.rooms ? S.rooms.rooms.length : null, note: (document.querySelector('#info').innerText || '').slice(0, 160) }; });
          data[pl.id].shots.push({ treat: tn, terraces: T, k: i, win: ids, windowSet: wok, hero: k, ...info });
        }
      }
    }
    console.log(pl.id, 'done', data[pl.id].shots.length, 'shots');
  }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); console.log('page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
