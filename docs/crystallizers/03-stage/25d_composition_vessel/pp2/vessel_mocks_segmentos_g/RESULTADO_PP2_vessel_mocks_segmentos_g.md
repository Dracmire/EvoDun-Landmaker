# PP2 paso 10g · planta N con el set nuevo de [U], apilamientos en dos capas y niveles de A988

Parte de `02c5cc3` (10d); los commits de [R] 27615b9, f969518 y 36001fe solo tocan `research/metodologia`. Leí antes `research/metodologia/MODELO_ACTUAL.md`. No toqué `vessel_mocks_segmentos/`, `_b/`, `_c/` ni `_d/`. Reemplaza al 10e y al 10f. Maqueta 2D en planta; script y entorno fuera del repo. Sin veredicto.

## 1 · Qué se hizo

- **Cajas:** las del encargo, tal cual (el X3 como caja de piso `[10.0, −9.4, 50.0, 30.6]`; el muro sur de 2 celdas no se escala), redondeadas al entero más cercano con .5 hacia arriba. Salas, factores y método de pisos: los del 10d. X3 y la unión H18–X0 llevan nivel normal como **supuesto de [R], pendiente de [U]**; Y16 como sub-terraza (A988 anota «16», lectura de [R] pendiente de [U]).
- **Dos capas:** `capas.npz` guarda `piso_a` (la sala de arriba o la única) y `piso_b` (la de abajo, solo donde hay solape, −1 en el resto). Las celdas con dos pisos de dos salas se dibujan como transición (trama cian sobre el color de la sala de arriba). No se resolvió ningún choque ni se movió ninguna sala. Orden de niveles: superior (X4, X5, X6, hub 25) > normal (hub 19, hub 20, Y10, Y11, hub 17, hub 18, X0, X3) > sub-terraza (hub 23, hub 24, Y16); `niveles.json` marca los supuestos.
- **Uniones apiladas:** X5–Y10, Y10–h23 e Y11–h24 no llevan barra, escalera ni conector; las sostiene su apilamiento. Los muros que antes pertenecían a esas piezas pasan a la sala o pieza más cercana. Las otras 11 uniones siguen con la regla plástica del 10d.
- **Gates de una sola sala:** crecen con su sala (como en el 10d).
- **Posición de los pasillos 12, 13, 14, 15 y 9:** el set nuevo no trae cajas para ellos, así que la regla del 10d no tiene su semilla; usé la semilla del 10f en los cinco (sección 3 i). El resto de la regla es la del 10d.
- **Solapes pieza–sala:** se miden y se reportan, no frenan. Se dibujan con un contorno naranja en las celdas.
- **«U del 10d» en `comparacion.png`:** el mismo script reproduce la planta del 10d con sus cajas y sus reglas (muro 1591, largos de las 14 uniones idénticos a los del 10d); no es una imagen copiada.

## 2 · Prueba de identidad (T = B)

**0 celdas distintas** de clase, **0** de pieza y **0** de marcador. `clases_base.npz`: las cinco matrices (`clases`, `pieza`, `marcadores`, `dueno`, `grupo_de_gate`) son idénticas a las del 10d.

## 3 · Medidas

**(b) Cajas.** Diferencia entre la caja usada en N y la tabla (el redondeo; máximo 0,5 celda), y entre el piso dibujado y la caja usada:

