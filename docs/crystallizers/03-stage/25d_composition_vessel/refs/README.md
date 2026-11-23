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

## `referentes/`: Sea of Stars y Dragon Quest VI (DS)

Capturas de pantalla de los dos referentes 2.5D del paso 5 de PP2 (el vessel), elegidos por [U] el 2026-11-22 (A817–A821 del Proyecto): Sea of Stars (Sabotage, 2023; vista 3/4 sin girar, altura jugable) y Dragon Quest VI (remake de DS, ArtePiazza 2010; escenario en polígonos con sprites, remake del SNES). Sirven para medir su ángulo de cámara con el método del 5F (achique del tile de suelo y cara contra héroe en tiles enteros). Breath of Fire IV quedó descartado (3D completo, cámara de 360°). No sé de qué sitio o vídeo vienen; varias de DQ VI muestran las dos pantallas de la DS a la vez. Las 4 capturas de DQ3 SNES que venían en el mismo paquete ya estaban aquí (`dq3_5f_*`, mismos sha256).

| Archivo | Nombre original | Tamaño | Bytes | sha256 |
|---|---|---|---|---|
| `referentes/sos_01.png` | `Captura de pantalla 2026-11-22 204136.png` | 1273 × 712 | 1 043 521 | `b76adb39eb424e5003bd8b84885a204a0bc34f022c1af794ab2a9eff06fe4fe9` |
| `referentes/sos_02.png` | `Captura de pantalla 2026-11-22 204230.png` | 1262 × 711 | 1 395 425 | `9c4439a5e46f1dd6aff96c5b5e207b6ca9c7db6cf329aca04646a0e8bc05efc9` |
| `referentes/sos_03.png` | `Captura de pantalla 2026-11-22 204354.png` | 1255 × 706 | 1 232 485 | `f4d70667f642e4300b83daec7535933cb81979f9058fa63e36b54f6caa2d7213` |
| `referentes/sos_04.png` | `Captura de pantalla 2026-11-22 204414.png` | 1253 × 707 | 1 466 130 | `2f3f299d489143182a0c02c21a26584c190e32b678107f68a6c42885d3d77095` |
| `referentes/sos_05.png` | `Captura de pantalla 2026-11-22 204434.png` | 1252 × 707 | 1 126 605 | `886f840e4f8a5b7940176b85a2d59683a791aef7ce295319ca49b21e7e398e3a` |
| `referentes/sos_06.png` | `Captura de pantalla 2026-11-22 204555.png` | 1253 × 703 | 1 422 739 | `b9e0ba7210b41768ad9aa40771cec45331cb43293334e5267af4a97f1ef7f1ef` |
| `referentes/sos_07.png` | `Captura de pantalla 2026-11-22 204706.png` | 1257 × 708 | 1 490 055 | `20da7b7b1a3212c6584acaa30d526b55fdc1f7eb326b34ece65105f3b7aeb87b` |
| `referentes/sos_08.png` | `Captura de pantalla 2026-11-22 204831.png` | 1257 × 706 | 1 695 084 | `a4480e753a364e324b7c7a7bdfd553bfc463f34ac78ca4ed2cc8a8328cc3e568` |
| `referentes/sos_09.png` | `Captura de pantalla 2026-11-22 204923.png` | 1262 × 707 | 1 346 001 | `b1f7bcaac0e7a751a96f3a746ecf13be2b0a96cb41bd8e9836eb5974cfc749ae` |
| `referentes/sos_10.png` | `Captura de pantalla 2026-11-22 204950.png` | 1252 × 707 | 1 324 949 | `652e34d9edac9825c0b4aa80a7c307f7dd2dcafd0fbc78970995d5e6cd767117` |
| `referentes/dq6ds_01.png` | `Captura de pantalla 2026-11-22 205032.png` | 796 × 597 | 726 611 | `00d5f0834b13fcc61505e88c8de335d213842be00d13a8440a67a8d0b0103765` |
| `referentes/dq6ds_02.png` | `Captura de pantalla 2026-11-22 205130.png` | 805 × 663 | 512 881 | `5b60a0dd6b2c13c7e98ba41ef81776a9bdd90ed14e2e9e0d214fe61799c1bfcf` |
| `referentes/dq6ds_03.png` | `Captura de pantalla 2026-11-22 205204.png` | 797 × 602 | 759 415 | `9711e65e377482d2a86675601d01382ce2d81526ddf22a8b5967f6d875257509` |
| `referentes/dq6ds_04.png` | `Captura de pantalla 2026-11-22 205236.png` | 455 × 706 | 425 054 | `87194c2ae9be085d9b60021a96034ac4d8e2432c8ce3c135b39dc9acb7fdf744` |
| `referentes/dq6ds_05.png` | `Captura de pantalla 2026-11-22 205335.png` | 1257 × 662 | 961 289 | `d35791b278ae1cdbba22ab4b87357ce0a2faa042931f77a51fe6aca1d5c672d0` |
| `referentes/dq6ds_06.png` | `Captura de pantalla 2026-11-22 205414.png` | 627 × 588 | 305 264 | `f4e495e0ac121083c25f2aa88e0617519e72f947fd6905eb8661e68a3a292e82` |
| `referentes/dq6ds_07.png` | `Captura de pantalla 2026-11-22 205859.png` | 1265 × 705 | 1 171 366 | `11dffbf04917aa93b326bd3a23f12cf55d5358f516e8798e5f8991ac68281baf` |
| `referentes/dq6ds_08.png` | `Captura de pantalla 2026-11-22 210302.png` | 1262 × 657 | 1 117 491 | `4a6aff217f0ccc329ef551e38827b8608d75e3c424c20c6410668636d4d3cdf8` |
| `referentes/dq6ds_09.png` | `Captura de pantalla 2026-11-22 210340.png` | 1257 × 703 | 1 095 335 | `d49db2939d0b8d9b7882fd92aa463aac2ca583fedae3e26f8ed2ee8264d3e9c9` |
| `referentes/dq6ds_10.png` | `Captura de pantalla 2026-11-22 210454.png` | 1255 × 651 | 1 185 792 | `d5910abcaee2d909cb43fdf877e7d982755e4047f68ed557b1d7f8e1b9d62fcc` |
| `referentes/dq6ds_11.png` | `Captura de pantalla 2026-11-22 211044.png` | 1247 × 700 | 980 826 | `103e7ec96231e22f17d866e6790af01d725fc6be3291caabab404fdc0e2d8f99` |
| `referentes/dq6ds_12.png` | `Captura de pantalla 2026-11-22 211110.png` | 1272 × 707 | 1 034 924 | `47a291b049c1858a8d3cc0f356a8055c76f6330e20daf513d1138ad9c00026ed` |
| `referentes/dq6ds_13.png` | `Captura de pantalla 2026-11-22 211238.png` | 1252 × 705 | 1 213 051 | `4bdf07cb429c2831827839383c20b6caf7edbcdaf4580b527760e7ab5f5333a7` |
| `referentes/dq6ds_14.png` | `Captura de pantalla 2026-11-22 211350.png` | 1247 × 707 | 1 105 859 | `cc30827fe128aa609060b6d61b76c69bd6e7dfaffc6eedbc71e7398d3a46ae5a` |
| `referentes/dq6ds_15.png` | `Captura de pantalla 2026-11-22 211529.png` | 477 × 708 | 583 756 | `e9d4dfb560df142b70860962762fc7dd18d349b7eef228694329dd2d3f725510` |
| `referentes/dq6ds_16.png` | `Captura de pantalla 2026-11-22 211545.png` | 477 × 712 | 592 978 | `cd4f3ef7454dd080b8ac3352fe54c0c9e07b66e3935cd7f2d834c006d7577b87` |

Copias sin cambios.
