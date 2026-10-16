/* The MODES layer (src/modes.js, docs/ui-modes.md, the UI pass PR 1): one mode per crystallizer. Opens the page with the layer ON (open({ modes: true }); every other UI test runs with the test-only flag EVO_NO_MODES).
   Per mode: the default example loads with its camera, technique and compare state; what is visible is exactly what the tables say (main + advanced + common, computed from E.modes.plan, not hard-coded);
   advanced controls (and the terrain controls of the modes that fold them) are folded behind a toggle; every visible disabled control says "Requires: ..."; each MAIN control changes the canvas or the info line on the
   default example (a main control that is disabled at the default example is skipped and reported, not forced); the cameras and techniques outside the mode are hidden; changing the example keeps the mode.
   Also: the state at load is pixel-identical to the panel without modes; the Archived group; the banners; the baked parameters of the Macroform; viewer.mode in the manifest (written on save, applied on load).
   Run: NODE_PATH=$(npm root -g) node tools/ui/test_modes_ui.js */
const crypto = require('crypto'), fs = require('fs'), os = require('os'), path = require('path'), { open } = require('./common');
const PNG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true }), page = a.page, ok = a.ok, ev = (f, x) => page.evaluate(f, x);
  const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
  const NORM = (t) => t.replace(/\d+(\.\d+)? ?ms/g, '# ms'); // the info line carries timings (they differ between runs): not a change of the picture
  const sigOf = (p) => p.evaluate(() => [...document.querySelectorAll('#stage canvas')].filter((c) => !c.closest('figure').hidden).map((c) => c.toDataURL('image/png')).join('|') + '#' + document.querySelector('#info').textContent).then((t) => { const i = t.lastIndexOf('#'); return md5(t.slice(0, i) + '#' + NORM(t.slice(i + 1))); });
  const sig = () => sigOf(page);
  const MODES = await ev(() => window.EVO.modes.MODES.map((m) => ({ id: m.id, number: m.number, group: m.group, banner: m.banner, camera: m.camera, cameras: m.cameras, tech: m.tech, techs: m.techs, compare: m.compare, compareDefault: m.compareDefault, main: m.main, advanced: m.advanced, fixed: m.fixed, terrain: m.terrain, examples: m.examples.map((e) => ({ id: e.id, label: e.label, src: e.src || null, images: !!e.images })) })));
  await a.idle();

  // ---- the state at load: mode 1, Snake Mountain surface, Compare, Cam 3, pixel-identical to the panel without modes
  const st0 = await ev(() => { const e = window.__evo; return { m: e.st.modeId, ex: e.st.exampleId, pack: e.st.pack, preset: e.st.preset, mode: e.st.mode, tech: e.st.tech, n: [...document.querySelectorAll('#stage figure')].filter((f) => !f.hidden).length }; });
  ok('at load: mode 1 Terrain, Snake Mountain surface, Compare (4 panels), Cam 3', st0.m === 'terrain' && st0.ex === 'snake_surface' && st0.pack === 'snake_surface' && st0.preset === 'oblique' && st0.mode === 'compare' && st0.n === 4, JSON.stringify(st0));
  const sigModes = await sig(), b2 = await open({ w: 1500, h: 900 }); await b2.idle(); const sigPlain = await sigOf(b2.page);
  const sizes = [await ev(() => [...document.querySelectorAll('#stage canvas')].map((c) => c.clientWidth + 'x' + c.clientHeight).join()), await b2.page.evaluate(() => [...document.querySelectorAll('#stage canvas')].map((c) => c.clientWidth + 'x' + c.clientHeight).join())];
  ok('the default state is pixel-identical to the panel without modes (canvases and info line), and the canvases have the same size', sigModes === sigPlain && sizes[0] === sizes[1], sizes.join(' vs '));
  ok('without modes the aside has no "modes" class (the chips boxes are not bounded: the old panel)', !(await b2.page.evaluate(() => document.querySelector('aside').classList.contains('modes'))) && (await b2.page.evaluate(() => getComputedStyle(document.querySelector('#roomChips')).maxHeight)) === 'none');
  await b2.browser.close();

  // ---- the selector: Archived holds mode 5, the rest are in the main list
  const sel = await ev(() => ({ main: [...document.querySelectorAll('#modeSel > option')].map((o) => o.value), arch: [...document.querySelectorAll('#modeSel > optgroup[label="Archived"] option')].map((o) => o.value), box: document.querySelector('#modeBox').getBoundingClientRect().top < 400, scen: !!document.querySelector('#scenarios.mh'), inBar: !!document.querySelector('#bar #modeSel') }));
  ok('the mode selector is at the top of the side panel (not in the bar); the Archived group holds mode 5 only', sel.arch.join() === 'floors' && sel.main.join() === 'terrain,rooms,stage,curves,macroform' && sel.box && !sel.inBar, JSON.stringify(sel));
  ok('the scenario block is hidden (the scenarios became examples)', sel.scen);

  // ---- helpers evaluated in the page: what the tables say vs what the DOM shows
  const domVisible = () => ev(() => {
    const E = window.EVO, C = E.controls, e = window.__evo, m = E.modes.byId(e.st.modeId), plan = E.modes.plan(m, { exampleId: e.st.exampleId, floorsView: e.st.floors }), res = { bad: [], seen: 0, skipped: [] };
    for (const en of C.TABLE) {
      if (['cams', 'tech', 'mode', 'reset'].includes(en.id)) continue;
      const els = [...document.querySelectorAll(en.dom)]; if (!els.length) { res.skipped.push(en.id); continue; }
      // REAL visibility (the element is laid out: no hidden ancestor either); a control the plan shows but that the app itself keeps hidden (roles before a load, chips without zones...) is accepted only when it sits in a [hidden] container
      const shown = els.some((el) => el.getClientRects().length > 0), want = !!plan[en.id], appHidden = els.every((el) => !!el.closest('[hidden]'));
      res.seen++; if (shown !== want && !(want && appHidden)) res.bad.push(`${en.id}: shown ${shown}, plan ${plan[en.id] || 'hidden'}`);
    }
    return res;
  });
  // a REAL click (Playwright waits for the toggle to be visible and fails when it is not) on every visible "Show ..." toggle
  const visibleToggles = () => page.evaluateHandle(() => [...document.querySelectorAll('.advtoggle')].filter((b) => b.getClientRects().length > 0 && /^Show /.test(b.textContent)));
  const expandAll = async () => { for (let i = 0; i < 12; i++) { const h = await visibleToggles(), props = await h.getProperties(), els = [...props.values()].map((x) => x.asElement()).filter(Boolean); if (!els.length) break; for (const el of els) await el.click({ timeout: 5000 }); } };
  const collapseAll = () => ev(() => window.EVO.modes.resetFolds(document) || window.__evo.draw());

  const results = {};
  const WAIT = { rooms: 1, stage: 1, curves: 1 };
  for (const m of MODES) {
    const tag = `mode ${m.number} ${m.id}`, t0 = Date.now();
    await ev((id) => window.__evo.setMode(id), m.id); await a.idle();
    const s = await ev(() => { const e = window.__evo; return { m: e.st.modeId, ex: e.st.exampleId, pack: e.st.pack, preset: e.st.preset, tech: e.st.tech, mode: e.st.mode, rooms: !!e.P.rooms, n: [...document.querySelectorAll('#stage figure')].filter((f) => !f.hidden).length, sel: document.querySelector('#modeSel').value }; });
    const ex0 = m.examples[0];
    ok(`${tag}: the default example (${ex0.label}) loads with its camera, technique and compare state`, s.m === m.id && s.sel === m.id && s.ex === ex0.id && s.pack === ex0.src && s.preset === m.camera && s.tech === m.tech && s.mode === (m.compareDefault ? 'compare' : 'single') && (m.id === 'rooms' ? s.rooms : true) && s.n === (m.compareDefault ? 4 : 1), JSON.stringify(s));

    // the info line has a FIXED height (limitation 18): the same in every mode and state, so the canvases are painted at their final size (the bitmap equals the laid-out size)
    const ih = await ev(() => ({ h: document.querySelector('#info').getBoundingClientRect().height, bad: [...document.querySelectorAll('#stage canvas')].filter((c) => !c.closest('figure').hidden && (c.width !== c.clientWidth || c.height !== c.clientHeight)).length, scroll: document.querySelector('#info').scrollHeight }));
    ok(`${tag}: the info line has the fixed height (80.2 px, 4 lines) and every visible canvas is painted at its laid-out size`, Math.abs(ih.h - 80.2) < 0.1 && ih.bad === 0, JSON.stringify(ih));

    // visible = the tables: first folded, then with every fold opened
    await collapseAll(); await a.idle();
    const adv0 = await ev(() => { const E = window.EVO, e = window.__evo, m = E.modes.byId(e.st.modeId), plan = E.modes.plan(m, { exampleId: e.st.exampleId, floorsView: e.st.floors }), C = E.controls, hid = [];
      for (const en of C.TABLE) if (plan[en.id] === 'adv' || plan[en.id] === 'fold') { const els = [...document.querySelectorAll(en.dom)]; if (els.length && els.some((el) => el.getClientRects().length > 0)) hid.push(en.id); } return hid; });
    ok(`${tag}: the advanced controls${m.terrain === 'folded' ? ' and the terrain controls' : ''} are folded at entry`, adv0.length === 0, adv0.join(','));
    const hasFold = m.advanced.length > 0 || m.terrain === 'folded';
    const toggles = await ev(() => [...document.querySelectorAll('.advtoggle')].filter((b) => b.getClientRects().length > 0).map((b) => b.textContent)); // really visible, not just without the mh class
    ok(`${tag}: ${hasFold ? 'a toggle per folded group is offered' : 'no fold toggle (nothing is folded)'}`, hasFold ? toggles.length >= 1 : toggles.length === 0, toggles.join(' | '));
    if (m.id === 'rooms') { // at entry (folds closed): the 88 room chips must not push the mode's own controls out of the first screen
      const lay = await ev(() => { const asd = document.querySelector('aside'); asd.scrollTop = 0; const r = (q) => document.querySelector(q), c = r('#roomChips'), cs = getComputedStyle(c); return { cake: r('#t-cake').getBoundingClientRect().top, preset: r('#roomsPreset').getBoundingClientRect().top, chipsH: c.clientHeight, chipsScroll: c.scrollHeight, overflowY: cs.overflowY, whole: !c.contains(r('#wholeRooms')), hint: !c.contains(r('#roomHint')), modesClass: asd.classList.contains('modes') }; });
      ok(`mode 2: at 1500x900 the Cake toggle is on the first screen without scrolling the panel (top ${Math.round(lay.cake)} < 900), and the Rooms preset too (${Math.round(lay.preset)})`, lay.cake < 900 && lay.preset < 900, JSON.stringify(lay));
      ok('mode 2: the room chips are in a bounded scroll box (about 5 rows) with "Whole map" and the hint outside it', lay.overflowY === 'auto' && lay.chipsH <= 150 && lay.chipsScroll > lay.chipsH && lay.whole && lay.hint && lay.modesClass, JSON.stringify(lay));
    }

    if (m.terrain === 'folded') { // the terrain controls of modes 2-4 are reachable: the toggle is visible, a real click opens them, one of them works, a second click folds them again
      const TT = '.grp[data-group="1 Terrain"] > .advtoggle', tv = () => ev((q) => { const b = document.querySelector(q); return !!b && b.getClientRects().length > 0; }, TT), sv = () => ev(() => { const b = document.querySelector('#s-terraces'); return !!b && b.getClientRects().length > 0; });
      await ev(() => { document.querySelector('aside').scrollTop = 0; });
      const vis0 = await tv(), t0txt = vis0 ? await page.textContent(TT) : '';
      ok(`${tag}: the "Show terrain controls" toggle is visible (the "1 Terrain" section stays on screen)`, vis0 && /^Show terrain controls \(9\)$/.test(t0txt), t0txt || 'not visible');
      if (vis0) {
        ok(`${tag}: with the terrain folded, Terraces is not visible`, !(await sv()));
        await page.click(TT); await page.waitForTimeout(150);
        const en = await sv(), enabled = en ? await page.isEnabled('#s-terraces') : false;
        ok(`${tag}: a real click on the toggle shows the 9 terrain controls (Terraces visible and enabled)`, en && enabled && (await ev(() => ['terraces', 'subs', 'terH', 'spread', 'stairW', 'stairStyle', 'rampDepth', 'smooth', 'radius'].filter((id) => !(document.querySelector('#s-' + id).getClientRects().length > 0)).length)) === 0, `visible ${en}, enabled ${enabled}`);
        const b0 = await sig(), old = await ev(() => +document.querySelector('#s-terraces').value);
        await ev((v) => { const el = document.querySelector('#s-terraces'); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, old === 4 ? 3 : 4); await a.idle(); await page.waitForTimeout(250);
        const b1 = await sig();
        ok(`${tag}: changing Terraces (${old} -> ${old === 4 ? 3 : 4}) from the opened terrain controls changes the canvas or the info line`, b1 !== b0);
        await ev((v) => { const el = document.querySelector('#s-terraces'); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, old); await a.idle();
        await page.click(TT); await page.waitForTimeout(150);
        ok(`${tag}: a second click folds the terrain controls again (toggle still visible)`, !(await sv()) && (await tv()) && /^Show terrain controls/.test(await page.textContent(TT)));
      }
    }
    await expandAll();
    const vis = await domVisible();
    ok(`${tag}: with the folds open, the visible controls are exactly main + advanced + common (${vis.seen} entries checked)`, vis.bad.length === 0, vis.bad.join('; '));

    // every visible disabled control says what it requires
    const dis = await ev(() => { const C = window.EVO.controls, out = []; for (const en of C.TABLE) for (const el of document.querySelectorAll(en.dom)) { if (el.closest('.mh') || el.closest('[hidden]') || !el.disabled || en.keep) continue; const h = C.holder(el); const t = (h.title || el.title || ''); if (en.lock && en.lock.on(window.__evo.controlsCtx()) && t === en.lock.text) continue; /* a LOCKED control (src/controls.js: set by the rule of "Framing by room type") says who set it, not what it requires */ if (!/^Requires: /.test(t) && !(en.dom.includes(',') && /^Requires: /.test(el.title))) out.push(en.id + ':' + (el.id || el.textContent.trim().slice(0, 20))); } return out; });
    ok(`${tag}: every visible disabled control has a "Requires: ..." tooltip`, dis.length === 0, dis.join(','));

    // the bar: cameras and techniques outside the mode are hidden, Compare only in modes 1 and 4
    const bar = await ev(() => ({ cams: [...document.querySelectorAll('#presets button')].filter((b) => !b.closest('.mh')).map((b) => b.dataset.id), techs: [...document.querySelectorAll('#techs button')].filter((b) => !b.closest('.mh')).map((b) => b.dataset.id), compare: !document.querySelector('#mode').classList.contains('mh') }));
    ok(`${tag}: only its cameras, its techniques${m.compare ? ' and Compare' : ' (no Compare)'} are offered in the bar`, bar.cams.join() === m.cameras.join() && bar.techs.join() === m.techs.join() && bar.compare === m.compare, JSON.stringify(bar));

    // the banner, the incursion, the folded diagnostics
    const ban = await ev(() => { const b = document.querySelector('#modeBanner'); return { shown: !b.hidden && b.textContent.length > 10, text: b.textContent }; });
    ok(`${tag}: ${m.banner ? 'the banner is shown: ' + m.banner.split(':')[0] : 'no banner'}`, ban.shown === !!m.banner && (!m.banner || ban.text === m.banner), ban.text);
    if (m.id === 'macroform') {
      const mf = await ev(() => ({ off: document.querySelector('#macroView option[value="off"]').textContent, baked: !document.querySelector('#bakedBox').hidden && !document.querySelector('#bakedBox').closest('.mh'), params: document.querySelector('#bakedParams').textContent, inc: !!document.querySelector('#incursion.mh'), shared: [...document.querySelectorAll('#toggles [data-group="Shared passes"] input')].filter((i) => !i.closest('.mh')).map((i) => i.id) }));
      ok('mode 6: the Off option reads "Heightmap (for comparison)" (value unchanged), the baked parameters are shown read-only, Incursion is hidden, outlines only', mf.off === 'Heightmap (for comparison)' && mf.baked && /T_SHELL 1.5/.test(mf.params) && /derive_snake_macroform/.test(await ev(() => document.querySelector('#bakedBox').textContent)) && mf.inc && mf.shared.join() === 't-outlines', JSON.stringify(mf));
    }
    if (m.id === 'floors') { const inc = await ev(() => !!document.querySelector('#incursion.mh')); ok('mode 5: Incursion is shown in the single floor view', !inc); await page.selectOption('#floorsView', 'stack'); await a.idle(); ok('mode 5: Incursion is hidden in the exploded stack (not greyed)', await ev(() => !!document.querySelector('#incursion.mh'))); await page.selectOption('#floorsView', 'single'); await a.idle(); }

    // each MAIN control changes the canvas or the info line on the default example
    const startDisabled = await ev((main) => { const C = window.EVO.controls, o = {}; for (const id of main) { const en = C.TABLE.find((x) => x.id === id); o[id] = [...document.querySelectorAll(en.dom)].every((el) => el.disabled); } return o; }, m.main);
    const changed = [], same = [], skipped = [];
    const PREP = { rooms: async () => { await page.click('#roomChips .chip[data-id="31"]'); await a.idle(); }, floors: async () => { await page.click('#floorChips .chip[data-floor="1"]'); await a.idle(); } }; // a datum to act on (a Diorama room, a floor), not a forced requirement
    const needPrep = { 't-pocket': 'rooms', 't-backdrop': 'floors' };
    for (const id of m.main) {
      if (startDisabled[id]) { skipped.push(id); continue; }
      if (m.id === 'rooms' && (id === 'pocketFraming' || id === 'pocketHeight')) await PREP.rooms(); // the Pocket sliders change nothing until a Diorama room is chosen (with Framing by room type on, Whole map has no pocket drawn): choose room 31 first, as for the Pocket switch
      const base0 = await sig();
      const act = await ev((id) => {
        const en = window.EVO.controls.TABLE.find((x) => x.id === id), els = [...document.querySelectorAll(en.dom)], el = els[0], undo = {};
        const fire = (n, t) => n.dispatchEvent(new Event(t, { bubbles: true }));
        if (id === 'roomChips') { const chips = [...document.querySelectorAll('#roomChips .chip')], c = chips.find((x) => x.dataset.id === '31') || chips[0]; c.click(); return { kind: 'chip', value: c.dataset.id }; }
        if (el.type === 'range') { const mn = +el.min, mx = +el.max, v = +el.value; el.value = String(v - mn < mx - v ? mx : mn); fire(el, 'input'); fire(el, 'change'); return { kind: 'range', old: v, value: el.value }; }
        if (el.type === 'checkbox') { el.click(); return { kind: 'check', value: el.checked }; }
        if (el.tagName === 'SELECT') { const v = el.value, o = [...el.options].find((x) => x.value !== v && !x.disabled); el.value = o.value; fire(el, 'change'); return { kind: 'select', old: v, value: o.value }; }
        return { kind: 'none' };
      }, id);
      await a.idle(); await page.waitForTimeout(250); const after = await sig();
      (after !== base0 ? changed : same).push(id);
      // undo, so that the next control starts from the default example
      await ev((x) => { const { id, act } = x, en = window.EVO.controls.TABLE.find((q) => q.id === id), el = document.querySelector(en.dom), fire = (n, t) => n.dispatchEvent(new Event(t, { bubbles: true }));
        if (act.kind === 'range') { el.value = String(act.old); fire(el, 'input'); fire(el, 'change'); } else if (act.kind === 'check') el.click(); else if (act.kind === 'select') { el.value = act.old; fire(el, 'change'); } else if (act.kind === 'chip') document.querySelector(`#roomChips .chip[data-id="${act.value}"]`).click(); }, { id, act });
      await a.idle(); await page.waitForTimeout(150);
      if (m.id === 'rooms' && (id === 'pocketFraming' || id === 'pocketHeight')) { await page.click('#wholeRooms'); await a.idle(); }
    }
    // controls that need a datum first (a Diorama room for the Pocket, a floor for the backdrop) are measured after choosing it
    for (const id of Object.keys(needPrep).filter((k) => m.main.includes(k) && !startDisabled[k])) {
      if (changed.includes(id)) continue; same.splice(same.indexOf(id), 1);
      await PREP[needPrep[id]](); const base0 = await sig();
      await ev((id) => { const el = document.querySelector(window.EVO.controls.TABLE.find((x) => x.id === id).dom); el.click(); }, id); await a.idle(); await page.waitForTimeout(250);
      const after = await sig(); (after !== base0 ? changed : same).push(id);
      await ev((id) => document.querySelector(window.EVO.controls.TABLE.find((x) => x.id === id).dom).click(), id); await a.idle();
    }
    results[m.id] = { changed, same, skipped };
    console.log(`  ${tag}: main controls changed the picture / info: ${changed.join(', ') || '-'} | no change: ${same.join(', ') || '-'} | skipped (disabled at the default example): ${skipped.join(', ') || '-'}  [${((Date.now() - t0) / 1000).toFixed(0)} s]`);
    ok(`${tag}: each main control that is enabled at the default example changes the canvas or the info line`, same.length === 0 && changed.length + skipped.length === m.main.length, same.join(','));
    // changing the example keeps the mode
    const alt = { terrain: 'shrine_pier', rooms: 'real_default', stage: 'diorama31_stage', curves: 'shrine_pier_x4' }[m.id];
    if (alt) {
      const exa = m.examples.find((e) => e.id === alt); await page.click(`#examples button[data-id="${alt}"]`); await a.idle();
      const s2 = await ev(() => { const e = window.__evo; return { m: e.st.modeId, ex: e.st.exampleId, pack: e.st.pack, sel: document.querySelector('#modeSel').value, on: document.querySelector('#examples button.on').dataset.id }; });
      ok(`${tag}: choosing another example (${exa.label}) keeps the mode and loads its source`, s2.m === m.id && s2.sel === m.id && s2.ex === alt && s2.pack === exa.src && s2.on === alt, JSON.stringify(s2));
    }
  }
  const total = Object.values(results).reduce((n, r) => n + r.changed.length, 0), skippedAll = Object.entries(results).flatMap(([k, r]) => r.skipped.map((x) => k + '.' + x));
  console.log(`MEASURED: ${total} main controls changed the picture or the info line; skipped (disabled at the default example, reported not forced): ${skippedAll.join(', ') || 'none'}`);

  // ---- "Your images": an example of modes 1, 2 and 4; the loader appears only with it
  await ev(() => window.__evo.setMode('terrain')); await a.idle();
  const imgsVis = () => ev(() => ({ file: !document.querySelector('#file').closest('.mh'), src: !document.querySelector('#src').closest('.mh') }));
  ok('mode 1: the file loader and the source selector are hidden until the example "Your images"', (await imgsVis()).file === false && (await imgsVis()).src === false);
  await page.click('#examples button[data-id="images"]'); await a.idle();
  ok('mode 1: the example "Your images" shows the file loader (the source selector stays hidden)', (await imgsVis()).file === true && (await imgsVis()).src === false);
  for (const id of ['stage', 'floors', 'macroform']) { await ev((id) => window.__evo.setMode(id), id); await a.idle(); ok(`mode ${MODES.find((m) => m.id === id).number} ${id}: no "Your images" example and no file loader`, !MODES.find((m) => m.id === id).examples.some((e) => e.images) && (await imgsVis()).file === false); }

  // ---- viewer.mode: written on save, applied on load
  await ev(() => window.__evo.setMode('terrain')); await a.idle(); await page.click('#examples button[data-id="images"]');
  await page.setInputFiles('#file', [PNG]); await page.waitForTimeout(1500); await a.idle();
  const vb = await ev(() => window.__evo.viewerBlock());
  ok('after loading images in mode 1, the viewer block (written on save) carries mode "terrain"', vb.mode === 'terrain' && (await ev(() => window.__evo.st.exampleId)) === 'images', JSON.stringify(vb));
  await ev(() => window.__evo.setMode('curves')); await a.idle();
  const man = path.join(os.tmpdir(), 'modes_test_manifest.json');
  fs.writeFileSync(man, JSON.stringify({ format: 'evodun-pack/0.3', name: 'modes test', roles: { elevation: { image: 'skeleton_heightmap_256.png', channel: 'V' } }, viewer: { mode: 'rooms', rooms: true, camera: 'isoE' } }));
  await page.click('#examples button[data-id="images"]'); await page.setInputFiles('#file', [PNG, man]); await page.waitForTimeout(2500); await a.idle();
  const lm = await ev(() => { const e = window.__evo; return { m: e.st.modeId, sel: document.querySelector('#modeSel').value, preset: e.st.preset, rooms: !!e.P.rooms, ex: e.st.exampleId }; });
  ok('a manifest with viewer.mode "rooms" switches the viewer to that mode on load (images and the manifest camera stay)', lm.m === 'rooms' && lm.sel === 'rooms' && lm.preset === 'isoE' && lm.rooms && lm.ex === 'images', JSON.stringify(lm));
  fs.unlinkSync(man);

  // ---- FRAMING BY ROOM TYPE (mode 2, docs/ui-modes.md U10): one framing per room type, never mixed. The state is measured on the real shape (ring tiles, wall faces, pocket), not on the switches only.
  {
    const fr = () => ev(() => {
      const e = window.__evo, S = e.S(), C = window.EVO.controls, q = (id) => { const el = document.querySelector(id), h = C.holder(el); return { checked: el.checked, disabled: el.disabled, inactiveCls: h.classList.contains('inactive'), tag: !!h.querySelector('.inact'), title: h.title }; };
      const T = window.EVO.roomTypes, nm = (t) => (t === T.CAKE ? 'cake' : t === T.ASCENSION ? 'ascension' : 'diorama'), chosen = [...e.sliceSel.rooms];
      const want = chosen.length ? new Set(chosen.map((id) => nm(S.types.rooms.get(id).type))) : new Set(['cake', 'ascension', 'diorama']);
      return { cake: !!e.P.cake, asc: !!e.P.ascWalls, pocket: !!e.P.pocket, rings: S && S.cake ? S.cake.tiles : 0, faces: S && S.ascWalls ? S.ascWalls.info.faces : 0, pk: !!(S && S.pocketInfo), chosen, dac: document.querySelector('#dacAuto').checked, dacSt: e.st.dacAuto,
        sw: { cake: q('#t-cake'), asc: q('#t-ascWalls'), pocket: q('#t-pocket') }, want: { cake: want.has('cake'), asc: want.has('ascension'), pocket: want.has('diorama') }, types: chosen.map((id) => nm(S.types.rooms.get(id).type)).join('+'), err: document.querySelector('#msg').hidden ? '' : document.querySelector('#msg').textContent };
    });
    const mirrors = (f) => f.sw.cake.checked === f.cake && f.sw.asc.checked === f.asc && f.sw.pocket.checked === f.pocket;
    const locked = (f) => ['cake', 'asc', 'pocket'].every((k) => f.sw[k].disabled && !f.sw[k].inactiveCls && !f.sw[k].tag && /^Set by 'Framing by room type'/.test(f.sw[k].title));
    const free = (f) => ['cake', 'asc', 'pocket'].every((k) => !f.sw[k].disabled && !f.sw[k].inactiveCls && !f.sw[k].tag);
    const rule = (f) => f.cake === f.want.cake && f.asc === f.want.asc && f.pocket === f.want.pocket;
    const click = async (sel) => { await page.click(sel); await a.idle(); };
    const exs = [['cake60', 'cake', 60], ['cake85', 'cake', 85], ['asc88', 'ascension', 88], ['pocket31', 'diorama', 31]];
    await ev(() => window.__evo.setMode('rooms')); await a.idle();
    const m2 = MODES.find((m) => m.id === 'rooms');
    ok('mode 2 offers 7 examples in this order (first = the default): real_balanced, real_default, cake60, cake85, asc88, pocket31, images', m2.examples.map((e) => e.id).join() === 'real_balanced,real_default,cake60,cake85,asc88,pocket31,images', m2.examples.map((e) => e.id).join());
    ok('mode 2 lists the "Framing by room type" switch first among its framing controls', m2.main.indexOf('dacAuto') >= 0 && m2.main.indexOf('dacAuto') < m2.main.indexOf('t-cake'));
    let f = await fr();
    ok('mode 2 opens with the switch ON (default example: whole map, all three framings on their own rooms)', f.dac && f.dacSt && f.cake && f.asc && f.pocket && f.chosen.length === 0, JSON.stringify([f.cake, f.asc, f.pocket]));
    ok('switch ON: the three checkboxes are disabled, show the rule\'s state, carry no "inactive" tag nor class, tooltip says who set them', locked(f) && mirrors(f), JSON.stringify(f.sw));

    for (const [id, type, room] of exs) {
      await click(`#examples button[data-id="${id}"]`); f = await fr();
      const real = await ev((r) => { const S = window.__evo.S(), T = window.EVO.roomTypes, t = S.types.rooms.get(r).type; return t === T.CAKE ? 'cake' : t === T.ASCENSION ? 'ascension' : 'diorama'; }, room);
      const declared = await ev((id) => window.EVO.modes.byId('rooms').examples.find((e) => e.id === id).type, id);
      ok(`${id}: the declared type (${declared}) is the real type of room ${room} (${real})`, declared === real && real === type);
      // the invariant: ONLY the framing of the room's type exists on screen
      const only = { cake: f.rings > 0 && f.faces === 0 && !f.pk && f.cake && !f.asc && !f.pocket, ascension: f.faces > 0 && f.rings === 0 && !f.pk && !f.cake && f.asc && !f.pocket, diorama: f.pk && f.rings === 0 && f.faces === 0 && !f.cake && !f.asc && f.pocket }[type];
      ok(`${id}: only the ${type} framing is on the real shape (rings ${f.rings}, wall faces ${f.faces}, pocket ${f.pk}), the other two are off and so are the scenery's`, only, JSON.stringify({ rings: f.rings, faces: f.faces, pk: f.pk }));
      ok(`${id}: the three switches mirror the rule and are locked (no "inactive")`, mirrors(f) && locked(f) && rule(f));
      console.log(`    ${id}: room ${room} ${real} · ring tiles ${f.rings} · wall faces ${f.faces} · pocket ${f.pk}`);
    }

    // chips: the rule follows the chosen rooms
    await click('#examples button[data-id="cake60"]');
    const seq = [['#roomChips .chip[data-id="88"]', 'asc'], ['#roomChips .chip[data-id="31"]', 'pocket'], ['#roomChips .chip[data-id="60"]', 'cake']];
    for (const [sel, k] of seq) {
      await click(sel); f = await fr();
      ok(`chip ${sel.match(/\d+/)[0]} (${f.types}): only the ${k} framing, switches mirrored and locked`, rule(f) && f.cake === (k === 'cake') && f.asc === (k === 'asc') && f.pocket === (k === 'pocket') && mirrors(f) && locked(f) && f.err === '', JSON.stringify([f.cake, f.asc, f.pocket]));
    }
    await page.click('#roomChips .chip[data-id="88"]', { modifiers: ['Control'] }); await a.idle(); f = await fr();
    ok('ctrl-click 88 on 60 (Cake + Ascension): the union, rings and walls, no pocket', f.cake && f.asc && !f.pocket && f.rings > 0 && f.faces > 0 && !f.pk && mirrors(f) && locked(f), JSON.stringify([f.rings, f.faces, f.pk]));
    await click('#wholeRooms'); f = await fr();
    ok('Whole map: all three on, each acting on the rooms of its own type', f.cake && f.asc && f.pocket && f.rings > 0 && f.faces > 0 && mirrors(f) && locked(f), JSON.stringify([f.rings, f.faces, f.pk]));

    // the switch OFF: free, keeps the last state, manual mixing allowed; ON again re-applies
    await click('#examples button[data-id="cake60"]'); await click('#dacAuto'); f = await fr();
    ok('switch OFF: the three checkboxes are enabled (no lock, no "inactive") and keep the last state (Cake only)', !f.dac && !f.dacSt && free(f) && f.cake && !f.asc && !f.pocket && mirrors(f), JSON.stringify(f.sw));
    await click('#t-ascWalls'); f = await fr();
    ok('OFF: turning Ascension walls on does not touch the others (Cake + Ascension, mixing allowed by hand)', f.cake && f.asc && !f.pocket && f.rings > 0 && f.faces > 0, JSON.stringify([f.cake, f.asc, f.pocket]));
    await click('#dacAuto'); f = await fr();
    ok('switch ON again: the rule is re-applied (room 60 is Cake: rings only)', f.dac && f.cake && !f.asc && !f.pocket && f.rings > 0 && f.faces === 0 && locked(f) && mirrors(f));

    // a preset change with a room chosen: no stale flags, no error, the rule re-applied with the new classification
    await click('#examples button[data-id="asc88"]');
    await page.selectOption('#roomsPreset', 'default'); await a.idle(); f = await fr();
    ok('Balanced -> Default with room 88 chosen: no stale ids, the switches follow the rule and mirror (the Pocket one needs a Diorama room: none in Default, so it is requirement-disabled, not locked), no error', f.chosen.every((r) => r > 0) && rule(f) && mirrors(f) && f.err === '' && f.sw.cake.disabled && f.sw.asc.disabled, JSON.stringify({ chosen: f.chosen, sw: [f.cake, f.asc, f.pocket], want: f.want, err: f.err, pk: f.sw.pocket.title }));
    await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); f = await fr();
    ok('Default -> Balanced: the rule still holds, mirrored and locked', rule(f) && mirrors(f) && locked(f) && f.err === '', JSON.stringify({ chosen: f.chosen, sw: [f.cake, f.asc, f.pocket], want: f.want, err: f.err, locked: locked(f) }));

    await click('#examples button[data-id="pocket31"]'); await page.selectOption('#roomsPreset', 'default'); await a.idle(); f = await fr();
    ok(`Diorama 31 chosen, Balanced -> Default: room 31 is ${f.types || 'gone'} there; the switches follow the new type (no stale Pocket), mirrored, no error`, rule(f) && mirrors(f) && f.err === '' && (f.chosen.length === 0 || f.chosen[0] === 31), JSON.stringify({ chosen: f.chosen, sw: [f.cake, f.asc, f.pocket], want: f.want, err: f.err }));
    await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); f = await fr();
    ok('Default -> Balanced again: the rule holds', rule(f) && mirrors(f) && f.err === '');

    // the manifest: dacAuto round trip, and a manifest without it loads with the switch OFF
    await click('#examples button[data-id="cake60"]');
    const vb1 = await ev(() => window.__evo.viewerBlock());
    ok('the viewer block written on save carries mode "rooms" and dacAuto true (cake true)', vb1.mode === 'rooms' && vb1.dacAuto === true && vb1.cake === true, JSON.stringify(vb1));
    await click('#dacAuto'); const vb2 = await ev(() => window.__evo.viewerBlock());
    ok('with the switch OFF the viewer block writes dacAuto false', vb2.dacAuto === false, JSON.stringify(vb2)); await click('#dacAuto');
    await ev(() => window.__evo.setMode('terrain')); await a.idle();
    const vb3 = await ev(() => window.__evo.viewerBlock());
    ok('outside mode 2 the viewer block does not write dacAuto', vb3.dacAuto === undefined, JSON.stringify(vb3));
    const mk = (viewer) => { const p = path.join(os.tmpdir(), 'dac_manifest_' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(p, JSON.stringify({ format: 'evodun-pack/0.3', name: 'dac test', roles: { elevation: { image: 'skeleton_heightmap_256.png', channel: 'V' } }, viewer })); return p; };
    for (const [label, viewer, wantDac, wantCake] of [['dacAuto true', { mode: 'rooms', rooms: true, preset: 'balanced', terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, camera: 'isoE', dacAuto: true, cake: true }, true, true], ['dacAuto false', { mode: 'rooms', rooms: true, preset: 'balanced', terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, camera: 'isoE', dacAuto: false, cake: true }, false, true], ['no dacAuto (saved before the rule)', { mode: 'rooms', rooms: true, preset: 'balanced', terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, camera: 'isoE', cake: true }, false, true]]) {
      await ev(() => window.__evo.setMode('terrain')); await a.idle(); await page.click('#examples button[data-id="images"]');
      const man = mk(viewer); await page.setInputFiles('#file', [PNG, man]); await page.waitForTimeout(2500); await a.idle(); fs.unlinkSync(man);
      f = await fr(); const vb = await ev(() => window.__evo.viewerBlock());
      ok(`manifest ${label}: loads in mode 2 with the switch ${wantDac ? 'ON' : 'OFF'}, cake ${wantCake}, and saves the same dacAuto`, f.dac === wantDac && f.dacSt === wantDac && f.cake === wantCake && vb.dacAuto === wantDac && (wantDac ? locked(f) : free(f)) && mirrors(f), JSON.stringify({ locked: locked(f), free: free(f), mirrors: mirrors(f), sw: f.sw, dac: f.dac, cake: f.cake, asc: f.asc, pocket: f.pocket, vb: vb.dacAuto }));
    }
  }

  console.log('errors:', a.errs); ok('no page errors', a.errs.length === 0); await a.browser.close();
})();
