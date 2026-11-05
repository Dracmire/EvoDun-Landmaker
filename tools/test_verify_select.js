/* tools/verify.sh: the selection flags (--only, --shard, --list), the SUBSET marker and the seconds per script. No browser (nothing here launches Chromium): the lists come from `--list`, the one real run is a cheap node script.
   (a) with no flags the node list is every tools/test_*.js and the ui list is every tools/ui/test_*.js minus test_ramp_ui.js and test_asc_ui.js (the zbuf specs are the three of the zbuf part);
   (b) --only keeps just what matches (base name, comma-separated globs); (c) --shard 1/2 and 2/2 are disjoint and their union is the full list, by position (k mod n) + 1, and --shard combines with --only;
   (d) an --only with no match, a bad --shard, and --only on regress / zbuf / shots alone exit 2; (e) a real short run (`node --only test_cams.js --out <tmp>`) writes the SUBSET marker in the figures, the seconds in the header of the script,
   <part>.scripts, "slowest" and "subset" in summary.json and the slowest line in summary.txt; the same run without --only is NOT run here (it would run the whole node part): (a) proves its list.
   MUTATIONS (a copy of verify.sh with one edit; each must make its named check FAIL): shardOffByOne, onlyIgnored, noExit2, uiKeepsZbuf, subsetMarkerOff.
     node tools/test_verify_select.js */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 600)); } };
const run = (script, args) => { const r = spawnSync('bash', [script, ...args], { cwd: ROOT, encoding: 'utf8' }); return { rc: r.status, out: r.stdout, err: r.stderr }; };
const listOf = (r, part) => r.out.split('\n').filter((l) => l.startsWith(part + '\t')).map((l) => l.split('\t')[1]);
const REAL = path.join(ROOT, 'tools/verify.sh');
// a mutated copy of verify.sh in a throw-away tree that looks like the repo for the list (tools/ with symlinks to the real scripts)
const ROOTS = [];
const mutant = (edit) => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_')), tools = path.join(root, 'tools'); fs.mkdirSync(tools); ROOTS.push(root);
  for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) if (/^test_.*\.js$/.test(f)) fs.symlinkSync(path.join(ROOT, 'tools', f), path.join(tools, f));
  fs.symlinkSync(path.join(ROOT, 'tools/ui'), path.join(tools, 'ui'));
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
  const s1 = run(script, ['--list', '--shard', '1/2']), s2 = run(script, ['--list', '--shard', '2/2']);
  const un = (p) => [...listOf(s1, p), ...listOf(s2, p)];
  res.c = s1.rc === 0 && s2.rc === 0 && eq(listOf(s1, 'node'), NODE.filter((_, k) => k % 2 === 0)) && eq(listOf(s2, 'node'), NODE.filter((_, k) => k % 2 === 1)) && eq(un('node').sort(), NODE.slice().sort()) && eq(un('ui').sort(), UI.slice().sort()) && !listOf(s1, 'ui').some((f) => listOf(s2, 'ui').includes(f));
  const so = run(script, ['--list', '--only', 'test_s*', '--shard', '2/3']), pick = NODE.filter((f) => path.basename(f).startsWith('test_s')).filter((_, k) => k % 3 === 1);
  res.c2 = so.rc === 0 && eq(listOf(so, 'node'), pick) && pick.length > 0;
  const none = run(script, ['--list', '--only', 'no_such_script*']);
  res.d = none.rc === 2 && /no script matches/.test(none.err); // (the real run with no match is checked only on the real script below: with a mutant that ignores --only it would run the whole part)
  return res; };

const R = check(REAL, 'real');
ok('(a) no flags: node = tools/test_*.js, ui = tools/ui/test_*.js minus the two z-buffer tests, zbuf = 3 specs', R.a);
ok('(b) --only keeps just the scripts whose base name matches (comma-separated globs, per part)', R.b);
ok('(c) --shard 1/2 and 2/2: by position (k mod n) + 1, disjoint, union = the full list', R.c);
ok('(c2) --shard combines with --only (the shard is taken after the filter)', R.c2);
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
  ['shardOffByOne', (s) => s.replace('$((k % SH_N + 1))', '$((k % SH_N))'), 'c'],
  ['onlyIgnored', (s) => s.replace('[ -z "$ONLY" ] && return 0', 'return 0'), 'b'],
  ['noExit2', (s) => s.replace("in the parts: ${PARTS[*]}\" >&2; exit 2; }", "in the parts: ${PARTS[*]}\" >&2; exit 0; }"), 'd'],
  ['uiKeepsZbuf', (s) => s.replace('test_ramp_ui.js|test_asc_ui.js) continue;; esac; ALL_ui+=', 'test_nothing.js) continue;; esac; ALL_ui+='), 'a'],
];
for (const [name, edit, key] of M) { const rr = check(mutant(edit), name); ok(`MUTATION ${name}: the check (${key}) FAILS`, rr[key] === false, rr); }
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'vsel_mut_')), mp = mutant((s) => s.replace('echo "SUBSET ($d, $k de $n scripts): "', 'echo ""')), r = spawnSync('bash', [mp, 'node', '--only', 'test_cams.js', '--out', out], { cwd: path.dirname(path.dirname(mp)), encoding: 'utf8' });
  const res = fs.existsSync(path.join(out, 'node.result')) ? fs.readFileSync(path.join(out, 'node.result'), 'utf8') : '';
  ok('MUTATION subsetMarkerOff: the SUBSET marker check FAILS (a subset would read like a full pass)', !/^SUBSET/m.test(res), res); fs.rmSync(out, { recursive: true, force: true }); }
for (const r of ROOTS) fs.rmSync(r, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
