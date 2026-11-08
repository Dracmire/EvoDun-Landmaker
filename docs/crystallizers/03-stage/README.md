Ver también: [`MVP.md`](MVP.md) (plan del MVP), [`BRUJULA.md`](BRUJULA.md) (brújula del modo 3) y [`refs/`](refs/) (material de referencia DQ3).

# Crystallizer 3 - Stage (framing and dressing)

## 1. Status

**REDESIGN IN PROGRESS (2026-11-02).** The 2D-HD design is closed in the user's own project (design passes v25-v91) and becomes mode 3 of the viewer in six PRs, S1-S6. The old Stage (the Cam 6 preset + the Art contract MVP, sections 2-9 below) is kept as **legacy examples** of mode 3 (`x4_stage`, `diorama31_stage`; byte-identical to before S1). The text of sections 2-9 is the history of that MVP; where a decision below is marked SUPERSEDED it no longer rules the new crystallizer.

| PR | Scope |
|---|---|
| **S1** (this one) | the base: a DAC window of 6 rooms, units in hero heights H, a hero placeholder, Cam 6 hero tracking with the clamp, the readout |
| **S2** (built: ISLA + QUEBRADA) | borders outside the footprint of the window (ARENA, CIMA, MIRADOR: S2b) |
| **S3** (built) | transitions: the window's own camera yaw, steps, the fill preference for lateral ramps |
| **S4a** (built) / **S4b** (built) / **S4c** (built) | S4a: declared billboards in H (convention of the hero); S4b: volumes (columns, real geometry); S4c: the landmark with a height that changes with the distance |
| S5 | the treatment JSON |
| S6 | the paired-shot tool |

