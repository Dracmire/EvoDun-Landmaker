# PP2 paso 10d · todas las uniones de la base se mantienen en las tres maquetas

Parte de `17c0dd8c0366d5bf440e798c14983bb8327d6778` (10c). Leí antes `research/metodologia/MODELO_ACTUAL.md`. `vessel_mocks_segmentos/`, `_b/` y `_c/` no se tocaron. Mismas cajas objetivo y factores que el 10a / 10b / 10c, sin mover salas. Maqueta 2D en planta; script y entorno fuera del repo. Sin veredicto, sin elegir set.

## 1 · Qué se hizo

Las 14 uniones de la base salen de `clases_base.npz` y **coinciden con la lista del encargo**: 5 pasillos (Y12, Y13, Y14, Y15, X9), 3 conectores rectos (X0–h17+X1, X0–h18+X2, Y16–h23), 2 conectores con barra (clases de pieza 114 y 115, de 16 y 13 celdas) y 4 parches de escalera de 3 × 2 (clase 42: X5–Y10, X4–X5, X4–X6, X6–Y11, con X5, X4, X4 y X6 como sala de arriba). Las 8 primeras ya eran plásticas en el 10c y no se tocaron; las 6 nuevas son plásticas aquí.

- **Conector con barra** (Y10–h23 y Y11–h24). Mi lectura de la geometría de la base: la pata de Y10 / Y11 termina en una fila (el «pie»); la barra son las 2 filas siguientes, bajo el pie; junto al pie hay un escalón (2 celdas en Y10, 1 en Y11) en la fila del pie; en el otro extremo la barra toca el costado del hub (h23 por el este, h24 por el oeste). En Y11 el pie tiene una cola de 1 columna que baja junto a la barra; la barra queda bajo el pie sin la cola, y la cola la toca por el costado. En cada maqueta: la fila del pie es la última fila de la sala que viene de la fila del pie de la base; la barra queda en las 2 filas siguientes, con el mismo grosor; sus columnas bajo el pie se estiran para cubrir el pie escalado (repitiendo columnas idénticas), el escalón conserva su tamaño y pegado al pie, y se añaden columnas lisas de barra (2 filas) hasta la cara del hub en esas dos filas. La cara del hub coincide en las dos filas en los tres sets (la barra toca el hub con las dos).
- **Escalera** (4). El parche de 3 × 2 no cambia ni de tamaño ni de forma. Se pega al borde de abajo de la sala de arriba (lectura de [R] aplicada tal cual; en la base es indiferente, porque entre el parche y las dos salas no hay hueco; no vi razón en las plantas para preferir el parche pegado a la sala de abajo) y, hasta el piso de la sala de abajo, se agrega piso liso de 3 celdas de ancho con el color de la sala de arriba. Posición: la columna que da el escalado del centro desde la sala de arriba; si desde ahí las tres columnas no tienen un borde parejo en las dos salas, la corrida mínima (en celdas) hasta que lo tengan: **A X5–Y10: 1 columna; B X6–Y11: −5 columnas** (hacia el oeste); las demás, 0. Lo que añadí al criterio del 10c: exigir el borde de arriba de la sala de abajo parejo en las 3 columnas, porque sin él el relleno sale con ancho irregular (A X5–Y10 sin la corrida daba columnas de 2, 5 y 5 filas y la forma dejaba de ser de ancho 3).
- **Muros**: viajan con la pieza (nueve trozos sobre la pieza estirada; en la escalera el relleno repite la última fila del parche); lo demás como en el 10c. Las celdas de muro cercanas a las piezas nuevas ahora pertenecen a ellas (antes, a la sala más cercana), así que el muro cambia un poco: A 1115 (10c: 1099), B 1489 (1463), U 1591 (1544).
- **Pasos que no hubo que dar:** ninguna unión quedó sin sostener; no hizo falta parar. Todas las comprobaciones duras se cumplen (sección 3).

## 2 · Prueba de identidad (T = B)

**0 celdas distintas** de clase, **0** de pieza y **0** de marcador. `clases_base.npz`: las matrices `clases`, `marcadores` y `grupo_de_gate` son idénticas a las del 10c; `pieza` y `dueno` cambian en 24 celdas, las de los 4 parches de escalera, que ahora son piezas 201 a 204.

## 3 · Medidas

