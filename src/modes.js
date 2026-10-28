/* EvoDun crystal viewer - MODES TABLE (the UI pass, PR 1): one mode per crystallizer. The single source of truth for the mode selector, its examples (the old scenarios), the cameras and techniques it offers,
   which controls it shows and which blocks of the common area apply (docs/ui-modes.md sections 3-5). docs/modes.md is GENERATED from this table (tools/gen_modes_doc.js, run by tools/build.py);
   tools/test_modes.js checks that it is in sync and consistent with the controls table (src/controls.js).
   This layer only shows / hides existing controls and sets existing parameters: it never changes a shape, a render or a crystallizer.
   RULES: a control that does not belong to the current mode (nor to the common area) is HIDDEN (class `mh`), not greyed; inside a mode the requirements of src/controls.js still apply (greyed + "Requires: ...").
   ADVANCED controls (and the terrain controls in the modes that fold them) are folded behind a toggle of their group. The test-only flag `window.EVO_NO_MODES` (set by tools/ui/common.js) skips this layer: the whole panel as before. */
(function (E) {
  const CAMS = ['isoE', 'isoW', 'oblique', 'low', 'top', 'stage', 'classic'];
  /* the built-in sources an example may name (the ids of the source selector; 'image' = the user's images) */
  const SOURCES = ['snake_surface', 'snake', 'shrine_pier', 'shrine_pier_x4', 'noise', 'real_map', 'snake_floors', 'snake_macroform', 'image'];
  const TERRAIN_MAIN = ['terraces', 'subs', 'terH', 'spread', 'stairW', 'stairStyle', 'rampDepth', 'smooth', 'radius'];
  const SHARED = ['outlines', 'gradient', 'rampLines', 'dress', 'panCache'], OVERLAYS = ['features', 'markers', 'zones', 'edges', 'masks', 'veil', 'border'], DIAGNOSTICS = ['regions', 'passes', 'edgeWarn'];
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
      purpose: 'The Stage: Cam 6 perspective, technique B and the Art contract (body, wrapper, footprint, props), as it stands.', banner: 'IN REDESIGN: frozen as it is; the Stage waits for its own design pass.',
      examples: [
        { id: 'x4_stage', label: 'Shrine-Pier x4 · Stage', src: 'shrine_pier_x4', stage: true, contract: true },
        { id: 'diorama31_stage', label: 'Diorama 31 · Stage', src: 'real_map', rooms: true, preset: 'balanced', room: 31, stage: true, terraces: 3, contract: true }
      ],
      camera: 'stage', cameras: CAMS, tech: 'B', techs: ['B'], compare: false, compareDefault: false,
      main: ['contract'], advanced: [], slice: [], fixed: [], terrain: 'folded',
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
  E.modes = { PROTOS, MODES, IDS, COMMON, SOURCES, CAMS, OVERLAYS, DIAGNOSTICS, TERRAIN_MAIN, byId, plan, refresh, resetFolds, docs };
})(typeof window !== 'undefined' ? (window.EVO = window.EVO || {}) : (globalThis.EVO = globalThis.EVO || {}));
