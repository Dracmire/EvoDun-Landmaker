/* STAGE VOLUMES (mode 3, PR S4b) in the viewer: the checkbox "Stage volumes" of the window example `dac_stage` and the declared `volumes` list (src/volumes.js).
   (1) the control: greyed in a legacy example, enabled in dac_stage, starts off, a main control of mode 3 only; (2) off = the identical pixels and the identical S (hash of S.fine / S.levelH), on REBUILDS the shape (a new S object) and the walkable footprint keeps every height (mutation touchFootprint);
   (3) the height in H over the nearest walkable ground for tilesPerH 2 / 2.5 / 3 on the 0.25 H grid (mutation tilesNotH); (4) only blocked tiles: the example list omits nothing with the border off, a list that steps on walkable tiles omits them with the reason (mutation volumeOnWalkable); the margin (no blocked tile of dac_stage lies within 2 tiles of a transition: the
   limit case is tools/test_volumes.js); (5) THE OCCLUSION CRITERION: no walkable tile (>= 200 px visible without volumes) loses more than 25 % of its pixels TO A VOLUME (pixels that, with them on, belong to a tile a volume raised), measured on the pick buffer (the Box id render) at the example's Cam 6, 21 hero positions (11 chosen + 10 spread evenly over the walkable list), yaw 180 (enforced; the worst case is printed every time) and yaw 0 / 90 / 270 (measured), border off / island / quebrada, with the objects on; a control list with a volume in front of the hero FAILS the check (mutation hideWalkable); (6) the rebuild cost (ms, recorded); deterministic; (7) the S4a objects: the same objects are drawn with volumes on and none stands inside a volume; (8) the manifest key `viewer.stage.volumes`; (9) the state ends with the window session on EVERY exit (mutation skipVolumesEnd) and does not leak from a scene with volumes + objects + border on.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_volumes_ui.js */
