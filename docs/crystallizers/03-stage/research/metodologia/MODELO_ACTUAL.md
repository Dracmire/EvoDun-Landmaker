# MODELO ACTUAL — nuestra teoría de la vista 2D-HD (modo 3)

**v2.4 · 2026-11-18** · cubre el Registro A001–A499 (los dos chats). **DQ3 cerrado** (A472); segundo juego: **Octopath Traveler 2** (A473), referencias en `refs/oct2/`, medidas en `research/octopath2/medidas_paso1.md`.
**Qué es:** lo mejor que hoy sabemos de cómo se ve y cómo se construye una vista 2D-HD. Es el **resultado incompleto de la metodología**: cada cierre le añade cosas, y **terminamos cuando este modelo genere 2D-HD**. No lleva justificaciones; entre paréntesis va solo el ID del Registro que le da origen, para rastrearlo.
**Tres partes:**
1. **Modelo acumulado:** el conocimiento.
2. **Base principal:** lo que usan todas las escenas.
3. **Features:** grupos por tipo de escena; no todos se mezclan.

**Marcas:** [V] validado o medido · [D] decidido por [U] · [H] hipótesis · [NP] nunca probado · [X] descartado. H = altura del héroe. Pantalla en fracción: x de 0 a 1 (izquierda a derecha), y de 0 a 1 (arriba a abajo).
**Cómo se actualiza:** sube la versión y se anota en el historial (§17) con el ID. Nunca se borra una línea: se marca [X] con el ID que la reemplaza.

---

# PARTE I · MODELO ACUMULADO

## 1. Qué es una vista 2D-HD
- Es **composición**, no look: capas del encuadre, cierre del fondo, ancho de ruta, escala del héroe y planos. Luz, desenfoque, texturas y color van en Unity (A003, T15). [D]
- Es **un 3D con altura real al que se le aplican técnicas de 16 bits:** planos, primer plano obstructivo, fondos construidos, horizonte local. Un 3D «perfecto» solo no basta (T26, A296, L04). [D]
- **«Esa profundidad es lo que nos hace 2D-HD y no 3D incompleto»:** planos que se tapan (A175). [D]
- **25–40 % de la vista se dedica a ver más adelante;** el horizonte es **local**, dentro de la misma sala (A247). [D]
- **El 2D-HD busca más deformación, no menos** (A427). [D]
- **HD-2D = mundo 3D + personajes y objetos 2D + efectos y luces + un pase de composición especializado** que extrae las cualidades 2D sobre la base 3D; sin ese pase sale una maqueta con texturas y efectos (teoría de [U], A497; no va con el Ancla). [H]
- **La hoja de composición depende del origen del juego** (A497): DQ3 viene del RPG top-down (pisos planos; el remake eleva y diferencia pisos para dar marcas de perspectiva); Octopath, del 2.5D oblicuo de 16 bits (FF6; verticalidad arquitectónica). El modelo = Base + **hoja de origen** + grupo de features. Lo que había hasta v2.3 es la hoja top-down. EvoDun genera mapas top-down, así que su hoja natural es la top-down (A498). [H]
- **Con cubos apilados basta;** el visor es la casa y 1 de cada ~100 modelos va a Unity (BRÚJULA). [D]
- **El objetivo es general:** DQ3 es la primera prueba; Octopath, Triangle Strategy y Wandering Sword vienen después. No se copia DQ3 (A008). [D]
- **DQ3 está cerrado:** es lo máximo que se saca de ese juego; no se vuelve a la Torre del Soñador (A472). [D]
- **Cuanto más cerca se está de algo consistente, más obvios son los errores** (A248). [D]

## 2. Cámara
- **Perspectiva normal:** no hay vista telescópica (A449) ni profundidad comprimida (A451). La sensación de profundidad sale de cuatro cosas: la cámara sigue al héroe, la distancia, el largo de las salas y que la cámara se detiene en los bordes. [V]
- **FOV 30** (A425). [V] La cámara casi ortográfica y el FOV bajo, descartados (A347). [X]
- **Pitch:** dungeon 24–28 (A450); campo abierto 37–40 (A454); trono ≈ 33–35 a ojo (T05). [V] / [H] para el trono.
  - Subir el pitch no cierra un fondo (T11). [V]
  - `vScale` con cámara fija equivale a un pitch más plano (A157). [H]
- **Distancia:** el héroe mide ≈ 0,10 del alto del cuadro (heroFrac), D ≈ 19,5 H (A450). [V]
  - El pivote está a media altura del héroe, así que la distancia efectiva es D/k (A443). [V]
