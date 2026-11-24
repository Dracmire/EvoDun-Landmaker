# PP2 paso 8k · 6 luces dirigidas, muro de X3, dos métodos de tomas, 2 cámaras × 2 distancias × 2 sumas

Base `62adfc5`. Solo documentos, imágenes, arrays y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. Lo único que cambia en la escena es lo que pide el encargo: el muro de X3 y las 6 luces. Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin veredicto; el control de cobertura y el ancho al norte de la franja los mide [R] con los `.npy`.

## 0 · Muro de X3

La caja X3 (sala 3, filas 23 a 34, columnas 24 a 33) tenía sus dos muros laterales (columnas 22–23 y 34–35) y ningún muro por abajo: su fila 34 era piso y se abría directo a la banda. Se agregó un **muro de 1 tile (2 celdas)**: filas 33 y 34 (la 34 es la fila del muro inferior de las salas vecinas), columnas 24 a 33 (20 celdas), a la altura 14 de ese muro. Las 20 celdas eran piso de nivel 0; **no había gate ni escalera en el tramo** (nada que dejar abierto). `base_muros_piso_k.png` es la base del 8c con esas 20 celdas en gris (difiere del 8c solo en esas celdas). La sala X3 queda con piso de las filas 23 a 32.

## 1 · Las 6 luces

| Luz | Tipo | Origen → destino | Elevación |
|---|---|---|---|
| L1 | direccional | sala 10 -> sala 5 | 45.0 grados sobre la horizontal |
| L2 | direccional | sala 11 -> sala 4 | 45.0 grados sobre la horizontal |
| L3 | direccional | sala 25 -> sala 6 | 45.0 grados sobre la horizontal |
| L4 | direccional | sala 5 -> sala 17 | 30 grados desde la vertical (60 sobre la horizontal) |
| L5 | direccional | sala 6 -> sala 18 | 30 grados desde la vertical (60 sobre la horizontal) |
| L6 | puntual | X4 (centroide), 14 sobre su piso | sin direccion, caida 1/d^2 |

La dirección horizontal de L1 a L5 es el vector del centroide de la sala origen al de la sala destino; los rayos bajan hacia el destino. L6 es puntual en el centroide de X4, a 14 celdas sobre su piso, con caída 1/d². Plano de las luces: `luces_planta.png`.

**Render:** Lambert más sombras proyectadas (por trazado de rayos sobre el mapa de alturas), ambiente 0.25. La misma intensidad 0.1946 para L1 a L5 (= 0,75 / (3 sen 45° + 2 sen 60°): una cara horizontal sin sombra de L1 a L5 llega a ambiente + 0,75 = 1,0, para que cinco luces no saturen todo); L6 normalizada a la iluminancia de una direccional a 10 celdas (`I·100/d²`); el factor total se corta en 1. Los colores planos no cambian: la luz los multiplica (las caras de los muros ya no llevan el oscurecimiento fijo del 8e, lo da la luz). El héroe (billboard blanco) y la baranda no se iluminan. Las sombras se muestrean a 1/4 de celda en las tapas y a 1/4 de celda por 1 de altura en las caras.

**Cobertura de luz** (fracción del piso de cada sala con luz directa, sin sombra; 4 × 4 muestras por celda de piso; influencia = luz con más del 10 %; `luces_cobertura.png`):

| Sala | Celdas | L1 | L2 | L3 | L4 | L5 | L6 | Influencias |
|---|---|---|---|---|---|---|---|---|
| X0 | 133 | 11 % | 5 % | 20 % | 40 % | 35 % | 0 % | 4 |
| X3 | 94 | 0 % | 0 % | 0 % | 20 % | 16 % | 0 % | 2 |
| X4 | 91 | 29 % | 16 % | 35 % | 59 % | 53 % | 100 % | 6 |
| X5 (guía E) | 254 | 52 % | 45 % | 67 % | 78 % | 73 % | 14 % | 6 |
| X6 (guía E) | 159 | 46 % | 8 % | 62 % | 62 % | 64 % | 23 % | 5 |
| Y10 (guía E) | 270 | 88 % | 2 % | 78 % | 74 % | 86 % | 0 % | 4 |
| Y11 (guía E) | 366 | 9 % | 96 % | 34 % | 77 % | 59 % | 0 % | 4 |
| sala 16 | 36 | 0 % | 0 % | 0 % | 0 % | 0 % | 0 % | 0 |
| h17 (guía E) | 176 | 21 % | 19 % | 10 % | 64 % | 65 % | 25 % | 5 |
| h18 (guía E) | 179 | 14 % | 77 % | 8 % | 68 % | 60 % | 25 % | 5 |
| sala 19 | 202 | 16 % | 20 % | 17 % | 58 % | 56 % | 10 % | 5 |
| sala 20 | 194 | 21 % | 19 % | 20 % | 66 % | 59 % | 10 % | 5 |
| h23 | 99 | 0 % | 1 % | 0 % | 28 % | 22 % | 0 % | 2 |
| h24 | 111 | 10 % | 0 % | 3 % | 36 % | 37 % | 0 % | 3 |
| h25 (guía E) | 90 | 66 % | 81 % | 84 % | 100 % | 88 % | 0 % | 5 |

