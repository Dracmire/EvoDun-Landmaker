# Verticalidad compositiva (T3): partes B y C, y lo que no se hizo (T2 por partes)

Brief: `stage_verticalidad_go.md` (commit a488868), diseño `verticalidad.md`, MODELO_ACTUAL v2.4. **Presupuesto de [U]: 20 minutos.** Sin jueces ni rúbricas: juzga [U] mirando las capturas de `../../shots/verticalidad/` (`<mockup>_<cam6|cam7>_<base|vert>_k<0|4|8>.png`, M1 y M3). Datos crudos: `../../shots/verticalidad/vert_medidas.json`. Herramientas: `tools/ui/vert_measure.js` y `vert_report.js`.

## 1. Resumen

- **Parte A (T2 por partes): NO se hizo.** No cabía en el presupuesto junto con las partes B y C (la secuencia entrada → núcleo → salidas, el corte en codo / pasillo / área central y la tabla v2 son un algoritmo propio, no un ajuste de `perfiles_clasificacion.js`). `perfiles_clasificacion.md` queda como estaba (v1).
- **Parte B (medida): hecha** para M1, M2, M3 y C0 en k0, k4 y k8, en Cam 6 y Cam 7, con las reglas apagadas y encendidas (§3).
- **Parte C (V1–V7): solo V1a (familia A, la banda que sube) en `src/s3/vert.js`, detrás del interruptor «Compositional verticality» (apagado: byte a byte igual).** **No construí** V1b (atalaya), V2 (caras de frente), V3 (escaleras), V4 (barandas), V5 (marco en U), V6 (caída al frente con baranda) ni V7. `planes` sigue dando su fondo alto y frente bajo, sin cambios.
- **La predicción congelada NO se cumple** (§4): con V1a, ρ no llega a 0,6 ni quedan 0 oclusores caminables en k4. La causa es medible y es del dato de la sala, no del código (§5).

## 2. Qué hace V1a (`E.s3.vert`, solo DAC3)

Los **niveles caminables** de la sala del héroe se ordenan por la profundidad media *u* de sus tiles caminables (u crece alejándose de la cámara; la cámara en uso: el yaw de `orient` en Cam 6 y 0 en Cam 7) y se les reasignan las alturas **que la sala ya tiene**, de forma monótona: el nivel más lejano queda en la altura más alta. Se cambia solo `S.fine` de los tiles caminables de la sala; la topología (`S.block`, `S.void`, `S.region`, `S.roomMap`, el grafo de caminar y las escaleras) y las alturas `S.levelH` quedan idénticas (hash en `tools/test_vert.js` y en la tabla de §3). Si la ventana tiene escaleras o rampas (sus registros llevan las alturas de sus extremos) o la sala tiene un solo nivel caminable, **no se fuerza**: se reporta el conflicto. Los pasos son los de la Base (terraza 1,25 H, `subs` 2): no se inventan alturas nuevas.

## 3. Parte B y C: tabla (ρ, altura relativa del héroe, oclusores)

ρ = Spearman entre la altura del suelo y la profundidad *u* sobre las baldosas visibles del pick buffer (arriba: solo las caminables de la sala; la segunda columna, todo lo visible). Altura relativa = fracción de las baldosas visibles caminables cuyo suelo está por debajo del héroe. Oclusores caminables = baldosas caminables visibles más altas que el héroe y más cerca de la cámara que él. Cam 7 no sigue al héroe: se centra en él con la misma escala en píxeles por tile que Cam 6.

