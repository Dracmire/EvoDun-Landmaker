# PP2 · paso 4c · cara contra techo, ángulo por tiles enteros, tres familias de cámara y bandas sobre el SNES real

Base: commit 2a24dc6. No se tocó `src/`, `tools/`, `pp2/guias/`, `pp2/alturas/` ni `pp2/profundidad/`. No se usó Cam 6. Script, entorno y pesos no se guardan aquí. Los archivos de las tres familias se leyeron en GitHub solo para tomar sus fórmulas; no se copió código.

## Qué hice
1. **Cara y techo en la imagen real** (`caras_techos.png`). Los 43 px del pilar de `muros.json` son **cara más techo** (y los 44 de fachada). El dibujo del pilar es el mismo en los 35 (23 interiores, 12 de fachada sin cortar): capitel filas 0–9 (bandas claras en las filas 4 y 9; se leen en 18 de 35, en el resto las tapan sus vecinos), fuste 10–27, plinto 28–42. Corté de dos maneras: **R1** (la que uso): techo = plinto de 15 filas (la base de 1 tile), cara = 28 px (fachada 29); **R2**: techo = capitel de 10 filas, cara = 33 px. Muros (5 tramos W4, W3, W4, W1, W3): cara sola de 38 px (columnas de 35 a 41); techo = filas de tope contiguas sobre el borde de esa columna: 22 px en cuatro tramos (máximo 23 a 73) y 182 px en uno. Cofres (2): icono de 1 tile de 16 × 16 con dibujo de 14 filas; tapa y frente van en el mismo dibujo y no se separan. Cuadros de escalera (4): planos, 14 × 14–16 px dentro del tile de 16 × 16 (techo entero, cara 0).
2. **Pilar sobre cofre** (`pilar_sobre_cofre.png`). Recorte real de 256 × 224 con el cofre de `[247, 594, 263, 610]` y el pilar P23 (filas 689–731). Sprite del héroe recortado de la captura SNES y reducido a px del juego; pies en el borde de abajo del tile de atrás. Con P23 el héroe queda cubierto por completo y el tope del héroe (y = 692,2) está **3,2 px por debajo** del tope del pilar (y = 689). Con el cofre, el tope del héroe queda 24,8 px por encima del dibujo del cofre (empieza en y = 596): el cofre no lo cubre.
3. **Ángulo por tiles enteros** (`angulo_enteros.png`). n = (cara / t)·tan θ con t = 16 px.

| n (tiles) | 60° | 70° | 80° |
|---|---|---|---|
| Pilar interior (cara 28) | 3,03 | 4,81 | 9,93 |
| Pilar de fachada (cara 29) | 3,14 | 4,98 | 10,28 |
| Muro (cara 38) | 4,11 | 6,53 | 13,47 |
| Héroe (22,79) | 2,47 | 3,91 | 8,08 |

   θ exacto para un pilar de 3, 4 y 5 tiles: 59,74°, 66,37° y 70,71° (muro 4,07 / 5,43 / 6,79 tiles; héroe 2,44 / 3,26 / 4,07). Barrido de 60 a 85° cada 0,1°: mínimos locales del residuo máximo en 81,0° (11 / 15 / 9 tiles), 73,7° (6 / 8 / 5), **71,0°** (pilar 5,08, muro 6,90, héroe 4,14; residuo máximo 0,137), 83,8° y 65,4° (3,82 / 5,19 / 3,11; 0,187). Con el pilar de 3 a 5 tiles y héroe ≤ pilar, los dos que quedan son 71,0° (héroe 4, pilar 5, muro 7) y 65,4° (3, 4, 5). **θ del paso 3 = 71,0°.** Con cara 27 (la de [R]) también sale 71,0°; con R2 (cara 33) sale 63,8° (pilar 4,19, muro 4,83, héroe 2,89).
