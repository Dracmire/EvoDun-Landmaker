# Measurements

Both measurements were taken in headless Chromium 141 (Playwright 1.56, `chromium-1194`) on `file://`,
software rasteriser (no GPU), on the state of the repo at PR #1. Treat timings as ±30 %.

## 1. Timing (ms)

Test data: 4-octave value noise (`fbm`, detail at tile scale), square maps, default `P`
(5 terraces x 3 sub-terraces, 15 levels; they were called micro steps then), canvas 1200x800, all display toggles at their defaults,
resolution limit of 96 lifted for the test. The `noisePack` stand-in (9 cells) gives similar numbers
(256: A 210-260, B cold 1640-1920).

- `shape` is the median of 3 runs.
- *cold* is the first render with an empty contour cache (`S.cache = {}`), so it includes the loops
  of technique A/B; *warm* is the median of 5 following renders.
- Presets: oblique = 0°/50°, iso = 45°/35°.

| Side | shape | Box obl. cold / warm | A obl. | B obl. | Box iso | A iso | B iso |
|-----:|------:|---------------------:|-------:|-------:|--------:|------:|------:|
|   96 |    12 |             123 / 58 | 89 / 114 | 373 / 16 | 158 / 111 | 90 / 123 | 338 / 121 |
|  128 |    19 |            136 / 125 | 107 / 123 | 547 / 115 | 184 / 170 | 129 / 126 | 548 / 116 |
|  256 |    69 |            444 / 359 | 312 / 254 | 1885 / 121 | 451 / 436 | 301 / 301 | 1929 / 119 |

Reading it:
- Box grows roughly linearly with tile count and has no cache.
- A stays at 250-310 ms at 256 whether cold or warm.
- B is expensive only when cold (~1.9 s at 256: signed distance field + marching squares) and cheap once
  cached. Any shaping or blur slider invalidates that cache.
- Some warm numbers are noisy (e.g. A warm > cold at 96); that is the software rasteriser, not a bug.

## 2. PNG read-back through canvas

Path tested: `Image` -> `drawImage` -> `getImageData`, i.e. what `imagePack` does (no resampling in the test).
Source: PNGs with known R = x*16+1, G = y*16+3, B = (x+y)*8+5 (16x16), plus a 256-value ramp per alpha.

| Case | Result |
|---|---|
| Opaque (alpha 255) | Exact. `imagePack` error 0 for R, G, B and luma |
| `sRGB` chunk, `cHRM` chunk | Unchanged |
| `gAMA` 1/2.2 | Unchanged |
| `gAMA` 1.0 | Altered, max error 73 |
| ICC profile (P3 primaries, gamma 2.2) | Altered, max error 106 |
| ICC profile (P3 primaries, gamma 1.0) | Altered, max error 86 |

Alpha < 255 (canvas premultiplies; 256 distinct input values per row):

| Alpha | Wrong values / 256 | Max error | Distinct output values |
|------:|-------------------:|----------:|-----------------------:|
|   255 |                  0 |         0 |                    256 |
|   254 |                  1 |         1 |                    255 |
|   200 |                 55 |         1 |                    201 |
|   128 |                127 |         1 |                    129 |
|    64 |                191 |         2 |                     65 |
|    16 |                239 |         8 |                     17 |
|     1 |                254 |       127 |                      2 |
|     0 |                255 |       255 |                      1 |

Notes:
- The alpha channel itself reads back correctly; the loss is in RGB.
- Chrome converts to sRGB while decoding when the PNG carries `gAMA` != sRGB-like or an ICC profile.
  `createImageBitmap(blob, { colorSpaceConversion: 'none' })` kept all three altered cases exact
  (0 mismatched pixels), but does not avoid alpha premultiplication.
- The ICC profiles were hand-built for the test, not exported from an image editor.
- `imagePack` also resamples to <= 96 px by nearest neighbour, so larger images lose data regardless.

## 3. Own PNG decoder (`src/png.js`) exactness

`E.decodePng(arrayBuffer)` returns raw per-channel samples (no canvas, no colour management, no premultiplied
alpha). Interlaced files are rejected with a message. Checked in Node 22 and Chromium 141.

- `node tools/test_png.js`: 1498 checks, 0 failures. Every colour type x allowed bit depth (1-16) x filter
  (each of the 5 alone and mixed per row) x odd sizes; edge values (0, 1, max-1, max); alpha 0/1/half/254/255
  with arbitrary RGB underneath; split IDAT; ancillary chunks (`gAMA` 1.0, `sRGB`, `iCCP`, `tEXt`, `tRNS`);
  a 256x256 RGBA image (~16-20 ms); explicit errors (interlaced, bad signature, CRC, truncated, missing IEND,
  invalid colour type/depth, size mismatch). The test encoder is ours, so it was also checked by mutation:
  8 deliberate decoder bugs (Paeth tie-break, average filter, 16-bit high byte, sub-byte bit order, tRNS,
  left neighbour, only-first-IDAT, dropped LSB) each make it fail.
