# Perfiles de forma · mockups M1, M2, M3 y control C0 (Parte B) y resumen de T1 / T2

Brief: `stage_perfiles_mockup_go.md` (commit 1527ddf), `perfiles_forma.md`, `MODELO_ACTUAL.md` v2.4. **No hay jueces ni rúbricas: juzga [U] mirando.** Los datos crudos de cada paso: `perfiles_pasos.json`; la clasificación de las 88 salas: `perfiles_clasificacion.md` (Parte A); las capturas k0, k4 y k8 de los cuatro: `../../shots/perfiles/`.

## 1. Resumen

- **T2 (medida, Parte A): se cumple.** 49 de las 88 salas (56 %) no entran en ningún perfil P1–P4; 35 entran en P3/P4, 4 en P2 y **ninguna en P1**. Detalle y matriz en `perfiles_clasificacion.md`.
- **Los tres mockups y el control están construidos** como ejemplos declarados del modo 3 (`perfil_m1`, `perfil_m2`, `perfil_m3`, `perfil_c0` en `src/modes.js`), todos con las reglas de la Base v2.4 encendidas y los mismos controles. T1 la juzga [U] mirando las capturas (la tesis dice «las tres celdas ✓ se acercan a 2D-HD, el control no»).
- **Tres cosas que el pedido daba por hechas y no salieron como se esperaba:**
  1. **DAC 14 no es P1 según la tabla.** Su extensión de través es 16,3 H (> 12 H) y su ancho medio 5,7 H (en el hueco 5–6 H). El pedido lo llama «ya funcionó en v329» y se usó tal cual, con sus medidas reales.
  2. **No hay ningún Diorama P1 con la clasificación estricta** (con la lectura alternativa del ancho medio de la Parte A, la sala 80, un Diorama X de 12,7 × 19,3 H y ancho medio 5,0 H, sería P1: queda como candidata si [U] prefiere esa lectura). Se aplicó el caso previsto, la reducción a mano de un Diorama; **la reducción dejó el largo en 16,0 H (≤ una toma de 17 H)**, así que por la tabla estricta M2 «construido» es «ninguno» por el largo, con ancho medio 3,9 H ≈ 4 H.
  3. **Cam 6 por defecto tiene hoy un tope cercano** (el borde inferior de la pantalla no pasa el borde cercano de la ventana, `E.stage.clamp`): en M1 y M3, de ventana chica, el héroe crece hacia el sur (M1 hasta 0,144, M3 hasta 0,151 con fy 1,03 en k0). No es bloqueo suave nuevo (esa regla está en espera, A493): es lo que ya hace el visor. En M3 el héroe parte con los pies **fuera del cuadro por abajo** (fy 1,03).

## 2. Los mockups (declarados, mapa de origen y reglas ON: regla de composición (c))

**Mapa de origen:** el mapa real `skeleton_heightmap_256.png` con «Balanced types» (terrazas 3, núcleo 100, radio 5, minPlateau 120: 88 salas). **Base v2.4 en los cuatro:** Cam 6 (sin bloqueo suave, sin perfiles de cámara), `tilesPerH` 1,5, heroFrac 0,10, terraza 1,25 H (1,875 tiles; «Measures in H» apagado), `subs` 2, `orient`, `planes` y `props` **sin antorchas** (el campo `torches: false`, A470 / A471; queda la meta). `pre` y escalones de `dac_stage`.

Cada pieza dice si la pone **una regla del visor** o va **declarada a mano** (datos escritos por `tools/ui/perfiles_declare.js` a partir de la sala; el visor no la calcula):

