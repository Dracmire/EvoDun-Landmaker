# Viewer 2D-HD (modo 3): consolidación, MVP y pase de pulido (v151, 2026-11-07)

Pedido [U] 14:22: consolidar lo que sí está bien, reflexionar sobre el camino para terminar el viewer de 2D-HD y separar el MVP del pulido.
Ajuste [U] 14:29: los archivos viejos que se usen (mapas, capturas) **se guardan en el repo**, para no volver a subirlos en cada paso. El resto del plan queda aprobado.

Etiquetas: [U] usuario · [R] revisor (yo) · [Ref] material de referencia · [Repo] medido en el repo · [CC] reportado por CC.

## Qué cambió en v150 y v151
- v150: nuevo paso **M0** (plan, brújula y material de referencia al repo, PR solo de docs y datos); **M3** ya no es «archivo local, nunca al repo»; sección 3b con las reglas del material; riesgo de copyright reescrito.
- v151 [U] 15:25: el usuario ya subió 39 imágenes a `docs/crystallizers/03-stage/` (commit 534ee28 directo a main): 7 rips viejos (Paco), 25 capturas del remake, comparaciones viejo ↔ remake y 4 de otro juego. M0 pasa de «subir» a **ordenar con `git mv`** bajo `refs/dq3/`. El layout de 3b cambia: todo el material es del corpus DQ3, no de un solo par; el par de M3 queda como un espacio de trabajo con referencias por nombre, sin copias.

## 0. Qué es «terminado» (reflexión) [R]
- El viewer es la casa: ahí se generan y se miran muchos modelos; 1 de cada ~100 va a Unity [U]. Por eso importa más **mirar rápido muchos casos y elegir** que exportar.
- El método es el de DQ3 (v24, v51): un mapa viejo se convierte conservando la disposición, reescalando y agregando relieve. Las pruebas con mapa viejo van primero; DAC entra porque da salas en cadena [U].
- El juez es la **toma emparejada** contra el remake o la referencia (v85), no un mock propio.
- Lo que construimos ya implementa las reglas que el corpus DQ3 mostró (C2, C3, C4, C6, C10). Falta correrlas sobre un mapa viejo y juzgarlas con el juez correcto.

**Terminado (MVP)** = en el modo 3 se carga un mapa viejo anotado o una sala de DAC, las mismas reglas lo convierten, se puede recorrer y guardar el modelo elegido, y una herramienta de toma emparejada lo mide contra la referencia. El gate pasa en 1 par mapa viejo ↔ remake y en 2 salas de DAC, o deja escrita la lista de fallas que define el trabajo siguiente.

## 1. Lo que está bien y se conserva
| Pieza (PR) | Qué da | Por qué está bien |
|---|---|---|
| Capa de modos, R1–R8, sesión de ventana (S1, S2a) | modo 3 sin romper 1 y 2 | protege los modos que ya funcionan |
| Cam 6 + héroe en H + seguimiento + encuadre de sala (S1, C1) | escala de héroe, perspectiva real | decisión cerrada (v70–v73) |
| Técnica Box en el modo 3 (C1) | caras rectas | el spike probó que B borra el marco (v141) |
| Orientación por sala (C1) | eje hacia la meta | corpus C2 |
| Regla de planos + void → pared (C2, P1) | fondo alto, frente bajo, marco lateral, el vacío no se ve | corpus C3, C4, C6, C10 |
| Volúmenes reales sobre tiles bloqueados (S4b) | mecanismo de pared y columnas | geometría, no vestido |
| Bordes Isla / Quebrada (S2) | terminaciones de Diorama | idea [U] v59 |
| Transiciones en H (S3) | escaleras y rampas a escala | corpus C5 parcial |
| Billboards en H con visibilidad (S4a) | dibujo de ranuras | placeholder, como manda R4 |
| Landmark con transición (S4c) | meta legible de lejos y de cerca | decisión [U] v80 / v83 |
| Ranuras de eje, puerta y meta (C3, P1) | dónde van las piezas | contrato: dónde, no cómo se ven |
| `build.py` con una lista, `verify.sh --shard` | build y pruebas confiables | se usan con moderación |

## 2. Lo que se reencuadra o se retira
- **Mock T como juez** → se reemplaza por la toma emparejada (el mock salió de DAC).
- **Antorchas como rasgo** → son ranuras; su aspecto está congelado (v51).
- **Listas a mano de `dac_stage`** (objetos, volúmenes y landmark de S4a–S4c, medidos a yaw 180) → se retiran: las reglas de C2 / C3 las reemplazan.
- **`EVO_NO_ORIENT`** como modo por defecto de los tests viejos → se invierte cuando se toquen esos tests.
- **P2** → parado; sus puntos pasan al pulido.
- **Verificación completa por PR** → carril rápido (sección 5).
- **Subir archivos a mano en cada paso** → material de referencia dentro del repo (sección 3b).