4. **Tres familias** (`familias_camara.png`), a 71,0°, 70° y 80°, con pilar + héroe pegado + cofre sobre el P23 real (diferencia contra cara 28, techo 15 y héroe 22,79):
   - **Godot `Basis25D` ortogonal** (X (1, 0), Y (0, −cos θ), Z (0, sen θ)): 71°: cara −1,9, techo +0,1, héroe −1,9; 70°: −0,6 / 0,0 / −0,9; 80° (pilar 10 tiles): −0,2 / +0,8 / −0,6.
   - **Godot `ObliqueZ`** (Y (0, −1), Z (−0,7071, 0,7071)): no depende de θ; la altura no se achica (n = cara/16: pilar 2, héroe 1 tiles): cara 32 (+4,0), héroe 16 (−6,8), techo 11,3 (−3,7).
   - **Foundry Custom** (rotation 0, ratio = 1/sen θ): techo 15,1 / 15,0 / 15,8 (+0,1 / 0,0 / +0,8); alturas sin achicar: cara 32 (+4,0), héroe 16 (−6,8).
   - **Foundry Earthbound / Paperboy** (skewX −49°): techo 10,5 (−4,5), cara 32, héroe 16.
   - **`3D_iso_in_2D`, pasos enteros** (X (16, 0), Z (0, round(16 sen θ)), Y (0, −round(16 cos θ))): 70° y 71°: cara 25 (−3,0), techo 15 (0,0), héroe 20 (−2,8); 80°: 30 / 16 / 24 (+2,0 / +1,0 / +1,2).
5. **Bandas sobre el SNES real** (`bandas_snes_G.png`, `_H`, `_I`): red de PP3 sobre los recortes de 256 × 224 sin marcas, K-means N = 4 a ese tamaño. En G y H el recorte sale del mapa y va relleno oscuro (34 % y 28 % del recorte).

## Lecturas que tomé
- Los 15 px del plinto son el techo de R1 porque son la única parte del pilar con huella de ≈ 1 tile; la alternativa (capitel) está en R2 y en `paso4c.json`.
- Foundry: `ratio` = 1/sen θ solo escala la profundidad del suelo; `ratio` de Earthbound no se usa (el archivo leído solo trae las constantes) y el skewX −49° se aplicó como matriz de PIXI con escala 1.
- Godot ObliqueZ y Foundry no achican la altura: ahí el entero es n = cara/16 (pilar 2, héroe 1, muro 2), no el de la fórmula con tan θ.
- El sprite del héroe incluye la espada; H = 22,79 es de pelo a pies.

## Qué no calzó (contraste con la predicción de [R])
- **Cara del pilar:** da 28 con el plinto como techo (R predice 27); el muro, 38 como se dijo.
- **Ángulo:** el ajuste cae en 71,0° con héroe 4, pilar 5, muro 7 como predice [R]; para 4 y 3 tiles salen 66,4° y 59,7° (predicho 67° y 61°). Los mínimos fuera de 3–5 son 73,7°, 81,0° y 83,8° (predichos 76,6° y 81°).
- **«A igual θ las tres dan el mismo render (≤ 1 px)»:** no. Godot ortogonal y los pasos enteros se parecen (hasta 3 px de diferencia por el redondeo de 16 sen θ y 16 cos θ); Foundry y las oblicuas no achican la altura y, a tiles enteros, no reproducen el héroe ni la cara (+4 y −6,8 px).
- **«Las oblicuas dejan el techo en 16 px»:** no. ObliqueZ da 11,3 px y Earthbound (solo el skew) 10,5; Foundry Custom da 16·sen θ (15,0 a 15,8).
- **Bandas:** en I, las bandas 0, 1 y 2 tienen cada una ≈ 45 % suelo, ≈ 40 % tope y ≈ 11 % cara: no separan suelo de muros; siguen la posición (fila media 49, 88 y 163) y la banda más cercana (1,7 % de la toma) es 45 % cara, 30 % pilar y 23,5 % objetos. En G y H la banda más cercana también reúne caras, pilares y objetos. Las 4 bandas salen en las tres tomas; si «≈ 4 bandas» sirve lo juzgas tú.

## Archivos
`caras_techos.png`, `pilar_sobre_cofre.png`, `angulo_enteros.png`, `familias_camara.png`, `bandas_snes_G.png`, `bandas_snes_H.png`, `bandas_snes_I.png`, `paso4c.json`, `HASHES_paso4c.txt` (dos corridas, mismos hashes).
