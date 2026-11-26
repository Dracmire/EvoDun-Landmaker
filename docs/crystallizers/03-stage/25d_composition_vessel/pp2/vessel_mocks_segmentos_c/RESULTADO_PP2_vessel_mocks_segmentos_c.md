# PP2 paso 10c · las tres maquetas con el piso conector, los pasillos plásticos y el muro sur de X3

Parte de `9e500971dbdb215e4572948fcaa16872050fbb65` (10b). Leí antes `research/metodologia/MODELO_ACTUAL.md`. `vessel_mocks_segmentos/` y `vessel_mocks_segmentos_b/` no se tocaron. Mismas cajas objetivo y factores que el 10a / 10b salvo X3. Maqueta 2D en planta; script y entorno fuera del repo. Sin veredicto, sin elegir set, sin mover salas ni factores.

## 1 · Base = último vessel

Escena 6c (`scene.npz`, sha256 `d835d463ec25…`) **más el muro de X3 del 8k**: filas 33 y 34, columnas 24 a 33 (20 celdas) pasan de piso de X3 a muro mínimo. Motivo, palabras de [U] en el encargo: «revisa bien por que la version final del ultimo vessel tiene una pared sur en X3». La base y las tres maquetas llevan ese muro de 2 celdas.

- **8l, 8m y 8n no cambiaron la escena:** la base reconstruida con el parche de X3 coincide con la escena del 8k y con la imagen (ver abajo); no hay otra diferencia.
- **Comparación con `vessel_luces/base_muros_piso_k.png`:** fuera de los pisos de nivel 1 hay **0 celdas distintas** entre la imagen y la escena 8k, y **0** entre mi base nueva (muro mínimo + sobrante + muro externo visibles) y la imagen; el muro de X3 coincide. No hay otra diferencia.
- **Las 15 cajas de clase** (salas y pisos de nivel 1) coinciden con la tabla BASE; la de X3 es **(24, 23, 34, 33)**, con el muro nuevo en las filas 33 y 34 (a propósito).
- **X3: 94 celdas de piso de la escena + 6 celdas de gate dentro** (el grupo 7 queda como piso bajo su marca) **= 100 celdas de piso** en la base nueva.
- **Cajas objetivo de X3** (misma esquina superior y mismo ancho que en el 10b; alto = 10/12 del alto objetivo del 10b, redondeado): A [19, 6, 39, 26], B [11, -21, 47, 15], U [9, -19, 49, 21] (l, t, r, b); el muro sur de 2 celdas cuelga debajo del piso (margen rígido de los nueve trozos).

## 2 · Qué es cada cosa

- **Gate = marcador sobre piso.** Las 108 celdas de gate (17 grupos) pasan a **piso**; la marca blanca (al tamaño de la base) se dibuja encima. Grupos de una sola sala (1, 2, 7, 10, 11, 12, 13): su piso es de esa sala y se escala con ella. Grupos en el extremo de un pasillo (5, 6, 8, 9, 17): son del pasillo. Conectores entre dos salas (3, 4, 14, 15, 16): pieza propia.
- **Piezas plásticas** (diez): los pasillos Y12, Y13, Y14, Y15 y X9 (caja + gates de su extremo + escaleras y muescas conectadas) y los conectores X0–h17, X0–h18, Y10–h23, Y11–h24 e Y16–h23. Cada una conserva forma, ancho, orientación y los marcadores, escaleras y muescas de sus extremos; cambia solo su largo y su posición a lo largo del eje: se **repite o se quita un tramo de cortes idénticos** (preferentemente el tramo de puente liso; si no hay, el más largo) para que su primer corte toque (por un lado) el piso de una sala y el último el de la otra. Posición transversal: la del escalado de su centro; si desde ahí no se alcanzan los dos pisos, se corre lo mínimo. Sus muros viajan con ella por los mismos cortes. El resto (formas reales escaladas, muro de nueve trozos, adelgazar, choques, sin muro externo, fondo negro) es como en el 10b.
- **Lecturas mías:** el mínimo de una pieza es su largo menos el tramo estirable más 1 (nunca se borra todo el tramo); los marcadores solo van en la primera copia de cada corte; en las piezas sin tramo de puente liso se estira el tramo idéntico más largo.
- **Codos:** Y10–h23 e Y11–h24 tocan una sala por arriba y la otra por el costado (dos ejes distintos): **no se resuelven con la regla**, no se inventan; se dejan donde cae su centro (sin estirar) y se miden.

## 3 · Prueba de identidad (T = B)

**0 celdas distintas** de clase, **0** de pieza y **0** de marcador con la base nueva (X3 con 94 + 6 celdas y su muro sur, gates como piso, piezas sin estirar). Dibujada en `base_k1.png`. La base queda con **590 celdas de muro** (565 de muro mínimo, que son 545 + las 20 del muro de X3, y 25 de sobrante; confirmado) y **24 celdas de escalera y muesca** que no pertenecen a ninguna pieza (las escaleras X5 ↔ Y10 y X6 ↔ g11 y sus muescas), tratadas como en el 10b.

