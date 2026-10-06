/* Tests for the effective sub-terrace height (src/shape.js). Run: node tools/test_heights.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../src/shape.js'), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };

const DEFAULT = { terraces: 5, subs: 3, terH: 1.0, subH: 0.22, climb: 2 };
ok('defaults keep the set sub-terrace height exactly (pixel-identical)', E.subHeight(DEFAULT) === 0.22, E.subHeight(DEFAULT));

let cases = 0, badGap = 0, badMargin = 0, badShrink = 0, badOrder = 0, worst = Infinity;
for (const terH of [0.4, 0.7, 1.0, 1.5, 2.5]) for (const subH of [0.05, 0.1, 0.22, 0.35, 0.5]) for (let subs = 1; subs <= 6; subs++) for (let climb = 1; climb <= 5; climb++) {
  const P = { terraces: 5, subs, terH, subH, climb }, s = E.subHeight(P);
  cases++;
  const gap = terH - (subs - 1) * s;                           // last sub-terrace -> base of the next terrace
  if (!(gap > climb * s)) badGap++;                            // a stair always has a rise above the climb limit
  if (gap < (climb + 0.5) * s - 1e-9) badMargin++;             // ... by at least half a sub-step (visible margin)
  worst = Math.min(worst, (gap - climb * s) / s);
  if (!(s > 0 && s <= subH)) badShrink++;
  if (s < subH && Math.abs(gap - (climb + 0.5) * s) > 1e-9) badShrink++;       // only shrinks as much as needed
  if (s === subH && !(terH - (subs - 1) * subH >= (climb + 0.5) * subH - 1e-9)) badShrink++; // never keeps an invalid value
  let prev = -Infinity;                                        // height order == (terrace, sub-terrace) order
  for (let f = 0; f < 5 * subs; f++) { const h = E.hOf(f, P); if (!(h > prev)) badOrder++; prev = h; }
}
ok(`gap > climb * subH_eff for ${cases} combinations (subs 1..6, climb 1..5, terH and subH from the sliders)`, badGap === 0, badGap);
ok('margin of at least half a sub-step everywhere', badMargin === 0, badMargin);
ok('worst case margin (in sub-steps) is >= 0.5', worst >= 0.5 - 1e-9, worst);
ok('subH_eff <= subH, positive, and only reduced when needed', badShrink === 0, badShrink);
ok('height order == (terrace, sub-terrace) order, so levels never overlap', badOrder === 0, badOrder);
ok('sub-terrace heights never exceed the set value', E.subHeight({ terraces: 5, subs: 6, terH: 1, subH: 0.5, climb: 5 }) < 0.5);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
