/* The wall pass of C in the viewer: T3 is the default; T3 / T2 / Off give three pictures; Box / A / B do not change (the band is C-only geometry); the sliders only redraw (the shape is the same object) and change the picture; the pick render
   never sees the blocks (a click resolves to the same tile with the wall pass on or off; what a click on a ledge resolves to is measured); the manifest writes only non-default values and rejects wrong ones; the info line names the pass.
     NODE_PATH=$(npm root -g) node tools/ui/test_wallpass_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok, hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex');
  await page.selectOption('#src', 'shrine_pier_x4'); await a.idle(); await page.click('#stagePreset'); await a.idle(); await page.click('#mode'); await a.idle(); await page.click('#mode'); await a.idle(); // compare on: the C panel is the 4th
  ok('the default wall pass is T3 and the selector says so', (await page.evaluate(() => window.__evo.P.wallPass)) === 't3' && (await page.$eval('#wallPass', (e) => e.value)) === 't3');
  await page.click('#mode'); await a.idle(); // single technique
  const pics = {}; for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); await a.preset('oblique'); await a.idle(); } // warm-up: the info line (and the canvas height) settles once each technique has its stair coverage
  for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); await a.preset('oblique'); await a.idle(); await page.waitForTimeout(300); pics['on_' + t] = await hash(); }
  for (const m of ['t2', 'off']) { await a.tech('box'); await page.selectOption('#wallPass', m); await a.idle(); await page.waitForTimeout(300); for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); await a.idle(); await page.waitForTimeout(300); pics[m + '_' + t] = await hash(); } }
  ok('C: T3, T2 and Off are three different pictures', new Set([pics.on_C, pics.t2_C, pics.off_C]).size === 3, JSON.stringify([pics.on_C, pics.t2_C, pics.off_C]));
  ok('Box, A and B are identical with the wall pass on (T3), T2 and Off: the band is C-only geometry', ['box', 'A', 'B'].every((t) => pics['on_' + t] === pics['off_' + t] && pics['t2_' + t] === pics['off_' + t]), JSON.stringify(pics));
  // the info line
  await page.selectOption('#wallPass', 't3'); await a.tech('C'); await a.idle(); const txt = await page.$eval('#info', (e) => e.textContent);
  ok('the info names the pass: T3, wall edges, band atoms, islands before / after the fusion, slivers, faces', /Wall pass \(C T3, extrusion 0\.25\): \d+ wall edges · \d+ band atoms · \d+ islands \(\d+ before the fusion, \d+ slivers, \d+ over 3\.6 tiles\) · \d+ faces/.test(txt), txt.slice(-300));
  // sliders only redraw
  const same = await page.evaluate(() => { window.__sBefore = window.__evo.S(); return true; }), h0 = await hash();
  await page.evaluate(() => { const i = document.querySelector('#s-wallExtrude'); i.value = 0.4; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle(); await page.waitForTimeout(200);
  const h1 = await hash(), kept = await page.evaluate(() => window.__evo.S() === window.__sBefore && window.__evo.P.wallExtrude === 0.4);
  ok('the extrusion slider changes the picture and only redraws (same shape object)', same && kept && h1 !== h0, [kept, h0, h1]);
  ok('the extrusion slider range is 0.10-0.40', (await page.$eval('#s-wallExtrude', (e) => [e.min, e.max].join())) === '0.1,0.4');
  await page.evaluate(() => { const i = document.querySelector('#s-wallExtrude'); i.value = 0.25; i.dispatchEvent(new Event('change', { bubbles: true })); }); await a.idle(); await page.waitForTimeout(200);
  ok('back to 0.25: the first picture again (the cache key includes the extrusion)', (await hash()) === h0);
  // picking: the blocks are not selectable
  const pk = await page.evaluate(() => {
    const e = window.__evo, E = window.EVO, S = e.S(), P = e.P, cv = document.querySelector('#stage canvas'), v = e.view(), cam = E.makeCam(S, P, v, cv.clientWidth, cv.clientHeight), W = E.wallc.get(S, P), res = { same: 0, tot: 0, ledge: { kinds: {}, own: 0, n: 0 } };
    const tilesOf = (mode) => { P.wallPass = mode; const out = []; for (let k = 0; k < 120; k++) { const x = 3 + (k * 7.31) % (S.W - 6), y = 3 + (k * 3.77) % (S.H - 6), i = Math.floor(y) * S.W + Math.floor(x); if (S.void && S.void[i]) { out.push(null); continue; } const p = cam.p(x, y, S.levelH[S.fine[i]]); out.push(E.pickTile(S, P, 'C', v, cv.clientWidth, cv.clientHeight, p[0], p[1]).tile); } return out; };
    const on = tilesOf('t3'), off = tilesOf('off'); for (let k = 0; k < on.length; k++) if (on[k] !== null) { res.tot++; if (on[k] === off[k]) res.same++; }
    P.wallPass = 't3'; const tops = []; for (const vv of W.byHi.values()) for (const t of vv.tops) if (t.ledge) tops.push(t);
    for (let k = 0; k < Math.min(60, tops.length); k++) { const t = tops[Math.floor(k * tops.length / 60)], p = cam.p(t.cx, t.cy, t.z); if (p[0] < 2 || p[1] < 2 || p[0] > cv.clientWidth - 2 || p[1] > cv.clientHeight - 2) continue; const h = E.pickTile(S, P, 'C', v, cv.clientWidth, cv.clientHeight, p[0], p[1]); res.ledge.n++; res.ledge.kinds[h.kind] = (res.ledge.kinds[h.kind] || 0) + 1; if (h.tile === Math.floor(t.cy) * S.W + Math.floor(t.cx)) res.ledge.own++; }
    return res;
  });
  ok(`the pick render never sees the blocks: ${pk.same} of ${pk.tot} clicks resolve to the same tile with T3 and Off`, pk.tot > 60 && pk.same === pk.tot, JSON.stringify(pk));
  console.log(`MEASURED a click on a ledge (${pk.ledge.n} ledge tops): resolves to ${JSON.stringify(pk.ledge.kinds)}; ${pk.ledge.own} of them to the tile under the ledge top`);
  // manifest: only non-default values are written; wrong ones are rejected
  const blocks = await page.evaluate(() => { const e = window.__evo, out = {}; out.def = e.viewerBlock(); e.P.wallPass = 't2'; e.P.wallExtrude = 0.1; e.P.t2Rows = 8; out.set = e.viewerBlock(); e.P.wallPass = 't3'; e.P.wallExtrude = 0.25; e.P.t2Rows = 6; return out; });
  ok('the manifest viewer block writes no wall key at the defaults, and writes the non-default ones', !Object.keys(blocks.def).some((k) => /^(wall|t2)/.test(k)) && blocks.set.wallPass === 't2' && blocks.set.wallExtrude === 0.1 && blocks.set.t2Rows === 8 && blocks.set.wallStrata === undefined, JSON.stringify(blocks));
  const man = await page.evaluate(() => { const E = window.EVO, bad = []; for (const v of [{ wallPass: 'x' }, { wallExtrude: 0.9 }, { t2Rows: 20 }]) { try { E.parseManifest({ format: 'evodun-pack/0.3', name: 't', roles: {}, viewer: v }); bad.push('accepted ' + JSON.stringify(v)); } catch (x) { bad.push(/viewer\./.test(x.message) ? 'rejected' : x.message); } } let good = 'ok'; try { E.parseManifest({ format: 'evodun-pack/0.3', name: 't', roles: {}, viewer: { wallPass: 't2', wallExtrude: 0.1, t2Rows: 8 } }); } catch (x) { good = x.message; } return { bad, good }; });
  ok('the manifest accepts valid wall values and rejects wrong ones', man.bad.every((b) => b === 'rejected') && man.good === 'ok', JSON.stringify(man));
  console.log('errors:', a.errs); ok('no console errors', a.errs.length === 0); await a.browser.close(); process.exit(process.exitCode || 0);
})();