| Mockup | Cámara | Reglas | Paso | ρ (caminable) | ρ (todo lo visible) | altura relativa del héroe (caminable) | oclusores caminables | visibles caminables | altura del héroe (H) |
|---|---|---|---|---|---|---|---|---|---|
| M1 · Ascensión · DAC 14 | Cam 6 | off | k0 | 0.03 | 0.40 | 0.09 | 0 (0.0 %) | 306 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 6 | off | k4 | 0.10 | 0.40 | 0.10 | 0 (0.0 %) | 301 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 6 | off | k8 | 0.42 | 0.51 | 0.10 | 0 (0.0 %) | 196 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 6 | ON | k0 | 0.03 | 0.40 | 0.09 | 0 (0.0 %) | 306 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 6 | ON | k4 | 0.10 | 0.40 | 0.10 | 0 (0.0 %) | 301 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 6 | ON | k8 | 0.42 | 0.51 | 0.10 | 0 (0.0 %) | 196 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 7 | off | k0 | – | -0.53 | 0.00 | 0 (0.0 %) | 49 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 7 | off | k4 | 0.05 | -0.35 | 0.15 | 0 (0.0 %) | 188 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 7 | off | k8 | -0.43 | -0.38 | 0.12 | 0 (0.0 %) | 162 | 1.53 |
| M1 · Ascensión · DAC 14 | Cam 7 | ON | k0 | – | -0.45 | 0.00 | 0 (0.0 %) | 49 | 1.25 |
| M1 · Ascensión · DAC 14 | Cam 7 | ON | k4 | -0.04 | -0.29 | 0.00 | 12 (6.4 %) | 187 | 1.25 |
| M1 · Ascensión · DAC 14 | Cam 7 | ON | k8 | 0.43 | -0.36 | 0.00 | 0 (0.0 %) | 161 | 1.25 |
| M2 · Diorama 30 reducido | Cam 6 | off | k0 | 0.79 | 0.32 | 0.27 | 0 (0.0 %) | 138 | 2.50 |
| M2 · Diorama 30 reducido | Cam 6 | off | k4 | 0.77 | 0.28 | 0.24 | 0 (0.0 %) | 134 | 2.50 |
| M2 · Diorama 30 reducido | Cam 6 | off | k8 | 0.75 | 0.49 | 0.98 | 0 (0.0 %) | 130 | 2.77 |
| M2 · Diorama 30 reducido | Cam 6 | ON | k0 | 0.79 | 0.32 | 0.27 | 0 (0.0 %) | 138 | 2.50 |
| M2 · Diorama 30 reducido | Cam 6 | ON | k4 | 0.77 | 0.28 | 0.24 | 0 (0.0 %) | 134 | 2.50 |
| M2 · Diorama 30 reducido | Cam 6 | ON | k8 | 0.75 | 0.49 | 0.98 | 0 (0.0 %) | 130 | 2.77 |
| M2 · Diorama 30 reducido | Cam 7 | off | k0 | – | -0.41 | 0.00 | 0 (0.0 %) | 2 | -2.23 |
| M2 · Diorama 30 reducido | Cam 7 | off | k4 | -0.48 | 0.05 | 0.00 | 0 (0.0 %) | 14 | 1.25 |
| M2 · Diorama 30 reducido | Cam 7 | off | k8 | – | -0.43 | – | 0 (0.0 %) | 0 | -2.23 |
| M2 · Diorama 30 reducido | Cam 7 | ON | k0 | – | -0.41 | 0.00 | 0 (0.0 %) | 2 | -2.23 |
| M2 · Diorama 30 reducido | Cam 7 | ON | k4 | 0.27 | 0.05 | 0.14 | 0 (0.0 %) | 14 | 1.25 |
| M2 · Diorama 30 reducido | Cam 7 | ON | k8 | – | -0.43 | – | 0 (0.0 %) | 0 | -2.23 |
| M3 · Cake 19 | Cam 6 | off | k0 | 0.21 | 0.06 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 6 | off | k4 | 0.21 | 0.06 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 6 | off | k8 | 0.21 | 0.06 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 6 | ON | k0 | 0.21 | 0.06 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 6 | ON | k4 | 0.21 | 0.06 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 6 | ON | k8 | 0.21 | 0.06 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 7 | off | k0 | 0.19 | 0.36 | 0.08 | 0 (0.0 %) | 105 | 1.53 |
| M3 · Cake 19 | Cam 7 | off | k4 | 0.21 | -0.05 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 7 | off | k8 | 0.24 | -0.17 | 0.03 | 0 (0.0 %) | 75 | 1.53 |
| M3 · Cake 19 | Cam 7 | ON | k0 | 0.19 | 0.36 | 0.08 | 0 (0.0 %) | 105 | 1.53 |
| M3 · Cake 19 | Cam 7 | ON | k4 | 0.21 | -0.05 | 0.07 | 0 (0.0 %) | 115 | 1.53 |
| M3 · Cake 19 | Cam 7 | ON | k8 | 0.24 | -0.17 | 0.03 | 0 (0.0 %) | 75 | 1.53 |
| C0 · control · DAC 44 | Cam 6 | off | k0 | 0.26 | 0.30 | 0.00 | 0 (0.0 %) | 1181 | 1.53 |
| C0 · control · DAC 44 | Cam 6 | off | k4 | -0.00 | 0.20 | 0.83 | 0 (0.0 %) | 1517 | 2.77 |
| C0 · control · DAC 44 | Cam 6 | off | k8 | 0.21 | 0.38 | 0.88 | 0 (0.0 %) | 1095 | 2.77 |
| C0 · control · DAC 44 | Cam 6 | ON | k0 | 0.26 | 0.30 | 0.00 | 0 (0.0 %) | 1181 | 1.53 |
| C0 · control · DAC 44 | Cam 6 | ON | k4 | -0.00 | 0.20 | 0.83 | 0 (0.0 %) | 1517 | 2.77 |
| C0 · control · DAC 44 | Cam 6 | ON | k8 | 0.21 | 0.38 | 0.88 | 0 (0.0 %) | 1095 | 2.77 |
| C0 · control · DAC 44 | Cam 7 | off | k0 | 0.26 | 0.24 | 0.00 | 43 (30.7 %) | 140 | 1.53 |
| C0 · control · DAC 44 | Cam 7 | off | k4 | -0.26 | -0.24 | 0.53 | 0 (0.0 %) | 428 | 2.77 |
| C0 · control · DAC 44 | Cam 7 | off | k8 | -0.14 | -0.16 | 0.90 | 0 (0.0 %) | 502 | 2.77 |
| C0 · control · DAC 44 | Cam 7 | ON | k0 | 0.26 | 0.24 | 0.00 | 43 (30.7 %) | 140 | 1.53 |
| C0 · control · DAC 44 | Cam 7 | ON | k4 | -0.26 | -0.24 | 0.53 | 0 (0.0 %) | 428 | 2.77 |
| C0 · control · DAC 44 | Cam 7 | ON | k8 | -0.14 | -0.16 | 0.90 | 0 (0.0 %) | 502 | 2.77 |

