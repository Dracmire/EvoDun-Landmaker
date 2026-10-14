/* The controls panel (src/controls.js, docs/controls.md): for every control of the table, requirement NOT met -> disabled + a tooltip that starts with "Requires:" and lists only what to activate; requirement met -> enabled + the help
   tooltip; checked over the scenarios (and a few states: one technique alone, Cam 6, images loaded). Every control of the panel has an entry; the original tooltips (Cam 1-7, Stage preset) are kept; a disabled control cannot be clicked;
   an ON control whose requirement is lost keeps its value, shows "inactive", and the picture comes back when the requirement does; the scenario buttons set what they say; the built-in real map equals the same PNG loaded as a file.
     NODE_PATH=$(npm root -g) node tools/ui/test_controls_ui.js */
const path = require('path');
const { open } = require('./common');
const PNG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, ev = (f, ...x) => page.evaluate(f, ...x);
  const crypto = require('crypto'), hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex'), settle = async () => { await a.idle(); await page.waitForTimeout(300); },
    /* the info line grows AFTER a paint and changes the height of the panels (report (a) of the controls task: the same state paints at 332 and 391 px), so a picture is compared after a second redraw at the settled size */
    stable = async () => { await settle(); await ev(() => window.__evo.draw()); await settle(); return hash(); };
  /* the state of every table entry in the DOM, checked against the table evaluated on the live state */
  const audit = (label) => ev(() => {
    const C = window.EVO.controls, ctx = window.__evo.controlsCtx(), bad = [], seen = { unmet: 0, met: 0 };
    for (const en of C.TABLE) {
      const els = [...document.querySelectorAll(en.dom)]; if (!els.length) continue;
      const tip = C.tipOf(en, ctx), off = els.every((e) => e.disabled), on = els.every((e) => !e.disabled);
      const h = (el) => (en.dom.includes(',') || els.length > 1 ? el : el.closest('label.sl, label.tg') || el.closest('.row') || el), title = h(els[0]).title;
      if (tip.ok) { seen.met++; if (!on) bad.push(en.id + ': met but disabled'); if (!en.keep && title !== en.help) bad.push(en.id + ': met, tooltip is not the help text: ' + title); if (en.keep && !els.every((e) => e.title)) bad.push(en.id + ': kept tooltip missing'); }
      else { seen.unmet++; if (!off) bad.push(en.id + ': unmet but enabled'); if (!title.startsWith('Requires: ')) bad.push(en.id + ': unmet, tooltip does not start with Requires: ' + title); if (en.help && title.includes(en.help)) bad.push(en.id + ': unmet tooltip carries the help text'); if (title !== C.requiresText(C.unmet(en, ctx))) bad.push(en.id + ': unmet tooltip is not the list of what to activate: ' + title); }
    }
    return { bad, seen };
  }).then((r) => { ok(`${label}: every control is disabled + "Requires: ..." when its requirement is not met, enabled + help when it is (${r.seen.unmet} unmet, ${r.seen.met} met)`, r.bad.length === 0, r.bad.slice(0, 4).join(' | ')); return r; });
  const state = (sel) => ev((s) => { const e = document.querySelector(s); return e ? { disabled: e.disabled, checked: e.checked, title: (e.closest('label.sl, label.tg') || e).title, inact: !!(e.closest('label.sl, label.tg') || e).querySelector('.inact') } : null; }, sel);
  const scn = async (id) => { await page.click(`#scenarios button[data-id=${id}]`); await settle(); };

  // ---- panel structure
  await page.click('#mode'); await a.idle(); await page.click('#mode'); await a.idle(); // back to the default (compare on)
  const heads = await ev(() => [...document.querySelectorAll('aside h3, aside details.grp > summary')].map((h) => h.textContent));
  ok('the panel is grouped by crystallizer, in order', ['Scenarios', '1 Terrain', '2 Room types', '3 Stage', '4 Curves (C)', 'Floors', 'Shared passes', 'Overlays', 'Incursion', 'Diagnostics'].every((g, i, arr) => heads.findIndex((h) => h.toLowerCase().includes(g.toLowerCase())) >= (i ? heads.findIndex((h) => h.toLowerCase().includes(arr[i - 1].toLowerCase())) : 0)), heads.join(' > '));
  ok('Diagnostics is a folded group (regions, stair marks, edge-problem outline)', await ev(() => { const d = document.querySelector('details.grp[data-group="Diagnostics"]'); return !!d && !d.open && !!d.querySelector('#t-regions') && !!d.querySelector('#t-passes') && !!d.querySelector('#t-edgeWarn'); }));
  ok('the technique badges [A] [B] [C] are on the single-technique controls only', await ev(() => { const b = [...document.querySelectorAll('.bdg')].map((x) => x.textContent + ':' + (x.closest('label').querySelector('input,select').id)); return b.includes('A:s-smooth') && b.includes('B:s-radius') && b.includes('C:curvesPreset') && b.includes('C:wallPass') && b.includes('C:s-wallExtrude') && b.length === 11; }));
  // ---- every control of the panel has an entry
  const orphans = await ev(() => { const C = window.EVO.controls, sel = C.TABLE.map((e) => e.dom).join(','), retired = C.RETIRED.map((r) => r.dom).join(',');
    return [...document.querySelectorAll('aside input, aside select, aside button, #bar button, #bar select')].filter((e) => !e.matches(sel) && !e.matches(retired) && !e.classList.contains('chip') && !e.closest('#zoneChips, #roomChips, #floorChips, #macroChips, #roles')).map((e) => e.id || e.textContent); });
  ok('every control of the panel has an entry in the table (or is the retired layout selector)', orphans.length === 0, orphans.join(','));
  ok('the retired #layout selector is still in the DOM and hidden, not in the table', await ev(() => { const l = document.querySelector('#layout'); return !!l && l.hidden && !window.EVO.controls.TABLE.some((e) => e.dom.includes('#layout')); }));
  // ---- the original tooltips (Cam 1-7, Stage preset) are kept
  ok('the 8 original tooltips are kept', await ev(() => { const t = [...document.querySelectorAll('#presets button')].map((b) => b.title); return t.length === 7 && t.every((x) => /^Cam \d ·/.test(x)) && /^Stage preset: Cam 6/.test(document.querySelector('#stagePreset').title); }));

  // ---- default state (Snake surface, rooms off)
  await audit('default state (Snake surface, Compare)');
  let s = await state('#t-cake'); ok('Cake rings: greyed with the rooms requirement', s.disabled && s.title === 'Requires: turn on Rooms', s.title);
  s = await state('#t-contract'); ok('Art contract: enabled with the help text (it draws in Box, A, B and C)', !s.disabled && /Box, A, B and C/.test(s.title), s.title);
  s = await state('#s-smooth'); ok('A · Chaikin passes: enabled in Compare', !s.disabled);
  await a.tech('A'); await audit('technique A alone');
  s = await state('#s-radius'); ok('B · Field blur: greyed when B is not shown', s.disabled && /show technique B/.test(s.title), s.title);
  s = await state('#curvesPreset'); ok('Curves preset: greyed when C is not shown', s.disabled && /show technique C/.test(s.title), s.title);
  await a.tech('C'); s = await state('#s-wallStrata'); ok('C alone: T3 sliders enabled, T2 sliders greyed (Wall pass T3)', !s.disabled && (await state('#s-t2Rows')).disabled);
  await page.selectOption('#wallPass', 't2'); await settle(); ok('Wall pass T2: the T2 sliders are enabled, the T3 ones greyed, Wall extrusion enabled', !(await state('#s-t2Rows')).disabled && (await state('#s-wallStrata')).disabled && !(await state('#s-wallExtrude')).disabled);
  await page.selectOption('#wallPass', 'off'); await settle(); ok('Wall pass Off: Wall extrusion greyed (it needs T3 or T2)', (await state('#s-wallExtrude')).disabled);
  await page.selectOption('#wallPass', 't3'); await settle();
  await ev(() => window.__evo.set({ mode: 'compare' })); await a.preset('stage'); await settle();
  await ev(() => document.querySelector('#mode').click()); await a.idle(); // single, B
  await a.preset('oblique'); await settle();
  // a disabled control cannot be used
  await page.click('#mode'); await a.idle(); // compare again
  let clicked = true; try { await page.click('#t-cake', { timeout: 1500 }); } catch (e) { clicked = false; }
  ok('a disabled control cannot be clicked (Cake rings with Rooms off), and nothing changed', !clicked && (await ev(() => !window.__evo.P.cake)));

  // ---- real map, Default: rooms found; Cake and Ascension exist, Pocket has no Diorama
  await scn('real_default'); await audit('Real map · Default');
  ok('the scenario set the real map, Rooms on, terraces 5 (32 rooms)', await ev(() => { const e = window.__evo, S = e.S(); return e.st.pack === 'real_map' && e.P.rooms && e.P.terraces === 5 && S.rooms.stats.rooms === 32; }));
  s = await state('#t-cake'); ok('Cake rings: enabled with rooms found', !s.disabled && /Cake rings/.test(s.title), s.title);
  s = await state('#t-pocket'); ok('Pocket view: greyed, "a map with at least one Diorama room" (Default has none)', s.disabled && /Diorama room/.test(s.title), s.title);
  s = await state('#s-cakeLayers'); ok('Cake sliders: greyed until Cake rings is on', s.disabled && /turn on Cake rings/.test(s.title) && !/Rooms/.test(s.title), s.title);
  // an ON control whose requirement is lost keeps its value and its effect returns with the requirement
  await page.click('#t-cake'); const hCake = await stable(); s = await state('#s-cakeLayers'); ok('Cake on: its sliders are enabled', !s.disabled);
  await page.click('#t-rooms'); const hOff = await stable();
  s = await state('#t-cake'); ok('Rooms off: Cake rings keeps its value (checked), is greyed and says "inactive"', s.checked && s.disabled && s.inact && s.title === 'Requires: turn on Rooms', JSON.stringify(s));
  ok('and the picture is the one without rooms', hOff !== hCake);
  await page.click('#t-rooms'); const hBack = await stable(); ok('Rooms back on: the effect of Cake rings returns (same picture as before)', hBack === hCake && !(await state('#t-cake')).disabled && !(await state('#t-cake')).inact);
  await page.click('#t-cake'); await settle();
  // ---- real map, Balanced types: Diorama rooms exist
  await scn('real_balanced'); await audit('Real map · Balanced types');
  s = await state('#t-pocket'); ok('Pocket view: enabled (Balanced types has Diorama rooms)', !s.disabled, s.title);
  s = await state('#t-dioOutline'); ok('Diorama footprint outline: enabled', !s.disabled);
  // ---- Pocket · Diorama 31
  await scn('pocket31'); await audit('Pocket · Diorama 31');
  ok('the pocket scenario: Balanced types, chip 31, Pocket on, Cam 1, a pocket is drawn', await ev(() => { const e = window.__evo, S = e.S(); return e.P.rooms && e.P.pocket && e.st.preset === 'isoE' && e.P.terraces === 3 && !!S.pocketInfo && e.sliceSel.rooms.has(31); }));
  s = await state('#pocketFraming'); ok('Pocket framing: enabled with the pocket on', !s.disabled);
  // ---- Shrine-Pier x4 · Stage
  await scn('x4_stage'); await audit('Shrine-Pier x4 · Stage');
  ok('the Stage scenario: Cam 6, B, single, terraces 7, spread 1.5, Art contract on', await ev(() => { const e = window.__evo; return e.st.preset === 'stage' && e.st.tech === 'B' && e.st.mode === 'single' && e.P.terraces === 7 && e.P.spread === 1.5 && e.O.contract && document.querySelector('#t-contract').checked; }));
  s = await state('#t-features'); ok('Water / snake / cave: enabled on a pack that has masks', !s.disabled);
  // ---- Snake surface · Curves C
  await scn('snake_curves'); await audit('Snake surface · Curves C');
  ok('the Curves scenario: the default source, C alone, Cam 3, defaults (terraces 5, contract off)', await ev(() => { const e = window.__evo; return e.st.pack === 'snake_surface' && e.st.tech === 'C' && e.st.mode === 'single' && e.st.preset === 'oblique' && e.P.terraces === 5 && !e.O.contract; }));
  s = await state('#curvesPreset'); ok('Curves preset: enabled with C alone', !s.disabled && /Ordered, Balanced or Natural/.test(s.title));
  // ---- Snake · Floors
  await scn('snake_floors'); await audit('Snake · Floors'); s = await state('#floorsView'); ok('Floors view: enabled on the floors pack', !s.disabled);
  await a.preset('stage'); await settle();
  ok('Cam 6: the Stack and Cutaway options are greyed ("an orthographic camera")', await ev(() => [...document.querySelectorAll('#floorsView option')].filter((o) => o.disabled).map((o) => o.value + ':' + o.title).join('|') === 'stack:Requires: use an orthographic camera (not Cam 6)|cut:Requires: use an orthographic camera (not Cam 6)'));
  await audit('Floors in Cam 6'); s = await state('#m-stake'); ok('Place stake: enabled on a single floor', !s.disabled);
  await a.preset('isoE'); await page.selectOption('#floorsView', 'cut'); await settle(); s = await state('#m-stake');
  ok('Place stake: greyed in the Cutaway ("set Floors view to Single floor")', s.disabled && /Single floor/.test(s.title), s.title);
  await page.selectOption('#floorsView', 'single'); await settle();
  // ---- images loaded: roles
  await scn('real_default'); await page.setInputFiles('#file', [PNG]); await page.waitForTimeout(1500); await settle(); await audit('a loaded PNG (roles)');
  s = await state('#flipy'); ok('Flip Y: enabled once images are loaded', !s.disabled);
  ok('the built-in real map equals the same PNG loaded as a file (value for value)', await ev(() => { const a1 = window.__evo.packs.real_map.pack.elevation, a2 = window.__evo.packs.image.pack.elevation; return a1.length === a2.length && a1.every((v, i) => v === a2[i]); }));
  console.log('errors:', a.errs); ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
