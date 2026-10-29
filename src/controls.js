/* EvoDun crystal viewer - CONTROLS TABLE: the single source of truth for every control of the panel (id, group, techniques, requirements, help).
   - A requirement that is NOT met: the control is disabled (not interactable), greyed, and its tooltip lists ONLY what to activate ("Requires: turn on Rooms · ...").
     A control that holds a non-default value (a toggle that is ON...) keeps it, shows "inactive", and its effect returns with the requirement. Nothing is recomputed and no parameter changes.
   - A requirement that IS met: normal control, tooltip = the explanation (what it does, crystallizer, techniques). The explanation appears ONLY on active controls.
   - Requirements are evaluated from the live state (`ctx`, built by ui.js after every recompute / redraw): E.controls.refresh(ctx).
   - docs/controls.md is GENERATED from this table (tools/gen_controls_doc.js, run by tools/build.py); tools/test_controls.js checks that it is in sync.
   - LOCKS are a separate concept from requirements: an optional `lock` {on(ctx), text} on an entry. A locked control is disabled and mirrors the value something else set (the rule of "Framing by room type"); its tooltip says who set it;
     it gets NO `inactive` class and NO "inactive" tag, because its effect IS applied. An unmet requirement still wins over the lock.
   `dom` = CSS selector of the control element(s) that are disabled; the tooltip and the greyed look go on the label / row that holds them. `keep` = the control already has its own tooltip (cameras, Stage preset): not touched. */
