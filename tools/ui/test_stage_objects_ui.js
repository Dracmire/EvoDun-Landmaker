/* STAGE OBJECTS (mode 3, PR S4a) in the viewer: the checkbox "Stage objects" of the window example `dac_stage` and the declared billboards (`objects` of the example, src/objects.js).
   (1) the control: greyed in a legacy example, enabled in dac_stage, starts off, a main control of mode 3 only; (2) off = the identical pixels, on changes them, and the shape is NOT rebuilt (the same S and S.cache objects, S.fine / S.levelH identical, the walkable footprint keeps every height);
   (3) the declared list obeys the placement rules (walkable, outside the 3 columns of every transition and 2 tiles from their bottom / top tiles) and the rule check FAILS for an object put on a step (mutation objectOnStair);
   (4) the height is hH x the hero's pixels at that depth (hero put on the object's tile, camera frozen), for tilesPerH 2 / 2.5 / 3, at different depths; mutations tilesNotH, constSize; the line width scales (constStroke);
   (5) ONE depth order with the hero (the hero on tile (62, 38), a 3 H pillar on the tile toward the camera; pixel at the hero's centre: an object nearer than the hero covers it; heroAlwaysTop FAILS); (6) a base that is hidden behind higher terrain is not drawn (ignoreHidden FAILS);
   (7) the manifest key `viewer.stage.objects` (written only when on, absent = off); (8) the state ends with the window session on EVERY exit (mode selector, legacy examples, dac_stage again, images with and without a manifest), mutation skipObjectsEnd.
     NODE_PATH=$(npm root -g) node tools/ui/test_stage_objects_ui.js */
