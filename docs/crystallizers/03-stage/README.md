# Crystallizer 3 - Stage (framing and dressing)

## 1. Status

DESIGN DRAFT, not approved. No code. Written 2026-10-09 after a day of throwaway mocks (section 8).

## 2. Goal

Phase 3 of the room-type pipeline (crystallizer 2): every room type gets a FRAMING and a DRESSING so the map reads
like a Sea of Stars scene, while it stays walkable. The viewer does not make final art. It outputs an **art-piece
contract**: which piece goes where (kind, tiles, facing, size class, material), drawn as placeholders. Unity
replaces each placeholder with a piece of a kit.

The crystallizer is judged by "does every piece have a clear place, and can we walk the map", not by how pretty the
viewer looks.

## 3. References

Main reference: **Sea of Stars** (Sabotage Studio, 2023). It has the height the other references lack.
- 2D pixel art with dynamic lighting. It is not HD-2D in the Square Enix sense (2D sprites in a 3D world).
  Dynamic lighting was the starting point of development and asset production was made to fit its technical needs
  (interview below): the technique fixed the art contract first.
- Height is drawn in the art (tall camera-facing cliffs) and lived through traversal: jumping, swimming, shimmying
  along ledges, later a grappling hook. Levels are "small pockets"; the design is grid-based.
- Camera: frontal 3/4 view from above, south faces visible (our reading of the game; to confirm on screenshots).
- Sources: [MobileSyrup interview with Thierry Boulanger](https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/),
  [MegaVisions, The Art of Sea of Stars](https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/).

Secondary references (composition): Octopath Traveler and Dragon Quest HD-2D remakes. Scenes are small stages: one main
block (platform, retaining wall, stairs at the front), a dark blurred foreground frame (tree tops, balustrade), a hazy
darker background. Unexplored 2: stage modelling.

Repos reviewed (2026-10-09). None generates stylised cliffs procedurally; they all use hand-made kits.

