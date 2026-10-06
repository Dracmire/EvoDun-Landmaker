# Real sample maps

- `skeleton_heightmap_256.png`: 256x256 height map used as the INPUT of the user's "skeleton mesh" system
  (EDunProcGen `SequenceA`). 8-bit RGBA, grey = height. 32 % of the pixels are pure black (value 0): that is
  VOID around the island, not low terrain (the lowest non-zero value is 17). The island was made by multiplying
  the noise with a circular gradient mask towards the borders and adjusting.

The old system (TopdwnGrid / WFCGen) bakes its height, zone and edge maps as 32x32 matrices: each cell is a block
of 8x8 tiles (zonesize 8 -> 256 tiles). Those are not in this folder yet.
