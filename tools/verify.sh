#!/usr/bin/env bash
# Standard verification of the viewer. Parts (default: node ui regress zbuf):
#   node     every tools/test_*.js
#   ui       every tools/ui/test_*.js except the two z-buffer tests (they run in zbuf)
#   regress  pixel regression against origin/main in a temporary worktree (EVO_ROOT, with EVO_INFO_H forcing the fixed #info height in both runs; see part_regress): stairW 0 and 3 (rooms off), rooms on, one pass
#            per new switch (cake, pocket, ascWalls, contract, dress) checked and unchecked again, and the camera bank Cam 1-5 (regress_cams.js); expectation: 0 images differ
#   zbuf     painter order against a per-pixel z-buffer: tools/ui/test_ramp_ui.js and tools/ui/test_asc_ui.js
#   shots    screenshots of the fixed set = the three core examples (real map rooms Default / Balanced types; Shrine-Pier; Snake Mountain surface; Box, A, B; Iso, Oblique) + --extra views
#            (chip:<id>, pocket:<id>, walls, shrine; suffix @<camera id> and +play, e.g. pocket:31@stage+play)
# Usage: tools/verify.sh [parts...] [--extra chip:<id>|pocket:<id>|walls]... [--expect <glob>[,<glob>...]] [--out <dir>]
#                        [--only <glob>[,<glob>...]] [--shard i/n] [--list]
#   --expect: image names (globs, e.g. 'rooms_*,whole_A_oblique.png') whose regress differences are ANNOUNCED; they are reported as "expected"
#             and do not fail the part. Unannounced differences fail it.
#   --only <globs>: node and ui only: run just the scripts whose BASE NAME matches one of the comma-separated globs (e.g. --only 'test_pick_ui.js,*stage*'). It has NO effect on regress, zbuf and shots
#             (they are not split into scripts here); asking only for those parts with --only / --shard is an error (exit 2). With --only or --shard and no part named, the parts are `node ui` (not the default four:
#             regress would run in full). A selectable part with no matching script is skipped with a note; if NO selectable part matches anything, exit 2.
#   --shard i/n: node and ui only: split the list of scripts (sorted, after --only) by position: the script at index k (from 0) goes to shard (k mod n)+1; this run keeps shard i. Run the n shards in parallel
#             with a different --out each. Combinable with --only. Same restrictions as --only.
#   --list:   print, per part, the scripts that would run (with --only and --shard applied) as `<part><TAB><script>` lines (`#` lines are counts) and exit 0 without running anything or writing any file.
#   A part that ran with --only / --shard is NOT a full pass: its figures line starts with `SUBSET (--only <globs> --shard i/n, k de N scripts): ` (k selected, N total of the part) and summary.json marks it "subset": true.
#   Seconds: the header of every script in the log is `== <file> (exit N, ..., S s)` (node: `exit N, S s`; ui: `exit N, X PASS, Y FAIL, S s`; zbuf: `exit N, S s`); regress logs `-- seconds: S s` after every block (renders + compare);
#   <part>.scripts holds `name<TAB>seconds<TAB>exit` per script / block, and summary.txt / summary.json list the 5 slowest per part ("slowest").
# Output goes outside the repo: <out>/<part>.log, <part>.result, <part>.time, summary.txt, summary.json (default <out> = /tmp/evo-verify/<date>).
# One part can run alone (the parts are slow; a single tool call may be cut at 10 minutes): ./tools/verify.sh regress, or in the background and poll the log.
# Needs Node + Playwright + Chromium (see tools/ui/common.js) and python3 (for summary.json). Makes no commits and no checkouts.
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"; cd "$REPO"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
PARTS=(); EXTRAS=(); EXPECT=""; OUT=""; ONLY=""; SHARD=""; LIST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --extra) EXTRAS+=("$2"); shift 2;;
    --expect) EXPECT="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --only) [ $# -ge 2 ] && [ -n "$2" ] || { echo "--only needs a glob (or a comma-separated list of globs)" >&2; exit 2; }; ONLY="$2"; shift 2;;
    --shard) [ $# -ge 2 ] || { echo "--shard needs i/n" >&2; exit 2; }; SHARD="$2"; shift 2;;
    --list) LIST=1; shift;;
    node|ui|regress|zbuf|shots) PARTS+=("$1"); shift;;
    *) echo "unknown argument: $1" >&2; exit 2;;
  esac
