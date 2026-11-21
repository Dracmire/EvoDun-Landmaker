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

## R · Reencuadre de [U]: el juez es la cámara (2026-11-21, A633–A635; HP-B asumida)

**Terreno:** una sala con un origen 2D conocido que pasa por una capa 2.5D antes del HD-2D. **Demostrarlo es construir
ese pipeline.**

**El cambio de cámara es el juez.** En la Torre del Soñador los pisos tienen relieve que no existe en el original y el
mapa es distinto aunque conserva la estructura: el piso se levantó y la forma se cambió *para que la cámara vea*. Pasar de
la cámara top-down a una perspectiva es un cambio enorme, y la proyección intermedia (2.5D) es la meta.

**El problema se da vuelta.** No se pregunta cómo transformar: se pregunta qué problemas aparecen al convertir el mapa de
16 bits a cualquier 2.5D (isométrico, dimétrico tipo beat 'em up como Dragon's Crown). Con el ejercicio más básico,
«¿cómo sería en isométrico?», todo colapsa:
- los pasillos estrechos y los muros ahogan el FOV;
- el negro de relleno de los mapas viejos queda a la vista;
- el piso limitado no da dónde mirar.

Las soluciones emergen: altura diferida y estructura distinta. El problema no son los mapas planos (eso se soluciona):
es que el FOV del 2.5D queda ahogado. Hacer fuerza bruta nos saltó este pase de diseño.

**El pase de composición, dado vuelta:** convierte un 2D a una vista 2.5D buscando solución a la pregunta central que
emerge:
- corrige el ahogo del FOV al pasar de 2D a 2.5D;
- corrige los espacios negros del mapa original;
- el resto se obtiene enumerando y ponderando los problemas.

Después solo cambia la pauta: si la solución 2.5D es X, expandir los mismos puntos lleva al HD-2D.

### Lectura de [R] contra los datos

- **Une HT1 con la toma.** Los cambios de los pares sin predictor en el mapa (C4 primer plano, C5 contexto fuera del
  mapa, C6 densidad; A601) tienen su predictor en la cámara: son respuestas al vacío y al ahogo.
- **Problemas ya medidos sin ese nombre:**
  - negro → vacío en pantalla (borde del bosque A hasta 54 %, A470; `voidShare` de M4);
  - FOV ahogado → oclusión (cámara tapada con 7–9 terrazas, A574; suelo oculto 2,14 × Δ tras un borde, A572);
  - pasillo estrecho → proporción de la sala (8 H y 61 H contra ~17 H, A465).

  Buena parte del polish eran soluciones a problemas de conversión nunca enumerados como tales.
- **La capa 2.5D ya existe en el visor:** Cam 7 con profundidad 0,5 (A576).
- **Cautelas:**
  1. Cada problema se mide desde la cámara y va con la transformación que lo resuelve; si no, es otra taxonomía (lección
     de L1–L5, A609).
  2. Los pesos cambian entre el isométrico y la perspectiva.
  3. El negro es a veces no-espacio (borde del mundo) y a veces espacio que el top-down no mostraba; se separan.
