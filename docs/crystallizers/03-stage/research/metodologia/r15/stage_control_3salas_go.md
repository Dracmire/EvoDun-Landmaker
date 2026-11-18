# Pedido a CC · Punto de control: la vista 2D-HD con TODO lo acumulado (3 salas) — v329

**Para qué.** R1.5 (trucos) quedó cerrada. [U] quiere ver **la mejor vista 2D-HD que hoy sabemos construir**, con todo el conocimiento acumulado aplicado a la vez sobre salas que no vienen de DQ3. **No quiere una sala DAC común con la cámara cambiada:** una celda TODO que se vea como la DAC por defecto es un fallo de este pedido; se informa como tal, no se entrega como resultado.

**Tu papel.** Construyes, renderizas, mides y armas las hojas. No juzgas composición: juzga [U] mirando. Sin agentes y sin jueces.

**Fuente de verdad: `../MODELO_ACTUAL.md` (v1).** Si este pedido y el modelo difieren, PARA y dilo. Fuentes de detalle (todas en el proyecto `claude/` o en esta carpeta; ábrelas si una regla no te queda clara):
- `INFORME_metodologia_HD2D_DQ3.md` (integrado v319): §3 (vocabulario, modelo verde/azul/rojo, capas P/G/R/F, bandas, reglas 1–11, alarmas) y los anexos E y F.
- `INFORME_METODO_TRUCOS_v318.md`: fichas con cifras de pantalla (A1, A2, A3a, A4, A6, A7, C1, C2, C3, C4).
- `DEFINICIONES_T26_v311.md`: banda, plano, función de banda, vistazo y mirador.
- `PLANTILLA_escena_dorada_modo3.md`: herramientas de verticalidad, umbrales y callejones sin salida.
- `METODOLOGIA_GENERACION_DQ3_v325.md`, en esta carpeta: los cambios de R1.5.

**Este pedido baja todo eso a cifras.** Donde una fuente vieja y este pedido difieren, vale este pedido.

## 0. Reglas del pedido
- Árbol del visor `e882c5c` en un worktree aparte. **Sin tocar `src/`.** Cámara, piezas y datos van por el arnés (ganchos e inyección de pack), como en salat, t5 y t6.
- **Solo salas generadas (DAC) o un mapa viejo.** Nada copiado ni ajustado a una toma de DQ3. No hacen falta tomas de terceros.
- **Se puede construir sobre la sala:**
  - volúmenes;
  - overlay rojo;
  - barandas, pilares y escaleras;
  - calcomanías;
  - cierres;
  - la vecina para el vistazo.

  Cada pieza va marcada **POR REGLA** (la pone una regla del visor o del arnés a partir del mapa) o **A MANO**. Las dos valen; la hoja dice cuál es cuál.
- **No se toca la topología transitable,** salvo tres cosas, declaradas con su diff de máscara:
  - ensanchar pasos a ≥ 3 H;
  - convertir un paso entre niveles en escalera;
  - aplanar por zona (§3.2).

## 1. Las tres salas
| # | Sala | Qué representa |
|---|---|---|
| 1 | **DAC 44** (ejemplo `mockt_x44`, Cake, eje X) | sala generada, recorrido lateral |
| 2 | **DAC 14** (ejemplo `mockt_z14`, Ascension, eje Z) | sala generada, recorrido hacia el fondo (el caso de pasillo de dungeon) |
| 3 | **Forest A** (ejemplo `forest_a`, mapa viejo, meta por POI) | exterior abierto |

Si una no carga o no tiene caminata, PARADA para esa sala sola, y sigues con las otras.

**Aviso de los datos** (v32 B1–B2): las salas DAC son 4–15 veces más anchas que un pasillo de DQ y la ruta pasa lejos de los muros; el bloqueado más cercano está a 3–12 tiles y de un solo lado. Por eso el recinto y las masas se construyen como rojo o volumen con pie en azul, también **fuera de la sala** (el frente cortado y las vecinas). Comprueba primero que el arnés lo permite; si no, PARADA.

## 2. Tres estados por sala
- **BASE:** el ejemplo tal como está hoy.
- **CÁMARA:** solo §3.1 y §3.2 (cámara, escala y terreno). Sirve para separar cuánto aporta la cámara y cuánto la composición.
- **TODO:** todo §3.

## 3. Lo que lleva TODO (todo esto, en este orden)

