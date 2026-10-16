/* Cake ON, real map (Balanced types and Default): the whole map in Box / A / B / C at Cam 1 and Cam 3, and close-ups (about 16 px per tile; Cam 4 about 30) of one Up seam and one Down link in Box and B (Cam 1), plus the Up seam at Cam 4 (Low) in Box and B, for the visual review of Cake v2 for Up links.
   The Up link is the Balanced-types one with the most ring tiles whose core has sub-levels (at least 2 distinct heights), the Down link the one with the most ring tiles; the first run (the tree under review) writes spots.json, the second (EVO_ROOT = the old tree) reads it with --spots.
     NODE_PATH=$(npm root -g) EVO_INFO_H=80.2 node tools/ui/cake_up_shots.js <outDir> [--spots <spots.json>]      (EVO_ROOT=<old checkout> for the before pictures) */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const IMG = path.join(__dirname, '../../data/samples/skeleton_heightmap_256.png');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
(async () => {
  const out = process.argv[2]; if (!out) { console.error('usage: cake_up_shots.js <outDir> [--spots <file>]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900 }), page = a.page, shot = async (name) => fs.writeFileSync(path.join(out, name + '.png'), await a.canvas());
  await page.click('#mode'); await a.idle();
  await page.setInputFiles('#file', [IMG]); await page.waitForTimeout(1500); await a.idle();
  await page.check('#t-rooms'); await a.idle(); await page.check('#t-cake'); await a.idle();
  const sp = arg('--spots'), saved = sp ? JSON.parse(fs.readFileSync(sp, 'utf8')) : {}, found = {};
  for (const cfg of ['default', 'balanced']) { // Default first (the preset at load), then Balanced types
    if (cfg === 'balanced') { await page.selectOption('#roomsPreset', 'balanced'); await a.idle(); }
    for (const t of ['box', 'A', 'B', 'C']) { await a.tech(t); for (const p of ['isoE', 'oblique']) { await a.preset(p); await shot(`${cfg}_${t}_${p}`); } }
    if (cfg === 'default') { // the Up ring tiles that sit on a core tile of ANOTHER Cake room (the airspace of Up v2), split by the direction of the cake that owns that core: the densest 10 x 10 cell of each kind
      const core = saved.core || await page.evaluate(() => {
        const S = window.__evo.S(), RL = S.rooms, fw = S.mapW, T = window.EVO.roomTypes, cells = { up: new Map(), down: new Map() };
        for (const [m, c] of S.cake.claim) { if (c.link.down || RL.room[m] === c.link.room || RL.room[m] <= 0) continue; const o2 = S.types.rooms.get(RL.room[m]); if (!o2 || o2.type !== T.CAKE) continue;
          const ds = o2.linkList.filter((l2) => l2.core === RL.ter[m]); if (!ds.length) continue; const k = ds.some((l2) => !l2.down) ? 'up' : 'down', x = (m % fw) - S.ox, y = ((m / fw) | 0) - S.oy, ck = Math.floor(x / 10) + ',' + Math.floor(y / 10); let a = cells[k].get(ck); if (!a) cells[k].set(ck, a = []); a.push([x, y]); }
        const out = {}; for (const k of ['up', 'down']) { let best = null; for (const a of cells[k].values()) if (!best || a.length > best.length) best = a; if (best) out[k] = { n: best.length, x: best.reduce((p, q) => p + q[0], 0) / best.length + 0.5, y: best.reduce((p, q) => p + q[1], 0) / best.length + 0.5 }; } return out; });
      found.core = core;
      for (const key of ['up', 'down']) { const s = core[key]; if (!s) continue;
        const info = await page.evaluate(({ x, y }) => { const e = window.__evo, S = e.S(), i = Math.min(S.n - 1, Math.max(0, Math.floor(y) * S.W + Math.floor(x))); return { h: S.levelH[S.fine[i]], fit: e.st.fitSc }; }, s);
        for (const t of ['box', 'B']) { await a.tech(t); await a.preset('isoE'); await a.focus(s.x, s.y, info.h, 16 / info.fit); await shot(`corespot_${key}_${t}_isoE`); } }
    }
    if (cfg !== 'balanced') continue;
    let spots;
    if (saved.up || saved.down) spots = saved;
    else {
      spots = await page.evaluate(() => {
        const e = window.__evo, S = e.S(), fw = S.mapW, RL = S.rooms, win = (m) => [(m % fw) - S.ox, ((m / fw) | 0) - S.oy], best = { up: null, down: null };
        const count = new Map(); for (const [t, c] of S.cake.claim) { const k = c.link.room + ':' + c.link.low + ':' + c.link.high; count.set(k, (count.get(k) || 0) + 1); }
        for (const l of S.cake.list) {
          if (l.flat) continue; const o = S.types.rooms.get(l.room), lk = o.linkList.find((k) => k.low === l.low && k.high === l.high), n = count.get(l.room + ':' + l.low + ':' + l.high) || 0, key = l.down ? 'down' : 'up'; if (!lk || !lk.pos.length) continue;
          let hs = new Set(); if (!l.down) for (let m = 0; m < RL.room.length; m++) if (RL.room[m] === l.room && RL.ter[m] === lk.core) { const x = (m % fw) - S.ox, y = ((m / fw) | 0) - S.oy; if (x >= 0 && y >= 0 && x < S.W && y < S.H) hs.add(Math.round(S.levelH[S.fine[y * S.W + x]] * 1e4)); }
          if (!l.down && hs.size < 2) continue; if (!best[key] || n > best[key].n) { let sx = 0, sy = 0; for (const p of lk.pos) { const w = win(p); sx += w[0]; sy += w[1]; } best[key] = { n, room: l.room, low: l.low, high: l.high, x: sx / lk.pos.length + 0.5, y: sy / lk.pos.length + 0.5, coreHeights: hs.size };
          }
        }
        return best;
      });
      found.up = spots.up; found.down = spots.down;
    }
    for (const key of ['up', 'down']) {
      const s = spots[key]; if (!s) continue;
      const info = await page.evaluate(({ x, y }) => { const e = window.__evo, S = e.S(), i = Math.min(S.n - 1, Math.max(0, Math.floor(y) * S.W + Math.floor(x))); return { h: S.levelH[S.fine[i]], fit: e.st.fitSc }; }, s);
      for (const [t, cams] of [['box', key === 'up' ? ['isoE', 'low'] : ['isoE']], ['B', key === 'up' ? ['isoE', 'low'] : ['isoE']]]) { await a.tech(t); for (const c of cams) { await a.preset(c); await a.focus(s.x, s.y, info.h, (c === 'low' ? 30 : 16) / info.fit); await shot(`closeup_${key}_${t}_${c}`); } } // Cam 4 (Low) at about 30 px per tile: the platform against its rings seen from the side
    }
  }
  fs.writeFileSync(path.join(out, 'spots.json'), JSON.stringify(Object.assign({}, saved, found)));
  console.log('errors:', a.errs); await a.browser.close();
})();
