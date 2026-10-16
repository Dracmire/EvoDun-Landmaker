# UI pass: one mode per crystallizer

Status: APPROVED (user, 2026-10-15), including the per-mode split of the controls (section 4). PR 1 IMPLEMENTED (the modes layer, PR #31); PR 2 IMPLEMENTED (info line height, `#layout` removed, one Whole map button): `src/modes.js` (the table), `docs/modes.md` (generated), `tools/ui/test_modes_ui.js`. Next: PR 2 (section 10) and the PR after it (DAC at Cam 6, section 7b). `CLAUDE.md` Pending 9.

PR 1 notes (what was built, where it differs from or adds to the text below): the mode selector, its purpose line, banner and examples are at the top of the side panel (the scenario block is hidden); a control outside the mode is hidden with the class `mh`; advanced controls (and the terrain controls of modes 2, 3, 4) are folded behind a toggle of their group ("Show advanced controls (n)"); the examples are the old scenarios; `viewer.mode` is in the manifest (`docs/pack-format.md`); the test-only flag `window.EVO_NO_MODES` (set by `tools/ui/common.js`) shows the whole panel as before; the global rule `[hidden]{display:none!important}` was added so that a hidden row (chips, rows) is really hidden; mode 5 hides Incursion in the Stack / Cutaway (it was greyed); a group whose controls are all folded keeps its heading and its fold toggle visible (the "1 Terrain" section of modes 2, 3, 4 shows "Show terrain controls (9)", which opens the nine terrain controls); with the modes layer on, the room chips (and zone chips) are in a box of about 5 rows with its own scroll (class `modes` on `<aside>`), so that the 88 room chips of mode 2 do not push the mode's own controls off the first screen ("Whole map" and the hint stay outside the box; the panel without modes is unchanged); the technique buttons offered are Box / A / B in mode 1, C in mode 4, B in mode 3, Box in mode 6 and all four in modes 2 and 5.

## 1. Decisions (user)

- U1 (2026-10-15) ONE MODE PER CRYSTALLIZER: choosing a crystallizer loads its example, its camera and its technique, and shows only its controls.
- U2 (2026-10-15) STRICT FIRST: each mode alone plus the shared passes. Combinations between crystallizers come later as "Extras" (section 9), each one only after a check shows it works.
- U3 (2026-10-15) The Macroform (6) is view-only in this pass. The user's objection is recorded in section 8: as long as it can only show one baked volume, it is not yet a full crystallizer.
- U4 (2026-10-15) Compare only in the modes that have alternative techniques (1 and 4).
- U5 (2026-10-15) The room types (Diorama, Ascension, Cake: DAC) should apply to every crystallizer; it is the check the user is most interested in (section 7).
- U6 (2026-10-15) Floors (5) goes under "Archived": reachable, out of the main list.
- U7 (2026-10-15) Mode 2 (DAC) opens at Cam 1, and Cam 6 must also work in it: the crystallizers were first thought of as isometric + HD-2D (section 7b).
- U8 (2026-10-15) DAC for every example comes LATER (after this pass). Where a crystallizer is not a good match for an example it is simply not offered there: the compatibility table (section 6) decides.
- U9 (2026-10-15) The Macroform (6) is marked INCOMPLETE, like the Stage (3): it shows the volume but it is not yet a crystallizer (section 8).
- Earlier (2026-10-14): Floors (5) is closed; the Macroform's phase 1 is closed; the Stage (3) waits for its own design pass.

## 2. The problem (measured on the page, 2026-10-14)

- 84 controls in ONE panel about 3,400 px tall (almost four screens at 900 px).
- The controls of Floors and Macroform only appear after choosing their source: they cannot be found from the panel.
- The 21 controls of Room types are greyed until Rooms is on with a map big enough to have rooms; on the default source there are none.
- "Stage preset" sets the camera and the technique but not the Stage's example (Shrine-Pier x4); only the scenario button does.
- The 7 scenario buttons are the only entry point per crystallizer, and they do not say which crystallizer they belong to.
- Floors and Macroform are computed offline by Python scripts: no control of the page changes their shape.
- Two "Whole map" buttons (zones and rooms) sit next to each other.
The user's words: "if you asked me to make an example of each crystallizer, I could not".

## 3. What a mode is

One table in `src/` (a `MODES` table next to the controls table of `src/controls.js`) is the single source of truth; the UI reads it and `docs/modes.md` is generated from it (as `docs/controls.md` is today), with a test that the two are in sync. A mode has:

| Field | Meaning |
|---|---|
| id, number, name | `terrain` 1 Terrain, ... |
| purpose | one line shown at the top of the panel: what this mode is for |
| banner | optional: "closed", "in redesign", "baked by a script" |
| examples | the sources it accepts, each with the parameters it sets (the old scenarios become examples); the first one is the default |
| camera, cameras | default camera; the cameras offered (the others are hidden in this mode) |
| techs, compare | the techniques offered; whether the Compare grid exists in this mode |
| main, advanced | control ids: the main ones always visible, the advanced ones folded |
| common | which blocks of the common area apply (shared passes, overlays, incursion, diagnostics) |

Rules: a control that does not belong to the current mode is HIDDEN (not greyed). Inside a mode the existing requirements still apply (greyed + "Requires: ..."). Entering a mode applies its default example; changing the example inside the mode does not leave the mode. The `viewer` block of the manifest may carry `mode` (optional; `docs/pack-format.md`).

## 4. The six modes (proposal)

| # | Mode | Examples (default first) | Camera (offered) | Technique / Compare |
|---|---|---|---|---|
| 1 | Terrain | Snake Mountain surface, Real map 256, Shrine-Pier, Shrine-Pier x4, Snake Mountain (caves subtracted), Value noise, Your images (PNG + roles) | Cam 3 (1-7) | Box / A / B; Compare |
| 2 | Room types (DAC) | Real map · Balanced types, Real map · Default, Pocket · Diorama 31, Your images (only examples with rooms, U8) | Cam 1 (1-7); Cam 6 must also work (U7, section 7b) | one of Box / A / B / C (DAC draws in all four, section 7); no Compare |
| 3 | Stage | Shrine-Pier x4 · Stage, Diorama 31 · Stage | Cam 6 (6, 7, 1-5) | B (the Stage preset); no Compare. Banner: IN REDESIGN, frozen as it is |
| 4 | Curves (C) | Snake Mountain surface, Real map · Default, Real map · Balanced types, Shrine-Pier x4 | Cam 3 (1-7) | C; Compare |
| 5 | Floors | Snake Mountain floors | Cam 1 (1-5, 7) | the Floors view; no Compare. Banner: CLOSED, shapes baked by a script. Under "Archived", not in the main list (U6) |
| 6 | Macroform | Snake Mountain macroform | Cam 1 (1-5) | the volume (one panel); no Compare. Banner: INCOMPLETE (U9): one baked example, not yet a crystallizer |

Compare: today's 2 x 2 grid (Box | A | B | C) in modes 1 and 4; no new layout work. (Alternative, not proposed: three panels Box | A | B in mode 1, which brings back the retired Rows / Columns layouts.)

Controls per mode (ids of `src/controls.js`):

- 1 Terrain. Main: `terraces`, `subs`, `terH`, `spread`, `stairW`, `stairStyle`, `rampDepth`, `smooth` [A], `radius` [B]. Advanced: `subH`, `minPlateau`, `minSub`, `pre`, `climb`, `gateThr`, `gateMin`, `passGap`, `tread`. Slice block: `zoneChips` (when the source has zones), `crop`, `margin`.
- 2 Room types. Rooms is always on in this mode (`t-rooms` hidden). Main: `roomsPreset`, `t-cake`, `t-ascWalls`, `ascHeight`, `t-pocket`, `pocketFraming`, `pocketHeight`, `roomChips`, `typeTint`. Advanced: `roomsMinCore`, `rRadius`, `roomsCross`, `roomsIsoLimit`, `cakeLayers`, `cakeStep`, `cakePer`, `cakeSeam`, `roomBorders`, `roomTint`, `nowalk`, `dioOutline`. Terrain (folded): the main controls of mode 1.
- 3 Stage. Main: `contract`. Entering the mode applies the Stage preset. Terrain folded. Nothing else until the redesign.
- 4 Curves. Main: `curvesPreset`, `wallPass`, `wallExtrude`. Advanced: `wallStrata`, `wallColumn`, `t2Spacing`, `t2Rows`, `t2Group`, `t2Jitter`. Terrain folded.
- 5 Floors. Main: `floorsView` and the floor chips, `t-backdrop`, `backdropGap`, `backdropHeight`.
- 6 Macroform. Main: `macroView` and the cut chips; "Heightmap (for comparison)" is the old Off. A read-only box "Baked parameters" from `pack.macro.params` (V 2, DZ 0.25, T_SHELL 1.5, HEAD 2.5, SLAB 0.5, RAMP_W 1, SHAFT_R 2.5, STEP 0.75, ground 2.97, provisional) says that changing them needs `tools/derive_snake_macroform.py`.

## 5. Common area (every mode, under its own controls)

- Shared passes: `outlines`, `gradient`, `rampLines`, `dress`. Mode 6: outlines only (the volume has its own painter).
- Overlays: `features`, `markers`, `zones`, `edges`, `masks`, `veil`, `border`, with today's requirements.
- Incursion: `m-stake`, `m-obj`, `m-rm`, `m-clear`. Hidden in mode 6 and in the Stack / Cutaway of mode 5 (today greyed).
- Diagnostics (folded): `regions`, `passes`, `edgeWarn`.
- View bar: the mode selector first, then the cameras of the mode, the techniques of the mode, Compare (modes 1 and 4), Reset.
- The scenario block disappears: every scenario is an example of its mode (Real map Default / Balanced / Pocket 31: mode 2; Shrine-Pier x4 Stage: mode 3; Snake surface Curves C: mode 4; Snake Floors: mode 5; Snake Macroform: mode 6). `__evo.scenario(id)` stays for the tests.

## 6. What combines with what today (measured or by design)

| Stage of | Box | A | B | C | Cam 1-5 | Cam 6 | Cam 7 | Sources where it applies |
|---|---|---|---|---|---|---|---|---|
| 1 Terrain (terraces, ramps) | yes | yes | yes | yes | yes | yes (limitation 15) | yes | every heightmap |
| 2 Cake rings, Ascension walls | yes | yes | yes | yes (measured 2026-10-15) | yes | yes (measured) | by design | only maps with rooms: today the real map (section 7) |
| 2 Pocket | yes | yes | yes | by design (not measured) | yes: composed along the active camera's axis (all of Cam 1-7; 7b) | yes (7b) | yes (7b) | real map Dioramas |
| 3 Art contract | yes | yes | yes | yes | yes | yes | by design | every heightmap; landmarks and trees only in Shrine-Pier x4 |
| 4 Wall pass | no | no | no | yes | yes | yes | yes | every heightmap |
| Wall dressing (shared) | yes | yes | yes | yes | yes | by design | by design | every heightmap |
| 5 Floors view | yes | yes | yes | yes | Stack / Cutaway: ortho only | single floor only | yes | the floors pack only |
| 5 Floor backdrop | yes | yes | yes | yes | Cam 1 only | no | no | the floors pack only |
| 6 Volume view | own painter | - | - | - | yes | no | no | the volume pack only |

## 7. DAC: does it apply to the other examples? (measured 2026-10-15)

The DAC geometry does not depend on the technique: on the real map, Balanced types, at Cam 1 and Cam 6, Cake rings, Ascension walls and the Art contract draw in Box, A, B and C with no page error (pixels changed per switch, Cam 1: Cake 31-56 k, walls 21-25 k, contract 25-26 k; Cam 6: 23-48 k, 19-22 k, 26 k).

What it depends on is the DATA: DAC classifies the ROOMS of the map, and the rooms layer (watershed rooms, a radius in tiles, built for the 256 x 256 map) finds almost none on the small examples. Rooms on, Cake and walls on (scratch script `dac_sources.js`, not in the repo):

| Source | Default (r 9, core 20) | Balanced types (3 ter., r 5, core 100) | r 5, core 5 | r 3, core 5 |
|---|---|---|---|---|
| Snake Mountain surface 40x40 | 0 rooms | 0 | 0 | 3 rooms, all Ascension, 0 ramps |
| Shrine-Pier 10x10 | 0 | 0 | 0 | 0 |
| Shrine-Pier x4 40x40 | 0 | 1 Ascension | 1 Cake (46 ring tiles, 1 ramp) | 49 rooms: 0 Cake / 1 Diorama / 48 Ascension, 0 ramps |
| Snake Mountain (caves) 40x40 | 0 | 1 Ascension | 1 Ascension | 3 Ascension, 0 ramps |
| Snake floors, exterior 40x40 | 0 | 0 | 0 | 23 Ascension, 0 ramps |
| Snake macroform, surface 40x40 | 0 | 0 | 0 | 3 Ascension, 0 ramps |
| Real map 256x256 | 32: 31 / 0 / 1 | 88: 29 / 18 / 41 | 88: 66 / 5 / 17 | 209: 93 / 22 / 94 |

Readings: on a 40x40 map the rooms are too few, and with rooms on the ramps come only from the rooms tree, so they fall to 0 and there is no Cake (a Cake needs a ramp between two terraces inside a room). Making DAC apply to every example is a question about WHERE THE ROOMS COME FROM on a small or semantic example, not about drawing. Routes (none decided):
- R1 Declared rooms in the pack, like the declared links of Floors: the semantic pass names its rooms (the Shrine's room, the Pier's room, each floor of a macroform).
- R2 Room scale relative to the map. Measured above: radius 3 gives 3 rooms and no ramps on the Snake surface; not enough by itself.
- R3 Bigger examples (decompressed like Shrine-Pier x4).
- R4 Reopen the rooms layer (frozen since PR #6 by the user's decision, Pending 4).
Decision (U8): this comes after the UI pass. Until then DAC is offered only on examples that have rooms.

### 7b. DAC at Cam 6 (U7): DONE (UI pass, the Pocket composed along the active camera's axis). Seen 2026-10-15 before the fix, Pocket · Diorama 31 and the real map Balanced types, technique A

- Works: Cake rings and Ascension walls on the whole map, at Cam 6 as at Cam 1 (no page error; section 7 figures).
- Does not work: the POCKET. It is composed along the Cam 1 axis (backdrop behind, pond in front, as seen from Cam 1), so at Cam 6 (and Cam 7) the backdrop sits to one side of the fragment instead of behind it. Limitation 15 (4).
- Also open under Cam 6 (limitation 15): Box tile order is the orthographic one, not an exact painter order under perspective (pick 91-98 %); marks and line widths do not shrink with distance.
- DONE: the Pocket is composed along the ACTIVE camera's axis. `P.pocketYaw` (degrees; a diagnostic-style parameter, not a control, not in the manifest; undefined = 45 = the old behaviour) is passed by `E.shape` to `E.pocket.windowOf` and `E.pocket.apply` (the same yaw, so the window contains the disc) and stored in `S.pocketYaw`; `src/ui.js` sets it from the camera's BASE yaw (`baseYaw()`: Cam 1 45, Cam 2 -45, Cam 3-5 and 7 0, Cam 6 0 or the pack's `stageYaw`) and `draw()` rebuilds a pocket whose `S.pocketYaw` differs from the base yaw now (one check that covers a preset click, a scenario, a mode or example change, a manifest camera and the Stage preset; Cam 3 <-> 4 <-> 5 <-> 6 <-> 7 do not rebuild, Cam 1 <-> 2 <-> the others do, about 1-2 s). The drag variation of yaw / pitch does NOT recompose it (same policy as the Floor backdrop: measured and printed, not asserted). `src/pocket.js` plan code unchanged (it was already parametrised by yaw: 18 of 18 Dioramas build, hard rule, fragment = world, exits reached at yaw 45 / -45 / 0 / 90; `tools/test_pocket.js`). Figures, measured on the 18 Dioramas of the real map, Balanced types (`tools/ui/test_pocket_cam_ui.js`, Box pick render): mean screen offset of the backdrop dx in fragment widths (0 = centred behind) Cam 1 +0.05, Cam 2 +0.08, Cam 3 +0.06, Cam 6 +0.05 (before, composed for 45: Cam 3 -0.33, Cam 6 -0.31, Cam 2 -0.48, Cam 1 +0.05); fragment visibility lost to the decoration (alone minus with pocket) 0.00-0.02 points at every camera (before: Cam 6 3.41, Cam 2 0.99). The mean over only the six archetype rooms (31 7 22 49 4 25) at Cam 2 is +0.18 because two of them have a backdrop of 27 and 3 tiles (a centroid of 3 tiles is noise), so the statistics use the 18 rooms. NOT fixed on purpose (out of scope, still open): Box tile order under perspective, marks and line widths, the low pitch of Cam 6 (25 deg) that makes a high-relief room hide itself, double dioramas.
- Open (measured 2026-10-17, DIAGNOSIS ONLY, `src/pocket.js` unchanged; real map, Balanced types, the 18 Dioramas): (1) the per-room offset of the backdrop is large for some rooms while the mean and the median are fine: median |dx| 0.06 / 0.07 / 0.12 / 0.09 and max |dx| 0.35 / 0.46 / 0.77 / 0.69 fragment widths at Cam 1 / 2 / 3 / 6 (`tools/ui/test_pocket_cam_ui.js`, assertion (b2): median <= 0.20, a proposed bound). (2) ROOM 66 (hill, 534 tiles, fragment 25 tiles wide at yaw 0): Cam 3 / 6 dx +0.77 / +0.69 is a mean offset of 19.2 tiles toward the east, not a normaliser artefact (the fragment is not narrow; 19 tiles is 0.49 of the disc radius R 39.1) and not a clipped disc (disc bbox x 111..189, y 69..147 inside the 256 x 256 map; `grown` false). Cause: the backdrop (cells with offset k >= 1) is only 4 Voronoi cells and 84 tiles at yaw 0, and ONE cell holds 70 of them, at screen x +16 tiles; 5 tiles sit at -12.8. By design ("Seeds: 3 behind, 4 in front, 2 at the sides, each one random inside its zone", `src/pocket.js` header; the offset k of a cell comes from the distance of its seed along the camera axis): the centroid of three random seeds weighted by their cell areas has a large scatter, so a per-room centring is not guaranteed, only a statistical one (Cam 1: 4 backdrop cells, 226 tiles, dx -0.19; Cam 2: 6 cells, 326 tiles, +0.28). (3) ROOMS WITHOUT A BACKDROP TILE are of two kinds. (a) The probe misses a backdrop that exists: rooms 30, 31, 34, 64 (Cam 1 / 2 / 3 / 6) and 7 (Cam 2) have 4-9 cells with k >= 1 (120-705 tiles), but their highest decoration tile is below the probe's threshold (median fragment height + 1 terH): room 31 2.22 vs 2.44 (fragment 1.00..2.44), 34 1.22 vs 2.00, 64 2.00 vs 2.22, 30 2.22 vs 3.00, 7 2.00 vs 2.44; the decoration is +1..+3 terraces over the level of the NEAREST fragment floor tile, snapped down to the level grid, so for a tall fragment it stays below the fragment's top. (b) The composition has no backdrop: rooms 22 (Cam 1, 2) and 35 (Cam 1), hill archetype, have NO cell with k >= 1 (highest decoration tile 1.44 / 1.44 / 1.22, at most the fragment's top 1.44); all their seeds behind the fragment end at k = 0 (probably the min-plus smoothing, "neighbouring cells differ by at most one band", lowering a behind cell that touches a side or front cell of k -1: the final k are measured, the smoothing as the cause is not isolated). (b) and the scatter of (2) are properties of the composition, a design area: options if wanted: (i) accept them and judge the Pocket by the mean / median (what the tests do); (ii) stratify the three behind seeds laterally (left / centre / right of the zone) and exempt them from the smoothing's lowering (every room gets a backdrop, the centroid scatter drops; it changes every Pocket picture and the Pocket tests).

## 8. Macroform and Floors: what they are (the user's objection, 2026-10-15)

- The Macroform's DATA is a voxel grid stored as runs: each column holds solid intervals (z0, z1, material) at a step of 0.25 tile. An SDF appears only inside the offline derivation: the shell is carved where the 3D distance to the outside air is greater than T_SHELL; that field is then cut into voxels. The viewer draws voxel blocks. So: SDF in the derivation, voxels in the data and the drawing. The "SDF exterior mesh" crystallizer (a smooth surface from the field) was deferred and is still not built.
- Floors is stacked heightmaps; its floor footprints come from a rule (exterior >= z + 1 plus a shell of 1.5), not from a field. It never had a volume (its README, Goal).
- The user's objection: as long as the volume can only be shown as one baked example, and cannot be produced or tuned from the page, the Macroform is not yet a full crystallizer. Decision (U9): it is marked INCOMPLETE, like the Stage. Conditions for its phase 2 (not designed): (a) the derivation in the page from the macroform's input maps and parameters (the Python uses a 3D distance transform, smoothing and the ramp; 40 x 40 x ~80 voxels is small); (b) optionally a smooth 2.5D look by drawing each horizontal band of the volume with technique B (B is already a signed-distance contour technique in 2D), which would be an "SDF look" without 3D rendering.

## 9. The second step: Extras

Not a new mode: a block "Extras" inside a mode that lists stages of OTHER crystallizers. An entry is added only when a check has shown it works on that mode's examples (no page error, switch off = identical pixels, a picture looked at). First candidates, from section 6: DAC in modes 1 and 4 (only on examples that have rooms, so it depends on section 7); the Art contract in modes 1, 2 and 4. Each candidate is its own small check and its own decision.

## 10. Implementation (for Claude Code, after approval)

- PR 1: the `MODES` table, the mode selector, show / hide per mode, examples (the old scenarios) per mode, cameras and techniques per mode, Compare only in 1 and 4, the banners, the baked-parameters box of mode 6, `docs/modes.md` generated, `viewer.mode` in the manifest.
  Tests: a new `tools/ui/test_modes_ui.js` (per mode: the default example loads with its camera and technique; only its controls and the common area are visible; each MAIN control changes the picture or the info on that example; the cameras outside the mode are hidden; no page error). The pixel regression must stay at 0 differences for the same state.
  COMPATIBILITY OF THE EXISTING TESTS (found while writing the prompt, 2026-10-15): most UI tests and every regress script set the state by clicking real controls (`page.check('#t-rooms')`, `page.selectOption('#roomsPreset' | '#src')`, ...), and `tools/verify.sh regress` runs the SAME scripts against origin/main and the new tree. A mode that hides those controls would break them. Solution: a test-only flag `window.EVO_NO_MODES` (set by `tools/ui/common.js` with `page.addInitScript` unless `open({ modes: true })`; the old tree ignores it) shows the whole panel as today, so every existing test and regress script runs unchanged; `test_modes_ui.js` opens with modes on. `tools/ui/test_controls_ui.js` then does not need to change. The mode selector sits at the top of the side panel (where the scenario block is), NOT in the top bar, so the canvas size does not change.
- PR 2 (DONE, UI pass PR 2): (1) a FIXED height for `#info` (`box-sizing:border-box; height:80.2px; overflow-y:auto` = 4 text lines of 16.8 px + padding 12 + border 1; limitation 18 fixed): the canvases are painted at their final size, and in mode 1 each compare canvas lost 8 px of height (391 -> 383). The regress is NOT announced as "expected differences": `tools/ui/common.js` injects the same rule when `EVO_INFO_H` is set and `tools/verify.sh regress` sets it for BOTH runs (the old worktree and the new tree), and check (b) compares the new tree WITHOUT it against the old tree WITH it (stairW 3, rooms on, Cam 1-5: 0 differences); (2) the retired `#layout` selector is removed (limitation 19), with its listener, `st.layout`, `stage.dataset.layout` and the CSS rule of three panels in rows (three panels are unreachable: Compare is 4 panels, single is 1); the two assertions that tested the retired control now assert that there is no `#layout` element; (3) never two "Whole map" buttons: with Rooms on (rooms found) only `#wholeRooms` (a superset: it also clears the zones) is visible, with Rooms off only `#wholeMap`; both ids and handlers stay.
- ACCEPTANCE (the user's criterion): from GitHub Pages, without reading code, the user chooses each mode, its example loads, each main control changes what is drawn, and nothing is greyed without a "Requires: ..." that says what to do.

- PR after PR 1: DAC at Cam 6 (section 7b), with its own short design.

## 11. Open questions for the user

Answered on 2026-10-15: Floors under "Archived" (U6); mode 2 at Cam 1 with Cam 6 working too (U7); DAC for every example after this pass, the table decides where each crystallizer is offered (U8).
The per-mode split (section 4) was approved on 2026-10-15. No open question for PR 1.
