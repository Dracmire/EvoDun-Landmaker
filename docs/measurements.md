# Measurements

Both measurements were taken in headless Chromium 141-era (Playwright 1.56, `chromium-1194`) on `file://`,
software rasteriser (no GPU), on the state of the repo at PR #1. Treat timings as ±30 %.

## 1. Timing (ms)

Test data: 4-octave value noise (`fbm`, detail at tile scale), square maps, default `P`
(5 terraces x 3 micro steps, 15 levels), canvas 1200x800, all display toggles at their defaults,
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