### 3.1 Cámara y escala (medidas en DQ3; la prueba de distancia confirmó la fórmula con 0,000)
| Parámetro | Valor | Fuente |
|---|---|---|
| Cámara | Cam 6, perspectiva normal, FOV 30, **K 1** (sin Cam 8) | A425, A449, A451 |
| Pitch | **25 en DAC 44 y DAC 14** (interior, medido 24–28); **38 en Forest A** (exterior abierto, medido 37–40) | A450, A454 |
| Distancia al héroe | `heroFrac` **0,10** (coronilla al centro del punto de los pies) → D ≈ 19,5 H; el pivote queda a media altura del héroe (k ≈ 0,95) | A443, A450 |
| Escala | `tilesPerH` **1,5** (decidido, A463). Héroe: ancho ≈ 0,030 en todos los cuadros (A440); alto 0,107 en 0202 y 0,128 en 0137 (A366; diferencia sin explicar, se informa, no se corrige) | A159, A373, A366, A440 |
| Alturas | `exag` **1**, `vScale` **1**; toda altura va por pieza, en el dato (§3.6) | A345, B4/B7 |
| Pies del héroe (`heroScreen`) | interior (0,47; 0,51) como 0202; exterior (0,50; 0,65); el ajuste de A6 (§3.5) puede moverlo con fy ∈ [0,45; 0,80] | A6, C7 |
| Perspectiva que hay que ver | con la cámara normal, un suelo a 10,5 H detrás del héroe se ve a 0,60 y uno a 12,9 H a 0,55; al sur crece 7 % por H | t5, A444, A445 |

### 3.2 Terreno
- **Terreno (decidido, A463):** `terraces` 3; altura de terraza **1,25 H** («Measures in H» OFF, `terH` = 1,875 tiles con `tilesPerH` 1,5); **`subs` 2** (peldaño ≈ 0,275 H, calculado: confírmalo en el visor e infórmalo).
- **DQ3 es «súper plano»:** suelo plano por zonas y el cambio de altura concentrado en escaleras de micro-terrazas. Si una zona transitable tiene relieve repartido, se aplana a su mediana (declarado).
- **Escaleras:** ≥ 4 peldaños visibles, ensanchadas a **≥ 3 H** (5 integrantes lado a lado), alineadas con el flujo. Referencia: la escalera del remake mide ≈ 4,5 H donde el mapa viejo tenía ≈ 1,4 H.
- **No elevar el POI:** la tarima es baja, ≈ 1 subnivel. Elevarlo no funcionó (A083).
- **`pre` 0 donde un muro alto toca el suelo:** si no, se vuelve una rampa de 2 tiles.

### 3.3 Modelo de escena (verde / azul / rojo) y capas
- **Verde:** suelo transitable y continuo. **Azul:** no transitable. **Rojo:** overlay decorativo y obstructivo (barandas, pilares cercanos, parapetos, vigas), con al menos un pie en azul, nunca solo sobre verde.
- **Orden:** topología plana → definir el rojo → deducir qué hay detrás → anclarlo.
- **Lo estructural es geometría** (suelo, muros, pilares, masas de primer plano). El billboard es solo para personajes, vegetación suelta y atrezo.
- **Billboards más rojo ≤ 30 % de la pantalla.** Las calcomanías y cintas no cuentan.
- **El rojo puede tapar al héroe un momento,** nunca en el hotspot.
- **Cuatro capas del encuadre en cada cuadro:**
  - **P,** primer plano;
  - **G,** guía (el eje o camino que lleva el ojo);
  - **R,** ruta y meta;
  - **F,** fondo que cierra.

  En el informe dices qué pieza hace cada capa.

### 3.4 Bandas, horizonte y vistazo
- **Bandas B1–B5:**
  - son franjas de igual profundidad en Z, desde la fila que toca el borde inferior hasta el último tile de la sala;
  - se numeran **de abajo hacia arriba**: B1 = primer plano, B5 = fondo;
  - cada banda tiene una función dominante: primer plano, guía, meta, fondo o vistazo;
  - **plano** = banda + lo que tiene altura y tapa lo de atrás.
