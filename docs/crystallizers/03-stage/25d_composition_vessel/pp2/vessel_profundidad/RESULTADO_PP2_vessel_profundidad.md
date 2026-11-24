# PP2 paso 7b · profundidad a 71° en el circuito de la herradura (4 tomas)

Base `0c21631`. Retoma el paso 7, que se cerró sin entregar. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. Antes de empezar comprobé los hashes de `guias/E/`, `alturas/`, `vessel_limites/`, `vessel_altura/`, `vessel_altura_b/` y `vessel_altura_c/`: coinciden. Script, escena, entorno, pesos y salidas pesadas (`.npy`, `_inferno.png`) fuera del repo (`~/pp7/`, `~/pp3/`). Sin veredicto: son lecturas.

## Qué hice

- **Escena del §1** (planta final del vessel, 6c, P1, bordes rectos), sin cambios: piso de nivel 1 a 7 celdas (6 + 1 de borde adornado), faces verticales entre niveles, peldaños reales en las escaleras, muros de 7 celdas sobre el piso de su lado más alto, baranda de 2 celdas en el norte de los miradores, héroe de 4 celdas como único billboard, wrapping como fondo vacío. Una corrección de código en el trazador (los lados de una columna ya no se dibujan por debajo del suelo) se hizo antes de la muestra que se conserva; la muestra y las tomas nuevas usan la misma escena.
- **Red y bandas** como en PP3 y el paso 4: MiDaS `dpt_beit_large_512` (commit `4c37fbb`, timm 0.6.12, Python 3.10, CPU), proporción nativa, K-means N = 4 sobre el mapa inferno con `np.random.seed(0)`; bandas ordenadas por gris medio, 0 = la más cercana.
- **Cámara de las tomas nuevas:** perspectiva FOV 30, **pitch 71°**, yaw 0 (desde el sur). Locales: 800 × 450, héroe a 0,14 de la altura de la toma y desplazado hacia abajo (desplazamiento de lente 0,4). G0: 450 × 800, encuadre del nivel entero (distancia 226).
- **Corte del muro externo:** previsto si el muro tapaba al héroe; **no hizo falta en ninguna toma** (el héroe se ve entero, 530 píxeles, igual que sin muros).
- **Tomas nuevas** (héroe en la celda indicada; filas, columnas):

| Archivo | Grupo | Celda | Dónde |
|---|---|---|---|
| `a71/global.png` | todo el nivel | — | encuadre del nivel entero |
| `a71/g23_codo.png` (H1) | 23 | (84, 12) | hub 23, a 3 celdas de la entrada de Y10 |
| `a71/g10_escalera.png` (H2) | 10 | (51, 4) | pie de la escalera Y10 → X5, en Y10 |
| `a71/g04_mirador.png` (H3) | 4 | (40, 28) | centro del borde norte de X4 |
| `a71/g24_codo.png` (H4) | 24 | (86, 44) | hub 24, entre la entrada de g11 (x 50–55) y la cabeza de X9 (x 39) |

- **Guardado por ángulo y grupo:** `a71/` (nuevas), `a55/`, `a45/`, `a35/`, `a25/` y `snes/` (las 18 hojas de la muestra de `/tmp/p7a`, copiadas sin volver a correrlas, en la carpeta de su pitch real). El grupo es el de la guía E de la celda del héroe; si está en un puente o gate (`g09`, `g12`, `g13` y las tres de gate) se indica en el json (`grupo_de_puente_o_gate`; para un gate sin puente se tomó el grupo de la sala vecina de menor número). La muestra no perdió ninguna toma; no copié sus tres imágenes de composición (`cajones_global`, `cajones_compuestos`, el mapa antiguo), que no eran tomas.
- **Muestra:** `"origen": "muestra paso 7, prompt anterior"`, una sola corrida, solo su sha256 en `HASHES_vessel_profundidad.txt`. Para comparar con ella recalculé los mapas de banda de T07, T02, T16 y G0 a 25° con la profundidad que guardé en esa corrida (sin volver a pasar la red) y reproduce sus porcentajes por banda y las 1109 celdas caminables.

## Lecturas (solo las tomas nuevas)