- **Escala por profundidad:** s = (D/k) / (D/k + g · cos pitch); el visor la cumple con 0,000 (A445). [V]
  - Con heroFrac 0,10, s 0,60 a ≈ 14 H y s 0,55 a ≈ 17 H detrás del héroe; el sur crece ~5–7 % por H (t5). [V]
- **Una sola escala de héroe:** ancho ≈ 0,030 del cuadro en todas las tomas (A440). El alto mide 0,107 en 0202 y 0,128 en 0137, una diferencia sin explicar (A366). [V] / abierto
- **Paralaje** cercano / lejano ≈ 2,2 al caminar; el fondo también tiene paralaje de perspectiva, no es una capa plana (A042, A370). [V a ojo]
- **Una capa plana precompuesta es indistinguible del 3D en una foto quieta:** solo el movimiento la delata (A369). [V]
- **Lo que lleva [U] sobre la cámara** (A428, A416, A434; [H] sin probar):
  - prioridad en Z;
  - trabada en X cerca de los bordes;
  - en hub se recentra; en salas con dirección se descentra hacia el avance;
  - se detiene ~1 H antes de un obstáculo y el héroe sube por la pantalla (bloqueo suave).
- **Otros juegos:**
  - Luminati: cámara 28° / 32°, héroe ≈ 1/10, camino oculto ≤ 3 %, primer plano escaso, ningún borde «fin del mundo» (A053). [V lectura]
  - Cobra Code: teleobjetivo y geometría por bloques (A048). [H]
  - Octopath Traveler 2 (3 capturas fiables): pitch 14–25, héroe 0,11–0,18 del alto, pies fy 0,61–0,71; el pitch NO es más alto que en DQ3; lo empinado viene de la deformación (09 da 5–16° según qué se mida) (A478, A479). [V medido] / deformación [H]
- **Tres espacios** (modelo de [U], A483): caminable ⊂ escenario ⊂ cámara. La cámara (rotación fija) se mueve dentro de su espacio y solo transmite lo que pasa en el escenario. En el **cuadro central** sigue al héroe 1:1 y su tamaño no cambia; cuando la cámara llega al borde de su espacio se detiene, el héroe la «alcanza» y crece (al sur) o encoge (al norte), con tope. DQ3 usa espacios de cámara amplios (el héroe no crece); Octopath los usa finitos y lo aprovecha (A480). [H, se prueba en el visor]
  - Si la cámara detenida es perspectiva normal, el crecimiento es hiperbólico (la fórmula de escala de abajo con g < 0); una curva distinta indicaría un índice ajustado (A484). [H]
  - **Perfiles de cámara** (teoría de [U], A482, A490): **narrow** (espacio de cámara corto en Z: el héroe crece al sur) y **wide** (amplio en todas direcciones, como DQ3: el héroe no cambia de tamaño); puede haber uno o dos más. **long no existe** como perfil de bloqueo suave: moverse de lado no cambia el tamaño del héroe, solo el eje Z lo cambia (A490). Asignación en el visor ([R], A490): salas Z y X → narrow (lo que cuenta es el eje Z), Hub → wide. El eje lateral queda fijo en el visor (en Unity puede ser otra cosa). [H]
  - **Por qué hay perfiles y no una cámara libre** ([U], A491): una cámara libre marea y hace que el jugador desconozca el escenario; el trabajo de este tipo de juego es generar familiaridad lo antes posible. [D]
  - **Sub-cámara «deep» del perfil wide** ([U], A491): para los objetos del fondo (casas, puntos de referencia a los que se llega en exteriores). [H, sin probar]
  - **El bloqueo suave va con una banda de primer plano no caminable** (A488): entre el borde sur de lo caminable y el borde del escenario; la cámara se detiene antes, el héroe crece hasta ~0,18 y sus pies quedan a fy ~0,75 sobre la banda (barandas bajas, objetos desenfocados de primer plano en Octopath). Sin la banda el héroe se sale por abajo (visor: 0,144 con fy 0,96). [V medido el problema, H la solución]
  - Que el visor siga la curva hiperbólica exacta solo verifica el instrumento; si Octopath usa un índice ajustado sigue sin medirse (A487). [V]
- **Casas del fondo > 50 % más chicas** aunque sean visitables (A481): perspectiva o fachada como escenografía; se separa con la fórmula de escala. [H]

## 3. Escala y alturas
- **`tilesPerH` 1,5** (A159, A463). [D]
- **Altura aparente ≈ dato^exag × vScale;** por eso las alturas van por pieza y en el dato, con exag 1 (A170, A174). [V]
- **Ninguna palanca global sirve a todas las piezas:**
  - `exag` sube muros, volúmenes y objetos (y también el cierre: tapa el vistazo);
  - `vScale` sube todo, peldaños incluidos (A162, A345). [V]
