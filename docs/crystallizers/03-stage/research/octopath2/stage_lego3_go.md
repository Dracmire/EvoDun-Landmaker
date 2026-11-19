# Brief para CC · Lego, tercera pasada: escaleras, Cake y sub-niveles

Rama R2. Registro A537–A541. **Lee antes de empezar:**
- `verticalidad_lego.md` (§7b);
- `verticalidad_lego_resultado.md` (pasadas 1 y 2);
- `MODELO_ACTUAL.md` v2.4.

La regla DAC3 de CLAUDE.md sigue igual: todo en `src/s3/`; el DAC original no se llama ni se edita.

**Juicio de [U] sobre la pasada 2 (2026-11-19):**
- u1 (Ascensión) salió bastante bien, pero la escalinata de Octopath es más plana y más corta en Z.
- u2 (Cake) no salió tan bien.

**Esta pasada no tiene predicciones numéricas:** [U] juzga las capturas. Las cifras se reportan solo como datos.

**PRESUPUESTO: 25 minutos de reloj.** Al llegar al tope, para y entrega lo que tengas, diciendo qué faltó.

## 1. Escaleras proporcionales al héroe (decisión de [U], A537)

En una sala con lego (Up o Down, m ≥ 2), cada escalera o rampa de la sala:
- tiene la **mitad de largo en Z** (la profundidad, mínimo 1 baldosa);
- tiene **m veces más escalones** (contrahuellas).

Así cada escalón mantiene su proporción con el héroe aunque el salto mida m·E. Si una escalera no cabe, se reporta y no se fuerza. Mid no cambia.

## 2. Cake con lego: dos variantes (decisión de [R] por encargo de [U], A538)

Un selector del modo 3, «Cake under lego»:
- **Rest (por defecto).** Solo crece el desnivel de la terraza; los anillos del Cake quedan como antes, al pie. Entre el último anillo y la terraza alta queda un **descanso**, y la subida restante es una escalera de §1. Es la que prefiere [U] en esta maqueta.
- **Scale.** Todo crece como en la pasada 2, pero los anillos se multiplican: n_anillos × m, con la misma altura por anillo, de modo que el Cake llega a la terraza alta. La escalera también va con §1.

Por qué las dos: Cake nació como reemplazo de las escaleras, así que algunas salas necesitan que llegue al punto más alto (Scale). **Auto**, que queda para después: Scale cuando el Cake es la única subida hacia la terraza más alta de la sala; Rest en los demás casos. En esta pasada no se construye Auto: solo se cuenta, en las 26 salas de 2+ terrazas, cuántas elegiría cada variante.

## 3. Lego en los sub-niveles (A539, prueba)

Para el 70 % de las salas, que pisan una sola terraza: en una sala Up o Down, la altura de los sub-niveles dentro de la terraza se multiplica por m (m = la terraza base, como en L2'). **La topología no cambia**, porque la regla de subida cuenta sub-niveles y no alturas. Verifícalo por hash, como siempre.

Declara Up en dos salas de una sola terraza con relieve de sub-niveles:
- `perfil_m1` (Ascensión 14, ya existe; pasa a Up);
- otra que elijas tú, de las que tienen más sub-niveles distintos (di cuál y por qué).

## 4. Capturas (lo que [U] mira)

k0/k4/k8, Cam 6, Mid contra el tratamiento:
- u1 con §1;
- u2 con Rest y con Scale;
- las dos salas de §3;
- L1 (Down) con §1.

Ponlas en `shots/lego3/` y, para cada sala, arma **una lámina** con Mid y lego lado a lado. Cam 7 solo en u1.

**Entrega:** las láminas, una tabla de datos (escaleras recortadas, escalones por escalera, anillos por variante, el conteo Auto) y una sección «Pasada 3» en `verticalidad_lego_resultado.md`.

## 5. Carril

- **node:** `test_lego.js` (ampliado: §1, §2, §3 y la topología por hash), `test_vert.js`, `test_modes.js`.
- **UI:** `test_lego_ui.js`.
- **Hashes:** los estados s3 y los 21 de `m2_hashes`, idénticos con Mid.
- Sin `regress`, salvo que toques código compartido: dilo y corre `--sample 1/4`.
- Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` (con #107 y #109 mergeados) y PR. **No mergees: mergea [U].**
