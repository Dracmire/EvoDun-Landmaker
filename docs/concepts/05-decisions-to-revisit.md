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
| Stage | Design draft; the user said it felt like a defeat. 2026-10-14 (user): a true HD-2D cannot be made here, and dressing another system as HD-2D is the incongruence; a MAJOR design pass comes before any work, after the UI pass | DRAFT, to be redesigned | [03-crystallizers.md](03-crystallizers.md) |
| Tiles to Curves | Vertical pass of the wall dressing | NOT approved, not built | `CLAUDE.md`, Repo state |
| Floors | Floor connections are DECLARED (reserved), not detected; the shaft replaces the serpent tube in this package (D1, deviation from GDD 4.1). The tubular serpent body through all floors is built by crystallizer 6, not here | RESERVED / DEVIATION | `CLAUDE.md`, FLOORS |
| Floors | CLOSED as it stands (user, 2026-10-14): backdrop 2c / 2d and phases 3-6 not done, backdrop only at Cam 1, the floor-2 opening reads as a railed pit, the "later" list of README 5d not done | CLOSED, NOT DONE | `docs/crystallizers/05-floors/README.md` D8 |
| Macroform | Every constant of the derivation is mine, not the user's: vertical scale V 2 (2.5 fails the slope), DZ 0.25, shell T_SHELL 1.5 (1.03 tiles after the ramp tube is carved), HEAD 2.5, SLAB 0.5, floor spacing 3.0 (3 floors), ramp radius 1.0, step 0.75, shaft r 2.5, ground at the 10th percentile; tests: ramp slope <= 0.65 (measured 0.602), every floor >= 94 % reached (floor 2 is 94.7 %), headroom >= HEAD - DZ (slabs quantize outward) | PROVISIONAL (the 94 % and HEAD - DZ accepted by the user, 2026-10-14) | `docs/crystallizers/06-macroform/README.md` sections 4, 9 |
| Macroform | The volume view and the heightmap view (Off) of the same source do not share a vertical scale (the volume is about 4 times taller) | by design for now, stated in the page | `docs/crystallizers/06-macroform/README.md` section 11 |
| Macroform | Phase 1 closed (user, 2026-10-14); its shape is baked by a Python script, so it cannot be tuned from the page; phase 2 (the other numeric-world passes, among others) not designed | CLOSED PHASE, PENDING | `docs/crystallizers/06-macroform/README.md` section 1 |
| Floors | The floor backdrop is built on the Cam 1 axis (Cam 1 is the default camera of Floors, user, 2026-10-13) and its profile is stylization; the other cameras are not supported by it (fixed axis) | by design for now | `docs/crystallizers/05-floors/option2-backdrop.md` |
| Floors | The hard rule "the backdrop never hides the floor" is enforced at the Cam 1 axis with drag yaw 0 ONLY; at +-5 (join + blend 0.060-0.066 %, above the 0.06 % bound in three of four cases), +-10 and +-20 it is only MEASURED (a 1-4 px strip where the wall touches the floor edge: up to 0.2-0.4 % of the floor pixels at yaw +-20 with pitch -15) | user decision (option B), 2026-10-13: a test that would not fail on a regression there | `docs/crystallizers/05-floors/option2-backdrop.md` section N.1 |
| Unity | Nothing is exported until every crystallizer is done | user rule | [04-handoff-to-unity.md](04-handoff-to-unity.md) |

Add a row when a decision is taken to simplify; remove it only when the user says it has been reviewed.
