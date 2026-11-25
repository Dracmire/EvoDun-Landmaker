# PP2 paso 9 · medir al héroe y el marco contra X4, X5 y X6 (solo lectura)

Base `0c21631` (`vessel_altura_c`). Solo lectura: no se tocó la escena, ni `src/`, ni `tools/`, y no se corrió la red. Antes de empezar comprobé `HASHES_vessel_altura_c.txt` (los 4 archivos coinciden). El `MODELO_ACTUAL.md` está en `research/metodologia/` (no existe `claude/MODELO_ACTUAL.md` en el repo); lo leí, pero no define `P1_R` ni la guía E: esos datos salen de `vessel_limites/`, `vessel_altura_c/` y `guias/E/`. Sin veredicto. Carpeta de salida elegida por mí (el encargo no la nombraba): `pp2/vessel_marco/`.

## Qué se midió y cómo

- **Celda de 8 px** (un tile de 16 px = 2 celdas); mapa de 57 × 108 celdas. **Héroe:** 2 celdas de ancho × 3 de alto (16 × 24 px).
- **Sala expandida aceptada (P1_R + altura, paso 6c):** el plano de `vessel_altura_c` reconstruido con el mismo script de los pasos anteriores (los datos de `P1_R` no están guardados como máscaras en el repo). Las salas son los pisos expandidos; **Y12 a Y15 y X9** son los componentes conexos de gate, puente, escalera y muesca que las unen, con el nombre de la guía E; los gates restantes van en «gates sueltos». X1 y X2 no son salas aparte en el vessel: sus 34 y 41 celdas de la guía E caen dentro de h17 y h18. «Celdas caminables» = piso, muesca, gate, puente y escalera.
- **Guía E original:** `guias/E/pack_grupos.png` (id + 1 = R + 256 G); toda celda de un grupo es caminable (los gates de la guía E no son celdas de grupo y no se cuentan).
- **Héroe:** en la celda caminable de la propia sala más cercana a su centroide (regla del 8k: distancia al centroide, empate la fila y columna menores).
- **Marco plano:** 32 × 28 celdas (256 × 224 px) centrado en esa celda: filas r − 14 a r + 13 y columnas c − 16 a c + 15, recortado al mapa.
- **Huella de la cámara en perspectiva:** FOV 30 vertical, 8:7, pitch 71°, yaw 0 desde el sur, d₀ = 52.2 celdas, el héroe (la celda) centrado en pantalla. Es el polígono que la pantalla cubre en el plano del suelo del héroe; una celda cuenta si su centro está dentro; sin alturas ni oclusión (plano). Para el héroe de X4 en el vessel mide 29.27 celdas de ancho en el borde cercano, 35.22 en el lejano y 29.84 de profundidad (el trapecio es el mismo para cualquier celda, trasladado).

## 1 · Las tres salas

**Vessel (6c):**

| Sala | Caja | Alto × ancho | Celdas caminables | Lado más corto | Celda del héroe (fila, col.) |
|---|---|---|---|---|---|
| X4 | filas 40–48, columnas 23–34 | 9 × 12 celdas (72 × 96 px) | 91 | 9 celdas (72 px) | (43, 29) |
| X5 | filas 40–56, columnas 3–27 | 17 × 25 celdas (136 × 200 px) | 254 | 17 celdas (136 px) | (48, 15) |
| X6 | filas 40–56, columnas 30–49 | 17 × 20 celdas (136 × 160 px) | 159 | 17 celdas (136 px) | (47, 39) |

**Guía E original:**

| Sala | Caja | Alto × ancho | Celdas caminables | Lado más corto | Celda del héroe (fila, col.) |
|---|---|---|---|---|---|
| X4 | filas 42–48, columnas 23–34 | 7 × 12 celdas (56 × 96 px) | 67 | 7 celdas (56 px) | (44, 29) |
| X5 | filas 42–55, columnas 3–26 | 14 × 24 celdas (112 × 192 px) | 179 | 14 celdas (112 px) | (47, 15) |
| X6 | filas 42–55, columnas 31–44 | 14 × 14 celdas (112 × 112 px) | 89 | 14 celdas (112 px) | (48, 38) |

## 2 y 3 · Qué entra en el marco

