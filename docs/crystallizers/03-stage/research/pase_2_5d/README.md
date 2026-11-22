# research/pase_2_5d/

Material de referencia del Pase 2.5D (la teoría de [U] está en `PASE_2_5D.md` del Proyecto EvoDun en claude.ai).

## `xchengcode_fig1_pipeline.jpg`

Figura 1 del repo XChengCode/Synthesis-of-2.5D-Models-Based-on-Monocular-Images (autor según su README: Boyuan Cheng). Es el esquema del proceso: imagen → profundidad → K-means en capas → relleno de lo oculto → recorte → apilado 2.5D.

- Procedencia: https://github.com/XChengCode/Synthesis-of-2.5D-Models-Based-on-Monocular-Images/blob/main/figure/1.jpg (commit `4c37fbb`, 2023-05-19). Copia sin cambios: 800 × 315 px, 37 303 bytes, sha256 `232d7da769ff3797f100b2dc83e41401aabbcfad00420f85f8e2ff58ddad3f94`.
- Por qué está aquí: [U] lo fijó como la referencia de la lógica del Pase 2.5D («lo necesario es el esquema en la imagen», 2026-11-21). De ese repo se toma el esquema; no se copian su código, sus pesos ni sus imágenes.
- El repo de origen no trae archivo de licencia.