| Pieza | M1 | M2 | M3 | C0 |
|---|---|---|---|---|
| Dirección, yaw, caminata, meta | regla (`orient`, `props`) | regla | regla | regla |
| Muros / columnas / frente de `planes` | regla | regla | regla | regla |
| Marco del tipo DAC | **regla**: muros de Ascensión (135 caras en 6 cadenas, altura 1,5) | **regla**: pocket del Diorama (la sala como fragmento sobre el mundo) | **regla**: anillos del Cake (cuenco; 67 tiles de anillo, 3 niveles añadidos, según el visor) | ninguno (el control no lleva marco) |
| Recinto del perfil (masas de 4 H a los lados) | **a mano**: `volumes`, 189 tiles | **a mano**: `volumes`, 172 tiles | **a mano**: `volumes`, 136 tiles | ninguno (sin perfil) |
| Reducción del caminable | no | **a mano**: `blocked`, 119 tiles de la sala 30 bloqueados (banda de −4…+4 tiles alrededor del eje: ancho medio 3,9 H) | no | no |
| Calcomanía C3 (aro + hexagrama, tenue, color del piso, ≈ 6 H) en k4 | a mano (`ribbon`, 6,0 H) | a mano (`ribbon`, **4,0 H**: el corredor mide 4 H en esa fila; A471 marca 4–6 tiles como ilegible) | a mano (6,0 H) | a mano (6,0 H) |

La reducción de M2 y las masas son **diseño de nivel declarado como mockup (A496), nunca una regla**; el código solo añadió cuatro campos opcionales de ejemplo (`terHH`, `cake` / `ascWalls`, `blocked`, `torches: false`), apagados por defecto: con ellos ausentes el visor es el de hoy (tabla de hashes de 21 estados idéntica).

**Hoja de origen top-down (relieve dentro de la sala, sin elevar el POI):** no se inventó relieve. Lo que traen los datos con `subs` 2: M1 **0,28 H** (2 niveles: 30 de 340 tiles a un nivel más bajo, un peldaño de ≈ 0,275 H); M2 **1,52 H** (4 niveles tras la reducción; la sala trae terrazas dentro); M3 **0,28 H** (2 niveles: 8 de 115 tiles); C0 **1,52 H** (7 niveles). M1 y M3 tienen casi nada de relieve: **las marcas de perspectiva por sub-niveles son pobres en esas dos salas** y no se les añadió nada. La meta (landmark de `props`) está donde la regla la pone, en la terraza más alta de la mitad del fondo; ningún volumen se levanta sobre tiles caminables (el POI no se eleva).

## 3. Tabla por mockup (dimensiones en H, perfil, vacío, billboards, recinto)

Medido por `tools/ui/perfiles_walk.js` en el viewer real, 1280 × 760, Cam 6. **Vacío %** = píxeles del cuadro con el color del fondo vacío (`E.BG_COLORS` ±4). **Billboards %** = píxeles del cuadro que cambian al quitar los billboards declarados y los props (el héroe, la cinta y los volúmenes se quedan). **Recinto visible** = tiles bloqueados no vacíos a ≤ 8 tiles de lo caminable de la sala (masas, volúmenes, planos, anillos, otras salas) con al menos un píxel visible en el render de ids, y el % de la pantalla que cubren. Ningún mockup supera el 30 % de billboards (máximo medido 2,7 %).

| Mockup | Sala (tipo, dirección) | Largo × ancho (H) | Ancho medio (H) | Perfil | Relieve dentro de la sala | Vacío % (k4 · máx k0–k8) | Billboards % (k4 · máx) | Héroe (k4) | Recinto visible en k4 |
|---|---|---|---|---|---|---|---|---|---|
| M1 · Ascensión × P1 · DAC 14 | 14 (Ascension, Z) | 26.4 × 16.3 | 5.7 | DAC 14 queda «ninguno» por la tabla (extensión 16,3 H > 12); con ancho medio 5,7 H cae en el hueco 5–6 H | 0.28 H en 2 niveles | 1.2 % · 9.6 % | 1.0 % · 2.4 % | 9.9 %, fy 0.54 | 275 de 999 tiles (40.1 % de la pantalla) |
| M2 · Diorama × P1 · Diorama 30 reducido a mano | 30 (Diorama, Z) | 16.0 × 7.3 | 3.9 | extensión 7,3 H: P2 por ancho, pero largo 16,0 H ≤ 1 toma → «ninguno» estricto; ancho medio 3,9 H ≈ 4 H (forma P1) | 1.52 H en 4 niveles | 6.9 % · 19.7 % | 1.3 % · 2.5 % | 9.9 %, fy 0.54 | 565 de 1088 tiles (64.6 % de la pantalla) |
| M3 · Cake × P3 · Cake 19 | 19 (Cake, Hub) | 10.1 × 9.5 | 5.1 | P3/P4 (cabe en una toma, 10,1 × 9,5 H) | 0.28 H en 2 niveles | 4.2 % · 4.2 % | 2.7 % · 2.7 % | 11.7 %, fy 0.71 | 466 de 905 tiles (49.4 % de la pantalla) |
| C0 · control · DAC 44 | 44 (Cake, Z) | 63.1 × 41.5 | 13.3 | ninguno (63,1 × 41,5 H, 61 H de profundidad) | 1.52 H en 7 niveles | 10.2 % · 14.6 % | 0.1 % · 2.5 % | 9.9 %, fy 0.54 | 374 de 1105 tiles (8.8 % de la pantalla) |

