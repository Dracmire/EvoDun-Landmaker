# PP2 · paso 4 · dos mediciones de profundidad del 5F (M1 oclusión del héroe, M2 tomas con la red de profundidad)

Base: commit c0e7705. sha256 de `refs/` iguales a `refs/README.md`. No se tocó `src/`, `tools/`, `pp2/guias/` ni `pp2/alturas/` (las guías E no cambian: M2 usa `pack_clases_tiles8.png` solo para leer). Script, entorno y pesos no se guardan aquí.

## Qué hice
- **Unidad.** Los 4 carteles de escalera miden 14 × 14 a 14 × 16 px de dibujo y cada uno cabe dentro de un solo tile de 16 × 16 px de la rejilla (8, 4) (tiles únicos 113, 143, 149, 158). Se cumple.
- **M1.** Altura oculta del héroe = h − d′ · tan(pitch), con d′ la distancia del pie del héroe al borde de atrás de la base de 1 tile (rayos paralelos; la oblicua de Cam 7 es pitch 45°, tan = 1; Cam 6 es pitch 25°, tan = 0,466). % = altura oculta / H_SNES (22,79 px); puede pasar del 100 %. Luego una escena mínima (suelo, un pilar de base de 1 tile, héroe 1 H × 0,4 H en el tile de atrás) con las dos cámaras y, en Cam 6, la altura (pasos de 0,05 H) que oculta lo mismo que en el 16 bits. Hoja: `m1_oclusion.png` (pilar de 43 px, pies al centro: Cam 7 | Cam 6 misma altura | Cam 6 altura necesaria).
- **M2.** Mock-up del 5F con los tiles de 8 px de `pack_clases_tiles8.png`: tope, borde y cara = bloques de 1,67 H; pilar 1,89 H; fachada 1,67 H; escaleras y otros objetos planos; héroe como único billboard (0,33–0,46 % de la pantalla). Seis tomas de 800 × 450 (Cam 7 y Cam 6 en tres puntos). Red de PP3 (midas `dpt_beit_large_512` + `img_seg`, CPU, mismo entorno) sobre cada toma a su proporción, y K-means N = 4 sobre el mapa inferno a tamaño nativo (`np.random.seed(0)`). Una hoja por punto: toma | profundidad | 4 bandas, Cam 7 arriba y Cam 6 abajo.

**Tabla M1** (px del juego; H = px / 22,79; pies al centro del tile de atrás / al borde de abajo):

| Objeto | Altura 16 bits | Oculto 16 bits (centro / borde) | Cam 7 render | Cam 6 misma altura | Altura Cam 6 que tapa lo mismo |
|---|---|---|---|---|---|
| Pilar interior | 43 px, 1,89 H | 35 px, 154 % / 43 px, 189 % | 35,0 / 43,0 px | 40,1 px (176 %) / 43,0 px | 1,70 H (−0,19) / 1,90 H |
| Pilar de fachada | 44 px, 1,93 H | 36 px, 158 % / 44 px, 193 % | 36,0 / 44,0 px | 41,1 px (181 %) / 44,0 px | 1,75 H (−0,18) / 1,95 H |
| Cara de muro (38 px) | 38 px, 1,67 H | 30 px, 132 % / 38 px, 167 % | 30,0 / 38,0 px | 34,9 px (153 %) / 38,0 px | 1,50 H (−0,17) / 1,70 H |

El % de píxeles del héroe tapados es 100 % en todos los casos (tope de la medida); por eso la comparación se hace con la altura oculta. La fórmula de Cam 6 da 38,7 px (1,70 H), 39,7 px (1,74 H) y 33,7 px (1,48 H) para la altura necesaria con pies al centro; el render, 0,0–0,5 px más (perspectiva y paso de 0,05 H).

**M2, bandas por toma** (K-means N = 4; % de la toma y profundidad gris media 0–255, claro = cerca; la banda del héroe es la que cubre más de sus píxeles):

| Toma | Banda del héroe | % de la toma por banda 0 / 1 / 2 / 3 | Gris medio 0 / 1 / 2 / 3 |
|---|---|---|---|
| G Cam 7 | 0 | 41,1 / 25,0 / 12,0 / 21,8 | 85 / 122 / 234 / 192 |
| G Cam 6 | 1 | 26,9 / 31,5 / 18,6 / 23,0 | 25 / 72 / 125 / 214 |
| H Cam 7 | 0 | 35,6 / 28,5 / 22,9 / 13,0 | 14 / 61 / 121 / 185 |
| H Cam 6 | 1 | 28,4 / 35,7 / 27,1 / 8,9 | 33 / 94 / 176 / 234 |
| I Cam 7 | 0 | 46,8 / 28,4 / 19,7 / 5,1 | 98 / 141 / 185 / 229 |
| I Cam 6 | 1 | 23,8 / 33,1 / 17,8 / 25,2 | 33 / 96 / 152 / 200 |

