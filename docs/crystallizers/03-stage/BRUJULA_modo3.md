# BRÚJULA del modo 3 (2D-HD) — leer antes de cada paso

Documento vivo. Se actualiza solo con decisión del usuario [U]. Última revisión: 2026-11-07 (v151). Plan detallado: `claude/MVP_viewer_2dhd.md` (tras M0, copia en el repo: `docs/crystallizers/03-stage/MVP.md`).

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
| 7 Ribete → tarima con escalera | C5 | post-MVP |
| 8 Agua alrededor del POI → pocket | C7 | ◐ (Diorama de DAC) |
| — Utilería | C8 | vestido congelado (v51); solo ranuras |
Ningún rasgo está probado todavía sobre un mapa viejo ni contra un remake.

## Secuencia MVP (v150; plan aprobado por [U] 14:29, con el ajuste de archivos en el repo)
| # | Paso | Por qué en este orden |
|---|---|---|
| M0 | Material al repo: plan, brújula y par de referencia (PR de docs y datos) | No volver a subir archivos [U]; no depende de código. |
| M1 | Carril rápido de verificación | Todo lo demás va más rápido. |
| M2 | Modo 3 independiente de la fuente (zonas de DAC o del rol `zone` de PNG + roles; selector de cualquier sala; retirar listas a mano) | Habilita el mapa viejo y mirar muchos casos. |
| M3 | Primer par: Forest/Plains ↔ Shrine of the Plains, desde `refs/` del repo | Mapas viejos primero (v24). |
| M4 | Toma emparejada + gate (par M3 + 2 salas de DAC) | El juez (v85). |
| M5 | Guardar / recargar el modelo elegido | Elegir 1 de 100 y volver. |
Después: funciones post-MVP y pase de pulido (lista en `claude/MVP_viewer_2dhd.md`).

Parado: P2, G1. Hecho y reusado: S1–S4c, C1–C3, P1 (#58–#69).

## Material de referencia
Subido por [U] el 2026-11-07 15:14 a `docs/crystallizers/03-stage/` (39 imágenes, 27,7 MB, commit 534ee28 en main). M0 las ordena con `git mv` en `docs/crystallizers/03-stage/refs/dq3/{old,remake,pairs,other}/` + `forest_plains/` (par de M3: `old/forest.png` ↔ mapa «Shrine of the Plains» y 3 capturas de juego). Índice en `refs/dq3/index.md`. Originales intactos, solo lo necesario, no reemplazar PNG grandes, nunca dentro de `dist/`. Los tests del carril rápido usan fixture sintético; solo M3 y M4 leen el par real. NO VERIFICADO: si el repo es público (ver riesgos del plan).

## Carril de verificación
- PR del modo 3: tests afectados + regress (modos 1, 2 y legacy idénticos) + capturas. Sin pasada completa ni verifier por PR.
- Pasada completa: en un hito del MVP, una vez por semana, o si se toca código compartido.
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
- 2026-10-29 [U]: corpus primero, DAC aparcado (v24).
- 2026-10-31: v87 [R] recomendé «DAC primero» en el viewer; desde ahí solo DAC (error de orden, v148).
- 2026-11-06 [U]: desviación detectada (v138); paso 0, rama A; C1–C3 (v141–v145).
- 2026-11-07: P1 (v146). [U] «¿por qué antorchas?» → P2 parado (v147).
- 2026-11-07 [U]: viewer = casa; mapas viejos primero; verificación demasiado lenta (v148).
- 2026-11-07 [U] 14:22 «ok, pero primero consolida»: consolidación + MVP M1–M5 + pulido (v149, `MVP_viewer_2dhd.md`).
- 2026-11-07 [U] 14:29: los archivos viejos se guardan en el repo para no re-subirlos; el resto del plan aprobado; se agrega M0 (v150).
- 2026-11-07 [U] 15:25: las imágenes ya están en `docs/crystallizers/03-stage/` (rips viejos, capturas del remake, comparaciones). M0 pasa a ordenarlas con `git mv` (v151).
