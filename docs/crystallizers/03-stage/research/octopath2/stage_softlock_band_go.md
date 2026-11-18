# Brief para CC · Banda de primer plano con el perfil narrow

Rama R2 (Octopath Traveler 2). Registro A487, A488, A490 y A491. Modelo: `MODELO_ACTUAL.md` v2.3 (§2: «Tres espacios», «Perfiles de cámara», «El bloqueo suave va con una banda de primer plano»; Base B10). Resultado anterior: `research/octopath2/softlock_resultado.md` (PR #99). **Léelos antes de empezar.**

## 1. Qué es y qué buscamos

En el PR #99 el visor reproduce el bloqueo suave: con el perfil narrow, la cámara se detiene en el borde sur y el héroe crece al acercarse. Pero no reproduce Octopath. En el visor el héroe llega a 0,144 con los pies en fy 0,96, y si la cámara se detiene antes (mN −3 H), llega a 0,182 con los pies fuera del cuadro. En Octopath, el héroe a 0,15–0,18 conserva los pies a fy 0,71–0,78, y debajo de él, en el último cuarto de la pantalla, hay **primer plano**: barandas bajas, bordes y objetos (capturas `refs/oct2/` 09, 17, 18, 19 y 20).

**Hipótesis (A488):** entre el borde sur de lo **caminable** y el borde sur del **escenario** hay una banda **no caminable** de varios H. La cámara se detiene con el borde inferior de la pantalla sobre el borde del escenario. El héroe camina hasta el final de lo caminable, que queda varios H antes, así que crece sin salirse del cuadro. La banda muestra una baranda baja como geometría, la banda B1 del modelo.

**Pregunta:** ¿con qué profundidad de banda F y qué margen mN llega el héroe a ~0,18 con los pies a ~0,75, con la baranda visible abajo sin tapar al héroe?

## 2. Corrección del perfil (decisión de [U], A490)

**long no existe** como perfil de bloqueo suave: moverse de lado no cambia el tamaño del héroe. Hay que quitar `long` de `E.stage.CAM_PROFILES` y del selector. Asignación ([R], A490): salas **Z y X → narrow**, **Hub → wide**. Actualiza el test que dependa de `long`, y dilo en el PR. No es una expectativa relajada: es un perfil retirado por decisión.

## 3. Qué construir (todo opcional; ausente = el visor de hoy, byte a byte)

1. **Banda de primer plano del perfil narrow.** En la sala del héroe, las baldosas FRONT de `E.planes` (antes del extremo cercano de la sala en cada columna de la vista) que estén a ≤ F H del borde caminable:
   - **no se bajan** (hoy `planes` baja el frente que está sobre el suelo; dentro de la banda queda a la altura del suelo de la sala);
   - **siguen sin ser caminables**;
   - **forman parte del escenario:** la caja con la que `clamp` calcula el tope cercano llega hasta el borde exterior de la banda.

   Fuera de la banda, `planes` se comporta como hoy.
2. **Baranda baja** sobre la primera fila de la banda (la que toca lo caminable): geometría con el mecanismo de volúmenes (S4b) o el de `planes`, nunca billboards (reglas de composición (b)). Altura 1,2 H, en el rango de A6 de 1,0–1,4 H. Si la regla de los 2 tiles junto a una transición la impide en algún tramo, dilo y cuéntalo.
3. **Parámetros** en un solo lugar (hipótesis): `F` (profundidad de la banda en H) y la altura de la baranda. Solo actúan con el perfil narrow y el interruptor «Camera space by room» encendido.

## 4. Prueba (una pasada, sala 14 de `mockt_z14`)

- **Barrido corto:** F ∈ {2, 3, 4} H × mN ∈ {0, −1, −2} H, con heroFrac base 0,10 → 9 corridas.
- **Caminata k0…k8 hacia el sur** hasta el borde caminable. Por paso, registra:
  - el alto del héroe / alto del panel;
  - fy de los pies;
  - si la cámara está detenida;
  - la fracción de pantalla bajo los pies que ocupa la banda.
- **Entrega:**
  - tabla de las 9 corridas con el valor en k8;
  - la corrida más cercana a (0,18; 0,75);
  - capturas k0, k4 y k8 de esa corrida y de F 0 (hoy) para comparar, en `docs/crystallizers/03-stage/shots/softlock_band/`;
  - todo en `research/octopath2/softlock_band_resultado.md`.
- **Controles:**
  - la baranda no tapa más del 25 % de ninguna baldosa caminable (pick buffer, como S4b);
  - el héroe nunca queda cortado por la baranda en k8;
  - la caminata no pisa baldosas de la banda.

**Predicción (congelada):** con F 3 H y mN 0, el héroe llega a 0,16–0,19 con fy 0,70–0,80 y la baranda ocupa la franja inferior de la pantalla (y > 0,85). Con F 0 se repite lo de hoy (0,144; fy 0,96).

## 5. Reglas

- Sin imágenes de terceros en el visor, sin copiar salas, sin jueces: [U] mira las capturas.
- **Carril por PR** (CLAUDE.md):
  - node: `test_planes.js`, `test_stage_camspace.js`, `test_stage_cam.js`, `test_volumes.js` (si usas volúmenes);
  - UI (máximo 3): `test_stage_camspace_ui.js`, `test_stage_planes_ui.js` y uno para la banda;
  - tabla de hashes de los estados apagados, que debe dar idéntico.

  Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` y PR. **No mergees: mergea [U].**
