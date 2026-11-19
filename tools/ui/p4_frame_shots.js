/* PR pend P4: "hoy" (planes walls and columns) | "vecinos" (the neighbouring rooms as real ground with their own lego) at Cam 6, hero at k0 / k4 / k8 of the room's path: perfil_s1 (Ascension, one terrace, Up) and room 21 of Default 9 (Up).
   Writes <out>/<case>_<hoy|vecinos>_k<i>.png and data.json (the neighbours, their m and the tiles moved; the 'off' state's hash against a second off render).   NODE_PATH=$(npm root -g) node tools/ui/p4_frame_shots.js <outDir> */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { open } = require('./common');
const out = process.argv[2]; if (!out) { console.error('usage: p4_frame_shots.js <outDir>'); process.exit(2); } fs.mkdirSync(out, { recursive: true });
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), data = {};
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const set = async (id, v) => { await ev(({ id, v }) => { const c = document.querySelector('#' + id); if (!c) throw new Error('no control ' + id); if (c.value !== String(v)) { c.value = v; c.dispatchEvent(new Event('input')); c.dispatchEvent(new Event('change')); } }, { id, v }); await a.idle(); };
  const frame = async (on) => { await ev((on) => { const c = document.querySelector('#t-stageFrameNb'); if (c.checked !== on) { c.checked = on; c.dispatchEvent(new Event('change')); } }, on); await a.idle(); await a.idle(); };
  for (const cs of [{ id: 's1', ex: 'perfil_s1' }, { id: 'r21_default9', ex: 'dac_stage', room: 21 }]) {
    await page.click(`#examples button[data-id="${cs.ex}"]`); await a.idle(); await a.idle();
    if (cs.room) { await set('s-roomsMinCore', 20); await set('s-rRadius', 9); await set('s-minPlateau', 5); await set('s-terraces', 9); await set('stageHeight', 'up'); await ev((r) => window.__evo.stageSetRooms([r]), cs.room); await a.idle(); await a.idle(); }
    const path0 = await ev(() => { const S = window.__evo.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [S.ox + (t % S.W), S.oy + ((t / S.W) | 0)]); });
    const N = path0.length, ks = [0, 4, 8].map((i) => path0[Math.floor(i * (N - 1) / 8 + 0.5)]);
    data[cs.id] = { ks, pathLen: N, treatment: await ev(() => document.querySelector('#stageHeight').value) };
    const shot = async (name) => { const hs = []; for (const [q, k] of ks.entries()) { await ev(({ k }) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x: k[0] + 0.5, y: k[1] + 0.5 }; e.redraw(); }, { k }); await a.idle(); const b = await (await page.$('#stage canvas')).screenshot({ path: path.join(out, `${cs.id}_${name}_k${[0, 4, 8][q]}.png`) }); hs.push(sha(b)); } return hs; };
    await frame(false); const off1 = await shot('hoy'); await frame(true);
    data[cs.id].frame = await ev(() => { const S = window.__evo.S(), f = S.frameNb; return f ? { neighbours: f.ids, skipTiles: f.tiles, rooms: f.rooms } : null; });
    const on = await shot('vecinos'); await frame(false); const off2 = await shot('hoy2');
    data[cs.id].hashes = { off1, on, off2 }; data[cs.id].offIdentical = JSON.stringify(off1) === JSON.stringify(off2); data[cs.id].onDiffers = on.map((h, i) => h !== off1[i]);
    console.log(cs.id, JSON.stringify(data[cs.id].frame), 'off identical after toggling', data[cs.id].offIdentical, 'on differs', data[cs.id].onDiffers);
  }
  data.pageErrors = a.errs.length; fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 1)); console.log('page errors', a.errs.length); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
