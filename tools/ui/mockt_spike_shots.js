/* SPIKE (throwaway): captures of the two "mock T" examples of mode 3 (mockt_z14, mockt_x44) with declared volumes and objects, Cam 6, hero at the room entrance, the centre and ~2 H from the goal, techniques B and Box; plus one capture of each room with nothing on.
     NODE_PATH=$(npm root -g) node tools/ui/mockt_spike_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/spike_mockt');
const HERO = { // map coordinates, tile centres
  mockt_z14: { entrada: [60.5, 183.5], centro: [61.5, 200.5], meta: [55.5, 212.5] },
  mockt_x44: { entrada: [40.5, 8.5], centro: [85.5, 14.5], meta: [84.5, 5.5] }
};
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const sw = async (sel, on) => { const cur = await ev((sel) => document.querySelector(sel).checked, sel); if (cur !== on) { await page.click(sel); await a.idle(); } };
  const tech = async (t) => { await ev((t) => { window.__evo.set({ tech: t }); window.__evo.redraw(); }, t); await a.idle(); };
  const at = async ([x, y]) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); };
  const info = () => ev(() => { const S = window.__evo.S(), v = S.stageVolumes, o = window.__evo.O.objects; return { vol: v ? { tiles: v.tiles, levels: v.levelsAdded, skipped: v.skipped.reduce((m, s) => (m[s.reason] = (m[s.reason] || 0) + 1, m), {}) } : null, obj: o ? o.stats.map((s) => [s.kind, s.visible ? 1 : 0, s.drawn ? 1 : 0].join(':')).join(' ') : null }; });
  for (const id of ['mockt_z14', 'mockt_x44']) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle();
    // nothing on: the example as the room window gives it
    await sw('#t-stageObjects', false); await sw('#t-stageVolumes', false); await ev(() => { const s = document.querySelector('#stageBorder'); s.value = 'off'; s.dispatchEvent(new Event('change')); }); await a.idle();
    await tech('B'); await at(HERO[id].centro); fs.writeFileSync(path.join(out, `${id}_nada_B.png`), await a.canvas()); console.log(id, 'nada');
    // everything the example declares
    await sw('#t-stageObjects', true); await sw('#t-stageVolumes', true); if (id === 'mockt_x44') { await ev(() => { const s = document.querySelector('#stageBorder'); s.value = 'quebrada'; s.dispatchEvent(new Event('change')); }); await a.idle(); }
    for (const t of ['B', 'box']) { await tech(t); for (const [pos, xy] of Object.entries(HERO[id])) { await at(xy); fs.writeFileSync(path.join(out, `${id}_${pos}_${t === 'box' ? 'Box' : 'B'}.png`), await a.canvas()); if (t === 'B') console.log(id, pos, JSON.stringify(await info())); } }
    if (id === 'mockt_z14') { await tech('B'); await ev(() => { const s = document.querySelector('#stageBorder'); s.value = 'quebrada'; s.dispatchEvent(new Event('change')); }); await a.idle(); await at(HERO[id].centro); fs.writeFileSync(path.join(out, `${id}_centro_B_quebrada.png`), await a.canvas()); console.log(id, 'quebrada', JSON.stringify(await info())); }
  }
  console.log('errs', a.errs.length, a.errs.slice(0, 3)); await a.browser.close();
})();