En Cam 6 la banda más cercana (gris medio más alto) es 82–100 % muros y pilares en G, H e I; la media de fila crece con la cercanía (70 → 207 → 333 en G). En Cam 7, en G e I (H no la miré en imagen), el mapa de profundidad va en franjas verticales o arcos (G: franja izquierda clara; I: cuenco claro abajo y oscuro al centro) y en G la banda 2 (gris 234) es 100 % fondo vacío. Composición por banda, héroe y cámaras en `m2.json`.

## Lecturas que tomé
- **Cámaras.** Reproducidas fuera del repo con las fórmulas de `src/render.js` (Cam 7 = `makeCam` oblicua, sp = cp = 1; Cam 6 = `makePersp`, FOV 30, pitch 25, yaw 0), leídas sin editar. Pivote en el centro del héroe, heroFrac 0,14 (modo 3), sin el recorte de ventana de `E.stage.clamp`; en Cam 7 el mismo pivote y la misma escala. Unidad = px del juego (tile de 8 px = 8; H = 22,79). M1 usa un panel de 800 × 800; la altura oculta no depende del tamaño.
- **Pies.** Hice las dos lecturas pedidas: borde de abajo del tile de atrás (d′ = 0) y centro (d′ = 8 px). La escena de M2/M1 usa el centro.
- **Alturas.** La cara de muro de 38 px se tomó como altura de un bloque de 1 tile; el pilar de 43 px como altura del frente del bloque.
- **Puntos de M2.** G = (6, 66), pata izquierda de la herradura (pasillo Y 10); H = (51, 69), pata derecha (grupo 11); I = (22, 63), el tile del A* entrada → I más cercano al centro del hub 19. Las letras son rótulos de las tomas, no las escaleras del mapa. Los tres están sobre los A* de las guías D.
- **Mock-up.** Tal como se pidió, cada tile de tope, borde o cara es un bloque sólido de 1,67 H, así que la huella del muro es tope + cara. La fachada va a 1,67 H sin separar cuerpos (los de abajo salen cortados en `pp2/alturas/`). Los tiles de cielo y fuera quedan como fondo. Colores planos por clase, frente ×0,62, lados ×0,45, damero del suelo ±6 %.
- **Bandas.** La etiqueta de banda es la de `img_seg` (orden por el canal R del centroide); no coincide siempre con el orden por profundidad media (G Cam 7, bandas 2 y 3).
- **Hashes.** `m2.json` va sin los segundos de inferencia, que varían entre corridas.

## Qué no calzó (contraste con la predicción de [R])
- **Cámara de Cam 7 como pitch 45°:** el render coincide con la fórmula (35,04 contra 35,0 px).
- **Alturas ocultas:** coinciden con las de [R]: pilar 43 px = 189 % y muro 38 px = 167 % con pies al borde; 35 px = 154 % y 30 px = 132 % al centro.
- **Pilar más bajo en Cam 6:** da 1,70 H, 0,19 H menos que en el 16 bits, contra ≈ 0,2 H predicho; con pies al borde de abajo no hay diferencia (±0,03 H). La perspectiva añade 0,8 px de altura oculta (40,1 contra 39,3 px) en el pilar con pies al centro.
- **M2, Cam 7:** en G e I no veo un degradado por filas como el del 5F entero (A694): sale en franjas verticales o arcos, y el fondo vacío puntúa como cercano en G.
- **M2, Cam 6:** hay degradado por filas, claro abajo, y los muros cercanos forman la banda más cercana; no mido «más claras» que en Cam 7.
- **Cómo se lee en las 4 bandas:** K-means fuerza 4 y reparte (porcentajes en la tabla); si «≈ 4 bandas» o «se lee como el 5F» lo juzgas tú con las hojas.

## Archivos
`m1_oclusion.png`, `m1.json`, `m2_G.png`, `m2_H.png`, `m2_I.png`, `m2.json`, `HASHES_profundidad.txt` (dos corridas completas, mismos hashes).
