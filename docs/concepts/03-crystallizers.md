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
| 5 Floors | none set by its scenario; the floor backdrop only works at Cam 1 | repo, scenario `snake_floors` |

PROPOSAL, to confirm: make the default camera an explicit field of each crystallizer (first row of its README and of its scenario), and make a control that is only valid at some camera say so (the floor backdrop at Cam 1 only).

## The five that exist

| # | Crystallizer | What it gives | Data it is shown on |
|---|---|---|---|
| 1 | Terrain: Box, A, B | Terraces, ramps, the incursion border | Real map (numeric world) |
| 2 | Room types | Cake, Ascension, Diorama pocket | Real map with rooms |
| 3 | Stage (HD-2D) | Body and wrapper, props, footprint shade; design draft, to be revisited (user: it felt like a defeat) | Shrine-Pier x4 (semantic landmark) |
| 4 | Tiles to Curves | Technique C and its wall pass (Unexplored 2 look) | Snake surface, real map |
| 5 | Floors | Exterior shell, interior floors, links, exploded stack and cutaway | Snake Mountain (semantic macroform) |

Details of each live in `docs/crystallizers/NN-.../README.md`.

## Open questions

1. Is the default camera a property of the crystallizer only, or also of the mechanism (the same landmark seen from the same camera in any crystallizer)?
2. For the Stage (design draft) and the HD-2D scope: is it the next crystallizer to complete, or a scope example?
