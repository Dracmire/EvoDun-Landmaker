/* Exactness test for src/png.js. Run: node tools/test_png.js   (Node >= 18, no dependencies)
   Every case encodes known sample values with an independent minimal encoder (zlib + all filter types),
   decodes them with E.decodePng and requires bit-exact equality per channel. */
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib');
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../src/png.js'), 'utf8'));
const { decodePng } = window.EVO;

let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const be32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b; };
const crcTab = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcTab[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const td = Buffer.concat([Buffer.from(type, 'latin1'), data]); return Buffer.concat([be32(data.length), td, be32(crc(td))]); };
const CH = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function filterRow(f, cur, prev, bpp) {
  const out = Buffer.alloc(cur.length);
  for (let i = 0; i < cur.length; i++) {
    const a = i >= bpp ? cur[i - bpp] : 0, b = prev ? prev[i] : 0, c = prev && i >= bpp ? prev[i - bpp] : 0;
    let p = 0;
    if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
    else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
    out[i] = (cur[i] - p) & 255;
  }
  return out;
}
/* samples: array of per-channel arrays (values 0..2^depth-1). opts: filter (0-4, or 'mix'), idatSplit, extra chunks. */
function encode(w, h, ct, depth, samples, o = {}) {
  const nch = CH[ct], bits = nch * depth, stride = (w * bits + 7) >> 3, bpp = Math.max(1, bits >> 3);
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(stride);
    for (let x = 0; x < w; x++) for (let k = 0; k < nch; k++) {
      const v = samples[k][y * w + x];
      if (depth === 16) { row[(x * nch + k) * 2] = v >> 8; row[(x * nch + k) * 2 + 1] = v & 255; }
      else if (depth === 8) row[x * nch + k] = v;
      else { const per = 8 / depth; row[(x / per) | 0] |= v << (8 - depth * ((x % per) + 1)); }
    }
    rows.push(row);
  }
  const parts = [];
  for (let y = 0; y < h; y++) {
    const f = o.filter === undefined || o.filter === 'mix' ? y % 5 : o.filter;
    parts.push(Buffer.from([f]), filterRow(f, rows[y], y ? rows[y - 1] : null, bpp));
  }
  const z = zlib.deflateSync(Buffer.concat(parts));
  const ihdr = Buffer.concat([be32(w), be32(h), Buffer.from([depth, ct, 0, 0, o.interlace || 0])]);
  const idats = [], n = o.idatSplit || 1, sz = Math.ceil(z.length / n);
  for (let i = 0; i < z.length; i += sz) idats.push(chunk('IDAT', z.subarray(i, i + sz)));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), ...(o.before || []), ...idats, ...(o.after || []), chunk('IEND', Buffer.alloc(0))]);
}
const randSamples = (n, nch, depth) => Array.from({ length: nch }, () => Array.from({ length: n }, () => Math.floor(rnd() * (1 << depth))));
const edgeSamples = (n, nch, depth) => Array.from({ length: nch }, (_, k) => Array.from({ length: n }, (_, i) => [0, 1, (1 << depth) - 1, (1 << depth) - 2, 1 << (depth - 1)][(i + k) % 5]));

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; if (!cond) console.log('FAIL', name, extra || ''); };
async function expectExact(name, buf, w, h, ct, depth, samples) {
  try {
    const r = await decodePng(buf);
    ok(name + ' header', r.width === w && r.height === h && r.bitDepth === depth && r.colorType === ct, JSON.stringify([r.width, r.height, r.bitDepth, r.colorType]));
    ok(name + ' channel count', r.channels.length === CH[ct]);
    ok(name + ' array type', r.channels[0].constructor === (depth === 16 ? Uint16Array : Uint8Array));
    let bad = 0;
    for (let k = 0; k < CH[ct]; k++) for (let i = 0; i < w * h; i++) if (r.channels[k][i] !== samples[k][i]) bad++;
    ok(name + ' values', bad === 0, bad + ' samples differ');
    return r;
  } catch (e) { ok(name, false, e.message); }
}
async function expectError(name, buf, re) {
  try { await decodePng(buf); ok(name, false, 'no error'); } catch (e) { ok(name, re.test(e.message), e.message); }
}