| Sala | Caja usada (l, t, r, b) | Tabla | Usada − tabla (l, t, r, b) | Piso dibujado − caja usada |
|---|---|---|---|---|
| Y10 | [-55, 58, -29, 159] | [-54.92, 57.5, -29.0, 159.0] | [-0.08, 0.5, 0.0, 0.0] | [0, 0, 0, 0] |
| Y11 (g11) | [68, 40, 113, 166] | [67.8, 40.0, 113.16, 166.0] | [0.2, 0.0, -0.16, 0.0] | [0, 0, 0, 0] |
| X5 | [-54, 40, 26, 83] | [-54.2, 40.0, 25.8, 82.5] | [0.2, 0.0, 0.2, 0.5] | [0, 0, 0, 0] |
| X4 | [10, 40, 48, 63] | [9.8, 40.0, 48.2, 62.5] | [0.2, 0.0, -0.2, 0.5] | [0, 0, 0, 0] |
| X6 | [32, 40, 96, 83] | [32.2, 40.0, 96.2, 82.5] | [-0.2, 0.0, -0.2, 0.5] | [0, 0, 0, 0] |
| h23 | [-45, 141, -6, 174] | [-45.0, 141.0, -6.0, 174.0] | [0.0, 0.0, 0.0, 0.0] | [0, 0, 0, 0] |
| h24 | [57, 141, 96, 177] | [56.8, 141.0, 95.8, 177.0] | [0.2, 0.0, 0.2, 0.0] | [0, 0, 0, 0] |
| Y16 | [-20, 163, -6, 179] | [-20.5, 163.0, -6.5, 179.0] | [0.5, 0.0, 0.5, 0.0] | [0, 0, 0, 0] |
| h19 | [-25, 85, 26, 136] | [-25.4, 84.81, 25.8, 136.01] | [0.4, 0.19, 0.2, -0.01] | [0, 0, 0, 0] |
| h20 | [29, 87, 80, 138] | [29.2, 86.81, 80.4, 138.01] | [-0.2, 0.19, -0.4, -0.01] | [0, 0, 0, 0] |
| h25 | [9, 141, 49, 181] | [9.05, 141.0, 49.05, 181.0] | [-0.05, 0.0, -0.05, 0.0] | [0, 0, 0, 0] |
| h17+X1 | [-55, -16, 6, 28] | [-55.0, -16.2, 6.2, 28.0] | [0.0, 0.2, -0.2, 0.0] | [0, 0, 0, 0] |
| h18+X2 | [54, -16, 115, 31] | [53.8, -16.2, 115.0, 31.4] | [0.2, 0.2, 0.0, -0.4] | [0, 0, 0, 0] |
| X0 | [-14, -40, 74, -13] | [-14.2, -40.0, 74.2, -12.8] | [0.2, 0.0, -0.2, -0.2] | [0, 0, 0, 0] |
| X3 | [10, -9, 50, 31] | [10.0, -9.4, 50.0, 30.6] | [0.0, 0.4, 0.0, 0.4] | [0, 0, 0, 0] |

**(c) Apilamientos** (dos salas con celdas con dos pisos; nivel de cada una). Solapes sin criterio entre salas del mismo nivel: **0**.

| Par | Celdas con dos pisos | Nivel de arriba | Nivel de abajo |
|---|---|---|---|
| X5 sobre Y10 | 19 | superior | normal |
| Y10 sobre h23 | 153 | normal | sub-terraza |
| Y11 (g11) sobre h24 | 40 | normal | sub-terraza |

**(d) Muro** (razón con la base de 590 celdas):

| Planta | Muro mínimo | Sobrante | Total | Razón con la base (590) | Borrado al adelgazar | Borrado sobre piso ajeno | sobre piso propio | sobre escalera | Dibujado (celdas) | Pantallas 32 × 28 |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 565 | 25 | 590 | 1.0 | 0 | 0 | 0 | 0 | 56 × 85 | 1.75 × 3.04 |
| U del 10d | 1478 | 113 | 1591 | 2.697 | 1639 | 25 | 0 | 0 | 173 × 264 | 5.41 × 9.43 |
| N | 1254 | 57 | 1311 | 2.222 | 1432 | 101 | 0 | 3 | 170 × 221 | 5.31 × 7.89 |

**(e) Las 14 uniones.** Las 11 plásticas (largo = cortes a lo largo del eje; en las escaleras, filas del parche más piso liso):

