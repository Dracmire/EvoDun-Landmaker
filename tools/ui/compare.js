/* Compares the PNG files of two regress.js output directories pixel by pixel (our own PNG decoder).
     node tools/ui/compare.js <dirA> <dirB> */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../../src/png.js'), 'utf8'));
(async () => {
  const [A, B] = process.argv.slice(2); let bad = 0, total = 0;
  for (const f of fs.readdirSync(A).filter((x) => x.endsWith('.png')).sort()) {
    if (!fs.existsSync(path.join(B, f))) { console.log('MISSING in B:', f); bad++; continue; }
    const x = await window.EVO.decodePng(fs.readFileSync(path.join(A, f))), y = await window.EVO.decodePng(fs.readFileSync(path.join(B, f)));
    total++;
    if (x.width !== y.width || x.height !== y.height) { console.log('SIZE', f); bad++; continue; }
    let d = 0; for (let k = 0; k < x.channels.length; k++) for (let i = 0; i < x.channels[k].length; i++) if (x.channels[k][i] !== y.channels[k][i]) { d++; }
    if (d) { console.log(`DIFF ${f}: ${d} samples`); bad++; }
  }
  console.log(`${total} images compared, ${bad} differ`);
  process.exit(bad ? 1 : 0);
})();