| Toma | Celdas caminables visibles | % por banda 0 / 1 / 2 / 3 | Gris medio 0 / 1 / 2 / 3 | Banda del héroe |
|---|---|---|---|---|
| G0 a 71° | 2680 | 30,2 / 31,4 / 24,0 / 14,3 | 213 / 176 / 125 / 54 | — |
| H1 g23 | 758 | 11,0 / 23,8 / 35,7 / 29,5 | 209 / 145 / 86 / 33 | 2 |
| H2 g10 | 557 | 27,1 / 28,9 / 29,8 / 14,3 | 182 / 134 / 77 / 26 | 1 |
| H3 g04 | 990 | 5,7 / 30,0 / 30,6 / 33,8 | 203 / 108 / 60 / 23 | 2 |
| H4 g24 | 744 | 22,0 / 23,6 / 28,5 / 25,9 | 193 / 141 / 90 / 38 | 1 |

Las cuatro tomas locales y G0 tienen 4 bandas claras (≥ 5 %).

**Cajones por sala de la herradura** (bandas que toca cada sala, celdas por banda 0 / 1 / 2 / 3; solo las salas vistas):
- **H1:** Y16 [0, 22, 0, 0]; h23 [0, 56, 34, 0]; Y10 [0, 0, 94, 101]; h24 [1, 0, 0, 0].
- **H2:** Y10 [51, 29, 5, 0]; X5 [107, 124, 3, 0]; X4 [2, 30, 0, 0].
- **H3:** X5 [0, 109, 21, 0]; X4 [0, 78, 9, 0]; X6 [1, 75, 0, 0]; g11 [8, 0, 0, 0].
- **H4:** g11 [0, 0, 91, 85]; h24 [2, 64, 33, 0].

**G0 a 71° (perspectiva) frente a G0 a 25° (muestra).** Celdas caminables visibles: 2680 frente a 1109. Fila media de la planta por banda: 84 / 53 / 20 / 4 (71°) frente a 76 / 38 / 13 / — (25°, donde la banda 3 es fondo vacío). La franja alta (X4–X5–X6, 476 celdas vistas) cae entera en la banda 1, junto con celdas de otros niveles; hub 25 (90 celdas) cae entera en la banda 0. A 25°: franja 376 celdas en la banda 1, hub 25 en la 0.

**H3, la quebrada.** X4 en la banda 1 (78 de 87 celdas); la cara norte de la franja (filas 35–39) en la banda 2 (67 de 80); los pisos del bloque norte (filas < 35) en las bandas 2 y 3 (211 y 331 celdas). Es decir, el borde norte de la franja es un salto de la banda 1 a la 2.

**Comparación con la muestra (misma celda, otro pitch).**

| Toma | Muestra | Celdas vistas en las dos | Cambian de banda |
|---|---|---|---|
| H2 | T07, 55° | 603 | 135 (22,4 %) |
| H3 | T02, 55° | 1418 | 518 (36,5 %) |
| H4 | T16, 45° | 651 | 456 (70,0 %) |

H4 **no** está en la celda de T16 (la muestra la tomó en g11, (83, 51); H4 va en hub 24, (86, 44)), así que su cifra compara dos lugares. De la toma global a las locales de la muestra cambiaron de banda 1705 de 2465 celdas (69,2 %).

## Lo que no coincidió con la predicción de [R]

- **La franja alta como su propia banda o como borde entre dos:** no es su propia banda (comparte la banda 1 con otros niveles); sí aparece como salto en su borde norte (H3).
- **Más celdas del bloque norte que las 1109 a 25°:** sí, 2680 caminables visibles en el nivel entero (no separé las del bloque norte).
- **La quebrada de H3 como corte entre la franja y el bloque norte:** sí en las cifras (banda 1 → 2 en la cara norte y 2–3 al fondo).
- **Menos del 40 % de celdas cambian entre 55° y 71°:** H2 22,4 % y H3 36,5 % cumplen; H4 70,0 % no, pero no es el mismo lugar. Entre la global y las locales de la muestra: 69,2 %, no 73 %.
- Quedan abiertos para [U]: la lectura de los cajones en `a71/`, y si 71° queda como cámara del pase.

## Archivos

`a71/` (cinco hojas: toma | profundidad | 4 bandas | cajones en planta), `a55/`, `a45/`, `a35/`, `a25/`, `snes/` (muestra, 18 hojas), `mapa_tomas.png` (todos los puntos, rotulados con pitch y grupo, flecha al norte), `vessel_profundidad.json`, `HASHES_vessel_profundidad.txt` (las cinco de `a71/`: dos corridas con los mismos hashes; la muestra, solo sha256).
