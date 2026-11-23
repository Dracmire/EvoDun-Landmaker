# PP2 paso 5 · el vessel: mapa expandido del 5F

Base `d4b7acb`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno quedan fuera del repo. Dos corridas completas dan los mismos hashes (`HASHES_vessel.txt`).

## Qué hice

1. **Partes** (`partes.json`, `partes.png`): herradura (16, 23, 10, 11, 24, 9, 25; 744 tiles de 8 px), herradura pequeña (5, 4, 6; 335), interior (19, 20, 14, 15; 330, no crece) y fondo (0, 1, 2, 17, 18, 12, 13, 3; 536).
2. **Expansión hacia afuera** k = 1, 2, 3 en tiles de 16 px (2 micro-pasos de 8 px por k), dentro de tope/borde/cara. Reglas aplicadas: un tile solo se toma si queda más lejos del centroide del interior (28.5, 65.9) que su tile padre del grupo; interior y su muro de 1 tile de 16 px intactos (zona protegida Chebyshev ≤ 2); pilares intactos; ≥ 1 tile de 16 px de muro entre grupos distintos (separación Chebyshev ≥ 3 tiles de 8; los pares que la guía ya tenía a distancia 1–2 no pueden acercarse más, lista en `expansion.json` → `reglas`); cada gate sigue uniendo los mismos dos grupos. El overlay de áreas crece con su grupo (`areas_k*.png`, `pack_grupos_k*.png` regenerado por k, mismos colores que `guias_E.png`; `expansion_k*.png` es la hoja antes/después).
3. **Framing por gates** (`framing_*.png`, `framing.json`): ventana de 480×270 px SNES centrada en el gate, héroe de pie (16×24), ortogonal 71° (caras de muro 40 px, de pilar 48 px, sin texturas) y cenital, sobre el mapa original y el k = 2. Gates: 86 (Y10 → X5), corte F4 (X6 → grupo 11), 89 (X5 → Y14, F5) y control X4 entre los dos pilares que lo flanquean (en el diseño se nombran «13 y 14»; en el mapa uso los dos pilares laterales más cercanos al centro del gate 87–88; el id 13 y 14 es también el de dos grupos de la guía, no los confundo con ellos).
4. **Prueba A** (ensanchar los tres gates de escalera ×1, ×2, ×3.3, tallando muro por ambos lados, sin tocar pilares ni otros grupos; se detiene a < 3 tiles de un grupo que el gate no une) sobre original y k = 2, con A* de D recalculados. **Prueba B** (k = 2 dejando crecer a los grupos que tocan el borde sobre fachada, vacío exterior y cielo; relleno de 6 tiles alrededor del mapa).

Definición de ancho de gate usada: eje de paso = el eje en que más difieren los centroides de los dos grupos que une; ancho = extensión de los tiles propios del gate (más los tallados) a lo ancho de ese eje. Aparte se da la «abertura contigua» (corrida de suelo continuo por el centro del gate), que incluye el pasillo vecino y por eso es mayor.

## Lecturas que tomé

**Expansión (suelo de grupos, tiles de 8 px; original 1945 de grupos, 2112 con gates, 2463 de muro):**

| k | suelo grupos | factor | suelo con gates | muro | mediana de pasillo | mediana grosor de muro entre grupos | grosor mínimo |
|---|---|---|---|---|---|---|---|
| 0 | 1945 | 1.000 | 2112 | 2463 | 5 | 10 | 2 |
| 1 | 2410 | 1.239 | 2577 | 1998 | 6 | 6 | 2 |
| 2 | 2800 | **1.440** | 2967 | 1608 | 7 | 4 | 2 |
| 3 | 2955 | 1.519 | 3122 | 1453 | 7 | 4 | 2 |

Ancho mediano de gate: 4 en los cuatro mapas (los gates no se tocan).

Por parte (tiles antes → después, factor):

| parte | k=1 | k=2 | k=3 |
|---|---|---|---|
| herradura (744) | 886 · 1.19 | 989 · 1.33 | 1002 · 1.35 |
| herradura pequeña (335) | 426 · 1.27 | 502 · 1.50 | 538 · 1.61 |
| fondo (536) | 768 · 1.43 | 979 · 1.83 | 1085 · 2.02 |
| interior (330) | 330 · 1.00 | 330 · 1.00 | 330 · 1.00 |

Grupos citados (factor k=1 / 2 / 3; caja ancho×largo antes → k=2):
- Y10 (209 tiles): 1.00 / 1.00 / 1.00, no crece (6×35 → 6×35).
- grupo 11 (298): 1.07 / 1.10 / 1.12 (12×44 → 12×51, solo N y S).
- hub 23 (65): 1.49 / 1.89 / 2.00 (11×8 → 15×16); hub 24 (68): 1.44 / 1.84 / 1.84; hub 25: 1.35 / 1.50 / 1.50.
- banda X5 (179): 1.29 / 1.50 / 1.56 (24×14 → 27×20); X4 (67): 1.24 / 1.54 / 1.90 (12×7 → 12×11); X6 (89): 1.26 / 1.46 / 1.47 (14×14 → 15×18).
- los que más crecen: Y16 (19 → 53, ×2.79 a k = 2), X1 (×2.44), X9 (×2.40), X2 (×2.20), Y13 / Y12 (×2.1), X0 a k = 3 (×2.33, 24×8 → 36×12).

**A\* de D** (salida I, salida J, cofre 2) en las tres expansiones: misma secuencia de grupos que `guia_E.json` → `astar_de_D` en k = 1, 2 y 3 (I: 16, 23, 10, 5, 14, 19; J: 16, 23, 10, 5, 4, 6, 11, 24, 9, 25; cofre 2: 16, 23, 10, 5, 4, 6, 15, 20). Pasos: 114 / 210 / 140 (guía: 116 / 216 / 142). **G sigue cerrada** en k = 1, 2, 3. No encontré contactos nuevos a k = 3 con estas reglas.

