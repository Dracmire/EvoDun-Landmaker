const L = require('./lib.js'), C = require('./common.js'), M = C.M; (async()=>{ const a = await L.open({closure:8});
await a.put({tricks:['A6'],pos:'s1',hs:C.HS.s1}); const g=await a.grab(true);
const kAt=(pts)=>a.eval((p)=>window.SALAT.kAt(p),pts);
const r=await M.A6(g,{railOnly:C.RAILONLY,posts:C.POSTS,all:C.lip,kAt:async(p)=>{const k=await kAt(p); console.log('kAt',JSON.stringify(p),k); return k;},railTop:6.6,postTop:7.8}); console.log(JSON.stringify(r)); await a.close();})();