(async () => {
  // 1. every colour type x allowed depth x filter (each filter alone, and mixed per row), odd sizes to stress sub-byte padding
  const combos = [[0, [1, 2, 4, 8, 16]], [2, [8, 16]], [3, [1, 2, 4, 8]], [4, [8, 16]], [6, [8, 16]]];
  for (const [ct, depths] of combos) for (const depth of depths) for (const [w, h] of [[1, 1], [7, 5], [13, 11], [64, 3]]) for (const filter of [0, 1, 2, 3, 4, 'mix']) {
    const nch = CH[ct], s = randSamples(w * h, nch, depth);
    const buf = encode(w, h, ct, depth, s, { filter, before: ct === 3 ? [chunk('PLTE', Buffer.alloc(3 << depth))] : [] });
    await expectExact(`ct${ct} d${depth} ${w}x${h} f${filter}`, buf, w, h, ct, depth, s);
  }
  // 2. full-range edge values (0, 1, max-1, max) incl. 16-bit
  for (const [ct, depth] of [[0, 16], [2, 16], [4, 16], [6, 16], [6, 8], [0, 8]]) {
    const w = 17, h = 9, s = edgeSamples(w * h, CH[ct], depth);
    await expectExact(`edge ct${ct} d${depth}`, encode(w, h, ct, depth, s, { filter: 'mix' }), w, h, ct, depth, s);
  }
  // 3. alpha: arbitrary RGB under alpha 0 / 1 / 128 / 254 / 255 must come back untouched (no premultiplication)
  for (const depth of [8, 16]) {
    const w = 16, h = 16, s = randSamples(w * h, 4, depth), M = (1 << depth) - 1;
    s[3] = s[3].map((_, i) => [0, 1, M >> 1, M - 1, M][i % 5]);
    await expectExact(`alpha d${depth}`, encode(w, h, 6, depth, s), w, h, 6, depth, s);
  }
  // 4. multiple IDAT chunks, with ancillary chunks (gAMA 1.0, sRGB, cHRM, iCCP junk, tEXt, tRNS) that must not change the data
  {
    const w = 33, h = 21, s = randSamples(w * h, 4, 8);
    const gama = chunk('gAMA', be32(100000)), srgb = chunk('sRGB', Buffer.from([0])), text = chunk('tEXt', Buffer.from('k\0v'));
    const iccp = chunk('iCCP', Buffer.concat([Buffer.from('p\0\0'), zlib.deflateSync(Buffer.alloc(200, 7))]));
    await expectExact('split IDAT x7 + ancillary', encode(w, h, 6, 8, s, { idatSplit: 7, before: [gama, srgb, iccp, text] }), w, h, 6, 8, s);
    const s16 = randSamples(w * h, 3, 16);
    await expectExact('16-bit RGB + gAMA + iCCP', encode(w, h, 2, 16, s16, { before: [gama, iccp] }), w, h, 2, 16, s16);
  }
  // 5. palette: indices are the channel, palette and tRNS are exposed
  {
    const w = 9, h = 4, s = randSamples(w * h, 1, 4), pal = Buffer.from(Array.from({ length: 48 }, (_, i) => (i * 5) & 255));
    const r = await expectExact('palette 4-bit', encode(w, h, 3, 4, s, { before: [chunk('PLTE', pal), chunk('tRNS', Buffer.from([0, 128]))] }), w, h, 3, 4, s);
    ok('palette rgb', r && r.palette.rgb.length === 48 && r.palette.rgb[5] === pal[5]);
    ok('palette tRNS', r && r.palette.alpha[0] === 0 && r.palette.alpha[1] === 128 && r.palette.alpha[2] === 255);
  }
  // 6. a 256x256 RGBA 8-bit image (the size of a real map), timing
  {
    const s = randSamples(256 * 256, 4, 8), buf = encode(256, 256, 6, 8, s, { filter: 'mix' });
    const t = process.hrtime.bigint();
    await expectExact('256x256 RGBA', buf, 256, 256, 6, 8, s);
    console.log('256x256 RGBA decode: ' + Number(process.hrtime.bigint() - t) / 1e6 + ' ms (incl. test compare)');
  }
  // 7. errors must be explicit
  {
    const w = 8, h = 8, s = randSamples(w * h, 4, 8), good = encode(w, h, 6, 8, s);
    await expectError('interlaced rejected', encode(w, h, 6, 8, s, { interlace: 1 }), /interlaced \(Adam7\).*not supported/);
    await expectError('not a PNG', Buffer.from('hello world, definitely not png'), /not a PNG/);
    await expectError('empty', Buffer.alloc(0), /not a PNG/);
    const bad = Buffer.from(good); bad[good.length - 20] ^= 0xff;
    await expectError('CRC mismatch', bad, /CRC mismatch/);
    await expectError('truncated', good.subarray(0, good.length - 30), /truncated|CRC|corrupt/);
    await expectError('no IEND', good.subarray(0, good.length - 12), /no IEND/);
    const badDepth = encode(w, h, 2, 8, randSamples(w * h, 3, 8)); // RGB with bit depth 5 (CRC recomputed)
    badDepth[24] = 5; badDepth.writeUInt32BE(crc(badDepth.subarray(12, 29)), 29);
    await expectError('invalid colour type / bit depth', badDepth, /invalid colour type 2 \/ bit depth 5/);
    const wrong = encode(w, h, 6, 8, s); // IHDR says 8x8; patch to 8x9 with a recomputed CRC -> size mismatch
    wrong.writeUInt32BE(9, 20); wrong.writeUInt32BE(crc(wrong.subarray(12, 29)), 29);
    await expectError('size mismatch', wrong, /does not match/);
  }
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
