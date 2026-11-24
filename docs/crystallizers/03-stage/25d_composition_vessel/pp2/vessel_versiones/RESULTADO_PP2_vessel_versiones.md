# PP2 paso 5g · 2 perfiles × 3 versiones del vessel

Base `c8349e7`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Las guías E y `alturas/` no se tocaron (hashes comprobados al empezar, coincidían). Script y entorno fuera del repo. Sin veredicto: son lecturas.

## Qué hice

Perfiles: **P1** (3 límites: herradura 16,23,10,5,4,6,11,24 · norte 0,3,17+1,18+2 · islas 19,20,25) y **P2** (2 límites: herradura + 0,3 · islas 19,20,25,17+1,18+2). El tope de cada zona es ×1,38 sobre el piso de la guía E de esa zona. Se conserva de 5f el borde externo cuadriculado (empuje S5 con el grosor del SNES, el wrapping arrastrado, el mismo código en las tres versiones) —**marcado como positivo por [U]**—, el muro = techo, la cara como abultamiento de perspectiva, los puentes fuera durante el crecimiento y recolocados al final, la caja de Chebyshev igual en 4 direcciones y el mismo número de vuelta para los pares espejo.

- **V1** (caras y pilares/objetos pegados a ellas eliminados → espacio libre): las salas parten del piso de la guía E, crecen por SDF sobre el espacio libre y se detienen en el muro mínimo o en el tope.
- **V2** (SDF sobre el piso de la guía E con las caras aún como muro): expansión **externa** (solo aristas que miran al muro externo, hasta la mitad del tope de la zona) y **expansión interna** (aristas que miran a otras salas, con el resto del tope). **V2a**: las caras vuelven delante de los techos y ganan a las salas crecidas (muro final = techo + cara). **V2b**: el bloque techo+cara es empujado hacia fuera; se para en la línea media con el grosor mínimo de techo de 1 tile y la cara queda al sur. Colores: techo, cara (azul acero), cara recuperada (cian, V2a), muro empujado (rojo, V2b).
- **V3**: primero el borde externo como en 5f; muros en los pies de las caras (las 2 últimas filas de cada tramo de cara, 1 tile de grosor = 2 celdas, rectas); los muros E/O se reducen a la línea media; los paralelos sin sala ni pasillo entre ellos se funden en uno (19 fusiones, entre ellas hub 19–Y10 y hub 20–grupo 11); el lienzo negro con silueta y muros mínimos está en `V3_limites.png` (una sola imagen, no depende del perfil). Luego las salas crecen por zona dentro de su compartimento hasta el muro mínimo o el tope; los pasillos, al final.

La línea amarilla de las imágenes es el muro mínimo (unión de las capas de carve entre salas, solo a ≤ 4 celdas de algún piso; en V3 más los muros de los pies). Gris = silueta antes, cian = después.

## Lecturas

| | V1 | V2a | V2b | V3 |
|---|---|---|---|---|
| Piso de salas P1 / P2 | 2465 / 2465 | 2244 / 2281 | 2448 / 2434 | 2418 / 2472 |
| Celdas distintas P1 vs P2 (todo el plano, con puentes) | **0** | 37 | 45 | 56 |
| Zonas P1, razón sobre la guía E (herradura / norte / islas) | 1,35 / 1,42 / 1,47 | 1,27 / 1,29 / 1,22 | 1,38 / 1,38 / 1,38 | 1,40 / 1,30 / 1,34 |
| Zonas P2 (herradura / islas) | 1,38 / 1,41 | 1,29 / 1,28 | 1,40 / 1,32 | 1,45 / 1,29 |
| Sala con menor / mayor razón (P1) | Y14 0,92 / Y16 1,74 | Y12 1,00 / Y16 1,74 | Y14 0,75 / Y16 1,74 | Y14 0,67 / Y16 2,21 |
| Dobles muros (≥ 4 celdas con los pisos pegados a la línea) | 0 | 0 | 0 | 0 |
| Escalones de 3 celdas entre pisos pegados (P1 / P2) | 5 / 5 | 4 / 4 | 9 / 9 | 0 / 0 |
| Contactos diagonales nuevos | 0 | 0 | 0 | 0 |
| Parejas bajo el muro mínimo | 0 | 0 | 0 | 0 (P2: 2 celdas quitadas por la red de seguridad) |
| Muro externo más delgado que el SNES | 0 salas | 0 | 0 | 0 |
| Dientes (criterio 5e; guía E = 25) | 25 | 63 / 63 | 63 / 61 | 61 / 54 |
| Muro muerto a > 3 celdas de un piso (techo + cara) | 437 | 524 / 522 | 466 / 466 | 416 / 363 |
| Silueta, columnas (antes → después; 56 →) | 58 | 58 | 58 | 60 |
| Error de espejo, suma de celdas (guía E = 257) | 381 | 414 / 407 | 459 / 449 | 440 / 439 |
| Puentes: cada uno une las mismas dos salas | sí | sí | sí | sí |
| A\* (I 114, J 208, cofre2 138 pasos) y G cerrada | igual a la guía D | igual | igual | igual |

