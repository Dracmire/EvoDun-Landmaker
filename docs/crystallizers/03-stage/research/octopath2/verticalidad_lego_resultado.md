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
