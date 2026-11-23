# PP2 paso 5c · el vessel: crecimiento por distancia, room por room (modos A y B)

Base `1a7cef3`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno quedan fuera del repo. Dos corridas completas dan los mismos hashes (`HASHES_vessel_sdf.txt`). Unidad = tile de 8 px de la guía E; espejo i ↔ 57 − i (x = 28,5).

## Qué hice

**Silueta de la torre** (`vessel_sdf.json` → `silueta`). Suelo, muro y pilares del 5F (sin fachada ni vacío) encogidos 2 unidades (Chebyshev); lo que ya era suelo o gate en la guía E se queda dentro (170 tiles de suelo del borde salen de la silueta encogida: Y10, grupo 11, hub 23 y los de abajo). Ocho celdas de «fachada» que están encerradas dentro del muro (las de (24, 88), (33, 88–90), (10, 89), (24, 90), (24, 92), (16, 93)) las leí como muro.

**Paso 0 · extracción** (`extraccion.png`, `vinculos.json`). Se borran los cinco pasillos (Y12, Y13, Y14, Y15, X9) con los tiles de sus gates (de la agrupación 83+84+85 solo la fila y = 42, que es la de Y13; el resto es el gate F4 entre X6 y el grupo 11 y no se toca). `vinculos.json` guarda, por pasillo, los gates que une, el ancho, el centro del pasillo respecto del eje de cada room y el par espejo; por isla, caja, tiles y par. Las islas (19, 20 y 25 en A; esas más 17 + X1 y 18 + X2 en B) **quedan reservadas en su sitio** durante el crecimiento de las demás partes (no se pueden ocupar y cuentan como suelo de otro room para el muro mínimo), para que puedan «volver donde estaban».

**Motor de crecimiento** (todo room por room). Cada room crece por anillos de 1 unidad (Chebyshev) desde su propio suelo; una celda se toma solo si es muro libre (tope, borde, cara, antorchas), dentro de la silueta, no es pilar ni gate, y queda a distancia ≥ 3 (= 2 unidades de muro) del suelo de cualquier otro grupo. Si dos rooms quieren la misma celda va al más cercano (empates: ninguno); las tomas se aplican de a un room por vez, rotando el orden en cada ronda y reverificando el muro mínimo contra lo ya tomado. Los rooms pueden tocar un pilar o un gate pero no cubrirlos. Al final de cada etapa se sueltan las partes nuevas más delgadas que 3 unidades (apertura 3×3), para que no queden zarcillos; el suelo original no se toca. Pares espejo: 17 + X1 con 18 + X2 crecen el mismo número de rondas (el que se frena primero frena al otro, solo en la etapa 3 del modo A).

**Modo A** (`A_1_herradura_ext.png` … `A_5_final.png`). 1) herradura, solo celdas fuera del casco convexo de la herradura; 2) herradura, solo celdas dentro del casco (el espacio de la U); 3) X0, X3, 17 + X1 y 18 + X2 con pasos que nunca bajan al sur; 4) islas 19, 20 y 25, en todas las direcciones; 5) pasillos.

**Modo B** (`B_1_todo_a_la_vez.png`, `B_2_islas.png`, `B_final.png`). Herradura, X0 y X3 a la vez en todas las direcciones; después las cinco islas (17 + X1, 18 + X2, 19, 20, 25); después los pasillos.

**Paso 5 · pasillos**. Cada pasillo vuelve recto entre sus dos rooms con su ancho: la posición ideal sale del eje del room «host» (el que no es isla) más el desplazamiento original del gate; el par espejo toma la posición reflejada; se busca la posición libre más cercana (±12 tiles). Si la isla queda con el gate corrido respecto de su eje se intenta moverla y, si no cabe, encogerla de a 1 unidad (hasta 6) y se adopta solo si así se alinea. Si no cabe un tramo recto se prueba un recorrido con giros (brocha cuadrada del ancho del pasillo y, si no, más angosta). Las celdas del pasillo que tocan un room son los gates nuevos (`pack_gates.png`, valor 2).

Mediciones: `vessel_sdf.json`. Guías de comparación en `guias_comparacion/A/` y `B/` (`pack_grupos.png`, `pack_gates.png`, `guia.json`; mismos ids; la guía E original no se tocó).

## Lecturas que tomé