## 4 · Medidas

**Muro y borrados:**

| Maqueta | Muro mínimo | Sobrante | Total | Razón con la base (590) | Borrado al adelgazar | Borrado sobre piso ajeno | sobre piso propio | sobre escalera | Dibujado (celdas) | Pantallas 32 × 28 |
|---|---|---|---|---|---|---|---|---|---|---|
| BASE | 565 | 25 | 590 | 1.0 | 0 | 0 | 0 | 0 | 56 × 85 | 1.75 × 3.04 |
| A | 1057 | 42 | 1099 | 1.863 | 671 | 6 | 0 | 0 | 114 × 209 | 3.56 × 7.46 |
| B | 1416 | 47 | 1463 | 2.48 | 1152 | 63 | 0 | 8 | 178 × 245 | 5.56 × 8.75 |
| U | 1478 | 66 | 1544 | 2.617 | 1639 | 25 | 0 | 0 | 173 × 264 | 5.41 × 9.43 |

**Piezas plásticas** (largo = número de cortes a lo largo del eje):

| Pieza | Eje | Largo base | A | B | U | Estado en A / B / U |
|---|---|---|---|---|---|---|
| Y12 | v | 15 | 30 | 53 | 46 | resuelta / resuelta / resuelta |
| Y13 | v | 15 | 30 | 53 | 47 | resuelta / resuelta / resuelta |
| Y14 | v | 9 | 32 | 18 | 25 | resuelta / resuelta / resuelta |
| Y15 | v | 9 | 34 | 16 | 27 | resuelta / resuelta / resuelta |
| X9 | h | 9 | 11 | 9 | 8 | resuelta / resuelta / resuelta |
| conector X0-h17 | v | 2 | 2 | 18 | 2 | resuelta / resuelta (corrida 4) / resuelta |
| conector X0-h18 | v | 2 | 5 | 18 | 6 | resuelta / resuelta / resuelta |
| conector Y16-h23 | h | 3 | 6 | 5 | 4 | resuelta / resuelta / resuelta |
| conector Y10-h23 | elbow | — | — | — | — | codo: no se estira; queda donde cae / codo: no se estira; queda donde cae / codo: no se estira; queda donde cae |
| conector Y11-h24 | elbow | — | — | — | — | codo: no se estira; queda donde cae / codo: no se estira; queda donde cae / codo: no se estira; queda donde cae |

Todas las piezas rectas quedan **resueltas en los tres sets** (ninguna «no cabe» ni «no alinea»); Y12, Y13, Y14, Y15 y X9 se estiran (o encogen) sin corrimiento transversal, y el conector X0–h17 en B se corre 4 celdas. Las únicas piezas sin resolver son los dos codos.

**Enlaces.** Un par está **unido** si una celda de piso (sala, pasillo o conector) de uno es vecina por un lado de una de la otra, o si lo une su conector; si no, **roto** con su distancia mínima (Chebyshev):

| Maqueta | Pares rotos de 19 | Piezas que no tocan sus dos pisos | Componentes conexas del piso | Pares rotos del 10b (de 19) y grupos de gate rotos (de 17) |
|---|---|---|---|---|
| BASE | 0 | 0 | 2 | 0 y 0 |
| A | 4 | 2 | 6 | 13 y 17 |
| B | 1 | 2 | 3 | 9 y 16 |
| U | 2 | 2 | 4 | 7 y 16 |

| Par | BASE | A | B | U |
|---|---|---|---|---|
| Y10 - X5 | unido | roto (d 2) | unido | unido |
| X5 - X4 | unido | unido | unido | unido |
| X4 - X6 | unido | unido | unido | unido |
| X6 - Y11 (g11) | unido | roto (d 2) | unido | roto (d 6) |
| Y10 - h23 | unido | roto (d 2) | unido | unido |
| Y11 (g11) - h24 | unido | roto (d 6) | roto (d 4) | roto (d 13) |
| h23 - Y16 | unido | unido | unido | unido |
| X0 - h17+X1 | unido | unido | unido | unido |
| X0 - h18+X2 | unido | unido | unido | unido |
| Y12 - h17+X1 | unido | unido | unido | unido |
| Y12 - X5 | unido | unido | unido | unido |
| Y13 - h18+X2 | unido | unido | unido | unido |
| Y13 - X6 | unido | unido | unido | unido |
| Y14 - X5 | unido | unido | unido | unido |
| Y14 - h19 | unido | unido | unido | unido |
| Y15 - X6 | unido | unido | unido | unido |
| Y15 - h20 | unido | unido | unido | unido |
| X9 - h25 | unido | unido | unido | unido |
| X9 - h24 | unido | unido | unido | unido |

**Rotos y piezas sin tocar:**

