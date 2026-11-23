# PP2 paso 5b · el vessel: rooms que crecen con su eje de framing (reglas RV)

Base `91b2e11`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno quedan fuera del repo. Dos corridas completas dan los mismos hashes (`HASHES_vessel_rv.txt`). Todas las coordenadas son tiles de 8 px (x, y) de la guía E.

## Qué hice

**Paso 0 · qué es room** (`rooms.json` → `clasificacion`, con la razón de cada grupo). Rooms que crecen: hubs 17, 18, 23, 24 y 25. No crecen: hubs 19 y 20 (interior), Y14 e Y15, la banda X5 / X4 / X6, X3 y todos los pasillos X e Y. El grupo 11 (Y11 + hub 22 fusionados en la guía E) queda **intacto**: la guía E y su `pack_grupos.png` le dan un solo id y ningún archivo de la guía separa los tiles del hub 22 de los del pasillo Y11.

**Paso 1 · mini esqueleto** (`esqueletos.png`, `rooms.json` → `mini_esqueleto_segmentos`). Accesos = los gates que tocan al room (el tile de suelo del room pegado al gate) más la escalera J en el hub 25. Camino más corto entre cada par de accesos dentro del suelo del room, con penalización por giro (3), de modo que el camino que sale del gate de entrada sale perpendicular a su muro; unión de los caminos, simplificada a segmentos rectos.

**Paso 2 · eje de framing** (`rooms.json` → `eje`). Gate de entrada: el gate por donde entra el A* a la salida J (los cuatro hubs que están en algún A*: 23, 24 y 25; el 17 y el 18 no están en ninguno y usan el gate más cercano a la entrada H (19, 92)). El eje sale del gate hacia dentro del room, perpendicular a su muro; foco = extremo del tronco del esqueleto que va sobre el eje, o el fondo del room sobre el eje si el tronco no está sobre él.

**Paso 3 · muro mínimo y zona de expansión** (`zona_w8.png`, `zona_w16.png`). Lectura de w: w8 = 1 tile de 8 px entre los suelos de dos espacios (distancia de Chebyshev ≥ 2), w16 = 1 tile de 16 px (≥ 3). Espacios: suelo de cualquier grupo, pilares, suelo sin grupo, y el vacío / cielo / fachada como borde (el muro exterior también queda en w; el encargo no dice nada sobre el exterior y elegí esto, ver diagnóstico). Zona del room = tiles de muro (tope, borde, cara y las antorchas del muro, clase 7 sin grupo) a distancia ≥ w + 1 de los demás espacios; si dos rooms pueden tomar el mismo tile, va al más cercano (Chebyshev) y los empates (260 tiles en w8, 132 en w16) no los toma ninguno; las zonas de dos rooms distintos conservan w entre sí. No toqué fachada, pilares ni gates.

**Paso 4 · crecimiento por lados enteros** (`rooms_w8.png`, `rooms_w16.png`, `guias_comparacion/w8/` y `w16/`). Cuerpo del room = apertura 3×3 de su suelo (los brazos de 1–2 tiles no mueven sus lados). Un paso mueve un tile el borde exterior del cuerpo en una dirección y se hace solo si **todos** los tiles de esa franja son muro libre de la zona del room. Orden: primero a lo ancho (los dos lados a la vez: si uno choca, ninguno avanza, RV5), luego hacia el fondo (+u), luego hacia atrás de la entrada (−u, RV6). Los tiles de un gate dentro de una franja no se cubren y quedan como muesca (RV6 / RV9: es una muesca que ya existía en el muro); sin esa lectura ningún room crece (ver diagnóstico). El room original queda entero dentro del nuevo por construcción (RV8). Los pasillos no se tocan. Cada carpeta de `guias_comparacion/` lleva `pack_grupos.png` (mismos ids: id + 1 = R + 256·G), la imagen de la guía (`guia_RV_w*.png`) y `guia.json` (copia de `guia_E.json` con tiles, cajas y cociente de 17 H actualizados; la guía E original no se tocó).

**Paso 5 · medidas y condiciones** (`vessel_rv.json`, `reconocimiento_w8.png`, `reconocimiento_w16.png`). Extra, rotulado como diagnóstico y fuera de las dos variantes pedidas: la misma corrida con las reglas encendidas y apagadas de a una (muesca de gates, simetría RV5, margen w al exterior), en `vessel_rv.json` → `diagnostico_de_reglas`.

## Lecturas que tomé