## 4. Lo que sí y lo que no cumple la Base (B15, B11)

- **Héroe ± 5 % (B15):** M2 y C0 constantes en 0,099 salvo C0 k0 (0,117, el tope cercano). M1 y M3 **no cumplen** en los pasos del sur: M1 0,144 en k0, M3 0,151 en k0 (el tope cercano de la ventana chica, ver §1).
- **Vacío ≤ 2 % (B11):** solo **M1 lo cumple en k0–k4** (0,3–1,2 %); en k5–k8 sube a 2,6–9,6 %. M2 (7–20 %), M3 (4,2 %) y C0 (0,3–14,6 %) **no lo cumplen**. El cierre del fondo no se pidió construirlo más allá de lo que da `planes` y el recinto; no se tocó.
- **Billboards ≤ 30 %:** cumplen todos (máximo 2,7 %).
- **Recinto en k4:** C0 muestra el 8,8 % de la pantalla con geometría de recinto (solo `planes`); los tres mockups, 40–65 %. El recinto ocupa mucho de la pantalla porque las masas de 4 H se pegan a la sala.

## 5. Qué no se hizo o no se pudo

- **P4 (Hub deep, fondo lejano) no se separa de P3** en la clasificación: sus dimensiones son las mismas y el criterio (un fondo o hito lejano visible detrás) no sale de las dimensiones. M3 se clasificó P3/P4 por tamaño; no tiene sub-cámara deep (A493: en espera).
- **M1 no es un P1 medido**, y **M2 «construido» tampoco** (largo ≤ 1 toma); el pedido pedía M2 «≈ 4 H alrededor de su eje»: se cumplió el ancho medio (3,9 H) y se perdió largo. Para tener 17 H de largo con 4 H de ancho habría que tallar una sala que no existe en el dato (pedido al generador, A496).
- **No se probó T1** (juzga [U]); no hay jueces, rúbricas ni comparación con Octopath.
- **Cake 19 se eligió por tamaño** (10,1 × 9,5 H, cabe entera con margen y sin señal de límite); las otras salas Cake P3 son 28 (8,5 × 10,3), 29 (16,5 × 13,5) y 52 (17,0 × 15,9), estas dos a menos del 10 % del borde de la toma. Todas tienen un solo vínculo «cuenco» (Down); no hay un Cake P3 con pirámide.
- **Diorama 30 se eligió** como el más angosto de los que tienen largo de más de una toma y dirección Z / X (11,3 H de extensión; los otros candidatos: 25, 3,0 H de ancho pero 5,1 H de largo y 18 tiles; 80, X de 12,7 H con ancho medio 5,0 H, que con el ancho medio sería P1 en la lectura alternativa de la Parte A).
- No se miden las alturas de las masas contra una toma (4 H es la cifra de «pilares de pasillo 3,7–5 H» de la Base §3).
- Sin `regress --sample 1/4` (ver §6).

## 6. Carril y segundos

Todo en esta máquina (4 núcleos, headless Chromium); un proceso a la vez salvo los dos de hashes (en paralelo).