**Framing** (ortogonal 71°; fracciones del cuadro de 480×270; la escalera = caja del gate; el marco = gate + pilares que lo flanquean):

| toma | escalera ancho × alto | marco ancho × alto | pilares dentro / que enmarcan |
|---|---|---|---|
| gate 86 | 0.050 × 0.056 | 0.267 × 0.458 | 2 / 2 |
| corte F4 | 0.067 × 0.168 | 0.133 × 0.458 | 2 / 2 |
| gate 89 | 0.050 × 0.056 | 0.133 × 0.654 | 1 / 2 (cenital 2 / 2) |
| control X4 | — | 0.217 × 0.542 | 2 / 2 |

En el cenital el alto de la escalera es 0.059 / 0.178 / 0.059 y el del marco 0.296 / 0.296 / 0.504 / 0.385. El héroe queda dentro del cuadro en todas las tomas. **Original y k = 2 dan los mismos números de escalera y marco**: la expansión no mueve ni los gates ni los pilares; solo cambia la abertura contigua (F4 36 → 39 tiles; g86 y g89 4 → 4). Lo que cambia entre original y k = 2 está en el suelo y el muro alrededor, visible en `framing_*.png`.

**Prueba A** (ancho del gate en tiles de 8 px logrado / objetivo; frac. de ancho de pantalla de la escalera; original → k = 2):
- gate 89: ×2 logra 6/6 (0.050 → 0.100 en ambos); ×3.3: 10/10 en original (0.167) y 7/10 en k = 2 (0.117; se detiene a ambos lados).
- F4 (el paso va por x, el ensanche crece en vertical de pantalla): ×2 logra 12/12 y ×3.3 18/20 (original) y 18/20 (k = 2); su fracción de alto pasa de 0.168 a 0.336 y 0.504; el ancho se queda en 0.067.
- gate 86: no ensancha en ningún caso (3/6 y 3/10; ambos lados bloqueados por los pilares y los grupos 10 y 5 a menos de 3 tiles).
- **A\*** tras el ensanche: misma secuencia de grupos en I, J y cofre 2 en todos los casos (original y k = 2, ×1, ×2, ×3.3); G cerrada. Los pasos varían (J 216 → 214 en original, 210 → 198 en k = 2).

**Prueba B** (k = 2, fachada + vacío exterior + cielo): suelo de grupos 3256 (×1.674) frente a 2800 (×1.440) del paso normal. Tiles ganados por clase: fuera del mapa (relleno) 334, fachada 38, fuera 48, cielo 32. Por grupo (tiles extra sobre fachada y vacío): Y10 +164 (209 → 373, ×1.79), grupo 11 +205 (298 → 534, ×1.79), X0 +39 (×2.22), X5 +14, hubs 23 y 24 +6 cada uno, banda X4 y X6 +0.

## Qué no calzó con la predicción de [R]

- **Y10 y grupo 11 no son los que más crecen** en la expansión normal: Y10 no crece nada (1.00) y grupo 11 crece poco (×1.10 a k = 2). Lo que más crece son los pasillos pequeños del fondo y de la herradura (Y16, X1, X9, X2) y los hubs 23 y 24 (×1.8–1.9). Y10 y grupo 11 solo crecen cuando se permite invadir fachada y vacío exterior (prueba B: ×1.79 ambos), pero sobre todo a costa del relleno exterior al mapa. (En la prueba B los hubs 23 y 24 casi no suman: +6.)
- **La banda X5–X4–X6 crece**, no «poco hacia el norte»: ×1.50 / 1.54 / 1.46 a k = 2, y X4 ×1.90 a k = 3. Crece N en las tres, y X5 también por O, E y S.
- **Interior sin cambio**: calza.
- **Suelo a k = 2 ×1.44**: dentro de 1.4–1.5.
- **Framing**: la escalera del gate 86 y del 89 mide 0.050 del ancho (predicción 0.05–0.07: dentro; F4 0.067 dentro); a k = 2 no sube a 0.08–0.10 porque los gates no se ensanchan con la expansión; el marco de X4 mide 0.217 (predicción ≈ 0.27); el del gate 86 sí mide 0.267.
- **Prueba A a ×3.3**: la escalera del gate 89 mide 0.167 (original) y 0.117 (k = 2), no ≈ 0.2; el gate 86 no se pudo ensanchar.
- **Prueba B**: calza en que Y10 y grupo 11 son los que más suman y en que la banda no suma; no calza en los hubs 23 y 24 (+6 cada uno).
- **A\***: se mantienen en k = 1 y 2, y también en k = 3 con estas reglas (la predicción dejaba abierto que k = 3 creara contactos).
- Mi definición de ancho cambió a mitad de la medición (la primera, por corrida mínima, daba valores inconsistentes); los números de arriba usan la definición final, descrita arriba.

## Archivos (en `pp2/vessel/`)

`partes.json`, `partes.png`; `expansion_k1.png`, `expansion_k2.png`, `expansion_k3.png`; `areas_k1.png`, `areas_k2.png`, `areas_k3.png`; `pack_grupos_k1.png`, `pack_grupos_k2.png`, `pack_grupos_k3.png`; `expansion.json` (medidas por grupo, generales, reglas, A\*, prueba B); `expansion_B_k2.png`, `pack_grupos_B_k2.png`; `framing_g86.png`, `framing_F4.png`, `framing_g89.png`, `framing_X4.png`; `framing.json` (con la prueba A); `HASHES_vessel.txt`; este informe.

La escala ×2 («16 bits» del mapa completo) va en otro pase.