**Condiciones duras, en w8 y en w16:** los tres A\* de D (I, J, cofre 2) siguen la misma secuencia de grupos que `guia_E.json` → `astar_de_D`; G sigue cerrada; los pasillos y todos los grupos que no son los 5 rooms quedan idénticos tile por tile; los gates unen los mismos grupos; el room original está dentro del nuevo; solo se reclamaron tiles de muro (clases tope, cara y 4 antorchas en w8); ningún par de espacios quedó por debajo de min(distancia original, w + 1), tampoco contra pilares ni exterior. Ninguna condición falló. La guía original ya tenía pares por debajo de w (gates donde dos grupos se tocan): (0, 17), (0, 18), (1, 17), (2, 18), (9, 24), (12, 17), (16, 23) con 0 tiles de muro, y en w16 además (9, 25), (10, 23), (11, 24) con 1; esos pares no se acercaron más. Pasos de los A\*: 116 / 216 / 142 (I, J, cofre 2) en w8 y en w16, los mismos que da mi réplica del A\* de D sobre la guía original.

**Ejes** (originales; tiles de 8 px; el lado − y el lado + de v están en `rooms.json`):

| room | gate de entrada | origen → foco | largo del eje | ancho a cada lado del eje (− / +) | diferencia |
|---|---|---|---|---|---|
| hub 17 | 66 (con Y12; ningún A\* pasa) | (12, 27) → (12, 19), hacia el norte | 9 | 1 / 8 | 7 |
| hub 18 | 67 (con Y13; ningún A\* pasa) | (44, 27) → (44, 19), hacia el norte | 9 | 7 / 2 | 5 |
| hub 23 | 112 (desde Y16, A\* J) | (17, 88) → (11, 88), hacia el oeste | 7 | 1 / 6 | 5 |
| hub 24 | 103+109+110+111 (desde el grupo 11, A\* J) | (49, 84) → (39, 85), hacia el oeste | 11 | 5 / 2 | 3 |
| hub 25 | 117 (desde X9, A\* J) | (31, 92) → (25, 92), hacia el oeste | 7 | 1 / 6 | 5 |

En el 17, 18, 23 y 24 el tronco más largo del esqueleto va sobre el eje. En el 25 no: su tronco más largo (de (31, 92) a la escalera J en (31, 86)) es perpendicular al eje y el foco es el fondo del room sobre el eje.

**Crecimiento de los rooms** (tiles de suelo antes → después):

| room | w8 | w16 | caja antes → w8 (ancho × largo) |
|---|---|---|---|
| hub 17 | 96 → 96 (×1.00) | 96 → 96 | 10×11 → igual |
| hub 18 | 90 → 90 (×1.00) | 90 → 90 | 10×10 → igual |
| hub 23 | 65 → 65 (×1.00) | 65 → 65 | 11×8 → igual |
| hub 24 | 68 → 80 (×1.18) | 68 → 76 (×1.12) | 11×8 → igual (rellena el rincón SE de su caja, 3 columnas hacia atrás de la entrada) |
| hub 25 | 60 → 88 (×1.47) | 60 → 60 (×1.00) | 8×8 → 8×12 (2 pasos a lo ancho, los dos lados) |
| los 5 rooms | 379 → 419 (×1.106) | 379 → 387 (×1.021) | |

Suelo de todos los grupos: 1945 → 1985 (w8), 1953 (w16). Zona de expansión por room, en tiles: w8 438 / 396 / 233 / 261 / 211, w16 230 / 217 / 119 / 143 / 79 (17, 18, 23, 24, 25). Error de simetría (diferencia de ancho entre los dos lados del eje): 7, 5, 5, 3, 5 antes y **los mismos después** (el room crece lo mismo a cada lado, así que conserva su descentrado original). Largo / ancho (largo medido a lo largo del eje): 17 1.10, 18 1.00, 23 1.38, 24 1.38, 25 1.00 → 0.67 en w8 (el eje del 25 va por x y su crecimiento es en y). Posición de la entrada a lo largo del largo: 0.09, 0.00, 0.09, 0.00, 0.125, sin cambio.