Salas sin ninguna luz: **sala 16**. No se cambiaron las luces.

## 2 y 3 · Cámaras y métodos

- **Perspectiva:** FOV 30 vertical, pitch **70°**, yaw 0, desde el sur, a los pies del héroe, 512 × 448, D1 = 68.9683 y D2 = 104.4974 celdas.
- **Ortográfica:** pitch **55°**, yaw 0, desde el sur, 512 × 448, alto visible 36.96 (D1) y 56.0 (D2) celdas.
- **Método 1 (por habitación, `m1`):** una toma por sala (las 15 salas de la escena), héroe en la celda caminable de la sala más cercana a su centroide, de sur a norte; se suman todas (15 tomas por combinación).
- **Método 2 (bombardeo, `m2`):** la grilla del 8j (cada 8 celdas desde (4, 4); en su celda si es caminable, si no la más cercana a ≤ 3 celdas, si no se salta). Con la escena de 8k: 47 en su celda, 18 movidos, 26 saltados = **65 tomas** por combinación (el muro de X3 hizo saltar los puntos (36, 28) y (36, 36), que en el 8j se habían movido a X3).
- Total: (15 + 65) × 4 combinaciones de cámara y distancia = **320 tomas**; cada toma sirve para las dos sumas.

Tomas con muro externo cortado (se baja el tramo contiguo de muro a altura 0 solo en esa toma; la lista por toma está en el json):

| Método / cámara | Tomas con corte |
|---|---|
| m1_habitaciones/persp70_D1 | 4 |
| m1_habitaciones/persp70_D2 | 4 |
| m1_habitaciones/orto55_D1 | 7 |
| m1_habitaciones/orto55_D2 | 7 |
| m2_bombardeo/persp70_D1 | 15 |
| m2_bombardeo/persp70_D2 | 15 |
| m2_bombardeo/orto55_D1 | 31 |
| m2_bombardeo/orto55_D2 | 31 |

## 4 · Resultados

Mapa de MiDaS continuo por toma (0 a 1, 1 = más cerca), retroproyectado a z = 0 a 2 × 2 subceldas por celda (el héroe no cuenta); por método × cámara × distancia: Q = √(Σ x²), promedio S / n y cobertura n como `.npy` de 216 × 114 (NaN donde n = 0). K-means N = 4, `seed 0`, de Q y del promedio por separado (bandas de la más alta a la más baja), superposición sobre `base_muros_piso_k.png`, fracción de gris por banda, **recorte A** (regla del 8c, por banda) y **recorte por zona** (zonas conexas de ≥ 20 subceldas de cada banda con más de la mitad sobre gris: su parte blanca en rojo).

