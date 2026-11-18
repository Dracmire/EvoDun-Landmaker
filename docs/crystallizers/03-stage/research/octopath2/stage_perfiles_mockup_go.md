# Brief para CC · Perfiles de forma: clasificación y mockups (T1, T2)

Rama R2. **Lee antes de empezar:**
- `research/octopath2/perfiles_forma.md`: la teoría, los perfiles P1–P6, la matriz y las tesis T1 y T2;
- `MODELO_ACTUAL.md` v2.4;
- el resultado del control de 3 salas (v329, `r15/stage_control_3salas_go.md` y su resultado).

**Roles:** [R] diseñó; tú construyes los mockups y mides; [U] juzga mirando. Sin jueces ni rúbricas.

## Parte A · Clasificación (T2): solo mide, sin tocar `src/`

Toma las 88 salas de «Balanced types» (mapa real, 3 terrazas). Para cada una:
- dirección (`E.orient`: X, Z o Hub);
- ancho y largo de lo caminable en H (`tilesPerH` 1,5), medidos a lo largo de su eje y de través;
- tipo DAC;
- el perfil P1–P4 que le corresponde según la tabla de `perfiles_forma.md` §2, o **«ninguno»**. P5 y P6 son interiores y no se aplican a estas salas.

**Entrega:**
- tabla completa en `research/octopath2/perfiles_clasificacion.md`;
- conteo perfil × tipo DAC (la matriz de §3 con números);
- cuántas salas quedan en «ninguno» y su ancho típico.

Si los umbrales de la tabla dejan casos en el límite, cuéntalos aparte. No muevas los umbrales.

## Parte B · Mockups de tres celdas ✓ + un control (T1)

Son **mockups declarados**: ejemplos del modo 3 armados como datos, con la regla de composición (c) (mapa de origen y reglas encendidas declaradas). No son reglas nuevas del visor.

| Mockup | Celda | Sala |
|---|---|---|
| M1 | Ascensión × P1 Pasillo angosto Z | DAC 14 (ya funcionó en v329) |
| M2 | Diorama × P1 Pasillo angosto («Diorama narrow» de [U]) | un Diorama que la Parte A clasifique P1; si no hay ninguno, el Diorama más angosto, con su caminable reducido a mano a ≈ 4 H alrededor de su eje |
| M3 | Cake × P3 Hub normal | un Cake que la Parte A clasifique P3 |
| C0 | control: DAC 44, sin perfil | DAC 44 |

En M2, la reducción a mano va **declarada como mockup** (es diseño de nivel, A496), nunca como regla.

**Encuadre de cada uno:**
- Cam 6 por defecto (sin bloqueo suave, sin perfiles de cámara: A493);
- Base v2.4 (`orient`, `planes`, `props` sin antorchas en el tercio central, C3 de ≈ 6 H en el hotspot);
- el encuadre del tipo DAC: Diorama con pocket / mirador, Ascensión con muros, Cake con anillos;
- el recinto del perfil: masas o volúmenes a los lados según el ancho del perfil, siempre como geometría (reglas de composición (b)).

**Hoja de origen top-down:** en las cuatro, aplica lo que hace el remake de DQ3. Que haya diferencias de altura **dentro** de la sala (sub-niveles del dato, `subs` 2) que den marcas de perspectiva, sin elevar el POI (B6). Si la sala no tiene relieve, dilo y no lo inventes.

**Por mockup, entrega:**
- capturas k0, k4 y k8 de la caminata hacia la meta en `docs/crystallizers/03-stage/shots/perfiles/`;
- una tabla con dimensiones en H, perfil, vacío %, billboards % y cuánto del recinto se ve en k4;
- el resultado en `research/octopath2/perfiles_resultado.md`.

## Reglas

- No toques Cam 1–8 ni los modos 1, 2 y 4. Ningún mockup supera el 30 % de billboards (sin excepciones).
- **Carril por PR:**
  - si solo agregas ejemplos y datos del modo 3: node `test_modes.js`, `test_controls.js`; UI (máximo 3) `test_stage_orient_ui.js`, `test_stage_planes_ui.js`; tabla de hashes de los estados apagados, que debe dar idéntico;
  - `regress --sample 1/4` solo si tocas código compartido fuera de `stageOn()` / `st.win`.

  Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` y PR. **No mergees: mergea [U].**
