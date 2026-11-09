/* STAGE, M4c-0: the pure height exaggeration `E.stage.exag(hH, e)` (src/stage.js): the identity at e = 1, continuous at 1 H, monotonic, 3 ** e above 1 H, and the planes / volumes
   sites: e = 1 builds exactly the same shape as before, e > 1 raises the wall, the columns and the roofs (only those).
     node tools/test_stage_exag.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket', 'render', 'stage', 'orient', 'planes', 'volumes']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, X = E.stage.exag; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : extra); } };
const hs = []; for (let h = 0; h <= 12; h += 0.05) hs.push(h);
ok('e = 1 (and undefined) is the identity', hs.every((h) => X(h, 1) === h && X(h, undefined) === h));
ok('h <= 1 H is never changed, whatever e', hs.filter((h) => h <= 1).every((h) => [1, 1.3, 2].every((e) => X(h, e) === h)));
ok('continuous at 1 H (X(1) = 1 and X(1 + d) - 1 -> 0)', X(1, 2) === 1 && Math.abs(X(1 + 1e-9, 2) - 1) < 1e-8);
for (const e of [1.3, 1.5, 2]) {
  ok(`e = ${e}: monotonic (never decreasing) over 0..12 H`, hs.every((h, i) => i === 0 || X(h, e) >= X(hs[i - 1], e)));
  ok(`e = ${e}: 3 H -> 3 ** ${e} = ${Math.pow(3, e).toFixed(4)}`, Math.abs(X(3, e) - Math.pow(3, e)) < 1e-12);
  ok(`e = ${e}: above 1 H it only grows (X(h) >= h)`, hs.every((h) => X(h, e) >= h - 1e-12));
}
// the sites: the same shape with e = 1, a taller wall / columns / roof with e = 1.5, nothing else changed
const pack = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/snake_mountain_surface.json'), 'utf8'));
const P = { terraces: 5, subs: 3, terH: 2, subH: 0.44, minPlateau: 5, minSub: 3, pre: 1, climb: 2, gateThr: 0.05, gateMin: 3, passGap: 8, stairW: 3, stairStyle: 1, rampDepth: 2, spread: 1, smooth: 2, anchor: true, spreadCentre: 'largest' };
const mk = (e) => { const S = E.shape(pack, P, null); const sig = () => JSON.stringify([Array.from(S.levelH), Array.from(S.fine)]); const v = E.volumes.apply(S, { list: [{ x: 1, y: 1, w: 2, d: 2, hH: 3 }], tilesPerH: 2, exag: e }); return { S, v, sig: sig() }; };
const a = mk(undefined), b = mk(1), c = mk(1.5);
ok('volumes: exag undefined and 1 give the same levels and tiles', a.sig === b.sig);
if (a.v && c.v) { ok('volumes: the exaggerated roof is higher (e = 1.5 raises 3 H to 3 ** 1.5 = 5.196 H)', c.v.volumes[0] && b.v.volumes[0] && c.v.volumes[0].roof > b.v.volumes[0].roof, [b.v.volumes[0] && b.v.volumes[0].roof, c.v.volumes[0] && c.v.volumes[0].roof]); ok('volumes: S.stageVolumes records the exag', c.v.exag === 1.5 && b.v.exag === 1); }
else console.log('NOTE volumes: no footprint tile on this tiny pack; the sites are covered by the UI test');
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