Salvo donde se indica P1 / P2, las dos filas dan lo mismo. Puentes (celdas antes → después, P1): V1 Y12 49→49, Y13 49→50, Y14 24→22, Y15 24→22, X9 25→26; V3 Y12 44, Y13 48, Y14 16, Y15 16, X9 20 (detalle por columna en el json).

**Muro mínimo como línea (`lineas_del_muro_minimo` en el json).** V1/V2: 826 celdas en 11 tramos; V3: 954 celdas en 40 tramos (los muros de los pies y los de la línea media quedan en piezas separadas). Ninguna celda de piso de sala cae sobre la línea (0); sí 103 / 96 / 40 celdas de puente o gate que la cruzan (por diseño). **Hoyos** (compartimentos de muro muerto cerrados por la línea): V1/V2 **1** (1 celda), V3 **5** (15 celdas). **Escalones** (celdas de la línea con grosor de 3): V1/V2 270, V3 221. **No llegaron a 0**: quedó una condición dura sin cumplir en las 8 imágenes (hoyos y escalones de la línea), aunque la métrica de dobles muros y de escalones entre pisos pegados es 0 en V3.

**V2 en concreto.** V2a: 171–188 celdas de cara recuperadas por las salas; las salas del borde sur pierden ganancia (las zonas bajan a ×1,22–1,29 en vez de ×1,38). V2b: las salas consumen 564–578 celdas de techo, solo 6 celdas de muro empujado aparecen fuera del techo reclamado (el espacio libre no deja más), y el tope ×1,38 se alcanza (×1,377–1,383 en P1). **V3 en concreto**: 311 celdas de muro en los pies, 334 de línea media, 433 de línea fusionada en los pies, 19 muros paralelos fusionados; 2256 celdas de techo y cara quedan como espacio libre.

## Lo que no coincidió con la predicción de [R]

- **P1 ≠ P2 en las 4 variantes: no se cumple en V1 (0 celdas distintas).** Causa: en V1 todas las zonas se detienen en la vuelta d = 1 con ambos perfiles (con d entero, 1,38 queda más cerca de d = 1 que de d = 2 en las tres zonas: ×1,35 / 1,42 / 1,47 en P1 y ×1,38 / 1,41 en P2), y los pisos de d = 1 dependen solo de la región de cada sala, no de la zona. No se forzó.
- V1 con salas más pequeñas que 5f: **sí** en el total (2465 celdas de sala frente a 3117 de 5f, en los dos perfiles; en 5f las caras eran piso de la sala de delante y aquí son espacio libre).
- V2a pierde ganancias en el borde sur: sí (×1,22–1,29). V2b la más pareja: sí (×1,38 en las tres zonas de P1), pero con 9 escalones de 3 celdas, la peor cifra.
- V3 con los muros mínimos más limpios (0 huecos): **no**: 5 hoyos y 221 celdas de escalón en la línea (las menos de escalones entre pisos, 0, sí). Un solo muro entre 19 y 10 y entre 20 y 11: sí (fusionados), pero el mayor crecimiento aparece ahí (Y16 ×2,21, hub 24 ×1,88).

## Archivos

`P1_V1.png`, `P1_V2a.png`, `P1_V2b.png`, `P1_V3.png`, `P2_V1.png`, `P2_V2a.png`, `P2_V2b.png`, `P2_V3.png`, `V3_limites.png`, `comparacion.png` (2 filas P1/P2 × 4 columnas V1, V2a, V2b, V3, misma escala), `vessel_versiones.json`, `HASHES_vessel_versiones.txt` (dos corridas idénticas). El estiramiento ×1,17, la escala ×2 y las alturas van en otros pasos.
