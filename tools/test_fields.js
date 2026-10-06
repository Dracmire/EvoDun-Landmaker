/* Tests for src/fields.js. Run: node tools/test_fields.js (no dependencies). */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../src/fields.js'), 'utf8'));
const E = window.EVO;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : (fail++, console.log('FAIL', name, extra === undefined ? '' : extra)); };

/* a decoded RGBA 8-bit image (shape of E.decodePng output) from a per-pixel function */
function rgba(W, H, fn) {
  const c = [0, 1, 2, 3].map(() => new Uint8Array(W * H));
  for (let i = 0; i < W * H; i++) { const p = fn(i % W, (i / W) | 0, i); for (let k = 0; k < 4; k++) c[k][i] = p[k] === undefined ? 255 : p[k]; }
  return { width: W, height: H, bitDepth: 8, colorType: 6, channels: c, max: 255, palette: null };
}
const hsv2rgb = (h, s, v) => { // standard HSV -> RGB, rounded to 8 bits like Color.HSVToRGB + Color32
  const i = Math.floor(h * 6) % 6, f = h * 6 - Math.floor(h * 6), p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// 1. HSV against Python colorsys (independent implementation)
{
  const gold = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hsv_golden.json'), 'utf8'));
  let bad = 0, worst = 0; const o = [0, 0, 0];
  for (const [r, g, b, h, s, v] of gold) {
    E.rgbToHsv(r / 255, g / 255, b / 255, o);
    const dh = Math.min(Math.abs(o[0] - h), 1 - Math.abs(o[0] - h)); // 0 and 1 are the same hue
    worst = Math.max(worst, dh, Math.abs(o[1] - s), Math.abs(o[2] - v));
    if (dh > 1e-9 || Math.abs(o[1] - s) > 1e-9 || Math.abs(o[2] - v) > 1e-9) bad++;
  }
  ok('HSV vs colorsys (' + gold.length + ' colours)', bad === 0, bad + ' differ, worst ' + worst);
  // through imageChannels (float32 planes): V is max(R,G,B) exactly, hue within float32 noise
  const img = E.imageChannels(rgba(gold.length, 1, (x) => gold[x].slice(0, 3)), false);
  let b2 = 0; gold.forEach(([r, g, b, h, s, v], x) => {
    if (img.ch.V[x] !== Math.fround(Math.max(r, g, b) / 255)) b2++;
    const dh = Math.min(Math.abs(img.ch.H[x] - h), 1 - Math.abs(img.ch.H[x] - h));
    if (dh > 1e-6 || Math.abs(img.ch.S[x] - s) > 1e-6) b2++;
  });
  ok('imageChannels HSV planes', b2 === 0, b2);
}

// 2. channel normalisation for the other colour types, flip Y
{
  const grey = { width: 2, height: 2, bitDepth: 8, colorType: 0, channels: [Uint8Array.from([0, 128, 255, 64])], max: 255, palette: null };
  const g = E.imageChannels(grey, false);
  ok('grey: R=G=B=V', g.ch.R[1] === g.ch.G[1] && g.ch.G[1] === g.ch.V[1] && Math.abs(g.ch.V[1] - 128 / 255) < 1e-7 && g.ch.A.every((a) => a === 1) && g.ch.S.every((s) => s === 0));
  const ga = { width: 1, height: 2, bitDepth: 16, colorType: 4, channels: [Uint16Array.from([65535, 1]), Uint16Array.from([0, 65535])], max: 65535, palette: null };
  const a = E.imageChannels(ga, false);
  ok('grey+alpha 16-bit', Math.abs(a.ch.V[1] - 1 / 65535) < 1e-9 && a.ch.A[0] === 0 && a.ch.A[1] === 1);
  const pal = { width: 2, height: 1, bitDepth: 8, colorType: 3, channels: [Uint8Array.from([1, 0])], max: 255, palette: { rgb: Uint8Array.from([255, 0, 0, 0, 0, 255]), alpha: Uint8Array.from([255, 128]) } };
  const p = E.imageChannels(pal, false);
  ok('palette expanded', p.ch.B[0] === 1 && p.ch.R[1] === 1 && Math.abs(p.ch.A[0] - 128 / 255) < 1e-7);
  const im = rgba(3, 2, (x, y) => [x * 10 + y * 100, 0, 0, 255]);
  const f = E.imageChannels(im, true), n = E.imageChannels(im, false);
  ok('flipY swaps rows in every plane', E.CHANNELS.every((k) => [0, 1, 2].every((x) => f.ch[k][x] === n.ch[k][3 + x] && f.ch[k][3 + x] === n.ch[k][x])));
}

// 3. zones by the exact formula id = round(H * (maxnode + 1)), 12 zones at 360/13 degrees (S = V = 1)
const K = 12, W = 64, H = 64;
const zoneImg = (extra) => rgba(W, H, (x, y) => {
  if (extra) { const e = extra(x, y); if (e) return e; }
  if (x < 4) return [0, 0, 0];                       // black = outside
  const id = 1 + Math.floor((y * K) / H);            // 12 horizontal bands, 1..12
  return hsv2rgb(id / (K + 1), 1, 1);
});
{
  const img = E.imageChannels(zoneImg(), false);
  const r = E.categoricalFromHue(img, { maxnode: K });
  let bad = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const want = x < 4 ? 0 : 1 + Math.floor((y * K) / H); if (r.ids[y * W + x] !== want) bad++; }
  ok('maxnode: ids exact', bad === 0, bad);
  ok('maxnode: 12 classes, outside count, no ambiguity', r.info.classes.length === K && r.info.outside === 4 * H && r.info.ambiguous.total === 0 && r.info.mode === 'maxnode', JSON.stringify(r.info.ambiguous));
  const d = E.categoricalFromHue(img, {});
  ok('deduced: 12 clusters, ids follow hue order', d.info.mode === 'deduced' && d.info.classes.length === K && d.ids.every((v, i) => v === r.ids[i]), d.info.classes.length);
  ok('deduced: centres at k/13', d.info.classes.every((c) => Math.abs(c.hue - c.id / (K + 1)) < 2e-3), d.info.classes.map((c) => c.hue.toFixed(4)).join(' '));
}
// 4. ambiguity is counted, never assigned silently
{
  const bad = [];
  const img = E.imageChannels(zoneImg((x, y) => {
    if (x === 10 && y < 5) return [128, 128, 128];                      // grey: no hue            (5 px)
    if (x === 11 && y < 7) return hsv2rgb(0.3, 1, 10 / 255);            // V = 10/255: hue imprecise (7 px)
    if (x === 12 && y < 3) return hsv2rgb(3.5 / (K + 1), 1, 1);        // halfway between ids 3 and 4: far (3 px)
    if (x === 13 && y < 2) return hsv2rgb(0, 1, 1);                    // red = id 0: reserved     (2 px)
    if (x === 14 && y < 1) return hsv2rgb(0.99, 1, 1);                 // near hue 1 = id 13 -> reserved (1 px)
    return null;
  }), false);
  const r = E.categoricalFromHue(img, { maxnode: K }), a = r.info.ambiguous;
  ok('ambiguous total 18', a.total === 18, JSON.stringify(a));
  ok('ambiguous by reason', a.noHue === 5 && a.lowChroma === 7 && a.far === 3 && a.reserved === 3, JSON.stringify(a));
  ok('maxnode: ambiguous pixels keep the formula id (4), reserved ones are -1', r.ids[11] === 4 && r.ids[12] === 4 && r.ids[10] === -1 && r.ids[13] === -1 && r.ids[14] === -1, [10, 11, 12, 13, 14].map((i) => r.ids[i]).join());
  ok('ambiguous mask flags all 18, kept = 10', r.amb.reduce((x, y) => x + y, 0) === 18 && r.amb[10] && r.amb[11] && r.amb[12] && r.amb[13] && r.amb[14] && a.kept === 10, a.kept);
  const dd = E.categoricalFromHue(img, {});  // deduced mode: unreliable pixels stay -1
  ok('deduced: ambiguous pixels are -1 and flagged', dd.ids[10] === -1 && dd.ids[11] === -1 && dd.amb[11] === 1 && dd.info.ambiguous.kept === 0 && dd.info.ambiguous.total === 12 && dd.info.classes.length === K + 2 /* the off-centre hue, and red + 0.99 (4 degrees apart: one cluster), are clusters of their own */, JSON.stringify(dd.info.ambiguous));
  const pack = E.packFromRoles([Object.assign({ name: 'z.png' }, img)], { elevation: { image: 0, channel: 'V' }, zone: { image: 0, channel: 'H' } }, { maxnode: K });
  ok('warning text names count and percentage', pack.warnings.length === 1 && /zone: 18 px \(0\.44%\)/.test(pack.warnings[0]) && /magenta/.test(pack.warnings[0]) && /10 kept the id/.test(pack.warnings[0]) && /8 left unassigned/.test(pack.warnings[0]), pack.warnings[0]);
}
// 5. pixels with V = 0 are outside whatever their hue; V = 0 is not "ambiguous"
{
  const img = E.imageChannels(zoneImg((x, y) => (x === 20 ? [0, 0, 0, 255] : null)), false);
  const r = E.categoricalFromHue(img, { maxnode: K });
  ok('V=0 is outside, not ambiguous', r.ids[20] === 0 && r.info.ambiguous.total === 0 && r.info.outside === 5 * H, r.info.outside);
}
// 6. single image: H = zone, V = height; elevation read from V with the 1000 scale
{
  const hh = (x, y) => (1 + ((x + y * 3) % 250)) / 255;   // height as V, never < 1/255
  const img = E.imageChannels(rgba(W, H, (x, y) => hsv2rgb((1 + Math.floor((y * K) / H)) / (K + 1), 1, hh(x, y))), false);
  const pack = E.packFromRoles([Object.assign({ name: 'both.png' }, img)], { elevation: { image: 0, channel: 'V' }, zone: { image: 0, channel: 'H' } }, { maxnode: K });
  let be = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.abs(pack.elevation[y * W + x] - Math.round(hh(x, y) * 255) / 255 * 1000) > 1e-3) be++;
  ok('combined image: elevation = V * 1000', be === 0, be);
  ok('combined image: low V is counted and flagged, the formula id is still the right zone', pack.fields.zone.info.ambiguous.lowChroma > 0 && pack.fields.zone.amb.some((v) => v === 1));
  { // the formula id is right wherever the hue is reliable; wrong ids can only be among the flagged pixels
    const z = pack.fields.zone; let wrongUnflagged = 0, wrongFlagged = 0;
    z.ids.forEach((id, i) => { if (id !== 1 + Math.floor((((i / W) | 0) * K) / H)) (z.amb[i] ? wrongFlagged++ : wrongUnflagged++); });
    ok('combined image: no wrong id outside the flagged pixels', wrongUnflagged === 0, wrongUnflagged + ' unflagged wrong, ' + wrongFlagged + ' flagged wrong');
  }
  ok('elevRange is the raw global min/max', pack.elevRange[0] === Math.min(...pack.elevation) && pack.elevRange[1] === Math.max(...pack.elevation));
}
// 7. edge map: black outside, cyan = pass, red = barrier (deduced from hue)
{
  const img = E.imageChannels(rgba(16, 16, (x, y) => (y === 3 ? [0, 255, 255] : y === 9 ? [255, 0, 0] : [0, 0, 0])), false);
  const pack = E.packFromRoles([Object.assign({ name: 'edges.png' }, img)], { elevation: { image: 0, channel: 'V' }, edge: { image: 0, channel: 'H' } });
  const cl = pack.fields.edge.info.classes;
  ok('edge: two classes with labels', cl.length === 2 && cl[0].label === 'barrier' && cl[1].label === 'pass' && cl[0].count === 16 && cl[1].count === 16, JSON.stringify(cl));
  ok('edge: ids by tile', pack.fields.edge.ids[3 * 16] === 2 && pack.fields.edge.ids[9 * 16] === 1 && pack.fields.edge.ids[0] === 0);
}
// 8. raw-channel categorical, graded masks, 16-bit hue
{
  const img = E.imageChannels(rgba(4, 1, (x) => [[0, 5, 5, 200][x], 0, 0, 255]), false);
  const r = E.categoricalFromValue(img, 'R');
  ok('categorical from raw channel', r.ids.join() === '0,5,5,200' && r.info.classes.length === 2);
  const g = E.packFromRoles([Object.assign({ name: 'm.png' }, img)], { elevation: { image: 0, channel: 'V' }, path: { image: 0, channel: 'R' } });
  ok('graded mask = channel in 0..1', Math.abs(g.fields.path.values[3] - 200 / 255) < 1e-6);
  // same dark pixel, hue of id 10: ambiguous at 8 bits (V = 3/255), reliable at 16 bits (V = 300/65535)
  const hsvF = (h, s2, v) => { const i = Math.floor(h * 6) % 6, f = h * 6 - Math.floor(h * 6), p = v * (1 - s2), q = v * (1 - f * s2), t = v * (1 - (1 - f) * s2); return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i]; };
  const dark = (m, vCounts) => hsvF(10 / 13, 1, vCounts / m).map((x) => Math.round(x * m));
  const px16 = dark(65535, 300), px8 = dark(255, 3);
  const c16 = { width: 1, height: 1, bitDepth: 16, colorType: 2, channels: px16.map((v) => Uint16Array.of(v)), max: 65535, palette: null };
  const r16 = E.categoricalFromHue(E.imageChannels(c16, false), { maxnode: 12 });
  ok('16-bit: dark pixel keeps a reliable hue', r16.ids[0] === 10 && r16.info.ambiguous.total === 0, r16.ids.join());
  const r8 = E.categoricalFromHue(E.imageChannels(rgba(1, 1, () => px8), false), { maxnode: 12 });
  ok('8-bit: same dark pixel is ambiguous (flagged) but keeps its formula id', r8.ids[0] === 10 && r8.amb[0] === 1 && r8.info.ambiguous.lowChroma === 1 && r8.info.ambiguous.kept === 1, JSON.stringify(r8.info.ambiguous) + ' ' + px8 + ' id ' + r8.ids[0]);
}
// 8b. fillUnassigned: majority of neighbours, no holes
{
  const Wd = 9, Hd = 9, ids = new Int32Array(Wd * Hd).fill(1);
  for (let y = 0; y < Hd; y++) for (let x = 5; x < Wd; x++) ids[y * Wd + x] = 2;       // left zone 1, right zone 2
  const hole = 4 * Wd + 1, border = 4 * Wd + 4, run = [2 * Wd + 6, 2 * Wd + 7, 3 * Wd + 6, 3 * Wd + 7, 4 * Wd + 6, 4 * Wd + 7];
  ids[hole] = -1; ids[border] = -1; for (const i of run) ids[i] = -1;
  const f = E.fillUnassigned(ids, Wd, Hd);
  ok('hole inside zone 1 -> 1', f[hole] === 1);
  ok('block of -1 inside zone 2 -> 2 (filled pass by pass)', run.every((i) => f[i] === 2));
  ok('border pixel: majority of its 8 neighbours (3 left col x=3 + ... ) is decided, no -1 left', f[border] > 0 && f.every((v) => v >= 0), f[border]);
  ok('original untouched', ids[hole] === -1);
  const out = new Int32Array(25).fill(0); out[12] = -1;
  ok('-1 surrounded by outside becomes outside (0)', E.fillUnassigned(out, 5, 5)[12] === 0);
  const tie = Int32Array.from([1, 0, 0, 1, -1, 0, 1, 0, 0]);   // 3 x zone 1 vs 5 x outside: majority is outside
  ok('majority can be outside', E.fillUnassigned(tie, 3, 3)[4] === 0);
  const tie2 = Int32Array.from([1, 1, 1, 1, -1, 0, 0, 0, 0]);  // 4 vs 4: zone beats outside
  ok('tie prefers the zone over outside', E.fillUnassigned(tie2, 3, 3)[4] === 1);
  const all = new Int32Array(16).fill(-1);
  ok('all -1 resolves to outside, no infinite loop', E.fillUnassigned(all, 4, 4).every((v) => v === 0));
}
// 9. errors and manifest
{
  const a = Object.assign({ name: 'a.png' }, E.imageChannels(rgba(4, 4, () => [1, 1, 1]), false)), b = Object.assign({ name: 'b.png' }, E.imageChannels(rgba(8, 4, () => [1, 1, 1]), false));
  let msg = ''; try { E.packFromRoles([a, b], { elevation: { image: 0, channel: 'V' }, zone: { image: 1, channel: 'H' } }); } catch (e) { msg = e.message; }
  ok('size mismatch names both files', /a\.png 4x4, b\.png 8x4/.test(msg), msg);
  msg = ''; try { E.packFromRoles([a], {}); } catch (e) { msg = e.message; }
  ok('missing elevation role', /elevation/.test(msg), msg);
  const m = E.parseManifest({ format: 'evodun-pack/0.2', name: 'x', flipY: true, maxnode: 12, roles: { elevation: { image: 'h.png', channel: 'V' }, zone: { image: 'z.png', channel: 'H' }, area: { image: 'a.png', channel: 'R' } } });
  ok('manifest: reserved role ignored with a note', !m.roles.area && m.notes.length === 1 && m.flipY && m.maxnode === 12 && m.roles.zone.image === 'z.png');
  const rt = E.parseManifest(JSON.parse(JSON.stringify(E.buildManifest({ name: 'x', flipY: true, maxnode: 12, roles: m.roles }))));
  ok('manifest round trip', JSON.stringify(rt.roles) === JSON.stringify(m.roles) && rt.maxnode === 12 && rt.flipY === true);
  const ms = E.parseManifest({ format: 'evodun-pack/0.2', roles: { elevation: { image: 'h.png', channel: 'V' } }, slice: { zones: [3, 4], rect: [10, 20, 100, 200], margin: 8 } });
  ok('manifest slice parsed', ms.slice.zones.join() === '3,4' && ms.slice.rect.join() === '10,20,100,200' && ms.slice.margin === 8);
  const ms2 = E.parseManifest(JSON.parse(JSON.stringify(E.buildManifest({ name: 'x', roles: ms.roles, slice: ms.slice }))));
  ok('manifest slice round trip', JSON.stringify(ms2.slice) === JSON.stringify(ms.slice));
  ok('manifest without slice', E.parseManifest({ format: 'evodun-pack/0.2', roles: {} }).slice === null);
  for (const bad of [{ format: 'evodun-pack/0.2', slice: { zones: [0] } }, { format: 'evodun-pack/0.2', slice: { rect: [1, 2, 3] } }, { format: 'evodun-pack/0.2', slice: { margin: -1 } }, { format: 'evodun-pack/0.1' }, { format: 'evodun-pack/0.2', roles: { nope: { image: 'a', channel: 'R' } } }, { format: 'evodun-pack/0.2', roles: { zone: { image: 'a', channel: 'X' } } }]) {
    msg = ''; try { E.parseManifest(bad); } catch (e) { msg = e.message; } ok('manifest rejects ' + JSON.stringify(bad).slice(0, 50), msg.startsWith('Manifest'), msg);
  }
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
