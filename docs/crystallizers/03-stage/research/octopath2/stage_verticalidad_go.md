# Brief para CC · Verticalidad compositiva (T3) y clasificación por partes (T2)

Rama R2. **Lee antes de empezar:**
- `research/octopath2/verticalidad.md`: el patrón de Octopath, las reglas V1–V7, el índice de banda ρ, cómo se aplica a DAC, T3 y la tabla de perfiles v2;
- `research/octopath2/perfiles_forma.md` §5;
- `MODELO_ACTUAL.md` v2.4.

**Roles:** [R] diseñó; tú construyes y mides; [U] juzga mirando. Sin jueces ni rúbricas.

**PRESUPUESTO DE TIEMPO (decisión de [U]): 20 minutos de reloj en total.** Al llegar a 20 minutos, para y entrega lo que tengas, diciendo qué faltó. El último ciclo tomó ~1 hora; eso no es admisible.

## Condición previa

La parte C (re-altura de lo caminable) necesita la decisión **D-V1** de [U] (`verticalidad.md` §4). Si este prompt no dice «D-V1 aprobada», haz solo las partes A y B y aplica V1 únicamente al escenario no caminable.

## Parte A · T2 por partes (solo mide, sin tocar `src/`)

Rehace `tools/perfiles_clasificacion.js`:
- recorre cada sala entrada → núcleo → salidas (A500; el detalle está en `stage_perfiles_mockup_go.md`, Parte A, commit 8ed3b2b);
- córtala en partes (codo, pasillo, área central);
- clasifica cada parte con la **tabla v2** (`verticalidad.md` §6).

**Entrega:** conteo de partes por perfil × tipo DAC; salas unitipo; partes «ninguno» con su ancho. Agrégalo a `perfiles_clasificacion.md` como sección v2, sin borrar la v1.

## Parte B · Índice de banda en lo que ya existe (solo mide)

Mide ρ (Spearman entre la altura del suelo y la profundidad de vista *u*, sobre las baldosas visibles del pick buffer), la altura relativa del héroe (fracción de baldosas visibles por debajo de él) y los oclusores caminables (baldosas caminables más altas que el héroe y delante de él), en k0, k4 y k8 de M1, M2, M3 y C0, **en Cam 6 y en Cam 7**.

**Entrega:** una tabla.

## Parte C · V1–V7 en los mockups M1 y M3 (solo con D-V1)

1. Asigna una familia por parte de sala (`verticalidad.md` §3): M1 (pasillo) = A; M3 (Cake Hub) = A. Familia A: ordena los niveles caminables por su *u* media con la `orient` de la sala y reasígnales altura monótona (V1a). Si la sala tiene una parte alta tipo cima, prueba también B (V1b) en esa parte. Siempre se cumple I1. Usa los pasos de la Base (terraza 1,25 H, `subs` 2). La topología (caminable, regiones, escaleras) queda **idéntica**: verifícalo por hash de `S.walk` / las regiones / las escaleras antes y después.
2. Si la topología obliga a un nivel más alto delante del héroe, prueba la otra orientación. Si tampoco sirve, márcalo como conflicto y no lo fuerces.
3. Escenario no caminable: V2 (caras de frente como muro de 2–3 H), V5 (lados en U ≥ 3 H, el fondo lo más alto) y V6 (frente igual o más bajo, con baranda baja de 1,2 H en el borde si cae). V4: baranda en el borde superior de cada subida. Todo como geometría, con los mecanismos de `planes` y `volumes`, **nunca billboards**.
4. Todo va detrás de un interruptor opcional del modo 3 («Compositional verticality»), apagado por defecto. Apagado, el visor queda byte a byte igual.

**Entrega:**
- capturas k0, k4 y k8 de M1 y M3 con las reglas, en Cam 7 y en Cam 6, junto a las de sin reglas, en `docs/crystallizers/03-stage/shots/verticalidad/`;
- ρ y oclusores antes y después;
- conflictos, si hubo;
- todo en `research/octopath2/verticalidad_resultado.md`.

**Predicción (congelada):** sin reglas, ρ entre −0,2 y 0,2 y algún oclusor caminable. Con las reglas (familia A), ρ ≥ 0,6 y 0 oclusores caminables en k4.

## Reglas del carril (reducido por el presupuesto)

- **node:** `test_planes.js`, `test_modes.js`, más uno nuevo para la re-altura (topología idéntica, V1 monótona).
- **UI:** solo uno nuevo para el interruptor.
- **Tabla de hashes** de los estados apagados, que debe dar idéntica.
- **No corras** `test_window_session_ui` (20 min): si tocas `winExit`, dilo y queda para el pase de cierre. No corras `regress` si el cambio queda protegido por `st.win`.
- Reporta los segundos de cada comando y lo que no corrió.
- Si un test falla dos veces seguidas, PARA y di si el problema está en el código o en el test.
- Rama nueva desde `main` y PR. **No mergees: mergea [U].**
