# Informe de método — trucos de composición 2D-HD con ficha completa — [R], v318, 2026-11-17

Propósito: que CC (Sonnet) pueda construir, comprobar y entregar cada truco sin interpretar nada. Cada truco tiene su ficha de 11 campos (A357). Este informe reemplaza las reglas de truco de G1, G2 y G3, que eran insuficientes (A355). No toca el Ancla.

Convenciones:
- **[U]** usuario · **[R]** revisor (Claude) · **CC** Claude Code, que construye, renderiza y mide; NO juzga composición.
- **H** = altura del héroe (unidad del visor). **Cuadro** = PNG limpio 1280×720. Coordenadas de pantalla en fracción: x de 0 (izquierda) a 1, y de 0 (arriba) a 1.
- **Bandas B1–B5** = franjas de profundidad en Z (DEFINICIONES_T26_v311 §1). **Verde** = transitable; **azul** = no transitable; **rojo** = overlay decorativo con pie en azul (Metodología del modo 3).
- **k0, k4, k8** = posiciones del camino de props (`camino[floor(i·(N−1)/8 + 0,5)]`). **k_mir** (nueva) = mirador: la posición transitable sobre el eje de la sala con V(p) máximo, a ≤ 4 tiles del borde de fondo.
- **Puerta de presencia** = medida que CC calcula en cada render antes de los jueces. PRESENTE / AUSENTE. Lo AUSENTE no se juzga.

---

## 1. Por qué fallaron G1, G2 y G3 (responde a T47)

| Pase | Truco | Qué se pidió | Qué faltó | Estado nuevo |
|---|---|---|---|---|
| G1 | A3 obstructor | 2 pilares por tercio de la SALA, a ≥ 3 tiles del camino | posición en PANTALLA; separación del muro; tamaño aparente; en sala 3 no se colocó ninguno | PROBADO MAL |
| G1 | A4 fondo con vano | volumen claro 2×1, 3 H, en el plano del eje | un vano es una ABERTURA luminosa en el cierre lejano, arriba del cuadro; se construyó una columna clara en el centro | PROBADO MAL |
| G1 | C2 pares | pilares cada 6 tiles a ±2 del camino | los pares de las tomas flanquean UNA transición (escalera, paso) con hueco ≥ 5 integrantes; aquí cayeron junto al héroe y lo taparon | PROBADO MAL |
| G2 | B2 relieve concentrado | `subs` 1 | `subs` 1 aplana todo y borra el bordillo de franja media que los jueces premian; el truco es concentrar el relieve en un grupo, no quitarlo | PROBADO MAL |
| G2 | B4 exagerar arquitectura | `exag` 1,3 global | `exag` es no lineal (aparente ≈ dato^exag × vScale, A170) y sube también el cierre del fondo, que tapa el vistazo; el truco es exagerar piezas elegidas | PROBADO MAL |
| G2 | B7 escala vertical | `vScale` 1,25 global | sube peldaños y muros por igual; nadie fijó qué debía verse | PROBADO MAL |
| G3 | E1 obstructor de borde | pilar 2×2, 6 H en el 15 % lateral | separación del muro (en sala 3 se fundió en losa y perdió 0–3) | PROBADO A MEDIAS: columna suelta gana 3–0 dos veces (A352) |
| G3 | E2 baranda media | bordes con caída que ya cayeran en 35–65 % del alto | el ENCUADRE que pone la baranda ahí (posición mirador o ajuste de `heroScreen`); salió vacía en las 9 | NUNCA PROBADO |
| G3 | E3 cinta | cinta de T42 sobre el camino | las tomas no tienen cinta: tienen una calcomanía en el hotspot (pentagrama); los jueces lo dijeron | TRUCO EQUIVOCADO (ver C3) |
| G1–G3 | base | vistazo con Δ ≤ 4 H | puerta de presencia del vistazo: en sala 9, V = 2,5 % (G1) y 0,4 % (G2); la BASE no tenía el truco que la define | defecto de base |

Conclusión: los tres pases negativos no cierran ningún truco. Todos vuelven a la cola con ficha.

---

## 2. Lo que se ve en las dos tomas de referencia

Medido a ojo por [R] sobre c_1320 (0137) y c_bc55 (0202), 1280×720, ±0,02. Estos rangos son los objetivos de pantalla de las fichas.