done
SEL_ACTIVE=0; [ -n "$ONLY$SHARD" ] && SEL_ACTIVE=1
if [ -n "$SHARD" ]; then
  [[ "$SHARD" =~ ^([0-9]+)/([0-9]+)$ ]] || { echo "--shard must be i/n with integers (got: $SHARD)" >&2; exit 2; }
  SH_I=${BASH_REMATCH[1]}; SH_N=${BASH_REMATCH[2]}
  { [ "$SH_N" -ge 1 ] && [ "$SH_I" -ge 1 ] && [ "$SH_I" -le "$SH_N" ]; } || { echo "--shard i/n needs 1 <= i <= n (got: $SHARD)" >&2; exit 2; }
fi
if [ ${#PARTS[@]} -eq 0 ]; then if [ $SEL_ACTIVE -eq 1 ]; then PARTS=(node ui); else PARTS=(node ui regress zbuf); fi; fi
if [ $SEL_ACTIVE -eq 1 ]; then # --only / --shard only mean something for node and ui
  has_sel=0; for p in "${PARTS[@]}"; do case "$p" in node|ui) has_sel=1;; esac; done
  [ $has_sel -eq 1 ] || { echo "--only / --shard apply to the parts node and ui only (asked for: ${PARTS[*]})" >&2; exit 2; }
fi

# The scripts of each selectable part: ALL_<part> (sorted by the glob, as before), SEL_<part> (after --only and --shard)
ALL_node=(tools/test_*.js); ALL_ui=()
for f in tools/ui/test_*.js; do case "$(basename "$f")" in test_ramp_ui.js|test_asc_ui.js) continue;; esac; ALL_ui+=("$f"); done
ZSPECS=("test_ramp_ui:" "test_ramp_ui:--tech C" "test_asc_ui:")
matches_only() { # path -> 0 if its base name matches a --only glob (always 0 without --only)
  [ -z "$ONLY" ] && return 0
  local b g; b="$(basename "$1")"; IFS=',' read -ra G <<< "$ONLY"
  for g in "${G[@]}"; do [ -n "$g" ] && case "$b" in $g) return 0;; esac; done; return 1
}
select_part() { # part -> fills SEL_<part>
  local part="$1" f k=0 arr=() all=()
  if [ "$part" = node ]; then all=("${ALL_node[@]}"); else all=("${ALL_ui[@]}"); fi
  for f in "${all[@]}"; do
    matches_only "$f" || continue
    if [ -n "$SHARD" ]; then [ $((k % SH_N + 1)) -eq "$SH_I" ] && arr+=("$f"); k=$((k+1)); else arr+=("$f"); fi
  done
  if [ "$part" = node ]; then SEL_node=("${arr[@]+"${arr[@]}"}"); else SEL_ui=("${arr[@]+"${arr[@]}"}"); fi
}
SEL_node=("${ALL_node[@]}"); SEL_ui=("${ALL_ui[@]}")
if [ $SEL_ACTIVE -eq 1 ]; then select_part node; select_part ui; fi
subset_prefix() { # part -> "SUBSET (...): " when --only / --shard is active (a subset is not a full pass)
  [ $SEL_ACTIVE -eq 1 ] || return 0
  local d="" k n
  if [ "$1" = node ]; then k=${#SEL_node[@]}; n=${#ALL_node[@]}; else k=${#SEL_ui[@]}; n=${#ALL_ui[@]}; fi
  [ -n "$ONLY" ] && d="--only $ONLY"; [ -n "$SHARD" ] && d="$d${d:+ }--shard $SHARD"
  echo "SUBSET ($d, $k de $n scripts): "
}
if [ $SEL_ACTIVE -eq 1 ]; then # an empty selection everywhere is a mistake, not a pass
  tot=0; for p in "${PARTS[@]}"; do case "$p" in node) tot=$((tot+${#SEL_node[@]}));; ui) tot=$((tot+${#SEL_ui[@]}));; esac; done
  [ $tot -gt 0 ] || { echo "no script matches (--only '$ONLY'${SHARD:+ --shard $SHARD}) in the parts: ${PARTS[*]}" >&2; exit 2; }
fi
if [ $LIST -eq 1 ]; then # nothing runs, nothing is written
  for p in "${PARTS[@]}"; do
    case "$p" in
      node) printf '# node: %d de %d scripts\n' "${#SEL_node[@]}" "${#ALL_node[@]}"; for f in "${SEL_node[@]+"${SEL_node[@]}"}"; do printf 'node\t%s\n' "$f"; done;;
      ui) printf '# ui: %d de %d scripts\n' "${#SEL_ui[@]}" "${#ALL_ui[@]}"; for f in "${SEL_ui[@]+"${SEL_ui[@]}"}"; do printf 'ui\t%s\n' "$f"; done;;
      zbuf) printf '# zbuf: %d specs (--only / --shard do not apply)\n' "${#ZSPECS[@]}"; for spec in "${ZSPECS[@]}"; do ex="${spec#*:}"; printf 'zbuf\ttools/ui/%s.js%s\n' "${spec%%:*}" "${ex:+ $ex}"; done;;
      regress) printf '# regress: one part (pixel regression blocks against origin/main; --only / --shard do not apply)\nregress\t(whole part)\n';;
      shots) printf '# shots: one part (--only / --shard do not apply)\nshots\t(whole part)\n';;
    esac
  done
  exit 0
