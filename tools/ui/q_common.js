/* R3 helpers (prompt_r3_go.md): the PLACES of [R] as windows of mode 3 and the common measurements.
   PLACES (decided by [R]; boxes and the rooms that cut them from docs/crystallizers/03-stage/shots/p3_places.json, tool tools/p3_places.js): r21 = plaza (Default, 3 terraces), r16 = terraced hillside (Default, 7 and 9), r79 = valley (Balanced, 5).
   The hero positions k0 / k4 / k8 are those of the home room's path at its HOME terrace count (r21 9, r16 9, r79 9: the same map coordinates as tools/ui/p3_same_place.js) in every terrace count. */
const fs = require('fs'), path = require('path');
const MEASURE = require('./q_measure_body.js');
const P3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/crystallizers/03-stage/shots/p3_places.json'), 'utf8')).places;
const PLACES = { r21: { place: 'r21_default9', T: 3 }, r16_9: { place: 'r16_default9', T: 9 }, r16_7: { place: 'r16_default9', T: 7 }, r79: { place: 'r79_balanced9', T: 5 } };
const find = (id) => P3.find((p) => p.id === id);
async function begin(open) { const a = await open({ w: 1280, h: 760, modes: true, orient: true }); a.ev = (f, x) => a.page.evaluate(f, x); await a.ev(() => window.__evo.setMode('stage')); await a.idle(); return a; }
const setCtl = async (a, id, v) => { await a.ev(({ id, v }) => { const c = document.querySelector('#' + id); if (!c) throw new Error('no control ' + id); if (c.value !== String(v)) { c.value = v; c.dispatchEvent(new Event('input')); c.dispatchEvent(new Event('change')); } }, { id, v }); await a.idle(); };
/* put the window of a place at T terraces; returns { ks: [k0, k4, k8] (map coordinates), ids, box } */
async function setupPlace(a, key, opts = {}) {
  const spec = PLACES[key], pl = find(spec.place), T = opts.T || spec.T; if (!a.ks || a.ksPlace !== pl.id) a.ks = null;
  if (a.cur !== pl.id) { await a.page.click('#examples button[data-id="dac_stage"]'); await a.idle(); await a.idle(); if (pl.preset === 'Default') { await setCtl(a, 's-roomsMinCore', 20); await setCtl(a, 's-rRadius', 9); await setCtl(a, 's-minPlateau', 5); } else { await setCtl(a, 's-roomsMinCore', 100); await setCtl(a, 's-rRadius', 5); await setCtl(a, 's-minPlateau', 120); } a.cur = pl.id; a.ks = null; }
  if (!a.ks) { await setCtl(a, 'stageTerraces', pl.home); await a.ev((r) => window.__evo.stageSetRooms([r]), pl.room); await a.idle(); await a.idle();
    const path0 = await a.ev(() => { const S = window.__evo.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [S.ox + (t % S.W), S.oy + ((t / S.W) | 0)]); }), N = path0.length;
    a.ks = [0, 4, 8].map((i) => path0[Math.floor(i * (N - 1) / 8 + 0.5)]); a.ksPlace = pl.id; }
  await setCtl(a, 'stageTerraces', T);
  const ids = [pl.room, ...pl.cases[T].rooms.map((r) => r.id).filter((r) => r !== pl.room)].slice(0, 12);
  if (opts.treat) await setCtl(a, 'stageHeight', opts.treat);
  await a.ev((ids) => window.__evo.stageSetRooms(ids), ids); await a.idle(); await a.idle();
  return { ks: a.ks, ids, box: pl.box, T };
}
async function heroAt(a, k) { await a.ev(({ k }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: k[0] + 0.5, y: k[1] + 0.5 }; e.redraw(); }, { k }); await a.idle(); await a.idle(); }
const measure = (a) => a.page.evaluate('(async () => {' + MEASURE + '})()');
module.exports = { PLACES, find, begin, setCtl, setupPlace, heroAt, measure };
