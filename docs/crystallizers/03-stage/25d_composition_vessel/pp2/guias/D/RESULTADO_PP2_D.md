# PP2 · flow del 5F, variante D (A* a destinos + flow de la arquitectura)

Nodos = los 26 grupos de `../C/`. Mismo mapa de 57 × 108 tiles de 8 px, Cam 6, yaw 0. No se editó `src/`, no hay alturas, no se tocó `../`, `../B/` ni `../C/`. Script y entorno no se guardan aquí.

**Lecturas que tomé donde era ambiguo**
- Sombra: `X.visibility` (yaw 0) sobre el RL de las guías (muro y obstáculo Steep con terraza más alta), con su valor continuo 0 a 1, sin umbral. Costo de un tile = 1 + 50 × sombra, al entrar en él. A* a 4 vecinos entre tiles de suelo, con h = distancia Manhattan; empates por (f, h, índice), determinista.
- Centro de un nodo: el tile del grupo más cercano a su centroide. Entrada = H (19, 92), el tile de su letra.
- Destino cofre: el tile caminable, vecino (4) del cofre, al que llega el camino más barato. Cofre 2 → (33, 74).
- Costo de un par = pasos + 0,3 × suma de la sombra de todos los tiles de su camino. Sin sombra: el A* usa costo 1 por tile y el par vale solo los pasos. Kruskal con empates por (costo, id, id). Un camino entre dos nodos puede pasar por otros grupos y por gates, elbows o cores sin grupo; la lista los nombra en orden.
- Ensanchado: `X.widened` (±6, 1 − r/7, no cruza `forb`, parte los caminos por room: aquí hay un solo room). Suma = min(1, A* + arquitectura). Solape = tile con A* > 0 y arquitectura > 0.

**Resultado** (`flow_astar.png`, `flow_arquitectura.png`, `flow_suma.png`, `flow_arquitectura_sinsombra.png`, `flow.json`)
- La sala de G (grupo "pasillo X 3") y su cofre 1 no se alcanzan a pie: sin A*, sin nodo en el árbol. No se forzó.
- A* desde H (costo con sombra): salida I 116 pasos, salida J 216 pasos, cofre 2 142 pasos. Mapa A* = 272 tiles con valor 1.
- Arquitectura: 25 nodos alcanzables, 300 pares, árbol de 24 caminos; 1092 tiles con valor. Sin sombra: 24 caminos, 1068 tiles con valor. Suma: 1147 tiles; solape 217.
- `flow_diferencia.png` (extra mío): tiles de los caminos del árbol solo con sombra (66), solo sin sombra (40) y en los dos (314). Aristas distintas entre los dos árboles: 1–12, 2–13, 5–12, 5–21, 6–22, 12–17, 13–18, 13–22 (cada una está en uno solo).
- `flow.json` guarda, por cada camino (A* y árbol, con y sin sombra), los grupos que cruza en orden (`cruza`, con gates, elbows y sin grupo) y `grupos_cruzados`. `pack_flow_*.png`: 1 px = 1 tile, valor = R / 255.
