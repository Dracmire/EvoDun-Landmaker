# Brief para CC · Bloqueo suave de la cámara (espacio de cámara por perfil)

Rama R2 (Octopath Traveler 2). Registro A480, A483, A484 y A482. Modelo: `docs/crystallizers/03-stage/research/metodologia/MODELO_ACTUAL.md` v2.2, §2 «Tres espacios» y «Perfiles de cámara». **Léelo antes de empezar.**

## 1. Qué es y qué buscamos

En un 2D-HD la escena tiene tres espacios (modelo de [U]):

- **caminable:** por donde va el héroe;
- **escenario:** todo lo que contiene la escena;
- **cámara:** por donde se puede mover la cámara; es más grande que el escenario, pero solo transmite lo que pasa en él.

La rotación de la cámara es fija. Mientras el héroe está en el **cuadro central**, la cámara lo sigue 1:1 y su tamaño en pantalla no cambia (DQ3: heroFrac 0,10 constante). Cuando la cámara llega al borde de su espacio, se detiene: el héroe sigue caminando y la «alcanza». Al sur (hacia la cámara) **crece** y baja en la pantalla; al norte se aleja y **encoge**. En Octopath Traveler 2 el héroe va de 0,11 a 0,18 del alto del cuadro, con los pies de fy 0,61 a 0,71–0,78 (`research/octopath2/medidas_paso1.md`). DQ3 tiene espacios de cámara amplios y el héroe no crece; Octopath los tiene finitos y lo usa a propósito.

**Pregunta de esta prueba:** con un espacio de cámara finito, ¿reproduce el visor el rango de Octopath (crecer de ~0,10 a ~0,18 y bajar los pies) dentro de una sala estrecha, y con qué curva? Si la cámara detenida es perspectiva normal, el tamaño sigue la fórmula de escala del modelo, s = (D/k) / (D/k + g · cos pitch) con g < 0: una curva hiperbólica (A484).

## 2. Qué hay hoy en el visor

`E.stage.clamp` (`src/stage.js`) limita el objetivo de Cam 6:

- de lado, a la ventana;
- del lado cercano (sur), de modo que el borde inferior de la pantalla no pase el borde cercano de la ventana;
- del lado lejano (norte), **nunca** (existe la mutación de prueba `clampFar`).

Es decir, hoy espacio de cámara = escenario al sur, e infinito al norte.

## 3. Qué construir (todo opcional; ausente = el visor de hoy, byte a byte)

1. **Márgenes del espacio de cámara**, en H, solo en el eje de la vista (el eje lateral queda como hoy, por decisión de [U]):
   - `near` (`mN`): el tope sur actual se desplaza `mN` H hacia la cámara (`u ≤ uMax − near + mN`); `mN = ∞` = la cámara siempre retrocede (DQ3);
   - `far` (`mF`): tope norte NUEVO, el objetivo queda al menos `mF` H antes del borde lejano de la ventana (`u ≥ uMin + mF`); ausente = sin tope, como hoy.
2. **Perfiles** (hipótesis [R], constantes con nombre en un solo lugar, p. ej. `E.stage.CAM_PROFILES`), elegidos por el rol de la sala del héroe que ya da `E.orient` (C1):

   | Perfil | Rol | `mN` | `mF` |
   |---|---|---|---|
   | narrow | Z | 0 | 4 H |
   | long | X | 0 | 4 H |
   | wide | Hub | ∞ | sin tope |

   En el visor, narrow y long coinciden en el eje de la vista (solo difieren de lado, que aquí es fijo).
3. **Interruptor** «Camera space by room» (modo 3, apagado por defecto) y un selector para forzar el perfil en la prueba (narrow / long / wide). El estado termina con la sesión de ventana, como los demás del modo 3.

No tocar Cam 6 fuera de esto, ni Cam 1–8, ni los modos 1, 2 y 4.

## 4. Prueba (una sola pasada)

- **Salas:** `mockt_z14` (sala Z), `mockt_x44` (sala X) y una sala Hub de `dac_stage` (la que `E.orient` marque como Hub; di cuál).
- **Caminata:** k0…k8 por el eje de la vista. Primero hacia el sur hasta el borde caminable, después hacia el norte hasta el borde lejano. Con cada perfil: narrow / long en su sala y wide en las tres.
- **Por paso, registra:**
  - alto del héroe en pantalla / alto del panel (heroFrac medido);
  - fy de los pies;
  - si el objetivo está detenido (`near` / `far`);
  - distancia del héroe a la cámara;
  - heroFrac predicho por la fórmula de escala.
- **Entrega:**
  - una tabla por sala × perfil en `docs/crystallizers/03-stage/research/octopath2/softlock_resultado.md`, que diga en qué paso empieza a crecer, el máximo alcanzado y la diferencia contra la curva predicha;
  - capturas k0, k4 y k8 hacia el sur con narrow y con wide, en `docs/crystallizers/03-stage/shots/softlock/`.

**Predicción (congelada antes de correr):** con wide, heroFrac 0,10 ± 5 % en todos los pasos. Con narrow, constante en el cuadro central; al llegar al sur crece hasta ~0,15–0,20 con fy ≥ 0,65; al norte encoge. Diferencia contra la curva predicha < 2 % (el visor es perspectiva normal; esto verifica el instrumento). Si la caminata no llega a 0,15, dilo y da la distancia que haría falta.

## 5. Reglas

- No uses imágenes de terceros en el visor ni copies salas de Octopath.
- Sin jueces ni rúbricas: [U] mira las capturas.
- **Carril por PR** (CLAUDE.md, «Verification lanes»):
  - node: `test_stage_cam.js`, `test_cams.js`, `test_orient.js`;
  - UI (máximo 3): `test_stage_ui.js`, `test_stage_orient_ui.js` y uno nuevo para el interruptor;
  - tabla de hashes de los estados apagados, que debe dar idéntico;
  - `regress --sample 1/4` solo si el cambio en `src/ui.js` no queda protegido por `stageOn()` / `st.win`.

  Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva y PR. **No mergees: mergea [U].**
