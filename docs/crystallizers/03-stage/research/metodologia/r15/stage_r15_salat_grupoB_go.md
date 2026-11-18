# Pedido a CC · R1.5 · Sala T: grupo B de trucos (A3a, A3b, A4, B3) (v322)

Protocolo: `PROTOCOLO_PRUEBAS.md`. Fichas: `INFORME_METODO_TRUCOS.md` §4, con los ajustes de `PREDICCION_R15_PASADA_v321.md` §2. Predicciones: `PREDICCION_R15_SALAT_v322.md`, Enmienda 5 (congelada antes de este pedido; NO la leas).

TU PAPEL: eres el ÚNICO que construye trucos (regla de [U], A407). Construyes, renderizas y mides. No juzgas composición.

## 0. Base (no se toca)
- Arnés y configuración del preparador: `docs/crystallizers/03-stage/research/metodologia/harness_salat/` (README), con `scratch/tuned.json`. Es la sala T de la Enmienda 3 del pedido base: cierre de 8 H, encuadre por grupo y pretil sur.
- SUELO y SEÑUELO2 no se tocan: se usan los PNG de la V2 / out4.
- TECHO actual = el de `tuned.json`. Los trucos ya probados (A6, C3, C2) quedan como están.

## 1. Qué construyes
Rehaces las 4 piezas del grupo B que la auditoría encontró mal construidas (A408). Cada una debe cumplir su puerta visual (campo 4 de su ficha) en sus posiciones declaradas:

| Truco | Grupos | Falla de antes | Lo que se pide |
|---|---|---|---|
| A3a columna suelta | m, n | quedaba pegada al muro lateral y se fundía; visible solo en n3 | una columna 2×2 que sale por arriba, con ≥ 0,02 del ancho de separación de cualquier masa a ± 2 tiles de profundidad, en la franja lateral; un solo lado |
| A3b masa de esquina | s, n | apenas asomaba un borde (ancho 0,045) | toca el borde inferior; ancho 0,10–0,20, alto aparente 0,25–0,60, x en [0; 0,35] o [0,65; 1]; un solo lado, opuesto a A3a |
| A4 vano | m, n | nunca se dibujó | una abertura luminosa en el muro norte, cerca del eje: ancho 0,08–0,16, alto 0,10–0,20, centro y ≤ 0,25, luminancia ≥ 2× la del muro, por detrás de todo, y SIN fondo vacío nuevo (si recortas el muro, pon un plano detrás). La técnica la eliges tú, sin `src/` |
| B3 altura fingida | s | caja de aislamiento mal puesta | la isla sube 1,5 H con la cara superior en otro tono; la caja de medida debe coincidir con la isla |

- Una sola colocación en el mundo por truco. Máximo 6 iteraciones por truco.
- No cambias la máscara, el camino, la meta ni los rangos de las puertas.
- Si un truco no pasa su puerta en ≥ 2/3 de sus posiciones declaradas, queda NO CONSTRUIBLE, con su cifra.

## 2. Qué renderizas
- TECHO′ = TECHO con las 4 piezas rehechas.
- TECHO′ − X para cada X del grupo B, en sus posiciones declaradas.
- Controles en todos los estados: máscara, camino y meta; nada sobre el camino; billboards + rojo ≤ 30 %; héroe tapado ≤ 25 %; fondo vacío ≤ 2 %.
- Aislamiento: el diff de TECHO′ contra TECHO′ − X cae dentro de la caja de X + 0,02.
- Hashes ×2.

## 3. Entrega
- PNG de 1280×720: `TECHOp_<pos>.png` y `TECHOp-<X>_<pos>.png`.
- `presencia_grupoB.txt`: la puerta por truco y posición, PRESENTE con cifras o AUSENTE con la cifra que falla.
- `medidas_grupoB.txt`: controles, aislamiento, parámetros finales e iteraciones.
- `SHA256SUMS` y un zip.
- Ningún juicio.

## 4. PARADAS
Paras y avisas si pasa cualquiera de estas cosas:
- algo exige tocar `src/`;
- un control de SUELO cambia;
- el mismo problema falla dos veces seguidas.
