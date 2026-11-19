# Brief para CC · Lego, segunda pasada (T4 sobre salas de 2+ terrazas)

Rama R2. Registro A530–A533. **Lee antes de empezar:** `verticalidad_lego.md` (§7b), `verticalidad_lego_resultado.md` (PR #107) y `MODELO_ACTUAL.md` v2.4. La regla DAC3 de CLAUDE.md sigue igual: todo en `src/s3/`.

**PRESUPUESTO: 20 minutos de reloj.** Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## Por qué hay una segunda pasada

En #107, M1 y M3 pisan una sola terraza, así que L2' no les cambia nada y la predicción de Up quedó sin probar. En L1 (Down), el héroe sube desde la terraza baja: en k4 la escena es una banda que sube (familia A) y solo en k8, ya en la cima, es una atalaya (0,91). [R] lo lee así: **en una sala Down, el camino de subida es familia A y la cima es familia B.** Así funcionan también las atalayas de Octopath: primero se sube y después se mira hacia abajo.

## 1. Corrección de L2' (decisión de [R], A531)

Un salto entre dos niveles caminables que cruza Δ terrazas mide **m·E·Δ**, no m·E. Así no se comprime un salto de dos terrazas cuando m = 1 (lo que #107 señaló en `L.newBases`).

## 2. Ejemplos Up con 2+ terrazas

Elige **dos** salas de «Balanced types» que pisen ≥ 2 terrazas y que el héroe recorra subiendo (de las 53 de `lego_rooms.json`):
- una Ascensión de tipo pasillo (P1 o P2);
- un Cake o un Hub (P3).

Decláralas como `perfil_u1` y `perfil_u2`, con `heightTreatment: 'up'`, los mismos campos de la Base v2.4 que los `perfil_*`, sin reducción a mano. Di cuáles elegiste y por qué. M1 y M3 quedan como están.

## 3. Medidas

- **Up (u1, u2):** k0/k4/k8 en Cam 6 y Cam 7, Mid contra Up. Mide ρ, oclusores caminables y **bandas visibles** (ver abajo).
- **Down (L1):** separa los pasos del recorrido en **subida** (el héroe no está en la terraza más alta) y **cima** (sí lo está). En la subida mide como familia A (ρ, oclusores). En la cima mide la altura relativa del héroe. Sin cambiar código de L1.
- **Bandas visibles:** cantidad de alturas caminables distintas en las baldosas visibles del pick buffer, agrupando las que difieren menos de 0,5 E. Es un contador nuevo, solo mide.
- **A+2 con 5 terrazas:** repite el conteo de fronteras A+2 y A+3 entre salas con el preset Default (5 terrazas). Solo mide.

**Entrega:** capturas en `shots/lego/`, tablas y una sección «Pasada 2» en `verticalidad_lego_resultado.md`.

**Predicción (congelada):**
- en u1 y u2, Up da ρ ≥ 0,6, 0 oclusores caminables en k4 y 2–3 bandas visibles;
- Mid da 1–2 bandas;
- en L1, la subida da ρ ≥ 0,6 y la cima una altura relativa ≥ 0,8;
- con 5 terrazas, A+2 > 0 pero menos del 5 % de las fronteras entre salas.

## 4. Carril

- **node:** `test_lego.js` (ampliado con Δ), `test_vert.js`, `test_modes.js`.
- **UI:** `test_lego_ui.js`.
- **Hashes:** los 21 estados s3 y los 21 de `m2_hashes`, idénticos con Mid.
- Sin `regress`: solo hay ejemplos y código de `src/s3/`; si tocas `ui.js` fuera de `stageShape()`, dilo y corre `--sample 1/4`.
- Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` (con #107 mergeado) y PR. **No mergees: mergea [U].**
