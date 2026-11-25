# PP2 paso 8n · prueba simple: la escena pintada como gradiente de grises por altura, a 50 %

Base `793e8d9`. Solo documentos, imágenes y arrays; nada de `src/`, `tools/` ni otras carpetas. La geometría es la del 8l (con el muro de X3), sin cambios; **solo cambia el material**: grises, sin luces (sin sombreado ni sombras). Mismo entorno de red: MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12. Sin K-means, sin capas, sin medidas extra y sin veredicto: las capas y su composición por clase las saca [R] con los `.npz`.

## 1 · Valor de gris

gris = (base + h) / 12, con **base = 0,1** dentro de la silueta del vessel y 0 fuera (el fondo vacío es 0).

| Elemento | h (tope) | Gris |
|---|---|---|
| Piso nivel 0 | 0 | 0,008 |
| Muro sobre piso bajo | 5 | 0,425 |
| Pilar o esquina sobre piso bajo | 6 | 0,508 |
| Plataforma del 2.º piso (franja X4–X6 y hub 25) | 5 | 0,425 |
| Muralla sobre el 2.º piso | 8 | 0,675 |
| Pilar o esquina sobre el 2.º piso | 11 | 0,925 |
| Techo (solo como tope de la normalización) | 12 | 1 |

Lo que la tabla no nombra (lecturas de [R]): cara o banda de la franja, peldaños y gates van de 0 a 5 con su altura (h = 5 z / 14, z en celdas); la baranda va de 5 a 6 (z de 14 a 18); el héroe sigue blanco; las celdas de banda son suelo a z = 0 y llevan h = 0 (la cara vertical de la franja es la que lleva el gradiente). Un muro con otra altura de tope (por ejemplo 18,2 junto a una escalera) se interpola con las mismas curvas.

**Esquinas y pilares.** No se pueden distinguir los pilares del pase de muros; todo se trata como esquina (clase 8). Esquina = celda de muro donde se cruzan un brazo horizontal (tramo de 3 o más celdas de muro) y uno vertical (tramo de 3 o más), es decir las uniones en L, T y cruz (con muros de 2 celdas de espesor, «muro hacia dos lados» da todas las celdas, por eso se usa el cruce de brazos). Hay **272 celdas** de esquina de 1060 de muro: 247 sobre piso bajo (tope 14) y 25 sobre el 2.º piso (tope 28).

## 2 · Variantes

- **Suave:** en cada cara vertical visible el gris sube de forma continua con la altura z del punto (muro bajo 0 → 5; muralla 0 → 5 hasta z = 14 y 5 → 8 hasta z = 28; esquina baja 0 → 6; esquina alta 0 → 5 y 5 → 11); las tapas llevan el valor de su tope.
- **Escalonada:** tapa y caras de cada objeto llevan el valor de su tope (cada peldaño es un objeto con el suyo).
- Los muros cuya cara no se ve desde la cámara solo muestran su tapa, que ya lleva el valor de su tope en las dos variantes.

## 3 · Tomas a 50 %

Las 15 tomas por sala del método 1 del 8l: misma celda del héroe, perspectiva 71°, FOV 30, D1 = 68,97 celdas, mismos cortes de muro (4 de las 15 tuvieron corte: R3, R4, R16, R23). Render de las dos variantes de gris a **256 × 224**. Tercera variante: la toma a color del 8l (panel izquierdo de `tomas/color/m1_habitaciones/persp71_D1/R<sala>.png`) **reducida** a 256 × 224 con promedio de área; no se renderizó de nuevo. Total: 45 pasadas de MiDaS.

**Entrada de MiDaS.** La imagen de 256 × 224 se entrega tal cual: se usan la normalización y el orden de canales del modelo, sin su paso de redimensionado (el tensor es de 224 × 256; las dos dimensiones son múltiplos de 32). Con el redimensionado del modelo la imagen de 256 × 224 se habría subido de nuevo a 448 × 512.

**Tiempo por pasada de MiDaS** (CPU, 4 hilos, esta máquina, en la misma corrida; varía entre corridas y por eso `tiempos_midas.json` no entra en los hashes):

| Entrada | Pasadas | Media |
|---|---|---|
| 256 × 224 nativa (las 45 pasadas) | 45 | 0.622 s |
| 512 × 448 como en el 8l | 3 (tras una de calentamiento) | 2.92 s |
| 256 × 224 con el redimensionado del modelo (sube a 448 × 512) | 3 | 3.113 s |

## 4 · Qué se guardó

`pantalla/<variante>/R<sala>.npz` con `<variante>` = `suave`, `escalonada` o `color50` (45 archivos), cada uno con:

| Campo | Tipo | Contenido |
|---|---|---|
| `img` | uint8 (224, 256, 3) | La imagen que se le dio a MiDaS. |
| `crudo` | float16 (224, 256) | El MiDaS crudo, sin normalizar. |
| `ids` | uint8 (224, 256) | Clase por píxel: 0 nada, 1 piso nivel 0, 2 piso nivel 1, 3 cara o banda, 4 peldaño, 5 muro, 6 baranda, 7 héroe, 8 pilar o esquina. Es la misma en las tres variantes (misma geometría). |
| `celda` | int16 (224, 256, 2) | Celda de planta (fila, columna) que tocó el rayo; para la baranda y el héroe, la celda por donde cruza su plano; −1 si no tocó nada. |
| `gris` | float16 (224, 256) | Valor de gris asignado por píxel (el héroe 1; el fondo 0). En `color50` es NaN: no hay gris asignado. |
| `sala`, `heroe` | int16 | Sala y celda del héroe. |

Además `tomas/R<sala>.png`: suave | escalonada | color 50 %, cada una con su MiDaS normalizado debajo (solo para mirar; el MiDaS crudo está en los `.npz`). `vessel_grises.json` guarda la tabla de valores, las esquinas, los cortes y los píxeles por clase de cada toma; los tiempos están en `tiempos_midas.json`. `HASHES_vessel_grises.txt`: dos corridas dieron los mismos hashes (sin `tiempos_midas.json`).