- **El visor cuantiza con el rango global:** la cima del dato cae en la última terraza; bajar una pieza sola exige cambiar terrazas (A018). [V]
- **La altura del muro sola no distingue una escena buena de una mala** (A268). [V]
- **Bajar los muros expone el vacío** y deja la sala como diorama flotante (A280, A284). [V]
- **Alturas por pieza medidas en DQ3** (en H):

| Pieza | H |
|---|---|
| Balaustrada / baranda | 1,0–1,4 (0202: 1,34–1,42; 0149: 0,70) |
| Postes de baranda | ~1,6 |
| Parapetos / bordes de isla | 0,7–1,6 |
| Muro bajo / pared del fondo | 1,2–1,3 |
| Pilares de escalera o pasillo | 3,7–5 |
| Pilares cercanos que salen del cuadro | ≈ 5 |
| Estatua | ≈ 3,9 |
| Muros de cierre del trono / pilares | 8 / 5 |
| Fachada del bosque | ≈ 3,3 |

  Los bordes de isla fallan sobre todo por altura (A210, A433, A450, A284, A013). [V]
- **Pasillo de pilares:** pilar cada ≈ 7,3 H; losas de ≈ 4,9 H de ancho (t6). [V]
- **Paso:** ≥ 5 integrantes del grupo lado a lado (≈ 3 H) (A182, A194). [D]

## 4. Terreno y relieve
- **DQ3 es «súper plano»:** suelo plano por zonas y cambios de altura en escaleras de micro-terrazas. Primero el terreno plano; después, los bordes disimulan que la altura es isométrica (A090). [D]
- **Terrazas:** máximo 3; subterrazas 1–2 (A343). Base: terraza **1,25 H**, `subs` **2** (A463). [D]
  - `subs` 2 deja el bordillo de la franja media; `subs` 1 lo borra (A345). [V]
- **Los escalones grandes delatan un mundo cúbico 3D;** casi ninguna escalera de DQ3 es alta (A247). [D] Vale para la hoja top-down; en la hoja 2.5D (Octopath) los saltos grandes se permiten vestidos de arquitectura: escalinatas dobles, muros de contención (A495, A498). [H]
- **«Ver por encima»** sale de la perspectiva (muros más altos que los suelos), no de subir suelos (A215, A222). [V]
- **`terraces` y `subs` cambian máscara, camino, orientación y meta** (A258, A303). [V]
- **`terraces` 3 aplana;** los anillos de Cake agregan escalones de contorno; los muros de Ascension enmarcan poco (A263, A270). [V]
- **`pre` (promedio 3 × 3)** vuelve rampa de 2 tiles un muro alto pegado al suelo: `pre` 0 (A046). [V]
- **El POI no se eleva:** la tarima del rey es baja (~1 subnivel) (A083, A080). [V]
- **El remake conserva las zonas relativas y cambia terrazas y pasillos** (A117, A230):
  - un paso de 1 × 5 tiles viejos (≈ 1,4 H) pasa a una escalera de ≈ 4,5 H (×3,2);
  - un paso de 1 × 2 pasa a dos escaleras;
  - 6 columnas pasan a 4 pilares;
  - 9 salas viejas pasan a 10 espacios (A141). [V para el piso 2]
- **Un paso de ≈ 1 tile entre dos pilastras** sería una escalera hacia el flujo, ensanchada a ≈ 4 H, con las pilastras como rojo (A114). [H]

## 5. El mapa viejo y el generador
- **El mapa viejo no trae en píxeles** niveles, plinto, escaleras laterales ni parapetos; ninguna regla los deduce. El relieve hay que suponerlo por reglas (A073, A229). [V]
- **Mapa viejo como fuente:**
  - es una rejilla de 16 px que se aprende por repetición de bloques;
  - el agua se clasifica por color;
  - **la sombra de las columnas es suelo** (A093, A094, M3b). [V]
- **El remake pinta un fondo de color** (pasto, cielo) detrás de ventanas y bordes lejanos (A085). [V]
- **El rojo del remake ocupa 22–35 % de la pantalla;** sale de la lectura de la escena, no de reglas de borde (A099, A105). [V]
- **El piso 2 de Najimi no es un juez fiel** del «conservar la disposición» (A230). [V] El piso 3 reservado para la prueba en ciego (A110) [X] (A472: DQ3 cerrado).
- **El zoom del mapa del remake es constante** salvo que el jugador lo cambie (A218). [V parcial]
- **El pack del generador de EvoDun ya trae** elevación, zonas, bordes, camino, POI y agua (A233). [V lectura]
- **Las salas DAC:**
  - son 4–15 veces más anchas que un pasillo de DQ;
  - la ruta pasa lejos de los muros;
  - el bloqueado está a 3–12 tiles y de un solo lado (v32, A288);
  - no traen las precondiciones de los trucos (A378).

  La diferencia dominante es **sala cerrada contra terreno abierto** (A382). [V]
