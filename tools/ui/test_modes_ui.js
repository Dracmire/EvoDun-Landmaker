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
    ok('mode 2 offers 8 examples in this order (first = the default): real_balanced, real_default, real_chain5, cake60, cake85, asc88, pocket31, images (the list was 7 before DAC v2: real_chain5 added after real_default, announced and approved)', m2.examples.map((e) => e.id).join() === 'real_balanced,real_default,real_chain5,cake60,cake85,asc88,pocket31,images', m2.examples.map((e) => e.id).join());
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
      await page.waitForFunction(() => { const S = window.__evo.S(); return S && S.rooms && document.querySelector('#busy').hidden; }, null, { timeout: 180000 }); await a.idle(); // the rooms shape of the loaded map (a cold build) is the one the controls are evaluated against
      f = await fr(); const vb = await ev(() => window.__evo.viewerBlock());
      ok(`manifest ${label}: loads in mode 2 with the switch ${wantDac ? 'ON' : 'OFF'}, cake ${wantCake}, and saves the same dacAuto`, f.dac === wantDac && f.dacSt === wantDac && f.cake === wantCake && vb.dacAuto === wantDac && (wantDac ? locked(f) : free(f)) && mirrors(f), JSON.stringify({ locked: locked(f), free: free(f), mirrors: mirrors(f), sw: f.sw, dac: f.dac, cake: f.cake, asc: f.asc, pocket: f.pocket, vb: vb.dacAuto }));
    }
  }

  // ---- SHOW FRAMING + THREE TYPES CONNECTED (mode 2, docs/ui-modes.md U11)
  {
    const click = async (sel) => { await page.click(sel); await a.idle(); };
    const meas = () => ev(() => { const e = window.__evo, S = e.S(); return { rings: S.cake ? S.cake.tiles : 0, faces: S.ascWalls ? S.ascWalls.info.faces : 0, pk: !!e.P.pocket, pkInfo: !!S.pocketInfo, out: !!e.O.dioOutline, cake: !!e.P.cake, asc: !!e.P.ascWalls, sel: document.querySelector('#dacShow').value, dis: document.querySelector('#dacShow').disabled, title: document.querySelector('#dacShow').closest('label').title }; });
    await ev(() => window.__evo.setMode('rooms')); await a.idle();
    const ex = await ev(() => window.EVO.modes.byId('rooms').examples[0]);
    ok('the default example of mode 2 is "Real map · Balanced (3 types, connected)" with the tint, the outline, a stake and two objectives', ex.id === 'real_balanced' && /3 types, connected/.test(ex.label) && ex.tint && ex.outline && ex.stake && ex.objectives.length === 2, ex.label);

    const first = await ev(() => { const e = window.__evo; return { tint: !!e.O.typeTint, borders: !!e.O.roomBorders, out: !!e.O.dioOutline }; });
    ok('first open of mode 2: the Display state is tint ON, room borders ON, footprint outline ON (recorded: the reference of the re-click tests)', first.tint && first.borders && first.out, JSON.stringify(first));

    // 1. the selector, on the real shape, whole map
    let m = await meas();
    ok('Show framing: All (default, whole map): rings, wall faces and the pocket flag are on', m.sel === 'all' && !m.dis && m.rings > 0 && m.faces > 0 && m.pk, JSON.stringify(m));
    const want = { cake: (x) => x.rings > 0 && x.faces === 0 && !x.pk && x.cake && !x.asc, ascension: (x) => x.faces > 0 && x.rings === 0 && !x.pk && x.asc && !x.cake, diorama: (x) => x.rings === 0 && x.faces === 0 && x.pk && x.out };
    for (const v of ['cake', 'ascension', 'diorama']) { await page.selectOption('#dacShow', v); await a.idle(); m = await meas(); ok(`Show framing: ${v}: only that framing on the real shape (rings ${m.rings}, wall faces ${m.faces}, pocket flag ${m.pk}, outline ${m.out})`, want[v](m), JSON.stringify(m)); }
    await page.selectOption('#dacShow', 'all'); await a.idle();
    // with a room chosen the selector changes nothing (the room types decide) and is disabled with its requirement
    await ev(() => window.__evo.set({ dacShow: 'diorama' })); await click('#roomChips .chip[data-id="60"]'); m = await meas();
    ok('a room chosen (Cake 60) with Show framing "diorama" in the state: the room\'s type decides (rings only), the selector is disabled with "Requires: ..."', want.cake(m) && m.dis && /^Requires: /.test(m.title), JSON.stringify(m));
    await click('#wholeRooms'); m = await meas();
    ok('Whole map again: the selector (still "diorama") applies and is enabled', want.diorama(m) && !m.dis);
    await ev(() => window.__evo.set({ dacShow: 'all' })); await click('#examples button[data-id="real_balanced"]'); await click('#dacAuto'); m = await meas();
    ok('Framing by room type OFF: the selector is disabled with "Requires: ..." and nothing is forced', m.dis && /^Requires: /.test(m.title) && m.sel === 'all', JSON.stringify(m)); await click('#dacAuto');
    // where it sits: the first screen at 1500x900 (reported, not enforced)
    const pos = await ev(() => { window.EVO.modes.resetFolds(document); document.querySelector('aside').scrollTop = 0; const r = (q) => Math.round(document.querySelector(q).getBoundingClientRect().top); return { cake: r('#t-cake'), show: r('#dacShow'), roomChips: r('#roomChips') }; });
    console.log(`    MEASURED (1500x900, folds closed): Cake toggle top ${pos.cake} px, Show framing top ${pos.show} px (${pos.show > 900 ? (pos.show - 900) + ' px below the fold: needs scrolling the panel' : 'on the first screen'})`);

    // 1b. the selector ISOLATES the view FULLY (handler only): tint, room borders and outline off for cake / ascension, outline on for diorama; All = tint + outline on, borders as they are; nothing is re-forced by a redraw
    {
      const flags = () => ev(() => { const e = window.__evo, q = (id) => document.querySelector(id).checked; return { tint: !!e.O.typeTint, borders: !!e.O.roomBorders, out: !!e.O.dioOutline, boxes: [q('#t-typeTint'), q('#t-roomBorders'), q('#t-dioOutline')].join() }; });
      const sameBoxes = (f) => f.boxes === [f.tint, f.borders, f.out].join();
      const toggle = async (id) => { await ev((id) => document.querySelector(id).click(), id); await a.idle(); };
      await click('#examples button[data-id="real_balanced"]'); let f = await flags();
      ok('start of the isolation tests: the default example gives tint ON, outline ON and room borders ON (the example resets the borders too)', f.tint && f.out && f.borders && sameBoxes(f), JSON.stringify(f));
      for (const v of ['cake', 'ascension']) { await page.selectOption('#dacShow', v); await a.idle(); f = await flags(); ok(`Show framing ${v}: type tint OFF, room borders OFF and outline OFF exactly (checkboxes agree)`, !f.tint && !f.borders && !f.out && sameBoxes(f), JSON.stringify(f)); await toggle('#t-roomBorders'); }
      await page.selectOption('#dacShow', 'diorama'); await a.idle(); f = await flags();
      ok('Show framing diorama: tint OFF, room borders OFF and the footprint outline ON exactly', !f.tint && !f.borders && f.out && sameBoxes(f), JSON.stringify(f));
      await toggle('#t-dioOutline'); await toggle('#t-typeTint'); await ev(() => window.__evo.draw()); await a.idle(); f = await flags();
      ok('manual choices persist through a redraw: outline off and tint on by hand are NOT re-forced (the rule never touches the Display toggles)', !f.out && f.tint && sameBoxes(f), JSON.stringify(f));
      await click('#roomChips .chip[data-id="31"]'); await click('#wholeRooms'); f = await flags();
      ok('a chip click and Whole map do not re-force them either', !f.out && f.tint, JSON.stringify(f));
      await toggle('#t-roomBorders'); await page.selectOption('#dacShow', 'all'); await a.idle(); f = await flags();
      ok('Show framing All: tint ON and outline ON, the room borders (on by hand) are left as they are', f.tint && f.out && f.borders && sameBoxes(f), JSON.stringify(f));
      await toggle('#t-roomBorders');
      // the examples are reproducible: from every isolated state, re-clicking the default example gives the state of the first open; cake60 gives its own
      for (const v of ['cake', 'ascension', 'diorama']) {
        await page.selectOption('#dacShow', v); await a.idle(); await click('#examples button[data-id="real_balanced"]'); f = await flags();
        ok(`re-clicking the default example from the isolated "${v}" view gives the state of the first open (tint ${first.tint}, borders ${first.borders}, outline ${first.out}) and the selector back on All`, f.tint === first.tint && f.borders === first.borders && f.out === first.out && sameBoxes(f) && (await ev(() => document.querySelector('#dacShow').value)) === 'all', JSON.stringify(f));
      }
      await page.selectOption('#dacShow', 'cake'); await a.idle(); await click('#examples button[data-id="cake60"]'); f = await flags();
      ok('re-clicking cake60 from the isolated "cake" view gives tint OFF, outline OFF and room borders ON', !f.tint && !f.out && f.borders && sameBoxes(f), JSON.stringify(f));
      await click('#examples button[data-id="real_balanced"]'); f = await flags();
      ok('...and the default example again gives the first-open state', f.tint === first.tint && f.borders === first.borders && f.out === first.out, JSON.stringify(f));
    }

    // 2. the three marks of the default example
    await click('#examples button[data-id="real_balanced"]');
    const d = await ev(() => { const e = window.__evo, S = e.S(), E = window.EVO, T = E.roomTypes, nm = (t) => (t === T.CAKE ? 'Cake' : t === T.DIORAMA ? 'Dio' : 'Asc'), sizes = S.regionSizes, main = sizes.indexOf(Math.max(...sizes)), tile = (q) => (q.y - S.oy) * S.W + (q.x - S.ox);
      const marks = [e.inc.stake, ...e.inc.objectives]; if (marks.some((q) => !q)) return { n: marks.filter(Boolean).length };
      const info = marks.map((q) => { const i = tile(q), id = S.roomMap[i]; return { i, id, type: id ? nm(S.types.rooms.get(id).type) : 'none', main: S.region[i] === main }; });
      const routes = e.inc.objectives.map((q) => { const r = E.route(S, e.P, tile(q), info[0].i); const c = { Cake: 0, Dio: 0, Asc: 0, none: 0 }; if (r) for (const t of r) { const id = S.roomMap[t]; c[id ? nm(S.types.rooms.get(id).type) : 'none']++; } return r ? { len: r.length, c } : null; });
      return { n: marks.length, info, routes, tint: !!e.O.typeTint, out: !!e.O.dioOutline }; });
    ok('default example: a stake and two objectives exist', d.n === 3, JSON.stringify(d.n));
    ok('every mark is on a walkable tile of the MAIN region', d.info.every((x) => x.main), JSON.stringify(d.info));
    ok('the room type under the marks is Cake (stake), Ascension (objective 1), Diorama (objective 2)', d.info.map((x) => x.type).join() === 'Cake,Asc,Dio', d.info.map((x) => x.type + ' ' + x.id).join(', '));
    ok('a route exists from the stake to both objectives and each crosses tiles of ALL THREE room types', d.routes.every((r) => r && r.c.Cake > 0 && r.c.Dio > 0 && r.c.Asc > 0), JSON.stringify(d.routes));
    console.log('    MEASURED routes (tiles per type):', JSON.stringify(d.routes));
    ok('the type tint and the Diorama outline are on', d.tint && d.out);

    // 2b. the route as a sequence of rooms: an INDEPENDENT recomputation (the test\'s own rule: stake first, drop room 0, then collapse equal neighbours)
    const rl = await ev(() => { const e = window.__evo, S = e.S(), E = window.EVO, tile = (q) => (q.y - S.oy) * S.W + (q.x - S.ox), st0 = tile(e.inc.stake);
      const lines = [...document.querySelector('#incInfo').innerHTML.split('<br>')].filter((l) => /^Route \d/.test(l)).map((l) => l.replace(/&gt;/g, '>'));
      const exp = e.inc.objectives.map((q) => { const r = E.route(S, e.P, tile(q), st0), ids = r.slice().reverse().map((t) => S.roomMap[t]).filter((id) => id !== 0), seq = ids.filter((id, k) => k === 0 || id !== ids[k - 1]); return { len: r.length, seq, stakeRoom: S.roomMap[st0], objRoom: S.roomMap[tile(q)] }; });
      const usual = document.querySelector('#incInfo').innerHTML.split('<br>').filter((l) => !/^Route \d/.test(l));
      return { lines, exp, usual }; });
    ok('route lines: one per objective, after the usual incursion text', rl.lines.length === 2 && rl.usual.length === 2 && rl.usual.every((l) => /route of \d+ tiles to the stake/.test(l)), JSON.stringify(rl.usual));
    for (let k = 0; k < 2; k++) {
      const line = rl.lines[k], e = rl.exp[k], listed = line.split('stake first: ')[1].split(' > '), ids = listed.map((t) => +t.match(/(\d+)$/)[1]), K = +line.match(/, (\d+) rooms?\)/)[1], n = +line.match(/\((\d+) tiles/)[1];
      ok(`route line ${k + 1}: the listed rooms equal the independent recomputation (${e.seq.length} rooms), K and the tile count agree, first = the stake's room, last = the objective's room`, ids.join() === e.seq.join() && K === e.seq.length && n === e.len && ids[0] === e.stakeRoom && ids[ids.length - 1] === e.objRoom, line.slice(0, 160));
    }
    // the safety cap: above 30 rooms the MIDDLE is elided, the first and the last stay
    const cap = await ev(() => { const S = window.__evo.S(), ids = [...S.types.rooms.keys()], f = window.__evo.fmtRoomSeq; const lab = (s) => s.split(' > '); const a30 = lab(f(ids.slice(0, 30))), a31 = lab(f(ids.slice(0, 31))), a40 = lab(f(ids.slice(0, 40))); const num = (t) => +String(t).match(/(\d+)$/)[1];
      return { a30: a30.length, a30first: num(a30[0]), a30last: num(a30[a30.length - 1]), a31: a31.length, a40: a40, f40: ids[0], l40: ids[39], f31: ids[0], l31: ids[30] }; });
    ok('the cap: 30 rooms are all listed; 31 and 40 elide only the MIDDLE and keep the first and the last room', cap.a30 === 30 && cap.a30first === cap.f40 && cap.a40.length === 21 && /^\.\.\. \(\+20\)$/.test(cap.a40[10]) && +cap.a40[0].match(/(\d+)$/)[1] === cap.f40 && +cap.a40[20].match(/(\d+)$/)[1] === cap.l40 && cap.a31 === 21, JSON.stringify({ a30: cap.a30, a31: cap.a31, a40: cap.a40.join(' > ') }));
    // no such line in the other modes nor in the panel without modes
    await ev(() => window.__evo.setMode('curves')); await a.idle(); await click('#examples button[data-id="real_default"]');
    await ev(() => { const e = window.__evo; e.inc.stake = { x: 200, y: 62 }; e.inc.objectives = [{ x: 122, y: 201 }]; e.draw(); }); await a.idle();
    let t = await ev(() => document.querySelector('#incInfo').innerHTML);
    ok('mode 4 (rooms on, marks placed): the usual route line is there and NO "stake first" line', /route of \d+ tiles/.test(t) && !/stake first/.test(t), t.slice(0, 120));
    // 2c. marks do not leak: another example of the SAME source clears them; so does another mode
    await click('#examples button[data-id="real_balanced"]');
    const lk = await ev(() => { const e = window.__evo; return { s: e.inc.stake, o: e.inc.objectives.length }; });
    ok('another example of the same source (mode 4 Real map · Balanced types) clears the marks placed before', lk.s === null && lk.o === 0, JSON.stringify(lk));
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); const has = await ev(() => !!window.__evo.inc.stake);
    ok('mode 2 default example places the marks again', has);
    await ev(() => window.__evo.setMode('terrain')); await a.idle();
    const lk2 = await ev(() => { const e = window.__evo; return { s: e.inc.stake, o: e.inc.objectives.length }; });
    ok('going to another mode (Terrain) from the mode 2 default example: stake null and no objectives', lk2.s === null && lk2.o === 0, JSON.stringify(lk2));
    await ev(() => window.__evo.setMode('rooms')); await a.idle(); await click('#examples button[data-id="cake60"]');
    const lk3 = await ev(() => { const e = window.__evo; return { s: e.inc.stake, o: e.inc.objectives.length, tint: e.O.typeTint, out: e.O.dioOutline }; });
    ok('another example of mode 2 (cake60): no marks, tint and outline off', lk3.s === null && lk3.o === 0 && !lk3.tint && !lk3.out, JSON.stringify(lk3));
    const b2 = await open({ w: 1500, h: 900 }); await b2.idle();
    await b2.page.evaluate(() => window.__evo.scenario('real_balanced')); await b2.idle();
    await b2.page.evaluate(() => { const e = window.__evo; e.inc.stake = { x: 200, y: 62 }; e.inc.objectives = [{ x: 122, y: 201 }]; e.draw(); }); await b2.idle();
    t = await b2.page.evaluate(() => document.querySelector('#incInfo').innerHTML);
    ok('the panel without modes: the usual route line only, no "stake first" line (byte-identical incursion text)', /route of \d+ tiles/.test(t) && !/stake first/.test(t) && !/Route \d/.test(t), t.slice(0, 120)); await b2.browser.close();

    // 3. the manifest: dacShow round trip
    await ev(() => window.__evo.setMode('rooms')); await a.idle();
    let vb = await ev(() => window.__evo.viewerBlock());
    ok('the viewer block does not write dacShow when it is "all"', vb.dacShow === undefined && vb.dacAuto === true, JSON.stringify(vb));
    await page.selectOption('#dacShow', 'cake'); await a.idle(); vb = await ev(() => window.__evo.viewerBlock());
    ok('with "cake" chosen the viewer block writes dacShow "cake"', vb.dacShow === 'cake', JSON.stringify(vb));
    const mkMan = (viewer) => { const p = path.join(os.tmpdir(), 'dac2_manifest_' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(p, JSON.stringify({ format: 'evodun-pack/0.3', name: 'dac2 test', roles: { elevation: { image: 'skeleton_heightmap_256.png', channel: 'V' } }, viewer })); return p; };
    const base = { mode: 'rooms', rooms: true, preset: 'balanced', terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120, camera: 'isoE', dacAuto: true };
    const setDisp = (out) => ev((out) => { const e = window.__evo, want = { typeTint: true, roomBorders: true, dioOutline: out }, id = { typeTint: '#t-typeTint', roomBorders: '#t-roomBorders', dioOutline: '#t-dioOutline' }; for (const k of Object.keys(want)) if (!!e.O[k] !== want[k]) document.querySelector(id[k]).click(); }, out);
    const dflags = () => ev(() => { const e = window.__evo; return { tint: !!e.O.typeTint, borders: !!e.O.roomBorders, out: !!e.O.dioOutline }; });
    for (const [label, viewer, wantShow] of [['dacShow cake', Object.assign({}, base, { dacShow: 'cake' }), 'cake'], ['dacShow ascension', Object.assign({}, base, { dacShow: 'ascension' }), 'ascension'], ['dacShow diorama', Object.assign({}, base, { dacShow: 'diorama' }), 'diorama'], ['no dacShow', base, 'all']]) {
      const isoOut = wantShow === 'cake' || wantShow === 'ascension'; // the outline is the one toggle whose isolated value differs: OFF for cake / ascension, ON for diorama
      await setDisp(isoOut); // a Display state that is NOT the isolated one (tint on, room borders on, outline ON for cake / ascension, OFF for diorama and the untouched case), so a load that does not isolate is caught; the toggles live in a folded group: DOM clicks
      const before = await dflags();
      await ev(() => window.__evo.setMode('terrain')); await a.idle(); await page.click('#examples button[data-id="images"]');
      const man = mkMan(viewer); await page.setInputFiles('#file', [PNG, man]); await page.waitForTimeout(2500); await a.idle(); fs.unlinkSync(man);
      await page.waitForFunction(() => { const S = window.__evo.S(); return S && S.rooms && document.querySelector('#busy').hidden; }, null, { timeout: 180000 }); await a.idle();
      m = await meas(); const vb2 = await ev(() => window.__evo.viewerBlock()); const after = await dflags();
      ok(`manifest ${label}: the Display toggles were NOT isolated before the load (tint on, room borders on, outline ${isoOut ? 'ON' : 'OFF'}): the check below can tell`, before.tint && before.borders && before.out === isoOut, JSON.stringify(before));
      if (wantShow === 'cake' || wantShow === 'ascension') ok(`manifest dacShow ${wantShow}: loads FULLY ISOLATED (type tint, room borders and outline all off, as the selector does; the outline was ON before the load)`, !after.tint && !after.borders && !after.out, JSON.stringify(after));
      if (wantShow === 'diorama') { const s1 = await sig(); await ev(() => document.querySelector('#t-dioOutline').click()); await a.idle(); const s2 = await sig(); await ev(() => document.querySelector('#t-dioOutline').click()); await a.idle();
        ok('manifest dacShow diorama: loads with the footprint outline ON and the picture is not the plain map (switching the outline off changes it), tint and room borders off', after.out && !after.tint && !after.borders && s1 !== s2, JSON.stringify(after)); }
      if (wantShow === 'all') ok('manifest without dacShow: the Display toggles (tint, room borders, outline) are untouched by the load', JSON.stringify(after) === JSON.stringify(before), JSON.stringify({ before, after }));
      ok(`manifest ${label}: loads with Show framing "${wantShow}" (selector, state and real shape agree) and saves the same value`, m.sel === wantShow && (wantShow === 'all' ? m.rings > 0 && m.faces > 0 : want[wantShow](m)) && (wantShow === 'all' ? vb2.dacShow === undefined : vb2.dacShow === wantShow), JSON.stringify(m));
    }
    { // edge: dacShow saved with the rule OFF -> the selector has no effect, so the load does not isolate the Display toggles either
      await setDisp(false); const before = await dflags(); await ev(() => window.__evo.setMode('terrain')); await a.idle(); await page.click('#examples button[data-id="images"]');
      const man = mkMan(Object.assign({}, base, { dacAuto: false, dacShow: 'cake' })); await page.setInputFiles('#file', [PNG, man]); await page.waitForTimeout(2500); await a.idle(); fs.unlinkSync(man);
      await page.waitForFunction(() => { const S = window.__evo.S(); return S && S.rooms && document.querySelector('#busy').hidden; }, null, { timeout: 180000 }); await a.idle();
      const after = await dflags(), off = await ev(() => !window.__evo.st.dacAuto);
      ok('manifest dacShow cake with dacAuto false: the rule is off and the Display toggles are untouched (the isolation follows the selector, which has no effect then)', off && JSON.stringify(after) === JSON.stringify(before), JSON.stringify({ before, after, off }));
    }
  }

  // ---- DAC v2 (docs/crystallizers/02-room-types/README.md D23-D26): CHAIN VIEW, gate markers, non-walkable anchors, terH up to 10
  {
    const click = async (sel) => { await page.click(sel); await a.idle(); };
    const csig = () => ev(() => [...document.querySelectorAll('#stage canvas')].filter((c) => !c.closest('figure').hidden).map((c) => c.toDataURL('image/png')).join('|')); // the canvases only (the info line carries timings)
    const toggle = async (id) => { await ev((id) => document.querySelector(id).click(), id); await a.idle(); };
    const ypx = () => ev(() => { const cv = [...document.querySelectorAll('#stage canvas')].find((c) => !c.closest('figure').hidden), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] >= 250 && d[i + 1] >= 232 && d[i + 1] <= 248 && d[i + 2] >= 40 && d[i + 2] <= 95) n++; return n; }); // the gate line colour (255, 240, 60)
    const snap = (far) => ev((far) => { const e = window.__evo, S = e.S(), E = window.EVO, T = E.roomTypes, nm = (id) => { const o = S.types.rooms.get(id); return o ? (o.type === T.CAKE ? 'Cake' : o.type === T.DIORAMA ? 'Dio' : 'Asc') + ' ' + id : '?' + id; };
      const tile = (q) => (q.y - S.oy) * S.W + (q.x - S.ox), st0 = e.inc.stake ? tile(e.inc.stake) : -1;
      const routes = e.inc.objectives.map((q) => { const r = st0 >= 0 ? E.route(S, e.P, tile(q), st0) : null; return r ? r.length : -1; });
      // a route that needs ramps OUTSIDE the chain: the stake to an off-chain tile of the main region (picked in the chain view, the same tile in the whole view): the walking graph must not lose the ramps the chain pass drops from S.stairs
      let farTile = far === undefined ? -1 : far; if (far === undefined && S.chainGrey && st0 >= 0) { const mr = S.region[st0]; for (let i = S.n - 1; i >= 0; i--) if (S.chainGrey[i] && S.region[i] === mr) { farTile = i; break; } }
      const fr = farTile >= 0 && st0 >= 0 ? E.route(S, e.P, farTile, st0) : null, farRoute = fr ? fr.length : -1;
      const lh = (i) => S.levelH[S.fine[i]], grey = (i) => !!(S.levelMeta[S.fine[i]] && S.levelMeta[S.fine[i]].grey), anch = (i) => !!(S.levelMeta[S.fine[i]] && S.levelMeta[S.fine[i]].anchor);
      let greyN = 0, chainGrey = 0, offNotGrey = 0, ringKeptWrong = 0, anchN = 0; const chain = new Set(e.P.chainIds || []), claim = S.cake && S.cake.claim, fw = S.mapW;
      for (let i = 0; i < S.n; i++) { if (S.void && S.void[i]) continue; if (anch(i)) anchN++; if (!S.chainGrey) continue;
        const ring = S.ringTile && S.ringTile[i] && claim && (() => { const c = claim.get(((((i / S.W) | 0) + S.oy) * fw + (i % S.W) + S.ox)); return c && chain.has(c.link.room); })();
        if (grey(i)) { greyN++; if (chain.has(S.roomMap[i])) chainGrey++; if (ring) ringKeptWrong++; } else if (!chain.has(S.roomMap[i]) && !ring && !anch(i)) offNotGrey++; }
      return { chain: S.chain || null, ids: e.P.chainIds ? e.P.chainIds.length : 0, seqs: (e.P.chainSeqs || []).map((q) => q.map(nm)), routes, region: Array.from(S.region).join(','), levels: S.levelH.length, greyN, chainGrey, offNotGrey, ringKeptWrong, anchN, farTile, farRoute, anchInfo: S.anchorInfo || null, gateBits: S.gateBits ? Array.from(S.gateBits).filter(Boolean).length : 0, view: e.st.dacView, info: document.querySelector('#info').innerText }; }, far);
    await ev(() => window.__evo.setMode('rooms')); await a.idle();
    const out = {};
    for (const id of ['real_balanced', 'real_chain5']) {
      await click(`#examples button[data-id="${id}"]`); const c = await snap(); out[id] = c;
      const types = new Set(c.seqs.flat().map((x) => x.split(' ')[0]));
      ok(`${id}: the Chain view is the default (selector Chain), the chain has ${c.ids} rooms and a route to both objectives`, c.view === 'chain' && c.chain && c.ids > 3 && c.routes.length === 2 && c.routes.every((r) => r > 0), JSON.stringify({ ids: c.ids, routes: c.routes }));
      ok(`${id}: the chain contains at least one Cake, one Ascension and one Diorama (AOK-1)`, types.has('Cake') && types.has('Asc') && types.has('Dio'), [...types].join());
      console.log(`    ${id} CHAIN (stake first): ${c.seqs.map((q) => q.join(' > ')).join('  ||  ')}`);
      ok(`${id}: every off-chain land tile is flattened to the grey level, no chain-room tile is, and no ring tile of a chain Cake link is flattened`, c.greyN === c.chain.tiles && c.chainGrey === 0 && c.offNotGrey === 0 && c.ringKeptWrong === 0, JSON.stringify({ greyN: c.greyN, tiles: c.chain.tiles, chainGrey: c.chainGrey, offNotGrey: c.offNotGrey, ringKeptWrong: c.ringKeptWrong }));
      console.log(`    ${id}: ring tiles of the chain Cake links ${c.chain.chainRingTiles}, of them OUTSIDE the chain rooms ${c.chain.ringOutside} (kept); ring tiles of off-chain links flattened ${c.chain.ringOffChainLinks}; flattened tiles ${c.chain.tiles}; ramps dropped ${c.chain.stairsDropped}; gate faces ${c.chain.gateFaces}`);
      // the chain view is visual only: the same regions and routes as the whole map
      await page.selectOption('#dacView', 'whole'); await a.idle(); const w = await snap(c.farTile);
      ok(`${id}: Whole map: no chain, no grey level (levels ${w.levels} vs ${c.levels} with the chain), the regions and the route lengths are IDENTICAL to the chain view (visual only)`, !w.chain && w.greyN === 0 && w.region === c.region && JSON.stringify(w.routes) === JSON.stringify(c.routes) && c.levels === w.levels + 1, JSON.stringify({ wl: w.levels, cl: c.levels, wr: w.routes, cr: c.routes }));
      ok(`${id}: a route from the stake to an off-chain tile of the main region (it needs ramps the chain pass drops from S.stairs) has the same length in the chain view and in the whole map (${c.farRoute})`, c.farTile >= 0 && c.farRoute > 0 && w.farRoute === c.farRoute, JSON.stringify({ far: c.farTile, chain: c.farRoute, whole: w.farRoute }));
      await page.selectOption('#dacView', 'chain'); await a.idle();
    }
    // no stake: Chain falls back to the whole map with a notice in the info
    await click('#examples button[data-id="real_balanced"]'); await click('#m-clear'); let c0 = await snap();
    ok('Chain without a stake / objectives: the whole map is shown and the info says so', !c0.chain && /needs a stake and an objective/.test(c0.info), c0.info.slice(-160));
    // a room chosen: the view applies to the whole map only
    await click('#examples button[data-id="real_balanced"]'); await click('#roomChips .chip[data-id="60"]'); c0 = await snap();
    ok('a room chosen with the Chain selector on: no chain (the room is shown as in #38)', !c0.chain && c0.greyN === 0 && /a room is chosen/.test(c0.info));
    await click('#wholeRooms');

    // GATE MARKERS: lines on the open borders between consecutive chain rooms; the toggle changes the picture; the stubs of cut Ascension walls are darker
    await click('#examples button[data-id="real_balanced"]'); let g = await snap(); const s1 = await csig();
    ok('gate markers: the gate faces exist (S.gateBits) and the toggle is on by default in the chain view', g.gateBits > 0 && (await ev(() => window.__evo.O.gateMarks)) === true, String(g.gateBits));
    const y1 = await ypx(); await toggle('#t-gateMarks'); const s2 = await csig(); const y2 = await ypx(); await toggle('#t-gateMarks'); const s3 = await csig();
    ok(`gate markers: the bright gate LINES are in the picture (${y1} pixels of the gate colour with the toggle on, ${y2} with it off)`, y1 - y2 > 150, JSON.stringify({ on: y1, off: y2 }));
    ok('gate markers: switching the toggle off changes the picture and back on restores it exactly', s1 !== s2 && s1 === s3);
    await toggle('#t-roomBorders'); await toggle('#t-dioOutline'); const y3 = await ypx(); await toggle('#t-dioOutline'); await toggle('#t-roomBorders'); // (the room borders AND the Diorama outline off: both make the renderer read the border bits) with the room borders off only the gate faces carry lines: ALL the gate faces (also the open ones nobody uses), so the lines do not depend on the border overlay
    ok(`gate markers: with the room borders and the Diorama outline OFF the gate lines are still drawn (${y3} pixels of the gate colour), and there are at least as many as the ones that coincide with a used border`, y3 > 150 && y3 >= y1 - 5, JSON.stringify({ y3, y1 }));
    await page.selectOption('#dacView', 'whole'); await a.idle(); const s4 = await csig(); await toggle('#t-gateMarks'); const s5 = await csig(); await toggle('#t-gateMarks');
    ok('gate markers: outside the chain view the toggle changes nothing (no gate faces: today\'s pixels)', s4 === s5); await page.selectOption('#dacView', 'chain'); await a.idle();

    // NON-WALKABLE AS ANCHORS
    const before = await snap(); await toggle('#t-anchors'); const an = await snap();
    ok('anchors: the checkbox raises the non-walkable tiles of the chain rooms (tiles, new levels), the regions and the routes are unchanged', an.anchInfo && an.anchInfo.tiles > 0 && an.anchN === an.anchInfo.tiles && an.region === before.region && JSON.stringify(an.routes) === JSON.stringify(before.routes), JSON.stringify(an.anchInfo));
    const rz = await ev(() => { const e = window.__evo, S = e.S(); let bad = 0, n = 0, inGrey = 0; for (let i = 0; i < S.n; i++) { const m = S.levelMeta[S.fine[i]]; if (m && m.anchor) { n++; if (S.chainGrey && S.chainGrey[i]) inGrey++; if (!(S.nowalk[i] === 1 || S.nowalk[i] === 0)) bad++; } } return { n, inGrey, up: S.anchorInfo.up, terH: e.P.terH }; });
    ok('anchors: none of the raised tiles is on the flat grey ground (in the Chain view only the chain rooms are raised) and the raise is anchorH x terH', rz.inGrey === 0 && Math.abs(rz.up - 0.5 * rz.terH) < 1e-9, JSON.stringify(rz));
    console.log(`    anchors (default example, chain view): ${an.anchInfo.tiles} tiles raised, ${an.anchInfo.levelsAdded} levels added (levels ${before.levels} -> ${an.levels})`);
    await ev(() => { const el = document.querySelector('#s-anchorH'); el.value = '1.5'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle(); const an2 = await snap();
    ok('anchors: the slider changes the raise (1.5 terraces)', an2.anchInfo && Math.abs(an2.anchInfo.up - 1.5 * 1.0) < 1e-9, JSON.stringify(an2.anchInfo));
    await ev(() => { const el = document.querySelector('#s-anchorH'); el.value = '0.5'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle();
    await toggle('#t-anchors'); const off = await snap();
    ok('anchors off: the shape is back to the one before (levels, regions, no anchor info)', !off.anchInfo && off.levels === before.levels && off.region === before.region);

    // TERRACE HEIGHT up to 10
    const mx = await ev(() => document.querySelector('#s-terH').max);
    ok('terrace height: the slider goes up to 10 (was 2.5), default 1', mx === '10' && (await ev(() => window.__evo.P.terH)) === 1, mx);
    for (const v of [3, 10]) { await ev((v) => { const el = document.querySelector('#s-terH'); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v); await a.idle();
      const r = await ev(() => { const S = window.__evo.S(); return { terH: window.__evo.P.terH, ramps: S.stairInfo.placed, walk: S.regionSizes.length }; });
      ok(`terrace height ${v}: the shape builds, ramps are carved (${r.ramps}) and the chain is still there`, r.terH === v && r.ramps > 0 && (await snap()).chain !== null, JSON.stringify(r)); }
    await ev(() => { const el = document.querySelector('#s-terH'); el.value = '1'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle();

    // manifest: dacView and anchors
    let vb = await ev(() => window.__evo.viewerBlock());
    ok('the viewer block writes dacView "chain" in mode 2 and no anchors when they are off', vb.dacView === 'chain' && vb.anchors === undefined && vb.anchorH === undefined, JSON.stringify(vb));
    await page.selectOption('#dacView', 'whole'); await a.idle(); await toggle('#t-anchors'); vb = await ev(() => window.__evo.viewerBlock());
    ok('with Whole map and anchors on the viewer block writes dacView "whole", anchors true', vb.dacView === 'whole' && vb.anchors === true, JSON.stringify(vb));
    await toggle('#t-anchors');
  }

  // ---- UI fix (U14): technique C in mode 1 (Terrain) + the wall-pass work budget (D24)
  {
    await ev(() => window.__evo.setMode('terrain')); await a.idle();
    const vis = (sel) => ev((sel) => { const el = document.querySelector(sel); return !!el && !el.closest('.mh') && !el.closest('[hidden]') && el.offsetParent !== null; }, sel);
    const dis = (sel) => ev((sel) => { const el = document.querySelector(sel); return el ? { d: !!el.disabled, t: el.title || (el.closest('label') || {}).title || '' } : null; }, sel);
    const bar = await ev(() => [...document.querySelectorAll('#techs button')].filter((b) => !b.closest('.mh') && !b.hidden && b.offsetParent !== null).map((b) => b.dataset.id));
    ok('mode 1: the bar offers Box, A, B and C (the Compare grid has four panels)', bar.join() === 'box,A,B,C', bar.join());
    const st0 = await ev(() => ({ tech: window.__evo.st.tech, mode: window.__evo.st.mode }));
    ok('mode 1: the default technique stays A and Compare stays on at entry', st0.tech === 'A' && st0.mode === 'compare', JSON.stringify(st0));
    for (const id of ['#curvesPreset', '#wallPass', '#s-wallExtrude']) ok(`mode 1: C's main control ${id} is visible`, await vis(id));
    for (const id of ['#s-wallStrata', '#s-wallColumn', '#s-t2Spacing']) ok(`mode 1: C's advanced control ${id} is folded (not visible)`, !(await vis(id)));
    // Compare shows C: the controls are enabled; one click on A (single): greyed with "Requires: ... technique C"; one click on C: enabled and ONE canvas
    const en1 = await dis('#curvesPreset'); ok('mode 1 Compare: Curves preset is enabled (C is on screen)', en1 && !en1.d, JSON.stringify(en1));
    await page.click('#techs button[data-id="A"]'); await a.idle();
    const g = await dis('#curvesPreset'), gw = await dis('#wallPass');
    ok('mode 1, A alone: the C controls are greyed with "Requires: ... technique C"', g.d && /Requires:.*C/.test(g.t) && gw.d && /Requires:.*C/.test(gw.t), JSON.stringify([g, gw]));
    await page.click('#techs button[data-id="C"]'); await a.idle();
    const one = await ev(() => ({ n: [...document.querySelectorAll('#stage canvas')].filter((c) => !c.closest('figure').hidden).length, tech: window.__evo.st.tech, mode: window.__evo.st.mode, lbl: [...document.querySelectorAll('#stage figure:not([hidden]) figcaption, #stage figure:not([hidden]) .lab')].map((x) => x.textContent).join('|') }));
    ok('mode 1: clicking C draws C alone (one panel, single view)', one.n === 1 && one.tech === 'C' && one.mode === 'single', JSON.stringify(one));
    const en2 = await dis('#curvesPreset'), en3 = await dis('#wallPass');
    ok('mode 1, C alone: the C controls are enabled', !en2.d && !en3.d, JSON.stringify([en2, en3]));
    // the freeze state: real map, Compare, Terraces 15, Height spread 2.2 -> the budget skips the wall pass; Off costs nothing; times bounded
    await page.click('#examples button[data-id="real_map"]'); await a.idle(); await page.click('#mode'); await a.idle();
    await a.slider('terraces', 15); await a.idle();
    const t0 = Date.now(); await a.slider('spread', 2.2); await a.idle(); const ms = Date.now() - t0;
    const fz = await ev(() => { const e = window.__evo; return { skipped: !!e.S().wallSkipped, work: e.S().wallSkipped && Math.round(e.S().wallSkipped.work), budget: e.S().wallSkipped && e.S().wallSkipped.budget, info: document.querySelector('#info').textContent, mode: e.st.mode, n: [...document.querySelectorAll('#stage canvas')].filter((c) => !c.closest('figure').hidden).length }; });
    ok(`freeze state (Compare, real map, 15 terraces, spread 2.2): the wall pass is skipped (S.wallSkipped, work ${fz.work} > ${fz.budget}) and the page is ready in ${ms} ms (bound 10000 ms)`, fz.skipped && fz.mode === 'compare' && fz.n === 4 && ms < 10000, JSON.stringify({ ms, skipped: fz.skipped, work: fz.work, mode: fz.mode, n: fz.n }));
    ok('freeze state: the info line says the wall pass of C was skipped and why', /Wall pass of C skipped: cliffs too tall/.test(fz.info), fz.info.slice(-260));
    await page.selectOption('#wallPass', 'off'); const t1 = Date.now(); await a.idle(); const msOff = Date.now() - t1;
    const off = await ev(() => ({ skipped: !!window.__evo.S().wallSkipped, info: document.querySelector('#info').textContent }));
    ok(`freeze state with Wall pass Off: nothing is skipped or reported (Off skips the whole build), ready in ${msOff} ms`, !/Wall pass of C skipped/.test(off.info) && msOff < 10000, JSON.stringify({ msOff, skipped: off.skipped }));
    await page.selectOption('#wallPass', 't3'); await a.slider('terraces', 5); await a.idle(); await a.slider('spread', 1); await a.idle();
    const back = await ev(() => ({ skipped: !!window.__evo.S().wallSkipped, info: document.querySelector('#info').textContent }));
    ok('back under the budget (5 terraces, spread 1, T3): the wall pass is built again and the skip note is gone', !back.skipped && !/Wall pass of C skipped/.test(back.info) && /Wall pass/.test(back.info), back.info.slice(-200));
  }

  console.log('errors:', a.errs); ok('no page errors', a.errs.length === 0); await a.browser.close();
})();
