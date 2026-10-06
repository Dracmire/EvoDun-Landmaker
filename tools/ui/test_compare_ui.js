/* Compare mode: layouts (columns / rows, automatic = rows in isometric), one camera for all panels (same scale, same point of the map,
   also after zoom, pan and a preset change), B painted after Box and A with "computing…" in its panel, stake and routes in every panel,
   clicks in any panel. Timings: time to the first panels (Box + A) and to all three, cold.
     NODE_PATH=$(npm root -g) node tools/ui/test_compare_ui.js */
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 800 }), page = a.page, ok = a.ok;
  await a.load('maps'); await a.zone(6);
  const state = () => page.evaluate(() => {
    const ev = window.__evo, S = ev.S(), E = window.EVO, stage = document.querySelector('#stage');
    const figs = [...stage.children].filter((f) => !f.hidden), v = ev.view();
    const panels = figs.map((f) => { const cv = f.querySelector('canvas'), r = f.getBoundingClientRect(); return { w: cv.clientWidth, h: cv.clientHeight, left: r.left, top: r.top, cam: E.makeCam(S, ev.P, v, cv.clientWidth, cv.clientHeight) }; });
    const probe = [[10.5, 12.5, 0], [30.5, 40.5, 2], [S.W - 3.5, S.H - 4.5, 1]].map(([x, y, h]) => panels.map((p) => { const q = p.cam.p(x, y, h); return [q[0] - p.w / 2, q[1] - p.h / 2]; }));
    return { layout: stage.dataset.layout, n: figs.length, sizes: panels.map((p) => [Math.round(p.w), Math.round(p.h)]), sc: panels.map((p) => p.cam.sc), probe, tops: panels.map((p) => Math.round(p.top)), lefts: panels.map((p) => Math.round(p.left)), pending: figs.filter((f) => f.querySelector('.pending')).length };
  });
  const sameCamera = (s) => s.sc.every((v) => Math.abs(v - s.sc[0]) < 1e-6) && s.probe.every((row) => row.every((q) => Math.abs(q[0] - row[0][0]) < 1e-6 && Math.abs(q[1] - row[0][1]) < 1e-6));

  // 1. layouts
  let s = await state();
  ok('compare is on by default with 3 panels', s.n === 3, JSON.stringify(s));
  ok('auto, Oblique: columns (3 panels side by side)', s.layout === 'columns' && new Set(s.tops).size === 1 && new Set(s.lefts).size === 3, JSON.stringify([s.layout, s.tops, s.lefts]));
  await a.preset('isoE'); s = await state();
  ok('auto, Iso 45: rows (3 panels stacked, each as wide as the stage)', s.layout === 'rows' && new Set(s.lefts).size === 1 && new Set(s.tops).size === 3 && s.sizes.every((z) => z[0] === s.sizes[0][0]), JSON.stringify([s.layout, s.sizes]));
  ok('rows: panels are wider than in columns (about 3x)', s.sizes[0][0] > 1000, JSON.stringify(s.sizes));
  await page.selectOption('#layout', 'columns'); await a.idle(); s = await state();
  ok('manual columns overrides auto in Iso', s.layout === 'columns' && new Set(s.tops).size === 1, s.layout);
  await page.selectOption('#layout', 'rows'); await a.preset('oblique'); s = await state();
  ok('manual rows overrides auto in Oblique', s.layout === 'rows' && new Set(s.tops).size === 3, s.layout);
  await page.selectOption('#layout', 'auto'); await a.idle();
  ok('the layout selector is hidden in single technique mode', await (async () => { await page.click('#mode'); await a.idle(); const hidden = await page.$eval('#layout', (e) => e.hidden); await page.click('#mode'); await a.idle(); return hidden; })());

  // 2. one camera for all panels
  for (const preset of ['oblique', 'isoE', 'isoW', 'low', 'top']) {
    await a.preset(preset); s = await state();
    ok(`one camera in ${preset} (${s.layout}): same px per tile and the same point at the same place in every panel`, sameCamera(s), JSON.stringify(s.sc));
  }
  await a.preset('oblique');
  await page.mouse.move(700, 400); await page.mouse.wheel(0, -300); await a.idle(); s = await state();
  ok('after zooming with the wheel the cameras are still identical', sameCamera(s), JSON.stringify(s.sc));
  const zoomed = s.sc[0];
  // drag (pan with shift) in the LAST panel moves every panel
  const before = s.probe[0][0].slice(), box = await page.evaluate(() => { const f = [...document.querySelector('#stage').children].filter((x) => !x.hidden)[2].getBoundingClientRect(); return [f.left + f.width / 2, f.top + f.height / 2]; });
  await page.keyboard.down('Shift'); await page.mouse.move(box[0], box[1]); await page.mouse.down(); await page.mouse.move(box[0] + 40, box[1] + 25, { steps: 4 }); await page.mouse.up(); await page.keyboard.up('Shift'); await a.idle();
  s = await state();
  ok('panning in the third panel moves all of them the same', sameCamera(s) && Math.abs(s.probe[0][0][0] - before[0]) > 20, JSON.stringify([before, s.probe[0][0]]));
  await page.click('#reset'); await a.idle();
  // panels of different size still share the scale: force a non-square split by resizing the window
  await page.setViewportSize({ width: 1100, height: 700 }); await a.idle(); await page.waitForTimeout(400); s = await state();
  ok('after resizing the window the cameras are identical', sameCamera(s), JSON.stringify([s.sizes, s.sc]));
  await page.setViewportSize({ width: 1500, height: 800 }); await a.idle();

  // 3. B is painted after Box and A, with a placeholder; timings
  const probe = await page.evaluate(() => new Promise((resolve) => {
    const ev = window.__evo, seen = { pending: 0, boxFirst: false }; const t0 = performance.now();
    const set = document.querySelector('#s-terraces'); set.value = 7; set.dispatchEvent(new Event('change', { bubbles: true }));
    const tick = () => {
      const figs = [...document.querySelector('#stage').children].filter((f) => !f.hidden);
      const p = figs.map((f) => !!f.querySelector('.pending'));
      if (p[2] && !p[0] && !p[1]) seen.pending++;
      const tm = ev.timing(); if (tm && tm.all !== null && tm.cold && performance.now() - t0 > 50) { resolve({ seen, tm }); return; }
      if (performance.now() - t0 > 60000) { resolve({ seen, tm, timeout: true }); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  ok('while B computes its panel says "computing…" and Box and A are already painted', probe.seen.pending > 0 && !probe.timeout, JSON.stringify(probe));
  ok('time to the first panels is shorter than to all three', probe.tm.first < probe.tm.all, JSON.stringify(probe.tm));
  console.log(`cold timing (7 terraces, zone 6): first panels (shape + Box + A) ${probe.tm.first.toFixed(0)} ms, all three ${probe.tm.all.toFixed(0)} ms`);
  await a.idle();
  ok('after B finishes the info line has its stair coverage', /B [\d.]+%/.test(await page.$eval('#info', (e) => e.innerText)));
  ok('a camera move afterwards only paints (no "computing…" again)', await (async () => { await page.mouse.move(700, 400); await page.mouse.wheel(0, 120); await page.waitForTimeout(150); const s2 = await state(); const tm = await page.evaluate(() => window.__evo.timing()); return s2.pending === 0 && tm.all === tm.first; })());
  await a.slider('terraces', 5); await a.idle();

  // 4. stake and routes in every panel; clicks in any panel
  const tiles = await page.evaluate(() => { const S = window.__evo.S(), big = S.regionSizes.indexOf(Math.max(...S.regionSizes)), A = []; for (let i = 0; i < S.n; i++) if (S.region[i] === big && !S.block[i]) A.push(i); return [A[(A.length * 0.3) | 0], A[(A.length * 0.8) | 0]]; });
  await page.evaluate(([s0, o0]) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(s0); ev.setIncMode('obj'); ev.placeMark(o0); ev.setIncMode(null); }, tiles);
  await a.idle();
  for (const preset of ['oblique', 'isoE']) {
    await a.preset(preset);
    const hit = await page.evaluate(() => {
      const ev = window.__evo, S = ev.S(), E = window.EVO, v = ev.view(), route = ev.O.incursion.objectives[0].route, ramps = new Map();
      for (const st of S.stairs) if (st.ramp) for (const sp of st.steps) for (const t of sp.tiles) ramps.set(t, st);
      return [...document.querySelector('#stage').children].filter((f) => !f.hidden).map((f) => {
        const cv = f.querySelector('canvas'), cam = E.makeCam(S, ev.P, v, cv.clientWidth, cv.clientHeight), ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth; let n = 0, tot = 0;
        for (const i of route) {
          const h = (ramps.has(i) ? E.rampHeight(ramps.get(i), i % S.W + 0.5, ((i / S.W) | 0) + 0.5, i) : S.levelH[S.fine[i]]) + 0.06, p = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, h);
          if (p[0] < 3 || p[1] < 3 || p[0] > cv.clientWidth - 3 || p[1] > cv.clientHeight - 3) continue;
          tot++; const d = ctx.getImageData(Math.round(p[0] * dpr) - 1, Math.round(p[1] * dpr) - 1, 3, 3).data; let f2 = false;
          for (let k = 0; k < 36; k += 4) if (Math.abs(d[k] - 255) + Math.abs(d[k + 1] - 176) + Math.abs(d[k + 2] - 32) < 60) f2 = true;
          if (f2) n++;
        }
        return { n, tot };
      });
    });
    ok(`${preset}: the route is drawn in all three panels`, hit.length === 3 && hit.every((h) => h.tot > 10 && h.n >= 0.9 * h.tot), JSON.stringify(hit));
  }
  // real clicks in each panel place the same tile
  await a.preset('oblique'); await page.click('#m-clear');
  const target = await page.evaluate(() => { const S = window.__evo.S(); for (let i = S.n / 2 | 0; i < S.n; i++) if (!S.block[i] && S.slice[i] && !S.carved[i]) return i; return -1; });
  const placed = [];
  for (let k = 0; k < 3; k++) {
    await page.click('#m-stake');
    const pt = await page.evaluate(([t, k2]) => { const ev = window.__evo, S = ev.S(), E = window.EVO, f = [...document.querySelector('#stage').children].filter((x) => !x.hidden)[k2], cv = f.querySelector('canvas'), r = cv.getBoundingClientRect(), cam = E.makeCam(S, ev.P, ev.view(), cv.clientWidth, cv.clientHeight), p = cam.p(t % S.W + 0.5, ((t / S.W) | 0) + 0.5, S.levelH[S.fine[t]]); return [r.left + p[0], r.top + p[1]]; }, [target, k]);
    await page.mouse.click(pt[0], pt[1]); placed.push(await page.evaluate(() => JSON.stringify(window.__evo.inc.stake)));
    await page.click('#m-clear');
  }
  ok('a click in each panel (Box, A, B) places the stake on the same tile', placed.every((p) => p === placed[0]) && placed[0] !== 'null', JSON.stringify(placed));
  console.log('errors:', a.errs); await a.browser.close();
})();