**(b) Muro y borrados:**

| Maqueta | Muro mínimo | Sobrante | Total | Razón con la base (590) | Borrado al adelgazar | Borrado sobre piso ajeno | sobre piso propio | sobre escalera | Dibujado (celdas) | Pantallas 32 × 28 |
|---|---|---|---|---|---|---|---|---|---|---|
| BASE | 565 | 25 | 590 | 1.0 | 0 | 0 | 0 | 0 | 56 × 85 | 1.75 × 3.04 |
| A | 1055 | 60 | 1115 | 1.89 | 671 | 8 | 0 | 2 | 114 × 209 | 3.56 × 7.46 |
| B | 1418 | 71 | 1489 | 2.524 | 1152 | 63 | 0 | 6 | 178 × 245 | 5.56 × 8.75 |
| U | 1478 | 113 | 1591 | 2.697 | 1639 | 25 | 0 | 0 | 173 × 264 | 5.41 × 9.43 |

**(c) Las 14 uniones** (largo = cortes a lo largo del eje; en las barras, columnas; en las escaleras, filas del parche + relleno; «patrón de corte» = misma sección transversal en la base y en el set):

| Unión | Une | Largo base | Largo A / B / U | Piso liso agregado (filas) A / B / U | Desfase transversal A / B / U | Ancho base → set y forma conservados (A / B / U) |
|---|---|---|---|---|---|---|
| Y12 | h17+X1 – X5 | 15 | 30 / 53 / 46 | — / — / — | 0 / 0 / 0 | 4 → 4 / 4 / 4; sí / sí / sí |
| Y13 | h18+X2 – X6 | 15 | 30 / 53 / 47 | — / — / — | 0 / 0 / 0 | 4 → 4 / 4 / 4; sí / sí / sí |
| Y14 | X5 – h19 | 9 | 32 / 18 / 25 | — / — / — | 0 / 0 / 0 | 4 → 4 / 4 / 4; sí / sí / sí |
| Y15 | X6 – h20 | 9 | 34 / 16 / 27 | — / — / — | 0 / 0 / 0 | 4 → 4 / 4 / 4; sí / sí / sí |
| X9 | h25 – h24 | 9 | 11 / 9 / 8 | — / — / — | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| conector X0-h17 | X0 – h17+X1 | 2 | 2 / 18 / 2 | — / — / — | 0 / 4 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| conector X0-h18 | X0 – h18+X2 | 2 | 5 / 18 / 6 | — / — / — | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| conector Y16-h23 | h23 – Y16 | 3 | 6 / 5 / 4 | — / — / — | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| conector Y10-h23 (nueva) | Y10 – h23 | 7 | 24 / 25 / 28 | — / — / — | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| conector Y11-h24 (nueva) | Y11 (g11) – h24 | 6 | 14 / 17 / 38 | — / — / — | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| escalera X5-Y10 (nueva) | X5 – Y10 | 2 | 7 / 7 / 5 | 5 / 5 / 3 | 1 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| escalera X4-X5 (nueva) | X4 – X5 | 2 | 4 / 7 / 5 | 2 / 5 / 3 | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| escalera X4-X6 (nueva) | X4 – X6 | 2 | 4 / 7 / 5 | 2 / 5 / 3 | 0 / 0 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |
| escalera X6-Y11 (nueva) | X6 – Y11 (g11) | 2 | 11 / 3 / 11 | 9 / 1 / 9 | 0 / -5 / 0 | 3 → 3 / 3 / 3; sí / sí / sí |

Hueco entre el pie y el hub en las barras (celdas, el escalón incluido; en la base 2 y 1): Y10–h23 A 10, B 11, U 12; Y11–h24 A 6, B 9, U 22.

**(d) Enlaces.** «Unida» = el piso de la pieza es vecino por un lado del piso de cada una de sus dos salas (distancia 1; 0 = la pieza pisa celdas de la sala, que viene de las cajas del 10a); «rota» si no.

Las 14 uniones (distancia mínima a la sala de arriba o A / a la sala de abajo o B):

