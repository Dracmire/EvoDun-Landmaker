# PP2 · guías del 5F, variante C (agrupar cores en áreas)

Parte de los 466 cores y sus áreas de `../B/` (no existe `pp2/guias/B2/`; tomé B, la variante anterior). Mismo mapa de 57 × 108 tiles de 8 px, Cam 6, yaw 0. No se editó `src/`, no hay alturas, no se tocó `../` ni `../B/`. Script y entorno no se guardan aquí.

**Lecturas que tomé donde era ambiguo**
- "Se tocan": las áreas (cuadrados de radio r) de dos cores comparten un lado de tile (4 vecinos).
- Gate: core de r = 1 que toca un core de r mayor. Es separador y no entra en ningún grupo.
- Dirección: dos cores que se tocan son X si sus centros están en la misma fila y Y si están en la misma columna. Una cadena es un conjunto conexo de al menos 2 cores en una dirección, sin gates. Los cores de r = 0 (restos de 1 tile) no forman cadenas ni elbows: primero se agrupan los cores de r ≥ 1 y los de r = 0 se unen después.
- Elbow: core (no gate, no grande) con vecino alineado en X y también en Y. Es separador: las cadenas terminan en él y no se unen, y no entra en ningún grupo.
- "Grande": r ≥ 3 (parámetro `HUB_R`, 7 × 7 tiles o más). Los grandes no forman pasillos.
- Hub: cada conjunto de cores grandes que se tocan, más los cores de r ≥ 1 que lo rodean sin ser gate, elbow ni parte de un pasillo; no pasa a un pasillo. Distingo hub de pasillo solo por el tamaño: una cadena sin cores grandes es pasillo.
- Core que toca varios grupos (y todos los r = 0 y sueltos): va al grupo con el que comparte más lado; empate, al grupo del vecino de mayor r, luego al id menor. Se repite por oleadas hasta que no cambia nada.
- Los r = 0 que no alcanzan ningún grupo (restos aislados de la fachada de abajo) quedan sin grupo.

**Resultado** (`grupos.png`, `grupos.json`)
- 10 pasillos X, 7 pasillos Y y 9 hubs; 31 gates, 3 elbows; 30 cores sin grupo. En la imagen: un color por grupo, rótulo "pasillo X / pasillo Y / hub" y número, gates en blanco con "g", elbows en negro con "e", sin grupo en gris con raya, línea negra en el límite de grupo.
- `grupos.json` guarda la lectura, los gates, los elbows, los grupos (id, tipo, cores con x, y, r, nº de tiles) y los cores sin grupo.
- La cámara de G (cores de la sala de arriba al centro) sale como "pasillo X 3": mis reglas la leen como cadena porque ahí no hay cores grandes.