- **En DAC, la profundidad útil por encuadre** sale de 8 a 61 H contra ~17 H, y los trucos no lo compensan: **falta una regla de forma de sala** (A465). [V]
- **La forma de la sala decide:** una sala estrecha y cerrada (tipo Ascension; DAC 14) se acerca a 2D-HD con 0 % de vacío; una ancha (DAC 44, 61 H de profundidad) y un exterior que llega al borde del mapa (Forest A, hasta 54 % de vacío) no, con los mismos trucos (A470, A471). [V]
- **Las salas Ascension pequeñas** miden menos que un cuadro; solo las Cake alcanzan «dos tomas» (A257). [V]

## 6. Modelo de escena
- **Verde** = transitable y continuo; **azul** = no transitable; **rojo** = overlay decorativo y obstructivo con un pie en azul; apagado, queda el mapa completo (A089, A107, A112). [D]
- **El rojo es metodología, no Ancla;** se define después de resolver verde y azul, deduciendo qué hay detrás (A109, A111). [D]
- **El rojo estructural se deduce** de las perspectivas obstruibles: de las proyecciones posibles, 1–2 sirven para la cámara (A193). [D]
- **El rojo puede tapar al héroe** (A102). [D]
- **Capas del encuadre P / G / R / F** (primer plano, guía, ruta y meta, fondo), presentes en todas las tomas del bosque (A004). [V]
- **Lo estructural es geometría; lo decorativo es ranura;** billboards más rojo ≤ 30 %; el suelo son bloques pintados; las cintas no cuentan (reglas 1, 9, 10; A036). [D]
- **Escena, no toma:** se juzga con caminata y con varias tomas a lo largo de un recorrido (tabla de movimiento) (reglas 2, 4, 11). [D]
- **Islas:** los bordes son sólidos y visibles; lo de más allá «se ve pero no se alcanza» (A203, A217). [D]
- **Hotspot:** transitable, central salvo POI, sobre el eje de flujo (A202, A206). [D]
- **Eje de la sala** X / Z / Hub; función de banda: primer plano, guía, meta, fondo o vistazo (A312). [D]
- **Bandas B1–B5** en Z, contadas desde abajo; plano = banda + lo que tapa (A311). [D]
  - Lectura de [U] (A429): en 0202, banda 1 = escalera sur, banda 2 = héroe (y 0,45–0,56), lejos en y 0–0,18; en 0137, lo lejano baja hasta y 0,51. [D]
- **El vistazo se deduce del mapa y la cámara** (A313). En la Torre del Soñador las salas se ven entre sí porque las diferencias de altura las vuelven miradores (A296). [D]
- **Fondo abierto ≠ vistazo** (DEFINICIONES_T26 §7). [D]

## 7. Composición: lo que pesa
- **Ganó en juicio ciego:**
  - el vistazo y el cierre en dos planos (barrera baja cerca + masa alta lejos), 3/3 en DQ3 y 9–0 en DAC no usada; tapar el cielo solo pierde 9–0 (A332, A336, A337). [V]
- **Premiado por los jueces:**
  - centro del cuadro abierto y masas en los bordes;
  - un bordillo continuo en la franja media;
  - ver lejos;
  - una columna suelta de borde que sale por arriba; pegada al muro, pierde (A342, A346, A352). [V juicios]
- **Ganancia por ítem en TECHO** (juez calibrado): marca +3,0 · línea media +2,4 · esquinas +1,9 · marco +1,0 · fondo −0,5 (A402). En el quita-uno: A6 +0,67 y C3 +0,50 (A405). [V]
- **Veredictos de [U]** (A413): A6 funciona; C3 aprobado (tenue, color del piso, fuera de los pies del héroe); C2 buen truco mal aplicado; A4 válido pero necesita luz real; A3a suelto falla (necesita secuencia). [D]
- **Tamaño de C3:** ≈ 6 H de ancho (~9–10 tiles); a 4–6 tiles ocupa 1,3–2,6 % de la pantalla y no se lee (A470, A471). [V]
- **La línea de A6 se logra colocando la baranda en la sala,** no moviendo `heroScreen`: el control del héroe ± 5 % manda (A471). [D]
- **Tipos de truco:**
  - señales (C3, A4/A5);
  - estructuras de encuadre: el truco es la relación de banda, secuencia y posición, no el objeto;
  - reglas de cámara (A1, A7, A416) (A415).

  Un truco se evalúa por su efecto, no por su visibilidad (A414). [D]
