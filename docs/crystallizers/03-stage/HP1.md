# HP1 · Conservación de la hoja

[R], 2026-11-21 (A630–A632). Hipótesis principal derivada como intersección de PC, HO, LI, S16 y HT1
(`MATRIZ_CRUCE.md`). Solo enunciado: sin prueba ni rúbrica. Nivel: lv1 entry. Categoría: top.

## Enunciado

**El HD-2D conserva la imagen 2.5D de su origen.** La hoja de composición es esa imagen (oblicua en FF6, top-down con
pisos diferenciados en DQ3). Las transformaciones locales del espacio son las necesarias para que una cámara en
perspectiva siga leyendo esa imagen, y el pase de composición mide y corrige esa conservación. Entre capas se
conservan los hitos y el eje del origen, no toda su disposición.

## Subhipótesis y la ganancia que cada una debe obtener a la vez

| Sub | Qué aporta a HP1 | Ganancia simultánea |
|---|---|---|
| PC (A497) | El pase de composición existe y es la corrección hacia la imagen | Un pase definible |
| HO (A497, A498) | La imagen objetivo depende del origen; la de EvoDun es top-down | Elegir la hoja por origen |
| LI (A503) | La imagen 2.5D es una capa que no se puede saltar | Un paso 2.5D usable (Cam 7 como proyección) |
| S16 (T59) | Una sala de 16 bits es el terreno donde la imagen se fija | Sala de prueba controlada |
| HT1 (A591, A611) | Las transformaciones locales son el medio de conservación | Operador de M6, derivado de la imagen y no catalogado |

Terreno: una sala con origen 2D conocido que pasa por una capa 2.5D antes del HD-2D. Fuera de ese terreno HP1 no afirma
nada (Octopath sin original de 16 bits; salas DAC sin capa 2D previa).

## Datos que la apoyan

- GDC Octopath (A598): la gramática de 16 bits puesta en 3D sale plana; se corrige con terrazas, fondo alto, casas
  chicas, FOV estrecho y desenfoque «para la impresión de un juego 2D».
- Octopath tiene el mismo pitch que DQ3; lo empinado es deformación (A478, A479).
- Trono: el remake sube bandas enteras en saltos, que la vista oblicua lee como franjas apiladas (A616).
- HT1-R: el transformador dominante cambia por lugar dentro del mismo origen (A618), como predice una imagen propia de
  cada escena.
- Hitos y marco conservados en 8/8 pares (A601); DQ11: lo que no se lee, se cambia (A596).
- Altura agregada sin imagen objetivo tapa la cámara: lego y 7–9 terrazas (A574).
- Cam 7 solo se lee como 2.5D con la altura comprimida a 0,5 (A567, A576).
- Las salas DAC no tienen proporciones 2D-HD y los trucos no compensan (A465, A470): falta la capa.

## Datos que la rechazan o la limitan

- Posada y bosque: el remake agranda y reescribe (pair.md). Por eso el enunciado conserva hitos y eje, no la disposición
  completa.
- Octopath no tiene original de 16 bits: HP1 no es comprobable allí.
- El fondo «más chico» (A481) contra «más alto» (GDC) sigue abierto (CF ? AP) y toca qué imagen se conserva.

## Alternativa: HP-A · la hoja es un proceso

El HD-2D se obtiene por una hoja 2.5D que es un conjunto de transformaciones locales que respetan la capa anterior y
dependen del origen; el pase de composición es aplicar la hoja. Conserva la disposición; ganancia: catálogo de
transformadores por origen. Más débil con los datos: HT1-R muestra que dentro de un mismo origen el transformador cambia
por lugar (A618), y la GDC describe un objetivo de imagen, no un catálogo. La elección entre HP-B (este documento) y
HP-A es de [U].

## Qué resolvería si se sostiene

Daría a M6 un criterio para derivar transformaciones en vez de un catálogo, uniría la conversión (HT1) con la toma
(la imagen es lo que ve la cámara) y explicaría por qué el polish hecho a mano no subía de nivel: corregía el espacio sin
una imagen objetivo.

## R · Solución de [U] a HP1 (verbatim, 2026-11-21, A633; la solución más fuerte a esta hipótesis, A636)

Texto de [U] sin editar (ortografía incluida):

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

**Lectura de [R] retirada (A637).** La versión anterior de esta sección parafraseaba la respuesta y la reducía a
«oclusión», «vacío» y «proporción de sala»: medidas [mid] que ya teníamos. Eso perdió el hilo: la pregunta es el
isométrico (la capa 2.5D) como hipótesis, y la solución es dar vuelta el problema (qué emerge al convertir un mapa de
16 bits a una vista 2.5D), no medir síntomas. Las tres cautelas también se retiran: no respondían a esa pregunta.