| Repo | What it brings | Licence |
|---|---|---|
| [floatingsnowflake/Unity-simple-HD2D](https://github.com/floatingsnowflake/Unity-simple-HD2D) | Unity, perspective FOV 45, 90-degree camera turns, occlusion fade of what hides the player, modular block kit per material (fill / edge / outer corner / inner corner) placed with TileWorldCreator (paid) | MIT |
| [Meowa-AI/HD2D-template-meowa](https://github.com/Meowa-AI/HD2D-template-meowa) | Godot: camera FOV 30 at about 20 degrees, DOF far 51/20 near 22/5 amount 0.12, fog with aerial perspective, lilac ambient for shadows, backdrop quad far behind, terrain textured with dual-grid (16-tile) alpha layers per biome | not shown |
| [GSansigolo/SimpleHD2D](https://github.com/GSansigolo/SimpleHD2D) | Godot GridMap of blocks and stairs, camera on a spring arm with 90-degree turns, vignette shader | not shown |
| [EMESTAY/Lib2DHD](https://github.com/EMESTAY/Lib2DHD) | Rust / Macroquad camera framework: HD-2D mode is orthographic, pitch 25, yaw 45; radial blur and vignette; no terrain, no composition | MIT or Apache-2.0 |
| [Smurillopng/TCC-HD2D-Valquiria](https://github.com/Smurillopng/TCC-HD2D-Valquiria) | A full Unity game in the Octopath style; visual reference only | not shown |
| [Maxlm4/Level_Editor-3D_Tilemap_in_Unity](https://github.com/Maxlm4/Level_Editor-3D_Tilemap_in_Unity) | Heightmap to 3D level, texture maps, foliage by colour map; code not published | not shown |
| [puszke/Unity-Sprite-stacking](https://github.com/puszke/Unity-Sprite-stacking) | Sprite stacking (a fake 3D object from ordered 2D slices); the idea is reused for the stacked-slice mocks, no code copied | not shown |

## 4. Decisions

- **D1** (2026-10-09) Sea of Stars is the main reference, because it has height.
- **D2** (2026-10-09) The stage is a phase 3 over the WHOLE room-type pipeline: Cake (created with Sea of Stars in mind),
  Diorama (the ideal case), Ascension (walls can be exaggerated to frame). It works on room instances, which the normal
  map does not have.
- **D3** (2026-10-09) The output is a contract of art pieces, not a pretty render. In exchange the map must be
  traversable (R1).
- **D4** (2026-10-09) The camera makes little difference (low orthographic vs emulated perspective measured in the mocks).
  Stay orthographic; perspective is for Unity. The real limit is the art.
- **D5** (2026-10-09) Every crystallizer gets a README in `docs/crystallizers/`.

## 5. Design (draft, to be agreed point by point)

### Requirements
- **R1 Traversal.** The map can be walked in the viewer at play scale: a walker moves over the walkable graph (the same
  edges as `E.route`), the camera follows it with the stage preset. No piece blocks a walkable tile, a ramp or a door;
  on walkable tiles only floor-level pieces (paving, grass, rugs).
- **R2** Same pieces and placeholders in Box, A and B.
- **R3** Switch off = identical pixels (pixel regression).
- **R4** Height exaggeration is visual only (a stage height multiplier); walking, stake and route do not change.

### Camera
- New preset "Stage 3/4": yaw 0, orthographic, pitch to measure against Sea of Stars screenshots (between 40 and 55).

### Rules per type
- **Cake.** Rings are ledges. Each camera-facing ring edge gets a cliff piece sized by its jump; the top edge gets a lip
  piece by material. Ramps and corridors become climb points or stairs (the mapping is open, Q4).
- **Diorama.** The pocket becomes a composed stage: backdrop band behind (by distance, darker and hazier), the fragment
  sharp, foreground frame pieces on the near edge of the disc (tree, rock, column), a stairs slot at the main exit,
  retaining-wall pieces on the fragment edge.
- **Ascension.** Walls become the frame: tall on the faces away from the camera, low with the existing Zelda cut on the
  faces toward it. Wall pieces by chain position: straight, outer corner, inner corner, end. A door slot on every
  transition.

### Thickness rules (from the mocks)
Nothing has a constant thickness; every piece takes it from a local measure the data already has:
- cliff: base flare, strata count and edge wobble grow with the jump;
- land over void: an underbelly that tapers with the distance to the edge;
- lip: by the material of the top (grass hangs over, rock does not);
- bridges are OBJECTS (deck, piers by span), not terrain: the stacked-slice bridge did not read.

### The contract (draft list of piece kinds)
- Terrain edges: cliff (jump class low / mid / high), retaining wall (masonry), lip (grass / rock / sand / snow),
  underbelly (void), each with outer and inner corner variants (16-tile dual-grid style, as in the references).
- Transitions: ramp, stairs, climb point, ledge drop, door.
- Framing: foreground frame piece, backdrop band, wall-chain piece (Ascension).
- Props: vegetation clump, rock, light source (torch, brazier). Floor-level only on walkable tiles.
- Every slot: kind, tile(s), facing (N / E / S / W or corner), size class, material, room id, room type.

## 6. Viewer vs Unity

- Viewer: computes the slots, draws placeholders (flat colour, outline, a letter per kind), the walk mode, and the
  composition as layers (darker, hazier backdrop; foreground frame). Exports the slots (format open, Q3).
- Unity: a kit piece per slot (modular prefabs or RuleTiles, dual-grid textures), dynamic lighting (half of the Sea of
  Stars look), DOF, character sprites.

## 7. Verification

Nothing yet. Fixed test set as always: real map Default and Balanced types, Snake Mountain surface.

## 8. Mocks (2026-10-09, throwaway, scripts outside the repo)

1. Post-process look over the A render (texture, cast shadow, rim light, tilt-shift, vignette). Dropped: it is the old
   builder with taller walls; no post-processing (user).
2. Terrace height at the slider maximum (2.5), A and B. Still "a map with some depth", not relief.
3. Stacked slices (sprite-stacking idea applied to terrace contours) with a profile (flared base, recessed body,
   overhanging lip). Real relief, but it reads as "polygon terraces".
4. Thickness rules on a synthetic two-island scene: cliff by jump, underbelly by depth from the edge and lip by material
   read well; the bridge failed (see section 5).
5. Composed stage on a synthetic Diorama-like fragment: backdrop hills, sharp platform with masonry and moss, dark blurred
   foreground conifers. Low orthographic camera vs emulated perspective: almost no difference (D4). The closest so far.
   The real Diorama pocket seen from a low camera does not work (it was designed for Iso).

## 9. Known limits and open questions

- The viewer cannot make the art; it can only place it.
- **Q1** Pitch of the "Stage 3/4" preset.
- **Q2** Final list of piece kinds.
- **Q3** Where the slots are stored (manifest or a separate export for Unity).
- **Q4** Ramps and stairs vs climb points and ledge drops (a game decision).
- **Q5** Does the walk mode need a sprite, or is a marker enough.
- **Q6** How the Diorama pocket bands change for the frontal camera (today they assume Iso).
