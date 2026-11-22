# PP2 · paso 4b · cámara del SNES (ortográfica, una sola) y oclusión del héroe

Base: commit 7e2040d. No se tocó `src/`, `tools/`, `pp2/guias/`, `pp2/alturas/` ni `pp2/profundidad/`. No se usó Cam 6 ni la red de profundidad. Script y entorno no se guardan aquí.

## Qué hice
- **θ no venía decidido** (el encargo deja `θ = ___`): hice los dos, **A = 70°** y **B = 60°**, en las mismas hojas.
- **Ángulo en la imagen real.** Carteles de escalera (tiles únicos 113, 143, 149, 158): 14 × 16, 14 × 14, 14 × 14 y 14 × 16 px de dibujo dentro de un tile de 16 × 16 (alto 14–16: rango 2 px, desv. típica 1,0). Caras de muro (W4, W3, W1): 38 px de mediana, columnas de 35 a 41. Pilares (P23, P22): 43 px de mediana, columnas de 37 a 48. El tile achicado mide 16·sen θ = 15,04 px (A, achique 0,96) o 13,86 px (B, achique 2,14). El achique de A queda bajo el rango de altos de los carteles (2 px); el de B no (2,14 > 2). Aparte, el periodo del suelo de la imagen es de 16 px en horizontal y en vertical (picos en 16 y 32 en ambos ejes): la imagen no trae achique medible.
- **Escena 3D mínima.** Cámara ortográfica a θ (ancho × 1, profundidad × sen θ, altura × cos θ; 1 tile de ancho = 16 px). Suelo de tiles de 16; pilar de base de 1 tile y 43/cos θ; muro de 1 tile de grueso (5 de largo) y 38/cos θ; héroe como plano vertical de 16 px de ancho y 22,79/cos θ, en el tile de atrás, con pies al centro (d′ = 8 px) y al borde de abajo (d′ = 0).
- **Oclusión.** Altura oculta del héroe por rayos (h − d′·tan θ en el mundo) y por máscara de píxeles del render; en px y en % de H = 22,79.
- **Vista de lado** (`lado_theta.png`) con el rayo, el pilar, el muro y el héroe a escala.
- **Tomas G (6, 66), H (51, 69), I (22, 63):** recorte real de 256 × 224 centrado en el héroe (relleno oscuro donde el recorte sale del mapa: G, H) | render del mock-up a A | render a B. Mock-up: tope + cara 1,67 H / cos θ, pilar 1,89 H / cos θ, fachada 1,67 H / cos θ, guías E intactas.

| Oculto en pantalla (px, % de H) | 16 bits (`m1.json`) | A, 70° | B, 60° |
|---|---|---|---|
| Pilar, pies al centro | 35 px (154 %) | 35,6 (156 %) | 36,1 (159 %) |
| Pilar, pies al borde | 43 px (189 %) | 43,1 (189 %) | 43,1 (189 %) |
| Muro, pies al centro | 30 px (132 %) | 30,6 (134 %) | 31,1 (137 %) |
| Muro, pies al borde | 38 px (167 %) | 38,1 (167 %) | 38,1 (167 %) |

Mundo 3D que hay detrás de la toma (px en pantalla / cos θ, en tiles de 16): A: héroe 4,16, muro 6,94, pilar 7,86; B: héroe 2,85, muro 4,75, pilar 5,37. El % de píxeles del héroe tapados es 100 % en los ocho casos.

## Lecturas que tomé
- Altura del pilar y del muro = alto del frente (43 y 38 px en pantalla antes de dividir entre cos θ); el bloque tiene además su tapa visible. Pilares y muro con base de 1 tile; el héroe de 16 px de ancho (≈ 1 tile, como pide el encargo).
- Pies al centro = 8 px de suelo detrás del borde de atrás de la base (d′ del `m1.json`); en pantalla son 8·sen θ.
- Recorte real: píxeles del mapa en su posición; la marca blanca es el héroe de 16 × 22,79 px con los pies en el centro del tile de 8 px de la guía. El render usa el mismo punto.

## Qué no calzó (contraste con la predicción de [R])
- **Escalera ≤ 1 px (70°) o ≤ 2 px (60°):** el achique es 0,96 y 2,14 px, pero el dibujo del cartel mide 14 × 14–16 (no 16 × 16) y la imagen no trae achique medible (periodo 16 y 16); en B el achique pasa el rango de altos de los carteles.
- **Lo oculto no depende de θ:** se cumple con pies al borde (43,1 y 38,1 en A y B). Con pies al centro depende de sen θ: 35,6 (A) y 36,1 (B), contra 35 del 16 bits (+0,6 y +1,1 px; la fórmula da 43 − 8·sen θ = 35,48 y 36,07). Si el 8 se mide en pantalla en vez de en el suelo, sale 35 en ambas.
- **El bloque de 3D no tiene la extensión del sprite:** un pilar de frente 43 px con la tapa visible ocupa 58,0 px (A) o 56,9 px (B) en pantalla; el pilar real mide 43 px en total. Si se toma 43 px como extensión total (frente de 43 − 16·sen θ), lo oculto con pies al centro es 20,5 px (A) y 22,2 px (B), y con pies al borde 28,0 y 29,1.
- **Imagen real, filas de pantalla:** sobre el pilar P23 (filas 689–731) y el héroe en el tile de atrás (profundidad de base de 16 px), pies al borde de abajo: el pilar cubre las filas del héroe por completo (100 %, 22,79 px); pies al centro: cubre 18,0 px (79 %) y asoma 4,8 px del héroe. Estas cifras, y las de 35 / 43 px, miden cosas distintas (filas visibles frente a altura de mundo con la tapa).
- **Mundo detrás:** coincide con [R] (héroe ≈ 4,2 y muro ≈ 6,9 tiles a 70°; ≈ 2,9 y 4,8 a 60°).
- **Las tomas** se ven con la misma disposición de muros y suelo que el recorte; el render va a colores planos y a 70° o 60° el suelo se comprime en vertical 0,94 o 0,87. Si «casi iguales» lo juzgas tú con las hojas.

## Archivos
`angulo_escaleras.png`, `oclusion_theta.png`, `lado_theta.png`, `tomas_G.png`, `tomas_H.png`, `tomas_I.png`, `camara.json`, `HASHES_camara.txt` (dos corridas, mismos hashes).
