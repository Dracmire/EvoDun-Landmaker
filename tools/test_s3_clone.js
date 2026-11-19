/* STAGE 3 CONSTRUCTOR FORK, phase 0 (docs/crystallizers/03-stage/research/octopath2/stage_s3_fork_go.md): the clone src/s3/{shape,rooms,roomtypes}.js must build THE SAME shape as the original (no browser).
   (1) the clones (shape, rooms, roomtypes and, since the seal, pocket) are LITERAL: each file equals the original but for the header comment and the namespace line of the IIFE (diff of the code);
   (2) the hash of S (terraces, fine levels, level heights, block, void, region, room map, stairs, room types, the walking graph of every tile) built with E.shape and with E.s3.shape is IDENTICAL for the window of perfil_m1 (room 14, Balanced types, terraces 3) and of dac_stage (its 6 rooms, terraces 5), and for the whole map;
   (3) the clone is its own world: E.s3.shape / rooms / roomTypes are not the originals, `E.s3.walkGraph` is not `E.walkGraph`, and the original E.* do not move when the clone is loaded (the prototype of E.s3 is E);
   (4) MUTATION control: one constant changed inside the clone (the terrace height `t * P.terH` of E.s3.terBase) changes S built by the clone and leaves S built by the original untouched.
     node tools/test_s3_clone.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
const SRC = (f) => fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'), LIST = ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 's3/ns', 's3/shape', 's3/rooms', 's3/roomtypes', 's3/pocket'];
for (const f of LIST) vm.runInThisContext(SRC(f), { filename: f });
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 500)); } };
// (1) literal
for (const f of ['shape', 'rooms', 'roomtypes', 'pocket']) {
  const o = SRC(f), c = SRC('s3/' + f), body = c.slice(c.indexOf('*/') + 3), expect = o.replace('(function (E) {', "(function (E0) {\n  const E = E0.s3 || (E0.s3 = Object.create(E0)); // the clone's namespace (see the header)");
  ok(`src/s3/${f}.js is a literal copy of src/${f}.js: after its header comment it equals the original with ONLY the opening line of the IIFE changed to the namespace of E.s3`, body === expect && o.split('(function (E) {').length === 2, { lo: o.length, lc: body.length });
}
// (2) identical S
const ha = (h, v) => { if (v === undefined || v === null) h.update('~'); else if (ArrayBuffer.isView(v)) h.update(Buffer.from(v.buffer, v.byteOffset, v.byteLength)); else h.update(JSON.stringify(v)); };
const hashS = (S, P, wg) => { const h = crypto.createHash('sha1'); for (const k of ['W', 'H', 'ox', 'oy', 'n', 'ter', 'fine', 'levelH', 'block', 'void', 'region', 'roomMap', 'nowalk', 'center']) ha(h, S[k]);
  ha(h, (S.stairs || []).map((s) => [s.bottom, s.top, s.cols, (s.steps || []).map((q) => q.tiles)])); ha(h, S.types ? [...S.types.rooms.entries()].map(([id, o]) => [id, o.type, o.tiles]) : null); ha(h, S.walkInfo);
  const nb = wg(S, P); for (let i = 0; i < S.n; i++) ha(h, nb(i)); return h.digest('hex').slice(0, 16); };
(async () => {
  const { mk } = await require('./real_pack.js').load(E), RT = require('./room_types_table.js');
  const mkP = (extra, over) => ({ ...RT.BASE, ...extra, ...over });
  const CASES = {
    'perfil_m1 (room 14, terraces 3, Base v2.4)': [mkP({ terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, { terH: 1.875, subH: 0.4125, subs: 2, stairStyle: 0, tread: 1, rampPreferFill: true }), (P) => ({ rooms: [14], margin: P.margin })],
    'dac_stage (6 rooms, terraces 5)': [mkP({ terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, { terH: 4, subH: 0.88, stairStyle: 0, tread: 1, rampPreferFill: true }), (P) => ({ rooms: [5, 6, 10, 17, 20, 27], margin: P.margin })],
    'whole map (Balanced types, terraces 3)': [mkP({ terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, {}), () => null]
  };
  const res = {};
  for (const [name, [P, spec]] of Object.entries(CASES)) {
    const a = E.shape(mk(), P, spec(P)), b = E.s3.shape(mk(), P, spec(P)), ha_ = hashS(a, P, E.walkGraph), hb = hashS(b, P, E.s3.walkGraph);
    res[name] = [ha_, hb, a.n, b.stairs.length];
    ok(`S built by E.shape and E.s3.shape is IDENTICAL: ${name} (${ha_}, ${a.n} tiles, ${(a.stairs || []).length} stairs, ${a.levelH.length} levels)`, ha_ === hb && a.n === b.n, res[name]);
  }
  // (3) the clone is its own world
  ok('E.s3.shape / rooms / roomTypes are the clone\'s own (not the originals); E.s3.walkGraph is not E.walkGraph', E.s3.shape !== E.shape && E.s3.rooms !== E.rooms && E.s3.roomTypes !== E.roomTypes && E.s3.walkGraph !== E.walkGraph && typeof E.s3.roomTypes.insertLevels === 'function' && E.s3.roomTypes.insertLevels !== E.roomTypes.insertLevels);
  ok('the original namespace did not move: E.shape is the original function and E.roomTypes.insertLevels still there; E.s3 inherits from E (a name the clone does not define is found through E)', typeof E.shape === 'function' && !Object.prototype.hasOwnProperty.call(E, 's3.shape') && Object.getPrototypeOf(E.s3) === E && E.s3.decodePng === E.decodePng);
  // (3b) the seal: before a clone defines it, a chain name of E.s3 THROWS (it never resolves to the original); after the clones it is an own property that differs from the original
{ const ctx = {}; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(SRC('shape'), ctx, { filename: 'shape' }); vm.runInContext(SRC('s3/ns'), ctx, { filename: 's3/ns' });
  const bad = []; for (const n of ctx.EVO.s3.CHAIN_NAMES) { let threw = false; try { void ctx.EVO.s3[n]; } catch (e) { threw = /never falls back to the original DAC chain/.test(e.message); } if (!threw) bad.push(n); }
  ok(`the seal: with only src/s3/ns.js loaded, every one of the ${ctx.EVO.s3.CHAIN_NAMES.length} chain names of E.s3 throws instead of falling back to the original (the original E.shape exists in that context)`, bad.length === 0 && typeof ctx.EVO.shape === 'function', bad);
  const own = E.s3.CHAIN_NAMES.filter((n) => { const d = Object.getOwnPropertyDescriptor(E.s3, n); return !(d && 'value' in d && d.value !== E[n] && d.value !== undefined); });
  ok('with the four clones loaded, every chain name of E.s3 is an own value defined by a clone, and E.s3.pocket is not E.pocket (the original pocket is not even loaded in this context)', own.length === 0 && typeof E.s3.pocket === 'object' && E.pocket === undefined, own); }
// (4) mutation: a constant inside the clone
  const [P1, spec1] = CASES['perfil_m1 (room 14, terraces 3, Base v2.4)'], base = hashS(E.shape(mk(), P1, spec1(P1)), P1, E.walkGraph);
  const code = SRC('s3/shape'); ok('the constant to mutate is in the clone (`return t * P.terH;` of E.terBase)', code.includes('return t * P.terH;'));
  const ctx = {}; ctx.window = ctx; ctx.console = console; ctx.performance = performance; vm.createContext(ctx); for (const f of LIST) vm.runInContext(f === 's3/shape' ? code.replace('return t * P.terH;', 'return t * P.terH * 1.1;') : SRC(f), ctx, { filename: f });
  const E2 = ctx.EVO; const mk2 = mk; // the pack is built once, in this context (a fresh vm context has no DecompressionStream): the shapes are built by the two namespaces of the mutated context
  const orig2 = hashS(E2.shape(mk2(), P1, spec1(P1)), P1, E2.walkGraph), clone2 = hashS(E2.s3.shape(mk2(), P1, spec1(P1)), P1, E2.s3.walkGraph);
  ok(`MUTATION (terrace height x 1.1 inside the clone): the clone's S changes (${clone2} != ${base}) and the original's S does not (${orig2} = ${base})`, clone2 !== base && orig2 === base, { base, orig2, clone2 });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