### Re-altura aplicada (V1a): niveles caminables de la sala ordenados por su profundidad media

| Mockup | Cámara | Tiles cambiados | Niveles (altura, profundidad media u, tiles) | Conflicto |
|---|---|---|---|---|
| M1 · Ascensión · DAC 14 | Cam 6 | 0 | 1.88 (u 40.23, 30) → 2.29 (u 42.48, 310) | – |
| M1 · Ascensión · DAC 14 | Cam 7 | 340 | 2.29 (u -42.48, 310) → 1.88 (u -40.23, 30) | – |
| M2 · Diorama 30 reducido | Cam 6 | 0 | 1.88 (u 24.5, 1) → 2.29 (u 26.47, 36) → 3.75 (u 38.11, 100) → 4.16 (u 44, 4) | – |
| M2 · Diorama 30 reducido | Cam 7 | 5 | 4.16 (u -29.5, 4) → 2.29 (u -25.36, 36) → 3.75 (u -25.13, 100) → 1.88 (u -23.5, 1) | – |
| M3 · Cake 19 | Cam 6 | 0 | 1.88 (u -44.75, 8) → 2.29 (u -42.28, 107) | – |
| M3 · Cake 19 | Cam 7 | 0 | 1.88 (u -44.75, 8) → 2.29 (u -42.28, 107) | – |
| C0 · control · DAC 44 | Cam 6 | 0 | 2.65 (u -90.38, 8) → 3.02 (u -89.75, 8) → 3.38 (u -89.13, 8) → 2.29 (u -86.5, 523) → 4.16 (u -84.56, 264) → 3.75 (u -71.83, 1080) → 1.88 (u -69, 2) | the window has stairs / ramps (their records carry the heights of their ends): not forced |
| C0 · control · DAC 44 | Cam 7 | 0 | 1.88 (u -36, 2) → 2.29 (u -20.14, 523) → 3.38 (u -17.88, 8) → 3.02 (u -17.75, 8) → 2.65 (u -17.63, 8) → 3.75 (u -15.67, 1080) → 4.16 (u -12.58, 264) | the window has stairs / ramps (their records carry the heights of their ends): not forced |

### Hash de la topología (S.block, S.void, S.region, S.roomMap, grafo de caminar, escaleras) con las reglas apagadas / encendidas

| Mockup | Cámara | off | ON | igual |
|---|---|---|---|---|
| M1 · Ascensión · DAC 14 | Cam 6 | dd7eba7d | dd7eba7d | sí |
| M1 · Ascensión · DAC 14 | Cam 7 | 3df95598 | 3df95598 | sí |
| M2 · Diorama 30 reducido | Cam 6 | 9c1f05ce | 9c1f05ce | sí |
| M2 · Diorama 30 reducido | Cam 7 | 57c81136 | 57c81136 | sí |
| M3 · Cake 19 | Cam 6 | 9a4d695b | 9a4d695b | sí |
| M3 · Cake 19 | Cam 7 | 9a4d695b | 9a4d695b | sí |
| C0 · control · DAC 44 | Cam 6 | aec64f3b | aec64f3b | sí |
| C0 · control · DAC 44 | Cam 7 | 53384f4e | 53384f4e | sí |

## 4. Predicción congelada contra lo medido

