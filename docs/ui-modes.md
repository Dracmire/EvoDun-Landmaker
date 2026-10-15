# UI pass: one mode per crystallizer

Status: DESIGN DRAFT (2026-10-15). The direction is approved by the user; the detail below (which control goes where, the examples, the cameras) is a PROPOSAL to review. No code until the user approves it. `CLAUDE.md` Pending 9.

## 1. Decisions (user)

- U1 (2026-10-15) ONE MODE PER CRYSTALLIZER: choosing a crystallizer loads its example, its camera and its technique, and shows only its controls.
- U2 (2026-10-15) STRICT FIRST: each mode alone plus the shared passes. Combinations between crystallizers come later as "Extras" (section 9), each one only after a check shows it works.
- U3 (2026-10-15) The Macroform (6) is view-only in this pass. The user's objection is recorded in section 8: as long as it can only show one baked volume, it is not yet a full crystallizer.
- U4 (2026-10-15) Compare only in the modes that have alternative techniques (1 and 4).
- U5 (2026-10-15) The room types (Diorama, Ascension, Cake: DAC) should apply to every crystallizer; it is the check the user is most interested in (section 7).
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
| 2 | Room types (DAC) | Real map · Balanced types, Real map · Default, Pocket · Diorama 31, Your images | Cam 1 (1-7); PROPOSAL: the Pocket is composed for Cam 1 | one of Box / A / B / C (DAC draws in all four, section 7); no Compare |
| 3 | Stage | Shrine-Pier x4 · Stage, Diorama 31 · Stage | Cam 6 (6, 7, 1-5) | B (the Stage preset); no Compare. Banner: IN REDESIGN, frozen as it is |
| 4 | Curves (C) | Snake Mountain surface, Real map · Default, Real map · Balanced types, Shrine-Pier x4 | Cam 3 (1-7) | C; Compare |
| 5 | Floors | Snake Mountain floors | Cam 1 (1-5, 7) | the Floors view; no Compare. Banner: CLOSED, shapes baked by a script. PROPOSAL: listed under "Archived", not in the main list |
| 6 | Macroform | Snake Mountain macroform | Cam 1 (1-5) | the volume (one panel); no Compare. Banner: phase 1, baked by a script |

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
| 2 Pocket | yes | yes | yes | by design (not measured) | Cam 1 (composed for it) | misaligned (limitation 15 (4)) | misaligned | real map Dioramas |
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

## 8. Macroform and Floors: what they are (the user's objection, 2026-10-15)

- The Macroform's DATA is a voxel grid stored as runs: each column holds solid intervals (z0, z1, material) at a step of 0.25 tile. An SDF appears only inside the offline derivation: the shell is carved where the 3D distance to the outside air is greater than T_SHELL; that field is then cut into voxels. The viewer draws voxel blocks. So: SDF in the derivation, voxels in the data and the drawing. The "SDF exterior mesh" crystallizer (a smooth surface from the field) was deferred and is still not built.
- Floors is stacked heightmaps; its floor footprints come from a rule (exterior >= z + 1 plus a shell of 1.5), not from a field. It never had a volume (its README, Goal).
- The user's objection: as long as the volume can only be shown as one baked example, and cannot be produced or tuned from the page, the Macroform is not yet a full crystallizer. Conditions for its phase 2 (not designed): (a) the derivation in the page from the macroform's input maps and parameters (the Python uses a 3D distance transform, smoothing and the ramp; 40 x 40 x ~80 voxels is small); (b) optionally a smooth 2.5D look by drawing each horizontal band of the volume with technique B (B is already a signed-distance contour technique in 2D), which would be an "SDF look" without 3D rendering.

## 9. The second step: Extras

Not a new mode: a block "Extras" inside a mode that lists stages of OTHER crystallizers. An entry is added only when a check has shown it works on that mode's examples (no page error, switch off = identical pixels, a picture looked at). First candidates, from section 6: DAC in modes 1 and 4 (only on examples that have rooms, so it depends on section 7); the Art contract in modes 1, 2 and 4. Each candidate is its own small check and its own decision.

## 10. Implementation (for Claude Code, after approval)

- PR 1: the `MODES` table, the mode selector, show / hide per mode, examples (the old scenarios) per mode, cameras and techniques per mode, Compare only in 1 and 4, the banners, the baked-parameters box of mode 6, `docs/modes.md` generated, `viewer.mode` in the manifest.
  Tests: a new `tools/ui/test_modes_ui.js` (per mode: the default example loads with its camera and technique; only its controls and the common area are visible; each MAIN control changes the picture or the info on that example; the cameras outside the mode are hidden; no page error). `tools/ui/test_controls_ui.js` WILL CHANGE (its greyed / orphan matrix becomes per mode): announced here, to be approved with this design. The pixel regression must stay at 0 differences for the same state (the regress scripts set the state through the page; hidden controls stay in the DOM).
- PR 2 (optional): one "Whole map" button for zones and rooms; remove the retired `#layout`; a fixed height for the info line (limitation 18; it changes the canvas size, so its regress differences are announced).
- ACCEPTANCE (the user's criterion): from GitHub Pages, without reading code, the user chooses each mode, its example loads, each main control changes what is drawn, and nothing is greyed without a "Requires: ..." that says what to do.

## 11. Open questions for the user

1. Floors (5): under "Archived" (reachable, out of the main list) or in the main list with its "closed" banner?
2. Mode 2: default camera Cam 1 (the Pocket is composed for it)?
3. DAC for every example (section 7): which route (R1-R4), and does it come right after this UI pass or after the Stage?
