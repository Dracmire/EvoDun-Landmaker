# PP2 paso 5h · expansión dentro del canvas de límites v7

Base `e42d594`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno fuera del repo. Sin veredicto: son lecturas.

## Qué hice

**Paso 1 · canvas v7.** Reproduje el script de [R] tal cual. Control: muro mínimo **695** celdas, muro sobrante **37**, muro externo **474**, `sha256(np.packbits(minw))[:16]` = `7c00ea17eb795391`. Coincide en las cuatro cifras. Imagen: `0_canvas_v7.png` (fondo negro, silueta blanca, muro externo gris claro, muro mínimo amarillo, hueco de puentes morado, gates blancos; el piso original va en gris y el sobrante en gris oscuro).

**Paso 2 · diagonales → L rectas.** Seis tramos (tres sitios, izquierda y derecha); cada uno se reemplazó por una L de dos tramos rectos de 2 celdas, con los mismos extremos y la misma sala a cada lado. Para cada tramo probé las dos L posibles (codo a un lado u otro), descarté las que pisan un piso original, un gate o un muro duro, las que dejan una región sin lado único, las que parten una sala o las que bajan el muro por debajo de lo que había, y de las que quedaron elegí la que deja a cada sala el área más parecida (cambio relativo máximo). En empate exacto de área (dos tramos) la L da las celdas a la sala de mayor piso en la guía E.

| Tramo | Salas | L elegida | Celdas que cambian de sala | La otra L |
|---|---|---|---|---|
| X0 \| h17 (torre izq.) | h17 +9, X0 −9 | vertical por la arista de X0 y horizontal arriba (codo arriba-derecha) | 18 (9 sala→muro, 9 muro→sala) | pisa un piso original de h17 |
| X0 \| h18 (torre der.) | h18 +9, X0 −9 | espejo del anterior | 18 (9 / 9) | pisa un piso original de h18 |
| X5 \| Y10 (izq.) | Y10 +3, X5 −3 | codo arriba-derecha | 6 (3 / 3) | empate exacto de área (±3) |
| X6 \| grupo 11 (der.) | grupo 11 +3, X6 −3 | espejo del anterior | 6 (3 / 3) | empate exacto de área |
| esquina de h23 | h19 +7, h23 −7 | codo abajo-izquierda | 14 (7 / 7) | h19 −9, h23 +9 (7,3 % frente a 5,7 %) |
| esquina de h24 | h20 +6, h24 −6 | espejo del anterior | 12 (6 / 6) | empate exacto de área |

Total: **74** celdas cambian de asignación en el canvas: **37** dejan de ser sala y pasan a muro mínimo, **37** dejan de ser muro mínimo y pasan a sala. El conteo del muro no cambia (695 / 37 / 474). Nada fuera de los seis recuadros cambia (comprobado celda a celda). Imagen: `0_canvas_v7_recto.png`.

**Lo que no se corrige** (no son diagonales de escalones de 1 celda; se dejan como están):
- dos saltos de 2 celdas de la línea vertical a la altura de h23 (izquierda, filas 80–82) y de h24 (derecha, filas 80–82); no hay una L que los deshaga sin cambiar de lado la línea;
- la punta de 3 celdas entre h23 y Y16 contra el muro externo (filas 90–92);
- unos 4 restos de 1–2 celdas junto a los gates de la torre y al centro (X3 / X4).

**Uniones heredadas de la guía E** (territorios a distancia < 3; los pisos de la guía E dan lo mismo; no se cierran): X0↔h17+X1, X0↔h18+X2, X4↔X5, X4↔X6, X5↔Y10, X6↔grupo 11 (1 celda de distancia); además, que no estaban en la lista de [U]: Y16↔h23 (1) y Y10↔h23, grupo 11↔h24 (2). Siguen igual antes y después de la corrección, y ninguna crece con la expansión.

**Paso 3 · expansión.** Cada sala crece dentro de su celda del canvas recto (su espacio hasta el muro mínimo), nunca sobre el muro mínimo, el sobrante, el muro externo, el hueco de puentes ni un gate (0 celdas de piso sobre cualquiera de ellos). Tope ×1,38 del piso de la guía E de cada zona; cada zona para en la vuelta que deja su piso más cerca de ese tope (empate: la menor). Todas las salas de una zona usan la misma vuelta; los cuatro pares espejo caen en la misma zona en los dos perfiles. **R**: caja de Chebyshev. **C**: SDF euclidiano (distancia ≤ d). Las zonas se calculan cada una con su propia imagen (`P1_zona_*_R.png`, `P2_zona_*_R.png`) y se componen; no hay choques (el canvas los impide: 0). Los puentes vuelven a su hueco con los gates que ya estaban en cada extremo.

## Lecturas

**Piso por zona** (guía E → final, razón, vuelta):

| | P1 R | P1 C | P2 R | P2 C |
|---|---|---|---|---|
| herradura | 994 → 1403, ×1,411, d 2 | 994 → 1378, ×1,386, d 2 | 1171 → 1700, ×1,452, d 2 | 1171 → 1660, ×1,418, d 2 |
| norte | 438 → 602, ×1,374, d 1 | 438 → 581, ×1,326, d 1 | (dentro de la herradura) | — |
| islas | 342 → 486, ×1,421, d 1 | 342 → 466, ×1,363, d 1 | 603 → 841, ×1,395, d 1 | 603 → 809, ×1,342, d 1 |
| total de salas (guía E: 1774) | 2491 | 2425 | 2541 | 2469 |

