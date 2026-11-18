const L = require('./lib.js'); const fs=require('fs'); (async()=>{ const a = await L.open({closure:8});
await a.eval(()=>{window.SALAT.params.A3a={x:4,z:27,w:2,d:2,h:5};}); await a.put({tricks:['A3a'],pos:'m1',hs:null}); const g=await a.grab(false); fs.writeFileSync('/home/claude/salat/scratch/t2.png',g.png); await a.close();})();
