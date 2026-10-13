# The three creation mechanisms

The three CORE EXAMPLES of the fixed test set are one example of each mechanism (repo: `docs/crystallizers/README.md`).

| Mechanism | What it is | Core example | Where it stands today |
|---|---|---|---|
| **Numeric World** | A field of numbers (height images, 1 pixel = 1 tile) from which everything is derived. The original system: Perlin, numeric abstraction, Discovery, crystallization. Great at emergent content, little control ("raw number soup") (user). | The real 256x256 height map | Used as test data: terraces, gates and the minimal rooms chain (the rooms work is closed; no platforms). |
| **Semantic Landmark** | A place with meaning (Shrine, Pier) inserted into a numeric world. Still ONE heightmap, but with predefined space for the landmarks (user). Four aspects: **solid form** (the body), **footprint** (the slot where it sits in the map, a slightly larger contour, usually a bit sunken), **influence** (impact on nearby terrain, decaying with distance), **rejection** (area other landmarks cannot enter; does not affect terrain) (user). | Shrine-Pier (10x10 and the x4 version) | The user calls it the most used one and says it is **not yet well expressed**. The viewer only has the RESULT (a pack made by hand from spreadsheets). The semantic pass that produces it (sentence to subjects, relationships and base rules, then placement, carving and influence) is described by the user in [02-semantic-pass.md](02-semantic-pass.md) but is not written down or implemented anywhere in the repo. |
| **Semantic Macroform** | A large zone of playable terrain, like a city or a castle: iconic places with fantasy architecture, built through numeric abstraction (user). The shell is the exterior and the interiors are where play happens. It is NOT a solid block. Several height maps (mountain, snake, base land) plus a fourth emerging one, the inner caves (a hollowed SDF), read by horizontal slices with several entries per (x, y), so it cannot be one heightmap (user). The snake's head is left to a semantic landmark (user). What the macroform itself must leave done is the TUBULAR BODY of the serpent: it passes through all the floors and connects them (user, 2026-10-13). | Snake Mountain | Only its outer surface is a pack, plus a derived Floors package (exterior shell, shaft, two interior floors). The authored multi-map version is not in the viewer. |

## How they combine

- A macroform's height maps go through the same semantic layer and numeric abstraction as an extended number soup (user).
- Zone, Area, Room and Platform are not separate generated maps: they are finer readings of the same numeric space (GDD 12). Map, Zone (a biome or country, one incursion), Area (a terrain type), Room (traversal scale), Platform (placement scale).
- Generation is not this repo's goal. The repo takes the data as given and gives it geometry (user, repo `CLAUDE.md` Context).

## Open questions

1. Is the macroform's "head as a landmark" a requirement of the concept, or only of the Snake Mountain example?
2. Where does the macroform's multi-map creation block (Macro, Meso, Micro) sit relative to the semantic pass: before it, inside it, or beside it?
