# PP2 paso 5d · el vessel: crecimiento con tope, por perfiles y por pases

Base `53d9410`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno quedan fuera del repo. Dos corridas completas dan los mismos hashes (`HASHES_vessel_perfiles.txt`). Unidad = celda de 8 px de la guía E; espejo i ↔ 57 − i (x = 28,5). La reconstrucción del mapa de clases de D que uso para los A\* reproduce, sobre la guía E original, los mismos 116 / 216 / 142 pasos y las mismas secuencias.

## Qué hice

**Reglas, como las leí.**
- **R1 · franjas.** Un grupo agrega por lado y por turno las franjas de 1 celda de grosor pegadas a ese lado (vecindad de 4, nunca en diagonal), solo las tiradas de ≥ 4 celdas seguidas libres; cada celda nueva guarda 2 celdas de muro (distancia de Chebyshev ≥ 3) con el suelo de cualquier otro grupo de la copia.
- **R2 · tope.** 38 % del área propia (parte entera) por grupo, total ≤ 2684; los puentes no crecen.
- **R3 · lado frenado.** Si en una pasada un grupo no tiene ninguna franja válida hacia un lado, ese lado queda cerrado para ese grupo en esa pasada; los demás lados siguen.
- **R4 · orden.** Rondas: en cada ronda cada grupo toma un turno (una franja por lado), de mayor a menor área. Orden usado: **11 (298), 10 (209), 5 (179), 19 (143), 20 (139), 0 (107), 17 (96), 18 (90), 6 (89), 3 (70), 24 (68), 4 (67), 23 (65), 25 (60), 2 (41), 1 (34), 16 (19)**.
- **R5 · espejo.** Los pares 23 ↔ 24, 5 ↔ 6, 17 ↔ 18, 1 ↔ 2, 19 ↔ 20 crecen en el turno del más grande: cada franja del grande se refleja en x = 28,5 y el otro toma, de su reflejo, las tiradas de ≥ 4 celdas que le tocan; si el reflejo no se puede, el grande tampoco toma esa franja. X0, X3, X4 y hub 25 (simétricos consigo mismos) agregan cada franja junto con su reflejo. Y10 y grupo 11 crecen sin espejo.
- **R6 · centros.** Herradura: (28,5; 68,5). Norte: el centroide de sus celdas. Islas: el centroide de cada una. Perfil 2: X0 y X3 usan un centro lejano al sur, así que «afuera» es el norte. Una franja es exterior si el promedio de (dirección · (celda − centro)) es ≥ 0; si no, interior.
- **R7 · puentes.** Y12, Y13, Y14, Y15 y X9 (con los tiles de sus gates) salen de todas las copias; se vuelven a colocar al final.
- **Pases.** 1 exterior (hasta la mitad del tope de cada grupo), 2 interior (lo que queda del tope), 3 deuda (lo que queda, en cualquier sentido).
- **Lo no dicho.** Los grupos no cubren pilares ni tiles de gate (como en 5c); sí las antorchas del muro. La silueta de partida es la del 5c (suelo, muro y pilares del 5F sin fachada encogidos 2 celdas, más lo que ya era suelo o gate); ocho celdas de «fachada» encerradas en el muro las leí como muro.

**Copias por zona.** Cada zona crece en su copia, sin las otras zonas ni los puentes (por eso, antes del desplazamiento, las copias se superponen: `P#_1_exterior.png` … `P#_3_deuda.png`, borde rojo = celda reclamada por dos zonas).

**Desplazamiento** (`P#_4_desplazamiento.png`). La herradura queda fija. Perfil 1: el bloque norte sube las filas mínimas para que Y12 y Y13 conserven la distancia original entre sus rooms y haya muro mínimo con todo; las filas de la silueta entre la zona norte (filas < 31) y el resto se duplican (la silueta se alarga) y las decoraciones (pilares, gates, antorchas) de esa zona suben con ella. Las islas (19 y 20 en pareja; en el perfil 2 también 17 y 18, y 1 y 2, que no se pueden mover por el gate 64 / 65 con X0; 25 sola) se prueban en la posición que restituye la distancia de su puente (Y14, Y15) y, si no caben (muro mínimo, R8), devuelven franjas de a una (el par, a la vez) hasta que quepan.

