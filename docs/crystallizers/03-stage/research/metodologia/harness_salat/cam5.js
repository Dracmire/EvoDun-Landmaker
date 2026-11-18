const L = require('./lib.js'), C = require('./common.js'); const fs = require('fs');
(async () => {
  const a = await L.open();
  await a.put({ tricks: [], pos: 's1', hs: null });
  await a.eval(() => { const ev = window.__evo, st = ev.st; st.preset = 'top'; st.follow = false; st.zoom = 1; st.panX = st.panY = 0; st.stage.heroScreen = null; ev.draw(); });
  await a.idle(); const t = await a.grab(false); fs.writeFileSync(`${L.OUT}/SUELO_plano_cam5.png`, t.png); console.log(L.sha(t.png), a.errs); await a.close();
})();
