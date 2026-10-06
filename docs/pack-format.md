# evodun-pack format

## 0.1 (still loadable)
`{ format, name, width, height, elevation[], masks{}, markers[] }`: row-major arrays, x east, y south.

## 0.2 (channels as fields)
A pack is a small JSON manifest plus PNG images that are selected together in the viewer. Images are decoded
by our own decoder (`src/png.js`): raw samples, no colour management, no alpha premultiplication, 8 or 16 bit,
non-interlaced only. 1 pixel = 1 tile, native resolution (no resampling). All images of a pack share one size.

```json
{
  "format": "evodun-pack/0.2",
  "name": "my map",
  "flipY": true,
  "maxnode": 12,
  "roles": {
    "elevation": { "image": "height.png", "channel": "V" },
    "zone":      { "image": "zones.png",  "channel": "H" },
    "edge":      { "image": "BakedEdgemap.png", "channel": "H" }
  },
  "markers": []
}
```

- **Channels** of any image: `R G B A H S V`. Planes are 0..1; H, S, V come from `Color.RGBToHSV` (Unity) and
  `V = max(R,G,B)`. Grey images give R=G=B; palette images are expanded to RGBA.
- **flipY**: Unity writes Y up; flips every image of the pack equally.
- **Roles** (one channel each):
  - `elevation` (numeric): elevation in height units = channel x 1000 (baked convention: grey = height / 1000).
    Terraces and micro steps are always derived from it.
  - `zone`, `edge` (categorical): ids, 0 = outside.
    - Channel `H`: V = 0 is outside. With `maxnode`, `id = round(H * (maxnode + 1))` (ids 1..maxnode). Without
      it the hues present are clustered (gap > 4 degrees) and each pixel goes to the nearest centre (ids 1..K in
      hue order; these ids are cluster indices, not necessarily your own ids).
    - Unreliable hues are never hidden: no hue (grey), hue uncertainty above the tolerance
      (`60 degrees / chroma counts`, tolerance = min(1/4 of the id spacing, 5 degrees)), far from every id/centre, or
      the reserved ids 0 and maxnode+1. They are counted in a warning and drawn magenta.
      With `maxnode` they keep the id of the formula (only the reserved ids 0 / maxnode+1 become -1, since red is
      not a zone). In deduced mode they get id -1.
    - Any other channel: every distinct non-zero value is an id.
    - `edge` labels from hue: red = `barrier`, cyan = `pass`.
  - `path`, `vegetation`, `poi` (graded): any channel as a 0..1 mask.
  - `area`, `room`: reserved categorical roles. Accepted in a manifest and ignored.
- A zone is a biome/country meant as one incursion. It is NOT a terrace and gives no level.
- **slice** (optional): `{ "zones": [6], "rect": [x0, y0, x1, y1], "margin": 24 }`. The slice is the tiles of the listed
  zones (default in the viewer: the lowest id) intersected with `rect` (x1, y1 exclusive). Only the slice bounding box
  plus `margin` tiles of scenery is built. Pixels with id -1 take the majority id of their 8 neighbours for this
  purpose (they never open holes) but stay marked in the zones overlay. Outside the slice: drawn under a one-band veil,
  no stairs, not walkable. A yellow line follows the slice border at the height of each cap (also on the map edge).
- Terraces are quantized with the raw global elevation range of the whole map (`elevRange`), so they do not change
  with the slice or the window, and they ignore zones completely (a zone border is not a terrace edge).
- `maxnode` and `elevation` scale are optional; images alone (no manifest) work through the role selectors.

## Porting to Unity
`Color.RGBToHSV` is the same function, so the hue ids match. Import the PNGs as data: sRGB off, no compression,
Read/Write on. `Texture2D.LoadImage` converts to 8 bit; the baked images are 8 bit, so that is fine for them.
