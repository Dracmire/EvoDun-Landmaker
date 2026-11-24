# PP2 paso 8l · rehacer el 8k: luces de foco, vecinos y votos, variante blanca

Base `946fd60`. Solo documentos, imágenes, arrays y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`; `vessel_luces/` no cambia. La escena es la del 8k con el muro de X3 (`base_muros_piso_k.png` idéntica a la de `vessel_luces/`). Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin veredicto; [R] mide la cobertura, la simetría y el ancho con los `.npy`.

## 1 · Luces de foco

Cinco focos y una puntual. L1 a L3: a 40 celdas de la sala origen sobre la recta destino → origen prolongada hacia afuera, a 40 de altura. L4 y L5: sobre el centroide de la sala origen, a 60 de altura, desplazados 20 celdas en sentido opuesto al destino. El eje de cada foco apunta al centroide del piso de su sala destino (z = altura de ese piso). Intensidad por foco `I = E0·d²/cos`, con E0 = 0.75: el centro del piso destino recibe la misma iluminancia (Lambert incluido) en los cinco focos. L6: puntual en el centroide de X4, a 14 sobre su piso, caída 1/d², corte duro a 20 celdas, normalizada a la iluminancia de E0 a 10 celdas. Lambert, sombras proyectadas, ambiente 0.25, factor total cortado en 1; el héroe y la baranda no se iluminan; los colores planos no cambian.

**Cono.** Los ángulos son la **apertura total** (convención de Unity, *Spot Angle*); el semiángulo es la mitad. Entre el interior y el exterior la caída es un smoothstep del coseno; cero fuera del exterior. Posiciones, ejes, conos iniciales (14° / 20°) y finales:

| Luz | Origen → destino | Posición (x, y, z) | Objetivo (x, y, z) | Intensidad | Cono inicial (int / ext) | Cono final (int / ext) |
|---|---|---|---|---|---|---|
| L1 | Y10 → X5 | (-15.2, 100.9, 40) | (15.5, 48.0, 14) | 8436.7 | 14° / 20° | 8° / 14° |
| L2 | Y11 → X4 | (84.2, 86.0, 40) | (29.0, 43.8, 14) | 11772.0 | 14° / 20° | 14° / 20° |
| L3 | h25 → X6 | (17.6, 124.1, 40) | (39.4, 48.0, 14) | 16707.1 | 14° / 20° | 8° / 14° |
| L4 | X5 → h17 | (17.2, 68.0, 60) | (13.4, 23.9, 0) | 5179.3 | 14° / 20° | 14° / 20° |
| L5 | X6 → h18 | (35.1, 67.5, 60) | (44.6, 23.9, 0) | 5224.1 | 14° / 20° | 14° / 20° |
| L6 | radial en X4 | (29.0, 43.8, 28) | — | 75 (1/d², corte 20) | — | — |

**Ajuste del cono** (regla del encargo; no se movieron fuentes ni ejes): sala con 3 o más influencias → se cierran 2° los focos que la tocan (más del 10 % de su piso) y no apuntan a ella; sala con 0 → se abre 2° el foco más cercano a ella (por la posición de su fuente en planta), máximo 40°. Si en una misma vuelta un foco se cierra por una sala y se abre por otra, el cambio neto es 0. El cono exterior no baja de 8° y el interior sigue al exterior (6° menos). Terminó tras 4 vueltas por falta de cambios.

| Vuelta | Conos exteriores | Cerrar | Abrir |
|---|---|---|---|
| 0 | L1 20°, L2 20°, L3 20°, L4 20°, L5 20° | L1, L3, L4, L5 | L4, L5 |
| 1 | L1 18°, L2 20°, L3 18°, L4 20°, L5 20° | L1, L3, L4, L5 | L4, L5 |
| 2 | L1 16°, L2 20°, L3 16°, L4 20°, L5 20° | L1, L3, L4, L5 | L4, L5 |
| 3 | L1 14°, L2 20°, L3 14°, L4 20°, L5 20° | L4, L5 | L4, L5 |

**Cobertura de luz final** (fracción del piso con luz directa sin sombra, 4 × 4 muestras por celda; influencia = luz con más del 10 %; `luces_cobertura.png`). La columna «Inicial» es el número de influencias con los conos de partida (20° exterior):

| Sala | Inicial | L1 | L2 | L3 | L4 | L5 | L6 | Final |
|---|---|---|---|---|---|---|---|---|
| X0 | 2 | 0 % | 0 % | 0 % | 19 % | 17 % | 0 % | 2 |
| X3 | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| X4 | 3 | 6 % | 0 % | 19 % | 0 % | 1 % | 100 % | 2 |
| X5 (guía E) | 3 | 28 % | 0 % | 0 % | 17 % | 0 % | 11 % | 3 |
| X6 (guía E) | 3 | 0 % | 4 % | 35 % | 0 % | 15 % | 18 % | 3 |
| Y10 (guía E) | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| Y11 (guía E) | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| sala 16 | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| h17 (guía E) | 1 | 0 % | 0 % | 0 % | 48 % | 0 % | 0 % | 1 |
| h18 (guía E) | 1 | 0 % | 0 % | 0 % | 0 % | 43 % | 0 % | 1 |
| sala 19 | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| sala 20 | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| h23 | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| h24 | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| h25 (guía E) | 0 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |

**Salas que no llegan a 1–2 influencias:** X3, X5, X6, Y10, Y11, sala 16, sala 19, sala 20, h23, h24, h25. `luces_planta.png` dibuja cada fuente, su eje y su cono final sobre el plano del piso destino.

## 2 · Cámaras y métodos

- **Ortográfica:** pitch 55°, yaw 0, desde el sur, 512 × 448, alto visible 36.96 (D1) y 56.0 (D2) celdas.
- **Cenital en perspectiva:** FOV 30 vertical, pitch **71°**, yaw 0, desde el sur, D1 = 68.9683 y D2 = 104.4974 celdas.
- **Método 1 (por room + total):** 15 tomas (una por sala, héroe en la celda caminable de la sala más cercana a su centroide). **Método 2 (bombardeo):** la grilla del 8j con la escena del 8k: 47 en su celda, 18 movidos, 26 saltados = **65 tomas**.
- Tomas: (15 + 65) × 4 combinaciones en color = 320, más 15 × 4 = 60 de la variante blanca. Muro externo entre la cámara y el héroe: se baja el tramo contiguo a altura 0 en esa toma. Tomas con corte:

| Variante / método / cámara | Tomas con corte |
|---|---|
| color/m1_habitaciones/orto55_D1 | 7 |
| color/m1_habitaciones/orto55_D2 | 7 |
| color/m1_habitaciones/persp71_D1 | 4 |
| color/m1_habitaciones/persp71_D2 | 4 |
| color/m2_bombardeo/orto55_D1 | 31 |
| color/m2_bombardeo/orto55_D2 | 31 |
| color/m2_bombardeo/persp71_D1 | 15 |
| color/m2_bombardeo/persp71_D2 | 15 |
| blanco/m1_habitaciones/orto55_D1 | 7 |
| blanco/m1_habitaciones/orto55_D2 | 7 |
| blanco/m1_habitaciones/persp71_D1 | 4 |
| blanco/m1_habitaciones/persp71_D2 | 4 |

## 3 · MiDaS crudo y normalización

Mapa crudo de cada toma guardado sin normalizar, con la cámara exacta y el buffer de ids (`.npz` por toma; **quedan fuera del repo por su tamaño, unos 0,3 GB**; sus hashes están en `HASHES_crudos_vessel_luces_b.txt` y las cámaras de cada toma en el json). Una sola normalización por combinación (variante × método × cámara × distancia): mínimo = percentil 1 y máximo = percentil 99 de todos los píxeles de sus tomas, sin el héroe ni el fondo vacío; todas sus tomas se escalan con ese rango a 0–1.

| Combinación | Tomas | Percentil 1 | Percentil 99 |
|---|---|---|---|
| color/m1_habitaciones/orto55_D1 | 15 | 2368 | 7541 |
| color/m1_habitaciones/orto55_D2 | 15 | 2856 | 7555 |
| color/m1_habitaciones/persp71_D1 | 15 | 653.6 | 6587 |
| color/m1_habitaciones/persp71_D2 | 15 | 903.7 | 6954 |
| color/m2_bombardeo/orto55_D1 | 65 | 2221 | 7489 |
| color/m2_bombardeo/orto55_D2 | 65 | 2587 | 7241 |
| color/m2_bombardeo/persp71_D1 | 65 | 685.3 | 7106 |
| color/m2_bombardeo/persp71_D2 | 65 | 960 | 6717 |
| blanco/m1_habitaciones/orto55_D1 | 15 | 2924 | 7792 |
| blanco/m1_habitaciones/orto55_D2 | 15 | 3239 | 6804 |
| blanco/m1_habitaciones/persp71_D1 | 15 | 546.4 | 7601 |
| blanco/m1_habitaciones/persp71_D2 | 15 | 832.8 | 7076 |

Retroproyección a z = 0 con la cámara de cada toma, 2 × 2 subceldas por celda (el héroe no cuenta). Referencia: promedio S / n y cobertura n por resultado (`.npy` de 216 × 114, NaN donde n = 0).

## 4a · Vecinos (solo método 1)

Vecinas de una sala = las que tocan el mismo componente conexo de celdas gate, puente, escalera y muesca del vessel (se incluyen las escaleras porque los puentes 12 y 13 son las de Y12 e Y13 y la franja se conecta así con el resto):

| Sala | Vecinas |
|---|---|
| X0 | h17, h18 |
| X3 | — |
| X4 | X5, X6 |
| X5 | X4, Y10, h17, sala 19 |
| X6 | X4, Y11, h18, sala 20 |
| Y10 | X5, h23 |
| Y11 | X6, h24 |
| sala 16 | h23 |
| h17 | X0, X5 |
| h18 | X0, X6 |
| sala 19 | X5 |
| sala 20 | X6 |
| h23 | Y10, sala 16 |
| h24 | Y11, h25 |
| h25 | h24 |

Valor inicial: cada subcelda de la sala r toma el valor normalizado de la toma de r (`por_room`); para cada vecina s en orden ascendente, si la toma de s ve la subcelda, v ← (v + x_s) / 2 con el valor normalizado de la toma de s (no el ya mezclado); una subcelda que la propia toma de r no ve queda NaN. Salidas: `por_room.npy`, `vecinos.npy` y `vecinos_mezclas.npy` (mezclas aplicadas por subcelda).

## 4b · Votos sobre el residuo (los dos métodos)

Por toma: píxeles que tocan el piso de nivel 0 (primer impacto en una tapa a z = 0, sin el héroe, la baranda ni los tramos cortados); recta MiDaS crudo = a · (1 / profundidad del plano z = 0) + b por mínimos cuadrados; residuo = (crudo − b) / a − 1 / profundidad del plano z = 0 en toda la toma; voto = residuo > 3 · MAD del residuo de los píxeles de piso. Por subcelda y toma: voto si más de la mitad de sus píxeles votan; residuo = promedio de sus píxeles. **Consenso** = votos / n e **intensidad** = mediana del residuo entre las tomas que ven la subcelda, solo con n ≥ 3. El ajuste de cada toma (escala, desplazamiento, R², MAD) está en el json.

| Combinación | Tomas | Con residuo | Escala ≤ 0 (sin residuo) | < 500 píxeles de piso | R² mediano |
|---|---|---|---|---|---|
| color/m1_habitaciones/orto55_D1 | 15 | 15 | 0 | 0 | 0.842 |
| color/m1_habitaciones/orto55_D2 | 15 | 15 | 0 | 0 | 0.688 |
| color/m1_habitaciones/persp71_D1 | 15 | 10 | 5 | 0 | 0.522 |
| color/m1_habitaciones/persp71_D2 | 15 | 14 | 1 | 0 | 0.628 |
| color/m2_bombardeo/orto55_D1 | 65 | 65 | 0 | 0 | 0.807 |
| color/m2_bombardeo/orto55_D2 | 65 | 65 | 0 | 0 | 0.722 |
| color/m2_bombardeo/persp71_D1 | 65 | 55 | 10 | 0 | 0.704 |
| color/m2_bombardeo/persp71_D2 | 65 | 57 | 8 | 0 | 0.684 |
| blanco/m1_habitaciones/orto55_D1 | 15 | 15 | 0 | 0 | 0.715 |
| blanco/m1_habitaciones/orto55_D2 | 15 | 13 | 2 | 0 | 0.605 |
| blanco/m1_habitaciones/persp71_D1 | 15 | 10 | 5 | 0 | 0.487 |
| blanco/m1_habitaciones/persp71_D2 | 15 | 9 | 6 | 0 | 0.484 |

## 5 · Variante blanca

Solo método 1 (15 tomas × 4 combinaciones = 60): todas las superficies del mismo blanco (piso, muros, caras, escaleras y baranda; el héroe como siempre) y las mismas luces de foco finales. Mismos productos que el método 1 en color. Resultados bajo `blanco/` en las tablas y carpetas.

## 6 · K-means y superposición

K-means N = 4, `seed 0`, sobre `vecinos`, `consenso`, `intensidad` y `promedio` (el método 2 no tiene `vecinos`), solo subceldas con dato; superposición sobre `base_muros_piso_k.png`; recorte A (regla del 8c) y recorte por zona (zonas conexas de ≥ 20 subceldas de cada banda con más de la mitad sobre gris).

| Resultado | Mapa | Subceldas con dato | Fracción de gris, bandas 0 / 1 / 2 / 3 | Bandas de muro (A) | Rojo A | Zonas ≥ 20 | Rojo por zona |
|---|---|---|---|---|---|---|---|
| color/m1_habitaciones/orto55_D1 | promedio | 24596 | 0.324 / 0.376 / 0.184 / 0.147 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/orto55_D1 | vecinos | 9182 | 0.608 / 0.148 / 0.226 / 0.229 | [0] | 0 | 10 | 502 |
| color/m1_habitaciones/orto55_D1 | consenso | 18018 | 0.317 / 0.511 / 0.442 / 0.249 | [1] | 763 | 16 | 753 |
| color/m1_habitaciones/orto55_D1 | intensidad | 18018 | 0.337 / 0.419 / 0.278 / 0.191 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/orto55_D2 | promedio | 24624 | 0.218 / 0.343 / 0.264 / 0.164 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/orto55_D2 | vecinos | 9182 | 0.007 / 0.236 / 0.348 / 0.648 | [3] | 0 | 4 | 340 |
| color/m1_habitaciones/orto55_D2 | consenso | 21412 | 0.431 / 0.455 / 0.495 / 0.186 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/orto55_D2 | intensidad | 21412 | 0.357 / 0.345 / 0.244 / 0.119 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/persp71_D1 | promedio | 24212 | 0.201 / 0.247 / 0.232 / 0.463 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/persp71_D1 | vecinos | 9233 | 0.055 / 0.089 / 0.220 / 0.651 | [3] | 0 | 7 | 733 |
| color/m1_habitaciones/persp71_D1 | consenso | 9892 | 0.670 / 0.394 / 0.369 / 0.230 | [0] | 97 | 3 | 90 |
| color/m1_habitaciones/persp71_D1 | intensidad | 9892 | 0.234 / 0.328 / 0.302 / 0.440 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/persp71_D2 | promedio | 24624 | 0.319 / 0.184 / 0.302 / 0.286 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/persp71_D2 | vecinos | 9371 | 0.256 / 0.078 / 0.357 / 0.203 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/persp71_D2 | consenso | 21411 | 0.363 / 0.406 / 0.262 / 0.275 | ninguna | 0 | 0 | 0 |
| color/m1_habitaciones/persp71_D2 | intensidad | 21411 | 0.192 / 0.336 / 0.315 / 0.233 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/orto55_D1 | promedio | 24624 | 0.273 / 0.435 / 0.181 / 0.190 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/orto55_D1 | consenso | 21430 | 0.279 / 0.425 / 0.433 / 0.242 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/orto55_D1 | intensidad | 21430 | 0.396 / 0.361 / 0.281 / 0.215 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/orto55_D2 | promedio | 24624 | 0.236 / 0.335 / 0.204 / 0.097 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/orto55_D2 | consenso | 21436 | 0.370 / 0.427 / 0.414 / 0.225 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/orto55_D2 | intensidad | 21436 | 0.372 / 0.356 / 0.203 / 0.158 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/persp71_D1 | promedio | 24624 | 0.226 / 0.241 / 0.334 / 0.235 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/persp71_D1 | consenso | 21928 | 0.289 / 0.540 / 0.351 / 0.176 | [1] | 1351 | 14 | 1366 |
| color/m2_bombardeo/persp71_D1 | intensidad | 21928 | 0.000 / 0.270 / 0.368 / 0.287 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/persp71_D2 | promedio | 24624 | 0.327 / 0.223 / 0.303 / 0.241 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/persp71_D2 | consenso | 22578 | 0.238 / 0.424 / 0.393 / 0.214 | ninguna | 0 | 0 | 0 |
| color/m2_bombardeo/persp71_D2 | intensidad | 22578 | 0.000 / 0.309 / 0.293 / 0.300 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/orto55_D1 | promedio | 24596 | 0.418 / 0.348 / 0.156 / 0.212 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/orto55_D1 | vecinos | 9182 | 0.837 / 0.223 / 0.282 / 0.026 | [0] | 0 | 4 | 109 |
| blanco/m1_habitaciones/orto55_D1 | consenso | 18018 | 0.630 / 0.547 / 0.443 / 0.216 | [0, 1] | 1280 | 21 | 1272 |
| blanco/m1_habitaciones/orto55_D1 | intensidad | 18018 | 0.518 / 0.380 / 0.225 / 0.201 | [0] | 956 | 3 | 954 |
| blanco/m1_habitaciones/orto55_D2 | promedio | 24624 | 0.216 / 0.350 / 0.209 / 0.183 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/orto55_D2 | vecinos | 9182 | 0.001 / 0.237 / 0.364 / 0.442 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/orto55_D2 | consenso | 21248 | 0.382 / 0.539 / 0.467 / 0.230 | [1] | 476 | 10 | 509 |
| blanco/m1_habitaciones/orto55_D2 | intensidad | 21248 | 0.449 / 0.372 / 0.287 / 0.193 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/persp71_D1 | promedio | 24212 | 0.235 / 0.186 / 0.210 / 0.461 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/persp71_D1 | vecinos | 9233 | 0.000 / 0.031 / 0.085 / 0.665 | [3] | 0 | 7 | 964 |
| blanco/m1_habitaciones/persp71_D1 | consenso | 12608 | 0.556 / 0.407 / 0.383 / 0.314 | [0] | 19 | 1 | 19 |
| blanco/m1_habitaciones/persp71_D1 | intensidad | 12608 | 0.231 / 0.284 / 0.433 / 0.883 | [3] | 42 | 1 | 42 |
| blanco/m1_habitaciones/persp71_D2 | promedio | 24624 | 0.253 / 0.208 / 0.194 / 0.414 | ninguna | 0 | 0 | 0 |
| blanco/m1_habitaciones/persp71_D2 | vecinos | 9371 | 0.000 / 0.028 / 0.195 / 0.751 | [3] | 0 | 8 | 508 |
| blanco/m1_habitaciones/persp71_D2 | consenso | 14741 | 0.302 / 0.316 / 0.551 / 0.349 | [2] | 551 | 10 | 607 |
| blanco/m1_habitaciones/persp71_D2 | intensidad | 14741 | 0.443 / 0.263 / 0.429 / 0.304 | ninguna | 0 | 0 | 0 |

Centros de las bandas 0 a 3 de cada K-means:

| Resultado y mapa | Centros |
|---|---|
| color/m1_habitaciones/orto55_D1 promedio | 0.6898 / 0.5529 / 0.4201 / 0.2587 |
| color/m1_habitaciones/orto55_D1 vecinos | 0.6852 / 0.5706 / 0.4632 / 0.348 |
| color/m1_habitaciones/orto55_D1 consenso | 0.5744 / 0.3455 / 0.1978 / -0 |
| color/m1_habitaciones/orto55_D1 intensidad | 3.7e-05 / 1.5e-05 / 0 / -1.8e-05 |
| color/m1_habitaciones/orto55_D2 promedio | 0.5886 / 0.4783 / 0.4103 / 0.257 |
| color/m1_habitaciones/orto55_D2 vecinos | 0.5774 / 0.4963 / 0.4316 / 0.3465 |
| color/m1_habitaciones/orto55_D2 consenso | 0.4074 / 0.2564 / 0.1305 / -0 |
| color/m1_habitaciones/orto55_D2 intensidad | 3.9e-05 / 9e-06 / -1.9e-05 / -6.9e-05 |
| color/m1_habitaciones/persp71_D1 promedio | 0.6818 / 0.5335 / 0.3918 / 0.2315 |
| color/m1_habitaciones/persp71_D1 vecinos | 0.6125 / 0.4672 / 0.3477 / 0.2038 |
| color/m1_habitaciones/persp71_D1 consenso | 0.6596 / 0.451 / 0.3055 / 0 |
| color/m1_habitaciones/persp71_D1 intensidad | 0.001492 / 0.000295 / -7.2e-05 / -0.000545 |
| color/m1_habitaciones/persp71_D2 promedio | 0.6826 / 0.4731 / 0.3263 / 0.1647 |
| color/m1_habitaciones/persp71_D2 vecinos | 0.6928 / 0.4839 / 0.3163 / 0.1774 |
| color/m1_habitaciones/persp71_D2 consenso | 0.8071 / 0.4728 / 0.1712 / 0 |
| color/m1_habitaciones/persp71_D2 intensidad | 0.00429 / 0.000818 / 8e-06 / -0.001288 |
| color/m2_bombardeo/orto55_D1 promedio | 0.7319 / 0.5962 / 0.4814 / 0.3011 |
| color/m2_bombardeo/orto55_D1 consenso | 0.578 / 0.3154 / 0.1586 / 0.01158 |
| color/m2_bombardeo/orto55_D1 intensidad | 4.6e-05 / 1.6e-05 / -2e-06 / -3e-05 |
| color/m2_bombardeo/orto55_D2 promedio | 0.6861 / 0.5579 / 0.4634 / 0.3375 |
| color/m2_bombardeo/orto55_D2 consenso | 0.3216 / 0.2074 / 0.09902 / 0.008986 |
| color/m2_bombardeo/orto55_D2 intensidad | 3.7e-05 / 9e-06 / -1.8e-05 / -8.9e-05 |
| color/m2_bombardeo/persp71_D1 promedio | 0.71 / 0.516 / 0.3933 / 0.2574 |
| color/m2_bombardeo/persp71_D1 consenso | 0.8264 / 0.472 / 0.2703 / 0.06835 |
| color/m2_bombardeo/persp71_D1 intensidad | 0.01407 / 0.002885 / 0.000879 / 1.5e-05 |
| color/m2_bombardeo/persp71_D2 promedio | 0.6581 / 0.4864 / 0.3528 / 0.2441 |
| color/m2_bombardeo/persp71_D2 consenso | 0.7938 / 0.5426 / 0.2414 / 0.03598 |
| color/m2_bombardeo/persp71_D2 intensidad | 0.006763 / 0.000671 / 2.8e-05 / -0.000664 |
| blanco/m1_habitaciones/orto55_D1 promedio | 0.6468 / 0.5242 / 0.3975 / 0.2419 |
| blanco/m1_habitaciones/orto55_D1 vecinos | 0.7008 / 0.5302 / 0.4365 / 0.3062 |
| blanco/m1_habitaciones/orto55_D1 consenso | 0.4974 / 0.3013 / 0.1709 / -0 |
| blanco/m1_habitaciones/orto55_D1 intensidad | 4.5e-05 / 1.7e-05 / -6e-06 / -3.5e-05 |
| blanco/m1_habitaciones/orto55_D2 promedio | 0.675 / 0.5338 / 0.3972 / 0.2062 |
| blanco/m1_habitaciones/orto55_D2 vecinos | 0.6246 / 0.54 / 0.4581 / 0.3466 |
| blanco/m1_habitaciones/orto55_D2 consenso | 0.5468 / 0.3365 / 0.1486 / 0 |
| blanco/m1_habitaciones/orto55_D2 intensidad | 0.000133 / 3.2e-05 / 0 / -4e-05 |
| blanco/m1_habitaciones/persp71_D1 promedio | 0.7392 / 0.5279 / 0.3821 / 0.2511 |
| blanco/m1_habitaciones/persp71_D1 vecinos | 0.719 / 0.5074 / 0.3629 / 0.1802 |
| blanco/m1_habitaciones/persp71_D1 consenso | 1 / 0.6469 / 0.2799 / 0 |
| blanco/m1_habitaciones/persp71_D1 intensidad | 0.000571 / -7.5e-05 / -0.000519 / -0.002303 |
| blanco/m1_habitaciones/persp71_D2 promedio | 0.7398 / 0.5341 / 0.3908 / 0.2707 |
| blanco/m1_habitaciones/persp71_D2 vecinos | 0.6649 / 0.5274 / 0.3659 / 0.2134 |
| blanco/m1_habitaciones/persp71_D2 consenso | 0.7534 / 0.4711 / 0.1919 / 0 |
| blanco/m1_habitaciones/persp71_D2 intensidad | 0.000795 / 0.000256 / -5.7e-05 / -0.000411 |

## Archivos

- `luces_planta.png`, `luces_cobertura.png`.
- `tomas/<variante>/<método>/<cámara>_<D>/*.png`: toma iluminada | MiDaS normalizado | residuo (rojo = más cerca que el plano z = 0, rojo pleno a 6 MAD; gris = sin ajuste).
- `resultados/<variante>/<método>/<cámara>_<D>/`: `promedio`, `cobertura`, `consenso`, `intensidad` (y en el método 1 `por_room`, `vecinos` y `vecinos_mezclas.npy`) en PNG y `.npy`.
- `superpuesto_<variante>_<método>_<cámara>_<D>_<mapa>.png`: base | bandas | recorte A | recorte por zona.
- `vessel_luces_b.json` y `HASHES_vessel_luces_b.txt` (dos corridas completas, mismos hashes); `HASHES_crudos_vessel_luces_b.txt` (hashes de los `.npz` crudos que quedan fuera del repo).

Los scripts, el entorno, los pesos y los crudos (MiDaS sin normalizar e ids) quedan fuera del repo.