const crypto = require('crypto'), fs = require('fs'), os = require('os'), path = require('path');
const { open, mapFile } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const vols = async (on) => { const cur = await ev(() => window.__evo.st.stage.volumes === 'on'); if (cur !== on) { await page.click('#t-stageVolumes'); await idle(); } };
  const objs = async (on) => { const cur = await ev(() => window.__evo.st.stage.objects === 'on'); if (cur !== on) { await page.click('#t-stageObjects'); await idle(); } };
  const border = async (v) => { await ev((v) => { const s = document.querySelector('#stageBorder'); s.value = v; s.dispatchEvent(new Event('change')); }, v); await idle(); };
  const pix = async () => crypto.createHash('sha1').update(await a.canvas()).digest('hex');
  const redraw = async () => { await ev(() => window.__evo.draw()); await idle(); };
  const SH = () => ev(() => { const e = window.__evo, S = e.S(); let h = 7; for (let i = 0; i < S.n; i++) h = (h * 31 + S.fine[i]) % 1000000007; for (const v of S.levelH) h = (h * 31 + Math.round(v * 1e6)) % 1000000007; return h; }); // the shape: S.fine and S.levelH
  const FOOT = () => ev(() => { const S = window.__evo.S(), t = []; let h = 7; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i])) h = (h * 31 + Math.round(S.levelH[S.fine[i]] * 1e6)) % 1000000007; return h; }); // the heights of the walkable footprint only
  const STATE = () => ev(() => { const e = window.__evo; return { vol: e.st.stage.volumes, list: e.st.stage.volumeList.length, cb: document.querySelector('#t-stageVolumes') ? document.querySelector('#t-stageVolumes').checked : null, info: !!(e.S() && e.S().stageVolumes), border: e.st.stage.border, obj: e.st.stage.objects, win: !!e.st.win }; });
  // (1) the control
  await setMode('stage'); await clickEx('x4_stage');
  const c1 = await ev(() => { const s = document.querySelector('#t-stageVolumes'); return s ? { dis: s.disabled } : null; });
  ok('the checkbox exists in mode 3 and is greyed in a legacy example (no window): requirement stageWin', c1 && c1.dis === true, c1);
  await clickEx('dac_stage');
  const c2 = await ev(() => { const s = document.querySelector('#t-stageVolumes'); return { dis: s.disabled, on: s.checked, n: window.__evo.st.stage.volumeList.length }; });
  ok(`in dac_stage it is enabled and starts off; the example declares ${c2.n} volumes`, !c2.dis && !c2.on && c2.n === 5, c2);
  ok('stageVolumes is a main control of mode 3 only', (await ev(() => window.EVO.modes.MODES.filter((x) => x.main.includes('stageVolumes')).map((x) => x.id))).join() === 'stage');
  // (2) off = identical; on rebuilds; the footprint is intact
  await ev(() => { const e = window.__evo; e.st.hero = { x: 75.5, y: 140.5 }; e.redraw(); }); await idle(); // the hero beside the far flank (the three volumes of the south edge): the volumes are on the panel
  const p0 = await pix(), sh0 = await SH(), ft0 = await FOOT(); await ev(() => { window.__S0 = window.__evo.S(); });
  const t0 = Date.now(); await vols(true); const rebuildMs = Date.now() - t0, p1 = await pix(), sh1 = await SH(), ft1 = await FOOT();
  const I1 = await ev(() => { const S = window.__evo.S(), v = S.stageVolumes; return { fresh: S !== window.__S0, tiles: v.tiles, skipped: v.skipped, added: v.levelsAdded, per: v.volumes.map((q) => q.tiles) }; });
  console.log(`rebuild on toggle (click + idle, headless): ${rebuildMs} ms; ${I1.tiles} tiles, +${I1.added} levels, per volume ${I1.per.join('/')}`);
  ok('on: the picture changes and the shape IS rebuilt (a new S object; S.fine / S.levelH differ), the walkable footprint keeps every height', p1 !== p0 && I1.fresh && sh1 !== sh0 && ft1 === ft0, { fresh: I1.fresh, sh: [sh0, sh1], ft: [ft0, ft1] });
  ok(`the example list places ${I1.tiles} tiles (4 volumes of ${I1.per.slice(0, 4).join(' / ')} tiles + ${I1.per[4]}) and, with the border off, OMITS NOTHING (skipped ${I1.skipped.length})`, I1.tiles === 12 + 4 + 6 + 8 + 9 && I1.skipped.length === 0, { per: I1.per, sk: I1.skipped.slice(0, 5) });
  await vols(false); const p2 = await pix(), sh2 = await SH(); ok('off again: the identical pixels and the identical shape (S.fine / S.levelH hash) of the start', p2 === p0 && sh2 === sh0 && (await ev(() => !window.__evo.S().stageVolumes)));
  await ev(() => { window.EVO.volumesTest = { touchFootprint: true }; }); await vols(true); const ftM = await FOOT(); ok('MUTATION touchFootprint (a footprint tile raised): the footprint check FAILS', ftM !== ft0);
  await ev(() => { window.EVO.volumesTest = undefined; }); await vols(false);
  // (3) the height in H over the nearest walkable ground, for tilesPerH 2 / 2.5 / 3
  const HEIGHT = () => ev(() => { const e = window.__evo, S = e.S(), tph = e.st.stage.tilesPerH, out = [];
    e.st.stage.volumeList.forEach((v, k) => { const x0 = v.x - S.ox, y0 = v.y - S.oy, cx = x0 + (Math.floor(v.w) >> 1), cy = y0 + (Math.floor(v.d) >> 1); let best = 1e9, hs = new Set();
      for (let i = 0; i < S.n; i++) { if (S.block[i] || (S.void && S.void[i])) continue; const dd = Math.max(Math.abs((i % S.W) - cx), Math.abs(((i / S.W) | 0) - cy)); if (dd < best) { best = dd; hs = new Set(); } if (dd === best) hs.add(+S.levelH[S.fine[i]].toFixed(6)); }
      const roof = +S.levelH[S.fine[(y0 + (Math.floor(v.d) >> 1)) * S.W + x0 + (Math.floor(v.w) >> 1)]].toFixed(6), hg = Math.floor(v.hH / 0.25 + 1e-9) * 0.25; out.push({ k, hH: v.hH, hg, ok: [...hs].some((d) => Math.abs((roof - d) / tph - hg) < 0.02), dH: [...hs].map((d) => +((roof - d) / tph).toFixed(3)) }); }); return out; });
  for (const tp of [2, 2.5, 3]) { if (tp !== (await ev(() => window.__evo.st.stage.tilesPerH))) { await a.slider('tilesPerH', tp); await idle(); } await vols(true); const r = await HEIGHT();
    ok(`tilesPerH ${tp}: every volume's roof = the nearest walkable ground + hH H on the 0.25 H grid (${r.map((q) => q.hH + ' H -> ' + q.dH.join('|')).join('; ')})`, r.length === 5 && r.every((q) => q.ok), r);
    if (tp === 3) { await ev(() => { window.EVO.volumesTest = { tilesNotH: true }; }); await redraw(); const m = await HEIGHT(); ok('MUTATION tilesNotH (the height in tiles) at tilesPerH 3: the height check FAILS', !m.every((q) => q.ok), m); await ev(() => { window.EVO.volumesTest = undefined; }); } }
  await a.slider('tilesPerH', 2); await idle(); await vols(false);
  // (4) only blocked tiles; the margin
  { await ev(() => { window.__evo.st.stage.volumeList = [{ x: 70, y: 112, w: 3, d: 2, hH: 1 }, { x: 22, y: 136, w: 2, d: 1, hH: 1 }]; }); await vols(true); const r = await ev(() => { const v = window.__evo.S().stageVolumes, rs = {}; for (const s of v.skipped) rs[s.reason] = (rs[s.reason] || 0) + 1; const S = window.__evo.S(); let wk = 0; for (let y = 112; y < 114; y++) for (let x = 70; x < 73; x++) if (!S.block[(y - S.oy) * S.W + (x - S.ox)]) wk++; return { tiles: v.tiles, rs, wk }; });
    ok(`a list that steps on walkable tiles omits them with the reason: ${JSON.stringify(r.rs)}, and the block 3 tiles from the nearest transition ((22, 136): the nearest blocked tile) is placed`, r.wk > 0 && r.rs.walkable === r.wk && r.tiles === 6 - r.wk + 2 && Object.keys(r.rs).length === 1, r);
    const f1 = await FOOT(); await ev(() => { window.EVO.volumesTest = { volumeOnWalkable: true }; }); await redraw(); const f2 = await FOOT(); ok('MUTATION volumeOnWalkable (walkable tiles accepted): the footprint check FAILS', f1 === ft0 && f2 !== ft0, [f1, f2, ft0]); await ev(() => { window.EVO.volumesTest = undefined; });
    const dmin = await ev(() => { const S = window.__evo.S(), foot = []; for (const r of S.stairs) { for (const st of r.steps) for (const t of st.tiles) foot.push(t); for (const t of r.bottom) foot.push(t); for (const t of r.top) foot.push(t); } let m = 99; for (let i = 0; i < S.n; i++) if (S.block[i] && !(S.void && S.void[i])) for (const f of foot) m = Math.min(m, Math.max(Math.abs((f % S.W) - (i % S.W)), Math.abs(((f / S.W) | 0) - ((i / S.W) | 0)))); return m; });
    ok(`the margin: no blocked tile of dac_stage is within 2 tiles of a transition (nearest ${dmin}), so the example list never meets it (the limit case: tools/test_volumes.js)`, dmin === 3, dmin);
    await vols(false); await ev(() => { window.__evo.st.stage.volumeList = [{ x: 50, y: 147, w: 6, d: 2, hH: 1 }, { x: 85, y: 147, w: 2, d: 2, hH: 3 }, { x: 66, y: 147, w: 6, d: 1, hH: 2 }, { x: 30, y: 132, w: 4, d: 2, hH: 1 }, { x: 60, y: 152, w: 3, d: 3, hH: 2 }]; }); }
  const LIST = await ev(() => window.__evo.st.stage.volumeList.map((q) => Object.assign({}, q)));
  // (5) the occlusion invariant on the pick buffer
  const HER = [[61.5, 117.5], [45.5, 125.5], [50.5, 143.5], [90.5, 124.5], [85.5, 115.5], [27.5, 130.5], [24.5, 133.5], [70.5, 140.5], [75.5, 142.5], [85.5, 139.5], [66.5, 141.5]], MINPX = 200, MAXLOSS = 0.25;
  // 10 walkable tiles spread evenly over the walkable list (deterministic), added to the 11 positions above
  const SPREAD = await ev(() => { const S = window.__evo.S(), l = []; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i]) && S.region && S.region[i] >= 0 && !(S.nowalk && S.nowalk[i])) l.push(i); const st = Math.floor(l.length / 10), out = []; for (let k = 0; k < 10; k++) { const i = l[k * st + (st >> 1)]; out.push([(i % S.W) + S.ox + 0.5, ((i / S.W) | 0) + S.oy + 0.5]); } return out; });
  const HER21 = HER.concat(SPREAD);
  // the id render of the current frame: one code per pixel (kind << 20 | tile or level; -1 = no opaque pixel). kinds: 2 wall and 4 cap of a tile, 3 ramp
  await ev(() => { window.__codes = () => { const e = window.__evo, E = window.EVO, S = e.S(), cv = document.querySelector('#stage canvas'), w = cv.clientWidth, hh = e.st.persH || cv.clientHeight, D = E.pickBuffer(S, e.P, e.view(), w, hh).data, o = new Int32Array(w * hh); for (let q = 0; q < o.length; q++) o[q] = D[q * 4 + 3] === 255 ? (D[q * 4] << 16) | (D[q * 4 + 1] << 8) | D[q * 4 + 2] : -1; return o; };
    window.__attr = (k) => { const e = window.__evo, S = e.S(), B = window.__B[k], O = window.__codes(), W = S.W, walk = (i) => i < S.n && !S.block[i] && !(S.void && S.void[i]), vl = e.st.stage.volumeList, vi = (U) => { const x = (U % W) + S.ox, y = ((U / W) | 0) + S.oy; return vl.findIndex((v) => x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.d); }, base = {}, lost = {};
      for (let q = 0; q < B.length; q++) { const b = B[q]; if (b < 0) continue; const kb = b >> 20, T = b & 0xfffff; if (!((kb === 4 || kb === 3) && walk(T))) continue; base[T] = (base[T] || 0) + 1; const o = O[q]; if (o < 0) continue; const ko = o >> 20, U = o & 0xfffff; if ((ko === 4 || ko === 3 || ko === 2) && U < S.n && S.levelMeta[S.fine[U]] && S.levelMeta[S.fine[U]].vol) { const key = T + ':' + vi(U); lost[key] = (lost[key] || 0) + 1; } }
      const per = {}; for (const [key, n] of Object.entries(lost)) { const [T, v] = key.split(':'); per[T] = per[T] || { n: 0, byVol: {} }; per[T].n += n; per[T].byVol[v] = (per[T].byVol[v] || 0) + n; }
      const items = []; let tiles = 0; for (const [T, c] of Object.entries(base)) { if (c < 200) continue; tiles++; const p = per[T]; if (p) items.push({ T: +T, x: (T % W) + S.ox, y: ((T / W) | 0) + S.oy, base: c, frac: p.n / c, vol: +Object.entries(p.byVol).sort((x, y) => y[1] - x[1])[0][0] }); }
      return { tiles, items }; }; });
  const shootAt = async (h, yaw) => { await ev(([h, yaw]) => { const e = window.__evo; e.st.hero = { x: h[0], y: h[1] }; e.st.stage.yaw = yaw; e.st.follow = true; e.redraw(); }, [h, yaw]); await idle(); };
  // the loss ATTRIBUTED TO A VOLUME: pixels of a walkable tile (>= 200 px visible without volumes) that, with them on, belong to a tile a volume raised (its cap or its walls); the camera moves < 1 px when the volumes change view().zoom / fitSc, which the raw pixel count mistook for occlusion
  const occl = async (yaw, hs) => { await vols(false); await ev(() => { window.__B = []; }); for (let k = 0; k < hs.length; k++) { await shootAt(hs[k], yaw); await ev((k) => { window.__B[k] = window.__codes(); }, k); }
    await vols(true); let tiles = 0, all = []; for (let k = 0; k < hs.length; k++) { await shootAt(hs[k], yaw); const r = await ev((k) => window.__attr(k), k); tiles += r.tiles; for (const it of r.items) all.push(Object.assign({ hero: hs[k].join() }, it)); }
    await vols(false); all.sort((p, q) => q.frac - p.frac); return { tiles, worst: all[0] || null, n2: all.filter((i) => i.frac > 0.02).length, n5: all.filter((i) => i.frac > 0.05).length, n25: all.filter((i) => i.frac > MAXLOSS).length }; };
  const fmt = (r) => `${r.tiles} walkable tiles visible, worst loss to a volume ${r.worst ? (100 * r.worst.frac).toFixed(1) + ' % (tile ' + r.worst.x + ',' + r.worst.y + ', hero ' + r.worst.hero + ', volume ' + r.worst.vol + ')' : '0 %'}, ${r.n2} lose > 2 %, ${r.n5} > 5 %, ${r.n25} > 25 %`;
  await objs(true);
  for (const bd of ['off', 'island', 'quebrada']) { await border(bd); const r = await occl(180, HER21); console.log(`OCCLUSION measured, border ${bd}, yaw 180: ${fmt(r)}`);
    ok(`OCCLUSION, border ${bd}, yaw 180 (the example's Cam 6), objects on, 21 hero positions: no walkable tile (>= ${MINPX} px) loses more than ${100 * MAXLOSS} % of its pixels to a volume (${fmt(r)})`, r.n25 === 0 && r.tiles > 4000, r); }
  await border('off'); for (const yaw of [0, 90, 270]) { const r = await occl(yaw, HER); console.log(`measured, not enforced: yaw ${yaw}, border off, 11 positions: ${fmt(r)}`); }
  { const keep = LIST; await ev(() => { window.__evo.st.stage.volumeList = [{ x: 55, y: 105, w: 6, d: 3, hH: 3 }]; }); const r = await occl(180, HER); ok(`MUTATION hideWalkable (a 3 H volume 12 tiles in front of the hero): the occlusion check FAILS (${fmt(r)})`, r.n25 > 20, r); await ev((l) => { window.__evo.st.stage.volumeList = l; }, keep); }
  await ev(() => { window.__evo.st.stage.yaw = 180; window.__evo.st.hero = { x: 61.5, y: 117.5 }; }); await objs(false);
  // (6) deterministic; (7) the objects
  await vols(true); const d1 = await SH(); await vols(false); await vols(true); const d2 = await SH(); ok('turning it on twice gives the same shape (deterministic)', d1 === d2);
  await vols(false); await objs(true); await redraw(); const o0 = await ev(() => window.__evo.O.objects.stats.map((s) => [s.kind, s.x, s.y, s.visible, s.drawn].join()));
  await vols(true); await redraw(); const o1 = await ev(() => window.__evo.O.objects.stats.map((s) => [s.kind, s.x, s.y, s.visible, s.drawn].join()));
  ok(`S4a objects: with the volumes on the visible / drawn objects equal those with them off (${o0.filter((s) => s.endsWith('true')).length} drawn of ${o0.length})`, JSON.stringify(o0) === JSON.stringify(o1), [o0, o1]);
  const inside = await ev(() => { const e = window.__evo; return e.st.stage.objectList.filter((o) => e.st.stage.volumeList.some((v) => o.x >= v.x && o.x < v.x + v.w && o.y >= v.y && o.y < v.y + v.d)).length; }); ok('no declared object lies inside a declared volume', inside === 0);
  { const t = await ev(() => document.querySelector('#info').textContent); ok('the readout names the volumes (tiles, levels, omitted)', /volumes: 39 tiles, \+\d+ levels, 0 omitted/.test(t), t.slice(0, 300)); }
  await vols(false); await objs(false);
  // (8) the manifest key
  { const m = await ev(() => { const e = window.__evo, b0 = e.viewerBlock().stage; e.st.stage.volumes = 'off'; const b1 = e.viewerBlock().stage; e.st.stage.volumes = 'on'; const b2 = e.viewerBlock().stage; e.st.stage.volumes = 'off'; return { off: 'volumes' in b1, on: b2.volumes }; });
    ok('manifest: viewer.stage.volumes is written only when on', m.off === false && m.on === 'on', m);
    const l = await ev(() => { const e = window.__evo; e.applyViewerBlock({ mode: 'stage', stage: { volumes: 'on' } }); const a1 = e.st.stage.volumes, l1 = e.st.stage.volumeList.length; e.applyViewerBlock({ mode: 'stage', stage: {} }); const a2 = e.st.stage.volumes; e.applyViewerBlock({ mode: 'stage', stage: { volumes: 'maybe' } }); return { a1, l1, a2, a3: e.st.stage.volumes }; });
    ok('manifest load: a value is kept (inert: the load ends the window session), absent = off, an unknown one = off, the list is never loaded', l.a1 === 'on' && l.l1 === 0 && l.a2 === 'off' && l.a3 === 'off', l); }
  // (9) the state ends with the window session on EVERY exit; no leak from a scene with volumes + objects + border on
  const enterOn = async () => { await setMode('stage'); await clickEx('dac_stage'); await border('island'); await objs(true); await vols(true); };
  const exits = { 'the mode selector (mode 1)': async () => { await setMode('terrain'); }, 'a mode 2 example': async () => { await setMode('rooms'); }, 'a legacy example of mode 3': async () => { await clickEx('x4_stage'); }, 'dac_stage pressed again': async () => { await clickEx('dac_stage'); } };
  const exitRun = async (go, mut) => { await enterOn(); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut); const before = await STATE(); await go(); const r = await STATE(); await ev(() => { window.EVO.modesTest = null; }); return Object.assign({ before }, r); };
  for (const [name, go] of Object.entries(exits)) { const r = await exitRun(go, null); ok(`EXIT through ${name}: volumes ${r.before.vol} (${r.before.list} declared, info ${r.before.info}) -> ${r.vol}, list ${r.list}, checkbox ${r.cb}, border ${r.border}, objects ${r.obj}, no volume info ${!r.info}`, r.before.vol === 'on' && r.before.info && r.vol === 'off' && r.list === (name === 'dac_stage pressed again' ? 5 : 0) && r.cb === false && r.border === 'off' && r.obj === 'off' && !r.info, r); }
  { const r = await exitRun(exits['a mode 2 example'], 'skipVolumesEnd'); ok(`MUTATION skipVolumesEnd: leaving to mode 2 keeps the state (${r.vol}, ${r.list} declared): the exit check FAILS`, r.vol === 'on' || r.list > 0, r); }
  const loadRun = async (withManifest, mut) => { await enterOn(); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut);
    const files = ['height', 'zones', 'edges'].map((n) => mapFile('maps', n)); let mp = null; const e0 = a.errs.length;
    if (withManifest) { mp = path.join(os.tmpdir(), 'volstate_' + process.pid + '_' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(mp, JSON.stringify({ format: 'evodun-pack/0.3', name: 'volumes end', roles: { elevation: { image: 'height.png', channel: 'V' } }, viewer: { mode: 'stage', camera: 'stage' } })); }
    await page.setInputFiles('#file', mp ? [...files, mp] : files); await page.waitForTimeout(3000); await idle(); await ev(() => { window.EVO.modesTest = null; }); if (mp) fs.unlinkSync(mp);
    return Object.assign(await STATE(), { errs: a.errs.slice(e0) }); };
  { const r = await loadRun(true, null), r2 = await loadRun(false, null);
    ok(`EXIT through the load of images + a manifest: volumes ${r.vol}, list ${r.list}, checkbox ${r.cb}, no volume info ${!r.info}, page errors ${r.errs.length}`, r.vol === 'off' && r.list === 0 && r.cb === false && !r.info && r.errs.length === 0, r);
    ok(`EXIT through the load of images alone: volumes ${r2.vol}, list ${r2.list}, checkbox ${r2.cb}, no volume info ${!r2.info}, page errors ${r2.errs.length}`, r2.vol === 'off' && r2.list === 0 && r2.cb === false && !r2.info && r2.errs.length === 0, r2);
    const rm = await loadRun(false, 'skipVolumesEnd'); ok(`MUTATION skipVolumesEnd: the load keeps the state (${rm.vol}, ${rm.list} declared): the load check FAILS`, rm.vol === 'on' || rm.list > 0, rm); }
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
