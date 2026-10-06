/* PNG decoder for data images: raw samples per channel, no canvas, no colour management,
   no alpha premultiplication. Inflate comes from DecompressionStream. */
(function (E) {
  const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
  const NAMES = { 0: ['V'], 2: ['R', 'G', 'B'], 3: ['I'], 4: ['V', 'A'], 6: ['R', 'G', 'B', 'A'] };

  let crcTable = null;
  function crc32(u8, from, to) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
    }
    let c = 0xffffffff;
    for (let i = from; i < to; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  async function inflate(parts) {
    const ds = new DecompressionStream('deflate'); // PNG IDAT is a zlib stream
    const w = ds.writable.getWriter();
    const feed = (async () => { for (const p of parts) await w.write(p); await w.close(); })();
    try {
      const [, out] = await Promise.all([feed, new Response(ds.readable).arrayBuffer()]);
      return new Uint8Array(out);
    } catch (e) { throw new Error('PNG: corrupt compressed data (' + (e && e.message || e) + ')'); }
  }

  function unfilter(raw, h, stride, bpp) {
    // raw rows are [filter byte][stride bytes]; result is written in place, rows packed at y*stride.
    const out = new Uint8Array(h * stride);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride, up = dst - stride;
      if (f > 4) throw new Error('PNG: bad filter type ' + f + ' on row ' + y);
      for (let i = 0; i < stride; i++) {
        const x = raw[src + i];
        const a = i >= bpp ? out[dst + i - bpp] : 0;
        const b = y ? out[up + i] : 0;
        const c = y && i >= bpp ? out[up + i - bpp] : 0;
        let v;
        if (f === 0) v = x;
        else if (f === 1) v = x + a;
        else if (f === 2) v = x + b;
        else if (f === 3) v = x + ((a + b) >> 1);
        else {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        }
        out[dst + i] = v & 255;
      }
    }
    return out;
  }

  /* data: ArrayBuffer | Uint8Array. Resolves to
     { width, height, bitDepth, colorType, names, channels, max, palette }
     channels[k] is a width*height typed array (Uint8Array for depth <= 8, Uint16Array for 16), the raw sample
     values (sub-byte depths are unpacked, not rescaled). Palette images give the index as channel 'I' and the
     palette in `palette` ({ rgb, alpha } from PLTE / tRNS); other images have palette = null. */
  E.decodePng = async function (data) {
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (u8.length < 8 || SIG.some((b, i) => u8[i] !== b)) throw new Error('PNG: not a PNG file (bad signature)');
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let pos = 8, ihdr = null, plte = null, trns = null, ended = false;
    const idat = [];
    while (pos < u8.length && !ended) {
      if (pos + 12 > u8.length) throw new Error('PNG: truncated file (incomplete chunk header)');
      const len = dv.getUint32(pos), type = String.fromCharCode(u8[pos + 4], u8[pos + 5], u8[pos + 6], u8[pos + 7]);
      if (pos + 12 + len > u8.length) throw new Error(`PNG: truncated file (chunk ${type} runs past the end)`);
      if (crc32(u8, pos + 4, pos + 8 + len) !== dv.getUint32(pos + 8 + len)) throw new Error(`PNG: CRC mismatch in chunk ${type}`);
      const body = u8.subarray(pos + 8, pos + 8 + len);
      if (!ihdr && type !== 'IHDR') throw new Error('PNG: IHDR must be the first chunk');
      if (type === 'IHDR') {
        if (ihdr || len !== 13) throw new Error('PNG: bad IHDR');
        const b = new DataView(body.buffer, body.byteOffset, 13);
        ihdr = { w: b.getUint32(0), h: b.getUint32(4), depth: body[8], ct: body[9], comp: body[10], filt: body[11], inter: body[12] };
      } else if (type === 'PLTE') plte = body;
      else if (type === 'tRNS') trns = body;
      else if (type === 'IDAT') idat.push(body);
      else if (type === 'IEND') ended = true;
      else if ((type.charCodeAt(0) & 32) === 0) throw new Error('PNG: unknown critical chunk ' + type);
      pos += 12 + len;
    }
    if (!ihdr) throw new Error('PNG: missing IHDR');
    if (!ended) throw new Error('PNG: truncated file (no IEND)');
    const { w, h, depth, ct } = ihdr;
    if (!w || !h) throw new Error('PNG: zero-sized image');
    if (!DEPTHS[ct] || !DEPTHS[ct].includes(depth)) throw new Error(`PNG: invalid colour type ${ct} / bit depth ${depth}`);
    if (ihdr.comp || ihdr.filt) throw new Error('PNG: unknown compression or filter method');
    if (ihdr.inter === 1) throw new Error('PNG: interlaced (Adam7) files are not supported; re-export without interlacing');
    if (ihdr.inter !== 0) throw new Error('PNG: bad interlace method');
    if (ct === 3 && !plte) throw new Error('PNG: palette image without PLTE');
    if (!idat.length) throw new Error('PNG: no image data');

    const nch = CHANNELS[ct], bits = nch * depth, stride = (w * bits + 7) >> 3, bpp = Math.max(1, bits >> 3);
    const raw = await inflate(idat);
    if (raw.length !== h * (stride + 1)) throw new Error(`PNG: image data size ${raw.length} does not match ${w}x${h} (expected ${h * (stride + 1)})`);
    const pix = unfilter(raw, h, stride, bpp);

    const n = w * h, Arr = depth === 16 ? Uint16Array : Uint8Array;
    const channels = Array.from({ length: nch }, () => new Arr(n));
    if (depth === 8) {
      for (let i = 0; i < n; i++) for (let k = 0; k < nch; k++) channels[k][i] = pix[i * nch + k];
    } else if (depth === 16) {
      for (let i = 0; i < n; i++) for (let k = 0; k < nch; k++) channels[k][i] = (pix[(i * nch + k) * 2] << 8) | pix[(i * nch + k) * 2 + 1];
    } else { // 1, 2, 4 bits: one channel, MSB first, rows byte-aligned
      const mask = (1 << depth) - 1, per = 8 / depth, c0 = channels[0];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const byte = pix[y * stride + ((x / per) | 0)];
        c0[y * w + x] = (byte >> (8 - depth * ((x % per) + 1))) & mask;
      }
    }
    let palette = null;
    if (ct === 3) {
      const m = Math.floor(plte.length / 3), alpha = new Uint8Array(m).fill(255);
      if (trns) alpha.set(trns.subarray(0, m));
      palette = { rgb: plte.slice(0, m * 3), alpha };
    }
    return { width: w, height: h, bitDepth: depth, colorType: ct, names: NAMES[ct].slice(), channels, max: (1 << depth) - 1, palette };
  };
})(window.EVO = window.EVO || {});
