const L = require('./lib.js'), C = require('./common.js'), M = C.M; const fs=require('fs'); (async()=>{ const a = await L.open({closure:8});
const SEL=JSON.parse(fs.readFileSync('/home/claude/salat/scratch/sel3.json'));
await a.eval((s) => { const P = window.SALAT.params; P.A3a = { x: s.A3a.x, z: s.A3a.z, w: 2, d: 2, h: s.A3a.h }; P.A3b = { x: s.A3b.x, z: s.A3b.z, w: 3, d: 2, h: s.A3b.h }; P.A4 = { bill: Object.assign({}, s.A4) }; P.C2 = { h: s.C2.h, cols: s.C2.cols }; P.B3 = { h: 4 }; }, SEL);
await a.put({tricks:['A6','A3a','A3b','A4','C3','C2','B3'],pos:'s1',hs:C.HS.s1}); const g=await a.grab(true);
const wall=M.maskTiles(g.ids,C.RAILONLY,[2]); const cols=new Map(); for(let y=0;y<720;y++)for(let x=0;x<1280;x++) if(wall[y*1280+x]) cols.set(x,(cols.get(x)||0)+1); const xs=[...cols.keys()].sort((a,b)=>a-b); console.log('n cols',xs.length,'median x',xs[xs.length>>1],'px',cols.get(xs[xs.length>>1]), 'hist', JSON.stringify([...new Set([...cols.values()])].sort((a,b)=>a-b)));
await a.close();})();
