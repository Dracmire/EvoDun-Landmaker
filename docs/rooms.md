# Rooms: minimal chain with the patched connection (stage check)

`src/rooms.js` ports the minimal chain of the user's `reference/EDunProcGen.cs` (`SequenceA`): slope classes, rooms by watershed,
room edges, cores, A* between cores with a spanning tree; the terrace gates already in the viewer are reused. Void is height 0.
No UI, no render, no room types, no platforms. The original rules, transcribed as is, are in `tools/rooms_original.js` (comparison only).

    node tools/test_rooms.js                       25 checks: each defect reproduced with the original rules, gone in the patched ones
    node tools/rooms_check.js [--preset forge|conical] [--transStrict 0.05 --minTerraceTrans 3 ...]   figures + PNG overlays

## The three variants
- **A** the user's code as written: terraces `floor(h * N)`, his gates (with the swap leak), his passability.
- **B** the same original passability over the viewer's terraces and gates (isolates the rule from the gates).
- **C** the patched rule over the viewer's terraces and gates.

Gates: the viewer's `E.gateTransitions` (nominal band normalization), then the user's same-room condition, void and Steep removed, group
minimum applied again (same result as filtering by room first: groups only shrink). Terraces: the viewer's (global range of the whole map,
void included as the lowest value; pre-smoothing and plateau cleanup as in the viewer), not `floor(h * N)`.

## Results on `data/samples/skeleton_heightmap_256.png` (void 32 %, 44 582 land tiles)
"Largest tree" = cores joined in the biggest spanning tree / living cores (>= 5 tiles). Living cores differ per variant because the rooms
and terraces differ (A 303, B 267, C 271 with mapGen_forge).

| config | A (user's code) | B (original rule, viewer gates) | C (patched) |
|---|---|---|---|
| mapGen_forge as given (transStrict 0.45, min 8) | 8 / 303 (2.6 %) | 2 / 267 | 2 / 271 (viewer finds 0 gates) |
| forge, transStrict 0.05, min 3 | 287 / 303 (94.7 %) | 7 / 267 (2.6 %) | 240 / 271 (88.6 %) |
| forge, transStrict 0.05, min 8 | 276 / 303 | 2 / 267 | 2 / 271 |
| ConicalTown (0.46, min 8) | 42 / 81 (51.9 %) | 8 / 69 (11.6 %) | 15 / 76 (19.7 %) |

Sweep of transStrict, forge, min 3 (viewer groups / C groups; largest tree C, B, A): 0.05: 654 / 540; 240, 7, 287. 0.1: 645 / 540; 240, 7, 287.
0.2: 614 / 540; 240, 7, 287. 0.3: 437 / 410; 221, 6, 281. 0.45: 35 / 33; 2, 2, 88. With min 8: 33, 32, 24, 9, 0 viewer groups; C stays at 2
up to 0.3 (18 groups) because there are too few gates.

Pairs lost because they have a Steep tile (candidate gate pairs): forge 0.05 / min 8: 49 of 374; 0.05 / min 3: 381 of 3456 (11 %); 0.45 / min 3: 4;
ConicalTown: 4 of 35. Room transition pairs: 0 by construction (a pair with a Steep tile is Hard).

## What the numbers say
- The user's code DOES connect on this map (A, 91-95 %) when the gates are loose, and it connects because of the swap leak: 40-45 % of its gate
  tiles are leak records (the sealed gates of defect 2 are opened from the high side by accident). With the viewer's clean gates and the original
  rule (B) almost nothing connects (2.6 %), and with the patched rule (C) 88.6 %. The patch is what makes the clean gates usable.
- mapGen_forge's values (0.45 / 8) were tuned to the original code: A gets 2.6 % there too, and the viewer finds no gates at all.
- One-off ablation (scratch, not in the repo; C, forge 0.05 / min 8, 249 living cores): with terraces fully open (no gate rule, no margin around
  cliffs) and the room transitions as classified, 244 of 249 cores join; opening the rooms instead leaves 51. The limit is the terraces/gates, not the rooms.
- 8-bit heights (239 distinct values) and the coast dominate the slope normalization; with exponent 0.5 and (0.2, 0.33) there are 15 257 Flat, 25 580 Gentle,
  3 684 Steep tiles inland+coast.

## Not checked
Only this map (and the same map with ConicalTown's values; the scene's own height map is not in the repo). Not compared with a run of the user's
Unity code. The tie rules of C# `PriorityQueue` (watershed) and A* (equal-length paths) are not reproduced. The spanning tree uses BFS lengths (same
as the A* lengths with unit cost). Void-aware terrace quantization (range without the void) was NOT done: terrace 0 holds the void.
