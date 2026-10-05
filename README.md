# EvoDun-Landmaker
Procedural generation for the EvoDun game.

## Crystal viewer (materialization test)
A web viewer that takes the same height data and *crystallizes* it with several techniques so
they can be compared for readability. Open `index.html` (works from `file://`, no dependencies).

- **Box**: one column per tile (reference).
- **A · Contour polygons**: per-level tile outlines over the whole slice → simplify → Chaikin → extruded slabs.
- **B · Distance field**: per-level signed distance field → blur → marching squares.

Shared style pass (flat colour per level, cliff gradient, outlines), terrace + micro-step shaping,
stair passes between terraces, walk-region overlay, incursion veil, preset camera angles.
Sources: Snake Mountain pack (`data/snake_mountain.json`), a noise stand-in, or any image (1 px = 1 tile).

Pack format `evodun-pack/0.1`: `width`, `height`, row-major `elevation`, optional `masks`, `markers`.

Rebuild after editing `src/` or `data/`: `python3 tools/build.py` (writes `data/packs.js`, `index.html`, `dist/viewer.html`).