| Unión | BASE | A | B | U |
|---|---|---|---|---|
| Y12 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| Y13 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| Y14 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| Y15 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 0 / 1) | unida (d 1 / 1) |
| X9 | unida (d 1 / 1) | unida (d 0 / 1) | unida (d 1 / 1) | unida (d 1 / 0) |
| conector X0-h17 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| conector X0-h18 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| conector Y16-h23 | unida (d 1 / 1) | unida (d 0 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| conector Y10-h23 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| conector Y11-h24 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| escalera X5-Y10 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| escalera X4-X5 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| escalera X4-X6 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |
| escalera X6-Y11 | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) | unida (d 1 / 1) |

Los 19 pares del 10a (unido por contacto directo o por su pieza):

| Par (10a) | BASE | A | B | U |
|---|---|---|---|---|
| Y10 - X5 | unido | unido | unido | unido |
| X5 - X4 | unido | unido | unido | unido |
| X4 - X6 | unido | unido | unido | unido |
| X6 - Y11 (g11) | unido | unido | unido | unido |
| Y10 - h23 | unido | unido | unido | unido |
| Y11 (g11) - h24 | unido | unido | unido | unido |
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

Componentes conexas del piso (con las salas y piezas de cada una):

- **BASE** (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24, escalera X5-Y10, escalera X4-X5, escalera X4-X6, escalera X6-Y11] 2672 celdas; [X3] 100 celdas
- **A** (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24, escalera X5-Y10, escalera X4-X5, escalera X4-X6, escalera X6-Y11] 12105 celdas; [X3] 400 celdas
- **B** (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24, escalera X5-Y10, escalera X4-X5, escalera X4-X6, escalera X6-Y11] 21423 celdas; [X3] 1296 celdas
- **U** (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24, escalera X5-Y10, escalera X4-X5, escalera X4-X6, escalera X6-Y11] 24059 celdas; [X3] 1600 celdas

**(e) X3:**

| Maqueta | Caja objetivo usada (l, t, r, b) | Celdas de piso | Cerrada por los cuatro lados |
|---|---|---|---|
| BASE | [24, 23, 34, 33] | 100 | sí (faltan 0) |
| A | [19, 6, 39, 26] | 400 | sí (faltan 0) |
| B | [11, -21, 47, 15] | 1296 | sí (faltan 0) |
| U | [9, -19, 49, 21] | 1600 | sí (faltan 0) |

Comprobación extra de integridad (mía, no pedida): los pisos de salas y piezas **nuevas** no se solapan con ninguno. Los solapes que existen vienen de las cajas del 10a y de piezas del 10c (A: h23 con el conector Y16–h23, 2 celdas; h25 con X9, 4; h18+X2 con X0, 4. B: Y10 con h23, 6; Y11 con X6, 169; X4 con X6, 2; X6 con Y15, 5. U: Y10 con h23, 5; h24 con X9, 10; h18+X2 con X0, 12); están en el json.

## Lo que no calzó con la predicción de [R]

- **Cumple:** identidad 0; 14 de 14 uniones sostenidas por set sin mover salas; 2 componentes (principal y X3) en los tres sets; 0 círculos rojos; el muro total cambia poco respecto del 10c (+16, +26 y +47 celdas).
- **Barra Y10–h23:** predijiste que pasaba de 2 celdas a unas 8 o 9 en A, B y U; salió **10, 11 y 12** (de 1 a 4 celdas más que 8–9; mido el hueco entre la última columna del pie escalado y la cara del hub en las filas de la barra).
- **Barra Y11–h24:** predijiste de 1 a unas 6 (A y B) y unas 19 (U); salió **6 en A (coincide), 9 en B y 22 en U**.
- **Escaleras:** predijiste X4–X5, X4–X6 y X5–Y10 con unas 2 filas en A, 4 o 5 en B y 3 en U, y X6–Y11 con unas 9 en A y en U y 1 en B. Salió igual salvo **X5–Y10 en A: 5 filas** (con la corrida de 1 columna descrita arriba), y **X6–Y11 en B necesitó correr −5 columnas** para encontrar un borde parejo (el relleno sale de 1 fila, como predijiste).

## Archivos

`base_k1.png`, `A_planta.png`, `B_planta.png`, `U_planta.png`, `comparacion.png` (base | A | B | U, misma escala; círculo rojo solo para una unión rota o una componente aparte de X3: ninguno), `vessel_mocks_segmentos_d.json` (las medidas), `clases_base.npz`, `HASHES_vessel_mocks_segmentos_d.txt` (dos corridas, mismos hashes).
