# Controls

GENERATED from `src/controls.js` by `tools/gen_controls_doc.js` (run by `tools/build.py`); do not edit by hand. `tools/test_controls.js` checks that this file is in sync.

A control whose requirement is not met is greyed out and cannot be used; its tooltip lists only what to activate. When the requirement is met the tooltip is the help text below.

Techniques: Box, A, B, C = the panels the control changes; a badge [A] / [B] / [C] in the panel marks the controls that change only one technique.

## Scenarios

| id | techniques | requires | help |
|---|---|---|---|
| scenario | all | - | One click sets existing parameters (source, preset, rooms, chips, camera, switches). Nothing else changes. |

## View bar

| id | techniques | requires | help |
|---|---|---|---|
| cams | all | - | (keeps its own tooltip: see the title in the viewer) |
| tech | all | - | Show this technique alone. Box: one column per tile (the exact reference) · A: per-level tile outline, Chaikin-smoothed (stepped border) · B: signed distance field, marching squares (smooth border) · C: one Voronoi seed per tile, displaced at the corners (Unexplored 2). |
| mode | all | - | Box, A, B and C side by side (2 x 2) with one shared camera. |
| reset | all | - | Back to the camera's default framing (angle variation, pan and zoom). |

## Source & slice

| id | techniques | requires | help |
|---|---|---|---|
| src | all | - | Data to crystallize: the built-in packs or the images you load. |
| file | all | - | Load PNG fields (1 pixel = 1 tile, native size) and / or a pack .json. |
| flipy | all | load PNG images | Flip Y for every loaded image (Unity writes Y up). |
| roles | all | load PNG images | Give each channel (R, G, B, A, H, S, V) a role: elevation, zone, edge, path, vegetation or POI. |
| saveManifest | all | load PNG images | Save pack.json: roles, slice, stake, objectives and the viewer settings. |
| zoneChips | all | load images with a zone role | Slice = the incursion area. Click = only this zone, Ctrl / Shift-click = add or remove. The rest of the map is scenery under the veil. |
| roomChips | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius | Slice by rooms (rooms on): click = only this room, Ctrl / Shift-click = add or remove. Choosing a Diorama room enables the Pocket view. |
| crop | all | - | Crop the slice in tiles (x1, y1 exclusive; blank = no limit). |
| margin | all | choose a slice: a zone chip, a room chip or a crop | Tiles of scenery drawn around the slice. |

## 1 Terrain

| id | techniques | requires | help |
|---|---|---|---|
| terraces | all | - | Number of big height levels, quantized over the land range of the whole map. Changes everything downstream. |
| subs | all | - | Sub-terraces per terrace: small height steps inside a terrace (also used by the climb limit). |
| terH | all | - | Height of one terrace jump on screen. Height is mostly decorative: levels disconnect, stairs connect. |
| spread | all | set Terraces to 3 or more | Jumps grow away from the central terrace, without a cap. 1 = uniform; 1.5 gives 1, 1.5, 2.5, 4... (only jumps at distance 2 or more from the centre change: the Stage preset needs 4 terraces or more). |
| subH | all | set Sub-terraces / terrace to 2 or more | Height of one sub-terrace step (limited so that the climb rule holds). |
| minPlateau | all | - | Plateaus smaller than this (tiles) are merged into their neighbours. |
| minSub | all | set Sub-terraces / terrace to 2 or more | Sub-terrace patches smaller than this (tiles) are merged. |
| pre | all | - | Smoothing passes of the elevation before it is quantized. |
| climb | all | - | Up to this many sub-terraces of difference can be walked without a stair (provisional rule, not the micro-step rule); it also limits the sub-terrace height. With Rooms on walking ignores it (the sub-terraces are only visual). |
| gateThr | all | - | Gate detection (the EDunProcGen rule): the slope difference needed across a terrace border. |
| gateMin | all | - | Gate groups smaller than this (tiles) are dropped. |
| passGap | all | set Stair / ramp width above 0 | Spacing between stairs along a long gate. |
| stairStyle | all | set Stair / ramp width above 0 | 0 = steps (treads with bridge levels), 1 = ramp (default). Declared floor links are always ramps. |
| rampDepth | all | set Stair / ramp width above 0 · set Style to 1 (ramp) | Ramp length into the terrace, in tiles. The slope is jump / depth. |
| tread | all | set Stair / ramp width above 0 · set Style to 0 (steps) | Rise of one tread, in sub-terraces (steps style only). |
| stairW | all | - | Stair / ramp width in tiles. 0 = no stairs (declared floor links are still built). |
| smooth | A | show technique A (click A · Contour or Compare) | Chaikin smoothing passes of the A contours. |
| radius | B | show technique B (click B · Distance or Compare) | Blur radius of B's distance field (rounder shapes). |

