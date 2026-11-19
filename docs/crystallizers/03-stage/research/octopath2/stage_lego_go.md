# Brief para CC · Verticalidad tipo lego en DAC3 (T4)

Rama R2. Registro A527–A529. **Lee antes de empezar:**
- `research/octopath2/verticalidad_lego.md` (el diseño; las decisiones de [U] en §7 y la regla L2' en §7b);
- `research/octopath2/verticalidad.md` (familias A y B, I1–I4, V1–V7) y `verticalidad_resultado.md` (PR #105);
- `MODELO_ACTUAL.md` v2.4.

**Regla DAC3 (CLAUDE.md):** todo va dentro de `src/s3/`. El DAC original no se llama ni se edita. Las herramientas compartidas se usan tal cual; para cambiar una se clona. **Excepción autorizada por [U] (D-L4):** Cam 7 se puede reajustar (ver §3).

**Roles:** [R] diseñó; tú construyes y mides; [U] juzga mirando. Sin jueces ni rúbricas.

**PRESUPUESTO: 25 minutos de reloj.** Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## 1. Tratamiento de altura por sala

- Un campo opcional por ejemplo de ventana, `heightTreatment: 'down' | 'mid' | 'up'`. Ausente = `mid` = hoy, byte a byte.
- Un selector del modo 3, «Height treatment» (Auto = lo que declara el ejemplo / Down / Mid / Up), que termina con la sesión de ventana.
- Declara: `perfil_m1` y `perfil_m3` = `up`; un Diorama de tipo Cima o Mirador (elige uno de «Balanced types» y di cuál y por qué) = `down`; `perfil_c0` = `mid` (control).

## 2. L2' · Lego por terraza (`src/s3/`)

1. m = la terraza base de la sala del héroe (la más baja que pisa lo caminable), acotada a 1–3.
2. **Up:** cada salto entre terrazas caminables de la sala mide m·E (E = la terraza de la Base). **Down:** la terraza más alta queda fija y las demás caen m·E por salto. **Mid:** nada.
3. Solo cambian las alturas de los niveles de la sala (`S.fine` / `S.levelH` vía `insertLevels` del clon). **La topología queda idéntica**: verifícalo por hash de `S.walk`, las regiones, el grafo y las escaleras, antes y después.
4. L4: el escenario de la sala (fondo de `planes`, lados) sube con el mismo m: el fondo a 2–3 E sobre lo más alto de la sala en Up. En Down el fondo baja. Todo como geometría, nunca billboards.
5. L6: si una terraza caminable más alta queda delante del héroe, prueba el otro yaw de `orient`. Si tampoco sirve, márcalo como conflicto y no lo fuerces.

## 3. Cam 7 con el yaw de la sala (D-L4)

En el modo 3, Cam 7 usa el yaw base de la sala (el mismo que Cam 6). En los demás modos queda en yaw 0, byte a byte. No toques Cam 1, 3, 5 ni 6.

## 4. Medidas (solo mide)

Por ejemplo y por k0/k4/k8, en Cam 6 y en Cam 7, con el tratamiento apagado (Mid) y encendido:
- ρ (Up) o altura relativa del héroe (Down);
- oclusores caminables;
- bandas visibles;
- m de la sala y saltos resultantes en H.

Además, **en las 88 salas de «Balanced types»** (sin capturas):
- cuántas pisan una sola terraza (L2' no las cambia);
- distribución de m;
- **fronteras A+2 y A+3 entre salas** (D-L5): cuántas, y cuántas tendrían puerta si la regla aceptara dos terrazas. Solo se mide.

**Entrega:**
- capturas en `docs/crystallizers/03-stage/shots/lego/`;
- las tablas;
- todo en `research/octopath2/verticalidad_lego_resultado.md`.

**Predicción (congelada):** en Up, ρ ≥ 0,6 y 0 oclusores caminables en k4 en las salas que pisan ≥ 2 terrazas. Más de la mitad de las 88 salas pisan una sola terraza.

## 5. Carril

- **node:** `test_vert.js`, `test_s3_clone.js`, `test_planes.js`, `test_modes.js` y uno nuevo para L2' (topología idéntica, saltos = m·E, Mid byte a byte).
- **UI:** uno nuevo para el selector y Cam 7.
- **Hashes:** los 19 estados s3 y los 21 de `m2_hashes`, idénticos con Mid.
- **`regress --sample 1/4`** en segundo plano, porque se toca la cámara.
- No corras `test_window_session_ui`.
- Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` y PR. **No mergees: mergea [U].**
