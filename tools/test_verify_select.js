/* tools/verify.sh: the selection flags (--only, --shard, --list), the SUBSET marker and the seconds per script. No browser (nothing here launches Chromium): the lists come from `--list`, the one real run is a cheap node script.
   (a) with no flags the node list is every tools/test_*.js and the ui list is every tools/ui/test_*.js minus test_ramp_ui.js and test_asc_ui.js (the zbuf specs are the three of the zbuf part);
   (b) --only keeps just what matches (base name, comma-separated globs); (b) WITHOUT a weights file --shard is the old split by position, script k -> shard (k mod n) + 1, and combines with --only; WITH the weights (tools/verify_weights.txt): (a) the n shards are an exact partition for n = 2, 3, 4 with and without --only, (c) the estimated sums of 1/2 and 2/2 differ by at most 10 % with the weights of PR #61, (d) a script with no weight still lands in a shard;
   (d) an --only with no match, a bad --shard, and --only on regress / zbuf / shots alone exit 2; (e) a real short run (`node --only test_cams.js --out <tmp>`) writes the SUBSET marker in the figures, the seconds in the header of the script,
   <part>.scripts, "slowest" and "subset" in summary.json and the slowest line in summary.txt; the same run without --only is NOT run here (it would run the whole node part): (a) proves its list.
   MUTATIONS (a copy of verify.sh with one edit; each must make its named check FAIL): tieHighestShard, ignoreWeights, onlyIgnored, noExit2, uiKeepsZbuf, subsetMarkerOff.
     node tools/test_verify_select.js */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const run = (script, args, env) => { const r = spawnSync('bash', [script, ...args], { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, env || {}) }); return { rc: r.status, out: r.stdout, err: r.stderr }; };
const NOWEIGHTS = { VERIFY_WEIGHTS: '/nonexistent/verify_weights.txt' }; // no weights file: every script weighs the same, the split is by position
const listOf = (r, part) => r.out.split('\n').filter((l) => l.startsWith(part + '\t')).map((l) => l.split('\t')[1]);
const REAL = path.join(ROOT, 'tools/verify.sh');
// a mutated copy of verify.sh in a throw-away tree that looks like the repo for the list (tools/ with symlinks to the real scripts)
const ROOTS = [];
const mutant = (edit) => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_')), tools = path.join(root, 'tools'); fs.mkdirSync(tools); ROOTS.push(root);
  for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) if (/^test_.*\.js$/.test(f)) fs.symlinkSync(path.join(ROOT, 'tools', f), path.join(tools, f));
  fs.symlinkSync(path.join(ROOT, 'tools/ui'), path.join(tools, 'ui')); fs.symlinkSync(path.join(ROOT, 'tools/verify_weights.txt'), path.join(tools, 'verify_weights.txt'));
  const src = fs.readFileSync(REAL, 'utf8'), out = edit(src); if (out === src) throw new Error('the mutation did not change verify.sh'); fs.writeFileSync(path.join(tools, 'verify.sh'), out); return path.join(tools, 'verify.sh'); };