fi
D="${OUT:-/tmp/evo-verify/$(date +%F)}"; mkdir -p "$D"
WT=""; trap '[ -n "$WT" ] && { git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$WT"; git worktree prune; }' EXIT

finish() { # part status figures seconds
  echo "$2" > "$D/$1.result"; echo "$3" >> "$D/$1.result"; echo "$4" > "$D/$1.time"
}
count() { grep -c "$1" "$2" 2>/dev/null || true; }

part_node() {
  local log="$D/node.log" pass=0 fail=0 failed="" t0 dt; : > "$log"; : > "$D/node.scripts"
  for f in "${SEL_node[@]+"${SEL_node[@]}"}"; do
    t0=$(date +%s); out=$(node "$f" 2>&1); rc=$?; dt=$(( $(date +%s) - t0 ))
    { echo "== $f (exit $rc, $dt s)"; echo "$out"; } >> "$log"; printf '%s\t%s\t%s\n' "$(basename "$f")" "$dt" "$rc" >> "$D/node.scripts"
    if [ $rc -eq 0 ]; then pass=$((pass+1)); else fail=$((fail+1)); failed="$failed $(basename "$f")"; fi
  done
  [ $fail -eq 0 ] && S=PASS || S=FAIL
  FIG="$(subset_prefix node)$pass scripts passed, $fail failed${failed:+ ($failed )}"
}

