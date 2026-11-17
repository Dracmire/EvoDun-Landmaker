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
