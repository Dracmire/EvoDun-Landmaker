# PP2 paso 10 · tres mocks 2D del crecimiento por segmentos, con la forma real de cada sala y sus muros

Base `abbecbd4e54caa59410e2069a481400037a6064b`. Leí antes `research/metodologia/MODELO_ACTUAL.md` (v2.5). Es una maqueta 2D en planta, no la escena 3D; no se añadió nada fuera de lo pedido. Solo documentos, imágenes y arrays en esta carpeta; el script y el entorno quedan fuera del repo. Sin veredicto, sin elegir set, sin corregir colisiones ni mover factores.

## Qué hice

1. **Formas reales.** Máscara de piso de cada sala (celdas de 8 px) del plano aceptado del paso 6c (P1_R + altura), volcado a `vessel_final_salas.npz` (+ `vessel_final_salas.json`, con sala → caja y el sha256 del volcado de origen, porque las máscaras no estaban versionadas). Los puentes son rectángulos (la caja de su hueco). **Las 20 cajas de las máscaras coinciden con la tabla BASE del encargo** (comparación en el json, `comparacion_con_BASE`).
2. **Escalar.** Para cada conjunto y sala, la máscara de la base (recortada a su caja) se reescala a la caja objetivo con vecino más cercano y sin suavizar, tras redondear cada borde al entero más cercano (medio hacia arriba); eso aplica kx y ky por separado. Los puentes se pintan con su caja completa. Error máximo de tamaño por redondeo: A 0.5 × 0.5, B 0.6 × 0.78, U 0.6 × 0.56 celdas (el ancho máximo cae en X9 en los tres conjuntos; el alto máximo, en X9 en A, Y10 en B y Y14 en U, por sus cajas fraccionarias).
3. **Muros (mi lectura; cámbiala si [U] dice otra).** La función de muros del vessel (5f / 5h) no está versionada, así que usé una dilatación simple: **muro mínimo = 2 celdas (Chebyshev) alrededor de todo piso**; donde dos pisos quedan a menos de 5 celdas los muros se funden en uno solo. **Muro externo = 2 celdas**, alrededor de la unión piso + muro mínimo y solo del lado que da al exterior. El grosor lo medí en el muro externo (`OUTER`, 474 celdas) del vessel final: el largo de tramo más frecuente es 2 (histograma en el json); ese muro es el del SNES, que no cambió desde el 5h, así que no se hizo más delgado. Las celdas encerradas que no son piso ni muro se pintan como «terreno sin reclamar entre salas» (casi negro). La base se dibuja con la misma regla, no con el muro real del vessel (por eso su mapa mide 64 × 93 y no 57 × 108).
4. **Huecos.** Salas con huecos o muros interiores dentro de su piso en la base: h19 (1 hueco, 6 celdas), X3 (1 hueco, 6 celdas). Se escalan con la misma máscara (no se quitan ni se adelgazan); en las plantas son los cuadrados oscuros dentro del piso.
5. **Imágenes** a 4 px por celda, todas a la misma escala; cada una con una pantalla (32 × 28 celdas) y el héroe (2 × 3) como regla en la banda de arriba, el id de cada sala y la caja objetivo en contorno punteado.

## Lo medido

**Tamaño del mapa y redondeo:**

| Conjunto | Mapa en celdas (con muro externo) | En pantallas de 32 × 28 | Error de redondeo máx. (ancho / alto) |
|---|---|---|---|
| BASE | 64 × 93 | 2.0 × 3.32 | 0 |
| A | 122 × 217 | 3.81 × 7.75 | 0.5 (9) / 0.5 (9) |
| B | 186 × 253 | 5.81 × 9.04 | 0.6 (9) / 0.78 (10) |
| U | 181 × 272 | 5.66 × 9.71 | 0.6 (9) / 0.56 (14) |

**Tamaño real del piso (caja de la máscara) y área real respecto de la base** (puentes: su caja):

