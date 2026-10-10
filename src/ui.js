/* UI wiring */
(function (E) {
  const $ = (s) => document.querySelector(s);
  const P = { terraces: 5, subs: 3, terH: 1.0, spread: 1, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, tread: 2, stairW: 3, stairStyle: 1, rampDepth: 2, gateThr: 0.05, gateMin: 3, margin: 24, rooms: false, ascWalls: false, ascHeight: 1.5, pocket: false, pocketFraming: 'auto', pocketHeight: 2.5, roomsMinCore: 20, roomsCross: 10, roomsIsoLimit: 100, rRadius: 9, cake: false, cakeLayers: 3, cakeStep: 0.3, cakePer: 1, cakeSeam: 5 };
  const O = { outlines: true, gradient: true, features: true, regions: false, veil: true, border: true, markers: true, rampLines: true, passes: false, roomBorders: true, dioOutline: false, roomTint: false, typeTint: false, nowalk: true, edgeWarn: true, zones: false, edges: false, masks: false };
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
  const SLIDERS = [
    ['Shaping', [['terraces', 'Terraces', 2, 24, 1], ['subs', 'Sub-terraces / terrace', 1, 6, 1], ['terH', 'Terrace height', 0.4, 2.5, 0.05], ['spread', 'Height spread (1 = uniform)', 1, 3, 0.05], ['subH', 'Sub-terrace height', 0.05, 0.5, 0.01], ['minPlateau', 'Min plateau (tiles)', 1, 300, 1], ['minSub', 'Min sub-terrace patch', 1, 12, 1], ['pre', 'Pre-smooth', 0, 3, 1]]],
    ['Technique A / B', [['smooth', 'A · Chaikin passes', 0, 4, 1], ['radius', 'B · Field blur (tiles)', 0, 2.5, 0.1]]],
    ['Passes', [['climb', 'Climb limit, sub-terraces (provisional)', 1, 5, 1], ['gateThr', 'Gate slope threshold', 0, 0.3, 0.005], ['gateMin', 'Min gate size, tiles', 1, 20, 1], ['passGap', 'Stair spacing (long gates)', 3, 20, 1], ['stairStyle', 'Style: 0 steps · 1 ramp', 0, 1, 1], ['rampDepth', 'Ramp depth, tiles (fixed)', 1, 4, 1], ['tread', 'Tread rise, sub-terraces (steps only)', 1, 5, 1], ['stairW', 'Stair / ramp width, tiles (0 = none; steps use up to 3)', 0, 5, 1]]],
    ['Rooms', [['roomsMinCore', 'Min core size, tiles', 5, 250, 1], ['rRadius', 'Room radius, tiles', 3, 30, 1], ['roomsCross', 'Gate crossing cost, tiles', 0, 40, 1], ['roomsIsoLimit', 'Isolated limit, tiles', 20, 1000, 1], ['cakeLayers', 'Cake · rings (layers)', 1, 6, 1], ['cakeStep', 'Cake · ring step (x terrace height)', 0.1, 0.6, 0.05], ['cakePer', 'Cake · tiles per ring', 1, 3, 1], ['cakeSeam', 'Cake · seam window (bowl), tiles', 2, 12, 1], ['pocketHeight', 'Pocket height (decoration relief x)', 1, 4, 0.1], ['ascHeight', 'Ascension wall height (absolute)', 0.5, 3, 0.1]]],
    ['Slice', [['margin', 'Scenery margin (tiles)', 0, 128, 1]]]
  ];
  const TOGGLES = [['outlines', 'Outlines'], ['gradient', 'Cliff gradient'], ['features', 'Water / snake / cave'], ['markers', 'Landmarks'], ['rampLines', 'Ramp cross lines'], ['regions', 'Walk regions'], ['passes', 'Stair marks'], ['roomBorders', 'Room borders (rooms on)'], ['dioOutline', 'Diorama footprint outline (rooms on)'], ['typeTint', 'Room type tint (Cake orange / Diorama green / Ascension blue)'], ['roomTint', 'Room tint (rooms on)'], ['nowalk', 'Not walkable tone (rooms on)'], ['edgeWarn', 'Edge-problem outline (rooms on)'], ['veil', 'Veil outside the slice'], ['border', 'Slice border line'], ['zones', 'Zones (from roles)'], ['edges', 'Edge map (from roles)'], ['masks', 'Path / vegetation / POI']];
  const TECH = [['box', 'Box (reference)'], ['A', 'A · Contour polygons'], ['B', 'B · Distance field']];

  const packs = {};
  const inc = { stake: null, objectives: [], mode: null }; // marks in tiles of the WHOLE map
  const st = { pack: 'snake_surface', mode: 'compare', layout: 'auto', fitSc: 0, tech: 'A', preset: 'oblique', zoom: 1, yawOff: 0, pitchOff: 0, panX: 0, panY: 0 };
  let S = null, raf = 0, drawToken = 0;

  function setPack(id, label, pack) {
    packs[id] = { label, pack };
    let o = [...$('#src').options].find((x) => x.value === id);
    if (!o) { o = document.createElement('option'); o.value = id; $('#src').appendChild(o); }
    o.textContent = label;
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
  function viewerBlock() { const b = { preset: ($('#roomsPreset') || {}).value || 'custom', rooms: !!P.rooms, cake: !!P.cake, terraces: P.terraces, roomsMinCore: P.roomsMinCore, rRadius: P.rRadius, minPlateau: P.minPlateau }; if (st.preset !== 'oblique') b.camera = st.preset; return b; } // camera: written only when it is not the default (Cam 3), so a pack saved before the bank is unchanged
  function applyViewerBlock(v) { // manifest -> viewer (absent fields keep the defaults, so a pack without the block loads as before)
    const d = { rooms: false, cake: false, terraces: 5, roomsMinCore: 20, rRadius: 9, minPlateau: 5 }, w = Object.assign({}, d, v || {});
    P.rooms = !!w.rooms; P.cake = !!w.cake; const tr = $('#t-rooms'), tc = $('#t-cake'); if (tr) tr.checked = P.rooms; if (tc) tc.checked = P.cake;
    for (const k of ['terraces', 'roomsMinCore', 'rRadius', 'minPlateau']) setParam(k, w[k]);
    syncRoomsPreset();
    st.preset = PRESETS.some((x) => x.id === w.camera) ? w.camera : 'oblique'; st.yawOff = st.pitchOff = 0; // absent = the default camera
  }

  function build() {
    const sl = $('#sliders');
    for (const [title, list] of SLIDERS) {
      const h = document.createElement('h3'); h.textContent = title; sl.appendChild(h);
      if (title === 'Rooms') { // the switch: off, the viewer is the one without rooms (gates by terrace)
        const l = document.createElement('label'); l.className = 'tg'; l.innerHTML = '<input type="checkbox" id="t-rooms"><span>Rooms (watershed rooms, cores, tree)</span>';
        const i = l.querySelector('input'); i.checked = P.rooms; i.addEventListener('change', () => { P.rooms = i.checked; refreshMessage(); invalidate(true); }); sl.appendChild(l);
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
        const lg = document.createElement('div'); lg.className = 'row'; lg.innerHTML = '<button id="stagePreset" title="Stage preset: Cam 6 (perspective), technique B, terraces 7, height spread 1.5. It only sets existing parameters and the camera.">Stage preset</button>';
        lg.querySelector('button').addEventListener('click', () => { st.preset = 'stage'; st.yawOff = st.pitchOff = st.panX = st.panY = 0; st.zoom = 1; st.tech = 'B'; st.mode = 'single'; setParam('terraces', 7); setParam('spread', 1.5); syncRoomsPreset(); invalidate(true); }); sl.appendChild(lg);
      }
      for (const [k, label, mn, mx, step] of list) {
        const row = document.createElement('label'); row.className = 'sl';
        row.innerHTML = `<span>${label}</span><output id="o-${k}"></output><input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${step}">`;
        sl.appendChild(row);
        const inp = row.querySelector('input'), out = row.querySelector('output');
        inp.value = P[k]; out.textContent = P[k];
        inp.addEventListener('input', () => { out.textContent = inp.value; }); // label only while dragging
        inp.addEventListener('change', () => { P[k] = +inp.value; out.textContent = P[k]; syncRoomsPreset(); refreshMessage(); invalidate(true); }); // recompute on release
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
    const pb = $('#presets');
    for (const p of PRESETS) {
      const b = document.createElement('button'); b.textContent = p.label; b.title = p.title; b.dataset.id = p.id;
      b.addEventListener('click', () => { st.preset = p.id; st.yawOff = 0; st.pitchOff = 0; st.panX = st.panY = 0; st.zoom = 1; invalidate(false); });
      pb.appendChild(b);
    }
    const tb = $('#techs');
    for (const [id, label] of TECH) {
      const b = document.createElement('button'); b.textContent = label; b.dataset.id = id;
      b.addEventListener('click', () => { st.tech = id; st.mode = 'single'; invalidate(false); });
      tb.appendChild(b);
    }
    $('#layout').addEventListener('change', (e) => { st.layout = e.target.value; invalidate(false); });
    $('#mode').addEventListener('click', () => { st.mode = st.mode === 'single' ? 'compare' : 'single'; invalidate(false); });
    $('#src').addEventListener('change', (e) => { st.pack = e.target.value; for (const id of cropIds) $('#' + id).value = ''; onPackChanged(); refreshMessage(); invalidate(true); }); // a crop belongs to one map
    buildRoles();
    $('#wholeRooms').addEventListener('click', () => { sliceSel.rooms.clear(); sliceSel.whole = true; sliceSel.zones.clear(); syncChips(); syncRoomChips(); refreshMessage(); invalidate(true); });
    $('#wholeMap').addEventListener('click', () => { sliceSel.whole = true; sliceSel.zones.clear(); syncChips(); refreshMessage(); invalidate(true); });
    for (const id of cropIds) $('#' + id).addEventListener('change', () => { refreshMessage(); invalidate(true); });
    $('#file').addEventListener('change', (e) => loadFiles(e.target.files));
    for (const [id, k] of [['m-stake', 'stake'], ['m-obj', 'obj'], ['m-rm', 'rm']]) document.getElementById(id).addEventListener('click', () => setIncMode(inc.mode === k ? null : k));
    document.getElementById('m-clear').addEventListener('click', () => { inc.stake = null; inc.objectives = []; setIncMode(null); invalidate(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && inc.mode) setIncMode(null); });
    $('#reset').addEventListener('click', () => { st.yawOff = st.pitchOff = st.panX = st.panY = 0; st.zoom = 1; invalidate(false); });
    window.addEventListener('resize', () => invalidate(false));
    $('#stage').addEventListener('wheel', (e) => { e.preventDefault(); st.zoom = Math.max(0.5, Math.min(4, st.zoom * (e.deltaY < 0 ? 1.1 : 0.9))); invalidate(false); }, { passive: false });
    let drag = null;
    $('#stage').addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yo: st.yawOff, po: st.pitchOff, px: st.panX, py: st.panY, shift: e.shiftKey || e.button === 2 }; e.currentTarget.setPointerCapture(e.pointerId); });
    $('#stage').addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (drag.shift) { st.panX = drag.px + dx; st.panY = drag.py + dy; }
      else { st.yawOff = Math.max(-20, Math.min(20, drag.yo + dx * 0.15)); st.pitchOff = Math.max(-15, Math.min(15, drag.po - dy * 0.15)); }
      invalidate(false);
    });
    $('#stage').addEventListener('pointerup', (e) => {
      const moved = drag ? Math.hypot(e.clientX - drag.x, e.clientY - drag.y) : 99, was = drag; drag = null;
      if (inc.mode && was && !was.shift && e.button === 0 && moved < 4) clickMap(e);
      else if (!inc.mode && P.pocket && P.rooms && was && !was.shift && e.button === 0 && moved < 4) clickRoom(e);
    });
    $('#stage').addEventListener('dblclick', () => $('#reset').click());
    $('#stage').addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ---- incursion: stake, objectives, routes ---- */
  const incIdx = (m) => { // a mark (tile of the whole map) as a tile of the built window, or -1 when it is outside the window or the slice
    const x = m.x - S.ox, y = m.y - S.oy; if (x < 0 || y < 0 || x >= S.W || y >= S.H) return -1;
    const i = y * S.W + x; return S.block[i] ? -1 : i;
  };
  const regionName = (r) => `R${r + 1}`;
  function computeIncursion() {
    const out = { stake: null, objectives: [], lines: [] };
    if (!S) return out;
    const stake = inc.stake ? incIdx(inc.stake) : -1;
    if (inc.stake) { if (stake >= 0) out.stake = stake; else out.lines.push('Stake: outside the slice (kept in the pack, not shown).'); }
    inc.objectives.forEach((o, k) => {
      const i = incIdx(o), name = o.label || `Objective ${k + 1}`;
      if (i < 0) { out.lines.push(`${name}: outside the slice (kept in the pack, not shown).`); return; }
      const ob = { i, route: null }; out.objectives.push(ob);
      if (stake < 0) { out.lines.push(`${name} at (${o.x}, ${o.y}): no stake yet.`); return; }
      ob.route = E.route(S, P, i, stake);
      if (ob.route) { out.lines.push(`${name}: route of ${ob.route.length} tiles to the stake.`); return; }
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
  function clickMap(e) {
    const figs = [...$('#stage').children].filter((f) => !f.hidden), techs = st.mode === 'compare' ? ['box', 'A', 'B'] : [st.tech];
    for (let k = 0; k < figs.length; k++) {
      const cv = figs[k].querySelector('canvas'), r = cv.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const hit = E.pickTile(S, P, techs[k], view(), cv.clientWidth, cv.clientHeight, e.clientX - r.left, e.clientY - r.top);
      return placeMark(hit.tile);
    }
  }
  /* Pocket view: a click in the world on a Diorama chooses that room (the same as its chip); in the pocket itself a click does nothing (another chip or Whole map goes back) */
  function clickRoom(e) {
    if (!S || !S.roomMap || S.pocket) return;
    const figs = [...$('#stage').children].filter((f) => !f.hidden), techs = st.mode === 'compare' ? ['box', 'A', 'B'] : [st.tech];
    for (let k = 0; k < figs.length; k++) {
      const cv = figs[k].querySelector('canvas'), r = cv.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const hit = E.pickTile(S, P, techs[k], view(), cv.clientWidth, cv.clientHeight, e.clientX - r.left, e.clientY - r.top);
      const id = hit.tile >= 0 ? S.roomMap[hit.tile] : 0, o = id > 0 && S.types ? S.types.rooms.get(id) : null;
      if (o && o.type === E.roomTypes.DIORAMA) { sliceSel.whole = false; sliceSel.rooms.clear(); sliceSel.rooms.add(id); syncRoomChips(); refreshMessage(); invalidate(true); }
      return;
    }
  }
  function placeMark(tile) {
    const note = (t) => { $('#incInfo').innerHTML = t; };
    if (tile < 0) return note('Nothing under the cursor.');
    const x = S.ox + (tile % S.W), y = S.oy + ((tile / S.W) | 0);
    if (inc.mode === 'rm') {
      const near = (m) => Math.hypot(m.x - x, m.y - y) <= 1.5;
      if (inc.stake && near(inc.stake)) inc.stake = null; else { const k = inc.objectives.findIndex(near); if (k >= 0) inc.objectives.splice(k, 1); else return note('No mark there.'); }
    } else {
      if (S.slice && !S.slice[tile]) return note(`(${x}, ${y}) is outside the slice: movement is limited to the slice.`);
      if (S.block[tile]) return note(`(${x}, ${y}) is not walkable (water or void).`);
      if (S.isolated && S.isolated[tile]) return note(`(${x}, ${y}) is isolated terrain (a walkable region under ${S.walkInfo.limit} tiles): decorative, no stake or objective there.`);
      if (!E.tileWalkable(S, tile)) return note(`(${x}, ${y}) is in the margin of a wall, a cliff or a steep slope: not walkable with rooms on. Pick a tile a little further in.`);
      if (inc.mode === 'stake') inc.stake = { x, y }; else inc.objectives.push({ x, y });
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
    box.innerHTML = ''; $('#zoneHint').hidden = $('#zoneBtns').hidden = !z;
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
  function buildRoomChips() {
    const box = $('#roomChips'), on = !!(S && S.rooms);
    $('#roomHint').hidden = $('#roomBtns').hidden = !on;
    if (!on) { box.innerHTML = ''; st.roomChipsKey = null; return; }
    if (st.roomChipsKey === S.rooms.room) { syncRoomChips(); return; }
    st.roomChipsKey = S.rooms.room; box.innerHTML = '';
    const ids = new Set(S.rooms.rooms.map((r) => r.id)); for (const id of [...sliceSel.rooms]) if (!ids.has(id)) sliceSel.rooms.delete(id);
    for (const r of S.rooms.rooms) {
      const b = document.createElement('button'); b.className = 'chip'; b.dataset.id = r.id;
      b.innerHTML = `<i style="background:hsl(${E.rooms.hue(r.id).toFixed(0)},55%,50%)"></i>${r.id} <small>${S.rooms.roomSizes[r.id]}</small>`;
      b.addEventListener('click', (e) => {
        sliceSel.whole = false;
        if (e.ctrlKey || e.shiftKey || e.metaKey) { sliceSel.rooms.has(r.id) ? sliceSel.rooms.delete(r.id) : sliceSel.rooms.add(r.id); } else { sliceSel.rooms.clear(); sliceSel.rooms.add(r.id); }
        syncRoomChips(); refreshMessage(); invalidate(true);
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
      $('#src').value = 'image'; st.pack = 'image'; onPackChanged(); invalidate(true);
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

  function view() {
    const p = PRESETS.find((x) => x.id === st.preset);
    if (p.kind === 'oblique') return { kind: 'oblique', yaw: 0, pitch: 0, zoom: st.zoom, panX: st.panX, panY: st.panY, fitSc: st.fitSc }; // Cam 7 has no angle: the drag variation does not apply
    const pk = packs[st.pack] && packs[st.pack].pack, sy0 = p.kind === 'persp' && pk && pk.stageYaw ? pk.stageYaw : p.yaw; // a pack may declare stageYaw (degrees): the yaw of Cam 6 (no UI)
    return { kind: p.kind, yaw: sy0 + st.yawOff, pitch: Math.max(15, Math.min(89, p.pitch + st.pitchOff)), zoom: st.zoom, panX: st.panX, panY: st.panY, fitSc: st.fitSc, persH: st.persH };
  }

  function draw() {
    raf = 0;
    if (!S) {
      const pack = packs[st.pack].pack;
      try {
        S = E.shape(pack, P, sliceSpec());
        if (S.sliceInfo && S.sliceInfo.warnings.length) message([...(pack.warnings || []), ...S.sliceInfo.warnings].join(' '));
      } catch (e) { message(e.message); S = E.shape(pack, P, null); }
      buildRoomChips();
      st.rooms = S.rooms ? { ms: S.rooms.ms, total: Object.values(S.rooms.ms).reduce((x, y) => x + y, 0) } : null;
    }
    const incursion = computeIncursion(); O.incursion = incursion;
    $('#incInfo').innerHTML = incursion.lines.join('<br>') || (inc.mode ? '' : 'No stake or objectives.');
    const techs = st.mode === 'compare' ? ['box', 'A', 'B'] : [st.tech];
    const stage = $('#stage'); stage.dataset.n = techs.length;
    const layout = st.layout === 'auto' ? (st.preset.startsWith('iso') ? 'rows' : 'columns') : st.layout; // rows in isometric: the diamond is twice as wide as tall
    stage.dataset.layout = layout; $('#layout').hidden = st.mode !== 'compare';
    while (stage.children.length < techs.length) {
      const f = document.createElement('figure'); f.innerHTML = '<canvas></canvas><figcaption></figcaption>'; stage.appendChild(f);
    }
    [...stage.children].forEach((f, i) => { f.hidden = i >= techs.length; });
    // one camera for every panel: the same scale (px per tile, fitted to the first panel) around the same point of the map
    const f0 = stage.children[0]; st.persH = f0.clientHeight; st.fitSc = E.fitScale(S, P, view(), f0.clientWidth, f0.clientHeight); // persH: the first panel's height, so Cam 6 has one camera for every panel
    const token = ++drawToken, v = view(), t0 = st.t0 || performance.now();
    const bKey = 'Bready:' + P.radius + ':' + P.anchor, needB = techs.includes('B') && !S.cache[bKey];
    const paint = (t, i) => {
      const f = stage.children[i], cv = f.querySelector('canvas'), pend = f.querySelector('.pending');
      if (pend) pend.remove();
      const r = E.render(cv, S, P, t, v, O);
      f.querySelector('figcaption').innerHTML = `<b>${TECH.find((x) => x[0] === t)[1]}</b><span>${r.polys} polys · ${r.walls} walls · ${r.verts} verts · ${r.ms.toFixed(0)} ms</span>`;
      if (t === 'B') S.cache[bKey] = true;
    };
    const surv = {}, survOf = (t, late) => { if (t !== 'box' && techs.includes(t) && (late || !(t === 'B' && needB))) surv[t] = E.stairSurvival(S, P, t); };
    techs.forEach((t, i) => {
      if (t === 'B' && needB) { // painted after the other panels: the first draw of B is the slow one
        const f = stage.children[i], cv = f.querySelector('canvas'), ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
        cv.width = f.clientWidth * dpr | 0; cv.height = f.clientHeight * dpr | 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#171424'; ctx.fillRect(0, 0, cv.width, cv.height);
        if (!f.querySelector('.pending')) { const d = document.createElement('div'); d.className = 'pending'; d.textContent = 'computing…'; f.appendChild(d); }
        f.querySelector('figcaption').innerHTML = `<b>${TECH.find((x) => x[0] === t)[1]}</b><span>computing…</span>`;
      } else paint(t, i);
    });
    for (const t of techs) survOf(t);
    const firstMs = performance.now() - t0;
    st.timing = { cold: !!st.cold, first: firstMs, all: needB ? null : firstMs, layout, techs: techs.slice() };
    const finish = () => {
      if (token !== drawToken || !S) return;
      if (needB) { techs.forEach((t, i) => { if (t === 'B') paint(t, i); }); survOf('B', true); st.timing.all = performance.now() - t0; }
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
  function ascText() { const a = S.ascWalls; return a ? ` · <b>Ascension walls</b>: ${a.info.faces} faces in ${a.info.runs} chains (${a.info.candidates} candidate faces, ${a.info.dropped} dropped: chains of fewer than 3)` : ''; }
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
    return x;
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
    const sinf = S.stairInfo, stairText = `${sinf.gates} gates · ${sinf.placed} stairs of ${sinf.sites} sites` + (sinf.dropped ? `, ${sinf.dropped} not carved` : '') + (sinf.narrowed ? `, ${sinf.narrowed} narrowed` : '') + (sinf.fills ? `, ${sinf.fills} built up` : '') + ` · stair coverage A ${sv('A')} · B ${sv('B')}`;
    const bi = S.borderInfo, borderText = bi ? ` · slice border faces: ${bi.barrier} barrier (red) · ${bi.pass} pass (cyan) · ${bi.none} unmarked (yellow) · ${bi.mapEdge} map edge (white)` : '';
    const rs = S.regionSizes, tot = rs.reduce((a, b) => a + b, 0), big = Math.max(...rs, 0);
    const zn = S.fields.zone ? ` · ${S.fields.zone.info.classes.length} zones` : '';
    const si = S.sliceInfo, sinfo = si ? `slice ${si.tiles} tiles · window ${si.window.w}×${si.window.h} at (${si.window.x0}, ${si.window.y0}) of ${S.mapW}×${S.mapH}` : 'whole map';
    $('#sliceInfo').textContent = sinfo;
    $('#info').innerHTML = `<b>${S.name}</b> · ${S.mapW}×${S.mapH}${zn} · ${S.levelCount.terraces} terraces, ${S.levelCount.levels} levels in the ${si ? 'slice' : 'map'} · ${stairText}${borderText} · ${rs.length} regions in the ${si ? 'slice' : 'map'} (${Math.max(0, rs.length - 1)} not connected to the largest), largest ${(big / tot * 100).toFixed(0)}%` + roomsText() + typesText() + ascText() + pocketText();
  }

  function init() {
    setPack('snake_surface', 'Snake Mountain surface (macroform, outer surface only)', window.EVO_PACKS.snake_mountain_surface);
    setPack('snake', 'Snake Mountain (macroform, caves subtracted)', window.EVO_PACKS.snake_mountain);
    setPack('shrine_pier', 'Shrine-Pier (semantic landmarks)', window.EVO_PACKS.shrine_pier);
    setPack('shrine_pier_x4', 'Shrine-Pier x4 (decompressed, derived)', window.EVO_PACKS.shrine_pier_x4);
    setPack('noise', 'Value noise 48×48 (base stand-in)', E.noisePack(48, 48, 7));
    build();
    invalidate(true);
    window.__evo = { clickRoom, timing: () => st.timing, roomsTiming: () => st.rooms, inc, setIncMode, clickMap, placeMark, P, O, st, packs, sliceSel, S: () => S, sliceSpec, view, draw: () => invalidate(true), set: (o) => Object.assign(st, o) };
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})(window.EVO = window.EVO || {});