Las razones salen de 1,33 a 1,45 porque la vuelta es entera: la cifra más cercana a ×1,38 cae a un lado u otro.

**Razón por sala (P1 R)**: X0 1,24, h17+X1 1,35, h18+X2 1,37, X3 1,63, X4 1,36, X5 1,42, X6 1,52, Y10 1,30, grupo 11 1,36, Y16 1,90, h19 1,41, h20 1,40, h23 1,52, h24 1,63, h25 1,50. En P2 R cambian solo X0 (1,52) y X3 (1,91). Todos los perfiles y versiones están en el json (`salas`).

**Celdas que tocan su límite** (muro mínimo o externo; P1 R): X0 31, h17 15, h18 15, X3 24, X4 20, X5 40, X6 33, Y10 40, grupo 11 37, Y16 19, h19 16, h20 11, h23 24, h24 24, h25 16 (cuenta también las celdas junto al muro sobrante; el desglose muro mínimo / externo está en el json). Llenan por completo su celda del canvas **solo Y10 y Y16** en R (1,00); el resto llena entre el 51 % (h18) y el 90 % (grupo 11): la vuelta de su zona termina antes de que lleguen al límite.

**Muro mínimo visible final**: 695 celdas, no cambian con la expansión. **Hoyos: 0** (ningún terreno de sala sin reclamar queda aislado de los límites) en las cuatro imágenes. **Dobles muros**: **7** ventanas de 3 × 3 de solo muro mínimo / sobrante, **las mismas en el canvas v7 reproducido y en el recto** (en tres lugares: (35–37, 22), (35–37, 35) y (49, 28), donde dos líneas paralelas se unen a mitad de la columna central); no las produce la expansión ni la corrección. Los tramos entre dos pisos por largo están en el json (de 2 celdas: 75 en P1 R, 64 en P1 C, 77 en P2 R, 66 en P2 C).

**Contactos diagonales nuevos: 0** y pares nuevos en contacto: 0 en las cuatro; los contactos heredados no cambian de tamaño.

**Dientes** (criterio 5e; guía E 23): P1 R 18, P1 C 16, P2 R 14, P2 C 19.

**Espejo** (celdas que no coinciden, suma de los pares; guía E 283): P1 R 441, P1 C 418, P2 R 441, P2 C 422. Por pares en P1 R: h23↔h24 18, X5↔X6 131, h17↔h18 9, h19↔h20 16, Y10↔grupo 11 139 (la guía E ya daba 96 y 89 en X5↔X6 e Y10↔grupo 11).

**Puentes** (largo entre los pisos de las dos salas que une, Chebyshev, antes → después en R / C; hueco y gates no cambian): Y12 h17+X1↔X5 14 → 11 / 12 (49 celdas, 7 gates); Y13 h18+X2↔X6 13 → 10 / 11 (49, 8); Y14 X5↔h19 7 → 5 (24, 6); Y15 X6↔h20 7 → 5 (24, 6); X9 h25↔h24 7 → 4 (25, 6). Cada puente toca a las dos salas que une en las cuatro imágenes.

**P1 contra P2**: en R **50** celdas distintas (X0 30, X3 20); en C **44** (X0 24, X3 20). Ninguna otra sala difiere.

**R contra C**: P1 **66** celdas (9,2 % del crecimiento de R, 717 celdas); P2 **72** (9,4 % de 767).

## Lo que no coincidió con la predicción de [R]

- **El canvas se reproduce exacto:** sí.
- **La corrección cambia menos de 40 celdas:** depende de qué se cuente. 37 celdas dejan de ser sala (sí), pero 74 cambian de asignación contando las que pasan de muro a sala (no).
- **P1 ≠ P2 en el norte:** sí, y solo ahí: X0 y X3 (30 y 20 celdas en R).
- **R y C difieren menos del 5 % del crecimiento:** **no**, 9,2–9,4 %.
- **Las islas 19 y 20 llegan antes a su límite:** **no**: llenan el 65–67 % de su celda; los únicos que llenan la suya son Y10 y Y16.
- **Ninguna zona llega a ×1,38 completo:** las zonas quedan entre ×1,33 y ×1,45 por la vuelta entera, no por el tamaño de la celda.
- **Condiciones duras:** el canvas coincide con el control; ninguna sala cruza su muro mínimo (0); 0 hoyos; 0 contactos diagonales nuevos; cada puente une las mismas dos salas. **Dobles muros: 7 ventanas 3 × 3, heredadas del canvas v7, no 0.**

## Archivos

`0_canvas_v7.png`, `0_canvas_v7_recto.png`, `P1_R.png`, `P1_C.png`, `P2_R.png`, `P2_C.png`, `P1_zona_herradura_R.png`, `P1_zona_norte_R.png`, `P1_zona_islas_R.png`, `P2_zona_herradura_R.png`, `P2_zona_islas_R.png`, `comparacion.png` (2 filas P1 / P2 × 2 columnas R / C, misma escala), `vessel_limites.json`, `HASHES_vessel_limites.txt` (dos corridas idénticas). El estiramiento ×1,17, la escala ×2 y las alturas van en otros pasos.