**Puentes.** Recto, en las columnas originales ±2, si la distancia entre los rooms es ≥ la original; si no, se vuelve a insertar con su largo superpuesto sobre celdas nuevas (se cortan las celdas nuevas de cualquier grupo que estorban y las que quedan a menos de 2 celdas de los costados, y no corre sobre los gates originales del F4); si tampoco, un recorrido con giros de su ancho (X9).

## Lecturas que tomé

**Condiciones duras: pasan en los dos perfiles.** A\* de D a la salida, a I y al cofre 2 con las mismas secuencias de grupos (I: 16, 23, 10, 5, 14, 19; salida: 16, 23, 10, 5, 4, 6, 11, 24, 9, 25; cofre 2: 16, 23, 10, 5, 4, 6, 15, 20; pasos 114 / 208 / 146 en ambos); G cerrada; escaleras y cofre siguen en suelo; ninguna isla se superpone ni baja del muro mínimo y ningún par de grupos queda bajo min(distancia de la guía, 3) salvo los que un puente une; 0 celdas de suelo fuera de la silueta nueva.

| | guía E | perfil 1 | perfil 2 |
|---|---|---|---|
| suelo de grupos (tope 2684) | 1945 | **2436** (+491) | **2439** (+494) |
| zona gris muerta (celdas) | 920 | 491 (−47 %) | 407 (−56 %) |
| muro mediano entre grupos vecinos (unidades) / mínimo | 6 / 1 | 7 / 1 | 6 / 1 |
| filas de silueta | 108 | 109 (+1 al norte) | 108 (+0) |
| tiles de silueta | 4396 | 4448 | 4396 |

**Por pase** (perfil 1, celdas del grupo tras cada pase; tope entre paréntesis): X5 179 → 195 → 208 → 212 (68); X6 89 → 105 → 117 → 121 (33); X4 67 → 79 → 79 → 91 (25); grupo 11 298 → 352 → 408 → 408 (113); Y10 209 → 209 → 263 → 263 (79); hub 23 65 → 73 → 87 → 87 (24), hub 24 68 → 76 → 90 → 90 (25); hub 25 60 → 68 → 68 → 76 (22); Y16 19 → 19 → 26 → 26 (7); X0 107 → 131 → 143 → 151 (40); X3 70 → 90 → 90 → 90 (26); hub 17 96 → 110 → 119 → 127 (36); hub 18 90 → 104 → 113 → 120 (34); X1 34 → 40 → 45 → 45 (12); X2 41 → 47 → 52 → 52 (15); hub 19 143 → 169 → 173 → 193 (54) y hub 20 139 → 161 → 165 → 185 (52). Perfil 2: iguales salvo X0 (107 → 131 → 143 → 143), X3 (70 → 78 → 94 → 94), hub 17 (96 → 114 → 114 → 132), hub 18 (90 → 107 → 107 → 124), X1 (34 → 38 → 38 → 46) y X2 (41 → 45 → 45 → 53). Ningún grupo pasa su tope; los que más lo usan son el grupo 11 (110 de 113), hub 19 (50 de 54) y hub 20 (46 de 52), y el que menos, Y10 (54 de 79). Detalle por grupo (exterior / interior / deuda / devuelto, caja final) en `vessel_perfiles.json`.

**Desplazamiento.**
- **Perfil 1:** el bloque norte subió **1 fila** (la silueta se alargó 1 fila hacia el norte: 4396 → 4448 tiles). Hub 19 y hub 20 devolvieron 5 franjas cada una (28 celdas de las 50 / 46 que habían gastado) y quedaron donde estaban (desplazamiento 0); hub 25 no devolvió nada.
- **Perfil 2:** sin desplazamiento; 19 y 20 devolvieron las mismas 5 franjas (28 celdas); 17 + X1, 18 + X2 y 25 no devolvieron.

**Cajas finales de las islas y de la herradura** (crecimiento de la caja por lado, perfil 1; O / E / N / S, celdas): hub 19: 0 / 1 / 2 / 0; hub 20: 1 / 0 / 2 / 0; hub 23 y hub 24: 0 / 0 / 2 / 0; hub 25: 0 / 0 / 2 / 0; X5 y X6: 0 / 0 / 5 / 1; grupo 11: 0 / 0 / 9 / 0; Y10: 0 / 2 / 0 / 0; X0: 1 / 1 / 0 / 0; X3: 1 / 1 / 0 / 0; hub 17: 0 / 1 / 2 / 1; hub 18: 1 / 0 / 2 / 2.

