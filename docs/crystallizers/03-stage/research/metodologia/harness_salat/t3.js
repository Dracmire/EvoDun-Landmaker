const L = require('./lib.js'), C = require('./common.js'), M = C.M; const fs=require('fs'); (async()=>{ const a = await L.open({closure:8});
await a.eval(()=>{window.SALAT.params.A3a={x:5,z:30,w:2,d:2,h:6};}); await a.put({tricks:['A3a'],pos:'m1',hs:null}); const g=await a.grab(true); fs.writeFileSync('/home/claude/salat/scratch/t3.png',g.png);
const tiles=new Set(); for(let z=30;z<32;z++)for(let x=5;x<7;x++)tiles.add((55-z)*41+x); const m=M.maskTiles(g.ids,tiles,[2,4]); const cols={}; for(let y=0;y<720;y++)for(let x=0;x<1280;x++) if(m[y*1280+x]){ const k=Math.floor(x/64); cols[k]=(cols[k]||0)+1;} console.log(cols, M.bbox(m));
const far=[]; for(let y=0;y<720;y++)for(let x=480;x<1280;x++) if(m[y*1280+x]) far.push([x,y,g.ids[y*1280+x]>>20, g.ids[y*1280+x]&0xfffff]); console.log(far.slice(0,10));
await a.close();})();
