/* LEGO VERTICALITY BY TERRACE (rule L2', docs/crystallizers/03-stage/research/octopath2/stage_lego_go.md section 4): the same measurements as tools/ui/vert_measure.js (rho, relative height of the hero, walkable occluders, visible bands, the topology hash) in k0, k4, k8 of the mockups M1, M3, the Down example L1 (Diorama 7, Cima) and the control C0, in Cam 6 and Cam 7, with the "Height treatment" selector on Mid (today) and on Auto (what the example declares: Up / Down / Mid), plus what lego.js did (m, jumps, terraces, single, conflict, yawFlip, tiles moved). Shots of M1 and L1.
     NODE_PATH=$(npm root -g) node tools/ui/lego_measure.js <outDir> [--no-shots] [--only id,id] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2], SHOTS = !process.argv.includes('--no-shots'), oi = process.argv.indexOf('--only'), ONLY = oi > 0 ? process.argv[oi + 1].split(',') : null;
if (!out) { console.error('usage: vert_measure.js <outDir> [--no-shots] [--only id,id]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const EX = ['perfil_u1', 'perfil_u2', 'perfil_l1'].filter((x) => !ONLY || ONLY.includes(x)), CAMS = [['stage', 'cam6'], ['classic', 'cam7']];
(async () => {
  const a = await open({ w: 1280, h: 760, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle();
  const res = {};
  const setVert = async (on) => { await ev((on) => { const c = document.querySelector('#stageHeight'); c.value = on ? 'auto' : 'mid'; c.dispatchEvent(new Event('change')); }, on); await a.idle(); await a.idle(); };
  for (const id of EX) {
    await page.click(`#examples button[data-id="${id}"]`); await a.idle(); await a.idle();
    const path0 = await ev(() => { const e = window.__evo, S = e.S(), p = S.propsC && S.propsC.data ? S.propsC.data.path : []; return p.map((t) => [t % S.W, (t / S.W) | 0]); });
    const N = path0.length, ks = []; for (let i = 0; i <= 8; i++) ks.push(path0[Math.floor(i * (N - 1) / 8 + 0.5)]);
    for (const [cam, camName] of CAMS) {
      await page.click(`#presets button[data-id="${cam}"]`); await a.idle(); await a.idle();
      for (const on of [false, true]) {
        await setVert(on);
        for (const i of (id === 'perfil_l1' ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 4, 8])) {
          await ev(({ k, cam }) => { const e = window.__evo, S = e.S(); e.st.follow = true; e.st.hero = { x: S.ox + k[0] + 0.5, y: S.oy + k[1] + 0.5 }; e.redraw(); }, { k: ks[i], cam });
          await a.idle();
          if (cam === 'classic') { // Cam 7 has no hero tracking: the same scale as Cam 6 (px per tile at the pivot) centred on the hero
            await ev(() => { const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, cv = document.querySelector('#stage canvas'), h = st.persH || cv.clientHeight, w = cv.clientWidth, tp = st.stage.tilesPerH, sc = st.stage.heroFrac * h / tp, zoom = sc / st.fitSc, hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, f = E.stage.feetH(S, E.stage.cellOf(S, hw.x, hw.y)) + 0.5 * tp; st.follow = false; st.zoom = zoom; st.panX = st.panY = 0; const v = e.view(); const p = E.makeCam(S, e.P, v, w, h).p(hw.x, hw.y, f); st.panX = w / 2 - p[0]; st.panY = h * 0.55 - p[1]; e.draw(); });
            await a.idle();
          }
          const shot = SHOTS && (i === 0 || i === 4 || i === 8) ? path.join(out, `${id}_${camName}_${on ? 'lego' : 'base'}_k${i}.png`) : null;
          if (shot) await page.screenshot({ path: shot });
          const m = await ev(() => {
            const e = window.__evo, E = window.EVO, S = e.S(), st = e.st, P = e.P, tp = st.stage.tilesPerH, cv = document.querySelector('#stage canvas'), w = cv.clientWidth, h = st.persH || cv.clientHeight, v = e.view(), W = S.W, n = S.n, zm = E.stage.zoneMap(S);
            const yaw = v.yaw * Math.PI / 180, look = [-Math.sin(yaw), -Math.cos(yaw)], hw = { x: st.hero.x - S.ox, y: st.hero.y - S.oy }, hi = E.stage.cellOf(S, hw.x, hw.y), hh = S.levelH[S.fine[hi]], hu = hw.x * look[0] + hw.y * look[1], rid = st.stageRooms[0];
            const D = E.pickBuffer(S, P, v, w, h, { pickWalls: true }).data, seen = new Uint8Array(n); for (let q = 0; q < w * h; q++) { const code = (D[4 * q] << 16) | (D[4 * q + 1] << 8) | D[4 * q + 2], k = code >> 20, t = code & 0xfffff; if (D[4 * q + 3] === 255 && k >= 2 && k <= 4 && t < n) seen[t] = 1; }
            const walk = (i) => E.stage.walkable(S, i) && S.region[i] >= 0 && zm[i] === rid;
            const rank = (a) => { const idx = a.map((_, i) => i).sort((p, q) => a[p] - a[q]), r = new Array(a.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++; const mr = (i + j) / 2; for (let k = i; k <= j; k++) r[idx[k]] = mr; i = j + 1; } return r; };
            const spearman = (xs, ys) => { if (xs.length < 3) return null; const rx = rank(xs), ry = rank(ys), mx = rx.reduce((p, q) => p + q, 0) / rx.length, my = ry.reduce((p, q) => p + q, 0) / ry.length; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < rx.length; i++) { sxy += (rx[i] - mx) * (ry[i] - my); sxx += (rx[i] - mx) ** 2; syy += (ry[i] - my) ** 2; } return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null; };
            const all = { h: [], u: [] }, wk = { h: [], u: [] }; let below = 0, belowW = 0, occ = 0;
            for (let i = 0; i < n; i++) { if (!seen[i] || (S.void && S.void[i])) continue; const hgt = S.levelH[S.fine[i]], u = ((i % W) + 0.5) * look[0] + (((i / W) | 0) + 0.5) * look[1]; all.h.push(hgt); all.u.push(u); if (hgt < hh - 1e-6) below++;
              if (walk(i)) { wk.h.push(hgt); wk.u.push(u); if (hgt < hh - 1e-6) belowW++; if (hgt > hh + 1e-6 && u < hu - 1e-9) occ++; } }
            // topology hash: block, void, region, roomMap, the walking graph, the stairs
            let hsh = 0; const mix = (x) => { hsh = (Math.imul(hsh ^ (x | 0), 0x01000193) + 0x9e3779b9) | 0; }; const nb = E.s3.walkGraph(S, P); for (let i = 0; i < n; i++) { mix(S.block[i]); mix(S.void ? S.void[i] : 0); mix(S.region ? S.region[i] : 0); mix(S.roomMap ? S.roomMap[i] : 0); for (const j of nb(i)) mix(j); } for (const s of S.stairs || []) for (const t of (s.bottom || []).concat(s.top || [])) mix(t);
            /* PASS 2: visible BANDS = the distinct heights of the VISIBLE walkable tiles of the room, grouped when they differ by less than 0.5 E (E = P.terH); heroTer / roomTer = the terrace of the tile the hero stands on and the highest terrace the room steps on (climb = the hero is not on the highest one; summit = it is) */ const Eh = P.terH, hs = [...wk.h].sort((a, b) => a - b); let bands = 0, last = -1e9; for (const x of hs) { if (x - last >= 0.5 * Eh) bands++; last = x; } let roomTer = -1; for (let i = 0; i < n; i++) if (walk(i)) { const mt = S.levelMeta[S.fine[i]]; if (!mt.bridge && !mt.deco && mt.ter > roomTer) roomTer = mt.ter; } const heroTer = S.levelMeta[S.fine[hi]].ter; const li = S.legoInfo ? { treatment: S.legoInfo.treatment, m: S.legoInfo.m, terraces: S.legoInfo.terraces, single: S.legoInfo.single, moved: S.legoInfo.moved, jumps: S.legoInfo.jumps, conflict: S.legoInfo.conflict, yawFlip: S.legoInfo.yawFlip, sceneryLowered: S.legoInfo.sceneryLowered || 0 } : null; return { lego: li, bands, heroTer, roomTer, summit: heroTer >= roomTer, yaw: v.yaw, rhoAll: spearman(all.h, all.u), rhoWalk: spearman(wk.h, wk.u), relAll: all.h.length ? below / all.h.length : null, relWalk: wk.h.length ? belowW / wk.h.length : null, occluders: occ, occShare: wk.h.length ? occ / wk.h.length : 0, visAll: all.h.length, visWalk: wk.h.length, heroH: hh / tp, topo: (hsh >>> 0).toString(16), vert: S.vert ? { changed: S.vert.changed, levels: S.vert.levels, conflict: S.vert.conflict, order: S.vert.order } : null };
          });
          (res[id] = res[id] || []).push({ cam: camName, on, k: 'k' + i, tile: ks[i], ...m });
        }
      }
      await setVert(false);
    }
    const r = res[id].filter((x) => x.k === 'k4');
    console.log(id, r.map((x) => `${x.cam}/${x.on ? 'on' : 'off'} rhoW ${x.rhoWalk === null ? '-' : x.rhoWalk.toFixed(2)} rhoA ${x.rhoAll === null ? '-' : x.rhoAll.toFixed(2)} rel ${x.relWalk === null ? '-' : x.relWalk.toFixed(2)} occ ${x.occluders}`).join(' | '));
    await page.click(`#presets button[data-id="stage"]`); await a.idle();
  }
  fs.writeFileSync(path.join(out, 'lego2_medidas.json'), JSON.stringify(res, null, 1)); console.log('errors:', a.errs); await a.browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