**Puentes** (perfiles 1 / 2):
- **Y12:** conserva su largo (13) en las columnas originales.
- **Y13:** superpuesto sobre celdas nuevas, más corto (13 / 12 contra 15 entre rooms en la guía: el grupo 11, al crecer al norte, ocupó su carril); cortó 8 celdas nuevas del grupo 11 y retiró 22 más a los costados para dejar el muro mínimo.
- **Y14:** superpuesto, conserva el largo (6); cortó 1 celda nueva de X5.
- **Y15:** conserva su largo (6).
- **X9:** no cabe recto (los pilares cierran las filas entre hub 25 y hub 24): recorrido con giros de ancho 4 (32 tiles).
- Excepciones a «conservar el largo» (por largo, superpuesto o recorrido): Y13, Y14, X9.

**Error de espejo** (celdas que no coinciden entre un lado y el reflejo del otro; guía E → perfil 1 / perfil 2): hub 23 ↔ 24 9 → 9 / 9; X5 ↔ X6 96 → 96 / 96; hub 17 ↔ 18 8 → 9 / 10; X1 ↔ X2 7 → 7 / 7; hub 19 ↔ 20 10 → 14 / 14; Y12 ↔ Y13 2 → 2 / 6; Y14 ↔ Y15 0 → 0 / 0; X0 10 → 10 / 10; X3 12 → 12 / 12; X4 6 → 6 / 6; hub 25 8 → 8 / 8. Y10 contra grupo 11 (sin espejo) 89 → 195 / 195.

## Qué no calzó con la predicción de [R]

- **Suelo entre 2450 y 2600:** 2436 y 2439, un poco por debajo (+25 % sobre 1945; el tope de 2684 no se usa).
- **«No aparecen púas ni lóbulos de menos de 4 celdas»:** calza (toda franja es de ≥ 4 celdas), pero aparecen lóbulos de 4 de ancho, por ejemplo la franja que X5 y X6 agregan al norte (4 celdas, 5 de alto) y la de hub 19 / 20 al norte (`P1_reconocimiento.png`).
- **«El error de espejo baja a casi 0 en los pares»:** no baja: se queda en el de la guía original (X5 ↔ X6 96, hub 23 ↔ 24 9); lo que crece lo hace simétrico, así que no cambia lo que ya era asimétrico. Sube en hub 19 ↔ 20 (10 → 14) y, en el perfil 2, en Y12 ↔ Y13 (2 → 6).
- **«La gris baja un 40–60 %»:** calza: −47 % (perfil 1) y −56 % (perfil 2).
- **«El bloque norte sube 4–8 celdas»:** sube 1; las franjas de la herradura al norte son de 5 celdas (X5, X6) y 9 (grupo 11), pero la distancia de Y12 solo pedía 1.
- **«En el perfil 2 la silueta se alarga menos que en el 1»:** calza (0 contra 1 fila), pero en el perfil 2 Y13 queda más corto (12 contra 13).
- **«Hubs 19 y 20 crecen hacia el sur»:** no: crecen al norte (2) y hacia el centro (1); al sur 0. En su copia las islas crecieron en todas las direcciones; al juntarlas con la herradura devolvieron 5 franjas.
- **Lo que dependió de mis lecturas:** orden por rondas (un turno por ronda y no un grupo hasta agotar su tope), la reflexión parcial del espejo, el cierre de lados por pase, las columnas ±2 y las tres formas de colocar un puente, y que ninguna isla se movió (la distancia de Y14 e Y15 se resolvió devolviendo franjas, no desplazando).

## Archivos (en `pp2/vessel_perfiles/`)

`P1_1_exterior.png`, `P1_2_interior.png`, `P1_3_deuda.png`, `P1_4_desplazamiento.png`, `P1_reconocimiento.png`, `P1_gris.png`; los seis de `P2_`; `guias_comparacion/P1/` y `guias_comparacion/P2/` (`pack_grupos.png`, `pack_gates.png`, `guia.json`; mismos ids; el mapa del perfil 1 tiene 109 filas, la guía E 108; la guía E original no se tocó); `vessel_perfiles.json`; `HASHES_vessel_perfiles.txt`; este informe.

Para aquí: escala ×2, alturas y banda alta van en otros pasos.