Celdas caminables de cada grupo dentro del marco (entre paréntesis, su % del total del grupo); «plano» = marco de 32 × 28, «huella» = trapecio de la cámara en perspectiva. Solo se listan los grupos con alguna celda dentro; el número junto al nombre es el total de celdas caminables del grupo.

**Vessel (6c):**

| Grupo (celdas) | X4 plano | X4 huella | X5 plano | X5 huella | X6 plano | X6 huella |
|---|---|---|---|---|---|---|
| X3 (114) | 54 (47 %) | 74 (65 %) | 7 (6 %) | 27 (24 %) | 20 (18 %) | 40 (35 %) |
| X4 (91) | 91 (100 %) | 91 (100 %) | 62 (68 %) | 69 (76 %) | 91 (100 %) | 91 (100 %) |
| X5 (254) | 166 (65 %) | 150 (59 %) | 254 (100 %) | 254 (100 %) | 35 (14 %) | 27 (11 %) |
| X6 (159) | 135 (85 %) | 135 (85 %) | 6 (4 %) | 6 (4 %) | 159 (100 %) | 159 (100 %) |
| Y10 (270) | — | — | 101 (37 %) | 101 (37 %) | — | — |
| g11 (366) | 12 (3 %) | 9 (2 %) | — | — | 146 (40 %) | 149 (41 %) |
| Y12 (58) | 27 (47 %) | 33 (57 %) | 35 (60 %) | 43 (74 %) | — | — |
| Y13 (58) | 28 (48 %) | 48 (83 %) | — | — | 40 (69 %) | 48 (83 %) |
| Y14 (33) | 10 (30 %) | 10 (30 %) | 30 (91 %) | 30 (91 %) | — | — |
| Y15 (33) | 10 (30 %) | 10 (30 %) | — | — | 26 (79 %) | 26 (79 %) |
| h17 (176) | 1 (1 %) | 19 (11 %) | — | — | — | — |
| h18 (179) | — | 20 (11 %) | — | — | — | — |
| h19 (202) | — | — | 11 (5 %) | 11 (5 %) | — | — |
| h20 (194) | — | — | 1 (0 %) | — | — | — |
| gates sueltos (113) | 18 (16 %) | 18 (16 %) | 12 (11 %) | 13 (12 %) | 18 (16 %) | 16 (14 %) |

**Guía E original:**

| Grupo (celdas) | X4 plano | X4 huella | X5 plano | X5 huella | X6 plano | X6 huella |
|---|---|---|---|---|---|---|
| X2 (41) | — | 2 (5 %) | — | — | — | — |
| X3 (70) | 25 (36 %) | 38 (54 %) | 6 (9 %) | 22 (31 %) | — | 16 (23 %) |
| X4 (67) | 67 (100 %) | 67 (100 %) | 46 (69 %) | 51 (76 %) | 67 (100 %) | 67 (100 %) |
| X5 (179) | 125 (70 %) | 115 (64 %) | 179 (100 %) | 179 (100 %) | 27 (15 %) | 20 (11 %) |
| X6 (89) | 89 (100 %) | 89 (100 %) | — | — | 89 (100 %) | 89 (100 %) |
| Y10 (209) | — | — | 72 (34 %) | 72 (34 %) | — | — |
| g11 (298) | — | — | — | — | 106 (36 %) | 108 (36 %) |
| Y12 (49) | 24 (49 %) | 29 (59 %) | 36 (74 %) | 44 (90 %) | — | — |
| Y13 (49) | 24 (49 %) | 40 (82 %) | — | — | 33 (67 %) | 41 (84 %) |
| Y14 (24) | 8 (33 %) | 8 (33 %) | 20 (83 %) | 20 (83 %) | 6 (25 %) | — |
| Y15 (24) | 8 (33 %) | 8 (33 %) | — | — | 24 (100 %) | 24 (100 %) |
| h17 (96) | — | 1 (1 %) | — | — | — | — |

## Archivos

`marco_X4.png`, `marco_X5.png`, `marco_X6.png` (por sala: vessel | guía E; máscara caminable con la sala en blanco, marco plano en verde, huella de la cámara en naranja y el héroe en rojo), `vessel_marco.json` (toda la tabla, incluidas las cajas, el polígono de la huella y los grupos sin celdas dentro) y `HASHES_vessel_marco.txt` (dos corridas, mismos hashes).