## 2 Room types

| id | techniques | requires | help |
|---|---|---|---|
| t-rooms | all | - | Rooms layer: watershed rooms, cores and a spanning tree; ramps only where the tree crosses. Small maps (10x10 to 48x48) find no rooms: use the real map or lower Room radius. |
| roomsPreset | all | turn on Rooms | Default (terraces 5, core 20, radius 9, min plateau 5) or Balanced types (terraces 3, core 100, radius 5, min plateau 120: evens out Cake / Diorama / Ascension). It also sets Terraces and Min plateau. |
| roomsMinCore | all | turn on Rooms | Smallest core (tiles) that counts as a room centre. |
| rRadius | all | turn on Rooms | Room size scale. Smaller values find rooms on small maps. |
| roomsCross | all | turn on Rooms | Path cost of crossing a terrace gate when rooms are joined. |
| roomsIsoLimit | all | turn on Rooms | Unconnected regions smaller than this (tiles) become decorative (not walkable). |
| t-cake | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Cake room | Cake rings: concentric height rings per terrace link of each Cake room (a bowl or a pyramid). Same geometry in Box, A, B and C. |
| cakeLayers | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Cake room · turn on Cake rings | Cake: number of rings. |
| cakeStep | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Cake room · turn on Cake rings | Cake: height of one ring (x terrace height). |
| cakePer | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Cake room · turn on Cake rings | Cake: tiles per ring. |
| cakeSeam | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Cake room · turn on Cake rings | Cake: seam window of a bowl, in tiles. |
| t-ascWalls | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Ascension room | Ascension walls: thin walls on the blocking faces of Ascension rooms; low on the faces that face the camera. |
| ascHeight | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Ascension room · turn on Ascension walls | Ascension wall height (absolute). |
| t-pocket | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Diorama room: the Balanced types preset on the real map | Pocket view: a chosen Diorama room (chip, or a click in the world) is drawn as its pocket: the same room with generated surroundings. |
| pocketFraming | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Diorama room: the Balanced types preset on the real map · turn on Pocket view | Pocket framing: Cerro (hill), Lago (lake), Cascada (falls), Isla (island), Caída (drop). Auto = by the room's shape. It changes nothing until a Diorama room is chosen. |
| pocketHeight | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Diorama room: the Balanced types preset on the real map · turn on Pocket view | Relief multiplier of the pocket's decoration only. It changes nothing until a Diorama room is chosen. |
| roomBorders | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius | Room borders: blocking faces (orange), open transitions and the ones on a tree path (green). |
| roomTint | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius | A tint per room. |
| typeTint | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius | A tint per room type: Cake orange, Diorama green, Ascension blue. |
| nowalk | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius | Not-walkable tone: isolated terrain and the margins of walls, cliffs and steep slopes. |
| dioOutline | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius · a map with at least one Diorama room: the Balanced types preset on the real map | Outline of the Diorama footprints. |

## 3 Stage

| id | techniques | requires | help |
|---|---|---|---|
| stagePreset | all | - | (keeps its own tooltip: see the title in the viewer) |
| contract | all | - | Art contract placeholders: a body tint per face, framing stones at drops, borders and the shore, the landmark footprint shade and props. Drawn in Box, A, B and C. Props only on packs with landmarks (Shrine-Pier, Shrine-Pier x4). |

