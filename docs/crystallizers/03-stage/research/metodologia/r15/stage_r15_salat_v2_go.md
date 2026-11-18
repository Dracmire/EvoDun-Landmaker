# Pedido a CC · R1.5 · Sala T: Verificación 2 independiente (v322)

Protocolo: `PROTOCOLO_PRUEBAS.md` §1.6. Antes de este pedido: el preparador (un subagente) construyó la sala T y midió la Verificación 1, y los jueces ciegos ya votaron.

TU PAPEL: verificador independiente. Reproduces y vuelves a medir con tu propia ejecución. No juzgas composición, no escribes «se parece» y no corriges nada a mano.

## 0. Entorno
- Árbol congelado `e882c5c` del visor, en un worktree aparte. Sin tocar `src/`.
- Arnés del preparador: `docs/crystallizers/03-stage/research/metodologia/harness_salat/` (rama `docs/stage-metodologia-v319`, PR #93). Se usa tal cual. Si necesita un cambio para correr en tu entorno, dilo y muestra el diff.
- Entrega del preparador para comparar: el zip `salat_v1.zip` y su `SHA256SUMS`, que [U] adjunta con este pedido.

## 1. Qué haces
1. **Reproducción (V2.4).** Renderiza con el arnés todos los PNG de la entrega: SUELO, TECHO, PLACEBO y TECHO − X, en sus posiciones. Hazlo dos veces. Compara tus hashes con los del `SHA256SUMS` del preparador.
2. **Puertas (V2.3).** Vuelve a medir la puerta de presencia de cada truco que ENTRÓ, en cada posición donde se juzga. Compara con el `presencia.txt` del preparador. Toda diferencia > 0,02 se informa.
3. **Controles.** En todos los estados vuelve a medir:
   - máscara, camino y meta;
   - billboards + rojo;
   - héroe tapado;
   - fondo vacío;
   - las piezas cortadas por el corte del lado de cámara.

   Compara con `medidas_v1.txt`.
4. **Aislamiento.** Para cada truco que entró, el % del diff TECHO contra TECHO − X que cae fuera de la caja de X más 0,02. Compara con el del preparador.

## 2. Entrega
- `v2_hashes.txt`: hash tuyo ×2 contra hash del preparador, por archivo, con IGUAL / DISTINTO.
- `v2_medidas.txt`: tabla preparador contra tuyo, por truco, posición y control, con la diferencia y OK / FUERA (> 0,02).
- `SHA256SUMS` y un zip.
- Ningún juicio.

## 3. PARADAS
Paras y avisas si pasa cualquiera de estas cosas:
- el arnés no corre sin tocar `src/`;
- más de la mitad de los hashes salen DISTINTOS. En ese caso, antes de seguir, di qué parte del render difiere: fuentes, antialiasing o geometría.

## Enmienda 1 ([R], 2026-11-17)
El arnés y la entrega del preparador ya están en la rama `docs/stage-metodologia-v319` (commit `b4ad7bb`), en `docs/crystallizers/03-stage/research/metodologia/harness_salat/`. Su README dice las rutas fijas y el orden de ejecución: `run3.js` y después `write3.js`.

No hay zip adjunto. La referencia está en el repo:
- `harness_salat/entrega_out3/SHA256SUMS`: los 68 PNG;
- `presencia.txt` y `medidas_v1.txt`;
- `harness_salat/scratch/results3.json`.

Se verifica la entrega de la Enmienda 3 del preparador. Tu `salaT_v1.zip` anterior NO se usa: es anterior a la Enmienda 3 y no sería independiente.
