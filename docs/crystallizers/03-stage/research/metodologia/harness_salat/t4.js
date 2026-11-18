const L = require('./lib.js'), C = require('./common.js'), M = C.M; (async()=>{ const a = await L.open({closure:8});
for (const pos of ['s1','m1','n1']) { await a.put({tricks:['A6'],pos,hs:C.HS[pos]}); const g=await a.grab(true);
 const r=await a.eval(()=>{const S0=window.SALAT; const near=S0.Yz(38)+1; const p0=S0.proj([[14.5,near,5]])[0], p1=S0.proj([[14.5,near,6.6]])[0], p2=S0.proj([[12.5,near,5]])[0],p3=S0.proj([[12.5,near,7.8]])[0]; return {rail:p0[1]-p1[1], post:p2[1]-p3[1], k:S0.kAt([[14.5,near,5]])[0]};});
 const wall=M.maskTiles(g.ids,C.RAILONLY,[2]); const cols=new Map(); for(let y=0;y<720;y++)for(let x=0;x<1280;x++) if(wall[y*1280+x]) cols.set(x,(cols.get(x)||0)+1); const vals=[...cols.values()].sort((a,b)=>a-b);
 console.log(pos, JSON.stringify(r), 'heroHpx', g.meta.hero.hpx.toFixed(1), 'sc',g.meta.sc, 'wall col px median', vals[vals.length>>1], 'max', vals[vals.length-1], 'n', vals.length); }
await a.close();})();
