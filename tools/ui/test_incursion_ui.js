/* Stake, objectives and routes in the viewer: click wiring (real mouse clicks) in Box, A and B and two presets, route drawing, the
   "no route" explanation between regions, remove / clear / Esc, and the manifest (evodun-pack/0.3) with the marks in tiles of the
   whole map.   NODE_PATH=$(npm root -g) node tools/ui/test_incursion_ui.js */
const fs = require('fs');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 800 }), page = a.page;
  await a.load('maps'); await a.zone(6);
  await page.click('#mode'); await a.idle(); // single technique
  const ok = a.ok;
  const info = () => page.$eval('#incInfo', (e) => e.innerText);
  // choose tiles: a stake, an objective in the same region, an objective in another region (if any)
  const pick = await page.evaluate(() => {
    const S = window.__evo.S(), W = S.W, big = S.regionSizes.indexOf(Math.max(...S.regionSizes));
    const inReg = (r, skip) => { const out = []; for (let i = 0; i < S.n; i++) if (S.region[i] === r && !S.block[i]) out.push(i); return out; };
    const A = inReg(big), other = S.regionSizes.map((_, r) => r).filter((r) => r !== big && S.regionSizes[r] >= 1)[0];
    const B = other === undefined ? [] : inReg(other);
    return { A: [A[(A.length * 0.3) | 0], A[(A.length * 0.8) | 0]], B: B.length ? B[(B.length / 2) | 0] : -1, W, ox: S.ox, oy: S.oy, regions: S.regionSizes.length };
  });
  const xy = (t) => ({ x: pick.ox + (t % pick.W), y: pick.oy + Math.floor(t / pick.W) });
  console.log('regions in the slice:', pick.regions);
  // screen position of a tile centre in the stage, via the viewer's own camera, nudged to the nearest tile centre that picks itself
  const screenOf = (t) => page.evaluate((t) => {
    const ev = window.__evo, S = ev.S(), cv = document.querySelector('#stage canvas'), cam = window.EVO.makeCam(S, ev.P, ev.view(), cv.clientWidth, cv.clientHeight), r = cv.getBoundingClientRect();
    const tr = ev.st.tech, i = t, h = S.levelH[S.fine[i]], p = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, h);
    const hit = window.EVO.pickTile(S, ev.P, tr, ev.view(), cv.clientWidth, cv.clientHeight, p[0], p[1]);
    return { x: r.left + p[0], y: r.top + p[1], self: hit.tile === i, in: p[0] > 0 && p[0] < cv.clientWidth && p[1] > 0 && p[1] < cv.clientHeight };
  }, t);
  for (const tech of ['box', 'A', 'B']) for (const preset of ['oblique', 'isoE']) {
    await a.tech(tech); await a.preset(preset);
    await page.click('#m-clear');
    const results = [];
    for (const [mode, tile] of [['#m-stake', pick.A[0]], ['#m-obj', pick.A[1]]]) {
      const sp = await screenOf(tile);
      if (!sp.self || !sp.in) { results.push(`${mode} tile ${tile} not directly visible, skipped`); continue; }
      await page.click(mode); await page.mouse.click(sp.x, sp.y); results.push(sp);
    }
    const marks = await page.evaluate(() => ({ stake: window.__evo.inc.stake, obj: window.__evo.inc.objectives, mode: window.__evo.inc.mode }));
    const both = results.every((r) => r && r.self !== undefined);
    if (both) {
      ok(`${tech} ${preset}: click places the stake on the tile under the cursor`, JSON.stringify(marks.stake) === JSON.stringify(xy(pick.A[0])), JSON.stringify(marks.stake));
      ok(`${tech} ${preset}: click places an objective, mode stays on for more`, marks.obj.length === 1 && JSON.stringify(marks.obj[0]) === JSON.stringify(xy(pick.A[1])) && marks.mode === 'obj', JSON.stringify(marks));
      await a.idle(); const t = await info();
      ok(`${tech} ${preset}: the info gives the route length`, /route of \d+ tiles to the stake/.test(t), t);
      // the route is drawn on top of everything: its tiles show the route colour (or the dark case) in the canvas
      const drawn = await page.evaluate(() => {
        const ev = window.__evo, S = ev.S(), cv = document.querySelector('#stage canvas'), cam = window.EVO.makeCam(S, ev.P, ev.view(), cv.clientWidth, cv.clientHeight), ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth;
        const inc = ev.O.incursion, route = inc.objectives[0].route, ramps = new Map();
        for (const st of S.stairs) if (st.ramp) for (const s of st.steps) for (const t of s.tiles) ramps.set(t, st);
        let hit = 0, tot = 0;
        for (const i of route) {
          const h = (ramps.has(i) ? window.EVO.rampHeight(ramps.get(i), i % S.W + 0.5, ((i / S.W) | 0) + 0.5, i) : S.levelH[S.fine[i]]) + 0.06, p = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, h);
          if (p[0] < 3 || p[1] < 3 || p[0] > cv.clientWidth - 3 || p[1] > cv.clientHeight - 3) continue;
          tot++; const d = ctx.getImageData(Math.round(p[0] * dpr) - 1, Math.round(p[1] * dpr) - 1, 3, 3).data; let f = false;
          for (let k = 0; k < 36; k += 4) if (Math.abs(d[k] - 255) + Math.abs(d[k + 1] - 176) + Math.abs(d[k + 2] - 32) < 60) f = true;
          if (f) hit++;
        }
        return { hit, tot };
      });
      ok(`${tech} ${preset}: the route is drawn over every tile it crosses (${drawn.hit}/${drawn.tot})`, drawn.tot > 0 && drawn.hit >= 0.95 * drawn.tot, JSON.stringify(drawn));
    } else console.log(`${tech} ${preset}:`, results.filter((r) => typeof r === 'string').join('; '));
  }
  // an objective in a region that is not connected: the info says between which regions
  await a.tech('A'); await a.preset('oblique'); await page.click('#m-clear');
  if (pick.B >= 0) {
    await page.evaluate(([s, o]) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(s); ev.setIncMode('obj'); ev.placeMark(o); }, [pick.A[0], pick.B]);
    await a.idle(); const t = await info();
    ok('no route: the info names both regions with their sizes and the closest approach', /no route<\/b>|no route/.test(t) && /Region R\d+ \(\d+ tiles\) is not connected to the stake region R\d+ \(\d+ tiles\)/.test(t) && /closest approach \d+ tiles? between \(\d+, \d+\) and \(\d+, \d+\)/.test(t), t);
    ok('no route: says how many gates touch both regions without a ramp', /\d+ gates? touch(es)? both without a ramp|no gate touches both/.test(t), t);
    ok('no route: nothing is drawn as a route', await page.evaluate(() => window.__evo.O.incursion.objectives.every((o) => !o.route)));
  } else console.log('this slice has one region: the no-route case is covered by test_route.js');
  // outside the slice / water / nothing
  await page.click('#m-clear'); await a.idle();
  const outside = await page.evaluate(() => { const S = window.__evo.S(); for (let i = 0; i < S.n; i++) if (S.slice && !S.slice[i]) return i; return -1; });
  if (outside >= 0) {
    await page.evaluate((t) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(t); }, outside);
    ok('a tile outside the slice is refused with a message and nothing is stored', /outside the slice/.test(await info()) && (await page.evaluate(() => window.__evo.inc.stake)) === null, await info());
  }
  // remove / clear / Esc
  await page.evaluate(([s, o]) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(s); ev.setIncMode('obj'); ev.placeMark(o); }, [pick.A[0], pick.A[1]]);
  await page.evaluate((t) => { const ev = window.__evo; ev.setIncMode('rm'); ev.placeMark(t); }, pick.A[1]);
  ok('Remove deletes the objective under the cursor', (await page.evaluate(() => window.__evo.inc.objectives.length)) === 0 && (await page.evaluate(() => !!window.__evo.inc.stake)));
  await page.keyboard.press('Escape'); ok('Esc leaves the placing mode', (await page.evaluate(() => window.__evo.inc.mode)) === null);
  await page.evaluate(([s, o]) => { const ev = window.__evo; ev.setIncMode('obj'); ev.placeMark(o); ev.setIncMode(null); }, [pick.A[0], pick.A[1]]);
  // manifest: marks in tiles of the whole map
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveManifest')]);
  const json = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  ok('pack.json is evodun-pack/0.3 with the stake and the objectives in whole-map tiles', json.format === 'evodun-pack/0.3' && JSON.stringify(json.stake) === JSON.stringify(xy(pick.A[0])) && json.objectives.length === 1 && JSON.stringify(json.objectives[0]) === JSON.stringify(xy(pick.A[1])), JSON.stringify([json.stake, json.objectives]));
  await page.click('#m-clear'); ok('Clear removes everything', (await page.evaluate(() => window.__evo.inc.objectives.length + (window.__evo.inc.stake ? 1 : 0))) === 0);
  console.log('errors:', a.errs); await a.browser.close();
})();
