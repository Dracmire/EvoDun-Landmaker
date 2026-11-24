# PP2 paso 8e · tomas de la herradura con framing, 3 distancias de cámara y suma de MiDaS sin K-means

Base `c344a84`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. Este paso reemplaza al 8d (no se lanzó; su parte 0 es la de abajo). Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin K-means. No agregué objetos, reglas, umbrales ni medidas a la escena; la escena es la del paso 8c. Sin veredicto: [U] revisa las sumas en el pase siguiente.

## 0 · Escalas

- 1 celda de planta = **1 unidad** del mundo 3D (x, y).
- 1 unidad de altura = **1 unidad** (z): en `vscene` las tres coordenadas comparten unidad. La altura de los pasos 6 a 8b estaba en tiles (2 celdas); el paso 8c la multiplicó ×2 (héroe 8, nivel 1 = 14, muro 14, muro sobre la franja 28, baranda 4). Aquí ya son iguales: **factor a igualar = 1**, nada que cambiar.

## 1 · Las 5 tomas

Héroe (8 celdas de alto) de pie en el medio del camino. Cámara en perspectiva, FOV 30 vertical, pitch 71°, yaw 0, desde el sur, apuntando a los pies, héroe centrado en el cuadro (pies en el píxel 256, 224), sin desplazamiento de lente, 512 × 448 (8:7).

| # | Dónde | Celda (fila, columna) | Sala |
|---|---|---|---|
| T1 | codo izquierdo, centro de hub 23 | (85, 14) | 23 |
| T2 | pata izquierda, tramo medio de Y10, nivel 0 | (66, 4) | 10 |
| T3 | pata derecha, espejo de T2 | (66, 52) | 11 |
| T4 | codo derecho, espejo de T1 (hub 24) | (85, 42) | 24 |
| T5 | centro de hub 25 (nivel 1, z = 14) | (85, 28) | 25 |

- T1 y T5: la celda de piso más lejana al borde de su sala (empate: la más cercana al centroide). T2: fila media de Y10 (filas 49 a 83 → 66), columna del centro de su ancho; está a 17 filas del pie de la escalera de su extremo norte. Espejo columna c ↔ 56 − c: las celdas espejo de T2 y T1 son caminables de nivel 0, así que no hubo que sustituirlas (distancia 0).
- **Muro cortado:** en T1 el muro externo (fila 90, columnas 14 a 16, 14 de alto) queda entre la cámara y los pies del héroe a las tres distancias (el rayo a los pies pasa a 13,1 de altura sobre esa celda y el muro mide 14); en cada una de esas 3 tomas se bajó ese tramo (el tramo contiguo de muro de esa fila) a altura 0. Ninguna otra toma tiene muro entre la cámara y el héroe (se comprobó el rayo a los pies y a la cabeza).

## 2 · Distancia de la cámara (verificada con la escala)

- 28 celdas de alto visible: d₀ = 14 / tan 15° = **52,25 celdas**; altura de la cámara sobre el piso d₀ · sen 71° = 49,40 celdas; retroceso al sur d₀ · cos 71° = 17,01 celdas. (d₀ no se renderiza.)
- Chequeo con el héroe de 8 celdas: alto en pantalla / alto del cuadro a d₀ = **0,1088**, frente a 24/224 = 0,1071 del SNES.

| Caso | Factor | Distancia | Altura de la cámara | Retroceso al sur | Alto visible | Héroe / cuadro |
|---|---|---|---|---|---|---|
| D1 | × 1,32 | 68,97 | 65,21 | 22,45 | 36,96 | 0,0792 |
| D2 | × 2 | 104,50 | 98,80 | 34,02 | 56,00 | 0,0501 |
| D3 | × 2,64 | 137,94 | 130,42 | 44,91 | 73,92 | 0,0373 |

## 3 · Profundidad y sumas

1. MiDaS en las **15 tomas** (5 × 3). El mapa continuo de cada una se normaliza de 0 a 1 dentro de la toma (1 = más cerca). Sin bandas ni plano restado.
2. Retroproyección de cada mapa al plano z = 0 con su cámara, 2 × 2 subceldas por celda; cada subcelda toma el promedio de los píxeles que caen en ella; los píxeles del héroe no cuentan.
3. Por grupo de 4 (T1 a T4 a la misma distancia: D1, D2, D3), en cada subcelda con x = valor de cada toma que la ve y n = cuántas la ven: **suma total** S = Σ x, **promedio** S / n y **raíz de la suma de cuadrados** Q = √(Σ x²). Las imágenes usan una escala fija por tipo (S de 0 a 4, promedio de 0 a 1, Q de 0 a 2); las subceldas que ninguna toma ve quedan sin color.
4. Hub 25 (T5) va aparte: sus 3 mapas retroproyectados.

Subceldas vistas por 1 / 2 / 3 / 4 tomas del grupo: D1 7528 / 4726 / 828 / 0; D2 4128 / 6480 / 3880 / 2498; D3 1116 / 4666 / 5002 / 8482 (a D1 ninguna subcelda la ven las 4 tomas).

## Archivos

- `tomas/T<n>_D<k>.png`: las 15 tomas, cada una con su mapa de MiDaS al lado.
- `mapa_tomas.png`: la planta con T1 a T5.
- `suma_D<k>.png`, `promedio_D<k>.png`, `cuadrados_D<k>.png`: las 9 imágenes de las sumas, sobre la planta.
- `hub25_D<k>.png`: los 3 mapas retroproyectados de hub 25.
- `vessel_midas_suma.json` (escalas, derivación, celdas, distancias, cámaras, muro cortado, cobertura) y `HASHES_vessel_midas_suma.txt` (dos corridas completas, mismos hashes).

Los scripts, el entorno, los pesos y los mapas de MiDaS en bruto (`.npy`) quedan fuera del repo.
