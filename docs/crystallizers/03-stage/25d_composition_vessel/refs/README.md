# 25d_composition_vessel/refs/

Insumos del pase «25d composition vessel» (índice en `../README.md`). Cada uno con su procedencia; los originales no se tocan.

## `xchengcode_fig1_pipeline.jpg`

Figura 1 del repo XChengCode/Synthesis-of-2.5D-Models-Based-on-Monocular-Images (autor según su README: Boyuan Cheng). Es el esquema del proceso: imagen → profundidad → K-means en capas → relleno de lo oculto → recorte → apilado 2.5D.

- Procedencia: https://github.com/XChengCode/Synthesis-of-2.5D-Models-Based-on-Monocular-Images/blob/main/figure/1.jpg (commit `4c37fbb`, 2023-05-19). Copia sin cambios: 800 × 315 px, 37 303 bytes, sha256 `232d7da769ff3797f100b2dc83e41401aabbcfad00420f85f8e2ff58ddad3f94`.
- Por qué está aquí: [U] lo fijó como la referencia de la lógica del Pase 2.5D («lo necesario es el esquema en la imagen», 2026-11-21). De ese repo se toma el esquema; no se copian su código, sus pesos ni sus imágenes.
- El repo de origen no trae archivo de licencia.

## `dq3_dreamers_5f_snes.png`

Mapa de Dreamer's Tower (Torre del Soñador) 5F, versión SNES: el piso de arriba del piso de prueba 4F. Lo aportó [U] el 2026-11-22 como imagen de entrada de PP2 y PP3 (`PASE_2_5D.md` del Proyecto, A693); no sé de qué sitio viene el archivo.

- Copia sin cambios del archivo que [U] subió (`DQ3_-_Dreamer_5f_SNES.png`): 463 × 876 px, RGBA con alfa 255 en todos los píxeles, 48 colores distintos, 97 899 bytes, sha256 `460cd57927f3409c2a6c3b0157aef74b35194ce316e645bd0923891eeb3c03b6`.

## `dq3_dreamers_5f_8bit.png`

Mapa de Dreamer's Tower 5F en la versión de 8 bits: el mismo piso que `dq3_dreamers_5f_snes.png` (A764 del Proyecto). Lo aportó [U] el 2026-11-22 junto con el de SNES para comparar qué añade la versión de 16 bits (altura); es el «esquema de 8 bits» que la variante E de PP2 no tenía (`../pp2/guias/E/RESULTADO_PP2_E.md`). No sé de qué sitio viene el archivo.

- Copia sin cambios del archivo que [U] subió (`Captura de pantalla 2026-11-22 031005.png`): 578 × 742 px, RGBA con alfa 255 en todos los píxeles, 4 183 colores distintos, 201 600 bytes, sha256 `5bef370af1bdffcfbfc551d30ada541bbc733e7f2d7501536d9f5d6342544870`.
- Es una captura de pantalla, no un volcado del juego: trae un borde negro, el rótulo «5F» cortado arriba y las marcas D, E, F, G, 9 y 10 del sitio de origen sobre el mapa.

## `dq3_5f_snes_cap1.png`, `dq3_5f_snes_cap2.png`, `dq3_5f_switch_cap1.png`, `dq3_5f_switch_cap2.png`

Cuatro capturas de pantalla del 5F de Dreamer's Tower con el grupo del héroe, que aportó [U] el 2026-11-22 para extraer la altura: héroe contra tiles del suelo y muros contra héroe. Dos son del DQ3 de SNES (pantalla 4:3 con bandas negras) y dos de la versión de Switch de 16 bits que [U] identificó como «DQ3 - Seeds of Salvation» (pantalla más ancha, banda azul a la izquierda). No sé de qué sitio o vídeo vienen; se ven algo borrosas, como fotogramas de vídeo.

| Archivo | Nombre original | Tamaño | Bytes | sha256 |
|---|---|---|---|---|
| `dq3_5f_snes_cap1.png` | `Captura de pantalla 2026-11-22 133112.png` | 1262 × 707 | 987 801 | `c3d270fc94c9d9e4641834d2b1ec7337f39d90392cb552a4213a3161acf3314b` |
| `dq3_5f_snes_cap2.png` | `Captura de pantalla 2026-11-22 133153.png` | 1303 × 701 | 1 048 278 | `834d5993ac777682f0d0f2dc987e2e99ab23cbca9997fd699f9daf5425ea98ea` |
| `dq3_5f_switch_cap1.png` | `Captura de pantalla 2026-11-22 133818.png` | 1275 × 693 | 1 212 151 | `8144fc8a6cb8e42c566ca9d14c43f140b29111750d3a40bc126f7df6aff30eed` |
| `dq3_5f_switch_cap2.png` | `Captura de pantalla 2026-11-22 133838.png` | 1262 × 706 | 1 173 325 | `d49ab2dee4cd89aa4daefd0de9334274338b22ccc9f71a035a0ae6481b7d7fea` |

Copias sin cambios (RGBA). Una lectura a mano de estas capturas (tile, héroe y cara de muro) está en el Registro del Proyecto, A789–A791; no es una medición de este repo.