**Qué frenó cada lado** (primer motivo contado en `vessel_rv.json` → `rooms` → `frenos`):
- hub 17: al este un pilar en la franja; al oeste suelo sin grupo y el grupo 1; hacia el norte pilares y el gate 64; hacia el sur el gate 66 y Y12 (muro mínimo).
- hub 18: al este pilares y el grupo 2; al oeste un pilar; hacia el norte pilares y el gate 65; hacia el sur el gate 67 y el grupo 2.
- hub 23: el lado norte queda libre (9 pasos sin simetría); el lado sur lo frena el gate 112, el margen w con la fachada y el muro mínimo con Y16, y como RV5 frena también al norte, el ancho no crece; hacia el oeste gates y fachada; hacia el este pilares y el gate.
- hub 24: el lado norte queda libre (9 pasos sin simetría); el sur lo frenan el grupo 9 y un gate; hacia el oeste pilares, suelo sin grupo y gate; hacia el este crece 3 pasos y lo frenan un gate y el margen con la fachada.
- hub 25: a lo ancho crece 2 pasos y lo frenan un gate y el margen w con la fachada (6 tiles de la franja); hacia el oeste y el este lo frena la fachada.

**Diagnóstico de reglas** (suelo de los 5 rooms, factor sobre 379; "muesca" = gates como muesca; "exterior" = margen w contra fachada / vacío / cielo):

| variante | w8 | w16 |
|---|---|---|
| literal: sin muesca, simétrico, con exterior | ×1.000 | ×1.000 |
| con muesca, simétrico, con exterior (la corrida entregada) | ×1.106 | ×1.021 |
| con muesca, simétrico, sin margen al exterior | ×1.153 | ×1.153 |
| con muesca, sin simetría, con exterior | ×1.562 (23 +72, 24 +89, 25 +52, 17 y 18 +0) | ×1.084 (24 +8, 25 +24) |
| con muesca, sin simetría, sin margen al exterior | ×1.578 | ×1.153 |
| sin muesca, sin simetría | ×1.296 (23 +72, 25 +40) | ×1.063 (25 +24) |

En ninguna combinación crecen el hub 17 ni el hub 18.

## Qué no calzó con la predicción de [R]

- **Hubs 23 y 24 «crecen sobre todo hacia los lados y quedan casi cuadrados»:** el 23 no crece en la corrida entregada; el 24 gana 12 tiles dentro de su caja y sigue en 11×8 (no cuadrado). Sin la regla de simetría el 23 sí crece, 72 tiles hacia el norte (w8).
- **Hub 25 «crece poco»:** es el que más crece de los cinco en w8 (+28 tiles, ×1.47, de 8×8 a 8×12); en w16 no crece.
- **Hubs 17 y 18 «crecen más a lo largo del eje que a lo ancho»:** no crecen ni a lo largo ni a lo ancho, en ninguna de las variantes ni de las combinaciones del diagnóstico.
- **«Con w8 el suelo de los rooms crece ×1.5–2; con w16 algo menos»:** ×1.106 con w8 y ×1.021 con w16 (×1.562 en w8 si se quita la simetría).
- **«El error de simetría queda en 0–1 tile»:** 7, 5, 5, 3 y 5 tiles; no cambia con el crecimiento (el room crece igual a los dos lados, así que lo que hoy está descentrado respecto del eje del gate sigue igual de descentrado).
- **«Los rooms descentrados respecto de su gate son los que menos crecen»:** los cinco rooms están descentrados (3 a 7 tiles); los tres que no crecen (17, 18, 23) están a 7, 5 y 5; los dos que crecen (24 y 25) a 3 y 5.
- **Lo que dependió de una lectura mía:** sin cubrir nada de un gate ningún room crece; los tiles de gate dentro de una franja los dejé como muesca (RV6 / RV9) para que se mueva algo. El margen w al exterior (fachada / vacío / cielo) cambia el resultado de ×1.106 a ×1.153 en w8 y de ×1.021 a ×1.153 en w16.
- No usé ningún borde irregular que no fuera la muesca de un gate: el 25 no cubre el tile de gate (31, 93) de su franja sur y lo deja como gate; el 24 no lleva muesca nueva.

## Archivos (en `pp2/vessel_rv/`)

`rooms.json`, `esqueletos.png`, `zona_w8.png`, `zona_w16.png`, `rooms_w8.png`, `rooms_w16.png`, `reconocimiento_w8.png`, `reconocimiento_w16.png`, `guias_comparacion/w8/{pack_grupos.png, guia_RV_w8.png, guia.json}`, `guias_comparacion/w16/{pack_grupos.png, guia_RV_w16.png, guia.json}`, `vessel_rv.json`, `HASHES_vessel_rv.txt` y este informe.

Para aquí: pasillos, banda alta, interior, escala ×2 y alturas van en otros pasos.
