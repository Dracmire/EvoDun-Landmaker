# PP2 paso 8b · pase 1 corregido: lo que sobra se cuenta solo fuera de la huella, y la cara sur va como capa propia

Base `f710409`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. Antes de empezar comprobé los hashes de `vessel_altura_c/`, `vessel_profundidad/` y `vessel_export/`: coinciden. Reusé la escena, las cámaras de las 5 tomas a 71°, los mapas de profundidad guardados (bandas recalculadas con el mismo K-means, `seed 0`), los buffers de ids y la retroproyección del paso 8; no se volvió a pasar la red. Sin veredicto: son lecturas.

## Qué hice

- **Objetos y huellas** (planta de `vessel_altura_c`, en celdas): **bloque alto** = franja X4–X5–X6 + hub 25: pisos de nivel 1 (619), muescas y gates de nivel 1, las escaleras que no son Y12 ni Y13 (73 celdas; las leí como peldaños apoyados en el bloque), los muros de 14 que se paran sobre él (178) y la baranda; huella total 870 celdas. **Rampas** = Y12 e Y13 (peldaños y muesca, 63 celdas), restadas del bloque. **Muros comunes** = muros de 7 (862 celdas). El piso de nivel 0 no se proyecta.
- **Regla:** una subcelda de piso blanco **sobra (rojo)** si más de la mitad de sus píxeles retroproyectados vienen de un objeto cuya huella no la contiene (mismo criterio de mayoría que el paso 8). Un píxel de piso de nivel 1 que cae dentro de la huella del bloque ya no sobra.
- **Capas:** rojo = sobra (A); naranja = cara sur (B: píxeles de las caras sur del bloque y de los muros que caen dentro de su huella; los muros son 2 celdas de espesor, así que se permite sobre su huella gris); amarillo = techo corrido (piso del bloque dentro de su huella); azul = rampas 12 y 13 (no cuentan como sobra). Las caras este y oeste solo cuentan si caen fuera de la huella.

## Lecturas

**Rojo por toma** (subceldas, de 15 528 de piso; origen: muro común / bloque alto / muro sobre el bloque / baranda) y diferencia con el paso 8:

| Toma | Rojo | Muro común | Bloque alto | Muro sobre el bloque | Baranda | Paso 8 | Razón |
|---|---|---|---|---|---|---|---|
| global | 2433 | 1386 | 562 | 331 | 154 | 5348 | 0,46 |
| g23 | 1108 | 676 | 169 | 221 | 42 | 1624 | 0,68 |
| g10 | 1191 | 457 | 394 | 280 | 60 | 2726 | 0,44 |
| g04 | 1818 | 990 | 422 | 346 | 60 | 3214 | 0,57 |
| g24 | 1367 | 810 | 203 | 302 | 52 | 1803 | 0,76 |

**Cara sur (naranja), ancho en celdas.** Bloque alto: global 2,40 (6 tramos; medio 3,10, abajo 1,00), g23 0,88, g10 1,36, g24 1,21; en g04 no hay cara sur del bloque a la vista (el héroe está sobre su borde norte). Muros comunes (43 tramos en la global): 1,57 en la global (arriba 2,36, medio 1,28, abajo 1,04); locales 0,09 a 1,53.

**Techo corrido** (corrimiento al norte del piso del bloque, celdas, por fila de pantalla): global medio 2,67 y abajo 1,39 (ahí cae hub 25); g23 medio 2,88, abajo 2,12; g10 arriba 4,25, medio 3,31, abajo 2,27; g04 abajo 1,83; g24 medio 3,03, abajo 2,27.

**Borde norte del bloque.** Todas las columnas del borde norte llevan baranda (43 en la global); no aparece ningún borde sin baranda (los pies de Y12 e Y13 son de las rampas, no del bloque). El rojo del bloque tapa en promedio por columna 3,55 celdas en la global, 6,81 en g23, 6,01 en g10, 2,81 en g04 y 5,47 en g24. Debajo de ese rojo, en la global: banda 207 celdas, piso decorativo 143, piso de sala nivel 0 24, puente o gate o escalera 28 (de ellas 28 de rampa). De las 63 celdas de las rampas, el rojo del bloque tapa 32 en la global, 19 en g10 y 32 en g04.

**Rampas 12 y 13** (corrimiento medio, celdas; inicio en la fila 35, mitad en las 38–39, final en la fila 42): global 0,30 / 2,47 / 2,83 (las dos iguales); g04 0,26 / 2,01 / 2,05; g10 (solo Y12) 0,46 / 3,94 / 4,06.

**Contra el SNES.** La cara sur del bloque mide, en la global, 2,40 celdas frente a las 5 de la banda D del 5F: razón **0,48** (a 71° una altura de 7 da 2,41 celdas). Promediando las tomas que la ven: 1,72 celdas, razón 0,34; los muros comunes 1,34, razón 0,27.

## Lo que no coincidió con la predicción de [R]

- **El rojo baja a más o menos la mitad del paso 8:** baja a 0,44–0,76 según la toma (0,46 en la global).
- **Cara sur del bloque ~2,4:** 2,40 en la global, pero por fila de pantalla sale 3,10 en el medio y 1,00 abajo, y 0,88–1,36 en las locales (siempre en la parte baja de la toma).
- **Techo corrido ~2,4:** global 2,67 (medio) y 1,39 (hub 25, abajo); sube a 4,25 en la parte alta de g10.
- **Rampas de 0 a ~2,4:** de 0,3 a 2,83 en la global; de 0,46 a 4,06 en g10.
- **Razón con el SNES ~0,5:** 0,48 en la global; 0,34 promediando las tomas.
- **No medido por separado:** el ancho propio del rojo de la baranda (~3,1 previsto) ni el de los muros de 14 (~4,8): van dentro de «baranda» y «muro sobre el bloque» en la tabla de rojo.

## Archivos

`pase1b_global.png`, `pase1b_g23_codo.png`, `pase1b_g10_escalera.png`, `pase1b_g04_mirador.png`, `pase1b_g24_codo.png` (toma | 4 capas sobre la base | solo el rojo), `pase1b_superpuesto.png`, `pase1b_cara_sur_tiles.png` (capa naranja con su ancho por tramo, media de las tomas que lo ven), `pase1b_vs_snes.png` (la banda D = 5 del vessel y la cara medida, a la misma escala), `vessel_export_b.json`, `HASHES_vessel_export_b.txt` (dos corridas, mismos hashes). Las 5 tomas, la escena y el vessel no cambian.