- **Héroe en la banda 2:** con el héroe en el hotspot, B1 queda delante, como la escalera de 0202, y el héroe en B2. Si no cae así, se ajusta `heroScreen` dentro de su rango y se informa.
- **Ver adelante:** **25–40 % del cuadro** se dedica a ver más allá del héroe (A247). Se mide como la fracción del cuadro por encima de la línea de nivel (A6) que muestra suelo lejano, vistazo o fondo construido. Bandas leídas por [U] (A429): en 0202 la franja lejana va de y 0 a 0,18 y el héroe está en y 0,45–0,56, detrás de lo alto de la escalera sur; en 0137 lo lejano baja hasta y 0,51, junto al héroe. Objetivo en interior tipo 0202: borde del fondo entre **y 0,10 y 0,25**.
- **Proporciones:** la profundidad útil detrás del hotspot debería dar s ≈ 0,55 en el fondo, unos 17 H con `heroFrac` 0,10. **Se mide, no se fuerza:** no se alarga ni se corta ninguna sala.
- **Vistazo (A1) y cierre en dos planos (A2):** ganó 9–0 en una sala DAC no usada.
  1. Cierre BACK de `planes` → baranda de 1,0–1,4 H.
  2. Margen de ventana mínimo que incluya **entera** la sala vecina.
  3. La vecina sube o baja Δ, el menor de {0; ±0,5; …; ±4} H con **V(k4) ≥ 10 %**. Δ negativo es el caso de 0137 (la sala actual como mirador alto).
  4. Sin vecina válida, cierre ≥ 3 H más fondo construido (A4).
  - **Cifras que debe cumplir:** barrera aparente ≤ 0,08 del cuadro; la masa lejana visible sobre ella en ≥ 30 % de su ancho.
- **Fondo:** el remake pinta un fondo de color (fondo ≠ vacío). Nunca píxeles vacíos: **vacío ≤ 2 %**. Bajar los muros expone el vacío y deja la sala como diorama flotante.

### 3.5 Estructuras de encuadre y señales (las aprobadas por [U])
| Pieza | Cifras en pantalla (posición del hotspot) | Receta |
|---|---|---|
| **A7 · corte del lado de cámara** | ningún muro de cierre en y > 0,85 | `planesTest.noFront` |
| **C1 · eje y hotspot** | el eje cruza el cuadro en x ∈ [0,40; 0,65] de B1 a B4; el héroe sobre él; el hotspot es transitable, central salvo POI, sobre el flujo | `orient` con POI primero |
| **A6 · línea de nivel** | borde superior entre **y 0,40 y 0,60**, continua en **≥ 70 % del ancho**; una **baranda calada** (pasamanos + postes; se ve a través), **no un muro almenado** (falla de la sala T, A408); 1,0–1,4 H con postes de ~1,6 H cada 3–4 tiles; el héroe por encima o por debajo, **nunca cortado en la cintura**. En el quita-uno aportó +0,67 (A405) | sobre el BACK del vistazo o sobre el borde de terraza más largo en X; luego **encuadre:** ajustar `heroScreen` fy en [0,45; 0,80] hasta que la línea entre en la franja; si no entra, usar k_mir y declararlo |
| **A3 en secuencia · pilares que dan la perspectiva** | 3 o más pares a los lados del eje, alejándose; tercio central abierto (nada en x 0,22–0,78 salvo el par de C2); los cercanos salen por arriba; separados de cualquier muro (≥ 0,02 del ancho de aire) | pilares de **≈ 5 H** cada **≈ 7,3 H** a lo largo del eje, a ≥ 3 H del camino, sobre azul o como rojo; nunca pegados al muro (pegados pierden 3–0) |
| **C2 · par en la transición** | con el héroe a ≤ 3 tiles de la escalera principal: las dos columnas en x [0,30; 0,48] y [0,60; 0,80]; hueco ≥ 0,17 del ancho; tapan ≤ 10 % del héroe | **un solo par por sala**, 2 × 2 tiles, simétrico al eje, **en la misma banda que la escalera que flanquean** y con cimas esbeltas. [U] lo dio por mal aplicado en la sala T (A413): escalera en la banda 1 y búhos en la banda 5 hasta el borde, con cimas anchas |
| **C3 · calcomanía en el hotspot** | figura de 4 × 4 a 6 × 6 tiles, 3–8 % del cuadro, en B2–B3; **tenue, con el color del piso, fuera de los pies del héroe** (A413); en el quita-uno aportó +0,50 (A405) | cinta con anillo + estrella junto al hotspot, a 1–4 tiles del héroe (no una cinta de camino: las tomas no la tienen, A360) |
| **A4/A5 · vano focal** | rectángulo claro de 0,08–0,16 × 0,10–0,20 del cuadro, centro en x [0,40; 0,62], y [0,05; 0,25]; luminancia ≥ 2× la del cierre; el elemento más contrastado del cuadro. [U] (A413): válido, pero necesita luz real con contraste; en el visor, el máximo contraste posible, y se anota que la luz va en Unity | hueco de 2–3 tiles en el cierre lejano o billboard plano pegado a su cara; **nunca un volumen que sobresalga** |
| **Landmark (S4c)** | si la sala tiene POI o meta alta, el landmark se lee completo de lejos y como fragmento de cerca | `kind: 'landmark'` del visor, sobre la meta |

