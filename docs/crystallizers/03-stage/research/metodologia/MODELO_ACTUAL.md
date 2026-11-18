# MODELO ACTUAL — vista 2D-HD del modo 3 (Stage)

**Versión:** v1 · 2026-11-18 · [R] con decisiones de [U] · cubre el Registro hasta A464.
**Qué es:** la ÚNICA fuente de verdad de cómo se construye hoy una vista 2D-HD en el visor. Todo pedido a CC la cita; donde un documento anterior diga otra cosa, vale este. Reemplaza como referencia a `METODOLOGIA_GENERACION_DQ3_v318`, `v325` y al §9 del informe integrado v319 (que siguen como historia).
**Cómo se actualiza:** cada cambio sube la versión, se anota en §17 con el ID del Registro que lo causa, y nunca se borra una regla: se marca SUPERADA con el ID que la reemplaza. Cada línea lleva su fuente (ID del Registro, nota o documento) y su estado.

Etiquetas: **[U]** usuario · **[R]** revisor (Claude) · **CC** Claude Code · **H** = altura del héroe. Estados: **DECIDIDO** ([U]) · **VALIDADO** (medido) · **HIPÓTESIS** · **NUNCA PROBADO** · **DESCARTADO**. Coordenadas de pantalla en fracción del cuadro: x de 0 (izquierda) a 1; y de 0 (arriba) a 1.

---

## 1. Norte y alcance
- **Meta:** una maqueta 2D-HD **general** en el modo 3 del visor. Un mapa (DAC, mapa viejo o mapa nuevo sin assets) se convierte por reglas en una escena 3D simple: cubos, volúmenes, billboards y calcomanías. Vista con la cámara, **se parece en composición** a un juego 2D-HD. DQ3 es la primera prueba; Octopath Traveler, Triangle Strategy y Wandering Sword vienen después (BRÚJULA; A008). DECIDIDO.
- **«Parecerse» es composición, no look:** capas, cierre del fondo, ancho de ruta, escala del héroe y planos. Luz, desenfoque, texturas y color se juzgan en Unity (L01, T03, T15). Con cubos apilados basta. DECIDIDO.
- **Dos pruebas** (Ancla v1, propuesta sin aprobar):
  - **Capacidad:** reproducir a mano una escena de referencia. Hecha: Forest, trono y desierto ≈ 9,5 (A384).
  - **Generación:** las reglas solas, sobre un mapa no usado y en ciego. **Pendiente: es lo que falta.**
- **Solo salas generadas (DAC o aleatorias) o mapas viejos.** Nunca una sala copiada ni ajustada a una toma de DQ3 (A459). DECIDIDO.

## 2. Roles y método
- **[U]** decide y juzga mirando; es el único con la perspectiva completa (A398).
- **[R]** diseña, mide simple contra las tomas, escribe los pedidos y no hace maquetas (A419).
- **CC** construye todo (trucos incluidos), renderiza y mide; no juzga composición (A407).
- **Sin agentes ni jueces automáticos**, salvo permiso explícito de [U] (A417, A419). DECIDIDO.
- **Pausa tras cada etapa;** respuestas concisas; el Registro se nombra por ID (A398).
- **Lo que rinde** (A456):
  - mediciones simples contra las tomas;
  - el juicio directo de [U];
  - predicciones y paradas antes de correr;
  - hashes ×2;
  - una variable por pase o atribución por quita-uno.
- **Evaluar un truco es medir su efecto** (horizonte, verticalidad, elevar la vista), no su visibilidad (A414). DECIDIDO.
- **Un criterio sacado de las mismas tomas que se juzgan es circular** (A321). VALIDADO.
- **Todo pedido de truco lleva su ficha de 11 campos con puerta de presencia** (A357; `INFORME_METODO_TRUCOS_v318` para el formato). DECIDIDO.