(function (E) {
  const GROUPS = ['Scenarios', 'View bar', 'Source & slice', '1 Terrain', '2 Room types', '3 Stage', '4 Curves (C)', '5 Floors', '6 Macroform', 'Shared passes', 'Overlays', 'Incursion', 'Diagnostics'];
  const T = (c, t) => c.techs.includes(t);
  /* requirements: ok(ctx) and the human text of what to do. A "found" / "present" requirement is treated as met while its prerequisite switch is off (the first text already says what to do). */
  const R = {
    rooms: { ok: (c) => c.rooms, text: 'turn on Rooms' },
    roomsFound: { ok: (c) => !c.rooms || c.roomsFound, text: 'a map where rooms are found: load the real map or lower Room radius' },
    cakeRoom: { ok: (c) => !c.rooms || !c.roomsFound || c.cakeRooms > 0, text: 'a map with at least one Cake room' },
    ascRoom: { ok: (c) => !c.rooms || !c.roomsFound || c.ascRooms > 0, text: 'a map with at least one Ascension room' },
    dioRoom: { ok: (c) => !c.rooms || !c.roomsFound || c.dioRooms > 0, text: 'a map with at least one Diorama room: the Balanced types preset on the real map' },
    dacWhole: { ok: (c) => c.dacWhole, text: 'turn on Framing by room type and choose Whole map' },
    chainOn: { ok: (c) => c.chainOn, text: 'use the Chain view of mode 2 (DAC view: Chain, no room chosen, a stake and an objective with a route)' },
    anchorsOn: { ok: (c) => c.anchors, text: 'turn on Non-walkable as anchors' },
    cakeOn: { ok: (c) => c.cake, text: 'turn on Cake rings' },
    ascOn: { ok: (c) => c.ascWalls, text: 'turn on Ascension walls' },
    pocketOn: { ok: (c) => c.pocket, text: 'turn on Pocket view' },
    techA: { ok: (c) => T(c, 'A'), text: 'show technique A (click A · Contour or Compare)' },
    techB: { ok: (c) => T(c, 'B'), text: 'show technique B (click B · Distance or Compare)' },
    techC: { ok: (c) => T(c, 'C'), text: 'show technique C (click C · Curves or Compare)' },
    wallNotOff: { ok: (c) => c.wallPass !== 'off', text: 'set Wall pass to T3 or T2' },
    wallT3: { ok: (c) => c.wallPass === 't3', text: 'set Wall pass to T3' },
    wallT2: { ok: (c) => c.wallPass === 't2', text: 'set Wall pass to T2' },
    stairs: { ok: (c) => c.stairW > 0, text: 'set Stair / ramp width above 0' },
    ramp: { ok: (c) => c.stairStyle !== 0, text: 'set Style to 1 (ramp)' },
    steps: { ok: (c) => c.stairStyle === 0, text: 'set Style to 0 (steps)' },
    subs2: { ok: (c) => c.subs >= 2, text: 'set Sub-terraces / terrace to 2 or more' },
    terr3: { ok: (c) => c.terraces >= 3, text: 'set Terraces to 3 or more' },
    slice: { ok: (c) => c.slice, text: 'choose a slice: a zone chip, a room chip or a crop' },
    passes: { ok: (c) => c.passes > 0, text: 'a map with stairs (Stair / ramp width above 0 and a gate)' },
    packMasks: { ok: (c) => c.packMasks, text: 'load a pack with water / waterfall / cave masks (Snake Mountain surface)' },
    markers: { ok: (c) => c.markers, text: 'load a pack with markers or landmarks (Snake Mountain, Shrine-Pier)' },
    zoneRole: { ok: (c) => c.zoneRole, text: 'load images with a zone role' },
    edgeRole: { ok: (c) => c.edgeRole, text: 'load images with an edge role' },
    maskRole: { ok: (c) => c.maskRole, text: 'load images with a path, vegetation or POI role' },
    images: { ok: (c) => c.images, text: 'load PNG images' },
    floors: { ok: (c) => c.floors, text: 'load a pack with floors (Snake Mountain floors)' },
    singleFloor: { ok: (c) => !c.floors || c.floorsView === 'single', text: 'set Floors view to Single floor' },
    backdropOn: { ok: (c) => c.backdrop, text: 'turn on Floor backdrop' },
    cam1: { ok: (c) => c.preset === 'isoE', text: 'use Cam 1: the backdrop is composed for Cam 1 until its camera phase' },
    macroform: { ok: (c) => c.macro, text: 'load a pack with a volume (Snake Mountain macroform)' },
    heightmapView: { ok: (c) => !c.volOn, text: 'set Macroform view to Off' },
    cam15: { ok: (c) => c.camKind === 'ortho', text: 'use Cam 1-5 (an orthographic camera, not Cam 6 or Cam 7)' },
    ortho: { ok: (c) => c.camKind !== 'persp', text: 'use an orthographic camera (not Cam 6)' }
  };
  const CAKE = ['rooms', 'roomsFound', 'cakeRoom'], ASC = ['rooms', 'roomsFound', 'ascRoom'], POCKET = ['rooms', 'roomsFound', 'dioRoom'], RM = ['rooms', 'roomsFound'];
  const ALL = ['box', 'A', 'B', 'C'];
  const DAC_LOCK = { on: (c) => !!c.dacAuto, text: "Set by 'Framing by room type' (turn it off to choose by hand)", doc: "Framing by room type is on" };
  const e = (id, dom, group, tech, req, help, extra) => Object.assign({ id, dom, group, tech, req, help }, extra);
  const TABLE = [
    // ---- Scenarios (buttons that only SET existing parameters)
    e('scenario', '#scenarios button', 'Scenarios', ALL, [], 'One click sets existing parameters (source, preset, rooms, chips, camera, switches). Nothing else changes.'),
    // ---- View bar
    e('cams', '#presets button', 'View bar', ALL, [], null, { keep: true }),
    e('tech', '#techs button', 'View bar', ALL, [], 'Show this technique alone. Box: one column per tile (the exact reference) · A: per-level tile outline, Chaikin-smoothed (stepped border) · B: signed distance field, marching squares (smooth border) · C: one Voronoi seed per tile, displaced at the corners (Unexplored 2).'),
    e('mode', '#mode', 'View bar', ALL, [], 'Box, A, B and C side by side (2 x 2) with one shared camera.'),
    e('reset', '#reset', 'View bar', ALL, [], 'Back to the camera\'s default framing (angle variation, pan and zoom).'),
    // ---- Source & slice
    e('src', '#src', 'Source & slice', ALL, [], 'Data to crystallize: the built-in packs or the images you load.'),
    e('file', '#file', 'Source & slice', ALL, [], 'Load PNG fields (1 pixel = 1 tile, native size) and / or a pack .json.'),
    e('flipy', '#flipy', 'Source & slice', ALL, ['images'], 'Flip Y for every loaded image (Unity writes Y up).'),
    e('roles', '#roles .role select', 'Source & slice', ALL, ['images'], 'Give each channel (R, G, B, A, H, S, V) a role: elevation, zone, edge, path, vegetation or POI.'),
    e('saveManifest', '#saveManifest', 'Source & slice', ALL, ['images'], 'Save pack.json: roles, slice, stake, objectives and the viewer settings.'),
    e('zoneChips', '#zoneChips button, #wholeMap', 'Source & slice', ALL, ['zoneRole'], 'Slice = the incursion area. Click = only this zone, Ctrl / Shift-click = add or remove. The rest of the map is scenery under the veil.'),
    e('roomChips', '#roomChips button, #wholeRooms', 'Source & slice', ALL, RM, 'Slice by rooms (rooms on): click = only this room, Ctrl / Shift-click = add or remove. Choosing a Diorama room enables the Pocket view.'),
    e('crop', '#cx0, #cy0, #cx1, #cy1', 'Source & slice', ALL, [], 'Crop the slice in tiles (x1, y1 exclusive; blank = no limit).'),
    e('margin', '#s-margin', 'Source & slice', ALL, ['slice'], 'Tiles of scenery drawn around the slice.'),
    // ---- 1 Terrain
    e('terraces', '#s-terraces', '1 Terrain', ALL, [], 'Number of big height levels, quantized over the land range of the whole map. Changes everything downstream.'),
    e('subs', '#s-subs', '1 Terrain', ALL, [], 'Sub-terraces per terrace: small height steps inside a terrace (also used by the climb limit).'),
    e('terH', '#s-terH', '1 Terrain', ALL, [], 'Height of one terrace jump on screen. Height is mostly decorative: levels disconnect, stairs connect.'),
    e('spread', '#s-spread', '1 Terrain', ALL, ['terr3'], 'Jumps grow away from the central terrace, without a cap. 1 = uniform; 1.5 gives 1, 1.5, 2.5, 4... (only jumps at distance 2 or more from the centre change: the Stage preset needs 4 terraces or more).'),
    e('subH', '#s-subH', '1 Terrain', ALL, ['subs2'], 'Height of one sub-terrace step (limited so that the climb rule holds).'),
    e('minPlateau', '#s-minPlateau', '1 Terrain', ALL, [], 'Plateaus smaller than this (tiles) are merged into their neighbours.'),
    e('minSub', '#s-minSub', '1 Terrain', ALL, ['subs2'], 'Sub-terrace patches smaller than this (tiles) are merged.'),
    e('pre', '#s-pre', '1 Terrain', ALL, [], 'Smoothing passes of the elevation before it is quantized.'),
    e('climb', '#s-climb', '1 Terrain', ALL, [], 'Up to this many sub-terraces of difference can be walked without a stair (provisional rule, not the micro-step rule); it also limits the sub-terrace height. With Rooms on walking ignores it (the sub-terraces are only visual).'),
    e('gateThr', '#s-gateThr', '1 Terrain', ALL, [], 'Gate detection (the EDunProcGen rule): the slope difference needed across a terrace border.'),
    e('gateMin', '#s-gateMin', '1 Terrain', ALL, [], 'Gate groups smaller than this (tiles) are dropped.'),
    e('passGap', '#s-passGap', '1 Terrain', ALL, ['stairs'], 'Spacing between stairs along a long gate.'),
    e('stairStyle', '#s-stairStyle', '1 Terrain', ALL, ['stairs'], '0 = steps (treads with bridge levels), 1 = ramp (default). Declared floor links are always ramps.'),
    e('rampDepth', '#s-rampDepth', '1 Terrain', ALL, ['stairs', 'ramp'], 'Ramp length into the terrace, in tiles. The slope is jump / depth.'),
    e('tread', '#s-tread', '1 Terrain', ALL, ['stairs', 'steps'], 'Rise of one tread, in sub-terraces (steps style only).'),
    e('stairW', '#s-stairW', '1 Terrain', ALL, [], 'Stair / ramp width in tiles. 0 = no stairs (declared floor links are still built).'),
    e('smooth', '#s-smooth', '1 Terrain', ['A'], ['techA'], 'Chaikin smoothing passes of the A contours.', { badge: 'A' }),
    e('radius', '#s-radius', '1 Terrain', ['B'], ['techB'], 'Blur radius of B\'s distance field (rounder shapes).', { badge: 'B' }),
    // ---- 2 Room types
    e('t-rooms', '#t-rooms', '2 Room types', ALL, [], 'Rooms layer: watershed rooms, cores and a spanning tree; ramps only where the tree crosses. Small maps (10x10 to 48x48) find no rooms: use the real map or lower Room radius.'),
    e('roomsPreset', '#roomsPreset', '2 Room types', ALL, ['rooms'], 'Default (terraces 5, core 20, radius 9, min plateau 5) or Balanced types (terraces 3, core 100, radius 5, min plateau 120: evens out Cake / Diorama / Ascension). It also sets Terraces and Min plateau.'),
    e('roomsMinCore', '#s-roomsMinCore', '2 Room types', ALL, ['rooms'], 'Smallest core (tiles) that counts as a room centre.'),
    e('rRadius', '#s-rRadius', '2 Room types', ALL, ['rooms'], 'Room size scale. Smaller values find rooms on small maps.'),
    e('roomsCross', '#s-roomsCross', '2 Room types', ALL, ['rooms'], 'Path cost of crossing a terrace gate when rooms are joined.'),
    e('roomsIsoLimit', '#s-roomsIsoLimit', '2 Room types', ALL, ['rooms'], 'Unconnected regions smaller than this (tiles) become decorative (not walkable).'),
    e('dacAuto', '#dacAuto', '2 Room types', ALL, ['rooms'], 'Framing by room type: one framing per room type, never mixed. With one room chosen only the framing of its type is on (Cake rings, Ascension walls or the Pocket of a Diorama); with several, the union; with Whole map, all three, each acting only on the rooms of its own type. The three switches follow the rule while this is on; turn it off to choose by hand.'),
    e('t-cake', '#t-cake', '2 Room types', ALL, CAKE, 'Cake rings: concentric height rings per terrace link of each Cake room (a bowl or a pyramid). Same geometry in Box, A, B and C.', { lock: DAC_LOCK }),
    e('cakeLayers', '#s-cakeLayers', '2 Room types', ALL, [...CAKE, 'cakeOn'], 'Cake: number of rings.'),
    e('cakeStep', '#s-cakeStep', '2 Room types', ALL, [...CAKE, 'cakeOn'], 'Cake: height of one ring (x terrace height).'),
    e('cakePer', '#s-cakePer', '2 Room types', ALL, [...CAKE, 'cakeOn'], 'Cake: tiles per ring.'),
    e('cakeSeam', '#s-cakeSeam', '2 Room types', ALL, [...CAKE, 'cakeOn'], 'Cake: seam window of a bowl, in tiles.'),
    e('t-ascWalls', '#t-ascWalls', '2 Room types', ALL, ASC, 'Ascension walls: thin walls on the blocking faces of Ascension rooms; low on the faces that face the camera.', { lock: DAC_LOCK }),
    e('ascHeight', '#s-ascHeight', '2 Room types', ALL, [...ASC, 'ascOn'], 'Ascension wall height (absolute).'),
    e('ascCut', '#s-ascCut', '2 Room types', ALL, [...ASC, 'ascOn'], 'Wall cut height: the height of the LOW walls on the faces that face the camera (the Zelda cut). 0.15 = the usual cut; the full wall height = no cut. Visual only.'),
    e('ascGate', '#s-ascGate', '2 Room types', ALL, [...ASC, 'ascOn'], 'Gate width, tiles: 0 = every room transition of an Ascension room stays open. 1-5 = only a gate of that width stays open around each crossing (used transitions, the drawn routes, the chain gates); the rest of the border becomes wall, so the room reads as an enclosure. Visual only: walking, routes and the tree do not change.'),
    e('t-pocket', '#t-pocket', '2 Room types', ALL, POCKET, 'Pocket view: a chosen Diorama room (chip, or a click in the world) is drawn as its pocket: the same room with generated surroundings.', { lock: DAC_LOCK }),
    e('pocketFraming', '#pocketFraming', '2 Room types', ALL, [...POCKET, 'pocketOn'], 'Pocket framing: Cerro (hill), Lago (lake), Cascada (falls), Isla (island), Caída (drop). Auto = by the room\'s shape. It changes nothing until a Diorama room is chosen.'),
    e('pocketHeight', '#s-pocketHeight', '2 Room types', ALL, [...POCKET, 'pocketOn'], 'Relief multiplier of the pocket\'s decoration only. It changes nothing until a Diorama room is chosen.'),
    e('dacShow', '#dacShow', '2 Room types', ALL, ['rooms', 'dacWhole'], 'Show framing on the whole map: All three framings (type tint and Diorama outline on), or only Cake rings, Ascension walls or the Diorama rooms. Choosing one type isolates the view fully: the type tint, the room borders and the footprint outline go off (Diorama turns its outline on, because a Pocket is drawn only for a chosen room); you can switch any of them back on by hand. With rooms chosen the room types decide.'),
    e('dacView', '#dacView', '2 Room types', ALL, ['rooms'], 'DAC view: Chain = the rooms the route(s) from the stake to the objective(s) cross; every land tile outside them is flattened to the lowest ground in a neutral grey (visual only: walking, the route and the room types do not change). Whole map = the whole map as before. Chain needs a stake and an objective with a route, and no room chosen.'),
    e('gateMarks', '#t-gateMarks', '2 Room types', ALL, [...RM, 'chainOn'], 'Gate markers (chain view): the open borders between consecutive rooms of the chain as a bright line, and the low camera-side Ascension wall stubs (the Zelda cut) darker than the full walls, so a gate and a cut wall cannot be confused.'),
    e('chainExtra', '#s-chainExtra', '2 Room types', ALL, [...RM, 'chainOn'], 'Chain: extra rooms per leg (N). Each leg (stake -> objective 1 -> ...) may be up to N rooms longer than its shortest path; the longest simple room path without a blocked edge or a repeated room is taken.'),
    e('roomRule', '#roomRule', '2 Room types', ALL, [...RM, 'chainOn'], 'Room type rule in the chain view: V16.4 (the usual classification) or Along the route (by role: entry terrace != exit terrace = Cake, Up if it climbs; >= 2 terraces and no used internal terrace edge = Diorama; the rest Ascension). A second Diorama in a row becomes Ascension in both.'),
    e('dioChain', '#dioChain', '2 Room types', ALL, [...RM, 'chainOn'], 'Diorama in chain view: Off, or Corridor (DAC: the doors the chain uses decide the structure, one bridge per door; the type follows the ascent of the footprint and the rank; see docs/crystallizers/02-room-types/README.md D32), or M2 (the Diorama footprint moves into the free grey space, a pocket grows around it, the route keeps passing on a transit landing at the old place and a bridge leads to the footprint) / M1 (the footprint moves to the centre of its own old place plus the nearest free tiles). Only the Dioramas of the chain; one that fails the 50 % free-perimeter rule, the shift cap or the bridge test is drawn as Ascension. The Pocket view is a different thing.'),
    e('dioProto', '#dioProto', '2 Room types', ALL, RM, 'Diorama prototype: one click loads the host scene of one of the eight prototypes of the corridor Diorama (Cima leaf / corridor, Arena leaf / corridor, Isla leaf / corridor, Quebrada, Mirador), places the stake and the objectives, sets Cam 1 at terH 1, switches the Diorama option to Corridor (DAC) and frames the host room. Where the type is not the natural one of the host, it is forced (Isla has no natural host in the four fixed scenes). Off clears the forced type.'),
    e('cakeCut', '#cakeCut', '2 Room types', ALL, [...CAKE, 'cakeOn'], 'Cake camera cut: Off, or remove the Quadrant / Half of each ring toward the camera so the platform is seen (Down: the tile drops to the core floor; Up: no ring). Rings stay per link.'),
    e('anchors', '#t-anchors', '2 Room types', ALL, RM, 'Non-walkable as anchors: the tiles that are not walkable in the rooms layer (isolated terrain, wall / cliff / Steep margins) are drawn grey and RAISED by the anchor height, as a reminder of the structural anchors, instead of the flat not-walkable tone. Visual only: walking does not change. In the Chain view it applies to the chain rooms.'),
    e('anchorH', '#s-anchorH', '2 Room types', ALL, [...RM, 'anchorsOn'], 'Anchor height, in terraces (x terrace height).'),
    e('roomBorders', '#t-roomBorders', '2 Room types', ALL, RM, 'Room borders: blocking faces (orange), open transitions and the ones on a tree path (green).'),
    e('roomTint', '#t-roomTint', '2 Room types', ALL, RM, 'A tint per room.'),
    e('typeTint', '#t-typeTint', '2 Room types', ALL, RM, 'A tint per room type: Cake orange, Diorama green, Ascension blue.'),
    e('nowalk', '#t-nowalk', '2 Room types', ALL, RM, 'Not-walkable tone: isolated terrain and the margins of walls, cliffs and steep slopes.'),
    e('dioOutline', '#t-dioOutline', '2 Room types', ALL, [...RM, 'dioRoom'], 'Outline of the Diorama footprints.'),
    // ---- 3 Stage
    e('stagePreset', '#stagePreset', '3 Stage', ALL, [], null, { keep: true }),
    e('contract', '#t-contract', '3 Stage', ALL, [], 'Art contract placeholders: a body tint per face, framing stones at drops, borders and the shore, the landmark footprint shade and props. Drawn in Box, A, B and C. Props only on packs with landmarks (Shrine-Pier, Shrine-Pier x4).'),
    // ---- 4 Curves (C)
    e('curvesPreset', '#curvesPreset', '4 Curves (C)', ['C'], ['techC'], 'Displacement rules of C: Ordered, Balanced or Natural.', { badge: 'C' }),
    e('wallPass', '#wallPass', '4 Curves (C)', ['C'], ['techC'], 'Blocks built in front of C\'s walls: T3 strata blocks (default), T2 Voronoi blocks, Off. Not the same as Wall dressing (all techniques).', { badge: 'C' }),
    e('wallExtrude', '#s-wallExtrude', '4 Curves (C)', ['C'], ['techC', 'wallNotOff'], 'How far the wall blocks stick out (T3 and T2).', { badge: 'C' }),
    e('wallStrata', '#s-wallStrata', '4 Curves (C)', ['C'], ['techC', 'wallT3'], 'T3: strata per terrace.', { badge: 'C' }),
    e('wallColumn', '#s-wallColumn', '4 Curves (C)', ['C'], ['techC', 'wallT3'], 'T3: column spacing, in tiles.', { badge: 'C' }),
    e('t2Spacing', '#s-t2Spacing', '4 Curves (C)', ['C'], ['techC', 'wallT2'], 'T2: lateral spacing of the blocks, in tiles.', { badge: 'C' }),
    e('t2Rows', '#s-t2Rows', '4 Curves (C)', ['C'], ['techC', 'wallT2'], 'T2: height passes.', { badge: 'C' }),
    e('t2Group', '#s-t2Group', '4 Curves (C)', ['C'], ['techC', 'wallT2'], 'T2: group width, in tiles.', { badge: 'C' }),
    e('t2Jitter', '#s-t2Jitter', '4 Curves (C)', ['C'], ['techC', 'wallT2'], 'T2: jitter.', { badge: 'C' }),
    // ---- 5 Floors
    e('floorsView', '#floorsView', '5 Floors', ALL, ['floors'], 'Single floor, exploded stack or cutaway of the landmark\'s floors (the stack and the cutaway need an orthographic camera). The floors are interior levels inside a shell; the cutaway is a schematic of stacked section maps.', { options: { stack: ['ortho'], cut: ['ortho'] } }),
    e('t-backdrop', '#t-backdrop', '5 Floors', ALL, ['floors', 'singleFloor', 'cam1'], 'Floor backdrop (Option 2): a wall attached to the chosen floor (no gap by default) with a stepped profile that rises behind it, so the floor reads as inside a shell. Heights are the real exterior heights over the floor, placed by a mirror across the back edge; the height multiplier is stylization (on floor 2 the whole profile is). Decoration only: not walkable. The floor itself does not change. Cam 1 only (composed for the Cam 1 axis); the Exterior layer has none.'),
    e('backdropGap', '#s-backdropGap', '5 Floors', ALL, ['floors', 'singleFloor', 'cam1', 'backdropOn'], 'Backdrop gap, 0-8 ground tiles (default 0): 0 = the wall rises from the floor edge; above 0 an apron at the height of the floor edge (not walkable) is inserted between the floor and the foot of the wall.'),
    e('backdropHeight', '#s-backdropHeight', '5 Floors', ALL, ['floors', 'singleFloor', 'cam1', 'backdropOn'], 'Backdrop height, 1-4: multiplies the whole rise of the wall above the floor edge (never the floor). The wall is a stepped profile (stylization: first riser one character = 2 tiles, then one terrace, 3 treads, tapering) with the real exterior height over the floor, mirrored across the back edge, as a lower bound.'),
    // ---- 6 Macroform
    e('macroView', '#macroView', '6 Macroform', ALL, ['macroform'], 'Macroform view of the volume (crystallizer 6): Off = the heightmap exterior of the same source (quantized terraces); Exterior, Quadrant removed (the quadrant facing the camera), Interior only (floors, ramp, shaft) and a Horizontal cut at floor 1 / 2 / 3 are drawn from the column intervals, one block per voxel run, Box-style. One view (no compare grid). Cam 1-5 only (Cam 6 and Cam 7 show the heightmap). The volume uses 1 tile of height = 1 tile of width, the heightmap uses terraces, so their vertical scales differ.', { options: { exterior: ['cam15'], quad: ['cam15'], interior: ['cam15'], cut: ['cam15'] } }),
    // ---- Shared passes
    e('outlines', '#t-outlines', 'Shared passes', ALL, [], 'Dark outlines on caps and walls.'),
    e('gradient', '#t-gradient', 'Shared passes', ALL, [], 'Shading gradient on cliffs.'),
    e('rampLines', '#t-rampLines', 'Shared passes', ALL, ['stairs', 'ramp'], 'Cross lines on ramps: a steep ramp reads as a flight of steps.'),
    e('sliced', '#t-sliced', 'Shared passes', ALL, [], 'Time-sliced frame: the exact frame (the same picture, byte for byte) is drawn in the background a few milliseconds at a time, so the page never blocks; while it is pending you see the last picture moved by the camera, with the route and markers live, and a calculating message; any move cancels it and a new one starts about 0.1 s after the last input. One panel, orthographic and oblique cameras only, no art contract (Compare, Floors, Macroform, Cam 6 and the first draw of B / C keep the normal frame). On by default (the picture is the same with it on or off).'),
    e('dress', '#t-dress', 'Shared passes', ALL, [], 'Wall dressing: strata, lip, foot and base rocks on cliffs of 0.5 terrace or more. The same pass in all techniques; not the same as Wall pass (C only).'),
    // ---- Overlays
    e('features', '#t-features', 'Overlays', ALL, ['packMasks'], 'Water, waterfall and cave masks of the pack.'),
    e('markers', '#t-markers', 'Overlays', ALL, ['markers'], 'Landmark markers and labels.'),
    e('zones', '#t-zones', 'Overlays', ALL, ['zoneRole'], 'Zone ids in colour.'),
    e('edges', '#t-edges', 'Overlays', ALL, ['edgeRole'], 'Edge map: red barrier, cyan pass.'),
    e('masks', '#t-masks', 'Overlays', ALL, ['maskRole'], 'Graded masks: path, vegetation, POI.'),
    e('veil', '#t-veil', 'Overlays', ALL, ['slice'], 'Veil over the scenery outside the slice.'),
    e('border', '#t-border', 'Overlays', ALL, ['slice'], 'Slice border, coloured from the edge map: red barrier, cyan pass, yellow unmarked, white map edge.'),
    // ---- Incursion
    e('incursion', '#m-stake, #m-obj, #m-rm, #m-clear', 'Incursion', ALL, ['singleFloor', 'heightmapView'], 'Place the stake, add or remove objectives; the route runs from each objective to the stake over the walkable tiles, ramps included.'),
    // ---- Diagnostics (folded)
    e('regions', '#t-regions', 'Diagnostics', ALL, [], 'Colour each walkable region: what is connected to what.'),
    e('passes', '#t-passes', 'Diagnostics', ALL, ['passes'], 'Stair marks.'),
    e('edgeWarn', '#t-edgeWarn', 'Diagnostics', ALL, RM, 'Electric-blue outline of large regions that stay unconnected (edge problems); it only draws when the info line reports some.')
  ];
  const RETIRED = []; /* controls that exist in the DOM but are not in the table: none (the Layout selector was removed in the UI pass, PR 2); the list stays for the tests that read it */

  const unmet = (en, ctx) => en.req.map((k) => R[k]).filter((r) => !r.ok(ctx)).map((r) => r.text);
  const requiresText = (list) => 'Requires: ' + list.join(' · ');
  const tipOf = (en, ctx) => { const u = unmet(en, ctx); return u.length ? { ok: false, text: requiresText(u) } : { ok: true, text: en.help }; };

  /* ---- DOM ---- */
  const holder = (el) => el.closest('label.sl, label.tg') || el.closest('.row') || el;
  function refresh(root, ctx) {
    for (const en of TABLE) {
      const els = [...root.querySelectorAll(en.dom)]; if (!els.length) continue;
      const tip0 = tipOf(en, ctx), locked = tip0.ok && !!en.lock && en.lock.on(ctx), tip = locked ? { ok: true, text: en.lock.text } : tip0, seen = new Set();
      for (const el of els) {
        const h = en.dom.includes(',') || els.length > 1 ? el : holder(el); // a group of buttons: each one; a single labelled control: its label
        if (el.dataset.def === undefined) el.dataset.def = el.type === 'checkbox' ? (el.checked ? '1' : '0') : String(el.value);
        el.disabled = !tip.ok || locked; el.setAttribute('aria-disabled', tip.ok && !locked ? 'false' : 'true');
        if (!seen.has(h)) {
          seen.add(h); h.classList.toggle('inactive', !tip.ok);
          if (!en.keep) { if (h.title !== tip.text) h.title = tip.text; if (h !== el && el.title) el.removeAttribute('title'); }
          const non = el.type === 'checkbox' ? el.checked : el.dataset.def !== String(el.value);
          const host = h.querySelector(':scope > span') || h; let tag = host.querySelector(':scope > .inact'); /* the tag goes inside the label text so a grid label keeps its two columns */
          if (!tip.ok && non && h !== el) { if (!tag) { tag = document.createElement('em'); tag.className = 'inact'; tag.textContent = 'inactive'; host.appendChild(tag); } } else if (tag) tag.remove();
        }
      }
      if (en.options) for (const o of root.querySelectorAll(en.dom + ' option')) { const rq = en.options[o.value]; const u = rq ? rq.map((k) => R[k]).filter((r) => !r.ok(ctx)).map((r) => r.text) : []; o.disabled = u.length > 0; o.title = u.length ? requiresText(u) : ''; }
    }
  }
  /* the badge [A] / [B] / [C] of the controls that change only one technique */
  function badges(root) {
    for (const en of TABLE) if (en.badge) { const el = root.querySelector(en.dom); if (!el) continue; const h = holder(el), host = h.querySelector(':scope > span') || h; if (host.querySelector(':scope > .bdg')) continue; const b = document.createElement('b'); b.className = 'bdg'; b.textContent = en.badge; host.insertBefore(b, host.firstChild); }
  }
  /* group the controls of the sliders and the toggles by crystallizer (the DOM ids do not change: only the order and the section headers) */
  function layout(root) {
    const aside = root.querySelector('aside'), sliders = root.querySelector('#sliders'), toggles = root.querySelector('#toggles'), mk = (name, parent, fold) => {
      const s = document.createElement(fold ? 'details' : 'section'); s.className = 'grp'; s.dataset.group = name;
      const h = fold ? document.createElement('summary') : document.createElement('h3'); h.textContent = name; s.appendChild(h); parent.appendChild(s); return s;
    };
    const box = {};
    const put = (g, node) => {
      if (g === 'Source & slice') { root.querySelector('#slice').insertBefore(node, root.querySelector('#sliceInfo')); return; } /* the scenery margin belongs to the slice block (no header of its own) */
      if (!box[g]) box[g] = mk(g, ['1 Terrain', '2 Room types', '3 Stage', '4 Curves (C)'].includes(g) ? sliders : g === 'Source & slice' ? root.querySelector('#slice') : toggles || aside, g === 'Diagnostics'); if (node && node.parentNode !== box[g]) box[g].appendChild(node); };
    for (const en of TABLE) {
      if (!['1 Terrain', '2 Room types', '3 Stage', '4 Curves (C)', 'Shared passes', 'Overlays', 'Diagnostics'].includes(en.group) && en.id !== 'margin') continue;
      const els = [...root.querySelectorAll(en.dom)]; if (!els.length) continue;
      put(en.id === 'margin' ? 'Source & slice' : en.group, holder(els[0]));
    }
    const fl = root.querySelector('#floors'), mc = root.querySelector('#macro'), inc = root.querySelector('#incursion'), disp = toggles && toggles.parentNode;
    if (fl && disp) aside.insertBefore(fl, disp); // 5 Floors after the crystallizer blocks, before the shared passes and the overlays
    if (mc && disp) aside.insertBefore(mc, disp); // 6 Macroform right after 5 Floors
    if (inc && box.Diagnostics) toggles.insertBefore(inc, box.Diagnostics); // Incursion before the folded Diagnostics
    for (const h of root.querySelectorAll('#sliders > h3')) h.remove(); // the old per-block headers (Shaping, Passes, ...)
    const dh = toggles && toggles.previousElementSibling; if (dh && dh.tagName === 'H3' && dh.textContent === 'Display') dh.remove();
    return box;
  }
  /* docs/controls.md, generated from the table */
  function docs() {
    const L = ['# Controls', '', 'GENERATED from `src/controls.js` by `tools/gen_controls_doc.js` (run by `tools/build.py`); do not edit by hand. `tools/test_controls.js` checks that this file is in sync.', '',
      'A control whose requirement is not met is greyed out and cannot be used; its tooltip lists only what to activate. When the requirement is met the tooltip is the help text below.', '',
      'Techniques: Box, A, B, C = the panels the control changes; a badge [A] / [B] / [C] in the panel marks the controls that change only one technique.', ''];
    for (const g of GROUPS) {
      const rows = TABLE.filter((x) => x.group === g); if (!rows.length) continue;
      L.push('## ' + g, '', '| id | techniques | requires | help |', '|---|---|---|---|');
      for (const x of rows) L.push(`| ${x.id} | ${x.tech.length === 4 ? 'all' : x.tech.join(' ')} | ${x.req.length ? x.req.map((k) => R[k].text).join(' · ') : '-'}${x.lock ? ' (locked while: ' + x.lock.doc + ')' : ''} | ${x.keep && !x.help ? '(keeps its own tooltip: see the title in the viewer)' : x.help} |`);
      L.push('');
    }
    if (RETIRED.length) { L.push('## Not in the table', ''); for (const r of RETIRED) L.push(`- \`${r.id}\` (${r.dom}): ${r.note}`); L.push(''); }
    return L.join('\n');
  }
  E.controls = { GROUPS, TABLE, RETIRED, REQ: R, unmet, requiresText, tipOf, holder, refresh, badges, layout, docs };
})(typeof window !== 'undefined' ? (window.EVO = window.EVO || {}) : (globalThis.EVO = globalThis.EVO || {}));