| Unión plástica | Une | Largo base | Largo en el 10d (U) | Largo en N | Piso liso agregado en N (filas) | Ancho base → N | Forma y ancho conservados |
|---|---|---|---|---|---|---|---|
| Y12 | h17+X1 – X5 | 15 | 46 | 27 | — | 4 → 4 | sí |
| Y13 | h18+X2 – X6 | 15 | 47 | 27 | — | 4 → 4 | sí |
| Y14 | X5 – h19 | 9 | 25 | 16 | — | 4 → 4 | sí |
| Y15 | X6 – h20 | 9 | 27 | 18 | — | 4 → 4 | sí |
| X9 | h25 – h24 | 9 | 8 | 25 | — | 3 → 3 | sí |
| conector X0-h17 | X0 – h17+X1 | 2 | 2 | 7 | — | 3 → 3 | sí |
| conector X0-h18 | X0 – h18+X2 | 2 | 6 | 7 | — | 3 → 3 | sí |
| conector Y16-h23 | h23 – Y16 | 3 | 4 | 5 | — | 3 → 3 | sí |
| escalera X4-X5 | X4 – X5 | 2 | 5 | 5 | 3 | 3 → 3 | sí |
| escalera X4-X6 | X4 – X6 | 2 | 5 | 5 | 3 | 3 → 3 | sí |
| escalera X6-Y11 | X6 – Y11 (g11) | 2 | 11 | 7 | 5 | 3 → 3 | sí |

Las 3 apiladas: X5–Y10, **19** celdas con dos pisos; Y10–h23, **153**; Y11–h24, **40**.

**(f) Enlaces.** Definición del 10c («unida» = el piso de la pieza es vecino por un lado del piso de cada una de sus dos salas, distancia 1; 0 = la pieza pisa celdas de la sala; las tres apiladas, por su solape).

| Unión | base | N |
|---|---|---|
| Y12 | unida (d 1 / 1) | unida (d 1 / 1) |
| Y13 | unida (d 1 / 1) | unida (d 1 / 1) |
| Y14 | unida (d 1 / 1) | unida (d 1 / 1) |
| Y15 | unida (d 1 / 1) | unida (d 1 / 0) |
| X9 | unida (d 1 / 1) | unida (d 1 / 0) |
| conector X0-h17 | unida (d 1 / 1) | unida (d 1 / 1) |
| conector X0-h18 | unida (d 1 / 1) | unida (d 1 / 1) |
| conector Y16-h23 | unida (d 1 / 1) | unida (d 1 / 1) |
| conector Y10-h23 | unida (d 1 / 1) | por apilamiento: unida (153 celdas con dos pisos) |
| conector Y11-h24 | unida (d 1 / 1) | por apilamiento: unida (40 celdas con dos pisos) |
| escalera X5-Y10 | unida (d 1 / 1) | por apilamiento: unida (19 celdas con dos pisos) |
| escalera X4-X5 | unida (d 1 / 1) | unida (d 1 / 1) |
| escalera X4-X6 | unida (d 1 / 1) | unida (d 1 / 1) |
| escalera X6-Y11 | unida (d 1 / 1) | unida (d 1 / 1) |

| Par (10a) | base | N |
|---|---|---|
| Y10 - X5 | unido | unido |
| X5 - X4 | unido | unido |
| X4 - X6 | unido | unido |
| X6 - Y11 (g11) | unido | unido |
| Y10 - h23 | unido | unido |
| Y11 (g11) - h24 | unido | unido |
| h23 - Y16 | unido | unido |
| X0 - h17+X1 | unido | unido |
| X0 - h18+X2 | unido | unido |
| Y12 - h17+X1 | unido | unido |
| Y12 - X5 | unido | unido |
| Y13 - h18+X2 | unido | unido |
| Y13 - X6 | unido | unido |
| Y14 - X5 | unido | unido |
| Y14 - h19 | unido | unido |
| Y15 - X6 | unido | unido |
| Y15 - h20 | unido | unido |
| X9 - h25 | unido | unido |
| X9 - h24 | unido | unido |