- Independent encoders (ground truth = the arrays that were encoded), 36 files, 0 mismatching samples, decoded
  also inside Chromium: Pillow 12 (L, 16-bit gray, LA, RGB, RGBA incl. `optimize` and `compress_level` 0/9,
  palette 1/2/4/8 bit, 1-bit; 37x23 and 256x256) and fast-png 8.0 (16-bit gray/GA/RGB/RGBA, 8-bit RGB/RGBA).
  The one-off scripts for this are not in the repo (they need Pillow and npm packages).
- The PNGs that canvas altered in section 2 (alpha 0, 128, ramp; `gAMA` 1.0; ICC P3 gamma 1.0 and 2.2) decode
  with 0 mismatches. A PNG written by Chromium's own encoder (RGBA 8-bit, alpha 255) decodes exactly.
- Not covered: files exported by Unity `EncodeToPNG` (none available yet), Adam7 interlacing (rejected by
  design), `tRNS` colour keys for gray/RGB images (ignored), 16-bit palette (does not exist in PNG).
- pngjs 7's 16-bit encoder produced unusable output in my usage, so pngjs was not used as ground truth.

## 4. Cold cost with carved stairs (bridge levels) and rigid footprint

`node tools/ui/measure.js 3`: median of 3 runs, Chromium 141 headless (software rasteriser, ±30 %), canvas
1200x800, Oblique 50 degrees, synthetic 256x256 map (12 zones), default parameters except terraces and
sub-terraces. "Cold" is the first render with an empty contour cache. Times in ms. Stairs are placed at gates (the
user's criterion, default threshold 0.05 and minimum size 3), with the rigid footprint on. "coverage" is
`E.stairSurvival`: share of each tread tile's area drawn as its own step by the A / B contours.

| terraces | sub-terraces | slice | levels (bridges) | stairs / sites | shape | Box cold | A cold | B cold | coverage A | coverage B |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 3 | whole map | 19 (4) | 376 / 376 | 42.5 | 425 | 232 | 2353 | 100.0% (0 lost) | 100.0% (0 lost) |
| 5 | 3 | zone 6 | 14 (2) | 29 / 29 | 11.7 | 157 | 21.3 | 558 | 100.0% (0 lost) | 100.0% (0 lost) |
| 5 | 6 | whole map | 34 (4) | 376 / 376 | 27.1 | 436 | 289 | 3989 | 100.0% (0 lost) | 100.0% (0 lost) |
| 5 | 6 | zone 6 | 26 (2) | 29 / 29 | 8.1 | 135 | 78.4 | 937 | 100.0% (0 lost) | 100.0% (0 lost) |
| 24 | 3 | whole map | 95 (23) | 1553 / 1599 | 47.3 | 627 | 883 | 11451 | 100.0% (0 lost) | 100.0% (0 lost) |
| 24 | 3 | zone 6 | 70 (12) | 166 / 167 | 12.9 | 167 | 203 | 2772 | 100.0% (0 lost) | 100.0% (0 lost) |
| 24 | 6 | whole map | 167 (23) | 1341 / 1602 | 41.5 | 677 | 1482 | 20274 | 100.0% (0 lost) | 100.0% (0 lost) |
| 24 | 6 | zone 6 | 127 (12) | 126 / 167 | 19.5 | 233 | 393 | 4593 | 100.0% (0 lost) | 100.0% (0 lost) |

Reading it:
- B is the expensive one: its cost grows with the number of levels (one signed distance field per level) and with
  the area. With the defaults (5 terraces x 3 sub-terraces) one zone costs ~0.6 s cold; the whole 256x256 map
  ~2.4 s. At 24 terraces x 6 sub-terraces it is 4.6 s for one zone and 20 s for the whole map (167 levels).
- The rigid footprint costs B extra: one more field (shared by all levels) and a blend per level, plus more
  contour vertices around the stairs. Before it, the same scenario (older stair placement, 297 stairs) took 1.8 s
  for the whole map at the defaults and 16 s at 24 x 6.
- Gates give more stairs than the old heuristic (376 vs 297 on the whole map at the defaults).
- With the footprint every stair is 100 % covered in A and B in every row (0 lost). Without it
  (`P.anchor = false`) B loses stairs and A degrades them: see `tools/test_stairs.js`.
- Shape time (gates and carving included) is below 0.05 s everywhere here (the whole-map quantization is cached).

## 5. Compare mode: cold time to the first panels and to all three

`node tools/ui/measure_compare.js 3`: median of 3 cold runs (a new shape each time, empty contour caches) from the slider release; Chromium 141
headless (software rasteriser, +-30 %), 1500x800 window, columns layout, synthetic 256x256 map, 3 sub-terraces. "First" = shape + Box + A painted
(B shows "computing…"); "all" = B painted and the info line complete.

| slice | terraces | first panels (ms) | all three (ms) | B alone (ms) |
|---|---:|---:|---:|---:|
| zone 6 | 5 | 171 | 599 | 428 |
| zone 6 | 12 | 216 | 1240 | 1024 |
| zone 6 | 24 | 336 | 2225 | 1888 |
| whole map | 5 | 781 | 2834 | 2053 |
| whole map | 12 | 1295 | 5998 | 4703 |
| whole map | 24 | 1688 | 10203 | 8515 |

Moving the camera afterwards only paints (the contours of every level are cached). B dominates: one distance field per level.