**0137 (sala F, héroe cerca del borde norte):**
- Héroe (el que encabeza): x ≈ 0,61–0,65, pies y ≈ 0,74; alto ≈ 0,128 (A274).
- Balaustrada: línea continua de x ≈ 0,30 a 1,00, de y ≈ 0,42 (pasamanos) a y ≈ 0,57 (base). Postes gruesos cada ≈ 0,25 del ancho, de 1,2–1,6 H (A210: postes 1,56 H). Detrás, el salón de abajo (vistazo).
- Primer plano izquierdo: estatua del dragón sobre plinto, x 0,00–0,20, y 0,40–0,95, cortada por el borde izquierdo (B1).
- Columnas de borde: dos columnas con faroles, x 0,00–0,10 y 0,12–0,20, desde fuera del cuadro por arriba hasta y ≈ 0,45 (B3–B4).
- Vano focal: ventana luminosa, x 0,48–0,62, y 0,05–0,21, cerca del eje.
- Calcomanía: pentagrama en el suelo, x 0,75–1,00, y 0,62–0,78, junto al héroe (hotspot, no camino).
- Escalera que baja junto a la balaustrada: x 0,30–0,52, y 0,53–0,78, con pretil bajo.
- Esquina inferior derecha: masa oscura desenfocada que corta el cuadro.
- Centro del cuadro (x 0,30–0,75, y 0,20–0,60): abierto hasta el fondo.

**0202 (sala F desde el sur, héroe más allá del pretil):**
- Héroe: x ≈ 0,50, y ≈ 0,42–0,52; alto ≈ 0,072 (A274).
- Par de columnas-búho que flanquean la escalera del eje: x 0,35–0,46 y 0,65–0,77; salen por arriba del cuadro y apoyan en el pretil (y ≈ 0,65). Hueco libre entre ellas ≈ 0,19 del ancho (≈ 5 integrantes, A194).
- Escalera sobre el eje: x 0,45–0,66, y 0,62–0,90 (B1–B2), sube hacia el héroe.
- Pretil (línea de nivel): y ≈ 0,53–0,60, de lado a lado.
- Masas de esquina inferior: dos bloques-plinto, x 0,19–0,34 y 0,80–0,96, y 0,55–1,00, cortados por el borde inferior.
- Calcomanía: pentagrama bajo el héroe, x 0,45–0,65, y 0,42–0,57.
- Fondo: segunda balaustrada en y ≈ 0,10–0,17; dragón sobre tarima con escalones arriba a la izquierda (x 0,00–0,25, y 0,00–0,50).

**Patrones comunes (base de las fichas):**
1. Siempre hay una línea de nivel horizontal continua entre y 0,42 y 0,60, de ≥ 70 % del ancho.
2. Las masas altas están en los bordes laterales (x < 0,20 o > 0,80) o forman un par simétrico que enmarca al héroe, sin taparlo.
3. Hay masas bajas que cortan las esquinas inferiores (B1).
4. El centro queda abierto hasta un fondo lejano con algo luminoso o escalonado arriba.
5. La calcomanía marca dónde está el héroe, no el camino.