- **Los obstructores se definen por posición en pantalla,** no por coordenadas de mapa (A342, A350). [V]
- **Las tomas marcan el hotspot con una calcomanía,** no el camino con una cinta (A360). [V]
- **La perspectiva solo se lee con cosas de tamaño conocido repartidas en profundidad** (desaplanadores; v66 H8 ← H10). [H]
- **Patrones comunes de 0137 y 0202:**
  1. línea de nivel en y 0,42–0,60 con ≥ 70 % del ancho;
  2. masas altas en los bordes o en un par que enmarca;
  3. masas bajas en las esquinas inferiores;
  4. centro abierto hasta un fondo luminoso o escalonado;
  5. calcomanía junto al héroe (v318 §2). [V a ojo]

## 8. Lo que no funciona
- **Billboards como suelo, muros o pilares** (D1, 81 %) (A034–A036). [X]
- **Apagar las reglas para igualar una foto;** juzgar con un fotograma (A035, A037). [X]
- **Reglas ciegas con las tomas a la vista** (contaminación) (A106). [X]
- **Pulir datos a mano como si fuera la prueba del Ancla** (A226). [X]
- **CC percibiendo el mapa** (la percepción va a [R]) (A216). [X]
- **Depender de las lecturas de [U] en cada vuelta** (A232). [X]
- **Rúbricas y métricas propias de [R] como juez;** jueces automáticos (A321, A417). [X]
- **`stageBorder` como cierre** (solo visual) (A259, A289). [X]
- **`exag` y `vScale` globales; `subs` 1 como relieve concentrado** (A345). [X]
- **Reglas en coordenadas de mapa para efectos de pantalla** (A342). [X]
- **Clasificadores DARK y HZ_glimpse como discriminadores** (A266, A271). [X]
- **Elevar el POI** (A083). [X]
- **Cinta de camino como guía** (A360). [X]
- **Cam 8, `zScale`** (A451). [X]
- **Volúmenes S4b fuera de tiles bloqueados** (A285). [X]
- **C3 de 4–6 tiles** (A471). [X]
- **Encuadrar A6 con `heroScreen` fuera de ± 5 %** (A471). [X]
- **Antorchas de `props` en la Base y en el tercio central** del cuadro: llenan el centro que debe quedar abierto (A470, A471). [X]

## 9. Método e instrumentos
- **Roles** (A407, A419, A467):
  - [U] decide y juzga mirando;
  - [R] diseña o supervisa y no hace maquetas;
  - CC construye todo;
  - sin agentes ni jueces automáticos salvo permiso de [U].
- **Pausa tras cada etapa;** [U] es el único con la perspectiva completa (A398). [D]
- **El Registro** es el dispositivo para entender los cambios graduales y no salirse de línea (A468). [D]
- **Lo que rinde:**
  - medir simple contra las tomas;
  - predicciones y paradas antes de correr;
  - hashes ×2;
  - una variable por pase o quita-uno;
  - medir la causa en vez de opinar;
  - cambiar el objeto de la prueba cuando el síntoma persiste (A123, M1–M10). [V]
- **Ficha de truco de 11 campos** con puerta de presencia (A357). [D]
- **Instrumentos:**
  - Cam 5 cenital con el mapa superpuesto para controlar la colocación (A204, A208);
  - render de ids;
  - V(p);
  - caminata k0…k8 + k_mir;
  - capa neutra ANTES / DESPUÉS con el héroe emparejado (A286);
  - misma definición de transitable que las reglas (A242). [V]
- **Medir al héroe:** `heroFrac` es la caja de 1 H en el pivote; la figura completa es cabeza + cuerpo + punto (A150, A153). Las tomas de YouTube son ≈ pantalla completa (A148, A151). [V]
- **Contrastar con la imagen original,** no con un derivado (A061). [V]

---

# PARTE II · BASE PRINCIPAL (todas las escenas)