| Método | Cámara | Suma | Tomas | n máx. | Fracción de gris, bandas 0 / 1 / 2 / 3 | Bandas de muro (A) | Rojo A | Zonas ≥ 20 | Rojo por zona |
|---|---|---|---|---|---|---|---|---|---|
| m1 | persp70_D1 | Q | 15 | 8 | 0.351 / 0.412 / 0.244 / 0.126 | ninguna | 0 | 0 | 0 |
| m1 | persp70_D1 | promedio | 15 | 8 | 0.417 / 0.361 / 0.290 / 0.139 | ninguna | 0 | 0 | 0 |
| m1 | persp70_D2 | Q | 15 | 11 | 0.524 / 0.366 / 0.193 / 0.135 | [0] | 1741 | 3 | 1741 |
| m1 | persp70_D2 | promedio | 15 | 11 | 0.451 / 0.406 / 0.168 / 0.147 | ninguna | 0 | 0 | 0 |
| m1 | orto55_D1 | Q | 15 | 9 | 0.496 / 0.339 / 0.184 / 0.180 | ninguna | 0 | 0 | 0 |
| m1 | orto55_D1 | promedio | 15 | 9 | 0.325 / 0.249 / 0.324 / 0.196 | ninguna | 0 | 0 | 0 |
| m1 | orto55_D2 | Q | 15 | 14 | 0.365 / 0.350 / 0.154 / 0.194 | ninguna | 0 | 0 | 0 |
| m1 | orto55_D2 | promedio | 15 | 14 | 0.270 / 0.237 / 0.306 / 0.211 | ninguna | 0 | 0 | 0 |
| m2 | persp70_D1 | Q | 65 | 31 | 0.477 / 0.345 / 0.205 / 0.116 | ninguna | 0 | 0 | 0 |
| m2 | persp70_D1 | promedio | 65 | 31 | 0.476 / 0.387 / 0.222 / 0.159 | ninguna | 0 | 0 | 0 |
| m2 | persp70_D2 | Q | 65 | 51 | 0.559 / 0.339 / 0.147 / 0.139 | [0] | 1952 | 4 | 1974 |
| m2 | persp70_D2 | promedio | 65 | 51 | 0.492 / 0.398 / 0.185 / 0.152 | ninguna | 0 | 0 | 0 |
| m2 | orto55_D1 | Q | 65 | 33 | 0.569 / 0.349 / 0.167 / 0.166 | [0] | 1515 | 4 | 1511 |
| m2 | orto55_D1 | promedio | 65 | 33 | 0.297 / 0.356 / 0.301 / 0.185 | ninguna | 0 | 0 | 0 |
| m2 | orto55_D2 | Q | 65 | 58 | 0.427 / 0.386 / 0.169 / 0.182 | ninguna | 0 | 0 | 0 |
| m2 | orto55_D2 | promedio | 65 | 58 | 0.291 / 0.202 / 0.304 / 0.208 | ninguna | 0 | 0 | 0 |

Centros de las bandas 0 a 3 de cada K-means:

| Resultado | Centros |
|---|---|
| m1 persp70_D1 Q | 1.5381 / 1.1092 / 0.7175 / 0.3302 |
| m1 persp70_D1 promedio | 0.7152 / 0.5012 / 0.3472 / 0.1809 |
| m1 persp70_D2 Q | 2.0479 / 1.5752 / 1.1252 / 0.5682 |
| m1 persp70_D2 promedio | 0.7076 / 0.5476 / 0.3793 / 0.2043 |
| m1 orto55_D1 Q | 1.9423 / 1.5226 / 1.0997 / 0.7340 |
| m1 orto55_D1 promedio | 0.8410 / 0.7263 / 0.5601 / 0.4072 |
| m1 orto55_D2 Q | 2.3075 / 1.6997 / 1.3497 / 0.7862 |
| m1 orto55_D2 promedio | 0.8634 / 0.6767 / 0.4914 / 0.2860 |
| m2 persp70_D1 Q | 2.6110 / 2.0021 / 1.4143 / 0.8008 |
| m2 persp70_D1 promedio | 0.7150 / 0.5005 / 0.3519 / 0.2048 |
| m2 persp70_D2 Q | 3.9046 / 2.9619 / 2.1212 / 1.2008 |
| m2 persp70_D2 promedio | 0.7174 / 0.5454 / 0.3925 / 0.2236 |
| m2 orto55_D1 Q | 3.9641 / 3.1609 / 2.4769 / 1.5902 |
| m2 orto55_D1 promedio | 0.8637 / 0.7439 / 0.6103 / 0.4729 |
| m2 orto55_D2 Q | 4.5465 / 3.6140 / 2.9331 / 1.7040 |
| m2 orto55_D2 promedio | 0.8381 / 0.6764 / 0.4969 / 0.2985 |

## Archivos

- `base_muros_piso_k.png`, `luces_planta.png`, `luces_cobertura.png`, `mapa_tomas_m1.png`, `mapa_tomas_m2.png`.
- `tomas/<método>/<cámara>_<D>/*.png`: cada toma iluminada con su MiDaS al lado (`R<sala>` en el método 1; `P<fila>_<col>` en el método 2, con el punto de la grilla).
- `resultados/<método>/<cámara>_<D>/`: `q.png`, `promedio.png`, `cobertura.png` y `q.npy`, `promedio.npy`, `cobertura.npy` (8 carpetas).
- `superpuesto_<método>_<cámara>_<D>_<suma>.png` (16): base | bandas | recorte A | recorte por zona.
- `vessel_luces.json` y `HASHES_vessel_luces.txt` (dos corridas completas, mismos hashes).

Los scripts, el entorno, los pesos y los mapas de MiDaS en bruto quedan fuera del repo.