Fuentes externas (contexto, no objetivos): el remake de DQ3 conserva la disposición de los edificios pero cambia la escala y las distancias del mapa ([PlayStation Blog, 2024](https://blog.playstation.com/2024/11/08/dragon-quest-iii-hd-2d-remake-interview-how-the-classic-rpg-was-revamped-for-its-ps5-debut/)). El estilo combina sprites con fondos 3D, cámara con movimientos complejos y posproceso (DoF, tilt-shift), que aquí queda fuera del Ancla ([Wikipedia, HD-2D](https://en.wikipedia.org/wiki/HD-2D)).

---

## 3. Palancas del visor (lo que CC puede tocar sin `src/`)

Árbol congelado e882c5c. Arnés: visor de trabajo idéntico al repo, packs inyectados en tiempo de ejecución (A236); hooks de página declarados (`HYP.wallH`, `HYP.colH`, `planesTest.noFront`, `volumesTest.noGrid`, `volumeOnWalkable`).

| Palanca | Qué hace exactamente | Cuidado |
|---|---|---|
| Cam 6 | perspectiva, FOV 30, pitch 25°, yaw de `orient` | las tomas miden ≈ 23° ± 5° (A255); no cambiar |
| `heroFrac` | zoom: alto del héroe en pantalla | 0,10 por defecto; tomas 0,072–0,128 (A274) |
| `heroScreen` [fx, fy] | dónde quedan los pies del héroe en el cuadro | es la palanca de ENCUADRE de las fichas A6 y C7 |
| `heroAt` | posición del héroe en el mapa | |
| `tilesPerH` | tiles por H (relación héroe–mundo) | 1,5 en DQ3 (A159) |
| `terraces`, `subs`, `terH` | cuantización de alturas | base: terraces 3, subs 2 (A343); cambian máscara y camino (A258) |
| `vScale` | multiplica TODAS las alturas (peldaños incluidos) | no usar como truco |
| `exag` | aparente ≈ dato^exag × vScale en muros, volúmenes y objetos | no usar global; ver B4 |
| `planes` | cierres BACK/SIDE y columnas a `HYP.wallH`/`HYP.colH` | BACK = baranda 1 H en la base |
| `volumes` (S4b) | volúmenes sobre tiles bloqueados | solo sobre azul (A285, A288) |
| overlay rojo | volúmenes o billboards con pie en azul, por profundidad, sin `always` | cuenta para el 30 % de billboards |
| cintas | calcomanías que pintan la cara de arriba de cualquier tile | no son billboard (regla 10) |
| `objects` | billboards (wH, always) | ≤ 30 % del cuadro contando el rojo |
| `stageBorder` | quebrada/isla: caras de caída en el borde | solo visual (A259, A289) |
| ventana | margen que decide qué salas vecinas se dibujan | vistazo: incluir la vecina entera |
| Cam 5 | ortográfica cenital (planta de control) | no es cámara de juego |

Medidas estándar que CC ya sabe hacer: render de ids (cada pieza con su id → % del cuadro y caja en pantalla), V(p) de la vecina, oclusión del héroe (> 25 % de silueta), hashes ×2.

---

## 4. Fichas

Formato: 1 identidad · 2 qué es · 3 por qué funciona · 4 objetivo en pantalla · 5 precondiciones · 6 receta · 7 puerta de presencia · 8 si el mapa no lo permite · 9 prueba y lectura · 10 interacciones · 11 estado.

### Grupo A — profundidad por planos

#### A1 · Vistazo (mirador)
1. Catálogo A1; [U] (Torre del Soñador, A296); PROBADO en P1 y P2.
2. Desde la sala actual se ve el suelo de otra sala por encima del cierre del fondo. Referencia: 0137, salón de abajo tras la balaustrada.
3. Da un plano lejano real con su propia profundidad: el cuadro gana B4–B5 sin cielo vacío.
4. V(p) ≥ 10 % del cuadro en k4 y ≥ 8 % en al menos 2 de {k0, k4, k8, k_mir}; la superficie de la vecina queda por encima de la línea del cierre y debajo de y 0,45.
5. Una sala vecina cuyo suelo transitable empiece a ≤ 10 tiles del borde de fondo en la dirección de la cámara.
6. (a) Cierre BACK de `planes` → baranda de 1 H. (b) Margen de ventana mínimo que incluya entera la vecina. (c) Vecina +Δ, con Δ el menor de {0; 0,5; …; 4,0} H tal que V(k4) ≥ 10 % (P2 pedía 20 % y no lo alcanzó; el 10 % es propuesta de [R], se congela con la pasada). (d) Si con Δ = 4 H no llega: bajar el suelo de la sala actual no está permitido; probar Δ NEGATIVO (vecina más baja: −0,5 … −4 H), que es el caso de 0137 (la sala actual es el mirador alto). Se informa V de cada Δ.
7. PRESENTE si se cumple el objetivo de 4. AUSENTE si ningún Δ en [−4; +4] lo logra.
8. Sala sin vecina en la dirección de la cámara: la sala no sirve como base de pases de composición; se reemplaza por la siguiente candidata por id.
9. Ya probado (9–0 en P2). En los pases nuevos es BASE, no se compara.
10. Lo tapan: A3 si cae en el centro, B4 si sube el cierre, A6 si la baranda pasa de 1,1 H.
11. PROBADO BIEN (P1, P2); defecto de base en G1–G3 (sin puerta, sala 9 con V 0,4–2,5 %).

#### A2 · Cierre en dos planos
1. Catálogo A2; razón de jueces de P2 (A337).
2. Barrera baja cercana + masa más alta y lejana detrás.
3. El ojo lee dos distancias en vez de una pared.
4. Barrera: alto aparente ≤ 0,08 del cuadro; masa lejana visible por encima de ella en ≥ 30 % del ancho de la barrera.
5. Igual que A1, o un fondo construido (A4) si no hay vecina.
6. Es el resultado de A1 + baranda de 1 H. Sin vecina: barrera de 1 H + fondo falso (A4b).
7. PRESENTE si se cumplen las dos cifras de 4.
8. Sin vecina ni fondo construible → AUSENTE.
9. Ya probado. Variante sin probar: masa lejana construida (A4b) contra vecina real (A337).
10. Igual que A1.
11. PROBADO BIEN (indirecto, P2).

#### A3a · Columna suelta de borde
1. Catálogo A3 (refinado); jueces de G2 y G3 (A346, A352).
2. Una columna alta y separada de todo, pegada al borde lateral del cuadro, que sale por arriba. Referencia: 0137, columnas con farol a la izquierda (x 0,00–0,20).
3. Enmarca el cuadro, da un plano cercano sin tapar el centro y marca la escala vertical.
4. En k4: caja de la columna dentro de x ∈ [0,00; 0,18] o [0,82; 1,00]; ancho aparente 0,04–0,10 del cuadro; el tope sale por arriba (caja con y_min = 0); la base, visible o no, por debajo de y 0,40. Ningún píxel en x ∈ [0,22; 0,78]. Separación: en pantalla, ≥ 0,02 del ancho de cielo, fondo o suelo entre la columna y cualquier otra masa vertical a su lado (no se funde).
5. Algún tile no transitable (azul, dentro o FUERA de la sala, incluido el frente cortado) cuya proyección en k4 caiga en la franja lateral.
6. (a) Listar los tiles azules del frustum de k4 cuyo centro proyecta en x ∈ [0,02; 0,14] o [0,86; 0,98]. (b) Ordenar por distancia a la cámara, primero los de B2–B4 (las columnas de 0137 están a media profundidad), después B1. (c) Para cada candidato: columna de 2×2 tiles (≈ 1,3 H de ancho con tilesPerH 1,5), altura en dato tal que el tope salga del cuadro en k4 (subir de 1 H en 1 H desde 5 H hasta 12 H; NO usar `exag`). (d) Comprobar 4 en el render de ids; si se funde con un muro, probar el siguiente candidato. (e) Un lado por vez; si los dos lados tienen candidato válido, poner uno solo, en el lado OPUESTO al de mayor masa ya existente (asimetría como en 0137). (f) Va como overlay rojo: volumen con pie en azul.
7. PRESENTE si en k4 se cumplen todas las cifras de 4 y en k0 y k8 la columna no entra en x ∈ [0,22; 0,78]. Si en k0 o k8 entra al centro, se informa (no se mueve: es geometría del mundo).
8. Sin candidato en ninguno de los dos lados → AUSENTE en esa sala.
9. BASE+A3a contra BASE. Predicción: aporta (≥ 5 de 9). Palabras de un juez que lo percibió: «columna», «pilar», «enmarca», «borde», «sale por arriba».
10. Puede tapar el vistazo si queda en x 0,22–0,78 en otra posición; A3b y A3a no van del mismo lado.
11. PROBADO A MEDIAS (G3: 3–0 dos veces cuando está suelta).

#### A3b · Masa baja de esquina inferior
1. Catálogo A3 (subtipo nuevo); tomas 0137 y 0202.
2. Una masa baja y ancha (plinto, estatua, bloque) que corta una esquina inferior del cuadro, en el primer plano. Referencia: 0137 dragón (x 0,00–0,20, y 0,40–0,95); 0202 plintos (x 0,19–0,34 y 0,80–0,96, y 0,55–1,00).
3. Pone un plano B1 que el ojo salta para entrar en la escena; refuerza la profundidad sin tocar el centro.
4. En k4: caja que toca el borde inferior (y_max = 1,00) o un borde lateral en la mitad inferior; ancho 0,10–0,20 del cuadro; alto aparente 0,25–0,55 del cuadro; borde superior por debajo de y 0,40; no tapa > 25 % del héroe; ningún píxel en x ∈ [0,30; 0,70] por debajo de y 0,60 salvo que sea su pareja simétrica (0202).
5. Tiles azules en B1 (cerca de la cámara, incluido el frente cortado) que proyecten en las esquinas inferiores.
6. (a) Candidatos: tiles azules cuya proyección en k4 cae en x ∈ [0,00; 0,25] o [0,75; 1,00] e y ∈ [0,70; 1,00]. (b) Bloque de 3×2 tiles (ancho × fondo), altura de dato 1,5–3 H (subir hasta que el alto aparente entre en 4). (c) Overlay rojo con pie en azul. (d) Un solo lado, opuesto a A3a si ambos están.
7. PRESENTE si se cumplen las cifras de 4.
8. Sin candidato → AUSENTE.
9. BASE+A3b contra BASE. Sin predicción (nuevo). Palabras: «primer plano», «esquina», «estatua», «bloque abajo».
10. No del mismo lado que A3a.
11. NUNCA PROBADO.

#### A4 · Vano focal en el fondo (fondo falso)
1. Catálogo A4/A5; tomas 0137 (ventana luminosa).
2. Una abertura luminosa (ventana, puerta, haz) en el cierre más lejano, arriba del cuadro y cerca del eje.
3. Da un punto de fuga visual al final del eje y confirma que «hay más allá».
4. En k4: rectángulo claro de ancho 0,08–0,16 y alto 0,10–0,20 del cuadro; centro en x ∈ [0,40; 0,62] e y ∈ [0,05; 0,25]; luminancia media ≥ 2× la del cierre que lo rodea; por detrás de todo lo demás (ningún píxel suyo tapa otra pieza).
5. Un cierre lejano visible (pared de la vecina o fondo) en y < 0,30 sobre el eje.
6. (a) Elegir la superficie lejana visible en la columna del eje en k4. (b) Poner detrás (más lejos que ella) un billboard plano, claro, sin `always`, del tamaño de 4, que asome por un hueco: o se recorta un hueco de 2–3 tiles en la pared lejana (si es de `planes` o volumen, bajar esos tiles a la altura del suelo de la vecina), o el billboard se pone sobre la pared como textura plana pegada a su cara (A4b, fondo falso). (c) NUNCA un volumen que sobresalga (G1 lo convirtió en columna).
7. PRESENTE si se cumplen las cifras de 4 en k4 y el vano se ve en al menos 2 de 3 posiciones.
8. Sin superficie lejana en la columna del eje → AUSENTE.
9. BASE+A4 contra BASE. Sin predicción. Palabras: «ventana», «luz», «abertura», «fondo», «punto».
10. Cuenta para el 30 % de billboards (es pequeño, ≈ 1–3 %). Lo tapa A3a si cae en el centro.
11. PROBADO MAL (G1).

#### A6 · Línea de nivel en la franja media (baranda o pretil)
1. Catálogo A6 + E2 de G3; jueces de G1 y G2, 3 de 3 (A346: «un escalón o bordillo continuo que cruza la franja media, como la balaustrada»); [U] 01:22 («la baranda necesita un encuadre especial»).
2. Una línea horizontal continua (baranda, pretil, borde de terraza con caída) que cruza el cuadro a media altura y separa el suelo cercano del lejano. Referencia: 0137 (y 0,42–0,57) y 0202 (y 0,53–0,60).
3. Divide el cuadro en cerca y lejos con una sola línea; es el «escalón» que hace leer dos planos.
4. En la posición juzgada: el borde superior de la línea entre y 0,40 y 0,60; longitud continua visible ≥ 0,60 del ancho; altura aparente de la baranda 0,7–1,1 H con postes de 1,2–1,6 H cada 3–4 tiles (A210: toma 0202 1,10 H; postes de 0137 1,56 H; 0149 0,70 H); el héroe por debajo (0137) o por encima (0202) de la línea, nunca cortado por ella en la cintura.
5. Un borde con caída ≥ 1 subnivel que corra sobre todo en X (≥ 60 % de su largo en X, para cámara con yaw 0): el BACK del vistazo (A1) o un borde de terraza interior que produce `subs` 2.
6. El truco tiene dos partes; sin la segunda no existe (lo que falló en G3):
   - **Geometría.** (a) Elegir el borde: primero el BACK del vistazo; si no, el borde de terraza más largo en X dentro de la sala. (b) Sobre el tile ALTO del borde (el lado transitable), baranda de 0,8 H como overlay rojo con pie en el tile azul del lado bajo; si los dos lados son verdes, la baranda va sobre el lado bajo con 0,8 H + la diferencia de nivel, para no cortar el paso (nunca sobre un tile del camino). (c) Postes de 2×1 tiles, 1,4 H, cada 4 tiles. (d) Deja libres los tiles donde el camino cruza el borde (escalera).
   - **Encuadre.** (e) Para cada posición juzgada, calcular y_borde (proyección del tope de la baranda en la columna del héroe). (f) Si y_borde ∉ [0,40; 0,60], ajustar `heroScreen` fy dentro de [0,45; 0,80] (pies del héroe más abajo = la línea sube en pantalla) hasta entrar; fx no cambia. (g) Si con fy en el tope no entra, usar k_mir (mirador: tile del eje a 2–4 tiles del borde, como 0137) y declarar la sustitución.
7. PRESENTE si en la posición juzgada se cumplen todas las cifras de 4 (medidas en el render de ids). Se informa fy usado.
8. Sala sin borde en X ≥ 0,6 del ancho de la sala → AUSENTE. No se inventa un borde.
9. BASE+A6 contra BASE en k4 y en k_mir (el BASE también con el mismo `heroScreen`, para que solo cambie la geometría; una segunda comparación BASE con fy por defecto contra BASE+A6 con fy ajustado mide el encuadre). Predicción: aporta (≥ 5 de 9). Palabras: «baranda», «balaustrada», «borde», «escalón», «separa».
10. Necesita A1 (si está en el BACK); su altura no debe pasar de 1,1 H o tapa el vistazo; C7 usa el mismo `heroScreen`.
11. NUNCA PROBADO (G3: E2 vacía).

#### A7 · Corte del lado de cámara (diorama)
1. Catálogo A7; trono DQ3 (v24).
2. Sin muro ni techo entre la cámara y la sala.
3. La sala se ve entera, como maqueta.
4. Ningún muro de cierre en y > 0,85 salvo las piezas declaradas de A3b.
5. Ninguna.
6. Hook `planesTest.noFront` (ya en la base).
7. PRESENTE si se cumple 4.
8. —
9. No se compara: es regla de la base.
10. A3b vive en el hueco que deja.
11. REGLA (base).

#### A8 · Paso por detrás
1. Catálogo A8; HIPÓTESIS (SNES: prioridad de capas).
2. El héroe pasa por debajo o por detrás de un dintel, arco o copa.
3. Confirma que el primer plano está DELANTE del héroe.
4. En alguna posición del camino, una pieza tapa entre el 10 % y el 60 % del héroe desde arriba (dintel) o desde un lado.
5. Un paso (puerta, transición entre zonas) en el camino.
6. Arco: dos postes en tiles azules a los lados del paso + dintel a 1,6–2,0 H sobre el suelo, que cruza sobre el camino. CC primero comprueba si el visor admite un volumen con base elevada sobre tiles verdes sin `src/` (`volumeOnWalkable`); si no, PARADA y se informa.
7. PRESENTE si 4 se cumple en al menos 1 posición de una caminata de 9.
8. Sin paso en el camino → AUSENTE.
9. Prueba en caminata (no en 3 posiciones). Sin predicción.
10. Choca con la regla «héroe tapado ≤ 25 %»; [U] la retiró para el rojo (A102).
11. NUNCA PROBADO; posible bloqueo técnico.

### Grupo B — altura

#### B1 · Escalera sobre el eje
1. Catálogo B1; 0202; reglas v0 (A114, A126).
2. Una escalinata en la dirección de la cámara que lleva hacia el destino.
3. Dibuja el eje con peldaños: guía y profundidad a la vez.
4. Escalera visible en B1–B2, centrada en x ∈ [0,40; 0,65], ancho 0,15–0,25 del cuadro, ≥ 4 peldaños visibles.
5. Una transición entre dos zonas de distinto nivel cruzada por el camino.
6. En la transición, ensanchar el paso a ≈ 4–5 integrantes (A194) y convertirlo en escalera de 4–5 peldaños hacia la zona alta (micro-terrazas, A090), alineada con el flujo.
7. PRESENTE si se cumple 4 en al menos 1 posición.
8. Sin transición → AUSENTE.
9. BASE+B1 contra BASE. Sin predicción.
10. Con C2 (par que la flanquea) forma el conjunto de 0202.
11. NUNCA PROBADO como truco (aparece en terreno a mano, 4h).

#### B2 · Relieve concentrado
1. Catálogo B2; trono y 0202; [U] (A090: «DQ3 es súper plano»).
2. El suelo es plano por zonas y todo el cambio de nivel se agrupa en un solo lugar (escalinata, tarima).
3. Un solo foco de relieve se lee como destino; el relieve repartido se lee como ruido.
4. Dentro del cuadro: ≥ 60 % del suelo transitable visible al nivel del héroe; ≤ 2 líneas de nivel visibles además de A6; los peldaños juntos en una franja de ≤ 0,25 del ancho.
5. El terreno `terraces` 3, `subs` 2.
6. Transformar el pack en tiempo de ejecución (arnés, A236; nada de `src/`): (a) cada componente conexa de suelo transitable de la sala toma una sola altura (la mediana de sus tiles); (b) las transiciones entre componentes por donde pasa el camino se vuelven escalera (B1); (c) las demás transiciones quedan como borde con caída (sirven a A6). Se declaran los hashes de máscara y camino; si cambian, se informa (no PARA).
7. PRESENTE si se cumple 4 en k4.
8. Sala de una sola componente → no aplica (ya es plana).
9. BASE+B2 contra BASE. Predicción: aporta si conserva el borde medio (A6).
10. NO es `subs` 1 (eso borró el borde medio y perdió 1–8, G2).
11. PROBADO MAL (G2).

#### B3 · Altura fingida (plinto)
1. Catálogo B3; [U] (v259: rojo decorativo; A107 fake height); 0202 dragón sobre tarima.
2. Una zona no transitable presentada como elevación: tarima, plinto con estatua.
3. Da relieve sin tocar el suelo caminable.
4. Bloque azul elevado 1,0–2,0 H con su cara superior visible (≥ 1 % del cuadro), en B2–B4, fuera del eje (x < 0,35 o > 0,65).
5. Una isla azul dentro de la sala o junto a un borde lateral.
6. Subir los tiles azules de esa isla a suelo + 1,5 H (volumen S4b o pack); cara superior pintada (cinta) de otro tono; opcional: estatua encima como overlay rojo.
7. PRESENTE si se cumple 4.
8. Sin isla azul → AUSENTE.
9. BASE+B3 contra BASE. Sin predicción.
10. Base de N1.
11. DATO [U], NUNCA PROBADO.

#### B4 · Exagerar piezas elegidas, no el conjunto
1. Catálogo B4; 4d-2 (exag); A162 (no hay un `exag` global que sirva).
2. Solo las piezas de encuadre crecen; suelo, peldaños y cierre del fondo no.
3. La arquitectura alta enmarca; el fondo sigue a la vista.
4. Las columnas A3a salen por arriba; el cierre BACK y la vecina con la misma altura aparente que en BASE (± 2 px).
5. A3a presente.
6. `exag` = 1 siempre. Cada pieza elegida recibe su altura en el dato (fórmula inversa de A181: dato = aparente ÷ vScale si exag = 1).
7. PRESENTE si se cumple 4.
8. Sin A3a → AUSENTE.
9. Va dentro de A3a (no se compara aparte).
10. —
11. PROBADO MAL (G2, `exag` global).

#### B5 · Cara de caída visible
1. Catálogo B5; mapa 4F (faja oscura); T44.
2. Bajo la baranda se ve la pared vertical que cae al nivel inferior.
3. Confirma que la sala está alta: el vistazo se lee como «abajo».
4. Franja de cara de caída de alto ≥ 0,015 del cuadro, justo debajo de la línea A6, a lo largo de ≥ 50 % de ella.
5. A1 con Δ < 0 (la vecina más baja) o un borde de terraza.
6. `stageBorder` quebrada (dibuja caras de caída; solo visual, A289) o, si no basta, volumen azul oscuro bajo el borde.
7. PRESENTE si se cumple 4.
8. Sin caída → AUSENTE.
9. Va con A6 (no aparte).
10. —
11. VISTO, NUNCA PROBADO.

#### B6 · Profundidad comprimida
1. Catálogo B6; A223 (toma/mapa en Z 0,31–0,67, sin verificar).
2. La sala del remake es más corta en Z que en el mapa.
3. Hipótesis: con menos Z el fondo queda más cerca y el cuadro se llena.
4. Por definir tras G4-M.
5–8. No se especifica hasta medir.
9. No se prueba ahora.
10. Ligado a G4 (cámaras).
11. HIPÓTESIS; espera G4-M.

### Grupo C — encuadre y guía

#### C1 · Eje y hotspot
1. Catálogo C1; [U] (A202, A206: el hotspot va siempre sobre el eje de flujo).
2. La sala tiene un eje (dirección de flujo); el héroe y el destino están sobre él.
3. El ojo sigue una línea de primer plano a fondo.
4. El eje (línea del camino) cruza el cuadro en x ∈ [0,40; 0,65] de B1 a B4; el héroe sobre él.
5. `orient` da el yaw del flujo.
6. Regla de la base: yaw por `orient` (POI primero, #91); hotspot = tile del eje, transitable, central salvo POI.
7. PRESENTE si se cumple 4.
8. —
9. Regla de base.
10. Base de C2, C3, A6.
11. REGLA.

#### C2 · Par que flanquea una transición
1. Catálogo C2; 0202 (búhos), 0206 (pilares de escalera), 0156.
2. Dos columnas simétricas a los lados de una escalera o paso del eje; el héroe pasa entre ellas.
3. Marcan la puerta del plano siguiente y enmarcan al héroe sin taparlo.
4. Cuando el héroe está a ≤ 3 tiles de la transición: las dos columnas en x ∈ [0,30; 0,48] y [0,60; 0,80]; hueco libre entre ellas ≥ 0,17 del ancho (≈ 5 integrantes, A194); salen por arriba o llegan a y ≤ 0,15; tapan ≤ 10 % del héroe.
5. Una transición del camino (B1) con tiles azules a ambos lados a ≤ 3 tiles.
6. (a) Localizar la transición (escalera) que el camino cruza. (b) Una columna de 2×2 tiles a cada lado, sobre azul, simétricas respecto del eje, con el hueco de 4. (c) Altura en dato hasta que salgan por arriba desde la posición más cercana. (d) Solo UN par por sala (no cada 6 tiles, como en G1).
7. PRESENTE si se cumple 4 en la posición juzgada (se juzga la posición del camino más cercana a la transición, no k0/k4/k8 fijos).
8. Sin transición con azul a los lados → AUSENTE.
9. BASE+C2 contra BASE. Sin predicción.
10. Con B1 forma 0202; A3a no del mismo lado si cae en x < 0,30.
11. PROBADO MAL (G1).

#### C3 · Calcomanía en el hotspot
1. Catálogo C3; 0137 y 0202 (pentagramas); jueces de G3 («R no tiene camino»).
2. Una figura grande pintada en el suelo donde está el héroe o el POI: pentagrama, hexagrama, círculo.
3. Marca «aquí» sin geometría y da una forma en perspectiva que muestra el plano del suelo.
4. Figura de 4×4 a 6×6 tiles, 3–8 % del cuadro, en B2–B3, centrada en el hotspot o a ≤ 4 tiles al lado; contraste de luminancia ≥ 0,15 con el suelo.
5. Hotspot en suelo plano de ≥ 6×6 tiles.
6. Cinta (calcomanía) con dibujo de anillo + estrella en los tiles del hotspot; mismo tono para todas las salas.
7. PRESENTE si se cumple 4.
8. Hotspot en terreno no plano → AUSENTE.
9. BASE+C3 contra BASE. Sin predicción. Palabras: «símbolo», «círculo», «marca en el suelo».
10. Reemplaza a la cinta de camino (E3), que sale del catálogo de composición (queda como capa declarada de guía, T43).
11. TRUCO EQUIVOCADO en G3 (se probó la cinta); NUNCA PROBADO.

#### C4 · Pasillo ancho
1. Catálogo C4; [U] (A182, A194: 5 integrantes).
2. Los pasos y pasillos son anchos en escala del héroe.
3. Escala heroica y camino legible.
4. Ancho libre ≥ 5 integrantes (≈ 3,0 H con el sprite de la toma: 5 × 0,6 H, calculado de A186) en pasos y escaleras visibles.
5. —
6. Regla de escala: `tilesPerH` 1,5; en transformaciones de pack, los pasos se ensanchan a ese mínimo.
7. PRESENTE si se cumple 4 en todos los pasos del cuadro.
8. —
9. Regla de base.
10. B1, C2.
11. DATO [U].

#### C5 · Dos escalas de héroe
1. Catálogo C5; A274 (0,072 en 0202 y 0,128 en 0137).
2. El héroe cambia de tamaño en pantalla según la posición.
3. Por definir.
4–8. Depende de G4-M3.
9. No se prueba ahora.
10. G4.
11. HIPÓTESIS; espera G4-M.

#### C6 · Cámara casi ortográfica
DESCARTADO (A347): va contra el Ancla.

#### C7 · Encuadre por posición
1. Catálogo C7; NintendoLife (OT2, «variety of camerawork»); [U] 01:22.
2. La cámara ajusta el encuadre según dónde está el héroe, no solo lo sigue.
3. Pone las líneas de nivel y el destino en los tercios del cuadro.
4. Igual que A6 (línea en y 0,40–0,60) y meta en cuadro.
5. A6 presente.
6. El ajuste de `heroScreen` de A6 (f) es la primera regla de C7; las demás esperan G4.
7. Va con A6.
8. —
9. Va con A6.
10. G4 (dos cámaras).
11. HIPÓTESIS.

### Nuevos (de las tomas y del 4h)

#### N1 · Escalera – estatua – escalera
1. Nuevo; [U] (A214, A217), 0202/0137.
2. Dos escaleras laterales con un plinto en medio y una estatua encima, a lo largo de un muro.
3. Da relieve concentrado, un hito y dos pasos en un solo bloque.
4. Visible en k0 o k4: plinto (B3) + estatua (A3b o rojo) + al menos una escalera.
5. Un borde de zona con dos pasos cercanos (≤ 10 tiles entre ellos).
6. Plinto azul entre los dos pasos a la altura de la zona alta; escaleras en los pasos (B1); estatua 2–3 H encima como overlay rojo.
7. PRESENTE si se cumple 4.
8. Sin dos pasos → AUSENTE.
9. BASE+N1 contra BASE. Sin predicción.
10. B1, B3, A3b.
11. VISTO (terreno a mano, 4h), NUNCA PROBADO por regla.

### Grupo D — fuera del Ancla (no se prueban en el visor)
D1 desenfoque de B1 y B5 (DoF/tilt-shift; [PlayStation Blog](https://blog.playstation.com/2024/11/08/dragon-quest-iii-hd-2d-remake-interview-how-the-classic-rpg-was-revamped-for-its-ps5-debut/): «In HD-2D, depth of field is extremely important») · D2 luz guía · D3 niebla y gradiente de fondo · D4 sprites con luz. Van en Unity.

---

## 5. Pasada única de CC (diseño propuesto)

Una pasada, pases en orden, todos sobre la MISMA base. Así no hace falta conocer ganadores entre pases y el juicio va al final.

**Pase 0 — base y puertas.**
- Terreno `dac_stage` con `terraces` 3 y `subs` 2. Salas candidatas por la regla de G2 (250–600 tiles, vecina a ≤ 10 tiles), las 3 primeras CON A1 PRESENTE (ficha A1, Δ en [−4; +4]). Se informa por qué se descartan las que no.
- BASE = A1 + A2 + A7 + C1 + C4 con Cam 6, `heroFrac` 0,10, `exag` 1, `vScale` 1.
- Posiciones: k0, k4, k8 y k_mir.
- Hoja de presencia de la BASE.

**Pases 1–8 — un truco por pase, BASE+X:**
1. A6 (con su encuadre) · 2. A3a (+B4) · 3. A3b · 4. C3 · 5. A4 · 6. C2 (+B1 si hay transición) · 7. B3 · 8. N1.
Después: **TODO** = BASE + todos los PRESENTES.

**Entregas por pase:** PNG limpios, hoja de presencia (PRESENTE con medidas / AUSENTE con motivo), hashes ×2, y las medidas de la puerta. Nada de hojas con juicio.

**Juicio (después de la pasada, por [R]):** jueces ciegos en tandas de ≤ 9 contra 0137 (y contra 0202 en A3b, C2, B1); BASE+X contra BASE solo donde X está PRESENTE; TODO contra BASE. Pares idénticos = AUSENTE, aparte. Predicciones congeladas por [R] antes de abrir los PNG.

**Quedan fuera de esta pasada:** B2 (transforma el pack: va en un pase propio después), A8 (puede requerir `src/`), B6, C5 y C7 más allá de A6 (esperan G4-M), D (Unity).

---

## 6. Abierto
- Las cifras de la sección 2 son lecturas de [R] a ojo (±0,02); CC debe re-medirlas en 0137 y 0202 con cajas antes de la pasada y, si difieren > 0,03, los rangos de las fichas se ajustan antes de congelar.
- Las fichas dependen de que el visor pueda poner overlay rojo fuera de la sala (frente cortado): si no, A3a y A3b pierden candidatos; CC lo comprueba en el Pase 0.
- Esta propuesta no cambia el Ancla.
