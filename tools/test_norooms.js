/* Rooms on with ZERO rooms (e.g. the 40x40 Snake Mountain surface with the Default radius): the layer is not applied, the shape is exactly the one with rooms off and the info names the reason.
     node tools/test_norooms.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const mk = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../data/snake_mountain_surface.json'), 'utf8'));
const P0 = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, roomsIsoLimit: 100, rRadius: 9, margin: 24 };
const off = E.shape(mk(), { ...P0, rooms: false }, null), on = E.shape(mk(), { ...P0, rooms: true }, null);
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
ok('surface pack: 40 x 40, no void', on.mapW === 40 && on.mapH === 40 && !(on.void && on.void.some((v) => v)));
ok('rooms on, Default: no rooms layer is applied (S.rooms null) and the reason is recorded', on.rooms === null && on.roomsNone && on.roomsNone.W === 40 && on.roomsNone.H === 40 && on.roomsNone.R === 9, JSON.stringify(on.roomsNone));
ok('rooms off: nothing recorded', off.rooms === null && !off.roomsNone);
ok('same levels, tiles, walls and regions as with rooms off', same(on.fine, off.fine) && JSON.stringify(on.levelH) === JSON.stringify(off.levelH) && same(on.block, off.block) && same(on.region, off.region));
ok('the map is walkable (not marked non-walkable)', on.regionSizes.reduce((a, b) => a + b, 0) > 1000 && !on.nowalk && !on.isolated, on.regionSizes);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
