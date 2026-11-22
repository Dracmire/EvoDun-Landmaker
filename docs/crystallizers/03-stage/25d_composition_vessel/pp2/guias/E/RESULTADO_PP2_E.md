# PP2 · guías del 5F, variante E (cierre del paso 2)

Parte de `../C/` (grupos) y de `../D/` (entrada (19, 92), salida (31, 86) y los A*), sin tocarlos. Mismo mapa de 57 × 108 tiles de 8 px, Cam 6, yaw 0. No se editó `src/`, no hay alturas. Script y entorno no se guardan aquí. `HASHES_E.txt`: dos corridas dan los mismos hashes.

**Qué hice**
- Fusioné los grupos como pidió [U]: pasillo X 5 + hub 21 + pasillo X 7 → pasillo X 5; pasillo X 8 + pasillo X 6 → pasillo X 6; hub 22 + pasillo Y 11 → "grupo 11". Cada fusión conserva el id más bajo; la tabla C → E está en `guia_E.json`.
- Apliqué la regla gate/codo con los ids del encargo. Los ids de los cores coinciden con `grupos.json` de C (los tres codos, los gates y los cores de hub 17 y hub 18 con y ≤ 17): nada que corregir. Los codos 55 y 58 y esos cores pasaron a pasillo X 0; el codo 120 pasó a pasillo X 9.
- Etiqueté los gates: 13 cortes (F1–F7), 2 absorbidos (60, 61), 16 puertas. Cúmulos unidos: 83+84+85 (corte F4), 102+104+105+106 y 103+109+110+111 (puertas).
- Sectores: quité los 7 pasajes de corte (gates y, en F3 a F6, el pasillo Y) y tomé los componentes conexos: S1 (X 0, X 1, X 2, hub 17, hub 18), S2 (X 3, cámara cerrada de G), S3 (X 4, X 5, X 6, Y 10, Y 16, hub 23), S4 (X 9, grupo 11, hub 24), S5 (hub 19), S6 (hub 20), S7 (hub 25). Detalle y puertas de cada uno en `guia_E.json` y `sectores_E.png`.
- Flow: `X.widened` de D (±6, 1 − r/7) sobre el A* entrada → salida de D (216 pasos), con todo tile fuera de los grupos que ese camino cruza como bloqueado (los gates absorbidos cuentan como pasillo X 0); a 0 dentro de los pasajes de corte. El camino cruza F3, F4 y F7 y queda en 4 tramos: (19,92)→(11,43), (14,42)→(43,43), (45,48)→(34,91), (32,90)→(31,86). Los A* a I y al cofre 2 son los de D, sin recalcular.
- Por grupo: bbox en tiles y en H (1 tile = 1 H) y cuántos fondos de 17 H caben en su largo en Y (parte entera y cociente), en `guia_E.json`.

**Lecturas que tomé**
- Cúmulo: centros a ≤ 4 tiles (Chebyshev), encadenados, solo entre gates con la misma etiqueta.
- "Camino entre la entrada y la salida": el A* de D hasta la salida.
- Dos lecturas del ancho del flow: la principal usa un solo room, como D; el ancho lo fija el punto más estrecho de todo el camino y sale delgado. Aparte, `pack_flow_por_grupo.png` parte el camino por grupo (BreakPathByRoom con el grupo como room) y sale más ancho.

**Qué no calzó**
- El esquema de 8 bits no llegó adjunto a esta conversación: no existe `refs/dq3_dreamers_5f_8bit.png`.
- F1 y F2 no separan en mis datos: pasillo X 0 sigue tocando a hub 17 y a hub 18 sin gate de por medio, en (20,17)–(20,18) y (40,17)–(40,18) (cores 137–143 y 138–144, de la lista del encargo). Por eso S1 junta X 0, hub 17 y hub 18. En F4, pasillo X 2 y hub 18 también quedan juntos en S1.
- El 83 entra en el cúmulo de F4 por la regla de 4 tiles (queda a 2 tiles del 84); el encargo lista solo 84 y 85. No cambia sectores ni flow.
- El A* de D no da la vuelta por arriba: va por el medio (y ≈ 43) y no cruza F1, F2, F5 ni F6. Si [U] espera la herradura por la parte de arriba, hace falta otro camino; no lo calculé.

**Archivos**: `guias_E.png`, `sectores_E.png`, `guia_E.json`, `pack_*.png` (1 px = 1 tile; `pack_grupos.png`: id + 1 = R + 256·G; `pack_gates.png`: 1 corte, 2 puerta, 3 absorbido, 4 pasillo Y de corte), `HASHES_E.txt`.