| # | Elemento | Valor |
|---|---|---|
| B1 | Cámara | Cam 6 perspectiva, FOV 30, K 1, `exag` 1, `vScale` 1 |
| B2 | Distancia | heroFrac 0,10 en el cuadro central; con espacio de cámara finito crece hasta ~0,18 al sur (A479, A480) |
| B3 | Pitch | por tipo de escena (Parte III); por defecto 25 |
| B4 | Pies del héroe (`heroScreen`) | por tipo de escena; por defecto (0,47; 0,51); Octopath 0,61–0,71 (A479) |
| B5 | Escala | `tilesPerH` 1,5; paso ≥ 3 H (5 integrantes) |
| B6 | Terreno | `terraces` ≤ 3, terraza 1,25 H, `subs` 2 (peldaño ≈ 0,275 H), «Measures in H» OFF, `pre` 0 junto a muros altos; plano por zonas; escaleras de micro-terrazas hacia el flujo; POI sin elevar |
| B7 | Modelo de escena | verde / azul / rojo; estructural = geometría; billboards + rojo ≤ 30 %; cintas y calcomanías no cuentan |
| B8 | Orientación | `orient` con POI primero; eje X / Z / Hub; hotspot transitable, central salvo POI, sobre el eje; el eje cruza el cuadro en x ∈ [0,40; 0,65] |
| B9 | Bandas | B1–B5 desde abajo; el héroe en B2 cuando hay B1 delante; ver adelante 25–40 %; horizonte local |
| B10 | Corte del lado de cámara | `planesTest.noFront` (A7): ningún muro alto en y > 0,85; una baranda baja (≤ 1,4 H) en la banda de primer plano sí (A476, A488) |
| B11 | Fondo | nunca vacío (≤ 2 %); se cierra con geometría (vecina, muro, masa o fondo construido); nunca bajando muros ni con `stageBorder`; en exteriores el fondo se construye más allá del borde del mapa (A471) |
| B12 | Alturas | por pieza, en el dato, según la tabla de §3 |
| B13 | Profundidad útil | por perfil de cámara, no un número fijo: ~17–21 H en corredor (DQ3, puente de Octopath); en interior o plaza la profundidad corta medida (3,5–5 H) es en parte efecto del bloqueo suave (A479, A480) |
| B14 | Billboards | solo personajes, vegetación suelta y atrezo |
| B15 | Controles | héroe ± 5 % · vacío ≤ 2 % · camino sin baldosas > 25 % perdidas por volúmenes (35 % en contrahuellas) · hashes ×2 · máscara, camino y meta iguales o el diff declarado |
| B16 | Caminata | k0…k8 + k_mir; yaw constante en la sala; salto ≤ 2,5 veces la mediana; sin vacío ni terreno ajeno; meta en cuadro |
| B17 | Reglas encendidas | `orient`, `planes`, `props`, `volumes` (apagar una exige razón escrita); `props` sin antorchas: las antorchas son feature por escena (A471) |
| B18 | Forma de sala | estrecha y cerrada, recinto cerca del camino, profundidad útil ~17 H; una sala ancha no se arregla con trucos (A465, A470) |

---

# PARTE III · FEATURES (grupos por tipo de escena)

**Perfiles de forma** (A496, `research/octopath2/perfiles_forma.md`): P1 pasillo angosto, P2 corredor ancho, P3 Hub normal, P4 Hub deep, P5 interior de una toma, P6 interior deep. Son un segundo eje, independiente del tipo DAC (matriz perfil × tipo en ese documento). El cristalizador clasifica y encuadra; una sala que no entra en ningún perfil es un pedido al generador. [H, tesis T1 y T2 en prueba]

Cada escena usa la Base y **un solo grupo** como principal. Los features de otro grupo solo entran si la tabla de compatibilidad lo permite. Estado del grupo: **[V] probado en su escena · [H] visto en tomas · [NP] nunca probado**.

## F-D · Dungeon (Torre del Soñador)
Laberíntico, oscuro y encerrado; primer plano que estorba a propósito; galerías en X para las vistas y corredores en Z (A087, A088).
| Feature | Cifras / receta | Estado |
|---|---|---|
| Pitch / pies | 25 (24–28) / (0,47; 0,51) | [V] |
| A1 + A2 · vistazo y cierre en dos planos | BACK = baranda 1,0–1,4 H; ventana con la vecina entera; vecina ±Δ (≤ 4 H) hasta V(k4) ≥ 10 %; barrera ≤ 0,08 del cuadro; masa lejana visible en ≥ 30 % del ancho | [V] (9–0) |
| A6 · línea de nivel | **baranda calada** en y 0,40–0,60, ≥ 70 % del ancho; postes ~1,6 H cada 3–4 tiles; la línea sale de dónde se coloca la baranda en la sala, con el héroe dentro de ± 5 % (A471; el encuadre con fy ∈ [0,45; 0,80] queda [X]); el héroe nunca cortado en la cintura | [V] (+0,67) |
| Secuencia de pilares | pilares de ≈ 5 H cada ≈ 7,3 H a los lados del eje (p. ej. 2 por banda de B2 a B5, B1 vacía); tercio central abierto; nunca pegados al muro | [D] (A3a suelto falla) |
| C2 · par en la transición | un solo par, en la misma banda que su escalera; cimas esbeltas; hueco ≥ 0,17 del ancho | [D] (mal aplicado en la sala T) |
| C3 · calcomanía | pentagrama o hexagrama de **≈ 6 H de ancho (~9–10 tiles)**, tenue, color del piso, junto al héroe (A471; 4–6 tiles queda [X]) | [V] (+0,50) |
| Antorchas | a los lados del camino, nunca en el tercio central x [0,33; 0,67] (A471) | [D] |
| A4 · vano focal | ventana o luz en x [0,40; 0,62], y [0,05; 0,25]; el elemento más contrastado | [D] (necesita luz real) |
| Escalera sobre el eje (B1) | escalinata hacia el destino, ≥ 4 peldaños, ancho ≥ 3 H | [H] |
| Escalera – estatua – escalera (N1) | plinto azul con estatua de ≈ 3,9 H entre dos escaleras, a lo largo de un muro | [NP] |
| Rojo de primer plano | masas obstructivas en B1 con pie en azul (dragón, plintos) | [H] |
| Masa baja de esquina (A3b) | ancho 0,10–0,20 del cuadro, en las esquinas inferiores | [NP] (+1,9 en TECHO) |

