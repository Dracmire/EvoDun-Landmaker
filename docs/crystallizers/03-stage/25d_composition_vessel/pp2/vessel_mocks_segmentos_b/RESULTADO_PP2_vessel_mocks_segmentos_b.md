# PP2 paso 10b · las tres maquetas con los muros del último vessel

Parte de `c33ecbad686d5d722c4a57295fc00e0633916c38` (10a, que queda como está en `vessel_mocks_segmentos/`); el vessel final es el de `abbecbd4e54caa59410e2069a481400037a6064b` (plano 6c). Leí antes `research/metodologia/MODELO_ACTUAL.md`. Maqueta 2D en planta, sin añadir objetos, reglas ni medidas fuera de lo pedido; mismas cajas objetivo y factores que el 10a. Script y entorno fuera del repo. Sin veredicto.

## Qué hice

- **Clases de la base: de la escena original** (`scene.npz`, sha256 `d835d463ec25…`, el volcado del plano 6c), no de la imagen. Prioridad de cada celda: piso de sala > gate > puente (su caja) > escalera y muesca fuera de las cajas > muro mínimo visible (sin la banda: allí el plano dibuja la banda) > muro sobrante visible > fondo. Gates = celdas gate de la escena menos las cubiertas por escalera o muesca = **108 celdas en 17 grupos**. Guardadas en `clases_base.npz`. Las 20 cajas de las clases coinciden con la tabla BASE.
- **Dueño** del muro, de la escalera/muesca y de cada gate: sala o puente de piso más cercano (Chebyshev, empate id menor); un grupo de gates, el de su celda central (la más cercana al centroide).
- **Muro por 9 trozos:** en cada eje, el rango de la caja base de la sala se reescala con vecino más cercano igual que el piso; los márgenes se trasladan con el borde sin escalar. **Adelgazar:** una celda de muro se conserva solo si su distancia al piso escalado de su sala no supera su distancia al piso en la base.
- **Gates:** conservan su tamaño y se centran donde cae el escalado de su celda central. Sin muro externo, sin banda, sin piso decorativo y sin «terreno sin reclamar»: todo eso es fondo negro.
- **Una lectura mía que el encargo no fija:** las **40 celdas de escalera y muesca** que quedan fuera de las cajas de puente (las escaleras X5 ↔ Y10 y X6 ↔ g11 y las muescas) son caminables; viajan con su dueño en los 9 trozos, como el muro, sin adelgazar, y se dibujan con el color de los puentes.
- **Choques:** gana el piso (los muros que caen sobre piso se borran y se cuentan); el gate abre el muro; los muros que se superponen se funden.

## Prueba de identidad (T = B)

El método aplicado a la base reproduce **todas** las clases celda por celda: **0 celdas distintas** en las 21 clases (piso por sala, puente, gate, escalera y muesca, muro mínimo, muro sobrante, fondo). Dibujada en `base_k1.png`. En la base, **los 19 pares y los 17 grupos de gates salen unidos**; lo caminable tiene **2 componentes**: todo menos X3, y X3 sola (su cámara cerrada).

## Tus números contra los míos (plano 6c, sin muro externo ni banda)

| | [R] | Mío |
|---|---|---|
| Celdas de muro mínimo (visible, sin la banda) | 544 | 545 **(difiere)** |
| Celdas de muro sobrante | 25 | 25 |
| Celdas de gate (guía E) | 108 | 108 |
| Grupos de gates | 17 | 17 |
| Celdas del anillo de 2 del 10a | 1555 | 1555 |
| Del anillo, coinciden con muro real | 465 | 466 **(difiere)** |
| Del anillo, paredes que el vessel no tiene | 985 | 1089 **(difiere)** |
| Gates tapadas por el anillo | 105 | 105 |
| Grupos de gates con alguna celda tapada | 16 | 17 **(difiere)** |
| Muro real a más de 2 celdas de todo piso | 104 | 104 |

La lectura por color de [R] y mi lectura de la escena coinciden salvo 1 celda de muro mínimo (545 contra 544; el muro base total para las razones es 545 + 25 = **570**, no 569) y la partición del anillo en lo que el vessel no tiene (1089 contra 985, con 466 contra 465 que coinciden). Los 16 grupos de gates tapados son 17 en mis arrays.

## Muro y borrados

| Maqueta | Muro mínimo | Sobrante | Total | Razón con la base (570) | Borrado al adelgazar | Borrado sobre piso ajeno | sobre piso propio | sobre gate o escalera | Dibujado (celdas) | Pantallas 32 × 28 |
|---|---|---|---|---|---|---|---|---|---|---|
| BASE | 545 | 25 | 570 | 1.0 | 0 | 0 | 0 | 0 | 56 × 85 | 1.75 × 3.04 |
| A | 983 | 39 | 1022 | 1.793 | 685 | 3 | 0 | 2 | 114 × 209 | 3.56 × 7.46 |
| B | 1294 | 44 | 1338 | 2.347 | 1169 | 39 | 0 | 8 | 178 × 245 | 5.56 × 8.75 |
| U | 1364 | 56 | 1420 | 2.491 | 1670 | 22 | 0 | 0 | 173 × 264 | 5.41 × 9.43 |

