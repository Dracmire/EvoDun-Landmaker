# Cómo se ensambla un nivel 2D-HD en Luminati (repo `lumina`)

Fecha: 2026-11-10 · Estado: investigación (no es contrato ni decisión) · Nota de diseño: v211.
Segundo informe de la serie; el primero es [`hd2d_octopath_method.md`](hd2d_octopath_method.md) (tutorial de Cobra Code).

Etiquetas: **[Lum]** dicho por la documentación del repo · **[Tut]** dicho por el tutorial del primer informe ·
**[Ref]** medido por nosotros · **[Repo]** de nuestro código · **[R]** propuesta del revisor · **[U]** decisión del usuario.

## 1. Fuente y fiabilidad

- Repo: <https://gitlab.com/stubborn-hug/lumina> (autor «Alex Green», licencia MIT, creado el 2026-10-05, 5 commits, rama `main`).
- El motor se llama **Luminati**: «a 2.5D pixel-art engine for three.js», inspirado en los HD-2D de Square Enix.
  JavaScript sin dependencias de arte: texturas, sprites, partículas y audio se generan por código.
- **Sí contiene lo que se buscaba**: una guía de composición de niveles, el formato del nivel, un editor y
  generadores con validador. No es un catálogo de capturas.
- Qué se leyó: README, árbol de archivos y partes de 6 documentos (enlazados abajo). **No se leyó el código,
  no se ejecutó el motor y no se abrió ningún nivel JSON.** Todo valor [Lum] es lo que el autor documenta,
  NO VERIFICADO por nosotros.
- Es un proyecto de una persona, de un mes, sin uso externo conocido. Sirve como método, no como autoridad.

Documentos consultados:

| Documento | Para qué |
|---|---|
| [README.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/README.md) | Qué es, demos, comandos |
| [docs/design/LEVEL_DESIGN_GUIDE.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/design/LEVEL_DESIGN_GUIDE.md) | **La guía de composición** (18 secciones) |
| [docs/specs/LEVEL_FORMAT.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/specs/LEVEL_FORMAT.md) | Formato del nivel (`luminati-level` v1) |
| [docs/design/VISUAL_DESIGN.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/design/VISUAL_DESIGN.md) | Escala, cámara, post-proceso |
| [docs/architecture/RENDER_PIPELINE.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/architecture/RENDER_PIPELINE.md) | Qué es geometría y qué es sprite |
| [docs/design/levels/sample-hamlet.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/design/levels/sample-hamlet.md) | Nivel mínimo hecho por script |

