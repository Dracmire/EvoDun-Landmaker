# Verticalidad tipo lego en DAC3 (T4): resultado de la construcción

Rama `feat/stage-lego`, brief `stage_lego_go.md` (commit 6fda683), diseño `verticalidad_lego.md` §7 y §7b (L2'). Todo lo medido sale de `tools/test_lego.js`, `tools/lego_rooms.js` y `tools/ui/lego_measure.js`; las capturas y el JSON están en `docs/crystallizers/03-stage/shots/lego/`. Lo que no está medido no se afirma.

## 1. Qué se construyó

- `src/s3/lego.js` (`E.s3.lego`, solo DAC3): L2' por terraza. m = la terraza base de la sala (la más baja que pisa lo caminable, 1–3); E = `P.terH`. **Up:** cada salto entre terrazas caminables de la sala mide m·E (la más baja queda). **Down:** la más alta queda y las demás caen m·E por salto. **Mid:** no llama a nada (byte a byte). Los `subs` no cambian; las alturas entre terrazas (niveles puente de `steps`, extremos de una rampa) se estiran linealmente entre el último sub-nivel de una terraza y la base de la siguiente, así que escaleras y rampas siguen uniendo las mismas terrazas (la rampa se empina: su profundidad es fija).
- Mecanismo: las baldosas caminables de la sala pasan a niveles nuevos con `E.s3.roomTypes.insertLevels` (el del clon); `S.block`, `S.void`, `S.region`, `S.roomMap`, la lista de escaleras y el conjunto caminable no se tocan.
- L4: `lego.apply` corre **antes** de `E.planes.apply`, así que el fondo de `planes` (`wallH` = 3 H) se apoya sobre la nueva cima: en Up queda a 2,40 E sobre lo más alto de la sala. En Down `E.s3.lego.scenery` baja el muro de fondo a m·E **por debajo** de la cima (143 baldosas en L1). Todo geometría, nada de billboards. `src/planes.js` no se editó.
- L6: si una terraza más alta queda más cerca de la cámara que una más baja, `yawFlip` dice si el yaw opuesto las ordena bien. El visor aplica ese giro una vez por sala (`st.stage.legoFlip`, se limpia al cambiar el tratamiento o al cerrar la sesión de ventana). Si ninguno sirve: `conflict`, sin forzar.
- UI: selector «Height treatment» (Auto / Down / Mid / Up), campo de ejemplo `heightTreatment`, termina con la sesión de ventana. Declarados: `perfil_m1` y `perfil_m3` = up, `perfil_c0` = mid, y un ejemplo nuevo `perfil_l1` = down.
- **Cam 7 (D-L4):** en el modo 3 (con la orientación por sala) usa el yaw de la sala, el mismo que Cam 6; en los demás modos queda en yaw 0 (`baseYaw()` solo cambia si `orientOn()`). No se tocó Cam 1, 3, 5 ni 6 (yaws medidos 45, −45, 0, 0 en el modo 1).

**Diorama elegido para Down: sala 7 de «Balanced types» (Cima).** De los dos anfitriones que nombra `PROTOS` (7 = Cima, 20 = Mirador) es el único que pisa **dos** terrazas (2 y 3, m = 2); la 20 pisa una sola y L2' no le cambia nada.

## 2. Topología y Mid

- Hash de `S.block`, `S.void`, `S.region`, `S.roomMap` y las escaleras, antes y después de Up y de Down: **idéntico** en las 4 salas multi-terraza probadas (44, 7, 30, 6) y en L1 en el visor. Conjunto caminable igual.
- Mid y tratamiento ausente: hash de `fine`, `levelH`, `levelMeta` y la topología idéntico, 0 baldosas movidas. Tabla de 21 estados s3 (los 20 de antes + `perfil_l1`) y los 21 de `m2_hashes`: los previos **idénticos**.
- Saltos medidos (nuevas alturas): m·E = 3,750 en Up (3,747 en Down: `insertLevels` empuja 0,003 si la altura coincide con un nivel); la terraza baja (Up) o la alta (Down) queda donde estaba.

## 3. Medidas por ejemplo (k0 / k4 / k8, Cam 6 y Cam 7; Mid → tratamiento)

ρ = Spearman de las baldosas caminables visibles (altura contra profundidad de vista); «alt. rel.» = parte de las caminables visibles por debajo del héroe; oclusores = caminables más altas que el héroe y más cerca de la cámara.

| Ejemplo (yaw) | Sala | Resultado |
|---|---|---|
| M1 (180), M3 (0) | 14 y 19, **una sola terraza** | `single`, 0 baldosas movidas: ρ, altura relativa y oclusores **iguales** con Mid y con Up en las 12 medidas de cada una (M1 k4 Cam 6: ρ 0,10 → 0,10; M3: 0,21 → 0,21) |
| L1, Down (270 tras L6) | 7 (Cima), terrazas 2–3, m = 2, 1 salto de 3,75 (2 E), 937 baldosas, 5 niveles nuevos | Cam 6: ρ 0,32→0,37 / **0,60→0,49** / 0,68→0,60; alt. rel. 0,32→0,32 / **0,00→0,00** / 0,89→0,91; oclusores 0→0 / **264→308** / 0→0. Cam 7: ρ 0,46→0,49 / −0,04→−0,06 / 0,79→0,79; oclusores 0 / 109→109 / 0 |
| C0 (90), control | 44 | sin tratamiento, 0 diferencias |

- La predicción de Up (ρ ≥ 0,6 y 0 oclusores en k4 en salas de ≥ 2 terrazas) **no se pudo probar en el visor**: ninguno de los dos ejemplos Up (M1, M3) pisa ≥ 2 terrazas. Sobre el nivel de nodo sí se cumplen los saltos m·E en las 4 salas multi-terraza (ver §2), pero ρ y oclusores solo se midieron en el visor en L1.
- **L1 (Down) no alcanza «altura relativa ≥ 0,8» en k4**: el héroe está en la terraza baja en k4 (0,00 también con Mid) y hay 308 baldosas caminables más altas por delante. En k8 (héroe arriba) la altura relativa sí es 0,91. El giro L6 se aplicó (yaw 90 → 270) y no basta: la regla L6 ordena las terrazas por su profundidad media, no por dónde está el héroe en cada paso del camino.
- Cam 7 con el yaw de la sala: el mismo yaw que Cam 6 en las cuatro salas (180, 0, 270, 90).

## 4. Las 88 salas de «Balanced types» (solo medir, `tools/lego_rooms.js`)

- **Una sola terraza: 35 de 88 (40 %)**; 51 pisan dos o tres; 2 sin baldosas caminables en el mapa completo. **La predicción «más de la mitad pisan una sola terraza» es falsa** (35/88). Por tipo: Cake 0 de 29, Diorama 7 de 18, Ascension 28 de 41.
- Distribución de m (88 salas con terrazas): m = 1: 16, m = 2: 68, m = 3: 2. En las 51 multi-terraza: m = 1: 16, m = 2: 35, m = 3: 0. Terrazas pisadas por sala: 0 → 2, 1 → 35, 2 → 41, 3 → 10.
- **Fronteras A+2 y A+3 entre salas: 0 y 0.** Con 3 terrazas, A+2 es la terraza 1 pegada a la 3: no hay ni una cara de 4-vecinos en el mapa (ni dentro de una sala). A+1 sirve de control: mi réplica de la regla de puertas da **369 grupos = los 369 de `E.s3.gateTransitions`**; entre salas distintas hay 65 pares con 100 caras, 25 grupos con puerta y 23 pares con puerta. Con la regla de dos terrazas no habría ninguna puerta nueva en este mapa y preset.

## 5. Qué no corrió / límites

- No se corrió `test_window_session_ui` (regla). `regress --sample 1/4:3` (3 de 22 bloques, 30 imágenes): 0 diferencias; no es el pase completo. Cam 7 en el modo 3 solo se verificó por yaw de la vista y por la medida en 4 salas, no con un test de painter contra z-buffer.
- «Bandas visibles» no se midió como número aparte (no hay un contador de bandas en `vert_measure`): las capturas de M1 y L1 (Mid / lego, k0 k4 k8, Cam 6 y Cam 7) están en `shots/lego/` para que [U] las juzgue.
- Una sala con terrazas no adyacentes (saltos de 2 terrazas) con m = 1 en Up se comprime a E por salto (la regla es literal: «cada salto mide m·E»). Si [U] no lo quiere, hay que cambiarlo en `L.newBases`.
- Los cortes en bandas (L2 y L3 originales) no se construyeron: quedan como opción, como dice §7b.

---

# Pasada 2 (PR `feat/stage-lego2`, brief `stage_lego2_go.md`, commit c2f229b)

Medido con `tools/lego_pick.js`, `tools/ui/lego2_measure.js` y `tools/lego_rooms.js [out] default`; los datos están en `shots/lego/` (`lego_pick_windows.json`, `lego2_medidas.json`, `lego_rooms_default5.json`).

## P2.0 Corrección a la pasada 1 (importante)

La pasada 1 contó las salas sobre la forma del **mapa completo** (35 de 88 en una sola terraza, 51 en 2 o 3). **El visor construye la sala como una ventana de una sola sala**, y ahí la cuenta es otra: **62 de 88 pisan una sola terraza (70 %), 26 pisan 2 o 3, 0 sin caminable** (`lego_pick_windows.json`; en la ventana varias salas pierden como no caminable la parte de otra terraza que en el mapa completo sí contaba). Por tanto **«más de la mitad de las 88 salas pisan una sola terraza» es verdadero en lo que el visor construye**, y L2' no cambia el 70 % de las salas. De las 26 multi-terraza, 19 suben al menos 0,5 terrazas a lo largo del camino de `props`. Las cifras de §4 de arriba (m, A+2/A+3) siguen siendo del mapa completo y se dejan como estaban.

## P2.1 Corrección de L2' (A531)

Un salto entre niveles caminables que cruza D terrazas mide **m·E·D** (`L.newBases` de `src/s3/lego.js`). Con D = 1 (los 4 casos reales de las salas probadas) no cambia nada respecto a la pasada 1; con D = 2 ya no se comprime (`tools/test_lego.js`, 4 pruebas nuevas sobre `newBases`: Up m = 1 con D = 2 da 2 E, Up m = 2 con terrazas 1, 2, 4 da 2 E y 4 E, Down m = 3 con D = 2 da 6 E y deja fija la más alta). Ningún ejemplo real de «Balanced types» tiene un salto con D = 2, así que la corrección está probada solo por la prueba unitaria.

## P2.2 Los dos ejemplos Up

Criterio: sala que pisa ≥ 2 terrazas **como ventana** y cuyo camino de `props` sube.

- **`perfil_u1` = DAC 1, Ascensión.** **No hay una Ascensión de pasillo (P1 / P2) que pise dos terrazas** en «Balanced types» (de las 11 Ascensiones multi-terraza del mapa completo, 10 son de una sola terraza como ventana; la 1 es la única que queda con dos). Se respeta el tipo y no el pasillo: es un Hub de 15,1 × 18,7 H (ancho medio 8 H, fuera de P1 y P2), terrazas 2–3, m = 2, el camino sube 0,78 terrazas. `ascWalls` activado como M1.
- **`perfil_u2` = DAC 29, Cake Hub P3.** 16,5 × 13,5 H (cabe en una toma), terrazas 2–3, m = 2, el camino sube 0,99 terrazas. `cake` activado como M3.
- Campos de la Base v2.4 como los `perfil_*`, sin reducción a mano, sin volúmenes. M1 y M3 quedan como estaban. Alternativa de pasillo que sí pisa dos terrazas y sube 1 terraza: el DAC 21 (Cake, Z, P2, terrazas 1–2, m = 1); no se declaró porque el brief pide dos ejemplos.

Topología: hash de `S.block`, `S.void`, `S.region`, `S.roomMap` y escaleras idéntico a Mid en u1 y u2 (UI), 137 y 108 baldosas movidas, un salto de 3,75 = m·E·D.

## P2.3 Medidas Up (k0 / k4 / k8, Mid → Up)

ρ = Spearman de las caminables visibles; oclusores = caminables más altas que el héroe y más cerca de la cámara; **bandas** = alturas distintas de las caminables visibles del pick buffer, agrupando las que difieren menos de 0,5 E (contador nuevo, `bands` en `lego2_medidas.json`).

| Ejemplo | Cam | k0 ρ · occ · bandas | k4 ρ · occ · bandas | k8 ρ · occ · bandas |
|---|---|---|---|---|
| u1 | 6 | 0,75→0,74 · 0→0 · 1→1 | 0,75→0,74 · **3→3** · 1→1 | 0,59→0,35 · 0→0 · 1→**2** |
| u1 | 7 | 0,56→0,55 · 0→0 · 1→1 | 0,72→0,68 · **3→3** · 1→1 | 0,25→0,01 · 0→0 · 2→2 |
| u2 | 6 | 0,87→0,87 · 0→0 · 1→1 | 0,87→0,87 · 0→0 · 1→1 | 0,89→0,89 · 0→0 · 1→1 |
| u2 | 7 | 0,24→0,24 · 0→0 · 2→2 | 0,86→0,84 · 0→0 · 1→1 | 0,61→0,60 · 0→0 · 1→**2** |

- **La predicción de Up falla.** ρ ≥ 0,6 en k4 se cumple en u1 y u2, pero **ya se cumplía con Mid** (0,75 y 0,87): Up no la sube (a veces la baja, u1 k8 Cam 6 0,59 → 0,35). 0 oclusores en k4: se cumple en u2 y **no en u1 (3 caminables, igual con Mid)**. **2–3 bandas visibles en k4: no** (1 en las dos salas y en las dos cámaras, igual que con Mid); las bandas 2 aparecen solo en k8 (u1 Cam 6, u2 Cam 7).
- Lectura de la medida (no se probó otra causa): con el héroe en la terraza baja en k0–k4, la terraza alta casi no entra entre las baldosas caminables visibles; el salto pasa de 1,875 a 3,75 pero eso no suma una banda visible a esa distancia. Lo que Up sí cambia es la altura del salto, no el número de alturas que se ven.

## P2.4 L1 (Down) separado en subida y cima (sin cambiar código)

«Cima» = el héroe pisa la terraza más alta de la sala (`heroTer = roomTer`); «subida» = no. En L1 son subida k0–k6 y cima k7–k8 en las dos cámaras.

| | Cam 6 (Mid → Down) | Cam 7 (Mid → Down) |
|---|---|---|
| **Subida, ρ** (k0…k6) | 0,32→0,37 · 0,45→0,40 · 0,49→0,41 · 0,55→0,43 · 0,60→0,49 · 0,63→0,58 · 0,64→0,61 | 0,46→0,49 · 0,12→0,20 · −0,01→0,11 · −0,02→−0,05 · −0,04→−0,06 · 0,61→0,56 · 0,51→0,42 |
| **Subida, oclusores** | 0, 0, 139→122, 179→190, **264→308**, 0, 19→19 | 0, 0, 83→67, 51→50, 109→109, 0, 23→23 |
| **Cima, altura relativa** (k7, k8) | 0,64→0,66 · **0,89→0,91** | 0,47→0,43 · 0,78→0,78 |

- **La subida no llega a ρ ≥ 0,6 con Down**: solo k5 y k6 de Cam 6 (0,58 y 0,61) están en el entorno; Down **baja** ρ respecto de Mid en casi toda la subida (el lado Down deja caer la terraza baja, lo contrario de una banda que sube). Los oclusores de k2–k4 (hasta 308) vienen de la terraza alta, que queda delante del héroe: es la forma de la sala, no de Down.
- **La cima llega a altura relativa ≥ 0,8 solo en k8 Cam 6 (0,91)**; k7 y Cam 7 quedan en 0,43–0,78.
- Lectura: Down se parece más a una atalaya en la cima que a una subida, pero no es el vaciado de una banda que sube: en la subida Down no ayuda a la familia A.

## P2.5 A+2 y A+3 con 5 terrazas (Default: núcleo 20, radio 9, minPlateau 5)

32 salas (31 Cake, 1 Ascensión), **todas pisan 2–5 terrazas** (a 5 terrazas ninguna es de una terraza). Control A+1: 746 grupos = los 746 de `gateTransitions`; entre salas hay 64 pares con 138 caras, 44 grupos con puerta y 33 pares con puerta. **A+2: 0 pares, 0 caras, 0 grupos con puerta; A+3: 0.** **La predicción «A+2 > 0 con menos del 5 %» falla: es 0**, igual que con 3 terrazas. La preparación de terrazas deja siempre un escalón de una terraza entre dos terrazas vecinas; construir uniones A+2 no tendría dónde apoyarse en este mapa.

## P2.6 Qué no corrió

Sin `regress` (el diff toca `src/s3/lego.js`, `src/modes.js` y herramientas; `ui.js` no cambió); sin `test_window_session_ui`. Los hashes de los 21 estados s3 previos y los 21 de `m2_hashes` son idénticos; hay 2 estados nuevos (`perfil_u1`, `perfil_u2`).
