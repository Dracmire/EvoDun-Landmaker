#!/usr/bin/env bash
# Standard verification of the viewer. Parts (default: node ui regress zbuf):
#   node     every tools/test_*.js
#   ui       every tools/ui/test_*.js except the two z-buffer tests (they run in zbuf)
#   regress  pixel regression against origin/main in a temporary worktree (EVO_ROOT): stairW 0 and 3 (rooms off), rooms on, and one pass
#            per new switch (cake, pocket, ascWalls) checked and unchecked again; expectation: 0 images differ
#   zbuf     painter order against a per-pixel z-buffer: tools/ui/test_ramp_ui.js and tools/ui/test_asc_ui.js
#   shots    screenshots of the fixed set (real map rooms Default / Balanced types, Snake Mountain surface; Box, A, B; Iso, Oblique) + --extra views
# Usage: tools/verify.sh [parts...] [--extra chip:<id>|pocket:<id>|walls]... [--expect <glob>[,<glob>...]] [--out <dir>]
#   --expect: image names (globs, e.g. 'rooms_*,whole_A_oblique.png') whose regress differences are ANNOUNCED; they are reported as "expected"
#             and do not fail the part. Unannounced differences fail it.
# Output goes outside the repo: <out>/<part>.log, <part>.result, <part>.time, summary.txt, summary.json (default <out> = /tmp/evo-verify/<date>).
# One part can run alone (the parts are slow; a single tool call may be cut at 10 minutes): ./tools/verify.sh regress, or in the background and poll the log.
# Needs Node + Playwright + Chromium (see tools/ui/common.js) and python3 (for summary.json). Makes no commits and no checkouts.
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"; cd "$REPO"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
PARTS=(); EXTRAS=(); EXPECT=""; OUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --extra) EXTRAS+=("$2"); shift 2;;
    --expect) EXPECT="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    node|ui|regress|zbuf|shots) PARTS+=("$1"); shift;;
    *) echo "unknown argument: $1" >&2; exit 2;;
  esac
done
[ ${#PARTS[@]} -eq 0 ] && PARTS=(node ui regress zbuf)
D="${OUT:-/tmp/evo-verify/$(date +%F)}"; mkdir -p "$D"
WT=""; trap '[ -n "$WT" ] && { git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$WT"; git worktree prune; }' EXIT

finish() { # part status figures seconds
  echo "$2" > "$D/$1.result"; echo "$3" >> "$D/$1.result"; echo "$4" > "$D/$1.time"
}
count() { grep -c "$1" "$2" 2>/dev/null || true; }

part_node() {
  local log="$D/node.log" pass=0 fail=0 failed=""; : > "$log"
  for f in tools/test_*.js; do
    out=$(node "$f" 2>&1); rc=$?; { echo "== $f (exit $rc)"; echo "$out"; } >> "$log"
    if [ $rc -eq 0 ]; then pass=$((pass+1)); else fail=$((fail+1)); failed="$failed $(basename "$f")"; fi
  done
  [ $fail -eq 0 ] && S=PASS || S=FAIL
  FIG="$pass scripts passed, $fail failed${failed:+ ($failed )}"
}

part_ui() {
  local log="$D/ui.log" pass=0 fail=0 bad=""; : > "$log"
  for f in tools/ui/test_*.js; do
    case "$(basename "$f")" in test_ramp_ui.js|test_asc_ui.js) continue;; esac
    out=$(node "$f" 2>&1); rc=$?; np=$(echo "$out" | grep -c "^PASS"); nq=$(echo "$out" | grep -c "^FAIL")
    { echo "== $f (exit $rc, $np PASS, $nq FAIL)"; echo "$out"; } >> "$log"
    pass=$((pass+np)); fail=$((fail+nq)); if [ $rc -ne 0 ] || [ $nq -gt 0 ]; then bad="$bad $(basename "$f")"; fi
  done
  [ -z "$bad" ] && S=PASS || S=FAIL
  FIG="$pass PASS, $fail FAIL lines${bad:+; failing scripts:$bad}"
}

is_expected() { # image name -> 0 if announced with --expect
  local g; IFS=',' read -ra G <<< "$EXPECT"
  for g in "${G[@]}"; do [ -n "$g" ] && case "$1" in $g) return 0;; esac; done; return 1
}
cmp_pass() { # label dirA dirB -> appends to the log, updates UNEXP / EXPD / TOTAL
  local label="$1" a="$2" b="$3" out line f
  out=$(node tools/ui/compare.js "$a" "$b" 2>&1); echo "-- compare $label"; echo "$out"
  while read -r line; do
    case "$line" in DIFF*) f=$(echo "$line" | awk '{print $2}'); f=${f%:};; MISSING*) f=$(echo "$line" | awk '{print $4}');; SIZE*) f=$(echo "$line" | awk '{print $2}');; *) continue;; esac
    if is_expected "$f"; then EXPD=$((EXPD+1)); echo "   expected: $label/$f"; else UNEXP=$((UNEXP+1)); echo "   UNEXPECTED: $label/$f"; fi
  done <<< "$out"
  TOTAL=$((TOTAL+$(echo "$out" | sed -n 's/^\([0-9]*\) images compared.*/\1/p')))
}
part_regress() {
  local log="$D/regress.log" w r; : > "$log"; UNEXP=0; EXPD=0; TOTAL=0; RC=0
  git fetch -q origin main >> "$log" 2>&1 || echo "WARNING: git fetch failed, comparing with the local origin/main" >> "$log"
  WT="$(mktemp -d)/main"; git worktree add -f --detach "$WT" origin/main >> "$log" 2>&1 || { S=FAIL; FIG="could not create the worktree of origin/main"; return; }
  r="$D/regress-img"; rm -rf "$r"; mkdir -p "$r"
  {
    for set in stairW=0 stairW=3; do t=${set/=/}
      EVO_ROOT="$WT" node tools/ui/regress.js "$r/old_$t" --set "$set" 2>&1 | tail -1; node tools/ui/regress.js "$r/new_$t" --set "$set" 2>&1 | tail -1
      cmp_pass "rooms off $set" "$r/old_$t" "$r/new_$t"
    done
    EVO_ROOT="$WT" node tools/ui/regress_rooms.js "$r/old_rooms" 2>&1 | tail -1; node tools/ui/regress_rooms.js "$r/new_rooms" 2>&1 | tail -1
    cmp_pass "rooms on, switches off" "$r/old_rooms" "$r/new_rooms"
    for sw in cake pocket ascWalls; do
      node tools/ui/regress_rooms.js "$r/new_$sw" --toggle "$sw" 2>&1 | tail -1
      cmp_pass "rooms on, $sw toggled on and off" "$r/old_rooms" "$r/new_$sw"
    done
  } >> "$log" 2>&1
  git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$(dirname "$WT")"; WT=""; git worktree prune
  [ $UNEXP -eq 0 ] && S=PASS || S=FAIL
  FIG="$TOTAL images compared, $UNEXP unexpected differences, $EXPD expected differences"
}

