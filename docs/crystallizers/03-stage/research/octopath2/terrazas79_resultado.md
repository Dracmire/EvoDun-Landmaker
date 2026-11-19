# Terrazas 3 / 7 / 8 / 9, escaleras y borde híbrido (pasada «terrazas79»)

Rama `feat/stage-t79`, brief `stage_terrazas79_go.md` (commit 76f15cc). Datos en `docs/crystallizers/03-stage/shots/terrazas79/` (`terrazas79_*.json`, `t79_crecimiento.json`, `t79_parte0_datos.json`) y capturas en el mismo directorio. Herramientas: `tools/terrazas79.js` (parte 1), `tools/ui/t79_caps.js` (capturas de la parte 1), `tools/ui/t79_growth.js` (parte 2), `tools/ui/t79_shots.js` y `tools/ui/t79_edge_shots.js` con `tools/lego3_sheets.py` (láminas de las partes 0 y 3). Sin veredicto: [U] y [R] sacan las hipótesis.

La rama sale de `feat/stage-lego3` (#112) porque `main` todavía no la tiene y las partes 0 y 3 dependen de ella; cuando #112 entre, la base del PR pasa a `main`.

## Parte 0 · Correcciones de la pasada 3

### Escaleras (A545): lo que se pudo y lo que no

- **Se quitó el cambio de la pasada 3**: la escalera de una sala con lego **vuelve a ser `steps`** (peldaños como geometría), con los mismos peldaños que en Mid y la altura estirada por L2' (la mirada de la pasada 2 que [U] juzgó «bastante bien»). Se acabó la rampa de 1 baldosa (u1) y la losa crema (u2). `E.s3.lego.adjustP` ya no toca el estilo ni la profundidad.
- **No se construyó «mitad de profundidad y m veces más contrahuellas como geometría».** En el modelo de baldosas un peldaño es **una baldosa = un nivel**; más contrahuellas en menos baldosas pide peldaños de menos de una baldosa, es decir un **clon del renderizador de peldaños** (`render.js`, ~cientos de líneas de la pasada de rampa y de los pasos por banda) a `src/s3/`. No cabía en el presupuesto y no lo intenté a medias. Hoy el salto m·E lo cubren los mismos peldaños con contrahuella m veces mayor.
- **Qué falta para hacerlo:** una versión de `src/s3/` del dibujo de peldaños que parta cada baldosa de una escalera en 2·m peldaños (altura quantizada en la baldosa, sin niveles nuevos), con el mismo orden de pintado por bandas que la rampa.

### Cake Scale (A543)

Regla de [U]: la huella de Scale sobre la terraza alta ≤ la de Mid. Hecho **sin cambiar los anillos de sitio**: Scale ya no reconstruye la forma con más capas; `lego.apply` re-altura **las mismas baldosas de anillo** de los enlaces de la sala, cada anillo **m veces más alto** desde su ancla (bol: desde la cima del núcleo hacia arriba; pirámide: desde la plataforma hacia abajo), que es lo que deja el salto m·E (comprobado: m·r ≤ la nueva distancia). Por construcción la huella es **exactamente** la de Mid; no hizo falta construir anillos hacia afuera ni «menos y más altos». Rest = los anillos no se re-alturan.

| u2 (DAC 29, terraza alta = 3) | Mid | Rest | Scale |
|---|---|---|---|
| baldosas de anillo (todas las de la sala y su entorno) | 207 | 207 | 207 |
| **baldosas de anillo sobre la terraza alta** | **164** | **164** | **164** |
| baldosas de anillo re-alturadas por lego | 0 | 0 | 33 |

(La suma de alturas de anillo de Mid y Rest difiere porque los planos de L4 mueven los anillos que caen fuera de la sala; Scale suma más que Rest.) La pasada 3 (capas × m) pasaba de 207 a 269 baldosas de anillo; en ese momento no medí cuántas caían sobre la terraza alta. Ahora son las mismas 207 por construcción.

Láminas re-sacadas: `lamina_perfil_u1_cam6.png` (Mid | lego) y `lamina_perfil_u2_cam6.png` (Mid | Rest | Scale), k0 / k4 / k8.

## Parte 1 · DAC con 3, 7, 8 y 9 terrazas («Balanced types» y «Default»), solo datos

Mapa real, capa de salas con los parámetros del preset y solo las terrazas cambiadas (control = 3 con «Balanced types»; «Default» = 7, 8, 9). Las ventanas de una sala se construyen una por una (como las ve el modo 3). Una sala «en un cúmulo» = vecina de otra con ≥ 2 terrazas de diferencia; terraza de una sala = la más frecuente entre sus baldosas caminables. **Valle** = una sala cuyas vecinas están todas ≥ 2 terrazas más arriba; **cima** = el inverso.

| Caso | Salas | Cake / Diorama / Ascensión | Rampas | Caminable principal (% del suelo) | Caminable total (%) | Regiones aisladas (baldosas) | Problemas de borde | Grupos de la capa (el mayor, nº de grupos) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced 3 | 88 | 29 / 18 / 41 | 47 | 70.4 | 74.6 | 220 (1654) | 5 | 107, 4 |
| Balanced 7 | 88 | 38 / 12 / 38 | 87 | 23 | 62.6 | 421 (5258) | 29 | 115, 9 |
| Balanced 8 | 88 | 32 / 11 / 45 | 66 | 6.9 | 55.1 | 612 (7496) | 68 | 74, 12 |
| Balanced 9 | 88 | 17 / 13 / 58 | 38 | 5.1 | 48.3 | 796 (9900) | 75 | 45, 20 |
| Default 7 | 32 | 30 / 1 / 1 | 157 | 20.4 | 67.1 | 478 (3639) | 27 | 229, 10 |
| Default 8 | 32 | 30 / 0 / 2 | 177 | 8.9 | 60.7 | 628 (5298) | 39 | 276, 16 |
| Default 9 | 32 | 15 / 5 / 12 | 74 | 5.2 | 49.5 | 894 (9290) | 73 | 120, 40 |

| Caso | Ventana de una sala: 1 / 2 / 3+ terrazas (%) | Cúmulos (grupos / pares con dif. ≥ 2 / dif. máxima) | Tamaños de los grupos | Valles | Cimas | A+2 caras / A+3 caras |
| --- | --- | --- | --- | --- | --- | --- |
| Balanced 3 | 70.5 / 25 / 4.5 | 0 / 0 / 0 | - | 0 | 0 | 0 / 0 |
| Balanced 7 | 67 / 15.9 / 17 | 6 / 41 / 3 | 14, 10, 9, 3, 3 | 0 | 1 | 0 / 0 |
| Balanced 8 | 68.2 / 14.8 / 17 | 4 / 64 / 4 | 38, 11, 6, 2 | 1 | 1 | 0 / 0 |
| Balanced 9 | 69.3 / 14.8 / 15.9 | 2 / 73 / 5 | 38, 24 | 1 | 1 | 0 / 0 |
| Default 7 | 9.4 / 21.9 / 68.8 | 4 / 17 / 2 | 7, 5, 3, 3 | 1 | 0 | 0 / 0 |
| Default 8 | 3.1 / 18.8 / 78.1 | 2 / 25 / 3 | 19, 7 | 2 | 0 | 0 / 0 |
| Default 9 | 9.4 / 25 / 65.6 | 1 / 31 / 4 | 26 | 3 | 0 | 0 / 0 |

**Valles y cimas** (sala, tipo, terraza, área en H², largo × ancho en H, salas vecinas):

- Balanced 3: valles → ninguno. Cimas → ninguna.
- Balanced 7: valles → ninguno. Cimas → sala 24 (Ascension, terraza 6, 10.7 H², 5.3 × 3.3 H, 3 vecinas).
- Balanced 8: valles → sala 12 (Ascension, terraza 3, 31.6 H², 10 × 9.3 H, 3 vecinas). Cimas → sala 10 (Ascension, terraza 7, 13.8 H², 5.3 × 4.7 H, 5 vecinas).
- Balanced 9: valles → sala 79 (Cake, terraza 2, 301.3 H², 35.3 × 33.3 H, 8 vecinas). Cimas → sala 46 (Ascension, terraza 8, 8 H², 4 × 4 H, 6 vecinas).
- Default 7: valles → sala 4 (Cake, terraza 3, 37.8 H², 9.3 × 8 H, 2 vecinas). Cimas → ninguna.
- Default 8: valles → sala 30 (Cake, terraza 3, 1031.6 H², 54 × 48 H, 6 vecinas); sala 4 (Cake, terraza 3, 29.3 H², 8 × 8 H, 2 vecinas). Cimas → ninguna.
- Default 9: valles → sala 30 (Cake, terraza 3, 1010.2 H², 50.7 × 48.7 H, 6 vecinas); sala 21 (Cake, terraza 4, 160.9 H², 22.7 × 18 H, 3 vecinas); sala 16 (Ascension, terraza 3, 7.1 H², 12 × 3.3 H, 2 vecinas). Cimas → ninguna.

**Capturas** (`shots/terrazas79/`): `mapa_balanced{3,7,8,9}_cam5.png` y `mapa_default{7,8,9}_cam5.png` (mapa completo en Cam 5; la capa de alturas con los niveles coloreados por terraza, sin la capa de salas, con `minPlateau` 120 / 5 de cada preset; las terrazas son las mismas) y, para 9 terrazas «Balanced types», el mayor valle (**sala 79**, Cake) y la mayor cima (**sala 46**, Ascensión) en el modo 3, Cam 6: `valle79_{mid,up,down}_cam6.png` y `cima46_{mid,up,down}_cam6.png`.
Dato de esas dos ventanas: la 79 pisa 2 terrazas (m = 2, un salto de 3,75: Up y Down aplican); la **46 es una ventana de una terraza** (m = 3, lego de sub-niveles: no cambia terrazas).

## Parte 2 · Crecimiento en pantalla de la terraza destino (solo mide; la cámara no se tocó)

Terraza destino = la más alta de la sala (en `perfil_m1`, de una sola terraza, el sub-nivel más alto). Se mide en el buffer de selección de Box (baldosas visibles de esa terraza): área en px, ancho horizontal, **px por H = √(área / baldosas visibles) × baldosas por H** (un promedio sobre las baldosas visibles), y la caja de los *props* (landmark y pilares). Seguimiento «apagado» = se encuadra en k0 con el seguimiento y se congela; solo se mueve el héroe.

| Ejemplo, cámara, seguimiento | Área k0 → k4 → k8 (px) | px por H k0 → k8 | Altura de la caja de props k0 → k4 → k8 (px) |
|---|---|---|---|
| M1, Cam 6, ON | 156 047 → 184 551 → 158 635 (+2 %) | 34,8 → 44,4 (**+28 %**) | 77 → 104 → 209 |
| M1, Cam 6, OFF | constante | 34,8 (0 %) | 77 → 93 → 141 |
| M1, Cam 8, ON | 110 599 → 110 599 → 117 304 (+6 %) | 31,8 → 31,6 (−1 %) | 106 → 129 → 204 |
| u1, Cam 6, ON | 118 260 → 118 260 → 185 115 (+57 %) | 45,6 → 57,3 (**+26 %**) | 96 → 117 → 209 |
| u1, Cam 8, ON | 139 660 → 139 660 → 138 776 (−1 %) | 50,1 → 50,0 (0 %) | 128 → 154 → 221 |
| u2, Cam 6, ON | 64 429 → 71 039 → 114 346 (+77 %) | 44,9 → 59,8 (**+33 %**) | 95 → 125 → 224 |
| u2, Cam 8, ON | 86 513 → 85 943 → 81 181 (−6 %) | 52,0 → 50,4 (−3 %) | 127 → 162 → 232 |
| u1 / u2, Cam 6 / Cam 8, OFF | constante | constante | 96 → 117 → 149 (u1 Cam 6), 127 → 163 → 240 (u2 Cam 8) |

(El ancho de la terraza destino llena casi todo el panel, 840–1000 px de 1000: no sirve como medida de crecimiento. Los datos completos por k, también con el héroe en px, están en `t79_crecimiento.json`.)

**Lectura (datos, sin cambiar nada):**
- **Cam 6, seguimiento encendido:** la escala de la terraza destino crece **26–33 %** de k0 a k8 (M1 28, u1 26, u2 33), en el borde de la lectura de [U] (33–40 %) solo en u2. El área en píxeles sube más (hasta +77 %) pero mezcla la oclusión y la parte de la terraza que entra en el panel.
- **Cam 8:** la escala queda **plana (−3 % a 0)**: la compresión de profundidad (`zScale` 0,5) aplana el degradado de escala entre filas, así que acercarse no agranda la terraza.
- **Seguimiento apagado:** nada crece (la cámara está congelada y la terraza no se mueve en pantalla); la caja de los props crece porque el héroe sí se mueve.
- **Qué parámetro lo controla:** `heroFrac` (0,10 en estos ejemplos) fija la escala del pivote: `st.zoom = sg.scale(panelH, heroFrac, tilesPerH…)` es **constante durante el recorrido** (zoom 1,82 / 1,66 / 1,51 en Cam 6, ver el JSON). La cámara **no se acerca** (la distancia del dolly `D` sale de esa escala y tampoco cambia) y el seguimiento mueve el pivote 1:1 con el héroe (recortado por la caja de la ventana, sin tasa ni suavizado). Lo único que agranda la terraza es el **degradado de perspectiva** de Cam 6 (la escala del suelo en la fila de abajo / la de arriba = 3,70): a medida que el pivote sube hacia la terraza, ella baja en el panel y su escala crece hasta como mucho ese cociente, limitado por la distancia que recorre el héroe en la sala. Con `heroFrac` fijo, un 33–40 % exige más recorrido de profundidad o más pitch, o que el pivote se acerque (dolly), que la cámara de hoy no hace.

## Parte 3 · Borde híbrido (A547)

- **Qué es:** selector del modo 3 «Edge style» **Square** (por defecto) / **Hybrid** (`st.stage.edge`, termina con la sesión de ventana). Square no llama a nada nuevo: el lienzo es el de Box, **byte a byte** (comprobado por hash tras alternar). Hybrid usa un id de técnica nuevo, `'Ah'`, de **DAC3** (`src/s3/hybrid.js`): traza el contorno de cada nivel exacto por baldosas con el trazador compartido `E.maskLoops`, clasifica cada tramo por su normal hacia afuera contra la dirección de la vista (el yaw de la sala) y deja **cuadrado** el tramo que mira a la cámara (ángulo < 45° con −v) y **suaviza con Chaikin** (`P.smooth`) los demás; los extremos de cada tramo cuadrado y los vértices a 2 baldosas de una escalera o rampa quedan fijos (sin grietas, huella rígida).
- **Clonado de `tech.js`:** `chaikin` y la lógica de huella rígida; el trazado compartido (`E.maskLoops`) se usa tal cual. `E.loopsOf` se **envuelve** solo para el id `'Ah'` (cualquier otro id va a la función original). El único cambio en código compartido (`ui.js`) es que el rótulo de la figura acepta un id de técnica sin botón (`'Hybrid edge'`).
- **Cómo se ve (leído en la lámina):** el frente de las plataformas queda cuadrado y las esquinas del fondo y los lados se redondean; como Hybrid dibuja por losas de nivel (la forma de A), **las paredes aparecen con bandas horizontales por nivel** y hay muchos más polígonos que Box (u1: 2205 → 178 polígonos y 557 → 1798 paredes). Los picks, la visibilidad del héroe y los props siguen usando la geometría de Box.
- **Láminas** Square | Hybrid (k0 / k4 / k8, Cam 6): `lamina_perfil_{u1,u2,m1,s1,l1}_cam6_edge.png` y `lamina_perfil_u1_cam7_edge.png` (u2 con Rest, el selector por defecto).
- **No está hecho:** Hybrid con yaw que no es múltiplo de 90 (la rotación con arrastre sí lo recalcula por clave de caché, pero la regla de 45° se probó en múltiplos de 90); Cam 8 (se probó Cam 6 y Cam 7).

## Qué no corrió

- `test_window_session_ui` (regla). El `regress --sample 1/4` se corrió porque el diff toca `ui.js`, `modes.js` y `controls.js` (las guardas del modo 3 y el rótulo de técnica): 0 diferencias en las imágenes que le tocaron; es una muestra, no el pase completo.
- Escaleras con peldaños de menos de una baldosa (parte 0): no construidas, ver arriba.
- Cam 5 con la capa de salas encendida y tinte por tipo en el mapa completo: las capturas son de la capa de alturas sin salas.