const crypto = require('crypto'), fs = require('fs'), os = require('os'), path = require('path');
const { open, mapFile } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 700)); } };
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), idle = () => a.idle();
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await idle(); };
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await idle(); };
  const objs = async (on) => { const cur = await ev(() => window.__evo.st.stage.objects === 'on'); if (cur !== on) { await page.click('#t-stageObjects'); await idle(); } };
  const pix = async () => crypto.createHash('sha1').update(await a.canvas()).digest('hex');
  const STATE = () => ev(() => { const e = window.__evo; return { obj: e.st.stage.objects, list: e.st.stage.objectList.length, cb: document.querySelector('#t-stageObjects') ? document.querySelector('#t-stageObjects').checked : null, drawn: e.O.objects ? 'yes' : null, win: !!e.st.win }; });
  // (1) the control
  await setMode('stage'); await clickEx('x4_stage');
  const c1 = await ev(() => { const s = document.querySelector('#t-stageObjects'); return s ? { dis: s.disabled } : null; });
  ok('the checkbox exists in mode 3 and is greyed in a legacy example (no window): requirement stageWin', c1 && c1.dis === true, c1);
  await clickEx('dac_stage');
  const c2 = await ev(() => { const s = document.querySelector('#t-stageObjects'); return { dis: s.disabled, on: s.checked, n: window.__evo.st.stage.objectList.length, kinds: [...new Set(window.__evo.st.stage.objectList.map((q) => q.kind))].sort().join() }; });
  ok(`in dac_stage it is enabled and starts off; the example declares ${c2.n} objects (kinds ${c2.kinds})`, !c2.dis && !c2.on && c2.n === 10 && c2.kinds === 'banner,lamp,landmark,pillar,shrub', c2);
  ok('stageObjects is a main control of mode 3 only', (await ev(() => window.EVO.modes.MODES.filter((x) => x.main.includes('stageObjects')).map((x) => x.id))).join() === 'stage');
  // (2) off = identical pixels; on changes them; S is not rebuilt
  const p0 = await pix(), S0 = await ev(() => { const e = window.__evo, S = e.S(), tiles = []; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i])) tiles.push(+S.levelH[S.fine[i]].toFixed(6)); window.__S0 = S; window.__C0 = S.cache; let h = 7; for (let i = 0; i < S.n; i++) h = (h * 31 + S.fine[i]) % 1000000007; for (const v of S.levelH) h = (h * 31 + Math.round(v * 1e4)) % 1000000007; return { h, tiles: tiles.join(',') }; });
  await objs(true); const p1 = await pix();
  const S1 = await ev(() => { const e = window.__evo, S = e.S(), tiles = []; for (let i = 0; i < S.n; i++) if (!S.block[i] && !(S.void && S.void[i])) tiles.push(+S.levelH[S.fine[i]].toFixed(6)); let h = 7; for (let i = 0; i < S.n; i++) h = (h * 31 + S.fine[i]) % 1000000007; for (const v of S.levelH) h = (h * 31 + Math.round(v * 1e4)) % 1000000007; return { same: S === window.__S0, sameCache: S.cache === window.__C0, h, tiles: tiles.join(','), stats: e.O.objects.stats.map((s) => ({ kind: s.kind, hH: s.hH, visible: s.visible, drawn: s.drawn })) }; });
  ok('on: the picture changes and the shape is NOT rebuilt (the same S and S.cache objects; S.fine and S.levelH identical; every footprint tile keeps its height)', p1 !== p0 && S1.same && S1.sameCache && S1.h === S0.h && S1.tiles === S0.tiles, { same: S1.same, cache: S1.sameCache, h: [S0.h, S1.h] });
  const nd = S1.stats.filter((s) => s.drawn).length; ok(`at the start ${nd} of ${S1.stats.length} objects are drawn (the others are off the panel or behind higher terrain); the 1 H reference banner is among them`, nd >= 4 && S1.stats.some((s) => s.kind === 'banner' && s.hH === 1 && s.drawn), S1.stats);
  await objs(false); const p2 = await pix(); ok('off again: the identical pixels of the start (objects off = no change)', p2 === p0);
  // (3) placement rules
  const RULES = (list) => ev((list) => { const e = window.__evo, S = e.S(), W = S.W, H = S.H, E = window.EVO, bad = [], foot = new Set(), bt = [];
    for (const r of S.stairs) { for (const st of r.steps) for (const t of st.tiles) foot.add(t); for (const t of r.bottom) { foot.add(t); bt.push(t); } for (const t of r.top) { foot.add(t); bt.push(t); } }
    list.forEach((q, k) => { const x = Math.floor(q.x - S.ox), y = Math.floor(q.y - S.oy), i = y * W + x; if (!E.objects.KINDS[q.kind]) bad.push([k, 'kind']); if (q.kind === 'landmark') { if (E.checkLandmark(q)) bad.push([k, 'landmark parameters']); } else if (!(q.hH > 0)) bad.push([k, 'hH']); /* S4c: a landmark entry has no hH, its height comes from its own parameters, validated by E.checkLandmark */
      if (x < 0 || y < 0 || x >= W || y >= H) { bad.push([k, 'window']); return; } if (S.block[i] || (S.void && S.void[i]) || !(S.region[i] >= 0) || (S.nowalk && S.nowalk[i])) bad.push([k, 'walkable']); if (foot.has(i)) bad.push([k, 'stair columns']);
      for (const t of bt) if (Math.max(Math.abs((t % W) - x), Math.abs(((t / W) | 0) - y)) < 2) { bad.push([k, 'bottom/top']); break; } });
    return bad; }, list);
  const L0 = await ev(() => window.__evo.st.stage.objectList.map((q) => Object.assign({}, q)));
  const bad0 = await RULES(L0); ok(`the ${L0.length} declared objects obey the rules: walkable tiles, outside the 3 columns of every transition, >= 2 tiles from their bottom / top tiles, known kind, hH > 0`, bad0.length === 0, bad0);
  const onStep = await ev(() => { const S = window.__evo.S(), r = S.stairs[0], t = r.steps[1].tiles[1]; return { kind: 'banner', x: (t % S.W) + S.ox + 0.5, y: ((t / S.W) | 0) + S.oy + 0.5, hH: 1 }; });
  const badM = await RULES([...L0, onStep]); ok('MUTATION objectOnStair (an object put on the middle column of a step): the placement rules FAIL', badM.length > 0 && badM.some((b) => b[1] === 'stair columns'), badM);
  const flank = L0.filter((q) => q.kind === 'lamp').length; ok(`${flank} lamps are declared, two of them flanking the transition next to the hero start`, flank >= 2);
  // (4) the height in H, with the camera frozen and the hero put on each object's tile
  await objs(true);
  const heightProbe = async (tp, mut) => { if (tp !== (await ev(() => window.__evo.st.stage.tilesPerH))) { await a.slider('tilesPerH', tp); await idle(); }
    await ev((mut) => { window.EVO.objectsTest = mut ? { [mut]: true } : undefined; const e = window.__evo; e.st.follow = false; e.redraw(); }, mut); await idle();
    const names = [[58.5, 117.5], [59.5, 119.5], [45.5, 132.5], [66.5, 117.5]], out = [];
    for (const [x, y] of names) { await ev(([x, y]) => { const e = window.__evo; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await idle();
      out.push(await ev(([x, y]) => { const e = window.__evo, st = e.O.objects.stats.find((s) => s.x === x && s.y === y); return st ? { kind: st.kind, hH: st.hH, hpx: st.hpx, drawn: st.drawn, lw: st.lw, k: st.k, hero: e.O.hero.stats.hpx } : null; }, [x, y])); }
    await ev(() => { window.EVO.objectsTest = undefined; }); return out; };
  for (const tp of [2, 2.5, 3]) { const r = await heightProbe(tp, null); const good = r.every((q) => q && Math.abs(q.hpx / (q.hH * q.hero) - 1) <= 0.01);
    ok(`tilesPerH ${tp}: the height of each object = hH x the hero's pixels at its depth (${r.map((q) => q ? q.kind + ' ' + q.hH + ' H: ' + (q.hpx / q.hero).toFixed(2) + ' hero heights' : 'missing').join('; ')})`, good, r); }
  { const r = await heightProbe(2, 'tilesNotH'); ok('MUTATION tilesNotH (the height in tiles): the height check FAILS', !r.every((q) => q && Math.abs(q.hpx / (q.hH * q.hero) - 1) <= 0.01)); }
  { const r = await heightProbe(2, 'constSize'); ok('MUTATION constSize (a constant screen size): the depth check FAILS (the objects are at different depths)', !r.every((q) => q && Math.abs(q.hpx / (q.hH * q.hero) - 1) <= 0.01)); }
  { const r = await heightProbe(2, null); const g = r.every((q) => q && Math.abs(q.lw / q.k - 1.6) < 1e-6); ok(`the line width scales with the depth like the hero: lw / k = 1.6 for every object (k from ${Math.min(...r.map((q) => q.k)).toFixed(2)} to ${Math.max(...r.map((q) => q.k)).toFixed(2)})`, g && Math.max(...r.map((q) => q.k)) - Math.min(...r.map((q) => q.k)) > 0.1, r);
    const m = await heightProbe(2, 'constStroke'); ok('MUTATION constStroke (a constant line width): the stroke check FAILS', !m.every((q) => q && Math.abs(q.lw / q.k - 1.6) < 1e-6)); }
  // (5) one depth order with the hero: a tall pillar one tile nearer than the hero covers the pixel at the hero's centre
  const orderProbe = async (mut) => ev(async (mut) => { const E = window.EVO, e = window.__evo; window.EVO.objectsTest = mut ? { [mut]: true } : undefined; e.st.follow = false;
    const S = e.S(); const hx = 62.5, hy = 117.5; e.st.hero = { x: hx, y: hy };
    // the pillar one tile toward the camera (yaw 180: smaller y) in the hero's column: tile (62, 37) has a visible base (measured), the hero stands on (62, 38) behind it
    const cands = [{ kind: 'pillar', x: hx, y: hy - 1, hH: 3 }]; e.st.stage.objectList = cands; e.redraw(); return 1; }, mut);
  const pixelAtHero = () => ev(() => { const e = window.__evo, S = e.S(), E = window.EVO, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = e.st.persH || cv.clientHeight, cam = E.makeCam(S, e.P, e.view(), w, h), hw = { x: e.st.hero.x - S.ox, y: e.st.hero.y - S.oy }, i = E.stage.cellOf(S, hw.x, hw.y), feet = E.stage.feetH(S, i), c = cam.p(hw.x, hw.y, feet + 0.5 * e.st.stage.tilesPerH), d = cv.getContext('2d').getImageData(Math.round(c[0]), Math.round(c[1]), 1, 1).data; return { rgb: [d[0], d[1], d[2]], stats: e.O.objects.stats.map((s) => ({ visible: s.visible, drawn: s.drawn, ry: s.ry })) }; });
  await a.slider('tilesPerH', 2); await idle(); await orderProbe(null); await idle(); const po = await pixelAtHero();
  const near = (rgb, t) => Math.abs(rgb[0] - t[0]) + Math.abs(rgb[1] - t[1]) + Math.abs(rgb[2] - t[2]) <= 30;
  ok(`an object nearer than the hero covers it: the pixel at the hero's centre is the pillar's stone colour (${po.rgb.join(',')}), not the hero's pink`, po.stats.some((s) => s.drawn) && near(po.rgb, [185, 178, 166]), po);
  await orderProbe('heroAlwaysTop'); await idle(); const pm = await pixelAtHero(); ok(`MUTATION heroAlwaysTop (the hero last, as before S4a): the pixel is the hero's pink (${pm.rgb.join(',')}): the order check FAILS`, near(pm.rgb, [255, 79, 163]) && !near(pm.rgb, [185, 178, 166]), pm);
  await ev(() => { window.EVO.objectsTest = undefined; });
  // (6) a hidden base is not drawn: the tile 3 aside of the hero start (x 64.5) is in a pit behind the rim, inside the panel
  const hidProbe = async (mut) => { await ev((mut) => { window.EVO.objectsTest = mut ? { [mut]: true } : undefined; const e = window.__evo; e.st.hero = { x: 61.5, y: 117.5 }; e.st.stage.objectList = [{ kind: 'banner', x: 64.5, y: 117.5, hH: 1 }]; e.redraw(); }, mut); await idle(); return ev(() => { window.EVO.objectsTest = undefined; const s = window.__evo.O.objects.stats[0], cv = document.querySelector('#stage canvas'); return { visible: s.visible, drawn: s.drawn, onPanel: s.base[0] >= 0 && s.base[0] < cv.clientWidth && s.base[1] >= 0 && s.base[1] < cv.clientHeight }; }); };
  { const r = await hidProbe(null); ok('a base hidden behind higher terrain (on the panel) is NOT drawn', r.onPanel && !r.visible && !r.drawn, r); const m = await hidProbe('ignoreHidden'); ok('MUTATION ignoreHidden (draw it anyway): the hidden-base check FAILS', m.drawn === true, m); }
  // (7) the manifest key
  { const m = await ev(() => { const e = window.__evo, b0 = e.viewerBlock().stage; e.st.stage.objects = 'off'; const b1 = e.viewerBlock().stage; e.st.stage.objects = 'on'; const b2 = e.viewerBlock().stage; return { off: 'objects' in b1, on: b2.objects, was: b0.objects }; });
    ok('manifest: viewer.stage.objects is written only when on', m.off === false && m.on === 'on', m);
    const l = await ev(() => { const e = window.__evo; e.applyViewerBlock({ mode: 'stage', stage: { objects: 'on' } }); const a1 = e.st.stage.objects, l1 = e.st.stage.objectList.length; e.applyViewerBlock({ mode: 'stage', stage: {} }); const a2 = e.st.stage.objects; e.applyViewerBlock({ mode: 'stage', stage: { objects: 'maybe' } }); return { a1, l1, a2, a3: e.st.stage.objects }; });
    ok('manifest load: a value is kept (inert: the load ends the window session), absent = off, an unknown one = off, the list is never loaded', l.a1 === 'on' && l.l1 === 0 && l.a2 === 'off' && l.a3 === 'off', l); }
  // (8) the state ends with the window session on EVERY exit
  const enterOn = async () => { await setMode('stage'); await clickEx('dac_stage'); await objs(true); };
  const exits = { 'the mode selector (mode 1)': async () => { await setMode('terrain'); }, 'a mode 2 example': async () => { await setMode('rooms'); }, 'a legacy example of mode 3': async () => { await clickEx('x4_stage'); }, 'dac_stage pressed again': async () => { await clickEx('dac_stage'); } };
  const exitRun = async (go, mut) => { await enterOn(); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut); const before = await STATE(); await go(); const r = await STATE(); await ev(() => { window.EVO.modesTest = null; }); return Object.assign({ before }, r); };
  for (const [name, go] of Object.entries(exits)) { const r = await exitRun(go, null); ok(`EXIT through ${name}: objects on (${r.before.obj}, ${r.before.list} declared) -> ${r.obj}, list ${r.list}, checkbox ${r.cb}, nothing drawn`, r.before.obj === 'on' && r.obj === 'off' && r.list === (name === 'dac_stage pressed again' ? 10 : 0) && r.cb === false && r.drawn === null, r); }
  { const r = await exitRun(exits['a mode 2 example'], 'skipObjectsEnd'); ok(`MUTATION skipObjectsEnd: leaving to mode 2 keeps the state (${r.obj}, ${r.list} declared): the exit check FAILS`, r.obj === 'on' || r.list > 0, r); }
  const loadRun = async (withManifest, mut) => { await enterOn(); await ev((f) => { window.EVO.modesTest = f ? { [f]: true } : null; }, mut);
    const files = ['height', 'zones', 'edges'].map((n) => mapFile('maps', n)); let mp = null; const e0 = a.errs.length;
    if (withManifest) { mp = path.join(os.tmpdir(), 'objstate_' + process.pid + '_' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(mp, JSON.stringify({ format: 'evodun-pack/0.3', name: 'objects end', roles: { elevation: { image: 'height.png', channel: 'V' } }, viewer: { mode: 'stage', camera: 'stage' } })); }
    await page.setInputFiles('#file', mp ? [...files, mp] : files); await page.waitForTimeout(3000); await idle(); await ev(() => { window.EVO.modesTest = null; }); if (mp) fs.unlinkSync(mp);
    return Object.assign(await STATE(), { errs: a.errs.slice(e0) }); };
  { const r = await loadRun(true, null), r2 = await loadRun(false, null);
    ok(`EXIT through the load of images + a manifest: objects ${r.obj}, list ${r.list}, checkbox ${r.cb}, nothing drawn, page errors ${r.errs.length}`, r.obj === 'off' && r.list === 0 && r.cb === false && r.drawn === null && r.errs.length === 0, r);
    ok(`EXIT through the load of images alone: objects ${r2.obj}, list ${r2.list}, checkbox ${r2.cb}, nothing drawn, page errors ${r2.errs.length}`, r2.obj === 'off' && r2.list === 0 && r2.cb === false && r2.drawn === null && r2.errs.length === 0, r2);
    const rm = await loadRun(false, 'skipObjectsEnd'); ok(`MUTATION skipObjectsEnd: the load keeps the state (${rm.obj}, ${rm.list} declared): the load check FAILS`, rm.obj === 'on' || rm.list > 0, rm); }
  ok('no page errors', a.errs.length === 0, a.errs);
  await a.browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