| Sala | Base (celdas, caja) | A: caja · área | B: caja · área | U: caja · área |
|---|---|---|---|---|
| Y10 | 270 (8×35) | 23×112 · 2480 (×9.19) | 23×100 · 2210 (×8.19) | 26×124 · 3095 (×11.46) |
| Y11 (g11) | 366 (14×46) | 23×132 · 1714 (×4.68) | 23×132 · 1714 (×4.68) | 45×149 · 3843 (×10.50) |
| X5 | 254 (25×17) | 50×34 · 1016 (×4.00) | 83×56 · 2774 (×10.92) | 75×43 · 1899 (×7.48) |
| X4 | 91 (12×9) | 24×18 · 364 (×4.00) | 40×30 · 1009 (×11.09) | 36×23 · 693 (×7.62) |
| X6 | 159 (20×17) | 40×34 · 636 (×4.00) | 66×56 · 1717 (×10.80) | 60×43 · 1182 (×7.43) |
| h23 | 99 (13×11) | 26×22 · 396 (×4.00) | 36×30 · 756 (×7.64) | 38×32 · 829 (×8.37) |
| h24 | 111 (13×12) | 26×24 · 444 (×4.00) | 36×33 · 846 (×7.62) | 38×35 · 928 (×8.36) |
| Y16 | 36 (7×8) | 14×16 · 144 (×4.00) | 18×20 · 235 (×6.53) | 14×16 · 144 (×4.00) |
| h19 | 202 (16×16) | 32×32 · 808 (×4.00) | 44×44 · 1533 (×7.59) | 48×48 · 1818 (×9.00) |
| h20 | 194 (16×16) | 32×32 · 776 (×4.00) | 44×44 · 1464 (×7.55) | 48×48 · 1746 (×9.00) |
| h25 | 90 (10×10) | 15×15 · 201 (×2.23) | 32×32 · 922 (×10.24) | 30×30 · 810 (×9.00) |
| h17+X1 | 176 (18×13) | 36×26 · 704 (×4.00) | 64×46 · 2195 (×12.47) | 58×42 · 1859 (×10.56) |
| h18+X2 | 179 (18×14) | 36×28 · 716 (×4.00) | 64×50 · 2288 (×12.78) | 58×45 · 1883 (×10.52) |
| X0 | 133 (26×8) | 66×20 · 827 (×6.22) | 66×20 · 827 (×6.22) | 104×32 · 2128 (×16.00) |
| X3 | 114 (10×12) | 20×24 · 456 (×4.00) | 36×43 · 1460 (×12.81) | 40×48 · 1824 (×16.00) |
| Y12 | 52 (4×13) | 8×20 · 160 (×3.08) | 14×36 · 504 (×9.69) | 13×32 · 416 (×8.00) |
| Y13 | 52 (4×13) | 8×18 · 144 (×2.77) | 14×32 · 448 (×8.62) | 13×29 · 377 (×7.25) |
| Y14 | 24 (4×6) | 8×26 · 208 (×8.67) | 11×3 · 33 (×1.38) | 12×16 · 192 (×8.00) |
| Y15 | 24 (4×6) | 8×26 · 208 (×8.67) | 11×3 · 33 (×1.38) | 12×16 · 192 (×8.00) |
| X9 | 21 (7×3) | 4×4 · 16 (×0.76) | 9×9 · 81 (×3.86) | 2×9 · 18 (×0.86) |

**Pares de pisos a menos de 2 celdas que no son pareja.** Distancia = Chebyshev entre las celdas de piso más cercanas (1 = pegados, 3 = el muro mínimo de 2 celdas); «a menos de 2 celdas» = distancia ≤ 2. Las parejas son las nueve del encargo y cada puente con sus dos salas.

- **A:** ninguno
- **B:** Y11 (g11) – Y13 (distancia 1, 0 celdas entre ellos)
- **U:** ninguno
- **Base:** ninguno

**Distancia de las parejas (Chebyshev):**

| Pareja | Base | A | B | U |
|---|---|---|---|---|
| Y10 - X5 | 1 | 4 | 1 | 2 |
| X5 - X4 | 1 | 1 | 1 | 1 |
| X4 - X6 | 1 | 1 | 0 | 1 |
| X6 - Y11 (g11) | 1 | 2 | 0 | 7 |
| Y10 - h23 | 2 | 2 | 0 | 0 |
| Y11 (g11) - h24 | 2 | 6 | 4 | 13 |
| h23 - Y16 | 1 | 1 | 1 | 2 |
| X0 - h17+X1 | 1 | 2 | 4 | 1 |
| X0 - h18+X2 | 1 | 0 | 4 | 0 |
| Y12 - h17+X1 | 1 | 1 | 1 | 1 |
| Y12 - X5 | 1 | 1 | 1 | 1 |
| Y13 - h18+X2 | 1 | 1 | 1 | 1 |
| Y13 - X6 | 1 | 1 | 1 | 1 |
| Y14 - X5 | 1 | 3 | 4 | 4 |
| Y14 - h19 | 1 | 1 | 2 | 1 |
| Y15 - X6 | 1 | 2 | 1 | 4 |
| Y15 - h20 | 1 | 1 | 1 | 1 |
| X9 - h25 | 1 | 1 | 1 | 1 |
| X9 - h24 | 1 | 1 | 1 | 1 |

