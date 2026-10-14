# evodun-pack format

## 0.1 (still loadable)
`{ format, name, width, height, elevation[], masks{}, markers[] }`: row-major arrays, x east, y south.

## 0.3 (0.2 + stake and objectives)
Same as 0.2 (0.2 is still read), with two optional members written by "Save pack.json":

```json
{ "format": "evodun-pack/0.3", "...": "as 0.2",
  "stake": { "x": 96, "y": 117 },
  "objectives": [ { "x": 117, "y": 158, "label": "tower" }, { "x": 40, "y": 20 } ] }
```
- `stake`: the entry point of the incursion; `objectives`: resistance points. Coordinates are tiles of the WHOLE map (not
  of the slice window), integers >= 0; `label` is optional. The viewer draws the shortest walkable route from each
  objective to the stake inside the slice; marks outside the slice are kept but not shown.

### Optional `viewer` block (same format 0.3)
So that a saved pack reproduces the same picture when it is loaded again. Written by "Save pack.json", read on load; a manifest WITHOUT the block loads with the defaults; a pack loaded without any manifest leaves the sliders as they are.
```json
"viewer": { "preset": "balanced", "rooms": true, "cake": true, "terraces": 3, "roomsMinCore": 100, "rRadius": 5, "minPlateau": 120 }
```
`preset` is "default", "balanced" (Balanced types: terraces 3, min core 100, room radius 5, min plateau 120) or "custom"; `rooms` / `cake` are the switches (Cake needs rooms); `terraces` 2-24 (default 5), `roomsMinCore` 5-250 (20), `rRadius` 3-30 (9), `minPlateau` 1-300 (5), integers. Any field may be missing (= its default).
`camera` (optional, 8th field) is one of the CAMERA BANK ids: `isoE` (Cam 1), `isoW` (Cam 2), `oblique` (Cam 3, the default), `low` (Cam 4), `top` (Cam 5), `stage` (Cam 6, perspective), `classic` (Cam 7, oblique projection); "Save pack.json" writes it only when it is not the default, so a pack saved before the bank is unchanged; any other value is rejected.

`curves` (optional, 9th field) is the preset of technique C (Tiles to Curves): "ordered" (the default), "balanced" or "natural"; "Save pack.json" writes it only when it is not the default, so a pack saved before technique C is unchanged. A pack may also declare `stageYaw` (see the Stage camera). The wall pass of C adds optional `wallPass` ("t3" default, "t2", "off") and the numbers `wallExtrude` (0.10-0.40, 0.25), `wallStrata` (2-4, 3), `wallColumn` (0.8-2, 1.2), `t2Spacing` (0.6-1.5, 0.9), `t2Rows` (5-10, 6), `t2Group` (0.6-2, 1.0), `t2Jitter` (0-0.6, 0.4); written only when they are not the default.

### Floors package (crystallizer 5, optional keys of a built-in pack; old packs are unaffected)
A pack may carry several stacked heightmaps of ONE landmark: `floors: [{ id, name, z, elevation[], markers? }]` (same `width` x `height` as the exterior; `elevation` 0 = void; floors are NOT zones), `shaft { c, r, top }`, `links [{ from, to, site { a, b }, width, depth, landing { x, y }, footprint { x, y }, foot, arrival }]` and `elevFrame [min, max]`, the package's GLOBAL height frame:
`quantize` uses it for the terrace bands even where a map has void (without it a map with void quantizes over its own land range), so every layer of the package has the same bands. `E.floorPack(pack, k)` gives the pack of one layer (k = 0 the exterior). A `viewer` block in a built-in pack is applied when the source is chosen (floors: `{ terraces: 5, minPlateau: 5 }`).
A DECLARED LINK (`links`, carried by the floor it starts from, `from`) is structure, not detected: `site` = two 4-neighbour tiles of the whole map (a = the low tile, b = the high one) where a forced site carves a ramp with the link's own `width` (1-5) and `depth` (1-4), even when stairW is 0; `landing` / `footprint` are inclusive tile rectangles `{ x: [x0, x1], y: [y0, y1] }`; the landing, the footprint and the ring foot tiles are excluded from the pre-smoothing and from the plateau cleanup. A pack without `links` takes the old code paths unchanged. `data/snake_mountain_floors.json`, `docs/crystallizers/05-floors/README.md`.

