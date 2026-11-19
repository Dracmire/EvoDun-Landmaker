# Brief R3: platforms, front neighbours, base vs props, dolly, P7, Cam 7

Author [R], decisions of [U] 2026-11-19 (A569-A572). CC builds, measures and writes ONE delivery sheet per PR
(`docs/crystallizers/03-stage/entregas/PR-<n>.md`, the four tables of `entregas/README.md`). One PR per item.
Order = the order below; an item that fails twice stops and is reported (CLAUDE.md), the next one goes on.

Rules that hold for every item:
- Mode 3 only, DAC3 only (`src/s3/`). The original chain is read-only. A shared tool (render.js, tech.js, wallc.js,
  cameras) that must change for mode 3 is CLONED into `src/s3/` and the clone is changed.
- Main cameras untouchable: Cam 3 (mode 1), Cam 1 (mode 2), Cam 6 (mode 3), Cam 5. Cam 7 may change in mode 3.
- PLACES (decided by [R]; never the BUCLE examples u1, u2, L1, M1, dac_stage as evidence):
  r21 = plaza / plain (Default, 3 terraces), r16 = terraced hillside (Default, 7 and 9 terraces),
  r79 = valley / amphitheatre (Balanced, 5 terraces), Diorama 31 = interior (Balanced, 3), `forest_a` = forest.
  Use the boxes of `docs/crystallizers/03-stage/shots/p3_places.json` (tool `tools/ui/p3_same_place.js`).
- Every hypothesis constant is marked [R] and lives in one place. No signatures or Co-Authored-By lines in commits or PRs.
- Verification: the fast lane of CLAUDE.md "Verification lanes"; report the wall seconds and what did not run.

## Q0. Close the merge of #122 / #125 (30 min)

The conflicts of #122 and #125 were resolved by [R] by hand (both sides kept, build.py re-run, node tests and
`test_terraces_ui` passed). NOT run after the resolution: the hash tables and the regress sample.
- `tools/ui/s3_hashes.js` and `tools/ui/m2_hashes.js` against the commit before #122 (`git log` of main): identical
  with every new switch OFF (FrameNb, dolly, terraces control untouched).
- `tools/verify.sh regress --sample 1/4` (the diff of #122 / #125 touches `src/ui.js`, `src/modes.js`, `src/controls.js`).
- Any difference: stop and report; do not fix inside Q0.

## Q1. Dolly ON by default in mode 3, gain 0.15 (20 min)

[U] D2: dolly on, g = 0.15. Construible: si (`dollyFactor()` exists).
- Window examples of mode 3 start with `st.stage.dolly = 'on'`, `dollyGain = 0.15`; the window session restores the
  old values on every exit (same pattern as the other switches; a named mutation in `test_window_session_ui.js`).
- The OFF-state hash tables change ONLY for the mode 3 window examples (announce them in table (b) as "cambia");
  modes 1, 2, 4 and the legacy examples identical.
- Sheet: the growth of the destination terrace per place (r21, r16 at 9, r79), Cam 6, k0 / k4 / k8, as in P8.

## Q2. Lego stretches only the BASE; cap of m; test Height spread (60 min)

[U] D5: base structures (the terrain of the room) and prop structures (planes walls and columns, volumes, pillars,
objects) are separate. The lego stretches only the base; props keep their own height and the existing `exag`
slider. Limit (interpretation of [R], to confirm by [U] when he sees it): m <= round(T / 2) + 1, T = number of
terraces (3 -> 3, 5 -> 4, 7 -> 5, 9 -> 6); today `L.M_MAX` = 3 for any T.
1. MEASURE FIRST (no code change): r21 and r16 at 7 and 9 terraces, Up, k0 / k4 / k8, Cam 6: share of the panel
   covered by (a) base terrain of the hero's room raised by lego, (b) planes back wall / side columns, (c) terrain of
   other rooms, (d) volumes and billboards (pick render by source). Table in the sheet. This says WHAT blocks.
2. Separation: if (b) or (d) take their height from the lego-raised top, make them take it from the Mid (un-lego)
   ground of the room (+ their own H x exag). Construible: si (planes / volumes are already in DAC3).
3. Cap: `L.M_MAX` becomes a function of T (one place, [R]). Same shots after 2 + 3.
4. Height spread (`P.spread`, the terrace control of "extreme heights"): r16 and r79 at 5 / 7 / 9 terraces, Mid,
   spread 1 / 1.5 / 2, Cam 6 k4. Sheet only, no judgement.

## Q3. Platforms of the Numeric World in DAC3: phase 1 (90 min)

[U] D4: do not invent the parts of a room; the user's `reference/EDunProcGen.cs` already splits a room into
platforms. TRANSCRIBE (read-only reference, `SequenceA` lines 470-680) into a new `src/s3/platforms.js`:
1. Widened path: `GenerateRoomAwareWidenedFlowMap` (maxHalfWidth 6) over the A* tree paths the DAC3 rooms already
   have (`S.conns` / the tree of `src/s3/rooms.js`).
2. `ExtractAndClassifySubsegments` (per room, terrace), `ComputeThicknessMap`, `PruneSubsegmentsByThickness` (min 4).
3. Seeds: flow seeds (`FloodPlatformBlobSeedsFromSubsegments`, min 12) and room seeds
   (`FloodPlatformBlobSeedsFromUntouchedSubsegments`, min 300; it has TWO overloads: use the one `SequenceA` calls at
   line 502, `(fullSubsegments, prunedSubsegments, touchedByPath, minSurface: 300)`).
4. Visibility: `GenerateVisibilityMap_SlopeTerrace` + `GenerateVisibilityMap_TerraceOnly` with `cameraDir` = the
   yaw of the room (C1), `TrimSmallVisibilityRegions`; `TrimPlatformSeeds_VisibilityAndPadding` (0.3, 2).
5. `MultiVantagePlatformGrowth` (0.85, 1000, 250) -> platforms with `vantagePt`.
6. Flow type per (room, terrace): `ClassifyRoomFlowFromConnections` (50, 200) -> Leaf / Corridor / Hub / Small / Micro / Dead.
7. Roles if time remains: `ClassifyPlatformRoles`, the heat maps and `AssignScenarioRoles` / leaf / corridor.
OUTPUT of phase 1 (no render rule uses it yet): per room the platforms, their flow type, the ROAD platforms in path
order and the ELBOWS = a change of direction >= 45 deg [R] between the centres of consecutive road platforms.
A debug overlay in mode 3 (switch "Platforms (debug)", off by default) and a table per place.
- Every deviation from the C# (`slopeClasified` comes from DAC3, no Unity types, etc.) listed in the sheet with its reason.
- If a function the pipeline needs is missing in `reference/`, STOP that step and list it (do not invent it).
- Unity: the same code already exists in the user's project; nothing is exported.

## Q4. Neighbours in front of the hero (60 min)

[U] gave three ways (A571-A572). Occlusion behind a lip of height D at Cam 6 (pitch 25): the hidden ground is
D / tan 25 = 2.14 D long.
1. CONTROL (build): switch "Only rooms in front" in mode 3: the window rooms that lie between the camera and the
   hero's room (view depth u smaller than the near end of the hero's room, yaw of the room) are not drawn (visual
   only; shape, walking, route unchanged). Shots of r21, r16 at 9, r79 with it off / on, k0 / k4 / k8.
