# The semantic pass

Status: DRAFT, updated on 2026-10-13 with the user's description of how semantic building works and his answers to the open questions.

The semantic landmark is the mechanism that will be used most. The semantic pass is what turns a sentence into rules and carves them into the numeric world; after it, the numeric world process continues on a world that the pass has already altered (user).

**Scope of this repo (user, 2026-10-13):** the pass is NOT implemented here. The user runs it separately. Implementing it later would probably need an LLM, and he prefers to finish the crystallizers first. This file exists so the pass is written down and the crystallizers know what they receive.

## 1. Decomposition of a sentence

"The Shrine overlooks the Pier, near the lake / sea" decomposes into three kinds of thing (user):

| Kind | In this sentence | What it becomes |
|---|---|---|
| **Subjects** (2) | Shrine, Pier | **Landmarks** |
| **Relationships** (2) | Shrine OVERLOOKS Pier; Pier NEAR lake | **Rules**, after interpretation (section 2) |
| **Pre-defined** (1) | lake / sea | A **base rule**, generic: the lowest height level is filled as water (for example every lowest height is filled with blue) |

Pre-defined elements are base rules and are generic. Relationships need interpretation (user).

## 2. Interpretation of the relationships

| Relationship | Rules it means (user) |
|---|---|
| **Shrine OVERLOOKS Pier** (2 rules) | 1. HEIGHT: the Shrine's placement is the Pier's level + 1 or more. 2. LINE OF SIGHT: un-impeded. Both are HARD rules. |
| **Pier NEAR lake** (2 rules) | 1. The Pier landmark touches lake tiles. 2. Since it is NEAR and not ON TOP of the water, its fixed height is the lowest level + 1. |

So the sentence gives four rules from its relationships, plus the generic water rule.

**"Lowest + 1"** (user): if the lowest terrace is 0, the Pier is 1. If the relationship said ON TOP, the Pier would also be 0, but with a sub-terrace or similar.

**OVERLOOKS is a hard rule** (user): overlooking needs vision from a higher position, which means a line of sight from more height. The Shrine must therefore CHOOSE terrain that allows it. If other obstructions exist, such as trees, they must be flattened and opened. The same clearing is used later for dressing.

**Overlooks and the rejection radius** (user): it usually ends up aligned with the rejection (outer) radius. With a low radius, a Shrine next to the Pier reads as a pier that is part of the Shrine. A farther Shrine, at a radius of about 20 tiles, can be the start of a valley map that contemplates the rising sun.

## 3. Relationships are the meaty part

The user's emphasis: relationships are the "meatiest" part of this system. They are not complex, about 1 to 3 rules each, but they are used at several levels afterwards (placement, carving, dressing, framing). A change to how relationships are written affects everything downstream.

## 4. What happens after the translation

1. **Generate a Perlin noise height map** and fuse it with the semantic carved terrain (user).
2. **Find the placement** of the Pier and the Shrine on a map that already contains water. MAP-Elites was used for this, in preparation for a large map with several constraints (user).
3. **Outer radius** (the rejection area): each landmark keeps the others away at specified distances. This can change (user).
4. **Carve the footprint** of each placed landmark; its **influence** alters the surrounding terrain. This ends the semantic pass (user).
5. The **numeric world process continues**, now on the terrain the semantic pass has altered (user).
6. When a large influence is wanted, each landmark just adjusts its footprint, its influence radius and its intensity (user).

```
sentence --> subjects, relationships, pre-defined
                  |
                  v   interpretation (relationships: 1-3 hard rules each)
          landmarks + 4 rules + base rule (water = lowest level)
                  |
                  v
   Perlin height map  +  carved terrain      (fuse)
                  |
                  v   placement search (MAP-Elites), outer radius keeps landmarks apart
          footprint carved, influence applied, obstructions cleared   <-- end of the semantic pass
                  |
                  v
   numeric world process continues on the altered world
```

## 5. How this relates to the GDD

GDD v0.2 (sections 4, 7, 8) describes the same idea with other words and a different ORDER:

- GDD: subjects get a provisional placement and numeric kernels FIRST, relations are compiled into constraint matrices after that, and low-amplitude noise is added to the result.
- User (2026-10-13): the noise map is generated first, the landmarks are then PLACED on it (water already present) by a search, and then carved.
- GDD OVERLOOKS = ABOVE + distance band + unobstructed sightline. User OVERLOOKS = higher + line of sight; the distance between landmarks comes from the outer (rejection) radius, which "can change". The GDD's distance band has no separate rule in the user's version. The GDD's "sightline ceiling" lowers terrain along the line; the user's version chooses terrain that already allows it and clears objects (trees).
- GDD kernel: footprint, border, influence, intensity, falloff. User landmark: solid form, footprint, influence, rejection (outer radius).

The user's description is the most recent and is taken as the current one. The GDD vocabulary of relations (NEAR, FAR, ABOVE, CONNECT, SEPARATE, CROSS, AVOID, OVERLOOKS) stays as the list to interpret from.

## 6. What exists in the repo today

- The RESULT for two examples: `data/shrine_pier.json` (from the user's spreadsheet, 10x10) and `data/shrine_pier_x4.json` (derived, 40x40, landmarks, trees, the OVERLOOKS corridor kept free).
- Nothing in the repo states these rules, checks them, or runs the pass. The viewer receives the finished pack. This is intended (see the scope note at the top).

## 7. Open questions

1. Order: the user's (noise first, then placement) against the GDD's (placement first, then noise). The user's is taken as current; confirm it is final.
2. Where do the rules live as data: is there a format for subjects, relationships and base rules (GDD 23 has a first data model), so the user's separate pass and the crystallizers share one description?
3. "Cleared obstructions": trees are carried in the x4 pack as jittered positions. Is clearing along the line of sight something a crystallizer should DRAW (a visible opening), or only something the pass guarantees in the data?
