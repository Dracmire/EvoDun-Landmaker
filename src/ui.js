/* UI wiring */
(function (E) {
  const $ = (s) => document.querySelector(s);
  const P = { terraces: 5, micro: 3, terH: 1.0, microH: 0.22, minPlateau: 5, minMicro: 3, pre: 1, smooth: 2, radius: 0.9, passGap: 8, climb: 2 };
  const O = { outlines: true, gradient: true, features: true, regions: false, veil: false, markers: true, passes: false };
  const PRESETS = [
    { id: 'oblique', label: 'Oblique 50°', yaw: 0, pitch: 50 },
    { id: 'low', label: 'Low 28°', yaw: 0, pitch: 28 },
    { id: 'isoE', label: 'Iso 45°', yaw: 45, pitch: 35 },
    { id: 'isoW', label: 'Iso −45°', yaw: -45, pitch: 35 },
    { id: 'top', label: 'Top 80°', yaw: 0, pitch: 80 }
  ];
  const SLIDERS = [
    ['Shaping', [['terraces', 'Terraces', 2, 9, 1], ['micro', 'Micro steps / terrace', 1, 3, 1], ['terH', 'Terrace height', 0.4, 2.5, 0.05], ['microH', 'Micro step height', 0.05, 0.5, 0.01], ['minPlateau', 'Min plateau (tiles)', 1, 20, 1], ['minMicro', 'Min micro patch', 1, 12, 1], ['pre', 'Pre-smooth', 0, 3, 1]]],
    ['Technique A / B', [['smooth', 'A · Chaikin passes', 0, 4, 1], ['radius', 'B · Field blur (tiles)', 0, 2.5, 0.1]]],
    ['Passes', [['passGap', 'Stair spacing', 3, 20, 1]]]
  ];
  const TOGGLES = [['outlines', 'Outlines'], ['gradient', 'Cliff gradient'], ['features', 'Water / snake / cave'], ['markers', 'Landmarks'], ['regions', 'Walk regions'], ['passes', 'Stair marks'], ['veil', 'Incursion veil']];
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
        inp.addEventListener('input', () => { P[k] = +inp.value; out.textContent = P[k]; invalidate(true); });
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
    $('#src').addEventListener('change', (e) => { st.pack = e.target.value; message((packs[st.pack].pack.warnings || []).join(' ')); invalidate(true); });
    $('#file').addEventListener('change', (e) => loadImage(e.target.files[0]));
    $('#chan').addEventListener('change', () => { if (lastImg) useImage(); });
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

  let lastImg = null;
  function loadImage(f) {
    if (!f) return;
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); lastImg = { img, name: f.name }; useImage(); };
    img.onerror = () => { URL.revokeObjectURL(url); message(`Could not read "${f.name}" as an image.`); };
    img.src = url;
  }
  function useImage() {
    const pack = E.imagePack(lastImg.img, $('#chan').value, 96, lastImg.name);
    setPack('image', 'Image: ' + lastImg.name, pack);
    message(pack.warnings.join(' '));
    $('#src').value = 'image'; st.pack = 'image'; invalidate(true);
  }

  function invalidate(reshape) { if (reshape) S = null; if (!raf) raf = requestAnimationFrame(draw); }

  function view() {
    const p = PRESETS.find((x) => x.id === st.preset);
    return { yaw: p.yaw + st.yawOff, pitch: Math.max(15, Math.min(89, p.pitch + st.pitchOff)), zoom: st.zoom, panX: st.panX, panY: st.panY };
  }

  function draw() {
    raf = 0;
    if (!S) S = E.shape(packs[st.pack].pack, P);
    const techs = st.mode === 'compare' ? ['box', 'A', 'B'] : [st.tech];
    const stage = $('#stage'); stage.dataset.n = techs.length;
    while (stage.children.length < techs.length) {
      const f = document.createElement('figure'); f.innerHTML = '<canvas></canvas><figcaption></figcaption>'; stage.appendChild(f);
    }
    [...stage.children].forEach((f, i) => { f.hidden = i >= techs.length; });
    techs.forEach((t, i) => {
      const f = stage.children[i], cv = f.querySelector('canvas');
      const r = E.render(cv, S, P, t, view(), O);
      f.querySelector('figcaption').innerHTML = `<b>${TECH.find((x) => x[0] === t)[1]}</b><span>${r.polys} polys · ${r.walls} walls · ${r.verts} verts · ${r.ramps} ramps · ${r.ms.toFixed(0)} ms</span>`;
    });
    document.querySelectorAll('#presets button').forEach((b) => b.classList.toggle('on', b.dataset.id === st.preset));
    document.querySelectorAll('#techs button').forEach((b) => b.classList.toggle('on', st.mode === 'single' && b.dataset.id === st.tech));
    $('#mode').textContent = st.mode === 'compare' ? 'Compare: on' : 'Compare: off';
    $('#mode').classList.toggle('on', st.mode === 'compare');
    const rs = S.regionSizes, tot = rs.reduce((a, b) => a + b, 0), big = Math.max(...rs, 0);
    $('#info').innerHTML = `<b>${S.name}</b> · ${S.W}×${S.H} · ${S.maxFine + 1} levels · ${S.passes.length} stair passes · ${rs.length} walkable regions, largest ${(big / tot * 100).toFixed(0)}%`;
  }

  function init() {
    setPack('snake', 'Snake Mountain (macroform)', window.EVO_PACKS.snake_mountain);
    setPack('noise', 'Value noise 48×48 (base stand-in)', E.noisePack(48, 48, 7));
    build();
    invalidate(true);
    window.__evo = { P, O, st, draw: () => invalidate(true), set: (o) => Object.assign(st, o) };
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})(window.EVO = window.EVO || {});
