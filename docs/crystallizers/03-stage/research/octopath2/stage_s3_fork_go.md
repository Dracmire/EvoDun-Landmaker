# Brief para CC · Separación: constructor propio del Stage 3 (clon de DAC, fase 0)

Registro A514–A516. **Decisión de [U] (2026-11-18):** el Stage (modo 3) tiene su propio constructor. Se **clona** la cadena DAC que hoy usa el modo 3 y después se **muta** solo en el clon. Así el modo 3 puede hacer cambios topológicos (la verticalidad compositiva, D-V1) **sin romper DAC**, que sigue siendo su propio cristalizador (modo 2). DAC es el mejor paquete inicial antes de la mutación.

**Esta fase solo separa. No muta nada:** el modo 3 tiene que verse byte a byte igual que hoy.

**PRESUPUESTO: 25 minutos de reloj.** Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## 1. Qué usa hoy el modo 3 de DAC (inventario de [R]; confírmalo)

- `src/shape.js` (`E.shape`): cuantiza las terrazas, aplica la capa de salas (`E.rooms.layer`), saca las puertas del árbol (`computeGatesRooms`), talla las escaleras (`carveStairs`), arma el grafo para caminar (`walkGraph`, `classifyWalk`) y aplica Cake, Ascensión y pocket (`E.roomTypes.*`).
- `src/rooms.js` (`E.rooms`) y `src/roomtypes.js` (`E.roomTypes`, incluido `insertLevels`).
- Los módulos propios del modo 3 llaman a `E.roomTypes.insertLevels`: `planes.js:59`, `volumes.js:43`, `border.js:50`.

Si encuentras otro punto de entrada del modo 3 a esa cadena, agrégalo y dilo.

## 2. Qué construir

1. **El clon:** `src/s3/shape.js`, `src/s3/rooms.js` y `src/s3/roomtypes.js`, copias **literales** de los tres archivos de hoy con el espacio de nombres cambiado: `E.s3.shape`, `E.s3.rooms`, `E.s3.roomTypes`. Dentro del clon, cada llamada interna apunta al clon, nunca al original. Agrégalos a `MODULES` en `tools/build.py`.
2. **El cableado:** cuando el modo 3 está en una sesión de ventana (`st.win`, y los ejemplos del modo 3), `src/ui.js` construye la forma con `E.s3.shape` en lugar de `E.shape`. `planes.js`, `volumes.js` y `border.js` usan `E.s3.roomTypes.insertLevels`. Los modos 1, 2 y 4 siguen usando los originales sin cambio de código en su camino.
3. **El encabezado del clon** dice de qué commit sale y que diverge a propósito. Los arreglos del original no se propagan solos.
4. **CLAUDE.md** (Repo state): una entrada «STAGE CONSTRUCTOR (fork of DAC)». Debe decir que el modo 3 usa el clon; que las reglas de «Agreed design» sobre las terrazas siguen valiendo para el DAC original y los modos 1, 2 y 4; y que **el clon del Stage puede mutar la topología por decisión de [U]**.

## 3. Prueba de identidad (lo único que se mide)

- **Hashes de canvas antes y después,** idénticos, de todos los ejemplos del modo 3 (incluidos los legacy, los mockups `perfil_*`, el bosque, Aurhea y el trono) con sus interruptores por defecto, y de los 21 estados de `m2_hashes`.
- **Hash de `S`** (las terrazas, `S.walk`, las regiones, las escaleras, los niveles) de `perfil_m1` y de `dac_stage` construido con `E.shape` y con `E.s3.shape`: deben ser idénticos.
- **Una mutación de control:** si cambias una constante dentro del clon, el modo 2 no cambia (hash del ejemplo por defecto del modo 2 idéntico) y el modo 3 sí.

## 4. Carril (reducido)

- **node:** `test_dist_modules.js`, `test_modes.js`, `test_planes.js`, más un test nuevo de identidad entre clon y original.
- **UI:** solo uno nuevo que abra un ejemplo del modo 3 y uno del modo 2.
- **`regress --sample 1/4`:** sí, porque se toca `src/ui.js` y `tools/build.py`. Lánzalo en segundo plano.
- **No corras** `test_window_session_ui`.
- Reporta los segundos de cada comando y lo que no corrió. Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` y PR. **No mergees: mergea [U].**

## 5. Después (no en esta fase)

La parte C de `stage_verticalidad_go.md` (D-V1 y las reglas V1–V7) se construye **dentro del clon**.
