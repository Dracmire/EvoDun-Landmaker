# R1.5 · Sala de prueba T — predicciones y reglas congeladas — [R], v322, 2026-11-17

Protocolo: `PROTOCOLO_PRUEBAS.md` (v322). Pedido a CC: `stage_r15_salat_base_go.md`. Este archivo se congela con sha256 ANTES de enviar el pedido; después solo se añaden enmiendas al final.

## 1. Juez (V1.2, V1.3, pruebas y V2)
- 3 subagentes nuevos sin contexto, tandas de ≤ 9, orden y nombres al azar. El mapa con sha256 se abre tras los votos.
- Referencia por grupo: s → 0202 (c_bc55); m y n → 0137 (c_1320).
- Texto exacto (el de P1 + la nota absoluta, C6):
  «La imagen R es una referencia. Las imágenes 1 y 2 son maquetas sin texturas. ¿Cuál de las dos, 1 o 2, se parece más a R en COMPOSICIÓN: qué se ve en cada franja de profundidad, qué tapa a qué, qué tan lejos se ve y dónde queda el personaje? Ignora color, luz, texturas y detalle. Responde 1 o 2 y una línea con la razón. Después da a cada maqueta una nota de 1 a 5 de parecido con R en composición (1 = nada, 5 = casi igual).»
- Gana el estado elegido por ≥ 2 de 3 jueces. La nota de un estado en una posición es la media de los 3 jueces.

## 2. Verificación 1 (puerta; si falla una, no se corren pruebas)
- V1.1: hashes ×2 iguales; la referencia de cada grupo según §1.
- V1.2: TECHO gana a SUELO en ≥ 8 de 9 posiciones, y la nota media de TECHO supera a la de SUELO en ≥ 1,0.
- V1.3: el señuelo (PLACEBO) gana a SUELO en ≤ 4 de 9.
- V1.4 / V1.5 / V1.6: como en el pedido (§4). Deben entrar ≥ 2 trucos.

## 3. Pruebas y decisión (solo si V1 cumple)
- Por cada truco que entró: TECHO contra TECHO − X en sus posiciones propias con PRESENTE.
- Cada tanda lleva tres controles mezclados: TECHO contra SUELO, PLACEBO contra SUELO y un par repetido.
- V2: los controles dan lo mismo que en V1; el par repetido recibe el mismo voto de ≥ 2 de 3 jueces; las puertas se re-miden (± 0,02). Si V2 falla, la tanda es INVÁLIDA y se repite una vez con jueces nuevos.
- **Aporta:** TECHO gana a TECHO − X en ≥ 2/3 de las posiciones de X. **No aporta:** lo contrario. **No probado:** X no entró en V1.4.
- Auditoría de razones (no decide): cuántas razones nombran una sola pieza y cuántas nombran franjas o planos.

## 4. Predicciones (firma de [R])
| # | Predicción | Probabilidad |
|---|---|---|
| Q1 | V1.2 cumple (TECHO ≥ 8/9 y ≥ +1,0 de nota) | 65 % |
| Q2 | V1.3 cumple (señuelo ≤ 4/9) | 55 % |
| Q3 | Entran ≥ 5 de los 7 trucos en V1.4 | 60 % |
| Q4 | A6 aporta | 60 % |
| Q5 | A3a aporta | 60 % |
| Q6 | A3b aporta | 45 % |
| Q7 | A4 aporta | 55 % |
| Q8 | C3 aporta | 45 % |
| Q9 | C2 aporta | 50 % |
| Q10 | B3 aporta | 35 % |

Razones breves de la firma:
- **Q1:** la sala trae los rasgos de las dos tomas, pero es sintética y sin texturas. Los jueces de la pasada dijeron que las maquetas «no se parecen mucho», así que la distancia absoluta puede seguir corta.
- **Q2:** en la pasada, el panel fuera de su sitio perdió 2 de 3 (t3062). Eso indica que el juez no es solo un lector de objetos, pero tampoco lo descarta.

## 5. Límites
- Sala sintética de diseño propio: prueba qué trucos sostienen el parecido, no que el generador los produzca.
- Jueces del mismo modelo.
- La nota absoluta es nueva.
- Las referencias son de otro juego.

## Enmienda 1 ([R], 2026-11-17, decisión de [U] tras la Verificación 1)
Motivo: en V1 el voto de par premió al señuelo (3/3) con la nota idéntica a SUELO (2,33 contra 2,33), y las puertas de pantalla excluyeron piezas que los jueces sí nombran (RESULTADO_R15_SALAT_V1_v322).

1. **Juez por nota, con empate.** Texto nuevo, exacto:
   «La imagen R es una referencia. Las imágenes 1 y 2 son maquetas sin texturas. Da a cada maqueta una nota de 1 a 5 de parecido con R en COMPOSICIÓN: qué se ve en cada franja de profundidad, qué tapa a qué, qué tan lejos se ve y dónde queda el personaje (1 = nada, 5 = casi igual). Ignora color, luz, texturas y detalle. Después responde 1, 2 o 0 (0 = empate) y una línea con la razón.»
2. **Decisión.** Un truco APORTA si la nota media de TECHO, menos la de TECHO − X, es ≥ 0,5 sobre sus posiciones declaradas. Es NEUTRO entre −0,5 y +0,5, y ESTORBA si es ≤ −0,5. El voto 1/2/0 se informa, pero no decide.
3. **La puerta es descriptiva.** Se prueban los 7 trucos en sus posiciones declaradas (Enmienda 3 del pedido). Sus cifras de puerta se guardan junto al resultado.
4. **Jueces Haiku, con calibración previa.** Se calibran sobre los 12 pares de V1 (`MAPA_salat_v1.json`). Cumplen si:
   - TECHO gana a SUELO en ≥ 8/9 posiciones, con nota ≥ +1,0;
   - en los 3 pares del señuelo, la nota del señuelo menos la de SUELO es ≤ +0,3.

   Si cumplen, Haiku queda adoptado. Si no, se informa y decide [U].
