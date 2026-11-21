# HP1 · Derivación: metodología, proceso y estado (traspaso)

Archivo de traspaso, autosuficiente, para continuar HP1 en otra conversación. Escrito por [R] el 2026-11-21 (A638).
Repositorio: Dracmire/EvoDun-Landmaker. Carpeta: `docs/crystallizers/03-stage/`. Documento de estado del proyecto:
https://claude.ai/artifact/4dgFsmfo9Kg5oga4cVJdM6 (Registro hasta A638, Tangentes hasta T65).

Roles: [U] usuario (juzga mirando, decide, mergea) · [R] el Claude que diseña y supervisa · CC (Claude Code) construye y
mide.

---

## 1. Contexto

EvoDun es un SRPG; este repo es un visor que materializa («cristaliza») mapas en vistas 2.5D / HD-2D. El modo 3
(Stage) es el cristalizador 2D-HD. El Norte (`BRUJULA.md`): de un mapa viejo, con reglas, sale una vista que se parece
al remake. Referencias: DQ3 (mapa viejo de 16 bits ↔ remake HD-2D) y Octopath Traveler 2.

Por qué hubo que subir de nivel: durante semanas se trabajó de abajo hacia arriba (cámara, terrazas, lego, bordes,
muros) y se llegó a un techo: lo que se podía comprobar no movía la meta, y lo que movía la meta no se podía comprobar
(A586). Desde A589 todo [low] y [mid] es polish postergado; se trabaja en [high] y [top].

## 2. Metodología completa

### 2.1 THML (nivel de abstracción; A586, A589)

| Eje | Qué es | Estado |
|---|---|---|
| T · top | Teorizar un paso de generación o conversión a HD-2D, o el comportamiento de OT2 / DQ3 aplicado a buscar soluciones | activo |
| H · high | Derivar una metodología o un método nuevo apto para HD-2D | activo |
| M · mid | Manipular la topografía creando herramientas nuevas en `src` | polish, postergado |
| L · low | Ajustar la cámara o un parámetro | polish, postergado |

### 2.2 Niveles de integración al modelo (A604)

lv1 entry (propuesta) · lv2 existe (comprobada) · lv3 applied (testeada y aplicada al modelo) · lv4 mature (madura, dio
ganancia) · lv5 evolved (se integró y nos subió de nivel). Marcas del modelo: `[H]` = lv1; `[V]` = lv2, o lv3 si además
está construida; `[X]` = descartada; `[D]` = decisión de [U].

### 2.3 Submetodología de [U] (A623)

1. Cada hipótesis tiene categoría THML y nivel 1–5.
2. Subir un nivel exige derivar una **subhipótesis** de ese nivel con su cadena:
   **hipótesis → ganancia → prueba → rúbrica → avance**.
3. Cada nivel hereda los supuestos de los anteriores y de la ganancia: el área de prueba se achica.
4. **La prueba debe ser de la categoría de la hipótesis.** Una prueba [low] / [mid] sobre una hipótesis [high] / [top]
   cae a polish. Contar baldosas (o unidades) una por una es un test [low], se mire como se mire.
5. Un disparo de CC se gasta solo si la cadena cierra en papel: un positivo debe cambiar la hipótesis de forma
   significativa y un negativo también debe enseñar algo.
6. Una transformación se detecta por **qué cambia** y se demuestra **replicándolo**; comparar baldosa por baldosa solo da
   la relación entre el mapa viejo y el remake (A611).
7. Contradicciones entre casos pueden ser señal de varios tipos de lugar (A613).

### 2.4 Reglas de trabajo

- Antes de pedir pruebas a CC, preguntar a [U] diciendo: qué se gana, cómo aporta a la meta y cómo se extrae el
  resultado (ejemplo de [U]: comparar dos vigas no da una hipótesis de cuartos).
- Un PR por tema o hipótesis (A620). Toda recomendación cita la línea, el archivo o el número que la sostiene, o dice
  «sin leer».
- Cada 10 IDs, revisar los pendientes propios: máximo 4; los liberados van a `PANORAMA_LIBERADOS.md` (A590).
- Marcas al vuelo: `► A### · R# · hallazgo` y `◇ T## · tangente`; IDs correlativos, nunca reutilizados.
- Español, breve, sin jerga, con opciones y una recomendación.

## 3. Proceso seguido (2026-11-20 / 21)

