# Crystallizers

One folder per crystallizer (a way to materialize the same map data). Each folder has a `README.md` with the
same sections, so the decisions and the state of every crystallizer can be found in one place. CLAUDE.md keeps
the short rules; the long history and the reasons live here.

| # | Crystallizer | Status | README |
|---|---|---|---|
| 1 | Terrain techniques: Box (reference), A (contour polygons), B (distance field) | Closed (base, PR #1-#4) | [01-terrain](01-terrain/README.md) |
| 2 | Room types: Cake / Diorama (pocket) / Ascension (walls) | Closed (PR #7-#13; its data source, the rooms layer, PR #5-#6) | [02-room-types](02-room-types/README.md) |
| 3 | Stage: framing and dressing as an art-piece contract, Sea of Stars reference | Design draft | [03-stage](03-stage/README.md) |

## README template

Every crystallizer README uses these sections, in this order:

1. **Status**: draft / approved / in progress / closed, with the PRs.
2. **Goal**: what it materializes and what question it answers.
3. **References**: games, repos, articles (with licence when it is code).
4. **Decisions**: the user's decisions, dated, numbered (D1, D2...). Never rewritten; a changed decision gets a new
   number that says which one it replaces.
5. **Design**: the rules, in the viewer's terms (tiles, levels, rooms, slice).
6. **Viewer vs Unity**: what the viewer computes and draws, what is left to Unity.
7. **Verification**: tests, measured figures, screenshots (fixed test set: real map Default and Balanced types,
   Snake Mountain surface).
8. **Mocks**: throwaway mock-ups made before the design, what each showed and why it was kept or dropped.
9. **Known limits** and **Open questions**.