2. DQ3 GAPS (measure only, no move yet): for every pair of window rooms A (in front) and B (behind, lower by D):
   D, the required gap 2.14 D in tiles, the gap that exists today, whether B is Leaf / Dead (from Q3 step 6; if Q3
   did not reach it, say so), and the free space behind B (could B move back by the missing gap without touching
   another room?). Construible: si / no per pair. Precedent for the move later: the Diorama move with bridge (U18).
3. DAC cut (Quebrada + props off behind the camera): no work; it exists. Only one shot per place for the comparison.

## Q5. P7: at most 2 steps per tile (45 min)

[U] F1: a stair never puts more than 2 risers on one tile; if it needs more, the stair gets LONGER (more tiles).
In lego rooms (m >= 2) the risers grow x m. Construible: si, in the DAC3 carve (`src/s3/shape.js`, the stair depth).
- Rule: depth = max(current depth, ceil(risers / 2)); if the longer footprint does not fit, the stair is reported, not forced.
- Sheet: per stair of r16 (9, Up) and r21 (3, Up): risers, depth before / after, fitted or not. Shots at k4.

## Q6. Cam 7 in mode 3: follow + ground ratio 0.5 (45 min)

[U] D3 ok. Cam 7 draws height and depth at the same scale (sp = cp = 1); Cam 6 reads 2.14. Proposal: in mode 3 Cam 7
uses a depth scale 0.5 [R] and follows the hero like Cam 6 (`view.focus`, clamp). CLONE what changes into
`src/s3/` (no change to the shared camera output: Cam 7 of modes 1, 2, 4 byte for byte, `tools/test_cams.js`).
Shots r21 / r16 / r79, k4, Cam 6 next to Cam 7. Also 0.4 and 0.6 in one sheet so [U] chooses.

## Q7 (only if time remains). Hybrid edge bands (D1 approved)

The horizontal bands of 'Ah' come from the shared wall pass drawing per level. Clone the wall pass into `src/s3/`
for 'Ah' only and draw the wall of a square run as one face over its whole height. Square and Mid untouched.

## What [R] reads first
Q0 table, Q2 step 1 table, Q3 table of platforms / elbows, Q4 table of pairs. Shots marked "nuevo" or "cambia".