1. **Lista por nivel (A586, `PANORAMA.md`).** Todas las metas y pendientes clasificados por THML y marcados: sin avance,
   sin método o test que no sirve. Resultado: el frasco.
2. **Fuentes de método (A588).** Dormans (diseño de niveles como cadena de transformaciones de modelos), Image Analogies
   (transformación aprendida de un par A : A′), Merrell, rango expresivo (PCG book), Hullett, Christie. Dormans fue el
   marco elegido por [U] (A592): misión → lugar → toma → geometría.
3. **Convergencia (A593, `MARCO.md` §4).** Cinco familias de polish (la altura crece con la profundidad; el encuadre se
   cierra; el eje del recorrido es el eje de la vista; el héroe es la unidad; las transiciones se leen desde la cámara)
   resultaron síntomas de modelos ausentes.
4. **Fuentes de los creadores (A596, A598–A600; `MODELO_ACTUAL.md` §9b).** GDC 2019 de Octopath: el fallo fatal fue la
   escala; la gramática de 16 bits (suelo desde arriba, edificios de frente) puesta en 3D sale plana y se corrige con
   paisaje aterrazado, edificios del fondo más altos, casas más chicas, FOV estrecho y desenfoque; interiores 1:2 con el
   héroe constante; camino primero y conjuntos modulares; máscara alfa sobre lo que tapa al héroe. DQ11: concepto 2D →
   3D con modelos temporales y recorrido → 2D rehecho a mano, reconociendo el lugar por sus hitos y cambiando lo que no
   se lee.
5. **HT1 en los pares de DQ3 (A591, A601).** 8 escenas: hitos conservados 8/8, marco agregado 8/8, la meta del fondo sube
   4/8, la cámara mira por el eje 6/8, primer plano 7/8 (con predictor en el mapa solo 3/8), densidad 4/8 sin predictor.
6. **Error: taxonomía (A609).** Las reglas L1–L5 describían qué cambió, no cómo transformar.
7. **Transformadores sobre estructuras (A611–A612, `TRANSFORMADORES.md`).** Los mapas viejos son planos: toda la altura
   de los packs hechos a mano es transformación agregada. Seis candidatos (ascenso por el eje, desplazamiento de unidad,
   agua hundida, cierre del borde, hito máximo, cuenca).
