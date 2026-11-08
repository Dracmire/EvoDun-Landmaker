# BRÚJULA del modo 3 (2D-HD) — leer antes de cada paso

Documento vivo. Se actualiza solo con decisión del usuario [U]. Última revisión: 2026-11-08 (v166). Plan detallado: `claude/MVP_viewer_2dhd.md` (tras M0, copia en el repo: `docs/crystallizers/03-stage/MVP.md`).

## Norte (qué es «terminado»)
Un **mapa viejo** (16-bit) cargado en el viewer se convierte por reglas a 2D-HD y se parece a su **remake** en la toma emparejada (método DQ3: conservar la disposición, reescalar, agregar relieve). Las mismas reglas corren sobre DAC, que aporta salas en cadena. El viewer es la casa: se generan y se miran muchos modelos; 1 de cada ~100 va a Unity.

## Rasgos (corpus DQ3 SFC ↔ HD-2D, `rpg16_corpus_catalog.md`)
| Rasgo | Corpus | Estado (regla hecha, solo sobre DAC) |
|---|---|---|
| 1 Orientación: eje hacia la meta | C2 | ✅ C1 |
| 2 Planos: fondo alto / frente bajo | C3, C4 | ✅ C2, P1 |
| 3 Cierre: el vacío nunca se ve | C10 | ✅ C2, P1 |
| 4 Marco lateral (pilares, columnas) | C6 | ✅ C2, P1 |
| 5 Meta al fondo | C2 | ✅ C3 |
| 6 Escala del héroe | — | ✅ S1 |
| 7 Ribete → tarima con escalera | C5 | ⚠ DEUDA: **M6**, lo antes posible (v165) |
| 8 Agua alrededor del POI → pocket | C7 | ◐ (Diorama de DAC); sobre mapa viejo, ⚠ DEUDA: **M6** (v165) |
| — Utilería | C8 | vestido congelado (v51); solo ranuras |
Ningún rasgo está probado todavía sobre un mapa viejo ni contra un remake.
Alcance de M3 [R, v158; ACEPTADO por [U] 2026-11-08 04:18, opción A, «hagámoslo por partes»]: un mapa viejo no trae relieve. En M3 el relieve sale de una ANOTACIÓN (zonas del zooning de v53 + alturas supuestas), así que M3 prueba las reglas de render (rasgos 1–6) sobre un mapa viejo anotado, no la conversión automática del Norte.
**DEUDA RECONOCIDA (v165, [U] 04:18: «debe normalizarse lo antes posible»):** la división por partes deja fuera la mitad del Norte. Hasta cerrar **M6** (relieve automático desde el trazado: rasgos 7 y 8) el Norte está a medias: el visor aplica las reglas sobre un mapa viejo ANOTADO a mano, no sobre un mapa viejo crudo. M6 NO es pulido ni post-MVP: va justo después de M5 y antes de cualquier pulido; si un paso anterior termina antes de lo previsto, M6 se adelanta. M3b (colores del mapa viejo → agua, península, rocas) es la semilla de M6.

## Secuencia MVP (v150; plan aprobado por [U] 14:29, con el ajuste de archivos en el repo)
| # | Paso | Por qué en este orden |
|---|---|---|
| M0 | Material al repo: plan, brújula y par de referencia (PR de docs y datos) | No volver a subir archivos [U]; no depende de código. |
| M1 | Carril rápido de verificación, escrito en `CLAUDE.md` (PR de docs) | Todo lo demás va más rápido; hoy `CLAUDE.md` lo contradice. |
| M2 | Modo 3 independiente de la fuente (zonas de DAC o del rol `zone` de PNG + roles; selector de cualquier sala; retirar listas a mano) | Habilita el mapa viejo y mirar muchos casos. |
| M3 | M3a Forest (corrida técnica, juicio por rasgos) y M3b Aurhea's Fountain ↔ pond_peninsula (juez real, pocket C7; [U] confirmó 04:13 que es el mismo lugar), desde `refs/` del repo | Mapas viejos primero (v24); decisión C [U] 17:37. |
| M4 | Toma emparejada + gate (par M3 + 2 salas de DAC) | El juez (v85). |
| M5 | Guardar / recargar el modelo elegido | Elegir 1 de 100 y volver. |
| M6 ⚠ | **Relieve automático desde el trazado** (rasgos 7 y 8: C5 ribete → tarima con escalera; C7 agua alrededor del POI → pocket), sobre mapa viejo SIN anotar | Cierra la deuda de la división de M3 (v165, [U] 04:18: «lo antes posible»). Sin esto el Norte está a medias. |
Después: funciones post-MVP y pase de pulido (lista en `claude/MVP_viewer_2dhd.md`). **M6 va antes de todo eso.**