### Macroform package (crystallizer 6, optional keys of a built-in pack; old packs are unaffected)
A pack may carry ONE landmark as a VOLUME: several solid intervals per column instead of one height. `elevation` keeps the OUTER SURFACE (so every existing technique draws the exterior of the source exactly like the plain surface pack); the volume is extra keys:
```json
"volume": { "vScale": 2, "dz": 0.125, "nz": 79, "materials": ["air","rock","serpent","slab","ramp","ground"], "columns": [ [[z0, z1, mat], ...], ... ] },
"macro":  { "params": {...}, "floors": [{ "id": 1, "z": 1.69, "zTiles": 3.38, "tiles": [[x, y], ...] }], "ramp": { "width": 1.0, "path": [[x, y, z, t], ...], "tiles": [[x, y, z, t], ...] },
            "shaft": { "c": [20.5, 20.5], "r": 2.5 }, "head": { "x": 21, "y": 15 } }
```
- `columns` has `width x height` entries (row-major, index = y*width + x). Each lists the SOLID intervals of the column bottom up, `z0 < z1`, in ELEVATION units; `mat` indexes `materials` (0 = air is never stored). A column with several intervals has hollow space between them (a floor, a tube). `dz` is the voxel height in elevation units (a multiple of it is exact in binary for `vScale` 2); `nz` is the number of voxel layers the derivation used (air voxel count = nz x width x height - solid voxels).
- VERTICAL UNIT: `z_tiles = z x vScale`. The viewer's height unit is the elevation unit (the one terraces are quantized from); the volume view draws a voxel as a cube, one tile wide and `1 / vScale` elevation units high. Outside the shaft, the top of the highest interval of every column equals `elevation` (within one voxel).
- `macro.params` are the derivation constants (all PROVISIONAL: docs/crystallizers/06-macroform/README.md); `floors[].z` is the floor level in elevation units (`zTiles` in tiles) and `tiles` its walkable tiles (after the openings); `ramp.path` the smoothed serpent centreline sampled every 0.25 tile with the ramp surface `z` (elevation units) and the arc length `t`; `ramp.tiles` the tiles of the ramp lane with the surface under them; `head` the marker of the snake head (a landmark of its own, no geometry here).
- Nothing in the viewer reads these keys yet (PR B of the crystallizer). Built-in source id `snake_macroform` (`data/snake_mountain_macroform.json`, `tools/derive_snake_macroform.py`).

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
    Terraces and sub-terraces are always derived from it (micro steps are a different, reserved concept).
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
- VOID: an elevation of 0 (or less) is NOT terrain (the black of a height image): it is not drawn, not walkable, belongs to no level, and the
  terraces are quantized over the LAND only (`elevRange` = lowest..highest land tile; void tiles take the nearest land value for the smoothing and
  the slopes). A baked 8-bit height that rounds to 0 would be read as void: keep real terrain >= 1 (the lowest in the user's skeleton map is 17).
- Terraces are quantized with the raw global elevation range of the whole map (`elevRange`), so they do not change
  with the slice or the window, and they ignore zones completely (a zone border is not a terrace edge).
- `maxnode` and `elevation` scale are optional; images alone (no manifest) work through the role selectors.

## Porting to Unity
`Color.RGBToHSV` is the same function, so the hue ids match. Import the PNGs as data: sRGB off, no compression,
Read/Write on. `Texture2D.LoadImage` converts to 8 bit; the baked images are 8 bit, so that is fine for them.
