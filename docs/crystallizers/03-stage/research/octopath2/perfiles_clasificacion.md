# Clasificación de las 88 salas de «Balanced types» en perfiles de forma (Parte A, T2)

Solo medición: no se tocó `src/`. Herramienta: `tools/perfiles_clasificacion.js` (los datos crudos: `perfiles_clasificacion.json`) y `tools/perfiles_report.js` (este documento). Tabla de perfiles y umbrales: `perfiles_forma.md` §2, sin moverlos.

## 1. Cómo se midió

- **Salas:** las 88 del mapa real con «Balanced types» (terrazas 3, núcleo mínimo 100, radio 5, minPlateau 120); tipos DAC de la clasificación del mapa entero: 29 Cake / 18 Diorama / 41 Ascension (las cifras del proyecto). Terreno de la Base v2.4: terraza 1,25 H (terH 1.875 tiles), subs 2, `tilesPerH` 1.5; transiciones del ejemplo `dac_stage` (escalones, tread 1, variante de relleno). Es el mismo P de los ejemplos de la Parte B.
- **Dirección, largo y ancho:** `E.orient` con cada sala como ventana de UNA sala (como `mockt_z14` y `mockt_x44`; no hay un orden de 88 salas que dé puertas de entrada y salida, así que el eje va de la parte más baja a la más alta). Largo = extensión de los tiles caminables a lo largo del eje, ancho = de través, ambos en H (tiles / 1,5). Además se da el **ancho medio** (tiles caminables / dimensión larga).
- **Perfil (tabla de §2, sin mover umbrales):**
  - Z o X: el **ancho** es la dimensión corta de la extensión (E.orient mira a lo largo de la larga en los dos casos). P1 si 3–5 H, P2 si 6–12 H, y el **largo** debe ser de más de una toma (> 17 H, «varias tomas»). Un ancho entre 5 y 6 H, menor de 3 H o mayor de 12 H = ninguno.
  - Hub: P3 si cabe en una toma (≤ 18 H de través y ≤ 17 H de fondo, la referencia de §2). **P4 (Hub deep) tiene las mismas dimensiones que P3**: lo que lo distingue es un fondo o hito lejano visible detrás, que no sale de las dimensiones de la sala; por eso se cuentan juntos como **P3/P4** y no se separan.
  - P5 y P6 son interiores y no se aplican a estas salas.
- **Casos en el límite** (se cuentan aparte; la clasificación principal es la estricta): ancho en el hueco 5–6 H de la tabla, forma de P1/P2 con largo de una sola toma, ancho o largo a menos del 10 % de un umbral, Hub a menos del 10 % del borde de la toma, y razón largo/ancho a menos del 5 % del umbral de dirección (1,5 / 0,67).

## 2. Resultado

**T2 (la mayoría de las salas no entra en ningún perfil): SE CUMPLE.** 49 de 88 salas (56 %) quedan en «ninguno»; 39 entran en un perfil.

### Matriz perfil × tipo DAC (conteo de salas)

| Perfil | Diorama | Ascension | Cake | Total |
|---|---|---|---|---|
| P1 | 0 | 0 | 0 | 0 |
| P2 | 1 | 1 | 2 | 4 |
| P3/P4 | 10 | 21 | 4 | 35 |
| **ninguno** | 7 | 19 | 23 | 49 |
| **Total** | 18 | 41 | 29 | 88 |

Direcciones (`E.orient`) por tipo:

| Dirección | Diorama | Ascension | Cake | Total |
|---|---|---|---|---|
| Z | 3 | 17 | 7 | 27 |
| X | 1 | 0 | 3 | 4 |
| Hub | 14 | 24 | 19 | 57 |

### Las salas en «ninguno»

