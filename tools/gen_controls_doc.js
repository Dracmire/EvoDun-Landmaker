/* Generates docs/controls.md from the controls table (src/controls.js). Run by tools/build.py; tools/test_controls.js checks that the committed file is in sync.
     node tools/gen_controls_doc.js [--check]   (--check: exit 1 when docs/controls.md differs from the table) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'docs/controls.md');
exports.generate = () => {
  const ctx = { window: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/controls.js'), 'utf8'), ctx, { filename: 'controls.js' });
  return ctx.window.EVO.controls;
};
if (require.main === module) {
  const md = exports.generate().docs();
  if (process.argv.includes('--check')) { const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''; if (cur !== md) { console.error('docs/controls.md is out of sync with src/controls.js: run node tools/gen_controls_doc.js'); process.exit(1); } console.log('docs/controls.md in sync'); }
  else { fs.writeFileSync(OUT, md); console.log('wrote', OUT); }
}
