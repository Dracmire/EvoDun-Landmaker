/* S3: the optional input P.rampPreferFill of carveStairs (src/shape.js). A transition along the x axis (lateral for a Cam 6 at yaw 0 or 180) that fits both CUT into the upper terrace (a trench: its near flank hides it) and FILL built on the lower one
   takes the fill variant when it is NOT narrower; the widest variant still wins. ABSENT / false = the order of today, byte for byte (R7).
   Real map data/samples/skeleton_heightmap_256.png, rooms on, Balanced types (3 terraces, min core 100, room radius 5, min plateau 120), whole map, ramp style: measured lateral cut 14 / fill 8 -> 7 / 15, narrowed 5 -> 5, dropped 0 -> 0.
   MUTATIONS (E.shapeTest, each must FAIL its named check): flagLeak (the preference on without the flag -> the identity check fails), fillAlways (the fill first even when narrower -> the narrowed / width check fails, on the Default preset where some fill variants are narrower: narrowed 30 -> 32).
     node tools/test_ramp_prefer_fill.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra)); } };
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const base = { terraces: 3, subs: 3, terH: 1, subH: 0.22, minPlateau: 120, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, radius: 0.9, tread: 2, roomsMinCore: 100, roomsCross: 10, rRadius: 5, rooms: true };
  const hash = (S) => crypto.createHash('md5').update(Buffer.from(S.fine.buffer)).update(JSON.stringify(S.stairs.map((r) => [r.mode, r.dir, r.cols.length, r.bottom, r.top, r.steps.map((x) => x.tiles)]))).update(JSON.stringify(S.levelH)).digest('hex');
  const stat = (S) => { const lat = S.stairs.filter((r) => r.dir[0] !== 0); return { stairs: S.stairs.length, lateral: lat.length, cut: lat.filter((r) => r.mode === 'cut').length, fill: lat.filter((r) => r.mode === 'fill').length, narrowed: S.stairs.filter((r) => r.narrowed).length, dropped: S.stairInfo.dropped, colsLat: lat.reduce((a, r) => a + r.cols.length, 0) }; };
  const build = (extra, hook) => { E.shapeTest = hook || undefined; const S = E.shape(mk(), { ...base, ...extra }, null); E.shapeTest = undefined; return S; };
  const S0 = build({}), S1 = build({ rampPreferFill: false }), S2 = build({ rampPreferFill: true });
  const h0 = hash(S0), a = stat(S0), b = stat(S2);
  console.log('  absent :', JSON.stringify(a), '\n  present:', JSON.stringify(b));
  ok('ABSENT = byte-identical to false (levels, fine, stairs)', h0 === hash(S1));
  ok('ABSENT: the lateral transitions of today: 22 (cut 14, fill 8), narrowed 5, dropped 0', a.lateral === 22 && a.cut === 14 && a.fill === 8 && a.narrowed === 5 && a.dropped === 0, a);
  ok('PRESENT: lateral cut 14 -> 7, fill 8 -> 15; narrowed 5 -> 5, dropped 0 -> 0, same number of stairs, no lateral column lost', b.cut === 7 && b.fill === 15 && b.narrowed === 5 && b.dropped === 0 && b.stairs === a.stairs && b.colsLat >= a.colsLat, b);
  ok('PRESENT: only the x-axis (lateral) transitions changed mode (the others are identical stair by stair)', S0.stairs.every((r, i) => r.dir[0] !== 0 || (r.mode === S2.stairs[i].mode && r.cols.length === S2.stairs[i].cols.length && JSON.stringify(r.bottom) === JSON.stringify(S2.stairs[i].bottom))));
  ok('PRESENT: the walking graph keeps its size (walkable regions)', (() => { const cnt = (S) => { const m = {}; for (let i = 0; i < S.n; i++) if (S.region[i] >= 0) m[S.region[i]] = (m[S.region[i]] || 0) + 1; return Object.values(m).sort((x, y) => y - x); }; const r0 = cnt(S0), r2 = cnt(S2); console.log('  regions absent / present:', r0.length, r0[0], '/', r2.length, r2[0]); return r0.length === r2.length && Math.abs(r0[0] - r2[0]) <= 8; })());
  // MUTATIONS
  const mLeak = build({}, { flagLeak: true });
  ok('MUTATION flagLeak: the identity check FAILS (the preference leaks without the flag)', hash(mLeak) !== h0, stat(mLeak));
  // the Default preset (5 terraces) has lateral transitions whose fill variant IS narrower: there "never narrower" can be told from "always"
  const DEF = { terraces: 5, minPlateau: 5, roomsMinCore: 20, rRadius: 9 }, D0 = stat(build(DEF)), D1 = stat(build({ ...DEF, rampPreferFill: true }));
  console.log('  Default absent :', JSON.stringify(D0), '\n  Default present:', JSON.stringify(D1));
  ok('Default preset PRESENT: lateral cut 40 -> 33, narrowed 30 -> 30, dropped 2 -> 2', D0.lateral === 69 && D0.cut === 40 && D1.cut === 33 && D0.narrowed === 30 && D1.narrowed === 30 && D0.dropped === 2 && D1.dropped === 2, [D0, D1]);
  const mAll = stat(build({ ...DEF, rampPreferFill: true }, { fillAlways: true }));
  console.log('  Default fillAlways:', JSON.stringify(mAll));
  ok('MUTATION fillAlways: the "never narrower" check FAILS (more narrowed stairs and fewer lateral columns than the real feature)', mAll.narrowed > D1.narrowed && mAll.colsLat < D1.colsLat, mAll);
  // P2: the lateral axis follows the yaw of the room (P.rampPreferYaw): x at 0 / 180, y at 90 / 270
  const latY = (S) => { const l = S.stairs.filter((r) => r.dir[1] !== 0); return { n: l.length, cut: l.filter((r) => r.mode === 'cut').length, fill: l.filter((r) => r.mode === 'fill').length }; };
  const S3 = build({ rampPreferFill: true, rampPreferYaw: 90 }), S4 = build({ rampPreferFill: true, rampPreferYaw: 180 }), y0 = latY(S0), y2 = latY(S2), y3 = latY(S3);
  console.log('  y-lateral absent :', JSON.stringify(y0), ' present yaw 180:', JSON.stringify(y2), ' present yaw 90:', JSON.stringify(y3));
  ok('P2: rampPreferYaw 180 = the S3 behaviour (byte-identical to rampPreferFill alone)', hash(S4) === hash(S2));
  ok(`P2: with yaw 90 the y-lateral transitions take the fill first (fill ${y0.fill} -> ${y3.fill}, cut ${y0.cut} -> ${y3.cut}) and the x ones stay as the absent case`, y3.fill > y0.fill && y3.cut < y0.cut && S0.stairs.every((r, i) => r.dir[1] !== 0 || (r.mode === S3.stairs[i].mode && JSON.stringify(r.bottom) === JSON.stringify(S3.stairs[i].bottom))), { y0, y3 });
  const mYaw = build({ rampPreferFill: true, rampPreferYaw: 90 }, { ignoreYaw: true });
  ok(`MUTATION ignoreYaw (the lateral axis is always x): yaw 90 gives the 180 result (y-lateral fill ${latY(mYaw).fill}, as ${y2.fill} with 180): the yaw check FAILS`, hash(mYaw) === hash(S2) && !(latY(mYaw).fill > y0.fill));
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
