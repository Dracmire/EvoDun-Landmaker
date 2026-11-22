# research/pase_2_5d/

Material de referencia del Pase 2.5D (la teoría de [U] está en `PASE_2_5D.md` del Proyecto EvoDun en claude.ai).

## `xchengcode_fig1_pipeline.jpg`

Figura 1 del repo XChengCode/Synthesis-of-2.5D-Models-Based-on-Monocular-Images (autor según su README: Boyuan Cheng). Es el esquema del proceso: imagen → profundidad → K-means en capas → relleno de lo oculto → recorte → apilado 2.5D.

- Procedencia: https://github.com/XChengCode/Synthesis-of-2.5D-Models-Based-on-Monocular-Images/blob/main/figure/1.jpg (commit `4c37fbb`, 2023-05-19). Copia sin cambios: 800 × 315 px, 37 303 bytes, sha256 `232d7da769ff3797f100b2dc83e41401aabbcfad00420f85f8e2ff58ddad3f94`.
- Por qué está aquí: [U] lo fijó como la referencia de la lógica del Pase 2.5D («lo necesario es el esquema en la imagen», 2026-11-21). De ese repo se toma el esquema; no se copian su código, sus pesos ni sus imágenes.
- El repo de origen no trae archivo de licencia.

## `dq3_dreamers_5f_snes.png`

Mapa de Dreamer's Tower (Torre del Soñador) 5F, versión SNES: el piso de arriba del piso de prueba 4F. Lo aportó [U] el 2026-11-22 como imagen de entrada de PP2 y PP3 (`PASE_2_5D.md` del Proyecto, A693); no sé de qué sitio viene el archivo.

- Copia sin cambios del archivo que [U] subió (`DQ3_-_Dreamer_5f_SNES.png`): 463 × 876 px, RGBA con alfa 255 en todos los píxeles, 48 colores distintos, 97 899 bytes, sha256 `460cd57927f3409c2a6c3b0157aef74b35194ce316e645bd0923891eeb3c03b6`.
