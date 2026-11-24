# PP2 paso 8j · tomas en grilla regular para que la cobertura sea pareja (D1)

Base `46a8add`. Solo documentos, imágenes, arrays y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. La escena es la del 8e / 8i sin cambios. Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin veredicto; el control de cobertura y el ancho al norte de la franja los mide [R] con los `.npy`.

## 1 · Cámara

La del 8i sin cambios: perspectiva, FOV 30 vertical, pitch 71°, yaw 0, desde el sur, apuntando a los pies del héroe, héroe centrado, sin desplazamiento de lente, 512 × 448, solo **D1 = 68,97 celdas**.

## 2 · La grilla

Puntos cada 8 celdas en filas (4 a 100) y columnas (4 a 52) desde (4, 4): 13 × 7 = **91 puntos** sobre todo el vessel. «Caminable» es el de la escena (piso de nivel 0 o 1, muesca, gate, puente y escalera). Casos: **47 en su celda**, **20 movidos** (a la celda caminable más cercana a ≤ 3 celdas, Chebyshev; empate: menor distancia euclidiana, luego fila y columna menores) y **24 saltados** (sin celda caminable a ≤ 3). Una toma por punto: **67 tomas**.

Movidos (punto → celda usada, distancia Chebyshev):

| Punto | Celda usada | Distancia |
|---|---|---|
| (12, 44) | (11, 41) | 3 |
| (20, 4) | (21, 4) | 1 |
| (20, 28) | (23, 28) | 3 |
| (20, 52) | (21, 52) | 1 |
| (36, 28) | (34, 28) | 2 |
| (36, 36) | (34, 33) | 3 |
| (44, 36) | (44, 37) | 1 |
| (52, 28) | (52, 27) | 1 |
| (60, 12) | (61, 12) | 1 |
| (60, 28) | (61, 27) | 1 |
| (60, 44) | (61, 44) | 1 |
| (68, 28) | (68, 27) | 1 |
| (76, 20) | (76, 22) | 2 |
| (76, 28) | (76, 27) | 1 |
| (76, 36) | (76, 35) | 1 |
| (84, 36) | (84, 37) | 1 |
| (92, 12) | (90, 12) | 2 |
| (92, 28) | (90, 28) | 2 |
| (92, 36) | (89, 36) | 3 |
| (92, 44) | (90, 44) | 2 |

Saltados: (4, 4), (4, 12), (4, 20), (4, 28), (4, 36), (4, 44), (4, 52), (12, 4), (12, 12), (12, 52), (36, 4), (36, 20), (36, 52), (76, 12), (76, 44), (92, 4), (92, 52), (100, 4), (100, 12), (100, 20), (100, 28), (100, 36), (100, 44), (100, 52).

**Muros cortados:** 14 de las 67 tomas tuvieron el muro externo entre la cámara y el héroe (rayo a los pies o a la cabeza) y se cortó el tramo contiguo de muro de esa fila a altura 0 en esa toma; cada punto con su lista está en el json (`puntos`, `muros_cortados_(fila,columna)`).

## 3 · MiDaS y sumas

Como el 8i: mapa continuo por toma normalizado de 0 a 1 (1 = más cerca), retroproyectado a z = 0 con su cámara a 2 × 2 subceldas por celda (promedio; el héroe no cuenta). Con las 67 tomas: S = Σ x, S / n, Q = √(Σ x²) y el **mapa de cobertura n**. Los cuatro están guardados como `.npy` de 216 × 114 (NaN donde n = 0): `suma.npy`, `promedio.npy`, `cuadrados.npy` y `cobertura.npy`. Escalas fijas de las imágenes: S de 0 a 31, promedio de 0 a 1, Q de 0 a 5.57, cobertura de 0 a 31.

Cobertura: 24624 subceldas con dato, n máximo 31. Histograma de n (n: subceldas):
1: 42 · 2: 240 · 3: 465 · 4: 522 · 5: 618 · 6: 486 · 7: 1000 · 8: 581 · 9: 1217 · 10: 1026 · 11: 449 · 12: 710 · 13: 1545 · 14: 1027 · 15: 1168 · 16: 1209 · 17: 934 · 18: 1348 · 19: 695 · 20: 1055 · 21: 948 · 22: 1067 · 23: 1259 · 24: 803 · 25: 1232 · 26: 1291 · 27: 704 · 28: 527 · 29: 290 · 30: 156 · 31: 10.

## 4 · K-means y superposición

K-means N = 4, `seed 0`, sobre cada suma por separado (una dimensión, solo subceldas con dato). Bandas de la más alta (0) a la más baja (3).

| Suma | Centros de las bandas 0 a 3 | Subceldas por banda |
|---|---|---|
| S | 13.3325 / 8.5751 / 5.4678 / 2.6771 | 2545 / 6637 / 7383 / 8059 |
| promedio | 0.7525 / 0.5348 / 0.3751 / 0.2103 | 2416 / 5544 / 9201 / 7463 |
| Q | 2.8161 / 2.1265 / 1.4877 / 0.9182 | 3518 / 7061 / 7283 / 6762 |

Superposición sobre la base del 8c (idéntica píxel a píxel a `base_muros_piso_c.png`) con el **recorte A** (banda «de muro» si más de la mitad de sus subceldas cae sobre gris; rojo = sus subceldas blancas conectadas, 4-vecinas, con sus subceldas grises). Sin recorte B.

| Suma | Fracción de gris, bandas 0 / 1 / 2 / 3 | Bandas de muro (A) | Rojo A (subceldas) |
|---|---|---|---|
| S | 0.555 / 0.396 / 0.238 / 0.104 | [0] | 1105 |
| promedio | 0.393 / 0.388 / 0.278 / 0.131 | ninguna | 0 |
| Q | 0.527 / 0.354 / 0.223 / 0.097 | [0] | 1609 |

## Archivos

- `tomas/P<fila>_<col>.png` (67, con su MiDaS al lado; el nombre es el punto de la grilla) y `mapa_tomas.png` (planta con los puntos: en su celda, movidos y saltados).
- `cobertura.png`, `suma.png`, `promedio.png`, `cuadrados.png` y los 4 `.npy`.
- `kmeans_suma.png`, `kmeans_promedio.png`, `kmeans_cuadrados.png` y `superpuesto_suma.png`, `superpuesto_promedio.png`, `superpuesto_cuadrados.png` (base | bandas | recorte A).
- `vessel_midas_grilla.json` y `HASHES_vessel_midas_grilla.txt` (dos corridas completas, mismos hashes).

Los scripts, el entorno, los pesos y los mapas de MiDaS en bruto quedan fuera del repo.
