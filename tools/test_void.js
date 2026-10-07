/* Void: elevation <= 0 is not terrain. Terraces use the land range, void tiles are blocked, belong to no level and never move a gate.
     node tools/test_void.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const W = 40, H = 30, mk = (voidRing) => { const el = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) el[y * W + x] = (voidRing && (x < 6 || y < 6 || x >= W - 6 || y >= H - 6)) ? 0 : 100 + x * 20 + y * 5; return { name: 't', width: W, height: H, elevation: el, masks: {}, markers: [], fields: {} }; };
const P = { terraces: 5, subs: 3, terH: 1, subH: 0.22, minPlateau: 3, minSub: 2, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2 };

const f = E.landFill(mk(true).elevation, W, H);
ok('landFill: range is lowest..highest land', f.range[0] === 100 + 6 * 20 + 6 * 5 && f.range[1] === 100 + (W - 7) * 20 + (H - 7) * 5, f.range);
ok('landFill: void tiles take the nearest land value, land is untouched', f.el[0] === f.el[6 * W + 6] && f.el[15 * W + 3] === f.el[15 * W + 6] && f.el[15 * W + 10] === mk(true).elevation[15 * W + 10]);
ok('landFill: without void the input is returned as is', E.landFill(mk(false).elevation, W, H).void === null && E.landFill(mk(false).elevation, W, H).el === E.landFill(mk(false).elevation, W, H).el === false || E.landFill(mk(false).elevation, W, H).void === null);

const full = mk(true), q = E.quantize(full, P);
ok('quantize: range excludes the void', q.range[0] > 0 && q.void && q.void[0] === 1 && q.void[15 * W + 15] === 0, q.range);
ok('quantize: the lowest terrace holds land (not only void)', (() => { let c = 0; for (let i = 0; i < W * H; i++) if (!q.void[i] && q.ter[i] === 0) c++; return c > 20; })());
const S = E.shape(full, P, null);
let vc = 0, bad = 0, inLevels = 0; for (let i = 0; i < S.n; i++) if (S.void[i]) { vc++; if (!S.block[i]) bad++; }
for (const l of S.byLevel) for (const i of l) if (S.void[i]) inLevels++;
ok('shape: void tiles are blocked and in no level list', vc === W * H - (W - 12) * (H - 12) && bad === 0 && inLevels === 0, [vc, bad, inLevels]);
ok('shape: fineMask is -1 on void and the level elsewhere', S.fineMask && S.fineMask[0] === -1 && S.fineMask[15 * W + 15] === S.fine[15 * W + 15]);
ok('shape: level count ignores void', S.levelCount.levels === new Set(Array.from(S.byLevel.flatMap((l, k) => l.length ? [k] : []))).size);
let gv = 0; for (const g of S.gates) for (const t of g.tiles) if (S.void[t.a] || S.void[t.b]) gv++;
ok('gates never touch the void', gv === 0 && S.gates.length > 0, [gv, S.gates.length]);
let reg = 0; for (let i = 0; i < S.n; i++) if (S.void[i] && S.region[i] >= 0) reg++;
ok('void is in no walkable region', reg === 0);
// a pack without zeros is untouched
const s2 = E.shape(mk(false), P, null); ok('no void: S.void is null and nothing is masked', s2.void === null && !s2.fineMask);
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