## 4 Curves (C)

| id | techniques | requires | help |
|---|---|---|---|
| curvesPreset | C | show technique C (click C · Curves or Compare) | Displacement rules of C: Ordered, Balanced or Natural. |
| wallPass | C | show technique C (click C · Curves or Compare) | Blocks built in front of C's walls: T3 strata blocks (default), T2 Voronoi blocks, Off. Not the same as Wall dressing (all techniques). |
| wallExtrude | C | show technique C (click C · Curves or Compare) · set Wall pass to T3 or T2 | How far the wall blocks stick out (T3 and T2). |
| wallStrata | C | show technique C (click C · Curves or Compare) · set Wall pass to T3 | T3: strata per terrace. |
| wallColumn | C | show technique C (click C · Curves or Compare) · set Wall pass to T3 | T3: column spacing, in tiles. |
| t2Spacing | C | show technique C (click C · Curves or Compare) · set Wall pass to T2 | T2: lateral spacing of the blocks, in tiles. |
| t2Rows | C | show technique C (click C · Curves or Compare) · set Wall pass to T2 | T2: height passes. |
| t2Group | C | show technique C (click C · Curves or Compare) · set Wall pass to T2 | T2: group width, in tiles. |
| t2Jitter | C | show technique C (click C · Curves or Compare) · set Wall pass to T2 | T2: jitter. |

## 5 Floors

| id | techniques | requires | help |
|---|---|---|---|
| floorsView | all | load a pack with floors (Snake Mountain floors) | Single floor, exploded stack or cutaway of the landmark's floors (the stack and the cutaway need an orthographic camera). The floors are interior levels inside a shell; the cutaway is a schematic of stacked section maps. |

## Shared passes

| id | techniques | requires | help |
|---|---|---|---|
| outlines | all | - | Dark outlines on caps and walls. |
| gradient | all | - | Shading gradient on cliffs. |
| rampLines | all | set Stair / ramp width above 0 · set Style to 1 (ramp) | Cross lines on ramps: a steep ramp reads as a flight of steps. |
| dress | all | - | Wall dressing: strata, lip, foot and base rocks on cliffs of 0.5 terrace or more. The same pass in all techniques; not the same as Wall pass (C only). |

## Overlays

| id | techniques | requires | help |
|---|---|---|---|
| features | all | load a pack with water / waterfall / cave masks (Snake Mountain surface) | Water, waterfall and cave masks of the pack. |
| markers | all | load a pack with markers or landmarks (Snake Mountain, Shrine-Pier) | Landmark markers and labels. |
| zones | all | load images with a zone role | Zone ids in colour. |
| edges | all | load images with an edge role | Edge map: red barrier, cyan pass. |
| masks | all | load images with a path, vegetation or POI role | Graded masks: path, vegetation, POI. |
| veil | all | choose a slice: a zone chip, a room chip or a crop | Veil over the scenery outside the slice. |
| border | all | choose a slice: a zone chip, a room chip or a crop | Slice border, coloured from the edge map: red barrier, cyan pass, yellow unmarked, white map edge. |

## Incursion

| id | techniques | requires | help |
|---|---|---|---|
| incursion | all | set Floors view to Single floor | Place the stake, add or remove objectives; the route runs from each objective to the stake over the walkable tiles, ramps included. |

## Diagnostics

| id | techniques | requires | help |
|---|---|---|---|
| regions | all | - | Colour each walkable region: what is connected to what. |
| passes | all | a map with stairs (Stair / ramp width above 0 and a gate) | Stair marks. |
| edgeWarn | all | turn on Rooms · a map where rooms are found: load the real map or lower Room radius | Electric-blue outline of large regions that stay unconnected (edge problems); it only draws when the info line reports some. |

## Not in the table

- `layout` (#layout): Layout selector: always hidden (compare mode is a fixed 2 x 2 grid of four panels). A candidate for removal.