- 49 salas: 27 Z o X y 22 Hub.
- **Ancho típico** (mediana, dimensión corta de la extensión): 15.2 H; mediana de la dimensión larga: 19.8 H; mediana del ancho medio: 7.8 H. Rango del ancho: 0.7–60.7 H.
- Z o X en «ninguno» (27): ancho típico (mediana) 5.6 H, largo típico 11.9 H. Hub en «ninguno» (22): 21.8 × 21.3 H (de través × de fondo), contra una toma de 18 × 17 H.
- Por qué quedan en «ninguno» (la razón de la clasificación estricta): Hub que no cabe en una toma: 22; ancho > 12 H: 9; forma P1/P2 pero largo de una sola toma: 12; ancho < 3 H: 3; ancho en el hueco 5–6 H: 3.

## 3. Casos en el límite (contados aparte; no se movió ningún umbral)

35 salas tienen al menos una señal de límite (la clasificación principal ya las puso donde la tabla estricta las pone).

| Señal | Salas |
|---|---|
| Hub a menos del 10 % de una toma | 4: 1, 27, 66, 84 |
| largo a menos del 10 % de una toma | 4: 2, 21, 30, 78 |
| Hub a menos del 10 % del borde de la toma | 6: 3, 29, 49, 52, 61, 77 |
| ancho de P1/P2 con largo de una sola toma | 12: 12, 16, 18, 25, 31, 33, 37, 50, 54, 55, 67, 70 |
| ancho a menos del 10 % de un umbral | 15: 12, 16, 21, 25, 30, 32, 37, 54, 55, 60, 70, 76, 78, 80, 88 |
| razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) | 8: 21, 22, 44, 63, 77, 78, 79, 80 |
| ancho en el hueco 5-6 H de la tabla | 3: 32, 76, 88 |

**Lectura alternativa del ancho (ancho medio en lugar de la extensión de través, solo Z y X):** 9 salas cambiarían de perfil (2: P2 → ninguno; 6: ninguno → P2; 11: ninguno → P2; 21: P2 → P1; 23: ninguno → P2; 60: ninguno → P2; 63: ninguno → P2; 78: P2 → ninguno; 80: ninguno → P1). Con el ancho medio el conteo sería: P1 2, P2 6, P3/P4 35, ninguno 45. La clasificación principal sigue siendo la de la extensión (es lo que pide el pedido: «ancho y largo de lo caminable… a lo largo de su eje y de través»).

## 4. Tabla completa de las 88 salas

L = largo a lo largo del eje, A = ancho de través, ambos en H (extensión de los tiles caminables); A medio = tiles caminables / dimensión larga; Δh = rango de alturas del piso caminable en H (relieve dentro de la sala); razón = L / A de `E.orient`.

