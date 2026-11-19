# Perfiles de forma y hoja de composición por origen (R2, Octopath Traveler 2)

Diseño y análisis de [R] sobre la lectura de [U] (2026-11-18). Registro A493–A499. Todo lo que no está medido es **[H] hipótesis**. Las dimensiones en H están calculadas desde la Base (heroFrac 0,10, FOV 30, pantalla 16:9) y no se midieron en Octopath.

## 1. Teoría de [U]: la hoja de composición depende del origen

> HD-2D se describe en tutoriales y repos como «mundo 3D con personajes y objetos 2D, vestido con texturas 2D». Los HD-2D comunes de esos repos no son atractivos como Octopath o DQ3. La diferencia sería un **pase de composición especializado** que extrae las cualidades 2D sobre la base 3D (una evolución de la idea de los trucos). Teoría [U]; no va con el Ancla.

- Un juego clásico se puede convertir a HD-2D solo con la **hoja de composición de su origen**. Sin ella, se obtiene una maqueta con texturas y efectos que no cruza la barrera.
- **DQ3: origen RPG top-down.** El original tiene pisos absolutamente planos y sin marcas. El remake eleva los pisos de las salas y da alturas distintas dentro de un mismo piso (aunque sea altura falsa) para que haya perspectiva. La verticalidad añadida tiene un propósito de composición: la Torre del Soñador no es la única escena que la usa.
- **Octopath: origen 2.5D no isométrico de 16 bits** (Final Fantasy VI y similares), juegos que ya buscaban toda la profundidad posible. Por eso su verticalidad es arquitectónica: escalinatas dobles, muros de contención, fachadas.
- Otras perspectivas 2D se podrían convertir con su propia hoja.

### Consecuencias para el modelo (lectura de [R])

1. **El modelo pasa a tener tres capas:** Base (común a todo HD-2D) + **hoja de origen** (top-down, 2.5D oblicuo…) + grupo de features por tipo de escena. MODELO_ACTUAL v2 es, en la práctica, la hoja **top-down** (DQ3) más la Base.
2. **Se resuelve la tensión R2 de A495.** «Los escalones grandes delatan el cubo 3D» (A247) vale para la hoja top-down. En la hoja 2.5D los saltos grandes se permiten si van vestidos de arquitectura. No son reglas universales.
3. **EvoDun genera mapas top-down** (alturas y zonas vistas desde arriba, DAC). Su hoja natural sería la top-down de DQ3: elevar y diferenciar pisos para dar marcas de perspectiva. La hoja 2.5D de Octopath sería una opción que se elige, no la de partida. [H]
4. **Los trucos sueltos fallaron** porque eran piezas sin hoja: aplicarlos sin el perfil de composición correcto da maqueta, no HD-2D. [H, coherente con A465 y A470]

## 2. Perfiles de forma (lectura de [U], dimensiones de [R])

Son las reglas de dirección por sala (X, Z, Hub, C1) ampliadas con la forma. Siguen siendo composición: dicen cómo se encuadra la sala. Referencia de una toma, calculada: a la profundidad del héroe el cuadro mide ≈ 10 H de alto y ≈ 18 H de ancho; la profundidad útil llega a ≈ 17 H (B13).

| Perfil | Dirección | Ancho caminable | Largo | Encuadre | Evidencia |
|---|---|---|---|---|---|
| **P1 Pasillo angosto** | Z o X | ≈ 3–5 H (paso ≥ 3 H, A182) | Z: varias tomas a lo largo; X: varias tomas de lado | Recinto pegado a los dos lados del camino; en Z la cámara avanza con el héroe | callejón, calles 13–15, puente del dungeon |
| **P2 Corredor ancho** | Z o X | ≈ 6–12 H (dentro del ancho de una toma) | varias tomas | Recinto visible a ambos lados con margen; masas a los lados | 01 campamento, 10 cañón, 12 canal |
| **P3 Hub normal** | Hub | ≈ 1 toma (≤ 18 × 17 H) | 1 toma | Sala axial que cabe entera; meta al fondo | 09 tribunal, 16 plaza |
| **P4 Hub deep** | Hub | ≈ 1 toma | 1 toma + fondo lejano | Como P3, con un fondo o hito lejano visible detrás (sub-cámara «deep», A491) | 20 biblioteca (galería arriba), 11 isla |
| **P5 Interior de una toma** | — | todo el interior | 1 toma | Caja recortada sin pared frontal; se ve el interior entero | 03 taberna, 05–07 tienda |
| **P6 Interior deep** | Z | interior más largo que una toma | > 1 toma | Caja recortada en la que la cámara avanza hacia el fondo | 06 → 07 (la cámara entra) |