| Comando | Resultado | Segundos |
|---|---|---|
| `node tools/test_modes.js`, `node tools/test_controls.js` | pasan (6 modos, 117 entradas) | < 1 cada uno |
| `node tools/test_props.js` (tocado: `noTorches`) | 17 passed, 0 failed (la primera pasada falló 2: un error mío, un comentario que se comió una línea de `props.js`; corregido, ver el commit) | 3 |
| `node tools/test_stage_cam.js`, `test_planes.js`, `test_orient.js` | 62 / 19 / 23 passed, 0 failed | < 1 / 42 / 11 |
| `tools/ui/test_stage_orient_ui.js` | 15 passed, 0 failed | 26 |
| `tools/ui/test_stage_planes_ui.js` | 14 passed, 0 failed | 13 |
| `tools/ui/test_perfiles_ui.js` (NUEVO: los cuatro ejemplos, terreno de la Base, marco por tipo, sin antorchas, la reducción de M2, fin de sesión y sin fuga a `dac_stage`) | 7 passed, 0 failed | 10 |
| `tools/ui/test_stage_props_ui.js` (extra: `props.js` tocado) | 13 passed, 0 failed | 15 |
| `tools/ui/test_window_session_ui.js` (extra: `winEnter` / `winExit` tocados) | 30 passed, 0 failed | 1177 |
| tabla de hashes `tools/ui/m2_hashes.js` (21 estados apagados), árbol nuevo contra 1527ddf | **IDÉNTICA** (21 / 21), 0 errores de página (la primera pasada difirió por el error de `props.js` de arriba; con la corrección, idéntica) | 39 por árbol |
| Parte A `tools/perfiles_clasificacion.js` (88 salas, una ventana de una sala cada una) | 88 salas, 29 / 18 / 41 | 54–61 |
| la caminata `tools/ui/perfiles_walk.js` (4 mockups, k0…k8, 12 capturas) | 0 errores de página | 49 |

**No corrió:** `regress --sample 1/4` (el cambio en `src/ui.js` queda protegido por `st.win`, `stageOn()` y el modo 3, y la tabla de hashes de los estados apagados es idéntica; no toca Cam 1–8 ni los modos 1, 2 y 4), `test_modes_ui.js` y `test_modes_leak_ui.js` (el registro de modos no cambia: solo cuatro ejemplos y dos listas de datos), el pase completo y el `verifier`.

## 7. Apéndice: tablas por paso

### Caminata k0…k8 (hacia la meta, por el camino de `props`)

**M1 · Ascensión × P1 · DAC 14** (camino de 45 tiles; tile de cada paso en coordenadas de ventana)

| paso | tile | héroe | fy | vacío | billboards | recinto visible (tiles) | recinto (pantalla) |
|---|---|---|---|---|---|---|---|
| k0 | (38, 25) | 14.4 % | 0.96 | 0.3 % | 0.7 % | 322 / 999 | 45.4 % |
| k1 | (40, 29) | 12.1 % | 0.75 | 0.3 % | 0.7 % | 322 / 999 | 45.4 % |
| k2 | (39, 33) | 10.5 % | 0.60 | 0.3 % | 0.7 % | 322 / 999 | 45.4 % |
| k3 | (37, 37) | 9.9 % | 0.54 | 0.7 % | 0.7 % | 295 / 999 | 42.4 % |
| k4 | (39, 40) | 9.9 % | 0.54 | 1.2 % | 1.0 % | 275 / 999 | 40.1 % |
| k5 | (39, 44) | 9.9 % | 0.54 | 2.6 % | 1.8 % | 225 / 999 | 33.1 % |
| k6 | (36, 46) | 9.9 % | 0.54 | 4.6 % | 2.1 % | 181 / 999 | 27.7 % |
| k7 | (35, 47) | 9.9 % | 0.54 | 6.2 % | 2.3 % | 175 / 999 | 24.9 % |
| k8 | (38, 49) | 9.9 % | 0.54 | 9.6 % | 2.4 % | 156 / 999 | 21.3 % |

**M2 · Diorama × P1 · Diorama 30 reducido a mano** (camino de 25 tiles; tile de cada paso en coordenadas de ventana)