| Sala | Tipo DAC | Dir. | L (H) | A (H) | A medio (H) | razón | Δh (H) | Perfil | con A medio | Razón de la clasificación | Límite |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ascension | Hub | 15.1 | 18.7 | 8.0 | 0.80 | 0.97 | **ninguno** | = | no cabe en una toma (18.7 x 15.1 H) | Hub a menos del 10 % de una toma |
| 2 | Cake | Z | 17.5 | 9.7 | 5.7 | 1.80 | 0.00 | P2 | ninguno | ancho 9.7 H, largo 17.5 H | largo a menos del 10 % de una toma |
| 3 | Ascension | Hub | 16.4 | 12.7 | 7.5 | 1.29 | 0.28 | P3/P4 | = | cabe en una toma | Hub a menos del 10 % del borde de la toma |
| 4 | Diorama | Hub | 10.1 | 10.9 | 5.9 | 0.92 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 5 | Ascension | Hub | 12.1 | 11.3 | 6.7 | 1.07 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 6 | Cake | Z | 44.7 | 20.1 | 9.2 | 2.23 | 1.52 | **ninguno** | P2 | ancho 20.1 H > 12 H |  |
| 7 | Diorama | Hub | 40.9 | 33.7 | 12.8 | 1.21 | 1.52 | **ninguno** | = | no cabe en una toma (33.7 x 40.9 H) |  |
| 8 | Cake | Hub | 22.7 | 18.4 | 7.7 | 1.23 | 1.52 | **ninguno** | = | no cabe en una toma (18.4 x 22.7 H) |  |
| 9 | Cake | Hub | 20.5 | 22.3 | 9.4 | 0.92 | 1.25 | **ninguno** | = | no cabe en una toma (22.3 x 20.5 H) |  |
| 10 | Diorama | Hub | 10.1 | 7.4 | 3.6 | 1.37 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 11 | Cake | Z | 38.6 | 21.3 | 10.0 | 1.81 | 1.52 | **ninguno** | P2 | ancho 21.3 H > 12 H |  |
| 12 | Ascension | Z | 9.6 | 4.9 | 2.5 | 1.96 | 0.28 | **ninguno** | = | forma P1 (ancho 4.9 H) pero largo 9.6 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 13 | Ascension | Z | 5.3 | 0.7 | 0.7 | 8.00 | 0.00 | **ninguno** | = | ancho 0.7 H < 3 H (menos que el paso de A182) |  |
| 14 | Ascension | Z | 26.4 | 16.3 | 5.7 | 1.62 | 0.28 | **ninguno** | = | ancho 16.3 H > 12 H |  |
| 15 | Ascension | Z | 2.7 | 1.3 | 1.0 | 2.00 | 0.00 | **ninguno** | = | ancho 1.3 H < 3 H (menos que el paso de A182) |  |
| 16 | Ascension | Z | 9.1 | 4.6 | 2.8 | 1.98 | 0.28 | **ninguno** | = | forma P1 (ancho 4.6 H) pero largo 9.1 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 17 | Ascension | Hub | 14.8 | 14.7 | 9.7 | 1.01 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 18 | Ascension | Z | 13.2 | 8.0 | 4.6 | 1.65 | 0.28 | **ninguno** | = | forma P2 (ancho 8.0 H) pero largo 13.2 H <= 1 toma | ancho de P1/P2 con largo de una sola toma |
| 19 | Cake | Hub | 10.1 | 9.5 | 5.1 | 1.05 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 20 | Diorama | Hub | 18.5 | 20.9 | 8.3 | 0.89 | 0.28 | **ninguno** | = | no cabe en una toma (20.9 x 18.5 H) |  |
| 21 | Cake | Z | 17.5 | 11.4 | 4.7 | 1.54 | 1.25 | P2 | P1 | ancho 11.4 H, largo 17.5 H | ancho a menos del 10 % de un umbral; largo a menos del 10 % de una toma; razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 22 | Diorama | Hub | 11.8 | 8.1 | 4.7 | 1.47 | 0.28 | P3/P4 | = | cabe en una toma | razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 23 | Cake | Z | 68.3 | 38.1 | 11.8 | 1.79 | 2.77 | **ninguno** | P2 | ancho 38.1 H > 12 H |  |
| 24 | Ascension | Hub | 8.1 | 7.9 | 4.3 | 1.03 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 25 | Diorama | Z | 5.1 | 3.0 | 1.6 | 1.69 | 0.00 | **ninguno** | = | forma P1 (ancho 3.0 H) pero largo 5.1 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 26 | Ascension | Hub | 5.6 | 4.4 | 2.7 | 1.28 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 27 | Ascension | Hub | 17.2 | 13.9 | 7.3 | 1.24 | 0.28 | **ninguno** | = | no cabe en una toma (13.9 x 17.2 H) | Hub a menos del 10 % de una toma |
| 28 | Cake | Hub | 8.5 | 10.3 | 5.2 | 0.83 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 29 | Cake | Hub | 16.5 | 13.5 | 7.9 | 1.22 | 1.52 | P3/P4 | = | cabe en una toma | Hub a menos del 10 % del borde de la toma |
| 30 | Diorama | Z | 18.1 | 11.3 | 6.4 | 1.60 | 1.52 | P2 | = | ancho 11.3 H, largo 18.1 H | ancho a menos del 10 % de un umbral; largo a menos del 10 % de una toma |
| 31 | Diorama | Z | 16.7 | 10.5 | 5.9 | 1.59 | 0.28 | **ninguno** | = | forma P2 (ancho 10.5 H) pero largo 16.7 H <= 1 toma | ancho de P1/P2 con largo de una sola toma |
| 32 | Ascension | Z | 11.9 | 5.6 | 2.7 | 2.11 | 0.00 | **ninguno** | = | ancho 5.6 H entre P1 y P2 | ancho en el hueco 5-6 H de la tabla; ancho a menos del 10 % de un umbral |
| 33 | Ascension | Z | 11.0 | 3.7 | 1.9 | 2.95 | 0.28 | **ninguno** | = | forma P1 (ancho 3.7 H) pero largo 11.0 H <= 1 toma | ancho de P1/P2 con largo de una sola toma |
| 34 | Diorama | Hub | 7.8 | 6.5 | 4.0 | 1.21 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 35 | Diorama | Hub | 14.3 | 12.5 | 5.9 | 1.14 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 36 | Cake | Hub | 18.8 | 21.3 | 9.3 | 0.88 | 1.52 | **ninguno** | = | no cabe en una toma (21.3 x 18.8 H) |  |
| 37 | Ascension | Z | 9.4 | 4.6 | 2.4 | 2.03 | 0.28 | **ninguno** | = | forma P1 (ancho 4.6 H) pero largo 9.4 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 38 | Diorama | Hub | 11.1 | 14.2 | 4.6 | 0.79 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 39 | Ascension | Z | 3.3 | 2.1 | 1.2 | 1.58 | 0.00 | **ninguno** | = | ancho 2.1 H < 3 H (menos que el paso de A182) |  |
| 40 | Ascension | Hub | 3.3 | 2.5 | 1.7 | 1.36 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 41 | Ascension | Hub | 10.5 | 7.8 | 4.0 | 1.35 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 42 | Ascension | Hub | 7.3 | 6.1 | 3.3 | 1.18 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 43 | Cake | Hub | 19.3 | 14.3 | 7.1 | 1.35 | 0.28 | **ninguno** | = | no cabe en una toma (14.3 x 19.3 H) |  |
| 44 | Cake | Z | 63.1 | 41.5 | 13.3 | 1.52 | 1.52 | **ninguno** | = | ancho 41.5 H > 12 H | razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 45 | Ascension | Hub | 4.3 | 3.3 | 2.1 | 1.34 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 46 | Ascension | Hub | 13.9 | 11.8 | 6.1 | 1.18 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 47 | Cake | Hub | 22.0 | 16.0 | 7.8 | 1.37 | 1.25 | **ninguno** | = | no cabe en una toma (16.0 x 22.0 H) |  |
| 48 | Cake | Hub | 24.3 | 26.6 | 8.8 | 0.91 | 1.25 | **ninguno** | = | no cabe en una toma (26.6 x 24.3 H) |  |
| 49 | Diorama | Hub | 15.5 | 12.7 | 5.6 | 1.22 | 0.28 | P3/P4 | = | cabe en una toma | Hub a menos del 10 % del borde de la toma |
| 50 | Ascension | Z | 6.1 | 3.5 | 1.6 | 1.77 | 0.28 | **ninguno** | = | forma P1 (ancho 3.5 H) pero largo 6.1 H <= 1 toma | ancho de P1/P2 con largo de una sola toma |
| 51 | Ascension | Hub | 5.1 | 4.9 | 2.5 | 1.03 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 52 | Cake | Hub | 17.0 | 15.9 | 7.2 | 1.07 | 0.97 | P3/P4 | = | cabe en una toma | Hub a menos del 10 % del borde de la toma |
| 53 | Diorama | Hub | 10.5 | 12.1 | 6.2 | 0.87 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 54 | Ascension | Z | 9.6 | 4.5 | 2.5 | 2.12 | 0.28 | **ninguno** | = | forma P1 (ancho 4.5 H) pero largo 9.6 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 55 | Cake | Z | 13.4 | 4.8 | 3.1 | 2.79 | 0.28 | **ninguno** | = | forma P1 (ancho 4.8 H) pero largo 13.4 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 56 | Ascension | Hub | 6.1 | 6.3 | 2.3 | 0.98 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 57 | Ascension | Hub | 19.4 | 22.5 | 9.2 | 0.86 | 0.28 | **ninguno** | = | no cabe en una toma (22.5 x 19.4 H) |  |
| 58 | Ascension | Hub | 11.3 | 12.5 | 6.1 | 0.90 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 59 | Cake | Hub | 34.5 | 29.9 | 13.6 | 1.15 | 2.77 | **ninguno** | = | no cabe en una toma (29.9 x 34.5 H) |  |
| 60 | Cake | X | 12.8 | 22.1 | 7.4 | 0.58 | 1.25 | **ninguno** | P2 | ancho 12.8 H > 12 H | ancho a menos del 10 % de un umbral |
| 61 | Ascension | Hub | 14.4 | 16.7 | 7.1 | 0.87 | 0.28 | P3/P4 | = | cabe en una toma | Hub a menos del 10 % del borde de la toma |
| 62 | Ascension | Hub | 10.3 | 7.5 | 4.0 | 1.36 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 63 | Cake | X | 15.2 | 23.9 | 8.3 | 0.64 | 1.25 | **ninguno** | P2 | ancho 15.2 H > 12 H | razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 64 | Diorama | Hub | 33.5 | 37.3 | 12.5 | 0.90 | 0.28 | **ninguno** | = | no cabe en una toma (37.3 x 33.5 H) |  |
| 65 | Cake | Hub | 25.7 | 21.1 | 13.4 | 1.22 | 1.25 | **ninguno** | = | no cabe en una toma (21.1 x 25.7 H) |  |
| 66 | Diorama | Hub | 17.2 | 19.8 | 10.0 | 0.87 | 0.28 | **ninguno** | = | no cabe en una toma (19.8 x 17.2 H) | Hub a menos del 10 % de una toma |
| 67 | Ascension | Z | 6.6 | 3.9 | 2.5 | 1.67 | 0.28 | **ninguno** | = | forma P1 (ancho 3.9 H) pero largo 6.6 H <= 1 toma | ancho de P1/P2 con largo de una sola toma |
| 68 | Diorama | Hub | 12.6 | 9.9 | 5.6 | 1.28 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 69 | Ascension | Hub | 14.3 | 14.9 | 4.6 | 0.95 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 70 | Ascension | Z | 10.5 | 6.3 | 3.4 | 1.67 | 0.00 | **ninguno** | = | forma P2 (ancho 6.3 H) pero largo 10.5 H <= 1 toma | ancho de P1/P2 con largo de una sola toma; ancho a menos del 10 % de un umbral |
| 71 | Ascension | Hub | 9.7 | 7.5 | 3.4 | 1.28 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 72 | Cake | Hub | 35.8 | 30.9 | 10.4 | 1.16 | 1.52 | **ninguno** | = | no cabe en una toma (30.9 x 35.8 H) |  |
| 73 | Cake | Hub | 19.6 | 15.7 | 10.9 | 1.25 | 1.52 | **ninguno** | = | no cabe en una toma (15.7 x 19.6 H) |  |
| 74 | Diorama | Hub | 11.7 | 11.1 | 5.1 | 1.05 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 75 | Ascension | Hub | 7.3 | 6.7 | 3.9 | 1.10 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 76 | Ascension | Z | 11.0 | 5.4 | 2.6 | 2.04 | 0.00 | **ninguno** | = | ancho 5.4 H entre P1 y P2 | ancho en el hueco 5-6 H de la tabla; ancho a menos del 10 % de un umbral |
| 77 | Ascension | Hub | 11.5 | 17.1 | 5.4 | 0.68 | 0.28 | P3/P4 | = | cabe en una toma | Hub a menos del 10 % del borde de la toma; razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 78 | Ascension | Z | 17.4 | 11.6 | 5.7 | 1.50 | 0.28 | P2 | ninguno | ancho 11.6 H, largo 17.4 H | ancho a menos del 10 % de un umbral; largo a menos del 10 % de una toma; razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 79 | Cake | Hub | 42.2 | 29.2 | 10.5 | 1.44 | 1.53 | **ninguno** | = | no cabe en una toma (29.2 x 42.2 H) | razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 80 | Diorama | X | 12.7 | 19.3 | 5.0 | 0.66 | 0.28 | **ninguno** | P1 | ancho 12.7 H > 12 H | ancho a menos del 10 % de un umbral; razon largo/ancho a menos del 5 % del umbral de direccion (1,5 / 0,67) |
| 81 | Ascension | Hub | 8.8 | 7.5 | 4.7 | 1.17 | 0.28 | P3/P4 | = | cabe en una toma |  |
| 82 | Cake | X | 60.7 | 115.6 | 16.9 | 0.53 | 2.77 | **ninguno** | = | ancho 60.7 H > 12 H |  |
| 83 | Cake | Hub | 20.5 | 22.4 | 10.0 | 0.91 | 1.53 | **ninguno** | = | no cabe en una toma (22.4 x 20.5 H) |  |
| 84 | Cake | Hub | 17.8 | 14.3 | 8.5 | 1.25 | 1.25 | **ninguno** | = | no cabe en una toma (14.3 x 17.8 H) | Hub a menos del 10 % de una toma |
| 85 | Cake | Hub | 25.9 | 28.3 | 12.5 | 0.92 | 2.77 | **ninguno** | = | no cabe en una toma (28.3 x 25.9 H) |  |
| 86 | Cake | Hub | 39.2 | 38.7 | 12.6 | 1.01 | 0.28 | **ninguno** | = | no cabe en una toma (38.7 x 39.2 H) |  |
| 87 | Ascension | Hub | 7.0 | 5.6 | 3.6 | 1.25 | 0.00 | P3/P4 | = | cabe en una toma |  |
| 88 | Ascension | Z | 16.3 | 5.6 | 2.3 | 2.92 | 0.27 | **ninguno** | = | ancho 5.6 H entre P1 y P2 | ancho en el hueco 5-6 H de la tabla; ancho a menos del 10 % de un umbral |