### Integration rules (S1 and every later Stage PR)
- **R1** Mode 3 is its row in `src/modes.js` (examples, Cam 6, techniques, controls); the modes layer only shows / hides controls and sets parameters.
- **R2** Every new Stage pass is a switch in the common pipeline, OFF by default; with it OFF the pixels are identical (`tools/verify.sh regress`: 0 differences). Same rule as crystallizer 2.
- **R3** Geometry passes are tile-resolution stages common to Box / A / B, like the Cake rings and the Pocket. No mode-3 renderer, no sub-tile field.
- **R4** Placeholders of OBJECTS (billboards, the landmark; S4) are projected with `cam.p` (they scale with depth), sorted by depth and drawn only where the Box pick buffer sees their base, like the Art contract props. EXCEPTION, the hero: it is ALWAYS drawn on top, with no visibility test (a game shows the player; hero occlusion is Unity's).
- **R5** Mode 3 uses the same DAC data as mode 2: the same source and parameters, identical terrain. Cake rings and Ascension walls stay off (`applyScenario` sets them off and `applyDacRule` acts only in mode 2); the Pocket comes from the example flag.
- **R6** The DAC chain is computed only in mode 2 (`dacChainOn`). Bringing the live chain into mode 3 is a later PR of its own.
- **R7** Shared code (`makePersp`, `contract.js`) changes only through OPTIONAL inputs whose absence gives today's behaviour, byte-identical (S1: `view.focus`).
- **R8** Nothing is exported (D15).

### S1 as built (`src/stage.js`, `docs/ui-modes.md` mode 3)
- **Example `dac_stage`** (the default of mode 3): `real_map`, preset Balanced types, terraces 5, spread 1, spread centre `largest`, the Stage preset NOT applied, the window `roomSet` = rooms [17, 10, 20, 27, 6, 5] of the chain of mode 2's `real_chain5` in first-visit order (2 Cake, 2 Diorama, 2 Ascension; 2911 slice tiles; rooms box 109 x 53 tiles). The terrain is the neutral terrain of mode 2's `real_chain5` (the chain view, Cake rings, Ascension walls, the Pocket and the Diorama move are mode-2 rules and are off here): `tools/ui/test_stage_ui.js` T1 (hash of levelH, fine, rooms and types of the whole map equal to mode 2 with its rules neutral), T2 (0 height differences on the 2911 tiles of the window against the whole map), T3 (mode 2 -> 3 -> 2 leaves the chain and the plan unchanged). The two legacy examples and the images of modes 1 and 2 are checked by `tools/ui/regress_modes.js` (in `tools/verify.sh regress`).
- **Units.** `stage.tilesPerH` (default 2: "a character is 2 tiles tall", the convention approved for the backdrop, `05-floors/option2-backdrop.md` D; range 1.5-4 step 0.25): 1 H = tilesPerH viewer units, horizontally and vertically. Every Stage constant is declared in H and converted at the boundary. `terH` stays 1 tile in S1, so a terrace step is 0.5 H (a 5-terrace window is 2 H high); its value in H is calibrated later with paired shots, together with tilesPerH.
- **Hero.** A camera-facing billboard 1 H tall and 0.4 H wide, drawn from its projected FEET upward with the depth scale of the feet (about 0.984 at Cam 6 / heroFrac 0.14), always on top. State in map coordinates; click on a walkable cap places it (walkable = not void, not water, inside the slice, not pocketRole 2 / 4); arrow keys move it 0.25 H (blocked only on non-walkable cells: it may cross a cliff edge, it is a placeholder); "Previous / Next room" jump to the centre of the room in the list and resume following.
- **Cam 6 tracking** (port of the reference rig; behaviour, not code): `view.focus = [x, y, h]` (optional; absent = byte-identical camera, golden hash in `tools/test_stage_cam.js`) makes the pivot the hero centre (feet + 0.5 H) and skips the fit loop; `D = f / sc` is unchanged, with `sc = heroFrac * panelH / H` so `dist = H / (2 heroFrac tan(FOV / 2))`; `heroFrac` default 0.14. Measured from the viewer's own projection: near/hero 1.39 and far/hero 0.60 (the reference values of design pass v73), hero centre at the screen centre +-1 px, drawn height = heroFrac x panel height x 0.984 (inside +-2 %). Clamp against the rooms box (`S.sliceBox`, no scenery margin): sideways (half-width hw = dist tan(FOV / 2) panelW / panelH) and on the near side (near = dist cos p - dist sin p / tan(p + FOV / 2)); the far side is NEVER clamped; the target height always follows the hero. The info line shows CLAMP and the hero leaves the centre.
- **Suspending the tracking.** A drag, a wheel step or an orbit suspends it WITHOUT moving the camera: the focus is frozen at the last target and the manual deltas start from the current view (one wheel step changes the zoom by exactly one factor around the same focus; the tracking zoom, about 5.9x the fit, is above the 0.5-4 range of the wheel, so in mode 3 the step is taken from the current zoom, and the wheel cap is max(4, 2 x the last tracking zoom) so the wheel can always get back to the tracking zoom after zooming out below 4: `st.trackZoom`). The "Follow" toggle, a double click and "Reset view" return to tracking.
- **Readout** (first in the info line, mode 3 window example only): `1 H = N tiles`, the terrace step in H, the measured hero height as a share of the panel, near/hero, far/hero, cell, room id, `following` / `CLAMP (side)` / `follow off`.
- **S2a (clean view and measures in H; only `dac_stage`):**
  - **Clean view.** The example declares its own Display state (`display` in `src/modes.js`): the 8 debug aids (room borders, not-walkable tone, gate markers, ramp cross lines, veil, slice border, landmarks, edge-problem outline) and the tint / Diorama outline are OFF; outlines, cliff gradient and water / snake / cave stay on; every checkbox keeps working.
  - **Measures in H** (checkbox, on by default in a window example; `E.stage.TERRACE_H = 2`, `SUB_RATIO = 0.22`): `terH = 2 H x tilesPerH` (4 tiles at tilesPerH 2) and `subH = 0.22 x terH` (the proportion of today; `E.subHeight = min(subH, terH / (subs + climb - 0.5))` keeps it exactly); the terH / subH controls are hidden, the terrace step in the readout is 2.00 H. `tilesPerH` applies on release with a rebuild (`invalidate(true)`: about 1 s headless; the busy message). Off: the controls come back (terH, and subH with the folded terrain controls) holding the derived values; on again: derived again (it overwrites the manual ones). "Reset" = tilesPerH 2, heroFrac 0.14 and the switch on. TERRACE_H = 2 H is a HYPOTHESIS (the user: a terrace goes from 3 to 6 tiles = 1.5-3 H; the reference has back walls of 2.4 H): a constant, no slider, no manifest key; S6 calibrates it (with the switch off, or by changing the constant). The manifest `viewer.stage.units` (boolean, absent = on) records the switch.
  - **Nothing but the heights changes with the unit** (measured, terH 1 / 2 / 4 / 6 tiles, 5 terraces, Balanced types, window [17, 10, 20, 27, 6, 5]): the same 88 rooms and room map (also in the window), 659 not-walkable tiles (22.64 % of 2911), 1 walkable region (100 %), 4 stairs of 21 tiles, 100 % stair coverage, 14 levels; the relief is 2.44 x terH tiles (1.22 H at terH 1, 4.88 H at terH 4); frame 40-43 ms median at the hero zoom, mode-3 entry about 2 s cold and 0.9-1.0 s warm. `tools/ui/test_stage_ui.js` checks the invariance.
  - **The window session** (`winEnter` / `winExit` in `src/ui.js`): entering `dac_stage` from any other state saves the 10 Display keys (`DISPLAY_KEYS`, with their checkboxes) and P.terH / P.subH (with their sliders); EVERY exit restores them first, before the destination is applied and before the reset of S1b. The exits: `applyScenario` (every example, the mode selector through `enterMode`, the prototypes of mode 2, the legacy examples of mode 3, the scenario buttons) and the load of images + manifest (`loadFiles`; `setModeSoft` only runs after it). Pressing `dac_stage` again from inside does not save again; the two legacy examples of mode 3 are not part of the session. `tools/ui/test_window_session_ui.js` (mutations `skipDisplayRestore`, `skipUnitsRestore`, `retakeSnapshot`).
  - **What changes to the eye** (the new baseline of `dac_stage`; every other example is byte-identical): with terH 4 a terrace is 4 tiles high; the default ramp (`rampDepth` 2) rises the jump of its two levels in 2 tiles (the slope grows with terH, see `docs/crystallizers/03-stage/shots/s2a_ramp_*`); the relief of the window is 4.88 H.
- **LIMIT OF THE RAMPS UNDER Cam 6 (S2a finding, for S3; `rampDepth` is NOT touched in S2a):** a ramp that rises toward the camera is only readable while its slope is below tan(pitch). Cam 6 has pitch 25 (tan 25 = 0.466): a surface rising toward the camera with a steeper slope is BACK-FACING and is hidden behind its own upper edge. Measured on the first ramp of the window (room 17; the four ramps of the window all rise toward the camera): terH 1 -> jump 0.56 tiles over `rampDepth` 2 = slope 0.28 (visible, 2 cross lines if `rampLines` is on); terH 2 -> 0.56 (barely visible, 4 lines); terH 4 (2 H terraces) -> jump 2.24, slope 1.12 (hidden, 7 lines); the jump is that of the two levels the ramp joins, not a whole terrace. `rampDepth` goes up to 4 only (slope 0.56 at terH 4), and keeping the terH-1 slope would need depth 8. RULE for S3: a ramp that rises toward the camera reads only if slope < tan(pitch); otherwise steps (`stairStyle` 0: treads of `tread x subH`, up to 6) or a ramp turned sideways. Captures: `shots/s2a_ramp_terH{1,2,4}.png` (Cam 6, same framing), `s2a_ramp_cam3_terH*.png` (Cam 3), `s2a_ramp_terH4_hero_on_ramp.png` (the hero on the ramp at terH 4), `s2a_ramp_report.json`.
- **S3 (transitions of the window; `dac_stage` only, the other examples and modes are byte-identical; `node tools/test_ramp_prefer_fill.js`, `tools/ui/test_stage_s3_ui.js`, `tools/ui/test_window_session_ui.js`).** Decided from the S3 step 0 measurements (a ramp rising toward the camera is back-facing under Cam 6, 100 % of the window's 4 ramps at yaw 0):
  - **Example yaw.** An example may declare `yaw` (degrees, optional, like `display`): the BASE yaw of Cam 6 for that example (`st.stage.yaw`, read by `baseYaw()` in `src/ui.js` only when present; absent = the pack's `stageYaw` or the preset's, as before). `dac_stage` declares 180: the camera looks from the north and its 4 ramps rise AWAY from it. The pack `real_map` is NOT touched (its `stageYaw` would change every example that uses that source at Cam 6). The yaw ends with the window session: `winExit` clears `st.stage.yaw` on EVERY exit (also the load of images, with or without a manifest, which does not go through `applyScenario`), `applyScenario` resets `st.stage` on every example, and the viewer block of a loaded manifest sets `yaw: undefined` (mutations `skipYawRestore`, `skipYawEnd`; a manifest saved inside the window and loaded back opens at yaw 0: there is no `viewer.stage.yaw` yet, the key is left for S5); the Reset button of the Stage block keeps it (it resets the scale, not the camera axis). NO manifest key: the yaw belongs to the example (like the window's `roomSet`), a manifest saved in the window loads without the window, so a key would have nothing to act on. It also drives `P.pocketYaw` (the Pocket is off in a window) and the hero (`E.stage.move`, `clamp`), measured at 180: arrow keys mirrored, the NEAR side of the clamp is the north edge, the screen -> ground inverse exact in front of the camera (the points behind the camera are clamped at 5 % of D: limitation 15.3), a click resolves to the projected tile.
  - **Steps in the window.** The example declares `stairs: { style: 0, tread: 1, preferFill: true }`: `stairStyle 0` (steps) and `tread 1` (A1: the gap between two terraces, 0.56 terH, becomes 3 risers of 0.19 terH with 2 treads of one tile each), applied on entering and restored on EVERY exit by the same window session as the units (`winEnter` / `winExit`, mutation `skipStairsRestore`). A step tile is flat at a level: the hero's feet equal the surface (error 0; on the old ramp it was up to 0.84 H). The modes 2 and 4 and the legacy examples keep the ramp.
  - **`P.rampPreferFill` (optional input of `carveStairs`, R7: absent / false = byte-identical, `tools/test_ramp_prefer_fill.js`).** A transition along the x axis (lateral for a camera at yaw 0 or 180) that fits both CUT into the upper terrace (a trench: the near flank hides it) and FILL built on the lower one takes the fill variant on a TIE of width (never a narrower one). Real map, Balanced types, ramps: lateral cut 14 -> 7, fill 8 -> 15, narrowed 5 -> 5, dropped 0 -> 0, main region +2 tiles; Default preset: cut 40 -> 33, narrowed 30 -> 30, dropped 2 -> 2 ("fill always" would narrow 2 more: mutation `fillAlways`). It uses the x axis, so it is right for a camera at yaw 0 or 180; at yaw 90 / 270 the lateral axis would be y (it would need an axis input). It is in `T.CHAIN_KEY` (it changes the shape). The window has no lateral transition at yaw 180 (its 4 are AWAY), so there it changes nothing today.
  - **What is NOT done.** Transitions that still face the camera are not drawn differently: they stay as data for Unity (D15). `rampDepth` is untouched.
  - **REQUIREMENT FOR S2 (borders).** The border module must compute the normal `nv` (and every "toward the camera" test) against the REAL camera yaw (`view().yaw`, the example's `yaw`), NOT against the +y axis of the map: with `dac_stage` at yaw 180 the camera is at the north, so the footprint edge that faces it is the one with the outward normal toward -y.
- **Not in S1:** the Pocket (a Pocket frames ONE room: `shape.js` only builds it for `spec.rooms.length === 1`; with a multi-room window it is silently off: "Diorama technique (Pocket, M2 height) in mode 3 needs a multi-room Pocket: later PR"), borders, transitions, objects, the landmark, the treatment file, shadows, the live chain, other sources, any export.
- **Test hooks** (`E.stageTest`, undefined in normal use): the six mutations of the acceptance list (pivot on the ground, distance not coupled to heroFrac, hero at a constant screen size, clamp on the far side, a focus that changes the camera when absent, `dac_stage` applying the Stage preset); each fails its named check (`tools/test_stage_cam.js`, `tools/ui/test_stage_ui.js`).

### S2 as built (`src/border.js`; select "Stage border" in mode 3 with a window; `node tools/test_stage_border.js`, `tools/ui/test_stage_border_ui.js`, `tools/ui/test_window_session_ui.js`)
- **What.** The ground OUTSIDE the footprint of the window gets a profile that closes the stage: **ISLA** (a shallow moat of water, -0.7 TH within 6 rings of the border, flagged `water`) and **QUEBRADA** (far side +1.5 TH, camera side -4.5 TH, the camera side is the one the real camera looks from). Visual only: the footprint (the tiles that are not `S.block`) is never touched, walking, regions and routes are computed before it runs, and the outside tiles were already blocked, so no mark is added. Off (the default) never calls the module: identical pixels (`tools/verify.sh regress`).
- **Semantics (a) (user's decision).** Height of an outside tile = the height of the NEAREST footprint tile (the datum, one function `datum` so it can change later) + the profile offset. The offset is in H (independent of `tilesPerH`: tested at 2, 2.5 and 3), floored to a RELATIVE grid of 0.25 TH and ADDED to the datum; the absolute height is not rounded. TH is one constant per profile in the module table: 0.8 H for ISLA and QUEBRADA (a hypothesis, S6 calibrates).
- **Interior.** The footprint is closed first (dilate then erode, Chebyshev K = 4, module constant). The tiles the closure fills that are not footprint (separators between rooms, holes: 136 on `dac_stage`) are interior: no profile, they keep their source height. Only the outer border gets a profile.
- **Camera side.** `nv` = the outward normal of the closed footprint (gradient of the blurred inside mask, radius 3) projected on (sin yaw, cos yaw) of the REAL base yaw (`baseYaw()`: `dac_stage` is 180, so its camera-facing edge is the north one). A change of the camera preset or of `tilesPerH` rebuilds the border (`S.stageBorder.yaw / tilesPerH` against the current ones).
- **State.** `st.stage.border` (`off` | `island` | `quebrada`), default off, UI state like the rest of `st.stage`; it ends with the window session on EVERY exit (`winExit`, `applyScenario`, the viewer block of a loaded manifest, images with or without a manifest). Manifest `viewer.stage.border`, written only when not off. Mutation hooks: `E.modesTest.skipBorderRestore / skipBorderEnd`, `E.borderTest` (`noClosure`, `noGrid`, `tilesNotH`, `ignoreYaw`, `touchFootprint`), each makes a named check fail.
- **Limits (documented).** The west side of `dac_stage` touches the map edge (x = 0, no scenery margin), so it has no border there. ARENA, CIMA, QUEBRADA-half and MIRADOR (the table is extensible) are S2b; full MIRADOR is out of S2. Internal separators get no profile. QUEBRADA / MIRADOR never go to a Hub [U]. New height jumps outside the footprint are not smoothed (pure semantics (a)).
- **Heights below the window floor (QUEBRADA).** The camera-side drop can take outside tiles below the lowest level of the window: on `dac_stage` (tilesPerH 2) the lowest tile is -2.32 tiles (-1.16 H) with QUEBRADA, against 0 with the border off (164 tiles below 0; ISLA stays above: 3.68 tiles minimum, its water is -0.6 H under the datum). Checked: the new levels go below `levelH[0]`, `S.baseH` is `levelH[0] - terH` (relative), the colour of a level comes from its terrace and not from its height, `S.void` comes from the source elevation (not from the level heights), `S.cache` is reset after the insertion, and a grep of `src/` finds no `height < 0` / `Math.max(0, height)` assumption in the renderers (Box, A, B, C), `stage.js`, `contract.js` or the wall pass; the screenshots of the four cameras read well. Nothing was changed for it (measurement and documentation only). One thing to know: `insertLevels` never merges, so two levels can have the SAME height with different meta (water / deco, other terrace); `S.levelH` is non-decreasing, not strictly increasing, with a border on (it already was with Cake and the Pocket).
- **Polish list (not implemented, user's call).** (a) The outer plates of ISLA have straight 45-degree edges: the nearest-boundary sweep is an 8-neighbour one; a Euclidean distance transform would round them. (b) FIXED in polish-1 (see "Bug (b), fixed" below).
- **Bug (b), FIXED in polish-1.** Loading images with a manifest `viewer.mode: "stage"` that turns no rooms on threw "Cannot read properties of undefined (reading '30013')" and left the viewer busy. It was found by the review of PR #58 with a synthetic manifest and reproduced on the tree of #57 (31b2fec = main c705e38), so it predates S2. CAUSE: `stageText()` (`src/ui.js`, the Stage readout, first thing of the info line) prints `room ${S.roomMap[i]}`; `stageOn()` is `modeId === 'stage' && st.stageRooms.length > 0`; `st.stageRooms` and `st.hero` were only reset by `applyScenario`, `loadFiles` never touched them, so after `dac_stage` (6 rooms) the load left `stageOn()` true while the new shape (rooms off) has no `roomMap`: `S.roomMap[i]` threw inside `info()` at the end of `draw()`, before `#busy` was cleared. FIX: the load of images (with or without a manifest) ends the window STATE too, next to the `winExit` that already ran on that path (`st.stageRooms = []`, `st.stageIdx = 0`, `st.hero = null`, `st.focus = null`, `st.stageClamp = null`), and `stageText()` has a cheap guard (`S.roomMap ? S.roomMap[i] : 0`) in case another route leaves that state. Nothing else of the load changed. Tests: `tools/ui/test_window_session_ui.js` (g): images + a manifest `{mode: 'stage', camera: 'stage'}` without rooms from `dac_stage`, and images alone: no page error, `#busy` hidden, `stageOn()` false; mutation `skipStageStateEnd` (`E.modesTest`) makes the check fail.
- **Figures** (measured, headless Chromium software rasteriser, `dac_stage` Cam 6 yaw 180, tilesPerH 2, TH 0.8; report only): levels 18 -> 50 (+32, ISLA: 7840 tiles, 744 water) and 18 -> 80 (+62, QUEBRADA: 9084 tiles); cold (fresh page, select the border, until idle) 1.2 s off, 2.4 s ISLA, 3.0 s QUEBRADA; median full redraw of 7 (Cam 6 / Cam 3) 461 / 468 ms off, 632 / 612 ms ISLA, 686 / 746 ms QUEBRADA; height jumps > 0.5 H between neighbouring outside tiles: 1344 in the source scenery, 751 (690 introduced by the border, max 3.56 H) with ISLA and 809 (756 introduced, max 5.24 H) with QUEBRADA (the border flattens the scenery to the datum, so the net count falls). Shots: `shots/s2_{off,island,quebrada}_{cam6,cam3}.png`. Compared with the step-0 prototype (+32 / +59 levels) QUEBRADA adds 3 more levels because `dac_stage` now carries the S3 steps.

### S4a as built (`src/objects.js`; checkbox "Stage objects" in mode 3 with a window; `node tools/test_objects.js`, `tools/ui/test_stage_objects_ui.js`, `tools/ui/stage_objects_shots.js`)
- **What.** The window example `dac_stage` declares a list of PLACEHOLDER BILLBOARDS (`objects` in `src/modes.js`): `{ kind, x, y, hH }`, x / y in MAP coordinates (the window offset `S.ox / S.oy` is subtracted when drawing), `hH` in hero heights H, the format of the future `billboards` entry of the treatment (S5). Kinds: banner, lamp, shrub, pillar (R4: neutral placeholders; Unity owns the art, collisions, occlusion of the hero, light and textures). Switch `st.stage.objects` ('off' | 'on', default 'off', in the window session of S2a: it ends on EVERY exit; manifest `viewer.stage.objects`, inert at load like `border`). Switching it only REDRAWS: `S` and `S.cache` are the same objects, no height of the terrain changes, `E.shape` is never called for the objects.
- **Height convention (user's decision): the HERO's.** A camera-facing sprite: 1 H = the pixels the hero measures at that depth (`hTiles * cam.sc * k`, `k` = `E.stage.depthScale` of the base point), so an object of `hH` H is `hH` hero heights tall at its own depth; the width (`wH` hero heights), the line width (1.6 px x k) and the font (11 px x k) scale with the same `k`. Measured: near / far = 1.393 / 0.602 of the pivot size (the S1 numbers), 1 H = 135.6 px at the near row and 58.6 px at the far row of the 1220x767 panel. The projection of a segment that is vertical in 3D is about 8 % SHORTER than the hero sprite at pitch 25 degrees (97.3 px against 105.7 px for 1 H); the billboards follow the hero, the volumes of S4b (real geometry) will follow the projection.
- **`h` of the pack is NOT read (correction).** In `data/shrine_pier_x4.json` the landmark `h` (shrine 5.6, pier 1.4) is the TERRAIN elevation of the platform (`tools/derive_shrine_pier_x4.py`: `plaza = b['h'] - sink`), not an object height; no code in `src/` reads it (the contract uses fixed `LAND_H`). The earlier table that said "read `h` from the pack" was wrong. S4 adds no height key to the pack: each object declares its own `hH`.
- **Order and visibility.** The objects and the hero are ONE list sorted by depth (`cam.ry`, larger = nearer): an object nearer than the hero is painted over it, a farther one under it (before S4a the hero was always last; with the objects off nothing changes). An object whose base is not on its own tile in the Box pick render (higher terrain in front, or off the panel) is not drawn, as the contract does (`ownGround`). Tall objects may leave the panel at the top: expected, a cut silhouette (the visible height above the hero's feet is 431 px = 4.4 H at its depth; a 3 H object leaves the panel from about 6 H beyond the hero, a 6 H one is cut even beside the hero). `heroFrac` is unchanged (0.14); nothing requires an object to fit.
- **The declared list of `dac_stage` (9 objects, map coordinates, hero start (61.5, 117.5) in room 17).** Placement rules, checked by `tools/ui/test_stage_objects_ui.js`: walkable tiles, outside the 3 columns of every transition, at least 2 tiles (Chebyshev) from their bottom / top tiles. (1) banner 1 H at (58.5, 117.5): the comparison rule, 3 tiles to the hero's side, same depth and terrace; (2) pillar 3 H at (80.5, 121.5), room 20: fits the panel when the hero is there; (3, 4) lamps 2 H at (59.5, 119.5) and (63.5, 119.5): flank the 3-step transition next to the start, 2 tiles from the middle column of its centre; (5) banner 3 H at (45.5, 132.5), room 5, about 7 H beyond the hero: its top leaves the panel (the cut silhouette); (6) shrub 1.5 H (20.5, 128.5) room 6; (7) lamp 2 H (87.5, 135.5) room 27; (8) shrub 1.5 H (66.5, 117.5) on the other side of the start; (9) pillar 2 H (62.5, 142.5) room 10, far and high. How they were chosen: a scan of the window for tiles that satisfy the rules and whose base is VISIBLE at the hero start (the tile at x 64.5 of the first idea is in a pit hidden behind the rim: the base-visibility rule dropped it, and the tiles at x 62-63 are within 2 tiles of the transition). Only objects whose base is on the panel appear: the others show when the hero walks to their room (Previous / Next room).
- **What is not in S4a.** Rules that DERIVE objects from the rooms (Z / X / Hub, flanks of a transition, the back of a room) need a direction and a role per room (P3) that does not exist in the repo; the volumes (real columns, S4b) and the landmark with a distance-dependent height (S4c); the pack `trees` / `landmarks` of `shrine_pier_x4` stay with the contract (legacy examples untouched). Nothing is exported (D15).
- **Cost** (headless, software rasteriser, `dac_stage` tech B): redraw after a hero move 409 ms with the objects off, 484 ms on (+75 ms); the visibility test is one Box pick render per frame, 72 ms (the same one the contract pays).
- **Shots:** `shots/s4a_start.png` (start, the 1 H reference beside the hero, the cut 3 H banner at the top right), `s4a_transition.png` (the flanking lamps), `s4a_pillar_hero_behind.png` and `s4a_pillar_hero_in_front.png` (the common depth order: the pillar covers the hero standing behind it; the hero is over it when in front).

### S4b as built (`src/volumes.js`; checkbox "Stage volumes" in mode 3 with a window; `node tools/test_volumes.js`, `tools/ui/test_stage_volumes_ui.js`, `tools/ui/stage_volumes_shots.js`)
- **What.** The window example `dac_stage` declares a list of VOLUMES (`volumes` in `src/modes.js`): `{ x, y, w, d, hH }`, a rectangle of tiles in MAP coordinates (x, y = the integer min corner; the window offset is subtracted) with a FLAT roof `hH` hero heights above the nearest walkable ground. Unlike the S4a billboards they are REAL GEOMETRY: the tiles are raised with the mechanism of `src/border.js` (`moves` -> `E.roomTypes.insertLevels`, `S.cache = {}`), so they follow the vertical projection, enter the pick buffer and occlude like terrain. Toggling REBUILDS the shape (`ui.js`: shape -> border -> volumes in the same `try`); off = the module is never called (identical pixels and identical S, checked).
- **Visual only.** The walkable footprint is never touched (hash of the footprint heights equal on / off; mutation `touchFootprint`); walking, regions and routes are computed before. A volume goes only on tiles with `S.block = 1`.
- **Height.** Roof = datum + `floor(hH / 0.25) * 0.25` H x `tilesPerH`, where the datum is the height of the footprint tile nearest (8-neighbour sweep, the same idea as `border.js`; DUPLICATED there as a 10-line sweep, `border.js` untouched) to the CENTRE of the rectangle. Independent of `tilesPerH` (2 / 2.5 / 3 measured; mutation `tilesNotH`). A tile already at or above the roof is not lowered (`higher`).
- **Omitted tiles, with a reason, never an error** (`S.stageVolumes.skipped`): `outside`, `void`, `walkable` (footprint, S.block = 0), `water` (the island moat), `margin` (Chebyshev < 2 from a step column or a bottom / top tile of a transition), `higher`, `overlap` (the first volume keeps the tile). With the border off the `dac_stage` list omits nothing.
- **The margin never bites in `dac_stage`.** The nearest blocked tile to a transition is 3 tiles away ((22, 136), measured), so the limit case "exactly 2 tiles" has no blocked tile to stand on; it is tested in `tools/test_volumes.js` with a fake transition (distance 1 omitted, exactly 2 raised, mutation `noMargin`). A volume on (22, 136) itself breaks the occlusion rule below (it sits in the middle of the walkable area), so the list does not use it.
- **Occlusion criterion (acceptance).** No walkable tile loses more than 25 % of its pixels to a volume at the example's Cam 6 (yaw 180); worst measured 16.9 % (tile (34, 133) seen from hero (24.5, 133.5), the lateral neighbour of volume 4: partial lateral occlusion by perspective). Measured on the pick buffer (Box id render) and attributed to the volume: only the pixels of a walkable tile (>= 200 px visible without volumes) that, with them on, belong to a tile a volume raised (cap or walls) count. The raw count of changed pixels was NOT used: turning volumes on changes `view().zoom` / `fitSc`, which shifts the image < 1 px and moves ~3.2k px per position with no volume tile involved (it looked like antialiasing noise). 21 hero positions (11 chosen + 10 spread evenly over the walkable list), objects on: border off 7460 tiles visible, worst 16.9 %, 21 lose > 2 %, 11 > 5 %, 0 > 25 %; island 7338, 16.9 %, 16 / 9 / 0; quebrada 7467, 16.9 %, 8 / 6 / 0. A control volume 12 tiles in front of the hero fails the check (100 % lost, 184 tiles > 25 %; mutation `hideWalkable`). With the other cameras of mode 3 the volumes CAN hide tiles (11 positions, border off; tiles with > 25 % lost / visible): yaw 0 419 of 3788 (worst 100 %), yaw 90 27 of 4404 (93.4 %), yaw 270 45 of 4482 (99.4 %); measured, not enforced.
- **Known limit: the camera scale changes ~0.1 %.** Turning volumes on moves `view().zoom` 5.9744 -> 5.9810 and `st.fitSc` 8.9867 -> 8.9768; zoom x fitSc = 53.69 (the effective scale and the hero size are equal). Cause: `fitSc = E.fitScale(...)` is the fit of `makeCam` at zoom 1, computed over the heights `[levelH[0] - terH, levelH[maxFine] + 1.5]`, so it depends on the highest level (the volumes raise it 16.88 -> 18) and, with the quebrada, on the lowest (0 -> -2.32: fitSc 8.9660); the island and the objects do not change it. Input for S6 (a pixel pair on / off must account for it).
- **The list (5 volumes, none within 2 tiles of a transition, none hiding a walkable tile).** Chosen by brute-force search with an in-page probe of the invariant: (1) 1 H, 6 x 2 on the far flank (50, 147); (2) 3 H column 2 x 2 on the same flank (85, 147); (3) 2 H wall 6 x 1 along it (66, 147) (the 1 / 2 / 3 H heights side by side; the east flank was tried first: its volumes camouflage against the high rock there, same palette); (4) 1 H, 4 x 2 on the closure-interior tiles between rooms (30, 132: inside the border's closure K = 4, no profile); (5) 2 H, 3 x 3 in the exterior beyond the border (60, 152). A 6th volume at the limit distance is not possible (see above).
- **Border interaction (measured on the example).** Island: 7 tiles omitted as `water` (the 6 of the 2 H wall and 1 of the 3 H column: the moat reaches the far flank next to the footprint), 32 of 39 placed. Quebrada: the whole 1 H far-flank block (12 tiles) is omitted as `higher`, because the far-side rise (+1.2 H, grid-floored) already lifts that ground above its roof; the other four are unchanged (27 of 39 tiles placed). A volume never lowers terrain.
- **What is not in S4b.** Rules that derive volumes from the rooms (need P3), shapes other than flat-roofed rectangles, the landmark (S4c). The front pillars that would cut the frame stay out and the hero occlusion is Unity's.

### S4c as built (`src/objects.js` kind `landmark`; the SAME switch "Stage objects"; `node tools/test_landmark.js`, `tools/ui/test_stage_landmark_ui.js`, `tools/ui/stage_landmark_shots.js`)
- **What.** One entry of the `objects` list of `dac_stage`: `{ kind: 'landmark', x, y, hFar, hNear, dFar, dNear }` (heights and distances in H; the format of the future `billboards` entry of the treatment). A wide neutral tower (R4: the stone palette of the S4a pillar, no colours of its own) drawn with the hero's convention, in the common depth-sorted list, visible only where the Box pick render sees its base (the S4a `ownGround`).
- **Apparent height by distance (variant C of v80).** `h(d) = hFar + (hNear - hFar) * smoothstep(t)`, `t = clamp((dFar - d) / (dFar - dNear), 0, 1)`, `smoothstep(t) = t*t*(3 - 2*t)`; `d` = ground distance in H between the hero's feet and the landmark's base (tiles / `tilesPerH`). HYPOTHESES: hFar 1.5, hNear 3, dFar 8, dNear 2, from v80, where they were measured only in a MOCK, not in the viewer (the table below is the first real measurement). `landmarkH(d, params)` is the pure function (exported for the tests): 8 -> 1.5, 6 -> 1.89, 4 -> 2.61, 2 -> 3.0.
- **Done IN THE DRAWING.** Neither moving the hero nor the switch touches `S`: the same `S` and `S.cache` objects through 22 hero positions between 10 and 1 H and on / off cycles (`S.fine` / `S.levelH` hash equal; mutation `rebuildOnMove` fails the check).
- **Base detail (the "fragment" of v79 / v80).** When `d <= 2 * dNear` (4 H) three placeholders stuck to the base appear: two lamps of 1.2 H at +-0.5 H (perpendicular to the camera) and a 0.6 H sign 0.5 H in front (offsets in H, multiplied by `tilesPerH`: 1 tile at tilesPerH 2). Alpha = smoothstep between 2 * dNear (0) and 1.5 * dNear (1), an alpha under 0.004 counting as 0: absent at 5 H and at 4 H, 0.5 at 3.5 H, full at 3 H and nearer. They are part of the landmark (no list entries); the landmark's base must be visible and EACH piece obeys the rule of S4a for its own base (not on its own tile in the pick buffer = not drawn; `st.detail` keeps `{ kind, visible, drawn }`; mutation `pieceIgnoreHidden`); they are drawn with the hero's convention at the depth of their own feet, and their heights, offsets and thresholds are ONE table of hypotheses (`E.objects.DETAIL`) for S6 to calibrate. NO new volume in S4c: a real pedestal would depend on the volumes switch and on a blocked tile, a complication that does not pay off.
- **Placement in `dac_stage`: (55.5, 135.5), room 5 (the last of the chain).** Room 5 is x 34-56, y 126-137: 160 walkable tiles, 23 x 12. Rules of S4a: walkable, outside the 3 columns of every transition, >= 2 tiles from their bottom / top tiles. The central depth axis (x ~ 45) does NOT work: the room is too shallow (at most ~6 H from the far wall; no hero tile at 8 H or 6 H) and the base is hidden from every 8 H position of every candidate near the axis (measured with the pick buffer over 40 geometrically possible tiles). Six tiles at the east end of the far side see their base from heroes at 8, 6, 4 and 2 H inside the room; (55, 135) is the middle one. Heroes that see it: (42.5, 126.5) at 7.9 H, (47.5, 126.5) at 6.0 H, (50.5, 129.5) at 3.9 H, (51.5, 134.5) at 2.06 H.
- **MEASURED TABLE (Cam 6, yaw 180, `tilesPerH` 2, panel 767 px high, hero 106 px; the hero on the ray from the landmark through (42.5, 126.5), at the exact distance).** The top stays INSIDE the panel at every distance, with a margin smaller than the v80 hypothesis (0.08-0.11) at the near end:

| d (H) | h (H) | px height | px per H | top y (px) | margin of the top (share of the panel height) | top inside |
|---|---|---|---|---|---|---|
| 8 | 1.50 | 123 | 81.9 | 108 | 0.141 | yes |
| 6 | 1.89 | 164 | 87.0 | 98 | 0.128 | yes |
| 4 | 2.61 | 242 | 92.8 | 57 | 0.074 | yes |
| 2 | 3.00 | 298 | 99.5 | 43 | 0.056 | yes |

  (The hero measures 106 px; px per H grows 82 -> 99.5 because the landmark is deeper than the hero at 8 H and the base of the ray comes nearer to the camera with the hero.) The table is for that ray. MINIMUM MARGIN over EVERY walkable tile of room 5 whose landmark base is visible (the hero standing on it, `LM_SCAN_ALL=1 node tools/ui/test_stage_landmark_ui.js`): tilesPerH 2: 114 of 160 tiles, minimum 0.051 at (50.5, 130.5), d 3.54 H; tilesPerH 2.5: 140 of 160, 0.041 at (50.5, 129.5), d 3.12 H; tilesPerH 3: 153 of 160, 0.034 at (44.5, 129.5), d 4.18 H. NO top leaves the panel in any of them (enforced at tilesPerH 2: top >= 0). An apparent height that leaves the panel is expected (a cut silhouette) and is not clipped.
- **Seeing it by eye.** Mode 3, `dac_stage`: tick "Stage objects", press "Next room" five times (the hero goes to the centre of room 5), then CLICK a walkable tile of the room or use the arrow keys (0.25 H per press). The positions above give 8 / 6 / 4 / 2 H. Base detail in the example: from the hero at (50.5, 131.5) (3.2 H) the two lamps are drawn and the sign is NOT: its base, 0.5 H in front of the landmark, is behind the rim of the terrace (tile (55, 134), level 8.88, behind (55, 132), level 9.76); the test checks it. WHAT IS MISSING: a readout of `d` in the info line (today you read the distance off the positions above); not added in S4c.
- **Manifest.** The key `viewer.stage.objects` already exists; the landmark's parameters travel in its entry and `E.checkLandmark` (`src/fields.js`) validates them (numbers > 0, hFar <= hNear, dNear < dFar) in the optional list `viewer.stage.billboards`; inert at load (S5 gives it effect). The viewer does not write that list.
- **What is not in S4c.** A pedestal or any volume at the base; rules that derive the landmark from the rooms (P3: direction and role of a room do not exist in the repo); more than one landmark; the calibration of every hypothesis (S6). Test counts of S4a changed with the new entry: 9 -> 10 declared objects (kinds list), and the placement-rule helper skips the `hH` check for the landmark (it has no `hH`).
- **Shots:** `shots/s4c_d8H.png`, `s4c_d6H.png`, `s4c_d4H.png`, `s4c_d2H.png` (the same shot at four distances), `s4c_base_detail_3H.png` (the detail fully on), `s4c_island_4H.png` (island border on).

## 2. Goal

Phase 3 of the room-type pipeline (crystallizer 2): every room type gets a FRAMING and a DRESSING so the map reads
like a Sea of Stars scene, while it stays walkable. The viewer does not make final art. It outputs an **art-piece
contract**: which piece goes where (kind, tiles, facing, size class, material), drawn as placeholders. Unity
replaces each placeholder with a piece of a kit.

The crystallizer is judged by "does every piece have a clear place, and can we walk the map", not by how pretty the
viewer looks.

## 3. References

Main reference: **Sea of Stars** (Sabotage Studio, 2023). It has the height the other references lack.
- 2D pixel art with dynamic lighting. It is not HD-2D in the Square Enix sense (2D sprites in a 3D world).
  Dynamic lighting was the starting point of development and asset production was made to fit its technical needs
  (interview below): the technique fixed the art contract first.
- Height is drawn in the art (tall camera-facing cliffs) and lived through traversal: jumping, swimming, shimmying
  along ledges, later a grappling hook. Levels are "small pockets"; the design is grid-based.
- Camera: frontal 3/4 view from above, south faces visible (our reading of the game; to confirm on screenshots).
- Sources: [MobileSyrup interview with Thierry Boulanger](https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/),
  [MegaVisions, The Art of Sea of Stars](https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/).

Secondary references (composition): Octopath Traveler and Dragon Quest HD-2D remakes. Scenes are small stages: one main
block (platform, retaining wall, stairs at the front), a dark blurred foreground frame (tree tops, balustrade), a hazy
darker background. Unexplored 2: stage modelling.

Repos reviewed (2026-10-09). None generates stylised cliffs procedurally; they all use hand-made kits.

| Repo | What it brings | Licence |
|---|---|---|
| [floatingsnowflake/Unity-simple-HD2D](https://github.com/floatingsnowflake/Unity-simple-HD2D) | Unity, perspective FOV 45, 90-degree camera turns, occlusion fade of what hides the player, modular block kit per material (fill / edge / outer corner / inner corner) placed with TileWorldCreator (paid) | MIT |
| [Meowa-AI/HD2D-template-meowa](https://github.com/Meowa-AI/HD2D-template-meowa) | Godot: camera FOV 30 at about 20 degrees, DOF far 51/20 near 22/5 amount 0.12, fog with aerial perspective, lilac ambient for shadows, backdrop quad far behind, terrain textured with dual-grid (16-tile) alpha layers per biome | not shown |
| [GSansigolo/SimpleHD2D](https://github.com/GSansigolo/SimpleHD2D) | Godot GridMap of blocks and stairs, camera on a spring arm with 90-degree turns, vignette shader | not shown |
| [EMESTAY/Lib2DHD](https://github.com/EMESTAY/Lib2DHD) | Rust / Macroquad camera framework: HD-2D mode is orthographic, pitch 25, yaw 45; radial blur and vignette; no terrain, no composition | MIT or Apache-2.0 |
| [Smurillopng/TCC-HD2D-Valquiria](https://github.com/Smurillopng/TCC-HD2D-Valquiria) | A full Unity game in the Octopath style; visual reference only | not shown |
| [Maxlm4/Level_Editor-3D_Tilemap_in_Unity](https://github.com/Maxlm4/Level_Editor-3D_Tilemap_in_Unity) | Heightmap to 3D level, texture maps, foliage by colour map; code not published | not shown |
| [puszke/Unity-Sprite-stacking](https://github.com/puszke/Unity-Sprite-stacking) | Sprite stacking (a fake 3D object from ordered 2D slices); the idea is reused for the stacked-slice mocks, no code copied | not shown |

## 4. Decisions

- **D1** (2026-10-09) Sea of Stars is the main reference, because it has height.
- **D2** (2026-10-09) The stage is a phase 3 over the WHOLE room-type pipeline: Cake (created with Sea of Stars in mind),
  Diorama (the ideal case), Ascension (walls can be exaggerated to frame). It works on room instances, which the normal
  map does not have.
- **D3** (2026-10-09) The output is a contract of art pieces, not a pretty render. In exchange the map must be
  traversable (R1).
- **D4** (2026-10-09) The camera makes little difference (low orthographic vs emulated perspective measured in the mocks).
  Stay orthographic; perspective is for Unity. The real limit is the art.
- **D5** (2026-10-09) Every crystallizer gets a README in `docs/crystallizers/`.
- **D6** (2026-10-09, REPLACES D4) The camera is part of each crystallizer, not a global choice. For the Stage it was MEASURED
  (the reviewer's throwaway code, not in the repo; technique A; share of the screen pixels that are walls, at the same px per tile):

  | scene | Oblique 50 ortho | Low 25 ortho | Perspective FOV 30, pitch 25 | Classic 3/4 oblique (ground 1, height 1) |
  |---|---|---|---|---|
  | Shrine-Pier, camera from the sea (yaw 90) | 14.6 % | 24.5 % | 22.0 % | 18.9 % |
  | Shrine-Pier, profile (yaw 0) | 7.5 % | 18.6 % | 17.2 % | 6.4 % |
  | Snake Mountain surface (5 terraces) | 3.8 % | 9.2 % | 7.2 % | 6.3 % |
  | real map, Balanced types, Cake 82 / Diorama 31 / Ascension 57 (Cake + Ascension walls on, 55 px per tile; one value per room) | 4.1 / 1.8 / 2.5 % | 8.7 / 5.7 / 10.1 % | 7.7 / 8.4 / 11.9 % | 6.6 / 2.8 / 3.2 % |

  Configuration notes: perspective = near ground drawn 2.9x bigger than far at that framing. The low camera was measured at pitch 25; Cam 4 of the bank is Low 28 (not re-measured). NOT measured: walkable tiles hidden, painter order under
  perspective, technique B, taller terraces. The Stage camera is **Cam 6** (perspective, FOV 30, pitch 25, yaw 0). Its yaw will come from the main semantic relation of the scene (Shrine-Pier reads OVERLOOKS from the sea: Pier in front,
  Shrine behind); that is the next step, until then Cam 6 is at yaw 0. **Cam 7** (Classic 3/4, oblique projection) is noted as the candidate TACTICAL camera (another mode, not the Stage).
- **D7** (2026-10-09) The cameras are a fixed, DISCRETE bank, Cam 1-7, nothing custom, usable by every crystallizer ([`../README.md`](../README.md) "Camera bank"). The old preset ids keep working (tests and the manifest use them);
  the manifest `viewer` block takes an optional `camera`.
- **D8** (2026-10-09) The fixed test set follows the three core examples: numeric (real map, Default and Balanced types), semantic landmarks (Shrine-Pier) and semantic macroform (Snake Mountain surface). The semantic numeric world is the
  evolution of the vanilla (Perlin) one. The DATA limits verticality as much as the camera: the rooms of the real map have 3-4x less wall per screen than Shrine-Pier with any camera (D6 table).

- **D9** (2026-10-10) The FOOTPRINT is kept. A landmark has four aspects: solid form, footprint, influence and rejection (radii `solid`, `foot`, `infl`, `rej` in the pack). Only the footprint is used now: where a structure is inserted, the same contour, a little bigger than the structure
  and slightly sunken. A footprint bigger than its structure is what gives room for framing. (Rendering decision: D18, a soft darkening, not a sculpted contour.)
- **D10** (2026-10-10) WRAPPER = terminations and boundary: it frames the body and keeps it from spilling. The user's examples: the Greek pillar, the circular platform, the Sea of Stars lookout. Stones stacked behind the edge give thickness (not in the MVP). Where it goes: D19.
- **D11** (2026-10-10) NO MODULE LENGTH: the body is one piece per tile, the wrapper is continuous (cut only at corners and material changes). The kit decides lengths later, in Unity.
- **D12** (2026-10-10; SUPERSEDED by S1 for the hero and, from S4, for objects: heights are declared in H, units section 1) STYLIZED heights (Hades), not 1:1 with any data: trees are billboards of a fixed 2.2 terH; the landmarks are placeholders of a fixed height (Shrine 3.2 terH, Pier 1.0 terH).
- **D13** (2026-10-10) DECOMPRESSION of a compressed example must keep a shape: cubic ground + bodies re-stamped + relations re-applied, never a bigger blocky square. `data/shrine_pier_x4.json` (40x40) is DERIVED data, not the user's spreadsheets
  (`tools/derive_shrine_pier_x4.py`, needs numpy and scipy; checked: it reproduces the committed JSON bit for bit).
- **D14** (2026-10-10) PROPS OCCLUSION: fade. A prop between the camera and the STAKE (the player stand-in) that overlaps it on screen is drawn at 25 % opacity (not hidden, not moved).
- **D15** (2026-10-10) NO EXPORT of anything (no slots file, no manifest field, nothing for Unity) until every crystallizer is done.
- **D16** (2026-10-10; SUPERSEDED for mode 3: the Stage preset of 10 terH is not used by `dac_stage`, whose terH stays 1 until the calibration with paired shots; the rule itself stays in the viewer) EXTREME HEIGHTS: the centre is the terrace with the most tiles on the whole map; the jumps grow gradually and WITHOUT a cap the farther they are from it, on both sides (up and down): jump at distance d (1 = next to the centre) = terH * (1 + (spread - 1) * T(d)),
  T(d) = (d - 1) * d / 2 = 0, 1, 3, 6, 10..., so spread 1.5 gives 1, 1.5, 2.5, 4, 6... (it replaces the capped T of the first version, 1, 1.5, 2.5, 2.5; `tools/test_spread.js` changed its expectation for it). Spread 1 is uniform and changes no pixel.
  The jumps per fixed-set map (spread 1.5, rooms off; j -> j+1 from terrace 0; the cap only mattered where the centre is not in the middle):

  | map | terraces | centre | jumps with the cap (before) | jumps now |
  |---|---|---|---|---|
  | real map | 5 | 2 | 1.5 1 1 1.5 | 1.5 1 1 1.5 (same) |
  | real map | 7 | 4 | 2.5 2.5 1.5 1 1 1.5 | **4** 2.5 1.5 1 1 1.5 |
  | Shrine-Pier 10x10 | 5 | 1 | 1 1 1.5 2.5 | 1 1 1.5 2.5 (same) |
  | Shrine-Pier 10x10 | 7 | 2 | 1.5 1 1 1.5 2.5 2.5 | 1.5 1 1 1.5 2.5 **4** |
  | Shrine-Pier x4 | 5 | 1 | 1 1 1.5 2.5 | 1 1 1.5 2.5 (same) |
  | Shrine-Pier x4 | 7 | 1 | 1 1 1.5 2.5 2.5 2.5 | 1 1 1.5 2.5 **4 6** |
  | Snake Mountain surface | 5 | 0 | 1 1.5 2.5 2.5 | 1 1.5 2.5 **4** |
  | Snake Mountain surface | 7 | 0 | 1 1.5 2.5 2.5 2.5 2.5 | 1 1.5 2.5 **4 6 8.5** (23.5 terH of height instead of 11) |

  The ramp length limit of the first spread text no longer exists in the code: the ramp depth is fixed (`rampDepth`, 2 tiles) whatever the jump and there is no maximum slope (`tools/test_spread.js`: ramps 2 deep, spread 3 jump 7), so the ramps still fit trivially; the slope is jump / 2 (4.25 per tile at 8.5).
  What does grow with uncapped jumps: the `steps` style (option) bridge levels per jump (measured on the Snake surface at 7 terraces, spread 1.5: 24 levels and 14 stairs against 26 levels and 22 stairs at spread 1) and the height range (camera fit boxes).

  The same maps in BOTH modes (spread 1.5, rooms off; `'middle'` = D17; total = the height of the whole stack in terH):

  | map | terraces | `largest`: centre, jumps | total | `middle`: centre, jumps | total |
  |---|---|---|---|---|---|
  | real map | 5 | 2: 1.5 1 1 1.5 | 5.0 | 2: 1.5 1 1 1.5 | 5.0 |
  | real map | 7 | 4: 4 2.5 1.5 1 1 1.5 | 11.5 | 3: 2.5 1.5 1 1 1.5 2.5 | 10.0 |
  | Shrine-Pier 10x10 | 5 | 1: 1 1 1.5 2.5 | 6.0 | 2: 1.5 1 1 1.5 | 5.0 |
  | Shrine-Pier 10x10 | 7 | 2: 1.5 1 1 1.5 2.5 4 | 11.5 | 3: 2.5 1.5 1 1 1.5 2.5 | 10.0 |
  | Shrine-Pier x4 | 5 | 1: 1 1 1.5 2.5 | 6.0 | 2: 1.5 1 1 1.5 | 5.0 |
  | Shrine-Pier x4 | 7 | 1: 1 1 1.5 2.5 4 6 | 16.0 | 3: 2.5 1.5 1 1 1.5 2.5 | 10.0 |
  | Snake surface | 5 | 0: 1 1.5 2.5 4 | 9.0 | 2: 1.5 1 1 1.5 | 5.0 |
  | Snake surface | 7 | 0: 1 1.5 2.5 4 6 8.5 | 23.5 | 3: 2.5 1.5 1 1 1.5 2.5 | 10.0 |

  With `'middle'` the jumps depend only on the number of terraces, not on the map.
- **D17** (2026-10-10, user's correction of D16) CENTRE OF THE SPREAD ON A STAGE = the MIDDLE terrace. `P.spreadCentre`: `'largest'` (default, the rule of D16: the terrace with the most tiles on the whole map, no pixel change) or `'middle'` (terrace `floor((terraces - 1) / 2)`).
  Reason (user): on a stage the largest terrace is always the base, so the heights would grow from the floor; the middle terrace as the centre makes the jumps grow symmetrically toward both ends. The Stage preset sets `'middle'`; the rule of D16 (T(d), no cap, both sides) is unchanged. The tables are below D16 (both modes).
- **D18** (2026-10-10, user's correction of the MVP) FOOTPRINT = a SOFT, TERRAIN-AWARE DARKENING: no geometry change, no sculpting. A smooth radial shade (about 0.4 opacity at the centre, 0 at the radius `foot`) on the caps of the tiles of the landmark's OWN terrace only, so it never crosses a cliff,
  a ramp or the sea; one clip path for the union of the tiles, so no tile seams. Trees get the same shade, small, at their base. The dashed outline of the first MVP is removed. NOTED FOR LATER: a SCULPTED footprint (a platform carved into the terrain) is for sculpted fantasy landscapes, such as a castle in a mountain wall; it is not this stage.
- **D19** (2026-10-10, user's correction of the MVP; refines D10) WRAPPER = FRAMING ONLY AT SILHOUETTES AND MATERIAL TRANSITIONS, in ALL four directions (not only the camera-facing faces): a cap edge with a drop of 1.5 terH or more to a lower terrace, at void or the map border, or meeting water (shore).
  Nothing on smaller internal steps. Drawn as a row of neutral dark framing stones (placeholder) on the cap edge, slightly inside, following the technique's contour in A / B and the tile edges in Box; visible parts only. The band on every terrace edge (coloured top rim, base strip, corner posts) of the first MVP was an extra and is removed.

## 5. Design (draft, to be agreed point by point)

### Requirements
- **R1 Traversal.** The map can be walked in the viewer at play scale: a walker moves over the walkable graph (the same
  edges as `E.route`), the camera follows it with the stage preset. No piece blocks a walkable tile, a ramp or a door;
  on walkable tiles only floor-level pieces (paving, grass, rugs).
- **R2** Same pieces and placeholders in Box, A, B and C (`render.js` draws the contract for every technique; measured on the C panel).
- **R3** Switch off = identical pixels (pixel regression).
- **R4** Height exaggeration is visual only (a stage height multiplier); walking, stake and route do not change.

### Camera
- Cam 6 "Stage" of the camera bank (D6, D7): PERSPECTIVE, FOV 30, pitch 25, yaw 0 (the yaw will come from the semantic relation of the scene); true division by depth around the ground point under the screen centre at the focus height. Replaces the "Stage 3/4" orthographic preset of the first draft.

### Rules per type
- **Cake.** Rings are ledges. Each camera-facing ring edge gets a cliff piece sized by its jump; the top edge gets a lip
  piece by material. Ramps and corridors become climb points or stairs (the mapping is open, Q4).
- **Diorama.** The pocket becomes a composed stage: backdrop band behind (by distance, darker and hazier), the fragment
  sharp, foreground frame pieces on the near edge of the disc (tree, rock, column), a stairs slot at the main exit,
  retaining-wall pieces on the fragment edge.
- **Ascension.** Walls become the frame: tall on the faces away from the camera, low with the existing Zelda cut on the
  faces toward it. Wall pieces by chain position: straight, outer corner, inner corner, end. A door slot on every
  transition.

### Thickness rules (from the mocks)
Nothing has a constant thickness; every piece takes it from a local measure the data already has:
- cliff: base flare, strata count and edge wobble grow with the jump;
- land over void: an underbelly that tapers with the distance to the edge;
- lip: by the material of the top (grass hangs over, rock does not);
- bridges are OBJECTS (deck, piers by span), not terrain: the stacked-slice bridge did not read.

### The contract (draft list of piece kinds)
- Terrain edges: cliff (jump class low / mid / high), retaining wall (masonry), lip (grass / rock / sand / snow),
  underbelly (void), each with outer and inner corner variants (16-tile dual-grid style, as in the references).
- Transitions: ramp, stairs, climb point, ledge drop, door.
- Framing: foreground frame piece, backdrop band, wall-chain piece (Ascension).
- Props: vegetation clump, rock, light source (torch, brazier). Floor-level only on walkable tiles.
- Every slot: kind, tile(s), facing (N / E / S / W or corner), size class, material, room id, room type.

### Vocabulary (user's)
- **cap** = the top surface; **body** = the mass with its base texture; **wrapper** = terminations and boundary (it frames the body and keeps it from spilling); **footprint** = where a structure is inserted (D18: rendered as a soft shade).

### MVP: switch "Art contract" (implemented, `src/contract.js`; off by default, off = identical pixels; Box, A, B and C)
Placeholders drawn on top of the scene, only where the piece is visible, with a count per kind in the info line. Nothing is exported (D15).
- **Visibility**: one Box pick render per frame with the switch on. Every column paints its walls with its tile code and its cap with the tile cap code; a body face is visible if >= half of its sample points (three, at mid height) hit its OWN tile code, a prop, a shade tile (>= 3 of 5 points) or a stone if the cap
  (or ramp) code of the tile under it is there. The same id render serves the three techniques (A and B have no per-face id), so in A and B the placeholders sit on the tile geometry and differ slightly from the smoothed walls.
- **Body**: one per terrace face of a tile (a tile above a lower neighbour of another terrace; sub-terrace steps and ramps are not bodies), classed by its jump in terH units: low < 1.2, mid < 2.2, high; "masonry" inside a landmark footprint; "edge" at the map border or against void.
- **Wrapper** (D19): framing stones only where the cap would touch the background or a different material, on the cap edge in all four directions: drop >= 1.5 terH, void / map border, shore. A row of neutral dark stones (placeholder, two per tile edge, slightly inside). Box: the tile edges. A and B: the points are snapped to the
  technique's own loops of the level of the upper tile; a point that cannot be snapped within 0.75 tile keeps its tile-edge position (fallback for messy corners). A stone is drawn if its point hits the cap of a tile of the same level in the id render. Counts in the info: wrapper drop / border / shore (stones drawn). The body tint is lighter so the stones read.
- **Footprint** (D18): the soft shade of each landmark of the pack (count = landmarks shaded); trees get a small one at their base.
- **Props**: the pack's `trees` as billboards of a fixed 2.2 terH and the landmarks (Shrine, Pier) as billboards on their solid; faded at 25 % when they stand between the camera and the stake and overlap it on screen (D14).
- Out of scope (later): stones stacked behind the rim, inner corners, doors, lights, floor dressing, any export.

## 6. Viewer vs Unity

- Viewer: computes the slots, draws placeholders (flat colour, outline, a letter per kind), the walk mode, and the
  composition as layers (darker, hazier backdrop; foreground frame). Exports the slots (format open, Q3).
- Unity: a kit piece per slot (modular prefabs or RuleTiles, dual-grid textures), dynamic lighting (half of the Sea of
  Stars look), DOF, character sprites.

## 7. Verification

What exists for the Stage: the camera bank (D7) and the Art contract MVP (`node tools/test_contract.js`, `tools/ui/test_contract_ui.js`; screenshots with `tools/verify.sh shots --extra x4stage --extra diorama31stage`): Cam 6 and Cam 7 are implemented and measured (z-buffer order, picking, face culling, perspective strength: CLAUDE.md limitation 15; `node tools/test_cams.js`; screenshots with `tools/verify.sh shots --extra pocket:31@stage+play --extra shrine@classic+play`). Fixed test set = the three core examples (D8): real map Default and Balanced types, Shrine-Pier, Snake Mountain surface.

## 8. Mocks (2026-10-09, throwaway, scripts outside the repo)

1. Post-process look over the A render (texture, cast shadow, rim light, tilt-shift, vignette). Dropped: it is the old
   builder with taller walls; no post-processing (user).
2. Terrace height at the slider maximum (2.5), A and B. Still "a map with some depth", not relief.
3. Stacked slices (sprite-stacking idea applied to terrace contours) with a profile (flared base, recessed body,
   overhanging lip). Real relief, but it reads as "polygon terraces".
4. Thickness rules on a synthetic two-island scene: cliff by jump, underbelly by depth from the edge and lip by material
   read well; the bridge failed (see section 5).
5. Composed stage on a synthetic Diorama-like fragment: backdrop hills, sharp platform with masonry and moss, dark blurred
   foreground conifers. Low orthographic camera vs emulated perspective: almost no difference (D4). The closest so far.
   The real Diorama pocket seen from a low camera does not work (it was designed for Iso).

### C1 as built: orientation by room (`src/orient.js`; switch "Orientation by room" and select "Framing" in mode 3 with a window; `node tools/test_orient.js`, `tools/ui/test_stage_orient_ui.js`, `tools/ui/c1_shots.js`)
First of three PRs of the CORE of the "mock T" plan (C1 orientation, C2 rule of planes, C3 frame and goal); the details go to a polish pass. Feature 1 of the mock: the camera looks along the axis of the room.
- **Direction per room (P3), from the geometry of the window and the order of its list, NOT from the DAC type.** (1) AXIS of the walk = from the entry gate (the previous room of the list) to the exit gate (the next room); a gate = the centroid of the walking edges between two consecutive rooms (the same walking graph as the rooms layer). In the first / last room: from the gate toward the HIGHEST part of the room (the centroid of the tiles above the 75th height percentile); with no gate (a window of one room): from the LOWEST part (below the 25th percentile) to the highest. (2) LENGTH along the axis / WIDTH across it (the extent of the walkable tiles on each): ratio >= 1.5 -> **Z**, <= 1 / 1.5 -> **X**, in between -> **Hub**. `E.orient.RATIO = 1.5` is a HYPOTHESIS, one constant (as are `BLOCK_W`, `BAND`, the percentiles). (3) YAW in multiples of 90 degrees (the camera of Cam 6 sits at (sin yaw, cos yaw) in map x / y, as in `border.js`): Z and Hub = the camera looks ALONG the axis, the exit (or the high part) at the BACK; X = the camera looks ACROSS the axis, the side with the higher mean height (plus 0.5 x the share of blocked tiles in an 8-tile band behind the room) at the back.
- **The table (real map, the P of `dac_stage`: Balanced types, terraces 5; `tools/test_orient.js` keeps it stable).**

| room | direction | length / width | ratio | yaw | axis from |
|---|---|---|---|---|---|
| 17 (first) | Hub | 25.5 / 21.3 | 1.20 | 0 | exit gate -> highest part |
| 10 | Hub | 16.2 / 17.6 | 0.92 | 270 | entry gate -> exit gate |
| 20 | Hub | 30.4 / 31.5 | 0.97 | 270 | entry gate -> exit gate |
| 27 | Hub | 30.6 / 25.4 | 1.21 | 180 | entry gate -> highest part |
| 6 | Z | 63.1 / 34.6 | 1.83 | 90 | exit gate -> highest part (no gate with 27 in the walking graph) |
| 5 (last) | X | 14.3 / 22.8 | 0.63 | 90 | entry gate -> highest part |
| 14 (window of one room) | Z | 39.4 / 18.8 | 2.09 | 180 | lowest -> highest part |
| 44 (window of one room) | Hub | 96.4 / 70.3 | 1.37 | 90 | lowest -> highest part |

  Four of the six rooms of `dac_stage` are Hub (ratios 0.92-1.21: nearly square rooms), one Z, one X: the three directions occur, the table is not degenerate.
- **The yaw of the room of the hero** is the camera yaw (a CUT when the hero crosses to another room, also with Previous / Next room; the smooth transition is for polish). Everything that depends on the yaw (the border) is rebuilt by the guard that already exists for a yaw change (1-2 s headless). The table is computed lazily from `S` and dropped with it (nothing in `S` changes). Switch off (or a legacy example) = the example yaw, as before.
- **Framing (select "Framing": Hero / Room).** Hero = the follow camera of S1 (default; `heroFrac` 0.14, 53.69 px per tile at tilesPerH 2: unchanged). Room = the same Cam 6 (pitch, FOV) centred on the room's box at its mean height, with the largest zoom at which the 8 corners of the box (at its lowest and highest tile) fit the panel with a 6 % margin (`FRAME_MARGIN`); the hero stays drawn. Measured: the 8 rooms fit (the tests).
- **Technique.** The default of mode 3 is now Box (`techs` = Box, B). The window examples declare `tech: 'box'`; the legacy examples (`x4_stage`, `diorama31_stage`) declare `tech: 'B'`, so they do not change (the table of `src/modes.js` accepts a technique per example through `sc.tech`).
- **New examples:** `mockt_z14` and `mockt_x44` (a window of ONE room, no declared volumes or objects). Shots in `shots/c1/`.
- **Manifest:** `viewer.stage.orient` ("on" written only when on) and `viewer.stage.frame` ("room" written only then), validated in `fields.js`, inert at load (the window session ends).
- **Test-only flag** `window.EVO_NO_ORIENT` (set by `tools/ui/common.js`, like `EVO_NO_MODES`; `open({ orient: true })` is the real behaviour): the window examples start with the orientation off, so the stage tests written for the example yaw (180) and the hero framing run unchanged.

#### Para polish (found in C1, not fixed here)
- **The declared lists of `dac_stage` (S4a objects, S4b volumes, S4c landmark) were MEASURED at yaw 180** (occlusion, visibility of the landmark base, the placement of the volumes). With the orientation on, rooms 6 and 5 (yaw 90), 10 and 20 (270) and 17 (0) see them from another side: those invariants hold only at yaw 180.
- `P.rampPreferFill` / the S3 choice (the ramps rise AWAY from the camera at yaw 180) is a carving decision that does not follow the yaw per room.
- The yaw change is a CUT; a smooth rotation between rooms is polish. Crossing rooms with the border on rebuilds the shape each time (1-2 s).
- Room 44 (Hub, yaw 90): the rule puts the void side behind it (the axis lowest -> highest part points west); for a window of one room there is no gate to orient by, and a wide room is ambiguous.
- Room 6 has no walking edge with 27 in the window (no entry gate), so it is oriented as a first room.
- The X rule uses a blocked-tile band behind the room; at the edge of the map (room 44 at y = 0) there is no band.
- The hero's room is read from the tile under the hero: on a ramp tile or a nowalk tile the yaw keeps the last room's.

### C2 as built: planes by room (`src/planes.js`; switch "Planes by room" in mode 3 with a window; `node tools/test_planes.js`, `tools/ui/test_stage_planes_ui.js`, `tools/ui/c2_shots.js`)
Second of three PRs of the CORE of the "mock T" plan: features 2 (planes), 3 (closing wall) and 4 (frame: the columns). The rule is applied for the CURRENT room (the hero's) with the yaw of C1.
- **Classification per column** (the columns are perpendicular to the view axis; the view frame is turned to the camera of the room): for the tiles OUTSIDE the room's footprint, inside `S` and inside a ring of `R` tiles around the footprint, that are NOT walkable (any room) and not void: **BACK** = beyond the far end of the room in that column, **FRONT** = before the near end, **SIDE** = in a column the room does not cover (or between its near and far ends). A tile in two classes: BACK > SIDE > FRONT (the per-column rule gives one). Walkable tiles are never classified.
- **What is done** (the mechanism of S2 / S4b: `E.roomTypes.insertLevels`; lowering is also a `moves` entry, so there is NO new mechanism in the shared code): BACK -> the closing WALL = the first `wallDepth` tiles of the back band raised to the highest walkable ground of the room + `wallH` H; SIDE -> 1 x 1 COLUMNS of `colH` H over the local ground of the room's edge, one every `colEvery` rows along the axis, on the first non-walkable tile beside the room on each side (over void: none, counted in `skipped.void`); FRONT -> the tiles of the first `frontDepth` tiles of the front band that are above the lowest walkable ground of the room are lowered to that ground - `frontDrop` H. The walkable footprint never changes height (tested on the 8 rooms).
- **ONE table of hypotheses (`E.planes.HYP`, for S6):** R 8 tiles, wallDepth 2 tiles, wallH 3 H, colH 3 H, colEvery 3 rows, frontDepth 4 tiles, frontDrop 0.5 H (the H are multiplied by `tilesPerH`).
- **Table (real map, the P of `dac_stage`, every room with its C1 yaw; `tools/test_planes.js` keeps it stable).** Classes = tiles classified in the ring; effects = tiles actually changed:

| room | yaw | BACK | SIDE | FRONT | wall | columns | front lowered |
|---|---|---|---|---|---|---|---|
| 17 | 0 | 178 | 145 | 55 | 44 | 7 | 27 |
| 10 | 270 | 28 | 148 | 122 | 11 | 9 | 56 |
| 20 | 270 | 224 | 156 | 162 | 53 | 10 | 64 |
| 27 | 180 | 374 | 153 | 300 | 94 | 4 | 69 |
| 6 | 90 | 365 | 313 | 396 | 91 | 22 | 127 |
| 5 | 90 | 160 | 205 | 41 | 60 | 13 | 27 |
| 14 | 180 | 265 | 444 | 231 | 66 | 22 | 70 |
| 44 | 90 | 530 | 844 | 516 | 123 | 43 | 111 |

  Room 14 (Z, yaw 180): a wall behind 22 of its 24 columns, BACK to the south (the high terrace), FRONT to the north, SIDE on the east (the west is void). `shots/c2/mockt_z14_clases.png` shows it from above.
- **Switch "Planes by room"** (`st.stage.planes`, manifest `viewer.stage.planes` written only when on, inert at load): ON in `dac_stage` and in the two one-room examples, off elsewhere; toggling REBUILDS the shape (the planes are terrain), also when the hero crosses to another room or the yaw changes (a cut: 0.9 s headless at 17 -> 20). It combines with the island / quebrada border (default off). The declared lists of `dac_stage` (volumes, objects, landmark) are NOT switched on by the planes; they were measured at yaw 180 (see C1).
- **Test-only flag** `window.EVO_NO_ORIENT` also starts the examples with the planes off (the old stage tests measure `S`).

**P1 update (void in the planes, Euclidean ring and wall; the table above is the P1 one, the C2 values were 17: 189/215/74/42/7/27, 10: 32/240/134/10/9/56, 20: 290/276/191/44/10/64, 27: 437/247/351/84/4/69, 6: 119/312/508/17/13/127, 5: 191/261/42/30/13/27, 14: 315/366/300/44/11/70, 44: 0/230/718/0/9/111):** VOID tiles of the BACK and SIDE classes are classified like blocked ground and take the wall / the columns (the void tile becomes a drawn, blocked, NOT walkable tile of that height: `S.void` / `S.block` are copied first, the same care as `src/backdrop.js`; the render of void is untouched); VOID in FRONT is left as it is (it reads as a drop). The ring (`R`) and the wall depth use the EUCLIDEAN distance to the footprint (the wall = the BACK tiles within `wallDepth` of it), so a diagonal room (14) has a wall that follows its edge. Room 44: wall 0 -> 123 tiles (157 former-void tiles in room 44's wall and columns), columns 9 -> 43; room 14: columns 11 -> 22. Hooks `noVoidWall` and `chebyshev` (the C2 rule). Items 1, 2 and 4 of the list below are fixed.

#### Para polish (found in C2, not fixed here)
- **Room 44 has no wall:** with the yaw of C1 (90) the back of the room is void and the rule only classifies tiles that are not void; the closing wall needs the orientation rule to put solid ground behind, or a void-aware wall.
- **Columns over void are not placed** (14 of room 6, 12 of room 14, 48 of room 44); the west side of room 14 is void along its whole length, so it has columns only on the east.
- The wall is FLAT at the highest ground of the room + 3 H; with a high terrace far from the wall the wall reads low, and it ignores the terrain of other rooms behind it (walkable tiles of other rooms are never touched, so a wall can be interrupted by them).
- The new levels use the Pocket decoration palette (dark, desaturated): not tuned.
- The columns take the height of the local edge of the room; on a steep edge they look irregular.
- The FRONT lowering exposes walls of the neighbouring blocked terrain; the amount (0.5 H below the lowest ground) is a hypothesis.
- A crossing between rooms rebuilds the shape each time (a cut); caching one shape per room would remove the wait.
- The classification ring (R 8) and the bands are Chebyshev squares around the footprint; a diagonal room (14) gets a stepped wall.

### C3 as built: props by room (`src/props.js`; switch "Props by room" in mode 3 with a window; `node tools/test_props.js`, `tools/ui/test_stage_props_ui.js`, `tools/ui/c3_shots.js`)
Third PR of the CORE of the "mock T" plan: features 4 (torches along the axis) and 5 (the goal at the back). BILLBOARDS ONLY (the objects of S4a / S4c): the shape `S` is never rebuilt for them, no terrain height changes. Generated for the current room (the hero's) with the yaw of C1, redone when the hero crosses.
- **Path:** the walkable route (BFS over the room's tiles of the walking graph, in the largest connected piece of the room) from a START to an END. Room with an entry AND an exit gate: from the room tile nearest the entry gate to the one nearest the exit gate. First / last room and a window of one room: from the end nearest the camera (smallest view depth, nearest the middle across) to the goal tile.
- **Torches:** `lamp` 1.2 H, a pair on both sides of the path, `torchSide` H from its axis along the normal of the local tangent, one pair every `torchEvery` path steps (the first and last 2 steps are skipped). Only on walkable tiles of the room, never on a step / ramp / gate tile nor within 1 tile of them; one without a visible base is not drawn (the S4a rule).
- **Goal:** the last room of the window and a window of one room: a `landmark` (S4c, default parameters) on the highest terrace of the BACK half of the room (the half with the larger view depth), at the tile of that terrace nearest the column of the path's start; S4c rules (not on a transition, >= 2 tiles from its bottom / top; if no tile fits, >= 1 is taken, and if none, the farthest reachable tile). **Door pillars:** every room with an exit gate to the next room of the list gets 2 `pillar` of 2 H at both sides of that gate (`gateSide` tiles beyond its extent across the view); a side whose tile is not walkable and free in the room is omitted.
- **ONE table of hypotheses (`E.props.HYP`, for S6):** torchSide 1 H, torchEvery 4 tiles, torchH 1.2 H, gatePillarH 2 H, gateSide 2 tiles.
- **Table (real map, the P of `dac_stage`; `tools/test_props.js` keeps it stable):**

| room | yaw | path steps | torches | pillars | goal |
|---|---|---|---|---|---|
| 17 | 0 | 29 | 5 | 1 | - |
| 10 | 270 | 1 | 0 | 1 | - |
| 20 | 270 | 22 | 3 | 1 | - |
| 27 | 180 | 36 | 10 | 0 | - |
| 6 | 90 | 95 | 17 | 1 | - |
| 5 | 90 | 28 | 8 | 0 | yes (back half, terrace 2) |
| 14 | 180 | 57 | 15 | 0 | yes (back half, terrace 3) |
| 44 | 90 | 93 | 27 | 0 | yes (back half, terrace 4) |

- **Switch "Props by room"** (`st.stage.props`, manifest `viewer.stage.props` written only when on, inert at load): ON in `dac_stage` and in the two one-room examples; independent of the "Stage objects" switch (the hand-declared lists of `dac_stage` stay off by default and, when on, are drawn together with the props in one depth order). The test-only flag `window.EVO_NO_ORIENT` also starts the examples with the props off.

**P1 update (centred path, spacing by rows, goal clearance):** the path follows the CENTRE LINE of the room along the view axis (the middle of the walkable width of each row, averaged over +-1 row, snapped to the nearest walkable tile; the consecutive centres joined by the shortest walkable route; a centre that needs a detour (another terrace reached by a ramp elsewhere) is skipped); room 14: the path is within 1 tile of the centre line in 34 of its 37 rows (92 %), the C3 route in 14 (38 %; hook `shortestPath`). The torch pairs are every `torchEvery` ROWS of view depth along the path (not every N steps: the path steps are longer than the rows it crosses), and none is closer than `goalClear` (2) tiles to the base of the goal (room 5: no torch on the landmark). The table above is the P1 one (C3 values: path steps / torches 17: 21/7, 20: 8/1, 27: 24/9, 6: 67/23, 5: 24/7, 14: 41/13, 44: 61/26). Items 3 (the path) of the list below is fixed.

#### Para polish (found in C3, not fixed here)
- Rooms 10 and 20 are tiny: the entry and exit gates leave a 1-8 step path and 0-1 torches.
- Room 27 has no walking edge to room 6, so it has no exit gate and no door pillars; room 6 has no entry gate (its path starts at the near end).
- The path is a plain shortest BFS path (it jogs along terrace edges); a smoothed centre line would place the torches more evenly. A torch whose side tile is not walkable or is next to a transition is omitted (a pair may be a single torch).
- A pillar side that falls outside the room (a gate at the room's edge) is omitted: rooms 17, 10, 20 and 6 get 1 pillar instead of 2.
- The landmark's base detail (S4c) and the torches are separate lists with their own visibility; they may overlap near the goal.
- The goal height is the S4c smoothstep of the hero's distance; in room framing (no hero walking) it keeps the distance of the hero's standing tile.

### M2 as built (M2a + M2b): the mode 3 rules on the ZONES of a PNG (`src/stage.js` `zoneMap` / `zoneTable` / `buildZones`, example "Your images (PNG + roles)" of mode 3; `node tools/test_stage_zones.js`, `tools/ui/test_stage_zones_ui.js`, `tools/ui/m2_hashes.js`, `tools/ui/m2_shots.js`; step M2 of `MVP.md`)
Sources of the rules: DAC (unchanged) and PNG + roles (new).
- **M2a, one accessor.** `E.stage.zoneMap(S)` = `S.stageZones || S.roomMap` is the ONE place where the rules read the zones: `orient.js` (tiles per zone, gates), `planes.js` (footprint), `props.js` (tiles of the zone, gates), `stage.js` `roomCentre`, `ui.js` `orientRoom` and the readout. No behaviour change: the canvas (and the text of the info line without its timings) hash the same before and after in 21 states (`tools/ui/m2_hashes.js`: `dac_stage` room by room, three hero positions, the mode 3 switches on and off, objects and volumes on, `mockt_z14`, `mockt_x44`, `x4_stage`, `diorama31_stage`, modes 1 and 2).
- **M2b, the zones of the image.** The example "Your images" of mode 3 is a window example (clean view, units in H, orientation, planes and props on). After a load (or a change of roles) the window session is entered again; modes 1, 2 and 4 load as before. The levels come from the role `elevation` (the usual quantization), the zones from the role `zone` with the ids of the slice (`E.fillUnassigned`).
  - **Table raw id -> 1..N and ORDER [R, a HYPOTHESIS to calibrate with the paired shot]:** BFS over the adjacency of the zones (4-neighbour tiles with different ids) from the zone of the LOWEST mean elevation (ties: the lowest id), the neighbours of a zone in ascending id; a zone the BFS does not reach starts the next one. The id in the window is the place in that order (0 = none), never the raw id of the image.
  - **Default window:** the lowest zone, alone (the selector of any room or zone is M2c; `window.__evo.stageSetWindow([k, ...])` is what it will call and what the tests call today).
  - **Footprint:** only the LARGEST connected piece (walking graph) of a zone of the window; the walkable tiles of its other pieces get zone 0 and are counted (`S.stageZonesInfo`, in the readout: "PNG zones: N, window zone ..., K walkable tiles dropped"). DAC rooms are not touched.
- **Fixture** (`tools/ui/gen_maps.py`, set `maps_stage`, generated, never committed; deterministic, ours): a 96 x 96 image with a strip of THREE zones in a chain (32 x 20 tiles each: Z rooms), 5 terraces (A 2, B 3, C 2), a pond of void in B, an island of 25 walkable tiles in C. Zone order 1, 2, 3 (mean elevation 238, 491, 766). Dropped tiles: 25 (zone 3: the island), 0 in zones 1 and 2. Table (`tools/test_stage_zones.js`):

| zone | direction, yaw | planes: wall / columns / front / void tiles (window of the zone) | props, window [1, 2, 3]: path / torches / pillars / goal |
|---|---|---|---|
| 1 | Z, 270 | 40 / 23 / 0 / 23 | 33 / 7 / 0 / none |
| 2 | Z, 270 | 40 / 24 / 8 / 24 | 60 / 10 / 0 / none |
| 3 | Z, 270 | 0 / 23 / 0 / 23 | 56 / 13 / 0 / goal |

  Captures: `shots/m2/` (zones 1-3 in room and hero framing, the chain, and the top view of the zone map with the dropped island).

#### Para polish (found in M2, not fixed here)
- An interior hole of void (the pond of zone B) is classified SIDE, so it gets the P1 columns: a tall cluster in the middle of the room (`shots/m2/zona2_encuadre_sala_Box.png`). A DAC room has no such hole; for a PNG the rule could skip void tiles that are not on the outer edge of the footprint.
- The gate between two zones of the fixture spans the whole 20-tile strip, so no door pillar fits (0 pillars); the pillars need a gate narrower than the room.
- The default window is one zone: a chain [1, 2, 3] gives entry / exit gates but the order is the BFS one, not a route chosen by the user (the selector, M2c).
- A PNG without the role `zone` shows "assign the zone role" and enters no window.
- The hero cannot stand on a dropped piece (it is zone 0); `orientRoom` keeps the previous zone while the hero is on one.

### M3a as built: Forest, the old map of the game with the zones of v53 (examples "Forest A (v53)" and "Forest B (amplified relief)" of mode 3; `docs/crystallizers/03-stage/refs/dq3/forest_plains/annotated/` (`derive_roles.py`, README there), `node tools/test_forest_roles.js`, `tools/ui/test_forest_ui.js`, `tools/ui/m3a_shots.js`; step M3 of `MVP.md`)
Judge: by FEATURES (orientation, planes, closing wall, frame, goal), not by an identical place. `src/stage.js` is not touched: the rule of the largest piece meets zones that are connected pieces by construction (the data are normalized in `derive_roles.py`).
- **Source.** `old/forest.png` (26 x 23 tiles of 16 px, tile rip) and the map of the remake, through the user's v53 recipe (grid reproduced, 0 differences, asserted before normalizing), at x2: 52 x 46 px, 1 px = 1 tile of the viewer, H = 1 old tile at tilesPerH 2. Built-in sources `forest_a` / `forest_b` (the PNGs as base64 in `data/packs.js`, `EVO_FOREST_PNG`, decoded by the same path as loaded files); the examples set the terraces and sub-terraces (A 2 / 6, B 6 / 3: `sc.subs` is new, saved and restored by the window session with the terraces).
- **Zones.** Six, each one 4-connected piece: valley (170 old tiles), plateau NW (94), plateau SW (35), plateau N + tower (156), slope (110) and slope east (33); pieces of fewer than 10 tiles (`MIN_PIECE`, hypothesis [R]) are fused into the neighbour with the most shared border (31 tiles in 8 pieces). Trails (class 6 of v53) are `path`, not a zone.
- **Heights, measured in H** (median per zone, `tools/test_forest_roles.js`): A (v53 hypothesis, NOT verified; terraces 2, sub-terraces 6): valley and trails 0, slope 0.267, plateaus 0.533, tower 3.333 (target 0 / 0.3 / 0.6 / 3.5); B (terraces 6, sub-terraces 3): valley 0, slope 2, plateaus NW and N 4, plateau SW 6, tower 10.88. The trails are at valley height in A and follow their zone in B.
- **Tower and trees.** The tower is a raised mass (45 old tiles, cols 17-21, rows 2-10): its top is a piece apart no ramp reaches, the rule drops it (counted apart, 180 tiles, in the tests). Trees are NOT blocked (a role for blocked terrain does not exist; `masks.water` has the wrong semantics): `trees_blocked.png` (role `vegetation`, unused) is data for the polish.
- **Discard by the rule** (window [valley], [valley, slope, plateau N], [plateau N]; without the tower): A at most 7.4 %, B at most 17.3 %; the window of all six zones, which no example offers, reaches 21.2 % in B (slope east).
#### Para polish (found in M3a, not fixed here)
- The hero starts on the walkable tile nearest the centroid of the zone, which in the plateau N window is the foot of a ramp up to the mass of the tower (a ledge at 1.33 H in A, 4.88 H in B, outside the tower box).
- A PNG zone whose neighbours are all walkable terrain gets no closing planes (C2 classifies only non-walkable tiles): the route window shows wall 0 / columns 0; and no goal unless the zone is the LAST of the window (C3, `o.last`).
- Trees as volumes or billboards; a role for blocked terrain (after M4, if needed).

## 9. Known limits and open questions

- The viewer cannot make the art; it can only place it.
- **Q1** (closed by D6) Pitch of the Stage camera: 25, as measured.
- **Q2** Final list of piece kinds (the MVP list is in section 5; stones behind the rim, inner corners, doors, lights and floor dressing are open).
- **Q3** Where the slots are stored (manifest or a separate export for Unity): NOT decided and nothing is exported (D15).
- **Q4** Ramps and stairs vs climb points and ledge drops (a game decision).
- **Q5** Does the walk mode need a sprite, or is a marker enough.
- **Q6** How the Diorama pocket bands change for the frontal camera (today they assume Iso).

## 10. Camera contract

- **Made for**: **Cam 6 Stage** (perspective, FOV 30, pitch 25). The yaw comes from the pack: a pack may declare `stageYaw` (degrees; no UI; default 0). Shrine-Pier x4 declares 90: the camera looks from the sea (Pier in front, Shrine behind), the main OVERLOOKS relation of the scene.
  At play scale (about 55 px per tile) the camera dollies with the zoom, so the strength of the perspective on screen is the same at any zoom.
- **Stage preset** (a button in the Rooms group; it only sets existing parameters and the camera): Cam 6, technique B, single view, terraces 7, height spread 1.5 around the MIDDLE terrace (D16, D17). It does not touch the rooms parameters or the switches. The rooms layer changes with the terraces (and is meant for 2-5 terraces),
  so a room such as Diorama 31 of the real map (Balanced types, 3 terraces) is looked at with the preset's camera, technique and spread but with the terraces left at 3.
- **Candidate tactical camera**: **Cam 7 Classic 3/4** (oblique projection, ground scale 1, height scale 1, yaw 0), another mode, not the Stage (D6).
- **Also usable**: Cam 1-5 (orthographic) as in the other crystallizers; the Pocket and the Cake / walls figures of crystallizer 2 were made for Cam 1.
- **What does not work yet / how it was measured**: see CLAUDE.md known limitation 15 (z-buffer order, picking, face culling, perspective strength under Cam 6 and Cam 7). The Art contract placeholders follow the camera facing test of Cam 6 (per-position facing).