**Una sala ancha que no entra en ningún perfil** (por ejemplo DAC 44: 61 H de profundidad, A465) **se reporta como pedido al generador**. Achicar lo caminable cambia el dato: es diseño de nivel y no lo hace el cristalizador (A496).

## 3. Matriz perfil × tipo DAC (hipótesis de [R])

Los dos ejes son independientes. El tipo DAC dice cómo se relaciona la sala con su entorno y su altura; el perfil dice cuánto espacio tiene y cómo se encuadra.

Leyenda: ✓ natural · ~ posible · ✗ improbable.

| | Diorama (pocket, fragmento enmarcado, mirador) | Ascensión (muros que encierran, subida) | Cake (anillos alrededor de la unión entre pisos) |
|---|---|---|---|
| P1 Pasillo angosto | **✓** «Diorama narrow» de [U]: el fragmento angosto con el encuadre de diorama | **✓** el caso de la DAC 14, que funcionó (A470) | ✗ los anillos necesitan espacio alrededor |
| P2 Corredor ancho | ~ | ✓ subida con margen | ~ anillos a un lado |
| P3 Hub normal | ✓ | ~ | **✓** cuenco o pirámide central |
| P4 Hub deep | **✓** mirador (A296) | ~ | ✓ mira hacia arriba o hacia abajo |
| P5 Interior de una toma | **✓** un diorama es una toma | ~ | ✗ |
| P6 Interior deep | ~ | ✓ interior de torre | ~ |

## 4. Tesis que sale de aquí

- **T1:** una sala que entra en un perfil, encuadrada con su perfil y su tipo DAC, se acerca a 2D-HD sin trucos sueltos. Una sala que no entra en ningún perfil no se acerca, con ningún truco. *Lo que se juzga:* [U] mira las tres celdas ✓ y el control.
- **T2:** la mayoría de las salas DAC de «Balanced types» no entra en ningún perfil. *Lo que se mide:* la clasificación de las 88 salas por dimensiones en H.

Si T2 se cumple, el cuello de botella es del generador (forma de sala) y no del cristalizador.

## 5. Correcciones de [U] (A500–A503)

- **Por partes (A500):** una sala se recorre entrada → núcleo → cada salida y se parte en codos, pasillos y áreas centrales; cada parte lleva su perfil. Una sala uniforme es unitipo. T2 se mide por parte, no por sala.
- **Los dos problemas reales (A501):** la **verticalidad** (buena topológicamente, terrible en composición) y el **encuadre** (cómo una sala obtiene su horizonte y su profundidad). DQ3 levantó salas artificialmente; DAC se basa en distorsión natural. Octopath puede resolver la verticalidad.
- **Hipótesis de [R] sobre la verticalidad (A502):** en el 2.5D de 16 bits, lo alto queda al fondo: las bandas suben al alejarse de la cámara, así que cada nivel se ve como una franja. El `orient` actual (sala X: el lado alto al fondo) y `planes` (frente bajado, fondo alzado) son su embrión. Octopath daría la forma completa: terrazas en bandas, muros de contención, escalinatas.
- **Linaje (teoría de [U], A503; no va con el Ancla):**
  - DQ3 8 bits → DQ3 16 bits → hoja → remake: cada capa respeta a las anteriores; se puede añadir, pero no ignorar lo anterior.
  - FF6 → hoja → Octopath: más libertad, porque FF6 ya tenía profundidad.
  - La hoja sería en la práctica un **juego 2.5D**: componer primero la escena en 2.5D y después dar el paso a HD-2D, porque el 3D debe comportarse como un juego 2D. El punto medio hace más sólida la regresión.
  - [R]: el visor ya tiene esa proyección, **Cam 7 Classic 3/4** (oblicua de 16 bits).

## 6. Lo que queda fuera de este pase

- Cámaras (bloqueo suave, sub-cámara deep): en espera (A493).
- Fondo de fachada: tiene pase propio (T58).
- La hoja 2.5D completa de Octopath: viene después de T1 y T2.