8. **Disparo de HT1, fallado (#134; A617–A622).** Tablas del remake congeladas antes (A615, `tools/ht1/truth_*.json`);
   hallazgo: en el trono el remake sube bandas enteras en saltos discretos, y el pack hecho a mano no (A616). Por la
   regla fijada no se descartó, pero el conjunto sumó solo 2 aciertos sobre el control y la prueba era [mid]. Dejó una
   cosa: cada mapa tiene su transformador dominante (trono: ascenso; bosque: cuenca; Aurhea: agua) (A618).
9. **Matriz de cruce (A626–A628, `MATRIZ_CRUCE.md`).** 21 hipótesis leídas en su fuente (abajo).
10. **Tres líneas de acción (A629).** [U] eligió la del linaje por mayor ganancia y potencial lv5 (A630).
11. **Hipótesis principal (A631–A632, `HP1.md`).** Intersección de PC, HO, LI, S16 y HT1. Dos opciones; [U] asumió
    HP-B (A633).
12. **Solución de [U] (A633, A636): §6, verbatim.**

## 4. Matriz de cruce (21 hipótesis)

Códigos (fila respecto de columna): `=` misma raíz · `<` la fila es un caso de la columna · `>` la columna es caso de la
fila · `→` la fila necesita a la columna · `←` la inversa · `x` choca · `?` tensión abierta · `·` nada.

```
    HT1 HT2  PC  HO  LI S16 DEF  CF  SA  RS  CL  VO  TM  LT  TT  VM  CU  DP  EM  FG  AP
HT1   ■   >   ·   <   <   =   =   >   ·   ?   →   ·   ·   >   ·   >   ·   ·   >   ·   =
HT2   <   ■   ·   ·   ·   ·   ·   ·   ·   →   ·   ·   ·   ·   =   ·   ·   ·   ·   =   ·
PC    ·   ·   ■   >   =   ·   ·   ·   ·   ·   ·   ·   →   ·   ·   ·   ·   >   ·   ·   ·
HO    >   ·   <   ■   =   ·   ·   ·   >   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   >   ·
LI    >   ·   =   =   ■   =   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   →   ·   ·   ·   ·
S16   =   ·   ·   ·   =   ■   ·   ·   ·   ·   ·   ·   →   ·   ·   ·   ·   ·   ·   ·   ·
DEF   =   ·   ·   ·   ·   ·   ■   >   ·   ·   ·   ·   ·   ·   ·   ·   x   ·   ·   ·   =
CF    <   ·   ·   ·   ·   ·   <   ■   ·   ·   ·   ·   ·   ·   ·   ·   →   ·   ·   ·   ?
SA    ·   ·   ·   <   ·   ·   ·   ·   ■   ·   ·   ·   ·   x   ·   ·   ·   ·   ·   ·   →
RS    ?   ←   ·   ·   ·   ·   ·   ·   ·   ■   =   =   =   ·   ·   >   ·   ·   ·   ·   ·
CL    ←   ·   ·   ·   ·   ·   ·   ·   ·   =   ■   >   →   ·   ·   ·   ·   ·   ·   ·   ·
VO    ·   ·   ·   ·   ·   ·   ·   ·   ·   =   <   ■   =   ·   ·   ·   ·   ·   ·   ·   ·
TM    ·   ·   ←   ·   ·   ←   ·   ·   ·   =   ←   =   ■   ·   ·   ·   =   ·   ·   ·   ←
LT    <   ·   ·   ·   ·   ·   ·   ·   x   ·   ·   ·   ·   ■   <   ·   ·   ·   ·   ·   <
TT    ·   =   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   >   ■   ·   ·   ·   ·   ·   →
VM    <   ·   ·   ·   ·   ·   ·   ·   ·   <   ·   ·   ·   ·   ·   ■   ·   ·   ·   ·   <
CU    ·   ·   ·   ·   ←   ·   x   ←   ·   ·   ·   ·   =   ·   ·   ·   ■   =   ·   ·   ·
DP    ·   ·   <   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   =   ■   ·   >   ·
EM    <   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ■   ·   <
FG    ·   =   ·   <   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   <   ·   ■   ·
AP    =   ·   ·   ·   ·   ·   =   ?   ←   ·   ·   ·   →   >   ←   >   ·   ·   >   ·   ■
```

| Código | Hipótesis (texto de la fuente) |
|---|---|
| HT1 | La conversión de DQ3 son transformaciones locales sobre estructuras (A591, A611) |
| HT2 | El tipo de lugar decide el transformador dominante (A618) |
| PC | HD-2D = mundo 3D + personajes y objetos 2D + luces + un pase de composición especializado; sin él, maqueta (A497, [U]) |
| HO | La hoja de composición depende del origen: DQ3 top-down (el remake eleva y diferencia pisos), Octopath 2.5D oblicuo de 16 bits (FF6); modelo = Base + hoja + grupo de features; EvoDun → hoja top-down (A497, A498) |
| LI | Linaje: DQ3 8 bits → 16 bits → hoja → remake, cada capa respeta las anteriores; FF6 → hoja → Octopath; la hoja es un juego 2.5D: componer en 2.5D y luego dar el paso a HD-2D (A503, [U]) |
| S16 | Sala de 16 bits (texturas libres, verticalidad, sin obstrucciones) como sala de prueba: esbozo 2D → 2.5D → HD-2D (T59, [U]) |
| DEF | El 2D-HD busca más deformación, no menos (A427, [D]) |
| CF | Casas del fondo > 50 % más chicas aunque sean visitables (A481, [U]) |
| SA | Escalones chicos en la hoja top-down (A247); saltos grandes vestidos de arquitectura en la 2.5D (A495) |
| RS | La forma de la sala decide; falta una regla de forma de sala; cerrada contra abierta (A382, A465, A470) |
| CL | Camino primero, lugar alrededor del camino (A592, A600) |
| VO | Lo visible / oculto de cada plataforma clasifica el lugar (A580) |
| TM | La toma es la unidad; escena = secuencia de tomas (A594, A597) |
| LT | Lego y número de terrazas se sustituyen (A564) |
| TT | Tratamientos de altura por temática (T61, [U]) |
| VM | Vecinos como marco (T62, [U]) |
| CU | Cámara de [U]: prioridad Z, bloqueo suave; perfiles narrow / wide; sub-cámara deep (A428, A482, A490, A491) |
| DP | La perspectiva solo se lee con tamaños conocidos repartidos en profundidad (§7 del modelo) |
| EM | Elevar la meta del fondo (A603; A083 la bajó por oclusión en el visor, no por diseño) |
| FG | Grupos de features por tipo de escena (F-D, F-B, F-E, F-C) |
| AP | La altura crece con la profundidad de la vista (A593, A598) |

Consolidación de la matriz: bloque del linaje (PC = HO = LI = S16, con HT1 debajo como caso de HO y de LI); bloque del
lugar (RS = CL = VO = TM); HT1 es el nodo más cruzado (12), AP el segundo (9); HT2 = TT = FG (el tipo decide el
tratamiento). Choques: DEF × CU, LT × SA, CF ? AP, RS ? HT1. Detalle de cada cruce en `MATRIZ_CRUCE.md` §3.

## 5. Hipótesis principal elegida

**HP1 = HP-B · La hoja es una imagen.** El HD-2D conserva la imagen 2.5D de su origen. La hoja de composición es esa
imagen: oblicua en FF6, top-down con pisos diferenciados en DQ3. Las transformaciones locales del espacio son las que
hacen falta para que una cámara en perspectiva siga leyendo esa imagen, y el pase de composición mide y corrige esa
conservación. (Alternativa descartada por [U]: HP-A, la hoja como proceso / catálogo de transformadores por origen.)

**Terreno:** una sala con un origen 2D conocido que pasa por una capa 2.5D antes del HD-2D.

| Subhipótesis | Ganancia que debe dar a la vez |
|---|---|
| PC | Un pase de composición definible |
| HO | Elegir la hoja por el origen (EvoDun: top-down) |
| LI | Un paso 2.5D intermedio usable |
| S16 | Una sala de prueba controlada |
| HT1 | El operador de M6 (relieve desde el trazado) |

Datos que apoyan a HP-B: GDC (gramática de 16 bits → terrazas, fondo alto, FOV estrecho «para la impresión de un juego
2D»), A478–A479 (Octopath: lo empinado es deformación, no pitch), A616 (bandas enteras en saltos), A618 (el
transformador cambia por lugar), A574 (altura sin imagen objetivo tapa la cámara), A567 / A576 (Cam 7 se lee 2.5D con la
altura a 0,5), A465 / A470 (DAC no tiene la capa). Límites: la posada y el bosque del remake agrandan y reescriben (se
conservan hitos y eje, no toda la disposición); Octopath no tiene un original de 16 bits.

## 6. Solución de [U] (verbatim; la más fuerte para HP1)

```text
asumamos Hp-B

asi que tenemos hipotesis principal, y sus hipotesis secundarias listas, con ganancia determinada al inicio, todas nos dan ganancia:

la hipotesis:
una sala con un origen 2D conocido, que pasa por una capa 2.5D antes del HD-2D.

con la base:
La hoja es una imagen. El HD-2D conserva la imagen 2.5D de su origen. La hoja de composición es esa imagen: oblicua en FF6, top-down con pisos diferenciados en DQ3. Las transformaciones locales del espacio son las que hacen falta para que una cámara en perspectiva siga leyendo esa imagen, y el pase de composición mide y corrige esa conservación

entonnces

esto se vuelve simple, como demostramos que

* una sala con un origen 2D conocido, que pasa por una capa 2.5D antes del HD-2D. La unica forma es construyendo un pipeline que haga esto, pero tenemos una linea dada por la base:
   *  El HD-2D conserva la imagen 2.5D de su origen. La hoja de composición es esa imagen
   * as transformaciones locales del espacio son las que hacen falta para que una cámara en perspectiva siga leyendo esa imagen
   * el pase de composición mide y corrige esa conservación
* ok para que se cumpla la base, tomemos el ejemplo de DQ3. en dreamer tower los pisos tenian relieve que no existe en el original o en 16 bits. es mas el mapa es distinto de 16 bits, aunque tiene la misma estructura
   * eso significa que : si HD2D conserva la imagen de su origen la hoja de composicion del mapa del remake es el mapa del 2.5D
   * las transformacionnes locales de espacio se pueden apreciar en los relieves de piso (transformacion) y cambios de estructura (mapa), y estos 2 como resultado deberiann tener como resultado que la camara "perciva" estos pisos al cambiar de top down a Fov perspectiva (que ya tenemos)
      * pero, si te das cuenta eso implica que el juez es la camara, cambiar de camara top down a perspectiva, es una gran cambio, y esta proyeccion intermedia es nuestra meta.
      * en simples terminos, el piso se levanto para que la camara "vea" y la forma se cambio para que la camara "vea", y eso tiene sentido si sigues el orden de DQ3, los pasillos sonn estrechos y el piso es limitado, y hay mucha zonna de relleno negra. en el fondo para entender la conversion hay que ver los limited de la camara de originenn (top down), y despues preguntarse "como convertirla end 2d", solo que no nesesitamos las respuestas.
      * ya sabemos al analizar los pisos, que alturas diferidas y cambio de estructura era nesesario. y solo viendolo del punto de los problemas de conversion desde el mapa originnal 16 bits a 2.5d. y asumamos que el 2.5 es lo mas facil y connocido algo como un isometrico (solo por simplificacion) por que :
         * por que los bordes negros son reemplazados con mas visibilidad del mismo dungeon si creas perspectiva altura
         * por que el problema no es que el piso es estrecho es que convertir este mapa en isometrico es una pesadilla de camara, por los muros y los caminos limitados, convertidos a isometrico tu fov es ahogado en esos espacios
         * con el mas basico ejercicio de "como seria en isometrico", ya todo colapsa y ahi aparecen los problemas
         * si usas otro medio popular de contraste como beat em up como dragons crown, llegas a un resultado parecido por otra via. en el fondo los problemas no son los metodos sino como solucionar el margen estrecho de los mapas viejos
         * como nosotros simplemente hicimos brute force, eso nos salvo de todo este pase de diseño, pero en realidad la pregunta de 2d a remake, o de 2d a cualqueir cosa mejor, es una historia de horror, no por los mapas planos, por que eso se solucionna, sino por que FOV de 2.5d es ahogado
         * de ahi las soluciones, altura y estructura differentes
   * Dijimos que el "pase de composición mide y corrige esa conservación", pero aca, al voltear el problema todo cambia. si el pase de composicion mide y corrige, entonces cuando conjugas esto con los probblemas que ya describi queda esto:
      * unn pase de composicion que permite tomar un 2d y convertirlo en isometrico o beat em up (dimetrico) o otro visual 2.5d, copando con las limitaciones del mapa original, o mejor dicho, no copando, sino buscando solucion a la pregunta core que emerge
      * Composicon que debe corregir el ahogamiento del FOV cuando ocurre la transformacion de 2d a 2.5d
      * Composicion que debe corregir la gran cantidad de espacios negros de los mapas originales
      * etc, el resto emerge solo : preguntandose, puedo comvertir el DQ3 en cualquier visual 2.5d moderna ?, o mejor dicho, claro que se puede, pero cuales son las problematicas que emergen, y si las enumeras y ponderas, lo unico que es nesesario despues es cambiar la pauta, si la solucion de 2,5d es X, expandir los mismo puntos te permiten alcanzar hd2d
   *
```

## 7. Errores de [R] que no hay que repetir

1. Taxonomía en vez de transformación (L1–L5, A609).
2. Comparar baldosa por baldosa (o unidad por unidad) para una hipótesis de transformación (A611, A622).
3. Rúbrica que mide etiquetas y no la ganancia, y sin control (A619, A621).
4. Prueba [mid] para una hipótesis [top]: el disparo de HT1 se perdió así (A622).
5. Agrupar hipótesis sin leerlas en su fuente (A626).
6. Reducir la solución de [U] a medidas [mid] (oclusión, vacío, proporción) y perder el hilo: la pregunta es el
   isométrico como capa 2.5D y la solución es dar vuelta el problema (A637).

## 8. Archivos

`HP1.md` (hipótesis y la solución verbatim) · `MATRIZ_CRUCE.md` (matriz completa con la razón de cada cruce) ·
`MARCO.md` (THML, modelo evaluado, teorías × dominios, convergencia, submetodología, disparos) · `PANORAMA.md`
(bitácora del día, lista por nivel, pares, GDC) · `TRANSFORMADORES.md` · `research/metodologia/MODELO_ACTUAL.md` (v2.5) ·
`refs/dq3/` (pares, mapas viejos, remake) · `entregas/PR-134.md` (disparo de HT1) · `tools/ht1/` · `BRUJULA.md`.