const sh = (d) => fs.readdirSync(d).filter((f) => /^test_.*\.js$/.test(f)).sort();
const NODE = sh(path.join(ROOT, 'tools')).map((f) => 'tools/' + f), UI = sh(path.join(ROOT, 'tools/ui')).filter((f) => !['test_ramp_ui.js', 'test_asc_ui.js'].includes(f)).map((f) => 'tools/ui/' + f);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// the checks, written once and applied to the real script and to each mutant
const check = (script, label) => { const res = {};
  const all = run(script, ['--list']);
  res.a = all.rc === 0 && eq(listOf(all, 'node'), NODE) && eq(listOf(all, 'ui'), UI) && listOf(all, 'zbuf').length === 3 && !listOf(all, 'ui').some((f) => /test_ramp_ui|test_asc_ui/.test(f));
  const only = run(script, ['--list', '--only', 'test_pick_ui.js,test_cams.js']);
  res.b = only.rc === 0 && eq(listOf(only, 'node'), ['tools/test_cams.js']) && eq(listOf(only, 'ui'), ['tools/ui/test_pick_ui.js']);
  const s1 = run(script, ['--list', '--shard', '1/2'], NOWEIGHTS), s2 = run(script, ['--list', '--shard', '2/2'], NOWEIGHTS);
  const un = (p) => [...listOf(s1, p), ...listOf(s2, p)];
  res.c = s1.rc === 0 && s2.rc === 0 && eq(listOf(s1, 'node'), NODE.filter((_, k) => k % 2 === 0)) && eq(listOf(s2, 'node'), NODE.filter((_, k) => k % 2 === 1)) && eq(un('node').sort(), NODE.slice().sort()) && eq(un('ui').sort(), UI.slice().sort()) && !listOf(s1, 'ui').some((f) => listOf(s2, 'ui').includes(f));
  const so = run(script, ['--list', '--only', 'test_s*', '--shard', '2/3'], NOWEIGHTS), pick = NODE.filter((f) => path.basename(f).startsWith('test_s')).filter((_, k) => k % 3 === 1);
  res.c2 = so.rc === 0 && eq(listOf(so, 'node'), pick) && pick.length > 0;
  const none = run(script, ['--list', '--only', 'no_such_script*']);
  res.d = none.rc === 2 && /no script matches/.test(none.err); // (the real run with no match is checked only on the real script below: with a mutant that ignores --only it would run the whole part)
  return res; };