part_ui() {
  local log="$D/ui.log" pass=0 fail=0 bad="" t0 dt; : > "$log"; : > "$D/ui.scripts"
  for f in "${SEL_ui[@]+"${SEL_ui[@]}"}"; do
    t0=$(date +%s); out=$(node "$f" 2>&1); rc=$?; dt=$(( $(date +%s) - t0 )); np=$(echo "$out" | grep -c "^PASS"); nq=$(echo "$out" | grep -c "^FAIL")
    { echo "== $f (exit $rc, $np PASS, $nq FAIL, $dt s)"; echo "$out"; } >> "$log"; printf '%s\t%s\t%s\n' "$(basename "$f")" "$dt" "$rc" >> "$D/ui.scripts"
    pass=$((pass+np)); fail=$((fail+nq)); if [ $rc -ne 0 ] || [ $nq -gt 0 ]; then bad="$bad $(basename "$f")"; fi
  done
  [ -z "$bad" ] && S=PASS || S=FAIL
  FIG="$(subset_prefix ui)$pass PASS, $fail FAIL lines${bad:+; failing scripts:$bad}"
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
  local now dt; now=$(date +%s); dt=$((now - BLK0)); BLK0=$now # a block = the renders since the previous compare + this compare
  echo "-- seconds: $dt s ($label)"; printf '%s\t%s\t%s\n' "$label" "$dt" 0 >> "$D/regress.scripts"
}
part_regress() {
  local log="$D/regress.log" w r; : > "$log"; : > "$D/regress.scripts"; UNEXP=0; EXPD=0; TOTAL=0; RC=0
  # The info line has a native FIXED height (limitation 18) that origin/main may not have yet: EVO_INFO_H forces the same rule (tools/ui/common.js) in BOTH runs, so the comparison stays pixel for pixel.
  # Check (b) below proves that the forced rule equals the native one: the NEW tree without EVO_INFO_H against the OLD tree with it.
  export EVO_INFO_H="${EVO_INFO_H:-80.2}"
  git fetch -q origin main >> "$log" 2>&1 || echo "WARNING: git fetch failed, comparing with the local origin/main" >> "$log"
  WT="$(mktemp -d)/main"; git worktree add -f --detach "$WT" origin/main >> "$log" 2>&1 || { S=FAIL; FIG="could not create the worktree of origin/main"; return; }
  r="$D/regress-img"; rm -rf "$r"; mkdir -p "$r"; BLK0=$(date +%s)
  {
    for set in stairW=0 stairW=3; do t=${set/=/}
      EVO_ROOT="$WT" node tools/ui/regress.js "$r/old_$t" --set "$set" 2>&1 | tail -1; node tools/ui/regress.js "$r/new_$t" --set "$set" 2>&1 | tail -1
      cmp_pass "rooms off $set" "$r/old_$t" "$r/new_$t"
    done
    EVO_ROOT="$WT" node tools/ui/regress_rooms.js "$r/old_rooms" 2>&1 | tail -1; node tools/ui/regress_rooms.js "$r/new_rooms" 2>&1 | tail -1
    cmp_pass "rooms on, switches off" "$r/old_rooms" "$r/new_rooms"
    for sw in cake pocket ascWalls contract dress; do
      node tools/ui/regress_rooms.js "$r/new_$sw" --toggle "$sw" 2>&1 | tail -1
      cmp_pass "rooms on, $sw toggled on and off" "$r/old_rooms" "$r/new_$sw"
    done
    EVO_ROOT="$WT" node tools/ui/regress_floors.js "$r/old_floors" 2>&1 | tail -1; node tools/ui/regress_floors.js "$r/new_floors" 2>&1 | tail -1
    cmp_pass "floors package, single floor 1 and 2, backdrop off" "$r/old_floors" "$r/new_floors"
    node tools/ui/regress_floors.js "$r/new_backdrop" --toggle backdrop 2>&1 | tail -1
    cmp_pass "floors package, backdrop toggled on and off" "$r/old_floors" "$r/new_backdrop"
    for vm in "real" "mirror" "wall" "wall --gap 4"; do
      vt="${vm// /_}"; node tools/ui/regress_floors.js "$r/new_backdrop_$vt" --toggle backdrop --mode $vm 2>&1 | tail -1
      cmp_pass "floors package, backdrop mode $vm toggled on and off" "$r/old_floors" "$r/new_backdrop_$vt"
    done
    EVO_ROOT="$WT" node tools/ui/regress_backdrop_on.js "$r/old_bdon" 2>&1 | tail -1; node tools/ui/regress_backdrop_on.js "$r/new_bdon" 2>&1 | tail -1
    cmp_pass "floors package, backdrop ON at Cam 1, floor 1 and 2, Box A B" "$r/old_bdon/cam1" "$r/new_bdon/cam1"
    node tools/ui/regress_backdrop_on.js "$r/rt_bdon" --roundtrip 2>&1 | tail -1
    cmp_pass "floors package, backdrop ON, Cam 1 -> Cam 3 -> Cam 1 round trip equals the first Cam 1 image" "$r/rt_bdon/first" "$r/rt_bdon/after"
    EVO_ROOT="$WT" node tools/ui/regress_cams.js "$r/old_cams" 2>&1 | tail -1; node tools/ui/regress_cams.js "$r/new_cams" 2>&1 | tail -1
    cmp_pass "camera bank Cam 1-5 (isoE isoW oblique low top), Box A B, three scenes" "$r/old_cams" "$r/new_cams"
    EVO_ROOT="$WT" node tools/ui/regress_modes.js "$r/old_modes" --fresh 2>&1 | tail -1; node tools/ui/regress_modes.js "$r/new_modes" 2>&1 | tail -1
    cmp_pass "modes layer: mode 1 and mode 2 examples, the legacy examples of mode 3 (Stage) after mode 2 in the same session = main's fresh-session images" "$r/old_modes" "$r/new_modes"
    node tools/ui/regress_modes.js "$r/rt_modes" --round 2>&1 | tail -2
    cmp_pass "modes layer, round trip 2 -> 3 -> 2: the images of mode 2 and the legacy examples of mode 3 equal the first visit" "$r/old_modes" "$r/rt_modes"
    # (b) forced rule == native rule: the new tree WITHOUT EVO_INFO_H against the old tree WITH it (stairW 3 oblique/iso Box A B C, rooms on, Cam 1-5)
    env -u EVO_INFO_H node tools/ui/regress.js "$r/native_stairW3" --set stairW=3 2>&1 | tail -1
    cmp_pass "(b) native info height vs forced: rooms off stairW=3" "$r/old_stairW3" "$r/native_stairW3"
    env -u EVO_INFO_H node tools/ui/regress_rooms.js "$r/native_rooms" 2>&1 | tail -1
    cmp_pass "(b) native info height vs forced: rooms on" "$r/old_rooms" "$r/native_rooms"
    env -u EVO_INFO_H node tools/ui/regress_cams.js "$r/native_cams" 2>&1 | tail -1
    cmp_pass "(b) native info height vs forced: camera bank Cam 1-5" "$r/old_cams" "$r/native_cams"
  } >> "$log" 2>&1
  git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$(dirname "$WT")"; WT=""; git worktree prune
  [ $UNEXP -eq 0 ] && S=PASS || S=FAIL
  FIG="$TOTAL images compared, $UNEXP unexpected differences, $EXPD expected differences"
}

