/* Room types against the generator's EXISTING parameters (no new logic): real map, rooms on, Cake off. Types with the plain V16.4 rule and with the rule "Diorama never touches Diorama" (P.dioNoTouch, default ON; connected = at least 3 open transition pairs). For each row: rooms, types Cake/Diorama/Ascension, ramps, main region
   (% of the land), walkable (% of the land), edge problems. Rows 1-6 reproduce the user's table (measured in the viewer); 7-8 add minPlateau 120 / 250 to the balanced preset.
     node tools/room_types_table.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO;
const BASE = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 20, roomsCross: 10, roomsIsoLimit: 100, rRadius: 9, rooms: true, margin: 24 };
const ROWS = [
  ['default', {}], ['core 100', { roomsMinCore: 100 }], ['minPlateau 250', { minPlateau: 250 }], ['3 terraces + core 100', { terraces: 3, roomsMinCore: 100 }],
  ['rRadius 5', { rRadius: 5 }], ['3 terraces + core 100 + rRadius 5 (Balanced types)', { terraces: 3, roomsMinCore: 100, rRadius: 5 }],
  ['Balanced types + minPlateau 120', { terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }], ['Balanced types + minPlateau 250', { terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 250 }]
];
exports.ROWS = ROWS; exports.BASE = BASE;
exports.run = (mk, extra, over) => { const S = E.shape(mk(), { ...BASE, ...extra, ...(over || {}) }, null), c = S.types.counts, w = S.walkInfo; return { S, rooms: S.types.rooms.size, c, ramps: S.stairs.length, main: w.main, walk: w.walkable, land: S.landTiles, problems: w.problems.length }; };
if (require.main === module) (async () => {
  const { mk } = await require('./real_pack.js').load(E);
  console.log('row | rooms | Cake/Diorama/Ascension (V16.4 rule) | with "Diorama never touches Diorama" (demoted, tiles) | ramps | main % of land | walkable % of land | edge problems');
  for (const [name, extra] of ROWS) { const r = exports.run(mk, extra, { dioNoTouch: false }), d = exports.run(mk, extra); console.log(`${name} | ${r.rooms} | ${r.c.cake}/${r.c.diorama}/${r.c.ascension} | ${d.c.cake}/${d.c.diorama}/${d.c.ascension} (${d.c.dioDemoted}, ${d.c.dioDemotedTiles}) | ${r.ramps} | ${(r.main / r.land * 100).toFixed(1)} % | ${(r.walk / r.land * 100).toFixed(1)} % | ${r.problems}`); }
})();
