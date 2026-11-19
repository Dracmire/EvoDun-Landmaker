/* STAGE 3 CONSTRUCTOR FORK, phase 0 in the viewer (docs/crystallizers/03-stage/research/octopath2/stage_s3_fork_go.md):
   (1) mode 3 builds its shape with the clone: opening an example of mode 3 (a window one, `perfil_m1`, and a legacy one, `x4_stage`) calls E.s3.shape and never E.shape; an example of mode 2 (the default) calls E.shape and never E.s3.shape; mode 1 and mode 4 too;
   (2) MUTATION control with the pages themselves: a copy of the viewer whose src/s3/shape.js has one constant changed (the terrace height of E.s3.terBase) gives the SAME canvas as the normal viewer in the default example of mode 2 and in mode 1 and a DIFFERENT canvas in perfil_m1 and dac_stage (mode 3).
     NODE_PATH=$(npm root -g) node tools/ui/test_s3_fork_ui.js */
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { spawnSync } = require('child_process');
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
if (process.argv[2] === '--probe') { // child: hashes of four states in the viewer found at EVO_ROOT
  const { open } = require('./common');
  (async () => { const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), out = {};
    const snap = async (k) => { out[k] = sha(await a.canvas()); };
    await ev(() => window.__evo.setMode('stage')); await a.idle();
    for (const id of ['perfil_m1', 'dac_stage']) { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle(); await snap('stage ' + id); }
    for (const m of ['rooms', 'terrain']) { await ev((m) => window.__evo.setMode(m), m); await a.idle(); await a.idle(); await snap('mode ' + m); }
    console.log(JSON.stringify(out)); await a.browser.close(); })().catch((e) => { console.error(e); process.exit(1); }); return;
}
const { open, ROOT } = require('./common');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
(async () => {
  // (1) which constructor builds the shape
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => { const E = window.EVO; window.__calls = { orig: 0, s3: 0 }; const o = E.shape, c = E.s3.shape; E.shape = function () { window.__calls.orig++; return o.apply(this, arguments); }; E.s3.shape = function () { window.__calls.s3++; return c.apply(this, arguments); }; });
  const calls = () => ev(() => { const r = { ...window.__calls }; window.__calls.orig = 0; window.__calls.s3 = 0; return r; });
  await calls();
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await a.idle(); await a.idle(); };
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle(); };
  await setMode('stage'); const c0 = await calls();
  ok(`mode 3 (the default example): the shape is built by E.s3.shape (${c0.s3} calls) and not by E.shape (${c0.orig})`, c0.s3 >= 1 && c0.orig === 0, c0);
  await clickEx('perfil_m1'); const c1 = await calls(); ok(`mode 3, a window mockup (perfil_m1): E.s3.shape ${c1.s3}, E.shape ${c1.orig}`, c1.s3 >= 1 && c1.orig === 0, c1);
  await clickEx('x4_stage'); const c2 = await calls(); ok(`mode 3, a legacy example (x4_stage): E.s3.shape ${c2.s3}, E.shape ${c2.orig}`, c2.s3 >= 1 && c2.orig === 0, c2);
  await setMode('rooms'); const c3 = await calls(); ok(`mode 2 (the default example): E.shape ${c3.orig}, E.s3.shape ${c3.s3}`, c3.orig >= 1 && c3.s3 === 0, c3);
  await setMode('terrain'); const c4 = await calls(); ok(`mode 1: E.shape ${c4.orig}, E.s3.shape ${c4.s3}`, c4.orig >= 1 && c4.s3 === 0, c4);
  await setMode('curves'); const c5 = await calls(); ok(`mode 4: E.shape ${c5.orig}, E.s3.shape ${c5.s3}`, c5.orig >= 1 && c5.s3 === 0, c5);
  ok('no page errors', a.errs.length === 0, a.errs); await a.browser.close();
  // (2) the mutation control, with a copy of the viewer
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's3fork-')); for (const f of ['index.html']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true }); fs.cpSync(path.join(ROOT, 'data'), path.join(tmp, 'data'), { recursive: true });
  const f = path.join(tmp, 'src/s3/shape.js'), code = fs.readFileSync(f, 'utf8'); ok('the constant to mutate is in the clone of the copy (`return t * P.terH;`)', code.includes('return t * P.terH;'));
  fs.writeFileSync(f, code.replace('return t * P.terH;', 'return t * P.terH * 1.15;'));
  const run = (root) => { const r = spawnSync(process.execPath, [__filename, '--probe'], { env: { ...process.env, EVO_ROOT: root }, encoding: 'utf8', timeout: 280000 }); try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { return { error: (r.stderr || r.stdout || '').slice(0, 300) }; } };
  const base = run(ROOT), mut = run(tmp); fs.rmSync(tmp, { recursive: true, force: true });
  ok(`MUTATION in the clone: mode 2 (default) and mode 1 are pixel-identical to the normal viewer (${base['mode rooms']} = ${mut['mode rooms']}, ${base['mode terrain']} = ${mut['mode terrain']})`, base['mode rooms'] && base['mode rooms'] === mut['mode rooms'] && base['mode terrain'] === mut['mode terrain'], { base, mut });
  ok(`MUTATION in the clone: mode 3 changes (perfil_m1 ${base['stage perfil_m1']} -> ${mut['stage perfil_m1']}, dac_stage ${base['stage dac_stage']} -> ${mut['stage dac_stage']})`, base['stage perfil_m1'] && base['stage perfil_m1'] !== mut['stage perfil_m1'] && base['stage dac_stage'] !== mut['stage dac_stage'], { base, mut });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
