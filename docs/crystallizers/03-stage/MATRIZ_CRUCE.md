# Matriz de cruce de hipótesis

[R], 2026-11-20 (A626–A628). Hecha **leyendo cada hipótesis en su fuente** (marcas `[H]` de `MODELO_ACTUAL.md` y filas del Registro). Reemplaza la agrupación por raíz de `MARCO.md` §11, que se hizo sin leerlas.

## 1. Hipótesis (texto de la fuente)

| Código | Hipótesis | Cruces |
|---|---|---|
| HT1 | Conversión DQ3 = transformaciones locales sobre estructuras (A591, A611) | 12 |
| HT2 | El tipo de lugar decide el transformador dominante (A618) | 4 |
| PC | HD-2D = 3D + 2D + luces + un pase de composición; sin él, maqueta (A497, [U]) | 4 |
| HO | La hoja de composición depende del origen: DQ3 top-down (el remake eleva y diferencia pisos), Octopath 2.5D oblicuo de 16 bits (FF6); modelo = Base + hoja + grupo de features; EvoDun → hoja top-down (A497, A498) | 5 |
| LI | Linaje por capas: DQ3 8 bits → 16 bits → hoja → remake, cada capa respeta las anteriores; FF6 → hoja → Octopath; la hoja es en la práctica un juego 2.5D: componer en 2.5D y luego pasar a HD-2D (A503, [U]) | 5 |
| S16 | Sala de 16 bits (texturas libres, verticalidad, sin obstrucciones) como sala de prueba: esbozo 2D → 2.5D → HD-2D (T59, [U]) | 3 |
| DEF | El 2D-HD busca más deformación, no menos (A427, [D]) | 4 |
| CF | Casas del fondo > 50 % más chicas aunque sean visitables: perspectiva o fachada; se separa con la fórmula de escala (A481, [U]) | 4 |
| SA | Escalones chicos en la hoja top-down (A247); en la hoja 2.5D, saltos grandes vestidos de arquitectura (A495, A498) | 3 |
| RS | La forma de la sala decide; falta una regla de forma de sala en la generación; sala cerrada contra terreno abierto (A382, A465, A470) | 6 |
| CL | Camino primero, lugar alrededor del camino (Dormans A592; GDC A600) | 4 |
| VO | Lo visible / oculto de cada plataforma clasifica el lugar; plataformas por punto de vista (A580, SequenceA) | 3 |
| TM | La toma es la unidad; escena = secuencia de tomas; lugar → tomas (A594, A597) | 7 |
| LT | Lego y número de terrazas se sustituyen (A564) | 4 |
| TT | Tratamientos de altura por temática: Abismo / Valle / Llanura / Colina / Montaña o Down / Mid / Up (T61, [U]) | 3 |
| VM | Vecinos como marco: las salas vecinas reales subidas o bajadas enmarcan la toma (T62, [U]) | 3 |
| CU | Cámara de [U]: prioridad Z, bloqueo suave; perfiles narrow / wide; sub-cámara deep para el fondo (A428, A482, A490, A491) | 5 |
| DP | La perspectiva solo se lee con cosas de tamaño conocido repartidas en profundidad (desaplanadores, §7) | 3 |
| EM | Elevar la meta del fondo (pares 4/8, A603; A083 la bajó por oclusión en el visor) | 2 |
| FG | Grupos de features por tipo de escena: escalera sobre el eje, rojo de primer plano, ritmo de árboles, landmark al fondo, filas de estatuas, arcos de primer plano (F-D, F-B, F-E, F-C; H1–H6) | 3 |
| AP | La altura crece con la profundidad de la vista (A593; GDC: terrazas y fondo más alto, A598) | 9 |

## 2. Matriz

Códigos (fila respecto de columna): `=` misma raíz · `<` la fila es un caso de la columna · `>` la columna es un caso de la fila · `→` la fila necesita a la columna · `←` la columna necesita a la fila · `x` choca · `?` tensión abierta · `·` sin relación.

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

## 3. Cada cruce, con su razón

