# PP2 · guías del 5F, variante B (cores, puertas y conos)

Reusa de `../` la rejilla (57 × 108 tiles de 8 px, recorte 1/5/6/7 px), las clases y el RL (room 1 = suelo + escalera, muro y obstáculo Steep con terraza más alta, `forb`). Cam 6, yaw 0. No se editó `src/`, no hay alturas, no se tocó `../`. Script y entorno no se guardan aquí.

**Lecturas que tomé donde era ambiguo**
- Obstáculo = todo tile que no es suelo (muro, obstáculo, fuera) y el borde del mapa; la escalera cuenta como suelo.
- r se calcula una vez para todo el suelo: el mayor k tal que el cuadrado de radio k (anillos de 8 vecinos) es todo suelo. Área de un core = ese cuadrado de radio r, menos lo ya cubierto. r no se recalcula al salir tiles de la lista; los tiles que quedan sueltos son cores con su r original (muchos con r = 0). Desempate: fila y luego columna.
- Puerta = grupo 4-conexo de tiles del área A que tocan (4 vecinos) tiles del área B, uno por par (A, B).
- Cono: eje = del tile de puerta al centroide de su área; ±45° (parámetro `CONE_DEG`); un tile cuenta si la línea de Bresenham desde la puerta pasa solo por suelo (otras áreas no bloquean) y no está en sombra (`X.visibility`, vis ≤ 0,15, el mismo umbral de `X.multiVantage`). Un área de 1 tile no tiene eje: su cono es el propio tile.
- Plataforma de una puerta: BFS de 4 vecinos desde todos sus tiles de puerta (siempre incluidos) sobre los tiles del cono, tope 250. Versión propia, no edita `src/`.

**1-2 · Cores, áreas y puertas** (`cores.png`, `doors.png`)
- 466 cores: r 0 = 345, 1 = 66, 2 = 42, 3 = 7, 4 = 6. Las áreas cubren los 2142 tiles de suelo. Primer core: (15, 23) con r 4; siguen (41, 23), (17, 67)…
- 1561 puertas (1341 tiles de puerta distintos; 1318 puertas de 1 tile, la mayor de 9).

**3 · Conos** (`cones.png`): una plataforma por puerta, la mayor de 56 tiles; ninguna llega al tope de 250. Los tiles de un área en sombra de Cam 6 no entran en ningún cono (zonas grises).

**4 · Caminos y `X.compute`, yawOf = 0** (`platforms.png`, `flow.png`; determinista; X.HYP sin cambios)
- Árbol entre los 466 cores con `R.spanning` y `R.dijkstra`: 453 caminos en 13 componentes (la mayor con 408 cores; la cámara de G aparte con 28).
- Grosor máximo 6 ≥ minThickness 4: 1 semilla flow (los 2142 tiles), 0 semillas room, nada descartado por clave. Recorte: quedan 1464 y se quitan 678; 14 plataformas cubren 1320; 144 sin plataforma. Suelo sin plataforma 822 (los mismos 822 en sombra). `road`: 302 secuencias (en `counts.json`, no numeradas en la imagen), codos 0.

**4 · Rutas de escalera** (`flow_escaleras.png`, 4 vecinos entre tiles que no son obstáculo)
- H (19, 92) → I (25, 74): 105 tiles. H → J (31, 86): 181 tiles.
- G (31, 24) → I y G → J: no conecta a pie. Desde G se alcanzan 76 tiles; desde H, I y J, 2036. No se forzó.

**Archivos**: `cores.png`, `doors.png`, `cones.png`, `platforms.png`, `flow.png`, `flow_escaleras.png`, `manifest.json` (evodun-pack/0.2: roles room, area, path, marcadores G/H/I/J, cores y parámetros en `guias`; sin elevation, el visor no lo carga hasta que se le dé uno; pasa `E.parseManifest`), `pack_*.png` (1 px = 1 tile; `pack_areas.png` guarda id + 1 = R + 256 · G), `counts.json`.
