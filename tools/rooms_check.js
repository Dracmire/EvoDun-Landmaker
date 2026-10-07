/* Check of the rooms chain on a real height map: how many cores end up joined in ONE spanning tree with
     A  the user's rules transcribed as is (own terraces floor(h*N), own gates with the swap leak),
     B  the same ORIGINAL passability over the viewer's terraces and gates,
     C  the PATCHED rule (pairs, one passability function, steep pairs dropped, nearest-room assignment, free core centres),
   plus a sweep of transStrict for C and PNG overlays (rooms, transitions, gates, cores, tree).
     node tools/rooms_check.js [--map data/samples/skeleton_heightmap_256.png] [--preset forge|conical] [--out DIR]
        [--gentle 0.2] [--steep 0.33] [--exp 0.5] [--hTol 0.07] [--terraces 5] [--minRadius 9] [--minRoom 8] [--hardEdge 0.5]
        [--minSizeEdge 12] [--transStrict 0.45] [--minTerraceTrans 8] [--minCore 5] [--sweep 0.05,0.1,0.2,0.3,0.45] [--scale 4]
        [--pre 1] [--minPlateau 5] [--subs 3] [--noPng] [--voidInRange]
        [--coreSweep 5,20,50] [--crossCosts 0,10,30]   (what the spanning tree USES: gates and transitions crossed by its paths)
   Presets are the values the user read from his scenes: forge = mapGen_forge, conical = ConicalTown. Any flag overrides the preset.
   Void = height 0; terraces are quantized over the LAND only (void takes the nearest land value, range = lowest..highest land) unless --voidInRange. Colours of the PNG are printed at the end. */
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname, 'rooms_original.js'), 'utf8'));
const E = window.EVO, R = E.rooms, O = E.roomsOriginal;