5. **Control del señuelo en las pruebas.** Un señuelo visible en las 9 posiciones; su nota debe quedar ≤ +0,3 sobre SUELO.
6. Tandas de ≤ 9 pares por juez. 3 jueces nuevos sin contexto por tanda.

Predicción nueva (firma de [R]):
- Q11: Haiku calibra: 60 %.
- Las Q4–Q10 se mantienen, ahora leídas con la regla del punto 2.

## Enmienda 2 ([R], 2026-11-17, decisión de [U] tras fallar la calibración Haiku)
1. **Una imagen por prueba.** R, 1 y 2 van lado a lado en un solo PNG, con su rótulo grande encima.
2. **Juez con preguntas medibles (rúbrica comparativa).** Cada ítem recibe un número del 1 al 5 por maqueta, siempre comparado con R:
   - 1 = no está;
   - 3 = está, pero en otro lugar o tamaño;
   - 5 = está como en R.

   Ítems:
   - P1 línea media: una línea horizontal continua (baranda, pretil o borde) que cruza la franja media;
   - P2 marco lateral: masas altas en los bordes, o un par que enmarca al personaje;
   - P3 esquinas bajas: masas bajas que cortan las esquinas inferiores;
   - P4 fondo: el centro abierto hasta un fondo lejano;
   - P5 marca: una figura en el suelo junto al personaje;
   - P6 personaje: el mismo lugar y tamaño en el cuadro.

   Salida: solo JSON. La nota de una maqueta = la media de P1–P6.
3. Los criterios de calibración (Enmienda 1, punto 4) se aplican a esa nota sin cambios.
4. **Orden.** Primero Haiku. Si no calibra, Sonnet con la misma rúbrica. Si tampoco calibra, la rama R1.5 se cierra (decisión de [U]).

Firmas:
- Q12: Haiku calibra con la rúbrica: 50 %.
- Q13: Sonnet calibra (si llega a correr): 65 %.

## Enmienda 3 ([R], 2026-11-17, última calibración, decisión de [U])
El señuelo anterior (una mancha en el suelo y un panel) coincidía con los ítems P5 y P3 de la rúbrica. El señuelo nuevo (SEÑUELO2) no lo cuenta ningún ítem:
- un bloque bajo de 2×2 tiles y 0,5 H, sobre suelo transitable no tocado por el camino;
- lejos de los bordes laterales y de las esquinas inferiores del cuadro;
- a ≥ 4 tiles del personaje y fuera del eje;
- visible en las 9 posiciones.

Calibración: solo Sonnet, con la misma rúbrica y la misma imagen compuesta, sobre 9 pares SEÑUELO2 contra SUELO. Cumple si la nota de SEÑUELO2 menos la de SUELO es ≤ +0,3. TECHO contra SUELO ya cumplió con Sonnet (9/9, +1,32), y no se repite.
- Si cumple: Sonnet queda adoptado como juez y se pasa al quita-uno.
- Si no: se cierra R1.5.

Firma Q14 (cumple): 60 %.

## Enmienda 4 ([R], 2026-11-17, último intento, decisión de [U])
Se juzgan 5 trucos al azar con quita-uno, en una posición al azar cada uno. Juez: Sonnet calibrado (rúbrica P1–P6, imagen compuesta), 3 jueces.

- **Sorteo** (semilla 20261117): primero 5 trucos entre los 6 con algún TECHO − X distinto de TECHO; A4b queda fuera porque su TECHO − X es idéntico en todas las posiciones. Después, una posición al azar entre las propias no idénticas de cada truco.
- **Imágenes:** los PNG de `out3`. La Verificación 2 de CC los reprodujo con hash IGUAL.
- **Controles en la misma tanda:**
  - TECHO contra SUELO: TECHO debe quedar ≥ +0,5;
  - SEÑUELO2 contra SUELO: ≤ +0,3;
  - un par de prueba repetido con los lados invertidos: misma dirección en ≥ 2 de 3 jueces.

  Si un control falla, la tanda es inválida.
- **Decisión por truco:** APORTA si la nota de TECHO menos la de TECHO − X es ≥ +0,5.
- **Cierre:** si ninguno de los 5 aporta, se cierra R1.5.
- **Firma Q15** (al menos 1 de 5 aporta): 65 %.
- **Nota de V2** (CC): con píxeles pintados en vez de huella, C3 bajaría a 3/9 PRESENTE. La puerta es descriptiva, así que no excluye; se registra.

## Enmienda 5 ([R], 2026-11-17, grupo B, decisión de [U])
- **Probados, aparte.** A1, A6 (como línea), C3 y C2 quedan fuera de la investigación automática. Los juzga [U].
- **Grupo B:** A3a, A3b, A4 y B3. Los construye solo CC (`stage_r15_salat_grupoB_go.md`).
- **Juicio:** Sonnet calibrado (rúbrica P1–P6, imagen compuesta), 3 jueces de solo lectura. Se juzga TECHO′ contra TECHO′ − X en TODAS las posiciones donde X está PRESENTE.
- **Controles en cada tanda:** TECHO′ contra SUELO (≥ +0,5); SEÑUELO2 contra SUELO (≤ +0,3); un par repetido con los lados invertidos.
- **Decisión:** APORTA si la media de la diferencia es ≥ +0,5. Un truco NO CONSTRUIBLE no se juzga.

Firmas:
- Q16, A3a aporta: 55 %.
- Q17, A3b aporta: 45 %.
- Q18, A4 aporta: 50 %.
- Q19, B3 aporta: 35 %.
