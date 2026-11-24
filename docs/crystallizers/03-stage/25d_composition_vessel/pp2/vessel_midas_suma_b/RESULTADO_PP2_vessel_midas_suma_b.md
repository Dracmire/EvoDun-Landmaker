# PP2 paso 8f · cámara ortográfica, 7 tomas, suma dura y K-means de las tomas a × 1,32

Base `7834212`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. La escena es la del 8e sin cambios (1 celda de planta = 1 unidad; 1 unidad de altura = 1 unidad; héroe de 8 celdas, nivel 1 = 14, muros 14 y 28). Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin veredicto.

## 1 · Cámara ortográfica

Ortográfica, pitch 71°, yaw 0, desde el sur, apuntando a los pies del héroe, héroe centrado en el cuadro (512 × 448). Los rayos salen 400 celdas por detrás del objetivo, así que nada queda detrás de la cámara. La distancia pasa a ser el **alto visible del cuadro** en el plano de la vista (base 28 celdas, como el SNES); el ancho visible es ese alto × 512 / 448.

| Caso | Factor | Alto visible | Ancho visible |
|---|---|---|---|
| D1 | × 1,32 | 36,96 | 42,24 |
| D2 | × 2 | 56 | 64 |
| D3 | × 2,64 | 73,92 | 84,48 |

Muro externo entre la cámara y el héroe: se comprobó el rayo a los pies y a la cabeza en las 21 tomas; **no hubo que cortar ninguno**.

## 2 · Las 7 tomas

Héroe de pie en el medio del camino de cada grupo (guía E: 25, 10, 11, 5, 6, 17, 18; no agregué otros). Pasillos largos (10 y 11): fila media del grupo y columna del centro del ancho; el resto: la celda de piso más lejana al borde de su sala (empate: la más cercana al centroide).

| Grupo | Celda (fila, columna) | Nivel |
|---|---|---|
| 25 | (85, 28) | 1 |
| 10 | (66, 4) | 0 |
| 11 | (62, 52) | 0 |
| 5 | (47, 15) | 1 |
| 6 | (44, 40) | 1 |
| 17 | (23, 14) | 0 |
| 18 | (23, 44) | 0 |

(Las celdas de 25 y 10 son las de T5 y T2 del 8e; la de 11 es la fila media de su grupo, no el espejo de T2 del 8e, que estaba en la fila 66.) Total: 7 tomas × 3 casos = **21 tomas**.

## 3 · MiDaS y suma dura

Igual que el 8e: mapa continuo de cada toma normalizado de 0 a 1 (1 = más cerca), retroproyectado a z = 0 con su cámara a 2 × 2 subceldas por celda (promedio de los píxeles; el héroe no cuenta). Por caso, con las 7 tomas: S = Σ x, promedio S / n y Q = √(Σ x²). Escalas fijas de las imágenes: S de 0 a 7, promedio de 0 a 1, Q de 0 a 2,65 (≈ √7); las subceldas que ninguna toma ve quedan sin color.

Subceldas vistas por 1 / 2 / 3 / 4 / 5 / 6 / 7 tomas:

| Caso | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| D1 | 7952 | 10 544 | 1540 | 1050 | 20 | 0 | 0 |
| D2 | 3972 | 7142 | 4838 | 4924 | 2480 | 1108 | 160 |
| D3 | 620 | 2486 | 4144 | 6186 | 4384 | 3634 | 3170 |

## 4 · K-means de las tomas a × 1,32

N = 4, `seed 0`, sobre el mapa de MiDaS de cada una de las 7 tomas de D1, por separado (mismo procedimiento de los pasos 7b a 8c: mapa → gris uint8 → inferno → K-means sobre el color). Bandas ordenadas de la más cercana (0) a la más lejana (3) por gris medio. Cada hoja: toma | bandas en pantalla | bandas retroproyectadas sobre la planta. Los grises medios por banda están en el json.

## Archivos

- `tomas/G<grupo>_D<k>.png`: las 21 tomas con su MiDaS al lado.
- `mapa_tomas.png`: la planta con las 7 tomas.
- `suma_D<k>.png`, `promedio_D<k>.png`, `cuadrados_D<k>.png`.
- `kmeans/G<grupo>_D1.png`: las 7 hojas.
- `vessel_midas_suma_b.json` y `HASHES_vessel_midas_suma_b.txt` (dos corridas completas, mismos hashes).

Los scripts, el entorno, los pesos y los mapas de MiDaS en bruto quedan fuera del repo.

## 8g · K-means de las sumas a × 1,32

K-means con N = 4 (`seed 0`) sobre cada una de las 3 sumas de D1 (S, promedio y Q de las 7 tomas), por separado, sobre los **valores numéricos** y solo en las subceldas con dato (n ≥ 1: 21106). Una dimensión (el valor de la suma). Bandas de la más alta (0) a la más baja (3). No se renderizó ni se pasó la red de nuevo: las sumas se reconstruyeron con los mapas de MiDaS guardados, la geometría de la cámara y los píxeles del héroe de las tomas guardadas, y las 3 imágenes de suma regeneradas coinciden con las del 8f en 0 píxeles distintos.

| Suma | Centros de las bandas 0 a 3 | Subceldas por banda |
|---|---|---|
| S | 3.0125, 1.8309, 1.3119, 0.7173 | 1423 / 4201 / 6588 / 8894 |
| promedio | 0.8597, 0.7147, 0.5785, 0.3736 | 6752 / 7338 / 5625 / 1391 |
| Q | 1.5589, 1.2131, 0.9322, 0.6177 | 1448 / 4769 / 8657 / 6232 |

Imágenes en `kmeans_sumas/`: `kmeans_suma_D1.png`, `kmeans_promedio_D1.png` y `kmeans_cuadrados_D1.png` (la suma original a la izquierda; las 4 bandas sobre la planta a la derecha, con el centro de cada una). Los centros también están en `vessel_midas_suma_b.json` (`kmeans_de_las_sumas_D1`). Sin veredicto.