## F-T · Sala del trono (interior hub)
POI seguro, amplio e iluminado; sala axial y simétrica (A088, A068).
| Feature | Cifras / receta | Estado |
|---|---|---|
| Pitch / pies | ≈ 33–35 (a ojo) / héroe centrado, x ≈ 0,50, y 0,47–0,59 | [H] |
| Simetría | espejo exacto; puerta y alfombra centradas, contrastadas con el original | [V] |
| Nave ancha caminable | pilares a ≈ 2,1 tiles del muro, en filas | [V] |
| Pilares y muros de cierre | pilares de 5 H; muros de 8 H; vacío ≤ 0,05 % | [V] |
| Alfombra | cinta sobre el camino hacia el POI (es piso pintado; aquí sí corresponde), con ribete y medallones | [V] |
| Estrado | bajo, 2 tramos de micro-terrazas | [V] |
| Emblema | fondo de la alcoba, sin `z`; asoma al acercarse | [V] |
| Orientación | una sola zona (la entrada incluida) → yaw 0 | [V] |
| Columnas de `planes` | se omiten si su sombra cae sobre el camino (`avoidPath`) | [V] |
| Billboards | rey, cortesanos, armaduras, estandartes ≤ 9 % | [V] |
| Paralaje | cercano / lejano ≈ 2,2; capiteles cortados por el borde | [V a ojo] |

## F-B · Bosque (exterior con recinto)
Poco contraste entre primer plano y fondo; el recinto lo dan la vegetación y los taludes (A028, v37).
| Feature | Cifras / receta | Estado |
|---|---|---|
| Pitch / pies | 25–38 (sin medir en el bosque) / (0,50; 0,60–0,65) | [H] |
| Héroe | heroFrac 0,09–0,13 | [V] |
| Capas P / G / R / F | P = oclusores de esquina (roca, follaje); G = camino de 1,2–2,4 H por cambio de material; R = puerta o fachada; F = torre o copa | [V] (toma dorada 1) |
| Ritmo de árboles | fila de árboles como secuencia de pilares; los troncos como volumen, el follaje suelto como billboard | [H] |
| Landmark al fondo | torre u orbe sobre el eje; dos lecturas (completo de lejos, fragmento de cerca) | [H] |
| Fondo poblado | hasta el borde; **obligatorio** construir geometría más allá del borde del mapa (A471) | [V] (35–54 % de vacío si no) |
| Sin columnas en orillas de agua | el agua nunca se clasifica en `planes` | [V] |

## F-E · Exterior abierto (desierto)
| Feature | Cifras / receta | Estado |
|---|---|---|
| Pitch / pies | **~38** (37–40) / (0,50; 0,65–0,69) | [V] |
| Camino central | recto, centrado; el ancho cae lineal con la fila | [V] |
| Filas de estatuas | esfinges o pilares a los lados, en secuencia | [H] |
| Arcos de primer plano | marcos en las esquinas inferiores | [H] |
| Fondo | borde superior en s ≈ 0,59; **obligatorio** construirlo más allá del borde del mapa (A471) | [V] / [D] |
| Escalones | ninguno visible (peldaño 0) | [V] |

## F-C · Cueva (candidata, solo vista)
Cornisa de 2–3 H; masas de roca > 4 H como muros; oscuridad; agua al fondo; sala de tumba axial con dos estatuas flanqueando el eje y escalera al fondo; roca de primer plano (v37). [H]

