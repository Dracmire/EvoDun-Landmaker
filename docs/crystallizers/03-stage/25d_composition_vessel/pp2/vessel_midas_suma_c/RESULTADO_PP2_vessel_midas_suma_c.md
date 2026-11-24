# PP2 paso 8i · la secuencia del 8e con los 7 puntos, sumas, K-means de las sumas y superposición

Base `ea21db5`. Solo documentos, imágenes, arrays y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. La escena es la del 8e sin cambios. Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin veredicto.

## 1 · Cámara y tomas

Como el 8e: perspectiva, FOV 30 vertical, pitch 71°, yaw 0, desde el sur, apuntando a los pies del héroe, héroe centrado (pies en el píxel 256, 224), sin desplazamiento de lente, 512 × 448.

**Distancia.** Se usa la derivada del 8e (por ahora la guía): 28 celdas de alto visible en el SNES → d₀ = 14 / tan 15° = **52,25 celdas** a lo largo del rayo a los pies (altura de la cámara 49,40, retroceso 17,01; el héroe de 8 celdas ocupa 0,1088 del alto del cuadro a d₀ frente a 0,1071 del SNES). Los tres casos: **D1 = 68,97** (× 1,32), **D2 = 104,50** (× 2) y **D3 = 137,94** (× 2,64) celdas.

**Los 7 puntos** (los del 8f): G25 (85, 28), G10 (66, 4), G11 (62, 52), G5 (47, 15), G6 (44, 40), G17 (23, 14), G18 (23, 44). 7 tomas × 3 distancias = **21 tomas**. Muro externo entre la cámara y el héroe: se comprobó el rayo a los pies y a la cabeza en las 21 y **no hubo que cortar ninguno** (el corte del 8e era de T1, que aquí no está).

## 2 · MiDaS y sumas

Como el 8e: mapa continuo por toma normalizado de 0 a 1 (1 = más cerca), retroproyectado a z = 0 con su cámara a 2 × 2 subceldas por celda (promedio; el héroe no cuenta). Por distancia, con las 7 tomas: S = Σ x, S / n y Q = √(Σ x²). Las 9 sumas están guardadas como arrays `.npy` de 216 × 114 (NaN = sin dato). Escalas fijas de las imágenes: S de 0 a 7, promedio de 0 a 1, Q de 0 a 2,65.

Subceldas vistas por 1 / 2 / 3 / 4 / 5 / 6 / 7 tomas:

| Caso | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| D1 | 7026 | 9233 | 4270 | 1708 | 10 | 0 | 0 |
| D2 | 3741 | 4597 | 4890 | 6955 | 2696 | 1148 | 597 |
| D3 | 1470 | 2314 | 2484 | 6681 | 4663 | 2791 | 4221 |

## 3 · K-means de las sumas de D1

N = 4, `seed 0`, sobre los valores de cada suma de D1 (una dimensión, solo subceldas con dato: 22247). Bandas de la más alta (0) a la más baja (3).

| Suma | Centros de las bandas 0 a 3 | Subceldas por banda |
|---|---|---|
| S | 2.1130 / 1.3317 / 0.8668 / 0.3302 | 1157 / 3351 / 9323 / 8416 |
| promedio | 0.8776 / 0.5348 / 0.3310 / 0.1778 | 2777 / 6298 / 6533 / 6639 |
| Q | 1.1903 / 0.8475 / 0.5476 / 0.2533 | 1367 / 7532 / 6340 / 7008 |

## 4 · Superposición sobre la base del 8c

Base del 8c (`vessel_export_c/base_muros_piso_c.png`; la reconstruida desde la escena es idéntica píxel a píxel): gris = muros + X4, X5, X6 y hub 25; blanco = el resto (Y12 e Y13 en blanco); negro = fuera. Para cada suma de D1: las 4 bandas semitransparentes sobre la base, la fracción de gris por banda, el **recorte A** (regla del 8c: banda «de muro» si más de la mitad cae sobre gris; rojo = sus subceldas blancas conectadas, 4-vecinas, con sus subceldas grises) y el **recorte B** (rojo = las subceldas blancas de las bandas 0 y 1 conectadas, 4-vecinas y dentro de la misma banda, con subceldas grises de esa banda; sin umbral de mayoría).

| Suma | Fracción de gris, bandas 0 / 1 / 2 / 3 | Bandas de muro (A) | Rojo A (subceldas) | Rojo B (subceldas) |
|---|---|---|---|---|
| S | 0.561 / 0.432 / 0.266 / 0.215 | [0] | 502 | 2289 |
| promedio | 0.339 / 0.385 / 0.301 / 0.159 | ninguna | 0 | 4307 |
| Q | 0.526 / 0.347 / 0.237 / 0.222 | [0] | 501 | 4156 |

## Archivos

- `tomas/G<grupo>_D<k>.png` (21) y `mapa_tomas.png`.
- `suma_D<k>.png`, `promedio_D<k>.png`, `cuadrados_D<k>.png` y los 9 `.npy` (`suma_D<k>.npy`, `promedio_D<k>.npy`, `cuadrados_D<k>.npy`).
- `kmeans_suma_D1.png`, `kmeans_promedio_D1.png`, `kmeans_cuadrados_D1.png`.
- `superpuesto_suma_D1.png`, `superpuesto_promedio_D1.png`, `superpuesto_cuadrados_D1.png` (base | bandas encima | recorte A | recorte B).
- `vessel_midas_suma_c.json` y `HASHES_vessel_midas_suma_c.txt` (dos corridas completas, mismos hashes).

Los scripts, el entorno, los pesos y los mapas de MiDaS en bruto quedan fuera del repo.