## Enlaces (los 19 pares del 10a y los 17 grupos de gates)

Un par está **unido** si una celda caminable de una sala (piso, gate, puente, escalera) es vecina por un lado (o se pisa) con una celda caminable de la otra; si no, **roto**, con su distancia mínima (Chebyshev). Un grupo de gates está **unido** si, tras colocarlo, toca (por un lado) el piso de cada sala que tocaba en la base; si no, roto, con la sala que no toca.

| Maqueta | Pares rotos de 19 | Grupos de gates rotos de 17 | Componentes conexas |
|---|---|---|---|
| BASE | 0 | 0 | 2 |
| A | 13 | 17 | 25 |
| B | 9 | 16 | 21 |
| U | 7 | 16 | 17 |

| Enlace | BASE | A | B | U |
|---|---|---|---|---|
| Y10 - X5 | unido | roto (d 2) | unido | unido |
| X5 - X4 | unido | unido | unido | unido |
| X4 - X6 | unido | unido | unido | unido |
| X6 - Y11 (g11) | unido | roto (d 2) | unido | roto (d 6) |
| Y10 - h23 | unido | roto (d 2) | unido | unido |
| Y11 (g11) - h24 | unido | roto (d 6) | roto (d 4) | roto (d 13) |
| h23 - Y16 | unido | roto (d 1) | roto (d 1) | roto (d 2) |
| X0 - h17+X1 | unido | unido | roto (d 2) | unido |
| X0 - h18+X2 | unido | unido | roto (d 4) | unido |
| Y12 - h17+X1 | unido | roto (d 1) | roto (d 1) | roto (d 1) |
| Y12 - X5 | unido | roto (d 1) | unido | unido |
| Y13 - h18+X2 | unido | roto (d 1) | roto (d 1) | unido |
| Y13 - X6 | unido | roto (d 1) | unido | unido |
| Y14 - X5 | unido | roto (d 2) | roto (d 3) | roto (d 3) |
| Y14 - h19 | unido | roto (d 1) | roto (d 2) | roto (d 1) |
| Y15 - X6 | unido | roto (d 2) | roto (d 1) | roto (d 3) |
| Y15 - h20 | unido | unido | unido | unido |
| X9 - h25 | unido | unido | unido | unido |
| X9 - h24 | unido | roto (d 1) | unido | unido |
| grupo 1 (X0, 4 celdas) | unido | roto (no toca X0) | roto (no toca X0) | unido |
| grupo 2 (X0, 7 celdas) | unido | roto (no toca X0) | roto (no toca X0) | roto (no toca X0) |
| grupo 3 (X0 / h17+X1, 6 celdas) | unido | roto (no toca X0) | roto (no toca X0, h17+X1) | roto (no toca X0, h17+X1) |
| grupo 4 (X0 / h18+X2, 6 celdas) | unido | roto (no toca X0) | roto (no toca X0, h18+X2) | roto (no toca X0) |
| grupo 5 (Y12 / h17+X1, 6 celdas) | unido | roto (no toca h17+X1) | roto (no toca h17+X1) | roto (no toca h17+X1) |
| grupo 6 (Y13 / h18+X2, 6 celdas) | unido | roto (no toca Y13, h18+X2) | roto (no toca Y13, h18+X2) | roto (no toca Y13, h18+X2) |
| grupo 7 (X3, 6 celdas) | unido | roto (no toca X3) | roto (no toca X3) | roto (no toca X3) |
| grupo 8 (Y14 / h19, 3 celdas) | unido | roto (no toca h19) | roto (no toca h19) | roto (no toca h19) |
| grupo 9 (Y15 / h20, 3 celdas) | unido | roto (no toca h20) | roto (no toca h20) | roto (no toca h20) |
| grupo 10 (h19, 6 celdas) | unido | roto (no toca h19) | roto (no toca h19) | roto (no toca h19) |
| grupo 11 (h20, 6 celdas) | unido | roto (no toca h20) | roto (no toca h20) | roto (no toca h20) |
| grupo 12 (h23, 6 celdas) | unido | roto (no toca h23) | roto (no toca h23) | roto (no toca h23) |
| grupo 13 (h24, 6 celdas) | unido | roto (no toca h24) | roto (no toca h24) | roto (no toca h24) |
| grupo 14 (Y10 / h23, 16 celdas) | unido | roto (no toca h23) | roto (no toca h23) | roto (no toca h23) |
| grupo 15 (Y11 (g11) / h24, 13 celdas) | unido | roto (no toca h24) | roto (no toca h24) | roto (no toca h24) |
| grupo 16 (Y16 / h23, 7 celdas) | unido | roto (no toca Y16, h23) | roto (no toca Y16) | roto (no toca Y16) |
| grupo 17 (X9 / h24, 1 celdas) | unido | roto (no toca h24) | unido | roto (no toca h24) |

