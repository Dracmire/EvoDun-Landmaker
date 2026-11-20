# Panorama del modo 3 por nivel de abstracción (2026-11-20)

Marca de avance (A586–A589). Reemplaza el trabajo guiado por `HIPOTESIS.md`, que queda como material de [high].

## Entrada de [U] (2026-11-20 06:17)

> El problema del loop es que estamos encerrados en acciones M o L que no cambian el panorama general: aunque
> avancemos un poco, no es significativo para la meta. Todo M y L es **polish**. Asumimos que tenemos una base
> suficientemente fuerte para un MVP, así que cualquier M o L puede postergarse. Se trabaja en [high] y [top].

## Niveles

| Nivel | Qué es | Estado |
|---|---|---|
| [low] | Ajustar la cámara o un parámetro (unos grados de FOV) | **polish, postergado** |
| [mid] | Manipular la topografía creando herramientas nuevas en `src` | **polish, postergado** |
| [high] | Derivar una metodología o un método nuevo apto para HD-2D | activo |
| [top] | Teorizar un paso de generación o conversión a HD-2D, o el comportamiento de OT2 / DQ3, aplicado a buscar soluciones | activo |

## Tabla (A586)

Marcas: ✗ = no da avance ni a corto ni a mediano plazo · ? = no se puede comprobar, falta método · ⊘ = el test que tenemos no sirve (un resultado positivo no enseña nada) · — = sin marca.

| # | Meta o pendiente | Nivel | Marca | Por qué |
|---|---|---|---|---|
| 1 | Norte: mapa viejo → reglas → se parece al remake | high | — | Comprobable con la toma emparejada, pero depende del 3 |
| 2 | M5 guardar / recargar | polish (mid) | ✗ | Herramienta; no acerca al problema |
| 3 | M6 relieve automático desde el trazado (rasgos 7–8) | top | ? | A073: ninguna regla deduce el relieve; falta el método |
| 4 | Regla de forma de sala (MODELO §16.1, A465) | high | ? | No hay par DAC ↔ HD-2D para compararla |
| 5 | Fondo construido fuera del mapa (§16.3) | polish (mid) | — | Comprobable (% de vacío); avance medio |
| 6 | Alto del héroe 0202 contra 0137 (§16.6) | polish (low) | ✗ | DQ3 cerrado |
| 7 | Espacio de cámara por sala, sub-cámara deep (§16.10–11) | polish (low) | ✗ | No mueve el problema de fondo |
| 8 | Perfiles de forma P1–P6, tesis T1 y T2 (§16.12) | high | ⊘ | 49 de 88 salas en ningún perfil: clasificador sin juez |
| 9 | Hoja 2.5D de Octopath completa (§16.14) | high | ? | Falta el método |
| 10 | Fondo de fachada (T58) | polish (mid) | ✗ | Ni corto ni mediano plazo |
| 11 | Hipótesis H1–H6 (`HIPOTESIS.md`) | high | ⊘ | Renderizar un lugar no prueba un tipo (ejemplo de las dos vigas) |
| 12 | H4 ciudad | high | ✗ | No hay dato de origen |
| 13 | Tratamiento de altura por temática (F11) y tope del lego | polish (low / mid) | ✗ | Lego congelado |
| 14 | Escalera que cruza dos terrazas / dos resoluciones (F12, E.5) | polish (mid) | — | Comprobable (conectividad); avance medio |
| 15 | Bandas del borde híbrido | polish (low) | ✗ | Cosmético |
| 16 | Plataformas fase 2 (roles) | polish (mid) | ? | Sin salida de referencia: cajas negras del generador |
| 17 | Vecinos delante / hueco de DQ3 (H6) | polish (mid) | ⊘ | 0 de 32 pares; medir más a ojo no enseña |
| 18 | Cam 7, dolly, P7 | polish (low) | ✗ | Hechos |
| 19 | Modelo de sala de 16 bits: 2D → 2.5D → HD-2D (T59) | top | ? | Falta el método |
| 20 | Ancla v1 sin aprobar | — | — | Necesaria; no es prueba |

Lectura: lo que da avance es [high] o [top] y no se puede comprobar; lo comprobable es polish.

## Hipótesis de nivel [top] ya presentes en el modelo (A587)

