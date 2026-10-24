/* UI wiring */
(function (E) {
  const $ = (s) => document.querySelector(s);
  const P = { ascCut: 0.15, ascGate: 0, ascRouteFaces: null, ascRouteKey: '', chainExtra: 3, cakeCut: 'off', dioChain: 'off', dioPlan: null, anchors: false, anchorH: 0.5, terraces: 5, subs: 3, terH: 1.0, spread: 1, spreadCentre: 'largest', curves: 'ordered', wallPass: 't3', wallExtrude: 0.25, wallStrata: 3, wallColumn: 1.2, t2Spacing: 0.9, t2Rows: 6, t2Group: 1.0, t2Jitter: 0.4, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, tread: 2, stairW: 3, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3, margin: 24, rooms: false, ascWalls: false, ascHeight: 1.5, pocket: false, pocketFraming: 'auto', pocketHeight: 2.5, backdrop: false, backdropGap: 0, backdropHeight: 2, roomsMinCore: 20, roomsCross: 10, roomsIsoLimit: 100, rRadius: 9, cake: false, cakeLayers: 3, cakeStep: 0.3, cakePer: 1, cakeSeam: 5 };
  const O = { gateMarks: true, outlines: true, gradient: true, features: true, regions: false, veil: true, border: true, markers: true, rampLines: true, passes: false, roomBorders: true, dioOutline: false, roomTint: false, typeTint: false, contract: false, dress: false, nowalk: true, edgeWarn: true, zones: false, edges: false, masks: false };
  /* CAMERA BANK (a fixed, discrete set: nothing custom; every crystallizer uses it). The ids are the old preset ids (tests and the manifest use them); `cam` is the number shown. kind: ortho (yaw / pitch),
     persp (Cam 6 Stage, FOV 30, true division by depth) or oblique (Cam 7 Classic 3/4: ground scale 1, height scale 1, no pitch). */
  const PRESETS = [
    { id: 'isoE', cam: 1, label: 'Cam 1', title: 'Cam 1 · Iso 45° (orthographic, yaw 45, pitch 35)', yaw: 45, pitch: 35, kind: 'ortho' },
    { id: 'isoW', cam: 2, label: 'Cam 2', title: 'Cam 2 · Iso −45° (orthographic, yaw −45, pitch 35)', yaw: -45, pitch: 35, kind: 'ortho' },
    { id: 'oblique', cam: 3, label: 'Cam 3', title: 'Cam 3 · Oblique 50° (orthographic, yaw 0)', yaw: 0, pitch: 50, kind: 'ortho' },
    { id: 'low', cam: 4, label: 'Cam 4', title: 'Cam 4 · Low 28° (orthographic, yaw 0)', yaw: 0, pitch: 28, kind: 'ortho' },
    { id: 'top', cam: 5, label: 'Cam 5', title: 'Cam 5 · Top 80° (orthographic, yaw 0)', yaw: 0, pitch: 80, kind: 'ortho' },
    { id: 'stage', cam: 6, label: 'Cam 6', title: 'Cam 6 · Stage (perspective, FOV 30, pitch 25, yaw 0)', yaw: 0, pitch: 25, kind: 'persp' },
    { id: 'classic', cam: 7, label: 'Cam 7', title: 'Cam 7 · Classic 3/4 (oblique projection, ground scale 1, height scale 1)', yaw: 0, pitch: 0, kind: 'oblique' }
  ];
  const MACRO_NAMES = { exterior: 'Exterior', quad: 'Quadrant removed', interior: 'Interior only', cut: 'Horizontal cut' };
  const SLIDERS = [
    ['Shaping', [['terraces', 'Terraces', 2, 24, 1], ['subs', 'Sub-terraces / terrace', 1, 6, 1], ['terH', 'Terrace height', 0.4, 10, 0.05], ['spread', 'Height spread (1 = uniform)', 1, 3, 0.05], ['subH', 'Sub-terrace height', 0.05, 0.5, 0.01], ['minPlateau', 'Min plateau (tiles)', 1, 300, 1], ['minSub', 'Min sub-terrace patch', 1, 12, 1], ['pre', 'Pre-smooth', 0, 3, 1]]],
    ['Wall pass (technique C)', [['wallExtrude', 'Wall extrusion', 0.10, 0.40, 0.01], ['wallStrata', 'T3 · Strata per terrace', 2, 4, 1], ['wallColumn', 'T3 · Column spacing (tiles)', 0.8, 2.0, 0.1], ['t2Spacing', 'T2 · Lateral spacing (tiles)', 0.6, 1.5, 0.05], ['t2Rows', 'T2 · Height passes', 5, 10, 1], ['t2Group', 'T2 · Group width (tiles)', 0.6, 2.0, 0.1], ['t2Jitter', 'T2 · Jitter', 0, 0.6, 0.05]]],
    ['Technique A / B', [['smooth', 'A · Chaikin passes', 0, 4, 1], ['radius', 'B · Field blur (tiles)', 0, 2.5, 0.1]]],
    ['Passes', [['climb', 'Climb limit, sub-terraces (provisional)', 1, 5, 1], ['gateThr', 'Gate slope threshold', 0, 0.3, 0.005], ['gateMin', 'Min gate size, tiles', 1, 20, 1], ['passGap', 'Stair spacing (long gates)', 3, 20, 1], ['stairStyle', 'Style: 0 steps · 1 ramp', 0, 1, 1], ['rampDepth', 'Ramp depth, tiles (fixed)', 1, 4, 1], ['tread', 'Tread rise, sub-terraces (steps only)', 1, 5, 1], ['stairW', 'Stair / ramp width, tiles (0 = none; steps use up to 3)', 0, 5, 1]]],
    ['Rooms', [['roomsMinCore', 'Min core size, tiles', 5, 250, 1], ['rRadius', 'Room radius, tiles', 3, 30, 1], ['anchorH', 'Anchor height, terraces (non-walkable raised)', 0.25, 2, 0.05], ['chainExtra', 'Chain: extra rooms per leg (N)', 0, 8, 1], ['roomsCross', 'Gate crossing cost, tiles', 0, 40, 1], ['roomsIsoLimit', 'Isolated limit, tiles', 20, 1000, 1], ['cakeLayers', 'Cake · rings (layers)', 1, 10, 1], ['cakeStep', 'Cake · ring step (x terrace height)', 0.1, 0.6, 0.05], ['cakePer', 'Cake · tiles per ring', 1, 3, 1], ['cakeSeam', 'Cake · seam window (bowl), tiles', 2, 12, 1], ['pocketHeight', 'Pocket height (decoration relief x)', 1, 4, 0.1], ['ascHeight', 'Ascension wall height (absolute)', 0.5, 3, 0.1], ['ascCut', 'Wall cut height (camera-facing walls)', 0.15, 3, 0.05], ['ascGate', 'Gate width, tiles (0 = every transition open)', 0, 5, 1]]],
    ['Slice', [['margin', 'Scenery margin (tiles)', 0, 128, 1]]]
  ];
  const TOGGLES = [['outlines', 'Outlines'], ['gradient', 'Cliff gradient'], ['features', 'Water / snake / cave'], ['markers', 'Landmarks'], ['rampLines', 'Ramp cross lines'], ['regions', 'Walk regions'], ['passes', 'Stair marks'], ['roomBorders', 'Room borders (rooms on)'], ['dioOutline', 'Diorama footprint outline (rooms on)'], ['gateMarks', 'Gate markers (chain view)'], ['typeTint', 'Room type tint (Cake orange / Diorama green / Ascension blue)'], ['roomTint', 'Room tint (rooms on)'], ['nowalk', 'Not walkable tone (rooms on)'], ['edgeWarn', 'Edge-problem outline (rooms on)'], ['veil', 'Veil outside the slice'], ['border', 'Slice border line'], ['zones', 'Zones (from roles)'], ['edges', 'Edge map (from roles)'], ['masks', 'Path / vegetation / POI'], ['contract', 'Art contract (Stage placeholders: body, wrapper, footprint, props)'], ['dress', 'Wall dressing (strata, lip, foot, base rocks; Box, A, B, C)']];
  const WALL_KEYS = new Set(['wallExtrude', 'wallStrata', 'wallColumn', 't2Spacing', 't2Rows', 't2Group', 't2Jitter']);
  const TECH = [['box', 'Box'], ['A', 'A · Contour'], ['B', 'B · Distance'], ['C', 'C · Curves']], ALL_TECH = TECH.map((t) => t[0]);

  const packs = {};
  const inc = { stake: null, objectives: [], mode: null }; // marks in tiles of the WHOLE map
  const NO_MODES = !!window.EVO_NO_MODES; // test-only flag (tools/ui/common.js): the whole panel as before the modes layer
  const st = { dacAuto: true, dacShow: 'all', dacView: 'chain', roomRule: 'v164', modeId: null, exampleId: null, floors: 'single', layer: 0, macro: 'off', macroFloor: 1, pack: 'snake_surface', mode: 'compare', fitSc: 0, tech: 'A', preset: 'oblique', zoom: 1, yawOff: 0, pitchOff: 0, panX: 0, panY: 0 };
  let S = null, raf = 0, drawToken = 0;

  function setPack(id, label, pack) {
    packs[id] = { label, pack };
    let o = [...$('#src').options].find((x) => x.value === id);
    if (!o) { o = document.createElement('option'); o.value = id; $('#src').appendChild(o); }
    o.textContent = label;
  }
  /* the REAL MAP built in: the PNG of data/samples/ (embedded as base64 in data/packs.js) goes through the SAME path as a loaded file: E.decodePng -> E.imageChannels -> E.packFromRoles (elevation = channel V, no maxnode),
     so the numbers equal tools/real_pack.js (tools/test_realmap_pack.js). Decoded once, on the first selection. */
  async function realMapPack() {
    const b = atob(window.EVO_REAL_PNG), u = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) u[k] = b.charCodeAt(k);
    return E.packFromPng(u.buffer, 'skeleton_heightmap_256.png');
  }
  /* choose a source: the built-in real map is decoded on its first selection; a built-in pack may declare its viewer block (floors: terraces 5 and minPlateau 5); a crop belongs to one map */
  async function selectSource(id) {
    if (id === 'real_map' && !packs.real_map.pack) { message('Decoding the real map…'); try { packs.real_map.pack = await realMapPack(); message(''); } catch (err) { message(err.message); $('#src').value = st.pack; return false; } }
    $('#src').value = id; st.pack = id;
    const vk = packs[st.pack] && packs[st.pack].pack && packs[st.pack].pack.viewer; if (vk) applyViewerBlock(vk);
    for (const c of cropIds) $('#' + c).value = '';
    onPackChanged(); refreshMessage(); invalidate(true); return true;
  }
  /* SCENARIOS (user's decision): one click that only SETS existing parameters (like ROOMS_PRESETS): source, preset, switches, room chip, technique, camera. No logic of its own. */
  const SCENARIOS = [
    { id: 'real_default', label: 'Real map · Default', src: 'real_map', rooms: true, preset: 'default' },
    { id: 'real_balanced', label: 'Real map · Balanced types', src: 'real_map', rooms: true, preset: 'balanced' },
    { id: 'pocket31', label: 'Pocket · Diorama 31', src: 'real_map', rooms: true, preset: 'balanced', pocket: true, room: 31, cam: 'isoE' },
    { id: 'x4_stage', label: 'Shrine-Pier x4 · Stage', src: 'shrine_pier_x4', stage: true, contract: true },
    { id: 'snake_curves', label: 'Snake surface · Curves C', src: 'snake_surface', tech: 'C', cam: 'oblique' },
    { id: 'snake_floors', label: 'Snake · Floors', src: 'snake_floors', cam: 'isoE' },
    { id: 'snake_macro', label: 'Snake · Macroform', src: 'snake_macroform', cam: 'isoE', tech: 'box', macro: 'exterior' }
  ];
  /* FRAMING BY ROOM TYPE (mode 2, docs/ui-modes.md U10): one framing per room type, never mixed. It only SETS the three existing switches (P.cake, P.ascWalls, P.pocket) from the type of the chosen rooms; no renderer, shape or P default changes.
     One room: only its type's framing; several rooms: the union; none (Whole map): all three, each acting only on the rooms of its own type. Types come from the cached whole-map classification (S.types);
     `declared` = the type an example names, used on the first application when the new source / preset has no classification yet (draw() re-runs the rule once with the real types). Returns true when a switch changed. */
  const dacOn = () => !NO_MODES && st.modeId === 'rooms' && !!st.dacAuto;
  function applyDacRule(declared) {
    if (!dacOn()) return false;
    const RT = E.roomTypes, nameOf = (t) => (t === RT.CAKE ? 'cake' : t === RT.ASCENSION ? 'ascension' : t === RT.DIORAMA ? 'diorama' : null), want = new Set();
    const whole = !sliceSel.rooms.size, show = whole ? st.dacShow : 'all'; // "Show framing" (U11): only the whole-map branch; with rooms chosen the room types decide
    if (whole) { if (show === 'all' || show === 'cake') want.add('cake'); if (show === 'all' || show === 'ascension') want.add('ascension'); if (show === 'all' || show === 'diorama') want.add('diorama'); }
    else for (const id of sliceSel.rooms) { const o = S && S.types && S.types.rooms.get(id), n = declared && sliceSel.rooms.size === 1 ? declared : o ? nameOf(o.type) : null; if (n) want.add(n); }
    const next = { cake: want.has('cake'), ascWalls: want.has('ascension'), pocket: want.has('diorama') }, ids = { cake: 't-cake', ascWalls: 't-ascWalls', pocket: 't-pocket' };
    let changed = false;
    for (const k of Object.keys(next)) { if (!!P[k] !== next[k]) changed = true; P[k] = next[k]; const el = $('#' + ids[k]); if (el) el.checked = next[k]; }
    return changed;
  }
  /* "Show framing" ISOLATES the view (U11), in the selector's own handler only (the other callers of the rule never touch the Display toggles, and nothing re-forces them on a later redraw: the user can toggle any of them back by hand):
     a single type -> the type tint, the room borders and the footprint outline all off, except diorama, which turns the outline ON (a Pocket is drawn only for a chosen room, so without it that view shows nothing); All -> the look of the default example (tint and outline on, room borders as they are). FULL isolation: with the outline on in every view, Cake and Diorama were almost indistinguishable at whole-map scale and the outline state depended on history. */
  function dacIsolate(show) {
    const set = (k, id, v) => { O[k] = v; const el = $('#' + id); if (el) el.checked = v; };
    if (show === 'all') { set('typeTint', 't-typeTint', true); set('dioOutline', 't-dioOutline', true); return; }
    set('typeTint', 't-typeTint', false); set('roomBorders', 't-roomBorders', false); set('dioOutline', 't-dioOutline', show === 'diorama');
  }
  async function applyScenario(sc, mode) { // mode (optional, the modes layer): the example of a mode; without it this is the old scenario button, unchanged
    if (sc.src && !(await selectSource(sc.src))) return;
    P.chainIds = null; P.chainSeqs = null; P.chainGoals = null; P.dioPlan = null; P.chainKey = ''; P.chainTypes = null; P.chainBlocked = null; P.chainFail = ''; P.chainInfo = null; // the chain view belongs to the state of mode 2 (D23): an example starts without one, draw() derives it from the routes
    const tick = (id, v) => { const el = $('#' + id); if (el) el.checked = v; };
    // the base every scenario starts from (so the same click always gives the same state): the defaults of the parameters the scenarios touch
    setParam('terraces', 5); setParam('spread', 1); setParam('minPlateau', 5); P.spreadCentre = 'largest'; P.cake = false; P.ascWalls = false; O.contract = false; tick('t-cake', false); tick('t-ascWalls', false); tick('t-contract', false);
    st.tech = mode ? mode.tech : 'A'; st.mode = !mode || mode.compareDefault ? 'compare' : 'single'; st.preset = mode ? mode.camera : 'oblique'; st.yawOff = st.pitchOff = st.panX = st.panY = 0; st.zoom = 1; st.floors = 'single'; st.layer = 0; st.macro = sc.macro || 'off'; st.macroFloor = 1;
    P.rooms = !!sc.rooms || !!(mode && mode.fixed.includes('t-rooms')); tick('t-rooms', P.rooms); P.pocket = !!sc.pocket; tick('t-pocket', P.pocket);
    if (sc.preset) applyRoomsPreset(sc.preset);
    sliceSel.rooms.clear(); if (sc.room) { sliceSel.whole = false; sliceSel.rooms.add(sc.room); } else sliceSel.whole = true;
    if (sc.stage) $('#stagePreset').click(); // the Stage preset sets Cam 6, B, single view, terraces 7, spread 1.5
    if (sc.terraces) setParam('terraces', sc.terraces); // after the Stage preset (an example may keep fewer terraces: the rooms change with them)
    if (sc.contract) { O.contract = true; tick('t-contract', true); }
    if (sc.cam) st.preset = sc.cam;
    if (sc.tech) { st.tech = sc.tech; st.mode = 'single'; }
    if (mode && sc.src !== 'image') { inc.stake = null; inc.objectives = []; setIncMode(null); } // marks belong to the example that placed them: they do not leak into the next example or mode (they would on the same source, onPackChanged does not run); loaded images keep the marks of their manifest
    if (mode && mode.id === 'rooms') { // an example of mode 2 starts with the rule on (the declared type: the new source has no classification yet), the selector on All, and its own tint / outline / marks
      O.typeTint = !!sc.tint; O.dioOutline = !!sc.outline; O.roomBorders = true; tick('t-typeTint', O.typeTint); tick('t-dioOutline', O.dioOutline); tick('t-roomBorders', true); // the mode's base Display state (room borders are on by default in the code: O.roomBorders = true), so re-clicking an example always gives the same look
      if (sc.stake) inc.stake = { x: sc.stake.x, y: sc.stake.y }; if (sc.objectives) inc.objectives = sc.objectives.map((o) => Object.assign({}, o));
      st.dacShow = 'all'; const ds = $('#dacShow'); if (ds) ds.value = 'all';
      st.dacView = sc.view || 'chain'; const dv = $('#dacView'); if (dv) dv.value = st.dacView; st.roomRule = 'v164'; const rr = $('#roomRule'); if (rr) rr.value = 'v164'; setParam('ascCut', MODE2_DEF.ascCut); setParam('ascGate', MODE2_DEF.ascGate); setParam('chainExtra', 3); P.cakeCut = 'off'; const cc = $('#cakeCut'); if (cc) cc.value = 'off'; P.dioChain = MODE2_DEF.dioChain; const dcc = $('#dioChain'); if (dcc) dcc.value = P.dioChain; // the default of mode 2 is the Chain view (D23); D31: with the Diorama in chain view M2, the Ascension gate width 3 and the wall cut height 0.5 (mode 2 ONLY)
      st.dacAuto = true; const da = $('#dacAuto'); if (da) da.checked = true; applyDacRule(sc.type);
    }
    else if (mode) { setParam('ascCut', LEGACY_DEF.ascCut); setParam('ascGate', LEGACY_DEF.ascGate); P.dioChain = LEGACY_DEF.dioChain; const dcl = $('#dioChain'); if (dcl) dcl.value = P.dioChain; } // the other modes keep today's values (and pixels)
    syncChips(); syncRoomChips(); refreshMessage(); invalidate(true);
  }
  function message(text) { const m = $('#msg'); m.textContent = text || ''; m.hidden = !text; }

  /* rooms presets (user's decision): they only SET existing parameters, no logic. Balanced types = the generator's parameters that even out Cake / Diorama / Ascension (real map: 29 / 30 / 29 of 88 rooms, 48 ramps) */
  const ROOMS_PRESETS = { default: { terraces: 5, roomsMinCore: 20, rRadius: 9, minPlateau: 5 }, balanced: { terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 } };
  function setParam(k, v) { P[k] = v; const i = $('#s-' + k), o = $('#o-' + k); if (i) i.value = v; if (o) o.textContent = v; }
  function syncRoomsPreset() {
    const sel = $('#roomsPreset'); if (!sel) return;
    sel.value = Object.keys(ROOMS_PRESETS).find((n) => Object.entries(ROOMS_PRESETS[n]).every(([k, v]) => P[k] === v)) || 'custom';
  }
  function applyRoomsPreset(name) { for (const [k, v] of Object.entries(ROOMS_PRESETS[name])) setParam(k, v); syncRoomsPreset(); }
  const MODE2_DEF = { dioChain: 'm2', ascGate: 3, ascCut: 0.5 }, LEGACY_DEF = { dioChain: 'off', ascGate: 0, ascCut: 0.15 }; // D31: the defaults of mode 2 (announced) and the values of every other mode / the legacy panel / a manifest that does not name them
  function viewerBlock() { const b = { preset: ($('#roomsPreset') || {}).value || 'custom', rooms: !!P.rooms, cake: !!P.cake, terraces: P.terraces, roomsMinCore: P.roomsMinCore, rRadius: P.rRadius, minPlateau: P.minPlateau }; if (st.preset !== 'oblique') b.camera = st.preset; if (!NO_MODES && st.modeId) b.mode = st.modeId; if (!NO_MODES && st.modeId === 'rooms') { b.dacAuto = !!st.dacAuto; if (st.dacShow !== 'all') b.dacShow = st.dacShow; b.dacView = st.dacView; if (P.chainExtra !== 3) b.chainExtra = P.chainExtra; if (st.roomRule !== 'v164') b.roomRule = st.roomRule; if (P.cakeCut !== 'off') b.cakeCut = P.cakeCut; b.dioChain = P.dioChain; b.ascCut = P.ascCut; b.ascGate = P.ascGate; /* D31: written ALWAYS in mode 2 (explicit values): an absent key in a loaded manifest means the OLD values (Off / 0.15 / 0), not the new mode-2 defaults */ if (P.anchors) b.anchors = true; if (P.anchorH !== 0.5) b.anchorH = P.anchorH; } if (P.curves !== 'ordered') b.curves = P.curves; for (const k of ['wallPass', ...WALL_KEYS]) if (P[k] !== E.wallc.DEF[k]) b[k] = P[k]; return b; } // only the values that are not the default, so a pack saved before the wall pass is unchanged // camera: written only when it is not the default (Cam 3), so a pack saved before the bank is unchanged
  function applyViewerBlock(v) { // manifest -> viewer (absent fields keep the defaults, so a pack without the block loads as before)
    const d = { rooms: false, cake: false, terraces: 5, roomsMinCore: 20, rRadius: 9, minPlateau: 5 }, w = Object.assign({}, d, v || {});
    P.rooms = !!w.rooms; P.cake = !!w.cake; const tr = $('#t-rooms'), tc = $('#t-cake'); if (tr) tr.checked = P.rooms; if (tc) tc.checked = P.cake;
    for (const k of ['terraces', 'roomsMinCore', 'rRadius', 'minPlateau']) setParam(k, w[k]);
    setParam('chainExtra', w.chainExtra !== undefined ? w.chainExtra : 3); setParam('ascCut', w.ascCut !== undefined ? w.ascCut : 0.15); setParam('ascGate', w.ascGate !== undefined ? w.ascGate : 0); st.roomRule = w.roomRule === 'route' ? 'route' : 'v164'; const rru = $('#roomRule'); if (rru) rru.value = st.roomRule; P.cakeCut = ['quadrant', 'half'].includes(w.cakeCut) ? w.cakeCut : 'off'; const ccu = $('#cakeCut'); if (ccu) ccu.value = P.cakeCut; P.dioChain = ['m1', 'm2'].includes(w.dioChain) ? w.dioChain : 'off'; const dcu = $('#dioChain'); if (dcu) dcu.value = P.dioChain; // absent = 3, V16.4, Off
    P.anchors = w.anchors === true; const tan = $('#t-anchors'); if (tan) tan.checked = P.anchors; setParam('anchorH', w.anchorH !== undefined ? w.anchorH : 0.5); // absent = off, 0.5
    st.dacView = w.dacView === 'chain' ? 'chain' : 'whole'; const dvw = $('#dacView'); if (dvw) dvw.value = st.dacView; // absent = the whole map (a manifest saved before the Chain view)
    st.dacShow = ['cake', 'ascension', 'diorama'].includes(w.dacShow) ? w.dacShow : 'all'; const dsh = $('#dacShow'); if (dsh) dsh.value = st.dacShow; // absent = All
    st.dacAuto = w.dacAuto === true; const dac = $('#dacAuto'); if (dac) dac.checked = st.dacAuto; // absent = off (a manifest saved before the rule keeps the switches it stored)
    if (!NO_MODES && (w.mode || st.modeId) === 'rooms' && st.dacAuto && st.dacShow !== 'all') dacIsolate(st.dacShow); // the Display toggles are not in the manifest: a saved single-type view must load isolated (a Diorama view needs its outline); only while the rule is on (with it off the selector has no effect); absent or All touches nothing
    syncRoomsPreset();
    st.preset = PRESETS.some((x) => x.id === w.camera) ? w.camera : 'oblique'; st.yawOff = st.pitchOff = 0; // absent = the default camera
    P.curves = E.curves.PRESETS[w.curves] ? w.curves : 'ordered'; const cs = $('#curvesPreset'); if (cs) cs.value = P.curves; // absent = Ordered
    P.wallPass = ['t3', 't2', 'off'].includes(w.wallPass) ? w.wallPass : E.wallc.DEF.wallPass; const wsel = $('#wallPass'); if (wsel) wsel.value = P.wallPass; for (const k of WALL_KEYS) setParam(k, w[k] !== undefined ? w[k] : E.wallc.DEF[k]); // absent = the defaults
  }

  function build() {
    const sl = $('#sliders');
    for (const [title, list] of SLIDERS) {
      const h = document.createElement('h3'); h.textContent = title; sl.appendChild(h);
      if (title === 'Rooms') { // the switch: off, the viewer is the one without rooms (gates by terrace)
        const l = document.createElement('label'); l.className = 'tg'; l.innerHTML = '<input type="checkbox" id="t-rooms"><span>Rooms (watershed rooms, cores, tree)</span>';
        const i = l.querySelector('input'); i.checked = P.rooms; i.addEventListener('change', () => { P.rooms = i.checked; refreshMessage(); invalidate(true); }); sl.appendChild(l);
        const ld = document.createElement('label'); ld.className = 'tg'; ld.innerHTML = '<input type="checkbox" id="dacAuto"><span>Framing by room type</span>';
        const id_ = ld.querySelector('input'); id_.checked = st.dacAuto; if (NO_MODES) ld.hidden = true; // the panel without modes has no such switch
        id_.addEventListener('change', () => { st.dacAuto = id_.checked; if (st.dacAuto) applyDacRule(); refreshMessage(); invalidate(st.dacAuto); }); sl.appendChild(ld);
        const lsh = document.createElement('label'); lsh.className = 'sl'; lsh.innerHTML = '<span>Show framing (whole map)</span><select id="dacShow"><option value="all">All</option><option value="cake">Cake</option><option value="ascension">Ascension</option><option value="diorama">Diorama</option></select>';
        if (NO_MODES) lsh.hidden = true; // the panel without modes has no such selector
        lsh.querySelector('select').addEventListener('change', (e) => { st.dacShow = e.target.value; dacIsolate(st.dacShow); applyDacRule(); refreshMessage(); invalidate(true); }); sl.appendChild(lsh);
        const lvw = document.createElement('label'); lvw.className = 'sl'; lvw.innerHTML = '<span>DAC view</span><select id="dacView"><option value="chain">Chain</option><option value="whole">Whole map</option></select>';
        if (NO_MODES) lvw.hidden = true; // the panel without modes has no such selector
        lvw.querySelector('select').value = st.dacView; lvw.querySelector('select').addEventListener('change', (e) => { st.dacView = e.target.value; refreshMessage(); invalidate(true); }); sl.appendChild(lvw);
        const lrr = document.createElement('label'); lrr.className = 'sl'; lrr.innerHTML = '<span>Room type rule (chain)</span><select id="roomRule"><option value="v164">V16.4</option><option value="route">Along the route</option></select>';
        if (NO_MODES) lrr.hidden = true; lrr.querySelector('select').value = st.roomRule; lrr.querySelector('select').addEventListener('change', (e) => { st.roomRule = e.target.value; refreshMessage(); invalidate(true); }); sl.appendChild(lrr);
        const lcc = document.createElement('label'); lcc.className = 'sl'; lcc.innerHTML = '<span>Cake camera cut</span><select id="cakeCut"><option value="off">Off</option><option value="quadrant">Quadrant</option><option value="half">Half</option></select>';
        if (NO_MODES) lcc.hidden = true; lcc.querySelector('select').value = P.cakeCut; lcc.querySelector('select').addEventListener('change', (e) => { P.cakeCut = e.target.value; refreshMessage(); invalidate(true); }); sl.appendChild(lcc);
        const ldc = document.createElement('label'); ldc.className = 'sl'; ldc.innerHTML = '<span>Diorama in chain view</span><select id="dioChain"><option value="off">Off</option><option value="m2">M2 (the footprint moves)</option><option value="m1">M1 (region)</option></select>';
        if (NO_MODES) ldc.hidden = true; ldc.querySelector('select').value = P.dioChain; ldc.querySelector('select').addEventListener('change', (e) => { P.dioChain = e.target.value; refreshMessage(); invalidate(true); }); sl.appendChild(ldc);
        const lan = document.createElement('label'); lan.className = 'tg'; lan.innerHTML = '<input type="checkbox" id="t-anchors"><span>Non-walkable as anchors (raised, grey; needs Rooms)</span>';
        if (NO_MODES) lan.hidden = true; // mode 2 only (the panel without modes has no such checkbox)
        const ian = lan.querySelector('input'); ian.checked = !!P.anchors; ian.addEventListener('change', () => { P.anchors = ian.checked; refreshMessage(); invalidate(true); }); sl.appendChild(lan);
        const lc = document.createElement('label'); lc.className = 'tg'; lc.innerHTML = '<input type="checkbox" id="t-cake"><span>Cake rings (room type Cake; needs Rooms)</span>';
        const ic = lc.querySelector('input'); ic.checked = P.cake; ic.addEventListener('change', () => { P.cake = ic.checked; refreshMessage(); invalidate(true); }); sl.appendChild(lc);
        const lw = document.createElement('label'); lw.className = 'tg'; lw.innerHTML = '<input type="checkbox" id="t-ascWalls"><span>Ascension walls (thin walls on the blocking faces of Ascension rooms; needs Rooms)</span>';
        const iw = lw.querySelector('input'); iw.checked = !!P.ascWalls; iw.addEventListener('change', () => { P.ascWalls = iw.checked; refreshMessage(); invalidate(true); }); sl.appendChild(lw);
        const lk = document.createElement('label'); lk.className = 'tg'; lk.innerHTML = '<input type="checkbox" id="t-pocket"><span>Pocket view (a chosen Diorama room is drawn as its pocket; needs Rooms)</span>';
        const ik = lk.querySelector('input'); ik.checked = !!P.pocket; ik.addEventListener('change', () => { P.pocket = ik.checked; refreshMessage(); invalidate(true); }); sl.appendChild(lk);
        const lf = document.createElement('label'); lf.className = 'sl'; lf.innerHTML = '<span>Pocket framing</span><select id="pocketFraming"><option value="auto">Auto</option><option value="hill">Cerro</option><option value="lake">Lago</option><option value="falls">Cascada</option><option value="island">Isla</option><option value="drop">Caída</option></select>';
        lf.querySelector('select').value = P.pocketFraming; lf.querySelector('select').addEventListener('change', (e) => { P.pocketFraming = e.target.value; refreshMessage(); invalidate(true); }); sl.appendChild(lf);
        const lp = document.createElement('label'); lp.className = 'sl'; lp.innerHTML = '<span>Rooms preset</span><select id="roomsPreset"><option value="default">Default</option><option value="balanced">Balanced types</option><option value="custom">Custom</option></select>';
        lp.querySelector('select').addEventListener('change', (e) => { if (e.target.value === 'custom') return; applyRoomsPreset(e.target.value); invalidate(true); }); sl.appendChild(lp);
        const lg = document.createElement('div'); lg.className = 'row'; lg.innerHTML = '<button id="stagePreset" title="Stage preset: Cam 6 (perspective), technique B, terraces 7, height spread 1.5 around the middle terrace. It only sets existing parameters and the camera.">Stage preset</button>';
        lg.querySelector('button').addEventListener('click', () => { st.preset = 'stage'; st.yawOff = st.pitchOff = st.panX = st.panY = 0; st.zoom = 1; st.tech = 'B'; st.mode = 'single'; setParam('terraces', 7); setParam('spread', 1.5); setParam('spreadCentre', 'middle'); syncRoomsPreset(); invalidate(true); }); sl.appendChild(lg);
      }
      if (title === 'Wall pass (technique C)') { // T3 (default, the Unexplored 2 look) / T2 (alternative, no fusion) / Off (the C of phase 1); compare shows the band only in C: Off gives the like-for-like view
        const lw = document.createElement('label'); lw.className = 'tg'; lw.innerHTML = '<span>Wall pass</span><select id="wallPass"><option value="t3">T3 · Strata blocks</option><option value="t2">T2 · Voronoi blocks</option><option value="off">Off</option></select>';
        lw.querySelector('select').value = P.wallPass; lw.querySelector('select').addEventListener('change', (e) => { P.wallPass = e.target.value; invalidate(false); }); sl.appendChild(lw);
      }
      if (title === 'Shaping') { // technique C: the preset of the displacement rules (Ordered E / Balanced D / Natural F)
        const lc = document.createElement('label'); lc.className = 'tg'; lc.innerHTML = '<span>Curves preset (technique C)</span><select id="curvesPreset"><option value="ordered">Ordered</option><option value="balanced">Balanced</option><option value="natural">Natural</option></select>';
        lc.querySelector('select').value = P.curves; lc.querySelector('select').addEventListener('change', (e) => { P.curves = e.target.value; invalidate(false); }); sl.appendChild(lc);
      }
      for (const [k, label, mn, mx, step] of list) {
        const row = document.createElement('label'); row.className = 'sl';
        row.innerHTML = `<span>${label}</span><output id="o-${k}"></output><input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${step}">`;
        if (NO_MODES && (k === 'anchorH' || k === 'chainExtra' || k === 'ascCut' || k === 'ascGate')) row.hidden = true; // mode 2 only
        sl.appendChild(row);
        const inp = row.querySelector('input'), out = row.querySelector('output');
        inp.value = P[k]; out.textContent = P[k];
        inp.addEventListener('input', () => { out.textContent = inp.value; }); // label only while dragging
        inp.addEventListener('change', () => { P[k] = +inp.value; out.textContent = P[k]; syncRoomsPreset(); refreshMessage(); invalidate(!WALL_KEYS.has(k)); }); // recompute on release (the wall pass only redraws: its parameters are in the cache key)
      }
    }
    const tg = $('#toggles');
    for (const [k, label] of TOGGLES) {
      const l = document.createElement('label'); l.className = 'tg';
      l.innerHTML = `<input type="checkbox" id="t-${k}"><span>${label}</span>`;
      const i = l.querySelector('input'); i.checked = O[k];
      i.addEventListener('change', () => { O[k] = i.checked; invalidate(false); });
      tg.appendChild(l);
    }
    const sb = $('#scenarios .scn'); for (const sc of SCENARIOS) { const b = document.createElement('button'); b.textContent = sc.label; b.dataset.id = sc.id; b.addEventListener('click', () => applyScenario(sc)); sb.appendChild(b); }
    const pb = $('#presets');
    for (const p of PRESETS) {
      const b = document.createElement('button'); b.textContent = p.label; b.title = p.title; b.dataset.id = p.id;
      b.addEventListener('click', () => { const wasCam1 = st.preset === 'isoE'; st.preset = p.id; st.yawOff = 0; st.pitchOff = 0; st.panX = st.panY = 0; st.zoom = 1; invalidate(!!P.backdrop && wasCam1 !== (p.id === 'isoE')); }); // the floor backdrop is part of the shape and is composed for Cam 1 only: crossing into or out of Cam 1 rebuilds it
      pb.appendChild(b);
    }
    const tb = $('#techs');
    for (const [id, label] of TECH) {
      const b = document.createElement('button'); b.textContent = label; b.dataset.id = id;
      b.addEventListener('click', () => { st.tech = id; st.mode = 'single'; invalidate(false); });
      tb.appendChild(b);
    }
    $('#mode').addEventListener('click', () => { st.mode = st.mode === 'single' ? 'compare' : 'single'; invalidate(false); });
    $('#src').addEventListener('change', (e) => selectSource(e.target.value)); // a crop belongs to one map
    buildRoles();
    $('#wholeRooms').addEventListener('click', () => { sliceSel.rooms.clear(); sliceSel.whole = true; sliceSel.zones.clear(); applyDacRule(); syncChips(); syncRoomChips(); refreshMessage(); invalidate(true); });
    $('#wholeMap').addEventListener('click', () => { sliceSel.whole = true; sliceSel.zones.clear(); syncChips(); refreshMessage(); invalidate(true); });
    for (const id of cropIds) $('#' + id).addEventListener('change', () => { refreshMessage(); invalidate(true); });
    $('#file').addEventListener('change', (e) => loadFiles(e.target.files));
    for (const [id, k] of [['m-stake', 'stake'], ['m-obj', 'obj'], ['m-rm', 'rm']]) document.getElementById(id).addEventListener('click', () => setIncMode(inc.mode === k ? null : k));
    document.getElementById('m-clear').addEventListener('click', () => { inc.stake = null; inc.objectives = []; setIncMode(null); invalidate(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && inc.mode) setIncMode(null); });
    $('#reset').addEventListener('click', () => { st.yawOff = st.pitchOff = st.panX = st.panY = 0; st.zoom = 1; invalidate(false); });
    for (const k of ['backdropGap', 'backdropHeight']) { const inp = $('#s-' + k), out = $('#o-' + k); inp.value = P[k]; out.textContent = P[k]; inp.addEventListener('input', () => { out.textContent = inp.value; }); inp.addEventListener('change', () => { P[k] = +inp.value; out.textContent = P[k]; invalidate(true); }); } // the backdrop is part of the shape of the floor: recompute on release
    $('#t-backdrop').addEventListener('change', (e) => { P.backdrop = e.target.checked; invalidate(true); }); // the backdrop is part of the shape of the floor
    $('#macroView').addEventListener('change', (e) => { st.macro = e.target.value; buildMacroChips(); invalidate(false); }); // the volume view of crystallizer 6: only the draw changes (the shape of the exterior stays)
    $('#floorsView').addEventListener('change', (e) => { st.floors = e.target.value; invalidate(true); }); // single floor / exploded stack / cutaway (the shape of the primary layer changes)
    window.addEventListener('resize', () => invalidate(false));
    $('#stage').addEventListener('wheel', (e) => { e.preventDefault(); st.zoom = Math.max(0.5, Math.min(4, st.zoom * (e.deltaY < 0 ? 1.1 : 0.9))); invalidate(false); }, { passive: false });
    let drag = null;
    $('#stage').addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yo: st.yawOff, po: st.pitchOff, px: st.panX, py: st.panY, shift: e.shiftKey || e.button === 2 }; st.dragging = !drag.shift; e.currentTarget.setPointerCapture(e.pointerId); });
    $('#stage').addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (drag.shift) { st.panX = drag.px + dx; st.panY = drag.py + dy; }
      else { st.yawOff = Math.max(-20, Math.min(20, drag.yo + dx * 0.15)); st.pitchOff = Math.max(-15, Math.min(15, drag.po - dy * 0.15)); }
      invalidate(false);
    });
    $('#stage').addEventListener('pointerup', (e) => {
      const moved = drag ? Math.hypot(e.clientX - drag.x, e.clientY - drag.y) : 99, was = drag; drag = null;
      if (st.dragging) { st.dragging = false; if (E.hasFloors(packs[st.pack].pack) && st.floors === 'cut') invalidate(false); } // the cutaway plane follows the yaw: recomputed on release, not on every move
      if (inc.mode && was && !was.shift && e.button === 0 && moved < 4) clickMap(e);
      else if (!inc.mode && P.pocket && P.rooms && was && !was.shift && e.button === 0 && moved < 4) clickRoom(e);
    });
    $('#stage').addEventListener('dblclick', () => $('#reset').click());
    $('#stage').addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ---- incursion: stake, objectives, routes ---- */
  const incIdx = (m) => { // a mark (tile of the whole map) as a tile of the built window, or -1 when it is outside the window or the slice
    const x = m.x - S.ox, y = m.y - S.oy; if (x < 0 || y < 0 || x >= S.W || y >= S.H) return -1;
    let i = y * S.W + x; if (S.dioMove && S.dioMove.has(i)) i = S.dioMove.get(i); return !Number.isInteger(i) || S.block[i] ? -1 : i; // D30: a mark inside a Diorama that moved goes with its footprint // a mark from a manifest with a non-integer / NaN coordinate is outside, never a tile index
  };
  // a tile that belongs to a walkable region: isolated terrain and the forbidden margins of the rooms layer have region -1 (a mark can arrive on one from a manifest or after a parameter change; placeMark refuses a click there)
  const inRegion = (i) => !!S.region && Number.isInteger(S.region[i]) && S.region[i] >= 0;
  const noRegionWhy = (i) => (S.isolated && S.isolated[i] ? `isolated terrain (a walkable region under ${S.walkInfo ? S.walkInfo.limit : 'the limit of'} tiles)` : 'a tile that is not part of any walkable region (a margin of a wall, a cliff or a steep slope)');
  const regionName = (r) => `R${r + 1}`;
  /* a floors package (crystallizer 5): a mark belongs to the LAYER it was placed on (0 = the exterior, k = floor k); other packs keep marks without a layer (same pixels, same manifest) */
  const incFloors = () => !!(packs[st.pack] && E.hasFloors(packs[st.pack].pack)), curLayer = () => (st.floors === 'single' ? st.layer : 0);
  const onLayer = (m) => !incFloors() || (m.layer || 0) === curLayer();
  const layerName = (k) => (k ? `Floor ${k}` : 'the Exterior');
  /* The route as a SEQUENCE OF ROOMS (mode 2 only, appended after the usual incursion text; docs/ui-modes.md U11): walk the route stake first (E.route gives objective -> stake), skip the tiles with no room (roomMap 0), THEN collapse
     consecutive equal ids (a room visited twice, not consecutively, is listed twice). Every room is listed; only above ROUTE_CAP rooms the MIDDLE is elided, so the first (the stake's) and the last (the objective's) stay visible. */
  /* CHAIN VIEW (D23): on in mode 2 with the selector on Chain, the whole map (no room chosen) and the rooms layer on */
  const dacChainOn = () => !NO_MODES && st.modeId === 'rooms' && st.dacView === 'chain' && !!P.rooms && !sliceSel.rooms.size;
  const rlIds = new WeakMap(); let rlSeq = 0;
  function chainGoals() { // the stake tile, the SUB-OBJECTIVE tiles (the objectives before the last, in placement order; -1 = outside the window) and the FINAL goal tile (the last objective placed) as window indices (D29; D27's "the other objectives are not intermediate goals" is SUPERSEDED); null without the stake and the final goal on room terrain
    if (!S || !S.roomMap || !inc.stake || !inc.objectives.length) return null; const at = (m) => { const x = m.x - S.ox, y = m.y - S.oy; return x < 0 || y < 0 || x >= S.W || y >= S.H ? -1 : y * S.W + x; };
    const a = at(inc.stake), g = at(inc.objectives[inc.objectives.length - 1]); return a < 0 || g < 0 || !(S.roomMap[a] > 0) || !(S.roomMap[g] > 0) ? null : { stake: a, goal: g, subs: inc.objectives.slice(0, -1).map(at) };
  }
  function chainSig() { // what the chain depends on: the stake and the final goal, N, the type rule, the rooms layer and the ramp parameters (the graph is read from the WHOLE shape: a rebuilt chain shape is flattened and cannot be read again)
    const gs = chainGoals(); if (!gs || !S.rooms) return '';
    return [gs.stake, gs.subs.join('.'), gs.goal, P.chainExtra, P.chainNodes || '', st.roomRule, P.dioChain, st.pack, P.roomsMinCore, P.rRadius, P.minPlateau, P.roomsCross, P.terraces, P.stairW, P.rampDepth, P.stairStyle].join('|');
  }
  const ROUTE_CAP = 30, ROUTE_KEEP = 10;
  const roomsView = () => !NO_MODES && st.modeId === 'rooms' && !!(S && S.roomMap && S.types);
  function routeRoomIds(route) { const seq = []; for (let k = route.length - 1; k >= 0; k--) { const id = S.roomMap[route[k]]; if (!id) continue; if (seq.length && seq[seq.length - 1] === id) continue; seq.push(id); } return seq; }
  function fmtRoomSeq(ids) {
    const T = E.roomTypes, lab = (id) => { const o = S.types.rooms.get(id); return (o ? (o.type === T.CAKE ? 'Cake' : o.type === T.DIORAMA ? 'Dio' : 'Asc') : 'Room') + ' ' + id; };
    return (ids.length > ROUTE_CAP ? [...ids.slice(0, ROUTE_KEEP).map(lab), `... (+${ids.length - 2 * ROUTE_KEEP})`, ...ids.slice(-ROUTE_KEEP).map(lab)] : ids.map(lab)).join(' > ');
  }
  const routeRoomsLine = (n, route) => { const ids = routeRoomIds(route); return `Route ${n} (${route.length} tiles, ${ids.length} room${ids.length === 1 ? '' : 's'}), stake first: ${fmtRoomSeq(ids)}`; };
  function chainRouteOf(i, stake) { // the chain route up to the goal at tile i (null: not the chain view, no chain route, or this objective is not a goal of the chain: the shortest route is drawn)
    if (!S || !S.chain || !P.chainSeqs || !P.chainGoals) return null; const cr = E.roomTypes.chainRoute(S, P); if (!cr || cr.fail) return null;
    const j = cr.goals.indexOf(i); if (j < 1 || cr.goals[0] !== stake || cr.goalIdx[j] < 0) return null; return cr.path.slice(0, cr.goalIdx[j] + 1).reverse();
  }
  function computeIncursion() {
    const out = { stake: null, objectives: [], lines: [], roomLines: [] }, fl = incFloors();
    if (!S) return out;
    const gone = (name, m) => (fl ? `${name}: on ${layerName(m.layer || 0)}, not shown here.` : null);
    const stakeHere = inc.stake && onLayer(inc.stake), stake = stakeHere ? incIdx(inc.stake) : -1;
    if (inc.stake && !stakeHere) out.lines.push(gone('Stake', inc.stake));
    if (stakeHere && stake >= 0 && !inRegion(stake)) out.lines.push(`Stake: on ${noRegionWhy(stake)} now: no route can reach it.`);
    if (stakeHere) { if (stake >= 0) out.stake = stake; else out.lines.push(fl ? 'Stake: on a tile that is not walkable in this layer (kept in the pack, not shown).' : 'Stake: outside the slice (kept in the pack, not shown).'); }
    inc.objectives.forEach((o, k) => {
      const name = o.label || `Objective ${k + 1}`;
      if (!onLayer(o)) { out.lines.push(gone(name, o)); return; }
      const i = incIdx(o);
      if (i < 0) { out.lines.push(fl ? `${name}: on a tile that is not walkable in this layer (kept in the pack, not shown).` : `${name}: outside the slice (kept in the pack, not shown).`); return; }
      const ob = { i, route: null }; out.objectives.push(ob);
      if (!inRegion(i)) { out.lines.push(`${name}: on ${noRegionWhy(i)} now: no route.`); return; }
      if (stake < 0) { out.lines.push(`${name} at (${o.x}, ${o.y}): no stake ${fl && inc.stake ? 'on this layer' : 'yet'}.`); return; }
      if (!inRegion(stake)) { out.lines.push(`${name}: no route (the stake is not on a walkable region, see above).`); return; }
      ob.route = chainRouteOf(i, stake) || E.route(S, P, i, stake); // D31: in the chain view the route IS the chain (the prefix up to this goal, reversed: objective first)
      if (ob.route) { out.lines.push(`${name}: route of ${ob.route.length} tiles to the stake.`); if (roomsView()) out.roomLines.push(routeRoomsLine(k + 1, ob.route)); return; }
      const g = E.regionGap(S, i, stake), xy = (t) => `(${S.ox + (t % S.W)}, ${S.oy + ((t / S.W) | 0)})`;
      out.lines.push(`${name}: <b>no route</b>. Region ${regionName(g.ra)} (${g.sizeA} tiles) is not connected to the stake region ${regionName(g.rb)} (${g.sizeB} tiles)` + (g.dist >= 0 ? `; closest approach ${g.dist} tile${g.dist === 1 ? '' : 's'} between ${xy(g.from)} and ${xy(g.to)}` : '') + (g.droppedGates ? `; ${g.droppedGates} gate${g.droppedGates === 1 ? '' : 's'} touch${g.droppedGates === 1 ? 'es' : ''} both without a ramp.` : '; no gate touches both.'));
    });
    return out;
  }
  function setIncMode(m) {
    inc.mode = m;
    for (const [id, k] of [['m-stake', 'stake'], ['m-obj', 'obj'], ['m-rm', 'rm']]) { const b = document.getElementById(id); if (b) b.classList.toggle('on', m === k); }
    const stage = document.getElementById('stage'); if (stage) stage.classList.toggle('picking', !!m);
  }
  const VOL_MSG = 'Stake and objectives are placed in the heightmap view (Macroform: Off).'; // the volume view has its own camera: a click cannot be resolved against the heightmap shape
  function clickMap(e) {
    if (volActive()) { message(VOL_MSG); return; }
    if (E.hasFloors(packs[st.pack].pack) && st.floors !== 'single') { message('Stake and objectives are placed in the single-floor views.'); return; }
    const figs = [...$('#stage').children].filter((f) => !f.hidden), techs = st.mode === 'compare' ? ALL_TECH : [st.tech];
    for (let k = 0; k < figs.length; k++) {
      const cv = figs[k].querySelector('canvas'), r = cv.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const hit = E.pickTile(S, P, techs[k], view(), cv.clientWidth, cv.clientHeight, e.clientX - r.left, e.clientY - r.top);
      return placeMark(hit.tile);
    }
  }
  /* Pocket view: a click in the world on a Diorama chooses that room (the same as its chip); in the pocket itself a click does nothing (another chip or Whole map goes back) */
  function clickRoom(e) {
    if (volActive()) { message(VOL_MSG); return; }
    if (!S || !S.roomMap || S.pocket) return;
    const figs = [...$('#stage').children].filter((f) => !f.hidden), techs = st.mode === 'compare' ? ALL_TECH : [st.tech];
    for (let k = 0; k < figs.length; k++) {
      const cv = figs[k].querySelector('canvas'), r = cv.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const hit = E.pickTile(S, P, techs[k], view(), cv.clientWidth, cv.clientHeight, e.clientX - r.left, e.clientY - r.top);
      const id = hit.tile >= 0 ? S.roomMap[hit.tile] : 0, o = id > 0 && S.types ? S.types.rooms.get(id) : null;
      if (o && o.type === E.roomTypes.DIORAMA) { sliceSel.whole = false; sliceSel.rooms.clear(); sliceSel.rooms.add(id); applyDacRule(); syncRoomChips(); refreshMessage(); invalidate(true); }
      return;
    }
  }
  function placeMark(tile) {
    const note = (t) => { $('#incInfo').innerHTML = t; };
    if (tile < 0) return note('Nothing under the cursor.');
    if (!Number.isInteger(tile) || tile >= S.n) return note('That is not a tile of the map: no stake or objective stored.'); // undefined / NaN / a fraction (a script or the console): nothing is stored, never a mark with NaN coordinates
    const x = S.ox + (tile % S.W), y = S.oy + ((tile / S.W) | 0);
    if (inc.mode === 'rm') {
      const near = (m) => Math.hypot(m.x - x, m.y - y) <= 1.5;
      if (inc.stake && onLayer(inc.stake) && near(inc.stake)) inc.stake = null; else { const k = inc.objectives.findIndex((m) => onLayer(m) && near(m)); if (k >= 0) inc.objectives.splice(k, 1); else return note('No mark there.'); }
    } else {
      if (S.backdrop && S.backdrop.role[tile] === 2) return note(`(${x}, ${y}) is decoration (floor backdrop): not walkable, no stake or objective there.`);
      if (S.slice && !S.slice[tile]) return note(`(${x}, ${y}) is outside the slice: movement is limited to the slice.`);
      if (S.block[tile]) return note(`(${x}, ${y}) is not walkable (water or void).`);
      if (S.isolated && S.isolated[tile]) return note(`(${x}, ${y}) is isolated terrain (a walkable region under ${S.walkInfo.limit} tiles): decorative, no stake or objective there.`);
      if (!E.tileWalkable(S, tile)) return note(`(${x}, ${y}) is in the margin of a wall, a cliff or a steep slope: not walkable with rooms on. Pick a tile a little further in.`);
      const mk = incFloors() ? { x, y, layer: curLayer() } : { x, y }; // floors packs: the mark remembers its layer
      if (inc.mode === 'stake') inc.stake = mk; else inc.objectives.push(mk);
    }
    invalidate(false);
  }

  /* ---- slice ---- */
  const sliceSel = { zones: new Set(), whole: false, rooms: new Set() };
  const cropIds = ['cx0', 'cy0', 'cx1', 'cy1'];
  function sliceSpec() {
    const pack = packs[st.pack].pack, spec = { margin: P.margin };
    if (P.rooms && sliceSel.rooms.size) spec.rooms = [...sliceSel.rooms].sort((a, b) => a - b); // rooms choose the slice when they are on and one is picked
    else if (pack.fields && pack.fields.zone && sliceSel.zones.size && !sliceSel.whole) spec.zones = [...sliceSel.zones].sort((a, b) => a - b);
    const v = cropIds.map((id) => $('#' + id).value.trim());
    if (v.some((x) => x !== '')) {
      const d = [0, 0, pack.width, pack.height];
      spec.rect = v.map((x, k) => (x === '' ? d[k] : Math.max(0, Math.round(+x) || 0)));
    }
    return spec.zones || spec.rooms || spec.rect ? spec : null;
  }
  const hueOf = (c) => (c.hue !== undefined ? c.hue * 360 : (c.id * 137.5) % 360);
  function buildChips(pack) {
    const box = $('#zoneChips'), z = pack.fields && pack.fields.zone;
    box.innerHTML = ''; $('#zoneHint').hidden = !z; syncWholeButtons(pack);
    if (!z) { sliceSel.zones.clear(); return; }
    const ids = z.info.classes.map((c) => c.id);
    for (const id of [...sliceSel.zones]) if (!ids.includes(id)) sliceSel.zones.delete(id);
    if (!sliceSel.zones.size && !sliceSel.whole && ids.length) sliceSel.zones.add(Math.min(...ids)); // default: one zone, the lowest id
    for (const c of z.info.classes) {
      const b = document.createElement('button'); b.className = 'chip'; b.dataset.id = c.id;
      b.innerHTML = `<i style="background:hsl(${hueOf(c).toFixed(0)},80%,55%)"></i>${c.id} <small>${c.count}</small>`;
      b.addEventListener('click', (e) => {
        sliceSel.whole = false;
        if (e.ctrlKey || e.shiftKey || e.metaKey) { sliceSel.zones.has(c.id) ? sliceSel.zones.delete(c.id) : sliceSel.zones.add(c.id); } else { sliceSel.zones.clear(); sliceSel.zones.add(c.id); }
        syncChips(); refreshMessage(); invalidate(true);
      });
      box.appendChild(b);
    }
    syncChips();
  }
  /* NEVER TWO "Whole map" buttons: with Rooms on (the rooms layer found rooms) the rooms button is the one ("Whole map" of the rooms also clears the zones: a superset of the zone one); with Rooms off, the zone button (only when the pack has a zone role) */
  function syncWholeButtons(pack) {
    const p = pack || (packs[st.pack] && packs[st.pack].pack), z = !!(p && p.fields && p.fields.zone);
    $('#zoneBtns').hidden = !z || !!(S && S.rooms);
  }
  function buildRoomChips() {
    const box = $('#roomChips'), on = !!(S && S.rooms);
    $('#roomHint').hidden = $('#roomBtns').hidden = !on; syncWholeButtons();
    if (!on) { box.innerHTML = ''; st.roomChipsKey = null; return; }
    if (st.roomChipsKey === S.rooms.room) { syncRoomChips(); return; }
    st.roomChipsKey = S.rooms.room; box.innerHTML = '';
    const ids = new Set(S.rooms.rooms.map((r) => r.id)), had = sliceSel.rooms.size; for (const id of [...sliceSel.rooms]) if (!ids.has(id)) sliceSel.rooms.delete(id);
    st.roomsGone = had > 0 && !sliceSel.rooms.size && !NO_MODES && st.modeId === 'rooms'; // mode 2: every chosen room is gone in the new map (preset / parameters changed): back to Whole map, rebuilt once by draw() (the slice built from the old ids was empty)
    if (st.roomsGone) sliceSel.whole = true;
    for (const r of S.rooms.rooms) {
      const b = document.createElement('button'); b.className = 'chip'; b.dataset.id = r.id;
      b.innerHTML = `<i style="background:hsl(${E.rooms.hue(r.id).toFixed(0)},55%,50%)"></i>${r.id} <small>${S.rooms.roomSizes[r.id]}</small>`;
      b.addEventListener('click', (e) => {
        sliceSel.whole = false;
        if (e.ctrlKey || e.shiftKey || e.metaKey) { sliceSel.rooms.has(r.id) ? sliceSel.rooms.delete(r.id) : sliceSel.rooms.add(r.id); } else { sliceSel.rooms.clear(); sliceSel.rooms.add(r.id); }
        applyDacRule(); syncRoomChips(); refreshMessage(); invalidate(true);
      });
      box.appendChild(b);
    }
    syncRoomChips();
  }
  function syncRoomChips() {
    document.querySelectorAll('#roomChips .chip').forEach((b) => b.classList.toggle('on', sliceSel.rooms.has(+b.dataset.id)));
    $('#wholeRooms').classList.toggle('on', !sliceSel.rooms.size);
  }
  function syncChips() {
    document.querySelectorAll('#zoneChips .chip').forEach((b) => b.classList.toggle('on', !sliceSel.whole && sliceSel.zones.has(+b.dataset.id)));
    $('#wholeMap').classList.toggle('on', sliceSel.whole);
  }
  function refreshMessage() { const p = packs[st.pack] && packs[st.pack].pack; message(p && p.warnings ? p.warnings.join(' ') : ''); }
  function onPackChanged() {
    st.floors = 'single'; st.layer = 0; st.macro = 'off'; st.macroFloor = 1; buildFloorChips(); buildMacroChips();
    buildChips(packs[st.pack].pack);
    inc.stake = null; inc.objectives = []; setIncMode(null);
    if (st.pack === 'image' && manifest) { inc.stake = manifest.stake ? Object.assign({}, manifest.stake) : null; inc.objectives = manifest.objectives.map((o) => Object.assign({}, o)); }
  }

  /* ---- images and channel roles ---- */
  const imgs = [];      // { name, dec, width, height, max, ch } (ch = R,G,B,A,H,S,V planes)
  const roleSel = {};
  let manifest = null;
  const KEYS = { elevation: [/height|elev|alt|dem/i, 'V'], zone: [/zone|biome|node|region|countr/i, 'H'], edge: [/edge|border/i, 'H'], path: [/path|road/i, 'V'], vegetation: [/veg|tree|forest/i, 'V'], poi: [/poi/i, 'V'] };

  function buildRoles() {
    const box = $('#roles');
    for (const [role] of E.ROLES) {
      const row = document.createElement('label'); row.className = 'role';
      row.innerHTML = `<span>${role}</span><select id="r-${role}"></select>`;
      box.appendChild(row);
      roleSel[role] = row.querySelector('select');
      roleSel[role].addEventListener('change', rebuildPack);
      if (role === 'zone') {
        const mn = document.createElement('label'); mn.className = 'role';
        mn.innerHTML = '<span>maxnode</span><input type="number" id="maxnode" min="1" step="1" placeholder="blank = deduce hue centres">';
        box.appendChild(mn);
        mn.querySelector('input').addEventListener('change', rebuildPack);
      }
    }
    $('#flipy').addEventListener('change', () => {
      for (const im of imgs) Object.assign(im, E.imageChannels(im.dec, $('#flipy').checked));
      rebuildPack();
    });
    $('#saveManifest').addEventListener('click', saveManifest);
  }

  function fillRoleOptions(values) {
    for (const [role] of E.ROLES) {
      const sel = roleSel[role];
      sel.innerHTML = '<option value="">— none —</option>' + imgs.map((im, k) =>
        `<optgroup label="${im.name.replace(/[<&"]/g, '')}">` + E.CHANNELS.map((c) => `<option value="${k}:${c}">${im.name.replace(/[<&"]/g, '')} · ${c}</option>`).join('') + '</optgroup>').join('');
      sel.value = values[role] || '';
    }
  }
  function defaultRoles(list) {
    const r = {};
    for (const [role, [re, ch]] of Object.entries(KEYS)) { const k = list.findIndex((im) => re.test(im.name)); if (k >= 0) r[role] = `${k}:${ch}`; }
    if (!r.elevation && list.length === 1) r.elevation = '0:V';
    return r;
  }
  const maxnode = () => { const v = parseInt($('#maxnode').value, 10); return v > 0 ? v : 0; };
  function currentRoles() {
    const roles = {};
    for (const [role] of E.ROLES) { const v = roleSel[role].value; if (v) { const [i, c] = v.split(':'); roles[role] = { image: +i, channel: c }; } }
    return roles;
  }

  async function loadFiles(list) {
    const files = [...list]; if (!files.length) return;
    message('');
    try {
      const png = files.filter((f) => /\.png$/i.test(f.name)), js = files.filter((f) => /\.json$/i.test(f.name));
      if (!png.length) throw new Error('Select at least one PNG file.');
      const flip = $('#flipy').checked, next = [];
      let man = null;
      if (js.length) { try { man = E.parseManifest(JSON.parse(await js[0].text())); } catch (e) { throw new Error(`${js[0].name}: ${e.message}`); } }
      const useFlip = man ? man.flipY : flip;
      for (const f of png) {
        let dec;
        try { dec = await E.decodePng(await f.arrayBuffer()); } catch (e) { throw new Error(`${f.name}: ${e.message}`); }
        next.push(Object.assign({ name: f.name, dec }, E.imageChannels(dec, useFlip)));
      }
      let values = {};
      if (man) {
        for (const [role, r] of Object.entries(man.roles)) {
          const k = next.findIndex((im) => im.name.toLowerCase() === r.image.toLowerCase());
          if (k < 0) throw new Error(`Manifest role "${role}" uses ${r.image}, which is not among the selected files.`);
          values[role] = `${k}:${r.channel}`;
        }
      } else values = defaultRoles(next);
      imgs.splice(0, imgs.length, ...next); // everything decoded and consistent: replace the previous state
      manifest = man;
      sliceSel.zones.clear(); sliceSel.whole = false; for (const id of cropIds) $('#' + id).value = '';
      if (man && man.slice) {
        for (const z of man.slice.zones) sliceSel.zones.add(z);
        if (man.slice.rect) cropIds.forEach((id, k) => { $('#' + id).value = man.slice.rect[k]; });
        if (man.slice.margin !== undefined) { P.margin = man.slice.margin; $('#s-margin').value = P.margin; $('#o-margin').textContent = P.margin; }
      }
      if (man) applyViewerBlock(man.viewer); // a manifest without the block means the defaults
      if (man && man.viewer && man.viewer.mode) setModeSoft(man.viewer.mode); // the saved mode (optional): the images stay, the mode's view rules apply
      $('#flipy').checked = useFlip;
      $('#maxnode').value = man && man.maxnode ? man.maxnode : '';
      $('#roles').hidden = false; $('#rolesBtns').hidden = false;
      fillRoleOptions(values);
      rebuildPack(man && man.notes.length ? man.notes.join(' ') : '');
    } catch (e) { message(e.message); }
  }

  function describe(pack) {
    let mn = Infinity, mx = -Infinity;
    for (const v of pack.elevation) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const out = [`${pack.width}×${pack.height} tiles, native size · elevation ${mn.toFixed(0)}–${mx.toFixed(0)} (channel × ${E.ELEVATION_SCALE})`];
    for (const role of ['zone', 'edge']) {
      const f = pack.fields[role]; if (!f) continue;
      const i = f.info, a = i.ambiguous.total;
      out.push(`<b>${role}</b>: ${i.classes.length} ids (${i.mode === 'maxnode' ? 'id = round(H·' + (i.maxnode + 1) + ')' : i.mode === 'deduced' ? 'hue centres deduced' : 'raw values'}) · ${i.outside} px outside · ${a} ambiguous`);
      out.push(i.classes.map((c) => `${c.label || c.id}:${c.count}`).join(' · '));
    }
    for (const role of ['path', 'vegetation', 'poi']) {
      const f = pack.fields[role]; if (!f) continue;
      let n = 0; for (const v of f.values) if (v > 0) n++;
      out.push(`<b>${role}</b>: ${n} tiles > 0`);
    }
    return out.join('<br>');
  }

  function rebuildPack(note) {
    const roles = currentRoles();
    try {
      const pack = E.packFromRoles(imgs, roles, { name: imgs.map((i) => i.name).join(' + '), maxnode: maxnode(), markers: manifest ? manifest.markers : [] });
      setPack('image', 'Images: ' + pack.name, pack);
      message([typeof note === 'string' ? note : '', ...pack.warnings].filter(Boolean).join(' '));
      $('#rolesInfo').innerHTML = describe(pack); $('#rolesInfo').hidden = false;
      $('#src').value = 'image'; st.pack = 'image'; if (!NO_MODES && st.modeId && E.modes.byId(st.modeId).examples.some((x) => x.images)) st.exampleId = 'images'; enforceMode(); onPackChanged(); invalidate(true);
    } catch (e) { message(e.message); $('#rolesInfo').hidden = true; }
  }

  function manifestSlice() {
    const spec = sliceSpec(); if (!spec) return null;
    return { zones: spec.zones || [], rect: spec.rect || null, margin: P.margin };
  }
  function saveManifest() {
    const roles = {};
    for (const [role, r] of Object.entries(currentRoles())) roles[role] = { image: imgs[r.image].name, channel: r.channel };
    const json = E.buildManifest({ name: imgs.map((i) => i.name).join(' + '), flipY: $('#flipy').checked, maxnode: maxnode(), roles, markers: manifest ? manifest.markers : [], slice: manifestSlice(), viewer: viewerBlock(), stake: inc.stake, objectives: inc.objectives });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2) + '\n'], { type: 'application/json' }));
    a.download = 'pack.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function invalidate(reshape) {
    if (reshape) { S = null; $('#busy').hidden = false; } // painted before the (possibly slow) recompute starts
    st.t0 = performance.now(); st.cold = !!reshape; drawToken++; // a pending panel (B computing) of an older state is dropped
    if (!raf) raf = requestAnimationFrame(() => setTimeout(draw, 0));
  }

  /* the BASE yaw of the camera (degrees): the preset's own, without the drag variation. The pocket is composed along this axis (E.pocket, P.pocketYaw): Cam 1 45, Cam 2 -45, Cam 3-5 and 7 0, Cam 6 0 or the pack's stageYaw */
  function baseYaw() {
    const p = PRESETS.find((x) => x.id === st.preset); if (p.kind === 'oblique') return 0;
    const pk = packs[st.pack] && packs[st.pack].pack; return p.kind === 'persp' && pk && pk.stageYaw ? pk.stageYaw : p.yaw;
  }
  function view() {
    const p = PRESETS.find((x) => x.id === st.preset);
    if (p.kind === 'oblique') return { kind: 'oblique', yaw: 0, pitch: 0, zoom: st.zoom, panX: st.panX, panY: st.panY, fitSc: st.fitSc }; // Cam 7 has no angle: the drag variation does not apply
    const sy0 = baseYaw(); // the camera's own yaw (a pack may declare stageYaw: the yaw of Cam 6, no UI)
    return { kind: p.kind, yaw: sy0 + st.yawOff, pitch: Math.max(15, Math.min(89, p.pitch + st.pitchOff)), zoom: st.zoom, panX: st.panX, panY: st.panY, fitSc: st.fitSc, persH: st.persH };
  }

  function draw() {
    raf = 0;
    if (S && S.pocket && S.pocketYaw !== baseYaw()) S = null; // a pocket is composed for ONE camera axis: any way of changing the camera (preset, scenario, mode, manifest, Stage preset) that changes the base yaw rebuilds it (a world shape does not depend on the yaw)
    P.pocketYaw = baseYaw();
    const raw = packs[st.pack].pack, fl = E.hasFloors(raw); // a floors package (crystallizer 5): the shape is the one of the selected layer (the exterior in the stack and cutaway views)
    if (!S) {
      const pack = fl ? E.floorPack(raw, st.floors === 'single' ? st.layer : 0) : raw;
      try {
        S = E.shape(pack, P, fl ? null : sliceSpec());
        if (fl) E.floors.prepare(S, raw, P, st.floors === 'single' ? st.layer : 0);
        if (fl && P.backdrop && E.backdrop && st.floors === 'single' && st.layer > 0 && st.preset === 'isoE') E.backdrop.apply(S, P, raw, st.layer); // Floor backdrop (crystallizer 5, Option 2, phase 1): a band of the mountain behind the floor
        if (S.sliceInfo && S.sliceInfo.warnings.length) message([...(pack.warnings || []), ...S.sliceInfo.warnings].join(' '));
      } catch (e) { message(e.message); S = E.shape(pack, P, null); }
      buildRoomChips(); buildFloorChips(); buildMacroChips();
      if (st.roomsGone) { st.roomsGone = false; applyDacRule(); refreshMessage(); invalidate(true); return; }
      if (S.types && applyDacRule()) { invalidate(true); return; } // the classification of a new source / preset / parameters is known only now: if the rule gives other switches than the ones set before it, one more build (the usual case: nothing changes)
      st.rooms = S.rooms ? { ms: S.rooms.ms, total: Object.values(S.rooms.ms).reduce((x, y) => x + y, 0) } : null;
    }
    const incursion = computeIncursion(); O.incursion = incursion;
    if (!NO_MODES) { // CHAIN VIEW (D23): the rooms the routes cross, derived from the routes of the shape just built; a change rebuilds the shape ONCE (the routes of the rebuilt shape are the same: the walking graph is built before the flattening)
      const sig = st.modeId === 'rooms' && dacChainOn() ? chainSig() : '';
      if (sig !== (P.chainKey || '')) {
        if (P.chainIds || S.chain) { P.chainIds = null; P.chainSeqs = null; P.chainGoals = null; P.dioPlan = null; P.chainTypes = null; P.chainBlocked = null; P.chainInfo = null; P.chainKey = ''; P.chainFail = ''; invalidate(true); return; } // the shape in hand is flattened: back to the whole one first
        P.chainKey = sig; P.chainFail = '';
        if (sig) {
          const gl = chainGoals(), res = E.roomTypes.roomChain(S, P, gl.stake, gl.goal, P.chainNodes === 'room' ? 'room' : undefined, gl.subs);
          if (res.fail) P.chainFail = res.fail;
          else {
            const tp = E.roomTypes.chainTypes(S, P, res, st.roomRule, gl.stake, gl.goal), wk = E.roomTypes.chainWalk(S, P, res, gl.stake, gl.goal);
            P.chainIds = [...new Set(res.rooms)].sort((a, b) => a - b); P.chainSeqs = [res.pieces]; P.chainGoals = res.goalTiles && res.goalTiles.length ? res.goalTiles.slice() : [gl.stake, gl.goal]; P.chainBlocked = res.blocked; P.chainTypes = tp.map; P.chainInfo = { rooms: res.rooms, pieces: res.pieces.length, blocked: res.blocked.length, bridges: res.bridges, cut: res.cut, unblocked: res.unblocked, shortest: res.shortest, counts: tp.counts, v164: tp.v164, route: tp.route, relabeled: tp.relabeled, rule: st.roomRule, walkOk: wk.ok, walkLen: wk.length, repeated: res.repeated, terraces: tp.terraces, k: res.k || 0, steps: res.steps !== undefined ? res.steps : res.pieces.length - 1, maxSteps: res.maxSteps, baseSteps: res.baseSteps, visits: res.visits || res.pieces.length, maxUses: res.maxUses, skipped: res.skipped || [] };
            P.dioPlan = null; P.dioSummary = null;
            if (P.dioChain && P.dioChain !== 'off') { // DIORAMA IN THE CHAIN VIEW (D30): the plan is made on the whole shape; a Diorama that does not qualify is drawn as Ascension (labels only)
              const TT = E.roomTypes, ty0 = S.types, typeOf = (r) => (tp.map.has(r) ? tp.map.get(r).type : (ty0.rooms.get(r) || {}).type), goals = res.goalTiles && res.goalTiles.length ? res.goalTiles : [gl.stake, gl.goal];
              const dp = TT.dioPlan(S, P, { chainIds: P.chainIds, pieces: res.pieces, goals, typeOf }); P.dioPlan = dp;
              for (const r of dp.demoted) { const v = res.rooms.filter((x) => x === r).length; tp.map.set(r, { type: TT.ASCENSION, up: false }); if (P.chainInfo.counts.Dio >= v) { P.chainInfo.counts.Dio -= v; P.chainInfo.counts.Asc += v; } }
              P.dioSummary = { mode: dp.mode, cap: dp.cap, total: dp.items.length, eligible: dp.eligible.length, why: dp.why, items: dp.items.map((q) => ({ room: q.room, eligible: q.eligible, perim: q.perim, shift: q.shift, bridge: q.bridgeLen, why: q.why })) };
            }
            invalidate(true); return;
          }
        }
      }
    }
    { // ASCENSION GATE (D28): the faces crossed by a drawn route (objective -> stake) are gate faces that stay open when `ascGate` > 0; the routes exist only once the shape is built, so a change of them rebuilds the shape ONCE (the routes of the rebuilt shape are the same)
      const want = !!(P.ascWalls && P.ascGate > 0 && S && S.roomMap && S.ascWalls); let set = null, key = '';
      if (want) { set = new Set(); const fw = S.mapW, W = S.W, mi = (t) => (((t / W) | 0) + S.oy) * fw + (t % W) + S.ox;
        for (const ob of incursion.objectives) if (ob.route) for (let k = 0; k + 1 < ob.route.length; k++) { const q = ob.route[k], r = ob.route[k + 1]; if (Math.abs((q % W) - (r % W)) + Math.abs(((q / W) | 0) - ((r / W) | 0)) !== 1) continue; if (!(S.roomMap[q] > 0) || !(S.roomMap[r] > 0) || S.roomMap[q] === S.roomMap[r]) continue; const m1 = mi(q), m2 = mi(r); set.add(Math.min(m1, m2) + '_' + Math.max(m1, m2)); }
        key = [...set].sort().join(','); }
      if (key !== P.ascRouteKey) { P.ascRouteKey = key; P.ascRouteFaces = want ? set : null; if (want) { invalidate(true); return; } }
    }
    $('#incInfo').innerHTML = (incursion.lines.join('<br>') || (inc.mode ? '' : 'No stake or objectives.')) + (incursion.roomLines.length ? (incursion.lines.length ? '<br>' : '') + incursion.roomLines.join('<br>') : '');
    const volOn = !!(E.volume && E.volume.has(raw) && st.macro !== 'off'), volView = volOn && view().kind === 'ortho', mvk = { kind: st.macro, floor: st.macroFloor }; // crystallizer 6: the volume view is ONE panel, orthographic cameras only (Cam 6 / 7 show the heightmap)
    if (volView) O.incursion = null; // no stake, objectives or route in the volume view
    const techs = volView ? ['box'] : st.mode === 'compare' ? ALL_TECH : [st.tech];
    const stage = $('#stage'); stage.dataset.n = techs.length;
    while (stage.children.length < techs.length) {
      const f = document.createElement('figure'); f.innerHTML = '<canvas></canvas><figcaption></figcaption>'; stage.appendChild(f);
    }
    [...stage.children].forEach((f, i) => { f.hidden = i >= techs.length; });
    // one camera for every panel: the same scale (px per tile, fitted to the first panel) around the same point of the map
    const multi = fl && st.floors !== 'single' && view().kind !== 'persp'; // the stack and the cutaway are orthographic only: Cam 6 shows the selected floor
    const FLS = multi ? E.floors.layers(S, raw, P, view(), st.floors, !!st.dragging) : null; O.incursion = FLS ? null : O.incursion; st.floorsLayers = FLS;
    const f0 = stage.children[0]; st.persH = f0.clientHeight; st.fitSc = volView ? E.volume.fitScale(raw, view(), f0.clientWidth, f0.clientHeight) : E.fitScale(S, P, view(), f0.clientWidth, f0.clientHeight); // persH: the first panel's height, so Cam 6 has one camera for every panel
    const token = ++drawToken, v = view(), t0 = st.t0 || performance.now();
    const lateKey = (t) => (t === 'B' ? 'Bready:' + P.radius + ':' + P.anchor : 'Cready:' + E.curves.key(P)), late = techs.filter((t) => (t === 'B' || t === 'C') && (!S.cache[lateKey(t)] || (FLS && FLS.dirty))), needB = late.length > 0; // B and C: the first draw is the slow one, painted after the other panels
    const paint = (t, i) => {
      const f = stage.children[i], cv = f.querySelector('canvas'), pend = f.querySelector('.pending');
      if (pend) pend.remove();
      if (volView) { const r = E.volume.render(cv, raw, mvk, v, O); st.volStats = r.stats; f.querySelector('figcaption').innerHTML = `<b>Macroform · ${MACRO_NAMES[st.macro] || st.macro}${st.macro === 'cut' ? ' ' + st.macroFloor : ''}</b><span>${r.faces} faces (${r.stats.top} tops, ${r.stats.side} sides, ${r.stats.cutFaces} section) · ${r.ms.toFixed(0)} ms</span>`; return; }
      const r = FLS ? E.renderLayers(cv, FLS.list, P, t, v, O) : E.render(cv, S, P, t, v, O);
      f.querySelector('figcaption').innerHTML = `<b>${TECH.find((x) => x[0] === t)[1]}</b><span>${r.polys} polys · ${r.walls} walls · ${r.verts} verts · ${r.ms.toFixed(0)} ms</span>`;
      if (t === 'B' || t === 'C') S.cache[lateKey(t)] = true;
    };
    const surv = {}, survOf = (t, now) => { if (t !== 'box' && techs.includes(t) && (now || !late.includes(t))) surv[t] = E.stairSurvival(S, P, t); };
    techs.forEach((t, i) => {
      if (late.includes(t)) { // painted after the other panels: the first draw of B and C is the slow one
        const f = stage.children[i], cv = f.querySelector('canvas'), ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
        cv.width = f.clientWidth * dpr | 0; cv.height = f.clientHeight * dpr | 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#171424'; ctx.fillRect(0, 0, cv.width, cv.height);
        if (!f.querySelector('.pending')) { const d = document.createElement('div'); d.className = 'pending'; d.textContent = 'computing…'; f.appendChild(d); }
        f.querySelector('figcaption').innerHTML = `<b>${TECH.find((x) => x[0] === t)[1]}</b><span>computing…</span>`;
      } else paint(t, i);
    });
    for (const t of techs) survOf(t);
    const firstMs = performance.now() - t0;
    st.timing = { cold: !!st.cold, first: firstMs, all: needB ? null : firstMs, techs: techs.slice() };
    const finish = () => {
      if (token !== drawToken || !S) return;
      if (needB) { techs.forEach((t, i) => { if (late.includes(t)) paint(t, i); }); for (const t of late) survOf(t, true); st.timing.all = performance.now() - t0; }
      info(surv, techs); $('#busy').hidden = true;
    };
    if (needB) { info(surv, techs); requestAnimationFrame(() => setTimeout(finish, 0)); } else finish();
  }
  function roomsSliceText() {
    const g = S.roomGates; if (!g) return '';
    const sl = g.slice, ramps = `${g.sites} ramps` + (g.patchSites ? ` (${g.patchSites} patch, blue)` : '');
    return sl ? ` · slice connections: ${sl.kept} from the global tree + ${sl.patch} patch (components ${sl.componentsBefore} -> ${sl.componentsAfter} among ${sl.nodes} cores) · ${ramps}` : ` · ${ramps}`;
  }
  function walkText() {
    const w = S.walkInfo; if (!w) return '';
    const land = S.landTiles, pr = w.problems;
    let t = `<br><b>Walkable</b> ${w.walkable} tiles (${(w.walkable / land * 100).toFixed(0)}% of the ${S.slice ? 'slice' : 'land'}) · isolated: ${w.isolatedRegions} region${w.isolatedRegions === 1 ? '' : 's'}, ${w.isolatedTiles} tiles (under ${w.limit}, decorative) · edge problems: ${pr.length} region${pr.length === 1 ? '' : 's'}${pr.length ? ' (' + pr.map((p) => p.size).join(', ') + ')' : ''}`;
    if (S.isoRampsDropped) t += ` · ${S.isoRampsDropped} ramps not built (they would end in isolated terrain)`;
    for (const p of pr.slice(0, 5)) t += `<br>&nbsp;&nbsp;edge problem: ${p.size} tiles around (${p.at}), x ${p.box[0]}..${p.box[2]}, y ${p.box[1]}..${p.box[3]}, separated by ${p.causes.slice(0, 3).map(([c, k]) => `${c} (${k})`).join(', ') || p.cause}`;
    return t;
  }
  function connText() {
    const c = S.connInfo; if (!c) return '';
    let t = ` · tree connections walkable: ${c.ok + c.recomputed} of ${c.total}` + (c.recomputed ? ` (${c.recomputed} recomputed over the carved graph, same crossing cost)` : '') + (c.unresolved ? `, <b>${c.unresolved} NOT walkable</b>` : '');
    if (c.unresolved) t += ': ' + c.list.slice(0, 4).map((x) => `(${x.from}) -> (${x.to}) stops at (${x.at[0]}) -> (${x.at[1]}): ${x.reason}`).join('; ');
    const v = S.stairInfo.variants; if (v && v.length > 1) t += ` · ramp variants: ${v.map((k, i) => (i ? S.stairInfo.variantLabels[i] : 'as planned') + ' ' + k).join(', ')}` + (S.unmerged ? ` · ${S.unmerged} pairs not merged (own ramp)` : '');
    return t;
  }
  function contractText() { // counts of the pieces drawn per kind (switch "Art contract")
    const ci = S.contractInfo; if (!O.contract || !ci) return '';
    return shownTechs().filter((t) => ci[t]).map((t) => { const c = ci[t];
      return ` · <b>Art contract</b> (${t === 'box' ? 'Box' : t}): body low ${c.body.low} · mid ${c.body.mid} · high ${c.body.high} · masonry ${c.body.masonry} · edge ${c.body.edge}; wrapper drop ${c.wrapper.drop} · border ${c.wrapper.border} · shore ${c.wrapper.shore}; footprint ${c.footprint}; props trees ${c.trees} · landmarks ${c.landmarks}${c.faded ? ` (${c.faded} faded)` : ''}`; }).join('');
  }
  /* crystallizer 5: the Floors chips (Exterior / Floor 1 / Floor 2: single-floor view only) and the info line of a floors package */
  /* crystallizer 6: the Macroform selector and its floor chips (the horizontal cut at floor 1 / 2 / 3) */
  function buildMacroChips() {
    const raw = packs[st.pack] && packs[st.pack].pack, on = !!(E.volume && E.volume.has(raw)), box = $('#macro'); box.hidden = !on; if (!on) return;
    $('#macroView').value = st.macro;
    const chips = $('#macroChips'); chips.hidden = st.macro !== 'cut'; chips.innerHTML = '';
    raw.macro.floors.forEach((f) => {
      const b = document.createElement('button'); b.className = 'chip' + (st.macroFloor === f.id ? ' on' : ''); b.textContent = 'Floor ' + f.id; b.dataset.id = f.id; b.dataset.macroFloor = f.id;
      b.addEventListener('click', () => { st.macroFloor = f.id; buildMacroChips(); invalidate(false); }); chips.appendChild(b);
    });
  }
  function buildFloorChips() {
    const raw = packs[st.pack] && packs[st.pack].pack, on = E.hasFloors(raw), box = $('#floors'); box.hidden = !on; if (!on) return;
    $('#floorsView').value = st.floors;
    const chips = $('#floorChips'); chips.hidden = st.floors !== 'single'; chips.innerHTML = '';
    [['Exterior', 0], ...raw.floors.map((f) => [f.name, f.id])].forEach(([label, k]) => {
      const b = document.createElement('button'); b.className = 'chip' + (st.layer === k ? ' on' : ''); b.textContent = label; b.dataset.id = k; b.dataset.floor = k;
      b.addEventListener('click', () => { st.layer = k; st.floors = 'single'; invalidate(true); }); chips.appendChild(b);
    });
  }
  function floorsText() {
    const raw = packs[st.pack] && packs[st.pack].pack; if (!E.hasFloors(raw)) return '';
    const multi = st.floors !== 'single' && view().kind !== 'persp', ids = raw.floors.map((f) => f.id), S1 = E.floors.shapeOf(S, raw, P, ids[0]);
    const view1 = multi ? (st.floors === 'stack' ? 'exploded stack (floors raised, the exterior ghosted on top)' : 'cutaway (plane through the shaft axis, perpendicular to the view)') : `single floor: ${st.layer === 0 ? 'exterior' : (raw.floors.find((f) => f.id === st.layer) || {}).name}`;
    const rec = S1.stairs.find((r) => r.site && r.site.declared), warn = E.floorWarnings(raw, S1);
    let t = `<br><b>Floors</b>: ${view1}` + (st.floors !== 'single' && !multi ? ' · Cam 6 (perspective) is not supported in this view: showing the selected floor' : '') + (rec ? ` · link: declared ramp ${rec.cols.length} x ${rec.ramp.len} carved (${rec.mode})` : '');
    if (warn.length) t += ` · <b>${warn.join('; ')}</b>`;
    const bd = S.backdrop && S.backdrop.info;
    if (bd && bd.mode === 'wall') t += ` · <b>Backdrop (the cavity wall attached to the floor, phase 2a / 2b)</b>: ${bd.apron ? bd.apron + ' apron + ' : 'no apron (gap 0) + '}${bd.wall} wall tiles${bd.bay ? ' + ' + bd.bay + ' bay tiles' : ''}; the wall is a STEPPED PROFILE (${bd.steps} treads over ${bd.depth} tiles, risers ${bd.minRise} then ${bd.riser} terrace, taper ${bd.taper} tiles per step${bd.noise ? ', boundary noise' : ''}), which is STYLIZATION: ${bd.profileTiles} of the ${bd.wall} wall tiles come from the profile only and ${bd.mirrorTiles} from the REAL exterior heights over the floor (placed behind the back edge by a MIRROR) used as a lower bound; the Backdrop height (x${bd.mult}) multiplies the whole rise above the floor edge; ${bd.enclosed} enclosed void tiles untouched; ${bd.levelsAdded} levels added`;
    else if (bd) t += ` · <b>Backdrop</b>: ${bd.plain} plain + ${bd.band} band tiles (gap ${bd.gap}, band depth reached ${bd.maxDepth.toFixed(1)} of ${bd.depth} tiles, ${bd.dropped} lower than the plain left empty), ${bd.levelsAdded} levels added`;
    return t;
  }
  /* the techniques the panels show (none of them in the volume view: its one panel is drawn by src/volume.js, so the per-technique counts of the heightmap are not reported) */
  function volActive() { const raw = packs[st.pack] && packs[st.pack].pack; return !!(E.volume && E.volume.has(raw) && st.macro !== 'off' && view().kind === 'ortho'); }
  function shownTechs() { return volActive() ? [] : (st.mode === 'compare' ? ALL_TECH : [st.tech]); }
  function macroText() { // crystallizer 6: what the Macroform view draws and the vertical scale of the volume
    const raw = packs[st.pack] && packs[st.pack].pack; if (!E.volume || !E.volume.has(raw) || st.macro === 'off') return '';
    const V = raw.volume.vScale, ok = view().kind === 'ortho';
    if (!ok) return ' · <b>Macroform</b>: Cam 6 and Cam 7 are not supported in the volume view: showing the heightmap exterior';
    const q = st.volStats || { top: 0, side: 0, cutFaces: 0 };
    return ` · <b>Macroform</b>: ${MACRO_NAMES[st.macro]}${st.macro === 'cut' ? ' at floor ' + st.macroFloor + ' (everything above floor + 2 tiles removed)' : ''} · ${q.top + q.side} faces (${q.cutFaces} section) · VERTICAL SCALE: the volume uses z = elevation x ${V} (1 tile of height = 1 tile of width, PROVISIONAL), the heightmap view (Off) uses ${P.terraces} terraces of ${P.terH} tile: the two are not the same height`;
  }
  function wallText() { // the wall pass of C: mode, band, islands, faces and cost
    const t = S && shownTechs().includes('C') && P.wallPass !== 'off' ? S.cache[E.wallc.ckey(P)] : null; if (!t || t.skipped) return t && t.skipped ? ` · Wall pass of C skipped: cliffs too tall (work ${Math.round(t.work)} > budget ${Math.round(t.budget)} terrace-units of wall; lower Terraces or Height spread, or set Wall pass to Off)` : '';
    const q = t.stats; return ` · <b>Wall pass</b> (C ${q.mode.toUpperCase()}, extrusion ${P.wallExtrude}): ${q.edges} wall edges` + (q.mode === 't3' ? ` · ${q.band} band atoms · ${q.after.islands} islands (${q.before.islands} before the fusion, ${q.after.slivers} slivers, ${q.after.spans} over ${E.wallc.LMAX} tiles)` : ` · ${q.chains} chains · ${q.blocks} blocks`) + ` · ${q.faces} faces · ${q.ms} ms`;
  }
  function curvesText() { // technique C: preset, passes, seeds, contour edges and exempt cells of the last build
    const t = S && shownTechs().includes('C') ? S.cache['Cs:' + E.curves.key(P)] : null; if (!t) return '';
    return ` · <b>Curves C</b> (${P.curves}): ${t.info.passes} pass${t.info.passes > 1 ? 'es' : ''} · ${t.info.cells} seeds · ${t.info.edges} contour edges · ${t.info.exemptCells} exempt (ramps, walls, rings) · ${t.info.ms} ms`;
  }
  function dressText() { // counts of the wall dressing pieces drawn per technique (switch "Wall dressing")
    const di = S && S.dressInfo; if (!O.dress || !di) return '';
    return shownTechs().filter((t) => di[t]).map((t) => { const c = di[t]; return ` · <b>Wall dressing</b> (${t === 'box' ? 'Box' : t}): ${c.walls} walls · strata ${c.strata} · lips ${c.lips} · foot ${c.foot} · rocks ${c.rocks}`; }).join('');
  }
  function ascText() { const a = S.ascWalls; return a && !a.rails ? ` · <b>Ascension walls</b>: ${a.info.faces} faces in ${a.info.runs} chains (${a.info.candidates} candidate faces, ${a.info.dropped} dropped: chains of fewer than 3)` : ''; }
  function pocketText() {
    const pi = S.pocketInfo; if (!pi) return P.pocket && sliceSel.rooms.size === 1 && S.types ? ` · Pocket view: room ${[...sliceSel.rooms][0]} is not a Diorama (normal slice)` : '';
    return ` · <b>POCKET</b> of Diorama room ${pi.ids.join('+')}: fragment ${pi.fragTiles} tiles, pocket ${pi.pocketTiles} tiles (disc radius ${pi.R.toFixed(1)}${S.ox < 0 || S.oy < 0 || S.ox + S.W > S.mapW || S.oy + S.H > S.mapH ? ', window extends past the map edge (void)' : ''}), ${pi.exitRuns} exit${pi.exitRuns === 1 ? '' : 's'} (${pi.exitFaces} faces, ${pi.exitsReached} reached${pi.exitsBent ? `, ${pi.exitsBent} bent` : ''}), framing <b>${pi.archetypeName}</b> (${pi.auto ? 'auto: ' : ''}${pi.reason}), Pocket height ${pi.ph}, water ${pi.waterTiles} tiles${pi.archetype === 'hill' ? ` (pond limit ${pi.pondMax})` : ''}${pi.voidTiles ? `, void ${pi.voidTiles} tiles` : ''}${pi.channelTiles ? `, channel ${pi.channelTiles} tiles` : ''}, backdrop band ${pi.backDepth.toFixed(1)} tiles deep / ${pi.backTiles} tiles, ${pi.seeds} seeds, floors ${pi.floors.length ? pi.floors.join(' + ') : 'none'} (${pi.double ? `double${pi.cliffFacesCamera ? ', cliff facing the camera' : ''}` : 'single'})`;
  }
  function roomsText() {
    const n0 = S.roomsNone; if (n0) return `<br><b>Rooms</b>: no rooms found (map too small for these parameters: ${n0.W} x ${n0.H}, room radius ${n0.R}) - rooms layer not applied`;
    const r = S.rooms; if (!r) return '';
    const rb = S.roomBorderInfo, rbt = rb ? ` · room borders: ${rb.closed} blocking faces (orange) · ${rb.open} open transitions (gap) · ${rb.used} on a tree path (green)` : '';
    const u = r.usage, tr = r.treeReach, ms = st.rooms ? st.rooms.total.toFixed(0) : '?';
    return `<br><b>Rooms</b>: ${r.stats.rooms} rooms · ${r.alive.length} cores (min ${r.prm.minCore} tiles) · tree ${tr.largest} of ${r.reach.length} reachable cores in ${tr.trees} tree${tr.trees === 1 ? '' : 's'} · gates ${u.usedGateGroups} used of ${r.gateStats.groups} candidates · room transitions ${r.expand.transitionPairs} pairs (${u.usedRoomGroups} of ${u.roomGroups} groups on a tree path) · ${(u.bigCoreTiles / r.stats.land * 100).toFixed(0)}% of the land in the largest tree (graph) · largest walkable region ${(Math.max(...S.regionSizes, 0) / S.landTiles * 100).toFixed(0)}% of the ${S.slice ? 'slice' : 'land'}${roomsSliceText()}${connText()}${rbt} · ${ms} ms${st.cold ? ' (cold)' : ''}` + walkText();
  }
  function typesText() {
    const t = S.types; if (!t || !(P.cake || O.typeTint)) return ''; // shown with the Cake switch or the type tint on (the canvas size must not change otherwise)
    const c = t.counts, k = S.cake;
    let x = `<br><b>Room types</b> (V16.4 rule, neighbours instead of lobby platforms): ${c.cake} Cake (${c.bowl} bowls, ${c.pyramid} pyramids) · ${c.diorama} Diorama · ${c.ascension} Ascension of ${t.rooms.size} rooms` + (c.dioDemoted ? ` (rule "Diorama never touches Diorama": ${c.dioDemoted} Dioramas of ${c.diorama + c.dioDemoted} became Ascension, ${c.dioDemotedTiles} tiles)` : '');
    if (P.cake && k) x += ` · Cake rings ON: ${k.down} bowl + ${k.up} pyramid links built, ${k.flat} links without rings, ${k.tiles} ring tiles, ${k.levelsAdded} levels added` + (k.conflicts ? `, ${k.conflicts} tiles claimed twice` : '');
    if (!NO_MODES && st.modeId === 'rooms') x += ` · <b>Framing by room type</b>: ` + (st.dacAuto ? `on (${[P.cake && 'Cake rings', P.ascWalls && 'Ascension walls', P.pocket && 'Pocket'].filter(Boolean).join(', ') || 'none'}; ${sliceSel.rooms.size ? sliceSel.rooms.size + ' room' + (sliceSel.rooms.size > 1 ? 's' : '') + ' chosen' : 'whole map: each framing acts on the rooms of its own type'})` : 'off (the three switches are set by hand)');
    if (!NO_MODES && st.modeId === 'rooms') x += ' · <b>DAC view</b>: ' + (st.dacView !== 'chain' ? 'Whole map' : sliceSel.rooms.size ? 'Chain (a room is chosen: the Chain view applies to the whole map, showing the room)' : S.chain && P.chainInfo ? chainText() : P.chainFail ? 'Chain (' + P.chainFail + ': showing the whole map)' : 'Chain (needs a stake and an objective in rooms: showing the whole map)');
    return x;
  }
  function routeText() { // D31: the drawn route is the chain
    const cr = P.chainGoals && S.chain ? E.roomTypes.chainRoute(S, P) : null; if (!cr) return '';
    return cr.fail ? `; no route through the chain (${cr.why}): the shortest route is drawn` : `; the drawn route follows the chain: ${cr.path.length} tiles through ${cr.pieces} of ${cr.chainPieces} pieces, door to door`;
  }
  function dioText() { // D30: what the Diorama option did (the plan is made on the whole shape, the apply on the rebuilt one)
    const d = P.dioSummary, a = S.dioInfo; if (!d) return '';
    const el = d.items.filter((q) => q.eligible), no = d.items.filter((q) => !q.eligible);
    return `; Diorama in chain view ${d.mode.toUpperCase()}: ${el.length} of ${d.total} Dioramas moved (cap ${d.cap} tiles)` + (el.length ? ' (' + el.map((q) => `room ${q.room}: shift ${q.shift}, bridge ${q.bridge}`).join('; ') + ')' : '') + (no.length ? `; shown as Ascension: ${no.map((q) => `room ${q.room} (${q.why})`).join('; ')}` : '') + (a && el.length ? `; ${a.footprint} footprint / ${a.pocket} pocket / ${a.bridge} bridge / ${a.landing} landing tiles, ${a.levelsAdded} levels added` : '');
  }
  function chainText() {
    const c = S.chain, ci = P.chainInfo, f = (o) => `${o.Cake} Cake / ${o.Asc} Asc / ${o.Dio} Dio`, land = c.kept + c.tiles, T = E.roomTypes;
    const head = ci.k > 0 ? `Chain of ${new Set(ci.rooms).size} rooms through ${ci.k} sub-objective${ci.k > 1 ? 's' : ''}: ${ci.steps} steps (maximum (${ci.k} + 1) x ${ci.baseSteps} = ${ci.maxSteps}); ${ci.visits} visits, ${ci.repeated.length} room${ci.repeated.length === 1 ? '' : 's'} used more than once (max uses ${ci.maxUses} <= ${ci.k + 1})` : `Chain of ${ci.rooms.length} rooms`;
    const tail = ci.k > 0 ? `, N ${P.chainExtra}${ci.cut ? ', the search bound cut it' : ''}` : `, stake to the final goal only (shortest ${ci.shortest} pieces, chain ${ci.pieces} pieces), N ${P.chainExtra}${ci.cut ? ', the search bound cut it' : ''}${ci.repeated && ci.repeated.length ? '; no chain without repeating a room: ' + ci.repeated.map((r) => `room ${r} appears twice, two pieces (one type: the one of its first visit)`).join(', ') : ''}`, skip = (ci.skipped || []).map((q) => `; sub-objective ${q.index} skipped (${q.why})`).join('');
    return `${head} (${f(ci.counts)}; rule ${ci.rule === 'route' ? 'Along the route' : 'V16.4'}: V16.4 gives ${f(ci.v164)}, Along the route ${f(ci.route)}${ci.relabeled ? `; ${ci.relabeled} second Diorama shown as Ascension` : ''})${tail}${skip}${ci.rule === 'route' && ci.route.Cake === 0 ? (ci.terraces.length === 1 ? `; the route stayed on terrace ${ci.terraces[0]} the whole way: no Cake by route` : '; the route changes terrace only on the ramps between rooms, never inside a room: no Cake by route') : ''}, ${ci.blocked} edges blocked (${ci.bridges} bridges skipped${ci.unblocked ? ', unblocked: no path without them' : ''}; chain walkable with its own tiles and no blocked edge: ${ci.walkOk ? 'yes, ' + ci.walkLen + ' tiles' : 'NO'}; the tile route of the info may still cross a blocked edge), ${(100 * c.kept / land).toFixed(1)} % of the land kept, ${c.tiles} tiles flattened, ${c.gateFaces} gate faces, ${c.blockedFaces || 0} blocked faces` + (c.chainRingTiles ? `, ${c.chainRingTiles} ring tiles of the chain Cakes (${c.ringOutside} outside the chain rooms, kept)` : '') + (c.stairsDropped ? `, ${c.stairsDropped} ramps outside the chain not drawn` : '') + dioText() + routeText();
  }
  /* the live state the control requirements are evaluated from (src/controls.js): after every recompute / redraw */
  function controlsCtx() {
    const raw = packs[st.pack] && packs[st.pack].pack, T = S && S.types ? S.types.counts : null, F = (S && S.fields) || {}, any = (a) => !!(a && a.some((v) => v));
    return { rooms: !!P.rooms, roomsFound: !!(S && S.rooms && !S.roomsNone), cakeRooms: T ? T.cake : 0, ascRooms: T ? T.ascension : 0, dioRooms: T ? T.diorama : 0, cake: !!P.cake, ascWalls: !!P.ascWalls, pocket: !!P.pocket, dacAuto: dacOn(), dacWhole: dacOn() && !sliceSel.rooms.size, dacView: st.dacView, chainOn: !!(S && S.chain), chainView: dacChainOn(), anchors: !!P.anchors,
      techs: st.mode === 'compare' ? ALL_TECH : [st.tech], wallPass: P.wallPass, stairW: P.stairW, stairStyle: P.stairStyle, subs: P.subs, climb: P.climb, terraces: P.terraces, slice: !!(S && S.slice), passes: S && S.passes ? S.passes.length : 0,
      packMasks: !!S && (any(S.water) || any(S.waterfall) || any(S.cave)), markers: !!S && ((S.markers && S.markers.length > 0) || !!S.landmarks), zoneRole: !!F.zone, edgeRole: !!F.edge, maskRole: !!(F.path || F.vegetation || F.poi), images: imgs.length > 0,
      floors: E.hasFloors(raw), backdrop: !!P.backdrop, floorsView: st.floors, camKind: view().kind, preset: st.preset, macro: !!(E.volume && E.volume.has(raw)), macroView: st.macro, volOn: volActive() };
  }
  function info(surv, techs) {
    document.querySelectorAll('#presets button').forEach((b) => b.classList.toggle('on', b.dataset.id === st.preset));
    document.querySelectorAll('#techs button').forEach((b) => b.classList.toggle('on', st.mode === 'single' && b.dataset.id === st.tech));
    $('#mode').textContent = st.mode === 'compare' ? 'Compare: on' : 'Compare: off';
    $('#mode').classList.toggle('on', st.mode === 'compare');
    const eff = E.subHeight(P), note = $('#subHnote');
    note.hidden = eff >= P.subH - 1e-9;
    note.textContent = `Sub-terrace height limited to ${eff.toFixed(3)} (set ${P.subH}) so the gap to the next terrace stays above the climb limit.`;
    const sv = (t) => (!surv[t] && techs.includes(t) ? '…' : surv[t] ? `${(surv[t].coverage * 100).toFixed(1)}%` + (surv[t].lost ? `, ${surv[t].lost}/${surv[t].n} lost` : '') + (surv[t].degraded ? `, ${surv[t].degraded} degraded` : '') : '–');
    const sinf = S.stairInfo, stairText = `${sinf.gates} gates · ${sinf.placed} stairs of ${sinf.sites} sites` + (sinf.dropped ? `, ${sinf.dropped} not carved` : '') + (sinf.narrowed ? `, ${sinf.narrowed} narrowed` : '') + (sinf.fills ? `, ${sinf.fills} built up` : '') + ` · stair coverage A ${sv('A')} · B ${sv('B')}` + (techs.includes('C') ? ` · C ${sv('C')}` : '');
    const bi = S.borderInfo, borderText = bi ? ` · slice border faces: ${bi.barrier} barrier (red) · ${bi.pass} pass (cyan) · ${bi.none} unmarked (yellow) · ${bi.mapEdge} map edge (white)` : '';
    const rs = S.regionSizes, tot = rs.reduce((a, b) => a + b, 0), big = Math.max(...rs, 0);
    const zn = S.fields.zone ? ` · ${S.fields.zone.info.classes.length} zones` : '';
    const si = S.sliceInfo, sinfo = si ? `slice ${si.tiles} tiles · window ${si.window.w}×${si.window.h} at (${si.window.x0}, ${si.window.y0}) of ${S.mapW}×${S.mapH}` : 'whole map';
    $('#sliceInfo').textContent = sinfo;
    $('#info').innerHTML = `<b>${S.name}</b> · ${S.mapW}×${S.mapH}${zn} · ${S.levelCount.terraces} terraces, ${S.levelCount.levels} levels in the ${si ? 'slice' : 'map'} · ${stairText}${borderText} · ${rs.length} regions in the ${si ? 'slice' : 'map'} (${Math.max(0, rs.length - 1)} not connected to the largest), largest ${(big / tot * 100).toFixed(0)}%` + roomsText() + typesText() + ascText() + pocketText() + contractText() + dressText() + curvesText() + wallText() + floorsText() + macroText();
    E.controls.refresh(document, controlsCtx()); // requirements of every control, from the live state
    modeRefresh(); // the modes layer: what the current mode shows (after the requirements, so the greyed tooltips are already set)
  }

  /* ---- the MODES layer (src/modes.js, docs/ui-modes.md): one mode per crystallizer. It only shows / hides existing controls and sets existing parameters (the examples are the old scenarios). ---- */
  const curMode = () => (NO_MODES || !st.modeId ? null : E.modes.byId(st.modeId));
  function buildModeUi() {
    const sel = $('#modeSel'), M = E.modes.MODES, opt = (m) => { const o = document.createElement('option'); o.value = m.id; o.textContent = `${m.number} ${m.name}`; return o; };
    for (const m of M.filter((x) => x.group === 'main')) sel.appendChild(opt(m));
    const og = document.createElement('optgroup'); og.label = 'Archived'; for (const m of M.filter((x) => x.group === 'archived')) og.appendChild(opt(m)); sel.appendChild(og);
    sel.addEventListener('change', () => enterMode(sel.value));
    $('#modeBox').hidden = false;
    document.querySelector('aside').classList.add('modes'); // only with the modes layer: the long chips lists get a bounded box (the panel with EVO_NO_MODES stays as it was)
    st.modeId = 'terrain'; st.exampleId = 'snake_surface'; sel.value = 'terrain'; buildExamples(); // the state at load is the default one (mode 1, Snake Mountain surface, Compare, Cam 3): nothing is re-applied
    $('#macroView').dataset.offLabel = $('#macroView option[value="off"]').textContent;
  }
  function buildExamples() {
    const m = curMode(), box = $('#examples'); box.innerHTML = ''; if (!m) return;
    for (const ex of m.examples) { const b = document.createElement('button'); b.textContent = ex.label; b.dataset.id = ex.id; b.addEventListener('click', () => applyExample(ex)); box.appendChild(b); }
    $('#modePurpose').textContent = m.purpose; const bn = $('#modeBanner'); bn.hidden = !m.banner; bn.textContent = m.banner || '';
  }
  /* the rules of the mode that the state must obey whatever loaded it (an example, a manifest, an images load) */
  function enforceMode() {
    const m = curMode(); if (!m) return;
    if (m.fixed.includes('t-rooms') && !P.rooms) { P.rooms = true; const t = $('#t-rooms'); if (t) t.checked = true; }
    if (!m.compare && st.mode !== 'single') st.mode = 'single';
    if (!m.techs.includes(st.tech)) st.tech = m.tech;
    if (!m.cameras.includes(st.preset)) st.preset = m.camera;
  }
  async function applyExample(ex, m) {
    m = m || curMode(); if (!m) return;
    st.exampleId = ex.id;
    if (ex.images && !imgs.length) { enforceMode(); invalidate(false); return; } // "Your images" before any file: the loader appears; the state stays as it is
    if (ex.images) { await applyScenario({ src: 'image', rooms: ex.rooms, tech: ex.tech }, m); enforceMode(); return; }
    await applyScenario(ex, m); enforceMode();
  }
  async function enterMode(id) {
    const m = E.modes.byId(id); if (!m || NO_MODES) return;
    st.modeId = id; $('#modeSel').value = id; E.modes.resetFolds(document); buildExamples();
    await applyExample(m.examples[0], m);
  }
  function setModeSoft(id) { // a manifest names its mode: the view rules apply, the loaded images and the camera of the manifest stay
    const m = E.modes.byId(id); if (!m || NO_MODES) return;
    st.modeId = id; $('#modeSel').value = id; E.modes.resetFolds(document); buildExamples(); st.exampleId = m.examples.some((x) => x.images) ? 'images' : m.examples[0].id; enforceMode();
  }
  function modeRefresh() {
    const m = curMode(); if (!m) return;
    E.modes.refresh(document, { modeId: m.id, exampleId: st.exampleId, floorsView: st.floors }, modeRefresh);
    document.querySelectorAll('#examples button').forEach((b) => b.classList.toggle('on', b.dataset.id === st.exampleId));
    const off = $('#macroView option[value="off"]'); if (off) off.textContent = m.id === 'macroform' ? 'Heightmap (for comparison)' : $('#macroView').dataset.offLabel;
    const raw = packs[st.pack] && packs[st.pack].pack, bb = $('#bakedBox'), pr = raw && raw.macro && raw.macro.params;
    bb.hidden = !(m.id === 'macroform' && pr); if (!bb.hidden) $('#bakedParams').textContent = Object.entries(pr).map(([k, v]) => `${k} ${v}`).join(' · ') + (pr.provisional ? '\n(all provisional)' : '');
  }

  function init() {
    setPack('snake_surface', 'Snake Mountain surface (macroform, outer surface only)', window.EVO_PACKS.snake_mountain_surface);
    setPack('snake', 'Snake Mountain (macroform, caves subtracted)', window.EVO_PACKS.snake_mountain);
    setPack('shrine_pier', 'Shrine-Pier (semantic landmarks)', window.EVO_PACKS.shrine_pier);
    setPack('shrine_pier_x4', 'Shrine-Pier x4 (decompressed, derived)', window.EVO_PACKS.shrine_pier_x4);
    setPack('snake_floors', 'Snake Mountain floors (shaft + 2 floors, derived)', window.EVO_PACKS.snake_mountain_floors);
    setPack('snake_macroform', 'Snake Mountain macroform (volume: shell, serpent, shaft, floors, derived)', window.EVO_PACKS.snake_mountain_macroform);
    setPack('noise', 'Value noise 48×48 (base stand-in)', E.noisePack(48, 48, 7));
    setPack('real_map', 'Real map 256 (height only)', null); // decoded on the first selection (realMapPack)
    build(); E.controls.layout(document); E.controls.badges(document);
    if (!NO_MODES) buildModeUi(); else $('#modeBox').remove(); // without modes the panel is exactly the old one (the mode box is not even in the DOM)
    invalidate(true);
    window.__evo = { fmtRoomSeq, routeRoomIds, enterMode, setMode: (id) => enterMode(id), controlsCtx, scenario: (id) => applyScenario(SCENARIOS.find((x) => x.id === id)), viewerBlock, applyViewerBlock, clickRoom, timing: () => st.timing, roomsTiming: () => st.rooms, inc, setIncMode, clickMap, placeMark, P, O, st, packs, sliceSel, S: () => S, sliceSpec, view, draw: () => invalidate(true), set: (o) => Object.assign(st, o) };
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})(window.EVO = window.EVO || {});
