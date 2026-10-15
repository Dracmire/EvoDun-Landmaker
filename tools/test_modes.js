/* The modes table (src/modes.js): consistency with the controls table (src/controls.js), with the sources and the manifest, and docs/modes.md in sync.
   The DOM side (the default example of each mode, what is visible, cameras and techniques) is tools/ui/test_modes_ui.js.   node tools/test_modes.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { generate } = require('./gen_modes_doc.js');
const { modes: M, controls: C } = generate();
let fail = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined && x !== '' ? '  ' + x : '')); if (!c) fail++; };
const tableIds = C.TABLE.map((e) => e.id), mentioned = new Set();
const ids = (m) => [...m.main, ...m.advanced, ...m.slice, ...m.fixed, ...m.common.shared];
for (const m of M.MODES) ids(m).forEach((x) => mentioned.add(x));
M.TERRAIN_MAIN.forEach((x) => mentioned.add(x)); M.OVERLAYS.concat(M.DIAGNOSTICS).forEach((x) => mentioned.add(x)); mentioned.add('incursion');
for (const k of Object.values(M.COMMON)) k.forEach((x) => mentioned.add(x));
ok('mode ids are unique and numbered 1..6 in order', new Set(M.IDS).size === M.IDS.length && M.MODES.every((m, i) => m.number === i + 1));
ok('every control id named by a mode (main, advanced, slice, fixed, shared, overlays, diagnostics, common) exists in the controls table', [...mentioned].every((x) => tableIds.includes(x)), [...mentioned].filter((x) => !tableIds.includes(x)).join(','));
ok('every control of the table belongs to at least one mode or to the common area', tableIds.every((x) => mentioned.has(x)), tableIds.filter((x) => !mentioned.has(x)).join(','));
ok('no control is both main and advanced in a mode', M.MODES.every((m) => !m.main.some((x) => m.advanced.includes(x))));
ok('every example names an existing source (or is "Your images")', M.MODES.every((m) => m.examples.every((e) => (e.images && !e.src) || M.SOURCES.includes(e.src))), '');
ok('the first example of a mode has a source (it is loaded on entering)', M.MODES.every((m) => !!m.examples[0].src));
ok('example ids are unique inside a mode and every example has a label', M.MODES.every((m) => new Set(m.examples.map((e) => e.id)).size === m.examples.length && m.examples.every((e) => e.label)));
ok('the default camera is offered, the default technique is offered, and Compare modes are 1 and 4 only', M.MODES.every((m) => m.cameras.includes(m.camera) && m.techs.includes(m.tech)) && M.MODES.filter((m) => m.compare).map((m) => m.id).join() === 'terrain,curves');
ok('cameras are ids of the camera bank', M.MODES.every((m) => m.cameras.every((c) => M.CAMS.includes(c))));
ok('the examples that set rooms exist only in modes that can show them (2, 3, 4)', M.MODES.every((m) => !m.examples.some((e) => e.rooms) || ['rooms', 'stage', 'curves'].includes(m.id)));
ok('mode 2 fixes Rooms on (t-rooms hidden) and only offers examples with rooms', M.byId('rooms').fixed.includes('t-rooms') && M.byId('rooms').examples.every((e) => e.rooms));
ok('Floors is the Archived mode; Macroform shows outlines only among the shared passes and no incursion', M.byId('floors').group === 'archived' && M.MODES.filter((m) => m.group === 'archived').length === 1 && M.byId('macroform').common.shared.join() === 'outlines' && M.byId('macroform').common.incursion === false);
ok('banners: Stage, Floors and Macroform have one, the others do not', ['stage', 'floors', 'macroform'].every((id) => M.byId(id).banner) && ['terrain', 'rooms', 'curves'].every((id) => !M.byId(id).banner));
ok('a mode that folds the terrain controls lists none of them as its own', M.MODES.filter((m) => m.terrain === 'folded').every((m) => !M.TERRAIN_MAIN.some((x) => m.main.includes(x))));
// the plan of a mode: what is shown
const p1 = M.plan(M.byId('terrain'), {}), p2 = M.plan(M.byId('rooms'), {}), p5s = M.plan(M.byId('floors'), { floorsView: 'single' }), p5c = M.plan(M.byId('floors'), { floorsView: 'cut' }), p6 = M.plan(M.byId('macroform'), {});
ok('plan: mode 1 shows the terrain controls; mode 2 folds them and hides t-rooms', p1.terraces === 'show' && p2.terraces === 'fold' && !p2['t-rooms'] && p2.roomsPreset === 'show' && p2.roomsMinCore === 'adv');
ok('plan: the incursion is hidden in mode 6 and in the Stack / Cutaway of mode 5', !p6.incursion && p5s.incursion === 'show' && !p5c.incursion);
ok('plan: the images controls only with the example "Your images"', !p1.file && M.plan(M.byId('terrain'), { exampleId: 'images' }).file === 'show' && !M.plan(M.byId('stage'), { exampleId: 'images' }).file);
// the manifest: viewer.mode takes the ids of the table
const ctx = { window: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['src/fields.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
const F = ctx.window.EVO; ok('E.VIEWER_MODES in src/fields.js agrees with the ids of the modes table', F.VIEWER_MODES.join() === M.IDS.join());
const man = (v) => ({ format: 'evodun-pack/0.3', name: 'x', roles: {}, viewer: v });
let bad = null; try { F.parseManifest(man({ mode: 'nope' })); } catch (e) { bad = e.message; }
ok('a manifest with an unknown viewer.mode is rejected, a known one is kept and written back', /viewer\.mode/.test(bad || '') && F.parseManifest(man({ mode: 'curves' })).viewer.mode === 'curves');
ok('docs/modes.md is in sync with the table', fs.readFileSync(path.join(__dirname, '../docs/modes.md'), 'utf8') === M.docs());
console.log(fail ? `\n${fail} failed` : `\nall passed (${M.MODES.length} modes)`); process.exit(fail ? 1 : 0);
