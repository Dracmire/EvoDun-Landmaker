# Decisions to revisit

Status: LIST, started 2026-10-13. Nothing here is a change; it is a place to keep decisions so they are not lost.

**Rule (user, 2026-10-13):** for now only concepts and decisions are kept. When all the crystallizers are finished, the decisions are reviewed, because some were taken to simplify the process and may need to be hardened later.

This list collects what the repo itself marks as provisional, parked, a deviation, or "on purpose". It does NOT judge which of them were taken to simplify or which need hardening: that is the review, and it is the user's call.

| Area | Decision as it stands | How the repo marks it | Source |
|---|---|---|---|
| Terrain | Climb limit of 2 sub-terraces without a stair | PROVISIONAL, an assumption, not the micro-step rule | `CLAUDE.md` limitation 10 |
| Terrain | Gates normalise each terrace with its NOMINAL band, not the min/max of its tiles | DEVIATION from the user's `EDunProcGen.cs`, with measured reason | `CLAUDE.md`, gates |
| Terrain | Partial connection: no step that joins regions | KNOWN LIMITATION, on purpose; the global connection is meant to come from rooms and the numeric world | `CLAUDE.md` limitation 11 |
| Terrain | Overlays blocky, B outer corners, Box stripes | PARKED by the user | `CLAUDE.md` limitations 1, 5, 9 |
| Rooms | Rooms closed and frozen as of PR #6; start core by most cores (deviation from `ChooseStartingCore`); `ClassifySlopeMap` coast normalisation; size classes, platforms and central circuit not done | FROZEN / PENDING, for the generator project | `CLAUDE.md` limitation 12, Pending 4 |
| Painter order | Ramp order, Cam 6 / Cam 7 and cutaway order are MEASURED, NOT ENFORCED; the full fix is per-pixel depth (WebGL) | PARKED | `CLAUDE.md` limitations 15, 16 |
| Cameras | Cam 6 yaw is 0 until the semantic relation gives it; Cam 6 Box order is not an exact painter order | listed as "what does not work yet" | `CLAUDE.md` limitation 15 |
| Stage | Design draft; the user said it felt like a defeat | DRAFT, to be revisited | [03-crystallizers.md](03-crystallizers.md) |
| Tiles to Curves | Vertical pass of the wall dressing | NOT approved, not built | `CLAUDE.md`, Repo state |
| Floors | Floor connections are DECLARED (reserved), not detected; the shaft replaces the serpent tube (deviation from GDD 4.1); no entrance from the exterior yet (the snake's mouth) | RESERVED / DEVIATION / PENDING | `CLAUDE.md`, FLOORS |
| Floors | The floor backdrop is built on the Cam 1 axis and its profile is stylization | by design for now | `docs/crystallizers/05-floors/option2-backdrop.md` |
| Unity | Nothing is exported until every crystallizer is done | user rule | [04-handoff-to-unity.md](04-handoff-to-unity.md) |

Add a row when a decision is taken to simplify; remove it only when the user says it has been reviewed.
