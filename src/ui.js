/* UI wiring */
(function (E) {
  const $ = (s) => document.querySelector(s);
  const P = { terraces: 5, subs: 3, terH: 1.0, subH: 0.22, minPlateau: 5, minSub: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2, tread: 2, stairW: 2, gateThr: 0.05, gateMin: 3, margin: 24 };
  const O = { outlines: true, gradient: true, features: true, regions: false, veil: true, border: true, markers: true, passes: false, zones: false, edges: false, masks: false };
  const PRESETS = [
    { id: 'oblique', label: 'Oblique 50°', yaw: 0, pitch: 50 },
    { id: 'low', label: 'Low 28°', yaw: 0, pitch: 28 },
    { id: 'isoE', label: 'Iso 45°', yaw: 45, pitch: 35 },
    { id: 'isoW', label: 'Iso −45°', yaw: -45, pitch: 35 },
    { id: 'top', label: 'Top 80°', yaw: 0, pitch: 80 }
  ];
  const SLIDERS = [
    ['Shaping', [['terraces', 'Terraces', 2, 24, 1], ['subs', 'Sub-terraces / terrace', 1, 6, 1], ['terH', 'Terrace height', 0.4, 2.5, 0.05], ['subH', 'Sub-terrace height', 0.05, 0.5, 0.01], ['minPlateau', 'Min plateau (tiles)', 1, 20, 1], ['minSub', 'Min sub-terrace patch', 1, 12, 1], ['pre', 'Pre-smooth', 0, 3, 1]]],
    ['Technique A / B', [['smooth', 'A · Chaikin passes', 0, 4, 1], ['radius', 'B · Field blur (tiles)', 0, 2.5, 0.1]]],
    ['Passes', [['climb', 'Climb limit, sub-terraces (provisional)', 1, 5, 1], ['gateThr', 'Gate slope threshold', 0, 0.3, 0.005], ['gateMin', 'Min gate size, tiles', 1, 20, 1], ['passGap', 'Stair spacing (long gates)', 3, 20, 1], ['tread', 'Tread rise, sub-terraces', 1, 5, 1], ['stairW', 'Stair width (tiles)', 1, 3, 1]]],
    ['Slice', [['margin', 'Scenery margin (tiles)', 0, 128, 1]]]
  ];
  const TOGGLES = [['outlines', 'Outlines'], ['gradient', 'Cliff gradient'], ['features', 'Water / snake / cave'], ['markers', 'Landmarks'], ['regions', 'Walk regions'], ['passes', 'Stair marks'], ['veil', 'Veil outside the slice'], ['border', 'Slice border line'], ['zones', 'Zones (from roles)'], ['edges', 'Edge map (from roles)'], ['masks', 'Path / vegetation / POI']];
  const TECH = [['box', 'Box (reference)'], ['A', 'A · Contour polygons'], ['B', 'B · Distance field']];

  const packs = {};
  const st = { pack: 'snake', mode: 'compare', tech: 'A', preset: 'oblique', zoom: 1, yawOff: 0, pitchOff: 0, panX: 0, panY: 0 };
  let S = null, raf = 0;

  function setPack(id, label, pack) {
    packs[id] = { label, pack };
    let o = [...$('#src').options].find((x) => x.value === id);
    if (!o) { o = document.createElement('option'); o.value = id; $('#src').appendChild(o); }
    o.textContent = label;
  }
  function message(text) { const m = $('#msg'); m.textContent = text || ''; m.hidden = !text; }

  function build() {
    const sl = $('#sliders');
    for (const [title, list] of SLIDERS) {
      const h = document.createElement('h3'); h.textContent = title; sl.appendChild(h);
      for (const [k, label, mn, mx, step] of list) {
        const row = document.createElement('label'); row.className = 'sl';
        row.innerHTML = `<span>${label}</span><output id="o-${k}"></output><input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${step}">`;
        sl.appendChild(row);
        const inp = row.querySelector('input'), out = row.querySelector('output');
        inp.value = P[k]; out.textContent = P[k];
        inp.addEventListener('input', () => { out.textContent = inp.value; }); // label only while dragging
        inp.addEventListener('change', () => { P[k] = +inp.value; out.textContent = P[k]; refreshMessage(); invalidate(true); }); // recompute on release
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
      const b = document.createElement('button'); b.textContent = p.label; b.dataset.id = p.id;
      b.addEventListener('click', () => { st.preset = p.id; st.yawOff = 0; st.pitchOff = 0; st.panX = st.panY = 0; st.zoom = 1; invalidate(false); });
      pb.appendChild(b);
    }
    const tb = $('#techs');
    for (const [id, label] of TECH) {
      const b = document.createElement('button'); b.textContent = label; b.dataset.id = id;
      b.addEventListener('click', () => { st.tech = id; st.mode = 'single'; invalidate(false); });
      tb.appendChild(b);
    }
    $('#mode').addEventListener('click', () => { st.mode = st.mode === 'single' ? 'compare' : 'single'; invalidate(false); });
    $('#src').addEventListener('change', (e) => { st.pack = e.target.value; for (const id of cropIds) $('#' + id).value = ''; onPackChanged(); refreshMessage(); invalidate(true); }); // a crop belongs to one map
    buildRoles();
    $('#wholeMap').addEventListener('click', () => { sliceSel.whole = true; sliceSel.zones.clear(); syncChips(); refreshMessage(); invalidate(true); });
    for (const id of cropIds) $('#' + id).addEventListener('change', () => { refreshMessage(); invalidate(true); });
    $('#file').addEventListener('change', (e) => loadFiles(e.target.files));
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
    $('#stage').addEventListener('pointerup', () => { drag = null; });
    $('#stage').addEventListener('dblclick', () => $('#reset').click());
    $('#stage').addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ---- slice ---- */
  const sliceSel = { zones: new Set(), whole: false };
  const cropIds = ['cx0', 'cy0', 'cx1', 'cy1'];
  function sliceSpec() {
    const pack = packs[st.pack].pack, spec = { margin: P.margin };
    if (pack.fields && pack.fields.zone && sliceSel.zones.size && !sliceSel.whole) spec.zones = [...sliceSel.zones].sort((a, b) => a - b);
    const v = cropIds.map((id) => $('#' + id).value.trim());
    if (v.some((x) => x !== '')) {
      const d = [0, 0, pack.width, pack.height];
      spec.rect = v.map((x, k) => (x === '' ? d[k] : Math.max(0, Math.round(+x) || 0)));
    }
    return spec.zones || spec.rect ? spec : null;
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
  function syncChips() {
    document.querySelectorAll('#zoneChips .chip').forEach((b) => b.classList.toggle('on', !sliceSel.whole && sliceSel.zones.has(+b.dataset.id)));
    $('#wholeMap').classList.toggle('on', sliceSel.whole);
  }
  function refreshMessage() { const p = packs[st.pack] && packs[st.pack].pack; message(p && p.warnings ? p.warnings.join(' ') : ''); }
  function onPackChanged() { buildChips(packs[st.pack].pack); }

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
    const json = E.buildManifest({ name: imgs.map((i) => i.name).join(' + '), flipY: $('#flipy').checked, maxnode: maxnode(), roles, markers: manifest ? manifest.markers : [], slice: manifestSlice() });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2) + '\n'], { type: 'application/json' }));
    a.download = 'pack.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function invalidate(reshape) {
    if (reshape) { S = null; $('#busy').hidden = false; } // painted before the (possibly slow) recompute starts
    if (!raf) raf = requestAnimationFrame(() => setTimeout(draw, 0));
  }

  function view() {
    const p = PRESETS.find((x) => x.id === st.preset);
    return { yaw: p.yaw + st.yawOff, pitch: Math.max(15, Math.min(89, p.pitch + st.pitchOff)), zoom: st.zoom, panX: st.panX, panY: st.panY };
  }

  function draw() {
    raf = 0;
    if (!S) {
      const pack = packs[st.pack].pack;
      try {
        S = E.shape(pack, P, sliceSpec());
        if (S.sliceInfo && S.sliceInfo.warnings.length) message([...(pack.warnings || []), ...S.sliceInfo.warnings].join(' '));
      } catch (e) { message(e.message); S = E.shape(pack, P, null); }
    }
    const techs = st.mode === 'compare' ? ['box', 'A', 'B'] : [st.tech];
    const stage = $('#stage'); stage.dataset.n = techs.length;
    while (stage.children.length < techs.length) {
      const f = document.createElement('figure'); f.innerHTML = '<canvas></canvas><figcaption></figcaption>'; stage.appendChild(f);
    }
    [...stage.children].forEach((f, i) => { f.hidden = i >= techs.length; });
    techs.forEach((t, i) => {
      const f = stage.children[i], cv = f.querySelector('canvas');
      const r = E.render(cv, S, P, t, view(), O);
      f.querySelector('figcaption').innerHTML = `<b>${TECH.find((x) => x[0] === t)[1]}</b><span>${r.polys} polys · ${r.walls} walls · ${r.verts} verts · ${r.ms.toFixed(0)} ms</span>`;
    });
    document.querySelectorAll('#presets button').forEach((b) => b.classList.toggle('on', b.dataset.id === st.preset));
    document.querySelectorAll('#techs button').forEach((b) => b.classList.toggle('on', st.mode === 'single' && b.dataset.id === st.tech));
    $('#mode').textContent = st.mode === 'compare' ? 'Compare: on' : 'Compare: off';
    $('#mode').classList.toggle('on', st.mode === 'compare');
    const eff = E.subHeight(P), note = $('#subHnote');
    note.hidden = eff >= P.subH - 1e-9;
    note.textContent = `Sub-terrace height limited to ${eff.toFixed(3)} (set ${P.subH}) so the gap to the next terrace stays above the climb limit.`;
    const surv = {}; for (const t of techs) if (t !== 'box') surv[t] = E.stairSurvival(S, P, t);
    const sv = (t) => (surv[t] ? `${(surv[t].coverage * 100).toFixed(1)}%` + (surv[t].lost ? `, ${surv[t].lost}/${surv[t].n} lost` : '') + (surv[t].degraded ? `, ${surv[t].degraded} degraded` : '') : '–');
    const sinf = S.stairInfo, stairText = `${sinf.gates} gates · ${sinf.placed} stairs of ${sinf.sites} sites` + (sinf.dropped ? `, ${sinf.dropped} not carved` : '') + (sinf.narrowed ? `, ${sinf.narrowed} narrowed` : '') + (sinf.fills ? `, ${sinf.fills} built up` : '') + ` · stair coverage A ${sv('A')} · B ${sv('B')}`;
    const rs = S.regionSizes, tot = rs.reduce((a, b) => a + b, 0), big = Math.max(...rs, 0);
    const zn = S.fields.zone ? ` · ${S.fields.zone.info.classes.length} zones` : '';
    const si = S.sliceInfo, sinfo = si ? `slice ${si.tiles} tiles · window ${si.window.w}×${si.window.h} at (${si.window.x0}, ${si.window.y0}) of ${S.mapW}×${S.mapH}` : 'whole map';
    $('#sliceInfo').textContent = sinfo;
    $('#busy').hidden = true;
    $('#info').innerHTML = `<b>${S.name}</b> · ${S.mapW}×${S.mapH}${zn} · ${S.levelCount.terraces} terraces, ${S.levelCount.levels} levels in the ${si ? 'slice' : 'map'} · ${stairText} · ${rs.length} regions in the ${si ? 'slice' : 'map'} (${Math.max(0, rs.length - 1)} not connected to the largest), largest ${(big / tot * 100).toFixed(0)}%`;
  }

  function init() {
    setPack('snake', 'Snake Mountain (macroform)', window.EVO_PACKS.snake_mountain);
    setPack('noise', 'Value noise 48×48 (base stand-in)', E.noisePack(48, 48, 7));
    build();
    invalidate(true);
    window.__evo = { P, O, st, packs, sliceSel, S: () => S, sliceSpec, view, draw: () => invalidate(true), set: (o) => Object.assign(st, o) };
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})(window.EVO = window.EVO || {});