- **A:** pares rotos: Y10 - X5 (d 2); X6 - Y11 (g11) (d 2); Y10 - h23 (d 2); Y11 (g11) - h24 (d 6). Piezas que no tocan sus dos pisos: conector Y10-h23 (toca A: sí, toca B: no); conector Y11-h24 (toca A: sí, toca B: no).
- **B:** pares rotos: Y11 (g11) - h24 (d 4). Piezas que no tocan sus dos pisos: conector Y10-h23 (toca A: sí, toca B: no); conector Y11-h24 (toca A: sí, toca B: no).
- **U:** pares rotos: X6 - Y11 (g11) (d 6); Y11 (g11) - h24 (d 13). Piezas que no tocan sus dos pisos: conector Y10-h23 (toca A: sí, toca B: no); conector Y11-h24 (toca A: sí, toca B: no).

**Componentes conexas del piso** (con las salas y piezas de cada una):

- **BASE** (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24] 2672 celdas; [X3] 100 celdas
- **A** (6): [X5, X4, X6, h19, h20, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, conector X0-h17, conector X0-h18] 6558 celdas; [Y10, conector Y10-h23] 2499 celdas; [Y11 (g11), conector Y11-h24] 1739 celdas; [h24, h25, X9] 694 celdas; [h23, Y16, conector Y16-h23] 578 celdas; [X3] 400 celdas
- **B** (3): [Y10, Y11 (g11), X5, X4, X6, h23, Y16, h19, h20, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24] 19655 celdas; [h24, h25, X9] 1836 celdas; [X3] 1296 celdas
- **U** (4): [Y10, X5, X4, X6, h23, Y16, h19, h20, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23] 18366 celdas; [Y11 (g11), conector Y11-h24] 3883 celdas; [h24, h25, X9] 1802 celdas; [X3] 1600 celdas

**X3 cerrada por los cuatro lados** (se comprueba que la región que se alcanza desde su piso sin cruzar muro no llega al borde del lienzo; la última columna cuenta las celdas vecinas al piso que no son muro; en la base son las 10 de la fila 22, porque el muro norte de X3 está en las filas 19 y 20, no pegado al piso; el cierre se mide por la región, no por la vecindad):

| Maqueta | Caja objetivo usada (l, t, r, b) | Celdas de piso | Cerrada por los cuatro lados | Celdas de muro que faltan para cerrar | Celdas del borde vecino al piso que no son muro |
|---|---|---|---|---|---|
| BASE | [24, 23, 34, 33] | 100 | sí | 0 | 10 |
| A | [19, 6, 39, 26] | 400 | sí | 0 | 20 |
| B | [11, -21, 47, 15] | 1296 | sí | 0 | 36 |
| U | [9, -19, 49, 21] | 1600 | sí | 0 | 40 |

## Lo que no calzó con la predicción de [R]

- **Identidad = 0:** coincide.
- **Los enlaces que el 10b dejó rotos por gate o pasillo salen unidos, salvo los codos:** Y12–Y15, X9 y los conectores rectos (X0–h17, X0–h18, Y16–h23) quedan unidos en los tres sets. No se resuelven los dos codos (Y10–h23, Y11–h24): el conector Y10–h23 toca a Y10 y no a h23; el Y11–h24 toca a Y11 y no a h24.
- **Rotos que esperabas:** X6–Y11 en A y U, Y10–X5 en A, ninguno en B por contacto directo: coincide. **Rotos que no esperabas** (todos por los codos): Y11–h24 en A, B y U (distancias 6, 4 y 13) e Y10–h23 en A (2). Por eso **B no queda sin rotos** (queda Y11–h24).
- **X3 no es la única componente aparte en los sets.** En la base sí (2 componentes: el resto y X3). En los sets, además de X3 hay islas, cada una colgando de un par roto de la tabla: **A** (6 componentes): h24 + h25 + X9 (por Y11–h24), Y11 con su conector (por X6–Y11 e Y11–h24), Y10 con su conector (por Y10–X5 e Y10–h23) y h23 + Y16 (por Y10–h23); **B** (3): h24 + h25 + X9 (por Y11–h24); **U** (4): Y11 con su conector (por X6–Y11 e Y11–h24) y h24 + h25 + X9. Ninguna isla viene del muro de X3, de un gate ni de un pasillo recto.
- **Sin hueco negro con marcador dentro:** los marcadores quedan sobre piso (en las plantas se ven como marcas blancas dentro de los pisos).

## Archivos

`base_k1.png`, `A_planta.png`, `B_planta.png`, `U_planta.png`, `comparacion.png` (base | A | B | U, misma escala; círculo rojo = par roto o pieza que no toca sus dos pisos), `vessel_mocks_segmentos_c.json` (todas las medidas), `clases_base.npz` (la base nueva: clases, pieza de cada celda, marcadores, dueños y grupos de gate), `HASHES_vessel_mocks_segmentos_c.txt` (dos corridas, mismos hashes).