**Líneas de fuga:** la perspectiva solo se lee si hay cosas de tamaño conocido repartidas en profundidad (v66: H8 depende de H10). Por eso los pares de pilares, las losas de C3, la escalera y el borde de A6 deben estar en bandas distintas. Una sala con un solo plano vertical se ve casi ortográfica aunque la cámara tenga perspectiva.

**En el exterior (Forest A):**
- **Línea de nivel:** borde de terraza, muro bajo o fila de árboles.
- **Secuencia de pilares:** fila de árboles con ritmo; los árboles como volumen, no billboard, salvo el follaje suelto.
- **Masas:** rocas y taludes en vez de muros. Sin columnas de `planes` en orillas de agua.
- **P:** dos oclusores de primer plano en las esquinas inferiores, solo si existen como azul cerca de la cámara (si no, AUSENTE).
- **Fondo:** poblado hasta el borde, con la torre o el horizonte del mapa como F.
- **Camino:** 1,2–2,4 H.

### 3.6 Alturas por pieza (en H, medidas en DQ3; dato = altura aparente con `exag` 1)
| Pieza | Altura |
|---|---|
| Baranda o balaustrada | 1,0–1,4 (0202: 1,34–1,42; 0149: 0,70) |
| Postes de baranda | ~1,6 |
| Parapeto o borde de isla | 0,7–1,6 (los bordes fallan sobre todo por altura) |
| Muro bajo / pared del fondo | 1,2–1,3 |
| Pilares de pasillo o escalera | 3,7–5 |
| Pilares cercanos que salen del cuadro | ≈ 5 (no 7–11) |
| Estatua sobre plinto | ≈ 3,9 |
| Muros de cierre altos (sin vecina) | 5 (`planes`) a 8 (trono) |
| Ancho del pasillo de pilares | ≈ 4,9 H; espaciado ≈ 7,3 H (30:55) |

### 3.7 Lo que NO va (nunca probado o descartado; para pulido)
- **Nunca probados:** A3b (masa baja de esquina; en la sala T las esquinas dieron +1,9 en TECHO, A402, pero nunca con puerta válida), A8 (paso por detrás), A416 (cámara adelantada hacia el avance), el modelo de cámara de [U] (A428: prioridad en Z, trabada en X cerca de los bordes, hub recentrado), B1 como truco, B3 (altura fingida), B5 (cara de caída), N1, C5, C7 más allá del ajuste de A6, y el bloqueo suave (A434).
- **Descartados:** `exag` o `vScale` globales, `subs` 1, Cam 8, `stageBorder` como cierre (solo visual), cinta de camino como guía.

Si alguno aparece por una regla del visor, se declara.

## 4. Posiciones (caminata)
- **Nueve posiciones** del camino de props (k0 … k8, `camino[floor(i·(N−1)/8 + 0,5)]`) **más k_mir** (mirador: la posición transitable sobre el eje con V(p) máximo, a ≤ 4 tiles del borde de fondo).
- **Las mismas posiciones en los tres estados.** Si TODO cambia el camino, se usa la posición equivalente y se declara.
- **La caminata entera debe pasar los controles de §5:** yaw constante dentro de una sala; ningún salto > 2,5 veces la mediana; sin vacío; sin terreno ajeno; sin losas a media sala; meta en cuadro.
- **Las hojas muestran k0, k4, k8 y k_mir.** La plantilla de §3.4–§3.5 se mide en k4 (hotspot) y en k_mir.