**Condiciones duras: pasan en A y en B.** A\* de D a la salida, a I y al cofre 2 con la misma secuencia de grupos (I: 16, 23, 10, 5, 14, 19; J: 16, 23, 10, 5, 4, 6, 11, 24, 9, 25; cofre 2: 16, 23, 10, 5, 4, 6, 15, 20; pasos A 114 / 208 / 140, B 114 / 210 / 140); G cerrada; escaleras y cofre siguen en suelo; ningún par de espacios por debajo de min(distancia de la guía, 3), salvo los pares que un pasillo une por diseño (se tocan); 0 tiles nuevos fuera de la silueta y 0 sobre pilares. El muro de 1 unidad que la guía original ya tenía entre algunos pares no se acercó más.

**Zona gris muerta** (celdas de muro a más de 2 unidades de cualquier suelo dentro de la silueta; `gris_A.png`, `gris_B.png`):

| | total | norte | herradura | islas | otras |
|---|---|---|---|---|---|
| guía E original | 920 | 338 | 265 | 277 | 40 |
| modo A | 13 | 8 | 4 | 1 | 0 |
| modo B | 1 | 0 | 1 | 0 | 0 |

**Suelo y muros:** suelo de grupos 1945 → 3327 (A) y 3330 (B), ×1,71 los dos (con gates 2112 → 3444 y 3447). Grosor mediano del muro entre grupos vecinos (pares con 1 < distancia ≤ 12, en unidades): original 6, A 3, B 2,5; mínimo 1 en los tres (pares que ya lo tenían en la guía).

**Crecimiento por room** (tiles antes → después, factor; entre paréntesis las etapas del modo A: externa / interna / norte / islas):

| room | A | B |
|---|---|---|
| X5 | 179 → 498, ×2,78 (+208 / +111 / – / –) | 179 → 442, ×2,47 |
| X6 | 89 → 245, ×2,75 (+74 / +82) | 89 → 220, ×2,47 |
| X4 | 67 → 139, ×2,08 (+72 / 0) | 67 → 103, ×1,54 |
| hub 23 | 65 → 178, ×2,74 (0 / +113) | 65 → 181, ×2,79 |
| hub 24 | 68 → 196, ×2,88 (+3 / +125) | 68 → 231, ×3,40 |
| Y10 | 209 → 298, ×1,43 (0 / +89) | 209 → 298 |
| grupo 11 | 298 → 533, ×1,79 (+110 / +125) | 298 → 502, ×1,69 |
| Y16 | 19 → 37, ×1,95 | 19 → 39 |
| X0 | 107 → 214, ×2,00 (caja 24×8 → 28×12) | 107 → 347, ×3,24 (52×14) |
| X3 | 70 → 125, ×1,79 | 70 → 248, ×3,54 (24×16) |
| hub 17 + X1 | 130 → 208 (17: 96 → 129; X1: 34 → 79) | 130 → 134 |
| hub 18 + X2 | 131 → 206 (18: 90 → 127; X2: 41 → 79) | 131 → 155 |
| hub 19 / hub 20 | 143 → 158 / 139 → 156 | igual |
| hub 25 | 60 → 85, ×1,42 | 60 → 75, ×1,25 |

Crecimiento de la caja por lado (A, tiles): X0 oeste 2, este 2, norte 4; X1 oeste 2, norte 6; X2 este 2, norte 6; hub 17 oeste 5, este 1, norte 3; hub 18 oeste 1, este 6, norte 3; X3 oeste 1, este 1, norte 6; hub 19 este 1; hub 20 oeste 1; hub 23 este 9, norte 8; hub 24 oeste 9, norte 8; hub 25 este 2, sur 1. Todo en `vessel_sdf.json` → `grupos`.

**Pasillos recolocados:**

| pasillo | A | B |
|---|---|---|
| Y12 | recto, 4 × 3 (11 tiles), gate a 0,5 del eje del host y 1,5 del de la isla; no se logró alinear moviendo ni encogiendo | recto (13 tiles); la isla 17 + X1 se encogió 1 unidad y quedó a 0,5 de su eje |
| Y13 | recto, 4 × 2 (8 tiles), corrido 3 tiles del lugar reflejado de Y12 (gate a 4,5 del eje de la isla; no se logró alinear) | recorrido con giros de **2 × 2** (4 tiles, el original medía 4 de ancho) |
| Y14 / Y15 | recto, 4 × 2 (8 tiles), a 0,5 del eje | igual |
| X9 | recorrido con giros 4 × 4 (16 tiles; el original era un tramo horizontal de 7 × 4) | recto horizontal, 8 tiles, a 2,5 del eje del host |