---

## v2 · T2 por partes (PR pend P6, deuda A500; solo medida, la v1 de arriba queda intacta)

Herramienta `tools/perfiles_partes.js` (datos: `perfiles_partes_balanced3.json`, `perfiles_partes_default9.json`). Cada sala del mapa completo (constructor DAC3) se corta en PARTES y cada parte se clasifica con la tabla v2 de `verticalidad.md` §6 (ancho y largo en H, tilesPerH 1,5). Método (hipótesis de la herramienta, escritas en su cabecera): grosor = distancia euclídea al borde de la sala; **área central** = componentes con ancho ≥ 6 H y ≥ 20 baldosas; su borde de 4,5 baldosas es suyo, no es pasillo; el resto son componentes de **pasillo**, y es **codo** si su caja es en L (lado corto ≥ 60 % del largo y relleno < 55 %); ancho de una parte = (2·percentil 90 de distancias + 1) / tilesPerH.

**Limitaciones (dicho con franqueza):** no recorre entrada → núcleo → salidas como camino; las partes son componentes. El criterio de codo por caja marca como «codo» también los pasillos diagonales (por eso «codo» domina). La primera versión midió el ancho con la media de las distancias y daba todo «< 2,5 H» (la media lee la mitad del ancho); se cambió al percentil 90 antes de entregar, y esa decisión no tiene una medida contra una sala conocida: está por validar.

### Balanced 3 (86 salas con baldosas caminables)
| Parte | Perfil (tabla v2) | Partes |
|---|---|---|
| central | P3/P4 Hub | 30 |
| codo | P1 | 22 |
| codo | P1c | 34 |
| codo | ninguno (< 2,5) | 3 |
| pasillo | P1 | 8 |
| pasillo | P1c | 52 |
| pasillo | ninguno (< 2,5) | 21 |

### Default 9 (31 salas con baldosas caminables)
| Parte | Perfil (tabla v2) | Partes |
|---|---|---|
| central | P3/P4 Hub | 5 |
| codo | P1 | 23 |
| codo | P1c | 17 |
| codo | ninguno (< 2,5) | 6 |
| pasillo | P1 | 3 |
| pasillo | P1c | 6 |
| pasillo | ninguno (< 2,5) | 7 |
