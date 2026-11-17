const L = require('./lib.js'), C = require('./common.js'), M = C.M; const fs = require('fs');
(async () => {
  const a = await L.open(); const fyOut = {};
  for (const pos of ['n1', 'n2', 'n3']) {
    let found = null;
    for (let fy = 0.5; fy <= 0.8001 && !found; fy += 0.01) {
      await a.put({ tricks: ['A6'], pos, hs: [0.63, +fy.toFixed(2)] });
      const g = await a.grab(true); const cap = M.maskTiles(g.ids, C.RAILONLY, [4]); const tops = [];
      for (let x = 0; x < 1280; x++) for (let y = 0; y < 720; y++) if (cap[y * 1280 + x]) { tops.push(y); break; }
      const yt = M.median(tops) / 720; console.log(pos, fy.toFixed(2), yt.toFixed(3), cap.count);
      if (yt >= 0.40 && yt <= 0.60) found = +fy.toFixed(2);
    }
    fyOut[pos] = found;
  }
  fs.writeFileSync('/home/claude/salat/harness/fy.json', JSON.stringify(fyOut)); console.log(fyOut); console.log(a.errs); await a.close();
})();
