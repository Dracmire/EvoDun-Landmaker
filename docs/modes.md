# Modes

GENERATED from `src/modes.js` by `tools/gen_modes_doc.js` (run by `tools/build.py`); do not edit by hand. `tools/test_modes.js` checks that this file is in sync. Design: `docs/ui-modes.md`.

One mode per crystallizer. Entering a mode applies its first example, its camera and its technique; a control that does not belong to the mode is hidden (not greyed); the requirements of `docs/controls.md` still apply inside a mode (greyed + "Requires: ...").
ADVANCED controls are folded behind a toggle of their group. The test-only flag `window.EVO_NO_MODES` shows the whole panel (no modes).

## 1 Terrain

Terraces, ramps and the techniques Box, A, B and C on any heightmap: the same data expressed in several ways.

| field | value |
|---|---|
| id | `terrain` |
| examples (first = default) | Snake Mountain surface (`snake_surface`); Real map 256 (`real_map`); Shrine-Pier (`shrine_pier`); Shrine-Pier x4 (`shrine_pier_x4`); Snake Mountain (caves subtracted) (`snake`); Value noise (`noise`); Your images (PNG + roles) |
| camera (default) | `oblique` |
| cameras offered | `isoE`, `isoW`, `oblique`, `low`, `top`, `stage`, `classic` |
| technique (default) | `A` |
| techniques offered | `box`, `A`, `B` |
| compare | yes (on at entry) |
| main controls | `terraces`, `subs`, `terH`, `spread`, `stairW`, `stairStyle`, `rampDepth`, `smooth`, `radius` |
| advanced controls (folded) | `subH`, `minPlateau`, `minSub`, `pre`, `climb`, `gateThr`, `gateMin`, `passGap`, `tread` |
| slice controls | `zoneChips`, `crop`, `margin` |
| terrain controls | main (above) |
| fixed by the mode (hidden) | - |
| shared passes | `outlines`, `gradient`, `rampLines`, `dress` |
| overlays | `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border` |
| incursion | yes |
| diagnostics (folded) | `regions`, `passes`, `edgeWarn` |

## 2 Room types (DAC)

Room types (Diorama, Ascension, Cake) on a map with rooms: Cake rings, Ascension walls and the Pocket of a Diorama. Rooms are always on in this mode.

| field | value |
|---|---|
| id | `rooms` |
| examples (first = default) | Real map · Balanced (3 types, connected) (`real_map`); Real map · Default (`real_map`); Real map · Chain (5 terraces) (`real_map`); Cake · bowl (room 60) (`real_map`); Cake · bowl + pyramid (room 85) (`real_map`); Ascension · walls (room 88) (`real_map`); Pocket · Diorama 31 (`real_map`); Your images (PNG + roles) |
| camera (default) | `isoE` |
| cameras offered | `isoE`, `isoW`, `oblique`, `low`, `top`, `stage`, `classic` |
| technique (default) | `A` |
| techniques offered | `box`, `A`, `B`, `C` |
| compare | no |
| main controls | `roomsPreset`, `dacAuto`, `t-cake`, `t-ascWalls`, `ascHeight`, `t-pocket`, `pocketFraming`, `pocketHeight`, `dacShow`, `dacView`, `gateMarks`, `anchors`, `anchorH`, `roomChips`, `typeTint` |
| advanced controls (folded) | `roomsMinCore`, `rRadius`, `roomsCross`, `roomsIsoLimit`, `cakeLayers`, `cakeStep`, `cakePer`, `cakeSeam`, `roomBorders`, `roomTint`, `nowalk`, `dioOutline` |
| slice controls | - |
| terrain controls | folded: `terraces`, `subs`, `terH`, `spread`, `stairW`, `stairStyle`, `rampDepth`, `smooth`, `radius` |
| fixed by the mode (hidden) | `t-rooms` |
| shared passes | `outlines`, `gradient`, `rampLines`, `dress` |
| overlays | `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border` |
| incursion | yes |
| diagnostics (folded) | `regions`, `passes`, `edgeWarn` |

## 3 Stage

The Stage: Cam 6 perspective, technique B and the Art contract (body, wrapper, footprint, props), as it stands.

Banner: **IN REDESIGN: frozen as it is; the Stage waits for its own design pass.**

