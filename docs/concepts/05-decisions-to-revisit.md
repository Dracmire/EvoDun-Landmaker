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
| Floors | Floor connections are DECLARED (reserved), not detected; the shaft replaces the serpent tube (D1, deviation from GDD 4.1); the tubular serpent BODY through all floors is not built yet (user, 2026-10-13: it is what the macroform must leave done; the head is a separate landmark) | RESERVED / DEVIATION / PENDING | `CLAUDE.md`, FLOORS |
| Floors | The floor backdrop is built on the Cam 1 axis (Cam 1 is the default camera of Floors, user, 2026-10-13) and its profile is stylization; the other cameras are not supported by it (fixed axis) | by design for now | `docs/crystallizers/05-floors/option2-backdrop.md` |
| Floors | The hard rule "the backdrop never hides the floor" is enforced at the Cam 1 axis with drag yaw 0 and +-5 degrees; from +-10 degrees it is only MEASURED (the wall touching the floor edge covers a 2-4 px strip: 0.05-0.3 % of the floor pixels at +-10..20 degrees) | user decision (option B), 2026-10-13: a test that would not fail on a regression there | `docs/crystallizers/05-floors/option2-backdrop.md` section N |
| Unity | Nothing is exported until every crystallizer is done | user rule | [04-handoff-to-unity.md](04-handoff-to-unity.md) |

Add a row when a decision is taken to simplify; remove it only when the user says it has been reviewed.
