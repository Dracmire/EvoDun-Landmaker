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
- **D6** (2026-10-09, REPLACES D4) The camera is part of each crystallizer, not a global choice. For the Stage it was MEASURED
  (the reviewer's throwaway code, not in the repo; technique A; share of the screen pixels that are walls, at the same px per tile):

  | scene | Oblique 50 ortho | Low 25 ortho | Perspective FOV 30, pitch 25 | Classic 3/4 oblique (ground 1, height 1) |
  |---|---|---|---|---|
  | Shrine-Pier, camera from the sea (yaw 90) | 14.6 % | 24.5 % | 22.0 % | 18.9 % |
  | Shrine-Pier, profile (yaw 0) | 7.5 % | 18.6 % | 17.2 % | 6.4 % |
  | Snake Mountain surface (5 terraces) | 3.8 % | 9.2 % | 7.2 % | 6.3 % |
  | real map, Balanced types, Cake 82 / Diorama 31 / Ascension 57 (Cake + Ascension walls on, 55 px per tile; one value per room) | 4.1 / 1.8 / 2.5 % | 8.7 / 5.7 / 10.1 % | 7.7 / 8.4 / 11.9 % | 6.6 / 2.8 / 3.2 % |

  Configuration notes: perspective = near ground drawn 2.9x bigger than far at that framing. The low camera was measured at pitch 25; Cam 4 of the bank is Low 28 (not re-measured). NOT measured: walkable tiles hidden, painter order under
  perspective, technique B, taller terraces. The Stage camera is **Cam 6** (perspective, FOV 30, pitch 25, yaw 0). Its yaw will come from the main semantic relation of the scene (Shrine-Pier reads OVERLOOKS from the sea: Pier in front,
  Shrine behind); that is the next step, until then Cam 6 is at yaw 0. **Cam 7** (Classic 3/4, oblique projection) is noted as the candidate TACTICAL camera (another mode, not the Stage).
- **D7** (2026-10-09) The cameras are a fixed, DISCRETE bank, Cam 1-7, nothing custom, usable by every crystallizer ([`../README.md`](../README.md) "Camera bank"). The old preset ids keep working (tests and the manifest use them);
  the manifest `viewer` block takes an optional `camera`.
- **D8** (2026-10-09) The fixed test set follows the three core examples: numeric (real map, Default and Balanced types), semantic landmarks (Shrine-Pier) and semantic macroform (Snake Mountain surface). The semantic numeric world is the
  evolution of the vanilla (Perlin) one. The DATA limits verticality as much as the camera: the rooms of the real map have 3-4x less wall per screen than Shrine-Pier with any camera (D6 table).

## 5. Design (draft, to be agreed point by point)

### Requirements
- **R1 Traversal.** The map can be walked in the viewer at play scale: a walker moves over the walkable graph (the same
  edges as `E.route`), the camera follows it with the stage preset. No piece blocks a walkable tile, a ramp or a door;
  on walkable tiles only floor-level pieces (paving, grass, rugs).
- **R2** Same pieces and placeholders in Box, A and B.
- **R3** Switch off = identical pixels (pixel regression).
- **R4** Height exaggeration is visual only (a stage height multiplier); walking, stake and route do not change.

### Camera
- Cam 6 "Stage" of the camera bank (D6, D7): PERSPECTIVE, FOV 30, pitch 25, yaw 0 (the yaw will come from the semantic relation of the scene); true division by depth around the ground point under the screen centre at the focus height. Replaces the "Stage 3/4" orthographic preset of the first draft.

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

No Stage code yet. What exists for it is the camera bank (D7): Cam 6 and Cam 7 are implemented and measured (z-buffer order, picking, face culling, perspective strength: CLAUDE.md limitation 15; `node tools/test_cams.js`; screenshots with `tools/verify.sh shots --extra pocket:31@stage+play --extra shrine@classic+play`). Fixed test set = the three core examples (D8): real map Default and Balanced types, Shrine-Pier, Snake Mountain surface.

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
- **Q1** (closed by D6) Pitch of the Stage camera: 25, as measured.
- **Q2** Final list of piece kinds.
- **Q3** Where the slots are stored (manifest or a separate export for Unity).
- **Q4** Ramps and stairs vs climb points and ledge drops (a game decision).
- **Q5** Does the walk mode need a sprite, or is a marker enough.
- **Q6** How the Diorama pocket bands change for the frontal camera (today they assume Iso).

## 10. Camera contract

- **Made for**: **Cam 6 Stage** (perspective, FOV 30, pitch 25, yaw 0 for now; the yaw will come from the main semantic relation of the scene, D6). At play scale (about 55 px per tile) the camera dollies with the zoom, so the strength of the
  perspective on screen is the same at any zoom.
- **Candidate tactical camera**: **Cam 7 Classic 3/4** (oblique projection, ground scale 1, height scale 1, yaw 0), another mode, not the Stage (D6).
- **Also usable**: Cam 1-5 (orthographic) as in the other crystallizers; the Pocket and the Cake / walls figures of crystallizer 2 were made for Cam 1.
- **What does not work yet / how it was measured**: see the camera bank section of [`../../../CLAUDE.md`](../../../CLAUDE.md) (known limitation 15) and the measurements of the PR that added the bank; the Diorama pocket was composed for Cam 1 (Q6).
