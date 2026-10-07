/* The viewer and Node must agree: connInfo, walkInfo, ramps and warning faces of the real map with rooms on, 5 and 6 terraces, built from the same pack
   (tools/real_pack.js = E.imageChannels + E.packFromRoles, like the viewer). Different float bits of the elevation move the terraces.
     NODE_PATH=$(npm root -g) node tools/ui/test_viewer_node_ui.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { open } = require('./common');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../../src/${f}.js`), 'utf8'));
const E = window.EVO;
(async () => {
  const { mk } = await require('../real_pack.js').load(E);
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  await page.setInputFiles('#file', [path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png')]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle();
  const summary = (S) => { let k3 = 0; for (const v of S.roomKind) if (v === 3) k3++; const c = S.connInfo, w = S.walkInfo; return { conns: [c.total, c.ok, c.recomputed, c.unresolved, c.noRoute], reasons: c.unresolvedReasons, ramps: [S.stairs.length, S.passes.length, S.unmerged, S.exactRetry], walk: [w.walkable, w.main, w.isolatedRegions, w.isolatedTiles], problems: w.problems.map((p) => p.size), warnFaces: k3 }; };
  for (const T of [5, 6]) {
    await a.slider('terraces', T); await a.idle();
    const v = await page.evaluate(() => { const e = window.__evo, S = e.S(); let k3 = 0; for (const x of S.roomKind) if (x === 3) k3++; const c = S.connInfo, w = S.walkInfo;
      return { P: JSON.parse(JSON.stringify(e.P)), spec: e.sliceSpec(), sum: { conns: [c.total, c.ok, c.recomputed, c.unresolved, c.noRoute], reasons: c.unresolvedReasons, ramps: [S.stairs.length, S.passes.length, S.unmerged, S.exactRetry], walk: [w.walkable, w.main, w.isolatedRegions, w.isolatedTiles], problems: w.problems.map((p) => p.size), warnFaces: k3 } }; });
    const node = summary(E.shape(mk(), v.P, v.spec || null));
    ok(`${T} terraces: viewer == Node (connections, ramps, walkable, problems, warning faces)`, JSON.stringify(v.sum) === JSON.stringify(node), JSON.stringify({ viewer: v.sum, node }));
    ok(`${T} terraces: the viewer is on the whole map (no slice)`, !v.spec || !(v.spec.zones && v.spec.zones.length) , JSON.stringify(v.spec));
  }
  console.log('errors:', JSON.stringify(a.errs)); await a.browser.close();
})();