const PRESETS = {
  forge: { gentle: 0.2, steep: 0.33, exp: 0.5, hTol: 0.07, terraces: 5, minRadius: 9, minRoom: 8, hardEdge: 0.5, minSizeEdge: 12, transStrict: 0.45, minTerraceTrans: 8 },
  conical: { gentle: 0.22, steep: 0.27, exp: 0.525, hTol: 0.05, terraces: 2, minRadius: 12, minRoom: 50, hardEdge: 0.03, minSizeEdge: 2, transStrict: 0.46, minTerraceTrans: 8 }
};
const argv = process.argv, has = (k) => argv.includes(k), arg = (k, d) => { const i = argv.indexOf(k); return i > 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const preset = arg('--preset', 'forge'); if (!PRESETS[preset]) { console.error('unknown preset'); process.exit(2); }
const pv = (k) => +arg('--' + k, PRESETS[preset][k]);
const A = { gentle: pv('gentle'), steep: pv('steep'), exp: pv('exp'), hTol: pv('hTol'), terraces: pv('terraces'), minRadius: pv('minRadius'), minRoom: pv('minRoom'), hardEdge: pv('hardEdge'), minSizeEdge: pv('minSizeEdge'), transStrict: pv('transStrict'), minTerraceTrans: pv('minTerraceTrans') };
const mapFile = arg('--map', path.join(__dirname, '../data/samples/skeleton_heightmap_256.png')), outDir = arg('--out', path.join(process.cwd(), 'rooms_out')), scale = +arg('--scale', 4);
const sweep = arg('--sweep', '0.05,0.1,0.2,0.3,0.45').split(',').filter(Boolean).map(Number);
const pre = +arg('--pre', 1), minPlateau = +arg('--minPlateau', 5), subs = +arg('--subs', 3), minCore = +arg('--minCore', 5);

const coreSweep = arg('--coreSweep', '5,20,50').split(',').filter(Boolean).map(Number), crossCosts = arg('--crossCosts', '0,10,30').split(',').filter(Boolean).map(Number);
const prmOf = (transStrict, o = {}) => ({ treeAll: o.treeAll !== false, gentle: A.gentle, steep: A.steep, exponent: A.exp, hTol: A.hTol, minRadius: A.minRadius, minRoom: A.minRoom, hardEdge: A.hardEdge, minSizeEdge: A.minSizeEdge, minCore: o.minCore === undefined ? minCore : o.minCore, crossCost: o.crossCost || 0, transStrict, gateMin: A.minTerraceTrans });

// ---- PNG writer (tool side only) ----
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const writePng = (file, w, h, rgb) => {
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
};

(async () => {
  const rp = await require('./real_pack.js').load(E, { file: mapFile }), W = rp.W, H = rp.H, n = W * H, h = Float32Array.from(rp.mk().elevation, (v) => v / E.ELEVATION_SCALE); // same pack as the viewer (single image, channel V)
  let land = 0, voidN = 0; for (let i = 0; i < n; i++) h[i] > 0 ? land++ : voidN++;
  console.log(`${path.basename(mapFile)}: ${W}x${H}, void ${(voidN / n * 100).toFixed(1)} %, preset ${preset}`);
  console.log('parameters:', JSON.stringify({ ...A, minCore, pre, minPlateau, subs }));

  // the viewer's terraces and gates (global range of the whole map, void included as the lowest value: see docs/rooms.md)
  const le = R.landElevation(h, W, H, 1000), voidInRange = has('--voidInRange');
  const el = voidInRange ? Float32Array.from(h, (v) => v * 1000) : le.el;
  const full = { name: 'm', width: W, height: H, elevation: el, elevRange: voidInRange ? [0, 1000] : le.range, masks: {}, markers: [], fields: {} };
  console.log(`terraces over ${voidInRange ? 'the whole map, void included (old behaviour)' : 'the land only'}: elevation range ${full.elevRange.map((v) => v.toFixed(0)).join('..')}`);
  const Pv = (thr) => ({ terraces: A.terraces, subs, terH: 1, subH: 0.22, minPlateau, minSub: 3, pre, climb: 2, gateThr: thr, gateMin: A.minTerraceTrans });
  const viewer = (thr) => { const P = Pv(thr), q = E.quantize(full, P), t = E.gateTransitions(full, P, 'terrace'); const tiles = []; for (const g of t.groups) for (const i of g.tiles) tiles.push(i); return { ter: Int32Array.from(q.ter), tiles, groups: t.groups.length }; };

  const rows = [];
  const cnt = (res, kind) => {
    const alive = res.alive.length, reach = res.reach.length, tr = res.treeReach || res.tree;
    return { cores: res.cores.length, alive, scanReach: reach, trees: tr.trees, largest: tr.largest, largestOfAlive: alive ? +(tr.largest / alive * 100).toFixed(1) : 0, kind };
  };

  // ---- A, B, C at the requested transStrict ----
  const t0 = Date.now(), prm = prmOf(A.transStrict), vw = viewer(A.transStrict);
  const resA = O.run({ W, H, h, N: A.terraces }, prm, 'literal');
  const resB = O.run({ W, H, h, ter: vw.ter, gateTiles: vw.tiles }, prm, 'viewer');
  const resC = R.build({ W, H, h, ter: vw.ter, gateTiles: vw.tiles }, prm);
  console.log(`\nrooms: seeds ${resA.seeds}, in the list (>= ${A.minRoom} tiles) ${resA.rooms.length}; unassigned land tiles ${resC.stats.unassignedBefore} -> ${resC.stats.unassignedAfter} after the nearest-room assignment (land ${land})`);
  console.log(`room transitions: original ${resA.edges.filter((e) => e.type === 1).length} tile records (A) / ${resB.edges.filter((e) => e.type === 1).length} (B); patched ${resC.expand.transitionPairs} pairs (${resC.expand.transitionTiles} tiles; ${resC.expand.promoted} promoted, ${resC.expand.removedGroups} groups under ${A.minSizeEdge} tiles dropped)`);
  const gs = resC.gateStats;
  console.log(`terrace gates: A (user's code, with the swap leak) ${resA.gateSet.size} low tiles (${resA.leak} are leak records); viewer ${vw.groups} groups / ${vw.tiles.length} low tiles; B ${resB.gateSet.size} after the room condition; C ${gs.groups} groups / ${gs.lowTiles} low tiles / ${gs.pairs} pairs`);
  console.log(`  pairs lost in C: ${gs.lostRoomOrVoid} not in one room or void, ${gs.lostSteep} with a Steep tile (of ${gs.candidatePairs} candidate pairs), ${gs.lostGroup} by the group minimum after that`);
  console.log(`core centres: A ${resA.centreForbidden} of ${resA.alive.length} living cores have a FORBIDDEN centre; C moved ${resC.centres.moved} centres; ${resC.alive.filter((c) => c.center < 0).length} living cores have no free tile at all (they drop out)`);
  const line = (name, c) => console.log(`${name.padEnd(46)} cores ${String(c.cores).padStart(4)}  living ${String(c.alive).padStart(4)}  scan-reachable ${String(c.scanReach).padStart(4)}  trees ${String(c.trees).padStart(3)}  largest tree ${String(c.largest).padStart(4)} (${c.largestOfAlive} % of living)`);
  console.log('');
  line('A  original, literal (own terraces + gates)', cnt(resA)); line('B  original passability, viewer terraces + gates', cnt(resB)); line('C  patched', cnt(resC));
  const allC = resC.treeAll; console.log(`   C counting ALL living cores (not only the scan-reachable): trees ${allC.trees}, largest ${allC.largest} of ${resC.alive.length}; B: ${resB.treeAll.trees} / ${resB.treeAll.largest}; A: ${resA.treeAll.trees} / ${resA.treeAll.largest}`);
  const rooms = (r, who) => { const cs = r.cores.filter((c) => !c.dead), ids = new Set(cs.map((c) => c.room)); return `${who}: ${ids.size} rooms with a living core`; };
  console.log('  ' + rooms(resC, 'C'));
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);

  // ---- sweep of transStrict for C (and the original rule over the same gates, B, for reference) ----
  if (sweep.length) {
    console.log(`\nsweep of transStrict (min group ${A.minTerraceTrans}); gates: viewer groups / C groups and pairs after room, Steep and minimum; cores: largest tree / living (scan-reachable) for C, B and A`);
    for (const thr of sweep) {
      const v = viewer(thr), p = prmOf(thr), c = R.build({ W, H, h, ter: v.ter, gateTiles: v.tiles }, p), b = O.run({ W, H, h, ter: v.ter, gateTiles: v.tiles }, p, 'viewer'), a = O.run({ W, H, h, N: A.terraces }, p, 'literal'), g = c.gateStats;
      const fmt = (r, t) => `${String(t.largest).padStart(3)}/${r.alive.length} (${r.reach.length})`;
      console.log(`  ${String(thr).padEnd(5)} gates: viewer ${String(v.groups).padStart(4)} groups | C ${String(g.groups).padStart(4)} groups ${String(g.pairs).padStart(5)} pairs, ${String(g.lostSteep).padStart(3)} pairs lost to Steep | tree: C ${fmt(c, c.treeReach)}, B ${fmt(b, b.tree)}, A ${fmt(a, a.tree)} (A gate tiles ${a.gateSet.size}, ${a.leak} leak)`);
    }
  }

  // ---- what the spanning tree USES: gates and room transitions crossed by its paths, per minimum core size and per extra cost of crossing a gate ----
  const usedRuns = [];
  if (coreSweep.length) {
    const v = viewer(A.transStrict);
    console.log(`\nUSED by the spanning tree (transStrict ${A.transStrict}, min gate group ${A.minTerraceTrans}); candidates: gate groups / transition groups; tree = forest over the scan-reachable cores`);
    console.log('minCore cost | living scan trees largest | gate groups used/cand (pairs) | transition groups used/cand | tree path steps (unique tiles) | land in largest tree: cores, cores+paths');
    for (const mc of coreSweep) for (const cc of crossCosts) {
      const res = R.build({ W, H, h, ter: v.ter, gateTiles: v.tiles }, prmOf(A.transStrict, { minCore: mc, crossCost: cc, treeAll: false })), u = res.usage, t = res.treeReach;
      usedRuns.push({ mc, cc, res, u });
      console.log(`${String(mc).padStart(7)} ${String(cc).padStart(4)} | ${String(res.alive.length).padStart(4)} ${String(res.reach.length).padStart(4)} ${String(t.trees).padStart(3)} ${String(t.largest).padStart(4)} | ${String(u.usedGateGroups).padStart(3)}/${u.gateGroups} (${u.usedGatePairs}) | ${String(u.usedRoomGroups).padStart(3)}/${u.roomGroups} | ${String(u.steps).padStart(5)} (${u.pathTiles}) | ${(u.bigCoreTiles / land * 100).toFixed(1)} %, ${(u.bigWithPaths / land * 100).toFixed(1)} %`);
    }
  }

  // ---- overlays ----
  if (!has('--noPng')) {
    fs.mkdirSync(outDir, { recursive: true });
    const hue = (id) => { const x = (id * 0.6180339887) % 1, s = 0.45, l = 0.42; const f = (k) => { const a = s * Math.min(l, 1 - l), kk = (k + x * 12) % 12; return l - a * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); }; return [f(0) * 255, f(8) * 255, f(4) * 255]; };
    const paint = (res, who, trans, gates, pairsMode) => {
      const w = W * scale, hh = H * scale, rgb = new Uint8Array(w * hh * 3), set = (x, y, c) => { if (x < 0 || y < 0 || x >= w || y >= hh) return; const o = (y * w + x) * 3; rgb[o] = c[0]; rgb[o + 1] = c[1]; rgb[o + 2] = c[2]; };
      const tile = (i, c) => { const x0 = (i % W) * scale, y0 = ((i / W) | 0) * scale; for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) set(x0 + dx, y0 + dy, c); };
      const coreOf = new Int32Array(n).fill(-1); res.cores.forEach((c, k) => { if (!c.dead) for (const t of c.tiles) coreOf[t] = k; });
      for (let i = 0; i < n; i++) {
        if (h[i] <= 0) { tile(i, [8, 8, 12]); continue; }
        let c = res.room[i] > 0 ? hue(res.room[i]) : [90, 90, 90];
        if (res.cls[i] === R.SL.Steep) c = c.map((v) => v * 0.45);
        if (coreOf[i] >= 0) c = c.map((v) => v * 0.55 + 255 * 0.45);
        tile(i, c);
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (h[i] <= 0) continue; // terrace cliffs: a dark line on the tile side
        if (x + 1 < W && h[i + 1] > 0 && res.ter[i + 1] !== res.ter[i]) for (let d = 0; d < scale; d++) set((x + 1) * scale - 1, y * scale + d, [0, 0, 0]);
        if (y + 1 < H && h[i + W] > 0 && res.ter[i + W] !== res.ter[i]) for (let d = 0; d < scale; d++) set(x * scale + d, (y + 1) * scale - 1, [0, 0, 0]); }
      for (const i of trans) tile(i, [255, 232, 0]);
      for (const i of gates) tile(i, [0, 225, 255]);
      const alive = res.alive, reachSet = new Set(res.reach);
      const tr = pairsMode ? res.treeReach : res.tree, cs = res.reach;
      for (const e of tr.tree) { // draw the path of every tree edge
        const b = R.bfs(W, H, cs[e.i].center, pairsMode ? res.pass : res.rules.walk, true), pth = R.pathTo(b, cs[e.j].center);
        for (const t of pth) { const x0 = (t % W) * scale + (scale >> 1) - 1, y0 = ((t / W) | 0) * scale + (scale >> 1) - 1; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) set(x0 + dx, y0 + dy, [255, 40, 255]); }
      }
      for (const c of alive) { if (c.center < 0) continue; const col = reachSet.has(c) ? [255, 30, 30] : [40, 90, 255], x0 = (c.center % W) * scale - 1, y0 = ((c.center / W) | 0) * scale - 1; for (let dy = 0; dy < scale + 2; dy++) for (let dx = 0; dx < scale + 2; dx++) set(x0 + dx, y0 + dy, col); }
      return { w, h: hh, rgb };
    };
    const trA = new Set(resA.edges.filter((e) => e.type === 1).map((e) => e.pos)), trB = new Set(resB.edges.filter((e) => e.type === 1).map((e) => e.pos));
    const trC = new Set(); for (const p of resC.pairs) if (p.type === 1) { trC.add(p.a); trC.add(p.b); }
    const gC = new Set(); for (const [a, b] of resC.gate) { gC.add(a); gC.add(b); }
    const pa = paint(resA, 'A', trA, resA.gateSet, false), pb = paint(resB, 'B', trB, resB.gateSet, false), pc = paint(resC, 'C', trC, gC, true);
    const tag = `${preset}_t${A.transStrict}_m${A.minTerraceTrans}`;
    writePng(path.join(outDir, `${tag}_A.png`), pa.w, pa.h, pa.rgb); writePng(path.join(outDir, `${tag}_B.png`), pb.w, pb.h, pb.rgb); writePng(path.join(outDir, `${tag}_C.png`), pc.w, pc.h, pc.rgb);
    const paintUsed = (r) => { // only what the tree uses: gates (cyan), transitions (yellow), paths (magenta), centres (red); rooms faint, cliffs thin
      const res = r.res, u = r.u, w = W * scale, hh = H * scale, rgb = new Uint8Array(w * hh * 3), set = (x, y, c) => { if (x < 0 || y < 0 || x >= w || y >= hh) return; const o = (y * w + x) * 3; rgb[o] = c[0]; rgb[o + 1] = c[1]; rgb[o + 2] = c[2]; };
      const tile = (i, c) => { const x0 = (i % W) * scale, y0 = ((i / W) | 0) * scale; for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) set(x0 + dx, y0 + dy, c); };
      for (let i = 0; i < n; i++) { if (h[i] <= 0) { tile(i, [8, 8, 12]); continue; } const c = res.room[i] > 0 ? hue(res.room[i]) : [90, 90, 90]; tile(i, c.map((v) => v * 0.45 + 20)); }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (h[i] <= 0) continue;
        if (x + 1 < W && h[i + 1] > 0 && res.ter[i + 1] !== res.ter[i]) for (let d = 0; d < scale; d++) set((x + 1) * scale - 1, y * scale + d, [0, 0, 0]);
        if (y + 1 < H && h[i + W] > 0 && res.ter[i + W] !== res.ter[i]) for (let d = 0; d < scale; d++) set(x * scale + d, (y + 1) * scale - 1, [0, 0, 0]); }
      const cs = res.reach, tr = res.treeReach;
      for (const e of tr.tree) { const b = R.dijkstra(W, H, cs[e.i].center, res.pass, true, res.extra); for (const t of R.pathTo(b, cs[e.j].center)) { const x0 = (t % W) * scale + (scale >> 1) - 1, y0 = ((t / W) | 0) * scale + (scale >> 1) - 1; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) set(x0 + dx, y0 + dy, [255, 40, 255]); } }
      for (const k of u.usedRoom.keys()) { const a = Math.floor(k / n), b = k % n; tile(a, [255, 232, 0]); tile(b, [255, 232, 0]); }
      for (const k of u.usedGate.keys()) { const a = Math.floor(k / n), b = k % n; tile(a, [0, 225, 255]); tile(b, [0, 225, 255]); }
      for (const c of cs) { if (c.center < 0) continue; const x0 = (c.center % W) * scale - 1, y0 = ((c.center / W) | 0) * scale - 1; for (let dy = 0; dy < scale + 2; dy++) for (let dx = 0; dx < scale + 2; dx++) set(x0 + dx, y0 + dy, [255, 30, 30]); }
      return { w, h: hh, rgb };
    };
    for (const r of usedRuns) { const pu = paintUsed(r); writePng(path.join(outDir, `${tag}_used_core${r.mc}_cost${r.cc}.png`), pu.w, pu.h, pu.rgb); }
    const gap = 8, w2 = pa.w * 2 + gap, both = new Uint8Array(w2 * pa.h * 3).fill(30);
    for (let y = 0; y < pa.h; y++) { Buffer.from(pa.rgb.buffer, y * pa.w * 3, pa.w * 3).copy(Buffer.from(both.buffer), y * w2 * 3); Buffer.from(pc.rgb.buffer, y * pc.w * 3, pc.w * 3).copy(Buffer.from(both.buffer), (y * w2 + pa.w + gap) * 3); }
    writePng(path.join(outDir, `${tag}_A_vs_C.png`), w2, pa.h, both);
    console.log(`\nPNG in ${outDir}: ${tag}_A.png, _B.png, _C.png and _A_vs_C.png (left original, right patched)`);
    console.log('colours: void black; rooms = one colour each (dark = Steep tile, light = tile of a living core); thin black line = terrace cliff; yellow = room transition tiles; cyan = terrace gate tiles; magenta = paths of the spanning tree; red square = centre of a core reached by the scan; blue square = living core the scan did not reach');
  }
})();