Ninguna isla se movió (0 desplazamientos). Encogimientos adoptados: ninguno en A; en B, hub 17 + X1 1 unidad.

**Error de espejo** (tiles que no coinciden entre un lado y el reflejo del otro; original → A / B): hub 23 ↔ 24 9 → 40 / 72; 17 + X1 ↔ 18 + X2 5 → 14 / 23; 19 ↔ 20 10 → 10 / 10; X5 ↔ X6 96 → 273 / 246; Y12 ↔ Y13 2 → 15 / 13; Y14 ↔ Y15 0 → 0 / 0; X0 consigo mismo 10 → 16 / 18; X3 12 → 26 / 16; X4 6 → 6 / 6; hub 25 8 → 26 / 6. Y10 contra grupo 11 (no son espejo) 89 → 235 / 204.

## Qué no calzó con la predicción de [R]

- **Pase externo del modo A «sobre todo hubs 23 y 24 y la banda»:** crece la banda (X5 +208, X6 +74, X4 +72) y el grupo 11 (+110); los hubs 23 y 24 casi no crecen en el pase externo (0 y +3) y sí en el interno (+113 y +125).
- **«Y10 y grupo 11 casi no crecen en el externo y sí en el interno»:** Y10 sí (0 → +89); el grupo 11 no (+110 en el externo, +125 en el interno).
- **Zona gris «a menos de la mitad»:** bajó mucho más, de 920 a 13 (A) y a 1 (B).
- **Modo B «llena más gris que A, pero deforma los rooms junto al borde»:** llena más (1 contra 13) y X0, X3 y hub 24 crecen ×3,2–3,5; X3 pasa de 8 × 10 a 24 × 16 y X0 de 24 × 8 a 52 × 14 (`B_final.png`).
- **Bloque norte (A) «17 + X1 y 18 + X2 crecen sobre todo hacia los lados y X0 hacia el norte»:** X1 y X2 crecen sobre todo al norte (6 tiles) y 17 y 18 crecen hacia el lado libre del borde (17 al oeste 5, 18 al este 6); X0 crece 4 al norte y 2 + 2 a los lados.
- **Islas «19 y 20 crecen sobre todo hacia el sur»:** crecen 1 columna cada una hacia el centro (19 al este, 20 al oeste) y nada al sur; el sur lo ocuparon hub 23 y hub 24 en la etapa interna.
- **«Al menos una isla tiene que encogerse para alinear su gate»:** en A ninguna logró alinearse encogiendo o moviéndose (se probó hasta 6 unidades en 17 + X1, 18 + X2 e isla 25); en B hub 17 + X1 se encogió 1 unidad y alineó Y12.
- **Error de espejo «cerca de 0 en los pares, salvo junto a las patas»:** Y14 ↔ Y15 queda en 0 y 19 ↔ 20 en 10; hub 23 ↔ 24 (40 / 72) y la banda X5 ↔ X6 (273 / 246 tiles) son mucho más asimétricos que antes: el grupo 11 ocupa el espacio que en el lado izquierdo toma X5.
- **Cosas que dependieron de mis lecturas:** las islas reservadas en su sitio durante las etapas 1 a 3; dejar que los rooms toquen pilares y gates; soltar las colas de menos de 3 unidades; la posición ideal de cada pasillo; la silueta incluye lo que ya era suelo del borde.
- **Fuera de lo pedido:** Y13 en B pasó de ancho 4 a 2, y X9 en A es un recorrido con giros en vez de un tramo recto, porque ahí no cabía uno recto con el muro mínimo de 2 unidades a cada lado.

## Archivos (en `pp2/vessel_sdf/`)

`extraccion.png`, `vinculos.json`; modo A: `A_1_herradura_ext.png`, `A_2_herradura_int.png`, `A_3_norte.png`, `A_4_islas.png`, `A_5_final.png`; modo B: `B_1_todo_a_la_vez.png`, `B_2_islas.png`, `B_final.png`; `reconocimiento_A.png`, `reconocimiento_B.png`, `gris_A.png`, `gris_B.png`; `guias_comparacion/A/` y `guias_comparacion/B/` (`pack_grupos.png`, `pack_gates.png`, `guia.json`); `vessel_sdf.json`; `HASHES_vessel_sdf.txt`; este informe.

Para aquí: escala ×2, alturas y banda alta van en otros pasos.