Componentes conexas: base (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, conector Y10-h23, conector Y11-h24, escalera X5-Y10, escalera X4-X5, escalera X4-X6, escalera X6-Y11] 2672 celdas; [X3] 100 celdas. N (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9, conector X0-h17, conector X0-h18, conector Y16-h23, escalera X4-X5, escalera X4-X6, escalera X6-Y11] 23613 celdas; [X3] 1600 celdas.

**(g) X3.** N: 1600 celdas de piso (caja usada [10, -9, 50, 31]), cerrada por los cuatro lados: sí (faltan 0 celdas de muro). Base: 100 celdas, cerrada.

**(h) Solapes pieza–sala en N** (celdas): Y15 con h20: 2; X9 con h24: 2. En el 10d (U): X9 con h24: 10; ahí además dos salas del mismo nivel se solapaban (X0 + h18+X2: 12 celdas), un caso que el set viejo no evalúa y que no entra en N.

**(i) Posición transversal de los pasillos.** Los cinco salen de la **semilla del 10f**, porque el set nuevo no trae su caja; la corrida es la de la semilla respecto de la posición de la base, y no hizo falta ningún desfase extra para tocar las dos salas:

| Pasillo | Origen de la posición | Semilla transversal | Corrida de la semilla respecto de la base | Desfase extra para tocar las dos salas |
|---|---|---|---|---|
| Y12 | semilla del 10f (promedio del centro escalado por las dos salas que une) | -23.25 | -36 | 0 |
| Y13 | semilla del 10f (promedio del centro escalado por las dos salas que une) | 82.25 | 37 | 0 |
| Y14 | semilla del 10f (promedio del centro escalado por las dos salas que une) | 3.64 | -17 | 0 |
| Y15 | semilla del 10f (promedio del centro escalado por las dos salas que une) | 52.86 | 16 | 0 |
| X9 | semilla del 10f (promedio del centro escalado por las dos salas que une) | 168.75 | 80 | 0 |

## Lo que calzó y lo que no con la predicción de [R]

- **Apilamientos:** X5 sobre Y10 19 (mock 22.7), Y10 sobre h23 153 (mock 159.2), Y11 sobre h24 40 (mock 36.1); son los mismos del 10f (19, 153, 40). Difieren del mock en 3,7, 6,2 y 3,9 celdas (más que las 1 a 2 que había en el 10d); no comprobé si es el redondeo de bordes.
- **0 solapes sin criterio entre salas** y **0 violaciones**, como predijo.
- **Largos de las 11 plásticas (salió / predicción):** Y12 27 (predicción 26.3), Y13 27 (predicción 26.3), Y14 16 (predicción 16.2), Y15 18 (predicción 18.2), X9 25 (predicción 27.8), conector X0-h17 7 (predicción 6.8), conector X0-h18 7 (predicción 6.8), conector Y16-h23 5 (predicción 4.5), escalera X4-X5 5 (predicción 5), escalera X4-X6 5 (predicción 5), escalera X6-Y11 7 (predicción 6.9). Las mayores diferencias son X9 (25 contra 27,8) y Y16–h23 (5 contra 4,5).
- **Solapes pieza–sala:** Y15–h20 (2) y X9–h24 (2) se repiten; el de Y11–h24 (3) desaparece, como predijo.
- **2 componentes** (principal y X3) y X3 cerrada.

## Archivos

`base_k1.png`, `N_planta.png`, `comparacion.png` (base | U del 10d | N, misma escala; trama cian = transición, contorno naranja = solape pieza–sala, círculo rojo = unión plástica rota o componente aparte de X3: ninguno), `vessel_mocks_segmentos_g.json` (medidas), `capas.npz` (`piso_a`, `piso_b`, `solape_pieza_sala`, `origen_xy`), `niveles.json`, `clases_base.npz`, `HASHES_vessel_mocks_segmentos_g.txt` (dos corridas, mismos hashes).
