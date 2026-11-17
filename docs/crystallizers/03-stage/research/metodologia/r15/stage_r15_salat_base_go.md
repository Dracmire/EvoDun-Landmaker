# Pedido a CC · R1.5 · Sala de prueba T: Base + Verificación 1 (v322)

Protocolo: `PROTOCOLO_PRUEBAS.md` (v322). Fichas: `INFORME_METODO_TRUCOS.md` §4, con los ajustes de `r15/PREDICCION_R15_PASADA_v321.md` §2. Predicciones de [R] congeladas antes de este pedido: `r15/PREDICCION_R15_SALAT_v322.md`.

TU PAPEL: construyes, renderizas y mides. No juzgas composición ni escribes «se parece». Este pedido termina en la Verificación 1 (sus partes medibles). NO corras jueces. NO entregues comparaciones con juicio. Al terminar, PARA.

## 0. Entorno
- Árbol congelado `e882c5c`, el mismo visor de trabajo y el mismo arnés de la pasada única (packs inyectados en tiempo de ejecución, hooks de página, sin tocar `src/`).
- Si algo de este pedido exige tocar `src/`, PARADA: dilo y no sigas con esa parte.

## 1. La sala T (pack sintético)
Unidades: tiles. `tilesPerH` 2 (1 H = 2 tiles). Alturas en H, absolutas. X de 0 a 40 (oeste → este), Z de 0 a 55 (sur → norte). La cámara mira al NORTE en todas las posiciones (yaw declarado; si `orient` da otro, fíjalo y dilo).

| Pieza | x | z | Altura | Clase | Para qué |
|---|---|---|---|---|---|
| Entrada | 18–22 | 0–3 | 1,25 | transitable, zona 1 | inicio del camino |
| Suelo bajo L0 | 8–32 | 4–17 | 1,25 | transitable, zona 1 | |
| Escalera central | 17–23 | 14–17 | 1,25 → 2,5 | transitable, 5 peldaños | B1 (estructura: va en todos los estados) |
| Suelo alto L1 | 8–32 | 18–37 | 2,5 | transitable, zona 1 | |
| Labio norte | 8–32 | 38 | 2,5 | bloqueado (azul) | base de la baranda A6 |
| Salón (vecina) | 8–32 | 39–51 | 0 | transitable, zona 2 (fuera del movimiento) | vistazo A1 con Δ −2,5 H, cara de caída B5 |
| Muro norte del salón | 4–36 | 52–55 | 4 | bloqueado | fondo; aquí va el vano A4 |
| Muros laterales del salón | 4–7 y 33–36 | 39–51 | 4 | bloqueado | |
| Anillo lateral | 2–7 y 33–38 | 0–38 | la del suelo vecino (1,25 junto a L0, 2,5 junto a L1) | bloqueado | candidatos A3a / A3b |
| Frente sur | 8–17 y 23–32 | 0–3 | 1,25 | bloqueado | candidatos A3b |
| Franjas de L0 | 8–10 y 30–32 | 4–9 | 1,25 | bloqueado | candidatos A3b (grupo s) |
| Bases del par | 14–15 y 25–26 | 15–17 | 1,25 | bloqueado | candidatos C2 |
| Isla | 10–13 | 22–26 | 2,5 | bloqueado | candidato B3 |
| Muros exteriores | 0–1 y 39–40 | 0–55 | 5,5 | bloqueado | cierre lateral |
| Hotspot | 17–23 | 28–34 | 2,5 (llano) | transitable | meta = (20, 31); C3 |

- Terreno: `terraces` 3, `subs` 1, salto de terraza 1,25 H (como A373). Si la cuantización no deja las tres alturas 0 / 1,25 / 2,5 exactas, dilo y da las que quedan.
- Escalera: la que el arnés ya sabe poner en un paso (regla de plano v0, 5 peldaños) o el estilo `steps` / rampa del visor, transitable de borde a borde. Si no queda transitable en sus 7 tiles de ancho, PARADA.
- Camino: de (20, 1) a la meta (20, 31) por la escalera, transitable estricto (`!block && !void && region >= 0 && !nowalk`).
- `planes` APAGADO (la sala trae sus cierres en el pack). `noFront` sí (A7). Ventana = zona 1 + zona 2 entera.
- Cámara: Cam 6, FOV 30, pitch 25, `heroFrac` 0,10, `exag` 1, `vScale` 1.