## 3. Vocabulario
| Término | Definición | Fuente |
|---|---|---|
| Verde / azul / rojo | Verde = suelo transitable y continuo (las escaleras son micro-terrazas). Azul = no transitable. Rojo = overlay decorativo y obstructivo, con al menos un pie en azul; apagado, queda el mapa completo | A089, A107, A112 · DECIDIDO |
| Capas P / G / R / F | P = primer plano · G = guía (el eje o camino que lleva el ojo) · R = ruta y meta · F = fondo que cierra | Bosque, A023 · VALIDADO |
| Banda B1–B5 | franjas de igual profundidad en Z, desde la fila que toca el borde inferior hasta el último tile de la sala; **se cuentan de abajo hacia arriba**: B1 = primer plano, B5 = fondo | DEFINICIONES_T26 §1; A429 · DECIDIDO |
| Función de banda | primer plano · guía · meta · fondo · vistazo (la dominante) | A312 |
| Plano | banda + lo que tiene altura y tapa lo de atrás. «Esa profundidad es lo que nos hace HD-2D y no 3D incompleto» | A175, A311 · DECIDIDO |
| Eje de la sala | X (cruce lateral), Z (hacia el fondo), Hub (equidistante) | A312 · DECIDIDO |
| Hotspot | siempre transitable; central salvo POI (que lo contiene); **sobre la línea de flujo** | A202, A206 · DECIDIDO |
| Vistazo / mirador | terreno de otra sala visible por encima del cierre; se deduce del mapa y la cámara. V(p) = % del cuadro con terreno de otra sala. Mirador = posición transitable con V máximo | A313, DEFINICIONES_T26 §6 |
| Fondo abierto ≠ vistazo | fondo abierto = píxeles vacíos en B4–B5; vistazo = terreno de otra sala ahí | DEFINICIONES_T26 §7 |
| Isla | cada sala puede ser isla; sus bordes (muros, parapetos, barandas) son sólidos y visibles; lo de más allá «se ve pero no se alcanza» | A203, A217 · DECIDIDO |
| Horizonte local | el horizonte está DENTRO de la misma sala (no lejano) | A247 · DECIDIDO |
| k0…k8, k_mir | posiciones del camino de props `camino[floor(i·(N−1)/8 + 0,5)]`; k_mir = mirador sobre el eje a ≤ 4 tiles del borde de fondo | INFORME_METODO_TRUCOS |