## Compatibilidad entre grupos
| Feature | F-D | F-T | F-B | F-E |
|---|---|---|---|---|
| Vistazo a la sala vecina | sí | no (sala cerrada) | no | no |
| Baranda calada (A6) | sí | no | como borde de terraza | no |
| Muros de cierre altos | solo sin vecina | sí (8 H) | no (vegetación) | no |
| Cinta de camino o alfombra | no | sí (alfombra) | como material del camino | camino de piedra |
| Calcomanía en el hotspot | sí | emblema o medallón | no | no |
| Simetría exacta | no | sí | no | sí (camino central) |
| Secuencia de pilares | pilares | filas de pilares | árboles | estatuas |
| Antorchas | a los lados | candelabros simétricos | no | no |
| Fondo fuera del mapa | no (vecina o muro) | no (muros) | obligatorio | obligatorio |
| Pitch | 25 | ≈ 33–35 | sin medir | ~38 |

---

## 15. Nunca probados, para pulido
A3b, A8 (paso por detrás), A416 (encuadre hacia el avance), el modelo de cámara de [U] (A428), B1 como truco, B3 (altura fingida), B5 (cara de caída), N1, C5, C7, el pitch por zona como parámetro del visor (T55) y la luz y sombra estática (v66 H9, Unity).

## 16. Abierto (lo que falta para que el modelo genere 2D-HD)
1. **Regla de forma de sala** en la generación: ancho de pasillo, profundidad útil ~17 H y recinto cerca del camino (A465).
2. **Relieve desde el mapa viejo:** escaleras y niveles (A229).
3. **Fondo construido fuera del mapa** en exteriores.
4. **Prueba de Generación en ciego:** piso 3 de la Torre del Soñador (A466) [X] (A472: DQ3 cerrado; la prueba en ciego se hará en otro juego).
5. **Otro juego 2D-HD u otra perspectiva** (siguiente frente, A472): Octopath Traveler 2 en curso (A473–A485).
8. **Prueba del bloqueo suave en el visor** (A483, A484): hecha (A487, PR #99); el visor la reproduce.
9. **Banda de primer plano** (A488): pasa a ser una pieza de los perfiles; no tiene pase propio (brief retirado).
12. **Perfiles de forma, tesis T1 y T2** (A499): brief `research/octopath2/stage_perfiles_mockup_go.md`.
13. **Fondo de fachada de Octopath** (T58): pase propio.
14. **Hoja 2.5D de Octopath completa:** después de T1 y T2.
10. **Espacio de cámara por sala** en ventanas de varias salas (A489): diseño pendiente.
11. **Sub-cámara deep** del perfil wide (A491): sin probar.
6. **Diferencia del alto del héroe** entre 0202 y 0137 (A366).
7. **Ancla v1 sin aprobar.**

## 17. Historial
| Versión | Fecha | Cambio | IDs |
|---|---|---|---|
| v1 | 2026-11-18 | Compilado único con escala, terraza y subterrazas decididas | A463, A464 |
| v2 | 2026-11-18 | Tres partes (modelo acumulado, base principal, features por tipo de escena); el modelo acumulado cubre el Registro completo A001–A466; el modelo pasa a ser el resultado incompleto de la metodología y su criterio de fin es generar 2D-HD | A467–A469 |
| v2.1 | 2026-11-18 | Ajustes del control de 3 salas (v329): C3 ≈ 6 H; A6 por colocación, sin mover `heroScreen`; antorchas fuera de la Base y del tercio central; fondo construido fuera del mapa obligatorio en exteriores; la forma de sala (B18) entra en la Base. DQ3 cerrado: se retira la prueba del piso 3 de la Torre del Soñador | A470–A472 |
| v2.2 | 2026-11-18 | Octopath Traveler 2: medidas de cámara (pitch 14–25, héroe 0,11–0,18, pies 0,61–0,71); los tres espacios y el bloqueo suave de [U] pasan de nunca probados a hipótesis con prueba; perfiles narrow / long / wide; B2, B4 y B13 por perfil | A473–A485 |
| v2.3 | 2026-11-18 | Prueba del bloqueo suave en el visor (PR #99); long eliminado (solo Z cambia el tamaño); perfiles por familiaridad; sub-cámara deep (hipótesis); banda de primer plano no caminable con baranda baja (B10 precisado) | A487–A492 |
| v2.4 | 2026-11-18 | Cámaras en espera; HD-2D = Base + hoja de composición por origen (top-down de DQ3, 2.5D de Octopath); A247 limitado a la hoja top-down; perfiles de forma P1–P6 como segundo eje junto al tipo DAC; tesis T1 y T2 | A493–A499 |
