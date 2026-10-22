/* Diorama in the chain view (DAC v2 PR C, D30): eligibility, the translated footprint, the landing, the bridge, the pocket and the walking, on the real map built like the viewer (tools/real_pack.js).
     node tools/test_diochain.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
for (const f of ['png', 'fields', 'shape', 'tech', 'rooms', 'roomtypes', 'pocket']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, `../src/${f}.js`), 'utf8'));
const E = window.EVO, T = E.roomTypes; let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : extra); } };
const src = fs.readFileSync(path.join(__dirname, 'test_roomtypes.js'), 'utf8'), P0 = eval('(' + src.match(/const P0 = (\{[^;]*\});/)[1] + ')');
const EX = { balanced: { P: { ...P0, terraces: 3, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[122, 201]], fin: [47, 75] }, chain5: { P: { ...P0, terraces: 5, roomsMinCore: 100, rRadius: 5, minPlateau: 120 }, stake: [200, 62], subs: [[87, 136]], fin: [25, 128] } };
(async () => {
  const { mk } = await require('./real_pack.js').load(E);
  const out = {};
  for (const [name, ex] of Object.entries(EX)) for (const k of [1, 0]) {
    const P = { ...ex.P, pocketYaw: 45 }, S0 = E.shape(mk(), P, null), at = (xy) => (xy[1] - S0.oy) * S0.W + (xy[0] - S0.ox), st = at(ex.stake), fin = at(ex.fin), subs = k ? ex.subs.map(at) : [];
    const ch = T.roomChain(S0, P, st, fin, undefined, subs), tp = T.chainTypes(S0, P, ch, 'v164', st, fin), goals = ch.goalTiles && ch.goalTiles.length ? ch.goalTiles : [st, fin];
    const typeOf = (r) => (tp.map.has(r) ? tp.map.get(r).type : (S0.types.rooms.get(r) || {}).type), ids = [...new Set(ch.rooms)].sort((a, b) => a - b);
    for (const mode of ['m2', 'm1']) {
      const PP = { ...P, dioChain: mode, chainIds: ids, chainSeqs: [ch.pieces], chainBlocked: ch.blocked, chainExtra: 3 };
      const dp = T.dioPlan(S0, PP, { chainIds: ids, pieces: ch.pieces, goals, typeOf }), tmap = new Map(tp.map); for (const r of dp.demoted) tmap.set(r, { type: T.ASCENSION, up: false });
      PP.chainTypes = tmap; PP.dioPlan = dp;
      const t0 = Date.now(), S1 = E.shape(mk(), PP, null), ms = Date.now() - t0;
      out[`${name}-K${k}-${mode}`] = { dp, S1, S0, ch, goals, ms, PP };
      console.log(name, 'K' + k, mode, 'eligible', dp.eligible.join(','), 'demoted', dp.why.map((d) => d.room + ':' + d.why).join(' | '), 'info', JSON.stringify(S1.dioInfo), ms + ' ms');
    }
  }
  global.__out = out; if (process.argv[2] === 'probe') process.exit(0);
  console.log(pass + ' PASS, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
