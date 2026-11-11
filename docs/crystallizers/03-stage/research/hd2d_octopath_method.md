# Metodología 2D-HD según el tutorial de Cobra Code (Octopath Traveler)

Fecha: 2026-11-10 · Estado: investigación (no es contrato ni decisión) · Nota de diseño: v209.

Etiquetas: **[Tut]** dicho por el tutorial · **[Ref]** medido por nosotros en capturas · **[Repo]** del código ·
**[R]** propuesta del revisor · **[U]** decisión del usuario. Lo que no lleva [Ref] o [Repo] es **NO VERIFICADO**.

## 1. Fuente y fiabilidad

- Video: «How to make HD 2D Games in Unreal Engine 5», canal Cobra Code, publicado el 2024-11-20, 9:14 min.
  <https://www.youtube.com/watch?v=SEk51GQdeag>
- Es una fuente **secundaria**: el autor resume charlas y entrevistas en japonés del equipo de Acquire / Square Enix
  y agrega sus propios valores para Unreal. Además vende un curso. Sus fuentes declaradas en la descripción:
  - <https://cgworld.jp/feature/201908-gg2019-oct.html>
  - <https://www.youtube.com/watch?v=pZk-wiwxpU0>
  - <https://www.youtube.com/watch?v=K6wW0pO08LE>
  - <https://www.youtube.com/watch?v=UPzeHX3VaHY>
  - <https://www.youtube.com/watch?v=r7_sWDIJOUo>
- Qué se revisó: el transcrito completo y los metadatos del video, más 4 fotogramas (3:52, 4:01, 5:52, 8:10).
  Los fotogramas son metraje de Octopath, una escena de demostración en Unreal y una lámina de «Depth of Field (Bokeh)»;
  coinciden con el transcrito y no agregan números. **No se abrieron las fuentes japonesas**: ningún valor de
  este documento está contrastado con ellas.
- El tutorial distingue dos tipos de dato y aquí se mantienen separados:
  **(E)** lo que atribuye al equipo de Octopath y **(A)** valores elegidos por el autor.

## 2. La técnica en una frase

Sprites de pixel art iluminados como objetos 3D, dentro de un mundo 3D de geometría real con texturas pixeladas,
visto con una cámara de teleobjetivo inclinada y cerrado con post-proceso (desenfoque tipo maqueta, bloom, viñeta, color).

## 3. Los siete bloques de la técnica

### 3.1 Personajes (sprites)
- (E) Requisito de origen: personajes 2D en un mundo 3D.
- (E) Producción: base de personaje + ropa modular + deformación de malla en Photoshop, con retoque a mano al final.
- (A) Tamaño de ejemplo: un protagonista mide 34 × 18 px; otros son más altos y anchos.
- (A) Paleta de baja saturación: un NPC de ejemplo usa 6 colores principales (sin contar el negro), con rampas de 3 a 6 tonos.
- (A) 4 direcciones bastan; 8 o 16 multiplican el trabajo.

### 3.2 Luz y sombra
- (A) Los sprites **reciben luz y proyectan sombra** (material iluminado, sombra activada).
- (A) Luz direccional en diagonal desde el frente, para que la sombra caiga en diagonal.
- (E) En cuevas el héroe lleva una lámpara: fue de lo primero que se prototipó. (A) Se resuelve con un foco pegado
  al personaje que no gira con él.
- (E) Los efectos de partículas solos no bastaban: cada efecto enciende además una luz puntual que ilumina el entorno.

### 3.3 Cámara
- (E) En el primer prototipo la escala «no se veía bien»; para acercarse a la perspectiva de los juegos de píxel
  antiguos **inclinaron la cámara hacia abajo y redujeron el campo de visión**.
- (A) Valores del autor: 20° hacia abajo y FOV entre 35° y 45°. No dice si el FOV es vertical u horizontal.

