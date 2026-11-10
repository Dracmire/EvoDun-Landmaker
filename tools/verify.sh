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
#   --shard i/n: node and ui only: split the list of scripts (sorted, after --only) into n shards BY ESTIMATED TIME, not by position: with the weights of tools/verify_weights.txt (seconds per script) the scripts are taken in decreasing weight (tie: the order of the list)
#             and each goes to the shard with the smallest running sum (greedy; tie: the lowest index); a script with no weight weighs the MEDIAN of the weights of its part (1 if there are none). Without the weights file (or with VERIFY_WEIGHTS=<other file>) every script weighs the
#             same and the split is exactly the old one, script k of the list -> shard (k mod n)+1. This run keeps shard i. Run the n shards in parallel with a different --out each. Combinable with --only. Same restrictions as --only.
#             REFRESH THE WEIGHTS after a full pass: copy the first two columns (name, seconds) of <out>/ui.scripts and <out>/node.scripts (every shard's, if the pass was sharded) into tools/verify_weights.txt; they are times with several processes at once, only the relative size matters.
#   --list:   print, per part, the scripts that would run (with --only and --shard applied) as `<part><TAB><script>` lines (`#` lines are counts; with --shard also `# shard s/n: k scripts, ~S s (part)` for EVERY shard s, S = the estimated seconds) and exit 0 without running anything or writing any file.
#   --sample 1/4[:K]: regress only (verify-sample): a LIGHT pass that runs a quarter of the comparison blocks of part_regress, rotating. The 22 blocks are grouped by dependency (REGRESS_BLOCKS below: g1 rooms off,
#             g2 rooms on + its 5 toggles, g3 floors + its 5 backdrop toggles, g4 backdrop ON, g5 cams, g6 modes); a block runs when its position in its group (from 0) has pos mod 4 == K, plus the render `old_*` a chosen block
#             compares against (render only, no compare of its own), plus ALWAYS the sentinel (the first block of g6, the modes layer). The 3 blocks "(b) native info height vs forced" check the tool itself, not the PR:
#             they are skipped in a sample and stay in the full pass. K defaults to (first byte of the hash of HEAD) mod 4, so every commit rotates. The figures line starts with
#             `SUBSET (regress --sample 1/4:K, B de 22 bloques, N de 365 imágenes): `: a sample is NEVER a full pass. Without --sample, regress is exactly the full pass of before. `regress --list [--sample ...]` prints the blocks.
#   A part that ran with --only / --shard is NOT a full pass: its figures line starts with `SUBSET (--only <globs> --shard i/n, k de N scripts): ` (k selected, N total of the part) and summary.json marks it "subset": true.
#   Seconds: the header of every script in the log is `== <file> (exit N, ..., S s)` (node: `exit N, S s`; ui: `exit N, X PASS, Y FAIL, S s`; zbuf: `exit N, S s`); regress logs `-- seconds: S s` after every block (renders + compare);
#   <part>.scripts holds `name<TAB>seconds<TAB>exit` per script / block, and summary.txt / summary.json list the 5 slowest per part ("slowest").
# Output goes outside the repo: <out>/<part>.log, <part>.result, <part>.time, summary.txt, summary.json (default <out> = /tmp/evo-verify/<date>).
# One part can run alone (the parts are slow; a single tool call may be cut at 10 minutes): ./tools/verify.sh regress, or in the background and poll the log.
# Needs Node + Playwright + Chromium (see tools/ui/common.js) and python3 (for summary.json). Makes no commits and no checkouts.
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"; cd "$REPO"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
PARTS=(); EXTRAS=(); EXPECT=""; OUT=""; ONLY=""; SHARD=""; LIST=0; SAMPLE=""; SAMPLE_K=""
while [ $# -gt 0 ]; do
  case "$1" in
    --extra) EXTRAS+=("$2"); shift 2;;
    --expect) EXPECT="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --only) [ $# -ge 2 ] && [ -n "$2" ] || { echo "--only needs a glob (or a comma-separated list of globs)" >&2; exit 2; }; ONLY="$2"; shift 2;;
    --shard) [ $# -ge 2 ] || { echo "--shard needs i/n" >&2; exit 2; }; SHARD="$2"; shift 2;;
    --list) LIST=1; shift;;
    --sample) [ $# -ge 2 ] || { echo "--sample needs 1/4 or 1/4:K (K = 0..3)" >&2; exit 2; }; SAMPLE="$2"; shift 2;;
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
if [ -n "$SAMPLE" ]; then # verify-sample: a quarter of the regress blocks, rotating
  [[ "$SAMPLE" =~ ^1/4(:([0-3]))?$ ]] || { echo "--sample must be 1/4 or 1/4:K with K = 0, 1, 2 or 3 (got: $SAMPLE)" >&2; exit 2; }
  SAMPLE_K="${BASH_REMATCH[2]}"
  if [ -z "$SAMPLE_K" ]; then h=$(git rev-parse HEAD 2>/dev/null | cut -c1-2); [[ "$h" =~ ^[0-9a-f]{2}$ ]] || { echo "--sample 1/4 without :K needs the hash of HEAD (git rev-parse failed)" >&2; exit 2; }; SAMPLE_K=$(( 16#$h % 4 )); fi
  if [ ${#PARTS[@]} -eq 0 ] && [ $SEL_ACTIVE -eq 0 ]; then PARTS=(regress); fi
  has_rg=0; for p in "${PARTS[@]+"${PARTS[@]}"}"; do [ "$p" = regress ] && has_rg=1; done
  [ $has_rg -eq 1 ] || { echo "--sample applies to the part regress only (asked for: ${PARTS[*]:-node ui})" >&2; exit 2; }
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
# WEIGHTS: tools/verify_weights.txt (name<TAB>seconds, `#` lines are comments); VERIFY_WEIGHTS overrides the file (a missing file = no weights = every script weighs the same)
WFILE="${VERIFY_WEIGHTS-$REPO/tools/verify_weights.txt}"; declare -A WT=()
if [ -f "$WFILE" ]; then while IFS=$'\t' read -r nm sec _; do case "$nm" in ''|'#'*) continue;; esac; [[ "$sec" =~ ^[0-9]+(\.[0-9]+)?$ ]] && WT["$nm"]="$sec"; done < "$WFILE"; fi
part_median() { # part -> the median of the weights of the scripts of the part that have one (1 if none)
  local all=() f b; if [ "$1" = node ]; then all=("${ALL_node[@]}"); else all=("${ALL_ui[@]}"); fi
  for f in "${all[@]}"; do b="$(basename "$f")"; [ -n "${WT[$b]+x}" ] && echo "${WT[$b]}"; done | sort -n | awk '{a[NR]=$1} END{ if (NR==0) print 1; else if (NR%2) print a[(NR+1)/2]; else print (a[NR/2]+a[NR/2+1])/2 }'
}
PLAN_IDX=(); PLAN_SUM=(); PLAN_CNT=()
shard_plan() { # part script... -> PLAN_IDX[position in the list] = shard (1..n), PLAN_SUM[s] / PLAN_CNT[s] = estimated seconds / scripts of shard s: greedy by decreasing weight (tie: the order of the list), onto the shard with the smallest sum (tie: the lowest index)
  local part="$1" med f w idx=0 lines="" kind a b c; shift; med="$(part_median "$part")"; PLAN_IDX=(); PLAN_SUM=(); PLAN_CNT=(); for ((a=1; a<=SH_N; a++)); do PLAN_SUM[$a]=0; PLAN_CNT[$a]=0; done
  for f in "$@"; do b="$(basename "$f")"; w="${WT[$b]:-$med}"; lines+="$idx"$'\t'"$w"$'\n'; idx=$((idx+1)); done
  while IFS=$'\t' read -r kind a b; do
    case "$kind" in A) PLAN_IDX[$a]="$b"; PLAN_CNT[$b]=$((PLAN_CNT[$b]+1));; S) PLAN_SUM[$a]="$b";; esac
  done < <(printf '%s' "$lines" | awk -v n="$SH_N" 'BEGIN { FS = "\t" } { id[NR] = $1; w[NR] = $2 }
    END { for (a = 1; a <= NR; a++) ord[a] = a
          for (a = 2; a <= NR; a++) { v = ord[a]; b = a - 1; while (b >= 1 && (w[ord[b]] < w[v] || (w[ord[b]] == w[v] && id[ord[b]] > id[v]))) { ord[b + 1] = ord[b]; b-- } ord[b + 1] = v }
          for (s = 1; s <= n; s++) sum[s] = 0
          for (a = 1; a <= NR; a++) { k = ord[a]; m = 1; for (s = 2; s <= n; s++) if (sum[s] < sum[m]) m = s; sum[m] += w[k]; print "A\t" id[k] "\t" m }
          for (s = 1; s <= n; s++) print "S\t" s "\t" sum[s] }')
}
FLT_node=(); FLT_ui=()
select_part() { # part -> fills SEL_<part> (and FLT_<part>, the list after --only)
  local part="$1" f arr=() all=() flt=() k
  if [ "$part" = node ]; then all=("${ALL_node[@]}"); else all=("${ALL_ui[@]}"); fi
  for f in "${all[@]}"; do matches_only "$f" && flt+=("$f"); done
  if [ -n "$SHARD" ]; then shard_plan "$part" "${flt[@]+"${flt[@]}"}"; for k in "${!flt[@]}"; do [ "${PLAN_IDX[$k]}" = "$SH_I" ] && arr+=("${flt[$k]}"); done; else arr=("${flt[@]+"${flt[@]}"}"); fi
  if [ "$part" = node ]; then SEL_node=("${arr[@]+"${arr[@]}"}"); FLT_node=("${flt[@]+"${flt[@]}"}"); else SEL_ui=("${arr[@]+"${arr[@]}"}"); FLT_ui=("${flt[@]+"${flt[@]}"}"); fi
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
# The 22 comparison blocks of part_regress, in their order: "group|position in the group|images|label". Groups by dependency (a toggle block compares against the `old_*` render of the first block of its group).
# `b` = the 3 checks of the tool itself (the forced #info height equals the native one): never sampled. Images per block: measured on a full pass (365 in all, 279 without `b`).
REGRESS_BLOCKS=(
  "g1|0|33|rooms off stairW=0" "g1|1|33|rooms off stairW=3"
  "g2|0|8|rooms on, switches off" "g2|1|8|rooms on, cake toggled on and off" "g2|2|8|rooms on, pocket toggled on and off" "g2|3|8|rooms on, ascWalls toggled on and off" "g2|4|8|rooms on, contract toggled on and off" "g2|5|8|rooms on, dress toggled on and off"
  "g3|0|16|floors package, single floor 1 and 2, backdrop off" "g3|1|16|floors package, backdrop toggled on and off" "g3|2|16|floors package, backdrop mode real toggled on and off" "g3|3|16|floors package, backdrop mode mirror toggled on and off" "g3|4|16|floors package, backdrop mode wall toggled on and off" "g3|5|16|floors package, backdrop mode wall --gap 4 toggled on and off"
  "g4|0|6|floors package, backdrop ON at Cam 1, floor 1 and 2, Box A B" "g4|1|6|floors package, backdrop ON, Cam 1 -> Cam 3 -> Cam 1 round trip equals the first Cam 1 image"
  "g5|0|45|camera bank Cam 1-5 (isoE isoW oblique low top), Box A B, three scenes"
  "g6|0|6|modes layer: mode 1 and mode 2 examples, the legacy examples of mode 3 (Stage) after mode 2 in the same session = main's fresh-session images" "g6|1|6|modes layer, round trip 2 -> 3 -> 2: the images of mode 2 and the legacy examples of mode 3 equal the first visit"
  "b|0|33|(b) native info height vs forced: rooms off stairW=3" "b|1|8|(b) native info height vs forced: rooms on" "b|2|45|(b) native info height vs forced: camera bank Cam 1-5"
)
REGRESS_TOTAL_IMG=365
blk_sel() { # group pos -> 0 if the block runs: always without --sample; with it: never `b`, always the sentinel (g6 0), else pos mod 4 == K
  [ -z "$SAMPLE" ] && return 0
  [ "$1" = b ] && return 1
  { [ "$1" = g6 ] && [ "$2" = 0 ]; } && return 0
  [ $(( $2 % 4 )) -eq "$SAMPLE_K" ]
}
regress_planned() { # images the chosen blocks must compare: 365 in a full pass, the sum of the `images` field of the chosen blocks in a sample (the guard of part_regress and the plan line use it)
  local e g p rest im sum=0; for e in "${REGRESS_BLOCKS[@]}"; do g="${e%%|*}"; rest="${e#*|}"; p="${rest%%|*}"; rest="${rest#*|}"; im="${rest%%|*}"; blk_sel "$g" "$p" && sum=$((sum+im)); done; echo "$sum"
}
grp_any() { # group -> 0 if any block of the group at position >= 1 runs (its `old_*` render is then needed)
  local e g p; for e in "${REGRESS_BLOCKS[@]}"; do g="${e%%|*}"; p="${e#*|}"; p="${p%%|*}"; [ "$g" = "$1" ] && [ "$p" -ge 1 ] && blk_sel "$g" "$p" && return 0; done; return 1
}
regress_plan() { # prints the plan: one `regress-block` line per block (n, group, pos, run / skip, images, label) and the render-only dependencies
  local e g p rest im lb n=0 run=0 img=0 st
  for e in "${REGRESS_BLOCKS[@]}"; do n=$((n+1)); g="${e%%|*}"; rest="${e#*|}"; p="${rest%%|*}"; rest="${rest#*|}"; im="${rest%%|*}"; lb="${rest#*|}"
    if blk_sel "$g" "$p"; then st=run; run=$((run+1)); img=$((img+im)); else st=skip; fi
    printf 'regress-block\t%d\t%s\t%s\t%s\t%s\t%s\n' "$n" "$g" "$p" "$st" "$im" "$lb"
  done
  if [ -n "$SAMPLE" ]; then
    blk_sel g2 0 || { grp_any g2 && printf 'regress-dep\tg2\told_rooms (render only, no compare of its own)\n'; }
    blk_sel g3 0 || { grp_any g3 && printf 'regress-dep\tg3\told_floors (render only, no compare of its own)\n'; }
    printf '# regress --sample 1/4:%s: %d de %d bloques, %d de %d imágenes (sentinel: g6 0; the 3 (b) blocks are skipped in a sample)\n' "$SAMPLE_K" "$run" "${#REGRESS_BLOCKS[@]}" "$(regress_planned)" "$REGRESS_TOTAL_IMG"
  else printf '# regress: %d bloques, %d imágenes (full pass)\n' "${#REGRESS_BLOCKS[@]}" "$(regress_planned)"; fi
}
if [ $LIST -eq 1 ]; then # nothing runs, nothing is written
  for p in "${PARTS[@]}"; do
    case "$p" in
      node|ui)
        if [ "$p" = node ]; then n_sel=${#SEL_node[@]}; n_all=${#ALL_node[@]}; else n_sel=${#SEL_ui[@]}; n_all=${#ALL_ui[@]}; fi
        printf '# %s: %d de %d scripts\n' "$p" "$n_sel" "$n_all"; if [ "$p" = node ]; then for f in "${SEL_node[@]+"${SEL_node[@]}"}"; do printf 'node\t%s\n' "$f"; done; else for f in "${SEL_ui[@]+"${SEL_ui[@]}"}"; do printf 'ui\t%s\n' "$f"; done; fi
        if [ -n "$SHARD" ]; then
          if [ "$p" = node ]; then shard_plan node "${FLT_node[@]+"${FLT_node[@]}"}"; else shard_plan ui "${FLT_ui[@]+"${FLT_ui[@]}"}"; fi
          for ((a=1; a<=SH_N; a++)); do printf '# shard %d/%d: %d scripts, ~%.0f s (%s)\n' "$a" "$SH_N" "${PLAN_CNT[$a]}" "${PLAN_SUM[$a]}" "$p"; done
          [ ${#WT[@]} -eq 0 ] && printf '# weights: none (every script weighs the same: the split is by position)\n'
        fi;;
      zbuf) printf '# zbuf: %d specs (--only / --shard do not apply)\n' "${#ZSPECS[@]}"; for spec in "${ZSPECS[@]}"; do ex="${spec#*:}"; printf 'zbuf\ttools/ui/%s.js%s\n' "${spec%%:*}" "${ex:+ $ex}"; done;;
      regress) if [ -n "$SAMPLE" ]; then printf '# regress: a SAMPLE of the part (--sample 1/4:%s; --only / --shard do not apply)\nregress\t(sample 1/4:%s)\n' "$SAMPLE_K" "$SAMPLE_K"; else printf '# regress: one part (pixel regression blocks against origin/main; --only / --shard do not apply)\nregress\t(whole part)\n'; fi; regress_plan;;
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
  echo "-- seconds: $dt s ($label)"; printf '%s\t%s\t%s\n' "$label" "$dt" 0 >> "$D/regress.scripts"; RUNB=$((${RUNB:-0}+1))
}
part_regress() {
  local log="$D/regress.log" w r; : > "$log"; : > "$D/regress.scripts"; UNEXP=0; EXPD=0; TOTAL=0; RC=0
  # The info line has a native FIXED height (limitation 18) that origin/main may not have yet: EVO_INFO_H forces the same rule (tools/ui/common.js) in BOTH runs, so the comparison stays pixel for pixel.
  # Check (b) below proves that the forced rule equals the native one: the NEW tree without EVO_INFO_H against the OLD tree with it.
  export EVO_INFO_H="${EVO_INFO_H:-80.2}"
  # Guard (a): the render scripts need the synthetic maps of tools/ui/.cache (not committed). Without them regress.js dies half way in BOTH trees, `| tail -1` hides it and compare.js only sees the files that exist.
  if [ ! -f tools/ui/.cache/maps/height.png ]; then
    echo "== tools/ui/.cache/maps/height.png is missing: running python3 tools/ui/gen_maps.py" >> "$log"
    python3 tools/ui/gen_maps.py >> "$log" 2>&1 && [ -f tools/ui/.cache/maps/height.png ] || { S=FAIL; FIG="the maps cache tools/ui/.cache/maps is missing and python3 tools/ui/gen_maps.py failed (it needs Pillow and numpy): nothing was compared"; return; }
  fi
  git fetch -q origin main >> "$log" 2>&1 || echo "WARNING: git fetch failed, comparing with the local origin/main" >> "$log"
  WT="$(mktemp -d)/main"; git worktree add -f --detach "$WT" origin/main >> "$log" 2>&1 || { S=FAIL; FIG="could not create the worktree of origin/main"; return; }
  r="$D/regress-img"; rm -rf "$r"; mkdir -p "$r"; BLK0=$(date +%s)
  local bp lb
  RUNB=0; SKIPPED=()
  skipb() { echo "-- skipped (sample 1/4:$SAMPLE_K): $1"; SKIPPED+=("$1"); } # a block the sample leaves out
  {
    [ -n "$SAMPLE" ] && { echo "== regress --sample 1/4:$SAMPLE_K (a SUBSET of the blocks: not a full pass)"; regress_plan; }
    bp=0; for set in stairW=0 stairW=3; do t=${set/=/}
      if blk_sel g1 $bp; then
        EVO_ROOT="$WT" node tools/ui/regress.js "$r/old_$t" --set "$set" 2>&1 | tail -1; node tools/ui/regress.js "$r/new_$t" --set "$set" 2>&1 | tail -1
        cmp_pass "rooms off $set" "$r/old_$t" "$r/new_$t"
      else skipb "rooms off $set"; fi; bp=$((bp+1))
    done
    if blk_sel g2 0; then
      EVO_ROOT="$WT" node tools/ui/regress_rooms.js "$r/old_rooms" 2>&1 | tail -1; node tools/ui/regress_rooms.js "$r/new_rooms" 2>&1 | tail -1
      cmp_pass "rooms on, switches off" "$r/old_rooms" "$r/new_rooms"
    else skipb "rooms on, switches off"; grp_any g2 && { echo "-- dependency only (no compare of its own): old_rooms"; EVO_ROOT="$WT" node tools/ui/regress_rooms.js "$r/old_rooms" 2>&1 | tail -1; }; fi
    bp=1; for sw in cake pocket ascWalls contract dress; do
      if blk_sel g2 $bp; then
        node tools/ui/regress_rooms.js "$r/new_$sw" --toggle "$sw" 2>&1 | tail -1
        cmp_pass "rooms on, $sw toggled on and off" "$r/old_rooms" "$r/new_$sw"
      else skipb "rooms on, $sw toggled on and off"; fi; bp=$((bp+1))
    done
    if blk_sel g3 0; then
      EVO_ROOT="$WT" node tools/ui/regress_floors.js "$r/old_floors" 2>&1 | tail -1; node tools/ui/regress_floors.js "$r/new_floors" 2>&1 | tail -1
      cmp_pass "floors package, single floor 1 and 2, backdrop off" "$r/old_floors" "$r/new_floors"
    else skipb "floors package, single floor 1 and 2, backdrop off"; grp_any g3 && { echo "-- dependency only (no compare of its own): old_floors"; EVO_ROOT="$WT" node tools/ui/regress_floors.js "$r/old_floors" 2>&1 | tail -1; }; fi
    if blk_sel g3 1; then
      node tools/ui/regress_floors.js "$r/new_backdrop" --toggle backdrop 2>&1 | tail -1
      cmp_pass "floors package, backdrop toggled on and off" "$r/old_floors" "$r/new_backdrop"
    else skipb "floors package, backdrop toggled on and off"; fi
    bp=2; for vm in "real" "mirror" "wall" "wall --gap 4"; do
      if blk_sel g3 $bp; then
        vt="${vm// /_}"; node tools/ui/regress_floors.js "$r/new_backdrop_$vt" --toggle backdrop --mode $vm 2>&1 | tail -1
        cmp_pass "floors package, backdrop mode $vm toggled on and off" "$r/old_floors" "$r/new_backdrop_$vt"
      else skipb "floors package, backdrop mode $vm toggled on and off"; fi; bp=$((bp+1))
    done
    if blk_sel g4 0; then
      EVO_ROOT="$WT" node tools/ui/regress_backdrop_on.js "$r/old_bdon" 2>&1 | tail -1; node tools/ui/regress_backdrop_on.js "$r/new_bdon" 2>&1 | tail -1
      cmp_pass "floors package, backdrop ON at Cam 1, floor 1 and 2, Box A B" "$r/old_bdon/cam1" "$r/new_bdon/cam1"
    else skipb "floors package, backdrop ON at Cam 1, floor 1 and 2, Box A B"; fi
    if blk_sel g4 1; then
      node tools/ui/regress_backdrop_on.js "$r/rt_bdon" --roundtrip 2>&1 | tail -1
      cmp_pass "floors package, backdrop ON, Cam 1 -> Cam 3 -> Cam 1 round trip equals the first Cam 1 image" "$r/rt_bdon/first" "$r/rt_bdon/after"
    else skipb "floors package, backdrop ON, Cam 1 -> Cam 3 -> Cam 1 round trip equals the first Cam 1 image"; fi
    if blk_sel g5 0; then
      EVO_ROOT="$WT" node tools/ui/regress_cams.js "$r/old_cams" 2>&1 | tail -1; node tools/ui/regress_cams.js "$r/new_cams" 2>&1 | tail -1
      cmp_pass "camera bank Cam 1-5 (isoE isoW oblique low top), Box A B, three scenes" "$r/old_cams" "$r/new_cams"
    else skipb "camera bank Cam 1-5 (isoE isoW oblique low top), Box A B, three scenes"; fi
    EVO_ROOT="$WT" node tools/ui/regress_modes.js "$r/old_modes" --fresh 2>&1 | tail -1; node tools/ui/regress_modes.js "$r/new_modes" 2>&1 | tail -1 # (g6 0, the sentinel: in every sample)
    cmp_pass "modes layer: mode 1 and mode 2 examples, the legacy examples of mode 3 (Stage) after mode 2 in the same session = main's fresh-session images" "$r/old_modes" "$r/new_modes"
    if blk_sel g6 1; then
      node tools/ui/regress_modes.js "$r/rt_modes" --round 2>&1 | tail -2
      cmp_pass "modes layer, round trip 2 -> 3 -> 2: the images of mode 2 and the legacy examples of mode 3 equal the first visit" "$r/old_modes" "$r/rt_modes"
    else skipb "modes layer, round trip 2 -> 3 -> 2: the images of mode 2 and the legacy examples of mode 3 equal the first visit"; fi
    if [ -z "$SAMPLE" ]; then
    # (b) forced rule == native rule: the new tree WITHOUT EVO_INFO_H against the old tree WITH it (stairW 3 oblique/iso Box A B C, rooms on, Cam 1-5)
    env -u EVO_INFO_H node tools/ui/regress.js "$r/native_stairW3" --set stairW=3 2>&1 | tail -1
    cmp_pass "(b) native info height vs forced: rooms off stairW=3" "$r/old_stairW3" "$r/native_stairW3"
    env -u EVO_INFO_H node tools/ui/regress_rooms.js "$r/native_rooms" 2>&1 | tail -1
    cmp_pass "(b) native info height vs forced: rooms on" "$r/old_rooms" "$r/native_rooms"
    env -u EVO_INFO_H node tools/ui/regress_cams.js "$r/native_cams" 2>&1 | tail -1
    cmp_pass "(b) native info height vs forced: camera bank Cam 1-5" "$r/old_cams" "$r/native_cams"
    else for lb in "(b) native info height vs forced: rooms off stairW=3" "(b) native info height vs forced: rooms on" "(b) native info height vs forced: camera bank Cam 1-5"; do skipb "$lb (the tool's own check: not sampled)"; done; fi
  } >> "$log" 2>&1
  git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$(dirname "$WT")"; WT=""; git worktree prune
  [ $UNEXP -eq 0 ] && S=PASS || S=FAIL
  FIG="$TOTAL images compared, $UNEXP unexpected differences, $EXPD expected differences"
  # Guard (b): a render script that died leaves fewer images and compare.js does not notice; the count must be the planned one (a correct run prints exactly what it printed before).
  local planned; planned=$(regress_planned)
  [ "$TOTAL" -eq "$planned" ] || { S=FAIL; FIG="$TOTAL de $planned imágenes: un script de render se cayó (¿caché de mapas?); $FIG"; }
  rm -f "$D/regress.sample"
  if [ -n "$SAMPLE" ]; then # a sample is never a full pass: the marker, and what ran / what did not for the summary
    FIG="SUBSET (regress --sample 1/4:$SAMPLE_K, $RUNB de ${#REGRESS_BLOCKS[@]} bloques, $TOTAL de $REGRESS_TOTAL_IMG imágenes): $FIG"
    { printf 'K\t%s\n' "$SAMPLE_K"; cut -f1 "$D/regress.scripts" | sed 's/^/ran\t/'; for lb in "${SKIPPED[@]+"${SKIPPED[@]}"}"; do printf 'skipped\t%s\n' "$lb"; done; } > "$D/regress.sample"
  fi
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
        sm = os.path.join(d, p + '.sample')
        if os.path.exists(sm):
            rows = [r.split('\t', 1) for r in open(sm).read().split('\n') if '\t' in r]
            res[p]['sample'] = {'fraction': '1/4', 'K': int([v for k, v in rows if k == 'K'][0]), 'ran': [v for k, v in rows if k == 'ran'], 'skipped': [v for k, v in rows if k == 'skipped']}
shots = []
sd = os.path.join(d, 'shots')
if os.path.isdir(sd): shots = sorted(os.path.join(sd, x) for x in os.listdir(sd) if x.endswith('.png'))
json.dump({'dir': d, 'parts': res, 'screenshots': shots}, open(os.path.join(d, 'summary.json'), 'w'), indent=1)
with open(os.path.join(d, 'summary.txt'), 'w') as o:
    for p, r in res.items():
        o.write('%-8s %-5s %4d s  %s\n' % (p, r['status'], r['seconds'], r['figures']))
        if r['slowest']: o.write('         slowest: %s\n' % ', '.join('%s %d s' % (x['name'], x['seconds']) for x in r['slowest']))
        if r.get('sample'):
            o.write('         sample 1/4:%d ran %d blocks: %s\n' % (r['sample']['K'], len(r['sample']['ran']), '; '.join(x[:48] for x in r['sample']['ran'])))
            o.write('         sample 1/4:%d SKIPPED %d blocks: %s\n' % (r['sample']['K'], len(r['sample']['skipped']), '; '.join(x[:48] for x in r['sample']['skipped'])))
    if shots: o.write('screenshots: %d files in %s\n' % (len(shots), sd))
    o.write('logs: %s\n' % d)
print(open(os.path.join(d, 'summary.txt')).read())
sys.exit(1 if any(r['status'] == 'FAIL' for r in res.values()) else 0)
PY
