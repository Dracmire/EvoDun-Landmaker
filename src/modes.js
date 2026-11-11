/* EvoDun crystal viewer - MODES TABLE (the UI pass, PR 1): one mode per crystallizer. The single source of truth for the mode selector, its examples (the old scenarios), the cameras and techniques it offers,
   which controls it shows and which blocks of the common area apply (docs/ui-modes.md sections 3-5). docs/modes.md is GENERATED from this table (tools/gen_modes_doc.js, run by tools/build.py);
   tools/test_modes.js checks that it is in sync and consistent with the controls table (src/controls.js).
   This layer only shows / hides existing controls and sets existing parameters: it never changes a shape, a render or a crystallizer.
   RULES: a control that does not belong to the current mode (nor to the common area) is HIDDEN (class `mh`), not greyed; inside a mode the requirements of src/controls.js still apply (greyed + "Requires: ...").
   ADVANCED controls (and the terrain controls in the modes that fold them) are folded behind a toggle of their group. The test-only flag `window.EVO_NO_MODES` (set by tools/ui/common.js) skips this layer: the whole panel as before. */
(function (E) {
  const CAMS = ['isoE', 'isoW', 'oblique', 'low', 'top', 'stage', 'classic'];
  /* the built-in sources an example may name (the ids of the source selector; 'image' = the user's images) */
  const SOURCES = ['snake_surface', 'snake', 'shrine_pier', 'shrine_pier_x4', 'noise', 'real_map', 'snake_floors', 'snake_macroform', 'forest_a', 'forest_b', 'aurhea', 'throne', 'image'];
  const TERRAIN_MAIN = ['terraces', 'subs', 'terH', 'spread', 'stairW', 'stairStyle', 'rampDepth', 'smooth', 'radius'];
  const SHARED = ['outlines', 'gradient', 'rampLines', 'dress', 'sliced'], OVERLAYS = ['features', 'markers', 'zones', 'edges', 'masks', 'veil', 'border'], DIAGNOSTICS = ['regions', 'passes', 'edgeWarn'];
  /* controls that are not tied to a mode */
  const COMMON = {
    view: ['cams', 'tech', 'mode', 'reset'],               // the view bar: cameras and techniques are filtered by the mode, Compare only where the mode has it
    images: ['file', 'flipy', 'roles', 'saveManifest'],    // "Your images": shown while that example is selected (modes with an images example)
    legacy: ['scenario', 'stagePreset', 'src']             // only in the panel without modes (EVO_NO_MODES): the scenarios became examples, the Stage preset is applied by the Stage mode, the examples replace the source selector
  };
  const MODES = [
    {
      id: 'terrain', number: 1, name: 'Terrain', group: 'main',
      purpose: 'Terraces, ramps and the techniques Box, A, B and C on any heightmap: the same data expressed in several ways.', banner: null,
      examples: [
        { id: 'snake_surface', label: 'Snake Mountain surface', src: 'snake_surface' },
        { id: 'real_map', label: 'Real map 256', src: 'real_map' },
        { id: 'shrine_pier', label: 'Shrine-Pier', src: 'shrine_pier' },
        { id: 'shrine_pier_x4', label: 'Shrine-Pier x4', src: 'shrine_pier_x4' },
        { id: 'snake', label: 'Snake Mountain (caves subtracted)', src: 'snake' },
        { id: 'noise', label: 'Value noise', src: 'noise' },
        { id: 'images', label: 'Your images (PNG + roles)', images: true }
      ],
      camera: 'oblique', cameras: CAMS, tech: 'A', techs: ['box', 'A', 'B', 'C'], compare: true, compareDefault: true,
      main: [...TERRAIN_MAIN, 'curvesPreset', 'wallPass', 'wallExtrude'], advanced: ['subH', 'minPlateau', 'minSub', 'pre', 'climb', 'gateThr', 'gateMin', 'passGap', 'tread', 'wallStrata', 'wallColumn', 't2Spacing', 't2Rows', 't2Group', 't2Jitter'], slice: ['zoneChips', 'crop', 'margin'], fixed: [], terrain: 'main',
      common: { shared: SHARED, overlays: true, incursion: true, diagnostics: true }
    },
    {
      id: 'rooms', number: 2, name: 'Room types (DAC)', group: 'main',
      purpose: 'Room types (Diorama, Ascension, Cake) on a map with rooms: Cake rings, Ascension walls and the Pocket of a Diorama. Rooms are always on in this mode.', banner: null,
      examples: [
        /* THREE TYPES CONNECTED (docs/ui-modes.md U11): the whole map with the rule on, the type tint and the Diorama outline on, and a stake + two objectives whose route crosses the three types. Marks (tiles of the whole map, real map Balanced types):
           each is the walkable tile of the MAIN region nearest the centroid of the largest room of its type: stake = Cake 82 (5941 tiles), objective 1 = Ascension 57 (646), objective 2 = Diorama 7 (1755); tools/ui/test_modes_ui.js checks the type under each mark. */
        { id: 'real_balanced', label: 'Real map · Balanced (3 types, connected)', src: 'real_map', rooms: true, preset: 'balanced', tint: true, outline: true, stake: { x: 200, y: 62 }, objectives: [{ x: 122, y: 201, label: 'Ascension 57' }, { x: 47, y: 75, label: 'Diorama 7' }] },
        { id: 'real_default', label: 'Real map · Default', src: 'real_map', rooms: true, preset: 'default' },
        /* THE CHAIN AT 5 TERRACES (DAC v2, D23): the parameters of the mocks (Balanced types values with 5 terraces: core 100, radius 5, minPlateau 120); the marks are, as in the default example, the walkable main-region tile nearest the centroid of the largest
           room of each type at THESE parameters: stake = Cake 82 (5941 tiles), objective 1 = Ascension 27 (443), objective 2 = Diorama 6 (1149); tools/ui/test_modes_ui.js checks the type under each mark */
        { id: 'real_chain5', label: 'Chain (5 terraces)', src: 'real_map', rooms: true, preset: 'balanced', terraces: 5, tint: true, outline: true, stake: { x: 200, y: 62 }, objectives: [{ x: 87, y: 136, label: 'Ascension 27' }, { x: 25, y: 128, label: 'Diorama 6' }] },
        /* one example per room type (`type` = the type the example is about: it is what the rule of "Framing by room type" uses on the first application, when the classification of the new source is not built yet; tools/ui/test_modes_ui.js checks it against the real classification) */
        { id: 'cake60', label: 'Cake · bowl (room 60)', src: 'real_map', rooms: true, preset: 'balanced', room: 60, type: 'cake' },
        { id: 'cake85', label: 'Cake · bowl + pyramid (room 85)', src: 'real_map', rooms: true, preset: 'balanced', room: 85, type: 'cake' },
        { id: 'asc88', label: 'Ascension · walls (room 88)', src: 'real_map', rooms: true, preset: 'balanced', room: 88, type: 'ascension' },
        { id: 'pocket31', label: 'Pocket · Diorama 31', src: 'real_map', rooms: true, preset: 'balanced', pocket: true, room: 31, type: 'diorama' },
        { id: 'images', label: 'Your images (PNG + roles)', images: true, rooms: true }
      ],
      camera: 'isoE', cameras: CAMS, tech: 'A', techs: ['box', 'A', 'B', 'C'], compare: false, compareDefault: false,
      main: ['roomsPreset', 'dacAuto', 't-cake', 't-ascWalls', 'ascHeight', 't-pocket', 'pocketFraming', 'pocketHeight', 'dacShow', 'dacView', 'chainExtra', 'roomRule', 'cakeCut', 'dioChain', 'dioProto', 'gateMarks', 'anchors', 'anchorH', 'roomChips', 'typeTint'],
      advanced: ['ascCut', 'ascGate', 'roomsMinCore', 'rRadius', 'roomsCross', 'roomsIsoLimit', 'cakeLayers', 'cakeStep', 'cakePer', 'cakeSeam', 'roomBorders', 'roomTint', 'nowalk', 'dioOutline'],
      slice: [], fixed: ['t-rooms'], terrain: 'folded',
      common: { shared: SHARED, overlays: true, incursion: true, diagnostics: true }
    },
    {
      id: 'stage', number: 3, name: 'Stage', group: 'main',
      purpose: 'The 2D-HD Stage (S1: the base): a window of rooms of the DAC data in hero heights (H), a hero placeholder and the Cam 6 tracking of the hero. The Art contract examples are kept as legacy. Diorama technique (Pocket, M2 height) in mode 3 needs a multi-room Pocket: later PR.', banner: '2D-HD crystallizer: in construction (S1)',
      examples: [
        { id: 'dac_stage', label: 'DAC window (2D-HD, S1)', src: 'real_map', rooms: true, preset: 'balanced', terraces: 5, roomSet: [17, 10, 20, 27, 6, 5], stageHero: true, yaw: 180, tech: 'box', orient: true, planes: true, props: true, /* C1: Box is the technique of the window examples (B stays offered); the orientation by room is on (the yaw above is the fallback of the switch off) */ stairs: { style: 0, tread: 1, preferFill: true }, /* S3: Cam 6 looks from the north (yaw 180: the 4 ramps of the window rise AWAY from the camera), steps (A1: 3 risers of 0.19 terH, 2 treads) and the fill variant for the lateral transitions */ 
          display: { roomBorders: false, nowalk: false, gateMarks: false, rampLines: false, veil: false, border: false, markers: false, edgeWarn: false }, // S2a: the clean view of the window (the debug aids off; the checkboxes keep working)
          /* S4a: the declared billboards (switch "Stage objects"), MAP coordinates (tile centres), hH in hero heights, the format of the future `billboards` entry of the treatment. All on walkable tiles outside the 3 columns of every transition and at least 2 tiles (Chebyshev) from their bottom / top tiles (tools/ui/test_stage_objects_ui.js checks it).
             Hero start (61.5, 117.5, room 17): (1) a 1 H banner 3 tiles to its side at the same depth and on the same terrace (x 58.5; the tiles at x 62-63 are within 2 tiles of the transition and x 64.5 is in a pit hidden behind the rim, measured) = the comparison rule; (2) a 3 H pillar in room 20, which fits the panel; (3, 4) two 2 H lamps flanking the 3-step transition next to the start (beyond its 3 columns); (5) a 3 H banner in room 5, about 7 H beyond the hero, whose top leaves the panel
             (the cut silhouette); the rest fill the other rooms (6 shrub room 6, 7 lamp room 27, 8 shrub on the other side of the start (x 66.5), 9 pillar room 10, the far, high one). */
          objects: [{ kind: 'banner', x: 58.5, y: 117.5, hH: 1 }, { kind: 'pillar', x: 80.5, y: 121.5, hH: 3 }, { kind: 'lamp', x: 59.5, y: 119.5, hH: 2 }, { kind: 'lamp', x: 63.5, y: 119.5, hH: 2 }, { kind: 'banner', x: 45.5, y: 132.5, hH: 3 }, { kind: 'shrub', x: 20.5, y: 128.5, hH: 1.5 }, { kind: 'lamp', x: 87.5, y: 135.5, hH: 2 }, { kind: 'shrub', x: 66.5, y: 117.5, hH: 1.5 }, { kind: 'pillar', x: 62.5, y: 142.5, hH: 2 }, { kind: 'landmark', x: 55.5, y: 135.5, hFar: 1.5, hNear: 3, dFar: 8, dNear: 2 }],
          /* S4c: the LANDMARK (last entry of `objects`, same switch): the far end of the LAST room of the chain (room 5, x 34-56, y 126-137: 160 walkable tiles, 23 x 12), at (55.5, 135.5) = the east end of its far side. The central depth axis (x ~ 45) does not work: from there the room is too shallow for a hero at 8 H or 6 H (16 / 12 tiles) and
             the base is hidden from the 8 H positions of every candidate near the axis; at (55, 135) the hero positions (42.5, 126.5) at 8 H, (47.5, 126.5) at 6 H, (50.5, 129.5) at 4 H and (51.5, 134.5) at 2 H all see its base (measured with the pick buffer: tools/ui/test_stage_landmark_ui.js). Walkable, outside the 3 columns of every transition, >= 2 tiles from their bottom / top tiles. */
          /* S4b: the declared VOLUMES (switch "Stage volumes"), MAP coordinates, x / y = the integer MIN corner, w x d tiles, hH in hero heights above the nearest walkable ground (a 0.25 H grid). All on tiles that are already blocked, none within 2 tiles of a transition (the nearest blocked tile is 3 tiles away, at (22, 136), and any volume there hides walkable tiles: the limit case is tested in tools/test_volumes.js instead),
             and no walkable tile loses more than 25 % of its pixels to a volume at Cam 6 yaw 180 (worst measured: 16.9 %, partial lateral occlusion by perspective next to a volume); with the other cameras of mode 3 the volumes can hide tiles (measured at yaw 0, 90 and 270) (tools/ui/test_stage_volumes_ui.js measures it against the pick buffer). Chosen by that measurement: (1) a 1 H low block on the far flank, south of the footprint; (2) a 3 H column 2 x 2 on the same flank beside the south edge of the rooms; (3) a 2 H wall of 6 tiles along it (the three heights 1 / 2 / 3 H side by side on the far flank; the east flank was tried first and its volumes camouflage against the high rock there); (4) a 1 H block in the hole between rooms (a
             closure-interior tile of the border, no profile); (5) a 2 H block in the exterior beyond the border (to see the island / quebrada interaction). */
          volumes: [{ x: 50, y: 147, w: 6, d: 2, hH: 1 }, { x: 85, y: 147, w: 2, d: 2, hH: 3 }, { x: 66, y: 147, w: 6, d: 1, hH: 2 }, { x: 30, y: 132, w: 4, d: 2, hH: 1 }, { x: 60, y: 152, w: 3, d: 3, hH: 2 }] },
        { id: 'x4_stage', label: 'Shrine-Pier x4 · Stage (legacy contract)', src: 'shrine_pier_x4', stage: true, tech: 'B', contract: true },
        { id: 'diorama31_stage', label: 'Diorama 31 · Stage (legacy contract)', src: 'real_map', rooms: true, preset: 'balanced', room: 31, stage: true, tech: 'B', terraces: 3, contract: true }
      ],
      camera: 'stage', cameras: CAMS, tech: 'box', techs: ['box', 'B'], compare: false, compareDefault: false,
      main: ['contract', 'tilesPerH', 'heroFrac', 'vScale', 'exag', 'stageUnits', 'stageBorder', 'stageObjects', 'stageVolumes', 'stageOrient', 'stagePlanes', 'stageProps', 'stageFrame', 'stageReset', 'stageFollow', 'stageWindow', 'stagePrev', 'stageNext'], advanced: [], slice: [], fixed: [], terrain: 'folded',
      common: { shared: SHARED, overlays: true, incursion: true, diagnostics: true }
    },
    {
      id: 'curves', number: 4, name: 'Curves (C)', group: 'main',
      purpose: 'Tiles to curves (technique C, Unexplored 2 style): displaced Voronoi contours and the wall pass.', banner: null,
      examples: [
        { id: 'snake_curves', label: 'Snake Mountain surface', src: 'snake_surface', tech: 'C' },
        { id: 'real_default', label: 'Real map · Default', src: 'real_map', rooms: true, preset: 'default', tech: 'C' },
        { id: 'real_balanced', label: 'Real map · Balanced types', src: 'real_map', rooms: true, preset: 'balanced', tech: 'C' },
        { id: 'shrine_pier_x4', label: 'Shrine-Pier x4', src: 'shrine_pier_x4', tech: 'C' },
        { id: 'images', label: 'Your images (PNG + roles)', images: true, tech: 'C' }
      ],
      camera: 'oblique', cameras: CAMS, tech: 'C', techs: ['C'], compare: true, compareDefault: false,
      main: ['curvesPreset', 'wallPass', 'wallExtrude'], advanced: ['wallStrata', 'wallColumn', 't2Spacing', 't2Rows', 't2Group', 't2Jitter'], slice: [], fixed: [], terrain: 'folded',
      common: { shared: SHARED, overlays: true, incursion: true, diagnostics: true }
    },
    {
      id: 'floors', number: 5, name: 'Floors', group: 'archived',
      purpose: 'Floors: one landmark as stacked heightmaps (single floor, exploded stack, cutaway).', banner: 'CLOSED: the shapes are baked by a script (tools/derive_snake_floors.py); no control changes them.',
      examples: [{ id: 'snake_floors', label: 'Snake Mountain floors', src: 'snake_floors' }],
      camera: 'isoE', cameras: ['isoE', 'isoW', 'oblique', 'low', 'top', 'classic'], tech: 'A', techs: ['box', 'A', 'B', 'C'], compare: false, compareDefault: false,
      main: ['floorsView', 't-backdrop', 'backdropGap', 'backdropHeight'], advanced: [], slice: [], fixed: [], terrain: null,
      common: { shared: SHARED, overlays: true, incursion: 'single', diagnostics: true }
    },
    {
      id: 'macroform', number: 6, name: 'Macroform', group: 'main',
      purpose: 'Macroform: Snake Mountain as one baked voxel volume (exterior, quadrant removed, interior only, horizontal cut).', banner: 'INCOMPLETE: one baked example that cannot be produced or tuned from the page; not yet a crystallizer.',
      examples: [{ id: 'snake_macro', label: 'Snake Mountain macroform', src: 'snake_macroform', macro: 'exterior' }],
      camera: 'isoE', cameras: ['isoE', 'isoW', 'oblique', 'low', 'top'], tech: 'box', techs: ['box'], compare: false, compareDefault: false,
      main: ['macroView'], advanced: [], slice: [], fixed: [], terrain: null,
      common: { shared: ['outlines'], overlays: true, incursion: false, diagnostics: true }
    }
  ];
  /* THE EIGHT PROTOTYPES of the corridor Dioramas (DAC v2 PR D, D32; selector "Diorama prototype" of mode 2, `viewer.dioProto`): one click loads the host scene of the example, places the stake and the objectives (K = 1 keeps the sub-objective, K = 0 only the final goal), sets Cam 1 at terH 1, switches the Diorama option to Corridor,
     frames the host room and, where the type is not the natural one of the host, forces it (`P.dioForce`). `structure` = the bridges BUILT by the plan at the host (1 leaf, 2 corridor). Hosts (user's decision, Gate 2): Cima leaf = Balanced room 7 (natural); Cima corridor = Chain 5 K = 1 room 10 (natural); Isla / Arena leaf + Quebrada = Balanced K = 1 room 66 (Quebrada natural);
     Isla / Arena corridor + Mirador = Balanced K = 0 room 20 (Mirador natural). Isla has no natural host in the four fixed scenes: it is always forced. The flat room-66 Cima exists only as a forced test hook (`P.dioForce`), never natural. */
  const PROTOS = [
    { id: 'cima-leaf', label: 'Cima · leaf (Balanced, room 7)', example: 'real_balanced', k: 1, room: 7, type: 'cima', force: false, structure: 1 },
    { id: 'cima-corridor', label: 'Cima · corridor (Chain 5, room 10)', example: 'real_chain5', k: 1, room: 10, type: 'cima', force: false, structure: 2 },
    { id: 'arena-leaf', label: 'Arena · leaf (Balanced, room 66)', example: 'real_balanced', k: 1, room: 66, type: 'arena', force: true, structure: 1 },
    { id: 'arena-corridor', label: 'Arena · corridor (Balanced K0, room 20)', example: 'real_balanced', k: 0, room: 20, type: 'arena', force: true, structure: 2 },
    { id: 'isla-leaf', label: 'Isla · leaf (Balanced, room 66)', example: 'real_balanced', k: 1, room: 66, type: 'island', force: true, structure: 1 },
    { id: 'isla-corridor', label: 'Isla · corridor (Balanced K0, room 20)', example: 'real_balanced', k: 0, room: 20, type: 'island', force: true, structure: 2 },
    { id: 'quebrada', label: 'Quebrada (Balanced, room 66)', example: 'real_balanced', k: 1, room: 66, type: 'quebrada', force: false, structure: 1 },
    { id: 'mirador', label: 'Mirador (Balanced K0, room 20)', example: 'real_balanced', k: 0, room: 20, type: 'mirador', force: false, structure: 2 }
  ];
  const byId = (id) => MODES.find((m) => m.id === id) || null;
  const IDS = MODES.map((m) => m.id);

  /* which state each control id has in a mode: 'show' | 'adv' (folded in its group) | 'fold' (the terrain controls of a mode that folds them); absent = hidden.
     ctx: { exampleId, floorsView } */
  function plan(mode, ctx) {
    ctx = ctx || {}; const s = {};
    for (const id of mode.main) s[id] = 'show';
    for (const id of mode.advanced) s[id] = 'adv';
    for (const id of mode.slice) s[id] = 'show';
    if (mode.terrain === 'folded') for (const id of MODES[0].main) if (!s[id]) s[id] = 'fold';
    const c = mode.common;
    for (const id of c.shared) s[id] = 'show';
    if (c.overlays) for (const id of OVERLAYS) s[id] = 'show';
    if (c.incursion === true || (c.incursion === 'single' && (ctx.floorsView || 'single') === 'single')) s.incursion = 'show';
    if (c.diagnostics) for (const id of DIAGNOSTICS) s[id] = 'show';
    for (const id of COMMON.view) s[id] = 'show';
    if (mode.id === 'stage' && ctx.stageWin) { if (ctx.stageUnits) { delete s.terH; delete s.subH; } else s.subH = 'fold'; } // S2a: with "Measures in H" on the shape units (terH, subH) follow the hero scale and are hidden; off, they come back (subH too, it is folded with the terrain controls)
    if (mode.examples.some((e) => e.images) && ctx.exampleId === 'images') for (const id of COMMON.images) s[id] = 'show';
    return s;
  }

  /* ---- DOM (only used by the viewer; the pure parts above are used by the node test) ---- */
  const MH = 'mh';
  const hide = (el, on) => { if (el) el.classList.toggle(MH, !!on); };
  /* extra elements that belong to a control (hints, rows) and follow its visibility */
  const AUX = { zoneChips: ['#zoneHint', '#zoneBtns'], roomChips: ['#roomHint', '#roomBtns'], crop: ['#cropHint', '#slice .crop'] };
  const BLOCKS = [['#slice', ['zoneChips', 'roomChips', 'crop', 'margin']], ['#incursion', ['incursion']]];
  function resetFolds(root) { root.querySelectorAll('.grp').forEach((s) => { delete s.dataset.adv; }); }
  function refresh(root, ctx, onToggle) {
    const mode = byId(ctx.modeId); if (!mode) return;
    const C = E.controls, vis = plan(mode, ctx), folded = new Map();
    const img = mode.examples.some((e) => e.images) && ctx.exampleId === 'images';
    for (const en of C.TABLE) {
      const els = [...root.querySelectorAll(en.dom)], state = vis[en.id] || 'hide';
      if (en.id === 'cams') { els.forEach((b) => hide(b, !mode.cameras.includes(b.dataset.id))); continue; }
      if (en.id === 'tech') { els.forEach((b) => hide(b, !mode.techs.includes(b.dataset.id))); continue; }
      if (en.id === 'mode') { els.forEach((b) => hide(b, !mode.compare)); continue; }
      if (en.id === 'reset') continue;
      const multi = en.dom.includes(',') || els.length > 1;
      for (const el of els) {
        const h = multi ? el : C.holder(el), sec = el.closest('.grp');
        let off = state === 'hide';
        if (!off && (state === 'adv' || state === 'fold')) { off = !(sec && sec.dataset.adv === '1'); if (sec) { if (!folded.has(sec)) folded.set(sec, new Set()); folded.get(sec).add(h); } }
        hide(h, off);
      }
      for (const sel of AUX[en.id] || []) root.querySelectorAll(sel).forEach((x) => hide(x, state === 'hide'));
    }
    // the blocks that are not groups: the slice, the incursion, the floors and the macroform blocks
    for (const [sel, ids] of BLOCKS) hide(root.querySelector(sel), !ids.some((id) => vis[id]));
    const inGroup = (g) => C.TABLE.filter((en) => en.group === g).map((en) => en.id);
    hide(root.querySelector('#floors'), !inGroup('5 Floors').some((id) => vis[id]));
    hide(root.querySelector('#macro'), !inGroup('6 Macroform').some((id) => vis[id]));
    // the source block: the examples replace the selector; the images controls only with the example "Your images"
    hide(root.querySelector('#srcRow'), true);
    for (const sel of ['#fileRow', '#fileHint', '#roles', '#rolesInfo', '#rolesBtns', '#source > h3']) hide(root.querySelector(sel), !img);
    hide(root.querySelector('#scenarios'), true);
    // the fold toggle of each group (advanced controls / terrain controls of the modes that fold them)
    for (const sec of root.querySelectorAll('.grp')) {
      const items = folded.get(sec), open = sec.dataset.adv === '1'; let t = sec.querySelector(':scope > .advtoggle');
      if (items && items.size) {
        if (!t) {
          t = document.createElement('button'); t.type = 'button'; t.className = 'advtoggle'; sec.insertBefore(t, sec.children[1] || null);
          t.addEventListener('click', (ev) => { ev.preventDefault(); sec.dataset.adv = sec.dataset.adv === '1' ? '0' : '1'; if (onToggle) onToggle(); });
        }
        const terrainFold = mode.terrain === 'folded' && sec.dataset.group === '1 Terrain';
        t.textContent = (open ? 'Hide ' : 'Show ') + (terrainFold ? 'terrain controls' : 'advanced controls') + ` (${items.size})`; hide(t, false);
      } else if (t) hide(t, true);
      const kids = [...sec.children].filter((c) => !/^(H3|SUMMARY)$/.test(c.tagName) && !c.classList.contains('advtoggle'));
      hide(sec, kids.length > 0 && kids.every((c) => c.classList.contains(MH)) && !(items && items.size)); // a section that has a fold toggle stays visible: its toggle is the way to reach the folded controls
    }
  }

  /* docs/modes.md, generated from the table */
  function docs() {
    const L = ['# Modes', '', 'GENERATED from `src/modes.js` by `tools/gen_modes_doc.js` (run by `tools/build.py`); do not edit by hand. `tools/test_modes.js` checks that this file is in sync. Design: `docs/ui-modes.md`.', '',
      'One mode per crystallizer. Entering a mode applies its first example, its camera and its technique; a control that does not belong to the mode is hidden (not greyed); the requirements of `docs/controls.md` still apply inside a mode (greyed + "Requires: ...").',
      'ADVANCED controls are folded behind a toggle of their group. The test-only flag `window.EVO_NO_MODES` shows the whole panel (no modes).', ''];
    const list = (a) => (a.length ? a.map((x) => '`' + x + '`').join(', ') : '-');
    for (const m of MODES) {
      L.push(`## ${m.number} ${m.name}${m.group === 'archived' ? ' (Archived)' : ''}`, '', m.purpose, '');
      if (m.banner) L.push(`Banner: **${m.banner}**`, '');
      L.push('| field | value |', '|---|---|');
      L.push(`| id | \`${m.id}\` |`);
      L.push(`| examples (first = default) | ${m.examples.map((e) => e.label + (e.src ? ' (`' + e.src + '`)' : '')).join('; ')} |`);
      L.push(`| camera (default) | \`${m.camera}\` |`, `| cameras offered | ${list(m.cameras)} |`);
      L.push(`| technique (default) | \`${m.tech}\` |`, `| techniques offered | ${list(m.techs)} |`, `| compare | ${m.compare ? 'yes' : 'no'}${m.compare ? (m.compareDefault ? ' (on at entry)' : ' (off at entry)') : ''} |`);
      L.push(`| main controls | ${list(m.main)} |`, `| advanced controls (folded) | ${list(m.advanced)} |`, `| slice controls | ${list(m.slice)} |`);
      L.push(`| terrain controls | ${m.terrain === 'main' ? 'main (above)' : m.terrain === 'folded' ? 'folded: ' + list(MODES[0].main) : 'none'} |`, `| fixed by the mode (hidden) | ${list(m.fixed)} |`);
      const c = m.common;
      L.push(`| shared passes | ${list(c.shared)} |`, `| overlays | ${c.overlays ? list(OVERLAYS) : '-'} |`, `| incursion | ${c.incursion === true ? 'yes' : c.incursion === 'single' ? 'single floor only' : 'hidden'} |`, `| diagnostics (folded) | ${c.diagnostics ? list(DIAGNOSTICS) : '-'} |`, '');
    }
    L.push('## Common to every mode', '', `- View bar: ${list(COMMON.view)} (cameras and techniques filtered by the mode; Compare only where the mode has it).`, `- "Your images" example (modes with it): ${list(COMMON.images)}.`, `- Only without modes (\`EVO_NO_MODES\`): ${list(COMMON.legacy)}.`, '');
    return L.join('\n');
  }
  { // C1: two examples of mode 3 with ONE room each (no declared volumes / objects): the rooms of the "mock T" comparison
    const stg = MODES.find((m) => m.id === 'stage'), base = stg.examples.find((e) => e.id === 'dac_stage');
    stg.examples.push({ id: 'images', label: 'Your images (PNG + roles)', images: true, stageHero: true, stageZones: true, tech: 'box', orient: true, planes: true, props: true, stairs: { style: 0, tread: 1, preferFill: true }, display: { roomBorders: false, nowalk: false, gateMarks: false, rampLines: false, veil: false, border: false, markers: false, edgeWarn: false } }); // M2b: the window of the Stage on the ZONES of a PNG (role `zone`), the levels from the role `elevation`; the loader of the images appears with this example
    const forest = (v, label, terraces, subs) => ({ id: 'forest_' + v.toLowerCase(), label, src: 'forest_' + v.toLowerCase(), stageHero: true, stageZones: true, tech: 'box', orient: true, planes: true, props: true, terraces, subs, stairs: { style: 0, tread: 1, preferFill: true }, display: { roomBorders: false, nowalk: false, gateMarks: false, rampLines: false, veil: false, border: false, markers: false, edgeWarn: false } }); // M3a: Forest, the old map of the game with the zones of v53 (a built-in source: PNGs of docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated/), terraces and sub-terraces per variant
    stg.examples.push(forest('A', 'Forest A (v53)', 2, 6), forest('B', 'Forest B (amplified relief)', 4, 3));
    stg.examples.push({ id: 'aurhea', label: "Aurhea's Fountain (old map, water)", src: 'aurhea', stageHero: true, stageZones: true, tech: 'box', orient: true, planes: true, props: true, terraces: 1, subs: 5, stairs: { style: 0, tread: 1, preferFill: true }, display: { roomBorders: false, nowalk: false, gateMarks: false, rampLines: false, veil: false, border: false, markers: false, edgeWarn: false } }); // M3b: the old map with a LAKE (water = pack data, blocked), five zones, the peninsula as the last zone; terraces 1 and sub-terraces 5 (heights measured in tools/test_aurhea_roles.js)
    /* THE THRONE WORLD, COMMIT 1 (the world of the room, no layers): the throne room of Aliahan Castle of the paired shot refs/dq3/pairs/p_20261029_192049_throne_room_orig_remake.png, read BY HAND ("MAPA 1": docs/crystallizers/03-stage/refs/dq3/throne_aliahan/map1.txt + derive_roles.py; the rip old/castle_scenario.png is ANOTHER room).
       DECLARATION (CLAUDE.md "COMPOSITION RULES" (c)): map = MAPA 1 (a built-in source `throne`: zones NAVE, PILLAR, WALL); generator rules ON: `orient` ON, `planes` ON, `props` ON; `volumes` DECLARED (9, commit 2: the six pillars and the closing walls; the switch "Stage volumes" starts ON with `volumesOn`), `objects` 11 pieces and `ribbon` 6 ribbons (commit 3, below; the switch "Stage objects" starts ON with `objectsOn`), the emblem = a `banner` card (a BACKGROUND: any replacement will do), NO `z` entry (a height above the ground is not modelled: the banners stand on the ground, they do not hang). Window [NAVE]: the dais, the carpet, the side floor and the entrance passage are ONE walkable zone (with the dais apart `orient` gave X yaw 270, with the passage apart Hub yaw 180: the camera looked at the south wall); the six pillars and the walls are blocked cells of other zones, outside the window.
       Declared by the example: terraces 2, subs 8 (0.21 H per sub-level), pre 0, tilesPerH 1.5 (the hero of the remake measures 0.72 old tiles = 1.44 viewer tiles), heroFrac 0.11 (the viewer then draws the hero at 11.7 % of the panel height, the remake 11.6 %), heroScreen (0.52, 0.62); Cam 6 untouched, the yaw is the one `orient` gives. */
    const serp = (x0, y0, x1, y1) => { const p = []; for (let y = y0, k = 0; y <= y1; y++, k++) { const a = [x0 + 0.5, y + 0.5], b = [x1 + 0.5, y + 0.5]; if (k % 2) p.push(b, a); else p.push(a, b); } return p; }; // THRONE COMMIT 3: a rectangle of tiles x0..x1 x y0..y1 (inclusive) as ONE ribbon of 1 tile (a serpentine through the tile centres): `ribbonTiles` covers a capsule, which would spill past the ends of a wide rectangle
    stg.examples.push(Object.assign({}, forest('B', 'Throne room of Aliahan (MAPA 1, the world)', 2, 8), { id: 'throne_aliahan', src: 'throne', pre: 0, tilesPerH: 1.5, heroFrac: 0.11, heroScreen: [0.52, 0.62], window: [1], heroAt: { x: 17, y: 18 }, volumesOn: true, planesAvoidPath: true,
      /* COMMIT 2, the scenography as GEOMETRY (S4b volumes on tiles that are ALREADY blocked; nothing walkable moves; no billboards, ribbons, emblem or `z`). Coordinates are MAP tiles (integer min corner), 1 old tile = 2 x 2 tiles; `kind` is a note for the readings, not read by the viewer.
         The six pillars of MAPA 1 (`Q` on the north band, row 2; `P` on the floor, rows 6 and 10; old columns 3 and 13): 5 H above the nearest walkable ground (6.05 H over the 1.05 H north band, 5 H over the floor). The two of the middle row (`P` at (6, 12) and (27, 12)) are raised on the OUTER column of their 2 x 2 blocked cell only (1 x 2): at the hero (17, 24) the full pillar hid 29.9 % of the pixels of the carpet tile (12, 5) (22 % under it, the rest anti-aliased blends along its silhouette), the narrow one 22.6 % (10.7 % under it); the other tiles of the cell stay blocked at floor height. 5 H = the clip of the remake (its near pillar is cut by the top edge, base about 150 px from it and the hero 43.5 px: 3.5 H at least); 3 and 4 H cost the same ground (tools/ui/test_throne_world_ui.js prints the table).
         The closing walls (north, west, east; 8 H over the nearest walkable ground = 9.05 H for the north one, whose centre tile is on the 1.05 H band): the terrain wall (3.47 H) and `planes`'s back wall (4.05 H) leave 15.4 % of the drawn frame as void with the hero on the dais (18.1 % on the throne; the camera pitches 25 deg and the map ends) and 2.8 % 4 old tiles off the axis (void beyond the west edge); with the walls it is 0 % at the seven positions and at three extra ones (6 H closes the seven, 8 H also the extremes x = 5 and 29). The `planes` back wall and its four north columns are replaced by these walls (their roofs are lower).
         OCCLUSION CRITERION (user's decision, 2026-11-10; "estrado" read as A by the reviewer): the S4b rule (no walkable tile loses more than 25 % of its pixels to a volume) holds for the walls and everything that is not a pillar; for the PILLARS the lateral floor beside and behind them may lose more (the remake hides it) with ONE condition: 0 tiles of the carpet, of the dais steps, of the throne (the masks `path` and `poi`: ESTRADO = A), of the entrance passage and of its landing lose more than 25 % (measured against the STRICT base: volumes and planes off, tiles with at least 200 px visible). The wings of the north band (rows 2-3 beside the carpet, 1.05 H) are LATERAL FLOOR, not dais. `planesAvoidPath: true`: the `planes` columns that would shade the role `path` are omitted (src/planes.js: the ONE-TIME exception of the user for this commit; planes.js is off limits again after it and this is no precedent). Measured at yaw 0 (the example's), README of the throne. */
      volumes: [{ kind: 'pillar', x: 6, y: 4, w: 2, d: 2, hH: 5 }, { kind: 'pillar', x: 26, y: 4, w: 2, d: 2, hH: 5 }, { kind: 'pillar', x: 6, y: 12, w: 1, d: 2, hH: 5 }, { kind: 'pillar', x: 27, y: 12, w: 1, d: 2, hH: 5 }, { kind: 'pillar', x: 6, y: 20, w: 2, d: 2, hH: 5 }, { kind: 'pillar', x: 26, y: 20, w: 2, d: 2, hH: 5 },
        { kind: 'wall', x: 0, y: 0, w: 34, d: 4, hH: 8 }, { kind: 'wall', x: 0, y: 4, w: 2, d: 30, hH: 8 }, { kind: 'wall', x: 32, y: 4, w: 2, d: 30, hH: 8 }],
      /* COMMIT 3, the DRESS of the room (data only: no `src/` code, no `z`; the pack, the volumes and the walkable floor are untouched). Coordinates are MAP tiles (centres); `mass` (a stable name) and `layer` (P occluder, G guide, R route and goal, F background) are notes for the movement table of commit 4, not read by the viewer.
         COLOURS are VALUE, not look: the ground stays the dark terrain, the carpet is a lighter mass, the trim and the medallions lighter still; the people are light (the focus), the armours dark (they frame). No text on any piece (`label: false`).
         RIBBONS (calcomanias on the tiles of the role `path`, they paint TOP faces only: the risers of the carpet and of the dais keep the colour of the terrain; the stone of the dais and the floor are NOT painted: the floor is terrain painted by role): the carpet of the nave (x 10-23, y 4-23: 14 wide, axis x = 17) and of the entrance passage (x 16-19, y 24-29: 4 wide, axis x = 18, one tile off the nave's) as 1-tile serpentines (`serp`: exact rectangles, no spill past the ends); the gold trim = the two outer columns of the nave carpet (x 10 and x 23); two medallions (a disc = a ribbon of one point) on the axis, measured on the SFC half of the pair: the upper one centred at (17, 9.0) with a gold motif 1.75 tiles in radius (the diamond), the lower one at (17, 17.5): the diamond is 1.7 tiles in radius and the ring with its corner knots 3.35, so 2.5 (SUPUESTO, between the two).
         OBJECTS (billboards of people and props; `kind` pillar = a narrow box with a colour of value for a person, like the guards of `golden_throne`; no sprite). The people do NOT collide (the hero walks through them: blocking them would change the walkable floor). The candelabra of the remake already come from the rule `props` (12 lamps, with their label "lamp 1.2 H", which cannot be removed without touching props.js): they are not repeated here. The `landmark` of `props` stands on the throne tile (16.5, 6.5): the king is declared a little in front of it. */
      objectsOn: true,
      ribbon: [{ pts: serp(10, 4, 23, 23), wH: 2 / 3, color: '#d9694a', mass: 'carpet nave', layer: 'G' }, { pts: serp(16, 24, 19, 29), wH: 2 / 3, color: '#d9694a', mass: 'carpet passage', layer: 'G' },
        { pts: [[10.5, 4.5], [10.5, 23.5]], wH: 2 / 3, color: '#f3cf6e', mass: 'trim west', layer: 'G' }, { pts: [[23.5, 4.5], [23.5, 23.5]], wH: 2 / 3, color: '#f3cf6e', mass: 'trim east', layer: 'G' },
        { pts: [[17, 9]], wH: 3.5 / 1.5, color: '#f7e3a0', mass: 'medallion upper', layer: 'G' }, { pts: [[17, 17.5]], wH: 5 / 1.5, color: '#f7e3a0', mass: 'medallion lower', layer: 'G' }],
      objects: [{ kind: 'pillar', x: 16.5, y: 7.4, hH: 0.9, wH: 0.45, color: '#ece4cf', label: false, mass: 'king', layer: 'R', at: 'nave' }, // the goal: seated on the POI tile (16-17, 6-7)
        { kind: 'pillar', x: 24.5, y: 7.5, hH: 0.9, wH: 0.45, color: '#a9c68f', label: false, mass: 'chancellor', layer: 'R', at: 'nave' }, // beside the carpet edge on the north band (x 24 = the first tile east of the carpet), not on it
        { kind: 'pillar', x: 8.5, y: 4.5, hH: 1.3, wH: 0.5, color: '#4b5462', label: false, mass: 'armour west', layer: 'F', at: 'north wall' }, { kind: 'pillar', x: 25.5, y: 4.5, hH: 1.3, wH: 0.5, color: '#4b5462', label: false, mass: 'armour east', layer: 'F', at: 'north wall' },
        { kind: 'shrub', x: 8.5, y: 21.5, hH: 0.8, wH: 0.6, color: '#78b36a', label: false, mass: 'pot west', layer: 'P', at: 'nave' }, { kind: 'shrub', x: 25.5, y: 21.5, hH: 0.8, wH: 0.6, color: '#78b36a', label: false, mass: 'pot east', layer: 'P', at: 'nave' },
        { kind: 'banner', x: 4.5, y: 4.5, hH: 3, label: false, mass: 'banner corner west', layer: 'F', at: 'north wall' }, { kind: 'banner', x: 13.5, y: 4.5, hH: 3, label: false, mass: 'banner centre west', layer: 'F', at: 'north wall' },
        { kind: 'banner', x: 20.5, y: 4.5, hH: 3, label: false, mass: 'banner centre east', layer: 'F', at: 'north wall' }, { kind: 'banner', x: 29.5, y: 4.5, hH: 3, label: false, mass: 'banner corner east', layer: 'F', at: 'north wall' },
        { kind: 'pillar', x: 17, y: 4.5, hH: 2.4, wH: 2.4, color: '#c79a4a', shadow: false, label: false, mass: 'emblem', layer: 'F', at: 'north wall' }] })); // the emblem: a CARD 2.4 H wide (the disc of the pair measures 2.4 H, cut by the top edge there) at the foot of the north wall, on the axis; a `pillar` card and not a `banner`: a banner of that width draws a pole 12 % of its width thick (0.29 H, a brown bar beside the flag) and its flag is off-centre
    /* GOLDEN SHOT 1 (M4c-1): Forest B' with the four layers of the frame of the remake capture "Shrine of Plains 17.17" placed BY HAND as data (a capability test: later the rules generate them): window [valley, east slope], the hero declared, yaw 0, no orientation by room, no props by rule. The data are in the block below. */
    stg.examples.push(Object.assign({}, forest('B', 'Golden shot 1 · Shrine door (hand-placed layers)', 4, 3), { id: 'golden_door', window: [1, 6], heroAt: { x: 49.5, y: 31.5 }, heroScreen: [0.592, 0.768], heroFrac: 0.098, yaw: 0, orient: false, props: false, objectsOn: true, // heroFrac 0.098: the hero measures 0.12 of the valid height at its feet (perspective: the pivot is at the centre of the panel)
      /* ---- golden shot 1: hand-placed, a hypothesis, not a rule. The four layers of the frame of "Shrine of Plains 17.17" (remake). Coordinates are MAP tiles (centres); the terrain is filler (Forest B'), the shrine is declared on the POI A tile (the goal, 2 H). ---- */
      objects: [ // every piece: label false (a shot to compare carries no text); the wide ones: shadow false. `layer` is a note for the readings (P / G / R / F), not read by the viewer. Colours are VALUE (which masses frame dark), not look.
        // R (route and goal): the facade (a mid-dark mass, its roof cut by the top edge), the darker arched door in front of it, the torch beside it
        { layer: 'R', kind: 'landmark', x: 38.5, y: 24.5, hH: 5.5, hFar: 5.5, hNear: 5.5, wH: 7.4, color: '#6e5c4e', shadow: false, label: false }, // the shrine facade, on the goal tile (POI A)
        { layer: 'R', kind: 'pillar', x: 38.5, y: 25.1, hH: 2.1, wH: 1.75, color: '#3a2e27', shadow: false, label: false }, // the door in the arch, a little in front of the facade
        { layer: 'R', kind: 'lamp', x: 36.1, y: 24.7, hH: 0.7, label: false }, // the torch to the left of the door
        // G (guide): pairs of small props (grass and stone tufts) along the path that get smaller with the distance
        { layer: 'G', kind: 'shrub', x: 35.0, y: 36.5, hH: 0.35, wH: 0.55, label: false }, { layer: 'G', kind: 'shrub', x: 40.8, y: 36.5, hH: 0.35, wH: 0.55, label: false },
        { layer: 'G', kind: 'shrub', x: 36.2, y: 31.5, hH: 0.3, wH: 0.5, label: false }, { layer: 'G', kind: 'shrub', x: 40.4, y: 31.5, hH: 0.3, wH: 0.5, label: false },
        // F (background), the closure: the dark tree canopy on the right up to the top edge (the last masses stand BEYOND the east edge of the filler map: `always`), its brown trunk, the dark bank to the right of the group, the ground masses that continue the meadow to the right edge, the dark hedge on the left
        { layer: 'F', kind: 'shrub', x: 51.9, y: 23.5, hH: 9, wH: 13.5, color: '#1f4a2c', shadow: false, label: false }, { layer: 'F', kind: 'shrub', x: 51.5, y: 24.5, hH: 7.5, wH: 8, color: '#24542f', shadow: false, label: false },
        { layer: 'F', kind: 'shrub', x: 58.5, y: 24.0, hH: 9, wH: 10, color: '#1f4a2c', shadow: false, label: false, always: true }, { layer: 'F', kind: 'shrub', x: 62.0, y: 27.5, hH: 8, wH: 9, color: '#24542f', shadow: false, label: false, always: true },
        { layer: 'F', kind: 'shrub', x: 51.5, y: 30.3, hH: 7.3, wH: 8.2, color: '#24542f', shadow: false, label: false }, { layer: 'F', kind: 'shrub', x: 57.5, y: 30.2, hH: 7, wH: 9, color: '#1f4a2c', shadow: false, label: false, always: true },
        { layer: 'F', kind: 'pillar', x: 51.0, y: 30.5, hH: 2.6, wH: 0.9, color: '#5b3f2a', shadow: false, label: false }, // the trunk
        { layer: 'F', kind: 'shrub', x: 58.5, y: 30.9, hH: 1.3, wH: 6.5, color: '#2f241d', shadow: false, label: false, always: true }, // the dark bank to the right of the group
        ...[32.4, 33.8, 35.2, 36.6, 38.0, 39.4, 40.8, 42.2, 43.6].map((y, k) => ({ layer: 'F', kind: 'shrub', x: 58.1 - 0.12 * k, y, hH: 2.3, wH: 7.2, color: '#42795b', shadow: false, label: false, always: true })), // the meadow continues to the right edge: ground masses in the colour of the valley floor, stepped in depth beyond the east edge of the map
        { layer: 'F', kind: 'shrub', x: 31.5, y: 27.5, hH: 2.2, wH: 1.8, color: '#1f4a2c', shadow: false, label: false }, { layer: 'F', kind: 'shrub', x: 31.5, y: 22.5, hH: 3, wH: 1.6, color: '#1f4a2c', shadow: false, label: false },
        // P (foreground): the rock that cuts the bottom right corner (only its top shows: its base is below the bottom edge and beyond the east edge of the map)
        { layer: 'P', kind: 'shrub', x: 53.8, y: 44.4, hH: 2.65, wH: 1.0, color: '#8d8b86', shadow: false, label: false, always: true }
      ],
      volumes: [],
      ribbon: [ // G: the dirt path from the bottom left to the foot of the door, wide near the camera (about 2.4 H) and narrow at the door (1.5 H): overlapping ribbons; and the crossing path to the right at the bottom
        { pts: [[33.5, 40.5], [35.5, 36.5], [37.5, 32.5], [38.5, 30.0], [38.5, 25.4]], wH: 1.6 },
        { pts: [[33.2, 40.5], [35.3, 36.5], [37.4, 32.4], [38.3, 30.6], [38.5, 29.7]], wH: 3.0 },
        { part: 'cross', pts: [[39.0, 36.5], [44.5, 35.5], [50.0, 36.5], [51.9, 36.3]], wH: 1.3 }
      ] }));
    /* DEGENERATION D1 (quarantine, user's decision 2026-11-10): this example is KEPT as evidence of what NOT to imitate; it is not a validated golden shot.
       - WHAT IT IS: a scene of cards. The frame of the remake capture "throne room, orange carpet" made of 28 billboards that cover about 81 % of the screen (measured: pixels of the frame that change when the billboards are removed, panel 1280 x 644); there is no source map for the room (the flat valley of Forest B' is only a filler floor) and the generator is OFF (orient, planes and props false, volumes []). It only fits at one position of the hero.
       - WHY IT IS NOT A GOLDEN EXAMPLE: with every generator rule off it is no evidence of any rule, and the mechanism it exercises (billboards as floor, walls and masses) is the one the rules below forbid.
       - composition rule (a): billboards that cover more than 30 % of the screen are strictly forbidden.
       - composition rule (b): the floor is 3D terrain of blocks painted by role (like the floor of the forest), never floor billboards; ribbons are decals that paint the blocks and do not count as billboards.
       Id, data, order and cameras are unchanged (only the label); see CLAUDE.md "Composition rules (mode 3)". */
    stg.examples.push(Object.assign({}, forest('B', 'DEGENERATION D1 · Throne room (billboards) — do not imitate', 4, 3), { id: 'golden_throne', window: [1], heroAt: { x: 37.5, y: 41.5 }, heroScreen: [0.50, 0.636], heroFrac: 0.0965, yaw: 0, orient: false, planes: false, props: false, objectsOn: true,
      /* ---- golden shot 2: hand-placed, a hypothesis, not a rule. The layers of the frame of the remake capture "throne room, orange carpet": P = the two huge grey stone masses at the left and right edges, G = the orange carpet on the light floor, R = the dais and the throne (guards, candelabra), F = the columns with banners and chandeliers and the red back wall. Coordinates are MAP tiles; the filler floor is the flat valley (0 H, x 24-51, y 30-46 around the hero): where the frame needs floor beyond it (north of y 30 and south of the map edge y 46) the floor and the carpet are flat-coloured BILLBOARDS (two bands south of the map, so the two women who stand on the near floor are ordered right). Every piece: label false; the wide ones shadow false. `layer` / `mass` / `part` are notes for the readings of the tool, not read by the viewer. Colours are VALUE (luma), not look. ---- */
      objects: [
        // F: the red back wall (far, behind everything), the far floor up to its base and the far end of the carpet (billboards north of the valley)
        { layer: 'F', mass: 'wall', kind: 'pillar', x: 37.5, y: 24.0, hH: 8, wH: 60, color: '#8a2f28', shadow: false, label: false, always: true },
        { layer: 'F', mass: 'chandC', kind: 'shrub', x: 37.5, y: 24.6, hH: 1.6, wH: 5.6, color: '#d9b44a', shadow: false, label: false }, // the central chandelier (a ring of candles): an ellipse standing in front of the wall, since a piece cannot hang
        { layer: 'G', mass: 'farFloor', kind: 'pillar', x: 37.5, y: 30.05, hH: 2.8, wH: 34, color: '#b8a47c', shadow: false, label: false, always: true },
        { layer: 'G', mass: 'farCarpet', kind: 'pillar', x: 37.5, y: 30.07, hH: 1.45, wH: 6.9, color: '#d9682a', shadow: false, label: false },
        // F: the far columns (at the north end of the valley) and the middle columns with their banner and chandelier (a lamp behind the shaft: its head is the ring of candles)
        { layer: 'F', mass: 'colFarL', kind: 'pillar', x: 26.9, y: 30.1, hH: 4.6, wH: 1.1, color: '#6f6258', shadow: false, label: false }, { layer: 'F', mass: 'colFarR', kind: 'pillar', x: 48.1, y: 30.1, hH: 4.6, wH: 1.1, color: '#6f6258', shadow: false, label: false },
        { layer: 'F', mass: 'chandL', kind: 'lamp', x: 27.4, y: 41.3, hH: 4.2, wH: 2.3, color: '#d9b44a', shadow: false, label: false }, { layer: 'F', mass: 'chandR', kind: 'lamp', x: 47.6, y: 41.3, hH: 4.2, wH: 2.3, color: '#d9b44a', shadow: false, label: false },
        { layer: 'F', mass: 'colMidL', kind: 'pillar', x: 27.4, y: 41.5, hH: 4.3, wH: 1.5, color: '#7d6f62', shadow: false, label: false }, { layer: 'F', mass: 'colMidR', kind: 'pillar', x: 47.6, y: 41.5, hH: 4.3, wH: 1.5, color: '#7d6f62', shadow: false, label: false },
        { layer: 'F', mass: 'bannerL', kind: 'banner', x: 26.2, y: 41.6, hH: 3.9, wH: 1.3, color: '#d9682a', shadow: false, label: false }, { layer: 'F', mass: 'bannerR', kind: 'banner', x: 46.4, y: 41.6, hH: 3.9, wH: 1.3, color: '#d9682a', shadow: false, label: false },
        // R: the dais and the throne at the end of the carpet, the two guards, the two candelabra
        { layer: 'R', mass: 'dais', kind: 'pillar', x: 37.5, y: 32.0, hH: 1.2, wH: 4.0, color: '#cdbb9c', shadow: false, label: false },
        { layer: 'R', mass: 'throne', kind: 'pillar', x: 37.5, y: 32.2, hH: 3.5, wH: 2.1, color: '#7a2a24', shadow: false, label: false },
        { layer: 'R', mass: 'guardL', kind: 'pillar', x: 32.3, y: 33.0, hH: 1.05, wH: 0.45, color: '#5b6fa8', label: false }, { layer: 'R', mass: 'guardR', kind: 'pillar', x: 42.7, y: 33.0, hH: 1.05, wH: 0.45, color: '#5b6fa8', label: false },
        { layer: 'R', mass: 'candleL', kind: 'lamp', x: 32.8, y: 31.2, hH: 1.3, label: false }, { layer: 'R', mass: 'candleR', kind: 'lamp', x: 42.2, y: 31.2, hH: 1.3, label: false },
        // G: the near floor and the near end of the carpet, south of the map edge (two bands in depth), and the two women who stand on them
        { layer: 'G', mass: 'nearFloor', kind: 'pillar', x: 37.5, y: 49.0, hH: 0.95, wH: 30, color: '#b8a47c', shadow: false, label: false, always: true }, { layer: 'G', mass: 'nearCarpet', kind: 'pillar', x: 37.5, y: 49.01, hH: 0.95, wH: 7.0, color: '#d9682a', shadow: false, label: false, always: true },
        { layer: 'R', mass: 'womanL', kind: 'pillar', x: 31.1, y: 49.05, hH: 0.9, wH: 0.4, color: '#c77fb8', label: false, always: true }, { layer: 'R', mass: 'womanR', kind: 'pillar', x: 43.9, y: 49.05, hH: 0.9, wH: 0.4, color: '#c77fb8', label: false, always: true },
        { layer: 'G', mass: 'nearFloor', kind: 'pillar', x: 37.5, y: 52.8, hH: 1.15, wH: 30, color: '#b8a47c', shadow: false, label: false, always: true }, { layer: 'G', mass: 'nearCarpet', kind: 'pillar', x: 37.5, y: 52.81, hH: 1.15, wH: 6.4, color: '#d9682a', shadow: false, label: false, always: true },
        // F: the dark bases that close the sides between the stone masses and the floor (the plateau of the filler on the left, the edge of the map on the right)
        { layer: 'F', mass: 'sideL', kind: 'pillar', x: 22.6, y: 36.0, hH: 2.2, wH: 1.7, color: '#3d3a3a', shadow: false, label: false }, { layer: 'F', mass: 'sideR', kind: 'pillar', x: 52.9, y: 36.0, hH: 2.7, wH: 2.4, color: '#3d3a3a', shadow: false, label: false, always: true },
        // P: the two huge grey stone masses that frame the shot (dark; they leave the frame at the bottom)
        { layer: 'P', mass: 'stoneL', kind: 'pillar', x: 26.2, y: 53.5, hH: 5.2, wH: 1.9, color: '#4f4f4f', shadow: false, label: false, always: true }, { layer: 'P', mass: 'stoneR', kind: 'pillar', x: 48.8, y: 53.5, hH: 5.2, wH: 1.9, color: '#4f4f4f', shadow: false, label: false, always: true }
      ],
      volumes: [],
      ribbon: [ // G: the light tiled floor (rows of the valley), the orange carpet from the map edge to the dais, the dark inlay strips beside the columns
        ...[31, 33].map((y) => ({ part: 'floor', pts: [[24.5, y], [51.5, y]], wH: 1.0, color: '#b8a47c' })), ...[35, 37, 39, 41, 43, 45].map((y) => ({ part: 'floor', pts: [[11.5, y], [51.5, y]], wH: 1.0, color: '#b8a47c' })),
        { part: 'inlay', pts: [[24.4, 30.6], [24.4, 39.0]], wH: 0.5, color: '#3d3a3a' }, { part: 'inlay', pts: [[50.6, 30.6], [50.6, 39.0]], wH: 0.5, color: '#3d3a3a' },
        { part: 'carpet', pts: [[37.5, 32.6], [37.5, 45.6]], wH: 7.0, color: '#d9682a' }
      ] }));
    stg.examples.push(Object.assign({}, base, { id: 'mockt_z14', label: 'Room 14 · orientation (mock T Z)', roomSet: [14], objects: [], volumes: [] }), Object.assign({}, base, { id: 'mockt_x44', label: 'Room 44 · orientation (mock T X)', roomSet: [44], objects: [], volumes: [] }));
  }
  E.modes = { PROTOS, MODES, IDS, COMMON, SOURCES, CAMS, OVERLAYS, DIAGNOSTICS, TERRAIN_MAIN, byId, plan, refresh, resetFolds, docs };
})(typeof window !== 'undefined' ? (window.EVO = window.EVO || {}) : (globalThis.EVO = globalThis.EVO || {}));