| paso | tile | héroe | fy | vacío | billboards | recinto visible (tiles) | recinto (pantalla) |
|---|---|---|---|---|---|---|---|
| k0 | (29, 47) | 9.9 % | 0.54 | 7.3 % | 0.0 % | 634 / 1088 | 60.2 % |
| k1 | (32, 47) | 9.9 % | 0.54 | 6.8 % | 0.0 % | 628 / 1088 | 62.3 % |
| k2 | (33, 45) | 9.9 % | 0.54 | 6.7 % | 0.8 % | 617 / 1088 | 62.4 % |
| k3 | (35, 44) | 9.9 % | 0.54 | 6.7 % | 1.0 % | 580 / 1088 | 63.1 % |
| k4 | (37, 45) | 9.9 % | 0.54 | 6.9 % | 1.3 % | 565 / 1088 | 64.6 % |
| k5 | (39, 44) | 9.9 % | 0.54 | 8.4 % | 1.7 % | 514 / 1088 | 64.3 % |
| k6 | (42, 44) | 9.9 % | 0.54 | 11.2 % | 2.3 % | 445 / 1088 | 62.9 % |
| k7 | (43, 46) | 9.9 % | 0.54 | 12.5 % | 2.5 % | 386 / 1088 | 59.2 % |
| k8 | (44, 48) | 9.9 % | 0.54 | 19.7 % | 2.3 % | 427 / 1088 | 52.3 % |

**M3 · Cake × P3 · Cake 19** (camino de 15 tiles; tile de cada paso en coordenadas de ventana)

| paso | tile | héroe | fy | vacío | billboards | recinto visible (tiles) | recinto (pantalla) |
|---|---|---|---|---|---|---|---|
| k0 | (30, 47) | 15.1 % | 1.03 | 4.2 % | 1.7 % | 466 / 905 | 49.4 % |
| k1 | (31, 46) | 14.4 % | 0.96 | 4.2 % | 1.8 % | 466 / 905 | 49.4 % |
| k2 | (31, 44) | 13.2 % | 0.85 | 4.2 % | 2.2 % | 466 / 905 | 49.4 % |
| k3 | (31, 43) | 12.6 % | 0.80 | 4.2 % | 2.4 % | 466 / 905 | 49.4 % |
| k4 | (31, 41) | 11.7 % | 0.71 | 4.2 % | 2.7 % | 466 / 905 | 49.4 % |
| k5 | (32, 40) | 11.2 % | 0.67 | 4.2 % | 2.7 % | 466 / 905 | 49.4 % |
| k6 | (31, 39) | 10.9 % | 0.63 | 4.2 % | 2.7 % | 466 / 905 | 49.4 % |
| k7 | (31, 38) | 10.5 % | 0.60 | 4.2 % | 2.6 % | 466 / 905 | 49.4 % |
| k8 | (30, 37) | 10.1 % | 0.57 | 4.2 % | 2.6 % | 466 / 905 | 49.4 % |

**C0 · control · DAC 44** (camino de 146 tiles; tile de cada paso en coordenadas de ventana)

| paso | tile | héroe | fy | vacío | billboards | recinto visible (tiles) | recinto (pantalla) |
|---|---|---|---|---|---|---|---|
| k0 | (131, 7) | 11.7 % | 0.71 | 13.7 % | 0.0 % | 450 / 1105 | 28.6 % |
| k1 | (122, 14) | 9.9 % | 0.54 | 8.0 % | 0.0 % | 450 / 1105 | 21.4 % |
| k2 | (117, 11) | 9.9 % | 0.54 | 14.6 % | 0.0 % | 255 / 1105 | 17.8 % |
| k3 | (100, 12) | 9.9 % | 0.54 | 8.3 % | 0.0 % | 349 / 1105 | 14.6 % |
| k4 | (88, 11) | 9.9 % | 0.54 | 10.2 % | 0.1 % | 374 / 1105 | 8.8 % |
| k5 | (76, 15) | 9.9 % | 0.54 | 10.0 % | 0.4 % | 394 / 1105 | 10.6 % |
| k6 | (68, 21) | 9.9 % | 0.54 | 0.3 % | 0.5 % | 399 / 1105 | 18.4 % |
| k7 | (56, 25) | 9.9 % | 0.54 | 0.9 % | 0.9 % | 376 / 1105 | 24.7 % |
| k8 | (47, 16) | 9.9 % | 0.54 | 4.2 % | 2.5 % | 228 / 1105 | 24.5 % |

