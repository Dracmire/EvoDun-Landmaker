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