1. HD-2D = mundo 3D + un pase de composición que extrae las cualidades 2D (A497).
2. La hoja de composición depende del origen del juego; EvoDun es top-down, así que su hoja natural es la de DQ3 (A497–A498). Cuestiona la rama R2.
3. El 2.5D como transición: componer en 2.5D y llevar a HD-2D (A503).
4. Sala cerrada contra terreno abierto: la escena HD-2D es un recinto de ~17 H; DAC da terreno abierto de 8–61 H (A382, A465, A470).
5. La escena es una secuencia de tomas, no una sala: puntos de vista de las plataformas (A580, T64).
6. El 2D-HD busca más deformación: la conversión deforma la geometría para la cámara (A427, A572).

Mayor problema en [top] (A587): la conversión top-down → HD-2D no está definida. El único par con entrada y salida
conocidas es DQ3 (mapa viejo ↔ remake), y se cerró midiendo la salida, no la transformación.

## Fuentes de método (A588)

Ver la evaluación en el Registro y en la respuesta de [R] del 2026-11-20. Fuentes:
- Dormans, *Level design as model transformation* (PCG 2011) y *Adventures in level design*: la generación como cadena de modelos (misión → espacio → geometría) con reglas de reescritura entre ellos. https://www.pcgworkshop.com/archive/dormans2011design.pdf · https://www.boristhebrave.com/2021/04/02/graph-rewriting/
- Hertzmann et al., *Image Analogies* (SIGGRAPH 2001): aprender una transformación local a partir de UN par alineado (A : A' :: B : B'). https://mrl.cs.nyu.edu/projects/image-analogies/
- Merrell, *Example-Based Model Synthesis* y *Example-Based Procedural Modeling Using Graph Grammars*: reglas extraídas de un ejemplo. https://paulmerrell.org/grammar/
- Shaker, Togelius, Nelson, *Procedural Content Generation in Games* (libro libre; capítulo de evaluación: rango expresivo). https://pcgbook.com/
- Hullett y Whitehead, *Design patterns in FPS levels* y *The Science of Level Design*: patrones con intención y validación sobre muchos casos. https://eis.ucsc.edu/papers/khullett-fdg-doccon-camera-ready.pdf
- Christie, Olivier y Normand, *Camera Control in Computer Graphics* (survey): la toma como un problema de restricciones (visibilidad, encuadre, oclusión). https://diglib.eg.org/handle/10.2312/CGF.v27i8pp2197-2218
- Inverse procedural modeling (p. ej. WorldBrush, Emilien et al. 2015). https://www.cs.purdue.edu/homes/bbenes/papers/Emilien15ToG.pdf

## Regla de pendientes de [R] (A590, [U] 2026-11-20)

Cada 10 IDs del Registro (próxima revisión en A600), [R] revisa sus pendientes: si son más de 4, descarga el resto
o pregunta a [U] cuál queda. Los liberados van a `PANORAMA_LIBERADOS.md`, con fecha y motivo.

## HT1 · Hipótesis de transformación por pares (A591)

**Afirmación.** La conversión de DQ3 (original → remake) es una composición de transformaciones locales. Cada cambio
del remake o bien tiene un predictor en el original (es una regla), o bien no lo tiene (es una decisión de autor, y
entonces el dato tiene que venir del generador como semántica).
**Dato.** 10 pares original | remake en `refs/dq3/pairs/` (sala del trono, casa de pueblo, posada, cueva con isla,
sala de torre, corredor de desierto, claro de bosque, frente de tienda, sala con columnas, puerta de castillo) y el
par de mapas `old/forest.png` ↔ `remake/r_20261030_141929_shrine_of_the_plains_map.png`.
**Método.** Image Analogies como lectura (A : A′ :: B : ?) y Dormans como estructura: cada cambio se asigna a una
flecha de la cadena de modelos (abajo).
**Descarte (fijado antes de mirar).** Si en los 10 pares ningún tipo de cambio se repite con el mismo predictor en
3 pares o más, HT1 es falsa: la conversión es autoral escena por escena, y la mecánica de transformación tiene que
salir del lado del generador. Ese resultado también enseña algo: dice qué datos tiene que entregar EvoDun.

## Cadena de modelos de Dormans aplicada al modo 3 (A592)

