# Brief para CC · Sellar DAC3 (constructor del Stage 3, fase 0b)

Registro A520–A521. Sigue a `stage_s3_fork_go.md` (PR #103). **Regla de [U] (2026-11-19), obligatoria desde ahora:**

- El modo 3 (Stage) usa **solo DAC3** (`src/s3/`, `E.s3`). Nunca la cadena DAC original (`E.shape`, `E.rooms`, `E.roomTypes`, `E.pocket`), que queda para el modo 2 (y 1, 4).
- Si algo de DAC3 falla, se puede **leer y clonar** del original, pero **no usarlo** desde el modo 3.
- **El DAC original no se altera.** Toda mutación va en DAC3.
- Motivo: si el modo 3 cae al original, no se puede saber si un resultado es de DAC3 o del DAC de antes.

**PRESUPUESTO: 25 minutos de reloj.** Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## 1. Qué falta sellar (inventario de [R] sobre #103; confírmalo)

El clon tiene como prototipo `window.EVO`, así que todo lo que no define cae al original:
- `src/s3/shape.js` llama 5 veces a `E.pocket` y `src/s3/roomtypes.js` 1 vez: resuelven al `src/pocket.js` original, que a su vez llama a `E.roomTypes` / `E.shape` **originales**.
- `src/ui.js` usa `E.rooms.hue`, `E.roomTypes.*` (chips, info, cadena) sobre un `S` del modo 3.
- Cualquier otro módulo de la cadena que el modo 3 alcance por el prototipo (búscalo con un proxy de conteo, §3).

## 2. Qué construir

1. **Clonar lo que falte** a `src/s3/` (al menos `pocket.js` → `E.s3.pocket`), copia literal con el encabezado de fork (commit de origen, diverge a propósito). Dentro del clon, toda llamada de la cadena apunta a `E.s3`.
2. **Cortar la caída por prototipo para la cadena:** en `E.s3`, los nombres `shape`, `rooms`, `roomTypes`, `pocket` (y los que encuentres) deben resolver al clon o lanzar error; nunca al original. Las utilidades que no son cadena DAC (`curves`, `fields`, `png`, cámara, `render`, `tech`) siguen compartidas.
3. **`src/ui.js`:** en una sesión del modo 3, todas las llamadas a la cadena usan `E.s3.*` (un alias `DAC()` que elige según `stageShape()` basta). Los modos 1, 2 y 4 no cambian de camino.
4. **CLAUDE.md:** la regla de arriba en la entrada «STAGE CONSTRUCTOR (fork of DAC)» y en «How to work with the user»: «Mode 3 uses only DAC3 (`src/s3/`); the original DAC chain is read-only for mode 3 (read / clone, never call); never edit the original DAC for mode 3 work».

## 3. Prueba (lo único que se mide)

- **Cero llamadas al original desde el modo 3:** envuelve `E.shape`, `E.rooms`, `E.roomTypes`, `E.pocket` originales en un contador; abre cada ejemplo del modo 3 (incluidos legacy, `perfil_*`, bosque, Aurhea, trono) y camina k0→k8 en uno: **contador = 0**. Abre el ejemplo por defecto del modo 2: contador > 0 (control).
- **Identidad:** hashes de canvas antes / después idénticos (ejemplos del modo 3 + los 21 estados de `m2_hashes`).
- **Mutación de control:** una constante cambiada en `src/s3/pocket.js` mueve el modo 3 con pocket y no el modo 2.

## 4. Carril

- **node:** `test_s3_clone.js` (ampliado con el pocket), `test_dist_modules.js`, `test_modes.js`.
- **UI:** `test_s3_fork_ui.js` ampliado con el contador. Nada más.
- **`regress --sample 1/4`** en segundo plano (se toca `ui.js` y `build.py`).
- **Reporta cómo terminó `test_diocorr`** del PR #103 (quedó corriendo > 372 s).
- No corras `test_window_session_ui`. Segundos de cada comando y lo que no corrió. Dos fallos seguidos: PARA y di si es código o test.
- Rama nueva sobre `main` (con #102 y #103 ya mergeados) y PR. **No mergees: mergea [U].**

## 5. Duda abierta para [U]

[R] propone que el **renderer** (`render.js`, `tech.js`, `curves.js`) sea infraestructura compartida del visor, no DAC: el modo 3 lo usa sin clonarlo. Si [U] dice que también se clona, va en otra fase.
