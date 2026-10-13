# Handoff to Unity

## What the user has said

- The crystallizers give the base geometry; afterwards it is transferred to Unity to be implemented (user, 2026-10-13).
- Each game or scenario is created, modelled, and then goes to Unity pre-generated or pre-proc-gen (user, 2026-10-13).
- Nothing is exported to Unity until ALL crystallizers are finished; doing it earlier would kill the effort (user, 2026-10-12).
- The semantic pass (sentence to rules, placement, carving) is not implemented in this repo: the user runs it separately; implementing it later would probably need an LLM, and finishing the crystallizers comes first (user, 2026-10-13, see [02-semantic-pass.md](02-semantic-pass.md)).

## What the viewer is

A web test bed (canvas 2D, no dependencies) to see the same data given geometry in several ways. It computes tiles, levels, ramps, rooms, routes and the look. Each crystallizer README has a "Viewer vs Unity" section that says what is computed here and what is left to Unity (for example Unity: one wall prefab per chain, RPG interior in the pocket's place, environment crossfade when the unit enters the fragment).

## Open questions

1. What exactly is handed over: the numeric pack, the rules, meshes, or a recipe plus seed that Unity runs?
2. "Pre-generated" versus "pre-proc-gen": which scenarios go which way, and who decides?
3. Does the handoff include the semantic pass output (the rules), so Unity can re-check them?
