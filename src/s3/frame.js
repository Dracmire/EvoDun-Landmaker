/* STAGE NEIGHBOURS AS FRAME (DAC3, PR pend P4, T62; `E.s3.frame`; switch "Neighbours as frame" `st.stage.frameNb`, off by default = byte for byte): the rooms that stand OUTSIDE the window next to the hero's room are drawn as REAL ground instead of the walls and columns of the planes:
   - the tiles of every neighbouring room (a room of the map that is not in the window, with at least one tile inside the ring of E.s3.planes HYP.R of the footprint) are collected in a skip mask: `E.s3.planes.apply` never classifies them (no back wall, no column, no lowering there);
   - with a height treatment Up / Down each neighbour is re-heighted with the lego of ITS OWN terraces (`E.s3.lego.apply` with the neighbour as the room: its m, its jumps, its sub-levels), the same rule as the hero's room; with Mid nothing is moved (the neighbours stand at their real heights).
   The neighbours are not walkable here: lego.apply reads the walkable tiles of a room (region >= 0, not blocked), so for the call the region (0) and the block flag (off) of the neighbour's tiles are lent and given back right after; the walking graph, the regions, the stairs and the hero's room are not touched (hash in tools/test_frame.js). Visual only. Everything lives in DAC3 (src/s3/). */
(function (E0) {
  const E = E0.s3 || (E0.s3 = Object.create(E0)), F = E.frame = {};
  /* neighbours(S, room, yaw) -> { ids: [room ids], skip: Uint8Array (tiles of those rooms), tiles } */
  F.neighbours = function (S, room, yaw) {
    const C = E.planes.classify(S, room, yaw, { all: true }), zm = E.stage.zoneMap(S), vd = S.void, ids = new Set();
    for (let i = 0; i < S.n; i++) { if (!C.cls[i] || C.walk(i)) continue; const r = zm[i]; if (r && r !== room.id && !(vd && vd[i])) ids.add(r); }
    const skip = new Uint8Array(S.n); let tiles = 0;
    for (let i = 0; i < S.n; i++) { const r = zm[i]; if (r && ids.has(r) && !(vd && vd[i]) && !C.walk(i)) { skip[i] = 1; tiles++; } }
    return { ids: [...ids].sort((a, b) => a - b), skip, tiles };
  };
  /* apply(S, P, { room, yaw, treatment, tilesPerH, cakeLego }) -> S.frameNb = { ids, tiles, rooms: [{ id, m, terraces, single, moved, levelsAdded }], skip } */
  F.apply = function (S, P, o) {
    const N = F.neighbours(S, o.room, o.yaw), zm = E.stage.zoneMap(S), keepInfo = S.legoInfo, rooms = [];
    if (o.treatment === 'up' || o.treatment === 'down') for (const id of N.ids) {
      const lent = []; // tiles outside the window are blocked and have no region: lend them (region 0, not blocked) for the call and give them back (try / finally), so lego.apply reads them as the walkable tiles of the neighbour
      for (let i = 0; i < S.n; i++) if (zm[i] === id && S.region && S.region[i] < 0 && !(S.void && S.void[i])) lent.push(i);
      const blk = lent.map((i) => S.block[i]); lent.forEach((i) => { S.region[i] = 0; S.block[i] = 0; });
      let li; try { li = E.lego.apply(S, P, { room: { id, yaw: o.yaw }, yaw: o.yaw, treatment: o.treatment, tilesPerH: o.tilesPerH, cakeLego: 'rest' }); } finally { lent.forEach((i, k) => { S.region[i] = -1; S.block[i] = blk[k]; }); }
      rooms.push({ id, m: li.m, terraces: li.terraces, single: li.single, moved: li.moved, levelsAdded: li.levelsAdded });
    }
    S.legoInfo = keepInfo; S.cache = {};
    return (S.frameNb = { ids: N.ids, tiles: N.tiles, rooms, skip: N.skip });
  };
})(window.EVO = window.EVO || {});