| Fila | Rel. | Columna | Por qué |
|---|---|---|---|
| HT2 | `<` | HT1 | HT2 condiciona HT1: qué transformación según el tipo |
| HT1 | `<` | HO | HT1 es la hoja top-down vista como proceso: «el remake eleva y diferencia pisos» |
| HT1 | `<` | LI | HT1 es la última capa del linaje (16 bits → remake) |
| HT1 | `=` | S16 | misma conversión por capas; S16 es su sala de prueba |
| HT1 | `=` | DEF | los transformadores son deformaciones (subir, bajar, achicar) |
| CF | `<` | HT1 | achicar las casas del fondo es un transformador por profundidad |
| RS | `?` | HT1 | ¿el recinto viene del generador (A465) o lo produce la transformación (pares: marco 8/8)? |
| HT1 | `→` | CL | los transformadores necesitan el eje entrada → meta |
| EM | `<` | HT1 | EM es el transformador C3a |
| AP | `=` | HT1 | la GDC describe la conversión como terrazas + fondo alto |
| LT | `<` | HT1 | el lego es un transformador de unidad (T-B) hecho a mano |
| VM | `<` | HT1 | subir o bajar vecinos es T-B |
| TT | `=` | HT2 | el tema decide el tratamiento de altura = el tipo decide el transformador |
| FG | `=` | HT2 | el tipo de escena decide su grupo de features |
| HT2 | `→` | RS | el atributo que separó los tipos en HT1-R fue cerrado / abierto |
| HO | `<` | PC | la hoja de origen es cómo se especializa el pase de composición |
| PC | `=` | LI | el pase de composición es la capa «hoja» del linaje |
| PC | `→` | TM | el pase actúa sobre una toma |
| DP | `<` | PC | los desaplanadores son una regla del pase |
| HO | `=` | LI | misma idea; LI agrega las capas y el 2.5D intermedio |
| SA | `<` | HO | consecuencia de la hoja: top-down escalones chicos, 2.5D saltos vestidos |
| FG | `<` | HO | modelo = Base + hoja + grupo de features |
| S16 | `=` | LI | S16 es el linaje hecho sala de prueba |
| LI | `→` | CU | A503: Cam 7 Classic 3/4 es la proyección 2.5D de la hoja |
| S16 | `→` | TM | sala sin obstrucciones para probar tomas |
| CF | `<` | DEF | achicar el fondo es deformación |
| AP | `=` | DEF | subir el fondo es deformación |
| DEF | `x` | CU | A478–A479: lo empinado de OT2 viene de la deformación, no del pitch |
| CF | `→` | CU | se separa perspectiva de fachada con la fórmula de escala de la cámara |
| CF | `?` | AP | GDC: el fondo se ve más alto y las casas más chicas; A481: casas del fondo más chicas: ¿alto o chico? |
| SA | `→` | AP | los saltos grandes de AP necesitan vestirse de arquitectura |
| LT | `x` | SA | el lego hace saltos grandes; en la hoja top-down de EvoDun A247 los prohíbe |
| RS | `=` | CL | la GDC arma la zona alrededor del camino: el recinto nace del camino |
| RS | `=` | TM | recinto de ~17 H = una toma; «interiores de una toma» (A495) |
| VM | `<` | RS | enmarcar con vecinos es cerrar el recinto |
| VO | `=` | RS | lo visible / oculto mide el recinto desde la cámara |
| VO | `<` | CL | las plataformas crecen sobre el camino A* |
| CL | `→` | TM | el camino se parte en tomas |
| VO | `=` | TM | punto de vista de la plataforma = toma |
| CU | `=` | TM | perfil de cámara por sala = la cámara de la toma |
| AP | `→` | TM | ordenar la altura por profundidad necesita la toma |
| LT | `<` | TT | Down / Mid / Up del lego son tres tratamientos temáticos |
| LT | `<` | AP | el lego Up implementa AP |
| TT | `→` | AP | el tratamiento define la dirección en Y |
| VM | `<` | AP | vecinos detrás altos, delante bajos |
| CU | `=` | DP | narrow / wide y deep son cómo se lee el tamaño en profundidad |
| FG | `<` | DP | filas de estatuas, ritmo de árboles, landmark al fondo: tamaños conocidos en profundidad |
| EM | `<` | AP | la meta del fondo alta es AP |

## 4. Lo que corrigió la lectura (A627)

1. **HO no está debilitada.** Yo había escrito que la GDC la debilitaba. Leída, HO ya dice que Octopath viene del 2.5D
   oblicuo de 16 bits (FF6); la GDC lo confirma (gramática de 16 bits: suelo desde arriba, edificios de frente).
2. **A083 no descartó elevar la meta como diseño.** Bajó el escalón del POI porque causaba oclusión de baldosas
   diagonales en el visor, y dejó la tarima como calcomanía. EM no choca con un principio: choca con un problema de
   render.
3. **DEF (A427) es una decisión de [U] (`[D]`), no una hipótesis en lv2.**
4. **Choque nuevo: LT × SA.** El lego hace saltos grandes; en la hoja top-down, que es la natural de EvoDun (A498),
   A247 los prohíbe salvo vestidos de arquitectura (eso es de la hoja 2.5D).
5. **Tensiones abiertas:** CF ? AP (¿el fondo más chico, A481, o más alto, GDC?) y RS ? HT1 (¿el recinto lo entrega
   el generador, A465, o lo produce la transformación, pares 8/8?).

## 5. Estructura que muestra la matriz (sin cerrar conclusiones)

- **Bloque de linaje / conversión por capas:** PC, HO, LI y S16 se cruzan con `=` entre sí; HT1 queda debajo como
  caso (`<` de HO y de LI). Es la línea de [U]: 8 bits → 16 bits → hoja (2.5D) → HD-2D.
- **Bloque de lugar:** RS, CL, VO y TM se cruzan con `=` entre sí.
- **HT1 es el nodo más cruzado (12):** CF, EM, LT y VM son casos suyos; S16, DEF y AP comparten raíz con él.
- **AP es el segundo (9):** hace de puente entre la conversión (HT1, DEF) y la toma (TM).
- **Tipo:** HT2, TT y FG comparten raíz (el tipo decide el tratamiento).
- **Cuatro choques o tensiones:** DEF × CU, LT × SA, CF ? AP, RS ? HT1.
