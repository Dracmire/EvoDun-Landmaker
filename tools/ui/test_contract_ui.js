/* Art contract in the viewer: the Stage preset (Cam 6, B, terraces 7, spread 1.5, nothing else), stageYaw as the yaw of Cam 6 only, the switch (off = identical pixels, on = counts per kind in the info, Box / A / B) and the fade of the
   props that stand between the camera and the stake.
     NODE_PATH=$(npm root -g) node tools/ui/test_contract_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  const st = () => page.evaluate(() => { const e = window.__evo; return { preset: e.st.preset, tech: e.st.tech, mode: e.st.mode, terraces: e.P.terraces, spread: e.P.spread, yaw: e.view().yaw, kind: e.view().kind, minCore: e.P.roomsMinCore, rooms: e.P.rooms, cake: e.P.cake }; });
  const info = () => page.$eval('#info', (e) => e.textContent);
  // the Stage preset
  await page.selectOption('#src', 'shrine_pier'); await a.idle();
  const before = await st(); await page.click('#stagePreset'); await a.idle(); const s1 = await st();
  ok('Stage preset: Cam 6 (stage), technique B, single view, terraces 7, spread 1.5', s1.preset === 'stage' && s1.tech === 'B' && s1.mode === 'single' && s1.terraces === 7 && s1.spread === 1.5 && s1.kind === 'persp', JSON.stringify(s1));
  ok('Stage preset sets nothing else (rooms parameters and switches untouched)', s1.minCore === before.minCore && s1.rooms === before.rooms && s1.cake === before.cake);
  ok('a pack without stageYaw: Cam 6 at yaw 0', s1.yaw === 0, s1.yaw);
  await page.selectOption('#src', 'shrine_pier_x4'); await a.idle(); const s2 = await st();
  ok('Shrine-Pier x4 declares stageYaw 90: Cam 6 at yaw 90 (the sea behind the camera: Pier in front, Shrine behind)', s2.yaw === 90, s2.yaw);
  await page.click('#presets button[data-id="isoE"]'); await a.idle(); const s3 = await st();
  ok('stageYaw does not touch the other cameras (Cam 1 stays at yaw 45)', s3.yaw === 45, s3.yaw);
  await page.click('#stagePreset'); await a.idle();
  // the switch
  const off = {}, on = {}, txt = {};
  for (const t of ['box', 'A', 'B']) { await a.tech(t); off[t] = await hash(); }
  await page.check('#t-contract'); await a.idle();
  for (const t of ['box', 'A', 'B']) { await a.tech(t); on[t] = await hash(); txt[t] = await info(); }
  for (const t of ['box', 'A', 'B']) {
    ok(`${t}: the contract changes the picture`, on[t] !== off[t]);
    const m = txt[t].match(/Art contract<?[^:]*\(([A-Za-z]+)\): body low (\d+) · mid (\d+) · high (\d+) · masonry (\d+) · edge (\d+); wrapper rim (\d+) · base (\d+) · corner (\d+); footprint (\d+); props trees (\d+) · landmarks (\d+)/);
    ok(`${t}: the info line has the counts per kind (body classes, wrapper strips, footprint, props)`, !!m && +m[2] + +m[3] + +m[4] > 0 && +m[7] > 0 && +m[10] === 2 && +m[11] > 0 && +m[12] === 2, m ? m.slice(1).join(' ') : txt[t].slice(-260));
  }
  await page.uncheck('#t-contract'); await a.idle();
  for (const t of ['box', 'A', 'B']) { await a.tech(t); ok(`${t}: switch off again = identical pixels`, (await hash()) === off[t]); }
  ok('off: no contract text in the info', !/Art contract/.test(await info()));
  // the fade: a tree one tile west of the stake (Cam 6 at yaw 90: larger x is nearer) that overlaps it on screen is drawn at 25 %
  await a.tech('box'); await page.check('#t-contract'); await a.idle();
  let n = 0, seen = 0; // the stake is a map position {x, y}
  const spots = await page.evaluate(() => { const S = window.__evo.S(), r = []; for (const t of S.trees.slice(0, 40)) r.push([Math.floor(t[0] - S.ox) - 1, Math.floor(t[1] - S.oy)]); return r; });
  for (const spot of spots) {
    await page.evaluate(([x, y]) => { const e = window.__evo, S = e.S(); e.inc.stake = { x: S.ox + x, y: S.oy + y }; e.draw(); }, spot); await a.idle(); n++;
    const f = await page.evaluate(() => { const c = window.__evo.S().contractInfo.box; return c ? c.faded : 0; });
    if (f > 0) { seen = f; break; }
  }
  ok(`a stake placed behind a tree: that prop is drawn faded (25 %), counted in the info (tried ${n} spots)`, seen > 0 && /faded\)/.test(await info()), seen);
  await page.evaluate(() => { window.__evo.inc.stake = null; window.__evo.draw(); }); await a.idle();
  ok('no stake: nothing is faded', !/faded\)/.test(await info()));
  console.log('errors:', a.errs); ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