| Predicción | Resultado |
|---|---|
| sin reglas, ρ entre −0,2 y 0,2 y algún oclusor caminable | **ρ sí en M1 (0,03–0,10 en Cam 6; −0,43–0,05 en Cam 7) y en C0 (≈ 0), pero NO en M2 (0,75–0,79: el Diorama 30 ya sube hacia el fondo) ni en M3 (0,21).** **Oclusores: 0 en todas las celdas** sin reglas: la hipótesis «algún oclusor caminable» no se cumple; los mockups ya cumplían I1. |
| con reglas (familia A), ρ ≥ 0,6 y 0 oclusores en k4 | **NO se cumple.** M1: en Cam 6 V1a no cambia nada (la sala ya está monótona con su yaw: ρ 0,10 antes y después); en Cam 7 cambia 340 tiles, ρ 0,05 → −0,04 y **aparecen 12 oclusores (6,4 %)**. M3: no cambia nada (ρ 0,21). M2: ρ de −0,48 a 0,27 en Cam 7 con solo 14 baldosas caminables visibles. |

Conflictos: `perfil_c0` (DAC 44, ventana con escaleras): conflicto, no se forzó (ρ ≈ 0 antes y después). Ninguna sala de M1–M3 tuvo conflicto de escaleras (0 escaleras en la ventana).

## 5. Por qué V1a no alcanza aquí (medido)

- **El relieve de las salas es mínimo.** M1 tiene 2 niveles caminables (1,88 H y 2,29 H en unidades de tile: un solo peldaño de 0,275 H; 30 de 340 tiles en el nivel bajo); M3 tiene 2 niveles; M2, 4. Permutar 2 niveles solo puede invertir un peldaño: no forma una banda.
- **Un nivel no es una franja.** V1a ordena niveles enteros por su *u* media. En M1 / Cam 7 el nivel que queda alto tiene tiles delante del héroe: 12 oclusores. Garantizar I1 tile a tile exige que las alturas crezcan con *u* dentro de la sala, es decir **niveles nuevos** (un escalonado de bandas a lo largo de *u*), no una permutación de los existentes. Eso es construir geometría nueva en DAC3 (con `insertLevels`) y no se hizo.
- **Cam 7 y Cam 6 piden órdenes distintos** cuando la sala está orientada a 180° (Cam 7 es siempre yaw 0): una re-altura sirve a una cámara; con la otra empeora. El interruptor usa la cámara activa y reconstruye la forma al cambiarla.

## 6. Lo que no se hizo ni se midió

- Parte A completa (§1).
- V1b, V2, V3, V4, V5, V6 y V7 (§1). No hay capturas «con V2–V6»: las capturas «vert» solo muestran V1a.
- Cake (M3) con anillos: V1a no cambió nada (2 niveles caminables, ya monótonos); no se probó una variante que respete los anillos.
- La familia B en una parte tipo cima (M2 Diorama), no probada.
- Pruebas de lectura: juzga [U]; las capturas de Cam 7 en M1 casi no cambian entre «base» y «vert» (solo la inversión de un peldaño).

## 7. Carril y segundos

Todo en esta máquina, 4 núcleos, headless Chromium; el interruptor está apagado por defecto y el cambio de `src/ui.js` queda protegido por `st.win` / el modo 3.

| Comando | Resultado | Segundos |
|---|---|---|
| `node tools/test_vert.js` (NUEVO: topología idéntica por hash, V1a monótona, idempotente, la cámara en uso, conflictos con escaleras y con un solo nivel, solo en DAC3) | 12 passed, 0 failed | 3–4 |
| `node tools/test_planes.js` | 19 passed, 0 failed | 34 |
| `node tools/test_modes.js`, `test_controls.js` (118 entradas), `test_dist_modules.js` | pasan | < 1 cada uno |
| `tools/ui/test_vert_ui.js` (NUEVO: el control, apagado = hoy y vuelve al mismo hash, Cam 7 re-altura, Cam 6 sin cambio, conflicto, fin de sesión) | 8 passed, 0 failed | 14 |
| tabla de hashes de canvas, árbol nuevo contra 48f4f23: 19 estados (16 ejemplos del modo 3 + modos 1, 2, 4) y los 21 de `m2_hashes` | **idéntica** (19 / 19 y 21 / 21), 0 errores de página | ≈ 30 + 40 |
| la medición `tools/ui/vert_measure.js` (4 mockups × 2 cámaras × 2 estados × k0 / k4 / k8, 24 capturas) | 0 errores de página | 72 |

**No corrió:** `regress --sample 1/4` (el cambio queda protegido por `st.win`; hashes idénticos), `test_window_session_ui` (a pedido; **toqué los puntos donde `winExit` reinicia `st.stage`**, para `vert`: queda para el pase de cierre), `test_modes_ui`, `test_modes_leak_ui`, el pase completo, el `verifier`, y la Parte A.
