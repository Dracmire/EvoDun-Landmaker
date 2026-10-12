/* The controls table (src/controls.js): integrity of the entries and docs/controls.md in sync with it. The DOM side (every control of the panel has an entry, disabled / enabled and tooltips per scenario)
   is tools/ui/test_controls_ui.js.   node tools/test_controls.js */
const fs = require('fs'), path = require('path');
const { generate } = require('./gen_controls_doc.js');
const C = generate();
let fail = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  ' + x : '')); if (!c) fail++; };
const ids = C.TABLE.map((e) => e.id);
ok('ids are unique', new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i));
ok('every entry has a known group, a DOM selector and techniques', C.TABLE.every((e) => C.GROUPS.includes(e.group) && e.dom && e.tech.length));
ok('every requirement of every entry exists and has a text', C.TABLE.every((e) => e.req.every((k) => C.REQ[k] && C.REQ[k].text && typeof C.REQ[k].ok === 'function')));
ok('every entry has a help text, or keeps its own tooltip (cameras, Stage preset)', C.TABLE.every((e) => (e.help && e.help.length > 10) || e.keep));
ok('badges are on the controls that change a single technique, and only on them', C.TABLE.every((e) => (e.tech.length === 1) === !!e.badge && (!e.badge || e.badge === e.tech[0])));
ok('the retired controls are not in the table', C.RETIRED.every((r) => !C.TABLE.some((e) => e.id === r.id)));
// requirement texts: the unmet list names ONLY what to activate
const ctx = { rooms: false, roomsFound: false, cake: false, techs: ['A'], wallPass: 't3', stairW: 3, stairStyle: 1, subs: 3, terraces: 5, slice: false, passes: 0, floors: false, floorsView: 'single', camKind: 'ortho', images: false };
const cake = C.TABLE.find((e) => e.id === 'cakeLayers');
ok('with Rooms off the Cake sliders list the rooms switch first and then the Cake switch', C.requiresText(C.unmet(cake, ctx)) === 'Requires: turn on Rooms · turn on Cake rings', C.requiresText(C.unmet(cake, ctx)));
ok('with Rooms on but no rooms found it says what to load', C.unmet(C.TABLE.find((e) => e.id === 't-cake'), Object.assign({}, ctx, { rooms: true })).join('|') === C.REQ.roomsFound.text);
ok('a control with every requirement met has no unmet text', C.unmet(C.TABLE.find((e) => e.id === 'smooth'), ctx).length === 0);
ok('docs/controls.md is in sync with the table', fs.readFileSync(path.join(__dirname, '../docs/controls.md'), 'utf8') === C.docs());
console.log(fail ? `\n${fail} failed` : `\nall passed (${C.TABLE.length} entries)`); process.exit(fail ? 1 : 0);
