# Crystallizers

## What it is

A crystallizer is a way to give GEOMETRY to what a creation mechanism produces. The crystallizers are the base geometry; after them the result goes to Unity (user, 2026-10-13). Generation is not their job.

## Scope decides the crystallizer

A crystallizer is only meaningful against a scope, and the scope is usually graphic or visual (user). Example from the user: "a combat scenario in a castle, 2D-HD" means going to the HD-2D crystallizer and adjusting it from there. So the crystallizers are worked examples that show how a mechanism can be given a look; they are not the goal by themselves.

Rules the user has set:
- A crystallizer is never repeated (user).
- Choices of crystallizer were based on usability, so changing them is fine (user).
- Each one aims at a minimal or slightly-better-than-MVP result, without drifting into fine details (user).
- Even when a look is only post-production (Hades), the geometry must give the stylization something to work with (user).

## One default camera per crystallizer (user, 2026-10-13)

Each crystallizer needs a default camera. Today there is a bank of seven cameras (repo: `CLAUDE.md`, camera bank), each README has a "Camera contract" section, and the scenario buttons already set a camera for some of them:

| Crystallizer | Camera that exists today | Source |
|---|---|---|
| 1 Terrain (Box, A, B) | Cam 3 Oblique 50, the viewer default | repo |
| 2 Room types (Cake, Ascension, Pocket) | Pocket scenario: Cam 1 (the Pocket is composed for that axis); the rest uses the default | repo, scenario `pocket31` |
| 3 Stage (HD-2D) | Cam 6 Stage, from the Stage preset | repo, scenario `x4_stage` |
| 4 Tiles to Curves (C) | Cam 3, scenario `snake_curves` | repo |
| 5 Floors | **Cam 1 Iso 45** (user decision, 2026-10-13: the default camera, a good fit for all; the floor backdrop is composed for its axis). The scenario `snake_floors` sets it (PR #28) | user; repo, scenario `snake_floors` |
| 6 Macroform | **Cam 1 Iso 45** (user decision, 2026-10-13); the volume view works at Cam 1-5 only | user; repo, scenario `snake_macro` |

Floors and Macroform are the ones confirmed. PROPOSAL, to confirm for the rest: make the default camera an explicit field of each crystallizer (first row of its README and of its scenario), and make a control that is only valid at some camera say so (the floor backdrop at Cam 1 only).

## The six that exist

| # | Crystallizer | What it gives | Data it is shown on |
|---|---|---|---|
| 1 | Terrain: Box, A, B | Terraces, ramps, the incursion border | Real map (numeric world) |
| 2 | Room types | Cake, Ascension, Diorama pocket | Real map with rooms |
| 3 | Stage (HD-2D) | Body and wrapper, props, footprint shade; design draft, needs a major design pass (user, 2026-10-14) | Shrine-Pier x4 (semantic landmark) |
| 4 | Tiles to Curves | Technique C and its wall pass (Unexplored 2 look) | Snake surface, real map |
| 5 | Floors (closed 2026-10-14) | Exterior shell, interior floors, links, exploded stack and cutaway | Snake Mountain (semantic macroform) |
| 6 | Macroform (phase 1 closed 2026-10-14) | The macroform as a volume: shell, interior, traversable serpent spiral through three floors, crater shaft; exterior, quadrant removed, interior only, horizontal cuts | Snake Mountain (semantic macroform) |

Details of each live in `docs/crystallizers/NN-.../README.md`.

## Usability: the problem found on 2026-10-14 (user)

The viewer is a mix of the features of every crystallizer in ONE panel. They cannot be used together; the only things that combine are support elements (some markers, the wall details). The user cannot use the methods of the different crystallizers from the page: Floors cannot be touched through the UI (one would have to work out how to activate its features and then tune them). "If you asked me to make an example of each crystallizer, I could not." The page is usable as it is, but the project needs order and an appropriate UI, and that comes BEFORE the Stage (3). Measured on the page (2026-10-14): 84 controls in one panel about 3,400 px tall (almost four screens at 900 px); the controls of Floors and Macroform only appear after choosing their source; the 21 controls of Room types are greyed until Rooms is on with a map big enough to have rooms; the shapes of Floors and Macroform are computed offline by Python scripts, so no control of the page changes them.

The task deferred above (GROUP which tools combine with which crystallizer) becomes part of that UI pass.

## Why techniques are compared, and what is deferred (user, 2026-10-13)

The original reason for comparing techniques stands: terrain needs evaluation, and the viewer exists to see which technique reads best. Some combinations are really bad. Example (user): our walls with extrusion are mostly the Unexplored 2 look and do not fit all modes.

That means a later task: GROUP which tools combine with which crystallizer. It is **not for now** (user): for now only the concepts and the decisions are kept, and when everything is finished they are reviewed (see [05-decisions-to-revisit.md](05-decisions-to-revisit.md)). The repo `CLAUDE.md` Context paragraph ("compare which reads best") stays as it is.

## Open questions

1. Is the default camera a property of the crystallizer only, or also of the mechanism (the same landmark seen from the same camera in any crystallizer)?
2. ANSWERED (user, 2026-10-14): the Stage is not next. The UI pass comes first; then the Stage needs a major design pass, because a true HD-2D cannot be made here and dressing another system as HD-2D is the incongruence behind the earlier failure.