Sin leer, y relevantes para una segunda pasada:
[OBJECT_CATALOG.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/specs/OBJECT_CATALOG.md),
[LEVEL_EDITOR_GUIDE.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/user/LEVEL_EDITOR_GUIDE.md),
[modules/world.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/architecture/modules/world.md),
[levels/starfall-vale.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/design/levels/starfall-vale.md),
[campaigns/emberfall-interiors.md](https://gitlab.com/stubborn-hug/lumina/-/blob/main/docs/design/campaigns/emberfall-interiors.md),
[tools/make-starfall-vale.mjs](https://gitlab.com/stubborn-hug/lumina/-/blob/main/tools/make-starfall-vale.mjs),
[tools/lib/levelcheck.mjs](https://gitlab.com/stubborn-hug/lumina/-/blob/main/tools/lib/levelcheck.mjs).

## 2. El ensamblado en una frase

Un nivel es **un archivo de datos**: dos rejillas de caracteres (tipo de tile y altura), una leyenda que dice
qué textura lleva cada cara, una lista de objetos colocados en coordenadas continuas y un bloque de ambiente.
El motor levanta el 3D desde esos datos; nada del nivel es código. [Lum]

## 3. Las cinco capas del nivel

Orden en que el nivel se arma y se lee [Lum, `LEVEL_FORMAT` §3–§11]:

| # | Capa | Qué es | Cómo se escribe |
|---|---|---|---|
| 1 | **Suelo por rol** | Un carácter por tile (`g` pasto, `.` camino, `c` adoquín, `~` agua, `T` bosque de borde, `^` escalera…) | `tiles`: una cadena por fila |
| 2 | **Alturas** | Un carácter por tile, niveles 0–35 de 0,5 unidades | `heights`: una cadena por fila |
| 3 | **Leyenda** | Por carácter: textura de la cara superior (`top`), de la pared (`side`), del borde superior de la pared (`lip`), de la contrahuella (`riser`); si es caminable, agua, escalera o vacío | `legend` |
| 4 | **Objetos** | Casas, puentes, árboles, faroles, aldeanos, regiones, emisores de partículas, en coordenadas continuas con rotación | `objects` |
| 5 | **Ambiente** | Hora, clima, borde, cámara por nivel, zonas de flores y rayos de luz | `environment` |

Consecuencias de ese diseño [Lum]:
- El acantilado **no se dibuja ni se coloca**: aparece solo donde un tile es más alto que su vecino, con la
  textura `side` y la banda `lip` de la leyenda.
- Un «muro» decorativo es un tile bloqueado y elevado. No hay objeto muro para eso.
- Las escaleras son tiles (`^ v > <`), no objetos: una escalera de *n* niveles son *n* tiles seguidos.
- El mapa se lee como texto: el documento del nivel de ejemplo incluye el plano en ASCII.

## 4. Qué es geometría y qué es sprite

[Lum, `RENDER_PIPELINE` §3]

| Elemento | Cómo se construye |
|---|---|
| Suelo, escaleras, paredes de acantilado | Malla 3D generada desde las rejillas |
| Flecos de pasto, aleros de acantilado | Calcomanías sobre la malla |
| Casas, muros, puentes, cercas, props chicos | Geometría 3D con textura pixelada |
| Árboles | Tronco 3D + copa de tarjetas planas recortadas |
| Personajes y animales | Sprites, con un plano auxiliar que proyecta su sombra |
| Llamas, partículas, rayos de luz | Tarjetas y shaders |

Es el mismo reparto que nuestra regla de composición (b) [U, 10 nov]: lo estructural es geometría; el sprite
queda para personajes, vegetación y efectos.

## 5. Unidades y cámara

| Medida | Luminati [Lum] | Lo nuestro |
|---|---|---|
| Tile | 1 unidad | 1 tile |
| Nivel de altura | 0,5 unidades (≈ 0,30 H) | sala del trono: subniveles de 0,21 H [Repo, v208] |
| Densidad | 16 px por unidad, igual en mundo y sprites | — (el visor no tiene texturas) |
| Personaje adulto | 27 px de alto ≈ 1,7 unidades | `tilesPerH` 2 por defecto, 1,5 en el trono [Repo] |
| Escalón caminable | hasta 0,55 unidades (1 nivel); 2 niveles o más es acantilado | límite de 2 subniveles sin escalera [Repo] |
| FOV | 28° | Cam 6: 30° [Repo] |
| Inclinación | 32° (39–40° en terreno alto) | Cam 6: 25° [Repo]; Octopath ≈ 15–20° [Ref v39]; DQ3 ≈ 40–53° [Ref v29] |
| Distancia | 30 unidades (zoom 18–42) | derivada de `heroFrac` |
| Tamaño del héroe en pantalla | «about a tenth of the screen tall» | `heroFrac` 0,14 por defecto; remake del trono 11,6 % [Ref v210] |
| Giro | yaw 0 ± 60° a mano | yaw por sala, en múltiplos de 90° [Repo, C1] |

La conversión a H usa 1 H = 1,7 unidades (27 px / 16); es cálculo nuestro sobre cifras [Lum].

## 6. La guía de composición

Todo sale de un hecho: **la cámara siempre mira al norte**, así que lo alto tapa el suelo que tiene detrás. [Lum, guía §2]

### 6.1 Oclusión
- Una casa de un piso (alero a 3,5 unidades) tapa unas 5,6–6 unidades de suelo al norte.
  Comprobación nuestra: 3,5 / tan 32° = 5,6. Cuadra con la cámara declarada.
- Nada que el jugador deba ver o usar (aldeano, puerta, cartel, pozo, fogata) puede quedar en esa sombra.
- Las puertas miran al sur, este u oeste, nunca al norte.
- Las filas de casas van al lado, no detrás, de las puertas de la fila del sur.
- Tope de caminos ocultos tras techos: 3 % de los tiles de camino.
- Corredores de visión libres de troncos al sur de cada objetivo (aldeano 3 × 9, puerta 2,5 × 8,5, cartel 2 × 4,5).
- Las copas se modelan aparte: un árbol que tapa el 50 % de un objetivo es error; el 25 %, se retira.

### 6.2 Primer plano
- El desenfoque cercano enmarca la toma, pero **se usa poco**: árboles y una cabaña ocupando el 40–60 % del
  cuadro fue un defecto de revisión, y se corrigió moviendo la cabaña.
- La silueta «rayos X» del jugador tapado es red de seguridad, no herramienta de diseño.
- Sin árboles en las 3 filas de abajo del mapa.

### 6.3 Alturas
- 1 nivel de diferencia se camina sin escalera; 2 o más es acantilado y pide escalera o rodeo.
- Las paredes se ven desde el sur: una meseta al norte muestra su cara; un bloque al sur solo su tapa.
- Niveles con espacio entre sí; el ejemplo sube 2 → 5 → 9 → 15.
- Lo que mide menos de ~1,5 unidades se lee como un bulto desde 30 unidades.
- Las escaleras que suben alejándose de la cámara son las que mejor se leen; 2–3 tiles de ancho, con descanso.
- En terreno alto la cámara se inclina más, para que los techos borrosos de abajo no llenen el cuadro.

### 6.4 Bordes
- El área jugable se rodea de tiles de bosque no caminables; ninguna vista muestra el fin del mundo.
- Ningún camino termina en un muro invisible: termina en una reja o sigue como camino no caminable.

### 6.5 Densidad
- 0,07–0,10 objetos por tile caminable (0,04 en una ciudad).
- Grupos con un foco (pozo, puesto, faroles alrededor), no alfombras.
- Zonas libres: 1,1 unidades frente a puertas, 2,2 en pozos y fogatas, 1,6 en extremos de puente.
- 2–3 props por casa, contra los muros laterales y traseros.
- Siembra de árboles por zona: densa en bosque, escasa en pueblo, con margen a caminos, casas y faroles.
- Unas 12 luces por vista.

## 7. Cómo se usa: flujo y validación

[Lum, guía §14–§15]

1. **Un solo dueño por nivel.** O lo hace un script generador, o se pinta en el editor. Un nivel generado se
   cambia en el generador, nunca a mano.
2. **Generadores deterministas**: semillas, sin azar libre. Mover una pieza desplaza la siembra; se revalida.
3. **El generador se niega a escribir** si falla una comprobación.
4. Comprobaciones que hace el validador:
   - **Caminata** desde el inicio con las reglas del juego: todo aldeano, puerta, cartel y pozo alcanzable.
   - **Rutas**: un trayecto prometido no puede superar 1,5 × la distancia recta + 3 unidades.
   - **Cámara**: nada oculto tras techos, tope del 3 %, ningún árbol a mano en un corredor de visión.
   - Huellas de edificio planas y secas; escaleras que suben un nivel por tile; puentes caminables de punta a punta.
5. **Prueba por mutación**: quitaron puentes y escaleras a propósito; con las rutas el validador pasó de dejar
   pasar 9 roturas a rechazar 43 de 44.
6. Antes de publicar: lista de cierre y recorrer el nivel una vez.

Para los niveles chicos el script es corto: rellena rectángulos de tile y altura, agrega objetos, normaliza,
valida y escribe [Lum, `sample-hamlet`].

## 8. Comparación con el primer informe

| Tema | Tutorial (Octopath) [Tut] | Luminati [Lum] | Lectura |
|---|---|---|---|
| Qué describe | El *look* y sus ajustes | El **ensamblado** y sus reglas | Se complementan; el tutorial no dice cómo se arma un nivel. |
| Entorno | Bloques + terreno esculpido + splines | Rejilla de tiles + rejilla de alturas + leyenda | Luminati es la versión mínima de «bloques». |
| Cámara | 20°, FOV 35–45 | 32°, FOV 28 | Tercer valor distinto. No hay «la» cámara 2D-HD. |
| Primer plano | Se enmascara lo que tapa | No se enmascara: se **diseña** para que no tape, y hay silueta de respaldo | Dos estrategias opuestas. |
| Interiores | Héroe × 0,5 y cámara × 0,5 en la puerta | Interiores como niveles aparte unidos por puertas | No leído en detalle: no se sabe si cambia la escala. |
| Props planos | Sprites curvados 2.5D | Solo copas de árbol, personajes y efectos | Coinciden en que lo estructural es 3D. |
| Desenfoque | «Lo que más pesa» | Banda nítida de 6 unidades; el frente se desenfoca más que el fondo | Luminati da números; siguen fuera del modo 3. |
| Comprobación | Ninguna | Validador con caminata, rutas y cámara | Lo más aprovechable para nosotros. |

## 9. Qué nos sirve

Coincidencias con lo que ya hacemos:
- Nuestro pack (`zone`, `elevation`, `path`, `poi` como PNG) y su par `tiles` + `heights` son la misma idea.
- Suelo pintado por rol y muros como terreno elevado: es el Commit 1 del trono (MAPA 1).
- Caminata antes del veredicto (regla 4) = su caminata del validador.
- «Un solo dueño» = nuestra regla de que el generador produce la escena y a mano solo va lo que una regla podrá producir.

Ideas nuevas, sin decidir [R]:
1. **Oclusión como medida.** Su regla es geométrica: altura / tan(inclinación) = suelo tapado. En Cam 6 (25°)
   un volumen de 3 H tapa 6,4 H de suelo detrás; en 32° tapa 4,8 H. Se puede calcular por sala antes de dibujar.
2. **Corredor de visión hacia la meta y hacia la ruta**, como comprobación automática junto al presupuesto de billboards.
3. **Tope de ruta oculta** (su 3 %) como lectura de la toma, en lugar de juzgar un fotograma por parecido.
4. **Leyenda por rol** (`top` / `side` / `lip`) como forma de declarar el material de cada cara para Unity.
5. **Inclinación por altura** del héroe (su «terreno alto»): cámara por sección, ya planteada en v68.
6. **Primer plano escaso**: su defecto del 40–60 % es comparable a nuestra alarma D1, pero aplicada a geometría.

Diferencias que impiden copiar:
- Su cámara gira a mano ± 60° y siempre parte mirando al norte; la nuestra corta por sala en múltiplos de 90°.
  Sus reglas «al norte de» se traducen a «detrás de, según el yaw de la sala».
- Sus niveles son exteriores de aldea. No hay regla para un interior cerrado como la sala del trono.
- Sus números están afinados para 32°; con otra inclinación cambian todos.

## 10. Límites de este documento

- Lectura parcial de documentación; ni código ni niveles abiertos; nada ejecutado.
- Un autor, un mes de historia, cifras propias sin contraste externo.
- No es un juego HD-2D comercial: es una interpretación del estilo. No reemplaza medir en capturas de referencia.