// ---- the weights (tools/verify_weights.txt): the n shards are an exact partition, the estimated sums are balanced, a script without a weight still lands in a shard
const WFILE = path.join(ROOT, 'tools/verify_weights.txt');
const readWeights = (f) => { const w = {}; for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!l || l[0] === '#') continue; const [n, v] = l.split('\t'); if (/^\d+(\.\d+)?$/.test(v)) w[n] = +v; } return w; };
const median = (a) => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n === 0 ? 1 : n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
const estimate = (list, W, all) => { const med = median(all.map((f) => W[path.basename(f)]).filter((v) => v !== undefined)); return list.reduce((t, f) => t + (W[path.basename(f)] !== undefined ? W[path.basename(f)] : med), 0); };
const weighted = (script, env) => { const W = readWeights(env && env.VERIFY_WEIGHTS && fs.existsSync(env.VERIFY_WEIGHTS) ? env.VERIFY_WEIGHTS : WFILE), res = { part: true, bal: true, sums: {}, rep: true };
  for (const only of [null, 'test_s*,test_c*']) for (const n of [2, 3, 4]) { const lists = { node: [], ui: [] }, reported = {};
    for (let i = 1; i <= n; i++) { const r = run(script, ['--list', '--shard', `${i}/${n}`, ...(only ? ['--only', only] : [])], env); if (r.rc !== 0) { res.part = false; continue; } for (const part of ['node', 'ui']) lists[part].push(listOf(r, part)); }
    for (const [part, ALL] of [['node', NODE], ['ui', UI]]) { const want = ALL.filter((f) => !only || only.split(',').some((g) => new RegExp('^' + g.replace(/\*/g, '.*') + '$').test(path.basename(f)))), got = [].concat(...lists[part]);
      if (!(got.length === want.length && eq(got.slice().sort(), want.slice().sort()))) res.part = false; } }
  // balance with the real weights: the estimated sums of 1/2 and 2/2 differ by at most 10 % (computed here from the file, not read from the script), node and ui
  for (const [part, ALL] of [['node', NODE], ['ui', UI]]) { const a = listOf(run(script, ['--list', '--shard', '1/2'], env), part), b = listOf(run(script, ['--list', '--shard', '2/2'], env), part), sa = estimate(a, W, ALL), sb = estimate(b, W, ALL);
    res.sums[part] = [Math.round(sa), Math.round(sb)]; if (Math.abs(sa - sb) / Math.max(sa, sb) > 0.10) res.bal = false; }
  // the script's own "~S s" lines agree with the estimate computed here
  { const r = run(script, ['--list', '--shard', '1/3'], env), m = [...r.out.matchAll(/# shard (\d)\/3: (\d+) scripts, ~(\d+) s \((\w+)\)/g)]; for (const [, i, k, sec, part] of m) { const ALL = part === 'node' ? NODE : UI, lst = listOf(run(script, ['--list', '--shard', `${i}/3`], env), part), est = estimate(lst, W, ALL); if (!(+k === lst.length && Math.abs(est - +sec) <= 1.5)) res.rep = false; } if (m.length !== 6) res.rep = false; }
  return res; };
const WR = weighted(REAL, {});
ok('(a) with the weights, the n shards are an EXACT PARTITION of the list (union = all, no overlap) for n = 2, 3, 4, with and without --only, in node and ui', WR.part);
ok(`(c) with the weights of PR #61 the estimated sums of shard 1/2 and 2/2 differ by at most 10 % (ui ${WR.sums.ui.join(' vs ')} s, node ${WR.sums.node.join(' vs ')} s; by position they were 5049 vs 2846)`, WR.bal, WR.sums);
ok('the "# shard s/n: k scripts, ~S s" lines of --list agree with the estimate computed from the file (n = 3, both parts)', WR.rep);
{ // (d) a script with no weight: the file without test_pick_ui.js and test_cams.js; it lands in some shard, the partition holds, it weighs the median of its part
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_w_')), 'weights.txt'); fs.writeFileSync(tmp, fs.readFileSync(WFILE, 'utf8').split('\n').filter((l) => !/^(test_pick_ui|test_cams)\.js\t/.test(l)).join('\n'));
  const E2 = { VERIFY_WEIGHTS: tmp }, R2 = weighted(REAL, E2), where = [1, 2, 3].map((i) => listOf(run(REAL, ['--list', '--shard', `${i}/3`], E2), 'ui').includes('tools/ui/test_pick_ui.js'));
  ok('(d) a script with NO weight (test_pick_ui.js, test_cams.js removed from the file) still lands in exactly one shard, the partition holds for n = 2, 3, 4 and the sums use the median of its part', R2.part && R2.rep && where.filter(Boolean).length === 1, { part: R2.part, rep: R2.rep, where }); }

const R = check(REAL, 'real');
ok('(a) no flags: node = tools/test_*.js, ui = tools/ui/test_*.js minus the two z-buffer tests, zbuf = 3 specs', R.a);
ok('(b) --only keeps just the scripts whose base name matches (comma-separated globs, per part)', R.b);
ok('(b) WITHOUT a weights file --shard 1/2 and 2/2 are exactly the old split by position, script k -> shard (k mod n) + 1, disjoint, union = the full list', R.c);
ok('(b2) without weights --shard combines with --only (the shard is taken after the filter) and is still by position', R.c2);
ok('(d) --only with no match exits 2 with a clear message (with --list)', R.d);
{ const r = run(REAL, ['node', '--only', 'no_such_script*', '--out', fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_o_'))]); ok('(d) the same in a real run (nothing is executed): exit 2', r.rc === 2 && /no script matches/.test(r.err), r.rc); }
{ const bad = [['--list', '--shard', '3/2'], ['--list', '--shard', 'x'], ['--list', '--shard', '0/2'], ['regress', '--only', 'x'], ['zbuf', '--shard', '1/2'], ['shots', '--only', 'x'], ['--only']].map((a) => run(REAL, a).rc);
  ok('(d) a bad --shard, --only / --shard on regress / zbuf / shots alone, and --only without a value exit 2', bad.every((c) => c === 2), bad); }
{ const l = run(REAL, ['regress', '--list']); ok('--list on regress prints the whole part and exits 0 without running anything', l.rc === 0 && /^regress\t\(whole part\)/m.test(l.out)); }
{ const l = run(REAL, ['--list', '--only', 'test_cams.js']); ok('--only / --shard without a named part select the parts node ui (not regress: it would run in full)', !/^regress|^zbuf/m.test(l.out)); }
// (e) a real short run
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_run_')), r = run(REAL, ['node', '--only', 'test_cams.js', '--out', out]);
  const log = fs.existsSync(path.join(out, 'node.log')) ? fs.readFileSync(path.join(out, 'node.log'), 'utf8') : '', res = fs.existsSync(path.join(out, 'node.result')) ? fs.readFileSync(path.join(out, 'node.result'), 'utf8') : '';
  const js = fs.existsSync(path.join(out, 'summary.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'summary.json'), 'utf8')) : null, txt = fs.existsSync(path.join(out, 'summary.txt')) ? fs.readFileSync(path.join(out, 'summary.txt'), 'utf8') : '';
  const scripts = fs.existsSync(path.join(out, 'node.scripts')) ? fs.readFileSync(path.join(out, 'node.scripts'), 'utf8') : '';
  ok('(e) a real run (node --only test_cams.js): exit 0, the header of the script has the seconds: "== tools/test_cams.js (exit 0, N s)"', r.rc === 0 && /^== tools\/test_cams\.js \(exit 0, \d+ s\)$/m.test(log), { rc: r.rc, head: log.split('\n')[0] });
  ok('(e) the figures start with the SUBSET marker (k de N scripts) and the stdout line too', /^SUBSET \(--only test_cams\.js, 1 de \d+ scripts\): 1 scripts passed, 0 failed/m.test(res) && /SUBSET \(--only test_cams\.js, 1 de \d+ scripts\)/.test(r.out), { res, out: r.out.slice(0, 300) });
  ok('(e) <part>.scripts, summary.json ("subset": true, "slowest") and summary.txt ("slowest:") carry the seconds', /^test_cams\.js\t\d+\t0$/m.test(scripts) && js && js.parts.node.subset === true && js.parts.node.slowest.length === 1 && js.parts.node.slowest[0].name === 'test_cams.js' && /slowest: test_cams\.js \d+ s/.test(txt), { scripts, txt });
  fs.rmSync(out, { recursive: true, force: true }); }

// mutations
const M = [
  ['tieHighestShard', (s) => s.replace('if (sum[s] < sum[m]) m = s', 'if (sum[s] <= sum[m]) m = s'), 'c'],
  ['onlyIgnored', (s) => s.replace('[ -z "$ONLY" ] && return 0', 'return 0'), 'b'],
  ['noExit2', (s) => s.replace("in the parts: ${PARTS[*]}\" >&2; exit 2; }", "in the parts: ${PARTS[*]}\" >&2; exit 0; }"), 'd'],
  ['uiKeepsZbuf', (s) => s.replace('test_ramp_ui.js|test_asc_ui.js) continue;; esac; ALL_ui+=', 'test_nothing.js) continue;; esac; ALL_ui+='), 'a'],
];
{ const mp = mutant((s) => s.replace('if [ -f "$WFILE" ]; then while', 'if false; then while')), wm = weighted(mp, {}); ok('MUTATION ignoreWeights (the weights file is not read: the split falls back to the position): the balance check (c) FAILS', wm.bal === false && wm.part === true, wm); }
for (const [name, edit, key] of M) { const rr = check(mutant(edit), name); ok(`MUTATION ${name}: the check (${key}) FAILS`, rr[key] === false, rr); }
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_mut_')), mp = mutant((s) => s.replace('echo "SUBSET ($d, $k de $n scripts): "', 'echo ""')), r = spawnSync('bash', [mp, 'node', '--only', 'test_cams.js', '--out', out], { cwd: path.dirname(path.dirname(mp)), encoding: 'utf8' });
  const res = fs.existsSync(path.join(out, 'node.result')) ? fs.readFileSync(path.join(out, 'node.result'), 'utf8') : '';
  ok('MUTATION subsetMarkerOff: the SUBSET marker check FAILS (a subset would read like a full pass)', !/^SUBSET/m.test(res), res); fs.rmSync(out, { recursive: true, force: true }); }
for (const r of ROOTS) fs.rmSync(r, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