## 2. Posiciones (9) y encuadre
| Grupo | Referencia | Posiciones (tile del héroe) | `heroScreen` |
|---|---|---|---|
| s (arriba de la escalera, como 0202) | 0202 | s1 (20, 19), s2 (18, 19), s3 (22, 19) | [0,50; 0,50] |
| m (zona del hotspot) | 0137 | m1 (20, 27), m2 (18, 29), m3 (22, 29) | por defecto |
| n (junto al borde norte, como 0137) | 0137 | n1 (20, 35), n2 (23, 35), n3 (17, 35) | fx 0,63; fy por la regla (f) de A6, calculada en TECHO, en [0,45; 0,80] |

El `heroScreen` de cada posición es el MISMO en todos los estados (SUELO, TECHO, PLACEBO, TECHO − X): entre estados solo cambia la geometría.

## 3. Estados
- **SUELO** = la sala T tal cual, sin ninguna pieza de truco.
- **TECHO** = SUELO + los 7 trucos, cada uno construido UNA vez en el mundo (no por posición), con la receta de su ficha (campo 6):
  - **A6:** baranda de 0,8 H sobre el labio norte (x 8–32), postes de 2×1 tiles de 1,4 H cada 4 tiles.
  - **A3a:** una columna. Los candidatos se eligen con la proyección en m1, que hace de k4.
  - **A3b:** una masa. Los candidatos se eligen en s1 (como 0202) y en n1 (como 0137). Queda la que cumpla en más posiciones, del lado opuesto a A3a.
  - **A4:** recortar el muro norte en x 18–22 hasta la altura del suelo del salón, y poner un billboard claro detrás.
  - **C3:** calcomanía de 6×6 en x 17–22, z 28–33.
  - **C2:** una columna sobre cada base del par, con la altura de la ficha medida desde s1.
  - **B3:** la isla sube a 4 H, con la cara superior en otro tono.
- **PLACEBO** = SUELO + un señuelo de dos piezas, sin función de composición:
  - un billboard claro de 1,5 × 1,5 H, de pie en el anillo este (35, 10);
  - una calcomanía oscura de 5×5 en L0, x 11–15, z 5–9.

  Usan el MISMO tono y la misma luminancia que A4 y C3.
- **TECHO − X** = TECHO sin el truco X (uno por estado, los 7). Se renderizan solo para la medida V1.4 (c). No se juzgan en este pedido.

Controles en todos los estados:
- máscara transitable, camino y meta iguales (hash);
- ningún volumen sobre un tile del camino;
- billboards + rojo ≤ 30 % del cuadro;
- héroe tapado ≤ 25 %;
- fondo vacío (color de fondo del visor) ≤ 2 % del cuadro.

Lo que falle se informa con su cifra; no se corrige a mano.

## 4. Medidas de la Verificación 1 (las que te tocan)
- **V1.1:** hashes ×2 de cada PNG. Planta en Cam 5 de SUELO y de TECHO.
- **V1.4 (a) · posiciones propias de cada truco:** las posiciones donde sus tiles candidatos proyectan dentro del cuadro en SUELO. Se miden en SUELO, antes de construir TECHO. Para A6 los candidatos son el labio norte; para A4, el muro norte en x 18–22.
- **V1.4 (b) · puerta de presencia:** de la ficha (campo 7), en TECHO, en cada posición propia: PRESENTE con sus medidas, o AUSENTE con la cifra que falla. Los rangos son los de la ficha con los ajustes de v321 §2. A6 se mide con el `heroScreen` del grupo.
- **V1.4 (c) · aislamiento:** el diff TECHO contra TECHO − X cae dentro de la caja de X más un margen de 0,02 del cuadro (sombras incluidas). Se da el % de píxeles fuera.
- **V1.4 (d) · veredicto por truco:** ENTRA si es PRESENTE en ≥ 2/3 de sus posiciones propias, estas son ≥ 3 y (c) da 0 % fuera. Si no entra, NO ENTRA con el motivo.
- **V1.5:** cuántos entran.
- **V1.6:** lista de guiones de medida usados, cada uno corrido en seco sobre TECHO (sí / no).

