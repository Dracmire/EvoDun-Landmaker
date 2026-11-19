# Brief para CC · Escaleras de la pasada 3 y prueba de 7–9 terrazas (hipótesis de escenarios)

Rama R2. Registro A542–A546. **Lee antes de empezar:**
- `verticalidad_lego.md` (§7b);
- `verticalidad_lego_resultado.md` (pasadas 1–3);
- `verticalidad_lego_despues.md`;
- `MODELO_ACTUAL.md` v2.4.

La regla DAC3 de CLAUDE.md sigue igual: todo en `src/s3/`; las herramientas compartidas se clonan si hay que cambiarlas.

**Meta de [U] (el hito):** que el Stage pueda generar tipos de escenario: planicie, bosque (como DQ3), ciudad (terrazas altas como edificios que enmarcan escaleras), montaña o bosque de montaña, interior y dungeon. Hoy quizás alcanzan planicie y bosque. **Esta pasada no construye escenarios.** Primero corrige una regresión y después **mide qué da DAC con más terrazas**, para sacar hipótesis.

**PRESUPUESTO: 25 minutos de reloj.** Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## Parte 0 · Corregir las escaleras de la pasada 3 (juicio de [R] sobre las láminas)

En las láminas de #112, la escalera de u1 (y la central de u2) pasó de escalinata con peldaños (Mid, estilo `steps`) a una **rampa de 1 baldosa** que se ve como un muro liso, celeste en u1 y crema en u2. Es peor que la pasada 2. La regla A537 pedía **escalones**, no una rampa.

- En salas con lego, la escalera mantiene el **estilo del ejemplo** (`steps`): mitad de profundidad (mínimo 1) y m veces más contrahuellas como geometría (los peldaños de `steps`), no como líneas transversales.
- Si el tope de 10 líneas o de peldaños del renderizador compartido lo impide, **clona lo necesario a `src/s3/`** (regla A522) y dilo.
- Re-saca solo las láminas de u1 y u2 con Rest y Scale.

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

**Entrega:** tablas y capturas en `research/octopath2/terrazas79_resultado.md`. Sin predicciones: [U] y [R] sacan las hipótesis de ahí.

## Carril

- **node:** `test_lego.js`, `test_vert.js`, `test_modes.js`.
- **UI:** `test_lego_ui.js`.
- **Hashes:** estados s3 y los 21 de `m2_hashes`, idénticos en Mid.
- **`regress --sample 1/4`** en segundo plano solo si tocas código compartido o clonas el renderizador.
- Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` (con #112 mergeado) y PR. **No mergees: mergea [U].**