part_zbuf() {
  local log="$D/zbuf.log" bad=""; : > "$log"
  for f in test_ramp_ui test_asc_ui; do
    out=$(node tools/ui/$f.js 2>&1); rc=$?; { echo "== $f (exit $rc)"; echo "$out"; } >> "$log"
    { [ $rc -ne 0 ] || echo "$out" | grep -q '^FAIL'; } && bad="$bad $f"
  done
  [ -z "$bad" ] && S=PASS || S=FAIL
  FIG="$(grep -c '^PASS' "$log") PASS, $(grep -c '^FAIL' "$log") FAIL lines${bad:+; failing:$bad}; $(grep -iE 'visib' "$log" | head -2 | tr '\n' ' ' | cut -c1-240)"
}

part_shots() {
  local log="$D/shots.log" args=() e res; : > "$log"
  for e in "${EXTRAS[@]+"${EXTRAS[@]}"}"; do args+=(--extra "$e"); done
  node tools/ui/verify_shots.js "$D/shots" "${args[@]+"${args[@]}"}" >> "$log" 2>&1; rc=$?
  res=$(grep '^RESULT ' "$log" | tail -1 | cut -c8-)
  if [ $rc -ne 0 ] || [ -z "$res" ]; then S=FAIL; FIG="screenshots failed (exit $rc), see shots.log"; return; fi
  if echo "$res" | grep -q '"warnings":\[\]'; then S=PASS; else S=WARN; fi
  FIG="$(python3 -c 'import json,sys; r=json.loads(sys.argv[1]); print("%d images in %s; rooms snake/default/balanced = %s/%s/%s; warnings: %s; not applicable: %s" % (r["images"], r["dir"], r["rooms"]["snake"], r["rooms"]["realDefault"], r["rooms"]["realBalanced"], "; ".join(r["warnings"]) or "none", "; ".join(r.get("notApplicable", [])) or "none"))' "$res")"
}

for p in "${PARTS[@]}"; do
  echo ">>> $p ..."; t0=$(date +%s); S=FAIL; FIG=""
  "part_$p"; t1=$(date +%s); finish "$p" "$S" "$FIG" $((t1-t0)); echo "<<< $p: $S in $((t1-t0)) s - $FIG"
done

# Summary (re-reads every result written in this run directory, so separate runs of single parts accumulate)
python3 - "$D" <<'PY'
import json, os, sys
d = sys.argv[1]; res = {}
for p in ['node', 'ui', 'regress', 'zbuf', 'shots']:
    f = os.path.join(d, p + '.result')
    if os.path.exists(f):
        l = open(f).read().split('\n'); res[p] = {'status': l[0], 'figures': l[1], 'seconds': int(open(os.path.join(d, p + '.time')).read().strip() or 0), 'log': os.path.join(d, p + '.log')}
shots = []
sd = os.path.join(d, 'shots')
if os.path.isdir(sd): shots = sorted(os.path.join(sd, x) for x in os.listdir(sd) if x.endswith('.png'))
json.dump({'dir': d, 'parts': res, 'screenshots': shots}, open(os.path.join(d, 'summary.json'), 'w'), indent=1)
with open(os.path.join(d, 'summary.txt'), 'w') as o:
    for p, r in res.items(): o.write('%-8s %-5s %4d s  %s\n' % (p, r['status'], r['seconds'], r['figures']))
    if shots: o.write('screenshots: %d files in %s\n' % (len(shots), sd))
    o.write('logs: %s\n' % d)
print(open(os.path.join(d, 'summary.txt')).read())
sys.exit(1 if any(r['status'] == 'FAIL' for r in res.values()) else 0)
PY