| Modelo | Qué es | Dónde está hoy |
|---|---|---|
| M0 Misión | El recorrido: estaca → objetivos → vuelta | Existe (estaca, objetivos, ruta, cadena DAC de modo 2) |
| M1 Espacio | Recintos y sus puertas: qué está cerrado y qué se conecta | No existe como modelo: DAC da terreno abierto (A382) |
| M2 Tomas | Nodos de cámara: punto de vista, eje, profundidad ordenada, cierre | No existe; el germen son tus plataformas con punto de vista (A580) |
| M3 Geometría HD-2D | Relieve, planos, props, escala en H | Es donde trabajamos (todo el polish) |

Flechas: M0 → M1 (la misión pide recintos), M1 → M2 (cada recinto se parte en tomas), M2 → M3 (cada toma fija
cómo se deforma la geometría para su cámara). Hoy saltamos directo del trazado a M3.

## Matriz Dormans × [high] y [top] (A592)

| Ítem | Nivel | Qué es en la cadena | Qué se reescribe | Reacción a HT1 |
|---|---|---|---|---|
| 1 Norte (mapa viejo → remake) | high | La cadena completa con M0 dado por el mapa viejo | Todas las flechas | HT1 es su primera flecha medida |
| 3 M6 relieve desde el trazado | top | Flecha M2 → M3 (relieve por toma) | Bordes del trazado → tarima, escalera, pocket | Fuerte: HT1 da las reglas o dice que el relieve es semántico |
| 4 Forma de sala | high | Flecha M0 → M1 | Terreno abierto → recinto | Fuerte: DQ3 «conserva la disposición»; si los pares lo confirman, el recinto tiene que venir del generador |
| 8 Perfiles P1–P6 | high | Clasificaban M3 sin M1 ni M2 | — | Se reemplazan: los perfiles serían tipos de nodos de M2 |
| 9 Hoja 2.5D de Octopath | high | Otra M2 (cámara oblicua) | — | Negativa: Octopath no tiene original de 16 bits, no hay par; refuerza la hipótesis top 2 |
| 11 H1–H6 tipos de escenario | high | Tipos de M1 + M2 | Reglas por tipo | Fuerte: los 10 pares cubren interior, pueblo, cueva, torre, desierto y bosque |
| 12 H4 ciudad | high | Tipo de M1 | — | Revive: casa de pueblo, tienda y puerta de castillo son pares de ciudad |
| 19 T59 2D → 2.5D → HD-2D | top | Pregunta si M2 pasa por una toma oblicua | — | Media: HT1 puede ver si los cambios se explican por un paso oblicuo |
| top 1 Pase de composición | top | Es M2 → M3 | — | Lo nombra |
| top 2 Hoja por origen | top | Elige la M2 | — | Apoyada por la reacción del ítem 9 |
| top 3 2.5D como transición | top | Una M2 intermedia | — | Igual que 19 |
| top 4 Recinto contra abierto | top | Es M1 | — | Es la flecha que falta |
| top 5 Escena = secuencia de tomas | top | Es M2 | — | Es el modelo que falta |
| top 6 Más deformación | top | Regla de M2 → M3 | Geometría según la cámara | HT1 puede medir cuánta deformación hubo |

## Convergencia de [low] y [mid] (A593)

Cada polish es un arreglo local de una estructura que falta arriba en la cadena:

| Principio que no veíamos | Polish que lo sostiene | Modelo que falta |
|---|---|---|
| La altura crece con la profundidad de la vista (fondo alto, frente bajo) | planes BACK / FRONT, lego Up / Down, vecinos como marco, vecinos delante, corte Zelda, corte de cámara del Cake, bandas del Pocket, Quebrada, hueco de DQ3, verticalidad V1a | M2 (la toma ordena la profundidad) |
| El encuadre siempre está cerrado | muro trasero, columnas laterales, volúmenes, bordes Isla / Quebrada, fondo construido, cierre del vacío | M1 (el recinto) |
| El eje del recorrido es el eje de la vista, con la meta al fondo | orientación por sala, yaw de Cam 7, encuadre por sala, props en el eje, escalera en el eje | M0 → M2 (la misión se proyecta en la toma) |
| El héroe es la unidad y crece hacia la meta | heroFrac, tilesPerH, medidas en H, dolly, perfiles de espacio de cámara | M2 (escala por toma) |
| Las transiciones de nivel se leen desde la cámara | P7, rampas, borde híbrido cuadrado hacia la cámara, Cake Rest | M2 → M3 |

Lectura: las cinco familias de polish son síntomas de tres modelos ausentes (M0 proyectado, M1, M2). Por eso
avanzar en M3 no movía el panorama.
