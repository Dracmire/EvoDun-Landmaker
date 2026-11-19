# Brief para CC · Escaleras de la pasada 3 y prueba de 7–9 terrazas (hipótesis de escenarios)

Rama R2. Registro A542–A550. **Lee antes de empezar:**
- `verticalidad_lego.md` (§7b);
- `verticalidad_lego_resultado.md` (pasadas 1–3);
- `verticalidad_lego_despues.md`;
- `MODELO_ACTUAL.md` v2.4.

La regla DAC3 de CLAUDE.md sigue igual: todo en `src/s3/`; las herramientas compartidas se clonan si hay que cambiarlas.

**Meta de [U] (el hito):** que el Stage pueda generar tipos de escenario: planicie, bosque (como DQ3), ciudad (terrazas altas como edificios que enmarcan escaleras), montaña o bosque de montaña, interior y dungeon. Hoy quizás alcanzan planicie y bosque. **Esta pasada no construye escenarios.** Primero corrige una regresión y después **mide qué da DAC con más terrazas**, para sacar hipótesis.

**PRESUPUESTO: 30 minutos de reloj** (son cuatro partes; la 1 y la 2 solo miden). Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## Parte 0 · Correcciones de la pasada 3 (juicio de [U] sobre las láminas de #112, A545)

- **Escaleras.** En u1 la escalera desapareció: se volvió una rampa de 1 baldosa que se lee como un muro liso. En u2 la central quedó como una losa crema. En salas con lego, la escalera mantiene el **estilo del ejemplo** (`steps`): mitad de profundidad (mínimo 1) y m veces más contrahuellas **como geometría** (los peldaños de `steps`), no como líneas transversales. Si el renderizador compartido lo impide, **clona lo necesario a `src/s3/`** (regla A522) y dilo.
- **Cake Rest:** salió bien; no se toca.
- **Cake Scale se come la huella de la terraza alta.** Los anillos extra no pueden quitar baldosas de la terraza alta más allá de las que ya toma Mid. Regla: la huella de Scale sobre la terraza alta ≤ la de Mid. Los anillos que falten se construyen hacia afuera, sobre la terraza baja (en el aire, como el Up v2 de Cake). Si no caben, se usan menos anillos y más altos. Reporta cuántas baldosas de la terraza alta toma cada variante.
- Re-saca las láminas de u1 (Mid | lego) y de u2 (Mid | Rest | Scale).

## Parte 1 · DAC con 7, 8 y 9 terrazas (solo mide; hipótesis de [U])

DAC se hizo para alturas del mundo numérico y lo reprimimos a pocas terrazas para generar salas. Recorre el mapa real con el preset «Balanced types», cambiando solo las terrazas a 3 (control), 7, 8 y 9, y después repite 7–9 con el preset Default. CLAUDE.md avisa que con 10–12 terrazas la capa de salas se fragmenta; 7–9 queda en el borde, así que reporta también la fragmentación.

Por cada caso, **datos (sin veredicto):**
- salas, tipos (Cake, Diorama, Ascensión), rampas, % caminable principal, grupos de la capa;
- % de salas, vistas como ventana de una sala, que pisan 1, 2 y 3+ terrazas;
- **cúmulos de altura:** pares de salas vecinas con diferencia de terraza ≥ 2, y grupos conectados de esas salas;
- **valles:** salas cuyas vecinas están todas al menos 2 terrazas más arriba (el «valle rodeado de terrazas altas» de una ciudad), con su tamaño en H;
- **cimas:** el caso inverso, con sus vecinas todas al menos 2 terrazas más abajo;
- fronteras A+2 entre salas (en #109 dieron 0 con 3 y con 5 terrazas).

**Capturas** en `shots/terrazas79/`:
- mapa completo en Cam 5 (cenital) con tinte por terraza, una por caso;
- para 9 terrazas, Cam 6 del mayor valle y de la mayor cima, en modo 3 con lego Up y Down.

**Entrega:** tablas y capturas en `research/octopath2/terrazas79_resultado.md`. Sin predicciones: [U] y [R] sacan las hipótesis de ahí. Las partes 0, 2 y 3 van en el mismo documento, cada una en su sección.

## Parte 2 · Crecimiento de la terraza destino al acercarse (solo mide, A546)

[U] sobre la lámina de M1: el héroe parte abajo y llega a la terraza, pero la terraza **casi no cambia de tamaño** en pantalla. Según DQ3 y OT2 debería crecer al menos un **33–40 %** (lectura de [U]). Mide en `perfil_m1`, `perfil_u1` y `perfil_u2`, de k0 a k8:
- el ancho y el área en pantalla de la terraza destino (la más alta de la sala) y del landmark;
- la escala en px por H a la profundidad de la terraza.

Hazlo en Cam 6 y Cam 8, con el seguimiento del héroe encendido y apagado. Di qué parámetro lo controla: `heroFrac` fijo, la distancia de la cámara (el dolly), la tasa del seguimiento. **No cambies la cámara:** solo mide y explica.

## Parte 3 · Borde híbrido (decisión de [U], A547)

En las plataformas, los bordes exteriores que **no miran a la cámara** (el fondo, lo que da al horizonte, los que miran hacia atrás) se **suavizan**. Los que **miran a la cámara** quedan **cuadrados**, como hoy.
- **Regla:** para cada tramo del contorno de un nivel, n = normal hacia afuera y v = dirección de la vista en el suelo (el yaw de la sala). Si n apunta hacia la cámara (ángulo < 45° con −v), el tramo queda cuadrado (como Box). Si no, se suaviza (Chaikin, como la técnica A). Los extremos de cada tramo cuadrado quedan fijos para que no se abra una grieta.
- Es una técnica de dibujo de DAC3: clona lo necesario de `tech.js` a `src/s3/`. Selector del modo 3 «Edge style»: Square (por defecto, byte a byte igual) / Hybrid. Las escaleras y rampas siguen con su huella rígida.
- **Láminas** Square | Hybrid en Cam 6 de u1, u2 (Rest), M1, `perfil_s1` y L1, más u1 en Cam 7.

## Carril

- **node:** `test_lego.js`, `test_vert.js`, `test_modes.js`.
- **UI:** `test_lego_ui.js`.
- **Hashes:** estados s3 y los 21 de `m2_hashes`, idénticos en Mid.
- **`regress --sample 1/4`** en segundo plano si tocas código compartido (`ui.js`, `modes.js`, `controls.js` fuera de las guardas del modo 3).
- **Sin firmas** en los commits ni en el PR.
- Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` (con #112 mergeado) y PR. **No mergees: mergea [U].**