## 3. MVP (en orden, con el porqué)
| # | Paso | Qué hace | Por qué en este orden | Hecho cuando |
|---|---|---|---|---|
| M0 | **Material ordenado en el repo** (PR de docs y datos; sin tocar `src/`, `tools/` ni `dist/`) | (a) las 39 imágenes ya subidas se mueven con `git mv` a `refs/dq3/{old,remake,pairs,other}/` con nombres legibles (tabla en `claude/refs_dq3_index.md`); (b) `refs/README.md` e `index.md` con procedencia y qué muestra cada archivo; (c) plan y brújula en `docs/crystallizers/03-stage/` (`MVP.md`, `BRUJULA.md`) para que CC los lea y los pedidos se acorten | no re-subir archivos [U]; es lo único que no depende de código | `git ls-files docs/crystallizers/03-stage/refs` lista las 39 como renombres (R100, sin duplicar bytes); el PR no toca `src/`, `tools/` ni `dist/` |
| M1 | **Carril rápido** (PR de docs: sección «Verification lanes» en `CLAUDE.md`, que hoy exige el verifier antes de reportar) | ver sección 5; CC mide los segundos de `regress` y de un `--only` típico; la pasada completa se cita de un log previo si existe, no se corre para medirla | todo lo demás va más rápido; mientras viva solo en mis prompts, `CLAUDE.md` lo contradice | `CLAUDE.md` dice «carril rápido por defecto» con cifras medidas |
| M2 | **Modo 3 independiente de la fuente** | las reglas (orientación, planos, ranuras) leen ZONAS: las salas de DAC o el rol `zone` de «Your images (PNG + roles)», que el viewer ya carga; los niveles salen del rol `elevation`. Selector de cualquier sala o zona (no solo la ventana de 6). Retira las listas a mano de `dac_stage`. | habilita el mapa viejo y mirar muchos casos | un fixture sintético (nuestro, sin copyright) y cualquier sala de DAC se convierten con las mismas reglas |
| M3 | **Primeros pares mapa viejo ↔ remake** (decisión C [U] 17:37: **M3a** Forest como corrida técnica, juzgada por rasgos y no por el lugar; **M3b** Aurhea's Fountain ↔ `r_20261030_050039_pond_peninsula` como juez real y prueba del pocket C7; [U] confirmó 04:13 que es el mismo lugar) | Forest/Plains (`old/forest.png`, rip de Paco) anotado como PNG de roles (zonas del zooning de v53 y niveles; receta de v53 reproducida y verificada con `old/forest.png` y el mapa del remake del repo, v158; defaults [R]: ×2, alturas en dos variantes A/B; v160: zonas = componentes conexos de ≥ 10 tiles (la huella de `stage.js` no cambia), árboles NO bloqueados en M3a —quedan como dato `vegetation` para el pulido—, sin `masks.water`, `subs` en `ui.js`, POI A delante de la puerta), en `refs/dq3/forest_plains/annotated/`, cargado **desde el repo**; referencia del remake: el mapa «Shrine of the Plains» y 3 capturas de juego de la misma sesión (ver 3b) | el plan original iba con mapas viejos primero (v24) | se recorre en el modo 3 sin subir nada, y se ven planos, cierre, marco y meta |
| M4 | **Toma emparejada** (S6 mínimo) | el héroe a la fracción de la captura, Cam 6 al zoom equivalente, lado a lado con la captura del repo; lecturas M1 (niveles), M3a (fondo cerrado), M4 (meta en cuadro), M5b (ancho de ruta en héroes), M8b (fila de la cima del fondo) | es el juez | el gate corre sobre el par de M3 y 2 salas de DAC y da una tabla |
| M5 | **Guardar y recargar el modelo elegido** (S5 mínimo) | las claves `viewer.stage.*` que ya existen pasan de inertes a efectivas al cargar | elegir 1 de 100 y volver a él | guardar → recargar → misma vista |
| M6 ⚠ | **Relieve automático desde el trazado** (DEUDA de la división de M3, v165; [U] 04:18: «lo antes posible») | rasgos 7 y 8 de la brújula sobre un mapa viejo SIN anotar: (7, C5) un ribete o borde del trazado pasa a tarima con escalera, es decir, niveles deducidos de la disposición; (8, C7) agua alrededor del POI pasa a pocket. Parte de la semilla de M3b: máscara de agua, península, rocas y senda sacadas del color del mapa viejo por un script (en Aurhea: 25×22 tiles, lago de 56 tiles, península de 2 tiles de ancho; medido). Falta decidir con la teoría DQ3 (v87) y el corpus C5/C7 cómo se deducen las alturas | cierra la otra mitad del Norte: hoy el visor aplica las reglas a un mapa viejo ANOTADO a mano (alturas supuestas), no a uno crudo. Va antes que cualquier pulido y que las otras fuentes | un mapa viejo SIN anotar de alturas (solo el PNG del mapa y, si hace falta, la zonificación) produce el relieve y se compara en la toma emparejada con el de la anotación manual y con el remake; se corre en Forest y en Aurhea |

Nota v161 (M3a): PR #74 entregado (6 zonas conexas, ejemplos Forest A/B, `subs` y terrazas en la sesión de ventana, `stage.js` intacto). Hallazgo: las reglas del modo 3 no leen `poi`; la meta de una sala suelta sale de la geometría. v162: el Paso 0 «meta desde POI» se hizo y se aprobó el pedido de construcción **M3c** (PR aparte, antes de M3b, M4 y M2c): la última zona de la ventana toma la meta y el eje del POI de mayor valor (`stage_m3_poi_goal_go.md`). v163-v164: M3c entregado como PR #75 y MERGEADO por [U] 04:13 (3254a02); sigue el Paso 0 de M2c (selector de zonas: hoy las ventanas nuevas solo se alcanzan por el gancho `stageSetWindow`).

Nota v165 (división de M3, [U] 04:18): [U] aceptó la opción A («hagámoslo por partes»): M3 prueba las REGLAS DE RENDER (rasgos 1–6) sobre mapas viejos con relieve anotado; la deducción automática del relieve (rasgos 7 y 8) queda fuera de M3a, M3b, M3c y M4 y se registra como **M6**, DEUDA RECONOCIDA que debe normalizarse lo antes posible. Mientras M6 no esté, el Norte está a medias y cada informe de M3/M4 lo dice; el juez de la toma emparejada (M4) mide las reglas, no la conversión automática.

Nota v166: #76 (signo canónico del eje degenerado, `stage-m3-canon`) entregado y revisado: el corte del signo se mueve de 0° a −11,5°, no desaparece (documentado como fragilidad). Paso 0 de M2c revisado; pedido de construcción M2c = lista propia «Window» (zonas de PNG y Forest en el commit 1, salas de DAC en el 2), `WIN_MAX` 12, aviso de no vecinas, ventana de M5 con ids crudos. M3b (Aurhea) es lo siguiente del núcleo.

Nota v167: M2c entregado como #78 (lista «Window», dos commits) y revisado; #76 y #77 ya mergeados. Sigue el Paso 0 de M3b (Aurhea: el agua como dato del pack y un clasificador de color genérico, que es la semilla de M6); M2d (retirar las listas a mano, y la excepción muerta de `test_modes_ui`) y la pasada completa de cierre de M2 quedan después de M3b [R, orden propuesto: el núcleo antes que la comodidad; [U] puede vetarlo].

Nota v168: #78 (M2c) mergeado. Paso 0 de M3b revisado: el agua entra como dato del pack (`masks.water`) sin tocar «Your images»; el clasificador de color de Aurhea APRENDE la rejilla del mapa (23 × 21 tiles enteros) y es la semilla de M6; pedido de construcción M3b en dos commits (datos + script; fuente integrada + ejemplo) con una parada para medir `planes` con agua antes de escribir ninguna regla. La regla del agua (si hace falta) sería un commit 3 pedido aparte.

Nota v170: M3b entregado como #79 (datos y script, fuente integrada y ejemplo, capturas) y revisado: 22 hashes con 0 diferencias, `src/` +12 líneas, `stage.js` y las reglas intactos. Alturas aceptadas como hipótesis (0 / 0,31 / 0,92 H; 1,5 H exactos piden `pre` / `subH` / `terH` como claves del ejemplo, se decide en M4). Hallazgo: con el agua elegible, `planes` levanta muros y pilares de 3 H dentro del lago; commit 3 pedido: el agua nunca se clasifica en `planes` (probado en copia: lago limpio, hashes iguales). #79 se mergea tras el commit 3. M6: el pre-suavizado se come una península de 2 px, a tener en cuenta en el relieve automático.

Nota v171: commit 3 de M3b revisado (el agua nunca se clasifica en `planes`; 22 hashes con 0 diferencias; capturas iguales a las de mi prototipo) y #79 MERGEADO por [U] (main 94b673b): M3 cerrado. Sigue M4 (toma emparejada): Paso 0 de solo informe con las lecturas M1 / M3a / M4 / M5a / M5b / M8b de v85 y v89, tres pares (Aurhea ↔ `pond_peninsula`; Forest A / B contra sus capturas, donde se elige A o B; dos salas de DAC contra bandas) y una herramienta mínima (función pura de lecturas + script de captura, sin panel). M2d y la pasada completa de cierre de M2 quedan después de M4.

Nota v172: Paso 0 de M4 revisado. Hallazgo: la foto del estanque está ≈ 3,3 veces a mayor escala en héroes que el mapa viejo a ×2 (M5b 1,1 H contra 3,6 H; M8b 0,5 H contra 1,7 H): lectura M5d (K). M4 se parte: M4a (herramienta de lecturas `tools/stage_readings.js` + `tools/ui/m4_pair.js`, sin tocar `src/`; tres pares: Aurhea con dos tomas y salas de DAC 14, 44 y 31 contra bandas; Forest fuera hasta que [U] ubique las capturas) y M4b (escala K del script de datos, solo si la tabla la sostiene; podría arreglar M5b, M8b y quizá M3a). Las composiciones con la foto no se suben al repo.

Datos: ya están en el repo (v151). M2 no los necesita y puede ir en paralelo a M0.

## 3b. Material de referencia en el repo [U] 14:29
Estructura propuesta [R]:

```
docs/crystallizers/03-stage/refs/
  README.md                  procedencia y reglas
  dq3/
    index.md                 tabla: nombre nuevo ← nombre original, clase, qué muestra
    old/                     7 rips 16-bit de Paco, tal como llegaron
    remake/                  capturas de juego del remake (solo remake)
    pairs/                   viejo ↔ remake en una sola imagen (fotogramas de un video comparativo y composiciones)
    other/                   no es DQ3 (DQ11, 3D ↔ modo 2D)
    forest_plains/           espacio de trabajo del par de M3, sin copias de imágenes
      pair.md                qué archivos de old/ y remake/ forman el par, fracción del héroe en cada captura
      annotated/             PNG de roles hechos por nosotros (zone, elevation, path, POI) + manifiesto evodun-pack/0.2
```

Par de M3 [R, por miniaturas y marcas de tiempo; a confirmar al verlo en grande]: `old/forest.png` ↔ `remake/` mapa «Shrine of the Plains» (captura 14:19:29 del 30-oct) y las 3 capturas de juego con minimapa tomadas justo antes (14:18:37, 14:18:55, 14:19:11). La torre del rip y el bloque gris del mapa del remake coinciden en posición (arriba, centro-derecha, entrada al sur); el remake agrega caminos. Lo decidió [U] antes; aquí solo se registra la evidencia.

Reglas:
1. Originales intactos; la anotación va aparte, en `annotated/`.
2. Solo lo que el gate usa; recortar lo demás.
3. No reemplazar PNG grandes: si hay que rehacer uno, archivo nuevo con otro nombre. Cada reemplazo queda en la historia y `.git` ya pesa 70 MB [Repo, medido].
4. Nada de `refs/` entra en `dist/` ni en el build del viewer.
5. Los tests del carril rápido usan el **fixture sintético**; solo M3 y M4 leen el par real.
6. Un par nuevo se agrega como carpeta de trabajo hermana de `forest_plains/` que referencia por nombre; no se copian imágenes.
7. Nombres sin espacios ni acentos (los originales «Captura de pantalla …» se renombran con `git mv`, que no duplica bytes).
8. Las capturas «pairs» son fotogramas de un video comparativo de terceros y las de «old» son rips de Paco: se guardan como referencia de estudio; la procedencia queda en `index.md`.

## 4. Pase de pulido (DESPUÉS del MVP)
**Funciones post-MVP (amplían, no pulen):**
- ~~corpus C5: ribete → tarima con escalera, como regla automática de niveles para mapas viejos~~ → sube a **M6** (§3, deuda de v165: lo antes posible, ya no es post-MVP);
- las otras fuentes del viewer: noise, Shrine-Pier, Snake (v64);
- H9 máscara de sombra, H7 zonas de composición;
- S2b, los bordes restantes, si la toma los pide;
- exportación de malla y tratamiento a Unity (D15: cuando terminen los cristalizadores).

**Pulido:**
- fluidez: forma guardada por sala, yaw suave, `preferFill` por sala, héroe en rampa;
- ranuras: antorchas en filas rectas, salas diminutas, puertas con 1 pilar;
- planos: salas enormes y en el borde del mapa, paleta de niveles nuevos, columnas en bordes empinados, frente bajado que expone paredes vecinas;
- calibración con la toma: terrazas 5 vs 3, alturas de pared, columnas y landmark, `tilesPerH`, TH del borde;
- pruebas y textos: cobertura con orientación encendida, `dac_stage` en regress, manifiesto, margen 92 / 90 %, hook `chebyshev`, cabeceras, pendientes de v136.

## 5. Carril rápido de verificación
- PR del modo 3 (decisión [U] 22:2x, v156–v157): tests afectados + capturas + tabla de hashes de canvas antes/después (ejemplos con interruptores apagados, modos 1 y 2). `regress` es DISPARADOR, no parte de cada PR: solo si el diff toca código compartido con los modos 1, 2 o 4 (lista cerrada en `CLAUDE.md`, que deriva CC y revisa [R]) y en la pasada completa. Sin pasada completa ni verifier por PR.
- Los tests lentos corren en PARALELO y en segundo plano (4 núcleos; la pasada de #61 corrió 4 procesos a la vez y pasó), no un comando a la vez: medir en serie fue solo para M1/M2. Antes de lanzarlos, `git grep` de los tests que afirman sobre lo que el PR cambia, y se corrigen primero; tras corregir un test se re-corre solo ese.
- Pasada completa: en un hito del MVP (cierre de M2, M3, M4, M5), una vez por semana, o cuando [U] lo pida.
- PR que toca código compartido con los modos 1, 2 o 4 (p. ej. el camino de carga de imágenes de `ui.js`, `shape.js`): el carril rápido suma los tests de ese código y de sus consumidores (`--only`), no la pasada completa [R, v155: afina la regla anterior «código compartido = pasada completa», que dejaba M2b en 70 min].
- Sin mutaciones para constantes de hipótesis (se calibran con la toma).
- Revisión: capturas primero; después solo los tests de nodo afectados.
- Pedidos a CC más cortos: rasgo, fuente, qué hace, capturas, tests esenciales; el contexto lo lee en `MVP.md` y `BRUJULA.md` del repo.
- Líneas base conocidas que no cuentan como falla nueva: `test_backdrop_ui` 6, `test_pick_ui` 2.

## 6. Riesgos
- **Norte a medias hasta M6 (v165).** [U] aceptó la división de M3 (render sobre mapas viejos anotados) a condición de normalizarla lo antes posible. Riesgo: que M6 se quede atrás del pulido y del resto de las fuentes. Mitigación: M6 está en la tabla MVP justo después de M5, no en el pulido; cada cierre de paso repite en una línea que la deuda sigue abierta; si M4 o M5 se retrasan, se puede adelantar M6 (no depende de M5). Riesgo técnico: deducir alturas desde un trazado plano es una hipótesis; el juez es la toma emparejada contra el remake.
- Anotar el mapa viejo es trabajo manual (zonas y niveles). Mitigación: empezar con uno ya estudiado (Forest/Plains, v49–v53).
- Con un solo par el gate es n = 1: sirve para descubrir fallas, no para validar. Con la decisión C son 2 pares (Forest no es el mismo lugar que el mapa del remake, así que su juez es de rasgos; el juez de lugar es Aurhea), más 2 salas de DAC.
- `regress` no admite `--only` (corre completo); su duración suelta no está medida: M1 la mide.
- **Copyright del material en el repo.** El viewer se usa por GitHub Pages [Repo: CLAUDE.md]. **NO VERIFICADO** si `Dracmire/evodun-landmaker` es público; Pages en cuenta gratuita exige repo público, y en ese caso los rips y capturas quedarían públicos. Decisión [U] 14:29: guardarlos en el repo; subidos 15:14 (39 archivos, 27,7 MB, commit 534ee28 directo a main [Repo, medido]). Mitigaciones [R]: fuera de `dist/`; solo lo necesario, recortado; `refs/README.md` con la procedencia de cada archivo. Si el repo resulta público y eso no es aceptable: repo privado aparte solo para `refs/`, al que CC accede igual.
- El plan y la brújula tienen ahora dos copias (Project y repo). Regla: tras M0 la copia de trabajo para CC es la del repo; la historia (vNN) sigue en el Project y cada cambio viaja a CC como un delta corto que aplica en un PR de docs.
