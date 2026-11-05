/* dist/viewer.html and index.html load the SAME modules (no browser).
   build.py had two hand-written module lists; a module added to one (border.js of S2, objects.js of S4a) was missing from dist/viewer.html and nothing opened dist, so it escaped (S2 border: "Cannot read properties of undefined (reading 'apply')").
   Checks: (a) every `<script src="src/X.js">` of index.html appears in dist/viewer.html with the CONTENT of src/X.js, in the same relative order, and dist has no module that index.html does not load (each src file is found once); (b) build.py has ONE module list (MODULES) used for both outputs: no literal `<script src="src/<name>.js">` tag in it;
   (c) index.html and dist/viewer.html are up to date with `python3 tools/build.py` (the script lists and the module contents are those of the sources now).
   MUTATIONS (on the text of dist, in memory; each makes its named check FAIL): dropObjects (the content of objects.js removed), swapOrder (border.js and objects.js exchanged), staleContent (one line of src/objects.js changed in dist), extraModule (a source file that index.html does not load added to dist).
     node tools/test_dist_modules.js */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'); let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 400)); } };
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const index = read('index.html'), dist = read('dist/viewer.html'), build = read('tools/build.py');
const mods = [...index.matchAll(/<script src="src\/([A-Za-z0-9_]+)\.js"><\/script>/g)].map((m) => m[1]);
const check = (distText) => { const bad = [], pos = []; let last = -1;
  for (const m of mods) { const body = read(`src/${m}.js`), i = distText.indexOf(body); if (i < 0) { bad.push(m + ': content missing'); pos.push(-1); continue; } pos.push(i); if (i < last) bad.push(m + ': out of order'); last = Math.max(last, i); }
  // no module of src/ that index.html does not load may be in dist (each source file's first line is searched)
  const extra = fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js') && !mods.includes(f.slice(0, -3)) && distText.indexOf(read('src/' + f)) >= 0).map((f) => f + ': in dist but not in index.html');
  return bad.concat(extra); };
ok(`index.html loads ${mods.length} modules (${mods.join(' ')})`, mods.length >= 20 && mods.includes('border') && mods.includes('objects') && mods[mods.length - 1] === 'ui', mods);
{ const bad = check(dist); ok('every module of index.html is in dist/viewer.html with its content, in the same order, and dist has nothing else', bad.length === 0, bad); }
{ const a = (build.match(/MODULES\s*=\s*\[/g) || []).length, lit = build.match(/<script src="src\/[A-Za-z0-9_]+\.js"/g) || []; ok('build.py has ONE module list (MODULES) used for both outputs: no literal <script src="src/<name>.js"> tag in it', a === 1 && lit.length === 0 && /for n in MODULES\)/.test(build) && /MODULES\+\['ui'\]/.test(build), { lists: a, literals: lit }); }
{ // up to date: the module list of the sources now equals what build.py would write (index.html is generated from MODULES + ui)
  const decl = (build.match(/MODULES\s*=\s*\[([^\]]*)\]/) || [, ''])[1].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean);
  ok('the MODULES of build.py + ui are exactly the scripts of index.html (index.html is up to date)', JSON.stringify(decl.concat(['ui'])) === JSON.stringify(mods), { decl, mods }); }
// mutations
{ const d = dist.replace(read('src/objects.js'), ''); ok('MUTATION dropObjects (objects.js removed from dist): the content check FAILS', check(d).some((b) => /^objects: content missing/.test(b)), check(d)); }
{ const b = read('src/border.js'), o = read('src/objects.js'), d = dist.replace(b, '\u0001B').replace(o, '\u0001O').replace('\u0001B', o).replace('\u0001O', b); ok('MUTATION swapOrder (border.js and objects.js exchanged in dist): the order check FAILS', check(d).some((x) => /out of order/.test(x)), check(d)); }
{ const o = read('src/objects.js'), d = dist.replace(o, o.replace('const LW0 = 1.6', 'const LW0 = 1.7')); ok('MUTATION staleContent (one constant of objects.js changed in dist): the content check FAILS', d !== dist && check(d).some((x) => /^objects: content missing/.test(x))); }
{ const extra = fs.readdirSync(path.join(ROOT, 'src')).find((f) => f.endsWith('.js') && !mods.includes(f.slice(0, -3))); if (extra) { const d = dist + '\n' + read('src/' + extra); ok(`MUTATION extraModule (${extra} added to dist): the extra-module check FAILS`, check(d).some((x) => /in dist but not in index/.test(x))); } else ok('every source file is loaded by index.html (no extra-module mutation possible)', true); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
