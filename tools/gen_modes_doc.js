/* Generates docs/modes.md from the modes table (src/modes.js). Run by tools/build.py; tools/test_modes.js checks that the committed file is in sync.
     node tools/gen_modes_doc.js [--check]   (--check: exit 1 when docs/modes.md differs from the table) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'docs/modes.md');
exports.generate = () => {
  const ctx = { window: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['src/controls.js', 'src/modes.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return { modes: ctx.window.EVO.modes, controls: ctx.window.EVO.controls };
};
if (require.main === module) {
  const md = exports.generate().modes.docs();
  if (process.argv.includes('--check')) { const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''; if (cur !== md) { console.error('docs/modes.md is out of sync with src/modes.js: run node tools/gen_modes_doc.js'); process.exit(1); } console.log('docs/modes.md in sync'); }
  else { fs.writeFileSync(OUT, md); console.log('wrote', OUT); }
}