## 5. Entrega
- PNG limpios de 1280×720, sin rótulos:
  - SUELO, TECHO y PLACEBO × 9 posiciones;
  - TECHO − X solo en las posiciones propias de X.
- Nombres: `<estado>_<pos>.png`, por ejemplo `TECHO_n1.png` o `TECHO-A6_n1.png`.
- `presencia.txt`, `medidas_v1.txt`, `SHA256SUMS` y un zip con todo.
- Ninguna hoja con juicio y ninguna frase sobre parecido.

## 6. PARADAS
Paras y avisas si pasa cualquiera de estas cosas:
- el pack no se puede inyectar;
- la escalera no queda transitable;
- el recorte del vano exige `src/`;
- un truco exige `src/`;
- los controles fallan en SUELO.

En cada parada dices qué pasó, con la cifra.

---

## Enmienda 1 ([R], 2026-11-17, tras la PARADA del fondo vacío)
La PARADA fue correcta: el control de fondo vacío falló en SUELO (3,7–16,9 % del cuadro). La causa es de diseño, no del arnés: la tabla de la §1 no cierra el cielo por encima de los muros. Cambia SOLO esto; las predicciones no cambian.

1. **Cierre alto.** Los muros exteriores (x 0–1 y 39–40) y el muro norte del salón (x 4–36, z 52–55) suben juntos, a la misma altura absoluta, de 1 H en 1 H desde 8 H hasta que el fondo vacío sea ≤ 2 % en las 9 posiciones de SUELO. Tope: 14 H. Si a 14 H todavía falla, PARADA con la tabla de vacío por posición. Se informa la altura usada. Nada más de la sala cambia.
2. **Separación de A3a (aclaración de la ficha, campo 4).** «Otra masa vertical a su lado» = una masa cuya distancia a la cámara está a ± 2 tiles de la columna. Un muro que queda DETRÁS de la columna (más lejos que eso) cuenta como fondo, no como masa al lado. La medida usa el render de ids con la profundidad de cada pieza.
3. **fy del grupo n.** Se recalcula en TECHO, como dice la §2. El valor de SUELO + A6 (0,54) queda solo como referencia.
4. Después de la enmienda sigue el pedido desde la §3: TECHO, PLACEBO, TECHO − X y la §4 completa. Los PNG de SUELO se vuelven a renderizar con el cierre nuevo.

## Enmienda 2 ([R], 2026-11-17, tras la primera corrida completa)
La corrida con la Enmienda 1 cerró el cielo a 8 H (vacío ≤ 0,85 % en SUELO). TECHO falló tres controles por dos causas de diseño. Cambian SOLO estos puntos; las predicciones no cambian.

1. **A4 pasa a A4b (fondo falso, ficha A4, receta 6 (b), segunda opción).** No se recorta el muro norte. El billboard claro va pegado a la cara del muro norte que mira a la sala, centrado en x 20,5, con su tamaño de la ficha (ancho 0,08–0,16 y alto 0,10–0,20 del cuadro en m1). Motivo: el recorte abría el muro al vacío (2,5–3,1 %) y la base del billboard quedaba oculta por la baranda A6, que lo hacía desaparecer (la falla de aislamiento de A6 en m1–m3).
2. **Corte del lado de cámara para las piezas de truco (extensión de A7).** En cada posición, una pieza de truco (volumen o billboard) que esté más cerca de la cámara que el héroe y le tape más del 25 % NO se dibuja en esa posición, en todos los estados donde exista. Es una regla de cámara, como `noFront`; la pieza sigue existiendo en el mundo. Se informa, por posición, qué piezas se cortaron. Motivo: las columnas de C2 (7 H) quedan entre la cámara y el héroe en el grupo n (héroe tapado 99,8 % en n3; billboards + rojo 31–33 % en n1 y n2).
3. **Medidas (correcciones del arnés, sin cambio de criterio):**
   - la altura aparente de A6 se mide con la escala de cada render, no con la cámara de la página;
   - las posiciones propias de A4 = las posiciones donde la cara del muro norte en x 18–22 es visible en SUELO;
   - los planos de Cam 5 se renderizan dos veces, para tener sus hashes ×2;
   - la puerta de cada truco se mide en TODAS sus posiciones propias (no en una muestra).