### 3.4 Post-proceso
- (E) Solo usaron ajustes estándar del motor, sin efectos propios.
- (E) Corrección de color, con gamma fuerte en mazmorras para oscurecerlas.
- (E) Bloom muy usado (rayos de luz, velas). (A) Intensidad ≈ 1,6.
- (E) Destello de lente muy suave: con cámara fija molesta, así que casi solo aparece en amaneceres y atardeceres.
- (E) Luz ambiente por cubemap en el post-proceso, en lugar de una luz de cielo, para levantar las zonas en sombra.
- (E) Viñeta más baja que el valor por defecto del motor (0,4). (A) ≈ 0,2.
- (E) **Profundidad de campo** de tipo bokeh: según el autor es el ajuste que más pesa en el aspecto de maqueta (tilt-shift).

### 3.5 Entorno
- (E) El mundo es 3D con texturas de pixel art.
- (E) El low-poly estilo PS1 dio iluminación inconsistente: muchos modelos son de **polígonos altos**.
- (E) Las texturas pixeladas llevan filtrado bilineal o trilineal: el píxel duro resultaba áspero en el entorno.
- (E) Algunos props son **2.5D**: sprites levemente curvados, que unen lo 2D con lo 3D.
- (E) Producción: herramienta propia de **construcción por bloques**, más terreno esculpido y follaje (desierto, nieve),
  ríos por splines y piezas modulares.
- (A) Atajo sin arte propio: assets pintados a mano con la textura reducida a 128–256 px.

### 3.6 Escala de edificios e interiores
- (E) Los edificios no tienen tamaño físico correcto: son más pequeños, por influencia de Final Fantasy VI.
- (E) Problema: el personaje no cabe. Solución: un disparador en la puerta **reduce al personaje a la mitad y
  acorta a la mitad la distancia de cámara**. El tamaño aparente no cambia y el interior rinde el doble.

### 3.7 Oclusión del primer plano
- (E) Los objetos de primer plano que taparían al personaje se enmascaran. (A) Con un material que mira la posición
  de la cámara y si el objeto está en la línea de visión.

## 4. Contraste con lo que ya medimos

| Tema | Tutorial | Lo nuestro | Lectura |
|---|---|---|---|
| Inclinación de cámara | 20° (A) | Octopath ≈ 15–20° con FOV vertical ~40 **[Ref v39, n = 2 cuadros, ±20–30 %]**; remake de DQ3 ≈ 40–53° **[Ref v29]**; captura del trono ≈ 33–35° **[Repo, M4c-2]**; Cam 6 = 25° **[Repo]** | El 20° es coherente con Octopath y **no** con DQ3. Los dos juegos no comparten cámara. |
| FOV | 35–45° (A) | Cam 6 = 30° **[Repo]**; rango útil 30–45° a encuadre de héroe **[R v68, a ojo]** | Compatible. Falta saber si el FOV del tutorial es vertical. |
| Banda nítida | «DoF es lo que más pesa» (A) | Banda nítida ≈ 40–75 % del alto del cuadro **[Ref v39, a ojo, n = 4]** | Dato de la capa de render, fuera del modo 3. |
| Escala interior | héroe × 0,5 y cámara × 0,5 (E) | K interior medido 1,5–2,2 en DQ3 **[Ref, v33 T2]** | Coherente en orden de magnitud; no medido en Octopath. |
| Suelo y muros | bloques 3D + terreno (E) | Regla de composición (b): suelo, muros y pilares son geometría **[U 10 nov]** | El tutorial respalda la regla. |
| Sprites en escena | personajes y algunos props 2.5D (E) | Presupuesto de billboards ≤ 30 % de la pantalla **[U 10 nov]** | El tutorial no da proporción; no contradice el tope. |

## 5. Qué entra en el modo 3 y qué no

El Ancla deja el *look* (texturas, luz, desenfoque, color) fuera del visor: se juzga en Unity. Con ese criterio:

