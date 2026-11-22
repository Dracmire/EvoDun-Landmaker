# PP2 · guías del 5F (paso 2) con el código DAC3 del repo

Entrada: `../../refs/dq3_dreamers_5f_snes.png` (463 × 876). Cámara Cam 6, yaw 0. Un solo room, una terraza, sin watershed. No se editó `src/` y no se puso ninguna altura. Script y entorno no se guardan aquí.

**1 · Grilla y clases** (`grilla.png`, `clases.png`; amarillo = tile dudoso, cian = recorte)
- Tile = 8 px. Busqué la fase (x0, y0) que menos tiles mixtos deja (< 75 % de una clase): el mínimo es agudo en (1, 5) con 180 de 5756 tiles, el siguiente 239. Con 16 px el mínimo es una meseta en x0 7-9 (64 de 1413), sin fase clara; por eso 8 px.
- Recorte: 1 px a la izquierda, 5 arriba, 6 a la derecha, 7 abajo. Mapa de 57 × 108 tiles.
- Clases: suelo 2126, muro 3499, escalera 16, obstáculo 32, fuera 483 (cielo y nubes). 119 tiles dudosos (bordes de muro con suelo).
- Escaleras: no hay un icono de escalera; tomé las 4 etiquetas verdes G, H, I, J (bloques de 2 × 2 tiles, centro del tile de la letra). Es una suposición mía. Cofres = las dos S; obstáculos = 2 cofres (8 tiles) + 6 antorchas (24 tiles). Muro = lo gris azulado (tapa) y la cara oscura con pilares.

**2 · RL a mano** (`E.s3.platforms.compute` lee `mapW mapH room ter cls forb reach treeReach usage`): room 1 = suelo + escalera; muro y obstáculo `cls` Steep, `forb` 1, `ter` 1 (terraza más alta); fuera Void.
- Sombra (`X.visibility`, look [0, -1]), suelo 1-2 tiles detrás en la mirada que quedó con vis > 0,15: solo Steep: muros 354 de 354, obstáculos 0 de 8 (4 de 8 con los muros delante; la poda de regiones < 20 tiles los borra). Steep + terraza más alta: muros 354/354, obstáculos 8/8. Usé esta última.

**3 · Caminos** (`R.spanning`, `R.dijkstra`; paso 4-vecinos entre tiles no `forb`)
- Árbol de 2 componentes: H–I (105 tiles), I–J (133). Escaleras usadas: H (19, 92), I (25, 74), J (31, 86). G (31, 24) no entra: su cámara (76 tiles de suelo) queda cerrada por muros; el hueco mínimo son 4 tiles de muro, ninguno dudoso. No se forzó.

**4 · `X.compute`, yawOf = 0** (determinista en dos corridas)
- Por defecto: widened 415; 1 subsegmento (2142 tiles); grosor máximo 2 < minThickness 4 → 0 semillas flow; 1 semilla room (2036 tiles). Descartadas: 106 tiles de la semilla room (bloques de suelo < 300: la cámara de G, 76, y piezas de 1-6). Recorte: de 2036 quedan 1424 (612 quitados); 16 plataformas cubren 1288; 136 sin plataforma. Suelo sin plataforma 854 (sombra vis > 0,15: 822). Plataformas camino: ninguna.
- Parámetro cambiado: `X.HYP.minThickness` 4 → 2, pasado desde fuera, porque con 4 ninguna semilla flow existe y no hay plataformas camino. Resultado: 1 semilla flow (2142, no usa conectividad), recorte 1464 (678 quitados), 14 plataformas con 1320, 144 sin plataforma; suelo sin plataforma 822; camino H→I cruza 3, 0, 2, 4 e I→J cruza 4, 2, 5, 9, 10, 13, 8; 5 codos. Tipo de flujo ignorado.

**Archivos**: `grilla.png`, `clases.png`, `platforms.png`, `flow.png` (por defecto); `platforms_mt2.png`, `flow_mt2.png` (minThickness 2); `manifest.json` (evodun-pack/0.2: roles room, area, path, marcadores G/H/I/J; sin elevation, el visor no lo carga hasta que se le dé uno; pasa `E.parseManifest`); `pack_*.png` (1 px = 1 tile); `counts.json`.