Parado: P2, G1. Hecho y reusado: S1–S4c, C1–C3, P1 (#58–#69).

## Material de referencia
Subido por [U] el 2026-11-07 15:14 a `docs/crystallizers/03-stage/` (39 imágenes, 27,7 MB, commit 534ee28 en main). M0 las ordena con `git mv` en `docs/crystallizers/03-stage/refs/dq3/{old,remake,pairs,other}/` + `forest_plains/` (par de M3: `old/forest.png` ↔ mapa «Shrine of the Plains» y 3 capturas de juego). Índice en `refs/dq3/index.md`. Originales intactos, solo lo necesario, no reemplazar PNG grandes, nunca dentro de `dist/`. Los tests del carril rápido usan fixture sintético; solo M3 y M4 leen el par real. NO VERIFICADO: si el repo es público (ver riesgos del plan).

## Carril de verificación
- PR del modo 3: tests afectados + capturas + tabla de hashes de canvas antes/después (interruptores apagados, modos 1 y 2). `regress` solo si el diff toca código compartido con los modos 1, 2 o 4 (lista en `CLAUDE.md`) y en la pasada completa. Sin pasada completa ni verifier por PR. Tests lentos en paralelo y en segundo plano; corregir primero los tests que afirman sobre lo que el PR cambia.
- Pasada completa: en un hito del MVP, una vez por semana, o cuando [U] lo pida. Código compartido con los modos 1, 2 o 4: se suman los tests de ese código (`--only`), no la pasada completa.
- Vive en `CLAUDE.md` (M1); mientras no esté ahí, cada pedido a CC lo repite y prevalece sobre la línea del verifier.
- Sin mutaciones para constantes de hipótesis.
- Revisión: capturas primero; después solo tests de nodo afectados.

## Reglas para no perder el camino
1. Cada PR declara qué rasgo o paso del MVP avanza y sobre qué fuente (mapa viejo / DAC).
2. El juez es la toma emparejada contra el remake o la referencia, no un mock propio.
3. Ningún paso ni rasgo se quita, reordena o reinterpreta sin decisión [U] anotada aquí.
4. Si una regla del repo choca con un rasgo, se para y se pregunta.
5. Un detalle que no impide un rasgo va al pulido.
6. Ningún PR afina la apariencia de una pieza: se decide dónde va, no cómo se ve (v51).
7. El parecido se juzga en muchas salas y en más de una fuente.
8. Antes de cambiar el orden del plan, releer v24, v51, v64, v85, `MVP_viewer_2dhd.md` y esta brújula.

## Registro de decisiones del camino
- 2026-11-08 [U] 04:13: #75 (M3c) MERGEADO en main (3254a02) antes de que el pedido del commit 3 llegara a CC: no se deshace; el signo canónico del eje pasa a un PR aparte (`stage-m3-canon`) y el Paso 0 de M2c va después (pedido reeditado, v164). [U] confirma que Aurhea's Fountain y `pond_peninsula` son el mismo lugar: M3b queda sin esa traba. [U]: el repo es PÚBLICO por ahora y pasará a privado (riesgo de las imágenes de referencia en un repo público: ver v164). Sigue pendiente de [U] aceptar el alcance de M3 (relieve por anotación, no automático).
- 2026-11-08 [R] 04:0x: M3c entregado por CC (PR #75, 2 commits, borrador, base main 268c732 con #74 ya mergeado) y revisado (v163). VERIFICADO por mí: tests de nodo (orient 19, props 17, forest_roles 25, stage_zones 9, fields 72), hashes de canvas main vs PR en 22 claves sin diferencias, capturas de control idénticas píxel a píxel; solo cambian [talud este] y [valle, talud este] con el héroe en la última zona. Decisiones [R]: zona 6 de B al 21,2 % = INFO; solo la última zona usa POI; commit 3 con signo canónico en la rama degenerada del eje (0 de 9 salas de DAC y 1 de 22 zonas de Forest caen ahí). Siguiente: Paso 0 de M2c (el usuario aún no puede elegir ventanas en el visor).
- 2026-11-08 [R] 03:3x: Paso 0 «meta desde POI» de CC revisado (v162); [U] lo ejecutó (acepta el reorden: M3c antes de M2c). Eje y meta de una sala suelta salen de la geometría (`orient.js:25-35`, `props.js`); el eje de un valle llano se invierte con retoques mínimos (rama degenerada, sin histéresis). Decisiones [R]: regla «POI de mayor valor en la última zona → meta y eje», sin interruptor propio, POI A (19, 11) → (19, 12) (el tile (19, 11) es una muesca fuera de la huella; la puerta se alcanza desde el talud este), ventana de ruta = valle + talud este, estabilidad del valle solo se mide. Pedido: `stage_m3_poi_goal_go.md`.
- 2026-11-08 [R] 03:0x: M3a entregado por CC (PR #74, 4 commits, en borrador, src/stage.js intacto) y revisado (v161). VERIFICADO por mí: test de nodo 17 PASS; hashes de canvas main vs PR en 22 claves, 0 diferencias. Hallazgo [R]: las reglas del modo 3 NO leen `poi`: la meta y el eje de una sala suelta salen de la geometría y cambian de lado con un retoque mínimo de los datos (valle A: yaw 270 → 90, meta de x=47 a x=8). En un mapa viejo la meta real (puerta de la torre, salida B) no manda. Propuesta pendiente de [U]: paso 0 «meta desde POI» antes de M3b/M4 (reordena el plan: decisión de [U], regla 3). Alturas A vs B se juzgan en M4, no ahora.
- 2026-11-08 [R] 00:5x: PR #74 (M3a commit 1) revisado (v160): `src/` intacto, rejilla v53 reproducida por CC con 0 diferencias. La regla de la huella (>20 % de descarte en el talud) se arregla en los DATOS, no en `stage.js`: zona = componente conexo (≥ 10 tiles, hipótesis [R]; los menores se funden con el vecino de más borde). Árboles NO bloqueados en M3a (retiro mi default [R]: fragmentan el valle −28 % y el talud −67 % y no hacen falta para los rasgos 1–6); sin `masks.water`; `subs` en `ui.js` sí (ejemplos A y B). POI A pasa de la torre a (19, 11), delante de la puerta. Falta que [U] mire A (casi plano) vs B (legible) en las capturas.
- 2026-10-29 [U]: corpus primero, DAC aparcado (v24).
- 2026-10-31: v87 [R] recomendé «DAC primero» en el viewer; desde ahí solo DAC (error de orden, v148).
- 2026-11-06 [U]: desviación detectada (v138); paso 0, rama A; C1–C3 (v141–v145).
- 2026-11-07: P1 (v146). [U] «¿por qué antorchas?» → P2 parado (v147).
- 2026-11-07 [U]: viewer = casa; mapas viejos primero; verificación demasiado lenta (v148).
- 2026-11-08 [R] 12:3x: #76 (signo canónico, rama `stage-m3-canon`, 1dcbd50, borrador) y Paso 0 de M2c entregados por CC y revisados (v166). VERIFICADO por mí: `src/` solo `orient.js` +3 −3; tests de node PASS (orient 23, forest_roles 27, zones 9, props 17, planes 13); hashes main contra el PR: 22 claves, 0 diferencias; `dist/viewer.html` 6 líneas. Hallazgo: el corte del signo no desaparece, se mueve de 0° a −11,5° (barrido de ángulos); el valle A (≈ −1,7°) queda a ~10°. M2c: opción 2 (lista propia «Window», no los chips), aviso de zonas no vecinas en la propia lista, ids CRUDOS para la ventana de M5, `WIN_MAX` 12 [R]; pedido `stage_m3_m2c_go.md` (2 commits: zonas, luego salas de DAC). [U] 12:04: el PR de docs que sincroniza `MVP.md` y `BRUJULA.md` del repo lo hago yo.
- 2026-11-08 [U] 04:18 «ok, A, hagamos por partes, pero déjalo como parte de tus notas y del plan, esta división, anota que debe normalizarse lo antes posible» (v165): ACEPTADA la opción A para M3 (reglas de render sobre mapas viejos anotados; el relieve automático no entra en M3). La división queda como DEUDA RECONOCIDA: se crea **M6** (rasgos 7 y 8 desde el trazado) justo después de M5, antes del pulido, con prioridad «lo antes posible». Hasta M6 el Norte está a medias. M3b alimenta M6 (agua y península salen del color del mapa viejo; solo las alturas siguen siendo hipótesis).
- 2026-11-07 [U] 14:22 «ok, pero primero consolida»: consolidación + MVP M1–M5 + pulido (v149, `MVP_viewer_2dhd.md`).
- 2026-11-07 [U] 14:29: los archivos viejos se guardan en el repo para no re-subirlos; el resto del plan aprobado; se agrega M0 (v150).
- 2026-11-07 [U] 23:44: #72 (M1, con mini-delta) y #73 (M2a+M2b) MERGEADOS en main (e3ff74c; verificado en el repo). El pedido de M3a se pegó pero CC respondió repitiendo el informe del Paso 0: no hay rama ni PR de M3a. Pedido reeditado con cabecera «construcción, no Paso 0» (v159).
- 2026-11-07 23:1x: delta de M1 hecho por CC (PR #72, d6bea67; revisado, v158). M3a Paso 0 de CC revisado: la zonificación v53 NO estaba en el repo pero sí en el Project; su receta se reproduce con los archivos de `refs/` (ids y tamaños de componentes idénticos; 5 zonas). El diagnóstico de la sala 17: los objetos de `dac_stage` están fijados a la yaw 180 y la regla de visibilidad de S4a los oculta con la yaw 0 de orient; se deja como legado hasta M2d. Pedido M3a preparado con defaults [R] (×2, árboles bloqueados, alturas A/B); necesita #73 mergeado antes.
- 2026-11-07 [U] 22:2x: «voy con el prompt del Delta M1»: `regress` pasa de cada PR a disparador (v156). M2a+M2b entregados por CC como PR #73 en borrador (revisado en v157; merge pendiente de [U]). M2 costó 86 min de verificación (secuencial, repeticiones evitables): regla de paralelo y de corregir primero los tests que afirman sobre lo que cambia.
- 2026-11-07 [U] 17:37: opción C para el par (M3a Forest como corrida técnica, M3b Aurhea como juez real). [U] preguntó por M1: no estaba cerrado; `CLAUDE.md` (verifier antes de reportar) contradecía el carril rápido, que solo vivía en mis prompts. M1 pasa a PR de docs antes de M2 (v155).
- 2026-11-07 17:32: M2 Paso 0 de CC revisado (v154). M2 = M2a accesor de zonas + M2b fuente PNG (un PR, dos commits), M2c selector, M2d retirar listas a mano (último). P2 sigue parado: #70 cerrado por [U] 15:51, rama `stage-p2` viva para el pulido. #69 en main.
- 2026-11-07 [U] 15:25: las imágenes ya están en `docs/crystallizers/03-stage/` (rips viejos, capturas del remake, comparaciones). M0 pasa a ordenarlas con `git mv` (v151).
