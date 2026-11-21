# Hipótesis por tipo de escenario (modo 3)

Escrito por [R] el 2026-11-20 para el hito de [U] (A542): generar tipos de escenario (llanura, bosque, ciudad, montaña, interior, mazmorra) antes de cerrar la verticalidad. Es papel: no hay código nuevo detrás de este documento.

## Regla de uso (la medida, no una alarma)

1. **Todo ítem de un brief cita una hipótesis (H1–H6) y su criterio de descarte.** Si un ítem no la cita, [U] lo rechaza sin leerlo. Es una comprobación que hace [U], no [R].
2. **El criterio de descarte se fija aquí, antes de probar.** Si el resultado lo cumple, la hipótesis se cambia o se descarta; **no se ajustan parámetros para salvarla**. Ese ajuste fue el bucle del lego.
3. **Como máximo dos pasadas por hipótesis.** A la tercera, la hipótesis se congela y se pasa a otra.
4. **Toda recomendación de [R] cita la línea de código, el archivo o el número que la sostiene.** Si no lo tiene, dice «sin leer».

Leyenda: **hecho** = regla construida y mergeada; **falta** = no construido; **Construible: sí / no / con condición**.

## H1 · Llanura / plaza

- **Afirmación.** Una llanura es una sala sobre 1–2 terrazas con una plataforma grande y casi toda visible (un salón, no un callejón, A580). La meta queda al fondo sobre una tarima con escalera, y el borde es bajo o agua.
- **Dato.** r21 con 3 terrazas (Default) se lee como plaza en P3 (#121). La llanura de Aurhea (M3b, agua bloqueada, sin planos sobre el agua). `golden_door` (Shrine of Plains).
- **Referencias.** OT2 `12` (plaza con escaleras al agua), `16` (plaza, escaleras gemelas, fuente, calco en el suelo); DQ3 `aurheas_fountain`, `forest_plains`.
- **Hecho.** Rasgos 1–6 de la BRÚJULA (orientación, planos, cierre, marco, meta al fondo, escala); micro-escalones (F6: sirven en llanuras).
- **Falta.**
  - Rasgo 7, la tarima con escalera (deuda M6). Construible: sí.
  - La proporción visible/oculta por plataforma: la copia de `platforms.js` ya guarda `trimmedTiles`, pero nada la calcula. Construible: sí.
- **Descarte.** Se descarta si en la toma emparejada con Aurhea la plaza no se reconoce sin explicación ([U] mira), o si para leerse necesita billboards por encima del 30 % (regla de composición a).

## H2 · Bosque

- **Afirmación.** Un bosque es terreno de llanura más tres cosas: una capa P de masas oscuras en las esquinas, árboles sueltos como billboards (permitidos, regla b) y terrazas de piedra en el camino.
- **Dato.** `forest_a` y `forest_b` (M3a): árboles no bloqueados, torre como masa elevada. La máscara `vegetation` existe en el pack y no se usa.
- **Referencias.** OT2 `02` (muelle, masa oscura en la esquina como P) y `08` (el mismo lugar, terrazas de piedra).
- **Hecho.** Rasgos 1–6, objetos S4a, volúmenes S4b, capa P a mano (M4c-1).
- **Falta.**
  - Árboles leídos desde la máscara `vegetation`. Construible: sí.
  - La capa P de esquina como regla, no a mano. Construible: con condición, porque necesita la dirección de la cámara por sala (C1, hecho).
- **Descarte.** Se descarta si, con los árboles dentro del presupuesto de 30 %, la toma no se lee como bosque. En ese caso los árboles tienen que ser volúmenes y la hipótesis cambia.

## H3 · Montaña / colina escalonada

- **Afirmación.** Una montaña es la familia A, una banda que sube: frente bajo, fondo alto, tramos de escalera a lo largo de los muros de contención. Termina en la familia B, el mirador en la cima. **La verticalidad sale del terreno (7–9 terrazas), no del lego** (congelado).
- **Dato.**
  - P3: con 7–9 terrazas, 66–78 % de las salas Default pisan 3 o más terrazas (consolidación §E).
  - **r16 no sirve**: es una sala de 64 baldosas, no caminable. El lugar se elige por medición: una sala caminable (≥ 100 baldosas) sobre ≥ 3 terrazas, con Default y 7–9 terrazas (`tools/p3_places.js` más el filtro de caminable). **Sin elegir todavía.**
- **Referencias.** OT2 `v11`/`v12` (tres terrazas apiladas, tramos laterales), `v15` (muro con escaleras en zigzag), `v19`/`v20` (mesa, mirador), `11` (picos, niebla).
- **Hecho.** Terrazas elegibles en el modo 3 (#119), escaleras alargadas P7 (#131), vecinos como marco detrás y a los lados (#122), dolly (#127).
- **Falta.**
  - La escalera larga que cruza franjas angostas (E.5, A+2 = 0 en todo el dato). Construible: con condición, porque una escalera que cruza dos terrazas necesita un diseño propio.
  - La regla de vecinos delante (H6 la mide).
- **Descarte.** Se descarta si la sala elegida, sin lego, no muestra al menos dos bandas visibles a la vez en k4 con Cam 6 (el contador de bandas de `lego2_measure.js`), o si el héroe queda tapado por su propia base en k0–k8.

## H4 · Ciudad / cañón

- **Afirmación.** Una ciudad son calles (transiciones entre salas) entre manzanas cerradas. Las fachadas son los muros de las salas Ascension y los volúmenes S4b sobre baldosas bloqueadas, con escaleras en el eje de la calle.
- **Dato.** **No hay ningún mapa de ciudad.** DAC da salas Ascension (41 de 88 en Balanced) que se cierran con muros; es lo más parecido a una manzana, pero es un sustituto, no un dato de ciudad.
- **Referencias.** OT2 `04`, `13`–`15` (calle de noche, escaleras en el eje), `10` (pueblo en un cañón), `v10` (terraza redonda con muro de contención), `v16`–`v18` (muralla, camino sobre el muro), `19` (valla borrosa delante).
- **Hecho.** Muros Ascension con corte bajo hacia la cámara, volúmenes S4b, planos C2.
- **Falta.** Un mapa de origen: un mapa viejo de pueblo de DQ3 anotado como Aurhea o el bosque. Construible: con condición, porque depende de que [U] elija y capture el mapa.
- **Descarte.** Se descarta si, con salas Ascension como manzanas, la calle no se distingue del interior de la manzana. En ese caso la ciudad necesita su propio dato y queda en espera.

## H5 · Interior

- **Afirmación.** Un interior es una sola sala cerrada por muros, con el muro frontal cortado (cutaway). Es un hub simétrico en el eje, con la meta al fondo y una alfombra como calco. Suelo, muros y pilares son geometría, nunca billboards (regla b).
- **Dato.**
  - `throne_aliahan` (commit 1: nave caminable de 624 baldosas, orientación, planos y props encendidos).
  - El Diorama 31 se ve como interior (F9).
  - `golden_throne` es la degeneración D1 y **no se imita**: 81 % de billboards.
- **Referencias.** OT2 `03`, `05`–`07` (cutaway desde fuera y entrando), `09` (sala de juicio, simétrica, balaustrada delante), `20` (biblioteca, escalera grande, alfombra), `v05` (galería entre arcos).
- **Hecho.** Orientación tipo hub, planos (muro trasero), props (antorchas, pilares), calco de cinta (ribbon), corte bajo de muros (Zelda).
- **Falta.** Nada de construcción: lo que figuraba aquí **ya existe en main** (corrección de la pasada H5-1, `stage_h5_interior_go.md` §1.3).
  - Los muros laterales del salón como volúmenes de `throne_aliahan` (commit 2): **hecho**, `src/modes.js` L232–238 (6 pilares y 3 muros `wall`).
  - El corte del muro frontal como regla: **hecho**, `planes` baja el FRENTE (`src/s3/planes.js` L48, `if (!T.noFront)`; fila 12 de `map1.txt`).
- **Descarte.** Lo reemplazan los criterios D1–D3 de `research/octopath2/stage_h5_interior_go.md` (§0), fijados antes de medir: D1 presencia del cutaway por regla en < 2/3 de las salas Ascension (H5 cambia: el corte pasa a ser dato declarado); D2 necesidad: si «sin altura» y «sin muros ni pilares» no pierden contra TECHO en ≥ 2/3 de las posiciones, según [U], y la masa alta M no cae ≥ 50 %, el 3D es solo piso (H5 se descarta como composición); D3 fallas: billboards > 30 % o héroe tapado en TECHO paran la pasada.

## H6 · Mazmorra

- **Afirmación.** Una mazmorra es una cadena de salas DAC (DAC ya es un generador de mazmorras). Las salas medias, más altas, son miradores (A572). Las salas del fondo, más bajas, son hojas o callejones separados por un hueco de al menos 2,14 × Δ (Cam 6, 25°) y unidos por pasillos alargados o puentes.
- **Dato.**
  - Tu ejemplo de 3 × 3 salas.
  - Q4 (#130): con el criterio estricto, 0 de 32 pares pueden alejarse sin tocar otra sala, y el control «solo salas delante» no cambió nada visible en r21, r16 ni r79.
  - Q3 (#129): con 7–9 terrazas no hay plataformas de flujo.
- **Referencias.** OT2 `17` (puerta con luces naranjas, balaustrada), `18` (celda, barrotes, baranda delante), Infernal Castle `0052`–`0078` (puente largo en el eje, pilares gemelos, braseros), `v07`/`v08` (cueva, puente arriba, antorchas abajo).
- **Hecho.** Cadena de salas (modo 2), Diorama movido con puente (U18/U20), muros Ascension, tipo de flujo por sala (Q3: Leaf / Corridor / Hub).
- **Falta.**
  - El hueco de DQ3 con la variante de puente sobre el vacío, solo para salas Leaf. Construible: con condición: necesita espacio libre detrás o un puente; Q4 dice que con alejamiento puro no cabe.
  - Una sala de partida en la que de verdad haya una vecina más alta delante. Hay que elegirla por medición, con la tabla de pares de Q4 (`shots/q4/pares.json`).
- **Descarte.** Se descarta si, en un par medido donde la sala de atrás es Leaf y más baja, ni el hueco ni el puente dejan ver al héroe en la sala de atrás desde la entrada. En ese caso la mazmorra usa el corte DAC (Quebrada) y H6 cambia.

## Orden propuesto

H5 (interior) y H1 (llanura) primero: tienen dato y les falta lo menos. Después H2 (bosque), H6 (mazmorra), H3 (montaña, falta elegir el lugar) y al final H4 (ciudad, falta el dato). Lo decide [U].
