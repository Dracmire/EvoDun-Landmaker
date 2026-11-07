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
| M1 | **Carril rápido** (proceso, sin PR) | ver sección 5 | todo lo demás va más rápido | se aplica desde el próximo pedido |
| M2 | **Modo 3 independiente de la fuente** | las reglas (orientación, planos, ranuras) leen ZONAS: las salas de DAC o el rol `zone` de «Your images (PNG + roles)», que el viewer ya carga; los niveles salen del rol `elevation`. Selector de cualquier sala o zona (no solo la ventana de 6). Retira las listas a mano de `dac_stage`. | habilita el mapa viejo y mirar muchos casos | un fixture sintético (nuestro, sin copyright) y cualquier sala de DAC se convierten con las mismas reglas |
| M3 | **Primer par mapa viejo ↔ remake** | Forest/Plains (`old/forest.png`, rip de Paco) anotado como PNG de roles (zonas del zooning de v53 y niveles), en `refs/dq3/forest_plains/annotated/`, cargado **desde el repo**; referencia del remake: el mapa «Shrine of the Plains» y 3 capturas de juego de la misma sesión (ver 3b) | el plan original iba con mapas viejos primero (v24) | se recorre en el modo 3 sin subir nada, y se ven planos, cierre, marco y meta |
| M4 | **Toma emparejada** (S6 mínimo) | el héroe a la fracción de la captura, Cam 6 al zoom equivalente, lado a lado con la captura del repo; lecturas M1 (niveles), M3a (fondo cerrado), M4 (meta en cuadro), M5b (ancho de ruta en héroes), M8b (fila de la cima del fondo) | es el juez | el gate corre sobre el par de M3 y 2 salas de DAC y da una tabla |
| M5 | **Guardar y recargar el modelo elegido** (S5 mínimo) | las claves `viewer.stage.*` que ya existen pasan de inertes a efectivas al cargar | elegir 1 de 100 y volver a él | guardar → recargar → misma vista |

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
- corpus C5: ribete → tarima con escalera, como regla automática de niveles para mapas viejos (teoría DQ3, v87);
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
- PR del modo 3: tests afectados + regress (modos 1, 2 y legacy idénticos) + capturas. Sin pasada completa ni verifier por PR.
- Pasada completa: en un hito del MVP, una vez por semana, o si el PR toca código compartido.
- Sin mutaciones para constantes de hipótesis (se calibran con la toma).
- Revisión: capturas primero; después solo los tests de nodo afectados.
- Pedidos a CC más cortos: rasgo, fuente, qué hace, capturas, tests esenciales; el contexto lo lee en `MVP.md` y `BRUJULA.md` del repo.
- Líneas base conocidas que no cuentan como falla nueva: `test_backdrop_ui` 6, `test_pick_ui` 2.

## 6. Riesgos
- Anotar el mapa viejo es trabajo manual (zonas y niveles). Mitigación: empezar con uno ya estudiado (Forest/Plains, v49–v53).
- Con un solo par el gate es n = 1: sirve para descubrir fallas, no para validar.
- **Copyright del material en el repo.** El viewer se usa por GitHub Pages [Repo: CLAUDE.md]. **NO VERIFICADO** si `Dracmire/evodun-landmaker` es público; Pages en cuenta gratuita exige repo público, y en ese caso los rips y capturas quedarían públicos. Decisión [U] 14:29: guardarlos en el repo; subidos 15:14 (39 archivos, 27,7 MB, commit 534ee28 directo a main [Repo, medido]). Mitigaciones [R]: fuera de `dist/`; solo lo necesario, recortado; `refs/README.md` con la procedencia de cada archivo. Si el repo resulta público y eso no es aceptable: repo privado aparte solo para `refs/`, al que CC accede igual.
- El plan y la brújula tienen ahora dos copias (Project y repo). Regla: tras M0 la copia de trabajo para CC es la del repo; la historia (vNN) sigue en el Project y cada cambio viaja a CC como un delta corto que aplica en un PR de docs.