**Componentes conexas de lo caminable (piso + puente + gate + escalera):**

- **BASE** (2): [Y10, Y11 (g11), X5, X4, X6, h23, h24, Y16, h19, h20, h25, h17+X1, h18+X2, X0, Y12, Y13, Y14, Y15, X9] 2672 celdas; [X3] 120 celdas
- **A** (25): [Y10] 2499 celdas; [X5, X4, X6] 2144 celdas; [Y11 (g11)] 1739 celdas; [h20, Y15] 989 celdas; [h18+X2, X0] 958 celdas; [h19] 808 celdas; [h17+X1] 710 celdas; [X0] 587 celdas; [X3] 456 celdas; [h24] 444 celdas; [h23] 396 celdas; [h25, X9] 219 celdas; [Y14] 213 celdas; [Y12] 163 celdas; [Y13] 144 celdas; [Y16] 144 celdas; [solo gates o escaleras sueltos] 7 celdas; [solo gates o escaleras sueltos] 7 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 4 celdas
- **B** (21): [Y10, Y11 (g11), X5, X4, X6, h23, Y12, Y13] 11334 celdas; [h18+X2] 2288 celdas; [h17+X1] 2195 celdas; [h24, h25, X9] 1852 celdas; [h19] 1533 celdas; [h20, Y15] 1502 celdas; [X3] 1460 celdas; [X0] 587 celdas; [X0] 240 celdas; [Y16] 235 celdas; [Y14] 38 celdas; [solo gates o escaleras sueltos] 7 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 4 celdas
- **U** (17): [Y10, X5, X4, X6, h23, h18+X2, X0, Y12, Y13] 11250 celdas; [Y11 (g11)] 3883 celdas; [h17+X1, X0] 3383 celdas; [h20, Y15] 1944 celdas; [X3] 1824 celdas; [h19] 1818 celdas; [h24, h25, X9] 1759 celdas; [Y14] 198 celdas; [Y16] 144 celdas; [solo gates o escaleras sueltos] 7 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas; [solo gates o escaleras sueltos] 6 celdas

## 10a contra 10b (celdas de muro)

| Maqueta | Muro del 10a (anillo de 2) | Muro del 10a (anillo + muro externo) | Muro del 10b | 10b / 10a (anillo) |
|---|---|---|---|---|
| BASE | 1694 | 2376 | 570 | 0.34 |
| A | 4806 | 7401 | 1022 | 0.21 |
| B | 6439 | 10382 | 1338 | 0.21 |
| U | 6755 | 10922 | 1420 | 0.21 |

## Lo que no calzó con la predicción de [R]

- **Identidad = 0:** coincide.
- **Los pares «dejaron de tocarse» del 10a siguen a la misma distancia:** las distancias entre pisos de los 19 pares son **idénticas** a las del 10a en los tres conjuntos (sí; los pisos no cambian). Lo que sí cambia es la lectura: ahora «unido» exige contacto por un lado entre lo caminable, de modo que un contacto solo diagonal (distancia 1, p. ej. Y12 – X5) cuenta como roto, y los gates cuentan como caminables. Y10 – h23 (distancia 0 en B y U) sale unido ahí y roto en A (distancia 2).
- **Los gates que el anillo tapó se abren:** se abren (0 gates tapados por muro, por construcción), **pero 17, 16 y 16 de los 17 grupos quedan rotos por posición en A, B y U**: el gate conserva su tamaño y se centra donde cae el escalado de su celda central, y esa posición ya no toca el piso escalado de al menos una de sus salas (en las plantas, varios gates quedan sueltos dentro de un hueco o de una muesca del piso ya escalado). El test de enlaces no usa el muro: lo roto lo es por posición.
- **Los enlaces que [U] vio cortados, ahora:** Y16 – h23 está roto en las tres maquetas (distancia 1, 1 y 2) y su grupo de gates (16) también; X0 – h18+X2 está roto solo en B (distancia 4; en A y U unido); Y10 – h23 está roto solo en A (distancia 2); X6 – Y11 está roto en A (2) y U (6) y unido en B; Y11 – h24 está roto en las tres (6, 4 y 13).
- **Muro total menor que el del 10a:** coincide: el muro de cada maqueta es 1,8 (A), 2,3 (B) y 2,5 (U) veces el de la base, y el anillo del 10a era 2,8, 3,8 y 4,0 veces el anillo de su base; ambos crecen con el perímetro de las salas escaladas.

## Archivos

`base_k1.png` (la prueba de identidad), `A_planta.png`, `B_planta.png`, `U_planta.png`, `comparacion.png` (base | A | B | U, misma escala; círculo rojo = enlace roto), `vessel_mocks_segmentos_b.json` (todas las medidas), `clases_base.npz` (clases, dueños y grupos de gates de la base, reutilizables), `HASHES_vessel_mocks_segmentos_b.txt` (dos corridas, mismos hashes).
