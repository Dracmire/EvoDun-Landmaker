/* DAC v2 PR D (D32): the eight prototypes through the REAL selector, at terH 1 and 3, Cam 1: one click per prototype, the canvas of the viewer and the info line of the host.
     NODE_PATH=$(npm root -g) node tools/ui/shoot_protos.js [--out <dir>] [--cams isoE,oblique] [--terH 1,3]
   Writes <out>/proto_<id>_terH<t>_<cam>.png and <out>/protos.json (the info text of the host Diorama per shot: type, structure, ring, shift, bridges, ascent, flattened tiles, visible / in view / total counts). */
const fs = require('fs'), path = require('path'), { open } = require('./common');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; }, OUT = opt('--out', path.join(__dirname, '../../docs/crystallizers/02-room-types/shots')), CAMS = opt('--cams', 'isoE').split(','), TH = opt('--terH', '1,3').split(',').map(Number);
const IDS = ['cima-leaf', 'cima-corridor', 'arena-leaf', 'arena-corridor', 'isla-leaf', 'isla-corridor', 'quebrada', 'mirador'];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), res = [];
  await ev(() => window.__evo.setMode('rooms')); await a.idle();
  for (const id of IDS) {
    await page.selectOption('#dioProto', id); await a.idle(); await a.idle();
    for (const t of TH) for (const cam of CAMS) {
      if (t !== 1) { await a.slider('terH', t); await a.idle(); await a.idle(); } // the host stays framed only at the first terH of the click: re-frame by choosing the prototype again
      if (t !== 1) { await page.selectOption('#dioProto', 'off'); await a.idle(); await page.selectOption('#dioProto', id); await a.idle(); await a.slider('terH', t); await a.idle(); await a.idle(); }
      if (cam !== 'isoE') { await a.preset(cam); await a.idle(); } // the prototype already sets Cam 1 (isoE) and frames the host: a camera click would reset the framing
      const info = await ev(() => { const e = window.__evo, P = e.P, S = e.S(), T = window.EVO.roomTypes, html = document.querySelector('#info').innerHTML, seg = html.split('<br>').slice(0, 2).join(' | ').replace(/<[^>]+>/g, ''), pr = window.EVO.modes.PROTOS.find((x) => x.id === e.st.dioProto), it = P.dioPlan && P.dioPlan.items.find((q) => q.room === pr.room && q.eligible);
        let st = null; if (it) { const a = T.dioStumps(S, P, it, 0.4), b = T.dioStumps(S, P, it, 0.25), v = e.dioVis(it, { s04: a.stumps, s025: b.stumps }).extra; st = { n04: a.stumps.length, n025: b.stumps.length, vis04: v.s04, vis025: v.s025 }; } return { terH: P.terH, text: seg, stumps: st }; });
      const cv = await page.$('#stage canvas'); const f = `proto_${id}_terH${t}_${cam}.png`; await cv.screenshot({ path: path.join(OUT, f) }); res.push({ id, terH: t, cam, file: f, info: info.text, stumps: info.stumps });
      console.log(f);
    }
  }
  fs.writeFileSync(path.join(OUT, 'protos.json'), JSON.stringify(res, null, 1)); console.log('errors', JSON.stringify(a.errs)); await a.browser.close(); process.exit(a.errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