## 4. Cámara (medida en DQ3)
| Parámetro | Valor | Fuente · estado |
|---|---|---|
| Tipo | Cam 6: perspectiva **normal** (no hay vista telescópica ni compresión de profundidad) | A449, A451 · VALIDADO |
| FOV | 30° | A425 · VALIDADO |
| Pitch | **interior 25** (medido 24–28); **exterior abierto ~38** (desierto 37–40). Hasta que exista un parámetro por zona, va por gancho del arnés (T55) | A450, A454 · VALIDADO |
| Distancia | `heroFrac` **0,10** → D ≈ 19,5 H del héroe. El pivote está a media altura del héroe (k ≈ 0,89–0,96), así que la distancia efectiva es D/k | A443, A450 · VALIDADO |
| Compresión K | **1** (la Cam 8 `zScale` no se usa; PR #94 sin justificación) | A451 · VALIDADO |
| Fórmula de escala | s = (D/k) / (D/k + g · cos pitch), con g = suelo detrás del héroe; el visor la cumple con 0,000 | A445 · VALIDADO |
| Cifras de referencia (heroFrac 0,10) | s 0,60 a ≈ 14 H y s 0,55 a ≈ 17 H detrás del héroe, en y ≈ 0,16 y 0,12 de pantalla; con heroFrac 0,14 las cifras son 10,5 y 12,9 H. Al sur crece ~5–7 % por H | t5, A444 · VALIDADO |
| Pies del héroe (`heroScreen`) | interior (0,47; 0,51) como 0202; exterior (0,50; 0,65) como el desierto | A429, A453 · VALIDADO (lectura) |
| Lo que NO cierra un fondo | subir el pitch (15,7 → 10,1 % de vacío); el cierre es geometría | T11 · VALIDADO |
| Instrumento | Cam 5 cenital (ortográfica, ~89°) con el mapa superpuesto, como control de colocación; no es cámara de juego | A204, A208 · VALIDADO |

## 5. Escala y alturas
| Parámetro | Valor | Fuente · estado |
|---|---|---|
| `tilesPerH` | **1,5** | A159, **A463** · DECIDIDO |
| Altura de terraza | **1,25 H** | A373, **A463** · DECIDIDO |
| Subterrazas | **`subs` 2** (dejan el bordillo continuo en la franja media; `subs` 1 lo borraba) | A345, **A463** · DECIDIDO |
| Terrazas | `terraces` 3 como máximo | A343 · DECIDIDO |
| Peldaño resultante | ≈ 0,275 H (subnivel = 0,22 × terraza): **calculado**, CC lo confirma en el visor | cálculo de [R] |
| Configuración en el visor | «Measures in H» OFF; `terH` = 1,25 × 1,5 = 1,875 tiles | cálculo de [R] |
| `exag` / `vScale` | **1 / 1**; las alturas van por pieza en el dato (dato = aparente con exag 1). Globales: descartados | A345, A162 · DECIDIDO |
| Héroe en pantalla | ancho ≈ 0,030 en todos los cuadros medidos (A440); alto 0,107 en 0202 y 0,128 en 0137 (A366): **diferencia sin explicar**, se informa | VALIDADO / abierto |

**Alturas por pieza (en H, medidas en DQ3):**
| Pieza | Altura | Fuente |
|---|---|---|
| Baranda o balaustrada | 1,0–1,4 (0202: 1,34–1,42; 0149: 0,70) | A450, A210 |
| Postes de baranda | ~1,6 | A210 |
| Parapeto / borde de isla | 0,7–1,6 (los bordes fallan sobre todo por altura) | A210 |
| Muro bajo / pared del fondo | 1,2–1,3 | A210 |
| Pilares de escalera o pasillo | 3,7–5 | A152 |
| Pilares cercanos que salen del cuadro | ≈ 5 (no 7–11) | A433 |
| Estatua sobre plinto | ≈ 3,9 | A212 |
| Muros de cierre altos (sin vecina) | 5 (`planes`) a 8 (trono); con pilares de 5 | A300, A284 |
| Escalera del remake | ≈ 4,5 H de largo donde el mapa viejo tenía ≈ 1,4 | A141 |
| Pasillo de pilares (30:55) | ancho ≈ 4,9 H; pilar cada ≈ 7,3 H | t6 · VALIDADO |

## 6. Terreno
- **DQ3 es «súper plano»:** suelo plano por zonas y el cambio de altura concentrado en escaleras de micro-terrazas. Primero plano; después, los bordes disimulan (A090). DECIDIDO.
- **Escaleras:**
  - ≥ 4 peldaños visibles;
  - ensanchadas a **≥ 5 integrantes (≈ 3 H)** lado a lado;
  - alineadas con el flujo;
  - una por paso entre niveles.

  (A182, A194, B1). DECIDIDO como escala; la escalera como truco: NUNCA PROBADO.
- **No elevar el POI;** la tarima es baja (~1 subnivel) (A083). VALIDADO.
- **`pre` 0** donde un muro alto toca el suelo; si no, se vuelve una rampa de 2 tiles (A046). VALIDADO.
- **`terraces` y `subs` cambian máscara, camino, orientación y meta:** se declaran los hashes (A258, A303). VALIDADO.
- **Lo que el mapa viejo no trae:** niveles, plinto, escaleras laterales ni parapetos; ninguna regla de `src/` los deduce. Se suponen por reglas y se juzgan por composición (A073, A229). VALIDADO.
- **DAC no trae las precondiciones de los trucos:** borde de fondo largo, borde lateral libre, escaleras en cuadro, recinto (A378, A382). Sus salas son 4–15 veces más anchas que un pasillo de DQ; la ruta pasa lejos de los muros; el bloqueado está a 3–12 tiles y de un solo lado (v32, A288). Por eso **el recinto se construye** (rojo o volumen con pie en azul, también fuera de la sala). VALIDADO.

## 7. Modelo de escena y reglas del modo 3
- **Orden de trabajo** (A107): topología plana (≈ 60 %) → leer y definir el rojo → deducir qué hay detrás → anclarlo.
- **Lo estructural es geometría;** el billboard es solo para personajes, vegetación suelta y atrezo (regla 1).
- **Billboards más rojo ≤ 30 % de la pantalla** (regla 9; A111).
- **El suelo son bloques pintados;** las cintas y calcomanías no cuentan como billboard (regla 10).
- **Escena, no toma** (regla 2): un ejemplo es un mundo que sobrevive a mover al héroe; se juzga con caminata (regla 4).
- **Un ejemplo declara su mapa de origen y sus reglas encendidas** (`orient`, `planes`, `props`, `volumes`); apagarlas para igualar una foto es la degeneración D1 (reglas 5 y 3; A036).
- **El rojo puede tapar al héroe un momento** (A102), nunca en el hotspot.
- **Alarmas A1–A14** y pre-vuelo: informe integrado v319 §3.6 y PLANTILLA §5.

## 8. Bandas, horizonte, vistazo y proporciones
- **Lectura de [U] de las bandas** (A429):
  - **0202:** banda 1 = escalera sur; banda 2 = héroe (y 0,45–0,56, detrás de lo alto de la escalera); lo lejano en y 0–0,18.
  - **0137:** lo lejano baja hasta y 0,51, junto al héroe.
- **Héroe en B2** en interiores tipo 0202, con B1 delante (escalera o borde). DECIDIDO como objetivo.
- **Ver adelante:** **25–40 % del cuadro** se dedica a ver más allá del héroe; el horizonte es local, dentro de la sala (A247). DECIDIDO.
  - En interior, el borde del fondo cae entre **y 0,10 y 0,25**.
- **Proporciones:** el fondo útil de la sala cae hacia **s ≈ 0,55** (≈ 17 H detrás del héroe con heroFrac 0,10) (A452). HIPÓTESIS de diseño: **se mide, no se fuerza**.
  - T3 reprodujo 0202 con la cámara sola cuando la sala tenía las proporciones correctas (A430): las proporciones son la palanca.
- **Vistazo (A1) y cierre en dos planos (A2):** ganó 9–0 en una sala DAC no usada (A336). VALIDADO.
  1. BACK de `planes` → baranda de 1,0–1,4 H.
  2. Ventana mínima que incluya **entera** la vecina.
  3. Vecina ±Δ, el menor de {0; ±0,5; …; ±4} H con **V(k4) ≥ 10 %**. Δ negativo = la sala actual como mirador alto (0137).
  4. Sin vecina: cierre ≥ 3 H + fondo construido (A4).
  - **Cifras:** barrera ≤ 0,08 del cuadro; masa lejana visible sobre ella en ≥ 30 % de su ancho.
- **Fondo:** nunca píxeles vacíos (**vacío ≤ 2 %**). El remake pinta un fondo de color. Bajar muros expone el vacío y deja la sala como diorama flotante (A084, A280). VALIDADO.

## 9. Héroe y encuadre
- **Pies** en (0,47; 0,51) en interior y (0,50; 0,65) en exterior.
- **Encuadre de A6:** fy se ajusta en [0,45; 0,80] para que la línea de nivel caiga en y 0,40–0,60. Si no alcanza, se usa k_mir y se declara.
- **El héroe nunca queda cortado en la cintura por una línea;** va por encima (0202) o por debajo (0137).
- **Eje:** cruza el cuadro en x ∈ [0,40; 0,65] de B1 a B4, con el héroe sobre él (C1). REGLA.
- **Centro del cuadro abierto hasta el fondo;** masas en los bordes laterales (L37, A342). VALIDADO (juicios).
- **Obstructores por posición en pantalla,** no por coordenadas de mapa (A342, A350). VALIDADO.

## 10. Estructuras de encuadre y señales (aprobadas por [U], A413)
| Pieza | Cifras en pantalla | Receta | Estado |
|---|---|---|---|
| **A7 · corte del lado de cámara** | ningún muro de cierre en y > 0,85 | `planesTest.noFront` | REGLA |
| **C1 · eje y hotspot** | §9 | `orient` con POI primero | REGLA |
| **A6 · línea de nivel** | borde superior en y 0,40–0,60, continua en ≥ 70 % del ancho; **baranda calada** (pasamanos + postes), **no muro almenado** (A408) | sobre el BACK del vistazo o el borde de terraza más largo en X; postes de ~1,6 H cada 3–4 tiles; encuadre de §9 | **funciona** ([U]); quita-uno +0,67 (A405) |
| **Secuencia de pilares** (A3 corregido) | pares a los lados del eje que se alejan; tercio central abierto; los cercanos salen por arriba; nunca pegados al muro (≥ 0,02 del ancho de aire) | pilares de ≈ 5 H cada ≈ 7,3 H, a ≥ 3 H del camino; por ejemplo 2 por banda de B2 a B5 con B1 vacía (0156, A215) | A3a suelto **falla**; necesita secuencia ([U]) |
| **C2 · par en la transición** | columnas en x [0,30; 0,48] y [0,60; 0,80]; hueco ≥ 0,17 del ancho; tapan ≤ 10 % del héroe | **un solo par por sala**, 2 × 2 tiles, **en la misma banda que su escalera**, cimas esbeltas | buen truco, mal aplicado en la sala T (escalera en B1, búhos en B5 hasta el borde, cimas anchas) |
| **C3 · calcomanía** | 4 × 4 a 6 × 6 tiles, 3–8 % del cuadro, B2–B3; **tenue, color del piso, fuera de los pies del héroe** | anillo + estrella junto al hotspot, a 1–4 tiles del héroe | **aprobado**; quita-uno +0,50 (A405) |
| **A4/A5 · vano focal** | rectángulo claro 0,08–0,16 × 0,10–0,20 del cuadro, centro en x [0,40; 0,62], y [0,05; 0,25]; el más contrastado del cuadro | hueco de 2–3 tiles en el cierre lejano o billboard plano pegado a su cara; nunca un volumen | **válido**, pero la prueba necesita luz real (Unity) |
| **Landmark** (S4c) | completo de lejos, fragmento de cerca (dos lecturas, H10) | `kind: 'landmark'` sobre la meta alta | mecanismo existente; regla de colocación de C3 (props) |

**Líneas de fuga.** La perspectiva solo se lee si hay cosas de tamaño conocido repartidas en profundidad: «H8 depende de H10», los desaplanadores de v66. La secuencia de pilares, las losas de la calcomanía, la escalera y la baranda van en **bandas distintas**. Una sala con un solo plano vertical se ve casi ortográfica aunque la cámara tenga perspectiva. VALIDADO como razonamiento (v66); [U]: «el 2D-HD busca más deformación, no menos» (A427).

## 11. Exterior
- **Pitch** ~38 y **pies** en (0,50; 0,65) (A454).
- **Línea de nivel:** borde de terraza, muro bajo o fila de árboles.
- **Recinto:** vegetación y taludes; una fila de árboles con ritmo hace de secuencia de pilares (v37).
- **Árboles** como volumen; el follaje suelto como billboard. Sin columnas de `planes` en orillas de agua (v176).
- **P:** oclusores en las esquinas inferiores (rocas, follaje), solo si existen como azul cerca de la cámara.
- **F:** fondo poblado hasta el borde (torre o masa).
- **Camino:** 1,2–2,4 H. El agua nunca se clasifica en `planes`.
- **Héroe** 0,09–0,13 en las tomas del bosque (A004).

## 12. Patrones de las tomas (lectura a ojo ±0,02; ver informe integrado, anexo F)
- **Comunes a 0137 y 0202:**
  1. Línea de nivel continua entre y 0,42 y 0,60, de ≥ 70 % del ancho.
  2. Masas altas en los bordes o en un par que enmarca al héroe.
  3. Masas bajas en las esquinas inferiores.
  4. Centro abierto hasta un fondo con algo luminoso o escalonado.
  5. Calcomanía junto al héroe, no en el camino.
- **0202:**
  - búhos en x 0,35–0,46 y 0,65–0,77 (hueco ≈ 0,19);
  - escalera sobre el eje en x 0,45–0,66, y 0,62–0,90;
  - pretil en y 0,53–0,60;
  - plintos de esquina;
  - balaustrada lejana en y 0,10–0,17.
- **0137:**
  - héroe x 0,61–0,65, pies y 0,74;
  - balaustrada x 0,30–1,00, y 0,42–0,57;
  - dragón en primer plano a la izquierda;
  - columnas con farol a la izquierda;
  - ventana luminosa x 0,48–0,62, y 0,05–0,21.
- **Pasillo de pilares (30:55):** pares de pilares oscuros cada ≈ 7,3 H, losas de ≈ 4,9 H, búhos al fondo sobre un descansillo.
- **Desierto:** camino centrado, esfinges en fila a los lados (secuencia), arcos de primer plano en las esquinas, pitch alto.
- **TECHO de la sala T** (A402, juez calibrado), ganancia por ítem: marca +3,0, línea media +2,4, esquinas +1,9, marco +1,0, fondo −0,5.

## 13. Mecanismos del visor que se usan (árbol `e882c5c`; detalle en CLAUDE.md del repo)
| Mecanismo | Uso en el modelo |
|---|---|
| `orient` (C1) | eje por sala, POI primero; yaw en múltiplos de 90 |
| `planes` (C2) | BACK = cierre (o baranda + vistazo); SIDE = columnas; FRONT bajado (A7); 3 H por defecto, 5 H sube el marco (A300) |
| `props` (C3) | camino central, antorchas, par en la salida, landmark en la mitad trasera de la última sala |
| `volumes` (S4b) | volúmenes solo sobre tiles bloqueados (S4b no levanta sobre verde; margen ≥ 2 tiles a un escalón) |
| `objects` / landmark (S4a / S4c) | billboards y landmark de dos lecturas |
| Cintas (`ribbon`) | calcomanías (C3); no cuentan como billboard |
| `heroScreen`, `heroFrac`, `heroAt` | encuadre (§9) |
| Ventana de salas | incluye la vecina entera para el vistazo |
| `stageBorder` | solo visual: no cierra el fondo (A259, A289) |
| Arnés (`harness_salat`, t5/t6) | inyecta packs y ganchos de cámara sin tocar `src/` |

## 14. Controles y caminata
- **Por posición:**
  - héroe ± 5 % entre estados;
  - vacío ≤ 2 % (el trono llegó a ≤ 0,05 %);
  - billboards más rojo ≤ 30 %;
  - ninguna baldosa del camino con > 25 % perdido por un volumen (35 % en contrahuellas, declarado);
  - héroe tapado > 25 % solo por rojo y nunca en el hotspot;
  - hashes ×2;
  - máscara, camino y meta iguales entre estados o el diff declarado.
- **Caminata:** k0…k8 + k_mir; yaw constante dentro de una sala; ningún salto > 2,5 veces la mediana; sin vacío, sin terreno ajeno, sin losas a media sala; meta en cuadro (regla 4; A253).
- **Medidas estándar:**
  - fila de los pies;
  - fila de la línea de nivel;
  - borde del fondo;
  - % ver adelante;
  - V(p);
  - s del fondo;
  - profundidad útil detrás del hotspot;
  - banda del héroe;
  - % billboards más rojo;
  - % vacío;
  - render de ids por pieza.

  Se mide con la misma definición de transitable que las reglas (A242).

## 15. Nunca probados, descartados e hipótesis
- **NUNCA PROBADOS (pulido o más adelante):**
  - A3b, masa baja de esquina (en TECHO aportó +1,9; nunca con puerta válida);
  - A8, paso por detrás (puede pedir `src/`);
  - A416, centro del encuadre corrido hacia el avance;
  - el modelo de cámara de [U] (A428: prioridad en Z, trabada en X cerca de los bordes, barandas como espacio negativo, hub recentrado);
  - el bloqueo suave (A434);
  - B1 como truco, B3 altura fingida, B5 cara de caída, N1 escalera–estatua–escalera (A214, A217);
  - C5, C7 más allá del ajuste de A6;
  - pitch por zona como parámetro del visor (T55).
- **DESCARTADOS:**
  - cámara casi ortográfica C6 / FOV bajo (A347, A425);
  - profundidad comprimida B6 / Cam 8 (A451);
  - vista telescópica (A449);
  - `exag` y `vScale` globales; `subs` 1 como relieve concentrado (A345);
  - cinta de camino como guía (A360);
  - `stageBorder` como cierre;
  - bajar los muros;
  - billboards como suelo, muros o pilares (D1);
  - rúbrica J1–J3 como juez (A321);
  - jueces automáticos (A417);
  - elevar el POI.
- **HIPÓTESIS abiertas:**
  - masa lejana real contra fondo construido (A337);
  - ¿la columna suelta gana por separación o por posición? (T46);
  - la diferencia de alto del héroe entre 0202 y 0137 (A366);
  - la regla de proporciones s ≈ 0,55 (A452).

## 16. Abierto (lo que falta contra la meta)
1. **Punto de control con todo este modelo** sobre DAC 44, DAC 14 y Forest A (`r15/stage_control_3salas_go.md`, A458–A463).
2. **Prueba de Generación ciega** (R1.3/R2) sobre un mapa no usado.
3. **Generalidad de la cámara** en otro juego 2D-HD (Octopath o Triangle Strategy).
4. **Ancla v1 sin aprobar.**
5. **Decisiones pendientes de [U]:** PR #93 y #94; T02/T48 sobre #92; tests de #91.

## 17. Historial
| Versión | Fecha | Cambio | IDs |
|---|---|---|---|
| v1 | 2026-11-18 | Creación: compila el informe integrado v319, las fichas v318, la BRÚJULA, la PLANTILLA, las DEFINICIONES de T26, la v66 y el Registro A358–A462; aplica las decisiones de [U] de escala (`tilesPerH` 1,5), terraza (1,25 H) y subterrazas (2) | A463, A464 |
