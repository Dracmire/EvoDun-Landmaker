#!/bin/sh
# usage: mkprobe.sh <commit> <dir>  : a worktree of the commit with the __perf draw hook (ui.js) and the section timers (render.js); never committed
set -e
D=$2; rm -rf $D; git -C /home/user/EvoDun-Landmaker worktree prune; git -C /home/user/EvoDun-Landmaker worktree add -f $D $1 >/dev/null 2>&1
python3 - "$D" <<'PY'
import sys
D=sys.argv[1]
def patch(p,pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1,(p,a[:60],s.count(a)); s=s.replace(a,b)
    open(p,'w').write(s)
patch(D+'/src/ui.js',[
 ("  function draw() {\n    raf = 0;","  const __m = (n) => { if (window.__perf) window.__perf.m(n); };\n  function draw() { const p = window.__perf; if (p) p.begin(); try { draw1(); } finally { if (p) p.end(); } }\n  function draw1() {\n    raf = 0;"),
 ("const incursion = computeIncursion(); O.incursion = incursion;","__m('pre'); const incursion = computeIncursion(); O.incursion = incursion; __m('incursion');"),
 ("    const token = ++drawToken, v = view(), t0 = st.t0 || performance.now();","    __m('fit'); const token = ++drawToken, v = view(), t0 = st.t0 || performance.now();"),
 ("    for (const t of techs) survOf(t);\n","    __m('paint'); for (const t of techs) survOf(t); __m('surv');\n"),
 ("      info(surv, techs); $('#busy').hidden = true;","      info(surv, techs); __m('info'); $('#busy').hidden = true;")])
patch(D+'/src/render.js',[
 ("    const DRESS = !!o.dress && !PICK, lvl = S.fineMask || S.fine, th = P.terH;","    const __ts = performance.now(); const DRESS = !!o.dress && !PICK, lvl = S.fineMask || S.fine, th = P.terH;"),
 ("    for (let L = 0; L <= S.maxFine; L++) {\n      const loops = loopsOf(S, L, P), pcs = PIECES.get(L) || [];","    if (window.__W) window.__W.setup += performance.now() - __ts;\n    for (let L = 0; L <= S.maxFine; L++) {\n      const loops = loopsOf(S, L, P), pcs = PIECES.get(L) || [];"),
 ("      for (const loop of loops) {\n        const n = loop.length; st.verts += n;","      const __t0 = performance.now();\n      for (const loop of loops) {\n        const n = loop.length; st.verts += n;"),
 ("      segs.sort((p, q) => p.d - q.d);\n      for (const s of segs) {","      segs.sort((p, q) => p.d - q.d); const __t1 = performance.now(); if (window.__W) window.__W.build += __t1 - __t0;\n      for (const s of segs) {"),
 ("      const path = new Path2D();\n      for (const loop of loops) {","      const __t2 = performance.now(); if (window.__W) window.__W.draw += __t2 - __t1;\n      const path = new Path2D();\n      for (const loop of loops) {"),
 ("      const aw = ASCL.get(L); if (aw) {","      if (window.__W) window.__W.cap += performance.now() - __t2;\n      const __ta = performance.now(); const aw = ASCL.get(L); if (aw) {"),
 ("for (const q of aw) drawAscWall(ctx, cam, S, o, q.w, st, q.bd); }","for (const q of aw) drawAscWall(ctx, cam, S, o, q.w, st, q.bd); } if (window.__W) window.__W.asc += performance.now() - __ta;")])
PY
