const L = require('./lib.js'); const fs = require('fs');
(async () => {
  const a = await L.open();
  console.log(await a.eval(() => { const ev = window.__evo, S = ev.S(); const cv = document.querySelector('#stage canvas'); return { ex: ev.st.exampleId, mode: ev.st.modeId, pack: ev.st.pack, cv: [cv.width, cv.height, cv.clientWidth, cv.clientHeight], S: S && { W: S.W, H: S.H, ox: S.ox, oy: S.oy, levels: S.levelH, stairs: S.stairs.length, regions: S.regionSizes, salat: S.salat }, hero: ev.st.hero, rooms: ev.st.stageRooms, info: document.querySelector('#info').textContent.slice(0, 600) }; }));
  const c = await a.canvas(); fs.writeFileSync('/home/claude/salat/out/dev1.png', c.png);
  console.log(a.errs);
  await a.close();
})();