4. Si con 1 y 2 algún control de TECHO sigue fallando, se informa con su cifra y se sigue (no es PARADA); el veredicto V1.4 lo usa.

## Enmienda 3 ([R], 2026-11-17, tras V1.5 = 0 de 7)
La Verificación 1 FALLÓ (V1.5: ningún truco entra), así que no se corren pruebas y se vuelve a Base. [R] revisó los renders: las piezas están en el mundo, pero la medida las juzgó en posiciones y encuadres que no son los de su toma. Hay tres errores de diseño de [R]:
- las posiciones propias se definieron como «el candidato se ve en el cuadro»;
- el encuadre por grupo no es el de su toma;
- las piezas se construyeron con tamaños fijos en vez de buscar su objetivo en pantalla.

Cambian SOLO estos puntos. Los rangos de las puertas no cambian, y las predicciones tampoco.

1. **Posiciones propias declaradas por la toma que muestra el truco** (reemplaza la definición de la Enmienda de la §3 del protocolo para esta sala):

   | Truco | Grupos |
   |---|---|
   | A6 | s (pretil del borde L0/L1, como 0202) y n (baranda norte, como 0137) |
   | A3a | m, n |
   | A3b | s, n |
   | A4 | m, n |
   | C3 | s, m, n |
   | C2 | s |
   | B3 | s |

   Un truco ENTRA si da PRESENTE en ≥ 2/3 de sus posiciones declaradas, que son ≥ 3.
2. **Encuadre por grupo** (Paso 0, A374), el mismo en todos los estados:

   | Grupo | `heroFrac` | `heroScreen` |
   |---|---|---|
   | s | 0,108 | [0,50; 0,47] |
   | m | 0,128 | por defecto |
   | n | 0,128 | fx 0,63; fy por la regla (f) de A6 |
3. **Pretil sur (A6 en s).** Se agrega a la SALA, en todos los estados, una franja bloqueada de 1 tile en z 17, en x 8–16 y 24–32, a la altura de L0. La escalera queda libre. Con eso la máscara cambia igual en todos los estados. En TECHO, el pretil de A6 va sobre esa franja: 0,8 H por encima de L1, con postes de 1,4 H cada 4 tiles.
4. **TECHO por objetivo (prueba de capacidad).** Cada pieza se ajusta hasta que su puerta pase en la mayor cantidad posible de sus posiciones declaradas. Se ajustan, dentro de los candidatos de la ficha:
   - la posición;
   - el tamaño en tiles;
   - la altura en H;
   - el tamaño de la calcomanía;
   - el tamaño y la luminancia del vano.

   Hay UNA sola colocación en el mundo, no una por posición. Máximo 6 iteraciones por truco. Nunca se cambian la máscara, el camino, la meta ni los rangos de las puertas. Se informan los parámetros finales y las iteraciones.
5. **A4b sin `always`.** El vano es la primera de estas opciones que pase su puerta:
   - (a) un panel claro de 1 tile de fondo pegado al muro norte, sin pasar del tope del muro;
   - (b) un billboard sin `always` con la base visible.

   Pintar encima de piezas más cercanas no se permite.
6. Los controles siguen igual. Si billboards + rojo pasa de 30 % por una pieza, esa pieza se ajusta (punto 4). Si no se puede, se informa.