## 5. Controles y medidas
- **Controles en todas las posiciones:**
  - héroe ± 5 % entre estados;
  - vacío ≤ 2 %;
  - billboards más rojo ≤ 30 %;
  - ninguna baldosa del camino con > 25 % perdido por un volumen (35 % en contrahuellas, declarado);
  - el héroe tapado > 25 % solo por rojo y nunca en el hotspot;
  - hashes ×2;
  - máscara, camino y meta iguales entre estados, o el diff declarado.
- **Medidas por celda:**
  - fila de los pies;
  - fila de la línea de nivel;
  - fila del borde del fondo;
  - % de «ver adelante»;
  - V(p);
  - s del fondo;
  - profundidad útil detrás del hotspot (H);
  - banda del héroe;
  - % billboards más rojo;
  - % vacío.
- **Por sala, en TODO:** la tabla de §3.4–§3.5 llena, fila por fila: PRESENTE (cifra medida en pantalla, render de ids) / AUSENTE (motivo) / POR REGLA o A MANO. También qué pieza hace cada capa P, G, R y F.

## 6. Entrega
- **Hoja por sala:** filas = k0, k4, k8 y k_mir; columnas = BASE | CÁMARA | TODO. Bajo cada celda, una línea de medidas.
- **Hoja de plantilla:** el TODO de cada sala en k4, con encima, en líneas finas:
  - las bandas B1–B5;
  - la franja de A6 (0,40–0,60);
  - los tercios;
  - la fila de los pies;
  - la franja del borde del fondo (0,10–0,25).
- **Hoja de caminata:** las 9 posiciones + k_mir del TODO de cada sala, en miniatura.
- **Hoja resumen:** las tres salas en TODO, en k4, lado a lado.
- **`medidas_control.txt`:**
  - las cifras;
  - las tablas por sala;
  - la lista de piezas POR REGLA y A MANO con posición y altura;
  - lo que no se pudo hacer, con su motivo.
- **`SHA256SUMS`** y un zip.
- **Ningún juicio.**

## PARADAS
- Algo exige `src/`: lo dices, propones el cambio sin hacerlo y sigues sin eso.
- El arnés no permite rojo o volumen fuera de la sala: PARADA antes de construir.
- Una sala no admite la plantilla (por ejemplo, es más chica que un cuadro o no tiene ningún borde en X): PARADA para esa sala, con las cifras.
- El héroe varía más de ± 5 % o el vacío pasa del 2 % y no se corrige sin romper una regla.
- El mismo fallo se repite dos veces.

## Historia
- v325 (dff2de1): primera versión. Delegaba en la receta y usaba T3.
- v325b (e3a3cda): T3 fuera (ajustada a 0202; [U] no admite salas copiadas de DQ3).
- v326 (ffa6b57): plantilla de pantalla con cifras.
- v327 (daf2679): todo lo de los documentos consolidados.
- v329: decisión de [U] (A463): `tilesPerH` 1,5, terraza 1,25 H, `subs` 2; la fuente de verdad pasa a `MODELO_ACTUAL.md`.
- v328 (3f2a15f): Los consolidados (v318, v319) son del 17 nov y llegan hasta A357; se cruzó con el Registro A358–A460 y se actualizaron:
  - C3 fuera de los pies del héroe, C2 en la banda de su escalera, A6 calada y no almenada, A4 con su nota de luz;
  - las bandas y el horizonte leídos por [U] (A429);
  - el alto del héroe por toma (A366);
  - el modelo de cámara de [U] y A416 en nunca probados;
  - el conflicto de terreno y escala (A373 contra G2), que decide [U].
- (v327, texto anterior): [U] preguntó si estaba todo y [R] reconoció que el compilado salía de una sola nota. Se revisaron el informe integrado v319, las fichas v318, la BRÚJULA, la PLANTILLA, las DEFINICIONES de T26 y la v66. Se agregaron:
  - las bandas con su numeración y el héroe en B2;
  - «ver adelante» 25–40 % y la franja del borde del fondo;
  - las capas P/G/R/F;
  - las líneas de fuga (secuencia de pilares como desaplanador);
  - el encuadre de A6 con `heroScreen`;
  - la tabla de alturas por pieza;
  - la caminata k0–k8 + k_mir y sus controles;
  - la oclusión del camino y del héroe;
  - el terreno «súper plano», el POI sin elevar y `pre` 0;
  - el aviso de anchura y recinto de DAC con la construcción fuera de la sala;
  - las reglas del exterior.
