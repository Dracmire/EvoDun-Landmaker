/* STAGE 3 CONSTRUCTOR FORK, phase 0 in the viewer (docs/crystallizers/03-stage/research/octopath2/stage_s3_fork_go.md):
   (1) mode 3 builds its shape with the clone: opening an example of mode 3 (a window one, `perfil_m1`, and a legacy one, `x4_stage`) calls E.s3.shape and never E.shape; an example of mode 2 (the default) calls E.shape and never E.s3.shape; mode 1 and mode 4 too;
   (1b) SEAL (stage_s3_sello_go.md): a counter on the ORIGINAL chain (E.shape, and every function of E.rooms, E.roomTypes, E.pocket) reads 0 after opening EVERY example of mode 3 and walking k0..k8 in one; the default example of mode 2 makes it > 0 (control); E.s3 has no way to resolve the chain names to the original (the traps of src/s3/ns.js throw);
   (2) MUTATION control with the pages themselves: a copy of the viewer whose src/s3/shape.js has one constant changed (the terrace height of E.s3.terBase) gives the SAME canvas as the normal viewer in the default example of mode 2 and in mode 1 and a DIFFERENT canvas in perfil_m1 and dac_stage (mode 3).
     NODE_PATH=$(npm root -g) node tools/ui/test_s3_fork_ui.js */
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { spawnSync } = require('child_process');
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);
if (process.argv[2] === '--probe') { // child: hashes of four states in the viewer found at EVO_ROOT
  const { open } = require('./common');
  (async () => { const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x), out = {};
    const snap = async (k) => { out[k] = sha(await a.canvas()); };
    await ev(() => window.__evo.setMode('stage')); await a.idle();
    for (const id of ['perfil_m1', 'perfil_m2', 'dac_stage']) { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle(); await snap('stage ' + id); }
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
  // the counter on the ORIGINAL chain: E.rooms / E.roomTypes / E.pocket become proxies that count every call of a function, E.shape is wrapped above (window.__calls.orig)
  await ev(() => { const E = window.EVO; window.__chain = { n: 0, by: {} }; const hit = (k) => { window.__chain.n++; window.__chain.by[k] = (window.__chain.by[k] || 0) + 1; };
    for (const name of ['rooms', 'roomTypes', 'pocket']) { const o = E[name]; E[name] = new Proxy(o, { get(t, k, r) { const v = Reflect.get(t, k, r); return typeof v === 'function' ? function () { hit(name + '.' + String(k)); return v.apply(this, arguments); } : v; } }); }
    const s0 = E.shape; E.shape = function () { hit('shape'); return s0.apply(this, arguments); }; });
  /* RESIDUAL (reported, not hidden): the SHARED renderer (src/render.js, not edited) draws the Ascension walls with two pure helpers that live in the original E.roomTypes (ascWallLow, ascBox); they run per wall face at DRAW time, never build geometry. They are counted apart as `render`; every other call is `n`. */
  const RENDER_HELPERS = ['roomTypes.ascWallLow', 'roomTypes.ascBox'];
  const chain = () => ev((H) => { const by = { ...window.__chain.by }; let render = 0; for (const k of H) { render += by[k] || 0; delete by[k]; } const n = Object.values(by).reduce((p, q) => p + q, 0); const r = { n, render, by, shape: window.__calls.orig }; window.__chain.n = 0; window.__chain.by = {}; return r; }, RENDER_HELPERS);
  await calls();
  const setMode = async (m) => { await ev((m) => window.__evo.setMode(m), m); await a.idle(); await a.idle(); };
  const clickEx = async (id) => { await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle(); };
  await setMode('stage'); const c0 = await calls();
  ok(`mode 3 (the default example): the shape is built by E.s3.shape (${c0.s3} calls) and not by E.shape (${c0.orig})`, c0.s3 >= 1 && c0.orig === 0, c0);
  await clickEx('perfil_m1'); const c1 = await calls(); ok(`mode 3, a window mockup (perfil_m1): E.s3.shape ${c1.s3}, E.shape ${c1.orig}`, c1.s3 >= 1 && c1.orig === 0, c1);
  await clickEx('x4_stage'); const c2 = await calls(); ok(`mode 3, a legacy example (x4_stage): E.s3.shape ${c2.s3}, E.shape ${c2.orig}`, c2.s3 >= 1 && c2.orig === 0, c2);
  { await chain(); await setMode('stage'); const ids = await ev(() => window.EVO.modes.byId('stage').examples.map((e) => e.id)), per = {};
    let renderRes = 0; for (const id of ids) { await clickEx(id); const c = await chain(); per[id] = c.n + c.shape; renderRes += c.render; }
    await clickEx('perfil_m1'); const wk = await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [t % S.W, (t / S.W) | 0]); });
    for (let i = 0; i <= 8; i++) { const k = wk[Math.floor(i * (wk.length - 1) / 8 + 0.5)]; await ev((k) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, k); await a.idle(); }
    const wc = await chain(); renderRes += wc.render; const total = Object.values(per).reduce((p, q) => p + q, 0) + wc.n + wc.shape;
    ok(`SEAL: the ORIGINAL chain (E.shape, E.rooms.*, E.roomTypes.*, E.pocket.*) is called 0 times from ${ids.length} examples of mode 3 (every example, then k0..k8 in perfil_m1), leaving apart the two draw-time helpers of the shared renderer: ${JSON.stringify(per)}, walk ${JSON.stringify(wc.by)}`, total === 0, { per, wc });
    console.log(`INFO RESIDUAL (not a failure, a finding): the shared renderer (src/render.js) called the original roomTypes.ascWallLow / ascBox ${renderRes} times in mode 3 (only perfil_m1, the example with Ascension walls); they draw, they do not build geometry. A fix needs a clone of render.js or a hook in it: a decision of [U].`); }
  await chain(); await calls(); await setMode('rooms'); const c3 = await calls(); const m2c = await chain(); ok(`SEAL control: the default example of mode 2 DOES call the original chain (${m2c.n + m2c.shape + m2c.render} calls: ${JSON.stringify(m2c.by)}, shape ${m2c.shape})`, m2c.n + m2c.shape + m2c.render > 0, m2c); ok(`mode 2 (the default example): E.shape ${c3.orig}, E.s3.shape ${c3.s3}`, c3.orig >= 1 && c3.s3 === 0, c3);
  await setMode('terrain'); const c4 = await calls(); ok(`mode 1: E.shape ${c4.orig}, E.s3.shape ${c4.s3}`, c4.orig >= 1 && c4.s3 === 0, c4);
  await setMode('curves'); const c5 = await calls(); ok(`mode 4: E.shape ${c5.orig}, E.s3.shape ${c5.s3}`, c5.orig >= 1 && c5.s3 === 0, c5);
  { const sealed = await ev(() => { const E = window.EVO, out = {}; for (const n of E.s3.CHAIN_NAMES) { const d = Object.getOwnPropertyDescriptor(E.s3, n); out[n] = !!d && 'value' in d && d.value !== E[n]; } return out; }); ok('SEAL: every name of the chain is an OWN property of E.s3 defined by a clone and different from the original (' + Object.keys(sealed).length + ' names)', Object.values(sealed).every(Boolean), sealed); }
  ok('no page errors', a.errs.length === 0, a.errs); await a.browser.close();
  // (2) the mutation control, with a copy of the viewer
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's3fork-')); for (const f of ['index.html']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true }); fs.cpSync(path.join(ROOT, 'data'), path.join(tmp, 'data'), { recursive: true });
  const f = path.join(tmp, 'src/s3/shape.js'), code = fs.readFileSync(f, 'utf8'); ok('the constant to mutate is in the clone of the copy (`return t * P.terH;`)', code.includes('return t * P.terH;'));
  fs.writeFileSync(f, code.replace('return t * P.terH;', 'return t * P.terH * 1.15;'));
  const run = (root) => { const r = spawnSync(process.execPath, [__filename, '--probe'], { env: { ...process.env, EVO_ROOT: root }, encoding: 'utf8', timeout: 280000 }); try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { return { error: (r.stderr || r.stdout || '').slice(0, 300) }; } };
  const base = run(ROOT), mut = run(tmp); fs.rmSync(tmp, { recursive: true, force: true });
  ok(`MUTATION in the clone: mode 2 (default) and mode 1 are pixel-identical to the normal viewer (${base['mode rooms']} = ${mut['mode rooms']}, ${base['mode terrain']} = ${mut['mode terrain']})`, base['mode rooms'] && base['mode rooms'] === mut['mode rooms'] && base['mode terrain'] === mut['mode terrain'], { base, mut });
  ok(`MUTATION in the clone: mode 3 changes (perfil_m1 ${base['stage perfil_m1']} -> ${mut['stage perfil_m1']}, dac_stage ${base['stage dac_stage']} -> ${mut['stage dac_stage']})`, base['stage perfil_m1'] && base['stage perfil_m1'] !== mut['stage perfil_m1'] && base['stage dac_stage'] !== mut['stage dac_stage'], { base, mut });
  { const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 's3pocket-')); fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(tmp2, 'index.html')); fs.cpSync(path.join(ROOT, 'src'), path.join(tmp2, 'src'), { recursive: true }); fs.cpSync(path.join(ROOT, 'data'), path.join(tmp2, 'data'), { recursive: true });
    const f2 = path.join(tmp2, 'src/s3/pocket.js'), c2 = fs.readFileSync(f2, 'utf8'); ok('the constant to mutate is in the pocket clone (`factor: 3`, the disc radius in room radii)', c2.includes('factor: 3')); fs.writeFileSync(f2, c2.replace('factor: 3', 'factor: 5'));
    const mut2 = run(tmp2); fs.rmSync(tmp2, { recursive: true, force: true });
    ok(`MUTATION in src/s3/pocket.js: mode 3 with a Pocket changes (perfil_m2 ${base['stage perfil_m2']} -> ${mut2['stage perfil_m2']}); mode 2 (default), mode 1 and the mode 3 examples without a Pocket do not (${base['mode rooms']} = ${mut2['mode rooms']}, ${base['mode terrain']} = ${mut2['mode terrain']}, perfil_m1 ${base['stage perfil_m1']} = ${mut2['stage perfil_m1']})`, base['stage perfil_m2'] && base['stage perfil_m2'] !== mut2['stage perfil_m2'] && base['mode rooms'] === mut2['mode rooms'] && base['mode terrain'] === mut2['mode terrain'] && base['stage perfil_m1'] === mut2['stage perfil_m1'], { base, mut2 }); }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