| Bloque | ¿Dónde vive? | Estado |
|---|---|---|
| Cámara: inclinación y FOV (3.3) | Modo 3 (Cam 6 y candidata Cam 8) | Ya trabajado; el tutorial no cambia la decisión de Cam 6. |
| Geometría por bloques (3.5) | Modo 3 | Es la base actual (cubos, volúmenes, terreno por rol). |
| Régimen de escala exterior / interior (3.6) | Modo 3 | **Abierto**: el visor tiene una sola escala (`heroFrac`, `tilesPerH`). Ver 6.1. |
| Oclusión del primer plano (3.7) | Modo 3 (composición) + Unity (material) | **Abierto**: hoy se resuelve bajando el plano FRONT. Ver 6.2. |
| Props 2.5D curvados (3.5) | Unity | El visor usa billboards planos como ranura. |
| Sprites iluminados y sombra (3.2) | Unity | Fuera del visor. |
| Post-proceso (3.4) | Unity (tangente T03: preset de URP) | Fuera del visor. |
| Texturas, filtrado, paleta (3.1, 3.5) | Unity | Fuera del visor. |

## 6. Preguntas que esto abre (hipótesis [R], sin decidir)

1. **Dos regímenes de escala.** ¿El cristalizador declara por sección «exterior» o «interior», con la puerta como
   punto de cambio? En el visor equivaldría a cambiar `heroFrac` y la distancia de Cam 6 juntos al cruzar un umbral.
   Prueba posible: la sala del trono (MAPA 1) con el régimen interior contra el exterior.
2. **Primer plano.** ¿El plano FRONT se baja (como hoy) o se mantiene alto y se marca como «enmascarable» para Unity?
   Lo segundo deja masas de primer plano con desenfoque, que es lo que se ve en Octopath **[Ref v39]**.
3. **Cámara por juego.** Octopath (≈ 15–20°) y DQ3 (≈ 40–53°) piden cámaras distintas. La segunda prueba del
   criterio de terminado (otro juego 2D-HD) necesita capturas propias de Octopath para medir, no los valores del tutorial.
4. **Sombra del sprite.** La sombra diagonal del personaje sobre el suelo es una pista de profundidad barata.
   ¿Vale un marcador de sombra en el visor, o queda en Unity?

## 7. Equivalentes en Unity (URP) — propuesta [R], NO VERIFICADA

Sirve de punto de partida para T03; nada de esto se ha probado en el proyecto.

| Tutorial (Unreal) | Equivalente propuesto en Unity URP |
|---|---|
| Sprite con material iluminado y sombra | `SpriteRenderer` en escena 3D con shader iluminado y recorte por alfa; proyección de sombra activada en el renderer |
| Luz direccional diagonal | Luz direccional con sombras |
| Foco fijo en cuevas | Spot Light hijo del héroe con rotación fijada por script |
| Luz puntual por efecto | Point Light creada junto al efecto |
| Cámara inclinada, FOV bajo | Cámara en perspectiva, FOV vertical 30–45°, inclinación según el juego de referencia |
| Bloom, viñeta, color, gamma | Volume con Bloom, Vignette, Color Adjustments y Lift Gamma Gain |
| Profundidad de campo bokeh | Volume → Depth of Field en modo Bokeh |
| Ambiente por cubemap | Iluminación de entorno (color, gradiente o skybox) |
| Textura pixelada con filtro bilineal | Tamaño máximo de importación 128–256 y filtro Bilinear o Trilinear |
| Máscara de primer plano | Shader con disolución por distancia a la línea cámara → héroe |
| Cambio de escala en la puerta | Trigger que escala al héroe × 0,5 y acerca la cámara × 0,5 en el mismo fotograma |

## 8. Límites de este documento

- Una sola fuente secundaria, con interés comercial; sin acceso a las charlas originales.
- Los valores (A) son gusto del autor para Unreal 5, no datos de Octopath.
- El tutorial describe Octopath. No describe el remake de DQ3, Triangle Strategy ni Wandering Sword.
- Nada aquí reemplaza una medición en capturas: lo no medido es hipótesis.