part_zbuf() {
  local log="$D/zbuf.log" bad="" t0 dt; : > "$log"; : > "$D/zbuf.scripts"
  for spec in "${ZSPECS[@]}"; do
    f="${spec%%:*}"; extra="${spec#*:}"; t0=$(date +%s); out=$(node tools/ui/$f.js $extra 2>&1); rc=$?; dt=$(( $(date +%s) - t0 )); { echo "== $f $extra (exit $rc, $dt s)"; echo "$out"; } >> "$log"; printf '%s\t%s\t%s\n' "$f${extra:+ $extra}" "$dt" "$rc" >> "$D/zbuf.scripts"
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
  FIG="$(python3 -c 'import json,sys; r=json.loads(sys.argv[1]); print("%d images in %s; rooms snake/shrine/shrine4/default/balanced = %s/%s/%s/%s/%s; warnings: %s; not applicable: %s" % (r["images"], r["dir"], r["rooms"]["snake"], r["rooms"]["shrine"], r["rooms"]["shrine4"], r["rooms"]["realDefault"], r["rooms"]["realBalanced"], "; ".join(r["warnings"]) or "none", "; ".join(r.get("notApplicable", [])) or "none"))' "$res")"
}

for p in "${PARTS[@]}"; do
  if [ $SEL_ACTIVE -eq 1 ]; then case "$p" in node) [ ${#SEL_node[@]} -eq 0 ] && { echo "--- node: no script matches the selection (skipped)"; continue; };; ui) [ ${#SEL_ui[@]} -eq 0 ] && { echo "--- ui: no script matches the selection (skipped)"; continue; };; esac; fi
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
        if l[1].startswith('SUBSET'): res[p]['subset'] = True
        sf = os.path.join(d, p + '.scripts'); slow = []
        if os.path.exists(sf):
            for row in open(sf).read().split('\n'):
                c = row.split('\t')
                if len(c) == 3 and c[1].isdigit(): slow.append({'name': c[0], 'seconds': int(c[1])})
        res[p]['slowest'] = sorted(slow, key=lambda x: -x['seconds'])[:5]
shots = []
sd = os.path.join(d, 'shots')
if os.path.isdir(sd): shots = sorted(os.path.join(sd, x) for x in os.listdir(sd) if x.endswith('.png'))
json.dump({'dir': d, 'parts': res, 'screenshots': shots}, open(os.path.join(d, 'summary.json'), 'w'), indent=1)
with open(os.path.join(d, 'summary.txt'), 'w') as o:
    for p, r in res.items():
        o.write('%-8s %-5s %4d s  %s\n' % (p, r['status'], r['seconds'], r['figures']))
        if r['slowest']: o.write('         slowest: %s\n' % ', '.join('%s %d s' % (x['name'], x['seconds']) for x in r['slowest']))
    if shots: o.write('screenshots: %d files in %s\n' % (len(shots), sd))
    o.write('logs: %s\n' % d)
print(open(os.path.join(d, 'summary.txt')).read())
sys.exit(1 if any(r['status'] == 'FAIL' for r in res.values()) else 0)
PY
