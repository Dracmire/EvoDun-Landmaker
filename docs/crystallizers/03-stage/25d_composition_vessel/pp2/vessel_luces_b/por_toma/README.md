# Mapas retroproyectados por toma del método 1 (8l)

Paso 8m. 15 tomas del método 1 (una por sala) × variante (`color`, `blanco`) × cámara (`orto55`, `persp71`) × distancia (`D1`, `D2`) = **120 tomas**, más 30 en espacio de pantalla. Todo sale de los MiDaS crudos del 8l (fuera del repo, hashes en `../HASHES_crudos_vessel_luces_b.txt`, comprobados antes de empezar: 380 de 380 coinciden). No se corrió la red ni se renderizó la imagen; para saber qué tocó cada rayo se volvió a trazar solo la geometría (sin luz ni color) con la cámara y los cortes de muro de cada toma del json.

**Comprobaciones contra el 8l:** el buffer de ids recalculado es idéntico al guardado en las 120 tomas (0 píxeles distintos), la cámara recalculada coincide con la guardada, y el promedio, el consenso y la intensidad que se obtienen de estos mapas coinciden exactamente con los `.npy` de `../resultados/` en las 8 combinaciones (0 NaN distintos, diferencia máxima 0).

## `<variante>/<camara>_<D>/R<sala>.npz` (120)

Todos de 216 × 114 (filas × columnas de subceldas de 2 × 2 por celda; la subcelda (i, j) es la celda (i // 2, j // 2) del vessel de 108 × 57); proyección de cada píxel sobre el plano z = 0 por su rayo.

| Campo | Tipo | Contenido |
|---|---|---|
| `norm` | float16 | MiDaS normalizado de esa toma con el rango único de su combinación (percentiles 1 y 99 de sus 15 tomas, en `../vessel_luces_b.json`, `rangos_de_normalizacion`), promedio de los píxeles de cada subcelda. NaN donde la toma no ve. |
| `residuo` | float16 | Residuo contra el plano z = 0, en unidades de 1 / profundidad (1 / celdas a lo largo del eje de la cámara), promedio de los píxeles de cada subcelda. NaN donde no hay píxel o la toma no tuvo ajuste (escala ≤ 0). |
| `voto` | float16 | 1 si más de la mitad de los píxeles de la subcelda superan 3 · MAD, 0 si no; NaN como `residuo`. |
| `hit` | uint8 | Qué tocó el rayo de los píxeles de la subcelda, por mayoría: 0 nada, 1 piso nivel 0, 2 piso nivel 1, 3 cara o banda, 4 peldaño, 5 muro, 6 baranda. Donde `norm` es NaN la subcelda no tiene píxeles y `hit` vale 0. |
| `sala` | int16 | Número de sala de la toma. |
| `heroe` | int16 [2] | Celda del héroe (fila, columna). |

Las clases de `hit` salen de la celda realmente impactada (los cortes de muro del json aplicados): tapa de piso a z = 0 → 1; tapa de piso en nivel 1 → 2; cara vertical de piso, muesca o gate, y celdas de banda → 3; peldaños (tapa o lado) → 4; muros (tapa o lado, incluidos los de 28 sobre la franja) → 5; baranda → 6.

Nota de precisión: `residuo` está en float16 como se pidió; en ortográfica sus valores son del orden de 1e-5 y el paso de float16 ahí es de unos 6e-8 (algún valor pequeño redondea a 0).

## `pantalla/<variante>/R<sala>.npz` (30: color y blanco, `persp71`, `D1`)

Espacio de pantalla, sin retroproyectar, 448 × 512:

| Campo | Tipo | Contenido |
|---|---|---|
| `crudo` | float16 | MiDaS crudo de la toma, sin normalizar, resolución nativa. (Los valores llegan a unos 7000; float16 redondea a pasos de 2 a 4 en ese rango: error máximo medido 2.) |
| `ids` | uint8 | Clase del primer impacto de cada píxel, las mismas clases que `hit` más **7 = héroe** (el héroe se retroproyecta nunca, pero en pantalla ocupa píxeles). 0 = nada. |
| `celda` | int16 (448, 512, 2) | Celda de planta (fila, columna) que tocó el rayo en el 3D; para la baranda y el héroe, la celda por donde cruza su plano; −1 si no tocó nada. |
| `sala`, `heroe` | | Como arriba. |

`HASHES.txt` lista el sha256 de los 150 `.npz` (120 + 30). El total de `por_toma/` pesa 9 MB.