**Parejas que dejaron de tocarse** (tocaban en la base, distancia ≤ 1, y ahora > 1; entre paréntesis, base → ahora):

- **A:** Y10 - X5 (1 → 4); X6 - Y11 (g11) (1 → 2); X0 - h17+X1 (1 → 2); Y14 - X5 (1 → 3); Y15 - X6 (1 → 2)
- **B:** X0 - h17+X1 (1 → 4); X0 - h18+X2 (1 → 4); Y14 - X5 (1 → 4); Y14 - h19 (1 → 2)
- **U:** Y10 - X5 (1 → 2); X6 - Y11 (g11) (1 → 7); h23 - Y16 (1 → 2); Y14 - X5 (1 → 4); Y15 - X6 (1 → 4)

Parejas que no se tocan ni en la base: las que aparecen con distancia > 1 en la columna Base de la tabla de arriba (en la base esas salas se unen por gates y escaleras, no por piso pegado).

**Largo real de cada puente entre sus dos salas** (distancia Chebyshev entre los pisos de las dos salas) y su caja:

| Puente | Une | Largo entre sus dos salas (cheb): Base | A | B | U | Caja del puente (ancho × alto): Base | A | B | U |
|---|---|---|---|---|---|---|---|---|---|
| Y12 | h17+X1 – X5 | 11 | 21 | 37 | 33 | 4 × 13 | 8 × 20 | 14 × 36 | 13 × 32 |
| Y13 | h18+X2 – X6 | 10 | 19 | 33 | 30 | 4 × 13 | 8 × 18 | 14 × 32 | 13 × 29 |
| Y14 | X5 – h19 | 5 | 27 | 4 | 17 | 4 × 6 | 8 × 26 | 11 × 3 | 12 × 16 |
| Y15 | X6 – h20 | 5 | 27 | 4 | 17 | 4 × 6 | 8 × 26 | 11 × 3 | 12 × 16 |
| X9 | h25 – h24 | 4 | 5 | 10 | 3 | 7 × 3 | 4 × 4 | 9 × 9 | 2 × 9 |

## Lo que no calzó con la predicción de [R]

- **Solapes de caja heredados:** con la forma real **no aparecen como choques**: hub 20 y X6 contra Y11, Y16 contra hub 23 y X0 contra los hubs no dejan ningún par no pareja a menos de 2 celdas ni en la base ni en A, B o U. Coincide con la predicción.
- **Patas más finas que su caja:** Y10 llena 96% (A), 96% (B) y 96% (U) de su caja; Y11 56%, 56% y 57%. Coincide: no son rectangulares (el piso de Y11 en la base se retira del rincón de X6).
- **Choques reales en B, y entre hub 25, Y16 y hub 24 en A y U:** en **B** hay un par no pareja a menos de 2 celdas (el puente Y13 queda pegado al piso de Y11, distancia 1); en A y en U **ninguno**, y no hay choques entre hub 25, Y16 y hub 24 (hub 23 – Y16, que es pareja, pasa de 1 a 2 en U). No coincide en A y U.
- **Y14 y Y15 de ≈ 3,4 celdas en B:** la caja redondeada queda de 11 × 3 (objetivo 3,38 de alto) y la distancia entre sus dos salas es 4 en los dos puentes (X5 – hub 19 y X6 – hub 20); en el pie de Y14 la distancia a X5 es 4 y a hub 19 es 2, y en Y15 las dos son 1.

## Archivos

`base_k1.png`, `A_planta.png`, `B_planta.png`, `U_planta.png`, `comparacion.png` (base | A | B | U, misma escala), `vessel_mocks_segmentos.json` (todas las medidas), `vessel_final_salas.npz` y `vessel_final_salas.json` (las máscaras), `HASHES_vessel_mocks_segmentos.txt` (dos corridas, mismos hashes).
