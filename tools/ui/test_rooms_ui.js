/* Rooms in the viewer: the switch (off by default), the two sliders, the info line, and which stages of the chain each control recomputes
   (the rest comes from the cache). Real map: data/samples/skeleton_heightmap_256.png.
     NODE_PATH=$(npm root -g) node tools/ui/test_rooms_ui.js */
const path = require('path');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]);
  await page.waitForTimeout(1500); await a.idle();
  const stages = () => page.evaluate(() => { const t = window.__evo.roomsTiming(); return t ? Object.keys(t.ms).sort().join(',') : null; });
  ok('rooms are off by default and nothing is computed', !(await page.$eval('#t-rooms', (e) => e.checked)) && (await stages()) === null && !/Rooms/.test(await page.$eval('#info', (e) => e.innerText)));
  ok('the two sliders exist with the agreed ranges and defaults (core 5-80 = 20, cost 0-40 = 10)', await page.evaluate(() => { const c = document.querySelector('#s-roomsMinCore'), x = document.querySelector('#s-roomsCross'); return c && x && +c.min === 5 && +c.max === 80 && +c.value === 20 && +x.min === 0 && +x.max === 40 && +x.value === 10; }));
  const cold = Date.now(); await page.check('#t-rooms'); await a.idle();
  const txt = await page.$eval('#info', (e) => e.innerText), t1 = await page.evaluate(() => window.__evo.roomsTiming());
  console.log('cold rooms chain (whole map, core 20, cost 10):', t1.total.toFixed(0), 'ms', JSON.stringify(Object.fromEntries(Object.entries(t1.ms).map(([k, v]) => [k, Math.round(v)]))));
  ok('switching on shows the Rooms line with rooms, cores, tree and gates', /Rooms: 32 rooms · \d+ cores \(min 20 tiles\) · tree \d+ of \d+ reachable cores in \d+ trees? · gates \d+ used of \d+ candidates/.test(txt), txt.split('\n').pop());
  ok('all five stages ran the first time', (await stages()) === 'cores,edges,pass,rooms,tree', await stages());
  await a.slider('roomsCross', 25); await a.idle(); ok('crossing cost recomputes only the tree', (await stages()) === 'tree', await stages());
  await a.slider('roomsMinCore', 40); await a.idle(); ok('min core size recomputes the cores and the tree', (await stages()) === 'cores,tree', await stages());
  await a.slider('gateThr', 0.1); await a.idle(); ok('gate threshold recomputes from the pass stage on', (await stages()) === 'cores,pass,tree', await stages());
  await a.slider('terraces', 6); await a.idle(); ok('terraces recompute from the edges on (rooms themselves are cached)', (await stages()) === 'cores,edges,pass,tree', await stages());
  // slice by rooms: chips like the zone chips; one room, several rooms, whole map
  await a.slider('terraces', 5); await a.slider('gateThr', 0.05); await a.idle();
  const nChips = await page.$$eval('#roomChips .chip', (c) => c.length);
  ok('one chip per room (32) with its tile count, and the room buttons are visible', nChips === 32 && !(await page.$eval('#roomBtns', (e) => e.hidden)), nChips);
  const ids = await page.$$eval('#roomChips .chip', (c) => c.map((x) => +x.dataset.id));
  await page.click(`#roomChips .chip[data-id="${ids[3]}"]`); await a.idle();
  let sl = await page.evaluate(() => { const S = window.__evo.S(); return { rooms: S.sliceInfo && S.sliceInfo.rooms, tiles: S.sliceInfo && S.sliceInfo.tiles, patch: S.roomGates.patchSites, rampsPatch: S.stairs.filter((r) => r.ramp && r.ramp.patch).length, sl: S.roomGates.slice, win: S.sliceInfo && S.sliceInfo.window.w }; });
  ok('clicking a chip slices to that room, with the rest under the veil', sl.rooms && sl.rooms.length === 1 && sl.rooms[0] === ids[3] && sl.tiles > 100 && sl.win < 256, JSON.stringify(sl));
  ok('the info reports the slice connections (global + patch) and the patch ramps are flagged', /slice connections: \d+ from the global tree \+ \d+ patch/.test(await page.$eval('#info', (e) => e.innerText)) && sl.rampsPatch <= sl.patch, JSON.stringify([sl.patch, sl.rampsPatch]));
  await page.click(`#roomChips .chip[data-id="${ids[5]}"]`, { modifiers: ['Control'] }); await a.idle();
  ok('Ctrl-click adds a second room', (await page.evaluate(() => window.__evo.S().sliceInfo.rooms.length)) === 2);
  await page.click('#wholeRooms'); await a.idle();
  ok('Whole map restores the whole map', await page.evaluate(() => window.__evo.S().sliceInfo === null));
  // room borders: orange line on blocking faces (not on open transitions), green on the used ones, in Box, A and B
  // stake and objectives with rooms on: the route follows the patched passability (ramps for terraces); a margin tile is refused
  const marks = await page.evaluate(() => { const S = window.__evo.S(), big = S.regionSizes.indexOf(Math.max(...S.regionSizes)), A = []; let forb = -1; for (let i = 0; i < S.n; i++) { if (S.region[i] === big) A.push(i); if (forb < 0 && !S.block[i] && !S.carved[i] && S.rooms.forb[i]) forb = i; } return { s: A[(A.length * 0.2) | 0], o: A[(A.length * 0.9) | 0], forb }; });
  await page.evaluate((m) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(m.forb); }, marks);
  ok('a stake on a forbidden margin tile is refused with a reason', /margin of a wall, a cliff or a steep slope/.test(await page.$eval('#incInfo', (e) => e.innerText)) && (await page.evaluate(() => window.__evo.inc.stake)) === null);
  await page.evaluate((m) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(m.s); ev.setIncMode('obj'); ev.placeMark(m.o); ev.setIncMode(null); }, marks); await a.idle();
  ok('the objective has a route to the stake over the walkable tiles', /route of \d+ tiles to the stake/.test(await page.$eval('#incInfo', (e) => e.innerText)), await page.$eval('#incInfo', (e) => e.innerText));
  await page.click('#m-clear'); await a.idle();
  await page.click('#mode'); await a.idle();
  ok('the Room borders toggle exists, on by default', await page.$eval('#t-roomBorders', (e) => e.checked));
  for (const tech of ['box', 'A', 'B']) {
    await a.tech(tech); await a.preset('oblique');
    const r = await page.evaluate(() => {
      const ev = window.__evo, S = ev.S(), E = window.EVO, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth, cam = E.makeCam(S, ev.P, ev.view(), w, h);
      const FACE = [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]], OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      const near = (px, py, f, rad) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const c = ctx.getImageData(Math.round(px * dpr) + dx, Math.round(py * dpr) + dy, 1, 1).data; if (f(c)) return true; } return false; };
      const orange = (c) => c[0] > 215 && c[1] > 110 && c[1] < 190 && c[2] < 110, green = (c) => c[1] > 200 && c[0] < 120 && c[2] < 170 && c[2] > 90;
      const res = { closed: [0, 0], open: [0, 0], used: [0, 0] };
      const seen = { closed: 0, open: 0, used: 0 };
      for (let i = 0; i < S.n; i++) {
        if (!S.roomBits[i] && !S.roomMap[i]) continue; const x = i % S.W, y = (i / S.W) | 0;
        for (let b = 0; b < 4; b++) {
          const nx = x + OFF[b][0], ny = y + OFF[b][1]; if (nx < 0 || ny < 0 || nx >= S.W || ny >= S.H) continue; const j = ny * S.W + nx;
          if (!S.roomMap[i] || !S.roomMap[j] || S.roomMap[i] === S.roomMap[j] || S.fine[i] !== S.fine[j] || i > j) continue; // level faces only: the line sits on the cap
          const k = S.roomKind[i * 4 + b], name = k === 1 ? 'closed' : k === 2 ? 'used' : 'open'; if (++seen[name] % (name === 'closed' ? 40 : 4) !== 0) continue;
          const f = FACE[b], p = cam.p(x + (f[0] + f[2]) / 2, y + (f[1] + f[3]) / 2, S.levelH[S.fine[i]]); if (p[0] < 6 || p[1] < 6 || p[0] > w - 6 || p[1] > h - 6) continue;
          res[name][1]++; if (near(p[0], p[1], name === 'used' ? green : orange, name === 'closed' ? 3 : 1)) res[name][0]++;
        }
      }
      return res;
    });
    const f = (a2) => (a2[1] ? a2[0] / a2[1] : 0);
    ok(`${tech}: blocking faces show the orange line, open (unused) transitions do not, used ones are green`, r.closed[1] > 40 && f(r.closed) > 0.6 && r.open[1] > 10 && f(r.open) < 0.25 && r.used[1] > 5 && f(r.used) > 0.5, JSON.stringify(r));
  }
  // walkable / isolated / edge problems: info, the tone (not over ramps), the warning outline
  const info2 = await page.$eval('#info', (e) => e.innerText);
  ok('the info separates walkable, isolated terrain and edge problems', /Walkable \d+ tiles \(\d+% of the land\) · isolated: \d+ regions?, \d+ tiles \(under 100, decorative\) · edge problems: \d+ regions?/.test(info2), info2.split('\n').filter((l) => /Walkable/.test(l)).join(' | '));
  ok('the Isolated limit slider is 20-1000, default 100, and the two toggles exist', await page.evaluate(() => { const x = document.querySelector('#s-roomsIsoLimit'); return x && +x.min === 20 && +x.max === 1000 && +x.value === 100 && document.querySelector('#t-nowalk').checked && document.querySelector('#t-edgeWarn').checked; }));
  for (const tech of ['box', 'A', 'B']) for (const preset of ['oblique', 'isoE']) {
    await a.tech(tech); await a.preset(preset);
    const sample = () => page.evaluate(() => {
      const ev = window.__evo, S = ev.S(), E = window.EVO, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = cv.clientHeight, ctx = cv.getContext('2d'), dpr = cv.width / cv.clientWidth, cam = E.makeCam(S, ev.P, ev.view(), w, h);
      const px = (i, hh) => { const p = cam.p(i % S.W + 0.5, ((i / S.W) | 0) + 0.5, hh); if (p[0] < 4 || p[1] < 4 || p[0] > w - 4 || p[1] > h - 4) return null; return Array.from(ctx.getImageData(Math.round(p[0] * dpr), Math.round(p[1] * dpr), 1, 1).data).slice(0, 3); };
      const nw = [], rp = [], seen = { n: 0, r: 0 };
      for (let i = 0; i < S.n; i++) { if (S.nowalk[i] && !S.carved[i] && (++seen.n % 53 === 0)) nw.push([i, S.levelH[S.fine[i]]]); if (S.carved[i] && (++seen.r % 5 === 0)) rp.push([i, S.levelH[S.fine[i]]]); }
      return { nw: nw.map(([i, hh]) => px(i, hh)), rp: rp.map(([i, hh]) => px(i, hh)) };
    });
    const on = await sample(); await page.uncheck('#t-nowalk'); await a.idle(); const off = await sample(); await page.check('#t-nowalk'); await a.idle();
    const diff = (x, y) => Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]);
    let tone = 0, toneN = 0, rampChanged = 0, rampN = 0;
    on.nw.forEach((c, k) => { if (c && off.nw[k]) { toneN++; if (diff(c, off.nw[k]) > 10) tone++; } });
    on.rp.forEach((c, k) => { if (c && off.rp[k]) { rampN++; if (diff(c, off.rp[k]) > 6) rampChanged++; } });
    ok(`${tech} ${preset}: the not-walkable tone changes the terrain it covers and leaves the ramps alone`, toneN > 20 && tone / toneN > 0.45 && rampN > 10 && rampChanged / rampN < 0.1, JSON.stringify({ tone, toneN, rampChanged, rampN }));
  }
  await a.tech('A'); await a.preset('oblique');
  const magenta = () => page.evaluate(() => { const cv = document.querySelector('#stage canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 235 && d[i + 1] > 50 && d[i + 1] < 95 && d[i + 2] > 170 && d[i + 2] < 225) n++; return n; });
  const mOn = await magenta(); await page.uncheck('#t-edgeWarn'); await a.idle(); const mOff = await magenta(); await page.check('#t-edgeWarn'); await a.idle();
  ok('the edge-problem outline is drawn (magenta) and the toggle removes it', mOn > 30 && mOff < 5, [mOn, mOff]);
  const isoTile = await page.evaluate(() => { const S = window.__evo.S(); for (let i = 0; i < S.n; i++) if (S.isolated[i]) return i; return -1; });
  await page.evaluate((t) => { const ev = window.__evo; ev.setIncMode('stake'); ev.placeMark(t); }, isoTile);
  ok('a stake on isolated terrain is refused with the reason', /isolated terrain \(a walkable region under 100 tiles\)/.test(await page.$eval('#incInfo', (e) => e.innerText)) && (await page.evaluate(() => window.__evo.inc.stake)) === null);
  await page.evaluate(() => window.__evo.setIncMode(null));
  await a.slider('roomsIsoLimit', 1000); await a.idle();
  ok('raising the limit to 1000 turns more terrain into isolated', await page.evaluate(() => window.__evo.S().walkInfo.limit === 1000));
  await a.slider('roomsIsoLimit', 100); await a.idle();
  await page.uncheck('#t-roomBorders'); await a.idle();
  ok('with the toggle off no orange line is drawn', await page.evaluate(() => { const cv = document.querySelector('#stage canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 245 && d[i + 1] > 140 && d[i + 1] < 160 && d[i + 2] > 30 && d[i + 2] < 50) n++; return n < 20; }));
  await page.check('#t-roomBorders'); await a.idle();
  await page.uncheck('#t-rooms'); await a.idle(); ok('switching off removes the Rooms line', !/Rooms:/.test(await page.$eval('#info', (e) => e.innerText)));
  console.log('errors:', a.errs); await a.browser.close();
})();