| field | value |
|---|---|
| id | `stage` |
| examples (first = default) | Shrine-Pier x4 · Stage (`shrine_pier_x4`); Diorama 31 · Stage (`real_map`) |
| camera (default) | `stage` |
| cameras offered | `isoE`, `isoW`, `oblique`, `low`, `top`, `stage`, `classic` |
| technique (default) | `B` |
| techniques offered | `B` |
| compare | no |
| main controls | `contract` |
| advanced controls (folded) | - |
| slice controls | - |
| terrain controls | folded: `terraces`, `subs`, `terH`, `spread`, `stairW`, `stairStyle`, `rampDepth`, `smooth`, `radius` |
| fixed by the mode (hidden) | - |
| shared passes | `outlines`, `gradient`, `rampLines`, `dress` |
| overlays | `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border` |
| incursion | yes |
| diagnostics (folded) | `regions`, `passes`, `edgeWarn` |

## 4 Curves (C)

Tiles to curves (technique C, Unexplored 2 style): displaced Voronoi contours and the wall pass.

| field | value |
|---|---|
| id | `curves` |
| examples (first = default) | Snake Mountain surface (`snake_surface`); Real map · Default (`real_map`); Real map · Balanced types (`real_map`); Shrine-Pier x4 (`shrine_pier_x4`); Your images (PNG + roles) |
| camera (default) | `oblique` |
| cameras offered | `isoE`, `isoW`, `oblique`, `low`, `top`, `stage`, `classic` |
| technique (default) | `C` |
| techniques offered | `C` |
| compare | yes (off at entry) |
| main controls | `curvesPreset`, `wallPass`, `wallExtrude` |
| advanced controls (folded) | `wallStrata`, `wallColumn`, `t2Spacing`, `t2Rows`, `t2Group`, `t2Jitter` |
| slice controls | - |
| terrain controls | folded: `terraces`, `subs`, `terH`, `spread`, `stairW`, `stairStyle`, `rampDepth`, `smooth`, `radius` |
| fixed by the mode (hidden) | - |
| shared passes | `outlines`, `gradient`, `rampLines`, `dress` |
| overlays | `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border` |
| incursion | yes |
| diagnostics (folded) | `regions`, `passes`, `edgeWarn` |

## 5 Floors (Archived)

Floors: one landmark as stacked heightmaps (single floor, exploded stack, cutaway).

Banner: **CLOSED: the shapes are baked by a script (tools/derive_snake_floors.py); no control changes them.**

| field | value |
|---|---|
| id | `floors` |
| examples (first = default) | Snake Mountain floors (`snake_floors`) |
| camera (default) | `isoE` |
| cameras offered | `isoE`, `isoW`, `oblique`, `low`, `top`, `classic` |
| technique (default) | `A` |
| techniques offered | `box`, `A`, `B`, `C` |
| compare | no |
| main controls | `floorsView`, `t-backdrop`, `backdropGap`, `backdropHeight` |
| advanced controls (folded) | - |
| slice controls | - |
| terrain controls | none |
| fixed by the mode (hidden) | - |
| shared passes | `outlines`, `gradient`, `rampLines`, `dress` |
| overlays | `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border` |
| incursion | single floor only |
| diagnostics (folded) | `regions`, `passes`, `edgeWarn` |

## 6 Macroform

Macroform: Snake Mountain as one baked voxel volume (exterior, quadrant removed, interior only, horizontal cut).

Banner: **INCOMPLETE: one baked example that cannot be produced or tuned from the page; not yet a crystallizer.**

| field | value |
|---|---|
| id | `macroform` |
| examples (first = default) | Snake Mountain macroform (`snake_macroform`) |
| camera (default) | `isoE` |
| cameras offered | `isoE`, `isoW`, `oblique`, `low`, `top` |
| technique (default) | `box` |
| techniques offered | `box` |
| compare | no |
| main controls | `macroView` |
| advanced controls (folded) | - |
| slice controls | - |
| terrain controls | none |
| fixed by the mode (hidden) | - |
| shared passes | `outlines` |
| overlays | `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border` |
| incursion | hidden |
| diagnostics (folded) | `regions`, `passes`, `edgeWarn` |

## Common to every mode

- View bar: `cams`, `tech`, `mode`, `reset` (cameras and techniques filtered by the mode; Compare only where the mode has it).
- "Your images" example (modes with it): `file`, `flipy`, `roles`, `saveManifest`.
- Only without modes (`EVO_NO_MODES`): `scenario`, `stagePreset`, `src`.
