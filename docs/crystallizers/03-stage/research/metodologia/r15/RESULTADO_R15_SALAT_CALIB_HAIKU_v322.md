# RESULTADO · Calibración de jueces Haiku sobre V1 de la sala T (v322)
Regla: PREDICCION_R15_SALAT_v322, Enmienda 1, punto 4. Los mismos 12 pares de V1 (`MAPA_salat_v1.json`). 3 jueces Haiku por tanda, texto por nota con empate. Votos en `VOTOS_salat_haiku_calib.json`.

| Criterio | Haiku | Opus (V1) | Regla | Estado |
|---|---|---|---|---|
| TECHO > SUELO por nota | 7/9 | 9/9 | ≥ 8/9 | FALLA |
| Diferencia de nota TECHO − SUELO | +0,74 | +1,67 | ≥ +1,0 | FALLA |
| Diferencia de nota señuelo − SUELO | +0,33 | 0,00 | ≤ +0,3 | FALLA |

Q11 (Haiku calibra, 60 %): FALLO.

Observación de [R]:
- Dos jueces Haiku avisaron que no lograron saber con seguridad cuál imagen era 1 y cuál 2.
- Otro describió una escalera y pilares en m1, donde no los hay, y una ventana verde en una referencia 0202.

La falla puede ser del instrumento (tres archivos por prueba que Haiku confunde) y no del juicio. Esto es una hipótesis, no está medido.

## Segunda ronda: rúbrica P1–P6 e imagen compuesta (Enmienda 2 de la predicción)
| Criterio | Haiku | Sonnet | Regla |
|---|---|---|---|
| TECHO > SUELO | 8/9 | 9/9 | ≥ 8/9 |
| Diferencia de nota | +0,67 (FALLA) | +1,32 | ≥ +1,0 |
| Señuelo − SUELO | +0,30 | +0,35 (FALLA por 0,05) | ≤ +0,3 |
| Estado | NO CALIBRA | NO CALIBRA | |

- Q12 (Haiku calibra, 50 %): FALLO. Q13 (Sonnet calibra, 65 %): FALLO.
- Ganancia de TECHO sobre SUELO por ítem (Sonnet): P1 línea media +2,44 · P2 marco +1,04 · P3 esquinas +1,89 · P4 fondo −0,48 · P5 marca +3,00 · P6 personaje +0,04.
- Votos: `VOTOS_salat_haiku_rubrica.json`, `VOTOS_salat_sonnet_rubrica.json`.
- Observación de [R]: el señuelo suma en P3 y P5 porque es, literalmente, una masa y una figura en el suelo. La rúbrica mide presencia de piezas y el señuelo es una pieza; la función del señuelo y la del ítem chocan. Se registra; no cambia la regla congelada.
- Por la regla de la Enmienda 2, punto 4, corresponde cerrar la rama R1.5 (decisión de [U]).

## Tercera ronda: SEÑUELO2 con Sonnet (Enmienda 3 de la predicción)
- SEÑUELO2: bloque de 2×2 tiles y 0,5 H en x 10–11, z 35–36, visible en las 9 posiciones (out4 del preparador; hashes ×2 iguales).
- 3 jueces Sonnet × 9 pares. Mapa `MAPA_salat_senuelo2.json` (f28a65b0…).
- Resultado: los 3 jueces dan exactamente la misma nota a SEÑUELO2 y a SUELO en las 27 comparaciones. SEÑUELO2 − SUELO = +0,00 (regla ≤ +0,3): CUMPLE.
- Q14 (cumple, 60 %): ACIERTO. Sonnet queda ADOPTADO como juez, con la rúbrica P1–P6 y la imagen compuesta.

Límites:
- El bloque ocupa 0,3–0,5 % del cuadro. El control prueba que una pieza pequeña sin función no suma; no prueba que una pieza grande sin función no sume.
- La nota absoluta varía mucho entre jueces (entre 1 y 4 en un mismo cuadro). Se decide por la diferencia dentro de cada juez, nunca por el nivel.
