# Crystallizers

One folder per crystallizer (a way to materialize the same map data). Each folder has a `README.md` with the
same sections, so the decisions and the state of every crystallizer can be found in one place. CLAUDE.md keeps
the short rules; the long history and the reasons live here.

| # | Crystallizer | Status | README |
|---|---|---|---|
| 1 | Terrain techniques: Box (reference), A (contour polygons), B (distance field) | Closed (base, PR #1-#4) | [01-terrain](01-terrain/README.md) |
| 2 | Room types: Cake / Diorama (pocket) / Ascension (walls) | Closed (PR #7-#13; its data source, the rooms layer, PR #5-#6) | [02-room-types](02-room-types/README.md) |
| 3 | Stage: framing and dressing as an art-piece contract, Sea of Stars reference | Design draft | [03-stage](03-stage/README.md) |

## Core examples

The fixed test set of every crystallizer follows the three CORE EXAMPLES: numeric (the real map, rooms on, Default and Balanced types), semantic landmarks (Shrine-Pier) and semantic macroform (Snake Mountain surface). The semantic numeric world is the evolution of the vanilla (Perlin) one. Shrine-Pier also has a DECOMPRESSED version for the Stage (Shrine-Pier x4, 40x40, derived data with its script, `stageYaw` 90; 03-stage D13); it is part of the fixed test set next to the 10x10 pack.

## Camera bank

Every crystallizer is made for some cameras of ONE fixed, discrete bank (nothing custom): Cam 1 Iso 45 (`isoE`), Cam 2 Iso -45 (`isoW`), Cam 3 Oblique 50 (`oblique`), Cam 4 Low 28 (`low`), Cam 5 Top 80 (`top`), Cam 6 Stage (perspective, FOV 30, pitch 25, yaw 0; `stage`), Cam 7 Classic 3/4 (oblique projection, ground scale 1 and height scale 1; `classic`). "A" and "B" are technique names, so the cameras are numbered. Each README says which of them it is made for in its "Camera contract" section.

## README template

Every crystallizer README uses these sections, in this order:

1. **Status**: draft / approved / in progress / closed, with the PRs.
2. **Goal**: what it materializes and what question it answers.
3. **References**: games, repos, articles (with licence when it is code).
4. **Decisions**: the user's decisions, dated, numbered (D1, D2...). Never rewritten; a changed decision gets a new
   number that says which one it replaces.
5. **Design**: the rules, in the viewer's terms (tiles, levels, rooms, slice).
6. **Viewer vs Unity**: what the viewer computes and draws, what is left to Unity.
7. **Verification**: tests, measured figures, screenshots (fixed test set = the three core examples: real map
   Default and Balanced types, Shrine-Pier, Snake Mountain surface).
8. **Mocks**: throwaway mock-ups made before the design, what each showed and why it was kept or dropped.
9. **Known limits** and **Open questions**.
10. **Camera contract**: which cameras of the bank the crystallizer is made for, which ones were tried and what does not work. (Added last so the older section numbers and cross-references stay valid.)
