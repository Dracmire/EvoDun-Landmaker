/* STAGE FRAME LAYERS, THE RIBBON (PR M4c-1, src/frame.js), no browser: `E.frame.ribbonTiles` is deterministic, its width is the one asked (the tiles whose centre is within wH * tilesPerH / 2 of the polyline), a tile at the exact distance is in, a one-point polyline is a disc, the map offset is subtracted; and `draw` paints only the tiles that the visibility test accepts (a stub of E.objects.groundTest).
     node tools/test_frame.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['frame']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, F = E.frame; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 400)); } };
const W = 40, H = 30, rb = { pts: [[5.5, 10.5], [30.5, 10.5]], wH: 1.5 }; // a horizontal band, 1.5 H = 3 tiles at tilesPerH 2
const t1 = F.ribbonTiles(W, H, 0, 0, rb, 2), t2 = F.ribbonTiles(W, H, 0, 0, JSON.parse(JSON.stringify(rb)), 2);
ok('deterministic: the same ribbon gives the same tiles in the same (ascending) order', JSON.stringify(t1) === JSON.stringify(t2) && t1.every((v, i) => i === 0 || v > t1[i - 1]));
{ const rows = new Set(t1.map((i) => (i / W) | 0)); ok(`the width is the one asked: 3 tiles wide (rows ${[...rows].join(',')}) for wH 1.5 at tilesPerH 2`, rows.size === 3 && [9, 10, 11].every((r) => rows.has(r)), [...rows]); }
{ const cols = t1.filter((i) => ((i / W) | 0) === 10).map((i) => i % W); ok(`the band runs from the first to the last point (columns ${Math.min(...cols)}..${Math.max(...cols)}, the end caps are round)`, Math.min(...cols) === 4 && Math.max(...cols) === 31, [Math.min(...cols), Math.max(...cols)]); }
{ const e = F.ribbonTiles(W, H, 0, 0, { pts: [[5.5, 10.5], [30.5, 10.5]], wH: 1 }, 2); ok('a tile at the EXACT distance is in: wH 1 at tilesPerH 2 = a radius of 1 tile = the centres of the rows 9 and 11 (distance 1.0)', e.some((i) => ((i / W) | 0) === 9) && e.some((i) => ((i / W) | 0) === 11) && !e.some((i) => ((i / W) | 0) === 8), e.length); }
{ const d = F.ribbonTiles(W, H, 0, 0, { pts: [[10.5, 10.5]], wH: 1.5 }, 2); ok(`a one-point polyline is a disc of radius 1.5 tiles (${d.length} tiles, centre tile included, 4 neighbours included, the diagonal at 1.41 included, the far one (2 tiles) not)`, d.includes(10 * W + 10) && d.includes(10 * W + 11) && d.includes(11 * W + 11) && !d.includes(10 * W + 12), d.length); }
{ const o = F.ribbonTiles(W, H, 100, 200, { pts: [[105.5, 210.5], [130.5, 210.5]], wH: 1.5 }, 2); ok('the map offset (ox, oy) is subtracted: the same ribbon in map coordinates gives the same tiles', JSON.stringify(o) === JSON.stringify(t1)); }
ok('an empty polyline, a zero width and no ribbon give no tiles', F.ribbonTiles(W, H, 0, 0, { pts: [], wH: 1 }, 2).length === 0 && F.ribbonTiles(W, H, 0, 0, { pts: [[1, 1]], wH: 0 }, 2).length === 0 && F.ribbonTiles(W, H, 0, 0, null, 2).length === 0);
ok('the tiles outside the window are cut (a ribbon that leaves the window keeps only the inside)', F.ribbonTiles(10, 10, 0, 0, { pts: [[-5, 5.5], [20, 5.5]], wH: 1.5 }, 2).every((i) => i % 10 >= 0 && i < 100));
// draw: only the tiles the visibility test accepts are painted
{ const S = { W, H, ox: 0, oy: 0 }, log = []; const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => { log.push(k); }), set: (t, k, v) => { t[k] = v; return true; } });
  E.stage = { feetH: () => 0 }; E.objects = { groundTest: () => ({ ownGround: (p, i) => i % 2 === 0 }) };
  const cam = { p: (x, y) => [x * 10, y * 10] }, o = { frame: { list: [rb], tilesPerH: 2 } }; F.draw(ctx, cam, S, {}, 'box', {}, o, 400, 300);
  const st = o.frame.stats[0]; ok(`draw paints only the visible tiles (${st.drawn} drawn, ${st.hidden} hidden of ${st.tiles}) and nothing for a tile the test refuses`, st.drawn + st.hidden === st.tiles && st.drawn === t1.filter((i) => i % 2 === 0).length && st.hidden > 0 && log.filter((k) => k === 'fill').length === st.drawn, st);
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
