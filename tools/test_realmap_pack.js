/* The built-in "Real map 256 (height only)": the PNG embedded in data/packs.js (base64) goes through E.packFromPng (the viewer's path for a loaded file: decodePng -> imageChannels -> packFromRoles, channel V) and must give
   EXACTLY the pack of tools/real_pack.js (the helper every rooms test uses: a hand-made `v / max * 1000` moves the terraces). Also: the embedded bytes are the file of data/samples/.   node tools/test_realmap_pack.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../data/packs.js'), 'utf8'));
const E = window.EVO; let fail = 0;
const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  ' + x : '')); if (!c) fail++; };
(async () => {
  const bytes = Buffer.from(window.EVO_REAL_PNG, 'base64'), file = fs.readFileSync(path.join(__dirname, '../data/samples/skeleton_heightmap_256.png'));
  ok('the embedded PNG is the file of data/samples/ byte for byte', bytes.equals(file), bytes.length + ' vs ' + file.length);
  const built = await E.packFromPng(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), 'skeleton_heightmap_256.png'), ref = (await require('./real_pack.js').load(E)).mk();
  ok('size 256 x 256', built.width === 256 && built.height === 256 && ref.width === 256);
  ok('the elevation is identical to tools/real_pack.js, value for value', built.elevation.length === ref.elevation.length && built.elevation.every((v, i) => v === ref.elevation[i]));
  ok('the elevation range, masks, markers and roles info are identical', JSON.stringify([built.elevRange, built.masks, built.markers, built.name]) === JSON.stringify([ref.elevRange, ref.masks, ref.markers, ref.name]), JSON.stringify(built.elevRange));
  ok('32 % of the map is void (0) and the lowest land is above 0 (the real map)', (() => { let z = 0, lo = 1e9; for (const v of built.elevation) { if (v <= 0) z++; else lo = Math.min(lo, v); } return z / built.elevation.length > 0.3 && z / built.elevation.length < 0.35 && lo > 0; })());
  console.log(fail ? `\n${fail} failed` : '\nall passed'); process.exit(fail ? 1 : 0);
})();
